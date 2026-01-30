/**
 * GOFAI Error Shapes — Structured Error Types for UI Display
 *
 * Step 018 [HCI]: Defines the "error shapes" that the UI renders.
 * Each error shape is:
 *
 * - **Typed**: A discriminated union so the UI can render different layouts
 * - **Localized**: Points to the source span in the original utterance
 * - **Actionable**: Includes suggestions and recovery paths
 * - **Composable**: Multiple errors can be displayed together
 *
 * ## Error Categories
 *
 * 1. **Parse Error**: Could not understand the utterance
 * 2. **Unresolved Reference**: A reference (pronoun, name) has no binding
 * 3. **Unsatisfied Constraint**: Constraints conflict or are impossible
 * 4. **Unsafe Plan**: Plan would produce risky or irreversible changes
 * 5. **Missing Capability**: Board/deck lacks required tools
 * 6. **Type Error**: Semantic type mismatch (e.g., applying brightness to a section)
 * 7. **Presupposition Failure**: A presupposition lacks support
 *
 * ## UI Rendering Contract
 *
 * Each error shape includes enough information to render:
 * - A highlighted span in the input text
 * - An error card with icon, message, and details
 * - Suggested fixes as clickable chips
 * - A "learn more" link to vocabulary/help
 *
 * @module gofai/pipeline/error-shapes
 */

import type { TextSpan, PipelineStageId } from './types';

// =============================================================================
// Error Shape Union
// =============================================================================

/**
 * All possible error shapes.
 *
 * The UI matches on `shape` to choose rendering.
 */
export type ErrorShape =
  | ParseErrorShape
  | UnresolvedReferenceShape
  | UnsatisfiedConstraintShape
  | UnsafePlanShape
  | MissingCapabilityShape
  | TypeErrorShape
  | PresuppositionFailureShape
  | UnknownTermShape
  | ScopeErrorShape
  | ConstraintConflictShape
  | TimeoutErrorShape
  | InternalErrorShape;

/**
 * Discriminant for error shapes.
 */
export type ErrorShapeType = ErrorShape['shape'];

/**
 * All error shape type literals.
 */
export const ERROR_SHAPE_TYPES = [
  'parse_error',
  'unresolved_reference',
  'unsatisfied_constraint',
  'unsafe_plan',
  'missing_capability',
  'type_error',
  'presupposition_failure',
  'unknown_term',
  'scope_error',
  'constraint_conflict',
  'timeout',
  'internal_error',
] as const;

// =============================================================================
// Common Error Fields
// =============================================================================

/**
 * Fields shared by all error shapes.
 */
export interface ErrorShapeBase {
  /** Unique error ID */
  readonly id: string;

  /** Severity */
  readonly severity: ErrorSeverity;

  /** Which pipeline stage produced this error */
  readonly stage: PipelineStageId;

  /** Source span in the original utterance (if applicable) */
  readonly sourceSpan: TextSpan | undefined;

  /** Machine-readable error code */
  readonly code: string;

  /** Human-readable one-line message */
  readonly message: string;

  /** Longer explanation */
  readonly details: string;

  /** Suggested recovery actions */
  readonly suggestions: readonly ErrorRecoverySuggestion[];

  /** UI rendering hints */
  readonly uiHints: ErrorUIHints;

  /** Related errors (e.g., a constraint conflict references two constraint errors) */
  readonly relatedErrorIds: readonly string[];

  /** Whether this error is recoverable without rephrasing */
  readonly recoverable: boolean;
}

/**
 * Error severity levels.
 */
export type ErrorSeverity =
  | 'error'    // Blocks execution
  | 'warning'  // Doesn't block but user should be aware
  | 'info';    // Informational

// =============================================================================
// Error Shape 1: Parse Error
// =============================================================================

/**
 * Parse Error: The system could not parse the utterance.
 *
 * UI rendering:
 * - Highlight the problematic span in red
 * - Show an error card with the message
 * - Suggest known terms that are close to the unrecognized word
 * - Offer a "try rephrasing" action
 */
