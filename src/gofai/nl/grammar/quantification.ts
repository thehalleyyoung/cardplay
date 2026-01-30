/**
 * GOFAI NL Grammar — Quantification
 *
 * Implements grammar rules for quantified expressions that produce
 * selection predicates. Quantifiers specify *which* and *how many*
 * entities an edit should apply to.
 *
 * ## Quantifier Types
 *
 * 1. **Universal**: "all choruses", "every verse", "each track"
 * 2. **Existential**: "some tracks", "a chorus", "any section"
 * 3. **Proportional**: "most tracks", "half the bars", "a third of"
 * 4. **Numeric**: "two bars", "three tracks", "5 notes"
 * 5. **Partitive**: "some of the tracks", "half of the bars"
 * 6. **Distributive**: "every other bar", "each individual track"
 * 7. **Negative**: "no tracks", "neither", "none of the"
 * 8. **Interrogative**: "which tracks?", "how many bars?"
 * 9. **Relative**: "whichever", "whatever"
 * 10. **Degree**: "a few", "several", "many", "a lot of"
 *
 * ## Output: Selection Predicates
 *
 * Quantified expressions produce `SelectionPredicate` structures that
 * specify a filter over entities. These predicates compose with scopes
 * and entity references in the CPL layer.
 *
 * ## Design
 *
 * Quantifier scope ambiguity is a major NLP challenge. This module
 * preserves ambiguity using underspecified representations (following
 * MRS-style scope constraints) rather than committing to a specific
 * scope order prematurely.
 *
 * Example of scope ambiguity:
 * "Make every chorus brighter" — could mean:
 *   (a) For each chorus, make it brighter (distributive)
 *   (b) Make all choruses brighter by the same amount (collective)
 *
 * The grammar marks both readings as candidates. The pragmatics
 * layer or a clarification question resolves the ambiguity.
 *
 * @module gofai/nl/grammar/quantification
 * @see gofai_goalA.md Step 117
 * @see gofai_goalA.md Step 137 (generalized quantifier semantics)
 * @see gofai_goalA.md Step 138 (scope ambiguity representation)
 */

import type { Span } from '../tokenizer/span-tokenizer';

// =============================================================================
// SELECTION PREDICATE — output of quantification parsing
// =============================================================================

/**
 * A selection predicate: specifies which entities to select.
 *
 * The predicate is a structured filter that can be applied to
 * a set of entities to produce a subset.
 */
export interface SelectionPredicate {
  /** Unique ID for tracking */
  readonly predicateId: string;

  /** The quantifier type */
  readonly quantifier: QuantifierType;

  /** The restriction (what kind of entities) */
  readonly restriction: PredicateRestriction;

  /** The scope reading (how the quantifier distributes) */
  readonly scopeReading: ScopeReading;

  /** Numeric count (for numeric quantifiers) */
  readonly count: QuantifierCount | undefined;

  /** Ordinal filter (for "every other", "every third") */
  readonly ordinalFilter: OrdinalFilter | undefined;

  /** Additional modifiers on the quantifier */
  readonly modifiers: readonly QuantifierModifier[];

  /** Surface text */
  readonly surface: string;

  /** Span in the input */
  readonly span: Span;

  /** Confidence in the parse */
  readonly confidence: number;

  /** Warnings */
  readonly warnings: readonly QuantificationWarning[];
}

// =============================================================================
// QUANTIFIER TYPES
// =============================================================================

/**
 * Types of quantifiers.
 */
export type QuantifierType =
  | 'universal'       // "all", "every", "each"
  | 'existential'     // "some", "a", "any"
  | 'proportional'    // "most", "half", "a third"
  | 'numeric'         // "two", "three", "5"
  | 'partitive'       // "some of the", "half of the"
  | 'distributive'    // "every other", "each individual"
  | 'negative'        // "no", "none", "neither"
  | 'interrogative'   // "which", "how many"
  | 'relative'        // "whichever", "whatever"
  | 'degree'          // "a few", "several", "many"
  | 'definite_plural' // "the tracks" (= all of them)
  | 'bare_plural';    // "tracks" (generic/habitual)

/**
 * Scope reading: how the quantifier distributes over the body.
 */
export type ScopeReading =
  | 'distributive'    // Each entity separately: "make each chorus brighter"
  | 'collective'      // All entities as a group: "make all choruses brighter"
  | 'cumulative'      // Total effect across entities: "add 10 notes total"
  | 'underspecified'; // Not yet determined (requires clarification)

/**
 * A count for numeric quantifiers.
 */
export interface QuantifierCount {
  /** The number */
  readonly value: number;

  /** Whether this is exact, at least, at most, or approximate */
  readonly precision: CountPrecision;

  /** The unit (if any): "bars", "tracks", etc. */
  readonly unit: string | undefined;
}

/**
 * Precision of a numeric count.
 */
export type CountPrecision =
  | 'exact'           // "exactly 3"
  | 'at_least'        // "at least 3", "3 or more"
  | 'at_most'         // "at most 3", "no more than 3"
  | 'approximate'     // "about 3", "around 3"
  | 'range';          // "3 to 5", "between 3 and 5"

/**
 * An ordinal filter: select every Nth entity.
 */
export interface OrdinalFilter {
  /** Step size (2 for "every other", 3 for "every third") */
  readonly step: number;

  /** Starting offset (0-based) */
  readonly offset: number;

  /** Description ("every other", "every third") */
  readonly description: string;
}

// =============================================================================
// PREDICATE RESTRICTIONS — what kind of entities to select
// =============================================================================

/**
 * The restriction part of a quantifier: what entities are in scope.
 */
export interface PredicateRestriction {
  /** The head noun (entity type name) */
  readonly headNoun: string;

