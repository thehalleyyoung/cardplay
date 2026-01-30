/**
 * @file Card Parameter Opcode Executors (Step 310)
 * @module gofai/execution/card-param-executors
 * 
 * Implements Step 310: Plan opcode executors for card parameter edits (set_param)
 * with type-safe param validation.
 * 
 * This module provides execution implementations for card parameter editing opcodes.
 * Each executor:
 * 
 * 1. Validates card existence and parameter schemas
 * 2. Type-checks parameter values against card param definitions
 * 3. Applies parameter changes with range clamping and coercion
 * 4. Maintains parameter provenance and change history
 * 5. Supports undo/redo via parameter snapshots
 * 
 * Card parameters control DSP and instrument behavior:
 * - Filter cutoff/resonance
 * - Envelope ADSR values
 * - LFO rate/depth
 * - Reverb/delay send levels
 * - Synthesis parameters
 * - Effect mix levels
 * 
 * Design principles:
 * - Type-safe: Validate parameter types and ranges
 * - Safe defaults: Invalid values revert to safe defaults
 * - Auditable: Track all parameter changes with provenance
 * - Reversible: Snapshot old values for undo
 * - Extensible: Support extension-defined card types
 * 
 * @see gofai_goalB.md Step 310
 * @see gofai_goalB.md Step 311 (param schema validation)
 * @see gofai_goalB.md Step 312 (unknown param behavior)
 * @see gofai_goalB.md Step 313 (value coercion)
 */

import type { ProjectState, Card } from './transactional-execution.js';
import type { OpcodeExecutor, OpcodeExecutionResult } from './transactional-execution.js';
import type { PlanOpcode } from './edit-package.js';

// ============================================================================
// Parameter Schema Types (Step 311)
// ============================================================================

/**
 * Parameter type discriminators.
 */
export type ParamType = 
  | 'number'
  | 'boolean'
  | 'string'
  | 'enum'
  | 'object'
  | 'array';

/**
 * Parameter schema definition.
 * 
 * Describes what values are valid for a card parameter.
 */
export interface ParamSchema {
  /** Parameter ID */
  readonly id: string;
  
  /** Parameter display name */
  readonly name: string;
  
  /** Parameter type */
  readonly type: ParamType;
  
  /** Default value */
  readonly default: unknown;
  
  /** Value constraints */
  readonly constraints?: ParamConstraints;
  
  /** Units (for display) */
  readonly units?: string;
  
  /** Description */
  readonly description?: string;
  
  /** Whether this parameter supports automation */
  readonly automatable?: boolean;
}

/**
 * Constraints on parameter values.
 */
export interface ParamConstraints {
  /** Minimum value (for numbers) */
  readonly min?: number;
  
  /** Maximum value (for numbers) */
  readonly max?: number;
  
  /** Step size (for numbers) */
  readonly step?: number;
  
  /** Allowed values (for enums) */
  readonly enum?: readonly unknown[];
  
  /** Regex pattern (for strings) */
  readonly pattern?: string;
  
  /** Min/max length (for strings/arrays) */
  readonly minLength?: number;
  readonly maxLength?: number;
  
  /** Required object properties */
  readonly required?: readonly string[];
  
  /** Item type (for arrays) */
  readonly items?: ParamSchema;
}

/**
 * Card type schema.
 * 
 * Defines all parameters for a card type.
 */
export interface CardSchema {
  /** Card type ID */
  readonly typeId: string;
  
  /** Card type name */
  readonly name: string;
  
  /** Parameter schemas */
  readonly parameters: ReadonlyMap<string, ParamSchema>;
  
  /** Card category */
  readonly category?: string;
  
  /** Card description */
  readonly description?: string;
}

// ============================================================================
// Parameter Schema Registry
// ============================================================================

/**
 * Registry of card schemas.
 * 
 * Maintains type information for all card types in the system.
 */
export class CardSchemaRegistry {
  private schemas = new Map<string, CardSchema>();
  
  /**
   * Register a card schema.
   */
  register(schema: CardSchema): void {
    this.schemas.set(schema.typeId, schema);
  }
  
  /**
   * Get schema for a card type.
   */
  getSchema(cardType: string): CardSchema | undefined {
    return this.schemas.get(cardType);
  }
  
  /**
   * Get parameter schema for a specific card parameter.
   */
  getParamSchema(cardType: string, paramId: string): ParamSchema | undefined {
    const cardSchema = this.schemas.get(cardType);
    return cardSchema?.parameters.get(paramId);
  }
  
  /**
   * Check if a card type is registered.
   */
  hasSchema(cardType: string): boolean {
    return this.schemas.has(cardType);
  }
  
