/**
 * GOFAI Pipeline Types — Typed Interfaces for Each Compilation Stage
 *
 * This module defines the contracts between compilation stages, following
 * Step 003 from gofai_goalB.md: "Decide and document the compilation
 * pipeline stages (normalize → parse → semantics → pragmatics → typecheck
 * → plan → execute → diff/explain)."
 *
 * Each stage has:
 * - A typed input
 * - A typed output
 * - A typed error
 * - A stage metadata type
 * - Performance budget
 *
 * @module gofai/pipeline/types
 */

import type { AxisId, ConstraintTypeId, OpcodeId } from '../canon/types';
import type { EffectType } from '../canon/effect-taxonomy';

// =============================================================================
// Pipeline Stage Identifiers
// =============================================================================

/**
 * The eight compilation stages in order.
 */
export type PipelineStageId =
  | 'normalize'
  | 'tokenize'
  | 'parse'
  | 'semantics'
  | 'pragmatics'
  | 'typecheck'
  | 'plan'
  | 'execute';

/**
 * Ordered list of stages for iteration.
 */
export const PIPELINE_STAGES: readonly PipelineStageId[] = [
  'normalize',
  'tokenize',
  'parse',
  'semantics',
  'pragmatics',
  'typecheck',
  'plan',
  'execute',
] as const;

/**
 * Performance budgets for each stage (milliseconds).
 */
export const STAGE_BUDGETS: Readonly<Record<PipelineStageId, number>> = {
  normalize: 1,
  tokenize: 5,
  parse: 50,
  semantics: 10,
  pragmatics: 20,
  typecheck: 10,
  plan: 100,
  execute: 50,
} as const;

/**
 * Total pipeline budget (milliseconds).
 */
export const TOTAL_PIPELINE_BUDGET = 250;

// =============================================================================
// Generic Stage Result
// =============================================================================

/**
 * Result of any pipeline stage.
 *
 * Every stage produces either a success with output + metadata,
 * or a failure with diagnostics. Failures may include partial output
 * for error recovery.
 */
export type StageResult<TOutput, TDiagnostic = StageDiagnostic> =
  | StageSuccess<TOutput>
  | StageFailure<TOutput, TDiagnostic>;

/**
 * Successful stage result.
 */
export interface StageSuccess<TOutput> {
  readonly ok: true;

  /** The stage's output */
  readonly output: TOutput;

  /** Stage metadata (timing, decisions, provenance) */
  readonly metadata: StageMetadata;
}

/**
 * Failed stage result.
 */
export interface StageFailure<TOutput, TDiagnostic = StageDiagnostic> {
  readonly ok: false;

  /** Diagnostics explaining the failure */
  readonly diagnostics: readonly TDiagnostic[];

  /** Partial output for error recovery (if available) */
  readonly partial: TOutput | undefined;

  /** Stage metadata */
  readonly metadata: StageMetadata;
}

/**
 * Metadata produced by every stage.
 */
export interface StageMetadata {
  /** Which stage produced this */
  readonly stage: PipelineStageId;

  /** Duration in milliseconds */
  readonly durationMs: number;

  /** Whether the stage exceeded its budget */
  readonly overBudget: boolean;

  /** Key decisions made (for provenance/explain) */
  readonly decisions: readonly StageDecision[];

  /** Determinism fingerprint (for replay verification) */
  readonly fingerprint: string;
}

/**
 * A decision made during a stage (for provenance).
 */
export interface StageDecision {
  /** What was decided */
  readonly description: string;

  /** Rule or heuristic that made the decision */
  readonly rule: string;

  /** Alternatives considered */
  readonly alternatives: readonly string[];

  /** Why this alternative was chosen */
  readonly reason: string;
}

/**
 * A diagnostic from any stage.
 */
export interface StageDiagnostic {
  /** Severity */
  readonly severity: 'error' | 'warning' | 'info';

  /** Machine-readable code */
  readonly code: string;

  /** Human-readable message */
  readonly message: string;

  /** Source span in original input */
  readonly span: TextSpan | undefined;

