/**
 * GOFAI Discourse Model — DRT/SDRT-Style Discourse Referents and Relations
 *
 * Step 014 [Prag]: Defines the discourse model strategy using:
 *
 * 1. **DRT (Discourse Representation Theory)**: Discourse referents persist
 *    across turns. When the user says "the chorus" and then "make it brighter",
 *    "it" resolves to the chorus via a discourse referent.
 *
 * 2. **SDRT (Segmented DRT)**: Rhetorical relations between discourse segments
 *    (and/but/then/after) determine how meaning combines. "Make it brighter
 *    but keep the melody" has a Contrast relation that makes the constraint
 *    high-priority.
 *
 * 3. **QUD (Questions Under Discussion)**: The current "question" being
 *    addressed helps resolve references and determine what's relevant.
 *    If the user is working on the chorus, "more lift" inherits chorus scope.
 *
 * ## Key Design Decisions
 *
 * - Discourse referents are typed (section, layer, card, etc.) and carry
 *   salience scores that decay over turns.
 * - Rhetorical relations are explicit in the representation, not inferred
 *   probabilistically. Cue words ("but", "then", "also") map deterministically.
 * - The discourse model is the "memory" of the interaction loop. It stores
 *   what has been established, what is salient, and what constraints are
 *   currently active.
 * - All bindings are explainable: the system can tell the user why "it"
 *   resolved to Chorus 2.
 *
 * @module gofai/pragmatics/discourse-model
 */

import type { DiscourseRelation, SourceSpan } from '../nl/semantics/representation';

// =============================================================================
// Discourse Representation Structure (DRS)
// =============================================================================

/**
 * A Discourse Representation Structure (DRS): the semantic content
 * of a discourse segment.
 *
 * A DRS contains:
 * - A universe of discourse referents
 * - A set of conditions (predications about referents)
 * - Accessibility relations to parent/sibling DRSes
 */
export interface DRS {
  /** Unique identifier for this DRS */
  readonly id: DRSId;

  /** Label (for display and debugging) */
  readonly label: string;

  /** The discourse referents introduced in this DRS */
  readonly universe: readonly DiscourseReferent[];

  /** Conditions (predications) over referents */
  readonly conditions: readonly DRSCondition[];

  /** Parent DRS (for accessibility) */
  readonly parent: DRSId | undefined;

  /** Child DRSes (subordinate segments) */
  readonly children: readonly DRSId[];

  /** Turn number when this DRS was created */
  readonly turnNumber: number;

  /** Source span in the utterance that created this DRS */
  readonly sourceSpan: SourceSpan | undefined;
}

/**
 * A DRS identifier.
 */
export type DRSId = string & { readonly __brand: 'DRSId' };

/**
 * Create a DRS ID.
 */
export function createDRSId(name: string): DRSId {
  return `drs:${name}` as DRSId;
}

// =============================================================================
// Discourse Referents
// =============================================================================

/**
 * A discourse referent: an entity introduced into the discourse.
 *
 * Discourse referents are the "things we're talking about." They persist
 * across turns and can be referred to by pronouns, demonstratives,
 * and definite descriptions.
 */
export interface DiscourseReferent {
  /** Unique identifier */
  readonly id: ReferentId;

  /** Display name (for UI) */
  readonly displayName: string;

  /** Entity type */
  readonly type: ReferentType;

  /** The DRS that introduced this referent */
  readonly introducedIn: DRSId;

  /** Turn number when introduced */
  readonly turnIntroduced: number;

  /** How this referent was introduced */
  readonly introductionSource: IntroductionSource;

  /** Current salience score (0-1, decays over turns) */
  readonly salience: number;

  /** Properties known about this referent */
  readonly properties: readonly ReferentProperty[];

  /** Bound entity in the project world (if resolved) */
  readonly worldBinding: WorldBinding | undefined;

  /** Whether this referent is currently "in focus" */
  readonly inFocus: boolean;

  /** Last turn this referent was mentioned or used */
  readonly lastMentionedTurn: number;
}

/**
 * A referent identifier.
 */
export type ReferentId = string & { readonly __brand: 'ReferentId' };

/**
 * Create a referent ID.
 */
export function createReferentId(name: string, turn: number): ReferentId {
  return `ref:${name}:t${turn}` as ReferentId;
}

/**
 * Types of discourse referents.
 */
