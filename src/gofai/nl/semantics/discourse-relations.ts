/**
 * GOFAI NL Semantics — Discourse Relations (SDRT-inspired)
 *
 * Implements discourse-level semantic relations inspired by
 * Segmented Discourse Representation Theory (SDRT, Asher & Lascarides 2003).
 *
 * ## Overview
 *
 * When a user says "Make it brighter but keep the melody," the two clauses
 * are linked by a **Contrast** discourse relation. SDRT models discourse
 * as a graph of segments connected by rhetorical relations.
 *
 * In our domain, discourse relations map directly to plan composition:
 *
 * | Discourse Relation | Cue Words              | CPL Mapping                     |
 * |-------------------|------------------------|---------------------------------|
 * | Contrast          | but, however, yet      | Goal + Constraint               |
 * | Narration         | then, after, next      | Sequential plan steps           |
 * | Elaboration       | specifically, i.e.     | Goal refinement                 |
 * | Explanation       | because, since         | Goal + justification            |
 * | Result            | so, therefore          | Constraint → Goal (causal)      |
 * | Parallel          | and, also, as well     | Parallel plan steps             |
 * | Correction        | not X but Y, instead   | Replace goal                    |
 * | Background        | while, during          | Concurrent constraint           |
 * | Concession        | although, even though  | Weak constraint + goal          |
 * | Alternation       | or, alternatively      | Alternative plans               |
 * | Continuation      | and, moreover          | Additional goals                |
 * | Comment           | by the way, btw        | Side preference                 |
 *
 * ## SDRT Segment Types
 *
 * Each "segment" in our discourse model is either:
 * - A **goal segment**: represents an intended change
 * - A **constraint segment**: represents a preservation/limitation
 * - A **preference segment**: represents a style/method preference
 * - A **scope segment**: represents a scope/target specification
 * - A **question segment**: represents a query about the project
 *
 * @module gofai/nl/semantics/discourse-relations
 * @see gofai_goalA.md Step 161
 */

import type { CoordinationType } from './coordination-sequencing';


// =============================================================================
// DISCOURSE RELATIONS — the SDRT relation inventory
// =============================================================================

/**
 * SDRT-inspired discourse relations for music editing commands.
 */
export type DiscourseRelation =
  | 'Contrast'         // "but", "however", "yet" — goal + constraint
  | 'Narration'        // "then", "after", "next" — sequential actions
  | 'Elaboration'      // "specifically", "i.e." — refining a goal
  | 'Explanation'       // "because", "since" — providing reason
  | 'Result'           // "so", "therefore" — consequence
  | 'Parallel'         // "and", "also" — concurrent/independent
  | 'Correction'       // "not X but Y", "instead" — replacing a goal
  | 'Background'       // "while", "during" — ambient constraint
  | 'Concession'       // "although", "even though" — weak constraint
  | 'Alternation'      // "or", "alternatively" — alternatives
  | 'Continuation'     // "and", "moreover" — adding more
  | 'Comment'          // "by the way" — side note
  | 'Condition'        // "if", "when" — conditional
  | 'Precondition'     // "first", "before" — prerequisite
  | 'Consequence'      // "otherwise" — what happens if not
  | 'Restatement';     // "in other words" — paraphrase

/**
 * Properties of discourse relations.
 */
export interface DiscourseRelationProperties {
  /** The relation name */
  readonly relation: DiscourseRelation;

  /** Human-readable description */
  readonly description: string;

  /** Whether the relation is subordinating or coordinating */
  readonly structuralType: 'subordinating' | 'coordinating';

  /** Whether the relation implies a temporal ordering */
  readonly impliesOrdering: boolean;

  /** Whether the relation is veridical (both segments are asserted) */
  readonly veridical: boolean;

  /** The default coordination type this maps to */
  readonly defaultCoordination: CoordinationType;

  /** How the segments compose into CPL */
  readonly cplCompositionType: CPLCompositionType;

  /** Cue words/phrases that signal this relation */
  readonly cueWords: readonly DiscourseRelationCue[];

  /** Semantic constraints on the relation (what segments can fill what roles) */
  readonly constraints: readonly DiscourseRelationConstraint[];
}

/**
 * How discourse segments compose into CPL structures.
 */
export type CPLCompositionType =
  | 'goal_then_constraint'     // First segment = goal, second = constraint
  | 'constraint_then_goal'     // First segment = constraint, second = goal
  | 'sequential_goals'         // Both segments are sequential goals
  | 'parallel_goals'           // Both segments are parallel goals
  | 'goal_refinement'          // Second refines the first
  | 'goal_replacement'         // Second replaces the first
  | 'goal_with_preference'     // First = goal, second = preference
  | 'conditional_goal'         // If first, then second
  | 'alternative_goals'        // Choose one
  | 'goal_with_justification'  // First = goal, second = reason
  | 'independent';             // No composition dependency

/**
 * A cue word or phrase that signals a discourse relation.
 */
