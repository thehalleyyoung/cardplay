/**
 * GOFAI Canon — Production and Mixing Terminology Vocabulary (Batch 63)
 *
 * Comprehensive vocabulary for audio production, mixing, and sound design:
 * - Mix balance and levels
 * - Spatial positioning (panning, width, depth)
 * - Frequency content and EQ
 * - Dynamics processing
 * - Time-based effects (reverb, delay, modulation)
 * - Distortion and saturation
 * - Clarity and definition
 * - Professional mixing terminology
 *
 * This batch provides natural language coverage for production and mixing
 * decisions in the context of music creation.
 *
 * @module gofai/canon/production-mixing-batch63
 */

import {
  type Lexeme,
  createLexemeId,
  createAxisId,
} from './types';

// =============================================================================
// Mix Balance and Levels
// =============================================================================

/**
 * Mix balance and level descriptors.
 *
 * Covers:
 * - Loud vs quiet
 * - Balanced vs unbalanced
 * - Forward vs back
 * - Prominent vs subdued
 */
const MIX_BALANCE_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'loud'),
    lemma: 'loud',
    variants: ['louder', 'high level', 'hot', 'boosted'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('level'),
      direction: 'increase',
    },
    description: 'Louder level (increased volume)',
    examples: [
      'make it loud',
      'louder mix',
      'boost the level',
      'turn it up',
    ],
  },
  {
    id: createLexemeId('adj', 'quiet'),
    lemma: 'quiet',
    variants: ['quieter', 'low level', 'soft', 'reduced'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('level'),
      direction: 'decrease',
    },
    description: 'Quieter level (decreased volume)',
    examples: [
      'make it quiet',
      'quieter mix',
      'reduce the level',
      'turn it down',
    ],
  },
  {
    id: createLexemeId('adj', 'balanced'),
    lemma: 'balanced',
    variants: ['even', 'proportional', 'well-balanced'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'balance',
    },
    description: 'Balanced mix (all elements proportionate)',
    examples: [
      'balanced mix',
      'even levels',
      'well-proportioned',
      'good balance',
    ],
  },
  {
    id: createLexemeId('adj', 'forward'),
    lemma: 'forward',
    variants: ['upfront', 'prominent', 'in front', 'featured'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('mix_depth'),
      direction: 'decrease',
    },
    description: 'Forward in mix (prominent, upfront)',
    examples: [
      'bring it forward',
      'more upfront',
      'prominent in mix',
      'feature it',
    ],
  },
  {
    id: createLexemeId('adj', 'back'),
    lemma: 'back',
    variants: ['recessed', 'subdued', 'behind', 'background'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('mix_depth'),
      direction: 'increase',
    },
    description: 'Back in mix (recessed, subdued)',
    examples: [
      'push it back',
      'more recessed',
      'subdued in mix',
      'background element',
    ],
  },
  {
    id: createLexemeId('adj', 'centered'),
    lemma: 'centered',
    variants: ['center', 'middle', 'mono'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('pan_position'),
      direction: 'decrease',
    },
    description: 'Centered pan position',
    examples: [
      'center it',
      'middle position',
      'mono placement',
      'centered image',
    ],
  },
  {
    id: createLexemeId('adj', 'wide_mix'),
    lemma: 'wide',
    variants: ['wider', 'spread', 'stereo'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('stereo_width'),
      direction: 'increase',
    },
    description: 'Wide stereo image (spread across panorama)',
    examples: [
      'wider mix',
      'spread it out',
      'stereo width',
      'expand the image',
    ],
  },
  {
    id: createLexemeId('adj', 'narrow_mix'),
    lemma: 'narrow',
    variants: ['narrower', 'focused', 'tight'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('stereo_width'),
      direction: 'decrease',
    },
    description: 'Narrow stereo image (more focused)',
    examples: [
      'narrower mix',
      'focus it',
      'tighter image',
      'reduce width',
    ],
  },
];

// =============================================================================
// Spatial Positioning
// =============================================================================

/**
 * Spatial positioning and imaging descriptors.
 *
 * Covers:
 * - Left vs right panning
 * - Depth and distance
 * - Height and dimension
 * - Spatial clarity
 */
