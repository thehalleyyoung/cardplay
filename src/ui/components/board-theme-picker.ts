/**
 * @fileoverview Board Theme Picker Component
 * 
 * Provides a UI for switching between theme variants (light/dark/high-contrast)
 * for the active board. Supports per-board theme persistence and global theme
 * policy.
 * 
 * Features:
 * - Theme variant selection (light, dark, high-contrast)
 * - Preview of theme colors
 * - Per-board or global theme preference
 * - Accessibility support (ARIA labels, keyboard navigation)
 * - Real-time theme switching without remounting
 * 
 * Phase J Tasks: J037-J039
 * 
 * @module @cardplay/ui/components/board-theme-picker
 */

import { getBoardStateStore } from '../../boards/store/store';

/**
 * Theme variant options (light/dark/high-contrast)
 */
export type BoardThemeVariant = 'light' | 'dark' | 'high-contrast';

// ============================================================================
// TYPES
// ============================================================================

export interface BoardThemePickerConfig {
  /** Initial theme variant */
  initialVariant?: BoardThemeVariant;
  /** Apply theme per-board or globally */
  scope: 'board' | 'global';
  /** Callback when theme changes */
  onChange?: (variant: BoardThemeVariant) => void;
}

export interface BoardThemePickerState {
  currentVariant: BoardThemeVariant;
  scope: 'board' | 'global';
}

// ============================================================================
// BOARD THEME PICKER
// ============================================================================

/**
 * Board theme picker component.
 */
export class BoardThemePicker {
  private container: HTMLElement | null = null;
  private state: BoardThemePickerState;
  private config: BoardThemePickerConfig;
  private unsubscribe?: () => void;

  constructor(config: BoardThemePickerConfig) {
    this.config = config;
    
    // Initialize state
    this.state = {
      currentVariant: config.initialVariant || this.loadPersistedTheme(),
      scope: config.scope
    };
  }

  /**
   * Load persisted theme preference.
   */
  private loadPersistedTheme(): BoardThemeVariant {
    const store = getBoardStateStore();
    const boardState = store.getState();
    
    if (this.config.scope === 'global') {
      // Load from localStorage for global theme
      const saved = localStorage.getItem('cardplay.theme.variant');
      return (saved as BoardThemeVariant) || 'dark';
    } else {
      // Load per-board theme
      const currentBoardId = boardState.currentBoardId;
      if (currentBoardId) {
        const key = `cardplay.board.${currentBoardId}.theme`;
        const saved = localStorage.getItem(key);
        return (saved as BoardThemeVariant) || 'dark';
      }
    }
    
    return 'dark';
  }

  /**
   * Persist theme preference.
   */
  private persistTheme(variant: BoardThemeVariant): void {
    if (this.config.scope === 'global') {
      localStorage.setItem('cardplay.theme.variant', variant);
    } else {
      const store = getBoardStateStore();
      const boardState = store.getState();
      const currentBoardId = boardState.currentBoardId;
      
      if (currentBoardId) {
        const key = `cardplay.board.${currentBoardId}.theme`;
        localStorage.setItem(key, variant);
      }
    }
  }

  /**
   * Set theme variant.
   */
  setTheme(variant: BoardThemeVariant): void {
    this.state.currentVariant = variant;
    
    // Apply theme immediately (for now just set data attribute)
    // Full theme application would need theme object construction
    document.documentElement.setAttribute('data-theme', variant);
    
    // Persist preference
    this.persistTheme(variant);
    
    // Re-render UI
    if (this.container) {
      this.render();
    }
    
    // Notify callback
    if (this.config.onChange) {
      this.config.onChange(variant);
    }
  }

  /**
   * Render the theme picker.
   */
  render(): HTMLElement {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'board-theme-picker';
      this.container.setAttribute('role', 'group');
      this.container.setAttribute('aria-label', 'Theme selection');
    }

    const variants: BoardThemeVariant[] = ['light', 'dark', 'high-contrast'];
    
    this.container.innerHTML = `
      <div class="theme-picker-header">
        <h3 class="theme-picker-title">Theme</h3>
        <span class="theme-picker-scope">${this.state.scope === 'global' ? 'Global' : 'Board'}</span>
      </div>
      <div class="theme-picker-options" role="radiogroup" aria-label="Theme variants">
        ${variants.map(variant => this.renderVariantOption(variant)).join('')}
      </div>
    `;

    // Attach event listeners
    const options = this.container.querySelectorAll('.theme-option');
    options.forEach(option => {
      option.addEventListener('click', () => {
        const variant = option.getAttribute('data-variant') as BoardThemeVariant;
        if (variant) {
          this.setTheme(variant);
        }
      });

      // Keyboard support
      option.addEventListener('keydown', (e: Event) => {
        const ke = e as KeyboardEvent;
        if (ke.key === 'Enter' || ke.key === ' ') {
          e.preventDefault();
          const variant = (e.target as HTMLElement).getAttribute('data-variant') as BoardThemeVariant;
          if (variant) {
            this.setTheme(variant);
          }
        }
      });
    });

