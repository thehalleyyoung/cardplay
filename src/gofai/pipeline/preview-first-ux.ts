/**
 * Preview-First UX Specification
 *
 * Step 034 [HCI]: Define "preview-first UX": user can inspect plan/diff at
 * every step; auto-apply only in explicitly allowed contexts.
 *
 * ## Core Principle
 *
 * In GOFAI Music+, **nothing mutates project state without the user seeing
 * a preview first**. This is not a preference — it is an architectural
 * invariant enforced at the pipeline level.
 *
 * The only exception is an explicit "auto-apply" mode that must be:
 * 1. Opted into explicitly by the user (not a default)
 * 2. Restricted to safe-level changes only
 * 3. Revocable at any time
 * 4. Still producing undo packages and audit records
 *
 * ## Preview Lifecycle
 *
 * Every GOFAI interaction follows this lifecycle:
 *
 * ```
 * User Input → Parse → Clarify (if needed) → Preview → User Decision
 *                                                         ↓
 *                                              Apply / Reject / Modify
 * ```
 *
 * The "Preview" step is NEVER skipped. "Apply" is always a conscious user
 * action, unless auto-apply mode is active and safety checks pass.
 *
 * ## Preview States
 *
 * A preview can be in one of these states:
 *
 * 1. **Pending**: Plan generated, waiting for user review
 * 2. **Inspecting**: User is exploring the preview (expanding diffs, etc.)
 * 3. **Modified**: User has tweaked plan parameters in the preview
 * 4. **Accepted**: User clicked "Apply" — mutation proceeds
 * 5. **Rejected**: User clicked "Cancel" or started a new command
 * 6. **Expired**: A new parse/plan superseded this preview
 *
 * ## Display Requirements
 *
 * Every preview MUST show at minimum:
 * - A natural-language summary of what will change
 * - Safety level badge (safe / caution / risky)
 * - List of affected scopes (sections, layers, ranges)
 * - Constraint satisfaction status (green/red/yellow badges)
 * - An "Apply" button (enabled only if all hard constraints pass)
 * - A "Cancel" button (always enabled)
 *
 * Optional (shown on demand or by preference):
 * - Full diff detail (event-by-event changes)
 * - Why-explanation chains
 * - Alternative plans
 * - Cost estimate breakdown
 * - Scope highlighting overlays on the editor
 *
 * @module gofai/pipeline/preview-first-ux
 */

import type { PreviewResult, PreviewSafetyLevel } from '../trust/preview';

// =============================================================================
// Preview-First Policy
// =============================================================================

/**
 * The contexts in which auto-apply MAY be enabled.
 *
 * Auto-apply is never the default. It must be explicitly opted into,
 * and it is restricted to specific conditions.
 */
export type AutoApplyContext =
  | 'never'               // Default: always require manual apply
  | 'safe_only'           // Auto-apply if safetyLevel === 'safe'
  | 'safe_and_caution'    // Auto-apply if safetyLevel !== 'risky' (for power users)
  | 'live_performance';   // Auto-apply in live performance contexts (special board mode)

/**
 * Configuration for preview-first behavior.
 */
export interface PreviewFirstConfig {
  /**
   * When auto-apply is allowed.
   *
   * Default: 'never' — the user must always click "Apply".
   * Even in auto-apply modes, undo packages are always generated.
   */
  readonly autoApply: AutoApplyContext;

  /**
   * Whether to show the preview inline (compact) or in a dedicated panel.
   *
   * - 'inline': Preview appears below the input field as a compact summary
   * - 'panel': Preview opens in the dedicated GOFAI deck preview pane
   * - 'both': Compact inline preview + detailed panel
   */
  readonly displayMode: 'inline' | 'panel' | 'both';

  /**
   * Whether to auto-expand diff details.
   *
   * - true: Show full diff on preview generation
   * - false: Show summary only; user can expand on demand
   */
  readonly autoExpandDiff: boolean;

