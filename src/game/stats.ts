import { addDays } from '../engine/dates';
import type { GameRecord } from './game';

export interface Stats {
  played: number;
  won: number;
  winPct: number;
  currentStreak: number;
  maxStreak: number;
  averageGuesses: number;
  /** distribution[i] = wins in i+1 guesses; the last bucket is "N or more". */
  distribution: number[];
}

export const DISTRIBUTION_BUCKETS = 8;

/**
 * Derived entirely from the saved records, so stats can never drift from
 * game history and a finished game can't be replayed to change them.
 *
 * "Played" = solved games, plus past days where guesses were made but never solved.
 * A started-but-unfinished game for `today` is not yet counted.
 */
export function computeStats(records: Readonly<Record<string, GameRecord>>, today: string): Stats {
  const all = Object.values(records);
  const solved = all.filter((r) => r.solved);
  const played = all.filter((r) => r.solved || (r.date < today && r.guesses.length > 0)).length;
  const distribution = new Array<number>(DISTRIBUTION_BUCKETS).fill(0);
  for (const r of solved) distribution[Math.min(r.guesses.length, DISTRIBUTION_BUCKETS) - 1]++;

  const solvedDates = new Set(solved.map((r) => r.date));
  // current streak: consecutive solved days ending today, or yesterday if today isn't solved yet
  let cursor = solvedDates.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (solvedDates.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  // max streak over all history
  let max = 0;
  for (const d of [...solvedDates].sort()) {
    if (solvedDates.has(addDays(d, -1))) continue; // not a run start
    let len = 0;
    let c = d;
    while (solvedDates.has(c)) {
      len++;
      c = addDays(c, 1);
    }
    max = Math.max(max, len);
  }
  const totalGuesses = solved.reduce((a, r) => a + r.guesses.length, 0);
  return {
    played,
    won: solved.length,
    winPct: played ? Math.round((solved.length / played) * 100) : 0,
    currentStreak: current,
    maxStreak: max,
    averageGuesses: solved.length ? Math.round((totalGuesses / solved.length) * 10) / 10 : 0,
    distribution,
  };
}
