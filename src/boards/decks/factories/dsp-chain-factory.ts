/**
 * @fileoverview DSP Chain Deck Factory (E042-E043)
 * 
 * Creates effect chain decks for routing audio effects.
 * E042: Implement DeckType: dsp-chain factory as effect stack.
 * E043: Integrate with routing graph (effect chain connections).
 * 
 * @module @cardplay/boards/decks/factories/dsp-chain-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

/**
 * Factory for creating DSP chain deck instances.
 * E042: Effect stack (StackComponent of effect cards)
 * E043: Integrates with routing graph
 */
export const dspChainFactory: DeckFactory = {
  deckType: 'dsp-chain',
  
  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'dsp-chain-container';
    container.setAttribute('data-deck-id', deckDef.id);
    container.setAttribute('data-deck-type', 'dsp-chain');
    
    // Header
    const header = document.createElement('div');
    header.className = 'dsp-chain-header';
    header.style.cssText = `
      padding: 8px 12px;
      background: var(--surface-raised, #f5f5f5);
      border-bottom: 1px solid var(--border-base, #ccc);
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    
    const title = document.createElement('span');
    title.textContent = 'Effects Chain';
    title.style.fontWeight = 'bold';
    header.appendChild(title);
    
    const addButton = document.createElement('button');
    addButton.textContent = '+ Add Effect';
    addButton.style.cssText = `
      padding: 4px 8px;
      font-size: 0.875rem;
      background: var(--primary-base, #0066cc);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;
    addButton.addEventListener('click', () => {
      // E042: Add effect card to stack
      // This would open an effect browser filtered by Phase D gating
      console.log('Add effect - would open gated effect browser');
    });
    header.appendChild(addButton);
    
    container.appendChild(header);
    
    // E042: Effect chain stack
    const chainContainer = document.createElement('div');
    chainContainer.className = 'effect-chain-stack';
    chainContainer.style.cssText = `
      padding: 12px;
      background: var(--surface-base, #fff);
      min-height: 200px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    
    // E043: Show routing connections (placeholder)
    const routingInfo = document.createElement('div');
    routingInfo.style.cssText = `
      padding: 8px;
      background: var(--surface-sunken, #fafafa);
      border: 1px dashed var(--border-base, #ccc);
      border-radius: 4px;
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
      text-align: center;
    `;
    routingInfo.innerHTML = `
      <p><strong>Effect Chain</strong></p>
      <p style="margin-top: 4px;">Drop effects here to build audio processing chain</p>
      <p style="margin-top: 8px; font-size: 0.8125rem; color: var(--text-tertiary, #999);">
        E043: Routing graph integration<br>
        Effects are connected in series: Input → Effect 1 → Effect 2 → ... → Output
      </p>
    `;
    chainContainer.appendChild(routingInfo);
    
    // Example effect slots (placeholder)
    const exampleEffects = ['Reverb', 'EQ', 'Compressor'];
    exampleEffects.forEach((effectName, index) => {
      const effectSlot = document.createElement('div');
      effectSlot.style.cssText = `
        padding: 12px;
        background: var(--surface-raised, #f5f5f5);
        border: 1px solid var(--border-base, #ccc);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: move;
      `;
      effectSlot.setAttribute('draggable', 'true');
      
      const effectInfo = document.createElement('div');
      effectInfo.innerHTML = `
        <div style="font-weight: 500;">${index + 1}. ${effectName} (Example)</div>
        <div style="font-size: 0.8125rem; color: var(--text-secondary, #666); margin-top: 2px;">
          ${effectName === 'Reverb' ? 'Room: Medium, Decay: 2.5s' : 
            effectName === 'EQ' ? 'Type: Parametric, Bands: 5' : 
            'Ratio: 4:1, Threshold: -12dB'}
        </div>
      `;
      effectSlot.appendChild(effectInfo);
      
      const controls = document.createElement('div');
      controls.style.cssText = 'display: flex; gap: 8px;';
      
      const bypassBtn = document.createElement('button');
      bypassBtn.textContent = 'Bypass';
      bypassBtn.style.cssText = `
        padding: 4px 8px;
        font-size: 0.75rem;
        background: var(--surface-base, #fff);
        border: 1px solid var(--border-base, #ccc);
        border-radius: 3px;
        cursor: pointer;
      `;
      controls.appendChild(bypassBtn);
      
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.style.cssText = `
        padding: 4px 8px;
        font-size: 1rem;
        background: var(--danger-base, #cc0000);
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        width: 24px;
      `;
      removeBtn.addEventListener('click', () => {
        effectSlot.remove();
      });
      controls.appendChild(removeBtn);
      
      effectSlot.appendChild(controls);
      chainContainer.appendChild(effectSlot);
    });
    
    container.appendChild(chainContainer);
    
    // E043: Routing graph footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 8px 12px;
      background: var(--surface-sunken, #fafafa);
      border-top: 1px solid var(--border-base, #ccc);
      font-size: 0.8125rem;
      color: var(--text-secondary, #666);
    `;
    footer.innerHTML = `
      Routing: Track Input → Effects (${exampleEffects.length}) → Track Output
    `;
    container.appendChild(footer);
    
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Effects Chain',
      render: () => container,
      destroy: () => {
        container.remove();
      }
    };
  },
  
  validate(deckDef: BoardDeck): string | null {
    if (deckDef.type !== 'dsp-chain') {
      return 'Deck type must be dsp-chain';
    }
    return null;
  }
};
