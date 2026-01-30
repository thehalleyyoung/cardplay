/**
 * @fileoverview Control Policy for AI/HostAction Behavior
 * 
 * Maps ControlLevel × ToolMode to allowed auto-apply behavior.
 * Used to gate HostAction application based on user control preferences.
 * 
 * References:
 * - docs/control-levels.md
 * - src/ai/theory/apply-host-action.ts
 * - to_fix_repo_plan_500.md Changes 376-377
 * 
 * @module @cardplay/ai/policy/control-policy
 */

import type { ControlLevel } from '../../canon/card-kind';

/**
 * Tool modes that affect auto-apply behavior.
 */
export type ToolMode =
  | 'auto'          // Full automation
  | 'suggest'       // Suggest but don't apply
  | 'manual'        // Manual only, no AI
  | 'live';         // Live performance mode

/**
 * Auto-apply permission level.
 */
export enum AutoApplyPermission {
  /** Never auto-apply - user must review and approve each action */
  NEVER = 'never',
  
  /** Auto-apply with notification - action applied but user is informed */
  WITH_NOTIFICATION = 'with-notification',
  
  /** Auto-apply silently - action applied without user notification */
  SILENT = 'silent',
}

/**
 * Control policy configuration.
 */
export interface ControlPolicyConfig {
  /** Whether auto-apply is allowed */
  autoApply: AutoApplyPermission;
  
  /** Whether to show action preview before applying */
  showPreview: boolean;
  
  /** Whether to require user confirmation */
  requireConfirmation: boolean;
  
  /** Whether to record actions in history */
  recordHistory: boolean;
  
  /** Maximum confidence threshold for auto-apply (0-1) */
  minConfidenceForAutoApply: number;
}

/**
 * Policy matrix mapping control level × tool mode to configuration.
 * 
 * Change 376: Implements capability-gated auto-apply rules.
 */
const CONTROL_POLICY_MATRIX: Record<ControlLevel, Record<ToolMode, ControlPolicyConfig>> = {
  'full-manual': {
    auto: {
      autoApply: AutoApplyPermission.NEVER,
      showPreview: true,
      requireConfirmation: true,
      recordHistory: true,
      minConfidenceForAutoApply: 1.0,
    },
    suggest: {
      autoApply: AutoApplyPermission.NEVER,
      showPreview: true,
      requireConfirmation: true,
      recordHistory: true,
      minConfidenceForAutoApply: 1.0,
    },
    manual: {
      autoApply: AutoApplyPermission.NEVER,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: true,
      minConfidenceForAutoApply: 1.0,
    },
    live: {
      autoApply: AutoApplyPermission.NEVER,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: false,
      minConfidenceForAutoApply: 1.0,
    },
  },
  
  'manual-with-hints': {
    auto: {
      autoApply: AutoApplyPermission.WITH_NOTIFICATION,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: true,
      minConfidenceForAutoApply: 0.8,
    },
    suggest: {
      autoApply: AutoApplyPermission.NEVER,
      showPreview: true,
      requireConfirmation: true,
      recordHistory: true,
      minConfidenceForAutoApply: 1.0,
    },
    manual: {
      autoApply: AutoApplyPermission.NEVER,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: true,
      minConfidenceForAutoApply: 1.0,
    },
    live: {
      autoApply: AutoApplyPermission.WITH_NOTIFICATION,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: false,
      minConfidenceForAutoApply: 0.9,
    },
  },
  
  'assisted': {
    auto: {
      autoApply: AutoApplyPermission.SILENT,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: true,
      minConfidenceForAutoApply: 0.7,
    },
    suggest: {
      autoApply: AutoApplyPermission.NEVER,
      showPreview: true,
      requireConfirmation: false,
      recordHistory: true,
      minConfidenceForAutoApply: 1.0,
    },
    manual: {
      autoApply: AutoApplyPermission.NEVER,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: true,
      minConfidenceForAutoApply: 1.0,
    },
    live: {
      autoApply: AutoApplyPermission.SILENT,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: false,
      minConfidenceForAutoApply: 0.8,
    },
  },
  
  'collaborative': {
    auto: {
      autoApply: AutoApplyPermission.WITH_NOTIFICATION,
      showPreview: true,
      requireConfirmation: false,
      recordHistory: true,
      minConfidenceForAutoApply: 0.7,
    },
    suggest: {
      autoApply: AutoApplyPermission.NEVER,
      showPreview: true,
      requireConfirmation: false,
      recordHistory: true,
      minConfidenceForAutoApply: 1.0,
    },
    manual: {
      autoApply: AutoApplyPermission.NEVER,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: true,
      minConfidenceForAutoApply: 1.0,
    },
    live: {
      autoApply: AutoApplyPermission.SILENT,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: false,
      minConfidenceForAutoApply: 0.75,
    },
  },
  
  'directed': {
    auto: {
      autoApply: AutoApplyPermission.SILENT,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: true,
      minConfidenceForAutoApply: 0.6,
    },
    suggest: {
      autoApply: AutoApplyPermission.WITH_NOTIFICATION,
      showPreview: true,
      requireConfirmation: false,
      recordHistory: true,
      minConfidenceForAutoApply: 0.8,
    },
    manual: {
      autoApply: AutoApplyPermission.NEVER,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: true,
      minConfidenceForAutoApply: 1.0,
    },
    live: {
      autoApply: AutoApplyPermission.SILENT,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: false,
      minConfidenceForAutoApply: 0.7,
    },
  },
  
  'generative': {
    auto: {
      autoApply: AutoApplyPermission.SILENT,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: true,
      minConfidenceForAutoApply: 0.5,
    },
    suggest: {
      autoApply: AutoApplyPermission.SILENT,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: true,
      minConfidenceForAutoApply: 0.6,
    },
    manual: {
      autoApply: AutoApplyPermission.NEVER,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: true,
      minConfidenceForAutoApply: 1.0,
    },
    live: {
      autoApply: AutoApplyPermission.SILENT,
      showPreview: false,
      requireConfirmation: false,
      recordHistory: false,
      minConfidenceForAutoApply: 0.6,
    },
  },
};

