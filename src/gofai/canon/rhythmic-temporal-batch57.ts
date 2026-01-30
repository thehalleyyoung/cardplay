/**
 * GOFAI Canon — Rhythmic and Temporal Vocabulary (Batch 57)
 *
 * Comprehensive vocabulary for rhythmic and temporal descriptors, covering:
 * - Rhythmic feel and groove characteristics
 * - Timing and synchronization descriptors  
 * - Temporal flow and pacing
 * - Metric and sub-beat subdivisions
 * - Rhythmic complexity and regularity
 * - Temporal relationships and patterns
 *
 * This batch provides natural language coverage for professional rhythmic
 * terminology used in music production, performance, and composition.
 *
 * @module gofai/canon/rhythmic-temporal-batch57
 */

import {
  type Lexeme,
  type LexemeId,
  type AxisId,
  type OpcodeId,
  createLexemeId,
  createAxisId,
  createOpcodeId,
} from './types';

// =============================================================================
// Rhythmic Feel Descriptors
// =============================================================================

/**
 * Rhythmic feel and groove characteristics.
 *
 * These descriptors capture the qualitative aspects of rhythm:
 * - Swing vs. straight
 * - Laid-back vs. forward-pushing
 * - Loose vs. tight timing
 * - Bouncy vs. rigid
 */
const RHYTHMIC_FEEL_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'swung'),
    lemma: 'swung',
    variants: ['swing', 'swinging', 'swing feel', 'shuffle'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('swing'),
      direction: 'increase',
    },
    description: 'Rhythmic feel with triplet subdivision, unequal eighth notes',
    examples: [
      'make it more swung',
      'add swing feel to the drums',
      'give it a shuffle feel',
    ],
  },
  {
    id: createLexemeId('adj', 'straight'),
    lemma: 'straight',
    variants: ['even', 'straight time', 'square'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('swing'),
      direction: 'decrease',
    },
    description: 'Even rhythmic subdivision, no swing',
    examples: [
      'make it straight',
      'remove the swing',
      'straighten the timing',
    ],
  },
  {
    id: createLexemeId('adj', 'laid_back'),
    lemma: 'laid-back',
    variants: ['behind the beat', 'relaxed timing', 'lazy', 'dragging'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('timing_placement'),
      direction: 'decrease',
    },
    description: 'Timing that sits slightly behind the beat',
    examples: [
      'make it more laid-back',
      'put the drums behind the beat',
      'give it a relaxed feel',
    ],
  },
  {
    id: createLexemeId('adj', 'forward_pushing'),
    lemma: 'forward-pushing',
    variants: ['pushing', 'ahead of the beat', 'urgent', 'rushing'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('timing_placement'),
      direction: 'increase',
    },
    description: 'Timing that sits slightly ahead of the beat',
    examples: [
      'make it more forward-pushing',
      'put the hi-hats ahead',
      'give it urgency',
    ],
  },
  {
    id: createLexemeId('adj', 'bouncy'),
    lemma: 'bouncy',
    variants: ['springy', 'elastic', 'lively rhythm'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_energy'),
      direction: 'increase',
    },
    description: 'Rhythmic feel with pronounced accents and energy',
    examples: [
      'make it bouncier',
      'add bounce to the bass',
      'give it a springy feel',
    ],
  },
  {
    id: createLexemeId('adj', 'rigid'),
    lemma: 'rigid',
    variants: ['stiff', 'mechanical rhythm', 'inflexible'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_flexibility'),
      direction: 'decrease',
    },
    description: 'Unchanging, mechanical rhythmic feel',
    examples: [
      'make it less rigid',
      'loosen up the timing',
      'humanize the mechanical feel',
    ],
  },
  {
    id: createLexemeId('adj', 'groovy'),
    lemma: 'groovy',
    variants: ['grooving', 'in the pocket', 'pocketed'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('groove_quality'),
      direction: 'increase',
    },
    description: 'Strong sense of groove and rhythmic coherence',
    examples: [
      'make it groovier',
      'get it in the pocket',
      'improve the groove',
    ],
  },
  {
    id: createLexemeId('adj', 'polyrhythmic'),
    lemma: 'polyrhythmic',
    variants: ['cross-rhythms', 'multiple rhythms', 'polymeter'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'polyrhythm',
    },
    description: 'Multiple simultaneous rhythmic patterns or meters',
    examples: [
      'add polyrhythmic elements',
      'create cross-rhythms',
      'layer different rhythms',
    ],
  },
] as const;

// =============================================================================
// Timing and Synchronization
// =============================================================================

