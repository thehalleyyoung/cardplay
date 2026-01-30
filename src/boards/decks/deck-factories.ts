/**
 * @fileoverview Deck Factories
 *
 * Registers factories for each DeckType.
 *
 * E011-E013: Create deck instances using factories + gating visibility.
 * Changes 192-194: DeckType metadata mappings.
 *
 * @module @cardplay/boards/decks/deck-factories
 */

import type { Board, BoardDeck, DeckType } from '../types';
import type { ActiveContext } from '../context/types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from './factory-types';
import { getDeckFactoryRegistry } from './factory-registry';

// ============================================================================
// DECK TYPE METADATA (Changes 192-194)
// ============================================================================

/**
 * Change 192: DeckType → default title mapping for stable UI titles.
 */
export const DECK_TYPE_TITLES: Readonly<Record<DeckType, string>> = {
  'pattern-deck': 'Pattern Editor',
  'piano-roll-deck': 'Piano Roll',
  'notation-deck': 'Notation',
  'arrangement-deck': 'Arrangement',
  'session-deck': 'Session',
  'instruments-deck': 'Instruments',
  'effects-deck': 'Effects',
  'samples-deck': 'Samples',
  'phrases-deck': 'Phrases',
  'harmony-deck': 'Harmony',
  'generators-deck': 'Generators',
  'mixer-deck': 'Mixer',
  'routing-deck': 'Routing',
  'automation-deck': 'Automation',
  'properties-deck': 'Properties',
  'ai-advisor-deck': 'AI Advisor',
  'sample-manager-deck': 'Sample Manager',
  'modulation-matrix-deck': 'Modulation Matrix',
  'transport-deck': 'Transport',
  'arranger-deck': 'Arranger',
  'dsp-chain': 'DSP Chain',
  'track-groups-deck': 'Track Groups',
  'mix-bus-deck': 'Mix Bus',
  'reference-track-deck': 'Reference Track',
  'spectrum-analyzer-deck': 'Spectrum Analyzer',
  'waveform-editor-deck': 'Waveform Editor',
  'registry-devtool-deck': 'Registry DevTool',
} as Record<DeckType, string>;

/**
 * Change 193: DeckType → default icon mapping for stable UI icons.
 */
export const DECK_TYPE_ICONS: Readonly<Record<DeckType, string>> = {
  'pattern-deck': '🎹',
  'piano-roll-deck': '🎼',
  'notation-deck': '📜',
  'arrangement-deck': '📐',
  'session-deck': '🎚️',
  'instruments-deck': '🎸',
  'effects-deck': '🎛️',
  'samples-deck': '🔊',
  'phrases-deck': '🎵',
  'harmony-deck': '🎶',
  'generators-deck': '⚡',
  'mixer-deck': '🎚️',
  'routing-deck': '🔀',
  'automation-deck': '📈',
  'properties-deck': '⚙️',
  'ai-advisor-deck': '🤖',
  'sample-manager-deck': '📁',
  'modulation-matrix-deck': '🔗',
  'transport-deck': '▶️',
  'arranger-deck': '📋',
  'dsp-chain': '🔧',
  'track-groups-deck': '📂',
  'mix-bus-deck': '🚌',
  'reference-track-deck': '👂',
  'spectrum-analyzer-deck': '📊',
  'waveform-editor-deck': '〰️',
  'registry-devtool-deck': '🔍',
} as Record<DeckType, string>;

/**
 * Change 194: DeckType → supportsSlotGrid mapping.
 * Only these DeckTypes instantiate DeckLayoutAdapter (slot-grid runtime).
 */
export const DECK_SUPPORTS_SLOT_GRID: Readonly<Record<DeckType, boolean>> = {
  'pattern-deck': true,
  'piano-roll-deck': true,
  'notation-deck': true,
  'arrangement-deck': false,
  'session-deck': true,
  'instruments-deck': true,
  'effects-deck': true,
  'samples-deck': false,
  'phrases-deck': false,
  'harmony-deck': true,
  'generators-deck': true,
  'mixer-deck': false,
  'routing-deck': false,
  'automation-deck': false,
  'properties-deck': false,
  'ai-advisor-deck': false,
  'sample-manager-deck': false,
  'modulation-matrix-deck': false,
  'transport-deck': false,
  'arranger-deck': false,
  'dsp-chain': true,
  'track-groups-deck': false,
  'mix-bus-deck': false,
  'reference-track-deck': false,
  'spectrum-analyzer-deck': false,
  'waveform-editor-deck': false,
  'registry-devtool-deck': false,
} as Record<DeckType, boolean>;

