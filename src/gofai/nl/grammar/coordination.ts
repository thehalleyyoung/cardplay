/**
 * GOFAI NL Grammar — Coordination Grammar
 *
 * Implements grammar rules for coordination constructions that combine
 * multiple commands or phrases:
 *
 * - Conjunction: "X and Y", "X and also Y"
 * - Sequence: "X and then Y", "X, then Y", "first X then Y"
 * - Contrast: "X but Y", "X but not Y", "X however Y"
 * - Alternative: "X or Y", "either X or Y"
 * - Conditional: "X if Y", "if Y then X"
 * - Concurrent: "X while Y", "X as Y", "X during Y"
 * - Additive: "X, also Y", "X, additionally Y"
 * - Corrective: "not X but Y", "instead of X, Y"
 * - Elaborative: "X, specifically Y", "X, meaning Y"
 * - Causal: "X so that Y", "X in order to Y"
 *
 * ## Design
 *
 * Coordination is handled at the grammar level (not the tokenizer) because:
 * 1. The same surface form ("and") can signal different coordination types
 *    depending on context ("add X and Y" vs "add X and then remove Y")
 * 2. Scope of coordination matters: "make it brighter and warmer" coordinates
 *    two adjectives (VP-level), while "add reverb and remove delay" coordinates
 *    two full commands (S-level)
 * 3. Ellipsis requires grammar-level analysis: "add reverb to the chorus and
 *    bridge" = "add reverb to the chorus and add reverb to the bridge"
 *
 * ## Coordination Levels
 *
 * Coordination can happen at different grammatical levels:
 *
 * ```
 * S-level:   [add reverb] and [remove delay]         (two commands)
 * VP-level:  add [reverb] and [delay]                 (two objects)
 * AdjP-level: make it [brighter] and [warmer]         (two adjectives)
 * PP-level:  add reverb [to the chorus] and [the verse] (two locations)
 * ```
 *
 * The grammar module identifies the coordination level and produces
 * structured output with explicit constituent boundaries.
 *
 * @module gofai/nl/grammar/coordination
 * @see gofai_goalA.md Step 113
 * @see coordination-sequencing.ts for semantic representation
 */

import type { Span } from '../tokenizer/span-tokenizer';

// =============================================================================
// COORDINATION TYPES — what kind of coordination is this?
// =============================================================================

/**
 * Types of coordination (mirrors CoordinationType in coordination-sequencing.ts).
 */
export type CoordinationKind =
  | 'parallel'       // "X and Y" — do both, order doesn't matter
  | 'sequential'     // "X and then Y" — do X first, then Y
  | 'contrastive'    // "X but Y" — Y constrains or contrasts X
  | 'alternative'    // "X or Y" — choose one
  | 'conditional'    // "X if Y" — X depends on Y
  | 'concurrent'     // "X while Y" — do simultaneously
  | 'additive'       // "X, also Y" — add Y to X
  | 'corrective'     // "not X but Y" — replace X with Y
  | 'elaborative'    // "X, specifically Y" — Y refines X
  | 'causal';        // "X so that Y" — X is done to achieve Y

/**
 * Grammatical level at which coordination occurs.
 */
export type CoordinationLevel =
  | 'sentence'       // Two full commands: "[add reverb] and [remove delay]"
  | 'verb_phrase'    // Shared subject: "add [reverb] and [delay]"
  | 'adjective'      // Shared make-pattern: "make it [brighter] and [warmer]"
  | 'noun_phrase'    // Shared head: "[the chorus] and [the verse]"
  | 'prep_phrase'    // Shared verb+object: "add reverb [to the chorus] and [the verse]"
  | 'mixed';         // Ambiguous or mixed levels

// =============================================================================
// CONJUNCTION LEXICON — surface forms of conjunctions
// =============================================================================

/**
 * A conjunction entry: maps surface forms to coordination kinds.
 */
export interface ConjunctionEntry {
  /** Surface forms (lowercase) */
  readonly forms: readonly string[];

  /** The coordination kind this signals */
  readonly kind: CoordinationKind;

  /** Whether this conjunction implies strict ordering */
  readonly orderStrict: boolean;

  /** Position in the sentence */
  readonly position: ConjunctionPosition;

  /** Whether this conjunction can pair with a correlative ("both...and") */
  readonly hasCorrelative: boolean;

  /** The correlative partner (if any) */
  readonly correlative: string | undefined;

  /** Priority when multiple conjunctions match */
  readonly priority: number;

  /** Examples */
  readonly examples: readonly string[];

  /** Description */
  readonly description: string;
}

/**
 * Where a conjunction appears relative to its constituents.
 */
