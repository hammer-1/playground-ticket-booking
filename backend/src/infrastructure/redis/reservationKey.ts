export const RESERVATION_PREFIX = 'reservation';

/** `reservation:{pitchId}:{date}:{startHour}` */
export function reservationKey(pitchId: string, date: string, startHour: number): string {
  return `${RESERVATION_PREFIX}:${pitchId}:${date}:${startHour}`;
}

export interface ParsedReservationKey {
  pitchId: string;
  date: string;
  startHour: number;
}

/** Inverse of reservationKey; returns null if the key isn't a reservation key. */
export function parseReservationKey(key: string): ParsedReservationKey | null {
  const parts = key.split(':');
  if (parts.length !== 4 || parts[0] !== RESERVATION_PREFIX) {
    return null;
  }
  const startHour = Number(parts[3]);
  if (!Number.isInteger(startHour)) {
    return null;
  }
  return { pitchId: parts[1]!, date: parts[2]!, startHour };
}
