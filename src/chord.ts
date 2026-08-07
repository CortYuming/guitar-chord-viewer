// The single source of truth for degree names, used when no chord context applies.
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

// Movable-do solfege, indexed by semitones above the chord root. Raised
// degrees take an 'i' vowel, lowered ones an 'o'; 'swo' keeps the glide so it
// stays distinct from 'so'.
export const SOLFEGE_SHARP = [
  'do', 'di', 're', 'ri', 'mi', 'fa', 'fi', 'so', 'si', 'la', 'li', 'ti',
] as const;

export const SOLFEGE_FLAT = [
  'do', 'ro', 're', 'mo', 'mi', 'fa', 'swo', 'so', 'lo', 'la', 'to', 'ti',
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

export type Accidental = '♯' | '♭';

// Natural roots whose key signature is on the flat side of the circle of fifths.
// Majors: F only (B♭). Minors: D, G, C, F (their relatives are F, B♭, E♭, A♭).
const FLAT_NATURAL_MAJOR_ROOTS = new Set(['F']);
const FLAT_NATURAL_MINOR_ROOTS = new Set(['D', 'G', 'C', 'F']);

// Pick one accidental per chord, following the circle of fifths:
// an explicit ♯/♭ in the root wins, otherwise the key signature decides.
export function accidentalFor(chord: Chord): Accidental {
  const sign = chord.rootLabel[1];
  if (sign === 'b' || sign === '♭') return '♭';
  if (sign === '#' || sign === '♯') return '♯';
  const isMinor = chord.tones.includes(3) && !chord.tones.includes(4);
  const flatRoots = isMinor ? FLAT_NATURAL_MINOR_ROOTS : FLAT_NATURAL_MAJOR_ROOTS;
  return flatRoots.has(chord.rootLabel[0].toUpperCase()) ? '♭' : '♯';
}

export function noteLabel(semi: number, accidental: Accidental): string {
  return accidental === '♭' ? NOTES_FLAT[semi] : NOTES_SHARP[semi];
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

// The third and the seventh are the guide tones: they carry the chord's
// quality while improvising. Their semitone counts move with the quality
// (m3=3 / M3=4, ♭7=10 / M7=11) and some chords have neither, so read them
// from the quality's own base tones. Reading them from chord.tones would be
// wrong: a ♯9 tension also lands on 3 and would pass for a minor third.
export function guideTones(chord: Chord): {
  third: number | null;
  seventh: number | null;
} {
  const raw = QUALITY_MAP[chord.quality] ?? [0, 4, 7];
  const base = Array.isArray(raw) ? raw : raw.tones;
  const altered = chord.tensions.find(t => t.n === 7);
  return {
    third: base.includes(4) ? 4 : base.includes(3) ? 3 : null,
    seventh: altered
      ? altered.adjusted
      : base.includes(11) ? 11 : base.includes(10) ? 10 : null,
  };
}

export function contextualName(semi: number, chord: Chord): string {
  for (const t of chord.tensions) {
    if (t.adjusted === semi) return `${t.sign}${t.n}`;
  }
  return CONTEXTUAL_SUMMARY[semi];
}

// Solfege counterpart of contextualName, so the two labellings always agree.
// The flat row is the default because CONTEXTUAL_SUMMARY spells unaltered
// degrees with flats (♭3, ♭7, ...). An altered tension carries its own sign,
// so ♯9 reads 'ri', not 'mo'.
export function solfegeName(semi: number, chord: Chord): string {
  for (const t of chord.tensions) {
    if (t.adjusted === semi) {
      return t.sign === '♯' ? SOLFEGE_SHARP[semi] : SOLFEGE_FLAT[semi];
    }
  }
  return SOLFEGE_FLAT[semi];
}

// Degree names for all 12 semitones, contextualized to the chord when there is one.
export function degreeLabels(chord: Chord | null): string[] {
  return Array.from({ length: 12 }, (_, semi) =>
    chord ? contextualName(semi, chord) : CONTEXTUAL_SUMMARY[semi],
  );
}

// Solfege counterpart of degreeLabels. Without a chord, the flat row matches
// the flat-leaning defaults in CONTEXTUAL_SUMMARY.
export function solfegeLabels(chord: Chord | null): string[] {
  return Array.from({ length: 12 }, (_, semi) =>
    chord ? solfegeName(semi, chord) : SOLFEGE_FLAT[semi],
  );
}

// Degree/note pairs in chord-tone order, so the UI can stack them in aligned columns.
export function chordTonePairs(
  chord: Chord,
): { interval: string; note: string; solfege: string }[] {
  const accidental = accidentalFor(chord);
  return chord.tones.map(t => ({
    interval: contextualName(t, chord),
    note: noteLabel((t + chord.root) % 12, accidental),
    solfege: solfegeName(t, chord),
  }));
}

export function chordSummary(chord: Chord): { intervals: string; notes: string } {
  const pairs = chordTonePairs(chord);
  return {
    intervals: pairs.map(p => p.interval).join(', '),
    notes: pairs.map(p => p.note).join(', '),
  };
}
