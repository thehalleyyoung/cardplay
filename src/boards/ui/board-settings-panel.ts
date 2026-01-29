/**
 * @fileoverview Board Settings Panel
 * 
 * Provides UI for adjusting board-specific settings including theme, visual density,
 * hex/decimal display mode, and other per-board preferences.
 * 
 * Phase J037-J053 implementation - Board theme picker and visual density settings.
 * 
 * @module @cardplay/boards/ui/board-settings-panel
 */

import { getBoardStateStore } from '../store/store';
import { getBoardRegistry } from '../registry';
import { applyBoardTheme } from './theme-applier';

export interface BoardSettingsConfig {
  boardId: string;
  themeVariant?: 'dark' | 'light' | 'high-contrast';
  visualDensity?: 'compact' | 'comfortable' | 'spacious';
  hexDisplayMode?: boolean; // For tracker boards
  showHarmonyColors?: boolean; // For harmony-enabled boards
  autoSaveEnabled?: boolean;
}

/**
 * Creates a board settings panel.
 */
export function createBoardSettingsPanel(config: BoardSettingsConfig): HTMLElement {
  const container = document.createElement('div');
  container.className = 'board-settings-panel';
  container.setAttribute('data-board-id', config.boardId);
  
  // Header
  const header = document.createElement('div');
  header.className = 'settings-header';
  header.innerHTML = `
    <h3>Board Settings</h3>
    <button class="settings-close-btn" aria-label="Close settings">×</button>
  `;
  
  // Content
  const content = document.createElement('div');
  content.className = 'settings-content';
  
  // Theme section
  const themeSection = createThemeSection(config);
  content.appendChild(themeSection);
  
  // Visual density section
  const densitySection = createDensitySection(config);
  content.appendChild(densitySection);
  
  // Display mode section (conditional based on board type)
  const displaySection = createDisplayModeSection(config);
  content.appendChild(displaySection);
  
  // Other settings
  const otherSection = createOtherSettingsSection(config);
  content.appendChild(otherSection);
  
  container.appendChild(header);
  container.appendChild(content);
  
  // Wire up close button
  const closeBtn = header.querySelector('.settings-close-btn');
  closeBtn?.addEventListener('click', () => {
    container.remove();
  });
  
  // Apply styles
  injectStyles();
  
  return container;
}

/**
 * Creates the theme selection section.
 */
function createThemeSection(config: BoardSettingsConfig): HTMLElement {
  const section = document.createElement('div');
  section.className = 'settings-section';
  
  const currentVariant = config.themeVariant || 'dark';
  
  section.innerHTML = `
    <h4>Theme</h4>
    <div class="theme-options">
      <label class="theme-option ${currentVariant === 'dark' ? 'active' : ''}">
        <input type="radio" name="theme" value="dark" ${currentVariant === 'dark' ? 'checked' : ''}>
        <span class="theme-preview theme-dark"></span>
        <span class="theme-label">Dark</span>
      </label>
      <label class="theme-option ${currentVariant === 'light' ? 'active' : ''}">
        <input type="radio" name="theme" value="light" ${currentVariant === 'light' ? 'checked' : ''}>
        <span class="theme-preview theme-light"></span>
        <span class="theme-label">Light</span>
      </label>
      <label class="theme-option ${currentVariant === 'high-contrast' ? 'active' : ''}">
        <input type="radio" name="theme" value="high-contrast" ${currentVariant === 'high-contrast' ? 'checked' : ''}>
        <span class="theme-preview theme-high-contrast"></span>
        <span class="theme-label">High Contrast</span>
      </label>
    </div>
  `;
  
  // Wire up theme change
  const options = section.querySelectorAll('input[name="theme"]');
  options.forEach(option => {
    option.addEventListener('change', (e) => {
      const variant = (e.target as HTMLInputElement).value as 'dark' | 'light' | 'high-contrast';
      applyThemeVariant(config.boardId, variant);
    });
  });
  
  return section;
}