  /** Related diagnostics */
  readonly related: readonly StageDiagnostic[];

  /** Suggested fixes */
  readonly suggestions: readonly string[];
}

// =============================================================================
// Text Span (shared across stages)
// =============================================================================

/**
 * A span of text in the original input.
 */
export interface TextSpan {
  /** Start offset (0-indexed, inclusive) */
  readonly start: number;

  /** End offset (0-indexed, exclusive) */
  readonly end: number;

  /** The text content */
  readonly text: string;
}

// =============================================================================
// Stage 1: Normalization
// =============================================================================

/**
 * Input to the normalization stage.
 */
export interface NormalizationInput {
  /** Raw user text */
  readonly rawText: string;
}

/**
 * Output of the normalization stage.
 */
export interface NormalizationOutput {
  /** Normalized text */
  readonly normalizedText: string;

  /** Synonym replacements made */
  readonly replacements: readonly NormalizationReplacement[];

  /** Original text preserved for provenance */
  readonly originalText: string;
}

/**
 * A single normalization replacement.
 */
export interface NormalizationReplacement {
  /** Span in original text */
  readonly originalSpan: TextSpan;

  /** Original text */
  readonly original: string;

  /** Normalized form */
  readonly normalized: string;

  /** Rule that triggered the replacement */
  readonly rule: string;
}

// =============================================================================
// Stage 2: Tokenization
// =============================================================================

/**
 * Output of the tokenization stage.
 */
export interface TokenizationOutput {
  /** Ordered token list */
  readonly tokens: readonly Token[];

  /** Original text for span references */
  readonly sourceText: string;
}

/**
 * A token with span information.
 */
export interface Token {
  /** Token text (normalized form) */
  readonly text: string;

  /** Original text (before normalization) */
  readonly originalText: string;

  /** Token category */
  readonly category: TokenCategory;

  /** Position in source */
  readonly span: TextSpan;

  /** Token index in sequence */
  readonly index: number;

  /** Whether this token was produced by normalization */
  readonly synthetic: boolean;
}

/**
 * Token categories.
 */
export type TokenCategory =
  | 'word'           // Regular word
  | 'number'         // Numeric literal
  | 'unit'           // Measurement unit (bpm, bars, dB)
  | 'punctuation'    // Punctuation marks
  | 'quoted_string'  // "my cool pad"
  | 'reference'      // @bar33, #chorus
  | 'whitespace';    // Preserved for span accuracy

// =============================================================================
// Stage 3: Parsing
// =============================================================================

/**
 * Output of the parsing stage.
 */
export interface ParseOutput {
  /** Parse forest (may contain multiple trees if ambiguous) */
  readonly forest: ParseForest;

  /** Best parse tree (highest scoring) */
  readonly bestTree: ParseTree;

  /** Ambiguity information */
  readonly ambiguity: ParseAmbiguity;
}

/**
 * A parse forest containing all valid parse trees.
 */
export interface ParseForest {
  /** All parse trees, ordered by score (best first) */
  readonly trees: readonly ScoredParseTree[];

  /** Total number of trees (may be capped) */
  readonly totalCount: number;

  /** Whether the forest was truncated */
  readonly truncated: boolean;
}

/**
 * A parse tree with a score.
 */
export interface ScoredParseTree {
  /** The parse tree */
  readonly tree: ParseTree;

  /** Score (higher = better) */
  readonly score: number;

  /** Scoring breakdown */
  readonly scoreBreakdown: readonly ScoreComponent[];
}

/**
 * A component of a parse score.
 */
export interface ScoreComponent {
  /** What contributed to the score */
  readonly source: string;

  /** Score value */
  readonly value: number;

  /** Description */
  readonly description: string;
}

/**
 * A parse tree node.
 */
export interface ParseTree {
  /** Node type */
  readonly type: ParseNodeType;

  /** Grammar rule that produced this node */
  readonly rule: string;

  /** Children (ordered) */
  readonly children: readonly ParseTree[];

  /** Span in source */
  readonly span: TextSpan;

  /** Leaf token (if terminal) */
  readonly token: Token | undefined;

