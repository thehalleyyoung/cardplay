/**
 * @file Domain Adverbs Batch 28 - Degree, Manner, Time, and Frequency
 * @module gofai/canon/domain-adverbs-batch28
 * 
 * Comprehensive adverbial vocabulary for modifying actions and qualities.
 * This batch covers the full spectrum of adverbial modifiers:
 * 
 * - Degree adverbs ("very", "extremely", "slightly", "barely", "quite")
 * - Manner adverbs ("quickly", "slowly", "smoothly", "gradually", "suddenly")
 * - Time adverbs ("now", "later", "before", "after", "during", "always")
 * - Frequency adverbs ("always", "often", "sometimes", "rarely", "never")
 * - Certainty adverbs ("definitely", "probably", "maybe", "perhaps")
 * - Emphasis adverbs ("really", "actually", "literally", "totally")
 * - Viewpoint adverbs ("musically", "rhythmically", "harmonically")
 * - Evaluative adverbs ("fortunately", "ideally", "preferably")
 * 
 * Total Target: 600+ LOC with comprehensive adverbial coverage
 * 
 * @see gofai_goalB.md Phase 1 - Canonical Ontology + Extensible Symbol Tables
 * @see gofaimusicplus.md Section 4 - The 100K+ LOC English → CPL Parser
 */

import type { LexemeId } from './types';
import { createLexemeId } from './types';

/**
 * Adverb lexeme for modifying verbs, adjectives, and other adverbs.
 */
export interface AdverbLexeme {
  readonly id: LexemeId;
  readonly lemma: string;
  readonly variants: readonly string[];
  readonly category: AdverbCategory;
  readonly subcategory: string;
  readonly description: string;
  readonly examples: readonly string[];
  readonly modifies: readonly ('verb' | 'adjective' | 'adverb' | 'clause')[];
  readonly semantics: AdverbSemantics;
  readonly synonyms: readonly string[];
  readonly antonyms: readonly string[];
  readonly register: 'formal' | 'informal' | 'technical' | 'slang';
  readonly colloquialVariants: readonly string[];
}

/**
 * Adverb category for semantic grouping.
 */
export type AdverbCategory =
  | 'degree'      // very, extremely, slightly
  | 'manner'      // quickly, smoothly, gradually
  | 'time'        // now, later, before, after
  | 'frequency'   // always, often, sometimes
  | 'certainty'   // definitely, probably, maybe
  | 'emphasis'    // really, actually, literally
  | 'viewpoint'   // musically, rhythmically
  | 'evaluative'; // fortunately, ideally

/**
 * Adverb semantics for CPL mapping.
 */
export interface AdverbSemantics {
  readonly type: 'degree_modifier' | 'manner_modifier' | 'temporal' | 'frequency' | 'modal';
  readonly multiplier?: number;      // For degree (1.5 = 50% increase, 0.5 = 50% decrease)
  readonly direction?: 'increase' | 'decrease' | 'neutral';
  readonly absoluteValue?: number | string; // For specific values
  readonly affects: readonly string[];
}

// =============================================================================
// Degree Adverbs - Strong Intensifiers
// =============================================================================

