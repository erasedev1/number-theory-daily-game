import { describe, expect, it } from 'vitest';
import { buildPuzzle } from '../puzzles/puzzle';
import { evaluateGuess, newRecord, submitGuess, validateGuess } from './game';
import { buildShareText } from './share';

const puzzle = buildPuzzle({ id: 't', difficulty: 'easy', max: 99, clues: ['div:4', 'tau:9', 'square', 'div:3', 'lt:100'] });

describe('puzzle fixture', () => {
  it('answer is 36', () => expect(puzzle.answer).toBe(36));
});

describe('evaluateGuess — reflects only the current guess', () => {
  it('16 lights div4, square, lt100', () => {
    expect(evaluateGuess(puzzle, 16)).toEqual([true, false, true, false, true]);
  });
  it('a later guess recomputes every clue (nothing stays lit)', () => {
    expect(evaluateGuess(puzzle, 16)).toEqual([true, false, true, false, true]);
    expect(evaluateGuess(puzzle, 7)).toEqual([false, false, false, false, true]);
  });
  it('the answer satisfies every clue', () => expect(evaluateGuess(puzzle, 36).every(Boolean)).toBe(true));
});

describe('validateGuess', () => {
  const ok = (raw: string, prev: number[] = []) => validateGuess(raw, puzzle, prev);
  it('accepts valid integers (trimmed)', () => expect(ok(' 42 ')).toEqual({ ok: true, value: 42 }));
  it('rejects empty', () => expect(ok('  ').ok).toBe(false));
  it('rejects non-numeric, decimals, negatives, exponent notation, signs', () => {
    for (const bad of ['abc', '4.5', '-3', '1e2', '+5', '0x10', '12a', '١٢']) expect(ok(bad).ok, bad).toBe(false);
  });
  it('rejects zero and out-of-range', () => {
    expect(ok('0').ok).toBe(false);
    expect(ok('100').ok).toBe(false);
    expect(ok('99').ok).toBe(true);
    expect(ok('99999999999999999999').ok).toBe(false);
  });
  it('rejects duplicates', () => {
    const r = ok('16', [16]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/already/);
  });
  it('accepts leading zeros as the same number', () => expect(ok('007')).toEqual({ ok: true, value: 7 }));
  it('treats leading-zero duplicates as duplicates', () => expect(ok('016', [16]).ok).toBe(false));
});

describe('submitGuess / win detection', () => {
  it('records guesses in order and detects the win', () => {
    let rec = newRecord('2026-11-04', 't', 4);
    const a = submitGuess(rec, puzzle, '16');
    expect(a.ok && !a.won && !a.record.solved).toBe(true);
    if (!a.ok) throw 0;
    rec = a.record;
    const b = submitGuess(rec, puzzle, '36');
    expect(b.ok && b.won && b.record.solved).toBe(true);
    if (!b.ok) throw 0;
    expect(b.record.guesses).toEqual([16, 36]);
  });
  it('does not mutate the input record', () => {
    const rec = newRecord('2026-11-04', 't', 4);
    submitGuess(rec, puzzle, '5');
    expect(rec.guesses).toEqual([]);
  });
  it('invalid guesses do not count', () => {
    const rec = newRecord('2026-11-04', 't', 4);
    expect(submitGuess(rec, puzzle, 'x').ok).toBe(false);
    expect(rec.guesses).toHaveLength(0);
  });
  it('completed games are read-only', () => {
    const solved = { ...newRecord('2026-11-04', 't', 4), guesses: [36], solved: true };
    const r = submitGuess(solved, puzzle, '10');
    expect(r.ok).toBe(false);
  });
});

describe('share text', () => {
  it('shows the pattern grid and never the answer', () => {
    const rec = { ...newRecord('2026-11-04', 't', 4), guesses: [16, 12, 36], solved: true };
    const text = buildShareText(rec, puzzle);
    expect(text).toBe(['INTEGER #004', 'Solved in 3 guesses', '🟩⬜🟩⬜🟩', '🟩⬜⬜🟩🟩', '🟩🟩🟩🟩🟩', 'integer.game'].join('\n'));
    expect(text).not.toContain('36');
  });
  it('singular wording', () => {
    const rec = { ...newRecord('2026-11-04', 't', 42), guesses: [36], solved: true };
    expect(buildShareText(rec, puzzle)).toContain('Solved in 1 guess\n');
    expect(buildShareText(rec, puzzle)).toContain('#042');
  });
});
