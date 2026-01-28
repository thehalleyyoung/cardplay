/**
 * Keyboard Instrument Cards
 *
 * Professional keyboard instrument cards including acoustic pianos,
 * electric pianos, and mallet instruments. Features multi-velocity
 * sampling, key noise, resonance, and authentic articulations.
 *
 * Features:
 * - Multi-velocity layer sampling (up to 8 layers)
 * - Sympathetic string resonance
 * - Key-off samples (damper and release)
 * - Pedal simulation (sustain, sostenuto, una corda)
 * - Stereo imaging and microphone positioning
 * - Comprehensive tonal presets
 * - Expression control via MIDI CC
 */

import type { Card, CardMeta, CardSignature, CardState, CardResult, CardContext, CardParam } from './card';
import type { FloatParameter, IntParameter, EnumParameter, BoolParameter } from './parameters';
import type { CardVisuals, CardBehavior, CardUIConfig, CardPanel } from './card-visuals';
import { CARD_FRAMES, createInstrumentBehavior, DEFAULT_DARK_THEME } from './card-visuals';
import type { Preset } from './presets';
import { createPreset } from './presets';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Piano type
 */
export type PianoType =
  | 'grand'          // Concert grand
  | 'upright'        // Upright/vertical piano
  | 'baby-grand'     // Baby grand (smaller)
  | 'spinet'         // Small upright
  | 'felt'           // Prepared with felt on hammers
  | 'prepared'       // Prepared piano (Cage-style)
  | 'toy'            // Toy piano
  | 'honky-tonk';    // Detuned/bar piano

/**
 * Electric piano type
 */
export type ElectricPianoType =
  | 'rhodes-mk1'     // Fender Rhodes Mark I
  | 'rhodes-mk2'     // Fender Rhodes Mark II
  | 'rhodes-mk5'     // Fender Rhodes Mark V (modern)
  | 'wurlitzer'      // Wurlitzer 200/200A
  | 'wurlitzer-206a' // Wurlitzer 206A
  | 'hohner-d6'      // Hohner Clavinet D6
  | 'clavinet'       // Generic clavinet
  | 'cp70'           // Yamaha CP-70
  | 'dyno-my-piano'; // Dyno My Piano

/**
 * Mallet instrument type
 */
export type MalletType =
  | 'vibraphone'     // Vibes with motor
  | 'marimba'        // Concert marimba
  | 'xylophone'      // Xylophone
  | 'glockenspiel'   // Glockenspiel/bells
  | 'tubular-bells'  // Chimes
  | 'kalimba'        // Thumb piano
  | 'steelpan'       // Steel drum
  | 'celesta';       // Celesta

/**
 * Damper behavior
 */
export type DamperBehavior = 'instant' | 'gradual' | 'realistic';

/**
 * Microphone positioning (stereo imaging)
 */
export type MicPositioning =
  | 'close'       // Close-miked, dry
  | 'player'      // Player perspective
  | 'audience'    // Audience perspective
  | 'room'        // Room mic blend
  | 'classic'     // Classic stereo pair
  | 'binaural';   // 3D binaural recording

/**
 * Pedal simulation mode
 */
export interface PedalSimulation {
  /** Sustain pedal enabled */
  sustain: boolean;
  /** Sostenuto pedal enabled */
  sostenuto: boolean;
  /** Una corda (soft pedal) enabled */
  unaCorda: boolean;
  /** Sustain pedal resonance amount (0-1) */
  sustainResonance: number;
  /** Half-pedaling sensitivity (0-1) */
  halfPedalSensitivity: number;
}

/**
 * Acoustic piano state
 */
export interface PianoState {
  /** Piano type */
  type: PianoType;
  /** Velocity layers (1-8) */
  velocityLayers: number;
  /** Current velocity curve (0=linear, 0.5=medium, 1=hard) */
  velocityCurve: number;
  /** Sympathetic resonance amount (0-1) */
  sympatheticResonance: number;
  /** Key-off noise (damper) level (0-1) */
  keyOffNoise: number;
  /** Pedal resonance enabled */
  pedalResonance: boolean;
  /** Sustain pedal position (0-127) */
  sustainPedal: number;
  /** Una corda enabled */
  unaCorda: boolean;
  /** Microphone positioning */
  micPositioning: MicPositioning;
  /** Lid position (0=closed, 1=full open) */
  lidPosition: number;
  /** Stretch tuning enabled */
  stretchTuning: boolean;
  /** Tune detuning amount (cents) */
  detune: number;
  /** Mechanical noise level (0-1) */
  mechanicalNoise: number;
  /** Dynamic range (0=compressed, 1=natural) */
  dynamicRange: number;
  /** Warmth/brightness EQ (-1=dark, 0=neutral, 1=bright) */
  tone: number;
}

/**
 * Electric piano state
 */
export interface ElectricPianoState {
  /** Electric piano type */
  type: ElectricPianoType;
  /** Velocity layers (1-8) */
  velocityLayers: number;
  /** Bell amount (tine resonance) (0-1) */
  bell: number;
  /** Bark/bite amount (0-1) */
  bark: number;
  /** Tremolo depth (0-1) */
  tremoloDepth: number;
  /** Tremolo rate (0-20 Hz) */
  tremoloRate: number;
  /** Overdrive/distortion (0-1) */
  drive: number;
  /** Phaser enabled */
  phaser: boolean;
  /** Phaser rate (0-10 Hz) */
  phaserRate: number;
  /** Phaser depth (0-1) */
  phaserDepth: number;
  /** Chorus enabled */
  chorus: boolean;
  /** Chorus rate (0-10 Hz) */
  chorusRate: number;
  /** Chorus depth (0-1) */
  chorusDepth: number;
  /** Key-off noise level (0-1) */
  keyOffNoise: number;
  /** Mechanical noise level (0-1) */
  mechanicalNoise: number;
  /** Tune detuning amount (cents) */
  detune: number;
  /** EQ tone (-1=dark, 0=neutral, 1=bright) */
  tone: number;
  /** Sustain pedal position (0-127) */
  sustainPedal: number;
}

