import { dayIndexOf } from '../engine/dates';
import { seededShuffle } from '../engine/rng';
import type { Difficulty, PuzzleDef } from '../engine/validate';
import { PUZZLES } from './data';

/** Puzzle #1 is played on this New York calendar date. */
export const LAUNCH_DATE = '2026-11-01';

export function puzzleNumber(dateKey: string): number {
  return dayIndexOf(dateKey) - dayIndexOf(LAUNCH_DATE) + 1;
}

/**
 * Schedule: Medium every day, except every 7th day is a "special":
 * a Hard puzzle in even weeks and an Easy puzzle in odd weeks.
 */
export function difficultyForDay(dayNo: number): Difficulty {
  const d = dayNo - 1;
  const pos = ((d % 7) + 7) % 7;
  if (pos !== 6) return 'medium';
  const week = Math.floor(d / 7);
  return ((week % 2) + 2) % 2 === 0 ? 'hard' : 'easy';
}

function pool(difficulty: Difficulty, puzzles: readonly PuzzleDef[]): PuzzleDef[] {
  return puzzles.filter((p) => p.difficulty === difficulty).sort((a, b) => (a.id < b.id ? -1 : 1));
}

/** How many earlier days (same difficulty) preceded this one. */
function sequenceIndex(dayNo: number, difficulty: Difficulty): number {
  const d = dayNo - 1;
  const specialsBefore = Math.floor(d / 7);
  if (difficulty === 'medium') return d - specialsBefore;
  return Math.floor(specialsBefore / 2);
}

const SEEDS: Record<Difficulty, number> = { easy: 0x1ea5, medium: 0x3ed1, hard: 0x4a2d };

/**
 * Deterministic selection: each pool is walked in a seeded shuffled order, a fresh
 * shuffle per cycle, so no puzzle repeats until the pool is exhausted.
 */
export function selectPuzzle(dateKey: string, puzzles: readonly PuzzleDef[] = PUZZLES): PuzzleDef {
  const dayNo = puzzleNumber(dateKey);
  const difficulty = difficultyForDay(dayNo);
  let candidates = pool(difficulty, puzzles);
  if (candidates.length === 0) candidates = [...puzzles];
  const k = Math.max(0, sequenceIndex(dayNo, difficulty));
  const cycle = Math.floor(k / candidates.length);
  const order = seededShuffle(candidates, SEEDS[difficulty] + cycle * 7919);
  return order[k % candidates.length];
}
