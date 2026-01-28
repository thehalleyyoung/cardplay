/**
 * @fileoverview Macro Control System Implementation.
 * 
 * Provides 8 macro controls that can map to multiple parameters with:
 * - Range mapping (min/max)
 * - Curve mapping (linear/log/exp/etc.)
 * - Automation support
 * - MIDI learn capability
 * - Snapshot and morph functionality
 * 
 * @module @cardplay/core/cards/macro-controls
 */

import type { ParameterCurve } from './parameters.js';

// ============================================================================
// MACRO PARAMETER MAPPING
// ============================================================================

/**
 * Mapping from macro control to target parameter.
 */
export interface MacroMapping {
  /** Target parameter ID (cardId.paramId) */
  readonly targetId: string;
  /** Minimum value at macro = 0 */
  readonly min: number;
  /** Maximum value at macro = 1 */
  readonly max: number;
  /** Curve for mapping (overrides parameter curve) */
  readonly curve: ParameterCurve;
  /** Bipolar mode (-1 to +1 around center) */
  readonly bipolar: boolean;
  /** Whether this mapping is enabled */
  readonly enabled: boolean;
}

/**
 * Options for creating a MacroMapping.
 */
export interface MacroMappingOptions {
  targetId: string;
  min?: number;
  max?: number;
  curve?: ParameterCurve;
  bipolar?: boolean;
  enabled?: boolean;
}

/**
 * Creates a MacroMapping.
 */
export function createMacroMapping(options: MacroMappingOptions): MacroMapping {
  return Object.freeze({
    targetId: options.targetId,
    min: options.min ?? 0,
    max: options.max ?? 1,
    curve: options.curve ?? 'linear',
    bipolar: options.bipolar ?? false,
    enabled: options.enabled ?? true,
  });
}

/**
 * Updates a MacroMapping.
 */
export function updateMacroMapping(mapping: MacroMapping, updates: Partial<MacroMappingOptions>): MacroMapping {
  return Object.freeze({ ...mapping, ...updates });
}

/**
 * Enable/disable a MacroMapping.
 */
export function setMacroMappingEnabled(mapping: MacroMapping, enabled: boolean): MacroMapping {
  if (mapping.enabled === enabled) return mapping;
  return Object.freeze({ ...mapping, enabled });
}

// ============================================================================
// MACRO CONTROL
// ============================================================================

/**
 * A macro control with 0-8 parameter mappings.
 */
export interface MacroControl {
  /** Unique macro ID (0-7) */
  readonly id: number;
  /** Display name */
  readonly name: string;
  /** Current value (0-1) */
  readonly value: number;
  /** Default value */
  readonly default: number;
  /** Parameter mappings */
  readonly mappings: readonly MacroMapping[];
  /** Group/category for organization */
  readonly group?: string;
  /** Description tooltip */
  readonly description?: string;
  /** MIDI CC number */
  readonly ccNumber?: number;
  /** Whether this macro can be automated */
  readonly automatable: boolean;
}

/**
 * Options for creating a MacroControl.
 */
export interface MacroControlOptions {
  id: number;
  name?: string;
  default?: number;
  mappings?: readonly MacroMapping[];
  group?: string;
  description?: string;
  ccNumber?: number;
  automatable?: boolean;
}

/**
 * Creates a MacroControl.
 */
export function createMacroControl(options: MacroControlOptions): MacroControl {
  if (options.id < 0 || options.id > 7) {
    throw new Error('MacroControl id must be 0-7');
  }
  
  const defaultValue = options.default ?? 0;
  
  return Object.freeze({
    id: options.id,
    name: options.name ?? `Macro ${options.id + 1}`,
    value: Math.max(0, Math.min(1, defaultValue)),
    default: defaultValue,
    mappings: Object.freeze(options.mappings ?? []),
    ...(options.group !== undefined && { group: options.group }),
    ...(options.description !== undefined && { description: options.description }),
    ...(options.ccNumber !== undefined && { ccNumber: options.ccNumber }),
    automatable: options.automatable ?? true,
  });
}

/**
 * Sets macro control value.
 */
export function setMacroValue(macro: MacroControl, value: number): MacroControl {
  const clamped = Math.max(0, Math.min(1, value));
  if (clamped === macro.value) return macro;
  return Object.freeze({ ...macro, value: clamped });
}

