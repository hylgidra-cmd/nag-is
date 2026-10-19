import { dayKey, daysAgo, lastNDays, parseDurationMs } from './duration';

describe('parseDurationMs', () => {
  it.each([
    ['500ms', 500],
    ['30s', 30_000],
    ['15m', 900_000],
    ['2h', 7_200_000],
    ['30d', 2_592_000_000],
  ])('parses %s', (input, expected) => {
    expect(parseDurationMs(input)).toBe(expected);
  });

  it('tolerates surrounding whitespace and uppercase units', () => {
    expect(parseDurationMs('  15M ')).toBe(900_000);
  });

  it('rejects malformed input rather than guessing', () => {
    for (const bad of ['', 'abc', '15', 'm15', '15 weeks', '-5m', '1.5h']) {
      expect(() => parseDurationMs(bad)).toThrow(/Invalid duration/);
    }
  });

  /**
   * The JWT TTLs come from .env and are turned into cookie maxAge values with
   * this function, so a silent misparse would desynchronise the token and its
   * cookie. It must throw instead.
   */
  it('is safe to use for cookie lifetimes', () => {
    expect(parseDurationMs('15m') / 1000).toBe(900);
    expect(parseDurationMs('30d') / 1000).toBe(2_592_000);
  });
});

describe('lastNDays', () => {
  it('returns N consecutive days, oldest first, ending today', () => {
    const now = new Date('2026-03-15T12:00:00.000Z');
    const days = lastNDays(5, now);
    expect(days).toEqual(['2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14', '2026-03-15']);
  });

  it('crosses a month boundary correctly', () => {
    const now = new Date('2026-03-02T12:00:00.000Z');
    expect(lastNDays(3, now)).toEqual(['2026-02-28', '2026-03-01', '2026-03-02']);
  });

  it('handles a leap day', () => {
    const now = new Date('2028-03-01T12:00:00.000Z');
    expect(lastNDays(2, now)).toEqual(['2028-02-29', '2028-03-01']);
  });

  it('produces exactly the requested length', () => {
    expect(lastNDays(30, new Date('2026-01-15T00:00:00.000Z'))).toHaveLength(30);
  });
});

describe('daysAgo', () => {
  it('returns UTC midnight, not the current time', () => {
    const now = new Date('2026-03-15T18:45:30.500Z');
    const result = daysAgo(7, now);
    expect(result.toISOString()).toBe('2026-03-08T00:00:00.000Z');
  });

  it('daysAgo(0) is midnight today', () => {
    const now = new Date('2026-03-15T18:45:00.000Z');
    expect(daysAgo(0, now).toISOString()).toBe('2026-03-15T00:00:00.000Z');
  });
});

describe('dayKey', () => {
  it('formats as an ISO date in UTC', () => {
    expect(dayKey(new Date('2026-03-15T23:59:59.000Z'))).toBe('2026-03-15');
  });
});
