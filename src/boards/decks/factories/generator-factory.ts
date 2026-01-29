/**
 * @fileoverview Generator Deck Factory
 *
 * E056: Implement generator deck as a stack of generator cards.
 *
 * @module @cardplay/boards/decks/factories/generator-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

/**
 * Generator deck factory.
 *
 * Provides on-demand generation tools:
 * - Melody generator
 * - Bass generator
 * - Drum pattern generator
 * - Arpeggiator
 */
export const generatorFactory: DeckFactory = {
  deckType: 'generators-deck',

  create(deckDef: BoardDeck, ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'deck-generators';
    container.style.cssText = `
      padding: 1rem;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    `;

    // Generator list
    const generators = [
      { id: 'melody', name: 'Melody Generator', icon: '🎵' },
      { id: 'bass', name: 'Bass Generator', icon: '🎸' },
      { id: 'drums', name: 'Drum Generator', icon: '🥁' },
      { id: 'arp', name: 'Arpeggiator', icon: '🎹' },
    ];

    generators.forEach((gen) => {
      const card = document.createElement('div');
      card.className = 'generator-card';
      card.style.cssText = `
        padding: 1rem;
        background: var(--color-surface-variant);
        border-radius: var(--radius-sm);
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;

      const info = document.createElement('div');
      info.innerHTML = `
        <div style="font-size: 1.25rem; margin-bottom: 0.25rem;">${gen.icon} ${gen.name}</div>
        <div style="font-size: 0.875rem; color: var(--color-on-surface-variant);">Generate ${gen.id} patterns</div>
      `;

      const generateButton = document.createElement('button');
      generateButton.textContent = 'Generate';
      generateButton.style.cssText = `
        padding: 0.5rem 1rem;
        border: none;
        background: var(--color-primary);
        color: var(--color-on-primary);
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-weight: 600;
      `;
      generateButton.onclick = () => {
        console.log(`Generate ${gen.id} for stream:`, ctx.activeContext.activeStreamId);
        // TODO: Wire up to actual generator logic
        // TODO: Write generated events to active stream
        // TODO: Add undo support
      };

      card.appendChild(info);
      card.appendChild(generateButton);
      container.appendChild(card);
    });

    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Generators',
      render: () => container,
      mount: (target: HTMLElement) => {
        target.appendChild(container);
      },
      unmount: () => {
        container.remove();
      },
      destroy: () => {
        // Cleanup if needed
      },
    };
  },

  validate(_deckDef: BoardDeck): string | null {
    return null;
  },
};
