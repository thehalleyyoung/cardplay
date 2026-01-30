/**
 * GOFAI Canon — GOFAI ID Type System
 *
 * Step 052 from gofai_goalB.md: "Define `GofaiId` as a namespaced ID type that
 * composes with `CardPlayId` rules; reject non-namespaced extension entries."
 *
 * This module defines the ID system for GOFAI vocabulary, ensuring:
 * 1. Consistent namespacing with CardPlay's ID conventions
 * 2. Distinction between builtin and extension IDs
 * 3. Validation and parsing of ID strings
 * 4. Type-safe ID composition
 *
 * @module gofai/canon/gofai-id
 */

import type { CardPlayId } from '../../canon/cardplay-id';

// =============================================================================
// ID Types
// =============================================================================

/**
 * A GOFAI identifier with optional namespace.
 *
 * Format:
 * - Builtin: `category:item` (e.g., `lex:verb:make`, `axis:brightness`)
 * - Extension: `namespace:category:item` (e.g., `my-pack:lex:verb:stutter`)
 *
 * Rules:
 * - Builtin IDs NEVER have namespace prefix
 * - Extension IDs MUST have namespace prefix matching pack ID
 * - Reserved namespaces: `gofai`, `core`, `cardplay`, `builtin`, `system`, `user`
 * - Namespaces follow CardPlay ID rules: lowercase, alphanumeric + hyphen, no leading/trailing hyphens
 */
export type GofaiId = string & { readonly __brand: 'GofaiId' };

/**
 * A lexeme ID (vocabulary entry).
 *
 * Format: `[namespace:]lex:category:lemma`
 * Examples:
 * - `lex:verb:make` (builtin)
 * - `lex:adj:bright` (builtin)
 * - `my-pack:lex:verb:stutter` (extension)
 */
export type LexemeId = GofaiId & { readonly __lexeme: true };

/**
 * An axis ID (perceptual dimension).
 *
 * Format: `[namespace:]axis:name`
 * Examples:
 * - `axis:brightness` (builtin)
 * - `axis:width` (builtin)
 * - `my-pack:axis:grit` (extension)
 */
export type AxisId = GofaiId & { readonly __axis: true };

/**
 * An opcode ID (edit operation).
 *
 * Format: `[namespace:]op:name`
 * Examples:
 * - `op:raise_register` (builtin)
 * - `op:quantize` (builtin)
 * - `my-pack:op:glitch` (extension)
 */
export type OpcodeId = GofaiId & { readonly __opcode: true };

/**
 * A constraint ID (requirement or check).
 *
 * Format: `[namespace:]constraint:name`
 * Examples:
 * - `constraint:preserve_melody` (builtin)
 * - `constraint:only_change` (builtin)
 * - `my-pack:constraint:avoid_clash` (extension)
 */
export type ConstraintId = GofaiId & { readonly __constraint: true };

/**
 * A section type ID (song structure).
 *
 * Format: `[namespace:]section:name`
 * Examples:
 * - `section:verse` (builtin)
 * - `section:chorus` (builtin)
 * - `my-pack:section:breakdown` (extension)
 */
export type SectionTypeId = GofaiId & { readonly __section: true };

/**
 * A layer role ID (track function).
 *
 * Format: `[namespace:]layer:name`
 * Examples:
 * - `layer:drums` (builtin)
 * - `layer:bass` (builtin)
 * - `my-pack:layer:lead_synth` (extension)
 */
export type LayerRoleId = GofaiId & { readonly __layer: true };

/**
 * A unit ID (measurement).
 *
 * Format: `[namespace:]unit:name`
 * Examples:
 * - `unit:bpm` (builtin)
 * - `unit:semitones` (builtin)
 * - `my-pack:unit:microtones` (extension)
 */
export type UnitId = GofaiId & { readonly __unit: true };

// =============================================================================
// Reserved Namespaces
// =============================================================================

/**
 * Namespaces reserved for system use. Extensions may NOT use these.
 */
export const RESERVED_NAMESPACES = [
  'gofai',
  'core',
  'cardplay',
  'builtin',
  'system',
  'user',
  'test',
  'internal',
] as const;

export type ReservedNamespace = typeof RESERVED_NAMESPACES[number];

/**
 * Check if a namespace is reserved.
 */
export function isReservedNamespace(namespace: string): namespace is ReservedNamespace {
  return RESERVED_NAMESPACES.includes(namespace as ReservedNamespace);
}

/**
 * Validate namespace format according to CardPlay ID rules:
 * - lowercase letters, numbers, and hyphens only
 * - no leading or trailing hyphens
 * - no consecutive hyphens
 * - not a reserved namespace
 */