/**
 * Gets the control policy for a given control level and tool mode.
 */
export function getControlPolicy(
  controlLevel: ControlLevel,
  toolMode: ToolMode
): ControlPolicyConfig {
  return CONTROL_POLICY_MATRIX[controlLevel][toolMode];
}

/**
 * Checks if auto-apply is allowed for the given context.
 */
export function canAutoApply(
  controlLevel: ControlLevel,
  toolMode: ToolMode,
  confidence: number
): boolean {
  const policy = getControlPolicy(controlLevel, toolMode);
  
  if (policy.autoApply === AutoApplyPermission.NEVER) {
    return false;
  }
  
  return confidence >= policy.minConfidenceForAutoApply;
}

/**
 * Checks if notification should be shown for auto-applied action.
 */
export function shouldNotifyAutoApply(
  controlLevel: ControlLevel,
  toolMode: ToolMode
): boolean {
  const policy = getControlPolicy(controlLevel, toolMode);
  return policy.autoApply === AutoApplyPermission.WITH_NOTIFICATION;
}

/**
 * Checks if user confirmation is required before applying action.
 */
export function requiresConfirmation(
  controlLevel: ControlLevel,
  toolMode: ToolMode
): boolean {
  const policy = getControlPolicy(controlLevel, toolMode);
  return policy.requireConfirmation;
}

/**
 * Checks if action preview should be shown before applying.
 */
export function shouldShowPreview(
  controlLevel: ControlLevel,
  toolMode: ToolMode
): boolean {
  const policy = getControlPolicy(controlLevel, toolMode);
  return policy.showPreview;
}

/**
 * Checks if action should be recorded in history.
 */
export function shouldRecordHistory(
  controlLevel: ControlLevel,
  toolMode: ToolMode
): boolean {
  const policy = getControlPolicy(controlLevel, toolMode);
  return policy.recordHistory;
}