/**
 * Mallet instrument state
 */
export interface MalletState {
  /** Mallet instrument type */
  type: MalletType;
  /** Velocity layers (1-8) */
  velocityLayers: number;
  /** Mallet hardness (0=soft, 1=hard) */
  malletHardness: number;
  /** Motor vibrato enabled (vibraphone only) */
  motorVibrato: boolean;
  /** Motor vibrato rate (0-10 Hz) */
  motorRate: number;
  /** Motor vibrato depth (0-1) */
  motorDepth: number;
  /** Damper behavior */
  damperBehavior: DamperBehavior;
  /** Resonance/sustain (0-1) */
  resonance: number;
  /** Roll mode enabled (continuous roll) */
  rollMode: boolean;
  /** Roll speed (notes per second) */
  rollSpeed: number;
  /** Tune detuning amount (cents) */
  detune: number;
  /** Mechanical noise level (0-1) */
  mechanicalNoise: number;
  /** Stereo width (0=mono, 1=full stereo) */
  stereoWidth: number;
  /** EQ tone (-1=dark, 0=neutral, 1=bright) */
  tone: number;
  /** Sustain pedal position (0-127) */
  sustainPedal: number;
}

// =============================================================================
// PIANO CARD
// =============================================================================

/**
 * Piano card parameters
 */
export const PIANO_PARAMETERS = {
  type: {
    id: 'type',
    name: 'Piano Type',
    type: 'enum' as const,
    value: 'grand' as PianoType,
    default: 'grand' as PianoType,
    options: ['grand', 'upright', 'baby-grand', 'spinet', 'felt', 'prepared', 'toy', 'honky-tonk'] as readonly PianoType[],
    labels: ['Grand', 'Upright', 'Baby Grand', 'Spinet', 'Felt', 'Prepared', 'Toy', 'Honky-Tonk'] as readonly string[],
    automatable: false,
    modulatable: false,
    group: 'instrument',
  } as const satisfies EnumParameter<PianoType>,
  velocityLayers: {
    id: 'velocityLayers',
    name: 'Velocity Layers',
    type: 'int' as const,
    value: 4,
    default: 4,
    min: 1,
    max: 8,
    step: 1,
    automatable: false,
    modulatable: false,
    group: 'instrument',
  } as const satisfies IntParameter,
  velocityCurve: {
    id: 'velocityCurve',
    name: 'Velocity Curve',
    type: 'float' as const,
    value: 0.5,
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    curve: 'linear' as const,
    precision: 2,
    automatable: true,
    modulatable: false,
    group: 'response',
  } as const satisfies FloatParameter,
  sympatheticResonance: {
    id: 'sympatheticResonance',
    name: 'Sympathetic Resonance',
    type: 'float' as const,
    value: 0.3,
    default: 0.3,
    min: 0,
    max: 1,
    step: 0.01,
    curve: 'linear' as const,
    precision: 2,
    automatable: true,
    modulatable: true,
    group: 'resonance',
  } as const satisfies FloatParameter,
  keyOffNoise: {
    id: 'keyOffNoise',
    name: 'Key-Off Noise',
    type: 'float' as const,
    value: 0.5,
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    curve: 'linear' as const,
    precision: 2,
    automatable: true,
    modulatable: false,
    group: 'articulation',
  } as const satisfies FloatParameter,
  pedalResonance: {
    id: 'pedalResonance',
    name: 'Pedal Resonance',
    type: 'bool' as const,
    value: true,
    default: true,
    automatable: false,
    modulatable: false,
    group: 'resonance',
  } as const satisfies BoolParameter,
  sustainPedal: {
    id: 'sustainPedal',
    name: 'Sustain Pedal',
    type: 'float' as const,
    value: 0,
    default: 0,
    min: 0,
    max: 127,
    step: 1,
    automatable: true,
    modulatable: false,
    ccNumber: 64,
    group: 'pedals',
  } as FloatParameter,
  unaCorda: {
    id: 'unaCorda',
    name: 'Una Corda (Soft Pedal)',
    type: 'bool' as const,
    value: false,
    default: false,
    automatable: true,
    modulatable: false,
    ccNumber: 67,
    group: 'pedals',
  } as const satisfies BoolParameter,
  micPositioning: {
    id: 'micPositioning',
    name: 'Mic Positioning',
    type: 'enum' as const,
    value: 'player' as MicPositioning,
    default: 'player' as MicPositioning,
    options: ['close', 'player', 'audience', 'room', 'classic', 'binaural'] as readonly MicPositioning[],
    labels: ['Close', 'Player', 'Audience', 'Room', 'Classic', 'Binaural'] as readonly string[],
    automatable: false,
    modulatable: false,
    group: 'stereo',
  } as const satisfies EnumParameter<MicPositioning>,
  lidPosition: {
    id: 'lidPosition',
    name: 'Lid Position',
    type: 'float' as const,
    value: 1,
    default: 1,
    min: 0,
    max: 1,
    step: 0.01,
    curve: 'linear' as const,
    precision: 2,
    automatable: true,
    modulatable: false,
    group: 'instrument',
  } as const satisfies FloatParameter,
  stretchTuning: {
    id: 'stretchTuning',
    name: 'Stretch Tuning',
    type: 'bool' as const,
    value: true,
    default: true,
    automatable: false,
    modulatable: false,
    group: 'tuning',
  } as const satisfies BoolParameter,
  detune: {
    id: 'detune',
    name: 'Detune',
    type: 'float' as const,
    value: 0,
    default: 0,
    min: -50,
    max: 50,
    step: 0.1,
    curve: 'linear' as const,
    precision: 1,
    automatable: true,
    modulatable: true,
    group: 'tuning',
  } as const satisfies FloatParameter,
  mechanicalNoise: {
    id: 'mechanicalNoise',
    name: 'Mechanical Noise',
    type: 'float' as const,
    value: 0.3,
    default: 0.3,
    min: 0,
    max: 1,
    step: 0.01,
    curve: 'linear' as const,
    precision: 2,
    automatable: true,
    modulatable: false,
    group: 'articulation',
  } as const satisfies FloatParameter,
  dynamicRange: {
    id: 'dynamicRange',
    name: 'Dynamic Range',
    type: 'float' as const,
    value: 1,
    default: 1,
    min: 0,
    max: 1,
    step: 0.01,
    curve: 'linear' as const,
    precision: 2,
    automatable: true,
    modulatable: false,
    group: 'response',
  } as const satisfies FloatParameter,
  tone: {
    id: 'tone',
    name: 'Tone',
    type: 'float' as const,
    value: 0,
    default: 0,
    min: -1,
    max: 1,
    step: 0.01,
    curve: 'linear' as const,
    precision: 2,
    automatable: true,
    modulatable: true,
    group: 'eq',
  } as const satisfies FloatParameter,
};

