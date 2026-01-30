/**
 * @fileoverview Board Settings Panel Component
 * 
 * UI panel for managing board-specific settings:
 * - Display options (tracker hex/decimal, visual density)
 * - Tool toggles (if board policy allows)
 * - Theme preferences
 * - Keyboard shortcuts
 * 
 * @module @cardplay/boards/settings/board-settings-panel
 */

import type { Board, BoardPolicy } from '../types';
import { DEFAULT_BOARD_POLICY } from '../types';
import { getBoardStateStore } from '../store/store';
import { getBoardRegistry } from '../registry';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Board settings panel configuration.
 */
export interface BoardSettingsPanelConfig {
  /** Board ID to show settings for */
  boardId: string;
  
  /** Whether panel is in read-only mode */
  readOnly?: boolean;
  
  /** Sections to show */
  sections?: {
    display?: boolean;
    tools?: boolean;
    theme?: boolean;
    shortcuts?: boolean;
  };
}

/**
 * Display density preference.
 */
export enum VisualDensity {
  /** Compact (smaller spacing, more content) */
  Compact = 'compact',
  
  /** Comfortable (default spacing) */
  Comfortable = 'comfortable',
  
  /** Spacious (larger spacing, easier to read) */
  Spacious = 'spacious',
}

/**
 * Board display settings.
 */
export interface BoardDisplaySettings {
  /** Visual density for decks */
  density: VisualDensity;
  
  /** Tracker-specific display base (hex/decimal) */
  trackerBase?: 'hex' | 'decimal';
  
  /** Show/hide deck headers */
  showDeckHeaders: boolean;
  
  /** Show/hide control level indicators */
  showControlIndicators: boolean;
  
  /** Animation speed (0 = disabled, 1 = normal, 2 = fast) */
  animationSpeed: number;
}

/**
 * Default display settings.
 */
export function defaultDisplaySettings(): BoardDisplaySettings {
  return {
    density: VisualDensity.Comfortable,
    trackerBase: 'hex',
    showDeckHeaders: true,
    showControlIndicators: true,
    animationSpeed: 1,
  };
}

// ============================================================================
// PANEL COMPONENT
// ============================================================================

/**
 * Board settings panel state.
 */
interface BoardSettingsPanelState {
  board: Board;
  policy: BoardPolicy;
  displaySettings: BoardDisplaySettings;
  isDirty: boolean;
}

/**
 * Board settings panel component.
 */
export class BoardSettingsPanel {
  private readonly config: BoardSettingsPanelConfig;
  private state: BoardSettingsPanelState | null = null;
  private readonly element: HTMLElement;
  private readonly listeners: Map<string, () => void> = new Map();
  
  constructor(config: BoardSettingsPanelConfig) {
    this.config = config;
    this.element = document.createElement('div');
    this.element.className = 'board-settings-panel';
    
    this.initialize();
  }
  
  /**
   * Initialize panel state.
   */
  private initialize(): void {
    const registry = getBoardRegistry();
    const board = registry.get(this.config.boardId);
    
    if (!board) {
      console.warn('Board not found:', this.config.boardId);
      this.renderError('Board not found');
      return;
    }
    
    // Load display settings from deck settings
    const store = getBoardStateStore();
    const deckState = store.getDeckState(board.id);
    const displaySettings = deckState?.deckSettings?.display as BoardDisplaySettings | undefined || defaultDisplaySettings();
    
    // Change 140: Use DEFAULT_BOARD_POLICY when board.policy is omitted
    this.state = {
      board,
      policy: board.policy ?? DEFAULT_BOARD_POLICY,
      displaySettings,
      isDirty: false,
    };
    
    this.render();
  }
  
  /**
   * Render panel.
   */
  private render(): void {
    if (!this.state) {
      return;
    }
    
    const sections = this.config.sections || {
      display: true,
      tools: true,
      theme: true,
      shortcuts: true,
    };
    
    this.element.innerHTML = '';
    
    // Header
    const header = document.createElement('div');
    header.className = 'board-settings-header';
    header.innerHTML = `
      <h2>Board Settings</h2>
      <p class="board-name">${this.state.board.name}</p>
    `;
    this.element.appendChild(header);
    
    // Display settings section
    if (sections.display) {
      this.element.appendChild(this.renderDisplaySection());
    }
    
    // Tool settings section
    if (sections.tools && this.state.policy.allowToolToggles) {
      this.element.appendChild(this.renderToolsSection());
    }
    
    // Theme section
    if (sections.theme) {
      this.element.appendChild(this.renderThemeSection());
    }
    
    // Shortcuts section
    if (sections.shortcuts) {
      this.element.appendChild(this.renderShortcutsSection());
    }
    
    // Actions footer
    this.element.appendChild(this.renderActionsFooter());
  }
  
