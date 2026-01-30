/**
 * @file Execution Capability Checks (Step 314)
 * @module gofai/execution/capability-checks
 * 
 * Implements Step 314: Implement "execution capability checks": if a plan requires
 * routing edits but policy forbids it, downgrade to preview-only.
 * 
 * This module provides runtime capability checking that ensures plans only execute
 * operations allowed by the current board policy and system state. If a plan
 * requires capabilities that are unavailable, it is either:
 * - Downgraded to preview-only (safe visualization)
 * - Blocked with a clear explanation
 * - Modified to remove forbidden operations
 * 
 * Design principles:
 * - Board policy is authoritative (full-manual vs directed vs generative)
 * - Capability checks happen before execution, not during
 * - Violations produce structured errors with remediation suggestions
 * - Preview is always available (inspection never blocked)
 * - Extension opcodes respect same capability model
 * 
 * Capability model:
 * - Production layer: DSP/FX parameter edits
 * - Routing layer: Signal routing changes
 * - Structure layer: Add/remove tracks, sections, cards
 * - Generation layer: AI-driven content creation
 * - UI layer: Navigation and view changes
 * 
 * @see gofai_goalB.md Step 314
 * @see docs/gofai/execution.md
 * @see src/boards/types.ts (ControlLevel, CompositionToolConfig)
 */

import type { CPLPlan, PlanOpcode } from './edit-package.js';
import type { EffectKind, EffectCategory, EffectScope } from './effect-system.js';
import type { GofaiId } from '../canon/types.js';

// ============================================================================
// Capability Types
// ============================================================================

/**
 * Execution capability model.
 * 
 * Defines what operations are permitted in the current context.
 * Derived from board control level and system state.
 */
export interface ExecutionCapabilities {
  /** Can modify production layer (DSP/FX params)? */
  readonly productionEdits: boolean;
  
  /** Can modify routing? */
  readonly routingEdits: boolean;
  
  /** Can add/remove structural elements? */
  readonly structuralEdits: boolean;
  
  /** Can AI generate new content? */
  readonly generativeEdits: boolean;
  
  /** Can modify event data (notes, timing)? */
  readonly eventEdits: boolean;
  
  /** Can modify card parameters? */
  readonly cardParamEdits: boolean;
  
  /** Can add/remove cards? */
  readonly cardGraphEdits: boolean;
  
  /** Can add/remove tracks? */
  readonly trackEdits: boolean;
  
  /** Can modify section markers? */
  readonly sectionEdits: boolean;
  
  /** Can navigate/change UI? */
  readonly uiActions: boolean;
  
  /** Extension namespaces whose opcodes are enabled */
  readonly enabledExtensions: readonly string[];
  
  /** Overall execution mode */
  readonly executionMode: ExecutionMode;
}

/**
 * Execution mode derived from board control level.
 */
export type ExecutionMode =
  | 'full-manual' // No auto-execution; preview only
  | 'directed' // Limited AI execution with confirmation
  | 'collaborative' // Balanced human/AI workflow
  | 'generative'; // AI-driven with human oversight

/**
 * Board context for capability determination.
 */
export interface BoardContext {
  /** Board type ID */
  readonly boardType: string;
  
  /** Control level */
  readonly controlLevel: string;
  
  /** Tool configuration */
  readonly toolConfig?: {
    readonly gofaiEnabled?: boolean;
    readonly autoApply?: boolean;
    readonly requireConfirmation?: boolean;
  };
  
  /** Board-specific policies */
  readonly policies?: {
    readonly allowRouting?: boolean;
    readonly allowStructural?: boolean;
    readonly allowGeneration?: boolean;
  };
}

/**
 * Result of capability check.
 */
export type CapabilityCheckResult =
  | { readonly status: 'allowed'; readonly mode: 'execute' }
  | { readonly status: 'preview-only'; readonly reason: string; readonly blockedOperations: readonly string[] }
  | { readonly status: 'blocked'; readonly reason: string; readonly violations: readonly CapabilityViolation[] }
  | { readonly status: 'requires-confirmation'; readonly operations: readonly string[]; readonly risks: readonly string[] };

/**
 * A capability violation.
 */
export interface CapabilityViolation {
  /** Opcode that violates capability */
  readonly opcodeId: string;
  
  /** Opcode type */
  readonly opcodeType: GofaiId;
  
  /** Required capability */
  readonly requiredCapability: keyof ExecutionCapabilities;
  
  /** Why it's blocked */
  readonly reason: string;
  
  /** Suggested remediation */
  readonly remediation?: CapabilityRemediation;
}

/**
 * Suggested remediation for capability violation.
 */
