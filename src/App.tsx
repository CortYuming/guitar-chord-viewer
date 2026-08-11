import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import {
  degreeLabels,
  solfegeLabels,
  guideTones,
  parseChord,
  chordTonePairs,
  normalizeToASCII,
} from './chord';
import { Fretboard } from './components/Fretboard';
import { isAudioSupported, playFret, strum } from './audio';
import {
  readURLState,
  useURLSync,
  EMPTY_MARKERS,
  DEFAULT_CHORD,
  DEFAULT_FROM_FRET,
  DEFAULT_TO_FRET,
  type Markers,
} from './hooks/useURLSync';
import { useMRU } from './hooks/useMRU';

// Number of most-recent history items kept pinned (no remove button, never
// bulk-deleted via Shift+Click).
const MRU_PINNED_COUNT = 5;

// Drawn rather than taken from the emoji set, so it inherits the text colour:
// the switch has to read as grey when the sound is off and as the accent colour
// when it is on, and an emoji keeps its own colours whatever we ask of it.
function SpeakerIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <path d="M8.2 2.6 4.8 5.4H2.1v5.2h2.7l3.4 2.8z" fill="currentColor" />
      <path
        d="M10.6 5.6a3.4 3.4 0 0 1 0 4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M12.6 3.6a6.2 6.2 0 0 1 0 8.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function App() {
  const urlState = useRef(readURLState()).current;
  const [input, setInput] = useState<string>(urlState.chord ?? DEFAULT_CHORD);
  const [fromFret, setFromFret] = useState<number>(
    urlState.fromFret ?? DEFAULT_FROM_FRET,
  );
  const [toFret, setToFret] = useState<number>(
    urlState.toFret ?? DEFAULT_TO_FRET,
  );
  const [markers, setMarkers] = useState<Markers>(
    urlState.markers ?? [...EMPTY_MARKERS],
  );
  const [solfege, setSolfege] = useState<boolean>(urlState.solfege ?? false);
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  const [copyLabel, setCopyLabel] = useState('🔗 URL');
  const [copyMdLabel, setCopyMdLabel] = useState('📝 MD');

  const { mru, push: pushMRU, remove: removeMRU, clear: clearMRU, trimTo: trimMRU } = useMRU();
  // Deliberately not remembered: every visit starts silent, so a shared link
  // never makes a noise at someone unprepared for it.
  const [sound, setSound] = useState(false);
  const audioAvailable = useRef(isAudioSupported()).current;
  const soundOn = audioAvailable && sound;

  const chord = useMemo(() => parseChord(input), [input]);

  useEffect(() => {
    if (chord) pushMRU(chord.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (theme) document.documentElement.setAttribute('data-theme', theme);
    else document.documentElement.removeAttribute('data-theme');
  }, [theme]);

  // 's' toggles the degree/solfege labelling. Typing in a field wins, and
  // modified keystrokes are left to the browser.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() !== 's') return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        el?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      setSolfege((v) => !v);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useURLSync({
    chord: chord?.label ?? input,
    fromFret,
    toFret,
    markers,
    solfege,
  });

  const tonePairs = chord ? chordTonePairs(chord) : null;
  const legendLabels = useMemo(
    () => (solfege ? solfegeLabels(chord) : degreeLabels(chord)),
    [chord, solfege],
  );
  const guides = useMemo(
    () => (chord ? guideTones(chord) : { third: null, seventh: null }),
    [chord],
  );

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

  // The sound switch decides what a click is for, and each mode does one thing
  // only. With the sound on, every click sounds its position and leaves the
  // picks alone; letting it toggle as well would mean clicking a picked cell
  // silently — the same gesture sounding or not depending on what was there.
  // With the sound off, a click picks or unpicks, silently.
  const handleCellClick = (stringIdx: number, fret: number) => {
    if (soundOn) {
      playFret(stringIdx, fret);
      return;
    }
    setMarkers((prev) => {
      const next = [...prev];
      next[stringIdx] = prev[stringIdx] === fret ? null : fret;
      return next;
    });
  };

  const handleClearMarkers = () => setMarkers([...EMPTY_MARKERS]);

  // Struck low string first, the way a downstroke crosses the strings. Index 5
  // is the low E, so the picks are read back to front.
  const handleStrum = () => {
    if (!audioAvailable) return;
    // Pressing play is asking to hear something, so it turns the sound on
    // rather than refusing.
    if (!sound) setSound(true);
    const positions: { stringIdx: number; fret: number }[] = [];
    for (let s = markers.length - 1; s >= 0; s--) {
      const fret = markers[s];
      if (fret !== null) positions.push({ stringIdx: s, fret });
    }
    strum(positions);
  };

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
            const showRemove = i >= MRU_PINNED_COUNT;
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
                    onClick={(e) => {
                      if (e.shiftKey) {
                        const n = mru.length - MRU_PINNED_COUNT;
                        if (
                          n > 0 &&
                          window.confirm(
                            `Remove all ${n} history items except the ${MRU_PINNED_COUNT} most recent?`
                          )
                        ) {
                          trimMRU(MRU_PINNED_COUNT);
                        }
                      } else {
                        removeMRU(c);
                      }
                    }}
                    title="Remove from history (Shift+Click: remove all but recent 5)"
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
            Clear history
          </button>
        )}
      </div>

      {chord && tonePairs && (
        <div className="chord-info">
          <div className="chord-name-display">{chord.label}</div>
          <div className="chord-tones-display">
            {tonePairs.map((pair, i) => (
              <div className="chord-tone-col" key={`${pair.interval}-${i}`}>
                <span className="chord-tone-degree">
                  {solfege ? pair.solfege : pair.interval}
                </span>
                <span className="chord-tone-note">{pair.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {chord && (
        <>
          <div className="fretboard-header">
            {audioAvailable && (
              <span className={'sound-group' + (sound ? ' on' : '')}>
                <button
                  className="sound-switch"
                  onClick={() => setSound((v) => !v)}
                  aria-pressed={sound}
                  aria-label={sound ? 'Turn the sound off' : 'Turn the sound on'}
                  title={sound ? 'Turn the sound off' : 'Turn the sound on'}
                  type="button"
                >
                  <SpeakerIcon />
                </button>
                <button
                  className="sound-play"
                  onClick={handleStrum}
                  disabled={!hasAnyMarker}
                  title={
                    !hasAnyMarker
                      ? 'Nothing is picked yet'
                      : soundOn
                        ? 'Play the picked notes'
                        : 'Turn the sound on and play the picked notes'
                  }
                  type="button"
                >
                  ▶ Strum
                </button>
              </span>
            )}
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
          <div className="fretboard-wrap">
            <Fretboard
              chord={chord}
              mode="note"
              fromFret={fromFret}
              toFret={toFret}
              markers={markers}
              onCellClick={handleCellClick}
            />
          </div>
          <div className="fretboard-wrap">
            <Fretboard
              chord={chord}
              mode={solfege ? 'solfege' : 'number'}
              fromFret={fromFret}
              toFret={toFret}
              markers={markers}
              onCellClick={handleCellClick}
            />
          </div>
        </>
      )}

      <div className="legend">
        <div className="legend-toggle" role="group" aria-label="Degree notation">
          <button
            className={'legend-toggle-btn' + (solfege ? '' : ' active')}
            onClick={() => setSolfege(false)}
            aria-pressed={!solfege}
            title="Label the lower fretboard with degree numbers (s)"
            type="button"
          >
            Degrees
          </button>
          <button
            className={'legend-toggle-btn' + (solfege ? ' active' : '')}
            onClick={() => setSolfege(true)}
            aria-pressed={solfege}
            title="Label the lower fretboard with movable-do solfege (s)"
            type="button"
          >
            Solfege
          </button>
        </div>
        {legendLabels.map((label, i) => {
          let cls = `legend-item int-${i}`;
          if (i === guides.third) cls += ' guide-third';
          if (i === guides.seventh) cls += ' guide-seventh';
          return (
            <span key={i} className={cls}>
              {label}
            </span>
          );
        })}
      </div>

      <div className="footer-note">
        <div>
          Click any cell to mark a fingering; use <span className="picks-clear-inline">Clear picks</span> to remove. Switch the sound on to hear each cell as you click it, and <span className="picks-clear-inline">▶ Strum</span> to play the marked ones as a chord.
        </div>
        <div>
          In history, click <span className="picks-clear-inline">×</span> to remove one item; Shift+Click to remove all but the {MRU_PINNED_COUNT} most recent.
        </div>
        <div>
          Switch <span className="picks-clear-inline">Degrees</span> / <span className="picks-clear-inline">Solfege</span> to relabel the lower fretboard, or press <span className="picks-clear-inline">s</span>; the choice is kept in the URL.
        </div>
      </div>
    </>
  );
}

export default App;
