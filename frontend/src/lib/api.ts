import type {
  AuthResult,
  Booking,
  Pitch,
  ReserveResult,
  Slot,
} from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.code ?? 'ERROR', data.error ?? 'Request failed');
  }
  return data as T;
}

export const api = {
  register: (body: { name: string; email: string; password: string }) =>
    request<AuthResult>('/auth/register', { method: 'POST', body }),

  login: (body: { email: string; password: string }) =>
    request<AuthResult>('/auth/login', { method: 'POST', body }),

  getPitches: () => request<Pitch[]>('/pitches'),

  getSlots: (pitchId: string, date: string, token: string) =>
    request<Slot[]>(`/slots?pitchId=${pitchId}&date=${date}`, { token }),

  reserveSlot: (body: { pitchId: string; date: string; startHour: number }, token: string) =>
    request<ReserveResult>('/reserve-slot', { method: 'POST', body, token }),

  releaseSlot: (body: { pitchId: string; date: string; startHour: number }, token: string) =>
    request<void>('/release-slot', { method: 'POST', body, token }),

  confirmBooking: (body: { pitchId: string; date: string; startHour: number }, token: string) =>
    request<Booking>('/confirm-booking', { method: 'POST', body, token }),

  getMyBookings: (token: string) => request<Booking[]>('/my-bookings', { token }),
};