export interface CapabilityRemediation {
  readonly type: 'enable-capability' | 'switch-board' | 'modify-plan' | 'manual-action';
  readonly description: string;
  readonly action?: RemediationAction;
}

/**
 * Action that can be taken to remediate.
 */
export interface RemediationAction {
  readonly type: 'switch-board' | 'enable-extension' | 'change-policy' | 'remove-opcodes';
  readonly parameters: Record<string, unknown>;
}

// ============================================================================
// Capability Derivation
// ============================================================================

/**
 * Derive execution capabilities from board context.
 * 
 * Maps board control level and policies to specific capability flags.
 */
export function deriveCapabilities(context: BoardContext): ExecutionCapabilities {
  const mode = mapControlLevelToMode(context.controlLevel);
  
  // Base capabilities by execution mode
  const baseCaps = getBaseCapabilitiesByMode(mode);
  
  // Apply board-specific policies
  const caps: ExecutionCapabilities = {
    ...baseCaps,
    
    // Override with board policies
    routingEdits: baseCaps.routingEdits && (context.policies?.allowRouting ?? true),
    structuralEdits: baseCaps.structuralEdits && (context.policies?.allowStructural ?? true),
    generativeEdits: baseCaps.generativeEdits && (context.policies?.allowGeneration ?? true),
    
    // Tool config overrides
    uiActions: context.toolConfig?.gofaiEnabled ?? true,
    
    // Extension capabilities (default to empty, populated by extension system)
    enabledExtensions: [],
    
    executionMode: mode,
  };
  
  return caps;
}

/**
 * Map control level string to execution mode.
 */
function mapControlLevelToMode(controlLevel: string): ExecutionMode {
  switch (controlLevel) {
    case 'full-manual':
      return 'full-manual';
    case 'directed':
      return 'directed';
    case 'collaborative':
      return 'collaborative';
    case 'generative':
      return 'generative';
    default:
      // Default to most restrictive
      return 'full-manual';
  }
}

/**
 * Get base capabilities for an execution mode.
 */
function getBaseCapabilitiesByMode(mode: ExecutionMode): Omit<ExecutionCapabilities, 'enabledExtensions' | 'executionMode'> {
  switch (mode) {
    case 'full-manual':
      return {
        productionEdits: false,
        routingEdits: false,
        structuralEdits: false,
        generativeEdits: false,
        eventEdits: false,
        cardParamEdits: false,
        cardGraphEdits: false,
        trackEdits: false,
        sectionEdits: false,
        uiActions: true, // Always allow UI
      };
      
    case 'directed':
      return {
        productionEdits: true,
        routingEdits: false, // Routing requires explicit permission
        structuralEdits: false, // Structure requires explicit permission
        generativeEdits: false,
        eventEdits: true,
        cardParamEdits: true,
        cardGraphEdits: false,
        trackEdits: false,
        sectionEdits: true,
        uiActions: true,
      };
      
    case 'collaborative':
      return {
        productionEdits: true,
        routingEdits: false, // Still conservative on routing
        structuralEdits: true,
        generativeEdits: true,
        eventEdits: true,
        cardParamEdits: true,
        cardGraphEdits: true,
        trackEdits: true,
        sectionEdits: true,
        uiActions: true,
      };
      
    case 'generative':
      return {
        productionEdits: true,
        routingEdits: true,
        structuralEdits: true,
        generativeEdits: true,
        eventEdits: true,
        cardParamEdits: true,
        cardGraphEdits: true,
        trackEdits: true,
        sectionEdits: true,
        uiActions: true,
      };
  }
}

// ============================================================================
// Capability Checking
// ============================================================================

/**
 * Check if a plan can execute given current capabilities.
 * 
 * Examines each opcode in the plan and determines:
 * 1. Which capabilities it requires
 * 2. Whether those capabilities are available
 * 3. Whether execution can proceed, needs preview-only, or must be blocked
 */
