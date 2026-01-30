/**
 * GOFAI Canon — Goals, Constraints, and Preferences
 *
 * This module defines the typed model for goals, constraints, and preferences,
 * implementing Step 011 from gofai_goalB.md: "Specify the difference between
 * goals, constraints, and preferences (hard vs soft), with a stable typed model."
 *
 * ## Key Distinctions
 *
 * - **Goal**: What you want to achieve (e.g., "make it brighter")
 * - **Constraint**: What you must not violate (e.g., "preserve melody")
 * - **Preference**: What you'd like but can compromise (e.g., "prefer simpler changes")
 *
 * Goals are satisfiable or not.
 * Constraints are hard boundaries (violations block execution).
 * Preferences are soft influences (affect scoring, not satisfiability).
 *
 * @module gofai/canon/goals-constraints-preferences
 */

import type {
  AxisId,
  ConstraintTypeId,
  EntityType,
  OpcodeId,
  PerceptualAxis,
} from './types';

// =============================================================================
// Goals
// =============================================================================

/**
 * A goal represents a desired outcome.
 *
 * Goals are what the user wants to achieve. They are satisfiable (can be
 * achieved) or not. The planner's job is to find operations that satisfy goals
 * while respecting constraints.
 */
export type Goal =
  | AxisChangeGoal
  | ActionGoal
  | QueryGoal
  | StructureGoal
  | RelativeGoal;

/**
 * Goal to move along a perceptual axis.
 *
 * Examples:
 * - "make it brighter"
 * - "increase energy"
 * - "reduce busyness"
 */
export interface AxisChangeGoal {
  readonly type: 'axis_change';

  /** Which axis to affect */
  readonly axis: AxisId;

  /** Direction of change */
  readonly direction: 'increase' | 'decrease';

  /** How much (optional, can be inferred or defaulted) */
  readonly amount?: Amount;

  /** What to affect (optional, can be scoped) */
  readonly target?: EntityRef;

  /** Priority (for multi-goal coordination) */
  readonly priority?: GoalPriority;

  /** Scope (where to apply the goal) */
  readonly scope?: Scope;
}

/**
 * Goal to perform a specific action.
 *
 * Examples:
 * - "add drums"
 * - "remove the intro"
 * - "duplicate the chorus"
 */
export interface ActionGoal {
  readonly type: 'action';

  /** What action to perform */
  readonly action: OpcodeId;

  /** Parameters for the action */
  readonly params?: Record<string, unknown>;

  /** What to affect */
  readonly target?: EntityRef;

  /** Priority */
  readonly priority?: GoalPriority;
}

/**
 * Goal to query or inspect information.
 *
 * Examples:
 * - "what changed?"
 * - "show me the drums"
 * - "how many verses are there?"
 */
export interface QueryGoal {
  readonly type: 'query';

  /** What to query */
  readonly queryType: QueryType;

  /** What to query about */
  readonly target?: EntityRef;
}

/**
 * Goal related to song structure.
 *
 * Examples:
 * - "make the intro shorter"
 * - "add a bridge after the second chorus"
 * - "remove the breakdown"
 */
export interface StructureGoal {
  readonly type: 'structure';

  /** Structure operation */
  readonly operation: 'add' | 'remove' | 'shorten' | 'extend' | 'duplicate' | 'reorder';

  /** What section type */
  readonly sectionType?: string;

  /** Where in form */
  readonly position?: 'start' | 'end' | 'after' | 'before';

  /** Reference point (for relative positioning) */
  readonly relativeToent?: EntityRef;

  /** By how much (for shorten/extend) */
  readonly amount?: Amount;
}

/**
 * Goal specified relative to current state.
 *
 * Examples:
 * - "make it more like the verse"
 * - "do the same thing to the bridge"
 * - "make it as bright as before"
 */
export interface RelativeGoal {
  readonly type: 'relative';

  /** What aspect to match */
  readonly aspect: 'same' | 'opposite' | 'similar' | 'different';

  /** What to match */
  readonly reference: EntityRef;

  /** What aspect specifically */
  readonly regarding?: AxisId | 'all';
}

/**
 * Goal priority levels.
 */
export type GoalPriority = 'required' | 'important' | 'nice-to-have';

/**
 * Query types for inspection goals.
 */
export type QueryType =
  | 'what_changed' // What did the last edit do?
  | 'show' // Display something
  | 'count' // How many?
  | 'describe' // Describe current state
  | 'explain' // Why did you do X?
  | 'alternatives'; // What else could you do?

