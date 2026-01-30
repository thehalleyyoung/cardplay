/**
 * GOFAI Ambiguity Policy — Formal Rules for Handling Underspecification
 *
 * Step 012 [NLP][Prag]: Specifies a formal ambiguity policy that:
 * - Allows underspecified meaning (holes) in CPL-Intent
 * - Requires explicit resolution before execution
 * - Distinguishes hard vs soft ambiguity
 * - Defines when clarification is mandatory vs optional
 * - Specifies default resolution strategies and their safety conditions
 *
 * ## Core Principle
 *
 * The system NEVER silently guesses about ambiguity that would produce
 * materially different edits. If two interpretations would result in
 * different musical outcomes, the user must be asked. This is the
 * "Silent Ambiguity Prohibition" from the semantic safety invariants.
 *
 * ## Ambiguity Classification
 *
 * 1. **Lexical ambiguity**: A word maps to multiple senses
 *    (e.g., "darker" → timbre vs harmony vs register)
 *
 * 2. **Scope ambiguity**: A modifier can attach to different constituents
 *    (e.g., "make the chorus drums louder" — which chorus? which drums?)
 *
 * 3. **Referential ambiguity**: A pronoun/demonstrative has multiple antecedents
 *    (e.g., "that" could refer to the chorus or the edit)
 *
 * 4. **Quantificational ambiguity**: Scope of quantifiers is unclear
 *    (e.g., "all choruses" — every chorus instance or the chorus type?)
 *
 * 5. **Degree ambiguity**: Amount is unspecified
 *    (e.g., "more lift" — how much?)
 *
 * 6. **Pragmatic ambiguity**: Implicature or presupposition is unclear
 *    (e.g., "keep it steady" — keep what steady?)
 *
 * @module gofai/pipeline/ambiguity-policy
 * @see {@link docs/gofai/product-contract.md} Section 2.1
 * @see {@link src/gofai/canon/semantic-safety.ts} Invariant 2
 */

import type {
  CPLHole,
  CPLHoleCandidate,
  CPLIntent,
  TextSpan,
  ClarificationQuestion,
} from './types';

// =============================================================================
// Ambiguity Classification
// =============================================================================

/**
 * The kind of ambiguity a hole represents.
 */
export type AmbiguityKind =
  | 'lexical_sense'         // Word has multiple senses
  | 'scope_attachment'      // Modifier attaches to multiple sites
  | 'referential'           // Pronoun/demonstrative has multiple antecedents
  | 'quantificational'      // Quantifier scope is ambiguous
  | 'degree'                // Amount is unspecified
  | 'pragmatic_implicature' // What is implied but not said
  | 'presupposition'        // A presupposition lacks a clear antecedent
  | 'ellipsis'              // Something is omitted and must be recovered
  | 'coordination_scope'    // Scope of "and"/"but" is unclear
  | 'temporal'              // "earlier"/"later" could be macro vs micro
  | 'entity_type'           // "the chorus" could mean section, harmony, or events
  | 'metonymy';             // Part-for-whole or whole-for-part reference

/**
 * All ambiguity kinds as a const array.
 */
export const AMBIGUITY_KINDS: readonly AmbiguityKind[] = [
  'lexical_sense',
  'scope_attachment',
  'referential',
  'quantificational',
  'degree',
  'pragmatic_implicature',
  'presupposition',
  'ellipsis',
  'coordination_scope',
  'temporal',
  'entity_type',
  'metonymy',
] as const;

// =============================================================================
// Ambiguity Severity
// =============================================================================

/**
 * Severity of an ambiguity, determining whether it must be resolved.
 *
 * - **hard**: MUST be resolved before planning/execution. The interpretations
 *   produce materially different edits. No safe default exists.
 *
 * - **soft**: Has a safe default. System can proceed with the default
 *   but should inform the user what was assumed. The user can override.
 *
 * - **cosmetic**: Different interpretations produce equivalent edits.
 *   No user action needed. System picks the canonical form silently.
 */
export type AmbiguitySeverity = 'hard' | 'soft' | 'cosmetic';

/**
 * Criteria for classifying ambiguity severity.
 */
export interface SeverityClassification {
  /** The kind of ambiguity */
  readonly kind: AmbiguityKind;

  /** The severity */
  readonly severity: AmbiguitySeverity;

  /** Why this severity was assigned */
  readonly reason: string;

  /** The "material difference" test result */
  readonly materialDifference: MaterialDifferenceResult;
}

