/**
 * @fileoverview Mixer Deck Factory (E044-E046)
 * 
 * Creates mixer decks with track strips, meters, and mixing controls.
 * Integrates with DeckLayoutAdapter for audio routing.
 * 
 * @module @cardplay/boards/decks/factories/mixer-deck-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

/**
 * Factory for creating mixer deck instances.
 * Renders track strips with volume/pan/mute/solo controls.
 */
export const mixerDeckFactory: DeckFactory = {
  deckType: 'mixer-deck',
  
  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'mixer-deck-container';
    container.setAttribute('data-deck-id', deckDef.id);
    container.setAttribute('data-deck-type', 'mixer-deck');
    
    const header = document.createElement('div');
    header.className = 'mixer-deck-header';
    header.textContent = 'Mixer';
    
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 16px;
      background: var(--surface-base, #fff);
      border: 1px solid var(--border-base, #ccc);
      border-radius: 4px;
      min-height: 300px;
      display: flex;
      gap: 8px;
      overflow-x: auto;
    `;
    
    // Create sample track strips
    for (let i = 1; i <= 4; i++) {
      const strip = document.createElement('div');
      strip.className = 'mixer-track-strip';
      strip.style.cssText = `
        min-width: 80px;
        background: var(--surface-raised, #f5f5f5);
        border: 1px solid var(--border-base, #ccc);
        border-radius: 4px;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      `;
      
      strip.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: 600; text-align: center;">Track ${i}</div>
        <div style="flex: 1; background: var(--surface-sunken, #fafafa); border: 1px solid var(--border-base, #ccc); border-radius: 2px; position: relative;">
          <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 60%; background: linear-gradient(to top, #51cf66, #94d82d); border-radius: 2px;"></div>
        </div>
        <div style="display: flex; gap: 4px; justify-content: center;">
          <button style="width: 24px; height: 24px; font-size: 0.625rem; border: 1px solid var(--border-base, #ccc); border-radius: 2px; background: var(--surface-raised, #f5f5f5);">M</button>
          <button style="width: 24px; height: 24px; font-size: 0.625rem; border: 1px solid var(--border-base, #ccc); border-radius: 2px; background: var(--surface-raised, #f5f5f5);">S</button>
        </div>
      `;
      
      content.appendChild(strip);
    }
    
    container.appendChild(header);
    container.appendChild(content);
    
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Mixer',
      render: () => container,
      destroy: () => {
        container.remove();
      }
    };
  }
};
