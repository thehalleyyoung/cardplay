/**
 * CardScript Invoke Extensions
 * 
 * Provides advanced invocation features:
 * - Parameter validation
 * - Auto-complete for param names
 * - Type coercion
 * - Range clamping
 * - Preset combinations
 * - Invocation history/favorites
 * - Search by param values
 * - Diff (compare invocations)
 * - Templates
 * - Batch operations
 * 
 * @module cardscript/invoke-ext
 */

import type { CardContext } from '../../cards/card';
import type { CompleteCardDef, CompleteParamDef } from './live';
import type { ParamOverrides, InvokeResult, PresetDef } from './invoke';
import { invoke, get, set } from './invoke';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Validation result for a parameter.
 */
export interface ParamValidationResult {
  valid: boolean;
  errors: ParamValidationError[];
  warnings: ParamValidationWarning[];
  coercedValue?: unknown;
}

/**
 * Parameter validation error.
 */
export interface ParamValidationError {
  param: string;
  message: string;
  expected: string;
  received: unknown;
}

/**
 * Parameter validation warning.
 */
export interface ParamValidationWarning {
  param: string;
  message: string;
}

/**
 * Invocation history entry.
 */
export interface InvocationHistoryEntry {
  id: string;
  cardId: string;
  params: ParamOverrides;
  timestamp: number;
  result?: unknown;
  durationMs?: number;
  tags?: string[];
}

/**
 * Favorite invocation.
 */
export interface FavoriteInvocation {
  id: string;
  name: string;
  cardId: string;
  params: ParamOverrides;
  description?: string;
  tags?: string[];
  createdAt: number;
}

/**
 * Invocation template.
 */
export interface InvokeTemplate {
  id: string;
  name: string;
  cardId: string;
  /** Fixed params (always applied) */
  fixedParams: ParamOverrides;
  /** Variable params (user must provide) */
  variableParams: string[];
  /** Default values for variable params */
  defaults?: ParamOverrides;
  description?: string;
}

/**
 * Invocation diff result.
 */
export interface InvokeDiff {
  cardId: string;
  sameParams: string[];
  differentParams: Array<{
    param: string;
    valueA: unknown;
    valueB: unknown;
  }>;
  onlyInA: string[];
  onlyInB: string[];
}

/**
 * Search criteria for param values.
 */
export interface ParamSearchCriteria {
  cardId?: string;
  /** Params to match exactly */
  exact?: ParamOverrides;
  /** Params in range [min, max] */
  range?: Record<string, [number, number]>;
  /** Params containing substring */
  contains?: Record<string, string>;
}

/**
 * Auto-complete suggestion.
 */
export interface ParamSuggestion {
  param: string;
  type: string;
  default: unknown;
  min?: number;
  max?: number;
  description?: string;
  currentValue?: unknown;
}

// ============================================================================
// CARD DEFINITION REGISTRY
// ============================================================================

/** Stores card definitions for validation */
const cardDefRegistry = new Map<string, CompleteCardDef<unknown, unknown, unknown>>();

/**
 * Registers a card definition for validation and auto-complete.
 */
export function registerCardDef(def: CompleteCardDef<unknown, unknown, unknown>): void {
  cardDefRegistry.set(def.id, def);
}

/**
 * Gets a card definition.
 */
export function getCardDef(cardId: string): CompleteCardDef<unknown, unknown, unknown> | undefined {
  return cardDefRegistry.get(cardId);
}

/**
 * Gets all registered card IDs.
 */
export function getRegisteredCardIds(): string[] {
  return Array.from(cardDefRegistry.keys());
}

// ============================================================================
// PARAMETER VALIDATION
// ============================================================================

/**
 * Validates parameters against a card definition.
 */
