/**
 * @file Goals, Constraints, and Preferences Type System
 * @module gofai/canon/goals-constraints
 * 
 * Implements Step 011: Define the difference between **goals**, **constraints**, 
 * and **preferences** (hard vs soft), with a stable typed model.
 * 
 * This module provides the foundational type system for expressing what the user
 * wants to achieve (goals), what must not be violated (constraints), and what
 * would be nice but is negotiable (preferences).
 * 
 * Key distinctions:
 * - **Goals**: What the user wants to accomplish (e.g., "make it brighter")
 * - **Constraints**: Hard requirements that must be satisfied (e.g., "preserve melody exact")
 * - **Preferences**: Soft requirements that influence planning but can be traded off
 * 
 * @see docs/gofai/product-contract.md
 * @see gofai_goalB.md Step 011
 */

import type { AxisId, LexemeId } from './types.js';
import type { ProjectWorldAPI } from '../infra/project-world-api.js';

/**
 * A selector identifies a subset of the project to operate on
 * Format: "selector:<type>:<id>" or a complex selector expression
 */
export type SelectorId = string & { readonly __brand: 'SelectorId' };

// ============================================================================
// Core Type Hierarchy
// ============================================================================

/**
 * Intent category: distinguishes goals, constraints, and preferences
 */
export type IntentCategory = 'goal' | 'constraint' | 'preference';

/**
 * Constraint strength: how strictly a requirement must be satisfied
 * 
 * - `required`: Must be satisfied; planning fails if violated
 * - `preferred`: Should be satisfied if possible; can be relaxed
 * - `suggested`: Nice to have; influences scoring but not legality
 */
export type ConstraintStrength = 'required' | 'preferred' | 'suggested';

/**
 * Base interface for all user intents (goals, constraints, preferences)
 */
export interface Intent {
  /** Unique ID for this intent */
  readonly id: string;
  
  /** Category: goal, constraint, or preference */
  readonly category: IntentCategory;
  
  /** Human-readable description */
  readonly description: string;
  
  /** Provenance: which lexemes/utterance generated this */
  readonly provenance: IntentProvenance;
  
  /** Optional: explicit scope restriction */
  readonly scope?: SelectorId;
}

/**
 * Provenance information for an intent
 */
export interface IntentProvenance {
  /** Original utterance text */
  readonly utterance: string;
  
  /** Character span in utterance */
  readonly span: readonly [number, number];
  
  /** Lexemes that contributed to this intent */
  readonly lexemes: readonly LexemeId[];
  
  /** Turn number in conversation */
  readonly turnIndex: number;
}

// ============================================================================
// Goals: What the User Wants to Accomplish
// ============================================================================

/**
 * A goal: something the user wants to achieve
 * 
 * Examples:
 * - "make it brighter"
 * - "increase the energy"
 * - "thin out the texture"
 * 
 * Goals drive planning: the planner selects levers and opcodes to satisfy goals.
 */
export interface Goal extends Intent {
  readonly category: 'goal';
  
  /** The target axis to modify */
  readonly axis: AxisId;
  
  /** Desired direction: positive or negative */
  readonly direction: 'increase' | 'decrease';
  
  /** Amount: how much to change (0.0 to 1.0, or explicit value) */
  readonly amount: GoalAmount;
  
  /** Optional: additional goals that should be satisfied together */
  readonly subgoals?: readonly Goal[];
}

/**
 * How much to change an axis
 */
export type GoalAmount =
  | { readonly type: 'relative'; readonly value: number } // "a little", "a lot" (0.0-1.0)
  | { readonly type: 'absolute'; readonly value: number } // "to 120 BPM"
  | { readonly type: 'unspecified' }; // "brighter" (amount inferred)

// ============================================================================
// Constraints: Hard Requirements That Must Be Satisfied
// ============================================================================

/**
 * A constraint: a hard requirement that must not be violated
 * 
 * Examples:
 * - "preserve melody exact"
 * - "don't change the chords"
 * - "keep tempo steady"
 * 
 * Constraints prune the search space: plans that violate constraints are illegal.
 */
