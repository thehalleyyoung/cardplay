/**
 * @file Unknown Opcode Runtime Behavior (Step 333)
 * @module gofai/execution/unknown-opcode-behavior
 * 
 * Implements Step 333: Define "unknown opcode" runtime behavior: cannot execute;
 * must display and ask for handler selection or decline.
 * 
 * This module handles the runtime behavior when an opcode is encountered that
 * has no registered handler. This can happen when:
 * - User loads a plan created with an extension that's not installed
 * - Extension was disabled after plan was created
 * - Extension version changed and opcode was removed
 * - Plan references a typo/invalid opcode
 * 
 * Design principles:
 * - Unknown opcodes never execute silently
 * - User is shown clear explanation of what's missing
 * - Options are provided to resolve the situation
 * - Plan can still be inspected and partially executed
 * - Provenance shows which extension is needed
 * - Graceful degradation when possible
 * 
 * Resolution strategies:
 * 1. Install missing extension
 * 2. Enable disabled extension
 * 3. Update extension to compatible version
 * 4. Remove unknown opcode from plan
 * 5. Skip unknown opcode and continue
 * 6. Abort entire plan execution
 * 
 * @see gofai_goalB.md Step 333
 * @see gofai_goalB.md Step 331 (extension opcode compilation)
 * @see gofai_goalB.md Step 332 (handler purity)
 * @see src/gofai/execution/extension-opcode-compilation.ts
 * @see docs/gofai/unknown-opcodes.md
 */

import type {
  ExtensionOpcodeId,
  ExtensionNamespace,
  ExtensionOpcodeRegistration,
} from './extension-opcode-compilation.js';
import type {
  CPLPlan,
  PlanOpcode,
} from './edit-package.js';

// ============================================================================
// Unknown Opcode Detection
// ============================================================================

/**
 * Information about an unknown opcode.
 */
export interface UnknownOpcodeInfo {
  /** The opcode that's unknown */
  readonly opcode: PlanOpcode;
  
  /** Opcode ID */
  readonly opcodeId: ExtensionOpcodeId;
  
  /** Extracted namespace (if parseable) */
  readonly namespace?: ExtensionNamespace;
  
  /** Why is it unknown? */
  readonly reason: UnknownReason;
  
  /** Position in plan */
  readonly position: number;
  
  /** Is this opcode critical to the plan? */
  readonly critical: boolean;
  
  /** Suggested remediations */
  readonly remediations: readonly Remediation[];
}

/**
 * Reason an opcode is unknown.
 */
export type UnknownReason =
  | 'not_registered' // No handler registered
  | 'namespace_disabled' // Extension namespace disabled
  | 'extension_not_installed' // Extension not installed
  | 'incompatible_version' // Extension version incompatible
  | 'malformed_id' // Opcode ID doesn't follow namespace:name pattern
  | 'handler_failed_to_load'; // Handler registered but failed to load

/**
 * Suggested remediation for unknown opcode.
 */
export interface Remediation {
  /** Remediation type */
  readonly type: RemediationType;
  
  /** Human-readable description */
  readonly description: string;
  
  /** Can this be done automatically? */
  readonly automatic: boolean;
  
  /** Action to perform remediation */
  readonly action?: RemediationAction;
  
  /** Likelihood this will succeed */
  readonly likelihood: 'high' | 'medium' | 'low';
}

/**
 * Type of remediation.
 */
export type RemediationType =
  | 'install_extension'
  | 'enable_extension'
  | 'update_extension'
  | 'remove_opcode'
  | 'skip_opcode'
  | 'replace_opcode'
  | 'abort_plan';

/**
 * Action to perform remediation.
 */
export interface RemediationAction {
  readonly type: RemediationType;
  readonly params: Record<string, unknown>;
}

// ============================================================================
// Unknown Opcode Analyzer
// ============================================================================

/**
 * Analyzes unknown opcodes and suggests remediations.
 */