export type ReferentType =
  | 'section'         // A section of the song
  | 'layer'           // A track/layer
  | 'card'            // A card in the signal chain
  | 'event_set'       // A set of events (e.g., "the notes")
  | 'range'           // A bar range
  | 'edit'            // A prior edit (for "undo that", "do that again")
  | 'plan'            // A prior plan
  | 'axis'            // A perceptual axis ("the brightness")
  | 'constraint'      // A constraint ("the melody preservation")
  | 'musical_object'  // A musical object (motif, chord, groove)
  | 'param'           // A card parameter
  | 'board'           // A board
  | 'deck';           // A deck

/**
 * How a referent was introduced into the discourse.
 */
export type IntroductionSource =
  | { readonly type: 'mentioned'; readonly utteranceSpan: SourceSpan }
  | { readonly type: 'ui_selection'; readonly selectionDescription: string }
  | { readonly type: 'ui_focus'; readonly focusDescription: string }
  | { readonly type: 'edit_result'; readonly editPackageId: string }
  | { readonly type: 'world_state'; readonly entityId: string }
  | { readonly type: 'inferred'; readonly inferenceRule: string };

/**
 * A property known about a referent.
 */
export interface ReferentProperty {
  /** Property name */
  readonly name: string;

  /** Property value */
  readonly value: string;

  /** Source of this property */
  readonly source: 'mentioned' | 'world_state' | 'inferred';

  /** Turn when established */
  readonly turnEstablished: number;
}

/**
 * Binding to a real entity in the project world.
 */
export interface WorldBinding {
  /** Entity ID in the project */
  readonly entityId: string;

  /** Entity type */
  readonly entityType: string;

  /** Display name in the project */
  readonly displayName: string;

  /** Additional details (e.g., bar range) */
  readonly details: string | undefined;

  /** How the binding was established */
  readonly bindingMethod: BindingMethod;

  /** Confidence in the binding */
  readonly confidence: 'certain' | 'likely' | 'possible';
}

/**
 * How a referent was bound to a world entity.
 */
export type BindingMethod =
  | 'exact_name_match'     // "Chorus 2" matches section "Chorus 2"
  | 'type_and_index'       // "the second verse" matches by type + index
  | 'unique_of_type'       // "the pad" — only one pad track
  | 'salience_based'       // "it" → most salient referent
  | 'ui_focus'             // "this" → currently focused entity
  | 'ui_selection'         // "these notes" → currently selected events
  | 'fuzzy_match'          // "the glass pad" fuzzy-matches "GlassPad"
  | 'description_match'    // "the noisy synth" matches by tag/description
  | 'role_match';          // "the melody" matches by layer role

// =============================================================================
// DRS Conditions
// =============================================================================

/**
 * A condition in a DRS: a predication about referents.
 */
export type DRSCondition =
  | PredicateCondition
  | EqualityCondition
  | RelationCondition
  | NegationCondition
  | ImplicationCondition
  | DisjunctionCondition
  | TemporalCondition
  | ModalCondition;

/**
 * A simple predicate: P(x).
 */
export interface PredicateCondition {
  readonly type: 'predicate';
  readonly predicate: string;
  readonly args: readonly ReferentId[];
  readonly sourceSpan: SourceSpan | undefined;
}

/**
 * Equality: x = y.
 */
export interface EqualityCondition {
  readonly type: 'equality';
  readonly left: ReferentId;
  readonly right: ReferentId;
}

/**
 * A relation between referents: R(x, y).
 */
export interface RelationCondition {
  readonly type: 'relation';
  readonly relation: string;
  readonly args: readonly ReferentId[];
  readonly sourceSpan: SourceSpan | undefined;
}

/**
 * Negation: ¬DRS.
 */
export interface NegationCondition {
  readonly type: 'negation';
  readonly negatedDRS: DRSId;
}

/**
 * Implication: DRS1 ⇒ DRS2 (conditional).
 */
export interface ImplicationCondition {
  readonly type: 'implication';
  readonly antecedent: DRSId;
  readonly consequent: DRSId;
}

/**
 * Disjunction: DRS1 ∨ DRS2.
 */
export interface DisjunctionCondition {
  readonly type: 'disjunction';
  readonly alternatives: readonly DRSId[];
}

/**
 * Temporal condition: ordering or simultaneity.
 */
