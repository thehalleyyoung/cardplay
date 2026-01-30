/**
 * GOFAI Canon — Domain Nouns Batch 20: Phrasing, Flow, and Musical Direction
 *
 * Comprehensive vocabulary for musical phrasing, flow, direction, motion,
 * and how musical ideas develop over time. This batch systematically enumerates
 * the natural language terms musicians use to describe musical narrative,
 * development, and temporal organization.
 *
 * This continues the extensive enumeration requirement from gofai_goalB.md
 * to build comprehensive natural language coverage.
 *
 * @module gofai/canon/domain-nouns-batch20-phrasing-flow
 */

import type { LexemeId } from './types';
import { createLexemeId } from './types';

/**
 * Phrasing-related lexeme.
 */
export interface PhrasingLexeme {
  readonly id: LexemeId;
  readonly lemma: string;
  readonly variants: readonly string[];
  readonly category: 'noun' | 'adjective' | 'verb';
  readonly semantics: {
    readonly type: 'phrasing' | 'flow' | 'direction' | 'development';
    readonly temporalQuality?: string;
    readonly directionality?: 'forward' | 'backward' | 'circular' | 'static';
    readonly affects: readonly string[]; // What aspects this affects
  };
  readonly description: string;
  readonly examples: readonly string[];
  readonly musicalContext?: readonly string[];
}

// =============================================================================
// Phrase Structure and Organization
// =============================================================================

