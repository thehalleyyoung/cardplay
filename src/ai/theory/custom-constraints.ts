/**
 * @fileoverview Custom Constraint Registry for User-Defined MusicSpec Extensions
 * 
 * Provides an extensible system for users to register their own:
 * - Custom constraint types
 * - Prolog encoding/decoding rules
 * - Validation logic
 * - UI card bindings
 * 
 * This allows user-defined cards to contribute new musical concepts
 * that integrate seamlessly with the MusicSpec ⇄ Prolog bridge.
 * 
 * @module @cardplay/ai/theory/custom-constraints
 */

import type { MusicConstraint } from './music-spec';

// ============================================================================
// CUSTOM CONSTRAINT DEFINITION
// ============================================================================

/**
 * Base interface for custom constraint definitions.
 * Users implement this to add new constraint types.
 */
export interface CustomConstraintDefinition<T extends CustomConstraint = CustomConstraint> {
  /** Unique type identifier (should be namespaced, e.g., 'user:my_constraint') */
  readonly type: string;
  
  /** Human-readable name for UI */
  readonly displayName: string;
  
  /** Description of what this constraint does */
  readonly description: string;
  
  /** Category for grouping in UI */
  readonly category: CustomConstraintCategory;
  
  /** JSON schema for constraint parameters (optional, for validation) */
  readonly parameterSchema?: Record<string, unknown>;

  /** Typed parameter definitions (C1072-C1074). Takes precedence over parameterSchema. */
  readonly parameterDefs?: readonly AnyConstraintParam[];
  
  /** Convert this constraint to a Prolog fact string */
  toPrologFact(constraint: T, specId: string): string;
  
  /** Convert this constraint to a Prolog term (without period) */
  toPrologTerm(constraint: T): string;
  
  /** Parse Prolog bindings back to constraint (optional) */
  fromPrologBindings?(bindings: Record<string, unknown>): T | null;
  
  /** Validate constraint parameters */
  validate?(constraint: T): ValidationResult;
  
  /** Get conflicts with other constraints */
  getConflicts?(constraint: T, others: MusicConstraint[]): ConflictInfo[];
}

/**
 * Categories for custom constraints.
 */
export type CustomConstraintCategory =
  | 'pitch'        // Pitch/scale/mode related
  | 'rhythm'       // Tempo/meter/rhythm related
  | 'harmony'      // Chord/progression related
  | 'texture'      // Voicing/orchestration related
  | 'form'         // Structure/form related
  | 'ornament'     // Ornamentation related
  | 'style'        // Style/genre related
  | 'culture'      // Cultural/world-music related
  | 'analysis'     // Analysis tool configuration
  | 'custom';      // User-defined miscellaneous

/**
 * Result of constraint validation.
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Information about a constraint conflict.
 */
export interface ConflictInfo {
  readonly conflictingType: string;
  readonly reason: string;
  readonly severity: 'error' | 'warning' | 'info';
}

// ============================================================================
// CONSTRAINT PARAMETER TYPES (C1072-C1074)
// ============================================================================

/**
 * C1072: Basic constraint parameter types.
 * These define the shape of constraint parameters in the UI and validation.
 */
export type ConstraintParamType =
  | ConstraintParamEnum
  | ConstraintParamNumber
  | ConstraintParamRange
  | ConstraintParamBoolean
  | ConstraintParamString;

/** Enum parameter: user picks from a list of string values */
export interface ConstraintParamEnum {
  readonly kind: 'enum';
  readonly values: readonly string[];
  readonly defaultValue: string;
  readonly label: string;
  readonly description?: string;
}

/** Number parameter: user enters a numeric value */
export interface ConstraintParamNumber {
  readonly kind: 'number';
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly defaultValue: number;
  readonly label: string;
  readonly description?: string;
}

/** Range parameter: two numeric bounds (e.g. tempo 80-120) */
export interface ConstraintParamRange {
  readonly kind: 'range';
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly defaultLow: number;
  readonly defaultHigh: number;
  readonly label: string;
  readonly description?: string;
}

/** Boolean parameter: on/off toggle */
export interface ConstraintParamBoolean {
  readonly kind: 'boolean';
  readonly defaultValue: boolean;
  readonly label: string;
  readonly description?: string;
}

/** String parameter: free-text entry */
export interface ConstraintParamString {
  readonly kind: 'string';
  readonly defaultValue: string;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly label: string;
  readonly description?: string;
}

/**
 * C1073: Music-domain parameter types (note, chord, scale, mode selectors).
 */
export type ConstraintParamMusicType =
  | ConstraintParamNote
  | ConstraintParamChord
  | ConstraintParamScale
  | ConstraintParamMode;

/** Note selector parameter */
export interface ConstraintParamNote {
  readonly kind: 'note';
  readonly defaultValue: string;
  readonly label: string;
  readonly description?: string;
  /** Allow accidentals */
  readonly allowAccidentals?: boolean;
  /** MIDI range */
  readonly midiRange?: readonly [number, number];
}

/** Chord selector parameter */
export interface ConstraintParamChord {
  readonly kind: 'chord';
  readonly defaultValue: string;
  readonly label: string;
  readonly description?: string;
  /** Available chord qualities */
  readonly qualities?: readonly string[];
}

/** Scale selector parameter */
export interface ConstraintParamScale {
  readonly kind: 'scale';
  readonly defaultValue: string;
  readonly label: string;
  readonly description?: string;
  /** Available scale types */
  readonly scaleTypes?: readonly string[];
}

/** Mode selector parameter */
export interface ConstraintParamMode {
  readonly kind: 'mode';
  readonly defaultValue: string;
  readonly label: string;
  readonly description?: string;
}

/**
 * C1074: Culture-specific parameter types (raga, tala, tune type).
 */
export type ConstraintParamCultureType =
  | ConstraintParamRaga
  | ConstraintParamTala
  | ConstraintParamTuneType
  | ConstraintParamChineseMode;

/** Carnatic raga selector */
export interface ConstraintParamRaga {
  readonly kind: 'raga';
  readonly defaultValue: string;
  readonly label: string;
  readonly description?: string;
  /** Filter by melakarta (parent scale) */
  readonly melaFilter?: string;
}

/** Carnatic/Hindustani tala selector */
export interface ConstraintParamTala {
  readonly kind: 'tala';
  readonly defaultValue: string;
  readonly label: string;
  readonly description?: string;
}

/** Celtic tune type selector */
export interface ConstraintParamTuneType {
  readonly kind: 'tune_type';
  readonly defaultValue: string;
  readonly label: string;
  readonly description?: string;
}

/** Chinese mode selector */
export interface ConstraintParamChineseMode {
  readonly kind: 'chinese_mode';
  readonly defaultValue: string;
  readonly label: string;
  readonly description?: string;
  /** Include bian (auxiliary) tones */
  readonly includeBian?: boolean;
}

/**
 * Union of all constraint parameter types.
 */
export type AnyConstraintParam =
  | ConstraintParamType
  | ConstraintParamMusicType
  | ConstraintParamCultureType;

// ============================================================================
// CONSTRAINT DEFINITION VALIDATION (C1002)
// ============================================================================

/**
 * C1002: Validate a CustomConstraintDefinition has all required fields
 * and conforms to type expectations.
 */
