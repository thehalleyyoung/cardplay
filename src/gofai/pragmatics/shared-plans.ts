/**
 * GOFAI Pragmatics — Shared Plans and Plan Recognition
 *
 * Defines a model for recognizing and reusing edit plans across turns.
 * When a user says "do it again but bigger" or "the same thing to the bridge",
 * the system must:
 *   1. Recognize what "it" / "the same thing" refers to (a prior edit plan)
 *   2. Abstract the plan into a reusable template
 *   3. Apply the template to a new scope/target with modifications
 *
 * ## Theoretical Background
 *
 * This draws on:
 * - **SharedPlans (Grosz & Sidner 1990)**: Collaborative plans between
 *   user and system, with shared intentions and recipes.
 * - **Plan Recognition (Litman & Allen 1987)**: Recognizing a user's
 *   plan from their utterances to provide contextual help.
 * - **Analogical Plan Reuse**: Adapting a prior plan to a new context
 *   by mapping source→target correspondences.
 *
 * ## Key Design Principles
 *
 * 1. Plans are first-class discourse referents (they can be "it" or "that")
 * 2. Plan templates are abstracted from concrete plans by replacing
 *    scope bindings with variables
 * 3. Modification operators ("bigger", "faster", "less") apply to
 *    template parameters
 * 4. Plan history is bounded and decays like other salience
 * 5. All reuse is inspectable — the user can see what plan was reused
 *    and how it was modified
 *
 * @module gofai/pragmatics/shared-plans
 * @see gofai_goalA.md Step 079
 * @see gofaimusicplus.md — "do it again", "undo that"
 */

// =============================================================================
// PLAN IDs (branded)
// =============================================================================

/**
 * Branded ID for an executed plan in history.
 * Format: `plan:<turn>:<index>`
 */
export type PlanId = string & { readonly __brand: 'PlanId' };

export function createPlanId(turn: number, index: number): PlanId {
  return `plan:${turn}:${index}` as PlanId;
}

export function isValidPlanId(id: string): id is PlanId {
  return /^plan:\d+:\d+$/.test(id);
}

/**
 * Branded ID for a plan template.
 * Format: `ptmpl:<name>`
 */
export type PlanTemplateId = string & { readonly __brand: 'PlanTemplateId' };

export function createPlanTemplateId(name: string): PlanTemplateId {
  return `ptmpl:${name}` as PlanTemplateId;
}

// =============================================================================
// EDIT PLAN RECORD — what was done in a prior turn
// =============================================================================

/**
 * A record of an executed edit plan stored in the plan history.
 * This is what "it" / "that" can refer to in subsequent turns.
 */
export interface EditPlanRecord {
  /** Unique ID */
  readonly id: PlanId;

  /** Turn number when this plan was executed */
  readonly turnNumber: number;

  /** The user's original utterance */
  readonly utterance: string;

  /** What kind of plan this was */
  readonly planType: PlanType;

  /** The steps that were executed */
  readonly steps: readonly PlanStep[];

  /** Scope the plan was applied to */
  readonly scope: PlanScope;

  /** Constraints that were active */
  readonly constraints: readonly PlanConstraintRecord[];

  /** Parameters of the plan (for modification) */
  readonly parameters: readonly PlanParameter[];

  /** Whether the plan was successful */
  readonly outcome: PlanOutcome;

  /** The abstract template derived from this plan */
  readonly template: PlanTemplate;

  /** Salience score (decays over time) */
  salience: number;

  /** Whether this plan has been undone */
  readonly undone: boolean;
}

/**
 * The type of an edit plan.
 */
export type PlanType =
  | 'axis_change'      // "make it brighter"
  | 'action'           // "add drums"
  | 'structure_edit'   // "extend the intro"
  | 'multi_step'       // "make it brighter and add reverb"
  | 'query'            // "what changed?"
  | 'undo'             // "undo that"
  | 'redo'             // "redo"
  | 'refinement'       // "a bit more" (modifier on previous)
  | 'comparison'       // "like the verse" (analogical)
  | 'batch'            // "do X to all sections"
  | 'conditional';     // "if it's too bright, dial it back"

// =============================================================================
// PLAN STEPS — the atomic operations in a plan
// =============================================================================

/**
 * A single step in an edit plan.
 */
export interface PlanStep {
  /** Step index (0-based) */
  readonly index: number;

  /** What operation was performed */
  readonly operation: PlanOperation;

  /** Target of the operation */
  readonly target: PlanStepTarget;

  /** Parameters passed to the operation */
  readonly params: Readonly<Record<string, PlanParameterValue>>;

  /** Whether this step was the "main" action vs. a setup/cleanup step */
  readonly role: StepRole;

  /** Human-readable description */
  readonly description: string;
}

/**
 * The operation performed in a plan step.
 */
export type PlanOperation =
  | 'set_axis'          // Set a perceptual axis value
  | 'shift_axis'        // Shift a perceptual axis by delta
  | 'add_layer'         // Add a new layer/track
  | 'remove_layer'      // Remove a layer/track
  | 'modify_events'     // Modify note/event properties
  | 'add_events'        // Add new notes/events
  | 'remove_events'     // Remove notes/events
  | 'copy_events'       // Copy events from one place to another
  | 'move_events'       // Move events to different position
  | 'set_parameter'     // Set a parameter value
  | 'shift_parameter'   // Shift a parameter by delta
  | 'add_section'       // Add a new section
  | 'remove_section'    // Remove a section
  | 'extend_section'    // Extend a section's length
  | 'shorten_section'   // Shorten a section
  | 'duplicate_section' // Duplicate a section
  | 'reorder_sections'  // Reorder sections
  | 'apply_effect'      // Apply an audio effect
  | 'remove_effect'     // Remove an audio effect
  | 'modify_effect'     // Modify effect parameters
  | 'set_tempo'         // Set tempo
  | 'set_key'           // Set key
  | 'set_meter'         // Set time signature
  | 'transpose'         // Transpose pitches
  | 'quantize'          // Quantize timing
  | 'humanize'          // Add humanization
  | 'randomize'         // Add randomization within bounds
  | 'swap'              // Swap two elements
  | 'invert'            // Invert an aspect (pitch inversion, etc.)
  | 'retrograde'        // Retrograde (reverse) a pattern
  | 'augment'           // Augment (stretch) durations
  | 'diminish'          // Diminish (compress) durations
  | 'custom';           // Custom/extension operation

