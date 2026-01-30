/**
 * @fileoverview Step 292: Plan Negotiation
 * 
 * Implements interactive plan negotiation where users can:
 * - Accept a plan as-is
 * - Request alternative plans
 * - Modify specific levers ("keep it wide but less bright")
 * - Provide feedback that refines the plan
 * 
 * Phase 5, Planning Layer (Steps 251-300)
 * 
 * Core Principles:
 * - Users maintain control over all decisions
 * - System presents options, not mandates
 * - Modifications preserve user intent where possible
 * - All changes are explainable
 * - Negotiation history is tracked for learning
 * 
 * Integration:
 * - Works with plan-generation.ts for alternatives
 * - Works with constraint-satisfaction.ts for validation
 * - Works with user-preference-profiles.ts for learning
 * - Feeds into execution after acceptance
 */

import type { GofaiId } from '../canon/gofai-id';
import type { CPLPlan, Opcode } from './plan-types';
import type { CPLConstraint as Constraint, CPLScope } from '../canon/cpl-types';

// ============================================================================
// Negotiation Types
// ============================================================================

/**
 * User feedback on a presented plan.
 */
export type PlanFeedbackType =
  | 'accept'               // Plan is good, proceed to execution
  | 'reject'               // Plan is wrong, show alternatives
  | 'modify_lever'         // Adjust one lever ("less bright")
  | 'modify_constraint'    // Add/remove constraint
  | 'modify_scope'         // Change what's affected
  | 'request_explanation'  // Why did you choose this?
  | 'request_alternative'  // Show me option B
  | 'cancel';              // Abandon this intent

/**
 * Specific modification request.
 */
export interface PlanModificationRequest {
  readonly type: 'lever' | 'constraint' | 'scope' | 'amount';
  
  /**
   * What to modify (lever name, constraint ID, etc.).
   */
  readonly target: string | GofaiId;
  
  /**
   * How to modify (strengthen, weaken, remove, add, etc.).
   */
  readonly action: 'strengthen' | 'weaken' | 'remove' | 'add' | 'replace';
  
  /**
   * New value if applicable.
   */
  readonly newValue?: number | string | Constraint;
  
  /**
   * Explanation of user's intent.
   */
  readonly rationale?: string;
}

/**
 * User's feedback on a plan.
 */
export interface PlanFeedback {
  readonly feedbackType: PlanFeedbackType;
  readonly planId: GofaiId;
  readonly timestamp: string;
  
  /**
   * Specific modifications requested.
   */
  readonly modifications?: readonly PlanModificationRequest[];
  
  /**
   * Free-form natural language feedback.
   */
  readonly naturalLanguageFeedback?: string;
  
  /**
   * Which alternative to show (if requesting alternative).
   */
  readonly alternativeIndex?: number;
}

/**
 * Negotiation state: tracks the conversation about a plan.
 */
export interface NegotiationState {
  readonly intentId: GofaiId;
  readonly sessionId: string;
  
  /**
   * The original plan presented to the user.
   */
  readonly originalPlan: CPLPlan;
  
  /**
   * All plans considered (original + alternatives).
   */
  readonly candidatePlans: readonly CPLPlan[];
  
  /**
   * Currently shown plan.
   */
  readonly currentPlan: CPLPlan;
  
  /**
   * History of user feedback.
   */
  readonly feedbackHistory: readonly PlanFeedback[];
  
  /**
   * Number of negotiation turns.
   */
  readonly turnCount: number;
  
  /**
   * Whether negotiation is complete.
   */
  readonly isComplete: boolean;
  
  /**
   * Final accepted plan (if complete).
   */
  readonly acceptedPlan?: CPLPlan;
  
  /**
   * Metadata for learning.
   */
  readonly metadata: {
    readonly startTime: string;
    readonly endTime?: string;
    readonly userSatisfaction?: 'satisfied' | 'neutral' | 'frustrated';
  };
}

/**
 * Result of processing user feedback.
 */
