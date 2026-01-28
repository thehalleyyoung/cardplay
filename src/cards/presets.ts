/**
 * @fileoverview Preset System Implementation.
 * 
 * Provides preset management with factory/user presets, inheritance, morphing, and export/import.
 * 
 * @module @cardplay/core/cards/presets
 */

import type {
  Parameter,
  FloatParameter,
  IntParameter,
  EnumParameter,
} from './parameters';
import {
  extractParameterValues,
  applyParameterValues,
} from './parameters';

// ============================================================================
// PRESET INTERFACE
// ============================================================================

/**
 * Preset definition containing parameter values.
 */
export interface Preset {
  /** Unique preset identifier */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Category for organization */
  readonly category: string;
  /** Author name */
  readonly author: string;
  /** Tags for search */
  readonly tags: readonly string[];
  /** Description */
  readonly description?: string;
  /** Parameter values (id → value) */
  readonly params: Readonly<Record<string, unknown>>;
  /** Whether this is a factory preset (read-only) */
  readonly isFactory: boolean;
  /** Parent preset ID for inheritance */
  readonly parentPresetId?: string;
  /** Creation timestamp */
  readonly createdAt: number;
  /** Last modified timestamp */
  readonly modifiedAt: number;
  /** Version number */
  readonly version: number;
}

/**
 * Options for creating a preset.
 */
export interface CreatePresetOptions {
  id: string;
  name: string;
  category?: string;
  author?: string;
  tags?: readonly string[];
  description?: string;
  params: Record<string, unknown>;
  isFactory?: boolean;
  parentPresetId?: string;
}

/**
 * Creates a new preset.
 */
export function createPreset(options: CreatePresetOptions): Preset {
  const now = Date.now();
  return Object.freeze({
    id: options.id,
    name: options.name,
    category: options.category ?? 'user',
    author: options.author ?? 'User',
    tags: Object.freeze(options.tags ?? []),
    ...(options.description !== undefined && { description: options.description }),
    params: Object.freeze({ ...options.params }),
    isFactory: options.isFactory ?? false,
    ...(options.parentPresetId !== undefined && { parentPresetId: options.parentPresetId }),
    createdAt: now,
    modifiedAt: now,
    version: 1,
  });
}

/**
 * Create preset from current parameter values.
 */
export function createPresetFromParameters(
  id: string,
  name: string,
  params: readonly Parameter[],
  options?: Partial<Omit<CreatePresetOptions, 'id' | 'name' | 'params'>>
): Preset {
  return createPreset({
    id,
    name,
    params: extractParameterValues(params),
    ...options,
  });
}

/**
 * Update preset with new values.
 */
export function updatePreset(preset: Preset, updates: Partial<Omit<Preset, 'id' | 'isFactory' | 'createdAt'>>): Preset {
  if (preset.isFactory) {
    throw new Error('Cannot modify factory preset');
  }
  return Object.freeze({
    ...preset,
    ...updates,
    modifiedAt: Date.now(),
    version: preset.version + 1,
  });
}

/**
 * Derive a new preset from a parent preset.
 */
export function derivePreset(
  parent: Preset,
  id: string,
  name: string,
  overrides: Record<string, unknown>
): Preset {
  return createPreset({
    id,
    name,
    category: parent.category,
    author: 'User',
    tags: [...parent.tags],
    description: `Derived from ${parent.name}`,
    params: { ...parent.params, ...overrides },
    isFactory: false,
    parentPresetId: parent.id,
  });
}

// ============================================================================
// PRESET BANK
// ============================================================================

/**
 * Collection of presets for a card.
 */
export interface PresetBank {
  /** Card ID this bank belongs to */
  readonly cardId: string;
  /** All presets by ID */
  readonly presets: ReadonlyMap<string, Preset>;
  /** Currently loaded preset ID */
  readonly currentPresetId: string | null;
  /** Current parameter overrides (changes from preset) */
  readonly overrides: Readonly<Record<string, unknown>>;
  /** Whether current state differs from loaded preset */
  readonly isModified: boolean;
  /** Categories with preset counts */
  readonly categories: ReadonlyMap<string, number>;
}