const SPATIAL_POSITIONING_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'left'),
    lemma: 'left',
    variants: ['leftward', 'left side', 'panned left'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'pan_direction',
    },
    description: 'Panned to the left',
    examples: [
      'pan left',
      'left side',
      'move to left',
      'leftward placement',
    ],
  },
  {
    id: createLexemeId('adj', 'right'),
    lemma: 'right',
    variants: ['rightward', 'right side', 'panned right'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'pan_direction',
    },
    description: 'Panned to the right',
    examples: [
      'pan right',
      'right side',
      'move to right',
      'rightward placement',
    ],
  },
  {
    id: createLexemeId('adj', 'close_sound'),
    lemma: 'close',
    variants: ['intimate', 'near', 'dry', 'direct'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('perceived_distance'),
      direction: 'decrease',
    },
    description: 'Close/intimate sound (less reverb, more direct)',
    examples: [
      'closer sound',
      'intimate feel',
      'dry and direct',
      'in your face',
    ],
  },
  {
    id: createLexemeId('adj', 'distant'),
    lemma: 'distant',
    variants: ['far', 'remote', 'spacious', 'ambient'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('perceived_distance'),
      direction: 'increase',
    },
    description: 'Distant sound (more reverb, less direct)',
    examples: [
      'more distant',
      'far away',
      'spacious feel',
      'ambient depth',
    ],
  },
  {
    id: createLexemeId('adj', 'tall'),
    lemma: 'tall',
    variants: ['elevated', 'high', 'above'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'height',
    },
    description: 'Tall/elevated spatial positioning',
    examples: [
      'tall image',
      'elevated sound',
      'height dimension',
      'above the mix',
    ],
  },
  {
    id: createLexemeId('adj', 'enveloping'),
    lemma: 'enveloping',
    variants: ['immersive', 'surrounding', 'encompassing'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'spatial_character',
    },
    description: 'Enveloping spatial character (surround-like)',
    examples: [
      'enveloping sound',
      'immersive space',
      'surrounding texture',
      'encompassing feel',
    ],
  },
  {
    id: createLexemeId('adj', 'point_source'),
    lemma: 'point source',
    variants: ['focused', 'localized', 'pinpoint'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'spatial_character',
    },
    description: 'Point source imaging (clearly localized)',
    examples: [
      'point source',
      'focused image',
      'localized sound',
      'pinpoint placement',
    ],
  },
  {
    id: createLexemeId('adj', 'diffuse'),
    lemma: 'diffuse',
    variants: ['spread', 'unfocused', 'ambient'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('spatial_diffusion'),
      direction: 'increase',
    },
    description: 'Diffuse spatial character (spread out)',
    examples: [
      'diffuse sound',
      'spread out',
      'unfocused image',
      'ambient texture',
    ],
  },
];

// =============================================================================
// Frequency Content and EQ
// =============================================================================

/**
 * Frequency content and equalization descriptors.
 *
 * Covers:
 * - Bright vs dark
 * - Warm vs cold
 * - Thin vs thick
 * - Frequency emphasis
 */
const FREQUENCY_EQ_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'bright'),
    lemma: 'bright',
    variants: ['brighter', 'sparkle', 'airy', 'crisp'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('brightness'),
      direction: 'increase',
    },
    description: 'Bright frequency content (more high frequencies)',
    examples: [
      'brighter sound',
      'add sparkle',
      'airy top end',
      'crisp highs',
    ],
  },
  {
    id: createLexemeId('adj', 'dark'),
    lemma: 'dark',
    variants: ['darker', 'dull', 'mellow', 'rolled off'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('brightness'),
      direction: 'decrease',
    },
    description: 'Dark frequency content (less high frequencies)',
    examples: [
      'darker sound',
      'dull the highs',
      'mellow tone',
      'roll off top',
    ],
  },
  {
    id: createLexemeId('adj', 'warm'),
    lemma: 'warm',
    variants: ['warmer', 'full', 'rich', 'smooth'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('warmth'),
      direction: 'increase',
    },
    description: 'Warm tone (emphasized low-mids)',
    examples: [
      'warmer sound',
      'full tone',
      'rich body',
      'smooth warmth',
    ],
  },
  {
    id: createLexemeId('adj', 'cold'),
    lemma: 'cold',
    variants: ['colder', 'clinical', 'sterile', 'thin'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('warmth'),
      direction: 'decrease',
    },
    description: 'Cold tone (reduced low-mids)',
    examples: [
      'colder sound',
      'clinical tone',
      'sterile quality',
      'thin body',
    ],
  },
  {
    id: createLexemeId('adj', 'bassy'),
    lemma: 'bassy',
    variants: ['bass-heavy', 'boomy', 'low-end', 'bottom-heavy'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('bass_content'),
      direction: 'increase',
    },
    description: 'Emphasized bass frequencies',
    examples: [
      'more bassy',
      'bass-heavy mix',
      'boost low end',
      'bottom-heavy',
    ],
  },
  {
    id: createLexemeId('adj', 'lightweight'),
    lemma: 'lightweight',
    variants: ['light', 'lacking bass', 'thin bottom'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('bass_content'),
      direction: 'decrease',
    },
    description: 'Reduced bass frequencies',
    examples: [
      'more lightweight',
      'light bottom',
      'reduce bass',
      'thin low end',
    ],
  },
  {
    id: createLexemeId('adj', 'midrange_rich'),
    lemma: 'midrange-rich',
    variants: ['mid-forward', 'present', 'bold mids'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('midrange_presence'),
      direction: 'increase',
    },
    description: 'Emphasized midrange frequencies',
    examples: [
      'midrange-rich',
      'mid-forward mix',
      'present mids',
      'bold midrange',
    ],
  },
  {
    id: createLexemeId('adj', 'scooped'),
    lemma: 'scooped',
    variants: ['mid-scooped', 'hollow', 'reduced mids'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('midrange_presence'),
      direction: 'decrease',
    },
    description: 'Scooped mids (V-shaped EQ)',
    examples: [
      'scooped sound',
      'mid-scooped mix',
      'hollow tone',
      'reduce midrange',
    ],
  },
];

