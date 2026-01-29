/**
 * @fileoverview AI Advisor Context Menu Integration
 *
 * Provides utilities to add "Ask AI" context menu items to elements.
 * Supports right-click actions like "Explain this chord", "Suggest next chord", etc.
 *
 * @module @cardplay/ui/ai-context-menu
 * @see Phase L - L309-L310: Context menu integration
 */

import { openAIAdvisor } from './ai-advisor-integration.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Context menu item definition.
 */
export interface AIContextMenuItem {
  /** Label for the menu item */
  readonly label: string;

  /** Optional icon (emoji) */
  readonly icon?: string;

  /** Question to ask the AI */
  readonly question: string | ((element: HTMLElement) => string);

  /** Context data extractor */
  readonly extractContext?: (element: HTMLElement) => Record<string, unknown>;
}

/**
 * Configuration for AI context menu.
 */
export interface AIContextMenuConfig {
  /** Menu items to show */
  readonly items: readonly AIContextMenuItem[];

  /** CSS selector for elements that should show the menu */
  readonly selector?: string;

  /** Whether to prevent default context menu */
  readonly preventDefault?: boolean;
}

// ============================================================================
// CONTEXT DATA EXTRACTORS
// ============================================================================

/**
 * Extracts chord data from a chord element.
 * Looks for data-chord, data-root, data-quality attributes.
 */
export function extractChordContext(element: HTMLElement): Record<string, unknown> {
  const chord = element.dataset.chord || element.textContent?.trim();
  const root = element.dataset.root;
  const quality = element.dataset.quality;

  return {
    chord,
    root,
    quality,
    elementType: 'chord',
  };
}

/**
 * Extracts note/event data from an element.
 * Looks for data-note, data-pitch, data-velocity attributes.
 */
export function extractNoteContext(element: HTMLElement): Record<string, unknown> {
  const note = element.dataset.note;
  const pitch = element.dataset.pitch;
  const velocity = element.dataset.velocity;
  const duration = element.dataset.duration;

  return {
    note,
    pitch: pitch ? parseInt(pitch, 10) : undefined,
    velocity: velocity ? parseInt(velocity, 10) : undefined,
    duration: duration ? parseFloat(duration) : undefined,
    elementType: 'note',
  };
}

/**
 * Extracts pattern data from a pattern element.
 * Looks for data-pattern, data-pattern-id attributes.
 */
export function extractPatternContext(element: HTMLElement): Record<string, unknown> {
  const patternId = element.dataset.patternId || element.dataset.pattern;
  const name = element.dataset.name || element.textContent?.trim();

  return {
    patternId,
    name,
    elementType: 'pattern',
  };
}

/**
 * Extracts progression data from a progression element.
 * Looks for data-progression, data-chords attributes.
 */
export function extractProgressionContext(element: HTMLElement): Record<string, unknown> {
  const progression = element.dataset.progression;
  const chords = element.dataset.chords?.split(',').map(c => c.trim());

  return {
    progression,
    chords,
    elementType: 'progression',
  };
}

// ============================================================================
// BUILT-IN MENU ITEMS
// ============================================================================

/**
 * Standard "Ask AI" menu items for chord elements.
 */
export const CHORD_MENU_ITEMS: AIContextMenuItem[] = [
  {
    label: 'Ask AI about this chord',
    icon: '🤖',
    question: (el) => {
      const chord = el.dataset.chord || el.textContent?.trim() || 'this chord';
      return `What's special about ${chord}?`;
    },
    extractContext: extractChordContext,
  },
  {
    label: 'Suggest next chord',
    icon: '🎵',
    question: (el) => {
      const chord = el.dataset.chord || el.textContent?.trim() || 'this chord';
      return `What chord should come after ${chord}?`;
    },
    extractContext: extractChordContext,
  },
  {
    label: 'Explain voice leading',
    icon: '📊',
    question: (el) => {
      const chord = el.dataset.chord || el.textContent?.trim() || 'this chord';
      return `Explain voice leading options from ${chord}`;
    },
    extractContext: extractChordContext,
  },
];

/**
 * Standard "Ask AI" menu items for note/event elements.
 */
export const NOTE_MENU_ITEMS: AIContextMenuItem[] = [
  {
    label: 'Explain this note',
    icon: '🤖',
    question: (el) => {
      const note = el.dataset.note || 'this note';
      return `Explain the role of ${note} in this context`;
    },
    extractContext: extractNoteContext,
  },
  {
    label: 'Suggest melody continuation',
    icon: '🎼',
    question: () => 'What notes should come next in this melody?',
    extractContext: extractNoteContext,
  },
];

/**
 * Standard "Ask AI" menu items for pattern elements.
 */
export const PATTERN_MENU_ITEMS: AIContextMenuItem[] = [
  {
    label: 'Explain this pattern',
    icon: '🤖',
    question: () => 'Explain this pattern',
    extractContext: extractPatternContext,
  },
  {
    label: 'Suggest variations',
    icon: '🎲',
    question: () => 'Suggest variations of this pattern',
    extractContext: extractPatternContext,
  },
];

/**
 * Standard "Ask AI" menu items for progression elements.
 */
export const PROGRESSION_MENU_ITEMS: AIContextMenuItem[] = [
  {
    label: 'Analyze harmony',
    icon: '📊',
    question: () => 'Analyze this chord progression',
    extractContext: extractProgressionContext,
  },
  {
    label: 'Suggest reharmonization',
    icon: '🎹',
    question: () => 'Suggest reharmonization options',
    extractContext: extractProgressionContext,
  },
];