  /** Entity type constraints inferred from the head noun */
  readonly entityTypes: readonly string[];

  /** Adjectival modifiers on the restriction */
  readonly modifiers: readonly string[];

  /** Prepositional phrase modifiers ("in the chorus") */
  readonly ppModifiers: readonly string[];

  /** Whether the restriction is explicitly stated or inferred */
  readonly explicit: boolean;
}

// =============================================================================
// QUANTIFIER MODIFIERS
// =============================================================================

/**
 * Modifiers on quantifiers that affect meaning.
 */
export interface QuantifierModifier {
  /** The modifier type */
  readonly type: QuantifierModifierType;

  /** The modifier value */
  readonly value: string;

  /** Span */
  readonly span: Span;
}

/**
 * Types of quantifier modifiers.
 */
export type QuantifierModifierType =
  | 'exactly'         // "exactly three"
  | 'at_least'        // "at least three"
  | 'at_most'         // "at most three", "no more than three"
  | 'about'           // "about three", "approximately three"
  | 'only'            // "only three" (focus-sensitive)
  | 'just'            // "just three" (minimizer)
  | 'even'            // "even one" (scalar particle)
  | 'also'            // "also the drums" (additive particle)
  | 'other'           // "other tracks" (excluding current)
  | 'remaining'       // "remaining bars" (what's left)
  | 'specific'        // "specific tracks" (identifiable)
  | 'particular'      // "a particular section" (definite-like)
  | 'individual'      // "each individual track" (emphasizes distribution)
  | 'single'          // "a single track", "not a single" (scalar)
  | 'entire'          // "the entire section", "the whole song"
  | 'whole';          // "the whole track" (maximal extent)

// =============================================================================
// QUANTIFICATION WARNINGS
// =============================================================================

/**
 * Warning about a quantification parse.
 */
export interface QuantificationWarning {
  readonly code: QuantificationWarningCode;
  readonly message: string;
  readonly span: Span;
}

/**
 * Warning codes for quantification parsing.
 */
export type QuantificationWarningCode =
  | 'scope_ambiguity'             // Quantifier scope is ambiguous
  | 'distributive_or_collective'  // Could be read either way
  | 'empty_restriction'           // No restriction specified ("all of it")
  | 'count_exceeds_available'     // "the 5th chorus" but only 3 exist
  | 'negative_scope_ambiguity'    // "don't change all" vs "change none"
  | 'partitive_ambiguity'         // "some of the tracks" — which ones?
  | 'bare_plural_generic'         // "tracks" could be generic or specific
  | 'floating_quantifier'         // "the tracks all sound loud" (float)
  | 'proportional_vague';         // "most" without clear cardinality

// =============================================================================
// QUANTIFIER LEXICON — all recognized quantifier expressions
// =============================================================================

/**
 * A quantifier entry in the lexicon.
 */
export interface QuantifierEntry {
  /** Surface forms (lowercase) */
  readonly forms: readonly string[];

  /** The quantifier type */
  readonly type: QuantifierType;

  /** Default scope reading */
  readonly defaultReading: ScopeReading;

  /** Whether this quantifier is "strong" (presupposes non-emptiness) */
  readonly strong: boolean;

  /** Whether this quantifier is monotone increasing */
  readonly monotoneUp: boolean;

  /** Whether this quantifier is monotone decreasing */
  readonly monotoneDown: boolean;

  /** The proportion of entities this selects (for proportional) */
  readonly proportion: number | undefined;

  /** Whether this quantifier typically takes a partitive ("of the") */
  readonly partitivePreferred: boolean;

  /** Examples */
  readonly examples: readonly string[];

  /** Description */
  readonly description: string;

  /** Priority (for disambiguation) */
  readonly priority: number;
}

/**
 * All recognized quantifier entries.
 */
