import type { Difficulty, PuzzleDef } from '../engine/validate';
import type { KeyValueStore } from './storage';

export const UNLIMITED_KEY = 'integer:v1:unlimited';

/** An Unlimited-mode game. The puzzle is fully determined by (difficulty, seed). */
export interface UnlimitedGame {
  difficulty: Difficulty;
  seed: number;
  guesses: number[];
  solved: boolean;
}

export interface UnlimitedState {
  difficulty: Difficulty;
  game: UnlimitedGame | null;
  /** Puzzles solved in Unlimited mode (never touches daily stats). */
  solvedCount: number;
}

export const DEFAULT_UNLIMITED: UnlimitedState = { difficulty: 'medium', game: null, solvedCount: 0 };

const isDifficulty = (d: unknown): d is Difficulty => d === 'easy' || d === 'medium' || d === 'hard';

export function newSeed(): number {
  return (Math.floor(Math.random() * 0x7fffffff) + 1) >>> 0;
}

export function loadUnlimited(store: KeyValueStore): UnlimitedState {
  try {
    const p = JSON.parse(store.getItem(UNLIMITED_KEY) ?? '{}');
    const g = p.game;
    const game: UnlimitedGame | null =
      g && isDifficulty(g.difficulty) && Number.isSafeInteger(g.seed) && Array.isArray(g.guesses)
        ? { difficulty: g.difficulty, seed: g.seed, guesses: [...new Set<number>(g.guesses.filter((x: unknown) => Number.isSafeInteger(x) && (x as number) >= 1))], solved: g.solved === true }
        : null;
    return {
      difficulty: isDifficulty(p.difficulty) ? p.difficulty : 'medium',
      game,
      solvedCount: Number.isSafeInteger(p.solvedCount) && p.solvedCount > 0 ? p.solvedCount : 0,
    };
  } catch {
    return { ...DEFAULT_UNLIMITED };
  }
}

export function saveUnlimited(store: KeyValueStore, s: UnlimitedState): void {
  try {
    store.setItem(UNLIMITED_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export type { PuzzleDef };
