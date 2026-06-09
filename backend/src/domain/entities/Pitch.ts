import { ValidationError } from '../errors/DomainError';
import { TimeSlot } from '../value-objects/TimeSlot';

/**
 * A cricket pitch with operating hours. Slots are derived from [openHour, closeHour):
 * a pitch open 06:00–23:00 yields hourly slots 06:00–07:00 … 22:00–23:00.
 */
export class Pitch {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly location: string,
    public readonly pricePerHour: number,
    public readonly openHour: number,
    public readonly closeHour: number,
  ) {
    if (openHour < 0 || closeHour > 24 || openHour >= closeHour) {
      throw new ValidationError(
        `Invalid pitch hours: open=${openHour}, close=${closeHour}`,
      );
    }
  }

  /** Pure: the full grid of bookable hourly slots for any date. */
  generateSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    for (let hour = this.openHour; hour < this.closeHour; hour++) {
      slots.push(TimeSlot.fromStartHour(hour));
    }
    return slots;
  }

  toPublic(): {
    id: string;
    name: string;
    location: string;
    pricePerHour: number;
    openHour: number;
    closeHour: number;
  } {
    return {
      id: this.id,
      name: this.name,
      location: this.location,
      pricePerHour: this.pricePerHour,
      openHour: this.openHour,
      closeHour: this.closeHour,
    };
  }
}
