/**
 * GOFAI Canon — Vocabulary Policy
 *
 * This module implements Step 004 from gofai_goalB.md:
 * "Introduce a vocabulary policy: builtin meaning IDs un-namespaced;
 * extension meaning IDs must be `namespace:*` (mirrors CardPlayId rules)."
 *
 * The vocabulary policy enforces:
 * 1. Core/builtin IDs are un-namespaced (e.g., `axis:brightness`)
 * 2. Extension IDs must be namespaced (e.g., `my-pack:axis:grit`)
 * 3. Namespaces must follow naming conventions
 * 4. No collisions between core and extension IDs
 * 5. Extension IDs cannot use reserved core prefixes
 *
 * @module gofai/canon/vocabulary-policy
 */

import {
  isNamespaced,
  getNamespace,
  isValidLexemeId,
  isValidAxisId,
  isValidOpcodeId,
  isValidConstraintTypeId,
} from './types';

// =============================================================================
// Vocabulary Policy Types
// =============================================================================

/**
 * Policy violation severity.
 */
export type PolicySeverity = 'error' | 'warning';

/**
 * A vocabulary policy violation.
 */
export interface PolicyViolation {
  /** The offending ID */
  readonly id: string;

  /** Violation type */
  readonly type: PolicyViolationType;

  /** Severity */
  readonly severity: PolicySeverity;

  /** Human-readable message */
  readonly message: string;

  /** Suggested fix */
  readonly suggestion: string;
}

/**
 * Types of policy violation.
 */
export type PolicyViolationType =
  | 'missing_namespace'       // Extension ID without namespace
  | 'unexpected_namespace'    // Core ID with a namespace
  | 'invalid_namespace_format' // Namespace doesn't match naming rules
  | 'reserved_namespace'      // Uses a reserved core namespace
  | 'invalid_id_format'       // ID format is wrong
  | 'collision'               // ID collides with existing entry
  | 'empty_id'                // Empty or whitespace-only ID
  | 'invalid_characters';     // Characters not allowed in IDs

/**
 * Result of a policy check.
 */
export interface PolicyCheckResult {
  /** Whether the check passed */
  readonly ok: boolean;

  /** All violations found */
  readonly violations: readonly PolicyViolation[];

  /** Summary counts */
  readonly summary: PolicyCheckSummary;
}

/**
 * Summary of policy check results.
 */
export interface PolicyCheckSummary {
  /** Total IDs checked */
  readonly totalChecked: number;

  /** Number of errors */
  readonly errors: number;

  /** Number of warnings */
  readonly warnings: number;

  /** IDs by namespace */
  readonly byNamespace: Readonly<Record<string, number>>;
}

// =============================================================================
// Naming Conventions
// =============================================================================

/**
 * Reserved namespace prefixes (cannot be used by extensions).
 */
export const RESERVED_NAMESPACES: readonly string[] = [
  'gofai',
  'core',
  'builtin',
  'internal',
  'system',
  'cardplay',
  'cp',
] as const;

/**
 * Reserved ID type prefixes (for core IDs).
 */
export const CORE_ID_PREFIXES: readonly string[] = [
  'lex',
  'axis',
  'op',
  'constraint',
  'rule',
  'unit',
  'section',
  'layer',
  'gofai',
] as const;

/**
 * Valid namespace pattern: lowercase alphanumeric with hyphens.
 * Must start with a letter, must not end with a hyphen.
 */
const NAMESPACE_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;


// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Check if a namespace is valid.
 */
export function isValidNamespace(namespace: string): boolean {
  if (namespace.length === 0 || namespace.length > 64) return false;
  return NAMESPACE_PATTERN.test(namespace);
}

/**
 * Check if a namespace is reserved.
 */
export function isReservedNamespace(namespace: string): boolean {
  return RESERVED_NAMESPACES.includes(namespace.toLowerCase());
}

/**
 * Validate a single ID against the vocabulary policy.
 *
 * @param id - The ID to validate
 * @param isExtension - Whether this ID is from an extension
 * @param existingIds - Set of existing IDs (for collision detection)
 */