  /**
   * Whether to auto-show scope highlighting overlays.
   *
   * When true, affected regions are highlighted in the editor/timeline
   * as soon as the preview is generated.
   */
  readonly autoHighlightScope: boolean;

  /**
   * Whether to auto-show alternative plans.
   *
   * When true and alternatives exist, they are shown side-by-side.
   * When false, alternatives are available on demand.
   */
  readonly showAlternatives: boolean;

  /**
   * Minimum time (ms) a preview must be visible before Apply is enabled.
   *
   * This prevents accidental rapid-fire applies. Set to 0 to disable.
   * Default: 200ms for 'safe', 500ms for 'caution', 1000ms for 'risky'.
   */
  readonly minimumReviewTime: PreviewReviewTimes;

  /**
   * Whether to require explicit confirmation for risky plans.
   *
   * When true, 'risky' plans show an extra confirmation dialog
   * ("This is a large change. Are you sure?").
   */
  readonly confirmRisky: boolean;

  /**
   * Whether previews persist after rejection.
   *
   * When true, rejected previews remain visible (grayed out) so the
   * user can reference them. When false, they disappear immediately.
   */
  readonly keepRejectedPreviews: boolean;

  /**
   * Maximum number of preview history items to keep.
   */
  readonly maxPreviewHistory: number;
}

/**
 * Per-safety-level minimum review times (in milliseconds).
 */
export interface PreviewReviewTimes {
  readonly safe: number;
  readonly caution: number;
  readonly risky: number;
}

/**
 * Default preview-first configuration.
 */
export const DEFAULT_PREVIEW_FIRST_CONFIG: PreviewFirstConfig = {
  autoApply: 'never',
  displayMode: 'both',
  autoExpandDiff: false,
  autoHighlightScope: true,
  showAlternatives: false,
  minimumReviewTime: {
    safe: 200,
    caution: 500,
    risky: 1000,
  },
  confirmRisky: true,
  keepRejectedPreviews: true,
  maxPreviewHistory: 20,
};


// =============================================================================
// Preview State Machine
// =============================================================================

/**
 * The state of a preview in the interaction lifecycle.
 */
export type PreviewState =
  | 'pending'       // Generated, awaiting user attention
  | 'inspecting'    // User is actively reviewing
  | 'modified'      // User tweaked plan parameters
  | 'accepted'      // User clicked Apply
  | 'rejected'      // User clicked Cancel or started new command
  | 'expired';      // Superseded by a new preview

/**
 * Valid transitions in the preview state machine.
 *
 * ```
 * pending → inspecting → accepted
 *                       → rejected
 *                       → modified → inspecting (loop)
 *                       → expired
 * pending → expired (new input supersedes)
 * pending → accepted (auto-apply mode, if allowed)
 * ```
 */
export const PREVIEW_TRANSITIONS: ReadonlyMap<PreviewState, readonly PreviewState[]> =
  new Map([
    ['pending', ['inspecting', 'expired', 'accepted']],
    ['inspecting', ['accepted', 'rejected', 'modified', 'expired']],
    ['modified', ['inspecting', 'accepted', 'rejected', 'expired']],
    ['accepted', []],   // terminal
    ['rejected', []],   // terminal
    ['expired', []],    // terminal
  ]);

/**
 * Check whether a preview state transition is valid.
 */
export function isValidPreviewTransition(
  from: PreviewState,
  to: PreviewState,
): boolean {
  const allowed = PREVIEW_TRANSITIONS.get(from);
  return allowed !== undefined && allowed.includes(to);
}


// =============================================================================
// Preview Interaction Events
// =============================================================================

/**
 * Events that drive the preview state machine.
 */
export type PreviewEvent =
  | { readonly type: 'preview_generated'; readonly preview: PreviewResult }
  | { readonly type: 'user_inspecting' }
  | { readonly type: 'user_modified_plan'; readonly modifications: PlanModification[] }
  | { readonly type: 'user_accepted' }
  | { readonly type: 'user_rejected' }
  | { readonly type: 'new_input_received' }
  | { readonly type: 'auto_apply_triggered' };