export interface TemporalCondition {
  readonly type: 'temporal';
  readonly relation: 'before' | 'after' | 'during' | 'overlaps';
  readonly event1: ReferentId;
  readonly event2: ReferentId;
}

/**
 * Modal condition: possibility, necessity.
 */
export interface ModalCondition {
  readonly type: 'modal';
  readonly modality: 'possible' | 'necessary' | 'conditional';
  readonly scope: DRSId;
}

// =============================================================================
// SDRT: Rhetorical Relations Between Segments
// =============================================================================

/**
 * An SDRT discourse segment: a DRS with a rhetorical relation to its context.
 */
export interface DiscourseSegment {
  /** The DRS for this segment */
  readonly drs: DRSId;

  /** The rhetorical relation to the prior segment */
  readonly relation: SegmentRelation | undefined;

  /** The prior segment (left argument of relation) */
  readonly attachedTo: DRSId | undefined;

  /** Turn number */
  readonly turnNumber: number;

  /** Label */
  readonly label: string;
}

/**
 * A rhetorical relation between discourse segments, with annotation
 * about the linguistic cue that triggered it.
 */
export interface SegmentRelation {
  /** The relation type */
  readonly type: DiscourseRelation;

  /** The cue word that triggered this relation */
  readonly cueWord: string | undefined;

  /** Cue word span */
  readonly cueSpan: SourceSpan | undefined;

  /** Effect on constraint priority */
  readonly constraintEffect: ConstraintEffect;

  /** Effect on plan ordering */
  readonly planOrderingEffect: PlanOrderingEffect;
}

/**
 * How a rhetorical relation affects constraint priority.
 */
export type ConstraintEffect =
  | 'raise_priority'     // "but keep X" → X becomes high-priority hard constraint
  | 'lower_priority'     // "if possible" → soft constraint
  | 'no_effect'          // "and also" → same priority
  | 'override'           // "actually" / "instead" → replaces prior constraint
  | 'complement';        // "without" → adds a negative constraint

/**
 * How a rhetorical relation affects plan ordering.
 */
export type PlanOrderingEffect =
  | 'sequential'         // "then" → second plan after first
  | 'parallel'           // "and" → can be in any order
  | 'replacement'        // "instead" → replaces prior plan
  | 'no_constraint';     // No ordering constraint

/**
 * Map from cue words to discourse relations.
 *
 * This is deterministic: each cue word maps to exactly one relation type.
 * Ambiguous cases are listed with their resolution rules.
 */
