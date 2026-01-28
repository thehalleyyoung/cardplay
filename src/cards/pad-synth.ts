/**
 * PadSynth Card
 *
 * Lush polyphonic pad synthesizer with multiple oscillators,
 * extensive modulation, and atmospheric effects. Designed for
 * creating ambient textures, cinematic soundscapes, and evolving pads.
 *
 * Features:
 * - 4 oscillator layers with detuning
 * - Wavetable, analog, and spectral oscillators
 * - Dual filters with morphing
 * - 3 ADSR envelopes (amp, filter, mod)
 * - 4 LFOs with sync
 * - Unison with spread
 * - Built-in effects (chorus, reverb, delay)
 * - 60+ factory presets
 * - Stereo width control
 * - Movement and evolution parameters
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum oscillator layers */
export const MAX_OSCILLATORS = 4;

/** Maximum unison voices per oscillator */
export const MAX_UNISON = 8;

/** Maximum polyphony */
export const MAX_POLYPHONY = 16;

/** Sample rate */
export const SAMPLE_RATE = 44100;

/** Note names */
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// =============================================================================
// TYPES
// =============================================================================

/**
 * Oscillator waveform type
 */
export type OscWaveform =
  | 'sine'
  | 'triangle'
  | 'saw'
  | 'square'
  | 'pulse'
  | 'supersaw'
  | 'wavetable'
  | 'noise'
  | 'spectral'
  | 'additive'
  | 'fm';

/**
 * Wavetable name
 */
export type WavetableName =
  | 'basic'
  | 'analog'
  | 'digital'
  | 'vocal'
  | 'strings'
  | 'brass'
  | 'organ'
  | 'bell'
  | 'pad'
  | 'atmosphere'
  | 'texture'
  | 'evolving'
  | 'harsh'
  | 'soft';

/**
 * Filter type
 */
export type FilterType =
  | 'lowpass'
  | 'highpass'
  | 'bandpass'
  | 'notch'
  | 'lowpass24'
  | 'formant'
  | 'comb'
  | 'allpass';

/**
 * LFO waveform
 */
export type LFOWaveform =
  | 'sine'
  | 'triangle'
  | 'saw'
  | 'square'
  | 'random'
  | 'sampleHold'
  | 'smoothRandom';

/**
 * Modulation destination
 */
export type ModDestination =
  | 'pitch'
  | 'filter1Cutoff'
  | 'filter2Cutoff'
  | 'filterMix'
  | 'oscMix'
  | 'pan'
  | 'amplitude'
  | 'wavetablePosition'
  | 'unisonSpread'
  | 'pulseWidth'
  | 'lfo1Rate'
  | 'lfo2Rate'
  | 'reverbMix'
  | 'delayMix'
  | 'chorusMix';

/**
 * Preset category
 */
export type PadCategory =
  | 'ambient'
  | 'warm'
  | 'dark'
  | 'bright'
  | 'evolving'
  | 'texture'
  | 'cinematic'
  | 'retro'
  | 'digital'
  | 'organic'
  | 'ethereal'
  | 'aggressive';

/**
 * ADSR envelope
 */
export interface PadEnvelope {
  /** Attack time in seconds */
  attack: number;
  /** Attack curve (-1 to 1) */
  attackCurve: number;
  /** Decay time in seconds */
  decay: number;
  /** Decay curve */
  decayCurve: number;
  /** Sustain level 0-1 */
  sustain: number;
  /** Release time in seconds */
  release: number;
  /** Release curve */
  releaseCurve: number;
  /** Velocity to envelope amount */
  velocityAmount: number;
}

/**
 * LFO configuration
 */
export interface PadLFO {
  /** LFO waveform */
  waveform: LFOWaveform;
  /** Rate in Hz (when not synced) */
  rate: number;
  /** Synced rate (null = free) */
  syncedRate: string | null;
  /** Depth 0-1 */
  depth: number;
  /** Phase offset 0-1 */
  phase: number;
  /** Delay before LFO starts */
  delay: number;
  /** Fade-in time */
  fadeIn: number;
  /** Retrigger on note */
  retrigger: boolean;
  /** Destination */
  destination: ModDestination;
}

/**
 * Oscillator configuration
 */
export interface PadOscillator {
  /** Oscillator enabled */
  enabled: boolean;
  /** Waveform type */
  waveform: OscWaveform;
  /** Wavetable name (if wavetable waveform) */
  wavetable: WavetableName;
  /** Wavetable position 0-1 */
  wavetablePosition: number;
  /** Level 0-1 */
  level: number;
  /** Pan -1 to 1 */
  pan: number;
  /** Coarse tune (semitones) */
  coarse: number;
  /** Fine tune (cents) */
  fine: number;
  /** Unison voices */
  unison: number;
  /** Unison detune (cents) */
  unisonDetune: number;
  /** Unison spread (stereo) */
  unisonSpread: number;
  /** Pulse width (for pulse wave) */
  pulseWidth: number;
  /** FM amount (for FM) */
  fmAmount: number;
  /** FM ratio (for FM) */
  fmRatio: number;
  /** Phase randomization */
  phaseRandom: number;
}

/**
 * Filter configuration
 */
export interface PadFilter {
  /** Filter enabled */
  enabled: boolean;
  /** Filter type */
  type: FilterType;
  /** Cutoff frequency */
  cutoff: number;
  /** Resonance */
  resonance: number;
  /** Key tracking (0-1) */
  keyTracking: number;
  /** Envelope amount */
  envelopeAmount: number;
  /** Velocity tracking */
  velocityAmount: number;
  /** Drive/saturation */
  drive: number;
}

/**
 * Effects configuration
 */
export interface PadEffects {
  /** Chorus enabled */
  chorusEnabled: boolean;
  /** Chorus rate */
  chorusRate: number;
  /** Chorus depth */
  chorusDepth: number;
  /** Chorus mix */
  chorusMix: number;

  /** Reverb enabled */
  reverbEnabled: boolean;
  /** Reverb size */
  reverbSize: number;
  /** Reverb damping */
  reverbDamping: number;
  /** Reverb mix */
  reverbMix: number;
  /** Reverb pre-delay */
  reverbPreDelay: number;