/**
 * Creates a new PresetBank.
 */
export function createPresetBank(cardId: string, factoryPresets: readonly Preset[] = []): PresetBank {
  const presetsMap = new Map<string, Preset>();
  const categories = new Map<string, number>();
  
  for (const preset of factoryPresets) {
    presetsMap.set(preset.id, preset);
    const count = categories.get(preset.category) ?? 0;
    categories.set(preset.category, count + 1);
  }
  
  return Object.freeze({
    cardId,
    presets: presetsMap,
    currentPresetId: null,
    overrides: Object.freeze({}),
    isModified: false,
    categories,
  });
}

/**
 * Add a preset to the bank.
 */
export function addPreset(bank: PresetBank, preset: Preset): PresetBank {
  const presets = new Map(bank.presets);
  presets.set(preset.id, preset);
  
  const categories = new Map(bank.categories);
  const count = categories.get(preset.category) ?? 0;
  categories.set(preset.category, count + 1);
  
  return Object.freeze({
    ...bank,
    presets,
    categories,
  });
}

/**
 * Remove a preset from the bank (user presets only).
 */
export function removePreset(bank: PresetBank, presetId: string): PresetBank {
  const preset = bank.presets.get(presetId);
  if (!preset || preset.isFactory) {
    return bank;
  }
  
  const presets = new Map(bank.presets);
  presets.delete(presetId);
  
  const categories = new Map(bank.categories);
  const count = categories.get(preset.category) ?? 0;
  if (count <= 1) {
    categories.delete(preset.category);
  } else {
    categories.set(preset.category, count - 1);
  }
  
  let currentPresetId = bank.currentPresetId;
  let overrides = bank.overrides;
  let isModified = bank.isModified;
  
  // If we removed the current preset, clear it
  if (currentPresetId === presetId) {
    currentPresetId = null;
    overrides = Object.freeze({});
    isModified = false;
  }
  
  return Object.freeze({
    ...bank,
    presets,
    categories,
    currentPresetId,
    overrides,
    isModified,
  });
}

/**
 * Load a preset (sets as current, clears overrides).
 */
export function loadPreset(bank: PresetBank, presetId: string): PresetBank {
  if (!bank.presets.has(presetId)) {
    return bank;
  }
  
  return Object.freeze({
    ...bank,
    currentPresetId: presetId,
    overrides: Object.freeze({}),
    isModified: false,
  });
}

/**
 * Get current preset.
 */
export function getCurrentPreset(bank: PresetBank): Preset | null {
  if (!bank.currentPresetId) return null;
  return bank.presets.get(bank.currentPresetId) ?? null;
}

/**
 * Get effective parameter value (preset + overrides).
 */
export function getEffectiveValue<T>(bank: PresetBank, paramId: string, defaultValue: T): T {
  // Check overrides first
  if (paramId in bank.overrides) {
    return bank.overrides[paramId] as T;
  }
  
  // Then check current preset
  const preset = getCurrentPreset(bank);
  if (preset && paramId in preset.params) {
    return preset.params[paramId] as T;
  }
  
  return defaultValue;
}

/**
 * Set a parameter value (creates override).
 */
export function setParameterValue(bank: PresetBank, paramId: string, value: unknown): PresetBank {
  const preset = getCurrentPreset(bank);
  
  // Check if this matches the preset value (can remove override)
  if (preset && preset.params[paramId] === value) {
    if (!(paramId in bank.overrides)) {
      return bank;
    }
    // Remove this override
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [paramId]: _, ...restOverrides } = bank.overrides;
    const isModified = Object.keys(restOverrides).length > 0;
    return Object.freeze({
      ...bank,
      overrides: Object.freeze(restOverrides),
      isModified,
    });
  }
  
  // Add/update override
  const overrides = Object.freeze({
    ...bank.overrides,
    [paramId]: value,
  });
  
  return Object.freeze({
    ...bank,
    overrides,
    isModified: true,
  });
}

/**
 * Revert to loaded preset (clear all overrides).
 */
