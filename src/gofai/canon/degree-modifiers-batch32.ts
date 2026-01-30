/**
 * GOFAI Canon — Degree Modifiers and Intensifiers Batch 32
 *
 * Comprehensive catalog of degree modifiers, intensifiers, and downtoners that
 * express gradation and scalar meaning in musical descriptions.
 *
 * These words modify adjectives, verbs, and other modifiers to express:
 * - **Intensity**: how much of a quality (very, extremely, slightly)
 * - **Precision**: exact vs approximate (exactly, about, roughly)
 * - **Comparison**: relative degree (more, less, too, enough)
 * - **Extremity**: upper and lower bounds (completely, barely, almost)
 *
 * **Critical for Music Dialog:**
 * "Make it brighter" vs "Make it a little brighter" vs "Make it way brighter"
 * These modifiers map to numerical amounts in plan generation.
 *
 * **Design Principles:**
 * 1. **Scalar Semantics**: Each modifier has a numerical interpretation range
 * 2. **Compositional**: Modifiers can stack ("just a little bit brighter")
 * 3. **Context-Dependent**: "Very bright" has different absolute values in different contexts
 * 4. **Conversational**: Covers casual studio language ("kinda", "sorta", "way")
 *
 * ## Semantic Model
 *
 * Each degree modifier maps to:
 * - **Scale Factor**: Relative amount (0.1 = small, 1.0 = moderate, 2.0 = large)
 * - **Absoluteness**: Whether it specifies an exact degree
 * - **Boundedness**: Whether it has semantic limits (e.g., "completely" implies maximum)
 *
 * ## Integration with Planning
 *
 * When a user says "make it a little brighter":
 * 1. Parser identifies "a little" as degree modifier
 * 2. Maps to scale factor ~0.2-0.3
 * 3. Planner applies that factor to brightness adjustment
 * 4. "Little" becomes concrete parameter value
 *
 * @module gofai/canon/degree-modifiers-batch32
 */

import type { GofaiId } from './types';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Category of degree modifier
 */
export type DegreeCategory =
  | 'intensifier'      // very, extremely, really
  | 'downtoner'        // slightly, somewhat, a little
  | 'approximator'     // about, around, roughly
  | 'exact'            // exactly, precisely, just
  | 'comparative'      // more, less, as
  | 'superlative'      // most, least, -est
  | 'sufficiency'      // enough, too, sufficient
  | 'extreme'          // completely, totally, barely
  | 'informal';        // kinda, sorta, way, super

/**
 * Degree strength (mapped to numerical scale factors)
 */
export type DegreeStrength =
  | 'minimal'          // barely, slightly (0.05-0.15)
  | 'small'            // a little, somewhat (0.2-0.4)
  | 'moderate'         // moderately, fairly (0.5-0.7)
  | 'substantial'      // quite, rather (0.8-1.2)
  | 'strong'           // very, really (1.5-2.0)
  | 'extreme'          // extremely, incredibly (2.5-4.0)
  | 'maximal';         // completely, totally (at limit)

/**
 * Whether the modifier increases or decreases degree
 */
export type Polarity = 'positive' | 'negative' | 'neutral';

/**
 * A degree modifier entry
 */
export interface DegreeModifier {
  /** Canonical ID */
  readonly id: GofaiId;
  
  /** Surface form(s) */
  readonly forms: readonly string[];
  
  /** Category */
  readonly category: DegreeCategory;
  
  /** Strength level */
  readonly strength: DegreeStrength;
  
  /** Polarity */
  readonly polarity: Polarity;
  
  /** Scale factor range [min, max] */
  readonly scaleFactor: readonly [number, number];
  
  /** Whether this is absolute (vs relative) */
  readonly absolute?: boolean;
  
  /** Whether this indicates a boundary (maximum, minimum) */
  readonly boundary?: 'maximum' | 'minimum';
  
  /** Usage notes */
  readonly notes?: string;
  
  /** Typical collocations */
  readonly collocations?: readonly string[];
  
  /** Formality level */
  readonly formality?: 'formal' | 'neutral' | 'informal' | 'colloquial';
}

// =============================================================================
// Intensifiers — Positive (Increase Degree)
// =============================================================================

