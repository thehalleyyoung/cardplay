/**
 * @fileoverview Contextual Tooltips System
 * 
 * Implements P113-P114:
 * - Context-sensitive help throughout app
 * - Tooltips for all non-obvious UI elements
 * - Beautiful, informative hints
 * 
 * Features:
 * - Smart tooltip positioning (avoids screen edges)
 * - Rich content (icons, shortcuts, descriptions)
 * - Delay and fade animations
 * - Accessibility (ARIA labels)
 * - Keyboard navigation hints
 * 
 * @module @cardplay/ui/components/contextual-tooltips
 */

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface TooltipConfig {
  readonly title: string;
  readonly description?: string;
  readonly shortcut?: string;
  readonly learnMoreUrl?: string;
  readonly icon?: string;
  readonly position?: 'top' | 'right' | 'bottom' | 'left' | 'auto';
  readonly delay?: number;
  readonly maxWidth?: number;
  readonly showOnFocus?: boolean;
}

export interface TooltipElement {
  readonly element: HTMLElement;
  readonly config: TooltipConfig;
  tooltip: HTMLDivElement | null;
  timeout: number | null;
}

// --------------------------------------------------------------------------
// Global Registry
// --------------------------------------------------------------------------

const tooltips = new Map<HTMLElement, TooltipElement>();

// --------------------------------------------------------------------------
// Tooltip Manager
// --------------------------------------------------------------------------

export class ContextualTooltipManager {
  private static instance: ContextualTooltipManager;
  private container: HTMLDivElement | null = null;
  private stylesInjected = false;

  private constructor() {}

  public static getInstance(): ContextualTooltipManager {
    if (!ContextualTooltipManager.instance) {
      ContextualTooltipManager.instance = new ContextualTooltipManager();
    }
    return ContextualTooltipManager.instance;
  }

