/**
 * @fileoverview Parameter System Implementation.
 * 
 * Provides typed parameter definitions with automation, modulation, and MIDI CC support.
 * All parameters are automatable and modulatable by design.
 * 
 * @module @cardplay/core/cards/parameters
 */

// ============================================================================
// PARAMETER CURVE TYPES
// ============================================================================

/**
 * Curve type for parameter value mapping.
 */
export type ParameterCurve = 'linear' | 'logarithmic' | 'exponential' | 'squared' | 'cubed' | 's-curve';

/**
 * Convert normalized [0,1] value through curve.
 */
export function applyCurve(normalizedValue: number, curve: ParameterCurve): number {
  const v = Math.max(0, Math.min(1, normalizedValue));
  switch (curve) {
    case 'linear':
      return v;
    case 'logarithmic':
      // Logarithmic: slow start, fast end (good for frequency)
      return Math.log10(1 + 9 * v) / Math.log10(10);
    case 'exponential':
      // Exponential: fast start, slow end
      return (Math.pow(10, v) - 1) / 9;
    case 'squared':
      return v * v;
    case 'cubed':
      return v * v * v;
    case 's-curve':
      // Smooth S-curve (slow-fast-slow)
      return v < 0.5
        ? 2 * v * v
        : 1 - Math.pow(-2 * v + 2, 2) / 2;
    default:
      return v;
  }
}

/**
 * Inverse curve: convert curved value back to normalized.
 */
export function invertCurve(curvedValue: number, curve: ParameterCurve): number {
  const v = Math.max(0, Math.min(1, curvedValue));
  switch (curve) {
    case 'linear':
      return v;
    case 'logarithmic':
      return (Math.pow(10, v * Math.log10(10)) - 1) / 9;
    case 'exponential':
      return Math.log10(1 + 9 * v) / Math.log10(10);
    case 'squared':
      return Math.sqrt(v);
    case 'cubed':
      return Math.cbrt(v);
    case 's-curve':
      return v < 0.5
        ? Math.sqrt(v / 2)
        : 1 - Math.sqrt((1 - v) * 2) / 2;
    default:
      return v;
  }
}

// ============================================================================
// BASE PARAMETER INTERFACE
// ============================================================================

/**
 * MIDI Learn binding information.
 */
export interface MidiLearnBinding {
  /** MIDI device ID */
  readonly deviceId: string;
  /** MIDI channel (0-15) */
  readonly channel: number;
  /** CC number (0-127) */
  readonly cc: number;
  /** Optional: minimum value (for range mapping) */
  readonly min?: number;
  /** Optional: maximum value (for range mapping) */
  readonly max?: number;
  /** Whether to invert the mapping */
  readonly inverted?: boolean;
}

/**
 * Base parameter interface shared by all parameter types.
 */
export interface BaseParameter<T> {
  /** Unique identifier */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Current value */
  readonly value: T;
  /** Default value */
  readonly default: T;
  /** Whether parameter can be automated */
  readonly automatable: boolean;
  /** Whether parameter can be modulated in real-time */
  readonly modulatable: boolean;
  /** MIDI CC number for external control (0-127, undefined if not mapped) */
  readonly ccNumber?: number;
  /** UI grouping category */
  readonly group?: string;
  /** Description for tooltips */
  readonly description?: string;
  /** Unit label (e.g., "Hz", "dB", "ms") */
  readonly unit?: string;
  /** Tags for search/filtering */
  readonly tags?: readonly string[];
  /** Whether parameter supports MIDI learn */
  readonly midiLearnable?: boolean;
  /** Current MIDI learn binding (if any) */
  readonly midiBinding?: MidiLearnBinding;
}

// ============================================================================
// FLOAT PARAMETER
// ============================================================================

/**
 * Continuous floating-point parameter.
 */
export interface FloatParameter extends BaseParameter<number> {
  readonly type: 'float';
  /** Minimum value */
  readonly min: number;
  /** Maximum value */
  readonly max: number;
  /** Step increment (for UI snapping) */
  readonly step: number;
  /** Value curve for non-linear mapping */
  readonly curve: ParameterCurve;
  /** Display precision (decimal places) */
  readonly precision: number;
}

/**
 * Options for creating a FloatParameter.
 */
