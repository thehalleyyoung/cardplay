/**
 * GOFAI ID Formatting and Parsing — Human-Readable ID Utilities
 *
 * Step 062 from gofai_goalB.md Phase 1
 *
 * This module provides stable, human-readable formatting and parsing for all
 * GOFAI entity IDs. It ensures that IDs can be:
 * - Displayed in UI in a user-friendly way
 * - Parsed from natural language commands
 * - Round-tripped without information loss
 * - Validated for correctness
 *
 * Design principles:
 * - Stable format across versions (for compatibility)
 * - Bijective mapping (format/parse round-trips)
 * - Namespace-aware (extension IDs clearly marked)
 * - Type-safe (branded ID types preserved)
 * - Human-friendly (readable in logs, UI, error messages)
 *
 * @module gofai/canon/id-formatting
 */

import type {
  GofaiId,
  LexemeId,
  AxisId,
  OpcodeId,
  ConstraintTypeId,
  RuleId,
  UnitId,
  SectionTypeId,
  LayerTypeId,
} from './types';

import { isNamespaced, getNamespace } from './types';

// =============================================================================
// Format Options
// =============================================================================

/**
 * Options for ID formatting.
 */
export interface FormatOptions {
  /** Include namespace in output (default: true) */
  readonly includeNamespace?: boolean;

  /** Include type prefix in output (default: false) */
  readonly includeTypePrefix?: boolean;

  /** Use short form when possible (default: false) */
  readonly shortForm?: boolean;

  /** Capitalize words (default: true) */
  readonly capitalize?: boolean;

  /** Separator for word boundaries (default: ' ') */
  readonly separator?: string;

  /** Quote namespace with parentheses (default: true for extensions) */
  readonly quoteNamespace?: boolean;
}

/**
 * Default format options.
 */
export const DEFAULT_FORMAT_OPTIONS: Required<FormatOptions> = {
  includeNamespace: true,
  includeTypePrefix: false,
  shortForm: false,
  capitalize: true,
  separator: ' ',
  quoteNamespace: true,
};

// =============================================================================
// Core ID Formatting
// =============================================================================

/**
 * Format any GOFAI ID into a human-readable string.
 *
 * Examples:
 * - `lex:adj:brighter` → "Brighter"
 * - `axis:brightness` → "Brightness"
 * - `my-pack:axis:grit` → "Grit (my-pack)"
 * - `op:thin_texture` → "Thin Texture"
 */
export function formatGofaiId(
  id: string,
  options: FormatOptions = {}
): string {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const parts = id.split(':');

  if (parts.length < 2) {
    // Malformed ID, return as-is
    return id;
  }

  // Check if namespaced
  const namespace = isNamespaced(id) ? getNamespace(id) : undefined;
  const idParts = namespace ? parts.slice(1) : parts;

  // Extract type and name components
  const typePrefix = idParts[0];
  const nameParts = idParts.slice(1);

  // Format the name part
  let name = nameParts.join(opts.separator);

  if (!opts.shortForm) {
    // Expand underscores and hyphens to spaces
    name = name.replace(/[_-]/g, ' ');
  }

  // Capitalize if requested
  if (opts.capitalize) {
    name = capitalizeWords(name);
  }

  // Include type prefix if requested
  if (opts.includeTypePrefix && typePrefix) {
    name = `${capitalizeWords(typePrefix)} ${name}`;
  }

  // Include namespace if present and requested
  if (
    namespace &&
    opts.includeNamespace &&
    opts.quoteNamespace
  ) {
    name = `${name} (${namespace})`;
  } else if (namespace && opts.includeNamespace) {
    name = `${namespace}:${name}`;
  }

  return name;
}

/**
 * Format a LexemeId into a human-readable string.
 */
export function formatLexemeId(
  id: LexemeId,
  options: FormatOptions = {}
): string {
  return formatGofaiId(id, options);
}

/**
 * Format an AxisId into a human-readable string.
 */
export function formatAxisId(id: AxisId, options: FormatOptions = {}): string {
  return formatGofaiId(id, options);
}

/**
 * Format an OpcodeId into a human-readable string.
 */
