/**
 * @fileoverview CardScript Presets - Common cards in both complete and live forms.
 * 
 * Each preset shows both versions side-by-side to demonstrate the syntax difference.
 * Live versions are optimized for real-time typing, complete versions for LLM generation.
 * 
 * @module @cardplay/user-cards/cardscript/presets
 */

import type { CompleteCardDef } from './live';
import { cardFromComplete, fx, gen, filt, util, n, s } from './live';
import { PortTypes } from '../../cards/card';
import type { Card } from '../../cards/card';

// Utilities are re-exported for documentation but may not be used in this file
export { b, clamp, lerp, mtof, dbtoa } from './live';

// ============================================================================
// GAIN - The simplest effect
// ============================================================================

/** Complete: Full gain definition */
export const GainComplete: CompleteCardDef<number, number> = {
  id: 'fx.gain',
  name: 'Gain',
  category: 'effects',
  description: 'Adjusts the amplitude of an audio signal with optional smoothing',
  author: 'cardplay',
  version: '1.0.0',
  tags: ['audio', 'volume', 'amplitude', 'basic'],
  inputs: [
    { name: 'input', type: PortTypes.AUDIO, label: 'Audio Input', description: 'The audio signal to amplify or attenuate' }
  ],
  outputs: [
    { name: 'output', type: PortTypes.AUDIO, label: 'Audio Output', description: 'The amplitude-adjusted signal' }
  ],
  params: [
    { name: 'gain', type: 'number', default: 1.0, min: 0, max: 4, step: 0.01, label: 'Gain', description: 'Amplitude multiplier', unit: 'x', automatable: true },
    { name: 'smooth', type: 'number', default: 0, min: 0, max: 100, step: 1, label: 'Smoothing', description: 'Parameter smoothing in ms', unit: 'ms', automatable: false }
  ],
  process: (input, _ctx, _state, params) => ({
    output: (input as number) * (params.gain as number)
  })
};

/** Live: Minimal gain (one-liner capable) */
export const GainLive = fx('Gain',
  (i, _c, _s, p) => ({ output: (i as number) * (p.gain as number) }),
  [n('gain', 1, 0, 4)]
);

// ============================================================================
// OSCILLATOR - Basic waveform generator
// ============================================================================

interface OscState { phase: number }