export const STRONG_DEGREE_ADVERBS: readonly AdverbLexeme[] = [
  {
    id: createLexemeId('adv', 'extremely'),
    lemma: 'extremely',
    variants: ['extreme'],
    category: 'degree',
    subcategory: 'strong_intensifier',
    description: 'Very high degree of intensity',
    examples: ['extremely bright', 'extremely fast', 'make it extremely loud'],
    modifies: ['verb', 'adjective'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 2.0,
      direction: 'increase',
      affects: ['intensity', 'magnitude'],
    },
    synonyms: ['incredibly', 'exceptionally', 'extraordinarily'],
    antonyms: ['barely', 'hardly', 'slightly'],
    register: 'formal',
    colloquialVariants: ['crazy', 'insanely', 'ridiculously'],
  },

  {
    id: createLexemeId('adv', 'really'),
    lemma: 'really',
    variants: ['real'],
    category: 'degree',
    subcategory: 'strong_intensifier',
    description: 'Strong intensification, versatile and common',
    examples: ['really bright', 'really fast', 'make it really punchy'],
    modifies: ['verb', 'adjective', 'adverb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 1.75,
      direction: 'increase',
      affects: ['intensity'],
    },
    synonyms: ['very', 'truly', 'genuinely'],
    antonyms: ['barely', 'hardly'],
    register: 'informal',
    colloquialVariants: ['dead', 'proper', 'well'],
  },

  {
    id: createLexemeId('adv', 'super'),
    lemma: 'super',
    variants: [],
    category: 'degree',
    subcategory: 'strong_intensifier',
    description: 'Colloquial strong intensifier',
    examples: ['super bright', 'super tight', 'make it super groovy'],
    modifies: ['adjective', 'adverb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 1.8,
      direction: 'increase',
      affects: ['intensity'],
    },
    synonyms: ['really', 'very', 'extremely'],
    antonyms: ['barely', 'hardly'],
    register: 'informal',
    colloquialVariants: ['mad', 'crazy', 'wicked'],
  },

  {
    id: createLexemeId('adv', 'very'),
    lemma: 'very',
    variants: [],
    category: 'degree',
    subcategory: 'strong_intensifier',
    description: 'Standard strong intensifier',
    examples: ['very bright', 'very tight', 'make it very smooth'],
    modifies: ['adjective', 'adverb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 1.5,
      direction: 'increase',
      affects: ['intensity'],
    },
    synonyms: ['really', 'quite', 'extremely'],
    antonyms: ['slightly', 'barely'],
    register: 'formal',
    colloquialVariants: [],
  },

  {
    id: createLexemeId('adv', 'incredibly'),
    lemma: 'incredibly',
    variants: ['incredible'],
    category: 'degree',
    subcategory: 'strong_intensifier',
    description: 'Exceptionally high degree',
    examples: ['incredibly bright', 'incredibly tight', 'make it incredibly punchy'],
    modifies: ['adjective', 'adverb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 2.0,
      direction: 'increase',
      affects: ['intensity'],
    },
    synonyms: ['extremely', 'exceptionally', 'remarkably'],
    antonyms: ['barely', 'minimally'],
    register: 'formal',
    colloquialVariants: ['crazy', 'insanely'],
  },

  {
    id: createLexemeId('adv', 'absolutely'),
    lemma: 'absolutely',
    variants: ['absolute'],
    category: 'degree',
    subcategory: 'absolute_intensifier',
    description: 'Complete or total degree',
    examples: ['absolutely perfect', 'absolutely killer', 'make it absolutely clean'],
    modifies: ['adjective', 'verb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 2.5,
      direction: 'increase',
      affects: ['completeness'],
    },
    synonyms: ['completely', 'totally', 'utterly'],
    antonyms: ['partially', 'somewhat'],
    register: 'formal',
    colloquialVariants: [],
  },

  {
    id: createLexemeId('adv', 'totally'),
    lemma: 'totally',
    variants: ['total'],
    category: 'degree',
    subcategory: 'absolute_intensifier',
    description: 'Complete degree, colloquial',
    examples: ['totally clean', 'totally tight', 'make it totally smooth'],
    modifies: ['adjective', 'verb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 2.5,
      direction: 'increase',
      affects: ['completeness'],
    },
    synonyms: ['completely', 'absolutely', 'entirely'],
    antonyms: ['partially'],
    register: 'informal',
    colloquialVariants: [],
  },
];

// =============================================================================
// Degree Adverbs - Medium/Moderate
// =============================================================================

