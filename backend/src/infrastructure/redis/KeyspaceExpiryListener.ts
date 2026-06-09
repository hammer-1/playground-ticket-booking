import { RealtimeNotifier } from '../../application/ports/RealtimeNotifier';
import { logger } from '../../config/logger';
import { RedisClient } from './client';
import { parseReservationKey } from './reservationKey';

/**
 * Bridges Redis key-expiry to the realtime layer. When a `reservation:*` key's TTL
 * lapses, Redis fires a keyspace `expired` event and we push `slot:released`.
 *
 * IMPORTANT: this is a best-effort push, NOT the source of truth. Expiry events can be
 * delayed or missed (fire-and-forget pub/sub). Correctness comes from the key being gone
 * on the next availability read; this listener only makes the UI update promptly.
 * See docs/research-notes.md §2.
 */
export class KeyspaceExpiryListener {
  // db 0 matches the default Redis database used by our REDIS_URL.
  private readonly channel = '__keyevent@0__:expired';

  constructor(
    private readonly subscriber: RedisClient,
    private readonly notifier: RealtimeNotifier,
  ) {}

  async start(): Promise<void> {
    await this.subscriber.subscribe(this.channel, (expiredKey: string) => {
      const parsed = parseReservationKey(expiredKey);
      if (!parsed) {
        return; // not one of our reservation keys
      }
      logger.debug({ key: expiredKey }, 'reservation expired → slot:released');
      this.notifier.slotReleased(parsed.pitchId, parsed.date, parsed.startHour);
    });
    logger.info('keyspace expiry listener subscribed');
  }
}