  /** Feature annotations */
  readonly features: Readonly<Record<string, unknown>>;
}

/**
 * Parse node types.
 */
export type ParseNodeType =
  | 'sentence'
  | 'imperative'
  | 'query'
  | 'noun_phrase'
  | 'verb_phrase'
  | 'adjective_phrase'
  | 'prepositional_phrase'
  | 'scope_phrase'
  | 'constraint_phrase'
  | 'coordination'
  | 'comparison'
  | 'amount_expression'
  | 'time_expression'
  | 'reference_expression'
  | 'terminal';

/**
 * Ambiguity information from the parser.
 */
export interface ParseAmbiguity {
  /** Whether the parse is ambiguous */
  readonly isAmbiguous: boolean;

  /** Number of competing interpretations */
  readonly interpretationCount: number;

  /** Specific ambiguity sites */
  readonly sites: readonly AmbiguitySite[];

  /** Whether the top parse is confidently best */
  readonly topParseConfident: boolean;

  /** Score gap between top and second parse */
  readonly scoreGap: number;
}

/**
 * A specific site of ambiguity in the parse.
 */
export interface AmbiguitySite {
  /** Span where ambiguity occurs */
  readonly span: TextSpan;

  /** Type of ambiguity */
  readonly type: 'attachment' | 'scope' | 'reference' | 'category' | 'coordination';

  /** Competing interpretations at this site */
  readonly interpretations: readonly string[];
}

// =============================================================================
// Stage 4: Semantic Composition
// =============================================================================

/**
 * Output of the semantic composition stage.
 */
export interface SemanticsOutput {
  /** CPL-Intent with possible holes */
  readonly intent: CPLIntent;

  /** Holes (unresolved parts) */
  readonly holes: readonly CPLHole[];

  /** Provenance links (parse rule → semantic decision) */
  readonly provenanceLinks: readonly ProvenanceLink[];
}

/**
 * CPL-Intent: the typed logical form of user intent.
 */
export interface CPLIntent {
  /** Request type */
  readonly type: 'change' | 'inspect' | 'undo' | 'redo' | 'explain';

  /** Scope (where the change applies) */
  readonly scope: CPLScope | undefined;

  /** Goals (what the user wants) */
  readonly goals: readonly CPLGoal[];

  /** Constraints (what must not change) */
  readonly constraints: readonly CPLConstraint[];

  /** Preferences (soft constraints) */
  readonly preferences: readonly CPLPreference[];

  /** Source provenance */
  readonly sourceSpan: TextSpan;
}

/**
 * A scope specification in CPL.
 */
export type CPLScope =
  | { readonly type: 'section'; readonly sectionRef: string; readonly index: number | undefined }
  | { readonly type: 'layer'; readonly layerRef: string; readonly within: CPLScope | undefined }
  | { readonly type: 'range'; readonly startBar: number; readonly endBar: number }
  | { readonly type: 'selection'; readonly description: string }
  | { readonly type: 'global' }
  | { readonly type: 'card'; readonly cardRef: string; readonly within: CPLScope | undefined }
  | { readonly type: 'hole'; readonly holeId: string; readonly candidates: readonly CPLScope[] };

/**
 * A goal in CPL.
 */
export type CPLGoal =
  | { readonly type: 'axis_change'; readonly axis: AxisId; readonly direction: 'increase' | 'decrease'; readonly amount: CPLAmount }
  | { readonly type: 'action'; readonly opcode: OpcodeId; readonly params: Readonly<Record<string, unknown>> }
  | { readonly type: 'set_value'; readonly axis: AxisId; readonly target: CPLAmount }
  | { readonly type: 'introduce'; readonly entity: string; readonly entityType: string }
  | { readonly type: 'remove'; readonly entity: string; readonly entityType: string }
  | { readonly type: 'query'; readonly queryType: string; readonly target: string | undefined }
  | { readonly type: 'hole'; readonly holeId: string; readonly candidates: readonly CPLGoal[] };

/**
 * An amount specification in CPL.
 */
