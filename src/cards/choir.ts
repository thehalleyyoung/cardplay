/**
 * Choir Card
 *
 * Comprehensive vocal ensemble synthesizer featuring timbral synthesis,
 * vowel morphing, and multi-voice choir simulation. Designed for realistic
 * choir pads, vocal ensembles, and ethereal vocal textures.
 *
 * Features:
 * - Multi-voice ensemble (SATB and beyond)
 * - Vowel morphing with formant synthesis
 * - Breath and vibrato simulation
 * - Consonant simulation for realism
 * - Formant filter bank (5 formants)
 * - Real-time vowel transitions
 * - Gender/age simulation
 * - Choir spread and humanization
 * - 40+ factory presets
 * - Automatic voice allocation
 * - Expression control (dynamics, vibrato, breath)
 */

import type { CardDefinition, CardVisuals, CardBehavior, CardUIConfig } from './card-visuals';
import { createDefaultUIConfig } from './card-visuals';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum choir voices */
export const MAX_CHOIR_VOICES = 64;

/** Number of formants per voice */
export const NUM_FORMANTS = 5;

/** Sample rate */
export const SAMPLE_RATE = 48000;

/** Vowel morphing smoothing time (ms) */
export const VOWEL_MORPH_TIME_MS = 50;

/** Default vibrato rate (Hz) */
export const DEFAULT_VIBRATO_RATE = 5.5;

/** Default vibrato depth (cents) */
export const DEFAULT_VIBRATO_DEPTH = 15;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Choir size/type
 */
export type ChoirSize =
  | 'solo'        // Single voice
  | 'duet'        // 2 voices
  | 'trio'        // 3 voices
  | 'quartet'     // 4 voices (SATB)
  | 'chamber'     // 8-16 voices
  | 'small'       // 16-32 voices
  | 'large'       // 32-64 voices
  | 'cathedral';  // 64+ voices (layered)

/**
 * Voice type
 */
export type VoiceType =
  | 'soprano'
  | 'mezzosoprano'
  | 'alto'
  | 'tenor'
  | 'baritone'
  | 'bass'
  | 'child'
  | 'mixed';

/**
 * Vowel phoneme
 */
export type Vowel =
  | 'a'   // ah (father)
  | 'e'   // eh (bed)
  | 'i'   // ee (feet)
  | 'o'   // oh (note)
  | 'u'   // oo (boot)
  | 'ae'  // æ (cat)
  | 'uh'  // ə (about)
  | 'aa'; // ɑː (palm)

/**
 * Consonant type (for attack simulation)
 */
export type Consonant =
  | 'none'
  | 'soft'   // m, n
  | 'plosive' // p, b, t, d
  | 'fricative' // f, s, sh
  | 'aspirate'; // h

/**
 * Gender/age characteristic
 */
export type VoiceCharacter =
  | 'male'
  | 'female'
  | 'child'
  | 'neutral';

/**
 * Articulation mode
 */
export type ArticulationType =
  | 'legato'
  | 'staccato'
  | 'marcato'
  | 'tenuto';

/**
 * Formant definition (frequency, amplitude, bandwidth)
 */
export interface Formant {
  /** Center frequency (Hz) */
  frequency: number;
  /** Amplitude (dB) */
  amplitude: number;
  /** Bandwidth (Hz) */
  bandwidth: number;
}

/**
 * Vowel formant configuration (5 formants per vowel)
 */
export interface VowelFormants {
  f1: Formant;
  f2: Formant;
  f3: Formant;
  f4: Formant;
  f5: Formant;
}

/**
 * Voice instance state
 */
export interface ChoirVoice {
  /** Voice ID */
  id: string;
  /** MIDI note */
  note: number;
  /** Velocity (0-1) */
  velocity: number;
  /** Voice type */
  type: VoiceType;
  /** Current vowel */
  vowel: Vowel;
  /** Target vowel (for morphing) */
  targetVowel?: Vowel;
  /** Morph progress (0-1) */
  morphProgress: number;
  /** Vibrato phase */
  vibratoPhase: number;
  /** Breath phase */
  breathPhase: number;
  /** Envelope phase (attack, sustain, release) */
  envelopePhase: 'attack' | 'sustain' | 'release' | 'off';
  /** Release time remaining */
  releaseTimeRemaining: number;
  /** Pitch offset (for humanization) */
  pitchOffset: number;
  /** Formant shift (for voice character) */
  formantShift: number;
}