export const POSITIVE_INTENSIFIERS: readonly DegreeModifier[] = [
  {
    id: 'gofai:deg:very:strong' as GofaiId,
    forms: ['very'],
    category: 'intensifier',
    strength: 'strong',
    polarity: 'positive',
    scaleFactor: [1.5, 2.0],
    formality: 'neutral',
    notes: 'Most common intensifier',
    collocations: ['very bright', 'very wide', 'very loud', 'very fast'],
  },
  {
    id: 'gofai:deg:really:strong' as GofaiId,
    forms: ['really'],
    category: 'intensifier',
    strength: 'strong',
    polarity: 'positive',
    scaleFactor: [1.5, 2.0],
    formality: 'neutral',
    notes: 'Emphatic intensifier',
    collocations: ['really bright', 'really wide', 'really loud'],
  },
  {
    id: 'gofai:deg:extremely:extreme' as GofaiId,
    forms: ['extremely'],
    category: 'intensifier',
    strength: 'extreme',
    polarity: 'positive',
    scaleFactor: [2.5, 4.0],
    formality: 'formal',
    notes: 'Very strong intensifier',
    collocations: ['extremely bright', 'extremely loud', 'extremely fast'],
  },
  {
    id: 'gofai:deg:incredibly:extreme' as GofaiId,
    forms: ['incredibly'],
    category: 'intensifier',
    strength: 'extreme',
    polarity: 'positive',
    scaleFactor: [2.5, 4.0],
    formality: 'neutral',
    notes: 'Emphatic extreme intensifier',
    collocations: ['incredibly bright', 'incredibly wide', 'incredibly dense'],
  },
  {
    id: 'gofai:deg:exceptionally:extreme' as GofaiId,
    forms: ['exceptionally'],
    category: 'intensifier',
    strength: 'extreme',
    polarity: 'positive',
    scaleFactor: [2.5, 3.5],
    formality: 'formal',
    notes: 'Formal extreme intensifier',
    collocations: ['exceptionally bright', 'exceptionally clear'],
  },
  {
    id: 'gofai:deg:remarkably:extreme' as GofaiId,
    forms: ['remarkably'],
    category: 'intensifier',
    strength: 'extreme',
    polarity: 'positive',
    scaleFactor: [2.0, 3.0],
    formality: 'formal',
    notes: 'Noteworthy extreme',
    collocations: ['remarkably clear', 'remarkably tight'],
  },
  {
    id: 'gofai:deg:quite:substantial' as GofaiId,
    forms: ['quite'],
    category: 'intensifier',
    strength: 'substantial',
    polarity: 'positive',
    scaleFactor: [0.8, 1.2],
    formality: 'neutral',
    notes: 'Moderate-to-strong intensifier',
    collocations: ['quite bright', 'quite wide', 'quite loud'],
  },
  {
    id: 'gofai:deg:rather:substantial' as GofaiId,
    forms: ['rather'],
    category: 'intensifier',
    strength: 'substantial',
    polarity: 'positive',
    scaleFactor: [0.8, 1.2],
    formality: 'formal',
    notes: 'Formal moderate intensifier',
    collocations: ['rather bright', 'rather wide', 'rather loud'],
  },
  {
    id: 'gofai:deg:pretty:substantial' as GofaiId,
    forms: ['pretty'],
    category: 'intensifier',
    strength: 'substantial',
    polarity: 'positive',
    scaleFactor: [0.8, 1.2],
    formality: 'informal',
    notes: 'Informal moderate intensifier',
    collocations: ['pretty bright', 'pretty wide', 'pretty loud'],
  },
  {
    id: 'gofai:deg:fairly:moderate' as GofaiId,
    forms: ['fairly'],
    category: 'intensifier',
    strength: 'moderate',
    polarity: 'positive',
    scaleFactor: [0.5, 0.7],
    formality: 'neutral',
    notes: 'Modest intensifier',
    collocations: ['fairly bright', 'fairly wide', 'fairly loud'],
  },
  {
    id: 'gofai:deg:moderately:moderate' as GofaiId,
    forms: ['moderately'],
    category: 'intensifier',
    strength: 'moderate',
    polarity: 'positive',
    scaleFactor: [0.5, 0.7],
    formality: 'formal',
    notes: 'Explicit moderate degree',
    collocations: ['moderately bright', 'moderately loud'],
  },
  {
    id: 'gofai:deg:super:extreme_informal' as GofaiId,
    forms: ['super'],
    category: 'informal',
    strength: 'extreme',
    polarity: 'positive',
    scaleFactor: [2.0, 3.5],
    formality: 'informal',
    notes: 'Informal extreme intensifier',
    collocations: ['super bright', 'super wide', 'super loud'],
  },
  {
    id: 'gofai:deg:way:extreme_informal' as GofaiId,
    forms: ['way'],
    category: 'informal',
    strength: 'extreme',
    polarity: 'positive',
    scaleFactor: [2.0, 3.5],
    formality: 'colloquial',
    notes: 'Colloquial extreme intensifier',
    collocations: ['way brighter', 'way louder', 'way more reverb'],
  },
  {
    id: 'gofai:deg:ultra:extreme' as GofaiId,
    forms: ['ultra'],
    category: 'intensifier',
    strength: 'extreme',
    polarity: 'positive',
    scaleFactor: [2.5, 4.0],
    formality: 'informal',
    notes: 'Very extreme intensifier',
    collocations: ['ultra bright', 'ultra wide', 'ultra dense'],
  },
  {
    id: 'gofai:deg:mega:extreme_informal' as GofaiId,
    forms: ['mega'],
    category: 'informal',
    strength: 'extreme',
    polarity: 'positive',
    scaleFactor: [2.5, 4.0],
    formality: 'colloquial',
    notes: 'Colloquial extreme',
    collocations: ['mega bright', 'mega loud'],
  },
  {
    id: 'gofai:deg:totally:maximal' as GofaiId,
    forms: ['totally', 'completely'],
    category: 'extreme',
    strength: 'maximal',
    polarity: 'positive',
    scaleFactor: [3.0, 5.0],
    boundary: 'maximum',
    formality: 'informal',
    notes: 'Complete degree, implies maximum',
    collocations: ['totally bright', 'completely silent', 'totally maxed'],
  },
  {
    id: 'gofai:deg:absolutely:maximal' as GofaiId,
    forms: ['absolutely'],
    category: 'extreme',
    strength: 'maximal',
    polarity: 'positive',
    scaleFactor: [3.0, 5.0],
    boundary: 'maximum',
    formality: 'neutral',
    notes: 'Absolute maximum',
    collocations: ['absolutely maxed', 'absolutely silent'],
  },
  {
    id: 'gofai:deg:entirely:maximal' as GofaiId,
    forms: ['entirely', 'wholly'],
    category: 'extreme',
    strength: 'maximal',
    polarity: 'positive',
    scaleFactor: [3.0, 5.0],
    boundary: 'maximum',
    formality: 'formal',
    notes: 'Complete and total',
    collocations: ['entirely silent', 'wholly different'],
  },
];

