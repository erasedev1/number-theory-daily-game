import { describe, expect, it } from 'vitest';
import { PUZZLES } from './data';
import { validatePuzzle } from '../engine/validate';
import { buildPuzzle } from './puzzle';
import { difficultyForDay, puzzleNumber, selectPuzzle, LAUNCH_DATE } from './daily';
import { addDays } from '../engine/dates';

describe('puzzle pool', () => {
  it('has at least 30 puzzles with unique ids', () => {
    expect(PUZZLES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
  });

  for (const def of PUZZLES) {
    it(`${def.id} (${def.difficulty}) has exactly one answer and no redundant clue`, () => {
      const v = validatePuzzle(def);
      expect(v.errors).toEqual([]);
      expect(v.solutions).toHaveLength(1);
      expect(buildPuzzle(def).answer).toBe(v.solutions[0]);
    });
  }

  it('respects clue counts per difficulty', () => {
    for (const p of PUZZLES) {
      if (p.difficulty === 'easy') expect(p.clues).toHaveLength(4);
      if (p.difficulty === 'medium') expect(p.clues).toHaveLength(5);
      if (p.difficulty === 'hard') expect([5, 6]).toContain(p.clues.length);
    }
  });

  it('has distinct answers', () => {
    const answers = PUZZLES.map((p) => buildPuzzle(p).answer);
    expect(new Set(answers).size).toBe(answers.length);
  });
});

describe('validation catches bad puzzles', () => {
  it('rejects ambiguous', () => {
    const v = validatePuzzle({ id: 'x', difficulty: 'easy', max: 100, clues: ['even', 'lt:50'] });
    expect(v.ok).toBe(false);
    expect(v.errors[0]).toMatch(/ambiguous/);
  });
  it('rejects unsatisfiable', () => {
    const v = validatePuzzle({ id: 'x', difficulty: 'easy', max: 100, clues: ['square', 'prime'] });
    expect(v.ok).toBe(false);
    expect(v.solutions).toHaveLength(0);
  });
  it('rejects redundant clues (3 divisors ⇒ square of a prime)', () => {
    const v = validatePuzzle({ id: 'x', difficulty: 'easy', max: 130, clues: ['tau:3', 'square', 'gt:100'] });
    expect(v.ok).toBe(false);
    expect(v.redundant).toContain('square');
  });
  it('accepts a good puzzle', () => {
    expect(validatePuzzle({ id: 'x', difficulty: 'easy', max: 100, clues: ['tau:9', 'lt:100'] }).ok).toBe(true);
  });
  it('rejects unknown clue ids without throwing', () => {
    expect(validatePuzzle({ id: 'x', difficulty: 'easy', max: 10, clues: ['bogus'] }).ok).toBe(false);
  });
});

describe('daily selection', () => {
  it('is deterministic', () => {
    for (let i = 0; i < 60; i++) {
      const d = addDays(LAUNCH_DATE, i);
      expect(selectPuzzle(d).id).toBe(selectPuzzle(d).id);
    }
  });
  it('numbers puzzles from the launch date', () => {
    expect(puzzleNumber(LAUNCH_DATE)).toBe(1);
    expect(puzzleNumber(addDays(LAUNCH_DATE, 41))).toBe(42);
  });
  it('schedules medium with a weekly alternating hard/easy special', () => {
    const kinds = Array.from({ length: 28 }, (_, i) => difficultyForDay(i + 1));
    expect(kinds.filter((k) => k === 'medium')).toHaveLength(24);
    expect(kinds[6]).toBe('hard');
    expect(kinds[13]).toBe('easy');
    expect(kinds[20]).toBe('hard');
    expect(kinds[27]).toBe('easy');
  });
  it('matches the scheduled difficulty and does not repeat within a pool cycle', () => {
    const seen = new Set<string>();
    const mediums = PUZZLES.filter((p) => p.difficulty === 'medium').length;
    let count = 0;
    for (let i = 0; count < mediums; i++) {
      const date = addDays(LAUNCH_DATE, i);
      const p = selectPuzzle(date);
      expect(p.difficulty).toBe(difficultyForDay(puzzleNumber(date)));
      if (p.difficulty === 'medium') {
        expect(seen.has(p.id)).toBe(false);
        seen.add(p.id);
        count++;
      }
    }
  });
  it('works for dates far in the future and before launch', () => {
    expect(selectPuzzle('2035-06-15')).toBeTruthy();
    expect(selectPuzzle('2026-10-01')).toBeTruthy();
  });
});