/**
 * Timing precision and synchronization descriptors.
 *
 * Covers:
 * - Tight vs. loose timing
 * - Synchronized vs. desynchronized
 * - Locked vs. floating
 * - Quantized vs. human timing
 */
const TIMING_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'tight'),
    lemma: 'tight',
    variants: ['precise', 'locked in', 'on point'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('timing_tightness'),
      direction: 'increase',
    },
    description: 'Precise, accurate timing with minimal deviation',
    examples: [
      'make the timing tighter',
      'lock in the drums',
      'tighten up the groove',
    ],
  },
  {
    id: createLexemeId('adj', 'loose'),
    lemma: 'loose',
    variants: ['relaxed timing', 'free', 'flexible'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('timing_tightness'),
      direction: 'decrease',
    },
    description: 'Relaxed timing with natural variation',
    examples: [
      'make it looser',
      'loosen the timing',
      'add timing variation',
    ],
  },
  {
    id: createLexemeId('adj', 'synchronized'),
    lemma: 'synchronized',
    variants: ['in sync', 'together', 'aligned'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('synchronization'),
      direction: 'increase',
    },
    description: 'Elements playing in perfect alignment',
    examples: [
      'synchronize the drums and bass',
      'get them in sync',
      'align the timing',
    ],
  },
  {
    id: createLexemeId('adj', 'offset'),
    lemma: 'offset',
    variants: ['desynchronized', 'out of sync', 'phase-shifted'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('synchronization'),
      direction: 'decrease',
    },
    description: 'Intentionally displaced timing between elements',
    examples: [
      'offset the hi-hats slightly',
      'create timing offset',
      'phase-shift the elements',
    ],
  },
  {
    id: createLexemeId('adj', 'quantized'),
    lemma: 'quantized',
    variants: ['gridded', 'on the grid', 'snapped'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('quantization'),
      direction: 'increase',
    },
    description: 'Notes aligned to rhythmic grid',
    examples: [
      'quantize the MIDI',
      'snap to grid',
      'align to the beat',
    ],
  },
  {
    id: createLexemeId('adj', 'humanized'),
    lemma: 'humanized',
    variants: ['natural timing', 'unquantized', 'off the grid'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('quantization'),
      direction: 'decrease',
    },
    description: 'Natural, human-like timing variation',
    examples: [
      'humanize the drums',
      'add natural timing',
      'take it off the grid',
    ],
  },
  {
    id: createLexemeId('adj', 'locked'),
    lemma: 'locked',
    variants: ['locked in', 'tight with', 'glued to'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_cohesion'),
      direction: 'increase',
    },
    description: 'Rhythmic elements strongly coupled and coherent',
    examples: [
      'lock the bass to the kick',
      'get them locked together',
      'create tight cohesion',
    ],
  },
  {
    id: createLexemeId('adj', 'floating'),
    lemma: 'floating',
    variants: ['independent', 'loose coupling', 'free-floating'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_cohesion'),
      direction: 'decrease',
    },
    description: 'Rhythmic independence between elements',
    examples: [
      'let the melody float',
      'make it more independent',
      'reduce coupling',
    ],
  },
] as const;

// =============================================================================
// Temporal Flow and Pacing
// =============================================================================

/**
 * Temporal flow, pacing, and momentum descriptors.
 *
 * Covers:
 * - Fast vs. slow pacing
 * - Accelerating vs. decelerating
 * - Flowing vs. choppy
 * - Continuous vs. interrupted
 */
