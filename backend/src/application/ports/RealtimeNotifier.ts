/**
 * Pushes slot-status changes to clients viewing a pitch/date. Use cases depend on
 * this port; the Socket.io adapter implements it (see phase-07-realtime.md), keeping
 * the application layer ignorant of the transport.
 */
export interface RealtimeNotifier {
  slotReserved(
    pitchId: string,
    date: string,
    startHour: number,
    untilEpochMs: number,
  ): void;
  slotBooked(pitchId: string, date: string, startHour: number): void;
  slotReleased(pitchId: string, date: string, startHour: number): void;
}