/**
 * Result of the "material difference" test.
 *
 * Two interpretations are materially different if they would produce
 * different edits (different events affected, different parameter values,
 * different scope, etc.).
 */
export interface MaterialDifferenceResult {
  /** Whether the interpretations differ materially */
  readonly differs: boolean;

  /** What differs */
  readonly differenceDescription: string | undefined;

  /** How significant the difference is */
  readonly significance: 'none' | 'minor' | 'moderate' | 'major';

  /** Whether the difference is reversible */
  readonly reversible: boolean;
}

// =============================================================================
// Ambiguity Resolution Strategies
// =============================================================================

/**
 * Strategy for resolving an ambiguity.
 */
export type ResolutionStrategy =
  | AskUserStrategy
  | ApplyDefaultStrategy
  | DeferStrategy
  | MergeStrategy
  | NarrowByContextStrategy;

/**
 * Ask the user to choose.
 */
export interface AskUserStrategy {
  readonly type: 'ask_user';

  /** The question to ask */
  readonly question: ClarificationQuestion;

  /** Whether the user can skip (soft ambiguity only) */
  readonly skippable: boolean;
}

/**
 * Apply a safe default value.
 */
export interface ApplyDefaultStrategy {
  readonly type: 'apply_default';

  /** The default value to apply */
  readonly defaultValue: unknown;

  /** Why this default is safe */
  readonly safetyReason: string;

  /** The provenance tag for this default */
  readonly provenanceTag: string;

  /** Whether the user should be notified */
  readonly notifyUser: boolean;
}

/**
 * Defer resolution to a later stage (e.g., planning may disambiguate).
 */
export interface DeferStrategy {
  readonly type: 'defer';

  /** Which stage should resolve this */
  readonly deferTo: 'pragmatics' | 'typecheck' | 'planning';

  /** Why it can be deferred */
  readonly reason: string;
}

/**
 * Merge interpretations (they're equivalent).
 */
export interface MergeStrategy {
  readonly type: 'merge';

  /** The merged canonical form */
  readonly canonicalForm: unknown;

  /** Why they're equivalent */
  readonly equivalenceReason: string;
}

/**
 * Narrow by context (use dialogue state, UI focus, etc.).
 */
export interface NarrowByContextStrategy {
  readonly type: 'narrow_by_context';

  /** What context narrows the options */
  readonly contextSource: 'dialogue_state' | 'ui_focus' | 'world_state' | 'user_prefs';

  /** The narrowed set of candidates */
  readonly remainingCandidates: readonly CPLHoleCandidate[];

  /** Whether further resolution is needed */
  readonly fullyResolved: boolean;
}

// =============================================================================
// Ambiguity Policy Rules
// =============================================================================

/**
 * A policy rule that determines how a specific ambiguity should be handled.
 */
export interface AmbiguityPolicyRule {
  /** Rule identifier */
  readonly id: string;

  /** Human-readable name */
  readonly name: string;

  /** What kind of ambiguity this rule handles */
  readonly kind: AmbiguityKind;

  /** Description of the rule */
  readonly description: string;

  /** The default severity for this kind */
  readonly defaultSeverity: AmbiguitySeverity;

  /** When to apply this rule (predicate description) */
  readonly appliesWhen: string;

  /** The resolution strategy */
  readonly strategy: ResolutionStrategy['type'];

  /** Example utterances that trigger this rule */
  readonly examples: readonly AmbiguityExample[];

  /** Whether this rule can be overridden by user preferences */
  readonly userOverridable: boolean;

  /** Priority (higher = applied first) */
  readonly priority: number;
}

/**
 * An example of an ambiguity for documentation and testing.
 */
export interface AmbiguityExample {
  /** The utterance */
  readonly utterance: string;

  /** The ambiguous span */
  readonly ambiguousSpan: string;

  /** The competing interpretations */
  readonly interpretations: readonly string[];

  /** The expected resolution strategy */
  readonly expectedStrategy: ResolutionStrategy['type'];

  /** Expected severity */
  readonly expectedSeverity: AmbiguitySeverity;
}

// =============================================================================
// Core Ambiguity Policy Rules
// =============================================================================

/**
 * The core set of ambiguity policy rules.
 *
 * These encode the product contract's requirements about when to ask
 * the user vs when to apply defaults.
 */
