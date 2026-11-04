import { describe, expect, it } from 'vitest';
import { generatePuzzle } from './generator';
import { validatePuzzle } from './validate';
import { loadUnlimited, saveUnlimited, UNLIMITED_KEY } from '../game/unlimited';
import type { KeyValueStore } from '../game/storage';

describe('runtime puzzle generator (Unlimited mode)', () => {
  it('is deterministic per seed', () => {
    for (const d of ['easy', 'medium'] as const) {
      expect(generatePuzzle(d, 42)).toEqual(generatePuzzle(d, 42));
    }
  });
  it('different seeds give varied puzzles', () => {
    const ids = new Set(Array.from({ length: 8 }, (_, i) => generatePuzzle('easy', i + 1).def.clues.join('|')));
    expect(ids.size).toBeGreaterThan(4);
  });
  it('always produces uniquely solvable puzzles with the right clue counts', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const e = generatePuzzle('easy', seed);
      const m = generatePuzzle('medium', seed);
      for (const [r, n] of [[e, 4], [m, 5]] as const) {
        const v = validatePuzzle(r.def);
        expect(v.errors).toEqual([]);
        expect(v.solutions).toEqual([r.answer]);
        expect(r.def.clues).toHaveLength(n);
      }
    }
  }, 30000);
  it('hard puzzles are valid', () => {
    const h = generatePuzzle('hard', 7);
    expect(validatePuzzle(h.def).ok).toBe(true);
    expect([5, 6]).toContain(h.def.clues.length);
  }, 30000);
});

describe('unlimited persistence', () => {
  const mem = (): KeyValueStore & { m: Map<string, string> } => {
    const m = new Map<string, string>();
    return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
  };
  it('round-trips and sanitizes', () => {
    const s = mem();
    saveUnlimited(s, { difficulty: 'hard', game: { difficulty: 'hard', seed: 9, guesses: [3, 4], solved: false }, solvedCount: 2 });
    expect(loadUnlimited(s)).toEqual({ difficulty: 'hard', game: { difficulty: 'hard', seed: 9, guesses: [3, 4], solved: false }, solvedCount: 2 });
    s.setItem(UNLIMITED_KEY, '{bad');
    expect(loadUnlimited(s).game).toBeNull();
    s.setItem(UNLIMITED_KEY, JSON.stringify({ difficulty: 'x', game: { difficulty: 'easy', seed: 'a', guesses: [] }, solvedCount: -3 }));
    expect(loadUnlimited(s)).toEqual({ difficulty: 'medium', game: null, solvedCount: 0 });
  });
  it('never touches daily records', () => {
    const s = mem();
    saveUnlimited(s, { difficulty: 'easy', game: null, solvedCount: 1 });
    expect(s.m.has('integer:v1:records')).toBe(false);
  });
});