/**
 * Creates the visual density section.
 */
function createDensitySection(config: BoardSettingsConfig): HTMLElement {
  const section = document.createElement('div');
  section.className = 'settings-section';
  
  const currentDensity = config.visualDensity || 'comfortable';
  
  section.innerHTML = `
    <h4>Visual Density</h4>
    <p class="setting-description">Controls spacing and row height in editors</p>
    <div class="density-options">
      <label class="density-option ${currentDensity === 'compact' ? 'active' : ''}">
        <input type="radio" name="density" value="compact" ${currentDensity === 'compact' ? 'checked' : ''}>
        <span class="density-label">Compact</span>
      </label>
      <label class="density-option ${currentDensity === 'comfortable' ? 'active' : ''}">
        <input type="radio" name="density" value="comfortable" ${currentDensity === 'comfortable' ? 'checked' : ''}>
        <span class="density-label">Comfortable</span>
      </label>
      <label class="density-option ${currentDensity === 'spacious' ? 'active' : ''}">
        <input type="radio" name="density" value="spacious" ${currentDensity === 'spacious' ? 'checked' : ''}>
        <span class="density-label">Spacious</span>
      </label>
    </div>
  `;
  
  // Wire up density change
  const options = section.querySelectorAll('input[name="density"]');
  options.forEach(option => {
    option.addEventListener('change', (e) => {
      const density = (e.target as HTMLInputElement).value as 'compact' | 'comfortable' | 'spacious';
      applyVisualDensity(config.boardId, density);
    });
  });
  
  return section;
}

/**
 * Creates the display mode section.
 */
function createDisplayModeSection(config: BoardSettingsConfig): HTMLElement {
  const section = document.createElement('div');
  section.className = 'settings-section';
  
  section.innerHTML = `
    <h4>Display Options</h4>
    <label class="setting-toggle">
      <input type="checkbox" name="hex-mode" ${config.hexDisplayMode ? 'checked' : ''}>
      <span class="toggle-slider"></span>
      <span class="toggle-label">Hexadecimal display (tracker)</span>
    </label>
    <label class="setting-toggle">
      <input type="checkbox" name="harmony-colors" ${config.showHarmonyColors ? 'checked' : ''}>
      <span class="toggle-slider"></span>
      <span class="toggle-label">Show harmony colors</span>
    </label>
  `;
  
  // Wire up toggles
  const hexToggle = section.querySelector('input[name="hex-mode"]');
  hexToggle?.addEventListener('change', (e) => {
    const enabled = (e.target as HTMLInputElement).checked;
    applyHexDisplayMode(config.boardId, enabled);
  });
  
  const harmonyToggle = section.querySelector('input[name="harmony-colors"]');
  harmonyToggle?.addEventListener('change', (e) => {
    const enabled = (e.target as HTMLInputElement).checked;
    applyHarmonyColors(config.boardId, enabled);
  });
  
  return section;
}

/**
 * Creates other settings section.
 */
function createOtherSettingsSection(config: BoardSettingsConfig): HTMLElement {
  const section = document.createElement('div');
  section.className = 'settings-section';
  
  section.innerHTML = `
    <h4>Other Settings</h4>
    <label class="setting-toggle">
      <input type="checkbox" name="auto-save" ${config.autoSaveEnabled !== false ? 'checked' : ''}>
      <span class="toggle-slider"></span>
      <span class="toggle-label">Auto-save board state</span>
    </label>
    <div class="setting-actions">
      <button class="setting-action-btn" data-action="reset-layout">
        Reset Layout
      </button>
      <button class="setting-action-btn" data-action="reset-all">
        Reset All Settings
      </button>
    </div>
  `;
  
  // Wire up toggles and actions
  const autoSaveToggle = section.querySelector('input[name="auto-save"]');
  autoSaveToggle?.addEventListener('change', (e) => {
    const enabled = (e.target as HTMLInputElement).checked;
    applyAutoSave(config.boardId, enabled);
  });
  
  const resetLayoutBtn = section.querySelector('[data-action="reset-layout"]');
  resetLayoutBtn?.addEventListener('click', () => {
    if (confirm('Reset board layout to defaults?')) {
      resetBoardLayout(config.boardId);
    }
  });
  
  const resetAllBtn = section.querySelector('[data-action="reset-all"]');
  resetAllBtn?.addEventListener('click', () => {
    if (confirm('Reset all board settings to defaults?')) {
      resetAllBoardSettings(config.boardId);
    }
  });
  
  return section;
}