export interface FloatParameterOptions {
  id: string;
  name: string;
  default?: number;
  min?: number;
  max?: number;
  step?: number;
  curve?: ParameterCurve;
  precision?: number;
  automatable?: boolean;
  modulatable?: boolean;
  ccNumber?: number;
  group?: string;
  description?: string;
  unit?: string;
  tags?: readonly string[];
}

/**
 * Creates a FloatParameter.
 */
export function createFloatParameter(options: FloatParameterOptions): FloatParameter {
  const min = options.min ?? 0;
  const max = options.max ?? 1;
  const defaultValue = options.default ?? min;
  
  const result: FloatParameter = {
    type: 'float' as const,
    id: options.id,
    name: options.name,
    value: Math.max(min, Math.min(max, defaultValue)),
    default: defaultValue,
    min,
    max,
    step: options.step ?? (max - min) / 100,
    curve: options.curve ?? 'linear',
    precision: options.precision ?? 2,
    automatable: options.automatable ?? true,
    modulatable: options.modulatable ?? true,
    ...(options.ccNumber !== undefined && { ccNumber: options.ccNumber }),
    ...(options.group !== undefined && { group: options.group }),
    ...(options.description !== undefined && { description: options.description }),
    ...(options.unit !== undefined && { unit: options.unit }),
    ...(options.tags !== undefined && { tags: options.tags }),
  };
  return Object.freeze(result);
}

/**
 * Update FloatParameter value.
 */
export function setFloatValue(param: FloatParameter, value: number): FloatParameter {
  const clamped = Math.max(param.min, Math.min(param.max, value));
  if (clamped === param.value) return param;
  return Object.freeze({ ...param, value: clamped });
}

/**
 * Get normalized [0,1] value from FloatParameter.
 */
export function getFloatNormalized(param: FloatParameter): number {
  return (param.value - param.min) / (param.max - param.min);
}

/**
 * Set FloatParameter from normalized [0,1] value.
 */
export function setFloatNormalized(param: FloatParameter, normalized: number): FloatParameter {
  const curved = applyCurve(normalized, param.curve);
  const value = param.min + curved * (param.max - param.min);
  return setFloatValue(param, value);
}

// ============================================================================
// INT PARAMETER
// ============================================================================

/**
 * Discrete integer parameter.
 */
export interface IntParameter extends BaseParameter<number> {
  readonly type: 'int';
  /** Minimum value */
  readonly min: number;
  /** Maximum value */
  readonly max: number;
  /** Step increment */
  readonly step: number;
}

/**
 * Options for creating an IntParameter.
 */
export interface IntParameterOptions {
  id: string;
  name: string;
  default?: number;
  min?: number;
  max?: number;
  step?: number;
  automatable?: boolean;
  modulatable?: boolean;
  ccNumber?: number;
  group?: string;
  description?: string;
  unit?: string;
  tags?: readonly string[];
}

/**
 * Creates an IntParameter.
 */
export function createIntParameter(options: IntParameterOptions): IntParameter {
  const min = options.min ?? 0;
  const max = options.max ?? 127;
  const defaultValue = options.default ?? min;
  
  let result: IntParameter = {
    type: 'int' as const,
    id: options.id,
    name: options.name,
    value: Math.round(Math.max(min, Math.min(max, defaultValue))),
    default: Math.round(defaultValue),
    min: Math.round(min),
    max: Math.round(max),
    step: options.step ?? 1,
    automatable: options.automatable ?? true,
    modulatable: options.modulatable ?? true,
  };
  if (options.ccNumber !== undefined) result = { ...result, ccNumber: options.ccNumber };
  if (options.group !== undefined) result = { ...result, group: options.group };
  if (options.description !== undefined) result = { ...result, description: options.description };
  if (options.unit !== undefined) result = { ...result, unit: options.unit };
  if (options.tags !== undefined) result = { ...result, tags: options.tags };
  return Object.freeze(result);
}

/**
 * Update IntParameter value.
 */
export function setIntValue(param: IntParameter, value: number): IntParameter {
  const rounded = Math.round(value);
  const clamped = Math.max(param.min, Math.min(param.max, rounded));
  if (clamped === param.value) return param;
  return Object.freeze({ ...param, value: clamped });
}

/**
 * Get normalized [0,1] value from IntParameter.
 */
export function getIntNormalized(param: IntParameter): number {
  return (param.value - param.min) / (param.max - param.min);
}

/**
 * Set IntParameter from normalized [0,1] value.
 */