/** Complete: Full oscillator definition */
export const OscillatorComplete: CompleteCardDef<void, number, OscState> = {
  id: 'gen.oscillator',
  name: 'Oscillator',
  category: 'generators',
  description: 'Generates basic waveforms: sine, saw, square, triangle',
  author: 'cardplay',
  version: '1.0.0',
  tags: ['audio', 'synth', 'waveform', 'generator'],
  inputs: [],
  outputs: [
    { name: 'output', type: PortTypes.AUDIO, label: 'Audio Output', description: 'The generated waveform' }
  ],
  params: [
    { name: 'freq', type: 'number', default: 440, min: 20, max: 20000, step: 1, label: 'Frequency', description: 'Oscillator frequency', unit: 'Hz', automatable: true },
    { name: 'wave', type: 'string', default: 'sine', label: 'Waveform', description: 'Wave shape', automatable: false },
    { name: 'amp', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Amplitude', description: 'Output amplitude', unit: 'x', automatable: true }
  ],
  state: { phase: 0 },
  process: (_input, ctx, state, params) => {
    const freq = params.freq as number;
    const wave = params.wave as string;
    const amp = params.amp as number;
    const sr = ctx.engine.sampleRate;
    
    const phaseInc = freq / sr;
    let phase = state.phase;
    let out = 0;
    
    switch (wave) {
      case 'sine': out = Math.sin(phase * Math.PI * 2); break;
      case 'saw': out = 2 * (phase - Math.floor(phase + 0.5)); break;
      case 'square': out = phase < 0.5 ? 1 : -1; break;
      case 'tri': out = 4 * Math.abs(phase - 0.5) - 1; break;
    }
    
    phase = (phase + phaseInc) % 1;
    
    return { output: out * amp, state: { phase } };
  }
};

/** Live: Minimal oscillator */
export const OscLive = gen<void, number, OscState>('Osc',
  (_i, c, st, p) => {
    const ph = st.phase;
    const inc = (p.f as number) / c.engine.sampleRate;
    const w = p.w as string;
    const o = w === 'sin' ? Math.sin(ph * 6.283) :
            w === 'saw' ? 2 * (ph - Math.floor(ph + 0.5)) :
            w === 'sq' ? (ph < 0.5 ? 1 : -1) :
            4 * Math.abs(ph - 0.5) - 1;
    return { output: o * (p.a as number), state: { phase: (ph + inc) % 1 } };
  },
  [n('f', 440, 20, 20000), s('w', 'sin'), n('a', 1, 0, 1)],
  'a',
  { phase: 0 }
);

// ============================================================================
// FILTER - Simple lowpass/highpass
// ============================================================================

interface FilterState { y1: number }

/** Complete: Full filter definition */
export const FilterComplete: CompleteCardDef<number, number, FilterState> = {
  id: 'filt.simple',
  name: 'Simple Filter',
  category: 'filters',
  description: 'One-pole lowpass or highpass filter',
  author: 'cardplay',
  version: '1.0.0',
  tags: ['audio', 'filter', 'lowpass', 'highpass'],
  inputs: [
    { name: 'input', type: PortTypes.AUDIO, label: 'Audio Input', description: 'Signal to filter' }
  ],
  outputs: [
    { name: 'output', type: PortTypes.AUDIO, label: 'Audio Output', description: 'Filtered signal' }
  ],
  params: [
    { name: 'cutoff', type: 'number', default: 1000, min: 20, max: 20000, step: 1, label: 'Cutoff', description: 'Filter cutoff frequency', unit: 'Hz', automatable: true },
    { name: 'mode', type: 'string', default: 'lp', label: 'Mode', description: 'lp=lowpass, hp=highpass', automatable: false }
  ],
  state: { y1: 0 },
  process: (input, ctx, state, params) => {
    const x = input as number;
    const fc = params.cutoff as number;
    const mode = params.mode as string;
    const sr = ctx.engine.sampleRate;
    
    const wc = 2 * Math.PI * fc / sr;
    const a = wc / (wc + 1);
    
    const lp = a * x + (1 - a) * state.y1;
    const out = mode === 'hp' ? x - lp : lp;
    
    return { output: out, state: { y1: lp } };
  }
};

/** Live: Minimal filter */
export const FiltLive = filt<number, number, FilterState>('Filt',
  (i, c, st, p) => {
    const wc = 6.283 * (p.fc as number) / c.engine.sampleRate;
    const a = wc / (wc + 1);
    const lp = a * (i as number) + (1 - a) * st.y1;
    return { output: p.m === 'hp' ? (i as number) - lp : lp, state: { y1: lp } };
  },
  [n('fc', 1000, 20, 20000), s('m', 'lp')],
  'a', 'a',
  { y1: 0 }
);

// ============================================================================
// DELAY - Simple delay line
// ============================================================================

interface DelayState { buffer: number[]; pos: number }

/** Complete: Full delay definition */
export const DelayComplete: CompleteCardDef<number, number, DelayState> = {
  id: 'fx.delay',
  name: 'Delay',
  category: 'effects',
  description: 'Simple delay effect with feedback',
  author: 'cardplay',
  version: '1.0.0',
  tags: ['audio', 'delay', 'echo', 'time'],
  inputs: [
    { name: 'input', type: PortTypes.AUDIO, label: 'Audio Input', description: 'Signal to delay' }
  ],
  outputs: [
    { name: 'output', type: PortTypes.AUDIO, label: 'Audio Output', description: 'Delayed signal' }
  ],
  params: [
    { name: 'time', type: 'number', default: 250, min: 1, max: 2000, step: 1, label: 'Time', description: 'Delay time in milliseconds', unit: 'ms', automatable: true },
    { name: 'feedback', type: 'number', default: 0.3, min: 0, max: 0.99, step: 0.01, label: 'Feedback', description: 'Feedback amount', unit: 'x', automatable: true },
    { name: 'mix', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Mix', description: 'Dry/wet mix', unit: '%', automatable: true }
  ],
  state: { buffer: new Array(96000).fill(0), pos: 0 },
  process: (input, ctx, state, params) => {
    const x = input as number;
    const time = params.time as number;
    const feedback = params.feedback as number;
    const mix = params.mix as number;
    const sr = ctx.engine.sampleRate;
    
    const delaySamples = Math.floor(time * sr / 1000);
    const readPos = (state.pos - delaySamples + state.buffer.length) % state.buffer.length;
    
    const delayed = state.buffer[readPos]!;
    state.buffer[state.pos] = x + delayed * feedback;
    
    const newPos = (state.pos + 1) % state.buffer.length;
    const out = x * (1 - mix) + delayed * mix;
    
    return { output: out, state: { buffer: state.buffer, pos: newPos } };
  }
};

/** Live: Minimal delay */
export const DelayLive = fx<number, number, DelayState>('Delay',
  (i, c, st, p) => {
    const ds = Math.floor((p.t as number) * c.engine.sampleRate / 1000);
    const rp = (st.pos - ds + st.buffer.length) % st.buffer.length;
    const d = st.buffer[rp]!;
    st.buffer[st.pos] = (i as number) + d * (p.fb as number);
    const np = (st.pos + 1) % st.buffer.length;
    return { output: (i as number) * (1 - (p.mx as number)) + d * (p.mx as number), state: { buffer: st.buffer, pos: np } };
  },
  [n('t', 250, 1, 2000), n('fb', 0.3, 0, 0.99), n('mx', 0.5, 0, 1)],
  'a', 'a',
  { buffer: new Array(96000).fill(0), pos: 0 }
);

// ============================================================================
// MIDI TO FREQ - Utility converter
// ============================================================================

/** Complete: Full MIDI to frequency converter */
export const MidiToFreqComplete: CompleteCardDef<number, number> = {
  id: 'util.mtof',
  name: 'MIDI to Freq',
  category: 'utilities',
  description: 'Converts MIDI note number to frequency in Hz',
  author: 'cardplay',
  version: '1.0.0',
  tags: ['midi', 'frequency', 'converter', 'utility'],
  inputs: [
    { name: 'note', type: PortTypes.NUMBER, label: 'MIDI Note', description: 'MIDI note number (0-127)' }
  ],
  outputs: [
    { name: 'freq', type: PortTypes.NUMBER, label: 'Frequency', description: 'Frequency in Hz' }
  ],
  params: [
    { name: 'tuning', type: 'number', default: 440, min: 400, max: 480, step: 0.1, label: 'A4 Tuning', description: 'Reference pitch for A4', unit: 'Hz', automatable: false }
  ],
  process: (input, _ctx, _state, params) => ({
    output: (params.tuning as number) * Math.pow(2, ((input as number) - 69) / 12)
  })
};

/** Live: Minimal MIDI to freq */
export const MtofLive = util<number, number>('mtof',
  (i, _c, _s, p) => ({ output: (p.a4 as number) * Math.pow(2, ((i as number) - 69) / 12) }),
  [n('a4', 440, 400, 480)],
  'n', 'n'
);

// ============================================================================
// SEQUENCER - Pattern step sequencer
// ============================================================================

interface SeqState { step: number; lastTick: number }

/** Complete: Full sequencer definition */
export const SequencerComplete: CompleteCardDef<boolean, number, SeqState> = {
  id: 'gen.sequencer',
  name: 'Sequencer',
  category: 'generators',
  description: 'Step sequencer that outputs values from a pattern',
  author: 'cardplay',
  version: '1.0.0',
  tags: ['pattern', 'sequencer', 'step', 'trigger'],
  inputs: [
    { name: 'trigger', type: PortTypes.TRIGGER, label: 'Clock', description: 'Clock/trigger input to advance step' }
  ],
  outputs: [
    { name: 'value', type: PortTypes.NUMBER, label: 'Value', description: 'Current step value' }
  ],
  params: [
    { name: 'steps', type: 'integer', default: 8, min: 1, max: 64, step: 1, label: 'Steps', description: 'Number of steps in pattern', automatable: false },
    { name: 'pattern', type: 'string', default: '60,62,64,65,67,69,71,72', label: 'Pattern', description: 'Comma-separated values', automatable: false }
  ],
  state: { step: 0, lastTick: -1 },
  process: (input, ctx, state, params) => {
    const triggered = input as boolean;
    const steps = params.steps as number;
    const patternStr = params.pattern as string;
    const values = patternStr.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    
    let step = state.step;
    if (triggered && ctx.currentTick !== state.lastTick) {
      step = (step + 1) % Math.min(steps, values.length);
    }
    
    const value = values[step] ?? 0;
    
    return { output: value, state: { step, lastTick: ctx.currentTick } };
  }
};

/** Live: Minimal sequencer */
export const SeqLive = gen<boolean, number, SeqState>('Seq',
  (i, c, st, p) => {
    const vals = (p.pat as string).split(',').map(Number);
    let stp = st.step;
    if (i && c.currentTick !== st.lastTick) stp = (stp + 1) % Math.min(p.n as number, vals.length);
    return { output: vals[stp] ?? 0, state: { step: stp, lastTick: c.currentTick } };
  },
  [n('n', 8, 1, 64), s('pat', '60,62,64,65,67,69,71,72')],
  't',
  { step: 0, lastTick: -1 }
);

// ============================================================================
// EXPORT ALL CARDS
// ============================================================================

/** All complete card definitions */
export const completeCards = {
  gain: GainComplete,
  oscillator: OscillatorComplete,
  filter: FilterComplete,
  delay: DelayComplete,
  midiToFreq: MidiToFreqComplete,
  sequencer: SequencerComplete,
};

/** All live card instances */
export const liveCards = {
  gain: GainLive,
  osc: OscLive,
  filt: FiltLive,
  delay: DelayLive,
  mtof: MtofLive,
  seq: SeqLive,
};

/** Creates all cards from complete definitions */
export function createCompleteCards(): Map<string, Card<unknown, unknown>> {
  const cards = new Map<string, Card<unknown, unknown>>();
  for (const [_name, def] of Object.entries(completeCards)) {
    // Cast to any to handle varying generic types
    cards.set(def.id, cardFromComplete(def as CompleteCardDef<unknown, unknown, unknown>));
  }
  return cards;
}

/** Quick reference: complete vs live syntax comparison */
export const syntaxComparison = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    COMPLETE vs LIVE SYNTAX COMPARISON                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  COMPLETE (LLM-friendly, ~20 lines):                                         ║
║  ────────────────────────────────────                                        ║
║  const def: CompleteCardDef = {                                              ║
║    id: 'fx.gain',                                                            ║
║    name: 'Gain',                                                             ║
║    category: 'effects',                                                      ║
║    description: 'Adjusts amplitude',                                         ║
║    inputs: [{ name: 'in', type: 'audio', label: 'Input' }],                  ║
║    outputs: [{ name: 'out', type: 'audio', label: 'Output' }],               ║
║    params: [{ name: 'gain', type: 'number', default: 1, min: 0, max: 2 }],   ║
║    process: (i, c, s, p) => ({ output: i * p.gain })                         ║
║  };                                                                          ║
║                                                                              ║
║  LIVE (performance-friendly, 3 lines):                                       ║
║  ─────────────────────────────────────                                       ║
║  const gain = fx('Gain',                                                     ║
║    (i, c, s, p) => ({ output: i * p.gain }),                                 ║
║    [n('gain', 1, 0, 2)]                                                      ║
║  );                                                                          ║
║                                                                              ║
║  ULTRA-SHORT (1 line):                                                       ║
║  ─────────────────────                                                       ║
║  const g = fx('G', (i,c,s,p)=>({output:i*p.g}), [n('g',1,0,2)]);             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;