export const QUANTIFIER_ENTRIES: readonly QuantifierEntry[] = [
  // ---------------------------------------------------------------------------
  // Universal quantifiers
  // ---------------------------------------------------------------------------
  {
    forms: ['all', 'all the', 'all of the', 'every single'],
    type: 'universal',
    defaultReading: 'collective',
    strong: true,
    monotoneUp: true,
    monotoneDown: false,
    proportion: 1.0,
    partitivePreferred: false,
    examples: ['all choruses', 'all the tracks', 'all of the bars'],
    description: 'Universal: includes every entity',
    priority: 15,
  },
  {
    forms: ['every'],
    type: 'universal',
    defaultReading: 'distributive',
    strong: true,
    monotoneUp: true,
    monotoneDown: false,
    proportion: 1.0,
    partitivePreferred: false,
    examples: ['every chorus', 'every track', 'every bar'],
    description: 'Universal distributive: each entity separately',
    priority: 15,
  },
  {
    forms: ['each'],
    type: 'universal',
    defaultReading: 'distributive',
    strong: true,
    monotoneUp: true,
    monotoneDown: false,
    proportion: 1.0,
    partitivePreferred: false,
    examples: ['each chorus', 'each track', 'each bar'],
    description: 'Universal distributive (emphatic): each individual entity',
    priority: 16,
  },
  {
    forms: ['the whole', 'the entire', 'the full'],
    type: 'universal',
    defaultReading: 'collective',
    strong: true,
    monotoneUp: true,
    monotoneDown: false,
    proportion: 1.0,
    partitivePreferred: false,
    examples: ['the whole song', 'the entire section', 'the full track'],
    description: 'Universal maximal: the totality of a single entity',
    priority: 18,
  },
  {
    forms: ['both', 'both of the', 'both the'],
    type: 'universal',
    defaultReading: 'collective',
    strong: true,
    monotoneUp: true,
    monotoneDown: false,
    proportion: 1.0,
    partitivePreferred: false,
    examples: ['both choruses', 'both tracks'],
    description: 'Universal dual: exactly two entities',
    priority: 14,
  },

  // ---------------------------------------------------------------------------
  // Existential quantifiers
  // ---------------------------------------------------------------------------
  {
    forms: ['some', 'some of the'],
    type: 'existential',
    defaultReading: 'underspecified',
    strong: false,
    monotoneUp: true,
    monotoneDown: false,
    proportion: undefined,
    partitivePreferred: true,
    examples: ['some tracks', 'some of the bars'],
    description: 'Existential: at least one but not necessarily all',
    priority: 10,
  },
  {
    forms: ['a', 'an', 'one'],
    type: 'existential',
    defaultReading: 'underspecified',
    strong: false,
    monotoneUp: true,
    monotoneDown: false,
    proportion: undefined,
    partitivePreferred: false,
    examples: ['a chorus', 'an effect', 'one track'],
    description: 'Existential singular: exactly or at least one',
    priority: 8,
  },
  {
    forms: ['any', 'any of the'],
    type: 'existential',
    defaultReading: 'underspecified',
    strong: false,
    monotoneUp: true,
    monotoneDown: false,
    proportion: undefined,
    partitivePreferred: true,
    examples: ['any track', 'any of the sections'],
    description: 'Free-choice existential: whichever one(s)',
    priority: 10,
  },
  {
    forms: ['certain', 'certain of the'],
    type: 'existential',
    defaultReading: 'underspecified',
    strong: true,
    monotoneUp: true,
    monotoneDown: false,
    proportion: undefined,
    partitivePreferred: true,
    examples: ['certain tracks', 'certain of the bars'],
    description: 'Specific existential: particular but unidentified',
    priority: 9,
  },

  // ---------------------------------------------------------------------------
  // Proportional quantifiers
  // ---------------------------------------------------------------------------
  {
    forms: ['most', 'most of the'],
    type: 'proportional',
    defaultReading: 'collective',
    strong: true,
    monotoneUp: true,
    monotoneDown: false,
    proportion: 0.5, // > 50%
    partitivePreferred: true,
    examples: ['most tracks', 'most of the bars'],
    description: 'Proportional majority: more than half',
    priority: 12,
  },
  {
    forms: ['half', 'half of the', 'half the'],
    type: 'proportional',
    defaultReading: 'collective',
    strong: true,
    monotoneUp: false,
    monotoneDown: false,
    proportion: 0.5,
    partitivePreferred: true,
    examples: ['half the bars', 'half of the tracks'],
    description: 'Proportional: exactly half',
    priority: 14,
  },
  {
    forms: ['a third of', 'a third of the', 'one third of the'],
    type: 'proportional',
    defaultReading: 'collective',
    strong: true,
    monotoneUp: false,
    monotoneDown: false,
    proportion: 1 / 3,
    partitivePreferred: true,
    examples: ['a third of the bars'],
    description: 'Proportional: one third',
    priority: 14,
  },
  {
    forms: ['a quarter of', 'a quarter of the', 'one quarter of the'],
    type: 'proportional',
    defaultReading: 'collective',
    strong: true,
    monotoneUp: false,
    monotoneDown: false,
    proportion: 0.25,
    partitivePreferred: true,
    examples: ['a quarter of the bars'],
    description: 'Proportional: one quarter',
    priority: 14,
  },

  // ---------------------------------------------------------------------------
  // Degree quantifiers (vague cardinality)
  // ---------------------------------------------------------------------------
  {
    forms: ['a few', 'a few of the'],
    type: 'degree',
    defaultReading: 'underspecified',
    strong: false,
    monotoneUp: true,
    monotoneDown: false,
    proportion: undefined,
    partitivePreferred: true,
    examples: ['a few bars', 'a few of the notes'],
    description: 'Degree: a small number (more than one)',
    priority: 10,
  },
  {
    forms: ['several', 'several of the'],
    type: 'degree',
    defaultReading: 'underspecified',
    strong: false,
    monotoneUp: true,
    monotoneDown: false,
    proportion: undefined,
    partitivePreferred: true,
    examples: ['several tracks', 'several of the sections'],
    description: 'Degree: more than a few but not most',
    priority: 10,
  },
  {
    forms: ['many', 'many of the'],
    type: 'degree',
    defaultReading: 'underspecified',
    strong: false,
    monotoneUp: true,
    monotoneDown: false,
    proportion: undefined,
    partitivePreferred: true,
    examples: ['many bars', 'many of the tracks'],
    description: 'Degree: a large number',
    priority: 10,
  },
  {
    forms: ['a lot of', 'lots of'],
    type: 'degree',
    defaultReading: 'underspecified',
    strong: false,
    monotoneUp: true,
    monotoneDown: false,
    proportion: undefined,
    partitivePreferred: false,
    examples: ['a lot of reverb', 'lots of tracks'],
    description: 'Degree: a large amount/number',
    priority: 9,
  },
  {
    forms: ['a couple', 'a couple of', 'a pair of'],
    type: 'degree',
    defaultReading: 'underspecified',
    strong: false,
    monotoneUp: true,
    monotoneDown: false,
    proportion: undefined,
    partitivePreferred: false,
    examples: ['a couple of bars', 'a couple tracks'],
    description: 'Degree: approximately two',
    priority: 11,
  },

  // ---------------------------------------------------------------------------
  // Negative quantifiers
  // ---------------------------------------------------------------------------
  {
    forms: ['no', 'zero'],
    type: 'negative',
    defaultReading: 'collective',
    strong: true,
    monotoneUp: false,
    monotoneDown: true,
    proportion: 0,
    partitivePreferred: false,
    examples: ['no tracks', 'no reverb', 'zero delay'],
    description: 'Negative: none at all',
    priority: 14,
  },
  {
    forms: ['none', 'none of the', 'none of'],
    type: 'negative',
    defaultReading: 'collective',
    strong: true,
    monotoneUp: false,
    monotoneDown: true,
    proportion: 0,
    partitivePreferred: true,
    examples: ['none of the tracks', 'none of them'],
    description: 'Negative partitive: none from a set',
    priority: 14,
  },
  {
    forms: ['neither', 'neither of the', 'neither of'],
    type: 'negative',
    defaultReading: 'collective',
    strong: true,
    monotoneUp: false,
    monotoneDown: true,
    proportion: 0,
    partitivePreferred: true,
    examples: ['neither track', 'neither of the sections'],
    description: 'Negative dual: not one and not the other',
    priority: 14,
  },

  // ---------------------------------------------------------------------------
  // Distributive quantifiers (patterns)
  // ---------------------------------------------------------------------------
  {
    forms: ['every other', 'alternate', 'alternating'],
    type: 'distributive',
    defaultReading: 'distributive',
    strong: true,
    monotoneUp: false,
    monotoneDown: false,
    proportion: 0.5,
    partitivePreferred: false,
    examples: ['every other bar', 'alternate beats', 'alternating notes'],
    description: 'Distributive: select every 2nd entity',
    priority: 16,
  },
  {
    forms: ['every third'],
    type: 'distributive',
    defaultReading: 'distributive',
    strong: true,
    monotoneUp: false,
    monotoneDown: false,
    proportion: 1 / 3,
    partitivePreferred: false,
    examples: ['every third bar', 'every third beat'],
    description: 'Distributive: select every 3rd entity',
    priority: 16,
  },
  {
    forms: ['every fourth', 'every 4th'],
    type: 'distributive',
    defaultReading: 'distributive',
    strong: true,
    monotoneUp: false,
    monotoneDown: false,
    proportion: 0.25,
    partitivePreferred: false,
    examples: ['every fourth bar', 'every 4th beat'],
    description: 'Distributive: select every 4th entity',
    priority: 16,
  },

  // ---------------------------------------------------------------------------
  // Interrogative quantifiers
  // ---------------------------------------------------------------------------
  {
    forms: ['which', 'which of the'],
    type: 'interrogative',
    defaultReading: 'underspecified',
    strong: true,
    monotoneUp: false,
    monotoneDown: false,
    proportion: undefined,
    partitivePreferred: true,
    examples: ['which tracks?', 'which of the choruses?'],
    description: 'Interrogative: asking for identification',
    priority: 12,
  },
  {
    forms: ['how many', 'how many of the'],
    type: 'interrogative',
    defaultReading: 'underspecified',
    strong: false,
    monotoneUp: false,
    monotoneDown: false,
    proportion: undefined,
    partitivePreferred: true,
    examples: ['how many bars?', 'how many tracks?'],
    description: 'Interrogative: asking for cardinality',
    priority: 12,
  },
  {
    forms: ['what', 'what kind of'],
    type: 'interrogative',
    defaultReading: 'underspecified',
    strong: false,
    monotoneUp: false,
    monotoneDown: false,
    proportion: undefined,
    partitivePreferred: false,
    examples: ['what tracks?', 'what kind of effect?'],
    description: 'Interrogative: asking for type/identity',
    priority: 10,
  },

  // ---------------------------------------------------------------------------
  // Relative quantifiers
  // ---------------------------------------------------------------------------
  {
    forms: ['whichever', 'whatever', 'any'],
    type: 'relative',
    defaultReading: 'underspecified',
    strong: false,
    monotoneUp: false,
    monotoneDown: false,
    proportion: undefined,
    partitivePreferred: false,
    examples: ['whichever track', 'whatever sounds best'],
    description: 'Free-choice relative: any suitable entity',
    priority: 8,
  },
];

