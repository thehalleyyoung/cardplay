/**
 * @fileoverview Mix Bus Deck Factory (M259)
 *
 * Creates mix bus deck for group processing.
 * Provides bus strips with insert effects, send levels, and routing.
 *
 * @module @cardplay/boards/decks/factories/mix-bus-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

/**
 * A mix bus definition.
 */
export interface MixBus {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly type: 'group' | 'aux' | 'fx' | 'master';
  readonly inputs: readonly string[];
  readonly inserts: readonly string[];
  readonly sendLevel: number; // 0-1
  readonly muted: boolean;
}

/**
 * Factory for creating mix bus deck instances.
 * M259: Add "Mix Bus" deck for group processing.
 */
export const mixBusDeckFactory: DeckFactory = {
  deckType: 'mix-bus-deck',
  
  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'mix-bus-deck-container';
    container.setAttribute('data-deck-id', deckDef.id);
    container.setAttribute('data-deck-type', 'mix-bus-deck');
    
    const header = document.createElement('div');
    header.className = 'mix-bus-deck-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background: var(--surface-raised, #f5f5f5);
      border-bottom: 1px solid var(--border-base, #ccc);
    `;
    
    header.innerHTML = `
      <span style="font-weight: 600;">Mix Buses</span>
      <button class="add-bus-btn" style="
        padding: 4px 8px;
        font-size: 0.75rem;
        border: 1px solid var(--border-base, #ccc);
        border-radius: 4px;
        background: var(--surface-base, #fff);
        cursor: pointer;
      ">+ Add Bus</button>
    `;
    
    const content = document.createElement('div');
    content.className = 'mix-bus-content';
    content.style.cssText = `
      padding: 8px;
      background: var(--surface-base, #fff);
      border: 1px solid var(--border-base, #ccc);
      border-radius: 0 0 4px 4px;
      min-height: 250px;
      display: flex;
      gap: 8px;
      overflow-x: auto;
    `;
    
    // Sample buses
    const sampleBuses: MixBus[] = [
      { id: 'drum-bus', name: 'Drum Bus', color: '#ff6b6b', type: 'group', inputs: ['kick', 'snare', 'hats'], inserts: ['Compressor', 'EQ'], sendLevel: 0, muted: false },
      { id: 'reverb', name: 'Reverb', color: '#74b9ff', type: 'fx', inputs: [], inserts: ['Plate Reverb'], sendLevel: 0.4, muted: false },
      { id: 'delay', name: 'Delay', color: '#ffeaa7', type: 'fx', inputs: [], inserts: ['Ping Pong Delay'], sendLevel: 0.3, muted: false },
      { id: 'parallel', name: 'Parallel Comp', color: '#a29bfe', type: 'aux', inputs: ['drum-bus'], inserts: ['Heavy Compressor'], sendLevel: 0.5, muted: false },
      { id: 'master', name: 'Master', color: '#2d3436', type: 'master', inputs: ['drum-bus', 'bass-bus', 'synth-bus'], inserts: ['Limiter', 'Stereo Imager'], sendLevel: 1, muted: false },
    ];
    
    for (const bus of sampleBuses) {
      const busEl = createBusElement(bus);
      content.appendChild(busEl);
    }
    
    container.appendChild(header);
    container.appendChild(content);
    
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Mix Buses',
      render: () => container,
      destroy: () => {
        container.remove();
      },
    };
  },
};

/**
 * Create a bus strip element.
 */
function createBusElement(bus: MixBus): HTMLElement {
  const el = document.createElement('div');
  el.className = 'mix-bus-strip';
  el.style.cssText = `
    min-width: 100px;
    background: var(--surface-raised, #f5f5f5);
    border: 2px solid ${bus.color};
    border-radius: 4px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;
  
  const typeIcons: Record<string, string> = {
    group: '📁',
    aux: '🔀',
    fx: '✨',
    master: '🎛️',
  };
  
  el.innerHTML = `
    <div style="display: flex; align-items: center; gap: 4px;">
      <span>${typeIcons[bus.type] ?? '📁'}</span>
      <span style="font-size: 0.75rem; font-weight: 600; flex: 1;">${bus.name}</span>
    </div>
    
    <div style="font-size: 0.625rem; color: #666;">
      ${bus.inputs.length} inputs
    </div>
    
    <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
      <div style="font-size: 0.625rem; color: #666;">Inserts:</div>
      ${bus.inserts.map(insert => `
        <div style="
          padding: 2px 4px;
          font-size: 0.625rem;
          background: var(--surface-base, #fff);
          border: 1px solid var(--border-base, #ccc);
          border-radius: 2px;
        ">${insert}</div>
      `).join('')}
      <div style="
        padding: 2px 4px;
        font-size: 0.625rem;
        color: #aaa;
        border: 1px dashed var(--border-base, #ccc);
        border-radius: 2px;
        text-align: center;
        cursor: pointer;
      ">+ Add Insert</div>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 2px;">
      <div style="font-size: 0.625rem; color: #666;">Level</div>
      <div style="
        height: 60px;
        background: var(--surface-sunken, #fafafa);
        border: 1px solid var(--border-base, #ccc);
        border-radius: 2px;
        position: relative;
      ">
        <div style="
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: ${bus.sendLevel * 100}%;
          background: linear-gradient(to top, ${bus.color}, ${bus.color}80);
          border-radius: 2px;
        "></div>
      </div>
    </div>
    
    <div style="display: flex; gap: 4px; justify-content: center;">
      <button style="
        width: 24px; height: 24px; font-size: 0.625rem;
        border: 1px solid var(--border-base, #ccc);
        border-radius: 2px;
        background: ${bus.muted ? '#ff6b6b' : 'var(--surface-base, #fff)'};
        color: ${bus.muted ? '#fff' : 'inherit'};
      ">M</button>
    </div>
  `;
  
  return el;
}

export default mixBusDeckFactory;