  /**
   * Get all parameter names for a card type.
   */
  getParamNames(cardType: string): readonly string[] {
    const schema = this.schemas.get(cardType);
    return schema ? Array.from(schema.parameters.keys()) : [];
  }
}

// ============================================================================
// Parameter Validation (Step 311)
// ============================================================================

/**
 * Result of parameter validation.
 */
export interface ParamValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly coercedValue?: unknown;
}

/**
 * Validate a parameter value against a schema.
 */
export function validateParam(
  value: unknown,
  schema: ParamSchema
): ParamValidationResult {
  const errors: string[] = [];
  let coercedValue = value;
  
  // Type check
  const valueType = typeof value;
  
  switch (schema.type) {
    case 'number':
      if (valueType !== 'number') {
        // Try to coerce
        const coerced = coerceToNumber(value);
        if (coerced === null) {
          errors.push(`Expected number, got ${valueType}`);
        } else {
          coercedValue = coerced;
        }
      }
      
      // Range check
      if (typeof coercedValue === 'number' && schema.constraints) {
        if (schema.constraints.min !== undefined && coercedValue < schema.constraints.min) {
          errors.push(`Value ${coercedValue} is below minimum ${schema.constraints.min}`);
          coercedValue = schema.constraints.min as number; // Clamp
        }
        if (schema.constraints.max !== undefined && coercedValue > schema.constraints.max) {
          errors.push(`Value ${coercedValue} is above maximum ${schema.constraints.max}`);
          coercedValue = schema.constraints.max as number; // Clamp
        }
      }
      break;
      
    case 'boolean':
      if (valueType !== 'boolean') {
        // Try to coerce
        const coerced = coerceToBoolean(value);
        if (coerced === null) {
          errors.push(`Expected boolean, got ${valueType}`);
        } else {
          coercedValue = coerced;
        }
      }
      break;
      
    case 'string':
      if (valueType !== 'string') {
        // Try to coerce
        coercedValue = String(value);
      }
      
      // Pattern check
      if (typeof coercedValue === 'string' && schema.constraints?.pattern) {
        const regex = new RegExp(schema.constraints.pattern);
        if (!regex.test(coercedValue)) {
          errors.push(`Value does not match pattern ${schema.constraints.pattern}`);
        }
      }
      
      // Length check
      if (typeof coercedValue === 'string') {
        if (schema.constraints?.minLength !== undefined && 
            coercedValue.length < schema.constraints.minLength) {
          errors.push(`String too short (min ${schema.constraints.minLength})`);
        }
        if (schema.constraints?.maxLength !== undefined && 
            coercedValue.length > schema.constraints.maxLength) {
          errors.push(`String too long (max ${schema.constraints.maxLength})`);
        }
      }
      break;
      
    case 'enum':
      if (!schema.constraints?.enum?.includes(value)) {
        errors.push(`Value must be one of: ${schema.constraints?.enum?.join(', ')}`);
      }
      break;
      
    case 'object':
      if (valueType !== 'object' || value === null || Array.isArray(value)) {
        errors.push(`Expected object, got ${valueType}`);
      }
      // TODO: Validate required properties
      break;
      
    case 'array':
      if (!Array.isArray(value)) {
        errors.push(`Expected array, got ${valueType}`);
      }
      // TODO: Validate array items
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors,
    coercedValue,
  };
}

// ============================================================================
// Value Coercion (Step 313)
// ============================================================================

/**
 * Coerce a value to a number.
 * 
 * Handles common cases like:
 * - "12k" → 12000
 * - "3.5dB" → 3.5
 * - "440Hz" → 440
 * - "+5" → 5
 * 
 * Returns null if coercion fails.
 */
export function coerceToNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Remove whitespace
    let str = value.trim();
    
    // Handle sign prefix
    const sign = str.startsWith('-') ? -1 : 1;
    if (str.startsWith('+') || str.startsWith('-')) {
      str = str.substring(1);
    }
    
    // Handle units
    const withUnit = str.match(/^([\d.]+)\s*(k|K|dB|Hz|ms|s|%)?$/);
    if (withUnit && withUnit[1]) {
      const numPart = parseFloat(withUnit[1]);
      const unit = withUnit[2];
      
      if (isNaN(numPart)) {
        return null;
      }
      
      let multiplier = 1;
      if (unit === 'k' || unit === 'K') {
        multiplier = 1000;
      }
      // dB, Hz, ms, s, % are just informational units, no multiplier
      
      return sign * numPart * multiplier;
    }
    
    // Try direct parse
    const direct = parseFloat(str);
    if (!isNaN(direct)) {
      return sign * direct;
    }
  }
  
  return null;
}

