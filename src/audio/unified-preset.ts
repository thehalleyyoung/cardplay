/**
 * @fileoverview Unified Synth Preset Format
 * 
 * Normalizes Surge and Vital presets into a single representation
 * that can be used by our wavetable instrument engine.
 * 
 * @module @cardplay/core/audio/unified-preset
 */

// ============================================================================
// INSTRUMENT CATEGORIES
// ============================================================================

/**
 * Primary instrument categories for organization.
 */
export type InstrumentCategory =
  | 'bass'           // Bass sounds (sub, reese, growl, pluck bass)
  | 'lead'           // Lead sounds (mono, poly, screech, acid)
  | 'pad'            // Pad sounds (warm, evolving, ambient, strings)
  | 'pluck'          // Plucked sounds (keys, mallets, pizz)
  | 'keys'           // Keyboard sounds (piano, organ, electric piano)
  | 'brass'          // Brass sounds (horns, synth brass)
  | 'strings'        // String sounds (orchestral, synth strings)
  | 'vocal'          // Vocal sounds (choir, formant, talk box)
  | 'fx'             // Effects and textures
  | 'drum'           // Drum/percussion sounds
  | 'arp'            // Arpeggiated/sequenced sounds
  | 'ambient'        // Ambient/atmospheric sounds
  | 'other';         // Uncategorized

/**
 * Sub-categories for more specific classification.
 */
export type InstrumentSubCategory = 
  // Bass
  | 'sub-bass' | 'reese' | 'growl' | 'wobble' | 'pluck-bass' | 'fm-bass' | 'acid-bass'
  // Lead
  | 'mono-lead' | 'poly-lead' | 'screech' | 'acid-lead' | 'saw-lead' | 'square-lead'
  // Pad
  | 'warm-pad' | 'evolving-pad' | 'ambient-pad' | 'dark-pad' | 'bright-pad' | 'string-pad'
  // Pluck
  | 'bell' | 'mallet' | 'pizzicato' | 'harpsichord' | 'guitar'
  // Keys
  | 'piano' | 'electric-piano' | 'organ' | 'clav'
  // Other
  | 'synth-brass' | 'synth-strings' | 'choir' | 'formant'
  | 'riser' | 'impact' | 'texture' | 'noise'
  | 'kick' | 'snare' | 'hihat' | 'perc'
  | 'sequence' | 'arp-lead' | 'arp-bass'
  | 'drone' | 'soundscape'
  | 'generic';

/**
 * Sound character tags for filtering.
 */
export type SoundCharacter =
  | 'bright' | 'dark' | 'warm' | 'cold' | 'harsh' | 'soft'
  | 'aggressive' | 'mellow' | 'clean' | 'dirty' | 'distorted'
  | 'digital' | 'analog' | 'vintage' | 'modern'
  | 'thick' | 'thin' | 'wide' | 'narrow'
  | 'moving' | 'static' | 'evolving' | 'pulsing'
  | 'percussive' | 'sustained' | 'plucky' | 'smooth';

// ============================================================================
// UNIFIED OSCILLATOR
// ============================================================================

/**
 * Oscillator waveform type.
 */
export type OscWaveformType =
  | 'wavetable'      // Wavetable oscillator
  | 'classic'        // Classic analog waveforms
  | 'fm'             // FM synthesis
  | 'sample'         // Sample playback
  | 'noise'          // Noise generator
  | 'off';           // Disabled

/**
 * Unison configuration.
 */
export interface UnisonConfig {
  /** Number of voices (1 = no unison) */
  voices: number;
  /** Detune amount in cents (0-100) */
  detune: number;
  /** Stereo spread (0-1) */
  spread: number;
  /** Blend between center and detuned voices (0-1) */
  blend: number;
}

/**
 * Unified oscillator configuration.
 */
export interface UnifiedOscillator {
  /** Oscillator index (0-2) */
  index: number;
  /** Whether oscillator is enabled */
  enabled: boolean;
  /** Waveform type */
  waveformType: OscWaveformType;
  
