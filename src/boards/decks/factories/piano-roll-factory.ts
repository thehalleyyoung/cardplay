/**
 * @fileoverview Piano Roll Deck Factory
 *
 * Creates piano roll editor deck instances.
 *
 * E025-E027: Implement DeckType: piano-roll factory.
 *
 * @module @cardplay/boards/decks/factories/piano-roll-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { getBoardContextStore } from '../../context/store';

// ============================================================================
// PIANO ROLL FACTORY
// ============================================================================

/**
 * Factory for piano-roll decks.
 *
 * E025: Use piano-roll-panel.ts
 */
export const pianoRollFactory: DeckFactory = {
  deckType: 'piano-roll-deck',

  create(deckDef: BoardDeck, ctx: DeckFactoryContext): DeckInstance {
    let containerElement: HTMLElement | null = null;
    let contextUnsubscribe: (() => void) | null = null;

    const instance: DeckInstance = {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Piano Roll',

      render: () => {
        const container = document.createElement('div');
        container.className = 'piano-roll-deck';
        container.setAttribute('data-deck-id', deckDef.id);

        // E026: Bind to ActiveContext.activeStreamId
        const activeStreamId = ctx.activeContext.activeStreamId;
        if (activeStreamId) {
          container.setAttribute('data-stream-id', activeStreamId);
        }

        // Piano roll visualization placeholder
        const pianoRollArea = document.createElement('div');
        pianoRollArea.className = 'piano-roll-area';
        pianoRollArea.textContent = activeStreamId 
          ? `Piano Roll (Stream: ${activeStreamId})`
          : 'Piano Roll (No active stream)';
        container.appendChild(pianoRollArea);

        // E027: Velocity lane
        const velocityLane = document.createElement('div');
        velocityLane.className = 'velocity-lane';
        velocityLane.textContent = 'Velocity Lane';
        velocityLane.style.height = '100px';
        velocityLane.style.borderTop = '1px solid #3e3e3e';
        velocityLane.style.padding = '8px';
        container.appendChild(velocityLane);

        containerElement = container;
        return container;
      },

      mount: (container: HTMLElement) => {
        // Subscribe to context changes
        const contextStore = getBoardContextStore();
        contextUnsubscribe = contextStore.subscribe((context) => {
          // E026: Update on context changes
          if (container.getAttribute('data-stream-id') !== context.activeStreamId) {
            container.setAttribute('data-stream-id', context.activeStreamId || '');
            const pianoRollArea = container.querySelector('.piano-roll-area');
            if (pianoRollArea) {
              const activeStreamId = context.activeStreamId;
              pianoRollArea.textContent = activeStreamId
                ? `Piano Roll (Stream: ${activeStreamId})`
                : 'Piano Roll (No active stream)';
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
        // E026: Update when context changes
        if (containerElement) {
          const activeStreamId = context.activeStreamId;
          containerElement.setAttribute('data-stream-id', activeStreamId || '');
          const pianoRollArea = containerElement.querySelector('.piano-roll-area');
          if (pianoRollArea) {
            pianoRollArea.textContent = activeStreamId
              ? `Piano Roll (Stream: ${activeStreamId})`
              : 'Piano Roll (No active stream)';
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
    if (deckDef.type !== 'piano-roll-deck') {
      return 'Deck type must be piano-roll-deck';
    }
    return null;
  },
};
