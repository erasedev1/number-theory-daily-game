import { describe, expect, it } from 'vitest';
import { getClue, tryGetClue } from './clues';

/** [clue id, numbers that satisfy it, numbers that don't] */
const CASES: Array<[string, number[], number[]]> = [
  ['even', [2, 36], [1, 37]],
  ['odd', [1, 37], [2, 36]],
  ['gt:100', [101, 500], [100, 99]],
  ['lt:100', [99, 1], [100, 101]],
  ['div:7', [7, 49, 70], [1, 8, 50]],
  ['notdiv:7', [8, 50], [7, 49]],
  ['mod:5:2', [2, 7, 997], [3, 5, 10]],
  ['tau:6', [12, 18, 32], [36, 16]],
  ['sigma:56', [28], [27, 29]],
  ['phi:8', [15, 16, 20, 24, 30], [7, 9]],
  ['omega:2', [6, 12, 36], [2, 30, 1]],
  ['bigomega:3', [8, 12, 30], [6, 16]],
  ['lpf:7', [7, 14, 98], [8, 11]],
  ['prime', [2, 97], [1, 91]],
  ['composite', [4, 91], [1, 2]],
  ['semiprime', [6, 49], [8, 7]],
  ['squarefree', [30, 7], [12, 50]],
  ['square', [1, 36], [2, 35]],
  ['cube', [8, 27], [9, 16]],
  ['perfectpower', [16, 27, 36], [2, 72]],
  ['pow2', [1, 64], [3, 96]],
  ['triangular', [1, 6, 21, 28], [2, 20]],
  ['fibonacci', [1, 13, 144], [4, 100]],
  ['palindrome', [11, 121, 9], [10, 123]],
  ['digitsum:12', [39, 48, 93], [40, 58]],
  ['digitprod:12', [34, 223], [35, 11]],
  ['digits:3', [100, 999], [99, 1000]],
  ['ends:7', [7, 107], [17 + 1, 70]],
  ['contains:4', [4, 140, 94], [5, 31]],
  ['revprime', [13, 70 + 1], [12, 100]],
  ['revlarger', [12, 109], [21, 100]],
];

describe('clue evaluators', () => {
  for (const [id, yes, no] of CASES) {
    it(id, () => {
      const c = getClue(id);
      expect(c.id).toBe(id);
      for (const n of yes) expect(c.test(n), `${id} should hold for ${n}`).toBe(true);
      for (const n of no) expect(c.test(n), `${id} should fail for ${n}`).toBe(false);
    });
  }

  it('revprime for 71 is 17 which is prime', () => expect(getClue('revprime').test(71)).toBe(true));

  it('every clue has text, category, difficulty and explanation', () => {
    for (const [id, yes] of CASES) {
      const c = getClue(id);
      expect(c.text.endsWith('.')).toBe(true);
      expect(c.difficulty).toBeGreaterThanOrEqual(1);
      expect(c.difficulty).toBeLessThanOrEqual(3);
      expect(c.category).toBeTruthy();
      expect(c.explain(yes[0]).length).toBeGreaterThan(0);
    }
  });

  it('rejects unknown or malformed ids', () => {
    expect(tryGetClue('nope')).toBeNull();
    expect(tryGetClue('div')).toBeNull();
    expect(tryGetClue('div:x')).toBeNull();
    expect(tryGetClue('mod:5:7')).toBeNull();
    expect(tryGetClue('lpf:4')).toBeNull();
  });

  it('describes clues in plain language', () => {
    expect(getClue('div:7').text).toBe('It is divisible by 7.');
    expect(getClue('tau:6').text).toBe('It has exactly 6 positive divisors.');
    expect(getClue('mod:5:2').text).toBe('It is congruent to 2 modulo 5.');
  });
});