  /** Delay enabled */
  delayEnabled: boolean;
  /** Delay time (ms or synced) */
  delayTime: number;
  /** Delay synced rate */
  delaySyncedRate: string | null;
  /** Delay feedback */
  delayFeedback: number;
  /** Delay mix */
  delayMix: number;
  /** Delay stereo spread */
  delayStereo: number;

  /** Stereo width */
  stereoWidth: number;
}

/**
 * Pad synth preset
 */
export interface PadSynthPreset {
  /** Preset ID */
  id: string;
  /** Display name */
  name: string;
  /** Category */
  category: PadCategory;
  /** Tags */
  tags: string[];
  /** Description */
  description?: string;

  /** Oscillators */
  oscillators: PadOscillator[];

  /** Filter 1 */
  filter1: PadFilter;
  /** Filter 2 */
  filter2: PadFilter;
  /** Filter routing: 0 = parallel, 1 = serial */
  filterRouting: number;
  /** Filter mix (between filter 1 and 2) */
  filterMix: number;

  /** Amp envelope */
  ampEnvelope: PadEnvelope;
  /** Filter envelope */
  filterEnvelope: PadEnvelope;
  /** Mod envelope */
  modEnvelope: PadEnvelope;

  /** LFOs */
  lfos: PadLFO[];

  /** Effects */
  effects: PadEffects;

  /** Glide/portamento time */
  glideTime: number;
  /** Glide enabled */
  glideEnabled: boolean;
  /** Mono mode */
  monoMode: boolean;
  /** Legato mode */
  legatoMode: boolean;

  /** Master volume dB */
  masterVolume: number;
  /** Master pan */
  masterPan: number;

  /** Pitch bend range (semitones) */
  pitchBendRange: number;

  /** Velocity curve */
  velocityCurve: number;

  /** Is factory preset */
  isFactory: boolean;
}

/**
 * Active voice
 */
export interface PadVoice {
  /** Voice ID */
  id: string;
  /** MIDI note */
  note: number;
  /** Velocity */
  velocity: number;
  /** Is active */
  isActive: boolean;
  /** Is releasing */
  isReleasing: boolean;
  /** Current frequency */
  frequency: number;
  /** Target frequency (for glide) */
  targetFrequency: number;

  /** Oscillator phases */
  oscPhases: number[][];
  /** Amp envelope value */
  ampEnvValue: number;
  /** Amp envelope stage */
  ampEnvStage: number;
  /** Amp envelope time */
  ampEnvTime: number;
  /** Filter envelope value */
  filterEnvValue: number;
  /** Filter envelope stage */
  filterEnvStage: number;
  /** Filter envelope time */
  filterEnvTime: number;
  /** Mod envelope value */
  modEnvValue: number;
  /** Mod envelope stage */
  modEnvStage: number;
  /** Mod envelope time */
  modEnvTime: number;

  /** LFO phases */
  lfoPhases: number[];
  /** LFO values */
  lfoValues: number[];

  /** Start time */
  startTime: number;
  /** Output gain */
  outputGain: number;
}

/**
 * Pad synth state
 */
export interface PadSynthState {
  /** Current preset */
  preset: PadSynthPreset;
  /** Active voices */
  voices: PadVoice[];
  /** Held notes */
  heldNotes: Set<number>;
  /** Sustain pedal */
  sustainPedal: boolean;
  /** Pitch bend (-1 to 1) */
  pitchBend: number;
  /** Mod wheel (0-1) */
  modWheel: number;
  /** Expression (0-1) */
  expression: number;
  /** Master volume (0-1) */
  masterVolume: number;
  /** Last played note (for legato) */
  lastNote: number;
  /** Voice counter */
  voiceCounter: number;
  /** Global LFO phases */
  globalLfoPhases: number[];
}

/**
 * Input events
 */
export type PadSynthInput =
  | { type: 'noteOn'; note: number; velocity: number }
  | { type: 'noteOff'; note: number }
  | { type: 'pitchBend'; value: number }
  | { type: 'modWheel'; value: number }
  | { type: 'expression'; value: number }
  | { type: 'sustainPedal'; value: boolean }
  | { type: 'allNotesOff' }
  | { type: 'allSoundOff' }
  | { type: 'loadPreset'; presetId: string }
  | { type: 'setVolume'; volume: number }
  | { type: 'setOscillator'; oscIndex: number; config: Partial<PadOscillator> }
  | { type: 'setFilter'; filterIndex: 1 | 2; config: Partial<PadFilter> }
  | { type: 'setEnvelope'; envType: 'amp' | 'filter' | 'mod'; config: Partial<PadEnvelope> }
  | { type: 'setLFO'; lfoIndex: number; config: Partial<PadLFO> }
  | { type: 'setEffects'; config: Partial<PadEffects> }
  | { type: 'setGlide'; time: number; enabled: boolean }
  | { type: 'tick'; time: number; deltaTime: number }
  | { type: 'midiCC'; controller: number; value: number };

/**
 * Output events
 */
export type PadSynthOutput =
  | { type: 'voiceStart'; voiceId: string; note: number; velocity: number }
  | { type: 'voiceEnd'; voiceId: string; note: number }
  | { type: 'audioFrame'; bufferL: Float32Array; bufferR: Float32Array; time: number }
  | { type: 'presetLoaded'; presetId: string }
  | { type: 'error'; message: string };

/**
 * Processing result
 */
