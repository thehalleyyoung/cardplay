/**
 * @fileoverview Track Groups Deck Factory (M258)
 *
 * Creates track groups deck for organizing stems into logical groups.
 * Groups can be expanded/collapsed, color-coded, and routed together.
 *
 * @module @cardplay/boards/decks/factories/track-groups-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

/**
 * A track group definition.
 */
export interface TrackGroup {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly trackIds: readonly string[];
  readonly collapsed: boolean;
  readonly muted: boolean;
  readonly soloed: boolean;
}

/**
 * Factory for creating track groups deck instances.
 * M258: Add "Track Groups" deck for organizing stems.
 */
export const trackGroupsDeckFactory: DeckFactory = {
  deckType: 'track-groups-deck',
  
  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'track-groups-deck-container';
    container.setAttribute('data-deck-id', deckDef.id);
    container.setAttribute('data-deck-type', 'track-groups-deck');
    
    const header = document.createElement('div');
    header.className = 'track-groups-deck-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background: var(--surface-raised, #f5f5f5);
      border-bottom: 1px solid var(--border-base, #ccc);
    `;
    
    header.innerHTML = `
      <span style="font-weight: 600;">Track Groups</span>
      <button class="add-group-btn" style="
        padding: 4px 8px;
        font-size: 0.75rem;
        border: 1px solid var(--border-base, #ccc);
        border-radius: 4px;
        background: var(--surface-base, #fff);
        cursor: pointer;
      ">+ Add Group</button>
    `;
    
    const content = document.createElement('div');
    content.className = 'track-groups-content';
    content.style.cssText = `
      padding: 8px;
      background: var(--surface-base, #fff);
      border: 1px solid var(--border-base, #ccc);
      border-radius: 0 0 4px 4px;
      min-height: 200px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    
    // Sample groups
    const sampleGroups: TrackGroup[] = [
      { id: 'drums', name: 'Drums', color: '#ff6b6b', trackIds: ['kick', 'snare', 'hats'], collapsed: false, muted: false, soloed: false },
      { id: 'bass', name: 'Bass', color: '#4ecdc4', trackIds: ['bass', 'sub'], collapsed: false, muted: false, soloed: false },
      { id: 'synths', name: 'Synths', color: '#a29bfe', trackIds: ['lead', 'pad'], collapsed: true, muted: false, soloed: false },
      { id: 'fx', name: 'FX', color: '#ffeaa7', trackIds: ['riser', 'impact'], collapsed: true, muted: true, soloed: false },
    ];
    
    for (const group of sampleGroups) {
      const groupEl = createGroupElement(group);
      content.appendChild(groupEl);
    }
    
    container.appendChild(header);
    container.appendChild(content);
    
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Track Groups',
      render: () => container,
      destroy: () => {
        container.remove();
      },
    };
  },
};

/**
 * Create a group element.
 */
function createGroupElement(group: TrackGroup): HTMLElement {
  const el = document.createElement('div');
  el.className = 'track-group';
  el.style.cssText = `
    border: 2px solid ${group.color};
    border-radius: 4px;
    overflow: hidden;
  `;
  
  const headerEl = document.createElement('div');
  headerEl.className = 'track-group-header';
  headerEl.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: ${group.color}20;
    cursor: pointer;
  `;
  
  const collapseIcon = group.collapsed ? '▶' : '▼';
  const mutedOpacity = group.muted ? '0.5' : '1';
  
  headerEl.innerHTML = `
    <span class="collapse-icon" style="font-size: 0.625rem;">${collapseIcon}</span>
    <span style="
      width: 12px;
      height: 12px;
      background: ${group.color};
      border-radius: 2px;
    "></span>
    <span style="font-weight: 600; flex: 1; opacity: ${mutedOpacity};">${group.name}</span>
    <span style="font-size: 0.75rem; color: #666;">${group.trackIds.length} tracks</span>
    <button class="group-mute-btn" style="
      width: 24px; height: 24px; font-size: 0.625rem;
      border: 1px solid var(--border-base, #ccc);
      border-radius: 2px;
      background: ${group.muted ? '#ff6b6b' : 'var(--surface-raised, #f5f5f5)'};
      color: ${group.muted ? '#fff' : 'inherit'};
    ">M</button>
    <button class="group-solo-btn" style="
      width: 24px; height: 24px; font-size: 0.625rem;
      border: 1px solid var(--border-base, #ccc);
      border-radius: 2px;
      background: ${group.soloed ? '#ffd93d' : 'var(--surface-raised, #f5f5f5)'};
    ">S</button>
  `;
  
  const tracksEl = document.createElement('div');
  tracksEl.className = 'track-group-tracks';
  tracksEl.style.cssText = `
    display: ${group.collapsed ? 'none' : 'flex'};
    flex-direction: column;
    gap: 2px;
    padding: 4px;
    background: var(--surface-sunken, #fafafa);
  `;
  
  for (const trackId of group.trackIds) {
    const trackEl = document.createElement('div');
    trackEl.className = 'group-track-item';
    trackEl.style.cssText = `
      padding: 4px 8px;
      font-size: 0.75rem;
      background: var(--surface-base, #fff);
      border-radius: 2px;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    trackEl.innerHTML = `
      <span style="width: 6px; height: 6px; background: ${group.color}; border-radius: 1px;"></span>
      <span>${trackId}</span>
    `;
    tracksEl.appendChild(trackEl);
  }
  
  el.appendChild(headerEl);
  el.appendChild(tracksEl);
  
  return el;
}

export default trackGroupsDeckFactory;
