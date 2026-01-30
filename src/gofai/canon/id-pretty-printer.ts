/**
 * @file GOFAI ID Pretty-Printer and Parser
 * @module gofai/canon/id-pretty-printer
 * 
 * Implements Step 062: Add a stable, human-readable ID pretty-printer and parser
 * for all GOFAI entity references.
 * 
 * All GOFAI entities (lexemes, axes, constraints, opcodes, sections, tracks, etc.)
 * have stable machine IDs. This module provides bidirectional conversion between:
 * - Machine IDs (stable, namespaced, type-safe)
 * - Human-readable representations (for UI, logs, docs)
 * 
 * Design principles:
 * - Bidirectional: ID → String → ID must be lossless
 * - Stable: Format doesn't change arbitrarily across versions
 * - Type-safe: Parser validates ID format and namespace
 * - Namespaced: Extension IDs clearly marked
 * - Debuggable: IDs are grep-able and readable in logs
 * 
 * Format examples:
 * - Lexeme: `lex:adj:darker` or `my-pack:lex:adj:gritty`
 * - Axis: `axis:brightness` or `my-pack:axis:grit`
 * - Opcode: `op:thin_texture` or `jazz-pack:op:swing_feel`
 * - Constraint: `cst:preserve:melody` or `theory:cst:voice_leading`
 * - Entity refs: `track:drums`, `section:chorus-1`, `card:reverb-main`
 * 
 * @see gofai_goalB.md Step 062
 * @see docs/gofai/vocabulary-policy.md (ID conventions)
 */

import type {
  GofaiId,
  LexemeId,
  AxisId,
  OpcodeId,
  ConstraintTypeId,
} from './types.js';

// ============================================================================
// ID Format Types
// ============================================================================

/**
 * Result of parsing an ID string
 */
export interface ParsedId {
  /** Original string */
  readonly raw: string;
  
  /** Is this a valid ID? */
  readonly valid: boolean;
  
  /** Namespace (undefined for builtins) */
  readonly namespace?: string;
  
  /** ID type (lex, axis, op, cst, track, etc.) */
  readonly idType: string;
  
  /** Category (for lexemes: adj, noun, verb, etc.) */
  readonly category?: string;
  
  /** Base name (the actual identifier) */
  readonly baseName: string;
  
  /** Full typed ID (if valid) */
  readonly id?: GofaiId;
  
  /** Parse errors (if invalid) */
  readonly errors: readonly string[];
}

/**
 * Options for pretty-printing IDs
 */
export interface PrettyPrintOptions {
  /** Include namespace in output? (default: true) */
  readonly includeNamespace?: boolean;
  
  /** Use short form if unambiguous? (default: false) */
  readonly shortForm?: boolean;
  
  /** Include type prefix? (default: true) */
  readonly includeType?: boolean;
  
  /** Style for output */
  readonly style?: 'canonical' | 'human' | 'debug';
}

/**
 * Options for parsing IDs
 */
export interface ParseOptions {
  /** Allow unnamespaced IDs? (default: true for builtins) */
  readonly allowBuiltins?: boolean;
  
  /** Strict mode: reject any ambiguity (default: false) */
  readonly strict?: boolean;
  
  /** Validate against known registry? (default: false) */
  readonly validate?: boolean;
  
  /** Expected ID type (for validation) */
  readonly expectedType?: string;
}

// ============================================================================
// Pretty-Printing Functions
// ============================================================================

/**
 * Pretty-print a GofaiId to human-readable form
 * 
 * @example
 * prettyPrintId('lex:adj:darker')
 * // → "darker (adjective)"
 * 
 * prettyPrintId('my-pack:lex:adj:gritty')
 * // → "gritty [my-pack] (adjective)"
 * 
 * prettyPrintId('axis:brightness')
 * // → "brightness (axis)"
 */
export function prettyPrintId(
  id: GofaiId,
  options: PrettyPrintOptions = {}
): string {
  const {
    includeNamespace = true,
    shortForm = false,
    includeType = true,
    style = 'human'
  } = options;
  
  const parsed = parseId(id as string);
  if (!parsed.valid) {
    return `[invalid: ${id}]`;
  }
  
  switch (style) {
    case 'canonical':
      // Canonical form: exactly as stored
      return id;
      
    case 'debug':
      // Debug form: all details visible
      return formatDebugId(parsed);
      
    case 'human':
    default:
      // Human form: readable with optional details
      return formatHumanId(parsed, { includeNamespace, shortForm, includeType });
  }
}