export function setIntNormalized(param: IntParameter, normalized: number): IntParameter {
  const value = param.min + normalized * (param.max - param.min);
  return setIntValue(param, value);
}

// ============================================================================
// ENUM PARAMETER
// ============================================================================

/**
 * Enumerated option parameter.
 */
export interface EnumParameter<T extends string = string> extends BaseParameter<T> {
  readonly type: 'enum';
  /** Available options */
  readonly options: readonly T[];
  /** Display labels for options (parallel array) */
  readonly labels: readonly string[];
}

/**
 * Options for creating an EnumParameter.
 */
export interface EnumParameterOptions<T extends string = string> {
  id: string;
  name: string;
  options: readonly T[];
  labels?: readonly string[];
  default?: T;
  automatable?: boolean;
  modulatable?: boolean;
  ccNumber?: number;
  group?: string;
  description?: string;
  tags?: readonly string[];
}

/**
 * Creates an EnumParameter.
 */
export function createEnumParameter<T extends string>(options: EnumParameterOptions<T>): EnumParameter<T> {
  if (options.options.length === 0) {
    throw new Error('EnumParameter requires at least one option');
  }
  const defaultValue: T = options.default ?? options.options[0]!;
  
  let result: EnumParameter<T> = {
    type: 'enum' as const,
    id: options.id,
    name: options.name,
    value: defaultValue,
    default: defaultValue,
    options: Object.freeze([...options.options]),
    labels: Object.freeze(options.labels ?? options.options.map(o => o)),
    automatable: options.automatable ?? true,
    modulatable: options.modulatable ?? false, // Enums typically not modulatable
  };
  if (options.ccNumber !== undefined) result = { ...result, ccNumber: options.ccNumber };
  if (options.group !== undefined) result = { ...result, group: options.group };
  if (options.description !== undefined) result = { ...result, description: options.description };
  if (options.tags !== undefined) result = { ...result, tags: options.tags };
  return Object.freeze(result);
}

/**
 * Update EnumParameter value.
 */
export function setEnumValue<T extends string>(param: EnumParameter<T>, value: T): EnumParameter<T> {
  if (!param.options.includes(value)) return param;
  if (value === param.value) return param;
  return Object.freeze({ ...param, value });
}

/**
 * Get enum value by index.
 */
export function getEnumByIndex<T extends string>(param: EnumParameter<T>, index: number): T {
  const clampedIndex = Math.max(0, Math.min(param.options.length - 1, Math.round(index)));
  return param.options[clampedIndex]!;
}

/**
 * Get index of current enum value.
 */
export function getEnumIndex<T extends string>(param: EnumParameter<T>): number {
  return param.options.indexOf(param.value);
}

// ============================================================================
// STRING PARAMETER
// ============================================================================

/**
 * Text/path string parameter.
 */
export interface StringParameter extends BaseParameter<string> {
  readonly type: 'string';
  /** Maximum length */
  readonly maxLength: number;
  /** Validation regex pattern */
  readonly pattern?: string;
  /** Placeholder text */
  readonly placeholder?: string;
  /** Whether this is a file path */
  readonly isPath?: boolean;
  /** File extensions if isPath (e.g., ['.wav', '.mp3']) */
  readonly extensions?: readonly string[];
}

/**
 * Options for creating a StringParameter.
 */
export interface StringParameterOptions {
  id: string;
  name: string;
  default?: string;
  maxLength?: number;
  pattern?: string;
  placeholder?: string;
  isPath?: boolean;
  extensions?: readonly string[];
  automatable?: boolean;
  group?: string;
  description?: string;
  tags?: readonly string[];
}

/**
 * Creates a StringParameter.
 */
export function createStringParameter(options: StringParameterOptions): StringParameter {
  const defaultValue = options.default ?? '';
  
  let result: StringParameter = {
    type: 'string' as const,
    id: options.id,
    name: options.name,
    value: defaultValue,
    default: defaultValue,
    maxLength: options.maxLength ?? 256,
    automatable: options.automatable ?? false, // Strings typically not automatable
    modulatable: false, // Strings never modulatable
  };
  if (options.pattern !== undefined) result = { ...result, pattern: options.pattern };
  if (options.placeholder !== undefined) result = { ...result, placeholder: options.placeholder };
  if (options.isPath !== undefined) result = { ...result, isPath: options.isPath };
  if (options.extensions !== undefined) result = { ...result, extensions: Object.freeze([...options.extensions]) };
  if (options.group !== undefined) result = { ...result, group: options.group };
  if (options.description !== undefined) result = { ...result, description: options.description };
  if (options.tags !== undefined) result = { ...result, tags: options.tags };
  return Object.freeze(result);
}