// =============================================================================
// QUANTIFIER LOOKUP INDEX
// =============================================================================

/**
 * Index: surface form → quantifier entries.
 */
const quantifierIndex: ReadonlyMap<string, readonly QuantifierEntry[]> = (() => {
  const index = new Map<string, QuantifierEntry[]>();
  for (const entry of QUANTIFIER_ENTRIES) {
    for (const form of entry.forms) {
      const lower = form.toLowerCase();
      const existing = index.get(lower);
      if (existing) {
        existing.push(entry);
      } else {
        index.set(lower, [entry]);
      }
    }
  }
  // Sort each entry list by priority descending
  for (const entries of index.values()) {
    entries.sort((a, b) => b.priority - a.priority);
  }
  return index;
})();

/**
 * Look up quantifier entries by surface form.
 */
export function lookupQuantifier(form: string): readonly QuantifierEntry[] {
  return quantifierIndex.get(form.toLowerCase()) ?? [];
}

/**
 * Check if a word/phrase is a known quantifier.
 */
export function isQuantifier(word: string): boolean {
  return quantifierIndex.has(word.toLowerCase());
}

/**
 * Get all known quantifier forms.
 */
export function getAllQuantifierForms(): readonly string[] {
  return Array.from(quantifierIndex.keys());
}

/**
 * Check if a word could start a multi-word quantifier.
 */
export function couldStartQuantifier(word: string): boolean {
  const lower = word.toLowerCase();
  const starters = new Set([
    'all', 'every', 'each', 'the', 'some', 'a', 'an', 'any', 'most',
    'many', 'few', 'several', 'half', 'no', 'none', 'neither', 'both',
    'which', 'how', 'what', 'whichever', 'whatever', 'lots', 'one',
    'certain', 'alternate', 'alternating', 'zero',
  ]);
  return starters.has(lower) || quantifierIndex.has(lower);
}

