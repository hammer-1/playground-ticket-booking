import { PrismaClient } from '@prisma/client';

/** A single shared Prisma client, created at the composition root. */
export function createPrismaClient(): PrismaClient {
  return new PrismaClient();
}

export type { PrismaClient };
