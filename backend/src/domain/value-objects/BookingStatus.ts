export const BookingStatus = {
  Confirmed: 'confirmed',
  Cancelled: 'cancelled',
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];
