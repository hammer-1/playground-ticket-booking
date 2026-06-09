import { Prisma, PrismaClient } from '@prisma/client';
import { Pitch } from '../../domain/entities/Pitch';
import { PitchRepository } from '../../application/ports/PitchRepository';

interface PitchRow {
  id: string;
  name: string;
  location: string;
  pricePerHour: Prisma.Decimal;
  openHour: number;
  closeHour: number;
}

function toPitch(row: PitchRow): Pitch {
  return new Pitch(
    row.id,
    row.name,
    row.location,
    Number(row.pricePerHour),
    row.openHour,
    row.closeHour,
  );
}

export class PrismaPitchRepository implements PitchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Pitch[]> {
    const rows = await this.prisma.pitch.findMany({ orderBy: { name: 'asc' } });
    return rows.map(toPitch);
  }

  async findById(id: string): Promise<Pitch | null> {
    const row = await this.prisma.pitch.findUnique({ where: { id } });
    return row ? toPitch(row) : null;
  }
}
