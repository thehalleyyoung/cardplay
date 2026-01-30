/**
 * GOFAI Interaction Loop — Default User-Facing Interaction State Machine
 *
 * Step 009 [HCI]: Defines the default interaction loop that governs the
 * user-facing editing cycle:
 *
 *   1. User enters natural language instruction
 *   2. System parses → produces CPL-Intent (possibly with holes)
 *   3. System shows CPL to user (what we understood)
 *   4. If holes exist → ask clarification questions → user resolves
 *   5. System plans → produces CPL-Plan + diff preview
 *   6. User inspects plan/diff
 *   7. User applies (or edits/cancels)
 *   8. System executes → produces EditPackage (reversible)
 *   9. User can undo/redo/explain at any point
 *
 * This module formalizes the loop as a typed state machine with explicit
 * transitions, guards, and side-effect contracts. The UI layer renders
 * each state; the pipeline layer computes transitions.
 *
 * ## Design Principles
 *
 * - **Preview-first**: Nothing mutates project state until the user explicitly
 *   applies. The default mode is "show, don't do."
 * - **Clarification-gated**: Execution is blocked until all hard holes are
 *   resolved. Soft holes may proceed with defaults if user consents.
 * - **Reversible**: Every applied edit produces an undo token. The loop
 *   supports undo/redo as first-class transitions.
 * - **Inspectable**: At every state, the user can ask "why" and see
 *   provenance, parse decisions, and lever explanations.
 * - **Deterministic**: The same input + dialogue state + world state
 *   produces the same output. No randomness.
 *
 * @module gofai/pipeline/interaction-loop
 * @see {@link docs/gofai/product-contract.md} for guarantees
 */

import type {
  PipelineStageId,
  CPLIntent,
  CPLHole,
  CPLPlan,
  CPLScope,
  ClarificationQuestion,
  DiffSummary,
  EditPackage,
  PipelineConfig,
  StageDiagnostic,
  TextSpan,
  PlanScore,
} from './types';

// =============================================================================
// Interaction Loop State Machine
// =============================================================================

/**
 * All possible states of the interaction loop.
 *
 * The loop follows a strict progression:
 *   idle → parsing → showing_cpl → clarifying → planning → showing_plan → applying → applied
 *
 * With escape transitions:
 *   any → error (on failure)
 *   applied → undone (on undo)
 *   undone → applied (on redo)
 *   any → idle (on reset/cancel)
 */
export type InteractionState =
  | IdleState
  | ParsingState
  | ShowingCplState
  | ClarifyingState
  | PlanningState
  | ShowingPlanState
  | ApplyingState
  | AppliedState
  | UndoneState
  | ExplainingState
  | EditingPlanState
  | ErrorState;

/**
 * Discriminant for interaction states.
 */
export type InteractionStateType = InteractionState['type'];

/**
 * The complete set of state type literals.
 */
export const INTERACTION_STATE_TYPES = [
  'idle',
  'parsing',
  'showing_cpl',
  'clarifying',
  'planning',
  'showing_plan',
  'applying',
  'applied',
  'undone',
  'explaining',
  'editing_plan',
  'error',
] as const;

// =============================================================================
// Individual State Types
// =============================================================================

/**
 * Idle: Waiting for user input. The loop has not started or has been reset.
 */
export interface IdleState {
  readonly type: 'idle';

  /** Session identifier (stable across the conversation) */
  readonly sessionId: string;

  /** Turn counter within this session */
  readonly turnNumber: number;

  /** Previously applied edits in this session (for undo stack) */
  readonly editHistory: readonly EditHistoryEntry[];

  /** Current dialogue context (salient entities, last focus, etc.) */
  readonly dialogueContext: DialogueContext;

  /** Available quick actions */
  readonly availableActions: readonly InteractionAction[];
}

/**
 * Parsing: The system is processing the user's utterance through the pipeline.
 * UI should show a progress indicator.
 */
export interface ParsingState {
  readonly type: 'parsing';

  /** The raw user utterance */
  readonly utterance: string;

  /** Which pipeline stage is currently running */
  readonly currentStage: PipelineStageId;

  /** Stages completed so far */
  readonly completedStages: readonly PipelineStageId[];

  /** Session context inherited from idle */
  readonly sessionId: string;
  readonly turnNumber: number;
  readonly dialogueContext: DialogueContext;
}

/**
 * ShowingCpl: The system has parsed the utterance and produced CPL-Intent.
 * The user can inspect what was understood before proceeding.
 *
 * This is the "what we understood" moment.
 */
export interface ShowingCplState {
  readonly type: 'showing_cpl';

  /** The original utterance */
  readonly utterance: string;

  /** The parsed intent */
  readonly intent: CPLIntent;

  /** Holes that need resolution (if any) */
  readonly holes: readonly CPLHole[];

  /** Whether clarification is required before planning */
  readonly requiresClarification: boolean;

  /** Number of hard holes (must be resolved) */
  readonly hardHoleCount: number;

  /** Number of soft holes (have safe defaults) */
  readonly softHoleCount: number;

  /** Parse provenance for debugging/explanation */
  readonly parseProvenance: ParseProvenanceSummary;

  /** Available actions from this state */
  readonly availableActions: readonly InteractionAction[];

  /** Session context */
  readonly sessionId: string;
  readonly turnNumber: number;
  readonly dialogueContext: DialogueContext;
}

/**
 * Clarifying: The system has identified ambiguities that need user resolution.
 * One or more clarification questions are presented.
 *
 * The user resolves questions one at a time or in batches.
 * Each resolution updates the intent and may resolve multiple holes.
 */
export interface ClarifyingState {
  readonly type: 'clarifying';

  /** The original utterance */
  readonly utterance: string;

  /** The current (partially resolved) intent */
  readonly currentIntent: CPLIntent;