export type ConjunctionPosition =
  | 'infix'          // Between constituents: "X and Y"
  | 'prefix'         // Before first constituent: "first X, then Y"
  | 'correlative'    // Both positions: "both X and Y", "either X or Y"
  | 'suffix';        // After last constituent: "X, as well"

/**
 * All known conjunctions with their coordination mappings.
 */
export const CONJUNCTIONS: readonly ConjunctionEntry[] = [
  // --- Parallel (and) ---
  {
    forms: ['and', 'plus', 'as well as'],
    kind: 'parallel',
    orderStrict: false,
    position: 'infix',
    hasCorrelative: true,
    correlative: 'both',
    priority: 10,
    examples: ['add reverb and delay', 'make it brighter and warmer'],
    description: 'Parallel conjunction: do both, order flexible',
  },
  {
    forms: ['both'],
    kind: 'parallel',
    orderStrict: false,
    position: 'correlative',
    hasCorrelative: true,
    correlative: 'and',
    priority: 15,
    examples: ['both brighter and warmer', 'both add reverb and add delay'],
    description: 'Correlative with "and"',
  },
  {
    forms: ['also', 'additionally', 'in addition'],
    kind: 'additive',
    orderStrict: false,
    position: 'infix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 8,
    examples: ['add reverb, also add delay', 'make it brighter, additionally boost the bass'],
    description: 'Additive: Y supplements X',
  },
  {
    forms: ['as well', 'too'],
    kind: 'additive',
    orderStrict: false,
    position: 'suffix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 5,
    examples: ['add delay as well', 'add reverb too'],
    description: 'Additive suffix',
  },

  // --- Sequential (and then) ---
  {
    forms: ['and then', 'then', 'next', 'after that', 'afterwards'],
    kind: 'sequential',
    orderStrict: true,
    position: 'infix',
    hasCorrelative: true,
    correlative: 'first',
    priority: 15,
    examples: ['add reverb and then compress', 'boost the bass, then cut the highs'],
    description: 'Sequential: do X first, then Y',
  },
  {
    forms: ['first'],
    kind: 'sequential',
    orderStrict: true,
    position: 'prefix',
    hasCorrelative: true,
    correlative: 'then',
    priority: 12,
    examples: ['first add reverb, then compress'],
    description: 'Sequential prefix (correlative with "then")',
  },
  {
    forms: ['before'],
    kind: 'sequential',
    orderStrict: true,
    position: 'infix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 12,
    examples: ['compress before adding reverb'],
    description: 'Sequential (reverse order): do X before Y',
  },
  {
    forms: ['after'],
    kind: 'sequential',
    orderStrict: true,
    position: 'infix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 12,
    examples: ['add reverb after compressing'],
    description: 'Sequential: do Y after X',
  },
  {
    forms: ['followed by'],
    kind: 'sequential',
    orderStrict: true,
    position: 'infix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 10,
    examples: ['add reverb followed by delay'],
    description: 'Sequential: X followed by Y',
  },

  // --- Contrastive (but) ---
  {
    forms: ['but', 'however', 'yet', 'though', 'although'],
    kind: 'contrastive',
    orderStrict: true,
    position: 'infix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 12,
    examples: ['make it brighter but not harsh', 'add reverb but keep it tight'],
    description: 'Contrastive: Y constrains or qualifies X',
  },
  {
    forms: ['except', 'except for', 'other than'],
    kind: 'contrastive',
    orderStrict: true,
    position: 'infix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 10,
    examples: ['make everything louder except the vocals'],
    description: 'Contrastive exception',
  },
  {
    forms: ['without'],
    kind: 'contrastive',
    orderStrict: true,
    position: 'infix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 10,
    examples: ['make it brighter without adding harshness'],
    description: 'Contrastive: do X without Y',
  },

  // --- Alternative (or) ---
  {
    forms: ['or', 'alternatively'],
    kind: 'alternative',
    orderStrict: false,
    position: 'infix',
    hasCorrelative: true,
    correlative: 'either',
    priority: 10,
    examples: ['add reverb or delay', 'make it brighter or warmer'],
    description: 'Alternative: choose one',
  },
  {
    forms: ['either'],
    kind: 'alternative',
    orderStrict: false,
    position: 'correlative',
    hasCorrelative: true,
    correlative: 'or',
    priority: 12,
    examples: ['either add reverb or add delay'],
    description: 'Correlative with "or"',
  },
  {
    forms: ['otherwise'],
    kind: 'alternative',
    orderStrict: true,
    position: 'infix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 8,
    examples: ['add reverb, otherwise add delay'],
    description: 'Alternative: Y is fallback for X',
  },

  // --- Conditional ---
  {
    forms: ['if', 'in case', 'provided that', 'assuming'],
    kind: 'conditional',
    orderStrict: true,
    position: 'prefix',
    hasCorrelative: true,
    correlative: 'then',
    priority: 15,
    examples: ['if the chorus is too bright, make it darker', 'if possible, add reverb'],
    description: 'Conditional: do X if condition Y holds',
  },
  {
    forms: ['unless'],
    kind: 'conditional',
    orderStrict: true,
    position: 'infix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 12,
    examples: ['add reverb unless it sounds muddy'],
    description: 'Negative conditional',
  },
  {
    forms: ['when', 'whenever', 'once'],
    kind: 'conditional',
    orderStrict: true,
    position: 'prefix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 10,
    examples: ['when the verse starts, fade in the strings'],
    description: 'Temporal conditional',
  },

  // --- Concurrent ---
  {
    forms: ['while', 'whilst', 'at the same time'],
    kind: 'concurrent',
    orderStrict: false,
    position: 'infix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 10,
    examples: ['boost the bass while cutting the mids'],
    description: 'Concurrent: do X and Y simultaneously',
  },
  {
    forms: ['simultaneously', 'at once', 'together'],
    kind: 'concurrent',
    orderStrict: false,
    position: 'suffix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 8,
    examples: ['boost the bass and cut the mids simultaneously'],
    description: 'Concurrent suffix marker',
  },

  // --- Corrective ---
  {
    forms: ['instead', 'instead of', 'rather than'],
    kind: 'corrective',
    orderStrict: true,
    position: 'infix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 15,
    examples: ['use delay instead of reverb', 'rather than cutting, boost the highs'],
    description: 'Corrective: do Y instead of X',
  },
  {
    forms: ['not'],
    kind: 'corrective',
    orderStrict: true,
    position: 'prefix',
    hasCorrelative: true,
    correlative: 'but',
    priority: 12,
    examples: ['not reverb but delay', "don't add reverb, add delay instead"],
    description: 'Corrective prefix (correlative with "but")',
  },

  // --- Elaborative ---
  {
    forms: ['specifically', 'in particular', 'namely', 'especially'],
    kind: 'elaborative',
    orderStrict: true,
    position: 'infix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 8,
    examples: ['adjust the EQ, specifically the highs', 'fix the drums, in particular the kick'],
    description: 'Elaborative: Y specifies/refines X',
  },
  {
    forms: ['meaning', 'that is', 'i.e.'],
    kind: 'elaborative',
    orderStrict: true,
    position: 'infix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 6,
    examples: ['make it darker, meaning less highs'],
    description: 'Elaborative definition',
  },
  {
    forms: ['like', 'such as', 'for example', 'e.g.'],
    kind: 'elaborative',
    orderStrict: true,
    position: 'infix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 6,
    examples: ['add effects like reverb and delay'],
    description: 'Elaborative examples',
  },

  // --- Causal ---
  {
    forms: ['so that', 'in order to', 'so', 'to'],
    kind: 'causal',
    orderStrict: true,
    position: 'infix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 10,
    examples: ['cut the lows so that the mix is cleaner', 'add reverb to create space'],
    description: 'Causal: do X to achieve Y',
  },
  {
    forms: ['because', 'since'],
    kind: 'causal',
    orderStrict: true,
    position: 'infix',
    hasCorrelative: false,
    correlative: undefined,
    priority: 8,
    examples: ['cut the lows because it sounds muddy'],
    description: 'Causal explanation (Y motivates X)',
  },
];