// =============================================================================
// Downtoners — Reduce Degree
// =============================================================================

export const DOWNTONERS: readonly DegreeModifier[] = [
  {
    id: 'gofai:deg:slightly:minimal' as GofaiId,
    forms: ['slightly'],
    category: 'downtoner',
    strength: 'minimal',
    polarity: 'positive',
    scaleFactor: [0.05, 0.15],
    formality: 'neutral',
    notes: 'Very small degree',
    collocations: ['slightly brighter', 'slightly louder', 'slightly wider'],
  },
  {
    id: 'gofai:deg:barely:minimal' as GofaiId,
    forms: ['barely', 'scarcely', 'hardly'],
    category: 'extreme',
    strength: 'minimal',
    polarity: 'positive',
    scaleFactor: [0.01, 0.05],
    boundary: 'minimum',
    formality: 'neutral',
    notes: 'Minimally detectable',
    collocations: ['barely audible', 'hardly noticeable', 'scarcely visible'],
  },
  {
    id: 'gofai:deg:a_little:small' as GofaiId,
    forms: ['a little', 'a bit'],
    category: 'downtoner',
    strength: 'small',
    polarity: 'positive',
    scaleFactor: [0.2, 0.4],
    formality: 'informal',
    notes: 'Small degree',
    collocations: ['a little brighter', 'a bit louder', 'a little wider'],
  },
  {
    id: 'gofai:deg:somewhat:small' as GofaiId,
    forms: ['somewhat'],
    category: 'downtoner',
    strength: 'small',
    polarity: 'positive',
    scaleFactor: [0.2, 0.4],
    formality: 'formal',
    notes: 'Formal small degree',
    collocations: ['somewhat brighter', 'somewhat louder'],
  },
  {
    id: 'gofai:deg:kinda:small_informal' as GofaiId,
    forms: ['kinda', 'kind of', 'sorta', 'sort of'],
    category: 'informal',
    strength: 'small',
    polarity: 'positive',
    scaleFactor: [0.2, 0.4],
    formality: 'colloquial',
    notes: 'Colloquial hedging downtoner',
    collocations: ['kinda bright', 'sorta loud', 'kind of wide'],
  },
  {
    id: 'gofai:deg:a_tad:minimal' as GofaiId,
    forms: ['a tad', 'a touch', 'a hair'],
    category: 'downtoner',
    strength: 'minimal',
    polarity: 'positive',
    scaleFactor: [0.05, 0.15],
    formality: 'informal',
    notes: 'Informal minimal degree',
    collocations: ['a tad brighter', 'a touch louder', 'a hair wider'],
  },
  {
    id: 'gofai:deg:a_shade:minimal' as GofaiId,
    forms: ['a shade'],
    category: 'downtoner',
    strength: 'minimal',
    polarity: 'positive',
    scaleFactor: [0.05, 0.15],
    formality: 'neutral',
    notes: 'Subtle difference',
    collocations: ['a shade brighter', 'a shade darker'],
  },
  {
    id: 'gofai:deg:marginally:minimal' as GofaiId,
    forms: ['marginally', 'minimally'],
    category: 'downtoner',
    strength: 'minimal',
    polarity: 'positive',
    scaleFactor: [0.05, 0.15],
    formality: 'formal',
    notes: 'Formal minimal degree',
    collocations: ['marginally brighter', 'minimally louder'],
  },
];