  /** All questions to present */
  readonly questions: readonly ClarificationQuestion[];

  /** Which questions have been answered */
  readonly answeredQuestions: readonly AnsweredQuestion[];

  /** Remaining unanswered questions */
  readonly remainingQuestions: readonly ClarificationQuestion[];

  /** Whether all hard holes have been resolved */
  readonly allHardHolesResolved: boolean;

  /** Whether the user can proceed with defaults */
  readonly canProceedWithDefaults: boolean;

  /** Available actions */
  readonly availableActions: readonly InteractionAction[];

  /** Session context */
  readonly sessionId: string;
  readonly turnNumber: number;
  readonly dialogueContext: DialogueContext;
}

/**
 * Planning: The system is generating an execution plan from the resolved intent.
 * UI should show a progress indicator.
 */
export interface PlanningState {
  readonly type: 'planning';

  /** The fully resolved intent */
  readonly resolvedIntent: CPLIntent;

  /** The original utterance */
  readonly utterance: string;

  /** Session context */
  readonly sessionId: string;
  readonly turnNumber: number;
  readonly dialogueContext: DialogueContext;
}

/**
 * ShowingPlan: The system has generated a plan and diff preview.
 * The user inspects before applying.
 *
 * This is the "what we'll do" moment.
 */
export interface ShowingPlanState {
  readonly type: 'showing_plan';

  /** The original utterance */
  readonly utterance: string;

  /** The resolved intent */
  readonly intent: CPLIntent;

  /** The proposed plan */
  readonly plan: CPLPlan;

  /** Diff preview (what will change) */
  readonly diffPreview: DiffSummary;

  /** Alternative plans (if multiple near-equal options exist) */
  readonly alternatives: readonly AlternativePlanSummary[];

  /** Safety assessment */
  readonly safetyAssessment: SafetyAssessment;

  /** Plan explanation (human-readable) */
  readonly explanation: PlanExplanation;

  /** Whether auto-apply is allowed in this context */
  readonly autoApplyAllowed: boolean;

  /** Available actions */
  readonly availableActions: readonly InteractionAction[];

  /** Session context */
  readonly sessionId: string;
  readonly turnNumber: number;
  readonly dialogueContext: DialogueContext;
}

/**
 * Applying: The system is executing the plan. This is the only state
 * where project state can be mutated.
 */
export interface ApplyingState {
  readonly type: 'applying';

  /** The plan being applied */
  readonly plan: CPLPlan;

  /** Current step being executed */
  readonly currentStep: number;

  /** Total steps */
  readonly totalSteps: number;

  /** Session context */
  readonly sessionId: string;
  readonly turnNumber: number;
  readonly dialogueContext: DialogueContext;
}

/**
 * Applied: The plan has been executed successfully. The user can inspect
 * the result, undo, or start a new turn.
 */
export interface AppliedState {
  readonly type: 'applied';

  /** The original utterance */
  readonly utterance: string;

  /** The executed plan */
  readonly plan: CPLPlan;

  /** The edit package (contains diff and undo capability) */
  readonly editPackage: EditPackage;

  /** Summary of what changed */
  readonly changeSummary: ChangeSummary;

  /** Constraint verification results */
  readonly constraintResults: readonly ConstraintVerificationSummary[];

  /** Whether all constraints passed */
  readonly allConstraintsPassed: boolean;

  /** Available actions */
  readonly availableActions: readonly InteractionAction[];

  /** Session context */
  readonly sessionId: string;
  readonly turnNumber: number;
  readonly dialogueContext: DialogueContext;
}

/**
 * Undone: An edit has been undone. The user can redo or start fresh.
 */
export interface UndoneState {
  readonly type: 'undone';

  /** The undone edit package */
  readonly undonePackage: EditPackage;

  /** Summary of what was reversed */
  readonly reversalSummary: string;

  /** Available actions */
  readonly availableActions: readonly InteractionAction[];

  /** Session context */
  readonly sessionId: string;
  readonly turnNumber: number;
  readonly dialogueContext: DialogueContext;
}

/**
 * Explaining: The user has asked "why" about a decision or plan.
 * The system is showing provenance/reasoning.
 */
export interface ExplainingState {
  readonly type: 'explaining';

  /** What is being explained */
  readonly explainTarget: ExplainTarget;

  /** The explanation content */
  readonly explanation: ExplanationContent;

  /** State to return to after explanation */
  readonly returnState: InteractionStateType;

  /** Available actions */
  readonly availableActions: readonly InteractionAction[];

  /** Session context */
  readonly sessionId: string;
  readonly turnNumber: number;
  readonly dialogueContext: DialogueContext;
}

/**
 * EditingPlan: The user is manually tweaking plan parameters before applying.
 * (Advanced mode: users can adjust lever amounts, scopes, etc.)
 */
export interface EditingPlanState {
  readonly type: 'editing_plan';

  /** The plan being edited */
  readonly originalPlan: CPLPlan;

  /** The current edited version */
  readonly editedPlan: CPLPlan;

  /** What the user has changed */
  readonly edits: readonly PlanEdit[];

  /** Updated diff preview */
  readonly updatedDiffPreview: DiffSummary;

  /** Whether the edited plan is valid */
  readonly isValid: boolean;

  /** Validation errors (if invalid) */
  readonly validationErrors: readonly string[];

  /** Available actions */
  readonly availableActions: readonly InteractionAction[];

  /** Session context */
  readonly sessionId: string;
  readonly turnNumber: number;
  readonly dialogueContext: DialogueContext;
}

/**
 * Error: Something went wrong. The user sees structured diagnostics
 * and can retry, rephrase, or reset.
 */
export interface ErrorState {
  readonly type: 'error';

  /** The original utterance (if available) */
  readonly utterance: string | undefined;

