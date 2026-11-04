import type { Puzzle } from '../puzzles/puzzle';

export interface GameRecord {
  /** New York date key this game was played for. */
  date: string;
  puzzleId: string;
  puzzleNumber: number;
  /** Guesses in the order they were made. */
  guesses: number[];
  solved: boolean;
}

export type GuessResult = { ok: true; value: number } | { ok: false; error: string };

export function newRecord(date: string, puzzleId: string, puzzleNumber: number): GameRecord {
  return { date, puzzleId, puzzleNumber, guesses: [], solved: false };
}

/** For each clue (in puzzle order): does THIS guess satisfy it? */
export function evaluateGuess(puzzle: Puzzle, guess: number): boolean[] {
  return puzzle.clues.map((c) => c.test(guess));
}

export function isWin(puzzle: Puzzle, guess: number): boolean {
  return guess === puzzle.answer;
}

/** Parse + validate raw input. Positive integers in [1, max], no duplicates. */
export function validateGuess(raw: string, puzzle: Puzzle, previous: readonly number[]): GuessResult {
  const text = raw.trim();
  if (text === '') return { ok: false, error: 'Enter a number first.' };
  if (!/^\d+$/.test(text)) return { ok: false, error: 'Use whole positive numbers only (digits 0–9).' };
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value < 1) return { ok: false, error: 'The number must be at least 1.' };
  if (value > puzzle.max) return { ok: false, error: `Today's number is between 1 and ${puzzle.max.toLocaleString('en-US')}.` };
  if (previous.includes(value)) return { ok: false, error: `You already guessed ${value}.` };
  return { ok: true, value };
}

export type SubmitOutcome =
  | { ok: true; record: GameRecord; won: boolean }
  | { ok: false; error: string };

/** Pure state transition: completed games are read-only. */
export function submitGuess(record: GameRecord, puzzle: Puzzle, raw: string): SubmitOutcome {
  if (record.solved) return { ok: false, error: "Today's puzzle is already solved." };
  const v = validateGuess(raw, puzzle, record.guesses);
  if (!v.ok) return v;
  const won = isWin(puzzle, v.value);
  return { ok: true, won, record: { ...record, guesses: [...record.guesses, v.value], solved: won } };
}
