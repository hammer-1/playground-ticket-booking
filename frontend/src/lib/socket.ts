import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';

let current: { token: string; socket: Socket } | null = null;

/**
 * One shared socket per token. Re-issuing with a new token tears down the old
 * connection. Authenticated with the user's JWT on the handshake.
 */
export function getSocket(token: string): Socket {
  if (current && current.token === token) return current.socket;
  if (current) current.socket.close();
  const socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket'],
  });
  current = { token, socket };
  return socket;
}

export function closeSocket(): void {
  if (current) {
    current.socket.close();
    current = null;
  }
}