export function validateParams(
  cardId: string,
  params: ParamOverrides
): ParamValidationResult {
  const def = cardDefRegistry.get(cardId);
  if (!def) {
    return {
      valid: false,
      errors: [{
        param: '*',
        message: `Unknown card: ${cardId}`,
        expected: 'registered card',
        received: cardId,
      }],
      warnings: [],
    };
  }
  
  const errors: ParamValidationError[] = [];
  const warnings: ParamValidationWarning[] = [];
  const coercedParams: ParamOverrides = {};
  
  // Check each provided param
  for (const [name, value] of Object.entries(params)) {
    const paramDef = def.params.find(p => p.name === name);
    
    if (!paramDef) {
      const similar = findSimilarParam(name, def.params);
      if (similar) {
        warnings.push({
          param: name,
          message: `Unknown parameter '${name}'. Did you mean '${similar}'?`,
        });
      } else {
        warnings.push({
          param: name,
          message: `Unknown parameter '${name}'. Available: ${def.params.map(p => p.name).join(', ')}`,
        });
      }
      coercedParams[name] = value;
      continue;
    }
    
    // Validate type
    const typeResult = validateParamType(paramDef, value);
    if (!typeResult.valid) {
      errors.push(typeResult.error!);
      coercedParams[name] = typeResult.coercedValue ?? value;
    } else {
      coercedParams[name] = typeResult.coercedValue ?? value;
    }
    
    // Validate range
    const rangeResult = validateParamRange(paramDef, coercedParams[name]);
    if (!rangeResult.valid) {
      warnings.push(rangeResult.warning!);
      coercedParams[name] = rangeResult.clampedValue;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    coercedValue: coercedParams,
  };
}

/**
 * Validates parameter type.
 */
function validateParamType(
  def: CompleteParamDef,
  value: unknown
): { valid: boolean; error?: ParamValidationError; coercedValue?: unknown } {
  const expectedType = def.type;
  const actualType = typeof value;
  
  // Try type coercion
  if (expectedType === 'number' && actualType === 'string') {
    const parsed = parseFloat(value as string);
    if (!isNaN(parsed)) {
      return { valid: true, coercedValue: parsed };
    }
  }
  
  if (expectedType === 'boolean' && actualType === 'string') {
    const str = (value as string).toLowerCase();
    if (str === 'true' || str === '1' || str === 'yes') {
      return { valid: true, coercedValue: true };
    }
    if (str === 'false' || str === '0' || str === 'no') {
      return { valid: true, coercedValue: false };
    }
  }
  
  if (expectedType === 'string' && actualType !== 'string') {
    return { valid: true, coercedValue: String(value) };
  }
  
  // Check type match
  if (expectedType !== actualType) {
    return {
      valid: false,
      error: {
        param: def.name,
        message: `Expected ${expectedType}, got ${actualType}`,
        expected: expectedType,
        received: value,
      },
    };
  }
  
  return { valid: true, coercedValue: value };
}

/**
 * Validates parameter range.
 */
function validateParamRange(
  def: CompleteParamDef,
  value: unknown
): { valid: boolean; warning?: ParamValidationWarning; clampedValue: unknown } {
  if (typeof value !== 'number') {
    return { valid: true, clampedValue: value };
  }
  
  let clamped = value;
  let warning: ParamValidationWarning | undefined;
  
  if (def.min !== undefined && value < def.min) {
    clamped = def.min;
    warning = {
      param: def.name,
      message: `Value ${value} below minimum ${def.min}, clamped to ${def.min}`,
    };
  }
  
  if (def.max !== undefined && value > def.max) {
    clamped = def.max;
    warning = {
      param: def.name,
      message: `Value ${value} above maximum ${def.max}, clamped to ${def.max}`,
    };
  }
  
  const result: { valid: boolean; warning?: ParamValidationWarning; clampedValue: unknown } = {
    valid: warning === undefined,
    clampedValue: clamped,
  };
  if (warning) result.warning = warning;
  return result;
}

/**
 * Finds similar parameter name (for typo suggestions).
 */
function findSimilarParam(name: string, params: CompleteParamDef[]): string | null {
  const lower = name.toLowerCase();
  
  for (const param of params) {
    const paramLower = param.name.toLowerCase();
    
    // Exact prefix match
    if (paramLower.startsWith(lower) || lower.startsWith(paramLower)) {
      return param.name;
    }
    
    // Levenshtein distance <= 2
    if (levenshtein(lower, paramLower) <= 2) {
      return param.name;
    }
  }
  
  return null;
}

/**
 * Levenshtein distance.
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j]! + 1
        );
      }
    }
  }
  
  return matrix[b.length]![a.length]!;
}

// ============================================================================
// INVOKE WITH VALIDATION
// ============================================================================

/**
 * Invokes a card with parameter validation.
 */
export function invokeValidated<T>(
  cardId: string,
  input: unknown,
  ctx: CardContext,
  params?: ParamOverrides,
  options?: {
    /** Throw on validation error */
    strict?: boolean;
    /** Log warnings */
    logWarnings?: boolean;
  }
): InvokeResult<T> & { validation: ParamValidationResult } {
  const validation = params ? validateParams(cardId, params) : {
    valid: true,
    errors: [],
    warnings: [],
  };
  
  if (options?.strict && !validation.valid) {
    throw new Error(
      `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`
    );
  }
  
  if (options?.logWarnings && validation.warnings.length > 0) {
    console.warn(`[${cardId}] Warnings:`, validation.warnings);
  }
  
  const coercedParams = (validation.coercedValue as ParamOverrides) ?? params;
  const result = invoke<T>(cardId, input, ctx, coercedParams);
  
  return { ...result, validation };
}

// ============================================================================
// AUTO-COMPLETE
// ============================================================================

/**
 * Gets parameter suggestions for a card.
 */
export function getParamSuggestions(cardId: string): ParamSuggestion[] {
  const def = cardDefRegistry.get(cardId);
  if (!def) return [];
  
  return def.params.map(p => {
    const suggestion: ParamSuggestion = {
      param: p.name,
      type: p.type,
      default: p.default,
    };
    if (p.min !== null && p.min !== undefined) suggestion.min = p.min;
    if (p.max !== null && p.max !== undefined) suggestion.max = p.max;
    if (p.description) suggestion.description = p.description;
    const currentValue = get(cardId, p.name);
    if (currentValue !== undefined) suggestion.currentValue = currentValue;
    return suggestion;
  });
}

/**
 * Gets filtered suggestions based on partial input.
 */
export function filterParamSuggestions(
  cardId: string,
  partial: string
): ParamSuggestion[] {
  const all = getParamSuggestions(cardId);
  const lower = partial.toLowerCase();
  
  return all.filter(s => 
    s.param.toLowerCase().startsWith(lower) ||
    s.param.toLowerCase().includes(lower)
  ).sort((a, b) => {
    // Prefer prefix matches
    const aPrefix = a.param.toLowerCase().startsWith(lower);
    const bPrefix = b.param.toLowerCase().startsWith(lower);
    if (aPrefix && !bPrefix) return -1;
    if (!aPrefix && bPrefix) return 1;
    return a.param.localeCompare(b.param);
  });
}

/**
 * Formats parameter as string for display.
 */
export function formatParamSuggestion(s: ParamSuggestion): string {
  let result = `${s.param}: ${s.type}`;
  
  if (s.min !== undefined || s.max !== undefined) {
    result += ` (${s.min ?? '...'}..${s.max ?? '...'})`;
  }
  
  if (s.default !== undefined) {
    result += ` = ${s.default}`;
  }
  
  if (s.currentValue !== undefined && s.currentValue !== s.default) {
    result += ` [current: ${s.currentValue}]`;
  }
  
  return result;
}

// ============================================================================
// TYPE COERCION
// ============================================================================

/**
 * Coerces params to expected types.
 */
export function coerceParams(
  cardId: string,
  params: ParamOverrides
): ParamOverrides {
  const def = cardDefRegistry.get(cardId);
  if (!def) return params;
  
  const coerced: ParamOverrides = {};
  
  for (const [name, value] of Object.entries(params)) {
    const paramDef = def.params.find(p => p.name === name);
    if (!paramDef) {
      coerced[name] = value;
      continue;
    }
    
    coerced[name] = coerceValue(value, paramDef.type);
  }
  
  return coerced;
}

/**
 * Coerces a value to a type.
 */
function coerceValue(value: unknown, type: string): unknown {
  switch (type) {
    case 'number':
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      }
      if (typeof value === 'boolean') return value ? 1 : 0;
      return 0;
      
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        return lower === 'true' || lower === '1' || lower === 'yes';
      }
      return !!value;
      
    case 'string':
      return String(value);
      
    default:
      return value;
  }
}