  /**
   * Register a tooltip for an element
   */
  public register(element: HTMLElement, config: TooltipConfig): void {
    if (tooltips.has(element)) {
      this.unregister(element);
    }

    const tooltipElement: TooltipElement = {
      element,
      config,
      tooltip: null,
      timeout: null
    };

    tooltips.set(element, tooltipElement);

    // Add event listeners
    element.addEventListener('mouseenter', () => this.showTooltip(element));
    element.addEventListener('mouseleave', () => this.hideTooltip(element));
    
    if (config.showOnFocus !== false) {
      element.addEventListener('focus', () => this.showTooltip(element));
      element.addEventListener('blur', () => this.hideTooltip(element));
    }

    // Add ARIA attributes
    if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
      element.setAttribute('aria-label', config.title);
    }
    if (config.description) {
      element.setAttribute('aria-describedby', `tooltip-${this.getElementId(element)}`);
    }
  }

  /**
   * Unregister a tooltip
   */
  public unregister(element: HTMLElement): void {
    const tooltipElement = tooltips.get(element);
    if (!tooltipElement) return;

    if (tooltipElement.timeout) {
      clearTimeout(tooltipElement.timeout);
    }
    
    if (tooltipElement.tooltip) {
      tooltipElement.tooltip.remove();
    }

    tooltips.delete(element);
  }

  /**
   * Show tooltip for element
   */
  private showTooltip(element: HTMLElement): void {
    const tooltipElement = tooltips.get(element);
    if (!tooltipElement) return;

    const delay = tooltipElement.config.delay ?? 500;

    tooltipElement.timeout = window.setTimeout(() => {
      this.renderTooltip(tooltipElement);
    }, delay);
  }

  /**
   * Hide tooltip for element
   */
  private hideTooltip(element: HTMLElement): void {
    const tooltipElement = tooltips.get(element);
    if (!tooltipElement) return;

    if (tooltipElement.timeout) {
      clearTimeout(tooltipElement.timeout);
      tooltipElement.timeout = null;
    }

    if (tooltipElement.tooltip) {
      tooltipElement.tooltip.classList.remove('contextual-tooltip--visible');
      
      setTimeout(() => {
        if (tooltipElement.tooltip) {
          tooltipElement.tooltip.remove();
          tooltipElement.tooltip = null;
        }
      }, 200);
    }
  }

  /**
   * Render tooltip
   */
  private renderTooltip(tooltipElement: TooltipElement): void {
    this.ensureContainer();
    this.ensureStyles();

    const { element, config } = tooltipElement;
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'contextual-tooltip';
    tooltip.id = `tooltip-${this.getElementId(element)}`;
    tooltip.setAttribute('role', 'tooltip');
    
    if (config.maxWidth) {
      tooltip.style.maxWidth = `${config.maxWidth}px`;
    }

    // Header with icon and title
    const header = document.createElement('div');
    header.className = 'contextual-tooltip__header';
    
    if (config.icon) {
      const icon = document.createElement('span');
      icon.className = 'contextual-tooltip__icon';
      icon.textContent = config.icon;
      header.appendChild(icon);
    }
    
    const title = document.createElement('span');
    title.className = 'contextual-tooltip__title';
    title.textContent = config.title;
    header.appendChild(title);
    
    tooltip.appendChild(header);

    // Description
    if (config.description) {
      const description = document.createElement('div');
      description.className = 'contextual-tooltip__description';
      description.textContent = config.description;
      tooltip.appendChild(description);
    }

    // Shortcut
    if (config.shortcut) {
      const shortcut = document.createElement('div');
      shortcut.className = 'contextual-tooltip__shortcut';
      shortcut.innerHTML = `<kbd>${this.formatShortcut(config.shortcut)}</kbd>`;
      tooltip.appendChild(shortcut);
    }

    // Learn more link
    if (config.learnMoreUrl) {
      const learnMore = document.createElement('a');
      learnMore.className = 'contextual-tooltip__learn-more';
      learnMore.href = config.learnMoreUrl;
      learnMore.textContent = 'Learn more →';
      learnMore.target = '_blank';
      learnMore.rel = 'noopener noreferrer';
      tooltip.appendChild(learnMore);
    }

    // Add arrow
    const arrow = document.createElement('div');
    arrow.className = 'contextual-tooltip__arrow';
    tooltip.appendChild(arrow);

    // Add to container
    if (this.container) {
      this.container.appendChild(tooltip);
    }

    // Position tooltip
    this.positionTooltip(tooltip, element, config.position || 'auto');

    // Show tooltip
    requestAnimationFrame(() => {
      tooltip.classList.add('contextual-tooltip--visible');
    });

    tooltipElement.tooltip = tooltip;
  }

  /**
   * Position tooltip relative to element
   */
  private positionTooltip(
    tooltip: HTMLDivElement,
    target: HTMLElement,
    position: 'top' | 'right' | 'bottom' | 'left' | 'auto'
  ): void {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 8;

    let finalPosition = position;

    // Auto-detect best position
    if (position === 'auto') {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      const spaceTop = targetRect.top;
      const spaceBottom = viewportHeight - targetRect.bottom;
      const spaceLeft = targetRect.left;
      const spaceRight = viewportWidth - targetRect.right;

      const spaces = [
        { pos: 'top', space: spaceTop },
        { pos: 'bottom', space: spaceBottom },
        { pos: 'left', space: spaceLeft },
        { pos: 'right', space: spaceRight }
      ];

      spaces.sort((a, b) => b.space - a.space);
      if (spaces[0]) {
        finalPosition = spaces[0].pos as any;
      }
    }

    tooltip.setAttribute('data-position', finalPosition);

    let left = 0;
    let top = 0;

    switch (finalPosition) {
      case 'top':
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        top = targetRect.top - tooltipRect.height - margin;
        break;
      case 'bottom':
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        top = targetRect.bottom + margin;
        break;
      case 'left':
        left = targetRect.left - tooltipRect.width - margin;
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        break;
      case 'right':
        left = targetRect.right + margin;
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        break;
    }

    // Keep within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = tooltipRect.width;

    if (left < margin) left = margin;
    if (left + width > viewportWidth - margin) {
      left = viewportWidth - width - margin;
    }
    if (top < margin) top = margin;
    if (top + tooltipRect.height > viewportHeight - margin) {
      top = viewportHeight - tooltipRect.height - margin;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  /**
   * Format keyboard shortcut for display
   */
  private formatShortcut(shortcut: string): string {
    return shortcut
      .replace(/Cmd/g, '⌘')
      .replace(/Ctrl/g, 'Ctrl')
      .replace(/Alt/g, '⌥')
      .replace(/Shift/g, '⇧')
      .replace(/\+/g, '</kbd> + <kbd>');
  }

  /**
   * Get or create element ID
   */
  private getElementId(element: HTMLElement): string {
    if (element.id) return element.id;
    const id = `tooltip-target-${Math.random().toString(36).substr(2, 9)}`;
    element.id = id;
    return id;
  }

  /**
   * Ensure container exists
   */
  private ensureContainer(): void {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'contextual-tooltips-container';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Inject styles
   */
  private ensureStyles(): void {
    if (this.stylesInjected) return;

    const style = document.createElement('style');
    style.textContent = `
      .contextual-tooltips-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10000;
      }

      .contextual-tooltip {
        position: absolute;
        background: var(--surface-elevated, #2a2a2a);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        max-width: 280px;
        opacity: 0;
        transform: scale(0.95);
        transition: opacity 0.2s, transform 0.2s;
        pointer-events: auto;
        font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
        font-size: 14px;
        line-height: 1.4;
        color: var(--text-primary, #ffffff);
      }

      .contextual-tooltip--visible {
        opacity: 1;
        transform: scale(1);
      }

      .contextual-tooltip__header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .contextual-tooltip__icon {
        font-size: 16px;
        line-height: 1;
      }

      .contextual-tooltip__title {
        font-weight: 600;
        color: var(--text-primary, #ffffff);
      }

      .contextual-tooltip__description {
        color: var(--text-secondary, rgba(255, 255, 255, 0.7));
        margin-bottom: 8px;
      }

      .contextual-tooltip__shortcut {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
        font-size: 12px;
        color: var(--text-tertiary, rgba(255, 255, 255, 0.5));
      }

      .contextual-tooltip__shortcut kbd {
        display: inline-block;
        padding: 2px 6px;
        background: var(--surface-sunken, rgba(0, 0, 0, 0.2));
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
        border-radius: 4px;
        font-family: var(--font-mono, 'SF Mono', Menlo, Monaco, monospace);
        font-size: 11px;
        font-weight: 600;
      }

      .contextual-tooltip__learn-more {
        display: inline-block;
        margin-top: 8px;
        color: var(--accent, #4a9eff);
        text-decoration: none;
        font-size: 12px;
        font-weight: 500;
        transition: color 0.2s;
      }

      .contextual-tooltip__learn-more:hover {
        color: var(--accent-hover, #6bb0ff);
        text-decoration: underline;
      }

      .contextual-tooltip__arrow {
        position: absolute;
        width: 8px;
        height: 8px;
        background: var(--surface-elevated, #2a2a2a);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
        transform: rotate(45deg);
      }

      .contextual-tooltip[data-position="top"] .contextual-tooltip__arrow {
        bottom: -5px;
        left: 50%;
        margin-left: -4px;
        border-top: none;
        border-left: none;
      }

      .contextual-tooltip[data-position="bottom"] .contextual-tooltip__arrow {
        top: -5px;
        left: 50%;
        margin-left: -4px;
        border-bottom: none;
        border-right: none;
      }

      .contextual-tooltip[data-position="left"] .contextual-tooltip__arrow {
        right: -5px;
        top: 50%;
        margin-top: -4px;
        border-left: none;
        border-bottom: none;
      }

      .contextual-tooltip[data-position="right"] .contextual-tooltip__arrow {
        left: -5px;
        top: 50%;
        margin-top: -4px;
        border-right: none;
        border-top: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .contextual-tooltip {
          transition: opacity 0.1s;
        }
      }

      /* High contrast mode */
      @media (prefers-contrast: high) {
        .contextual-tooltip {
          border: 2px solid currentColor;
        }
        
        .contextual-tooltip__shortcut kbd {
          border: 2px solid currentColor;
        }
      }
    `;
    document.head.appendChild(style);
    this.stylesInjected = true;
  }

  /**
   * Cleanup all tooltips
   */
  public cleanup(): void {
    tooltips.forEach((tooltipElement) => {
      if (tooltipElement.timeout) {
        clearTimeout(tooltipElement.timeout);
      }
      if (tooltipElement.tooltip) {
        tooltipElement.tooltip.remove();
      }
    });
    
    tooltips.clear();

    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}

// --------------------------------------------------------------------------
// Convenience Functions
// --------------------------------------------------------------------------

/**
 * Register a tooltip for an element
 */
export function addTooltip(element: HTMLElement, config: TooltipConfig): void {
  ContextualTooltipManager.getInstance().register(element, config);
}

/**
 * Remove a tooltip from an element
 */
export function removeTooltip(element: HTMLElement): void {
  ContextualTooltipManager.getInstance().unregister(element);
}

// --------------------------------------------------------------------------
// Pre-configured Tooltips
// --------------------------------------------------------------------------

/**
 * Common tooltip configurations for standard UI elements
 */
export const COMMON_TOOLTIPS: Record<string, TooltipConfig> = {
  'board-switcher': {
    title: 'Board Switcher',
    description: 'Switch between different workflow boards with varying levels of AI assistance.',
    shortcut: 'Cmd+B',
    icon: '🎚️'
  },
  'play-button': {
    title: 'Play',
    description: 'Start playback from current position.',
    shortcut: 'Space',
    icon: '▶️'
  },
  'stop-button': {
    title: 'Stop',
    description: 'Stop playback and return to start.',
    shortcut: 'Space',
    icon: '⏹️'
  },
  'record-button': {
    title: 'Record',
    description: 'Enable recording. Play notes to capture them.',
    shortcut: 'Cmd+R',
    icon: '🔴'
  },
  'undo-button': {
    title: 'Undo',
    description: 'Undo the last action. All changes are undoable!',
    shortcut: 'Cmd+Z',
    icon: '↶'
  },
  'redo-button': {
    title: 'Redo',
    description: 'Redo the last undone action.',
    shortcut: 'Cmd+Shift+Z',
    icon: '↷'
  },
  'tempo-control': {
    title: 'Tempo',
    description: 'Adjust playback tempo in BPM (beats per minute).',
    icon: '🥁'
  },
  'time-signature': {
    title: 'Time Signature',
    description: 'Set the meter (beats per measure).',
    icon: '📊'
  },
  'quantize': {
    title: 'Quantize',
    description: 'Align notes to the grid for perfect timing.',
    shortcut: 'Cmd+Q',
    icon: '📐'
  },
  'routing-overlay': {
    title: 'Show Routing',
    description: 'Visualize audio/MIDI/modulation connections between decks.',
    shortcut: 'Cmd+Shift+R',
    icon: '🔌'
  },
  'help': {
    title: 'Help',
    description: 'Open the help browser for documentation and tutorials.',
    shortcut: 'Cmd+?',
    icon: '❓'
  },
  'command-palette': {
    title: 'Command Palette',
    description: 'Access all actions and commands via search.',
    shortcut: 'Cmd+K',
    icon: '🔍'
  },
  'freeze-track': {
    title: 'Freeze Track',
    description: 'Lock AI-generated content to prevent regeneration.',
    shortcut: 'Cmd+Shift+F',
    icon: '❄️'
  },
  'phrase-library': {
    title: 'Phrase Library',
    description: 'Browse and drag musical phrases into your composition.',
    icon: '📚'
  },
  'properties-panel': {
    title: 'Properties',
    description: 'View and edit properties of selected items.',
    shortcut: 'Cmd+I',
    icon: '🔧'
  },
  'mixer': {
    title: 'Mixer',
    description: 'Balance levels, pan, and apply effects to all tracks.',
    icon: '🎛️'
  },
  'dsp-chain': {
    title: 'Effects Chain',
    description: 'Add and configure audio effects for the selected track.',
    shortcut: 'Cmd+Shift+E',
    icon: '🎚️'
  }
};

/**
 * Auto-initialize tooltips on common elements
 */
export function initializeCommonTooltips(): void {
  const manager = ContextualTooltipManager.getInstance();

  // Map of selectors to tooltip configs
  const mappings: Record<string, TooltipConfig | undefined> = {
    '.board-switcher-button': COMMON_TOOLTIPS['board-switcher'],
    '.transport-play-button': COMMON_TOOLTIPS['play-button'],
    '.transport-stop-button': COMMON_TOOLTIPS['stop-button'],
    '.transport-record-button': COMMON_TOOLTIPS['record-button'],
    '.undo-button': COMMON_TOOLTIPS['undo-button'],
    '.redo-button': COMMON_TOOLTIPS['redo-button'],
    '.tempo-input': COMMON_TOOLTIPS['tempo-control'],
    '.time-signature-input': COMMON_TOOLTIPS['time-signature'],
    '.quantize-button': COMMON_TOOLTIPS['quantize'],
    '.routing-overlay-button': COMMON_TOOLTIPS['routing-overlay'],
    '.help-button': COMMON_TOOLTIPS['help'],
    '.command-palette-button': COMMON_TOOLTIPS['command-palette'],
    '.freeze-track-button': COMMON_TOOLTIPS['freeze-track'],
    '.phrase-library-deck': COMMON_TOOLTIPS['phrase-library'],
    '.properties-panel': COMMON_TOOLTIPS['properties-panel'],
    '.mixer-deck': COMMON_TOOLTIPS['mixer'],
    '.dsp-chain-deck': COMMON_TOOLTIPS['dsp-chain']
  };

  // Register all common tooltips
  Object.entries(mappings).forEach(([selector, config]) => {
    if (config) {
      document.querySelectorAll(selector).forEach((element) => {
        manager.register(element as HTMLElement, config);
      });
    }
  });
}
