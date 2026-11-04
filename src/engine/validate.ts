import { getClue } from './clues';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PuzzleDef {
  /** Stable slug, never reused. */
  id: string;
  difficulty: Difficulty;
  /** The hidden number lies in [1, max]. */
  max: number;
  /** Clue ids (see engine/clues.ts), in display order. */
  clues: readonly string[];
}

/** Every n in [1, max] satisfying all the clues. */
export function findSolutions(clueIds: readonly string[], max: number): number[] {
  const tests = clueIds.map((id) => getClue(id).test);
  const out: number[] = [];
  for (let n = 1; n <= max; n++) {
    let ok = true;
    for (const t of tests) {
      if (!t(n)) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(n);
  }
  return out;
}

export interface ValidationResult {
  ok: boolean;
  solutions: number[];
  errors: string[];
  /** Clue ids that can be removed without changing the (unique) answer. */
  redundant: string[];
}

export function validatePuzzle(def: PuzzleDef): ValidationResult {
  const errors: string[] = [];
  let solutions: number[] = [];
  let redundant: string[] = [];
  try {
    if (new Set(def.clues).size !== def.clues.length) errors.push('duplicate clue ids');
    solutions = findSolutions(def.clues, def.max);
    if (solutions.length === 0) errors.push('no number satisfies every clue');
    if (solutions.length > 1) errors.push(`ambiguous: ${solutions.length} solutions (${solutions.slice(0, 5).join(', ')}…)`);
    if (solutions.length === 1) {
      redundant = def.clues.filter((_, i) => {
        const rest = def.clues.filter((__, j) => j !== i);
        return findSolutions(rest, def.max).length === 1;
      });
      if (redundant.length) errors.push(`redundant clues: ${redundant.join(', ')}`);
    }
  } catch (e) {
    errors.push((e as Error).message);
  }
  return { ok: errors.length === 0, solutions, errors, redundant };
}