const TEMPORAL_FLOW_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'fast_paced'),
    lemma: 'fast-paced',
    variants: ['quick', 'rapid', 'up-tempo'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('tempo'),
      direction: 'increase',
    },
    description: 'Quick temporal pace and high tempo',
    examples: [
      'make it faster',
      'speed up the tempo',
      'increase the pace',
    ],
  },
  {
    id: createLexemeId('adj', 'slow_paced'),
    lemma: 'slow-paced',
    variants: ['slow', 'leisurely', 'down-tempo'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('tempo'),
      direction: 'decrease',
    },
    description: 'Slow temporal pace and low tempo',
    examples: [
      'slow it down',
      'reduce the tempo',
      'make it more leisurely',
    ],
  },
  {
    id: createLexemeId('adj', 'accelerating'),
    lemma: 'accelerating',
    variants: ['speeding up', 'rushing', 'accelerando'],
    category: 'adj',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('tempo_change'),
      role: 'modifier',
      actionType: 'accelerate',
    },
    description: 'Gradually increasing tempo',
    examples: [
      'add an accelerando',
      'speed up gradually',
      'create acceleration',
    ],
  },
  {
    id: createLexemeId('adj', 'decelerating'),
    lemma: 'decelerating',
    variants: ['slowing down', 'ritardando', 'rallentando'],
    category: 'adj',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('tempo_change'),
      role: 'modifier',
      actionType: 'decelerate',
    },
    description: 'Gradually decreasing tempo',
    examples: [
      'add a ritardando',
      'slow down gradually',
      'create deceleration',
    ],
  },
  {
    id: createLexemeId('adj', 'flowing'),
    lemma: 'flowing',
    variants: ['fluid', 'smooth flow', 'continuous'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('temporal_continuity'),
      direction: 'increase',
    },
    description: 'Smooth, continuous temporal flow',
    examples: [
      'make it more flowing',
      'create fluid motion',
      'increase continuity',
    ],
  },
  {
    id: createLexemeId('adj', 'choppy'),
    lemma: 'choppy',
    variants: ['jerky', 'interrupted', 'fragmented'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('temporal_continuity'),
      direction: 'decrease',
    },
    description: 'Broken, interrupted temporal flow',
    examples: [
      'make it choppier',
      'add interruptions',
      'fragment the flow',
    ],
  },
  {
    id: createLexemeId('adj', 'steady'),
    lemma: 'steady',
    variants: ['constant', 'unwavering', 'stable tempo'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('tempo_stability'),
      direction: 'increase',
    },
    description: 'Consistent, unchanging tempo',
    examples: [
      'keep it steady',
      'maintain constant tempo',
      'stabilize the timing',
    ],
  },
  {
    id: createLexemeId('adj', 'fluctuating'),
    lemma: 'fluctuating',
    variants: ['varying tempo', 'rubato', 'flexible tempo'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('tempo_stability'),
      direction: 'decrease',
    },
    description: 'Varying tempo with expressive flexibility',
    examples: [
      'add tempo fluctuation',
      'create rubato',
      'vary the tempo',
    ],
  },
] as const;

// =============================================================================
// Metric Characteristics
// =============================================================================

/**
 * Metric and subdivision descriptors.
 *
 * Covers:
 * - Simple vs. compound meters
 * - Regular vs. irregular
 * - Strong vs. weak beats
 * - Syncopated vs. on-beat
 */
const METRIC_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'simple_meter'),
    lemma: 'simple meter',
    variants: ['simple time', 'duple', 'triple'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'meter',
      meterType: 'simple',
    },
    description: 'Meter with beat subdivisions in groups of 2 or 3',
    examples: [
      'use simple meter',
      'change to 4/4',
      'make it duple time',
    ],
  },
  {
    id: createLexemeId('adj', 'compound_meter'),
    lemma: 'compound meter',
    variants: ['compound time', '6/8 feel', '9/8 feel'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'meter',
      meterType: 'compound',
    },
    description: 'Meter with beat subdivisions in groups of 3',
    examples: [
      'use compound meter',
      'change to 6/8',
      'add compound feel',
    ],
  },
  {
    id: createLexemeId('adj', 'regular_meter'),
    lemma: 'regular',
    variants: ['even meter', 'standard time'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'meter',
      regularity: 'regular',
    },
    description: 'Consistent, predictable metric pattern',
    examples: [
      'use regular meter',
      'keep it even',
      'maintain standard time',
    ],
  },
  {
    id: createLexemeId('adj', 'irregular_meter'),
    lemma: 'irregular',
    variants: ['asymmetric', 'odd meter', 'complex meter'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'meter',
      regularity: 'irregular',
    },
    description: 'Asymmetric or changing metric pattern',
    examples: [
      'use irregular meter',
      'add odd time',
      'create asymmetric feel',
    ],
  },
  {
    id: createLexemeId('adj', 'syncopated'),
    lemma: 'syncopated',
    variants: ['off-beat', 'syncopation', 'upbeat accents'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('syncopation'),
      direction: 'increase',
    },
    description: 'Emphasis on weak beats or off-beat positions',
    examples: [
      'add syncopation',
      'make it more syncopated',
      'accent the off-beats',
    ],
  },
  {
    id: createLexemeId('adj', 'on_beat'),
    lemma: 'on-beat',
    variants: ['downbeat', 'strong beats', 'on the one'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('syncopation'),
      direction: 'decrease',
    },
    description: 'Emphasis on strong beats and downbeats',
    examples: [
      'put it on the beat',
      'emphasize downbeats',
      'reduce syncopation',
    ],
  },
  {
    id: createLexemeId('adj', 'accented'),
    lemma: 'accented',
    variants: ['emphasized beats', 'strong accents'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('accent_strength'),
      direction: 'increase',
    },
    description: 'Strong emphasis on particular beats',
    examples: [
      'add accents',
      'emphasize the beats',
      'strengthen the accents',
    ],
  },
  {
    id: createLexemeId('adj', 'even_accents'),
    lemma: 'even',
    variants: ['unaccented', 'uniform', 'flat dynamics'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('accent_strength'),
      direction: 'decrease',
    },
    description: 'Equal emphasis across all beats',
    examples: [
      'even out the accents',
      'reduce accent strength',
      'make it uniform',
    ],
  },
] as const;

