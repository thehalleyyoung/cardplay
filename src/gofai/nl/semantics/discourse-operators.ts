/**
 * GOFAI NL Semantics — Discourse Operators
 *
 * Implements discourse-level semantic operators that modify how goals
 * and constraints compose in plan formation:
 *
 * ## Step 162: Sequencing Semantics
 * "then/after/before" → plan composition constraints (order in CPL-Plan)
 *
 * ## Step 163: "Only" Semantics
 * Focus-sensitive operator that restricts allowed change targets
 *
 * ## Step 164: "Still" and "Again" Semantics
 * Presuppositions about prior states/edits (ties into edit history)
 *
 * ## Step 165: "Keep X the Same"
 * `preserve(X, exact)` by default, with optional relaxation
 *
 * ## Linguistic Background
 *
 * These operators come from different linguistic traditions:
 *
 * - **Sequencing** (Narration relation in SDRT):
 *   "Make it brighter, then add reverb" → ordered plan steps
 *   Temporal adverbs and conjunctions impose strict ordering.
 *
 * - **Focus sensitivity** (Rooth 1985, Alternative Semantics):
 *   "Only change the EQ" → ONLY(change, {EQ})
 *   "Only" restricts the set of affected entities to the focus.
 *   The complement (non-focused entities) are implicitly preserved.
 *
 * - **Presuppositional particles** (Heim 1990):
 *   "Still" → presupposes a prior state that continues
 *   "Again" → presupposes a prior event that is being repeated
 *   These tie into the edit history and project state.
 *
 * - **Preservation operators** (domain-specific):
 *   "Keep X the same" → preserve(X, exact)
 *   Specialized form of constraint generation with mode selection.
 *
 * @module gofai/nl/semantics/discourse-operators
 * @see gofai_goalA.md Steps 162–165
 */

// =============================================================================
// STEP 162: SEQUENCING SEMANTICS
// =============================================================================

/**
 * A temporal ordering constraint on plan steps.
 */
export interface SequencingConstraint {
  /** Unique ID */
  readonly id: string;

  /** The type of sequencing */
  readonly sequenceType: SequenceType;

  /** The earlier step (source) */
  readonly beforeStepRef: string;

  /** The later step (target) */
  readonly afterStepRef: string;

  /** Whether the ordering is strict (must be immediate) or loose (eventually) */
  readonly strict: boolean;

  /** The cue word that triggered this constraint */
  readonly cueWord: string;

  /** Whether there can be intervening steps between the two */
  readonly allowInterveningSteps: boolean;

  /** Source span of the cue */
  readonly sourceSpan: { readonly start: number; readonly end: number } | null;

  /** Confidence */
  readonly confidence: number;
}

/**
 * Types of temporal sequencing.
 */
export type SequenceType =
  | 'strict_before'     // "first X, then Y" — X must complete before Y starts
  | 'loose_before'      // "X before Y" — X should come first, but others can intervene
  | 'immediately_after' // "right after X, Y" — Y immediately follows X
  | 'eventually_after'  // "after X, Y" — Y follows X at some point
  | 'simultaneous'      // "X while Y" — X and Y happen together
  | 'interleaved'       // "alternate between X and Y" — interleaved execution
  | 'iterative'         // "keep doing X until Y" — repeated execution
  | 'conditional_order'; // "X, and if that works, Y" — conditional sequence

/**
 * A sequencing cue: a word/phrase that triggers sequencing.
 */
export interface SequencingCue {
  /** The cue word/phrase */
  readonly cue: string;

  /** The sequence type it implies */
  readonly sequenceType: SequenceType;

  /** Whether the cue reverses the natural order (e.g., "before" puts Y first) */
  readonly reversesOrder: boolean;

  /** How strictly the ordering is enforced */
  readonly strictness: 'strict' | 'loose' | 'context-dependent';

  /** Confidence that this cue implies sequencing (0–1) */
  readonly confidence: number;

  /** Example usage */
  readonly example: string;
}

/**
 * Database of sequencing cues.
 */