export interface Constraint extends Intent {
  readonly category: 'constraint';
  
  /** Constraint strength: required, preferred, or suggested */
  readonly strength: ConstraintStrength;
  
  /** Constraint type */
  readonly type: ConstraintType;
  
  /** Optional: tolerance for "approximately equal" constraints */
  readonly tolerance?: ConstraintTolerance;
}

/**
 * Types of constraints
 */
export type ConstraintType =
  | PreserveConstraint
  | OnlyChangeConstraint
  | RangeConstraint
  | RelationConstraint
  | StructuralConstraint;

/**
 * Preserve constraint: keep something unchanged
 * 
 * Examples:
 * - "preserve melody exact"
 * - "keep harmony recognizable"
 * - "don't change rhythm"
 */
export interface PreserveConstraint {
  readonly kind: 'preserve';
  
  /** What to preserve */
  readonly target: PreserveTarget;
  
  /** How strictly to preserve */
  readonly mode: PreserveMode;
  
  /** Optional: scope restriction */
  readonly scope?: SelectorId;
}

/**
 * What can be preserved
 */
export type PreserveTarget =
  | 'melody'
  | 'harmony'
  | 'rhythm'
  | 'structure'
  | 'tempo'
  | 'dynamics'
  | 'arrangement'
  | 'voicing'
  | 'register'
  | 'orchestration';

/**
 * How strictly to preserve something
 */
export type PreserveMode =
  | 'exact'        // Bit-for-bit identical
  | 'recognizable' // Perceptually similar, allows minor variations
  | 'functional'   // Same musical function, allows substitutions
  | 'approximate'; // General character preserved

/**
 * Only-change constraint: restrict modifications to a specific scope
 * 
 * Examples:
 * - "only change drums"
 * - "only affect the chorus"
 * - "don't touch the lead"
 */
export interface OnlyChangeConstraint {
  readonly kind: 'only-change';
  
  /** What is allowed to change */
  readonly allowed: SelectorId;
  
  /** Optional: what must not change (complement) */
  readonly forbidden?: SelectorId;
}

/**
 * Range constraint: keep a value within bounds
 * 
 * Examples:
 * - "keep BPM between 110 and 130"
 * - "width must be at least 0.5"
 * - "no more than 4 layers"
 */
export interface RangeConstraint {
  readonly kind: 'range';
  
  /** What to constrain */
  readonly target: string; // Param path or axis ID
  
  /** Minimum value (inclusive) */
  readonly min?: number;
  
  /** Maximum value (inclusive) */
  readonly max?: number;
}

/**
 * Relation constraint: maintain a relationship between values
 * 
 * Examples:
 * - "bass must be lower than melody"
 * - "kick and bass should align"
 * - "intro should be sparser than chorus"
 */
export interface RelationConstraint {
  readonly kind: 'relation';
  
  /** First entity */
  readonly left: SelectorId;
  
  /** Relationship operator */
  readonly operator: RelationOperator;
  
  /** Second entity */
  readonly right: SelectorId;
}

export type RelationOperator =
  | 'less-than'
  | 'greater-than'
  | 'equal'
  | 'aligned'
  | 'contrasts-with';

/**
 * Structural constraint: maintain compositional structure
 * 
 * Examples:
 * - "don't add new sections"
 * - "keep the number of layers constant"
 * - "maintain the verse-chorus form"
 */
export interface StructuralConstraint {
  readonly kind: 'structural';
  
  /** What structural property to maintain */
  readonly property: StructuralProperty;
  
  /** Optional: scope */
  readonly scope?: SelectorId;
}

export type StructuralProperty =
  | 'section-count'
  | 'layer-count'
  | 'form'
  | 'length'
  | 'time-signature'
  | 'key';

/**
 * Constraint tolerance for approximate equality
 */
export interface ConstraintTolerance {
  /** Tolerance type */
  readonly type: 'absolute' | 'relative' | 'perceptual';
  
  /** Tolerance value */
  readonly value: number;
  
  /** Optional: units */
  readonly units?: string;
}