export type CPLAmount =
  | { readonly type: 'degree'; readonly degree: 'tiny' | 'small' | 'moderate' | 'large' | 'extreme' }
  | { readonly type: 'numeric'; readonly value: number; readonly unit: string | undefined }
  | { readonly type: 'relative'; readonly reference: string }
  | { readonly type: 'default' }
  | { readonly type: 'hole'; readonly holeId: string };

/**
 * A constraint in CPL.
 */
export type CPLConstraint =
  | { readonly type: 'preserve'; readonly target: string; readonly aspects: readonly string[]; readonly mode: 'exact' | 'recognizable' | 'functional' }
  | { readonly type: 'only_change'; readonly allowed: readonly string[] }
  | { readonly type: 'tempo'; readonly bpm: number; readonly tolerance: number | undefined }
  | { readonly type: 'meter'; readonly numerator: number; readonly denominator: number }
  | { readonly type: 'range_limit'; readonly param: string; readonly min: number | undefined; readonly max: number | undefined }
  | { readonly type: 'namespaced'; readonly namespace: string; readonly constraintId: ConstraintTypeId; readonly params: Readonly<Record<string, unknown>> }
  | { readonly type: 'hole'; readonly holeId: string; readonly candidates: readonly CPLConstraint[] };

/**
 * A preference in CPL.
 */
export interface CPLPreference {
  /** What kind of preference */
  readonly kind: 'lever' | 'cost' | 'scope' | 'style';

  /** Description */
  readonly description: string;

  /** Strength */
  readonly strength: 'weak' | 'moderate' | 'strong';

  /** Encoded value */
  readonly value: unknown;
}

/**
 * A hole (unresolved part) in CPL.
 */
export interface CPLHole {
  /** Unique hole ID */
  readonly id: string;

  /** What kind of thing is unresolved */
  readonly kind: 'scope' | 'goal' | 'constraint' | 'amount' | 'reference' | 'axis';

  /** Candidate resolutions */
  readonly candidates: readonly CPLHoleCandidate[];

  /** Source span */
  readonly sourceSpan: TextSpan;

  /** Whether a clarification question should be generated */
  readonly requiresClarification: boolean;

  /** Suggested default (if safe) */
  readonly suggestedDefault: number | undefined;
}

/**
 * A candidate resolution for a hole.
 */
export interface CPLHoleCandidate {
  /** Candidate index */
  readonly index: number;

  /** Human-readable label */
  readonly label: string;

  /** Description of what choosing this means */
  readonly description: string;

  /** Confidence score (0-1) */
  readonly confidence: number;

  /** The resolved value */
  readonly value: unknown;
}

/**
 * Provenance link from parse to semantics.
 */
export interface ProvenanceLink {
  /** Parse rule that contributed */
  readonly parseRule: string;

  /** Semantic decision made */
  readonly semanticDecision: string;

  /** Source span */
  readonly span: TextSpan;

  /** The CPL node produced */
  readonly cplNodeType: string;
}

// =============================================================================
// Stage 5: Pragmatic Resolution
// =============================================================================

/**
 * Output of the pragmatic resolution stage.
 */
export interface PragmaticsOutput {
  /** Fully resolved CPL-Intent (no holes, or holes requiring clarification) */
  readonly resolvedIntent: CPLIntent;

  /** Remaining holes that require user clarification */
  readonly unresolvedHoles: readonly CPLHole[];

  /** Clarification questions (if any) */
  readonly clarificationQuestions: readonly ClarificationQuestion[];

  /** Resolution trace */
  readonly resolutions: readonly PragmaticResolution[];
}

/**
 * A pragmatic resolution decision.
 */
export interface PragmaticResolution {
  /** What was resolved */
  readonly target: string;

  /** How it was resolved */
  readonly resolution: string;

  /** Source of resolution */
  readonly source: 'salience' | 'dialogue_state' | 'ui_focus' | 'default_rule' | 'world_state';

  /** Confidence */
  readonly confidence: number;

  /** The hole that was filled (if applicable) */
  readonly holeId: string | undefined;
}

/**
 * A clarification question for the user.
 */
export interface ClarificationQuestion {
  /** Unique question ID */
  readonly id: string;

