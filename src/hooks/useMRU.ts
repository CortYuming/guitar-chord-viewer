import { useCallback, useEffect, useState } from 'react';
import { normalizeToASCII } from '../chord';

const STORAGE_KEY = 'guitar-chord-mru';
const MAX_ITEMS = 30;

function loadMRU(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string');
  } catch (_e) {
    // ignore
  }
  return [];
}

function saveMRU(mru: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mru));
  } catch (_e) {
    // ignore
  }
}

export function useMRU() {
  const [mru, setMru] = useState<string[]>(() => loadMRU());

  useEffect(() => {
    saveMRU(mru);
  }, [mru]);

  const push = useCallback((input: string) => {
    const s = input.trim();
    if (!s) return;
    const norm = normalizeToASCII(s);
    setMru((prev) => {
      const next = [s, ...prev.filter((c) => normalizeToASCII(c) !== norm)];
      if (next.length > MAX_ITEMS) next.length = MAX_ITEMS;
      return next;
    });
  }, []);

  const remove = useCallback((input: string) => {
    const norm = normalizeToASCII(input);
    setMru((prev) => prev.filter((c) => normalizeToASCII(c) !== norm));
  }, []);

  const clear = useCallback(() => setMru([]), []);

  const trimTo = useCallback((n: number) => {
    setMru((prev) => prev.slice(0, Math.max(0, n)));
  }, []);

  return { mru, push, remove, clear, trimTo };
}