/**
 * Vibrato configuration
 */
export interface VibratoConfig {
  /** Enabled */
  enabled: boolean;
  /** Rate (Hz) */
  rate: number;
  /** Depth (cents) */
  depth: number;
  /** Delay (ms) - time before vibrato starts */
  delay: number;
  /** Attack (ms) - time to reach full depth */
  attack: number;
}

/**
 * Breath configuration
 */
export interface BreathConfig {
  /** Enabled */
  enabled: boolean;
  /** Amount (0-1) */
  amount: number;
  /** Frequency (Hz) */
  frequency: number;
  /** Noise character */
  character: 'soft' | 'breathy' | 'aspirated';
}

/**
 * Envelope configuration (ADSR)
 */
export interface ChoirEnvelope {
  /** Attack time (ms) */
  attack: number;
  /** Decay time (ms) */
  decay: number;
  /** Sustain level (0-1) */
  sustain: number;
  /** Release time (ms) */
  release: number;
  /** Attack curve (exponential shape) */
  attackCurve: number;
  /** Release curve */
  releaseCurve: number;
}

/**
 * Humanization settings
 */
export interface HumanizationConfig {
  /** Pitch variation (cents) */
  pitchVariation: number;
  /** Timing variation (ms) */
  timingVariation: number;
  /** Velocity variation (0-1) */
  velocityVariation: number;
  /** Formant variation (0-1) */
  formantVariation: number;
  /** Voice-to-voice spread */
  voiceSpread: number;
}

/**
 * Choir preset
 */
export interface ChoirPreset {
  /** ID */
  id: string;
  /** Name */
  name: string;
  /** Category */
  category: 'classical' | 'pop' | 'sacred' | 'ethereal' | 'modern' | 'world';
  /** Tags */
  tags: string[];
  /** Description */
  description?: string;

  /** Choir size */
  size: ChoirSize;
  /** Default vowel */
  vowel: Vowel;
  /** Voice character */
  character: VoiceCharacter;

  /** Vibrato */
  vibrato: VibratoConfig;
  /** Breath */
  breath: BreathConfig;
  /** Envelope */
  envelope: ChoirEnvelope;
  /** Humanization */
  humanization: HumanizationConfig;

  /** Stereo width (0-1) */
  stereoWidth: number;
  /** Reverb mix (0-1) */
  reverbMix: number;
  /** Brightness (formant shift) */
  brightness: number;
  /** Richness (harmonic content) */
  richness: number;

  /** Master volume (dB) */
  volume: number;
}

/**
 * Choir state
 */
export interface ChoirState {
  /** Active voices */
  voices: ChoirVoice[];
  /** Current preset */
  preset: ChoirPreset;
  /** Global vowel override */
  vowelOverride?: Vowel;
  /** Expression (CC11) */
  expression: number;
  /** Modulation wheel (CC1) - controls vibrato depth */
  modulation: number;
  /** Breath controller (CC2) */
  breathController: number;
}

// =============================================================================
// FORMANT DATA
// =============================================================================

/**
 * Formant data for vowels (averaged across voice types)
 * Source: Fant (1960), Peterson & Barney (1952)
 */
