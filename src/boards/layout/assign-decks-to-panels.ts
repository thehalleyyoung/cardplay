/**
 * @fileoverview Assign Decks to Panels
 * 
 * Builds panel tab order from BoardDeck.panelId and DeckCardLayout semantics.
 * 
 * B124: Determines which decks appear in which panels and in what order.
 * 
 * @module @cardplay/boards/layout/assign-decks-to-panels
 */

import type { Board, BoardDeck, DeckCardLayout, DeckId } from '../types';
import type { PanelRuntime } from './runtime-types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of deck assignment to panels.
 */
export interface DeckPanelAssignment {
  /** Deck ID */
  readonly deckId: DeckId;
  /** Panel ID the deck belongs to */
  readonly panelId: string;
  /** Position in the panel's tab order */
  readonly tabIndex: number;
  /** Layout mode for this deck */
  readonly layout: DeckCardLayout;
}

/**
 * Panel with its assigned decks.
 */
export interface PanelDeckAssignment {
  /** Panel ID */
  readonly panelId: string;
  /** Ordered list of deck IDs in this panel */
  readonly deckIds: readonly DeckId[];
  /** Map of deck ID to layout mode */
  readonly layoutModes: ReadonlyMap<DeckId, DeckCardLayout>;
}

// ============================================================================
// ASSIGNMENT LOGIC
// ============================================================================

/**
 * Assign decks to panels based on BoardDeck.panelId.
 * 
 * Decks are ordered by their position in board.decks array.
 * Decks without panelId are assigned to the first center panel.
 * 
 * @param board - Board definition
 * @returns Map of panel ID to deck assignments
 */
export function assignDecksToPanels(board: Board): Map<string, PanelDeckAssignment> {
  const assignments = new Map<string, PanelDeckAssignment>();
  
  // Get all panel IDs from layout
  const panelIds = new Set<string>();
  for (const panel of board.layout.panels) {
    panelIds.add(panel.id);
    assignments.set(panel.id, {
      panelId: panel.id,
      deckIds: [],
      layoutModes: new Map(),
    });
  }
  
  // Find default panel (first center panel, or first panel)
  const centerPanel = board.layout.panels.find(p => p.position === 'center');
  const defaultPanelId = centerPanel?.id ?? board.layout.panels[0]?.id ?? 'default';
  
  // Ensure default panel exists in assignments
  if (!assignments.has(defaultPanelId)) {
    assignments.set(defaultPanelId, {
      panelId: defaultPanelId,
      deckIds: [],
      layoutModes: new Map(),
    });
  }
  
  // Assign each deck to its panel
  for (const deck of board.decks) {
    const targetPanelId = deck.panelId ?? defaultPanelId;
    
    // Get or create assignment for this panel
    let assignment = assignments.get(targetPanelId);
    if (!assignment) {
      // Panel doesn't exist in layout - warn and use default
      console.warn(
        `[DeckAssignment] Deck "${deck.id}" references non-existent panel "${targetPanelId}", ` +
        `assigning to "${defaultPanelId}"`
      );
      assignment = assignments.get(defaultPanelId)!;
    }
    
    // Add deck to panel
    const deckIds = [...assignment.deckIds, deck.id as DeckId];
    const layoutModes = new Map(assignment.layoutModes);
    layoutModes.set(deck.id as DeckId, deck.cardLayout);
    
    assignments.set(assignment.panelId, {
      panelId: assignment.panelId,
      deckIds,
      layoutModes,
    });
  }
  
  return assignments;
}

/**
 * Get flat list of all deck-panel assignments.
 * 
 * @param board - Board definition
 * @returns Array of individual deck assignments
 */
export function getAllDeckAssignments(board: Board): readonly DeckPanelAssignment[] {
  const panelAssignments = assignDecksToPanels(board);
  const result: DeckPanelAssignment[] = [];
  
  for (const [panelId, assignment] of panelAssignments) {
    assignment.deckIds.forEach((deckId, tabIndex) => {
      result.push({
        deckId,
        panelId,
        tabIndex,
        layout: assignment.layoutModes.get(deckId) ?? 'tabs',
      });
    });
  }
  
  return result;
}

/**
 * Update panel runtime with assigned decks.
 * 
 * Sets tabOrder and activeTabId on the panel runtime.
 * 
 * @param panel - Panel runtime to update
 * @param assignment - Deck assignment for this panel
 * @returns Updated panel runtime
 */
export function updatePanelWithDecks(
  panel: PanelRuntime,
  assignment: PanelDeckAssignment
): PanelRuntime {
  const tabOrder = assignment.deckIds.map(id => id as string);
  
  // Set active tab to first deck if not already set
  const activeTabId = panel.activeTabId ?? tabOrder[0] ?? null;
  
  return {
    ...panel,
    tabOrder,
    activeTabId,
  };
}

/**
 * Get the layout mode for a deck in a panel.
 * 
 * @param deck - Board deck definition
 * @returns DeckCardLayout mode
 */
export function getDeckLayoutMode(deck: BoardDeck): DeckCardLayout {
  return deck.cardLayout;
}
