/**
 * @fileoverview Extension Validators
 * 
 * Validates registered entities (IDs, capabilities, schema versions).
 * 
 * @module @cardplay/extensions/validators
 * @see to_fix_repo_plan_500.md Change 414
 */

import { isNamespacedId, isBuiltinId, validateId } from '../canon/id-validation';
import { isValidCapability, type Capability } from './capabilities';

// ============================================================================
// PROVENANCE TYPES (Change 411)
// ============================================================================

/**
 * Trust level for registered entities.
 */
export type RegistryTrustLevel = 'builtin' | 'verified' | 'user' | 'unknown';

/**
 * Provenance information for a registered entity.
 * Tracks where an entity came from and its trust level.
 */
export interface RegistryEntryProvenance {
  /** Source of the registration */
  readonly source: 'builtin' | 'extension' | 'user' | 'runtime';
  /** Extension/pack that registered this entity */
  readonly packId?: string;
  /** Version of the pack */
  readonly packVersion?: string;
  /** Timestamp of registration */
  readonly registeredAt: number;
  /** Trust level */
  readonly trustLevel: RegistryTrustLevel;
  /** Signature hash for verification (if available) */
  readonly signatureHash?: string;
  /** Whether the entity has been validated */
  readonly validated: boolean;
  /** Validation errors (if any) */
  readonly validationErrors?: readonly string[];
}

/**
 * Creates a provenance record for a builtin entity.
 */
export function createBuiltinProvenance(): RegistryEntryProvenance {
  return {
    source: 'builtin',
    registeredAt: Date.now(),
    trustLevel: 'builtin',
    validated: true,
  };
}

/**
 * Creates a provenance record for an extension entity.
 */
export function createExtensionProvenance(
  packId: string,
  packVersion: string,
  trustLevel: RegistryTrustLevel = 'user'
): RegistryEntryProvenance {
  return {
    source: 'extension',
    packId,
    packVersion,
    registeredAt: Date.now(),
    trustLevel,
    validated: false,
  };
}

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

/**
 * Severity of a validation issue.
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * A single validation issue.
 */
export interface ValidationIssue {
  readonly severity: ValidationSeverity;
  readonly code: string;
  readonly message: string;
  readonly path?: string;
  readonly suggestion?: string;
}

/**
 * Result of validating an entity.
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
  readonly entityId: string;
  readonly entityType: string;
}

// ============================================================================
// ID VALIDATORS
// ============================================================================

/**
 * Validates an entity ID.
 */
export function validateEntityId(
  id: string,
  entityType: string,
  allowBuiltin: boolean = false
): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!id || typeof id !== 'string') {
    issues.push({
      severity: 'error',
      code: 'INVALID_ID',
      message: `${entityType} ID must be a non-empty string`,
    });
    return { valid: false, issues, entityId: id || '', entityType };
  }
  
  const idValidation = validateId(id);
  
  if (!idValidation.valid) {
    issues.push({
      severity: 'error',
      code: 'INVALID_ID_FORMAT',
      message: idValidation.errors.join('; '),
      suggestion: 'Use format "namespace:name" for extension IDs',
    });
  }
  
  // Check for builtin collision
  if (!allowBuiltin && isBuiltinId(id)) {
    issues.push({
      severity: 'error',
      code: 'BUILTIN_ID_COLLISION',
      message: `ID "${id}" collides with a builtin ID`,
      suggestion: `Use a namespaced ID like "my-pack:${id}"`,
    });
  }
  
  // Warn about non-namespaced IDs
  if (!isNamespacedId(id) && !isBuiltinId(id)) {
    issues.push({
      severity: 'warning',
      code: 'NON_NAMESPACED_ID',
      message: `ID "${id}" is not namespaced`,
      suggestion: `Consider using format "namespace:${id}"`,
    });
  }
  
  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    entityId: id,
    entityType,
  };
}

/**
 * Validates a pack ID.
 */
export function validatePackId(id: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!id || typeof id !== 'string') {
    issues.push({
      severity: 'error',
      code: 'INVALID_PACK_ID',
      message: 'Pack ID must be a non-empty string',
    });
    return { valid: false, issues, entityId: id || '', entityType: 'pack' };
  }
  
  // Pack IDs should be simple identifiers (no colons)
  if (id.includes(':')) {
    issues.push({
      severity: 'error',
      code: 'INVALID_PACK_ID_FORMAT',
      message: 'Pack ID should not contain colons',
      suggestion: 'Use a simple identifier like "my-pack"',
    });
  }
  
  // Check for valid characters
  if (!/^[a-z][a-z0-9-]*$/.test(id)) {
    issues.push({
      severity: 'error',
      code: 'INVALID_PACK_ID_CHARS',
      message: 'Pack ID must start with a letter and contain only lowercase letters, numbers, and hyphens',
    });
  }
  
  // Check for reserved names
  const RESERVED_PACK_NAMES = ['cardplay', 'core', 'builtin', 'system', 'internal'];
  if (RESERVED_PACK_NAMES.includes(id)) {
    issues.push({
      severity: 'error',
      code: 'RESERVED_PACK_NAME',
      message: `Pack name "${id}" is reserved`,
    });
  }
  
  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    entityId: id,
    entityType: 'pack',
  };
}