  /** Error category */
  readonly errorCategory: ErrorCategory;

  /** Structured diagnostics */
  readonly diagnostics: readonly StageDiagnostic[];

  /** Which pipeline stage failed (if applicable) */
  readonly failedStage: PipelineStageId | undefined;

  /** User-facing error message */
  readonly userMessage: string;

  /** Suggested actions */
  readonly suggestions: readonly ErrorSuggestion[];

  /** Partial parse (for error recovery display) */
  readonly partialParse: CPLIntent | undefined;

  /** Available actions */
  readonly availableActions: readonly InteractionAction[];

  /** Session context */
  readonly sessionId: string;
  readonly turnNumber: number;
  readonly dialogueContext: DialogueContext;
}

// =============================================================================
// Interaction Actions (User Moves)
// =============================================================================

/**
 * Actions the user can take at any point in the interaction loop.
 */
export type InteractionAction =
  | { readonly type: 'submit_utterance'; readonly label: string }
  | { readonly type: 'resolve_clarification'; readonly questionId: string; readonly label: string }
  | { readonly type: 'accept_defaults'; readonly label: string }
  | { readonly type: 'proceed_to_plan'; readonly label: string }
  | { readonly type: 'apply_plan'; readonly label: string }
  | { readonly type: 'select_alternative'; readonly planIndex: number; readonly label: string }
  | { readonly type: 'edit_plan'; readonly label: string }
  | { readonly type: 'save_plan_edit'; readonly label: string }
  | { readonly type: 'undo'; readonly label: string }
  | { readonly type: 'redo'; readonly label: string }
  | { readonly type: 'explain'; readonly target: string; readonly label: string }
  | { readonly type: 'cancel'; readonly label: string }
  | { readonly type: 'reset'; readonly label: string }
  | { readonly type: 'rephrase'; readonly label: string }
  | { readonly type: 'inspect_cpl'; readonly label: string }
  | { readonly type: 'inspect_bindings'; readonly label: string }
  | { readonly type: 'inspect_provenance'; readonly label: string }
  | { readonly type: 'bookmark'; readonly label: string }
  | { readonly type: 'export_report'; readonly label: string };

/**
 * The action type discriminants as a const array.
 */
export const INTERACTION_ACTION_TYPES = [
  'submit_utterance',
  'resolve_clarification',
  'accept_defaults',
  'proceed_to_plan',
  'apply_plan',
  'select_alternative',
  'edit_plan',
  'save_plan_edit',
  'undo',
  'redo',
  'explain',
  'cancel',
  'reset',
  'rephrase',
  'inspect_cpl',
  'inspect_bindings',
  'inspect_provenance',
  'bookmark',
  'export_report',
] as const;

// =============================================================================
// Interaction Events (System + User Events for the State Machine)
// =============================================================================

/**
 * Events that drive state transitions in the interaction loop.
 */
export type InteractionEvent =
  | UserSubmitEvent
  | ParseCompleteEvent
  | ClarificationResolvedEvent
  | AcceptDefaultsEvent
  | ProceedToPlanEvent
  | PlanCompleteEvent
  | ApplyRequestEvent
  | ApplyCompleteEvent
  | UndoRequestEvent
  | UndoCompleteEvent
  | RedoRequestEvent
  | RedoCompleteEvent
  | ExplainRequestEvent
  | CancelEvent
  | ResetEvent
  | RephraseEvent
  | SelectAlternativeEvent
  | EditPlanEvent
  | SavePlanEditEvent
  | PipelineErrorEvent;

/** User submits a natural language instruction */
export interface UserSubmitEvent {
  readonly type: 'user_submit';
  readonly utterance: string;
  readonly timestamp: number;
}

/** Pipeline completed parsing through semantics/pragmatics */
export interface ParseCompleteEvent {
  readonly type: 'parse_complete';
  readonly intent: CPLIntent;
  readonly holes: readonly CPLHole[];
  readonly questions: readonly ClarificationQuestion[];
  readonly provenance: ParseProvenanceSummary;
}

/** User resolved one clarification question */
export interface ClarificationResolvedEvent {
  readonly type: 'clarification_resolved';
  readonly questionId: string;
  readonly selectedOptionIndex: number;
  readonly updatedIntent: CPLIntent;
  readonly remainingHoles: readonly CPLHole[];
}

/** User accepts all default resolutions */
export interface AcceptDefaultsEvent {
  readonly type: 'accept_defaults';
  readonly resolvedIntent: CPLIntent;
}

/** User explicitly requests proceeding to planning */
export interface ProceedToPlanEvent {
  readonly type: 'proceed_to_plan';
  readonly resolvedIntent: CPLIntent;
}

/** Planning stage completed */
export interface PlanCompleteEvent {
  readonly type: 'plan_complete';
  readonly plan: CPLPlan;
  readonly diffPreview: DiffSummary;
  readonly alternatives: readonly AlternativePlanSummary[];
  readonly safety: SafetyAssessment;
  readonly explanation: PlanExplanation;
}

/** User requests applying the plan */
export interface ApplyRequestEvent {
  readonly type: 'apply_request';
  readonly planId: string;
}

/** Execution completed */
export interface ApplyCompleteEvent {
  readonly type: 'apply_complete';
  readonly editPackage: EditPackage;
  readonly constraintResults: readonly ConstraintVerificationSummary[];
  readonly allPassed: boolean;
}

/** User requests undo */
export interface UndoRequestEvent {
  readonly type: 'undo_request';
  readonly targetPackageId: string | undefined;
}

/** Undo completed */
export interface UndoCompleteEvent {
  readonly type: 'undo_complete';
  readonly undonePackage: EditPackage;
  readonly summary: string;
}

/** User requests redo */
export interface RedoRequestEvent {
  readonly type: 'redo_request';
}