export interface ParseErrorShape extends ErrorShapeBase {
  readonly shape: 'parse_error';

  /** What kind of parse error */
  readonly parseErrorKind: ParseErrorKind;

  /** The problematic token(s) */
  readonly problematicTokens: readonly ProblematicToken[];

  /** What the parser expected at this point */
  readonly expected: readonly string[];

  /** Partial parse tree (for error recovery display) */
  readonly partialParseDescription: string | undefined;

  /** Close matches in the vocabulary */
  readonly closeMatches: readonly VocabularyMatch[];
}

/**
 * Kinds of parse errors.
 */
export type ParseErrorKind =
  | 'no_parse'              // No valid parse at all
  | 'unexpected_token'      // Token doesn't fit any rule
  | 'incomplete_utterance'  // Utterance appears unfinished
  | 'ambiguity_overflow'    // Too many parses (ambiguity explosion)
  | 'malformed_number'      // A number expression is malformed
  | 'malformed_unit'        // A unit expression is malformed
  | 'mismatched_quotes';    // Quoted string is not closed

/**
 * A problematic token in a parse error.
 */
export interface ProblematicToken {
  /** The token text */
  readonly text: string;

  /** Its span */
  readonly span: TextSpan;

  /** Why it's problematic */
  readonly reason: string;
}

/**
 * A vocabulary match suggestion.
 */
export interface VocabularyMatch {
  /** The suggested term */
  readonly term: string;

  /** The category it belongs to */
  readonly category: string;

  /** How close the match is (0-1, higher = closer) */
  readonly similarity: number;

  /** Description of the term */
  readonly description: string;
}

// =============================================================================
// Error Shape 2: Unresolved Reference
// =============================================================================

/**
 * Unresolved Reference: A reference (pronoun, demonstrative, definite
 * description) could not be bound to any entity.
 *
 * UI rendering:
 * - Highlight the reference span
 * - Show what the system tried to match
 * - Suggest entities that might be what the user meant
 * - Offer to switch to a more explicit reference
 */
export interface UnresolvedReferenceShape extends ErrorShapeBase {
  readonly shape: 'unresolved_reference';

  /** What kind of reference failed */
  readonly referenceKind: ReferenceKind;

  /** The referring expression */
  readonly referringExpression: string;

  /** What was tried */
  readonly resolutionAttempts: readonly ResolutionAttempt[];

  /** Candidate entities that are close but not matching */
  readonly nearMatches: readonly NearMatch[];

  /** Whether a UI selection would resolve this */
  readonly wouldResolveWithSelection: boolean;
}

/**
 * Kinds of reference failures.
 */
export type ReferenceKind =
  | 'pronoun'              // "it", "that"
  | 'demonstrative'        // "this section", "these notes"
  | 'definite_description' // "the chorus", "the pad"
  | 'proper_name'          // "Glass Pad"
  | 'anaphoric'            // "again", "the same"
  | 'cataphoric';          // "the following"

/**
 * A resolution attempt (for explanation).
 */
export interface ResolutionAttempt {
  /** What was tried */
  readonly method: string;

  /** What was found */
  readonly result: string;

  /** Why it didn't work */
  readonly failureReason: string;
}

/**
 * A near-match entity.
 */
export interface NearMatch {
  /** Entity name */
  readonly name: string;

  /** Entity type */
  readonly type: string;

  /** Why it didn't match */
  readonly mismatchReason: string;

  /** Whether the user could mean this */
  readonly plausible: boolean;
}

// =============================================================================
// Error Shape 3: Unsatisfied Constraint
// =============================================================================

/**
 * Unsatisfied Constraint: A constraint cannot be satisfied given the
 * current project state and requested changes.
 *
 * UI rendering:
 * - Show the constraint that failed
 * - Show why it can't be satisfied (with a counterexample)
 * - Suggest relaxations (e.g., "exact" → "recognizable")
 * - Show which goal conflicts with the constraint
 */
export interface UnsatisfiedConstraintShape extends ErrorShapeBase {
  readonly shape: 'unsatisfied_constraint';

