import { Pitch } from '../../domain/entities/Pitch';

export interface PitchRepository {
  findAll(): Promise<Pitch[]>;
  findById(id: string): Promise<Pitch | null>;
}
