/**
 * GOFAI Canon Checks — Validation Utilities for Canon Consistency
 *
 * This module provides validation functions to ensure the GOFAI
 * canon vocabularies maintain their SSOT integrity guarantees.
 *
 * @module gofai/canon/check
 */

import { CORE_LEXEMES, type Lexeme, type LexemeCategory } from './lexemes';
import { CORE_SECTION_TYPES } from './section-vocabulary';
import { CORE_LAYER_TYPES } from './layer-vocabulary';
import { CORE_UNITS } from './units';
import { CORE_PERCEPTUAL_AXES } from './perceptual-axes';
import { CORE_EDIT_OPCODES } from './edit-opcodes';
import { CORE_CONSTRAINT_TYPES } from './constraint-types';

// =============================================================================
// Validation Result Types
// =============================================================================

/**
 * A single validation error.
 */
export interface ValidationError {
  /** Error code for programmatic handling */
  readonly code: string;

  /** Human-readable error message */
  readonly message: string;

  /** The vocabulary category with the error */
  readonly category: VocabularyCategory;

  /** The specific item ID if applicable */
  readonly itemId?: string;

  /** Path to the specific field with the error */
  readonly fieldPath?: string;

  /** Severity of the error */
  readonly severity: 'error' | 'warning';
}

/**
 * Result of a validation check.
 */
export interface ValidationResult {
  /** Whether all checks passed */
  readonly valid: boolean;

  /** List of errors found */
  readonly errors: readonly ValidationError[];

  /** List of warnings (non-fatal) */
  readonly warnings: readonly ValidationError[];

  /** Number of items checked */
  readonly itemsChecked: number;

  /** Time taken for validation in ms */
  readonly duration: number;
}

/**
 * Vocabulary categories.
 */
export type VocabularyCategory =
  | 'lexeme'
  | 'section'
  | 'layer'
  | 'unit'
  | 'axis'
  | 'opcode'
  | 'constraint';

// =============================================================================
// Validation Builder
// =============================================================================

class ValidationBuilder {
  private readonly errors: ValidationError[] = [];
  private readonly warnings: ValidationError[] = [];
  private readonly startTime = Date.now();
  private itemsChecked = 0;

  addError(
    code: string,
    message: string,
    category: VocabularyCategory,
    itemId?: string,
    fieldPath?: string
  ): void {
    this.errors.push({ code, message, category, itemId, fieldPath, severity: 'error' });
  }

  addWarning(
    code: string,
    message: string,
    category: VocabularyCategory,
    itemId?: string,
    fieldPath?: string
  ): void {
    this.warnings.push({ code, message, category, itemId, fieldPath, severity: 'warning' });
  }

  incrementChecked(): void {
    this.itemsChecked++;
  }

  build(): ValidationResult {
    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings],
      itemsChecked: this.itemsChecked,
      duration: Date.now() - this.startTime,
    };
  }
}

// =============================================================================
// ID Uniqueness Checks
// =============================================================================

/**
 * Check that all IDs in a vocabulary are unique.
 */
function checkUniqueIds<T extends { id: string }>(
  items: readonly T[],
  category: VocabularyCategory,
  builder: ValidationBuilder
): void {
  const seen = new Map<string, number>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;
    
    const existing = seen.get(item.id);

    if (existing !== undefined) {
      builder.addError(
        'DUPLICATE_ID',
        `Duplicate ID "${item.id}" found at indices ${existing} and ${i}`,
        category,
        item.id,
        'id'
      );
    } else {
      seen.set(item.id, i);
    }

    builder.incrementChecked();
  }
}

// =============================================================================
// Lexeme Validation
// =============================================================================

/**
 * Check that lexeme lemmas and variants don't conflict.
 */
function checkLexemeSurfaceConflicts(
  lexemes: readonly Lexeme[],
  builder: ValidationBuilder
): void {
  const surfaceToId = new Map<string, string>();

  for (const lexeme of lexemes) {
    const allForms = [lexeme.lemma, ...lexeme.variants];

    for (const form of allForms) {
      const normalized = form.toLowerCase();
      const existing = surfaceToId.get(normalized);

      if (existing !== undefined && existing !== lexeme.id) {
        builder.addWarning(
          'LEXEME_SURFACE_CONFLICT',
          `Surface form "${form}" is used by both "${existing}" and "${lexeme.id}"`,
          'lexeme',
          lexeme.id,
          'variants'
        );
      } else {
        surfaceToId.set(normalized, lexeme.id);
      }
    }
  }
}