  /** Which constraint failed */
  readonly constraintDescription: string;

  /** Why it can't be satisfied */
  readonly unsatisfiableReason: string;

  /** The conflicting goal (if applicable) */
  readonly conflictingGoal: string | undefined;

  /** Counterexample (what would violate the constraint) */
  readonly counterexample: string | undefined;

  /** Suggested relaxations */
  readonly relaxations: readonly ConstraintRelaxation[];

  /** Whether removing this constraint would allow the plan */
  readonly removable: boolean;
}

/**
 * A suggested constraint relaxation.
 */
export interface ConstraintRelaxation {
  /** Label */
  readonly label: string;

  /** Description of what changes */
  readonly description: string;

  /** The relaxed constraint */
  readonly relaxedForm: string;

  /** Impact of relaxation */
  readonly impact: string;
}

// =============================================================================
// Error Shape 4: Unsafe Plan
// =============================================================================

/**
 * Unsafe Plan: The plan would produce changes that exceed safety thresholds.
 *
 * UI rendering:
 * - Show a warning banner with the safety level
 * - List the specific risks
 * - Suggest safer alternatives
 * - Offer to narrow scope
 */
export interface UnsafePlanShape extends ErrorShapeBase {
  readonly shape: 'unsafe_plan';

  /** Safety level */
  readonly safetyLevel: 'caution' | 'risky' | 'blocked';

  /** Specific risks */
  readonly risks: readonly PlanRisk[];

  /** Safer alternatives */
  readonly saferAlternatives: readonly SaferAlternative[];

  /** Whether the user can override the safety check */
  readonly overridable: boolean;

  /** Total events that would be affected */
  readonly affectedEventCount: number;

  /** Total layers that would be touched */
  readonly affectedLayerCount: number;
}

/**
 * A specific risk in a plan.
 */
export interface PlanRisk {
  /** Risk category */
  readonly category: string;

  /** Description */
  readonly description: string;

  /** Severity */
  readonly severity: 'low' | 'medium' | 'high';

  /** What makes it risky */
  readonly explanation: string;
}

/**
 * A safer alternative to the risky plan.
 */
export interface SaferAlternative {
  /** Label */
  readonly label: string;

  /** Description */
  readonly description: string;

  /** What changes from the original plan */
  readonly difference: string;

  /** The safety level of this alternative */
  readonly safetyLevel: 'safe' | 'caution';
}

// =============================================================================
// Error Shape 5: Missing Capability
// =============================================================================

/**
 * Missing Capability: The board/deck lacks a required capability for
 * the requested operation.
 *
 * UI rendering:
 * - Show which capability is missing
 * - Show which board/deck would have it
 * - Suggest switching boards or enabling tools
 */
export interface MissingCapabilityShape extends ErrorShapeBase {
  readonly shape: 'missing_capability';

  /** Which capability is missing */
  readonly missingCapability: string;

  /** What requires this capability */
  readonly requiredBy: string;

  /** Current board/deck context */
  readonly currentContext: string;

  /** Boards/decks that have this capability */
  readonly availableIn: readonly CapabilitySource[];

  /** Whether a board switch would fix this */
  readonly switchBoardWouldFix: boolean;
}

/**
 * A source of the missing capability.
 */
export interface CapabilitySource {
  /** Board or deck name */
  readonly name: string;

  /** Board or deck ID */
  readonly id: string;

  /** Type */
  readonly type: 'board' | 'deck' | 'tool';
}

// =============================================================================
// Error Shape 6: Type Error
// =============================================================================

/**
 * Type Error: A semantic type mismatch occurred during composition
 * or typechecking.
 *
 * UI rendering:
 * - Show what was expected vs what was found
 * - Highlight the mismatched parts
 * - Suggest corrections
 */
export interface TypeErrorShape extends ErrorShapeBase {
  readonly shape: 'type_error';

  /** Expected type */
  readonly expectedType: string;

  /** Actual type */
  readonly actualType: string;

  /** What caused the mismatch */
  readonly mismatchContext: string;

