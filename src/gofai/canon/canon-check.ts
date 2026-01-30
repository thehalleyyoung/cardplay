/**
 * @file GOFAI Canon Check Script
 * @module gofai/canon/canon-check
 * 
 * Implements Step 053: Build a "canon check" script for GOFAI (like existing canon checks)
 * that validates all vocab tables and IDs.
 * 
 * This script validates:
 * - All GOFAI IDs follow namespacing rules
 * - No ID collisions exist
 * - All referenced entities exist
 * - Vocabulary tables are well-formed
 * - Extension namespaces are properly declared
 * - No orphaned references
 * - Schema compliance
 * 
 * @see gofai_goalB.md Step 053
 */

import type { GofaiId, LexemeId, AxisId, OpcodeId, ConstraintTypeId } from './types.js';
import { parseGofaiId, isBuiltinId, isExtensionId } from './gofai-id.js';

// Type alias for consistency with catalog
type ConstraintId = ConstraintTypeId;

// =============================================================================
// Validation Types
// =============================================================================

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
  readonly stats: ValidationStats;
}

export interface ValidationError {
  readonly severity: 'error';
  readonly code: string;
  readonly message: string;
  readonly location?: string;
  readonly id?: string;
  readonly suggestion?: string;
}

export interface ValidationWarning {
  readonly severity: 'warning';
  readonly code: string;
  readonly message: string;
  readonly location?: string;
  readonly id?: string;
}

export interface ValidationStats {
  readonly totalIds: number;
  readonly builtinIds: number;
  readonly extensionIds: number;
  readonly lexemes: number;
  readonly axes: number;
  readonly opcodes: number;
  readonly constraints: number;
  readonly namespaces: Set<string>;
}

// =============================================================================
// ID Registry
// =============================================================================

export interface IdRegistry {
  readonly lexemes: Map<LexemeId, LexemeRegistration>;
  readonly axes: Map<AxisId, AxisRegistration>;
  readonly opcodes: Map<OpcodeId, OpcodeRegistration>;
  readonly constraints: Map<ConstraintId, ConstraintRegistration>;
}

export interface LexemeRegistration {
  readonly id: LexemeId;
  readonly lemma: string;
  readonly category: string;
  readonly namespace?: string;
  readonly source: string;
}

export interface AxisRegistration {
  readonly id: AxisId;
  readonly name: string;
  readonly namespace?: string;
  readonly source: string;
}

export interface OpcodeRegistration {
  readonly id: OpcodeId;
  readonly name: string;
  readonly namespace?: string;
  readonly source: string;
}

export interface ConstraintRegistration {
  readonly id: ConstraintId;
  readonly name: string;
  readonly namespace?: string;
  readonly source: string;
}

// =============================================================================
// Canon Validator
// =============================================================================

export class CanonValidator {
  private registry: IdRegistry;
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  private namespaces: Set<string> = new Set();

  constructor() {
    this.registry = {
      lexemes: new Map(),
      axes: new Map(),
      opcodes: new Map(),
      constraints: new Map(),
    };
  }

  /**
   * Register a lexeme for validation
   */
  registerLexeme(registration: LexemeRegistration): void {
    const existing = this.registry.lexemes.get(registration.id);
    
    if (existing) {
      this.errors.push({
        severity: 'error',
        code: 'DUPLICATE_LEXEME_ID',
        message: `Duplicate lexeme ID: ${registration.id}`,
        location: `${existing.source} and ${registration.source}`,
        id: registration.id,
        suggestion: 'Use a unique ID or check if this is an unintentional duplicate',
      });
    } else {
      this.registry.lexemes.set(registration.id, registration);
      
      if (registration.namespace) {
        this.namespaces.add(registration.namespace);
      }
    }
    
    // Validate ID format
    this.validateIdFormat(registration.id, registration.source);
  }

  /**
   * Register an axis for validation
   */
  registerAxis(registration: AxisRegistration): void {
    const existing = this.registry.axes.get(registration.id);
    
    if (existing) {
      this.errors.push({
        severity: 'error',
        code: 'DUPLICATE_AXIS_ID',
        message: `Duplicate axis ID: ${registration.id}`,
        location: `${existing.source} and ${registration.source}`,
        id: registration.id,
      });
    } else {
      this.registry.axes.set(registration.id, registration);
      
      if (registration.namespace) {
        this.namespaces.add(registration.namespace);
      }
    }
    
    this.validateIdFormat(registration.id, registration.source);
  }