// =============================================================================
// Rhythmic Complexity
// =============================================================================

/**
 * Rhythmic complexity and regularity descriptors.
 *
 * Covers:
 * - Simple vs. complex rhythms
 * - Regular vs. irregular patterns
 * - Dense vs. sparse rhythmic activity
 * - Predictable vs. surprising
 */
const RHYTHMIC_COMPLEXITY_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'simple_rhythm'),
    lemma: 'simple',
    variants: ['basic rhythm', 'straightforward', 'uncomplicated'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_complexity'),
      direction: 'decrease',
    },
    description: 'Basic, easy-to-follow rhythmic patterns',
    examples: [
      'simplify the rhythm',
      'make it more basic',
      'reduce complexity',
    ],
  },
  {
    id: createLexemeId('adj', 'complex_rhythm'),
    lemma: 'complex',
    variants: ['intricate', 'sophisticated', 'elaborate'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_complexity'),
      direction: 'increase',
    },
    description: 'Intricate, sophisticated rhythmic patterns',
    examples: [
      'add rhythmic complexity',
      'make it more intricate',
      'elaborate the pattern',
    ],
  },
  {
    id: createLexemeId('adj', 'regular_pattern'),
    lemma: 'regular',
    variants: ['repeating', 'cyclical', 'periodic'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('pattern_regularity'),
      direction: 'increase',
    },
    description: 'Consistent, repeating rhythmic pattern',
    examples: [
      'make it more regular',
      'create repeating pattern',
      'add periodicity',
    ],
  },
  {
    id: createLexemeId('adj', 'irregular_pattern'),
    lemma: 'irregular',
    variants: ['varied', 'unpredictable', 'non-repeating'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('pattern_regularity'),
      direction: 'decrease',
    },
    description: 'Varied, unpredictable rhythmic pattern',
    examples: [
      'make it more irregular',
      'vary the pattern',
      'add unpredictability',
    ],
  },
  {
    id: createLexemeId('adj', 'busy_rhythm'),
    lemma: 'busy',
    variants: ['active', 'dense rhythm', 'many notes'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_density'),
      direction: 'increase',
    },
    description: 'High density of rhythmic events',
    examples: [
      'make it busier',
      'add more notes',
      'increase activity',
    ],
  },
  {
    id: createLexemeId('adj', 'sparse_rhythm'),
    lemma: 'sparse',
    variants: ['minimal', 'spacious rhythm', 'few notes'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_density'),
      direction: 'decrease',
    },
    description: 'Low density of rhythmic events',
    examples: [
      'make it more sparse',
      'remove some notes',
      'reduce activity',
    ],
  },
  {
    id: createLexemeId('adj', 'predictable_rhythm'),
    lemma: 'predictable',
    variants: ['expected', 'obvious', 'foreseeable'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_surprise'),
      direction: 'decrease',
    },
    description: 'Expected, unsurprising rhythmic patterns',
    examples: [
      'make it more predictable',
      'reduce surprises',
      'simplify the pattern',
    ],
  },
  {
    id: createLexemeId('adj', 'surprising_rhythm'),
    lemma: 'surprising',
    variants: ['unexpected', 'unpredictable', 'irregular accents'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('rhythmic_surprise'),
      direction: 'increase',
    },
    description: 'Unexpected, surprising rhythmic patterns',
    examples: [
      'add surprises',
      'make it less predictable',
      'create unexpected accents',
    ],
  },
] as const;

// =============================================================================
// Temporal Relationships
// =============================================================================

/**
 * Temporal relationships and coordination descriptors.
 *
 * Covers:
 * - Parallel vs. sequential
 * - Simultaneous vs. staggered
 * - Coordinated vs. independent
 * - Call-and-response patterns
 */
