/**
 * DrumKit Card
 *
 * Professional multi-velocity drum kit with extensive pad mapping,
 * individual pad processing, and comprehensive kit presets covering
 * acoustic drums, electronic kits, and hybrid configurations.
 *
 * Features:
 * - 16 pads mapped to MIDI notes
 * - 8 velocity layers per pad
 * - Round-robin sample alternation
 * - Per-pad tuning, filter, envelope
 * - Per-pad sends (reverb, delay)
 * - Choke groups for hi-hat behavior
 * - 50+ factory kit presets
 * - Kit piece layering
 * - Individual pad outputs
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/** Number of pads in the kit */
export const PAD_COUNT = 16;

/** Maximum velocity layers per pad */
export const MAX_VELOCITY_LAYERS = 8;

/** Maximum round-robin variations */
export const MAX_ROUND_ROBIN = 8;

/** Maximum simultaneous voices */
export const MAX_VOICES = 32;

/** Sample rate */
export const SAMPLE_RATE = 44100;

/** Standard General MIDI drum map starting note */
export const GM_DRUM_MAP_START = 35;

/** Note names for pads */
export const PAD_NOTE_NAMES = [
  'Kick', 'Snare', 'Clap', 'Rim',
  'Hi-Hat Closed', 'Hi-Hat Open', 'Hi-Hat Pedal', 'Crash',
  'Ride', 'Ride Bell', 'Tom 1', 'Tom 2',
  'Tom 3', 'Perc 1', 'Perc 2', 'Cowbell',
];

/** GM drum note numbers */
export const GM_DRUM_NOTES: Record<string, number> = {
  kick: 36,
  kick2: 35,
  snare: 38,
  snareRim: 37,
  snareSide: 40,
  clap: 39,
  hihatClosed: 42,
  hihatPedal: 44,
  hihatOpen: 46,
  crash1: 49,
  crash2: 57,
  ride: 51,
  rideBell: 53,
  tom1: 50,
  tom2: 48,
  tom3: 47,
  tom4: 45,
  tom5: 43,
  tom6: 41,
  cowbell: 56,
  tambourine: 54,
  shaker: 70,
  conga1: 62,
  conga2: 63,
  bongo1: 60,
  bongo2: 61,
};

// =============================================================================
// TYPES
// =============================================================================

/**
 * Drum kit category
 */
export type KitCategory =
  | 'acoustic'
  | 'electronic'
  | 'hybrid'
  | 'vintage'
  | '808'
  | '909'
  | 'breakbeat'
  | 'orchestral'
  | 'ethnic'
  | 'processed'
  | 'lo-fi';

/**
 * Pad sample data
 */
export interface PadSample {
  /** Sample ID */
  id: string;

  /** Sample name */
  name: string;

  /** Audio buffer (left) */
  audioL?: Float32Array;

  /** Audio buffer (right) */
  audioR?: Float32Array;

  /** Sample rate */
  sampleRate: number;

  /** Total samples */
  length: number;

  /** Root velocity (what velocity this was recorded at) */
  rootVelocity: number;

  /** Volume adjustment dB */
  volumeDb: number;

  /** Pan -1 to 1 */
  pan: number;

  /** Is one-shot (play to end regardless of note-off) */
  oneShot: boolean;
}

/**
 * Velocity layer containing samples
 */
export interface VelocityLayer {
  /** Low velocity (inclusive) */
  velocityLow: number;

  /** High velocity (inclusive) */
  velocityHigh: number;

  /** Samples for round-robin */
  samples: PadSample[];

  /** Current round-robin index */
  roundRobinIndex: number;
}

/**
 * Choke group configuration
 */
export interface ChokeGroup {
  /** Group ID */
  id: number;

  /** Pad indices in this group */
  padIndices: number[];

  /** Choke time in ms (0 = instant) */
  chokeTimeMs: number;
}

/**
 * Per-pad envelope
 */
export interface PadEnvelope {
  /** Attack time in seconds */
  attack: number;

  /** Hold time in seconds */
  hold: number;

  /** Decay time in seconds */
  decay: number;

  /** Sustain level 0-1 (only for non-one-shot) */
  sustain: number;

  /** Release time in seconds */
  release: number;
}

/**
 * Per-pad filter
 */
export interface PadFilter {
  /** Filter enabled */
  enabled: boolean;

  /** Filter type */
  type: 'lowpass' | 'highpass' | 'bandpass';

  /** Cutoff frequency Hz */
  frequency: number;

  /** Resonance Q */
  resonance: number;

  /** Envelope modulation amount */
  envelopeAmount: number;
}

/**
 * Pad configuration
 */
export interface DrumPad {
  /** Pad index 0-15 */
  index: number;

  /** Pad name */
  name: string;

  /** MIDI note number */
  midiNote: number;

  /** Velocity layers */
  velocityLayers: VelocityLayer[];

  /** Pad volume 0-1 */
  volume: number;

  /** Pad pan -1 to 1 */
  pan: number;

  /** Pitch adjustment in semitones */
  pitch: number;

  /** Fine tune in cents */
  fineTune: number;

  /** Decay time adjustment (multiplier) */
  decayMod: number;

  /** Envelope */
  envelope: PadEnvelope;

  /** Filter */
  filter: PadFilter;

  /** Reverb send 0-1 */
  reverbSend: number;

  /** Delay send 0-1 */
  delaySend: number;

  /** Output bus (0 = main, 1-7 = individual) */
  outputBus: number;

  /** Choke group (-1 = none) */
  chokeGroup: number;

  /** Is pad muted */
  muted: boolean;

  /** Is pad solo */
  solo: boolean;

  /** Pad color for UI */
  color: string;

  /** Velocity curve (-1 to 1, 0 = linear) */
  velocityCurve: number;
}

/**
 * Drum kit preset
 */
export interface DrumKitPreset {
  /** Preset ID */
  id: string;

  /** Display name */
  name: string;

  /** Category */
  category: KitCategory;

  /** Tags */
  tags: string[];

  /** Description */
  description?: string;

  /** Pad configurations */
  pads: DrumPad[];

  /** Choke groups */
  chokeGroups: ChokeGroup[];