export const CORE_AMBIGUITY_RULES: readonly AmbiguityPolicyRule[] = [
  // ===== Lexical Sense Ambiguity =====
  {
    id: 'amb:lexical:vague_adjective',
    name: 'Vague Adjective Sense',
    kind: 'lexical_sense',
    description: 'A vague adjective like "darker", "warmer", "bigger" can map to multiple perceptual axes. If the axes produce materially different edits, ask the user.',
    defaultSeverity: 'hard',
    appliesWhen: 'A vague adjective maps to 2+ axes with different lever sets',
    strategy: 'ask_user',
    examples: [
      {
        utterance: 'Make it darker',
        ambiguousSpan: 'darker',
        interpretations: [
          'Decrease brightness (timbre: less high-frequency content)',
          'Lower register (pitch: shift notes down)',
          'Darker harmony (harmony: minor substitutions, flattened extensions)',
        ],
        expectedStrategy: 'ask_user',
        expectedSeverity: 'hard',
      },
      {
        utterance: 'Make it warmer',
        ambiguousSpan: 'warmer',
        interpretations: [
          'Increase warmth axis (timbre: more low-mids)',
          'Increase intimacy (arrangement: reduce density, closer feel)',
        ],
        expectedStrategy: 'ask_user',
        expectedSeverity: 'hard',
      },
      {
        utterance: 'Make it bigger',
        ambiguousSpan: 'bigger',
        interpretations: [
          'Increase width (production: stereo spread)',
          'Increase energy (arrangement: more layers, louder dynamics)',
          'Increase register spread (pitch: wider voicings)',
        ],
        expectedStrategy: 'ask_user',
        expectedSeverity: 'hard',
      },
    ],
    userOverridable: true,
    priority: 100,
  },
  {
    id: 'amb:lexical:vague_adjective_with_pref',
    name: 'Vague Adjective with User Preference',
    kind: 'lexical_sense',
    description: 'If the user has a stored preference for a vague adjective sense, apply it as a soft default with notification.',
    defaultSeverity: 'soft',
    appliesWhen: 'User preference exists for this adjective sense mapping',
    strategy: 'apply_default',
    examples: [
      {
        utterance: 'Make it darker',
        ambiguousSpan: 'darker',
        interpretations: ['Using your default: darker = decrease brightness (timbre)'],
        expectedStrategy: 'apply_default',
        expectedSeverity: 'soft',
      },
    ],
    userOverridable: true,
    priority: 110,
  },

  // ===== Scope Attachment Ambiguity =====
  {
    id: 'amb:scope:modifier_attachment',
    name: 'Modifier Attachment',
    kind: 'scope_attachment',
    description: 'A modifier can attach to different parts of the sentence, producing different scopes.',
    defaultSeverity: 'hard',
    appliesWhen: 'Modifier can attach to 2+ constituents with different scope effects',
    strategy: 'ask_user',
    examples: [
      {
        utterance: 'Make the chorus drums louder',
        ambiguousSpan: 'chorus drums',
        interpretations: [
          'Drums track in the chorus section',
          'The "chorus drums" pattern/part (a named entity)',
        ],
        expectedStrategy: 'ask_user',
        expectedSeverity: 'hard',
      },
    ],
    userOverridable: false,
    priority: 90,
  },
  {
    id: 'amb:scope:single_match',
    name: 'Scope with Single Match',
    kind: 'scope_attachment',
    description: 'If the modifier attachment has only one valid match in the project world, resolve silently.',
    defaultSeverity: 'cosmetic',
    appliesWhen: 'Only one entity matches the combined reference in the project',
    strategy: 'narrow_by_context',
    examples: [
      {
        utterance: 'Make the verse pad wider',
        ambiguousSpan: 'verse pad',
        interpretations: ['Pad track in Verse 1 (only verse with a pad)'],
        expectedStrategy: 'narrow_by_context',
        expectedSeverity: 'cosmetic',
      },
    ],
    userOverridable: false,
    priority: 95,
  },

  // ===== Referential Ambiguity =====
  {
    id: 'amb:ref:pronoun_multiple_antecedents',
    name: 'Pronoun with Multiple Antecedents',
    kind: 'referential',
    description: 'A pronoun like "it" or "that" has multiple possible antecedents. If the antecedents are of different types or scopes, ask.',
    defaultSeverity: 'hard',
    appliesWhen: 'Pronoun has 2+ antecedents of different types or scopes',
    strategy: 'ask_user',
    examples: [
      {
        utterance: 'Make it brighter',
        ambiguousSpan: 'it',
        interpretations: [
          'The last focused section (Chorus 2)',
          'The last edited layer (Pad)',
          'The whole project (global scope)',
        ],
        expectedStrategy: 'ask_user',
        expectedSeverity: 'hard',
      },
    ],
    userOverridable: false,
    priority: 85,
  },
  {
    id: 'amb:ref:pronoun_clear_salience',
    name: 'Pronoun with Clear Salience',
    kind: 'referential',
    description: 'A pronoun has a clearly most-salient antecedent (high salience gap). Resolve to it with notification.',
    defaultSeverity: 'soft',
    appliesWhen: 'Pronoun has a single antecedent with salience gap > 0.3',
    strategy: 'apply_default',
    examples: [
      {
        utterance: 'Make it louder',
        ambiguousSpan: 'it',
        interpretations: ['Chorus 2 (most recently focused, salience 0.9 vs next 0.4)'],
        expectedStrategy: 'apply_default',
        expectedSeverity: 'soft',
      },
    ],
    userOverridable: false,
    priority: 86,
  },
  {
    id: 'amb:ref:deictic_no_selection',
    name: 'Deictic Without Selection',
    kind: 'referential',
    description: '"This" or "these" requires a UI selection. If no selection exists, ask.',
    defaultSeverity: 'hard',
    appliesWhen: 'Deictic reference used but no UI selection is active',
    strategy: 'ask_user',
    examples: [
      {
        utterance: 'Make these notes louder',
        ambiguousSpan: 'these notes',
        interpretations: [
          'No selection active — which notes do you mean?',
        ],
        expectedStrategy: 'ask_user',
        expectedSeverity: 'hard',
      },
    ],
    userOverridable: false,
    priority: 88,
  },

  // ===== Degree Ambiguity =====
  {
    id: 'amb:degree:unspecified_amount',
    name: 'Unspecified Amount',
    kind: 'degree',
    description: 'User said "more" or "less" without specifying how much. Apply moderate default.',
    defaultSeverity: 'soft',
    appliesWhen: 'A degree modifier has no explicit quantity',
    strategy: 'apply_default',
    examples: [
      {
        utterance: 'More lift in the chorus',
        ambiguousSpan: 'more',
        interpretations: ['Default: moderate increase (amount=moderate)'],
        expectedStrategy: 'apply_default',
        expectedSeverity: 'soft',
      },
      {
        utterance: 'Less busy',
        ambiguousSpan: 'less',
        interpretations: ['Default: moderate decrease (amount=moderate)'],
        expectedStrategy: 'apply_default',
        expectedSeverity: 'soft',
      },
    ],
    userOverridable: true,
    priority: 70,
  },

  // ===== Quantificational Ambiguity =====
  {
    id: 'amb:quant:all_vs_type',
    name: 'All Instances vs Type',
    kind: 'quantificational',
    description: '"All choruses" might mean every chorus instance or the chorus as a structural element. If the project has multiple chorus instances, ask.',
    defaultSeverity: 'hard',
    appliesWhen: 'Quantified reference matches 2+ instances of different character',
    strategy: 'ask_user',
    examples: [
      {
        utterance: 'Make all choruses brighter',
        ambiguousSpan: 'all choruses',
        interpretations: [
          'Every chorus section (Chorus 1, Chorus 2, Chorus 3)',
          'The chorus as a structural role (apply to chorus template)',
        ],
        expectedStrategy: 'ask_user',
        expectedSeverity: 'hard',
      },
    ],
    userOverridable: false,
    priority: 80,
  },

  // ===== Pragmatic Ambiguity =====
  {
    id: 'amb:prag:implicit_scope',
    name: 'Implicit Scope',
    kind: 'pragmatic_implicature',
    description: 'No scope specified. Default to the current focus scope (last focused section/selection).',
    defaultSeverity: 'soft',
    appliesWhen: 'No explicit scope in utterance and a focus scope exists',
    strategy: 'apply_default',
    examples: [
      {
        utterance: 'Make it brighter',
        ambiguousSpan: '(entire utterance — no scope)',
        interpretations: ['Default scope: current focus (Chorus 2)'],
        expectedStrategy: 'apply_default',
        expectedSeverity: 'soft',
      },
    ],
    userOverridable: false,
    priority: 75,
  },
  {
    id: 'amb:prag:no_focus_no_scope',
    name: 'No Focus and No Scope',
    kind: 'pragmatic_implicature',
    description: 'No scope specified and no focus scope exists. This is hard ambiguity — ask the user.',
    defaultSeverity: 'hard',
    appliesWhen: 'No explicit scope and no focus scope available',
    strategy: 'ask_user',
    examples: [
      {
        utterance: 'Make it brighter',
        ambiguousSpan: '(entire utterance — no scope, no focus)',
        interpretations: [
          'Apply globally (entire project)',
          'Apply to a specific section (which one?)',
        ],
        expectedStrategy: 'ask_user',
        expectedSeverity: 'hard',
      },
    ],
    userOverridable: false,
    priority: 76,
  },

  // ===== Presupposition Ambiguity =====
  {
    id: 'amb:presup:again_no_antecedent',
    name: '"Again" Without Antecedent',
    kind: 'presupposition',
    description: '"Again" presupposes a prior similar edit. If no such edit exists, the presupposition fails. Ask the user what they mean.',
    defaultSeverity: 'hard',
    appliesWhen: '"again" or "do that again" used but no matching prior edit in history',
    strategy: 'ask_user',
    examples: [
      {
        utterance: 'Do that again but bigger',
        ambiguousSpan: 'that again',
        interpretations: [
          'No prior edit matches — what should be repeated?',
        ],
        expectedStrategy: 'ask_user',
        expectedSeverity: 'hard',
      },
    ],
    userOverridable: false,
    priority: 92,
  },
  {
    id: 'amb:presup:again_clear',
    name: '"Again" with Clear Antecedent',
    kind: 'presupposition',
    description: '"Again" has a clear prior edit as antecedent. Apply with notification.',
    defaultSeverity: 'soft',
    appliesWhen: '"again" used and a unique recent edit matches the pattern',
    strategy: 'apply_default',
    examples: [
      {
        utterance: 'Do that again but bigger',
        ambiguousSpan: 'that again',
        interpretations: [
          'Repeat last edit (increase brightness in Chorus 2) with larger amount',
        ],
        expectedStrategy: 'apply_default',
        expectedSeverity: 'soft',
      },
    ],
    userOverridable: false,
    priority: 93,
  },

  // ===== Temporal Ambiguity =====
  {
    id: 'amb:temporal:earlier_later',
    name: 'Temporal Macro vs Micro',
    kind: 'temporal',
    description: '"Earlier" or "later" can refer to position in song form (macro) or timing within a bar (micro). Always ask.',
    defaultSeverity: 'hard',
    appliesWhen: '"earlier" or "later" used without explicit song-form or bar-level context',
    strategy: 'ask_user',
    examples: [
      {
        utterance: 'Bring it in earlier',
        ambiguousSpan: 'earlier',
        interpretations: [
          'Earlier in the song form (move entry to an earlier section)',
          'Earlier within the bar (shift timing by beats/ticks)',
        ],
        expectedStrategy: 'ask_user',
        expectedSeverity: 'hard',
      },
    ],
    userOverridable: false,
    priority: 88,
  },

  // ===== Ellipsis Ambiguity =====
  {
    id: 'amb:ellipsis:same_but',
    name: '"Same But" Ellipsis',
    kind: 'ellipsis',
    description: '"Same but X" requires a prior plan/edit as the base. If multiple recent edits could serve, ask.',
    defaultSeverity: 'soft',
    appliesWhen: '"same but" used and a unique recent edit exists',
    strategy: 'apply_default',
    examples: [
      {
        utterance: 'Same but louder',
        ambiguousSpan: 'same',
        interpretations: [
          'Last edit (brightness increase) as base, with added volume increase',
        ],
        expectedStrategy: 'apply_default',
        expectedSeverity: 'soft',
      },
    ],
    userOverridable: false,
    priority: 82,
  },

  // ===== Coordination Scope Ambiguity =====
  {
    id: 'amb:coord:and_scope',
    name: '"And" Scope',
    kind: 'coordination_scope',
    description: '"X and Y" might coordinate goals within one scope or separate goals with separate scopes. Prefer shared scope unless explicit contrast markers exist.',
    defaultSeverity: 'soft',
    appliesWhen: '"and" coordinates two goals without explicit scope markers',
    strategy: 'apply_default',
    examples: [
      {
        utterance: 'Make it brighter and wider',
        ambiguousSpan: 'and',
        interpretations: [
          'Both brightness and width applied to the same scope (default)',
        ],
        expectedStrategy: 'apply_default',
        expectedSeverity: 'soft',
      },
    ],
    userOverridable: false,
    priority: 72,
  },

  // ===== Entity Type / Metonymy Ambiguity =====
  {
    id: 'amb:metonymy:section_as_content',
    name: 'Section Name as Content Reference',
    kind: 'metonymy',
    description: '"The chorus" might refer to the section (as a time range), the harmonic content, or the arrangement. If the operation disambiguates, resolve silently.',
    defaultSeverity: 'soft',
    appliesWhen: 'Section name used with an operation that constrains interpretation',
    strategy: 'narrow_by_context',
    examples: [
      {
        utterance: 'Make the chorus brighter',
        ambiguousSpan: 'the chorus',
        interpretations: [
          'Chorus section as a scope (change events in that time range)',
        ],
        expectedStrategy: 'narrow_by_context',
        expectedSeverity: 'soft',
      },
      {
        utterance: 'Keep the chorus chords',
        ambiguousSpan: 'the chorus',
        interpretations: [
          'Chorus harmonic content (preserve chord events in chorus)',
        ],
        expectedStrategy: 'narrow_by_context',
        expectedSeverity: 'soft',
      },
    ],
    userOverridable: false,
    priority: 78,
  },
] as const;