  /**
   * Register an opcode for validation
   */
  registerOpcode(registration: OpcodeRegistration): void {
    const existing = this.registry.opcodes.get(registration.id);
    
    if (existing) {
      this.errors.push({
        severity: 'error',
        code: 'DUPLICATE_OPCODE_ID',
        message: `Duplicate opcode ID: ${registration.id}`,
        location: `${existing.source} and ${registration.source}`,
        id: registration.id,
      });
    } else {
      this.registry.opcodes.set(registration.id, registration);
      
      if (registration.namespace) {
        this.namespaces.add(registration.namespace);
      }
    }
    
    this.validateIdFormat(registration.id, registration.source);
  }

  /**
   * Register a constraint for validation
   */
  registerConstraint(registration: ConstraintRegistration): void {
    const existing = this.registry.constraints.get(registration.id);
    
    if (existing) {
      this.errors.push({
        severity: 'error',
        code: 'DUPLICATE_CONSTRAINT_ID',
        message: `Duplicate constraint ID: ${registration.id}`,
        location: `${existing.source} and ${registration.source}`,
        id: registration.id,
      });
    } else {
      this.registry.constraints.set(registration.id, registration);
      
      if (registration.namespace) {
        this.namespaces.add(registration.namespace);
      }
    }
    
    this.validateIdFormat(registration.id, registration.source);
  }

  /**
   * Validate ID format and namespacing rules
   */
  private validateIdFormat(id: string, source: string): void {
    try {
      const parsed = parseGofaiId(id as GofaiId);
      
      // Parsed must be defined
      if (!parsed) {
        this.errors.push({
          severity: 'error',
          code: 'PARSE_FAILED',
          message: `Failed to parse ID: ${id}`,
          location: source,
          id,
        });
        return;
      }
      
      // Extension IDs must have namespace
      if (!isBuiltinId(id as GofaiId)) {
        if (!parsed.namespace) {
          this.errors.push({
            severity: 'error',
            code: 'MISSING_NAMESPACE',
            message: `Extension ID missing namespace: ${id}`,
            location: source,
            id,
            suggestion: 'All extension IDs must follow the namespace:category:name pattern',
          });
        } else if (parsed.namespace.includes(':')) {
          this.errors.push({
            severity: 'error',
            code: 'INVALID_NAMESPACE',
            message: `Namespace contains colons: ${parsed.namespace}`,
            location: source,
            id,
            suggestion: 'Namespaces must not contain colons',
          });
        }
      } else {
        // Builtin IDs must NOT have namespace
        if (parsed.namespace) {
          this.errors.push({
            severity: 'error',
            code: 'BUILTIN_WITH_NAMESPACE',
            message: `Builtin ID has namespace: ${id}`,
            location: source,
            id,
            suggestion: 'Builtin IDs should not be namespaced',
          });
        }
      }
      
      // Validate category
      const validCategories = ['lexeme', 'axis', 'op', 'constraint'];
      if (parsed.category && !validCategories.includes(parsed.category)) {
        this.warnings.push({
          severity: 'warning',
          code: 'UNKNOWN_CATEGORY',
          message: `Unknown ID category: ${parsed.category}`,
          location: source,
          id,
        });
      }
      
    } catch (error) {
      this.errors.push({
        severity: 'error',
        code: 'INVALID_ID_FORMAT',
        message: `Invalid ID format: ${id}`,
        location: source,
        id,
      });
    }
  }

  /**
   * Check for orphaned references
   */
  checkReferences(references: Map<string, string[]>): void {
    for (const [refId, sources] of references.entries()) {
      const exists = 
        this.registry.lexemes.has(refId as LexemeId) ||
        this.registry.axes.has(refId as AxisId) ||
        this.registry.opcodes.has(refId as OpcodeId) ||
        this.registry.constraints.has(refId as ConstraintId);
      
      if (!exists) {
        this.warnings.push({
          severity: 'warning',
          code: 'ORPHANED_REFERENCE',
          message: `Reference to undefined ID: ${refId}`,
          location: sources.join(', '),
          id: refId,
        });
      }
    }
  }

  /**
   * Validate namespace consistency
   */
  validateNamespaces(): void {
    // Check that all extension IDs have consistent namespaces
    for (const [id, reg] of this.registry.lexemes) {
      if (isExtensionId(id)) {
        const parsed = parseGofaiId(id);
        if (parsed && parsed.namespace && !this.namespaces.has(parsed.namespace)) {
          this.warnings.push({
            severity: 'warning',
            code: 'UNDECLARED_NAMESPACE',
            message: `Namespace not explicitly declared: ${parsed.namespace}`,
            location: reg.source,
            id,
          });
        }
      }
    }
  }

