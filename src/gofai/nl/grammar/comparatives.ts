/**
 * GOFAI NL Grammar — Comparatives and Degree Modifiers
 *
 * Implements grammar rules for comparative constructions and degree
 * modifiers that express scalar adjustments on perceptual axes:
 *
 * - Synthetic comparatives: "brighter", "louder", "darker"
 * - Analytic comparatives: "more warm", "less busy", "more compressed"
 * - Degree modifiers: "slightly", "a lot", "way more", "much"
 * - Equatives: "as bright as", "the same brightness"
 * - Superlatives: "the brightest", "the most compressed"
 * - Absolute degree: "very bright", "really dark", "extremely loud"
 *
 * ## Degree Semantics Model
 *
 * Following standard formal semantics, scalar adjectives are functions
 * from entities to degree values on an axis:
 *
 * ```
 * "brighter" → λx. brightness(x) > brightness(reference)
 * "much brighter" → λx. brightness(x) >> brightness(reference)
 * "slightly darker" → λx. brightness(x) < brightness(reference) ∧ small(delta)
 * ```
 *
 * Each comparative produces a DegreeTerm with:
 * - axis: which perceptual axis (brightness, warmth, etc.)
 * - direction: positive (increase), negative (decrease), equative
 * - amount: how much (from degree modifier, if present)
 * - reference: what to compare against (if explicit)
 *
 * ## Grammar Structure
 *
 * ```
 * DegreePhrase  → DegreeModifier? Comparative
 * DegreePhrase  → DegreeModifier Adjective
 * DegreePhrase  → Superlative
 * Comparative   → SyntheticComparative    ("brighter")
 * Comparative   → AnalyticComparative     ("more bright")
 * SyntheticComp → Adjective-er
 * AnalyticComp  → "more"/"less" Adjective
 * DegreeModifier → Intensifier            ("very", "really")
 * DegreeModifier → Diminisher             ("slightly", "a little")
 * DegreeModifier → Amplifier              ("much", "way", "a lot")
 * ```
 *
 * @module gofai/nl/grammar/comparatives
 * @see gofai_goalA.md Step 112
 */

import type { Span } from '../tokenizer/span-tokenizer';

// =============================================================================
// DEGREE MODIFIER — quantifying the amount of change
// =============================================================================

/**
 * A degree modifier: how much change is requested.
 */
export interface DegreeModifier {
  /** The modifier type */
  readonly type: DegreeModifierType;

  /** Surface form as it appeared in the input */
  readonly surface: string;

  /** Span in the input */
  readonly span: Span;

  /** Normalized intensity on [0, 1] scale */
  readonly intensity: number;

  /** The discrete degree level */
  readonly level: DegreeLevel;

  /** Whether this is a diminisher (reduces magnitude) */
  readonly diminishes: boolean;
}

/**
 * Types of degree modifiers.
 */
export type DegreeModifierType =
  | 'intensifier'    // "very", "really", "super"
  | 'diminisher'     // "slightly", "a little", "barely"
  | 'amplifier'      // "much", "way", "a lot"
  | 'precise'        // "exactly", "precisely"
  | 'approximator'   // "about", "roughly", "around"
  | 'maximizer'      // "completely", "totally", "absolutely"
  | 'minimizer';     // "barely", "hardly", "scarcely"

/**
 * Discrete degree levels (maps to DegreeLevel in degree-affordances.ts).
 */
export type DegreeLevel =
  | 'tiny'       // Barely perceptible
  | 'small'      // Subtle but noticeable
  | 'moderate'   // Clear, balanced (default)
  | 'large'      // Significant, dramatic
  | 'extreme';   // Maximum practical change

// =============================================================================
// DEGREE MODIFIER LEXICON — all known degree modifiers
// =============================================================================

/**
 * A degree modifier lexical entry.
 */
export interface DegreeModifierEntry {
  /** Surface forms that match this modifier */
  readonly forms: readonly string[];

  /** Modifier type */
  readonly type: DegreeModifierType;

  /** Normalized intensity [0, 1] */
  readonly intensity: number;

  /** Degree level */
  readonly level: DegreeLevel;

  /** Whether this diminishes */
  readonly diminishes: boolean;

  /** Description */
  readonly description: string;
}

/**
 * All known degree modifiers, ordered by intensity.
 */