/**
 * Format ID for human reading
 */
function formatHumanId(
  parsed: ParsedId,
  options: { includeNamespace: boolean; shortForm: boolean; includeType: boolean }
): string {
  const parts: string[] = [];
  
  // Base name (always included)
  parts.push(parsed.baseName);
  
  // Namespace (if present and requested)
  if (parsed.namespace && options.includeNamespace) {
    parts.push(`[${parsed.namespace}]`);
  }
  
  // Type/category (if requested and not in short form)
  if (options.includeType && !options.shortForm) {
    const typeLabel = formatTypeLabel(parsed.idType, parsed.category);
    if (typeLabel) {
      parts.push(`(${typeLabel})`);
    }
  }
  
  return parts.join(' ');
}

/**
 * Format ID for debugging
 */
function formatDebugId(parsed: ParsedId): string {
  const parts = [
    `id="${parsed.baseName}"`,
    `type="${parsed.idType}"`,
  ];
  
  if (parsed.category) {
    parts.push(`category="${parsed.category}"`);
  }
  
  if (parsed.namespace) {
    parts.push(`namespace="${parsed.namespace}"`);
  }
  
  return `<${parts.join(' ')}>`;
}

/**
 * Convert ID type to human-readable label
 */
function formatTypeLabel(idType: string, category?: string): string | undefined {
  const labels: Record<string, string> = {
    'lex': category ? category : 'lexeme',
    'axis': 'axis',
    'op': 'operation',
    'cst': 'constraint',
    'track': 'track',
    'section': 'section',
    'card': 'card',
    'deck': 'deck',
    'board': 'board',
  };
  
  return labels[idType];
}

/**
 * Pretty-print a lexeme ID
 */
export function prettyPrintLexeme(id: LexemeId, options?: PrettyPrintOptions): string {
  return prettyPrintId(id as unknown as GofaiId, options);
}

/**
 * Pretty-print an axis ID
 */
export function prettyPrintAxis(id: AxisId, options?: PrettyPrintOptions): string {
  return prettyPrintId(id as unknown as GofaiId, options);
}

/**
 * Pretty-print an opcode ID
 */
export function prettyPrintOpcode(id: OpcodeId, options?: PrettyPrintOptions): string {
  return prettyPrintId(id as unknown as GofaiId, options);
}

/**
 * Pretty-print a constraint type ID
 */
export function prettyPrintConstraint(
  id: ConstraintTypeId,
  options?: PrettyPrintOptions
): string {
  return prettyPrintId(id as unknown as GofaiId, options);
}

/**
 * Pretty-print multiple IDs as a list
 */
export function prettyPrintIdList(
  ids: readonly GofaiId[],
  options?: PrettyPrintOptions
): string {
  if (ids.length === 0) return '(none)';
  if (ids.length === 1) return prettyPrintId(ids[0], options);
  if (ids.length === 2) {
    return `${prettyPrintId(ids[0], options)} and ${prettyPrintId(ids[1], options)}`;
  }
  
  const head = ids.slice(0, -1).map(id => prettyPrintId(id, options));
  const tail = prettyPrintId(ids[ids.length - 1], options);
  return `${head.join(', ')}, and ${tail}`;
}

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Parse an ID string into structured form
 * 
 * @example
 * parseId('lex:adj:darker')
 * // → { valid: true, idType: 'lex', category: 'adj', baseName: 'darker', ... }
 * 
 * parseId('my-pack:lex:adj:gritty')
 * // → { valid: true, namespace: 'my-pack', idType: 'lex', category: 'adj', baseName: 'gritty', ... }
 */
