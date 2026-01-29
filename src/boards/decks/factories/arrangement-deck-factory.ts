/**
 * @fileoverview Timeline/Arrangement Deck Factory (E031-E033, M099)
 *
 * Creates timeline arrangement decks for linear clip-based editing.
 * M099: Adds pattern sequence view for tracker boards.
 *
 * @module @cardplay/boards/decks/factories/arrangement-deck-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

/**
 * Factory for creating timeline/arrangement deck instances.
 * Renders a linear timeline with clips from ClipRegistry.
 */
export const arrangementDeckFactory: DeckFactory = {
  deckType: 'arrangement-deck',
  
  create(deckDef: BoardDeck, ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'arrangement-deck-container';
    container.setAttribute('data-deck-id', deckDef.id);
    container.setAttribute('data-deck-type', 'arrangement-deck');
    
    const header = document.createElement('div');
    header.className = 'arrangement-deck-header';
    header.textContent = 'Timeline';
    
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 16px;
      background: var(--surface-base, #fff);
      border: 1px solid var(--border-base, #ccc);
      border-radius: 4px;
      min-height: 300px;
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
      <p><strong>Timeline/Arrangement Deck</strong></p>
      <p>Active Clip: ${ctx.activeContext.activeClipId || 'None'}</p>
      <p style="font-size: 0.875rem; margin-top: 8px;">
        Timeline will integrate with<br>
        src/ui/arrangement-panel.ts and ClipRegistry
      </p>
      <div style="margin-top: 16px; height: 80px; background: var(--surface-sunken, #fafafa); border: 1px solid var(--border-base, #ccc); border-radius: 2px; position: relative;">
        <div style="position: absolute; left: 20px; top: 10px; width: 100px; height: 30px; background: #4a9eff; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem;">Clip 1</div>
        <div style="position: absolute; left: 140px; top: 10px; width: 120px; height: 30px; background: #ff6b6b; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem;">Clip 2</div>
        <div style="position: absolute; left: 20px; top: 50px; width: 80px; height: 30px; background: #51cf66; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem;">Clip 3</div>
      </div>
    `;
    
    // M099: Pattern sequence view for tracker boards
    const patternSequencer = document.createElement('div');
    patternSequencer.className = 'pattern-sequencer';
    patternSequencer.style.cssText = `
      margin-top: 12px;
      padding: 8px;
      background: var(--surface-sunken, #fafafa);
      border: 1px solid var(--border-base, #ccc);
      border-radius: 4px;
    `;
    patternSequencer.innerHTML = `
      <div style="font-size: 0.8125rem; font-weight: 600; margin-bottom: 6px;">Pattern Sequence</div>
      <div style="display: flex; gap: 4px; flex-wrap: wrap;">
        ${Array.from({ length: 8 }, (_, i) => `
          <div style="
            width: 48px; height: 36px;
            background: var(--surface-raised, #f5f5f5);
            border: 1px solid var(--border-base, #ccc);
            border-radius: 3px;
            display: flex; align-items: center; justify-content: center;
            font-size: 0.75rem; font-weight: 500;
            cursor: pointer;
          " title="Pattern ${i}">${String(i).padStart(2, '0')}</div>
        `).join('')}
      </div>
      <div style="margin-top: 6px; display: flex; gap: 6px;">
        <button style="padding: 3px 8px; font-size: 0.75rem; background: var(--surface-raised, #f5f5f5); border: 1px solid var(--border-base, #ccc); border-radius: 3px; cursor: pointer;">+ Add</button>
        <button style="padding: 3px 8px; font-size: 0.75rem; background: var(--surface-raised, #f5f5f5); border: 1px solid var(--border-base, #ccc); border-radius: 3px; cursor: pointer;">Clone</button>
        <button style="padding: 3px 8px; font-size: 0.75rem; background: var(--surface-raised, #f5f5f5); border: 1px solid var(--border-base, #ccc); border-radius: 3px; cursor: pointer;">Remove</button>
      </div>
    `;
    placeholder.appendChild(patternSequencer);

    content.appendChild(placeholder);
    container.appendChild(header);
    container.appendChild(content);
    
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Timeline',
      render: () => container,
      destroy: () => {
        container.remove();
      }
    };
  }
};
