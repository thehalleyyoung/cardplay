/**
 * @fileoverview Generator Deck Factory (Phase G)
 * 
 * Factory for creating generator deck instances in assisted boards.
 * Implements G068 and G072-G081 requirements.
 * 
 * @module @cardplay/boards/decks/generators-factory
 */

import type { DeckFactory, DeckInstance } from './factory-types';
import type { BoardDeck } from '../types';
import { GeneratorDeck } from '../../ui/components/generator-deck';

/**
 * Generator deck factory
 * 
 * Creates on-demand generator UI for assisted boards.
 * Used by Session + Generators board and other assisted workflows.
 */
export const generatorsDeckFactory: DeckFactory = {
  deckType: 'generators-deck',
  
  create(deckDef: BoardDeck, _ctx): DeckInstance {
    let generatorDeck: GeneratorDeck | null = null;
    
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Generators',
      
      render(): HTMLElement | null {
        const container = document.createElement('div');
        generatorDeck = new GeneratorDeck(container);
        return container;
      },
      
      mount(target: HTMLElement): void {
        const el = this.render();
        if (el) target.appendChild(el);
      },
      
      unmount(): void {
        // Handled by destroy
      },
      
      destroy(): void {
        if (generatorDeck) {
          generatorDeck.destroy();
          generatorDeck = null;
        }
      }
    };
  },
  
  validate(_deckDef: BoardDeck): string | null {
    return null;
  }
};
