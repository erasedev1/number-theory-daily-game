import { describe, expect, it } from 'vitest';
import { addDays, dayIndexOf, daysBetween, isDateKey, msUntilNextDay, nyDateKey } from './dates';

describe('New York day boundaries', () => {
  it('rolls over at midnight Eastern, not UTC (EST, winter)', () => {
    expect(nyDateKey(new Date('2026-01-15T04:59:59Z'))).toBe('2026-01-14');
    expect(nyDateKey(new Date('2026-01-15T05:00:00Z'))).toBe('2026-01-15');
  });
  it('rolls over at midnight Eastern (EDT, summer)', () => {
    expect(nyDateKey(new Date('2026-07-15T03:59:59Z'))).toBe('2026-07-14');
    expect(nyDateKey(new Date('2026-07-15T04:00:00Z'))).toBe('2026-07-15');
  });
  it('handles DST end (2026-11-01): the day is 25 hours long', () => {
    expect(nyDateKey(new Date('2026-11-01T03:59:59Z'))).toBe('2026-10-31');
    expect(nyDateKey(new Date('2026-11-01T04:00:00Z'))).toBe('2026-11-01');
    expect(nyDateKey(new Date('2026-11-02T04:59:59Z'))).toBe('2026-11-01');
    expect(nyDateKey(new Date('2026-11-02T05:00:00Z'))).toBe('2026-11-02');
  });
  it('handles DST start (2026-03-08): the day is 23 hours long', () => {
    expect(nyDateKey(new Date('2026-03-08T04:59:59Z'))).toBe('2026-03-07');
    expect(nyDateKey(new Date('2026-03-08T05:00:00Z'))).toBe('2026-03-08');
    expect(nyDateKey(new Date('2026-03-09T03:59:59Z'))).toBe('2026-03-08');
    expect(nyDateKey(new Date('2026-03-09T04:00:00Z'))).toBe('2026-03-09');
  });
  it('late evening UTC is still the previous New York day', () => {
    expect(nyDateKey(new Date('2026-06-02T01:30:00Z'))).toBe('2026-06-01');
  });
  it('new year', () => {
    expect(nyDateKey(new Date('2027-01-01T04:59:00Z'))).toBe('2026-12-31');
    expect(nyDateKey(new Date('2027-01-01T05:00:00Z'))).toBe('2027-01-01');
  });
});

describe('date arithmetic', () => {
  it('adds days across month, year and leap boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('counts days independent of DST', () => {
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
    expect(dayIndexOf('1970-01-02')).toBe(1);
  });
  it('validates keys', () => {
    expect(isDateKey('2026-02-29')).toBe(false);
    expect(isDateKey('2028-02-29')).toBe(true);
    expect(isDateKey('2026-2-3')).toBe(false);
    expect(isDateKey(5)).toBe(false);
  });
  it('time until next day', () => {
    // 23:00 EST on Jan 15 -> 1 hour left
    const ms = msUntilNextDay(new Date('2026-01-16T04:00:00Z'));
    expect(Math.abs(ms - 3_600_000)).toBeLessThan(1000);
    // DST end: 00:30 EDT Nov 1 has 24.5 hours left
    const ms2 = msUntilNextDay(new Date('2026-11-01T04:30:00Z'));
    expect(Math.abs(ms2 - 24.5 * 3_600_000)).toBeLessThan(1000);
  });
});
