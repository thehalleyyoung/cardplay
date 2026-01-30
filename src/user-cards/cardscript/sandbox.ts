/**
 * @fileoverview CardScript Capability Sandbox
 * 
 * Change 437: Sandbox layer for user cards.
 * CardScript cards run with restricted capabilities enforced at the host boundary.
 * 
 * @module @cardplay/user-cards/cardscript/sandbox
 */

import type { Capability } from '../../extensions/capabilities';

// ============================================================================
// SANDBOX TYPES
// ============================================================================

/**
 * Sandbox execution context.
 */
export interface SandboxContext {
  /** Allowed capabilities for this card */
  readonly allowedCapabilities: readonly Capability[];
  /** Maximum execution time (ms) */
  readonly maxExecutionTime: number;
  /** Maximum memory usage (bytes) */
  readonly maxMemoryUsage: number;
  /** Whether to allow network access */
  readonly allowNetwork: boolean;
  /** Whether to allow file system access */
  readonly allowFileSystem: boolean;
  /** Whether to allow Prolog KB queries */
  readonly allowKBQueries: boolean;
}

/**
 * Default sandbox context for user cards.
 */
export const DEFAULT_SANDBOX_CONTEXT: SandboxContext = {
  allowedCapabilities: [
    'read:spec',
    'read:events',
    'read:routing',
  ],
  maxExecutionTime: 1000, // 1 second
  maxMemoryUsage: 10 * 1024 * 1024, // 10 MB
  allowNetwork: false,
  allowFileSystem: false,
  allowKBQueries: false,
};

/**
 * Sandbox for user-provided cards.
 */
export const USER_CARD_SANDBOX_CONTEXT: SandboxContext = {
  allowedCapabilities: [
    'read:spec',
    'read:events',
    'read:routing',
    'read:clips',
    'write:events', // Allow event creation
  ],
  maxExecutionTime: 5000, // 5 seconds
  maxMemoryUsage: 50 * 1024 * 1024, // 50 MB
  allowNetwork: false,
  allowFileSystem: false,
  allowKBQueries: true, // Allow read-only KB queries
};

/**
 * Sandbox for trusted extension cards.
 */
export const TRUSTED_EXTENSION_SANDBOX_CONTEXT: SandboxContext = {
  allowedCapabilities: [
    'read:spec',
    'read:events',
    'read:routing',
    'read:clips',
    'write:spec',
    'write:events',
    'write:routing',
  ],
  maxExecutionTime: 10000, // 10 seconds
  maxMemoryUsage: 100 * 1024 * 1024, // 100 MB
  allowNetwork: false,
  allowFileSystem: false,
  allowKBQueries: true,
};

// ============================================================================
// CAPABILITY CHECKING
// ============================================================================

/**
 * Check if a capability is allowed in the sandbox context.
 */
export function isCapabilityAllowed(
  capability: Capability,
  context: SandboxContext
): boolean {
  return context.allowedCapabilities.includes(capability);
}

/**
 * Enforce capability check.
 * @throws {Error} if capability is not allowed
 */
export function enforceCapability(
  capability: Capability,
  context: SandboxContext,
  operation: string
): void {
  if (!isCapabilityAllowed(capability, context)) {
    throw new Error(
      `Operation '${operation}' requires capability '${capability}' ` +
      `which is not granted to this card. ` +
      `Available capabilities: ${context.allowedCapabilities.join(', ')}`
    );
  }
}

/**
 * Check multiple capabilities at once.
 */
export function hasAllCapabilities(
  capabilities: readonly Capability[],
  context: SandboxContext
): boolean {
  return capabilities.every(cap => isCapabilityAllowed(cap, context));
}

// ============================================================================
// RESOURCE LIMITS
// ============================================================================

/**
 * Execution timeout tracker.
 */
export class ExecutionTimeout {
  private startTime: number;
  private readonly maxTime: number;

  constructor(maxTime: number) {
    this.startTime = Date.now();
    this.maxTime = maxTime;
  }

  /**
   * Check if execution has timed out.
   * @throws {Error} if timeout exceeded
   */
  check(operation?: string): void {
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.maxTime) {
      const msg = operation
        ? `Operation '${operation}' exceeded time limit (${this.maxTime}ms)`
        : `Execution exceeded time limit (${this.maxTime}ms)`;
      throw new Error(msg);
    }
  }

  /**
   * Get remaining time in milliseconds.
   */
  remaining(): number {
    return Math.max(0, this.maxTime - (Date.now() - this.startTime));
  }

  /**
   * Reset the timer.
   */
  reset(): void {
    this.startTime = Date.now();
  }
}

// ============================================================================
// SANDBOXED API PROXY
// ============================================================================

/**
 * Create a sandboxed API proxy that enforces capability checks.
 */
export function createSandboxedAPI<T extends object>(
  api: T,
  context: SandboxContext,
  capabilityMap: Map<keyof T, Capability>
): T {
  const handler: ProxyHandler<T> = {
    get(target, prop, receiver) {
      const requiredCap = capabilityMap.get(prop as keyof T);
      
      if (requiredCap && !isCapabilityAllowed(requiredCap, context)) {
        throw new Error(
          `Access to '${String(prop)}' requires capability '${requiredCap}' ` +
          `which is not granted to this card.`
        );
      }
      
      const value = Reflect.get(target, prop, receiver);
      
      // Wrap functions to add timeout checking
      if (typeof value === 'function') {
        return function(this: unknown, ...args: unknown[]) {
          const timeout = new ExecutionTimeout(context.maxExecutionTime);
          timeout.check(String(prop));
          return value.apply(this === receiver ? target : this, args);
        };
      }
      
      return value;
    },
    
    set(target, prop, value) {
      const requiredCap = capabilityMap.get(prop as keyof T);
      
      if (requiredCap && !isCapabilityAllowed(requiredCap, context)) {
        throw new Error(
          `Setting '${String(prop)}' requires capability '${requiredCap}' ` +
          `which is not granted to this card.`
        );
      }
      
      return Reflect.set(target, prop, value);
    },
  };
  
  return new Proxy(api, handler);
}

// ============================================================================
// SANDBOX VIOLATION TRACKING
// ============================================================================

/**
 * Sandbox violation event.
 */
export interface SandboxViolation {
  readonly timestamp: number;
  readonly cardId: string;
  readonly violation: string;
  readonly capability?: Capability;
  readonly severity: 'error' | 'warning';
}

const violations: SandboxViolation[] = [];

/**
 * Record a sandbox violation.
 */
export function recordViolation(violation: Omit<SandboxViolation, 'timestamp'>): void {
  violations.push({
    ...violation,
    timestamp: Date.now(),
  });
  
  // Keep only last 1000 violations
  if (violations.length > 1000) {
    violations.shift();
  }
}

/**
 * Get recent violations for a card.
 */
export function getViolations(cardId?: string): readonly SandboxViolation[] {
  if (cardId) {
    return violations.filter(v => v.cardId === cardId);
  }
  return violations;
}

/**
 * Clear violation history.
 */
export function clearViolations(cardId?: string): void {
  if (cardId) {
    const filtered = violations.filter(v => v.cardId !== cardId);
    violations.length = 0;
    violations.push(...filtered);
  } else {
    violations.length = 0;
  }
}
