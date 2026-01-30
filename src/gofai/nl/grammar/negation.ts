/**
 * GOFAI NL Grammar — Negation and Exclusion
 *
 * Implements grammar rules for negation, exclusion, and exception
 * constructions with explicit scope tracking:
 *
 * - Verbal negation: "don't add", "do not remove"
 * - Adverbial negation: "never", "no longer"
 * - Nominal negation: "no reverb", "no more delay"
 * - Exclusion: "without reverb", "except the drums"
 * - Scope restriction: "nothing but the bass", "only the chorus"
 * - Prohibition: "avoid", "prevent", "stop"
 *
 * ## Negation Scope
 *
 * Negation scope is critical for safety. "Don't make it brighter" negates
 * the entire command (= do nothing). But "make it not too bright" negates
 * only the degree modifier.
 *
 * ```
 * Wide scope:    don't [make it brighter]       → cancel command
 * Narrow scope:  make it [not too] bright        → constrain degree
 * Constituent:   remove [not the drums but] bass → selectional negation
 * ```
 *
 * ## Safety Implications
 *
 * Negation often signals a preservation constraint:
 * - "Don't touch the drums" → preserve(drums)
 * - "Without changing the melody" → preserve(melody)
 * - "Keep the bass, don't change it" → preserve(bass)
 *
 * The grammar module explicitly marks negation scope so the safety
 * system can correctly interpret preservation constraints.
 *
 * @module gofai/nl/grammar/negation
 * @see gofai_goalA.md Step 114
 */

import type { Span } from '../tokenizer/span-tokenizer';

// =============================================================================
// NEGATION TYPES — what kind of negation is this?
// =============================================================================

/**
 * A negation expression found in the input.
 */
export interface NegationExpression {
  /** Type of negation */
  readonly type: NegationType;

  /** The negation marker that was used */
  readonly marker: NegationMarker;

  /** Scope of the negation */
  readonly scope: NegationScope;

  /** What is being negated (the negated constituent) */
  readonly negatedConstituent: NegatedConstituent;

  /** Safety implication */
  readonly safetyImplication: SafetyImplication;

  /** Span of the entire negation expression */
  readonly span: Span;

  /** Confidence in the negation parse */
  readonly confidence: number;

  /** Warnings */
  readonly warnings: readonly NegationWarning[];
}

/**
 * Types of negation.
 */
export type NegationType =
  | 'verbal'           // "don't add", "do not remove" — negates the verb
  | 'adverbial'        // "never change", "no longer" — negates the event
  | 'nominal'          // "no reverb", "no more delay" — negates the noun
  | 'adjectival'       // "not bright", "not too loud" — negates the adjective
  | 'exclusion'        // "without reverb", "except drums" — excludes entity
  | 'restriction'      // "only the chorus", "nothing but" — restricts scope
  | 'prohibition'      // "avoid", "prevent", "stop" — prohibits action
  | 'correction';      // "not X but Y" — corrects a misunderstanding

/**
 * Scope of negation: how much of the command is affected.
 */
export interface NegationScope {
  /** The scope level */
  readonly level: NegationScopeLevel;

  /** Description of what the negation covers */
  readonly description: string;

  /** Whether the scope is clear or ambiguous */
  readonly ambiguous: boolean;

  /** If ambiguous, the alternative interpretation */
  readonly alternativeLevel: NegationScopeLevel | undefined;
}

/**
 * Levels of negation scope.
 */
export type NegationScopeLevel =
  | 'command'          // Negates the entire command: "don't make it brighter"
  | 'verb'             // Negates just the verb: "don't add" (→ preserve instead)
  | 'object'           // Negates the object: "no reverb" (→ exclude reverb)
  | 'modifier'         // Negates a modifier: "not too bright" (→ constrain degree)
  | 'scope_restriction' // Restricts where: "not in the verse" (→ elsewhere)
  | 'constituent';     // Negates one constituent in coordination: "X but not Y"

/**
 * What is being negated.
 */
export interface NegatedConstituent {
  /** Surface text of the negated material */
  readonly surface: string;

  /** Span of the negated material */
  readonly span: Span;

  /** Grammatical category of the negated material */
  readonly category: NegatedCategory;
}

/**
 * Grammatical category of negated material.
 */
export type NegatedCategory =
  | 'command'          // Full command
  | 'verb_phrase'      // Verb + object
  | 'noun_phrase'      // Just the noun/object
  | 'adjective_phrase' // Adjective/degree modifier
  | 'prep_phrase'      // Prepositional phrase (scope)
  | 'entity'           // A specific entity
  | 'parameter'        // A parameter value
  | 'action';          // An action type

