import { Pitch } from '../../../domain/entities/Pitch';
import { PitchRepository } from '../../ports/PitchRepository';

export class ListPitches {
  constructor(private readonly pitches: PitchRepository) {}

  async execute(): Promise<ReturnType<Pitch['toPublic']>[]> {
    const pitches = await this.pitches.findAll();
    return pitches.map((p) => p.toPublic());
  }
}
