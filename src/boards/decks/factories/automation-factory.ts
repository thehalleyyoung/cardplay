/**
 * @fileoverview Automation Deck Factory
 *
 * Implements automation-deck for editing parameter automation lanes.
 *
 * @module @cardplay/boards/decks/factories/automation-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

/**
 * Automation deck factory.
 *
 * Provides automation editing:
 * - Parameter automation lanes
 * - Envelope editing
 * - Modulation routing
 * - Curve types (linear, exponential, etc.)
 */
export const automationFactory: DeckFactory = {
  deckType: 'automation-deck',

  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'deck-automation';
    container.style.cssText = `
      padding: 1rem;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    `;

    // Header with add lane button
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <div style="font-weight: 600; color: var(--color-on-surface);">Automation Lanes</div>
      <button style="padding: 0.5rem 1rem; border: none; background: var(--color-primary); color: var(--color-on-primary); border-radius: var(--radius-sm); cursor: pointer;">+ Add Lane</button>
    `;

    // Automation lanes list
    const lanesList = document.createElement('div');
    lanesList.className = 'automation-lanes';
    lanesList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    `;

    // Sample lanes
    const sampleLanes = [
      { parameter: 'Volume', value: '-6 dB', color: '#4CAF50' },
      { parameter: 'Filter Cutoff', value: '2.4 kHz', color: '#2196F3' },
      { parameter: 'Reverb Mix', value: '35%', color: '#9C27B0' },
    ];

    sampleLanes.forEach((lane) => {
      const laneItem = document.createElement('div');
      laneItem.style.cssText = `
        padding: 0.75rem;
        background: var(--color-surface-variant);
        border-radius: var(--radius-sm);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-left: 3px solid ${lane.color};
      `;
      laneItem.innerHTML = `
        <div>
          <div style="font-weight: 600; color: var(--color-on-surface); margin-bottom: 0.25rem;">${lane.parameter}</div>
          <div style="font-size: 0.875rem; color: var(--color-on-surface-variant);">${lane.value}</div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button style="padding: 0.25rem 0.5rem; border: none; background: var(--color-primary-container); color: var(--color-on-primary-container); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.875rem;">Edit</button>
          <button style="padding: 0.25rem 0.5rem; border: none; background: var(--color-error-container); color: var(--color-on-error-container); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.875rem;">×</button>
        </div>
      `;
      lanesList.appendChild(laneItem);
    });

    // Empty state when no lanes
    if (sampleLanes.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.style.cssText = `
        padding: 2rem;
        text-align: center;
        color: var(--color-on-surface-variant);
      `;
      emptyState.textContent = 'No automation lanes. Click + Add Lane to create one.';
      lanesList.appendChild(emptyState);
    }

    container.appendChild(header);
    container.appendChild(lanesList);

    // TODO: Wire up to parameter-resolver.ts
    // TODO: Implement lane editor UI with envelope curves
    // TODO: Add modulation source routing
    // TODO: Add undo support for automation edits

    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Automation',
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
