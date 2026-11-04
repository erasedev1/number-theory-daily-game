/**
 * Pure number-theory utilities. All functions expect positive safe integers
 * unless noted, and use exact integer arithmetic (no floating-point approximations
 * for the properties themselves).
 */

export type Factorization = ReadonlyArray<readonly [prime: number, exponent: number]>;

const factorCache = new Map<number, Factorization>();

function assertPositiveInt(n: number): void {
  if (!Number.isSafeInteger(n) || n < 1) throw new RangeError(`Expected a positive integer, got ${n}`);
}

/** Prime factorization as ascending [prime, exponent] pairs. factorize(1) === []. */
export function factorize(n: number): Factorization {
  assertPositiveInt(n);
  const cached = factorCache.get(n);
  if (cached) return cached;
  const result: Array<[number, number]> = [];
  let m = n;
  for (let p = 2; p * p <= m; p += p === 2 ? 1 : 2) {
    if (m % p === 0) {
      let e = 0;
      while (m % p === 0) {
        m /= p;
        e++;
      }
      result.push([p, e]);
    }
  }
  if (m > 1) result.push([m, 1]);
  if (factorCache.size < 50_000) factorCache.set(n, result);
  return result;
}

/** d(n) = (a1+1)(a2+1)...(ak+1) */
export function divisorCount(n: number): number {
  return factorize(n).reduce((acc, [, e]) => acc * (e + 1), 1);
}

/** σ(n) = Π (p^(a+1) - 1)/(p - 1) */
export function divisorSum(n: number): number {
  return factorize(n).reduce((acc, [p, e]) => {
    let term = 1;
    let pow = 1;
    for (let i = 0; i < e; i++) {
      pow *= p;
      term += pow;
    }
    return acc * term;
  }, 1);
}

/** All positive divisors in ascending order. */
export function divisors(n: number): number[] {
  let divs = [1];
  for (const [p, e] of factorize(n)) {
    const next: number[] = [];
    let pow = 1;
    for (let i = 0; i <= e; i++) {
      for (const d of divs) next.push(d * pow);
      pow *= p;
    }
    divs = next;
  }
  return divs.sort((a, b) => a - b);
}

/** Euler's totient φ(n) = n Π (1 - 1/p). */
export function totient(n: number): number {
  return factorize(n).reduce((acc, [p]) => (acc / p) * (p - 1), n);
}

export function isPrime(n: number): boolean {
  if (!Number.isSafeInteger(n) || n < 2) return false;
  const f = factorize(n);
  return f.length === 1 && f[0][1] === 1;
}

/** Composite: an integer greater than 1 that is not prime. (1 is neither.) */
export function isComposite(n: number): boolean {
  return Number.isSafeInteger(n) && n > 1 && !isPrime(n);
}

export function isqrt(n: number): number {
  let r = Math.floor(Math.sqrt(n));
  while (r * r > n) r--;
  while ((r + 1) * (r + 1) <= n) r++;
  return r;
}

export function icbrt(n: number): number {
  let r = Math.round(Math.cbrt(n));
  while (r * r * r > n) r--;
  while ((r + 1) * (r + 1) * (r + 1) <= n) r++;
  return r;
}

export function isPerfectSquare(n: number): boolean {
  if (!Number.isSafeInteger(n) || n < 0) return false;
  const r = isqrt(n);
  return r * r === n;
}

export function isPerfectCube(n: number): boolean {
  if (!Number.isSafeInteger(n) || n < 0) return false;
  const r = icbrt(n);
  return r * r * r === n;
}

/** A perfect power is a^b for integers a ≥ 2 and b ≥ 2. (1 is excluded.) */
export function isPerfectPower(n: number): boolean {
  if (!Number.isSafeInteger(n) || n < 2) return false;
  const f = factorize(n);
  const g = f.reduce((acc, [, e]) => gcd(acc, e), 0);
  return g >= 2;
}

export function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a);
}

export function isDivisibleBy(n: number, k: number): boolean {
  if (!Number.isInteger(k) || k === 0) return false;
  return n % k === 0;
}

/** Non-negative remainder (matches mathematical convention for negative n too). */
export function mod(n: number, m: number): number {
  if (!Number.isInteger(m) || m <= 0) throw new RangeError('modulus must be a positive integer');
  return ((n % m) + m) % m;
}

export function isCongruent(n: number, residue: number, modulus: number): boolean {
  return mod(n, modulus) === mod(residue, modulus);
}

export function digits(n: number): number[] {
  assertPositiveInt(n);
  return String(n).split('').map(Number);
}

export function digitSum(n: number): number {
  return digits(n).reduce((a, b) => a + b, 0);
}

export function digitProduct(n: number): number {
  return digits(n).reduce((a, b) => a * b, 1);
}

export function digitCount(n: number): number {
  return String(n).length;
}

/** Reverses decimal digits: 120 -> 21. */
export function reverseDigits(n: number): number {
  assertPositiveInt(n);
  return Number(String(n).split('').reverse().join(''));
}

export function isPalindrome(n: number): boolean {
  if (!Number.isSafeInteger(n) || n < 1) return false;
  const s = String(n);
  return s === s.split('').reverse().join('');
}

/** Number of distinct prime factors, ω(n). */
export function distinctPrimeFactors(n: number): number {
  return factorize(n).length;
}

/** Number of prime factors counted with multiplicity, Ω(n). */
export function primeFactorsWithMultiplicity(n: number): number {
  return factorize(n).reduce((a, [, e]) => a + e, 0);
}

export function largestPrimeFactor(n: number): number {
  const f = factorize(n);
  return f.length ? f[f.length - 1][0] : 1;
}

export function isEven(n: number): boolean {
  return n % 2 === 0;
}
export function isOdd(n: number): boolean {
  return Math.abs(n % 2) === 1;
}

/** T_k = k(k+1)/2 : 1, 3, 6, 10, 15, ... n is triangular iff 8n+1 is a perfect square. */
export function isTriangular(n: number): boolean {
  return Number.isSafeInteger(n) && n >= 1 && isPerfectSquare(8 * n + 1);
}

/** n is Fibonacci iff 5n²+4 or 5n²-4 is a perfect square. */
export function isFibonacci(n: number): boolean {
  if (!Number.isSafeInteger(n) || n < 1) return false;
  return isPerfectSquare(5 * n * n + 4) || isPerfectSquare(5 * n * n - 4);
}

export function isSquarefree(n: number): boolean {
  return factorize(n).every(([, e]) => e === 1);
}

export function isPowerOfTwo(n: number): boolean {
  return Number.isSafeInteger(n) && n >= 1 && (n & (n - 1)) === 0;
}

/** Semiprime: product of exactly two primes (not necessarily distinct). */
export function isSemiprime(n: number): boolean {
  return Number.isSafeInteger(n) && n >= 4 && primeFactorsWithMultiplicity(n) === 2;
}

/** Multiples of k up to and including limit. */
export function multiplesOf(k: number, limit: number): number[] {
  const out: number[] = [];
  for (let m = k; m <= limit; m += k) out.push(m);
  return out;
}

const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export function superscript(n: number): string {
  return String(n).replace(/\d/g, (d) => SUPERSCRIPTS[Number(d)]);
}

/** "2³ × 3 × 5²" ; "1" for 1. */
export function formatFactorization(n: number): string {
  const f = factorize(n);
  if (f.length === 0) return '1';
  return f.map(([p, e]) => (e === 1 ? `${p}` : `${p}${superscript(e)}`)).join(' × ');
}
