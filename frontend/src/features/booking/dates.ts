export interface DayOption {
  iso: string; // YYYY-MM-DD
  weekday: string; // MON
  day: string; // 09
  month: string; // JUN
}

/** The next `count` days starting today, formatted for the date strip. */
export function upcomingDays(count: number): DayOption[] {
  const days: DayOption[] = [];
  const base = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
    days.push({
      iso,
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      day: String(d.getDate()).padStart(2, '0'),
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    });
  }
  return days;
}
