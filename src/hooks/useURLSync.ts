import { useEffect } from 'react';
import { normalizeToASCII } from '../chord';
import type { NotationMode } from '../components/Fretboard';

export interface URLState {
  chord: string;
  mode: NotationMode;
  fromFret: number;
  toFret: number;
}

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
  return state;
}

export function useURLSync(state: URLState) {
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('c', normalizeToASCII(state.chord));
    params.set('n', state.mode);
    params.set('f', `${state.fromFret}-${state.toFret}`);
    const qs = '?' + params.toString();
    try {
      history.replaceState(null, '', qs);
    } catch (_e) {
      // no-op
    }
  }, [state.chord, state.mode, state.fromFret, state.toFret]);
}