// =============================================================================
// QUANTIFIER SCANNING — finding quantifiers in token sequences
// =============================================================================

/**
 * Result of scanning for quantified expressions.
 */
export interface QuantifierScan {
  /** Detected quantified expressions */
  readonly quantifiers: readonly DetectedQuantifier[];

  /** Whether any quantifiers were found */
  readonly hasQuantifiers: boolean;

  /** Whether there are scope ambiguities */
  readonly hasScopeAmbiguity: boolean;
}

/**
 * A detected quantifier in the input.
 */
export interface DetectedQuantifier {
  /** Token index where the quantifier starts */
  readonly startTokenIndex: number;

  /** Token index where the quantifier ends (exclusive) */
  readonly endTokenIndex: number;

  /** The matched quantifier entry */
  readonly entry: QuantifierEntry;

  /** The surface text */
  readonly surface: string;

  /** The head noun following the quantifier (if any) */
  readonly headNoun: string | undefined;

  /** Token index range of the full quantified NP (quantifier + noun) */
  readonly npEndTokenIndex: number;

  /** Whether this is a floating quantifier ("the tracks all sound") */
  readonly floating: boolean;

  /** Ordinal filter (for distributive quantifiers) */
  readonly ordinalFilter: OrdinalFilter | undefined;

  /** Numeric count modifier */
  readonly countModifier: QuantifierCount | undefined;

  /** Confidence in the match */
  readonly confidence: number;
}

/**
 * Scan a lowercased word sequence for quantified expressions.
 */
export function scanForQuantifiers(words: readonly string[]): QuantifierScan {
  const quantifiers: DetectedQuantifier[] = [];

  for (let i = 0; i < words.length; i++) {
    // Skip words already consumed
    if (quantifiers.some(q => i >= q.startTokenIndex && i < q.npEndTokenIndex)) {
      continue;
    }

    // Try multi-word quantifiers first (longer matches first)
    let matched = false;
    for (let len = Math.min(5, words.length - i); len >= 1; len--) {
      const candidate = words.slice(i, i + len).join(' ').toLowerCase();
      const entries = lookupQuantifier(candidate);

      if (entries.length > 0) {
        const entry = entries[0]!;
        const qEnd = i + len;

        // Look for head noun after the quantifier
        let headNoun: string | undefined;
        let npEnd = qEnd;

        if (qEnd < words.length) {
          const nextWord = words[qEnd]!.toLowerCase();
          // Skip "of" / "of the" for partitive constructions
          if (nextWord === 'of' && qEnd + 1 < words.length) {
            const afterOf = words[qEnd + 1]!.toLowerCase();
            if (afterOf === 'the' && qEnd + 2 < words.length) {
              headNoun = words[qEnd + 2];
              npEnd = qEnd + 3;
            } else {
              headNoun = words[qEnd + 1];
              npEnd = qEnd + 2;
            }
          } else if (!isQuantifierStopWord(nextWord)) {
            headNoun = words[qEnd];
            npEnd = qEnd + 1;
          }
        }

        // Check for distributive ordinal patterns
        let ordinalFilter: OrdinalFilter | undefined;
        if (entry.type === 'distributive') {
          if (candidate.includes('other') || candidate.includes('alternate')) {
            ordinalFilter = { step: 2, offset: 0, description: 'every other' };
          } else if (candidate.includes('third')) {
            ordinalFilter = { step: 3, offset: 0, description: 'every third' };
          } else if (candidate.includes('fourth') || candidate.includes('4th')) {
            ordinalFilter = { step: 4, offset: 0, description: 'every fourth' };
          }
        }

        quantifiers.push({
          startTokenIndex: i,
          endTokenIndex: qEnd,
          entry,
          surface: candidate,
          headNoun,
          npEndTokenIndex: npEnd,
          floating: false,
          ordinalFilter,
          countModifier: undefined,
          confidence: entry.priority >= 14 ? 0.85 : 0.7,
        });

        matched = true;
        break;
      }
    }

    if (matched) continue;

    // Check for numeric quantifiers ("3 bars", "two tracks")
    const word = words[i]!.toLowerCase();
    const numericValue = parseSimpleNumber(word);
    if (numericValue !== undefined && i + 1 < words.length) {
      const headNoun = words[i + 1];
      quantifiers.push({
        startTokenIndex: i,
        endTokenIndex: i + 1,
        entry: {
          forms: [word],
          type: 'numeric',
          defaultReading: 'underspecified',
          strong: true,
          monotoneUp: true,
          monotoneDown: false,
          proportion: undefined,
          partitivePreferred: false,
          examples: [`${word} ${headNoun}`],
          description: `Numeric: exactly ${numericValue}`,
          priority: 12,
        },
        surface: word,
        headNoun,
        npEndTokenIndex: i + 2,
        floating: false,
        ordinalFilter: undefined,
        countModifier: {
          value: numericValue,
          precision: 'exact',
          unit: undefined,
        },
        confidence: 0.8,
      });
    }
  }

  // Check for scope ambiguity
  const hasScopeAmbiguity = quantifiers.length > 1 ||
    quantifiers.some(q => q.entry.defaultReading === 'underspecified');

  return {
    quantifiers,
    hasQuantifiers: quantifiers.length > 0,
    hasScopeAmbiguity,
  };
}

/**
 * Check if a word is a stop word that can't be a quantifier's head noun.
 */
function isQuantifierStopWord(word: string): boolean {
  const stops = new Set([
    'and', 'or', 'but', 'not', 'then', 'if', 'so', 'because',
    'that', 'which', 'when', 'where', 'while',
    ',', '.', '?', '!', ':', ';',
  ]);
  return stops.has(word.toLowerCase());
}

/**
 * Parse a simple number word or digit string.
 */