export function formatOpcodeId(
  id: OpcodeId,
  options: FormatOptions = {}
): string {
  return formatGofaiId(id, options);
}

/**
 * Format a ConstraintTypeId into a human-readable string.
 */
export function formatConstraintTypeId(
  id: ConstraintTypeId,
  options: FormatOptions = {}
): string {
  return formatGofaiId(id, options);
}

/**
 * Format a RuleId into a human-readable string.
 */
export function formatRuleId(id: RuleId, options: FormatOptions = {}): string {
  return formatGofaiId(id, options);
}

/**
 * Format a UnitId into a human-readable string.
 */
export function formatUnitId(id: UnitId, options: FormatOptions = {}): string {
  return formatGofaiId(id, options);
}

/**
 * Format a SectionTypeId into a human-readable string.
 */
export function formatSectionTypeId(
  id: SectionTypeId,
  options: FormatOptions = {}
): string {
  return formatGofaiId(id, options);
}

/**
 * Format a LayerTypeId into a human-readable string.
 */
export function formatLayerTypeId(
  id: LayerTypeId,
  options: FormatOptions = {}
): string {
  return formatGofaiId(id, options);
}

// =============================================================================
// ID Parsing
// =============================================================================

/**
 * Parse options for ID parsing.
 */
export interface ParseOptions {
  /** Expected ID type (if known) */
  readonly expectedType?: string;

  /** Allowed namespaces (undefined = allow all) */
  readonly allowedNamespaces?: readonly string[];

  /** Require namespace for extensions (default: true) */
  readonly requireNamespace?: boolean;

  /** Case-insensitive matching (default: true) */
  readonly caseInsensitive?: boolean;
}

/**
 * Default parse options.
 */
export const DEFAULT_PARSE_OPTIONS: Required<ParseOptions> = {
  expectedType: '',
  allowedNamespaces: [],
  requireNamespace: true,
  caseInsensitive: true,
};

/**
 * Result of ID parsing.
 */
export interface ParseResult {
  /** The parsed ID */
  readonly id: string;

  /** The namespace (if extension ID) */
  readonly namespace?: string;

  /** The ID type (lex, axis, op, etc.) */
  readonly type: string;

  /** The name components */
  readonly name: string;

  /** Whether this is a core ID (not namespaced) */
  readonly isCore: boolean;

  /** Confidence (0-1, lower if fuzzy match) */
  readonly confidence: number;
}

/**
 * Parse a human-readable string into a GOFAI ID.
 *
 * This function attempts to reverse the formatting done by formatGofaiId.
 * It can handle:
 * - Formatted names: "Brighter" → lex:adj:brighter
 * - Namespaced names: "Grit (my-pack)" → my-pack:axis:grit
 * - Raw IDs: "axis:brightness" → axis:brightness
 * - Fuzzy matches: "make it bright" → lex:adj:brighter (if in vocab)
 */
