import type { Stats } from '../game/stats';
import { Modal } from './Modal';

function Tile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center">
      <div className="num text-3xl font-black">{value}</div>
      <div className="mt-0.5 text-[11px] leading-tight text-muted">{label}</div>
    </div>
  );
}

export function StatsModal({ stats, highlight, onClose }: { stats: Stats; highlight: number | null; onClose: () => void }) {
  const max = Math.max(1, ...stats.distribution);
  const last = stats.distribution.length;
  return (
    <Modal title="Statistics" onClose={onClose}>
      <div className="grid grid-cols-4 gap-2">
        <Tile value={stats.played} label="Played" />
        <Tile value={stats.winPct} label="Win %" />
        <Tile value={stats.currentStreak} label="Current streak" />
        <Tile value={stats.maxStreak} label="Max streak" />
      </div>
      <div className="mt-3 text-center text-sm text-muted">
        Average guesses per win: <span className="num font-bold text-ink">{stats.won ? stats.averageGuesses : '–'}</span>
      </div>
      <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-muted">Guess distribution</h3>
      <div className="space-y-1.5" role="list">
        {stats.distribution.map((count, i) => {
          const isHi = highlight !== null && Math.min(highlight, last) === i + 1;
          return (
            <div key={i} className="flex items-center gap-2 text-sm" role="listitem" aria-label={`${i + 1}${i + 1 === last ? ' or more' : ''} guesses: ${count}`}>
              <span className="num w-5 text-right text-muted">{i + 1 === last ? `${last}+` : i + 1}</span>
              <div className="flex-1">
                <div
                  className={`num flex h-6 items-center justify-end rounded px-2 text-xs font-bold transition-all duration-500 ${isHi ? 'bg-good text-good-ink' : 'bg-surface'}`}
                  style={{ width: `${Math.max(8, (count / max) * 100)}%` }}
                >
                  {count}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-xs text-muted">Stats are stored only in this browser.</p>
    </Modal>
  );
}