/** Redo completed */
export interface RedoCompleteEvent {
  readonly type: 'redo_complete';
  readonly reappliedPackage: EditPackage;
}

/** User requests an explanation */
export interface ExplainRequestEvent {
  readonly type: 'explain_request';
  readonly target: ExplainTarget;
}

/** User cancels current operation */
export interface CancelEvent {
  readonly type: 'cancel';
}

/** User resets the conversation */
export interface ResetEvent {
  readonly type: 'reset';
}

/** User wants to rephrase their instruction */
export interface RephraseEvent {
  readonly type: 'rephrase';
}

/** User selects an alternative plan */
export interface SelectAlternativeEvent {
  readonly type: 'select_alternative';
  readonly alternativeIndex: number;
}

/** User enters plan editing mode */
export interface EditPlanEvent {
  readonly type: 'edit_plan';
}

/** User saves plan edits */
export interface SavePlanEditEvent {
  readonly type: 'save_plan_edit';
  readonly editedPlan: CPLPlan;
  readonly edits: readonly PlanEdit[];
}

/** Pipeline produced an error */
export interface PipelineErrorEvent {
  readonly type: 'pipeline_error';
  readonly errorCategory: ErrorCategory;
  readonly diagnostics: readonly StageDiagnostic[];
  readonly failedStage: PipelineStageId | undefined;
  readonly userMessage: string;
  readonly suggestions: readonly ErrorSuggestion[];
  readonly partialParse: CPLIntent | undefined;
}

// =============================================================================
// State Transition Function
// =============================================================================

/**
 * Valid state transitions. Each entry maps a state type to the events
 * that are legal in that state and the resulting state type.
 *
 * This is the canonical reference for what can happen where.
 */
export const STATE_TRANSITIONS: Readonly<
  Record<InteractionStateType, readonly InteractionEventType[]>
> = {
  idle: ['user_submit', 'undo_request', 'redo_request', 'explain_request', 'reset'],
  parsing: ['parse_complete', 'pipeline_error', 'cancel'],
  showing_cpl: [
    'proceed_to_plan',
    'accept_defaults',
    'explain_request',
    'cancel',
    'rephrase',
  ],
  clarifying: [
    'clarification_resolved',
    'accept_defaults',
    'proceed_to_plan',
    'explain_request',
    'cancel',
    'rephrase',
  ],
  planning: ['plan_complete', 'pipeline_error', 'cancel'],
  showing_plan: [
    'apply_request',
    'select_alternative',
    'edit_plan',
    'explain_request',
    'cancel',
    'rephrase',
  ],
  applying: ['apply_complete', 'pipeline_error', 'cancel'],
  applied: [
    'user_submit',
    'undo_request',
    'explain_request',
    'reset',
  ],
  undone: [
    'user_submit',
    'redo_request',
    'undo_request',
    'reset',
  ],
  explaining: ['cancel'],
  editing_plan: [
    'save_plan_edit',
    'cancel',
  ],
  error: [
    'user_submit',
    'rephrase',
    'reset',
  ],
} as const;

/**
 * Event type discriminants.
 */
export type InteractionEventType = InteractionEvent['type'];

/**
 * Check whether an event is valid in the current state.
 */
export function isValidTransition(
  stateType: InteractionStateType,
  eventType: InteractionEventType
): boolean {
  const validEvents = STATE_TRANSITIONS[stateType];
  return (validEvents as readonly string[]).includes(eventType);
}

// =============================================================================
// Transition Guards
// =============================================================================

/**
 * Guards that must pass before certain transitions are allowed.
 * These enforce the product contract.
 */
export interface TransitionGuards {
  /**
   * Guard: Cannot proceed to planning while hard holes remain.
   */
  canProceedToPlan(state: ShowingCplState | ClarifyingState): TransitionGuardResult;

  /**
   * Guard: Cannot apply a plan that has constraint violations.
   */
  canApplyPlan(state: ShowingPlanState): TransitionGuardResult;

  /**
   * Guard: Cannot auto-apply unless board policy allows it.
   */
  canAutoApply(state: ShowingPlanState): TransitionGuardResult;

  /**
   * Guard: Cannot undo if edit history is empty.
   */
  canUndo(state: InteractionState): TransitionGuardResult;

  /**
   * Guard: Cannot redo if no undone edits exist.
   */
  canRedo(state: InteractionState): TransitionGuardResult;

  /**
   * Guard: Cannot accept defaults if any hard hole lacks a safe default.
   */
  canAcceptDefaults(state: ShowingCplState | ClarifyingState): TransitionGuardResult;
}

/**
 * Result of a transition guard check.
 */
export interface TransitionGuardResult {
  /** Whether the transition is allowed */
  readonly allowed: boolean;

  /** Reason (if blocked) */
  readonly reason: string | undefined;

  /** What would need to change to allow it */
  readonly howToUnblock: string | undefined;
}

// =============================================================================
// Default Transition Guards Implementation
// =============================================================================

/**
 * Create the default set of transition guards.
 *
 * These guards enforce the GOFAI Music+ product contract:
 * - No execution with unresolved hard holes
 * - No auto-apply without board policy consent
 * - Constraint violations block application
 */
