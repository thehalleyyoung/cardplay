/**
 * GOFAI NL Grammar — Reference Expressions
 *
 * Implements grammar rules for reference expressions that produce
 * unresolved referents. These referents are later resolved by the
 * pragmatics layer using salience, UI focus, recency, and discourse
 * context.
 *
 * ## Reference Types
 *
 * 1. **Personal pronouns**: "it", "them", "they"
 * 2. **Demonstrative pronouns**: "this", "that", "these", "those"
 * 3. **Demonstrative determiners**: "this section", "that track"
 * 4. **Anaphoric references**: "the same", "same as before", "the one"
 * 5. **Definite descriptions**: "the chorus", "the drums", "the melody"
 * 6. **Relative references**: "the previous", "the next", "the last"
 * 7. **Deictic references**: "here", "there" (UI-selection-dependent)
 * 8. **Reflexive references**: "itself", "themselves"
 * 9. **Possessive references**: "its", "their", "my" (for user preferences)
 * 10. **Identity references**: "the same one", "another one", "a different one"
 * 11. **Cataphoric references**: "the following", "what comes next"
 * 12. **Bridging references**: "the beginning" (of contextually salient entity)
 *
 * ## Design
 *
 * Reference expressions produce `UnresolvedRef` nodes. Each node
 * carries:
 * - The referent type (pronoun, demonstrative, definite, etc.)
 * - Constraints on what it can refer to (number, animacy, entity type)
 * - The original span for provenance
 * - A resolution strategy hint (salience, focus, recency, selection)
 *
 * The pragmatics layer (Step 201+) resolves these references using
 * dialogue state, UI selection context, and entity salience scores.
 *
 * ## Safety
 *
 * Unresolved references that cannot be resolved must become CPL holes
 * (not silently bound to wrong entities). The system must ask a
 * clarification question rather than guessing.
 *
 * @module gofai/nl/grammar/reference-expressions
 * @see gofai_goalA.md Step 116
 * @see gofai_goalA.md Step 072 (deictic resolution)
 * @see gofai_goalA.md Step 093 (demonstrative resolution)
 */

import type { Span } from '../tokenizer/span-tokenizer';

// =============================================================================
// UNRESOLVED REFERENT — output of reference expression parsing
// =============================================================================

/**
 * An unresolved referent: a placeholder that must be bound by
 * pragmatics before CPL can be fully formed.
 *
 * Each UnresolvedRef carries enough information for the pragmatics
 * layer to resolve it or generate a clarification question.
 */
export interface UnresolvedRef {
  /** Unique ID for this referent within a parse (for tracking) */
  readonly refId: string;

  /** The kind of reference expression */
  readonly kind: ReferenceKind;

  /** Number: singular, plural, or unspecified */
  readonly number: GrammaticalNumber;

  /** What entity types this ref can bind to (empty = any) */
  readonly entityTypeConstraints: readonly ReferentEntityType[];

  /** Resolution strategy hints (ordered by preference) */
  readonly resolutionHints: readonly ResolutionHint[];

  /** The surface text of the reference expression */
  readonly surface: string;

  /** Span in the original input */
  readonly span: Span;

  /** Additional constraints on the referent */
  readonly constraints: readonly ReferentConstraint[];

  /** Whether this reference is obligatory (must be resolved) */
  readonly obligatory: boolean;

  /** Whether this reference requires UI selection context */
  readonly requiresSelection: boolean;

  /** The head noun if this is a modified reference (e.g., "this section" → "section") */
  readonly headNoun: string | undefined;

  /** Descriptive modifiers (e.g., "the bright one" → ["bright"]) */
  readonly modifiers: readonly string[];

  /** Confidence in the reference parse */
  readonly confidence: number;

  /** Warnings about the reference */
  readonly warnings: readonly ReferenceWarning[];
}

// =============================================================================
// REFERENCE KINDS — what type of reference expression is this?
// =============================================================================

/**
 * Kinds of reference expressions.
 */
export type ReferenceKind =
  // Pronouns
  | 'personal_pronoun'         // "it", "them", "they"
  | 'demonstrative_pronoun'    // "this", "that" (standalone)
  | 'demonstrative_determiner' // "this section", "that track"
  | 'reflexive_pronoun'        // "itself"
  | 'possessive_pronoun'       // "its", "their"
  | 'relative_pronoun'         // "which", "that" (as relative clause head)

  // Anaphoric / Identity
  | 'anaphoric_same'           // "the same", "same as before"
  | 'anaphoric_other'          // "another", "a different one"
  | 'anaphoric_identity'       // "the one that..."

  // Definite descriptions
  | 'definite_description'     // "the chorus", "the drums"
  | 'definite_superlative'     // "the loudest track", "the first chorus"
  | 'definite_ordinal'         // "the second verse", "the third chorus"

  // Relative / Sequential
  | 'relative_previous'        // "the previous", "the last one"
  | 'relative_next'            // "the next", "the following"
  | 'relative_current'         // "the current", "this one"

  // Deictic (selection-dependent)
  | 'deictic_here'             // "here" (spatial in UI)
  | 'deictic_there'            // "there" (elsewhere in UI)
  | 'deictic_now'              // "now" (temporal context)

  // Bridging / Discourse
  | 'bridging'                 // "the beginning" (of salient entity)
  | 'cataphoric'               // "the following", "what comes next"

  // Special
  | 'everything'               // "everything", "all of it"
  | 'nothing'                  // "nothing", "none of it"
  | 'generic';                 // "one" as generic ("one could...")

// =============================================================================
// GRAMMATICAL FEATURES
// =============================================================================

/**
 * Grammatical number.
 */
export type GrammaticalNumber = 'singular' | 'plural' | 'unspecified';

/**
 * Entity types that a referent can bind to.
 * These mirror EntityType from canon/types.ts but are strings
 * to allow extension-defined entity types.
 */
export type ReferentEntityType =
  | 'section'
  | 'layer'
  | 'card'
  | 'param'
  | 'event'
  | 'track'
  | 'note'
  | 'range'
  | 'deck'
  | 'board'
  | 'effect'
  | 'instrument'
  | 'musical_object'
  | 'axis'
  | 'any';

/**
 * Resolution strategy hints: ordered preferences for how to resolve.
 */
export type ResolutionHint =
  | 'ui_selection'     // Resolve from current UI selection
  | 'salience'         // Resolve from most salient entity
  | 'recency'          // Resolve from most recently mentioned
  | 'ui_focus'         // Resolve from UI focus (keyboard/mouse)
  | 'dialogue_topic'   // Resolve from current dialogue topic
  | 'prior_edit'       // Resolve from last edit target
  | 'prior_plan'       // Resolve from last plan
  | 'structural'       // Resolve by structural analysis (definite descriptions)
  | 'name_match'       // Resolve by name matching
  | 'role_match'       // Resolve by musical role matching
  | 'description_match'// Resolve by descriptive properties
  | 'ordinal'          // Resolve by ordinal position
  | 'superlative';     // Resolve by extremal property

// =============================================================================
// REFERENT CONSTRAINTS — what conditions must the referent satisfy?
// =============================================================================

/**
 * A constraint on what entity a referent can bind to.
 */
export interface ReferentConstraint {
  /** The type of constraint */
  readonly type: ReferentConstraintType;

  /** The constraint value */
  readonly value: string;

  /** Whether this constraint is hard (must) or soft (prefer) */
  readonly hardness: 'hard' | 'soft';

  /** Description */
  readonly description: string;
}

/**
 * Types of constraints on referent binding.
 */
export type ReferentConstraintType =
  | 'entity_type'     // Must be a specific entity type
  | 'number'          // Must match singular/plural
  | 'role'            // Must have a specific musical role
  | 'property'        // Must have a specific property ("the bright one")
  | 'ordinal'         // Must be Nth in a sequence
  | 'superlative'     // Must be extremal ("the loudest")
  | 'recency'         // Must be recently mentioned/edited
  | 'identity'        // Must be same/different as prior referent
  | 'location'        // Must be in a specific section/range
  | 'name'            // Must have a specific name/label
  | 'negation';       // Must NOT be something ("not that one")

