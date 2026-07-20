import { describe, it, expect } from 'vitest';
import { parseChord, chordSummary, normalizeToASCII } from './chord';

describe('parseChord', () => {
  it('parses simple major triad', () => {
    const c = parseChord('C')!;
    expect(c.root).toBe(0);
    expect(c.tones).toEqual([0, 4, 7]);
  });

  it('parses F7+5+9 as altered dominant', () => {
    const c = parseChord('F7+5+9')!;
    expect(c.root).toBe(5);
    expect(c.quality).toBe('7');
    expect(c.tones).toEqual([0, 3, 4, 8, 10]);
    expect(c.tensions).toHaveLength(2);
    expect(c.tensions[0]).toMatchObject({ n: 5, sign: '♯', adjusted: 8 });
    expect(c.tensions[1]).toMatchObject({ n: 9, sign: '♯', adjusted: 3 });
  });

  it('parses Fmaj7', () => {
    const c = parseChord('Fmaj7')!;
    expect(c.root).toBe(5);
    expect(c.tones).toEqual([0, 4, 7, 11]);
  });

  it('parses Am7', () => {
    const c = parseChord('Am7')!;
    expect(c.root).toBe(9);
    expect(c.tones).toEqual([0, 3, 7, 10]);
  });

  it('parses Dm7b5 (half-diminished)', () => {
    const c = parseChord('Dm7b5')!;
    expect(c.root).toBe(2);
    expect(c.tones).toEqual([0, 3, 6, 10]);
  });

  it('parses F#m7 with sharp root', () => {
    const c = parseChord('F#m7')!;
    expect(c.root).toBe(6);
    expect(c.tones).toEqual([0, 3, 7, 10]);
  });

  it('parses Bb7 with flat root', () => {
    const c = parseChord('Bb7')!;
    expect(c.root).toBe(10);
    expect(c.tones).toEqual([0, 4, 7, 10]);
  });

  it('accepts unicode sharp/flat symbols', () => {
    const c1 = parseChord('F♯m7')!;
    const c2 = parseChord('F#m7')!;
    expect(c1.root).toBe(c2.root);
    expect(c1.tones).toEqual(c2.tones);

    const c3 = parseChord('B♭7')!;
    const c4 = parseChord('Bb7')!;
    expect(c3.root).toBe(c4.root);
  });

  it('accepts # in tension positions (equivalent to +)', () => {
    const a = parseChord('F7#5#9')!;
    const b = parseChord('F7+5+9')!;
    expect(a.tones).toEqual(b.tones);
  });

  it('parses G13 with 13th', () => {
    const c = parseChord('G13')!;
    expect(c.root).toBe(7);
    expect(c.tones).toEqual([0, 2, 4, 5, 7, 9, 10]);
  });

  it('parses Ebmaj9', () => {
    const c = parseChord('Ebmaj9')!;
    expect(c.root).toBe(3);
    expect(c.tones).toEqual([0, 2, 4, 7, 11]);
  });

  it('parses F#dim7', () => {
    const c = parseChord('F#dim7')!;
    expect(c.root).toBe(6);
    expect(c.tones).toEqual([0, 3, 6, 9]);
  });

  it('parses Bb°7 same as Bb dim7', () => {
    const a = parseChord('Bb°7')!;
    const b = parseChord('Bbdim7')!;
    expect(a.tones).toEqual(b.tones);
  });

  it('parses C° as diminished triad', () => {
    const c = parseChord('C°')!;
    expect(c.tones).toEqual([0, 3, 6]);
  });

  it('parses Csus4', () => {
    const c = parseChord('Csus4')!;
    expect(c.root).toBe(0);
    expect(c.tones).toEqual([0, 5, 7]);
  });

  it('returns null for invalid input', () => {
    expect(parseChord('')).toBeNull();
    expect(parseChord('xyz')).toBeNull();
    expect(parseChord('H')).toBeNull();
  });

  it('handles b9 tension', () => {
    const c = parseChord('C7b9')!;
    expect(c.tones).toContain(1);
  });

  it('replaces natural 5 when +5 is specified', () => {
    const c = parseChord('C7+5')!;
    expect(c.tones).not.toContain(7);
    expect(c.tones).toContain(8);
  });
});