  /**
   * Render display settings section.
   */
  private renderDisplaySection(): HTMLElement {
    if (!this.state) {
      return document.createElement('div');
    }
    
    const section = document.createElement('div');
    section.className = 'settings-section';
    section.innerHTML = `
      <h3>Display</h3>
      
      <div class="setting-row">
        <label for="density">Visual Density</label>
        <select id="density" ${this.config.readOnly ? 'disabled' : ''}>
          <option value="${VisualDensity.Compact}">Compact</option>
          <option value="${VisualDensity.Comfortable}" selected>Comfortable</option>
          <option value="${VisualDensity.Spacious}">Spacious</option>
        </select>
      </div>
      
      ${this.state.board.primaryView === 'tracker' ? `
        <div class="setting-row">
          <label for="trackerBase">Tracker Number Base</label>
          <select id="trackerBase" ${this.config.readOnly ? 'disabled' : ''}>
            <option value="hex" ${this.state.displaySettings.trackerBase === 'hex' ? 'selected' : ''}>Hexadecimal</option>
            <option value="decimal" ${this.state.displaySettings.trackerBase === 'decimal' ? 'selected' : ''}>Decimal</option>
          </select>
        </div>
      ` : ''}
      
      <div class="setting-row">
        <label for="showDeckHeaders">Show Deck Headers</label>
        <input type="checkbox" id="showDeckHeaders" 
               ${this.state.displaySettings.showDeckHeaders ? 'checked' : ''}
               ${this.config.readOnly ? 'disabled' : ''} />
      </div>
      
      <div class="setting-row">
        <label for="showControlIndicators">Show Control Level Indicators</label>
        <input type="checkbox" id="showControlIndicators" 
               ${this.state.displaySettings.showControlIndicators ? 'checked' : ''}
               ${this.config.readOnly ? 'disabled' : ''} />
      </div>
      
      <div class="setting-row">
        <label for="animationSpeed">Animation Speed</label>
        <select id="animationSpeed" ${this.config.readOnly ? 'disabled' : ''}>
          <option value="0">Disabled</option>
          <option value="1" ${this.state.displaySettings.animationSpeed === 1 ? 'selected' : ''}>Normal</option>
          <option value="2">Fast</option>
        </select>
      </div>
    `;
    
    // Attach event listeners
    if (!this.config.readOnly) {
      const densitySelect = section.querySelector('#density') as HTMLSelectElement;
      densitySelect?.addEventListener('change', () => this.onDensityChange(densitySelect.value as VisualDensity));
      
      const trackerBaseSelect = section.querySelector('#trackerBase') as HTMLSelectElement;
      trackerBaseSelect?.addEventListener('change', () => this.onTrackerBaseChange(trackerBaseSelect.value as 'hex' | 'decimal'));
      
      const showHeadersCheckbox = section.querySelector('#showDeckHeaders') as HTMLInputElement;
      showHeadersCheckbox?.addEventListener('change', () => this.onShowHeadersChange(showHeadersCheckbox.checked));
      
      const showIndicatorsCheckbox = section.querySelector('#showControlIndicators') as HTMLInputElement;
      showIndicatorsCheckbox?.addEventListener('change', () => this.onShowIndicatorsChange(showIndicatorsCheckbox.checked));
      
      const animationSpeedSelect = section.querySelector('#animationSpeed') as HTMLSelectElement;
      animationSpeedSelect?.addEventListener('change', () => this.onAnimationSpeedChange(parseInt(animationSpeedSelect.value, 10)));
    }
    
    return section;
  }
  
  /**
   * Render tools section.
   */
  private renderToolsSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'settings-section';
    section.innerHTML = `
      <h3>Tools</h3>
      <p class="section-note">Tool toggles available for this board (board policy allows changes)</p>
      <p class="section-note">Coming soon: UI for toggling phrase library, harmony explorer, generators, etc.</p>
    `;
    