/**
 * Update StringParameter value.
 */
export function setStringValue(param: StringParameter, value: string): StringParameter {
  let newValue = value.slice(0, param.maxLength);
  if (param.pattern) {
    const regex = new RegExp(param.pattern);
    if (!regex.test(newValue)) return param;
  }
  if (newValue === param.value) return param;
  return Object.freeze({ ...param, value: newValue });
}

/**
 * Validate string parameter value.
 */
export function validateStringValue(param: StringParameter, value: string): boolean {
  if (value.length > param.maxLength) return false;
  if (param.pattern) {
    const regex = new RegExp(param.pattern);
    if (!regex.test(value)) return false;
  }
  return true;
}

// ============================================================================
// BOOL PARAMETER
// ============================================================================

/**
 * Boolean toggle parameter.
 */
export interface BoolParameter extends BaseParameter<boolean> {
  readonly type: 'bool';
  /** Label when true */
  readonly onLabel?: string;
  /** Label when false */
  readonly offLabel?: string;
}

/**
 * Options for creating a BoolParameter.
 */
export interface BoolParameterOptions {
  id: string;
  name: string;
  default?: boolean;
  onLabel?: string;
  offLabel?: string;
  automatable?: boolean;
  modulatable?: boolean;
  ccNumber?: number;
  group?: string;
  description?: string;
  tags?: readonly string[];
}

/**
 * Creates a BoolParameter.
 */
export function createBoolParameter(options: BoolParameterOptions): BoolParameter {
  const defaultValue = options.default ?? false;
  
  let result: BoolParameter = {
    type: 'bool' as const,
    id: options.id,
    name: options.name,
    value: defaultValue,
    default: defaultValue,
    automatable: options.automatable ?? true,
    modulatable: options.modulatable ?? true,
  };
  if (options.onLabel !== undefined) result = { ...result, onLabel: options.onLabel };
  if (options.offLabel !== undefined) result = { ...result, offLabel: options.offLabel };
  if (options.ccNumber !== undefined) result = { ...result, ccNumber: options.ccNumber };
  if (options.group !== undefined) result = { ...result, group: options.group };
  if (options.description !== undefined) result = { ...result, description: options.description };
  if (options.tags !== undefined) result = { ...result, tags: options.tags };
  return Object.freeze(result);
}

/**
 * Update BoolParameter value.
 */
export function setBoolValue(param: BoolParameter, value: boolean): BoolParameter {
  if (value === param.value) return param;
  return Object.freeze({ ...param, value });
}

/**
 * Toggle BoolParameter value.
 */
export function toggleBool(param: BoolParameter): BoolParameter {
  return Object.freeze({ ...param, value: !param.value });
}

// ============================================================================
// ARRAY PARAMETER
// ============================================================================

/**
 * Array of sub-parameters.
 */
export interface ArrayParameter<T extends Parameter> extends BaseParameter<readonly T[]> {
  readonly type: 'array';
  /** Minimum number of elements */
  readonly minLength: number;
  /** Maximum number of elements */
  readonly maxLength: number;
  /** Template for creating new elements */
  readonly template: () => T;
}

/**
 * Options for creating an ArrayParameter.
 */
export interface ArrayParameterOptions<T extends Parameter> {
  id: string;
  name: string;
  template: () => T;
  default?: readonly T[];
  minLength?: number;
  maxLength?: number;
  automatable?: boolean;
  group?: string;
  description?: string;
  tags?: readonly string[];
}

/**
 * Creates an ArrayParameter.
 */
export function createArrayParameter<T extends Parameter>(options: ArrayParameterOptions<T>): ArrayParameter<T> {
  const defaultValue = options.default ?? [];
  
  let result: ArrayParameter<T> = {
    type: 'array' as const,
    id: options.id,
    name: options.name,
    value: Object.freeze([...defaultValue]),
    default: Object.freeze([...defaultValue]),
    minLength: options.minLength ?? 0,
    maxLength: options.maxLength ?? 128,
    template: options.template,
    automatable: options.automatable ?? false,
    modulatable: false, // Arrays not directly modulatable
  };
  if (options.group !== undefined) result = { ...result, group: options.group };
  if (options.description !== undefined) result = { ...result, description: options.description };
  if (options.tags !== undefined) result = { ...result, tags: options.tags };
  return Object.freeze(result);
}