// =============================================================================
// REFERENCE WARNINGS
// =============================================================================

/**
 * Warning about a reference parse.
 */
export interface ReferenceWarning {
  readonly code: ReferenceWarningCode;
  readonly message: string;
  readonly span: Span;
}

/**
 * Warning codes for reference parsing.
 */
export type ReferenceWarningCode =
  | 'ambiguous_referent'           // Multiple possible bindings
  | 'missing_antecedent'           // No prior entity to refer to
  | 'number_mismatch'             // Singular referent, plural context
  | 'deictic_without_selection'   // "this" without UI selection
  | 'cataphoric_unresolvable'     // Forward reference can't be resolved
  | 'reflexive_without_subject'   // "itself" without clear antecedent
  | 'possessive_ambiguous'        // "its" could refer to multiple entities
  | 'generic_possible'            // Could be generic "one" instead of referential
  | 'bridging_inference_needed'   // Need to infer bridging relation
  | 'superlative_no_comparison'   // "the loudest" but no comparison set
  | 'ordinal_out_of_range';       // "the fifth chorus" but only 3 choruses

// =============================================================================
// PRONOUN LEXICON — all recognized pronouns with features
// =============================================================================

/**
 * A pronoun entry in the lexicon.
 */
export interface PronounEntry {
  /** Surface forms (lowercase) */
  readonly forms: readonly string[];

  /** The reference kind */
  readonly kind: ReferenceKind;

  /** Grammatical number */
  readonly number: GrammaticalNumber;

  /** Resolution hints for this pronoun type */
  readonly resolutionHints: readonly ResolutionHint[];

  /** Whether this requires UI selection */
  readonly requiresSelection: boolean;

  /** Whether this is obligatory (must resolve for command to execute) */
  readonly obligatory: boolean;

  /** Entity type constraints (empty = any) */
  readonly entityTypes: readonly ReferentEntityType[];

  /** Examples */
  readonly examples: readonly string[];

  /** Description */
  readonly description: string;
}

/**
 * All recognized pronoun entries.
 */
export const PRONOUN_ENTRIES: readonly PronounEntry[] = [
  // ---------------------------------------------------------------------------
  // Personal pronouns (3rd person — used to refer to entities)
  // ---------------------------------------------------------------------------
  {
    forms: ['it'],
    kind: 'personal_pronoun',
    number: 'singular',
    resolutionHints: ['salience', 'recency', 'dialogue_topic', 'ui_focus'],
    requiresSelection: false,
    obligatory: true,
    entityTypes: [],
    examples: ['make it brighter', 'remove it', 'play it back'],
    description: 'Singular 3rd person pronoun: refers to the most salient entity',
  },
  {
    forms: ['them', 'they'],
    kind: 'personal_pronoun',
    number: 'plural',
    resolutionHints: ['salience', 'recency', 'dialogue_topic'],
    requiresSelection: false,
    obligatory: true,
    entityTypes: [],
    examples: ['make them quieter', 'remove them'],
    description: 'Plural 3rd person pronoun: refers to a salient group',
  },

  // ---------------------------------------------------------------------------
  // Demonstrative pronouns (standalone — no following noun)
  // ---------------------------------------------------------------------------
  {
    forms: ['this'],
    kind: 'demonstrative_pronoun',
    number: 'singular',
    resolutionHints: ['ui_selection', 'ui_focus', 'salience', 'recency'],
    requiresSelection: true,
    obligatory: true,
    entityTypes: [],
    examples: ['make this louder', 'copy this', 'what is this?'],
    description: 'Proximal singular demonstrative: refers to UI selection or focus',
  },
  {
    forms: ['that'],
    kind: 'demonstrative_pronoun',
    number: 'singular',
    resolutionHints: ['recency', 'salience', 'prior_edit', 'ui_focus'],
    requiresSelection: false,
    obligatory: true,
    entityTypes: [],
    examples: ['undo that', 'make that brighter', 'do that again'],
    description: 'Distal singular demonstrative: refers to recent/salient entity',
  },
  {
    forms: ['these'],
    kind: 'demonstrative_pronoun',
    number: 'plural',
    resolutionHints: ['ui_selection', 'ui_focus', 'salience'],
    requiresSelection: true,
    obligatory: true,
    entityTypes: [],
    examples: ['delete these', 'make these louder', 'move these'],
    description: 'Proximal plural demonstrative: refers to UI multi-selection',
  },
  {
    forms: ['those'],
    kind: 'demonstrative_pronoun',
    number: 'plural',
    resolutionHints: ['recency', 'salience', 'prior_edit'],
    requiresSelection: false,
    obligatory: true,
    entityTypes: [],
    examples: ['remove those', 'keep those', 'make those warmer'],
    description: 'Distal plural demonstrative: refers to recent/salient group',
  },

  // ---------------------------------------------------------------------------
  // Reflexive pronouns
  // ---------------------------------------------------------------------------
  {
    forms: ['itself'],
    kind: 'reflexive_pronoun',
    number: 'singular',
    resolutionHints: ['salience', 'recency'],
    requiresSelection: false,
    obligatory: true,
    entityTypes: [],
    examples: ['let it resolve itself', 'the track itself'],
    description: 'Reflexive singular: co-referent with the subject',
  },
  {
    forms: ['themselves'],
    kind: 'reflexive_pronoun',
    number: 'plural',
    resolutionHints: ['salience', 'recency'],
    requiresSelection: false,
    obligatory: true,
    entityTypes: [],
    examples: ['let them resolve themselves'],
    description: 'Reflexive plural: co-referent with plural subject',
  },

  // ---------------------------------------------------------------------------
  // Possessive pronouns (determine whose entity)
  // ---------------------------------------------------------------------------
  {
    forms: ['its'],
    kind: 'possessive_pronoun',
    number: 'singular',
    resolutionHints: ['salience', 'recency', 'dialogue_topic'],
    requiresSelection: false,
    obligatory: true,
    entityTypes: [],
    examples: ['change its tempo', 'adjust its volume', 'keep its rhythm'],
    description: 'Possessive singular: property of the salient entity',
  },
  {
    forms: ['their'],
    kind: 'possessive_pronoun',
    number: 'plural',
    resolutionHints: ['salience', 'recency', 'dialogue_topic'],
    requiresSelection: false,
    obligatory: true,
    entityTypes: [],
    examples: ['change their volume', 'adjust their timing'],
    description: 'Possessive plural: property of a salient group',
  },
  {
    forms: ['my'],
    kind: 'possessive_pronoun',
    number: 'singular',
    resolutionHints: ['dialogue_topic', 'salience'],
    requiresSelection: false,
    obligatory: false,
    entityTypes: [],
    examples: ['in my project', 'my custom preset', 'my selection'],
    description: 'User-possessive: refers to user-owned entities',
  },

  // ---------------------------------------------------------------------------
  // Deictic references (UI-location-dependent)
  // ---------------------------------------------------------------------------
  {
    forms: ['here'],
    kind: 'deictic_here',
    number: 'unspecified',
    resolutionHints: ['ui_selection', 'ui_focus'],
    requiresSelection: true,
    obligatory: true,
    entityTypes: ['section', 'range'],
    examples: ['add reverb here', 'paste here', 'what is playing here?'],
    description: 'Proximal deictic: the current UI selection/cursor location',
  },
  {
    forms: ['there'],
    kind: 'deictic_there',
    number: 'unspecified',
    resolutionHints: ['recency', 'salience', 'ui_focus'],
    requiresSelection: false,
    obligatory: true,
    entityTypes: ['section', 'range'],
    examples: ['move it there', 'add a note there', 'what is there?'],
    description: 'Distal deictic: a previously indicated UI location',
  },
  {
    forms: ['now'],
    kind: 'deictic_now',
    number: 'unspecified',
    resolutionHints: ['ui_focus', 'ui_selection'],
    requiresSelection: false,
    obligatory: false,
    entityTypes: ['range'],
    examples: ['what is playing now?', 'change it now'],
    description: 'Temporal deictic: current playback position or editing context',
  },

  // ---------------------------------------------------------------------------
  // Everything / Nothing (universal/null referents)
  // ---------------------------------------------------------------------------
  {
    forms: ['everything', 'all of it', 'all of them', 'all'],
    kind: 'everything',
    number: 'plural',
    resolutionHints: ['dialogue_topic', 'salience'],
    requiresSelection: false,
    obligatory: false,
    entityTypes: [],
    examples: ['make everything louder', 'remove all of it', 'mute all'],
    description: 'Universal referent: all entities in current scope',
  },
  {
    forms: ['nothing', 'none of it', 'none of them', 'none'],
    kind: 'nothing',
    number: 'plural',
    resolutionHints: [],
    requiresSelection: false,
    obligatory: false,
    entityTypes: [],
    examples: ['change nothing', 'keep none of it'],
    description: 'Null referent: no entities',
  },
];