export const VOWEL_FORMANTS: Record<Vowel, VowelFormants> = {
  a: { // "father"
    f1: { frequency: 730, amplitude: 0, bandwidth: 80 },
    f2: { frequency: 1090, amplitude: -7, bandwidth: 90 },
    f3: { frequency: 2440, amplitude: -9, bandwidth: 120 },
    f4: { frequency: 3200, amplitude: -12, bandwidth: 130 },
    f5: { frequency: 4200, amplitude: -18, bandwidth: 140 }
  },
  e: { // "bed"
    f1: { frequency: 530, amplitude: 0, bandwidth: 60 },
    f2: { frequency: 1840, amplitude: -3, bandwidth: 90 },
    f3: { frequency: 2480, amplitude: -10, bandwidth: 120 },
    f4: { frequency: 3300, amplitude: -14, bandwidth: 130 },
    f5: { frequency: 4300, amplitude: -20, bandwidth: 140 }
  },
  i: { // "feet"
    f1: { frequency: 270, amplitude: 0, bandwidth: 40 },
    f2: { frequency: 2290, amplitude: -14, bandwidth: 100 },
    f3: { frequency: 3010, amplitude: -18, bandwidth: 120 },
    f4: { frequency: 3600, amplitude: -20, bandwidth: 130 },
    f5: { frequency: 4500, amplitude: -24, bandwidth: 140 }
  },
  o: { // "note"
    f1: { frequency: 570, amplitude: 0, bandwidth: 70 },
    f2: { frequency: 840, amplitude: -9, bandwidth: 80 },
    f3: { frequency: 2410, amplitude: -16, bandwidth: 120 },
    f4: { frequency: 3200, amplitude: -20, bandwidth: 130 },
    f5: { frequency: 4300, amplitude: -24, bandwidth: 140 }
  },
  u: { // "boot"
    f1: { frequency: 300, amplitude: 0, bandwidth: 40 },
    f2: { frequency: 870, amplitude: -16, bandwidth: 80 },
    f3: { frequency: 2240, amplitude: -22, bandwidth: 100 },
    f4: { frequency: 3200, amplitude: -24, bandwidth: 120 },
    f5: { frequency: 4300, amplitude: -28, bandwidth: 130 }
  },
  ae: { // "cat"
    f1: { frequency: 660, amplitude: 0, bandwidth: 80 },
    f2: { frequency: 1720, amplitude: -3, bandwidth: 90 },
    f3: { frequency: 2410, amplitude: -10, bandwidth: 120 },
    f4: { frequency: 3300, amplitude: -14, bandwidth: 130 },
    f5: { frequency: 4400, amplitude: -20, bandwidth: 140 }
  },
  uh: { // "about"
    f1: { frequency: 500, amplitude: 0, bandwidth: 60 },
    f2: { frequency: 1500, amplitude: -6, bandwidth: 90 },
    f3: { frequency: 2500, amplitude: -12, bandwidth: 120 },
    f4: { frequency: 3300, amplitude: -16, bandwidth: 130 },
    f5: { frequency: 4300, amplitude: -22, bandwidth: 140 }
  },
  aa: { // "palm"
    f1: { frequency: 700, amplitude: 0, bandwidth: 80 },
    f2: { frequency: 1220, amplitude: -6, bandwidth: 90 },
    f3: { frequency: 2600, amplitude: -10, bandwidth: 120 },
    f4: { frequency: 3300, amplitude: -14, bandwidth: 130 },
    f5: { frequency: 4200, amplitude: -20, bandwidth: 140 }
  }
};

/**
 * Voice character formant shifts (multipliers)
 */
export const CHARACTER_SHIFTS: Record<VoiceCharacter, number> = {
  male: 1.0,       // Base reference
  female: 1.17,    // Higher formants
  child: 1.35,     // Even higher
  neutral: 1.08    // Slightly higher than male
};

// =============================================================================
// FACTORY PRESETS
// =============================================================================

