import { Server, Socket } from 'socket.io';
import { TokenService } from '../../application/ports/security';
import { pitchDateRoom } from '../../infrastructure/realtime/room';
import { logger } from '../../config/logger';

interface JoinPayload {
  pitchId: string;
  date: string;
}

function isValidJoin(p: unknown): p is JoinPayload {
  return (
    typeof p === 'object' &&
    p !== null &&
    typeof (p as JoinPayload).pitchId === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test((p as JoinPayload).date)
  );
}

/**
 * Configures authentication + room join/leave on the Socket.io server. Clients join a
 * `pitch:{id}:{date}` room to receive that view's slot updates; the use cases broadcast
 * to these rooms via SocketRealtimeNotifier.
 */
export function setupSocket(io: Server, tokens: TokenService): void {
  // Authenticate the handshake with the same JWT used for REST.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      const payload = tokens.verify(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    socket.on('join', (payload: unknown) => {
      if (isValidJoin(payload)) {
        socket.join(pitchDateRoom(payload.pitchId, payload.date));
      }
    });

    socket.on('leave', (payload: unknown) => {
      if (isValidJoin(payload)) {
        socket.leave(pitchDateRoom(payload.pitchId, payload.date));
      }
    });
  });

  logger.info('Socket.io configured');
}
