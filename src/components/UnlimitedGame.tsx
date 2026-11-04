import { RefreshCw, Loader2 } from 'lucide-react';
import { ClueList } from './ClueList';
import { GuessForm } from './GuessForm';
import { GuessHistory } from './GuessHistory';
import { WinPanel } from './WinPanel';
import { evaluateGuess } from '../game/game';
import { useUnlimited } from '../hooks/useUnlimited';
import type { Difficulty } from '../engine/validate';

const LEVELS: Array<[Difficulty, string]> = [
  ['easy', 'Easy'],
  ['medium', 'Medium'],
  ['hard', 'Hard'],
];

export function UnlimitedGame() {
  const { state, puzzle, game, start, guess } = useUnlimited(true);
  const solved = game?.solved ?? false;
  const guesses = game?.guesses ?? [];
  const last = guesses[guesses.length - 1];
  const states = puzzle && last !== undefined ? evaluateGuess(puzzle, last) : null;

  return (
    <>
      <div className="space-y-3 text-center">
        <p className="text-lg text-muted">Unlimited practice — a fresh puzzle whenever you want.</p>
        <div className="mx-auto grid max-w-xs grid-cols-3 gap-1 rounded-xl bg-surface p-1" role="radiogroup" aria-label="Difficulty">
          {LEVELS.map(([value, label]) => (
            <button
              key={value}
              role="radio"
              aria-checked={state.difficulty === value}
              onClick={() => state.difficulty !== value && start(value)}
              className={`rounded-lg py-1.5 text-sm font-semibold transition ${state.difficulty === value ? 'bg-bg shadow-sm' : 'text-muted hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="num text-xs text-muted">Solved in Unlimited: {state.solvedCount} · doesn't affect daily stats</p>
      </div>

      {!puzzle || !game ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted" role="status">
          <Loader2 size={18} className="animate-spin" /> Generating a puzzle…
        </div>
      ) : (
        <>
          <ClueList clues={puzzle.clues} states={states} />
          {solved ? (
            <WinPanel
              puzzle={puzzle}
              record={{ date: '', puzzleId: puzzle.def.id, puzzleNumber: 0, guesses, solved }}
              fresh
              footer={
                <button onClick={() => start(state.difficulty)} className="btn h-12 w-full bg-good text-good-ink hover:opacity-90">
                  <RefreshCw size={18} /> New puzzle
                </button>
              }
            />
          ) : (
            <>
              <GuessForm key={`${game.difficulty}:${game.seed}`} max={puzzle.max} onSubmit={guess} />
              {guesses.length > 0 && (
                <button onClick={() => start(state.difficulty)} className="mx-auto flex items-center gap-1.5 text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
                  <RefreshCw size={14} /> Skip to a new puzzle
                </button>
              )}
            </>
          )}
          <GuessHistory puzzle={puzzle} guesses={guesses} />
        </>
      )}
    </>
  );
}