export function checkPlanCapabilities(
  plan: CPLPlan,
  capabilities: ExecutionCapabilities
): CapabilityCheckResult {
  const violations: CapabilityViolation[] = [];
  const riskyOps: string[] = [];
  
  for (const opcode of plan.opcodes) {
    const requiredCaps = getOpcodeRequiredCapabilities(opcode);
    const opcodeViolations = checkOpcodeCapabilities(opcode, requiredCaps, capabilities);
    
    if (opcodeViolations.length > 0) {
      violations.push(...opcodeViolations);
    }
    
    // Check for risky operations that need confirmation
    if (isRiskyOperation(opcode, capabilities)) {
      riskyOps.push(opcode.id);
    }
  }
  
  // Determine overall result
  if (violations.length > 0) {
    // Check if we can downgrade to preview-only
    if (canDowngradeToPreview(violations, capabilities)) {
      return {
        status: 'preview-only',
        reason: 'Some operations require capabilities not available in current mode',
        blockedOperations: violations.map(v => v.opcodeId),
      };
    }
    
    // Otherwise, plan is blocked
    return {
      status: 'blocked',
      reason: 'Plan contains operations that violate current capability restrictions',
      violations,
    };
  }
  
  // Check if confirmation is needed for risky operations
  if (riskyOps.length > 0 && requiresConfirmationByMode(capabilities.executionMode)) {
    return {
      status: 'requires-confirmation',
      operations: riskyOps,
      risks: riskyOps.map(id => describeRisk(id, plan)),
    };
  }
  
  // All clear
  return {
    status: 'allowed',
    mode: 'execute',
  };
}

/**
 * Get required capabilities for an opcode.
 */
function getOpcodeRequiredCapabilities(opcode: PlanOpcode): (keyof ExecutionCapabilities)[] {
  const caps: (keyof ExecutionCapabilities)[] = [];
  
  // Parse opcode type to determine required capabilities
  const typeStr = String(opcode.type);
  
  if (typeStr.includes('event')) {
    caps.push('eventEdits');
  }
  
  if (typeStr.includes('param') || typeStr.includes('production')) {
    caps.push('productionEdits', 'cardParamEdits');
  }
  
  if (typeStr.includes('routing') || typeStr.includes('connection')) {
    caps.push('routingEdits');
  }
  
  if (typeStr.includes('add_card') || typeStr.includes('remove_card')) {
    caps.push('cardGraphEdits', 'structuralEdits');
  }
  
  if (typeStr.includes('add_track') || typeStr.includes('remove_track')) {
    caps.push('trackEdits', 'structuralEdits');
  }
  
  if (typeStr.includes('section') || typeStr.includes('marker')) {
    caps.push('sectionEdits');
  }
  
  if (typeStr.includes('generate') || typeStr.includes('ai_')) {
    caps.push('generativeEdits');
  }
  
  if (typeStr.includes('ui_') || typeStr.includes('navigate')) {
    caps.push('uiActions');
  }
  
  // Extension opcodes require extension to be enabled
  if (typeStr.includes(':')) {
    const namespace = typeStr.split(':')[0];
    // Will check enabledExtensions separately
  }
  
  return caps;
}

/**
 * Check if an opcode violates capabilities.
 */
function checkOpcodeCapabilities(
  opcode: PlanOpcode,
  requiredCaps: (keyof ExecutionCapabilities)[],
  capabilities: ExecutionCapabilities
): CapabilityViolation[] {
  const violations: CapabilityViolation[] = [];
  
  for (const cap of requiredCaps) {
    if (!capabilities[cap]) {
      violations.push({
        opcodeId: opcode.id,
        opcodeType: opcode.type,
        requiredCapability: cap,
        reason: `Operation requires ${cap} which is not enabled in ${capabilities.executionMode} mode`,
        remediation: suggestRemediation(cap, capabilities),
      });
    }
  }
  
  // Check extension namespace
  const typeStr = String(opcode.type);
  if (typeStr.includes(':')) {
    const namespace = typeStr.split(':')[0];
    if (!capabilities.enabledExtensions.includes(namespace)) {
      violations.push({
        opcodeId: opcode.id,
        opcodeType: opcode.type,
        requiredCapability: 'enabledExtensions',
        reason: `Operation from extension "${namespace}" which is not enabled`,
        remediation: {
          type: 'enable-capability',
          description: `Enable extension "${namespace}" to execute this operation`,
          action: {
            type: 'enable-extension',
            parameters: { namespace },
          },
        },
      });
    }
  }
  
  return violations;
}

/**
 * Suggest remediation for a capability violation.
 */
function suggestRemediation(
  capability: keyof ExecutionCapabilities,
  currentCaps: ExecutionCapabilities
): CapabilityRemediation | undefined {
  // Suggest switching to a less restrictive mode
  if (currentCaps.executionMode === 'full-manual') {
    return {
      type: 'switch-board',
      description: 'Switch to a board with directed or collaborative mode to enable this operation',
      action: {
        type: 'switch-board',
        parameters: {
          suggestedControlLevel: 'directed',
        },
      },
    };
  }
  
  if (currentCaps.executionMode === 'directed' && 
      (capability === 'routingEdits' || capability === 'structuralEdits')) {
    return {
      type: 'switch-board',
      description: 'Switch to collaborative mode to enable structural and routing edits',
      action: {
        type: 'switch-board',
        parameters: {
          suggestedControlLevel: 'collaborative',
        },
      },
    };
  }
  
  // For specific capabilities, suggest modifying the plan
  return {
    type: 'modify-plan',
    description: `Remove operations requiring ${capability} from the plan`,
    action: {
      type: 'remove-opcodes',
      parameters: {
        capability,
      },
    },
  };
}