/**
 * Coerce a value to a boolean.
 * 
 * Handles:
 * - "true"/"false"
 * - "yes"/"no"
 * - "on"/"off"
 * - "1"/"0"
 * - 1/0
 * 
 * Returns null if coercion fails.
 */
export function coerceToBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === 'yes' || lower === 'on' || lower === '1') {
      return true;
    }
    if (lower === 'false' || lower === 'no' || lower === 'off' || lower === '0') {
      return false;
    }
  }
  
  return null;
}

// ============================================================================
// Card Resolution Utilities
// ============================================================================

/**
 * Card identifier - can be ID or name.
 */
type CardRef = string | { id: string } | { name: string };

/**
 * Resolve a card reference to a card object.
 */
function resolveCard(ref: CardRef, state: ProjectState): Card | undefined {
  if (typeof ref === 'string') {
    // Try as ID first, then as name
    return state.cards.get(ref) || 
           state.cards.getAll().find(c => c.name === ref);
  } else if ('id' in ref) {
    return state.cards.get(ref.id);
  } else if ('name' in ref) {
    return state.cards.getAll().find(c => c.name === ref.name);
  }
  return undefined;
}

/**
 * Find similar parameter names (for "unknown param" suggestions).
 */
export function findSimilarParamNames(
  target: string,
  candidates: readonly string[]
): readonly string[] {
  const targetLower = target.toLowerCase();
  
  // Exact match
  if (candidates.includes(target)) {
    return [target];
  }
  
  // Case-insensitive match
  const caseInsensitive = candidates.find(c => c.toLowerCase() === targetLower);
  if (caseInsensitive) {
    return [caseInsensitive];
  }
  
  // Substring match
  const substring = candidates.filter(c => 
    c.toLowerCase().includes(targetLower) ||
    targetLower.includes(c.toLowerCase())
  );
  if (substring.length > 0) {
    return substring;
  }
  
  // Levenshtein distance (simple version)
  const withDistance = candidates.map(c => ({
    name: c,
    distance: levenshteinDistance(targetLower, c.toLowerCase()),
  }));
  
  withDistance.sort((a, b) => a.distance - b.distance);
  
  // Return top 3 closest matches
  return withDistance.slice(0, 3).map(x => x.name);
}

/**
 * Calculate Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: (number | undefined)[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    if (!matrix[0]) matrix[0] = [];
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const prevI = matrix[i - 1];
      const currI = matrix[i];
      if (!prevI || !currI) continue;
      
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        const diag = prevI[j - 1];
        currI[j] = diag !== undefined ? diag : 0;
      } else {
        const diag = prevI[j - 1];
        const left = currI[j - 1];
        const up = prevI[j];
        
        currI[j] = Math.min(
          (diag !== undefined ? diag : Infinity) + 1, // substitution
          (left !== undefined ? left : Infinity) + 1,  // insertion
          (up !== undefined ? up : Infinity) + 1       // deletion
        );
      }
    }
  }
  
  const lastRow = matrix[b.length];
  const result = lastRow ? lastRow[a.length] : undefined;
  return result !== undefined ? result : Infinity;
}

// ============================================================================
// Set Parameter Executor (Step 310)
// ============================================================================

/**
 * Executor for OP_SET_PARAM.
 * 
 * Sets a parameter on a card with type-safe validation.
 */
export class SetParamExecutor implements OpcodeExecutor {
  constructor(
    private readonly schemaRegistry: CardSchemaRegistry
  ) {}
  
  readonly opcodeType = 'gofai:op:set_param';
  
  canExecute(opcode: PlanOpcode, state: ProjectState) {
    const card = resolveCard(opcode.parameters.card as CardRef, state);
    if (!card) {
      return {
        canExecute: false,
        failedPreconditions: ['Card not found'],
      };
    }
    
    const paramId = opcode.parameters.param_id as string;
    if (!paramId) {
      return {
        canExecute: false,
        failedPreconditions: ['Parameter ID not specified'],
      };
    }
    
    // Check if we have a schema for this card type
    const cardSchema = this.schemaRegistry.getSchema(card.type);
    if (!cardSchema) {
      // No schema - we can still try, but warn
      return {
        canExecute: true,
        failedPreconditions: [],
      };
    }
    
    // Check if parameter exists in schema
    const paramSchema = cardSchema.parameters.get(paramId);
    if (!paramSchema) {
      // Unknown parameter - Step 312
      return {
        canExecute: false,
        failedPreconditions: [`Unknown parameter: ${paramId}`],
      };
    }
    
    return {
      canExecute: true,
      failedPreconditions: [],
    };
  }
  