  /** The expression that failed */
  readonly expression: string;
}

// =============================================================================
// Error Shape 7: Presupposition Failure
// =============================================================================

/**
 * Presupposition Failure: A presupposition trigger ("again", "still",
 * "back") lacks the required antecedent.
 *
 * UI rendering:
 * - Show the trigger word
 * - Explain what it presupposes
 * - Show that the presupposition isn't met
 * - Suggest rephrasing without the presupposition
 */
export interface PresuppositionFailureShape extends ErrorShapeBase {
  readonly shape: 'presupposition_failure';

  /** The trigger word */
  readonly trigger: string;

  /** What it presupposes */
  readonly presupposition: string;

  /** Why the presupposition fails */
  readonly failureReason: string;

  /** What would satisfy the presupposition */
  readonly wouldSatisfy: string;
}

// =============================================================================
// Error Shape 8: Unknown Term
// =============================================================================

/**
 * Unknown Term: A word or phrase is not in the vocabulary.
 *
 * UI rendering:
 * - Highlight the unknown term
 * - Show close matches from the vocabulary
 * - Offer to treat it as a name (quoted reference)
 */
export interface UnknownTermShape extends ErrorShapeBase {
  readonly shape: 'unknown_term';

  /** The unknown term */
  readonly term: string;

  /** Close vocabulary matches */
  readonly closeMatches: readonly VocabularyMatch[];

  /** Whether it could be a quoted name */
  readonly couldBeName: boolean;

  /** Suggested interpretation as a name */
  readonly nameInterpretation: string | undefined;
}

// =============================================================================
// Error Shape 9: Scope Error
// =============================================================================

/**
 * Scope Error: A scope reference is invalid (section doesn't exist,
 * bar range is out of bounds, etc.).
 *
 * UI rendering:
 * - Show the invalid scope reference
 * - Show what scopes are available
 * - Suggest valid alternatives
 */
export interface ScopeErrorShape extends ErrorShapeBase {
  readonly shape: 'scope_error';

  /** The invalid scope reference */
  readonly scopeReference: string;

  /** Why it's invalid */
  readonly invalidReason: string;

  /** Available valid scopes */
  readonly availableScopes: readonly AvailableScope[];
}

/**
 * An available valid scope.
 */
export interface AvailableScope {
  /** Name */
  readonly name: string;

  /** Description (e.g., "bars 1-32") */
  readonly description: string;

  /** Type */
  readonly type: 'section' | 'layer' | 'range' | 'global';
}

// =============================================================================
// Error Shape 10: Constraint Conflict
// =============================================================================

/**
 * Constraint Conflict: Two or more constraints are mutually unsatisfiable.
 *
 * UI rendering:
 * - Show both conflicting constraints
 * - Explain why they conflict
 * - Suggest removing or relaxing one
 */
export interface ConstraintConflictShape extends ErrorShapeBase {
  readonly shape: 'constraint_conflict';

  /** First constraint */
  readonly constraint1: string;

  /** Second constraint */
  readonly constraint2: string;

  /** Why they conflict */
  readonly conflictReason: string;

  /** Which one to relax */
  readonly relaxationSuggestion: string;
}

// =============================================================================
// Error Shape 11: Timeout
// =============================================================================

/**
 * Timeout: The pipeline exceeded its performance budget.
 *
 * UI rendering:
 * - Show which stage timed out
 * - Suggest simplifying the request
 * - Show partial results (if available)
 */
export interface TimeoutErrorShape extends ErrorShapeBase {
  readonly shape: 'timeout';

  /** Which stage timed out */
  readonly timedOutStage: PipelineStageId;

  /** Budget in ms */
  readonly budgetMs: number;

  /** Actual time in ms */
  readonly actualMs: number;

  /** Whether partial results are available */
  readonly hasPartialResults: boolean;

  /** Suggestion to simplify */
  readonly simplificationSuggestion: string;
}

// =============================================================================
// Error Shape 12: Internal Error
// =============================================================================

