/**
 * @fileoverview Pattern Editor Deck Factory
 *
 * Creates tracker pattern editor deck instances.
 *
 * E021-E024: Implement DeckType: pattern-editor factory.
 *
 * @module @cardplay/boards/decks/factories/pattern-deck-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { getBoardContextStore } from '../../context/store';

// ============================================================================
// PATTERN EDITOR FACTORY
// ============================================================================

/**
 * Factory for pattern-editor decks.
 *
 * E021: Use tracker panel based on Phase A decision.
 */
export const patternEditorFactory: DeckFactory = {
  deckType: 'pattern-deck',

  create(deckDef: BoardDeck, ctx: DeckFactoryContext): DeckInstance {
    let containerElement: HTMLElement | null = null;
    let contextUnsubscribe: (() => void) | null = null;

    const instance: DeckInstance = {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Pattern Editor',

      render: () => {
        const container = document.createElement('div');
        container.className = 'pattern-editor-deck';
        container.setAttribute('data-deck-id', deckDef.id);

        // Header section
        const header = document.createElement('div');
        header.className = 'pattern-editor-header';
        header.style.cssText = 'padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;';

        // E022: Bind to ActiveContext.activeStreamId
        const activeStreamId = ctx.activeContext.activeStreamId;
        const streamInfo = document.createElement('div');
        streamInfo.style.cssText = 'font-size: 0.875rem; color: rgba(255,255,255,0.6);';
        if (activeStreamId) {
          streamInfo.textContent = `Stream: ${activeStreamId}`;
          container.setAttribute('data-stream-id', activeStreamId);
        } else {
          streamInfo.textContent = 'No active stream';
        }
        header.appendChild(streamInfo);

        // E023: Pattern length control
        const controls = document.createElement('div');
        controls.className = 'pattern-controls';
        controls.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';
        
        const lengthLabel = document.createElement('label');
        lengthLabel.textContent = 'Length:';
        lengthLabel.style.cssText = 'font-size: 0.875rem;';
        controls.appendChild(lengthLabel);

        const lengthInput = document.createElement('input');
        lengthInput.type = 'number';
        lengthInput.min = '16';
        lengthInput.max = '256';
        lengthInput.step = '16';
        lengthInput.value = '64';
        lengthInput.title = 'Pattern length in ticks';
        lengthInput.style.cssText = 'width: 4rem; padding: 0.25rem 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 0.25rem; color: #fff;';
        controls.appendChild(lengthInput);

        header.appendChild(controls);
        container.appendChild(header);

        // Tracker grid visualization (beautiful placeholder)
        const grid = document.createElement('div');
        grid.className = 'pattern-grid';
        grid.style.cssText = 'padding: 1rem; font-family: monospace; font-size: 0.875rem; line-height: 1.5;';
        
        const rows = [
          '00 │ C-4 01 .40 │ --- -- --- │ --- -- --- │',
          '01 │ ... .. ... │ ... .. ... │ ... .. ... │',
          '02 │ D-4 01 .60 │ --- -- --- │ --- -- --- │',
          '03 │ ... .. ... │ ... .. ... │ ... .. ... │',
          '04 │ E-4 01 .50 │ --- -- --- │ --- -- --- │',
          '05 │ ... .. ... │ ... .. ... │ ... .. ... │',
          '06 │ ... .. ... │ ... .. ... │ ... .. ... │',
          '07 │ ... .. ... │ ... .. ... │ ... .. ... │',
        ];
        
        rows.forEach((row, i) => {
          const rowDiv = document.createElement('div');
          rowDiv.style.cssText = `
            padding: 0.25rem 0;
            ${i % 4 === 0 ? 'border-top: 1px solid rgba(255,255,255,0.15);' : ''}
            color: ${i % 4 === 0 ? '#4a90e2' : 'rgba(255,255,255,0.7)'};
          `;
          rowDiv.textContent = row;
          grid.appendChild(rowDiv);
        });
        
        container.appendChild(grid);

        // E024: Key commands help
        const helpText = document.createElement('div');
        helpText.className = 'pattern-help';
        helpText.style.cssText = 'padding: 0.5rem 1rem; font-size: 0.75rem; color: rgba(255,255,255,0.4); border-top: 1px solid rgba(255,255,255,0.1);';
        helpText.textContent = '⌨️ Shortcuts: Enter notes, ←→ navigate, Ctrl+Z undo';
        container.appendChild(helpText);

        containerElement = container;
        return container;
      },

      mount: (container: HTMLElement) => {
        // Subscribe to context changes
        const contextStore = getBoardContextStore();
        contextUnsubscribe = contextStore.subscribe((context) => {
          // E022: Update on context changes
          if (container.getAttribute('data-stream-id') !== context.activeStreamId) {
            container.setAttribute('data-stream-id', context.activeStreamId || '');
            const activeStreamId = context.activeStreamId;
            if (activeStreamId) {
              const textNode = container.querySelector('.pattern-editor-deck');
              if (textNode) textNode.textContent = `Pattern Editor (Stream: ${activeStreamId})`;
            } else {
              const textNode = container.querySelector('.pattern-editor-deck');
              if (textNode) textNode.textContent = 'Pattern Editor (No active stream)';
            }
          }
        });
      },

      unmount: () => {
        if (contextUnsubscribe) {
          contextUnsubscribe();
          contextUnsubscribe = null;
        }
      },

      update: (context) => {
        // E022: Update when context changes
        if (containerElement) {
          const activeStreamId = context.activeStreamId;
          containerElement.setAttribute('data-stream-id', activeStreamId || '');
          if (activeStreamId) {
            containerElement.textContent = `Pattern Editor (Stream: ${activeStreamId})`;
          } else {
            containerElement.textContent = 'Pattern Editor (No active stream)';
          }
        }
      },

      destroy: () => {
        if (contextUnsubscribe) {
          contextUnsubscribe();
          contextUnsubscribe = null;
        }
        containerElement = null;
      },
    };

    return instance;
  },

  validate(deckDef: BoardDeck): string | null {
    if (deckDef.type !== 'pattern-deck') {
      return 'Deck type must be pattern-deck';
    }
    return null;
  },
};
