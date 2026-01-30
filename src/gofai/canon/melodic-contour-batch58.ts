/**
 * GOFAI Canon — Melodic Contour and Shape Vocabulary (Batch 58)
 *
 * Comprehensive vocabulary for melodic contour, shape, and movement descriptors:
 * - Directional movement (ascending, descending, static)
 * - Contour shapes (arch, wave, step, leap)
 * - Register and range characteristics
 * - Melodic interval patterns
 * - Ornamentation and embellishment
 * - Melodic complexity and predictability
 *
 * This batch provides natural language coverage for describing melodic
 * characteristics in composition and performance.
 *
 * @module gofai/canon/melodic-contour-batch58
 */

import {
  type Lexeme,
  type LexemeId,
  type AxisId,
  createLexemeId,
  createAxisId,
} from './types';

// =============================================================================
// Directional Movement
// =============================================================================

/**
 * Melodic directional movement descriptors.
 *
 * Covers:
 * - Ascending vs. descending
 * - Rising vs. falling
 * - Climbing vs. dropping
 * - Static vs. moving
 */
const DIRECTIONAL_MOVEMENT_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'ascending'),
    lemma: 'ascending',
    variants: ['rising', 'going up', 'upward', 'climbing'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_direction'),
      direction: 'increase',
    },
    description: 'Melodic line moving upward in pitch',
    examples: [
      'make it ascending',
      'create an upward line',
      'add a rising melody',
    ],
  },
  {
    id: createLexemeId('adj', 'descending'),
    lemma: 'descending',
    variants: ['falling', 'going down', 'downward', 'dropping'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_direction'),
      direction: 'decrease',
    },
    description: 'Melodic line moving downward in pitch',
    examples: [
      'make it descending',
      'create a downward line',
      'add a falling melody',
    ],
  },
  {
    id: createLexemeId('adj', 'static-pitch'),
    lemma: 'static',
    variants: ['monotone', 'flat', 'unchanging pitch', 'pedal'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_motion'),
      direction: 'decrease',
    },
    description: 'Melodic line staying on the same pitch',
    examples: [
      'make it static',
      'create a pedal tone',
      'flatten the pitch',
    ],
  },
  {
    id: createLexemeId('adj', 'undulating'),
    lemma: 'undulating',
    variants: ['wave-like', 'oscillating', 'alternating up and down'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'contour',
      shape: 'undulating',
    },
    description: 'Melodic line with alternating rise and fall',
    examples: [
      'make it undulating',
      'create wave-like motion',
      'add oscillation',
    ],
  },
  {
    id: createLexemeId('adj', 'zigzag'),
    lemma: 'zigzag',
    variants: ['angular', 'jagged', 'back-and-forth'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'contour',
      shape: 'zigzag',
    },
    description: 'Melodic line with sharp directional changes',
    examples: [
      'make it zigzag',
      'create angular motion',
      'add jagged contour',
    ],
  },
  {
    id: createLexemeId('adj', 'arching'),
    lemma: 'arching',
    variants: ['arch-shaped', 'parabolic', 'inverted U'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'contour',
      shape: 'arch',
    },
    description: 'Melodic line rising then falling (arch shape)',
    examples: [
      'create an arching melody',
      'add arch-shaped contour',
      'make it parabolic',
    ],
  },
  {
    id: createLexemeId('adj', 'inverted-arch'),
    lemma: 'inverted arch',
    variants: ['valley', 'dip', 'U-shaped'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'contour',
      shape: 'inverted_arch',
    },
    description: 'Melodic line falling then rising (inverted arch)',
    examples: [
      'create valley shape',
      'add dip contour',
      'make it U-shaped',
    ],
  },
  {
    id: createLexemeId('adj', 'terraced'),
    lemma: 'terraced',
    variants: ['stepped', 'plateau', 'tiered'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'contour',
      shape: 'terraced',
    },
    description: 'Melodic line with plateaus and steps',
    examples: [
      'create terraced melody',
      'add stepped contour',
      'make it tiered',
    ],
  },
] as const;

// =============================================================================
// Register and Range
// =============================================================================

/**
 * Register, range, and tessitura descriptors.
 *
 * Covers:
 * - High vs. low register
 * - Wide vs. narrow range
 * - Upper vs. lower tessitura
 * - Extreme vs. middle register
 */
