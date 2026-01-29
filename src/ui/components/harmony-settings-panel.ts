/**
 * @fileoverview Harmony Settings Panel (G019-G020)
 * 
 * UI component for toggling harmony display options:
 * - Show harmony colors (chord tones/scale tones/out-of-key)
 * - Show roman numerals in chord display
 * - Current key signature selector
 * - Current chord selector
 * 
 * Integrates with board settings store for persistence.
 * 
 * @module @cardplay/ui/components/harmony-settings-panel
 */

import { getBoardSettings, updateHarmonySettings, subscribeBoardSettings } from '../../boards/settings/store';
import type { HarmonySettings } from '../../boards/settings/types';

// ============================================================================
// TYPES
// ============================================================================

export interface HarmonySettingsPanelOptions {
  /** Board ID these settings apply to */
  boardId: string;
  /** Callback when settings change */
  onChange?: (settings: HarmonySettings) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Creates a harmony settings panel for a board
 */
export function createHarmonySettingsPanel(
  options: HarmonySettingsPanelOptions
): {
  element: HTMLElement;
  destroy: () => void;
} {
  const container = document.createElement('div');
  container.className = 'harmony-settings-panel';
  
  // Get current settings
  const boardSettings = getBoardSettings(options.boardId);
  const settings = boardSettings.harmony || {
    showHarmonyColors: false,
    showRomanNumerals: false,
    currentKey: 'C',
    currentChord: null,
  };
  
  // Create toggles section
  const togglesSection = createTogglesSection(options.boardId, settings);
  container.appendChild(togglesSection);
  
  // Create key/chord selectors section
  const selectorsSection = createSelectorsSection(options.boardId, settings);
  container.appendChild(selectorsSection);
  
  // Subscribe to settings changes
  const unsubscribe = subscribeBoardSettings((boardId, updatedSettings) => {
    if (boardId === options.boardId && updatedSettings.harmony) {
      updateUI(updatedSettings.harmony);
      options.onChange?.(updatedSettings.harmony);
    }
  });
  
  function updateUI(newSettings: HarmonySettings) {
    // Update checkbox states
    const harmonyColorsCheckbox = container.querySelector('#harmony-colors-toggle') as HTMLInputElement;
    const romanNumeralsCheckbox = container.querySelector('#roman-numerals-toggle') as HTMLInputElement;
    
    if (harmonyColorsCheckbox) {
      harmonyColorsCheckbox.checked = newSettings.showHarmonyColors;
    }
    if (romanNumeralsCheckbox) {
      romanNumeralsCheckbox.checked = newSettings.showRomanNumerals;
    }
  }
  
  function destroy() {
    // Unsubscribe from settings changes
    unsubscribe();
  }
  
  return { element: container, destroy };
}

// ============================================================================
// UI SECTIONS
// ============================================================================

/**
 * Creates the toggles section (harmony colors, roman numerals)
 */
function createTogglesSection(boardId: string, settings: HarmonySettings): HTMLElement {
  const section = document.createElement('div');
  section.className = 'harmony-settings-toggles';
  
  // G019: Harmony Colors Toggle
  const harmonyColorsToggle = createToggle({
    id: 'harmony-colors-toggle',
    label: 'Show Harmony Colors',
    description: 'Color code notes by harmony function (chord tones, scale tones, chromatic)',
    checked: settings.showHarmonyColors,
    onChange: (checked) => {
      updateHarmonySettings(boardId, { showHarmonyColors: checked });
    }
  });
  section.appendChild(harmonyColorsToggle);
  
  // G020: Roman Numerals Toggle
  const romanNumeralsToggle = createToggle({
    id: 'roman-numerals-toggle',
    label: 'Show Roman Numerals',
    description: 'Display roman numeral analysis (I, IV, V, etc.) instead of chord symbols',
    checked: settings.showRomanNumerals,
    onChange: (checked) => {
      updateHarmonySettings(boardId, { showRomanNumerals: checked });
    }
  });
  section.appendChild(romanNumeralsToggle);
  
  return section;
}

/**
 * Creates the key/chord selectors section
 */
function createSelectorsSection(boardId: string, settings: HarmonySettings): HTMLElement {
  const section = document.createElement('div');
  section.className = 'harmony-settings-selectors';
  
  // Key selector
  const keySelector = createKeySelector({
    label: 'Key Signature',
    currentKey: settings.currentKey || 'C',
    onChange: (key) => {
      updateHarmonySettings(boardId, { currentKey: key });
    }
  });
  section.appendChild(keySelector);
  
  return section;
}

// ============================================================================
// UI PRIMITIVES
// ============================================================================

interface ToggleOptions {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Creates a toggle checkbox with label
 */
function createToggle(options: ToggleOptions): HTMLElement {
  const container = document.createElement('div');
  container.className = 'harmony-toggle-item';
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = options.id;
  checkbox.checked = options.checked;
  checkbox.addEventListener('change', () => {
    options.onChange(checkbox.checked);
  });
  
  const label = document.createElement('label');
  label.htmlFor = options.id;
  label.textContent = options.label;
  
  const labelContainer = document.createElement('div');
  labelContainer.className = 'harmony-toggle-label';
  
  labelContainer.appendChild(checkbox);
  labelContainer.appendChild(label);
  container.appendChild(labelContainer);
  
  if (options.description) {
    const desc = document.createElement('div');
    desc.className = 'harmony-toggle-description';
    desc.textContent = options.description;
    container.appendChild(desc);
  }
  
  return container;
}

interface KeySelectorOptions {
  label: string;
  currentKey: string;
  onChange: (key: string) => void;
}

/**
 * Creates a key signature selector
 */
function createKeySelector(options: KeySelectorOptions): HTMLElement {
  const container = document.createElement('div');
  container.className = 'harmony-key-selector';
  
  const label = document.createElement('label');
  label.textContent = options.label;
  label.className = 'harmony-selector-label';
  
  const select = document.createElement('select');
  select.className = 'harmony-key-select';
  
  // Major keys
  const majorKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
  majorKeys.forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = `${key} major`;
    option.selected = key === options.currentKey;
    select.appendChild(option);
  });
  