/**
 * Applies a theme variant to the board.
 */
function applyThemeVariant(boardId: string, variant: 'dark' | 'light' | 'high-contrast'): void {
  const registry = getBoardRegistry();
  const board = registry.get(boardId);
  if (!board) return;
  
  // Apply theme - theme applier handles variants via CSS
  applyBoardTheme(board);
  
  // Store variant preference in settings (for future implementation)
  const settings = loadSettings(boardId);
  saveSettings(boardId, { ...settings, themeVariant: variant });
  
  // Apply variant CSS class
  document.documentElement.setAttribute('data-theme-variant', variant);
}

/**
 * Applies visual density to the board.
 */
function applyVisualDensity(boardId: string, density: 'compact' | 'comfortable' | 'spacious'): void {
  const densityMap = {
    compact: '0.75rem',
    comfortable: '1rem',
    spacious: '1.25rem'
  };
  
  document.documentElement.style.setProperty('--board-row-height', densityMap[density]);
  
  // Persist choice
  const settings = loadSettings(boardId);
  saveSettings(boardId, { ...settings, visualDensity: density });
}

/**
 * Applies hex display mode.
 */
function applyHexDisplayMode(boardId: string, enabled: boolean): void {
  document.documentElement.classList.toggle('hex-display-mode', enabled);
  
  // Persist choice
  const settings = loadSettings(boardId);
  saveSettings(boardId, { ...settings, hexDisplayMode: enabled });
}

/**
 * Applies harmony color display.
 */
function applyHarmonyColors(boardId: string, enabled: boolean): void {
  document.documentElement.classList.toggle('show-harmony-colors', enabled);
  
  // Persist choice
  const settings = loadSettings(boardId);
  saveSettings(boardId, { ...settings, showHarmonyColors: enabled });
}

/**
 * Applies auto-save setting.
 */
function applyAutoSave(boardId: string, enabled: boolean): void {
  const settings = loadSettings(boardId);
  saveSettings(boardId, { ...settings, autoSaveEnabled: enabled });
}

/**
 * Resets board layout to defaults.
 */
function resetBoardLayout(boardId: string): void {
  const store = getBoardStateStore();
  store.resetLayoutState(boardId);
  
  // Trigger re-render
  window.location.reload();
}

/**
 * Resets all board settings to defaults.
 */
function resetAllBoardSettings(boardId: string): void {
  const store = getBoardStateStore();
  store.resetLayoutState(boardId);
  store.resetDeckState(boardId);
  saveSettings(boardId, {});
  
  // Trigger re-render
  window.location.reload();
}

// ============================================================================
// SETTINGS PERSISTENCE (localStorage-based for now)
// ============================================================================

const SETTINGS_KEY_PREFIX = 'cardplay.boardSettings.';

/**
 * Loads settings for a board from localStorage.
 */