const REGISTER_RANGE_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'high-register'),
    lemma: 'high',
    variants: ['upper register', 'treble', 'soprano range'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('register'),
      direction: 'increase',
    },
    description: 'Melodic line in high pitch register',
    examples: [
      'move to high register',
      'transpose up an octave',
      'use upper range',
    ],
  },
  {
    id: createLexemeId('adj', 'low-register'),
    lemma: 'low',
    variants: ['lower register', 'bass', 'deep'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('register'),
      direction: 'decrease',
    },
    description: 'Melodic line in low pitch register',
    examples: [
      'move to low register',
      'transpose down an octave',
      'use lower range',
    ],
  },
  {
    id: createLexemeId('adj', 'wide-range'),
    lemma: 'wide',
    variants: ['expansive', 'broad range', 'large compass'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_range'),
      direction: 'increase',
    },
    description: 'Melodic line covering wide pitch range',
    examples: [
      'widen the range',
      'make it more expansive',
      'increase the compass',
    ],
  },
  {
    id: createLexemeId('adj', 'narrow-range'),
    lemma: 'narrow',
    variants: ['compact', 'limited range', 'small compass'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_range'),
      direction: 'decrease',
    },
    description: 'Melodic line covering narrow pitch range',
    examples: [
      'narrow the range',
      'make it more compact',
      'reduce the compass',
    ],
  },
  {
    id: createLexemeId('adj', 'tessitura-high'),
    lemma: 'high tessitura',
    variants: ['sits high', 'upper tessitura'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'tessitura',
      position: 'high',
    },
    description: 'Melody predominantly in high register',
    examples: [
      'raise the tessitura',
      'make it sit higher',
      'use upper tessitura',
    ],
  },
  {
    id: createLexemeId('adj', 'tessitura-low'),
    lemma: 'low tessitura',
    variants: ['sits low', 'lower tessitura'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'tessitura',
      position: 'low',
    },
    description: 'Melody predominantly in low register',
    examples: [
      'lower the tessitura',
      'make it sit lower',
      'use lower tessitura',
    ],
  },
  {
    id: createLexemeId('adj', 'extreme-register'),
    lemma: 'extreme',
    variants: ['very high or low', 'outer limits', 'extreme range'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'register',
      extremity: 'extreme',
    },
    description: 'Melody using extreme high or low pitches',
    examples: [
      'use extreme register',
      'push to outer limits',
      'explore extremes',
    ],
  },
  {
    id: createLexemeId('adj', 'middle-register'),
    lemma: 'middle',
    variants: ['mid-range', 'central', 'comfortable range'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'register',
      position: 'middle',
    },
    description: 'Melody in comfortable middle register',
    examples: [
      'stay in middle register',
      'use mid-range',
      'keep it central',
    ],
  },
] as const;

// =============================================================================
// Interval Patterns
// =============================================================================

/**
 * Melodic interval pattern descriptors.
 *
 * Covers:
 * - Stepwise vs. leaping
 * - Conjunct vs. disjunct
 * - Small vs. large intervals
 * - Smooth vs. angular motion
 */
