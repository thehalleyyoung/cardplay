/**
 * @fileoverview Preset Compare System.
 * 
 * Provides A/B comparison functionality for presets, allowing users to
 * quickly switch between two presets to hear the differences.
 * 
 * @module @cardplay/core/ui/components/preset-compare
 */

import type { Preset } from '../../cards/presets';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Preset comparison state.
 */
export interface PresetCompareState {
  /** Preset A */
  readonly presetA?: Preset | undefined;
  /** Preset B */
  readonly presetB?: Preset | undefined;
  /** Currently active preset (A or B) */
  readonly activePreset: 'A' | 'B';
  /** Is comparison active */
  readonly isActive: boolean;
  /** Parameter differences */
  readonly differences?: readonly ParameterDifference[] | undefined;
  /** Comparison mode */
  readonly compareMode: CompareMode;
}

/**
 * Comparison mode.
 */
export type CompareMode = 
  | 'toggle'      // Manual toggle between A/B
  | 'auto'        // Auto-toggle every N seconds
  | 'crossfade';  // Smooth crossfade between A/B

/**
 * Parameter difference between two presets.
 */
export interface ParameterDifference {
  /** Parameter ID */
  readonly parameterId: string;
  /** Parameter name */
  readonly parameterName: string;
  /** Value in preset A */
  readonly valueA: unknown;
  /** Value in preset B */
  readonly valueB: unknown;
  /** Relative difference (0-1, where 1 is maximum difference) */
  readonly relativeDifference: number;
  /** Is this parameter identical in both presets */
  readonly isIdentical: boolean;
}

/**
 * Preset comparison configuration.
 */
