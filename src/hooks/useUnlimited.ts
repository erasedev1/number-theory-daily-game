import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildPuzzle, type Puzzle } from '../puzzles/puzzle';
import { generatePuzzle } from '../engine/generator';
import type { Difficulty, PuzzleDef } from '../engine/validate';
import { defaultStore } from '../game/storage';
import { loadUnlimited, newSeed, saveUnlimited, UNLIMITED_KEY, type UnlimitedState } from '../game/unlimited';
import { submitGuess, type GameRecord } from '../game/game';

/** Generate in a Web Worker so hard puzzles never freeze the UI; fall back to the main thread. */
function generateAsync(difficulty: Difficulty, seed: number): { promise: Promise<PuzzleDef>; cancel: () => void } {
  let worker: Worker | null = null;
  let cancelled = false;
  const promise = new Promise<PuzzleDef>((resolve) => {
    const fallback = () => setTimeout(() => !cancelled && resolve(generatePuzzle(difficulty, seed).def), 0);
    try {
      worker = new Worker(new URL('../engine/generator.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e: MessageEvent<{ def: PuzzleDef }>) => {
        if (!cancelled) resolve(e.data.def);
        worker?.terminate();
      };
      worker.onerror = () => {
        worker?.terminate();
        fallback();
      };
      worker.postMessage({ difficulty, seed });
    } catch {
      fallback();
    }
  });
  return { promise, cancel: () => { cancelled = true; worker?.terminate(); } };
}

export function useUnlimited(active: boolean) {
  const store = useMemo(() => defaultStore(), []);
  const [state, setState] = useState<UnlimitedState>(() => loadUnlimited(store));
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const game = state.game;
  const key = game ? `${game.difficulty}:${game.seed}` : null;
  const stateRef = useRef(state);
  stateRef.current = state;

  const update = useCallback(
    (next: UnlimitedState) => {
      setState(next);
      saveUnlimited(store, next);
    },
    [store],
  );

  const start = useCallback(
    (difficulty: Difficulty) => {
      setPuzzle(null);
      update({ ...stateRef.current, difficulty, game: { difficulty, seed: newSeed(), guesses: [], solved: false } });
    },
    [update],
  );

  // Make sure there is a game whenever the mode is opened.
  useEffect(() => {
    if (active && !stateRef.current.game) start(stateRef.current.difficulty);
  }, [active, start]);

  // Build the puzzle for the current (difficulty, seed).
  useEffect(() => {
    if (!active || !game) return;
    setPuzzle(null);
    const job = generateAsync(game.difficulty, game.seed);
    job.promise.then((def) => setPuzzle(buildPuzzle(def)));
    return job.cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, key]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === UNLIMITED_KEY || e.key === null) setState(loadUnlimited(store));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [store]);

  /** Returns an error message or null. */
  const guess = useCallback(
    (raw: string): string | null => {
      const cur = stateRef.current;
      if (!cur.game || !puzzle) return 'Puzzle is still loading.';
      const rec: GameRecord = { date: '', puzzleId: puzzle.def.id, puzzleNumber: 0, guesses: cur.game.guesses, solved: cur.game.solved };
      const out = submitGuess(rec, puzzle, raw);
      if (!out.ok) return out.error;
      update({
        ...cur,
        solvedCount: cur.solvedCount + (out.won ? 1 : 0),
        game: { ...cur.game, guesses: out.record.guesses, solved: out.won },
      });
      return null;
    },
    [puzzle, update],
  );

  return { state, puzzle, game, start, guess };
}