/**
 * The target of a plan step.
 */
export interface PlanStepTarget {
  /** Entity type being targeted */
  readonly entityType: PlanEntityType;
  /** How the target was resolved */
  readonly resolution: TargetResolution;
  /** Display name */
  readonly displayName: string;
}

export type PlanEntityType =
  | 'section'
  | 'layer'
  | 'track'
  | 'card'
  | 'parameter'
  | 'event'
  | 'event_selection'
  | 'deck'
  | 'board'
  | 'effect'
  | 'global';

export type TargetResolution =
  | { readonly kind: 'by_id'; readonly id: string }
  | { readonly kind: 'by_name'; readonly name: string }
  | { readonly kind: 'by_selection' }
  | { readonly kind: 'by_salience' }
  | { readonly kind: 'by_default' }
  | { readonly kind: 'by_predicate'; readonly predicate: string };

/**
 * Role of a step within a plan.
 */
export type StepRole =
  | 'primary'     // The main action (what the user asked for)
  | 'prerequisite'// Required setup before the main action
  | 'side_effect' // Automatic consequence of the main action
  | 'cleanup'     // Post-action cleanup
  | 'verification'; // Check that constraints are satisfied

// =============================================================================
// PLAN PARAMETERS — abstractable values in a plan
// =============================================================================

/**
 * A parameter of a plan that can be modified when reusing.
 *
 * When the user says "do it again but bigger", "bigger" modifies
 * the 'amount' parameter of the reused plan.
 */
export interface PlanParameter {
  /** Parameter name */
  readonly name: string;

  /** The value used in this execution */
  readonly value: PlanParameterValue;

  /** What kind of parameter this is */
  readonly kind: ParameterKind;

  /** Whether this parameter can be modified in reuse */
  readonly modifiable: boolean;

  /** The dimension of this parameter (for modification operators) */
  readonly dimension: ParameterDimension;

  /** Human-readable label */
  readonly label: string;
}

/**
 * A parameter value.
 */
export type PlanParameterValue =
  | { readonly type: 'number'; readonly value: number; readonly unit?: string }
  | { readonly type: 'string'; readonly value: string }
  | { readonly type: 'degree'; readonly value: DegreeValue }
  | { readonly type: 'direction'; readonly value: 'increase' | 'decrease' }
  | { readonly type: 'boolean'; readonly value: boolean }
  | { readonly type: 'enum'; readonly value: string; readonly options: readonly string[] }
  | { readonly type: 'scope'; readonly sections: readonly string[]; readonly layers: readonly string[] }
  | { readonly type: 'entity_ref'; readonly id: string; readonly name: string };

export type DegreeValue = 'tiny' | 'small' | 'moderate' | 'large' | 'extreme';

/**
 * Kind of parameter.
 */
export type ParameterKind =
  | 'amount'       // How much (degree, number)
  | 'direction'    // Which way (increase, decrease)
  | 'target'       // What to affect (entity ref)
  | 'scope'        // Where to apply (sections, layers)
  | 'mode'         // How to do it (preservation mode, etc.)
  | 'constraint'   // What to preserve
  | 'qualifier'    // Additional qualifier (style, character)
  | 'count';       // How many times

/**
 * Dimension of a parameter (for modification operators).
 */
export type ParameterDimension =
  | 'magnitude'    // "bigger" / "smaller" / "more" / "less"
  | 'speed'        // "faster" / "slower"
  | 'pitch'        // "higher" / "lower"
  | 'time'         // "longer" / "shorter"
  | 'density'      // "busier" / "sparser"
  | 'brightness'   // "brighter" / "darker"
  | 'width'        // "wider" / "narrower"
  | 'intensity'    // "more intense" / "calmer"
  | 'generic';     // Any scalable parameter

// =============================================================================
// PLAN SCOPE — where a plan was applied
// =============================================================================

/**
 * The scope to which a plan was applied.
 */
export interface PlanScope {
  /** Which sections (empty = all) */
  readonly sections: readonly string[];
  /** Which layers (empty = all) */
  readonly layers: readonly string[];
  /** Time range (if specified) */
  readonly timeRange?: PlanTimeRange;
  /** Whether scope was explicit or inferred */
  readonly scopeSource: ScopeSource;
}

export interface PlanTimeRange {
  readonly startBar: number;
  readonly endBar: number;
}

export type ScopeSource =
  | 'explicit'     // User specified: "in the chorus"
  | 'selection'    // From UI selection
  | 'salience'     // From salience tracker
  | 'default'      // System default (e.g., "whole song")
  | 'inherited';   // Inherited from prior plan

// =============================================================================
// PLAN CONSTRAINTS — what was preserved
// =============================================================================

/**
 * A constraint that was active during plan execution.
 */
export interface PlanConstraintRecord {
  /** What was constrained */
  readonly target: string;
  /** How strictly */
  readonly mode: string;
  /** Whether it was hard or soft */
  readonly hard: boolean;
  /** Whether it was satisfied */
  readonly satisfied: boolean;
  /** Source: explicit user request, or inferred */
  readonly source: 'explicit' | 'inferred' | 'default';
}

// =============================================================================
// PLAN OUTCOME — result of execution
// =============================================================================

