/**
 * @file Constraint Schema Types (Step 070)
 * @module gofai/canon/constraint-schema-types
 * 
 * Defines `ConstraintSchema` types (parametric) so unknown constraints
 * remain typecheckable if declared.
 * 
 * This allows extensions to define new constraint types that can be
 * validated, pretty-printed, and type-checked even if the core system
 * doesn't know their specific semantics.
 * 
 * @see gofai_goalB.md Step 070
 */

import type { ConstraintTypeId, GofaiId } from './types.js';
import type { ConstraintCategory } from './constraint-catalog.js';

// Type alias for consistency
export type ConstraintId = ConstraintTypeId;

// =============================================================================
// Type System for Constraint Parameters
// =============================================================================

/**
 * Base type for all constraint parameter types
 */
export type ConstraintParamType =
  | StringType
  | NumberType
  | BooleanType
  | EnumType
  | ObjectType
  | ArrayType
  | UnionType
  | ReferenceType;

/**
 * String parameter type
 */
export interface StringType {
  readonly kind: 'string';
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly format?: 'uuid' | 'uri' | 'email' | 'date' | 'time';
}

/**
 * Number parameter type
 */
export interface NumberType {
  readonly kind: 'number';
  readonly min?: number;
  readonly max?: number;
  readonly integer?: boolean;
  readonly multipleOf?: number;
  readonly unit?: string;
}

/**
 * Boolean parameter type
 */
export interface BooleanType {
  readonly kind: 'boolean';
}

/**
 * Enum parameter type
 */
export interface EnumType {
  readonly kind: 'enum';
  readonly values: readonly string[];
  readonly default?: string;
}

/**
 * Object parameter type (structured)
 */
export interface ObjectType {
  readonly kind: 'object';
  readonly properties: Record<string, TypedProperty>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
}

/**
 * Array parameter type
 */
export interface ArrayType {
  readonly kind: 'array';
  readonly items: ConstraintParamType;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly uniqueItems?: boolean;
}

/**
 * Union parameter type (one of several types)
 */
export interface UnionType {
  readonly kind: 'union';
  readonly types: readonly ConstraintParamType[];
}

/**
 * Reference to another entity type
 */
export interface ReferenceType {
  readonly kind: 'reference';
  readonly entityType: 'card' | 'track' | 'section' | 'event' | 'selector' | 'axis';
  readonly namespace?: string;
}

/**
 * Property with type and metadata
 */
export interface TypedProperty {
  readonly type: ConstraintParamType;
  readonly description?: string;
  readonly default?: unknown;
  readonly deprecated?: boolean;
}

// =============================================================================
// Constraint Schema Declaration
// =============================================================================

/**
 * Complete schema for a constraint type
 */
export interface TypedConstraintSchema {
  /** Unique constraint ID */
  readonly id: ConstraintId;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Description of what this constraint enforces */
  readonly description: string;
  
  /** Category for organization */
  readonly category: ConstraintCategory;
  
  /** Extension namespace (if extension-provided) */
  readonly namespace?: string;
  
  /** Schema version */
  readonly version?: string;
  
  /** Whether this constraint takes parameters */
  readonly parametric: boolean;
  
  /** Parameter schema (if parametric) */
  readonly parameters?: ConstraintParametersSchema;
  
  /** Examples of usage */
  readonly examples?: readonly ConstraintExample[];
  
  /** Severity of violations */
  readonly defaultSeverity?: 'error' | 'warning';
  
  /** Whether violations should block execution */
  readonly blocking?: boolean;
  
  /** Related constraints */
  readonly related?: readonly ConstraintId[];
  
  /** Conflicts with these constraints */
  readonly conflicts?: readonly ConstraintId[];
  
  /** Implies these other constraints */
  readonly implies?: readonly ConstraintId[];
}

/**
 * Schema for constraint parameters
 */
export interface ConstraintParametersSchema {
  /** Parameter definitions */
  readonly params: Record<string, ParameterDefinition>;
  
  /** Required parameter names */
  readonly required?: readonly string[];
  
  /** Parameter groups for UI organization */
  readonly groups?: readonly ParameterGroup[];
}

/**
 * Definition of a single parameter
 */