export const MEDIUM_DEGREE_ADVERBS: readonly AdverbLexeme[] = [
  {
    id: createLexemeId('adv', 'quite'),
    lemma: 'quite',
    variants: [],
    category: 'degree',
    subcategory: 'medium_intensifier',
    description: 'Moderate degree of intensity',
    examples: ['quite bright', 'quite fast', 'make it quite smooth'],
    modifies: ['adjective', 'adverb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 1.3,
      direction: 'increase',
      affects: ['intensity'],
    },
    synonyms: ['fairly', 'rather', 'pretty'],
    antonyms: ['barely', 'hardly'],
    register: 'formal',
    colloquialVariants: ['pretty'],
  },

  {
    id: createLexemeId('adv', 'pretty'),
    lemma: 'pretty',
    variants: [],
    category: 'degree',
    subcategory: 'medium_intensifier',
    description: 'Moderate degree, colloquial',
    examples: ['pretty bright', 'pretty tight', 'make it pretty groovy'],
    modifies: ['adjective', 'adverb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 1.3,
      direction: 'increase',
      affects: ['intensity'],
    },
    synonyms: ['quite', 'fairly', 'rather'],
    antonyms: ['barely'],
    register: 'informal',
    colloquialVariants: [],
  },

  {
    id: createLexemeId('adv', 'fairly'),
    lemma: 'fairly',
    variants: ['fair'],
    category: 'degree',
    subcategory: 'medium_intensifier',
    description: 'Moderate degree, somewhat formal',
    examples: ['fairly bright', 'fairly tight', 'make it fairly smooth'],
    modifies: ['adjective', 'adverb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 1.25,
      direction: 'increase',
      affects: ['intensity'],
    },
    synonyms: ['quite', 'rather', 'pretty'],
    antonyms: ['barely'],
    register: 'formal',
    colloquialVariants: [],
  },

  {
    id: createLexemeId('adv', 'rather'),
    lemma: 'rather',
    variants: [],
    category: 'degree',
    subcategory: 'medium_intensifier',
    description: 'Moderate degree, formal tone',
    examples: ['rather bright', 'rather complex', 'make it rather smoother'],
    modifies: ['adjective', 'adverb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 1.3,
      direction: 'increase',
      affects: ['intensity'],
    },
    synonyms: ['quite', 'fairly'],
    antonyms: ['barely'],
    register: 'formal',
    colloquialVariants: [],
  },

  {
    id: createLexemeId('adv', 'moderately'),
    lemma: 'moderately',
    variants: ['moderate'],
    category: 'degree',
    subcategory: 'medium_intensifier',
    description: 'Medium degree, neutral',
    examples: ['moderately bright', 'moderately fast', 'make it moderately louder'],
    modifies: ['adjective', 'adverb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 1.2,
      direction: 'increase',
      affects: ['intensity'],
    },
    synonyms: ['fairly', 'reasonably'],
    antonyms: ['extremely', 'barely'],
    register: 'formal',
    colloquialVariants: [],
  },
];

// =============================================================================
// Degree Adverbs - Diminishers
// =============================================================================