  /**
   * Generate validation report
   */
  getResult(): ValidationResult {
    // Run final validations
    this.validateNamespaces();
    
    const stats: ValidationStats = {
      totalIds: 
        this.registry.lexemes.size +
        this.registry.axes.size +
        this.registry.opcodes.size +
        this.registry.constraints.size,
      builtinIds: this.countBuiltinIds(),
      extensionIds: this.countExtensionIds(),
      lexemes: this.registry.lexemes.size,
      axes: this.registry.axes.size,
      opcodes: this.registry.opcodes.size,
      constraints: this.registry.constraints.size,
      namespaces: this.namespaces,
    };
    
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      stats,
    };
  }

  private countBuiltinIds(): number {
    let count = 0;
    
    for (const id of this.registry.lexemes.keys()) {
      if (isBuiltinId(id as unknown as GofaiId)) count++;
    }
    for (const id of this.registry.axes.keys()) {
      if (isBuiltinId(id as unknown as GofaiId)) count++;
    }
    for (const id of this.registry.opcodes.keys()) {
      if (isBuiltinId(id as unknown as GofaiId)) count++;
    }
    for (const id of this.registry.constraints.keys()) {
      if (isBuiltinId(id as unknown as GofaiId)) count++;
    }
    
    return count;
  }

  private countExtensionIds(): number {
    let count = 0;
    
    for (const id of this.registry.lexemes.keys()) {
      if (isExtensionId(id as unknown as GofaiId)) count++;
    }
    for (const id of this.registry.axes.keys()) {
      if (isExtensionId(id as unknown as GofaiId)) count++;
    }
    for (const id of this.registry.opcodes.keys()) {
      if (isExtensionId(id as unknown as GofaiId)) count++;
    }
    for (const id of this.registry.constraints.keys()) {
      if (isExtensionId(id as unknown as GofaiId)) count++;
    }
    
    return count;
  }
}

// =============================================================================
// Report Formatting
// =============================================================================

/**
 * Format validation result as human-readable text
 */
export function formatValidationReport(result: ValidationResult): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(80));
  lines.push('GOFAI CANON VALIDATION REPORT');
  lines.push('='.repeat(80));
  lines.push('');
  
  // Stats
  lines.push('Statistics:');
  lines.push(`  Total IDs: ${result.stats.totalIds}`);
  lines.push(`  Builtin IDs: ${result.stats.builtinIds}`);
  lines.push(`  Extension IDs: ${result.stats.extensionIds}`);
  lines.push(`  Lexemes: ${result.stats.lexemes}`);
  lines.push(`  Axes: ${result.stats.axes}`);
  lines.push(`  Opcodes: ${result.stats.opcodes}`);
  lines.push(`  Constraints: ${result.stats.constraints}`);
  lines.push(`  Namespaces: ${result.stats.namespaces.size}`);
  lines.push('');
  
  // Errors
  if (result.errors.length > 0) {
    lines.push(`ERRORS (${result.errors.length}):`);
    lines.push('-'.repeat(80));
    for (const error of result.errors) {
      lines.push(`  [${error.code}] ${error.message}`);
      if (error.location) {
        lines.push(`    Location: ${error.location}`);
      }
      if (error.suggestion) {
        lines.push(`    Suggestion: ${error.suggestion}`);
      }
      lines.push('');
    }
  } else {
    lines.push('✓ No errors found');
    lines.push('');
  }
  
  // Warnings
  if (result.warnings.length > 0) {
    lines.push(`WARNINGS (${result.warnings.length}):`);
    lines.push('-'.repeat(80));
    for (const warning of result.warnings) {
      lines.push(`  [${warning.code}] ${warning.message}`);
      if (warning.location) {
        lines.push(`    Location: ${warning.location}`);
      }
      lines.push('');
    }
  } else {
    lines.push('✓ No warnings');
    lines.push('');
  }
  
  // Overall result
  lines.push('='.repeat(80));
  if (result.valid) {
    lines.push('✓ VALIDATION PASSED');
  } else {
    lines.push('✗ VALIDATION FAILED');
  }
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}

/**
 * Export validation result as JSON
 */
export function exportValidationJson(result: ValidationResult): string {
  return JSON.stringify(
    {
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
      stats: {
        ...result.stats,
        namespaces: Array.from(result.stats.namespaces),
      },
    },
    null,
    2
  );
}