// =============================================================================
// ANAPHORIC EXPRESSION LEXICON — "the same", "another", etc.
// =============================================================================

/**
 * An anaphoric expression entry.
 */
export interface AnaphoricEntry {
  /** Surface forms (lowercase) */
  readonly forms: readonly string[];

  /** The reference kind */
  readonly kind: ReferenceKind;

  /** Whether this requires identity with a prior referent */
  readonly identityRelation: IdentityRelation;

  /** Number */
  readonly number: GrammaticalNumber;

  /** Resolution hints */
  readonly resolutionHints: readonly ResolutionHint[];

  /** Examples */
  readonly examples: readonly string[];

  /** Description */
  readonly description: string;
}

/**
 * Identity relation with prior referent.
 */
export type IdentityRelation =
  | 'same'        // Must be the same entity as the antecedent
  | 'different'   // Must be a different entity from the antecedent
  | 'similar'     // Must be similar (same type, different instance)
  | 'unspecified'; // No identity constraint

/**
 * All recognized anaphoric expressions.
 */
export const ANAPHORIC_ENTRIES: readonly AnaphoricEntry[] = [
  // --- Same / identical ---
  {
    forms: ['the same', 'the same one', 'that same'],
    kind: 'anaphoric_same',
    identityRelation: 'same',
    number: 'singular',
    resolutionHints: ['prior_edit', 'recency', 'dialogue_topic'],
    examples: ['use the same reverb', 'do the same thing', 'apply the same'],
    description: 'Same entity as previously mentioned/edited',
  },
  {
    forms: ['the same ones', 'those same'],
    kind: 'anaphoric_same',
    identityRelation: 'same',
    number: 'plural',
    resolutionHints: ['prior_edit', 'recency', 'dialogue_topic'],
    examples: ['use the same ones', 'apply to those same tracks'],
    description: 'Same entities as previously mentioned/edited (plural)',
  },
  {
    forms: ['same as before', 'like before', 'as before'],
    kind: 'anaphoric_same',
    identityRelation: 'same',
    number: 'unspecified',
    resolutionHints: ['prior_edit', 'prior_plan'],
    examples: ['same as before', 'do it like before', 'as before'],
    description: 'Same action/entity as a prior edit',
  },
  {
    forms: ['again', 'once more', 'one more time'],
    kind: 'anaphoric_same',
    identityRelation: 'same',
    number: 'unspecified',
    resolutionHints: ['prior_edit', 'prior_plan'],
    examples: ['do it again', 'boost it again', 'play it once more'],
    description: 'Repeat the previous action (presupposition trigger)',
  },

  // --- Different / another ---
  {
    forms: ['another', 'a different', 'a new', 'some other'],
    kind: 'anaphoric_other',
    identityRelation: 'different',
    number: 'singular',
    resolutionHints: ['salience', 'recency'],
    examples: ['try another reverb', 'use a different EQ', 'pick a new one'],
    description: 'A different entity of the same type',
  },
  {
    forms: ['other', 'the other', 'the other one'],
    kind: 'anaphoric_other',
    identityRelation: 'different',
    number: 'singular',
    resolutionHints: ['salience', 'recency'],
    examples: ['the other track', 'the other version', 'try the other one'],
    description: 'The other entity (implies exactly two candidates)',
  },
  {
    forms: ['the others', 'the other ones', 'the rest'],
    kind: 'anaphoric_other',
    identityRelation: 'different',
    number: 'plural',
    resolutionHints: ['salience', 'recency'],
    examples: ['mute the others', 'keep the rest', 'remove the other ones'],
    description: 'All entities except the currently salient one(s)',
  },

  // --- The one that... (identificational) ---
  {
    forms: ['the one', 'the one that', 'the one which'],
    kind: 'anaphoric_identity',
    identityRelation: 'unspecified',
    number: 'singular',
    resolutionHints: ['description_match', 'salience'],
    examples: ['the one with reverb', 'the one that was louder'],
    description: 'Entity identified by a following relative clause/description',
  },
  {
    forms: ['the ones', 'the ones that', 'the ones which'],
    kind: 'anaphoric_identity',
    identityRelation: 'unspecified',
    number: 'plural',
    resolutionHints: ['description_match', 'salience'],
    examples: ['the ones with effects', 'the ones that are too loud'],
    description: 'Entities identified by a following relative clause/description (plural)',
  },
];

// =============================================================================
// RELATIVE / SEQUENTIAL REFERENCE LEXICON
// =============================================================================

/**
 * A relative reference entry (previous, next, current, last, first, etc.).
 */
export interface RelativeRefEntry {
  /** Surface forms (lowercase) */
  readonly forms: readonly string[];

  /** Reference kind */
  readonly kind: ReferenceKind;

  /** The temporal/positional direction */
  readonly direction: RelativeDirection;

  /** Resolution hints */
  readonly resolutionHints: readonly ResolutionHint[];

  /** Examples */
  readonly examples: readonly string[];

  /** Description */
  readonly description: string;
}

/**
 * Direction of a relative reference.
 */
export type RelativeDirection =
  | 'previous'      // Before current position
  | 'next'          // After current position
  | 'current'       // At current position
  | 'first'         // First in sequence
  | 'last'          // Last in sequence
  | 'penultimate';  // Second to last

/**
 * All recognized relative reference expressions.
 */