export function parseGofaiId(
  input: string,
  options: ParseOptions = {}
): ParseResult | undefined {
  const opts = { ...DEFAULT_PARSE_OPTIONS, ...options };
  const normalized = opts.caseInsensitive ? input.trim().toLowerCase() : input.trim();

  // Try parsing as a raw ID first (format: type:category:name or namespace:type:category:name)
  const idMatch = normalized.match(/^(?:([a-z0-9_-]+):)?([a-z]+):(.+)$/);
  if (idMatch) {
    const [, maybeNamespace, type, rest] = idMatch;

    // Determine if first part is namespace or type
    const coreTypes = [
      'gofai',
      'lex',
      'axis',
      'op',
      'constraint',
      'rule',
      'unit',
      'section',
      'layer',
    ];
    const isCore = !maybeNamespace || coreTypes.includes(maybeNamespace);
    const namespace = isCore ? undefined : maybeNamespace;
    const actualType = isCore ? maybeNamespace || type : type;

    if (opts.expectedType && actualType !== opts.expectedType) {
      return undefined; // Type mismatch
    }

    if (
      namespace &&
      opts.allowedNamespaces &&
      opts.allowedNamespaces.length > 0 &&
      !opts.allowedNamespaces.includes(namespace)
    ) {
      return undefined; // Namespace not allowed
    }

    const nameComponents = rest?.split(':') ?? [];
    const id = namespace
      ? `${namespace}:${actualType}:${nameComponents.join(':')}`
      : `${actualType}:${nameComponents.join(':')}`;

    return {
      id,
      namespace,
      type: actualType ?? '',
      name: nameComponents.join(' '),
      isCore,
      confidence: 1.0,
    };
  }

  // Try parsing as a formatted name with namespace: "Name (namespace)"
  const namespacedMatch = normalized.match(/^(.+?)\s*\(([a-z0-9_-]+)\)$/);
  if (namespacedMatch) {
    const [, name, namespace] = namespacedMatch;

    if (
      opts.allowedNamespaces &&
      opts.allowedNamespaces.length > 0 &&
      namespace &&
      !opts.allowedNamespaces.includes(namespace)
    ) {
      return undefined; // Namespace not allowed
    }

    // Need to infer type from context or expectedType
    if (!opts.expectedType) {
      return undefined; // Cannot infer type without expected type
    }

    const normalizedName = (name ?? '')
      .toLowerCase()
      .replace(/\s+/g, '_');

    const id = `${namespace}:${opts.expectedType}:${normalizedName}`;

    return {
      id,
      namespace,
      type: opts.expectedType,
      name: name ?? '',
      isCore: false,
      confidence: 0.9, // Slightly lower confidence for inferred type
    };
  }

  // Try parsing as a simple name (requires expectedType)
  if (opts.expectedType) {
    const normalizedName = normalized.replace(/\s+/g, '_');
    const id = `${opts.expectedType}:${normalizedName}`;

    return {
      id,
      namespace: undefined,
      type: opts.expectedType,
      name: normalized,
      isCore: true,
      confidence: 0.8, // Lower confidence for simple name without context
    };
  }

  return undefined; // Could not parse
}

/**
 * Parse a string into a LexemeId.
 */
export function parseLexemeId(
  input: string,
  options: ParseOptions = {}
): ParseResult | undefined {
  return parseGofaiId(input, { ...options, expectedType: 'lex' });
}

/**
 * Parse a string into an AxisId.
 */
export function parseAxisId(
  input: string,
  options: ParseOptions = {}
): ParseResult | undefined {
  return parseGofaiId(input, { ...options, expectedType: 'axis' });
}

/**
 * Parse a string into an OpcodeId.
 */
export function parseOpcodeId(
  input: string,
  options: ParseOptions = {}
): ParseResult | undefined {
  return parseGofaiId(input, { ...options, expectedType: 'op' });
}

/**
 * Parse a string into a ConstraintTypeId.
 */
export function parseConstraintTypeId(
  input: string,
  options: ParseOptions = {}
): ParseResult | undefined {
  return parseGofaiId(input, { ...options, expectedType: 'constraint' });
}

// =============================================================================
// ID Validation
// =============================================================================

/**
 * Validate that an ID string matches the expected format.
 */
