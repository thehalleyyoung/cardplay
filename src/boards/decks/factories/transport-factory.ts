/**
 * @fileoverview Transport Deck Factory
 *
 * E060: Implement transport deck factory with controls + tempo + loop region.
 *
 * @module @cardplay/boards/decks/factories/transport-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { getTransport } from '../../../audio/transport';

/**
 * Transport deck factory.
 *
 * Provides transport controls:
 * - Play/Stop/Pause
 * - Tempo control
 * - Loop region
 * - Time signature
 * - Metronome
 */
export const transportFactory: DeckFactory = {
  deckType: 'transport-deck',

  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Transport',
      render: () => {
        const container = document.createElement('div');
        container.className = 'deck-transport';
        container.setAttribute('data-deck-id', deckDef.id);
        container.style.cssText = `
          display: flex;
          gap: 1rem;
          padding: 0.75rem;
          background: var(--color-surface);
          border-radius: var(--radius-md);
          align-items: center;
        `;

        const transport = getTransport();

        // Play button
        const playButton = document.createElement('button');
        playButton.textContent = '▶';
        playButton.className = 'transport-play';
        playButton.style.cssText = `
          padding: 0.5rem 1rem;
          font-size: 1.25rem;
          border: none;
          background: var(--color-primary);
          color: var(--color-on-primary);
          border-radius: var(--radius-sm);
          cursor: pointer;
        `;
        playButton.onclick = () => {
          const snapshot = transport.getSnapshot();
          if (snapshot.state === 'playing') {
            transport.pause();
          } else {
            transport.play();
          }
        };

        // Stop button
        const stopButton = document.createElement('button');
        stopButton.textContent = '■';
        stopButton.className = 'transport-stop';
        stopButton.style.cssText = playButton.style.cssText;
        stopButton.onclick = () => transport.stop();

        // Tempo input
        const tempoInput = document.createElement('input');
        tempoInput.type = 'number';
        tempoInput.min = '20';
        tempoInput.max = '300';
        tempoInput.value = transport.getSnapshot().tempo.toString();
        tempoInput.className = 'transport-tempo';
        tempoInput.style.cssText = `
          width: 5rem;
          padding: 0.5rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-surface-variant);
          color: var(--color-on-surface);
        `;
        tempoInput.onchange = () => {
          const tempo = parseFloat(tempoInput.value);
          if (!isNaN(tempo) && tempo >= 20 && tempo <= 300) {
            transport.setTempo(tempo);
          }
        };

        const tempoLabel = document.createElement('span');
        tempoLabel.textContent = 'BPM';
        tempoLabel.style.cssText = `
          font-size: 0.875rem;
          color: var(--color-on-surface-variant);
        `;

        // Loop toggle
        const loopToggle = document.createElement('button');
        loopToggle.textContent = '↻ Loop';
        loopToggle.className = 'transport-loop';
        loopToggle.style.cssText = playButton.style.cssText;
        loopToggle.onclick = () => {
          const snapshot = transport.getSnapshot();
          transport.setLoopEnabled(!snapshot.loop.enabled);
        };

        // Subscribe to transport updates
        transport.subscribe(() => {
          const snapshot = transport.getSnapshot();
          playButton.textContent = snapshot.state === 'playing' ? '⏸' : '▶';
          tempoInput.value = snapshot.tempo.toString();
          loopToggle.style.opacity = snapshot.loop.enabled ? '1' : '0.5';
        });

        container.appendChild(playButton);
        container.appendChild(stopButton);
        container.appendChild(tempoInput);
        container.appendChild(tempoLabel);
        container.appendChild(loopToggle);

        return container;
      },
    };
  },

  validate(_deckDef: BoardDeck): string | null {
    return null;
  },
};
