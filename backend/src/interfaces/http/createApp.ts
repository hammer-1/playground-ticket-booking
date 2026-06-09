import express, { Express, RequestHandler } from 'express';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { AuthController } from './controllers/AuthController';
import { PitchController } from './controllers/PitchController';
import { BookingController } from './controllers/BookingController';
import { errorHandler } from './middleware/errorHandler';
import { logger } from '../../config/logger';
import './types';

export interface HttpDeps {
  corsOrigins: string[];
  authMiddleware: RequestHandler;
  idempotency: RequestHandler;
  authController: AuthController;
  pitchController: PitchController;
  bookingController: BookingController;
}

/**
 * Builds the Express app from injected controllers/middleware. Routes mirror the
 * API contract in docs/phases (auth here; pitches/slots/bookings added in later phases).
 */
export function createApp(deps: HttpDeps): Express {
  const app = express();

  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));
  app.use(cors({ origin: deps.corsOrigins, credentials: true }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // ── Auth ──────────────────────────────────────────────────────────────
  app.post('/auth/register', deps.authController.register);
  app.post('/auth/login', deps.authController.login);
  app.post('/auth/logout', deps.authMiddleware, deps.authController.logout);

  // ── Pitches & slots ───────────────────────────────────────────────────
  app.get('/pitches', deps.pitchController.list);
  app.get('/slots', deps.authMiddleware, deps.pitchController.slots);

  // ── Bookings ──────────────────────────────────────────────────────────
  app.post('/reserve-slot', deps.authMiddleware, deps.bookingController.reserve);
  app.post('/release-slot', deps.authMiddleware, deps.bookingController.release);
  app.post(
    '/confirm-booking',
    deps.authMiddleware,
    deps.idempotency,
    deps.bookingController.confirm,
  );
  app.get('/my-bookings', deps.authMiddleware, deps.bookingController.myBookings);

  // Error handler must be registered last.
  app.use(errorHandler);
  return app;
}
