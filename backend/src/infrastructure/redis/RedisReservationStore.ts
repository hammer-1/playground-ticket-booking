import { ReservationStore } from '../../application/ports/ReservationStore';
import { RedisClient } from './client';
import { parseReservationKey, RESERVATION_PREFIX, reservationKey } from './reservationKey';

/**
 * Redis-backed temporary holds. A reservation is a key with a TTL; expiry is handled
 * by Redis itself (no sweeper). `SET NX EX` makes claiming atomic — exactly one caller
 * can win a contested slot. See docs/phases/phase-06-reservation-expiry.md.
 */
export class RedisReservationStore implements ReservationStore {
  constructor(private readonly redis: RedisClient) {}

  async reserve(
    pitchId: string,
    date: string,
    startHour: number,
    userId: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const result = await this.redis.set(reservationKey(pitchId, date, startHour), userId, {
      NX: true,
      EX: ttlSeconds,
    });
    return result === 'OK';
  }

  async ownerOf(pitchId: string, date: string, startHour: number): Promise<string | null> {
    return this.redis.get(reservationKey(pitchId, date, startHour));
  }

  async release(pitchId: string, date: string, startHour: number): Promise<void> {
    await this.redis.del(reservationKey(pitchId, date, startHour));
  }

  async activeStartHours(pitchId: string, date: string): Promise<number[]> {
    const pattern = `${RESERVATION_PREFIX}:${pitchId}:${date}:*`;
    const hours: number[] = [];
    for await (const key of this.redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      const parsed = parseReservationKey(typeof key === 'string' ? key : String(key));
      if (parsed) {
        hours.push(parsed.startHour);
      }
    }
    return hours;
  }
}