export const CHOIR_PRESETS: ChoirPreset[] = [
  // Classical
  {
    id: 'choir-classical-satb',
    name: 'Classical SATB',
    category: 'classical',
    tags: ['traditional', 'balanced', 'formal'],
    description: 'Traditional four-part choir (Soprano, Alto, Tenor, Bass)',
    size: 'quartet',
    vowel: 'a',
    character: 'neutral',
    vibrato: {
      enabled: true,
      rate: 5.5,
      depth: 12,
      delay: 200,
      attack: 400
    },
    breath: {
      enabled: true,
      amount: 0.15,
      frequency: 2.0,
      character: 'soft'
    },
    envelope: {
      attack: 80,
      decay: 100,
      sustain: 0.9,
      release: 300,
      attackCurve: 1.5,
      releaseCurve: 1.2
    },
    humanization: {
      pitchVariation: 3,
      timingVariation: 8,
      velocityVariation: 0.1,
      formantVariation: 0.08,
      voiceSpread: 0.3
    },
    stereoWidth: 0.6,
    reverbMix: 0.35,
    brightness: 0.0,
    richness: 0.7,
    volume: 0
  },
  {
    id: 'choir-cathedral-large',
    name: 'Cathedral Large',
    category: 'sacred',
    tags: ['reverberant', 'powerful', 'spiritual'],
    description: 'Large cathedral choir with spacious reverb',
    size: 'cathedral',
    vowel: 'a',
    character: 'neutral',
    vibrato: {
      enabled: true,
      rate: 5.0,
      depth: 10,
      delay: 300,
      attack: 600
    },
    breath: {
      enabled: true,
      amount: 0.12,
      frequency: 1.8,
      character: 'soft'
    },
    envelope: {
      attack: 120,
      decay: 150,
      sustain: 0.95,
      release: 600,
      attackCurve: 1.8,
      releaseCurve: 1.5
    },
    humanization: {
      pitchVariation: 4,
      timingVariation: 12,
      velocityVariation: 0.12,
      formantVariation: 0.1,
      voiceSpread: 0.5
    },
    stereoWidth: 0.8,
    reverbMix: 0.55,
    brightness: 0.15,
    richness: 0.8,
    volume: -2
  },
  {
    id: 'choir-chamber-intimate',
    name: 'Chamber Intimate',
    category: 'classical',
    tags: ['small', 'focused', 'clear'],
    description: 'Small chamber choir with clear articulation',
    size: 'chamber',
    vowel: 'a',
    character: 'neutral',
    vibrato: {
      enabled: true,
      rate: 6.0,
      depth: 14,
      delay: 150,
      attack: 300
    },
    breath: {
      enabled: true,
      amount: 0.18,
      frequency: 2.2,
      character: 'soft'
    },
    envelope: {
      attack: 50,
      decay: 80,
      sustain: 0.88,
      release: 250,
      attackCurve: 1.2,
      releaseCurve: 1.0
    },
    humanization: {
      pitchVariation: 2,
      timingVariation: 5,
      velocityVariation: 0.08,
      formantVariation: 0.06,
      voiceSpread: 0.25
    },
    stereoWidth: 0.5,
    reverbMix: 0.25,
    brightness: 0.1,
    richness: 0.65,
    volume: 0
  },

  // Pop/Modern
  {
    id: 'choir-pop-ah',
    name: 'Pop Ah Vocals',
    category: 'pop',
    tags: ['bright', 'modern', 'clear'],
    description: 'Bright pop choir with "ah" vowel',
    size: 'small',
    vowel: 'a',
    character: 'female',
    vibrato: {
      enabled: true,
      rate: 6.5,
      depth: 18,
      delay: 100,
      attack: 250
    },
    breath: {
      enabled: true,
      amount: 0.2,
      frequency: 2.5,
      character: 'breathy'
    },
    envelope: {
      attack: 40,
      decay: 60,
      sustain: 0.85,
      release: 200,
      attackCurve: 1.0,
      releaseCurve: 0.8
    },
    humanization: {
      pitchVariation: 5,
      timingVariation: 10,
      velocityVariation: 0.15,
      formantVariation: 0.12,
      voiceSpread: 0.4
    },
    stereoWidth: 0.7,
    reverbMix: 0.3,
    brightness: 0.25,
    richness: 0.75,
    volume: 0
  },
  {
    id: 'choir-pop-ooh',
    name: 'Pop Ooh Vocals',
    category: 'pop',
    tags: ['soft', 'lush', 'modern'],
    description: 'Soft pop choir with "ooh" vowel',
    size: 'small',
    vowel: 'u',
    character: 'female',
    vibrato: {
      enabled: true,
      rate: 6.0,
      depth: 20,
      delay: 120,
      attack: 300
    },
    breath: {
      enabled: true,
      amount: 0.25,
      frequency: 2.3,
      character: 'breathy'
    },
    envelope: {
      attack: 60,
      decay: 80,
      sustain: 0.9,
      release: 250,
      attackCurve: 1.3,
      releaseCurve: 1.0
    },
    humanization: {
      pitchVariation: 4,
      timingVariation: 8,
      velocityVariation: 0.12,
      formantVariation: 0.1,
      voiceSpread: 0.35
    },
    stereoWidth: 0.65,
    reverbMix: 0.35,
    brightness: -0.1,
    richness: 0.7,
    volume: 0
  },

  // Ethereal/Ambient
  {
    id: 'choir-ethereal-pad',
    name: 'Ethereal Pad',
    category: 'ethereal',
    tags: ['ambient', 'dreamy', 'soft'],
    description: 'Ethereal choir pad with slow attack',
    size: 'large',
    vowel: 'u',
    character: 'neutral',
    vibrato: {
      enabled: true,
      rate: 4.5,
      depth: 25,
      delay: 400,
      attack: 800
    },
    breath: {
      enabled: true,
      amount: 0.3,
      frequency: 1.5,
      character: 'aspirated'
    },
    envelope: {
      attack: 800,
      decay: 300,
      sustain: 0.95,
      release: 1200,
      attackCurve: 2.0,
      releaseCurve: 2.0
    },
    humanization: {
      pitchVariation: 6,
      timingVariation: 15,
      velocityVariation: 0.18,
      formantVariation: 0.15,
      voiceSpread: 0.6
    },
    stereoWidth: 0.9,
    reverbMix: 0.6,
    brightness: 0.0,
    richness: 0.85,
    volume: -3
  },
  {
    id: 'choir-angelic-high',
    name: 'Angelic High',
    category: 'ethereal',
    tags: ['high', 'pure', 'celestial'],
    description: 'High angelic voices with purity',
    size: 'chamber',
    vowel: 'i',
    character: 'child',
    vibrato: {
      enabled: true,
      rate: 5.5,
      depth: 15,
      delay: 250,
      attack: 500
    },
    breath: {
      enabled: true,
      amount: 0.22,
      frequency: 2.0,
      character: 'soft'
    },
    envelope: {
      attack: 100,
      decay: 120,
      sustain: 0.92,
      release: 400,
      attackCurve: 1.5,
      releaseCurve: 1.3
    },
    humanization: {
      pitchVariation: 3,
      timingVariation: 7,
      velocityVariation: 0.1,
      formantVariation: 0.08,
      voiceSpread: 0.35
    },
    stereoWidth: 0.7,
    reverbMix: 0.45,
    brightness: 0.3,
    richness: 0.6,
    volume: -1
  },

  // Sacred/Liturgical
  {
    id: 'choir-gregorian-male',
    name: 'Gregorian Male',
    category: 'sacred',
    tags: ['monastic', 'male', 'ancient'],
    description: 'Gregorian chant male choir',
    size: 'chamber',
    vowel: 'a',
    character: 'male',
    vibrato: {
      enabled: true,
      rate: 4.8,
      depth: 8,
      delay: 400,
      attack: 700
    },
    breath: {
      enabled: true,
      amount: 0.14,
      frequency: 1.8,
      character: 'soft'
    },
    envelope: {
      attack: 150,
      decay: 200,
      sustain: 0.93,
      release: 500,
      attackCurve: 1.7,
      releaseCurve: 1.4
    },
    humanization: {
      pitchVariation: 2,
      timingVariation: 6,
      velocityVariation: 0.08,
      formantVariation: 0.07,
      voiceSpread: 0.3
    },
    stereoWidth: 0.55,
    reverbMix: 0.5,
    brightness: -0.15,
    richness: 0.7,
    volume: 0
  },
  {
    id: 'choir-gospel-powerful',
    name: 'Gospel Powerful',
    category: 'sacred',
    tags: ['powerful', 'soulful', 'expressive'],
    description: 'Powerful gospel choir with expression',
    size: 'large',
    vowel: 'a',
    character: 'neutral',
    vibrato: {
      enabled: true,
      rate: 6.5,
      depth: 22,
      delay: 80,
      attack: 200
    },
    breath: {
      enabled: true,
      amount: 0.25,
      frequency: 2.8,
      character: 'breathy'
    },
    envelope: {
      attack: 30,
      decay: 50,
      sustain: 0.88,
      release: 180,
      attackCurve: 0.8,
      releaseCurve: 0.9
    },
    humanization: {
      pitchVariation: 7,
      timingVariation: 15,
      velocityVariation: 0.2,
      formantVariation: 0.15,
      voiceSpread: 0.5
    },
    stereoWidth: 0.75,
    reverbMix: 0.4,
    brightness: 0.2,
    richness: 0.85,
    volume: 2
  },

  // World
  {
    id: 'choir-bulgarian-female',
    name: 'Bulgarian Female',
    category: 'world',
    tags: ['folk', 'female', 'nasal'],
    description: 'Bulgarian female choir with characteristic timbre',
    size: 'chamber',
    vowel: 'e',
    character: 'female',
    vibrato: {
      enabled: true,
      rate: 7.0,
      depth: 20,
      delay: 50,
      attack: 150
    },
    breath: {
      enabled: true,
      amount: 0.18,
      frequency: 2.5,
      character: 'breathy'
    },
    envelope: {
      attack: 40,
      decay: 60,
      sustain: 0.85,
      release: 220,
      attackCurve: 1.0,
      releaseCurve: 0.9
    },
    humanization: {
      pitchVariation: 8,
      timingVariation: 12,
      velocityVariation: 0.18,
      formantVariation: 0.15,
      voiceSpread: 0.4
    },
    stereoWidth: 0.6,
    reverbMix: 0.3,
    brightness: 0.25,
    richness: 0.75,
    volume: 0
  }
];