export const DIMINISHER_ADVERBS: readonly AdverbLexeme[] = [
  {
    id: createLexemeId('adv', 'slightly'),
    lemma: 'slightly',
    variants: ['slight'],
    category: 'degree',
    subcategory: 'diminisher',
    description: 'Small degree of change',
    examples: ['slightly brighter', 'slightly faster', 'make it slightly tighter'],
    modifies: ['adjective', 'adverb', 'verb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 0.5,
      direction: 'decrease',
      affects: ['intensity', 'magnitude'],
    },
    synonyms: ['a bit', 'a little', 'somewhat'],
    antonyms: ['extremely', 'very', 'greatly'],
    register: 'formal',
    colloquialVariants: ['a bit', 'a tad'],
  },

  {
    id: createLexemeId('adv', 'somewhat'),
    lemma: 'somewhat',
    variants: [],
    category: 'degree',
    subcategory: 'diminisher',
    description: 'Moderate diminishing degree',
    examples: ['somewhat brighter', 'somewhat faster', 'make it somewhat smoother'],
    modifies: ['adjective', 'adverb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 0.7,
      direction: 'decrease',
      affects: ['intensity'],
    },
    synonyms: ['rather', 'fairly', 'kind of'],
    antonyms: ['extremely', 'very'],
    register: 'formal',
    colloquialVariants: ['kinda', 'sorta'],
  },

  {
    id: createLexemeId('adv', 'barely'),
    lemma: 'barely',
    variants: [],
    category: 'degree',
    subcategory: 'minimal_diminisher',
    description: 'Very small degree, almost not',
    examples: ['barely audible', 'barely noticeable', 'barely change it'],
    modifies: ['adjective', 'adverb', 'verb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 0.2,
      direction: 'decrease',
      affects: ['intensity'],
    },
    synonyms: ['hardly', 'scarcely', 'minimally'],
    antonyms: ['extremely', 'very', 'greatly'],
    register: 'formal',
    colloquialVariants: [],
  },

  {
    id: createLexemeId('adv', 'hardly'),
    lemma: 'hardly',
    variants: [],
    category: 'degree',
    subcategory: 'minimal_diminisher',
    description: 'Very small degree, almost not',
    examples: ['hardly noticeable', 'hardly changed', 'hardly any reverb'],
    modifies: ['adjective', 'adverb', 'verb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 0.2,
      direction: 'decrease',
      affects: ['intensity'],
    },
    synonyms: ['barely', 'scarcely'],
    antonyms: ['extremely', 'very'],
    register: 'formal',
    colloquialVariants: [],
  },

  {
    id: createLexemeId('adv', 'a-bit'),
    lemma: 'a bit',
    variants: ['a little', 'a little bit'],
    category: 'degree',
    subcategory: 'diminisher',
    description: 'Small degree, colloquial',
    examples: ['a bit brighter', 'a little faster', 'just a bit tighter'],
    modifies: ['adjective', 'adverb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 0.5,
      direction: 'decrease',
      affects: ['intensity'],
    },
    synonyms: ['slightly', 'somewhat'],
    antonyms: ['very', 'really'],
    register: 'informal',
    colloquialVariants: ['a tad', 'a touch'],
  },

  {
    id: createLexemeId('adv', 'a-little'),
    lemma: 'a little',
    variants: ['a little bit'],
    category: 'degree',
    subcategory: 'diminisher',
    description: 'Small degree, common',
    examples: ['a little brighter', 'a little more', 'make it a little tighter'],
    modifies: ['adjective', 'adverb', 'verb'],
    semantics: {
      type: 'degree_modifier',
      multiplier: 0.5,
      direction: 'decrease',
      affects: ['intensity'],
    },
    synonyms: ['a bit', 'slightly', 'somewhat'],
    antonyms: ['very', 'really', 'extremely'],
    register: 'informal',
    colloquialVariants: ['a tad'],
  },
];

// =============================================================================
// Manner Adverbs - Speed/Tempo
// =============================================================================

export const MANNER_SPEED_ADVERBS: readonly AdverbLexeme[] = [
  {
    id: createLexemeId('adv', 'quickly'),
    lemma: 'quickly',
    variants: ['quick', 'fast'],
    category: 'manner',
    subcategory: 'speed',
    description: 'At high speed',
    examples: ['fade quickly', 'transition quickly', 'change quickly'],
    modifies: ['verb'],
    semantics: {
      type: 'manner_modifier',
      direction: 'increase',
      affects: ['speed', 'tempo', 'rate'],
    },
    synonyms: ['rapidly', 'swiftly', 'fast'],
    antonyms: ['slowly', 'gradually'],
    register: 'formal',
    colloquialVariants: ['fast'],
  },

  {
    id: createLexemeId('adv', 'slowly'),
    lemma: 'slowly',
    variants: ['slow'],
    category: 'manner',
    subcategory: 'speed',
    description: 'At low speed',
    examples: ['fade slowly', 'transition slowly', 'change slowly'],
    modifies: ['verb'],
    semantics: {
      type: 'manner_modifier',
      direction: 'decrease',
      affects: ['speed', 'tempo', 'rate'],
    },
    synonyms: ['gradually', 'steadily'],
    antonyms: ['quickly', 'rapidly', 'fast'],
    register: 'formal',
    colloquialVariants: [],
  },

  {
    id: createLexemeId('adv', 'gradually'),
    lemma: 'gradually',
    variants: ['gradual'],
    category: 'manner',
    subcategory: 'progression',
    description: 'Step by step over time',
    examples: ['fade gradually', 'increase gradually', 'change gradually'],
    modifies: ['verb'],
    semantics: {
      type: 'manner_modifier',
      direction: 'neutral',
      affects: ['progression', 'transition'],
    },
    synonyms: ['slowly', 'progressively', 'steadily'],
    antonyms: ['suddenly', 'abruptly', 'immediately'],
    register: 'formal',
    colloquialVariants: [],
  },

  {
    id: createLexemeId('adv', 'suddenly'),
    lemma: 'suddenly',
    variants: ['sudden'],
    category: 'manner',
    subcategory: 'abruptness',
    description: 'Without warning, immediately',
    examples: ['cut suddenly', 'drop suddenly', 'change suddenly'],
    modifies: ['verb'],
    semantics: {
      type: 'manner_modifier',
      direction: 'neutral',
      affects: ['abruptness', 'transition'],
    },
    synonyms: ['abruptly', 'immediately', 'instantly'],
    antonyms: ['gradually', 'slowly', 'steadily'],
    register: 'formal',
    colloquialVariants: ['all at once'],
  },

  {
    id: createLexemeId('adv', 'smoothly'),
    lemma: 'smoothly',
    variants: ['smooth'],
    category: 'manner',
    subcategory: 'quality',
    description: 'Without roughness or discontinuity',
    examples: ['transition smoothly', 'move smoothly', 'fade smoothly'],
    modifies: ['verb'],
    semantics: {
      type: 'manner_modifier',
      direction: 'neutral',
      affects: ['smoothness', 'continuity'],
    },
    synonyms: ['seamlessly', 'fluidly', 'continuously'],
    antonyms: ['abruptly', 'roughly', 'choppily'],
    register: 'formal',
    colloquialVariants: [],
  },
];

