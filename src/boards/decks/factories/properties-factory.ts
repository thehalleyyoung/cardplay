/**
 * @fileoverview Properties Panel Deck Factory
 *
 * Creates properties inspector deck instances.
 *
 * E047-E050: Implement DeckType: properties factory.
 *
 * @module @cardplay/boards/decks/factories/properties-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { PropertiesPanel } from '../../../ui/components/properties-panel';

// ============================================================================
// PROPERTIES FACTORY
// ============================================================================

/**
 * Factory for properties decks.
 *
 * E047-E050: Inspector for selection (event/clip/card) with full store integration.
 */
export const propertiesFactory: DeckFactory = {
  deckType: 'properties-deck',

  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    let panel: PropertiesPanel | null = null;

    const instance: DeckInstance = {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Properties',

      render: () => {
        // Create the real properties panel component
        // E047: Inspector for selection (event/clip/card)
        // E048: Show selected entity info
        // E049: Editing ClipRecord (name/color/loop) via ClipRegistry
        // E050: Edit Event payload fields via SharedEventStore (safe typed editing)
        panel = new PropertiesPanel({
          showClipProperties: true,
          showEventProperties: true,
          allowEditing: true,
        });

        return panel.getElement();
      },

      mount: (_container: HTMLElement) => {
        // Panel subscribes to stores on construction
        // No additional mount logic needed
      },

      unmount: () => {
        if (panel) {
          panel.destroy();
          panel = null;
        }
      },

      update: (_context) => {
        // Panel auto-updates via store subscriptions
        // No manual update needed
      },

      destroy: () => {
        if (panel) {
          panel.destroy();
          panel = null;
        }
      },
    };

    return instance;
  },

  validate(deckDef: BoardDeck): string | null {
    if (deckDef.type !== 'properties-deck') {
      return 'Deck type must be properties-deck';
    }
    return null;
  },
};
