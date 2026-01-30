/**
 * GOFAI Extended Perceptual Axes — Batch 2: Emotional, Dynamic, and Rhythmic Qualities
 *
 * Continuing the expansion of perceptual vocabulary with axes for emotional
 * affect, dynamic range, rhythmic feel, and gestural qualities.
 *
 * @module gofai/canon/perceptual-axes-extended-batch2
 */

import {
  type AxisId,
  type PerceptualAxis,
  createAxisId,
  createOpcodeId,
  createLexemeId,
} from './types.js';

// =============================================================================
// Emotional/Affective Axes
// =============================================================================

/**
 * Tension axis — harmonic and melodic tension vs resolution.
 */
export const AXIS_TENSION: PerceptualAxis = {
  id: createAxisId('tension'),
  name: 'Tension',
  description:
    'The perceived harmonic and melodic tension. High tension creates ' +
    'expectation and unresolved energy; low tension is resolved and stable.',
  poles: ['resolved', 'tense'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: false,
  relatedLexemes: [
    createLexemeId('adj', 'tense'),
    createLexemeId('adj', 'resolved'),
    createLexemeId('adj', 'dissonant'),
    createLexemeId('adj', 'consonant'),
    createLexemeId('adj', 'restless'),
    createLexemeId('adj', 'settled'),
    createLexemeId('adj', 'unstable'),
    createLexemeId('adj', 'stable'),
    createLexemeId('adj', 'edgy-harmony'),
    createLexemeId('adj', 'suspended'),
  ],
  levers: [
    {
      name: 'Add dissonant extensions',
      opcode: createOpcodeId('add_extensions'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'medium',
      params: { extensions: ['b9', '#11', 'b13'] },
    },
    {
      name: 'Chromatic passing tones',
      opcode: createOpcodeId('add_passing_tones'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'medium',
      params: { chromaticism: 0.7 },
    },
    {
      name: 'Suspend resolutions',
      opcode: createOpcodeId('delay_resolutions'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'high',
      params: { delay: 0.5 },
    },
    {
      name: 'Modal substitution',
      opcode: createOpcodeId('substitute_chords'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'high',
      params: { mode: 'lydian-augmented' },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#tension',
};

/**
 * Hopefulness axis — emotional valence toward hope and optimism.
 */
export const AXIS_HOPEFULNESS: PerceptualAxis = {
  id: createAxisId('hopefulness'),
  name: 'Hopefulness',
  description:
    'The perceived emotional quality of hope, optimism, and uplift. ' +
    'Hopeful music often uses major modes, rising contours, and brightening harmonics.',
  poles: ['despairing', 'hopeful'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: false,
  relatedLexemes: [
    createLexemeId('adj', 'hopeful'),
    createLexemeId('adj', 'optimistic'),
    createLexemeId('adj', 'uplifting'),
    createLexemeId('adj', 'aspiring'),
    createLexemeId('adj', 'bright-emotionally'),
    createLexemeId('adj', 'encouraging'),
    createLexemeId('adj', 'affirming'),
    createLexemeId('adj', 'radiant-emotion'),
  ],
  levers: [
    {
      name: 'Major mode shift',
      opcode: createOpcodeId('set_mode'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'high',
      params: { mode: 'major' },
    },
    {
      name: 'Rising contour',
      opcode: createOpcodeId('adjust_contour'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'medium',
      params: { direction: 'ascending', strength: 0.6 },
    },
    {
      name: 'Brighten voicings',
      opcode: createOpcodeId('add_extensions'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'medium',
      params: { extensions: ['9th', '6th'] },
    },
    {
      name: 'Lift register',
      opcode: createOpcodeId('shift_register'),
      direction: 'increase',
      effectiveness: 0.5,
      cost: 'medium',
      params: { direction: 'up', semitones: 7 },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#hopefulness',
};

/**
 * Melancholy axis — emotional quality of sadness and wistfulness.
 */
export const AXIS_MELANCHOLY: PerceptualAxis = {
  id: createAxisId('melancholy'),
  name: 'Melancholy',
  description:
    'The perceived emotional quality of sadness, wistfulness, and longing. ' +
    'Melancholic music often uses minor modes, descending lines, and darker timbres.',
  poles: ['joyful', 'melancholic'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: false,
  relatedLexemes: [
    createLexemeId('adj', 'melancholic'),
    createLexemeId('adj', 'sad'),
    createLexemeId('adj', 'wistful'),
    createLexemeId('adj', 'mournful'),
    createLexemeId('adj', 'plaintive'),
    createLexemeId('adj', 'blue'),
    createLexemeId('adj', 'somber'),
    createLexemeId('adj', 'pensive'),
    createLexemeId('adj', 'elegiac'),
  ],
  levers: [
    {
      name: 'Minor mode shift',
      opcode: createOpcodeId('set_mode'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'high',
      params: { mode: 'minor' },
    },
    {
      name: 'Descending contour',
      opcode: createOpcodeId('adjust_contour'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'medium',
      params: { direction: 'descending', strength: 0.6 },
    },
    {
      name: 'Lower register',
      opcode: createOpcodeId('shift_register'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'medium',
      params: { direction: 'down', semitones: -7 },
    },
    {
      name: 'Darker timbre',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.5,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'highShelf', value: -4 },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#melancholy',
};

/**
 * Urgency axis — sense of pressure and forward momentum.
 */
export const AXIS_URGENCY: PerceptualAxis = {
  id: createAxisId('urgency'),
  name: 'Urgency',
  description:
    'The perceived sense of pressure, hurry, and forward drive. ' +
    'Urgent music has higher tempo, more rhythmic density, and driving patterns.',
  poles: ['relaxed', 'urgent'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: false,
  relatedLexemes: [
    createLexemeId('adj', 'urgent'),
    createLexemeId('adj', 'hurried'),
    createLexemeId('adj', 'pressing'),
    createLexemeId('adj', 'insistent'),
    createLexemeId('adj', 'driven'),
    createLexemeId('adj', 'racing'),
    createLexemeId('adj', 'relentless'),
  ],
  levers: [
    {
      name: 'Increase tempo',
      opcode: createOpcodeId('adjust_tempo'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'low',
      params: { adjustment: '+10%' },
    },
    {
      name: 'Densify rhythm',
      opcode: createOpcodeId('densify_rhythm'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'medium',
      params: { density: '+30%' },
    },
    {
      name: 'Driving ostinato',
      opcode: createOpcodeId('add_ostinato'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'high',
      params: { subdivision: 16 },
    },
    {
      name: 'Compression tightness',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.5,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'compressorRatio', value: 4 },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#urgency',
};

/**
 * Playfulness axis — lighthearted and whimsical quality.
 */
export const AXIS_PLAYFULNESS: PerceptualAxis = {
  id: createAxisId('playfulness'),
  name: 'Playfulness',
  description:
    'The perceived lighthearted, whimsical, and spontaneous quality. ' +
    'Playful music has rhythmic variety, surprising elements, and buoyant character.',
  poles: ['serious', 'playful'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: false,
  relatedLexemes: [
    createLexemeId('adj', 'playful'),
    createLexemeId('adj', 'whimsical'),
    createLexemeId('adj', 'lighthearted'),
    createLexemeId('adj', 'bouncy'),
    createLexemeId('adj', 'mischievous'),
    createLexemeId('adj', 'quirky'),
    createLexemeId('adj', 'capricious'),
    createLexemeId('adj', 'impish'),
  ],
  levers: [
    {
      name: 'Add syncopation',
      opcode: createOpcodeId('add_syncopation'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'medium',
      params: { amount: 0.6 },
    },
    {
      name: 'Rhythmic variety',
      opcode: createOpcodeId('vary_rhythm'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'medium',
      params: { variety: 0.7 },
    },
    {
      name: 'Staccato touches',
      opcode: createOpcodeId('adjust_articulation'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'medium',
      params: { style: 'staccato', mix: 0.4 },
    },
    {
      name: 'Upper register accents',
      opcode: createOpcodeId('add_register_accents'),
      direction: 'increase',
      effectiveness: 0.5,
      cost: 'medium',
      params: { register: 'high', frequency: 'sparse' },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#playfulness',
};

// =============================================================================
// Dynamic Axes
// =============================================================================

/**
 * Loudness axis — overall amplitude level.
 */
export const AXIS_LOUDNESS: PerceptualAxis = {
  id: createAxisId('loudness'),
  name: 'Loudness',
  description:
    'The perceived overall loudness and amplitude. Distinct from energy — ' +
    'this is pure volume level.',
  poles: ['quiet', 'loud'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'loud'),
    createLexemeId('adj', 'quiet'),
    createLexemeId('adj', 'soft'),
    createLexemeId('adj', 'forte'),
    createLexemeId('adj', 'piano'),
    createLexemeId('adj', 'whispered'),
    createLexemeId('adj', 'thunderous'),
  ],
  levers: [
    {
      name: 'Volume fader',
      opcode: createOpcodeId('set_param'),
      direction: 'bidirectional',
      effectiveness: 1.0,
      cost: 'low',
      params: { param: 'volume' },
    },
    {
      name: 'Gain staging',
      opcode: createOpcodeId('set_param'),
      direction: 'bidirectional',
      effectiveness: 0.9,
      cost: 'low',
      params: { param: 'gain' },
    },
    {
      name: 'Limiter ceiling',
      opcode: createOpcodeId('set_param'),
      direction: 'bidirectional',
      effectiveness: 0.8,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'limiterCeiling' },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#loudness',
};

/**
 * Dynamic range axis — difference between loud and quiet moments.
 */
export const AXIS_DYNAMIC_RANGE: PerceptualAxis = {
  id: createAxisId('dynamic-range'),
  name: 'Dynamic Range',
  description:
    'The difference between the loudest and quietest moments. High dynamic ' +
    'range is expressive; low dynamic range is compressed and consistent.',
  poles: ['compressed', 'dynamic'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'dynamic'),
    createLexemeId('adj', 'compressed'),
    createLexemeId('adj', 'expressive-dynamics'),
    createLexemeId('adj', 'even-level'),
    createLexemeId('adj', 'varied-dynamics'),
  ],
  levers: [
    {
      name: 'Compressor ratio',
      opcode: createOpcodeId('set_param'),
      direction: 'bidirectional',
      effectiveness: 0.9,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'compressorRatio', direction: 'decrease' },
    },
    {
      name: 'Velocity scaling',
      opcode: createOpcodeId('adjust_velocity_range'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'medium',
      params: { expansion: 1.3 },
    },
    {
      name: 'Phrase dynamics',
      opcode: createOpcodeId('add_phrase_dynamics'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'medium',
      params: { curve: 'natural' },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#dynamic-range',
};

/**
 * Impact axis — transient force and punch.
 */
export const AXIS_IMPACT: PerceptualAxis = {
  id: createAxisId('impact'),
  name: 'Impact',
  description:
    'The perceived physical impact and punch of transients. High impact ' +
    'sounds hit hard; low impact sounds are gentle.',
  poles: ['gentle', 'impactful'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'impactful'),
    createLexemeId('adj', 'punchy'),
    createLexemeId('adj', 'hard-hitting'),
    createLexemeId('adj', 'forceful'),
    createLexemeId('adj', 'gentle'),
    createLexemeId('adj', 'soft-touch'),
    createLexemeId('adj', 'aggressive-impact'),
  ],
  levers: [
    {
      name: 'Transient boost',
      opcode: createOpcodeId('add_card'),
      direction: 'increase',
      effectiveness: 0.9,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { cardType: 'transient-shaper', attack: '+8dB' },
    },
    {
      name: 'Compression attack',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'compressorAttack', value: 1 },
    },
    {
      name: 'Velocity accents',
      opcode: createOpcodeId('accent_attacks'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'medium',
      params: { boost: '+15vel' },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#impact',
};

// =============================================================================
// Rhythmic Feel Axes
// =============================================================================

/**
 * Groove tightness axis — rhythmic precision vs looseness.
 */
export const AXIS_GROOVE_TIGHTNESS: PerceptualAxis = {
  id: createAxisId('groove-tightness'),
  name: 'Groove Tightness',
  description:
    'The rhythmic precision and tightness. Tight grooves are locked and ' +
    'precise; loose grooves have human variation and swing.',
  poles: ['loose', 'tight'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: false,
  relatedLexemes: [
    createLexemeId('adj', 'tight'),
    createLexemeId('adj', 'loose'),
    createLexemeId('adj', 'locked'),
    createLexemeId('adj', 'relaxed-timing'),
    createLexemeId('adj', 'precise'),
    createLexemeId('adj', 'laid-back'),
  ],
  levers: [
    {
      name: 'Quantize strength',
      opcode: createOpcodeId('quantize'),
      direction: 'increase',
      effectiveness: 0.9,
      cost: 'low',
      params: { strength: 1.0 },
    },
    {
      name: 'Humanize timing',
      opcode: createOpcodeId('humanize'),
      direction: 'decrease',
      effectiveness: 0.8,
      cost: 'low',
      params: { amount: 0.0 },
    },
    {
      name: 'Timing variance',
      opcode: createOpcodeId('adjust_timing_variance'),
      direction: 'decrease',
      effectiveness: 0.7,
      cost: 'medium',
      params: { variance: 0.1 },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#groove-tightness',
};

/**
 * Swing axis — swing feel and shuffle rhythm.
 */
export const AXIS_SWING: PerceptualAxis = {
  id: createAxisId('swing'),
  name: 'Swing',
  description:
    'The amount of swing/shuffle feel in the rhythm. Straight feel vs ' +
    'swung 8ths or 16ths.',
  poles: ['straight', 'swung'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: false,
  relatedLexemes: [
    createLexemeId('adj', 'swung'),
    createLexemeId('adj', 'straight'),
    createLexemeId('adj', 'shuffled'),
    createLexemeId('adj', 'triplet-feel'),
  ],
  levers: [
    {
      name: 'Swing amount',
      opcode: createOpcodeId('apply_swing'),
      direction: 'increase',
      effectiveness: 0.9,
      cost: 'low',
      params: { amount: 0.66 },
    },
    {
      name: 'Groove template',
      opcode: createOpcodeId('apply_groove_template'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'medium',
      params: { template: 'shuffle' },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#swing',
};

/**
 * Syncopation axis — rhythmic displacement and off-beat emphasis.
 */
export const AXIS_SYNCOPATION: PerceptualAxis = {
  id: createAxisId('syncopation'),
  name: 'Syncopation',
  description:
    'The amount of syncopation and off-beat emphasis. High syncopation ' +
    'creates rhythmic surprise; low syncopation is on-beat.',
  poles: ['on-beat', 'syncopated'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: false,
  relatedLexemes: [
    createLexemeId('adj', 'syncopated'),
    createLexemeId('adj', 'off-beat'),
    createLexemeId('adj', 'on-beat'),
    createLexemeId('adj', 'displaced'),
  ],
  levers: [
    {
      name: 'Add syncopation',
      opcode: createOpcodeId('add_syncopation'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'medium',
      params: { amount: 0.6, targets: 'accents' },
    },
    {
      name: 'Shift accents',
      opcode: createOpcodeId('shift_accents'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'medium',
      params: { offset: 'eighth' },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes-extended.md#syncopation',
};

// =============================================================================
// Export all axes
// =============================================================================

export const EXTENDED_PERCEPTUAL_AXES_BATCH2 = [
  AXIS_TENSION,
  AXIS_HOPEFULNESS,
  AXIS_MELANCHOLY,
  AXIS_URGENCY,
  AXIS_PLAYFULNESS,
  AXIS_LOUDNESS,
  AXIS_DYNAMIC_RANGE,
  AXIS_IMPACT,
  AXIS_GROOVE_TIGHTNESS,
  AXIS_SWING,
  AXIS_SYNCOPATION,
] as const;

export const EXTENDED_AXES_MAP_BATCH2 = new Map(
  EXTENDED_PERCEPTUAL_AXES_BATCH2.map((axis) => [axis.id, axis])
);

export function getExtendedAxisBatch2(axisId: AxisId): PerceptualAxis | undefined {
  return EXTENDED_AXES_MAP_BATCH2.get(axisId);
}

export function findAxesByLexemeBatch2(lexemeId: string): readonly PerceptualAxis[] {
  return EXTENDED_PERCEPTUAL_AXES_BATCH2.filter((axis) =>
    axis.relatedLexemes.some((id) => id === lexemeId)
  );
}
