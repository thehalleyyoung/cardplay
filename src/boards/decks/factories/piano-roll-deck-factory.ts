/**
 * @fileoverview Piano Roll Deck Factory
 *
 * Creates piano roll editor deck instances.
 *
 * E025-E027: Implement DeckType: piano-roll factory.
 *
 * @module @cardplay/boards/decks/factories/piano-roll-deck-factory
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
        container.style.cssText = 'display: flex; flex-direction: column; height: 100%;';

        // E026: Bind to ActiveContext.activeStreamId
        const activeStreamId = ctx.activeContext.activeStreamId;
        if (activeStreamId) {
          container.setAttribute('data-stream-id', activeStreamId);
        }

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.875rem; color: rgba(255,255,255,0.6);';
        header.textContent = activeStreamId 
          ? `Stream: ${activeStreamId}`
          : 'No active stream';
        container.appendChild(header);

        // Piano roll grid
        const pianoRollArea = document.createElement('div');
        pianoRollArea.className = 'piano-roll-area';
        pianoRollArea.style.cssText = 'flex: 1; position: relative; background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, transparent 100%); overflow: hidden;';
        
        // Draw piano keys on left
        const keys = document.createElement('div');
        keys.style.cssText = 'position: absolute; left: 0; top: 0; bottom: 0; width: 60px; background: rgba(0,0,0,0.3); border-right: 1px solid rgba(255,255,255,0.1);';
        
        for (let i = 0; i < 12; i++) {
          const key = document.createElement('div');
          const isBlack = [1, 3, 6, 8, 10].includes(i);
          key.style.cssText = `
            height: 8.33%;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            background: ${isBlack ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.05)'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.625rem;
            color: rgba(255,255,255,0.4);
          `;
          const notes = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
          key.textContent = notes[i] ?? null;
          keys.appendChild(key);
        }
        pianoRollArea.appendChild(keys);
        
        // Draw grid and notes
        const grid = document.createElement('div');
        grid.style.cssText = 'position: absolute; left: 60px; right: 0; top: 0; bottom: 0; background: repeating-linear-gradient(0deg, transparent, transparent 8.33%, rgba(255,255,255,0.05) 8.33%, rgba(255,255,255,0.05) 8.34%);';
        
        // Draw some example notes
        const note1 = document.createElement('div');
        note1.style.cssText = 'position: absolute; left: 10%; top: 25%; width: 15%; height: 8%; background: #4a90e2; border-radius: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);';
        grid.appendChild(note1);
        
        const note2 = document.createElement('div');
        note2.style.cssText = 'position: absolute; left: 30%; top: 33%; width: 20%; height: 8%; background: #4a90e2; border-radius: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);';
        grid.appendChild(note2);
        
        const note3 = document.createElement('div');
        note3.style.cssText = 'position: absolute; left: 55%; top: 41%; width: 12%; height: 8%; background: #4a90e2; border-radius: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);';
        grid.appendChild(note3);
        
        pianoRollArea.appendChild(grid);
        container.appendChild(pianoRollArea);

        // E027: Velocity lane
        const velocityLane = document.createElement('div');
        velocityLane.className = 'velocity-lane';
        velocityLane.style.cssText = 'height: 80px; border-top: 1px solid rgba(255,255,255,0.1); padding: 0.5rem 1rem; background: rgba(0,0,0,0.2);';
        
        const velTitle = document.createElement('div');
        velTitle.style.cssText = 'font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-bottom: 0.5rem;';
        velTitle.textContent = 'Velocity';
        velocityLane.appendChild(velTitle);
        
        const velBars = document.createElement('div');
        velBars.style.cssText = 'display: flex; gap: 2px; height: 40px; align-items: flex-end;';
        [80, 100, 90, 70, 85, 95, 75, 88].forEach(vel => {
          const bar = document.createElement('div');
          bar.style.cssText = `
            flex: 1;
            height: ${vel}%;
            background: linear-gradient(180deg, #4a90e2 0%, #2a70c2 100%);
            border-radius: 2px 2px 0 0;
          `;
          velBars.appendChild(bar);
        });
        velocityLane.appendChild(velBars);
        
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
