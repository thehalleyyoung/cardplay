/**
 * @fileoverview Automation Deck Factory (M283)
 *
 * Implements automation-deck for editing parameter automation lanes.
 * M283: Wires suggestAutomationLanes() to suggest relevant lanes.
 *
 * @module @cardplay/boards/decks/factories/automation-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { suggestAutomationLanes } from '../../../ai/queries/persona-queries';

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

    // M283: Automation lane suggestions section
    const suggestionsSection = document.createElement('div');
    suggestionsSection.className = 'automation-suggestions';
    suggestionsSection.style.cssText = `
      padding: 8px 12px;
      background: var(--surface-sunken, #fafafa);
      border: 1px dashed var(--border-base, #ccc);
      border-radius: var(--radius-sm, 4px);
      font-size: 0.8125rem;
    `;

    const suggestBtn = document.createElement('button');
    suggestBtn.textContent = 'Suggest Lanes';
    suggestBtn.style.cssText = `
      padding: 4px 10px; font-size: 0.8125rem;
      background: var(--color-primary, #0066cc); color: white;
      border: none; border-radius: 4px; cursor: pointer;
      margin-bottom: 6px;
    `;
    suggestionsSection.appendChild(suggestBtn);

    const suggestOutput = document.createElement('div');
    suggestOutput.style.cssText = 'color: var(--text-secondary, #666);';
    suggestOutput.textContent = 'Get AI suggestions for automation lanes based on track type.';
    suggestionsSection.appendChild(suggestOutput);

    suggestBtn.addEventListener('click', async () => {
      suggestOutput.textContent = 'Analyzing\u2026';
      try {
        // Default to synth track suggestions
        const lanes = await suggestAutomationLanes('synth');
        if (lanes.length === 0) {
          suggestOutput.textContent = 'No suggestions available.';
        } else {
          suggestOutput.innerHTML = '<strong>Suggested lanes:</strong> ' +
            lanes.map((l) =>
              `<span style="padding: 2px 6px; background: var(--surface-raised, #f5f5f5); border-radius: 3px;">${l.parameter} <small>(p${l.priority})</small></span>`
            ).join(' ');
        }
      } catch {
        suggestOutput.innerHTML = '<em style="color: var(--danger-base, red);">Suggestion failed.</em>';
      }
    });

    container.appendChild(header);
    container.appendChild(lanesList);
    container.appendChild(suggestionsSection);

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
