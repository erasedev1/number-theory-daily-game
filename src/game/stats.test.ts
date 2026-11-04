import { describe, expect, it } from 'vitest';
import { computeStats } from './stats';
import { loadRecords, saveRecord, RECORDS_KEY, type KeyValueStore } from './storage';
import type { GameRecord } from './game';

const rec = (date: string, guesses: number[], solved: boolean): GameRecord => ({ date, puzzleId: 'p', puzzleNumber: 1, guesses, solved });
const book = (...rs: GameRecord[]) => Object.fromEntries(rs.map((r) => [r.date, r]));

describe('computeStats', () => {
  it('empty', () => {
    expect(computeStats({}, '2026-11-04')).toMatchObject({ played: 0, won: 0, winPct: 0, currentStreak: 0, maxStreak: 0, averageGuesses: 0 });
  });
  it('basic wins, average and distribution', () => {
    const s = computeStats(book(rec('2026-11-02', [1, 2, 3], true), rec('2026-11-03', [4], true), rec('2026-11-04', [1, 2, 3, 4, 5], true)), '2026-11-04');
    expect(s.played).toBe(3);
    expect(s.won).toBe(3);
    expect(s.winPct).toBe(100);
    expect(s.averageGuesses).toBe(3);
    expect(s.distribution.slice(0, 5)).toEqual([1, 0, 1, 0, 1]);
  });
  it('current and max streaks', () => {
    const s = computeStats(book(rec('2026-11-01', [1], true), rec('2026-11-02', [1], true), rec('2026-11-03', [1], true), rec('2026-11-05', [1], true), rec('2026-11-06', [1], true)), '2026-11-06');
    expect(s.currentStreak).toBe(2);
    expect(s.maxStreak).toBe(3);
  });
  it('skipping a day breaks the current streak', () => {
    const s = computeStats(book(rec('2026-11-01', [1], true), rec('2026-11-02', [1], true)), '2026-11-04');
    expect(s.currentStreak).toBe(0);
    expect(s.maxStreak).toBe(2);
  });
  it("streak survives while today's puzzle is not yet solved", () => {
    const s = computeStats(book(rec('2026-11-02', [1], true), rec('2026-11-03', [1], true), rec('2026-11-04', [7], false)), '2026-11-04');
    expect(s.currentStreak).toBe(2);
    expect(s.played).toBe(2); // in-progress game is not counted yet
  });
  it('abandoned past games count as played but not won', () => {
    const s = computeStats(book(rec('2026-11-02', [5, 6], false), rec('2026-11-03', [1], true)), '2026-11-04');
    expect(s.played).toBe(2);
    expect(s.won).toBe(1);
    expect(s.winPct).toBe(50);
  });
  it('visited but never guessed is not played', () => {
    expect(computeStats(book(rec('2026-11-02', [], false)), '2026-11-04').played).toBe(0);
  });
  it('streaks cross month and year boundaries', () => {
    const s = computeStats(book(rec('2026-12-30', [1], true), rec('2026-12-31', [1], true), rec('2027-01-01', [1], true)), '2027-01-01');
    expect(s.currentStreak).toBe(3);
  });
  it('lumps 8+ guesses in the last bucket', () => {
    const s = computeStats(book(rec('2026-11-03', Array.from({ length: 12 }, (_, i) => i + 1), true)), '2026-11-03');
    expect(s.distribution[7]).toBe(1);
  });
});

class MemStore implements KeyValueStore {
  m = new Map<string, string>();
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
}

describe('storage', () => {
  it('round-trips records', () => {
    const s = new MemStore();
    saveRecord(s, rec('2026-11-04', [3, 5], false));
    expect(loadRecords(s)['2026-11-04'].guesses).toEqual([3, 5]);
  });
  it('survives corrupt data', () => {
    const s = new MemStore();
    s.setItem(RECORDS_KEY, '{not json');
    expect(loadRecords(s)).toEqual({});
    s.setItem(RECORDS_KEY, JSON.stringify({ '2026-11-04': { guesses: 'x' }, bad: {}, '2026-11-05': rec('2026-11-05', [1, 1, -4, 2.5, 9], true) }));
    const r = loadRecords(s);
    expect(Object.keys(r)).toEqual(['2026-11-05']);
    expect(r['2026-11-05'].guesses).toEqual([1, 9]);
  });
  it('a solved record is never overwritten by a stale tab (no replay to improve stats)', () => {
    const s = new MemStore();
    saveRecord(s, rec('2026-11-04', [4, 9], true));
    const merged = saveRecord(s, rec('2026-11-04', [4], false)); // stale tab
    expect(merged.solved).toBe(true);
    expect(loadRecords(s)['2026-11-04'].guesses).toEqual([4, 9]);
  });
  it('unions guesses from two tabs', () => {
    const s = new MemStore();
    saveRecord(s, rec('2026-11-04', [1, 2], false));
    const merged = saveRecord(s, rec('2026-11-04', [1, 3], false));
    expect(merged.guesses).toEqual([1, 2, 3]);
  });
});
