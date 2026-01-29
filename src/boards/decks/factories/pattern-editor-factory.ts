/**
 * @fileoverview Pattern Editor Deck Factory
 *
 * Creates tracker pattern editor deck instances.
 *
 * E021-E024: Implement DeckType: pattern-editor factory.
 *
 * @module @cardplay/boards/decks/factories/pattern-editor-factory
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

        // E022: Bind to ActiveContext.activeStreamId
        const activeStreamId = ctx.activeContext.activeStreamId;
        if (activeStreamId) {
          container.setAttribute('data-stream-id', activeStreamId);
          container.textContent = `Pattern Editor (Stream: ${activeStreamId})`;
        } else {
          container.textContent = 'Pattern Editor (No active stream)';
        }

        // E023: Pattern length control (stub)
        const controls = document.createElement('div');
        controls.className = 'pattern-controls';
        
        const lengthLabel = document.createElement('label');
        lengthLabel.textContent = 'Pattern Length: ';
        controls.appendChild(lengthLabel);

        const lengthInput = document.createElement('input');
        lengthInput.type = 'number';
        lengthInput.min = '16';
        lengthInput.max = '256';
        lengthInput.step = '16';
        lengthInput.value = '64';
        lengthInput.title = 'Pattern length in ticks';
        controls.appendChild(lengthInput);

        container.appendChild(controls);

        // E024: Key commands (stub - actual tracker UI would handle this)
        const helpText = document.createElement('div');
        helpText.className = 'pattern-help';
        helpText.textContent = 'Tracker shortcuts: Note entry, Navigation, Undo';
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