/**
 * Resets macro to default value.
 */
export function resetMacro(macro: MacroControl): MacroControl {
  if (macro.value === macro.default) return macro;
  return Object.freeze({ ...macro, value: macro.default });
}

/**
 * Updates macro display name.
 */
export function setMacroName(macro: MacroControl, name: string): MacroControl {
  if (macro.name === name) return macro;
  return Object.freeze({ ...macro, name });
}

/**
 * Updates macro description.
 */
export function setMacroDescription(macro: MacroControl, description: string): MacroControl {
  if (macro.description === description) return macro;
  return Object.freeze({ ...macro, description });
}

/**
 * Adds a mapping to the macro.
 */
export function addMacroMapping(macro: MacroControl, mapping: MacroMapping): MacroControl {
  // Check if mapping already exists
  if (macro.mappings.some(m => m.targetId === mapping.targetId)) {
    return macro;
  }
  
  return Object.freeze({
    ...macro,
    mappings: Object.freeze([...macro.mappings, mapping]),
  });
}

/**
 * Removes a mapping from the macro by target ID.
 */
export function removeMacroMapping(macro: MacroControl, targetId: string): MacroControl {
  const newMappings = macro.mappings.filter(m => m.targetId !== targetId);
  if (newMappings.length === macro.mappings.length) return macro;
  
  return Object.freeze({
    ...macro,
    mappings: Object.freeze(newMappings),
  });
}

/**
 * Updates a specific mapping in the macro.
 */
export function updateMapping(
  macro: MacroControl,
  targetId: string,
  updates: Partial<MacroMappingOptions>
): MacroControl {
  const index = macro.mappings.findIndex(m => m.targetId === targetId);
  if (index === -1) return macro;
  
  const newMappings = [...macro.mappings];
  newMappings[index] = updateMacroMapping(newMappings[index]!, updates);
  
  return Object.freeze({
    ...macro,
    mappings: Object.freeze(newMappings),
  });
}

/**
 * Clears all mappings from the macro.
 */
export function clearMacroMappings(macro: MacroControl): MacroControl {
  if (macro.mappings.length === 0) return macro;
  return Object.freeze({
    ...macro,
    mappings: Object.freeze([]),
  });
}

/**
 * Gets a mapping by target ID.
 */
export function getMacroMapping(macro: MacroControl, targetId: string): MacroMapping | undefined {
  return macro.mappings.find(m => m.targetId === targetId);
}

/**
 * Checks if macro has any mappings.
 */
export function hasMacroMappings(macro: MacroControl): boolean {
  return macro.mappings.length > 0;
}

/**
 * Checks if macro has a specific mapping.
 */
export function hasMacroMapping(macro: MacroControl, targetId: string): boolean {
  return macro.mappings.some(m => m.targetId === targetId);
}

// ============================================================================
// MACRO PANEL
// ============================================================================

/**
 * A panel of 8 macro controls.
 */
export interface MacroPanel {
  /** 8 macro controls */
  readonly macros: readonly [
    MacroControl,
    MacroControl,
    MacroControl,
    MacroControl,
    MacroControl,
    MacroControl,
    MacroControl,
    MacroControl
  ];
  /** Active page (for multi-page setups) */
  readonly activePage: number;
  /** Total number of pages */
  readonly pageCount: number;
}

/**
 * Creates an empty MacroPanel with 8 macros.
 */
export function createMacroPanel(): MacroPanel {
  return Object.freeze({
    macros: Object.freeze([
      createMacroControl({ id: 0 }),
      createMacroControl({ id: 1 }),
      createMacroControl({ id: 2 }),
      createMacroControl({ id: 3 }),
      createMacroControl({ id: 4 }),
      createMacroControl({ id: 5 }),
      createMacroControl({ id: 6 }),
      createMacroControl({ id: 7 }),
    ]) as [MacroControl, MacroControl, MacroControl, MacroControl, MacroControl, MacroControl, MacroControl, MacroControl],
    activePage: 0,
    pageCount: 1,
  });
}

/**
 * Gets a macro by ID (0-7).
 */
