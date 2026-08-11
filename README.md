# Guitar Chord Viewer

Jazz chord fretboard viewer. Enter a chord name and see all positions across a 22-fret guitar in either degree or note notation.

## demo site

https://cortyuming.github.io/guitar-chord-viewer/

## Features

- Flexible chord input (`♯`/`#`/`+` and `♭`/`b` all accepted)
- Standard EADGBE tuning, up to 22 frets
- Configurable fret range (default 0–18)
- Click any cell to mark a fingering (one per string) — persisted to URL for sharing
- `▶ Strum` plays the marked fingering as a chord, low string first
- A master sound switch sits beside it; with the sound off nothing plays, neither the strum nor a click. Always off on load
- Plucked-string sound synthesised with the Web Audio API (Karplus-Strong with a tuned fractional delay, pick-position comb, two string polarisations and a body EQ) — no audio files
- Toggle between degree (`R`, `b9`, `9`, `m3`, ..., `7`, `Δ7`) and note name (`C`, `C♯/D♭`, ...) display
- URL parameters for bookmarking: `?c=Am7&f=3-12&m=3.2.0..1.`
- Chord history persisted to localStorage

## Development

```
npm install
npm run dev       # Vite dev server
npm test          # Vitest unit tests
npm run build     # Production build to dist/
```

## Deploy

Push to `main` → GitHub Actions builds and deploys to GitHub Pages automatically.

## Stack

- Vite + React + TypeScript
- Vitest for unit tests
- CSS Grid for the fretboard layout, no chart library
- Web Audio API for sound, no audio library and no samples
