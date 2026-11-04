import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header, Wordmark } from './components/Header';
import { ClueList } from './components/ClueList';
import { GuessForm } from './components/GuessForm';
import { GuessHistory } from './components/GuessHistory';
import { WinPanel } from './components/WinPanel';
import { StatsModal } from './components/StatsModal';
import { HowToModal } from './components/HowToModal';
import { SettingsModal } from './components/SettingsModal';
import { useToday } from './hooks/useToday';
import { useGameStore } from './hooks/useGameStore';
import { selectPuzzle, puzzleNumber } from './puzzles/daily';
import { buildPuzzle } from './puzzles/puzzle';
import { evaluateGuess, newRecord, submitGuess } from './game/game';
import { computeStats } from './game/stats';

type ModalName = 'stats' | 'help' | 'settings' | null;

export default function App() {
  const today = useToday();
  const { records, settings, commit, fresh, updateSettings } = useGameStore();
  const [modal, setModal] = useState<ModalName>(null);
  const [justWon, setJustWon] = useState(false);

  const puzzleNo = puzzleNumber(today);
  const puzzle = useMemo(() => buildPuzzle(selectPuzzle(today)), [today]);
  const record = records[today] ?? newRecord(today, puzzle.def.id, puzzleNo);
  const solved = record.solved;
  const stats = useMemo(() => computeStats(records, today), [records, today]);

  // First visit: show the tutorial.
  useEffect(() => {
    if (!settings.seenHowTo) {
      setModal('help');
      updateSettings({ seenHowTo: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme application
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && mq.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      if (settings.colorblind) document.documentElement.dataset.cb = '1';
      else delete document.documentElement.dataset.cb;
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings.theme, settings.colorblind]);

  // A new day starts a fresh, non-celebrating view.
  useEffect(() => setJustWon(false), [today]);

  const onGuess = useCallback(
    (raw: string): string | null => {
      // Re-read storage so progress made in another tab is respected.
      const current = fresh(today) ?? newRecord(today, puzzle.def.id, puzzleNo);
      const out = submitGuess(current, puzzle, raw);
      if (!out.ok) return out.error;
      commit(out.record);
      if (out.won) {
        setJustWon(true);
        window.setTimeout(() => setModal('stats'), 2600);
      }
      return null;
    },
    [commit, fresh, puzzle, puzzleNo, today],
  );

  const lastGuess = record.guesses[record.guesses.length - 1];
  const states = lastGuess !== undefined ? evaluateGuess(puzzle, lastGuess) : null;
  const close = () => setModal(null);

  return (
    <div className="flex min-h-screen flex-col">
      <Header dateKey={today} puzzleNo={puzzleNo} onStats={() => setModal('stats')} onHelp={() => setModal('help')} onSettings={() => setModal('settings')} />
      <main className="mx-auto w-full max-w-xl flex-1 space-y-6 px-4 pb-16 pt-8">
        <div className="text-center">
          <h1 className="sr-only">INTEGER</h1>
          <Wordmark className="block text-5xl sm:text-6xl" />
          <p className="mt-3 text-lg text-muted">Can you find today's number?</p>
        </div>

        <ClueList clues={puzzle.clues} states={states} />

        {solved ? (
          <WinPanel puzzle={puzzle} record={record} fresh={justWon} />
        ) : (
          <GuessForm key={today} max={puzzle.max} onSubmit={onGuess} />
        )}

        <GuessHistory puzzle={puzzle} guesses={record.guesses} />
      </main>

      {modal === 'stats' && <StatsModal stats={stats} highlight={solved ? record.guesses.length : null} onClose={close} />}
      {modal === 'help' && <HowToModal onClose={close} />}
      {modal === 'settings' && <SettingsModal settings={settings} onChange={updateSettings} onClose={close} />}
    </div>
  );
}
