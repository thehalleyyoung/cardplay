/**
 * GOFAI Perceptual Axes — Canon Vocabulary for Musical Qualities
 *
 * This module defines the canonical set of perceptual axes that users
 * can reference in natural language. Each axis maps to concrete levers
 * (actions that can change the axis value).
 *
 * @module gofai/canon/perceptual-axes
 */

import {
  type AxisId,
  type PerceptualAxis,
  type LeverMapping,
  type VocabularyTable,
  createAxisId,
  createOpcodeId,
  createLexemeId,
  createVocabularyTable,
} from './types';

// =============================================================================
// Core Perceptual Axes
// =============================================================================

/**
 * Brightness axis — timbral and harmonic brightness.
 */
export const AXIS_BRIGHTNESS: PerceptualAxis = {
  id: createAxisId('brightness'),
  name: 'Brightness',
  description:
    'Overall timbral and harmonic brightness. Affected by register, ' +
    'voicing extensions, high-frequency content, and instrument choices.',
  poles: ['darker', 'brighter'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'bright'),
    createLexemeId('adj', 'dark'),
    createLexemeId('adj', 'warm'),
    createLexemeId('adj', 'cold'),
    createLexemeId('adj', 'dull'),
    createLexemeId('adj', 'shimmery'),
  ],
  levers: [
    {
      name: 'Register shift',
      opcode: createOpcodeId('shift_register'),
      direction: 'bidirectional',
      effectiveness: 0.7,
      cost: 'medium',
      params: { direction: 'up' },
    },
    {
      name: 'Voicing extensions',
      opcode: createOpcodeId('add_extensions'),
      direction: 'increase',
      effectiveness: 0.5,
      cost: 'medium',
    },
    {
      name: 'High shelf EQ',
      opcode: createOpcodeId('set_param'),
      direction: 'bidirectional',
      effectiveness: 0.6,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'highShelf' },
    },
    {
      name: 'Instrument choice',
      opcode: createOpcodeId('suggest_instrument'),
      direction: 'bidirectional',
      effectiveness: 0.8,
      cost: 'high',
    },
  ],
  docLink: 'docs/gofai/perceptual-axes.md#brightness',
};

/**
 * Energy axis — overall activity and impact.
 */
export const AXIS_ENERGY: PerceptualAxis = {
  id: createAxisId('energy'),
  name: 'Energy',
  description:
    'Overall energy level and impact. Affected by density, dynamics, ' +
    'rhythmic activity, and transient content.',
  poles: ['calmer', 'more energetic'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'energetic'),
    createLexemeId('adj', 'calm'),
    createLexemeId('adj', 'intense'),
    createLexemeId('adj', 'relaxed'),
    createLexemeId('adj', 'powerful'),
    createLexemeId('adj', 'gentle'),
  ],
  levers: [
    {
      name: 'Event density',
      opcode: createOpcodeId('adjust_density'),
      direction: 'bidirectional',
      effectiveness: 0.8,
      cost: 'medium',
    },
    {
      name: 'Dynamic range',
      opcode: createOpcodeId('adjust_dynamics'),
      direction: 'bidirectional',
      effectiveness: 0.6,
      cost: 'low',
    },
    {
      name: 'Layer count',
      opcode: createOpcodeId('adjust_layers'),
      direction: 'bidirectional',
      effectiveness: 0.7,
      cost: 'high',
    },
    {
      name: 'Transient shaping',
      opcode: createOpcodeId('set_param'),
      direction: 'bidirectional',
      effectiveness: 0.5,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'transientAttack' },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes.md#energy',
};

/**
 * Width axis — stereo spread.
 */
export const AXIS_WIDTH: PerceptualAxis = {
  id: createAxisId('width'),
  name: 'Width',
  description:
    'Stereo spread and spatial width. Affected by panning, stereo effects, ' +
    'and arrangement spread.',
  poles: ['narrower', 'wider'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'wide'),
    createLexemeId('adj', 'narrow'),
    createLexemeId('adj', 'spacious'),
    createLexemeId('adj', 'tight'),
    createLexemeId('adj', 'intimate'),
  ],
  levers: [
    {
      name: 'Stereo width parameter',
      opcode: createOpcodeId('set_param'),
      direction: 'bidirectional',
      effectiveness: 0.9,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'stereoWidth' },
    },
    {
      name: 'Panning spread',
      opcode: createOpcodeId('adjust_panning'),
      direction: 'bidirectional',
      effectiveness: 0.7,
      cost: 'low',
      requiresCapabilities: ['production'],
    },
    {
      name: 'Arrangement spread (orchestration)',
      opcode: createOpcodeId('spread_arrangement'),
      direction: 'bidirectional',
      effectiveness: 0.6,
      cost: 'medium',
    },
    {
      name: 'Reverb/ambience',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.5,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'reverbMix' },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes.md#width',
};