export function createDefaultGuards(): TransitionGuards {
  return {
    canProceedToPlan(
      state: ShowingCplState | ClarifyingState
    ): TransitionGuardResult {
      if (state.type === 'showing_cpl') {
        if (state.hardHoleCount > 0) {
          return {
            allowed: false,
            reason: `${state.hardHoleCount} ambiguity/ies require resolution before planning`,
            howToUnblock: 'Resolve all highlighted ambiguities or accept defaults where available',
          };
        }
        return { allowed: true, reason: undefined, howToUnblock: undefined };
      }

      // clarifying state
      if (!state.allHardHolesResolved) {
        const remaining = state.remainingQuestions.length;
        return {
          allowed: false,
          reason: `${remaining} clarification question(s) still pending`,
          howToUnblock: 'Answer the remaining questions or accept defaults',
        };
      }
      return { allowed: true, reason: undefined, howToUnblock: undefined };
    },

    canApplyPlan(state: ShowingPlanState): TransitionGuardResult {
      if (state.safetyAssessment.level === 'blocked') {
        return {
          allowed: false,
          reason: state.safetyAssessment.blockReason ?? 'Plan blocked by safety check',
          howToUnblock: 'Modify the plan to remove safety violations',
        };
      }
      return { allowed: true, reason: undefined, howToUnblock: undefined };
    },

    canAutoApply(state: ShowingPlanState): TransitionGuardResult {
      if (!state.autoApplyAllowed) {
        return {
          allowed: false,
          reason: 'Auto-apply is not enabled in this board context',
          howToUnblock: 'Switch to a board with auto-apply enabled, or apply manually',
        };
      }
      if (state.safetyAssessment.level === 'risky' || state.safetyAssessment.level === 'blocked') {
        return {
          allowed: false,
          reason: 'Auto-apply is disabled for risky or blocked plans',
          howToUnblock: 'Review and manually apply the plan',
        };
      }
      return { allowed: true, reason: undefined, howToUnblock: undefined };
    },

    canUndo(state: InteractionState): TransitionGuardResult {
      if (!('dialogueContext' in state)) {
        return {
          allowed: false,
          reason: 'No dialogue context available',
          howToUnblock: undefined,
        };
      }
      const ctx = state.dialogueContext;
      if (ctx.undoStack.length === 0) {
        return {
          allowed: false,
          reason: 'Nothing to undo',
          howToUnblock: 'Apply an edit first',
        };
      }
      return { allowed: true, reason: undefined, howToUnblock: undefined };
    },

    canRedo(state: InteractionState): TransitionGuardResult {
      if (!('dialogueContext' in state)) {
        return {
          allowed: false,
          reason: 'No dialogue context available',
          howToUnblock: undefined,
        };
      }
      const ctx = state.dialogueContext;
      if (ctx.redoStack.length === 0) {
        return {
          allowed: false,
          reason: 'Nothing to redo',
          howToUnblock: 'Undo an edit first',
        };
      }
      return { allowed: true, reason: undefined, howToUnblock: undefined };
    },

    canAcceptDefaults(
      state: ShowingCplState | ClarifyingState
    ): TransitionGuardResult {
      if (state.type === 'showing_cpl') {
        if (state.hardHoleCount > 0 && state.softHoleCount === state.holes.length) {
          // All holes are soft — can accept
          return { allowed: true, reason: undefined, howToUnblock: undefined };
        }
        if (state.hardHoleCount > 0) {
          return {
            allowed: false,
            reason: `${state.hardHoleCount} hard ambiguity/ies have no safe default`,
            howToUnblock: 'Resolve these ambiguities manually',
          };
        }
        return { allowed: true, reason: undefined, howToUnblock: undefined };
      }

      // clarifying state
      if (!state.canProceedWithDefaults) {
        return {
          allowed: false,
          reason: 'Some remaining questions have no safe default option',
          howToUnblock: 'Answer the questions that require explicit choice',
        };
      }
      return { allowed: true, reason: undefined, howToUnblock: undefined };
    },
  };
}

// =============================================================================
// Available Actions per State
// =============================================================================

/**
 * Compute the available actions for a given state.
 * This is the canonical list of what the UI should show.
 */
export function getAvailableActions(
  state: InteractionState,
  guards: TransitionGuards
): readonly InteractionAction[] {
  const actions: InteractionAction[] = [];

  switch (state.type) {
    case 'idle':
      actions.push({ type: 'submit_utterance', label: 'Enter instruction' });
      if (guards.canUndo(state).allowed) {
        actions.push({ type: 'undo', label: 'Undo last edit' });
      }
      if (guards.canRedo(state).allowed) {
        actions.push({ type: 'redo', label: 'Redo' });
      }
      break;

    case 'parsing':
      actions.push({ type: 'cancel', label: 'Cancel' });
      break;

    case 'showing_cpl':
      if (guards.canProceedToPlan(state).allowed) {
        actions.push({ type: 'proceed_to_plan', label: 'Generate plan' });
      }
      if (state.requiresClarification) {
        // transition to clarifying is implicit
      }
      if (guards.canAcceptDefaults(state).allowed && state.softHoleCount > 0) {
        actions.push({ type: 'accept_defaults', label: 'Accept defaults' });
      }
      actions.push({ type: 'inspect_cpl', label: 'Inspect meaning' });
      actions.push({ type: 'inspect_bindings', label: 'Show bindings' });
      actions.push({ type: 'explain', target: 'parse', label: 'Why this parse?' });
      actions.push({ type: 'rephrase', label: 'Rephrase' });
      actions.push({ type: 'cancel', label: 'Cancel' });
      break;

    case 'clarifying':
      for (const q of state.remainingQuestions) {
        actions.push({
          type: 'resolve_clarification',
          questionId: q.id,
          label: `Answer: ${q.text}`,
        });
      }
      if (guards.canAcceptDefaults(state).allowed) {
        actions.push({ type: 'accept_defaults', label: 'Accept remaining defaults' });
      }
      if (guards.canProceedToPlan(state).allowed) {
        actions.push({ type: 'proceed_to_plan', label: 'Generate plan' });
      }
      actions.push({ type: 'rephrase', label: 'Rephrase' });
      actions.push({ type: 'cancel', label: 'Cancel' });
      break;

    case 'planning':
      actions.push({ type: 'cancel', label: 'Cancel' });
      break;

    case 'showing_plan': {
      const canApply = guards.canApplyPlan(state);
      if (canApply.allowed) {
        actions.push({ type: 'apply_plan', label: 'Apply' });
      }
      if (state.alternatives.length > 0) {
        for (let i = 0; i < state.alternatives.length; i++) {
          actions.push({
            type: 'select_alternative',
            planIndex: i,
            label: `Try alternative ${i + 1}`,
          });
        }
      }
      actions.push({ type: 'edit_plan', label: 'Edit plan' });
      actions.push({ type: 'explain', target: 'plan', label: 'Why this plan?' });
      actions.push({ type: 'rephrase', label: 'Start over' });
      actions.push({ type: 'cancel', label: 'Cancel' });
      break;
    }

    case 'applying':
      actions.push({ type: 'cancel', label: 'Cancel' });
      break;

    case 'applied':
      actions.push({ type: 'submit_utterance', label: 'Next instruction' });
      actions.push({ type: 'undo', label: 'Undo' });
      actions.push({ type: 'explain', target: 'edit', label: 'Explain changes' });
      actions.push({ type: 'bookmark', label: 'Bookmark this edit' });
      actions.push({ type: 'export_report', label: 'Export report' });
      actions.push({ type: 'reset', label: 'New session' });
      break;

    case 'undone':
      actions.push({ type: 'submit_utterance', label: 'Next instruction' });
      actions.push({ type: 'redo', label: 'Redo' });
      if (guards.canUndo(state).allowed) {
        actions.push({ type: 'undo', label: 'Undo more' });
      }
      actions.push({ type: 'reset', label: 'New session' });
      break;

    case 'explaining':
      actions.push({ type: 'cancel', label: 'Back' });
      break;

    case 'editing_plan':
      actions.push({ type: 'save_plan_edit', label: 'Save and preview' });
      actions.push({ type: 'cancel', label: 'Discard edits' });
      break;

    case 'error':
      actions.push({ type: 'rephrase', label: 'Try different wording' });
      actions.push({ type: 'submit_utterance', label: 'New instruction' });
      actions.push({ type: 'reset', label: 'Reset' });
      break;
  }

  return actions;
}