/**
 * The outcome of a plan execution.
 */
export interface PlanOutcome {
  /** Whether the plan succeeded */
  readonly success: boolean;
  /** Error message if failed */
  readonly error?: string;
  /** Summary of changes */
  readonly summary: string;
  /** Number of events affected */
  readonly eventsAffected: number;
  /** Whether user approved the changes */
  readonly approved: boolean;
  /** Whether the plan was auto-applied or required preview */
  readonly autoApplied: boolean;
}

// =============================================================================
// PLAN TEMPLATE — abstracted reusable form
// =============================================================================

/**
 * An abstracted plan template derived from a concrete plan.
 *
 * Templates replace specific bindings with template variables
 * so the plan can be applied to different scopes/targets.
 */
export interface PlanTemplate {
  /** Template ID */
  readonly id: PlanTemplateId;

  /** The type of plan this template represents */
  readonly planType: PlanType;

  /** Abstracted steps (with template variables) */
  readonly steps: readonly TemplateStep[];

  /** Template variables (what can change when reusing) */
  readonly variables: readonly TemplateVariable[];

  /** Default variable bindings (from the original plan) */
  readonly defaults: Readonly<Record<string, PlanParameterValue>>;

  /** Constraints that should carry over */
  readonly constraints: readonly TemplateConstraint[];

  /** Human-readable name for the template */
  readonly name: string;

  /** Human-readable description */
  readonly description: string;

  /** How many times this template has been used */
  usageCount: number;
}

/**
 * A step in a plan template with variables replacing concrete values.
 */
export interface TemplateStep {
  /** The operation */
  readonly operation: PlanOperation;

  /** Target (may be a variable) */
  readonly target: TemplateTarget;

  /** Parameters (may contain variables) */
  readonly params: Readonly<Record<string, TemplateParamValue>>;

  /** Step role */
  readonly role: StepRole;

  /** Description template (with {variable} placeholders) */
  readonly descriptionTemplate: string;
}

/**
 * A template target (concrete or variable).
 */
export type TemplateTarget =
  | { readonly kind: 'concrete'; readonly entityType: PlanEntityType; readonly id: string }
  | { readonly kind: 'variable'; readonly variableName: string; readonly entityType: PlanEntityType };

/**
 * A template parameter value (concrete or variable).
 */
export type TemplateParamValue =
  | { readonly kind: 'concrete'; readonly value: PlanParameterValue }
  | { readonly kind: 'variable'; readonly variableName: string }
  | { readonly kind: 'computed'; readonly expression: string };

/**
 * A variable in a plan template.
 */
export interface TemplateVariable {
  /** Variable name */
  readonly name: string;
  /** What kind of value this variable holds */
  readonly kind: ParameterKind;
  /** Dimension (for modification) */
  readonly dimension: ParameterDimension;
  /** Whether this variable must be bound before execution */
  readonly required: boolean;
  /** Default value (from original plan) */
  readonly defaultValue: PlanParameterValue;
  /** Human-readable description */
  readonly description: string;
}

/**
 * A constraint template (may reference variables).
 */
export interface TemplateConstraint {
  /** What to constrain (may be a variable name) */
  readonly target: string;
  /** Mode */
  readonly mode: string;
  /** Hard or soft */
  readonly hard: boolean;
}

// =============================================================================
// PLAN MODIFICATION — how users modify reused plans
// =============================================================================

/**
 * A modification to apply when reusing a plan template.
 *
 * Modifications come from comparative/modifier phrases:
 * - "do it again but bigger" → scale amount up
 * - "the same thing but to the bridge" → change scope
 * - "like before but without the reverb" → remove a step
 * - "do it again faster" → speed modification
 */
export type PlanModification =
  | ScaleModification
  | RetargetModification
  | RemoveStepModification
  | AddConstraintModification
  | RemoveConstraintModification
  | OverrideParamModification
  | RepeatModification;

/**
 * Scale a parameter up or down.
 * Triggered by: "bigger", "smaller", "more", "less", "twice as much"
 */
export interface ScaleModification {
  readonly type: 'scale';
  /** Which parameter dimension to scale */
  readonly dimension: ParameterDimension;
  /** Scale factor (>1 = bigger, <1 = smaller) */
  readonly factor: number;
  /** The NL phrase that triggered this */
  readonly trigger: string;
}

/**
 * Apply the plan to a different target/scope.
 * Triggered by: "do the same to the bridge", "to all sections"
 */
export interface RetargetModification {
  readonly type: 'retarget';
  /** New scope */
  readonly newScope: PlanScope;
  /** The NL phrase that triggered this */
  readonly trigger: string;
}

/**
 * Remove a step from the plan.
 * Triggered by: "but without the reverb", "skip the transpose"
 */
export interface RemoveStepModification {
  readonly type: 'remove_step';
  /** Which step to remove (by operation type or description match) */
  readonly stepMatcher: StepMatcher;
  /** The NL phrase */
  readonly trigger: string;
}

/**
 * Add a constraint to the plan.
 * Triggered by: "but keep the melody", "and preserve the groove"
 */
export interface AddConstraintModification {
  readonly type: 'add_constraint';
  /** Constraint to add */
  readonly constraint: TemplateConstraint;
  /** The NL phrase */
  readonly trigger: string;
}

/**
 * Remove a constraint from the plan.
 * Triggered by: "don't worry about the melody this time"
 */
export interface RemoveConstraintModification {
  readonly type: 'remove_constraint';
  /** Which constraint to remove (by target name match) */
  readonly targetMatcher: string;
  /** The NL phrase */
  readonly trigger: string;
}

/**
 * Override a specific parameter value.
 * Triggered by: "but at 120 BPM", "but in C minor"
 */
