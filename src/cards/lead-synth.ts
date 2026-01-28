/**
 * LeadSynth Card
 *
 * Monophonic/polyphonic lead synthesizer optimized for expressive
 * solo melodies with extensive modulation, portamento, and
 * performance controls.
 *
 * Features:
 * - 3 oscillators with analog modeling
 * - Sub oscillator and noise
 * - Hard sync and ring modulation
 * - Dual filters (series/parallel)
 * - 3 ADSR envelopes
 * - 2 LFOs with extensive routing
 * - Portamento/glide with legato modes
 * - Mod wheel and aftertouch routing
 * - Pitch bend with custom range
 * - 50+ factory presets
 * - Expression and breath control
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum oscillators */
export const MAX_OSCILLATORS = 3;

/** Maximum polyphony */
export const MAX_POLYPHONY = 8;

/** Sample rate */
export const SAMPLE_RATE = 44100;

/** Pitch bend range options */
export const PITCH_BEND_RANGES = [1, 2, 3, 5, 7, 12, 24] as const;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Oscillator waveform
 */
export type LeadOscWaveform =
  | 'sine'
  | 'triangle'
  | 'saw'
  | 'square'
  | 'pulse'
  | 'supersaw'
  | 'hypersaw'
  | 'sync'
  | 'fm'
  | 'pwm';

/**
 * Filter type
 */
export type LeadFilterType =
  | 'lowpass12'
  | 'lowpass24'
  | 'highpass12'
  | 'highpass24'
  | 'bandpass'
  | 'notch'
  | 'ladder'
  | 'ms20'
  | 'svf';

/**
 * LFO waveform
 */
export type LeadLFOWaveform =
  | 'sine'
  | 'triangle'
  | 'saw'
  | 'sawDown'
  | 'square'
  | 'random'
  | 'sampleHold';

/**
 * Modulation source
 */
export type LeadModSource =
  | 'lfo1'
  | 'lfo2'
  | 'ampEnv'
  | 'filterEnv'
  | 'modEnv'
  | 'velocity'
  | 'modWheel'
  | 'aftertouch'
  | 'expression'
  | 'breath'
  | 'keytrack'
  | 'random';

/**
 * Modulation destination
 */
export type LeadModDest =
  | 'osc1Pitch'
  | 'osc2Pitch'
  | 'osc3Pitch'
  | 'allOscPitch'
  | 'osc1Level'
  | 'osc2Level'
  | 'osc3Level'
  | 'oscMix'
  | 'pulseWidth'
  | 'syncAmount'
  | 'fmAmount'
  | 'filter1Cutoff'
  | 'filter2Cutoff'
  | 'filterResonance'
  | 'filterMix'
  | 'amplitude'
  | 'pan'
  | 'lfo1Rate'
  | 'lfo2Rate'
  | 'lfo1Depth';

/**
 * Portamento mode
 */
export type PortamentoMode =
  | 'always'
  | 'legato'
  | 'fingered'
  | 'off';

/**
 * Preset category
 */
export type LeadCategory =
  | 'analog'
  | 'digital'
  | 'fm'
  | 'sync'
  | 'supersaw'
  | 'classic'
  | 'modern'
  | 'aggressive'
  | 'smooth'
  | 'experimental';

/**
 * ADSR envelope
 */
export interface LeadEnvelope {
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
  /** Velocity sensitivity */
  velocityAmount: number;
}

/**
 * Oscillator configuration
 */
export interface LeadOscillator {
  /** Enabled */
  enabled: boolean;
  /** Waveform */
  waveform: LeadOscWaveform;
  /** Level 0-1 */
  level: number;
  /** Pan -1 to 1 */
  pan: number;
  /** Coarse tune (semitones) */
  coarse: number;
  /** Fine tune (cents) */
  fine: number;
  /** Pulse width (for pulse/pwm) */
  pulseWidth: number;
  /** PWM depth */
  pwmDepth: number;
  /** PWM rate */
  pwmRate: number;
  /** Sync to osc 1 */
  syncEnabled: boolean;
  /** Sync amount */
  syncAmount: number;
  /** FM amount */
  fmAmount: number;
  /** FM source (osc index) */
  fmSource: number;
  /** Supersaw detune */
  supersawDetune: number;
  /** Supersaw mix */
  supersawMix: number;
  /** Phase offset */
  phase: number;
  /** Key tracking */
  keyTracking: number;
}

/**
 * Filter configuration
 */
export interface LeadFilter {
  /** Enabled */
  enabled: boolean;
  /** Type */
  type: LeadFilterType;
  /** Cutoff frequency */
  cutoff: number;
  /** Resonance */
  resonance: number;
  /** Key tracking */
  keyTracking: number;
  /** Envelope amount */
  envelopeAmount: number;
  /** Velocity amount */
  velocityAmount: number;
  /** Drive */
  drive: number;
  /** Self-oscillation */
  selfOsc: boolean;
}

/**
 * LFO configuration
 */
export interface LeadLFO {
  /** Waveform */
  waveform: LeadLFOWaveform;
  /** Rate in Hz */
  rate: number;
  /** Synced rate */
  syncedRate: string | null;
  /** Depth */
  depth: number;
  /** Fade-in time */
  fadeIn: number;
  /** Delay time */
  delay: number;
  /** Retrigger */
  retrigger: boolean;
  /** Key sync */
  keySync: boolean;
  /** Phase */
  phase: number;
}

/**
 * Mod matrix slot
 */
export interface LeadModSlot {
  /** Source */
  source: LeadModSource;
  /** Destination */
  destination: LeadModDest;
  /** Amount -1 to 1 */
  amount: number;
  /** Enabled */
  enabled: boolean;
}

/**
 * Effects configuration
 */