function parseSimpleNumber(word: string): number | undefined {
  // Digit strings
  const parsed = parseInt(word, 10);
  if (!isNaN(parsed) && parsed >= 0 && parsed <= 10000) return parsed;

  // Word numbers
  const wordNumbers: Record<string, number> = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
    'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
    'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'thirty': 30, 'forty': 40, 'fifty': 50,
  };

  return wordNumbers[word.toLowerCase()];
}

// =============================================================================
// SELECTION PREDICATE BUILDER
// =============================================================================

let predicateIdCounter = 0;

/**
 * Reset the predicate ID counter (for testing).
 */
export function resetPredicateIdCounter(): void {
  predicateIdCounter = 0;
}

/**
 * Build a SelectionPredicate from a DetectedQuantifier.
 */
export function buildSelectionPredicate(
  detected: DetectedQuantifier,
  inputSpan: Span,
): SelectionPredicate {
  const predicateId = `pred-${++predicateIdCounter}`;
  const warnings: QuantificationWarning[] = [];

  // Determine scope reading
  let scopeReading = detected.entry.defaultReading;
  if (scopeReading === 'underspecified' && detected.entry.type !== 'interrogative') {
    warnings.push({
      code: 'scope_ambiguity',
      message: `"${detected.surface}" could be read distributively or collectively`,
      span: inputSpan,
    });
  }

  // Build restriction
  const restriction: PredicateRestriction = {
    headNoun: detected.headNoun ?? '',
    entityTypes: detected.headNoun ? inferEntityTypes(detected.headNoun) : [],
    modifiers: [],
    ppModifiers: [],
    explicit: !!detected.headNoun,
  };

  if (!restriction.explicit) {
    warnings.push({
      code: 'empty_restriction',
      message: `"${detected.surface}" has no explicit restriction (head noun)`,
      span: inputSpan,
    });
  }

  // Negative scope warning
  if (detected.entry.type === 'negative') {
    warnings.push({
      code: 'negative_scope_ambiguity',
      message: `Negative quantifier "${detected.surface}" — scope needs careful handling`,
      span: inputSpan,
    });
  }

  // Proportional vagueness warning
  if (detected.entry.type === 'proportional' || detected.entry.type === 'degree') {
    warnings.push({
      code: 'proportional_vague',
      message: `"${detected.surface}" is vague — may need clarification`,
      span: inputSpan,
    });
  }

  return {
    predicateId,
    quantifier: detected.entry.type,
    restriction,
    scopeReading,
    count: detected.countModifier,
    ordinalFilter: detected.ordinalFilter,
    modifiers: [],
    surface: detected.surface + (detected.headNoun ? ` ${detected.headNoun}` : ''),
    span: inputSpan,
    confidence: detected.confidence,
    warnings,
  };
}

/**
 * Infer entity types from a head noun.
 */