export interface NegotiationResult {
  readonly newState: NegotiationState;
  
  /**
   * Updated plan to show user (if applicable).
   */
  readonly updatedPlan?: CPLPlan;
  
  /**
   * System message explaining the change.
   */
  readonly systemMessage: string;
  
  /**
   * Whether negotiation is complete.
   */
  readonly isComplete: boolean;
  
  /**
   * Final plan to execute (if complete).
   */
  readonly planToExecute?: CPLPlan;
  
  /**
   * Whether validation succeeded.
   */
  readonly validationPassed: boolean;
  
  /**
   * Validation errors (if any).
   */
  readonly validationErrors?: readonly string[];
}

// ============================================================================
// Negotiation Engine
// ============================================================================

/**
 * Initialize negotiation with a plan.
 */
export function initializeNegotiation(
  intentId: GofaiId,
  sessionId: string,
  plan: CPLPlan,
  alternatives: readonly CPLPlan[]
): NegotiationState {
  return {
    intentId,
    sessionId,
    originalPlan: plan,
    candidatePlans: [plan, ...alternatives],
    currentPlan: plan,
    feedbackHistory: [],
    turnCount: 0,
    isComplete: false,
    metadata: {
      startTime: new Date().toISOString(),
    },
  };
}

/**
 * Process user feedback and update negotiation state.
 */
export function processNegotiationFeedback(
  state: NegotiationState,
  feedback: PlanFeedback
): NegotiationResult {
  const newFeedbackHistory = [...state.feedbackHistory, feedback];
  const newTurnCount = state.turnCount + 1;
  
  switch (feedback.feedbackType) {
    case 'accept':
      return handleAccept(state, newFeedbackHistory, newTurnCount);
    
    case 'reject':
      return handleReject(state, newFeedbackHistory, newTurnCount);
    
    case 'modify_lever':
      return handleModifyLever(state, feedback, newFeedbackHistory, newTurnCount);
    
    case 'modify_constraint':
      return handleModifyConstraint(state, feedback, newFeedbackHistory, newTurnCount);
    
    case 'modify_scope':
      return handleModifyScope(state, feedback, newFeedbackHistory, newTurnCount);
    
    case 'request_explanation':
      return handleRequestExplanation(state, feedback, newFeedbackHistory, newTurnCount);
    
    case 'request_alternative':
      return handleRequestAlternative(state, feedback, newFeedbackHistory, newTurnCount);
    
    case 'cancel':
      return handleCancel(state, newFeedbackHistory, newTurnCount);
    
    default:
      return {
        newState: { ...state, feedbackHistory: newFeedbackHistory, turnCount: newTurnCount },
        systemMessage: 'Feedback type not recognized',
        isComplete: false,
        validationPassed: false,
      };
  }
}

// ============================================================================
// Feedback Handlers
// ============================================================================

/**
 * Handle plan acceptance.
 */
function handleAccept(
  state: NegotiationState,
  feedbackHistory: readonly PlanFeedback[],
  turnCount: number
): NegotiationResult {
  const newState: NegotiationState = {
    ...state,
    feedbackHistory,
    turnCount,
    isComplete: true,
    acceptedPlan: state.currentPlan,
    metadata: {
      ...state.metadata,
      endTime: new Date().toISOString(),
      userSatisfaction: 'satisfied',
    },
  };
  
  return {
    newState,
    systemMessage: 'Plan accepted. Ready to apply changes.',
    isComplete: true,
    planToExecute: state.currentPlan,
    validationPassed: true,
  };
}

/**
 * Handle plan rejection - show next alternative.
 */
