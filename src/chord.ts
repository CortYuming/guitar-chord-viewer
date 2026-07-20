export const CHROMATIC_LABELS = [
  'R', 'b9', '9', 'm3', '3', '4', 'b5', '5', 'b6', '6', '7', 'Δ7',
] as const;

export const LEGEND_LABELS = [
  'R', '1♯/2♭', '9', '2♯/3♭', '3', '4', '4♯/5♭', '5', '5♯/6♭', '6', '7♭', 'Δ7',
] as const;

export const CONTEXTUAL_SUMMARY: Record<number, string> = {
  0: 'R', 1: '♭9', 2: '9', 3: '♭3', 4: '3', 5: '4',
  6: '♭5', 7: '5', 8: '♭6', 9: '6', 10: '♭7', 11: 'Δ7',
};

export const NOTES_SHARP = [
  'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B',
] as const;

export const NOTES_FLAT = [
  'C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B',
] as const;

export const OPEN_STRINGS = [4, 11, 7, 2, 9, 4] as const;

export const FRET_MARKERS = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21]);

export interface Tension {
  n: number;
  sign: '♯' | '♭';
  adjusted: number;
}

const ALT_TENSIONS: Tension[] = [
  { n: 9, sign: '♭', adjusted: 1 },
  { n: 9, sign: '♯', adjusted: 3 },
  { n: 5, sign: '♭', adjusted: 6 },
  { n: 5, sign: '♯', adjusted: 8 },
];

const AUG5: Tension[] = [{ n: 5, sign: '♯', adjusted: 8 }];

type QualityValue = number[] | { tones: number[]; tensions: Tension[] };

const QUALITY_MAP: Record<string, QualityValue> = {
  '': [0, 4, 7], 'maj': [0, 4, 7], 'M': [0, 4, 7],
  'm': [0, 3, 7], 'min': [0, 3, 7], '-': [0, 3, 7],
  'dim': [0, 3, 6], '°': [0, 3, 6],
  'aug': { tones: [0, 4], tensions: AUG5 },
  'sus2': [0, 2, 7], 'sus4': [0, 5, 7], 'sus': [0, 5, 7],
  '6': [0, 4, 7, 9], 'm6': [0, 3, 7, 9], 'min6': [0, 3, 7, 9],
  '7': [0, 4, 7, 10],
  'M7': [0, 4, 7, 11], 'maj7': [0, 4, 7, 11], 'Δ7': [0, 4, 7, 11], 'Δ': [0, 4, 7, 11],
  'm7': [0, 3, 7, 10], 'min7': [0, 3, 7, 10], '-7': [0, 3, 7, 10],
  'mM7': [0, 3, 7, 11], 'mmaj7': [0, 3, 7, 11], 'mΔ7': [0, 3, 7, 11],
  'm7b5': [0, 3, 6, 10], 'ø': [0, 3, 6, 10], 'ø7': [0, 3, 6, 10],
  'dim7': [0, 3, 6, 9], '°7': [0, 3, 6, 9],
  'aug7': { tones: [0, 4, 10], tensions: AUG5 },
  '9': [0, 4, 7, 10, 2],
  'M9': [0, 4, 7, 11, 2], 'maj9': [0, 4, 7, 11, 2], 'Δ9': [0, 4, 7, 11, 2],
  'm9': [0, 3, 7, 10, 2],
  '11': [0, 4, 7, 10, 2, 5],
  'm11': [0, 3, 7, 10, 2, 5],
  '13': [0, 4, 7, 10, 2, 5, 9],
  'M13': [0, 4, 7, 11, 2, 5, 9], 'maj13': [0, 4, 7, 11, 2, 5, 9], 'Δ13': [0, 4, 7, 11, 2, 5, 9],
  'm13': [0, 3, 7, 10, 2, 5, 9],

  'add9': [0, 4, 7, 2], 'add11': [0, 4, 7, 5], 'add13': [0, 4, 7, 9],
  'madd9': [0, 3, 7, 2], 'madd11': [0, 3, 7, 5], 'madd13': [0, 3, 7, 9],

  '6/9': [0, 4, 7, 9, 2], '69': [0, 4, 7, 9, 2],
  'm6/9': [0, 3, 7, 9, 2], 'm69': [0, 3, 7, 9, 2],

  '7sus4': [0, 5, 7, 10], '7sus': [0, 5, 7, 10],
  '9sus4': [0, 5, 7, 10, 2], '9sus': [0, 5, 7, 10, 2],
  '13sus4': [0, 5, 7, 10, 2, 9], '13sus': [0, 5, 7, 10, 2, 9],

  'alt': { tones: [0, 4, 10], tensions: ALT_TENSIONS },
  '7alt': { tones: [0, 4, 10], tensions: ALT_TENSIONS },
};

