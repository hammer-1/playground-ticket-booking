// Loaded first for its side effect: dotenv.config() populates process.env (incl.
// DATABASE_URL) before the PrismaClient below is constructed. Needed when seed runs
// as a standalone entrypoint on the host; in Docker the vars come from env_file.
import '../../config/env';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../config/logger';

const PITCHES = [
  { name: 'Turf Ground', location: 'North Block', price: 1200, open: 6, close: 23 },
  { name: 'Box Cricket', location: 'East Wing', price: 900, open: 6, close: 23 },
  { name: 'Indoor Nets', location: 'Indoor Arena', price: 700, open: 6, close: 23 },
];

export async function seed(prisma: PrismaClient): Promise<void> {
  for (const p of PITCHES) {
    // Idempotent: only insert a pitch whose name isn't present yet.
    const exists = await prisma.pitch.findFirst({ where: { name: p.name } });
    if (!exists) {
      await prisma.pitch.create({
        data: {
          name: p.name,
          location: p.location,
          pricePerHour: p.price,
          openHour: p.open,
          closeHour: p.close,
        },
      });
    }
  }
  const count = await prisma.pitch.count();
  logger.info(`seed complete — ${count} pitches present`);
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seed(prisma)
    .then(() => prisma.$disconnect())
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error(err, 'seed failed');
      process.exit(1);
    });
}