/**
 * Add element to ArrayParameter.
 */
export function addArrayElement<T extends Parameter>(param: ArrayParameter<T>, element?: T): ArrayParameter<T> {
  if (param.value.length >= param.maxLength) return param;
  const newElement = element ?? param.template();
  return Object.freeze({
    ...param,
    value: Object.freeze([...param.value, newElement]),
  });
}

/**
 * Remove element from ArrayParameter by index.
 */
export function removeArrayElement<T extends Parameter>(param: ArrayParameter<T>, index: number): ArrayParameter<T> {
  if (index < 0 || index >= param.value.length) return param;
  if (param.value.length <= param.minLength) return param;
  const newValue = [...param.value];
  newValue.splice(index, 1);
  return Object.freeze({
    ...param,
    value: Object.freeze(newValue),
  });
}

/**
 * Update element in ArrayParameter.
 */
export function updateArrayElement<T extends Parameter>(
  param: ArrayParameter<T>,
  index: number,
  element: T
): ArrayParameter<T> {
  if (index < 0 || index >= param.value.length) return param;
  const newValue = [...param.value];
  newValue[index] = element;
  return Object.freeze({
    ...param,
    value: Object.freeze(newValue),
  });
}

// ============================================================================
// PARAMETER UNION TYPE
// ============================================================================

/**
 * Union of all parameter types.
 */
export type Parameter = 
  | FloatParameter 
  | IntParameter 
  | EnumParameter<string> 
  | StringParameter 
  | BoolParameter 
  | ArrayParameter<Parameter>;

/**
 * Parameter type discriminator.
 */
export type ParameterType = Parameter['type'];

/**
 * Type guard for FloatParameter.
 */
export function isFloatParameter(param: Parameter): param is FloatParameter {
  return param.type === 'float';
}

/**
 * Type guard for IntParameter.
 */
export function isIntParameter(param: Parameter): param is IntParameter {
  return param.type === 'int';
}

/**
 * Type guard for EnumParameter.
 */
export function isEnumParameter(param: Parameter): param is EnumParameter<string> {
  return param.type === 'enum';
}

/**
 * Type guard for StringParameter.
 */
export function isStringParameter(param: Parameter): param is StringParameter {
  return param.type === 'string';
}

/**
 * Type guard for BoolParameter.
 */
export function isBoolParameter(param: Parameter): param is BoolParameter {
  return param.type === 'bool';
}

/**
 * Type guard for ArrayParameter.
 */
export function isArrayParameter(param: Parameter): param is ArrayParameter<Parameter> {
  return param.type === 'array';
}

// ============================================================================
// PARAMETER REGISTRY
// ============================================================================

/**
 * Registry for looking up parameters by ID across cards.
 */
export interface ParameterRegistry {
  /** All registered parameters by ID */
  readonly parameters: ReadonlyMap<string, Parameter>;
  /** Parameters grouped by card ID */
  readonly byCard: ReadonlyMap<string, readonly Parameter[]>;
  /** Parameters grouped by group name */
  readonly byGroup: ReadonlyMap<string, readonly Parameter[]>;
  /** Parameters with CC mappings */
  readonly byCc: ReadonlyMap<number, Parameter>;
}

/**
 * Creates an empty ParameterRegistry.
 */
export function createParameterRegistry(): ParameterRegistry {
  return Object.freeze({
    parameters: new Map<string, Parameter>(),
    byCard: new Map<string, readonly Parameter[]>(),
    byGroup: new Map<string, readonly Parameter[]>(),
    byCc: new Map<number, Parameter>(),
  });
}

/**
 * Register a parameter in the registry.
 */
