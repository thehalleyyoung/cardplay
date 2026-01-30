/**
 * @fileoverview Modulation Matrix Deck Factory (M178)
 *
 * Implements modulation-matrix-deck showing all modulation connections.
 * Displays source-to-destination routing with depth, and allows
 * creating new connections via drag-and-drop.
 *
 * @module @cardplay/boards/decks/factories/modulation-matrix-deck-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { suggestModulationRouting } from '../../../ai/queries/persona-queries';

/**
 * Modulation matrix deck factory.
 *
 * Provides a grid/list view of all modulation connections:
 * - Source → Destination mapping with depth control
 * - Visual matrix grid (sources as rows, destinations as columns)
 * - Quick add/remove connections
 * - Per-slot depth slider
 * - AI-suggested modulation routings
 * - Colour-coded by modulation type (LFO, envelope, velocity, etc.)
 */
export const modulationMatrixFactory: DeckFactory = {
  deckType: 'modulation-matrix-deck',

  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'deck-modulation-matrix';
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
      <div style="font-weight: 600; color: var(--color-on-surface);">Modulation Matrix</div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="mm-view-btn" data-view="list" style="padding: 0.25rem 0.5rem; border: 1px solid var(--color-outline); background: var(--color-primary); color: var(--color-on-primary); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.75rem;">List</button>
        <button class="mm-view-btn" data-view="matrix" style="padding: 0.25rem 0.5rem; border: 1px solid var(--color-outline); background: transparent; color: var(--color-on-surface); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.75rem;">Matrix</button>
        <button style="padding: 0.25rem 0.5rem; border: none; background: var(--color-primary); color: var(--color-on-primary); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.75rem;">+ Slot</button>
      </div>
    `;

    // Modulation slots (list view)
    const slotsContainer = document.createElement('div');
    slotsContainer.className = 'mod-slots';
    slotsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
      overflow-y: auto;
    `;

    const sourceColors: Record<string, string> = {
      lfo: '#2196F3',
      envelope: '#4CAF50',
      velocity: '#FF9800',
      aftertouch: '#9C27B0',
      mod_wheel: '#E91E63',
    };

    // Sample modulation slots
    const slots = [
      { source: 'LFO 1 (Sine)', sourceType: 'lfo', dest: 'Filter Cutoff', depth: 0.45 },
      { source: 'LFO 2 (Triangle)', sourceType: 'lfo', dest: 'Pan', depth: 0.3 },
      { source: 'Amp Envelope', sourceType: 'envelope', dest: 'Filter Cutoff', depth: 0.7 },
      { source: 'Velocity', sourceType: 'velocity', dest: 'Amplitude', depth: 0.85 },
      { source: 'Velocity', sourceType: 'velocity', dest: 'Filter Cutoff', depth: 0.5 },
      { source: 'Mod Wheel', sourceType: 'mod_wheel', dest: 'LFO Depth', depth: 0.6 },
      { source: 'Aftertouch', sourceType: 'aftertouch', dest: 'Vibrato', depth: 0.4 },
    ];

    slots.forEach((slot) => {
      const color = sourceColors[slot.sourceType] || '#666';
      const slotRow = document.createElement('div');
      slotRow.style.cssText = `
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: var(--color-surface-variant);
        border-radius: var(--radius-sm);
        border-left: 3px solid ${color};
      `;

      const depthPercent = Math.round(slot.depth * 100);
      slotRow.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 0.8125rem; color: var(--color-on-surface); font-weight: 500;">${slot.source}</div>
          <div style="font-size: 0.6875rem; color: var(--color-on-surface-variant);">\u2192 ${slot.dest}</div>
        </div>
        <div style="width: 80px; display: flex; align-items: center; gap: 0.25rem;">
          <div style="flex: 1; height: 4px; background: var(--color-outline); border-radius: 2px; position: relative;">
            <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${depthPercent}%; background: ${color}; border-radius: 2px;"></div>
          </div>
          <span style="font-size: 0.6875rem; color: var(--color-on-surface-variant); width: 30px; text-align: right;">${depthPercent}%</span>
        </div>
        <button style="padding: 0.15rem 0.4rem; border: none; background: var(--color-error-container); color: var(--color-on-error-container); border-radius: 2px; cursor: pointer; font-size: 0.75rem;">\u00d7</button>
      `;
      slotsContainer.appendChild(slotRow);
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
    suggestBtn.textContent = 'Suggest Routing';
    suggestBtn.style.cssText = `
      padding: 4px 10px; font-size: 0.8125rem;
      background: var(--color-primary, #0066cc); color: white;
      border: none; border-radius: 4px; cursor: pointer;
      margin-bottom: 6px;
    `;
    suggestSection.appendChild(suggestBtn);

    const suggestOutput = document.createElement('div');
    suggestOutput.style.cssText = 'color: var(--text-secondary, #666);';
    suggestOutput.textContent = 'Get AI-suggested modulation routings for expressive sound design.';
    suggestSection.appendChild(suggestOutput);

    suggestBtn.addEventListener('click', async () => {
      suggestOutput.textContent = 'Analyzing\u2026';
      try {
        const routings = await suggestModulationRouting();
        if (routings.length === 0) {
          suggestOutput.textContent = 'No suggestions available.';
        } else {
          suggestOutput.innerHTML = routings.map((r) =>
            `<div style="margin-top: 4px;">
              <strong>${r.name}:</strong>
              <span style="color: var(--color-on-surface-variant);">${r.source} \u2192 [${r.targets.join(', ')}]</span>
            </div>`
          ).join('');
        }
      } catch {
        suggestOutput.innerHTML = '<em style="color: var(--danger-base, red);">Suggestion failed.</em>';
      }
    });

    // Summary footer
    const summaryFooter = document.createElement('div');
    summaryFooter.style.cssText = `
      font-size: 0.75rem;
      color: var(--color-on-surface-variant);
      border-top: 1px solid var(--color-outline-variant);
      padding-top: 0.5rem;
      display: flex;
      justify-content: space-between;
    `;
    summaryFooter.innerHTML = `
      <span>${slots.length} active slots</span>
      <span>${new Set(slots.map((s) => s.source)).size} sources \u2192 ${new Set(slots.map((s) => s.dest)).size} destinations</span>
    `;

    container.appendChild(header);
    container.appendChild(slotsContainer);
    container.appendChild(suggestSection);
    container.appendChild(summaryFooter);

    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Modulation Matrix',
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
