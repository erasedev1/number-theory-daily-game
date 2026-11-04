import type { Puzzle } from '../puzzles/puzzle';
import { evaluateGuess, type GameRecord } from './game';

export const SHARE_URL = 'integer.game';

/** Wordle-style text. Contains only the clue-satisfaction pattern, never the answer. */
export function buildShareText(record: GameRecord, puzzle: Puzzle): string {
  const n = String(record.puzzleNumber).padStart(3, '0');
  const count = record.guesses.length;
  const rows = record.guesses.map((g) => evaluateGuess(puzzle, g).map((ok) => (ok ? '🟩' : '⬜')).join(''));
  return [`INTEGER #${n}`, `Solved in ${count} guess${count === 1 ? '' : 'es'}`, ...rows, SHARE_URL].join('\n');
}

export type ShareOutcome = 'shared' | 'copied' | 'failed';

export async function shareResult(text: string): Promise<ShareOutcome> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'failed';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok ? 'copied' : 'failed';
    } catch {
      return 'failed';
    }
  }
}