  // Minor keys
  const minorKeys = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];
  minorKeys.forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = `${key.replace('m', '')} minor`;
    option.selected = key === options.currentKey;
    select.appendChild(option);
  });
  
  select.addEventListener('change', () => {
    options.onChange(select.value);
  });
  
  container.appendChild(label);
  container.appendChild(select);
  
  return container;
}

// ============================================================================
// STYLING
// ============================================================================

const HARMONY_SETTINGS_STYLES = `
.harmony-settings-panel {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.harmony-settings-toggles {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.harmony-toggle-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.harmony-toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.harmony-toggle-label input[type="checkbox"] {
  cursor: pointer;
}

.harmony-toggle-label label {
  cursor: pointer;
  user-select: none;
  font-weight: 500;
}

.harmony-toggle-description {
  font-size: 12px;
  color: var(--text-secondary, #888);
  margin-left: 24px;
}

.harmony-settings-selectors {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color, #333);
}

.harmony-key-selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.harmony-selector-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary, #fff);
}

.harmony-key-select {
  padding: 6px 8px;
  background: var(--input-bg, #222);
  border: 1px solid var(--border-color, #333);
  border-radius: 4px;
  color: var(--text-primary, #fff);
  cursor: pointer;
}

.harmony-key-select:hover {
  border-color: var(--accent-color, #4a9eff);
}

.harmony-key-select:focus {
  outline: 2px solid var(--accent-color, #4a9eff);
  outline-offset: 1px;
}
`;

/**
 * Injects harmony settings panel styles (idempotent)
 */
export function injectHarmonySettingsStyles(): void {
  const id = 'harmony-settings-panel-styles';
  if (document.getElementById(id)) return;
  
  const style = document.createElement('style');
  style.id = id;
  style.textContent = HARMONY_SETTINGS_STYLES;
  document.head.appendChild(style);
}

// Auto-inject styles when module loads
if (typeof document !== 'undefined') {
  injectHarmonySettingsStyles();
}