export const CUE_WORD_RELATIONS: ReadonlyMap<string, CueWordMapping> = new Map<string, CueWordMapping>([
  // Contrastive
  ['but', {
    relation: 'contrast',
    constraintEffect: 'raise_priority',
    planOrderingEffect: 'parallel',
    description: 'Contrast: introduces a constraint or contrasting goal',
  }],
  ['however', {
    relation: 'contrast',
    constraintEffect: 'raise_priority',
    planOrderingEffect: 'parallel',
    description: 'Contrast: introduces a constraint or contrasting goal',
  }],
  ['yet', {
    relation: 'contrast',
    constraintEffect: 'raise_priority',
    planOrderingEffect: 'parallel',
    description: 'Contrast: introduces a constraint or contrasting goal',
  }],
  ['except', {
    relation: 'contrast',
    constraintEffect: 'raise_priority',
    planOrderingEffect: 'parallel',
    description: 'Contrast with exception: narrows scope or adds exclusion',
  }],
  ['without', {
    relation: 'contrast',
    constraintEffect: 'complement',
    planOrderingEffect: 'parallel',
    description: 'Exclusion: adds a negative constraint',
  }],

  // Sequential / Narrative
  ['then', {
    relation: 'narration',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'sequential',
    description: 'Sequence: second action follows first',
  }],
  ['after', {
    relation: 'narration',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'sequential',
    description: 'Sequence: temporal ordering',
  }],
  ['after that', {
    relation: 'narration',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'sequential',
    description: 'Sequence: temporal ordering',
  }],
  ['before', {
    relation: 'narration',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'sequential',
    description: 'Sequence: reversed temporal ordering',
  }],
  ['next', {
    relation: 'narration',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'sequential',
    description: 'Sequence: next action in chain',
  }],

  // Continuation / Additive
  ['and', {
    relation: 'continuation',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'parallel',
    description: 'Addition: parallel goals or actions',
  }],
  ['also', {
    relation: 'continuation',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'parallel',
    description: 'Addition: additional goal',
  }],
  ['too', {
    relation: 'continuation',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'parallel',
    description: 'Addition: same as "also"',
  }],
  ['as well', {
    relation: 'continuation',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'parallel',
    description: 'Addition: same as "also"',
  }],
  ['plus', {
    relation: 'continuation',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'parallel',
    description: 'Addition: additive coordination',
  }],

  // Replacement / Correction
  ['instead', {
    relation: 'correction',
    constraintEffect: 'override',
    planOrderingEffect: 'replacement',
    description: 'Replacement: replaces prior intent',
  }],
  ['rather', {
    relation: 'correction',
    constraintEffect: 'override',
    planOrderingEffect: 'replacement',
    description: 'Replacement: preference for alternative',
  }],
  ['actually', {
    relation: 'correction',
    constraintEffect: 'override',
    planOrderingEffect: 'replacement',
    description: 'Correction: overrides prior statement',
  }],
  ['never mind', {
    relation: 'correction',
    constraintEffect: 'override',
    planOrderingEffect: 'replacement',
    description: 'Cancellation: withdraws prior statement',
  }],

  // Elaboration
  ['specifically', {
    relation: 'elaboration',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'no_constraint',
    description: 'Elaboration: narrows or refines prior statement',
  }],
  ['meaning', {
    relation: 'elaboration',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'no_constraint',
    description: 'Elaboration: clarifies prior statement',
  }],
  ['in particular', {
    relation: 'elaboration',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'no_constraint',
    description: 'Elaboration: focuses on specific aspect',
  }],
  ['especially', {
    relation: 'elaboration',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'no_constraint',
    description: 'Elaboration: emphasizes specific aspect',
  }],

  // Result / Causal
  ['so', {
    relation: 'result',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'sequential',
    description: 'Result: consequence or purpose',
  }],
  ['therefore', {
    relation: 'result',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'sequential',
    description: 'Result: logical consequence',
  }],
  ['so that', {
    relation: 'result',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'sequential',
    description: 'Purpose: intended outcome',
  }],

  // Background / Concurrent
  ['while', {
    relation: 'background',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'parallel',
    description: 'Background: concurrent or contextual',
  }],
  ['meanwhile', {
    relation: 'background',
    constraintEffect: 'no_effect',
    planOrderingEffect: 'parallel',
    description: 'Background: concurrent action',
  }],
]);

/**
 * Mapping from a cue word to its discourse relation properties.
 */
export interface CueWordMapping {
  readonly relation: DiscourseRelation;
  readonly constraintEffect: ConstraintEffect;
  readonly planOrderingEffect: PlanOrderingEffect;
  readonly description: string;
}

// =============================================================================
// QUD (Questions Under Discussion)
// =============================================================================

/**
 * A Question Under Discussion: the implicit or explicit question being
 * addressed by the current discourse segment.
 *
 * QUDs help resolve references and determine what's relevant:
 * - If QUD is "what should the chorus sound like?", then "more lift"
 *   inherits chorus scope.
 * - If QUD is "what went wrong?", then "undo" targets the last edit.
 */
export interface QUD {
  /** Unique identifier */
  readonly id: QUDId;

  /** The question (in structured form) */
  readonly question: QUDQuestion;

  /** When this QUD was pushed */
  readonly turnPushed: number;

  /** Whether this QUD is still active */
  readonly active: boolean;

  /** Entities in scope for this QUD */
  readonly scopeEntities: readonly ReferentId[];

  /** Expected answer type */
  readonly expectedAnswerType: QUDAnswerType;
}

/**
 * QUD identifier.
 */
export type QUDId = string & { readonly __brand: 'QUDId' };

/**
 * Create a QUD ID.
 */
export function createQUDId(name: string, turn: number): QUDId {
  return `qud:${name}:t${turn}` as QUDId;
}

/**
 * Structured question types.
 */
export type QUDQuestion =
  | { readonly type: 'what_to_change'; readonly scope: ReferentId | undefined }
  | { readonly type: 'how_to_change'; readonly target: ReferentId; readonly axis: string | undefined }
  | { readonly type: 'what_scope'; readonly action: string }
  | { readonly type: 'which_entity'; readonly entityType: ReferentType; readonly candidates: readonly ReferentId[] }
  | { readonly type: 'how_much'; readonly axis: string }
  | { readonly type: 'what_happened'; readonly editId: string | undefined }
  | { readonly type: 'should_proceed'; readonly planId: string }
  | { readonly type: 'clarification'; readonly ambiguityId: string };

