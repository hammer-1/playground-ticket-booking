import { ValidationError } from '../errors/DomainError';

const pad = (n: number): string => n.toString().padStart(2, '0');

/**
 * An hourly booking slot, identified by its start hour (0–23). End is implicitly
 * start + 1 hour. Slots are generated dynamically from a pitch's operating hours;
 * they are never stored as rows. See docs/phases/phase-04-pitches-slots.md.
 */
export class TimeSlot {
  private constructor(public readonly startHour: number) {}

  static fromStartHour(hour: number): TimeSlot {
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      throw new ValidationError(`Invalid slot start hour: ${hour}`);
    }
    return new TimeSlot(hour);
  }

  /** Parse a "HH:00" or "HH:00:00" start-time string. */
  static fromStartTime(value: string): TimeSlot {
    const match = /^(\d{1,2}):00(?::00)?$/.exec(value.trim());
    if (!match) {
      throw new ValidationError(`Invalid slot start time: "${value}"`);
    }
    return TimeSlot.fromStartHour(Number(match[1]));
  }

  get endHour(): number {
    return this.startHour + 1;
  }

  /** "07:00" */
  get startTime(): string {
    return `${pad(this.startHour)}:00`;
  }

  /** "08:00" */
  get endTime(): string {
    return `${pad(this.endHour)}:00`;
  }

  equals(other: TimeSlot): boolean {
    return this.startHour === other.startHour;
  }
}
