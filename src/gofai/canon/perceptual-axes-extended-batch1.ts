/**
 * GOFAI Extended Perceptual Axes — Batch 1: Nuanced Musical Qualities
 *
 * This module extends the core perceptual axes with hundreds of nuanced
 * musical quality descriptors that musicians actually use in studio sessions.
 * Each axis includes multiple synonyms, related lexemes, and concrete levers.
 *
 * Philosophy: Musicians don't just say "brighter" — they say "glassier",
 * "airier", "more crystalline", "more shimmery", etc. Each nuance may
 * emphasize different aspects of the core axis or combine multiple axes.
 *
 * This is Step 002 continuation: making the perceptual vocabulary comprehensive
 * enough to handle real musician language with semantic precision.
 *
 * @module gofai/canon/perceptual-axes-extended-batch1
 */

import {
  type AxisId,
  type PerceptualAxis,
  type LeverMapping,
  createAxisId,
  createOpcodeId,
  createLexemeId,
} from './types.js';

// =============================================================================
// Timbral Axes — Extended Nuances
// =============================================================================

/**
 * Airiness axis — high-frequency breath and space in the timbre.
 * Related to brightness but specifically emphasizes upper-mid presence
 * and the perception of "air moving through" the sound.
 */
export const AXIS_AIRINESS: PerceptualAxis = {
  id: createAxisId('airiness'),
  name: 'Airiness',
  description:
    'The perception of high-frequency "air" and breath in the sound. ' +
    'Distinct from pure brightness — airiness emphasizes the upper-mid ' +
    'presence and the sensation of space and breath.',
  poles: ['closed', 'airy'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'airy'),
    createLexemeId('adj', 'breathy'),
    createLexemeId('adj', 'light'),
    createLexemeId('adj', 'open'),
    createLexemeId('adj', 'spacious'),
    createLexemeId('adj', 'floating'),
    createLexemeId('adj', 'ethereal'),
    createLexemeId('adj', 'wispy'),
    createLexemeId('adj', 'gossamer'),
    createLexemeId('adj', 'delicate-upper'),
  ],
  levers: [
    {
      name: 'High-mid boost',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'highMidBoost', targetFreq: 8000 },
    },
    {
      name: 'Air band EQ',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'airBand', targetFreq: 12000 },
    },
    {
      name: 'Breath noise layer',
      opcode: createOpcodeId('add_layer'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'medium',
      params: { layerType: 'noise', filter: 'highpass' },
    },
    {
      name: 'Lighter voicing',
      opcode: createOpcodeId('thin_voicing'),
      direction: 'increase',
      effectiveness: 0.5,
      cost: 'medium',
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#airiness',
};

/**
 * Warmth axis — low-frequency richness and body.
 */
export const AXIS_WARMTH: PerceptualAxis = {
  id: createAxisId('warmth'),
  name: 'Warmth',
  description:
    'The perception of low-frequency richness, body, and "warmth". ' +
    'Related to but distinct from darkness — warmth emphasizes pleasant ' +
    'low-mid fullness rather than just absence of high frequencies.',
  poles: ['cold', 'warm'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'warm'),
    createLexemeId('adj', 'rich'),
    createLexemeId('adj', 'full'),
    createLexemeId('adj', 'round'),
    createLexemeId('adj', 'velvety'),
    createLexemeId('adj', 'lush'),
    createLexemeId('adj', 'cushiony'),
    createLexemeId('adj', 'enveloping'),
    createLexemeId('adj', 'woody'),
    createLexemeId('adj', 'honeyed'),
    createLexemeId('adj', 'buttery'),
  ],
  levers: [
    {
      name: 'Low-mid boost',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'lowMidBoost', targetFreq: 200 },
    },
    {
      name: 'Saturation warmth',
      opcode: createOpcodeId('add_card'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'medium',
      requiresCapabilities: ['production'],
      params: { cardType: 'saturation', mode: 'tape' },
    },
    {
      name: 'Bass layer emphasis',
      opcode: createOpcodeId('adjust_layer_balance'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'low',
      params: { layer: 'bass', adjustment: '+3dB' },
    },
    {
      name: 'Lower register voicing',
      opcode: createOpcodeId('shift_register'),
      direction: 'decrease',
      effectiveness: 0.5,
      cost: 'medium',
      params: { direction: 'down', semitones: -7 },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#warmth',
};

/**
 * Crispness axis — transient clarity and attack sharpness.
 */
export const AXIS_CRISPNESS: PerceptualAxis = {
  id: createAxisId('crispness'),
  name: 'Crispness',
  description:
    'The sharpness and clarity of transients. Crisp sounds have clear ' +
    'attack envelopes and distinct onsets. Related to energy but specifically ' +
    'about transient definition rather than overall intensity.',
  poles: ['soft', 'crisp'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'crisp'),
    createLexemeId('adj', 'sharp'),
    createLexemeId('adj', 'snappy'),
    createLexemeId('adj', 'defined'),
    createLexemeId('adj', 'articulated'),
    createLexemeId('adj', 'punchy'),
    createLexemeId('adj', 'edgy'),
    createLexemeId('adj', 'percussive'),
    createLexemeId('adj', 'incisive'),
    createLexemeId('adj', 'clean-attack'),
  ],
  levers: [
    {
      name: 'Transient shaper',
      opcode: createOpcodeId('add_card'),
      direction: 'increase',
      effectiveness: 0.9,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { cardType: 'transient-shaper', attack: '+6dB' },
    },
    {
      name: 'Attack time reduction',
      opcode: createOpcodeId('adjust_envelope'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'medium',
      params: { stage: 'attack', adjustment: -10 },
    },
    {
      name: 'High-pass filter',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.5,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'highPassFreq', value: 40 },
    },
    {
      name: 'Staccato articulation',
      opcode: createOpcodeId('adjust_articulation'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'high',
      params: { style: 'staccato' },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#crispness',
};

/**
 * Smoothness axis — continuity and lack of roughness.
 */
export const AXIS_SMOOTHNESS: PerceptualAxis = {
  id: createAxisId('smoothness'),
  name: 'Smoothness',
  description:
    'The perception of continuity and lack of roughness. Smooth sounds ' +
    'have gentle transitions, minimal transients, and flowing legato quality.',
  poles: ['rough', 'smooth'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'smooth'),
    createLexemeId('adj', 'silky'),
    createLexemeId('adj', 'flowing'),
    createLexemeId('adj', 'seamless'),
    createLexemeId('adj', 'liquid'),
    createLexemeId('adj', 'creamy'),
    createLexemeId('adj', 'gliding'),
    createLexemeId('adj', 'legato'),
    createLexemeId('adj', 'continuous'),
    createLexemeId('adj', 'polished'),
  ],
  levers: [
    {
      name: 'Legato articulation',
      opcode: createOpcodeId('adjust_articulation'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'medium',
      params: { style: 'legato', overlap: 0.1 },
    },
    {
      name: 'Envelope softening',
      opcode: createOpcodeId('adjust_envelope'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'medium',
      params: { attack: +20, release: +30 },
    },
    {
      name: 'Low-pass filter',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'lowPassFreq', value: 8000 },
    },
    {
      name: 'Reverb tail',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.5,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'reverbDecay', value: 2.5 },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#smoothness',
};

/**
 * Grittiness axis — texture and roughness.
 */
export const AXIS_GRITTINESS: PerceptualAxis = {
  id: createAxisId('grittiness'),
  name: 'Grittiness',
  description:
    'The perception of texture, roughness, and "grain" in the sound. ' +
    'Gritty sounds have saturation, distortion, or textural complexity.',
  poles: ['clean', 'gritty'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'gritty'),
    createLexemeId('adj', 'rough'),
    createLexemeId('adj', 'distorted'),
    createLexemeId('adj', 'crunchy'),
    createLexemeId('adj', 'textured'),
    createLexemeId('adj', 'dirty'),
    createLexemeId('adj', 'fuzzy'),
    createLexemeId('adj', 'raw'),
    createLexemeId('adj', 'aggressive-timbre'),
    createLexemeId('adj', 'sandpaper'),
  ],
  levers: [
    {
      name: 'Saturation drive',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.9,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'drive', value: 0.7 },
    },
    {
      name: 'Bitcrusher',
      opcode: createOpcodeId('add_card'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'medium',
      requiresCapabilities: ['production'],
      params: { cardType: 'bitcrusher', bits: 8 },
    },
    {
      name: 'Distortion pedal',
      opcode: createOpcodeId('add_card'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'medium',
      requiresCapabilities: ['production'],
      params: { cardType: 'distortion', mode: 'fuzz' },
    },
    {
      name: 'Noise layer',
      opcode: createOpcodeId('add_layer'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'medium',
      params: { layerType: 'noise', mix: 0.2 },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#grittiness',
};

/**
 * Glassiness axis — crystalline, bell-like timbral quality.
 */
export const AXIS_GLASSINESS: PerceptualAxis = {
  id: createAxisId('glassiness'),
  name: 'Glassiness',
  description:
    'A crystalline, bell-like quality with clear high harmonics and ' +
    'a sense of fragility and delicacy. Distinct from generic brightness — ' +
    'glassiness emphasizes the specific bell/glass resonance character.',
  poles: ['dull', 'glassy'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'glassy'),
    createLexemeId('adj', 'crystalline'),
    createLexemeId('adj', 'bell-like'),
    createLexemeId('adj', 'clear'),
    createLexemeId('adj', 'chiming'),
    createLexemeId('adj', 'icy'),
    createLexemeId('adj', 'pristine'),
    createLexemeId('adj', 'transparent'),
    createLexemeId('adj', 'brittle-timbre'),
    createLexemeId('adj', 'vitreous'),
  ],
  levers: [
    {
      name: 'High-Q resonance',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'resonance', freq: 4000, q: 12 },
    },
    {
      name: 'Bell-like instrument',
      opcode: createOpcodeId('suggest_instrument'),
      direction: 'increase',
      effectiveness: 0.9,
      cost: 'high',
      params: { category: 'mallet', timbre: 'bell' },
    },
    {
      name: 'High extensions',
      opcode: createOpcodeId('add_extensions'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'medium',
      params: { extensions: ['9th', '13th'] },
    },
    {
      name: 'Upper register',
      opcode: createOpcodeId('shift_register'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'medium',
      params: { direction: 'up', semitones: 12 },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#glassiness',
};

/**
 * Metallicity axis — metallic resonance and shimmer.
 */
export const AXIS_METALLICITY: PerceptualAxis = {
  id: createAxisId('metallicity'),
  name: 'Metallicity',
  description:
    'The perception of metallic resonance, shimmer, and inharmonic ' +
    'partials characteristic of metallic percussion and synthesis.',
  poles: ['organic', 'metallic'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'metallic'),
    createLexemeId('adj', 'shimmering'),
    createLexemeId('adj', 'resonant'),
    createLexemeId('adj', 'bell-metallic'),
    createLexemeId('adj', 'gong-like'),
    createLexemeId('adj', 'cymbal-like'),
    createLexemeId('adj', 'silvery'),
    createLexemeId('adj', 'brazen'),
    createLexemeId('adj', 'ringing'),
    createLexemeId('adj', 'inharmonic'),
  ],
  levers: [
    {
      name: 'FM synthesis',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'medium',
      requiresCapabilities: ['production'],
      params: { param: 'fmRatio', value: 3.14 },
    },
    {
      name: 'Ring modulation',
      opcode: createOpcodeId('add_card'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'medium',
      requiresCapabilities: ['production'],
      params: { cardType: 'ring-mod', freq: 440 },
    },
    {
      name: 'Metallic percussion',
      opcode: createOpcodeId('suggest_instrument'),
      direction: 'increase',
      effectiveness: 0.9,
      cost: 'high',
      params: { category: 'metallic-percussion' },
    },
    {
      name: 'High resonance peaks',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'resonancePeaks', count: 5 },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#metallicity',
};

// =============================================================================
// Spatial Axes — Extended Nuances
// =============================================================================

/**
 * Width axis — stereo spread and spatial breadth.
 */
export const AXIS_WIDTH: PerceptualAxis = {
  id: createAxisId('width'),
  name: 'Width',
  description:
    'The perceived stereo width and spatial spread of the sound. ' +
    'Wide sounds occupy more of the stereo field; narrow sounds are centered.',
  poles: ['narrow', 'wide'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'wide'),
    createLexemeId('adj', 'narrow'),
    createLexemeId('adj', 'spread'),
    createLexemeId('adj', 'expansive'),
    createLexemeId('adj', 'broad'),
    createLexemeId('adj', 'panoramic'),
    createLexemeId('adj', 'enveloping-spatial'),
    createLexemeId('adj', 'immersive'),
  ],
  levers: [
    {
      name: 'Stereo width',
      opcode: createOpcodeId('set_param'),
      direction: 'bidirectional',
      effectiveness: 0.9,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'stereoWidth', value: 150 },
    },
    {
      name: 'Chorus widening',
      opcode: createOpcodeId('add_card'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'medium',
      requiresCapabilities: ['production'],
      params: { cardType: 'chorus', rate: 0.5, depth: 0.3 },
    },
    {
      name: 'Double-tracked layers',
      opcode: createOpcodeId('add_layer'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'high',
      params: { layerType: 'double', pan: 'stereo' },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#width',
};

/**
 * Depth axis — front-to-back spatial positioning.
 */
export const AXIS_DEPTH: PerceptualAxis = {
  id: createAxisId('depth'),
  name: 'Depth',
  description:
    'The perceived front-to-back distance and depth in the mix. ' +
    'Forward sounds are close and intimate; deep sounds are distant.',
  poles: ['forward', 'distant'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'close'),
    createLexemeId('adj', 'distant'),
    createLexemeId('adj', 'forward'),
    createLexemeId('adj', 'recessed'),
    createLexemeId('adj', 'intimate-spatial'),
    createLexemeId('adj', 'far'),
    createLexemeId('adj', 'near'),
    createLexemeId('adj', 'upfront'),
  ],
  levers: [
    {
      name: 'Reverb amount',
      opcode: createOpcodeId('set_param'),
      direction: 'bidirectional',
      effectiveness: 0.8,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'reverbMix', direction: 'increase' },
    },
    {
      name: 'Pre-delay',
      opcode: createOpcodeId('set_param'),
      direction: 'bidirectional',
      effectiveness: 0.7,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'preDelay', direction: 'increase' },
    },
    {
      name: 'High-frequency roll-off',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'highRollOff', value: -2 },
    },
    {
      name: 'Volume adjustment',
      opcode: createOpcodeId('set_param'),
      direction: 'bidirectional',
      effectiveness: 0.5,
      cost: 'low',
      params: { param: 'volume', direction: 'decrease' },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#depth',
};

/**
 * Height axis — vertical spatial positioning in immersive mixes.
 */
export const AXIS_HEIGHT: PerceptualAxis = {
  id: createAxisId('height'),
  name: 'Height',
  description:
    'The perceived vertical position in immersive/height-channel mixes. ' +
    'High sounds appear overhead; low sounds appear at ear level or below.',
  poles: ['low', 'high'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'overhead'),
    createLexemeId('adj', 'elevated'),
    createLexemeId('adj', 'grounded'),
    createLexemeId('adj', 'sky-high'),
    createLexemeId('adj', 'floating-spatial'),
  ],
  levers: [
    {
      name: 'Height channel routing',
      opcode: createOpcodeId('route_to_height'),
      direction: 'increase',
      effectiveness: 0.9,
      cost: 'low',
      requiresCapabilities: ['immersive-audio'],
    },
    {
      name: 'Upper register',
      opcode: createOpcodeId('shift_register'),
      direction: 'bidirectional',
      effectiveness: 0.5,
      cost: 'medium',
      params: { direction: 'up', semitones: 12 },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#height',
};

// =============================================================================
// Export all axes
// =============================================================================

export const EXTENDED_PERCEPTUAL_AXES_BATCH1 = [
  AXIS_AIRINESS,
  AXIS_WARMTH,
  AXIS_CRISPNESS,
  AXIS_SMOOTHNESS,
  AXIS_GRITTINESS,
  AXIS_GLASSINESS,
  AXIS_METALLICITY,
  AXIS_WIDTH,
  AXIS_DEPTH,
  AXIS_HEIGHT,
] as const;

/**
 * Map from axis ID to axis definition for quick lookup.
 */
export const EXTENDED_AXES_MAP_BATCH1 = new Map(
  EXTENDED_PERCEPTUAL_AXES_BATCH1.map((axis) => [axis.id, axis])
);

/**
 * Get axis by ID.
 */
export function getExtendedAxis(axisId: AxisId): PerceptualAxis | undefined {
  return EXTENDED_AXES_MAP_BATCH1.get(axisId);
}

/**
 * Find axes by related lexeme.
 */
export function findAxesByLexeme(lexemeId: string): readonly PerceptualAxis[] {
  return EXTENDED_PERCEPTUAL_AXES_BATCH1.filter((axis) =>
    axis.relatedLexemes.some((id) => id === lexemeId)
  );
}