// ============================================================================
// RANGE CLAMPING
// ============================================================================

/**
 * Clamps all params to their valid ranges.
 */
export function clampParams(
  cardId: string,
  params: ParamOverrides
): ParamOverrides {
  const def = cardDefRegistry.get(cardId);
  if (!def) return params;
  
  const clamped: ParamOverrides = {};
  
  for (const [name, value] of Object.entries(params)) {
    const paramDef = def.params.find(p => p.name === name);
    if (!paramDef || typeof value !== 'number') {
      clamped[name] = value;
      continue;
    }
    
    let result = value;
    if (paramDef.min !== undefined) result = Math.max(paramDef.min, result);
    if (paramDef.max !== undefined) result = Math.min(paramDef.max, result);
    clamped[name] = result;
  }
  
  return clamped;
}

// ============================================================================
// INVOCATION HISTORY
// ============================================================================

const invocationHistory: InvocationHistoryEntry[] = [];
const maxHistorySize = 1000;

/**
 * Records an invocation to history.
 */
export function recordInvocation(
  cardId: string,
  params: ParamOverrides,
  result?: unknown,
  durationMs?: number
): string {
  const id = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  const entry: InvocationHistoryEntry = {
    id,
    cardId,
    params: { ...params },
    timestamp: Date.now(),
  };
  
  if (result !== undefined) entry.result = result;
  if (durationMs !== undefined) entry.durationMs = durationMs;
  
  invocationHistory.push(entry);
  
  // Trim history
  while (invocationHistory.length > maxHistorySize) {
    invocationHistory.shift();
  }
  
  return id;
}