  // Wavetable settings
  /** Wavetable ID or name */
  wavetableId: string | null;
  /** Wavetable frame position (0-1) */
  wavetablePosition: number;
  /** Wavetable frame position modulation depth */
  wavetableModDepth: number;
  
  // Pitch
  /** Octave offset (-4 to +4) */
  octave: number;
  /** Semitone offset (-12 to +12) */
  semitone: number;
  /** Fine tune in cents (-100 to +100) */
  cents: number;
  
  // Level/Mix
  /** Output level (0-1) */
  level: number;
  /** Pan position (-1 to +1) */
  pan: number;
  
  // Phase
  /** Starting phase (0-1) */
  phase: number;
  /** Phase randomization amount (0-1) */
  phaseRandom: number;
  
  // Unison
  /** Unison configuration */
  unison: UnisonConfig;
  
  // Waveform shaping
  /** Pulse width / waveform morph (0-1) */
  shape: number;
  /** Distortion/drive amount (0-1) */
  distortion: number;
  /** Distortion type */
  distortionType: 'none' | 'soft' | 'hard' | 'fold' | 'bit';
  
  // FM
  /** FM modulation source oscillator index (-1 = none) */
  fmSource: number;
  /** FM modulation depth (0-1) */
  fmDepth: number;
  
  // Filter routing
  /** Route to filter 1 */
  toFilter1: boolean;
  /** Route to filter 2 */
  toFilter2: boolean;
}

// ============================================================================
// UNIFIED FILTER
// ============================================================================

/**
 * Filter type enumeration.
 */
export type FilterType =
  | 'off'
  | 'lp12' | 'lp24' | 'lp48'        // Low-pass
  | 'hp12' | 'hp24' | 'hp48'        // High-pass
  | 'bp12' | 'bp24'                  // Band-pass
  | 'notch' | 'peak'                 // Notch/Peak
  | 'comb'                           // Comb filter
  | 'formant'                        // Formant filter
  | 'ladder' | 'diode'               // Analog models
  | 'svf'                            // State variable
  | 'phaser';                        // Phaser-style

/**
 * Unified filter configuration.
 */
export interface UnifiedFilter {
  /** Filter index (0-1) */
  index: number;
  /** Whether filter is enabled */
  enabled: boolean;
  /** Filter type */
  filterType: FilterType;
  
  // Core parameters
  /** Cutoff frequency in Hz (20-20000) or as normalized 0-1 */
  cutoff: number;
  /** Cutoff is normalized (0-1) vs Hz */
  cutoffNormalized: boolean;
  /** Resonance (0-1) */
  resonance: number;
  /** Drive/saturation (0-1) */
  drive: number;
  
  // Modulation
  /** Keyboard tracking amount (0-1) */
  keytrack: number;
  /** Envelope modulation depth (-1 to +1) */
  envDepth: number;
  /** Which envelope modulates this filter (0-5) */
  envSource: number;
  
  // Routing
  /** Dry/wet mix (0-1) */
  mix: number;
  /** Filter output level */
  level: number;
  /** Pan position */
  pan: number;
}

// ============================================================================
// UNIFIED ENVELOPE
// ============================================================================

/**
 * Envelope types.
 */
export type EnvelopeType = 'amp' | 'filter' | 'mod1' | 'mod2' | 'mod3' | 'mod4';

/**
 * Unified envelope configuration.
 */
export interface UnifiedEnvelope {
  /** Envelope identifier */
  id: EnvelopeType;
  /** Whether envelope is enabled */
  enabled: boolean;
  
  // ADSR
  /** Attack time in seconds (0-10) */
  attack: number;
  /** Decay time in seconds (0-10) */
  decay: number;
  /** Sustain level (0-1) */
  sustain: number;
  /** Release time in seconds (0-10) */
  release: number;
  
