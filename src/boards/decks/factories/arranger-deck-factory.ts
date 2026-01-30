/**
 * @fileoverview Arranger Deck Factory
 *
 * E057: Implement arranger deck using sections bar + arranger card integration.
 *
 * @module @cardplay/boards/decks/factories/arranger-deck-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

/**
 * Arranger deck factory.
 *
 * Provides arrangement tools:
 * - Section blocks (intro, verse, chorus, bridge, outro)
 * - Style/energy controls
 * - Part toggles (drums, bass, melody, pads)
 * - Generate/regenerate actions
 */
export const arrangerFactory: DeckFactory = {
  deckType: 'arranger-deck',

  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'deck-arranger';
    container.style.cssText = `
      padding: 1rem;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    `;

    // Sections bar
    const sectionsBar = document.createElement('div');
    sectionsBar.className = 'arranger-sections';
    sectionsBar.style.cssText = `
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding: 0.5rem;
      background: var(--color-surface-variant);
      border-radius: var(--radius-sm);
    `;

    const sections = ['Intro', 'Verse', 'Chorus', 'Verse', 'Bridge', 'Chorus', 'Outro'];
    sections.forEach((section, index) => {
      const sectionBlock = document.createElement('div');
      sectionBlock.className = 'arranger-section';
      sectionBlock.style.cssText = `
        min-width: 6rem;
        padding: 1rem;
        background: var(--color-primary-container);
        color: var(--color-on-primary-container);
        border-radius: var(--radius-sm);
        text-align: center;
        font-weight: 600;
        cursor: pointer;
      `;
      sectionBlock.textContent = section;
      sectionBlock.onclick = () => {
        console.log('Select section:', section, index);
      };
      sectionsBar.appendChild(sectionBlock);
    });

    // Part toggles
    const partsSection = document.createElement('div');
    partsSection.className = 'arranger-parts';
    partsSection.innerHTML = `
      <div style="font-size: 0.875rem; color: var(--color-on-surface-variant); margin-bottom: 0.5rem;">Parts</div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button style="padding: 0.5rem 1rem; border: none; background: var(--color-primary); color: var(--color-on-primary); border-radius: var(--radius-sm); cursor: pointer;">🥁 Drums</button>
        <button style="padding: 0.5rem 1rem; border: none; background: var(--color-primary); color: var(--color-on-primary); border-radius: var(--radius-sm); cursor: pointer;">🎸 Bass</button>
        <button style="padding: 0.5rem 1rem; border: none; background: var(--color-primary); color: var(--color-on-primary); border-radius: var(--radius-sm); cursor: pointer;">🎵 Melody</button>
        <button style="padding: 0.5rem 1rem; border: none; background: var(--color-surface-variant); color: var(--color-on-surface-variant); border-radius: var(--radius-sm); cursor: pointer; opacity: 0.5;">🎹 Pads</button>
      </div>
    `;

    // Style controls
    const styleSection = document.createElement('div');
    styleSection.className = 'arranger-style';
    styleSection.innerHTML = `
      <div style="font-size: 0.875rem; color: var(--color-on-surface-variant); margin-bottom: 0.5rem;">Style</div>
      <select style="width: 100%; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-surface-variant); color: var(--color-on-surface);">
        <option>Lofi Hip Hop</option>
        <option>House</option>
        <option>Ambient</option>
        <option>Techno</option>
        <option>Jazz</option>
      </select>
    `;

    // Energy slider
    const energySection = document.createElement('div');
    energySection.className = 'arranger-energy';
    energySection.innerHTML = `
      <div style="font-size: 0.875rem; color: var(--color-on-surface-variant); margin-bottom: 0.5rem;">Energy</div>
      <input type="range" min="0" max="100" value="70" style="width: 100%;" />
      <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-on-surface-variant); margin-top: 0.25rem;">
        <span>Low</span>
        <span>High</span>
      </div>
    `;

    // Action buttons
    const actionsSection = document.createElement('div');
    actionsSection.className = 'arranger-actions';
    actionsSection.style.cssText = `
      display: flex;
      gap: 0.5rem;
    `;
    actionsSection.innerHTML = `
      <button style="flex: 1; padding: 0.75rem; border: none; background: var(--color-primary); color: var(--color-on-primary); border-radius: var(--radius-sm); cursor: pointer; font-weight: 600;">Generate Arrangement</button>
      <button style="flex: 1; padding: 0.75rem; border: none; background: var(--color-surface-variant); color: var(--color-on-surface); border-radius: var(--radius-sm); cursor: pointer;">Regenerate</button>
    `;

    container.appendChild(sectionsBar);
    container.appendChild(partsSection);
    container.appendChild(styleSection);
    container.appendChild(energySection);
    container.appendChild(actionsSection);

    // TODO: Wire up to arrangement logic
    // TODO: Connect to generator system
    // TODO: Add undo support

    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Arranger',
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