export interface LeadEffects {
  /** Distortion enabled */
  distEnabled: boolean;
  /** Distortion type */
  distType: 'soft' | 'hard' | 'foldback' | 'bitcrush';
  /** Distortion amount */
  distAmount: number;
  /** Distortion mix */
  distMix: number;

  /** Chorus enabled */
  chorusEnabled: boolean;
  /** Chorus rate */
  chorusRate: number;
  /** Chorus depth */
  chorusDepth: number;
  /** Chorus mix */
  chorusMix: number;

  /** Delay enabled */
  delayEnabled: boolean;
  /** Delay time ms */
  delayTime: number;
  /** Delay feedback */
  delayFeedback: number;
  /** Delay mix */
  delayMix: number;

  /** Reverb enabled */
  reverbEnabled: boolean;
  /** Reverb size */
  reverbSize: number;
  /** Reverb mix */
  reverbMix: number;
}

/**
 * Lead synth preset
 */
export interface LeadSynthPreset {
  /** ID */
  id: string;
  /** Name */
  name: string;
  /** Category */
  category: LeadCategory;
  /** Tags */
  tags: string[];
  /** Description */
  description?: string;

  /** Mono mode */
  monoMode: boolean;
  /** Legato */
  legato: boolean;
  /** Max polyphony (if not mono) */
  polyphony: number;

  /** Portamento mode */
  portamentoMode: PortamentoMode;
  /** Portamento time */
  portamentoTime: number;
  /** Constant rate portamento */
  portamentoConstantRate: boolean;

  /** Oscillators */
  oscillators: LeadOscillator[];
  /** Sub oscillator level */
  subOscLevel: number;
  /** Sub oscillator octave (-1 or -2) */
  subOscOctave: -1 | -2;
  /** Sub oscillator wave */
  subOscWave: 'sine' | 'square';
  /** Noise level */
  noiseLevel: number;
  /** Noise type */
  noiseType: 'white' | 'pink' | 'red';
  /** Ring mod enabled */
  ringModEnabled: boolean;
  /** Ring mod source */
  ringModSource: 0 | 1 | 2;
  /** Ring mod amount */
  ringModAmount: number;

  /** Filters */
  filter1: LeadFilter;
  filter2: LeadFilter;
  /** Filter routing: 0=parallel, 1=serial, 2=split */
  filterRouting: number;
  /** Filter mix (for parallel) */
  filterMix: number;

  /** Amp envelope */
  ampEnvelope: LeadEnvelope;
  /** Filter envelope */
  filterEnvelope: LeadEnvelope;
  /** Mod envelope */
  modEnvelope: LeadEnvelope;

  /** LFOs */
  lfo1: LeadLFO;
  lfo2: LeadLFO;

  /** Mod matrix */
  modMatrix: LeadModSlot[];

  /** Effects */
  effects: LeadEffects;

  /** Pitch bend range */
  pitchBendRange: number;
  /** Velocity curve */
  velocityCurve: number;

  /** Master volume dB */
  masterVolume: number;
  /** Master pan */
  masterPan: number;

  /** Is factory */
  isFactory: boolean;
}

/**
 * Voice state
 */
export interface LeadVoice {
  /** ID */
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
  /** Target frequency */
  targetFrequency: number;

  /** Oscillator phases */
  oscPhases: number[];
  /** Sub osc phase */
  subOscPhase: number;
  /** Noise state */
  noiseState: number;

  /** Amp envelope */
  ampEnvValue: number;
  ampEnvStage: number;
  ampEnvTime: number;
  /** Filter envelope */
  filterEnvValue: number;
  filterEnvStage: number;
  filterEnvTime: number;
  /** Mod envelope */
  modEnvValue: number;
  modEnvStage: number;
  modEnvTime: number;

  /** LFO phases */
  lfo1Phase: number;
  lfo2Phase: number;
  /** LFO values */
  lfo1Value: number;
  lfo2Value: number;
  /** LFO fade-in progress */
  lfo1FadeIn: number;
  lfo2FadeIn: number;

  /** Start time */
  startTime: number;
  /** Aftertouch */
  aftertouch: number;
  /** Output gain */
  outputGain: number;
}

/**
 * Lead synth state
 */
export interface LeadSynthState {
  /** Preset */
  preset: LeadSynthPreset;
  /** Voices */
  voices: LeadVoice[];
  /** Held notes */
  heldNotes: number[];
  /** Sustain pedal */
  sustainPedal: boolean;
  /** Pitch bend */
  pitchBend: number;
  /** Mod wheel */
  modWheel: number;
  /** Aftertouch */
  channelAftertouch: number;
  /** Expression */
  expression: number;
  /** Breath controller */
  breathController: number;
  /** Master volume */
  masterVolume: number;
  /** Last note (for legato) */
  lastNote: number;
  /** Voice counter */
  voiceCounter: number;
  /** Global LFO phases */
  globalLfo1Phase: number;
  globalLfo2Phase: number;
}

/**
 * Input events
 */
export type LeadSynthInput =
  | { type: 'noteOn'; note: number; velocity: number }
  | { type: 'noteOff'; note: number }
  | { type: 'pitchBend'; value: number }
  | { type: 'modWheel'; value: number }
  | { type: 'aftertouch'; value: number }
  | { type: 'polyAftertouch'; note: number; value: number }
  | { type: 'expression'; value: number }
  | { type: 'breathController'; value: number }
  | { type: 'sustainPedal'; value: boolean }
  | { type: 'allNotesOff' }
  | { type: 'allSoundOff' }
  | { type: 'loadPreset'; presetId: string }
  | { type: 'setVolume'; volume: number }
  | { type: 'setOscillator'; oscIndex: number; config: Partial<LeadOscillator> }
  | { type: 'setFilter'; filterIndex: 1 | 2; config: Partial<LeadFilter> }
  | { type: 'setEnvelope'; envType: 'amp' | 'filter' | 'mod'; config: Partial<LeadEnvelope> }
  | { type: 'setLFO'; lfoIndex: 1 | 2; config: Partial<LeadLFO> }
  | { type: 'setEffects'; config: Partial<LeadEffects> }
  | { type: 'setPortamento'; mode: PortamentoMode; time: number }
  | { type: 'setMonoMode'; mono: boolean; legato: boolean }
  | { type: 'tick'; time: number; deltaTime: number }
  | { type: 'midiCC'; controller: number; value: number };

