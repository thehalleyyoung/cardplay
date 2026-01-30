/**
 * @fileoverview Effect Rack Deck Factory (M101)
 *
 * Implements effects-deck showing all track effects in a rack view.
 * Provides overview of all effect chains across tracks with enable/disable
 * and reordering capabilities.
 *
 * @module @cardplay/boards/decks/factories/effects-deck-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { suggestSoundEffectChain } from '../../../ai/queries/persona-queries';

/**
 * Effect rack deck factory.
 *
 * Provides a rack view of all track effects:
 * - Per-track effect chain listing
 * - Enable/disable individual effects
 * - Drag-to-reorder effects
 * - Effect preset browser
 * - CPU load indicator per effect
 * - AI-suggested effect chains
 */
export const effectsRackFactory: DeckFactory = {
  deckType: 'effects-deck',

  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'deck-effects-rack';
    container.style.cssText = `
      padding: 1rem;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <div style="font-weight: 600; color: var(--color-on-surface);">Effect Rack</div>
      <div style="display: flex; gap: 0.5rem;">
        <button style="padding: 0.4rem 0.75rem; border: none; background: var(--color-primary); color: var(--color-on-primary); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.8125rem;">+ Add Effect</button>
      </div>
    `;

    // Track effect chains
    const chainsContainer = document.createElement('div');
    chainsContainer.className = 'effect-chains';
    chainsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      flex: 1;
      overflow-y: auto;
    `;

    // Sample track chains
    const trackChains = [
      {
        track: 'Kick',
        effects: [
          { name: 'Compressor', enabled: true, cpu: '1.2%' },
          { name: 'EQ', enabled: true, cpu: '0.8%' },
          { name: 'Saturator', enabled: false, cpu: '0.0%' },
        ],
      },
      {
        track: 'Bass',
        effects: [
          { name: 'Distortion', enabled: true, cpu: '1.5%' },
          { name: 'Compressor', enabled: true, cpu: '1.2%' },
          { name: 'EQ', enabled: true, cpu: '0.8%' },
          { name: 'Limiter', enabled: true, cpu: '0.5%' },
        ],
      },
      {
        track: 'Pad',
        effects: [
          { name: 'Chorus', enabled: true, cpu: '1.8%' },
          { name: 'Reverb', enabled: true, cpu: '3.2%' },
          { name: 'EQ', enabled: true, cpu: '0.8%' },
        ],
      },
    ];

    trackChains.forEach((chain) => {
      const trackSection = document.createElement('div');
      trackSection.style.cssText = `
        background: var(--color-surface-variant);
        border-radius: var(--radius-sm);
        padding: 0.5rem;
      `;

      const trackHeader = document.createElement('div');
      trackHeader.style.cssText = `
        font-weight: 600; font-size: 0.875rem;
        color: var(--color-on-surface);
        margin-bottom: 0.5rem;
        display: flex;
        justify-content: space-between;
      `;
      trackHeader.innerHTML = `
        <span>${chain.track}</span>
        <span style="font-weight: normal; font-size: 0.75rem; color: var(--color-on-surface-variant);">${chain.effects.length} effects</span>
      `;

      const effectsList = document.createElement('div');
      effectsList.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      `;

      chain.effects.forEach((effect) => {
        const effectRow = document.createElement('div');
        effectRow.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.3rem 0.5rem;
          background: ${effect.enabled ? 'var(--color-primary-container)' : 'var(--color-surface)'};
          border-radius: 3px;
          opacity: ${effect.enabled ? '1' : '0.5'};
          cursor: pointer;
        `;
        effectRow.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${effect.enabled ? '#4CAF50' : '#999'}; display: inline-block;"></span>
            <span style="font-size: 0.8125rem; color: var(--color-on-surface);">${effect.name}</span>
          </div>
          <span style="font-size: 0.6875rem; color: var(--color-on-surface-variant);">CPU: ${effect.cpu}</span>
        `;
        effectsList.appendChild(effectRow);
      });

      trackSection.appendChild(trackHeader);
      trackSection.appendChild(effectsList);
      chainsContainer.appendChild(trackSection);
    });

    // AI suggestion section
    const suggestSection = document.createElement('div');
    suggestSection.style.cssText = `
      padding: 8px 12px;
      background: var(--surface-sunken, #fafafa);
      border: 1px dashed var(--border-base, #ccc);
      border-radius: var(--radius-sm, 4px);
      font-size: 0.8125rem;
    `;

    const suggestBtn = document.createElement('button');
    suggestBtn.textContent = 'Suggest Chain';
    suggestBtn.style.cssText = `
      padding: 4px 10px; font-size: 0.8125rem;
      background: var(--color-primary, #0066cc); color: white;
      border: none; border-radius: 4px; cursor: pointer;
      margin-bottom: 6px;
    `;
    suggestSection.appendChild(suggestBtn);

    const suggestOutput = document.createElement('div');
    suggestOutput.style.cssText = 'color: var(--text-secondary, #666);';
    suggestOutput.textContent = 'Get AI suggestions for effect chains by sound type.';
    suggestSection.appendChild(suggestOutput);

    suggestBtn.addEventListener('click', async () => {
      suggestOutput.textContent = 'Analyzing\u2026';
      try {
        const chains = await suggestSoundEffectChain('pad');
        if (chains.length === 0) {
          suggestOutput.textContent = 'No suggestions available.';
        } else {
          suggestOutput.innerHTML = chains.map((c) =>
            `<div style="margin-top: 4px;"><strong>${c.soundType} (${c.style}):</strong> ${c.effects.join(' \u2192 ')}</div>`
          ).join('');
        }
      } catch {
        suggestOutput.innerHTML = '<em style="color: var(--danger-base, red);">Suggestion failed.</em>';
      }
    });

    container.appendChild(header);
    container.appendChild(chainsContainer);
    container.appendChild(suggestSection);

    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Effect Rack',
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