export function getMacro(panel: MacroPanel, id: number): MacroControl {
  if (id < 0 || id > 7) {
    throw new Error('Macro ID must be 0-7');
  }
  return panel.macros[id]!;
}

/**
 * Updates a macro in the panel.
 */
export function updateMacro(panel: MacroPanel, macro: MacroControl): MacroPanel {
  if (macro.id < 0 || macro.id > 7) {
    throw new Error('Macro ID must be 0-7');
  }
  
  const newMacros = [...panel.macros];
  newMacros[macro.id] = macro;
  
  return Object.freeze({
    ...panel,
    macros: Object.freeze(newMacros) as typeof panel.macros,
  });
}

/**
 * Sets a macro value by ID.
 */
export function setMacroValueById(panel: MacroPanel, id: number, value: number): MacroPanel {
  const macro = getMacro(panel, id);
  const updated = setMacroValue(macro, value);
  return updateMacro(panel, updated);
}

/**
 * Resets all macros to default values.
 */
export function resetAllMacros(panel: MacroPanel): MacroPanel {
  let result = panel;
  for (let i = 0; i < 8; i++) {
    const macro = getMacro(result, i);
    result = updateMacro(result, resetMacro(macro));
  }
  return result;
}

/**
 * Switches to a different page.
 */
export function setActivePage(panel: MacroPanel, page: number): MacroPanel {
  if (page < 0 || page >= panel.pageCount) return panel;
  if (page === panel.activePage) return panel;
  return Object.freeze({ ...panel, activePage: page });
}

// ============================================================================
// MACRO SNAPSHOT
// ============================================================================

/**
 * A snapshot of macro values.
 */
export interface MacroSnapshot {
  /** Snapshot name */
  readonly name: string;
  /** Macro values [0-1] */
  readonly values: readonly [number, number, number, number, number, number, number, number];
  /** Timestamp */
  readonly timestamp: number;
}

/**
 * Creates a snapshot of current macro values.
 */
export function createMacroSnapshot(panel: MacroPanel, name: string = 'Snapshot'): MacroSnapshot {
  return Object.freeze({
    name,
    values: Object.freeze(panel.macros.map(m => m.value)) as readonly [number, number, number, number, number, number, number, number],
    timestamp: Date.now(),
  });
}

/**
 * Applies a snapshot to a macro panel.
 */
export function applyMacroSnapshot(panel: MacroPanel, snapshot: MacroSnapshot): MacroPanel {
  let result = panel;
  for (let i = 0; i < 8; i++) {
    result = setMacroValueById(result, i, snapshot.values[i]!);
  }
  return result;
}

/**
 * Morphs between two snapshots with interpolation.
 */
export function morphMacroSnapshots(
  panel: MacroPanel,
  from: MacroSnapshot,
  to: MacroSnapshot,
  t: number
): MacroPanel {
  const clampedT = Math.max(0, Math.min(1, t));
  let result = panel;
  
  for (let i = 0; i < 8; i++) {
    const fromValue = from.values[i]!;
    const toValue = to.values[i]!;
    const interpolated = fromValue + (toValue - fromValue) * clampedT;
    result = setMacroValueById(result, i, interpolated);
  }
  
  return result;
}

// ============================================================================
// MACRO RANDOMIZATION
// ============================================================================

/**
 * Randomizes a single macro value.
 */
export function randomizeMacro(macro: MacroControl, amount: number = 1): MacroControl {
  const random = Math.random() * amount;
  return setMacroValue(macro, random);
}

/**
 * Randomizes all macros in the panel.
 */
export function randomizeAllMacros(panel: MacroPanel, amount: number = 1): MacroPanel {
  let result = panel;
  for (let i = 0; i < 8; i++) {
    const macro = getMacro(result, i);
    result = updateMacro(result, randomizeMacro(macro, amount));
  }
  return result;
}

// ============================================================================
// MACRO LOCKING & LINKING
// ============================================================================

/**
 * Lock state for macros (prevents changes).
 */
