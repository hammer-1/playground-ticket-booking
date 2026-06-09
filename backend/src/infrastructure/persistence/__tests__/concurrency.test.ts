import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { seed } from '../seed';
import { toDbDate } from '../dates';
import { PrismaBookingRepository } from '../PrismaBookingRepository';
import { SlotUnavailableError } from '../../../domain/errors/DomainError';

/**
 * The core deliverable: under simultaneous confirmations of the SAME slot, exactly one
 * must succeed. Exercises GET_LOCK + the composite unique index in
 * PrismaBookingRepository.createConfirmed against a real MySQL.
 *
 * Requires Docker Compose MySQL to be up and reachable. Override the connection with
 * TEST_DATABASE_URL if needed.
 */
const TEST_URL =
  process.env.TEST_DATABASE_URL ?? 'mysql://root:root@127.0.0.1:3306/pitch_booking';

describe('booking concurrency', () => {
  const prisma = new PrismaClient({ datasources: { db: { url: TEST_URL } } });
  let repo: PrismaBookingRepository;
  let userId: string;
  let pitchId: string;

  const DATE = '2099-01-01';
  const START_HOUR = 10;
  const PARALLEL = 12;

  beforeAll(async () => {
    await seed(prisma);

    const user = await prisma.user.upsert({
      where: { email: 'concurrency-test@example.com' },
      update: {},
      create: {
        name: 'Concurrency Tester',
        email: 'concurrency-test@example.com',
        passwordHash: 'x',
      },
    });
    userId = user.id;

    const pitch = await prisma.pitch.findFirstOrThrow();
    pitchId = pitch.id;

    await prisma.booking.deleteMany({
      where: { pitchId, bookingDate: toDbDate(DATE), startTime: '10:00' },
    });

    repo = new PrismaBookingRepository(prisma);
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({
      where: { pitchId, bookingDate: toDbDate(DATE), startTime: '10:00' },
    });
    await prisma.$disconnect();
  });

  it('allows exactly one of many simultaneous confirmations', async () => {
    const attempts = Array.from({ length: PARALLEL }, () =>
      repo.createConfirmed({ userId, pitchId, bookingDate: DATE, startHour: START_HOUR }),
    );

    const results = await Promise.allSettled(attempts);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(PARALLEL - 1);

    for (const r of rejected) {
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(SlotUnavailableError);
    }

    const count = await prisma.booking.count({
      where: { pitchId, bookingDate: toDbDate(DATE), startTime: '10:00', status: 'confirmed' },
    });
    expect(count).toBe(1);
  });
});