export const DEGREE_MODIFIERS: readonly DegreeModifierEntry[] = [
  // --- Minimizers (0.0-0.1) ---
  {
    forms: ['barely', 'hardly', 'scarcely'],
    type: 'minimizer',
    intensity: 0.05,
    level: 'tiny',
    diminishes: true,
    description: 'Almost imperceptible change',
  },
  {
    forms: ['imperceptibly'],
    type: 'minimizer',
    intensity: 0.03,
    level: 'tiny',
    diminishes: true,
    description: 'Below threshold of perception',
  },

  // --- Diminishers (0.1-0.3) ---
  {
    forms: ['slightly', 'a tiny bit', 'a touch'],
    type: 'diminisher',
    intensity: 0.15,
    level: 'small',
    diminishes: true,
    description: 'Subtle change',
  },
  {
    forms: ['a little', 'a little bit', 'a tad'],
    type: 'diminisher',
    intensity: 0.2,
    level: 'small',
    diminishes: true,
    description: 'Small but noticeable change',
  },
  {
    forms: ['somewhat', 'kind of', 'sort of', 'kinda', 'sorta'],
    type: 'diminisher',
    intensity: 0.25,
    level: 'small',
    diminishes: true,
    description: 'Moderate-small change',
  },
  {
    forms: ['a bit', 'a shade'],
    type: 'diminisher',
    intensity: 0.2,
    level: 'small',
    diminishes: true,
    description: 'Slight adjustment',
  },

  // --- Approximators (context-dependent) ---
  {
    forms: ['about', 'roughly', 'around', 'approximately'],
    type: 'approximator',
    intensity: 0.5,
    level: 'moderate',
    diminishes: false,
    description: 'Approximate / flexible amount',
  },

  // --- Neutral/default (0.4-0.6) ---
  {
    forms: ['noticeably', 'clearly', 'perceptibly'],
    type: 'intensifier',
    intensity: 0.5,
    level: 'moderate',
    diminishes: false,
    description: 'Clear, unmistakable change',
  },
  {
    forms: ['moderately', 'reasonably'],
    type: 'intensifier',
    intensity: 0.45,
    level: 'moderate',
    diminishes: false,
    description: 'Balanced change',
  },

  // --- Intensifiers (0.6-0.8) ---
  {
    forms: ['pretty', 'fairly', 'quite'],
    type: 'intensifier',
    intensity: 0.55,
    level: 'moderate',
    diminishes: false,
    description: 'Moderate-high change',
  },
  {
    forms: ['very', 'real', 'really'],
    type: 'intensifier',
    intensity: 0.7,
    level: 'large',
    diminishes: false,
    description: 'Strong change',
  },
  {
    forms: ['super', 'extra', 'especially'],
    type: 'intensifier',
    intensity: 0.75,
    level: 'large',
    diminishes: false,
    description: 'Very strong change',
  },
  {
    forms: ['incredibly', 'insanely', 'ridiculously'],
    type: 'intensifier',
    intensity: 0.85,
    level: 'large',
    diminishes: false,
    description: 'Extreme change',
  },

  // --- Amplifiers (0.7-0.9) ---
  {
    forms: ['much', 'a lot', 'significantly', 'considerably'],
    type: 'amplifier',
    intensity: 0.7,
    level: 'large',
    diminishes: false,
    description: 'Large change',
  },
  {
    forms: ['way', 'way more', 'far'],
    type: 'amplifier',
    intensity: 0.8,
    level: 'large',
    diminishes: false,
    description: 'Very large change',
  },
  {
    forms: ['dramatically', 'drastically', 'enormously'],
    type: 'amplifier',
    intensity: 0.85,
    level: 'large',
    diminishes: false,
    description: 'Dramatic change',
  },

  // --- Maximizers (0.9-1.0) ---
  {
    forms: ['completely', 'totally', 'absolutely', 'entirely'],
    type: 'maximizer',
    intensity: 0.95,
    level: 'extreme',
    diminishes: false,
    description: 'Maximum change',
  },
  {
    forms: ['as ... as possible', 'as much as possible', 'maximum'],
    type: 'maximizer',
    intensity: 1.0,
    level: 'extreme',
    diminishes: false,
    description: 'Absolute maximum',
  },

  // --- Precise modifiers ---
  {
    forms: ['exactly', 'precisely', 'specifically'],
    type: 'precise',
    intensity: 0.5,
    level: 'moderate',
    diminishes: false,
    description: 'Exact amount (usually with numeric value)',
  },
];

// =============================================================================
// DEGREE MODIFIER LOOKUP INDEX
// =============================================================================

/**
 * Index of degree modifier forms to their entries.
 */
const degreeModifierIndex: ReadonlyMap<string, DegreeModifierEntry> = (() => {
  const index = new Map<string, DegreeModifierEntry>();
  for (const entry of DEGREE_MODIFIERS) {
    for (const form of entry.forms) {
      index.set(form.toLowerCase(), entry);
    }
  }
  return index;
})();

/**
 * Look up a degree modifier by surface form.
 */
export function lookupDegreeModifier(form: string): DegreeModifierEntry | undefined {
  return degreeModifierIndex.get(form.toLowerCase());
}

/**
 * Check if a word/phrase is a known degree modifier.
 */
export function isDegreeModifier(word: string): boolean {
  return degreeModifierIndex.has(word.toLowerCase());
}

/**
 * Get all known degree modifier forms.
 */
export function getAllDegreeModifierForms(): readonly string[] {
  return Array.from(degreeModifierIndex.keys());
}

// =============================================================================
// COMPARATIVE FORM — types of comparative constructions
// =============================================================================

/**
 * A comparative expression parsed from the input.
 */
export interface ComparativeExpression {
  /** The type of comparative */
  readonly type: ComparativeType;

  /** The adjective base form */
  readonly adjective: string;

  /** The surface form of the adjective as it appeared */
  readonly adjectiveSurface: string;

  /** The perceptual axis this maps to (if known) */
  readonly axisId: string | undefined;

  /** Direction of change */
  readonly direction: ComparativeDirection;

  /** Degree modifier (if present) */
  readonly modifier: DegreeModifier | undefined;

  /** Overall intensity (combining adjective + modifier) */
  readonly intensity: number;

  /** The degree level */
  readonly level: DegreeLevel;

  /** Comparison reference (if explicit, e.g., "brighter than the verse") */
  readonly reference: ComparativeReference | undefined;

  /** Span of the entire comparative phrase */
  readonly span: Span;
}

/**
 * Types of comparative constructions.
 */
export type ComparativeType =
  | 'synthetic_comparative'     // "brighter", "louder" (-er suffix)
  | 'analytic_comparative'      // "more bright", "less warm"
  | 'synthetic_superlative'     // "brightest", "loudest" (-est suffix)
  | 'analytic_superlative'      // "most bright", "least warm"
  | 'absolute_positive'         // "bright" (no comparison, used with "very"/"make X Y")
  | 'absolute_intensified'      // "very bright", "really dark"
  | 'equative'                  // "as bright as"
  | 'excessive';                // "too bright", "overly loud"

/**
 * Direction of scalar change.
 */
export type ComparativeDirection =
  | 'increase'     // More of the quality (brighter, more warm)
  | 'decrease'     // Less of the quality (darker, less warm)
  | 'equative'     // Same level (as bright as)
  | 'maximum'      // Superlative (brightest, most warm)
  | 'minimum'      // Least (least warm, dimmest)
  | 'excessive';   // Too much (too bright)

/**
 * Reference point for comparison.
 */
export interface ComparativeReference {
  /** The surface text of the reference */
  readonly surface: string;

  /** Span in the input */
  readonly span: Span;

  /** Type of reference */
  readonly type: ReferenceType;
}