  /** The question text */
  readonly text: string;

  /** Available options */
  readonly options: readonly ClarificationOption[];

  /** Which hole this resolves */
  readonly holeId: string;

  /** Impact description */
  readonly impact: string;

  /** Default option index (if safe) */
  readonly defaultIndex: number | undefined;
}

/**
 * An option for a clarification question.
 */
export interface ClarificationOption {
  /** Option index */
  readonly index: number;

  /** Display label */
  readonly label: string;

  /** What choosing this means */
  readonly description: string;

  /** Preview of the effect */
  readonly effectPreview: string | undefined;
}

// =============================================================================
// Stage 6: Typecheck / Validation
// =============================================================================

/**
 * Output of the typecheck stage.
 */
export interface TypecheckOutput {
  /** Validated CPL-Intent */
  readonly validatedIntent: CPLIntent;

  /** Constraint satisfaction status */
  readonly constraintStatus: ConstraintSatisfactionStatus;

  /** Type errors (if any, should block planning) */
  readonly typeErrors: readonly TypecheckError[];

  /** Warnings (non-blocking) */
  readonly warnings: readonly TypecheckWarning[];
}

/**
 * Constraint satisfaction status.
 */
export interface ConstraintSatisfactionStatus {
  /** Whether all constraints are satisfiable */
  readonly satisfiable: boolean;

  /** Unsatisfiable constraints (if any) */
  readonly unsatisfiable: readonly UnsatisfiableConstraint[];

  /** Conflicting constraint pairs */
  readonly conflicts: readonly ConstraintConflictPair[];
}

/**
 * An unsatisfiable constraint.
 */
export interface UnsatisfiableConstraint {
  /** The constraint */
  readonly constraint: CPLConstraint;

  /** Why it's unsatisfiable */
  readonly reason: string;

  /** Suggested relaxation */
  readonly suggestion: string;
}

/**
 * A pair of conflicting constraints.
 */
export interface ConstraintConflictPair {
  /** First constraint */
  readonly constraint1: CPLConstraint;

  /** Second constraint */
  readonly constraint2: CPLConstraint;

  /** Why they conflict */
  readonly reason: string;

  /** Suggested resolution */
  readonly resolution: string;
}

/**
 * A typecheck error.
 */
export interface TypecheckError {
  /** Error code */
  readonly code: string;

  /** Message */
  readonly message: string;

  /** The offending CPL node */
  readonly node: string;

  /** Source span */
  readonly span: TextSpan | undefined;
}

/**
 * A typecheck warning.
 */
export interface TypecheckWarning {
  /** Warning code */
  readonly code: string;

  /** Message */
  readonly message: string;

  /** Source span */
  readonly span: TextSpan | undefined;
}

// =============================================================================
// Stage 7: Planning
// =============================================================================

/**
 * Output of the planning stage.
 */
export interface PlanOutput {
  /** The selected plan */
  readonly plan: CPLPlan;

  /** Alternative plans (if multiple are near-equal) */
  readonly alternatives: readonly ScoredPlan[];

  /** Whether the user should choose between alternatives */
  readonly requiresSelection: boolean;

  /** Plan validation result */
  readonly validation: PlanValidationResult;
}

/**
 * A CPL Plan: sequence of typed opcodes.
 */
export interface CPLPlan {
  /** Plan identifier */
  readonly id: string;

  /** Ordered steps */
  readonly steps: readonly CPLPlanStep[];

  /** Overall score */
  readonly score: PlanScore;

  /** Effect type of the whole plan */
  readonly effectType: EffectType;

  /** Scope of the plan */
  readonly scope: CPLScope;

  /** Goals this plan addresses */
  readonly addressesGoals: readonly string[];
}

/**
 * A single step in a plan.
 */
export interface CPLPlanStep {
  /** Step identifier */
  readonly id: string;

  /** Opcode to execute */
  readonly opcode: OpcodeId;

  /** Parameters */
  readonly params: Readonly<Record<string, unknown>>;

  /** Scope for this step */
  readonly scope: CPLScope;