export function isValidNamespace(namespace: string): boolean {
  if (isReservedNamespace(namespace)) {
    return false;
  }
  
  // Check format: lowercase alphanumeric + hyphens, no leading/trailing/consecutive hyphens
  const namespaceRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return namespaceRegex.test(namespace);
}

// =============================================================================
// ID Categories
// =============================================================================

/**
 * Valid GOFAI ID categories.
 */
export const GOFAI_ID_CATEGORIES = [
  'lex',        // Lexemes (vocabulary)
  'axis',       // Perceptual axes
  'op',         // Opcodes (operations)
  'constraint', // Constraints
  'section',    // Section types
  'layer',      // Layer roles
  'unit',       // Units of measurement
  'schema',     // Schemas
  'theory',     // Theory predicates
  'frame',      // Semantic frames
] as const;

export type GofaiIdCategory = typeof GOFAI_ID_CATEGORIES[number];

/**
 * Check if a string is a valid GOFAI ID category.
 */
export function isGofaiIdCategory(category: string): category is GofaiIdCategory {
  return GOFAI_ID_CATEGORIES.includes(category as GofaiIdCategory);
}

// =============================================================================
// ID Parsing
// =============================================================================

/**
 * Parsed structure of a GOFAI ID.
 */
export interface ParsedGofaiId {
  /** Full ID string */
  readonly full: GofaiId;

  /** Namespace (undefined for builtin) */
  readonly namespace?: string;

  /** Category (lex, axis, op, etc.) */
  readonly category: string;

  /** Path components after category */
  readonly path: readonly string[];

  /** Whether this is a builtin ID */
  readonly isBuiltin: boolean;

  /** Whether this is an extension ID */
  readonly isExtension: boolean;
}

/**
 * Parse a GOFAI ID string into its components.
 *
 * @param id - ID string to parse
 * @returns Parsed structure or undefined if invalid
 */
export function parseGofaiId(id: string): ParsedGofaiId | undefined {
  const parts = id.split(':');
  if (parts.length < 2) {
    return undefined; // Must have at least category:name
  }

  // Check if first part is a namespace or category
  const firstPart = parts[0];
  if (!firstPart) return undefined;

  const isNamespace = !isGofaiIdCategory(firstPart);

  if (isNamespace) {
    // Extension ID: namespace:category:path...
    if (parts.length < 3) {
      return undefined; // Extension must have namespace:category:name minimum
    }

    const namespace = parts[0];
    const category = parts[1];
    const path = parts.slice(2);

    if (!category || path.length === 0) {
      return undefined;
    }

    return {
      full: id as GofaiId,
      namespace,
      category,
      path,
      isBuiltin: false,
      isExtension: true,
    };
  } else {
    // Builtin ID: category:path...
    const category = parts[0];
    const path = parts.slice(1);

    if (path.length === 0) {
      return undefined;
    }

    return {
      full: id as GofaiId,
      namespace: undefined,
      category,
      path,
      isBuiltin: true,
      isExtension: false,
    };
  }
}

/**
 * Validate a GOFAI ID string.
 *
 * @param id - ID to validate
 * @returns Validation result with errors if invalid
 */
export function validateGofaiId(id: string): ValidationResult {
  const errors: string[] = [];

  // Parse structure
  const parsed = parseGofaiId(id);
  if (!parsed) {
    errors.push(`Invalid ID format: ${id}`);
    return { valid: false, errors };
  }

  // Check namespace validity (if present)
  if (parsed.namespace) {
    if (!isValidNamespace(parsed.namespace)) {
      errors.push(`Invalid namespace: ${parsed.namespace}`);
    }

    if (isReservedNamespace(parsed.namespace)) {
      errors.push(`Reserved namespace not allowed in extensions: ${parsed.namespace}`);
    }
  }

  // Check category validity
  if (!isGofaiIdCategory(parsed.category)) {
    errors.push(`Unknown category: ${parsed.category}`);
  }

  // Check path components
  for (const component of parsed.path) {
    if (!isValidPathComponent(component)) {
      errors.push(`Invalid path component: ${component}`);
    }
  }

  return {
    valid: errors.length === 0,
    ...(errors.length > 0 ? { errors: errors as readonly string[] } : {}),
  };
}

/**
 * Validation result.
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors?: readonly string[];
}

/**
 * Check if a string is a valid path component.
 *
 * Rules:
 * - Lowercase preferred (but allow mixed case for compatibility)
 * - Alphanumeric + underscore
 * - Length 1-63 characters
 */
function isValidPathComponent(component: string): boolean {
  if (component.length === 0 || component.length > 63) {
    return false;
  }

  // Alphanumeric + underscore (allow uppercase for compatibility)
  if (!/^[a-zA-Z0-9_]+$/.test(component)) {
    return false;
  }

  return true;
}