// =============================================================================
// Dynamics and Processing
// =============================================================================

/**
 * Dynamics and processing descriptors.
 *
 * Covers:
 * - Compressed vs dynamic
 * - Punchy vs smooth
 * - Controlled vs natural
 * - Transient character
 */
const DYNAMICS_PROCESSING_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'compressed'),
    lemma: 'compressed',
    variants: ['squashed', 'controlled', 'tight dynamics'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('dynamic_range'),
      direction: 'decrease',
    },
    description: 'Compressed dynamics (reduced dynamic range)',
    examples: [
      'more compressed',
      'squash the dynamics',
      'tight control',
      'even levels',
    ],
  },
  {
    id: createLexemeId('adj', 'dynamic'),
    lemma: 'dynamic',
    variants: ['expressive', 'wide range', 'varied'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('dynamic_range'),
      direction: 'increase',
    },
    description: 'Dynamic (wide dynamic range)',
    examples: [
      'more dynamic',
      'expressive range',
      'wide dynamics',
      'varied levels',
    ],
  },
  {
    id: createLexemeId('adj', 'punchy'),
    lemma: 'punchy',
    variants: ['impactful', 'strong transients', 'hitting hard'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('punchiness'),
      direction: 'increase',
    },
    description: 'Punchy sound (strong transients, impact)',
    examples: [
      'more punchy',
      'impactful hits',
      'strong transients',
      'hitting hard',
    ],
  },
  {
    id: createLexemeId('adj', 'smooth_dynamics'),
    lemma: 'smooth',
    variants: ['gentle', 'soft transients', 'rounded'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('punchiness'),
      direction: 'decrease',
    },
    description: 'Smooth dynamics (gentle transients)',
    examples: [
      'smoother sound',
      'gentle impact',
      'soft transients',
      'rounded attack',
    ],
  },
  {
    id: createLexemeId('adj', 'limited'),
    lemma: 'limited',
    variants: ['maxed', 'brick-walled', 'loud'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'limiting',
    },
    description: 'Limited (peak limiting, maximized loudness)',
    examples: [
      'limited master',
      'maxed out',
      'brick-wall limit',
      'loud master',
    ],
  },
  {
    id: createLexemeId('adj', 'gated'),
    lemma: 'gated',
    variants: ['noise-gated', 'cut off', 'hard stop'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'gating',
    },
    description: 'Gated (noise gate applied)',
    examples: [
      'gated drums',
      'noise-gated',
      'hard cutoff',
      'tight gate',
    ],
  },
  {
    id: createLexemeId('adj', 'ducked'),
    lemma: 'ducked',
    variants: ['side-chained', 'pumping', 'breathing'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'ducking',
    },
    description: 'Ducked (side-chain compression)',
    examples: [
      'ducked bass',
      'side-chained',
      'pumping effect',
      'breathing mix',
    ],
  },
  {
    id: createLexemeId('adj', 'parallel'),
    lemma: 'parallel',
    variants: ['parallel compressed', 'NY compression', 'blended'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'processing_style',
    },
    description: 'Parallel processing (dry/wet blend)',
    examples: [
      'parallel compression',
      'NY style',
      'blend processed',
      'parallel chain',
    ],
  },
];

