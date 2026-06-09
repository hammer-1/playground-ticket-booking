import { RealtimeNotifier } from '../../application/ports/RealtimeNotifier';

/**
 * Placeholder notifier used until the Socket.io adapter is wired in Phase 7.
 * Lets booking use cases depend on the RealtimeNotifier port without real-time yet.
 */
export class NoopRealtimeNotifier implements RealtimeNotifier {
  slotReserved(): void {}
  slotBooked(): void {}
  slotReleased(): void {}
}
