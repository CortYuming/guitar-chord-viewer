# Guitar Chord Viewer

Jazz chord fretboard viewer. Enter a chord name and see all positions across a 22-fret guitar in either degree or note notation.

## demo site

https://cortyuming.github.io/guitar-chord-viewer/

## Features

- Flexible chord input (`♯`/`#`/`+` and `♭`/`b` all accepted)
- Standard EADGBE tuning, up to 22 frets
- Configurable fret range (default 1–15)
- Toggle between degree (`R`, `b9`, `9`, `m3`, ...) and note name (`C`, `C♯/D♭`, ...) display
- URL parameters for bookmarking: `?c=F7+5+9&n=number&f=1-15`
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
