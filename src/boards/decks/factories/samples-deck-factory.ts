/**
 * @fileoverview Sample Browser Deck Factory
 *
 * E055: Implement sample-browser deck factory using sample-browser.ts.
 *
 * @module @cardplay/boards/decks/factories/samples-deck-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { createSampleBrowserPanel } from '../../../ui/components/sample-browser';

/**
 * Sample browser deck factory.
 *
 * Provides sample browsing with waveform preview and drag/drop support.
 */
export const sampleBrowserFactory: DeckFactory = {
  deckType: 'samples-deck',

  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Samples',
      render: () => {
        const container = document.createElement('div');
        container.className = 'deck-sample-browser';
        container.setAttribute('data-deck-id', deckDef.id);

        // Create sample browser panel (width, height)
        const panel = createSampleBrowserPanel(800, 600);
        
        // TODO: Wire up sample selection to active context
        // For now, just render the panel structure
        
        const panelElement = document.createElement('div');
        panelElement.textContent = 'Sample Browser - Width: ' + panel.width + ', Height: ' + panel.height;

        container.appendChild(panelElement);
        return container;
      },
    };
  },

  validate(_deckDef: BoardDeck): string | null {
    return null;
  },
};