export interface DiscourseRelationCue {
  /** The cue word/phrase */
  readonly cue: string;

  /** Part of speech or position */
  readonly position: CuePosition;

  /** How strongly this cue signals the relation (0–1) */
  readonly strength: number;

  /** Whether this cue is sufficient on its own or needs context */
  readonly sufficient: boolean;

  /** Alternative relations this cue could signal (ambiguity) */
  readonly alternativeRelations: readonly DiscourseRelation[];
}

/**
 * Where a cue word appears in the sentence.
 */
export type CuePosition =
  | 'between_clauses'   // "X but Y" — between the two clauses
  | 'clause_initial'    // "However, Y" — at start of second clause
  | 'clause_final'      // "Y though" — at end of clause
  | 'adverbial'         // "also", "instead" — adverb position
  | 'conjunction'       // Standard conjunction position
  | 'correlative';      // "not only X but also Y" — correlative

/**
 * A constraint on what segments can participate in a relation.
 */
export interface DiscourseRelationConstraint {
  /** Which argument of the relation (first or second segment) */
  readonly argument: 'first' | 'second' | 'both';

  /** What type of segment is expected */
  readonly expectedSegmentType: DiscourseSegmentType;

  /** Whether this is required or preferred */
  readonly required: boolean;

  /** Description */
  readonly description: string;
}


// =============================================================================
// DISCOURSE SEGMENTS — the units of discourse
// =============================================================================

/**
 * Types of discourse segments.
 */
export type DiscourseSegmentType =
  | 'goal'             // An intended change (increase brightness)
  | 'constraint'       // A preservation/limitation (keep melody)
  | 'preference'       // A style preference (use minimal changes)
  | 'scope'            // A scope specification (in the chorus)
  | 'question'         // A query (what's the tempo?)
  | 'acknowledgment'   // An acknowledgment (yes, that's right)
  | 'command'          // A direct command (play it, undo)
  | 'evaluation';      // An evaluation (that sounds good)

/**
 * A discourse segment: a unit of meaning in the user's input.
 */
export interface DiscourseSegment {
  /** Unique segment ID */
  readonly id: string;

  /** Segment type */
  readonly segmentType: DiscourseSegmentType;

  /** The text of this segment */
  readonly text: string;

  /** Source span */
  readonly span: { readonly start: number; readonly end: number };

  /** Semantic content (parsed representation of the segment) */
  readonly content: SegmentContent;

  /** Salience: how important this segment is (0–1) */
  readonly salience: number;

  /** Whether this segment is the "main point" of the utterance */
  readonly isMainPoint: boolean;
}

/**
 * The semantic content of a discourse segment.
 */
export type SegmentContent =
  | GoalSegmentContent
  | ConstraintSegmentContent
  | PreferenceSegmentContent
  | ScopeSegmentContent
  | QuestionSegmentContent
  | CommandSegmentContent
  | EvaluationSegmentContent
  | AcknowledgmentSegmentContent;

/**
 * Goal segment content.
 */
export interface GoalSegmentContent {
  readonly kind: 'goal';
  readonly verb: string;
  readonly axis: string | null;
  readonly direction: 'increase' | 'decrease' | 'set' | null;
  readonly target: string | null;
  readonly amount: string | null;
}

/**
 * Constraint segment content.
 */
export interface ConstraintSegmentContent {
  readonly kind: 'constraint';
  readonly verb: string;
  readonly preserveTarget: string;
  readonly preserveMode: 'exact' | 'functional' | 'recognizable' | null;
  readonly strength: 'hard' | 'soft';
}

/**
 * Preference segment content.
 */
export interface PreferenceSegmentContent {
  readonly kind: 'preference';
  readonly description: string;
  readonly weight: number;
}

/**
 * Scope segment content.
 */
export interface ScopeSegmentContent {
  readonly kind: 'scope';
  readonly reference: string;
  readonly scopeType: string;
}

/**
 * Question segment content.
 */
export interface QuestionSegmentContent {
  readonly kind: 'question';
  readonly questionType: 'what' | 'how' | 'why' | 'where' | 'when' | 'which' | 'yes-no';
  readonly topic: string;
}

/**
 * Command segment content.
 */
export interface CommandSegmentContent {
  readonly kind: 'command';
  readonly action: string;
  readonly target: string | null;
}

/**
 * Evaluation segment content.
 */
export interface EvaluationSegmentContent {
  readonly kind: 'evaluation';
  readonly polarity: 'positive' | 'negative' | 'neutral';
  readonly description: string;
}

/**
 * Acknowledgment segment content.
 */
export interface AcknowledgmentSegmentContent {
  readonly kind: 'acknowledgment';
  readonly agreement: boolean;
  readonly text: string;
}


// =============================================================================
// DISCOURSE STRUCTURE — the graph of related segments
// =============================================================================

/**
 * A discourse structure: a graph of segments connected by relations.
 */
export interface DiscourseStructure {
  /** All segments in the discourse */
  readonly segments: readonly DiscourseSegment[];