export class UnknownOpcodeAnalyzer {
  /**
   * Analyze a plan for unknown opcodes.
   */
  static analyze(
    plan: CPLPlan,
    getRegistration: (id: ExtensionOpcodeId) => ExtensionOpcodeRegistration | undefined,
    isNamespaceEnabled: (ns: ExtensionNamespace) => boolean,
    isExtensionInstalled: (ns: ExtensionNamespace) => boolean
  ): readonly UnknownOpcodeInfo[] {
    const unknownOpcodes: UnknownOpcodeInfo[] = [];
    
    for (let i = 0; i < plan.opcodes.length; i++) {
      const opcode = plan.opcodes[i];
      const opcodeId = opcode.type as ExtensionOpcodeId;
      
      // Check if it's a core opcode (no namespace)
      if (!opcodeId.includes(':')) {
        continue; // Core opcodes are handled separately
      }
      
      // Extract namespace
      const namespace = this.extractNamespace(opcodeId);
      if (!namespace) {
        unknownOpcodes.push({
          opcode,
          opcodeId,
          reason: 'malformed_id',
          position: i,
          critical: this.isCritical(opcode, plan),
          remediations: [
            {
              type: 'remove_opcode',
              description: 'Remove this malformed opcode from the plan',
              automatic: false,
              likelihood: 'high',
            },
            {
              type: 'abort_plan',
              description: 'Abort plan execution due to malformed opcode',
              automatic: false,
              likelihood: 'high',
            },
          ],
        });
        continue;
      }
      
      // Check registration
      const registration = getRegistration(opcodeId);
      
      if (!registration) {
        // Not registered - determine why
        if (!isExtensionInstalled(namespace)) {
          unknownOpcodes.push(this.createUnknownInfo(
            opcode,
            opcodeId,
            namespace,
            'extension_not_installed',
            i,
            plan
          ));
        } else {
          unknownOpcodes.push(this.createUnknownInfo(
            opcode,
            opcodeId,
            namespace,
            'not_registered',
            i,
            plan
          ));
        }
        continue;
      }
      
      // Registered but disabled?
      if (!isNamespaceEnabled(namespace)) {
        unknownOpcodes.push(this.createUnknownInfo(
          opcode,
          opcodeId,
          namespace,
          'namespace_disabled',
          i,
          plan
        ));
        continue;
      }
    }
    
    return unknownOpcodes;
  }
  
  /**
   * Extract namespace from opcode ID.
   */
  private static extractNamespace(opcodeId: ExtensionOpcodeId): ExtensionNamespace | undefined {
    const parts = opcodeId.split(':');
    if (parts.length !== 2) {
      return undefined;
    }
    return parts[0] as ExtensionNamespace;
  }
  
  /**
   * Check if opcode is critical to the plan.
   */
  private static isCritical(opcode: PlanOpcode, plan: CPLPlan): boolean {
    // Simple heuristic: check if other opcodes depend on this one
    // In practice, would analyze opcode dependencies
    return plan.opcodes.length === 1; // If it's the only opcode, it's critical
  }
  
  /**
   * Create UnknownOpcodeInfo with appropriate remediations.
   */
  private static createUnknownInfo(
    opcode: PlanOpcode,
    opcodeId: ExtensionOpcodeId,
    namespace: ExtensionNamespace,
    reason: UnknownReason,
    position: number,
    plan: CPLPlan
  ): UnknownOpcodeInfo {
    const remediations: Remediation[] = [];
    
    switch (reason) {
      case 'extension_not_installed':
        remediations.push({
          type: 'install_extension',
          description: `Install extension "${namespace}" to enable this opcode`,
          automatic: false,
          action: {
            type: 'install_extension',
            params: { namespace },
          },
          likelihood: 'medium',
        });
        remediations.push({
          type: 'skip_opcode',
          description: 'Skip this opcode and continue with the rest',
          automatic: false,
          likelihood: 'medium',
        });
        remediations.push({
          type: 'abort_plan',
          description: 'Abort the entire plan',
          automatic: false,
          likelihood: 'high',
        });
        break;
        
      case 'namespace_disabled':
        remediations.push({
          type: 'enable_extension',
          description: `Enable extension "${namespace}"`,
          automatic: true,
          action: {
            type: 'enable_extension',
            params: { namespace },
          },
          likelihood: 'high',
        });
        remediations.push({
          type: 'skip_opcode',
          description: 'Skip this opcode and continue',
          automatic: false,
          likelihood: 'medium',
        });
        break;
        
      case 'not_registered':
        remediations.push({
          type: 'update_extension',
          description: `Update extension "${namespace}" to a version that includes this opcode`,
          automatic: false,
          likelihood: 'medium',
        });
        remediations.push({
          type: 'remove_opcode',
          description: 'Remove this opcode from the plan',
          automatic: false,
          likelihood: 'medium',
        });
        break;
        
      case 'incompatible_version':
        remediations.push({
          type: 'update_extension',
          description: `Update extension "${namespace}" to a compatible version`,
          automatic: false,
          likelihood: 'high',
        });
        break;
    }
    
    return {
      opcode,
      opcodeId,
      namespace,
      reason,
      position,
      critical: this.isCritical(opcode, plan),
      remediations,
    };
  }
}

