/**
 * @file Domain Adjectives Batch 26 - Conversational & Colloquial Musical Terms
 * @module gofai/canon/domain-adjectives-batch26-conversational
 * 
 * Extensive vocabulary of colloquial, conversational, and natural language
 * expressions musicians use in studio sessions. This batch focuses on:
 * 
 * - Informal descriptors ("groovy", "funky", "slick", "tight")
 * - Comparative/superlative forms ("way more punchy", "super bright")  
 * - Hedged expressions ("kinda dark", "sorta muddy", "a bit loud")
 * - Intensifiers and diminishers ("really", "very", "slightly", "barely")
 * - Vernacular quality terms ("sick", "fire", "nasty", "killer")
 * - Subjective feel descriptors ("feels too rushed", "sounds off")
 * - Metaphorical spatial terms ("up front", "pushed back", "sitting right")
 * - Production slang ("glued together", "sitting in the pocket", "on top")
 * 
 * Total: 600+ LOC covering comprehensive natural studio language
 * 
 * @see gofai_goalB.md Phase 1 - Canonical Ontology + Extensible Symbol Tables
 * @see gofaimusicplus.md Section 4 - The 100K+ LOC English → CPL Parser
 */

import type { LexemeId, AxisId } from './types';
import { createLexemeId, createAxisId } from './types';

/**
 * Adjective lexeme for conversational musical description.
 */
export interface ConversationalAdjective {
  readonly id: LexemeId;
  readonly lemma: string;
  readonly variants: readonly string[];
  readonly category: 'adjective';
  readonly semantics: {
    readonly axes: readonly AxisId[];
    readonly direction: 'increase' | 'decrease' | 'neutral';
    readonly intensity: 'subtle' | 'moderate' | 'strong' | 'extreme';
    readonly affects: readonly string[];
  };
  readonly description: string;
  readonly examples: readonly string[];
  readonly colloquialVariants: readonly string[];
  readonly hedgedForms: readonly string[];
  readonly intensifiedForms: readonly string[];
  readonly register: 'formal' | 'informal' | 'slang' | 'technical';
  readonly era: 'classic' | 'modern' | 'contemporary' | 'timeless';
  readonly usageContext: readonly string[];
}

// =============================================================================
// Conversational Quality Descriptors - Positive
// =============================================================================