// =============================================================================
// ID Construction
// =============================================================================

/**
 * Construct a builtin GOFAI ID.
 *
 * @param category - ID category
 * @param path - Path components
 * @returns Validated ID
 * @throws if components are invalid
 */
export function makeBuiltinId(
  category: GofaiIdCategory,
  ...path: readonly string[]
): GofaiId {
  if (path.length === 0) {
    throw new Error(`Path cannot be empty for ${category} ID`);
  }

  const id = `${category}:${path.join(':')}`;
  const validation = validateGofaiId(id);

  if (!validation.valid) {
    throw new Error(
      `Invalid builtin ID: ${id}\nErrors: ${validation.errors?.join(', ')}`
    );
  }

  return id as GofaiId;
}

/**
 * Construct an extension GOFAI ID.
 *
 * @param namespace - Extension namespace (pack ID)
 * @param category - ID category
 * @param path - Path components
 * @returns Validated ID
 * @throws if components are invalid or namespace is reserved
 */
export function makeExtensionId(
  namespace: string,
  category: GofaiIdCategory,
  ...path: readonly string[]
): GofaiId {
  if (isReservedNamespace(namespace)) {
    throw new Error(`Reserved namespace not allowed: ${namespace}`);
  }

  if (path.length === 0) {
    throw new Error(`Path cannot be empty for ${category} ID`);
  }

  const id = `${namespace}:${category}:${path.join(':')}`;
  const validation = validateGofaiId(id);

  if (!validation.valid) {
    throw new Error(
      `Invalid extension ID: ${id}\nErrors: ${validation.errors?.join(', ')}`
    );
  }

  return id as GofaiId;
}

// =============================================================================
// Typed ID Constructors
// =============================================================================

/**
 * Construct a lexeme ID.
 */
export function makeLexemeId(
  category: string,
  lemma: string,
  namespace?: string
): LexemeId {
  const id = namespace
    ? makeExtensionId(namespace, 'lex', category, lemma)
    : makeBuiltinId('lex', category, lemma);

  return id as LexemeId;
}

/**
 * Construct an axis ID.
 */
export function makeAxisId(name: string, namespace?: string): AxisId {
  const id = namespace
    ? makeExtensionId(namespace, 'axis', name)
    : makeBuiltinId('axis', name);

  return id as AxisId;
}

/**
 * Construct an opcode ID.
 */
export function makeOpcodeId(name: string, namespace?: string): OpcodeId {
  const id = namespace
    ? makeExtensionId(namespace, 'op', name)
    : makeBuiltinId('op', name);

  return id as OpcodeId;
}

/**
 * Construct a constraint ID.
 */
export function makeConstraintId(name: string, namespace?: string): ConstraintId {
  const id = namespace
    ? makeExtensionId(namespace, 'constraint', name)
    : makeBuiltinId('constraint', name);

  return id as ConstraintId;
}

/**
 * Construct a section type ID.
 */
export function makeSectionTypeId(name: string, namespace?: string): SectionTypeId {
  const id = namespace
    ? makeExtensionId(namespace, 'section', name)
    : makeBuiltinId('section', name);

  return id as SectionTypeId;
}

/**
 * Construct a layer role ID.
 */
export function makeLayerRoleId(name: string, namespace?: string): LayerRoleId {
  const id = namespace
    ? makeExtensionId(namespace, 'layer', name)
    : makeBuiltinId('layer', name);

  return id as LayerRoleId;
}

/**
 * Construct a unit ID.
 */
export function makeUnitId(name: string, namespace?: string): UnitId {
  const id = namespace
    ? makeExtensionId(namespace, 'unit', name)
    : makeBuiltinId('unit', name);

  return id as UnitId;
}

// =============================================================================
// ID Queries
// =============================================================================

/**
 * Check if an ID is builtin.
 */
export function isBuiltinId(id: GofaiId): boolean {
  const parsed = parseGofaiId(id);
  return parsed?.isBuiltin ?? false;
}

/**
 * Check if an ID is from an extension.
 */
export function isExtensionId(id: GofaiId): boolean {
  const parsed = parseGofaiId(id);
  return parsed?.isExtension ?? false;
}

/**
 * Get the namespace of an ID (if any).
 */
export function getNamespace(id: GofaiId): string | undefined {
  const parsed = parseGofaiId(id);
  return parsed?.namespace;
}

/**
 * Get the category of an ID.
 */
export function getCategory(id: GofaiId): string | undefined {
  const parsed = parseGofaiId(id);
  return parsed?.category;
}

/**
 * Get the path components of an ID.
 */