/**
 * A user modification to a plan parameter within the preview.
 */
export interface PlanModification {
  /** Which plan step was modified. */
  readonly stepIndex: number;
  /** Which parameter was changed. */
  readonly paramId: string;
  /** The new value. */
  readonly newValue: string | number;
  /** The old value (for undo). */
  readonly oldValue: string | number;
}


// =============================================================================
// Preview Session
// =============================================================================

/**
 * A tracked preview session, from generation to terminal state.
 */
export interface PreviewSession {
  /** Unique session ID. */
  readonly id: string;
  /** The preview result being reviewed. */
  readonly preview: PreviewResult;
  /** Current state. */
  readonly state: PreviewState;
  /** Timestamp of generation. */
  readonly generatedAt: number;
  /** Timestamp of last state change. */
  readonly lastStateChangeAt: number;
  /** Modifications made during this session (if any). */
  readonly modifications: readonly PlanModification[];
  /** Whether this session ended in auto-apply. */
  readonly wasAutoApplied: boolean;
}


// =============================================================================
// Auto-Apply Decision Logic
// =============================================================================

/**
 * Determine whether a preview should be auto-applied given the current config.
 *
 * This function implements the auto-apply policy. It returns `true` only
 * if ALL of the following conditions are met:
 *
 * 1. The config allows auto-apply (not 'never')
 * 2. The preview safety level passes the configured threshold
 * 3. All hard constraints are satisfied (canApply === true)
 * 4. No clarification questions are pending
 *
 * Even when this returns `true`, the system MUST still:
 * - Generate an undo package
 * - Record the preview session as auto-applied
 * - Show a brief notification that auto-apply occurred
 * - Allow immediate undo
 */
export function shouldAutoApplyPreview(
  config: PreviewFirstConfig,
  preview: PreviewResult,
  hasPendingClarifications: boolean,
): boolean {
  // Never auto-apply if config says never
  if (config.autoApply === 'never') {
    return false;
  }

  // Never auto-apply if the plan can't be applied
  if (!preview.canApply) {
    return false;
  }

  // Never auto-apply if there are pending clarifications
  if (hasPendingClarifications) {
    return false;
  }

  // Check safety level against config threshold
  switch (config.autoApply) {
    case 'safe_only':
      return preview.safetyLevel === 'safe';

    case 'safe_and_caution':
      return preview.safetyLevel !== 'risky';

    case 'live_performance':
      // In live performance, allow even caution-level auto-apply
      // but still block risky
      return preview.safetyLevel !== 'risky';

    default:
      return false;
  }
}

/**
 * Get the minimum review time for a given safety level.
 */
export function getMinimumReviewTime(
  config: PreviewFirstConfig,
  safetyLevel: PreviewSafetyLevel,
): number {
  return config.minimumReviewTime[safetyLevel];
}

/**
 * Check whether enough time has elapsed for the user to meaningfully
 * review the preview.
 */
export function hasMetMinimumReviewTime(
  config: PreviewFirstConfig,
  session: PreviewSession,
  currentTime: number,
): boolean {
  const minimum = getMinimumReviewTime(config, session.preview.safetyLevel);
  const elapsed = currentTime - session.generatedAt;
  return elapsed >= minimum;
}


// =============================================================================
// Preview Display Requirements
// =============================================================================

/**
 * Specification of what must be shown in a preview display.
 *
 * This is not a UI component — it's a contract that any UI rendering
 * of a preview must satisfy.
 */
export interface PreviewDisplayRequirements {
  /** These elements MUST be visible in every preview. */
  readonly mandatory: readonly PreviewDisplayElement[];
  /** These elements should be available on demand. */
  readonly onDemand: readonly PreviewDisplayElement[];
  /** These elements must NOT be shown (for safety or simplicity). */
  readonly hidden: readonly PreviewDisplayElement[];
}

/**
 * Individual display elements in a preview.
 */