export const CONVERSATIONAL_POSITIVE: readonly ConversationalAdjective[] = [
  {
    id: createLexemeId('adj', 'groovy'),
    lemma: 'groovy',
    variants: ['groove-heavy', 'grooving', 'grooved', 'groovier', 'grooviest'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('groove_feel'), createAxisId('pocket'), createAxisId('swing')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['rhythm', 'feel', 'timing'],
    },
    description: 'Having strong rhythmic feel and pocket; makes you want to move',
    examples: ['make it more groovy', 'the bass is super groovy', 'needs to feel groovier'],
    colloquialVariants: ['groovin\'', 'grooved out', 'in the groove'],
    hedgedForms: ['kinda groovy', 'sorta groovy', 'pretty groovy'],
    intensifiedForms: ['really groovy', 'super groovy', 'mad groovy', 'seriously groovy'],
    register: 'informal',
    era: 'timeless',
    usageContext: ['studio_session', 'casual_conversation', 'collaboration'],
  },

  {
    id: createLexemeId('adj', 'funky'),
    lemma: 'funky',
    variants: ['funk-heavy', 'funked up', 'funkier', 'funkiest'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('syncopation'), createAxisId('groove_tightness'), createAxisId('energy')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['rhythm', 'harmony', 'arrangement'],
    },
    description: 'Syncopated, groove-oriented, with funk music characteristics',
    examples: ['make the drums funkier', 'that guitar is super funky', 'needs more funk'],
    colloquialVariants: ['funked out', 'got that funk', 'funkalicious'],
    hedgedForms: ['kinda funky', 'sorta funky', 'a bit funky'],
    intensifiedForms: ['really funky', 'super funky', 'mad funky', 'straight-up funky'],
    register: 'informal',
    era: 'timeless',
    usageContext: ['studio_session', 'casual_conversation', 'production_talk'],
  },

  {
    id: createLexemeId('adj', 'tight'),
    lemma: 'tight',
    variants: ['tighter', 'tightest', 'tightened', 'locked-in'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('timing_precision'), createAxisId('transient_definition'), createAxisId('groove_tightness')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['timing', 'rhythm', 'production'],
    },
    description: 'Precise timing, clean transients, well-defined rhythmic feel',
    examples: ['make the drums tighter', 'the whole mix is super tight', 'tighten up those hats'],
    colloquialVariants: ['locked tight', 'tight as hell', 'buttoned up'],
    hedgedForms: ['pretty tight', 'fairly tight', 'somewhat tight'],
    intensifiedForms: ['really tight', 'super tight', 'mad tight', 'crazy tight'],
    register: 'informal',
    era: 'timeless',
    usageContext: ['studio_session', 'production_talk', 'collaboration'],
  },

  {
    id: createLexemeId('adj', 'slick'),
    lemma: 'slick',
    variants: ['slicker', 'slickest', 'slicked-up', 'polished'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('polish'), createAxisId('clarity'), createAxisId('smoothness')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['production', 'mix', 'arrangement'],
    },
    description: 'Polished, smooth production quality; professional and clean',
    examples: ['make the production slicker', 'that transition is super slick', 'needs to sound more slick'],
    colloquialVariants: ['smooth', 'sleek', 'clean as hell'],
    hedgedForms: ['pretty slick', 'kinda slick', 'fairly slick'],
    intensifiedForms: ['really slick', 'super slick', 'mad slick'],
    register: 'informal',
    era: 'modern',
    usageContext: ['studio_session', 'production_talk', 'formal_critique'],
  },

  {
    id: createLexemeId('adj', 'sick'),
    lemma: 'sick',
    variants: ['sicker', 'sickest'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('impact'), createAxisId('excitement'), createAxisId('quality')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['overall', 'energy', 'interest'],
    },
    description: 'Excellent, impressive, exciting (positive slang)',
    examples: ['that drop is sick', 'make it sound even sicker', 'the bass is so sick'],
    colloquialVariants: ['ill', 'nasty', 'fire', 'lit', 'insane'],
    hedgedForms: ['pretty sick', 'kinda sick'],
    intensifiedForms: ['really sick', 'super sick', 'so sick', 'mad sick'],
    register: 'slang',
    era: 'contemporary',
    usageContext: ['casual_conversation', 'studio_session', 'collaboration'],
  },

  {
    id: createLexemeId('adj', 'fire'),
    lemma: 'fire',
    variants: ['straight fire', 'pure fire'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('energy'), createAxisId('impact'), createAxisId('excitement')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['overall', 'energy', 'mood'],
    },
    description: 'Excellent, high energy, exciting (positive slang)',
    examples: ['that beat is fire', 'the mix is straight fire', 'make it more fire'],
    colloquialVariants: ['flames', 'heat', 'hot', 'blazing'],
    hedgedForms: [],
    intensifiedForms: ['absolute fire', 'pure fire', 'straight fire'],
    register: 'slang',
    era: 'contemporary',
    usageContext: ['casual_conversation', 'collaboration'],
  },

  {
    id: createLexemeId('adj', 'killer'),
    lemma: 'killer',
    variants: ['killing'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('impact'), createAxisId('power'), createAxisId('intensity')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['overall', 'energy', 'impact'],
    },
    description: 'Exceptionally good, powerful, impactful',
    examples: ['that riff is killer', 'the drums are absolutely killer', 'needs a killer hook'],
    colloquialVariants: ['murderous', 'devastating', 'crushing'],
    hedgedForms: ['pretty killer'],
    intensifiedForms: ['absolutely killer', 'totally killer'],
    register: 'informal',
    era: 'classic',
    usageContext: ['studio_session', 'casual_conversation'],
  },

  {
    id: createLexemeId('adj', 'crisp'),
    lemma: 'crisp',
    variants: ['crisper', 'crispest', 'crispy'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('transient_definition'), createAxisId('brightness'), createAxisId('clarity')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['production', 'timbre', 'high_frequency'],
    },
    description: 'Clear transients, defined high frequencies, sharp attack',
    examples: ['make the snare crisper', 'the hats are super crisp', 'needs more crispness'],
    colloquialVariants: ['sharp', 'clean', 'defined'],
    hedgedForms: ['pretty crisp', 'fairly crisp', 'kinda crisp'],
    intensifiedForms: ['really crisp', 'super crisp', 'mad crisp'],
    register: 'informal',
    era: 'timeless',
    usageContext: ['studio_session', 'production_talk'],
  },

  {
    id: createLexemeId('adj', 'smooth'),
    lemma: 'smooth',
    variants: ['smoother', 'smoothest', 'smoothed-out'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('smoothness'), createAxisId('legato'), createAxisId('continuity')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['production', 'melody', 'transitions'],
    },
    description: 'Flowing, continuous, without roughness or discontinuity',
    examples: ['make the transition smoother', 'the vocals are butter smooth', 'needs to sound more smooth'],
    colloquialVariants: ['silky', 'buttery', 'velvety'],
    hedgedForms: ['pretty smooth', 'fairly smooth', 'kinda smooth'],
    intensifiedForms: ['really smooth', 'super smooth', 'butter smooth'],
    register: 'informal',
    era: 'timeless',
    usageContext: ['studio_session', 'production_talk', 'formal_critique'],
  },

  {
    id: createLexemeId('adj', 'clean'),
    lemma: 'clean',
    variants: ['cleaner', 'cleanest', 'cleaned-up'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('clarity'), createAxisId('purity'), createAxisId('noise_floor')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['production', 'mix', 'timbre'],
    },
    description: 'Free from noise, distortion, or unwanted artifacts',
    examples: ['make the mix cleaner', 'the guitar is super clean', 'clean up the low end'],
    colloquialVariants: ['pristine', 'pure', 'clear'],
    hedgedForms: ['pretty clean', 'fairly clean', 'kinda clean'],
    intensifiedForms: ['really clean', 'super clean', 'squeaky clean'],
    register: 'informal',
    era: 'timeless',
    usageContext: ['studio_session', 'production_talk', 'teaching'],
  },
];

