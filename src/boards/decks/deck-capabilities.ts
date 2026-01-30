/**
 * @fileoverview Deck Capability Table
 * 
 * Defines capabilities for each DeckType:
 * - readsSpec: Deck queries MusicSpec for display/validation
 * - writesSpec: Deck modifies MusicSpec (through theory cards or constraints)
 * - requestsProlog: Deck triggers AI queries (suggestions, validation)
 * - supportsSlotGrid: Deck uses DeckLayoutAdapter for card layout
 * 
 * This table drives AI query routing and deck factory selection.
 * 
 * @module @cardplay/boards/decks/deck-capabilities
 */

import type { DeckType } from '../types';

/**
 * Capabilities for a deck type.
 */
export interface DeckCapabilities {
  /** Deck reads MusicSpec for display or validation */
  readonly readsSpec: boolean;
  /** Deck modifies MusicSpec (via theory cards or constraints) */
  readonly writesSpec: boolean;
  /** Deck triggers Prolog queries for AI suggestions */
  readonly requestsProlog: boolean;
  /** Deck uses DeckLayoutAdapter (slot-grid runtime) for card layout */
  readonly supportsSlotGrid: boolean;
}

/**
 * Capability table mapping DeckType to its capabilities.
 * 
 * This is the SSOT for deck/AI integration behavior.
 */
export const DECK_CAPABILITIES: Record<DeckType, DeckCapabilities> = {
  // Pattern/tracking decks
  'pattern-deck': {
    readsSpec: true,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: true,
  },
  'phrases-deck': {
    readsSpec: true,
    writesSpec: false,
    requestsProlog: true, // phrase generation
    supportsSlotGrid: true,
  },

  // Notation decks
  'notation-deck': {
    readsSpec: true,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },

  // Piano roll
  'piano-roll-deck': {
    readsSpec: true,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },

  // Session/arrangement
  'session-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },
  'arrangement-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },
  'arranger-deck': {
    readsSpec: true,
    writesSpec: false,
    requestsProlog: true, // arrangement suggestions
    supportsSlotGrid: false,
  },

  // Audio/mixing
  'mixer-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },
  'mix-bus-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },
  'effects-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: true,
  },
  'dsp-chain': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: true,
  },

  // Browser/library decks
  'instruments-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },
  'samples-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },
  'sample-manager-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },

  // Theory/harmony decks
  'harmony-deck': {
    readsSpec: true,
    writesSpec: true, // applies theory cards
    requestsProlog: true, // harmony suggestions
    supportsSlotGrid: true,
  },
  'generators-deck': {
    readsSpec: true,
    writesSpec: false,
    requestsProlog: true, // generation suggestions
    supportsSlotGrid: true,
  },

  // AI decks
  'ai-advisor-deck': {
    readsSpec: true,
    writesSpec: false,
    requestsProlog: true, // main AI query deck
    supportsSlotGrid: false,
  },
  'ai-composer-deck': {
    readsSpec: true,
    writesSpec: true, // modifies spec via composition
    requestsProlog: true,
    supportsSlotGrid: false,
  },

  // Utility decks
  'transport-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },
  'routing-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },
  'modulation-matrix-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: true,
  },
  'automation-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },
  'properties-deck': {
    readsSpec: true,
    writesSpec: true,
    requestsProlog: false,
    supportsSlotGrid: false,
  },
  'track-groups-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },
  'reference-track-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },
  'spectrum-analyzer-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },
  'waveform-editor-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },
  'registry-devtool-deck': {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  },
};

/**
 * Get capabilities for a deck type.
 * 
 * @param deckType - The deck type
 * @returns Deck capabilities or default (no capabilities)
 */
export function getDeckCapabilities(deckType: DeckType): DeckCapabilities {
  return DECK_CAPABILITIES[deckType] ?? {
    readsSpec: false,
    writesSpec: false,
    requestsProlog: false,
    supportsSlotGrid: false,
  };
}

/**
 * Check if a deck type reads MusicSpec.
 */
export function deckReadsSpec(deckType: DeckType): boolean {
  return getDeckCapabilities(deckType).readsSpec;
}

/**
 * Check if a deck type writes to MusicSpec.
 */
export function deckWritesSpec(deckType: DeckType): boolean {
  return getDeckCapabilities(deckType).writesSpec;
}

/**
 * Check if a deck type triggers Prolog queries.
 */
export function deckRequestsProlog(deckType: DeckType): boolean {
  return getDeckCapabilities(deckType).requestsProlog;
}

/**
 * Check if a deck type supports slot-grid layout.
 */
export function deckSupportsSlotGrid(deckType: DeckType): boolean {
  return getDeckCapabilities(deckType).supportsSlotGrid;
}

/**
 * Get all deck types with a specific capability.
 */
export function getDeckTypesWithCapability(
  capability: keyof DeckCapabilities
): DeckType[] {
  return Object.entries(DECK_CAPABILITIES)
    .filter(([_, caps]) => caps[capability])
    .map(([deckType]) => deckType as DeckType);
}