// =============================================================================
// SAFETY IMPLICATIONS — what does negation mean for safety?
// =============================================================================

/**
 * Safety implication of a negation.
 */
export interface SafetyImplication {
  /** The action to take */
  readonly action: SafetyAction;

  /** What to preserve/exclude/protect */
  readonly target: string;

  /** How confident we are in this interpretation */
  readonly confidence: number;

  /** Whether this should generate a confirmation prompt */
  readonly requiresConfirmation: boolean;

  /** The constraint this produces */
  readonly constraint: SafetyConstraint;
}

/**
 * Safety actions derived from negation.
 */
export type SafetyAction =
  | 'cancel_command'       // Don't do anything at all
  | 'preserve_entity'      // Protect a specific entity from changes
  | 'exclude_entity'       // Exclude entity from scope
  | 'constrain_degree'     // Limit how much change is made
  | 'restrict_scope'       // Limit where changes apply
  | 'prohibit_action'      // Prevent a specific action type
  | 'prefer_alternative';  // Use alternative instead

/**
 * Safety constraint generated by negation.
 */
export interface SafetyConstraint {
  /** Constraint type */
  readonly type: SafetyConstraintType;

  /** What the constraint applies to */
  readonly target: string;

  /** The constraint value or bound */
  readonly value: string;

  /** Whether this is a hard or soft constraint */
  readonly hard: boolean;
}

/**
 * Types of safety constraints.
 */
export type SafetyConstraintType =
  | 'preserve'        // Do not modify
  | 'exclude'         // Do not include in scope
  | 'upper_bound'     // Maximum value/degree
  | 'lower_bound'     // Minimum value/degree
  | 'prohibit'        // Action is forbidden
  | 'require';        // Action is required (double negation)

// =============================================================================
// NEGATION MARKERS — words and phrases that signal negation
// =============================================================================

/**
 * A negation marker entry.
 */
export interface NegationMarkerEntry {
  /** Surface forms (lowercase) */
  readonly forms: readonly string[];

  /** Negation type this marker signals */
  readonly negationType: NegationType;

  /** Default scope level */
  readonly defaultScope: NegationScopeLevel;

  /** Position relative to the negated constituent */
  readonly position: NegationMarkerPosition;

  /** Default safety action */
  readonly safetyAction: SafetyAction;

  /** Priority (higher = checked first) */
  readonly priority: number;

  /** Whether this is typically a contraction */
  readonly isContraction: boolean;

  /** Examples */
  readonly examples: readonly string[];

  /** Description */
  readonly description: string;
}

/**
 * Position of a negation marker.
 */
export type NegationMarkerPosition =
  | 'pre_verb'         // Before the verb: "don't add"
  | 'pre_noun'         // Before the noun: "no reverb"
  | 'pre_adjective'    // Before the adjective: "not bright"
  | 'pre_phrase'       // Before a phrase: "without reverb"
  | 'standalone'       // Standalone: "never", "nothing"
  | 'post_verb';       // After the verb: "avoid adding"

/**
 * All known negation markers.
 */