// =============================================================================
// Ambiguity Policy Engine
// =============================================================================

/**
 * An ambiguity record: describes a single detected ambiguity.
 */
export interface AmbiguityRecord {
  /** Unique identifier */
  readonly id: string;

  /** The kind of ambiguity */
  readonly kind: AmbiguityKind;

  /** The severity classification */
  readonly severity: AmbiguitySeverity;

  /** The source span in the original utterance */
  readonly sourceSpan: TextSpan;

  /** The competing interpretations */
  readonly candidates: readonly AmbiguityCandidate[];

  /** The recommended resolution strategy */
  readonly strategy: ResolutionStrategy;

  /** Which policy rule was applied */
  readonly ruleId: string;

  /** The associated CPL hole (if one was created) */
  readonly holeId: string | undefined;

  /** Material difference assessment */
  readonly materialDifference: MaterialDifferenceResult;
}

/**
 * A candidate interpretation for an ambiguity.
 */
export interface AmbiguityCandidate {
  /** Index */
  readonly index: number;

  /** Human-readable label */
  readonly label: string;

  /** Description of the interpretation */
  readonly description: string;

  /** What CPL node this would produce */
  readonly cplEffect: string;

  /** Confidence score (if contextual narrowing was applied) */
  readonly confidence: number;

  /** Whether this is the default */
  readonly isDefault: boolean;
}