/**
 * Tightness axis — rhythmic precision.
 */
export const AXIS_TIGHTNESS: PerceptualAxis = {
  id: createAxisId('tightness'),
  name: 'Tightness',
  description:
    'Rhythmic precision and groove tightness. Affected by quantization, ' +
    'swing, humanization, and microtiming.',
  poles: ['looser', 'tighter'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: false,
  relatedLexemes: [
    createLexemeId('adj', 'tight'),
    createLexemeId('adj', 'loose'),
    createLexemeId('adj', 'sloppy'),
    createLexemeId('adj', 'precise'),
    createLexemeId('adj', 'groovy'),
    createLexemeId('adj', 'mechanical'),
  ],
  levers: [
    {
      name: 'Quantize strength',
      opcode: createOpcodeId('adjust_quantize'),
      direction: 'increase',
      effectiveness: 0.9,
      cost: 'low',
    },
    {
      name: 'Humanize amount',
      opcode: createOpcodeId('adjust_humanize'),
      direction: 'decrease',
      effectiveness: 0.7,
      cost: 'low',
    },
    {
      name: 'Swing amount',
      opcode: createOpcodeId('adjust_swing'),
      direction: 'bidirectional',
      effectiveness: 0.5,
      cost: 'low',
    },
    {
      name: 'Microtiming alignment',
      opcode: createOpcodeId('align_microtiming'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'medium',
    },
  ],
  docLink: 'docs/gofai/perceptual-axes.md#tightness',
};

/**
 * Tension axis — harmonic and melodic tension.
 */
export const AXIS_TENSION: PerceptualAxis = {
  id: createAxisId('tension'),
  name: 'Tension',
  description:
    'Harmonic and melodic tension. Affected by dissonance, suspension, ' +
    'chromaticism, and rhythmic anticipation.',
  poles: ['less tense', 'more tense'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: false,
  relatedLexemes: [
    createLexemeId('adj', 'tense'),
    createLexemeId('adj', 'relaxed'),
    createLexemeId('adj', 'resolved'),
    createLexemeId('adj', 'suspended'),
    createLexemeId('adj', 'dissonant'),
    createLexemeId('adj', 'consonant'),
  ],
  levers: [
    {
      name: 'Add tension devices',
      opcode: createOpcodeId('add_tension'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'medium',
    },
    {
      name: 'Resolve suspensions',
      opcode: createOpcodeId('resolve_tension'),
      direction: 'decrease',
      effectiveness: 0.7,
      cost: 'medium',
    },
    {
      name: 'Chromatic substitution',
      opcode: createOpcodeId('chromatic_substitute'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'high',
    },
    {
      name: 'Anticipation/suspension',
      opcode: createOpcodeId('add_anticipation'),
      direction: 'increase',
      effectiveness: 0.5,
      cost: 'low',
    },
  ],
  docLink: 'docs/gofai/perceptual-axes.md#tension',
};

/**
 * Lift axis — upward musical momentum.
 */
export const AXIS_LIFT: PerceptualAxis = {
  id: createAxisId('lift'),
  name: 'Lift',
  description:
    'Upward musical momentum and feeling of elevation. Affected by register, ' +
    'voicing, dynamic contour, and harmonic motion.',
  poles: ['less lift', 'more lift'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: false,
  relatedLexemes: [
    createLexemeId('adj', 'lifting'),
    createLexemeId('adj', 'grounded'),
    createLexemeId('adj', 'soaring'),
    createLexemeId('adj', 'heavy'),
    createLexemeId('adj', 'airy'),
  ],
  levers: [
    {
      name: 'Raise register',
      opcode: createOpcodeId('shift_register'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'medium',
      params: { direction: 'up' },
    },
    {
      name: 'Open voicings',
      opcode: createOpcodeId('open_voicings'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'medium',
    },
    {
      name: 'Dynamic swell',
      opcode: createOpcodeId('add_dynamic_contour'),
      direction: 'increase',
      effectiveness: 0.5,
      cost: 'low',
      params: { contour: 'swell' },
    },
    {
      name: 'Reduce bass weight',
      opcode: createOpcodeId('adjust_density'),
      direction: 'increase',
      effectiveness: 0.4,
      cost: 'medium',
      params: { layer: 'bass', direction: 'decrease' },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes.md#lift',
};

/**
 * Busyness axis — rhythmic and textural complexity.
 */
export const AXIS_BUSYNESS: PerceptualAxis = {
  id: createAxisId('busyness'),
  name: 'Busyness',
  description:
    'Rhythmic and textural complexity. Affected by note density, layer count, ' +
    'and rhythmic subdivision.',
  poles: ['simpler', 'busier'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: false,
  relatedLexemes: [
    createLexemeId('adj', 'busy'),
    createLexemeId('adj', 'simple'),
    createLexemeId('adj', 'complex'),
    createLexemeId('adj', 'sparse'),
    createLexemeId('adj', 'dense'),
    createLexemeId('adj', 'cluttered'),
  ],
  levers: [
    {
      name: 'Note density',
      opcode: createOpcodeId('adjust_density'),
      direction: 'bidirectional',
      effectiveness: 0.9,
      cost: 'medium',
    },
    {
      name: 'Layer count',
      opcode: createOpcodeId('adjust_layers'),
      direction: 'bidirectional',
      effectiveness: 0.7,
      cost: 'high',
    },
    {
      name: 'Rhythmic subdivision',
      opcode: createOpcodeId('adjust_subdivision'),
      direction: 'bidirectional',
      effectiveness: 0.6,
      cost: 'medium',
    },
    {
      name: 'Remove ornaments',
      opcode: createOpcodeId('simplify_ornaments'),
      direction: 'decrease',
      effectiveness: 0.5,
      cost: 'low',
    },
  ],
  docLink: 'docs/gofai/perceptual-axes.md#busyness',
};

/**
 * Warmth axis — timbral warmth.
 */
export const AXIS_WARMTH: PerceptualAxis = {
  id: createAxisId('warmth'),
  name: 'Warmth',
  description:
    'Timbral warmth and analog character. Affected by saturation, ' +
    'low-mid emphasis, and instrument choice.',
  poles: ['colder', 'warmer'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'warm'),
    createLexemeId('adj', 'cold'),
    createLexemeId('adj', 'analog'),
    createLexemeId('adj', 'digital'),
    createLexemeId('adj', 'cozy'),
    createLexemeId('adj', 'sterile'),
  ],
  levers: [
    {
      name: 'Saturation',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'saturation' },
    },
    {
      name: 'Low-mid boost',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'lowMidGain' },
    },
    {
      name: 'High cut',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.5,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'highCut' },
    },
    {
      name: 'Instrument timbre',
      opcode: createOpcodeId('suggest_instrument'),
      direction: 'bidirectional',
      effectiveness: 0.7,
      cost: 'high',
    },
  ],
  docLink: 'docs/gofai/perceptual-axes.md#warmth',
};

/**
 * Intimacy axis — sense of closeness and personal connection.
 */
export const AXIS_INTIMACY: PerceptualAxis = {
  id: createAxisId('intimacy'),
  name: 'Intimacy',
  description:
    'Sense of closeness and personal connection. Affected by texture density, ' +
    'reverb/distance, width, and dynamic range.',
  poles: ['more distant', 'more intimate'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'intimate'),
    createLexemeId('adj', 'distant'),
    createLexemeId('adj', 'close'),
    createLexemeId('adj', 'far'),
    createLexemeId('adj', 'personal'),
    createLexemeId('adj', 'epic'),
  ],
  levers: [
    {
      name: 'Reduce reverb',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'reverbMix', direction: 'decrease' },
    },
    {
      name: 'Reduce width',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'stereoWidth', direction: 'decrease' },
    },
    {
      name: 'Thin texture',
      opcode: createOpcodeId('thin_texture'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'medium',
    },
    {
      name: 'Reduce dynamic range',
      opcode: createOpcodeId('adjust_dynamics'),
      direction: 'increase',
      effectiveness: 0.4,
      cost: 'low',
      params: { compression: 'increase' },
    },
  ],
  docLink: 'docs/gofai/perceptual-axes.md#intimacy',
};

/**
 * Motion axis — sense of movement and forward momentum.
 */
export const AXIS_MOTION: PerceptualAxis = {
  id: createAxisId('motion'),
  name: 'Motion',
  description:
    'Sense of movement and forward momentum. Affected by rhythmic patterns, ' +
    'harmonic rhythm, and phrase shapes.',
  poles: ['more static', 'more motion'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: false,
  relatedLexemes: [
    createLexemeId('adj', 'moving'),
    createLexemeId('adj', 'static'),
    createLexemeId('adj', 'driving'),
    createLexemeId('adj', 'stagnant'),
    createLexemeId('adj', 'flowing'),
    createLexemeId('adj', 'stuck'),
  ],
  levers: [
    {
      name: 'Harmonic rhythm',
      opcode: createOpcodeId('adjust_harmonic_rhythm'),
      direction: 'bidirectional',
      effectiveness: 0.7,
      cost: 'medium',
    },
    {
      name: 'Rhythmic variation',
      opcode: createOpcodeId('add_rhythmic_variation'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'medium',
    },
    {
      name: 'Arpeggiation',
      opcode: createOpcodeId('add_arpeggiation'),
      direction: 'increase',
      effectiveness: 0.5,
      cost: 'low',
    },
    {
      name: 'Phrase shaping',
      opcode: createOpcodeId('shape_phrases'),
      direction: 'bidirectional',
      effectiveness: 0.4,
      cost: 'medium',
    },
  ],
  docLink: 'docs/gofai/perceptual-axes.md#motion',
};

/**
 * Impact axis — punch and transient weight.
 */
export const AXIS_IMPACT: PerceptualAxis = {
  id: createAxisId('impact'),
  name: 'Impact',
  description:
    'Punch and transient weight. Affected by transient shaping, ' +
    'compression, and rhythmic emphasis.',
  poles: ['softer', 'harder hitting'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: true,
  relatedLexemes: [
    createLexemeId('adj', 'punchy'),
    createLexemeId('adj', 'soft'),
    createLexemeId('adj', 'hard'),
    createLexemeId('adj', 'slamming'),
    createLexemeId('adj', 'gentle'),
    createLexemeId('adj', 'aggressive'),
  ],
  levers: [
    {
      name: 'Transient attack',
      opcode: createOpcodeId('set_param'),
      direction: 'increase',
      effectiveness: 0.9,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'transientAttack' },
    },
    {
      name: 'Compression ratio',
      opcode: createOpcodeId('set_param'),
      direction: 'bidirectional',
      effectiveness: 0.6,
      cost: 'low',
      requiresCapabilities: ['production'],
      params: { param: 'compressionRatio' },
    },
    {
      name: 'Velocity emphasis',
      opcode: createOpcodeId('adjust_velocities'),
      direction: 'bidirectional',
      effectiveness: 0.7,
      cost: 'low',
    },
    {
      name: 'Accent patterns',
      opcode: createOpcodeId('add_accents'),
      direction: 'increase',
      effectiveness: 0.5,
      cost: 'medium',
    },
  ],
  docLink: 'docs/gofai/perceptual-axes.md#impact',
};

/**
 * Groove axis — rhythmic feel and swing.
 */
export const AXIS_GROOVE: PerceptualAxis = {
  id: createAxisId('groove'),
  name: 'Groove',
  description:
    'Rhythmic feel and swing. Affected by swing amount, ghost notes, ' +
    'syncopation, and microtiming.',
  poles: ['straighter', 'groovier'],
  defaultValue: 0.5,
  range: [0, 1],
  affectsAudio: false,
  relatedLexemes: [
    createLexemeId('adj', 'groovy'),
    createLexemeId('adj', 'straight'),
    createLexemeId('adj', 'swinging'),
    createLexemeId('adj', 'funky'),
    createLexemeId('adj', 'square'),
    createLexemeId('adj', 'laid-back'),
  ],
  levers: [
    {
      name: 'Swing amount',
      opcode: createOpcodeId('adjust_swing'),
      direction: 'increase',
      effectiveness: 0.8,
      cost: 'low',
    },
    {
      name: 'Ghost notes',
      opcode: createOpcodeId('add_ghost_notes'),
      direction: 'increase',
      effectiveness: 0.6,
      cost: 'medium',
    },
    {
      name: 'Syncopation',
      opcode: createOpcodeId('add_syncopation'),
      direction: 'increase',
      effectiveness: 0.7,
      cost: 'medium',
    },
    {
      name: 'Humanization',
      opcode: createOpcodeId('adjust_humanize'),
      direction: 'increase',
      effectiveness: 0.5,
      cost: 'low',
    },
  ],
  docLink: 'docs/gofai/perceptual-axes.md#groove',
};

// =============================================================================
// Axis Table
// =============================================================================

/**
 * All core perceptual axes.
 */
export const CORE_PERCEPTUAL_AXES: readonly PerceptualAxis[] = [
  AXIS_BRIGHTNESS,
  AXIS_ENERGY,
  AXIS_WIDTH,
  AXIS_TIGHTNESS,
  AXIS_TENSION,
  AXIS_LIFT,
  AXIS_BUSYNESS,
  AXIS_WARMTH,
  AXIS_INTIMACY,
  AXIS_MOTION,
  AXIS_IMPACT,
  AXIS_GROOVE,
];

/**
 * Axis vocabulary table.
 */
export const PERCEPTUAL_AXES_TABLE: VocabularyTable<PerceptualAxis> =
  createVocabularyTable(
    CORE_PERCEPTUAL_AXES.map(axis => ({
      ...axis,
      variants: axis.poles,
    }))
  );

// =============================================================================
// Axis Utilities
// =============================================================================

/**
 * Get an axis by ID.
 */
export function getAxisById(id: AxisId): PerceptualAxis | undefined {
  return PERCEPTUAL_AXES_TABLE.byId.get(id);
}

/**
 * Get an axis by name or pole label.
 */
export function getAxisByName(name: string): PerceptualAxis | undefined {
  const normalized = name.toLowerCase();
  return PERCEPTUAL_AXES_TABLE.byVariant.get(normalized);
}

/**
 * Get all levers for an axis in a specific direction.
 */
export function getLeversForAxis(
  axisId: AxisId,
  direction: 'increase' | 'decrease'
): readonly LeverMapping[] {
  const axis = getAxisById(axisId);
  if (!axis) return [];

  return axis.levers.filter(
    lever => lever.direction === direction || lever.direction === 'bidirectional'
  );
}

/**
 * Get the most effective lever for an axis change.
 */
export function getMostEffectiveLever(
  axisId: AxisId,
  direction: 'increase' | 'decrease',
  capabilities?: readonly string[]
): LeverMapping | undefined {
  const levers = getLeversForAxis(axisId, direction);

  // Filter by available capabilities
  const availableLevers = levers.filter(lever => {
    if (!lever.requiresCapabilities) return true;
    if (!capabilities) return false;
    return lever.requiresCapabilities.every(cap => capabilities.includes(cap));
  });

  // Sort by effectiveness (descending)
  const sorted = [...availableLevers].sort(
    (a, b) => b.effectiveness - a.effectiveness
  );

  return sorted[0];
}

/**
 * Get axes affected by a specific opcode.
 */
export function getAxesAffectedByOpcode(opcodeId: string): readonly AxisId[] {
  const affected: AxisId[] = [];

  for (const axis of CORE_PERCEPTUAL_AXES) {
    for (const lever of axis.levers) {
      if (lever.opcode === opcodeId) {
        affected.push(axis.id);
        break;
      }
    }
  }

  return affected;
}

/**
 * Parse a pole label to axis and direction.
 */
export function parsePoleLabel(
  label: string
): { axis: PerceptualAxis; direction: 'increase' | 'decrease' } | undefined {
  const normalized = label.toLowerCase();

  for (const axis of CORE_PERCEPTUAL_AXES) {
    if (axis.poles[0].toLowerCase() === normalized) {
      return { axis, direction: 'decrease' };
    }
    if (axis.poles[1].toLowerCase() === normalized) {
      return { axis, direction: 'increase' };
    }
  }

  return undefined;
}