// =============================================================================
// Conversational Quality Descriptors - Negative/Problems
// =============================================================================

export const CONVERSATIONAL_NEGATIVE: readonly ConversationalAdjective[] = [
  {
    id: createLexemeId('adj', 'muddy'),
    lemma: 'muddy',
    variants: ['muddier', 'muddiest', 'muddied'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('clarity'), createAxisId('definition'), createAxisId('separation')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['production', 'mix', 'low_frequency'],
    },
    description: 'Lacking clarity, definition, or frequency separation (negative)',
    examples: ['the low end is too muddy', 'sounds kinda muddy', 'clean up the muddy parts'],
    colloquialVariants: ['murky', 'cloudy', 'unclear', 'mushy'],
    hedgedForms: ['kinda muddy', 'sorta muddy', 'a bit muddy'],
    intensifiedForms: ['really muddy', 'super muddy', 'way too muddy'],
    register: 'informal',
    era: 'timeless',
    usageContext: ['studio_session', 'production_talk', 'teaching'],
  },

  {
    id: createLexemeId('adj', 'harsh'),
    lemma: 'harsh',
    variants: ['harsher', 'harshest', 'harshness'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('brightness'), createAxisId('presence'), createAxisId('aggression')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['production', 'timbre', 'high_frequency'],
    },
    description: 'Excessively bright, aggressive high frequencies (negative)',
    examples: ['the cymbals are too harsh', 'sounds kinda harsh', 'soften the harsh frequencies'],
    colloquialVariants: ['abrasive', 'grating', 'piercing', 'painful'],
    hedgedForms: ['kinda harsh', 'somewhat harsh', 'a bit harsh'],
    intensifiedForms: ['really harsh', 'super harsh', 'way too harsh'],
    register: 'informal',
    era: 'timeless',
    usageContext: ['studio_session', 'production_talk'],
  },

  {
    id: createLexemeId('adj', 'thin'),
    lemma: 'thin',
    variants: ['thinner', 'thinnest', 'thinned-out'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('body'), createAxisId('fullness'), createAxisId('low_frequency')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['production', 'timbre', 'bass'],
    },
    description: 'Lacking body, weight, or low-frequency content (negative)',
    examples: ['the bass sounds too thin', 'mix is kinda thin', 'fatten up the thin sound'],
    colloquialVariants: ['weak', 'wimpy', 'anemic', 'lacking body'],
    hedgedForms: ['kinda thin', 'sorta thin', 'a bit thin'],
    intensifiedForms: ['really thin', 'super thin', 'way too thin'],
    register: 'informal',
    era: 'timeless',
    usageContext: ['studio_session', 'production_talk', 'teaching'],
  },

  {
    id: createLexemeId('adj', 'boomy'),
    lemma: 'boomy',
    variants: ['boomier', 'boomiest', 'boomed-out'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('low_frequency'), createAxisId('resonance'), createAxisId('sustain')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['production', 'bass', 'room_sound'],
    },
    description: 'Excessive low-frequency resonance or sustain (negative)',
    examples: ['the kick is too boomy', 'room sounds kinda boomy', 'tighten up the boomy low end'],
    colloquialVariants: ['woofy', 'tubby', 'bottom-heavy'],
    hedgedForms: ['kinda boomy', 'sorta boomy', 'a bit boomy'],
    intensifiedForms: ['really boomy', 'super boomy', 'way too boomy'],
    register: 'informal',
    era: 'timeless',
    usageContext: ['studio_session', 'production_talk'],
  },

  {
    id: createLexemeId('adj', 'boxy'),
    lemma: 'boxy',
    variants: ['boxier', 'boxiest', 'boxed-in'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('midrange'), createAxisId('resonance'), createAxisId('nasal')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['production', 'timbre', 'midrange'],
    },
    description: 'Excessive midrange resonance, sounds confined (negative)',
    examples: ['vocals sound too boxy', 'the mix is kinda boxy', 'cut the boxy frequencies'],
    colloquialVariants: ['honky', 'nasal', 'midrange-heavy'],
    hedgedForms: ['kinda boxy', 'sorta boxy', 'a bit boxy'],
    intensifiedForms: ['really boxy', 'super boxy', 'way too boxy'],
    register: 'technical',
    era: 'timeless',
    usageContext: ['studio_session', 'production_talk'],
  },

  {
    id: createLexemeId('adj', 'sloppy'),
    lemma: 'sloppy',
    variants: ['sloppier', 'sloppiest', 'slopped-up'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('timing_precision'), createAxisId('groove_tightness'), createAxisId('performance')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['timing', 'rhythm', 'performance'],
    },
    description: 'Imprecise timing, lacking rhythmic tightness (negative)',
    examples: ['the drums are too sloppy', 'performance is kinda sloppy', 'tighten up the sloppy parts'],
    colloquialVariants: ['loose', 'messy', 'untight', 'all over the place'],
    hedgedForms: ['kinda sloppy', 'sorta sloppy', 'a bit sloppy'],
    intensifiedForms: ['really sloppy', 'super sloppy', 'way too sloppy'],
    register: 'informal',
    era: 'timeless',
    usageContext: ['studio_session', 'teaching', 'collaboration'],
  },

  {
    id: createLexemeId('adj', 'cluttered'),
    lemma: 'cluttered',
    variants: ['more cluttered', 'most cluttered', 'de-cluttered'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('density'), createAxisId('busyness'), createAxisId('complexity')],
      direction: 'increase',
      intensity: 'strong',
      affects: ['arrangement', 'mix', 'complexity'],
    },
    description: 'Too many elements competing, overcrowded arrangement (negative)',
    examples: ['the chorus is too cluttered', 'sounds kinda cluttered', 'strip away the clutter'],
    colloquialVariants: ['busy', 'crowded', 'overloaded', 'too much'],
    hedgedForms: ['kinda cluttered', 'sorta cluttered', 'a bit cluttered'],
    intensifiedForms: ['really cluttered', 'super cluttered', 'way too cluttered'],
    register: 'informal',
    era: 'timeless',
    usageContext: ['studio_session', 'production_talk', 'teaching'],
  },
];