// =============================================================================
// Supporting Types
// =============================================================================

/**
 * Dialogue context: tracks conversation state across turns.
 */
export interface DialogueContext {
  /** Salient entity IDs (most recent first) */
  readonly salientEntities: readonly SalientEntity[];

  /** Last focused scope (section, range, layer) */
  readonly lastFocusedScope: CPLScope | undefined;

  /** Last edited layers */
  readonly lastEditedLayers: readonly string[];

  /** Last applied edit package ID */
  readonly lastEditPackageId: string | undefined;

  /** User preferences for vague terms */
  readonly userPreferences: Readonly<Record<string, string>>;

  /** Undo stack */
  readonly undoStack: readonly string[];

  /** Redo stack */
  readonly redoStack: readonly string[];

  /** Current UI selection context (from the host environment) */
  readonly uiSelection: UISelectionContext | undefined;

  /** Current board context */
  readonly boardContext: BoardContext | undefined;
}

/**
 * A salient entity in the dialogue context.
 */
export interface SalientEntity {
  /** Entity type */
  readonly type: 'section' | 'layer' | 'card' | 'range' | 'event_set';

  /** Entity identifier */
  readonly id: string;

  /** Display name */
  readonly displayName: string;

  /** How this became salient */
  readonly source: 'mentioned' | 'edited' | 'focused' | 'selected';

  /** Turn number when it became salient */
  readonly turnNumber: number;

  /** Salience score (decays over turns) */
  readonly salience: number;
}

/**
 * UI selection context from the host environment.
 */
export interface UISelectionContext {
  /** Type of selection */
  readonly type: 'notes' | 'range' | 'track' | 'section' | 'none';

  /** Description for display */
  readonly description: string;

  /** Associated entity IDs */
  readonly entityIds: readonly string[];

  /** Bar range (if applicable) */
  readonly barRange: readonly [number, number] | undefined;

  /** Layer ID (if applicable) */
  readonly layerId: string | undefined;
}

/**
 * Board context from the host environment.
 */
export interface BoardContext {
  /** Current board ID */
  readonly boardId: string;

  /** Board display name */
  readonly boardName: string;

  /** Control level (full-manual, collaborative, directed, generative) */
  readonly controlLevel: string;

  /** Whether auto-apply is permitted */
  readonly autoApplyEnabled: boolean;

  /** Available capabilities (production, routing, etc.) */
  readonly capabilities: readonly string[];

  /** Active deck IDs */
  readonly activeDecks: readonly string[];
}

/**
 * Edit history entry for the undo/redo system.
 */
export interface EditHistoryEntry {
  /** Edit package ID */
  readonly packageId: string;

  /** Turn number */
  readonly turnNumber: number;

  /** Summary */
  readonly summary: string;

  /** Timestamp */
  readonly timestamp: number;

  /** The utterance that produced this edit */
  readonly utterance: string;
}

/**
 * An answered clarification question.
 */
export interface AnsweredQuestion {
  /** Question ID */
  readonly questionId: string;

  /** Selected option index */
  readonly selectedOptionIndex: number;

  /** Selected option label */
  readonly selectedOptionLabel: string;

  /** The question text (for display) */
  readonly questionText: string;
}

/**
 * Summary of a parse's provenance (for user display).
 */
export interface ParseProvenanceSummary {
  /** Key lexeme mappings ("darker" → axis:brightness, decrease) */
  readonly lexemeMappings: readonly LexemeMapping[];

  /** Scope bindings ("the chorus" → Chorus 2, bars 49-65) */
  readonly scopeBindings: readonly ScopeBinding[];

  /** Ambiguity notes */
  readonly ambiguityNotes: readonly string[];

