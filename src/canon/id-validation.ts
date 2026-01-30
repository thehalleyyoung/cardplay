/**
 * @fileoverview Canonical ID Validation
 * 
 * Centralizes builtin-vs-extension ID checks for all CardPlay identifiers.
 * Provides validation for:
 * - Builtin IDs (no namespace prefix)
 * - Extension/custom IDs (namespaced with 'namespace:id' format)
 * 
 * Naming convention:
 * - Builtin IDs: lowercase with hyphens (e.g., 'pattern-editor', 'tracker-board')
 * - Extension IDs: namespace:id format (e.g., 'my-pack:custom-card', 'user:my-template')
 * 
 * @module @cardplay/canon/id-validation
 * @see cardplay/docs/canon/ids.md
 */

// ============================================================================
// ID FORMAT PATTERNS
// ============================================================================

/**
 * Pattern for valid builtin IDs.
 * Lowercase letters, numbers, hyphens. No colons.
 */
const BUILTIN_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * Pattern for namespaced extension IDs.
 * Format: namespace:id where both parts are valid identifiers.
 */
const NAMESPACED_ID_PATTERN = /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/;

/**
 * Reserved namespace prefixes that cannot be used by extensions.
 */
export const RESERVED_NAMESPACES = [
  'cardplay',    // Core CardPlay
  'builtin',     // Builtin items (explicit)
  'system',      // System-level
  'internal',    // Internal use
] as const;

export type ReservedNamespace = typeof RESERVED_NAMESPACES[number];

// ============================================================================
// ID TYPE DEFINITIONS
// ============================================================================

/**
 * A builtin ID (no namespace).
 */
export type BuiltinId = string & { readonly __builtinId: unique symbol };

/**
 * A namespaced extension ID.
 */
export type NamespacedId = `${string}:${string}`;

/**
 * Any valid CardPlay ID (builtin or namespaced).
 */
export type CardPlayId = BuiltinId | NamespacedId;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if an ID is a valid builtin ID.
 * 
 * @param id - ID to check
 * @returns true if ID follows builtin format (no colon)
 * 
 * @example
 * isBuiltinId('pattern-editor')  // true
 * isBuiltinId('my-pack:custom')  // false
 */
export function isBuiltinId(id: string): boolean {
  return BUILTIN_ID_PATTERN.test(id) && !id.includes(':');
}

/**
 * Check if an ID is a namespaced extension ID.
 * 
 * @param id - ID to check
 * @returns true if ID follows namespace:id format
 * 
 * @example
 * isNamespacedId('my-pack:custom')  // true
 * isNamespacedId('pattern-editor')  // false
 */
export function isNamespacedId(id: string): id is NamespacedId {
  return NAMESPACED_ID_PATTERN.test(id);
}

/**
 * Check if an ID is valid (either builtin or properly namespaced).
 * 
 * @param id - ID to check
 * @returns true if ID is valid
 */
export function isValidId(id: string): boolean {
  return isBuiltinId(id) || isNamespacedId(id);
}

/**
 * Check if a namespace is reserved.
 */
export function isReservedNamespace(namespace: string): namespace is ReservedNamespace {
  return RESERVED_NAMESPACES.includes(namespace as ReservedNamespace);
}

/**
 * Parse a namespaced ID into its components.
 * 
 * @param id - Namespaced ID
 * @returns Object with namespace and localId, or null if not namespaced
 * 
 * @example
 * parseNamespacedId('my-pack:custom') // { namespace: 'my-pack', localId: 'custom' }
 * parseNamespacedId('pattern-editor') // null
 */
export function parseNamespacedId(id: string): { namespace: string; localId: string } | null {
  const colonIndex = id.indexOf(':');
  if (colonIndex === -1) return null;
  
  const namespace = id.slice(0, colonIndex);
  const localId = id.slice(colonIndex + 1);
  
  if (!namespace || !localId) return null;
  
  return { namespace, localId };
}

/**
 * Create a namespaced ID from components.
 * 
 * @param namespace - The namespace
 * @param localId - The local ID within the namespace
 * @returns Formatted namespaced ID
 */
export function createNamespacedId(namespace: string, localId: string): NamespacedId {
  return `${namespace}:${localId}` as NamespacedId;
}

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface IdValidationSuccess {
  readonly valid: true;
  readonly kind: 'builtin' | 'namespaced';
  readonly namespace?: string;
  readonly localId: string;
}

export interface IdValidationFailure {
  readonly valid: false;
  readonly error: string;
}

export type IdValidationResult = IdValidationSuccess | IdValidationFailure;

/**
 * Validate an ID and return detailed result.
 * 
 * @param id - ID to validate
 * @param options - Validation options
 * @returns Validation result with details
 */
export function validateId(
  id: string,
  options: {
    /** If true, rejects builtin IDs (requires namespaced) */
    requireNamespaced?: boolean;
    /** If true, rejects namespaced IDs (requires builtin) */
    requireBuiltin?: boolean;
    /** Reject specific namespaces */
    rejectNamespaces?: string[];
  } = {}
): IdValidationResult {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'ID must be a non-empty string' };
  }

  const trimmed = id.trim();
  if (trimmed !== id) {
    return { valid: false, error: 'ID must not have leading/trailing whitespace' };
  }

  // Check for namespaced format
  if (isNamespacedId(id)) {
    if (options.requireBuiltin) {
      return { valid: false, error: 'Expected builtin ID, got namespaced ID' };
    }

    const parsed = parseNamespacedId(id)!;
    
    // Check reserved namespaces
    if (isReservedNamespace(parsed.namespace)) {
      return { valid: false, error: `Namespace '${parsed.namespace}' is reserved` };
    }

    // Check rejected namespaces
    if (options.rejectNamespaces?.includes(parsed.namespace)) {
      return { valid: false, error: `Namespace '${parsed.namespace}' is not allowed` };
    }

    return {
      valid: true,
      kind: 'namespaced',
      namespace: parsed.namespace,
      localId: parsed.localId,
    };
  }

  // Check for builtin format
  if (isBuiltinId(id)) {
    if (options.requireNamespaced) {
      return { valid: false, error: 'Expected namespaced ID, got builtin ID' };
    }

    return {
      valid: true,
      kind: 'builtin',
      localId: id,
    };
  }

  // Invalid format
  if (id.includes(':')) {
    return { valid: false, error: 'Invalid namespaced ID format. Use namespace:local-id' };
  }

  return { valid: false, error: 'Invalid ID format. Use lowercase letters, numbers, and hyphens' };
}

/**
 * Assert that an ID is valid, throwing if not.
 */
export function assertValidId(id: string, context?: string): void {
  const result = validateId(id);
  if (result.valid === false) {
    const prefix = context ? `${context}: ` : '';
    throw new Error(`${prefix}${result.error}`);
  }
}

/**
 * Assert that an ID is a valid extension ID (namespaced, non-reserved).
 */
export function assertExtensionId(id: string, context?: string): void {
  const result = validateId(id, { requireNamespaced: true });
  if (result.valid === false) {
    const prefix = context ? `${context}: ` : '';
    throw new Error(`${prefix}${result.error}`);
  }
}

/**
 * Assert that an ID is a valid builtin ID.
 */
export function assertBuiltinId(id: string, context?: string): void {
  const result = validateId(id, { requireBuiltin: true });
  if (result.valid === false) {
    const prefix = context ? `${context}: ` : '';
    throw new Error(`${prefix}${result.error}`);
  }
}