// =============================================================================
// Constraints
// =============================================================================

/**
 * A constraint represents an inviolable requirement.
 *
 * Constraints are hard boundaries. Operations that violate constraints are
 * rejected. Constraints must be executable (have verifier functions).
 */
export type Constraint =
  | PreserveConstraint
  | OnlyChangeConstraint
  | RangeConstraint
  | RelationConstraint
  | CapabilityConstraint;

/**
 * Constraint to preserve something unchanged.
 *
 * Examples:
 * - "preserve the melody"
 * - "keep the harmony"
 * - "don't change the tempo"
 */
export interface PreserveConstraint {
  readonly type: 'preserve';

  /** What to preserve */
  readonly target: EntityRef;

  /** Which aspects to preserve */
  readonly aspects: readonly PreservableAspect[];

  /** How strictly (exact match or recognizable) */
  readonly strictness: 'exact' | 'recognizable' | 'similar';
}

/**
 * Constraint to only modify specific things.
 *
 * Examples:
 * - "only change the drums"
 * - "just adjust the bass"
 * - "modify only brightness, not energy"
 */
export interface OnlyChangeConstraint {
  readonly type: 'only_change';

  /** What is allowed to change */
  readonly allowed: readonly EntityRef[];

  /** Optionally, what aspects can change */
  readonly allowedAspects?: readonly PreservableAspect[];
}

/**
 * Constraint on value ranges.
 *
 * Examples:
 * - "BPM must stay between 80 and 120"
 * - "width must be at least 0.5"
 * - "no more than 8 layers"
 */
export interface RangeConstraint {
  readonly type: 'range';

  /** What parameter */
  readonly parameter: string;

  /** Minimum value (inclusive) */
  readonly min?: number;

  /** Maximum value (inclusive) */
  readonly max?: number;

  /** Must be exactly this */
  readonly exact?: number;
}

/**
 * Constraint on relationships between entities.
 *
 * Examples:
 * - "drums must be quieter than bass"
 * - "all sections must be same length"
 * - "harmony must support melody"
 */
export interface RelationConstraint {
  readonly type: 'relation';

  /** The relationship */
  readonly relation: RelationType;

  /** First entity */
  readonly entity1: EntityRef;

  /** Second entity */
  readonly entity2: EntityRef;

  /** Aspect to compare */
  readonly aspect?: string;
}

/**
 * Constraint on required capabilities.
 *
 * Examples:
 * - "don't use AI features"
 * - "production layer must be editable"
 * - "routing must be allowed"
 */
export interface CapabilityConstraint {
  readonly type: 'capability';

  /** Required capability */
  readonly capability: string;

  /** Must be present or absent */
  readonly required: boolean;
}

/**
 * Relation types for relationship constraints.
 */
export type RelationType =
  | 'quieter_than'
  | 'louder_than'
  | 'brighter_than'
  | 'darker_than'
  | 'same_length_as'
  | 'before'
  | 'after'
  | 'supports'
  | 'conflicts_with';

/**
 * Aspects that can be preserved.
 */
export type PreservableAspect =
  | 'melody' // Pitch sequence and rhythm
  | 'harmony' // Chord progression
  | 'rhythm' // Timing and groove
  | 'structure' // Section boundaries
  | 'timbre' // Sound design
  | 'dynamics' // Velocity patterns
  | 'register' // Pitch range
  | 'density' // Note count
  | 'width' // Stereo positioning
  | 'tempo' // BPM
  | 'all'; // Everything

// =============================================================================
// Preferences
// =============================================================================

/**
 * A preference represents a soft constraint or bias.
 *
 * Preferences influence planning and scoring but can be overridden when
 * necessary to satisfy goals and constraints. They capture user taste and
 * workflow patterns.
 */
export type Preference =
  | LeverPreference
  | CostPreference
  | ScopePreference
  | OrderPreference
  | DefaultPreference;

/**
 * Preference for which levers to use.
 *
 * Examples:
 * - "prefer voicing changes over register shifts"
 * - "favor DSP over arrangement changes"
 * - "use harmony before melody when possible"
 */
export interface LeverPreference {
  readonly type: 'lever';

  /** Preferred lever */
  readonly preferred: OpcodeId;

  /** Strength of preference */
  readonly strength: PreferenceStrength;

  /** When this preference applies */
  readonly context?: PreferenceContext;
}

/**
 * Preference for edit cost levels.
 *
 * Examples:
 * - "prefer simpler changes"
 * - "avoid high-cost operations"
 * - "minimize disruption"
 */
