/**
 * @fileoverview Builtin Board IDs
 * 
 * String literal union of all builtin board identifiers.
 * This allows type-level validation of board IDs.
 * 
 * ## ID Convention
 * 
 * - **Builtin boards**: Use non-namespaced IDs (e.g., 'basic-tracker')
 *   - Format: lowercase letters, numbers, hyphens
 *   - No colon separator
 *   
 * - **External/pack boards**: Must use namespaced IDs (e.g., 'my-pack:custom-board')
 *   - Format: namespace:local-id
 *   - Both parts use lowercase letters, numbers, hyphens
 * 
 * @module @cardplay/boards/builtins/ids
 */

import { isBuiltinId, isNamespacedId } from '../../canon/id-validation';

/**
 * All builtin board IDs.
 */
export type BuiltinBoardId =
  // Manual Boards (Phase F)
  | 'basic-tracker'
  | 'notation-manual'
  | 'basic-sampler'
  | 'basic-session'
  
  // Assisted Boards (Phase G)
  | 'tracker-harmony'
  | 'tracker-phrases'
  | 'session-generators'
  | 'notation-harmony'
  
  // Generative Boards (Phase H)
  | 'ai-arranger'
  | 'ai-composition'
  | 'generative-ambient'
  
  // Hybrid Boards (Phase I)
  | 'composer'
  | 'producer'
  | 'live-performance'

  // Modular / Specialized (M177)
  | 'modular-routing';

/**
 * Check if a string is a known builtin board ID.
 */
export function isBuiltinBoardId(id: string): id is BuiltinBoardId {
  const builtinIds: Set<string> = new Set([
    'basic-tracker',
    'notation-manual',
    'basic-sampler',
    'basic-session',
    'tracker-harmony',
    'tracker-phrases',
    'session-generators',
    'notation-harmony',
    'ai-arranger',
    'ai-composition',
    'generative-ambient',
    'composer',
    'producer',
    'live-performance',
    'modular-routing',
  ]);

  return builtinIds.has(id);
}

/**
 * Check if a board ID is valid (builtin or properly namespaced).
 */
export function isValidBoardId(id: string): boolean {
  // Builtin boards use non-namespaced IDs
  if (isBuiltinBoardId(id)) {
    return true;
  }
  
  // External boards must use namespaced IDs
  return isNamespacedId(id);
}

/**
 * Validate a board ID, rejecting invalid formats.
 * 
 * @param id - Board ID to validate
 * @param isBuiltin - Whether this is a builtin board registration
 * @throws Error if ID format is invalid
 */
export function validateBoardId(id: string, isBuiltin = false): void {
  if (isBuiltin) {
    if (!isBuiltinId(id)) {
      throw new Error(
        `Invalid builtin board ID '${id}'. Builtin IDs must be lowercase with hyphens, no colons.`
      );
    }
  } else {
    if (!isNamespacedId(id)) {
      throw new Error(
        `External board ID '${id}' must be namespaced (e.g., 'my-pack:${id}')`
      );
    }
  }
}
