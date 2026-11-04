import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadRecords, loadSettings, RECORDS_KEY, SETTINGS_KEY, saveRecord, saveSettings, defaultStore, type Settings } from '../game/storage';
import type { GameRecord } from '../game/game';

/** Persistent records + settings, kept in sync across browser tabs via the `storage` event. */
export function useGameStore() {
  const store = useMemo(() => defaultStore(), []);
  const [records, setRecords] = useState<Record<string, GameRecord>>(() => loadRecords(store));
  const [settings, setSettingsState] = useState<Settings>(() => loadSettings(store));

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === RECORDS_KEY) setRecords(loadRecords(store));
      if (e.key === null || e.key === SETTINGS_KEY) setSettingsState(loadSettings(store));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [store]);

  const commit = useCallback(
    (record: GameRecord) => {
      const merged = saveRecord(store, record);
      setRecords(loadRecords(store));
      return merged;
    },
    [store],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettingsState((prev) => {
        const next = { ...prev, ...patch };
        saveSettings(store, next);
        return next;
      });
    },
    [store],
  );

  /** Latest persisted record for a day (re-read, so other tabs' progress is honored). */
  const fresh = useCallback((date: string) => loadRecords(store)[date], [store]);

  return { records, settings, commit, fresh, updateSettings };
}