export interface PresetCompareConfig {
  /** Auto-toggle interval in milliseconds (for auto mode) */
  readonly autoToggleInterval: number;
  /** Crossfade duration in milliseconds (for crossfade mode) */
  readonly crossfadeDuration: number;
  /** Show only different parameters */
  readonly showOnlyDifferences: boolean;
  /** Minimum relative difference to highlight (0-1) */
  readonly differenceThreshold: number;
  /** Callback when preset A changes */
  readonly onPresetAChange?: (preset: Preset | undefined) => void;
  /** Callback when preset B changes */
  readonly onPresetBChange?: (preset: Preset | undefined) => void;
  /** Callback when active preset changes */
  readonly onActivePresetChange?: (activePreset: 'A' | 'B') => void;
  /** Callback when compare mode changes */
  readonly onCompareModeChange?: (mode: CompareMode) => void;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Create initial preset compare state.
 */
export function createPresetCompareState(): PresetCompareState {
  return Object.freeze({
    activePreset: 'A',
    isActive: false,
    compareMode: 'toggle',
  });
}

/**
 * Set preset A.
 */
export function setPresetA(
  state: PresetCompareState,
  preset: Preset | undefined
): PresetCompareState {
  const differences = preset && state.presetB 
    ? calculateDifferences(preset, state.presetB)
    : undefined;

  return Object.freeze({
    ...state,
    presetA: preset,
    differences,
    isActive: Boolean(preset && state.presetB),
  });
}

/**
 * Set preset B.
 */
export function setPresetB(
  state: PresetCompareState,
  preset: Preset | undefined
): PresetCompareState {
  const differences = state.presetA && preset
    ? calculateDifferences(state.presetA, preset)
    : undefined;

  return Object.freeze({
    ...state,
    presetB: preset,
    differences,
    isActive: Boolean(state.presetA && preset),
  });
}

/**
 * Toggle active preset.
 */
export function toggleActivePreset(state: PresetCompareState): PresetCompareState {
  return Object.freeze({
    ...state,
    activePreset: state.activePreset === 'A' ? 'B' : 'A',
  });
}

/**
 * Set active preset directly.
 */
export function setActivePreset(
  state: PresetCompareState,
  activePreset: 'A' | 'B'
): PresetCompareState {
  return Object.freeze({
    ...state,
    activePreset,
  });
}

/**
 * Set comparison mode.
 */
export function setCompareMode(
  state: PresetCompareState,
  compareMode: CompareMode
): PresetCompareState {
  return Object.freeze({
    ...state,
    compareMode,
  });
}

/**
 * Swap presets A and B.
 */
export function swapPresets(state: PresetCompareState): PresetCompareState {
  return Object.freeze({
    ...state,
    presetA: state.presetB,
    presetB: state.presetA,
    activePreset: state.activePreset === 'A' ? 'B' : 'A',
  });
}

/**
 * Clear comparison.
 */
export function clearComparison(state: PresetCompareState): PresetCompareState {
  return Object.freeze({
    activePreset: 'A',
    isActive: false,
    compareMode: state.compareMode,
  });
}

// ============================================================================
// PARAMETER DIFFERENCE CALCULATION
// ============================================================================

/**
 * Calculate parameter differences between two presets.
 */
export function calculateDifferences(
  presetA: Preset,
  presetB: Preset
): readonly ParameterDifference[] {
  const differences: ParameterDifference[] = [];
  const allParamIds = new Set([
    ...Object.keys(presetA.params),
    ...Object.keys(presetB.params),
  ]);

  for (const paramId of allParamIds) {
    const valueA = presetA.params[paramId];
    const valueB = presetB.params[paramId];
    const isIdentical = deepEqual(valueA, valueB);
    const relativeDifference = calculateRelativeDifference(valueA, valueB);

    differences.push({
      parameterId: paramId,
      parameterName: formatParameterName(paramId),
      valueA,
      valueB,
      relativeDifference,
      isIdentical,
    });
  }

  // Sort by relative difference (highest first)
  differences.sort((a, b) => b.relativeDifference - a.relativeDifference);

  return Object.freeze(differences);
}

/**
 * Calculate relative difference between two parameter values.
 */
function calculateRelativeDifference(valueA: unknown, valueB: unknown): number {
  // Identical values
  if (deepEqual(valueA, valueB)) {
    return 0;
  }

  // Numeric values
  if (typeof valueA === 'number' && typeof valueB === 'number') {
    const max = Math.max(Math.abs(valueA), Math.abs(valueB), 1);
    return Math.abs(valueA - valueB) / max;
  }

  // Boolean values (completely different or identical)
  if (typeof valueA === 'boolean' && typeof valueB === 'boolean') {
    return 1;
  }

  // String/enum values (completely different or identical)
  if (typeof valueA === 'string' && typeof valueB === 'string') {
    return 1;
  }

  // Arrays
  if (Array.isArray(valueA) && Array.isArray(valueB)) {
    if (valueA.length !== valueB.length) {
      return 1;
    }
    
    let diffSum = 0;
    for (let i = 0; i < valueA.length; i++) {
      diffSum += calculateRelativeDifference(valueA[i], valueB[i]);
    }
    return Math.min(1, diffSum / valueA.length);
  }

  // Objects
  if (typeof valueA === 'object' && valueA !== null && typeof valueB === 'object' && valueB !== null) {
    const keysA = Object.keys(valueA);
    const keysB = Object.keys(valueB);
    const allKeys = new Set([...keysA, ...keysB]);
    
    let diffSum = 0;
    for (const key of allKeys) {
      diffSum += calculateRelativeDifference(
        (valueA as Record<string, unknown>)[key],
        (valueB as Record<string, unknown>)[key]
      );
    }
    return Math.min(1, diffSum / allKeys.size);
  }

  // Different types - maximum difference
  return 1;
}

/**
 * Deep equality check.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a === undefined || b === undefined) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, i) => deepEqual(val, b[i]));
    }

    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => 
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  return false;
}

/**
 * Format parameter ID to human-readable name.
 */
function formatParameterName(paramId: string): string {
  // Convert camelCase to Title Case
  return paramId
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Filter differences by threshold.
 */
export function filterDifferencesByThreshold(
  differences: readonly ParameterDifference[],
  threshold: number,
  showOnlyDifferences: boolean
): readonly ParameterDifference[] {
  return differences.filter(diff => {
    if (showOnlyDifferences && diff.isIdentical) {
      return false;
    }
    return diff.relativeDifference >= threshold || diff.relativeDifference === 0;
  });
}

// ============================================================================
// PRESET COMPARE CSS
// ============================================================================

/**
 * CSS for preset compare component.
 */
export const PRESET_COMPARE_CSS = `
.preset-compare {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.preset-compare__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.preset-compare__title {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--color-text);
}

.preset-compare__mode-selector {
  display: flex;
  gap: var(--spacing-xs);
}

.preset-compare__mode-button {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all 150ms;
}

.preset-compare__mode-button:hover {
  background: var(--color-surface-hover);
}

.preset-compare__mode-button--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.preset-compare__slots {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--spacing-md);
  align-items: center;
}

.preset-compare__slot {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  transition: all 150ms;
}

.preset-compare__slot--active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-alpha);
}

.preset-compare__slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preset-compare__slot-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  font-weight: var(--font-bold);
  font-size: var(--text-xs);
}

.preset-compare__slot-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.preset-compare__slot-button {
  padding: var(--spacing-xs);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all 150ms;
}

.preset-compare__slot-button:hover {
  background: var(--color-surface-hover);
}

.preset-compare__slot-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.preset-compare__slot--empty {
  opacity: 0.5;
}

.preset-compare__preset-name {
  font-size: var(--text-md);
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.preset-compare__preset-info {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.preset-compare__preset-badge {
  display: inline-block;
  padding: 2px var(--spacing-xs);
  background: var(--color-blue-alpha);
  color: var(--color-blue);
  border-radius: var(--radius-xs);
  font-size: 10px;
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preset-compare__swap-button {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 150ms;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preset-compare__swap-button:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
  transform: rotate(180deg);
}

.preset-compare__controls {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
}

.preset-compare__toggle-button {
  padding: var(--spacing-md) var(--spacing-xl);
  border: 2px solid var(--color-primary);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-radius: var(--radius-md);
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all 150ms;
  min-width: 120px;
}

.preset-compare__toggle-button:hover {
  background: var(--color-primary-hover);
  transform: scale(1.05);
}

.preset-compare__toggle-button:active {
  transform: scale(0.95);
}

.preset-compare__toggle-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.preset-compare__differences {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 400px;
  overflow-y: auto;
}

.preset-compare__differences-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.preset-compare__differences-count {
  color: var(--color-text-muted);
}

.preset-compare__difference-item {
  display: grid;
  grid-template-columns: 200px 1fr auto 1fr;
  gap: var(--spacing-sm);
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  border-left: 3px solid transparent;
}

.preset-compare__difference-item--significant {
  border-left-color: var(--color-orange);
}

.preset-compare__difference-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.preset-compare__difference-value {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.preset-compare__difference-arrow {
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--text-xs);
}

.preset-compare__difference-meter {
  width: 100%;
  height: 4px;
  background: var(--color-surface);
  border-radius: var(--radius-xs);
  overflow: hidden;
}

.preset-compare__difference-meter-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 300ms;
}

.preset-compare__empty {
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.preset-compare__auto-toggle-progress {
  height: 2px;
  background: var(--color-surface);
  border-radius: var(--radius-xs);
  overflow: hidden;
}

.preset-compare__auto-toggle-progress-bar {
  height: 100%;
  background: var(--color-primary);
  animation: preset-compare-auto-progress 3s linear infinite;
}

@keyframes preset-compare-auto-progress {
  from { width: 0%; }
  to { width: 100%; }
}
`;

/**
 * Apply preset compare CSS to document.
 */
export function applyPresetCompareCSS(): void {
  const styleId = 'cardplay-preset-compare-css';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = PRESET_COMPARE_CSS;
    document.head.appendChild(style);
  }
}
