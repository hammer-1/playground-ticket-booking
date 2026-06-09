import { Booking } from '../../../domain/entities/Booking';
import {
  ReservationExpiredError,
  SlotAlreadyReservedError,
} from '../../../domain/errors/DomainError';
import { BookingRepository } from '../../ports/BookingRepository';
import { ReservationStore } from '../../ports/ReservationStore';
import { RealtimeNotifier } from '../../ports/RealtimeNotifier';

export interface ConfirmBookingInput {
  userId: string;
  pitchId: string;
  date: string;
  startHour: number;
}

/**
 * Turns a temporary hold into a permanent booking.
 *
 * Concurrency story (defence in depth):
 *  - The caller must currently OWN the reservation (someone else can't confirm a slot
 *    you're holding; an expired hold can't be confirmed).
 *  - createConfirmed() serialises racers with a per-slot advisory lock inside a
 *    transaction, and the partial unique index is the enforced backstop — so even two
 *    callers who both believe they hold the slot cannot both succeed.
 */
export class ConfirmBooking {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly reservations: ReservationStore,
    private readonly notifier: RealtimeNotifier,
  ) {}

  async execute(input: ConfirmBookingInput): Promise<ReturnType<Booking['toPublic']>> {
    const owner = await this.reservations.ownerOf(input.pitchId, input.date, input.startHour);
    if (owner === null) {
      throw new ReservationExpiredError();
    }
    if (owner !== input.userId) {
      throw new SlotAlreadyReservedError();
    }

    const booking = await this.bookings.createConfirmed({
      userId: input.userId,
      pitchId: input.pitchId,
      bookingDate: input.date,
      startHour: input.startHour,
    });

    // Slot is now permanently booked — drop the temporary hold and tell viewers.
    await this.reservations.release(input.pitchId, input.date, input.startHour);
    this.notifier.slotBooked(input.pitchId, input.date, input.startHour);

    return booking.toPublic();
  }
}