/**
 * Internal Error: An unexpected internal failure.
 *
 * UI rendering:
 * - Show a generic error message
 * - Provide a bug report template
 * - Suggest retrying
 */
export interface InternalErrorShape extends ErrorShapeBase {
  readonly shape: 'internal_error';

  /** Internal error class */
  readonly errorClass: string;

  /** Stack trace hash (for bug reports, not displayed) */
  readonly traceHash: string;

  /** Whether a retry might succeed */
  readonly retryable: boolean;
}

// =============================================================================
// Error Suggestions
// =============================================================================

/**
 * A suggested recovery action for an error.
 */
export interface ErrorRecoverySuggestion {
  /** Suggestion type */
  readonly type: ErrorRecoverySuggestionKind;

  /** Human-readable label */
  readonly label: string;

  /** Description */
  readonly description: string;

  /** Suggested text (if rephrasing) */
  readonly suggestedText: string | undefined;

  /** Whether this suggestion can be applied automatically */
  readonly autoApplicable: boolean;
}

/**
 * Types of error suggestions.
 */
export type ErrorRecoverySuggestionKind =
  | 'rephrase'         // Suggest different wording
  | 'simplify'         // Suggest simpler request
  | 'add_scope'        // Suggest adding an explicit scope
  | 'use_name'         // Suggest using a specific name
  | 'switch_board'     // Suggest switching boards
  | 'remove_constraint' // Suggest removing a constraint
  | 'relax_constraint' // Suggest relaxing a constraint
  | 'narrow_scope'     // Suggest narrower scope
  | 'select_first'     // Suggest making a UI selection first
  | 'retry'            // Suggest retrying
  | 'vocabulary_help'; // Link to vocabulary browser

// =============================================================================
// Error UI Hints
// =============================================================================

/**
 * UI rendering hints for an error.
 */
export interface ErrorUIHints {
  /** Icon to display */
  readonly icon: ErrorIcon;

  /** Accent color */
  readonly color: 'red' | 'orange' | 'yellow' | 'blue' | 'gray';

  /** Whether to highlight the source span in the input */
  readonly highlightSpan: boolean;

  /** Whether to show the details expanded by default */
  readonly expandDetails: boolean;

  /** Whether to show suggestions inline */
  readonly inlineSuggestions: boolean;

  /** Whether this error should be dismissible */
  readonly dismissible: boolean;

  /** Position hint */
  readonly position: 'inline' | 'banner' | 'modal' | 'toast';
}

/**
 * Error icons.
 */
export type ErrorIcon =
  | 'parse'       // Syntax/grammar icon
  | 'reference'   // Target/binding icon
  | 'constraint'  // Shield/lock icon
  | 'safety'      // Warning triangle
  | 'capability'  // Tool/wrench icon
  | 'type'        // Type annotation icon
  | 'time'        // Clock icon
  | 'bug'         // Bug icon
  | 'info';       // Info circle

// =============================================================================
// Error Collection and Rendering
// =============================================================================

/**
 * A collection of errors from a pipeline run, ready for UI rendering.
 */
export interface ErrorCollection {
  /** All errors */
  readonly errors: readonly ErrorShape[];

  /** Grouped by stage */
  readonly byStage: Readonly<Partial<Record<PipelineStageId, readonly ErrorShape[]>>>;

  /** Grouped by severity */
  readonly bySeverity: {
    readonly errors: readonly ErrorShape[];
    readonly warnings: readonly ErrorShape[];
    readonly info: readonly ErrorShape[];
  };

  /** Whether any errors block execution */
  readonly hasBlockingErrors: boolean;

  /** Total error count */
  readonly totalCount: number;

  /** Summary message */
  readonly summary: string;
}

/**
 * Build an error collection from a list of error shapes.
 */