export const SEQUENCING_CUES: readonly SequencingCue[] = [
  // Strict ordering
  { cue: 'then', sequenceType: 'strict_before', reversesOrder: false, strictness: 'strict', confidence: 0.9, example: 'Brighten the mix, then add reverb' },
  { cue: 'and then', sequenceType: 'strict_before', reversesOrder: false, strictness: 'strict', confidence: 0.95, example: 'EQ the vocals and then compress' },
  { cue: 'first', sequenceType: 'strict_before', reversesOrder: false, strictness: 'strict', confidence: 0.9, example: 'First fix the timing, then adjust levels' },
  { cue: 'next', sequenceType: 'strict_before', reversesOrder: false, strictness: 'strict', confidence: 0.85, example: 'Next, add some reverb' },
  { cue: 'followed by', sequenceType: 'strict_before', reversesOrder: false, strictness: 'strict', confidence: 0.9, example: 'Compression followed by limiting' },
  { cue: 'afterwards', sequenceType: 'strict_before', reversesOrder: false, strictness: 'strict', confidence: 0.9, example: 'Fix the pitch, afterwards add vibrato' },

  // Loose ordering
  { cue: 'before', sequenceType: 'loose_before', reversesOrder: true, strictness: 'loose', confidence: 0.85, example: 'Before we master, let\'s fix the mix' },
  { cue: 'after', sequenceType: 'eventually_after', reversesOrder: false, strictness: 'loose', confidence: 0.85, example: 'After EQ, apply compression' },
  { cue: 'once', sequenceType: 'eventually_after', reversesOrder: true, strictness: 'loose', confidence: 0.8, example: 'Once the drums sound right, add the bass' },
  { cue: 'when', sequenceType: 'conditional_order', reversesOrder: true, strictness: 'context-dependent', confidence: 0.6, example: 'When the levels are balanced, export' },

  // Immediate
  { cue: 'right after', sequenceType: 'immediately_after', reversesOrder: false, strictness: 'strict', confidence: 0.95, example: 'Right after the EQ, add compression' },
  { cue: 'immediately after', sequenceType: 'immediately_after', reversesOrder: false, strictness: 'strict', confidence: 0.95, example: 'Immediately after bouncing, re-import' },
  { cue: 'straight after', sequenceType: 'immediately_after', reversesOrder: false, strictness: 'strict', confidence: 0.9, example: 'Straight after the compressor, add limiting' },

  // Simultaneous
  { cue: 'while', sequenceType: 'simultaneous', reversesOrder: false, strictness: 'context-dependent', confidence: 0.7, example: 'While playing, adjust the reverb' },
  { cue: 'at the same time', sequenceType: 'simultaneous', reversesOrder: false, strictness: 'strict', confidence: 0.85, example: 'At the same time, pan the guitars' },
  { cue: 'simultaneously', sequenceType: 'simultaneous', reversesOrder: false, strictness: 'strict', confidence: 0.9, example: 'Simultaneously boost the highs and cut the lows' },
  { cue: 'together', sequenceType: 'simultaneous', reversesOrder: false, strictness: 'loose', confidence: 0.7, example: 'Process them together' },

  // Iterative
  { cue: 'until', sequenceType: 'iterative', reversesOrder: false, strictness: 'strict', confidence: 0.85, example: 'Keep adjusting until it sounds right' },
  { cue: 'repeatedly', sequenceType: 'iterative', reversesOrder: false, strictness: 'loose', confidence: 0.8, example: 'Repeatedly nudge the timing' },

  // Conditional
  { cue: 'if', sequenceType: 'conditional_order', reversesOrder: false, strictness: 'context-dependent', confidence: 0.7, example: 'If the mix is too bright, pull back the highs' },
  { cue: 'in case', sequenceType: 'conditional_order', reversesOrder: false, strictness: 'context-dependent', confidence: 0.75, example: 'In case it clips, reduce the gain' },
];

/**
 * A plan step ordering derived from sequencing constraints.
 */
export interface PlanStepOrder {
  /** Steps in execution order */
  readonly orderedSteps: readonly PlanStepRef[];

  /** Ordering constraints between steps */
  readonly orderingConstraints: readonly SequencingConstraint[];

  /** Steps that can execute in parallel */
  readonly parallelGroups: readonly ParallelGroup[];

  /** Whether the ordering is fully determined or has degrees of freedom */
  readonly fullyOrdered: boolean;
}

/**
 * A reference to a plan step.
 */
export interface PlanStepRef {
  /** Step ID */
  readonly stepId: string;

  /** Step description */
  readonly description: string;

  /** Position in sequence (0-based) */
  readonly position: number;

  /** Dependencies (step IDs that must complete first) */
  readonly dependsOn: readonly string[];
}

/**
 * A group of steps that can execute in parallel.
 */
export interface ParallelGroup {
  /** Group ID */
  readonly groupId: string;

  /** Steps in this group */
  readonly stepIds: readonly string[];

  /** What comes after this group */
  readonly successorGroupId: string | null;
}

/**
 * Build plan step ordering from sequencing constraints.
 */
export function buildPlanStepOrder(
  steps: readonly PlanStepRef[],
  constraints: readonly SequencingConstraint[],
): PlanStepOrder {
  // Build dependency graph
  const deps = new Map<string, Set<string>>();
  for (const step of steps) {
    deps.set(step.stepId, new Set(step.dependsOn));
  }

  // Add dependencies from sequencing constraints
  for (const constraint of constraints) {
    const afterDeps = deps.get(constraint.afterStepRef);
    if (afterDeps) {
      afterDeps.add(constraint.beforeStepRef);
    }
  }

  // Topological sort
  const ordered: PlanStepRef[] = [];
  const visited = new Set<string>();
  const inProgress = new Set<string>();

  function visit(stepId: string): void {
    if (visited.has(stepId)) return;
    if (inProgress.has(stepId)) return; // Cycle — skip
    inProgress.add(stepId);

    const stepDeps = deps.get(stepId);
    if (stepDeps) {
      for (const dep of stepDeps) {
        visit(dep);
      }
    }

    inProgress.delete(stepId);
    visited.add(stepId);

    const step = steps.find(s => s.stepId === stepId);
    if (step) {
      ordered.push({ ...step, position: ordered.length });
    }
  }

  for (const step of steps) {
    visit(step.stepId);
  }

  // Find parallel groups (steps with same set of predecessors)
  const parallelGroups: ParallelGroup[] = [];
  const grouped = new Set<string>();

  for (let i = 0; i < ordered.length; i++) {
    const step = ordered[i];
    if (!step || grouped.has(step.stepId)) continue;

    const group: string[] = [step.stepId];
    grouped.add(step.stepId);

    for (let j = i + 1; j < ordered.length; j++) {
      const other = ordered[j];
      if (!other || grouped.has(other.stepId)) continue;

      // Check if they have the same dependencies
      const stepDeps = deps.get(step.stepId);
      const otherDeps = deps.get(other.stepId);
      if (stepDeps && otherDeps && setsEqual(stepDeps, otherDeps)) {
        group.push(other.stepId);
        grouped.add(other.stepId);
      }
    }

    if (group.length > 1) {
      parallelGroups.push({
        groupId: `par_${parallelGroups.length}`,
        stepIds: group,
        successorGroupId: null,
      });
    }
  }

  return {
    orderedSteps: ordered,
    orderingConstraints: constraints,
    parallelGroups,
    fullyOrdered: parallelGroups.length === 0,
  };
}

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}