export const NEGATION_MARKERS: readonly NegationMarkerEntry[] = [
  // --- Verbal negation ---
  {
    forms: ["don't", 'do not', 'dont'],
    negationType: 'verbal',
    defaultScope: 'command',
    position: 'pre_verb',
    safetyAction: 'cancel_command',
    priority: 20,
    isContraction: true,
    examples: ["don't add reverb", "don't change it", "don't touch the drums"],
    description: 'Verbal negation: cancels the following command',
  },
  {
    forms: ["doesn't", 'does not', 'doesnt'],
    negationType: 'verbal',
    defaultScope: 'command',
    position: 'pre_verb',
    safetyAction: 'cancel_command',
    priority: 18,
    isContraction: true,
    examples: ["it doesn't need reverb", "that doesn't sound right"],
    description: 'Third-person verbal negation',
  },
  {
    forms: ["can't", 'cannot', 'can not', 'cant'],
    negationType: 'prohibition',
    defaultScope: 'command',
    position: 'pre_verb',
    safetyAction: 'prohibit_action',
    priority: 18,
    isContraction: true,
    examples: ["can't add more tracks", "you can't remove the master"],
    description: 'Modal negation: inability/prohibition',
  },
  {
    forms: ["shouldn't", 'should not', 'shouldnt'],
    negationType: 'prohibition',
    defaultScope: 'command',
    position: 'pre_verb',
    safetyAction: 'prohibit_action',
    priority: 15,
    isContraction: true,
    examples: ["shouldn't add too much reverb", "you shouldn't remove that"],
    description: 'Advisory negation',
  },
  {
    forms: ["won't", 'will not', 'wont'],
    negationType: 'verbal',
    defaultScope: 'command',
    position: 'pre_verb',
    safetyAction: 'cancel_command',
    priority: 15,
    isContraction: true,
    examples: ["won't need reverb", "that won't work"],
    description: 'Future negation',
  },
  {
    forms: ["wouldn't", 'would not', 'wouldnt'],
    negationType: 'verbal',
    defaultScope: 'command',
    position: 'pre_verb',
    safetyAction: 'cancel_command',
    priority: 12,
    isContraction: true,
    examples: ["wouldn't want to change that", "I wouldn't add reverb"],
    description: 'Conditional negation',
  },

  // --- Adverbial negation ---
  {
    forms: ['not'],
    negationType: 'adverbial',
    defaultScope: 'modifier',
    position: 'pre_adjective',
    safetyAction: 'constrain_degree',
    priority: 15,
    isContraction: false,
    examples: ['not too bright', 'not that much', 'not the drums'],
    description: 'General negation marker (scope-dependent)',
  },
  {
    forms: ['never'],
    negationType: 'adverbial',
    defaultScope: 'command',
    position: 'pre_verb',
    safetyAction: 'prohibit_action',
    priority: 18,
    isContraction: false,
    examples: ['never remove the vocals', 'never change the key'],
    description: 'Strong temporal negation: action is always prohibited',
  },
  {
    forms: ['no longer', 'not anymore', 'no more'],
    negationType: 'adverbial',
    defaultScope: 'verb',
    position: 'pre_verb',
    safetyAction: 'cancel_command',
    priority: 15,
    isContraction: false,
    examples: ['no longer need reverb', 'no more delay'],
    description: 'Cessation: stop doing something',
  },

  // --- Nominal negation ---
  {
    forms: ['no'],
    negationType: 'nominal',
    defaultScope: 'object',
    position: 'pre_noun',
    safetyAction: 'exclude_entity',
    priority: 12,
    isContraction: false,
    examples: ['no reverb', 'no more delay', 'no changes to the drums'],
    description: 'Nominal negation: exclude or prohibit entity',
  },
  {
    forms: ['none', 'none of'],
    negationType: 'nominal',
    defaultScope: 'object',
    position: 'standalone',
    safetyAction: 'exclude_entity',
    priority: 10,
    isContraction: false,
    examples: ['none of the effects', 'change none of them'],
    description: 'Universal nominal negation',
  },
  {
    forms: ['nothing'],
    negationType: 'restriction',
    defaultScope: 'command',
    position: 'standalone',
    safetyAction: 'cancel_command',
    priority: 15,
    isContraction: false,
    examples: ['change nothing', 'nothing else'],
    description: 'Total negation: no action on anything',
  },
  {
    forms: ['neither'],
    negationType: 'nominal',
    defaultScope: 'object',
    position: 'pre_noun',
    safetyAction: 'exclude_entity',
    priority: 12,
    isContraction: false,
    examples: ['neither reverb nor delay', 'change neither the bass nor the drums'],
    description: 'Correlative negation (neither...nor)',
  },
  {
    forms: ['nor'],
    negationType: 'nominal',
    defaultScope: 'object',
    position: 'pre_noun',
    safetyAction: 'exclude_entity',
    priority: 10,
    isContraction: false,
    examples: ['nor the delay', 'nor the bass'],
    description: 'Correlative with "neither"',
  },

  // --- Exclusion ---
  {
    forms: ['without'],
    negationType: 'exclusion',
    defaultScope: 'object',
    position: 'pre_phrase',
    safetyAction: 'preserve_entity',
    priority: 15,
    isContraction: false,
    examples: ['without changing the melody', 'without reverb', 'without affecting the drums'],
    description: 'Exclusion: do X without affecting Y',
  },
  {
    forms: ['except', 'except for', 'apart from'],
    negationType: 'exclusion',
    defaultScope: 'object',
    position: 'pre_phrase',
    safetyAction: 'exclude_entity',
    priority: 15,
    isContraction: false,
    examples: ['everything except the drums', 'change all tracks except vocals'],
    description: 'Exception: include all except Y',
  },
  {
    forms: ['other than', 'besides'],
    negationType: 'exclusion',
    defaultScope: 'object',
    position: 'pre_phrase',
    safetyAction: 'exclude_entity',
    priority: 12,
    isContraction: false,
    examples: ['other than the bass', 'besides the vocals'],
    description: 'Exception (informal)',
  },
  {
    forms: ['excluding', 'not including'],
    negationType: 'exclusion',
    defaultScope: 'object',
    position: 'pre_phrase',
    safetyAction: 'exclude_entity',
    priority: 12,
    isContraction: false,
    examples: ['excluding the drums', 'all effects not including reverb'],
    description: 'Explicit exclusion',
  },

  // --- Restriction ---
  {
    forms: ['only', 'just', 'merely'],
    negationType: 'restriction',
    defaultScope: 'scope_restriction',
    position: 'pre_noun',
    safetyAction: 'restrict_scope',
    priority: 15,
    isContraction: false,
    examples: ['only the chorus', 'just the bass', 'only add reverb'],
    description: 'Restriction: apply only to specified scope',
  },
  {
    forms: ['nothing but', 'nothing except'],
    negationType: 'restriction',
    defaultScope: 'scope_restriction',
    position: 'pre_noun',
    safetyAction: 'restrict_scope',
    priority: 18,
    isContraction: false,
    examples: ['nothing but the bass', 'change nothing but the EQ'],
    description: 'Strong restriction via double negation',
  },
  {
    forms: ['solely', 'exclusively', 'purely'],
    negationType: 'restriction',
    defaultScope: 'scope_restriction',
    position: 'pre_noun',
    safetyAction: 'restrict_scope',
    priority: 12,
    isContraction: false,
    examples: ['solely the chorus', 'exclusively the vocals'],
    description: 'Formal restriction',
  },

  // --- Prohibition verbs ---
  {
    forms: ['avoid', 'avoid changing', 'avoid modifying'],
    negationType: 'prohibition',
    defaultScope: 'verb',
    position: 'pre_verb',
    safetyAction: 'prohibit_action',
    priority: 15,
    isContraction: false,
    examples: ['avoid changing the drums', 'avoid adding too much reverb'],
    description: 'Prohibition verb: avoid doing X',
  },
  {
    forms: ['prevent', 'stop', 'cease'],
    negationType: 'prohibition',
    defaultScope: 'verb',
    position: 'pre_verb',
    safetyAction: 'prohibit_action',
    priority: 12,
    isContraction: false,
    examples: ['prevent clipping', 'stop the feedback'],
    description: 'Prohibition: prevent action/state',
  },
  {
    forms: ['refrain', 'refrain from'],
    negationType: 'prohibition',
    defaultScope: 'verb',
    position: 'pre_verb',
    safetyAction: 'prohibit_action',
    priority: 10,
    isContraction: false,
    examples: ['refrain from changing the key', 'refrain from adding effects'],
    description: 'Formal prohibition',
  },

  // --- Correction ---
  {
    forms: ['not ... but', 'not ... rather'],
    negationType: 'correction',
    defaultScope: 'constituent',
    position: 'pre_noun',
    safetyAction: 'prefer_alternative',
    priority: 18,
    isContraction: false,
    examples: ['not reverb but delay', 'not the chorus but the verse'],
    description: 'Corrective: replace X with Y',
  },
];