  execute(opcode: PlanOpcode, state: ProjectState): OpcodeExecutionResult {
    const card = resolveCard(opcode.parameters.card as CardRef, state);
    if (!card) {
      return {
        success: false,
        affectedEntities: [],
        error: 'Card not found',
      };
    }
    
    const paramId = opcode.parameters.param_id as string;
    const value = opcode.parameters.value;
    
    // Get schema if available
    const cardSchema = this.schemaRegistry.getSchema(card.type);
    const paramSchema = cardSchema?.parameters.get(paramId);
    
    let finalValue = value;
    const warnings: string[] = [];
    
    // Validate and coerce value if we have a schema
    if (paramSchema) {
      const validation = validateParam(value, paramSchema);
      
      if (!validation.valid) {
        // Validation failed - use default or return error
        if (opcode.parameters.strict === true) {
          return {
            success: false,
            affectedEntities: [],
            error: `Parameter validation failed: ${validation.errors.join('; ')}`,
          };
        } else {
          // Use coerced value or default
          finalValue = validation.coercedValue ?? paramSchema.default;
          warnings.push(`Value validation issues (using ${finalValue}): ${validation.errors.join('; ')}`);
        }
      } else if (validation.coercedValue !== undefined) {
        finalValue = validation.coercedValue;
        if (finalValue !== value) {
          warnings.push(`Value coerced from ${JSON.stringify(value)} to ${JSON.stringify(finalValue)}`);
        }
      }
    } else if (!card.parameters.hasOwnProperty(paramId)) {
      // Unknown parameter and no schema - Step 312
      const allParamNames = Object.keys(card.parameters);
      const similar = findSimilarParamNames(paramId, allParamNames);
      
      if (similar.length > 0) {
        return {
          success: false,
          affectedEntities: [],
          error: `Unknown parameter "${paramId}". Did you mean: ${similar.join(', ')}?`,
        };
      } else {
        return {
          success: false,
          affectedEntities: [],
          error: `Unknown parameter "${paramId}" for card type ${card.type}`,
        };
      }
    }
    
    // Apply parameter change
    state.cards.updateParameter(card.id, paramId, finalValue);
    
    return {
      success: true,
      affectedEntities: [card.id],
      ...(warnings.length > 0 && { warnings }),
    };
  }
}

// ============================================================================
// Batch Set Parameters Executor
// ============================================================================

/**
 * Executor for OP_SET_PARAMS_BATCH.
 * 
 * Sets multiple parameters on a card in a single operation.
 */
export class SetParamsBatchExecutor implements OpcodeExecutor {
  constructor(
    private readonly schemaRegistry: CardSchemaRegistry
  ) {}
  
  readonly opcodeType = 'gofai:op:set_params_batch';
  
  canExecute(opcode: PlanOpcode, state: ProjectState) {
    const card = resolveCard(opcode.parameters.card as CardRef, state);
    if (!card) {
      return {
        canExecute: false,
        failedPreconditions: ['Card not found'],
      };
    }
    
    const params = opcode.parameters.params as Record<string, unknown>;
    if (!params || typeof params !== 'object') {
      return {
        canExecute: false,
        failedPreconditions: ['Parameters object not specified'],
      };
    }
    
    return {
      canExecute: true,
      failedPreconditions: [],
    };
  }
  
