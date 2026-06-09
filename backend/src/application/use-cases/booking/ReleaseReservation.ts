import { ReservationStore } from '../../ports/ReservationStore';
import { RealtimeNotifier } from '../../ports/RealtimeNotifier';

export interface ReleaseReservationInput {
  userId: string;
  pitchId: string;
  date: string;
  startHour: number;
}

/**
 * Lets a user voluntarily drop a hold they placed, before it expires — so they can pick a
 * different slot without waiting out the TTL. Idempotent and ownership-checked: releasing a
 * slot you don't hold (someone else's, or already gone) is a safe no-op.
 */
export class ReleaseReservation {
  constructor(
    private readonly reservations: ReservationStore,
    private readonly notifier: RealtimeNotifier,
  ) {}

  async execute({ userId, pitchId, date, startHour }: ReleaseReservationInput): Promise<void> {
    const owner = await this.reservations.ownerOf(pitchId, date, startHour);
    if (owner !== userId) {
      return; // not yours (or already expired) — nothing to do
    }
    await this.reservations.release(pitchId, date, startHour);
    this.notifier.slotReleased(pitchId, date, startHour);
  }
}