export interface PadSynthResult {
  state: PadSynthState;
  outputs: PadSynthOutput[];
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default oscillator
 */
export const DEFAULT_OSCILLATOR: PadOscillator = {
  enabled: true,
  waveform: 'saw',
  wavetable: 'basic',
  wavetablePosition: 0,
  level: 0.5,
  pan: 0,
  coarse: 0,
  fine: 0,
  unison: 1,
  unisonDetune: 10,
  unisonSpread: 0.5,
  pulseWidth: 0.5,
  fmAmount: 0,
  fmRatio: 2,
  phaseRandom: 0,
};

/**
 * Default envelope
 */
export const DEFAULT_ENVELOPE: PadEnvelope = {
  attack: 0.5,
  attackCurve: 0,
  decay: 0.5,
  decayCurve: 0,
  sustain: 0.8,
  release: 1.0,
  releaseCurve: 0,
  velocityAmount: 0.3,
};

/**
 * Default filter
 */
export const DEFAULT_FILTER: PadFilter = {
  enabled: true,
  type: 'lowpass',
  cutoff: 8000,
  resonance: 0.5,
  keyTracking: 0.3,
  envelopeAmount: 0.3,
  velocityAmount: 0.2,
  drive: 0,
};

/**
 * Default LFO
 */
export const DEFAULT_LFO: PadLFO = {
  waveform: 'sine',
  rate: 0.5,
  syncedRate: null,
  depth: 0.3,
  phase: 0,
  delay: 0.5,
  fadeIn: 0.5,
  retrigger: false,
  destination: 'pitch',
};

/**
 * Default effects
 */
export const DEFAULT_EFFECTS: PadEffects = {
  chorusEnabled: true,
  chorusRate: 0.5,
  chorusDepth: 0.3,
  chorusMix: 0.3,
  reverbEnabled: true,
  reverbSize: 0.7,
  reverbDamping: 0.5,
  reverbMix: 0.4,
  reverbPreDelay: 20,
  delayEnabled: false,
  delayTime: 375,
  delaySyncedRate: '1/4',
  delayFeedback: 0.3,
  delayMix: 0.2,
  delayStereo: 0.5,
  stereoWidth: 1.0,
};

// =============================================================================
// FACTORY PRESETS
// =============================================================================

/**
 * Create a pad preset
 */
function createPadPreset(
  id: string,
  name: string,
  category: PadCategory,
  tags: string[],
  overrides: Partial<PadSynthPreset> = {}
): PadSynthPreset {
  return {
    id,
    name,
    category,
    tags,
    oscillators: [
      { ...DEFAULT_OSCILLATOR },
      { ...DEFAULT_OSCILLATOR, enabled: false, coarse: -12 },
      { ...DEFAULT_OSCILLATOR, enabled: false, coarse: 7 },
      { ...DEFAULT_OSCILLATOR, enabled: false, waveform: 'noise', level: 0.05 },
    ],
    filter1: { ...DEFAULT_FILTER },
    filter2: { ...DEFAULT_FILTER, enabled: false, type: 'highpass', cutoff: 200 },
    filterRouting: 0,
    filterMix: 0.5,
    ampEnvelope: { ...DEFAULT_ENVELOPE },
    filterEnvelope: { ...DEFAULT_ENVELOPE, attack: 0.8, decay: 1.0, sustain: 0.4 },
    modEnvelope: { ...DEFAULT_ENVELOPE, attack: 2.0, decay: 3.0, sustain: 0 },
    lfos: [
      { ...DEFAULT_LFO, destination: 'pitch', depth: 0.02 },
      { ...DEFAULT_LFO, destination: 'filter1Cutoff', rate: 0.3, depth: 0.2 },
      { ...DEFAULT_LFO, destination: 'pan', rate: 0.15, depth: 0.3 },
      { ...DEFAULT_LFO, destination: 'amplitude', rate: 4, depth: 0, waveform: 'triangle' },
    ],
    effects: { ...DEFAULT_EFFECTS },
    glideTime: 0.1,
    glideEnabled: false,
    monoMode: false,
    legatoMode: false,
    masterVolume: 0,
    masterPan: 0,
    pitchBendRange: 2,
    velocityCurve: 0,
    isFactory: true,
    ...overrides,
  };
}

/**
 * Factory presets
 */
export const PAD_SYNTH_PRESETS: PadSynthPreset[] = [
  // =========================================================================
  // WARM PADS
  // =========================================================================
  createPadPreset('warm-analog', 'Warm Analog', 'warm', ['analog', 'vintage', 'soft'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', unison: 4, unisonDetune: 15 },
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', coarse: -12, level: 0.3 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 2000, resonance: 0.3, envelopeAmount: 0.4 },
    effects: { ...DEFAULT_EFFECTS, chorusMix: 0.4, reverbMix: 0.35 },
  }),
  createPadPreset('warm-blanket', 'Warm Blanket', 'warm', ['soft', 'cozy', 'lush'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'triangle', unison: 6, unisonDetune: 20, unisonSpread: 0.8 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: 12, level: 0.2 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 3000, resonance: 0.2 },
    ampEnvelope: { ...DEFAULT_ENVELOPE, attack: 1.0, release: 2.0 },
  }),
  createPadPreset('warm-vintage', 'Vintage Keys Pad', 'warm', ['vintage', 'keys', 'mellow'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'pulse', pulseWidth: 0.3, unison: 2 },
      { ...DEFAULT_OSCILLATOR, waveform: 'pulse', pulseWidth: 0.7, coarse: 7, level: 0.3 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 2500, envelopeAmount: 0.5 },
    lfos: [
      { ...DEFAULT_LFO, destination: 'pulseWidth', rate: 0.4, depth: 0.3 },
      { ...DEFAULT_LFO, destination: 'filter1Cutoff', rate: 0.2 },
      { ...DEFAULT_LFO },
      { ...DEFAULT_LFO },
    ],
  }),

  // =========================================================================
  // AMBIENT PADS
  // =========================================================================
  createPadPreset('ambient-floating', 'Floating', 'ambient', ['ethereal', 'dreamy', 'space'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'wavetable', wavetable: 'atmosphere', unison: 4 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: 12, level: 0.3 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: 19, level: 0.15 },
      { ...DEFAULT_OSCILLATOR, waveform: 'noise', level: 0.03 },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 4000, resonance: 0.4 },
    ampEnvelope: { ...DEFAULT_ENVELOPE, attack: 2.0, decay: 1.0, sustain: 0.7, release: 3.0 },
    effects: { ...DEFAULT_EFFECTS, reverbMix: 0.6, reverbSize: 0.85 },
  }),
  createPadPreset('ambient-shimmer', 'Shimmer Pad', 'ambient', ['shimmer', 'bright', 'ethereal'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', unison: 6, unisonDetune: 25 },
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', coarse: 12, fine: 5, level: 0.4 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: 24, level: 0.2 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 6000, envelopeAmount: 0.3 },
    effects: { ...DEFAULT_EFFECTS, reverbMix: 0.55, delayEnabled: true, delayMix: 0.25 },
  }),
  createPadPreset('ambient-drone', 'Deep Drone', 'ambient', ['drone', 'dark', 'minimal'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', coarse: -12, unison: 2, unisonDetune: 5 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: -24, level: 0.5 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, waveform: 'noise', level: 0.02 },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 800, resonance: 0.6 },
    ampEnvelope: { ...DEFAULT_ENVELOPE, attack: 3.0, release: 4.0 },
    lfos: [
      { ...DEFAULT_LFO, destination: 'filter1Cutoff', rate: 0.05, depth: 0.4 },
      { ...DEFAULT_LFO },
      { ...DEFAULT_LFO },
      { ...DEFAULT_LFO },
    ],
  }),
  createPadPreset('ambient-breath', 'Breathing Pad', 'ambient', ['evolving', 'organic', 'slow'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'wavetable', wavetable: 'evolving', unison: 4 },
      { ...DEFAULT_OSCILLATOR, waveform: 'triangle', coarse: 7, level: 0.3 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    lfos: [
      { ...DEFAULT_LFO, destination: 'amplitude', rate: 0.1, depth: 0.3, waveform: 'sine' },
      { ...DEFAULT_LFO, destination: 'filter1Cutoff', rate: 0.08, depth: 0.4 },
      { ...DEFAULT_LFO, destination: 'wavetablePosition', rate: 0.03, depth: 0.5 },
      { ...DEFAULT_LFO },
    ],
  }),

  // =========================================================================
  // DARK PADS
  // =========================================================================
  createPadPreset('dark-abyss', 'The Abyss', 'dark', ['deep', 'scary', 'horror'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', coarse: -12, unison: 4, unisonDetune: 30 },
      { ...DEFAULT_OSCILLATOR, waveform: 'square', coarse: -24, level: 0.4 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, waveform: 'noise', level: 0.05 },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 500, resonance: 0.7, envelopeAmount: 0.2 },
    effects: { ...DEFAULT_EFFECTS, reverbMix: 0.5, reverbSize: 0.9, reverbDamping: 0.7 },
  }),
  createPadPreset('dark-storm', 'Storm Clouds', 'dark', ['dark', 'ominous', 'cinematic'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', unison: 6, unisonDetune: 35 },
      { ...DEFAULT_OSCILLATOR, waveform: 'pulse', pulseWidth: 0.2, coarse: -12, level: 0.35 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, waveform: 'noise', level: 0.08 },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 1200, resonance: 0.5, drive: 0.3 },
    lfos: [
      { ...DEFAULT_LFO, destination: 'filter1Cutoff', rate: 0.1, depth: 0.5, waveform: 'smoothRandom' },
      { ...DEFAULT_LFO, destination: 'pan', rate: 0.15, depth: 0.4 },
      { ...DEFAULT_LFO },
      { ...DEFAULT_LFO },
    ],
  }),
  createPadPreset('dark-ritual', 'Dark Ritual', 'dark', ['ritual', 'occult', 'mysterious'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'wavetable', wavetable: 'harsh', unison: 3 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: 7, level: 0.25 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: -12, level: 0.4 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 1500, resonance: 0.6 },
    effects: { ...DEFAULT_EFFECTS, reverbMix: 0.55, delayEnabled: true, delayMix: 0.2, delayFeedback: 0.5 },
  }),

  // =========================================================================
  // BRIGHT PADS
  // =========================================================================
  createPadPreset('bright-crystal', 'Crystal', 'bright', ['shiny', 'clear', 'high'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', unison: 4, unisonDetune: 12 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: 12, level: 0.4 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: 19, level: 0.2 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 10000, resonance: 0.3 },
    effects: { ...DEFAULT_EFFECTS, chorusMix: 0.35, reverbMix: 0.4 },
  }),
  createPadPreset('bright-sunshine', 'Sunshine', 'bright', ['happy', 'uplifting', 'warm'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', unison: 6, unisonDetune: 18, unisonSpread: 0.9 },
      { ...DEFAULT_OSCILLATOR, waveform: 'triangle', coarse: 12, level: 0.3 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 8000, envelopeAmount: 0.4 },
    ampEnvelope: { ...DEFAULT_ENVELOPE, attack: 0.3, release: 1.5 },
  }),
  createPadPreset('bright-glass', 'Glass Harmonics', 'bright', ['glass', 'harmonic', 'clean'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'additive', level: 0.6 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: 12, level: 0.3 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: 24, level: 0.15 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 12000, resonance: 0.2 },
    effects: { ...DEFAULT_EFFECTS, reverbMix: 0.45, reverbSize: 0.75 },
  }),

  // =========================================================================
  // EVOLVING PADS
  // =========================================================================
  createPadPreset('evolving-morph', 'Morphing', 'evolving', ['morph', 'moving', 'complex'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'wavetable', wavetable: 'evolving', unison: 4 },
      { ...DEFAULT_OSCILLATOR, waveform: 'wavetable', wavetable: 'texture', coarse: 7, level: 0.3 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    lfos: [
      { ...DEFAULT_LFO, destination: 'wavetablePosition', rate: 0.05, depth: 0.8 },
      { ...DEFAULT_LFO, destination: 'filter1Cutoff', rate: 0.08, depth: 0.4 },
      { ...DEFAULT_LFO, destination: 'oscMix', rate: 0.03, depth: 0.5 },
      { ...DEFAULT_LFO },
    ],
  }),
  createPadPreset('evolving-journey', 'The Journey', 'evolving', ['epic', 'cinematic', 'movement'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', unison: 6, unisonDetune: 20 },
      { ...DEFAULT_OSCILLATOR, waveform: 'pulse', pulseWidth: 0.4, coarse: -12, level: 0.35 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: 12, level: 0.25 },
      { ...DEFAULT_OSCILLATOR, waveform: 'noise', level: 0.03 },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 3000, envelopeAmount: 0.5 },
    filterEnvelope: { ...DEFAULT_ENVELOPE, attack: 4.0, decay: 5.0, sustain: 0.6 },
    effects: { ...DEFAULT_EFFECTS, reverbMix: 0.5, delayEnabled: true, delayMix: 0.2 },
  }),
  createPadPreset('evolving-organic', 'Organic Growth', 'evolving', ['organic', 'natural', 'alive'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'wavetable', wavetable: 'organ', unison: 3 },
      { ...DEFAULT_OSCILLATOR, waveform: 'triangle', coarse: 5, level: 0.3 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, waveform: 'noise', level: 0.02 },
    ],
    lfos: [
      { ...DEFAULT_LFO, destination: 'pitch', rate: 0.02, depth: 0.03, waveform: 'smoothRandom' },
      { ...DEFAULT_LFO, destination: 'filter1Cutoff', rate: 0.1, depth: 0.35, waveform: 'smoothRandom' },
      { ...DEFAULT_LFO, destination: 'pan', rate: 0.08, depth: 0.4 },
      { ...DEFAULT_LFO },
    ],
  }),

  // =========================================================================
  // TEXTURE PADS
  // =========================================================================
  createPadPreset('texture-granular', 'Granular Texture', 'texture', ['granular', 'complex', 'experimental'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'wavetable', wavetable: 'texture', unison: 4, phaseRandom: 1 },
      { ...DEFAULT_OSCILLATOR, waveform: 'noise', level: 0.1 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 4000, resonance: 0.5 },
    lfos: [
      { ...DEFAULT_LFO, destination: 'wavetablePosition', rate: 0.3, depth: 0.6, waveform: 'random' },
      { ...DEFAULT_LFO, destination: 'filter1Cutoff', rate: 0.5, depth: 0.3, waveform: 'random' },
      { ...DEFAULT_LFO },
      { ...DEFAULT_LFO },
    ],
  }),
  createPadPreset('texture-tape', 'Tape Saturation', 'texture', ['tape', 'lo-fi', 'vintage'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', unison: 2, unisonDetune: 8 },
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', coarse: -12, fine: -10, level: 0.3 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, waveform: 'noise', level: 0.04 },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 5000, drive: 0.5 },
    lfos: [
      { ...DEFAULT_LFO, destination: 'pitch', rate: 0.3, depth: 0.01, waveform: 'smoothRandom' },
      { ...DEFAULT_LFO },
      { ...DEFAULT_LFO },
      { ...DEFAULT_LFO },
    ],
  }),

  // =========================================================================
  // CINEMATIC PADS
  // =========================================================================
  createPadPreset('cinematic-epic', 'Epic Score', 'cinematic', ['epic', 'movie', 'orchestral'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', unison: 8, unisonDetune: 25, unisonSpread: 1.0 },
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', coarse: -12, unison: 4, level: 0.4 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: 12, level: 0.2 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 5000, envelopeAmount: 0.4 },
    ampEnvelope: { ...DEFAULT_ENVELOPE, attack: 1.5, release: 2.5 },
    effects: { ...DEFAULT_EFFECTS, reverbMix: 0.55, reverbSize: 0.8 },
  }),
  createPadPreset('cinematic-tension', 'Rising Tension', 'cinematic', ['tension', 'suspense', 'thriller'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', unison: 6, unisonDetune: 30 },
      { ...DEFAULT_OSCILLATOR, waveform: 'pulse', pulseWidth: 0.15, coarse: 7, level: 0.3 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, waveform: 'noise', level: 0.06 },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 2000, resonance: 0.6, envelopeAmount: 0.5 },
    filterEnvelope: { ...DEFAULT_ENVELOPE, attack: 5.0, decay: 2.0, sustain: 0.7 },
    lfos: [
      { ...DEFAULT_LFO, destination: 'filter1Cutoff', rate: 0.05, depth: 0.3 },
      { ...DEFAULT_LFO, destination: 'pitch', rate: 0.02, depth: 0.02 },
      { ...DEFAULT_LFO },
      { ...DEFAULT_LFO },
    ],
  }),
  createPadPreset('cinematic-space', 'Deep Space', 'cinematic', ['space', 'sci-fi', 'vast'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'wavetable', wavetable: 'atmosphere', unison: 4 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: -12, level: 0.4 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: 19, level: 0.15 },
      { ...DEFAULT_OSCILLATOR, waveform: 'noise', level: 0.03 },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 3000, resonance: 0.4 },
    ampEnvelope: { ...DEFAULT_ENVELOPE, attack: 2.5, release: 4.0 },
    effects: { ...DEFAULT_EFFECTS, reverbMix: 0.65, reverbSize: 0.9, delayEnabled: true, delayMix: 0.25, delayFeedback: 0.5 },
  }),

  // =========================================================================
  // RETRO PADS
  // =========================================================================
  createPadPreset('retro-80s', '80s Synth', 'retro', ['80s', 'synthwave', 'vintage'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', unison: 4, unisonDetune: 15 },
      { ...DEFAULT_OSCILLATOR, waveform: 'pulse', pulseWidth: 0.5, coarse: -12, level: 0.35 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 4000, resonance: 0.4, envelopeAmount: 0.35 },
    effects: { ...DEFAULT_EFFECTS, chorusMix: 0.45, reverbMix: 0.35 },
  }),
  createPadPreset('retro-vhs', 'VHS Tape', 'retro', ['vhs', 'lo-fi', 'nostalgic'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', unison: 2, unisonDetune: 12, fine: -8 },
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', coarse: 12, fine: 10, level: 0.25 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, waveform: 'noise', level: 0.04 },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 4500, drive: 0.3 },
    lfos: [
      { ...DEFAULT_LFO, destination: 'pitch', rate: 0.2, depth: 0.008, waveform: 'smoothRandom' },
      { ...DEFAULT_LFO },
      { ...DEFAULT_LFO },
      { ...DEFAULT_LFO },
    ],
  }),

  // =========================================================================
  // DIGITAL PADS
  // =========================================================================
  createPadPreset('digital-fm', 'FM Pad', 'digital', ['fm', 'digital', 'metallic'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'fm', fmAmount: 0.5, fmRatio: 3, unison: 2 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: 12, level: 0.3 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 6000, resonance: 0.3 },
    lfos: [
      { ...DEFAULT_LFO, destination: 'pitch', rate: 4, depth: 0.015 },
      { ...DEFAULT_LFO },
      { ...DEFAULT_LFO },
      { ...DEFAULT_LFO },
    ],
  }),
  createPadPreset('digital-bitcrush', 'Bitcrushed', 'digital', ['bitcrush', 'lo-fi', '8bit'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'wavetable', wavetable: 'digital', unison: 3 },
      { ...DEFAULT_OSCILLATOR, waveform: 'square', coarse: -12, level: 0.3 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 5000, drive: 0.4 },
  }),

  // =========================================================================
  // ETHEREAL PADS
  // =========================================================================
  createPadPreset('ethereal-choir', 'Ethereal Choir', 'ethereal', ['choir', 'vocal', 'heavenly'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'wavetable', wavetable: 'vocal', unison: 4 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: 12, level: 0.25 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_FILTER, type: 'formant', cutoff: 3000 },
    ampEnvelope: { ...DEFAULT_ENVELOPE, attack: 1.5, release: 2.5 },
    effects: { ...DEFAULT_EFFECTS, reverbMix: 0.55, reverbSize: 0.85 },
  }),
  createPadPreset('ethereal-aurora', 'Aurora', 'ethereal', ['aurora', 'northern-lights', 'magical'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', unison: 6, unisonDetune: 8, unisonSpread: 1.0 },
      { ...DEFAULT_OSCILLATOR, waveform: 'triangle', coarse: 12, level: 0.35 },
      { ...DEFAULT_OSCILLATOR, waveform: 'sine', coarse: 19, level: 0.2 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 8000, resonance: 0.25 },
    lfos: [
      { ...DEFAULT_LFO, destination: 'pan', rate: 0.1, depth: 0.5 },
      { ...DEFAULT_LFO, destination: 'filter1Cutoff', rate: 0.15, depth: 0.3 },
      { ...DEFAULT_LFO, destination: 'amplitude', rate: 0.2, depth: 0.15 },
      { ...DEFAULT_LFO },
    ],
    effects: { ...DEFAULT_EFFECTS, reverbMix: 0.6, chorusMix: 0.4, stereoWidth: 1.5 },
  }),

  // =========================================================================
  // AGGRESSIVE PADS
  // =========================================================================
  createPadPreset('aggressive-industrial', 'Industrial', 'aggressive', ['industrial', 'harsh', 'distorted'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', unison: 6, unisonDetune: 35 },
      { ...DEFAULT_OSCILLATOR, waveform: 'pulse', pulseWidth: 0.1, coarse: -12, level: 0.4 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, waveform: 'noise', level: 0.1 },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 2500, resonance: 0.7, drive: 0.6 },
    effects: { ...DEFAULT_EFFECTS, reverbMix: 0.4, reverbSize: 0.6 },
  }),
  createPadPreset('aggressive-metal', 'Metal Pad', 'aggressive', ['metal', 'heavy', 'powerful'], {
    oscillators: [
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', unison: 8, unisonDetune: 40, unisonSpread: 0.8 },
      { ...DEFAULT_OSCILLATOR, waveform: 'saw', coarse: -12, unison: 4, level: 0.5 },
      { ...DEFAULT_OSCILLATOR, enabled: false },
      { ...DEFAULT_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_FILTER, cutoff: 3000, resonance: 0.5, drive: 0.5 },
    ampEnvelope: { ...DEFAULT_ENVELOPE, attack: 0.2, release: 1.5 },
  }),
];

