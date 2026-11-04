import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Modal } from './Modal';
import { ClueList } from './ClueList';
import { buildPuzzle } from '../puzzles/puzzle';
import { evaluateGuess, validateGuess } from '../game/game';

/** A tiny live puzzle that runs on the real engine. 36 is the only number below 100 meeting all these clues. */
const EXAMPLE = buildPuzzle({ id: 'tutorial', difficulty: 'easy', max: 99, clues: ['div:4', 'tau:9', 'square', 'div:3', 'lt:100'] });
// (The tutorial puzzle intentionally contains redundant clues; it is not part of the daily pool.)

export function HowToModal({ onClose }: { onClose: () => void }) {
  const [guesses, setGuesses] = useState<number[]>([]);
  const [raw, setRaw] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const last = guesses[guesses.length - 1];
  const states = useMemo(() => (last ? evaluateGuess(EXAMPLE, last) : null), [last]);
  const solved = last === EXAMPLE.answer;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateGuess(raw, EXAMPLE, guesses);
    if (!v.ok) return setMsg(v.error);
    setMsg(null);
    setRaw('');
    setGuesses((g) => [...g, v.value]);
  };

  const steps = [
    'Each day there is a hidden positive integer.',
    'You are given a list of mathematical clues about it.',
    'Enter a number and submit your guess.',
    'Green clues are properties your guess satisfies.',
    'Gray clues are properties your guess does not satisfy.',
    'Use the feedback to narrow down the possibilities.',
    'Find the exact number in as few guesses as possible.',
  ];

  return (
    <Modal title="How to play" onClose={onClose}>
      <ol className="space-y-2 text-[15px]">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-sm text-muted">
        Each clue shows whether your <b className="text-ink">latest</b> guess satisfies it. Submit another guess and every clue is re-checked.
      </p>

      <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-widest text-muted">Try it</h3>
      <p className="mb-2 text-sm">Find a number from 1 to 99. Try 16, then think.</p>
      <ClueList clues={EXAMPLE.clues} states={states} />
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          inputMode="numeric"
          aria-label="Example guess"
          placeholder="Guess"
          disabled={solved}
          className="num min-w-0 flex-1 rounded-xl border-2 border-line bg-bg px-3 py-2 text-lg font-semibold outline-none focus:border-ink"
        />
        <button className="btn h-11 bg-ink text-bg" disabled={solved}>
          Try
        </button>
      </form>
      <p className={`mt-2 min-h-5 text-sm ${msg ? 'text-bad' : 'text-muted'}`}>
        {msg ??
          (solved ? (
            <span className="inline-flex items-center gap-1 font-semibold text-good">
              <Check size={16} /> 36 — a square with 9 divisors, divisible by 4 and 3. You've got it!
            </span>
          ) : last ? `${guesses.length} guess${guesses.length === 1 ? '' : 'es'} so far.` : '')}
      </p>
      <button className="btn mt-3 h-12 w-full bg-good text-good-ink" onClick={onClose}>
        Play today's INTEGER
      </button>
    </Modal>
  );
}