// ============================================================================
// Preferences: Soft Requirements That Influence Planning
// ============================================================================

/**
 * A preference: a soft requirement that influences planning but can be traded off
 * 
 * Examples:
 * - "prefer minimal changes"
 * - "favor orchestration over DSP"
 * - "avoid adding new tracks if possible"
 * 
 * Preferences affect plan scoring but don't make plans illegal.
 */
export interface Preference extends Intent {
  readonly category: 'preference';
  
  /** Preference type */
  readonly type: PreferenceType;
  
  /** Weight: how important this preference is (0.0 to 1.0) */
  readonly weight: number;
}

/**
 * Types of preferences
 */
export type PreferenceType =
  | EditStylePreference
  | LayerPreference
  | MethodPreference
  | CostPreference;

/**
 * Edit style preference: prefer certain editing approaches
 * 
 * Examples:
 * - "prefer subtle changes"
 * - "be bold"
 * - "keep it simple"
 */
export interface EditStylePreference {
  readonly kind: 'edit-style';
  readonly style: 'minimal' | 'moderate' | 'bold' | 'experimental';
}

/**
 * Layer preference: prefer working with certain layers
 * 
 * Examples:
 * - "prefer drums and bass"
 * - "avoid touching the lead"
 */
export interface LayerPreference {
  readonly kind: 'layer';
  readonly prefer?: SelectorId;
  readonly avoid?: SelectorId;
}

/**
 * Method preference: prefer certain implementation methods
 * 
 * Examples:
 * - "use orchestration rather than DSP"
 * - "prefer arrangement changes over sound design"
 */
export interface MethodPreference {
  readonly kind: 'method';
  readonly method: 'orchestration' | 'dsp' | 'arrangement' | 'composition';
  readonly direction: 'prefer' | 'avoid';
}

/**
 * Cost preference: prefer low-cost edits
 */
export interface CostPreference {
  readonly kind: 'cost';
  readonly maxCost?: number;
  readonly preferMinimal: boolean;
}

// ============================================================================
// Intent Collections and Resolution
// ============================================================================

/**
 * A collection of related intents forming a complete user request
 */
export interface IntentBundle {
  /** Primary goal(s) */
  readonly goals: readonly Goal[];
  
  /** Hard constraints */
  readonly constraints: readonly Constraint[];
  
  /** Soft preferences */
  readonly preferences: readonly Preference[];
  
  /** Metadata */
  readonly metadata: IntentBundleMetadata;
}

export interface IntentBundleMetadata {
  /** When this bundle was created */
  readonly timestamp: number;
  
  /** Turn index in conversation */
  readonly turnIndex: number;
  
  /** Original utterance */
  readonly utterance: string;
  
  /** Confidence: how certain we are about the interpretation */
  readonly confidence: 'high' | 'medium' | 'low';
  
  /** Holes: unresolved references or ambiguities */
  readonly holes: readonly IntentHole[];
}

/**
 * An unresolved aspect of an intent requiring clarification
 */
export interface IntentHole {
  /** Hole ID */
  readonly id: string;
  
  /** What is missing or ambiguous */
  readonly type: 'scope' | 'amount' | 'target' | 'mode' | 'ambiguity';
  
  /** Description for user */
  readonly description: string;
  
  /** Possible resolutions */
  readonly options?: readonly IntentHoleOption[];
}

export interface IntentHoleOption {
  /** Option ID */
  readonly id: string;
  
  /** Description */
  readonly description: string;
  
  /** How to fill this hole */
  readonly resolution: unknown; // Type depends on hole type
}

// ============================================================================
// Constraint Checking
// ============================================================================

/**
 * Result of checking constraints against a plan or diff
 */
export interface ConstraintCheckResult {
  /** All constraints passed */
  readonly satisfied: boolean;
  
  /** Violations (if any) */
  readonly violations: readonly ConstraintViolation[];
  
  /** Warnings (soft constraints that weren't satisfied) */
  readonly warnings: readonly ConstraintWarning[];
  
  /** Overall compliance score (0.0 to 1.0) */
  readonly score: number;
}

