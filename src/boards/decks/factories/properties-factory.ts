/**
 * @fileoverview Properties Panel Deck Factory
 *
 * Creates properties inspector deck instances.
 *
 * E047-E050: Implement DeckType: properties factory.
 *
 * @module @cardplay/boards/decks/factories/properties-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { getBoardContextStore } from '../../context/store';

// ============================================================================
// PROPERTIES FACTORY
// ============================================================================

/**
 * Factory for properties decks.
 *
 * E047: Inspector for selection (event/clip/card).
 */
export const propertiesFactory: DeckFactory = {
  deckType: 'properties-deck',

  create(deckDef: BoardDeck, ctx: DeckFactoryContext): DeckInstance {
    let containerElement: HTMLElement | null = null;
    let contextUnsubscribe: (() => void) | null = null;

    const instance: DeckInstance = {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Properties',

      render: () => {
        const container = document.createElement('div');
        container.className = 'properties-deck';
        container.setAttribute('data-deck-id', deckDef.id);

        // Header
        const header = document.createElement('div');
        header.className = 'properties-header';
        header.textContent = 'Inspector';
        header.style.padding = '8px';
        header.style.fontWeight = 'bold';
        header.style.borderBottom = '1px solid #3e3e3e';
        container.appendChild(header);

        // Content area
        const content = document.createElement('div');
        content.className = 'properties-content';
        content.style.padding = '8px';

        // E048: Show selected entity info
        const activeStreamId = ctx.activeContext.activeStreamId;
        const activeClipId = ctx.activeContext.activeClipId;

        if (activeClipId) {
          // E049: Editing ClipRecord
          const clipSection = document.createElement('div');
          clipSection.innerHTML = `
            <h4>Clip: ${activeClipId}</h4>
            <label>Name: <input type="text" value="Untitled Clip" /></label><br/>
            <label>Color: <input type="color" value="#4a9eff" /></label><br/>
            <label>Loop: <input type="checkbox" checked /></label>
          `;
          content.appendChild(clipSection);
        } else if (activeStreamId) {
          // Show stream info
          const streamSection = document.createElement('div');
          streamSection.innerHTML = `
            <h4>Stream: ${activeStreamId}</h4>
            <p>No clip selected</p>
          `;
          content.appendChild(streamSection);
        } else {
          // Empty state
          const emptyState = document.createElement('div');
          emptyState.textContent = 'No selection';
          emptyState.style.color = '#999';
          content.appendChild(emptyState);
        }

        container.appendChild(content);

        containerElement = container;
        return container;
      },

      mount: (container: HTMLElement) => {
        // Subscribe to context changes
        const contextStore = getBoardContextStore();
        contextUnsubscribe = contextStore.subscribe((context) => {
          // Update properties when context changes
          const content = container.querySelector('.properties-content');
          if (!content) return;

          content.innerHTML = '';

          if (context.activeClipId) {
            // E049: Editing ClipRecord
            const clipSection = document.createElement('div');
            clipSection.innerHTML = `
              <h4>Clip: ${context.activeClipId}</h4>
              <label>Name: <input type="text" value="Untitled Clip" /></label><br/>
              <label>Color: <input type="color" value="#4a9eff" /></label><br/>
              <label>Loop: <input type="checkbox" checked /></label>
            `;
            content.appendChild(clipSection);
          } else if (context.activeStreamId) {
            const streamSection = document.createElement('div');
            streamSection.innerHTML = `
              <h4>Stream: ${context.activeStreamId}</h4>
              <p>No clip selected</p>
            `;
            content.appendChild(streamSection);
          } else {
            const emptyState = document.createElement('div');
            emptyState.textContent = 'No selection';
            emptyState.style.color = '#999';
            content.appendChild(emptyState);
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
        // Update when context changes
        if (!containerElement) return;

        const content = containerElement.querySelector('.properties-content');
        if (!content) return;

        content.innerHTML = '';

        if (context.activeClipId) {
          const clipSection = document.createElement('div');
          clipSection.innerHTML = `
            <h4>Clip: ${context.activeClipId}</h4>
            <label>Name: <input type="text" value="Untitled Clip" /></label><br/>
            <label>Color: <input type="color" value="#4a9eff" /></label><br/>
            <label>Loop: <input type="checkbox" checked /></label>
          `;
          content.appendChild(clipSection);
        } else if (context.activeStreamId) {
          const streamSection = document.createElement('div');
          streamSection.innerHTML = `
            <h4>Stream: ${context.activeStreamId}</h4>
            <p>No clip selected</p>
          `;
          content.appendChild(streamSection);
        } else {
          const emptyState = document.createElement('div');
          emptyState.textContent = 'No selection';
          emptyState.style.color = '#999';
          content.appendChild(emptyState);
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
    if (deckDef.type !== 'properties-deck') {
      return 'Deck type must be properties-deck';
    }
    return null;
  },
};