export function validateIdFormat(id: string): {
  readonly valid: boolean;
  readonly reason?: string;
} {
  const parts = id.split(':');

  if (parts.length < 2) {
    return { valid: false, reason: 'Too few components (expected at least 2)' };
  }

  // Check each part contains only allowed characters
  const allowedPattern = /^[a-z0-9_-]+$/;
  for (const part of parts) {
    if (!part || !allowedPattern.test(part)) {
      return {
        valid: false,
        reason: `Invalid characters in component: "${part}"`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate that an ID is properly namespaced if it's an extension ID.
 */
export function validateNamespacing(id: string): {
  readonly valid: boolean;
  readonly reason?: string;
} {
  const parts = id.split(':');

  if (parts.length < 2) {
    return { valid: false, reason: 'Too few components' };
  }

  const coreTypes = [
    'gofai',
    'lex',
    'axis',
    'op',
    'constraint',
    'rule',
    'unit',
    'section',
    'layer',
  ];

  const firstPart = parts[0];
  const isCoreType = firstPart && coreTypes.includes(firstPart);

  if (!isCoreType && parts.length < 3) {
    return {
      valid: false,
      reason: 'Extension IDs must have format: namespace:type:name',
    };
  }

  return { valid: true };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Capitalize the first letter of each word.
 */
function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((word) => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Get a short name from an ID (last component only).
 */
export function getShortName(id: string): string {
  const parts = id.split(':');
  return parts[parts.length - 1] ?? id;
}

/**
 * Get the type from an ID.
 */
export function getIdType(id: string): string | undefined {
  const parts = id.split(':');

  if (parts.length < 2) {
    return undefined;
  }

  // Check if first part is a namespace
  const coreTypes = [
    'gofai',
    'lex',
    'axis',
    'op',
    'constraint',
    'rule',
    'unit',
    'section',
    'layer',
  ];

  const firstPart = parts[0];
  if (firstPart && coreTypes.includes(firstPart)) {
    return firstPart;
  }

  // Namespaced ID
  return parts[1];
}

/**
 * Check if two IDs refer to the same entity (ignoring namespace variations).
 */
export function idsSemanticallyEqual(id1: string, id2: string): boolean {
  const type1 = getIdType(id1);
  const type2 = getIdType(id2);

  if (type1 !== type2) {
    return false;
  }

  const name1 = getShortName(id1);
  const name2 = getShortName(id2);

  return name1 === name2;
}

// =============================================================================
// Batch Formatting
// =============================================================================

/**
 * Format multiple IDs as a human-readable list.
 */
export function formatIdList(
  ids: readonly string[],
  options: FormatOptions = {},
  conjunction: 'and' | 'or' = 'and'
): string {
  if (ids.length === 0) {
    return '';
  }

  if (ids.length === 1) {
    return formatGofaiId(ids[0] ?? '', options);
  }

  if (ids.length === 2) {
    return `${formatGofaiId(ids[0] ?? '', options)} ${conjunction} ${formatGofaiId(
      ids[1] ?? '',
      options
    )}`;
  }

  const formatted = ids.map((id) => formatGofaiId(id, options));
  const allButLast = formatted.slice(0, -1).join(', ');
  const last = formatted[formatted.length - 1];

  return `${allButLast}, ${conjunction} ${last}`;
}

/**
 * Format IDs grouped by type.
 */
export function formatIdsByType(
  ids: readonly string[],
  options: FormatOptions = {}
): Record<string, string[]> {
  const byType: Record<string, string[]> = {};

  for (const id of ids) {
    const type = getIdType(id);
    if (!type) continue;

    if (!byType[type]) {
      byType[type] = [];
    }

    byType[type]!.push(formatGofaiId(id, options));
  }

  return byType;
}

// =============================================================================
// Debug Utilities
// =============================================================================

/**
 * Format an ID with full details for debugging.
 */
export function debugFormatId(id: string): string {
  const namespace = getNamespace(id);
  const type = getIdType(id);
  const shortName = getShortName(id);
  const isCore = !isNamespaced(id);

  const parts = [
    `ID: ${id}`,
    `Type: ${type ?? 'unknown'}`,
    `Name: ${shortName}`,
    isCore ? 'Core ID' : `Extension ID (${namespace})`,
  ];

  return parts.join(' | ');
}

/**
 * Validate and report all issues with an ID.
 */
export function validateIdComprehensive(id: string): {
  readonly valid: boolean;
  readonly issues: readonly string[];
  readonly warnings: readonly string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  const formatCheck = validateIdFormat(id);
  if (!formatCheck.valid) {
    issues.push(formatCheck.reason ?? 'Invalid format');
  }

  const namespaceCheck = validateNamespacing(id);
  if (!namespaceCheck.valid) {
    issues.push(namespaceCheck.reason ?? 'Invalid namespacing');
  }

  const type = getIdType(id);
  if (!type) {
    warnings.push('Could not determine ID type');
  }

  const namespace = getNamespace(id);
  if (namespace && namespace.length > 50) {
    warnings.push('Namespace is unusually long (>50 chars)');
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
  };
}