/**
 * Piano card metadata
 */
export const PIANO_CARD_META: CardMeta = {
  id: 'piano',
  name: 'Piano',
  category: 'generators',
  description: 'Professional acoustic piano with multi-velocity sampling, sympathetic resonance, and authentic pedal simulation',
  version: '1.0.0',
  author: 'CardPlay',
  tags: ['instrument', 'keyboard', 'piano', 'acoustic'],
};

/**
 * Piano card visuals
 */
export const PIANO_CARD_VISUALS: CardVisuals = {
  emoji: '🎹',
  color: '#2c3e50',
  colorSecondary: '#34495e',
  gradient: 'linear',
  gradientAngle: 135,
  glow: '#3498db',
  glowIntensity: 0.6,
  frame: CARD_FRAMES.standard,
};

/**
 * Piano card behavior
 */
export const PIANO_CARD_BEHAVIOR: CardBehavior = createInstrumentBehavior(100);

/**
 * Piano card UI configuration
 */
const PIANO_MAIN_PANEL: CardPanel = {
  id: 'main',
  label: 'Piano',
  position: 'main',
  controls: [],
  layout: { type: 'grid', columns: 4, gap: '8px' },
  collapsible: false,
  defaultCollapsed: false,
};

const PIANO_ADVANCED_PANEL: CardPanel = {
  id: 'advanced',
  label: 'Advanced',
  position: 'sidebar',
  controls: [],
  layout: { type: 'grid', columns: 2, gap: '8px' },
  collapsible: true,
  defaultCollapsed: true,
};

export const PIANO_UI_CONFIG: CardUIConfig = {
  panels: [PIANO_MAIN_PANEL, PIANO_ADVANCED_PANEL],
  editorType: 'knobs',
  defaultView: 'standard',
  resizable: true,
  minWidth: 300,
  minHeight: 400,
  maxWidth: 800,
  maxHeight: 800,
  theme: DEFAULT_DARK_THEME,
};

/**
 * Piano presets
 */