// =============================================================================
// Effects and Time Domain
// =============================================================================

/**
 * Effects and time-domain processing descriptors.
 *
 * Covers:
 * - Reverb characteristics
 * - Delay and echo
 * - Modulation effects
 * - Wet vs dry
 */
const EFFECTS_TIME_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'reverberant'),
    lemma: 'reverberant',
    variants: ['reverb', 'spacious', 'roomy', 'wet'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('reverb_amount'),
      direction: 'increase',
    },
    description: 'Reverberant (more reverb, spacious)',
    examples: [
      'more reverberant',
      'add reverb',
      'spacious sound',
      'roomy feel',
    ],
  },
  {
    id: createLexemeId('adj', 'dry'),
    lemma: 'dry',
    variants: ['dead', 'close', 'direct', 'no reverb'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('reverb_amount'),
      direction: 'decrease',
    },
    description: 'Dry (less reverb, direct)',
    examples: [
      'more dry',
      'remove reverb',
      'close sound',
      'direct signal',
    ],
  },
  {
    id: createLexemeId('adj', 'delayed'),
    lemma: 'delayed',
    variants: ['with delay', 'echoing', 'repeating'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('delay_amount'),
      direction: 'increase',
    },
    description: 'Delayed (delay/echo effect)',
    examples: [
      'add delay',
      'with echo',
      'repeating sound',
      'delay effect',
    ],
  },
  {
    id: createLexemeId('adj', 'modulated'),
    lemma: 'modulated',
    variants: ['chorus', 'flanged', 'phased', 'wobbling'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('modulation_depth'),
      direction: 'increase',
    },
    description: 'Modulated (chorus, flanger, phaser, etc.)',
    examples: [
      'add modulation',
      'chorus effect',
      'flanged sound',
      'phased tone',
    ],
  },
  {
    id: createLexemeId('adj', 'saturated'),
    lemma: 'saturated',
    variants: ['driven', 'colored', 'harmonics'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('saturation'),
      direction: 'increase',
    },
    description: 'Saturated (harmonic saturation, warmth)',
    examples: [
      'saturated sound',
      'driven tone',
      'colored signal',
      'add harmonics',
    ],
  },
  {
    id: createLexemeId('adj', 'distorted'),
    lemma: 'distorted',
    variants: ['overdriven', 'fuzzy', 'gritty', 'dirty'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('distortion'),
      direction: 'increase',
    },
    description: 'Distorted (overdrive, fuzz, grit)',
    examples: [
      'distorted sound',
      'overdriven tone',
      'fuzzy texture',
      'gritty edge',
    ],
  },
  {
    id: createLexemeId('adj', 'clean'),
    lemma: 'clean',
    variants: ['pristine', 'pure', 'unprocessed', 'transparent'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('cleanliness'),
      direction: 'increase',
    },
    description: 'Clean sound (minimal processing, transparent)',
    examples: [
      'clean sound',
      'pristine quality',
      'pure tone',
      'transparent mix',
    ],
  },
  {
    id: createLexemeId('adj', 'filtered'),
    lemma: 'filtered',
    variants: ['swept', 'resonant', 'vowel-like'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'filtering',
    },
    description: 'Filtered (resonant filtering applied)',
    examples: [
      'filtered sound',
      'swept filter',
      'resonant tone',
      'vowel-like quality',
    ],
  },
];

// =============================================================================
// Clarity and Definition
// =============================================================================

/**
 * Clarity, definition, and separation descriptors.
 *
 * Covers:
 * - Clear vs muddy
 * - Defined vs blurred
 * - Separated vs cluttered
 * - Focus and precision
 */