export const RELATIVE_REF_ENTRIES: readonly RelativeRefEntry[] = [
  // --- Previous ---
  {
    forms: ['the previous', 'the preceding', 'the prior', 'the last'],
    kind: 'relative_previous',
    direction: 'previous',
    resolutionHints: ['recency', 'ordinal'],
    examples: ['the previous section', 'go back to the last one', 'the prior edit'],
    description: 'The entity before the current position in sequence',
  },
  {
    forms: ['the one before', 'the one before that', 'before this one'],
    kind: 'relative_previous',
    direction: 'previous',
    resolutionHints: ['recency', 'ordinal', 'salience'],
    examples: ['the one before', 'go to the one before that'],
    description: 'The entity preceding the currently referenced one',
  },

  // --- Next ---
  {
    forms: ['the next', 'the following', 'the subsequent'],
    kind: 'relative_next',
    direction: 'next',
    resolutionHints: ['ordinal', 'salience'],
    examples: ['the next section', 'in the following chorus', 'the subsequent bar'],
    description: 'The entity after the current position in sequence',
  },
  {
    forms: ['the one after', 'the one after that', 'after this one'],
    kind: 'relative_next',
    direction: 'next',
    resolutionHints: ['ordinal', 'salience'],
    examples: ['the one after', 'move to the one after that'],
    description: 'The entity following the currently referenced one',
  },
  {
    forms: ['what comes next', 'what follows'],
    kind: 'cataphoric',
    direction: 'next',
    resolutionHints: ['ordinal'],
    examples: ['what comes next?', 'show me what follows'],
    description: 'Forward-looking cataphoric reference',
  },

  // --- Current ---
  {
    forms: ['the current', 'the active', 'the selected'],
    kind: 'relative_current',
    direction: 'current',
    resolutionHints: ['ui_selection', 'ui_focus', 'dialogue_topic'],
    examples: ['the current section', 'the active track', 'the selected notes'],
    description: 'The currently active/selected entity',
  },
  {
    forms: ['this one', 'this here'],
    kind: 'relative_current',
    direction: 'current',
    resolutionHints: ['ui_selection', 'ui_focus'],
    examples: ['make this one louder', 'use this here'],
    description: 'Proximal deictic current referent',
  },

  // --- First / Last ---
  {
    forms: ['the first', 'the very first', 'the opening'],
    kind: 'relative_current',
    direction: 'first',
    resolutionHints: ['ordinal'],
    examples: ['the first chorus', 'the very first note', 'the opening bar'],
    description: 'The first entity in a sequence',
  },
  {
    forms: ['the last', 'the very last', 'the final', 'the closing', 'the ending'],
    kind: 'relative_current',
    direction: 'last',
    resolutionHints: ['ordinal'],
    examples: ['the last chorus', 'the very last bar', 'the final note'],
    description: 'The last entity in a sequence',
  },
  {
    forms: ['the second to last', 'the penultimate', 'the second-to-last'],
    kind: 'relative_current',
    direction: 'penultimate',
    resolutionHints: ['ordinal'],
    examples: ['the second to last bar', 'the penultimate section'],
    description: 'The entity before the last in a sequence',
  },
];

// =============================================================================
// BRIDGING REFERENCE LEXICON — references that require inference
// =============================================================================

/**
 * A bridging reference entry.
 *
 * Bridging references refer to a part of a contextually salient entity:
 * "the beginning" (of what?), "the end" (of what?), "the top" (of what?).
 *
 * These require inferring the bridging relation from context.
 */
export interface BridgingRefEntry {
  /** Surface forms */
  readonly forms: readonly string[];

  /** The part relation */
  readonly partRelation: PartRelation;

  /** What entity types this can be part of */
  readonly parentEntityTypes: readonly ReferentEntityType[];

  /** Examples */
  readonly examples: readonly string[];

  /** Description */
  readonly description: string;
}

/**
 * Part-whole relations for bridging references.
 */
export type PartRelation =
  | 'beginning'     // Temporal start
  | 'end'           // Temporal end
  | 'middle'        // Temporal middle
  | 'top'           // Highest (pitch/register/stack)
  | 'bottom'        // Lowest (pitch/register/stack)
  | 'start'         // Start point
  | 'finish'        // End point
  | 'peak'          // Climax
  | 'trough'        // Lowest point
  | 'body'          // Main content (excluding intro/outro)
  | 'tail'          // Ending portion (reverb tail, decay)
  | 'head';         // Starting portion (attack, transient)

/**
 * All recognized bridging reference expressions.
 */
export const BRIDGING_REF_ENTRIES: readonly BridgingRefEntry[] = [
  {
    forms: ['the beginning', 'the start', 'the opening'],
    partRelation: 'beginning',
    parentEntityTypes: ['section', 'range', 'musical_object'],
    examples: ['at the beginning', 'from the start', 'the opening of the chorus'],
    description: 'Temporal start of a contextually salient entity',
  },
  {
    forms: ['the end', 'the ending', 'the close', 'the closing'],
    partRelation: 'end',
    parentEntityTypes: ['section', 'range', 'musical_object'],
    examples: ['at the end', 'before the ending', 'the close of the verse'],
    description: 'Temporal end of a contextually salient entity',
  },
  {
    forms: ['the middle', 'the center', 'the midpoint'],
    partRelation: 'middle',
    parentEntityTypes: ['section', 'range'],
    examples: ['in the middle', 'at the center of the chorus'],
    description: 'Temporal middle of a contextually salient entity',
  },
  {
    forms: ['the top', 'the upper part', 'the high end'],
    partRelation: 'top',
    parentEntityTypes: ['layer', 'track'],
    examples: ['at the top', 'the upper part of the mix', 'boost the top'],
    description: 'Upper register or top of a structure',
  },
  {
    forms: ['the bottom', 'the lower part', 'the low end'],
    partRelation: 'bottom',
    parentEntityTypes: ['layer', 'track'],
    examples: ['at the bottom', 'the low end of the mix', 'boost the bottom'],
    description: 'Lower register or bottom of a structure',
  },
  {
    forms: ['the peak', 'the climax', 'the high point', 'the apex'],
    partRelation: 'peak',
    parentEntityTypes: ['section', 'range', 'musical_object'],
    examples: ['at the peak', 'before the climax'],
    description: 'The point of highest intensity',
  },
  {
    forms: ['the tail', 'the decay', 'the release'],
    partRelation: 'tail',
    parentEntityTypes: ['effect', 'musical_object', 'note'],
    examples: ['shorten the tail', 'extend the decay', 'adjust the release'],
    description: 'The ending/decay portion of a sound',
  },
  {
    forms: ['the attack', 'the transient', 'the onset'],
    partRelation: 'head',
    parentEntityTypes: ['effect', 'musical_object', 'note'],
    examples: ['soften the attack', 'sharpen the transient', 'at the onset'],
    description: 'The beginning/attack portion of a sound',
  },
  {
    forms: ['the body', 'the sustain', 'the main part'],
    partRelation: 'body',
    parentEntityTypes: ['musical_object', 'section', 'note'],
    examples: ['thin out the body', 'boost the sustain', 'the main part of the song'],
    description: 'The main content between attack and release',
  },
];

// =============================================================================
// DEFINITE DESCRIPTION PATTERNS
// =============================================================================

/**
 * Patterns for definite descriptions that require resolution.
 *
 * A definite description is "the X" where X is a noun or modified noun
 * that uniquely identifies an entity. If multiple entities match,
 * clarification is required.
 */
export interface DefiniteDescriptionPattern {
  /** Pattern name */
  readonly name: string;

  /** The pattern structure */
  readonly pattern: DefiniteDescriptionStructure;

  /** Reference kind produced */
  readonly kind: ReferenceKind;

  /** Examples */
  readonly examples: readonly string[];

  /** Description */
  readonly description: string;

  /** Priority */
  readonly priority: number;
}

/**
 * Structure of a definite description.
 */
export type DefiniteDescriptionStructure =
  | 'the_noun'                 // "the chorus"
  | 'the_adj_noun'             // "the bright track"
  | 'the_ordinal_noun'         // "the second verse"
  | 'the_superlative_noun'     // "the loudest section"
  | 'the_noun_prep_noun'       // "the reverb on the drums"
  | 'the_adj_adj_noun'         // "the bright warm pad"
  | 'the_noun_relative_clause' // "the track that has reverb"
  | 'the_noun_with_noun'       // "the section with drums"
  | 'the_noun_called_name';    // "the track called 'Glass Pad'"

/**
 * All definite description patterns.
 */