  /** Total parse duration (ms) */
  readonly parseDurationMs: number;
}

/**
 * A lexeme mapping in provenance.
 */
export interface LexemeMapping {
  /** Original word(s) */
  readonly surface: string;

  /** What it mapped to */
  readonly mapping: string;

  /** Source span */
  readonly span: TextSpan;
}

/**
 * A scope binding in provenance.
 */
export interface ScopeBinding {
  /** Original reference */
  readonly reference: string;

  /** What it bound to */
  readonly binding: string;

  /** Confidence */
  readonly confidence: 'certain' | 'likely' | 'guessed';

  /** Reason for binding */
  readonly reason: string;
}

/**
 * An alternative plan summary (for the "compare plans" UI).
 */
export interface AlternativePlanSummary {
  /** Plan index */
  readonly index: number;

  /** Plan ID */
  readonly planId: string;

  /** How it differs from the primary plan */
  readonly differenceDescription: string;

  /** Score comparison */
  readonly score: PlanScore;

  /** Diff preview summary (one line) */
  readonly diffSummaryLine: string;
}

/**
 * Safety assessment for a plan.
 */
export interface SafetyAssessment {
  /** Overall level */
  readonly level: 'safe' | 'caution' | 'risky' | 'blocked';

  /** Reason for the level */
  readonly reason: string;

  /** Block reason (if level === 'blocked') */
  readonly blockReason: string | undefined;

  /** Number of events that would be affected */
  readonly affectedEventCount: number;

  /** Number of layers/tracks touched */
  readonly affectedLayerCount: number;

  /** Whether structural changes are involved */
  readonly hasStructuralChanges: boolean;

  /** Specific risk items */
  readonly risks: readonly SafetyRisk[];
}

/**
 * A specific risk in a safety assessment.
 */
export interface SafetyRisk {
  /** Risk category */
  readonly category: 'scope_breadth' | 'constraint_tension' | 'structural' | 'irreversibility';

  /** Description */
  readonly description: string;

  /** Severity */
  readonly severity: 'low' | 'medium' | 'high';
}

/**
 * Plan explanation (human-readable).
 */
export interface PlanExplanation {
  /** One-sentence summary */
  readonly summary: string;

  /** Per-step explanations */
  readonly stepExplanations: readonly StepExplanation[];

  /** Musical reasoning (in musician-friendly language) */
  readonly musicalReasoning: string;

  /** Lever explanations */
  readonly leverExplanations: readonly LeverExplanation[];
}

/**
 * Explanation for a single plan step.
 */
export interface StepExplanation {
  /** Step ID */
  readonly stepId: string;

  /** What this step does */
  readonly description: string;

  /** Why this step was chosen */
  readonly reason: string;

  /** Which goal(s) it serves */
  readonly goalsServed: readonly string[];
}

/**
 * Explanation for a lever choice.
 */
export interface LeverExplanation {
  /** Lever name */
  readonly lever: string;

  /** Axis it affects */
  readonly axis: string;

  /** Direction */
  readonly direction: 'increase' | 'decrease';

  /** Why this lever was chosen over alternatives */
  readonly reason: string;

  /** Alternatives considered */
  readonly alternativesConsidered: readonly string[];
}

/**
 * What can be explained.
 */
export type ExplainTarget =
  | { readonly type: 'parse'; readonly utterance: string }
  | { readonly type: 'binding'; readonly entityId: string }
  | { readonly type: 'plan'; readonly planId: string }
  | { readonly type: 'step'; readonly stepId: string }
  | { readonly type: 'edit'; readonly packageId: string }
  | { readonly type: 'constraint'; readonly constraintIndex: number }
  | { readonly type: 'lever'; readonly leverName: string };

/**
 * Explanation content.
 */
export interface ExplanationContent {
  /** Title */
  readonly title: string;

  /** Sections of explanation */
  readonly sections: readonly ExplanationSection[];

  /** Links to source spans */
  readonly sourceSpans: readonly TextSpan[];
}

/**
 * A section in an explanation.
 */
export interface ExplanationSection {
  /** Heading */
  readonly heading: string;

  /** Body text */
  readonly body: string;

  /** Subsections (optional) */
  readonly subsections: readonly ExplanationSection[];
}

/**
 * A change summary after application.
 */
export interface ChangeSummary {
  /** One-line summary */
  readonly oneLiner: string;

  /** Detailed lines */
  readonly details: readonly string[];

  /** Number of events affected */
  readonly eventsAffected: number;

  /** Number of parameters changed */
  readonly paramsChanged: number;

  /** Layers touched */
  readonly layersTouched: readonly string[];

  /** Scope description */
  readonly scopeDescription: string;
}

/**
 * Constraint verification summary (post-apply).
 */
export interface ConstraintVerificationSummary {
  /** Constraint description */
  readonly description: string;

  /** Whether it passed */
  readonly passed: boolean;

  /** Violation details (if failed) */
  readonly violation: string | undefined;
}

/**
 * A user edit to a plan parameter.
 */
export interface PlanEdit {
  /** Step ID that was edited */
  readonly stepId: string;

  /** Parameter that was changed */
  readonly param: string;

  /** Original value */
  readonly originalValue: unknown;

  /** New value */
  readonly newValue: unknown;
}

/**
 * Error categories for structured error display.
 */
export type ErrorCategory =
  | 'parse_error'           // Could not parse the utterance
  | 'unresolved_reference'  // A reference could not be bound
  | 'unsatisfied_constraint' // Constraints are contradictory or impossible
  | 'unsafe_plan'           // Plan violates safety policy
  | 'missing_capability'    // Board/deck lacks required capability
  | 'internal_error'        // Unexpected internal failure
  | 'timeout';              // Pipeline exceeded budget

/**
 * All error categories as a const array.
 */