// =============================================================================
// Approximators — Imprecise Degree
// =============================================================================

export const APPROXIMATORS: readonly DegreeModifier[] = [
  {
    id: 'gofai:deg:about:approximate' as GofaiId,
    forms: ['about', 'around'],
    category: 'approximator',
    strength: 'moderate',
    polarity: 'neutral',
    scaleFactor: [0.8, 1.2],
    formality: 'neutral',
    notes: 'Approximate value',
    collocations: ['about 4 bars', 'around 120 BPM', 'about halfway'],
  },
  {
    id: 'gofai:deg:roughly:approximate' as GofaiId,
    forms: ['roughly', 'approximately'],
    category: 'approximator',
    strength: 'moderate',
    polarity: 'neutral',
    scaleFactor: [0.7, 1.3],
    formality: 'formal',
    notes: 'Rough approximation',
    collocations: ['roughly 4 bars', 'approximately 120 BPM'],
  },
  {
    id: 'gofai:deg:almost:near_boundary' as GofaiId,
    forms: ['almost', 'nearly'],
    category: 'approximator',
    strength: 'substantial',
    polarity: 'positive',
    scaleFactor: [0.85, 0.95],
    formality: 'neutral',
    notes: 'Close to but not quite',
    collocations: ['almost silent', 'nearly maxed', 'almost there'],
  },
  {
    id: 'gofai:deg:practically:near_boundary' as GofaiId,
    forms: ['practically', 'virtually'],
    category: 'approximator',
    strength: 'substantial',
    polarity: 'positive',
    scaleFactor: [0.9, 0.99],
    formality: 'neutral',
    notes: 'Very close to complete',
    collocations: ['practically silent', 'virtually the same'],
  },
  {
    id: 'gofai:deg:more_or_less:approximate' as GofaiId,
    forms: ['more or less', 'pretty much'],
    category: 'approximator',
    strength: 'moderate',
    polarity: 'neutral',
    scaleFactor: [0.8, 1.2],
    formality: 'informal',
    notes: 'Approximate equivalence',
    collocations: ['more or less the same', 'pretty much there'],
  },
  {
    id: 'gofai:deg:ish:approximate_suffix' as GofaiId,
    forms: ['-ish', 'ish'],
    category: 'approximator',
    strength: 'moderate',
    polarity: 'neutral',
    scaleFactor: [0.8, 1.2],
    formality: 'colloquial',
    notes: 'Suffix indicating approximation',
    collocations: ['120-ish BPM', 'bright-ish', 'loud-ish'],
  },
];

// =============================================================================
// Exact Modifiers — Precise Degree
// =============================================================================