export interface OverrideParamModification {
  readonly type: 'override_param';
  /** Parameter name */
  readonly paramName: string;
  /** New value */
  readonly newValue: PlanParameterValue;
  /** The NL phrase */
  readonly trigger: string;
}

/**
 * Repeat the plan multiple times.
 * Triggered by: "do it three more times", "repeat that"
 */
export interface RepeatModification {
  readonly type: 'repeat';
  /** How many times to repeat */
  readonly count: number;
  /** Whether to apply sequentially to different targets */
  readonly sequential: boolean;
  /** The NL phrase */
  readonly trigger: string;
}

/**
 * Matcher for finding a step in a template.
 */
export type StepMatcher =
  | { readonly kind: 'by_operation'; readonly operation: PlanOperation }
  | { readonly kind: 'by_description'; readonly pattern: string }
  | { readonly kind: 'by_index'; readonly index: number }
  | { readonly kind: 'by_target'; readonly entityType: PlanEntityType };

// =============================================================================
// PLAN REFERENCE RESOLUTION — how "it" / "that" resolve to plans
// =============================================================================

/**
 * How a plan reference was resolved.
 */
export interface PlanReference {
  /** The referring expression */
  readonly expression: PlanReferenceExpression;
  /** The resolved plan */
  readonly resolvedPlan: PlanId;
  /** Confidence of resolution */
  readonly confidence: number;
  /** How it was resolved */
  readonly method: PlanResolutionMethod;
}

/**
 * Expressions that can refer to prior plans.
 */
export type PlanReferenceExpression =
  | { readonly kind: 'pronoun'; readonly word: 'it' | 'that' | 'this' }
  | { readonly kind: 'definite'; readonly phrase: string }   // "the same thing"
  | { readonly kind: 'demonstrative'; readonly phrase: string } // "that change"
  | { readonly kind: 'anaphoric'; readonly phrase: string }  // "what you just did"
  | { readonly kind: 'ellipsis' }                             // "again" (implicit)
  | { readonly kind: 'ordinal'; readonly n: number }          // "the first edit"
  | { readonly kind: 'temporal'; readonly when: string };     // "what you did earlier"

/**
 * Methods for resolving plan references.
 */
export type PlanResolutionMethod =
  | 'most_recent'      // Most recent non-undone plan
  | 'most_salient'     // Highest salience score
  | 'by_type_match'    // Matching plan type to current context
  | 'by_ordinal'       // By explicit ordinal ("the first edit")
  | 'by_description'   // By NL description matching
  | 'by_scope_match'   // By matching scope
  | 'by_undo_pair';    // The plan that was just undone (for "redo")

// =============================================================================
// PLAN HISTORY — bounded history of executed plans
// =============================================================================

/**
 * Configuration for plan history.
 */
export interface PlanHistoryConfig {
  /** Maximum number of plans to keep */
  readonly maxPlans: number;
  /** Salience decay rate per turn */
  readonly decayRate: number;
  /** Minimum salience to keep a plan */
  readonly minSalience: number;
  /** Whether undone plans count toward max */
  readonly countUndone: boolean;
}

export const DEFAULT_PLAN_HISTORY_CONFIG: PlanHistoryConfig = {
  maxPlans: 50,
  decayRate: 0.85,
  minSalience: 0.05,
  countUndone: false,
};

/**
 * Plan history manager.
 */
export class PlanHistory {
  private readonly plans: EditPlanRecord[] = [];
  private readonly config: PlanHistoryConfig;
  private currentTurn: number = 0;

  constructor(config: PlanHistoryConfig = DEFAULT_PLAN_HISTORY_CONFIG) {
    this.config = config;
  }

  /**
   * Record a new executed plan.
   */
  recordPlan(plan: EditPlanRecord): void {
    this.plans.unshift(plan);
    this.pruneHistory();
  }

  /**
   * Advance to next turn, decaying salience.
   */
  advanceTurn(): void {
    this.currentTurn++;
    for (const plan of this.plans) {
      plan.salience *= this.config.decayRate;
    }
    this.pruneHistory();
  }

  /**
   * Get the most recent plan (non-undone).
   */
  getMostRecent(): EditPlanRecord | undefined {
    return this.plans.find(p => !p.undone);
  }

  /**
   * Get the most salient plan.
   */
  getMostSalient(): EditPlanRecord | undefined {
    let best: EditPlanRecord | undefined;
    let bestSalience = -1;
    for (const plan of this.plans) {
      if (!plan.undone && plan.salience > bestSalience) {
        best = plan;
        bestSalience = plan.salience;
      }
    }
    return best;
  }

  /**
   * Get plan by ID.
   */
  getPlanById(id: PlanId): EditPlanRecord | undefined {
    return this.plans.find(p => p.id === id);
  }

  /**
   * Get the last N plans.
   */
  getRecentPlans(n: number): readonly EditPlanRecord[] {
    return this.plans.filter(p => !p.undone).slice(0, n);
  }

  /**
   * Get plans matching a type.
   */
  getPlansByType(type: PlanType): readonly EditPlanRecord[] {
    return this.plans.filter(p => p.planType === type && !p.undone);
  }

  /**
   * Get plans applied to a specific scope.
   */
  getPlansByScope(sections: readonly string[]): readonly EditPlanRecord[] {
    return this.plans.filter(p =>
      !p.undone &&
      sections.some(s => p.scope.sections.includes(s))
    );
  }

  /**
   * Find the plan that was most recently undone (for redo).
   */
  getLastUndonePlan(): EditPlanRecord | undefined {
    return this.plans.find(p => p.undone);
  }

  /**
   * Get plans by ordinal ("the first edit", "the second change").
   */
  getPlanByOrdinal(n: number): EditPlanRecord | undefined {
    const nonUndone = this.plans.filter(p => !p.undone);
    // Ordinals are 1-based, most recent first
    return nonUndone[n - 1];
  }

