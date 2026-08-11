// Plucked-string synthesis on the Web Audio API.
//
// Karplus-Strong keeps the app free of audio assets: a burst of noise is pushed
// through a delay line one period long, and the filter that writes it back sets
// the pitch while rolling the high end off a little on every lap — which is
// roughly what a real string does. Three details take it past a rubber band:
// the loop is tuned with a fractional delay so the pitch is exact, the noise is
// combed at the picking point, and every note is two slightly detuned strings
// rather than one. The result runs through a body EQ. Rendering a pitch costs a
// few milliseconds and is cached.

// Standard EADGBE tuning as MIDI note numbers. Index 0 is the high E, i.e. the
// top row of the fretboard, so this lines up with OPEN_STRINGS in chord.ts.
export const STRING_MIDI = [64, 59, 55, 50, 45, 40] as const;

const A4_MIDI = 69;
const A4_FREQ = 440;

const BUFFER_SECONDS = 2.6;
const TAIL_FADE_SECONDS = 0.14;

// Where along the string the pick lands, as a fraction of its length. Picking
// away from the middle nulls the harmonics that have a node there, and that is
// most of what makes a pluck sound plucked.
const PICK_POSITION = 0.15;

// A real string vibrates in two planes at once, slightly out of tune with each
// other and damped at different rates. The mismatch is the shimmer and the long
// tail that a single delay line cannot produce: the first plane carries the
// attack and dies quickly, the second rings on underneath it.
const PRIMARY_DECAY = 1.7;
const POLARISATION_DETUNE = 1.0013;
const POLARISATION_DECAY = 3.4;
const POLARISATION_GAIN = 0.42;

// How long a string takes to go quiet when it is played again.
const DAMP_SECONDS = 0.012;

// Six voices at once have to fit without the limiter grabbing at them, so the
// headroom is taken here rather than won back by compression.
const MASTER_GAIN = 0.55;

// No two plucks of a guitar are identical, but a cached buffer is. A little
// spread in pitch and strength per voice is what stops a strum sounding like
// six copies of a machine.
const VOICE_DETUNE = 0.0018;
const VOICE_GAIN_SPREAD = 0.12;

// A down-stroke is not a metronome: the pick picks up speed as it crosses the
// strings, and no two gaps come out equal.
const STRUM_GAP_FIRST = 0.026;
const STRUM_GAP_LAST = 0.013;
const STRUM_JITTER = 0.003;

// It also leans on the treble strings, brushing the bass ones on the way past.
// Index 0 is the high E.
const STRING_VELOCITY = [1, 0.97, 0.93, 0.89, 0.85, 0.82];

// And the wound bass strings are darker than the plain trebles.
const STRING_TONE_HZ = [7000, 6200, 5200, 4200, 3400, 2800];

// Rendered notes are around half a megabyte each, so the cache is bounded
// rather than left to grow over every position on the neck.
const MAX_CACHED_BUFFERS = 24;

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bodyIn: BiquadFilterNode | null = null;

const buffers = new Map<number, AudioBuffer>();

// The voice currently ringing on each string, so replaying a string damps it
// instead of stacking a second note on top.
const ringing = new Map<number, GainNode>();

export function isAudioSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as WebkitWindow;
  return typeof window.AudioContext !== 'undefined' || typeof w.webkitAudioContext !== 'undefined';
}

export function midiToFreq(midi: number): number {
  return A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12);
}

export function midiForCell(stringIdx: number, fret: number): number {
  return STRING_MIDI[stringIdx] + fret;
}

/** Air resonance, the main top-plate mode, and a little presence. The string is
 *  the note; this is the box it is nailed to. Returns the input node. */
function buildBody(context: AudioContext, destination: AudioNode): BiquadFilterNode {
  const highpass = context.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 70;

  const air = context.createBiquadFilter();
  air.type = 'peaking';
  air.frequency.value = 110;
  air.Q.value = 1.1;
  air.gain.value = 4.5;

  const top = context.createBiquadFilter();
  top.type = 'peaking';
  top.frequency.value = 215;
  top.Q.value = 1.4;
  top.gain.value = 2.5;

  const presence = context.createBiquadFilter();
  presence.type = 'peaking';
  presence.frequency.value = 2600;
  presence.Q.value = 0.8;
  presence.gain.value = 2;

  const lowpass = context.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 6500;
  lowpass.Q.value = 0.7;

  highpass.connect(air);
  air.connect(top);
  top.connect(presence);
  presence.connect(lowpass);
  lowpass.connect(destination);
  return highpass;
}

/** Lazily builds the context. Call this from a user gesture: Safari starts the
 *  context suspended and only a gesture may resume it. */