  // Curves (-1 = log, 0 = linear, +1 = exp)
  /** Attack curve */
  attackCurve: number;
  /** Decay curve */
  decayCurve: number;
  /** Release curve */
  releaseCurve: number;
  
  // Additional segments
  /** Hold time after attack (seconds) */
  hold: number;
  /** Delay before envelope starts (seconds) */
  delay: number;
}

// ============================================================================
// UNIFIED LFO
// ============================================================================

/**
 * LFO waveform shapes.
 */
export type LFOShape =
  | 'sine' | 'triangle' | 'saw-up' | 'saw-down'
  | 'square' | 'pulse' | 'random' | 'sample-hold'
  | 'custom';

/**
 * Unified LFO configuration.
 */
export interface UnifiedLFO {
  /** LFO index (0-7) */
  index: number;
  /** Whether LFO is enabled */
  enabled: boolean;
  
  // Waveform
  /** LFO waveform shape */
  shape: LFOShape;
  /** Custom waveform data (if shape is 'custom') */
  customWaveform: Float32Array | null;
  
  // Rate
  /** Rate in Hz (free-running) */
  rateHz: number;
  /** Whether synced to tempo */
  tempoSync: boolean;
  /** Tempo sync division (e.g., '1/4', '1/8', '1/16') */
  tempoDivision: string;
  
  // Shape modifiers
  /** Phase offset (0-1) */
  phase: number;
  /** Pulse width for square/pulse (0-1) */
  pulseWidth: number;
  /** Smoothing amount (0-1) */
  smooth: number;
  
  // Behavior
  /** Trigger mode: free, trigger, sync */
  triggerMode: 'free' | 'trigger' | 'sync';
  /** Delay before LFO starts (seconds) */
  delay: number;
  /** Fade-in time (seconds) */
  fadeIn: number;
  /** One-shot mode (stops after one cycle) */
  oneShot: boolean;
}

// ============================================================================
// MODULATION MATRIX
// ============================================================================

/**
 * Modulation source types.
 */
export type ModSource =
  // Envelopes
  | 'env_amp' | 'env_filter' | 'env_mod1' | 'env_mod2' | 'env_mod3' | 'env_mod4'
  // LFOs
  | 'lfo_1' | 'lfo_2' | 'lfo_3' | 'lfo_4' | 'lfo_5' | 'lfo_6' | 'lfo_7' | 'lfo_8'
  // Performance
  | 'velocity' | 'keytrack' | 'aftertouch' | 'mod_wheel' | 'pitch_bend'
  | 'expression' | 'breath'
  // Macros
  | 'macro_1' | 'macro_2' | 'macro_3' | 'macro_4'
  // Random
  | 'random' | 'random_trigger'
  // Other
  | 'note_gate' | 'voice_index';

/**
 * Modulation destination types.
 */
export type ModDestination =
  // Oscillators
  | 'osc1_level' | 'osc1_pan' | 'osc1_pitch' | 'osc1_wavetable' | 'osc1_shape' | 'osc1_unison'
  | 'osc2_level' | 'osc2_pan' | 'osc2_pitch' | 'osc2_wavetable' | 'osc2_shape' | 'osc2_unison'
  | 'osc3_level' | 'osc3_pan' | 'osc3_pitch' | 'osc3_wavetable' | 'osc3_shape' | 'osc3_unison'
  // Filters
  | 'filter1_cutoff' | 'filter1_resonance' | 'filter1_drive' | 'filter1_mix'
  | 'filter2_cutoff' | 'filter2_resonance' | 'filter2_drive' | 'filter2_mix'
  // Envelopes
  | 'env_amp_attack' | 'env_amp_decay' | 'env_amp_sustain' | 'env_amp_release'
  | 'env_filter_attack' | 'env_filter_decay' | 'env_filter_sustain' | 'env_filter_release'
  // LFOs
  | 'lfo1_rate' | 'lfo1_depth' | 'lfo2_rate' | 'lfo2_depth'
  | 'lfo3_rate' | 'lfo3_depth' | 'lfo4_rate' | 'lfo4_depth'
  // Effects
  | 'fx_mix' | 'fx_param1' | 'fx_param2'
  // Master
  | 'master_volume' | 'master_pan' | 'master_pitch';