  /**
   * Resolve a plan reference to a concrete plan.
   */
  resolvePlanReference(expr: PlanReferenceExpression): PlanReference | undefined {
    let resolved: EditPlanRecord | undefined;
    let method: PlanResolutionMethod = 'most_recent';

    switch (expr.kind) {
      case 'pronoun':
      case 'ellipsis':
        // "it", "that", "again" → most recent
        resolved = this.getMostRecent();
        method = 'most_recent';
        break;

      case 'definite':
      case 'anaphoric':
        // "the same thing", "what you just did" → most salient
        resolved = this.getMostSalient();
        method = 'most_salient';
        break;

      case 'demonstrative':
        // "that change" → most recent matching description
        resolved = this.plans.find(p =>
          !p.undone && p.outcome.summary.toLowerCase().includes(expr.phrase.toLowerCase())
        );
        method = resolved ? 'by_description' : 'most_recent';
        if (!resolved) resolved = this.getMostRecent();
        break;

      case 'ordinal':
        // "the first edit" → by ordinal
        resolved = this.getPlanByOrdinal(expr.n);
        method = 'by_ordinal';
        break;

      case 'temporal':
        // "what you did earlier" → by salience (older plans)
        resolved = this.getMostSalient();
        method = 'most_salient';
        break;
    }

    if (!resolved) return undefined;

    return {
      expression: expr,
      resolvedPlan: resolved.id,
      confidence: resolved.salience,
      method,
    };
  }

  /**
   * Get all plans in history.
   */
  getAllPlans(): readonly EditPlanRecord[] {
    return [...this.plans];
  }

  /**
   * Get current turn number.
   */
  getCurrentTurn(): number {
    return this.currentTurn;
  }

  /**
   * Get history size.
   */
  getSize(): number {
    return this.plans.length;
  }

  /**
   * Clear all history.
   */
  clear(): void {
    this.plans.length = 0;
    this.currentTurn = 0;
  }

  private pruneHistory(): void {
    // Remove plans below minimum salience
    const minSalience = this.config.minSalience;
    for (let i = this.plans.length - 1; i >= 0; i--) {
      const plan = this.plans[i];
      if (plan && plan.salience < minSalience && (this.config.countUndone || !plan.undone)) {
        this.plans.splice(i, 1);
      }
    }

    // Enforce max plans
    while (this.plans.length > this.config.maxPlans) {
      this.plans.pop();
    }
  }
}

// =============================================================================
// PLAN ABSTRACTION — extracting templates from concrete plans
// =============================================================================

/**
 * Abstract a concrete plan into a reusable template.
 *
 * The abstraction process:
 * 1. Replace specific scope bindings with scope variables
 * 2. Replace specific entity targets with entity variables
 * 3. Parameterize amounts/degrees as scalable variables
 * 4. Keep operations and step ordering fixed
 */
export function abstractPlanToTemplate(
  plan: EditPlanRecord,
  name: string
): PlanTemplate {
  const variables: TemplateVariable[] = [];
  const defaults: Record<string, PlanParameterValue> = {};

  // Abstract scope into a variable
  variables.push({
    name: 'scope',
    kind: 'scope',
    dimension: 'generic',
    required: false,
    defaultValue: {
      type: 'scope',
      sections: plan.scope.sections.slice(),
      layers: plan.scope.layers.slice(),
    },
    description: `Scope: ${plan.scope.sections.join(', ') || 'all sections'}`,
  });
  defaults['scope'] = {
    type: 'scope',
    sections: plan.scope.sections.slice(),
    layers: plan.scope.layers.slice(),
  };

  // Abstract parameters into variables
  for (const param of plan.parameters) {
    if (param.modifiable) {
      variables.push({
        name: param.name,
        kind: param.kind,
        dimension: param.dimension,
        required: false,
        defaultValue: param.value,
        description: param.label,
      });
      defaults[param.name] = param.value;
    }
  }

  // Abstract steps
  const templateSteps: TemplateStep[] = plan.steps.map(step => ({
    operation: step.operation,
    target: {
      kind: 'variable' as const,
      variableName: 'target',
      entityType: step.target.entityType,
    },
    params: Object.fromEntries(
      Object.entries(step.params).map(([key, value]) => {
        // Check if this param was modifiable
        const planParam = plan.parameters.find(p => p.name === key);
        if (planParam && planParam.modifiable) {
          return [key, { kind: 'variable' as const, variableName: key }];
        }
        return [key, { kind: 'concrete' as const, value }];
      })
    ),
    role: step.role,
    descriptionTemplate: step.description,
  }));

  // Abstract constraints
  const templateConstraints: TemplateConstraint[] = plan.constraints.map(c => ({
    target: c.target,
    mode: c.mode,
    hard: c.hard,
  }));

  return {
    id: createPlanTemplateId(name),
    planType: plan.planType,
    steps: templateSteps,
    variables,
    defaults,
    constraints: templateConstraints,
    name,
    description: plan.outcome.summary,
    usageCount: 0,
  };
}

// =============================================================================
// PLAN MODIFICATION APPLICATION
// =============================================================================

/**
 * Apply a set of modifications to a plan template, producing
 * a modified template ready for execution.
 */
