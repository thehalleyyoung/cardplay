/**
 * @fileoverview Board Settings Panel
 * 
 * Comprehensive settings panel for per-board configuration:
 * - Visual density (J052-J053)
 * - Theme selection (J037-J039)
 * - Control level indicators (J006-J008)
 * - Routing visibility (J027)
 * 
 * @module @cardplay/ui/components/board-settings-panel
 */

import type { Board } from '../../boards/types';
import { getVisualDensityManager, type VisualDensity, DENSITY_PRESETS } from '../../boards/settings/visual-density';
import { getBoardThemeManager } from '../../boards/theme/manager';

export interface BoardSettingsPanelOptions {
  board: Board;
  container: HTMLElement;
  onClose?: () => void;
}

/**
 * Board settings panel UI
 */
export class BoardSettingsPanel {
  private container: HTMLElement;
  private panel: HTMLElement;
  private board: Board;
  private onCloseCallback: (() => void) | undefined;
  private unsubscribers: Array<() => void> = [];

  constructor(options: BoardSettingsPanelOptions) {
    this.container = options.container;
    this.board = options.board;
    this.onCloseCallback = options.onClose;
    
    this.panel = this.createPanel();
    this.render();
    this.setupEventListeners();
  }

  private createPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'board-settings-panel';
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      max-height: 80vh;
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      color: #fff;
      font-family: sans-serif;
      z-index: 2000;
      overflow: auto;
    `;
    
    this.container.appendChild(panel);
    return panel;
  }

  private render(): void {
    const densityManager = getVisualDensityManager();
    const themeManager = getBoardThemeManager();
    
    const currentDensity = densityManager.getDensity(this.board.id);
    const currentTheme = themeManager.getThemeVariant(this.board.id);

    this.panel.innerHTML = `
      <div style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 600;">
            Board Settings
          </h2>
          <button 
            class="board-settings-close"
            style="
              background: none;
              border: none;
              color: #999;
              font-size: 24px;
              cursor: pointer;
              padding: 0;
              width: 32px;
              height: 32px;
              line-height: 1;
            "
          >×</button>
        </div>

        <div style="font-size: 14px; color: #999; margin-bottom: 24px;">
          ${this.board.name}
        </div>

        <!-- Visual Density -->
        <section style="margin-bottom: 32px;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #fff;">
            Visual Density
          </h3>
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #999;">
            Control row heights and spacing in tracker and session views.
          </p>
          