export const DEFINITE_DESCRIPTION_PATTERNS: readonly DefiniteDescriptionPattern[] = [
  {
    name: 'simple_definite',
    pattern: 'the_noun',
    kind: 'definite_description',
    examples: ['the chorus', 'the drums', 'the melody', 'the bass'],
    description: 'Simple definite: "the X" where X is a known entity type',
    priority: 10,
  },
  {
    name: 'modified_definite',
    pattern: 'the_adj_noun',
    kind: 'definite_description',
    examples: ['the bright track', 'the loud section', 'the warm pad'],
    description: 'Modified definite: "the ADJ X" identifying by property',
    priority: 15,
  },
  {
    name: 'ordinal_definite',
    pattern: 'the_ordinal_noun',
    kind: 'definite_ordinal',
    examples: ['the second verse', 'the first chorus', 'the third bridge'],
    description: 'Ordinal definite: "the Nth X"',
    priority: 20,
  },
  {
    name: 'superlative_definite',
    pattern: 'the_superlative_noun',
    kind: 'definite_superlative',
    examples: ['the loudest track', 'the longest section', 'the highest note'],
    description: 'Superlative definite: "the most/least ADJ X"',
    priority: 20,
  },
  {
    name: 'prepositional_definite',
    pattern: 'the_noun_prep_noun',
    kind: 'definite_description',
    examples: ['the reverb on the drums', 'the EQ of the bass', 'the melody in the chorus'],
    description: 'Prepositional definite: "the X of/on/in Y"',
    priority: 18,
  },
  {
    name: 'double_modified_definite',
    pattern: 'the_adj_adj_noun',
    kind: 'definite_description',
    examples: ['the bright warm pad', 'the heavy distorted guitar'],
    description: 'Double-modified definite: "the ADJ ADJ X"',
    priority: 16,
  },
  {
    name: 'relative_clause_definite',
    pattern: 'the_noun_relative_clause',
    kind: 'definite_description',
    examples: ['the track that has reverb', 'the section that sounds muddy'],
    description: 'Relative clause definite: "the X that..."',
    priority: 22,
  },
  {
    name: 'with_definite',
    pattern: 'the_noun_with_noun',
    kind: 'definite_description',
    examples: ['the section with drums', 'the track with delay'],
    description: '"the X with Y" identifying by associated entity',
    priority: 17,
  },
  {
    name: 'named_definite',
    pattern: 'the_noun_called_name',
    kind: 'definite_description',
    examples: ["the track called 'Glass Pad'", "the section named 'Drop'"],
    description: '"the X called/named Y" identifying by label',
    priority: 25,
  },
];

// =============================================================================
// REFERENCE EXPRESSION DETECTION — scanning for references in token sequences
// =============================================================================

/**
 * Result of scanning for reference expressions.
 */
export interface ReferenceScan {
  /** All detected reference expressions */
  readonly refs: readonly DetectedReference[];

  /** Whether any references were found */
  readonly hasReferences: boolean;

  /** How many are obligatory (must be resolved) */
  readonly obligatoryCount: number;

  /** How many require UI selection */
  readonly selectionDependentCount: number;
}

/**
 * A detected reference expression in the input.
 */
export interface DetectedReference {
  /** Token index where the reference starts */
  readonly startTokenIndex: number;

  /** Token index where the reference ends (exclusive) */
  readonly endTokenIndex: number;

  /** The matched entry (pronoun, anaphoric, relative, or bridging) */
  readonly matchSource: ReferenceMatchSource;

  /** The surface text matched */
  readonly surface: string;

  /** The reference kind */
  readonly kind: ReferenceKind;

  /** Number */
  readonly number: GrammaticalNumber;

  /** Whether this is a determiner (followed by a noun) or standalone */
  readonly isDeterminer: boolean;

  /** The head noun if this is a determiner+noun pattern */
  readonly headNoun: string | undefined;

  /** Confidence in the match */
  readonly confidence: number;
}

/**
 * Where a reference match came from.
 */
export type ReferenceMatchSource =
  | { readonly type: 'pronoun'; readonly entry: PronounEntry }
  | { readonly type: 'anaphoric'; readonly entry: AnaphoricEntry }
  | { readonly type: 'relative'; readonly entry: RelativeRefEntry }
  | { readonly type: 'bridging'; readonly entry: BridgingRefEntry }
  | { readonly type: 'definite_description'; readonly pattern: DefiniteDescriptionPattern };

// =============================================================================
// LOOKUP INDICES — efficient lookup for reference forms
// =============================================================================

/**
 * Index: surface form → pronoun entries.
 */
const pronounIndex: ReadonlyMap<string, PronounEntry> = (() => {
  const index = new Map<string, PronounEntry>();
  for (const entry of PRONOUN_ENTRIES) {
    for (const form of entry.forms) {
      index.set(form.toLowerCase(), entry);
    }
  }
  return index;
})();

/**
 * Index: surface form → anaphoric entries.
 * Multi-word forms are keyed by their first word for fast prefix matching.
 */