// =============================================================================
// STEP 163: "ONLY" SEMANTICS — Focus-sensitive operator
// =============================================================================

/**
 * The "only" operator: restricts the set of entities that may be changed.
 *
 * Linguistic model (Alternative Semantics, Rooth 1985):
 * - [[only]] = λp. p(x) ∧ ∀y[y ≠ x → ¬p(y)]
 * - "Only change the EQ" = change(EQ) ∧ ∀x[x ≠ EQ → preserve(x)]
 *
 * In music editing:
 * - The focus (what's in scope for change) is restricted
 * - Everything outside the focus is implicitly preserved
 */
export interface OnlyOperator {
  /** Unique ID */
  readonly id: string;

  /** The focus: what IS allowed to change */
  readonly focus: FocusTarget;

  /** The background: what is implicitly preserved */
  readonly background: readonly BackgroundPreservation[];

  /** The cue that triggered this operator */
  readonly cueWord: string;

  /** Strength of the restriction (how hard the implicit preservations are) */
  readonly restrictionStrength: 'hard' | 'soft';

  /** Source text */
  readonly sourceText: string | null;

  /** Confidence */
  readonly confidence: number;
}

/**
 * What's in focus (allowed to change).
 */
export interface FocusTarget {
  /** Focus type */
  readonly focusType: FocusType;

  /** The focused entity/property reference */
  readonly reference: string;

  /** Entity type (if resolved) */
  readonly entityType: string | null;

  /** Whether the focus is on the entity itself or a property */
  readonly focusOn: 'entity' | 'property' | 'axis' | 'method';
}

/**
 * Types of focus.
 */
export type FocusType =
  | 'entity_focus'    // "Only change the drums"
  | 'property_focus'  // "Only change the volume"
  | 'axis_focus'      // "Only change the brightness"
  | 'method_focus'    // "Only use EQ"
  | 'scope_focus'     // "Only in the chorus"
  | 'count_focus';    // "Only change one thing"

/**
 * An implicit preservation generated by "only."
 */
export interface BackgroundPreservation {
  /** What is being preserved */
  readonly preservedEntity: string;

  /** Entity type */
  readonly entityType: string | null;

  /** How it's preserved */
  readonly preserveMode: 'exact' | 'functional' | 'recognizable';

  /** Strength */
  readonly strength: 'hard' | 'soft';

  /** Whether this is truly implicit or contextually inferred */
  readonly implicit: boolean;
}

/**
 * Cue words that trigger focus-sensitive restriction.
 */
export interface FocusCue {
  /** The cue word */
  readonly cue: string;

  /** The kind of restriction */
  readonly restrictionKind: FocusRestrictionKind;

  /** Whether the cue negates the focus ("don't change anything except") */
  readonly negated: boolean;

  /** Confidence */
  readonly confidence: number;

  /** Example */
  readonly example: string;
}

/**
 * Kinds of focus restriction.
 */
export type FocusRestrictionKind =
  | 'exclusive'    // "only X" — only X, nothing else
  | 'additive'     // "also X" — X in addition to existing
  | 'restrictive'  // "just X" — X and nothing more
  | 'exceptive';   // "everything except X" — all but X

/**
 * Database of focus cues.
 */