export const PHRASE_STRUCTURE_LEXEMES: readonly PhrasingLexeme[] = [
  {
    id: createLexemeId('phr', 'phrase'),
    lemma: 'phrase',
    variants: ['musical phrase', 'line', 'musical sentence', 'gesture'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      affects: ['structure', 'grouping', 'articulation'],
    },
    description: 'A complete musical thought or statement',
    examples: [
      'shape the phrase',
      'make that a clear musical phrase',
      'the melodic line needs phrasing',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('phr', 'antecedent'),
    lemma: 'antecedent',
    variants: ['question phrase', 'opening statement', 'first half'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      temporalQuality: 'opening',
      affects: ['structure', 'expectation', 'tension'],
    },
    description: 'Opening phrase that creates expectation',
    examples: [
      'the antecedent phrase',
      'the question part',
      'opening statement',
    ],
    musicalContext: ['classical', 'theory'],
  },
  {
    id: createLexemeId('phr', 'consequent'),
    lemma: 'consequent',
    variants: ['answer phrase', 'resolution', 'second half', 'reply'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      temporalQuality: 'closing',
      affects: ['structure', 'resolution', 'closure'],
    },
    description: 'Answering phrase that provides resolution',
    examples: [
      'the consequent phrase',
      'the answer part',
      'resolution phrase',
    ],
    musicalContext: ['classical', 'theory'],
  },
  {
    id: createLexemeId('phr', 'period'),
    lemma: 'period',
    variants: ['phrase pair', 'musical period', 'complete statement'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      affects: ['structure', 'completeness', 'form'],
    },
    description: 'Pair of phrases (antecedent + consequent)',
    examples: [
      'organize into clear periods',
      'phrase pair structure',
      'complete musical statement',
    ],
    musicalContext: ['classical', 'theory'],
  },
  {
    id: createLexemeId('phr', 'elision'),
    lemma: 'elision',
    variants: ['overlap', 'dovetail', 'seamless connection'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      affects: ['connection', 'flow', 'continuity'],
    },
    description: 'Overlapping of phrase endings and beginnings',
    examples: [
      'add elision between phrases',
      'make it dovetail',
      'seamless phrase connection',
    ],
    musicalContext: ['classical', 'composition'],
  },

  // =============================================================================
  // Flow and Motion
  // =============================================================================

  {
    id: createLexemeId('flow', 'momentum'),
    lemma: 'momentum',
    variants: ['forward motion', 'drive', 'propulsion', 'impetus'],
    category: 'noun',
    semantics: {
      type: 'flow',
      directionality: 'forward',
      affects: ['energy', 'drive', 'motion'],
    },
    description: 'Forward-moving energy',
    examples: [
      'increase momentum',
      'add forward motion',
      'build drive',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('flow', 'flow'),
    lemma: 'flow',
    variants: ['flowing', 'fluidity', 'stream', 'glide'],
    category: 'noun',
    semantics: {
      type: 'flow',
      directionality: 'forward',
      affects: ['continuity', 'smoothness', 'connection'],
    },
    description: 'Smooth, continuous motion',
    examples: [
      'improve the flow',
      'make it more fluid',
      'smooth flowing lines',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('flow', 'stasis'),
    lemma: 'stasis',
    variants: ['static', 'stillness', 'suspended', 'hovering'],
    category: 'noun',
    semantics: {
      type: 'flow',
      directionality: 'static',
      affects: ['motion', 'suspension', 'time'],
    },
    description: 'Lack of forward motion, suspended state',
    examples: [
      'create a sense of stasis',
      'make it static',
      'hovering without movement',
    ],
    musicalContext: ['ambient', 'contemporary', 'minimalist'],
  },
  {
    id: createLexemeId('flow', 'undulation'),
    lemma: 'undulation',
    variants: ['wave motion', 'rolling', 'swaying', 'ebb and flow'],
    category: 'noun',
    semantics: {
      type: 'flow',
      directionality: 'circular',
      affects: ['motion', 'waves', 'rhythm'],
    },
    description: 'Wave-like, cyclical motion',
    examples: [
      'add undulation to the line',
      'wave-like motion',
      'ebb and flow',
    ],
    musicalContext: ['impressionist', 'ambient'],
  },
  {
    id: createLexemeId('flow', 'cascade'),
    lemma: 'cascade',
    variants: ['cascading', 'waterfall', 'tumbling', 'falling'],
    category: 'noun',
    semantics: {
      type: 'flow',
      directionality: 'forward',
      affects: ['descent', 'flow', 'motion'],
    },
    description: 'Rapid descending motion',
    examples: [
      'cascading notes',
      'waterfall effect',
      'tumbling downward',
    ],
    musicalContext: ['all genres'],
  },

  // =============================================================================
  // Musical Direction and Trajectory
  // =============================================================================

  {
    id: createLexemeId('dir', 'ascent'),
    lemma: 'ascent',
    variants: ['rising', 'climbing', 'ascending', 'upward motion'],
    category: 'noun',
    semantics: {
      type: 'direction',
      directionality: 'forward',
      affects: ['pitch', 'tension', 'energy'],
    },
    description: 'Upward melodic motion',
    examples: [
      'add an ascending line',
      'climbing melody',
      'rising motion',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('dir', 'descent'),
    lemma: 'descent',
    variants: ['falling', 'descending', 'downward motion', 'dropping'],
    category: 'noun',
    semantics: {
      type: 'direction',
      directionality: 'forward',
      affects: ['pitch', 'resolution', 'relaxation'],
    },
    description: 'Downward melodic motion',
    examples: [
      'descending bass line',
      'falling melody',
      'downward motion',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('dir', 'contour'),
    lemma: 'contour',
    variants: ['shape', 'profile', 'outline', 'melodic curve'],
    category: 'noun',
    semantics: {
      type: 'direction',
      affects: ['shape', 'pitch', 'trajectory'],
    },
    description: 'Overall shape of a melodic line',
    examples: [
      'change the melodic contour',
      'shape the line',
      'melodic profile',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('dir', 'arch'),
    lemma: 'arch',
    variants: ['arch shape', 'rise and fall', 'peaked shape'],
    category: 'noun',
    semantics: {
      type: 'direction',
      affects: ['shape', 'climax', 'trajectory'],
    },
    description: 'Rising then falling melodic shape',
    examples: [
      'create an arch shape',
      'rise to peak then fall',
      'arched melodic line',
    ],
    musicalContext: ['classical', 'composition'],
  },
  {
    id: createLexemeId('dir', 'wave'),
    lemma: 'wave',
    variants: ['wave shape', 'sine wave', 'oscillating'],
    category: 'noun',
    semantics: {
      type: 'direction',
      directionality: 'circular',
      affects: ['shape', 'repetition', 'cycles'],
    },
    description: 'Cyclical rising and falling',
    examples: [
      'wave-shaped melody',
      'oscillating pattern',
      'cyclical motion',
    ],
    musicalContext: ['all genres'],
  },

  // =============================================================================
  // Development and Transformation
  // =============================================================================

  {
    id: createLexemeId('dev', 'development'),
    lemma: 'development',
    variants: ['developing', 'elaboration', 'working out', 'expansion'],
    category: 'noun',
    semantics: {
      type: 'development',
      affects: ['variation', 'elaboration', 'complexity'],
    },
    description: 'Elaboration and transformation of material',
    examples: [
      'add development section',
      'develop the theme',
      'elaborate the motif',
    ],
    musicalContext: ['classical', 'jazz'],
  },
  {
    id: createLexemeId('dev', 'sequence'),
    lemma: 'sequence',
    variants: ['sequencing', 'sequential', 'repeated pattern', 'transposed repetition'],
    category: 'noun',
    semantics: {
      type: 'development',
      affects: ['repetition', 'transposition', 'pattern'],
    },
    description: 'Pattern repeated at different pitch levels',
    examples: [
      'add a sequence',
      'sequential repetition',
      'repeat the pattern higher',
    ],
    musicalContext: ['classical', 'theory'],
  },
  {
    id: createLexemeId('dev', 'fragmentation'),
    lemma: 'fragmentation',
    variants: ['breaking up', 'splintering', 'dividing', 'fragmenting'],
    category: 'noun',
    semantics: {
      type: 'development',
      affects: ['division', 'motif', 'breakdown'],
    },
    description: 'Breaking material into smaller fragments',
    examples: [
      'use fragmentation',
      'break up the theme',
      'splinter into motifs',
    ],
    musicalContext: ['classical', 'contemporary'],
  },
  {
    id: createLexemeId('dev', 'augmentation'),
    lemma: 'augmentation',
    variants: ['lengthening', 'stretching', 'slower', 'expanded'],
    category: 'noun',
    semantics: {
      type: 'development',
      affects: ['duration', 'tempo', 'expansion'],
    },
    description: 'Lengthening rhythmic values',
    examples: [
      'use augmentation',
      'stretch the rhythm',
      'slower version',
    ],
    musicalContext: ['classical', 'composition'],
  },
  {
    id: createLexemeId('dev', 'diminution'),
    lemma: 'diminution',
    variants: ['shortening', 'compressing', 'faster', 'condensed'],
    category: 'noun',
    semantics: {
      type: 'development',
      affects: ['duration', 'tempo', 'compression'],
    },
    description: 'Shortening rhythmic values',
    examples: [
      'use diminution',
      'compress the rhythm',
      'faster version',
    ],
    musicalContext: ['classical', 'composition'],
  },
  {
    id: createLexemeId('dev', 'inversion'),
    lemma: 'inversion',
    variants: ['inverted', 'upside down', 'mirrored', 'flipped'],
    category: 'noun',
    semantics: {
      type: 'development',
      affects: ['pitch', 'direction', 'transformation'],
    },
    description: 'Melodic intervals flipped upside down',
    examples: [
      'use melodic inversion',
      'flip the melody',
      'upside down version',
    ],
    musicalContext: ['classical', 'theory'],
  },
  {
    id: createLexemeId('dev', 'retrograde'),
    lemma: 'retrograde',
    variants: ['backwards', 'reversed', 'crab', 'reversed order'],
    category: 'noun',
    semantics: {
      type: 'development',
      directionality: 'backward',
      affects: ['order', 'time', 'transformation'],
    },
    description: 'Material played backwards',
    examples: [
      'use retrograde',
      'play it backwards',
      'reversed order',
    ],
    musicalContext: ['classical', 'contemporary', 'theory'],
  },

  // =============================================================================
  // Phrasing Techniques and Articulation
  // =============================================================================

  {
    id: createLexemeId('tech', 'rubato'),
    lemma: 'rubato',
    variants: ['flexible tempo', 'stolen time', 'expressive timing'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      affects: ['tempo', 'expression', 'flexibility'],
    },
    description: 'Flexible, expressive timing',
    examples: [
      'use rubato',
      'flexible tempo',
      'expressive timing',
    ],
    musicalContext: ['classical', 'romantic', 'jazz'],
  },
  {
    id: createLexemeId('tech', 'portamento'),
    lemma: 'portamento',
    variants: ['slide', 'glide', 'glissando', 'scooping'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      affects: ['pitch', 'connection', 'glide'],
    },
    description: 'Sliding between pitches',
    examples: [
      'add portamento',
      'slide between notes',
      'glide up to the pitch',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('tech', 'appoggiatura'),
    lemma: 'appoggiatura',
    variants: ['leaning note', 'grace note', 'ornament'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      affects: ['ornament', 'expression', 'dissonance'],
    },
    description: 'Accented non-chord tone resolving downward',
    examples: [
      'add appoggiaturas',
      'leaning notes',
      'ornamental grace notes',
    ],
    musicalContext: ['classical', 'baroque'],
  },
  {
    id: createLexemeId('tech', 'mordent'),
    lemma: 'mordent',
    variants: ['ornament', 'trill figure', 'decoration'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      affects: ['ornament', 'decoration', 'embellishment'],
    },
    description: 'Quick alternation with adjacent note',
    examples: [
      'add mordents',
      'ornamental decoration',
      'quick trill figure',
    ],
    musicalContext: ['classical', 'baroque'],
  },
  {
    id: createLexemeId('tech', 'turn'),
    lemma: 'turn',
    variants: ['gruppetto', 'ornamental turn', 'decorative figure'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      affects: ['ornament', 'decoration', 'embellishment'],
    },
    description: 'Ornamental figure circling main note',
    examples: [
      'add turns',
      'ornamental gruppetto',
      'decorative figure',
    ],
    musicalContext: ['classical', 'baroque'],
  },

  // =============================================================================
  // Breath and Air (Wind Phrasing)
  // =============================================================================

  {
    id: createLexemeId('breath', 'breath-mark'),
    lemma: 'breath mark',
    variants: ['breath', 'comma', 'caesura', 'pause'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      affects: ['space', 'break', 'articulation'],
    },
    description: 'Brief pause for breath',
    examples: [
      'add a breath mark',
      'pause for breath',
      'slight break',
    ],
    musicalContext: ['wind', 'vocal', 'all genres'],
  },
  {
    id: createLexemeId('breath', 'circular-breathing'),
    lemma: 'circular breathing',
    variants: ['continuous', 'unbroken', 'sustained'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      affects: ['continuity', 'sustain', 'breath'],
    },
    description: 'Technique for continuous sound without breaks',
    examples: [
      'use circular breathing',
      'continuous sound',
      'unbroken line',
    ],
    musicalContext: ['wind', 'contemporary'],
  },

  // =============================================================================
  // Textural Flow
  // =============================================================================

  {
    id: createLexemeId('texture', 'layering'),
    lemma: 'layering',
    variants: ['stacking', 'building layers', 'accumulation'],
    category: 'noun',
    semantics: {
      type: 'development',
      affects: ['texture', 'density', 'buildup'],
    },
    description: 'Adding layers over time',
    examples: [
      'gradual layering',
      'build up layers',
      'accumulate texture',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('texture', 'thinning'),
    lemma: 'thinning',
    variants: ['reduction', 'stripping away', 'sparse', 'opening up'],
    category: 'noun',
    semantics: {
      type: 'development',
      affects: ['texture', 'density', 'space'],
    },
    description: 'Removing layers over time',
    examples: [
      'gradual thinning',
      'strip away layers',
      'open up the texture',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('texture', 'interweaving'),
    lemma: 'interweaving',
    variants: ['interlocking', 'weaving', 'braiding', 'counterpoint'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      affects: ['independence', 'interaction', 'complexity'],
    },
    description: 'Independent lines weaving together',
    examples: [
      'interweaving lines',
      'interlocking parts',
      'woven counterpoint',
    ],
    musicalContext: ['classical', 'baroque', 'jazz'],
  },

  // =============================================================================
  // Temporal Organization
  // =============================================================================

  {
    id: createLexemeId('time', 'anticipation'),
    lemma: 'anticipation',
    variants: ['early arrival', 'ahead of beat', 'rushed'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      affects: ['timing', 'eagerness', 'push'],
    },
    description: 'Note arriving before the beat',
    examples: [
      'anticipate the downbeat',
      'arrive early',
      'ahead of the beat',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('time', 'suspension'),
    lemma: 'suspension',
    variants: ['held note', 'delayed resolution', 'carried over'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      affects: ['timing', 'tension', 'hold'],
    },
    description: 'Note held over from previous chord',
    examples: [
      'add suspensions',
      'hold the note over',
      'delayed resolution',
    ],
    musicalContext: ['classical', 'theory', 'jazz'],
  },
  {
    id: createLexemeId('time', 'syncopation'),
    lemma: 'syncopation',
    variants: ['off-beat', 'displaced accent', 'rhythmic displacement'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      affects: ['rhythm', 'accent', 'surprise'],
    },
    description: 'Emphasis on weak beats or off-beats',
    examples: [
      'add syncopation',
      'off-beat accents',
      'rhythmic displacement',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('time', 'hemiola'),
    lemma: 'hemiola',
    variants: ['cross-rhythm', '3 against 2', 'metric ambiguity'],
    category: 'noun',
    semantics: {
      type: 'phrasing',
      affects: ['rhythm', 'meter', 'ambiguity'],
    },
    description: 'Rhythmic pattern of 3 against 2',
    examples: [
      'add hemiola',
      'three against two',
      'metric play',
    ],
    musicalContext: ['classical', 'theory'],
  },
];

// =============================================================================
// Exports
// =============================================================================

/**
 * All phrasing and flow lexemes in this batch.
 */
export const PHRASING_FLOW_LEXEMES: readonly PhrasingLexeme[] = [
  ...PHRASE_STRUCTURE_LEXEMES,
];

/**
 * Count of lexemes in this batch.
 */
export const PHRASING_FLOW_LEXEME_COUNT = PHRASING_FLOW_LEXEMES.length;