export function registerParameter(
  registry: ParameterRegistry,
  cardId: string,
  param: Parameter
): ParameterRegistry {
  const fullId = `${cardId}.${param.id}`;
  
  // Update main map
  const parameters = new Map(registry.parameters);
  parameters.set(fullId, param);
  
  // Update by-card map
  const byCard = new Map(registry.byCard);
  const cardParams = [...(registry.byCard.get(cardId) ?? []), param];
  byCard.set(cardId, Object.freeze(cardParams));
  
  // Update by-group map
  const byGroup = new Map(registry.byGroup);
  if (param.group) {
    const groupParams = [...(registry.byGroup.get(param.group) ?? []), param];
    byGroup.set(param.group, Object.freeze(groupParams));
  }
  
  // Update by-CC map
  const byCc = new Map(registry.byCc);
  if (param.ccNumber !== undefined) {
    byCc.set(param.ccNumber, param);
  }
  
  return Object.freeze({
    parameters,
    byCard,
    byGroup,
    byCc,
  });
}

/**
 * Register multiple parameters for a card.
 */
export function registerParameters(
  registry: ParameterRegistry,
  cardId: string,
  params: readonly Parameter[]
): ParameterRegistry {
  let result = registry;
  for (const param of params) {
    result = registerParameter(result, cardId, param);
  }
  return result;
}

/**
 * Get parameter by full ID (cardId.paramId).
 */
export function getParameter(registry: ParameterRegistry, fullId: string): Parameter | undefined {
  return registry.parameters.get(fullId);
}

/**
 * Get all parameters for a card.
 */
export function getCardParameters(registry: ParameterRegistry, cardId: string): readonly Parameter[] {
  return registry.byCard.get(cardId) ?? [];
}

/**
 * Get all parameters in a group.
 */
export function getGroupParameters(registry: ParameterRegistry, group: string): readonly Parameter[] {
  return registry.byGroup.get(group) ?? [];
}

/**
 * Get parameter by CC number.
 */
export function getParameterByCc(registry: ParameterRegistry, cc: number): Parameter | undefined {
  return registry.byCc.get(cc);
}

/**
 * Get all automatable parameters.
 */
export function getAutomatableParameters(registry: ParameterRegistry): readonly Parameter[] {
  return [...registry.parameters.values()].filter(p => p.automatable);
}

/**
 * Get all modulatable parameters.
 */
export function getModulatableParameters(registry: ParameterRegistry): readonly Parameter[] {
  return [...registry.parameters.values()].filter(p => p.modulatable);
}

// ============================================================================
// PARAMETER VALUE UTILITIES
// ============================================================================

/**
 * Reset parameter to default value.
 */
export function resetParameter<P extends Parameter>(param: P): P {
  if (param.value === param.default) return param;
  return Object.freeze({ ...param, value: param.default }) as unknown as P;
}

/**
 * Get normalized [0,1] value for any numeric parameter.
 */
export function getNormalizedValue(param: Parameter): number {
  switch (param.type) {
    case 'float':
      return getFloatNormalized(param);
    case 'int':
      return getIntNormalized(param);
    case 'enum':
      return getEnumIndex(param) / Math.max(1, param.options.length - 1);
    case 'bool':
      return param.value ? 1 : 0;
    default:
      return 0;
  }
}

/**
 * Set parameter from normalized [0,1] value.
 */
export function setNormalizedValue(param: Parameter, normalized: number): Parameter {
  switch (param.type) {
    case 'float':
      return setFloatNormalized(param, normalized);
    case 'int':
      return setIntNormalized(param, normalized);
    case 'enum': {
      const index = Math.round(normalized * (param.options.length - 1));
      return setEnumValue(param, param.options[index]!);
    }
    case 'bool':
      return setBoolValue(param, normalized >= 0.5);
    default:
      return param;
  }
}

/**
 * Interpolate between two parameter values.
 */
export function interpolateParameter(from: Parameter, to: Parameter, t: number): Parameter {
  if (from.type !== to.type || from.id !== to.id) return from;
  
  const clampedT = Math.max(0, Math.min(1, t));
  const fromNorm = getNormalizedValue(from);
  const toNorm = getNormalizedValue(to);
  const interpolated = fromNorm + (toNorm - fromNorm) * clampedT;
  
  return setNormalizedValue(from, interpolated);
}

/**
 * Randomize parameter within its range.
 */
export function randomizeParameter(param: Parameter, amount: number = 1): Parameter {
  const random = Math.random() * amount;
  return setNormalizedValue(param, random);
}

/**
 * Mutate parameter by small random amount.
 */
export function mutateParameter(param: Parameter, amount: number = 0.1): Parameter {
  const current = getNormalizedValue(param);
  const mutation = (Math.random() - 0.5) * 2 * amount;
  const mutated = Math.max(0, Math.min(1, current + mutation));
  return setNormalizedValue(param, mutated);
}