export function revertToPreset(bank: PresetBank): PresetBank {
  if (!bank.isModified) return bank;
  
  return Object.freeze({
    ...bank,
    overrides: Object.freeze({}),
    isModified: false,
  });
}

/**
 * Get diff from current preset.
 */
export function diffFromPreset(bank: PresetBank): Record<string, { preset: unknown; current: unknown }> {
  const result: Record<string, { preset: unknown; current: unknown }> = {};
  const preset = getCurrentPreset(bank);
  
  for (const [paramId, currentValue] of Object.entries(bank.overrides)) {
    const presetValue = preset?.params[paramId];
    result[paramId] = { preset: presetValue, current: currentValue };
  }
  
  return result;
}

/**
 * Save current state as new user preset.
 */
export function saveAsPreset(
  bank: PresetBank,
  id: string,
  name: string,
  category: string = 'user'
): { bank: PresetBank; preset: Preset } {
  const currentPreset = getCurrentPreset(bank);
  const params = currentPreset
    ? { ...currentPreset.params, ...bank.overrides }
    : { ...bank.overrides };
  
  const preset = createPreset({
    id,
    name,
    category,
    params,
    isFactory: false,
    ...(currentPreset?.id !== undefined && { parentPresetId: currentPreset.id }),
  });
  
  const newBank = addPreset(bank, preset);
  const loadedBank = loadPreset(newBank, id);
  
  return { bank: loadedBank, preset };
}

/**
 * Apply preset values to parameters.
 */
export function applyPresetToParameters(
  bank: PresetBank,
  params: readonly Parameter[]
): readonly Parameter[] {
  const preset = getCurrentPreset(bank);
  if (!preset) return params;
  
  const effectiveValues: Record<string, unknown> = { ...preset.params, ...bank.overrides };
  return applyParameterValues(params, effectiveValues);
}

// ============================================================================
// PRESET OPERATIONS
// ============================================================================

/**
 * Get presets by category.
 */
export function getPresetsByCategory(bank: PresetBank, category: string): readonly Preset[] {
  return [...bank.presets.values()].filter(p => p.category === category);
}

/**
 * Get factory presets.
 */
export function getFactoryPresets(bank: PresetBank): readonly Preset[] {
  return [...bank.presets.values()].filter(p => p.isFactory);
}

/**
 * Get user presets.
 */
export function getUserPresets(bank: PresetBank): readonly Preset[] {
  return [...bank.presets.values()].filter(p => !p.isFactory);
}

/**
 * Search presets by name or tags.
 */