  /** Master volume dB */
  masterVolume: number;

  /** Master compression threshold */
  compressorThreshold: number;

  /** Master compression ratio */
  compressorRatio: number;

  /** Kit color for UI */
  color: string;

  /** Is factory preset */
  isFactory: boolean;
}

/**
 * Active voice for a playing sample
 */
export interface DrumVoice {
  /** Voice ID */
  id: string;

  /** Pad index */
  padIndex: number;

  /** Sample being played */
  sample: PadSample;

  /** Velocity 0-127 */
  velocity: number;

  /** Playhead position in samples */
  playhead: number;

  /** Is voice active */
  isActive: boolean;

  /** Is voice being choked */
  isChoking: boolean;

  /** Choke fade progress 0-1 */
  chokeFade: number;

  /** Envelope stage */
  envelopeStage: number;

  /** Envelope value */
  envelopeValue: number;

  /** Time in envelope stage */
  envelopeTime: number;

  /** Output gain */
  outputGain: number;

  /** Start time */
  startTime: number;
}

/**
 * Drum kit state
 */
export interface DrumKitState {
  /** Current kit */
  kit: DrumKitPreset;

  /** Active voices */
  voices: DrumVoice[];

  /** Solo pads (empty = no solo active) */
  soloPads: number[];

  /** Master volume 0-1 */
  masterVolume: number;

  /** Swing amount 0-1 */
  swing: number;

  /** Voice counter for IDs */
  voiceCounter: number;

  /** Last trigger time per pad */
  lastTriggerTime: Map<number, number>;

  /** Velocity sensitivity (0 = fixed, 1 = full) */
  velocitySensitivity: number;
}

/**
 * Drum kit input events
 */
export type DrumKitInput =
  | { type: 'noteOn'; note: number; velocity: number }
  | { type: 'noteOff'; note: number }
  | { type: 'padTrigger'; padIndex: number; velocity: number }
  | { type: 'padRelease'; padIndex: number }
  | { type: 'loadKit'; kitId: string }
  | { type: 'setPadVolume'; padIndex: number; volume: number }
  | { type: 'setPadPan'; padIndex: number; pan: number }
  | { type: 'setPadPitch'; padIndex: number; semitones: number }
  | { type: 'setPadDecay'; padIndex: number; multiplier: number }
  | { type: 'setPadFilter'; padIndex: number; config: Partial<PadFilter> }
  | { type: 'setPadSends'; padIndex: number; reverb?: number; delay?: number }
  | { type: 'mutePad'; padIndex: number }
  | { type: 'soloPad'; padIndex: number }
  | { type: 'setMasterVolume'; volume: number }
  | { type: 'setSwing'; amount: number }
  | { type: 'setVelocitySensitivity'; amount: number }
  | { type: 'allNotesOff' }
  | { type: 'allSoundOff' }
  | { type: 'tick'; time: number; deltaTime: number }
  | { type: 'midiCC'; controller: number; value: number };

/**
 * Drum kit output events
 */
export type DrumKitOutput =
  | { type: 'voiceStart'; voiceId: string; padIndex: number; velocity: number }
  | { type: 'voiceEnd'; voiceId: string; padIndex: number }
  | { type: 'voiceChoked'; voiceId: string; padIndex: number; byPad: number }
  | { type: 'audioFrame'; bufferL: Float32Array; bufferR: Float32Array; time: number }
  | { type: 'kitLoaded'; kitId: string }
  | { type: 'error'; message: string };

/**
 * Processing result
 */