export function buildErrorCollection(
  errors: readonly ErrorShape[]
): ErrorCollection {
  const byStage: Partial<Record<PipelineStageId, ErrorShape[]>> = {};
  const errorsByLevel: ErrorShape[] = [];
  const warningsByLevel: ErrorShape[] = [];
  const infoByLevel: ErrorShape[] = [];

  for (const error of errors) {
    // Group by stage
    const stageList = byStage[error.stage];
    if (stageList) {
      stageList.push(error);
    } else {
      byStage[error.stage] = [error];
    }

    // Group by severity
    switch (error.severity) {
      case 'error':
        errorsByLevel.push(error);
        break;
      case 'warning':
        warningsByLevel.push(error);
        break;
      case 'info':
        infoByLevel.push(error);
        break;
    }
  }

  const hasBlocking = errorsByLevel.length > 0;

  let summary: string;
  if (errorsByLevel.length === 0 && warningsByLevel.length === 0) {
    summary = 'No issues found';
  } else if (errorsByLevel.length === 1) {
    summary = errorsByLevel[0]!.message;
  } else if (errorsByLevel.length > 1) {
    summary = `${errorsByLevel.length} errors found`;
  } else {
    summary = `${warningsByLevel.length} warning(s)`;
  }

  return {
    errors,
    byStage,
    bySeverity: {
      errors: errorsByLevel,
      warnings: warningsByLevel,
      info: infoByLevel,
    },
    hasBlockingErrors: hasBlocking,
    totalCount: errors.length,
    summary,
  };
}

/**
 * Get the primary error (most important) from a collection.
 */
export function getPrimaryError(
  collection: ErrorCollection
): ErrorShape | undefined {
  // Return the first blocking error, or the first warning, or the first info
  if (collection.bySeverity.errors.length > 0) {
    return collection.bySeverity.errors[0];
  }
  if (collection.bySeverity.warnings.length > 0) {
    return collection.bySeverity.warnings[0];
  }
  return collection.bySeverity.info[0];
}

/**
 * Create default UI hints for an error shape type.
 */
export function defaultUIHints(shape: ErrorShapeType): ErrorUIHints {
  switch (shape) {
    case 'parse_error':
      return { icon: 'parse', color: 'red', highlightSpan: true, expandDetails: false, inlineSuggestions: true, dismissible: false, position: 'inline' };
    case 'unresolved_reference':
      return { icon: 'reference', color: 'orange', highlightSpan: true, expandDetails: false, inlineSuggestions: true, dismissible: false, position: 'inline' };
    case 'unsatisfied_constraint':
      return { icon: 'constraint', color: 'orange', highlightSpan: false, expandDetails: true, inlineSuggestions: true, dismissible: false, position: 'banner' };
    case 'unsafe_plan':
      return { icon: 'safety', color: 'orange', highlightSpan: false, expandDetails: true, inlineSuggestions: true, dismissible: false, position: 'banner' };
    case 'missing_capability':
      return { icon: 'capability', color: 'yellow', highlightSpan: false, expandDetails: false, inlineSuggestions: true, dismissible: true, position: 'banner' };
    case 'type_error':
      return { icon: 'type', color: 'red', highlightSpan: true, expandDetails: true, inlineSuggestions: false, dismissible: false, position: 'inline' };
    case 'presupposition_failure':
      return { icon: 'info', color: 'yellow', highlightSpan: true, expandDetails: false, inlineSuggestions: true, dismissible: false, position: 'inline' };
    case 'unknown_term':
      return { icon: 'parse', color: 'orange', highlightSpan: true, expandDetails: false, inlineSuggestions: true, dismissible: false, position: 'inline' };
    case 'scope_error':
      return { icon: 'reference', color: 'orange', highlightSpan: true, expandDetails: false, inlineSuggestions: true, dismissible: false, position: 'inline' };
    case 'constraint_conflict':
      return { icon: 'constraint', color: 'red', highlightSpan: false, expandDetails: true, inlineSuggestions: true, dismissible: false, position: 'banner' };
    case 'timeout':
      return { icon: 'time', color: 'yellow', highlightSpan: false, expandDetails: false, inlineSuggestions: true, dismissible: true, position: 'toast' };
    case 'internal_error':
      return { icon: 'bug', color: 'gray', highlightSpan: false, expandDetails: false, inlineSuggestions: true, dismissible: true, position: 'toast' };
  }
}