const INTERVAL_PATTERN_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'stepwise'),
    lemma: 'stepwise',
    variants: ['conjunct', 'by step', 'scalar'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_stepwise'),
      direction: 'increase',
    },
    description: 'Melodic motion by adjacent scale degrees',
    examples: [
      'make it stepwise',
      'use conjunct motion',
      'move by step',
    ],
  },
  {
    id: createLexemeId('adj', 'leaping'),
    lemma: 'leaping',
    variants: ['disjunct', 'by leap', 'skipping', 'jumping'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_stepwise'),
      direction: 'decrease',
    },
    description: 'Melodic motion by larger intervals (skips)',
    examples: [
      'add leaps',
      'use disjunct motion',
      'create jumps',
    ],
  },
  {
    id: createLexemeId('adj', 'smooth-intervals'),
    lemma: 'smooth',
    variants: ['flowing', 'legato intervals', 'connected'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_smoothness'),
      direction: 'increase',
    },
    description: 'Melodic motion with predominantly small intervals',
    examples: [
      'make it smoother',
      'reduce interval size',
      'create flowing motion',
    ],
  },
  {
    id: createLexemeId('adj', 'angular-intervals'),
    lemma: 'angular',
    variants: ['jagged', 'disjointed', 'wide intervals'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_smoothness'),
      direction: 'decrease',
    },
    description: 'Melodic motion with predominantly large intervals',
    examples: [
      'make it more angular',
      'add wide intervals',
      'create jagged motion',
    ],
  },
  {
    id: createLexemeId('adj', 'chromatic-motion'),
    lemma: 'chromatic',
    variants: ['half-step motion', 'chromatic scale', 'semitone steps'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'interval_type',
      intervalType: 'chromatic',
    },
    description: 'Melodic motion by half steps',
    examples: [
      'add chromatic motion',
      'use half steps',
      'create chromatic line',
    ],
  },
  {
    id: createLexemeId('adj', 'diatonic-motion'),
    lemma: 'diatonic',
    variants: ['scale-based', 'in key', 'diatonic steps'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'interval_type',
      intervalType: 'diatonic',
    },
    description: 'Melodic motion within key/scale',
    examples: [
      'keep it diatonic',
      'use scale tones',
      'stay in key',
    ],
  },
  {
    id: createLexemeId('adj', 'intervallic'),
    lemma: 'intervallic',
    variants: ['interval-based', 'non-scalar', 'wide-ranging'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'interval_type',
      intervalType: 'intervallic',
    },
    description: 'Melodic motion emphasizing specific intervals',
    examples: [
      'make it intervallic',
      'emphasize intervals',
      'use non-scalar motion',
    ],
  },
  {
    id: createLexemeId('adj', 'pentatonic'),
    lemma: 'pentatonic',
    variants: ['five-note scale', 'pentatonic scale'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'scale_type',
      scale: 'pentatonic',
    },
    description: 'Melodic motion using pentatonic scale',
    examples: [
      'use pentatonic scale',
      'make it pentatonic',
      'apply five-note scale',
    ],
  },
] as const;

// =============================================================================
// Ornamentation and Embellishment
// =============================================================================

/**
 * Ornamentation and embellishment descriptors.
 *
 * Covers:
 * - Simple vs. ornate
 * - Decorated vs. plain
 * - Melismatic vs. syllabic
 * - Embellished vs. skeletal
 */
const ORNAMENTATION_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'ornate'),
    lemma: 'ornate',
    variants: ['decorated', 'embellished', 'elaborate'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_ornamentation'),
      direction: 'increase',
    },
    description: 'Melody with many ornaments and decorations',
    examples: [
      'make it more ornate',
      'add ornamentation',
      'embellish the melody',
    ],
  },
  {
    id: createLexemeId('adj', 'plain-melody'),
    lemma: 'plain',
    variants: ['simple', 'unadorned', 'skeletal'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_ornamentation'),
      direction: 'decrease',
    },
    description: 'Melody without ornamentation',
    examples: [
      'make it plainer',
      'strip ornamentation',
      'simplify to skeleton',
    ],
  },
  {
    id: createLexemeId('adj', 'melismatic'),
    lemma: 'melismatic',
    variants: ['florid', 'many notes per syllable', 'flowing ornamentation'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'ornamentation_style',
      style: 'melismatic',
    },
    description: 'Multiple notes per syllable or beat',
    examples: [
      'make it melismatic',
      'add florid passages',
      'increase note density',
    ],
  },
  {
    id: createLexemeId('adj', 'syllabic'),
    lemma: 'syllabic',
    variants: ['one note per syllable', 'simple setting'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'ornamentation_style',
      style: 'syllabic',
    },
    description: 'One note per syllable or beat',
    examples: [
      'make it syllabic',
      'simplify to one note',
      'reduce note density',
    ],
  },
  {
    id: createLexemeId('noun', 'trill'),
    lemma: 'trill',
    variants: ['rapid alternation', 'ornamental trill'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'ornament_type',
      ornament: 'trill',
    },
    description: 'Rapid alternation between two adjacent notes',
    examples: [
      'add a trill',
      'create rapid alternation',
      'ornament with trill',
    ],
  },
  {
    id: createLexemeId('noun', 'mordent'),
    lemma: 'mordent',
    variants: ['mordant', 'short ornament'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'ornament_type',
      ornament: 'mordent',
    },
    description: 'Quick alternation with neighboring note',
    examples: [
      'add a mordent',
      'create quick ornament',
      'embellish with mordent',
    ],
  },
  {
    id: createLexemeId('noun', 'turn'),
    lemma: 'turn',
    variants: ['gruppetto', 'four-note figure'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'ornament_type',
      ornament: 'turn',
    },
    description: 'Ornament circling around main note',
    examples: [
      'add a turn',
      'create gruppetto',
      'ornament with turn',
    ],
  },
  {
    id: createLexemeId('noun', 'grace-note'),
    lemma: 'grace note',
    variants: ['appoggiatura', 'acciaccatura', 'ornamental note'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'ornament_type',
      ornament: 'grace_note',
    },
    description: 'Quick ornamental note before main note',
    examples: [
      'add grace notes',
      'create appoggiatura',
      'ornament with quick notes',
    ],
  },
] as const;

