import { useMemo } from 'react';
import type { Chord } from '../chord';
import {
  OPEN_STRINGS,
  FRET_MARKERS,
  accidentalFor,
  contextualName,
  guideTones,
  noteLabel,
  solfegeName,
} from '../chord';
import type { Markers } from '../hooks/useURLSync';

export type NotationMode = 'number' | 'note' | 'solfege';

interface Props {
  chord: Chord;
  mode: NotationMode;
  fromFret: number;
  toFret: number;
  markers: Markers;
  // What a click does depends on the sound switch — it either picks the
  // position or sounds it — so the cell only reports that it was clicked.
  onCellClick: (stringIdx: number, fret: number) => void;
}

export function Fretboard({
  chord,
  mode,
  fromFret,
  toFret,
  markers,
  onCellClick,
}: Props) {
  const from = Math.max(0, Math.min(22, fromFret));
  const to = Math.max(from, Math.min(22, toFret));
  const numCols = to - from + 1;
  const toneSet = useMemo(() => new Set(chord.tones), [chord.tones]);
  const accidental = useMemo(() => accidentalFor(chord), [chord]);
  const guides = useMemo(() => guideTones(chord), [chord]);

  const MIN_CELL = 38;
  const MAX_CELL = 64;
  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${numCols}, minmax(${MIN_CELL}px, ${MAX_CELL}px))`,
    minWidth: `${numCols * MIN_CELL}px`,
    maxWidth: `${numCols * MAX_CELL}px`,
  };

  const fretNums: React.ReactNode[] = [];
  for (let f = from; f <= to; f++) {
    const label = f === 0 ? 'open' : String(f);
    const cls = 'cell fret-num' + (FRET_MARKERS.has(f) ? ' fret-num-marker' : '');
    fretNums.push(
      <div className={cls} key={`fnum-${f}`}>
        <span>{label}</span>
      </div>,
    );
  }

  const noteRows: React.ReactNode[] = [];
  for (let s = 0; s < 6; s++) {
    const openSemi = OPEN_STRINGS[s];
    for (let f = from; f <= to; f++) {
      const semi = (openSemi + f) % 12;
      const interval = (semi - chord.root + 12) % 12;
      const isChordTone = toneSet.has(interval);
      const label =
        mode === 'note'
          ? noteLabel(semi, accidental)
          : mode === 'solfege'
            ? solfegeName(interval, chord)
            : contextualName(interval, chord);
      const isMarked = markers[s] === f;
      let cls = `cell note-cell int-${interval}`;
      if (f === 0) cls += ' open';
      cls += isChordTone ? ' chord-tone' : ' non-chord';
      if (interval === guides.third) cls += ' guide-third';
      if (interval === guides.seventh) cls += ' guide-seventh';
      // Solfege labels are lowercase and narrow, so only the degree and note
      // labels (♯11, C♯...) need the smaller size.
      if (mode !== 'solfege' && label.length > 2) cls += ' wide-label';
      if (isMarked) cls += ' marked';
      noteRows.push(
        <div
          className={cls}
          key={`n-${s}-${f}`}
          role="button"
          tabIndex={0}
          aria-pressed={isMarked}
          aria-label={`String ${s + 1}, fret ${f}, ${label}${isMarked ? ', marked' : ''}`}
          onClick={() => onCellClick(s, f)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onCellClick(s, f);
            }
          }}
        >
          <span>{label}</span>
        </div>,
      );
    }
  }

  return (
    <div className="fretboard" style={gridStyle} role="img" aria-label="Fretboard">
      {fretNums}
      {noteRows}
    </div>
  );
}