    return section;
  }
  
  /**
   * Render theme section.
   */
  private renderThemeSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'settings-section';
    section.innerHTML = `
      <h3>Theme</h3>
      <p class="section-note">Theme preferences apply to this board only</p>
      <p class="section-note">Coming soon: Light/dark/high-contrast theme selector</p>
    `;
    
    return section;
  }
  
  /**
   * Render shortcuts section.
   */
  private renderShortcutsSection(): HTMLElement {
    if (!this.state) {
      return document.createElement('div');
    }
    
    const section = document.createElement('div');
    section.className = 'settings-section';
    
    const shortcutsList = Object.entries(this.state.board.shortcuts || {})
      .map(([action, key]) => `
        <div class="shortcut-row">
          <span class="shortcut-action">${action}</span>
          <kbd class="shortcut-key">${key}</kbd>
        </div>
      `)
      .join('');
    
    section.innerHTML = `
      <h3>Keyboard Shortcuts</h3>
      <div class="shortcuts-list">
        ${shortcutsList || '<p class="section-note">No shortcuts defined for this board</p>'}
      </div>
    `;
    
    return section;
  }
  
  /**
   * Render actions footer.
   */
  private renderActionsFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'settings-actions';
    footer.innerHTML = `
      <button class="btn-reset" ${this.config.readOnly ? 'disabled' : ''}>Reset to Defaults</button>
      <button class="btn-apply" ${this.config.readOnly || !this.state?.isDirty ? 'disabled' : ''}>Apply Changes</button>
    `;
    
    if (!this.config.readOnly) {
      const resetButton = footer.querySelector('.btn-reset') as HTMLButtonElement;
      resetButton?.addEventListener('click', () => this.onReset());
      
      const applyButton = footer.querySelector('.btn-apply') as HTMLButtonElement;
      applyButton?.addEventListener('click', () => this.onApply());
    }
    
    return footer;
  }
  
  /**
   * Render error state.
   */
  private renderError(message: string): void {
    this.element.innerHTML = `
      <div class="board-settings-error">
        <p>Error: ${message}</p>
      </div>
    `;
  }
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  private onDensityChange(density: VisualDensity): void {
    if (!this.state) return;
    
    this.state.displaySettings.density = density;
    this.state.isDirty = true;
    this.render();
    
    console.info('Display density changed:', density);
  }
  
  private onTrackerBaseChange(base: 'hex' | 'decimal'): void {
    if (!this.state) return;
    
    this.state.displaySettings.trackerBase = base;
    this.state.isDirty = true;
    this.render();
    
    console.info('Tracker base changed:', base);
  }
  
  private onShowHeadersChange(show: boolean): void {
    if (!this.state) return;
    
    this.state.displaySettings.showDeckHeaders = show;
    this.state.isDirty = true;
    this.render();
    
    console.info('Show deck headers changed:', show);
  }
  
  private onShowIndicatorsChange(show: boolean): void {
    if (!this.state) return;
    
    this.state.displaySettings.showControlIndicators = show;
    this.state.isDirty = true;
    this.render();
    
    console.info('Show control indicators changed:', show);
  }
  
  private onAnimationSpeedChange(speed: number): void {
    if (!this.state) return;
    
    this.state.displaySettings.animationSpeed = speed;
    this.state.isDirty = true;
    this.render();
    
    console.info('Animation speed changed:', speed);
  }
  
  private onReset(): void {
    if (!this.state) return;
    
    if (confirm('Reset all settings to defaults?')) {
      this.state.displaySettings = defaultDisplaySettings();
      this.state.isDirty = true;
      this.render();
      
      console.info('Settings reset to defaults');
    }
  }
  
  private onApply(): void {
    if (!this.state) return;
    
    // Save display settings to board state store (in deckSettings)
    const store = getBoardStateStore();
    const currentDeckState = store.getDeckState(this.state.board.id);
    
    store.setDeckState(this.state.board.id, {
      ...currentDeckState,
      deckSettings: {
        ...currentDeckState?.deckSettings,
        display: this.state.displaySettings as any, // BoardDisplaySettings stored in generic DeckSettings
      },
    });
    
    this.state.isDirty = false;
    this.render();
    
    console.info('Settings applied:', this.state.displaySettings);
    
    // Emit event for UI to react
    this.emit('settings-applied', this.state.displaySettings);
  }
  
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  
  /**
   * Get DOM element.
   */
  getElement(): HTMLElement {
    return this.element;
  }
  
  /**
   * Get current display settings.
   */
  getDisplaySettings(): BoardDisplaySettings {
    return this.state?.displaySettings || defaultDisplaySettings();
  }
  
  /**
   * Subscribe to events.
   */
  on(event: 'settings-applied', handler: (settings: BoardDisplaySettings) => void): void {
    this.listeners.set(event, handler as () => void);
  }
  
  /**
   * Emit event.
   */
  private emit(event: string, data?: unknown): void {
    const handler = this.listeners.get(event);
    if (handler) {
      (handler as (data: unknown) => void)(data);
    }
  }
  
  /**
   * Destroy panel.
   */
  destroy(): void {
    this.listeners.clear();
    this.element.remove();
  }
}

// ============================================================================
// HELPER: APPLY VISUAL DENSITY
// ============================================================================

/**
 * Apply visual density to tracker/session decks.
 */
export function applyVisualDensity(
  container: HTMLElement,
  density: VisualDensity
): void {
  // Remove existing density classes
  container.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
  
  // Add new density class
  container.classList.add(`density-${density}`);
  
  console.info('Visual density applied:', density);
}

/**
 * Get row height for density setting.
 */
export function getRowHeightForDensity(density: VisualDensity): number {
  switch (density) {
    case VisualDensity.Compact:
      return 16;
    case VisualDensity.Comfortable:
      return 20;
    case VisualDensity.Spacious:
      return 24;
    default:
      return 20;
  }
}
