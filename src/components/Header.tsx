import { BarChart3, CircleHelp, Settings as SettingsIcon } from 'lucide-react';
import { formatDateKey } from '../engine/dates';

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-black tracking-[0.14em] ${className}`} aria-label="Integer">
      INTEGER
    </span>
  );
}

interface Props {
  dateKey: string;
  puzzleNo: number;
  onStats: () => void;
  onHelp: () => void;
  onSettings: () => void;
}

export function Header({ dateKey, puzzleNo, onStats, onHelp, onSettings }: Props) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
        <div className="flex items-baseline gap-3">
          <Wordmark className="text-xl" />
          <span className="num hidden text-xs text-muted sm:inline">
            {formatDateKey(dateKey)} · #{String(puzzleNo).padStart(3, '0')}
          </span>
        </div>
        <nav className="flex items-center">
          <button className="icon-btn" onClick={onStats} aria-label="Statistics" title="Statistics">
            <BarChart3 size={20} />
          </button>
          <button className="icon-btn" onClick={onHelp} aria-label="How to play" title="How to play">
            <CircleHelp size={20} />
          </button>
          <button className="icon-btn" onClick={onSettings} aria-label="Settings" title="Settings">
            <SettingsIcon size={20} />
          </button>
        </nav>
      </div>
      <div className="num pb-2 text-center text-xs text-muted sm:hidden">
        {formatDateKey(dateKey)} · #{String(puzzleNo).padStart(3, '0')}
      </div>
    </header>
  );
}