/**
 * A constraint violation
 */
export interface ConstraintViolation {
  /** Which constraint was violated */
  readonly constraint: Constraint;
  
  /** Severity */
  readonly severity: 'error' | 'warning';
  
  /** Description of violation */
  readonly message: string;
  
  /** Evidence: what was changed that shouldn't have been */
  readonly evidence: ViolationEvidence;
  
  /** Suggestions for fixing */
  readonly suggestions: readonly string[];
}

/**
 * Evidence of a constraint violation
 */
export type ViolationEvidence =
  | { readonly type: 'changed-value'; readonly path: string; readonly before: unknown; readonly after: unknown }
  | { readonly type: 'out-of-range'; readonly path: string; readonly value: number; readonly min?: number; readonly max?: number }
  | { readonly type: 'relation-broken'; readonly left: string; readonly right: string; readonly expected: string; readonly actual: string }
  | { readonly type: 'structural'; readonly property: string; readonly expected: unknown; readonly actual: unknown };

/**
 * A warning about an unsatisfied soft constraint
 */
export interface ConstraintWarning {
  /** Which preference wasn't satisfied */
  readonly preference: Preference;
  
  /** Why it wasn't satisfied */
  readonly reason: string;
  
  /** Impact on plan quality */
  readonly impact: 'low' | 'medium' | 'high';
}

// ============================================================================
// Constraint Checking Functions
// ============================================================================

/**
 * Check if a constraint is satisfied
 * 
 * @param constraint - Constraint to check
 * @param before - Project state before edit
 * @param after - Project state after edit
 * @param world - Project world API for queries
 * @returns Constraint check result
 */
export function checkConstraint(
  constraint: Constraint,
  _before: unknown,
  _after: unknown,
  _world: ProjectWorldAPI
): ConstraintCheckResult {
  // Detailed implementation would go here
  // This is a placeholder showing the interface
  
  const violations: ConstraintViolation[] = [];
  const warnings: ConstraintWarning[] = [];
  
  // Check based on constraint type
  switch (constraint.type.kind) {
    case 'preserve':
      // Check if target was preserved according to mode
      break;
    case 'only-change':
      // Check if changes stayed within allowed scope
      break;
    case 'range':
      // Check if value stayed within bounds
      break;
    case 'relation':
      // Check if relation still holds
      break;
    case 'structural':
      // Check if structure was maintained
      break;
  }
  
  return {
    satisfied: violations.length === 0,
    violations,
    warnings,
    score: violations.length === 0 ? 1.0 : 0.0
  };
}

/**
 * Check all constraints in a bundle
 */
export function checkConstraints(
  bundle: IntentBundle,
  before: unknown,
  after: unknown,
  world: ProjectWorldAPI
): ConstraintCheckResult {
  const results = bundle.constraints.map(c => checkConstraint(c, before, after, world));
  
  return {
    satisfied: results.every(r => r.satisfied),
    violations: results.flatMap(r => r.violations),
    warnings: results.flatMap(r => r.warnings),
    score: results.reduce((sum, r) => sum + r.score, 0) / results.length
  };
}

// ============================================================================
// Intent Construction Helpers
// ============================================================================

/**
 * Create a new goal
 */
export function createGoal(params: {
  axis: AxisId;
  direction: 'increase' | 'decrease';
  amount?: GoalAmount;
  description?: string;
  provenance: IntentProvenance;
  scope?: SelectorId;
}): Goal {
  return {
    id: generateIntentId('goal'),
    category: 'goal',
    axis: params.axis,
    direction: params.direction,
    amount: params.amount ?? { type: 'unspecified' },
    description: params.description ?? `${params.direction} ${params.axis}`,
    provenance: params.provenance,
    ...(params.scope ? { scope: params.scope } : {})
  };
}

/**
 * Create a preserve constraint
 */