  /** Relations between segments */
  readonly relations: readonly DiscourseLink[];

  /** The root segment (main point) */
  readonly rootSegmentId: string;

  /** The topic of the discourse */
  readonly topic: string | null;

  /** Overall discourse type */
  readonly discourseType: OverallDiscourseType;
}

/**
 * A link between two discourse segments via a relation.
 */
export interface DiscourseLink {
  /** The relation type */
  readonly relation: DiscourseRelation;

  /** Source segment (usually the first/left clause) */
  readonly sourceSegmentId: string;

  /** Target segment (usually the second/right clause) */
  readonly targetSegmentId: string;

  /** The cue that triggered this relation (if any) */
  readonly cue: string | null;

  /** Confidence in this relation (0–1) */
  readonly confidence: number;

  /** How this link maps to CPL composition */
  readonly cplComposition: CPLCompositionType;
}

/**
 * Overall discourse types.
 */
export type OverallDiscourseType =
  | 'simple_command'       // Single action ("make it brighter")
  | 'compound_command'     // Multiple actions ("brighten and widen")
  | 'constrained_command'  // Action with constraint ("brighten but keep melody")
  | 'qualified_command'    // Action with preference ("brighten, subtly")
  | 'question'             // Query ("what's the tempo?")
  | 'dialogue_act'         // Turn in dialogue ("yes, that sounds good")
  | 'complex_request';     // Multiple relations involved


// =============================================================================
// DISCOURSE RELATION DATABASE — properties of all relations
// =============================================================================

/**
 * Full properties database for all discourse relations.
 */