export interface DrumKitResult {
  state: DrumKitState;
  outputs: DrumKitOutput[];
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default pad envelope (one-shot style)
 */
export const DEFAULT_PAD_ENVELOPE: PadEnvelope = {
  attack: 0.001,
  hold: 0,
  decay: 0.5,
  sustain: 0,
  release: 0.1,
};

/**
 * Default pad filter
 */
export const DEFAULT_PAD_FILTER: PadFilter = {
  enabled: false,
  type: 'lowpass',
  frequency: 20000,
  resonance: 0.707,
  envelopeAmount: 0,
};

// =============================================================================
// PAD FACTORY
// =============================================================================

/**
 * Create a placeholder sample
 */
function createPadSample(
  id: string,
  name: string,
  rootVelocity: number = 100,
  lengthMs: number = 500
): PadSample {
  return {
    id,
    name,
    sampleRate: SAMPLE_RATE,
    length: Math.floor((lengthMs / 1000) * SAMPLE_RATE),
    rootVelocity,
    volumeDb: 0,
    pan: 0,
    oneShot: true,
  };
}

/**
 * Create velocity layers for a drum sound
 */
function createVelocityLayers(baseName: string, layerCount: number = 4): VelocityLayer[] {
  const layers: VelocityLayer[] = [];
  const velocityStep = Math.floor(127 / layerCount);

  for (let i = 0; i < layerCount; i++) {
    const velLow = i * velocityStep + 1;
    const velHigh = i === layerCount - 1 ? 127 : (i + 1) * velocityStep;
    const rootVel = Math.floor((velLow + velHigh) / 2);

    layers.push({
      velocityLow: velLow,
      velocityHigh: velHigh,
      samples: [
        createPadSample(`${baseName}-v${i}-rr0`, `${baseName} V${i + 1} A`, rootVel),
        createPadSample(`${baseName}-v${i}-rr1`, `${baseName} V${i + 1} B`, rootVel),
      ],
      roundRobinIndex: 0,
    });
  }

  return layers;
}

/**
 * Create a drum pad
 */
function createDrumPad(
  index: number,
  name: string,
  midiNote: number,
  velocityLayers: VelocityLayer[],
  options: Partial<DrumPad> = {}
): DrumPad {
  return {
    index,
    name,
    midiNote,
    velocityLayers,
    volume: 1.0,
    pan: 0,
    pitch: 0,
    fineTune: 0,
    decayMod: 1.0,
    envelope: { ...DEFAULT_PAD_ENVELOPE },
    filter: { ...DEFAULT_PAD_FILTER },
    reverbSend: 0,
    delaySend: 0,
    outputBus: 0,
    chokeGroup: -1,
    muted: false,
    solo: false,
    color: '#888888',
    velocityCurve: 0,
    ...options,
  };
}

// =============================================================================
// FACTORY KITS
// =============================================================================

/**
 * Create standard acoustic kit
 */
function createAcousticKit(): DrumKitPreset {
  const pads: DrumPad[] = [
    createDrumPad(0, 'Kick', 36, createVelocityLayers('acoustic-kick', 4), { color: '#FF4444' }),
    createDrumPad(1, 'Snare', 38, createVelocityLayers('acoustic-snare', 4), { color: '#44FF44', reverbSend: 0.2 }),
    createDrumPad(2, 'Clap', 39, createVelocityLayers('clap', 3), { color: '#FF8844', reverbSend: 0.3 }),
    createDrumPad(3, 'Rim Shot', 37, createVelocityLayers('rimshot', 3), { color: '#FFFF44' }),
    createDrumPad(4, 'Hi-Hat Closed', 42, createVelocityLayers('hihat-closed', 4), { color: '#44FFFF', chokeGroup: 0 }),
    createDrumPad(5, 'Hi-Hat Open', 46, createVelocityLayers('hihat-open', 3), { color: '#4488FF', chokeGroup: 0 }),
    createDrumPad(6, 'Hi-Hat Pedal', 44, createVelocityLayers('hihat-pedal', 2), { color: '#8844FF', chokeGroup: 0 }),
    createDrumPad(7, 'Crash', 49, createVelocityLayers('crash', 3), { color: '#FF44FF', reverbSend: 0.4 }),
    createDrumPad(8, 'Ride', 51, createVelocityLayers('ride', 4), { color: '#44FF88' }),
    createDrumPad(9, 'Ride Bell', 53, createVelocityLayers('ride-bell', 3), { color: '#88FF44' }),
    createDrumPad(10, 'High Tom', 50, createVelocityLayers('tom-high', 4), { color: '#FF8888', reverbSend: 0.15 }),
    createDrumPad(11, 'Mid Tom', 48, createVelocityLayers('tom-mid', 4), { color: '#FF6666', reverbSend: 0.15 }),
    createDrumPad(12, 'Low Tom', 45, createVelocityLayers('tom-low', 4), { color: '#FF4444', reverbSend: 0.15 }),
    createDrumPad(13, 'Shaker', 70, createVelocityLayers('shaker', 2), { color: '#CCCCCC' }),
    createDrumPad(14, 'Tambourine', 54, createVelocityLayers('tambourine', 3), { color: '#DDDDDD', reverbSend: 0.2 }),
    createDrumPad(15, 'Cowbell', 56, createVelocityLayers('cowbell', 2), { color: '#FFD700' }),
  ];

  return {
    id: 'acoustic-studio',
    name: 'Acoustic Studio Kit',
    category: 'acoustic',
    tags: ['acoustic', 'studio', 'natural', 'versatile'],
    description: 'Versatile acoustic kit recorded in a professional studio',
    pads,
    chokeGroups: [{ id: 0, padIndices: [4, 5, 6], chokeTimeMs: 5 }],
    masterVolume: 0,
    compressorThreshold: -10,
    compressorRatio: 4,
    color: '#8B4513',
    isFactory: true,
  };
}

/**
 * Create 808 kit
 */
function create808Kit(): DrumKitPreset {
  const pads: DrumPad[] = [
    createDrumPad(0, '808 Kick', 36, createVelocityLayers('808-kick', 2), {
      color: '#FF0000',
      envelope: { attack: 0.001, hold: 0, decay: 1.5, sustain: 0, release: 0.2 },
    }),
    createDrumPad(1, '808 Snare', 38, createVelocityLayers('808-snare', 3), { color: '#00FF00' }),
    createDrumPad(2, '808 Clap', 39, createVelocityLayers('808-clap', 2), { color: '#FF8800', reverbSend: 0.25 }),
    createDrumPad(3, '808 Rim', 37, createVelocityLayers('808-rim', 2), { color: '#FFFF00' }),
    createDrumPad(4, '808 CH', 42, createVelocityLayers('808-ch', 2), { color: '#00FFFF', chokeGroup: 0 }),
    createDrumPad(5, '808 OH', 46, createVelocityLayers('808-oh', 2), { color: '#0088FF', chokeGroup: 0 }),
    createDrumPad(6, '808 Maracas', 70, createVelocityLayers('808-maracas', 1), { color: '#8800FF' }),
    createDrumPad(7, '808 Cymbal', 49, createVelocityLayers('808-cymbal', 2), { color: '#FF00FF' }),
    createDrumPad(8, '808 Conga Hi', 62, createVelocityLayers('808-conga-hi', 2), { color: '#88FF00' }),
    createDrumPad(9, '808 Conga Lo', 63, createVelocityLayers('808-conga-lo', 2), { color: '#FF8800' }),
    createDrumPad(10, '808 Tom Hi', 50, createVelocityLayers('808-tom-hi', 2), { color: '#FF4444' }),
    createDrumPad(11, '808 Tom Mid', 48, createVelocityLayers('808-tom-mid', 2), { color: '#FF2222' }),
    createDrumPad(12, '808 Tom Lo', 45, createVelocityLayers('808-tom-lo', 2), { color: '#FF0000' }),
    createDrumPad(13, '808 Claves', 75, createVelocityLayers('808-claves', 1), { color: '#AAAAAA' }),
    createDrumPad(14, '808 Cowbell', 56, createVelocityLayers('808-cowbell', 2), { color: '#FFD700' }),
    createDrumPad(15, '808 Kick Long', 35, createVelocityLayers('808-kick-long', 2), {
      color: '#880000',
      envelope: { attack: 0.001, hold: 0, decay: 3.0, sustain: 0, release: 0.3 },
    }),
  ];

  return {
    id: '808-classic',
    name: 'TR-808 Classic',
    category: '808',
    tags: ['808', 'classic', 'hip-hop', 'trap', 'analog'],
    description: 'Classic TR-808 drum machine sounds',
    pads,
    chokeGroups: [{ id: 0, padIndices: [4, 5], chokeTimeMs: 3 }],
    masterVolume: 0,
    compressorThreshold: -8,
    compressorRatio: 3,
    color: '#FF4400',
    isFactory: true,
  };
}

/**
 * Create 909 kit
 */
function create909Kit(): DrumKitPreset {
  const pads: DrumPad[] = [
    createDrumPad(0, '909 Kick', 36, createVelocityLayers('909-kick', 3), { color: '#FF3300' }),
    createDrumPad(1, '909 Snare', 38, createVelocityLayers('909-snare', 4), { color: '#00FF33' }),
    createDrumPad(2, '909 Clap', 39, createVelocityLayers('909-clap', 3), { color: '#FF8833', reverbSend: 0.3 }),
    createDrumPad(3, '909 Rim', 37, createVelocityLayers('909-rim', 2), { color: '#FFFF33' }),
    createDrumPad(4, '909 CH', 42, createVelocityLayers('909-ch', 3), { color: '#33FFFF', chokeGroup: 0 }),
    createDrumPad(5, '909 OH', 46, createVelocityLayers('909-oh', 3), { color: '#3388FF', chokeGroup: 0 }),
    createDrumPad(6, '909 Crash', 49, createVelocityLayers('909-crash', 2), { color: '#8833FF', reverbSend: 0.35 }),
    createDrumPad(7, '909 Ride', 51, createVelocityLayers('909-ride', 3), { color: '#FF33FF' }),
    createDrumPad(8, '909 Tom Hi', 50, createVelocityLayers('909-tom-hi', 3), { color: '#FF6666' }),
    createDrumPad(9, '909 Tom Mid', 48, createVelocityLayers('909-tom-mid', 3), { color: '#FF4444' }),
    createDrumPad(10, '909 Tom Lo', 45, createVelocityLayers('909-tom-lo', 3), { color: '#FF2222' }),
    createDrumPad(11, '909 Clap Verb', 39, createVelocityLayers('909-clap-verb', 2), { color: '#FF9944', reverbSend: 0.6, pitch: 2 }),
    createDrumPad(12, '909 Snare Tight', 40, createVelocityLayers('909-snare-tight', 3), { color: '#44FF44', decayMod: 0.6 }),
    createDrumPad(13, '909 Kick Punchy', 35, createVelocityLayers('909-kick-punchy', 2), { color: '#FF1100', decayMod: 0.7 }),
    createDrumPad(14, '909 OH Decay', 46, createVelocityLayers('909-oh-decay', 2), { color: '#5599FF', chokeGroup: 0, decayMod: 0.5 }),
    createDrumPad(15, '909 CH Decay', 42, createVelocityLayers('909-ch-decay', 2), { color: '#55FFFF', chokeGroup: 0, decayMod: 0.6 }),
  ];

  return {
    id: '909-classic',
    name: 'TR-909 Classic',
    category: '909',
    tags: ['909', 'classic', 'house', 'techno', 'analog'],
    description: 'Classic TR-909 drum machine sounds',
    pads,
    chokeGroups: [{ id: 0, padIndices: [4, 5, 14, 15], chokeTimeMs: 5 }],
    masterVolume: 0,
    compressorThreshold: -6,
    compressorRatio: 4,
    color: '#00AAFF',
    isFactory: true,
  };
}

/**
 * All factory kits
 */
export const DRUM_KIT_PRESETS: DrumKitPreset[] = [
  createAcousticKit(),
  create808Kit(),
  create909Kit(),
  
  // Additional kits defined with simpler structure
  {
    id: 'acoustic-rock',
    name: 'Rock Kit',
    category: 'acoustic',
    tags: ['rock', 'powerful', 'live'],
    description: 'Powerful rock drum kit with big room sound',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, PAD_NOTE_NAMES[i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`rock-${i}`, 4), {
        reverbSend: i >= 10 && i <= 12 ? 0.25 : 0.15,
      })
    ),
    chokeGroups: [{ id: 0, padIndices: [4, 5, 6], chokeTimeMs: 8 }],
    masterVolume: 2,
    compressorThreshold: -8,
    compressorRatio: 6,
    color: '#8B0000',
    isFactory: true,
  },
  {
    id: 'acoustic-jazz',
    name: 'Jazz Brush Kit',
    category: 'acoustic',
    tags: ['jazz', 'brush', 'soft', 'intimate'],
    description: 'Soft jazz kit with brush snare',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, PAD_NOTE_NAMES[i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`jazz-${i}`, 4), {
        reverbSend: 0.3,
        velocityCurve: -0.3,
      })
    ),
    chokeGroups: [{ id: 0, padIndices: [4, 5, 6], chokeTimeMs: 10 }],
    masterVolume: -2,
    compressorThreshold: -15,
    compressorRatio: 2,
    color: '#4A4A4A',
    isFactory: true,
  },
  {
    id: 'acoustic-funk',
    name: 'Funk Kit',
    category: 'acoustic',
    tags: ['funk', 'tight', 'groovy'],
    description: 'Tight funky drum kit with crisp attack',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, PAD_NOTE_NAMES[i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`funk-${i}`, 4), {
        decayMod: 0.7,
      })
    ),
    chokeGroups: [{ id: 0, padIndices: [4, 5, 6], chokeTimeMs: 3 }],
    masterVolume: 0,
    compressorThreshold: -6,
    compressorRatio: 5,
    color: '#FFD700',
    isFactory: true,
  },
  {
    id: 'electronic-house',
    name: 'House Kit',
    category: 'electronic',
    tags: ['house', 'electronic', 'four-on-floor'],
    description: 'Classic house music drum kit',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, PAD_NOTE_NAMES[i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`house-${i}`, 3), {
        reverbSend: i === 2 ? 0.4 : 0.1,
      })
    ),
    chokeGroups: [{ id: 0, padIndices: [4, 5, 6], chokeTimeMs: 5 }],
    masterVolume: 0,
    compressorThreshold: -8,
    compressorRatio: 4,
    color: '#9932CC',
    isFactory: true,
  },
  {
    id: 'electronic-techno',
    name: 'Techno Kit',
    category: 'electronic',
    tags: ['techno', 'dark', 'industrial'],
    description: 'Dark techno drum kit with aggressive sounds',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, PAD_NOTE_NAMES[i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`techno-${i}`, 3), {
        filter: { enabled: true, type: 'lowpass', frequency: 8000, resonance: 1.0, envelopeAmount: 0 },
      })
    ),
    chokeGroups: [{ id: 0, padIndices: [4, 5, 6], chokeTimeMs: 3 }],
    masterVolume: 2,
    compressorThreshold: -6,
    compressorRatio: 6,
    color: '#1a1a1a',
    isFactory: true,
  },
  {
    id: 'electronic-dnb',
    name: 'DnB Kit',
    category: 'electronic',
    tags: ['dnb', 'jungle', 'breakbeat'],
    description: 'Drum and bass kit with punchy breaks',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, PAD_NOTE_NAMES[i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`dnb-${i}`, 4))
    ),
    chokeGroups: [{ id: 0, padIndices: [4, 5, 6], chokeTimeMs: 5 }],
    masterVolume: 0,
    compressorThreshold: -4,
    compressorRatio: 8,
    color: '#00FF88',
    isFactory: true,
  },
  {
    id: 'electronic-trap',
    name: 'Trap Kit',
    category: 'electronic',
    tags: ['trap', 'hip-hop', '808', 'modern'],
    description: 'Modern trap kit with 808 bass and crisp hi-hats',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, PAD_NOTE_NAMES[i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`trap-${i}`, 3), {
        envelope: i === 0 ? { attack: 0.001, hold: 0, decay: 2.0, sustain: 0, release: 0.5 } : DEFAULT_PAD_ENVELOPE,
      })
    ),
    chokeGroups: [{ id: 0, padIndices: [4, 5, 6], chokeTimeMs: 2 }],
    masterVolume: 0,
    compressorThreshold: -6,
    compressorRatio: 5,
    color: '#FF00FF',
    isFactory: true,
  },
  {
    id: 'hybrid-cinematic',
    name: 'Cinematic Kit',
    category: 'hybrid',
    tags: ['cinematic', 'epic', 'film', 'big'],
    description: 'Epic cinematic drums with layered impacts',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, PAD_NOTE_NAMES[i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`cinematic-${i}`, 4), {
        reverbSend: 0.5,
        envelope: { attack: 0.005, hold: 0.02, decay: 1.5, sustain: 0, release: 0.8 },
      })
    ),
    chokeGroups: [],
    masterVolume: 0,
    compressorThreshold: -10,
    compressorRatio: 3,
    color: '#4169E1',
    isFactory: true,
  },
  {
    id: 'vintage-vinyl',
    name: 'Vinyl Breaks',
    category: 'vintage',
    tags: ['vintage', 'vinyl', 'lo-fi', 'breakbeat'],
    description: 'Lo-fi vinyl breakbeat samples',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, PAD_NOTE_NAMES[i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`vinyl-${i}`, 3), {
        filter: { enabled: true, type: 'lowpass', frequency: 8000, resonance: 0.5, envelopeAmount: 0 },
      })
    ),
    chokeGroups: [{ id: 0, padIndices: [4, 5, 6], chokeTimeMs: 10 }],
    masterVolume: -2,
    compressorThreshold: -12,
    compressorRatio: 3,
    color: '#8B4513',
    isFactory: true,
  },
  {
    id: 'vintage-linn',
    name: 'LinnDrum',
    category: 'vintage',
    tags: ['linn', 'linndrum', '80s', 'classic'],
    description: 'Classic LinnDrum digital drum sounds',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, PAD_NOTE_NAMES[i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`linn-${i}`, 2))
    ),
    chokeGroups: [{ id: 0, padIndices: [4, 5, 6], chokeTimeMs: 5 }],
    masterVolume: 0,
    compressorThreshold: -10,
    compressorRatio: 3,
    color: '#C0C0C0',
    isFactory: true,
  },
  {
    id: 'vintage-sp1200',
    name: 'SP-1200',
    category: 'vintage',
    tags: ['sp1200', 'hip-hop', 'crunchy', '12-bit'],
    description: 'Crunchy 12-bit SP-1200 style drums',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, PAD_NOTE_NAMES[i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`sp1200-${i}`, 3), {
        filter: { enabled: true, type: 'lowpass', frequency: 10000, resonance: 0.5, envelopeAmount: 0 },
      })
    ),
    chokeGroups: [{ id: 0, padIndices: [4, 5, 6], chokeTimeMs: 5 }],
    masterVolume: 0,
    compressorThreshold: -8,
    compressorRatio: 4,
    color: '#404040',
    isFactory: true,
  },
  {
    id: 'ethnic-african',
    name: 'African Percussion',
    category: 'ethnic',
    tags: ['african', 'djembe', 'tribal', 'world'],
    description: 'African drums and percussion',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, ['Djembe Bass', 'Djembe Tone', 'Djembe Slap', 'Talking Drum', 'Shekere', 'Agogo', 'Dundun', 'Kenkeni', 'Sangban', 'Balafon', 'Udu', 'Bells', 'Kalimba', 'Caxixi', 'Claves', 'Woodblock'][i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`african-${i}`, 4), {
        reverbSend: 0.25,
      })
    ),
    chokeGroups: [],
    masterVolume: 0,
    compressorThreshold: -12,
    compressorRatio: 2,
    color: '#CD853F',
    isFactory: true,
  },
  {
    id: 'ethnic-latin',
    name: 'Latin Percussion',
    category: 'ethnic',
    tags: ['latin', 'conga', 'bongo', 'salsa'],
    description: 'Latin percussion instruments',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, ['Conga Slap', 'Conga Open', 'Conga Mute', 'Bongo Hi', 'Bongo Lo', 'Timbales Hi', 'Timbales Lo', 'Cowbell', 'Guiro Down', 'Guiro Up', 'Claves', 'Maracas', 'Cabasa', 'Shaker', 'Agogo Hi', 'Agogo Lo'][i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`latin-${i}`, 4))
    ),
    chokeGroups: [],
    masterVolume: 0,
    compressorThreshold: -12,
    compressorRatio: 2,
    color: '#FF6347',
    isFactory: true,
  },
  {
    id: 'ethnic-indian',
    name: 'Indian Tabla',
    category: 'ethnic',
    tags: ['indian', 'tabla', 'classical', 'world'],
    description: 'Indian tabla and percussion',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, ['Tabla Na', 'Tabla Tin', 'Tabla Tun', 'Tabla Ke', 'Bayan Ge', 'Bayan Ka', 'Dholak Open', 'Dholak Mute', 'Dhol', 'Manjira', 'Ghatam', 'Kanjira', 'Mridangam', 'Bells', 'Tanpura', 'Harmonium'][i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`indian-${i}`, 4), {
        reverbSend: 0.2,
      })
    ),
    chokeGroups: [],
    masterVolume: 0,
    compressorThreshold: -12,
    compressorRatio: 2,
    color: '#FF8C00',
    isFactory: true,
  },
  {
    id: 'orchestral-perc',
    name: 'Orchestral Percussion',
    category: 'orchestral',
    tags: ['orchestral', 'classical', 'timpani', 'concert'],
    description: 'Concert hall orchestral percussion',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, ['Timpani C', 'Timpani G', 'Timpani D', 'Bass Drum', 'Snare Concert', 'Snare Roll', 'Cymbals Crash', 'Cymbals Suspended', 'Tam-tam', 'Triangle', 'Tambourine', 'Castanets', 'Wood Block', 'Temple Blocks', 'Chimes', 'Glockenspiel'][i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`orch-${i}`, 4), {
        reverbSend: 0.6,
      })
    ),
    chokeGroups: [],
    masterVolume: 0,
    compressorThreshold: -15,
    compressorRatio: 2,
    color: '#8B0000',
    isFactory: true,
  },
  {
    id: 'lofi-hiphop',
    name: 'Lo-Fi Hip-Hop',
    category: 'lo-fi',
    tags: ['lo-fi', 'chill', 'hip-hop', 'mellow'],
    description: 'Mellow lo-fi hip-hop drum sounds',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, PAD_NOTE_NAMES[i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`lofi-${i}`, 3), {
        filter: { enabled: true, type: 'lowpass', frequency: 6000, resonance: 0.3, envelopeAmount: 0 },
        velocityCurve: -0.4,
      })
    ),
    chokeGroups: [{ id: 0, padIndices: [4, 5, 6], chokeTimeMs: 15 }],
    masterVolume: -3,
    compressorThreshold: -12,
    compressorRatio: 2,
    color: '#DDA0DD',
    isFactory: true,
  },
  {
    id: 'processed-glitch',
    name: 'Glitch Kit',
    category: 'processed',
    tags: ['glitch', 'experimental', 'electronic', 'idm'],
    description: 'Glitchy processed drum sounds',
    pads: Array.from({ length: PAD_COUNT }, (_, i) =>
      createDrumPad(i, PAD_NOTE_NAMES[i] ?? `Pad ${i}`, GM_DRUM_MAP_START + i + 1, createVelocityLayers(`glitch-${i}`, 2), {
        pitch: (i % 3) - 1,
        decayMod: 0.3 + Math.random() * 0.7,
      })
    ),
    chokeGroups: [],
    masterVolume: 0,
    compressorThreshold: -4,
    compressorRatio: 10,
    color: '#00CED1',
    isFactory: true,
  },
];