    return this.container;
  }

  /**
   * Render a single theme variant option.
   */
  private renderVariantOption(variant: BoardThemeVariant): string {
    const isSelected = variant === this.state.currentVariant;
    const labels: Record<BoardThemeVariant, string> = {
      light: 'Light',
      dark: 'Dark',
      'high-contrast': 'High Contrast'
    };
    
    const colors = this.getVariantPreviewColors(variant);
    
    return `
      <div 
        class="theme-option ${isSelected ? 'theme-option--selected' : ''}"
        data-variant="${variant}"
        role="radio"
        aria-checked="${isSelected}"
        aria-label="${labels[variant]} theme"
        tabindex="${isSelected ? '0' : '-1'}"
      >
        <div class="theme-option-preview">
          <div class="preview-color preview-color--bg" style="background: ${colors.bg}"></div>
          <div class="preview-color preview-color--fg" style="background: ${colors.fg}"></div>
          <div class="preview-color preview-color--accent" style="background: ${colors.accent}"></div>
        </div>
        <div class="theme-option-label">${labels[variant]}</div>
        ${isSelected ? '<div class="theme-option-checkmark" aria-hidden="true">✓</div>' : ''}
      </div>
    `;
  }

  /**
   * Get preview colors for a theme variant.
   */
  private getVariantPreviewColors(variant: BoardThemeVariant): {
    bg: string;
    fg: string;
    accent: string;
  } {
    const previewColors: Record<BoardThemeVariant, { bg: string; fg: string; accent: string }> = {
      'light': {
        bg: '#ffffff',
        fg: '#1a1a1a',
        accent: '#0066cc'
      },
      'dark': {
        bg: '#1a1a1a',
        fg: '#e0e0e0',
        accent: '#4d94ff'
      },
      'high-contrast': {
        bg: '#000000',
        fg: '#ffffff',
        accent: '#ffff00'
      }
    };
    return previewColors[variant];
  }

  /**
   * Mount the theme picker to a container.
   */
  mount(container: HTMLElement): void {
    container.appendChild(this.render());
    
    // Subscribe to board changes to update per-board theme
    if (this.config.scope === 'board') {
      const store = getBoardStateStore();
      this.unsubscribe = store.subscribe(() => {
        const newTheme = this.loadPersistedTheme();
        if (newTheme !== this.state.currentVariant) {
          this.setTheme(newTheme);
        }
      });
    }
  }

  /**
   * Unmount and cleanup.
   */
  unmount(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    this.container = null;
  }

  /**
   * Get current theme variant.
   */
  getCurrentTheme(): BoardThemeVariant {
    return this.state.currentVariant;
  }

  /**
   * Toggle between light and dark themes.
   */
  toggleLightDark(): void {
    const newTheme = this.state.currentVariant === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }
}

// ============================================================================
// STYLES
// ============================================================================

/**
 * Inject theme picker styles.
 */
export function injectBoardThemePickerStyles(): void {
  if (document.getElementById('board-theme-picker-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'board-theme-picker-styles';
  style.textContent = `
    .board-theme-picker {
      padding: var(--spacing-md);
      background: var(--surface-01);
      border-radius: var(--border-radius);
      border: 1px solid var(--border-subtle);
    }

    .theme-picker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing-md);
    }

    .theme-picker-title {
      margin: 0;
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
    }

    .theme-picker-scope {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      padding: var(--spacing-xs) var(--spacing-sm);
      background: var(--surface-02);
      border-radius: var(--border-radius-sm);
    }

    .theme-picker-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: var(--spacing-sm);
    }

    .theme-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--spacing-md);
      background: var(--surface-02);
      border: 2px solid var(--border-subtle);
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .theme-option:hover {
      border-color: var(--border-focus);
      background: var(--surface-03);
    }

    .theme-option:focus {
      outline: none;
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px var(--focus-ring);
    }

    .theme-option--selected {
      border-color: var(--accent-primary);
      background: var(--surface-03);
    }

    .theme-option-preview {
      display: flex;
      gap: 4px;
      margin-bottom: var(--spacing-sm);
    }

    .preview-color {
      width: 24px;
      height: 24px;
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--border-subtle);
    }

    .theme-option-label {
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      font-weight: var(--font-weight-medium);
    }

    .theme-option-checkmark {
      position: absolute;
      top: var(--spacing-xs);
      right: var(--spacing-xs);
      color: var(--accent-primary);
      font-size: var(--font-size-lg);
      font-weight: bold;
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .theme-option {
        transition: none;
      }
    }
  `;

  document.head.appendChild(style);
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a board theme picker instance.
 */
export function createBoardThemePicker(config: BoardThemePickerConfig): BoardThemePicker {
  injectBoardThemePickerStyles();
  return new BoardThemePicker(config);
}