function handleReject(
  state: NegotiationState,
  feedbackHistory: readonly PlanFeedback[],
  turnCount: number
): NegotiationResult {
  // Find next unshown alternative
  const shownPlanIds = new Set([
    state.originalPlan.id,
    ...feedbackHistory
      .filter(f => f.feedbackType === 'request_alternative' || f.feedbackType === 'reject')
      .map(f => f.planId),
  ]);
  
  const nextPlan = state.candidatePlans.find(p => !shownPlanIds.has(p.id));
  
  if (!nextPlan) {
    // No more alternatives
    const newState: NegotiationState = {
      ...state,
      feedbackHistory,
      turnCount,
      isComplete: true,
      metadata: {
        ...state.metadata,
        endTime: new Date().toISOString(),
        userSatisfaction: 'frustrated',
      },
    };
    
    return {
      newState,
      systemMessage: 'No more alternative plans available. Would you like to refine the current plan or cancel?',
      isComplete: false,
      validationPassed: false,
      validationErrors: ['No satisfying plan found'],
    };
  }
  
  const newState: NegotiationState = {
    ...state,
    currentPlan: nextPlan,
    feedbackHistory,
    turnCount,
  };
  
  return {
    newState,
    updatedPlan: nextPlan,
    systemMessage: `Showing alternative plan (${getAlternativeIndex(state, nextPlan)} of ${state.candidatePlans.length})`,
    isComplete: false,
    validationPassed: true,
  };
}

/**
 * Handle lever modification request.
 */
function handleModifyLever(
  state: NegotiationState,
  feedback: PlanFeedback,
  feedbackHistory: readonly PlanFeedback[],
  turnCount: number
): NegotiationResult {
  if (!feedback.modifications || feedback.modifications.length === 0) {
    return {
      newState: { ...state, feedbackHistory, turnCount },
      systemMessage: 'No modifications specified',
      isComplete: false,
      validationPassed: false,
    };
  }
  
  const mod = feedback.modifications[0]; // Handle first modification
  
  if (!mod) {
    return {
      newState: { ...state, feedbackHistory, turnCount },
      systemMessage: 'Invalid modification',
      isComplete: false,
      validationPassed: false,
    };
  }
  
  // Clone and modify plan
  const modifiedPlan = applyLeverModification(state.currentPlan, mod);
  
  if (!modifiedPlan) {
    return {
      newState: { ...state, feedbackHistory, turnCount },
      systemMessage: `Unable to modify lever: ${mod.target}`,
      isComplete: false,
      validationPassed: false,
    };
  }
  
  // Validate modified plan
  const validation = validateModifiedPlan(modifiedPlan);
  
  const newState: NegotiationState = {
    ...state,
    currentPlan: modifiedPlan,
    candidatePlans: [...state.candidatePlans, modifiedPlan],
    feedbackHistory,
    turnCount,
  };
  
  if (validation.passed) {
    return {
      newState,
      updatedPlan: modifiedPlan,
      systemMessage: `Updated plan: ${describeLeverModification(mod)}`,
      isComplete: false,
      validationPassed: true,
    };
  } else {
    return {
      newState,
      updatedPlan: modifiedPlan,
      systemMessage: `Modified plan has constraint violations: ${validation.errors.join(', ')}`,
      isComplete: false,
      validationPassed: false,
      validationErrors: validation.errors,
    };
  }
}

/**
 * Handle constraint modification request.
 */
function handleModifyConstraint(
  state: NegotiationState,
  feedback: PlanFeedback,
  feedbackHistory: readonly PlanFeedback[],
  turnCount: number
): NegotiationResult {
  if (!feedback.modifications || feedback.modifications.length === 0) {
    return {
      newState: { ...state, feedbackHistory, turnCount },
      systemMessage: 'No constraint modifications specified',
      isComplete: false,
      validationPassed: false,
    };
  }
  
  const mod = feedback.modifications[0];
  
  if (!mod) {
    return {
      newState: { ...state, feedbackHistory, turnCount },
      systemMessage: 'Invalid modification',
      isComplete: false,
      validationPassed: false,
    };
  }
  
  // Apply constraint modification
  const modifiedPlan = applyConstraintModification(state.currentPlan, mod);
  
  if (!modifiedPlan) {
    return {
      newState: { ...state, feedbackHistory, turnCount },
      systemMessage: `Unable to modify constraint: ${mod.target}`,
      isComplete: false,
      validationPassed: false,
    };
  }
  
  const newState: NegotiationState = {
    ...state,
    currentPlan: modifiedPlan,
    candidatePlans: [...state.candidatePlans, modifiedPlan],
    feedbackHistory,
    turnCount,
  };
  
  return {
    newState,
    updatedPlan: modifiedPlan,
    systemMessage: `Updated constraints: ${describeConstraintModification(mod)}`,
    isComplete: false,
    validationPassed: true,
  };
}

