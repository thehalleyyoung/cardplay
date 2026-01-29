/**
 * @fileoverview Phrase Library Deck Factory
 *
 * E051-E054: Implement phrase-library deck factory with drag/drop and preview.
 *
 * Decision (E052): Using DOM-based phrase browser UI for better accessibility
 * and integration with existing UI components. Canvas may be added later for
 * performance if needed for large libraries.
 *
 * @module @cardplay/boards/decks/factories/phrase-library-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

/**
 * Phrase library deck factory.
 *
 * Provides phrase browsing with:
 * - Search and categorization
 * - Drag/drop support (E053)
 * - Preview playback (E054)
 * - Tag filtering
 */
export const phraseLibraryFactory: DeckFactory = {
  deckType: 'phrases-deck',

  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Phrases',
      render: () => {
        const container = document.createElement('div');
        container.className = 'deck-phrase-library';
        container.setAttribute('data-deck-id', deckDef.id);

        // TODO: Create phrase browser UI instance
        // TODO: Wire up drag/drop (E053)
        // TODO: Wire up preview playback (E054)
        container.textContent = 'Phrase Library (TODO: Wire up phrase-browser-ui.ts)';

        return container;
      },
    };
  },

  validate(_deckDef: BoardDeck): string | null {
    return null;
  },
};