/**
 * Types of comparison references.
 */
export type ReferenceType =
  | 'explicit_entity'   // "brighter than the verse"
  | 'current_state'     // "brighter than it is now" (implicit)
  | 'previous_state'    // "brighter than before"
  | 'standard'          // "brighter than normal"
  | 'other_entity';     // "brighter than the chorus"

// =============================================================================
// COMPARATIVE MARKERS — words that signal comparative constructions
// =============================================================================

/**
 * A comparative marker: a word or phrase that introduces a comparison.
 */
export interface ComparativeMarker {
  /** The surface forms */
  readonly forms: readonly string[];

  /** What this marker signals */
  readonly signal: ComparativeMarkerSignal;

  /** Description */
  readonly description: string;
}

/**
 * What a comparative marker signals.
 */
export type ComparativeMarkerSignal =
  | 'more'         // "more" → analytic comparative, increase
  | 'less'         // "less" → analytic comparative, decrease
  | 'most'         // "most" → analytic superlative, maximum
  | 'least'        // "least" → analytic superlative, minimum
  | 'too'          // "too" → excessive
  | 'as'           // "as ... as" → equative
  | 'than'         // "than" → comparison reference follows
  | 'enough'       // "bright enough" → threshold
  | 'er'           // Synthetic comparative suffix
  | 'est';         // Synthetic superlative suffix

/**
 * All comparative markers.
 */
export const COMPARATIVE_MARKERS: readonly ComparativeMarker[] = [
  { forms: ['more'], signal: 'more', description: 'Analytic comparative (increase)' },
  { forms: ['less'], signal: 'less', description: 'Analytic comparative (decrease)' },
  { forms: ['most', 'the most'], signal: 'most', description: 'Analytic superlative (maximum)' },
  { forms: ['least', 'the least'], signal: 'least', description: 'Analytic superlative (minimum)' },
  { forms: ['too', 'overly', 'excessively'], signal: 'too', description: 'Excessive degree' },
  { forms: ['as'], signal: 'as', description: 'Equative comparison start' },
  { forms: ['than'], signal: 'than', description: 'Comparison reference marker' },
  { forms: ['enough', 'sufficiently'], signal: 'enough', description: 'Threshold marker' },
];

/**
 * Index of comparative marker forms.
 */
const comparativeMarkerIndex: ReadonlyMap<string, ComparativeMarkerSignal> = (() => {
  const index = new Map<string, ComparativeMarkerSignal>();
  for (const marker of COMPARATIVE_MARKERS) {
    for (const form of marker.forms) {
      index.set(form.toLowerCase(), marker.signal);
    }
  }
  return index;
})();

/**
 * Look up a comparative marker.
 */
export function lookupComparativeMarker(word: string): ComparativeMarkerSignal | undefined {
  return comparativeMarkerIndex.get(word.toLowerCase());
}

// =============================================================================
// ADJECTIVE PATTERNS — recognizing adjective forms
// =============================================================================

/**
 * An adjective form with its analysis.
 */
export interface AnalyzedAdjective {
  /** Base form (lemma) */
  readonly base: string;

  /** Surface form as it appeared */
  readonly surface: string;

  /** The form type */
  readonly form: AdjectiveForm;

  /** The perceptual axis this maps to (if known) */
  readonly axisId: string | undefined;

  /** Direction when used as comparative */
  readonly direction: 'increase' | 'decrease' | 'neutral';

  /** Inherent intensity of the adjective (0-1) */
  readonly intensity: number;
}

/**
 * Adjective morphological forms.
 */
export type AdjectiveForm =
  | 'positive'       // "bright", "warm"
  | 'comparative'    // "brighter", "warmer"
  | 'superlative'    // "brightest", "warmest"
  | 'nominalized';   // "brightness", "warmth"

/**
 * Known scalar adjectives with their axis mappings.
 *
 * These are the core adjectives that map to perceptual axes.
 * Each entry includes all morphological forms and the axis mapping.
 */