export interface MacroLockState {
  readonly locked: readonly [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
}

/**
 * Creates an empty lock state (all unlocked).
 */
export function createMacroLockState(): MacroLockState {
  return Object.freeze({
    locked: Object.freeze([false, false, false, false, false, false, false, false]) as [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean],
  });
}

/**
 * Toggles lock state for a macro.
 */
export function toggleMacroLock(state: MacroLockState, id: number): MacroLockState {
  if (id < 0 || id > 7) {
    throw new Error('Macro ID must be 0-7');
  }
  
  const newLocked = [...state.locked];
  newLocked[id] = !newLocked[id]!;
  
  return Object.freeze({
    locked: Object.freeze(newLocked) as typeof state.locked,
  });
}

/**
 * Checks if a macro is locked.
 */
export function isMacroLocked(state: MacroLockState, id: number): boolean {
  if (id < 0 || id > 7) return false;
  return state.locked[id]!;
}

/**
 * Link state for macros (linked macros move together).
 */
export interface MacroLinkState {
  /** Groups of linked macro IDs */
  readonly links: readonly (readonly number[])[];
}

/**
 * Creates an empty link state (no links).
 */
export function createMacroLinkState(): MacroLinkState {
  return Object.freeze({
    links: Object.freeze([]),
  });
}

/**
 * Links two or more macros together.
 */
export function linkMacros(state: MacroLinkState, ids: readonly number[]): MacroLinkState {
  if (ids.length < 2) return state;
  
  // Validate IDs
  for (const id of ids) {
    if (id < 0 || id > 7) {
      throw new Error('Macro ID must be 0-7');
    }
  }
  
  // Remove these macros from existing links
  const filteredLinks = state.links.map(link => 
    link.filter(id => !ids.includes(id))
  ).filter(link => link.length >= 2);
  
  // Add new link
  const newLinks = [...filteredLinks, Object.freeze([...ids])];
  
  return Object.freeze({
    links: Object.freeze(newLinks),
  });
}

/**
 * Unlinks a macro from all link groups.
 */
export function unlinkMacro(state: MacroLinkState, id: number): MacroLinkState {
  if (id < 0 || id > 7) return state;
  
  const newLinks = state.links
    .map(link => link.filter(lid => lid !== id))
    .filter(link => link.length >= 2);
  
  return Object.freeze({
    links: Object.freeze(newLinks.map(link => Object.freeze(link))),
  });
}

/**
 * Gets the link group containing a macro ID.
 */
export function getMacroLinkGroup(state: MacroLinkState, id: number): readonly number[] | undefined {
  return state.links.find(link => link.includes(id));
}

/**
 * Checks if two macros are linked.
 */
export function areMacrosLinked(state: MacroLinkState, id1: number, id2: number): boolean {
  return state.links.some(link => link.includes(id1) && link.includes(id2));
}

// ============================================================================
// MACRO GROUPS
// ============================================================================

/**
 * A group of macros for organization.
 */
export interface MacroGroup {
  readonly name: string;
  readonly macroIds: readonly number[];
  readonly color?: string;
}

/**
 * Creates a macro group.
 */
export function createMacroGroup(name: string, macroIds: readonly number[], color?: string): MacroGroup {
  // Validate IDs
  for (const id of macroIds) {
    if (id < 0 || id > 7) {
      throw new Error('Macro ID must be 0-7');
    }
  }
  
  return Object.freeze({
    name,
    macroIds: Object.freeze([...macroIds]),
    ...(color !== undefined && { color }),
  });
}

// ============================================================================
// MACRO AUTOMATION
// ============================================================================

/**
 * Automation point for a macro.
 */
export interface MacroAutomationPoint {
  readonly time: number;  // In ticks
  readonly value: number; // 0-1
}

/**
 * Automation lane for a macro.
 */
export interface MacroAutomationLane {
  readonly macroId: number;
  readonly points: readonly MacroAutomationPoint[];
  readonly enabled: boolean;
}

/**
 * Creates an empty automation lane.
 */
export function createMacroAutomationLane(macroId: number): MacroAutomationLane {
  if (macroId < 0 || macroId > 7) {
    throw new Error('Macro ID must be 0-7');
  }
  
  return Object.freeze({
    macroId,
    points: Object.freeze([]),
    enabled: true,
  });
}

/**
 * Adds an automation point.
 */
export function addMacroAutomationPoint(
  lane: MacroAutomationLane,
  point: MacroAutomationPoint
): MacroAutomationLane {
  // Insert point in time-sorted order
  const newPoints = [...lane.points, point].sort((a, b) => a.time - b.time);
  
  return Object.freeze({
    ...lane,
    points: Object.freeze(newPoints),
  });
}

/**
 * Gets interpolated value at a specific time.
 */
export function getMacroAutomationValue(lane: MacroAutomationLane, time: number): number | undefined {
  if (!lane.enabled || lane.points.length === 0) return undefined;
  
  // Find surrounding points
  let before: MacroAutomationPoint | undefined;
  let after: MacroAutomationPoint | undefined;
  
  for (const point of lane.points) {
    if (point.time <= time) {
      before = point;
    } else {
      after = point;
      break;
    }
  }
  
  // Handle edge cases
  if (!before) return after!.value;
  if (!after) return before.value;
  
  // Linear interpolation
  const t = (time - before.time) / (after.time - before.time);
  return before.value + (after.value - before.value) * t;
}

// ============================================================================
// MACRO RECALL
// ============================================================================

/**
 * A preset for macros.
 */
export interface MacroPreset {
  readonly name: string;
  readonly description?: string;
  readonly macros: readonly MacroControl[];
  readonly timestamp: number;
}

/**
 * Creates a macro preset from current state.
 */
export function createMacroPreset(panel: MacroPanel, name: string, description?: string): MacroPreset {
  return Object.freeze({
    name,
    ...(description !== undefined && { description }),
    macros: Object.freeze([...panel.macros]),
    timestamp: Date.now(),
  });
}

/**
 * Applies a macro preset to a panel.
 */
export function applyMacroPreset(panel: MacroPanel, preset: MacroPreset): MacroPanel {
  let result = panel;
  for (const macro of preset.macros) {
    result = updateMacro(result, macro);
  }
  return result;
}

// ============================================================================
// MACRO VISUALIZATION
// ============================================================================

/**
 * Visualization data for a macro.
 */
export interface MacroVisualization {
  readonly macroId: number;
  readonly value: number;
  readonly normalized: number;
  readonly mappingCount: number;
  readonly color?: string;
}

/**
 * Gets visualization data for a macro.
 */
export function getMacroVisualization(macro: MacroControl, color?: string): MacroVisualization {
  return {
    macroId: macro.id,
    value: macro.value,
    normalized: macro.value, // Already 0-1
    mappingCount: macro.mappings.length,
    ...(color !== undefined && { color }),
  };
}

/**
 * Gets visualization data for all macros in a panel.
 */
export function getMacroPanelVisualization(panel: MacroPanel): readonly MacroVisualization[] {
  return panel.macros.map(macro => getMacroVisualization(macro));
}

// ============================================================================
// MACRO COMPARISON
// ============================================================================

/**
 * Compares two macro states.
 */
export interface MacroComparison {
  readonly changed: readonly number[];  // IDs of changed macros
  readonly maxDifference: number;       // Maximum absolute difference
  readonly totalDifference: number;     // Sum of absolute differences
}

/**
 * Compares two macro panels.
 */
export function compareMacroPanels(a: MacroPanel, b: MacroPanel): MacroComparison {
  const changed: number[] = [];
  let maxDifference = 0;
  let totalDifference = 0;
  
  for (let i = 0; i < 8; i++) {
    const aValue = a.macros[i]!.value;
    const bValue = b.macros[i]!.value;
    const diff = Math.abs(aValue - bValue);
    
    if (diff > 0.001) {  // Small epsilon to avoid floating point issues
      changed.push(i);
      maxDifference = Math.max(maxDifference, diff);
      totalDifference += diff;
    }
  }
  
  return {
    changed: Object.freeze(changed),
    maxDifference,
    totalDifference,
  };
}

// ============================================================================
// MACRO UNDO/REDO
// ============================================================================

/**
 * Macro history entry for undo/redo.
 */
export interface MacroHistoryEntry {
  readonly panel: MacroPanel;
  readonly timestamp: number;
  readonly description?: string;
}

/**
 * Creates a history entry.
 */
export function createMacroHistoryEntry(panel: MacroPanel, description?: string): MacroHistoryEntry {
  return Object.freeze({
    panel,
    timestamp: Date.now(),
    ...(description !== undefined && { description }),
  });
}