/**
 * Clone parameter with new value.
 */
export function cloneParameter<P extends Parameter>(param: P, newValue?: P['value']): P {
  if (newValue === undefined) return Object.freeze({ ...param }) as unknown as P;
  return Object.freeze({ ...param, value: newValue }) as unknown as P;
}

/**
 * Serialize parameter to JSON-safe object.
 */
export function serializeParameter(param: Parameter): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { template, ...serializable } = param as Parameter & { template?: unknown };
  return serializable;
}

/**
 * Extract parameter values as a plain object.
 */
export function extractParameterValues(params: readonly Parameter[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const param of params) {
    result[param.id] = param.value;
  }
  return result;
}

/**
 * Apply values to parameters from a plain object.
 */
export function applyParameterValues(
  params: readonly Parameter[],
  values: Record<string, unknown>
): readonly Parameter[] {
  return params.map(param => {
    const newValue = values[param.id];
    if (newValue === undefined) return param;
    
    switch (param.type) {
      case 'float':
        return typeof newValue === 'number' ? setFloatValue(param, newValue) : param;
      case 'int':
        return typeof newValue === 'number' ? setIntValue(param, newValue) : param;
      case 'enum':
        return typeof newValue === 'string' ? setEnumValue(param, newValue) : param;
      case 'string':
        return typeof newValue === 'string' ? setStringValue(param, newValue) : param;
      case 'bool':
        return typeof newValue === 'boolean' ? setBoolValue(param, newValue) : param;
      default:
        return param;
    }
  });
}

// ============================================================================
// MIDI LEARN FUNCTIONS
// ============================================================================

/**
 * Set MIDI learn binding on a parameter.
 */
export function setMidiBinding<P extends Parameter>(
  param: P,
  binding: MidiLearnBinding | undefined
): P {
  return Object.freeze({ ...param, midiBinding: binding }) as unknown as P;
}

/**
 * Clear MIDI learn binding from a parameter.
 */
export function clearMidiBinding<P extends Parameter>(param: P): P {
  const { midiBinding: _, ...rest } = param as Parameter & { midiBinding?: MidiLearnBinding };
  return Object.freeze(rest) as unknown as P;
}

/**
 * Check if parameter has MIDI binding.
 */
export function hasMidiBinding(param: Parameter): boolean {
  return param.midiBinding !== undefined;
}

/**
 * Apply MIDI CC value to parameter (with range mapping).
 */
export function applyMidiCCValue<P extends Parameter>(
  param: P,
  ccValue: number, // 0-127
  binding?: MidiLearnBinding
): P {
  // Normalize CC to 0-1
  let normalized = ccValue / 127;
  
  // Apply binding range if specified
  if (binding) {
    if (binding.inverted) {
      normalized = 1 - normalized;
    }
    if (binding.min !== undefined && binding.max !== undefined) {
      normalized = binding.min + normalized * (binding.max - binding.min);
    }
  }
  
  return setNormalizedValue(param, normalized) as P;
}

/**
 * Get current parameter value as MIDI CC (0-127).
 */
export function getParameterAsMidiCC(param: Parameter): number {
  const normalized = getNormalizedValue(param);
  return Math.round(normalized * 127);
}

/**
 * Find parameters with MIDI bindings for a specific device/channel/CC.
 */
export function findParametersByMidiBinding(
  params: readonly Parameter[],
  deviceId: string,
  channel: number,
  cc: number
): readonly Parameter[] {
  return params.filter(p => {
    const binding = p.midiBinding;
    if (!binding) return false;
    return binding.deviceId === deviceId && 
           binding.channel === channel && 
           binding.cc === cc;
  });
}

/**
 * Create a MIDI learn callback that updates parameters.
 */
export function createMidiLearnCallback(
  params: readonly Parameter[],
  onUpdate: (params: readonly Parameter[]) => void
): (deviceId: string, channel: number, cc: number, value: number) => void {
  return (deviceId: string, channel: number, cc: number, value: number) => {
    const matches = findParametersByMidiBinding(params, deviceId, channel, cc);
    if (matches.length === 0) return;
    
    const updated = params.map(p => {
      const match = matches.find(m => m.id === p.id);
      if (!match) return p;
      return applyMidiCCValue(p, value, p.midiBinding);
    });
    
    onUpdate(updated);
  };
}
