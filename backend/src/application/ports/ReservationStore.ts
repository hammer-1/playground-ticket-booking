/**
 * A short-lived hold on a slot while a user decides whether to confirm. Backed by
 * Redis keys with a TTL (see docs/phases/phase-06-reservation-expiry.md). The store
 * deals in primitive slot coordinates; key formatting is the adapter's concern.
 */
export interface ReservationStore {
  /**
   * Attempt to hold the slot for `userId` for `ttlSeconds`. Returns true if the
   * hold was acquired, false if someone already holds it (atomic SET NX EX).
   */
  reserve(
    pitchId: string,
    date: string,
    startHour: number,
    userId: string,
    ttlSeconds: number,
  ): Promise<boolean>;

  /** The userId currently holding the slot, or null if free/expired. */
  ownerOf(pitchId: string, date: string, startHour: number): Promise<string | null>;

  /** Release a hold (e.g. after the booking is confirmed). */
  release(pitchId: string, date: string, startHour: number): Promise<void>;

  /** Start hours currently held for a pitch on a date — used for availability. */
  activeStartHours(pitchId: string, date: string): Promise<number[]>;
}