/**
 * Check that all lexeme categories have at least one entry.
 */
function checkLexemeCategoryCoverage(
  lexemes: readonly Lexeme[],
  builder: ValidationBuilder
): void {
  const categoryCounts = new Map<LexemeCategory, number>();

  for (const lexeme of lexemes) {
    const current = categoryCounts.get(lexeme.category) ?? 0;
    categoryCounts.set(lexeme.category, current + 1);
  }

  const requiredCategories: LexemeCategory[] = ['verb', 'adj', 'adv', 'prep', 'conj', 'det'];

  for (const category of requiredCategories) {
    if (!categoryCounts.has(category)) {
      builder.addWarning(
        'MISSING_LEXEME_CATEGORY',
        `No lexemes defined for category "${category}"`,
        'lexeme'
      );
    }
  }
}

// =============================================================================
// Main Validation Functions
// =============================================================================

/**
 * Validate the lexeme vocabulary.
 */
export function validateLexemes(): ValidationResult {
  const builder = new ValidationBuilder();

  checkUniqueIds(CORE_LEXEMES, 'lexeme', builder);
  checkLexemeSurfaceConflicts(CORE_LEXEMES, builder);
  checkLexemeCategoryCoverage(CORE_LEXEMES, builder);

  return builder.build();
}

/**
 * Validate the section vocabulary.
 */
export function validateSections(): ValidationResult {
  const builder = new ValidationBuilder();

  checkUniqueIds(CORE_SECTION_TYPES, 'section', builder);

  return builder.build();
}

/**
 * Validate the layer vocabulary.
 */
export function validateLayers(): ValidationResult {
  const builder = new ValidationBuilder();

  checkUniqueIds(CORE_LAYER_TYPES, 'layer', builder);

  // Check layer role coverage
  const roleCounts = new Map<string, number>();
  for (const layer of CORE_LAYER_TYPES) {
    const current = roleCounts.get(layer.role) ?? 0;
    roleCounts.set(layer.role, current + 1);
  }

  const requiredRoles = ['rhythm', 'bass', 'harmony', 'melody', 'texture'];
  for (const role of requiredRoles) {
    if (!roleCounts.has(role)) {
      builder.addWarning(
        'MISSING_LAYER_ROLE',
        `No layer types defined for role "${role}"`,
        'layer'
      );
    }
  }

  return builder.build();
}

/**
 * Validate the unit vocabulary.
 */
export function validateUnits(): ValidationResult {
  const builder = new ValidationBuilder();

  checkUniqueIds(CORE_UNITS, 'unit', builder);

  return builder.build();
}

/**
 * Validate the perceptual axes vocabulary.
 */
export function validateAxes(): ValidationResult {
  const builder = new ValidationBuilder();

  checkUniqueIds(CORE_PERCEPTUAL_AXES, 'axis', builder);

  // Check axis range validity
  for (const axis of CORE_PERCEPTUAL_AXES) {
    if (axis.range[0] >= axis.range[1]) {
      builder.addError(
        'INVALID_AXIS_RANGE',
        `Axis "${axis.id}" has invalid range [${axis.range[0]}, ${axis.range[1]}]`,
        'axis',
        axis.id,
        'range'
      );
    }

    if (axis.defaultValue < axis.range[0] || axis.defaultValue > axis.range[1]) {
      builder.addError(
        'DEFAULT_OUT_OF_RANGE',
        `Axis "${axis.id}" default value ${axis.defaultValue} is outside range [${axis.range[0]}, ${axis.range[1]}]`,
        'axis',
        axis.id,
        'defaultValue'
      );
    }

    // Check poles count
    if (axis.poles.length !== 2) {
      builder.addError(
        'INVALID_POLE_COUNT',
        `Axis "${axis.id}" should have exactly 2 poles, has ${axis.poles.length}`,
        'axis',
        axis.id,
        'poles'
      );
    }

    builder.incrementChecked();
  }

  return builder.build();
}