/**
 * Modulation routing entry.
 */
export interface ModulationRoute {
  /** Modulation source */
  source: ModSource;
  /** Modulation destination */
  destination: ModDestination;
  /** Modulation amount (-1 to +1) */
  amount: number;
  /** Whether modulation is bipolar */
  bipolar: boolean;
  /** Optional secondary source for modulation of amount */
  modulateBy?: ModSource;
  /** Amount of secondary modulation */
  modulateAmount?: number;
}

// ============================================================================
// EFFECTS
// ============================================================================

/**
 * Effect types.
 */
export type EffectType =
  | 'eq'
  | 'distortion' | 'bitcrusher' | 'wavefolder'
  | 'chorus' | 'flanger' | 'phaser'
  | 'delay' | 'multitap-delay'
  | 'reverb'
  | 'compressor' | 'limiter'
  | 'filter-fx'
  | 'none';

/**
 * Effect configuration.
 */
export interface UnifiedEffect {
  /** Effect type */
  type: EffectType;
  /** Whether effect is enabled */
  enabled: boolean;
  /** Dry/wet mix (0-1) */
  mix: number;
  /** Effect-specific parameters */
  params: Record<string, number>;
}

// ============================================================================
// UNIFIED PRESET
// ============================================================================

/**
 * Macro control configuration.
 */
export interface MacroControl {
  /** Macro index (0-3) */
  index: number;
  /** Display name */
  name: string;
  /** Current value (0-1) */
  value: number;
  /** Default value */
  defaultValue: number;
}

/**
 * Complete unified preset format.
 */
export interface UnifiedPreset {
  // Metadata
  /** Unique preset ID */
  id: string;
  /** Preset name */
  name: string;
  /** Original source ('surge' | 'vital' | 'custom') */
  source: 'surge' | 'vital' | 'custom';
  /** Original file path */
  originalPath: string;
  
  // Classification
  /** Primary instrument category */
  category: InstrumentCategory;
  /** Sub-category */
  subCategory: InstrumentSubCategory;
  /** Sound character tags */
  characters: SoundCharacter[];
  /** Searchable tags */
  tags: string[];
  
  // Attribution
  /** Author name */
  author: string | null;
  /** Description/comments */
  description: string | null;
  
  // Sound engine
  /** Oscillators (up to 3) */
  oscillators: UnifiedOscillator[];
  /** Filters (up to 2) */
  filters: UnifiedFilter[];
  /** Envelopes */
  envelopes: UnifiedEnvelope[];
  /** LFOs (up to 8) */
  lfos: UnifiedLFO[];
  /** Modulation matrix */
  modulations: ModulationRoute[];
  /** Effects chain */
  effects: UnifiedEffect[];
  /** Macro controls */
  macros: MacroControl[];
  
  // Global settings
  /** Master volume (0-1) */
  masterVolume: number;
  /** Master pan (-1 to +1) */
  masterPan: number;
  /** Master pitch offset in semitones */
  masterPitch: number;
  /** Polyphony limit */
  polyphony: number;
  /** Portamento/glide time in seconds */
  portamento: number;
  /** Portamento mode */
  portamentoMode: 'off' | 'always' | 'legato';
  /** Voice mode */
  voiceMode: 'poly' | 'mono' | 'unison' | 'stack';
  /** Pitch bend range in semitones */
  pitchBendRange: number;
  
  // Quality hints
  /** Estimated CPU usage (1-10) */
  cpuEstimate: number;
  /** Requires high-quality wavetable interpolation */
  needsHQInterpolation: boolean;
}

// ============================================================================
// DEFAULT FACTORIES
// ============================================================================

/**
 * Create default unison config.
 */