export function searchPresets(bank: PresetBank, query: string): readonly Preset[] {
  const lowerQuery = query.toLowerCase();
  return [...bank.presets.values()].filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
    p.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get all category names.
 */
export function getCategories(bank: PresetBank): readonly string[] {
  return [...bank.categories.keys()];
}

// ============================================================================
// PRESET MORPHING
// ============================================================================

/**
 * Morph between two presets.
 */
export function morphPresets(
  presetA: Preset,
  presetB: Preset,
  t: number,
  params: readonly Parameter[]
): Record<string, unknown> {
  const clampedT = Math.max(0, Math.min(1, t));
  const result: Record<string, unknown> = {};
  
  for (const param of params) {
    const valueA = presetA.params[param.id];
    const valueB = presetB.params[param.id];
    
    if (valueA === undefined || valueB === undefined) {
      result[param.id] = valueA ?? valueB ?? param.default;
      continue;
    }
    
    // Interpolate based on type
    switch (param.type) {
      case 'float':
      case 'int': {
        const numA = valueA as number;
        const numB = valueB as number;
        result[param.id] = numA + (numB - numA) * clampedT;
        break;
      }
      case 'bool': {
        // Switch at midpoint
        result[param.id] = clampedT < 0.5 ? valueA : valueB;
        break;
      }
      case 'enum':
      case 'string': {
        // Switch at midpoint
        result[param.id] = clampedT < 0.5 ? valueA : valueB;
        break;
      }
      default:
        result[param.id] = clampedT < 0.5 ? valueA : valueB;
    }
  }
  
  return result;
}

/**
 * Create morphed preset from two source presets.
 */
export function createMorphedPreset(
  presetA: Preset,
  presetB: Preset,
  t: number,
  params: readonly Parameter[],
  id: string,
  name: string
): Preset {
  const morphedParams = morphPresets(presetA, presetB, t, params);
  
  return createPreset({
    id,
    name,
    category: 'morphed',
    description: `Morphed ${Math.round(t * 100)}% from ${presetA.name} to ${presetB.name}`,
    params: morphedParams,
    isFactory: false,
  });
}

// ============================================================================
// PRESET LAYERS
// ============================================================================

/**
 * Preset layer with blend weight.
 */
export interface PresetLayer {
  readonly preset: Preset;
  readonly weight: number;
}

/**
 * Blend multiple presets with weights.
 */
export function blendPresets(
  layers: readonly PresetLayer[],
  params: readonly Parameter[]
): Record<string, unknown> {
  if (layers.length === 0) return {};
  const firstLayer = layers[0];
  if (layers.length === 1 && firstLayer) return { ...firstLayer.preset.params };
  
  // Normalize weights
  const totalWeight = layers.reduce((sum, l) => sum + l.weight, 0);
  if (totalWeight === 0 && firstLayer) return { ...firstLayer.preset.params };
  if (totalWeight === 0) return {};
  
  const result: Record<string, unknown> = {};
  
  for (const param of params) {
    if (param.type === 'float' || param.type === 'int') {
      // Weighted average for numeric types
      let weightedSum = 0;
      for (const layer of layers) {
        const value = layer.preset.params[param.id];
        if (typeof value === 'number') {
          weightedSum += value * (layer.weight / totalWeight);
        }
      }
      result[param.id] = param.type === 'int' ? Math.round(weightedSum) : weightedSum;
    } else {
      // For non-numeric, use highest weight value
      let maxWeight = -1;
      let maxValue: unknown;
      for (const layer of layers) {
        if (layer.weight > maxWeight && param.id in layer.preset.params) {
          maxWeight = layer.weight;
          maxValue = layer.preset.params[param.id];
        }
      }
      result[param.id] = maxValue;
    }
  }
  
  return result;
}

// ============================================================================
// CURRIED PRESETS (Partial Application)
// ============================================================================

/**
 * A curried preset that excludes certain parameter groups.
 * Like partial application: "everything except the lead instrument"
 */
export interface CurriedPreset {
  /** Base preset this is derived from */
  readonly basePreset: Preset;
  /** Parameter IDs or groups that are excluded (to be filled in later) */
  readonly excludedParams: readonly string[];
  /** Parameter groups that are excluded */
  readonly excludedGroups: readonly string[];
  /** Optional name for this curried preset */
  readonly name?: string;
  /** Description of what's excluded */
  readonly description?: string;
}

/**
 * Create a curried preset by excluding specific parameters.
 * 
 * @example
 * // Create "rhythm section only" by excluding lead params
 * const rhythmSection = curryPreset(fullBandPreset, {
 *   excludedParams: ['lead-volume', 'lead-pan', 'lead-instrument'],
 *   name: 'Rhythm Section'
 * });
 */
export function curryPreset(
  preset: Preset,
  options: {
    excludedParams?: readonly string[];
    excludedGroups?: readonly string[];
    name?: string;
    description?: string;
  }
): CurriedPreset {
  return Object.freeze({
    basePreset: preset,
    excludedParams: Object.freeze(options.excludedParams ?? []),
    excludedGroups: Object.freeze(options.excludedGroups ?? []),
    ...(options.name !== undefined && { name: options.name }),
    ...(options.description !== undefined && { description: options.description }),
  });
}

/**
 * Apply a curried preset with new values for excluded parameters.
 * 
 * @example
 * // Take rhythm section, add new lead instrument
 * const fullPreset = applyCurriedPreset(rhythmSection, {
 *   'lead-volume': 0.8,
 *   'lead-pan': 0.0,
 *   'lead-instrument': 'trumpet'
 * });
 */
export function applyCurriedPreset(
  curried: CurriedPreset,
  newValues: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  // Copy non-excluded params from base preset
  for (const [paramId, value] of Object.entries(curried.basePreset.params)) {
    if (!curried.excludedParams.includes(paramId)) {
      result[paramId] = value;
    }
  }
  
  // Apply new values
  for (const [paramId, value] of Object.entries(newValues)) {
    result[paramId] = value;
  }
  
  return result;
}

/**
 * Apply curried preset with parameters, filtering by group.
 */
export function applyCurriedPresetWithParams(
  curried: CurriedPreset,
  newValues: Record<string, unknown>,
  params: readonly Parameter[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  // Copy non-excluded params from base preset
  for (const [paramId, value] of Object.entries(curried.basePreset.params)) {
    const param = params.find(p => p.id === paramId);
    const isExcludedById = curried.excludedParams.includes(paramId);
    const isExcludedByGroup = param?.group && curried.excludedGroups.includes(param.group);
    
    if (!isExcludedById && !isExcludedByGroup) {
      result[paramId] = value;
    }
  }
  
  // Apply new values
  for (const [paramId, value] of Object.entries(newValues)) {
    result[paramId] = value;
  }
  
  return result;
}

/**
 * Create a new preset by stacking values onto a curried preset.
 */
export function stackOnCurriedPreset(
  curried: CurriedPreset,
  newValues: Record<string, unknown>,
  id: string,
  name: string,
  params?: readonly Parameter[]
): Preset {
  const combinedParams = params
    ? applyCurriedPresetWithParams(curried, newValues, params)
    : applyCurriedPreset(curried, newValues);
  
  return createPreset({
    id,
    name,
    category: curried.basePreset.category,
    description: `${curried.name ?? curried.basePreset.name} + custom ${curried.excludedGroups.join(', ') || 'values'}`,
    params: combinedParams,
    isFactory: false,
    parentPresetId: curried.basePreset.id,
  });
}

/**
 * Common preset curry patterns for typical use cases.
 */
export const CurryPatterns = {
  /** Exclude lead/melody instrument */
  EXCEPT_LEAD: ['lead-volume', 'lead-pan', 'lead-instrument', 'lead-octave', 'lead-velocity'],
  /** Exclude bass */
  EXCEPT_BASS: ['bass-volume', 'bass-pan', 'bass-instrument', 'bass-octave'],
  /** Exclude drums/percussion */
  EXCEPT_DRUMS: ['drums-volume', 'drums-pan', 'drums-kit', 'drums-pattern'],
  /** Exclude harmony/chords */
  EXCEPT_HARMONY: ['chord-volume', 'chord-pan', 'chord-instrument', 'chord-voicing'],
  /** Exclude all instruments (keep only effects/mix) */
  EXCEPT_ALL_INSTRUMENTS: ['lead-*', 'bass-*', 'drums-*', 'chord-*', 'pad-*'],
  /** Exclude effects (keep dry signal) */
  EXCEPT_EFFECTS: ['reverb-*', 'delay-*', 'chorus-*', 'distortion-*', 'compressor-*'],
  /** Exclude mix settings */
  EXCEPT_MIX: ['*-volume', '*-pan', 'master-*'],
} as const;

/**
 * Create curried preset using a common pattern.
 */
export function curryPresetWithPattern(
  preset: Preset,
  pattern: readonly string[],
  params: readonly Parameter[],
  name?: string
): CurriedPreset {
  // Expand wildcards in pattern
  const excludedParams: string[] = [];
  
  for (const patternItem of pattern) {
    if (patternItem.includes('*')) {
      // Convert pattern to regex
      const regex = new RegExp('^' + patternItem.replace(/\*/g, '.*') + '$');
      for (const param of params) {
        if (regex.test(param.id)) {
          excludedParams.push(param.id);
        }
      }
    } else {
      excludedParams.push(patternItem);
    }
  }
  
  return curryPreset(preset, {
    excludedParams,
    name: name ?? `${preset.name} (partial)`,
    description: `Excludes: ${pattern.join(', ')}`,
  });
}

/**
 * Preset slot for building composite presets.
 */
export interface PresetSlot {
  /** Slot identifier (e.g., 'lead', 'bass', 'drums') */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Parameter IDs that belong to this slot */
  readonly paramIds: readonly string[];
  /** Parameter groups that belong to this slot */
  readonly groups: readonly string[];
  /** Current values for this slot */
  readonly values: Readonly<Record<string, unknown>>;
  /** Source preset ID if loaded from a preset */
  readonly sourcePresetId?: string;
}

/**
 * Composite preset built from multiple slots.
 */
export interface CompositePreset {
  /** Unique identifier */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Slots that make up this preset */
  readonly slots: readonly PresetSlot[];
  /** Merged parameter values */
  readonly params: Readonly<Record<string, unknown>>;
}

/**
 * Create a preset slot.
 */
export function createPresetSlot(
  id: string,
  name: string,
  options: {
    paramIds?: readonly string[];
    groups?: readonly string[];
    values?: Record<string, unknown>;
    sourcePresetId?: string;
  } = {}
): PresetSlot {
  return Object.freeze({
    id,
    name,
    paramIds: Object.freeze(options.paramIds ?? []),
    groups: Object.freeze(options.groups ?? []),
    values: Object.freeze(options.values ?? {}),
    ...(options.sourcePresetId !== undefined && { sourcePresetId: options.sourcePresetId }),
  });
}

/**
 * Extract slot values from a preset.
 */
export function extractSlotFromPreset(
  preset: Preset,
  slotDef: { paramIds?: readonly string[]; groups?: readonly string[] },
  params: readonly Parameter[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [paramId, value] of Object.entries(preset.params)) {
    const param = params.find(p => p.id === paramId);
    const matchesId = slotDef.paramIds?.includes(paramId);
    const matchesGroup = param?.group && slotDef.groups?.includes(param.group);
    
    if (matchesId || matchesGroup) {
      result[paramId] = value;
    }
  }
  
  return result;
}

/**
 * Create composite preset by merging slots.
 */
export function createCompositePreset(
  id: string,
  name: string,
  slots: readonly PresetSlot[]
): CompositePreset {
  const params: Record<string, unknown> = {};
  
  for (const slot of slots) {
    for (const [paramId, value] of Object.entries(slot.values)) {
      params[paramId] = value;
    }
  }
  
  return Object.freeze({
    id,
    name,
    slots: Object.freeze([...slots]),
    params: Object.freeze(params),
  });
}

/**
 * Update a slot in a composite preset.
 */
export function updateCompositeSlot(
  composite: CompositePreset,
  slotId: string,
  newValues: Record<string, unknown>,
  sourcePresetId?: string
): CompositePreset {
  const updatedSlots = composite.slots.map(slot => {
    if (slot.id !== slotId) return slot;
    return Object.freeze({
      ...slot,
      values: Object.freeze({ ...slot.values, ...newValues }),
      ...(sourcePresetId !== undefined && { sourcePresetId }),
    });
  });
  
  // Rebuild merged params
  const params: Record<string, unknown> = {};
  for (const slot of updatedSlots) {
    for (const [paramId, value] of Object.entries(slot.values)) {
      params[paramId] = value;
    }
  }
  
  return Object.freeze({
    ...composite,
    slots: Object.freeze(updatedSlots),
    params: Object.freeze(params),
  });
}

/**
 * Convert composite preset to regular preset.
 */
export function compositeToPreset(composite: CompositePreset, category: string = 'composite'): Preset {
  const sourceIds = composite.slots
    .filter(s => s.sourcePresetId)
    .map(s => s.sourcePresetId);
  
  return createPreset({
    id: composite.id,
    name: composite.name,
    category,
    description: sourceIds.length > 0
      ? `Composed from: ${sourceIds.join(', ')}`
      : 'Custom composite preset',
    params: { ...composite.params },
    isFactory: false,
  });
}

// ============================================================================
// PRESET RANDOMIZATION
// ============================================================================

/**
 * Randomize preset within parameter ranges.
 */
export function randomizePreset(
  params: readonly Parameter[],
  amount: number = 1
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const param of params) {
    if (!param.automatable) {
      result[param.id] = param.default;
      continue;
    }
    
    const rand = Math.random() * amount;
    
    switch (param.type) {
      case 'float': {
        const fp = param as FloatParameter;
        result[param.id] = fp.min + rand * (fp.max - fp.min);
        break;
      }
      case 'int': {
        const ip = param as IntParameter;
        result[param.id] = Math.round(ip.min + rand * (ip.max - ip.min));
        break;
      }
      case 'bool':
        result[param.id] = Math.random() < 0.5;
        break;
      case 'enum': {
        const ep = param as EnumParameter;
        const idx = Math.floor(Math.random() * ep.options.length);
        result[param.id] = ep.options[idx];
        break;
      }
      default:
        result[param.id] = param.default;
    }
  }
  
  return result;
}

/**
 * Mutate preset by small random amounts.
 */
export function mutatePreset(
  preset: Preset,
  params: readonly Parameter[],
  amount: number = 0.1
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...preset.params };
  
  for (const param of params) {
    if (!param.automatable) continue;
    
    const currentValue = preset.params[param.id];
    if (currentValue === undefined) continue;
    
    switch (param.type) {
      case 'float': {
        const fp = param as FloatParameter;
        const mutation = (Math.random() - 0.5) * 2 * amount * (fp.max - fp.min);
        const newValue = Math.max(fp.min, Math.min(fp.max, (currentValue as number) + mutation));
        result[param.id] = newValue;
        break;
      }
      case 'int': {
        const ip = param as IntParameter;
        const mutation = Math.round((Math.random() - 0.5) * 2 * amount * (ip.max - ip.min));
        const newValue = Math.max(ip.min, Math.min(ip.max, (currentValue as number) + mutation));
        result[param.id] = newValue;
        break;
      }
      case 'bool':
        // Small chance to flip
        if (Math.random() < amount * 0.3) {
          result[param.id] = !currentValue;
        }
        break;
      // Enums and strings don't mutate by default
    }
  }
  
  return result;
}