/**
 * Expected answer types for QUDs.
 */
export type QUDAnswerType =
  | 'entity'       // An entity reference
  | 'axis'         // An axis specification
  | 'amount'       // An amount/degree
  | 'scope'        // A scope specification
  | 'boolean'      // Yes/no
  | 'choice'       // Choice from options
  | 'action';      // An edit action

// =============================================================================
// Discourse State
// =============================================================================

/**
 * The complete discourse state: everything the system knows about
 * the conversation history and current context.
 */
export interface DiscourseState {
  /** All DRSes created during the session */
  readonly drses: readonly DRS[];

  /** All discourse referents (across all DRSes) */
  readonly referents: readonly DiscourseReferent[];

  /** All discourse segments with their relations */
  readonly segments: readonly DiscourseSegment[];

  /** The QUD stack (most recent first) */
  readonly qudStack: readonly QUD[];

  /** Current turn number */
  readonly currentTurn: number;

  /** Common ground: mutually established facts */
  readonly commonGround: readonly CommonGroundEntry[];

  /** Edit history (for presupposition checking and "again" resolution) */
  readonly editHistory: readonly EditHistoryReferent[];

  /** User preferences (for default resolution) */
  readonly userPreferences: readonly UserPreferenceEntry[];

  /** Topic continuity: the current "topic" scope */
  readonly currentTopic: TopicFrame | undefined;
}

/**
 * A fact in the common ground (mutually established).
 */
export interface CommonGroundEntry {
  /** What was established */
  readonly fact: string;

  /** When it was established */
  readonly turnEstablished: number;

  /** How it was established */
  readonly method: 'explicit_mention' | 'clarification_answer' | 'ui_action' | 'default_accepted';

  /** The referents involved */
  readonly referents: readonly ReferentId[];
}

/**
 * An edit in the history (for presupposition and "again" resolution).
 */
export interface EditHistoryReferent {
  /** Edit package ID */
  readonly editPackageId: string;

  /** Turn number */
  readonly turnNumber: number;

  /** Summary of what was done */
  readonly summary: string;

  /** Scope of the edit */
  readonly scope: ReferentId | undefined;

  /** Axis affected */
  readonly axis: string | undefined;

  /** Direction */
  readonly direction: string | undefined;

  /** Layers touched */
  readonly layersTouched: readonly string[];

  /** The referent for this edit (so "that" can refer to it) */
  readonly referentId: ReferentId;
}

/**
 * A user preference entry.
 */
export interface UserPreferenceEntry {
  /** The vague term */
  readonly term: string;

  /** The preferred interpretation */
  readonly interpretation: string;

  /** When this was established */
  readonly turnEstablished: number;

  /** How it was established */
  readonly method: 'explicit' | 'inferred';

  /** Provenance */
  readonly provenance: string;
}

/**
 * Topic frame: the current conversational topic.
 *
 * Supports "topic continuity": if the user is working on the chorus,
 * subsequent instructions inherit chorus scope unless contradicted.
 */
export interface TopicFrame {
  /** The focal entity */
  readonly focus: ReferentId;

  /** The focal scope (section, layer, etc.) */
  readonly focusType: ReferentType;

  /** Display name */
  readonly displayName: string;

  /** Turn when topic was set */
  readonly turnSet: number;

  /** Whether the topic was explicitly stated or inferred */
  readonly explicit: boolean;
}

// =============================================================================
// Salience Model
// =============================================================================

/**
 * Salience computation parameters.
 */
export interface SalienceParams {
  /** Decay rate per turn (multiplicative) */
  readonly decayRate: number;

  /** Boost for being mentioned in the current turn */
  readonly mentionBoost: number;

  /** Boost for being the target of an edit */
  readonly editTargetBoost: number;

  /** Boost for being in UI focus */
  readonly uiFocusBoost: number;

  /** Boost for being in UI selection */
  readonly uiSelectionBoost: number;

  /** Minimum salience before a referent is considered "forgotten" */
  readonly forgetThreshold: number;

  /** Maximum salience */
  readonly maxSalience: number;
}

/**
 * Default salience parameters.
 */