describe('chordSummary', () => {
  it('shows tension names in summary for F7+5+9', () => {
    const c = parseChord('F7+5+9')!;
    const s = chordSummary(c);
    expect(s.intervals).toContain('♯5');
    expect(s.intervals).toContain('♯9');
    expect(s.notes).toContain('F');
    expect(s.notes).toContain('A');
  });

  it('uses traditional degree names when no tension override', () => {
    const c = parseChord('Fm7')!;
    const s = chordSummary(c);
    expect(s.intervals).toBe('R, ♭3, 5, ♭7');
  });
});

describe('normalizeToASCII', () => {
  it('converts ♯ to # and ♭ to b', () => {
    expect(normalizeToASCII('F♯m7♭5')).toBe('F#m7b5');
    expect(normalizeToASCII('F#m7b5')).toBe('F#m7b5');
  });
});

describe('parseChord — maj7 aliases', () => {
  it('parses C∆7 (INCREMENT) same as CΔ7', () => {
    const a = parseChord('C∆7')!;
    const b = parseChord('CΔ7')!;
    expect(a.tones).toEqual(b.tones);
    expect(a.tones).toEqual([0, 4, 7, 11]);
  });

  it('parses C△7 (WHITE TRIANGLE) same as CΔ7', () => {
    const a = parseChord('C△7')!;
    const b = parseChord('CΔ7')!;
    expect(a.tones).toEqual(b.tones);
  });

  it('parses Cmajor7 same as Cmaj7', () => {
    const a = parseChord('Cmajor7')!;
    const b = parseChord('Cmaj7')!;
    expect(a.tones).toEqual(b.tones);
    expect(a.tones).toEqual([0, 4, 7, 11]);
  });

  it('parses CMajor7 (capitalized) same as Cmaj7', () => {
    const a = parseChord('CMajor7')!;
    const b = parseChord('Cmaj7')!;
    expect(a.tones).toEqual(b.tones);
  });

  it('parses CMa7 same as Cmaj7', () => {
    const a = parseChord('CMa7')!;
    const b = parseChord('Cmaj7')!;
    expect(a.tones).toEqual(b.tones);
  });

  it('parses CMA7 same as Cmaj7', () => {
    const a = parseChord('CMA7')!;
    const b = parseChord('Cmaj7')!;
    expect(a.tones).toEqual(b.tones);
  });

  it('parses "C maj 7" (with spaces) as Cmaj7', () => {
    const a = parseChord('C maj 7')!;
    const b = parseChord('Cmaj7')!;
    expect(a.tones).toEqual(b.tones);
  });

  it('parses "C major 7" (with spaces) as Cmaj7', () => {
    const a = parseChord('C major 7')!;
    const b = parseChord('Cmaj7')!;
    expect(a.tones).toEqual(b.tones);
  });
});

describe('parseChord — half-diminished ø', () => {
  it('parses Bø same as Bm7b5', () => {
    const a = parseChord('Bø')!;
    const b = parseChord('Bm7b5')!;
    expect(a.tones).toEqual(b.tones);
    expect(a.tones).toEqual([0, 3, 6, 10]);
  });

  it('parses Bø7 same as Bm7b5', () => {
    const a = parseChord('Bø7')!;
    const b = parseChord('Bm7b5')!;
    expect(a.tones).toEqual(b.tones);
  });
});