export const EXACT_MODIFIERS: readonly DegreeModifier[] = [
  {
    id: 'gofai:deg:exactly:precise' as GofaiId,
    forms: ['exactly', 'precisely'],
    category: 'exact',
    strength: 'moderate',
    polarity: 'neutral',
    scaleFactor: [1.0, 1.0],
    absolute: true,
    formality: 'neutral',
    notes: 'Exact specification',
    collocations: ['exactly 4 bars', 'precisely 120 BPM', 'exactly the same'],
  },
  {
    id: 'gofai:deg:just:exact' as GofaiId,
    forms: ['just'],
    category: 'exact',
    strength: 'moderate',
    polarity: 'neutral',
    scaleFactor: [1.0, 1.0],
    absolute: true,
    formality: 'neutral',
    notes: 'Exact match',
    collocations: ['just 4 bars', 'just right', 'just like before'],
  },
  {
    id: 'gofai:deg:right:exact_informal' as GofaiId,
    forms: ['right'],
    category: 'exact',
    strength: 'moderate',
    polarity: 'neutral',
    scaleFactor: [1.0, 1.0],
    absolute: true,
    formality: 'informal',
    notes: 'Informal exact',
    collocations: ['right there', 'right at 120 BPM'],
  },
];

// =============================================================================
// Comparative Modifiers
// =============================================================================

export const COMPARATIVE_MODIFIERS: readonly DegreeModifier[] = [
  {
    id: 'gofai:deg:more:positive_comparative' as GofaiId,
    forms: ['more'],
    category: 'comparative',
    strength: 'moderate',
    polarity: 'positive',
    scaleFactor: [1.2, 1.8],
    formality: 'neutral',
    notes: 'Positive comparison',
    collocations: ['more bright', 'more reverb', 'more layers'],
  },
  {
    id: 'gofai:deg:less:negative_comparative' as GofaiId,
    forms: ['less'],
    category: 'comparative',
    strength: 'moderate',
    polarity: 'negative',
    scaleFactor: [0.5, 0.8],
    formality: 'neutral',
    notes: 'Negative comparison',
    collocations: ['less bright', 'less reverb', 'less busy'],
  },
  {
    id: 'gofai:deg:as:equative' as GofaiId,
    forms: ['as'],
    category: 'comparative',
    strength: 'moderate',
    polarity: 'neutral',
    scaleFactor: [1.0, 1.0],
    absolute: true,
    formality: 'neutral',
    notes: 'Equative comparison',
    collocations: ['as bright as', 'as loud as', 'as wide as'],
  },
  {
    id: 'gofai:deg:much:comparative_intensifier' as GofaiId,
    forms: ['much'],
    category: 'comparative',
    strength: 'strong',
    polarity: 'positive',
    scaleFactor: [1.5, 2.5],
    formality: 'neutral',
    notes: 'Intensifies comparative',
    collocations: ['much brighter', 'much louder', 'much more reverb'],
  },
  {
    id: 'gofai:deg:far:comparative_intensifier' as GofaiId,
    forms: ['far'],
    category: 'comparative',
    strength: 'strong',
    polarity: 'positive',
    scaleFactor: [1.5, 2.5],
    formality: 'formal',
    notes: 'Formal comparative intensifier',
    collocations: ['far brighter', 'far louder'],
  },
  {
    id: 'gofai:deg:a_lot:comparative_intensifier' as GofaiId,
    forms: ['a lot'],
    category: 'comparative',
    strength: 'strong',
    polarity: 'positive',
    scaleFactor: [1.5, 2.5],
    formality: 'informal',
    notes: 'Informal comparative intensifier',
    collocations: ['a lot brighter', 'a lot more reverb'],
  },
];

// =============================================================================
// Superlative Modifiers
// =============================================================================

export const SUPERLATIVE_MODIFIERS: readonly DegreeModifier[] = [
  {
    id: 'gofai:deg:most:superlative' as GofaiId,
    forms: ['most', 'the most'],
    category: 'superlative',
    strength: 'extreme',
    polarity: 'positive',
    scaleFactor: [2.5, 4.0],
    formality: 'neutral',
    notes: 'Superlative degree',
    collocations: ['the most bright', 'most reverb'],
  },
  {
    id: 'gofai:deg:least:negative_superlative' as GofaiId,
    forms: ['least', 'the least'],
    category: 'superlative',
    strength: 'minimal',
    polarity: 'negative',
    scaleFactor: [0.0, 0.2],
    boundary: 'minimum',
    formality: 'neutral',
    notes: 'Negative superlative',
    collocations: ['the least bright', 'least reverb'],
  },
];