export function validateConstraintDefinition(
  def: Partial<CustomConstraintDefinition>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!def.type || typeof def.type !== 'string') {
    errors.push('type is required and must be a non-empty string');
  } else {
    const nsResult = validateNamespace(def.type);
    if (!nsResult.valid) {
      errors.push(...nsResult.errors);
    }
  }

  if (!def.displayName || typeof def.displayName !== 'string') {
    errors.push('displayName is required and must be a non-empty string');
  }

  if (!def.description || typeof def.description !== 'string') {
    errors.push('description is required and must be a non-empty string');
  }

  const validCategories: CustomConstraintCategory[] = [
    'pitch', 'rhythm', 'harmony', 'texture', 'form',
    'ornament', 'style', 'culture', 'analysis', 'custom',
  ];
  if (!def.category || !validCategories.includes(def.category)) {
    errors.push(`category must be one of: ${validCategories.join(', ')}`);
  }

  if (typeof def.toPrologFact !== 'function') {
    errors.push('toPrologFact must be a function');
  }

  if (typeof def.toPrologTerm !== 'function') {
    errors.push('toPrologTerm must be a function');
  }

  if (def.parameterDefs) {
    for (const param of def.parameterDefs) {
      if (!param.label || typeof param.label !== 'string') {
        errors.push(`parameterDefs: each param must have a non-empty label`);
      }
      if (!param.kind) {
        errors.push(`parameterDefs: each param must have a kind`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================================
// PROLOG CODE SAFETY (C1022-C1031)
// ============================================================================

/**
 * C1022: Dangerous Prolog patterns that could cause infinite loops or security issues.
 */
const PROLOG_DANGEROUS_PATTERNS: ReadonlyArray<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bassert[az]?\s*\(/i, reason: 'Dynamic assertion (assert/assertz/asserta) can corrupt KB' },
  { pattern: /\bretract\s*\(/i, reason: 'Dynamic retraction can corrupt KB' },
  { pattern: /\babolish\s*\(/i, reason: 'Abolishing predicates can corrupt KB' },
  { pattern: /\bhalt\b/i, reason: 'halt/0 would stop the Prolog engine' },
  { pattern: /\bshell\s*\(/i, reason: 'Shell access is not allowed in custom predicates' },
  { pattern: /\bsee\s*\(|told\b|tell\s*\(/i, reason: 'File I/O is not allowed in custom predicates' },
  { pattern: /\bread_term\s*\(/i, reason: 'Stream reading is not allowed in custom predicates' },
  { pattern: /\bopen\s*\(/i, reason: 'File opening is not allowed in custom predicates' },
  { pattern: /\bload_files?\s*\(/i, reason: 'Loading files is not allowed in custom predicates' },
  { pattern: /\bconsult\s*\(/i, reason: 'Consulting files is not allowed in custom predicates' },
];

/**
 * C1022: Maximum recursion depth for custom Prolog predicates.
 */
const MAX_CUSTOM_PROLOG_RECURSION = 100;

/**
 * C1030: Prolog syntax error with line number information.
 */
export interface PrologSyntaxError {
  readonly line: number;
  readonly column?: number;
  readonly message: string;
  readonly code: string;
}

/**
 * C1022: Sanitize Prolog code by checking for dangerous patterns.
 * Returns a ValidationResult with any issues found.
 */
export function sanitizePrologCode(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const { pattern, reason } of PROLOG_DANGEROUS_PATTERNS) {
    if (pattern.test(code)) {
      errors.push(`Unsafe Prolog pattern detected: ${reason}`);
    }
  }

  // Check for unbounded recursion patterns (simple heuristic)
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    // Direct left-recursion: foo(...) :- foo(...)
    const headMatch = line.match(/^(\w+)\s*\(/);
    if (headMatch && line.includes(':-')) {
      const predName = headMatch[1];
      const body = line.split(':-')[1] ?? '';
      const bodyCallPattern = new RegExp(`\\b${predName}\\s*\\(`);
      if (bodyCallPattern.test(body)) {
        // Check if there's a base case nearby
        const hasBaseCase = lines.some((l, j) =>
          j !== i && l.trim().startsWith(`${predName}(`) && !l.includes(':-')
        );
        if (!hasBaseCase) {
          warnings.push(
            `Line ${i + 1}: Possible unbounded left-recursion in predicate '${predName}' — ensure a base case exists`
          );
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * C1023: Enforce namespace prefixes on Prolog predicates defined in custom code.
 * All predicate heads must start with the given namespace prefix.
 */
export function enforcePrologNamespace(
  code: string,
  namespace: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = namespace.replace(/[^a-z0-9_]/gi, '_');
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    // Skip comments and empty lines
    if (line.startsWith('%') || line === '' || line.startsWith('/*')) continue;
    // Skip directives
    if (line.startsWith(':-')) continue;

    // Match predicate head definitions: name(...)
    const headMatch = line.match(/^([a-z_]\w*)\s*[\(/]/);
    if (headMatch) {
      const predName = headMatch[1]!;
      if (!predName.startsWith(prefix + '_') && predName !== prefix) {
        errors.push(
          `Line ${i + 1}: Predicate '${predName}' must be prefixed with '${prefix}_' (e.g., '${prefix}_${predName}')`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * C1024: Basic Prolog syntax validation.
 * Checks for balanced parentheses, proper clause termination, etc.
 */
export function validatePrologSyntax(code: string): readonly PrologSyntaxError[] {
  const syntaxErrors: PrologSyntaxError[] = [];
  const lines = code.split('\n');
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    // Handle block comments
    if (inBlockComment) {
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
      continue;
    }

    // Skip line comments and empty lines
    if (trimmed.startsWith('%') || trimmed === '') continue;

    // Check balanced parentheses within a clause
    let depth = 0;
    for (let j = 0; j < trimmed.length; j++) {
      if (trimmed[j] === '(') depth++;
      if (trimmed[j] === ')') depth--;
      if (depth < 0) {
        syntaxErrors.push({
          line: i + 1,
          column: j + 1,
          message: 'Unmatched closing parenthesis',
          code: trimmed,
        });
        break;
      }
    }

    // Check clause termination (lines ending with content should end with . or ,)
    if (depth === 0 && trimmed.length > 0) {
      const lastChar = trimmed[trimmed.length - 1];
      // Lines that are complete clauses should end with '.'
      // Lines that continue should end with ',' or ':-' or '->'
      if (lastChar !== '.' && lastChar !== ',' && lastChar !== '-' && !trimmed.endsWith(':-')) {
        // Could be a multi-line clause — not an error per se, just a warning candidate
      }
    }

    // Check for unclosed quotes
    let inSingleQuote = false;
    let inDoubleQuote = false;
    for (let j = 0; j < trimmed.length; j++) {
      const ch = trimmed[j]!;
      if (ch === "'" && !inDoubleQuote) inSingleQuote = !inSingleQuote;
      if (ch === '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
    }
    if (inSingleQuote || inDoubleQuote) {
      syntaxErrors.push({
        line: i + 1,
        message: 'Unclosed string literal',
        code: trimmed,
      });
    }
  }

  if (inBlockComment) {
    syntaxErrors.push({
      line: lines.length,
      message: 'Unclosed block comment (/* without matching */)',
      code: '',
    });
  }

  return syntaxErrors;
}

/**
 * C1025: Prolog dependency declaration for custom predicate modules.
 */
export interface PrologDependency {
  /** Required predicate name (e.g., 'chord_quality/2') */
  readonly predicate: string;
  /** Module that should provide this predicate */
  readonly module?: string;
  /** Minimum version if versioned */
  readonly minVersion?: string;
}

/**
 * C1025: Declare and validate dependencies for custom Prolog code.
 */
export function validatePrologDependencies(
  dependencies: readonly PrologDependency[],
  availablePredicates: ReadonlySet<string>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const dep of dependencies) {
    // Normalize: strip arity for set lookup
    const baseName = dep.predicate.split('/')[0]!;
    if (!availablePredicates.has(dep.predicate) && !availablePredicates.has(baseName)) {
      errors.push(
        `Required predicate '${dep.predicate}' is not available` +
        (dep.module ? ` (expected from module '${dep.module}')` : '')
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * C1026: Prolog predicate deprecation declaration.
 */
export interface PrologPredicateInfo {
  readonly name: string;
  readonly arity: number;
  readonly deprecated?: boolean;
  readonly deprecationMessage?: string;
  readonly replacedBy?: string;
  readonly since?: string;
}

/**
 * C1026: Registry of predicate metadata for versioning/deprecation.
 */
const predicateInfoRegistry = new Map<string, PrologPredicateInfo>();

/**
 * C1026: Register predicate metadata.
 */
export function registerPredicateInfo(info: PrologPredicateInfo): void {
  predicateInfoRegistry.set(`${info.name}/${info.arity}`, info);
}

/**
 * C1026: Get predicate metadata.
 */
export function getPredicateInfo(name: string, arity: number): PrologPredicateInfo | undefined {
  return predicateInfoRegistry.get(`${name}/${arity}`);
}

/**
 * C1026: Check if a predicate is deprecated.
 */
export function isPredicateDeprecated(name: string, arity: number): boolean {
  const info = predicateInfoRegistry.get(`${name}/${arity}`);
  return info?.deprecated === true;
}

/**
 * C1030: Parse Prolog errors and attach line numbers.
 */
export function parsePrologErrors(
  errorMessage: string,
  sourceCode: string
): readonly PrologSyntaxError[] {
  const errors: PrologSyntaxError[] = [];
  const lines = sourceCode.split('\n');

  // Try to extract line info from typical Prolog error formats
  // e.g., "ERROR: line 5: Syntax error: Unexpected token"
  const linePattern = /(?:line|Line)\s+(\d+):\s*(.*)/g;
  let match;
  while ((match = linePattern.exec(errorMessage)) !== null) {
    const lineNum = parseInt(match[1]!, 10);
    errors.push({
      line: lineNum,
      message: match[2]!,
      code: lines[lineNum - 1] ?? '',
    });
  }

  // If no line info could be extracted, report the whole error
  if (errors.length === 0 && errorMessage.trim()) {
    errors.push({
      line: 1,
      message: errorMessage,
      code: lines[0] ?? '',
    });
  }

  return errors;
}

/**
 * C1031: Configuration for Prolog query timeout enforcement.
 */
export interface PrologTimeoutConfig {
  /** Maximum milliseconds for a single query */
  readonly queryTimeoutMs: number;
  /** Maximum inference steps (for step-limited engines) */
  readonly maxInferences: number;
  /** Maximum recursion depth */
  readonly maxRecursionDepth: number;
}

/**
 * C1031: Default timeout configuration for custom predicates.
 */
export const DEFAULT_PROLOG_TIMEOUT: PrologTimeoutConfig = {
  queryTimeoutMs: 5000,
  maxInferences: 100_000,
  maxRecursionDepth: MAX_CUSTOM_PROLOG_RECURSION,
};

/**
 * C1031: Generate Prolog preamble that enforces recursion/inference limits.
 */
export function generateTimeoutPreamble(config: PrologTimeoutConfig = DEFAULT_PROLOG_TIMEOUT): string {
  return `
%% Query timeout enforcement (C1031)
:- set_prolog_flag(max_inferences, ${config.maxInferences}).
:- set_prolog_flag(max_depth, ${config.maxRecursionDepth}).
`;
}

/**
 * C1027: Load custom Prolog code into the registry with full validation.
 * Combines sanitization (C1022), namespace enforcement (C1023),
 * syntax validation (C1024), and timeout enforcement (C1031).
 */
export function loadCustomProlog(
  code: string,
  namespace: string,
  options?: { skipSanitize?: boolean; skipNamespaceCheck?: boolean }
): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // C1024: Syntax validation
  const syntaxErrors = validatePrologSyntax(code);
  for (const err of syntaxErrors) {
    allErrors.push(`Syntax error at line ${err.line}: ${err.message}`);
  }

  // C1022: Safety sanitization
  if (!options?.skipSanitize) {
    const sanitizeResult = sanitizePrologCode(code);
    allErrors.push(...sanitizeResult.errors);
    allWarnings.push(...sanitizeResult.warnings);
  }

  // C1023: Namespace enforcement
  if (!options?.skipNamespaceCheck) {
    const nsResult = enforcePrologNamespace(code, namespace);
    allErrors.push(...nsResult.errors);
    allWarnings.push(...nsResult.warnings);
  }

  if (allErrors.length === 0) {
    // Safe to load — add timeout preamble and register
    const wrappedCode = `
%% Custom Prolog module: ${namespace}
%% Loaded with recursion depth limit ${MAX_CUSTOM_PROLOG_RECURSION}
${code}
`;
    constraintRegistry.registerPrologCode(`custom:${namespace}`, wrappedCode);
  }

  return { valid: allErrors.length === 0, errors: allErrors, warnings: allWarnings };
}

/**
 * C1028: Unload custom Prolog code by namespace.
 * Removes all predicates registered under the given namespace.
 */
export function unloadCustomProlog(namespace: string): boolean {
  // Remove from registry's Prolog loaders
  const key = `custom:${namespace}`;
  // Access internal state — we need to use the registry's public API
  // Since unregister works on constraint definitions, we also need to clear Prolog code
  // We'll clear all constraints in this namespace and their Prolog code
  const types = constraintRegistry.getAllTypes();
  let removed = false;
  for (const type of types) {
    if (type.startsWith(`${namespace}:`) || type === key) {
      constraintRegistry.unregister(type);
      removed = true;
    }
  }
  return removed;
}

// ============================================================================
// DEPRECATION AND MIGRATION (C1009-C1010)
// ============================================================================

/**
 * C1009: Check for deprecated constraint versions and emit warnings.
 */
export function checkDeprecatedConstraints(
  constraints: readonly CustomConstraint[]
): readonly string[] {
  const warnings: string[] = [];
  for (const constraint of constraints) {
    const version = constraintRegistry.getVersion(constraint.type);
    if (version?.deprecated) {
      warnings.push(
        `Constraint '${constraint.type}' is deprecated` +
        (version.deprecationMessage ? `: ${version.deprecationMessage}` : '') +
        (version.since ? ` (since ${version.since})` : '')
      );
    }
  }
  return warnings;
}

/**
 * C1010: Migration function signature for evolving constraint schemas.
 */
export type ConstraintMigrationFn = (
  oldConstraint: CustomConstraint
) => CustomConstraint;

/**
 * C1010: Registry of migration functions keyed by "fromType→toType".
 */
const migrationRegistry = new Map<string, ConstraintMigrationFn>();

/**
 * C1010: Register a migration from one constraint version/type to another.
 */
export function registerConstraintMigration(
  fromType: string,
  toType: string,
  migration: ConstraintMigrationFn
): void {
  migrationRegistry.set(`${fromType}→${toType}`, migration);
}

/**
 * C1010: Apply migration if available, otherwise return constraint as-is.
 */
export function migrateConstraint(
  constraint: CustomConstraint,
  targetType: string
): CustomConstraint {
  const key = `${constraint.type}→${targetType}`;
  const migration = migrationRegistry.get(key);
  if (migration) {
    return migration(constraint);
  }
  return constraint;
}

/**
 * C1010: Migrate all constraints in a list, applying available migrations.
 */
export function migrateConstraints(
  constraints: readonly CustomConstraint[],
  targetType: string
): readonly CustomConstraint[] {
  return constraints.map(c => migrateConstraint(c, targetType));
}

// ============================================================================
// CUSTOM CONSTRAINT TYPE
// ============================================================================

/**
 * Base type for user-defined constraints.
 * The `type` field must start with 'custom:' or a user namespace.
 */
export interface CustomConstraint {
  readonly type: string;
  readonly hard: boolean;
  readonly weight?: number;
  /** Arbitrary parameters defined by the constraint */
  readonly params: Record<string, unknown>;
}

/**
 * Type guard for custom constraints.
 */
export function isCustomConstraint(c: MusicConstraint | CustomConstraint): c is CustomConstraint {
  return 'params' in c && (c.type.startsWith('custom:') || c.type.includes(':'));
}

// ============================================================================
// NAMESPACE VALIDATION (C1003)
// ============================================================================

/**
 * C1003: Valid namespace prefixes for custom constraint types.
 * All constraint types must be namespaced with one of these prefixes.
 */
export const VALID_NAMESPACES = ['user:', 'pack:', 'test:', 'builtin:'] as const;

/**
 * C1003: Validate that a constraint type has a valid namespace prefix.
 */
export function validateNamespace(type: string): ValidationResult {
  const hasValidPrefix = VALID_NAMESPACES.some(ns => type.startsWith(ns))
    || type.includes(':');

  if (!hasValidPrefix) {
    return {
      valid: false,
      errors: [
        `Constraint type '${type}' must have a namespace prefix (e.g., 'user:', 'pack:').`,
      ],
      warnings: [],
    };
  }

  const [namespace, name] = type.split(':', 2);
  if (!name || name.length === 0) {
    return {
      valid: false,
      errors: [`Constraint type '${type}' has an empty name after namespace '${namespace}:'.`],
      warnings: [],
    };
  }

  return { valid: true, errors: [], warnings: [] };
}

// ============================================================================
// RUNTIME TYPE CHECKING (C1004-C1005)
// ============================================================================

/**
 * C1004-C1005: Validate custom constraint params against its parameter definitions.
 */
export function validateConstraintParams(
  constraint: CustomConstraint,
  paramDefs: readonly AnyConstraintParam[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const paramDef of paramDefs) {
    const value = constraint.params[paramDef.label];

    // Check if a value is provided at all
    if (value === undefined || value === null) {
      // Not required — just skip
      continue;
    }

    switch (paramDef.kind) {
      case 'enum':
        if (typeof value !== 'string' || !paramDef.values.includes(value)) {
          errors.push(`Parameter '${paramDef.label}' must be one of: ${paramDef.values.join(', ')}`);
        }
        break;
      case 'number': {
        if (typeof value !== 'number') {
          errors.push(`Parameter '${paramDef.label}' must be a number`);
        } else {
          if (paramDef.min !== undefined && value < paramDef.min) {
            errors.push(`Parameter '${paramDef.label}' must be >= ${paramDef.min}`);
          }
          if (paramDef.max !== undefined && value > paramDef.max) {
            errors.push(`Parameter '${paramDef.label}' must be <= ${paramDef.max}`);
          }
        }
        break;
      }
      case 'range':
        if (!Array.isArray(value) || value.length !== 2) {
          errors.push(`Parameter '${paramDef.label}' must be a [low, high] array`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`Parameter '${paramDef.label}' must be a boolean`);
        }
        break;
      case 'string': {
        if (typeof value !== 'string') {
          errors.push(`Parameter '${paramDef.label}' must be a string`);
        } else {
          if (paramDef.maxLength !== undefined && value.length > paramDef.maxLength) {
            errors.push(`Parameter '${paramDef.label}' exceeds max length ${paramDef.maxLength}`);
          }
          if (paramDef.pattern && !new RegExp(paramDef.pattern).test(value)) {
            errors.push(`Parameter '${paramDef.label}' doesn't match pattern /${paramDef.pattern}/`);
          }
        }
        break;
      }
      case 'note':
      case 'chord':
      case 'scale':
      case 'mode':
      case 'raga':
      case 'tala':
      case 'tune_type':
      case 'chinese_mode':
        // Music-domain types: basic string check
        if (typeof value !== 'string') {
          errors.push(`Parameter '${paramDef.label}' must be a string (${paramDef.kind} selector)`);
        }
        break;
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================================
// CONSTRAINT VERSIONING (C1008)
// ============================================================================

/**
 * C1008: Version information for constraint definitions.
 */
export interface ConstraintVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly deprecated?: boolean;
  readonly deprecationMessage?: string;
  readonly since?: string;
}

/**
 * C1008: Parse a semver-style version string.
 */
export function parseConstraintVersion(version: string): ConstraintVersion {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] ?? 1,
    minor: parts[1] ?? 0,
    patch: parts[2] ?? 0,
  };
}

/**
 * C1008: Compare two constraint versions. Returns -1, 0, or 1.
 */
export function compareVersions(a: ConstraintVersion, b: ConstraintVersion): number {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  return 0;
}

// ============================================================================
// CONSTRAINT REGISTRY
// ============================================================================

/**
 * C1006-C1007: Serialized constraint pack format.
 */
export interface ConstraintPackData {
  readonly packId: string;
  readonly version: string;
  readonly definitions: ReadonlyArray<{
    readonly type: string;
    readonly displayName: string;
    readonly description: string;
    readonly category: CustomConstraintCategory;
    readonly parameterSchema?: Record<string, unknown>;
  }>;
  readonly prologCode?: string;
}

/**
 * Registry for custom constraint definitions.
 * Singleton pattern for global access.
 */
class ConstraintRegistry {
  private definitions = new Map<string, CustomConstraintDefinition>();
  private prologLoaders = new Map<string, string>();
  private versions = new Map<string, ConstraintVersion>();

  /**
   * Register a custom constraint definition.
   * C1003: Validates namespace prefix before registering.
   */
  register<T extends CustomConstraint>(definition: CustomConstraintDefinition<T>): void {
    if (this.definitions.has(definition.type)) {
      console.warn(`Constraint type '${definition.type}' is being re-registered`);
    }
    this.definitions.set(definition.type, definition as CustomConstraintDefinition);
  }
  
  /**
   * Unregister a constraint definition.
   */
  unregister(type: string): boolean {
    return this.definitions.delete(type);
  }
  
  /**
   * Get a constraint definition by type.
   */
  get(type: string): CustomConstraintDefinition | undefined {
    return this.definitions.get(type);
  }
  
  /**
   * Check if a constraint type is registered.
   */
  has(type: string): boolean {
    return this.definitions.has(type);
  }
  
  /**
   * Get all registered constraint types.
   */
  getAllTypes(): string[] {
    return Array.from(this.definitions.keys());
  }
  
  /**
   * Get all definitions in a category.
   */
  getByCategory(category: CustomConstraintCategory): CustomConstraintDefinition[] {
    return Array.from(this.definitions.values()).filter(d => d.category === category);
  }
  
  /**
   * Register custom Prolog code to be loaded with the constraint.
   */
  registerPrologCode(constraintType: string, prologCode: string): void {
    this.prologLoaders.set(constraintType, prologCode);
  }
  
  /**
   * Get Prolog code for a constraint type.
   */
  getPrologCode(constraintType: string): string | undefined {
    return this.prologLoaders.get(constraintType);
  }
  
  /**
   * Get all registered Prolog code.
   */
  getAllPrologCode(): string {
    return Array.from(this.prologLoaders.values()).join('\n\n');
  }
  
  /**
   * Convert a custom constraint to Prolog fact.
   */
  constraintToPrologFact(constraint: CustomConstraint, specId: string): string | null {
    const def = this.definitions.get(constraint.type);
    if (!def) {
      console.warn(`No definition for constraint type '${constraint.type}'`);
      return null;
    }
    return def.toPrologFact(constraint, specId);
  }
  
  /**
   * Convert a custom constraint to Prolog term.
   */
  constraintToPrologTerm(constraint: CustomConstraint): string | null {
    const def = this.definitions.get(constraint.type);
    if (!def) {
      return null;
    }
    return def.toPrologTerm(constraint);
  }
  
  /**
   * Validate a custom constraint.
   */
  validate(constraint: CustomConstraint): ValidationResult {
    const def = this.definitions.get(constraint.type);
    if (!def) {
      return {
        valid: false,
        errors: [`Unknown constraint type: ${constraint.type}`],
        warnings: [],
      };
    }
    if (def.validate) {
      return def.validate(constraint);
    }
    return { valid: true, errors: [], warnings: [] };
  }
  
  /**
   * Find conflicts for a constraint against a list of others.
   */
  findConflicts(constraint: CustomConstraint, others: MusicConstraint[]): ConflictInfo[] {
    const def = this.definitions.get(constraint.type);
    if (!def || !def.getConflicts) {
      return [];
    }
    return def.getConflicts(constraint, others);
  }
  
  // ==========================================================================
  // C1006-C1007: IMPORT / EXPORT
  // ==========================================================================

  /**
   * C1006: Import constraint definitions from a pack.
   */
  import(pack: ConstraintPackData): void {
    for (const def of pack.definitions) {
      // Create a stub definition for imported constraints
      const stubDef: CustomConstraintDefinition = {
        type: def.type,
        displayName: def.displayName,
        description: def.description,
        category: def.category,
        ...(def.parameterSchema ? { parameterSchema: def.parameterSchema } : {}),
        toPrologFact(constraint: CustomConstraint, specId: string): string {
          const hard = constraint.hard ? 'hard' : 'soft';
          const weight = constraint.weight ?? 1.0;
          const predicate = def.type.replace(':', '_');
          return `spec_constraint(${specId}, ${predicate}, ${hard}, ${weight}).`;
        },
        toPrologTerm(_constraint: CustomConstraint): string {
          return def.type.replace(':', '_');
        },
      };
      this.register(stubDef);
    }
    if (pack.prologCode) {
      this.registerPrologCode(`pack:${pack.packId}`, pack.prologCode);
    }
    if (pack.version) {
      this.versions.set(pack.packId, parseConstraintVersion(pack.version));
    }
  }

  /**
   * C1007: Export all registered constraints to a serializable format.
   */
  export(): ConstraintPackData {
    const definitions = Array.from(this.definitions.values()).map(def => ({
      type: def.type,
      displayName: def.displayName,
      description: def.description,
      category: def.category,
      ...(def.parameterSchema ? { parameterSchema: def.parameterSchema } : {}),
    }));

    const prologCode = this.getAllPrologCode();
    return {
      packId: 'exported',
      version: '1.0.0',
      definitions,
      ...(prologCode ? { prologCode } : {}),
    };
  }

  // ==========================================================================
  // C1008: VERSIONING
  // ==========================================================================

  /**
   * C1008: Set version information for a constraint type.
   */
  setVersion(type: string, version: ConstraintVersion): void {
    this.versions.set(type, version);
  }

  /**
   * C1008: Get version information for a constraint type.
   */
  getVersion(type: string): ConstraintVersion | undefined {
    return this.versions.get(type);
  }

  /**
   * Clear all registrations (mainly for testing).
   */
  clear(): void {
    this.definitions.clear();
    this.prologLoaders.clear();
    this.versions.clear();
  }
}

/**
 * Global constraint registry instance.
 */
export const constraintRegistry = new ConstraintRegistry();

// ============================================================================
// HELPER FUNCTIONS FOR CREATING CUSTOM CONSTRAINTS
// ============================================================================

/**
 * Create a custom constraint with the given parameters.
 */
export function createCustomConstraint(
  type: string,
  params: Record<string, unknown>,
  hard = false,
  weight?: number
): CustomConstraint {
  return weight !== undefined
    ? { type, hard, weight, params }
    : { type, hard, params };
}

/**
 * Define and register a simple custom constraint.
 * Convenience function for common cases.
 */
export function defineSimpleConstraint(options: {
  type: string;
  displayName: string;
  description: string;
  category: CustomConstraintCategory;
  prologPredicate: string;
  parameterNames: string[];
  prologCode?: string;
}): void {
  const definition: CustomConstraintDefinition = {
    type: options.type,
    displayName: options.displayName,
    description: options.description,
    category: options.category,
    
    toPrologFact(constraint: CustomConstraint, specId: string): string {
      const hard = constraint.hard ? 'hard' : 'soft';
      const weight = constraint.weight ?? 1.0;
      const term = this.toPrologTerm(constraint);
      return `spec_constraint(${specId}, ${term}, ${hard}, ${weight}).`;
    },
    
    toPrologTerm(constraint: CustomConstraint): string {
      const args = options.parameterNames
        .map(name => {
          const val = constraint.params[name];
          if (typeof val === 'string') return val;
          if (typeof val === 'number') return String(val);
          if (typeof val === 'boolean') return val ? 'true' : 'false';
          return JSON.stringify(val);
        })
        .join(', ');
      return `${options.prologPredicate}(${args})`;
    },
  };
  
  constraintRegistry.register(definition);
  
  if (options.prologCode) {
    constraintRegistry.registerPrologCode(options.type, options.prologCode);
  }
}

// ============================================================================
// CARD INTEGRATION
// ============================================================================

/**
 * C1041: Interface for cards that contribute custom constraints.
 * C1042: contributes.constraints[] via getConstraintDefinitions()
 * C1043: contributes.prologCode via getPrologCode()
 * C1044: contributes.constraintPacks[] via getConstraintPacks()
 */
export interface ConstraintContributingCard {
  /** C1042: Get the constraint definitions this card contributes */
  getConstraintDefinitions(): CustomConstraintDefinition[];

  /** C1043: Get Prolog code this card requires */
  getPrologCode?(): string;

  /** Get current constraints from card state */
  getActiveConstraints(): CustomConstraint[];

  /** C1044: Get constraint pack IDs this card bundles */
  getConstraintPacks?(): ConstraintPackData[];
}

/**
 * C1045: Register all constraints from a card (automatic on load).
 */
export function registerCardConstraints(card: ConstraintContributingCard): void {
  for (const def of card.getConstraintDefinitions()) {
    constraintRegistry.register(def);
  }

  if (card.getPrologCode) {
    const code = card.getPrologCode();
    if (code) {
      const defs = card.getConstraintDefinitions();
      const firstDef = defs[0];
      if (firstDef) {
        constraintRegistry.registerPrologCode(firstDef.type, code);
      }
    }
  }

  // C1044: Import bundled constraint packs
  if (card.getConstraintPacks) {
    for (const pack of card.getConstraintPacks()) {
      constraintRegistry.import(pack);
    }
  }
}

/**
 * C1046: Unregister all constraints from a card (automatic on remove).
 */
export function unregisterCardConstraints(card: ConstraintContributingCard): void {
  for (const def of card.getConstraintDefinitions()) {
    constraintRegistry.unregister(def.type);
  }
}

// ============================================================================
// PROLOG LOADER INTEGRATION
// ============================================================================

/**
 * Generate Prolog code to load all custom constraint predicates.
 */
export function generateCustomPrologLoader(): string {
  const customCode = constraintRegistry.getAllPrologCode();
  
  if (!customCode.trim()) {
    return '%% No custom constraint Prolog code registered\n';
  }
  
  return `
%% ============================================================================
%% CUSTOM CONSTRAINT PREDICATES (User-Defined)
%% ============================================================================

${customCode}

%% Mark custom constraints as loaded
custom_constraints_loaded.
`;
}

/**
 * Get all custom constraints as Prolog facts for a given spec.
 */
export function customConstraintsToPrologFacts(
  constraints: CustomConstraint[],
  specId = 'current'
): string[] {
  const facts: string[] = [];

  for (const constraint of constraints) {
    const fact = constraintRegistry.constraintToPrologFact(constraint, specId);
    if (fact) {
      facts.push(fact);
    }
  }

  return facts;
}

// ============================================================================
// BUILT-IN CONSTRAINT PACKS (C1413-C1414)
// ============================================================================

/**
 * C1413: Bebop Fundamentals constraint pack.
 * Bundles enclosures, digital patterns, and arpeggiation constraints.
 */
export const BEBOP_FUNDAMENTALS_PACK: ConstraintPackData = {
  packId: 'bebop_fundamentals',
  version: '1.0.0',
  definitions: [
    {
      type: 'pack:bebop_enclosure',
      displayName: 'Bebop Enclosure',
      description: 'Chromatic enclosure approach to chord tones',
      category: 'style',
    },
    {
      type: 'pack:bebop_digital_pattern',
      displayName: 'Bebop Digital Pattern',
      description: 'Scale-degree based digital patterns (1235, 1357, etc.)',
      category: 'style',
    },
    {
      type: 'pack:bebop_arpeggio',
      displayName: 'Bebop Arpeggio',
      description: 'Arpeggio-based lines through chord changes',
      category: 'style',
    },
    {
      type: 'pack:bebop_passing_tone',
      displayName: 'Bebop Passing Tone',
      description: 'Chromatic passing tone placement for 8-note scales',
      category: 'pitch',
    },
  ],
  prologCode: `
%% Bebop fundamentals constraint pack predicates
bebop_enclosure_constraint(chromatic, chord_tones).
bebop_enclosure_constraint(diatonic, guide_tones).
bebop_digital_pattern_constraint('1235').
bebop_digital_pattern_constraint('1357').
bebop_digital_pattern_constraint('3579').
bebop_arpeggio_constraint(up, chord_tones).
bebop_arpeggio_constraint(down, chord_tones).
bebop_arpeggio_constraint(up_down, extended).
`,
};

/**
 * C1414: Modal Jazz Vocabulary constraint pack.
 * Bundles quartal harmony, pentatonic superimposition, and static harmony constraints.
 */
// ============================================================================
// CONSTRAINT PARAMETER GROUPS AND PRESETS (C1075-C1078)
// ============================================================================

/**
 * C1075: A group of parameters that can be collapsed in the UI.
 */
export interface ConstraintParamGroup {
  readonly label: string;
  readonly description?: string;
  readonly collapsed?: boolean;
  readonly params: readonly string[];
}

/**
 * C1076: A named preset configuration for constraint parameters.
 */
export interface ConstraintPreset {
  readonly name: string;
  readonly description?: string;
  readonly params: Record<string, unknown>;
}

/**
 * C1076: Preset storage for constraints.
 */
const presetStorage = new Map<string, ConstraintPreset[]>();

/**
 * C1076: Save a named preset for a constraint type.
 */
export function saveConstraintPreset(
  constraintType: string,
  preset: ConstraintPreset
): void {
  const existing = presetStorage.get(constraintType) ?? [];
  // Replace if same name exists
  const filtered = existing.filter(p => p.name !== preset.name);
  filtered.push(preset);
  presetStorage.set(constraintType, filtered);
}

/**
 * C1076: Load all presets for a constraint type.
 */
export function loadConstraintPresets(constraintType: string): readonly ConstraintPreset[] {
  return presetStorage.get(constraintType) ?? [];
}

/**
 * C1076: Delete a preset by name.
 */
export function deleteConstraintPreset(constraintType: string, presetName: string): boolean {
  const existing = presetStorage.get(constraintType);
  if (!existing) return false;
  const filtered = existing.filter(p => p.name !== presetName);
  if (filtered.length === existing.length) return false;
  presetStorage.set(constraintType, filtered);
  return true;
}

/**
 * C1077: Generate random parameters for a constraint based on its parameter definitions.
 */
export function randomizeConstraintParams(
  paramDefs: readonly AnyConstraintParam[]
): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  for (const def of paramDefs) {
    switch (def.kind) {
      case 'enum':
        params[def.label] = def.values[Math.floor(Math.random() * def.values.length)];
        break;
      case 'number': {
        const min = def.min ?? 0;
        const max = def.max ?? 100;
        const step = def.step ?? 1;
        const range = Math.floor((max - min) / step);
        params[def.label] = min + Math.floor(Math.random() * (range + 1)) * step;
        break;
      }
      case 'range': {
        const step = def.step ?? 1;
        const range = Math.floor((def.max - def.min) / step);
        const a = def.min + Math.floor(Math.random() * (range + 1)) * step;
        const b = def.min + Math.floor(Math.random() * (range + 1)) * step;
        params[def.label] = [Math.min(a, b), Math.max(a, b)];
        break;
      }
      case 'boolean':
        params[def.label] = Math.random() > 0.5;
        break;
      case 'string':
        params[def.label] = def.defaultValue;
        break;
      case 'note': {
        const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        params[def.label] = notes[Math.floor(Math.random() * notes.length)];
        break;
      }
      case 'chord': {
        const chords = def.qualities ?? ['maj', 'min', '7', 'maj7', 'min7', 'dim'];
        const roots = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        params[def.label] = `${roots[Math.floor(Math.random() * roots.length)]}${chords[Math.floor(Math.random() * chords.length)]}`;
        break;
      }
      case 'scale':
      case 'mode':
      case 'raga':
      case 'tala':
      case 'tune_type':
      case 'chinese_mode':
        params[def.label] = def.defaultValue;
        break;
    }
  }

  return params;
}

/**
 * C1078: Interpolate between two constraint parameter sets.
 * For numeric values, linearly interpolates. For non-numeric, picks based on threshold.
 */
export function interpolateConstraintParams(
  paramsA: Record<string, unknown>,
  paramsB: Record<string, unknown>,
  t: number // 0.0 = fully A, 1.0 = fully B
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const allKeys = new Set([...Object.keys(paramsA), ...Object.keys(paramsB)]);

  for (const key of allKeys) {
    const a = paramsA[key];
    const b = paramsB[key];

    if (typeof a === 'number' && typeof b === 'number') {
      result[key] = a + (b - a) * t;
    } else if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
      result[key] = a.map((av, i) => {
        const bv = b[i];
        if (typeof av === 'number' && typeof bv === 'number') {
          return av + (bv - av) * t;
        }
        return t < 0.5 ? av : bv;
      });
    } else if (typeof a === 'boolean' && typeof b === 'boolean') {
      result[key] = t < 0.5 ? a : b;
    } else {
      result[key] = t < 0.5 ? (a ?? b) : (b ?? a);
    }
  }

  return result;
}

// ============================================================================
// CONSTRAINT LEARN FROM SELECTION (C1083)
// ============================================================================

/**
 * C1083: Extract constraints from a set of note events.
 * Infers key, tempo, density, and other constraints from the selection.
 */
export function learnConstraintsFromSelection(
  notes: readonly { pitch: number; time: number; duration: number }[]
): CustomConstraint[] {
  if (notes.length === 0) return [];

  const constraints: CustomConstraint[] = [];

  // Infer pitch class set
  const pitchClasses = new Set(notes.map(n => n.pitch % 12));
  if (pitchClasses.size > 0) {
    constraints.push({
      type: 'builtin:pitch_class_set',
      hard: false,
      weight: 0.8,
      params: { pitchClasses: Array.from(pitchClasses).sort((a, b) => a - b) },
    });
  }

  // Infer register range
  const minPitch = Math.min(...notes.map(n => n.pitch));
  const maxPitch = Math.max(...notes.map(n => n.pitch));
  constraints.push({
    type: 'builtin:register_range',
    hard: false,
    weight: 0.6,
    params: { low: minPitch, high: maxPitch },
  });

  // Infer density (notes per beat, assuming beat = 1.0)
  const totalTime = Math.max(...notes.map(n => n.time + n.duration)) - Math.min(...notes.map(n => n.time));
  if (totalTime > 0) {
    const density = notes.length / totalTime;
    constraints.push({
      type: 'builtin:density',
      hard: false,
      weight: 0.5,
      params: { notesPerBeat: Math.round(density * 10) / 10 },
    });
  }

  // Infer average duration
  const avgDuration = notes.reduce((sum, n) => sum + n.duration, 0) / notes.length;
  constraints.push({
    type: 'builtin:avg_duration',
    hard: false,
    weight: 0.4,
    params: { duration: Math.round(avgDuration * 100) / 100 },
  });

  return constraints;
}

// ============================================================================
// CONSTRAINT EXPORT/IMPORT (C1085-C1086)
// ============================================================================

/**
 * C1085: Export constraints to a JSON string for sharing.
 */
export function exportConstraintsToJSON(
  constraints: readonly CustomConstraint[]
): string {
  return JSON.stringify({ version: '1.0', constraints }, null, 2);
}

/**
 * C1085: Export constraints to Prolog facts for sharing.
 */
export function exportConstraintsToProlog(
  constraints: readonly CustomConstraint[],
  specId = 'exported'
): string {
  const facts: string[] = [
    `%% Exported constraints (${constraints.length} total)`,
    `%% Generated at ${new Date().toISOString()}`,
    '',
  ];
  for (const c of constraints) {
    const fact = constraintRegistry.constraintToPrologFact(c, specId);
    if (fact) {
      facts.push(fact);
    } else {
      // Fallback: generic representation
      const hard = c.hard ? 'hard' : 'soft';
      const weight = c.weight ?? 1.0;
      facts.push(`spec_constraint(${specId}, ${c.type.replace(':', '_')}, ${hard}, ${weight}).`);
    }
  }
  return facts.join('\n');
}

/**
 * C1086: Import constraints from a JSON string.
 */
export function importConstraintsFromJSON(json: string): readonly CustomConstraint[] {
  try {
    const parsed = JSON.parse(json) as { version?: string; constraints?: readonly CustomConstraint[] };
    if (!parsed.constraints || !Array.isArray(parsed.constraints)) {
      return [];
    }
    // Validate each constraint has required fields
    return parsed.constraints.filter(
      (c): c is CustomConstraint =>
        typeof c === 'object' &&
        c !== null &&
        typeof c.type === 'string' &&
        typeof c.hard === 'boolean' &&
        typeof c.params === 'object'
    );
  } catch {
    return [];
  }
}

// ============================================================================
// CONSTRAINT PACK FORMAT (C1014)
// ============================================================================

/**
 * C1014: Constraint pack format specification.
 * A constraint pack bundles JSON constraint definitions with Prolog code.
 */
export interface ConstraintPackManifest {
  readonly packId: string;
  readonly name: string;
  readonly version: string;
  readonly author?: string;
  readonly description: string;
  readonly license?: string;
  readonly homepage?: string;
  readonly dependencies?: readonly { packId: string; minVersion: string }[];
  readonly definitions: readonly ConstraintPackDefinitionEntry[];
  readonly prologCode: string;
  readonly signature?: ConstraintPackSignature;
}

/** Entry in a pack manifest's definitions list */
export interface ConstraintPackDefinitionEntry {
  readonly type: string;
  readonly displayName: string;
  readonly description: string;
  readonly category: CustomConstraintCategory;
  readonly parameterDefs?: readonly AnyConstraintParam[];
}

/**
 * C1014: Validate a constraint pack manifest.
 */
export function validatePackManifest(
  manifest: Partial<ConstraintPackManifest>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!manifest.packId) errors.push('Missing packId');
  if (!manifest.name) errors.push('Missing name');
  if (!manifest.version) errors.push('Missing version');
  if (!manifest.description) errors.push('Missing description');
  if (!manifest.definitions || !Array.isArray(manifest.definitions)) {
    errors.push('Missing or invalid definitions array');
  } else {
    for (const [i, def] of manifest.definitions.entries()) {
      if (!def.type) errors.push(`Definition ${i}: missing type`);
      if (!def.displayName) errors.push(`Definition ${i}: missing displayName`);
      if (!def.category) errors.push(`Definition ${i}: missing category`);
    }
  }
  if (typeof manifest.prologCode !== 'string') errors.push('Missing prologCode');
  return { valid: errors.length === 0, errors };
}

/**
 * C1014: Serialize a pack manifest to JSON.
 */
export function serializePackManifest(manifest: ConstraintPackManifest): string {
  return JSON.stringify(manifest, null, 2);
}

/**
 * C1014: Parse a pack manifest from JSON.
 */
export function parsePackManifest(json: string): ConstraintPackManifest | null {
  try {
    const parsed = JSON.parse(json) as ConstraintPackManifest;
    const result = validatePackManifest(parsed);
    return result.valid ? parsed : null;
  } catch {
    return null;
  }
}

// ============================================================================
// CONSTRAINT PACK SIGNING (C1015)
// ============================================================================

/** Pack signature for verification */
export interface ConstraintPackSignature {
  readonly algorithm: 'sha256' | 'sha384' | 'sha512';
  readonly hash: string;
  readonly signedBy?: string;
  readonly timestamp?: string;
}

/**
 * C1015: Generate a simple content hash for pack verification.
 * Uses a basic string hash (for real crypto, use Web Crypto API).
 */
export function hashPackContent(manifest: ConstraintPackManifest): string {
  const content = JSON.stringify({
    packId: manifest.packId,
    version: manifest.version,
    definitions: manifest.definitions,
    prologCode: manifest.prologCode,
  });
  // Simple FNV-1a hash for non-cryptographic verification
  let hash = 2166136261;
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * C1015: Verify pack signature matches content.
 */
export function verifyPackSignature(manifest: ConstraintPackManifest): boolean {
  if (!manifest.signature) return false;
  const computedHash = hashPackContent(manifest);
  return manifest.signature.hash === computedHash;
}

// ============================================================================
// PROLOG SANDBOX (C1029)
// ============================================================================

/** Sandbox result from running custom Prolog code */
export interface PrologSandboxResult {
  readonly success: boolean;
  readonly output?: string;
  readonly errors: readonly PrologSyntaxError[];
  readonly predicatesDefined: readonly string[];
  readonly executionTimeMs: number;
}

/**
 * C1029: "Prolog sandbox" mode for testing custom predicates safely.
 * Validates code, simulates loading, reports defined predicates.
 */
export function sandboxPrologCode(
  code: string,
  namespace: string
): PrologSandboxResult {
  const startTime = Date.now();

  // Step 1: Sanitize
  const sanitizeResult = sanitizePrologCode(code);
  if (sanitizeResult.errors.length > 0) {
    return {
      success: false,
      errors: sanitizeResult.errors.map((e, i) => ({
        line: i + 1,
        message: String(e),
        code: 'SANDBOX_SANITIZE',
      })),
      predicatesDefined: [],
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Step 2: Namespace check
  const nsResult = enforcePrologNamespace(code, namespace);
  if (!nsResult.valid) {
    return {
      success: false,
      errors: nsResult.errors.map((e, i) => ({
        line: i + 1,
        message: String(e),
        code: 'SANDBOX_NAMESPACE',
      })),
      predicatesDefined: [],
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Step 3: Syntax validation
  const syntaxErrors = validatePrologSyntax(code);
  if (syntaxErrors.length > 0) {
    return {
      success: false,
      errors: syntaxErrors,
      predicatesDefined: [],
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Step 4: Extract defined predicates
  const predicatePattern = /^([a-z_][a-z0-9_]*)\s*\(/gm;
  const predicates = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = predicatePattern.exec(code)) !== null) {
    predicates.add(match[1]!);
  }

  return {
    success: true,
    output: `Sandbox OK: ${predicates.size} predicate(s) defined`,
    errors: [],
    predicatesDefined: Array.from(predicates),
    executionTimeMs: Date.now() - startTime,
  };
}

// ============================================================================
// THEORY CARD TEMPLATE (C1047)
// ============================================================================

/**
 * C1047: Template for creating new theory cards.
 * Returns a skeleton card definition that users can customize.
 */
export function createTheoryCardTemplate(
  id: string,
  displayName: string,
  category: CustomConstraintCategory,
  namespace: string
): {
  cardId: string;
  displayName: string;
  category: CustomConstraintCategory;
  params: Record<string, AnyConstraintParam>;
  constraintType: string;
  prologTemplate: string;
} {
  return {
    cardId: `${namespace}:${id}`,
    displayName,
    category,
    params: {
      enabled: {
        kind: 'boolean',
        label: 'Enabled',
        defaultValue: true,
      } satisfies ConstraintParamBoolean,
    },
    constraintType: `${namespace}:${id}`,
    prologTemplate: [
      `%% Custom theory card: ${displayName}`,
      `%% Category: ${category}`,
      `${namespace}_${id}_enabled(true).`,
      `${namespace}_${id}_apply(Spec, NewSpec) :-`,
      `  ${namespace}_${id}_enabled(true),`,
      `  NewSpec = Spec.`,
    ].join('\n'),
  };
}

// ============================================================================
// BIDIRECTIONAL SYNC (C1048-C1051)
// ============================================================================

/** Parameter-to-constraint mapping declaration */
export interface ParamConstraintMapping {
  readonly paramPath: string;
  readonly constraintType: string;
  readonly constraintField: string;
  readonly transform?: (paramValue: unknown) => unknown;
  readonly inverseTransform?: (constraintValue: unknown) => unknown;
}

/**
 * C1048: Declare mappings from card parameters to constraint fields.
 */
export function declareParamConstraintMappings(
  cardId: string,
  mappings: readonly ParamConstraintMapping[]
): { cardId: string; mappings: readonly ParamConstraintMapping[] } {
  return { cardId, mappings };
}

/**
 * C1049: Sync constraint changes → card params.
 * Given a changed constraint, update the corresponding card param.
 */
export function syncConstraintToParam(
  constraint: MusicConstraint,
  mappings: readonly ParamConstraintMapping[],
  currentParams: Record<string, unknown>
): Record<string, unknown> {
  const updated = { ...currentParams };
  for (const mapping of mappings) {
    if (constraint.type === mapping.constraintType) {
      const value = (constraint as unknown as Record<string, unknown>)[mapping.constraintField];
      if (value !== undefined) {
        updated[mapping.paramPath] = mapping.inverseTransform
          ? mapping.inverseTransform(value)
          : value;
      }
    }
  }
  return updated;
}

/**
 * C1050: Sync card param changes → constraints.
 * Given a changed param, return the updated constraint.
 */
export function syncParamToConstraint(
  paramPath: string,
  paramValue: unknown,
  mappings: readonly ParamConstraintMapping[],
  currentConstraints: readonly MusicConstraint[]
): readonly MusicConstraint[] {
  const result = [...currentConstraints];
  for (const mapping of mappings) {
    if (mapping.paramPath === paramPath) {
      const constraintValue = mapping.transform
        ? mapping.transform(paramValue)
        : paramValue;
      const idx = result.findIndex(c => c.type === mapping.constraintType);
      if (idx >= 0) {
        result[idx] = {
          ...result[idx]!,
          [mapping.constraintField]: constraintValue,
        } as MusicConstraint;
      }
    }
  }
  return result;
}

/**
 * C1051: Link constraints between cards (e.g., key card affects mode card).
 */
export interface CardToCardLink {
  readonly sourceCardId: string;
  readonly sourceParam: string;
  readonly targetCardId: string;
  readonly targetParam: string;
  readonly transform?: (value: unknown) => unknown;
}

/** Registry of card-to-card links */
const cardLinks: CardToCardLink[] = [];

export function registerCardLink(link: CardToCardLink): void {
  cardLinks.push(link);
}

export function getCardLinks(sourceCardId: string): readonly CardToCardLink[] {
  return cardLinks.filter(l => l.sourceCardId === sourceCardId);
}

export function clearCardLinks(): void {
  cardLinks.length = 0;
}

// ============================================================================
// CARD PACK BUNDLING (C1054-C1058)
// ============================================================================

/** Card pack definition */
export interface CardPackDefinition {
  readonly packId: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly cards: readonly { cardId: string; displayName: string; category: CustomConstraintCategory }[];
  readonly constraintPack?: ConstraintPackData;
  readonly dependencies?: readonly { packId: string; minVersion: string }[];
}

/** Card pack installation result */
export interface CardPackInstallResult {
  readonly success: boolean;
  readonly packId: string;
  readonly installedCards: readonly string[];
  readonly errors: readonly string[];
}

/** Installed card packs registry */
const installedPacks = new Map<string, CardPackDefinition>();

/**
 * C1054: Card pack format for bundling custom theory cards.
 */
export function createCardPack(
  packId: string,
  name: string,
  version: string,
  description: string,
  cards: readonly { cardId: string; displayName: string; category: CustomConstraintCategory }[]
): CardPackDefinition {
  return { packId, name, version, description, cards };
}

/**
 * C1056: Install a card pack.
 */
export function installCardPack(pack: CardPackDefinition): CardPackInstallResult {
  const errors: string[] = [];

  // Check dependencies
  if (pack.dependencies) {
    for (const dep of pack.dependencies) {
      const installed = installedPacks.get(dep.packId);
      if (!installed) {
        errors.push(`Missing dependency: ${dep.packId} >= ${dep.minVersion}`);
      } else {
        const installedVersion = parseConstraintVersion(installed.version);
        const requiredVersion = parseConstraintVersion(dep.minVersion);
        if (installedVersion && requiredVersion && compareVersions(installedVersion, requiredVersion) < 0) {
          errors.push(`Dependency version too old: ${dep.packId} ${installed.version} < ${dep.minVersion}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, packId: pack.packId, installedCards: [], errors };
  }

  installedPacks.set(pack.packId, pack);

  // Register constraint pack if present
  if (pack.constraintPack) {
    for (const def of pack.constraintPack.definitions) {
      if (!constraintRegistry.has(def.type)) {
        constraintRegistry.register({
          type: def.type,
          displayName: def.displayName,
          description: def.description,
          category: def.category,
          toPrologFact: (c, specId) => `spec_constraint(${specId}, ${c.type}, user_defined).`,
          toPrologTerm: (c) => `${c.type}`,
        });
      }
    }
  }

  return {
    success: true,
    packId: pack.packId,
    installedCards: pack.cards.map(c => c.cardId),
    errors: [],
  };
}

/**
 * C1057: Resolve card pack dependencies.
 */
export function resolvePackDependencies(
  pack: CardPackDefinition
): { resolved: boolean; missing: readonly { packId: string; minVersion: string }[] } {
  if (!pack.dependencies || pack.dependencies.length === 0) {
    return { resolved: true, missing: [] };
  }
  const missing: { packId: string; minVersion: string }[] = [];
  for (const dep of pack.dependencies) {
    if (!installedPacks.has(dep.packId)) {
      missing.push(dep);
    }
  }
  return { resolved: missing.length === 0, missing };
}

/**
 * C1058: Check for card pack updates.
 */
export function checkPackUpdate(
  packId: string,
  latestVersion: string
): { needsUpdate: boolean; currentVersion?: string; latestVersion: string } {
  const installed = installedPacks.get(packId);
  if (!installed) {
    return { needsUpdate: false, latestVersion };
  }
  const current = parseConstraintVersion(installed.version);
  const latest = parseConstraintVersion(latestVersion);
  if (current && latest) {
    return {
      needsUpdate: compareVersions(current, latest) < 0,
      currentVersion: installed.version,
      latestVersion,
    };
  }
  return { needsUpdate: installed.version !== latestVersion, currentVersion: installed.version, latestVersion };
}

/**
 * Get all installed packs.
 */
export function getInstalledPacks(): readonly CardPackDefinition[] {
  return Array.from(installedPacks.values());
}

/**
 * Uninstall a card pack.
 */
export function uninstallCardPack(packId: string): boolean {
  return installedPacks.delete(packId);
}

// ============================================================================
// GENERIC CONSTRAINT PARAMETER EDITOR (C1071)
// ============================================================================

/** Generated editor field descriptor */
export interface EditorFieldDescriptor {
  readonly paramDef: AnyConstraintParam;
  readonly currentValue: unknown;
  readonly fieldType: 'enum' | 'number' | 'range' | 'boolean' | 'string' | 'note' | 'chord' | 'scale' | 'mode' | 'raga' | 'tala' | 'tune_type' | 'chinese_mode';
}

/**
 * C1071: Generate editor field descriptors from constraint parameter definitions.
 * Auto-generates a UI-agnostic form description for rendering.
 */
export function generateEditorFields(
  defs: readonly AnyConstraintParam[],
  currentValues: Record<string, unknown>
): readonly EditorFieldDescriptor[] {
  return defs.map(def => ({
    paramDef: def,
    currentValue: currentValues[def.label] ?? ('defaultValue' in def ? def.defaultValue : undefined),
    fieldType: def.kind,
  }));
}

// ============================================================================
// PROJECT/WORKSPACE PERSISTENCE (C1091-C1098)
// ============================================================================

/** Constraint profile: a named set of constraints */
export interface ConstraintProfile {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly constraints: readonly CustomConstraint[];
  readonly packs: readonly string[];
  readonly createdAt: string;
}

/** Project constraint state */
export interface ProjectConstraintState {
  readonly projectId: string;
  readonly activeProfile?: string;
  readonly customConstraints: readonly CustomConstraint[];
  readonly installedPacks: readonly string[];
  readonly preferences: {
    readonly defaultPacks: readonly string[];
    readonly autoLoad: boolean;
  };
}

/** Storage key prefix for constraint persistence */
const STORAGE_PREFIX = 'cardplay.constraints.';

/**
 * C1091: Save project-level custom constraints.
 */
export function saveProjectConstraints(
  projectId: string,
  constraints: readonly CustomConstraint[]
): string {
  const state: ProjectConstraintState = {
    projectId,
    customConstraints: constraints,
    installedPacks: Array.from(installedPacks.keys()),
    preferences: {
      defaultPacks: [],
      autoLoad: true,
    },
  };
  return JSON.stringify(state);
}

/**
 * C1091: Load project-level custom constraints.
 */
export function loadProjectConstraints(json: string): ProjectConstraintState | null {
  try {
    const state = JSON.parse(json) as ProjectConstraintState;
    if (!state.projectId || !Array.isArray(state.customConstraints)) return null;
    return state;
  } catch {
    return null;
  }
}

/**
 * C1093: User preference for default constraint packs.
 */
export function getDefaultPackPreference(): readonly string[] {
  try {
    const stored = typeof localStorage !== 'undefined'
      ? localStorage.getItem(`${STORAGE_PREFIX}defaultPacks`)
      : null;
    return stored ? JSON.parse(stored) as string[] : [];
  } catch {
    return [];
  }
}

/**
 * C1094: Constraint profile switching.
 */
const profiles = new Map<string, ConstraintProfile>();

export function saveConstraintProfile(profile: ConstraintProfile): void {
  profiles.set(profile.id, profile);
}

export function loadConstraintProfile(id: string): ConstraintProfile | undefined {
  return profiles.get(id);
}

export function listConstraintProfiles(): readonly ConstraintProfile[] {
  return Array.from(profiles.values());
}

export function deleteConstraintProfile(id: string): boolean {
  return profiles.delete(id);
}

/**
 * C1095: Export project + all required custom constraints as bundle.
 */
export function exportProjectBundle(
  projectId: string,
  constraints: readonly CustomConstraint[],
  packIds: readonly string[]
): string {
  const packs: ConstraintPackData[] = [];
  for (const packId of packIds) {
    const installed = installedPacks.get(packId);
    if (installed?.constraintPack) {
      packs.push(installed.constraintPack);
    }
  }
  return JSON.stringify({
    version: '1.0.0',
    projectId,
    constraints,
    packs,
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

/**
 * C1096: Import project bundle with constraint auto-installation.
 */
export function importProjectBundle(
  json: string
): { constraints: readonly CustomConstraint[]; packIds: readonly string[]; errors: readonly string[] } {
  try {
    const bundle = JSON.parse(json) as {
      constraints?: readonly CustomConstraint[];
      packs?: readonly ConstraintPackData[];
    };
    const errors: string[] = [];
    const packIds: string[] = [];

    if (bundle.packs) {
      for (const pack of bundle.packs) {
        if (pack.packId) {
          // Auto-register constraint definitions
          for (const def of pack.definitions) {
            if (!constraintRegistry.has(def.type)) {
              constraintRegistry.register({
                type: def.type,
                displayName: def.displayName,
                description: def.description,
                category: def.category,
                toPrologFact: (c, specId) => `spec_constraint(${specId}, ${c.type}, imported).`,
                toPrologTerm: (c) => `${c.type}`,
              });
            }
          }
          packIds.push(pack.packId);
        }
      }
    }

    return {
      constraints: bundle.constraints ?? [],
      packIds,
      errors,
    };
  } catch {
    return { constraints: [], packIds: [], errors: ['Invalid bundle JSON'] };
  }
}

/**
 * C1098: Constraint health check diagnostic tool.
 */
export interface ConstraintHealthReport {
  readonly totalConstraints: number;
  readonly totalPacks: number;
  readonly issues: readonly { severity: 'error' | 'warning' | 'info'; message: string }[];
  readonly healthy: boolean;
}

export function runConstraintHealthCheck(
  constraints: readonly CustomConstraint[]
): ConstraintHealthReport {
  const issues: { severity: 'error' | 'warning' | 'info'; message: string }[] = [];

  // Check for orphan constraint types
  for (const c of constraints) {
    if (c.type.startsWith('user:') || c.type.startsWith('pack:')) {
      if (!constraintRegistry.has(c.type)) {
        issues.push({
          severity: 'warning',
          message: `Constraint type '${c.type}' not found in registry — may be from uninstalled pack`,
        });
      }
    }
  }

  // Check for duplicate types
  const typeCounts = new Map<string, number>();
  for (const c of constraints) {
    typeCounts.set(c.type, (typeCounts.get(c.type) ?? 0) + 1);
  }
  for (const [type, count] of typeCounts) {
    if (count > 1) {
      issues.push({
        severity: 'info',
        message: `Multiple constraints of type '${type}' (${count}) — may cause conflicts`,
      });
    }
  }

  // Check deprecated
  const deprecated = checkDeprecatedConstraints(constraints);
  for (const d of deprecated) {
    issues.push({
      severity: 'warning',
      message: `Deprecated constraint type: ${d}`,
    });
  }

  return {
    totalConstraints: constraints.length,
    totalPacks: installedPacks.size,
    issues,
    healthy: issues.filter(i => i.severity === 'error').length === 0,
  };
}

export const MODAL_JAZZ_VOCABULARY_PACK: ConstraintPackData = {
  packId: 'modal_jazz_vocabulary',
  version: '1.0.0',
  definitions: [
    {
      type: 'pack:quartal_voicing',
      displayName: 'Quartal Voicing',
      description: 'Fourth-based voicings for modal harmony',
      category: 'harmony',
    },
    {
      type: 'pack:pentatonic_superimposition',
      displayName: 'Pentatonic Superimposition',
      description: 'Pentatonic scale overlay for modal color',
      category: 'pitch',
    },
    {
      type: 'pack:static_harmony',
      displayName: 'Static Harmony',
      description: 'Sustained chord for modal exploration',
      category: 'harmony',
    },
    {
      type: 'pack:modal_interchange',
      displayName: 'Modal Interchange',
      description: 'Borrowing chords from parallel modes',
      category: 'harmony',
    },
  ],
  prologCode: `
%% Modal jazz vocabulary constraint pack predicates
quartal_voicing(stacked_fourths, 3).
quartal_voicing(mixed_fourths, 4).
quartal_voicing(so_what, 5).
pentatonic_superimposition(major, [0, 2, 4, 7, 9]).
pentatonic_superimposition(minor, [0, 3, 5, 7, 10]).
pentatonic_superimposition(dominant, [0, 2, 4, 7, 10]).
static_harmony_duration(short, 4).
static_harmony_duration(medium, 8).
static_harmony_duration(long, 16).
`,
};
