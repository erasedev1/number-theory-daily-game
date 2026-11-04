/** Calendar helpers. All "days" are America/New_York calendar days, as YYYY-MM-DD keys. */

export const GAME_TIMEZONE = 'America/New_York';

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: GAME_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The New York calendar date of an instant, e.g. "2026-11-04". Independent of the device timezone. */
export function nyDateKey(instant: Date = new Date()): string {
  const parts = formatter.formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

const KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDateKey(s: unknown): s is string {
  if (typeof s !== 'string') return false;
  const m = KEY_RE.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

/** Days since 1970-01-01 for a date key (pure calendar arithmetic; DST-proof). */
export function dayIndexOf(key: string): number {
  const m = KEY_RE.exec(key);
  if (!m) throw new Error(`Bad date key: ${key}`);
  return Math.round(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000);
}

export function addDays(key: string, days: number): string {
  const t = new Date((dayIndexOf(key) + days) * 86_400_000);
  return t.toISOString().slice(0, 10);
}

export function daysBetween(fromKey: string, toKey: string): number {
  return dayIndexOf(toKey) - dayIndexOf(fromKey);
}

/** Human date for a key, e.g. "Wed, Nov 4, 2026". */
export function formatDateKey(key: string): string {
  const m = KEY_RE.exec(key)!;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** Milliseconds from `now` until the New York calendar date changes (bisection; DST-safe). */
export function msUntilNextDay(now: Date = new Date()): number {
  const today = nyDateKey(now);
  let lo = 0;
  let hi = 26 * 3_600_000;
  while (hi - lo > 500) {
    const mid = (lo + hi) / 2;
    if (nyDateKey(new Date(now.getTime() + mid)) === today) lo = mid;
    else hi = mid;
  }
  return Math.ceil(hi);
}