const anaphoricIndex: ReadonlyMap<string, AnaphoricEntry[]> = (() => {
  const index = new Map<string, AnaphoricEntry[]>();
  for (const entry of ANAPHORIC_ENTRIES) {
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
  return index;
})();

/**
 * Index: surface form → relative ref entries.
 */
const relativeRefIndex: ReadonlyMap<string, RelativeRefEntry[]> = (() => {
  const index = new Map<string, RelativeRefEntry[]>();
  for (const entry of RELATIVE_REF_ENTRIES) {
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
  return index;
})();

/**
 * Index: surface form → bridging ref entries.
 */
const bridgingRefIndex: ReadonlyMap<string, BridgingRefEntry[]> = (() => {
  const index = new Map<string, BridgingRefEntry[]>();
  for (const entry of BRIDGING_REF_ENTRIES) {
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
  return index;
})();

// =============================================================================
// LOOKUP FUNCTIONS
// =============================================================================

/**
 * Look up a pronoun by surface form.
 */
export function lookupPronoun(form: string): PronounEntry | undefined {
  return pronounIndex.get(form.toLowerCase());
}

/**
 * Look up an anaphoric expression by surface form.
 */
export function lookupAnaphoric(form: string): readonly AnaphoricEntry[] {
  return anaphoricIndex.get(form.toLowerCase()) ?? [];
}

/**
 * Look up a relative reference by surface form.
 */
export function lookupRelativeRef(form: string): readonly RelativeRefEntry[] {
  return relativeRefIndex.get(form.toLowerCase()) ?? [];
}

/**
 * Look up a bridging reference by surface form.
 */
export function lookupBridgingRef(form: string): readonly BridgingRefEntry[] {
  return bridgingRefIndex.get(form.toLowerCase()) ?? [];
}

/**
 * Check if a word is any kind of reference expression.
 */
export function isReferenceWord(word: string): boolean {
  const lower = word.toLowerCase();
  return pronounIndex.has(lower);
}

/**
 * Check if a word could start a multi-word reference expression.
 */
export function couldStartReference(word: string): boolean {
  const lower = word.toLowerCase();
  if (pronounIndex.has(lower)) return true;

  // Check if it's the first word of a multi-word form
  const starters = ['the', 'this', 'that', 'these', 'those', 'same', 'another',
    'other', 'what', 'which', 'my', 'their', 'its', 'all', 'none', 'nothing',
    'everything', 'here', 'there', 'now', 'before', 'after'];
  return starters.includes(lower);
}

// =============================================================================
// REFERENCE SCANNING — finding references in token sequences
// =============================================================================

/**
 * Scan a lowercased word sequence for reference expressions.
 *
 * This does a left-to-right scan, trying longer matches first.
 * It recognizes:
 * - Single-word pronouns ("it", "this", "them")
 * - Multi-word anaphoric expressions ("same as before", "the same one")
 * - Relative references ("the previous", "the next")
 * - Bridging references ("the beginning", "the end")
 * - Demonstrative determiner + noun ("this section", "that track")
 *
 * Returns all detected references with their token positions.
 */
export function scanForReferences(words: readonly string[]): ReferenceScan {
  const refs: DetectedReference[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i]!.toLowerCase();

    // Skip words already consumed by a previous multi-word match
    if (refs.some(r => i >= r.startTokenIndex && i < r.endTokenIndex)) {
      continue;
    }

    // Try multi-word matches first (up to 5 words)
    let matched = false;
    for (let len = Math.min(5, words.length - i); len >= 2; len--) {
      const candidate = words.slice(i, i + len).join(' ').toLowerCase();

      // Try anaphoric
      const anaphoricMatches = lookupAnaphoric(candidate);
      if (anaphoricMatches.length > 0) {
        const entry = anaphoricMatches[0]!;
        refs.push({
          startTokenIndex: i,
          endTokenIndex: i + len,
          matchSource: { type: 'anaphoric', entry },
          surface: candidate,
          kind: entry.kind,
          number: entry.number,
          isDeterminer: false,
          headNoun: undefined,
          confidence: 0.8,
        });
        matched = true;
        break;
      }

      // Try relative refs
      const relativeMatches = lookupRelativeRef(candidate);
      if (relativeMatches.length > 0) {
        const entry = relativeMatches[0]!;
        // Check if followed by a noun (then it's a determiner pattern)
        const nextWordIdx = i + len;
        const hasFollowingNoun = nextWordIdx < words.length &&
          !isReferenceWord(words[nextWordIdx]!) &&
          !isStopWord(words[nextWordIdx]!);

        refs.push({
          startTokenIndex: i,
          endTokenIndex: hasFollowingNoun ? nextWordIdx + 1 : i + len,
          matchSource: { type: 'relative', entry },
          surface: hasFollowingNoun
            ? words.slice(i, nextWordIdx + 1).join(' ')
            : candidate,
          kind: entry.kind,
          number: 'singular',
          isDeterminer: hasFollowingNoun,
          headNoun: hasFollowingNoun ? words[nextWordIdx] : undefined,
          confidence: hasFollowingNoun ? 0.85 : 0.7,
        });
        matched = true;
        break;
      }

      // Try bridging refs
      const bridgingMatches = lookupBridgingRef(candidate);
      if (bridgingMatches.length > 0) {
        const entry = bridgingMatches[0]!;
        refs.push({
          startTokenIndex: i,
          endTokenIndex: i + len,
          matchSource: { type: 'bridging', entry },
          surface: candidate,
          kind: 'bridging',
          number: 'singular',
          isDeterminer: false,
          headNoun: undefined,
          confidence: 0.75,
        });
        matched = true;
        break;
      }
    }

    if (matched) continue;

    // Try single-word pronoun matches
    const pronounMatch = lookupPronoun(word);
    if (pronounMatch) {
      // Check if this is a demonstrative determiner (followed by a noun)
      const isDemDet = (pronounMatch.kind === 'demonstrative_pronoun') &&
        i + 1 < words.length &&
        !isReferenceWord(words[i + 1]!) &&
        !isStopWord(words[i + 1]!);

      if (isDemDet) {
        refs.push({
          startTokenIndex: i,
          endTokenIndex: i + 2,
          matchSource: { type: 'pronoun', entry: pronounMatch },
          surface: `${word} ${words[i + 1]}`,
          kind: 'demonstrative_determiner',
          number: pronounMatch.number,
          isDeterminer: true,
          headNoun: words[i + 1],
          confidence: 0.85,
        });
      } else {
        refs.push({
          startTokenIndex: i,
          endTokenIndex: i + 1,
          matchSource: { type: 'pronoun', entry: pronounMatch },
          surface: word,
          kind: pronounMatch.kind,
          number: pronounMatch.number,
          isDeterminer: false,
          headNoun: undefined,
          confidence: 0.7,
        });
      }
    }
  }

  // Compute summary stats
  const obligatoryCount = refs.filter(r => {
    if (r.matchSource.type === 'pronoun') return r.matchSource.entry.obligatory;
    return true;
  }).length;

  const selectionDependentCount = refs.filter(r => {
    if (r.matchSource.type === 'pronoun') return r.matchSource.entry.requiresSelection;
    return false;
  }).length;

  return {
    refs,
    hasReferences: refs.length > 0,
    obligatoryCount,
    selectionDependentCount,
  };
}

/**
 * Check if a word is a common stop word that can't be a head noun.
 */
function isStopWord(word: string): boolean {
  const stops = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'not', 'in', 'on', 'at',
    'to', 'for', 'with', 'from', 'of', 'by', 'up', 'down', 'out',
    'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'do', 'does', 'did', 'done',
    'have', 'has', 'had', 'having',
    'will', 'would', 'could', 'should', 'shall', 'may', 'might',
    'can', 'must',
    'if', 'then', 'else', 'so', 'because', 'while', 'although',
    ',', '.', '?', '!', ':', ';', '-', '(', ')',
  ]);
  return stops.has(word.toLowerCase());
}

// =============================================================================
// UNRESOLVED REF BUILDER — creating UnresolvedRef from detected references
// =============================================================================

let refIdCounter = 0;

/**
 * Reset the referent ID counter (for testing).
 */
export function resetRefIdCounter(): void {
  refIdCounter = 0;
}

/**
 * Build an UnresolvedRef from a DetectedReference.
 */
