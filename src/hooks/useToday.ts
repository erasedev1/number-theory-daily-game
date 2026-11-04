import { useEffect, useState } from 'react';
import { nyDateKey } from '../engine/dates';

/** Current New York date key; re-evaluated on a timer, tab focus and visibility so midnight is never missed. */
export function useToday(): string {
  const [key, setKey] = useState(() => nyDateKey());
  useEffect(() => {
    const check = () => setKey((prev) => {
      const next = nyDateKey();
      return next === prev ? prev : next;
    });
    const id = window.setInterval(check, 5000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, []);
  return key;
}
