/**
 * @fileoverview CardPlay ID Helper
 * 
 * Provides a unified representation for CardPlay identifiers that can be
 * either builtin (no namespace) or namespaced (extension/pack).
 * 
 * ID Format:
 * - Builtin: lowercase with hyphens (e.g., 'pattern-deck', 'basic-tracker')
 * - Namespaced: namespace:local-id (e.g., 'my-pack:custom-card')
 * 
 * @module @cardplay/canon/cardplay-id
 */

import {
  isBuiltinId,
  isNamespacedId,
  validateId,
  parseNamespacedId,
  createNamespacedId,
  type IdValidationResult,
  type CardPlayId,
} from './id-validation';

// Re-export for consumers
export { type CardPlayId };

/**
 * Parsed CardPlay ID structure.
 */
export interface ParsedCardPlayId {
  /** Original ID string */
  readonly raw: CardPlayId;
  /** Whether this is a builtin ID */
  readonly isBuiltin: boolean;
  /** Whether this is a namespaced ID */
  readonly isNamespaced: boolean;
  /** Namespace (empty string for builtins) */
  readonly namespace: string;
  /** Local ID (the full ID for builtins, local part for namespaced) */
  readonly localId: string;
}

/**
 * Options for creating a CardPlay ID.
 */
export interface CardPlayIdOptions {
  /** If true, allows builtin-style IDs (no namespace) */
  allowBuiltin?: boolean;
  /** If true, requires namespaced IDs */
  requireNamespaced?: boolean;
}

// ============================================================================
// PARSING
// ============================================================================

/**
 * Parse a CardPlay ID into its components.
 * 
 * @param id - The ID to parse
 * @returns Parsed ID structure, or null if invalid
 * 
 * @example
 * parseCardPlayId('pattern-deck')
 * // { raw: 'pattern-deck', isBuiltin: true, isNamespaced: false, namespace: '', localId: 'pattern-deck' }
 * 
 * parseCardPlayId('my-pack:custom-card')
 * // { raw: 'my-pack:custom-card', isBuiltin: false, isNamespaced: true, namespace: 'my-pack', localId: 'custom-card' }
 */
export function parseCardPlayId(id: string): ParsedCardPlayId | null {
  if (isNamespacedId(id)) {
    const parsed = parseNamespacedId(id);
    if (!parsed) return null;
    
    return {
      raw: id as CardPlayId,
      isBuiltin: false,
      isNamespaced: true,
      namespace: parsed.namespace,
      localId: parsed.localId,
    };
  }
  
  if (isBuiltinId(id)) {
    return {
      raw: id as CardPlayId,
      isBuiltin: true,
      isNamespaced: false,
      namespace: '',
      localId: id,
    };
  }
  
  return null;
}

/**
 * Parse a CardPlay ID, throwing if invalid.
 */
export function parseCardPlayIdStrict(id: string): ParsedCardPlayId {
  const parsed = parseCardPlayId(id);
  if (!parsed) {
    throw new Error(`Invalid CardPlay ID: '${id}'`);
  }
  return parsed;
}

// ============================================================================
// CREATION
// ============================================================================

/**
 * Create a CardPlay ID from namespace and local ID.
 * If namespace is empty, creates a builtin-style ID.
 * 
 * @param namespace - Namespace (empty for builtin)
 * @param localId - Local ID
 * @returns Formatted CardPlay ID
 */
export function createCardPlayId(namespace: string, localId: string): CardPlayId {
  if (!namespace) {
    return localId as CardPlayId;
  }
  return createNamespacedId(namespace, localId) as CardPlayId;
}

/**
 * Create a builtin CardPlay ID (no namespace).
 */
export function createBuiltinId(localId: string): CardPlayId {
  if (localId.includes(':')) {
    throw new Error(`Builtin ID cannot contain colon: '${localId}'`);
  }
  return localId as CardPlayId;
}

/**
 * Create a namespaced CardPlay ID.
 */
export function createExtensionId(namespace: string, localId: string): CardPlayId {
  if (!namespace) {
    throw new Error('Extension ID requires a namespace');
  }
  return createNamespacedId(namespace, localId) as CardPlayId;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate a CardPlay ID.
 * 
 * @param id - ID to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateCardPlayId(
  id: string,
  options: CardPlayIdOptions = {}
): IdValidationResult {
  // Build options object only with defined values
  const validateOptions: { requireNamespaced?: boolean; requireBuiltin?: boolean } = {};
  if (options.requireNamespaced !== undefined) {
    validateOptions.requireNamespaced = options.requireNamespaced;
  }
  
  const result = validateId(id, validateOptions);
  
  if (result.valid === false) {
    return result;
  }
  
  // Additional checks
  if (options.requireNamespaced && !isNamespacedId(id)) {
    return {
      valid: false,
      error: `ID must be namespaced (e.g., 'namespace:${id}')`,
    };
  }
  
  if (options.allowBuiltin === false && isBuiltinId(id)) {
    return {
      valid: false,
      error: `Builtin-style ID not allowed. Use namespaced ID.`,
    };
  }
  
  return result;
}

/**
 * Check if a value is a valid CardPlay ID.
 */
export function isCardPlayId(value: unknown): value is CardPlayId {
  if (typeof value !== 'string') return false;
  return isBuiltinId(value) || isNamespacedId(value);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get the display name for a CardPlay ID.
 * For namespaced IDs, returns just the local part.
 * For builtin IDs, returns the full ID.
 */
export function getDisplayName(id: CardPlayId): string {
  const parsed = parseCardPlayId(id);
  return parsed?.localId ?? id;
}

/**
 * Get the namespace from a CardPlay ID.
 * Returns empty string for builtin IDs.
 */
export function getIdNamespace(id: CardPlayId): string {
  const parsed = parseCardPlayId(id);
  return parsed?.namespace ?? '';
}

/**
 * Check if two CardPlay IDs are equal.
 */
export function idsEqual(a: CardPlayId, b: CardPlayId): boolean {
  return a === b;
}

/**
 * Sort CardPlay IDs (builtins first, then by namespace, then by local ID).
 */
export function sortCardPlayIds(ids: CardPlayId[]): CardPlayId[] {
  return [...ids].sort((a, b) => {
    const parsedA = parseCardPlayId(a);
    const parsedB = parseCardPlayId(b);
    
    if (!parsedA && !parsedB) return 0;
    if (!parsedA) return 1;
    if (!parsedB) return -1;
    
    // Builtins first
    if (parsedA.isBuiltin && !parsedB.isBuiltin) return -1;
    if (!parsedA.isBuiltin && parsedB.isBuiltin) return 1;
    
    // Then by namespace
    const nsCompare = parsedA.namespace.localeCompare(parsedB.namespace);
    if (nsCompare !== 0) return nsCompare;
    
    // Then by local ID
    return parsedA.localId.localeCompare(parsedB.localId);
  });
}