/**
 * Gets recent invocations.
 */
export function getRecentInvocations(count: number = 10): InvocationHistoryEntry[] {
  return invocationHistory.slice(-count);
}

/**
 * Gets invocations for a card.
 */
export function getCardInvocations(cardId: string, count?: number): InvocationHistoryEntry[] {
  const filtered = invocationHistory.filter(e => e.cardId === cardId);
  return count ? filtered.slice(-count) : filtered;
}

/**
 * Clears invocation history.
 */
export function clearInvocationHistory(): void {
  invocationHistory.length = 0;
}

// ============================================================================
// FAVORITES
// ============================================================================

const favorites = new Map<string, FavoriteInvocation>();

/**
 * Adds an invocation to favorites.
 */
export function addFavorite(
  name: string,
  cardId: string,
  params: ParamOverrides,
  options?: { description?: string; tags?: string[] }
): FavoriteInvocation {
  const id = `fav-${name.toLowerCase().replace(/\s+/g, '-')}`;
  
  const fav: FavoriteInvocation = {
    id,
    name,
    cardId,
    params: { ...params },
    createdAt: Date.now(),
  };
  
  if (options?.description) fav.description = options.description;
  if (options?.tags) fav.tags = options.tags;
  
  favorites.set(id, fav);
  return fav;
}

/**
 * Removes a favorite.
 */
export function removeFavorite(id: string): boolean {
  return favorites.delete(id);
}

/**
 * Gets all favorites.
 */
export function getAllFavorites(): FavoriteInvocation[] {
  return Array.from(favorites.values());
}

/**
 * Gets favorites for a card.
 */
export function getCardFavorites(cardId: string): FavoriteInvocation[] {
  return Array.from(favorites.values()).filter(f => f.cardId === cardId);
}

/**
 * Invokes a favorite.
 */
export function invokeFavorite<T>(
  favId: string,
  input: unknown,
  ctx: CardContext,
  extraParams?: ParamOverrides
): InvokeResult<T> {
  const fav = favorites.get(favId);
  if (!fav) {
    throw new Error(`Favorite not found: ${favId}`);
  }
  
  const params = extraParams ? { ...fav.params, ...extraParams } : fav.params;
  return invoke<T>(fav.cardId, input, ctx, params);
}

// ============================================================================
// SEARCH
// ============================================================================

/**
 * Searches invocation history by param values.
 */
export function searchInvocations(criteria: ParamSearchCriteria): InvocationHistoryEntry[] {
  return invocationHistory.filter(entry => matchesCriteria(entry, criteria));
}

