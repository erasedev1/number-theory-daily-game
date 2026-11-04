/**
 * Random puzzle generator. Every result is exhaustively validated: exactly one solution
 * in [1, max] and no redundant clue. Used by scripts/generate-puzzles.ts (curated pool)
 * and by Unlimited mode at runtime (deterministic from a seed).
 */
import { getClue } from './clues';
import { findSolutions, validatePuzzle, type Difficulty, type PuzzleDef } from './validate';
import { mulberry32 } from './rng';
import * as M from './math';

export interface Spec {
  count: number;
  maxes: number[];
  clueCounts: number[];
  maxClueDifficulty: 1 | 2 | 3;
  minHard: number; // minimum # of difficulty-3 clues
  maxHard: number;
  needsModOrStructure: boolean;
}

export const SPECS: Record<Difficulty, Spec> = {
  easy: { count: 10, maxes: [100, 150, 200], clueCounts: [4], maxClueDifficulty: 2, minHard: 0, maxHard: 0, needsModOrStructure: false },
  medium: { count: 26, maxes: [300, 500, 750, 1000], clueCounts: [5], maxClueDifficulty: 3, minHard: 0, maxHard: 1, needsModOrStructure: true },
  hard: { count: 10, maxes: [2000, 3000, 5000], clueCounts: [5, 6], maxClueDifficulty: 3, minHard: 2, maxHard: 4, needsModOrStructure: true },
};

function candidateIds(n: number, max: number): string[] {
  const ids: string[] = [];
  ids.push(M.isEven(n) ? 'even' : 'odd');
  for (const d of M.divisors(n)) if (d >= 2 && d <= 40 && d !== n) ids.push(`div:${d}`);
  for (let k = 3; k <= 13; k++) if (n % k !== 0) ids.push(`notdiv:${k}`);
  for (let m = 3; m <= 12; m++) ids.push(`mod:${m}:${n % m}`);
  ids.push(`tau:${M.divisorCount(n)}`, `sigma:${M.divisorSum(n)}`, `phi:${M.totient(n)}`);
  ids.push(`omega:${M.distinctPrimeFactors(n)}`, `bigomega:${M.primeFactorsWithMultiplicity(n)}`);
  if (n > 1) ids.push(`lpf:${M.largestPrimeFactor(n)}`);
  const flags: Array<[string, boolean]> = [
    ['prime', M.isPrime(n)],
    ['composite', M.isComposite(n)],
    ['semiprime', M.isSemiprime(n)],
    ['squarefree', M.isSquarefree(n)],
    ['square', M.isPerfectSquare(n)],
    ['cube', M.isPerfectCube(n)],
    ['perfectpower', M.isPerfectPower(n)],
    ['pow2', M.isPowerOfTwo(n)],
    ['triangular', M.isTriangular(n)],
    ['fibonacci', M.isFibonacci(n)],
    ['palindrome', M.isPalindrome(n)],
    ['revprime', M.isPrime(M.reverseDigits(n))],
    ['revlarger', M.reverseDigits(n) > n],
  ];
  for (const [id, ok] of flags) if (ok) ids.push(id);
  ids.push(`digitsum:${M.digitSum(n)}`, `digits:${M.digitCount(n)}`, `ends:${n % 10}`);
  if (M.digitProduct(n) > 0) ids.push(`digitprod:${M.digitProduct(n)}`);
  for (const d of new Set(M.digits(n))) ids.push(`contains:${d}`);
  // round-number bounds
  const steps = max <= 200 ? [10, 25] : max <= 1000 ? [25, 50, 100] : [100, 250, 500];
  for (const s of steps) {
    const lo = Math.floor((n - 1) / s) * s;
    const hi = Math.ceil((n + 1) / s) * s;
    if (lo >= 1 && lo < n) ids.push(`gt:${lo}`);
    if (hi > n && hi < max) ids.push(`lt:${hi}`);
  }
  // keep only truly valid ids
  return [...new Set(ids)].filter((id) => {
    try {
      return getClue(id).test(n);
    } catch {
      return false;
    }
  });
}

function pick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