// ============================================================================
// CAPABILITY VALIDATORS
// ============================================================================

/**
 * Validates a list of capabilities.
 */
export function validateCapabilities(
  capabilities: readonly string[]
): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  for (const cap of capabilities) {
    if (!isValidCapability(cap)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_CAPABILITY',
        message: `Unknown capability: ${cap}`,
        suggestion: 'Check the list of valid capabilities in extensions/capabilities.ts',
      });
    }
  }
  
  // Check for duplicate capabilities
  const seen = new Set<string>();
  for (const cap of capabilities) {
    if (seen.has(cap)) {
      issues.push({
        severity: 'warning',
        code: 'DUPLICATE_CAPABILITY',
        message: `Duplicate capability: ${cap}`,
      });
    }
    seen.add(cap);
  }
  
  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    entityId: 'capabilities',
    entityType: 'capability-list',
  };
}

// ============================================================================
// VERSION VALIDATORS
// ============================================================================

/**
 * Validates a semantic version string.
 */
export function validateVersion(version: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!version || typeof version !== 'string') {
    issues.push({
      severity: 'error',
      code: 'INVALID_VERSION',
      message: 'Version must be a non-empty string',
    });
    return { valid: false, issues, entityId: version || '', entityType: 'version' };
  }
  
  // Basic semver pattern
  const semverPattern = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
  
  if (!semverPattern.test(version)) {
    issues.push({
      severity: 'error',
      code: 'INVALID_SEMVER',
      message: `Invalid semantic version: ${version}`,
      suggestion: 'Use format "MAJOR.MINOR.PATCH" (e.g., "1.0.0")',
    });
  }
  
  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    entityId: version,
    entityType: 'version',
  };
}

// ============================================================================
// MANIFEST VALIDATORS
// ============================================================================

/**
 * Validates a pack manifest.
 */
export function validateManifest(manifest: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!manifest || typeof manifest !== 'object') {
    issues.push({
      severity: 'error',
      code: 'INVALID_MANIFEST',
      message: 'Manifest must be an object',
    });
    return { valid: false, issues, entityId: '', entityType: 'manifest' };
  }
  
  const m = manifest as Record<string, unknown>;
  
  // Required fields
  if (!m.name) {
    issues.push({
      severity: 'error',
      code: 'MISSING_NAME',
      message: 'Manifest must have a name field',
    });
  } else {
    const nameResult = validatePackId(m.name as string);
    issues.push(...nameResult.issues);
  }
  
  if (!m.version) {
    issues.push({
      severity: 'error',
      code: 'MISSING_VERSION',
      message: 'Manifest must have a version field',
    });
  } else {
    const versionResult = validateVersion(m.version as string);
    issues.push(...versionResult.issues);
  }
  
  // Optional field validation
  if (m.capabilities) {
    if (!Array.isArray(m.capabilities)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_CAPABILITIES',
        message: 'Capabilities must be an array',
      });
    } else {
      const capResult = validateCapabilities(m.capabilities as string[]);
      issues.push(...capResult.issues);
    }
  }
  
  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    entityId: (m.name as string) || '',
    entityType: 'manifest',
  };
}

// ============================================================================
// REGISTRY HEALTH
// ============================================================================

/**
 * Registry health report.
 */
export interface RegistryHealthReport {
  readonly totalEntities: number;
  readonly validEntities: number;
  readonly invalidEntities: number;
  readonly issues: readonly ValidationIssue[];
  readonly collisions: readonly {
    readonly id: string;
    readonly sources: readonly string[];
  }[];
  readonly missingFactories: readonly string[];
  readonly timestamp: number;
}

/**
 * Creates an empty health report.
 */
export function createEmptyHealthReport(): RegistryHealthReport {
  return {
    totalEntities: 0,
    validEntities: 0,
    invalidEntities: 0,
    issues: [],
    collisions: [],
    missingFactories: [],
    timestamp: Date.now(),
  };
}