export const PIANO_PRESETS: ReadonlyArray<Preset> = [
  createPreset({
    id: 'piano-concert-grand',
    name: 'Concert Grand',
    category: 'grand',
    author: 'CardPlay',
    tags: ['classical', 'concert', 'bright'],
    params: {
      type: 'grand',
      velocityLayers: 8,
      velocityCurve: 0.5,
      sympatheticResonance: 0.4,
      keyOffNoise: 0.6,
      pedalResonance: true,
      micPositioning: 'classic',
      lidPosition: 1,
      stretchTuning: true,
      detune: 0,
      mechanicalNoise: 0.2,
      dynamicRange: 1,
      tone: 0.2,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'piano-intimate-grand',
    name: 'Intimate Grand',
    category: 'grand',
    author: 'CardPlay',
    tags: ['jazz', 'close', 'warm'],
    params: {
      type: 'grand',
      velocityLayers: 6,
      velocityCurve: 0.6,
      sympatheticResonance: 0.3,
      keyOffNoise: 0.7,
      pedalResonance: true,
      micPositioning: 'close',
      lidPosition: 0.5,
      stretchTuning: true,
      detune: 0,
      mechanicalNoise: 0.4,
      dynamicRange: 0.9,
      tone: -0.1,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'piano-upright',
    name: 'Classic Upright',
    category: 'upright',
    author: 'CardPlay',
    tags: ['folk', 'home', 'warm'],
    params: {
      type: 'upright',
      velocityLayers: 4,
      velocityCurve: 0.5,
      sympatheticResonance: 0.2,
      keyOffNoise: 0.5,
      pedalResonance: true,
      micPositioning: 'player',
      lidPosition: 1,
      stretchTuning: false,
      detune: 2,
      mechanicalNoise: 0.5,
      dynamicRange: 0.8,
      tone: -0.2,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'piano-baby-grand',
    name: 'Baby Grand',
    category: 'grand',
    author: 'CardPlay',
    tags: ['pop', 'studio', 'versatile'],
    params: {
      type: 'baby-grand',
      velocityLayers: 6,
      velocityCurve: 0.5,
      sympatheticResonance: 0.3,
      keyOffNoise: 0.5,
      pedalResonance: true,
      micPositioning: 'player',
      lidPosition: 0.75,
      stretchTuning: true,
      detune: 0,
      mechanicalNoise: 0.3,
      dynamicRange: 0.9,
      tone: 0,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'piano-felt',
    name: 'Felt Piano',
    category: 'prepared',
    author: 'CardPlay',
    tags: ['soft', 'intimate', 'ambient'],
    params: {
      type: 'felt',
      velocityLayers: 4,
      velocityCurve: 0.7,
      sympatheticResonance: 0.4,
      keyOffNoise: 0.3,
      pedalResonance: true,
      micPositioning: 'close',
      lidPosition: 0.3,
      stretchTuning: false,
      detune: 5,
      mechanicalNoise: 0.2,
      dynamicRange: 0.7,
      tone: -0.5,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'piano-honky-tonk',
    name: 'Honky-Tonk',
    category: 'prepared',
    author: 'CardPlay',
    tags: ['vintage', 'detuned', 'character'],
    params: {
      type: 'honky-tonk',
      velocityLayers: 3,
      velocityCurve: 0.4,
      sympatheticResonance: 0.1,
      keyOffNoise: 0.6,
      pedalResonance: false,
      micPositioning: 'close',
      lidPosition: 1,
      stretchTuning: false,
      detune: 15,
      mechanicalNoise: 0.7,
      dynamicRange: 0.6,
      tone: 0.3,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'piano-toy',
    name: 'Toy Piano',
    category: 'toy',
    author: 'CardPlay',
    tags: ['cute', 'lo-fi', 'quirky'],
    params: {
      type: 'toy',
      velocityLayers: 2,
      velocityCurve: 0.3,
      sympatheticResonance: 0,
      keyOffNoise: 0.3,
      pedalResonance: false,
      micPositioning: 'close',
      lidPosition: 1,
      stretchTuning: false,
      detune: 10,
      mechanicalNoise: 0.8,
      dynamicRange: 0.5,
      tone: 0.5,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'piano-prepared',
    name: 'Prepared Piano',
    category: 'prepared',
    author: 'CardPlay',
    tags: ['experimental', 'cage', 'textural'],
    params: {
      type: 'prepared',
      velocityLayers: 4,
      velocityCurve: 0.5,
      sympatheticResonance: 0.6,
      keyOffNoise: 0.7,
      pedalResonance: true,
      micPositioning: 'close',
      lidPosition: 1,
      stretchTuning: false,
      detune: 20,
      mechanicalNoise: 0.9,
      dynamicRange: 0.8,
      tone: 0,
    },
    isFactory: true,
  }),
];

/**
 * Creates a Piano card.
 */
export function createPianoCard(): Card<never, { midi: number[] }> {
  const initialState: PianoState = {
    type: 'grand',
    velocityLayers: 4,
    velocityCurve: 0.5,
    sympatheticResonance: 0.3,
    keyOffNoise: 0.5,
    pedalResonance: true,
    sustainPedal: 0,
    unaCorda: false,
    micPositioning: 'player',
    lidPosition: 1,
    stretchTuning: true,
    detune: 0,
    mechanicalNoise: 0.3,
    dynamicRange: 1,
    tone: 0,
  };

  const cardState = { ...initialState };

  const signature: CardSignature = {
    inputs: [],
    outputs: [{ name: 'midi', type: 'midi' }],
    params: Object.values(PIANO_PARAMETERS) as unknown as readonly CardParam[],
  };

  return {
    meta: PIANO_CARD_META,
    signature,
    process: (_input: never, _context: CardContext, _state?: CardState<unknown>): CardResult<{ midi: number[] }> => {
      // For now, pass through MIDI (actual synthesis happens in audio engine)
      // State management would be handled via CardState in a full implementation
      void cardState; // Acknowledge internal state for future use
      return { output: { midi: [] } };
    },
  };
}

// =============================================================================
// ELECTRIC PIANO CARD
// =============================================================================

/**
 * Electric piano card parameters
 */
export const ELECTRIC_PIANO_PARAMETERS = {
  type: {
    id: 'type',
    name: 'Type',
    type: 'enum' as const,
    value: 'rhodes-mk1' as ElectricPianoType,
    default: 'rhodes-mk1' as ElectricPianoType,
    options: ['rhodes-mk1', 'rhodes-mk2', 'rhodes-mk5', 'wurlitzer', 'wurlitzer-206a', 'hohner-d6', 'clavinet', 'cp70', 'dyno-my-piano'] as readonly ElectricPianoType[],
    labels: ['Rhodes Mk1', 'Rhodes Mk2', 'Rhodes Mk5', 'Wurlitzer', 'Wurlitzer 206A', 'Hohner D6', 'Clavinet', 'CP-70', 'Dyno My Piano'] as readonly string[],
    automatable: false,
    modulatable: false,
    group: 'instrument',
  } as const satisfies EnumParameter<ElectricPianoType>,
  velocityLayers: {
    id: 'velocityLayers',
    name: 'Velocity Layers',
    type: 'int' as const,
    value: 4,
    default: 4,
    min: 1,
    max: 8,
    step: 1,
    automatable: false,
    modulatable: false,
    group: 'instrument',
  } as const satisfies IntParameter,
  bell: {
    id: 'bell',
    name: 'Bell',
    type: 'float' as const,
    value: 0.5,
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    automatable: true,
    modulatable: true,
    group: 'timbre',
  } as FloatParameter,
  bark: {
    id: 'bark',
    name: 'Bark',
    type: 'float' as const,
    value: 0.3,
    default: 0.3,
    min: 0,
    max: 1,
    step: 0.01,
    automatable: true,
    modulatable: true,
    group: 'timbre',
  } as FloatParameter,
  tremoloDepth: {
    id: 'tremoloDepth',
    name: 'Tremolo Depth',
    type: 'float' as const,
    value: 0,
    default: 0,
    min: 0,
    max: 1,
    step: 0.01,
    automatable: true,
    modulatable: true,
    group: 'modulation',
  } as FloatParameter,
  tremoloRate: {
    id: 'tremoloRate',
    name: 'Tremolo Rate',
    type: 'float' as const,
    value: 5,
    default: 5,
    min: 0,
    max: 20,
    step: 0.1,
    automatable: true,
    modulatable: true,
    group: 'modulation',
  } as FloatParameter,
  drive: {
    id: 'drive',
    name: 'Drive',
    type: 'float' as const,
    value: 0,
    default: 0,
    min: 0,
    max: 1,
    step: 0.01,
    automatable: true,
    modulatable: true,
    group: 'effects',
  } as FloatParameter,
  phaser: {
    id: 'phaser',
    name: 'Phaser',
    type: 'bool' as const,
    value: false,
    default: false,
    automatable: true,
    group: 'effects',
  } as BoolParameter,
  phaserRate: {
    id: 'phaserRate',
    name: 'Phaser Rate',
    type: 'float' as const,
    value: 0.5,
    default: 0.5,
    min: 0,
    max: 10,
    step: 0.1,
    automatable: true,
    modulatable: true,
    group: 'effects',
  } as FloatParameter,
  phaserDepth: {
    id: 'phaserDepth',
    name: 'Phaser Depth',
    type: 'float' as const,
    value: 0.5,
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    automatable: true,
    modulatable: true,
    group: 'effects',
  } as FloatParameter,
  chorus: {
    id: 'chorus',
    name: 'Chorus',
    type: 'bool' as const,
    value: false,
    default: false,
    automatable: true,
    group: 'effects',
  } as BoolParameter,
  chorusRate: {
    id: 'chorusRate',
    name: 'Chorus Rate',
    type: 'float' as const,
    value: 1,
    default: 1,
    min: 0,
    max: 10,
    step: 0.1,
    automatable: true,
    modulatable: true,
    group: 'effects',
  } as FloatParameter,
  chorusDepth: {
    id: 'chorusDepth',
    name: 'Chorus Depth',
    type: 'float' as const,
    value: 0.3,
    default: 0.3,
    min: 0,
    max: 1,
    step: 0.01,
    automatable: true,
    modulatable: true,
    group: 'effects',
  } as FloatParameter,
  keyOffNoise: {
    id: 'keyOffNoise',
    name: 'Key-Off Noise',
    type: 'float' as const,
    value: 0.5,
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    automatable: true,
    modulatable: false,
    group: 'articulation',
  } as FloatParameter,
  mechanicalNoise: {
    id: 'mechanicalNoise',
    name: 'Mechanical Noise',
    type: 'float' as const,
    value: 0.3,
    default: 0.3,
    min: 0,
    max: 1,
    step: 0.01,
    automatable: true,
    modulatable: false,
    group: 'articulation',
  } as FloatParameter,
  detune: {
    id: 'detune',
    name: 'Detune',
    type: 'float' as const,
    value: 0,
    default: 0,
    min: -50,
    max: 50,
    step: 0.1,
    automatable: true,
    modulatable: true,
    group: 'tuning',
  } as FloatParameter,
  tone: {
    id: 'tone',
    name: 'Tone',
    type: 'float' as const,
    value: 0,
    default: 0,
    min: -1,
    max: 1,
    step: 0.01,
    automatable: true,
    modulatable: true,
    group: 'eq',
  } as FloatParameter,
  sustainPedal: {
    id: 'sustainPedal',
    name: 'Sustain Pedal',
    type: 'float' as const,
    value: 0,
    default: 0,
    min: 0,
    max: 127,
    step: 1,
    automatable: true,
    modulatable: false,
    ccNumber: 64,
    group: 'pedals',
  } as FloatParameter,
};

/**
 * Electric piano card metadata
 */
export const ELECTRIC_PIANO_CARD_META: CardMeta = {
  id: 'electric-piano',
  name: 'Electric Piano',
  category: 'generators',
  description: 'Classic electric pianos including Rhodes, Wurlitzer, and Clavinet with authentic tine/reed modeling and built-in effects',
  version: '1.0.0',
  author: 'CardPlay',
  tags: ['instrument', 'keyboard', 'electric-piano', 'rhodes', 'wurlitzer'],
};

/**
 * Electric piano card visuals
 */
export const ELECTRIC_PIANO_CARD_VISUALS: CardVisuals = {
  emoji: '🎹',
  emojiSecondary: '⚡',
  color: '#8e44ad',
  colorSecondary: '#9b59b6',
  gradient: 'linear',
  gradientAngle: 135,
  glow: '#e74c3c',
  glowIntensity: 0.7,
  frame: CARD_FRAMES.standard,
};

/**
 * Electric piano card behavior
 */
export const ELECTRIC_PIANO_CARD_BEHAVIOR: CardBehavior = createInstrumentBehavior(50);

/**
 * Electric piano card UI configuration
 */
const ELECTRIC_PIANO_MAIN_PANEL: CardPanel = {
  id: 'main',
  label: 'Electric Piano',
  position: 'main',
  controls: [],
  layout: { type: 'grid', columns: 4, gap: '8px' },
  collapsible: false,
  defaultCollapsed: false,
};

const ELECTRIC_PIANO_EFFECTS_PANEL: CardPanel = {
  id: 'effects',
  label: 'Effects',
  position: 'sidebar',
  controls: [],
  layout: { type: 'grid', columns: 2, gap: '8px' },
  collapsible: true,
  defaultCollapsed: false,
};

export const ELECTRIC_PIANO_UI_CONFIG: CardUIConfig = {
  panels: [ELECTRIC_PIANO_MAIN_PANEL, ELECTRIC_PIANO_EFFECTS_PANEL],
  editorType: 'knobs',
  defaultView: 'standard',
  resizable: true,
  minWidth: 300,
  minHeight: 400,
  maxWidth: 800,
  maxHeight: 800,
  theme: DEFAULT_DARK_THEME,
};

/**
 * Electric piano presets
 */
export const ELECTRIC_PIANO_PRESETS: ReadonlyArray<Preset> = [
  createPreset({
    id: 'epiano-rhodes-classic',
    name: 'Rhodes Classic',
    category: 'rhodes',
    author: 'CardPlay',
    tags: ['rhodes', 'warm', 'vintage'],
    params: {
      type: 'rhodes-mk1',
      velocityLayers: 6,
      bell: 0.6,
      bark: 0.2,
      tremoloDepth: 0.2,
      tremoloRate: 6,
      drive: 0.1,
      phaser: false,
      chorus: false,
      keyOffNoise: 0.5,
      mechanicalNoise: 0.3,
      detune: 0,
      tone: -0.1,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'epiano-rhodes-dyno',
    name: 'Rhodes Dyno',
    category: 'rhodes',
    author: 'CardPlay',
    tags: ['rhodes', 'driven', 'aggressive'],
    params: {
      type: 'rhodes-mk2',
      velocityLayers: 6,
      bell: 0.7,
      bark: 0.5,
      tremoloDepth: 0,
      tremoloRate: 0,
      drive: 0.5,
      phaser: false,
      chorus: false,
      keyOffNoise: 0.6,
      mechanicalNoise: 0.4,
      detune: 0,
      tone: 0.2,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'epiano-rhodes-phaser',
    name: 'Rhodes Phaser',
    category: 'rhodes',
    author: 'CardPlay',
    tags: ['rhodes', 'phaser', 'psychedelic'],
    params: {
      type: 'rhodes-mk1',
      velocityLayers: 6,
      bell: 0.5,
      bark: 0.3,
      tremoloDepth: 0,
      tremoloRate: 0,
      drive: 0.2,
      phaser: true,
      phaserRate: 0.5,
      phaserDepth: 0.7,
      chorus: false,
      keyOffNoise: 0.5,
      mechanicalNoise: 0.3,
      detune: 0,
      tone: 0,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'epiano-wurlitzer',
    name: 'Wurlitzer Classic',
    category: 'wurlitzer',
    author: 'CardPlay',
    tags: ['wurlitzer', 'bell', 'bright'],
    params: {
      type: 'wurlitzer',
      velocityLayers: 5,
      bell: 0.8,
      bark: 0.4,
      tremoloDepth: 0.3,
      tremoloRate: 5,
      drive: 0.1,
      phaser: false,
      chorus: false,
      keyOffNoise: 0.6,
      mechanicalNoise: 0.4,
      detune: 0,
      tone: 0.3,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'epiano-clavinet',
    name: 'Clavinet Funky',
    category: 'clavinet',
    author: 'CardPlay',
    tags: ['clavinet', 'funky', 'percussive'],
    params: {
      type: 'clavinet',
      velocityLayers: 4,
      bell: 0.3,
      bark: 0.9,
      tremoloDepth: 0,
      tremoloRate: 0,
      drive: 0.3,
      phaser: true,
      phaserRate: 1,
      phaserDepth: 0.5,
      chorus: false,
      keyOffNoise: 0.7,
      mechanicalNoise: 0.6,
      detune: 0,
      tone: 0.5,
    },
    isFactory: true,
  }),
];

/**
 * Creates an Electric Piano card.
 */
export function createElectricPianoCard(): Card<never, { midi: number[] }> {
  const initialState: ElectricPianoState = {
    type: 'rhodes-mk1',
    velocityLayers: 4,
    bell: 0.5,
    bark: 0.3,
    tremoloDepth: 0,
    tremoloRate: 5,
    drive: 0,
    phaser: false,
    phaserRate: 0.5,
    phaserDepth: 0.5,
    chorus: false,
    chorusRate: 1,
    chorusDepth: 0.3,
    keyOffNoise: 0.5,
    mechanicalNoise: 0.3,
    detune: 0,
    tone: 0,
    sustainPedal: 0,
  };

  const cardState = { ...initialState };

  const signature: CardSignature = {
    inputs: [],
    outputs: [{ name: 'midi', type: 'midi' }],
    params: Object.values(ELECTRIC_PIANO_PARAMETERS) as unknown as readonly CardParam[],
  };

  return {
    meta: ELECTRIC_PIANO_CARD_META,
    signature,
    process: (_input: never, _context: CardContext, _state?: CardState<unknown>): CardResult<{ midi: number[] }> => {
      // For now, pass through MIDI (actual synthesis happens in audio engine)
      void cardState;
      return { output: { midi: [] } };
    },
  };
}

// =============================================================================
// MALLET CARD
// =============================================================================

/**
 * Mallet card parameters
 */
export const MALLET_PARAMETERS = {
  type: {
    id: 'type',
    name: 'Type',
    type: 'enum' as const,
    value: 'vibraphone' as MalletType,
    default: 'vibraphone' as MalletType,
    options: ['vibraphone', 'marimba', 'xylophone', 'glockenspiel', 'tubular-bells', 'kalimba', 'steelpan', 'celesta'] as readonly MalletType[],
    labels: ['Vibraphone', 'Marimba', 'Xylophone', 'Glockenspiel', 'Tubular Bells', 'Kalimba', 'Steelpan', 'Celesta'] as readonly string[],
    automatable: false,
    modulatable: false,
    group: 'instrument',
  } as const satisfies EnumParameter<MalletType>,
  velocityLayers: {
    id: 'velocityLayers',
    name: 'Velocity Layers',
    type: 'int' as const,
    value: 4,
    default: 4,
    min: 1,
    max: 8,
    step: 1,
    automatable: false,
    modulatable: false,
    group: 'instrument',
  } as const satisfies IntParameter,
  malletHardness: {
    id: 'malletHardness',
    name: 'Mallet Hardness',
    type: 'float' as const,
    value: 0.5,
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    automatable: true,
    modulatable: true,
    group: 'articulation',
  } as FloatParameter,
  motorVibrato: {
    id: 'motorVibrato',
    name: 'Motor Vibrato',
    type: 'bool' as const,
    value: false,
    default: false,
    automatable: true,
    group: 'modulation',
  } as BoolParameter,
  motorRate: {
    id: 'motorRate',
    name: 'Motor Rate',
    type: 'float' as const,
    value: 6,
    default: 6,
    min: 0,
    max: 10,
    step: 0.1,
    automatable: true,
    modulatable: true,
    group: 'modulation',
  } as FloatParameter,
  motorDepth: {
    id: 'motorDepth',
    name: 'Motor Depth',
    type: 'float' as const,
    value: 0.3,
    default: 0.3,
    min: 0,
    max: 1,
    step: 0.01,
    automatable: true,
    modulatable: true,
    group: 'modulation',
  } as FloatParameter,
  damperBehavior: {
    id: 'damperBehavior',
    name: 'Damper Behavior',
    type: 'enum' as const,
    value: 'realistic' as DamperBehavior,
    default: 'realistic' as DamperBehavior,
    options: ['instant', 'gradual', 'realistic'] as readonly DamperBehavior[],
    labels: ['Instant', 'Gradual', 'Realistic'] as readonly string[],
    automatable: false,
    modulatable: false,
    group: 'articulation',
  } as const satisfies EnumParameter<DamperBehavior>,
  resonance: {
    id: 'resonance',
    name: 'Resonance',
    type: 'float' as const,
    value: 0.7,
    default: 0.7,
    min: 0,
    max: 1,
    step: 0.01,
    automatable: true,
    modulatable: true,
    group: 'timbre',
  } as FloatParameter,
  rollMode: {
    id: 'rollMode',
    name: 'Roll Mode',
    type: 'bool' as const,
    value: false,
    default: false,
    automatable: true,
    group: 'articulation',
  } as BoolParameter,
  rollSpeed: {
    id: 'rollSpeed',
    name: 'Roll Speed',
    type: 'float' as const,
    value: 8,
    default: 8,
    min: 1,
    max: 20,
    step: 0.5,
    automatable: true,
    modulatable: true,
    group: 'articulation',
  } as FloatParameter,
  detune: {
    id: 'detune',
    name: 'Detune',
    type: 'float' as const,
    value: 0,
    default: 0,
    min: -50,
    max: 50,
    step: 0.1,
    automatable: true,
    modulatable: true,
    group: 'tuning',
  } as FloatParameter,
  mechanicalNoise: {
    id: 'mechanicalNoise',
    name: 'Mechanical Noise',
    type: 'float' as const,
    value: 0.3,
    default: 0.3,
    min: 0,
    max: 1,
    step: 0.01,
    automatable: true,
    modulatable: false,
    group: 'articulation',
  } as FloatParameter,
  stereoWidth: {
    id: 'stereoWidth',
    name: 'Stereo Width',
    type: 'float' as const,
    value: 0.8,
    default: 0.8,
    min: 0,
    max: 1,
    step: 0.01,
    automatable: true,
    modulatable: false,
    group: 'stereo',
  } as FloatParameter,
  tone: {
    id: 'tone',
    name: 'Tone',
    type: 'float' as const,
    value: 0,
    default: 0,
    min: -1,
    max: 1,
    step: 0.01,
    automatable: true,
    modulatable: true,
    group: 'eq',
  } as FloatParameter,
  sustainPedal: {
    id: 'sustainPedal',
    name: 'Sustain Pedal',
    type: 'float' as const,
    value: 0,
    default: 0,
    min: 0,
    max: 127,
    step: 1,
    automatable: true,
    modulatable: false,
    ccNumber: 64,
    group: 'pedals',
  } as FloatParameter,
};

/**
 * Mallet card metadata
 */
export const MALLET_CARD_META: CardMeta = {
  id: 'mallet',
  name: 'Mallet Instruments',
  category: 'generators',
  description: 'Vibraphone, marimba, xylophone, and other mallet percussion with motor vibrato and authentic resonance',
  version: '1.0.0',
  author: 'CardPlay',
  tags: ['instrument', 'mallet', 'vibraphone', 'marimba', 'percussion'],
};

/**
 * Mallet card visuals
 */
export const MALLET_CARD_VISUALS: CardVisuals = {
  emoji: '🎼',
  emojiSecondary: '🥁',
  color: '#16a085',
  colorSecondary: '#1abc9c',
  gradient: 'linear',
  gradientAngle: 135,
  glow: '#f39c12',
  glowIntensity: 0.6,
  frame: CARD_FRAMES.standard,
};

/**
 * Mallet card behavior
 */
export const MALLET_CARD_BEHAVIOR: CardBehavior = createInstrumentBehavior(30);

/**
 * Mallet card UI configuration
 */
const MALLET_MAIN_PANEL: CardPanel = {
  id: 'main',
  label: 'Mallet',
  position: 'main',
  controls: [],
  layout: { type: 'grid', columns: 4, gap: '8px' },
  collapsible: false,
  defaultCollapsed: false,
};

const MALLET_ADVANCED_PANEL: CardPanel = {
  id: 'advanced',
  label: 'Advanced',
  position: 'sidebar',
  controls: [],
  layout: { type: 'grid', columns: 2, gap: '8px' },
  collapsible: true,
  defaultCollapsed: true,
};

export const MALLET_UI_CONFIG: CardUIConfig = {
  panels: [MALLET_MAIN_PANEL, MALLET_ADVANCED_PANEL],
  editorType: 'knobs',
  defaultView: 'standard',
  resizable: true,
  minWidth: 300,
  minHeight: 400,
  maxWidth: 800,
  maxHeight: 800,
  theme: DEFAULT_DARK_THEME,
};

/**
 * Mallet presets
 */
export const MALLET_PRESETS: ReadonlyArray<Preset> = [
  createPreset({
    id: 'mallet-vibes-classic',
    name: 'Vibes Classic',
    category: 'vibraphone',
    author: 'CardPlay',
    tags: ['vibraphone', 'jazz', 'smooth'],
    params: {
      type: 'vibraphone',
      velocityLayers: 6,
      malletHardness: 0.4,
      motorVibrato: true,
      motorRate: 6,
      motorDepth: 0.3,
      damperBehavior: 'realistic',
      resonance: 0.8,
      rollMode: false,
      rollSpeed: 8,
      detune: 0,
      mechanicalNoise: 0.2,
      stereoWidth: 0.8,
      tone: 0,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'mallet-vibes-no-motor',
    name: 'Vibes No Motor',
    category: 'vibraphone',
    author: 'CardPlay',
    tags: ['vibraphone', 'clean', 'modern'],
    params: {
      type: 'vibraphone',
      velocityLayers: 6,
      malletHardness: 0.5,
      motorVibrato: false,
      motorRate: 0,
      motorDepth: 0,
      damperBehavior: 'realistic',
      resonance: 0.7,
      rollMode: false,
      rollSpeed: 8,
      detune: 0,
      mechanicalNoise: 0.2,
      stereoWidth: 0.7,
      tone: 0.1,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'mallet-marimba-soft',
    name: 'Marimba Soft',
    category: 'marimba',
    author: 'CardPlay',
    tags: ['marimba', 'soft', 'warm'],
    params: {
      type: 'marimba',
      velocityLayers: 5,
      malletHardness: 0.2,
      motorVibrato: false,
      motorRate: 0,
      motorDepth: 0,
      damperBehavior: 'instant',
      resonance: 0.6,
      rollMode: false,
      rollSpeed: 10,
      detune: 0,
      mechanicalNoise: 0.1,
      stereoWidth: 0.9,
      tone: -0.2,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'mallet-marimba-concert',
    name: 'Marimba Concert',
    category: 'marimba',
    author: 'CardPlay',
    tags: ['marimba', 'concert', 'bright'],
    params: {
      type: 'marimba',
      velocityLayers: 6,
      malletHardness: 0.5,
      motorVibrato: false,
      motorRate: 0,
      motorDepth: 0,
      damperBehavior: 'instant',
      resonance: 0.7,
      rollMode: false,
      rollSpeed: 12,
      detune: 0,
      mechanicalNoise: 0.2,
      stereoWidth: 0.85,
      tone: 0,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'mallet-xylophone',
    name: 'Xylophone',
    category: 'xylophone',
    author: 'CardPlay',
    tags: ['xylophone', 'bright', 'percussive'],
    params: {
      type: 'xylophone',
      velocityLayers: 4,
      malletHardness: 0.7,
      motorVibrato: false,
      motorRate: 0,
      motorDepth: 0,
      damperBehavior: 'instant',
      resonance: 0.4,
      rollMode: false,
      rollSpeed: 15,
      detune: 0,
      mechanicalNoise: 0.3,
      stereoWidth: 0.8,
      tone: 0.5,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'mallet-glockenspiel',
    name: 'Glockenspiel',
    category: 'glockenspiel',
    author: 'CardPlay',
    tags: ['glockenspiel', 'bell', 'sparkle'],
    params: {
      type: 'glockenspiel',
      velocityLayers: 3,
      malletHardness: 0.8,
      motorVibrato: false,
      motorRate: 0,
      motorDepth: 0,
      damperBehavior: 'gradual',
      resonance: 0.9,
      rollMode: false,
      rollSpeed: 18,
      detune: 0,
      mechanicalNoise: 0.1,
      stereoWidth: 0.6,
      tone: 0.8,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'mallet-kalimba',
    name: 'Kalimba',
    category: 'kalimba',
    author: 'CardPlay',
    tags: ['kalimba', 'thumb-piano', 'ethnic'],
    params: {
      type: 'kalimba',
      velocityLayers: 3,
      malletHardness: 0.6,
      motorVibrato: false,
      motorRate: 0,
      motorDepth: 0,
      damperBehavior: 'gradual',
      resonance: 0.85,
      rollMode: false,
      rollSpeed: 10,
      detune: 5,
      mechanicalNoise: 0.4,
      stereoWidth: 0.5,
      tone: 0.2,
    },
    isFactory: true,
  }),
  createPreset({
    id: 'mallet-steelpan',
    name: 'Steelpan',
    category: 'steelpan',
    author: 'CardPlay',
    tags: ['steelpan', 'caribbean', 'tropical'],
    params: {
      type: 'steelpan',
      velocityLayers: 4,
      malletHardness: 0.5,
      motorVibrato: false,
      motorRate: 0,
      motorDepth: 0,
      damperBehavior: 'gradual',
      resonance: 0.75,
      rollMode: false,
      rollSpeed: 14,
      detune: 2,
      mechanicalNoise: 0.3,
      stereoWidth: 0.7,
      tone: 0.3,
    },
    isFactory: true,
  }),
];

/**
 * Creates a Mallet card.
 */
export function createMalletCard(): Card<never, { midi: number[] }> {
  const initialState: MalletState = {
    type: 'vibraphone',
    velocityLayers: 4,
    malletHardness: 0.5,
    motorVibrato: false,
    motorRate: 6,
    motorDepth: 0.3,
    damperBehavior: 'realistic',
    resonance: 0.7,
    rollMode: false,
    rollSpeed: 8,
    detune: 0,
    mechanicalNoise: 0.3,
    stereoWidth: 0.8,
    tone: 0,
    sustainPedal: 0,
  };

  const cardState = { ...initialState };

  const signature: CardSignature = {
    inputs: [],
    outputs: [{ name: 'midi', type: 'midi' }],
    params: Object.values(MALLET_PARAMETERS) as unknown as readonly CardParam[],
  };

  return {
    meta: MALLET_CARD_META,
    signature,
    process: (_input: never, _context: CardContext, _state?: CardState<unknown>): CardResult<{ midi: number[] }> => {
      // For now, pass through MIDI (actual synthesis happens in audio engine)
      void cardState;
      return { output: { midi: [] } };
    },
  };
}
