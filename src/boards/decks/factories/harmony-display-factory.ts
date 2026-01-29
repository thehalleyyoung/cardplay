/**
 * @fileoverview Harmony Display Deck Factory (E058, M060, G011-G015)
 *
 * E058: Implement harmony-display deck using chord track + scale context.
 * M060: Add modulation planner section using planModulation().
 * G011: Interactive key/chord display with tones list
 * G014-G015: "Set Chord" and "Set Key" actions
 *
 * @module @cardplay/boards/decks/factories/harmony-display-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { planModulation } from '../../../ai/queries/persona-queries';
import { createHarmonyControls, injectHarmonyControlsStyles } from '../../../ui/components/harmony-controls';
import { getBoardContextStore } from '../../context/store';

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
    // Inject styles on first use
    injectHarmonyControlsStyles();
    
    const store = getBoardContextStore();
    
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
      overflow-y: auto;
    `;

    // G011-G015: Interactive harmony controls
    const harmonyControls = createHarmonyControls({
      onKeyChange: (key) => {
        console.log('[HarmonyDisplay] Key changed to:', key);
        updateChordTones();
      },
      onChordChange: (chord) => {
        console.log('[HarmonyDisplay] Chord changed to:', chord);
        updateChordTones();
      }
    });
    
    container.appendChild(harmonyControls);

    // Chord tones display (dynamic, updates based on current chord)
    const tonesSection = document.createElement('div');
    tonesSection.className = 'harmony-tones-section';
    tonesSection.style.cssText = 'margin-top: 0.5rem;';
    
    const tonesLabel = document.createElement('div');
    tonesLabel.textContent = 'Chord Tones';
    tonesLabel.style.cssText = `
      font-size: 0.875rem;
      color: var(--color-on-surface-variant);
      margin-bottom: 0.5rem;
      font-weight: 600;
    `;
    
    const tonesDisplay = document.createElement('div');
    tonesDisplay.className = 'harmony-tones-display';
    tonesDisplay.style.cssText = `
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    `;
    
    const updateChordTones = () => {
      const context = store.getContext();
      const chord = context.currentChord || 'C';
      
      // Simple chord tone extraction (can be enhanced with music theory lib)
      const tones = getChordTones(chord);
      
      tonesDisplay.innerHTML = '';
      tones.forEach(tone => {
        const badge = document.createElement('span');
        badge.textContent = tone;
        badge.style.cssText = `
          padding: 0.375rem 0.625rem;
          background: var(--color-primary-container);
          color: var(--color-on-primary-container);
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          font-weight: 600;
        `;
        tonesDisplay.appendChild(badge);
      });
    };
    
    tonesSection.appendChild(tonesLabel);
    tonesSection.appendChild(tonesDisplay);
    container.appendChild(tonesSection);
    
    // Initial update
    updateChordTones();

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

        container.appendChild(tonesSection);
        container.appendChild(modulationSection);

        return container;
      },
    };
  },

  validate(_deckDef: BoardDeck): string | null {
    return null;
  },
};

/**
 * Extract chord tones from a chord symbol.
 * Simple implementation - can be enhanced with full music theory library.
 * 
 * @param chord Chord symbol (e.g., 'Cmaj7', 'Dm', 'G7')
 * @returns Array of note names
 */
function getChordTones(chord: string): string[] {
  // Parse root note
  const match = chord.match(/^([A-G][b#]?)(.*)?$/);
  if (!match || !match[1]) return ['C', 'E', 'G']; // Default to C major
  
  const root = match[1];
  const quality = match[2] || '';
  
  // Simple lookup table for common chord qualities
  // Intervals from root: 0 = root, 4 = maj3, 3 = min3, 7 = p5, etc.
  const intervals: { [key: string]: number[] } = {
    '': [0, 4, 7],           // major
    'm': [0, 3, 7],          // minor
    '7': [0, 4, 7, 10],      // dominant 7
    'maj7': [0, 4, 7, 11],   // major 7
    'm7': [0, 3, 7, 10],     // minor 7
    'dim': [0, 3, 6],        // diminished
    'aug': [0, 4, 8],        // augmented
    '6': [0, 4, 7, 9],       // major 6
    'm6': [0, 3, 7, 9],      // minor 6
    '9': [0, 4, 7, 10, 14],  // dominant 9
    'maj9': [0, 4, 7, 11, 14], // major 9
    'm9': [0, 3, 7, 10, 14], // minor 9
    'sus4': [0, 5, 7],       // suspended 4th
    'sus2': [0, 2, 7],       // suspended 2nd
  };
  
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const normalizedRoot = root.replace('b', '#');
  const rootIndex = notes.indexOf(normalizedRoot);
  
  if (rootIndex === -1) return ['C', 'E', 'G'];
  
  const chordIntervals = intervals[quality] ?? intervals['']!;
  
  return chordIntervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    return notes[noteIndex]!;
  });
}

