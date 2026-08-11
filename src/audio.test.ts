import { describe, it, expect } from 'vitest';
import { STRING_MIDI, midiForCell, midiToFreq } from './audio';
import { OPEN_STRINGS } from './chord';

describe('STRING_MIDI', () => {
  // The fretboard picks its labels from OPEN_STRINGS and its pitches from
  // STRING_MIDI, so the two have to describe the same tuning.
  it('matches the pitch classes the fretboard is drawn from', () => {
    expect(STRING_MIDI.length).toBe(OPEN_STRINGS.length);
    STRING_MIDI.forEach((midi, i) => {
      expect(midi % 12).toBe(OPEN_STRINGS[i]);
    });
  });

  it('runs from the high E down to the low E', () => {
    expect(STRING_MIDI[0]).toBe(64);
    expect(STRING_MIDI[5]).toBe(40);
    expect(STRING_MIDI[0] - STRING_MIDI[5]).toBe(24);
  });
});

describe('midiForCell', () => {
  it('counts a semitone per fret', () => {
    expect(midiForCell(5, 0)).toBe(40);
    expect(midiForCell(5, 5)).toBe(45);
    expect(midiForCell(5, 12)).toBe(52);
  });

  it('gives the same pitch to positions that are the same note', () => {
    // Low E string, 5th fret is the open A string.
    expect(midiForCell(5, 5)).toBe(midiForCell(4, 0));
    // High E string, 5th fret is the open B string plus an octave.
    expect(midiForCell(1, 5)).toBe(midiForCell(0, 0));
  });
});

describe('midiToFreq', () => {
  it('anchors on A440', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 6);
  });

  it('doubles every octave', () => {
    expect(midiToFreq(81)).toBeCloseTo(880, 6);
    expect(midiToFreq(57)).toBeCloseTo(220, 6);
  });

  it('places the open strings where a tuner would', () => {
    expect(midiToFreq(midiForCell(5, 0))).toBeCloseTo(82.41, 2);
    expect(midiToFreq(midiForCell(0, 0))).toBeCloseTo(329.63, 2);
  });
});