  /** Preconditions */
  readonly preconditions: readonly string[];

  /** Postconditions */
  readonly postconditions: readonly string[];

  /** Which goal(s) this step serves */
  readonly servesGoals: readonly string[];

  /** Human-readable reason */
  readonly reason: string;

  /** Estimated cost */
  readonly cost: StepCost;

  /** Effect type */
  readonly effectType: EffectType;

  /** Namespace (if extension opcode) */
  readonly namespace: string | undefined;
}

/**
 * Plan score breakdown.
 */
export interface PlanScore {
  /** Overall score (higher = better) */
  readonly overall: number;

  /** Goal satisfaction score */
  readonly goalSatisfaction: number;

  /** Edit cost score (lower = better) */
  readonly editCost: number;

  /** Constraint risk score (lower = better) */
  readonly constraintRisk: number;

  /** Components */
  readonly components: readonly ScoreComponent[];
}

/**
 * A scored plan (for alternatives).
 */
export interface ScoredPlan {
  /** The plan */
  readonly plan: CPLPlan;

  /** How it differs from the selected plan */
  readonly differenceFromSelected: string;
}

/**
 * Step cost estimate.
 */
export interface StepCost {
  /** Cost level */
  readonly level: 'low' | 'medium' | 'high';

  /** Numeric cost (for scoring) */
  readonly value: number;

  /** What makes it costly */
  readonly reason: string;
}

/**
 * Plan validation result.
 */
export interface PlanValidationResult {
  /** Whether the plan is valid */
  readonly valid: boolean;

  /** Constraint violations found during validation */
  readonly violations: readonly string[];

  /** Warnings */
  readonly warnings: readonly string[];
}

// =============================================================================
// Stage 8: Execution
// =============================================================================

/**
 * Output of the execution stage.
 */
export interface ExecutionOutput {
  /** The edit package produced */
  readonly editPackage: EditPackage;

  /** Constraint verification results */
  readonly constraintResults: readonly ConstraintVerificationResult[];

  /** Whether all constraints passed */
  readonly allConstraintsPassed: boolean;
}

/**
 * An edit package: the atomic applied unit.
 */
export interface EditPackage {
  /** Unique identifier */
  readonly id: string;

  /** Timestamp of application */
  readonly timestamp: number;

  /** The CPL-Intent that produced this */
  readonly intent: CPLIntent;

  /** The plan that was executed */
  readonly plan: CPLPlan;

  /** Diff summary */
  readonly diff: DiffSummary;

  /** Undo token */
  readonly undoToken: UndoToken;

  /** Provenance (compiler version, traces) */
  readonly provenance: EditProvenance;

  /** Human-readable summary */
  readonly summary: string;
}

/**
 * Diff summary (what changed).
 */
export interface DiffSummary {
  /** Event-level changes */
  readonly eventChanges: readonly EventChange[];

  /** Parameter changes */
  readonly paramChanges: readonly ParamChange[];

  /** Structural changes */
  readonly structuralChanges: readonly StructuralChange[];

  /** Human-readable summary lines */
  readonly summaryLines: readonly string[];

  /** Total number of entities affected */
  readonly totalAffected: number;
}

/**
 * An event-level change.
 */
export interface EventChange {
  /** Change type */
  readonly type: 'add' | 'remove' | 'modify';

  /** Layer/track affected */
  readonly layer: string;

  /** Bar range affected */
  readonly barRange: readonly [number, number];

  /** Description */
  readonly description: string;

  /** Number of events affected */
  readonly eventCount: number;
}

/**
 * A parameter change.
 */
export interface ParamChange {
  /** Card or entity affected */
  readonly target: string;

  /** Parameter name */
  readonly param: string;

  /** Previous value */
  readonly before: unknown;

  /** New value */
  readonly after: unknown;

  /** Description */
  readonly description: string;
}

/**
 * A structural change.
 */
export interface StructuralChange {
  /** Change type */
  readonly type: 'add_section' | 'remove_section' | 'resize_section' | 'add_layer' | 'remove_layer';

  /** Description */
  readonly description: string;