// =============================================================================
// Sufficiency Modifiers
// =============================================================================

export const SUFFICIENCY_MODIFIERS: readonly DegreeModifier[] = [
  {
    id: 'gofai:deg:enough:sufficient' as GofaiId,
    forms: ['enough', 'sufficiently'],
    category: 'sufficiency',
    strength: 'moderate',
    polarity: 'neutral',
    scaleFactor: [1.0, 1.5],
    formality: 'neutral',
    notes: 'Sufficient degree',
    collocations: ['bright enough', 'loud enough', 'enough reverb'],
  },
  {
    id: 'gofai:deg:too:excessive' as GofaiId,
    forms: ['too'],
    category: 'sufficiency',
    strength: 'strong',
    polarity: 'positive',
    scaleFactor: [1.5, 3.0],
    formality: 'neutral',
    notes: 'Excessive degree (negative connotation)',
    collocations: ['too bright', 'too loud', 'too much reverb'],
  },
  {
    id: 'gofai:deg:overly:excessive' as GofaiId,
    forms: ['overly', 'excessively'],
    category: 'sufficiency',
    strength: 'strong',
    polarity: 'positive',
    scaleFactor: [1.5, 3.0],
    formality: 'formal',
    notes: 'Formal excessive',
    collocations: ['overly bright', 'excessively loud'],
  },
];

// =============================================================================
// Multi-word Degree Expressions
// =============================================================================

export const MULTI_WORD_DEGREE_EXPRESSIONS: readonly DegreeModifier[] = [
  {
    id: 'gofai:deg:a_bit_more:small_positive' as GofaiId,
    forms: ['a bit more', 'a little more'],
    category: 'comparative',
    strength: 'small',
    polarity: 'positive',
    scaleFactor: [1.1, 1.3],
    formality: 'informal',
    notes: 'Small increase',
    collocations: ['a bit more reverb', 'a little more bright'],
  },
  {
    id: 'gofai:deg:a_bit_less:small_negative' as GofaiId,
    forms: ['a bit less', 'a little less'],
    category: 'comparative',
    strength: 'small',
    polarity: 'negative',
    scaleFactor: [0.7, 0.9],
    formality: 'informal',
    notes: 'Small decrease',
    collocations: ['a bit less bright', 'a little less reverb'],
  },
  {
    id: 'gofai:deg:way_more:extreme_positive' as GofaiId,
    forms: ['way more'],
    category: 'comparative',
    strength: 'extreme',
    polarity: 'positive',
    scaleFactor: [2.0, 3.5],
    formality: 'colloquial',
    notes: 'Large increase',
    collocations: ['way more bright', 'way more reverb'],
  },
  {
    id: 'gofai:deg:way_less:extreme_negative' as GofaiId,
    forms: ['way less'],
    category: 'comparative',
    strength: 'extreme',
    polarity: 'negative',
    scaleFactor: [0.1, 0.4],
    formality: 'colloquial',
    notes: 'Large decrease',
    collocations: ['way less bright', 'way less reverb'],
  },
  {
    id: 'gofai:deg:much_more:strong_positive' as GofaiId,
    forms: ['much more'],
    category: 'comparative',
    strength: 'strong',
    polarity: 'positive',
    scaleFactor: [1.5, 2.5],
    formality: 'neutral',
    notes: 'Strong increase',
    collocations: ['much more bright', 'much more reverb'],
  },
  {
    id: 'gofai:deg:much_less:strong_negative' as GofaiId,
    forms: ['much less'],
    category: 'comparative',
    strength: 'strong',
    polarity: 'negative',
    scaleFactor: [0.3, 0.6],
    formality: 'neutral',
    notes: 'Strong decrease',
    collocations: ['much less bright', 'much less reverb'],
  },
  {
    id: 'gofai:deg:even_more:emphatic_positive' as GofaiId,
    forms: ['even more'],
    category: 'comparative',
    strength: 'strong',
    polarity: 'positive',
    scaleFactor: [1.5, 2.5],
    formality: 'neutral',
    notes: 'Emphatic increase beyond current',
    collocations: ['even more bright', 'even more reverb'],
  },
  {
    id: 'gofai:deg:even_less:emphatic_negative' as GofaiId,
    forms: ['even less'],
    category: 'comparative',
    strength: 'strong',
    polarity: 'negative',
    scaleFactor: [0.3, 0.6],
    formality: 'neutral',
    notes: 'Emphatic decrease beyond current',
    collocations: ['even less bright', 'even less reverb'],
  },
  {
    id: 'gofai:deg:just_a_tad:minimal_positive' as GofaiId,
    forms: ['just a tad', 'just a touch', 'just a hair'],
    category: 'downtoner',
    strength: 'minimal',
    polarity: 'positive',
    scaleFactor: [0.05, 0.15],
    formality: 'informal',
    notes: 'Very small increase with emphasis',
    collocations: ['just a tad brighter', 'just a touch louder'],
  },
  {
    id: 'gofai:deg:not_much:small_negative' as GofaiId,
    forms: ['not much', 'not very'],
    category: 'downtoner',
    strength: 'small',
    polarity: 'negative',
    scaleFactor: [0.2, 0.4],
    formality: 'informal',
    notes: 'Negated intensifier',
    collocations: ['not much brighter', 'not very loud'],
  },
  {
    id: 'gofai:deg:nowhere_near:emphatic_negative' as GofaiId,
    forms: ['nowhere near', 'not nearly'],
    category: 'downtoner',
    strength: 'strong',
    polarity: 'negative',
    scaleFactor: [0.1, 0.3],
    formality: 'informal',
    notes: 'Emphatic distance from target',
    collocations: ['nowhere near as bright', 'not nearly as loud'],
  },
];