/**
 * Result of running the ambiguity policy on a CPL-Intent.
 */
export interface AmbiguityPolicyResult {
  /** All detected ambiguities */
  readonly ambiguities: readonly AmbiguityRecord[];

  /** Hard ambiguities that MUST be resolved */
  readonly hardAmbiguities: readonly AmbiguityRecord[];

  /** Soft ambiguities with safe defaults */
  readonly softAmbiguities: readonly AmbiguityRecord[];

  /** Cosmetic ambiguities (resolved silently) */
  readonly cosmeticAmbiguities: readonly AmbiguityRecord[];

  /** Whether execution is blocked (hard ambiguities exist) */
  readonly executionBlocked: boolean;

  /** Generated clarification questions (from hard ambiguities) */
  readonly questions: readonly ClarificationQuestion[];

  /** Defaults that were applied (from soft ambiguities) */
  readonly appliedDefaults: readonly AppliedDefault[];

  /** Policy trace for debugging */
  readonly policyTrace: readonly PolicyTraceEntry[];
}

/**
 * A default that was applied by the policy.
 */
export interface AppliedDefault {
  /** Which ambiguity record */
  readonly ambiguityId: string;

  /** What was defaulted */
  readonly description: string;

  /** The default value used */
  readonly defaultValue: string;

