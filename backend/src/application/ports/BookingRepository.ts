import { Booking } from '../../domain/entities/Booking';

export interface NewConfirmedBooking {
  userId: string;
  pitchId: string;
  bookingDate: string; // YYYY-MM-DD
  startHour: number;
}

export interface BookingRepository {
  /** Confirmed bookings for a pitch on a date — used to compute availability. */
  findConfirmedByPitchAndDate(pitchId: string, date: string): Promise<Booking[]>;

  /** All bookings for a user, newest first. */
  findByUser(userId: string): Promise<Booking[]>;

  /**
   * Atomically create a confirmed booking for the slot, or throw
   * SlotUnavailableError if one already exists. The implementation is responsible
   * for serialising concurrent callers (advisory lock) and for the database-level
   * uniqueness guarantee. See docs/phases/phase-05-booking-concurrency.md.
   */
  createConfirmed(input: NewConfirmedBooking): Promise<Booking>;
}
