export interface UserDto {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResult {
  user: UserDto;
  token: string;
}

export interface Pitch {
  id: string;
  name: string;
  location: string;
  pricePerHour: number;
  openHour: number;
  closeHour: number;
}

export type SlotStatus = 'available' | 'reserved' | 'booked';

export interface Slot {
  startHour: number;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}

export interface ReserveResult {
  pitchId: string;
  date: string;
  startHour: number;
  ttlSeconds: number;
  reservedUntil: number;
}

export interface Booking {
  id: string;
  userId: string;
  pitchId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}
