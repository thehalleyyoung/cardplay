/**
 * @fileoverview Instrument Browser Deck Factory
 *
 * Creates instrument browser deck instances.
 *
 * E039-E042: Implement DeckType: instrument-browser factory.
 *
 * @module @cardplay/boards/decks/factories/instruments-deck-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

// ============================================================================
// INSTRUMENT BROWSER FACTORY
// ============================================================================

/**
 * Factory for instrument-browser decks.
 *
 * E039: List instrument cards available to this board.
 */
export const instrumentBrowserFactory: DeckFactory = {
  deckType: 'instruments-deck',

  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    const instance: DeckInstance = {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Instruments',

      render: () => {
        const container = document.createElement('div');
        container.className = 'instrument-browser-deck';
        container.setAttribute('data-deck-id', deckDef.id);

        // Header
        const header = document.createElement('div');
        header.className = 'browser-header';
        header.style.padding = '8px';
        header.style.borderBottom = '1px solid #3e3e3e';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search instruments...';
        searchInput.className = 'browser-search';
        searchInput.style.width = '100%';
        searchInput.style.padding = '4px';
        header.appendChild(searchInput);

        container.appendChild(header);

        // E040: List of instruments (query allowed cards via Phase D gating)
        const list = document.createElement('div');
        list.className = 'browser-list';
        list.style.padding = '8px';

        // Stub instruments
        const instruments = [
          { name: 'Synth', category: 'Manual' },
          { name: 'Sampler', category: 'Manual' },
          { name: 'Drum Machine', category: 'Manual' },
          { name: 'Bass Synth', category: 'Manual' },
        ];

        instruments.forEach((inst) => {
          const item = document.createElement('div');
          item.className = 'browser-item';
          item.style.padding = '8px';
          item.style.cursor = 'pointer';
          item.style.borderBottom = '1px solid #2a2a2a';

          // E041: Drag payload "card template"
          item.draggable = true;
          item.ondragstart = (e) => {
            e.dataTransfer!.effectAllowed = 'copy';
            e.dataTransfer!.setData('application/x-card-template', JSON.stringify({
              type: inst.name.toLowerCase().replace(' ', '-'),
              defaultParams: {},
            }));
          };

          item.innerHTML = `
            <div style="font-weight: bold;">${inst.name}</div>
            <div style="font-size: 12px; color: #999;">${inst.category}</div>
          `;

          item.onmouseenter = () => {
            item.style.background = '#3a3a3a';
          };
          item.onmouseleave = () => {
            item.style.background = '';
          };

          list.appendChild(item);
        });

        container.appendChild(list);

        return container;
      },

      destroy: () => {
        // Cleanup if needed
      },
    };

    return instance;
  },

  validate(deckDef: BoardDeck): string | null {
    if (deckDef.type !== 'instruments-deck') {
      return 'Deck type must be instruments-deck';
    }
    return null;
  },
};