export interface ParameterDefinition {
  /** Parameter type */
  readonly type: ConstraintParamType;
  
  /** Human-readable name */
  readonly displayName?: string;
  
  /** Description */
  readonly description?: string;
  
  /** Default value */
  readonly default?: unknown;
  
  /** Whether required */
  readonly required?: boolean;
  
  /** Validation rules */
  readonly validation?: ParameterValidation;
  
  /** UI hints */
  readonly ui?: ParameterUIHints;
}

/**
 * Validation rules for a parameter
 */
export interface ParameterValidation {
  /** Custom validation function name */
  readonly customValidator?: string;
  
  /** Error message template */
  readonly errorMessage?: string;
  
  /** Dependencies on other parameters */
  readonly dependsOn?: readonly string[];
}

/**
 * UI hints for parameter input
 */
export interface ParameterUIHints {
  /** Widget type */
  readonly widget?: 'slider' | 'dropdown' | 'text' | 'checkbox' | 'color' | 'selector';
  
  /** Placeholder text */
  readonly placeholder?: string;
  
  /** Help text */
  readonly helpText?: string;
  
  /** Display order */
  readonly order?: number;
}

/**
 * Parameter group for UI organization
 */
export interface ParameterGroup {
  readonly name: string;
  readonly description?: string;
  readonly params: readonly string[];
}

/**
 * Example usage of a constraint
 */
export interface ConstraintExample {
  readonly description: string;
  readonly utterance: string;
  readonly parameters?: Record<string, unknown>;
}

// =============================================================================
// Type Validation
// =============================================================================

/**
 * Result of type validation
 */
export interface TypeValidationResult {
  readonly valid: boolean;
  readonly errors: readonly TypeValidationError[];
  readonly coercedValue?: unknown;
}

/**
 * Type validation error
 */
export interface TypeValidationError {
  readonly path: string;
  readonly expected: string;
  readonly actual: string;
  readonly message: string;
}

/**
 * Validate a value against a constraint parameter type
 */
export function validateConstraintParam(
  value: unknown,
  type: ConstraintParamType,
  path: string = '$'
): TypeValidationResult {
  const errors: TypeValidationError[] = [];
  
  switch (type.kind) {
    case 'string':
      return validateStringType(value, type, path);
    case 'number':
      return validateNumberType(value, type, path);
    case 'boolean':
      return validateBooleanType(value, type, path);
    case 'enum':
      return validateEnumType(value, type, path);
    case 'object':
      return validateObjectType(value, type, path);
    case 'array':
      return validateArrayType(value, type, path);
    case 'union':
      return validateUnionType(value, type, path);
    case 'reference':
      return validateReferenceType(value, type, path);
    default:
      errors.push({
        path,
        expected: 'known type',
        actual: 'unknown type',
        message: `Unknown type kind: ${(type as any).kind}`,
      });
      return { valid: false, errors };
  }
}