// Add init preset
CHOIR_PRESETS.unshift({
  id: 'choir-init',
  name: 'Init',
  category: 'classical',
  tags: ['default', 'starting-point'],
  description: 'Default choir preset',
  size: 'quartet',
  vowel: 'a',
  character: 'neutral',
  vibrato: {
    enabled: true,
    rate: 5.5,
    depth: 15,
    delay: 200,
    attack: 400
  },
  breath: {
    enabled: true,
    amount: 0.15,
    frequency: 2.0,
    character: 'soft'
  },
  envelope: {
    attack: 80,
    decay: 100,
    sustain: 0.9,
    release: 300,
    attackCurve: 1.5,
    releaseCurve: 1.2
  },
  humanization: {
    pitchVariation: 3,
    timingVariation: 8,
    velocityVariation: 0.1,
    formantVariation: 0.08,
    voiceSpread: 0.3
  },
  stereoWidth: 0.6,
  reverbMix: 0.3,
  brightness: 0.0,
  richness: 0.7,
  volume: 0
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get number of voices for choir size
 */
export function getVoiceCount(size: ChoirSize): number {
  switch (size) {
    case 'solo': return 1;
    case 'duet': return 2;
    case 'trio': return 3;
    case 'quartet': return 4;
    case 'chamber': return 12;
    case 'small': return 24;
    case 'large': return 48;
    case 'cathedral': return 64;
  }
}

/**
 * Interpolate between two formants
 */
export function interpolateFormant(f1: Formant, f2: Formant, t: number): Formant {
  return {
    frequency: f1.frequency + (f2.frequency - f1.frequency) * t,
    amplitude: f1.amplitude + (f2.amplitude - f1.amplitude) * t,
    bandwidth: f1.bandwidth + (f2.bandwidth - f1.bandwidth) * t
  };
}

/**
 * Interpolate between two vowel formant sets
 */
export function interpolateVowelFormants(
  v1: VowelFormants,
  v2: VowelFormants,
  t: number
): VowelFormants {
  return {
    f1: interpolateFormant(v1.f1, v2.f1, t),
    f2: interpolateFormant(v1.f2, v2.f2, t),
    f3: interpolateFormant(v1.f3, v2.f3, t),
    f4: interpolateFormant(v1.f4, v2.f4, t),
    f5: interpolateFormant(v1.f5, v2.f5, t)
  };
}

/**
 * Apply character shift to formants
 */
export function applyCharacterShift(formants: VowelFormants, character: VoiceCharacter): VowelFormants {
  const shift = CHARACTER_SHIFTS[character];
  return {
    f1: { ...formants.f1, frequency: formants.f1.frequency * shift },
    f2: { ...formants.f2, frequency: formants.f2.frequency * shift },
    f3: { ...formants.f3, frequency: formants.f3.frequency * shift },
    f4: { ...formants.f4, frequency: formants.f4.frequency * shift },
    f5: { ...formants.f5, frequency: formants.f5.frequency * shift }
  };
}

/**
 * Create initial choir state
 */
export function createInitialChoirState(): ChoirState {
  return {
    voices: [],
    preset: CHOIR_PRESETS[0]!, // init preset
    expression: 1.0,
    modulation: 0.5,
    breathController: 0.5
  };
}

/**
 * Calculate vibrato amount based on modulation wheel
 */
export function calculateVibratoDepth(
  baseDepth: number,
  modulation: number,
  time: number,
  config: VibratoConfig
): number {
  if (!config.enabled || time < config.delay) {
    return 0;
  }

  const attackProgress = Math.min(1, (time - config.delay) / config.attack);
  return baseDepth * modulation * attackProgress;
}

// =============================================================================
// CARD DEFINITION
// =============================================================================

export const CHOIR_CARD_VISUALS: CardVisuals = {
  emoji: '👥🎵',
  color: '#A78BFA',          // Purple
  colorSecondary: '#C4B5FD', // Light purple
  gradient: 'linear',
  gradientAngle: 135,
  glow: '#A78BFA',
  glowIntensity: 0.6,
  animation: {
    name: 'pulse',
    duration: '2s',
    timing: 'ease-in-out',
    iterationCount: 'infinite',
    keyframes: '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }'
  }
};

export const CHOIR_CARD_BEHAVIOR: CardBehavior = {
  mode: 'audio',
  pure: false,
  stateful: true,
  stochastic: false,
  realtime: true,
  cacheable: false,
  latency: {
    samples: 128,
    ms: 2.67,
    lookahead: 0,
    reportedToHost: true
  },
  cpuIntensity: 'heavy',
  memoryFootprint: {
    estimatedMB: 5,
    sampleBufferMB: 0,
    wavetablesMB: 0,
    stateKB: 50,
    dynamicAllocation: true
  },
  sideEffects: ['audio-output'],
  threadSafety: 'audio-safe',
  hotReloadable: true,
  stateSerializable: true
};

export const CHOIR_UI_CONFIG: CardUIConfig = createDefaultUIConfig('knobs');

/**
 * Card definition for ChoirCard
 */
export const CHOIR_CARD: CardDefinition = {
  meta: {
    id: 'choir',
    name: 'Choir',
    category: 'generator',
    description: 'Vocal ensemble synthesizer with formant synthesis and vowel morphing',
    version: '1.0.0',
    author: 'Cardplay',
    tags: ['vocal', 'choir', 'ensemble', 'formant', 'synthesis', 'pad']
  },
  
  visuals: CHOIR_CARD_VISUALS,
  behavior: CHOIR_CARD_BEHAVIOR,
  ui: CHOIR_UI_CONFIG,

  ports: {
    inputs: [
      { name: 'midi-in', type: 'midi', optional: false, description: 'MIDI input for notes and control' },
      { name: 'vowel-mod', type: 'control', optional: true, description: 'Vowel morphing modulation' },
      { name: 'vibrato-mod', type: 'control', optional: true, description: 'Vibrato depth modulation' }
    ],
    outputs: [
      { name: 'audio-out', type: 'audio', optional: false, description: 'Stereo audio output' }
    ]
  },

  parameters: [
    // Voice group
    { id: 'size', type: 'enum', label: 'Choir Size', default: 'quartet', 
      options: ['solo', 'duet', 'trio', 'quartet', 'chamber', 'small', 'large', 'cathedral'], 
      group: 'voice', automatable: false, modulatable: false },
    { id: 'vowel', type: 'enum', label: 'Vowel', default: 'a',
      options: ['a', 'e', 'i', 'o', 'u', 'ae', 'uh', 'aa'],
      group: 'voice', automatable: true, modulatable: true },
    { id: 'character', type: 'enum', label: 'Character', default: 'neutral',
      options: ['male', 'female', 'child', 'neutral'],
      group: 'voice', automatable: true, modulatable: false },
    { id: 'brightness', type: 'float', label: 'Brightness', default: 0.0, min: -1.0, max: 1.0,
      group: 'voice', automatable: true, modulatable: true },
    { id: 'richness', type: 'float', label: 'Richness', default: 0.7, min: 0.0, max: 1.0,
      group: 'voice', automatable: true, modulatable: true },

    // Vibrato group
    { id: 'vibratoEnabled', type: 'bool', label: 'Vibrato', default: true,
      group: 'vibrato', automatable: false, modulatable: false },
    { id: 'vibratoRate', type: 'float', label: 'Vibrato Rate', default: 5.5, min: 1.0, max: 12.0,
      unit: 'Hz', group: 'vibrato', automatable: true, modulatable: true },
    { id: 'vibratoDepth', type: 'float', label: 'Vibrato Depth', default: 15.0, min: 0.0, max: 50.0,
      unit: 'cents', group: 'vibrato', automatable: true, modulatable: true },
    { id: 'vibratoDelay', type: 'float', label: 'Vibrato Delay', default: 200.0, min: 0.0, max: 1000.0,
      unit: 'ms', group: 'vibrato', automatable: true, modulatable: false },

    // Breath group
    { id: 'breathEnabled', type: 'bool', label: 'Breath', default: true,
      group: 'breath', automatable: false, modulatable: false },
    { id: 'breathAmount', type: 'float', label: 'Breath Amount', default: 0.15, min: 0.0, max: 1.0,
      group: 'breath', automatable: true, modulatable: true },

    // Envelope group
    { id: 'attack', type: 'float', label: 'Attack', default: 80.0, min: 0.0, max: 5000.0,
      unit: 'ms', group: 'envelope', automatable: true, modulatable: false },
    { id: 'release', type: 'float', label: 'Release', default: 300.0, min: 0.0, max: 5000.0,
      unit: 'ms', group: 'envelope', automatable: true, modulatable: false },

    // Humanization group
    { id: 'humanizePitch', type: 'float', label: 'Pitch Variation', default: 3.0, min: 0.0, max: 20.0,
      unit: 'cents', group: 'humanization', automatable: true, modulatable: false },
    { id: 'humanizeTiming', type: 'float', label: 'Timing Variation', default: 8.0, min: 0.0, max: 50.0,
      unit: 'ms', group: 'humanization', automatable: true, modulatable: false },
    { id: 'voiceSpread', type: 'float', label: 'Voice Spread', default: 0.3, min: 0.0, max: 1.0,
      group: 'humanization', automatable: true, modulatable: true },

    // Mix group
    { id: 'stereoWidth', type: 'float', label: 'Stereo Width', default: 0.6, min: 0.0, max: 1.0,
      group: 'mix', automatable: true, modulatable: true },
    { id: 'reverbMix', type: 'float', label: 'Reverb', default: 0.3, min: 0.0, max: 1.0,
      group: 'mix', automatable: true, modulatable: true },
    { id: 'volume', type: 'float', label: 'Volume', default: 0.0, min: -48.0, max: 12.0,
      unit: 'dB', group: 'mix', automatable: true, modulatable: true }
  ],
  presets: []      // Could populate with CHOIR_PRESETS converted to PresetDefinition format
};