// ============================================================================
// PRESET IMPORT/EXPORT
// ============================================================================

/**
 * Preset export format.
 */
export interface PresetExport {
  readonly version: string;
  readonly cardId: string;
  readonly preset: {
    readonly id: string;
    readonly name: string;
    readonly category: string;
    readonly author: string;
    readonly tags: readonly string[];
    readonly description?: string;
    readonly params: Readonly<Record<string, unknown>>;
    readonly parentPresetId?: string;
  };
}

/**
 * Export preset to JSON-safe format.
 */
export function exportPreset(cardId: string, preset: Preset): PresetExport {
  return {
    version: '1.0',
    cardId,
    preset: {
      id: preset.id,
      name: preset.name,
      category: preset.category,
      author: preset.author,
      tags: preset.tags,
      ...(preset.description !== undefined && { description: preset.description }),
      params: preset.params,
      ...(preset.parentPresetId !== undefined && { parentPresetId: preset.parentPresetId }),
    },
  };
}

/**
 * Export preset to JSON string.
 */
export function exportPresetToJson(cardId: string, preset: Preset): string {
  return JSON.stringify(exportPreset(cardId, preset), null, 2);
}

/**
 * Validation result for preset import.
 */
export interface PresetValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Validate preset export format.
 */
export function validatePresetExport(
  data: unknown,
  expectedCardId?: string,
  validParamIds?: readonly string[]
): PresetValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid preset data: expected object'], warnings: [] };
  }
  
  const obj = data as Record<string, unknown>;
  
  // Version check
  if (!obj.version || typeof obj.version !== 'string') {
    errors.push('Missing or invalid version');
  }
  
  // Card ID check
  if (!obj.cardId || typeof obj.cardId !== 'string') {
    errors.push('Missing or invalid cardId');
  } else if (expectedCardId && obj.cardId !== expectedCardId) {
    errors.push(`Card ID mismatch: expected ${expectedCardId}, got ${obj.cardId}`);
  }
  
  // Preset check
  if (!obj.preset || typeof obj.preset !== 'object') {
    errors.push('Missing or invalid preset object');
    return { valid: false, errors, warnings };
  }
  
  const preset = obj.preset as Record<string, unknown>;
  
  if (!preset.id || typeof preset.id !== 'string') {
    errors.push('Missing or invalid preset id');
  }
  
  if (!preset.name || typeof preset.name !== 'string') {
    errors.push('Missing or invalid preset name');
  }
  
  if (!preset.params || typeof preset.params !== 'object') {
    errors.push('Missing or invalid preset params');
  } else if (validParamIds) {
    const params = preset.params as Record<string, unknown>;
    const paramIds = Object.keys(params);
    
    // Check for unknown params
    for (const id of paramIds) {
      if (!validParamIds.includes(id)) {
        warnings.push(`Unknown parameter: ${id}`);
      }
    }
    
    // Check for missing params
    for (const id of validParamIds) {
      if (!(id in params)) {
        warnings.push(`Missing parameter: ${id}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Import preset from JSON data.
 */
export function importPreset(
  data: unknown,
  expectedCardId?: string
): { success: true; preset: Preset } | { success: false; errors: readonly string[] } {
  const validation = validatePresetExport(data, expectedCardId);
  
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  
  const obj = data as PresetExport;
  
  const preset = createPreset({
    id: obj.preset.id,
    name: obj.preset.name,
    category: obj.preset.category,
    author: obj.preset.author,
    tags: [...obj.preset.tags],
    ...(obj.preset.description !== undefined && { description: obj.preset.description }),
    params: { ...obj.preset.params },
    isFactory: false,
    ...(obj.preset.parentPresetId !== undefined && { parentPresetId: obj.preset.parentPresetId }),
  });
  
  return { success: true, preset };
}

/**
 * Import preset from JSON string.
 */
export function importPresetFromJson(
  json: string,
  expectedCardId?: string
): { success: true; preset: Preset } | { success: false; errors: readonly string[] } {
  try {
    const data = JSON.parse(json);
    return importPreset(data, expectedCardId);
  } catch {
    return { success: false, errors: ['Invalid JSON format'] };
  }
}

// ============================================================================
// PRESET COMPARISON
// ============================================================================

/**
 * Compare two presets and return differences.
 */
export function comparePresets(
  presetA: Preset,
  presetB: Preset
): Record<string, { a: unknown; b: unknown }> {
  const diff: Record<string, { a: unknown; b: unknown }> = {};
  
  const allKeys = new Set([
    ...Object.keys(presetA.params),
    ...Object.keys(presetB.params),
  ]);
  
  for (const key of allKeys) {
    const a = presetA.params[key];
    const b = presetB.params[key];
    
    if (a !== b) {
      diff[key] = { a, b };
    }
  }
  
  return diff;
}

/**
 * Calculate similarity between two presets (0-1).
 */
export function presetSimilarity(
  presetA: Preset,
  presetB: Preset,
  params: readonly Parameter[]
): number {
  let totalDistance = 0;
  let paramCount = 0;
  
  for (const param of params) {
    const a = presetA.params[param.id];
    const b = presetB.params[param.id];
    
    if (a === undefined || b === undefined) continue;
    
    paramCount++;
    
    switch (param.type) {
      case 'float': {
        const fp = param as FloatParameter;
        const range = fp.max - fp.min;
        const distance = Math.abs((a as number) - (b as number)) / range;
        totalDistance += distance;
        break;
      }
      case 'int': {
        const ip = param as IntParameter;
        const range = ip.max - ip.min;
        const distance = Math.abs((a as number) - (b as number)) / range;
        totalDistance += distance;
        break;
      }
      case 'bool':
      case 'enum':
      case 'string':
        totalDistance += a === b ? 0 : 1;
        break;
    }
  }
  
  if (paramCount === 0) return 1;
  
  const avgDistance = totalDistance / paramCount;
  return 1 - avgDistance;
}
