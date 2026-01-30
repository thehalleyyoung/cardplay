/**
 * @fileoverview Ontology Bridge Policy
 * 
 * Defines policies for bridging between different music ontologies.
 * When tools from one ontology need to work with data from another,
 * the bridge policy determines how to handle the translation.
 * 
 * @module @cardplay/ai/theory/ontologies/bridge
 * @see to_fix_repo_plan_500.md Change 421
 */

import type { OntologyId } from './index';
import { ontologyRegistry } from './index';

// ============================================================================
// BRIDGE POLICY TYPES
// ============================================================================

/**
 * Bridge action when ontologies don't match.
 */
export type BridgeAction = 
  | 'allow'           // Allow without warning
  | 'warn'            // Allow with warning
  | 'confirm'         // Require user confirmation
  | 'block';          // Block the operation

/**
 * Bridge result from a policy check.
 */
export interface BridgeResult {
  readonly allowed: boolean;
  readonly action: BridgeAction;
  readonly warning?: string;
  readonly suggestion?: string;
}

/**
 * Bridge policy configuration.
 */
export interface BridgePolicyConfig {
  /** Default action for unspecified ontology pairs */
  readonly defaultAction: BridgeAction;
  
  /** Whether to show warnings in the UI */
  readonly showWarnings: boolean;
  
  /** Custom rules for specific ontology pairs */
  readonly rules?: readonly BridgeRule[];
}

/**
 * A specific bridge rule.
 */
export interface BridgeRule {
  readonly from: OntologyId;
  readonly to: OntologyId;
  readonly action: BridgeAction;
  readonly warning?: string;
}

// ============================================================================
// DEFAULT POLICY
// ============================================================================

const DEFAULT_POLICY: BridgePolicyConfig = {
  defaultAction: 'warn',
  showWarnings: true,
  rules: [
    // Western 12-TET is the default, allow bridging from it
    {
      from: 'western' as OntologyId,
      to: 'just' as OntologyId,
      action: 'warn',
      warning: 'Converting from 12-TET to Just Intonation may alter pitch relationships',
    },
    {
      from: 'just' as OntologyId,
      to: 'western' as OntologyId,
      action: 'warn',
      warning: 'Just Intonation intervals will be approximated to 12-TET',
    },
  ],
};

// ============================================================================
// BRIDGE POLICY CLASS
// ============================================================================

/**
 * Bridge policy manager.
 */
class BridgePolicy {
  private config: BridgePolicyConfig = DEFAULT_POLICY;
  private listeners = new Set<() => void>();

  /**
   * Checks if a bridge operation is allowed.
   */
  check(from: OntologyId, to: OntologyId): BridgeResult {
    // Same ontology - always allowed
    if (from === to) {
      return { allowed: true, action: 'allow' };
    }

    // Check for specific rule
    const rule = this.findRule(from, to);
    if (rule) {
      return {
        allowed: rule.action !== 'block',
        action: rule.action,
        warning: rule.warning,
      };
    }

    // Check registry compatibility
    if (ontologyRegistry.areCompatible(from, to)) {
      const warning = ontologyRegistry.getBridgeWarning(from) || 
                      ontologyRegistry.getBridgeWarning(to);
      return {
        allowed: true,
        action: warning ? 'warn' : 'allow',
        warning,
      };
    }

    // Use default action
    return {
      allowed: this.config.defaultAction !== 'block',
      action: this.config.defaultAction,
      warning: `Bridging from "${from}" to "${to}" may not preserve all musical relationships`,
      suggestion: 'Consider working within a single ontology for best results',
    };
  }

  /**
   * Finds a specific rule for an ontology pair.
   */
  private findRule(from: OntologyId, to: OntologyId): BridgeRule | undefined {
    return this.config.rules?.find(
      r => r.from === from && r.to === to
    );
  }

  /**
   * Updates the bridge policy configuration.
   */
  configure(config: Partial<BridgePolicyConfig>): void {
    this.config = { ...this.config, ...config };
    this.notifyListeners();
  }

  /**
   * Adds a bridge rule.
   */
  addRule(rule: BridgeRule): void {
    const existingRules = this.config.rules || [];
    
    // Remove any existing rule for this pair
    const filteredRules = existingRules.filter(
      r => !(r.from === rule.from && r.to === rule.to)
    );
    
    this.config = {
      ...this.config,
      rules: [...filteredRules, rule],
    };
    
    this.notifyListeners();
  }

  /**
   * Gets the current policy configuration.
   */
  getConfig(): Readonly<BridgePolicyConfig> {
    return this.config;
  }

  /**
   * Resets to default policy.
   */
  reset(): void {
    this.config = DEFAULT_POLICY;
    this.notifyListeners();
  }

  /**
   * Subscribes to policy changes.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        console.error('Error in bridge policy listener:', error);
      }
    }
  }
}

/**
 * Global bridge policy instance.
 */
export const bridgePolicy = new BridgePolicy();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Checks if bridging is allowed and returns a user-friendly message.
 */
export function checkBridge(from: OntologyId, to: OntologyId): {
  ok: boolean;
  message: string;
} {
  const result = bridgePolicy.check(from, to);
  
  if (result.action === 'block') {
    return {
      ok: false,
      message: result.warning || `Cannot bridge from "${from}" to "${to}"`,
    };
  }
  
  if (result.action === 'warn' && result.warning) {
    return {
      ok: true,
      message: result.warning,
    };
  }
  
  return {
    ok: true,
    message: '',
  };
}

/**
 * Asserts that bridging is allowed, throwing if not.
 */
export function assertBridgeAllowed(from: OntologyId, to: OntologyId): void {
  const result = bridgePolicy.check(from, to);
  if (!result.allowed) {
    throw new Error(
      result.warning || `Bridging from "${from}" to "${to}" is not allowed`
    );
  }
}