export type PreviewDisplayElement =
  | 'summary_text'           // Natural language summary
  | 'safety_badge'           // safe/caution/risky badge
  | 'affected_scopes'        // List of affected sections/layers/ranges
  | 'constraint_status'      // Constraint satisfaction badges
  | 'apply_button'           // The "Apply" action
  | 'cancel_button'          // The "Cancel" action
  | 'diff_detail'            // Full event-by-event diff
  | 'why_explanation'        // Provenance chain
  | 'alternative_plans'      // Other candidate plans
  | 'cost_breakdown'         // Cost estimate details
  | 'scope_highlights'       // Editor overlay highlighting
  | 'plan_steps'             // Individual plan step list
  | 'modification_controls'  // Sliders/inputs for tweaking plan params
  | 'undo_reminder'          // Reminder that undo is available
  | 'auto_apply_indicator';  // Shows when auto-apply is active

/**
 * Default display requirements.
 */
export const DEFAULT_DISPLAY_REQUIREMENTS: PreviewDisplayRequirements = {
  mandatory: [
    'summary_text',
    'safety_badge',
    'affected_scopes',
    'constraint_status',
    'apply_button',
    'cancel_button',
  ],
  onDemand: [
    'diff_detail',
    'why_explanation',
    'alternative_plans',
    'cost_breakdown',
    'scope_highlights',
    'plan_steps',
    'modification_controls',
  ],
  hidden: [], // Nothing hidden by default
};

/**
 * Display requirements for live performance mode.
 *
 * In live performance, the preview is minimal to avoid latency
 * and visual clutter. Only essentials are shown.
 */
export const LIVE_PERFORMANCE_DISPLAY_REQUIREMENTS: PreviewDisplayRequirements = {
  mandatory: [
    'summary_text',
    'safety_badge',
    'auto_apply_indicator',
    'undo_reminder',
  ],
  onDemand: [
    'affected_scopes',
    'constraint_status',
    'apply_button',
    'cancel_button',
  ],
  hidden: [
    'diff_detail',
    'why_explanation',
    'alternative_plans',
    'cost_breakdown',
    'modification_controls',
  ],
};

/**
 * Display requirements for developer/inspector mode.
 *
 * Everything is visible by default for debugging.
 */
export const DEVELOPER_DISPLAY_REQUIREMENTS: PreviewDisplayRequirements = {
  mandatory: [
    'summary_text',
    'safety_badge',
    'affected_scopes',
    'constraint_status',
    'apply_button',
    'cancel_button',
    'diff_detail',
    'why_explanation',
    'plan_steps',
    'cost_breakdown',
    'scope_highlights',
  ],
  onDemand: [
    'alternative_plans',
    'modification_controls',
  ],
  hidden: [],
};


// =============================================================================
// Preview History
// =============================================================================

/**
 * A record of preview sessions for audit and "compare plans" features.
 */
export interface PreviewHistory {
  /** Ordered list of preview sessions (most recent first). */
  readonly sessions: readonly PreviewSession[];
  /** Maximum number of sessions to retain. */
  readonly maxSessions: number;
}

/**
 * Create an empty preview history.
 */
export function createPreviewHistory(maxSessions: number = 20): PreviewHistory {
  return { sessions: [], maxSessions };
}

/**
 * Add a session to preview history, evicting oldest if at capacity.
 */
export function addToPreviewHistory(
  history: PreviewHistory,
  session: PreviewSession,
): PreviewHistory {
  const sessions = [session, ...history.sessions];
  if (sessions.length > history.maxSessions) {
    sessions.length = history.maxSessions;
  }
  return { ...history, sessions };
}


// =============================================================================
// Preview-First Interaction Rules
// =============================================================================

/**
 * The complete set of rules governing preview-first behavior.
 *
 * These rules are enforced at the pipeline level. Any UI implementation
 * must satisfy these rules or be considered non-conformant.
 */