// =============================================================================
// Time Adverbs
// =============================================================================

export const TIME_ADVERBS: readonly AdverbLexeme[] = [
  {
    id: createLexemeId('adv', 'now'),
    lemma: 'now',
    variants: ['right now'],
    category: 'time',
    subcategory: 'present',
    description: 'At the current moment',
    examples: ['change it now', 'fix it now', 'do it now'],
    modifies: ['verb', 'clause'],
    semantics: {
      type: 'temporal',
      absoluteValue: 'present',
      affects: ['timing'],
    },
    synonyms: ['immediately', 'right now', 'currently'],
    antonyms: ['later', 'eventually'],
    register: 'informal',
    colloquialVariants: ['right now', 'right away'],
  },

  {
    id: createLexemeId('adv', 'later'),
    lemma: 'later',
    variants: [],
    category: 'time',
    subcategory: 'future',
    description: 'At a future time',
    examples: ['add it later', 'fix it later', 'do it later in the song'],
    modifies: ['verb', 'clause'],
    semantics: {
      type: 'temporal',
      absoluteValue: 'future',
      affects: ['timing'],
    },
    synonyms: ['afterwards', 'subsequently'],
    antonyms: ['now', 'earlier', 'before'],
    register: 'informal',
    colloquialVariants: [],
  },

  {
    id: createLexemeId('adv', 'before'),
    lemma: 'before',
    variants: ['beforehand'],
    category: 'time',
    subcategory: 'prior',
    description: 'At an earlier time',
    examples: ['add it before the chorus', 'do it before', 'change it before'],
    modifies: ['verb', 'clause'],
    semantics: {
      type: 'temporal',
      absoluteValue: 'prior',
      affects: ['timing', 'sequence'],
    },
    synonyms: ['earlier', 'previously', 'beforehand'],
    antonyms: ['after', 'later'],
    register: 'formal',
    colloquialVariants: [],
  },

  {
    id: createLexemeId('adv', 'after'),
    lemma: 'after',
    variants: ['afterwards'],
    category: 'time',
    subcategory: 'subsequent',
    description: 'At a later time',
    examples: ['add it after the verse', 'do it after', 'change it afterwards'],
    modifies: ['verb', 'clause'],
    semantics: {
      type: 'temporal',
      absoluteValue: 'subsequent',
      affects: ['timing', 'sequence'],
    },
    synonyms: ['afterwards', 'subsequently', 'later'],
    antonyms: ['before', 'earlier'],
    register: 'formal',
    colloquialVariants: [],
  },

  {
    id: createLexemeId('adv', 'always'),
    lemma: 'always',
    variants: [],
    category: 'frequency',
    subcategory: 'universal',
    description: 'At all times, universally',
    examples: ['always keep the melody', 'always maintain tempo', 'it always sounds better'],
    modifies: ['verb', 'clause'],
    semantics: {
      type: 'frequency',
      absoluteValue: 1.0,
      affects: ['frequency', 'universality'],
    },
    synonyms: ['constantly', 'continuously', 'invariably'],
    antonyms: ['never', 'rarely'],
    register: 'formal',
    colloquialVariants: [],
  },

  {
    id: createLexemeId('adv', 'never'),
    lemma: 'never',
    variants: [],
    category: 'frequency',
    subcategory: 'negation',
    description: 'At no time, not ever',
    examples: ['never change the melody', 'never lose the groove', 'it never works'],
    modifies: ['verb', 'clause'],
    semantics: {
      type: 'frequency',
      absoluteValue: 0.0,
      affects: ['frequency', 'negation'],
    },
    synonyms: [],
    antonyms: ['always', 'constantly'],
    register: 'formal',
    colloquialVariants: [],
  },
];