/**
 * Validate the edit opcodes vocabulary.
 */
export function validateOpcodes(): ValidationResult {
  const builder = new ValidationBuilder();

  checkUniqueIds(CORE_EDIT_OPCODES, 'opcode', builder);

  // Check cost is non-negative
  for (const opcode of CORE_EDIT_OPCODES) {
    if (opcode.cost < 0) {
      builder.addError(
        'NEGATIVE_COST',
        `Opcode "${opcode.id}" has negative cost ${opcode.cost}`,
        'opcode',
        opcode.id,
        'cost'
      );
    }
    builder.incrementChecked();
  }

  return builder.build();
}

/**
 * Validate the constraint types vocabulary.
 */
export function validateConstraints(): ValidationResult {
  const builder = new ValidationBuilder();

  checkUniqueIds(CORE_CONSTRAINT_TYPES, 'constraint', builder);

  return builder.build();
}

// =============================================================================
// Full Validation
// =============================================================================

/**
 * Combined validation result for all vocabularies.
 */
export interface FullValidationResult {
  /** Overall validity */
  readonly valid: boolean;

  /** Per-vocabulary results */
  readonly results: {
    readonly lexemes: ValidationResult;
    readonly sections: ValidationResult;
    readonly layers: ValidationResult;
    readonly units: ValidationResult;
    readonly axes: ValidationResult;
    readonly opcodes: ValidationResult;
    readonly constraints: ValidationResult;
  };

  /** Total errors across all vocabularies */
  readonly totalErrors: number;

  /** Total warnings across all vocabularies */
  readonly totalWarnings: number;

  /** Total items checked across all vocabularies */
  readonly totalItemsChecked: number;

  /** Total time for all validations */
  readonly totalDuration: number;
}

/**
 * Validate all GOFAI canon vocabularies.
 */
export function validateAllVocabularies(): FullValidationResult {
  const startTime = Date.now();

  const results = {
    lexemes: validateLexemes(),
    sections: validateSections(),
    layers: validateLayers(),
    units: validateUnits(),
    axes: validateAxes(),
    opcodes: validateOpcodes(),
    constraints: validateConstraints(),
  };

  const allResults = Object.values(results);

  return {
    valid: allResults.every((r) => r.valid),
    results,
    totalErrors: allResults.reduce((sum, r) => sum + r.errors.length, 0),
    totalWarnings: allResults.reduce((sum, r) => sum + r.warnings.length, 0),
    totalItemsChecked: allResults.reduce((sum, r) => sum + r.itemsChecked, 0),
    totalDuration: Date.now() - startTime,
  };
}

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Assert that all vocabularies are valid, throwing if not.
 */
export function assertVocabulariesValid(): void {
  const result = validateAllVocabularies();

  if (!result.valid) {
    const errorMessages = Object.entries(result.results)
      .flatMap(([category, r]) => r.errors.map((e) => `[${category}] ${e.message}`))
      .join('\n');

    throw new Error(
      `GOFAI canon vocabulary validation failed with ${result.totalErrors} errors:\n${errorMessages}`
    );
  }
}

/**
 * Log validation results to console.
 */
export function logValidationResults(result: FullValidationResult): void {
  console.log('='.repeat(60));
  console.log('GOFAI Canon Vocabulary Validation Results');
  console.log('='.repeat(60));

  for (const [category, r] of Object.entries(result.results)) {
    const status = r.valid ? '✓' : '✗';
    console.log(
      `\n${status} ${category.toUpperCase()}: ${r.itemsChecked} items, ${r.errors.length} errors, ${r.warnings.length} warnings`
    );

    for (const error of r.errors) {
      console.log(`  ✗ ${error.code}: ${error.message}`);
    }

    for (const warning of r.warnings) {
      console.log(`  ⚠ ${warning.code}: ${warning.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(
    `TOTAL: ${result.totalItemsChecked} items, ${result.totalErrors} errors, ${result.totalWarnings} warnings`
  );
  console.log(`Status: ${result.valid ? 'VALID ✓' : 'INVALID ✗'}`);
  console.log('='.repeat(60));
}