export function parseId(
  idString: string,
  options: ParseOptions = {}
): ParsedId {
  const {
    allowBuiltins = true,
    strict = false,
    validate = false,
    expectedType
  } = options;
  
  const errors: string[] = [];
  
  // Split by colon
  const parts = idString.split(':');
  
  if (parts.length < 2) {
    errors.push(`ID must have at least 2 parts separated by ':' (got ${parts.length})`);
    return {
      raw: idString,
      valid: false,
      idType: '',
      baseName: idString,
      errors
    };
  }
  
  // Check if namespaced
  let namespace: string | undefined;
  let idType: string;
  let category: string | undefined;
  let baseName: string;
  
  // Format 1: namespace:type:category:name (e.g., my-pack:lex:adj:dark)
  // Format 2: namespace:type:name (e.g., my-pack:axis:grit)
  // Format 3: type:category:name (builtin, e.g., lex:adj:dark)
  // Format 4: type:name (builtin, e.g., axis:brightness)
  
  if (isNamespace(parts[0])) {
    // Namespaced ID
    namespace = parts[0];
    idType = parts[1];
    
    if (parts.length === 4) {
      category = parts[2];
      baseName = parts[3];
    } else if (parts.length === 3) {
      baseName = parts[2];
    } else {
      errors.push(`Namespaced ID has wrong number of parts (expected 3 or 4, got ${parts.length})`);
      return {
        raw: idString,
        valid: false,
        namespace,
        idType,
        baseName: parts[parts.length - 1],
        errors
      };
    }
  } else {
    // Builtin ID
    if (!allowBuiltins) {
      errors.push('Builtin IDs not allowed in this context');
    }
    
    idType = parts[0];
    
    if (parts.length === 3) {
      category = parts[1];
      baseName = parts[2];
    } else if (parts.length === 2) {
      baseName = parts[1];
    } else {
      errors.push(`Builtin ID has wrong number of parts (expected 2 or 3, got ${parts.length})`);
      return {
        raw: idString,
        valid: false,
        idType,
        baseName: parts[parts.length - 1],
        errors
      };
    }
  }
  
  // Validate ID type
  if (expectedType && idType !== expectedType) {
    errors.push(`Expected ID type '${expectedType}' but got '${idType}'`);
  }
  
  // Validate format
  if (!isValidIdPart(idType)) {
    errors.push(`Invalid ID type '${idType}' (must be lowercase alphanumeric with underscores)`);
  }
  
  if (category && !isValidIdPart(category)) {
    errors.push(`Invalid category '${category}' (must be lowercase alphanumeric with underscores)`);
  }
  
  if (!isValidIdPart(baseName)) {
    errors.push(`Invalid base name '${baseName}' (must be lowercase alphanumeric with underscores/hyphens)`);
  }
  
  // Strict mode: no warnings allowed
  if (strict && errors.length > 0) {
    return {
      raw: idString,
      valid: false,
      namespace,
      idType,
      category,
      baseName,
      errors
    };
  }
  
  const valid = errors.length === 0;
  
  return {
    raw: idString,
    valid,
    namespace,
    idType,
    category,
    baseName,
    id: valid ? (idString as GofaiId) : undefined,
    errors
  };
}

/**
 * Parse a lexeme ID
 */
export function parseLexemeId(idString: string, options?: ParseOptions): ParsedId {
  return parseId(idString, { ...options, expectedType: 'lex' });
}

/**
 * Parse an axis ID
 */
export function parseAxisId(idString: string, options?: ParseOptions): ParsedId {
  return parseId(idString, { ...options, expectedType: 'axis' });
}

/**
 * Parse an opcode ID
 */
export function parseOpcodeId(idString: string, options?: ParseOptions): ParsedId {
  return parseId(idString, { ...options, expectedType: 'op' });
}

/**
 * Parse a constraint type ID
 */
export function parseConstraintId(idString: string, options?: ParseOptions): ParsedId {
  return parseId(idString, { ...options, expectedType: 'cst' });
}

/**
 * Try to parse an ID, returning undefined if invalid
 */