  /** Affected entities */
  readonly affectedEntities: readonly string[];
}

/**
 * Undo token for reversing an edit.
 */
export interface UndoToken {
  /** Token identifier (matches edit package ID) */
  readonly id: string;

  /** Whether this token is still valid (not consumed) */
  readonly valid: boolean;

  /** Inverse operations */
  readonly inverseSteps: readonly CPLPlanStep[];

  /** State snapshot hash (for verification) */
  readonly stateHash: string;
}

/**
 * Constraint verification result.
 */
export interface ConstraintVerificationResult {
  /** Which constraint was checked */
  readonly constraint: CPLConstraint;

  /** Whether it passed */
  readonly passed: boolean;

  /** Violation details (if failed) */
  readonly violation: string | undefined;

  /** Evidence */
  readonly evidence: unknown;
}

/**
 * Edit provenance.
 */
export interface EditProvenance {
  /** Compiler version */
  readonly compilerVersion: string;

  /** Parse trace */
  readonly parseTrace: readonly string[];

  /** Semantic trace */
  readonly semanticTrace: readonly string[];

  /** Planning trace */
  readonly planningTrace: readonly string[];

  /** Extension namespaces involved */
  readonly extensionNamespaces: readonly string[];

  /** Total compilation time */
  readonly totalDurationMs: number;

  /** Per-stage timing */
  readonly stageTiming: Readonly<Record<PipelineStageId, number>>;
}

// =============================================================================
// Pipeline Runner Types
// =============================================================================

/**
 * A pipeline stage function.
 */
export type PipelineStage<TInput, TOutput> = (
  input: TInput
) => StageResult<TOutput>;

/**
 * Complete pipeline result.
 */
export type PipelineResult =
  | PipelineSuccess
  | PipelineClarification
  | PipelineError;

/**
 * Successful pipeline result.
 */
export interface PipelineSuccess {
  readonly type: 'success';

  /** The edit package (if execution was requested) */
  readonly editPackage: EditPackage | undefined;

  /** The plan (always available on success) */
  readonly plan: CPLPlan;

  /** The validated intent */
  readonly intent: CPLIntent;

  /** Full provenance */
  readonly provenance: EditProvenance;

  /** Diff preview */
  readonly diffPreview: DiffSummary | undefined;
}

/**
 * Pipeline stopped for clarification.
 */
export interface PipelineClarification {
  readonly type: 'clarification';

  /** Partial intent */
  readonly partialIntent: CPLIntent;

  /** Questions for the user */
  readonly questions: readonly ClarificationQuestion[];

  /** Which stage stopped */
  readonly stoppedAt: PipelineStageId;
}

/**
 * Pipeline error.
 */
export interface PipelineError {
  readonly type: 'error';

  /** Diagnostics */
  readonly diagnostics: readonly StageDiagnostic[];

  /** Which stage failed */
  readonly failedAt: PipelineStageId;

  /** Partial results from earlier stages */
  readonly partialResults: Readonly<Partial<Record<PipelineStageId, unknown>>>;
}

// =============================================================================
// Pipeline Configuration
// =============================================================================

/**
 * Pipeline configuration options.
 */
export interface PipelineConfig {
  /** Whether to stop after parsing (for debugging) */
  readonly stopAfter: PipelineStageId | undefined;

  /** Whether to execute or just plan */
  readonly mode: 'parse-only' | 'plan-only' | 'preview' | 'execute';

  /** Effect policy to enforce */
  readonly effectPolicy: string;

  /** Whether to enable debug tracing */
  readonly debug: boolean;

  /** Maximum parse trees to consider */
  readonly maxParseTrees: number;

  /** Maximum plan alternatives to generate */
  readonly maxPlanAlternatives: number;

  /** Whether to enforce performance budgets */
  readonly enforceBudgets: boolean;
}

/**
 * Default pipeline configuration.
 */
export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  stopAfter: undefined,
  mode: 'preview',
  effectPolicy: 'strict-studio',
  debug: false,
  maxParseTrees: 10,
  maxPlanAlternatives: 3,
  enforceBudgets: true,
};