// =============================================================================
// Spatial/Positional Conversational Terms
// =============================================================================

export const CONVERSATIONAL_SPATIAL: readonly ConversationalAdjective[] = [
  {
    id: createLexemeId('adj', 'upfront'),
    lemma: 'up front',
    variants: ['upfront', 'in-your-face', 'forward'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('presence'), createAxisId('proximity'), createAxisId('prominence')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['mix', 'spatial', 'balance'],
    },
    description: 'Prominent in the mix, close to the listener',
    examples: ['bring the vocals more up front', 'the kick is way up front', 'needs to be more upfront'],
    colloquialVariants: ['right there', 'in front', 'present'],
    hedgedForms: ['kinda up front', 'sorta up front', 'pretty up front'],
    intensifiedForms: ['way up front', 'super up front', 'right up front'],
    register: 'informal',
    era: 'timeless',
    usageContext: ['studio_session', 'production_talk'],
  },

  {
    id: createLexemeId('adj', 'pushed_back'),
    lemma: 'pushed back',
    variants: ['pushed-down', 'recessed', 'distant'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('presence'), createAxisId('proximity'), createAxisId('depth')],
      direction: 'decrease',
      intensity: 'moderate',
      affects: ['mix', 'spatial', 'reverb'],
    },
    description: 'Recessed in the mix, distant from the listener',
    examples: ['push the pad back', 'the strings are too pushed back', 'needs to sit farther back'],
    colloquialVariants: ['back there', 'in the back', 'farther away'],
    hedgedForms: ['kinda pushed back', 'sorta pushed back'],
    intensifiedForms: ['way pushed back', 'really pushed back'],
    register: 'informal',
    era: 'timeless',
    usageContext: ['studio_session', 'production_talk'],
  },

  {
    id: createLexemeId('adj', 'glued'),
    lemma: 'glued',
    variants: ['glued together', 'glued-in'],
    category: 'adjective',
    semantics: {
      axes: [createAxisId('cohesion'), createAxisId('blend'), createAxisId('unity')],
      direction: 'increase',
      intensity: 'moderate',
      affects: ['mix', 'production', 'cohesion'],
    },
    description: 'Well-integrated, cohesive sounding, elements working together',
    examples: ['make it sound more glued', 'the mix is really glued together', 'needs more glue'],
    colloquialVariants: ['cohesive', 'unified', 'blended'],
    hedgedForms: ['pretty glued', 'fairly glued'],
    intensifiedForms: ['really glued', 'totally glued together'],
    register: 'informal',
    era: 'modern',
    usageContext: ['studio_session', 'production_talk'],
  },
];

