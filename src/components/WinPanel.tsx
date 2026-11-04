import { useEffect, useState, type ReactNode } from 'react';
import { Share2, Check } from 'lucide-react';
import type { Puzzle } from '../puzzles/puzzle';
import type { GameRecord } from '../game/game';
import { buildShareText, shareResult } from '../game/share';
import { formatFactorization } from '../engine/math';
import { msUntilNextDay } from '../engine/dates';

function useCountdown(enabled: boolean): string {
  const [ms, setMs] = useState(() => msUntilNextDay());
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setMs(msUntilNextDay()), 1000);
    return () => window.clearInterval(id);
  }, [enabled]);
  const s = Math.floor(ms / 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

export function WinPanel({ puzzle, record, fresh, footer }: { puzzle: Puzzle; record: GameRecord; fresh: boolean; footer?: ReactNode }) {
  const [status, setStatus] = useState<string | null>(null);
  const countdown = useCountdown(!footer);
  const digits = String(puzzle.answer).split('');
  const n = record.guesses.length;

  const onShare = async () => {
    const outcome = await shareResult(buildShareText(record, puzzle));
    setStatus(outcome === 'copied' ? 'Copied to clipboard' : outcome === 'shared' ? 'Shared' : outcome === 'failed' ? 'Could not share' : null);
    window.setTimeout(() => setStatus(null), 2500);
  };

  return (
    <section className="space-y-5 rounded-2xl border border-line p-5 anim-rise" aria-label="Solved">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">{fresh ? 'You found it' : 'Solved'}</p>
        <div className="relative my-4 flex items-center justify-center gap-1.5">
          {fresh && <span className="anim-ring pointer-events-none absolute h-20 w-20 rounded-full border-2 border-good" />}
          {digits.map((d, i) => (
            <span
              key={i}
              style={fresh ? { animationDelay: `${i * 110}ms` } : undefined}
              className={`num flex h-16 w-12 items-center justify-center rounded-xl bg-good text-4xl font-black text-good-ink ${fresh ? 'anim-flip' : ''}`}
            >
              {d}
            </span>
          ))}
        </div>
        <p className="text-lg font-bold">
          Solved in {n} guess{n === 1 ? '' : 'es'}
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Why {puzzle.answer.toLocaleString('en-US')}?</h3>
        <p className="num mb-2 text-sm">
          {puzzle.answer} = {formatFactorization(puzzle.answer)}
        </p>
        <ul className="space-y-1.5 text-sm">
          {puzzle.clues.map((c) => (
            <li key={c.id} className="flex gap-2">
              <Check size={16} className="mt-0.5 shrink-0 text-good" />
              <span>
                <span className="text-muted">{c.text.replace(/\.$/, '')}</span>
                <span className="num"> — {c.explain(puzzle.answer)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {footer ? (
        <div className="border-t border-line pt-4">{footer}</div>
      ) : (
      <div className="flex flex-col items-center gap-3 border-t border-line pt-4 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="text-xs uppercase tracking-widest text-muted">Next INTEGER in</p>
          <p className="num text-xl font-bold">{countdown}</p>
        </div>
        <button onClick={onShare} className="btn h-12 w-full bg-good text-good-ink hover:opacity-90 sm:w-auto">
          <Share2 size={18} /> {status ?? 'Share'}
        </button>
      </div>
      )}
    </section>
  );
}