export const ERROR_CATEGORIES: readonly ErrorCategory[] = [
  'parse_error',
  'unresolved_reference',
  'unsatisfied_constraint',
  'unsafe_plan',
  'missing_capability',
  'internal_error',
  'timeout',
] as const;

/**
 * Suggested action for error recovery.
 */
export interface ErrorSuggestion {
  /** Suggestion type */
  readonly type: 'rephrase' | 'simplify' | 'add_context' | 'switch_board' | 'retry';

  /** Human-readable suggestion text */
  readonly text: string;

  /** Suggested rephrasing (if type === 'rephrase') */
  readonly suggestedText: string | undefined;
}

// =============================================================================
// Interaction Loop Controller Interface
// =============================================================================

/**
 * The interaction loop controller manages state transitions and
 * coordinates between the pipeline, UI, and host environment.
 *
 * Implementations should be stateful (hold current InteractionState)
 * and emit events when state changes for UI reactivity.
 */
export interface InteractionLoopController {
  /** Get the current state */
  getState(): InteractionState;

  /** Dispatch an event to drive a state transition */
  dispatch(event: InteractionEvent): InteractionState;

  /** Subscribe to state changes */
  onStateChange(listener: StateChangeListener): UnsubscribeFn;

  /** Get the transition guards */
  getGuards(): TransitionGuards;

  /** Get available actions for the current state */
  getAvailableActions(): readonly InteractionAction[];

  /** Get the full edit history */
  getEditHistory(): readonly EditHistoryEntry[];

  /** Reset the controller to idle */
  reset(): void;
}

/**
 * State change listener callback.
 */
export type StateChangeListener = (
  newState: InteractionState,
  previousState: InteractionState,
  event: InteractionEvent
) => void;

/**
 * Unsubscribe function.
 */
export type UnsubscribeFn = () => void;

// =============================================================================
// Interaction Loop Factory
// =============================================================================

/**
 * Configuration for creating an interaction loop controller.
 */
export interface InteractionLoopConfig {
  /** Initial session ID */
  readonly sessionId: string;

  /** Initial dialogue context */
  readonly initialDialogueContext: DialogueContext;

  /** Pipeline configuration */
  readonly pipelineConfig: PipelineConfig;

  /** Board context */
  readonly boardContext: BoardContext | undefined;

  /** Custom transition guards (or use defaults) */
  readonly guards: TransitionGuards | undefined;
}

/**
 * Create a default (empty) dialogue context.
 */
export function createEmptyDialogueContext(): DialogueContext {
  return {
    salientEntities: [],
    lastFocusedScope: undefined,
    lastEditedLayers: [],
    lastEditPackageId: undefined,
    userPreferences: {},
    undoStack: [],
    redoStack: [],
    uiSelection: undefined,
    boardContext: undefined,
  };
}

/**
 * Create an initial idle state.
 */
export function createInitialState(
  sessionId: string,
  dialogueContext?: DialogueContext
): IdleState {
  const ctx = dialogueContext ?? createEmptyDialogueContext();
  return {
    type: 'idle',
    sessionId,
    turnNumber: 0,
    editHistory: [],
    dialogueContext: ctx,
    availableActions: [
      { type: 'submit_utterance', label: 'Enter instruction' },
    ],
  };
}

/**
 * Generate a unique session ID.
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `gofai-session-${timestamp}-${random}`;
}

// =============================================================================
// Interaction Loop Modes (Board-Derived)
// =============================================================================

/**
 * The interaction mode, derived from board control level.
 *
 * This determines how aggressive the loop is about auto-proceeding.
 */
export type InteractionMode =
  | 'strict'       // Full-manual: always show CPL, always ask, never auto-apply
  | 'standard'     // Collaborative: show CPL, ask when needed, preview before apply
  | 'streamlined'  // Directed: skip CPL view if unambiguous, still require apply
  | 'auto';        // Generative: auto-proceed through unambiguous steps

/**
 * Map board control levels to interaction modes.
 */
export function controlLevelToMode(controlLevel: string): InteractionMode {
  switch (controlLevel) {
    case 'full-manual':
      return 'strict';
    case 'collaborative':
      return 'standard';
    case 'directed':
      return 'streamlined';
    case 'generative':
      return 'auto';
    default:
      return 'standard'; // safe default
  }
}

/**
 * Determine whether CPL view should be shown before planning.
 */
export function shouldShowCpl(mode: InteractionMode, hasHoles: boolean): boolean {
  switch (mode) {
    case 'strict':
      return true; // always show
    case 'standard':
      return true; // always show
    case 'streamlined':
      return hasHoles; // only if ambiguous
    case 'auto':
      return hasHoles; // only if ambiguous
  }
}

/**
 * Determine whether plan should be shown before applying.
 */
export function shouldShowPlan(
  mode: InteractionMode,
  safetyLevel: SafetyAssessment['level']
): boolean {
  switch (mode) {
    case 'strict':
      return true; // always show
    case 'standard':
      return true; // always show
    case 'streamlined':
      return safetyLevel !== 'safe'; // show if not fully safe
    case 'auto':
      return safetyLevel === 'risky' || safetyLevel === 'blocked'; // only if risky
  }
}

/**
 * Determine whether auto-apply should happen.
 */
export function shouldAutoApply(
  mode: InteractionMode,
  safetyLevel: SafetyAssessment['level'],
  boardAllows: boolean
): boolean {
  if (!boardAllows) return false;
  if (safetyLevel === 'blocked' || safetyLevel === 'risky') return false;

  switch (mode) {
    case 'strict':
      return false; // never auto
    case 'standard':
      return false; // never auto
    case 'streamlined':
      return safetyLevel === 'safe'; // only if safe
    case 'auto':
      return safetyLevel === 'safe' || safetyLevel === 'caution'; // safe or caution
  }
}
