/**
 * @fileoverview Phrase Adaptation Settings Component (G046)
 * 
 * Provides UI for configuring phrase adaptation settings when dropping phrases:
 * - Adaptation mode (transpose/chord-tone/scale-degree/voice-leading)
 * - Preserve rhythm toggle
 * - Preserve contour toggle
 * - Velocity scaling
 * - Voice leading weight
 * 
 * Settings persist per board or per phrase category.
 * 
 * @module @cardplay/ui/components/phrase-adaptation-settings
 */

import type { AdaptationOptions, AdaptationMode } from '../../cards/phrase-adapter';
import { DEFAULT_ADAPTATION_OPTIONS } from '../../cards/phrase-adapter';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Adaptation settings state
 */
export interface AdaptationSettingsState {
  /** Current adaptation mode */
  readonly mode: AdaptationMode;
  /** Preserve rhythm exactly */
  readonly preserveRhythm: boolean;
  /** Preserve contour (relative motion) */
  readonly preserveContour: boolean;
  /** Octave range constraints */
  readonly octaveRange: { min: number; max: number } | null;
  /** Velocity scaling factor (0.5-2.0) */
  readonly velocityScale: number;
  /** Preserve passing tones */
  readonly preservePassingTones: boolean;
  /** Voice leading smoothness weight (0-1) */
  readonly voiceLeadingWeight: number;
}

/**
 * Adaptation settings per phrase category (G047)
 */
export interface CategoryAdaptationSettings {
  /** Settings per category */
  [category: string]: Partial<AdaptationSettingsState>;
}

/**
 * Adaptation settings per board (G047)
 */
export interface BoardAdaptationSettings {
  /** Default settings for board */
  default: AdaptationSettingsState;
  /** Per-category overrides */
  perCategory: CategoryAdaptationSettings;
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

/**
 * Create default adaptation settings state
 */
export function createDefaultAdaptationSettings(): AdaptationSettingsState {
  return {
    mode: DEFAULT_ADAPTATION_OPTIONS.mode,
    preserveRhythm: DEFAULT_ADAPTATION_OPTIONS.preserveRhythm,
    preserveContour: DEFAULT_ADAPTATION_OPTIONS.preserveContour,
    octaveRange: null,
    velocityScale: DEFAULT_ADAPTATION_OPTIONS.velocityScale,
    preservePassingTones: DEFAULT_ADAPTATION_OPTIONS.preservePassingTones,
    voiceLeadingWeight: DEFAULT_ADAPTATION_OPTIONS.voiceLeadingWeight,
  };
}

/**
 * Convert settings state to adaptation options
 */
export function settingsToOptions(settings: AdaptationSettingsState): AdaptationOptions {
  const options: AdaptationOptions = {
    mode: settings.mode,
    preserveRhythm: settings.preserveRhythm,
    preserveContour: settings.preserveContour,
    velocityScale: settings.velocityScale,
    preservePassingTones: settings.preservePassingTones,
    voiceLeadingWeight: settings.voiceLeadingWeight,
  };
  
  // Add octaveRange only if not null
  if (settings.octaveRange) {
    return { ...options, octaveRange: settings.octaveRange };
  }
  
  return options;
}

// ============================================================================
// PERSISTENCE (G047)
// ============================================================================

const STORAGE_KEY_PREFIX = 'cardplay.phraseAdaptation.';

/**
 * Load adaptation settings for a board
 */
export function loadBoardAdaptationSettings(boardId: string): BoardAdaptationSettings {
  const key = `${STORAGE_KEY_PREFIX}${boardId}`;
  
  if (typeof localStorage === 'undefined') {
    return {
      default: createDefaultAdaptationSettings(),
      perCategory: {},
    };
  }
  
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        default: { ...createDefaultAdaptationSettings(), ...parsed.default },
        perCategory: parsed.perCategory || {},
      };
    }
  } catch (e) {
    console.warn('Failed to load phrase adaptation settings:', e);
  }
  
  return {
    default: createDefaultAdaptationSettings(),
    perCategory: {},
  };
}