export interface CostPreference {
  readonly type: 'cost';

  /** Preferred cost level */
  readonly preferredCost: 'low' | 'medium' | 'high';

  /** Strength */
  readonly strength: PreferenceStrength;
}

/**
 * Preference for scope.
 *
 * Examples:
 * - "default to current section"
 * - "prefer affecting all sections when unspecified"
 * - "assume local scope"
 */
export interface ScopePreference {
  readonly type: 'scope';

  /** Preferred scope */
  readonly preferredScope: 'local' | 'section' | 'global';

  /** Strength */
  readonly strength: PreferenceStrength;
}

/**
 * Preference for operation order.
 *
 * Examples:
 * - "structure changes before parameter tweaks"
 * - "arrangement before production"
 * - "rhythm before harmony"
 */
export interface OrderPreference {
  readonly type: 'order';

  /** Preferred ordering */
  readonly ordering: readonly OperationCategory[];

  /** Strength */
  readonly strength: PreferenceStrength;
}

/**
 * Preference for default values.
 *
 * Examples:
 * - "default amount is 'moderate'"
 * - "assume 4 bars when length unspecified"
 * - "prefer major over minor"
 */
export interface DefaultPreference {
  readonly type: 'default';

  /** Parameter name */
  readonly parameter: string;

  /** Default value */
  readonly defaultValue: unknown;

  /** Strength */
  readonly strength: PreferenceStrength;
}

/**
 * Preference strength levels.
 */
export type PreferenceStrength = 'weak' | 'moderate' | 'strong';

/**
 * Context when a preference applies.
 */
export interface PreferenceContext {
  /** Which board persona */
  readonly boardPersona?: 'full-manual' | 'assisted' | 'full-ai';

  /** Which project type */
  readonly projectType?: string;

  /** Which user */
  readonly userId?: string;
}

/**
 * Operation categories for ordering.
 */
export type OperationCategory =
  | 'structure' // Section-level changes
  | 'arrangement' // Layer-level changes
  | 'harmony' // Chord-level changes
  | 'melody' // Note-level changes
  | 'rhythm' // Timing changes
  | 'production'; // DSP changes

// =============================================================================
// Request Model
// =============================================================================

/**
 * A complete user request with goals, constraints, and preferences.
 *
 * This is what gets compiled from natural language input.
 */
export interface UserRequest {
  /** What the user wants to achieve */
  readonly goals: readonly Goal[];

  /** What must not be violated */
  readonly constraints: readonly Constraint[];

  /** What the user prefers (soft) */
  readonly preferences: readonly Preference[];

  /** Scope for the request */
  readonly scope?: Scope;

  /** Provenance information */
  readonly provenance?: RequestProvenance;
}

/**
 * Scope specification.
 */
export interface Scope {
  /** Type of scope */
  readonly type?: 'section' | 'layer' | 'time' | 'selection';

  /** Which sections */
  readonly sections?: readonly string[];

  /** Which layers */
  readonly layers?: readonly string[];

  /** Time range */
  readonly timeRange?: TimeRange;

  /** Selection */
  readonly selection?: 'current' | 'all' | 'custom';

  /** Custom selection (if 'custom') */
  readonly customSelection?: readonly EntityRef[];
}

/**
 * Time range specification.
 */
export interface TimeRange {
  /** Start position */
  readonly start: TimePosition;

  /** End position */
  readonly end: TimePosition;

  /** Whether edges are inclusive */
  readonly inclusive: boolean;
}

/**
 * Time position (bars/beats/ticks).
 */
export interface TimePosition {
  readonly bars: number;
  readonly beats?: number;
  readonly ticks?: number;
}

/**
 * Entity reference (resolved or unresolved).
 */
export type EntityRef =
  | { readonly type: 'id'; readonly id: string }
  | { readonly type: 'name'; readonly name: string }
  | { readonly type: 'deictic'; readonly ref: 'this' | 'that' | 'these' | 'those' }
  | { readonly type: 'anaphoric'; readonly ref: 'it' | 'them' | 'its' }
  | { readonly type: 'quantified'; readonly quantifier: 'all' | 'some' | 'every' | 'each'; readonly entityType: EntityType };

/**
 * Amount specification.
 */
export type Amount =
  | { readonly type: 'numeric'; readonly value: number; readonly unit?: string }
  | { readonly type: 'degree'; readonly degree: 'slight' | 'moderate' | 'significant' | 'extreme' }
  | { readonly type: 'relative'; readonly relative: 'more' | 'less' | 'same' | 'double' | 'half' }
  | { readonly type: 'default' }; // Use planner's default