function loadSettings(boardId: string): Partial<BoardSettingsConfig> {
  if (typeof localStorage === 'undefined') return {};
  
  try {
    const key = SETTINGS_KEY_PREFIX + boardId;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Saves settings for a board to localStorage.
 */
function saveSettings(boardId: string, settings: Partial<BoardSettingsConfig>): void {
  if (typeof localStorage === 'undefined') return;
  
  try {
    const key = SETTINGS_KEY_PREFIX + boardId;
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save board settings:', err);
  }
}

/**
 * Injects styles for the settings panel.
 */
function injectStyles(): void {
  const styleId = 'board-settings-panel-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .board-settings-panel {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(600px, 90vw);
      max-height: 80vh;
      background: var(--color-surface, #222);
      border: 1px solid var(--color-border, #333);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--color-border, #333);
      background: var(--color-background, #1a1a1a);
    }
    
    .settings-header h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-text, #e0e0e0);
    }
    
    .settings-close-btn {
      background: none;
      border: none;
      color: var(--color-text, #e0e0e0);
      font-size: 2rem;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    }
    
    .settings-close-btn:hover {
      background: var(--color-surface-hover, #2a2a2a);
    }
    
    .settings-content {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }
    
    .settings-section {
      margin-bottom: 2rem;
    }
    
    .settings-section:last-child {
      margin-bottom: 0;
    }
    
    .settings-section h4 {
      margin: 0 0 0.75rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text, #e0e0e0);
    }
    
    .setting-description {
      margin: 0 0 1rem 0;
      font-size: 0.875rem;
      color: var(--color-text-secondary, #999);
    }
    
    .theme-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
    }
    
    .theme-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: var(--color-background, #1a1a1a);
      border: 2px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .theme-option:hover {
      background: var(--color-surface-hover, #2a2a2a);
    }
    
    .theme-option.active {
      border-color: var(--color-primary, #6366f1);
      background: var(--color-surface-hover, #2a2a2a);
    }
    
    .theme-option input {
      display: none;
    }
    
    .theme-preview {
      width: 80px;
      height: 48px;
      border-radius: 6px;
      border: 2px solid var(--color-border, #333);
    }
    
    .theme-preview.theme-dark {
      background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
    }
    
    .theme-preview.theme-light {
      background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
    }
    
    .theme-preview.theme-high-contrast {
      background: linear-gradient(135deg, #000000 0%, #ffffff 100%);
    }
    
    .theme-label {
      font-size: 0.875rem;
      color: var(--color-text, #e0e0e0);
    }
    
    .density-options {
      display: flex;
      gap: 0.5rem;
    }
    
    .density-option {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem;
      background: var(--color-background, #1a1a1a);
      border: 2px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .density-option:hover {
      background: var(--color-surface-hover, #2a2a2a);
    }
    
    .density-option.active {
      border-color: var(--color-primary, #6366f1);
      background: var(--color-surface-hover, #2a2a2a);
    }
    
    .density-option input {
      display: none;
    }
    
    .density-label {
      font-size: 0.875rem;
      color: var(--color-text, #e0e0e0);
    }
    
    .setting-toggle {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0;
      cursor: pointer;
    }
    
    .toggle-slider {
      position: relative;
      width: 44px;
      height: 24px;
      background: var(--color-background, #1a1a1a);
      border: 2px solid var(--color-border, #333);
      border-radius: 12px;
      transition: all 0.2s;
    }
    
    .toggle-slider::after {
      content: '';
      position: absolute;
      left: 2px;
      top: 2px;
      width: 16px;
      height: 16px;
      background: var(--color-text-secondary, #999);
      border-radius: 50%;
      transition: all 0.2s;
    }
    
    .setting-toggle input:checked + .toggle-slider {
      background: var(--color-primary, #6366f1);
      border-color: var(--color-primary, #6366f1);
    }
    
    .setting-toggle input:checked + .toggle-slider::after {
      left: 22px;
      background: white;
    }
    
    .setting-toggle input {
      display: none;
    }
    
    .toggle-label {
      font-size: 0.875rem;
      color: var(--color-text, #e0e0e0);
    }
    
    .setting-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    
    .setting-action-btn {
      flex: 1;
      padding: 0.75rem 1rem;
      background: var(--color-background, #1a1a1a);
      color: var(--color-text, #e0e0e0);
      border: 1px solid var(--color-border, #333);
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .setting-action-btn:hover {
      background: var(--color-surface-hover, #2a2a2a);
      border-color: var(--color-primary, #6366f1);
    }
  `;
  
  document.head.appendChild(style);
}