const CLARITY_DEFINITION_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'clear'),
    lemma: 'clear',
    variants: ['clearer', 'transparent', 'defined', 'articulate'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('clarity'),
      direction: 'increase',
    },
    description: 'Clear mix (well-defined, articulate)',
    examples: [
      'clearer mix',
      'transparent sound',
      'well-defined',
      'articulate texture',
    ],
  },
  {
    id: createLexemeId('adj', 'muddy'),
    lemma: 'muddy',
    variants: ['cloudy', 'murky', 'unclear', 'congested'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('clarity'),
      direction: 'decrease',
    },
    description: 'Muddy mix (unclear, congested)',
    examples: [
      'muddy mix',
      'cloudy sound',
      'murky texture',
      'congested low-mid',
    ],
  },
  {
    id: createLexemeId('adj', 'separated'),
    lemma: 'separated',
    variants: ['distinct', 'isolated', 'independent'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('separation'),
      direction: 'increase',
    },
    description: 'Well-separated elements (good definition)',
    examples: [
      'well-separated',
      'distinct elements',
      'isolated parts',
      'clear separation',
    ],
  },
  {
    id: createLexemeId('adj', 'cluttered'),
    lemma: 'cluttered',
    variants: ['crowded', 'busy', 'overlapping', 'messy'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('separation'),
      direction: 'decrease',
    },
    description: 'Cluttered mix (elements competing)',
    examples: [
      'cluttered mix',
      'crowded sound',
      'busy texture',
      'overlapping elements',
    ],
  },
  {
    id: createLexemeId('adj', 'focused'),
    lemma: 'focused',
    variants: ['sharp', 'precise', 'tight', 'controlled'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('focus'),
      direction: 'increase',
    },
    description: 'Focused sound (precise, well-controlled)',
    examples: [
      'focused mix',
      'sharp sound',
      'precise image',
      'tight control',
    ],
  },
  {
    id: createLexemeId('adj', 'diffuse_mix'),
    lemma: 'diffuse',
    variants: ['blurred', 'vague', 'unfocused', 'soft'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('focus'),
      direction: 'decrease',
    },
    description: 'Diffuse sound (blurred, soft focus)',
    examples: [
      'diffuse mix',
      'blurred image',
      'vague placement',
      'soft focus',
    ],
  },
  {
    id: createLexemeId('adj', 'hifi'),
    lemma: 'hi-fi',
    variants: ['high fidelity', 'detailed', 'pristine'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'fidelity',
    },
    description: 'High-fidelity sound (detailed, pristine)',
    examples: [
      'hi-fi mix',
      'high fidelity',
      'detailed sound',
      'pristine quality',
    ],
  },
  {
    id: createLexemeId('adj', 'lofi'),
    lemma: 'lo-fi',
    variants: ['low fidelity', 'degraded', 'vintage'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'production',
      aspect: 'fidelity',
    },
    description: 'Low-fidelity sound (intentionally degraded)',
    examples: [
      'lo-fi mix',
      'low fidelity',
      'degraded sound',
      'vintage quality',
    ],
  },
];

// =============================================================================
// Export Combined Vocabulary
// =============================================================================

/**
 * All production and mixing vocabulary entries from Batch 63.
 */
export const PRODUCTION_MIXING_BATCH_63: readonly Lexeme[] = [
  ...MIX_BALANCE_LEXEMES,
  ...SPATIAL_POSITIONING_LEXEMES,
  ...FREQUENCY_EQ_LEXEMES,
  ...DYNAMICS_PROCESSING_LEXEMES,
  ...EFFECTS_TIME_LEXEMES,
  ...CLARITY_DEFINITION_LEXEMES,
];

/**
 * Count of entries in Batch 63.
 */
export const BATCH_63_COUNT = PRODUCTION_MIXING_BATCH_63.length;

/**
 * Batch 63 summary for documentation.
 */
export const BATCH_63_SUMMARY = {
  batchNumber: 63,
  name: 'Production and Mixing Terminology',
  entryCount: BATCH_63_COUNT,
  categories: [
    'Mix balance and levels (loud/quiet, forward/back, etc.)',
    'Spatial positioning (panning, depth, width, etc.)',
    'Frequency content and EQ (bright/dark, warm/cold, etc.)',
    'Dynamics and processing (compressed/dynamic, punchy/smooth, etc.)',
    'Effects and time domain (reverb, delay, modulation, etc.)',
    'Clarity and definition (clear/muddy, separated/cluttered, etc.)',
  ],
  axesIntroduced: [
    'level',
    'mix_depth',
    'pan_position',
    'stereo_width',
    'perceived_distance',
    'spatial_diffusion',
    'brightness',
    'warmth',
    'bass_content',
    'midrange_presence',
    'dynamic_range',
    'punchiness',
    'reverb_amount',
    'delay_amount',
    'modulation_depth',
    'saturation',
    'distortion',
    'cleanliness',
    'clarity',
    'separation',
    'focus',
  ],
  conceptsDefined: [
    'mix_balance',
    'spatial_imaging',
    'frequency_shaping',
    'dynamics_control',
    'time_effects',
    'clarity_definition',
    'production_fidelity',
  ],
} as const;