/**
 * Handle scope modification request.
 */
function handleModifyScope(
  state: NegotiationState,
  feedback: PlanFeedback,
  feedbackHistory: readonly PlanFeedback[],
  turnCount: number
): NegotiationResult {
  if (!feedback.modifications || feedback.modifications.length === 0) {
    return {
      newState: { ...state, feedbackHistory, turnCount },
      systemMessage: 'No scope modifications specified',
      isComplete: false,
      validationPassed: false,
    };
  }
  
  const mod = feedback.modifications[0];
  
  if (!mod) {
    return {
      newState: { ...state, feedbackHistory, turnCount },
      systemMessage: 'Invalid modification',
      isComplete: false,
      validationPassed: false,
    };
  }
  
  // Apply scope modification
  const modifiedPlan = applyScopeModification(state.currentPlan, mod);
  
  if (!modifiedPlan) {
    return {
      newState: { ...state, feedbackHistory, turnCount },
      systemMessage: `Unable to modify scope: ${mod.target}`,
      isComplete: false,
      validationPassed: false,
    };
  }
  
  const newState: NegotiationState = {
    ...state,
    currentPlan: modifiedPlan,
    candidatePlans: [...state.candidatePlans, modifiedPlan],
    feedbackHistory,
    turnCount,
  };
  
  return {
    newState,
    updatedPlan: modifiedPlan,
    systemMessage: `Updated scope: ${describeScopeModification(mod)}`,
    isComplete: false,
    validationPassed: true,
  };
}

/**
 * Handle explanation request.
 */
function handleRequestExplanation(
  state: NegotiationState,
  _feedback: PlanFeedback,
  feedbackHistory: readonly PlanFeedback[],
  turnCount: number
): NegotiationResult {
  const explanation = generatePlanExplanation(state.currentPlan);
  
  const newState: NegotiationState = {
    ...state,
    feedbackHistory,
    turnCount,
  };
  
  return {
    newState,
    systemMessage: explanation,
    isComplete: false,
    validationPassed: true,
  };
}

/**
 * Handle alternative request.
 */
function handleRequestAlternative(
  state: NegotiationState,
  feedback: PlanFeedback,
  feedbackHistory: readonly PlanFeedback[],
  turnCount: number
): NegotiationResult {
  const requestedIndex = feedback.alternativeIndex ?? getNextAlternativeIndex(state);
  
  if (requestedIndex >= state.candidatePlans.length) {
    return {
      newState: { ...state, feedbackHistory, turnCount },
      systemMessage: 'No more alternatives available',
      isComplete: false,
      validationPassed: false,
    };
  }
  
  const altPlan = state.candidatePlans[requestedIndex];
  
  if (!altPlan) {
    return {
      newState: { ...state, feedbackHistory, turnCount },
      systemMessage: 'Invalid alternative index',
      isComplete: false,
      validationPassed: false,
    };
  }
  
  const newState: NegotiationState = {
    ...state,
    currentPlan: altPlan,
    feedbackHistory,
    turnCount,
  };
  
  return {
    newState,
    updatedPlan: altPlan,
    systemMessage: `Showing alternative ${requestedIndex + 1} of ${state.candidatePlans.length}`,
    isComplete: false,
    validationPassed: true,
  };
}

/**
 * Handle cancellation.
 */