export const SCALAR_ADJECTIVES: readonly ScalarAdjectiveEntry[] = [
  // --- Brightness axis ---
  {
    base: 'bright',
    comparative: 'brighter',
    superlative: 'brightest',
    nominalization: 'brightness',
    axisId: 'brightness',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'dark',
  },
  {
    base: 'dark',
    comparative: 'darker',
    superlative: 'darkest',
    nominalization: 'darkness',
    axisId: 'brightness',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'bright',
  },
  {
    base: 'dull',
    comparative: 'duller',
    superlative: 'dullest',
    nominalization: 'dullness',
    axisId: 'brightness',
    direction: 'decrease',
    intensity: 0.4,
    antonym: 'bright',
  },
  {
    base: 'brilliant',
    comparative: 'more brilliant',
    superlative: 'most brilliant',
    nominalization: 'brilliance',
    axisId: 'brightness',
    direction: 'increase',
    intensity: 0.8,
    antonym: 'dull',
  },
  {
    base: 'shimmery',
    comparative: 'more shimmery',
    superlative: 'most shimmery',
    axisId: 'brightness',
    direction: 'increase',
    intensity: 0.6,
    antonym: 'dull',
  },

  // --- Warmth axis ---
  {
    base: 'warm',
    comparative: 'warmer',
    superlative: 'warmest',
    nominalization: 'warmth',
    axisId: 'warmth',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'cold',
  },
  {
    base: 'cold',
    comparative: 'colder',
    superlative: 'coldest',
    nominalization: 'coldness',
    axisId: 'warmth',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'warm',
  },
  {
    base: 'cool',
    comparative: 'cooler',
    superlative: 'coolest',
    nominalization: 'coolness',
    axisId: 'warmth',
    direction: 'decrease',
    intensity: 0.3,
    antonym: 'warm',
  },
  {
    base: 'hot',
    comparative: 'hotter',
    superlative: 'hottest',
    axisId: 'warmth',
    direction: 'increase',
    intensity: 0.8,
    antonym: 'cold',
  },
  {
    base: 'rich',
    comparative: 'richer',
    superlative: 'richest',
    nominalization: 'richness',
    axisId: 'warmth',
    direction: 'increase',
    intensity: 0.6,
    antonym: 'thin',
  },

  // --- Volume/loudness axis ---
  {
    base: 'loud',
    comparative: 'louder',
    superlative: 'loudest',
    nominalization: 'loudness',
    axisId: 'loudness',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'quiet',
  },
  {
    base: 'quiet',
    comparative: 'quieter',
    superlative: 'quietest',
    nominalization: 'quietness',
    axisId: 'loudness',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'loud',
  },
  {
    base: 'soft',
    comparative: 'softer',
    superlative: 'softest',
    nominalization: 'softness',
    axisId: 'loudness',
    direction: 'decrease',
    intensity: 0.4,
    antonym: 'loud',
  },
  {
    base: 'punchy',
    comparative: 'punchier',
    superlative: 'punchiest',
    nominalization: 'punchiness',
    axisId: 'loudness',
    direction: 'increase',
    intensity: 0.7,
    antonym: 'soft',
  },

  // --- Width/stereo axis ---
  {
    base: 'wide',
    comparative: 'wider',
    superlative: 'widest',
    nominalization: 'width',
    axisId: 'width',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'narrow',
  },
  {
    base: 'narrow',
    comparative: 'narrower',
    superlative: 'narrowest',
    nominalization: 'narrowness',
    axisId: 'width',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'wide',
  },
  {
    base: 'spacious',
    comparative: 'more spacious',
    superlative: 'most spacious',
    nominalization: 'spaciousness',
    axisId: 'width',
    direction: 'increase',
    intensity: 0.7,
    antonym: 'narrow',
  },
  {
    base: 'intimate',
    comparative: 'more intimate',
    superlative: 'most intimate',
    axisId: 'width',
    direction: 'decrease',
    intensity: 0.4,
    antonym: 'spacious',
  },

  // --- Energy axis ---
  {
    base: 'energetic',
    comparative: 'more energetic',
    superlative: 'most energetic',
    axisId: 'energy',
    direction: 'increase',
    intensity: 0.6,
    antonym: 'calm',
  },
  {
    base: 'calm',
    comparative: 'calmer',
    superlative: 'calmest',
    nominalization: 'calmness',
    axisId: 'energy',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'energetic',
  },
  {
    base: 'lively',
    comparative: 'livelier',
    superlative: 'liveliest',
    nominalization: 'liveliness',
    axisId: 'energy',
    direction: 'increase',
    intensity: 0.6,
    antonym: 'calm',
  },
  {
    base: 'mellow',
    comparative: 'mellower',
    superlative: 'mellowest',
    nominalization: 'mellowness',
    axisId: 'energy',
    direction: 'decrease',
    intensity: 0.4,
    antonym: 'energetic',
  },
  {
    base: 'aggressive',
    comparative: 'more aggressive',
    superlative: 'most aggressive',
    nominalization: 'aggression',
    axisId: 'energy',
    direction: 'increase',
    intensity: 0.8,
    antonym: 'mellow',
  },
  {
    base: 'gentle',
    comparative: 'gentler',
    superlative: 'gentlest',
    nominalization: 'gentleness',
    axisId: 'energy',
    direction: 'decrease',
    intensity: 0.3,
    antonym: 'aggressive',
  },

  // --- Tightness axis ---
  {
    base: 'tight',
    comparative: 'tighter',
    superlative: 'tightest',
    nominalization: 'tightness',
    axisId: 'tightness',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'loose',
  },
  {
    base: 'loose',
    comparative: 'looser',
    superlative: 'loosest',
    nominalization: 'looseness',
    axisId: 'tightness',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'tight',
  },
  {
    base: 'sloppy',
    comparative: 'sloppier',
    superlative: 'sloppiest',
    nominalization: 'sloppiness',
    axisId: 'tightness',
    direction: 'decrease',
    intensity: 0.7,
    antonym: 'tight',
  },

  // --- Wetness / reverb axis ---
  {
    base: 'wet',
    comparative: 'wetter',
    superlative: 'wettest',
    nominalization: 'wetness',
    axisId: 'wetness',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'dry',
  },
  {
    base: 'dry',
    comparative: 'drier',
    superlative: 'driest',
    nominalization: 'dryness',
    axisId: 'wetness',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'wet',
  },
  {
    base: 'reverberant',
    comparative: 'more reverberant',
    superlative: 'most reverberant',
    axisId: 'wetness',
    direction: 'increase',
    intensity: 0.6,
    antonym: 'dry',
  },

  // --- Clarity / definition axis ---
  {
    base: 'clear',
    comparative: 'clearer',
    superlative: 'clearest',
    nominalization: 'clarity',
    axisId: 'clarity',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'muddy',
  },
  {
    base: 'muddy',
    comparative: 'muddier',
    superlative: 'muddiest',
    nominalization: 'muddiness',
    axisId: 'clarity',
    direction: 'decrease',
    intensity: 0.6,
    antonym: 'clear',
  },
  {
    base: 'crisp',
    comparative: 'crisper',
    superlative: 'crispest',
    nominalization: 'crispness',
    axisId: 'clarity',
    direction: 'increase',
    intensity: 0.6,
    antonym: 'muddy',
  },
  {
    base: 'clean',
    comparative: 'cleaner',
    superlative: 'cleanest',
    nominalization: 'cleanliness',
    axisId: 'clarity',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'dirty',
  },
  {
    base: 'dirty',
    comparative: 'dirtier',
    superlative: 'dirtiest',
    nominalization: 'dirtiness',
    axisId: 'clarity',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'clean',
  },
  {
    base: 'fuzzy',
    comparative: 'fuzzier',
    superlative: 'fuzziest',
    nominalization: 'fuzziness',
    axisId: 'clarity',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'clean',
  },

  // --- Fullness / body axis ---
  {
    base: 'full',
    comparative: 'fuller',
    superlative: 'fullest',
    nominalization: 'fullness',
    axisId: 'fullness',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'thin',
  },
  {
    base: 'thin',
    comparative: 'thinner',
    superlative: 'thinnest',
    nominalization: 'thinness',
    axisId: 'fullness',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'full',
  },
  {
    base: 'thick',
    comparative: 'thicker',
    superlative: 'thickest',
    nominalization: 'thickness',
    axisId: 'fullness',
    direction: 'increase',
    intensity: 0.6,
    antonym: 'thin',
  },
  {
    base: 'heavy',
    comparative: 'heavier',
    superlative: 'heaviest',
    nominalization: 'heaviness',
    axisId: 'fullness',
    direction: 'increase',
    intensity: 0.7,
    antonym: 'light',
  },
  {
    base: 'light',
    comparative: 'lighter',
    superlative: 'lightest',
    nominalization: 'lightness',
    axisId: 'fullness',
    direction: 'decrease',
    intensity: 0.4,
    antonym: 'heavy',
  },

  // --- Tension axis ---
  {
    base: 'tense',
    comparative: 'more tense',
    superlative: 'most tense',
    nominalization: 'tension',
    axisId: 'tension',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'relaxed',
  },
  {
    base: 'relaxed',
    comparative: 'more relaxed',
    superlative: 'most relaxed',
    axisId: 'tension',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'tense',
  },
  {
    base: 'dramatic',
    comparative: 'more dramatic',
    superlative: 'most dramatic',
    axisId: 'tension',
    direction: 'increase',
    intensity: 0.7,
    antonym: 'relaxed',
  },

  // --- Smoothness axis ---
  {
    base: 'smooth',
    comparative: 'smoother',
    superlative: 'smoothest',
    nominalization: 'smoothness',
    axisId: 'smoothness',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'rough',
  },
  {
    base: 'rough',
    comparative: 'rougher',
    superlative: 'roughest',
    nominalization: 'roughness',
    axisId: 'smoothness',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'smooth',
  },
  {
    base: 'silky',
    comparative: 'silkier',
    superlative: 'silkiest',
    axisId: 'smoothness',
    direction: 'increase',
    intensity: 0.6,
    antonym: 'rough',
  },
  {
    base: 'gritty',
    comparative: 'grittier',
    superlative: 'grittiest',
    nominalization: 'grittiness',
    axisId: 'smoothness',
    direction: 'decrease',
    intensity: 0.6,
    antonym: 'smooth',
  },

  // --- Speed/tempo axis ---
  {
    base: 'fast',
    comparative: 'faster',
    superlative: 'fastest',
    axisId: 'tempo',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'slow',
  },
  {
    base: 'slow',
    comparative: 'slower',
    superlative: 'slowest',
    axisId: 'tempo',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'fast',
  },
  {
    base: 'quick',
    comparative: 'quicker',
    superlative: 'quickest',
    axisId: 'tempo',
    direction: 'increase',
    intensity: 0.4,
    antonym: 'slow',
  },

  // --- Density/busyness axis ---
  {
    base: 'busy',
    comparative: 'busier',
    superlative: 'busiest',
    nominalization: 'busyness',
    axisId: 'density',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'sparse',
  },
  {
    base: 'sparse',
    comparative: 'sparser',
    superlative: 'sparsest',
    nominalization: 'sparseness',
    axisId: 'density',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'busy',
  },
  {
    base: 'dense',
    comparative: 'denser',
    superlative: 'densest',
    nominalization: 'density',
    axisId: 'density',
    direction: 'increase',
    intensity: 0.6,
    antonym: 'sparse',
  },
  {
    base: 'minimal',
    comparative: 'more minimal',
    superlative: 'most minimal',
    axisId: 'density',
    direction: 'decrease',
    intensity: 0.4,
    antonym: 'dense',
  },
  {
    base: 'simple',
    comparative: 'simpler',
    superlative: 'simplest',
    nominalization: 'simplicity',
    axisId: 'density',
    direction: 'decrease',
    intensity: 0.4,
    antonym: 'complex',
  },
  {
    base: 'complex',
    comparative: 'more complex',
    superlative: 'most complex',
    nominalization: 'complexity',
    axisId: 'density',
    direction: 'increase',
    intensity: 0.6,
    antonym: 'simple',
  },

  // --- Depth axis ---
  {
    base: 'deep',
    comparative: 'deeper',
    superlative: 'deepest',
    nominalization: 'depth',
    axisId: 'depth',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'shallow',
  },
  {
    base: 'shallow',
    comparative: 'shallower',
    superlative: 'shallowest',
    axisId: 'depth',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'deep',
  },

  // --- Presence/forwardness axis ---
  {
    base: 'present',
    comparative: 'more present',
    superlative: 'most present',
    nominalization: 'presence',
    axisId: 'presence',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'distant',
  },
  {
    base: 'distant',
    comparative: 'more distant',
    superlative: 'most distant',
    axisId: 'presence',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'present',
  },
  {
    base: 'forward',
    comparative: 'more forward',
    superlative: 'most forward',
    axisId: 'presence',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'recessed',
  },
  {
    base: 'recessed',
    comparative: 'more recessed',
    superlative: 'most recessed',
    axisId: 'presence',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'forward',
  },

  // --- Compression/dynamics axis ---
  {
    base: 'compressed',
    comparative: 'more compressed',
    superlative: 'most compressed',
    nominalization: 'compression',
    axisId: 'compression',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'dynamic',
  },
  {
    base: 'dynamic',
    comparative: 'more dynamic',
    superlative: 'most dynamic',
    axisId: 'compression',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'compressed',
  },
  {
    base: 'squashed',
    comparative: 'more squashed',
    superlative: 'most squashed',
    axisId: 'compression',
    direction: 'increase',
    intensity: 0.7,
    antonym: 'dynamic',
  },

  // --- Pitch axis ---
  {
    base: 'high',
    comparative: 'higher',
    superlative: 'highest',
    axisId: 'pitch',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'low',
  },
  {
    base: 'low',
    comparative: 'lower',
    superlative: 'lowest',
    axisId: 'pitch',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'high',
  },

  // --- Sharpness axis ---
  {
    base: 'sharp',
    comparative: 'sharper',
    superlative: 'sharpest',
    nominalization: 'sharpness',
    axisId: 'sharpness',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'round',
  },
  {
    base: 'round',
    comparative: 'rounder',
    superlative: 'roundest',
    nominalization: 'roundness',
    axisId: 'sharpness',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'sharp',
  },

  // --- Airy / open axis ---
  {
    base: 'airy',
    comparative: 'airier',
    superlative: 'airiest',
    nominalization: 'airiness',
    axisId: 'airiness',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'boxy',
  },
  {
    base: 'boxy',
    comparative: 'boxier',
    superlative: 'boxiest',
    nominalization: 'boxiness',
    axisId: 'airiness',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'airy',
  },
  {
    base: 'open',
    comparative: 'more open',
    superlative: 'most open',
    nominalization: 'openness',
    axisId: 'airiness',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'closed',
  },
  {
    base: 'closed',
    comparative: 'more closed',
    superlative: 'most closed',
    axisId: 'airiness',
    direction: 'decrease',
    intensity: 0.5,
    antonym: 'open',
  },

  // --- Saturation / distortion axis ---
  {
    base: 'saturated',
    comparative: 'more saturated',
    superlative: 'most saturated',
    nominalization: 'saturation',
    axisId: 'saturation',
    direction: 'increase',
    intensity: 0.5,
    antonym: 'clean',
  },
  {
    base: 'distorted',
    comparative: 'more distorted',
    superlative: 'most distorted',
    nominalization: 'distortion',
    axisId: 'saturation',
    direction: 'increase',
    intensity: 0.7,
    antonym: 'clean',
  },
  {
    base: 'overdriven',
    comparative: 'more overdriven',
    superlative: 'most overdriven',
    axisId: 'saturation',
    direction: 'increase',
    intensity: 0.8,
    antonym: 'clean',
  },
];