function inferEntityTypes(noun: string): readonly string[] {
  const lower = noun.toLowerCase();
  const nounToTypes: Record<string, string[]> = {
    // Sections
    'chorus': ['section'], 'choruses': ['section'],
    'verse': ['section'], 'verses': ['section'],
    'bridge': ['section'], 'bridges': ['section'],
    'intro': ['section'], 'intros': ['section'],
    'outro': ['section'], 'outros': ['section'],
    'section': ['section'], 'sections': ['section'],
    'part': ['section'], 'parts': ['section'],
    'drop': ['section'], 'drops': ['section'],
    'build': ['section'], 'builds': ['section'],
    'breakdown': ['section'], 'breakdowns': ['section'],
    'prechorus': ['section'],
    'pre-chorus': ['section'],
    'interlude': ['section'], 'interludes': ['section'],
    'coda': ['section'],
    'tag': ['section'],

    // Layers / Tracks
    'track': ['layer', 'track'], 'tracks': ['layer', 'track'],
    'layer': ['layer'], 'layers': ['layer'],
    'channel': ['track'], 'channels': ['track'],
    'bus': ['track'], 'buses': ['track'],

    // Musical elements
    'bar': ['range'], 'bars': ['range'],
    'beat': ['range'], 'beats': ['range'],
    'measure': ['range'], 'measures': ['range'],
    'note': ['note', 'event'], 'notes': ['note', 'event'],
    'chord': ['musical_object'], 'chords': ['musical_object'],
    'riff': ['musical_object'], 'riffs': ['musical_object'],
    'motif': ['musical_object'], 'motifs': ['musical_object'],
    'phrase': ['musical_object'], 'phrases': ['musical_object'],
    'pattern': ['musical_object'], 'patterns': ['musical_object'],
    'melody': ['musical_object'], 'melodies': ['musical_object'],
    'hook': ['musical_object'], 'hooks': ['musical_object'],

    // Instruments
    'drum': ['instrument'], 'drums': ['instrument'],
    'bass': ['instrument'], 'guitar': ['instrument'],
    'piano': ['instrument'], 'synth': ['instrument'],
    'vocal': ['instrument'], 'vocals': ['instrument'],
    'string': ['instrument'], 'strings': ['instrument'],
    'pad': ['instrument'], 'pads': ['instrument'],
    'lead': ['instrument'], 'organ': ['instrument'],
    'kick': ['instrument'], 'snare': ['instrument'],
    'hat': ['instrument'], 'hats': ['instrument'],
    'hi-hat': ['instrument'], 'hi-hats': ['instrument'],
    'cymbal': ['instrument'], 'cymbals': ['instrument'],
    'tom': ['instrument'], 'toms': ['instrument'],

    // Effects
    'effect': ['effect'], 'effects': ['effect'],
    'reverb': ['effect'], 'delay': ['effect'],
    // Note: 'chorus' as effect (pedal) is ambiguous with section; handled by disambiguation
    'compressor': ['effect'], 'eq': ['effect'],
    'filter': ['effect'], 'distortion': ['effect'],
    'phaser': ['effect'], 'flanger': ['effect'],
    'tremolo': ['effect'],

    // Cards / Parameters
    'card': ['card'], 'cards': ['card'],
    'parameter': ['param'], 'parameters': ['param'],
    'param': ['param'], 'params': ['param'],
    'setting': ['param'], 'settings': ['param'],
    'knob': ['param'], 'knobs': ['param'],
    'fader': ['param'], 'faders': ['param'],
    'slider': ['param'], 'sliders': ['param'],
  };

  return nounToTypes[lower] ?? [];
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a SelectionPredicate for display.
 */
export function formatSelectionPredicate(pred: SelectionPredicate): string {
  const lines: string[] = [];
  lines.push(`[${pred.predicateId}] ${pred.quantifier}: "${pred.surface}"`);
  lines.push(`  Scope reading: ${pred.scopeReading}`);
  lines.push(`  Restriction: ${pred.restriction.headNoun || '(none)'}`);
  if (pred.restriction.entityTypes.length > 0) {
    lines.push(`  Entity types: ${pred.restriction.entityTypes.join(', ')}`);
  }
  if (pred.count) {
    lines.push(`  Count: ${pred.count.value} (${pred.count.precision})`);
  }
  if (pred.ordinalFilter) {
    lines.push(`  Ordinal filter: ${pred.ordinalFilter.description} (step ${pred.ordinalFilter.step})`);
  }
  lines.push(`  Confidence: ${(pred.confidence * 100).toFixed(0)}%`);
  for (const w of pred.warnings) {
    lines.push(`  Warning: ${w.code} — ${w.message}`);
  }
  return lines.join('\n');
}

/**
 * Format a QuantifierScan for display.
 */
export function formatQuantifierScan(scan: QuantifierScan): string {
  if (!scan.hasQuantifiers) return 'No quantifiers detected.';

  const lines: string[] = [];
  lines.push(`Quantifiers found: ${scan.quantifiers.length}`);
  lines.push(`Scope ambiguity: ${scan.hasScopeAmbiguity}`);
  lines.push('');

  for (const q of scan.quantifiers) {
    lines.push(`  [${q.startTokenIndex}-${q.npEndTokenIndex}] ` +
      `${q.entry.type}: "${q.surface}" + "${q.headNoun ?? '(none)'}"`);
    lines.push(`    Default reading: ${q.entry.defaultReading}`);
    if (q.ordinalFilter) {
      lines.push(`    Ordinal filter: ${q.ordinalFilter.description}`);
    }
    if (q.countModifier) {
      lines.push(`    Count: ${q.countModifier.value} (${q.countModifier.precision})`);
    }
    lines.push(`    Confidence: ${(q.confidence * 100).toFixed(0)}%`);
  }

  return lines.join('\n');
}

/**
 * Format a quantifier entry for display.
 */
export function formatQuantifierEntry(entry: QuantifierEntry): string {
  const lines: string[] = [];
  lines.push(`${entry.forms.join('/')} — ${entry.type} (${entry.defaultReading})`);
  lines.push(`  Strong: ${entry.strong}`);
  lines.push(`  Monotone: up=${entry.monotoneUp} down=${entry.monotoneDown}`);
  if (entry.proportion !== undefined) {
    lines.push(`  Proportion: ${(entry.proportion * 100).toFixed(0)}%`);
  }
  lines.push(`  Partitive preferred: ${entry.partitivePreferred}`);
  lines.push(`  Examples: ${entry.examples.join('; ')}`);
  return lines.join('\n');
}

/**
 * Format all quantifier entries by type.
 */
export function formatAllQuantifierEntries(): string {
  const sections: string[] = [];
  const types = [...new Set(QUANTIFIER_ENTRIES.map(e => e.type))];

  for (const type of types) {
    const entries = QUANTIFIER_ENTRIES.filter(e => e.type === type);
    sections.push(`\n=== ${type.toUpperCase()} ===`);
    for (const entry of entries) {
      sections.push(`  ${entry.forms.join('/')} (priority: ${entry.priority})`);
    }
  }

  return sections.join('\n');
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the quantification grammar.
 */
export function getQuantificationStats(): QuantificationStats {
  const typeCounts = new Map<QuantifierType, number>();
  let totalForms = 0;

  for (const entry of QUANTIFIER_ENTRIES) {
    typeCounts.set(entry.type, (typeCounts.get(entry.type) ?? 0) + 1);
    totalForms += entry.forms.length;
  }

  return {
    totalEntries: QUANTIFIER_ENTRIES.length,
    totalForms,
    typeCounts: Object.fromEntries(typeCounts) as Record<QuantifierType, number>,
  };
}

/**
 * Statistics about the quantification grammar.
 */
export interface QuantificationStats {
  readonly totalEntries: number;
  readonly totalForms: number;
  readonly typeCounts: Record<string, number>;
}

// =============================================================================
// GRAMMAR RULES — formal specification of quantification grammar rules
// =============================================================================

/**
 * A grammar rule for quantified expressions.
 */
export interface QuantificationGrammarRule {
  /** Rule ID */
  readonly id: string;

  /** LHS non-terminal */
  readonly lhs: string;

  /** RHS description */
  readonly rhsDescription: string;

  /** The quantifier type this produces */
  readonly producesType: QuantifierType;

  /** Priority */
  readonly priority: number;

  /** Semantic action name */
  readonly semanticAction: string;

  /** Examples */
  readonly examples: readonly string[];
}

/**
 * Generate grammar rules for quantified expressions.
 */
export function generateQuantificationGrammarRules(): readonly QuantificationGrammarRule[] {
  const rules: QuantificationGrammarRule[] = [];

  // Rule 1: Universal + Noun → QNP
  rules.push({
    id: 'quant-001',
    lhs: 'QuantifiedNP',
    rhsDescription: 'UniversalQ NounPhrase',
    producesType: 'universal',
    priority: 15,
    semanticAction: 'sem:quant:universal',
    examples: ['all choruses', 'every track', 'each verse'],
  });

  // Rule 2: Existential + Noun → QNP
  rules.push({
    id: 'quant-002',
    lhs: 'QuantifiedNP',
    rhsDescription: 'ExistentialQ NounPhrase',
    producesType: 'existential',
    priority: 10,
    semanticAction: 'sem:quant:existential',
    examples: ['some tracks', 'a chorus', 'any section'],
  });

  // Rule 3: Numeric + Noun → QNP
  rules.push({
    id: 'quant-003',
    lhs: 'QuantifiedNP',
    rhsDescription: 'Number NounPhrase',
    producesType: 'numeric',
    priority: 12,
    semanticAction: 'sem:quant:numeric',
    examples: ['two bars', 'three tracks', '5 notes'],
  });

  // Rule 4: Proportional + "of" + Noun → QNP
  rules.push({
    id: 'quant-004',
    lhs: 'QuantifiedNP',
    rhsDescription: 'ProportionalQ "of" DefNP',
    producesType: 'proportional',
    priority: 14,
    semanticAction: 'sem:quant:proportional',
    examples: ['half of the bars', 'most of the tracks'],
  });

  // Rule 5: Distributive + Noun → QNP
  rules.push({
    id: 'quant-005',
    lhs: 'QuantifiedNP',
    rhsDescription: 'DistributiveQ NounPhrase',
    producesType: 'distributive',
    priority: 16,
    semanticAction: 'sem:quant:distributive',
    examples: ['every other bar', 'every third beat'],
  });

  // Rule 6: Negative + Noun → QNP
  rules.push({
    id: 'quant-006',
    lhs: 'QuantifiedNP',
    rhsDescription: 'NegativeQ NounPhrase',
    producesType: 'negative',
    priority: 14,
    semanticAction: 'sem:quant:negative',
    examples: ['no tracks', 'none of the bars'],
  });

  // Rule 7: Degree + Noun → QNP
  rules.push({
    id: 'quant-007',
    lhs: 'QuantifiedNP',
    rhsDescription: 'DegreeQ NounPhrase',
    producesType: 'degree',
    priority: 10,
    semanticAction: 'sem:quant:degree',
    examples: ['a few bars', 'several tracks', 'many notes'],
  });

  // Rule 8: Interrogative + Noun → QNP (question context)
  rules.push({
    id: 'quant-008',
    lhs: 'QuantifiedNP',
    rhsDescription: 'InterrogativeQ NounPhrase',
    producesType: 'interrogative',
    priority: 12,
    semanticAction: 'sem:quant:interrogative',
    examples: ['which tracks?', 'how many bars?', 'what chords?'],
  });

  // Rule 9: Modifier + QNP → QNP (modified quantification)
  rules.push({
    id: 'quant-009',
    lhs: 'QuantifiedNP',
    rhsDescription: 'QModifier QuantifiedNP',
    producesType: 'numeric',
    priority: 18,
    semanticAction: 'sem:quant:modified',
    examples: ['exactly three bars', 'at least two tracks', 'only one section'],
  });

  // Rule 10: "the" + PluralNoun → QNP (definite plural)
  rules.push({
    id: 'quant-010',
    lhs: 'QuantifiedNP',
    rhsDescription: '"the" PluralNoun',
    producesType: 'definite_plural',
    priority: 8,
    semanticAction: 'sem:quant:definite_plural',
    examples: ['the tracks', 'the bars', 'the sections'],
  });

  return rules;
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const QUANTIFICATION_GRAMMAR_RULES = [
  'Rule QUANT-001: Universal quantifiers ("all", "every", "each") select all ' +
  'entities matching the restriction. "every" and "each" prefer distributive ' +
  'reading; "all" prefers collective.',

  'Rule QUANT-002: Existential quantifiers ("some", "a", "any") select at least ' +
  'one entity. They do not presuppose a specific cardinality.',

  'Rule QUANT-003: Numeric quantifiers ("two bars", "5 tracks") select an exact ' +
  'count. Modifiers like "at least" or "about" change the precision.',

  'Rule QUANT-004: Proportional quantifiers ("most", "half") select a proportion ' +
  'of the entities. They presuppose a known total count.',

  'Rule QUANT-005: Distributive quantifiers ("every other", "every third") select ' +
  'entities at regular intervals with an ordinal filter.',

  'Rule QUANT-006: Negative quantifiers ("no", "none") select zero entities. They ' +
  'typically generate preservation constraints or cancellation.',

  'Rule QUANT-007: Degree quantifiers ("a few", "several", "many") express vague ' +
  'cardinality. They may require clarification if precision matters.',

  'Rule QUANT-008: Scope ambiguity between distributive and collective readings ' +
  'must be flagged. If scope affects the edit outcome, clarify.',

  'Rule QUANT-009: Quantified expressions produce SelectionPredicate nodes in ' +
  'the CPL. These predicates are evaluated against the project symbol table.',

  'Rule QUANT-010: "the" + plural noun ("the tracks") is treated as a definite ' +
  'plural quantifier, selecting all entities matching the noun in the current scope.',

  'Rule QUANT-011: Floating quantifiers ("the tracks all sound loud") are ' +
  'detected and normalized to standard quantifier+noun order.',

  'Rule QUANT-012: When a quantifier interacts with negation ("don\'t change all"), ' +
  'scope ordering is critical. Flag for clarification rather than guessing.',
] as const;