  /** Why this default is safe */
  readonly safetyReason: string;

  /** Provenance tag */
  readonly provenanceTag: string;

  /** Whether the user was notified */
  readonly userNotified: boolean;
}

/**
 * A trace entry from the ambiguity policy engine.
 */
export interface PolicyTraceEntry {
  /** Which rule was evaluated */
  readonly ruleId: string;

  /** Whether the rule matched */
  readonly matched: boolean;

  /** The ambiguity it produced (if matched) */
  readonly ambiguityId: string | undefined;

  /** The severity assigned */
  readonly severity: AmbiguitySeverity | undefined;

  /** The strategy chosen */
  readonly strategy: string | undefined;

  /** Why this rule was chosen or skipped */
  readonly reason: string;
}

// =============================================================================
// Resolution Protocol
// =============================================================================

/**
 * The resolution protocol defines how the system and user collaborate
 * to resolve ambiguities.
 *
 * This is the formal contract for the clarification interaction.
 */
export interface ResolutionProtocol {
  /**
   * Phase 1: Detection
   * Run ambiguity policy on CPL-Intent to produce AmbiguityPolicyResult.
   */
  detect(intent: CPLIntent): AmbiguityPolicyResult;

  /**
   * Phase 2: Question Generation
   * From hard ambiguities, generate clarification questions.
   * Questions are ordered by:
   *   1. Priority (higher priority rules first)
   *   2. Structural order (earlier in utterance first)
   *   3. Impact (questions that affect more of the plan first)
   */
  generateQuestions(ambiguities: readonly AmbiguityRecord[]): readonly ClarificationQuestion[];

