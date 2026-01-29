/**
 * @fileoverview Mixer Deck Factory (E044-E046, M202)
 *
 * Creates mixer decks with track strips, meters, and mixing controls.
 * M202: Adds frequency balance analyzer using analyzeFrequencyBalance().
 *
 * @module @cardplay/boards/decks/factories/mixer-deck-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { analyzeFrequencyBalance } from '../../../ai/queries/persona-queries';

/**
 * Factory for creating mixer deck instances.
 * Renders track strips with volume/pan/mute/solo controls.
 */
export const mixerDeckFactory: DeckFactory = {
  deckType: 'mixer-deck',
  
  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'mixer-deck-container';
    container.setAttribute('data-deck-id', deckDef.id);
    container.setAttribute('data-deck-type', 'mixer-deck');
    
    const header = document.createElement('div');
    header.className = 'mixer-deck-header';
    header.textContent = 'Mixer';
    
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 16px;
      background: var(--surface-base, #fff);
      border: 1px solid var(--border-base, #ccc);
      border-radius: 4px;
      min-height: 300px;
      display: flex;
      gap: 8px;
      overflow-x: auto;
    `;
    
    // Create sample track strips
    for (let i = 1; i <= 4; i++) {
      const strip = document.createElement('div');
      strip.className = 'mixer-track-strip';
      strip.style.cssText = `
        min-width: 80px;
        background: var(--surface-raised, #f5f5f5);
        border: 1px solid var(--border-base, #ccc);
        border-radius: 4px;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      `;
      
      strip.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: 600; text-align: center;">Track ${i}</div>
        <div style="flex: 1; background: var(--surface-sunken, #fafafa); border: 1px solid var(--border-base, #ccc); border-radius: 2px; position: relative;">
          <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 60%; background: linear-gradient(to top, #51cf66, #94d82d); border-radius: 2px;"></div>
        </div>
        <div style="display: flex; gap: 4px; justify-content: center;">
          <button style="width: 24px; height: 24px; font-size: 0.625rem; border: 1px solid var(--border-base, #ccc); border-radius: 2px; background: var(--surface-raised, #f5f5f5);">M</button>
          <button style="width: 24px; height: 24px; font-size: 0.625rem; border: 1px solid var(--border-base, #ccc); border-radius: 2px; background: var(--surface-raised, #f5f5f5);">S</button>
        </div>
      `;
      
      content.appendChild(strip);
    }
    
    // M202: Frequency balance analyzer footer
    const analyzerFooter = document.createElement('div');
    analyzerFooter.className = 'mixer-frequency-analyzer';
    analyzerFooter.style.cssText = `
      padding: 8px 12px;
      background: var(--surface-sunken, #fafafa);
      border: 1px solid var(--border-base, #ccc);
      border-radius: 0 0 4px 4px;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    const analyzeBtn = document.createElement('button');
    analyzeBtn.textContent = 'Analyze Balance';
    analyzeBtn.style.cssText = `
      padding: 4px 8px;
      font-size: 0.75rem;
      background: var(--primary-base, #0066cc);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;

    const analyzerOutput = document.createElement('span');
    analyzerOutput.style.cssText = 'color: var(--text-secondary, #666);';
    analyzerOutput.textContent = 'Click to check frequency balance';

    analyzeBtn.addEventListener('click', async () => {
      analyzerOutput.textContent = 'Analyzing\u2026';
      try {
        // Use the track strip names as placeholder track types
        const trackTypes = Array.from({ length: 4 }, (_, i) => `track_${i + 1}`);
        const issues = await analyzeFrequencyBalance(trackTypes);
        if (issues.length === 0) {
          analyzerOutput.innerHTML = '<span style="color: var(--success-base, green);">No balance issues detected.</span>';
        } else {
          analyzerOutput.innerHTML = issues
            .map(i => `<span style="color: ${i.severity === 'warning' ? 'var(--warning-base, orange)' : 'var(--text-secondary, #666)'};">${i.range}: ${i.description}</span>`)
            .join(' | ');
        }
      } catch {
        analyzerOutput.innerHTML = '<span style="color: var(--danger-base, red);">Analysis failed.</span>';
      }
    });

    analyzerFooter.appendChild(analyzeBtn);
    analyzerFooter.appendChild(analyzerOutput);

    container.appendChild(header);
    container.appendChild(content);
    container.appendChild(analyzerFooter);

    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Mixer',
      render: () => container,
      destroy: () => {
        container.remove();
      }
    };
  }
};