const TEMPORAL_RELATIONSHIP_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'parallel'),
    lemma: 'parallel',
    variants: ['simultaneous', 'at the same time', 'together'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'temporal_relationship',
      relationship: 'parallel',
    },
    description: 'Events occurring at the same time',
    examples: [
      'play in parallel',
      'happen simultaneously',
      'occur together',
    ],
  },
  {
    id: createLexemeId('adj', 'sequential'),
    lemma: 'sequential',
    variants: ['one after another', 'in sequence', 'successive'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'temporal_relationship',
      relationship: 'sequential',
    },
    description: 'Events occurring one after another',
    examples: [
      'play sequentially',
      'happen in sequence',
      'occur successively',
    ],
  },
  {
    id: createLexemeId('adj', 'staggered'),
    lemma: 'staggered',
    variants: ['offset timing', 'delayed entries', 'cascading'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'temporal_relationship',
      relationship: 'staggered',
    },
    description: 'Events with intentional timing offsets',
    examples: [
      'stagger the entries',
      'add timing delays',
      'create cascading effect',
    ],
  },
  {
    id: createLexemeId('adj', 'coordinated'),
    lemma: 'coordinated',
    variants: ['synchronized', 'aligned', 'in sync'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('temporal_coordination'),
      direction: 'increase',
    },
    description: 'Temporally aligned and coordinated',
    examples: [
      'coordinate the parts',
      'align the timing',
      'synchronize them',
    ],
  },
  {
    id: createLexemeId('adj', 'independent'),
    lemma: 'independent',
    variants: ['separate', 'autonomous', 'uncoordinated'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('temporal_coordination'),
      direction: 'decrease',
    },
    description: 'Temporally independent and autonomous',
    examples: [
      'make them independent',
      'separate the timing',
      'reduce coordination',
    ],
  },
  {
    id: createLexemeId('noun', 'call_and_response'),
    lemma: 'call-and-response',
    variants: ['call and answer', 'antiphonal', 'question-answer'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'temporal_pattern',
      pattern: 'call_and_response',
    },
    description: 'Alternating pattern between two elements',
    examples: [
      'add call-and-response',
      'create antiphonal pattern',
      'alternate between parts',
    ],
  },
  {
    id: createLexemeId('adj', 'interlocking'),
    lemma: 'interlocking',
    variants: ['hocket', 'complementary rhythms'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'temporal_pattern',
      pattern: 'interlocking',
    },
    description: 'Parts that fit together to form complete rhythm',
    examples: [
      'create interlocking rhythms',
      'add hocket pattern',
      'make them complementary',
    ],
  },
  {
    id: createLexemeId('adj', 'overlapping'),
    lemma: 'overlapping',
    variants: ['cascading', 'layered timing'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      aspect: 'temporal_pattern',
      pattern: 'overlapping',
    },
    description: 'Parts that overlap in time',
    examples: [
      'create overlapping entries',
      'add cascading pattern',
      'layer the timing',
    ],
  },
] as const;

// =============================================================================
// Combined Exports
// =============================================================================

/**
 * All rhythmic and temporal vocabulary entries from Batch 57.
 */
export const RHYTHMIC_TEMPORAL_BATCH_57: readonly Lexeme[] = [
  ...RHYTHMIC_FEEL_DESCRIPTORS,
  ...TIMING_DESCRIPTORS,
  ...TEMPORAL_FLOW_DESCRIPTORS,
  ...METRIC_DESCRIPTORS,
  ...RHYTHMIC_COMPLEXITY_DESCRIPTORS,
  ...TEMPORAL_RELATIONSHIP_DESCRIPTORS,
] as const;

/**
 * Count of entries in Batch 57.
 */
export const BATCH_57_COUNT = RHYTHMIC_TEMPORAL_BATCH_57.length;

/**
 * Categories covered in Batch 57.
 */
export const BATCH_57_CATEGORIES = [
  'Rhythmic Feel (8 entries)',
  'Timing and Synchronization (8 entries)',
  'Temporal Flow and Pacing (8 entries)',
  'Metric Characteristics (8 entries)',
  'Rhythmic Complexity (8 entries)',
  'Temporal Relationships (8 entries)',
] as const;

/**
 * Summary of Batch 57.
 */
export const BATCH_57_SUMMARY = {
  batchNumber: 57,
  name: 'Rhythmic and Temporal Descriptors',
  entryCount: BATCH_57_COUNT,
  categories: BATCH_57_CATEGORIES,
  description:
    'Comprehensive vocabulary for rhythmic feel, timing, temporal flow, ' +
    'metric patterns, complexity, and temporal relationships in music.',
} as const;