// =============================================================================
// NEGATION MARKER LOOKUP INDEX
// =============================================================================

/**
 * Index: surface form → negation marker entries.
 */
const negationIndex: ReadonlyMap<string, readonly NegationMarkerEntry[]> = (() => {
  const index = new Map<string, NegationMarkerEntry[]>();
  for (const entry of NEGATION_MARKERS) {
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
  // Sort by priority
  for (const entries of index.values()) {
    entries.sort((a, b) => b.priority - a.priority);
  }
  return index;
})();

/**
 * Look up negation markers by surface form.
 */
export function lookupNegationMarker(form: string): readonly NegationMarkerEntry[] {
  return negationIndex.get(form.toLowerCase()) ?? [];
}

/**
 * Check if a word/phrase is a known negation marker.
 */
export function isNegationMarker(word: string): boolean {
  return negationIndex.has(word.toLowerCase());
}

/**
 * Get all known negation marker forms.
 */
export function getAllNegationForms(): readonly string[] {
  return Array.from(negationIndex.keys());
}

// =============================================================================
// NEGATION DETECTION — finding negation in token sequences
// =============================================================================

/**
 * Result of scanning for negation.
 */
export interface NegationScan {
  /** All negation points found */
  readonly points: readonly NegationPoint[];

  /** Whether any negation was found */
  readonly hasNegation: boolean;

  /** Whether there's double negation */
  readonly hasDoubleNegation: boolean;

  /** Total number of negation markers */
  readonly negationCount: number;
}

/**
 * A point where negation occurs.
 */
export interface NegationPoint {
  /** Token index of the negation marker */
  readonly tokenIndex: number;

  /** The negation marker word(s) */
  readonly marker: string;

  /** Matching marker entries */
  readonly entries: readonly NegationMarkerEntry[];

  /** Best matching negation type */
  readonly bestType: NegationType;

  /** Best matching scope level */
  readonly bestScope: NegationScopeLevel;

  /** Best matching safety action */
  readonly bestSafetyAction: SafetyAction;

  /** Confidence */
  readonly confidence: number;

  /** Whether this is part of a contraction ("don't" = "do" + "not") */
  readonly isContraction: boolean;
}

/**
 * Scan a word sequence for negation markers.
 */
export function scanForNegation(words: readonly string[]): NegationScan {
  const points: NegationPoint[] = [];

  for (let i = 0; i < words.length; i++) {
    // Try multi-word markers first (longer matches)
    let matched = false;

    for (let len = Math.min(4, words.length - i); len >= 1; len--) {
      const candidate = words.slice(i, i + len).join(' ').toLowerCase();
      const entries = lookupNegationMarker(candidate);

      if (entries.length > 0) {
        const best = entries[0]!;
        points.push({
          tokenIndex: i,
          marker: candidate,
          entries,
          bestType: best.negationType,
          bestScope: best.defaultScope,
          bestSafetyAction: best.safetyAction,
          confidence: computeNegationConfidence(i, words, best),
          isContraction: best.isContraction,
        });
        matched = true;
        i += len - 1; // Skip consumed tokens
        break;
      }
    }

    if (matched) continue;
  }

  // Check for double negation
  const hasDoubleNegation = points.length >= 2 && points.some((p, idx) =>
    idx > 0 && p.tokenIndex - points[idx - 1]!.tokenIndex <= 3,
  );

  return {
    points,
    hasNegation: points.length > 0,
    hasDoubleNegation,
    negationCount: points.length,
  };
}

/**
 * Compute confidence for a negation marker.
 */
function computeNegationConfidence(
  index: number,
  words: readonly string[],
  entry: NegationMarkerEntry,
): number {
  let confidence = 0.6;

  // Higher confidence for contractions (unambiguous)
  if (entry.isContraction) {
    confidence += 0.2;
  }

  // Higher confidence for position-appropriate markers
  if (entry.position === 'pre_verb' && index < words.length - 1) {
    confidence += 0.1;
  }
  if (entry.position === 'pre_noun' && index < words.length - 1) {
    confidence += 0.1;
  }

  // Higher confidence for high-priority markers
  if (entry.priority >= 15) {
    confidence += 0.1;
  }

  // Lower confidence for ambiguous "not" (could be many things)
  if (entry.forms.includes('not') && !entry.isContraction) {
    confidence -= 0.1;
  }

  return Math.max(0, Math.min(1, confidence));
}

// =============================================================================
// SCOPE RESOLUTION — determining what negation applies to
// =============================================================================

/**
 * Scope resolution rules for negation.
 */
export interface NegationScopeRule {
  /** Rule name */
  readonly name: string;

  /** Description */
  readonly description: string;

  /** Pattern this rule matches */
  readonly pattern: string;

  /** The scope level this rule assigns */
  readonly scopeLevel: NegationScopeLevel;

  /** The safety action this produces */
  readonly safetyAction: SafetyAction;

  /** Examples */
  readonly examples: readonly string[];

  /** Priority (higher = checked first) */
  readonly priority: number;
}

/**
 * Rules for resolving negation scope.
 */
export const NEGATION_SCOPE_RULES: readonly NegationScopeRule[] = [
  // Wide scope: negation at start of command
  {
    name: 'command_negation',
    description: 'Negation before verb at start → cancels entire command',
    pattern: "NEG VERB ...",
    scopeLevel: 'command',
    safetyAction: 'cancel_command',
    examples: ["don't add reverb", "don't change anything", 'never modify the drums'],
    priority: 20,
  },
  {
    name: 'prohibition_verb',
    description: 'Prohibition verb → prevents the following action',
    pattern: 'PROHIBIT VERB ...',
    scopeLevel: 'verb',
    safetyAction: 'prohibit_action',
    examples: ['avoid changing the key', 'prevent clipping', 'stop the feedback'],
    priority: 18,
  },

  // Medium scope: negation on the object
  {
    name: 'no_object',
    description: '"no" before noun → exclude that entity',
    pattern: 'VERB ... no NOUN',
    scopeLevel: 'object',
    safetyAction: 'exclude_entity',
    examples: ['I want no reverb', 'add no more effects'],
    priority: 15,
  },
  {
    name: 'without_object',
    description: '"without" → preserve the following entity',
    pattern: 'VERB ... without NOUN',
    scopeLevel: 'object',
    safetyAction: 'preserve_entity',
    examples: ['make it brighter without harshness', 'adjust without changing the melody'],
    priority: 15,
  },
  {
    name: 'except_object',
    description: '"except" → exclude from scope',
    pattern: 'VERB ... except NOUN',
    scopeLevel: 'object',
    safetyAction: 'exclude_entity',
    examples: ['change everything except the drums', 'all tracks except vocals'],
    priority: 15,
  },

  // Narrow scope: negation on modifier
  {
    name: 'not_too_degree',
    description: '"not too" → constrain degree (upper bound)',
    pattern: '... not too ADJ',
    scopeLevel: 'modifier',
    safetyAction: 'constrain_degree',
    examples: ['not too bright', 'not too much reverb', 'not too loud'],
    priority: 18,
  },
  {
    name: 'not_very_degree',
    description: '"not very" → constrain degree (moderate)',
    pattern: '... not very ADJ',
    scopeLevel: 'modifier',
    safetyAction: 'constrain_degree',
    examples: ['not very loud', 'not very busy'],
    priority: 15,
  },
  {
    name: 'not_so_degree',
    description: '"not so" → constrain degree (decrease)',
    pattern: '... not so ADJ',
    scopeLevel: 'modifier',
    safetyAction: 'constrain_degree',
    examples: ['not so bright', 'not so aggressive'],
    priority: 15,
  },

  // Restriction scope
  {
    name: 'only_restriction',
    description: '"only" → restrict scope to specified entity',
    pattern: 'only NOUN ...',
    scopeLevel: 'scope_restriction',
    safetyAction: 'restrict_scope',
    examples: ['only the chorus', 'only add reverb', 'change only the bass'],
    priority: 15,
  },
  {
    name: 'just_restriction',
    description: '"just" → restrict scope (informal)',
    pattern: 'just NOUN ...',
    scopeLevel: 'scope_restriction',
    safetyAction: 'restrict_scope',
    examples: ['just the drums', 'just add a little reverb'],
    priority: 12,
  },
  {
    name: 'nothing_but_restriction',
    description: '"nothing but" → strong restriction (double negation)',
    pattern: 'nothing but NOUN',
    scopeLevel: 'scope_restriction',
    safetyAction: 'restrict_scope',
    examples: ['nothing but the bass', 'change nothing but the EQ'],
    priority: 20,
  },

  // Constituent scope
  {
    name: 'not_x_but_y',
    description: '"not X but Y" → corrective negation',
    pattern: 'not NOUN but NOUN',
    scopeLevel: 'constituent',
    safetyAction: 'prefer_alternative',
    examples: ['not reverb but delay', 'not the chorus but the verse'],
    priority: 18,
  },
  {
    name: 'neither_nor',
    description: '"neither X nor Y" → exclude both',
    pattern: 'neither NOUN nor NOUN',
    scopeLevel: 'constituent',
    safetyAction: 'exclude_entity',
    examples: ['neither reverb nor delay', 'neither the bass nor the drums'],
    priority: 18,
  },
];

// =============================================================================
// DOUBLE NEGATION — handling "not un-", "nothing but", etc.
// =============================================================================

/**
 * Types of double negation.
 */
export type DoubleNegationType =
  | 'litotes'          // "not bad" → good (understatement)
  | 'emphatic'         // "don't never" → never (emphasis, colloquial)
  | 'logical'          // "nothing but" → only (logical double negation = positive)
  | 'morphological'    // "not unhappy" → happy (prefix + sentential negation)
  | 'error';           // Likely unintentional double negation

/**
 * A detected double negation pattern.
 */
export interface DoubleNegation {
  /** Type of double negation */
  readonly type: DoubleNegationType;

  /** The two negation markers */
  readonly markers: readonly [string, string];

  /** Resolved meaning (positive or negative) */
  readonly resolvedPolarity: 'positive' | 'negative';

  /** Description of the resolution */
  readonly resolution: string;

  /** Confidence in the resolution */
  readonly confidence: number;
}

/**
 * Known double negation patterns.
 */
export const DOUBLE_NEGATION_PATTERNS: readonly DoubleNegationPattern[] = [
  {
    first: ['nothing', 'none'],
    second: ['but', 'except'],
    type: 'logical',
    resolvedPolarity: 'positive',
    resolution: 'Restricts to the specified entity (= "only")',
    example: 'nothing but the bass → only the bass',
  },
  {
    first: ['not'],
    second: ['un', 'in', 'im', 'ir', 'il'],
    type: 'morphological',
    resolvedPolarity: 'positive',
    resolution: 'Double negative cancels: restores positive meaning',
    example: 'not uncommon → common',
  },
  {
    first: ['not'],
    second: ['bad', 'terrible', 'awful', 'horrible'],
    type: 'litotes',
    resolvedPolarity: 'positive',
    resolution: 'Understatement: means somewhat good',
    example: 'not bad → good (understated)',
  },
  {
    first: ["don't", 'do not'],
    second: ['never', 'no'],
    type: 'emphatic',
    resolvedPolarity: 'negative',
    resolution: 'Emphatic negation (colloquial): maintains negative',
    example: "don't never change → never change",
  },
];

/**
 * A double negation pattern definition.
 */
export interface DoubleNegationPattern {
  readonly first: readonly string[];
  readonly second: readonly string[];
  readonly type: DoubleNegationType;
  readonly resolvedPolarity: 'positive' | 'negative';
  readonly resolution: string;
  readonly example: string;
}

// =============================================================================
// NEGATIVE POLARITY ITEMS — words that require negation context
// =============================================================================

/**
 * Negative Polarity Items (NPIs): words that only appear in negative contexts.
 * Detecting these helps confirm that negation is present.
 */
export const NEGATIVE_POLARITY_ITEMS: readonly NPIEntry[] = [
  { word: 'any', description: '"any" in negative context: "don\'t add any reverb"' },
  { word: 'anything', description: '"anything" in negative context: "don\'t change anything"' },
  { word: 'anyone', description: '"anyone" in negative context' },
  { word: 'anywhere', description: '"anywhere" in negative context: "don\'t add reverb anywhere"' },
  { word: 'ever', description: '"ever" in negative context: "don\'t ever change that"' },
  { word: 'at all', description: '"at all" in negative context: "don\'t change it at all"' },
  { word: 'whatsoever', description: '"whatsoever" in negative context: "no changes whatsoever"' },
  { word: 'either', description: '"either" in negative context: "don\'t add reverb either"' },
  { word: 'yet', description: '"yet" in negative context: "hasn\'t been changed yet"' },
  { word: 'anymore', description: '"anymore" in negative context: "don\'t add reverb anymore"' },
  { word: 'a single', description: '"a single" in negative context: "don\'t change a single note"' },
  { word: 'the slightest', description: '"the slightest" in negative context: "not the slightest change"' },
];

/**
 * An NPI entry.
 */
export interface NPIEntry {
  readonly word: string;
  readonly description: string;
}

/**
 * Check if a word is a negative polarity item.
 */
export function isNPI(word: string): boolean {
  return NEGATIVE_POLARITY_ITEMS.some(npi => npi.word === word.toLowerCase());
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a negation marker entry for display.
 */
export function formatNegationMarker(entry: NegationMarkerEntry): string {
  const lines: string[] = [];
  lines.push(`${entry.forms.join('/')} → ${entry.negationType} (scope: ${entry.defaultScope})`);
  lines.push(`  Position: ${entry.position}`);
  lines.push(`  Safety: ${entry.safetyAction}`);
  lines.push(`  Priority: ${entry.priority}`);
  lines.push(`  Contraction: ${entry.isContraction}`);
  lines.push(`  Examples: ${entry.examples.join('; ')}`);
  return lines.join('\n');
}

/**
 * Format a negation scan for display.
 */
export function formatNegationScan(scan: NegationScan): string {
  if (!scan.hasNegation) return 'No negation detected.';

  const lines: string[] = [];
  lines.push(`Negation found: ${scan.negationCount} marker(s)`);
  if (scan.hasDoubleNegation) lines.push('  Double negation detected!');
  lines.push('');

  for (const point of scan.points) {
    lines.push(`  @ token ${point.tokenIndex}: "${point.marker}" → ${point.bestType} (scope: ${point.bestScope})`);
    lines.push(`    Safety: ${point.bestSafetyAction}`);
    lines.push(`    Confidence: ${(point.confidence * 100).toFixed(0)}%`);
  }

  return lines.join('\n');
}

/**
 * Format negation scope rules for display.
 */
export function formatNegationScopeRules(): string {
  const lines: string[] = [];
  lines.push('Negation Scope Rules:');
  for (const rule of NEGATION_SCOPE_RULES) {
    lines.push(`\n  ${rule.name} (priority: ${rule.priority})`);
    lines.push(`    Pattern: ${rule.pattern}`);
    lines.push(`    Scope: ${rule.scopeLevel} → ${rule.safetyAction}`);
    lines.push(`    Examples: ${rule.examples.join('; ')}`);
  }
  return lines.join('\n');
}

/**
 * Format a negation expression for display.
 */
export function formatNegationExpression(expr: NegationExpression): string {
  const lines: string[] = [];
  lines.push(`Negation: ${expr.type} (scope: ${expr.scope.level})`);
  lines.push(`  Marker: "${expr.marker.forms[0]}"`);
  lines.push(`  Negated: "${expr.negatedConstituent.surface}" (${expr.negatedConstituent.category})`);
  lines.push(`  Safety: ${expr.safetyImplication.action} → "${expr.safetyImplication.target}"`);
  lines.push(`  Constraint: ${expr.safetyImplication.constraint.type} (${expr.safetyImplication.constraint.hard ? 'hard' : 'soft'})`);
  lines.push(`  Confidence: ${(expr.confidence * 100).toFixed(0)}%`);
  if (expr.scope.ambiguous && expr.scope.alternativeLevel) {
    lines.push(`  Ambiguous! Alternative scope: ${expr.scope.alternativeLevel}`);
  }
  for (const w of expr.warnings) {
    lines.push(`  Warning: ${w.code} — ${w.message}`);
  }
  return lines.join('\n');
}

// =============================================================================
// WARNINGS
// =============================================================================

/**
 * Warning about a negation parse.
 */
export interface NegationWarning {
  readonly code: NegationWarningCode;
  readonly message: string;
  readonly span: Span;
}

/**
 * Warning codes.
 */
export type NegationWarningCode =
  | 'ambiguous_scope'          // Negation scope is unclear
  | 'double_negation'          // Two negation markers found
  | 'npi_without_negation'     // NPI used without negation context
  | 'wide_scope_destructive'   // Wide-scope negation on destructive command
  | 'implicit_preservation'    // Negation implies preservation constraint
  | 'contraction_ambiguity';   // Contraction might be misheard/mistyped

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the negation grammar.
 */
export function getNegationStats(): NegationStats {
  const typeCounts = new Map<NegationType, number>();
  let totalForms = 0;
  let contractionCount = 0;

  for (const entry of NEGATION_MARKERS) {
    typeCounts.set(entry.negationType, (typeCounts.get(entry.negationType) ?? 0) + 1);
    totalForms += entry.forms.length;
    if (entry.isContraction) contractionCount++;
  }

  return {
    totalMarkers: NEGATION_MARKERS.length,
    totalForms,
    contractionCount,
    totalScopeRules: NEGATION_SCOPE_RULES.length,
    totalNPIs: NEGATIVE_POLARITY_ITEMS.length,
    totalDoubleNegPatterns: DOUBLE_NEGATION_PATTERNS.length,
    markersPerType: Object.fromEntries(typeCounts) as Record<NegationType, number>,
  };
}

/**
 * Statistics about the negation grammar.
 */
export interface NegationStats {
  readonly totalMarkers: number;
  readonly totalForms: number;
  readonly contractionCount: number;
  readonly totalScopeRules: number;
  readonly totalNPIs: number;
  readonly totalDoubleNegPatterns: number;
  readonly markersPerType: Record<NegationType, number>;
}

// =============================================================================
// NEGATION MARKER TYPE DEFINITION (for the NegationMarker in NegationExpression)
// =============================================================================

/**
 * A matched negation marker instance.
 */
export type NegationMarker = NegationMarkerEntry;

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const NEGATION_GRAMMAR_RULES = [
  'Rule NEG-001: Negation scope is tracked explicitly. "don\'t" at command ' +
  'start has wide scope (cancels command). "not" before an adjective has ' +
  'narrow scope (constrains degree).',

  'Rule NEG-002: "without" introduces a preservation constraint. ' +
  '"make it brighter without harshness" → preserve(not-harsh).',

  'Rule NEG-003: "except" introduces an exclusion from scope. ' +
  '"change everything except the drums" → scope=all, exclude=drums.',

  'Rule NEG-004: "only" and "just" restrict scope. ' +
  '"only the chorus" → scope=chorus, all else preserved.',

  'Rule NEG-005: Double negation is resolved by type: ' +
  '"nothing but" → logical (= only), "not un-" → morphological (= positive).',

  'Rule NEG-006: Negative Polarity Items ("any", "ever", "at all") confirm ' +
  'negation context and strengthen the negation interpretation.',

  'Rule NEG-007: Contraction negation ("don\'t", "can\'t") is higher ' +
  'confidence than word-level negation ("not") because it\'s unambiguous.',

  'Rule NEG-008: Prohibition verbs ("avoid", "prevent") generate safety ' +
  'constraints equivalent to "don\'t" + the following verb.',

  'Rule NEG-009: Wide-scope negation on a destructive command (e.g., ' +
  '"don\'t remove the drums") is the safest interpretation and is preferred.',

  'Rule NEG-010: "not X but Y" is corrective negation: replace the ' +
  'interpretation of X with Y. This is distinct from exclusion.',

  'Rule NEG-011: Ambiguous negation scope triggers a clarification request ' +
  'rather than guessing. "Not too bright" vs "not bright" differ in meaning.',

  'Rule NEG-012: "neither...nor" is a correlative negation that excludes ' +
  'both constituents from scope. Missing "nor" generates a warning.',
] as const;
