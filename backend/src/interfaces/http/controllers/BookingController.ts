import { RequestHandler } from 'express';
import { ReserveSlot } from '../../../application/use-cases/booking/ReserveSlot';
import { ReleaseReservation } from '../../../application/use-cases/booking/ReleaseReservation';
import { ConfirmBooking } from '../../../application/use-cases/booking/ConfirmBooking';
import { ListMyBookings } from '../../../application/use-cases/booking/ListMyBookings';
import { asyncHandler } from '../middleware/asyncHandler';
import { confirmBookingSchema, reserveSlotSchema } from '../validation';

export class BookingController {
  constructor(
    private readonly reserveSlot: ReserveSlot,
    private readonly releaseReservation: ReleaseReservation,
    private readonly confirmBooking: ConfirmBooking,
    private readonly listMyBookings: ListMyBookings,
  ) {}

  reserve: RequestHandler = asyncHandler(async (req, res) => {
    const dto = reserveSlotSchema.parse(req.body);
    const result = await this.reserveSlot.execute({ userId: req.userId!, ...dto });
    res.status(201).json(result);
  });

  release: RequestHandler = asyncHandler(async (req, res) => {
    const dto = reserveSlotSchema.parse(req.body);
    await this.releaseReservation.execute({ userId: req.userId!, ...dto });
    res.status(204).send();
  });

  confirm: RequestHandler = asyncHandler(async (req, res) => {
    const dto = confirmBookingSchema.parse(req.body);
    const booking = await this.confirmBooking.execute({ userId: req.userId!, ...dto });
    res.status(201).json(booking);
  });

  myBookings: RequestHandler = asyncHandler(async (req, res) => {
    res.json(await this.listMyBookings.execute(req.userId!));
  });
}