export function applyModifications(
  template: PlanTemplate,
  modifications: readonly PlanModification[]
): ModifiedTemplate {
  let modifiedVariables = [...template.variables];
  let modifiedDefaults = { ...template.defaults };
  let modifiedSteps = [...template.steps];
  let modifiedConstraints = [...template.constraints];
  const appliedMods: AppliedModification[] = [];

  for (const mod of modifications) {
    switch (mod.type) {
      case 'scale': {
        // Find the variable matching the dimension and scale its default
        const variable = modifiedVariables.find(v => v.dimension === mod.dimension);
        if (variable) {
          const currentDefault = modifiedDefaults[variable.name];
          if (currentDefault && currentDefault.type === 'number') {
            modifiedDefaults[variable.name] = {
              type: 'number',
              value: currentDefault.value * mod.factor,
              ...(currentDefault.unit ? { unit: currentDefault.unit } : {}),
            };
            appliedMods.push({ modification: mod, applied: true, variableAffected: variable.name });
          } else if (currentDefault && currentDefault.type === 'degree') {
            const scaled = scaleDegree(currentDefault.value, mod.factor);
            modifiedDefaults[variable.name] = { type: 'degree', value: scaled };
            appliedMods.push({ modification: mod, applied: true, variableAffected: variable.name });
          } else {
            appliedMods.push({ modification: mod, applied: false, reason: 'No scalable parameter found' });
          }
        } else {
          appliedMods.push({ modification: mod, applied: false, reason: `No variable with dimension ${mod.dimension}` });
        }
        break;
      }

      case 'retarget': {
        // Override the scope default
        modifiedDefaults['scope'] = {
          type: 'scope',
          sections: mod.newScope.sections.slice(),
          layers: mod.newScope.layers.slice(),
        };
        appliedMods.push({ modification: mod, applied: true, variableAffected: 'scope' });
        break;
      }

      case 'remove_step': {
        const originalLength = modifiedSteps.length;
        modifiedSteps = modifiedSteps.filter(step => !matchesStep(step, mod.stepMatcher));
        const stepRemoved = modifiedSteps.length < originalLength;
        const removeStepResult: AppliedModification = stepRemoved
          ? { modification: mod, applied: true }
          : { modification: mod, applied: false, reason: 'No matching step found' };
        appliedMods.push(removeStepResult);
        break;
      }

      case 'add_constraint': {
        modifiedConstraints.push(mod.constraint);
        appliedMods.push({ modification: mod, applied: true });
        break;
      }

      case 'remove_constraint': {
        const originalConstraintCount = modifiedConstraints.length;
        modifiedConstraints = modifiedConstraints.filter(c =>
          !c.target.toLowerCase().includes(mod.targetMatcher.toLowerCase())
        );
        const constraintRemoved = modifiedConstraints.length < originalConstraintCount;
        const removeConstraintResult: AppliedModification = constraintRemoved
          ? { modification: mod, applied: true }
          : { modification: mod, applied: false, reason: 'No matching constraint found' };
        appliedMods.push(removeConstraintResult);
        break;
      }

      case 'override_param': {
        modifiedDefaults[mod.paramName] = mod.newValue;
        appliedMods.push({ modification: mod, applied: true, variableAffected: mod.paramName });
        break;
      }

      case 'repeat': {
        // Repeat is handled at execution time, not template modification
        appliedMods.push({ modification: mod, applied: true });
        break;
      }
    }
  }

  return {
    template: {
      ...template,
      steps: modifiedSteps,
      variables: modifiedVariables,
      defaults: modifiedDefaults,
      constraints: modifiedConstraints,
    },
    appliedModifications: appliedMods,
    repeatCount: modifications.find((m): m is RepeatModification => m.type === 'repeat')?.count ?? 1,
  };
}

/**
 * Result of applying modifications to a template.
 */
export interface ModifiedTemplate {
  readonly template: PlanTemplate;
  readonly appliedModifications: readonly AppliedModification[];
  readonly repeatCount: number;
}

/**
 * Record of an applied modification.
 */
export interface AppliedModification {
  readonly modification: PlanModification;
  readonly applied: boolean;
  readonly variableAffected?: string;
  readonly reason?: string;
}

// =============================================================================
// NL MODIFICATION PATTERNS
// =============================================================================

/**
 * A pattern for recognizing plan modification phrases in NL.
 */
export interface ModificationPattern {
  /** The kind of modification this produces */
  readonly kind: PlanModification['type'];
  /** Dimension (for scale modifications) */
  readonly dimension?: ParameterDimension;
  /** Example phrases */
  readonly phrases: readonly string[];
  /** Scale factor (for scale modifications) */
  readonly scaleFactor?: number;
  /** Description */
  readonly description: string;
}

/**
 * Canonical modification patterns.
 */
