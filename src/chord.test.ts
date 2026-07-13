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
