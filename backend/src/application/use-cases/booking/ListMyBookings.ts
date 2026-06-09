import { Booking } from '../../../domain/entities/Booking';
import { BookingRepository } from '../../ports/BookingRepository';

export class ListMyBookings {
  constructor(private readonly bookings: BookingRepository) {}

  async execute(userId: string): Promise<ReturnType<Booking['toPublic']>[]> {
    const bookings = await this.bookings.findByUser(userId);
    return bookings.map((b) => b.toPublic());
  }
}