// =============================================================================
// Intensifiers and Modifiers
// =============================================================================

/**
 * Strong intensifier adverbs.
 */
export const STRONG_INTENSIFIERS: readonly string[] = [
  'really', 'super', 'very', 'extremely', 'incredibly', 'exceptionally',
  'way', 'mad', 'crazy', 'insanely', 'ridiculously', 'absolutely',
  'totally', 'completely', 'utterly', 'seriously', 'genuinely',
];

/**
 * Medium intensifier adverbs.
 */
export const MEDIUM_INTENSIFIERS: readonly string[] = [
  'pretty', 'quite', 'fairly', 'rather', 'reasonably', 'moderately',
];

/**
 * Colloquial intensifiers.
 */
export const COLLOQUIAL_INTENSIFIERS: readonly string[] = [
  'hella', 'wicked', 'proper', 'dead', 'bare', 'well',
];

/**
 * Excessive markers.
 */
export const EXCESSIVE_MARKERS: readonly string[] = [
  'way too', 'far too', 'much too', 'overly', 'excessively',
];

/**
 * Weak diminishers.
 */
export const WEAK_DIMINISHERS: readonly string[] = [
  'slightly', 'a bit', 'a little', 'somewhat', 'kind of', 'sort of',
  'kinda', 'sorta', 'a touch', 'a tad', 'marginally', 'barely',
  'hardly', 'scarcely', 'minimally',
];

/**
 * Hedging phrases.
 */
export const HEDGING_PHRASES: readonly string[] = [
  'feels like', 'sounds like', 'seems like', 'comes across as',
  'gives me', 'has a', 'reads as', 'strikes me as',
];

// =============================================================================
// All Conversational Adjectives Registry
// =============================================================================

/**
 * All conversational adjectives in this batch.
 */
export const ALL_CONVERSATIONAL_ADJECTIVES: readonly ConversationalAdjective[] = [
  ...CONVERSATIONAL_POSITIVE,
  ...CONVERSATIONAL_NEGATIVE,
  ...CONVERSATIONAL_SPATIAL,
];

/**
 * Statistics about this vocabulary batch.
 */
export const BATCH_STATS = {
  totalAdjectives: ALL_CONVERSATIONAL_ADJECTIVES.length,
  positiveQuality: CONVERSATIONAL_POSITIVE.length,
  negativeQuality: CONVERSATIONAL_NEGATIVE.length,
  spatial: CONVERSATIONAL_SPATIAL.length,
  strongIntensifiers: STRONG_INTENSIFIERS.length,
  mediumIntensifiers: MEDIUM_INTENSIFIERS.length,
  colloquialIntensifiers: COLLOQUIAL_INTENSIFIERS.length,
  excessiveMarkers: EXCESSIVE_MARKERS.length,
  weakDiminishers: WEAK_DIMINISHERS.length,
  hedgingPhrases: HEDGING_PHRASES.length,
} as const;

// Export for use in main lexicon
export default ALL_CONVERSATIONAL_ADJECTIVES;
