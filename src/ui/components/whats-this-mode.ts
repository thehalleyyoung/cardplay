/**
 * @fileoverview "What's This?" Interactive Help Mode
 * 
 * Provides an interactive help mode where users can click any UI element
 * to learn what it does. Shows contextual tooltips and documentation.
 * 
 * Implements P115: "What's This?" mode for exploring UI
 * 
 * @module @cardplay/ui/components/whats-this-mode
 */

// ============================================================================
// TYPES
// ============================================================================

export interface WhatsThisInfo {
  readonly title: string;
  readonly description: string;
  readonly shortcuts?: readonly string[];
  readonly learnMoreUrl?: string;
}

export interface WhatsThisConfig {
  readonly activationKey: string; // Default: 'Shift+F1'
  readonly exitKey: string; // Default: 'Escape'
  readonly cursorStyle: string; // CSS cursor value
}

// ============================================================================
// WHAT'S THIS MODE
// ============================================================================

/**
 * What's This? Interactive Help Mode
 * 
 * Beautiful browser UI for exploring the interface. Activates a special
 * cursor and shows contextual help when clicking elements.
 */
export class WhatsThisMode {
  private active = false;
  private config: WhatsThisConfig;
  private overlay: HTMLElement | null = null;
  private helpPopup: HTMLElement | null = null;
  private elementMap = new Map<HTMLElement, WhatsThisInfo>();
  private originalCursors = new Map<HTMLElement, string>();

  constructor(config: Partial<WhatsThisConfig> = {}) {
    this.config = {
      activationKey: 'Shift+F1',
      exitKey: 'Escape',
      cursorStyle: 'help',
      ...config,
    };

    this.setupKeyboardListeners();
  }

  // --------------------------------------------------------------------------
  // REGISTRATION
  // --------------------------------------------------------------------------

  /**
   * Registers help info for an element.
   */
  register(element: HTMLElement, info: WhatsThisInfo): () => void {
    this.elementMap.set(element, info);

    return () => {
      this.elementMap.delete(element);
    };
  }

