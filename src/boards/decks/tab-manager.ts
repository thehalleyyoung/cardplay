/**
 * @fileoverview Deck Tab Manager (E071-E076)
 *
 * Manages multiple tabs within a deck for multi-context workflows.
 * Enables pattern editors to have multiple patterns open, notation decks
 * to have multiple scores, etc.
 * 
 * B126: Treats deck IDs as stable tab IDs and uses DeckCardLayout semantics.
 *
 * @module @cardplay/boards/decks/tab-manager
 */

import type { DeckRuntimeState } from './runtime-types';
import type { DeckId, DeckCardLayout } from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * A tab within a deck.
 * 
 * B126: Tab ID is derived from deck ID for stability.
 */
export interface DeckTab {
  /** Unique tab ID (typically derived from DeckId) */
  id: string;
  /** Display label */
  label: string;
  /** Content identifier (e.g., streamId, clipId, scoreId) */
  contentId: string;
  /** Content type (e.g., 'stream', 'clip', 'score') */
  contentType: string;
  /** Whether tab has unsaved changes */
  dirty: boolean;
  /** Icon or emoji */
  icon?: string;
  /** Whether tab is closable */
  closable: boolean;
  /** Associated deck ID (B126) */
  deckId?: DeckId;
}

/**
 * Tab state for a deck.
 */
export interface DeckTabState {
  /** Active tab ID */
  activeTabId: string | null;
  /** All tabs in order */
  tabs: DeckTab[];
  /** Maximum tabs allowed (0 = unlimited) */
  maxTabs: number;
  /** B126: Layout mode for this deck's tabs */
  layoutMode?: DeckCardLayout;
}

// ============================================================================
// TAB MANAGER
// ============================================================================

/**
 * Creates default tab state.
 */
export function createDefaultTabState(maxTabs: number = 0): DeckTabState {
  return {
    activeTabId: null,
    tabs: [],
    maxTabs,
  };
}

/**
 * Adds a new tab to the deck.
 * E071: Per-deck tab stack behavior.
 */