/**
 * Request provenance.
 */
export interface RequestProvenance {
  /** Original utterance */
  readonly utterance: string;

  /** Normalized form */
  readonly normalized: string;

  /** Parse tree */
  readonly parseTree?: unknown;

  /** Semantic trace */
  readonly semanticTrace: readonly string[];

  /** Timestamp */
  readonly timestamp: number;
}

// =============================================================================
// Satisfaction Checking
// =============================================================================

/**
 * Result of goal satisfaction check.
 */
export type GoalSatisfaction =
  | { readonly satisfied: true; readonly plan: unknown }
  | { readonly satisfied: false; readonly reason: string; readonly alternatives?: readonly unknown[] };

/**
 * Result of constraint verification.
 */
export type ConstraintVerification =
  | { readonly verified: true }
  | { readonly verified: false; readonly violation: ConstraintViolation };

/**
 * A constraint violation report.
 */
export interface ConstraintViolation {
  /** Which constraint was violated */
  readonly constraint: Constraint;

  /** What entity violated it */
  readonly violatingEntity?: EntityRef;

  /** Human-readable explanation */
  readonly message: string;

  /** Evidence of violation */
  readonly evidence?: unknown;

  /** Suggestions for fixing */
  readonly suggestions: readonly string[];
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Check if a goal is satisfiable.
 */
export function isGoalSatisfiable(_goal: Goal, _constraints: readonly Constraint[]): boolean {
  // TODO: Implement in planning module
  // For now, stub
  return true;
}

/**
 * Check if constraints are compatible.
 */
export function areConstraintsCompatible(_constraints: readonly Constraint[]): boolean {
  // TODO: Implement constraint compatibility checking
  // For now, stub
  return true;
}

/**
 * Get goal priority as numeric value.
 */
export function getGoalPriorityValue(priority?: GoalPriority): number {
  switch (priority) {
    case 'required':
      return 3;
    case 'important':
      return 2;
    case 'nice-to-have':
      return 1;
    default:
      return 2; // Default to important
  }
}

/**
 * Get preference strength as numeric value.
 */
export function getPreferenceStrengthValue(strength: PreferenceStrength): number {
  switch (strength) {
    case 'strong':
      return 1.0;
    case 'moderate':
      return 0.5;
    case 'weak':
      return 0.2;
  }
}

/**
 * Check if an entity reference is resolved.
 */
export function isEntityRefResolved(ref: EntityRef): boolean {
  return ref.type === 'id';
}

/**
 * Format goal as human-readable string.
 */
export function formatGoal(goal: Goal): string {
  switch (goal.type) {
    case 'axis_change':
      return `${goal.direction} ${goal.axis}${goal.target ? ` on ${formatEntityRef(goal.target)}` : ''}`;
    case 'action':
      return `${goal.action}${goal.target ? ` on ${formatEntityRef(goal.target)}` : ''}`;
    case 'query':
      return `${goal.queryType}${goal.target ? ` about ${formatEntityRef(goal.target)}` : ''}`;
    case 'structure':
      return `${goal.operation} ${goal.sectionType || 'section'}`;
    case 'relative':
      return `make ${goal.aspect} ${formatEntityRef(goal.reference)}`;
  }
}

/**
 * Format constraint as human-readable string.
 */
export function formatConstraint(constraint: Constraint): string {
  switch (constraint.type) {
    case 'preserve':
      return `preserve ${constraint.aspects.join(', ')} of ${formatEntityRef(constraint.target)}`;
    case 'only_change':
      return `only change ${constraint.allowed.map(formatEntityRef).join(', ')}`;
    case 'range':
      return `${constraint.parameter} must be ${formatRange(constraint)}`;
    case 'relation':
      return `${formatEntityRef(constraint.entity1)} must be ${constraint.relation} ${formatEntityRef(constraint.entity2)}`;
    case 'capability':
      return `${constraint.capability} must be ${constraint.required ? 'available' : 'disabled'}`;
  }
}

/**
 * Format entity reference as string.
 */
export function formatEntityRef(ref: EntityRef): string {
  switch (ref.type) {
    case 'id':
      return ref.id;
    case 'name':
      return ref.name;
    case 'deictic':
      return ref.ref;
    case 'anaphoric':
      return ref.ref;
    case 'quantified':
      return `${ref.quantifier} ${ref.entityType}`;
  }
}

/**
 * Format range constraint value.
 */
function formatRange(constraint: RangeConstraint): string {
  if (constraint.exact !== undefined) {
    return `${constraint.exact}`;
  }
  if (constraint.min !== undefined && constraint.max !== undefined) {
    return `between ${constraint.min} and ${constraint.max}`;
  }
  if (constraint.min !== undefined) {
    return `at least ${constraint.min}`;
  }
  if (constraint.max !== undefined) {
    return `at most ${constraint.max}`;
  }
  return 'valid';
}

// =============================================================================
// Factory Functions (for testing and convenience)
// =============================================================================

/**
 * Create an axis change goal.
 */
export function createAxisChangeGoal(
  axis: string,
  direction: 'increase' | 'decrease' | 'change',
  magnitude?: number | string,
  options?: Partial<AxisChangeGoal>
): AxisChangeGoal {
  return {
    type: 'axis_change',
    axis: axis as AxisId,
    direction: direction === 'change' ? 'increase' : direction,
    amount: magnitude !== undefined ? ({ value: magnitude } as Amount) : undefined,
    target: options?.target,
    priority: options?.priority,
    scope: options?.scope,
  };
}

/**
 * Create a preserve constraint.
 */
export function createPreserveConstraint(
  aspect: string,
  exactness: 'unchanged' | 'recognizable',
  options?: Partial<PreserveConstraint> & { metadata?: Record<string, unknown> }
): PreserveConstraint & { aspect: string; exactness: 'exact' | 'recognizable'; severity: 'blocking'; metadata?: Record<string, unknown> } {
  const mappedExactness = exactness === 'unchanged' ? 'exact' : 'recognizable';
  return {
    type: 'preserve',
    aspects: [aspect as PreservableAspect],
    strictness: mappedExactness as 'exact' | 'recognizable',
    aspect, // Add aspect (singular) for backward compatibility
    exactness: mappedExactness as 'exact' | 'recognizable', // Add exactness for backward compatibility, mapped
    severity: options?.severity || 'blocking', // All constraints are blocking by default
    target: options?.target || { type: 'name', name: aspect },
    ...(options?.metadata && { metadata: options.metadata }),
  } as any;
}

/**
 * Create a range constraint.
 */
export function createRangeConstraint(
  targetName: string,
  min?: number,
  max?: number,
  options?: { severity?: string; metadata?: Record<string, unknown> }
): RangeConstraint & { severity?: string; metadata?: Record<string, unknown> } {
  return {
    type: 'range',
    parameter: targetName,
    min,
    max,
    ...(options?.severity && { severity: options.severity }),
    ...(options?.metadata && { metadata: options.metadata }),
  } as any;
}

/**
 * Create a minimal cost preference.
 */
export function createMinimalCostPreference(
  strength: number = 0.8
): CostPreference & { costType: string; preference: string } {
  return {
    type: 'cost',
    preferredCost: 'low',
    strength: strengthToEnum(strength),
    costType: 'total', // Add for backward compatibility
    preference: 'minimize', // Add for backward compatibility
  } as any;
}

/**
 * Create a naturalness preference.
 */
export function createNaturalnessPreference(
  strength: number = 0.7
): DefaultPreference {
  return {
    type: 'default',
    parameter: 'naturalness',
    defaultValue: true,
    strength: strengthToEnum(strength),
  };
}

function strengthToEnum(n: number): PreferenceStrength {
  if (n >= 0.8) return 'strong';
  if (n >= 0.5) return 'moderate';
  return 'weak';
}

/**
 * Builder for constructing user requests with goals, constraints, and preferences.
 */
export class IntentBuilder {
  private goals: Goal[] = [];
  private constraints: Constraint[] = [];
  private preferences: Preference[] = [];
  private scope?: Scope;
  private metadata?: Record<string, unknown>;