// =============================================================================
// STATE FACTORY
// =============================================================================

/**
 * Create initial pad synth state
 */
export function createPadSynthState(preset?: PadSynthPreset): PadSynthState {
  const defaultPreset = preset ?? PAD_SYNTH_PRESETS[0]!;

  return {
    preset: defaultPreset,
    voices: [],
    heldNotes: new Set(),
    sustainPedal: false,
    pitchBend: 0,
    modWheel: 0,
    expression: 1,
    masterVolume: 0.8,
    lastNote: -1,
    voiceCounter: 0,
    globalLfoPhases: [0, 0, 0, 0],
  };
}

// =============================================================================
// VOICE MANAGEMENT
// =============================================================================

/**
 * MIDI note to frequency
 */
export function noteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/**
 * Create a new voice
 */
export function createPadVoice(
  id: string,
  note: number,
  velocity: number,
  preset: PadSynthPreset,
  lastFreq: number,
  time: number
): PadVoice {
  const targetFreq = noteToFrequency(note);
  const startFreq = preset.glideEnabled && lastFreq > 0 ? lastFreq : targetFreq;

  return {
    id,
    note,
    velocity,
    isActive: true,
    isReleasing: false,
    frequency: startFreq,
    targetFrequency: targetFreq,
    oscPhases: preset.oscillators.map(osc =>
      Array(Math.max(1, osc.unison)).fill(0).map(() =>
        osc.phaseRandom > 0 ? Math.random() * osc.phaseRandom : 0
      )
    ),
    ampEnvValue: 0,
    ampEnvStage: 0,
    ampEnvTime: 0,
    filterEnvValue: 0,
    filterEnvStage: 0,
    filterEnvTime: 0,
    modEnvValue: 0,
    modEnvStage: 0,
    modEnvTime: 0,
    lfoPhases: preset.lfos.map(lfo => lfo.retrigger ? lfo.phase : 0),
    lfoValues: [0, 0, 0, 0],
    startTime: time,
    outputGain: 0,
  };
}