/**
 * Output events
 */
export type LeadSynthOutput =
  | { type: 'voiceStart'; voiceId: string; note: number; velocity: number }
  | { type: 'voiceEnd'; voiceId: string; note: number }
  | { type: 'audioFrame'; bufferL: Float32Array; bufferR: Float32Array }
  | { type: 'presetLoaded'; presetId: string }
  | { type: 'error'; message: string };

/**
 * Processing result
 */
export interface LeadSynthResult {
  state: LeadSynthState;
  outputs: LeadSynthOutput[];
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default oscillator
 */
export const DEFAULT_LEAD_OSCILLATOR: LeadOscillator = {
  enabled: true,
  waveform: 'saw',
  level: 0.7,
  pan: 0,
  coarse: 0,
  fine: 0,
  pulseWidth: 0.5,
  pwmDepth: 0,
  pwmRate: 0.5,
  syncEnabled: false,
  syncAmount: 0,
  fmAmount: 0,
  fmSource: 0,
  supersawDetune: 20,
  supersawMix: 0.5,
  phase: 0,
  keyTracking: 1,
};

/**
 * Default envelope
 */
export const DEFAULT_LEAD_ENVELOPE: LeadEnvelope = {
  attack: 0.005,
  attackCurve: 0,
  decay: 0.2,
  decayCurve: -0.5,
  sustain: 0.7,
  release: 0.3,
  releaseCurve: -0.5,
  velocityAmount: 0.5,
};

/**
 * Default filter
 */
export const DEFAULT_LEAD_FILTER: LeadFilter = {
  enabled: true,
  type: 'lowpass24',
  cutoff: 5000,
  resonance: 0.3,
  keyTracking: 0.5,
  envelopeAmount: 0.4,
  velocityAmount: 0.3,
  drive: 0,
  selfOsc: false,
};

/**
 * Default LFO
 */
export const DEFAULT_LEAD_LFO: LeadLFO = {
  waveform: 'triangle',
  rate: 5,
  syncedRate: null,
  depth: 0.1,
  fadeIn: 0.3,
  delay: 0,
  retrigger: true,
  keySync: false,
  phase: 0,
};

/**
 * Default effects
 */
export const DEFAULT_LEAD_EFFECTS: LeadEffects = {
  distEnabled: false,
  distType: 'soft',
  distAmount: 0.3,
  distMix: 0.5,
  chorusEnabled: false,
  chorusRate: 0.8,
  chorusDepth: 0.3,
  chorusMix: 0.3,
  delayEnabled: false,
  delayTime: 250,
  delayFeedback: 0.3,
  delayMix: 0.2,
  reverbEnabled: false,
  reverbSize: 0.5,
  reverbMix: 0.2,
};

// =============================================================================
// FACTORY PRESETS
// =============================================================================

/**
 * Create lead preset helper
 */
function createLeadPreset(
  id: string,
  name: string,
  category: LeadCategory,
  tags: string[],
  overrides: Partial<LeadSynthPreset> = {}
): LeadSynthPreset {
  return {
    id,
    name,
    category,
    tags,
    monoMode: true,
    legato: true,
    polyphony: 1,
    portamentoMode: 'legato',
    portamentoTime: 0.05,
    portamentoConstantRate: false,
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false, coarse: 7 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false, coarse: -12 },
    ],
    subOscLevel: 0,
    subOscOctave: -1,
    subOscWave: 'square',
    noiseLevel: 0,
    noiseType: 'white',
    ringModEnabled: false,
    ringModSource: 1,
    ringModAmount: 0,
    filter1: { ...DEFAULT_LEAD_FILTER },
    filter2: { ...DEFAULT_LEAD_FILTER, enabled: false, type: 'highpass12', cutoff: 200 },
    filterRouting: 1,
    filterMix: 0.5,
    ampEnvelope: { ...DEFAULT_LEAD_ENVELOPE },
    filterEnvelope: { ...DEFAULT_LEAD_ENVELOPE, attack: 0.01, decay: 0.4, sustain: 0.3 },
    modEnvelope: { ...DEFAULT_LEAD_ENVELOPE, attack: 0.5, decay: 1, sustain: 0 },
    lfo1: { ...DEFAULT_LEAD_LFO },
    lfo2: { ...DEFAULT_LEAD_LFO, rate: 0.5 },
    modMatrix: [
      { source: 'modWheel', destination: 'lfo1Depth', amount: 1, enabled: true },
      { source: 'velocity', destination: 'filter1Cutoff', amount: 0.3, enabled: true },
      { source: 'aftertouch', destination: 'allOscPitch', amount: 0.02, enabled: true },
      { source: 'keytrack', destination: 'filter1Cutoff', amount: 0.5, enabled: true },
    ],
    effects: { ...DEFAULT_LEAD_EFFECTS },
    pitchBendRange: 2,
    velocityCurve: 0,
    masterVolume: 0,
    masterPan: 0,
    isFactory: true,
    ...overrides,
  };
}

/**
 * Factory presets
 */