export function buildUnresolvedRef(
  detected: DetectedReference,
  inputSpan: Span,
): UnresolvedRef {
  const refId = `ref-${++refIdCounter}`;
  const constraints: ReferentConstraint[] = [];
  const warnings: ReferenceWarning[] = [];

  let resolutionHints: readonly ResolutionHint[] = [];
  let requiresSelection = false;
  let obligatory = true;
  let entityTypes: readonly ReferentEntityType[] = [];

  switch (detected.matchSource.type) {
    case 'pronoun': {
      const entry = detected.matchSource.entry;
      resolutionHints = entry.resolutionHints;
      requiresSelection = entry.requiresSelection;
      obligatory = entry.obligatory;
      entityTypes = entry.entityTypes;

      if (requiresSelection) {
        warnings.push({
          code: 'deictic_without_selection',
          message: `"${detected.surface}" requires a UI selection to resolve`,
          span: inputSpan,
        });
      }
      break;
    }
    case 'anaphoric': {
      const entry = detected.matchSource.entry;
      resolutionHints = entry.resolutionHints;
      if (entry.identityRelation === 'same') {
        constraints.push({
          type: 'identity',
          value: 'same',
          hardness: 'hard',
          description: 'Must be the same entity as previously referenced',
        });
      } else if (entry.identityRelation === 'different') {
        constraints.push({
          type: 'identity',
          value: 'different',
          hardness: 'hard',
          description: 'Must be a different entity from the previous referent',
        });
      }
      break;
    }
    case 'relative': {
      const entry = detected.matchSource.entry;
      resolutionHints = entry.resolutionHints;
      break;
    }
    case 'bridging': {
      const entry = detected.matchSource.entry;
      entityTypes = entry.parentEntityTypes;
      resolutionHints = ['salience', 'dialogue_topic'];
      warnings.push({
        code: 'bridging_inference_needed',
        message: `"${detected.surface}" requires inferring what entity it belongs to`,
        span: inputSpan,
      });
      break;
    }
    case 'definite_description': {
      resolutionHints = ['name_match', 'structural', 'salience'];
      break;
    }
  }

  // Add number constraint
  if (detected.number !== 'unspecified') {
    constraints.push({
      type: 'number',
      value: detected.number,
      hardness: 'hard',
      description: `Must be ${detected.number}`,
    });
  }

  // Add entity type constraints
  for (const et of entityTypes) {
    if (et !== 'any') {
      constraints.push({
        type: 'entity_type',
        value: et,
        hardness: 'soft',
        description: `Prefer ${et} entities`,
      });
    }
  }

  return {
    refId,
    kind: detected.kind,
    number: detected.number,
    entityTypeConstraints: entityTypes,
    resolutionHints,
    surface: detected.surface,
    span: inputSpan,
    constraints,
    obligatory,
    requiresSelection,
    headNoun: detected.headNoun,
    modifiers: [],
    confidence: detected.confidence,
    warnings,
  };
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format an UnresolvedRef for display.
 */
export function formatUnresolvedRef(ref: UnresolvedRef): string {
  const lines: string[] = [];
  lines.push(`[${ref.refId}] ${ref.kind}: "${ref.surface}"`);
  lines.push(`  Number: ${ref.number}`);
  lines.push(`  Obligatory: ${ref.obligatory}`);
  lines.push(`  Requires selection: ${ref.requiresSelection}`);

  if (ref.headNoun) {
    lines.push(`  Head noun: ${ref.headNoun}`);
  }
  if (ref.modifiers.length > 0) {
    lines.push(`  Modifiers: ${ref.modifiers.join(', ')}`);
  }
  if (ref.entityTypeConstraints.length > 0) {
    lines.push(`  Entity types: ${ref.entityTypeConstraints.join(', ')}`);
  }
  lines.push(`  Resolution hints: ${ref.resolutionHints.join(' > ')}`);
  lines.push(`  Confidence: ${(ref.confidence * 100).toFixed(0)}%`);

  for (const c of ref.constraints) {
    lines.push(`  Constraint (${c.hardness}): ${c.type} = ${c.value}`);
  }
  for (const w of ref.warnings) {
    lines.push(`  Warning: ${w.code} — ${w.message}`);
  }

  return lines.join('\n');
}

/**
 * Format a ReferenceScan for display.
 */
export function formatReferenceScan(scan: ReferenceScan): string {
  if (!scan.hasReferences) return 'No reference expressions detected.';

  const lines: string[] = [];
  lines.push(`References found: ${scan.refs.length}`);
  lines.push(`  Obligatory: ${scan.obligatoryCount}`);
  lines.push(`  Selection-dependent: ${scan.selectionDependentCount}`);
  lines.push('');

  for (const ref of scan.refs) {
    lines.push(`  [${ref.startTokenIndex}-${ref.endTokenIndex}] ` +
      `${ref.kind}: "${ref.surface}" (${ref.isDeterminer ? 'det+noun' : 'standalone'})`);
    if (ref.headNoun) {
      lines.push(`    Head noun: ${ref.headNoun}`);
    }
    lines.push(`    Confidence: ${(ref.confidence * 100).toFixed(0)}%`);
  }

  return lines.join('\n');
}

/**
 * Format a pronoun entry for display.
 */
export function formatPronounEntry(entry: PronounEntry): string {
  const lines: string[] = [];
  lines.push(`${entry.forms.join('/')} — ${entry.kind} (${entry.number})`);
  lines.push(`  Resolution: ${entry.resolutionHints.join(' > ')}`);
  lines.push(`  Selection required: ${entry.requiresSelection}`);
  lines.push(`  Obligatory: ${entry.obligatory}`);
  if (entry.entityTypes.length > 0) {
    lines.push(`  Entity types: ${entry.entityTypes.join(', ')}`);
  }
  lines.push(`  Examples: ${entry.examples.join('; ')}`);
  return lines.join('\n');
}

/**
 * Format all reference entries by category.
 */
export function formatAllReferenceEntries(): string {
  const sections: string[] = [];

  sections.push('\n=== PRONOUNS ===');
  for (const entry of PRONOUN_ENTRIES) {
    sections.push(formatPronounEntry(entry));
  }

  sections.push('\n=== ANAPHORIC EXPRESSIONS ===');
  for (const entry of ANAPHORIC_ENTRIES) {
    sections.push(`${entry.forms.join('/')} — ${entry.kind} (${entry.identityRelation})`);
    sections.push(`  Examples: ${entry.examples.join('; ')}`);
  }

  sections.push('\n=== RELATIVE REFERENCES ===');
  for (const entry of RELATIVE_REF_ENTRIES) {
    sections.push(`${entry.forms.join('/')} — ${entry.direction}`);
    sections.push(`  Examples: ${entry.examples.join('; ')}`);
  }

  sections.push('\n=== BRIDGING REFERENCES ===');
  for (const entry of BRIDGING_REF_ENTRIES) {
    sections.push(`${entry.forms.join('/')} — ${entry.partRelation}`);
    sections.push(`  Examples: ${entry.examples.join('; ')}`);
  }

  return sections.join('\n');
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the reference expression grammar.
 */
export function getReferenceStats(): ReferenceStats {
  let totalPronounForms = 0;
  let totalAnaphoricForms = 0;
  let totalRelativeForms = 0;
  let totalBridgingForms = 0;
  const kindCounts = new Map<ReferenceKind, number>();

  for (const entry of PRONOUN_ENTRIES) {
    totalPronounForms += entry.forms.length;
    kindCounts.set(entry.kind, (kindCounts.get(entry.kind) ?? 0) + 1);
  }
  for (const entry of ANAPHORIC_ENTRIES) {
    totalAnaphoricForms += entry.forms.length;
    kindCounts.set(entry.kind, (kindCounts.get(entry.kind) ?? 0) + 1);
  }
  for (const entry of RELATIVE_REF_ENTRIES) {
    totalRelativeForms += entry.forms.length;
    kindCounts.set(entry.kind, (kindCounts.get(entry.kind) ?? 0) + 1);
  }
  for (const entry of BRIDGING_REF_ENTRIES) {
    totalBridgingForms += entry.forms.length;
  }

  return {
    totalPronounEntries: PRONOUN_ENTRIES.length,
    totalPronounForms,
    totalAnaphoricEntries: ANAPHORIC_ENTRIES.length,
    totalAnaphoricForms,
    totalRelativeEntries: RELATIVE_REF_ENTRIES.length,
    totalRelativeForms,
    totalBridgingEntries: BRIDGING_REF_ENTRIES.length,
    totalBridgingForms,
    totalDefinitePatterns: DEFINITE_DESCRIPTION_PATTERNS.length,
    kindCounts: Object.fromEntries(kindCounts) as Record<ReferenceKind, number>,
  };
}

/**
 * Statistics about the reference expression grammar.
 */
export interface ReferenceStats {
  readonly totalPronounEntries: number;
  readonly totalPronounForms: number;
  readonly totalAnaphoricEntries: number;
  readonly totalAnaphoricForms: number;
  readonly totalRelativeEntries: number;
  readonly totalRelativeForms: number;
  readonly totalBridgingEntries: number;
  readonly totalBridgingForms: number;
  readonly totalDefinitePatterns: number;
  readonly kindCounts: Record<string, number>;
}

// =============================================================================
// GRAMMAR RULES — formal specification of reference expression grammar rules
// =============================================================================

/**
 * A grammar rule for reference expressions.
 */
export interface ReferenceGrammarRule {
  /** Rule ID */
  readonly id: string;

  /** LHS non-terminal */
  readonly lhs: string;

  /** RHS description */
  readonly rhsDescription: string;

  /** The reference kind this rule produces */
  readonly producesKind: ReferenceKind;

  /** Priority (higher = preferred) */
  readonly priority: number;

  /** Semantic action name */
  readonly semanticAction: string;

  /** Examples */
  readonly examples: readonly string[];
}

/**
 * Generate grammar rules for reference expressions.
 */
export function generateReferenceGrammarRules(): readonly ReferenceGrammarRule[] {
  const rules: ReferenceGrammarRule[] = [];

  // Rule 1: Personal pronoun → RefExpr
  rules.push({
    id: 'ref-001',
    lhs: 'RefExpr',
    rhsDescription: 'PersonalPronoun',
    producesKind: 'personal_pronoun',
    priority: 10,
    semanticAction: 'sem:ref:pronoun',
    examples: ['it', 'them', 'they'],
  });

  // Rule 2: Demonstrative pronoun → RefExpr
  rules.push({
    id: 'ref-002',
    lhs: 'RefExpr',
    rhsDescription: 'DemPronoun',
    producesKind: 'demonstrative_pronoun',
    priority: 12,
    semanticAction: 'sem:ref:demonstrative',
    examples: ['this', 'that', 'these', 'those'],
  });

  // Rule 3: Demonstrative determiner + Noun → RefExpr
  rules.push({
    id: 'ref-003',
    lhs: 'RefExpr',
    rhsDescription: 'DemDet NounPhrase',
    producesKind: 'demonstrative_determiner',
    priority: 18,
    semanticAction: 'sem:ref:dem_det_noun',
    examples: ['this section', 'that track', 'these notes', 'those drums'],
  });

  // Rule 4: Anaphoric "same" → RefExpr
  rules.push({
    id: 'ref-004',
    lhs: 'RefExpr',
    rhsDescription: 'AnaphoricSameExpr',
    producesKind: 'anaphoric_same',
    priority: 15,
    semanticAction: 'sem:ref:anaphoric_same',
    examples: ['the same', 'same as before', 'again'],
  });

  // Rule 5: Anaphoric "other" → RefExpr
  rules.push({
    id: 'ref-005',
    lhs: 'RefExpr',
    rhsDescription: 'AnaphoricOtherExpr',
    producesKind: 'anaphoric_other',
    priority: 14,
    semanticAction: 'sem:ref:anaphoric_other',
    examples: ['another', 'a different one', 'the other'],
  });

  // Rule 6: Relative reference + Noun → RefExpr
  rules.push({
    id: 'ref-006',
    lhs: 'RefExpr',
    rhsDescription: 'RelativeRef NounPhrase',
    producesKind: 'relative_previous',
    priority: 16,
    semanticAction: 'sem:ref:relative',
    examples: ['the previous section', 'the next chorus', 'the last bar'],
  });

  // Rule 7: Definite description → RefExpr
  rules.push({
    id: 'ref-007',
    lhs: 'RefExpr',
    rhsDescription: '"the" NounPhrase',
    producesKind: 'definite_description',
    priority: 10,
    semanticAction: 'sem:ref:definite',
    examples: ['the chorus', 'the drums', 'the melody'],
  });

  // Rule 8: Definite ordinal description → RefExpr
  rules.push({
    id: 'ref-008',
    lhs: 'RefExpr',
    rhsDescription: '"the" Ordinal NounPhrase',
    producesKind: 'definite_ordinal',
    priority: 20,
    semanticAction: 'sem:ref:definite_ordinal',
    examples: ['the second verse', 'the first chorus', 'the third bridge'],
  });

  // Rule 9: Definite superlative description → RefExpr
  rules.push({
    id: 'ref-009',
    lhs: 'RefExpr',
    rhsDescription: '"the" Superlative NounPhrase',
    producesKind: 'definite_superlative',
    priority: 20,
    semanticAction: 'sem:ref:definite_superlative',
    examples: ['the loudest track', 'the brightest section'],
  });

  // Rule 10: Deictic "here" / "there" → RefExpr
  rules.push({
    id: 'ref-010',
    lhs: 'RefExpr',
    rhsDescription: 'DeicticAdverb',
    producesKind: 'deictic_here',
    priority: 12,
    semanticAction: 'sem:ref:deictic',
    examples: ['here', 'there', 'now'],
  });

  // Rule 11: Bridging reference → RefExpr
  rules.push({
    id: 'ref-011',
    lhs: 'RefExpr',
    rhsDescription: 'BridgingExpr',
    producesKind: 'bridging',
    priority: 8,
    semanticAction: 'sem:ref:bridging',
    examples: ['the beginning', 'the end', 'the peak'],
  });

  // Rule 12: Possessive + Noun → RefExpr
  rules.push({
    id: 'ref-012',
    lhs: 'RefExpr',
    rhsDescription: 'PossessivePronoun NounPhrase',
    producesKind: 'possessive_pronoun',
    priority: 14,
    semanticAction: 'sem:ref:possessive',
    examples: ['its volume', 'their timing', 'my preset'],
  });

  // Rule 13: "the one that..." → RefExpr
  rules.push({
    id: 'ref-013',
    lhs: 'RefExpr',
    rhsDescription: '"the one" RelClause',
    producesKind: 'anaphoric_identity',
    priority: 18,
    semanticAction: 'sem:ref:identity',
    examples: ['the one with reverb', 'the one that was louder'],
  });

  // Rule 14: "everything" / "nothing" → RefExpr
  rules.push({
    id: 'ref-014',
    lhs: 'RefExpr',
    rhsDescription: 'UniversalRef',
    producesKind: 'everything',
    priority: 8,
    semanticAction: 'sem:ref:universal',
    examples: ['everything', 'all of it', 'nothing', 'none'],
  });

  // Rule 15: Definite description with PP → RefExpr
  rules.push({
    id: 'ref-015',
    lhs: 'RefExpr',
    rhsDescription: '"the" NounPhrase PrepPhrase',
    producesKind: 'definite_description',
    priority: 18,
    semanticAction: 'sem:ref:definite_pp',
    examples: ['the reverb on the drums', 'the melody in the chorus'],
  });

  // Rule 16: Named reference → RefExpr
  rules.push({
    id: 'ref-016',
    lhs: 'RefExpr',
    rhsDescription: '"the" Noun "called"/"named" QuotedString',
    producesKind: 'definite_description',
    priority: 25,
    semanticAction: 'sem:ref:named',
    examples: ["the track called 'Glass Pad'", "the section named 'Drop'"],
  });

  return rules;
}

// =============================================================================
// DECLARATIVE RULES — human-readable specification of reference grammar rules
// =============================================================================

export const REFERENCE_GRAMMAR_RULES = [
  'Rule REF-001: Personal pronouns ("it", "them") resolve to the most salient ' +
  'entity in the discourse context. They are obligatory and must be resolved.',

  'Rule REF-002: Demonstrative pronouns ("this", "that") prefer UI selection ' +
  '(proximal "this") or recent mention (distal "that"). "this" without selection ' +
  'must trigger a clarification question.',

  'Rule REF-003: Demonstrative determiners ("this section", "that track") combine ' +
  'a demonstrative with a head noun. The noun constrains entity type; the ' +
  'demonstrative constrains resolution strategy.',

  'Rule REF-004: Anaphoric "same" expressions ("the same", "same as before", ' +
  '"again") require an antecedent from prior edits or dialogue. If no antecedent ' +
  'exists, they produce a "missing_antecedent" warning.',

  'Rule REF-005: Anaphoric "other" expressions ("another", "a different one", ' +
  '"the rest") require an antecedent and produce a referent that is explicitly ' +
  'NOT the antecedent.',

  'Rule REF-006: Relative references ("the previous", "the next", "the last") ' +
  'resolve ordinally within a sequence. They can modify a head noun ("the previous ' +
  'section") or stand alone ("go to the next").',

  'Rule REF-007: Deictic references ("here", "there", "now") are UI-bound. ' +
  '"here" requires an active UI selection or cursor position. "there" refers to ' +
  'a previously indicated location.',

  'Rule REF-008: Bridging references ("the beginning", "the end", "the peak") ' +
  'require inferring what entity they are part of. Resolution uses the current ' +
  'dialogue topic or most salient entity.',

  'Rule REF-009: Definite descriptions ("the chorus", "the drums") resolve by ' +
  'name matching against the project symbol table. If multiple entities match, ' +
  'a clarification question must be generated.',

  'Rule REF-010: Ordinal definite descriptions ("the second verse", "the first ' +
  'chorus") resolve by ordinal position in the song structure.',

  'Rule REF-011: Superlative definite descriptions ("the loudest track", "the ' +
  'brightest section") resolve by comparing a property across all candidates.',

  'Rule REF-012: Possessive references ("its volume", "their timing") resolve ' +
  'the possessor pronoun first, then access the named property of the resolved entity.',

  'Rule REF-013: Universal references ("everything", "all of it") expand to the ' +
  'current scope. They should be used with caution and may trigger safety warnings.',

  'Rule REF-014: All unresolved references become CPL holes. The pragmatics layer ' +
  'either resolves them or generates clarification questions. No reference may be ' +
  'silently dropped.',

  'Rule REF-015: When a reference is ambiguous between demonstrative-determiner and ' +
  'demonstrative-pronoun reading ("this" alone vs "this section"), prefer the ' +
  'determiner+noun reading if a suitable noun follows.',

  'Rule REF-016: Named references ("the track called \'Glass Pad\'") resolve ' +
  'deterministically by exact name match against the project symbol table.',
] as const;