function handleCancel(
  state: NegotiationState,
  feedbackHistory: readonly PlanFeedback[],
  turnCount: number
): NegotiationResult {
  const newState: NegotiationState = {
    ...state,
    feedbackHistory,
    turnCount,
    isComplete: true,
    metadata: {
      ...state.metadata,
      endTime: new Date().toISOString(),
      userSatisfaction: 'neutral',
    },
  };
  
  return {
    newState,
    systemMessage: 'Plan negotiation cancelled',
    isComplete: true,
    validationPassed: false,
  };
}

// ============================================================================
// Plan Modification Helpers
// ============================================================================

/**
 * Apply a lever modification to a plan.
 */
function applyLeverModification(
  plan: CPLPlan,
  mod: PlanModificationRequest
): CPLPlan | null {
  // Find opcodes that use this lever
  const modifiedOpcodes: Opcode[] = [];
  let modified = false;
  
  for (const opcode of plan.opcodes) {
    // Check if this opcode is associated with the lever (via metadata or params)
    const opcodeMetadata = (opcode as any).metadata;
    if (opcodeMetadata?.lever === mod.target) {
      // Modify this opcode
      const opcodeParams = opcode.params as any;
      let newAmount = opcodeParams.amount ?? 0.5;
      
      switch (mod.action) {
        case 'strengthen':
          newAmount = Math.min(1.0, newAmount * 1.5);
          modified = true;
          break;
        case 'weaken':
          newAmount = Math.max(0.1, newAmount * 0.6);
          modified = true;
          break;
        case 'remove':
          // Skip this opcode
          continue;
        case 'replace':
          if (typeof mod.newValue === 'number') {
            newAmount = mod.newValue;
            modified = true;
          }
          break;
      }
      
      modifiedOpcodes.push({
        ...opcode,
        params: {
          ...opcode.params,
          amount: newAmount,
        },
      } as Opcode);
    } else {
      modifiedOpcodes.push(opcode);
    }
  }
  
  if (!modified) {
    return null; // No matching lever found
  }
  
  // Create new plan
  return {
    ...plan,
    id: `${plan.id}:modified:${Date.now()}`,
    opcodes: modifiedOpcodes,
  };
}

/**
 * Apply a constraint modification to a plan.
 */
function applyConstraintModification(
  plan: CPLPlan,
  mod: PlanModificationRequest
): CPLPlan | null {
  const newConstraints = [...plan.constraints];
  
  switch (mod.action) {
    case 'add':
      if (mod.newValue && typeof mod.newValue !== 'string' && typeof mod.newValue !== 'number') {
        newConstraints.push(mod.newValue as Constraint);
      } else {
        return null;
      }
      break;
    
    case 'remove':
      const index = newConstraints.findIndex(c => c.id === mod.target);
      if (index >= 0) {
        newConstraints.splice(index, 1);
      } else {
        return null;
      }
      break;
    
    default:
      return null;
  }
  
  return {
    ...plan,
    id: `${plan.id}:modified:${Date.now()}`,
    constraints: newConstraints,
  };
}

/**
 * Apply a scope modification to a plan.
 */
function applyScopeModification(
  plan: CPLPlan,
  _mod: PlanModificationRequest
): CPLPlan | null {
  // Modify scope in plan
  const modifiedScope: CPLScope = {
    ...plan.scope,
    // Apply scope modification logic here
    // This would depend on the specific scope modification
  };
  
  return {
    ...plan,
    id: `${plan.id}:modified:${Date.now()}`,
    scope: modifiedScope,
  };
}

// ============================================================================
// Validation
// ============================================================================

interface ValidationResult {
  passed: boolean;
  errors: string[];
}

/**
 * Validate a modified plan.
 */
