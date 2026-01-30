/**
 * @fileoverview Namespaced ID Utilities
 * 
 * Provides utilities for working with namespaced IDs in the format:
 * <namespace>:<name>
 * 
 * All extension-facing IDs (cards, constraints, packs, templates, port types, 
 * actions) must use namespaced IDs. Builtin IDs may omit the namespace.
 * 
 * @module @cardplay/canon/namespaced-id
 * @see cardplay/docs/canon/ids.md
 * @see to_fix_repo_plan_500.md Change 052
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * A namespaced ID in the format <namespace>:<name>.
 * Examples: "carnatic:raga", "vendor:custom_card", "user:my_preset"
 */
export type NamespacedId = string & { readonly __namespacedId?: unique symbol };

/**
 * Parsed components of a namespaced ID.
 */
export interface ParsedNamespacedId {
  /** The namespace portion (e.g., "carnatic", "vendor", "user") */
  namespace: string;
  /** The name portion (e.g., "raga", "custom_card", "my_preset") */
  name: string;
  /** The original full ID */
  fullId: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

/** Pattern for valid namespaced ID: namespace:name */
const NAMESPACED_ID_PATTERN = /^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/i;

/** Pattern for valid namespace: lowercase letters, numbers, hyphens, underscores */
const NAMESPACE_PATTERN = /^[a-z][a-z0-9_-]*$/i;

/** Pattern for valid name portion */
const NAME_PATTERN = /^[a-z][a-z0-9_-]*$/i;

/**
 * Check if a string is a valid namespaced ID.
 * 
 * @param id - The ID to check
 * @returns True if the ID is in the format <namespace>:<name>
 * 
 * @example
 * isNamespacedId('carnatic:raga')    // true
 * isNamespacedId('my-card')          // false (no namespace)
 * isNamespacedId('bad::id')          // false (invalid format)
 */
export function isNamespacedId(id: string): id is NamespacedId {
  return NAMESPACED_ID_PATTERN.test(id);
}

/**
 * Check if a string is a valid namespace.
 * 
 * @param namespace - The namespace to check
 * @returns True if the namespace is valid
 */
export function isValidNamespace(namespace: string): boolean {
  return NAMESPACE_PATTERN.test(namespace);
}

/**
 * Check if a string is a valid name portion.
 * 
 * @param name - The name to check
 * @returns True if the name is valid
 */
export function isValidName(name: string): boolean {
  return NAME_PATTERN.test(name);
}

// ============================================================================
// PARSING
// ============================================================================

/**
 * Parse a namespaced ID into its components.
 * 
 * @param id - The namespaced ID to parse
 * @returns The parsed components, or null if invalid
 * 
 * @example
 * parseNamespacedId('carnatic:raga')
 * // { namespace: 'carnatic', name: 'raga', fullId: 'carnatic:raga' }
 * 
 * parseNamespacedId('my-card')
 * // null (not namespaced)
 */
export function parseNamespacedId(id: string): ParsedNamespacedId | null {
  if (!isNamespacedId(id)) {
    return null;
  }

  const colonIndex = id.indexOf(':');
  if (colonIndex === -1) {
    return null;
  }

  const namespace = id.substring(0, colonIndex);
  const name = id.substring(colonIndex + 1);

  return {
    namespace,
    name,
    fullId: id,
  };
}

/**
 * Parse a namespaced ID, throwing if invalid.
 * 
 * @param id - The namespaced ID to parse
 * @returns The parsed components
 * @throws Error if the ID is not a valid namespaced ID
 */
export function parseNamespacedIdStrict(id: string): ParsedNamespacedId {
  const parsed = parseNamespacedId(id);
  if (!parsed) {
    throw new Error(`Invalid namespaced ID: "${id}". Expected format: <namespace>:<name>`);
  }
  return parsed;
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format a namespace and name into a namespaced ID.
 * 
 * @param namespace - The namespace portion
 * @param name - The name portion
 * @returns The formatted namespaced ID
 * @throws Error if namespace or name is invalid
 * 
 * @example
 * formatNamespacedId('carnatic', 'raga')
 * // 'carnatic:raga'
 */
export function formatNamespacedId(namespace: string, name: string): NamespacedId {
  if (!isValidNamespace(namespace)) {
    throw new Error(`Invalid namespace: "${namespace}"`);
  }
  if (!isValidName(name)) {
    throw new Error(`Invalid name: "${name}"`);
  }
  return `${namespace}:${name}` as NamespacedId;
}

/**
 * Extract just the name portion from an ID (namespaced or not).
 * 
 * @param id - The ID (may or may not be namespaced)
 * @returns The name portion (or the whole ID if not namespaced)
 */
export function extractName(id: string): string {
  const colonIndex = id.indexOf(':');
  return colonIndex === -1 ? id : id.substring(colonIndex + 1);
}

/**
 * Extract just the namespace portion from an ID.
 * 
 * @param id - The ID (may or may not be namespaced)
 * @returns The namespace portion, or null if not namespaced
 */
export function extractNamespace(id: string): string | null {
  const colonIndex = id.indexOf(':');
  return colonIndex === -1 ? null : id.substring(0, colonIndex);
}

// ============================================================================
// ID CLASSIFICATION
// ============================================================================

/**
 * Result of classifying an ID.
 */
export interface IdClassification {
  /** Whether the ID is namespaced */
  isNamespaced: boolean;
  /** Whether the ID appears to be a builtin (not namespaced) */
  isBuiltin: boolean;
  /** The namespace if present */
  namespace: string | null;
  /** The name portion */
  name: string;
}

/**
 * Classify an ID as builtin or namespaced.
 * 
 * @param id - The ID to classify
 * @returns Classification information
 */
export function classifyId(id: string): IdClassification {
  const namespace = extractNamespace(id);
  const name = extractName(id);
  const isNamespaced = namespace !== null;

  return {
    isNamespaced,
    isBuiltin: !isNamespaced,
    namespace,
    name,
  };
}

/**
 * Validate that a non-builtin ID is properly namespaced.
 * 
 * @param id - The ID to validate
 * @param isBuiltin - Whether this ID is known to be a builtin
 * @returns Validation result with error message if invalid
 */
export function validateExtensionId(
  id: string,
  isBuiltin: boolean = false
): { valid: boolean; error?: string } {
  if (isBuiltin) {
    // Builtins don't require namespacing
    return { valid: true };
  }

  if (!isNamespacedId(id)) {
    return {
      valid: false,
      error: `Extension ID "${id}" must be namespaced (format: <namespace>:<name>)`,
    };
  }

  return { valid: true };
}