export function validateId(
  id: string,
  isExtension: boolean,
  existingIds?: ReadonlySet<string>
): readonly PolicyViolation[] {
  const violations: PolicyViolation[] = [];

  // Check for empty/whitespace
  if (!id || id.trim().length === 0) {
    violations.push({
      id,
      type: 'empty_id',
      severity: 'error',
      message: 'ID is empty or contains only whitespace',
      suggestion: 'Provide a non-empty ID following the naming conventions',
    });
    return violations;
  }

  // Check for invalid characters
  if (/[A-Z\s!@#$%^&*()+=\[\]{}"'<>,;]/.test(id)) {
    violations.push({
      id,
      type: 'invalid_characters',
      severity: 'error',
      message: `ID '${id}' contains invalid characters (uppercase, spaces, or special characters)`,
      suggestion: 'Use only lowercase letters, numbers, hyphens, underscores, and colons',
    });
  }

  const hasNamespace = isNamespaced(id);

  if (isExtension && !hasNamespace) {
    violations.push({
      id,
      type: 'missing_namespace',
      severity: 'error',
      message: `Extension ID '${id}' must be namespaced (format: namespace:type:name)`,
      suggestion: `Prefix with your extension namespace, e.g., 'my-pack:${id}'`,
    });
  }

  if (!isExtension && hasNamespace) {
    violations.push({
      id,
      type: 'unexpected_namespace',
      severity: 'error',
      message: `Core/builtin ID '${id}' must not be namespaced`,
      suggestion: `Remove the namespace prefix to make this a core ID`,
    });
  }

  // Validate namespace format if present
  if (hasNamespace) {
    const namespace = getNamespace(id);
    if (namespace !== undefined) {
      if (!isValidNamespace(namespace)) {
        violations.push({
          id,
          type: 'invalid_namespace_format',
          severity: 'error',
          message: `Namespace '${namespace}' in ID '${id}' is not valid (must be lowercase-hyphenated)`,
          suggestion: 'Use lowercase letters and hyphens only (e.g., my-pack)',
        });
      }

      if (isReservedNamespace(namespace)) {
        violations.push({
          id,
          type: 'reserved_namespace',
          severity: 'error',
          message: `Namespace '${namespace}' is reserved and cannot be used by extensions`,
          suggestion: `Choose a different namespace (reserved: ${RESERVED_NAMESPACES.join(', ')})`,
        });
      }
    }
  }

  // Check for collisions
  if (existingIds !== undefined && existingIds.has(id)) {
    violations.push({
      id,
      type: 'collision',
      severity: 'error',
      message: `ID '${id}' collides with an existing vocabulary entry`,
      suggestion: 'Choose a unique ID or namespace-prefix to avoid collisions',
    });
  }

  return violations;
}

/**
 * Validate a LexemeId against the vocabulary policy.
 */
export function validateLexemeId(
  id: string,
  isExtension: boolean,
  existingIds?: ReadonlySet<string>
): readonly PolicyViolation[] {
  const violations = [...validateId(id, isExtension, existingIds)];

  if (!isValidLexemeId(id)) {
    violations.push({
      id,
      type: 'invalid_id_format',
      severity: 'error',
      message: `LexemeId '${id}' does not match format: [namespace:]lex:category:lemma`,
      suggestion: 'Use format: lex:verb:make or my-pack:lex:verb:stutter',
    });
  }

  return violations;
}

/**
 * Validate an AxisId against the vocabulary policy.
 */
export function validateAxisId(
  id: string,
  isExtension: boolean,
  existingIds?: ReadonlySet<string>
): readonly PolicyViolation[] {
  const violations = [...validateId(id, isExtension, existingIds)];

  if (!isValidAxisId(id)) {
    violations.push({
      id,
      type: 'invalid_id_format',
      severity: 'error',
      message: `AxisId '${id}' does not match format: [namespace:]axis:name`,
      suggestion: 'Use format: axis:brightness or my-pack:axis:grit',
    });
  }

  return violations;
}

/**
 * Validate an OpcodeId against the vocabulary policy.
 */
export function validateOpcodeId(
  id: string,
  isExtension: boolean,
  existingIds?: ReadonlySet<string>
): readonly PolicyViolation[] {
  const violations = [...validateId(id, isExtension, existingIds)];

  if (!isValidOpcodeId(id)) {
    violations.push({
      id,
      type: 'invalid_id_format',
      severity: 'error',
      message: `OpcodeId '${id}' does not match format: [namespace:]op:name`,
      suggestion: 'Use format: op:thin_texture or my-pack:op:stutter',
    });
  }

  return violations;
}

/**
 * Validate a ConstraintTypeId against the vocabulary policy.
 */
export function validateConstraintTypeId(
  id: string,
  isExtension: boolean,
  existingIds?: ReadonlySet<string>
): readonly PolicyViolation[] {
  const violations = [...validateId(id, isExtension, existingIds)];

  if (!isValidConstraintTypeId(id)) {
    violations.push({
      id,
      type: 'invalid_id_format',
      severity: 'error',
      message: `ConstraintTypeId '${id}' does not match format: [namespace:]constraint:name`,
      suggestion: 'Use format: constraint:preserve or my-pack:constraint:tuning',
    });
  }

  return violations;
}

// =============================================================================
// Bulk Validation
// =============================================================================

/**
 * Validate an entire vocabulary table against the policy.
 *
 * @param ids - Map of ID to isExtension flag
 * @param idType - Which type of ID (for format validation)
 */
export function validateVocabularyTable(
  ids: ReadonlyMap<string, boolean>,
  idType: 'lexeme' | 'axis' | 'opcode' | 'constraint' | 'generic'
): PolicyCheckResult {
  const violations: PolicyViolation[] = [];
  const existingIds = new Set<string>();
  const namespaceCount: Record<string, number> = { core: 0 };

  for (const [id, isExtension] of ids) {
    let idViolations: readonly PolicyViolation[];

    switch (idType) {
      case 'lexeme':
        idViolations = validateLexemeId(id, isExtension, existingIds);
        break;
      case 'axis':
        idViolations = validateAxisId(id, isExtension, existingIds);
        break;
      case 'opcode':
        idViolations = validateOpcodeId(id, isExtension, existingIds);
        break;
      case 'constraint':
        idViolations = validateConstraintTypeId(id, isExtension, existingIds);
        break;
      default:
        idViolations = validateId(id, isExtension, existingIds);
    }

    violations.push(...idViolations);
    existingIds.add(id);

    // Count by namespace
    const ns = getNamespace(id) ?? 'core';
    namespaceCount[ns] = (namespaceCount[ns] ?? 0) + 1;
  }

  const errors = violations.filter(v => v.severity === 'error').length;
  const warnings = violations.filter(v => v.severity === 'warning').length;

  return {
    ok: errors === 0,
    violations,
    summary: {
      totalChecked: ids.size,
      errors,
      warnings,
      byNamespace: namespaceCount,
    },
  };
}

// =============================================================================
// Policy Enforcement Utilities
// =============================================================================

/**
 * Assert that a core ID is not namespaced.
 * Throws if the ID has a namespace.
 */
export function assertCoreId(id: string, label: string): void {
  if (isNamespaced(id)) {
    throw new Error(
      `${label}: core ID '${id}' must not be namespaced. ` +
      `Remove the namespace prefix or register as an extension.`
    );
  }
}

/**
 * Assert that an extension ID is properly namespaced.
 * Throws if the ID lacks a namespace.
 */
export function assertExtensionId(id: string, label: string): void {
  if (!isNamespaced(id)) {
    throw new Error(
      `${label}: extension ID '${id}' must be namespaced. ` +
      `Prefix with your extension namespace (e.g., 'my-pack:${id}').`
    );
  }
}

/**
 * Assert that a namespace is valid and not reserved.
 * Throws if the namespace is invalid.
 */
export function assertValidNamespace(namespace: string, label: string): void {
  if (!isValidNamespace(namespace)) {
    throw new Error(
      `${label}: namespace '${namespace}' is invalid. ` +
      `Must be lowercase letters and hyphens, starting with a letter.`
    );
  }

  if (isReservedNamespace(namespace)) {
    throw new Error(
      `${label}: namespace '${namespace}' is reserved. ` +
      `Reserved namespaces: ${RESERVED_NAMESPACES.join(', ')}`
    );
  }
}

/**
 * Extract the ID type prefix from any GOFAI ID.
 *
 * Examples:
 * - 'lex:verb:make' → 'lex'
 * - 'my-pack:axis:grit' → 'axis'
 * - 'op:thin_texture' → 'op'
 */
export function getIdTypePrefix(id: string): string | undefined {
  const parts = id.split(':');
  if (parts.length < 2) return undefined;

  // If namespaced, type prefix is second part
  const firstPart = parts[0];
  if (firstPart !== undefined && CORE_ID_PREFIXES.includes(firstPart)) {
    return firstPart;
  }

  // Namespaced: namespace:type:...
  return parts[1];
}

/**
 * Extract the name part from a GOFAI ID.
 *
 * Examples:
 * - 'axis:brightness' → 'brightness'
 * - 'my-pack:axis:grit' → 'grit'
 * - 'lex:verb:make' → 'make'
 */
export function getIdName(id: string): string | undefined {
  const parts = id.split(':');
  return parts[parts.length - 1];
}

// =============================================================================
// Policy Format Report
// =============================================================================

/**
 * Format a policy check result as a human-readable report.
 */
export function formatPolicyReport(result: PolicyCheckResult): string {
  const lines: string[] = [];

  if (result.ok) {
    lines.push(`✓ Vocabulary policy check passed (${result.summary.totalChecked} IDs checked)`);
  } else {
    lines.push(
      `✗ Vocabulary policy check FAILED: ${result.summary.errors} error(s), ` +
      `${result.summary.warnings} warning(s) (${result.summary.totalChecked} IDs checked)`
    );
  }

  lines.push('');

  // Namespace breakdown
  lines.push('Namespace breakdown:');
  for (const [ns, count] of Object.entries(result.summary.byNamespace)) {
    lines.push(`  ${ns}: ${count} IDs`);
  }

  if (result.violations.length > 0) {
    lines.push('');
    lines.push('Violations:');
    for (const v of result.violations) {
      const icon = v.severity === 'error' ? '✗' : '⚠';
      lines.push(`  ${icon} [${v.type}] ${v.message}`);
      lines.push(`    → ${v.suggestion}`);
    }
  }

  return lines.join('\n');
}
