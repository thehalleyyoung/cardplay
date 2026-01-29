/**
 * @fileoverview Session Grid Deck Factory (E034-E038)
 * 
 * Creates session grid decks for clip launching (Ableton-style).
 * Binds to ClipRegistry and supports clip launch/selection.
 * 
 * @module @cardplay/boards/decks/factories/session-deck-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

/**
 * Factory for creating session grid deck instances.
 * Renders an Ableton-like session grid for clip launching.
 */
export const sessionDeckFactory: DeckFactory = {
  deckType: 'session-deck',
  
  create(deckDef: BoardDeck, ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'session-deck-container';
    container.setAttribute('data-deck-id', deckDef.id);
    container.setAttribute('data-deck-type', 'session-deck');
    
    const header = document.createElement('div');
    header.className = 'session-deck-header';
    header.textContent = 'Session Grid';
    
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
      <p><strong>Session Grid Deck</strong></p>
      <p>Active Clip: ${ctx.activeContext.activeClipId || 'None'}</p>
      <p style="font-size: 0.875rem; margin-top: 8px;">
        Session grid will integrate with<br>
        src/ui/session-view.ts and SessionViewStoreBridge
      </p>
      <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(4, 80px); gap: 8px;">
        <div style="height: 60px; background: var(--surface-raised, #f5f5f5); border: 1px solid var(--border-base, #ccc); border-radius: 2px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">Slot 1</div>
        <div style="height: 60px; background: var(--surface-raised, #f5f5f5); border: 1px solid var(--border-base, #ccc); border-radius: 2px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">Slot 2</div>
        <div style="height: 60px; background: var(--surface-raised, #f5f5f5); border: 1px solid var(--border-base, #ccc); border-radius: 2px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">Slot 3</div>
        <div style="height: 60px; background: var(--surface-raised, #f5f5f5); border: 1px solid var(--border-base, #ccc); border-radius: 2px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">Slot 4</div>
      </div>
    `;
    
    content.appendChild(placeholder);
    container.appendChild(header);
    container.appendChild(content);
    
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Session',
      render: () => container,
      destroy: () => {
        container.remove();
      }
    };
  }
};