// ============================================================================
// CONTEXT MENU HANDLING
// ============================================================================

/**
 * Simple context menu element creator.
 */
function createContextMenu(
  items: readonly AIContextMenuItem[],
  element: HTMLElement,
  x: number,
  y: number
): HTMLElement {
  const menu = document.createElement('div');
  menu.className = 'ai-context-menu';
  menu.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    background: var(--cardplay-surface, #1e1e1e);
    border: 1px solid var(--cardplay-border, #333);
    border-radius: 6px;
    padding: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10001;
    min-width: 200px;
  `;

  for (const item of items) {
    const menuItem = document.createElement('div');
    menuItem.className = 'ai-context-menu-item';
    menuItem.style.cssText = `
      padding: 8px 12px;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--cardplay-text, #fff);
      font-size: 14px;
      transition: background 0.1s;
    `;

    if (item.icon) {
      const icon = document.createElement('span');
      icon.textContent = item.icon;
      menuItem.appendChild(icon);
    }

    const label = document.createElement('span');
    label.textContent = item.label;
    menuItem.appendChild(label);

    menuItem.addEventListener('mouseenter', () => {
      menuItem.style.background = 'var(--cardplay-hover, #333)';
    });

    menuItem.addEventListener('mouseleave', () => {
      menuItem.style.background = 'transparent';
    });

    menuItem.addEventListener('click', async (e) => {
      e.stopPropagation();

      // Get question
      const question =
        typeof item.question === 'function' ? item.question(element) : item.question;

      // Extract context
      const context = item.extractContext ? item.extractContext(element) : {};

      // Open AI Advisor
      openAIAdvisor({
        question,
        context,
      });

      // Remove menu
      menu.remove();
    });

    menu.appendChild(menuItem);
  }

  // Click anywhere to close
  const closeHandler = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      menu.remove();
      document.removeEventListener('click', closeHandler);
    }
  };

  setTimeout(() => {
    document.addEventListener('click', closeHandler);
  }, 0);

  return menu;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Adds AI context menu to an element.
 *
 * Example:
 * ```typescript
 * const chordElement = document.querySelector('.chord');
 * addAIContextMenu(chordElement, {
 *   items: CHORD_MENU_ITEMS,
 *   preventDefault: true,
 * });
 * ```
 *
 * @param element - The element to attach the menu to
 * @param config - Menu configuration
 */
export function addAIContextMenu(element: HTMLElement, config: AIContextMenuConfig): void {
  const handleContextMenu = (e: MouseEvent) => {
    if (config.preventDefault) {
      e.preventDefault();
    }

    // Remove any existing menu
    const existingMenu = document.querySelector('.ai-context-menu');
    existingMenu?.remove();

    // Create and show menu
    const menu = createContextMenu(config.items, element, e.clientX, e.clientY);
    document.body.appendChild(menu);
  };

  element.addEventListener('contextmenu', handleContextMenu);
}

/**
 * Adds AI context menu to multiple elements matching a selector.
 *
 * Example:
 * ```typescript
 * addAIContextMenuToAll('.chord', {
 *   items: CHORD_MENU_ITEMS,
 *   preventDefault: true,
 * });
 * ```
 *
 * @param selector - CSS selector for elements
 * @param config - Menu configuration
 */
export function addAIContextMenuToAll(selector: string, config: AIContextMenuConfig): void {
  const elements = document.querySelectorAll<HTMLElement>(selector);
  elements.forEach((el) => addAIContextMenu(el, config));
}

/**
 * Sets up AI context menus with a MutationObserver.
 * Automatically adds menus to new elements matching the selector.
 *
 * Example:
 * ```typescript
 * setupAIContextMenuObserver('.chord', {
 *   items: CHORD_MENU_ITEMS,
 *   preventDefault: true,
 * });
 * ```
 *
 * @param selector - CSS selector for elements
 * @param config - Menu configuration
 * @returns Cleanup function to stop observing
 */
export function setupAIContextMenuObserver(
  selector: string,
  config: AIContextMenuConfig
): () => void {
  // Add to existing elements
  addAIContextMenuToAll(selector, config);

  // Watch for new elements
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          if (node.matches(selector)) {
            addAIContextMenu(node, config);
          }
          // Check children
          const children = node.querySelectorAll<HTMLElement>(selector);
          children.forEach((el) => addAIContextMenu(el, config));
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return () => observer.disconnect();
}

/**
 * Initializes AI context menus for common element types.
 * This is a convenience function that sets up observers for chords, notes, patterns, etc.
 *
 * L309-L310: Context menu integration
 */
export function initializeAIContextMenus(): void {
  // Chord elements
  setupAIContextMenuObserver('.chord, [data-chord]', {
    items: CHORD_MENU_ITEMS,
    preventDefault: true,
  });

  // Note/event elements
  setupAIContextMenuObserver('.note, .event, [data-note]', {
    items: NOTE_MENU_ITEMS,
    preventDefault: true,
  });

  // Pattern elements
  setupAIContextMenuObserver('.pattern, [data-pattern]', {
    items: PATTERN_MENU_ITEMS,
    preventDefault: true,
  });

  // Progression elements
  setupAIContextMenuObserver('.progression, [data-progression]', {
    items: PROGRESSION_MENU_ITEMS,
    preventDefault: true,
  });
}