export function createPreserveConstraint(params: {
  target: PreserveTarget;
  mode: PreserveMode;
  strength?: ConstraintStrength;
  description?: string;
  provenance: IntentProvenance;
  scope?: SelectorId;
}): Constraint {
  const constraintType: PreserveConstraint = {
    kind: 'preserve',
    target: params.target,
    mode: params.mode,
    ...(params.scope ? { scope: params.scope } : {})
  };
  
  return {
    id: generateIntentId('constraint'),
    category: 'constraint',
    strength: params.strength ?? 'required',
    type: constraintType,
    description: params.description ?? `preserve ${params.target} ${params.mode}`,
    provenance: params.provenance,
    ...(params.scope ? { scope: params.scope } : {})
  };
}

/**
 * Create an only-change constraint
 */
export function createOnlyChangeConstraint(params: {
  allowed: SelectorId;
  forbidden?: SelectorId;
  strength?: ConstraintStrength;
  description?: string;
  provenance: IntentProvenance;
}): Constraint {
  return {
    id: generateIntentId('constraint'),
    category: 'constraint',
    strength: params.strength ?? 'required',
    type: {
      kind: 'only-change',
      allowed: params.allowed,
      forbidden: params.forbidden
    },
    description: params.description ?? `only change ${params.allowed}`,
    provenance: params.provenance
  };
}

/**
 * Create a preference
 */
export function createPreference(params: {
  type: PreferenceType;
  weight?: number;
  description?: string;
  provenance: IntentProvenance;
}): Preference {
  return {
    id: generateIntentId('preference'),
    category: 'preference',
    type: params.type,
    weight: params.weight ?? 0.5,
    description: params.description ?? 'preference',
    provenance: params.provenance
  };
}

/**
 * Create an intent bundle
 */
export function createIntentBundle(params: {
  goals?: readonly Goal[];
  constraints?: readonly Constraint[];
  preferences?: readonly Preference[];
  utterance: string;
  turnIndex: number;
  confidence?: 'high' | 'medium' | 'low';
  holes?: readonly IntentHole[];
}): IntentBundle {
  return {
    goals: params.goals ?? [],
    constraints: params.constraints ?? [],
    preferences: params.preferences ?? [],
    metadata: {
      timestamp: Date.now(),
      turnIndex: params.turnIndex,
      utterance: params.utterance,
      confidence: params.confidence ?? 'medium',
      holes: params.holes ?? []
    }
  };
}

// ============================================================================
// Intent Analysis
// ============================================================================

/**
 * Analyze an intent bundle for completeness and coherence
 */
export interface IntentAnalysis {
  /** Is the bundle complete (no holes)? */
  readonly complete: boolean;
  
  /** Are goals and constraints compatible? */
  readonly coherent: boolean;
  
  /** Potential conflicts */
  readonly conflicts: readonly IntentConflict[];
  
  /** Required clarifications */
  readonly clarifications: readonly IntentHole[];
  
  /** Complexity score (higher = more complex) */
  readonly complexity: number;
}

/**
 * A conflict between intents
 */
export interface IntentConflict {
  /** Conflicting intents */
  readonly intents: readonly [Intent, Intent];
  
  /** Type of conflict */
  readonly type: 'contradiction' | 'impossible' | 'ambiguous';
  
  /** Description */
  readonly description: string;
  
  /** Suggested resolution */
  readonly resolution?: string;
}

/**
 * Analyze an intent bundle
 */
export function analyzeIntentBundle(bundle: IntentBundle): IntentAnalysis {
  const conflicts: IntentConflict[] = [];
  
  // Check for contradictions (e.g., "make it brighter" + "make it darker")
  // Check for impossible combinations (e.g., "preserve melody exact" + "change melody")
  // Calculate complexity based on number and type of intents
  
  return {
    complete: bundle.metadata.holes.length === 0,
    coherent: conflicts.length === 0,
    conflicts,
    clarifications: bundle.metadata.holes,
    complexity: bundle.goals.length + bundle.constraints.length * 2 + bundle.preferences.length * 0.5
  };
}

// ============================================================================
// Utilities
// ============================================================================

let intentIdCounter = 0;

function generateIntentId(category: IntentCategory): string {
  return `intent:${category}:${++intentIdCounter}`;
}