export const DEFAULT_SALIENCE_PARAMS: SalienceParams = {
  decayRate: 0.7,           // Lose 30% per turn
  mentionBoost: 0.5,        // +0.5 for being mentioned
  editTargetBoost: 0.4,     // +0.4 for being edited
  uiFocusBoost: 0.3,        // +0.3 for being in focus
  uiSelectionBoost: 0.6,    // +0.6 for being selected
  forgetThreshold: 0.05,    // Below this, referent is "forgotten"
  maxSalience: 1.0,
} as const;

/**
 * Compute the updated salience for a referent at a new turn.
 */
export function computeSalience(
  currentSalience: number,
  turnsSinceLastMention: number,
  boosts: readonly SalienceBoost[],
  params: SalienceParams = DEFAULT_SALIENCE_PARAMS
): number {
  // Decay
  let salience = currentSalience * Math.pow(params.decayRate, turnsSinceLastMention);

  // Apply boosts
  for (const boost of boosts) {
    switch (boost.type) {
      case 'mentioned':
        salience += params.mentionBoost;
        break;
      case 'edit_target':
        salience += params.editTargetBoost;
        break;
      case 'ui_focus':
        salience += params.uiFocusBoost;
        break;
      case 'ui_selection':
        salience += params.uiSelectionBoost;
        break;
    }
  }

  // Clamp
  return Math.min(params.maxSalience, Math.max(0, salience));
}

/**
 * A salience boost event.
 */
export interface SalienceBoost {
  readonly type: 'mentioned' | 'edit_target' | 'ui_focus' | 'ui_selection';
  readonly turnNumber: number;
}

// =============================================================================
// Anaphora Resolution Interface
// =============================================================================

/**
 * Interface for resolving anaphoric references using the discourse model.
 */
export interface AnaphoraResolver {
  /**
   * Resolve a pronoun ("it", "that", "this", "they").
   *
   * Returns ranked candidates with reasons.
   */
  resolvePronoun(
    pronoun: string,
    state: DiscourseState,
    uiContext: UIContext
  ): readonly AnaphoraCandidate[];

  /**
   * Resolve a definite description ("the chorus", "the pad track").
   *
   * Returns matches from discourse referents and world state.
   */
  resolveDefiniteDescription(
    description: string,
    descriptorType: ReferentType,
    state: DiscourseState,
    uiContext: UIContext
  ): readonly AnaphoraCandidate[];

  /**
   * Resolve a demonstrative ("this section", "these notes", "that edit").
   *
   * Demonstratives are deictic: they require UI selection or focus.
   */
  resolveDemonstrative(
    demonstrative: string,
    entityType: ReferentType | undefined,
    state: DiscourseState,
    uiContext: UIContext
  ): readonly AnaphoraCandidate[];

  /**
   * Resolve "same" / "again" / "do that again".
   *
   * Requires a matching prior edit in the history.
   */
  resolveRepetition(
    state: DiscourseState
  ): readonly AnaphoraCandidate[];
}

/**
 * A candidate resolution for an anaphoric reference.
 */
export interface AnaphoraCandidate {
  /** The referent */
  readonly referent: DiscourseReferent;

  /** Score (higher = better match) */
  readonly score: number;

  /** Why this candidate was selected */
  readonly reason: string;

  /** Source of the resolution */
  readonly source: ResolutionSource;
}

/**
 * Source of an anaphora resolution.
 */
export type ResolutionSource =
  | 'salience'          // Most salient referent
  | 'recency'           // Most recent mention
  | 'ui_focus'          // Currently focused in UI
  | 'ui_selection'      // Currently selected in UI
  | 'type_match'        // Matches by entity type
  | 'description_match' // Matches by description
  | 'edit_history'      // Matches a prior edit
  | 'topic_continuity'  // Inherited from current topic
  | 'qud_context';      // Suggested by QUD

/**
 * UI context for anaphora resolution.
 */
export interface UIContext {
  /** Currently focused entity */
  readonly focusedEntity: { readonly id: string; readonly type: ReferentType; readonly name: string } | undefined;

  /** Currently selected entities */
  readonly selectedEntities: readonly { readonly id: string; readonly type: ReferentType; readonly name: string }[];

  /** Current board ID */
  readonly boardId: string | undefined;

  /** Current deck ID */
  readonly deckId: string | undefined;

  /** Current bar range (viewport) */
  readonly visibleBarRange: readonly [number, number] | undefined;
}

