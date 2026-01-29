/**
 * @fileoverview Generator Deck Factory
 *
 * E056: Implement generator deck as a stack of generator cards.
 * G072-G078: Full generator UI with generate/regenerate/freeze/humanize/quantize
 *
 * @module @cardplay/boards/decks/factories/generator-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { createGeneratorPanel, injectGeneratorPanelStyles } from '../../../ui/components/generator-panel';

/**
 * Generator deck factory.
 *
 * Provides on-demand generation tools:
 * - Melody generator
 * - Bass generator
 * - Drum pattern generator
 * - Arpeggiator
 * 
 * With full post-processing:
 * - Generate into active stream or new clip
 * - Regenerate with undo support
 * - Humanize and quantize
 */
export const generatorFactory: DeckFactory = {
  deckType: 'generators-deck',

  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    // Inject styles on first use
    injectGeneratorPanelStyles();
    
    // Create full-featured generator panel
    const panel = createGeneratorPanel();

    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Generators',
      render: () => panel,
      mount: (target: HTMLElement) => {
        target.appendChild(panel);
      },
      unmount: () => {
        panel.remove();
      },
      destroy: () => {
        // Cleanup if needed
      },
    };
  },

  validate(_deckDef: BoardDeck): string | null {
    return null;
  },
};
