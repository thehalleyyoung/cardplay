/**
 * @fileoverview Notation Deck Factory (E028-E030)
 * 
 * Creates notation score decks that bind to active stream context.
 * 
 * @module @cardplay/boards/decks/factories/notation-deck-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

/**
 * Factory for creating notation score deck instances.
 * Binds to ActiveContext.activeStreamId.
 */
export const notationDeckFactory: DeckFactory = {
  deckType: 'notation-deck',
  
  create(deckDef: BoardDeck, ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'notation-deck-container';
    container.setAttribute('data-deck-id', deckDef.id);
    container.setAttribute('data-deck-type', 'notation-deck');
    
    // Placeholder content - actual notation rendering will integrate
    // with src/notation/ modules in future iterations
    const header = document.createElement('div');
    header.className = 'notation-deck-header';
    header.textContent = 'Notation Score';
    
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 16px;
      background: var(--surface-base, #fff);
      border: 1px solid var(--border-base, #ccc);
      border-radius: 4px;
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      text-align: center;
      color: var(--text-secondary, #666);
    `;
    placeholder.innerHTML = `
      <p><strong>Notation Deck</strong></p>
      <p>Stream: ${ctx.activeContext.activeStreamId || 'None'}</p>
      <p style="font-size: 0.875rem; margin-top: 8px;">
        Notation rendering will integrate with<br>
        src/notation/panel.ts via notation-store-adapter.ts
      </p>
    `;
    
    content.appendChild(placeholder);
    container.appendChild(header);
    container.appendChild(content);
    
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Notation',
      render: () => container,
      destroy: () => {
        container.remove();
      }
    };
  }
};
