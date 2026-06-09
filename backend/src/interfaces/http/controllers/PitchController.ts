import { RequestHandler } from 'express';
import { ListPitches } from '../../../application/use-cases/pitches/ListPitches';
import { GetSlots } from '../../../application/use-cases/slots/GetSlots';
import { asyncHandler } from '../middleware/asyncHandler';
import { slotsQuerySchema } from '../validation';

export class PitchController {
  constructor(
    private readonly listPitches: ListPitches,
    private readonly getSlots: GetSlots,
  ) {}

  list: RequestHandler = asyncHandler(async (_req, res) => {
    res.json(await this.listPitches.execute());
  });

  slots: RequestHandler = asyncHandler(async (req, res) => {
    const query = slotsQuerySchema.parse(req.query);
    res.json(await this.getSlots.execute(query));
  });
}