function validateModifiedPlan(plan: CPLPlan): ValidationResult {
  const errors: string[] = [];
  
  // Check constraints are satisfiable
  for (const constraint of plan.constraints) {
    // Placeholder - integrate with constraint-satisfaction.ts
    const satisfiable = true; // checkConstraintSatisfiable(constraint, plan);
    if (!satisfiable) {
      errors.push(`Constraint unsatisfiable: ${constraint.id}`);
    }
  }
  
  // Check opcodes are valid
  for (const opcode of plan.opcodes) {
    const opcodeParams = opcode.params as any;
    if (opcodeParams.amount !== undefined && (opcodeParams.amount < 0 || opcodeParams.amount > 1)) {
      errors.push(`Invalid amount for opcode ${opcode.id}: ${opcodeParams.amount}`);
    }
  }
  
  return {
    passed: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Description Helpers
// ============================================================================

/**
 * Describe a lever modification in natural language.
 */
function describeLeverModification(mod: PlanModificationRequest): string {
  const leverName = String(mod.target);
  
  switch (mod.action) {
    case 'strengthen':
      return `Increased ${leverName} effect`;
    case 'weaken':
      return `Decreased ${leverName} effect`;
    case 'remove':
      return `Removed ${leverName} adjustment`;
    case 'replace':
      return `Set ${leverName} to ${mod.newValue}`;
    default:
      return `Modified ${leverName}`;
  }
}

/**
 * Describe a constraint modification in natural language.
 */
function describeConstraintModification(mod: PlanModificationRequest): string {
  switch (mod.action) {
    case 'add':
      return `Added constraint: ${mod.target}`;
    case 'remove':
      return `Removed constraint: ${mod.target}`;
    default:
      return `Modified constraint: ${mod.target}`;
  }
}

/**
 * Describe a scope modification in natural language.
 */
function describeScopeModification(mod: PlanModificationRequest): string {
  return `Changed scope to: ${mod.target}`;
}

/**
 * Generate explanation for a plan.
 */
function generatePlanExplanation(plan: CPLPlan): string {
  const parts: string[] = [];
  
  parts.push(`This plan will make ${plan.opcodes.length} changes:`);
  
  for (const opcode of plan.opcodes.slice(0, 3)) {
    parts.push(`- ${opcode.description ?? opcode.name}`);
  }
  
  if (plan.opcodes.length > 3) {
    parts.push(`...and ${plan.opcodes.length - 3} more`);
  }
  
  if (plan.constraints.length > 0) {
    parts.push(`\nWhile preserving: ${plan.constraints.map(c => c.type).join(', ')}`);
  }
  
  return parts.join('\n');
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the index of an alternative plan.
 */
function getAlternativeIndex(state: NegotiationState, plan: CPLPlan): number {
  return state.candidatePlans.findIndex(p => p.id === plan.id) + 1;
}

/**
 * Get the next unseen alternative index.
 */
function getNextAlternativeIndex(state: NegotiationState): number {
  const shownPlanIds = new Set([
    state.currentPlan.id,
    ...state.feedbackHistory
      .filter(f => f.feedbackType === 'request_alternative' || f.feedbackType === 'reject')
      .map(f => f.planId),
  ]);
  
  for (let i = 0; i < state.candidatePlans.length; i++) {
    const plan = state.candidatePlans[i];
    if (plan && !shownPlanIds.has(plan.id)) {
      return i;
    }
  }
  
  return state.candidatePlans.length; // No more alternatives
}

// ============================================================================
// Negotiation History Analysis
// ============================================================================

/**
 * Analyze negotiation patterns for learning.
 */
export interface NegotiationAnalysis {
  readonly avgTurnsToAcceptance: number;
  readonly mostCommonModifications: readonly string[];
  readonly frequentlyRejectedLevers: readonly string[];
  readonly preferredConstraints: readonly GofaiId[];
}

/**
 * Analyze negotiation history to learn user preferences.
 */
export function analyzeNegotiationHistory(
  sessions: readonly NegotiationState[]
): NegotiationAnalysis {
  const acceptedSessions = sessions.filter(s => s.isComplete && s.acceptedPlan);
  
  // Average turns to acceptance
  const avgTurns = acceptedSessions.length > 0
    ? acceptedSessions.reduce((sum, s) => sum + s.turnCount, 0) / acceptedSessions.length
    : 0;
  
  // Count modification types
  const modCounts = new Map<string, number>();
  const rejectedLevers = new Map<string, number>();
  const constraintCounts = new Map<GofaiId, number>();
  
  for (const session of sessions) {
    for (const feedback of session.feedbackHistory) {
      if (feedback.modifications) {
        for (const mod of feedback.modifications) {
          const key = `${mod.type}:${mod.action}`;
          modCounts.set(key, (modCounts.get(key) ?? 0) + 1);
          
          if (mod.type === 'lever' && mod.action === 'remove') {
            rejectedLevers.set(String(mod.target), (rejectedLevers.get(String(mod.target)) ?? 0) + 1);
          }
        }
      }
    }
    
    const acceptedPlan = session.acceptedPlan;
    if (acceptedPlan) {
      for (const constraint of acceptedPlan.constraints) {
        const constraintId = typeof constraint === 'object' && 'id' in constraint ? (constraint as any).id as GofaiId : constraint as GofaiId;
        constraintCounts.set(constraintId, (constraintCounts.get(constraintId) ?? 0) + 1);
      }
    }
  }
  
  // Sort and get top items
  const topMods = Array.from(modCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => key);
  
  const topRejected = Array.from(rejectedLevers.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => key);
  
  const topConstraints = Array.from(constraintCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => key);
  
  return {
    avgTurnsToAcceptance: avgTurns,
    mostCommonModifications: topMods,
    frequentlyRejectedLevers: topRejected,
    preferredConstraints: topConstraints,
  };
}

// ============================================================================
// Quick Feedback Shortcuts
// ============================================================================

/**
 * Create feedback for common actions.
 */
export const QuickFeedback = {
  accept: (planId: GofaiId): PlanFeedback => ({
    feedbackType: 'accept',
    planId,
    timestamp: new Date().toISOString(),
  }),
  
  reject: (planId: GofaiId): PlanFeedback => ({
    feedbackType: 'reject',
    planId,
    timestamp: new Date().toISOString(),
  }),
  
  nextAlternative: (planId: GofaiId): PlanFeedback => ({
    feedbackType: 'request_alternative',
    planId,
    timestamp: new Date().toISOString(),
  }),
  
  explainPlan: (planId: GofaiId): PlanFeedback => ({
    feedbackType: 'request_explanation',
    planId,
    timestamp: new Date().toISOString(),
  }),
  
  strengthenLever: (planId: GofaiId, leverName: string): PlanFeedback => ({
    feedbackType: 'modify_lever',
    planId,
    timestamp: new Date().toISOString(),
    modifications: [{
      type: 'lever',
      target: leverName,
      action: 'strengthen',
    }],
  }),
  
  weakenLever: (planId: GofaiId, leverName: string): PlanFeedback => ({
    feedbackType: 'modify_lever',
    planId,
    timestamp: new Date().toISOString(),
    modifications: [{
      type: 'lever',
      target: leverName,
      action: 'weaken',
    }],
  }),
  
  removeLever: (planId: GofaiId, leverName: string): PlanFeedback => ({
    feedbackType: 'modify_lever',
    planId,
    timestamp: new Date().toISOString(),
    modifications: [{
      type: 'lever',
      target: leverName,
      action: 'remove',
    }],
  }),
  
  addConstraint: (planId: GofaiId, constraint: Constraint): PlanFeedback => ({
    feedbackType: 'modify_constraint',
    planId,
    timestamp: new Date().toISOString(),
    modifications: [{
      type: 'constraint',
      target: constraint.id,
      action: 'add',
      newValue: constraint,
    }],
  }),
  
  removeConstraint: (planId: GofaiId, constraintId: GofaiId): PlanFeedback => ({
    feedbackType: 'modify_constraint',
    planId,
    timestamp: new Date().toISOString(),
    modifications: [{
      type: 'constraint',
      target: constraintId,
      action: 'remove',
    }],
  }),
  
  cancel: (planId: GofaiId): PlanFeedback => ({
    feedbackType: 'cancel',
    planId,
    timestamp: new Date().toISOString(),
  }),
};