// =============================================================================
// Melodic Complexity
// =============================================================================

/**
 * Melodic complexity and predictability descriptors.
 *
 * Covers:
 * - Simple vs. complex melodies
 * - Predictable vs. surprising
 * - Repetitive vs. varied
 * - Structured vs. free
 */
const MELODIC_COMPLEXITY_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'simple-melody'),
    lemma: 'simple',
    variants: ['basic', 'straightforward', 'uncomplicated'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_complexity'),
      direction: 'decrease',
    },
    description: 'Melody with simple, easy-to-follow structure',
    examples: [
      'simplify the melody',
      'make it more basic',
      'reduce complexity',
    ],
  },
  {
    id: createLexemeId('adj', 'complex-melody'),
    lemma: 'complex',
    variants: ['intricate', 'sophisticated', 'elaborate'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_complexity'),
      direction: 'increase',
    },
    description: 'Melody with intricate, sophisticated structure',
    examples: [
      'add complexity',
      'make it more intricate',
      'elaborate the melody',
    ],
  },
  {
    id: createLexemeId('adj', 'predictable-melody'),
    lemma: 'predictable',
    variants: ['expected', 'formulaic', 'conventional'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_surprise'),
      direction: 'decrease',
    },
    description: 'Melody following expected patterns',
    examples: [
      'make it predictable',
      'follow conventions',
      'reduce surprises',
    ],
  },
  {
    id: createLexemeId('adj', 'surprising-melody'),
    lemma: 'surprising',
    variants: ['unexpected', 'unpredictable', 'novel'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_surprise'),
      direction: 'increase',
    },
    description: 'Melody with unexpected turns and patterns',
    examples: [
      'add surprises',
      'make it unpredictable',
      'create novel patterns',
    ],
  },
  {
    id: createLexemeId('adj', 'repetitive-melody'),
    lemma: 'repetitive',
    variants: ['recurring', 'repeating', 'ostinato-like'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_repetition'),
      direction: 'increase',
    },
    description: 'Melody with recurring patterns',
    examples: [
      'make it repetitive',
      'add recurring motifs',
      'create ostinato',
    ],
  },
  {
    id: createLexemeId('adj', 'varied-melody'),
    lemma: 'varied',
    variants: ['diverse', 'changing', 'non-repetitive'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_repetition'),
      direction: 'decrease',
    },
    description: 'Melody with continuous variation',
    examples: [
      'vary the melody',
      'add diversity',
      'reduce repetition',
    ],
  },
  {
    id: createLexemeId('adj', 'structured-melody'),
    lemma: 'structured',
    variants: ['organized', 'formal', 'patterned'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_structure'),
      direction: 'increase',
    },
    description: 'Melody with clear organizational structure',
    examples: [
      'add structure',
      'organize the melody',
      'create patterns',
    ],
  },
  {
    id: createLexemeId('adj', 'free-melody'),
    lemma: 'free',
    variants: ['unstructured', 'improvisatory', 'spontaneous'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_structure'),
      direction: 'decrease',
    },
    description: 'Melody without rigid structure',
    examples: [
      'make it freer',
      'remove structure',
      'add spontaneity',
    ],
  },
] as const;

// =============================================================================
// Melodic Character
// =============================================================================

/**
 * Melodic character and expression descriptors.
 *
 * Covers:
 * - Lyrical vs. mechanical
 * - Expressive vs. neutral
 * - Singing vs. instrumental
 * - Memorable vs. forgettable
 */
