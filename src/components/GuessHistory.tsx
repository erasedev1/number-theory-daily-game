import type { Puzzle } from '../puzzles/puzzle';
import { evaluateGuess } from '../game/game';

export function GuessHistory({ puzzle, guesses }: { puzzle: Puzzle; guesses: number[] }) {
  if (guesses.length === 0) return null;
  // newest first
  const rows = guesses.map((g, i) => ({ g, i, result: evaluateGuess(puzzle, g) })).reverse();
  return (
    <section aria-label="Guess history">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Guesses · {guesses.length}</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {rows.map(({ g, i, result }, idx) => {
          const hits = result.filter(Boolean).length;
          const win = g === puzzle.answer;
          return (
            <li key={g} className={`flex items-center gap-3 px-4 py-2.5 ${idx === 0 ? 'anim-rise' : ''}`}>
              <span className="num w-6 text-xs text-muted">{i + 1}</span>
              <span className={`num flex-1 text-lg font-bold ${win ? 'text-good' : ''}`}>{g.toLocaleString('en-US')}</span>
              <span className="flex gap-1" aria-hidden>
                {result.map((ok, k) => (
                  <span key={k} className={`h-3.5 w-3.5 rounded-[4px] ${ok ? 'bg-good' : 'bg-line'}`} />
                ))}
              </span>
              <span className="num w-10 text-right text-sm font-semibold" aria-label={`${hits} of ${result.length} clues satisfied`}>
                {hits}/{result.length}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