export function tryParseId(idString: string, options?: ParseOptions): GofaiId | undefined {
  const parsed = parseId(idString, options);
  return parsed.valid ? parsed.id : undefined;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if a string looks like a namespace
 */
function isNamespace(part: string): boolean {
  // Namespaces: lowercase, alphanumeric, hyphens
  // Must NOT match known ID types (lex, axis, op, cst, track, etc.)
  const knownTypes = new Set([
    'lex', 'axis', 'op', 'cst', 'track', 'section', 'card', 'deck', 'board'
  ]);
  
  if (knownTypes.has(part)) return false;
  
  return /^[a-z][a-z0-9-]*$/.test(part);
}

/**
 * Check if a string is a valid ID part (type, category, or name)
 */
function isValidIdPart(part: string): boolean {
  // Lowercase, alphanumeric, underscores, hyphens
  return /^[a-z][a-z0-9_-]*$/.test(part);
}

/**
 * Validate an ID matches the expected format
 */
export function validateId(
  id: GofaiId,
  expectedType?: string,
  expectedNamespace?: string
): { valid: boolean; errors: readonly string[] } {
  const parsed = parseId(id as string, { expectedType });
  
  if (!parsed.valid) {
    return { valid: false, errors: parsed.errors };
  }
  
  const errors: string[] = [];
  
  if (expectedNamespace !== undefined) {
    if (parsed.namespace !== expectedNamespace) {
      errors.push(
        `Expected namespace '${expectedNamespace}' but got '${parsed.namespace || '(builtin)'}'`
      );
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Format Conversion Helpers
// ============================================================================

/**
 * Build an ID from parts
 * 
 * @example
 * buildId({ idType: 'lex', category: 'adj', baseName: 'darker' })
 * // → "lex:adj:darker"
 * 
 * buildId({ namespace: 'my-pack', idType: 'axis', baseName: 'grit' })
 * // → "my-pack:axis:grit"
 */
export function buildId(parts: {
  namespace?: string;
  idType: string;
  category?: string;
  baseName: string;
}): GofaiId {
  const segments: string[] = [];
  
  if (parts.namespace) {
    segments.push(parts.namespace);
  }
  
  segments.push(parts.idType);
  
  if (parts.category) {
    segments.push(parts.category);
  }
  
  segments.push(parts.baseName);
  
  return segments.join(':') as GofaiId;
}

/**
 * Extract namespace from an ID
 */
export function extractNamespace(id: GofaiId): string | undefined {
  const parsed = parseId(id as string);
  return parsed.namespace;
}

/**
 * Extract base name from an ID
 */
export function extractBaseName(id: GofaiId): string {
  const parsed = parseId(id as string);
  return parsed.baseName;
}

/**
 * Check if an ID is from a specific namespace
 */
export function isFromNamespace(id: GofaiId, namespace: string): boolean {
  return extractNamespace(id) === namespace;
}

/**
 * Check if an ID is a builtin (no namespace)
 */
export function isBuiltinId(id: GofaiId): boolean {
  return extractNamespace(id) === undefined;
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Parse multiple IDs
 */
export function parseIds(
  idStrings: readonly string[],
  options?: ParseOptions
): readonly ParsedId[] {
  return idStrings.map(s => parseId(s, options));
}

/**
 * Pretty-print multiple IDs as a table (for debugging)
 */
export function prettyPrintIdTable(
  ids: readonly GofaiId[],
  options?: PrettyPrintOptions
): string {
  const rows = ids.map(id => {
    const parsed = parseId(id as string);
    return {
      id: id as string,
      namespace: parsed.namespace || '(builtin)',
      type: parsed.idType,
      category: parsed.category || '-',
      name: parsed.baseName,
      human: prettyPrintId(id, { ...options, style: 'human' })
    };
  });
  
  // Find column widths
  const widths = {
    id: Math.max(10, ...rows.map(r => r.id.length)),
    namespace: Math.max(12, ...rows.map(r => r.namespace.length)),
    type: Math.max(6, ...rows.map(r => r.type.length)),
    category: Math.max(10, ...rows.map(r => r.category.length)),
    name: Math.max(10, ...rows.map(r => r.name.length)),
    human: Math.max(12, ...rows.map(r => r.human.length))
  };
  
  // Header
  const header = [
    'ID'.padEnd(widths.id),
    'Namespace'.padEnd(widths.namespace),
    'Type'.padEnd(widths.type),
    'Category'.padEnd(widths.category),
    'Name'.padEnd(widths.name),
    'Human'.padEnd(widths.human)
  ].join(' | ');
  
  const separator = '-'.repeat(header.length);
  
  // Rows
  const bodyRows = rows.map(r => [
    r.id.padEnd(widths.id),
    r.namespace.padEnd(widths.namespace),
    r.type.padEnd(widths.type),
    r.category.padEnd(widths.category),
    r.name.padEnd(widths.name),
    r.human.padEnd(widths.human)
  ].join(' | '));
  
  return [header, separator, ...bodyRows].join('\n');
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Create a pretty-printer with fixed options
 */
export function createPrettyPrinter(options: PrettyPrintOptions) {
  return (id: GofaiId) => prettyPrintId(id, options);
}

/**
 * Create a parser with fixed options
 */
export function createParser(options: ParseOptions) {
  return (idString: string) => parseId(idString, options);
}