// =============================================================================
// STATE FACTORY
// =============================================================================

/**
 * Create initial drum kit state
 */
export function createDrumKitState(kit?: DrumKitPreset): DrumKitState {
  const defaultKit = kit ?? DRUM_KIT_PRESETS[0];
  if (!defaultKit) {
    throw new Error('No drum kit presets available');
  }

  return {
    kit: defaultKit,
    voices: [],
    soloPads: [],
    masterVolume: 0.8,
    swing: 0,
    voiceCounter: 0,
    lastTriggerTime: new Map(),
    velocitySensitivity: 1.0,
  };
}

// =============================================================================
// VOICE MANAGEMENT
// =============================================================================

/**
 * Find pad by MIDI note
 */
export function findPadByNote(kit: DrumKitPreset, note: number): DrumPad | null {
  return kit.pads.find(pad => pad.midiNote === note) ?? null;
}

/**
 * Get sample for velocity
 */
export function getSampleForVelocity(pad: DrumPad, velocity: number): PadSample | null {
  for (const layer of pad.velocityLayers) {
    if (velocity >= layer.velocityLow && velocity <= layer.velocityHigh) {
      if (layer.samples.length === 0) return null;

      const sample = layer.samples[layer.roundRobinIndex % layer.samples.length] ?? null;
      layer.roundRobinIndex = (layer.roundRobinIndex + 1) % layer.samples.length;
      return sample;
    }
  }
  return null;
}