/**
 * A scalar adjective entry.
 */
export interface ScalarAdjectiveEntry {
  readonly base: string;
  readonly comparative: string;
  readonly superlative: string;
  readonly nominalization?: string;
  readonly axisId: string;
  readonly direction: 'increase' | 'decrease';
  readonly intensity: number;
  readonly antonym: string;
}

// =============================================================================
// ADJECTIVE LOOKUP INDEX
// =============================================================================

/**
 * Index: any form → ScalarAdjectiveEntry.
 */
const adjectiveIndex: ReadonlyMap<string, { entry: ScalarAdjectiveEntry; form: AdjectiveForm }> = (() => {
  const index = new Map<string, { entry: ScalarAdjectiveEntry; form: AdjectiveForm }>();
  for (const entry of SCALAR_ADJECTIVES) {
    index.set(entry.base.toLowerCase(), { entry, form: 'positive' });
    index.set(entry.comparative.toLowerCase(), { entry, form: 'comparative' });
    index.set(entry.superlative.toLowerCase(), { entry, form: 'superlative' });
    if (entry.nominalization) {
      index.set(entry.nominalization.toLowerCase(), { entry, form: 'nominalized' });
    }
  }
  return index;
})();

/**
 * Look up a scalar adjective by any form.
 */
export function lookupScalarAdjective(
  word: string,
): { entry: ScalarAdjectiveEntry; form: AdjectiveForm } | undefined {
  return adjectiveIndex.get(word.toLowerCase());
}