// =============================================================================
// CONJUNCTION LOOKUP INDEX
// =============================================================================

/**
 * Index: surface form → conjunction entries (may match multiple).
 */
const conjunctionIndex: ReadonlyMap<string, readonly ConjunctionEntry[]> = (() => {
  const index = new Map<string, ConjunctionEntry[]>();
  for (const entry of CONJUNCTIONS) {
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
 * Look up conjunction entries by surface form.
 */
export function lookupConjunction(form: string): readonly ConjunctionEntry[] {
  return conjunctionIndex.get(form.toLowerCase()) ?? [];
}

/**
 * Check if a word/phrase is a known conjunction.
 */
export function isConjunction(word: string): boolean {
  return conjunctionIndex.has(word.toLowerCase());
}

/**
 * Get all known conjunction forms.
 */
export function getAllConjunctionForms(): readonly string[] {
  return Array.from(conjunctionIndex.keys());
}

// =============================================================================
// COORDINATION PARSE RESULT — structured result of parsing coordination
// =============================================================================

/**
 * A parsed coordination structure.
 */
export interface ParsedCoordination {
  /** The coordination kind */
  readonly kind: CoordinationKind;

  /** The grammatical level */
  readonly level: CoordinationLevel;

  /** The conjunction that was used */
  readonly conjunction: ConjunctionMatch;

  /** The coordinated constituents */
  readonly constituents: readonly CoordinatedConstituent[];

  /** Whether ordering is strict */
  readonly orderStrict: boolean;

  /** Whether a correlative was used ("both...and", "either...or") */
  readonly correlativeUsed: boolean;

  /** The full span of the coordination */
  readonly span: Span;

  /** Confidence in the parse */
  readonly confidence: number;

  /** Warnings */
  readonly warnings: readonly CoordinationWarning[];
}

/**
 * A matched conjunction in the input.
 */
export interface ConjunctionMatch {
  /** The conjunction entry */
  readonly entry: ConjunctionEntry;

  /** Surface form as it appeared */
  readonly surface: string;

  /** Span in the input */
  readonly span: Span;

  /** The correlative span (if any) */
  readonly correlativeSpan: Span | undefined;
}

/**
 * A constituent in a coordination.
 */
export interface CoordinatedConstituent {
  /** Index in the coordination (0-based) */
  readonly index: number;

  /** The surface text */
  readonly surface: string;

  /** Span in the input */
  readonly span: Span;

  /** Role of this constituent */
  readonly role: ConstituentGrammaticalRole;

  /** Whether this constituent was elided (gap filling) */
  readonly elided: boolean;

  /** If elided, what was filled in */
  readonly elidedMaterial: string | undefined;
}

/**
 * Grammatical role of a constituent in a coordination.
 */
export type ConstituentGrammaticalRole =
  | 'first_conjunct'    // The first (left) element
  | 'second_conjunct'   // The second (right) element
  | 'condition'         // The condition in a conditional
  | 'action'            // The action in a conditional
  | 'correction'        // The correction in a corrective
  | 'elaboration'       // The elaboration in an elaborative
  | 'cause'             // The cause in a causal
  | 'effect';           // The effect in a causal

/**
 * Warning about a coordination parse.
 */
export interface CoordinationWarning {
  readonly code: CoordinationWarningCode;
  readonly message: string;
  readonly span: Span;
}

/**
 * Warning codes.
 */
export type CoordinationWarningCode =
  | 'ambiguous_scope'          // Could be VP-level or S-level coordination
  | 'ambiguous_conjunction'    // "and" could be parallel or sequential
  | 'missing_correlative'      // "either" without "or"
  | 'ellipsis_detected'        // Constituent was filled from context
  | 'three_way_coordination'   // More than two constituents
  | 'nested_coordination'      // Coordination within coordination
  | 'comma_splice';            // Comma used as conjunction

// =============================================================================
// ELLIPSIS — handling shared material in coordination
// =============================================================================

/**
 * Types of ellipsis in coordination.
 */
export type EllipsisType =
  | 'gapping'          // Verb elided: "add reverb to the chorus and [add] delay [to the chorus]"
  | 'right_node'       // Right material shared: "add [to the chorus] and remove [from the chorus] reverb"
  | 'stripping'        // Everything except one element: "add reverb, and delay too"
  | 'conjunction_reduction' // Shared verb+prep: "add reverb and delay to the chorus"
  | 'none';            // No ellipsis

/**
 * An ellipsis analysis for a coordination.
 */
export interface EllipsisAnalysis {
  /** Type of ellipsis detected */
  readonly type: EllipsisType;

  /** The shared material that was elided */
  readonly sharedMaterial: string;

  /** Which constituent(s) had material elided */
  readonly elidedIn: readonly number[];

  /** Confidence in the ellipsis analysis */
  readonly confidence: number;

  /** Description */
  readonly description: string;
}

/**
 * Common ellipsis patterns in musical commands.
 */
export const ELLIPSIS_PATTERNS: readonly EllipsisPattern[] = [
  {
    name: 'verb_sharing',
    description: 'Same verb applies to both objects',
    pattern: 'V NP and NP',
    example: 'add reverb and delay',
    ellipsisType: 'conjunction_reduction',
    sharedElement: 'verb',
  },
  {
    name: 'verb_and_prep_sharing',
    description: 'Same verb and preposition apply to both objects',
    pattern: 'V NP PP and NP',
    example: 'add reverb to the chorus and the verse',
    ellipsisType: 'conjunction_reduction',
    sharedElement: 'verb_and_prep',
  },
  {
    name: 'object_sharing',
    description: 'Same object for different verbs',
    pattern: 'V and V NP',
    example: 'boost and compress the bass',
    ellipsisType: 'right_node',
    sharedElement: 'object',
  },
  {
    name: 'adjective_sharing',
    description: 'Same make-pattern with multiple adjectives',
    pattern: 'make NP Adj and Adj',
    example: 'make it brighter and warmer',
    ellipsisType: 'conjunction_reduction',
    sharedElement: 'make_pattern',
  },
  {
    name: 'scope_sharing',
    description: 'Same scope for different actions',
    pattern: 'V NP and V NP PP',
    example: 'add reverb and boost the bass in the chorus',
    ellipsisType: 'gapping',
    sharedElement: 'scope',
  },
  {
    name: 'full_command_coordination',
    description: 'Two independent commands',
    pattern: 'S and S',
    example: 'add reverb and remove the delay',
    ellipsisType: 'none',
    sharedElement: 'none',
  },
];

/**
 * An ellipsis pattern definition.
 */
export interface EllipsisPattern {
  readonly name: string;
  readonly description: string;
  readonly pattern: string;
  readonly example: string;
  readonly ellipsisType: EllipsisType;
  readonly sharedElement: string;
}

// =============================================================================
// COORDINATION DETECTION — finding coordination in token sequences
// =============================================================================

/**
 * Result of scanning for coordination points.
 */
export interface CoordinationScan {
  /** Coordination points found */
  readonly points: readonly CoordinationPoint[];

  /** Whether any coordination was found */
  readonly hasCoordination: boolean;

  /** Whether the coordination is ambiguous */
  readonly ambiguous: boolean;

  /** Number of constituents */
  readonly constituentCount: number;
}

/**
 * A point where coordination occurs in the input.
 */
export interface CoordinationPoint {
  /** Token index of the conjunction */
  readonly tokenIndex: number;

  /** The conjunction word(s) */
  readonly conjunction: string;

  /** Matching conjunction entries */
  readonly entries: readonly ConjunctionEntry[];

  /** The best-matching coordination kind */
  readonly bestKind: CoordinationKind;

  /** Whether this is part of a correlative ("both" for "both...and") */
  readonly isCorrelative: boolean;

  /** Index of the correlative partner (if any) */
  readonly correlativePartnerIndex: number | undefined;

  /** Confidence that this is actually coordination */
  readonly confidence: number;
}

/**
 * Scan a lowercased word sequence for coordination points.
 */
export function scanForCoordination(words: readonly string[]): CoordinationScan {
  const points: CoordinationPoint[] = [];

  for (let i = 0; i < words.length; i++) {
    // Try multi-word conjunctions first (longer matches first)
    let matched = false;

    for (let len = Math.min(4, words.length - i); len >= 1; len--) {
      const candidate = words.slice(i, i + len).join(' ').toLowerCase();
      const entries = lookupConjunction(candidate);

      if (entries.length > 0) {
        const bestEntry = entries[0]!;

        points.push({
          tokenIndex: i,
          conjunction: candidate,
          entries,
          bestKind: bestEntry.kind,
          isCorrelative: bestEntry.position === 'correlative',
          correlativePartnerIndex: undefined,
          confidence: computeConjunctionConfidence(i, words, bestEntry),
        });

        matched = true;
        break; // Take longest match
      }
    }

    // Skip remaining tokens in matched multi-word conjunction
    if (matched) continue;
  }

  // Link correlatives
  linkCorrelatives(points);

  return {
    points,
    hasCoordination: points.length > 0,
    ambiguous: points.length > 1 || points.some(p => p.entries.length > 1),
    constituentCount: points.length + 1,
  };
}

/**
 * Compute confidence that a token is actually a conjunction.
 */
function computeConjunctionConfidence(
  index: number,
  words: readonly string[],
  entry: ConjunctionEntry,
): number {
  let confidence = 0.5;

  // Higher confidence if there's content on both sides
  if (index > 0 && index < words.length - 1) {
    confidence += 0.2;
  }

  // Higher confidence for explicit coordination markers
  if (entry.priority >= 12) {
    confidence += 0.1;
  }

  // Lower confidence for ambiguous words ("and" at start of sentence)
  if (index === 0 && entry.position === 'infix') {
    confidence -= 0.2;
  }

  // "and" between two similar words is more likely coordination
  if (entry.forms.includes('and') && index > 0 && index < words.length - 1) {
    confidence += 0.1;
  }

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Link correlative pairs (e.g., "both" at index 0 with "and" at index 3).
 */
function linkCorrelatives(points: CoordinationPoint[]): void {
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    if (!p.isCorrelative) continue;

    const entry = p.entries[0]!;
    if (!entry.correlative) continue;

    // Find the partner
    for (let j = i + 1; j < points.length; j++) {
      const q = points[j]!;
      if (q.conjunction.toLowerCase() === entry.correlative) {
        // Link them
        (points[i] as { correlativePartnerIndex: number | undefined }).correlativePartnerIndex = j;
        (points[j] as { correlativePartnerIndex: number | undefined }).correlativePartnerIndex = i;
        break;
      }
    }
  }
}

// =============================================================================
// COORDINATION LEVEL DETECTION — what level is the coordination at?
// =============================================================================

/**
 * Heuristic rules for determining coordination level.
 */
export interface CoordinationLevelRule {
  /** Rule name */
  readonly name: string;

  /** What level this rule detects */
  readonly level: CoordinationLevel;

  /** Description */
  readonly description: string;

  /** Examples */
  readonly examples: readonly string[];

  /** Priority (higher = checked first) */
  readonly priority: number;
}

/**
 * Rules for determining coordination level.
 */
export const COORDINATION_LEVEL_RULES: readonly CoordinationLevelRule[] = [
  {
    name: 'two_verbs',
    level: 'sentence',
    description: 'Two distinct verbs on each side of conjunction → sentence-level',
    examples: ['add reverb and remove delay', 'boost the bass and cut the highs'],
    priority: 20,
  },
  {
    name: 'adjective_list',
    level: 'adjective',
    description: 'Conjunction between adjectives after "make/keep" → adjective-level',
    examples: ['make it brighter and warmer', 'keep it tight and punchy'],
    priority: 18,
  },
  {
    name: 'noun_list_after_verb',
    level: 'verb_phrase',
    description: 'Conjunction between nouns after a verb → VP-level',
    examples: ['add reverb and delay', 'remove the drums and bass'],
    priority: 15,
  },
  {
    name: 'prep_phrase_list',
    level: 'prep_phrase',
    description: 'Conjunction between PP complements → PP-level',
    examples: ['add reverb to the chorus and the verse', 'in the verse and the bridge'],
    priority: 12,
  },
  {
    name: 'contrastive_constraint',
    level: 'sentence',
    description: '"but" typically coordinates full sentences or constraints',
    examples: ['make it brighter but not harsh', 'add reverb but keep it dry'],
    priority: 16,
  },
  {
    name: 'sequential_full_commands',
    level: 'sentence',
    description: 'Sequential markers always coordinate full commands',
    examples: ['first add reverb, then compress', 'add reverb and then remove the old one'],
    priority: 20,
  },
  {
    name: 'conditional_full_commands',
    level: 'sentence',
    description: 'Conditional coordination always involves full commands',
    examples: ['if possible, add reverb', 'add reverb unless it sounds muddy'],
    priority: 20,
  },
];

// =============================================================================
// THREE-WAY AND N-WAY COORDINATION
// =============================================================================

/**
 * An n-way coordination: "X, Y, and Z".
 */
export interface NWayCoordination {
  /** All constituents */
  readonly constituents: readonly string[];

  /** The final conjunction */
  readonly conjunction: string;

  /** Whether an Oxford comma was used */
  readonly oxfordComma: boolean;

  /** The coordination kind */
  readonly kind: CoordinationKind;
}

/**
 * Detect n-way coordination in a comma-separated list.
 * Handles patterns like "X, Y, and Z" or "X, Y, Z".
 */
export function detectNWayCoordination(words: readonly string[]): NWayCoordination | undefined {
  // Look for "X, Y, and Z" pattern
  const parts: string[] = [];
  let current: string[] = [];
  let finalConjunction: string | undefined;

  for (let i = 0; i < words.length; i++) {
    const word = words[i]!.toLowerCase();

    if (word === ',') {
      if (current.length > 0) {
        parts.push(current.join(' '));
        current = [];
      }
    } else if (word === 'and' || word === 'or') {
      if (current.length > 0) {
        parts.push(current.join(' '));
        current = [];
      }
      finalConjunction = word;
    } else {
      current.push(words[i]!);
    }
  }

  if (current.length > 0) {
    parts.push(current.join(' '));
  }

  if (parts.length < 3) return undefined;

  const entries = finalConjunction ? lookupConjunction(finalConjunction) : [];
  const kind = entries.length > 0 ? entries[0]!.kind : 'parallel';

  // Check for Oxford comma (comma before final conjunction)
  const lastCommaIdx = words.lastIndexOf(',');
  const conjIdx = words.findIndex(w => w.toLowerCase() === 'and' || w.toLowerCase() === 'or');
  const oxfordComma = lastCommaIdx !== -1 && conjIdx !== -1 && lastCommaIdx < conjIdx && conjIdx - lastCommaIdx <= 2;

  return {
    constituents: parts,
    conjunction: finalConjunction ?? ',',
    oxfordComma,
    kind,
  };
}

// =============================================================================
// RHETORICAL STRUCTURE — preserving discourse-level cues
// =============================================================================

/**
 * A rhetorical relation between two discourse segments.
 * Inspired by Rhetorical Structure Theory (RST).
 */
export interface RhetoricalRelation {
  /** The relation type */
  readonly type: RhetoricalRelationType;

  /** The nucleus (main content) */
  readonly nucleus: RhetoricalSegment;

  /** The satellite (supporting content), if any */
  readonly satellite: RhetoricalSegment | undefined;

  /** Whether this is a multinuclear relation */
  readonly multinuclear: boolean;

  /** Confidence in the relation */
  readonly confidence: number;
}

/**
 * Types of rhetorical relations relevant to musical commands.
 */
export type RhetoricalRelationType =
  | 'list'           // Enumeration: "X, Y, and Z"
  | 'sequence'       // Temporal: "first X, then Y"
  | 'contrast'       // Opposition: "X but Y"
  | 'concession'     // Concession: "although X, Y"
  | 'condition'      // Condition: "if X, then Y"
  | 'purpose'        // Purpose: "X so that Y", "X to Y"
  | 'cause'          // Cause: "X because Y"
  | 'elaboration'    // Detail: "X, specifically Y"
  | 'restatement'    // Paraphrase: "X, i.e. Y"
  | 'alternative'    // Choice: "X or Y"
  | 'exception'      // Exception: "X except Y"
  | 'correction';    // Fix: "not X but Y"

/**
 * A segment in a rhetorical relation.
 */
export interface RhetoricalSegment {
  /** Surface text */
  readonly text: string;

  /** Span */
  readonly span: Span;

  /** Role: nucleus or satellite */
  readonly role: 'nucleus' | 'satellite';
}

/**
 * Map coordination kinds to rhetorical relation types.
 */
export function coordinationToRhetoricalRelation(kind: CoordinationKind): RhetoricalRelationType {
  switch (kind) {
    case 'parallel': return 'list';
    case 'sequential': return 'sequence';
    case 'contrastive': return 'contrast';
    case 'alternative': return 'alternative';
    case 'conditional': return 'condition';
    case 'concurrent': return 'list';
    case 'additive': return 'list';
    case 'corrective': return 'correction';
    case 'elaborative': return 'elaboration';
    case 'causal': return 'purpose';
  }
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a conjunction entry for display.
 */
export function formatConjunctionEntry(entry: ConjunctionEntry): string {
  const lines: string[] = [];
  lines.push(`${entry.forms.join('/')} → ${entry.kind}`);
  lines.push(`  Position: ${entry.position}`);
  lines.push(`  Order strict: ${entry.orderStrict}`);
  if (entry.hasCorrelative) {
    lines.push(`  Correlative: ${entry.correlative}`);
  }
  lines.push(`  Priority: ${entry.priority}`);
  lines.push(`  Examples: ${entry.examples.join('; ')}`);
  return lines.join('\n');
}

/**
 * Format a coordination scan for display.
 */
export function formatCoordinationScan(scan: CoordinationScan): string {
  if (!scan.hasCoordination) return 'No coordination detected.';

  const lines: string[] = [];
  lines.push(`Coordination found: ${scan.constituentCount} constituents`);
  lines.push(`Ambiguous: ${scan.ambiguous}`);
  lines.push('');

  for (const point of scan.points) {
    lines.push(`  @ token ${point.tokenIndex}: "${point.conjunction}" → ${point.bestKind}`);
    lines.push(`    Confidence: ${(point.confidence * 100).toFixed(0)}%`);
    if (point.correlativePartnerIndex !== undefined) {
      lines.push(`    Correlative partner: @ token ${point.correlativePartnerIndex}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format all conjunctions grouped by kind.
 */
export function formatConjunctionsByKind(): string {
  const sections: string[] = [];
  const kinds = [...new Set(CONJUNCTIONS.map(c => c.kind))];

  for (const kind of kinds) {
    const entries = CONJUNCTIONS.filter(c => c.kind === kind);
    sections.push(`\n=== ${kind.toUpperCase()} ===`);
    for (const entry of entries) {
      sections.push(`  ${entry.forms.join('/')} (${entry.position}, priority: ${entry.priority})`);
    }
  }

  return sections.join('\n');
}

/**
 * Format a parsed coordination for display.
 */
export function formatParsedCoordination(parsed: ParsedCoordination): string {
  const lines: string[] = [];
  lines.push(`Coordination: ${parsed.kind} (${parsed.level})`);
  lines.push(`  Conjunction: "${parsed.conjunction.surface}"`);
  lines.push(`  Order strict: ${parsed.orderStrict}`);
  lines.push(`  Correlative: ${parsed.correlativeUsed}`);
  lines.push(`  Confidence: ${(parsed.confidence * 100).toFixed(0)}%`);
  lines.push('  Constituents:');
  for (const c of parsed.constituents) {
    const elided = c.elided ? ` [elided: "${c.elidedMaterial}"]` : '';
    lines.push(`    ${c.index}. (${c.role}) "${c.surface}"${elided}`);
  }
  for (const w of parsed.warnings) {
    lines.push(`  Warning: ${w.code} — ${w.message}`);
  }
  return lines.join('\n');
}

/**
 * Format an n-way coordination for display.
 */
export function formatNWayCoordination(nway: NWayCoordination): string {
  const oxford = nway.oxfordComma ? ' (Oxford comma)' : '';
  return `${nway.kind}: ${nway.constituents.join(', ')} [${nway.conjunction}]${oxford}`;
}

/**
 * Format an ellipsis analysis for display.
 */
export function formatEllipsisAnalysis(analysis: EllipsisAnalysis): string {
  return `Ellipsis: ${analysis.type} — shared "${analysis.sharedMaterial}" ` +
    `in constituents [${analysis.elidedIn.join(', ')}] ` +
    `(confidence: ${(analysis.confidence * 100).toFixed(0)}%)`;
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the coordination grammar.
 */
export function getCoordinationStats(): CoordinationStats {
  const kindCounts = new Map<CoordinationKind, number>();
  let totalForms = 0;

  for (const entry of CONJUNCTIONS) {
    kindCounts.set(entry.kind, (kindCounts.get(entry.kind) ?? 0) + 1);
    totalForms += entry.forms.length;
  }

  return {
    totalConjunctions: CONJUNCTIONS.length,
    totalForms,
    totalEllipsisPatterns: ELLIPSIS_PATTERNS.length,
    totalLevelRules: COORDINATION_LEVEL_RULES.length,
    conjunctionsPerKind: Object.fromEntries(kindCounts) as Record<CoordinationKind, number>,
  };
}

/**
 * Statistics about the coordination grammar.
 */
export interface CoordinationStats {
  readonly totalConjunctions: number;
  readonly totalForms: number;
  readonly totalEllipsisPatterns: number;
  readonly totalLevelRules: number;
  readonly conjunctionsPerKind: Record<CoordinationKind, number>;
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const COORDINATION_GRAMMAR_RULES = [
  'Rule COORD-001: Coordination can occur at sentence level (two commands), ' +
  'VP level (two objects), adjective level, noun phrase level, or PP level.',

  'Rule COORD-002: "and" defaults to parallel coordination. Context and ' +
  'surrounding grammar determine the actual kind.',

  'Rule COORD-003: Sequential coordination ("and then", "first...then") ' +
  'implies strict ordering. Parallel coordination does not.',

  'Rule COORD-004: Contrastive coordination ("but", "except", "without") ' +
  'generates constraint opcodes for the satellite constituent.',

  'Rule COORD-005: Correlative pairs ("both...and", "either...or") are ' +
  'linked during scan. Missing partners generate a warning.',

  'Rule COORD-006: Ellipsis in coordination is resolved by identifying ' +
  'shared material. "add reverb and delay" → shared verb "add".',

  'Rule COORD-007: N-way coordination ("X, Y, and Z") is detected by ' +
  'comma-delimited lists with a final conjunction.',

  'Rule COORD-008: Rhetorical relations (RST-inspired) are inferred from ' +
  'coordination type: parallel→list, sequential→sequence, contrastive→contrast.',

  'Rule COORD-009: "but not" is treated as corrective, generating a ' +
  'negated constraint: "make it brighter but not harsh" = brighter ∧ ¬harsh.',

  'Rule COORD-010: Conditional coordination ("if", "unless") always operates ' +
  'at sentence level. The condition constituent is never elided.',

  'Rule COORD-011: Elaborative coordination ("specifically", "namely") ' +
  'has a nucleus-satellite structure. The first constituent is the nucleus.',

  'Rule COORD-012: Causal coordination ("so that", "to") expresses the ' +
  'user\'s goal. The effect constituent may inform edit plan ordering.',
] as const;
