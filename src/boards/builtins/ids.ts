/**
 * @fileoverview Builtin Board IDs
 * 
 * String literal union of all builtin board identifiers.
 * This allows type-level validation of board IDs.
 * 
 * @module @cardplay/boards/builtins/ids
 */

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
