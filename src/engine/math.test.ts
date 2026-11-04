import { describe, expect, it } from 'vitest';
import * as M from './math';

describe('factorize', () => {
  it('handles 1, primes and prime powers', () => {
    expect(M.factorize(1)).toEqual([]);
    expect(M.factorize(2)).toEqual([[2, 1]]);
    expect(M.factorize(97)).toEqual([[97, 1]]);
    expect(M.factorize(1024)).toEqual([[2, 10]]);
  });
  it('factors composites', () => {
    expect(M.factorize(360)).toEqual([[2, 3], [3, 2], [5, 1]]);
    expect(M.factorize(9991)).toEqual([[97, 1], [103, 1]]);
    expect(M.factorize(2 * 3 * 5 * 7 * 11 * 13)).toHaveLength(6);
  });
  it('reconstructs every n up to 3000', () => {
    for (let n = 1; n <= 3000; n++) {
      expect(M.factorize(n).reduce((a, [p, e]) => a * p ** e, 1)).toBe(n);
    }
  });
  it('rejects invalid input', () => {
    expect(() => M.factorize(0)).toThrow();
    expect(() => M.factorize(-4)).toThrow();
    expect(() => M.factorize(1.5)).toThrow();
  });
  it('formats', () => expect(M.formatFactorization(360)).toBe('2³ × 3² × 5'));
});

describe('divisors', () => {
  it('counts via d(n) = Π(a+1) and matches brute force', () => {
    for (let n = 1; n <= 2000; n++) {
      let brute = 0;
      for (let d = 1; d <= n; d++) if (n % d === 0) brute++;
      expect(M.divisorCount(n)).toBe(brute);
    }
    expect(M.divisorCount(36)).toBe(9);
    expect(M.divisorCount(1)).toBe(1);
  });
  it('sums and lists divisors', () => {
    expect(M.divisorSum(28)).toBe(56);
    expect(M.divisors(36)).toEqual([1, 2, 3, 4, 6, 9, 12, 18, 36]);
    for (let n = 1; n <= 500; n++) expect(M.divisorSum(n)).toBe(M.divisors(n).reduce((a, b) => a + b, 0));
  });
  it('totient matches brute force', () => {
    for (let n = 1; n <= 300; n++) {
      let c = 0;
      for (let k = 1; k <= n; k++) if (M.gcd(n, k) === 1) c++;
      expect(M.totient(n)).toBe(c);
    }
  });
});

describe('primes and powers', () => {
  it('prime / composite', () => {
    expect([1, 2, 3, 4, 5, 9, 11, 91, 97].map(M.isPrime)).toEqual([false, true, true, false, true, false, true, false, true]);
    expect(M.isComposite(1)).toBe(false);
    expect(M.isComposite(2)).toBe(false);
    expect(M.isComposite(91)).toBe(true);
  });
  it('squares, cubes, perfect powers', () => {
    expect([0, 1, 4, 15, 16, 10000].map(M.isPerfectSquare)).toEqual([true, true, true, false, true, true]);
    expect([1, 8, 9, 27, 1000, 999].map(M.isPerfectCube)).toEqual([true, true, false, true, true, false]);
    expect([1, 4, 8, 16, 36, 72, 100, 128, 243].map(M.isPerfectPower)).toEqual([false, true, true, true, true, false, true, true, true]);
  });
  it('semiprime, squarefree, power of two', () => {
    expect([4, 6, 8, 15, 221].map(M.isSemiprime)).toEqual([true, true, false, true, true]);
    expect([1, 6, 12, 30, 50].map(M.isSquarefree)).toEqual([true, true, false, true, false]);
    expect([1, 2, 3, 64, 96].map(M.isPowerOfTwo)).toEqual([true, true, false, true, false]);
  });
});

describe('modular arithmetic & digits', () => {
  it('mod is non-negative', () => {
    expect(M.mod(-1, 5)).toBe(4);
    expect(M.mod(12, 5)).toBe(2);
    expect(M.isCongruent(17, 2, 5)).toBe(true);
    expect(M.isCongruent(17, -3, 5)).toBe(true);
    expect(M.isCongruent(17, 3, 5)).toBe(false);
    expect(() => M.mod(3, 0)).toThrow();
  });
  it('divisibility', () => {
    expect(M.isDivisibleBy(36, 4)).toBe(true);
    expect(M.isDivisibleBy(36, 5)).toBe(false);
    expect(M.isDivisibleBy(36, 0)).toBe(false);
    expect(M.multiplesOf(7, 30)).toEqual([7, 14, 21, 28]);
  });
  it('digit utilities', () => {
    expect(M.digitSum(9875)).toBe(29);
    expect(M.digitProduct(234)).toBe(24);
    expect(M.reverseDigits(1200)).toBe(21);
    expect(M.isPalindrome(12321)).toBe(true);
    expect(M.isPalindrome(1231)).toBe(false);
    expect(M.digitCount(1000)).toBe(4);
  });
  it('omega, parity, largest prime factor', () => {
    expect(M.distinctPrimeFactors(360)).toBe(3);
    expect(M.primeFactorsWithMultiplicity(360)).toBe(6);
    expect(M.distinctPrimeFactors(1)).toBe(0);
    expect(M.largestPrimeFactor(360)).toBe(5);
    expect(M.isEven(10) && !M.isEven(7) && M.isOdd(7) && !M.isOdd(10)).toBe(true);
  });
  it('triangular and fibonacci', () => {
    const tri = new Set<number>();
    for (let k = 1; k < 60; k++) tri.add((k * (k + 1)) / 2);
    for (let n = 1; n <= 1500; n++) expect(M.isTriangular(n)).toBe(tri.has(n));
    const fib = new Set([1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987]);
    for (let n = 1; n <= 1000; n++) expect(M.isFibonacci(n)).toBe(fib.has(n));
  });
});