// =============================================================================
// Aggregated Collections
// =============================================================================

/** All positive intensifiers */
export const ALL_POSITIVE_INTENSIFIERS = POSITIVE_INTENSIFIERS;

/** All downtoners */
export const ALL_DOWNTONERS = DOWNTONERS;

/** All approximators */
export const ALL_APPROXIMATORS = APPROXIMATORS;

/** All exact modifiers */
export const ALL_EXACT_MODIFIERS = EXACT_MODIFIERS;

/** All comparative modifiers */
export const ALL_COMPARATIVE_MODIFIERS = COMPARATIVE_MODIFIERS;

/** All superlative modifiers */
export const ALL_SUPERLATIVE_MODIFIERS = SUPERLATIVE_MODIFIERS;

/** All sufficiency modifiers */
export const ALL_SUFFICIENCY_MODIFIERS = SUFFICIENCY_MODIFIERS;

/** All multi-word degree expressions */
export const ALL_MULTI_WORD_DEGREE = MULTI_WORD_DEGREE_EXPRESSIONS;

/**
 * All degree modifiers in this batch
 */
export const ALL_DEGREE_MODIFIERS: readonly DegreeModifier[] = [
  ...POSITIVE_INTENSIFIERS,
  ...DOWNTONERS,
  ...APPROXIMATORS,
  ...EXACT_MODIFIERS,
  ...COMPARATIVE_MODIFIERS,
  ...SUPERLATIVE_MODIFIERS,
  ...SUFFICIENCY_MODIFIERS,
  ...MULTI_WORD_DEGREE_EXPRESSIONS,
];

// =============================================================================
// Lookup Helpers
// =============================================================================

/**
 * Get scale factor for a degree modifier
 */
export function getScaleFactor(
  modifierId: GofaiId
): readonly [number, number] | undefined {
  const modifier = ALL_DEGREE_MODIFIERS.find(m => m.id === modifierId);
  return modifier?.scaleFactor;
}

/**
 * Get strength level for a degree modifier
 */
export function getStrength(modifierId: GofaiId): DegreeStrength | undefined {
  const modifier = ALL_DEGREE_MODIFIERS.find(m => m.id === modifierId);
  return modifier?.strength;
}

/**
 * Check if a degree modifier is absolute
 */
export function isAbsolute(modifierId: GofaiId): boolean {
  const modifier = ALL_DEGREE_MODIFIERS.find(m => m.id === modifierId);
  return modifier?.absolute ?? false;
}

/**
 * Check if a degree modifier indicates a boundary
 */
export function isBoundary(modifierId: GofaiId): 'maximum' | 'minimum' | null {
  const modifier = ALL_DEGREE_MODIFIERS.find(m => m.id === modifierId);
  return modifier?.boundary ?? null;
}

/**
 * Find degree modifiers by form
 */