/**
 * Save adaptation settings for a board
 */
export function saveBoardAdaptationSettings(
  boardId: string,
  settings: BoardAdaptationSettings
): void {
  if (typeof localStorage === 'undefined') return;
  
  const key = `${STORAGE_KEY_PREFIX}${boardId}`;
  
  try {
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save phrase adaptation settings:', e);
  }
}

/**
 * Get adaptation settings for a specific category and board
 */
export function getAdaptationSettings(
  boardId: string,
  category?: string
): AdaptationSettingsState {
  const boardSettings = loadBoardAdaptationSettings(boardId);
  
  if (category && boardSettings.perCategory[category]) {
    return {
      ...boardSettings.default,
      ...boardSettings.perCategory[category],
    };
  }
  
  return boardSettings.default;
}

/**
 * Update adaptation settings for a board
 */
export function updateAdaptationSettings(
  boardId: string,
  settings: Partial<AdaptationSettingsState>,
  category?: string
): void {
  const boardSettings = loadBoardAdaptationSettings(boardId);
  
  if (category) {
    // Update category-specific settings
    boardSettings.perCategory[category] = {
      ...(boardSettings.perCategory[category] || {}),
      ...settings,
    };
  } else {
    // Update default settings
    boardSettings.default = {
      ...boardSettings.default,
      ...settings,
    };
  }
  
  saveBoardAdaptationSettings(boardId, boardSettings);
}

// ============================================================================
// UI COMPONENT
// ============================================================================

/**
 * Create adaptation settings panel (G046)
 */
export function createAdaptationSettingsPanel(
  boardId: string,
  category?: string,
  onChange?: (settings: AdaptationSettingsState) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'phrase-adaptation-settings';
  container.style.cssText = `
    padding: 16px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;
  
  let settings = getAdaptationSettings(boardId, category);
  
  const updateSettings = (updates: Partial<AdaptationSettingsState>) => {
    settings = { ...settings, ...updates };
    updateAdaptationSettings(boardId, updates, category);
    onChange?.(settings);
  };
  
  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    font-weight: 600;
    color: white;
    margin-bottom: 4px;
    font-size: 13px;
  `;
  header.textContent = category 
    ? `Phrase Adaptation (${category})` 
    : 'Phrase Adaptation Settings';
  container.appendChild(header);
  
  // Adaptation mode selector
  const modeGroup = createModeSelector(settings.mode, (mode) => {
    updateSettings({ mode });
  });
  container.appendChild(modeGroup);
  
  // Toggle switches
  container.appendChild(createToggle(
    'Preserve Rhythm',
    settings.preserveRhythm,
    (value) => updateSettings({ preserveRhythm: value })
  ));
  
  container.appendChild(createToggle(
    'Preserve Contour',
    settings.preserveContour,
    (value) => updateSettings({ preserveContour: value })
  ));
  
  container.appendChild(createToggle(
    'Preserve Passing Tones',
    settings.preservePassingTones,
    (value) => updateSettings({ preservePassingTones: value })
  ));
  
  // Velocity scale slider
  container.appendChild(createSlider(
    'Velocity Scale',
    settings.velocityScale,
    0.5,
    2.0,
    0.1,
    (value) => updateSettings({ velocityScale: value })
  ));
  
  // Voice leading weight slider (only for voice-leading mode)
  if (settings.mode === 'voice-leading') {
    container.appendChild(createSlider(
      'Voice Leading Weight',
      settings.voiceLeadingWeight,
      0,
      1,
      0.1,
      (value) => updateSettings({ voiceLeadingWeight: value })
    ));
  }
  
  return container;
}

/**
 * Create adaptation mode selector
 */