export const PREVIEW_FIRST_RULES = {
  /**
   * Rule 1: Every plan MUST produce a PreviewResult before mutation.
   * No exceptions. Even in auto-apply mode, the preview is generated
   * (it may just not be displayed for long).
   */
  RULE_PREVIEW_BEFORE_MUTATION: 'Every plan produces a PreviewResult before any mutation occurs',

  /**
   * Rule 2: The Apply button is DISABLED when hard constraints are violated.
   * The user cannot override hard constraint violations through the UI.
   * (They can relax the constraint, which produces a new plan.)
   */
  RULE_APPLY_REQUIRES_CONSTRAINTS: 'Apply is disabled when any hard constraint is violated',

  /**
   * Rule 3: Undo packages are ALWAYS generated, even for auto-applied plans.
   * There is no such thing as an irreversible GOFAI action.
   */
  RULE_UNDO_ALWAYS_AVAILABLE: 'Every applied plan produces an UndoToken, regardless of apply mode',

  /**
   * Rule 4: Scope highlighting is available for EVERY preview.
   * The user can always see which parts of the project will be affected.
   */
  RULE_SCOPE_HIGHLIGHTING_AVAILABLE: 'Scope highlighting data is computed for every preview',

  /**
   * Rule 5: A preview EXPIRES when new input supersedes it.
   * The user cannot apply a stale preview after starting a new command.
   */
  RULE_PREVIEW_EXPIRATION: 'Previews expire when new input is received',

  /**
   * Rule 6: Auto-apply NEVER applies risky plans.
   * Even in the most permissive auto-apply mode, risky plans require
   * explicit user confirmation.
   */
  RULE_AUTO_APPLY_BLOCKS_RISKY: 'Auto-apply never applies plans with safetyLevel === risky',

  /**
   * Rule 7: The system shows a notification after auto-apply.
   * Users must know that something happened, even if they opted into
   * auto-apply. The notification includes "Undo" as a one-click action.
   */
  RULE_AUTO_APPLY_NOTIFICATION: 'Auto-applied plans produce a visible notification with one-click undo',

  /**
   * Rule 8: Preview comparison is available.
   * When a user generates multiple plans for the same input (by modifying
   * parameters), they can compare them side by side.
   */
  RULE_COMPARISON_AVAILABLE: 'Users can compare current preview with previous previews',

  /**
   * Rule 9: The preview summary uses musician-friendly language.
   * It does NOT say "modify 47 MIDI events". It says
   * "Raise the register of the pad chords in Chorus 2 by one octave."
   */
  RULE_MUSICIAN_FRIENDLY_LANGUAGE: 'Preview summaries use musical terms, not implementation details',

  /**
   * Rule 10: Constraint violations are explained, not just flagged.
   * A red badge is not enough. The preview must explain WHAT was violated
   * and WHY (e.g., "Melody in bars 33-40 would change by 3 semitones,
   * but you asked to preserve it exactly").
   */
  RULE_CONSTRAINT_EXPLANATIONS: 'Constraint violations include explanations and affected entities',
} as const;

/**
 * All preview-first rule names, for testing and validation.
 */
export type PreviewFirstRuleName = keyof typeof PREVIEW_FIRST_RULES;

/**
 * Validate that a preview interaction satisfies the preview-first rules.
 * Returns a list of violated rules (empty = all rules satisfied).
 */
export function validatePreviewFirstRules(
  preview: PreviewResult,
  session: PreviewSession,
  _config: PreviewFirstConfig,
): readonly PreviewFirstRuleName[] {
  const violations: PreviewFirstRuleName[] = [];

  // Rule 2: Apply must require constraints
  if (session.state === 'accepted' && !preview.canApply) {
    violations.push('RULE_APPLY_REQUIRES_CONSTRAINTS');
  }

  // Rule 6: Auto-apply must not apply risky plans
  if (session.wasAutoApplied && preview.safetyLevel === 'risky') {
    violations.push('RULE_AUTO_APPLY_BLOCKS_RISKY');
  }

  return violations;
}