export const FOCUS_CUES: readonly FocusCue[] = [
  // Exclusive focus
  { cue: 'only', restrictionKind: 'exclusive', negated: false, confidence: 0.95, example: 'Only change the EQ' },
  { cue: 'just', restrictionKind: 'restrictive', negated: false, confidence: 0.85, example: 'Just tweak the reverb' },
  { cue: 'solely', restrictionKind: 'exclusive', negated: false, confidence: 0.9, example: 'Solely adjust the bass' },
  { cue: 'merely', restrictionKind: 'restrictive', negated: false, confidence: 0.8, example: 'Merely brighten the top end' },
  { cue: 'exclusively', restrictionKind: 'exclusive', negated: false, confidence: 0.95, example: 'Exclusively modify the drums' },
  { cue: 'nothing but', restrictionKind: 'exclusive', negated: true, confidence: 0.9, example: 'Change nothing but the tempo' },
  { cue: 'nothing else', restrictionKind: 'exclusive', negated: true, confidence: 0.9, example: 'Change the key and nothing else' },

  // Exceptive focus
  { cue: 'except', restrictionKind: 'exceptive', negated: false, confidence: 0.9, example: 'Change everything except the melody' },
  { cue: 'except for', restrictionKind: 'exceptive', negated: false, confidence: 0.9, example: 'Modify all layers except for the vocals' },
  { cue: 'apart from', restrictionKind: 'exceptive', negated: false, confidence: 0.85, example: 'Apart from the drums, brighten everything' },
  { cue: 'other than', restrictionKind: 'exceptive', negated: false, confidence: 0.85, example: 'Other than the bass, thin out the mix' },
  { cue: 'everything but', restrictionKind: 'exceptive', negated: false, confidence: 0.9, example: 'Change everything but the drums' },
  { cue: 'all but', restrictionKind: 'exceptive', negated: false, confidence: 0.85, example: 'All but the vocals' },
];

/**
 * Apply "only" semantics: generate the focus and background preservations.
 */
export function applyOnlySemantics(
  focusRef: string,
  focusType: FocusType,
  allEntities: readonly string[],
  cue: string,
  opts: {
    entityType?: string | null;
    restrictionStrength?: 'hard' | 'soft';
    preserveMode?: 'exact' | 'functional' | 'recognizable';
  } = {},
): OnlyOperator {
  const preserveMode = opts.preserveMode ?? 'exact';
  const strength = opts.restrictionStrength ?? 'hard';

  // Everything NOT in focus is preserved
  const background: BackgroundPreservation[] = [];
  for (const entity of allEntities) {
    if (entity !== focusRef) {
      background.push({
        preservedEntity: entity,
        entityType: null,
        preserveMode,
        strength,
        implicit: true,
      });
    }
  }

  return {
    id: `only_${Date.now()}`,
    focus: {
      focusType,
      reference: focusRef,
      entityType: opts.entityType ?? null,
      focusOn: focusType === 'entity_focus' ? 'entity'
        : focusType === 'property_focus' ? 'property'
        : focusType === 'axis_focus' ? 'axis'
        : focusType === 'method_focus' ? 'method'
        : 'entity',
    },
    background,
    cueWord: cue,
    restrictionStrength: strength,
    sourceText: null,
    confidence: 0.9,
  };
}

/**
 * Apply "except" semantics: everything changes EXCEPT the focused entity.
 * This is the inverse of "only."
 */
export function applyExceptSemantics(
  exceptRef: string,
  allEntities: readonly string[],
  cue: string,
  opts: {
    entityType?: string | null;
    preserveMode?: 'exact' | 'functional' | 'recognizable';
  } = {},
): OnlyOperator {
  const preserveMode = opts.preserveMode ?? 'exact';

  // The excepted entity is preserved; everything else is in focus
  const background: BackgroundPreservation[] = [{
    preservedEntity: exceptRef,
    entityType: opts.entityType ?? null,
    preserveMode,
    strength: 'hard',
    implicit: false,
  }];

  // Focus is "everything else"
  const focusEntities = allEntities.filter(e => e !== exceptRef);

  return {
    id: `except_${Date.now()}`,
    focus: {
      focusType: 'entity_focus',
      reference: focusEntities.join(', '),
      entityType: null,
      focusOn: 'entity',
    },
    background,
    cueWord: cue,
    restrictionStrength: 'hard',
    sourceText: null,
    confidence: 0.9,
  };
}


// =============================================================================
// STEP 164: "STILL" AND "AGAIN" SEMANTICS — Presuppositional particles
// =============================================================================

/**
 * Presuppositional particles: words that presuppose a prior state or event.
 *
 * "Still" presupposes:
 * - A property was true at a previous time
 * - It continues to be true now
 * - There was an expectation it might have changed
 *
 * "Again" presupposes:
 * - An event of the same type occurred before
 * - We are repeating that event
 * - The prior occurrence is in the edit history
 *
 * "Already" presupposes:
 * - Something has already been done
 * - It may not need to be done again
 *
 * "No longer" presupposes:
 * - Something was true but is no longer
 * - It has changed
 */
export interface PresuppositionalOperator {
  /** Unique ID */
  readonly id: string;

  /** The particle */
  readonly particle: PresuppositionalParticle;

  /** What is presupposed */
  readonly presupposition: Presupposition;

  /** How this affects the edit plan */
  readonly planEffect: PresuppositionPlanEffect;

  /** The cue word */
  readonly cueWord: string;

  /** Source text */
  readonly sourceText: string | null;

  /** Confidence */
  readonly confidence: number;
}

/**
 * Presuppositional particles.
 */
export type PresuppositionalParticle =
  | 'still'       // Continuation of prior state
  | 'again'       // Repetition of prior event
  | 'already'     // Prior completion
  | 'no_longer'   // Cessation of prior state
  | 'yet'         // Expectation of change (in negative: "not yet")
  | 'anymore'     // Cessation (negative: "not anymore")
  | 'back'        // Return to prior state ("make it X again" / "bring back")
  | 'too'         // Addition to prior state ("also")
  | 'even';       // Scalar entailment ("even louder" → was already loud)