/**
 * Checks if an entry matches search criteria.
 */
function matchesCriteria(entry: InvocationHistoryEntry, criteria: ParamSearchCriteria): boolean {
  // Card ID filter
  if (criteria.cardId && entry.cardId !== criteria.cardId) {
    return false;
  }
  
  // Exact match
  if (criteria.exact) {
    for (const [param, value] of Object.entries(criteria.exact)) {
      if (entry.params[param] !== value) {
        return false;
      }
    }
  }
  
  // Range match
  if (criteria.range) {
    for (const [param, [min, max]] of Object.entries(criteria.range)) {
      const value = entry.params[param];
      if (typeof value !== 'number' || value < min || value > max) {
        return false;
      }
    }
  }
  
  // Contains match
  if (criteria.contains) {
    for (const [param, substring] of Object.entries(criteria.contains)) {
      const value = entry.params[param];
      if (typeof value !== 'string' || !value.includes(substring)) {
        return false;
      }
    }
  }
  
  return true;
}

// ============================================================================
// DIFF
// ============================================================================

/**
 * Compares two invocations.
 */
export function diffInvocations(
  a: { cardId: string; params: ParamOverrides },
  b: { cardId: string; params: ParamOverrides }
): InvokeDiff {
  if (a.cardId !== b.cardId) {
    return {
      cardId: `${a.cardId} vs ${b.cardId}`,
      sameParams: [],
      differentParams: [],
      onlyInA: Object.keys(a.params),
      onlyInB: Object.keys(b.params),
    };
  }
  
  const sameParams: string[] = [];
  const differentParams: Array<{ param: string; valueA: unknown; valueB: unknown }> = [];
  const onlyInA: string[] = [];
  const onlyInB: string[] = [];
  
  const allParamsSet = new Set([...Object.keys(a.params), ...Object.keys(b.params)]);
  const allParams = Array.from(allParamsSet);
  
  for (const param of allParams) {
    const inA = param in a.params;
    const inB = param in b.params;
    
    if (inA && !inB) {
      onlyInA.push(param);
    } else if (!inA && inB) {
      onlyInB.push(param);
    } else if (a.params[param] === b.params[param]) {
      sameParams.push(param);
    } else {
      differentParams.push({
        param,
        valueA: a.params[param],
        valueB: b.params[param],
      });
    }
  }
  
  return {
    cardId: a.cardId,
    sameParams,
    differentParams,
    onlyInA,
    onlyInB,
  };
}

/**
 * Formats diff for display.
 */
export function formatDiff(diff: InvokeDiff): string {
  const lines: string[] = [`Diff for ${diff.cardId}:`];
  
  if (diff.sameParams.length > 0) {
    lines.push(`  Same: ${diff.sameParams.join(', ')}`);
  }
  
  if (diff.differentParams.length > 0) {
    lines.push('  Different:');
    for (const d of diff.differentParams) {
      lines.push(`    ${d.param}: ${d.valueA} → ${d.valueB}`);
    }
  }
  
  if (diff.onlyInA.length > 0) {
    lines.push(`  Only in A: ${diff.onlyInA.join(', ')}`);
  }
  
  if (diff.onlyInB.length > 0) {
    lines.push(`  Only in B: ${diff.onlyInB.join(', ')}`);
  }
  
  return lines.join('\n');
}

// ============================================================================
// TEMPLATES
// ============================================================================

const templates = new Map<string, InvokeTemplate>();

/**
 * Creates an invocation template.
 */
export function createTemplate(
  id: string,
  name: string,
  cardId: string,
  fixedParams: ParamOverrides,
  variableParams: string[],
  options?: { defaults?: ParamOverrides; description?: string }
): InvokeTemplate {
  const template: InvokeTemplate = {
    id,
    name,
    cardId,
    fixedParams,
    variableParams,
  };
  
  if (options?.defaults) template.defaults = options.defaults;
  if (options?.description) template.description = options.description;
  
  templates.set(id, template);
  return template;
}

/**
 * Invokes using a template.
 */