export function createDefaultUnison(): UnisonConfig {
  return {
    voices: 1,
    detune: 0,
    spread: 0.5,
    blend: 0.5,
  };
}

/**
 * Create default oscillator.
 */
export function createDefaultOscillator(index: number): UnifiedOscillator {
  return {
    index,
    enabled: index === 0,
    waveformType: 'wavetable',
    wavetableId: null,
    wavetablePosition: 0,
    wavetableModDepth: 0,
    octave: 0,
    semitone: 0,
    cents: 0,
    level: index === 0 ? 1 : 0,
    pan: 0,
    phase: 0,
    phaseRandom: 0,
    unison: createDefaultUnison(),
    shape: 0.5,
    distortion: 0,
    distortionType: 'none',
    fmSource: -1,
    fmDepth: 0,
    toFilter1: true,
    toFilter2: false,
  };
}

/**
 * Create default filter.
 */
export function createDefaultFilter(index: number): UnifiedFilter {
  return {
    index,
    enabled: index === 0,
    filterType: 'lp24',
    cutoff: 1,
    cutoffNormalized: true,
    resonance: 0,
    drive: 0,
    keytrack: 0,
    envDepth: 0,
    envSource: 1,
    mix: 1,
    level: 1,
    pan: 0,
  };
}

/**
 * Create default envelope.
 */
export function createDefaultEnvelope(id: EnvelopeType): UnifiedEnvelope {
  const isAmp = id === 'amp';
  return {
    id,
    enabled: true,
    attack: isAmp ? 0.005 : 0.01,
    decay: isAmp ? 0.1 : 0.2,
    sustain: isAmp ? 1 : 0.5,
    release: isAmp ? 0.1 : 0.3,
    attackCurve: 0,
    decayCurve: 0,
    releaseCurve: 0,
    hold: 0,
    delay: 0,
  };
}

/**
 * Create default LFO.
 */
export function createDefaultLFO(index: number): UnifiedLFO {
  return {
    index,
    enabled: false,
    shape: 'sine',
    customWaveform: null,
    rateHz: 1,
    tempoSync: false,
    tempoDivision: '1/4',
    phase: 0,
    pulseWidth: 0.5,
    smooth: 0,
    triggerMode: 'free',
    delay: 0,
    fadeIn: 0,
    oneShot: false,
  };
}

/**
 * Create default macro.
 */
export function createDefaultMacro(index: number): MacroControl {
  return {
    index,
    name: `Macro ${index + 1}`,
    value: 0,
    defaultValue: 0,
  };
}

/**
 * Create an empty/init preset.
 */
export function createInitPreset(): UnifiedPreset {
  return {
    id: 'init',
    name: 'Init',
    source: 'custom',
    originalPath: '',
    category: 'other',
    subCategory: 'generic',
    characters: [],
    tags: [],
    author: null,
    description: null,
    oscillators: [
      createDefaultOscillator(0),
      createDefaultOscillator(1),
      createDefaultOscillator(2),
    ],
    filters: [
      createDefaultFilter(0),
      createDefaultFilter(1),
    ],
    envelopes: [
      createDefaultEnvelope('amp'),
      createDefaultEnvelope('filter'),
      createDefaultEnvelope('mod1'),
      createDefaultEnvelope('mod2'),
    ],
    lfos: [
      createDefaultLFO(0),
      createDefaultLFO(1),
      createDefaultLFO(2),
      createDefaultLFO(3),
    ],
    modulations: [],
    effects: [],
    macros: [
      createDefaultMacro(0),
      createDefaultMacro(1),
      createDefaultMacro(2),
      createDefaultMacro(3),
    ],
    masterVolume: 0.8,
    masterPan: 0,
    masterPitch: 0,
    polyphony: 16,
    portamento: 0,
    portamentoMode: 'off',
    voiceMode: 'poly',
    pitchBendRange: 2,
    cpuEstimate: 3,
    needsHQInterpolation: false,
  };
}
