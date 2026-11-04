import { isDateKey } from '../engine/dates';
import type { GameRecord } from './game';

export const RECORDS_KEY = 'integer:v1:records';
export const SETTINGS_KEY = 'integer:v1:settings';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type ThemePref = 'system' | 'light' | 'dark';
export interface Settings {
  theme: ThemePref;
  /** Blue instead of green for active clues. */
  colorblind: boolean;
  seenHowTo: boolean;
}
export const DEFAULT_SETTINGS: Settings = { theme: 'system', colorblind: false, seenHowTo: false };

/** localStorage when available, otherwise an in-memory fallback (private mode, blocked storage). */
export function defaultStore(): KeyValueStore {
  try {
    const s = window.localStorage;
    const probe = '__integer_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    const mem = new Map<string, string>();
    return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v) };
  }
}

function sanitizeRecord(date: string, raw: unknown): GameRecord | null {
  if (!isDateKey(date) || typeof raw !== 'object' || raw === null) return null;
  const r = raw as Partial<GameRecord>;
  if (typeof r.puzzleId !== 'string' || !Number.isInteger(r.puzzleNumber) || !Array.isArray(r.guesses)) return null;
  const guesses = r.guesses.filter((g): g is number => Number.isSafeInteger(g) && g >= 1);
  return { date, puzzleId: r.puzzleId, puzzleNumber: r.puzzleNumber as number, guesses: [...new Set(guesses)], solved: r.solved === true };
}

export function loadRecords(store: KeyValueStore): Record<string, GameRecord> {
  try {
    const parsed = JSON.parse(store.getItem(RECORDS_KEY) ?? '{}') as Record<string, unknown>;
    const out: Record<string, GameRecord> = {};
    for (const [date, raw] of Object.entries(parsed)) {
      const rec = sanitizeRecord(date, raw);
      if (rec) out[date] = rec;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Merge-write a single record. Reads the latest stored value first so that two tabs
 * never clobber one another: a solved record is final, and guesses are unioned.
 */
export function saveRecord(store: KeyValueStore, record: GameRecord): GameRecord {
  const all = loadRecords(store);
  const existing = all[record.date];
  let merged = record;
  if (existing) {
    if (existing.solved && !record.solved) merged = existing;
    else merged = { ...record, guesses: mergeGuesses(existing.guesses, record.guesses), solved: existing.solved || record.solved };
  }
  all[record.date] = merged;
  try {
    store.setItem(RECORDS_KEY, JSON.stringify(all));
  } catch {
    /* storage full or unavailable: game still works in memory */
  }
  return merged;
}

function mergeGuesses(a: readonly number[], b: readonly number[]): number[] {
  const out = [...a];
  for (const g of b) if (!out.includes(g)) out.push(g);
  return out;
}

export function loadSettings(store: KeyValueStore): Settings {
  try {
    const p = JSON.parse(store.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings>;
    return {
      theme: p.theme === 'light' || p.theme === 'dark' ? p.theme : 'system',
      colorblind: p.colorblind === true,
      seenHowTo: p.seenHowTo === true,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(store: KeyValueStore, s: Settings): void {
  try {
    store.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