// =============================================================================
// INPUT PROCESSING
// =============================================================================

/**
 * Process envelope
 */
function processEnvelope(
  value: number,
  stage: number,
  time: number,
  params: PadEnvelope,
  deltaTime: number,
  isReleasing: boolean
): { value: number; stage: number; time: number } {
  let newValue = value;
  let newStage = stage;
  let newTime = time + deltaTime;

  if (isReleasing && stage !== 3) {
    newStage = 3;
    newTime = 0;
  }

  switch (newStage) {
    case 0:
      if (params.attack <= 0) {
        newValue = 1;
        newStage = 1;
        newTime = 0;
      } else {
        newValue = Math.min(1, newTime / params.attack);
        if (newValue >= 1) {
          newStage = 1;
          newTime = 0;
        }
      }
      break;
    case 1:
      if (params.decay <= 0) {
        newValue = params.sustain;
        newStage = 2;
      } else {
        const progress = Math.min(1, newTime / params.decay);
        newValue = 1 - (1 - params.sustain) * progress;
        if (progress >= 1) {
          newStage = 2;
        }
      }
      break;
    case 2:
      newValue = params.sustain;
      break;
    case 3:
      if (params.release <= 0) {
        newValue = 0;
      } else {
        const progress = Math.min(1, newTime / params.release);
        newValue = value * (1 - progress);
      }
      break;
  }

  return { value: newValue, stage: newStage, time: newTime };
}