function createModeSelector(
  current: AdaptationMode,
  onChange: (mode: AdaptationMode) => void
): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 4px;
  `;
  
  const label = document.createElement('label');
  label.style.cssText = `
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  `;
  label.textContent = 'Adaptation Mode';
  container.appendChild(label);
  
  const select = document.createElement('select');
  select.style.cssText = `
    padding: 6px 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    color: white;
    font-size: 12px;
    cursor: pointer;
  `;
  
  const modes: { value: AdaptationMode; label: string; description: string }[] = [
    { value: 'transpose', label: 'Transpose', description: 'Simple transposition' },
    { value: 'chord-tone', label: 'Chord Tone', description: 'Snap to chord tones' },
    { value: 'scale-degree', label: 'Scale Degree', description: 'Preserve scale degrees' },
    { value: 'voice-leading', label: 'Voice Leading', description: 'Smooth voice leading' },
    { value: 'rhythm-only', label: 'Rhythm Only', description: 'Keep rhythm, new pitches' },
  ];
  
  modes.forEach(mode => {
    const option = document.createElement('option');
    option.value = mode.value;
    option.textContent = `${mode.label} — ${mode.description}`;
    option.selected = mode.value === current;
    select.appendChild(option);
  });
  
  select.addEventListener('change', () => {
    onChange(select.value as AdaptationMode);
  });
  
  container.appendChild(select);
  return container;
}

/**
 * Create toggle switch
 */
function createToggle(
  label: string,
  checked: boolean,
  onChange: (value: boolean) => void
): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;
  checkbox.style.cssText = `
    cursor: pointer;
  `;
  checkbox.addEventListener('change', () => {
    onChange(checkbox.checked);
  });
  
  const labelEl = document.createElement('label');
  labelEl.style.cssText = `
    font-size: 12px;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
  `;
  labelEl.textContent = label;
  labelEl.addEventListener('click', () => {
    checkbox.checked = !checkbox.checked;
    onChange(checkbox.checked);
  });
  
  container.appendChild(checkbox);
  container.appendChild(labelEl);
  return container;
}

/**
 * Create slider control
 */
function createSlider(
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
  onChange: (value: number) => void
): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 4px;
  `;
  
  const headerRow = document.createElement('div');
  headerRow.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  
  const labelEl = document.createElement('label');
  labelEl.style.cssText = `
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  `;
  labelEl.textContent = label;
  
  const valueDisplay = document.createElement('span');
  valueDisplay.style.cssText = `
    font-size: 11px;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 600;
  `;
  valueDisplay.textContent = value.toFixed(1);
  
  headerRow.appendChild(labelEl);
  headerRow.appendChild(valueDisplay);
  container.appendChild(headerRow);
  
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(min);
  slider.max = String(max);
  slider.step = String(step);
  slider.value = String(value);
  slider.style.cssText = `
    width: 100%;
    cursor: pointer;
  `;
  
  slider.addEventListener('input', () => {
    const newValue = parseFloat(slider.value);
    valueDisplay.textContent = newValue.toFixed(1);
    onChange(newValue);
  });
  
  container.appendChild(slider);
  return container;
}

/**
 * Create compact adaptation settings popover
 */
export function createAdaptationPopover(
  boardId: string,
  category: string | undefined,
  anchorEl: HTMLElement,
  onChange?: (settings: AdaptationSettingsState) => void
): HTMLElement {
  const popover = document.createElement('div');
  popover.className = 'phrase-adaptation-popover';
  popover.style.cssText = `
    position: absolute;
    z-index: 1000;
    background: rgba(20, 20, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    min-width: 280px;
    max-width: 320px;
  `;
  
  // Position near anchor
  const rect = anchorEl.getBoundingClientRect();
  popover.style.top = `${rect.bottom + 8}px`;
  popover.style.left = `${rect.left}px`;
  
  const panel = createAdaptationSettingsPanel(boardId, category, onChange);
  popover.appendChild(panel);
  
  // Click outside to close
  const closeHandler = (e: MouseEvent) => {
    if (!popover.contains(e.target as Node)) {
      popover.remove();
      document.removeEventListener('click', closeHandler);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeHandler);
  }, 100);
  
  return popover;
}