// ============================================================================
// Unknown Opcode UI State
// ============================================================================

/**
 * UI state for handling unknown opcodes.
 */
export interface UnknownOpcodeUIState {
  /** Unknown opcodes detected */
  readonly unknownOpcodes: readonly UnknownOpcodeInfo[];
  
  /** Current resolution mode */
  readonly mode: ResolutionMode;
  
  /** Selected remediation for each unknown opcode */
  readonly selectedRemediations: ReadonlyMap<number, Remediation>;
  
  /** Can plan proceed? */
  readonly canProceed: boolean;
  
  /** Warnings to display */
  readonly warnings: readonly string[];
}

/**
 * Resolution mode.
 */
export type ResolutionMode =
  | 'blocking' // Must resolve before proceeding
  | 'interactive' // User chooses how to handle
  | 'permissive'; // Allow skipping unknowns

/**
 * Manages UI state for unknown opcode handling.
 */
export class UnknownOpcodeUIManager {
  private mode: ResolutionMode;
  private selectedRemediations = new Map<number, Remediation>();
  
  constructor(
    private unknownOpcodes: readonly UnknownOpcodeInfo[],
    mode: ResolutionMode = 'interactive'
  ) {
    this.mode = mode;
  }
  
  /**
   * Select a remediation for an unknown opcode.
   */
  selectRemediation(position: number, remediation: Remediation): void {
    this.selectedRemediations.set(position, remediation);
  }
  
  /**
   * Get current UI state.
   */
  getState(): UnknownOpcodeUIState {
    const warnings: string[] = [];
    
    // Check if all unknowns have remediations selected
    const allResolved = this.unknownOpcodes.every(info =>
      this.selectedRemediations.has(info.position)
    );
    
    // Generate warnings
    for (const info of this.unknownOpcodes) {
      const remediation = this.selectedRemediations.get(info.position);
      if (remediation?.type === 'skip_opcode') {
        warnings.push(`Skipping opcode "${info.opcodeId}" may affect plan results`);
      }
    }
    
    return {
      unknownOpcodes: this.unknownOpcodes,
      mode: this.mode,
      selectedRemediations: new Map(this.selectedRemediations),
      canProceed: allResolved || this.mode === 'permissive',
      warnings,
    };
  }
  
  /**
   * Apply selected remediations.
   */
  async applyRemediations(
    applyAction: (action: RemediationAction) => Promise<boolean>
  ): Promise<RemediationResult> {
    const results: RemediationOutcome[] = [];
    
    for (const [position, remediation] of this.selectedRemediations.entries()) {
      if (remediation.action) {
        const success = await applyAction(remediation.action);
        results.push({
          position,
          remediation,
          success,
        });
      } else {
        results.push({
          position,
          remediation,
          success: true, // Non-action remediations (like skip) succeed by default
        });
      }
    }
    
    const allSucceeded = results.every(r => r.success);
    
    return {
      outcomes: results,
      allSucceeded,
    };
  }
}

/**
 * Result of applying remediations.
 */
export interface RemediationResult {
  readonly outcomes: readonly RemediationOutcome[];
  readonly allSucceeded: boolean;
}

