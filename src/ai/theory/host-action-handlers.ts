/**
 * @fileoverview HostAction Handler Registry
 * 
 * Changes 435-437: Extension points for HostActions.
 * Allows packs to register handlers for namespaced HostAction types.
 * Integrates with capability policy for safety gating.
 * 
 * @module @cardplay/ai/theory/host-action-handlers
 */

import type { HostAction } from './host-actions';
import type { MusicSpec } from './music-spec';
import type { CapabilityId } from '../../extensions/capabilities';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of applying a host action.
 */
export interface ApplyResult {
  /** Whether the action was successfully applied */
  readonly success: boolean;
  /** Updated spec (if changed) */
  readonly spec?: MusicSpec;
  /** Error message (if failed) */
  readonly error?: string;
  /** Diagnostic/info messages */
  readonly messages?: readonly string[];
}

/**
 * Host action handler function.
 */
export type HostActionHandler = (
  action: HostAction,
  currentSpec: MusicSpec
) => ApplyResult | Promise<ApplyResult>;

/**
 * Host action handler registration entry.
 */
export interface HostActionHandlerEntry {
  /** Action type discriminant (e.g., 'my-pack:custom-action') */
  readonly actionType: string;
  /** Handler function */
  readonly handler: HostActionHandler;
  /** Required capabilities */
  readonly requiredCapabilities?: readonly CapabilityId[];
  /** Handler version */
  readonly version: string;
  /** Handler description */
  readonly description?: string;
}

// ============================================================================
// REGISTRY
// ============================================================================

const handlerRegistry = new Map<string, HostActionHandlerEntry>();

/**
 * Change 435: Register a host action handler.
 * 
 * Namespaced action types (e.g., 'my-pack:action') are allowed.
 * Builtin action types cannot be overridden.
 * 
 * @param entry - Handler registration
 * @throws {Error} if trying to override builtin handler
 */
export function registerHostActionHandler(entry: HostActionHandlerEntry): void {
  // Check for builtin action type collision
  const isBuiltin = BUILTIN_ACTION_TYPES.has(entry.actionType);
  
  if (isBuiltin) {
    throw new Error(
      `Cannot register handler for builtin action type '${entry.actionType}'. ` +
      `Use a namespaced action type (e.g., 'my-pack:${entry.actionType}').`
    );
  }
  
  // Enforce namespacing for custom action types
  if (!entry.actionType.includes(':')) {
    throw new Error(
      `Custom action type '${entry.actionType}' must use a namespaced ID ` +
      `(e.g., 'my-pack:${entry.actionType}').`
    );
  }
  
  const existing = handlerRegistry.get(entry.actionType);
  if (existing) {
    console.warn(
      `HostAction handler for '${entry.actionType}' re-registered ` +
      `(${existing.version} → ${entry.version})`
    );
  }
  
  handlerRegistry.set(entry.actionType, entry);
}

/**
 * Gets handler for an action type.
 */
export function getHostActionHandler(
  actionType: string
): HostActionHandlerEntry | undefined {
  return handlerRegistry.get(actionType);
}

/**
 * Lists all registered handlers.
 */
export function listHostActionHandlers(): readonly HostActionHandlerEntry[] {
  return Array.from(handlerRegistry.values());
}

/**
 * Change 396: Check if an action type has a registered handler.
 * Unknown extension actions are safe (return false).
 */
export function hasHostActionHandler(actionType: string): boolean {
  return handlerRegistry.has(actionType);
}

/**
 * Change 436: Get required capabilities for an action.
 * Returns empty array if no handler registered.
 */
export function getRequiredCapabilities(actionType: string): readonly CapabilityId[] {
  const entry = handlerRegistry.get(actionType);
  return entry?.requiredCapabilities ?? [];
}

// ============================================================================
// BUILTIN ACTION TYPES
// ============================================================================

/**
 * Set of builtin action types that cannot be overridden.
 */
const BUILTIN_ACTION_TYPES = new Set<string>([
  'add-constraint',
  'remove-constraint',
  'update-constraint',
  'set-tonality-model',
  'set-mode',
  'set-key',
  'set-tempo',
  'set-meter',
  'set-culture',
  'set-style',
  'suggest-chord-progression',
  'apply-phrase-schema',
  'insert-notes',
  'auto-harmonize',
  'generate-accompaniment',
  'quantize-rhythm',
  'suggest-cadence',
]);

/**
 * Helper: Check if an action type is builtin.
 */
export function isBuiltinActionType(actionType: string): boolean {
  return BUILTIN_ACTION_TYPES.has(actionType);
}

// ============================================================================
// EXTENSION HANDLER EXAMPLE
// ============================================================================

/**
 * Example extension handler registration.
 * Extensions would call this in their initialization code.
 */
export function registerExampleExtensionHandlers(): void {
  // Example: Custom micro-tonal action
  registerHostActionHandler({
    actionType: 'microtonal-pack:set-tuning',
    version: '1.0',
    description: 'Set custom microtonal tuning',
    requiredCapabilities: ['write:spec'],
    handler: async (action, currentSpec) => {
      // Custom logic here
      if (action.action !== 'microtonal-pack:set-tuning') {
        return { success: false, error: 'Invalid action type' };
      }
      
      // Apply custom tuning logic
      return {
        success: true,
        spec: currentSpec, // Would be modified
        messages: ['Custom tuning applied'],
      };
    },
  });
}