  /**
   * Registers help info using a CSS selector.
   */
  registerSelector(selector: string, info: WhatsThisInfo): () => void {
    const elements = document.querySelectorAll(selector);
    const cleanups: Array<() => void> = [];

    elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        cleanups.push(this.register(el, info));
      }
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }

  /**
   * Bulk registers help info for common UI elements.
   */
  registerCommonElements(): void {
    // Board switcher
    this.registerSelector('[data-component="board-switcher"]', {
      title: 'Board Switcher',
      description:
        'Switch between different board layouts for different workflows. ' +
        'Each board provides a different combination of tools and views.',
      shortcuts: ['Cmd+B'],
    });

    // Deck tabs
    this.registerSelector('[data-component="deck-tab"]', {
      title: 'Deck Tab',
      description:
        'Switch between different decks (panels) in your workspace. ' +
        'Each deck provides specialized tools for your workflow.',
      shortcuts: ['Cmd+1-9'],
    });

    // Transport controls
    this.registerSelector('[data-component="transport"]', {
      title: 'Transport Controls',
      description:
        'Control playback: play, stop, record, and navigate your project timeline. ' +
        'Also shows tempo, time signature, and loop region.',
      shortcuts: ['Space - Play/Stop', 'R - Record'],
    });

    // Pattern editor
    this.registerSelector('[data-component="pattern-editor"]', {
      title: 'Pattern Editor',
      description:
        'Edit MIDI patterns in a tracker-style grid. Enter notes, velocities, ' +
        'and effects with keyboard input. Supports hex and decimal modes.',
      shortcuts: ['A-Z - Note entry', '0-9 - Values', 'Arrows - Navigate'],
    });

    // Piano roll
    this.registerSelector('[data-component="piano-roll"]', {
      title: 'Piano Roll Editor',
      description:
        'Visual MIDI editor with piano keyboard. Click and drag to create notes, ' +
        'resize to change duration, drag vertically to change pitch.',
      shortcuts: ['Click+Drag - Draw notes', 'Cmd+Click - Select'],
    });

    // Notation
    this.registerSelector('[data-component="notation"]', {
      title: 'Music Notation',
      description:
        'Traditional music score editor. Add notes, rests, dynamics, and articulations. ' +
        'Supports multi-staff scores and part extraction.',
      shortcuts: ['A-G - Add notes', 'Delete - Remove'],
    });

    // Session grid
    this.registerSelector('[data-component="session-grid"]', {
      title: 'Session Grid',
      description:
        'Launch clips and scenes for live performance. Each slot contains a clip ' +
        'that can be triggered in time with playback.',
      shortcuts: ['Click - Launch', 'Stop button - Stop'],
    });

    // Mixer
    this.registerSelector('[data-component="mixer"]', {
      title: 'Mixer',
      description:
        'Mix your tracks with volume, pan, mute, and solo controls. ' +
        'Shows levels with real-time metering.',
      shortcuts: ['M - Mute', 'S - Solo', 'A - Arm'],
    });

    // Routing overlay
    this.registerSelector('[data-component="routing-overlay"]', {
      title: 'Routing Overlay',
      description:
        'Visualize and edit audio/MIDI routing connections between instruments, ' +
        'effects, and tracks. Click ports to create connections.',
      shortcuts: ['Click port - Start connection', 'Click port - Complete'],
    });

    // Properties panel
    this.registerSelector('[data-component="properties"]', {
      title: 'Properties Panel',
      description:
        'View and edit properties of the selected element (note, clip, track, etc.). ' +
        'Changes are immediately applied and undoable.',
    });

    // AI Advisor
    this.registerSelector('[data-component="ai-advisor"]', {
      title: 'AI Advisor',
      description:
        'Get intelligent suggestions for your project based on music theory rules. ' +
        'Uses Prolog-based reasoning, not neural networks.',
      shortcuts: ['Cmd+K - Open command palette'],
    });
  }

  // --------------------------------------------------------------------------
  // ACTIVATION
  // --------------------------------------------------------------------------

  /**
   * Activates What's This? mode.
   */
  activate(): void {
    if (this.active) {
      return;
    }

    this.active = true;
    this.createOverlay();
    this.applyCursorStyles();
    this.attachClickListeners();
  }

  /**
   * Deactivates What's This? mode.
   */
  deactivate(): void {
    if (!this.active) {
      return;
    }

    this.active = false;
    this.removeOverlay();
    this.restoreCursorStyles();
    this.detachClickListeners();
    this.closePopup();
  }

  /**
   * Toggles What's This? mode.
   */
  toggle(): void {
    if (this.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  /**
   * Returns whether mode is active.
   */
  isActive(): boolean {
    return this.active;
  }

  // --------------------------------------------------------------------------
  // OVERLAY
  // --------------------------------------------------------------------------

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'whats-this-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 99999;
      pointer-events: none;
      background: rgba(74, 158, 255, 0.05);
      backdrop-filter: blur(1px);
    `;

    // Add banner
    const banner = document.createElement('div');
    banner.className = 'whats-this-banner';
    banner.style.cssText = `
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: var(--color-accent, #4a9eff);
      color: white;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      pointer-events: auto;
      cursor: pointer;
      animation: fade-in 0.2s ease-out;
    `;
    banner.textContent = "What's This? Mode - Click any element to learn more (or press Escape)";
    banner.onclick = () => this.deactivate();

    this.overlay.appendChild(banner);
    document.body.appendChild(this.overlay);
  }

  private removeOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  // --------------------------------------------------------------------------
  // CURSOR STYLES
  // --------------------------------------------------------------------------

  private applyCursorStyles(): void {
    this.elementMap.forEach((_, element) => {
      const currentCursor = element.style.cursor;
      this.originalCursors.set(element, currentCursor);
      element.style.cursor = this.config.cursorStyle;
    });
  }

  private restoreCursorStyles(): void {
    this.originalCursors.forEach((cursor, element) => {
      element.style.cursor = cursor;
    });
    this.originalCursors.clear();
  }

  // --------------------------------------------------------------------------
  // CLICK HANDLING
  // --------------------------------------------------------------------------

  private clickHandler = (event: MouseEvent): void => {
    if (!this.active) {
      return;
    }

    // Find the closest registered element
    let target = event.target as HTMLElement | null;
    while (target) {
      const info = this.elementMap.get(target);
      if (info) {
        event.preventDefault();
        event.stopPropagation();
        this.showPopup(target, info);
        return;
      }
      target = target.parentElement;
    }
  };

  private attachClickListeners(): void {
    document.addEventListener('click', this.clickHandler, true);
  }

  private detachClickListeners(): void {
    document.removeEventListener('click', this.clickHandler, true);
  }

  // --------------------------------------------------------------------------
  // HELP POPUP
  // --------------------------------------------------------------------------

  private showPopup(element: HTMLElement, info: WhatsThisInfo): void {
    this.closePopup();

    this.helpPopup = document.createElement('div');
    this.helpPopup.className = 'whats-this-popup';

    const rect = element.getBoundingClientRect();

    this.helpPopup.style.cssText = `
      position: fixed;
      z-index: 100000;
      max-width: 400px;
      padding: 16px;
      background: var(--color-surface-1, #2a2a2a);
      color: var(--color-text-primary, #e0e0e0);
      border: 2px solid var(--color-accent, #4a9eff);
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      animation: popup-in 0.2s ease-out;
    `;

    // Position below element or above if not enough space
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow >= 200 || spaceBelow > spaceAbove) {
      this.helpPopup.style.top = `${rect.bottom + 8}px`;
    } else {
      this.helpPopup.style.bottom = `${window.innerHeight - rect.top + 8}px`;
    }

    // Center horizontally on element
    this.helpPopup.style.left = `${Math.max(8, Math.min(window.innerWidth - 408, rect.left + rect.width / 2 - 200))}px`;

    this.helpPopup.innerHTML = `
      <div class="whats-this-popup-content">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 12px;
        ">
          <h3 style="
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--color-accent, #4a9eff);
          ">
            ${this.escapeHTML(info.title)}
          </h3>
          <button class="close-button" style="
            background: none;
            border: none;
            color: var(--color-text-secondary, #888);
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
            padding: 0;
            width: 24px;
            height: 24px;
          ">×</button>
        </div>

        <p style="
          margin: 0 0 12px 0;
          font-size: 13px;
          line-height: 1.5;
          color: var(--color-text-primary, #e0e0e0);
        ">
          ${this.escapeHTML(info.description)}
        </p>

        ${info.shortcuts && info.shortcuts.length > 0
          ? `<div class="shortcuts" style="
               padding: 8px;
               background: var(--color-surface-0, #1a1a1a);
               border-radius: 4px;
               margin-bottom: 12px;
             ">
               <div style="
                 font-size: 11px;
                 font-weight: 600;
                 color: var(--color-text-secondary, #888);
                 margin-bottom: 6px;
               ">Keyboard Shortcuts</div>
               ${info.shortcuts.map((shortcut) => `
                 <div style="
                   font-size: 12px;
                   font-family: var(--font-mono, monospace);
                   color: var(--color-text-primary, #e0e0e0);
                   margin-bottom: 4px;
                 ">
                   ${this.escapeHTML(shortcut)}
                 </div>
               `).join('')}
             </div>`
          : ''
        }

        ${info.learnMoreUrl
          ? `<a href="${this.escapeHTML(info.learnMoreUrl)}" target="_blank" style="
               display: inline-block;
               color: var(--color-accent, #4a9eff);
               text-decoration: none;
               font-size: 12px;
               font-weight: 600;
             ">Learn more →</a>`
          : ''
        }
      </div>
    `;

    const closeButton = this.helpPopup.querySelector('.close-button');
    if (closeButton) {
      (closeButton as HTMLElement).onclick = () => this.closePopup();
    }

    document.body.appendChild(this.helpPopup);
  }

  private closePopup(): void {
    if (this.helpPopup) {
      this.helpPopup.remove();
      this.helpPopup = null;
    }
  }

  // --------------------------------------------------------------------------
  // KEYBOARD HANDLING
  // --------------------------------------------------------------------------

  private setupKeyboardListeners(): void {
    document.addEventListener('keydown', (event) => {
      // Check for activation key (e.g., Shift+F1)
      if (this.matchesActivationKey(event)) {
        event.preventDefault();
        this.toggle();
        return;
      }

      // Check for exit key (e.g., Escape)
      if (this.active && event.key === this.config.exitKey) {
        event.preventDefault();
        this.deactivate();
        return;
      }
    });
  }

  private matchesActivationKey(event: KeyboardEvent): boolean {
    const parts = this.config.activationKey.split('+');
    const key = parts[parts.length - 1];
    
    if (!key) {
      return false;
    }
    
    const modifiers = parts.slice(0, -1);

    if (event.key !== key && event.key !== key.toLowerCase()) {
      return false;
    }

    for (const mod of modifiers) {
      const modLower = mod.toLowerCase();
      if (modLower === 'shift' && !event.shiftKey) return false;
      if (modLower === 'ctrl' && !event.ctrlKey) return false;
      if (modLower === 'alt' && !event.altKey) return false;
      if (modLower === 'cmd' && !event.metaKey) return false;
    }

    return true;
  }

  // --------------------------------------------------------------------------
  // UTILITIES
  // --------------------------------------------------------------------------

  private escapeHTML(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --------------------------------------------------------------------------
  // LIFECYCLE
  // --------------------------------------------------------------------------

  destroy(): void {
    this.deactivate();
    this.elementMap.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let _instance: WhatsThisMode | null = null;

/**
 * Gets the singleton What's This? Mode instance.
 */
export function getWhatsThisMode(): WhatsThisMode {
  if (!_instance) {
    _instance = new WhatsThisMode();
    _instance.registerCommonElements();
  }
  return _instance;
}