/**
 * Outcome of a single remediation.
 */
export interface RemediationOutcome {
  readonly position: number;
  readonly remediation: Remediation;
  readonly success: boolean;
}

// ============================================================================
// Plan Modification
// ============================================================================

/**
 * Modify a plan to handle unknown opcodes.
 */
export class PlanModifier {
  /**
   * Remove unknown opcodes from a plan.
   */
  static removeUnknownOpcodes(
    plan: CPLPlan,
    unknownPositions: readonly number[]
  ): CPLPlan {
    const positionSet = new Set(unknownPositions);
    const filteredOpcodes = plan.opcodes.filter((_, i) => !positionSet.has(i));
    
    return {
      ...plan,
      opcodes: filteredOpcodes,
      explanation: `${plan.explanation} (removed ${unknownPositions.length} unknown opcodes)`,
    };
  }
  
  /**
   * Replace an unknown opcode with an alternative.
   */
  static replaceOpcode(
    plan: CPLPlan,
    position: number,
    replacement: PlanOpcode
  ): CPLPlan {
    const newOpcodes = [...plan.opcodes];
    newOpcodes[position] = replacement;
    
    return {
      ...plan,
      opcodes: newOpcodes,
      explanation: `${plan.explanation} (replaced opcode at position ${position})`,
    };
  }
}

// ============================================================================
// Error Messages
// ============================================================================

/**
 * Generate user-friendly error messages for unknown opcodes.
 */
export class UnknownOpcodeMessages {
  /**
   * Generate a detailed error message for an unknown opcode.
   */
  static generateMessage(info: UnknownOpcodeInfo): string {
    let message = `Unknown opcode: "${info.opcodeId}"\n\n`;
    
    switch (info.reason) {
      case 'extension_not_installed':
        message += `The extension "${info.namespace}" is not installed.\n`;
        message += `This opcode cannot be executed without installing the extension.\n\n`;
        break;
        
      case 'namespace_disabled':
        message += `The extension "${info.namespace}" is currently disabled.\n`;
        message += `Enable it to use this opcode.\n\n`;
        break;
        
      case 'not_registered':
        message += `No handler is registered for this opcode.\n`;
        message += `The extension may not support this opcode in the current version.\n\n`;
        break;
        
      case 'malformed_id':
        message += `The opcode ID is malformed.\n`;
        message += `Extension opcodes must follow the format "namespace:name".\n\n`;
        break;
        
      case 'incompatible_version':
        message += `The installed version of "${info.namespace}" is incompatible.\n`;
        message += `Update the extension to use this opcode.\n\n`;
        break;
    }
    
    if (info.critical) {
      message += `⚠️  This opcode is critical to the plan.\n`;
      message += `Skipping it may produce unexpected results.\n\n`;
    }
    
    message += `What would you like to do?\n\n`;
    
    for (let i = 0; i < info.remediations.length; i++) {
      const remediation = info.remediations[i];
      message += `${i + 1}. ${remediation.description}`;
      if (remediation.automatic) {
        message += ` (automatic)`;
      }
      message += `\n`;
    }
    
    return message;
  }
  
  /**
   * Generate a summary message for multiple unknown opcodes.
   */
  static generateSummary(unknownOpcodes: readonly UnknownOpcodeInfo[]): string {
    const count = unknownOpcodes.length;
    let message = `Found ${count} unknown opcode${count === 1 ? '' : 's'} in the plan:\n\n`;
    
    for (const info of unknownOpcodes) {
      message += `• "${info.opcodeId}" (${info.reason})\n`;
    }
    
    message += `\nThe plan cannot be executed until these are resolved.\n`;
    
    return message;
  }
}

// ============================================================================
// Exports
// ============================================================================

export type {
  UnknownOpcodeInfo,
  UnknownReason,
  Remediation,
  RemediationType,
  RemediationAction,
  UnknownOpcodeUIState,
  ResolutionMode,
  RemediationResult,
  RemediationOutcome,
};

export {
  UnknownOpcodeAnalyzer,
  UnknownOpcodeUIManager,
  PlanModifier,
  UnknownOpcodeMessages,
};
