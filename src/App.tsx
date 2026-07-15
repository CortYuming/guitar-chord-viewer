import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import {
  LEGEND_LABELS,
  parseChord,
  chordSummary,
  normalizeToASCII,
} from './chord';
import { Fretboard, type NotationMode } from './components/Fretboard';
import {
  readURLState,
  useURLSync,
  EMPTY_MARKERS,
  type Markers,
} from './hooks/useURLSync';
import { useMRU } from './hooks/useMRU';

function App() {
  const urlState = useRef(readURLState()).current;
  const [input, setInput] = useState<string>(urlState.chord ?? 'F7+5+9');
  const [mode, setMode] = useState<NotationMode>(urlState.mode ?? 'number');
  const [fromFret, setFromFret] = useState<number>(urlState.fromFret ?? 0);
  const [toFret, setToFret] = useState<number>(urlState.toFret ?? 15);
  const [markers, setMarkers] = useState<Markers>(
    urlState.markers ?? [...EMPTY_MARKERS],
  );
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  const [copyLabel, setCopyLabel] = useState('🔗 URL');
  const [copyMdLabel, setCopyMdLabel] = useState('📝 MD');

  const { mru, push: pushMRU, remove: removeMRU, clear: clearMRU } = useMRU();

  const chord = useMemo(() => parseChord(input), [input]);

  useEffect(() => {
    if (chord) pushMRU(chord.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (theme) document.documentElement.setAttribute('data-theme', theme);
    else document.documentElement.removeAttribute('data-theme');
  }, [theme]);

  useURLSync({
    chord: chord?.label ?? input,
    mode,
    fromFret,
    toFret,
    markers,
  });

  const summary = chord ? chordSummary(chord) : null;

  const handleFrom = (v: number) => {
    setFromFret(v);
    if (v > toFret) setToFret(v);
  };
  const handleTo = (v: number) => {
    setToFret(v);
    if (v < fromFret) setFromFret(v);
  };

  const handleCopyURL = () => {
    const url = window.location.href;
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopyLabel('✓ Copied');
        setTimeout(() => setCopyLabel('🔗 URL'), 1400);
      })
      .catch(() => {
        setCopyLabel('(failed)');
        setTimeout(() => setCopyLabel('🔗 URL'), 1400);
      });
  };

  const handleCopyMarkdown = () => {
    const url = window.location.href;
    const label = chord?.label ?? input;
    const md = `[${label}](${url})`;
    navigator.clipboard
      ?.writeText(md)
      .then(() => {
        setCopyMdLabel('✓ Copied');
        setTimeout(() => setCopyMdLabel('📝 MD'), 1400);
      })
      .catch(() => {
        setCopyMdLabel('(failed)');
        setTimeout(() => setCopyMdLabel('📝 MD'), 1400);
      });
  };

  const toggleTheme = () => {
    const cur =
      theme ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(cur === 'dark' ? 'light' : 'dark');
  };

  const handleMRUClick = (c: string) => {
    setInput(c);
    pushMRU(c);
  };

  const handleInputCommit = () => {
    if (chord) pushMRU(chord.label);
  };

  const handleMarkerToggle = (stringIdx: number, fret: number) => {
    setMarkers((prev) => {
      const next = [...prev];
      next[stringIdx] = prev[stringIdx] === fret ? null : fret;
      return next;
    });
  };

  const handleClearMarkers = () => setMarkers([...EMPTY_MARKERS]);

  const hasAnyMarker = markers.some((m) => m !== null);

  const normNow = normalizeToASCII(input);

  return (
    <>
      <div className="header">
        <div className="brand">
          <span className="brand-name">Chord Fretboard Viewer</span>
        </div>
        <div className="controls">
          <input
            className={'chord-input' + (chord ? '' : ' invalid')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleInputCommit();
            }}
            onBlur={handleInputCommit}
            spellCheck={false}
            autoComplete="off"
            placeholder="e.g. F7+5+9 / F♯m7♭5"
            aria-label="Chord name"
          />
          <div className="range-control">
            <span className="range-label">Fret</span>
            <input
              className="range-num"
              type="number"
              min={0}
              max={22}
              value={fromFret}
              onChange={(e) => handleFrom(parseInt(e.target.value, 10) || 0)}
            />
            <span className="range-sep">-</span>
            <input
              className="range-num"
              type="number"
              min={0}
              max={22}
              value={toFret}
              onChange={(e) => handleTo(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <button className="icon-btn" onClick={handleCopyURL} title="Copy URL">
            {copyLabel}
          </button>
          <button
            className="icon-btn"
            onClick={handleCopyMarkdown}
            title="Copy Markdown link"
          >
            {copyMdLabel}
          </button>
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            ◐
          </button>
        </div>
      </div>

      <div className="mru-section">
        <div className="mru-list">
          {mru.map((c, i) => {
            const showRemove = i >= 5;
            return (
              <span
                key={c}
                className={
                  'mru-item' +
                  (normalizeToASCII(c) === normNow ? ' active' : '') +
                  (showRemove ? '' : ' no-remove')
                }
              >
                <button
                  className="mru-item-label"
                  onClick={() => handleMRUClick(c)}
                  type="button"
                >
                  {c}
                </button>
                {showRemove && (
                  <button
                    className="mru-item-remove"
                    onClick={() => removeMRU(c)}
                    title="Remove from history"
                    aria-label={`Remove ${c} from history`}
                    type="button"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
        </div>
        {mru.length > 0 && (
          <button
            className="mru-clear"
            onClick={() => {
              if (window.confirm('Clear all history?')) clearMRU();
            }}
            title="Clear all history"
            type="button"
          >
            Clear all
          </button>
        )}
      </div>

      {chord && summary && (
        <div className="chord-info">
          <div className="chord-name-display">{chord.label}</div>
          <div className="chord-tones-display">
            <strong>{summary.intervals}</strong> · {summary.notes}
          </div>
        </div>
      )}

      <div className="notation-toggle-row">
        <div className="notation-toggle" role="group" aria-label="Notation">
          <button
            className={mode === 'number' ? 'active' : ''}
            onClick={() => setMode('number')}
          >
            Degrees
          </button>
          <button
            className={mode === 'note' ? 'active' : ''}
            onClick={() => setMode('note')}
          >
            Notes
          </button>
        </div>
        {hasAnyMarker && (
          <button
            className="picks-clear"
            onClick={handleClearMarkers}
            title="Clear all picks"
            type="button"
          >
            Clear picks
          </button>
        )}
      </div>

      {chord && (
        <div className="fretboard-wrap">
          <Fretboard
            chord={chord}
            mode={mode}
            fromFret={fromFret}
            toFret={toFret}
            markers={markers}
            onMarkerToggle={handleMarkerToggle}
          />
        </div>
      )}

      <div className="legend">
        <span className="legend-title">Degrees</span>
        {LEGEND_LABELS.map((label, i) => (
          <span key={i} className={`legend-item int-${i}`}>
            {label}
          </span>
        ))}
      </div>

      <div className="footer-note">
        <div>
          Click any cell to mark a fingering; use <strong>Clear picks</strong> to remove.
        </div>
      </div>
    </>
  );
}

export default App;