/**
 * What a presuppositional particle presupposes.
 */
export interface Presupposition {
  /** What type of presupposition */
  readonly presupType: PresuppositionType;

  /** The presupposed content */
  readonly content: string;

  /** The entity involved */
  readonly entityRef: string | null;

  /** The property involved */
  readonly property: string | null;

  /** The prior state/value (if known) */
  readonly priorState: string | null;

  /** Whether the presupposition is about the project state or the edit history */
  readonly domain: 'project_state' | 'edit_history';
}

/**
 * Types of presuppositions.
 */
export type PresuppositionType =
  | 'state_continuation'   // "still bright" → was bright, still is
  | 'state_cessation'      // "no longer bright" → was bright, no longer
  | 'event_repetition'     // "again" → same event happened before
  | 'prior_completion'     // "already done" → event completed before
  | 'state_return'         // "back to X" → was X, changed, returning
  | 'scalar_prior'         // "even more" → was already some amount
  | 'expectation_pending'; // "not yet" → expected to happen but hasn't

/**
 * How a presupposition affects the edit plan.
 */
export interface PresuppositionPlanEffect {
  /** Effect type */
  readonly effectType: PlanEffectType;

  /** Description */
  readonly description: string;

  /** References to prior states/events needed from history */
  readonly historyLookup: HistoryLookup | null;
}

/**
 * Types of plan effects from presuppositions.
 */
export type PlanEffectType =
  | 'repeat_prior_edit'     // "again" → find and repeat the prior edit
  | 'undo_to_prior_state'   // "back to" → undo until the prior state
  | 'verify_current_state'  // "still" → check that the current state matches
  | 'skip_if_done'          // "already" → skip if the edit was already applied
  | 'amplify_existing'      // "even more" → increase the degree of an existing change
  | 'noop';                 // No effect on the plan

/**
 * A history lookup request generated by a presupposition.
 */
export interface HistoryLookup {
  /** What to look for */
  readonly lookupType: HistoryLookupType;

  /** Search parameters */
  readonly searchParams: Readonly<Record<string, string>>;

  /** How far back to search */
  readonly lookbackLimit: number | null;
}

/**
 * Types of history lookups.
 */
export type HistoryLookupType =
  | 'find_prior_edit'       // Find a prior edit of the same type
  | 'find_prior_state'      // Find a prior state of an entity
  | 'find_prior_value'      // Find a prior value of a property
  | 'find_prior_version'    // Find a prior version of the project
  | 'check_edit_applied';   // Check if a specific edit was applied

/**
 * Database of presuppositional particle behaviors.
 */
export interface PresuppositionalParticleDef {
  /** The particle */
  readonly particle: PresuppositionalParticle;

  /** Trigger words */
  readonly triggers: readonly string[];

  /** Default presupposition type */
  readonly defaultPresupType: PresuppositionType;

  /** Default plan effect */
  readonly defaultPlanEffect: PlanEffectType;

  /** Description */
  readonly description: string;

  /** Examples */
  readonly examples: readonly string[];
}

/**
 * Database of presuppositional particles.
 */
export const PRESUPPOSITIONAL_PARTICLES: readonly PresuppositionalParticleDef[] = [
  {
    particle: 'still',
    triggers: ['still', 'still is', 'is still', 'remains'],
    defaultPresupType: 'state_continuation',
    defaultPlanEffect: 'verify_current_state',
    description: 'Presupposes a prior state that continues; may imply "don\'t change this"',
    examples: [
      'It\'s still too bright → presupposes: was bright before; implies: brightness needs decrease',
      'The bass is still muddy → presupposes: was muddy; current fix didn\'t work',
    ],
  },
  {
    particle: 'again',
    triggers: ['again', 'once more', 'one more time', 'redo'],
    defaultPresupType: 'event_repetition',
    defaultPlanEffect: 'repeat_prior_edit',
    description: 'Presupposes a prior event of the same type; repeat it',
    examples: [
      'Brighten it again → presupposes: brightened before; repeat the brightening',
      'Add reverb again → presupposes: reverb was added before (and maybe removed)',
    ],
  },
  {
    particle: 'already',
    triggers: ['already', 'already been', 'has already'],
    defaultPresupType: 'prior_completion',
    defaultPlanEffect: 'skip_if_done',
    description: 'Presupposes a prior completion; may skip if done',
    examples: [
      'It\'s already loud enough → presupposes: loudness was increased; don\'t increase more',
      'I already added compression → presupposes: compression exists; don\'t add again',
    ],
  },
  {
    particle: 'no_longer',
    triggers: ['no longer', 'not anymore', 'no more'],
    defaultPresupType: 'state_cessation',
    defaultPlanEffect: 'noop',
    description: 'Presupposes a state that has ceased; the property was true but isn\'t now',
    examples: [
      'It\'s no longer too bright → presupposes: was too bright; brightening was reduced',
      'The drums don\'t punch anymore → presupposes: drums had punch; something reduced it',
    ],
  },
  {
    particle: 'back',
    triggers: ['back', 'back to', 'bring back', 'go back', 'return to'],
    defaultPresupType: 'state_return',
    defaultPlanEffect: 'undo_to_prior_state',
    description: 'Presupposes a prior state and requests return to it',
    examples: [
      'Go back to how the drums sounded → presupposes: drums had a prior sound; undo changes',
      'Bring back the original melody → presupposes: melody was changed; restore original',
    ],
  },
  {
    particle: 'even',
    triggers: ['even', 'even more', 'even less'],
    defaultPresupType: 'scalar_prior',
    defaultPlanEffect: 'amplify_existing',
    description: 'Presupposes an existing level and implies going further on the scale',
    examples: [
      'Make it even brighter → presupposes: already bright; increase more',
      'Even less reverb → presupposes: reverb was already reduced; reduce further',
    ],
  },
  {
    particle: 'yet',
    triggers: ['not yet', 'hasn\'t yet', 'haven\'t yet'],
    defaultPresupType: 'expectation_pending',
    defaultPlanEffect: 'noop',
    description: 'Presupposes an expectation that hasn\'t been fulfilled',
    examples: [
      'I haven\'t fixed the bass yet → presupposes: bass needs fixing; it\'s pending',
    ],
  },
];