function getContext(): AudioContext | null {
  if (!isAudioSupported()) return null;
  if (!ctx) {
    const w = window as WebkitWindow;
    const Ctor = window.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    // A safety net for a full strum, not an effect. The stock settings clamp a
    // chord hard enough to hear it duck and swell back, so this one is set to
    // catch peaks and otherwise stay out of the way.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.knee.value = 10;
    comp.ratio.value = 2.5;
    comp.attack.value = 0.004;
    comp.release.value = 0.14;
    master.connect(comp);
    comp.connect(ctx.destination);
    bodyIn = buildBody(ctx, master);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Runs one string into `out`, tuned by a first-order allpass so the loop is
 *  exactly one period long rather than a rounded number of samples. Rounding
 *  costs up to ~20 cents at the top of the neck, which is audibly flat. */
function runLoop(
  out: Float32Array,
  rate: number,
  freq: number,
  decaySeconds: number,
  gain: number,
): void {
  const period = rate / freq;
  // The two-point average in the loop is worth half a sample of delay, so the
  // delay line and the allpass have to make up the rest.
  let n = Math.floor(period - 0.5);
  let frac = period - 0.5 - n;
  // An allpass is ill-behaved near zero delay; borrow a sample from the line.
  if (frac < 0.1) {
    n -= 1;
    frac += 1;
  }
  n = Math.max(2, n);
  const coeff = (1 - frac) / (1 + frac);

  // A pick excites less high end than white noise does, so the seed gets a
  // one-pole lowpass before it is combed and fed to the delay line.
  const seed = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    lp = lp * 0.6 + (Math.random() * 2 - 1) * 0.4;
    seed[i] = lp;
  }

  const line = new Float32Array(n);
  const pick = Math.max(1, Math.round(PICK_POSITION * n));
  for (let i = 0; i < n; i++) line[i] = seed[i] - seed[(i - pick + n) % n];

  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(line[i]));
  if (peak > 0) {
    for (let i = 0; i < n; i++) line[i] /= peak;
  }

  // Loop gain chosen so the amplitude reaches -60 dB after decaySeconds,
  // whatever the pitch: the line goes round freq times per second. Held
  // constant across pitches, otherwise the short high-string loops run out long
  // before the low E stops droning underneath them.
  const loopGain = Math.exp(Math.log(0.001) / (freq * decaySeconds));

  let idx = 0;
  let lpPrev = 0;
  let apX = 0;
  let apY = 0;
  for (let i = 0; i < out.length; i++) {
    const s = line[idx];
    out[i] += s * gain;
    const damped = (s + lpPrev) * 0.5 * loopGain;
    lpPrev = s;
    const ap = coeff * damped + apX - coeff * apY;
    apX = damped;
    apY = ap;
    line[idx] = ap;
    idx = (idx + 1) % n;
  }
}

/** The pick itself hitting the string: a short, quiet click in front of the
 *  note. Without it the note fades in rather than starting. */
function addPickTransient(out: Float32Array, rate: number): void {
  const len = Math.min(out.length, Math.ceil(0.006 * rate));
  let lp = 0;
  for (let i = 0; i < len; i++) {
    lp = lp * 0.45 + (Math.random() * 2 - 1) * 0.55;
    const envelope = 1 - i / len;
    out[i] += lp * 0.22 * envelope * envelope;
  }
}

function renderPluck(context: AudioContext, freq: number): AudioBuffer {
  const rate = context.sampleRate;
  const length = Math.ceil(BUFFER_SECONDS * rate);
  const buffer = context.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);

  runLoop(out, rate, freq, PRIMARY_DECAY, 1);
  runLoop(out, rate, freq * POLARISATION_DETUNE, POLARISATION_DECAY, POLARISATION_GAIN);
  addPickTransient(out, rate);

  // Fade the tail so the buffer never ends on a step.
  const fade = Math.min(length, Math.ceil(TAIL_FADE_SECONDS * rate));
  for (let i = 0; i < fade; i++) {
    out[length - fade + i] *= 1 - i / fade;
  }

  // Every pitch leaves the renderer at the same level, so a chord is balanced
  // by what is played rather than by how the delay lines happened to land.
  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) {
    const scale = 0.9 / peak;
    for (let i = 0; i < length; i++) out[i] *= scale;
  }

  return buffer;
}

function getBuffer(context: AudioContext, midi: number): AudioBuffer {
  let buffer = buffers.get(midi);
  if (!buffer) {
    buffer = renderPluck(context, midiToFreq(midi));
    if (buffers.size >= MAX_CACHED_BUFFERS) {
      const oldest = buffers.keys().next();
      if (!oldest.done) buffers.delete(oldest.value);
    }
    buffers.set(midi, buffer);
  }
  return buffer;
}

/** Sounds one fretted position. `delaySeconds` offsets the start, which is how
 *  strum() spreads a chord across the strings, and `velocity` scales how hard
 *  the string is hit. */
export function playFret(
  stringIdx: number,
  fret: number,
  delaySeconds = 0,
  velocity = 1,
): void {
  const context = getContext();
  if (!context || !bodyIn) return;

  const when = context.currentTime + delaySeconds;
  const buffer = getBuffer(context, midiForCell(stringIdx, fret));

  const prev = ringing.get(stringIdx);
  if (prev) {
    prev.gain.cancelScheduledValues(when);
    prev.gain.setTargetAtTime(0, when, DAMP_SECONDS);
  }

  const gain = context.createGain();
  gain.gain.value = velocity * (1 - Math.random() * VOICE_GAIN_SPREAD);

  const tone = context.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = STRING_TONE_HZ[stringIdx];
  tone.Q.value = 0.7;

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = 1 + (Math.random() * 2 - 1) * VOICE_DETUNE;
  source.connect(tone);
  tone.connect(gain);
  gain.connect(bodyIn);
  source.start(when);

  ringing.set(stringIdx, gain);
  source.onended = () => {
    if (ringing.get(stringIdx) === gain) ringing.delete(stringIdx);
    tone.disconnect();
    gain.disconnect();
  };
}

/** Plays several positions as one chord. Callers pass them in the order they
 *  should be struck — low string first for a downstroke. */
export function strum(positions: { stringIdx: number; fret: number }[]): void {
  let when = 0;
  positions.forEach((p, i) => {
    playFret(p.stringIdx, p.fret, when, STRING_VELOCITY[p.stringIdx]);
    const progress = positions.length > 1 ? i / (positions.length - 1) : 0;
    const gap = STRUM_GAP_FIRST + (STRUM_GAP_LAST - STRUM_GAP_FIRST) * progress;
    when += Math.max(0.004, gap + (Math.random() * 2 - 1) * STRUM_JITTER);
  });
}
