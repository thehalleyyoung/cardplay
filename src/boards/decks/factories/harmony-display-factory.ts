/**
 * @fileoverview Harmony Display Deck Factory (E058, M060)
 *
 * E058: Implement harmony-display deck using chord track + scale context.
 * M060: Add modulation planner section using planModulation().
 *
 * @module @cardplay/boards/decks/factories/harmony-display-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { planModulation } from '../../../ai/queries/persona-queries';

/**
 * Harmony display deck factory.
 *
 * Displays:
 * - Current key
 * - Current chord
 * - Chord tones
 * - Scale tones
 * - Roman numeral analysis
 */
export const harmonyDisplayFactory: DeckFactory = {
  deckType: 'harmony-deck',

  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Harmony',
      render: () => {
        const container = document.createElement('div');
        container.className = 'deck-harmony-display';
        container.setAttribute('data-deck-id', deckDef.id);
        container.style.cssText = `
      padding: 1rem;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    `;

    // Key display
    const keySection = document.createElement('div');
    keySection.className = 'harmony-key-section';
    keySection.innerHTML = `
      <div style="font-size: 0.875rem; color: var(--color-on-surface-variant); margin-bottom: 0.5rem;">Key</div>
      <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-on-surface);">C Major</div>
    `;

    // Chord display
    const chordSection = document.createElement('div');
    chordSection.className = 'harmony-chord-section';
    chordSection.innerHTML = `
      <div style="font-size: 0.875rem; color: var(--color-on-surface-variant); margin-bottom: 0.5rem;">Current Chord</div>
      <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary);">Cmaj7</div>
      <div style="font-size: 0.875rem; color: var(--color-on-surface-variant); margin-top: 0.25rem;">I△7</div>
    `;

    // Chord tones display
    const tonesSection = document.createElement('div');
    tonesSection.className = 'harmony-tones-section';
    tonesSection.innerHTML = `
      <div style="font-size: 0.875rem; color: var(--color-on-surface-variant); margin-bottom: 0.5rem;">Chord Tones</div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <span style="padding: 0.25rem 0.5rem; background: var(--color-primary-container); color: var(--color-on-primary-container); border-radius: var(--radius-sm); font-size: 0.875rem;">C</span>
        <span style="padding: 0.25rem 0.5rem; background: var(--color-primary-container); color: var(--color-on-primary-container); border-radius: var(--radius-sm); font-size: 0.875rem;">E</span>
        <span style="padding: 0.25rem 0.5rem; background: var(--color-primary-container); color: var(--color-on-primary-container); border-radius: var(--radius-sm); font-size: 0.875rem;">G</span>
        <span style="padding: 0.25rem 0.5rem; background: var(--color-primary-container); color: var(--color-on-primary-container); border-radius: var(--radius-sm); font-size: 0.875rem;">B</span>
      </div>
    `;

    // Scale tones display
    const scaleSection = document.createElement('div');
    scaleSection.className = 'harmony-scale-section';
    scaleSection.innerHTML = `
      <div style="font-size: 0.875rem; color: var(--color-on-surface-variant); margin-bottom: 0.5rem;">Scale Tones</div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <span style="padding: 0.25rem 0.5rem; background: var(--color-surface-variant); color: var(--color-on-surface-variant); border-radius: var(--radius-sm); font-size: 0.875rem;">C</span>
        <span style="padding: 0.25rem 0.5rem; background: var(--color-surface-variant); color: var(--color-on-surface-variant); border-radius: var(--radius-sm); font-size: 0.875rem;">D</span>
        <span style="padding: 0.25rem 0.5rem; background: var(--color-surface-variant); color: var(--color-on-surface-variant); border-radius: var(--radius-sm); font-size: 0.875rem;">E</span>
        <span style="padding: 0.25rem 0.5rem; background: var(--color-surface-variant); color: var(--color-on-surface-variant); border-radius: var(--radius-sm); font-size: 0.875rem;">F</span>
        <span style="padding: 0.25rem 0.5rem; background: var(--color-surface-variant); color: var(--color-on-surface-variant); border-radius: var(--radius-sm); font-size: 0.875rem;">G</span>
        <span style="padding: 0.25rem 0.5rem; background: var(--color-surface-variant); color: var(--color-on-surface-variant); border-radius: var(--radius-sm); font-size: 0.875rem;">A</span>
        <span style="padding: 0.25rem 0.5rem; background: var(--color-surface-variant); color: var(--color-on-surface-variant); border-radius: var(--radius-sm); font-size: 0.875rem;">B</span>
      </div>
    `;

        // M060: Modulation planner section
        const modulationSection = document.createElement('div');
        modulationSection.className = 'harmony-modulation-planner';
        modulationSection.style.cssText = `
          border-top: 1px solid var(--border-base, #ccc);
          padding-top: 0.75rem;
          margin-top: 0.25rem;
        `;
        modulationSection.innerHTML = `
          <div style="font-size: 0.875rem; color: var(--color-on-surface-variant); margin-bottom: 0.5rem;">Modulation Planner</div>
        `;

        const modulationForm = document.createElement('div');
        modulationForm.style.cssText = 'display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;';

        const fromInput = document.createElement('select');
        fromInput.style.cssText = 'padding: 4px; font-size: 0.8125rem; border: 1px solid var(--border-base, #ccc); border-radius: 4px;';
        const toInput = document.createElement('select');
        toInput.style.cssText = fromInput.style.cssText;
        const keys = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
        for (const k of keys) {
          const opt1 = document.createElement('option');
          opt1.value = k; opt1.textContent = k.toUpperCase();
          fromInput.appendChild(opt1);
          const opt2 = document.createElement('option');
          opt2.value = k; opt2.textContent = k.toUpperCase();
          toInput.appendChild(opt2);
        }
        toInput.value = 'g'; // default target

        const planBtn = document.createElement('button');
        planBtn.textContent = 'Plan';
        planBtn.style.cssText = `
          padding: 4px 10px; font-size: 0.8125rem;
          background: var(--primary-base, #0066cc); color: white;
          border: none; border-radius: 4px; cursor: pointer;
        `;

        const fromLabel = document.createTextNode('From: ');
        const toLabel = document.createTextNode(' To: ');
        modulationForm.appendChild(fromLabel);
        modulationForm.appendChild(fromInput);
        modulationForm.appendChild(toLabel);
        modulationForm.appendChild(toInput);
        modulationForm.appendChild(planBtn);
        modulationSection.appendChild(modulationForm);

        const modulationResults = document.createElement('div');
        modulationResults.style.cssText = 'margin-top: 0.5rem; font-size: 0.8125rem;';
        modulationSection.appendChild(modulationResults);

        planBtn.addEventListener('click', async () => {
          modulationResults.innerHTML = '<em>Planning modulation&hellip;</em>';
          try {
            // planModulation() returns all modulation techniques with rarity
            // The from/to selection provides UI context for filtering
            const plans = await planModulation();
            if (plans.length === 0) {
              modulationResults.innerHTML = '<em>No modulation techniques found.</em>';
            } else {
              const fromKey = fromInput.value.toUpperCase();
              const toKey = toInput.value.toUpperCase();
              modulationResults.innerHTML = `<strong>${fromKey} → ${toKey} techniques:</strong> ` +
                plans.map((p: { modulationType: string; rarity: string }) => `<span style="padding: 2px 6px; background: var(--surface-raised, #f5f5f5); border-radius: 3px;">${p.modulationType} <small>(${p.rarity})</small></span>`).join(' | ');
            }
          } catch {
            modulationResults.innerHTML = '<em style="color: var(--danger-base, red);">Failed to plan modulation.</em>';
          }
        });

        container.appendChild(keySection);
        container.appendChild(chordSection);
        container.appendChild(tonesSection);
        container.appendChild(scaleSection);
        container.appendChild(modulationSection);

        // TODO: Wire up to chord track stream and active context
        // TODO: Add chord picker/editor UI
        // TODO: Add key signature editor

        return container;
      },
    };
  },

  validate(_deckDef: BoardDeck): string | null {
    return null;
  },
};