export function getPath(id: GofaiId): readonly string[] | undefined {
  const parsed = parseGofaiId(id);
  return parsed?.path;
}

/**
 * Get the last path component (name) of an ID.
 */
export function getName(id: GofaiId): string | undefined {
  const parsed = parseGofaiId(id);
  if (!parsed || parsed.path.length === 0) {
    return undefined;
  }
  return parsed.path[parsed.path.length - 1];
}

// =============================================================================
// ID Formatting
// =============================================================================

/**
 * Format an ID for human display.
 *
 * Removes namespace for builtin IDs; shows namespace for extensions.
 */
export function formatIdForDisplay(id: GofaiId): string {
  const parsed = parseGofaiId(id);
  if (!parsed) return id;

  if (parsed.isBuiltin) {
    // Builtin: show just category:name (omit intermediate path usually)
    const name = parsed.path[parsed.path.length - 1];
    return `${parsed.category}:${name}`;
  } else {
    // Extension: show namespace
    return `[${parsed.namespace}] ${parsed.category}:${parsed.path.join(':')}`;
  }
}

/**
 * Format an ID for technical/debug display.
 *
 * Always shows full ID with all components.
 */
export function formatIdForDebug(id: GofaiId): string {
  const parsed = parseGofaiId(id);
  if (!parsed) return `<invalid: ${id}>`;

  const parts = [
    parsed.namespace ? `namespace=${parsed.namespace}` : 'builtin',
    `category=${parsed.category}`,
    `path=${parsed.path.join('/')}`,
  ];

  return `GofaiId{${parts.join(', ')}}`;
}

// =============================================================================
// Integration with CardPlay IDs
// =============================================================================

/**
 * Check if a CardPlay ID is compatible with GOFAI ID rules.
 *
 * CardPlay IDs follow similar conventions, so we can often use them
 * as namespaces or validate against similar rules.
 */
export function isCompatibleCardPlayId(cardPlayId: CardPlayId): boolean {
  // CardPlay IDs are strings; check if they follow our namespace rules
  return isValidNamespace(cardPlayId as string);
}

/**
 * Create an extension namespace from a CardPlay pack ID.
 *
 * Pack IDs in CardPlay are designed to be usable as namespaces.
 */
export function namespaceFromPackId(packId: CardPlayId): string {
  const ns = packId as string;

  if (!isValidNamespace(ns)) {
    throw new Error(`Pack ID ${packId} cannot be used as namespace`);
  }

  if (isReservedNamespace(ns)) {
    throw new Error(`Pack ID ${packId} uses reserved namespace`);
  }

  return ns;
}

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Assert that an ID is builtin.
 * Throws if extension or invalid.
 */
export function assertBuiltinId(id: GofaiId): asserts id is GofaiId {
  if (!isBuiltinId(id)) {
    throw new Error(`Expected builtin ID, got: ${id}`);
  }
}

/**
 * Assert that an ID is from an extension.
 * Throws if builtin or invalid.
 */
export function assertExtensionId(id: GofaiId): asserts id is GofaiId {
  if (!isExtensionId(id)) {
    throw new Error(`Expected extension ID, got: ${id}`);
  }
}

/**
 * Assert that an ID is valid.
 * Throws if invalid.
 */
export function assertValidId(id: string): asserts id is GofaiId {
  const validation = validateGofaiId(id);
  if (!validation.valid) {
    throw new Error(
      `Invalid GOFAI ID: ${id}\nErrors: ${validation.errors?.join(', ')}`
    );
  }
}

// =============================================================================
// Export type guards
// =============================================================================

/**
 * Type guard for LexemeId.
 */
export function isLexemeId(id: GofaiId): id is LexemeId {
  return getCategory(id) === 'lex';
}

/**
 * Type guard for AxisId.
 */
export function isAxisId(id: GofaiId): id is AxisId {
  return getCategory(id) === 'axis';
}

/**
 * Type guard for OpcodeId.
 */
export function isOpcodeId(id: GofaiId): id is OpcodeId {
  return getCategory(id) === 'op';
}

/**
 * Type guard for ConstraintId.
 */
export function isConstraintId(id: GofaiId): id is ConstraintId {
  return getCategory(id) === 'constraint';
}

/**
 * Type guard for SectionTypeId.
 */
export function isSectionTypeId(id: GofaiId): id is SectionTypeId {
  return getCategory(id) === 'section';
}

/**
 * Type guard for LayerRoleId.
 */
export function isLayerRoleId(id: GofaiId): id is LayerRoleId {
  return getCategory(id) === 'layer';
}

/**
 * Type guard for UnitId.
 */
export function isUnitId(id: GofaiId): id is UnitId {
  return getCategory(id) === 'unit';
}