export function invokeTemplate<T>(
  templateId: string,
  input: unknown,
  ctx: CardContext,
  variableValues: ParamOverrides
): InvokeResult<T> {
  const template = templates.get(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  
  // Merge params: fixed + defaults + provided
  const params: ParamOverrides = {
    ...template.fixedParams,
    ...(template.defaults ?? {}),
    ...variableValues,
  };
  
  return invoke<T>(template.cardId, input, ctx, params);
}

/**
 * Gets all templates.
 */
export function getAllTemplates(): InvokeTemplate[] {
  return Array.from(templates.values());
}

/**
 * Gets templates for a card.
 */
export function getCardTemplates(cardId: string): InvokeTemplate[] {
  return Array.from(templates.values()).filter(t => t.cardId === cardId);
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Batch invocation spec.
 */
export interface BatchInvokeSpec {
  cardId: string;
  input: unknown;
  params?: ParamOverrides;
}

/**
 * Invokes multiple cards in sequence.
 */
export function batchInvoke<T>(
  specs: BatchInvokeSpec[],
  ctx: CardContext
): InvokeResult<T>[] {
  return specs.map(spec => invoke<T>(spec.cardId, spec.input, ctx, spec.params));
}

/**
 * Invokes same card with different params.
 */
export function batchInvokeCard<T>(
  cardId: string,
  input: unknown,
  ctx: CardContext,
  paramSets: ParamOverrides[]
): InvokeResult<T>[] {
  return paramSets.map(params => invoke<T>(cardId, input, ctx, params));
}

/**
 * Sets params on multiple cards.
 */
export function batchSetParams(
  specs: Array<{ cardId: string; params: ParamOverrides }>
): void {
  for (const spec of specs) {
    for (const [param, value] of Object.entries(spec.params)) {
      set(spec.cardId, param, value);
    }
  }
}

/**
 * Resets multiple cards.
 */
export function batchReset(cardIds: string[]): void {
  for (const cardId of cardIds) {
    set(cardId, {});
  }
}

// ============================================================================
// PRESET COMBINATIONS
// ============================================================================

/**
 * Combines multiple presets into one.
 */
export function combinePresets(
  // @ts-expect-error unused variable
  name: string,
  presets: Array<{ preset: PresetDef; weight?: number }>
): ParamOverrides {
  if (presets.length === 0) return {};
  if (presets.length === 1) return { ...presets[0]!.preset.params };
  
  // Verify all presets are for same card
  const cardId = presets[0]!.preset.cardId;
  if (!presets.every(p => p.preset.cardId === cardId)) {
    throw new Error('Cannot combine presets from different cards');
  }
  
  // Calculate total weight
  const totalWeight = presets.reduce((sum, p) => sum + (p.weight ?? 1), 0);
  
  // Interpolate numeric params
  const combined: ParamOverrides = {};
  const allParamsSet = new Set(presets.flatMap(p => Object.keys(p.preset.params)));
  const allParams = Array.from(allParamsSet);
  
  for (const param of allParams) {
    const values = presets
      .filter(p => param in p.preset.params)
      .map(p => ({
        value: p.preset.params[param],
        weight: p.weight ?? 1,
      }));
    
    if (values.length === 0) continue;
    
    // Check if all numeric
    if (values.every(v => typeof v.value === 'number')) {
      // Weighted average
      const sum = values.reduce((acc, v) => acc + (v.value as number) * v.weight, 0);
      combined[param] = sum / totalWeight;
    } else {
      // Take value from highest weight
      const highest = values.reduce((max, v) => v.weight > max.weight ? v : max);
      combined[param] = highest.value;
    }
  }
  
  return combined;
}

/**
 * Morphs between two invocations.
 */
export function morphParams(
  a: ParamOverrides,
  b: ParamOverrides,
  t: number
): ParamOverrides {
  const result: ParamOverrides = {};
  const allParams = new Set([...Object.keys(a), ...Object.keys(b)]);
  
  for (const param of allParams) {
    const valueA = a[param];
    const valueB = b[param];
    
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      result[param] = valueA + (valueB - valueA) * t;
    } else if (t < 0.5) {
      result[param] = valueA ?? valueB;
    } else {
      result[param] = valueB ?? valueA;
    }
  }
  
  return result;
}
