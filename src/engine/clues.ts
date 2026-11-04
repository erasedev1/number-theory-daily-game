import * as M from './math';

export type ClueCategory =
  | 'divisibility'
  | 'modular'
  | 'divisors'
  | 'primes'
  | 'powers'
  | 'digits'
  | 'sequences'
  | 'size'
  | 'parity';

export interface Clue {
  /** Stable unique id, e.g. "div:7", "tau:6", "square". */
  id: string;
  /** Human-readable sentence, e.g. "It is divisible by 7." */
  text: string;
  category: ClueCategory;
  /** 1 (basic) – 3 (sophisticated). */
  difficulty: 1 | 2 | 3;
  /** Does n satisfy this clue? */
  test: (n: number) => boolean;
  /** Short mathematical justification of why `n` satisfies the clue. */
  explain: (n: number) => string;
}


interface Spec {
  /** Parameter count. */
  arity: number;
  build: (args: number[]) => Omit<Clue, 'id'> | null;
}

const fact = (n: number) => `${n} = ${M.formatFactorization(n)}`;

const SPECS: Record<string, Spec> = {
  even: {
    arity: 0,
    build: () => ({
      text: 'It is even.',
      category: 'parity',
      difficulty: 1,
      test: M.isEven,
      explain: (n) => `${n} is even.`,
    }),
  },
  odd: {
    arity: 0,
    build: () => ({
      text: 'It is odd.',
      category: 'parity',
      difficulty: 1,
      test: M.isOdd,
      explain: (n) => `${n} is odd.`,
    }),
  },
  gt: {
    arity: 1,
    build: ([k]) => ({
      text: `It is greater than ${k}.`,
      category: 'size',
      difficulty: 1,
      test: (n) => n > k,
      explain: (n) => `${n} > ${k}.`,
    }),
  },
  lt: {
    arity: 1,
    build: ([k]) => ({
      text: `It is less than ${k}.`,
      category: 'size',
      difficulty: 1,
      test: (n) => n < k,
      explain: (n) => `${n} < ${k}.`,
    }),
  },
  div: {
    arity: 1,
    build: ([k]) =>
      k < 2
        ? null
        : {
            text: `It is divisible by ${k}.`,
            category: 'divisibility',
            difficulty: k <= 5 ? 1 : 2,
            test: (n) => M.isDivisibleBy(n, k),
            explain: (n) => `${n} = ${k} × ${n / k}.`,
          },
  },
  notdiv: {
    arity: 1,
    build: ([k]) =>
      k < 2
        ? null
        : {
            text: `It is not divisible by ${k}.`,
            category: 'divisibility',
            difficulty: 2,
            test: (n) => !M.isDivisibleBy(n, k),
            explain: (n) => `${n} leaves remainder ${n % k} when divided by ${k}.`,
          },
  },
  mod: {
    arity: 2,
    build: ([m, r]) =>
      m < 2 || r < 0 || r >= m
        ? null
        : {
            text: `It is congruent to ${r} modulo ${m}.`,
            category: 'modular',
            difficulty: 2,
            test: (n) => M.isCongruent(n, r, m),
            explain: (n) => `${n} = ${m} × ${Math.floor(n / m)} + ${r}, so ${n} ≡ ${r} (mod ${m}).`,
          },
  },
  tau: {
    arity: 1,
    build: ([k]) =>
      k < 1
        ? null
        : {
            text: `It has exactly ${k} positive divisors.`,
            category: 'divisors',
            difficulty: 2,
            test: (n) => M.divisorCount(n) === k,
            explain: (n) => {
              const f = M.factorize(n);
              const prod = f.length ? f.map(([, e]) => `(${e}+1)`).join('') : '1';
              return `${fact(n)}, so d(${n}) = ${prod} = ${k}.`;
            },
          },
  },
  sigma: {
    arity: 1,
    build: ([k]) =>
      k < 1
        ? null
        : {
            text: `The sum of its positive divisors is ${k}.`,
            category: 'divisors',
            difficulty: 3,
            test: (n) => M.divisorSum(n) === k,
            explain: (n) => `Its divisors are ${M.divisors(n).join(' + ')} = ${k}.`,
          },
  },
  phi: {
    arity: 1,
    build: ([k]) =>
      k < 1
        ? null
        : {
            text: `Exactly ${k} positive integers up to it are coprime to it.`,
            category: 'divisors',
            difficulty: 3,
            test: (n) => M.totient(n) === k,
            explain: (n) => `φ(${n}) = ${k} (Euler's totient), since ${fact(n)}.`,
          },
  },
  omega: {
    arity: 1,
    build: ([k]) =>
      k < 0
        ? null
        : {
            text: `It has exactly ${k} distinct prime factor${k === 1 ? '' : 's'}.`,
            category: 'primes',
            difficulty: 2,
            test: (n) => M.distinctPrimeFactors(n) === k,
            explain: (n) => `${fact(n)}: ${k} distinct prime${k === 1 ? '' : 's'}.`,
          },
  },
  bigomega: {
    arity: 1,
    build: ([k]) =>
      k < 0
        ? null
        : {
            text: `It is a product of exactly ${k} primes, counting repeats.`,
            category: 'primes',
            difficulty: 3,
            test: (n) => M.primeFactorsWithMultiplicity(n) === k,
            explain: (n) => `${fact(n)}: ${k} prime factors with multiplicity.`,
          },
  },
  lpf: {
    arity: 1,
    build: ([p]) =>
      !M.isPrime(p)
        ? null
        : {
            text: `Its largest prime factor is ${p}.`,
            category: 'primes',
            difficulty: 2,
            test: (n) => M.largestPrimeFactor(n) === p,
            explain: (n) => `${fact(n)}: the largest prime is ${p}.`,
          },
  },
  prime: {
    arity: 0,
    build: () => ({
      text: 'It is a prime number.',
      category: 'primes',
      difficulty: 1,
      test: M.isPrime,
      explain: (n) => `${n} has no divisors other than 1 and itself.`,
    }),
  },
  composite: {
    arity: 0,
    build: () => ({
      text: 'It is a composite number.',
      category: 'primes',
      difficulty: 1,
      test: M.isComposite,
      explain: (n) => `${fact(n)} is composite.`,
    }),
  },
  semiprime: {
    arity: 0,
    build: () => ({
      text: 'It is a semiprime (a product of two primes).',
      category: 'primes',
      difficulty: 2,
      test: M.isSemiprime,
      explain: (n) => `${fact(n)}: exactly two prime factors.`,
    }),
  },
  squarefree: {
    arity: 0,
    build: () => ({
      text: 'It is squarefree (no square greater than 1 divides it).',
      category: 'primes',
      difficulty: 3,
      test: M.isSquarefree,
      explain: (n) => `${fact(n)}: every exponent is 1.`,
    }),
  },
  square: {
    arity: 0,
    build: () => ({
      text: 'It is a perfect square.',
      category: 'powers',
      difficulty: 1,
      test: M.isPerfectSquare,
      explain: (n) => `${n} = ${Math.round(Math.sqrt(n))}².`,
    }),
  },
  cube: {
    arity: 0,
    build: () => ({
      text: 'It is a perfect cube.',
      category: 'powers',
      difficulty: 2,
      test: M.isPerfectCube,
      explain: (n) => `${n} = ${M.icbrt(n)}³.`,
    }),
  },
  perfectpower: {
    arity: 0,
    build: () => ({
      text: 'It is a perfect power (a^b with a, b ≥ 2).',
      category: 'powers',
      difficulty: 2,
      test: M.isPerfectPower,
      explain: (n) => `${fact(n)} is a perfect power.`,
    }),
  },
  pow2: {
    arity: 0,
    build: () => ({
      text: 'It is a power of two.',
      category: 'powers',
      difficulty: 1,
      test: M.isPowerOfTwo,
      explain: (n) => `${n} = 2^${Math.round(Math.log2(n))}.`,
    }),
  },
  triangular: {
    arity: 0,
    build: () => ({
      text: 'It is a triangular number.',
      category: 'sequences',
      difficulty: 2,
      test: M.isTriangular,
      explain: (n) => {
        const k = (M.isqrt(8 * n + 1) - 1) / 2;
        return `${n} = 1 + 2 + … + ${k} = ${k}(${k}+1)/2.`;
      },
    }),
  },
  fibonacci: {
    arity: 0,
    build: () => ({
      text: 'It is a Fibonacci number.',
      category: 'sequences',
      difficulty: 2,
      test: M.isFibonacci,
      explain: (n) => `${n} appears in the Fibonacci sequence.`,
    }),
  },
  palindrome: {
    arity: 0,
    build: () => ({
      text: 'It is a palindrome.',
      category: 'digits',
      difficulty: 1,
      test: M.isPalindrome,
      explain: (n) => `${n} reads the same forwards and backwards.`,
    }),
  },
  digitsum: {
    arity: 1,
    build: ([k]) =>
      k < 1
        ? null
        : {
            text: `Its digit sum is ${k}.`,
            category: 'digits',
            difficulty: 1,
            test: (n) => M.digitSum(n) === k,
            explain: (n) => `${M.digits(n).join(' + ')} = ${k}.`,
          },
  },
  digitprod: {
    arity: 1,
    build: ([k]) =>
      k < 0
        ? null
        : {
            text: `The product of its digits is ${k}.`,
            category: 'digits',
            difficulty: 2,
            test: (n) => M.digitProduct(n) === k,
            explain: (n) => `${M.digits(n).join(' × ')} = ${k}.`,
          },
  },
  digits: {
    arity: 1,
    build: ([k]) =>
      k < 1
        ? null
        : {
            text: `It has exactly ${k} digit${k === 1 ? '' : 's'}.`,
            category: 'digits',
            difficulty: 1,
            test: (n) => M.digitCount(n) === k,
            explain: (n) => `${n} has ${k} digit${k === 1 ? '' : 's'}.`,
          },
  },
  ends: {
    arity: 1,
    build: ([d]) =>
      d < 0 || d > 9
        ? null
        : {
            text: `Its last digit is ${d}.`,
            category: 'digits',
            difficulty: 1,
            test: (n) => n % 10 === d,
            explain: (n) => `${n} ends in ${d}.`,
          },
  },
  contains: {
    arity: 1,
    build: ([d]) =>
      d < 0 || d > 9
        ? null
        : {
            text: `Its decimal form contains the digit ${d}.`,
            category: 'digits',
            difficulty: 1,
            test: (n) => String(n).includes(String(d)),
            explain: (n) => `${n} contains a ${d}.`,
          },
  },
  revprime: {
    arity: 0,
    build: () => ({
      text: 'Reading its digits backwards gives a prime number.',
      category: 'digits',
      difficulty: 3,
      test: (n) => M.isPrime(M.reverseDigits(n)),
      explain: (n) => `Reversed, ${n} becomes ${M.reverseDigits(n)}, which is prime.`,
    }),
  },
  revlarger: {
    arity: 0,
    build: () => ({
      text: 'Reading its digits backwards gives a larger number.',
      category: 'digits',
      difficulty: 2,
      test: (n) => M.reverseDigits(n) > n,
      explain: (n) => `Reversed, ${n} becomes ${M.reverseDigits(n)} > ${n}.`,
    }),
  },
};

const cache = new Map<string, Clue | null>();

/** Build a clue from its id ("div:7", "mod:5:2", "square", ...). Throws for unknown ids. */
export function getClue(id: string): Clue {
  const hit = cache.get(id);
  if (hit) return hit;
  const [name, ...rest] = id.split(':');
  const spec = SPECS[name];
  const args = rest.map(Number);
  if (!spec || args.length !== spec.arity || args.some((a) => !Number.isInteger(a))) {
    throw new Error(`Unknown clue id: ${id}`);
  }
  const built = spec.build(args);
  if (!built) throw new Error(`Invalid clue parameters: ${id}`);
  const clue: Clue = { id, ...built };
  cache.set(id, clue);
  return clue;
}

export function tryGetClue(id: string): Clue | null {
  try {
    return getClue(id);
  } catch {
    return null;
  }
}

export const CLUE_KINDS = Object.keys(SPECS);

