import {
  ClaimResult,
  IdempotencyStore,
  StoredResponse,
} from '../../application/ports/IdempotencyStore';
import { RedisClient } from './client';

const PENDING = '__pending__';

export class RedisIdempotencyStore implements IdempotencyStore {
  constructor(private readonly redis: RedisClient) {}

  async claim(key: string, pendingTtlSeconds: number): Promise<ClaimResult> {
    // Atomically reserve the key with a pending marker if we're first.
    const set = await this.redis.set(key, PENDING, { NX: true, EX: pendingTtlSeconds });
    if (set === 'OK') {
      return { kind: 'claimed' };
    }
    const existing = await this.redis.get(key);
    if (existing === null || existing === PENDING) {
      return { kind: 'pending' };
    }
    return { kind: 'replay', response: JSON.parse(existing) as StoredResponse };
  }

  async save(key: string, response: StoredResponse, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(response), { EX: ttlSeconds });
  }

  async discard(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
