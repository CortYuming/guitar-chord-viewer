import { useEffect } from 'react';
import { normalizeToASCII } from '../chord';
import type { NotationMode } from '../components/Fretboard';

export type Markers = (number | null)[];

export interface URLState {
  chord: string;
  mode: NotationMode;
  fromFret: number;
  toFret: number;
  markers: Markers;
}

export const DEFAULT_CHORD = 'F7+5+9';
export const DEFAULT_MODE: NotationMode = 'number';
export const DEFAULT_FROM_FRET = 0;
export const DEFAULT_TO_FRET = 15;
export const EMPTY_MARKERS: Markers = [null, null, null, null, null, null];

export function readURLState(): Partial<URLState> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const state: Partial<URLState> = {};
  const c = params.get('c');
  if (c) state.chord = c;
  const n = params.get('n');
  if (n === 'number' || n === 'note') state.mode = n;
  const f = params.get('f');
  if (f) {
    const [from, to] = f.split('-').map((x) => parseInt(x, 10));
    if (!isNaN(from) && !isNaN(to)) {
      state.fromFret = from;
      state.toFret = to;
    }
  }
  const m = params.get('m');
  if (m) {
    const parts = m.split('.');
    if (parts.length === 6) {
      const parsed: Markers = parts.map((p) => {
        if (p === '') return null;
        const n = parseInt(p, 10);
        return !isNaN(n) && n >= 0 && n <= 22 ? n : null;
      });
      state.markers = parsed;
    }
  }
  return state;
}

export function useURLSync(state: URLState) {
  useEffect(() => {
    const params = new URLSearchParams();
    const normChord = normalizeToASCII(state.chord);
    if (normChord !== DEFAULT_CHORD) params.set('c', normChord);
    if (state.mode !== DEFAULT_MODE) params.set('n', state.mode);
    if (
      state.fromFret !== DEFAULT_FROM_FRET ||
      state.toFret !== DEFAULT_TO_FRET
    ) {
      params.set('f', `${state.fromFret}-${state.toFret}`);
    }
    if (state.markers.some((m) => m !== null)) {
      params.set(
        'm',
        state.markers.map((m) => (m === null ? '' : String(m))).join('.'),
      );
    }
    const qs = params.toString();
    const url = qs ? '?' + qs : window.location.pathname;
    try {
      history.replaceState(null, '', url);
    } catch (_e) {
      // no-op
    }
  }, [state.chord, state.mode, state.fromFret, state.toFret, state.markers]);
}