  /**
   * Phase 3: Batch Optimization
   * Combine related ambiguities into fewer questions when possible.
   * E.g., if "darker" and "warmer" are both ambiguous, one question
   * about "timbral vs harmonic interpretation" may suffice.
   */
  batchQuestions(questions: readonly ClarificationQuestion[]): readonly ClarificationQuestion[];

  /**
   * Phase 4: Resolution
   * Apply a user's answer to resolve one or more holes.
   * Returns the updated intent and remaining ambiguities.
   */
  resolve(
    intent: CPLIntent,
    questionId: string,
    selectedOptionIndex: number,
    remaining: readonly AmbiguityRecord[]
  ): ResolutionResult;

  /**
   * Phase 5: Default Application
   * Apply all soft defaults to the intent.
   * Returns the updated intent with defaults applied.
   */
  applyDefaults(
    intent: CPLIntent,
    softAmbiguities: readonly AmbiguityRecord[]
  ): DefaultApplicationResult;
}

/**
 * Result of resolving an ambiguity.
 */
export interface ResolutionResult {
  /** Updated intent with the hole filled */
  readonly updatedIntent: CPLIntent;

  /** Remaining ambiguities */
  readonly remainingAmbiguities: readonly AmbiguityRecord[];

  /** Whether all hard ambiguities are now resolved */
  readonly allHardResolved: boolean;

  /** Side effects of the resolution (e.g., other holes that were resolved) */
  readonly sideEffects: readonly string[];
}

/**
 * Result of applying defaults.
 */
export interface DefaultApplicationResult {
  /** Updated intent with defaults applied */
  readonly updatedIntent: CPLIntent;

  /** Which defaults were applied */
  readonly appliedDefaults: readonly AppliedDefault[];

  /** User-facing notification about applied defaults */
  readonly notifications: readonly DefaultNotification[];
}

/**
 * Notification about an applied default.
 */
export interface DefaultNotification {
  /** What was defaulted */
  readonly what: string;

  /** The default that was applied */
  readonly appliedDefault: string;

  /** How to change it */
  readonly howToOverride: string;
}

// =============================================================================
// Execution Gate
// =============================================================================

/**
 * The execution gate is the final check before planning/execution.
 * It ensures the Silent Ambiguity Prohibition is enforced.
 */
export interface ExecutionGate {
  /**
   * Check whether the intent is ready for planning.
   *
   * Returns 'ready' if all hard holes are resolved.
   * Returns 'blocked' with reasons if hard holes remain.
   */
  check(intent: CPLIntent, policyResult: AmbiguityPolicyResult): ExecutionGateResult;
}

/**
 * Result of the execution gate check.
 */
export type ExecutionGateResult =
  | { readonly type: 'ready'; readonly appliedDefaults: readonly AppliedDefault[] }
  | { readonly type: 'blocked'; readonly reasons: readonly ExecutionBlockReason[] };

/**
 * A reason why execution is blocked.
 */
export interface ExecutionBlockReason {
  /** The unresolved ambiguity */
  readonly ambiguityId: string;

  /** Human-readable description */
  readonly description: string;

  /** What the user needs to do */
  readonly requiredAction: string;

  /** Source span */
  readonly sourceSpan: TextSpan;
}

// =============================================================================
// Default Policy Functions
// =============================================================================

/**
 * Look up the applicable rule for a given ambiguity.
 */
export function findApplicableRule(
  kind: AmbiguityKind,
  context: AmbiguityRuleContext
): AmbiguityPolicyRule | undefined {
  // Sort by priority (descending) to get most specific first
  const sorted = [...CORE_AMBIGUITY_RULES]
    .filter(rule => rule.kind === kind)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    if (evaluateRuleCondition(rule, context)) {
      return rule;
    }
  }

  return undefined;
}

/**
 * Context for evaluating ambiguity rule conditions.
 */