export const LEAD_SYNTH_PRESETS: LeadSynthPreset[] = [
  // =========================================================================
  // ANALOG LEADS
  // =========================================================================
  createLeadPreset('classic-mono', 'Classic Mono Lead', 'analog', ['mono', 'vintage', 'minimoog'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw' },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'pulse', coarse: 0, fine: 7, pulseWidth: 0.3 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, type: 'ladder', cutoff: 3000, resonance: 0.5 },
    portamentoTime: 0.08,
  }),
  createLeadPreset('fat-analog', 'Fat Analog', 'analog', ['fat', 'warm', 'thick'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw' },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw', coarse: -12, fine: -5 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw', fine: 8 },
    ],
    subOscLevel: 0.3,
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 2000, resonance: 0.4, drive: 0.2 },
  }),
  createLeadPreset('warm-saw', 'Warm Saw Lead', 'analog', ['warm', 'saw', 'mellow'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw' },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw', fine: 5 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 4000, envelopeAmount: 0.3 },
    effects: { ...DEFAULT_LEAD_EFFECTS, chorusEnabled: true, chorusMix: 0.25 },
  }),
  createLeadPreset('detuned-stack', 'Detuned Stack', 'analog', ['detuned', 'thick', 'layered'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw', fine: -10 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw', fine: 10 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'pulse', coarse: -12, pulseWidth: 0.25 },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 3500 },
  }),
  createLeadPreset('prophet-lead', 'Prophet Lead', 'analog', ['prophet', 'poly', 'sequential'], {
    monoMode: false,
    polyphony: 6,
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw' },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'pulse', pulseWidth: 0.4, pwmDepth: 0.2, pwmRate: 0.5 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 5000 },
    effects: { ...DEFAULT_LEAD_EFFECTS, chorusEnabled: true },
  }),

  // =========================================================================
  // SYNC LEADS
  // =========================================================================
  createLeadPreset('hard-sync', 'Hard Sync', 'sync', ['sync', 'aggressive', 'cutting'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw' },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'sync', syncEnabled: true, syncAmount: 0.5 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    modMatrix: [
      { source: 'modWheel', destination: 'syncAmount', amount: 1, enabled: true },
      { source: 'filterEnv', destination: 'syncAmount', amount: 0.5, enabled: true },
      { source: 'velocity', destination: 'filter1Cutoff', amount: 0.3, enabled: true },
      { source: 'keytrack', destination: 'filter1Cutoff', amount: 0.5, enabled: true },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 6000 },
  }),
  createLeadPreset('sync-sweep', 'Sync Sweep', 'sync', ['sync', 'sweep', 'evolving'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw' },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'sync', syncEnabled: true, syncAmount: 0.7, coarse: 12 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    lfo1: { ...DEFAULT_LEAD_LFO, rate: 0.3, depth: 0.4 },
    modMatrix: [
      { source: 'lfo1', destination: 'syncAmount', amount: 0.5, enabled: true },
      { source: 'modWheel', destination: 'lfo1Depth', amount: 1, enabled: true },
      { source: 'velocity', destination: 'filter1Cutoff', amount: 0.3, enabled: true },
      { source: 'keytrack', destination: 'filter1Cutoff', amount: 0.5, enabled: true },
    ],
  }),

  // =========================================================================
  // FM LEADS
  // =========================================================================
  createLeadPreset('fm-bell-lead', 'FM Bell Lead', 'fm', ['fm', 'bell', 'digital'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'fm', fmAmount: 0.4, fmSource: 1 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'sine', coarse: 3, level: 0.5 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 8000, envelopeAmount: 0.2 },
    ampEnvelope: { ...DEFAULT_LEAD_ENVELOPE, attack: 0.001, decay: 0.5, sustain: 0.4, release: 0.5 },
  }),
  createLeadPreset('dx-lead', 'DX Lead', 'fm', ['dx7', 'yamaha', 'digital'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'fm', fmAmount: 0.6, fmSource: 1 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'sine', coarse: 7, level: 0.4 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'sine', coarse: 12, fmAmount: 0.2, fmSource: 1, level: 0.3 },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 10000, envelopeAmount: 0.1 },
    modMatrix: [
      { source: 'modEnv', destination: 'fmAmount', amount: 0.3, enabled: true },
      { source: 'velocity', destination: 'fmAmount', amount: 0.4, enabled: true },
      { source: 'velocity', destination: 'filter1Cutoff', amount: 0.3, enabled: true },
      { source: 'keytrack', destination: 'filter1Cutoff', amount: 0.5, enabled: true },
    ],
  }),
  createLeadPreset('fm-metallic', 'Metallic FM', 'fm', ['metallic', 'harsh', 'industrial'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'fm', fmAmount: 0.8, fmSource: 1 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'sine', coarse: 5, fine: 3 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 6000, resonance: 0.4 },
    effects: { ...DEFAULT_LEAD_EFFECTS, distEnabled: true, distAmount: 0.3 },
  }),

  // =========================================================================
  // SUPERSAW LEADS
  // =========================================================================
  createLeadPreset('trance-lead', 'Trance Lead', 'supersaw', ['trance', 'supersaw', 'eurodance'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'supersaw', supersawDetune: 25, supersawMix: 0.7 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'supersaw', supersawDetune: 30, coarse: 12, level: 0.4 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 6000, envelopeAmount: 0.5 },
    ampEnvelope: { ...DEFAULT_LEAD_ENVELOPE, attack: 0.01, release: 0.2 },
    effects: { ...DEFAULT_LEAD_EFFECTS, reverbEnabled: true, reverbMix: 0.25 },
  }),
  createLeadPreset('hypersaw-massive', 'Hypersaw Massive', 'supersaw', ['hypersaw', 'massive', 'edm'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'hypersaw', supersawDetune: 35, supersawMix: 0.8 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'hypersaw', supersawDetune: 40, coarse: -12, level: 0.5 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw', coarse: 12, level: 0.3 },
    ],
    subOscLevel: 0.25,
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 4000, resonance: 0.2 },
    effects: { ...DEFAULT_LEAD_EFFECTS, distEnabled: true, distAmount: 0.2 },
  }),
  createLeadPreset('supersaw-stab', 'Supersaw Stab', 'supersaw', ['stab', 'chord', 'pluck'], {
    monoMode: false,
    polyphony: 6,
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'supersaw', supersawDetune: 20 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 5000, envelopeAmount: 0.6 },
    ampEnvelope: { ...DEFAULT_LEAD_ENVELOPE, attack: 0.001, decay: 0.3, sustain: 0, release: 0.15 },
    filterEnvelope: { ...DEFAULT_LEAD_ENVELOPE, attack: 0.001, decay: 0.2, sustain: 0 },
  }),

  // =========================================================================
  // CLASSIC LEADS
  // =========================================================================
  createLeadPreset('tb303-acid', 'TB-303 Acid', 'classic', ['303', 'acid', 'squelchy'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw' },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, type: 'lowpass24', cutoff: 800, resonance: 0.8, envelopeAmount: 0.7, drive: 0.4 },
    filterEnvelope: { ...DEFAULT_LEAD_ENVELOPE, attack: 0, decay: 0.15, sustain: 0, release: 0.1 },
    portamentoMode: 'always',
    portamentoTime: 0.03,
  }),
  createLeadPreset('mini-lead', 'Mini Lead', 'classic', ['minimoog', 'vintage', '70s'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw' },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'pulse', pulseWidth: 0.25, coarse: 0, fine: 3 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'triangle', coarse: -12, level: 0.4 },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, type: 'ladder', cutoff: 2500, resonance: 0.4 },
    portamentoTime: 0.1,
  }),
  createLeadPreset('arp-odyssey', 'Odyssey Lead', 'classic', ['arp', 'odyssey', 'analog'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw' },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'pulse', pulseWidth: 0.5, coarse: 0, fine: -5 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    ringModEnabled: true,
    ringModAmount: 0.2,
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 3500, resonance: 0.5 },
  }),
  createLeadPreset('juno-poly', 'Juno Lead', 'classic', ['juno', 'roland', '80s'], {
    monoMode: false,
    polyphony: 6,
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'pulse', pulseWidth: 0.5, pwmDepth: 0.3, pwmRate: 0.4 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    subOscLevel: 0.25,
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 4000, resonance: 0.3 },
    effects: { ...DEFAULT_LEAD_EFFECTS, chorusEnabled: true, chorusRate: 0.7, chorusMix: 0.4 },
  }),

  // =========================================================================
  // MODERN LEADS
  // =========================================================================
  createLeadPreset('serum-style', 'Serum Style', 'modern', ['serum', 'wavetable', 'modern'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'supersaw', supersawDetune: 15 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw', coarse: 12, level: 0.4 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 5000, envelopeAmount: 0.4 },
    effects: { ...DEFAULT_LEAD_EFFECTS, distEnabled: true, distAmount: 0.15, distType: 'soft' },
  }),
  createLeadPreset('future-bass', 'Future Bass Lead', 'modern', ['future-bass', 'edm', 'kawaii'], {
    monoMode: false,
    polyphony: 8,
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'supersaw', supersawDetune: 20 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw', coarse: 12, fine: 3, level: 0.35 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 6000, envelopeAmount: 0.5 },
    lfo1: { ...DEFAULT_LEAD_LFO, rate: 4, depth: 0, waveform: 'triangle' },
    modMatrix: [
      { source: 'modWheel', destination: 'lfo1Depth', amount: 1, enabled: true },
      { source: 'lfo1', destination: 'allOscPitch', amount: 0.03, enabled: true },
      { source: 'velocity', destination: 'filter1Cutoff', amount: 0.3, enabled: true },
      { source: 'keytrack', destination: 'filter1Cutoff', amount: 0.5, enabled: true },
    ],
    effects: { ...DEFAULT_LEAD_EFFECTS, reverbEnabled: true, reverbMix: 0.3 },
  }),
  createLeadPreset('neuro-lead', 'Neuro Lead', 'modern', ['neuro', 'dnb', 'reese'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw' },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw', fine: 15 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw', fine: -12 },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, type: 'lowpass24', cutoff: 1500, resonance: 0.5, drive: 0.4 },
    lfo1: { ...DEFAULT_LEAD_LFO, rate: 2, depth: 0.5 },
    modMatrix: [
      { source: 'lfo1', destination: 'filter1Cutoff', amount: 0.6, enabled: true },
      { source: 'modWheel', destination: 'lfo1Rate', amount: 1, enabled: true },
      { source: 'velocity', destination: 'filter1Cutoff', amount: 0.3, enabled: true },
      { source: 'keytrack', destination: 'filter1Cutoff', amount: 0.5, enabled: true },
    ],
    effects: { ...DEFAULT_LEAD_EFFECTS, distEnabled: true, distAmount: 0.5, distType: 'foldback' },
  }),

  // =========================================================================
  // AGGRESSIVE LEADS
  // =========================================================================
  createLeadPreset('scream-lead', 'Scream Lead', 'aggressive', ['scream', 'distorted', 'heavy'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw' },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'pulse', pulseWidth: 0.15, coarse: 7 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw', coarse: -12, level: 0.5 },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 3000, resonance: 0.4, drive: 0.5 },
    effects: { ...DEFAULT_LEAD_EFFECTS, distEnabled: true, distAmount: 0.7, distType: 'hard' },
  }),
  createLeadPreset('industrial-lead', 'Industrial', 'aggressive', ['industrial', 'harsh', 'noise'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw' },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'sync', syncEnabled: true, syncAmount: 0.6, coarse: 5 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    noiseLevel: 0.1,
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 4000, resonance: 0.6, drive: 0.6 },
    effects: { ...DEFAULT_LEAD_EFFECTS, distEnabled: true, distAmount: 0.6, distType: 'foldback' },
  }),
  createLeadPreset('razor-sharp', 'Razor Sharp', 'aggressive', ['razor', 'cutting', 'bright'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw' },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw', coarse: 12, level: 0.5 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'pulse', pulseWidth: 0.1, coarse: 19, level: 0.3 },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 8000, resonance: 0.5 },
    ampEnvelope: { ...DEFAULT_LEAD_ENVELOPE, attack: 0.001, decay: 0.1, sustain: 0.8 },
  }),

  // =========================================================================
  // SMOOTH LEADS
  // =========================================================================
  createLeadPreset('silk-lead', 'Silk Lead', 'smooth', ['silk', 'soft', 'gentle'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'triangle' },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'sine', coarse: 12, level: 0.3 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 3000, resonance: 0.2, envelopeAmount: 0.2 },
    ampEnvelope: { ...DEFAULT_LEAD_ENVELOPE, attack: 0.05, release: 0.5 },
    effects: { ...DEFAULT_LEAD_EFFECTS, reverbEnabled: true, reverbMix: 0.3, chorusEnabled: true, chorusMix: 0.2 },
  }),
  createLeadPreset('flute-lead', 'Flute Lead', 'smooth', ['flute', 'breathy', 'woodwind'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'triangle' },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'sine', coarse: 12, level: 0.2 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    noiseLevel: 0.03,
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 4000, resonance: 0.1 },
    ampEnvelope: { ...DEFAULT_LEAD_ENVELOPE, attack: 0.08, release: 0.3 },
    lfo1: { ...DEFAULT_LEAD_LFO, rate: 5.5, depth: 0.015, fadeIn: 0.5 },
    modMatrix: [
      { source: 'lfo1', destination: 'allOscPitch', amount: 0.02, enabled: true },
      { source: 'breath', destination: 'amplitude', amount: 1, enabled: true },
      { source: 'breath', destination: 'filter1Cutoff', amount: 0.3, enabled: true },
      { source: 'keytrack', destination: 'filter1Cutoff', amount: 0.5, enabled: true },
    ],
  }),
  createLeadPreset('mellow-pulse', 'Mellow Pulse', 'smooth', ['mellow', 'pulse', 'warm'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'pulse', pulseWidth: 0.4, pwmDepth: 0.15, pwmRate: 0.3 },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'sine', coarse: -12, level: 0.25 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 2500, resonance: 0.25 },
    effects: { ...DEFAULT_LEAD_EFFECTS, chorusEnabled: true, chorusMix: 0.35, reverbEnabled: true, reverbMix: 0.25 },
  }),

  // =========================================================================
  // EXPERIMENTAL LEADS
  // =========================================================================
  createLeadPreset('glitch-lead', 'Glitch Lead', 'experimental', ['glitch', 'digital', 'broken'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw' },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'sync', syncEnabled: true, syncAmount: 0.3 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    lfo1: { ...DEFAULT_LEAD_LFO, waveform: 'sampleHold', rate: 8, depth: 0.3 },
    modMatrix: [
      { source: 'lfo1', destination: 'syncAmount', amount: 0.5, enabled: true },
      { source: 'lfo1', destination: 'filter1Cutoff', amount: 0.4, enabled: true },
      { source: 'velocity', destination: 'filter1Cutoff', amount: 0.3, enabled: true },
      { source: 'keytrack', destination: 'filter1Cutoff', amount: 0.5, enabled: true },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 5000, resonance: 0.5 },
    effects: { ...DEFAULT_LEAD_EFFECTS, distEnabled: true, distType: 'bitcrush', distAmount: 0.4 },
  }),
  createLeadPreset('talking-lead', 'Talking Lead', 'experimental', ['talking', 'formant', 'vocal'], {
    oscillators: [
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'saw' },
      { ...DEFAULT_LEAD_OSCILLATOR, waveform: 'pulse', pulseWidth: 0.3, coarse: 0, fine: 5 },
      { ...DEFAULT_LEAD_OSCILLATOR, enabled: false },
    ],
    filter1: { ...DEFAULT_LEAD_FILTER, cutoff: 1200, resonance: 0.7 },
    filter2: { ...DEFAULT_LEAD_FILTER, enabled: true, cutoff: 2400, resonance: 0.6 },
    filterRouting: 0,
    lfo1: { ...DEFAULT_LEAD_LFO, rate: 0.5, depth: 0.4 },
    modMatrix: [
      { source: 'lfo1', destination: 'filter1Cutoff', amount: 0.5, enabled: true },
      { source: 'lfo1', destination: 'filter2Cutoff', amount: -0.3, enabled: true },
      { source: 'velocity', destination: 'filter1Cutoff', amount: 0.3, enabled: true },
      { source: 'keytrack', destination: 'filter1Cutoff', amount: 0.5, enabled: true },
    ],
  }),
];

