import { getClue, type Clue } from '../engine/clues';
import { findSolutions, type PuzzleDef } from '../engine/validate';

export interface Puzzle {
  def: PuzzleDef;
  clues: Clue[];
  max: number;
  /** The unique number satisfying every clue. */
  answer: number;
}

const cache = new Map<string, Puzzle>();

export function buildPuzzle(def: PuzzleDef): Puzzle {
  const hit = cache.get(def.id);
  if (hit) return hit;
  const solutions = findSolutions(def.clues, def.max);
  if (solutions.length !== 1) throw new Error(`Puzzle ${def.id} is not uniquely solvable (${solutions.length} solutions)`);
  const puzzle: Puzzle = { def, clues: def.clues.map(getClue), max: def.max, answer: solutions[0] };
  cache.set(def.id, puzzle);
  return puzzle;
}