export function tryBuild(rnd: () => number, level: Difficulty, spec: Spec, usedAnswers: Set<number>): { def: Omit<PuzzleDef, 'id'>; answer: number } | null {
  const max = pick(rnd, spec.maxes);
  const lo = Math.max(2, Math.floor(max * 0.08));
  const n = lo + Math.floor(rnd() * (max - lo));
  if (usedAnswers.has(n)) return null;
  const pool = candidateIds(n, max).filter((id) => getClue(id).difficulty <= spec.maxClueDifficulty);
  const k = pick(rnd, spec.clueCounts);
  if (pool.length < k + 2) return null;
  // sample k distinct clues
  const chosen: string[] = [];
  const rest = [...pool];
  while (chosen.length < k && rest.length) chosen.push(rest.splice(Math.floor(rnd() * rest.length), 1)[0]);
  const clues = chosen.map(getClue);
  // composition rules
  const count = (pred: (c: ReturnType<typeof getClue>) => boolean) => clues.filter(pred).length;
  if (count((c) => c.category === 'size') > 2) return null;
  if (count((c) => c.category === 'parity') > 1) return null;
  if (count((c) => c.category === 'digits') > (level === 'hard' ? 2 : 1)) return null;
  if (count((c) => c.category === 'divisibility') > 2) return null;
  const modCount = count((c) => c.category === 'modular');
  if (modCount > (level === 'hard' ? 2 : 1)) return null;
  const moduli = chosen.filter((i) => i.startsWith('mod:')).map((i) => Number(i.split(':')[1]));
  if (moduli.some((a, i) => moduli.some((b, j) => i < j && M.gcd(a, b) > 1))) return null;
  if (chosen.some((i) => i.startsWith('mod:') && i.endsWith(':0'))) return null;
  if (chosen.includes('div:2')) return null;
  const structural = count((c) => ['divisors', 'primes', 'powers', 'sequences'].includes(c.category));
  if (structural < (level === 'easy' ? 1 : 2)) return null;
  if (level !== 'easy' && count((c) => c.category === 'divisibility') > 1) return null;
  if (new Set(clues.map((c) => c.category)).size < 3) return null;
  const hard = count((c) => c.difficulty === 3);
  if (hard < spec.minHard || hard > spec.maxHard) return null;
  if (spec.needsModOrStructure && count((c) => ['modular', 'divisors', 'primes', 'powers', 'sequences'].includes(c.category)) < 2) return null;
  if (level === 'medium' && modCount < 1 && rnd() < 0.5) return null;
  // avoid both "prime"-style and divisibility-by-small clues which are semantically near-contradictory
  const ids = new Set(chosen);
  if (ids.has('prime') && (ids.has('composite') || [...ids].some((i) => i.startsWith('omega') || i.startsWith('bigomega')))) return null;
  if (ids.has('even') && [...ids].some((i) => i.startsWith('div:') && Number(i.slice(4)) % 2 === 0)) return null;
  if (ids.has('square') && [...ids].some((i) => i === 'perfectpower' || i === 'cube')) return null;
  // uniqueness over the whole range
  const sols = findSolutions(chosen, max);
  if (sols.length !== 1 || sols[0] !== n) return null;
  // informativeness: each clue must matter and no clue may be true of almost everything
  const def = { difficulty: level, max, clues: chosen };
  const v = validatePuzzle({ id: 'tmp', ...def });
  if (!v.ok) return null;
  for (const id of chosen) {
    const t = getClue(id).test;
    let hit = 0;
    for (let x = 1; x <= max; x++) if (t(x)) hit++;
    if (hit > max * 0.97) return null;
  }
  // a single clue should not pin the answer to <= 3 numbers in the early steps
  for (const id of chosen) if (findSolutions([id], max).length <= 3) return null;
  return { def, answer: n };
}


/** Deterministically generate a validated puzzle for a seed (Unlimited mode). */
export function generatePuzzle(difficulty: Difficulty, seed: number): { def: PuzzleDef; answer: number } {
  const rnd = mulberry32(seed);
  // Runtime hard mode relaxes the "advanced clue" quota slightly so generation stays fast.
  const spec = difficulty === 'hard' ? { ...SPECS.hard, minHard: 1 } : SPECS[difficulty];
  for (;;) {
    const r = tryBuild(rnd, difficulty, spec, new Set());
    if (r) return { def: { id: `u-${difficulty[0]}-${seed}`, ...r.def }, answer: r.answer };
  }
}