export const MODIFICATION_PATTERNS: readonly ModificationPattern[] = [
  // Scale up
  {
    kind: 'scale',
    dimension: 'magnitude',
    phrases: ['more', 'bigger', 'stronger', 'louder', 'heavier', 'harder'],
    scaleFactor: 1.5,
    description: 'Increase the amount/degree by 50%',
  },
  {
    kind: 'scale',
    dimension: 'magnitude',
    phrases: ['much more', 'way more', 'a lot more', 'way bigger', 'much bigger'],
    scaleFactor: 2.0,
    description: 'Double the amount/degree',
  },
  {
    kind: 'scale',
    dimension: 'magnitude',
    phrases: ['a bit more', 'slightly more', 'a little more', 'a touch more'],
    scaleFactor: 1.2,
    description: 'Increase the amount/degree by 20%',
  },
  // Scale down
  {
    kind: 'scale',
    dimension: 'magnitude',
    phrases: ['less', 'smaller', 'softer', 'quieter', 'lighter', 'gentler'],
    scaleFactor: 0.67,
    description: 'Decrease the amount/degree by 33%',
  },
  {
    kind: 'scale',
    dimension: 'magnitude',
    phrases: ['much less', 'way less', 'a lot less', 'much smaller'],
    scaleFactor: 0.5,
    description: 'Halve the amount/degree',
  },
  {
    kind: 'scale',
    dimension: 'magnitude',
    phrases: ['a bit less', 'slightly less', 'a little less', 'a touch less'],
    scaleFactor: 0.83,
    description: 'Decrease the amount/degree by 17%',
  },
  // Speed
  {
    kind: 'scale',
    dimension: 'speed',
    phrases: ['faster', 'quicker', 'speed up'],
    scaleFactor: 1.25,
    description: 'Increase speed/tempo by 25%',
  },
  {
    kind: 'scale',
    dimension: 'speed',
    phrases: ['slower', 'slower tempo', 'slow down'],
    scaleFactor: 0.8,
    description: 'Decrease speed/tempo by 20%',
  },
  // Pitch
  {
    kind: 'scale',
    dimension: 'pitch',
    phrases: ['higher', 'up an octave', 'raise it'],
    scaleFactor: 1.5,
    description: 'Raise pitch',
  },
  {
    kind: 'scale',
    dimension: 'pitch',
    phrases: ['lower', 'down an octave', 'drop it'],
    scaleFactor: 0.67,
    description: 'Lower pitch',
  },
  // Exact multiples
  {
    kind: 'scale',
    dimension: 'magnitude',
    phrases: ['twice as much', 'double', 'double it'],
    scaleFactor: 2.0,
    description: 'Double the amount',
  },
  {
    kind: 'scale',
    dimension: 'magnitude',
    phrases: ['half as much', 'halve it', 'half'],
    scaleFactor: 0.5,
    description: 'Halve the amount',
  },
  {
    kind: 'scale',
    dimension: 'magnitude',
    phrases: ['triple', 'three times as much'],
    scaleFactor: 3.0,
    description: 'Triple the amount',
  },
  // Retarget
  {
    kind: 'retarget',
    phrases: [
      'to the chorus', 'to the verse', 'to the bridge',
      'to all sections', 'to everything', 'everywhere',
      'to the other sections', 'across the whole song',
    ],
    description: 'Apply the plan to a different scope',
  },
  // Remove step
  {
    kind: 'remove_step',
    phrases: [
      'but without', 'but skip', 'but don\'t',
      'leave out', 'omit', 'except',
    ],
    description: 'Remove a step from the plan',
  },
  // Add constraint
  {
    kind: 'add_constraint',
    phrases: [
      'but keep', 'but preserve', 'but maintain',
      'but don\'t change', 'while keeping', 'while preserving',
    ],
    description: 'Add a preservation constraint',
  },
  // Repeat
  {
    kind: 'repeat',
    phrases: [
      'again', 'one more time', 'repeat that',
      'do it again', 'same thing again',
      'and again', 'once more',
    ],
    description: 'Repeat the plan',
  },
  {
    kind: 'repeat',
    phrases: [
      'three more times', 'two more times',
      'a few more times', 'keep going',
    ],
    description: 'Repeat the plan multiple times',
  },
];

/**
 * Find modification patterns matching a phrase.
 */
export function matchModificationPatterns(phrase: string): readonly ModificationPattern[] {
  const lower = phrase.toLowerCase();
  return MODIFICATION_PATTERNS.filter(p =>
    p.phrases.some(pat => lower.includes(pat))
  );
}

// =============================================================================
// DISPLAY AND FORMATTING
// =============================================================================

/**
 * Format a plan record as a user-facing summary.
 */
export function formatPlanSummary(plan: EditPlanRecord): string {
  const status = plan.undone ? ' [UNDONE]' : '';
  const scope = plan.scope.sections.length > 0
    ? ` (${plan.scope.sections.join(', ')})`
    : '';
  return `Turn ${plan.turnNumber}: "${plan.utterance}" → ${plan.outcome.summary}${scope}${status}`;
}

/**
 * Format a plan template as a user-facing description.
 */
export function formatTemplateSummary(template: PlanTemplate): string {
  const variables = template.variables
    .filter(v => v.required)
    .map(v => `{${v.name}}`)
    .join(', ');
  const variableStr = variables ? ` [${variables}]` : '';
  return `${template.name}: ${template.description}${variableStr} (used ${template.usageCount}x)`;
}

/**
 * Format a plan reference resolution explanation.
 */
export function formatPlanReferenceExplanation(ref: PlanReference, plan: EditPlanRecord): string {
  const expr = formatReferenceExpression(ref.expression);
  return `"${expr}" → ${plan.outcome.summary} (resolved by ${ref.method}, confidence ${(ref.confidence * 100).toFixed(0)}%)`;
}

/**
 * Format a reference expression.
 */
function formatReferenceExpression(expr: PlanReferenceExpression): string {
  switch (expr.kind) {
    case 'pronoun': return expr.word;
    case 'definite': return expr.phrase;
    case 'demonstrative': return expr.phrase;
    case 'anaphoric': return expr.phrase;
    case 'ellipsis': return '(again)';
    case 'ordinal': return `the ${ordinalWord(expr.n)} edit`;
    case 'temporal': return expr.when;
  }
}

/**
 * Format a modification as user-facing text.
 */
export function formatModification(mod: PlanModification): string {
  switch (mod.type) {
    case 'scale':
      return `Scale ${mod.dimension} by ${mod.factor}x ("${mod.trigger}")`;
    case 'retarget':
      return `Retarget to ${mod.newScope.sections.join(', ') || 'new scope'} ("${mod.trigger}")`;
    case 'remove_step':
      return `Remove step ("${mod.trigger}")`;
    case 'add_constraint':
      return `Add constraint: ${mod.constraint.target} [${mod.constraint.mode}] ("${mod.trigger}")`;
    case 'remove_constraint':
      return `Remove constraint matching "${mod.targetMatcher}" ("${mod.trigger}")`;
    case 'override_param':
      return `Override ${mod.paramName} ("${mod.trigger}")`;
    case 'repeat':
      return `Repeat ${mod.count}x ("${mod.trigger}")`;
  }
}

/**
 * Format applied modifications report.
 */