export interface AmbiguityRuleContext {
  /** Number of candidate interpretations */
  readonly candidateCount: number;

  /** Whether user preferences exist for this term */
  readonly hasUserPreference: boolean;

  /** Whether a UI selection is active */
  readonly hasUISelection: boolean;

  /** Whether a focus scope exists in dialogue state */
  readonly hasFocusScope: boolean;

  /** Salience gap between top two candidates */
  readonly salienceGap: number;

  /** Whether a prior edit exists as antecedent */
  readonly hasPriorEditAntecedent: boolean;

  /** Number of matching entities in the project */
  readonly matchingEntityCount: number;
}

/**
 * Evaluate whether a rule's condition is met.
 * This is a simplified evaluator — real implementation would be more
 * sophisticated, but the structure is stable.
 */
function evaluateRuleCondition(
  rule: AmbiguityPolicyRule,
  context: AmbiguityRuleContext
): boolean {
  switch (rule.id) {
    case 'amb:lexical:vague_adjective_with_pref':
      return context.hasUserPreference;
    case 'amb:lexical:vague_adjective':
      return !context.hasUserPreference && context.candidateCount >= 2;
    case 'amb:scope:single_match':
      return context.matchingEntityCount === 1;
    case 'amb:scope:modifier_attachment':
      return context.matchingEntityCount > 1;
    case 'amb:ref:pronoun_clear_salience':
      return context.salienceGap > 0.3;
    case 'amb:ref:pronoun_multiple_antecedents':
      return context.salienceGap <= 0.3 && context.candidateCount >= 2;
    case 'amb:ref:deictic_no_selection':
      return !context.hasUISelection;
    case 'amb:degree:unspecified_amount':
      return true; // always applies when amount is missing
    case 'amb:quant:all_vs_type':
      return context.matchingEntityCount >= 2;
    case 'amb:prag:implicit_scope':
      return context.hasFocusScope;
    case 'amb:prag:no_focus_no_scope':
      return !context.hasFocusScope;
    case 'amb:presup:again_clear':
      return context.hasPriorEditAntecedent;
    case 'amb:presup:again_no_antecedent':
      return !context.hasPriorEditAntecedent;
    case 'amb:temporal:earlier_later':
      return true; // always ask for temporal
    case 'amb:ellipsis:same_but':
      return context.hasPriorEditAntecedent;
    case 'amb:coord:and_scope':
      return true; // default to shared scope
    case 'amb:metonymy:section_as_content':
      return true; // narrow by operation type
    default:
      return context.candidateCount >= 2;
  }
}

/**
 * Classify the severity of an ambiguity based on its candidates.
 */
export function classifyAmbiguitySeverity(
  kind: AmbiguityKind,
  candidates: readonly AmbiguityCandidate[],
  context: AmbiguityRuleContext
): SeverityClassification {
  const rule = findApplicableRule(kind, context);

  if (!rule) {
    // No rule found — default to hard if multiple candidates
    return {
      kind,
      severity: candidates.length >= 2 ? 'hard' : 'cosmetic',
      reason: 'No specific policy rule found; defaulting to safe behavior',
      materialDifference: {
        differs: candidates.length >= 2,
        differenceDescription: candidates.length >= 2
          ? 'Multiple interpretations with unknown effect difference'
          : undefined,
        significance: candidates.length >= 2 ? 'major' : 'none',
        reversible: true,
      },
    };
  }

  return {
    kind,
    severity: rule.defaultSeverity,
    reason: rule.description,
    materialDifference: {
      differs: rule.defaultSeverity !== 'cosmetic',
      differenceDescription: rule.defaultSeverity !== 'cosmetic'
        ? `Ambiguity kind "${kind}" produces materially different edits`
        : undefined,
      significance: rule.defaultSeverity === 'hard' ? 'major'
        : rule.defaultSeverity === 'soft' ? 'minor' : 'none',
      reversible: true,
    },
  };
}

/**
 * Check whether an intent has any unresolved hard holes.
 */
export function hasUnresolvedHardHoles(
  holes: readonly CPLHole[]
): boolean {
  return holes.some(hole => hole.requiresClarification);
}

/**
 * Count holes by severity.
 */
export function countHolesBySeverity(
  holes: readonly CPLHole[]
): { readonly hard: number; readonly soft: number; readonly total: number } {
  let hard = 0;
  let soft = 0;
  for (const hole of holes) {
    if (hole.requiresClarification) {
      hard++;
    } else {
      soft++;
    }
  }
  return { hard, soft, total: holes.length };
}