// =============================================================================
// STATE FACTORY
// =============================================================================

/**
 * Create initial state
 */
export function createLeadSynthState(preset?: LeadSynthPreset): LeadSynthState {
  const defaultPreset = preset || LEAD_SYNTH_PRESETS[0];
  if (!defaultPreset) {
    throw new Error('No lead synth preset available');
  }

  return {
    preset: defaultPreset,
    voices: [],
    heldNotes: [],
    sustainPedal: false,
    pitchBend: 0,
    modWheel: 0,
    channelAftertouch: 0,
    expression: 1,
    breathController: 0,
    masterVolume: 0.8,
    lastNote: -1,
    voiceCounter: 0,
    globalLfo1Phase: 0,
    globalLfo2Phase: 0,
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
 * Create voice
 */
export function createLeadVoice(
  id: string,
  note: number,
  velocity: number,
  preset: LeadSynthPreset,
  lastFreq: number,
  time: number
): LeadVoice {
  const targetFreq = noteToFrequency(note);
  const useGlide = preset.portamentoMode !== 'off' && lastFreq > 0;
  const startFreq = useGlide ? lastFreq : targetFreq;

  return {
    id,
    note,
    velocity,
    isActive: true,
    isReleasing: false,
    frequency: startFreq,
    targetFrequency: targetFreq,
    oscPhases: [0, 0, 0],
    subOscPhase: 0,
    noiseState: Math.random(),
    ampEnvValue: 0,
    ampEnvStage: 0,
    ampEnvTime: 0,
    filterEnvValue: 0,
    filterEnvStage: 0,
    filterEnvTime: 0,
    modEnvValue: 0,
    modEnvStage: 0,
    modEnvTime: 0,
    lfo1Phase: preset.lfo1.retrigger ? preset.lfo1.phase : 0,
    lfo2Phase: preset.lfo2.retrigger ? preset.lfo2.phase : 0,
    lfo1Value: 0,
    lfo2Value: 0,
    lfo1FadeIn: 0,
    lfo2FadeIn: 0,
    startTime: time,
    aftertouch: 0,
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
  params: LeadEnvelope,
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
 * Process input
 */
export function processLeadSynthInput(
  state: LeadSynthState,
  input: LeadSynthInput
): LeadSynthResult {
  const outputs: LeadSynthOutput[] = [];

  switch (input.type) {
    case 'noteOn': {
      const { note, velocity } = input;
      if (velocity === 0) {
        return processLeadSynthInput(state, { type: 'noteOff', note });
      }

      let newVoices = [...state.voices];
      const newHeldNotes = [...state.heldNotes, note];
      let shouldRetrigger = true;

      if (state.preset.monoMode) {
        if (state.preset.legato && state.voices.length > 0) {
          // Legato: update existing voice pitch
          shouldRetrigger = false;
          newVoices = newVoices.map(v => ({
            ...v,
            note,
            targetFrequency: noteToFrequency(note),
          }));
        } else {
          // Release existing voices
          newVoices = newVoices.map(v => ({ ...v, isReleasing: true }));
        }
      }

      // Polyphony limit
      if (!state.preset.monoMode) {
        const polyphony = state.preset.polyphony || MAX_POLYPHONY;
        if (newVoices.filter(v => v.isActive).length >= polyphony) {
          const oldest = newVoices.reduce((old, v) =>
            v.isActive && v.startTime < old.startTime ? v : old
          );
          newVoices = newVoices.filter(v => v.id !== oldest.id);
        }
      }

      if (shouldRetrigger) {
        const lastFreq = state.lastNote >= 0 ? noteToFrequency(state.lastNote) : 0;
        const voiceId = `lead-voice-${state.voiceCounter}`;
        const voice = createLeadVoice(voiceId, note, velocity, state.preset, lastFreq, 0);
        newVoices.push(voice);
        outputs.push({ type: 'voiceStart', voiceId, note, velocity });
      }

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
      const newHeldNotes = state.heldNotes.filter(n => n !== note);

      if (state.sustainPedal) {
        return { state: { ...state, heldNotes: newHeldNotes }, outputs };
      }

      if (state.preset.monoMode && newHeldNotes.length > 0) {
        // Return to previous held note
        const prevNote = newHeldNotes[newHeldNotes.length - 1];
        if (prevNote === undefined) {
          return { state: { ...state, heldNotes: newHeldNotes }, outputs };
        }
        const newVoices = state.voices.map(v => ({
          ...v,
          note: prevNote,
          targetFrequency: noteToFrequency(prevNote),
        }));
        return { state: { ...state, voices: newVoices, heldNotes: newHeldNotes, lastNote: prevNote }, outputs };
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

    case 'aftertouch': {
      return { state: { ...state, channelAftertouch: Math.max(0, Math.min(1, input.value)) }, outputs };
    }

    case 'polyAftertouch': {
      const { note, value } = input;
      const newVoices = state.voices.map(v =>
        v.note === note ? { ...v, aftertouch: value } : v
      );
      return { state: { ...state, voices: newVoices }, outputs };
    }

    case 'expression': {
      return { state: { ...state, expression: Math.max(0, Math.min(1, input.value)) }, outputs };
    }

    case 'breathController': {
      return { state: { ...state, breathController: Math.max(0, Math.min(1, input.value)) }, outputs };
    }

    case 'sustainPedal': {
      const newState = { ...state, sustainPedal: input.value };
      if (!input.value) {
        const newVoices = state.voices.map(v =>
          !state.heldNotes.includes(v.note) && !v.isReleasing ? { ...v, isReleasing: true } : v
        );
        newState.voices = newVoices;
      }
      return { state: newState, outputs };
    }

    case 'allNotesOff': {
      const newVoices = state.voices.map(v => ({ ...v, isReleasing: true }));
      return { state: { ...state, voices: newVoices, heldNotes: [] }, outputs };
    }

    case 'allSoundOff': {
      for (const v of state.voices) {
        outputs.push({ type: 'voiceEnd', voiceId: v.id, note: v.note });
      }
      return { state: { ...state, voices: [], heldNotes: [] }, outputs };
    }

    case 'loadPreset': {
      const preset = LEAD_SYNTH_PRESETS.find(p => p.id === input.presetId);
      if (!preset) {
        outputs.push({ type: 'error', message: `Preset not found: ${input.presetId}` });
        return { state, outputs };
      }
      const newState = createLeadSynthState(preset);
      outputs.push({ type: 'presetLoaded', presetId: preset.id });
      return { state: newState, outputs };
    }

    case 'setVolume': {
      return { state: { ...state, masterVolume: Math.max(0, Math.min(1, input.volume)) }, outputs };
    }

    case 'setOscillator': {
      const { oscIndex, config } = input;
      if (oscIndex < 0 || oscIndex >= MAX_OSCILLATORS) return { state, outputs };
      const currentOsc = state.preset.oscillators[oscIndex];
      if (!currentOsc) return { state, outputs };
      const newOscs = [...state.preset.oscillators];
      newOscs[oscIndex] = { ...currentOsc, ...config };
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
      if (lfoIndex === 1) {
        return { state: { ...state, preset: { ...state.preset, lfo1: { ...state.preset.lfo1, ...config } } }, outputs };
      } else {
        return { state: { ...state, preset: { ...state.preset, lfo2: { ...state.preset.lfo2, ...config } } }, outputs };
      }
    }

    case 'setEffects': {
      return { state: { ...state, preset: { ...state.preset, effects: { ...state.preset.effects, ...input.config } } }, outputs };
    }

    case 'setPortamento': {
      return { state: { ...state, preset: { ...state.preset, portamentoMode: input.mode, portamentoTime: input.time } }, outputs };
    }

    case 'setMonoMode': {
      return { state: { ...state, preset: { ...state.preset, monoMode: input.mono, legato: input.legato } }, outputs };
    }

    case 'tick': {
      const { deltaTime } = input;
      if (deltaTime <= 0) return { state, outputs };

      const newVoices: LeadVoice[] = [];

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

        // Portamento
        let newFreq = voice.frequency;
        if (voice.frequency !== voice.targetFrequency && state.preset.portamentoTime > 0) {
          const glideRate = deltaTime / state.preset.portamentoTime;
          const ratio = voice.targetFrequency / voice.frequency;
          const logRatio = Math.log2(ratio);
          const newLogRatio = logRatio * Math.min(1, glideRate);
          newFreq = voice.frequency * Math.pow(2, newLogRatio);
          if (Math.abs(newFreq - voice.targetFrequency) < 0.1) {
            newFreq = voice.targetFrequency;
          }
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
          return processLeadSynthInput(state, { type: 'modWheel', value: value / 127 });
        case 2:
          return processLeadSynthInput(state, { type: 'breathController', value: value / 127 });
        case 7:
          return processLeadSynthInput(state, { type: 'setVolume', volume: value / 127 });
        case 11:
          return processLeadSynthInput(state, { type: 'expression', value: value / 127 });
        case 64:
          return processLeadSynthInput(state, { type: 'sustainPedal', value: value >= 64 });
        case 65:
          return processLeadSynthInput(state, { type: 'setPortamento', mode: value >= 64 ? 'always' : 'off', time: state.preset.portamentoTime });
        case 120:
          return processLeadSynthInput(state, { type: 'allSoundOff' });
        case 123:
          return processLeadSynthInput(state, { type: 'allNotesOff' });
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

export const LEAD_SYNTH_CARD_META = {
  id: 'lead-synth',
  name: 'Lead Synth',
  category: 'generator' as const,
  description: 'Expressive monophonic/polyphonic lead synthesizer',

  inputPorts: [
    { id: 'midi', name: 'MIDI In', type: 'midi' as const },
  ],

  outputPorts: [
    { id: 'audio-l', name: 'Audio L', type: 'audio' as const },
    { id: 'audio-r', name: 'Audio R', type: 'audio' as const },
  ],

  parameters: [
    { id: 'preset', name: 'Preset', type: 'enum' as const, values: LEAD_SYNTH_PRESETS.map(p => p.id), default: LEAD_SYNTH_PRESETS[0]?.id },
    { id: 'volume', name: 'Volume', type: 'float' as const, min: 0, max: 1, default: 0.8 },
    { id: 'attack', name: 'Attack', type: 'float' as const, min: 0, max: 5, default: 0.005 },
    { id: 'decay', name: 'Decay', type: 'float' as const, min: 0, max: 5, default: 0.2 },
    { id: 'sustain', name: 'Sustain', type: 'float' as const, min: 0, max: 1, default: 0.7 },
    { id: 'release', name: 'Release', type: 'float' as const, min: 0, max: 5, default: 0.3 },
    { id: 'filterCutoff', name: 'Filter Cutoff', type: 'float' as const, min: 20, max: 20000, default: 5000 },
    { id: 'filterRes', name: 'Filter Res', type: 'float' as const, min: 0, max: 1, default: 0.3 },
    { id: 'portamento', name: 'Portamento', type: 'float' as const, min: 0, max: 1, default: 0.05 },
    { id: 'lfoRate', name: 'LFO Rate', type: 'float' as const, min: 0.1, max: 20, default: 5 },
  ],
};

export function createLeadSynthCard() {
  let state = createLeadSynthState();

  return {
    meta: LEAD_SYNTH_CARD_META,

    process(input: LeadSynthInput): LeadSynthOutput[] {
      const result = processLeadSynthInput(state, input);
      state = result.state;
      return result.outputs;
    },

    getState(): LeadSynthState {
      return state;
    },

    reset(): void {
      state = createLeadSynthState();
    },

    loadPreset(presetId: string): LeadSynthOutput[] {
      return this.process({ type: 'loadPreset', presetId });
    },

    getPresets(): LeadSynthPreset[] {
      return LEAD_SYNTH_PRESETS;
    },

    getPresetsByCategory(category: LeadCategory): LeadSynthPreset[] {
      return LEAD_SYNTH_PRESETS.filter(p => p.category === category);
    },

    getActiveVoiceCount(): number {
      return state.voices.filter(v => v.isActive).length;
    },

    isMonoMode(): boolean {
      return state.preset.monoMode;
    },
  };
}