/**
 * Detect presuppositional particles in text.
 */
export function detectPresuppositionalParticle(
  text: string,
): readonly DetectedPresupposition[] {
  const normalizedText = text.toLowerCase();
  const results: DetectedPresupposition[] = [];

  for (const def of PRESUPPOSITIONAL_PARTICLES) {
    for (const trigger of def.triggers) {
      const idx = normalizedText.indexOf(trigger);
      if (idx !== -1) {
        results.push({
          particle: def.particle,
          trigger,
          position: idx,
          defaultPresupType: def.defaultPresupType,
          defaultPlanEffect: def.defaultPlanEffect,
          confidence: 0.8,
        });
        break; // Only detect once per particle type
      }
    }
  }

  return results;
}

/**
 * A detected presuppositional particle.
 */
export interface DetectedPresupposition {
  /** The particle */
  readonly particle: PresuppositionalParticle;

  /** The trigger word */
  readonly trigger: string;

  /** Position in text */
  readonly position: number;

  /** Default presupposition type */
  readonly defaultPresupType: PresuppositionType;

  /** Default plan effect */
  readonly defaultPlanEffect: PlanEffectType;

  /** Confidence */
  readonly confidence: number;
}


// =============================================================================
// STEP 165: "KEEP X THE SAME" — Preservation operator
// =============================================================================

/**
 * "Keep X the same" semantics: generates a preserve constraint.
 *
 * Default: preserve(X, exact)
 * Optional relaxation:
 * - "Keep X roughly the same" → preserve(X, recognizable)
 * - "Keep X functionally the same" → preserve(X, functional)
 * - "Keep X intact" → preserve(X, exact)
 * - "Keep the feel of X" → preserve(X, functional)
 * - "Keep X recognizable" → preserve(X, recognizable)
 */
export interface KeepSameOperator {
  /** Unique ID */
  readonly id: string;

  /** What to keep the same */
  readonly target: KeepTarget;

  /** Preservation mode */
  readonly mode: KeepMode;

  /** Strength */
  readonly strength: 'hard' | 'soft';

  /** The cue phrase that triggered this */
  readonly cuePhrases: readonly string[];

  /** Source text */
  readonly sourceText: string | null;

  /** Confidence */
  readonly confidence: number;
}

/**
 * What to keep the same.
 */
export interface KeepTarget {
  /** Target reference text */
  readonly reference: string;

  /** Entity type (if resolved) */
  readonly entityType: string | null;

  /** Specific property to preserve (null = whole entity) */
  readonly property: string | null;

  /** Whether this is a musical identity (melody, rhythm, harmony) */
  readonly musicalIdentity: MusicalIdentityType | null;
}

/**
 * Types of musical identity.
 */
export type MusicalIdentityType =
  | 'melody'          // Pitch sequence / contour
  | 'harmony'         // Chord progression
  | 'rhythm'          // Onset pattern
  | 'groove'          // Feel / groove character
  | 'arrangement'     // Instrumentation / layers
  | 'dynamics'        // Loudness contour
  | 'timbre'          // Sound character
  | 'structure'       // Song form
  | 'feel';           // Overall feeling

/**
 * Preservation modes for "keep the same."
 */
export type KeepMode =
  | 'exact'          // Byte-for-byte identical
  | 'functional'     // Same musical function
  | 'recognizable'   // Recognizably similar
  | 'proportional'   // Same relative values
  | 'structural';    // Same structure (different content OK)

/**
 * Cues for "keep X the same" with their default modes.
 */
export interface KeepSameCue {
  /** The cue phrase */
  readonly cue: string;

  /** Default preservation mode */
  readonly defaultMode: KeepMode;

  /** Default strength */
  readonly defaultStrength: 'hard' | 'soft';

  /** Confidence */
  readonly confidence: number;

  /** Example */
  readonly example: string;
}

/**
 * Database of "keep the same" cues.
 */
