import { BookingStatus } from '../value-objects/BookingStatus';
import { TimeSlot } from '../value-objects/TimeSlot';

/**
 * A booking of one pitch slot on one date. A booking with status 'confirmed'
 * permanently occupies its slot (enforced by a partial unique index in Postgres).
 */
export class Booking {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly pitchId: string,
    public readonly bookingDate: string, // YYYY-MM-DD
    public readonly slot: TimeSlot,
    public readonly status: BookingStatus,
    public readonly createdAt: Date,
  ) {}

  toPublic(): {
    id: string;
    userId: string;
    pitchId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    status: BookingStatus;
    createdAt: string;
  } {
    return {
      id: this.id,
      userId: this.userId,
      pitchId: this.pitchId,
      bookingDate: this.bookingDate,
      startTime: this.slot.startTime,
      endTime: this.slot.endTime,
      status: this.status,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
