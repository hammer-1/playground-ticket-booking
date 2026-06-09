import { NotFoundError } from '../../../domain/errors/DomainError';
import { PitchRepository } from '../../ports/PitchRepository';
import { BookingRepository } from '../../ports/BookingRepository';
import { ReservationStore } from '../../ports/ReservationStore';

export type SlotStatus = 'available' | 'reserved' | 'booked';

export interface SlotView {
  startHour: number;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}

export interface GetSlotsInput {
  pitchId: string;
  date: string;
}

/**
 * Availability is a pure function of (confirmed bookings ∪ live reservations) over the
 * pitch's generated slot grid. 'booked' beats 'reserved' beats 'available'.
 */
export class GetSlots {
  constructor(
    private readonly pitches: PitchRepository,
    private readonly bookings: BookingRepository,
    private readonly reservations: ReservationStore,
  ) {}

  async execute({ pitchId, date }: GetSlotsInput): Promise<SlotView[]> {
    const pitch = await this.pitches.findById(pitchId);
    if (!pitch) {
      throw new NotFoundError('Pitch not found');
    }

    const [confirmed, reservedHours] = await Promise.all([
      this.bookings.findConfirmedByPitchAndDate(pitchId, date),
      this.reservations.activeStartHours(pitchId, date),
    ]);

    const booked = new Set(confirmed.map((b) => b.slot.startHour));
    const reserved = new Set(reservedHours);

    return pitch.generateSlots().map((slot) => {
      const status: SlotStatus = booked.has(slot.startHour)
        ? 'booked'
        : reserved.has(slot.startHour)
          ? 'reserved'
          : 'available';
      return {
        startHour: slot.startHour,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status,
      };
    });
  }
}
