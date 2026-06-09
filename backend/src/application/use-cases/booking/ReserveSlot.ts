import {
  SlotAlreadyReservedError,
  SlotUnavailableError,
} from '../../../domain/errors/DomainError';
import { BookingRepository } from '../../ports/BookingRepository';
import { ReservationStore } from '../../ports/ReservationStore';
import { RealtimeNotifier } from '../../ports/RealtimeNotifier';
import { Clock } from '../../ports/Clock';

export interface ReserveSlotInput {
  userId: string;
  pitchId: string;
  date: string;
  startHour: number;
}

export interface ReserveSlotResult {
  pitchId: string;
  date: string;
  startHour: number;
  ttlSeconds: number;
  reservedUntil: number; // epoch ms when the hold expires
}

/**
 * Places a temporary hold on a slot. The claim is atomic (SET NX EX) so only one user
 * can win a contested slot. Re-reserving a slot you already hold is idempotent (covers
 * multiple-tab booking). Expiry is automatic via the key's TTL.
 */
export class ReserveSlot {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly reservations: ReservationStore,
    private readonly notifier: RealtimeNotifier,
    private readonly clock: Clock,
    private readonly ttlSeconds: number,
  ) {}

  async execute(input: ReserveSlotInput): Promise<ReserveSlotResult> {
    const { userId, pitchId, date, startHour } = input;

    // A permanently-booked slot can never be reserved.
    const confirmed = await this.bookings.findConfirmedByPitchAndDate(pitchId, date);
    if (confirmed.some((b) => b.slot.startHour === startHour)) {
      throw new SlotUnavailableError();
    }

    const acquired = await this.reservations.reserve(
      pitchId,
      date,
      startHour,
      userId,
      this.ttlSeconds,
    );

    if (!acquired) {
      // Someone holds it. If it's this same user (e.g. a second tab), treat as success.
      const owner = await this.reservations.ownerOf(pitchId, date, startHour);
      if (owner !== userId) {
        throw new SlotAlreadyReservedError();
      }
    }

    const reservedUntil = this.clock.now() + this.ttlSeconds * 1000;
    this.notifier.slotReserved(pitchId, date, startHour, reservedUntil);

    return { pitchId, date, startHour, ttlSeconds: this.ttlSeconds, reservedUntil };
  }
}