export const KEEP_SAME_CUES: readonly KeepSameCue[] = [
  // Exact preservation
  { cue: 'keep the same', defaultMode: 'exact', defaultStrength: 'hard', confidence: 0.9, example: 'Keep the melody the same' },
  { cue: 'keep it the same', defaultMode: 'exact', defaultStrength: 'hard', confidence: 0.9, example: 'Keep it the same' },
  { cue: 'leave unchanged', defaultMode: 'exact', defaultStrength: 'hard', confidence: 0.95, example: 'Leave the drums unchanged' },
  { cue: 'don\'t change', defaultMode: 'exact', defaultStrength: 'hard', confidence: 0.95, example: 'Don\'t change the chords' },
  { cue: 'don\'t touch', defaultMode: 'exact', defaultStrength: 'hard', confidence: 0.95, example: 'Don\'t touch the bass' },
  { cue: 'leave alone', defaultMode: 'exact', defaultStrength: 'hard', confidence: 0.9, example: 'Leave the vocals alone' },
  { cue: 'intact', defaultMode: 'exact', defaultStrength: 'hard', confidence: 0.9, example: 'Keep the melody intact' },
  { cue: 'as is', defaultMode: 'exact', defaultStrength: 'hard', confidence: 0.9, example: 'Leave the arrangement as is' },
  { cue: 'untouched', defaultMode: 'exact', defaultStrength: 'hard', confidence: 0.95, example: 'Keep the drums untouched' },
  { cue: 'lock', defaultMode: 'exact', defaultStrength: 'hard', confidence: 0.85, example: 'Lock the tempo' },

  // Functional preservation
  { cue: 'keep the feel', defaultMode: 'functional', defaultStrength: 'soft', confidence: 0.85, example: 'Keep the feel of the groove' },
  { cue: 'keep the vibe', defaultMode: 'functional', defaultStrength: 'soft', confidence: 0.85, example: 'Keep the vibe' },
  { cue: 'same character', defaultMode: 'functional', defaultStrength: 'soft', confidence: 0.8, example: 'Same character as before' },
  { cue: 'same spirit', defaultMode: 'functional', defaultStrength: 'soft', confidence: 0.8, example: 'In the same spirit' },
  { cue: 'functionally', defaultMode: 'functional', defaultStrength: 'soft', confidence: 0.85, example: 'Keep it functionally the same' },
  { cue: 'same essence', defaultMode: 'functional', defaultStrength: 'soft', confidence: 0.8, example: 'Preserve the essence' },

  // Recognizable preservation
  { cue: 'keep recognizable', defaultMode: 'recognizable', defaultStrength: 'soft', confidence: 0.85, example: 'Keep the melody recognizable' },
  { cue: 'roughly the same', defaultMode: 'recognizable', defaultStrength: 'soft', confidence: 0.8, example: 'Keep it roughly the same' },
  { cue: 'similar', defaultMode: 'recognizable', defaultStrength: 'soft', confidence: 0.75, example: 'Keep it similar' },
  { cue: 'close to', defaultMode: 'recognizable', defaultStrength: 'soft', confidence: 0.75, example: 'Close to the original' },
  { cue: 'shape', defaultMode: 'recognizable', defaultStrength: 'soft', confidence: 0.7, example: 'Keep the melodic shape' },
  { cue: 'contour', defaultMode: 'recognizable', defaultStrength: 'soft', confidence: 0.8, example: 'Preserve the contour' },

  // Structural preservation
  { cue: 'same structure', defaultMode: 'structural', defaultStrength: 'hard', confidence: 0.85, example: 'Keep the same structure' },
  { cue: 'same form', defaultMode: 'structural', defaultStrength: 'hard', confidence: 0.85, example: 'Keep the same form' },
  { cue: 'same arrangement', defaultMode: 'structural', defaultStrength: 'soft', confidence: 0.8, example: 'Keep the same arrangement' },
  { cue: 'same layout', defaultMode: 'structural', defaultStrength: 'hard', confidence: 0.85, example: 'Keep the same layout' },

  // Proportional preservation
  { cue: 'same balance', defaultMode: 'proportional', defaultStrength: 'soft', confidence: 0.8, example: 'Keep the same balance' },
  { cue: 'same ratio', defaultMode: 'proportional', defaultStrength: 'soft', confidence: 0.8, example: 'Keep the same ratio' },
  { cue: 'same proportions', defaultMode: 'proportional', defaultStrength: 'soft', confidence: 0.8, example: 'Keep the same proportions' },
  { cue: 'relative levels', defaultMode: 'proportional', defaultStrength: 'soft', confidence: 0.75, example: 'Keep the relative levels' },
];

/**
 * Apply "keep X the same" semantics.
 */
export function applyKeepSameSemantics(
  targetRef: string,
  cue: string,
  opts: {
    entityType?: string | null;
    property?: string | null;
    musicalIdentity?: MusicalIdentityType | null;
    modeOverride?: KeepMode;
    strengthOverride?: 'hard' | 'soft';
  } = {},
): KeepSameOperator {
  // Find the matching cue in the database
  const matchedCue = KEEP_SAME_CUES.find(c => cue.toLowerCase().includes(c.cue));

  const mode = opts.modeOverride ?? matchedCue?.defaultMode ?? 'exact';
  const strength = opts.strengthOverride ?? matchedCue?.defaultStrength ?? 'hard';

  return {
    id: `keep_${Date.now()}`,
    target: {
      reference: targetRef,
      entityType: opts.entityType ?? null,
      property: opts.property ?? null,
      musicalIdentity: opts.musicalIdentity ?? null,
    },
    mode,
    strength,
    cuePhrases: [cue],
    sourceText: null,
    confidence: matchedCue?.confidence ?? 0.8,
  };
}

