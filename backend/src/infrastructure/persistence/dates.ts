/** 'YYYY-MM-DD' → a UTC-midnight Date for Prisma's @db.Date columns. */
export function toDbDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** A Prisma @db.Date value → 'YYYY-MM-DD' (UTC). */
export function fromDbDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