/**
 * Check if a word is a known scalar adjective form.
 */
export function isScalarAdjective(word: string): boolean {
  return adjectiveIndex.has(word.toLowerCase());
}

/**
 * Get all known adjective forms (for tokenizer integration).
 */
export function getAllAdjectiveForms(): readonly string[] {
  return Array.from(adjectiveIndex.keys());
}

/**
 * Get all adjectives for a specific axis.
 */
export function getAdjectivesForAxis(axisId: string): readonly ScalarAdjectiveEntry[] {
  return SCALAR_ADJECTIVES.filter(a => a.axisId === axisId);
}

/**
 * Get all known axis IDs.
 */
export function getAllAxisIds(): readonly string[] {
  return [...new Set(SCALAR_ADJECTIVES.map(a => a.axisId))];
}

// =============================================================================
// COMPARATIVE ANALYSIS — analyzing comparative expressions
// =============================================================================

/**
 * Analyze a sequence of words as a potential comparative expression.
 *
 * Handles patterns:
 * - "brighter" → synthetic comparative
 * - "more bright" → analytic comparative
 * - "very bright" → absolute intensified
 * - "slightly brighter" → modified synthetic comparative
 * - "much more bright" → modified analytic comparative
 * - "as bright as" → equative (partial, reference needed)
 * - "too bright" → excessive
 * - "brightest" → superlative
 * - "most bright" → analytic superlative
 */