export function formatModificationReport(mods: readonly AppliedModification[]): string {
  return mods.map(m => {
    const status = m.applied ? 'Applied' : `Skipped: ${m.reason}`;
    return `  ${status} — ${formatModification(m.modification)}`;
  }).join('\n');
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Scale a degree value by a factor.
 */
function scaleDegree(degree: DegreeValue, factor: number): DegreeValue {
  const scale: readonly DegreeValue[] = ['tiny', 'small', 'moderate', 'large', 'extreme'];
  const currentIndex = scale.indexOf(degree);
  const newIndex = Math.round(currentIndex * factor);
  const clamped = Math.max(0, Math.min(scale.length - 1, newIndex));
  return scale[clamped] ?? 'moderate';
}

/**
 * Check if a template step matches a step matcher.
 */
function matchesStep(step: TemplateStep, matcher: StepMatcher): boolean {
  switch (matcher.kind) {
    case 'by_operation':
      return step.operation === matcher.operation;
    case 'by_description':
      return step.descriptionTemplate.toLowerCase().includes(matcher.pattern.toLowerCase());
    case 'by_index':
      return false; // Would need index info
    case 'by_target':
      return step.target.kind === 'variable'
        ? step.target.entityType === matcher.entityType
        : step.target.kind === 'concrete' && step.target.entityType === matcher.entityType;
  }
}

/**
 * Convert number to ordinal word.
 */
function ordinalWord(n: number): string {
  const words: Record<number, string> = {
    1: 'first', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth',
    6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth',
  };
  return words[n] ?? `${n}th`;
}

// =============================================================================
// PLAN HISTORY STATISTICS
// =============================================================================

export interface PlanHistoryStats {
  readonly totalPlans: number;
  readonly activePlans: number;
  readonly undonePlans: number;
  readonly plansByType: Readonly<Record<string, number>>;
  readonly averageSalience: number;
  readonly mostUsedTemplate: string | undefined;
  readonly currentTurn: number;
}

/**
 * Get statistics about plan history.
 */
export function getPlanHistoryStats(history: PlanHistory): PlanHistoryStats {
  const allPlans = history.getAllPlans();
  const active = allPlans.filter(p => !p.undone);
  const byType: Record<string, number> = {};
  let totalSalience = 0;
  const templateUsage: Record<string, number> = {};

  for (const plan of allPlans) {
    byType[plan.planType] = (byType[plan.planType] ?? 0) + 1;
    totalSalience += plan.salience;
    const tmplName = plan.template.name;
    templateUsage[tmplName] = (templateUsage[tmplName] ?? 0) + 1;
  }

  let mostUsedTemplate: string | undefined;
  let maxUsage = 0;
  for (const [name, count] of Object.entries(templateUsage)) {
    if (count > maxUsage) {
      mostUsedTemplate = name;
      maxUsage = count;
    }
  }

  return {
    totalPlans: allPlans.length,
    activePlans: active.length,
    undonePlans: allPlans.length - active.length,
    plansByType: byType,
    averageSalience: allPlans.length > 0 ? totalSalience / allPlans.length : 0,
    mostUsedTemplate,
    currentTurn: history.getCurrentTurn(),
  };
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const SHARED_PLAN_RULES = [
  // Rule 1: Plans are discourse referents
  'Rule SP-001: Executed plans are first-class discourse referents. Pronouns ("it"), ' +
  'demonstratives ("that"), and anaphoric phrases ("what you just did") can resolve to plans.',

  // Rule 2: Plan salience decays
  'Rule SP-002: Plan salience decays by the configured decay rate each turn. ' +
  'Plans below the minimum salience threshold are pruned from history.',

  // Rule 3: Most recent wins for pronouns
  'Rule SP-003: Pronoun references ("do it again") resolve to the most recent ' +
  'non-undone plan by default. Descriptive references ("that chord change") ' +
  'use description matching.',

  // Rule 4: Templates abstract scope
  'Rule SP-004: Plan templates abstract scope into variables. ' +
  '"Do the same thing to the bridge" binds the scope variable to [bridge] ' +
  'while keeping all other template variables at their defaults.',

  // Rule 5: Modifications are typed
  'Rule SP-005: Modifications to reused plans are typed (scale, retarget, remove_step, etc.). ' +
  'Each modification type has a defined set of NL trigger phrases.',

  // Rule 6: Scale modifications use dimensions
  'Rule SP-006: Scale modifications ("bigger", "smaller") apply to the parameter ' +
  'matching the specified dimension (magnitude, speed, pitch, etc.). ' +
  'If no matching dimension is found, the modification fails gracefully.',

  // Rule 7: Undone plans are candidates for redo
  'Rule SP-007: Undone plans remain in history with their undone flag set. ' +
  '"Redo" resolves to the most recently undone plan.',

  // Rule 8: Constraints carry over
  'Rule SP-008: When reusing a plan template, active constraints from the original ' +
  'execution carry over by default. Users can add or remove constraints ' +
  'via modification phrases ("but keep the melody", "don\'t worry about the chords").',

  // Rule 9: Plan history is bounded
  'Rule SP-009: Plan history has a configurable maximum size (default 50). ' +
  'When the limit is reached, the least salient plans are pruned.',

  // Rule 10: All reuse is inspectable
  'Rule SP-010: When a plan is reused, the system MUST show: (1) which plan was ' +
  'recognized, (2) what modifications were applied, (3) what the resulting ' +
  'template looks like, and (4) a preview of the changes before execution.',

  // Rule 11: Repeat modifications are bounded
  'Rule SP-011: Repeat modifications ("do it again 10 times") are bounded to ' +
  'a maximum of 100 repetitions. Each repetition generates a separate ' +
  'preview for user approval.',

  // Rule 12: Plan type affects resolution
  'Rule SP-012: When multiple plans are candidates for "it", the system ' +
  'prefers plans whose type matches the current context. If the user is ' +
  'talking about harmony, a harmony-related plan scores higher than a ' +
  'rhythm-related plan.',
] as const;