export const DISCOURSE_RELATION_DB: ReadonlyMap<DiscourseRelation, DiscourseRelationProperties> = new Map([
  ['Contrast', {
    relation: 'Contrast',
    description: 'The second segment contrasts with or constrains the first',
    structuralType: 'coordinating',
    impliesOrdering: false,
    veridical: true,
    defaultCoordination: 'contrastive',
    cplCompositionType: 'goal_then_constraint',
    cueWords: [
      { cue: 'but', position: 'between_clauses', strength: 0.95, sufficient: true, alternativeRelations: ['Concession'] },
      { cue: 'however', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'yet', position: 'between_clauses', strength: 0.8, sufficient: false, alternativeRelations: ['Concession'] },
      { cue: 'while', position: 'between_clauses', strength: 0.6, sufficient: false, alternativeRelations: ['Background'] },
      { cue: 'although', position: 'clause_initial', strength: 0.7, sufficient: false, alternativeRelations: ['Concession'] },
      { cue: 'on the other hand', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'at the same time', position: 'clause_initial', strength: 0.6, sufficient: false, alternativeRelations: ['Background'] },
      { cue: 'without', position: 'between_clauses', strength: 0.85, sufficient: true, alternativeRelations: [] },
      { cue: 'except', position: 'between_clauses', strength: 0.85, sufficient: true, alternativeRelations: [] },
    ],
    constraints: [
      { argument: 'first', expectedSegmentType: 'goal', required: true, description: 'First segment should be a goal/action' },
      { argument: 'second', expectedSegmentType: 'constraint', required: true, description: 'Second segment should be a constraint' },
    ],
  }],

  ['Narration', {
    relation: 'Narration',
    description: 'Segments describe sequential actions',
    structuralType: 'coordinating',
    impliesOrdering: true,
    veridical: true,
    defaultCoordination: 'sequential',
    cplCompositionType: 'sequential_goals',
    cueWords: [
      { cue: 'then', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'after', position: 'clause_initial', strength: 0.8, sufficient: false, alternativeRelations: ['Background'] },
      { cue: 'next', position: 'clause_initial', strength: 0.85, sufficient: true, alternativeRelations: [] },
      { cue: 'and then', position: 'between_clauses', strength: 0.95, sufficient: true, alternativeRelations: [] },
      { cue: 'afterwards', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'followed by', position: 'between_clauses', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'once that\'s done', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
    ],
    constraints: [
      { argument: 'both', expectedSegmentType: 'goal', required: true, description: 'Both segments should be goals/actions' },
    ],
  }],

  ['Elaboration', {
    relation: 'Elaboration',
    description: 'The second segment refines or provides detail about the first',
    structuralType: 'subordinating',
    impliesOrdering: false,
    veridical: true,
    defaultCoordination: 'elaborative',
    cplCompositionType: 'goal_refinement',
    cueWords: [
      { cue: 'specifically', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'in particular', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'meaning', position: 'between_clauses', strength: 0.8, sufficient: true, alternativeRelations: ['Restatement'] },
      { cue: 'that is', position: 'clause_initial', strength: 0.7, sufficient: false, alternativeRelations: ['Restatement'] },
      { cue: 'i.e.', position: 'clause_initial', strength: 0.8, sufficient: true, alternativeRelations: ['Restatement'] },
      { cue: 'especially', position: 'adverbial', strength: 0.7, sufficient: false, alternativeRelations: [] },
      { cue: 'like', position: 'between_clauses', strength: 0.5, sufficient: false, alternativeRelations: [] },
    ],
    constraints: [
      { argument: 'second', expectedSegmentType: 'goal', required: false, description: 'Second segment refines the first' },
    ],
  }],

  ['Explanation', {
    relation: 'Explanation',
    description: 'The second segment explains why the first is desired',
    structuralType: 'subordinating',
    impliesOrdering: false,
    veridical: true,
    defaultCoordination: 'causal',
    cplCompositionType: 'goal_with_justification',
    cueWords: [
      { cue: 'because', position: 'between_clauses', strength: 0.95, sufficient: true, alternativeRelations: [] },
      { cue: 'since', position: 'clause_initial', strength: 0.8, sufficient: false, alternativeRelations: ['Background'] },
      { cue: 'as', position: 'clause_initial', strength: 0.5, sufficient: false, alternativeRelations: ['Background'] },
      { cue: 'the reason is', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'due to', position: 'clause_initial', strength: 0.85, sufficient: true, alternativeRelations: [] },
    ],
    constraints: [
      { argument: 'first', expectedSegmentType: 'goal', required: true, description: 'First segment should be a goal/action' },
    ],
  }],

  ['Result', {
    relation: 'Result',
    description: 'The second segment is a consequence of the first',
    structuralType: 'coordinating',
    impliesOrdering: true,
    veridical: true,
    defaultCoordination: 'causal',
    cplCompositionType: 'sequential_goals',
    cueWords: [
      { cue: 'so', position: 'clause_initial', strength: 0.7, sufficient: false, alternativeRelations: ['Explanation'] },
      { cue: 'therefore', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'so that', position: 'between_clauses', strength: 0.85, sufficient: true, alternativeRelations: [] },
      { cue: 'in order to', position: 'between_clauses', strength: 0.85, sufficient: true, alternativeRelations: [] },
      { cue: 'which will', position: 'between_clauses', strength: 0.7, sufficient: false, alternativeRelations: ['Elaboration'] },
    ],
    constraints: [],
  }],

  ['Parallel', {
    relation: 'Parallel',
    description: 'Segments describe independent concurrent actions',
    structuralType: 'coordinating',
    impliesOrdering: false,
    veridical: true,
    defaultCoordination: 'parallel',
    cplCompositionType: 'parallel_goals',
    cueWords: [
      { cue: 'and', position: 'between_clauses', strength: 0.6, sufficient: false, alternativeRelations: ['Continuation', 'Narration'] },
      { cue: 'also', position: 'adverbial', strength: 0.7, sufficient: false, alternativeRelations: ['Continuation'] },
      { cue: 'as well', position: 'clause_final', strength: 0.7, sufficient: true, alternativeRelations: [] },
      { cue: 'at the same time', position: 'clause_initial', strength: 0.8, sufficient: true, alternativeRelations: ['Background'] },
      { cue: 'simultaneously', position: 'adverbial', strength: 0.9, sufficient: true, alternativeRelations: [] },
    ],
    constraints: [],
  }],

  ['Correction', {
    relation: 'Correction',
    description: 'The second segment corrects/replaces the first',
    structuralType: 'coordinating',
    impliesOrdering: false,
    veridical: false,
    defaultCoordination: 'corrective',
    cplCompositionType: 'goal_replacement',
    cueWords: [
      { cue: 'instead', position: 'adverbial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'rather', position: 'adverbial', strength: 0.8, sufficient: false, alternativeRelations: ['Contrast'] },
      { cue: 'not X but Y', position: 'between_clauses', strength: 0.95, sufficient: true, alternativeRelations: [] },
      { cue: 'actually', position: 'clause_initial', strength: 0.7, sufficient: false, alternativeRelations: [] },
      { cue: 'wait', position: 'clause_initial', strength: 0.6, sufficient: false, alternativeRelations: [] },
      { cue: 'never mind', position: 'clause_initial', strength: 0.8, sufficient: true, alternativeRelations: [] },
    ],
    constraints: [
      { argument: 'first', expectedSegmentType: 'goal', required: true, description: 'First segment is the goal being replaced' },
      { argument: 'second', expectedSegmentType: 'goal', required: true, description: 'Second segment is the replacement goal' },
    ],
  }],

  ['Background', {
    relation: 'Background',
    description: 'The second segment provides ambient context/constraint',
    structuralType: 'subordinating',
    impliesOrdering: false,
    veridical: true,
    defaultCoordination: 'concurrent',
    cplCompositionType: 'goal_then_constraint',
    cueWords: [
      { cue: 'while', position: 'clause_initial', strength: 0.7, sufficient: false, alternativeRelations: ['Contrast'] },
      { cue: 'during', position: 'clause_initial', strength: 0.7, sufficient: true, alternativeRelations: [] },
      { cue: 'as long as', position: 'between_clauses', strength: 0.8, sufficient: true, alternativeRelations: ['Condition'] },
      { cue: 'keeping', position: 'between_clauses', strength: 0.7, sufficient: false, alternativeRelations: ['Contrast'] },
      { cue: 'with', position: 'between_clauses', strength: 0.4, sufficient: false, alternativeRelations: [] },
    ],
    constraints: [],
  }],

  ['Concession', {
    relation: 'Concession',
    description: 'The second segment concedes something that might conflict with the first',
    structuralType: 'subordinating',
    impliesOrdering: false,
    veridical: true,
    defaultCoordination: 'contrastive',
    cplCompositionType: 'goal_then_constraint',
    cueWords: [
      { cue: 'although', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: ['Contrast'] },
      { cue: 'even though', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'despite', position: 'clause_initial', strength: 0.85, sufficient: true, alternativeRelations: [] },
      { cue: 'even if', position: 'clause_initial', strength: 0.8, sufficient: true, alternativeRelations: ['Condition'] },
      { cue: 'granted', position: 'clause_initial', strength: 0.7, sufficient: false, alternativeRelations: [] },
    ],
    constraints: [
      { argument: 'second', expectedSegmentType: 'constraint', required: false, description: 'Second segment is typically a conceded constraint' },
    ],
  }],

  ['Alternation', {
    relation: 'Alternation',
    description: 'Segments present alternatives',
    structuralType: 'coordinating',
    impliesOrdering: false,
    veridical: false,
    defaultCoordination: 'alternative',
    cplCompositionType: 'alternative_goals',
    cueWords: [
      { cue: 'or', position: 'between_clauses', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'alternatively', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'either', position: 'correlative', strength: 0.85, sufficient: false, alternativeRelations: [] },
      { cue: 'otherwise', position: 'clause_initial', strength: 0.7, sufficient: false, alternativeRelations: ['Consequence'] },
    ],
    constraints: [],
  }],

  ['Continuation', {
    relation: 'Continuation',
    description: 'The second segment adds more of the same',
    structuralType: 'coordinating',
    impliesOrdering: false,
    veridical: true,
    defaultCoordination: 'additive',
    cplCompositionType: 'parallel_goals',
    cueWords: [
      { cue: 'and', position: 'between_clauses', strength: 0.5, sufficient: false, alternativeRelations: ['Parallel', 'Narration'] },
      { cue: 'moreover', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'furthermore', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'in addition', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'plus', position: 'between_clauses', strength: 0.7, sufficient: false, alternativeRelations: [] },
      { cue: 'too', position: 'clause_final', strength: 0.6, sufficient: false, alternativeRelations: [] },
    ],
    constraints: [],
  }],

  ['Comment', {
    relation: 'Comment',
    description: 'A side note or meta-comment',
    structuralType: 'subordinating',
    impliesOrdering: false,
    veridical: true,
    defaultCoordination: 'additive',
    cplCompositionType: 'goal_with_preference',
    cueWords: [
      { cue: 'by the way', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'btw', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'oh', position: 'clause_initial', strength: 0.4, sufficient: false, alternativeRelations: [] },
      { cue: 'incidentally', position: 'clause_initial', strength: 0.85, sufficient: true, alternativeRelations: [] },
    ],
    constraints: [],
  }],

  ['Condition', {
    relation: 'Condition',
    description: 'The second segment is conditional on the first',
    structuralType: 'subordinating',
    impliesOrdering: false,
    veridical: false,
    defaultCoordination: 'conditional',
    cplCompositionType: 'conditional_goal',
    cueWords: [
      { cue: 'if', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: [] },
      { cue: 'when', position: 'clause_initial', strength: 0.6, sufficient: false, alternativeRelations: ['Background'] },
      { cue: 'unless', position: 'between_clauses', strength: 0.85, sufficient: true, alternativeRelations: [] },
      { cue: 'provided', position: 'clause_initial', strength: 0.8, sufficient: true, alternativeRelations: [] },
      { cue: 'in case', position: 'clause_initial', strength: 0.8, sufficient: true, alternativeRelations: [] },
    ],
    constraints: [],
  }],

  ['Precondition', {
    relation: 'Precondition',
    description: 'The first segment must happen before the second',
    structuralType: 'subordinating',
    impliesOrdering: true,
    veridical: true,
    defaultCoordination: 'sequential',
    cplCompositionType: 'sequential_goals',
    cueWords: [
      { cue: 'first', position: 'clause_initial', strength: 0.8, sufficient: false, alternativeRelations: ['Narration'] },
      { cue: 'before', position: 'between_clauses', strength: 0.85, sufficient: true, alternativeRelations: [] },
      { cue: 'make sure', position: 'clause_initial', strength: 0.7, sufficient: false, alternativeRelations: [] },
      { cue: 'start by', position: 'clause_initial', strength: 0.8, sufficient: true, alternativeRelations: [] },
    ],
    constraints: [],
  }],

  ['Consequence', {
    relation: 'Consequence',
    description: 'The second segment describes what happens if the first is not done',
    structuralType: 'subordinating',
    impliesOrdering: false,
    veridical: false,
    defaultCoordination: 'conditional',
    cplCompositionType: 'conditional_goal',
    cueWords: [
      { cue: 'otherwise', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: ['Alternation'] },
      { cue: 'or else', position: 'between_clauses', strength: 0.85, sufficient: true, alternativeRelations: [] },
    ],
    constraints: [],
  }],

  ['Restatement', {
    relation: 'Restatement',
    description: 'The second segment paraphrases the first',
    structuralType: 'subordinating',
    impliesOrdering: false,
    veridical: true,
    defaultCoordination: 'elaborative',
    cplCompositionType: 'goal_refinement',
    cueWords: [
      { cue: 'in other words', position: 'clause_initial', strength: 0.95, sufficient: true, alternativeRelations: [] },
      { cue: 'that is to say', position: 'clause_initial', strength: 0.9, sufficient: true, alternativeRelations: ['Elaboration'] },
      { cue: 'basically', position: 'clause_initial', strength: 0.5, sufficient: false, alternativeRelations: ['Elaboration'] },
      { cue: 'I mean', position: 'clause_initial', strength: 0.7, sufficient: false, alternativeRelations: ['Correction'] },
    ],
    constraints: [],
  }],
]);


// =============================================================================
// CUE WORD INDEX — fast lookup from cue word to relation(s)
// =============================================================================

/**
 * Index of cue words to the discourse relations they signal.
 */
export interface CueMatch {
  /** The matched cue */
  readonly cue: DiscourseRelationCue;

  /** The relation this cue signals */
  readonly relation: DiscourseRelation;

  /** Properties of the relation */
  readonly properties: DiscourseRelationProperties;
}

/**
 * Index of all cue words for fast lookup.
 */
export const CUE_WORD_INDEX: ReadonlyMap<string, readonly CueMatch[]> = buildCueWordIndex();

function buildCueWordIndex(): ReadonlyMap<string, readonly CueMatch[]> {
  const index = new Map<string, CueMatch[]>();

  for (const [relation, props] of DISCOURSE_RELATION_DB) {
    for (const cue of props.cueWords) {
      const key = cue.cue.toLowerCase();
      const existing = index.get(key);
      const match: CueMatch = { cue, relation, properties: props };
      if (existing) {
        existing.push(match);
      } else {
        index.set(key, [match]);
      }
    }
  }

  // Sort each list by cue strength
  for (const matches of index.values()) {
    matches.sort((a, b) => b.cue.strength - a.cue.strength);
  }

  return index;
}


// =============================================================================
// DISCOURSE RELATION DETECTION — finding relations in text
// =============================================================================

/**
 * Result of detecting discourse relations in a text.
 */
export interface DiscourseRelationDetection {
  /** Detected relations (ordered by confidence) */
  readonly detections: readonly DetectedRelation[];

  /** Best (highest-confidence) relation */
  readonly bestRelation: DiscourseRelation | null;

  /** Whether any relation was detected */
  readonly found: boolean;
}

/**
 * A single detected discourse relation.
 */
export interface DetectedRelation {
  /** The detected relation */
  readonly relation: DiscourseRelation;

  /** The cue that triggered detection */
  readonly cue: string;

  /** Position of the cue in the text */
  readonly cuePosition: number;

  /** Confidence */
  readonly confidence: number;

  /** The composition type this implies */
  readonly cplComposition: CPLCompositionType;
}

/**
 * Detect discourse relations from cue words in a text.
 */
export function detectDiscourseRelations(text: string): DiscourseRelationDetection {
  const normalizedText = text.toLowerCase();
  const detections: DetectedRelation[] = [];

  for (const [cueKey, matches] of CUE_WORD_INDEX) {
    const idx = normalizedText.indexOf(cueKey);
    if (idx === -1) continue;

    // Check it's a word boundary match (not part of a longer word)
    const before = idx > 0 ? normalizedText[idx - 1] : ' ';
    const after = idx + cueKey.length < normalizedText.length
      ? normalizedText[idx + cueKey.length]
      : ' ';

    if (before && after && /\s|[,;.!?]/.test(before) && /\s|[,;.!?]/.test(after)) {
      for (const match of matches) {
        detections.push({
          relation: match.relation,
          cue: cueKey,
          cuePosition: idx,
          confidence: match.cue.strength,
          cplComposition: match.properties.cplCompositionType,
        });
      }
    }
  }

  // Sort by confidence
  detections.sort((a, b) => b.confidence - a.confidence);

  return {
    detections,
    bestRelation: detections.length > 0 ? detections[0].relation : null,
    found: detections.length > 0,
  };
}


// =============================================================================
// CONTRAST-SPECIFIC SEMANTICS — deep analysis of "but" constructions
// =============================================================================

/**
 * A fully analyzed contrast construction.
 * "Make it brighter but keep the melody" → ContrastAnalysis
 */
export interface ContrastAnalysis {
  /** The goal segment (what to achieve) */
  readonly goalSegment: DiscourseSegment;

  /** The constraint segment (what to preserve) */
  readonly constraintSegment: DiscourseSegment;

  /** The type of contrast */
  readonly contrastType: ContrastType;

  /** How hard the constraint is */
  readonly constraintStrength: 'hard' | 'soft';

  /** Whether the constraint is the main point (marked focus) */
  readonly constraintIsMainPoint: boolean;

  /** The discourse relation (usually Contrast, sometimes Concession) */
  readonly discourseRelation: DiscourseRelation;

  /** Expected tensions between the goal and constraint */
  readonly expectedTensions: readonly ContrastTension[];
}

/**
 * Types of contrast in "but" constructions.
 */
export type ContrastType =
  | 'denial_of_expectation'  // "Make it loud but don't clip" (the constraint prevents a default consequence)
  | 'semantic_opposition'     // "Make it brighter but darker" (directly opposed goals — error or creative intent)
  | 'scope_restriction'       // "Change everything but the drums" (constraint restricts scope)
  | 'method_restriction'      // "Make it louder but don't use compression" (constraint restricts method)
  | 'degree_restriction'      // "Brighten it but only slightly" (constraint restricts amount)
  | 'preservation'            // "Make it brighter but keep the warmth" (preserve an axis while changing another)
  | 'exception';              // "Apply to all layers but not the vocals" (exception from scope)

/**
 * Expected tension between a goal and its contrasting constraint.
 */
export interface ContrastTension {
  /** What axis/property is in tension */
  readonly axis: string;

  /** How the goal affects this axis */
  readonly goalEffect: 'increase' | 'decrease' | 'modify';

  /** How the constraint restricts this axis */
  readonly constraintEffect: 'preserve' | 'limit' | 'exclude';

  /** Severity of the tension (how hard it is to satisfy both) */
  readonly severity: 'none' | 'mild' | 'moderate' | 'severe' | 'contradictory';

  /** Description */
  readonly description: string;
}

/**
 * Analyze a "but" construction to extract the contrast structure.
 */
export function analyzeContrast(
  goalSegment: DiscourseSegment,
  constraintSegment: DiscourseSegment,
  cue: string,
): ContrastAnalysis {
  // Determine contrast type based on segment content
  const contrastType = inferContrastType(goalSegment, constraintSegment);

  // Determine constraint strength: "but" usually implies hard constraint
  const constraintStrength: 'hard' | 'soft' =
    cue === 'although' || cue === 'even though' ? 'soft' : 'hard';

  // Determine main point: in "X but Y", Y is usually the main point
  // (it's the new/surprising information)
  const constraintIsMainPoint = cue === 'but' || cue === 'however';

  // Determine discourse relation
  const discourseRelation: DiscourseRelation =
    cue === 'although' || cue === 'even though' ? 'Concession' : 'Contrast';

  // Detect expected tensions
  const expectedTensions = detectContrastTensions(goalSegment, constraintSegment);

  return {
    goalSegment,
    constraintSegment,
    contrastType,
    constraintStrength,
    constraintIsMainPoint,
    discourseRelation,
    expectedTensions,
  };
}

/**
 * Infer the contrast type from segment content.
 */
function inferContrastType(
  goalSeg: DiscourseSegment,
  constraintSeg: DiscourseSegment,
): ContrastType {
  const goalContent = goalSeg.content;
  const constraintContent = constraintSeg.content;

  // Check for scope restriction: "change everything but the drums"
  if (constraintContent.kind === 'scope') {
    return 'scope_restriction';
  }

  // Check for preservation: "brighten but keep the warmth"
  if (constraintContent.kind === 'constraint' && constraintContent.verb === 'keep') {
    return 'preservation';
  }

  // Check for method restriction: "make it louder but don't use compression"
  if (constraintContent.kind === 'constraint' &&
      constraintContent.preserveTarget.includes('method') ||
      (constraintContent.kind === 'preference')) {
    return 'method_restriction';
  }

  // Check for degree restriction: "brighten but only slightly"
  if (constraintContent.kind === 'preference' ||
      (constraintContent.kind === 'constraint' &&
       constraintContent.preserveTarget.includes('amount'))) {
    return 'degree_restriction';
  }

  // Check for semantic opposition: both are goals with opposite directions
  if (goalContent.kind === 'goal' && constraintContent.kind === 'goal') {
    if (goalContent.axis && constraintContent.kind === 'goal' &&
        goalContent.axis === (constraintContent as GoalSegmentContent).axis) {
      return 'semantic_opposition';
    }
  }

  // Default: denial of expectation
  return 'denial_of_expectation';
}

/**
 * Detect expected tensions between a goal and constraint.
 */
function detectContrastTensions(
  goalSeg: DiscourseSegment,
  constraintSeg: DiscourseSegment,
): readonly ContrastTension[] {
  const tensions: ContrastTension[] = [];
  const goalContent = goalSeg.content;
  const constraintContent = constraintSeg.content;

  if (goalContent.kind === 'goal' && constraintContent.kind === 'constraint') {
    // If the goal's axis is related to the preserved target, there may be tension
    if (goalContent.axis) {
      tensions.push({
        axis: goalContent.axis,
        goalEffect: goalContent.direction === 'decrease' ? 'decrease' : 'increase',
        constraintEffect: 'preserve',
        severity: 'mild',
        description: `Goal to ${goalContent.direction ?? 'modify'} ${goalContent.axis} may affect preserved "${constraintContent.preserveTarget}"`,
      });
    }
  }

  if (goalContent.kind === 'goal' && constraintContent.kind === 'goal') {
    // Two goals that may conflict
    const gc = constraintContent as GoalSegmentContent;
    if (goalContent.axis && gc.axis && goalContent.axis === gc.axis) {
      if (goalContent.direction !== gc.direction) {
        tensions.push({
          axis: goalContent.axis,
          goalEffect: goalContent.direction === 'decrease' ? 'decrease' : 'increase',
          constraintEffect: 'limit',
          severity: 'severe',
          description: `Conflicting directions on axis "${goalContent.axis}": ${goalContent.direction} vs ${gc.direction}`,
        });
      }
    }
  }

  return tensions;
}


// =============================================================================
// DISCOURSE STRUCTURE BUILDER — building the full discourse structure
// =============================================================================

/**
 * Build a discourse structure from a list of segments and detected relations.
 */
export function buildDiscourseStructure(
  segments: readonly DiscourseSegment[],
  relations: readonly DiscourseLink[],
): DiscourseStructure {
  // Find the root (main point) segment
  const mainPointSegment = segments.find(s => s.isMainPoint);
  const rootId = mainPointSegment ? mainPointSegment.id : (segments.length > 0 ? segments[0].id : '');

  // Determine overall discourse type
  const discourseType = inferOverallDiscourseType(segments, relations);

  return {
    segments,
    relations,
    rootSegmentId: rootId,
    topic: null,
    discourseType,
  };
}

/**
 * Infer the overall discourse type from segments and relations.
 */
function inferOverallDiscourseType(
  segments: readonly DiscourseSegment[],
  relations: readonly DiscourseLink[],
): OverallDiscourseType {
  if (segments.length === 1) {
    const seg = segments[0];
    if (seg && seg.segmentType === 'question') return 'question';
    if (seg && seg.segmentType === 'command') return 'simple_command';
    if (seg && (seg.segmentType === 'acknowledgment' || seg.segmentType === 'evaluation')) return 'dialogue_act';
    return 'simple_command';
  }

  const hasContrast = relations.some(r =>
    r.relation === 'Contrast' || r.relation === 'Concession');
  if (hasContrast) return 'constrained_command';

  const hasPreference = segments.some(s => s.segmentType === 'preference');
  if (hasPreference) return 'qualified_command';

  if (relations.length > 2) return 'complex_request';

  return 'compound_command';
}


// =============================================================================
// STATISTICS AND FORMATTING
// =============================================================================

/**
 * Compute statistics about the discourse relation database.
 */
export function computeDiscourseStats(): {
  readonly totalRelations: number;
  readonly totalCueWords: number;
  readonly subordinatingCount: number;
  readonly coordinatingCount: number;
  readonly avgCuesPerRelation: number;
} {
  let totalCues = 0;
  let subordinating = 0;
  let coordinating = 0;

  for (const props of DISCOURSE_RELATION_DB.values()) {
    totalCues += props.cueWords.length;
    if (props.structuralType === 'subordinating') subordinating++;
    else coordinating++;
  }

  const totalRelations = DISCOURSE_RELATION_DB.size;
  return {
    totalRelations,
    totalCueWords: totalCues,
    subordinatingCount: subordinating,
    coordinatingCount: coordinating,
    avgCuesPerRelation: totalRelations > 0 ? totalCues / totalRelations : 0,
  };
}

/**
 * Format discourse structure as a human-readable string.
 */
export function formatDiscourseStructure(structure: DiscourseStructure): string {
  const lines: string[] = [
    `=== Discourse Structure (${structure.discourseType}) ===`,
    `Segments: ${structure.segments.length}`,
    `Relations: ${structure.relations.length}`,
    `Root: ${structure.rootSegmentId}`,
    '',
  ];

  for (const seg of structure.segments) {
    const marker = seg.id === structure.rootSegmentId ? '→ ' : '  ';
    lines.push(`${marker}[${seg.id}] (${seg.segmentType}) "${seg.text}"`);
  }

  if (structure.relations.length > 0) {
    lines.push('', 'Relations:');
    for (const rel of structure.relations) {
      lines.push(`  ${rel.sourceSegmentId} --[${rel.relation}]--> ${rel.targetSegmentId} (${(rel.confidence * 100).toFixed(0)}%)`);
    }
  }

  return lines.join('\n');
}