export function analyzeComparative(words: readonly string[]): ComparativeAnalysis | undefined {
  if (words.length === 0) return undefined;

  // Try to find the adjective and any modifiers
  let modifierEntry: DegreeModifierEntry | undefined;
  let modifierWords: string[] = [];
  let adjStart = 0;

  // Check for multi-word degree modifiers first (longer phrases first)
  for (let len = Math.min(3, words.length); len >= 1; len--) {
    const candidate = words.slice(0, len).join(' ').toLowerCase();
    const found = lookupDegreeModifier(candidate);
    if (found) {
      modifierEntry = found;
      modifierWords = words.slice(0, len).map(w => w);
      adjStart = len;
      break;
    }
  }

  // Remaining words after modifier
  const remaining = words.slice(adjStart);
  if (remaining.length === 0) return undefined;

  const firstRemaining = remaining[0]!.toLowerCase();

  // Check for "too" / "overly" (excessive)
  const markerSignal = lookupComparativeMarker(firstRemaining);

  if (markerSignal === 'too') {
    // "too bright" → excessive
    const adjWords = remaining.slice(1);
    if (adjWords.length === 0) return undefined;
    const adjLookup = lookupScalarAdjective(adjWords[0]!);
    if (!adjLookup) return undefined;

    return {
      adjective: adjLookup.entry,
      adjectiveForm: adjLookup.form,
      adjectiveSurface: adjWords[0]!,
      comparativeType: 'excessive',
      direction: adjLookup.entry.direction === 'increase' ? 'excessive' : 'excessive',
      modifier: modifierEntry,
      modifierSurface: modifierWords.length > 0 ? modifierWords.join(' ') : undefined,
      intensity: computeIntensity(adjLookup.entry.intensity, modifierEntry, 0.9),
      level: 'extreme',
      markerWord: firstRemaining,
    };
  }

  if (markerSignal === 'more' || markerSignal === 'less') {
    // "more bright" / "less bright" → analytic comparative
    const adjWords = remaining.slice(1);
    if (adjWords.length === 0) return undefined;
    const adjLookup = lookupScalarAdjective(adjWords[0]!);
    if (!adjLookup) return undefined;

    const direction: ComparativeDirection = markerSignal === 'more'
      ? (adjLookup.entry.direction === 'increase' ? 'increase' : 'decrease')
      : (adjLookup.entry.direction === 'increase' ? 'decrease' : 'increase');

    return {
      adjective: adjLookup.entry,
      adjectiveForm: 'positive',
      adjectiveSurface: adjWords[0]!,
      comparativeType: 'analytic_comparative',
      direction,
      modifier: modifierEntry,
      modifierSurface: modifierWords.length > 0 ? modifierWords.join(' ') : undefined,
      intensity: computeIntensity(adjLookup.entry.intensity, modifierEntry, 0.5),
      level: computeLevel(modifierEntry),
      markerWord: firstRemaining,
    };
  }

  if (markerSignal === 'most' || markerSignal === 'least') {
    // "most bright" / "least bright" → analytic superlative
    const adjWords = remaining.slice(1);
    if (adjWords.length === 0) return undefined;
    const adjLookup = lookupScalarAdjective(adjWords[0]!);
    if (!adjLookup) return undefined;

    return {
      adjective: adjLookup.entry,
      adjectiveForm: 'positive',
      adjectiveSurface: adjWords[0]!,
      comparativeType: 'analytic_superlative',
      direction: markerSignal === 'most' ? 'maximum' : 'minimum',
      modifier: modifierEntry,
      modifierSurface: modifierWords.length > 0 ? modifierWords.join(' ') : undefined,
      intensity: 1.0,
      level: 'extreme',
      markerWord: firstRemaining,
    };
  }

  if (markerSignal === 'as') {
    // "as bright as" → equative
    const adjWords = remaining.slice(1);
    if (adjWords.length === 0) return undefined;
    const adjLookup = lookupScalarAdjective(adjWords[0]!);
    if (!adjLookup) return undefined;

    return {
      adjective: adjLookup.entry,
      adjectiveForm: 'positive',
      adjectiveSurface: adjWords[0]!,
      comparativeType: 'equative',
      direction: 'equative',
      modifier: undefined,
      modifierSurface: undefined,
      intensity: adjLookup.entry.intensity,
      level: 'moderate',
      markerWord: firstRemaining,
    };
  }

  // No comparative marker: try direct adjective lookup
  const adjLookup = lookupScalarAdjective(firstRemaining);
  if (!adjLookup) return undefined;

  // Determine type based on adjective form
  let comparativeType: ComparativeType;
  let direction: ComparativeDirection;

  switch (adjLookup.form) {
    case 'comparative':
      comparativeType = 'synthetic_comparative';
      direction = adjLookup.entry.direction === 'increase' ? 'increase' : 'decrease';
      break;
    case 'superlative':
      comparativeType = 'synthetic_superlative';
      direction = adjLookup.entry.direction === 'increase' ? 'maximum' : 'minimum';
      break;
    case 'positive':
    default:
      comparativeType = modifierEntry ? 'absolute_intensified' : 'absolute_positive';
      direction = adjLookup.entry.direction === 'increase' ? 'increase' : 'decrease';
      break;
  }

  return {
    adjective: adjLookup.entry,
    adjectiveForm: adjLookup.form,
    adjectiveSurface: firstRemaining,
    comparativeType,
    direction,
    modifier: modifierEntry,
    modifierSurface: modifierWords.length > 0 ? modifierWords.join(' ') : undefined,
    intensity: computeIntensity(
      adjLookup.entry.intensity,
      modifierEntry,
      adjLookup.form === 'comparative' ? 0.6 : adjLookup.form === 'superlative' ? 1.0 : 0.5,
    ),
    level: adjLookup.form === 'superlative'
      ? 'extreme'
      : computeLevel(modifierEntry),
    markerWord: undefined,
  };
}

/**
 * Result of analyzing a comparative expression.
 */
export interface ComparativeAnalysis {
  /** The scalar adjective */
  readonly adjective: ScalarAdjectiveEntry;

  /** The form of the adjective found */
  readonly adjectiveForm: AdjectiveForm;

  /** Surface form */
  readonly adjectiveSurface: string;

  /** Type of comparative */
  readonly comparativeType: ComparativeType;

  /** Direction of change */
  readonly direction: ComparativeDirection;

  /** Degree modifier (if present) */
  readonly modifier: DegreeModifierEntry | undefined;

  /** Surface form of modifier */
  readonly modifierSurface: string | undefined;

  /** Overall intensity [0, 1] */
  readonly intensity: number;

  /** Degree level */
  readonly level: DegreeLevel;

  /** Comparative/superlative marker word (if analytic) */
  readonly markerWord: string | undefined;
}

/**
 * Compute combined intensity from adjective + modifier.
 */
function computeIntensity(
  adjIntensity: number,
  modifier: DegreeModifierEntry | undefined,
  baseLevel: number,
): number {
  // Blend adjective's inherent intensity with the structural base level
  const effective = (adjIntensity + baseLevel) / 2;

  if (!modifier) return effective;

  if (modifier.diminishes) {
    return effective * modifier.intensity;
  }

  // Amplify: interpolate between effective and max
  return effective + (1 - effective) * (modifier.intensity - 0.5) * 2;
}