const ROOT_MAP: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

const TENSION_NAT: Record<number, number> = {
  2: 2, 4: 5, 5: 7, 6: 9, 7: 10, 9: 2, 11: 5, 13: 9,
};

export interface Chord {
  root: number;
  rootLabel: string;
  quality: string;
  tensions: Tension[];
  tones: number[];
  label: string;
}

export function normalizeToASCII(s: string): string {
  return s.replace(/♯/g, '#').replace(/♭/g, 'b');
}

export function normalizeAliases(s: string): string {
  return s
    .replace(/∆/g, 'Δ')
    .replace(/△/g, 'Δ')
    .replace(/major/gi, 'maj')
    .replace(/Ma(?!j)/g, 'maj')
    .replace(/MA(?![Jj])/g, 'maj')
    // Joe Pass notation: Cm+7 = minor(major7th), the '+7' means natural 7.
    // Guard this before the augmented rules below rewrite '+7'.
    .replace(/m\+7/g, 'mM7')
    // Augmented: '+' on the 5th. C7aug / C7+ / C+7 all = aug7; C+ = aug.
    // '+' immediately before a digit (e.g. +5, +9) stays a tension.
    .replace(/7aug/g, 'aug7')
    .replace(/7\+(?!\d)/g, 'aug7')
    .replace(/\+7(?!\d)/g, 'aug7')
    .replace(/\+(?!\d)/g, 'aug');
}

export function noteLabel(semi: number): string {
  const s = NOTES_SHARP[semi];
  const f = NOTES_FLAT[semi];
  return s === f ? s : `${s}/${f}`;
}

function parseRoot(str: string): { semi: number; nextPos: number; label: string } | null {
  if (!str) return null;
  const upper = str[0].toUpperCase();
  if (!(upper in ROOT_MAP)) return null;
  let semi = ROOT_MAP[upper];
  let nextPos = 1;
  const sec = str[1];
  if (sec === '#' || sec === '♯') { semi = (semi + 1) % 12; nextPos = 2; }
  else if (sec === 'b' || sec === '♭') { semi = (semi + 11) % 12; nextPos = 2; }
  return { semi, nextPos, label: str.slice(0, nextPos) };
}

const QUALITY_KEYS = Object.keys(QUALITY_MAP)
  .filter(k => k !== '')
  .sort((a, b) => b.length - a.length);

export function parseChord(input: string): Chord | null {
  const s = normalizeAliases(input.trim().replace(/\s+/g, ''));
  if (!s) return null;
  const rootParse = parseRoot(s);
  if (!rootParse) return null;
  let rest = s.slice(rootParse.nextPos);

  let quality = '';
  for (const q of QUALITY_KEYS) {
    if (rest.startsWith(q)) {
      quality = q;
      rest = rest.slice(q.length);
      break;
    }
  }

  const raw = QUALITY_MAP[quality] ?? [0, 4, 7];
  const base = Array.isArray(raw) ? raw : raw.tones;
  const presetTensions: Tension[] = Array.isArray(raw) ? [] : raw.tensions;
  const tones = new Set(base);

  const parsedTensions: Tension[] = [];
  const re = /([+#♯b♭])(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rest)) !== null) {
    const sign = m[1];
    const n = parseInt(m[2], 10);
    const natural = TENSION_NAT[n];
    if (natural === undefined) continue;
    const isSharp = sign === '+' || sign === '#' || sign === '♯';
    const adjusted = isSharp ? (natural + 1) % 12 : (natural + 11) % 12;
    parsedTensions.push({ n, sign: isSharp ? '♯' : '♭', adjusted });
  }

  const tensions: Tension[] = [...presetTensions, ...parsedTensions];
  for (const t of tensions) {
    if (t.n === 5) tones.delete(7);
    if (t.n === 7) { tones.delete(10); tones.delete(11); }
    tones.add(t.adjusted);
  }

  return {
    root: rootParse.semi,
    rootLabel: rootParse.label,
    quality,
    tensions,
    tones: [...tones].sort((a, b) => a - b),
    label: input,
  };
}

export function contextualName(semi: number, chord: Chord): string {
  for (const t of chord.tensions) {
    if (t.adjusted === semi) return `${t.sign}${t.n}`;
  }
  return CONTEXTUAL_SUMMARY[semi];
}

export function chordSummary(chord: Chord): { intervals: string; notes: string } {
  const intervals = chord.tones.map(t => contextualName(t, chord)).join(', ');
  const notes = chord.tones.map(t => NOTES_SHARP[(t + chord.root) % 12]).join(', ');
  return { intervals, notes };
}