describe('parseChord — add / 6/9 / sus jazz voicings', () => {
  it('parses Cadd9', () => {
    const c = parseChord('Cadd9')!;
    expect(c.tones).toEqual([0, 2, 4, 7]);
  });

  it('parses Cadd11', () => {
    const c = parseChord('Cadd11')!;
    expect(c.tones).toEqual([0, 4, 5, 7]);
  });

  it('parses Cmadd9', () => {
    const c = parseChord('Cmadd9')!;
    expect(c.tones).toEqual([0, 2, 3, 7]);
  });

  it('parses C6/9 same as C69', () => {
    const a = parseChord('C6/9')!;
    const b = parseChord('C69')!;
    expect(a.tones).toEqual(b.tones);
    expect(a.tones).toEqual([0, 2, 4, 7, 9]);
  });

  it('parses Cm6/9 same as Cm69', () => {
    const a = parseChord('Cm6/9')!;
    const b = parseChord('Cm69')!;
    expect(a.tones).toEqual(b.tones);
    expect(a.tones).toEqual([0, 2, 3, 7, 9]);
  });

  it('parses G7sus4', () => {
    const c = parseChord('G7sus4')!;
    expect(c.root).toBe(7);
    expect(c.tones).toEqual([0, 5, 7, 10]);
  });

  it('parses G9sus4', () => {
    const c = parseChord('G9sus4')!;
    expect(c.tones).toEqual([0, 2, 5, 7, 10]);
  });

  it('parses G13sus4', () => {
    const c = parseChord('G13sus4')!;
    expect(c.tones).toEqual([0, 2, 5, 7, 9, 10]);
  });
});

describe('parseChord — altered dominant (alt)', () => {
  it('parses G7alt with all four alterations', () => {
    const c = parseChord('G7alt')!;
    expect(c.root).toBe(7);
    expect(c.tones).toEqual([0, 1, 3, 4, 6, 8, 10]);
  });

  it('parses Galt same as G7alt', () => {
    const a = parseChord('Galt')!;
    const b = parseChord('G7alt')!;
    expect(a.tones).toEqual(b.tones);
  });

  it('shows tension names for G7alt', () => {
    const c = parseChord('G7alt')!;
    const s = chordSummary(c);
    expect(s.intervals).toContain('♭9');
    expect(s.intervals).toContain('♯9');
    expect(s.intervals).toContain('♭5');
    expect(s.intervals).toContain('♯5');
  });
});

describe('parseChord — augmented (Joe Pass notation)', () => {
  it('parses Caug as 1 3 #5', () => {
    const c = parseChord('Caug')!;
    expect(c.tones).toEqual([0, 4, 8]);
  });

  it('parses C+ same as Caug', () => {
    const a = parseChord('C+')!;
    const b = parseChord('Caug')!;
    expect(a.tones).toEqual(b.tones);
    expect(a.tones).toEqual([0, 4, 8]);
  });

  it('parses C7aug / C7+ / C+7 identically as 1 3 #5 7', () => {
    const aug = parseChord('C7aug')!;
    const plus = parseChord('C7+')!;
    const preplus = parseChord('C+7')!;
    expect(aug.tones).toEqual([0, 4, 8, 10]);
    expect(plus.tones).toEqual([0, 4, 8, 10]);
    expect(preplus.tones).toEqual([0, 4, 8, 10]);
  });

  it('shows #5 in summary for augmented chords', () => {
    expect(chordSummary(parseChord('Caug')!).intervals).toContain('♯5');
    expect(chordSummary(parseChord('C7+')!).intervals).toContain('♯5');
  });

  it('parses F7+ as aug7 so #5 (interval 8) is a chord tone', () => {
    const c = parseChord('F7+')!;
    expect(c.root).toBe(5);
    expect(c.tones).toContain(8);
    expect(c.tones).toEqual([0, 4, 8, 10]);
  });

  it('does NOT treat Cm+7 as augmented (it is minor-major7)', () => {
    const c = parseChord('Cm+7')!;
    expect(c.tones).toEqual([0, 3, 7, 11]);
  });

  it('keeps +5 / +9 as tensions, not augmented quality', () => {
    const c = parseChord('C7+5+9')!;
    expect(c.tones).toEqual([0, 3, 4, 8, 10]);
  });
});

describe('parseChord — Δ variants', () => {
  it('parses CΔ9 same as Cmaj9', () => {
    const a = parseChord('CΔ9')!;
    const b = parseChord('Cmaj9')!;
    expect(a.tones).toEqual(b.tones);
  });

  it('parses CΔ13 same as Cmaj13', () => {
    const a = parseChord('CΔ13')!;
    const b = parseChord('Cmaj13')!;
    expect(a.tones).toEqual(b.tones);
  });

  it('parses CmΔ7 same as CmM7', () => {
    const a = parseChord('CmΔ7')!;
    const b = parseChord('CmM7')!;
    expect(a.tones).toEqual(b.tones);
  });
});