// =============================================================================
// Frequency Adverbs
// =============================================================================

export const FREQUENCY_ADVERBS: readonly AdverbLexeme[] = [
  {
    id: createLexemeId('adv', 'often'),
    lemma: 'often',
    variants: ['frequently'],
    category: 'frequency',
    subcategory: 'high_frequency',
    description: 'With high frequency',
    examples: ['it often works', 'often sounds better', 'I often do this'],
    modifies: ['verb', 'clause'],
    semantics: {
      type: 'frequency',
      absoluteValue: 0.7,
      affects: ['frequency'],
    },
    synonyms: ['frequently', 'commonly', 'regularly'],
    antonyms: ['rarely', 'seldom', 'never'],
    register: 'formal',
    colloquialVariants: ['a lot'],
  },

  {
    id: createLexemeId('adv', 'sometimes'),
    lemma: 'sometimes',
    variants: ['occasionally'],
    category: 'frequency',
    subcategory: 'medium_frequency',
    description: 'With medium frequency',
    examples: ['it sometimes works', 'sometimes sounds better', 'occasionally add reverb'],
    modifies: ['verb', 'clause'],
    semantics: {
      type: 'frequency',
      absoluteValue: 0.5,
      affects: ['frequency'],
    },
    synonyms: ['occasionally', 'at times', 'now and then'],
    antonyms: ['always', 'never'],
    register: 'informal',
    colloquialVariants: [],
  },

  {
    id: createLexemeId('adv', 'rarely'),
    lemma: 'rarely',
    variants: ['seldom'],
    category: 'frequency',
    subcategory: 'low_frequency',
    description: 'With low frequency',
    examples: ['it rarely works', 'rarely sounds better', 'seldom needs reverb'],
    modifies: ['verb', 'clause'],
    semantics: {
      type: 'frequency',
      absoluteValue: 0.2,
      affects: ['frequency'],
    },
    synonyms: ['seldom', 'infrequently', 'uncommonly'],
    antonyms: ['often', 'frequently', 'always'],
    register: 'formal',
    colloquialVariants: [],
  },
];

// =============================================================================
// All Adverbs Registry
// =============================================================================

/**
 * All adverbs in this batch.
 */
export const ALL_ADVERBS: readonly AdverbLexeme[] = [
  ...STRONG_DEGREE_ADVERBS,
  ...MEDIUM_DEGREE_ADVERBS,
  ...DIMINISHER_ADVERBS,
  ...MANNER_SPEED_ADVERBS,
  ...TIME_ADVERBS,
  ...FREQUENCY_ADVERBS,
];

/**
 * Statistics about this vocabulary batch.
 */
export const BATCH_STATS = {
  totalAdverbs: ALL_ADVERBS.length,
  strongDegree: STRONG_DEGREE_ADVERBS.length,
  mediumDegree: MEDIUM_DEGREE_ADVERBS.length,
  diminisher: DIMINISHER_ADVERBS.length,
  mannerSpeed: MANNER_SPEED_ADVERBS.length,
  time: TIME_ADVERBS.length,
  frequency: FREQUENCY_ADVERBS.length,
} as const;

// Export for use in main lexicon
export default ALL_ADVERBS;