// =============================================================================
// Discourse State Management
// =============================================================================

/**
 * Create an empty discourse state.
 */
export function createEmptyDiscourseState(): DiscourseState {
  return {
    drses: [],
    referents: [],
    segments: [],
    qudStack: [],
    currentTurn: 0,
    commonGround: [],
    editHistory: [],
    userPreferences: [],
    currentTopic: undefined,
  };
}

/**
 * Advance the discourse state to a new turn.
 *
 * This decays salience for all referents and increments the turn counter.
 */
export function advanceTurn(
  state: DiscourseState,
  params: SalienceParams = DEFAULT_SALIENCE_PARAMS
): DiscourseState {
  const newTurn = state.currentTurn + 1;

  const updatedReferents = state.referents.map(ref => {
    const turnsSinceMention = newTurn - ref.lastMentionedTurn;
    const newSalience = computeSalience(ref.salience, turnsSinceMention, [], params);
    return {
      ...ref,
      salience: newSalience,
      inFocus: newSalience > 0.5 && ref.inFocus,
    };
  }).filter(ref => ref.salience >= params.forgetThreshold);

  return {
    ...state,
    currentTurn: newTurn,
    referents: updatedReferents,
  };
}

/**
 * Add a referent to the discourse state.
 */
export function addReferent(
  state: DiscourseState,
  referent: DiscourseReferent
): DiscourseState {
  return {
    ...state,
    referents: [...state.referents, referent],
  };
}

/**
 * Update a referent's salience (e.g., when mentioned).
 */
export function boostReferent(
  state: DiscourseState,
  referentId: ReferentId,
  boost: SalienceBoost,
  params: SalienceParams = DEFAULT_SALIENCE_PARAMS
): DiscourseState {
  const updatedReferents = state.referents.map(ref => {
    if (ref.id !== referentId) return ref;
    const newSalience = computeSalience(ref.salience, 0, [boost], params);
    return {
      ...ref,
      salience: newSalience,
      lastMentionedTurn: boost.turnNumber,
      inFocus: boost.type === 'ui_focus' || boost.type === 'ui_selection' || ref.inFocus,
    };
  });

  return {
    ...state,
    referents: updatedReferents,
  };
}

/**
 * Push a QUD onto the stack.
 */
export function pushQUD(state: DiscourseState, qud: QUD): DiscourseState {
  return {
    ...state,
    qudStack: [qud, ...state.qudStack],
  };
}

/**
 * Pop the top QUD (resolved or abandoned).
 */
export function popQUD(state: DiscourseState): DiscourseState {
  return {
    ...state,
    qudStack: state.qudStack.slice(1),
  };
}

/**
 * Set the current topic.
 */
export function setTopic(
  state: DiscourseState,
  topic: TopicFrame
): DiscourseState {
  return {
    ...state,
    currentTopic: topic,
  };
}

/**
 * Add a fact to the common ground.
 */
export function addToCommonGround(
  state: DiscourseState,
  entry: CommonGroundEntry
): DiscourseState {
  return {
    ...state,
    commonGround: [...state.commonGround, entry],
  };
}

/**
 * Record an edit in the discourse history.
 */
export function recordEdit(
  state: DiscourseState,
  edit: EditHistoryReferent
): DiscourseState {
  return {
    ...state,
    editHistory: [...state.editHistory, edit],
  };
}

/**
 * Get the most salient referent of a given type.
 */
export function getMostSalient(
  state: DiscourseState,
  type: ReferentType | undefined
): DiscourseReferent | undefined {
  const candidates = type
    ? state.referents.filter(r => r.type === type)
    : state.referents;

  if (candidates.length === 0) return undefined;

  return candidates.reduce((best, current) =>
    current.salience > best.salience ? current : best
  );
}

/**
 * Get the salience gap between the top two referents of a type.
 * Used to determine whether a pronoun resolution is confident.
 */
export function getSalienceGap(
  state: DiscourseState,
  type: ReferentType | undefined
): number {
  const candidates = type
    ? state.referents.filter(r => r.type === type)
    : state.referents;

  if (candidates.length < 2) return 1.0; // Only one candidate = maximum confidence

  const sorted = [...candidates].sort((a, b) => b.salience - a.salience);
  const first = sorted[0];
  const second = sorted[1];
  if (!first || !second) return 1.0;
  return first.salience - second.salience;
}
