/**
 * Parses a short duration string ("15m", "30d", "900s", "2h") into
 * milliseconds. Used to turn JWT_*_TTL into cookie `maxAge` values, so the
 * cookie and the token always expire together.
 */
export function parseDurationMs(input: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid duration "${input}". Expected a form such as "15m", "2h" or "30d".`);
  }

  const amount = Number(match[1]);
  const unit = (match[2] ?? 's').toLowerCase();

  switch (unit) {
    case 'ms':
      return amount;
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60_000;
    case 'h':
      return amount * 3_600_000;
    case 'd':
      return amount * 86_400_000;
    default:
      throw new Error(`Unsupported duration unit "${unit}".`);
  }
}

/** Returns the first N days ending today, oldest first, as ISO date strings. */
export function lastNDays(days: number, now: Date = new Date()): string[] {
  const result: string[] = [];
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  cursor.setUTCDate(cursor.getUTCDate() - (days - 1));

  for (let index = 0; index < days; index += 1) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}

/** UTC midnight N days before today. */
export function daysAgo(days: number, now: Date = new Date()): Date {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

/** ISO day key (YYYY-MM-DD) in UTC. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