export function findByForm(form: string): readonly DegreeModifier[] {
  const normalized = form.toLowerCase().trim();
  return ALL_DEGREE_MODIFIERS.filter(m =>
    m.forms.some(f => f.toLowerCase() === normalized)
  );
}

/**
 * Find degree modifiers by category
 */
export function findByCategory(
  category: DegreeCategory
): readonly DegreeModifier[] {
  return ALL_DEGREE_MODIFIERS.filter(m => m.category === category);
}

/**
 * Find degree modifiers by strength
 */
export function findByStrength(
  strength: DegreeStrength
): readonly DegreeModifier[] {
  return ALL_DEGREE_MODIFIERS.filter(m => m.strength === strength);
}

// =============================================================================
// Statistics and Metadata
// =============================================================================

/**
 * Statistics about this vocabulary batch
 */
export const DEGREE_MODIFIERS_STATS = {
  intensifiers: POSITIVE_INTENSIFIERS.length,
  downtoners: DOWNTONERS.length,
  approximators: APPROXIMATORS.length,
  exact: EXACT_MODIFIERS.length,
  comparative: COMPARATIVE_MODIFIERS.length,
  superlative: SUPERLATIVE_MODIFIERS.length,
  sufficiency: SUFFICIENCY_MODIFIERS.length,
  multiWord: MULTI_WORD_DEGREE_EXPRESSIONS.length,
  total: ALL_DEGREE_MODIFIERS.length,
  
  byStrength: {
    minimal: ALL_DEGREE_MODIFIERS.filter(m => m.strength === 'minimal').length,
    small: ALL_DEGREE_MODIFIERS.filter(m => m.strength === 'small').length,
    moderate: ALL_DEGREE_MODIFIERS.filter(m => m.strength === 'moderate').length,
    substantial: ALL_DEGREE_MODIFIERS.filter(m => m.strength === 'substantial').length,
    strong: ALL_DEGREE_MODIFIERS.filter(m => m.strength === 'strong').length,
    extreme: ALL_DEGREE_MODIFIERS.filter(m => m.strength === 'extreme').length,
    maximal: ALL_DEGREE_MODIFIERS.filter(m => m.strength === 'maximal').length,
  },
  
  byFormality: {
    formal: ALL_DEGREE_MODIFIERS.filter(m => m.formality === 'formal').length,
    neutral: ALL_DEGREE_MODIFIERS.filter(m => m.formality === 'neutral').length,
    informal: ALL_DEGREE_MODIFIERS.filter(m => m.formality === 'informal').length,
    colloquial: ALL_DEGREE_MODIFIERS.filter(m => m.formality === 'colloquial').length,
  },
} as const;

/**
 * Coverage summary
 */
export const COVERAGE_SUMMARY = `
Degree Modifiers and Intensifiers Batch 32 Coverage:
- Positive Intensifiers: ${DEGREE_MODIFIERS_STATS.intensifiers}
- Downtoners: ${DEGREE_MODIFIERS_STATS.downtoners}
- Approximators: ${DEGREE_MODIFIERS_STATS.approximators}
- Exact Modifiers: ${DEGREE_MODIFIERS_STATS.exact}
- Comparative Modifiers: ${DEGREE_MODIFIERS_STATS.comparative}
- Superlative Modifiers: ${DEGREE_MODIFIERS_STATS.superlative}
- Sufficiency Modifiers: ${DEGREE_MODIFIERS_STATS.sufficiency}
- Multi-word Expressions: ${DEGREE_MODIFIERS_STATS.multiWord}
- TOTAL: ${DEGREE_MODIFIERS_STATS.total} degree modifiers

By Strength:
- Minimal (0.05-0.15): ${DEGREE_MODIFIERS_STATS.byStrength.minimal}
- Small (0.2-0.4): ${DEGREE_MODIFIERS_STATS.byStrength.small}
- Moderate (0.5-0.7): ${DEGREE_MODIFIERS_STATS.byStrength.moderate}
- Substantial (0.8-1.2): ${DEGREE_MODIFIERS_STATS.byStrength.substantial}
- Strong (1.5-2.0): ${DEGREE_MODIFIERS_STATS.byStrength.strong}
- Extreme (2.5-4.0): ${DEGREE_MODIFIERS_STATS.byStrength.extreme}
- Maximal (at limit): ${DEGREE_MODIFIERS_STATS.byStrength.maximal}

This provides comprehensive coverage of degree modification essential for expressing gradations in music dialog.
`.trim();
