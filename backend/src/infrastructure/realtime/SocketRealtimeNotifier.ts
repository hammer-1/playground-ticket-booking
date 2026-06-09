import { Server } from 'socket.io';
import { RealtimeNotifier } from '../../application/ports/RealtimeNotifier';
import { pitchDateRoom } from './room';

/**
 * Pushes slot-status changes to the pitch/date room. Because the Socket.io server uses
 * the Redis adapter, an emit here reaches clients connected to ANY backend instance.
 */
export class SocketRealtimeNotifier implements RealtimeNotifier {
  constructor(private readonly io: Server) {}

  slotReserved(pitchId: string, date: string, startHour: number, untilEpochMs: number): void {
    this.io
      .to(pitchDateRoom(pitchId, date))
      .emit('slot:reserved', { pitchId, date, startHour, until: untilEpochMs });
  }

  slotBooked(pitchId: string, date: string, startHour: number): void {
    this.io.to(pitchDateRoom(pitchId, date)).emit('slot:booked', { pitchId, date, startHour });
  }

  slotReleased(pitchId: string, date: string, startHour: number): void {
    this.io.to(pitchDateRoom(pitchId, date)).emit('slot:released', { pitchId, date, startHour });
  }
}