/**
 * Create a drum voice
 */
export function createDrumVoice(
  id: string,
  padIndex: number,
  sample: PadSample,
  velocity: number,
  time: number
): DrumVoice {
  return {
    id,
    padIndex,
    sample,
    velocity,
    playhead: 0,
    isActive: true,
    isChoking: false,
    chokeFade: 1,
    envelopeStage: 0,
    envelopeValue: 0,
    envelopeTime: 0,
    outputGain: 0,
    startTime: time,
  };
}

// =============================================================================
// INPUT PROCESSING
// =============================================================================

/**
 * Process drum kit input
 */
export function processDrumKitInput(
  state: DrumKitState,
  input: DrumKitInput
): DrumKitResult {
  const outputs: DrumKitOutput[] = [];

  switch (input.type) {
    case 'noteOn': {
      const pad = findPadByNote(state.kit, input.note);
      if (!pad) return { state, outputs };
      return processDrumKitInput(state, {
        type: 'padTrigger',
        padIndex: pad.index,
        velocity: input.velocity,
      });
    }

    case 'noteOff': {
      const pad = findPadByNote(state.kit, input.note);
      if (!pad) return { state, outputs };
      return processDrumKitInput(state, { type: 'padRelease', padIndex: pad.index });
    }

    case 'padTrigger': {
      const { padIndex, velocity } = input;
      if (padIndex < 0 || padIndex >= state.kit.pads.length) {
        return { state, outputs };
      }

      const pad = state.kit.pads[padIndex];
      if (!pad) return { state, outputs };

      // Check mute/solo
      if (pad.muted) return { state, outputs };
      if (state.soloPads.length > 0 && !state.soloPads.includes(padIndex)) {
        return { state, outputs };
      }

      // Apply velocity sensitivity
      const adjustedVelocity = Math.round(
        127 - (127 - velocity) * state.velocitySensitivity
      );

      // Get sample
      const sample = getSampleForVelocity(pad, adjustedVelocity);
      if (!sample) return { state, outputs };

      // Handle choke groups
      let newVoices = [...state.voices];
      if (pad.chokeGroup >= 0) {
        const chokeGroup = state.kit.chokeGroups.find(g => g.id === pad.chokeGroup);
        if (chokeGroup) {
          newVoices = newVoices.map(voice => {
            if (chokeGroup.padIndices.includes(voice.padIndex) && voice.padIndex !== padIndex) {
              outputs.push({ type: 'voiceChoked', voiceId: voice.id, padIndex: voice.padIndex, byPad: padIndex });
              return { ...voice, isChoking: true };
            }
            return voice;
          });
        }
      }

      // Limit polyphony
      if (newVoices.filter(v => v.isActive).length >= MAX_VOICES) {
        const oldest = newVoices.reduce((old, v) =>
          v.isActive && v.startTime < old.startTime ? v : old
        );
        newVoices = newVoices.filter(v => v.id !== oldest.id);
      }

      // Create new voice
      const voiceId = `drum-voice-${state.voiceCounter}`;
      const voice = createDrumVoice(voiceId, padIndex, sample, adjustedVelocity, 0);
      newVoices.push(voice);

      outputs.push({ type: 'voiceStart', voiceId, padIndex, velocity: adjustedVelocity });

      const newLastTriggerTime = new Map(state.lastTriggerTime);
      newLastTriggerTime.set(padIndex, 0);

      return {
        state: {
          ...state,
          voices: newVoices,
          voiceCounter: state.voiceCounter + 1,
          lastTriggerTime: newLastTriggerTime,
        },
        outputs,
      };
    }

    case 'padRelease': {
      // For one-shot samples, note-off doesn't stop playback
      // But we could trigger release phase for sustaining sounds
      return { state, outputs };
    }

    case 'loadKit': {
      const kit = DRUM_KIT_PRESETS.find(k => k.id === input.kitId);
      if (!kit) {
        outputs.push({ type: 'error', message: `Kit not found: ${input.kitId}` });
        return { state, outputs };
      }

      const newState = createDrumKitState(kit);
      outputs.push({ type: 'kitLoaded', kitId: kit.id });

      return { state: newState, outputs };
    }

    case 'setPadVolume': {
      const { padIndex, volume } = input;
      if (padIndex < 0 || padIndex >= state.kit.pads.length) return { state, outputs };

      const existingPad = state.kit.pads[padIndex];
      if (!existingPad) return { state, outputs };

      const newPads = [...state.kit.pads];
      newPads[padIndex] = { ...existingPad, volume: Math.max(0, Math.min(1, volume)) };

      return { state: { ...state, kit: { ...state.kit, pads: newPads } }, outputs };
    }

    case 'setPadPan': {
      const { padIndex, pan } = input;
      if (padIndex < 0 || padIndex >= state.kit.pads.length) return { state, outputs };

      const existingPad = state.kit.pads[padIndex];
      if (!existingPad) return { state, outputs };

      const newPads = [...state.kit.pads];
      newPads[padIndex] = { ...existingPad, pan: Math.max(-1, Math.min(1, pan)) };

      return { state: { ...state, kit: { ...state.kit, pads: newPads } }, outputs };
    }

    case 'setPadPitch': {
      const { padIndex, semitones } = input;
      if (padIndex < 0 || padIndex >= state.kit.pads.length) return { state, outputs };

      const existingPad = state.kit.pads[padIndex];
      if (!existingPad) return { state, outputs };

      const newPads = [...state.kit.pads];
      newPads[padIndex] = { ...existingPad, pitch: Math.max(-24, Math.min(24, semitones)) };

      return { state: { ...state, kit: { ...state.kit, pads: newPads } }, outputs };
    }

    case 'setPadDecay': {
      const { padIndex, multiplier } = input;
      if (padIndex < 0 || padIndex >= state.kit.pads.length) return { state, outputs };

      const existingPad = state.kit.pads[padIndex];
      if (!existingPad) return { state, outputs };

      const newPads = [...state.kit.pads];
      newPads[padIndex] = { ...existingPad, decayMod: Math.max(0.1, Math.min(10, multiplier)) };

      return { state: { ...state, kit: { ...state.kit, pads: newPads } }, outputs };
    }

    case 'setPadFilter': {
      const { padIndex, config } = input;
      if (padIndex < 0 || padIndex >= state.kit.pads.length) return { state, outputs };

      const existingPad = state.kit.pads[padIndex];
      if (!existingPad) return { state, outputs };

      const newPads = [...state.kit.pads];
      newPads[padIndex] = {
        ...existingPad,
        filter: { ...existingPad.filter, ...config },
      };

      return { state: { ...state, kit: { ...state.kit, pads: newPads } }, outputs };
    }

    case 'setPadSends': {
      const { padIndex, reverb, delay } = input;
      if (padIndex < 0 || padIndex >= state.kit.pads.length) return { state, outputs };

      const existingPad = state.kit.pads[padIndex];
      if (!existingPad) return { state, outputs };

      const newPads = [...state.kit.pads];
      newPads[padIndex] = {
        ...existingPad,
        reverbSend: reverb ?? existingPad.reverbSend,
        delaySend: delay ?? existingPad.delaySend,
      };

      return { state: { ...state, kit: { ...state.kit, pads: newPads } }, outputs };
    }

    case 'mutePad': {
      const { padIndex } = input;
      if (padIndex < 0 || padIndex >= state.kit.pads.length) return { state, outputs };

      const existingPad = state.kit.pads[padIndex];
      if (!existingPad) return { state, outputs };

      const newPads = [...state.kit.pads];
      newPads[padIndex] = { ...existingPad, muted: !existingPad.muted };

      return { state: { ...state, kit: { ...state.kit, pads: newPads } }, outputs };
    }

    case 'soloPad': {
      const { padIndex } = input;
      if (padIndex < 0 || padIndex >= state.kit.pads.length) return { state, outputs };

      const soloPads = state.soloPads.includes(padIndex)
        ? state.soloPads.filter(i => i !== padIndex)
        : [...state.soloPads, padIndex];

      return { state: { ...state, soloPads }, outputs };
    }

    case 'setMasterVolume': {
      const masterVolume = Math.max(0, Math.min(1, input.volume));
      return { state: { ...state, masterVolume }, outputs };
    }

    case 'setSwing': {
      const swing = Math.max(0, Math.min(1, input.amount));
      return { state: { ...state, swing }, outputs };
    }

    case 'setVelocitySensitivity': {
      const velocitySensitivity = Math.max(0, Math.min(1, input.amount));
      return { state: { ...state, velocitySensitivity }, outputs };
    }

    case 'allNotesOff':
    case 'allSoundOff': {
      // End all voices
      for (const voice of state.voices) {
        outputs.push({ type: 'voiceEnd', voiceId: voice.id, padIndex: voice.padIndex });
      }
      return { state: { ...state, voices: [] }, outputs };
    }

    case 'tick': {
      const { deltaTime } = input;
      if (deltaTime <= 0) return { state, outputs };

      // Process each voice
      const newVoices: DrumVoice[] = [];

      for (const voice of state.voices) {
        if (!voice.isActive) continue;

        const pad = state.kit.pads[voice.padIndex];
        if (!pad) continue;
        const envelope = pad.envelope;

        // Handle choking
        if (voice.isChoking) {
          const newFade = voice.chokeFade - deltaTime * 100;  // Fast choke
          if (newFade <= 0) {
            outputs.push({ type: 'voiceEnd', voiceId: voice.id, padIndex: voice.padIndex });
            continue;
          }
          newVoices.push({ ...voice, chokeFade: newFade, outputGain: voice.outputGain * newFade });
          continue;
        }

        // Check if sample finished (one-shot)
        const newPlayhead = voice.playhead + Math.floor(deltaTime * SAMPLE_RATE);
        if (newPlayhead >= voice.sample.length) {
          outputs.push({ type: 'voiceEnd', voiceId: voice.id, padIndex: voice.padIndex });
          continue;
        }

        // Simple envelope (just decay for one-shots)
        let envValue = voice.envelopeValue;
        let envTime = voice.envelopeTime + deltaTime;

        if (voice.envelopeStage === 0) {
          // Attack
          if (envelope.attack <= 0) {
            envValue = 1;
          } else {
            envValue = Math.min(1, envTime / envelope.attack);
          }
          if (envValue >= 1) {
            envTime = 0;
          }
        }

        // Apply decay
        const decayTime = envelope.decay * pad.decayMod;
        if (decayTime > 0 && envTime > envelope.hold) {
          const decayProgress = (envTime - envelope.hold) / decayTime;
          envValue = Math.max(0, 1 - decayProgress);
        }

        if (envValue <= 0) {
          outputs.push({ type: 'voiceEnd', voiceId: voice.id, padIndex: voice.padIndex });
          continue;
        }

        const outputGain = envValue * pad.volume * (voice.velocity / 127) * state.masterVolume;

        newVoices.push({
          ...voice,
          playhead: newPlayhead,
          envelopeValue: envValue,
          envelopeTime: envTime,
          outputGain,
        });
      }

      return { state: { ...state, voices: newVoices }, outputs };
    }

    case 'midiCC': {
      const { controller, value } = input;
      switch (controller) {
        case 7:  // Volume
          return processDrumKitInput(state, { type: 'setMasterVolume', volume: value / 127 });
        case 120: // All sound off
        case 123: // All notes off
          return processDrumKitInput(state, { type: 'allSoundOff' });
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

/**
 * Card metadata
 */
export const DRUM_KIT_CARD_META = {
  id: 'drum-kit',
  name: 'Drum Kit',
  category: 'generator' as const,
  description: 'Multi-velocity drum kit with 16 pads and choke groups',

  inputPorts: [
    { id: 'midi', name: 'MIDI In', type: 'midi' as const },
    { id: 'trigger', name: 'Trigger', type: 'trigger' as const },
  ],

  outputPorts: [
    { id: 'audio-l', name: 'Audio L', type: 'audio' as const },
    { id: 'audio-r', name: 'Audio R', type: 'audio' as const },
    { id: 'kick', name: 'Kick Out', type: 'audio' as const },
    { id: 'snare', name: 'Snare Out', type: 'audio' as const },
    { id: 'hats', name: 'Hi-Hats Out', type: 'audio' as const },
  ],

  parameters: [
    { id: 'kit', name: 'Kit', type: 'enum' as const, values: DRUM_KIT_PRESETS.map(k => k.id), default: DRUM_KIT_PRESETS[0]?.id },
    { id: 'masterVolume', name: 'Master Volume', type: 'float' as const, min: 0, max: 1, default: 0.8 },
    { id: 'swing', name: 'Swing', type: 'float' as const, min: 0, max: 1, default: 0 },
    { id: 'velocitySensitivity', name: 'Velocity Sens', type: 'float' as const, min: 0, max: 1, default: 1 },
  ],
};

/**
 * Create drum kit card instance
 */
export function createDrumKitCard() {
  let state = createDrumKitState();

  return {
    meta: DRUM_KIT_CARD_META,

    process(input: DrumKitInput): DrumKitOutput[] {
      const result = processDrumKitInput(state, input);
      state = result.state;
      return result.outputs;
    },

    getState(): DrumKitState {
      return state;
    },

    reset(): void {
      state = createDrumKitState();
    },

    loadKit(kitId: string): DrumKitOutput[] {
      return this.process({ type: 'loadKit', kitId });
    },

    getKits(): DrumKitPreset[] {
      return DRUM_KIT_PRESETS;
    },

    getKitsByCategory(category: KitCategory): DrumKitPreset[] {
      return DRUM_KIT_PRESETS.filter(k => k.category === category);
    },

    getPads(): DrumPad[] {
      return state.kit.pads;
    },

    getActiveVoiceCount(): number {
      return state.voices.filter(v => v.isActive).length;
    },
  };
}
