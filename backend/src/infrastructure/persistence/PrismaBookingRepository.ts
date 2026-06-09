import { PrismaClient } from '@prisma/client';
import { Booking } from '../../domain/entities/Booking';
import { BookingStatus } from '../../domain/value-objects/BookingStatus';
import { TimeSlot } from '../../domain/value-objects/TimeSlot';
import { AuthenticationError, SlotUnavailableError } from '../../domain/errors/DomainError';
import {
  BookingRepository,
  NewConfirmedBooking,
} from '../../application/ports/BookingRepository';
import { fromDbDate, toDbDate } from './dates';

const UNIQUE_VIOLATION = 'P2002'; // duplicate key — the slot's unique index fired
const FK_VIOLATION = 'P2003'; // referenced user/pitch row is missing

interface BookingRow {
  id: string;
  userId: string;
  pitchId: string;
  bookingDate: Date;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: Date;
}

function toBooking(row: BookingRow): Booking {
  return new Booking(
    row.id,
    row.userId,
    row.pitchId,
    fromDbDate(row.bookingDate),
    TimeSlot.fromStartTime(row.startTime),
    row.status as BookingStatus,
    row.createdAt,
  );
}

export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findConfirmedByPitchAndDate(pitchId: string, date: string): Promise<Booking[]> {
    const rows = await this.prisma.booking.findMany({
      where: { pitchId, bookingDate: toDbDate(date), status: 'confirmed' },
      orderBy: { startTime: 'asc' },
    });
    return rows.map(toBooking);
  }

  async findByUser(userId: string): Promise<Booking[]> {
    const rows = await this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toBooking);
  }

  /**
   * Concurrency-safe confirmation (MySQL). Three guarantees stack:
   *   1. GET_LOCK(slotKey) serialises concurrent confirmations for THIS slot on the
   *      transaction's single connection, making the check-then-insert atomic. It is
   *      released explicitly in `finally`.
   *   2. The existence check rejects an already-confirmed slot cleanly.
   *   3. The composite unique index (pitch, date, start_time, status) is the enforced
   *      backstop — even a caller that bypassed the lock cannot insert a second
   *      confirmed row; we translate the unique violation (P2002) to a domain error.
   */
  async createConfirmed(input: NewConfirmedBooking): Promise<Booking> {
    const slot = TimeSlot.fromStartHour(input.startHour);
    const bookingDate = toDbDate(input.bookingDate);
    // MySQL lock names are capped at 64 chars.
    const lockName = `slot:${input.pitchId}:${input.bookingDate}:${input.startHour}`.slice(0, 64);

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // Acquire the per-slot lock, waiting up to 10s. GET_LOCK returns 1 on success,
          // 0 on timeout, NULL on error — anything but 1 means we didn't get exclusive
          // access, so treat the slot as contended rather than pressing on.
          const rows = await tx.$queryRaw<Array<{ got: number | bigint | null }>>`
            SELECT GET_LOCK(${lockName}, 10) AS got`;
          if (Number(rows[0]?.got ?? 0) !== 1) {
            throw new SlotUnavailableError();
          }
          try {
            const existing = await tx.booking.findFirst({
              where: {
                pitchId: input.pitchId,
                bookingDate,
                startTime: slot.startTime,
                status: 'confirmed',
              },
            });
            if (existing) {
              throw new SlotUnavailableError();
            }
            const row = await tx.booking.create({
              data: {
                userId: input.userId,
                pitchId: input.pitchId,
                bookingDate,
                startTime: slot.startTime,
                endTime: slot.endTime,
                status: 'confirmed',
              },
            });
            return toBooking(row);
          } finally {
            await tx.$queryRaw`SELECT RELEASE_LOCK(${lockName})`;
          }
        },
        // The transaction timeout must exceed the GET_LOCK wait (10s) above, or a
        // contended lock would trip Prisma's default 5s timeout and surface as a raw
        // 500 instead of a clean "slot taken". maxWait covers pool-acquisition under load.
        { timeout: 15000, maxWait: 5000 },
      );
    } catch (err) {
      // Read the Prisma error code by duck-typing rather than `instanceof`: if two copies
      // of @prisma/client are ever loaded, an instanceof check silently fails and a known
      // DB error would leak out as a raw 500.
      const code = (err as { code?: unknown })?.code;
      if (code === UNIQUE_VIOLATION) {
        // The unique index caught a duplicate confirmed booking — slot is taken.
        throw new SlotUnavailableError();
      }
      if (code === FK_VIOLATION) {
        // The user_id (or pitch_id) being inserted has no matching row — almost always a
        // token left over from a reset database. Surface a clean 401 so the client signs
        // in again, instead of a 500.
        throw new AuthenticationError('Your session is no longer valid. Please sign in again.');
      }
      throw err;
    }
  }
}