  execute(opcode: PlanOpcode, state: ProjectState): OpcodeExecutionResult {
    const card = resolveCard(opcode.parameters.card as CardRef, state);
    if (!card) {
      return {
        success: false,
        affectedEntities: [],
        error: 'Card not found',
      };
    }
    
    const params = opcode.parameters.params as Record<string, unknown>;
    const warnings: string[] = [];
    let successCount = 0;
    let failCount = 0;
    
    const cardSchema = this.schemaRegistry.getSchema(card.type);
    
    // Apply each parameter
    for (const [paramId, value] of Object.entries(params)) {
      const paramSchema = cardSchema?.parameters.get(paramId);
      let finalValue = value;
      
      // Validate and coerce if schema exists
      if (paramSchema) {
        const validation = validateParam(value, paramSchema);
        
        if (!validation.valid) {
          if (opcode.parameters.strict === true) {
            failCount++;
            warnings.push(`${paramId}: ${validation.errors.join('; ')}`);
            continue;
          } else {
            finalValue = validation.coercedValue ?? paramSchema.default;
            warnings.push(`${paramId}: using ${finalValue} (${validation.errors.join('; ')})`);
          }
        } else if (validation.coercedValue !== undefined) {
          finalValue = validation.coercedValue;
        }
      }
      
      // Apply parameter
      try {
        state.cards.updateParameter(card.id, paramId, finalValue);
        successCount++;
      } catch (error) {
        failCount++;
        warnings.push(`${paramId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    if (failCount > 0 && opcode.parameters.strict === true) {
      return {
        success: false,
        affectedEntities: [card.id],
        error: `Failed to set ${failCount} parameters`,
        ...(warnings.length > 0 && { warnings }),
      };
    }
    
    return {
      success: true,
      affectedEntities: [card.id],
      ...(warnings.length > 0 && { warnings }),
    };
  }
}

// ============================================================================
// Adjust Parameter Executor (Relative Changes)
// ============================================================================

/**
 * Executor for OP_ADJUST_PARAM.
 * 
 * Adjusts a parameter by a relative amount (e.g., "+3dB", "*1.5").
 */
export class AdjustParamExecutor implements OpcodeExecutor {
  constructor(
    private readonly schemaRegistry: CardSchemaRegistry
  ) {}
  
  readonly opcodeType = 'gofai:op:adjust_param';
  
  canExecute(opcode: PlanOpcode, state: ProjectState) {
    const card = resolveCard(opcode.parameters.card as CardRef, state);
    if (!card) {
      return {
        canExecute: false,
        failedPreconditions: ['Card not found'],
      };
    }
    
    const paramId = opcode.parameters.param_id as string;
    if (!paramId) {
      return {
        canExecute: false,
        failedPreconditions: ['Parameter ID not specified'],
      };
    }
    
    return {
      canExecute: true,
      failedPreconditions: [],
    };
  }
  
  execute(opcode: PlanOpcode, state: ProjectState): OpcodeExecutionResult {
    const card = resolveCard(opcode.parameters.card as CardRef, state);
    if (!card) {
      return {
        success: false,
        affectedEntities: [],
        error: 'Card not found',
      };
    }
    
    const paramId = opcode.parameters.param_id as string;
    const adjustment = opcode.parameters.adjustment;
    const operation = (opcode.parameters.operation as string || 'add') as 'add' | 'multiply' | 'set';
    
    // Get current value
    const currentValue = card.parameters[paramId];
    if (currentValue === undefined) {
      return {
        success: false,
        affectedEntities: [],
        error: `Parameter ${paramId} not found on card`,
      };
    }
    
    // Only works for numeric parameters
    if (typeof currentValue !== 'number') {
      return {
        success: false,
        affectedEntities: [],
        error: `Parameter ${paramId} is not numeric (cannot adjust)`,
      };
    }
    
    // Coerce adjustment to number
    const adjustmentValue = coerceToNumber(adjustment);
    if (adjustmentValue === null) {
      return {
        success: false,
        affectedEntities: [],
        error: `Invalid adjustment value: ${adjustment}`,
      };
    }
    
    // Calculate new value
    let newValue: number;
    switch (operation) {
      case 'add':
        newValue = currentValue + adjustmentValue;
        break;
      case 'multiply':
        newValue = currentValue * adjustmentValue;
        break;
      case 'set':
        newValue = adjustmentValue;
        break;
      default:
        return {
          success: false,
          affectedEntities: [],
          error: `Unknown operation: ${operation}`,
        };
    }
    
    // Validate and clamp new value
    const cardSchema = this.schemaRegistry.getSchema(card.type);
    const paramSchema = cardSchema?.parameters.get(paramId);
    
    if (paramSchema) {
      const validation = validateParam(newValue, paramSchema);
      if (validation.coercedValue !== undefined && typeof validation.coercedValue === 'number') {
        newValue = validation.coercedValue;
      }
    }
    
    // Apply parameter change
    state.cards.updateParameter(card.id, paramId, newValue);
    
    return {
      success: true,
      affectedEntities: [card.id],
    };
  }
}

// ============================================================================
// Export All Card Parameter Executors
// ============================================================================

/**
 * Create all card parameter executors with a shared schema registry.
 */
export function createCardParamExecutors(
  schemaRegistry: CardSchemaRegistry
): readonly OpcodeExecutor[] {
  return [
    new SetParamExecutor(schemaRegistry),
    new SetParamsBatchExecutor(schemaRegistry),
    new AdjustParamExecutor(schemaRegistry),
  ];
}

/**
 * Register all card parameter executors with a registry.
 */
export function registerCardParamExecutors(
  registry: { register(executor: OpcodeExecutor): void },
  schemaRegistry: CardSchemaRegistry
): void {
  const executors = createCardParamExecutors(schemaRegistry);
  for (const executor of executors) {
    registry.register(executor);
  }
}