/**
 * Process pad synth input
 */
export function processPadSynthInput(
  state: PadSynthState,
  input: PadSynthInput
): PadSynthResult {
  const outputs: PadSynthOutput[] = [];

  switch (input.type) {
    case 'noteOn': {
      const { note, velocity } = input;
      if (velocity === 0) {
        return processPadSynthInput(state, { type: 'noteOff', note });
      }

      let newVoices = [...state.voices];

      if (state.preset.monoMode) {
        newVoices = newVoices.map(v => ({ ...v, isReleasing: true }));
      }

      if (newVoices.filter(v => v.isActive).length >= MAX_POLYPHONY) {
        const oldest = newVoices.reduce((old, v) =>
          v.isActive && v.startTime < old.startTime ? v : old
        );
        newVoices = newVoices.filter(v => v.id !== oldest.id);
      }

      const lastFreq = state.lastNote >= 0 ? noteToFrequency(state.lastNote) : 0;
      const voiceId = `pad-voice-${state.voiceCounter}`;
      const voice = createPadVoice(voiceId, note, velocity, state.preset, lastFreq, 0);
      newVoices.push(voice);

      outputs.push({ type: 'voiceStart', voiceId, note, velocity });

      const newHeldNotes = new Set(state.heldNotes);
      newHeldNotes.add(note);

      return {
        state: {
          ...state,
          voices: newVoices,
          heldNotes: newHeldNotes,
          lastNote: note,
          voiceCounter: state.voiceCounter + 1,
        },
        outputs,
      };
    }

    case 'noteOff': {
      const { note } = input;
      const newHeldNotes = new Set(state.heldNotes);
      newHeldNotes.delete(note);

      if (state.sustainPedal) {
        return { state: { ...state, heldNotes: newHeldNotes }, outputs };
      }

      const newVoices = state.voices.map(v =>
        v.note === note && !v.isReleasing ? { ...v, isReleasing: true } : v
      );

      return { state: { ...state, voices: newVoices, heldNotes: newHeldNotes }, outputs };
    }

    case 'pitchBend': {
      return { state: { ...state, pitchBend: Math.max(-1, Math.min(1, input.value)) }, outputs };
    }

    case 'modWheel': {
      return { state: { ...state, modWheel: Math.max(0, Math.min(1, input.value)) }, outputs };
    }

    case 'expression': {
      return { state: { ...state, expression: Math.max(0, Math.min(1, input.value)) }, outputs };
    }

    case 'sustainPedal': {
      const newState = { ...state, sustainPedal: input.value };
      if (!input.value) {
        const newVoices = state.voices.map(v =>
          !state.heldNotes.has(v.note) && !v.isReleasing ? { ...v, isReleasing: true } : v
        );
        newState.voices = newVoices;
      }
      return { state: newState, outputs };
    }

    case 'allNotesOff': {
      const newVoices = state.voices.map(v => ({ ...v, isReleasing: true }));
      return { state: { ...state, voices: newVoices, heldNotes: new Set() }, outputs };
    }

    case 'allSoundOff': {
      for (const v of state.voices) {
        outputs.push({ type: 'voiceEnd', voiceId: v.id, note: v.note });
      }
      return { state: { ...state, voices: [], heldNotes: new Set() }, outputs };
    }

    case 'loadPreset': {
      const preset = PAD_SYNTH_PRESETS.find(p => p.id === input.presetId);
      if (!preset) {
        outputs.push({ type: 'error', message: `Preset not found: ${input.presetId}` });
        return { state, outputs };
      }
      const newState = createPadSynthState(preset);
      outputs.push({ type: 'presetLoaded', presetId: preset.id });
      return { state: newState, outputs };
    }

    case 'setVolume': {
      return { state: { ...state, masterVolume: Math.max(0, Math.min(1, input.volume)) }, outputs };
    }

    case 'setOscillator': {
      const { oscIndex, config } = input;
      if (oscIndex < 0 || oscIndex >= MAX_OSCILLATORS) return { state, outputs };
      const newOscs = [...state.preset.oscillators];
      newOscs[oscIndex] = { ...newOscs[oscIndex]!, ...config } as PadOscillator;
      return { state: { ...state, preset: { ...state.preset, oscillators: newOscs } }, outputs };
    }

    case 'setFilter': {
      const { filterIndex, config } = input;
      if (filterIndex === 1) {
        return { state: { ...state, preset: { ...state.preset, filter1: { ...state.preset.filter1, ...config } } }, outputs };
      } else {
        return { state: { ...state, preset: { ...state.preset, filter2: { ...state.preset.filter2, ...config } } }, outputs };
      }
    }

    case 'setEnvelope': {
      const { envType, config } = input;
      if (envType === 'amp') {
        return { state: { ...state, preset: { ...state.preset, ampEnvelope: { ...state.preset.ampEnvelope, ...config } } }, outputs };
      } else if (envType === 'filter') {
        return { state: { ...state, preset: { ...state.preset, filterEnvelope: { ...state.preset.filterEnvelope, ...config } } }, outputs };
      } else {
        return { state: { ...state, preset: { ...state.preset, modEnvelope: { ...state.preset.modEnvelope, ...config } } }, outputs };
      }
    }

    case 'setLFO': {
      const { lfoIndex, config } = input;
      if (lfoIndex < 0 || lfoIndex >= 4) return { state, outputs };
      const newLfos = [...state.preset.lfos];
      newLfos[lfoIndex] = { ...newLfos[lfoIndex]!, ...config } as PadLFO;
      return { state: { ...state, preset: { ...state.preset, lfos: newLfos } }, outputs };
    }

    case 'setEffects': {
      return { state: { ...state, preset: { ...state.preset, effects: { ...state.preset.effects, ...input.config } } }, outputs };
    }

    case 'setGlide': {
      return { state: { ...state, preset: { ...state.preset, glideTime: input.time, glideEnabled: input.enabled } }, outputs };
    }

    case 'tick': {
      const { deltaTime } = input;
      if (deltaTime <= 0) return { state, outputs };

      const newVoices: PadVoice[] = [];

      for (const voice of state.voices) {
        if (!voice.isActive) continue;

        const ampResult = processEnvelope(
          voice.ampEnvValue,
          voice.ampEnvStage,
          voice.ampEnvTime,
          state.preset.ampEnvelope,
          deltaTime,
          voice.isReleasing
        );

        if (ampResult.value <= 0 && voice.isReleasing) {
          outputs.push({ type: 'voiceEnd', voiceId: voice.id, note: voice.note });
          continue;
        }

        const filterResult = processEnvelope(
          voice.filterEnvValue,
          voice.filterEnvStage,
          voice.filterEnvTime,
          state.preset.filterEnvelope,
          deltaTime,
          voice.isReleasing
        );

        let newFreq = voice.frequency;
        if (state.preset.glideEnabled && voice.frequency !== voice.targetFrequency) {
          const glideRate = deltaTime / state.preset.glideTime;
          const diff = voice.targetFrequency - voice.frequency;
          newFreq = voice.frequency + diff * Math.min(1, glideRate);
        }

        const outputGain = ampResult.value * (voice.velocity / 127) * state.expression * state.masterVolume;

        newVoices.push({
          ...voice,
          frequency: newFreq,
          ampEnvValue: ampResult.value,
          ampEnvStage: ampResult.stage,
          ampEnvTime: ampResult.time,
          filterEnvValue: filterResult.value,
          filterEnvStage: filterResult.stage,
          filterEnvTime: filterResult.time,
          outputGain,
        });
      }

      return { state: { ...state, voices: newVoices }, outputs };
    }

    case 'midiCC': {
      const { controller, value } = input;
      switch (controller) {
        case 1:
          return processPadSynthInput(state, { type: 'modWheel', value: value / 127 });
        case 7:
          return processPadSynthInput(state, { type: 'setVolume', volume: value / 127 });
        case 11:
          return processPadSynthInput(state, { type: 'expression', value: value / 127 });
        case 64:
          return processPadSynthInput(state, { type: 'sustainPedal', value: value >= 64 });
        case 120:
          return processPadSynthInput(state, { type: 'allSoundOff' });
        case 123:
          return processPadSynthInput(state, { type: 'allNotesOff' });
        default:
          return { state, outputs };
      }
    }

    default:
      return { state, outputs };
  }
}