export function addTab(
  state: DeckTabState,
  tab: Omit<DeckTab, 'id'> & { id?: string }
): DeckTabState {
  // Check max tabs limit
  if (state.maxTabs > 0 && state.tabs.length >= state.maxTabs) {
    return state; // Cannot add more tabs
  }

  // Generate ID if not provided
  const tabId = tab.id ?? `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const newTab: DeckTab = {
    id: tabId,
    label: tab.label,
    contentId: tab.contentId,
    contentType: tab.contentType,
    dirty: tab.dirty ?? false,
    ...(tab.icon !== undefined && { icon: tab.icon }),
    closable: tab.closable ?? true,
  };

  return {
    ...state,
    tabs: [...state.tabs, newTab],
    activeTabId: tabId, // Activate the new tab
  };
}

/**
 * Removes a tab from the deck.
 * E071: Per-deck tab stack behavior.
 */
export function removeTab(state: DeckTabState, tabId: string): DeckTabState {
  const tabIndex = state.tabs.findIndex(t => t.id === tabId);
  if (tabIndex === -1) return state;

  const newTabs = state.tabs.filter(t => t.id !== tabId);

  // If removing active tab, select adjacent tab
  let newActiveTabId = state.activeTabId;
  if (state.activeTabId === tabId) {
    if (newTabs.length > 0) {
      // Select previous tab if exists, otherwise next tab
      const prevTab = newTabs[tabIndex - 1];
      const nextTab = newTabs[tabIndex];
      newActiveTabId = prevTab?.id ?? nextTab?.id ?? null;
    } else {
      newActiveTabId = null;
    }
  }

  return {
    ...state,
    tabs: newTabs,
    activeTabId: newActiveTabId,
  };
}

/**
 * Sets the active tab.
 * E071: Per-deck tab stack behavior.
 */
export function setActiveTab(state: DeckTabState, tabId: string): DeckTabState {
  if (!state.tabs.some(t => t.id === tabId)) {
    return state; // Tab doesn't exist
  }

  return {
    ...state,
    activeTabId: tabId,
  };
}

/**
 * Updates a tab's properties.
 * E071: Per-deck tab stack behavior.
 */
export function updateTab(
  state: DeckTabState,
  tabId: string,
  updates: Partial<Omit<DeckTab, 'id'>>
): DeckTabState {
  return {
    ...state,
    tabs: state.tabs.map(tab =>
      tab.id === tabId ? { ...tab, ...updates } : tab
    ),
  };
}

/**
 * Reorders tabs by moving a tab to a new index.
 * E071: Per-deck tab stack behavior.
 */
export function reorderTab(
  state: DeckTabState,
  tabId: string,
  newIndex: number
): DeckTabState {
  const oldIndex = state.tabs.findIndex(t => t.id === tabId);
  if (oldIndex === -1 || oldIndex === newIndex) return state;

  const newTabs = [...state.tabs];
  const [movedTab] = newTabs.splice(oldIndex, 1);
  if (movedTab) {
    newTabs.splice(newIndex, 0, movedTab);
  }

  return {
    ...state,
    tabs: newTabs,
  };
}

/**
 * Gets the active tab.
 */
export function getActiveTab(state: DeckTabState): DeckTab | null {
  if (!state.activeTabId) return null;
  return state.tabs.find(t => t.id === state.activeTabId) ?? null;
}

/**
 * Checks if a content item is already open in a tab.
 */
export function hasTabForContent(
  state: DeckTabState,
  contentId: string,
  contentType: string
): boolean {
  return state.tabs.some(t => t.contentId === contentId && t.contentType === contentType);
}

/**
 * Gets tab for content if exists, otherwise creates a new one.
 * E072: Pattern editor tabs for multiple streams/patterns.
 */
export function getOrCreateTabForContent(
  state: DeckTabState,
  contentId: string,
  contentType: string,
  label: string,
  icon?: string
): DeckTabState {
  // Check if tab already exists
  const existingTab = state.tabs.find(
    t => t.contentId === contentId && t.contentType === contentType
  );

  if (existingTab) {
    return setActiveTab(state, existingTab.id);
  }

  // Create new tab
  return addTab(state, {
    label,
    contentId,
    contentType,
    dirty: false,
    ...(icon !== undefined && { icon }),
    closable: true,
  });
}

/**
 * Marks a tab as dirty (has unsaved changes).
 */
export function setTabDirty(
  state: DeckTabState,
  tabId: string,
  dirty: boolean
): DeckTabState {
  return updateTab(state, tabId, { dirty });
}

/**
 * Closes all tabs except the specified one.
 */
export function closeOtherTabs(state: DeckTabState, tabId: string): DeckTabState {
  const tabToKeep = state.tabs.find(t => t.id === tabId);
  if (!tabToKeep) return state;

  return {
    ...state,
    tabs: [tabToKeep],
    activeTabId: tabId,
  };
}

/**
 * Closes all tabs.
 */
export function closeAllTabs(state: DeckTabState): DeckTabState {
  return {
    ...state,
    tabs: [],
    activeTabId: null,
  };
}

// ============================================================================
// PERSISTENCE INTEGRATION
// ============================================================================

/**
 * Stores tab state in deck runtime state.
 * E076: Persist active deck tab per board.
 */
export function saveTabStateToDeckRuntime(
  deckState: DeckRuntimeState,
  tabState: DeckTabState
): DeckRuntimeState {
  return {
    ...deckState,
    activeTabId: tabState.activeTabId,
    customState: {
      ...deckState.customState,
      tabs: tabState.tabs,
      maxTabs: tabState.maxTabs,
    },
  };
}

/**
 * Loads tab state from deck runtime state.
 * E076: Persist active deck tab per board.
 */
export function loadTabStateFromDeckRuntime(
  deckState: DeckRuntimeState
): DeckTabState {
  const tabs = (deckState.customState.tabs as DeckTab[]) ?? [];
  const maxTabs = (deckState.customState.maxTabs as number) ?? 0;

  return {
    activeTabId: deckState.activeTabId,
    tabs,
    maxTabs,
  };
}

// ============================================================================
// KEYBOARD SHORTCUTS (E075)
// ============================================================================

/**
 * Handles Cmd+1..9 tab switching shortcuts.
 * E075: Deck tabs integrate with Cmd+1..9 shortcut scoping (active deck only).
 */
export function getTabByShortcutIndex(
  state: DeckTabState,
  index: number
): DeckTab | null {
  // Convert 1-based index to 0-based
  const tabIndex = index - 1;
  return state.tabs[tabIndex] ?? null;
}

/**
 * Switches to tab by shortcut number (1-9).
 * E075: Deck tabs integrate with Cmd+1..9 shortcut scoping.
 */
export function switchToTabByShortcut(
  state: DeckTabState,
  shortcutNum: number
): DeckTabState {
  const tab = getTabByShortcutIndex(state, shortcutNum);
  if (!tab) return state;

  return setActiveTab(state, tab.id);
}

// ============================================================================
// B126: DECK ID & LAYOUT INTEGRATION
// ============================================================================

/**
 * Creates a tab from a deck ID.
 * B126: Deck IDs serve as stable tab IDs.
 */
export function createTabFromDeckId(
  deckId: DeckId,
  label: string,
  contentId: string,
  contentType: string
): DeckTab {
  return {
    id: deckId,
    label,
    contentId,
    contentType,
    dirty: false,
    closable: false, // Deck tabs are typically not closable
    deckId,
  };
}

/**
 * Creates tab state with a specific layout mode.
 * B126: DeckCardLayout semantics determine tab behavior.
 */
export function createTabStateWithLayout(
  layoutMode: DeckCardLayout,
  maxTabs: number = 0
): DeckTabState {
  return {
    activeTabId: null,
    tabs: [],
    maxTabs,
    layoutMode,
  };
}

/**
 * Determines if tabs should be visible based on layout mode.
 * B126: Some layouts (stack, split) don't show tab bar.
 */
export function shouldShowTabBar(layoutMode: DeckCardLayout): boolean {
  switch (layoutMode) {
    case 'tabs':
      return true;
    case 'stack':
    case 'split':
    case 'floating':
    case 'grid':
      return false;
    default:
      return true; // Default to showing tabs
  }
}

/**
 * Get layout mode description for UI.
 * B126: DeckCardLayout semantics.
 */
export function getLayoutDescription(layoutMode: DeckCardLayout): string {
  switch (layoutMode) {
    case 'tabs':
      return 'Tabbed view - switch between decks using tabs';
    case 'stack':
      return 'Stacked view - decks layered vertically';
    case 'split':
      return 'Split view - decks side by side';
    case 'floating':
      return 'Floating view - deck in movable window';
    case 'grid':
      return 'Grid view - decks in a grid layout';
    default:
      return 'Default layout';
  }
}