          <div style="display: flex; gap: 12px;">
            ${(['compact', 'comfortable', 'spacious'] as VisualDensity[]).map(density => {
              const preset = DENSITY_PRESETS[density];
              const isActive = density === currentDensity;
              
              return `
                <button
                  class="density-option"
                  data-density="${density}"
                  style="
                    flex: 1;
                    padding: 16px;
                    background: ${isActive ? '#4a9eff' : '#333'};
                    border: 2px solid ${isActive ? '#4a9eff' : '#444'};
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                  "
                >
                  <div style="font-weight: 600; margin-bottom: 4px; text-transform: capitalize;">
                    ${density}
                  </div>
                  <div style="font-size: 11px; color: ${isActive ? '#fff' : '#999'};">
                    ${preset.rowHeight}px rows
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </section>

        <!-- Theme -->
        <section style="margin-bottom: 32px;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #fff;">
            Theme
          </h3>
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #999;">
            Choose a color scheme for this board.
          </p>
          
          <div style="display: flex; gap: 12px;">
            ${(['dark', 'light', 'high-contrast'] as const).map(theme => {
              const isActive = theme === currentTheme;
              
              return `
                <button
                  class="theme-option"
                  data-theme="${theme}"
                  style="
                    flex: 1;
                    padding: 16px;
                    background: ${isActive ? '#4a9eff' : '#333'};
                    border: 2px solid ${isActive ? '#4a9eff' : '#444'};
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    text-transform: capitalize;
                    transition: all 0.2s;
                  "
                >
                  ${theme.replace('-', ' ')}
                </button>
              `;
            }).join('')}
          </div>
        </section>

        <!-- Control Indicators -->
        <section style="margin-bottom: 32px;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #fff;">
            Control Level Indicators
          </h3>
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #999;">
            Show visual indicators for manual vs AI-generated content.
          </p>
          
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input 
              type="checkbox"
              class="control-indicators-toggle"
              ${themeManager.getShowControlIndicators(this.board.id) ? 'checked' : ''}
              style="margin-right: 8px;"
            />
            <span style="font-size: 13px;">Show control level colors</span>
          </label>
        </section>

        <!-- Routing Overlay -->
        <section style="margin-bottom: 32px;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #fff;">
            Routing Overlay
          </h3>
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #999;">
            Visualize audio/MIDI connections between decks.
          </p>
          
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input 
              type="checkbox"
              class="routing-overlay-toggle"
              style="margin-right: 8px;"
            />
            <span style="font-size: 13px;">Show routing connections</span>
          </label>
        </section>

        <!-- Actions -->
        <section>
          <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #fff;">
            Actions
          </h3>
          
          <div style="display: flex; gap: 8px; flex-direction: column;">
            <button
              class="action-reset-layout"
              style="
                padding: 12px;
                background: #444;
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-size: 13px;
                text-align: left;
              "
            >
              Reset Layout
            </button>
            
            <button
              class="action-reset-deck-state"
              style="
                padding: 12px;
                background: #444;
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-size: 13px;
                text-align: left;
              "
            >
              Reset Deck State
            </button>
            
            <button
              class="action-reset-all"
              style="
                padding: 12px;
                background: #e74c3c;
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-size: 13px;
                text-align: left;
              "
            >
              Reset All Board Preferences
            </button>
          </div>
        </section>
      </div>
    `;
  }

  private setupEventListeners(): void {
    const closeBtn = this.panel.querySelector('.board-settings-close');
    closeBtn?.addEventListener('click', () => this.close());

    const densityButtons = this.panel.querySelectorAll('.density-option');
    densityButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const density = (e.currentTarget as HTMLElement).dataset.density as VisualDensity;
        this.setDensity(density);
      });
    });

    const themeButtons = this.panel.querySelectorAll('.theme-option');
    themeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const theme = (e.currentTarget as HTMLElement).dataset.theme as 'dark' | 'light' | 'high-contrast';
        this.setTheme(theme);
      });
    });

    const controlIndicatorsToggle = this.panel.querySelector('.control-indicators-toggle') as HTMLInputElement;
    controlIndicatorsToggle?.addEventListener('change', (e) => {
      this.setShowControlIndicators((e.target as HTMLInputElement).checked);
    });

    const resetLayoutBtn = this.panel.querySelector('.action-reset-layout');
    resetLayoutBtn?.addEventListener('click', () => this.resetLayout());

    const resetDeckStateBtn = this.panel.querySelector('.action-reset-deck-state');
    resetDeckStateBtn?.addEventListener('click', () => this.resetDeckState());

    const resetAllBtn = this.panel.querySelector('.action-reset-all');
    resetAllBtn?.addEventListener('click', () => this.resetAll());
  }

  private setDensity(density: VisualDensity): void {
    getVisualDensityManager().setDensity(this.board.id, density);
    this.render();
    this.setupEventListeners();
  }

  private setTheme(theme: 'dark' | 'light' | 'high-contrast'): void {
    getBoardThemeManager().setThemeVariant(this.board.id, theme);
    this.render();
    this.setupEventListeners();
  }

  private setShowControlIndicators(show: boolean): void {
    getBoardThemeManager().setShowControlIndicators(this.board.id, show);
  }

  private resetLayout(): void {
    if (confirm('Reset board layout to defaults? This cannot be undone.')) {
      // TODO: Call BoardStateStore.resetLayoutState
      console.log('Reset layout for', this.board.id);
    }
  }

  private resetDeckState(): void {
    if (confirm('Reset all deck state (tabs, filters, etc.)? This cannot be undone.')) {
      // TODO: Call BoardStateStore.resetDeckState
      console.log('Reset deck state for', this.board.id);
    }
  }

  private resetAll(): void {
    if (confirm('Reset ALL board preferences (layout, decks, settings)? This cannot be undone.')) {
      getVisualDensityManager().setDensity(this.board.id, 'comfortable');
      getBoardThemeManager().setThemeVariant(this.board.id, 'dark');
      getBoardThemeManager().setShowControlIndicators(this.board.id, true);
      // TODO: Call BoardStateStore reset methods
      console.log('Reset all preferences for', this.board.id);
      this.render();
      this.setupEventListeners();
    }
  }

  private close(): void {
    this.destroy();
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  destroy(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    
    if (this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
  }
}

export function injectBoardSettingsPanelStyles(): void {
  const styleId = 'board-settings-panel-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .board-settings-panel button:hover {
      opacity: 0.9;
    }
    
    .board-settings-panel button:active {
      opacity: 0.8;
    }
    
    .density-option:hover,
    .theme-option:hover {
      transform: translateY(-2px);
    }
  `;
  
  document.head.appendChild(style);
}