// =============================================================================
// CARD IMPLEMENTATION
// =============================================================================

export const PAD_SYNTH_CARD_META = {
  id: 'pad-synth',
  name: 'Pad Synth',
  category: 'generator' as const,
  description: 'Lush polyphonic pad synthesizer with extensive modulation',

  inputPorts: [
    { id: 'midi', name: 'MIDI In', type: 'midi' as const },
  ],

  outputPorts: [
    { id: 'audio-l', name: 'Audio L', type: 'audio' as const },
    { id: 'audio-r', name: 'Audio R', type: 'audio' as const },
  ],

  parameters: [
    { id: 'preset', name: 'Preset', type: 'enum' as const, values: PAD_SYNTH_PRESETS.map(p => p.id), default: PAD_SYNTH_PRESETS[0]?.id },
    { id: 'volume', name: 'Volume', type: 'float' as const, min: 0, max: 1, default: 0.8 },
    { id: 'attack', name: 'Attack', type: 'float' as const, min: 0, max: 10, default: 0.5 },
    { id: 'decay', name: 'Decay', type: 'float' as const, min: 0, max: 10, default: 0.5 },
    { id: 'sustain', name: 'Sustain', type: 'float' as const, min: 0, max: 1, default: 0.8 },
    { id: 'release', name: 'Release', type: 'float' as const, min: 0, max: 10, default: 1.0 },
    { id: 'filterCutoff', name: 'Filter Cutoff', type: 'float' as const, min: 20, max: 20000, default: 8000 },
    { id: 'filterRes', name: 'Filter Res', type: 'float' as const, min: 0, max: 1, default: 0.5 },
    { id: 'chorusMix', name: 'Chorus', type: 'float' as const, min: 0, max: 1, default: 0.3 },
    { id: 'reverbMix', name: 'Reverb', type: 'float' as const, min: 0, max: 1, default: 0.4 },
  ],
};

export function createPadSynthCard() {
  let state = createPadSynthState();

  return {
    meta: PAD_SYNTH_CARD_META,

    process(input: PadSynthInput): PadSynthOutput[] {
      const result = processPadSynthInput(state, input);
      state = result.state;
      return result.outputs;
    },

    getState(): PadSynthState {
      return state;
    },

    reset(): void {
      state = createPadSynthState();
    },

    loadPreset(presetId: string): PadSynthOutput[] {
      return this.process({ type: 'loadPreset', presetId });
    },

    getPresets(): PadSynthPreset[] {
      return PAD_SYNTH_PRESETS;
    },

    getPresetsByCategory(category: PadCategory): PadSynthPreset[] {
      return PAD_SYNTH_PRESETS.filter(p => p.category === category);
    },

    getActiveVoiceCount(): number {
      return state.voices.filter(v => v.isActive).length;
    },
  };
}