/**
 * Compute degree level from modifier.
 */
function computeLevel(modifier: DegreeModifierEntry | undefined): DegreeLevel {
  if (!modifier) return 'moderate';
  return modifier.level;
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a degree modifier entry for display.
 */
export function formatDegreeModifier(entry: DegreeModifierEntry): string {
  const dir = entry.diminishes ? 'diminishes' : 'amplifies';
  return `${entry.forms.join('/')} (${entry.type}, ${dir}, intensity: ${entry.intensity}, level: ${entry.level})`;
}

/**
 * Format a scalar adjective entry for display.
 */
export function formatScalarAdjective(entry: ScalarAdjectiveEntry): string {
  const lines: string[] = [];
  lines.push(`${entry.base} → axis: ${entry.axisId} (${entry.direction})`);
  lines.push(`  Comparative: ${entry.comparative}`);
  lines.push(`  Superlative: ${entry.superlative}`);
  if (entry.nominalization) {
    lines.push(`  Nominalization: ${entry.nominalization}`);
  }
  lines.push(`  Antonym: ${entry.antonym}`);
  lines.push(`  Intensity: ${entry.intensity}`);
  return lines.join('\n');
}

/**
 * Format a comparative analysis for display.
 */
export function formatComparativeAnalysis(analysis: ComparativeAnalysis): string {
  const lines: string[] = [];
  lines.push(`Comparative: "${analysis.adjectiveSurface}" (${analysis.comparativeType})`);
  lines.push(`  Base: ${analysis.adjective.base}`);
  lines.push(`  Axis: ${analysis.adjective.axisId}`);
  lines.push(`  Direction: ${analysis.direction}`);
  lines.push(`  Intensity: ${analysis.intensity.toFixed(2)}`);
  lines.push(`  Level: ${analysis.level}`);
  if (analysis.modifierSurface) {
    lines.push(`  Modifier: "${analysis.modifierSurface}"`);
  }
  if (analysis.markerWord) {
    lines.push(`  Marker: "${analysis.markerWord}"`);
  }
  return lines.join('\n');
}

/**
 * Format all scalar adjectives grouped by axis.
 */
export function formatAdjectivesByAxis(): string {
  const sections: string[] = [];
  const axisIds = getAllAxisIds();

  for (const axisId of axisIds) {
    const adjectives = getAdjectivesForAxis(axisId);
    const increase = adjectives.filter(a => a.direction === 'increase');
    const decrease = adjectives.filter(a => a.direction === 'decrease');

    sections.push(`\n=== ${axisId.toUpperCase()} ===`);
    sections.push(`  Increase: ${increase.map(a => a.base).join(', ')}`);
    sections.push(`  Decrease: ${decrease.map(a => a.base).join(', ')}`);
  }

  return sections.join('\n');
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the comparatives grammar.
 */
export function getComparativesStats(): ComparativesStats {
  const axisIds = getAllAxisIds();
  const axisCounts = new Map<string, number>();
  for (const adj of SCALAR_ADJECTIVES) {
    axisCounts.set(adj.axisId, (axisCounts.get(adj.axisId) ?? 0) + 1);
  }

  return {
    totalAdjectives: SCALAR_ADJECTIVES.length,
    totalAdjectiveForms: adjectiveIndex.size,
    totalAxes: axisIds.length,
    totalDegreeModifiers: DEGREE_MODIFIERS.length,
    totalDegreeModifierForms: degreeModifierIndex.size,
    totalComparativeMarkers: COMPARATIVE_MARKERS.length,
    adjectivesPerAxis: Object.fromEntries(axisCounts),
  };
}

/**
 * Statistics about the comparatives grammar.
 */
export interface ComparativesStats {
  readonly totalAdjectives: number;
  readonly totalAdjectiveForms: number;
  readonly totalAxes: number;
  readonly totalDegreeModifiers: number;
  readonly totalDegreeModifierForms: number;
  readonly totalComparativeMarkers: number;
  readonly adjectivesPerAxis: Record<string, number>;
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const COMPARATIVES_GRAMMAR_RULES = [
  'Rule COMP-001: Scalar adjectives map to perceptual axes. Each adjective ' +
  'has a base form, comparative (-er), superlative (-est), and optional ' +
  'nominalization (-ness).',

  'Rule COMP-002: Synthetic comparatives ("brighter") are preferred over ' +
  'analytic ("more bright") for common adjectives. Analytic forms are used ' +
  'for multi-syllable adjectives ("more compressed").',

  'Rule COMP-003: Degree modifiers quantify the amount of change on a ' +
  'continuous [0,1] scale. Diminishers reduce magnitude, amplifiers increase it.',

  'Rule COMP-004: The default degree (no modifier) maps to the "moderate" ' +
  'level. This is the most common case: "make it brighter" = moderate increase.',

  'Rule COMP-005: Antonym pairs share an axis but with opposite directions. ' +
  '"brighter" (increase brightness) vs "darker" (decrease brightness).',

  'Rule COMP-006: Degree semantics follows the standard formal model: ' +
  'λx. axis(x) > axis(reference) + amount(modifier).',

  'Rule COMP-007: "too X" (excessive) signals that the current value is ' +
  'beyond the desired range. It implies a decrease back toward normal.',

  'Rule COMP-008: Equatives ("as bright as") require a reference entity. ' +
  'They produce a target value equal to the reference, not a delta.',

  'Rule COMP-009: Superlatives ("brightest") produce maximum/minimum targets. ' +
  'They are more aggressive than comparatives.',

  'Rule COMP-010: Intensity inherits from both the adjective and the modifier. ' +
  '"slightly brighter" < "brighter" < "much brighter" < "completely bright".',

  'Rule COMP-011: Nominalized forms ("brightness", "warmth") can be used as ' +
  'direct objects: "increase the brightness" ≈ "make it brighter".',

  'Rule COMP-012: Multi-word modifiers ("a little bit", "way more") are ' +
  'matched longest-first to handle overlapping patterns correctly.',
] as const;
