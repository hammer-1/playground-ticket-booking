import { createServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { loadConfig } from './config/env';
import { logger } from './config/logger';
import { createPrismaClient } from './infrastructure/persistence/prisma';
import { PrismaUserRepository } from './infrastructure/persistence/PrismaUserRepository';
import { PrismaPitchRepository } from './infrastructure/persistence/PrismaPitchRepository';
import { PrismaBookingRepository } from './infrastructure/persistence/PrismaBookingRepository';
import { createRedisClient } from './infrastructure/redis/client';
import { RedisReservationStore } from './infrastructure/redis/RedisReservationStore';
import { RedisIdempotencyStore } from './infrastructure/redis/RedisIdempotencyStore';
import { KeyspaceExpiryListener } from './infrastructure/redis/KeyspaceExpiryListener';
import { SocketRealtimeNotifier } from './infrastructure/realtime/SocketRealtimeNotifier';
import { SystemClock } from './infrastructure/SystemClock';
import { BcryptPasswordHasher } from './infrastructure/security/BcryptPasswordHasher';
import { JwtTokenService } from './infrastructure/security/JwtTokenService';
import { RegisterUser } from './application/use-cases/auth/RegisterUser';
import { LoginUser } from './application/use-cases/auth/LoginUser';
import { ListPitches } from './application/use-cases/pitches/ListPitches';
import { GetSlots } from './application/use-cases/slots/GetSlots';
import { ReserveSlot } from './application/use-cases/booking/ReserveSlot';
import { ReleaseReservation } from './application/use-cases/booking/ReleaseReservation';
import { ConfirmBooking } from './application/use-cases/booking/ConfirmBooking';
import { ListMyBookings } from './application/use-cases/booking/ListMyBookings';
import { AuthController } from './interfaces/http/controllers/AuthController';
import { PitchController } from './interfaces/http/controllers/PitchController';
import { BookingController } from './interfaces/http/controllers/BookingController';
import { makeAuthMiddleware } from './interfaces/http/middleware/authMiddleware';
import { makeIdempotency } from './interfaces/http/middleware/idempotency';
import { createApp } from './interfaces/http/createApp';
import { setupSocket } from './interfaces/socket/setupSocket';

/**
 * Composition root: the one place that knows about concrete implementations. It
 * instantiates adapters and injects them into use cases and the HTTP + socket layers.
 */
async function bootstrap(): Promise<void> {
  const config = loadConfig();

  // ── Infrastructure ────────────────────────────────────────────────────
  // Schema is applied by `prisma migrate deploy` (run before the server starts —
  // see docker-compose backend command / `npm run migrate`).
  const prisma = createPrismaClient();
  const redis = await createRedisClient(config.redisUrl);
  // Ensure expiry keyspace events are on even if the Redis server wasn't started with
  // --notify-keyspace-events Ex (defensive; compose already sets it).
  await redis.configSet('notify-keyspace-events', 'Ex').catch(() => undefined);

  const tokenService = new JwtTokenService(config.jwtSecret, config.jwtExpiresIn);

  // ── Socket.io with the Redis adapter (scales across instances) ─────────
  const io = new SocketServer({
    cors: { origin: config.corsOrigins, credentials: true },
  });
  const socketPub = redis.duplicate();
  const socketSub = redis.duplicate();
  await Promise.all([socketPub.connect(), socketSub.connect()]);
  io.adapter(createAdapter(socketPub, socketSub));
  setupSocket(io, tokenService);

  // ── Adapters (implement application ports) ─────────────────────────────
  const userRepository = new PrismaUserRepository(prisma);
  const pitchRepository = new PrismaPitchRepository(prisma);
  const bookingRepository = new PrismaBookingRepository(prisma);
  const reservationStore = new RedisReservationStore(redis);
  const idempotencyStore = new RedisIdempotencyStore(redis);
  const realtimeNotifier = new SocketRealtimeNotifier(io);
  const clock = new SystemClock();
  const passwordHasher = new BcryptPasswordHasher();

  // React to reservation TTL expiry on a dedicated subscriber connection, pushing
  // slot:released to the affected room.
  const expirySubscriber = redis.duplicate();
  await expirySubscriber.connect();
  const expiryListener = new KeyspaceExpiryListener(expirySubscriber, realtimeNotifier);
  await expiryListener.start();

  // ── Use cases ─────────────────────────────────────────────────────────
  const registerUser = new RegisterUser(userRepository, passwordHasher, tokenService);
  const loginUser = new LoginUser(userRepository, passwordHasher, tokenService);
  const listPitches = new ListPitches(pitchRepository);
  const getSlots = new GetSlots(pitchRepository, bookingRepository, reservationStore);
  const reserveSlot = new ReserveSlot(
    bookingRepository,
    reservationStore,
    realtimeNotifier,
    clock,
    config.reservationTtlSeconds,
  );
  const releaseReservation = new ReleaseReservation(reservationStore, realtimeNotifier);
  const confirmBooking = new ConfirmBooking(bookingRepository, reservationStore, realtimeNotifier);
  const listMyBookings = new ListMyBookings(bookingRepository);

  // ── Interface layer ───────────────────────────────────────────────────
  const app = createApp({
    corsOrigins: config.corsOrigins,
    authMiddleware: makeAuthMiddleware(tokenService),
    idempotency: makeIdempotency(idempotencyStore),
    authController: new AuthController(registerUser, loginUser),
    pitchController: new PitchController(listPitches, getSlots),
    bookingController: new BookingController(
      reserveSlot,
      releaseReservation,
      confirmBooking,
      listMyBookings,
    ),
  });

  const httpServer = createServer(app);
  io.attach(httpServer);

  httpServer.listen(config.port, () => {
    logger.info(`HTTP + WebSocket server listening on http://localhost:${config.port}`);
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down`);
    io.close();
    httpServer.close();
    await Promise.allSettled([
      redis.quit(),
      socketPub.quit(),
      socketSub.quit(),
      expirySubscriber.quit(),
      prisma.$disconnect(),
    ]);
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