  addGoal(goal: Goal): this {
    this.goals.push(goal);
    return this;
  }

  addConstraint(constraint: Constraint): this {
    this.constraints.push(constraint);
    return this;
  }

  addPreference(preference: Preference): this {
    this.preferences.push(preference);
    return this;
  }

  setScope(scope: Scope): this {
    this.scope = scope;
    return this;
  }

  setMetadata(metadata: Record<string, unknown>): this {
    this.metadata = metadata;
    return this;
  }

  build(): UserRequest & { metadata?: Record<string, unknown> } {
    return {
      goals: this.goals,
      constraints: this.constraints,
      preferences: this.preferences,
      scope: this.scope,
      metadata: this.metadata,
    };
  }
}

/**
 * Detect conflicting constraints.
 */
export function detectConflictingConstraints(
  constraints: readonly Constraint[]
): readonly ConstraintConflict[] {
  const conflicts: ConstraintConflict[] = [];

  for (let i = 0; i < constraints.length; i++) {
    for (let j = i + 1; j < constraints.length; j++) {
      const c1 = constraints[i];
      const c2 = constraints[j];

      if (constraintsConflict(c1, c2)) {
        // Use constraint IDs directly (tests set them)
        const id1 = (c1 as any).id;
        const id2 = (c2 as any).id;
        conflicts.push({
          constraint1: id1,
          constraint2: id2,
          reason: `Cannot both ${formatConstraint(c1)} and ${formatConstraint(c2)}`,
          severity: 'blocking' as any,
        });
      }
    }
  }

  return conflicts;
}

export interface ConstraintConflict {
  readonly constraint1: string;
  readonly constraint2: string;
  readonly reason: string;
  readonly severity: string;
}

function constraintsConflict(c1: Constraint, c2: Constraint): boolean {
  // Preserve + range on same target
  if (c1.type === 'preserve' && c2.type === 'range') {
    const p = c1 as PreserveConstraint;
    const r = c2 as RangeConstraint;
    // Simplified check - aspects are strings, parameter is a string
    if (p.aspects[0] === r.parameter) {
      return true;
    }
  }
  if (c2.type === 'preserve' && c1.type === 'range') {
    return constraintsConflict(c2, c1);
  }
  return false;
}

/**
 * Check goal feasibility given constraints.
 */
export function checkGoalFeasibility(
  goals: readonly Goal[],
  constraints: readonly Constraint[]
): FeasibilityResult {
  const conflicts: GoalConstraintConflict[] = [];

  for (const goal of goals) {
    for (const constraint of constraints) {
      if (goalConstraintConflict(goal, constraint)) {
        // Use IDs directly if set by tests
        const gid = (goal as any).id;
        const cid = (constraint as any).id;
        conflicts.push({
          goal: gid,
          constraint: cid,
          reason: `Goal "${formatGoal(goal)}" conflicts with constraint "${formatConstraint(constraint)}"`,
        });
      }
    }
  }

  return {
    feasible: conflicts.length === 0,
    conflicts,
  };
}

export interface FeasibilityResult {
  readonly feasible: boolean;
  readonly conflicts: readonly GoalConstraintConflict[];
}

export interface GoalConstraintConflict {
  readonly goal: string;
  readonly constraint: string;
  readonly reason: string;
}

function goalConstraintConflict(goal: Goal, constraint: Constraint): boolean {
  if (goal.type === 'axis_change' && constraint.type === 'preserve') {
    const g = goal as AxisChangeGoal;
    const c = constraint as PreserveConstraint;

    // Changing pitch conflicts with preserving melody
    if (g.axis === ('pitch' as any) && c.aspects.includes('melody' as any)) {
      return true;
    }
    // Changing timing conflicts with preserving rhythm
    if (g.axis === ('timing' as any) && c.aspects.includes('rhythm' as any)) {
      return true;
    }
  }
  return false;
}

/**
 * Rank goals by priority.
 */
export function rankGoals(goals: readonly Goal[]): readonly Goal[] {
  return [...goals].sort((a, b) => {
    const ap = getGoalPriorityValue(
      (a.type !== 'query' && 'priority' in a) ? a.priority : undefined
    );
    const bp = getGoalPriorityValue(
      (b.type !== 'query' && 'priority' in b) ? b.priority : undefined
    );
    return bp - ap;
  });
}

/**
 * Filter preferences by minimum strength.
 */
export function filterPreferences(
  preferences: readonly Preference[],
  minStrength: number = 0.5
): readonly Preference[] {
  return preferences.filter(p => getPreferenceStrengthValue(p.strength) >= minStrength);
}

/**
 * Compute precedence hierarchy.
 */
export function computePrecedence(intent: UserRequest): PrecedenceInfo {
  return {
    mustSatisfy: intent.constraints,
    shouldAchieve: rankGoals(intent.goals),
    mayConsider: filterPreferences(intent.preferences),
  };
}

export interface PrecedenceInfo {
  readonly mustSatisfy: readonly Constraint[];
  readonly shouldAchieve: readonly Goal[];
  readonly mayConsider: readonly Preference[];
}