/**
 * Check if a plan can be downgraded to preview-only.
 * 
 * Preview is allowed if violations are only about execution,
 * not about inspecting or displaying the plan.
 */
function canDowngradeToPreview(
  violations: readonly CapabilityViolation[],
  capabilities: ExecutionCapabilities
): boolean {
  // Preview is always safe in full-manual mode
  if (capabilities.executionMode === 'full-manual') {
    return true;
  }
  
  // Check if all violations are execution-related (not inspection)
  for (const violation of violations) {
    // If violation is about UI actions, can't preview
    if (violation.requiredCapability === 'uiActions') {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if an operation is risky and needs confirmation.
 */
function isRiskyOperation(opcode: PlanOpcode, capabilities: ExecutionCapabilities): boolean {
  const typeStr = String(opcode.type);
  
  // Structural changes are risky
  if (typeStr.includes('remove_') || typeStr.includes('delete_')) {
    return true;
  }
  
  // Routing changes are risky
  if (typeStr.includes('routing') && capabilities.routingEdits) {
    return true;
  }
  
  // High-cost operations are risky
  if (opcode.cost > 100) {
    return true;
  }
  
  return false;
}

/**
 * Check if mode requires confirmation for risky operations.
 */
function requiresConfirmationByMode(mode: ExecutionMode): boolean {
  switch (mode) {
    case 'full-manual':
      return true; // Always confirm in manual mode
    case 'directed':
      return true; // Confirm risky ops in directed mode
    case 'collaborative':
      return false; // Trust collaborative mode
    case 'generative':
      return false; // Trust generative mode
  }
}

/**
 * Describe the risk of an operation.
 */
function describeRisk(opcodeId: string, plan: CPLPlan): string {
  const opcode = plan.opcodes.find(op => op.id === opcodeId);
  if (!opcode) {
    return 'Unknown operation';
  }
  
  const typeStr = String(opcode.type);
  
  if (typeStr.includes('remove_') || typeStr.includes('delete_')) {
    return `This operation will permanently remove data: ${opcode.explanation}`;
  }
  
  if (typeStr.includes('routing')) {
    return `This operation will change signal routing: ${opcode.explanation}`;
  }
  
  if (opcode.cost > 100) {
    return `This is a high-impact operation: ${opcode.explanation}`;
  }
  
  return opcode.explanation;
}

// ============================================================================
// Plan Filtering
// ============================================================================

/**
 * Filter a plan to remove operations that violate capabilities.
 * 
 * Returns a modified plan with only opcodes that can execute.
 * Useful for downgrading plans to executable subsets.
 */
export function filterPlanByCapabilities(
  plan: CPLPlan,
  capabilities: ExecutionCapabilities
): CPLPlan {
  const allowedOpcodes = plan.opcodes.filter(opcode => {
    const requiredCaps = getOpcodeRequiredCapabilities(opcode);
    const violations = checkOpcodeCapabilities(opcode, requiredCaps, capabilities);
    return violations.length === 0;
  });
  
  return {
    ...plan,
    opcodes: allowedOpcodes,
    explanation: allowedOpcodes.length < plan.opcodes.length
      ? `${plan.explanation} (filtered to ${allowedOpcodes.length}/${plan.opcodes.length} operations)`
      : plan.explanation,
  };
}

/**
 * Get blocked opcodes from a plan given capabilities.
 */
export function getBlockedOpcodes(
  plan: CPLPlan,
  capabilities: ExecutionCapabilities
): readonly PlanOpcode[] {
  return plan.opcodes.filter(opcode => {
    const requiredCaps = getOpcodeRequiredCapabilities(opcode);
    const violations = checkOpcodeCapabilities(opcode, requiredCaps, capabilities);
    return violations.length > 0;
  });
}

// ============================================================================
// Exports
// ============================================================================

export type {
  ExecutionCapabilities,
  ExecutionMode,
  BoardContext,
  CapabilityCheckResult,
  CapabilityViolation,
  CapabilityRemediation,
  RemediationAction,
};

export {
  deriveCapabilities,
  checkPlanCapabilities,
  filterPlanByCapabilities,
  getBlockedOpcodes,
};