/**
 * Gets the default title for a DeckType.
 */
export function getDeckTypeTitle(deckType: DeckType): string {
  return DECK_TYPE_TITLES[deckType] ?? deckType;
}

/**
 * Gets the default icon for a DeckType.
 */
export function getDeckTypeIcon(deckType: DeckType): string {
  return DECK_TYPE_ICONS[deckType] ?? '📦';
}

/**
 * Returns true if the DeckType supports slot-grid (DeckLayoutAdapter).
 */
export function deckSupportsSlotGrid(deckType: DeckType): boolean {
  return DECK_SUPPORTS_SLOT_GRID[deckType] ?? false;
}

// ============================================================================
// CREATE DECK INSTANCES
// ============================================================================

/**
 * Creates deck instances for a board.
 *
 * E012: Use deck factories + gating visibility.
 */
export function createDeckInstances(
  board: Board,
  activeContext: ActiveContext
): DeckInstance[] {
  const registry = getDeckFactoryRegistry();
  const instances: DeckInstance[] = [];

  for (const deckDef of board.decks) {
    const factory = registry.getFactory(deckDef.type);
    if (!factory) {
      console.warn(`No factory registered for deck type: ${deckDef.type}`);
      continue;
    }

    // Create context
    const ctx: DeckFactoryContext = {
      activeContext,
      boardId: board.id,
      deckDef,
    };

    // Validate deck definition
    if (factory.validate) {
      const error = factory.validate(deckDef);
      if (error) {
        console.warn(`Invalid deck definition for ${deckDef.id}: ${error}`);
        continue;
      }
    }

    // Create instance
    try {
      const instance = factory.create(deckDef, ctx);
      instances.push(instance);
    } catch (err) {
      console.error(`Failed to create deck ${deckDef.id}:`, err);
    }
  }

  return instances;
}

/**
 * Validates that all deck types in a board have registered factories.
 *
 * E013: Validate board factories at runtime.
 */
export function validateBoardFactories(board: Board): string[] {
  const registry = getDeckFactoryRegistry();
  const errors: string[] = [];

  for (const deckDef of board.decks) {
    if (!registry.hasFactory(deckDef.type)) {
      errors.push(`Missing factory for deck type: ${deckDef.type} (deck: ${deckDef.id})`);
    }
  }

  return errors;
}

// ============================================================================
// STUB FACTORY
// ============================================================================

/**
 * Creates a stub factory for testing.
 */
export function createStubFactory(deckType: DeckType): DeckFactory {
  return {
    deckType,
    create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
      return {
        id: deckDef.id,
        type: deckDef.type,
        title: deckType,
        render: () => {
          const div = document.createElement('div');
          div.className = 'deck-stub';
          div.textContent = `Stub deck: ${deckType}`;
          return div;
        },
      };
    },
  };
}

/**
 * Registers stub factories for all known deck types.
 * Used for testing and development.
 */
export function registerStubFactories(): void {
  const registry = getDeckFactoryRegistry();
  const deckTypes: DeckType[] = [
    'pattern-deck',
    'piano-roll-deck',
    'notation-deck',
    'arrangement-deck',
    'session-deck',
    'instruments-deck',
    'effects-deck',
    'samples-deck',
    'phrases-deck',
    'harmony-deck',
    'generators-deck',
    'mixer-deck',
    'routing-deck',
    'automation-deck',
    'properties-deck',
    'ai-advisor-deck',
    'sample-manager-deck',
    'modulation-matrix-deck',
  ];

  for (const deckType of deckTypes) {
    if (!registry.hasFactory(deckType)) {
      registry.registerFactory(deckType, createStubFactory(deckType));
    }
  }
}
