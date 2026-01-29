/**
 * @fileoverview Sample Manager Deck Factory (M100)
 *
 * Implements sample-manager-deck for organizing, tagging, and managing
 * sample libraries. Distinct from sample-browser (browsing/previewing).
 *
 * @module @cardplay/boards/decks/factories/sample-manager-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { getSampleOrganizationSchemes } from '../../../ai/queries/persona-queries';

/**
 * Sample manager deck factory.
 *
 * Provides sample library management:
 * - Sample categorization (by type, genre, key, mood)
 * - Tag editing and batch tagging
 * - Collection management (user-created folders)
 * - Missing sample detection
 * - Duplicate detection
 * - Sample metadata display (key, tempo, duration)
 */
export const sampleManagerFactory: DeckFactory = {
  deckType: 'sample-manager-deck',

  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'deck-sample-manager';
    container.style.cssText = `
      padding: 1rem;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    `;

    // Header with view mode toggle
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <div style="font-weight: 600; color: var(--color-on-surface);">Sample Manager</div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="sm-view-btn" data-view="list" style="padding: 0.25rem 0.5rem; border: 1px solid var(--color-outline); background: var(--color-primary); color: var(--color-on-primary); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.75rem;">List</button>
        <button class="sm-view-btn" data-view="grid" style="padding: 0.25rem 0.5rem; border: 1px solid var(--color-outline); background: transparent; color: var(--color-on-surface); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.75rem;">Grid</button>
        <button class="sm-view-btn" data-view="tags" style="padding: 0.25rem 0.5rem; border: 1px solid var(--color-outline); background: transparent; color: var(--color-on-surface); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.75rem;">Tags</button>
      </div>
    `;

    // Search / filter bar
    const searchBar = document.createElement('div');
    searchBar.style.cssText = `
      display: flex;
      gap: 0.5rem;
      align-items: center;
    `;
    searchBar.innerHTML = `
      <input type="text" placeholder="Search samples\u2026" style="flex: 1; padding: 0.5rem; border: 1px solid var(--color-outline); border-radius: var(--radius-sm); background: var(--color-surface-variant); color: var(--color-on-surface); font-size: 0.875rem;" />
      <select style="padding: 0.5rem; border: 1px solid var(--color-outline); border-radius: var(--radius-sm); background: var(--color-surface-variant); color: var(--color-on-surface); font-size: 0.875rem;">
        <option value="all">All Categories</option>
        <option value="drums">Drums</option>
        <option value="bass">Bass</option>
        <option value="synth">Synth</option>
        <option value="vocals">Vocals</option>
        <option value="fx">FX</option>
        <option value="foley">Foley</option>
      </select>
    `;

    // Sample list area
    const sampleList = document.createElement('div');
    sampleList.className = 'sample-manager-list';
    sampleList.style.cssText = `
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-height: 200px;
    `;

    // Placeholder samples
    const placeholderSamples = [
      { name: 'Kick_808.wav', category: 'drums', key: '--', bpm: '--', tags: ['808', 'sub', 'heavy'] },
      { name: 'Snare_Tight.wav', category: 'drums', key: '--', bpm: '--', tags: ['snare', 'tight', 'pop'] },
      { name: 'HiHat_Open.wav', category: 'drums', key: '--', bpm: '--', tags: ['hihat', 'open'] },
      { name: 'Bass_Sub_C.wav', category: 'bass', key: 'C', bpm: '--', tags: ['sub', 'deep'] },
      { name: 'Pad_Ambient_Dm.wav', category: 'synth', key: 'Dm', bpm: '120', tags: ['ambient', 'dark', 'pad'] },
    ];

    placeholderSamples.forEach((sample) => {
      const row = document.createElement('div');
      row.style.cssText = `
        padding: 0.5rem 0.75rem;
        background: var(--color-surface-variant);
        border-radius: var(--radius-sm);
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
      `;
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 0.875rem; color: var(--color-on-surface);">${sample.name}</span>
          <span style="font-size: 0.75rem; padding: 0.1rem 0.4rem; background: var(--color-primary-container); color: var(--color-on-primary-container); border-radius: 2px;">${sample.category}</span>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          ${sample.tags.map((t) => `<span style="font-size: 0.625rem; padding: 0.1rem 0.3rem; background: var(--color-secondary-container); color: var(--color-on-secondary-container); border-radius: 2px;">${t}</span>`).join('')}
          ${sample.key !== '--' ? `<span style="font-size: 0.75rem; color: var(--color-on-surface-variant);">${sample.key}</span>` : ''}
        </div>
      `;
      sampleList.appendChild(row);
    });

    // Actions footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      display: flex;
      gap: 0.5rem;
      justify-content: space-between;
      border-top: 1px solid var(--color-outline-variant);
      padding-top: 0.5rem;
    `;

    const organizeBtn = document.createElement('button');
    organizeBtn.textContent = 'Auto-Organize';
    organizeBtn.style.cssText = `
      padding: 0.4rem 0.75rem; font-size: 0.8125rem;
      background: var(--color-primary, #0066cc); color: white;
      border: none; border-radius: 4px; cursor: pointer;
    `;

    const organizeOutput = document.createElement('div');
    organizeOutput.style.cssText = 'font-size: 0.75rem; color: var(--color-on-surface-variant); display: flex; align-items: center;';
    organizeOutput.textContent = '5 samples loaded';

    organizeBtn.addEventListener('click', async () => {
      organizeOutput.textContent = 'Analyzing\u2026';
      try {
        const schemes = await getSampleOrganizationSchemes();
        if (schemes.length === 0) {
          organizeOutput.textContent = 'No organization schemes available.';
        } else {
          organizeOutput.innerHTML = '<strong>Schemes:</strong> ' +
            schemes.map((s) =>
              `<span style="padding: 1px 4px; background: var(--surface-raised, #f5f5f5); border-radius: 3px; margin-left: 4px; font-size: 0.75rem;">${s.scheme}</span>`
            ).join('');
        }
      } catch {
        organizeOutput.innerHTML = '<em style="color: var(--danger-base, red);">Organization failed.</em>';
      }
    });

    footer.appendChild(organizeBtn);
    footer.appendChild(organizeOutput);

    container.appendChild(header);
    container.appendChild(searchBar);
    container.appendChild(sampleList);
    container.appendChild(footer);

    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Sample Manager',
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