/**
 * Detect "keep X the same" patterns in text.
 */
export function detectKeepSamePatterns(text: string): readonly DetectedKeepSame[] {
  const normalizedText = text.toLowerCase();
  const results: DetectedKeepSame[] = [];

  for (const cueDef of KEEP_SAME_CUES) {
    const idx = normalizedText.indexOf(cueDef.cue);
    if (idx !== -1) {
      results.push({
        cue: cueDef.cue,
        position: idx,
        defaultMode: cueDef.defaultMode,
        defaultStrength: cueDef.defaultStrength,
        confidence: cueDef.confidence,
      });
    }
  }

  // Sort by position (earlier matches first) then by confidence
  results.sort((a, b) => a.position - b.position || b.confidence - a.confidence);

  return results;
}

/**
 * A detected "keep the same" pattern.
 */
export interface DetectedKeepSame {
  /** The matched cue */
  readonly cue: string;

  /** Position in text */
  readonly position: number;

  /** Default mode */
  readonly defaultMode: KeepMode;

  /** Default strength */
  readonly defaultStrength: 'hard' | 'soft';

  /** Confidence */
  readonly confidence: number;
}


// =============================================================================
// COMBINED OPERATOR DETECTION — detecting all discourse operators in text
// =============================================================================

/**
 * Result of detecting all discourse operators in a text.
 */
export interface DiscourseOperatorDetection {
  /** Sequencing cues found */
  readonly sequencingCues: readonly SequencingCueDetection[];

  /** Focus operators found */
  readonly focusOperators: readonly FocusCueDetection[];

  /** Presuppositional particles found */
  readonly presuppositions: readonly DetectedPresupposition[];

  /** Keep-same patterns found */
  readonly keepSamePatterns: readonly DetectedKeepSame[];

  /** Total operators detected */
  readonly totalDetected: number;
}

/**
 * A detected sequencing cue.
 */
export interface SequencingCueDetection {
  /** The matched cue */
  readonly cue: SequencingCue;

  /** Position in text */
  readonly position: number;
}

/**
 * A detected focus cue.
 */
export interface FocusCueDetection {
  /** The matched cue */
  readonly cue: FocusCue;

  /** Position in text */
  readonly position: number;
}

/**
 * Detect all discourse operators in a text.
 */
export function detectAllDiscourseOperators(text: string): DiscourseOperatorDetection {
  const normalizedText = text.toLowerCase();

  // Detect sequencing cues
  const sequencingCues: SequencingCueDetection[] = [];
  for (const cue of SEQUENCING_CUES) {
    const idx = normalizedText.indexOf(cue.cue.toLowerCase());
    if (idx !== -1) {
      sequencingCues.push({ cue, position: idx });
    }
  }

  // Detect focus cues
  const focusOperators: FocusCueDetection[] = [];
  for (const cue of FOCUS_CUES) {
    const idx = normalizedText.indexOf(cue.cue.toLowerCase());
    if (idx !== -1) {
      focusOperators.push({ cue, position: idx });
    }
  }

  // Detect presuppositional particles
  const presuppositions = detectPresuppositionalParticle(text);

  // Detect keep-same patterns
  const keepSamePatterns = detectKeepSamePatterns(text);

  return {
    sequencingCues,
    focusOperators,
    presuppositions,
    keepSamePatterns,
    totalDetected: sequencingCues.length + focusOperators.length +
      presuppositions.length + keepSamePatterns.length,
  };
}


// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a discourse operator detection result as a report.
 */
export function formatDiscourseOperatorReport(detection: DiscourseOperatorDetection): string {
  const lines: string[] = [
    '=== Discourse Operator Detection ===',
    `Total operators detected: ${detection.totalDetected}`,
    '',
  ];

  if (detection.sequencingCues.length > 0) {
    lines.push('Sequencing cues:');
    for (const sc of detection.sequencingCues) {
      lines.push(`  "${sc.cue.cue}" → ${sc.cue.sequenceType} (${sc.cue.strictness})`);
    }
    lines.push('');
  }

  if (detection.focusOperators.length > 0) {
    lines.push('Focus operators:');
    for (const fo of detection.focusOperators) {
      lines.push(`  "${fo.cue.cue}" → ${fo.cue.restrictionKind}`);
    }
    lines.push('');
  }

  if (detection.presuppositions.length > 0) {
    lines.push('Presuppositional particles:');
    for (const pp of detection.presuppositions) {
      lines.push(`  "${pp.trigger}" (${pp.particle}) → ${pp.defaultPlanEffect}`);
    }
    lines.push('');
  }

  if (detection.keepSamePatterns.length > 0) {
    lines.push('Keep-same patterns:');
    for (const ks of detection.keepSamePatterns) {
      lines.push(`  "${ks.cue}" → mode: ${ks.defaultMode}, strength: ${ks.defaultStrength}`);
    }
  }

  return lines.join('\n');
}