function validateStringType(
  value: unknown,
  type: StringType,
  path: string
): TypeValidationResult {
  const errors: TypeValidationError[] = [];
  
  if (typeof value !== 'string') {
    errors.push({
      path,
      expected: 'string',
      actual: typeof value,
      message: 'Expected string',
    });
    return { valid: false, errors };
  }
  
  if (type.minLength !== undefined && value.length < type.minLength) {
    errors.push({
      path,
      expected: `length >= ${type.minLength}`,
      actual: `length = ${value.length}`,
      message: `String too short (min ${type.minLength})`,
    });
  }
  
  if (type.maxLength !== undefined && value.length > type.maxLength) {
    errors.push({
      path,
      expected: `length <= ${type.maxLength}`,
      actual: `length = ${value.length}`,
      message: `String too long (max ${type.maxLength})`,
    });
  }
  
  if (type.pattern && !new RegExp(type.pattern).test(value)) {
    errors.push({
      path,
      expected: `match ${type.pattern}`,
      actual: value,
      message: `String does not match pattern`,
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    coercedValue: value,
  };
}

function validateNumberType(
  value: unknown,
  type: NumberType,
  path: string
): TypeValidationResult {
  const errors: TypeValidationError[] = [];
  
  if (typeof value !== 'number' || !isFinite(value)) {
    errors.push({
      path,
      expected: 'number',
      actual: typeof value,
      message: 'Expected finite number',
    });
    return { valid: false, errors };
  }
  
  if (type.integer && !Number.isInteger(value)) {
    errors.push({
      path,
      expected: 'integer',
      actual: value.toString(),
      message: 'Expected integer',
    });
  }
  
  if (type.min !== undefined && value < type.min) {
    errors.push({
      path,
      expected: `>= ${type.min}`,
      actual: value.toString(),
      message: `Number too small (min ${type.min})`,
    });
  }
  
  if (type.max !== undefined && value > type.max) {
    errors.push({
      path,
      expected: `<= ${type.max}`,
      actual: value.toString(),
      message: `Number too large (max ${type.max})`,
    });
  }
  
  if (type.multipleOf !== undefined && value % type.multipleOf !== 0) {
    errors.push({
      path,
      expected: `multiple of ${type.multipleOf}`,
      actual: value.toString(),
      message: `Not a multiple of ${type.multipleOf}`,
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    coercedValue: value,
  };
}

function validateBooleanType(
  value: unknown,
  type: BooleanType,
  path: string
): TypeValidationResult {
  const errors: TypeValidationError[] = [];
  
  if (typeof value !== 'boolean') {
    errors.push({
      path,
      expected: 'boolean',
      actual: typeof value,
      message: 'Expected boolean',
    });
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    errors: [],
    coercedValue: value,
  };
}

function validateEnumType(
  value: unknown,
  type: EnumType,
  path: string
): TypeValidationResult {
  const errors: TypeValidationError[] = [];
  
  if (typeof value !== 'string') {
    errors.push({
      path,
      expected: 'string',
      actual: typeof value,
      message: 'Expected string for enum',
    });
    return { valid: false, errors };
  }
  
  if (!type.values.includes(value)) {
    errors.push({
      path,
      expected: `one of [${type.values.join(', ')}]`,
      actual: value,
      message: `Invalid enum value`,
    });
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    errors: [],
    coercedValue: value,
  };
}

function validateObjectType(
  value: unknown,
  type: ObjectType,
  path: string
): TypeValidationResult {
  const errors: TypeValidationError[] = [];
  
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    errors.push({
      path,
      expected: 'object',
      actual: Array.isArray(value) ? 'array' : typeof value,
      message: 'Expected object',
    });
    return { valid: false, errors };
  }
  
  const obj = value as Record<string, unknown>;
  const coerced: Record<string, unknown> = {};
  
  // Validate required properties
  for (const req of type.required || []) {
    if (!(req in obj)) {
      errors.push({
        path: `${path}.${req}`,
        expected: 'present',
        actual: 'missing',
        message: `Required property missing: ${req}`,
      });
    }
  }
  
  // Validate each property
  for (const [key, propDef] of Object.entries(type.properties)) {
    if (key in obj) {
      const result = validateConstraintParam(
        obj[key],
        propDef.type,
        `${path}.${key}`
      );
      
      if (!result.valid) {
        errors.push(...result.errors);
      } else if (result.coercedValue !== undefined) {
        coerced[key] = result.coercedValue;
      }
    }
  }
  
  // Check for additional properties
  if (!type.additionalProperties) {
    for (const key of Object.keys(obj)) {
      if (!(key in type.properties)) {
        errors.push({
          path: `${path}.${key}`,
          expected: 'no additional properties',
          actual: key,
          message: `Unexpected property: ${key}`,
        });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    coercedValue: Object.keys(coerced).length > 0 ? coerced : value,
  };
}

function validateArrayType(
  value: unknown,
  type: ArrayType,
  path: string
): TypeValidationResult {
  const errors: TypeValidationError[] = [];
  
  if (!Array.isArray(value)) {
    errors.push({
      path,
      expected: 'array',
      actual: typeof value,
      message: 'Expected array',
    });
    return { valid: false, errors };
  }
  
  if (type.minItems !== undefined && value.length < type.minItems) {
    errors.push({
      path,
      expected: `length >= ${type.minItems}`,
      actual: `length = ${value.length}`,
      message: `Array too short (min ${type.minItems})`,
    });
  }
  
  if (type.maxItems !== undefined && value.length > type.maxItems) {
    errors.push({
      path,
      expected: `length <= ${type.maxItems}`,
      actual: `length = ${value.length}`,
      message: `Array too long (max ${type.maxItems})`,
    });
  }
  
  if (type.uniqueItems) {
    const seen = new Set();
    for (let i = 0; i < value.length; i++) {
      const item = JSON.stringify(value[i]);
      if (seen.has(item)) {
        errors.push({
          path: `${path}[${i}]`,
          expected: 'unique items',
          actual: 'duplicate',
          message: 'Duplicate item in array',
        });
      }
      seen.add(item);
    }
  }
  
  const coerced: unknown[] = [];
  for (let i = 0; i < value.length; i++) {
    const result = validateConstraintParam(value[i], type.items, `${path}[${i}]`);
    if (!result.valid) {
      errors.push(...result.errors);
    } else if (result.coercedValue !== undefined) {
      coerced.push(result.coercedValue);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    coercedValue: coerced.length > 0 ? coerced : value,
  };
}

function validateUnionType(
  value: unknown,
  type: UnionType,
  path: string
): TypeValidationResult {
  // Try each type in order until one succeeds
  for (const candidateType of type.types) {
    const result = validateConstraintParam(value, candidateType, path);
    if (result.valid) {
      return result;
    }
  }
  
  // None succeeded
  return {
    valid: false,
    errors: [{
      path,
      expected: `one of ${type.types.length} union types`,
      actual: typeof value,
      message: 'Value does not match any union type',
    }],
  };
}

function validateReferenceType(
  value: unknown,
  type: ReferenceType,
  path: string
): TypeValidationResult {
  const errors: TypeValidationError[] = [];
  
  // References should be strings (entity IDs)
  if (typeof value !== 'string') {
    errors.push({
      path,
      expected: 'string (entity reference)',
      actual: typeof value,
      message: 'Expected entity reference (string ID)',
    });
    return { valid: false, errors };
  }
  
  // Could add further validation (check if entity exists)
  // but that requires project context
  
  return {
    valid: true,
    errors: [],
    coercedValue: value,
  };
}

// =============================================================================
// Pretty Printing
// =============================================================================

/**
 * Generate human-readable description of a constraint schema
 */
export function prettyPrintConstraintSchema(schema: TypedConstraintSchema): string {
  const lines: string[] = [];
  
  lines.push(`Constraint: ${schema.name}`);
  lines.push(`ID: ${schema.id}`);
  lines.push(`Category: ${schema.category}`);
  
  if (schema.namespace) {
    lines.push(`Namespace: ${schema.namespace}`);
  }
  
  lines.push(`Description: ${schema.description}`);
  
  if (schema.parametric && schema.parameters) {
    lines.push('');
    lines.push('Parameters:');
    
    for (const [name, param] of Object.entries(schema.parameters.params)) {
      const req = param.required ? ' (required)' : ' (optional)';
      lines.push(`  ${name}${req}: ${prettyPrintType(param.type)}`);
      
      if (param.description) {
        lines.push(`    ${param.description}`);
      }
      
      if (param.default !== undefined) {
        lines.push(`    Default: ${JSON.stringify(param.default)}`);
      }
    }
  }
  
  if (schema.examples && schema.examples.length > 0) {
    lines.push('');
    lines.push('Examples:');
    for (const ex of schema.examples) {
      lines.push(`  - ${ex.description}`);
      lines.push(`    "${ex.utterance}"`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Pretty print a constraint parameter type
 */
export function prettyPrintType(type: ConstraintParamType): string {
  switch (type.kind) {
    case 'string':
      return 'string';
    case 'number':
      return type.integer ? 'integer' : 'number';
    case 'boolean':
      return 'boolean';
    case 'enum':
      return `enum(${type.values.join(' | ')})`;
    case 'object':
      return 'object';
    case 'array':
      return `array<${prettyPrintType(type.items)}>`;
    case 'union':
      return type.types.map(prettyPrintType).join(' | ');
    case 'reference':
      return `ref<${type.entityType}>`;
    default:
      return 'unknown';
  }
}
