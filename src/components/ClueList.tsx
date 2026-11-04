import { Check } from 'lucide-react';
import type { Clue } from '../engine/clues';

interface Props {
  clues: Clue[];
  /** Per-clue result of the CURRENT (most recent) guess; null before any guess. */
  states: boolean[] | null;
}

export function ClueList({ clues, states }: Props) {
  return (
    <ol className="space-y-2" aria-label="Clues">
      {clues.map((clue, i) => {
        const active = states?.[i] === true;
        return (
          <li
            key={clue.id}
            aria-label={`${clue.text} ${states ? (active ? 'Satisfied by your latest guess.' : 'Not satisfied by your latest guess.') : ''}`}
            className={`flex items-center gap-3 rounded-xl px-4 py-3.5 transition-colors duration-300 ${
              active ? 'bg-good text-good-ink' : 'bg-surface text-ink'
            }`}
          >
            <span className={`num w-4 shrink-0 text-sm font-semibold ${active ? 'opacity-80' : 'text-muted'}`}>{i + 1}</span>
            <span className="flex-1 text-[15px] leading-snug sm:text-base">{clue.text}</span>
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                active ? 'border-transparent bg-white/25' : 'border-line'
              }`}
              aria-hidden
            >
              {active && <Check size={15} strokeWidth={3} className="anim-check" />}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