const MELODIC_CHARACTER_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'lyrical'),
    lemma: 'lyrical',
    variants: ['song-like', 'singable', 'cantabile'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_lyricism'),
      direction: 'increase',
    },
    description: 'Melody with song-like, expressive quality',
    examples: [
      'make it more lyrical',
      'add song-like quality',
      'create cantabile line',
    ],
  },
  {
    id: createLexemeId('adj', 'mechanical-melody'),
    lemma: 'mechanical',
    variants: ['robotic', 'non-expressive', 'dry'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_lyricism'),
      direction: 'decrease',
    },
    description: 'Melody lacking expressive quality',
    examples: [
      'make it mechanical',
      'remove expression',
      'flatten the character',
    ],
  },
  {
    id: createLexemeId('adj', 'expressive-melody'),
    lemma: 'expressive',
    variants: ['emotional', 'full of feeling', 'passionate'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_expressiveness'),
      direction: 'increase',
    },
    description: 'Melody with strong emotional character',
    examples: [
      'make it expressive',
      'add emotion',
      'increase feeling',
    ],
  },
  {
    id: createLexemeId('adj', 'neutral-melody'),
    lemma: 'neutral',
    variants: ['emotionless', 'flat', 'objective'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('melodic_expressiveness'),
      direction: 'decrease',
    },
    description: 'Melody without emotional character',
    examples: [
      'make it neutral',
      'remove emotion',
      'flatten expression',
    ],
  },
  {
    id: createLexemeId('adj', 'memorable'),
    lemma: 'memorable',
    variants: ['catchy', 'hooky', 'unforgettable'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'memorability',
      level: 'high',
    },
    description: 'Melody that sticks in the mind',
    examples: [
      'make it catchier',
      'create a hook',
      'increase memorability',
    ],
  },
  {
    id: createLexemeId('adj', 'vocal-like'),
    lemma: 'vocal',
    variants: ['voice-like', 'singable', 'human'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'character',
      quality: 'vocal',
    },
    description: 'Melody suited for voice or vocal-like',
    examples: [
      'make it more vocal',
      'add singing quality',
      'humanize the line',
    ],
  },
  {
    id: createLexemeId('adj', 'instrumental-character'),
    lemma: 'instrumental',
    variants: ['idiomatic', 'instrumental-specific'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'character',
      quality: 'instrumental',
    },
    description: 'Melody suited for specific instrument',
    examples: [
      'make it instrumental',
      'add instrumental idioms',
      'suit the instrument',
    ],
  },
  {
    id: createLexemeId('adj', 'conversational'),
    lemma: 'conversational',
    variants: ['speech-like', 'natural phrasing', 'parlando'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'melody',
      aspect: 'character',
      quality: 'conversational',
    },
    description: 'Melody mimicking speech patterns',
    examples: [
      'make it conversational',
      'add speech-like quality',
      'create natural phrasing',
    ],
  },
] as const;

// =============================================================================
// Combined Exports
// =============================================================================

/**
 * All melodic contour and shape vocabulary entries from Batch 58.
 */
export const MELODIC_CONTOUR_BATCH_58: readonly Lexeme[] = [
  ...DIRECTIONAL_MOVEMENT_DESCRIPTORS,
  ...REGISTER_RANGE_DESCRIPTORS,
  ...INTERVAL_PATTERN_DESCRIPTORS,
  ...ORNAMENTATION_DESCRIPTORS,
  ...MELODIC_COMPLEXITY_DESCRIPTORS,
  ...MELODIC_CHARACTER_DESCRIPTORS,
] as const;

/**
 * Count of entries in Batch 58.
 */
export const BATCH_58_COUNT = MELODIC_CONTOUR_BATCH_58.length;

/**
 * Categories covered in Batch 58.
 */
export const BATCH_58_CATEGORIES = [
  'Directional Movement (8 entries)',
  'Register and Range (8 entries)',
  'Interval Patterns (8 entries)',
  'Ornamentation and Embellishment (8 entries)',
  'Melodic Complexity (8 entries)',
  'Melodic Character (8 entries)',
] as const;

/**
 * Summary of Batch 58.
 */
export const BATCH_58_SUMMARY = {
  batchNumber: 58,
  name: 'Melodic Contour and Shape Descriptors',
  entryCount: BATCH_58_COUNT,
  categories: BATCH_58_CATEGORIES,
  description:
    'Comprehensive vocabulary for melodic contour, shape, register, intervals, ' +
    'ornamentation, complexity, and character in composition and performance.',
} as const;
