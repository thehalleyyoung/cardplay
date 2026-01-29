/**
 * @fileoverview Reference Track Deck Factory (M260)
 *
 * Creates reference track deck for A/B comparison during mixing.
 * Allows loading reference tracks and switching between mix and reference.
 *
 * @module @cardplay/boards/decks/factories/reference-track-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

/**
 * A reference track.
 */
export interface ReferenceTrack {
  readonly id: string;
  readonly name: string;
  readonly artist?: string;
  readonly genre?: string;
  readonly duration: number; // seconds
  readonly notes?: string;
}

/**
 * Factory for creating reference track deck instances.
 * M260: Add "Reference Track" deck for A/B comparison.
 */
export const referenceTrackDeckFactory: DeckFactory = {
  deckType: 'reference-track-deck',
  
  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'reference-track-deck-container';
    container.setAttribute('data-deck-id', deckDef.id);
    container.setAttribute('data-deck-type', 'reference-track-deck');
    
    const header = document.createElement('div');
    header.className = 'reference-track-deck-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background: var(--surface-raised, #f5f5f5);
      border-bottom: 1px solid var(--border-base, #ccc);
    `;
    
    header.innerHTML = `
      <span style="font-weight: 600;">Reference Tracks</span>
      <button class="load-ref-btn" style="
        padding: 4px 8px;
        font-size: 0.75rem;
        border: 1px solid var(--border-base, #ccc);
        border-radius: 4px;
        background: var(--surface-base, #fff);
        cursor: pointer;
      ">+ Load Reference</button>
    `;
    
    const content = document.createElement('div');
    content.className = 'reference-track-content';
    content.style.cssText = `
      padding: 8px;
      background: var(--surface-base, #fff);
      border: 1px solid var(--border-base, #ccc);
      border-radius: 0 0 4px 4px;
      min-height: 200px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;
    
    // A/B switch section
    const abSection = document.createElement('div');
    abSection.className = 'ab-switch-section';
    abSection.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 12px;
      background: var(--surface-sunken, #fafafa);
      border-radius: 4px;
    `;
    
    abSection.innerHTML = `
      <button class="ab-mix-btn" style="
        padding: 8px 24px;
        font-size: 0.875rem;
        font-weight: 600;
        border: 2px solid #4ecdc4;
        border-radius: 4px;
        background: #4ecdc4;
        color: #fff;
        cursor: pointer;
      ">A - Mix</button>
      <span style="font-size: 1.5rem; color: #666;">⇄</span>
      <button class="ab-ref-btn" style="
        padding: 8px 24px;
        font-size: 0.875rem;
        font-weight: 600;
        border: 2px solid var(--border-base, #ccc);
        border-radius: 4px;
        background: var(--surface-base, #fff);
        color: inherit;
        cursor: pointer;
      ">B - Reference</button>
    `;
    
    // Reference tracks list
    const tracksSection = document.createElement('div');
    tracksSection.className = 'reference-tracks-list';
    tracksSection.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    
    const sampleTracks: ReferenceTrack[] = [
      { id: 'ref1', name: 'Industry Standard Mix', artist: 'Top Producer', genre: 'Electronic', duration: 210, notes: 'Great low end and clarity' },
      { id: 'ref2', name: 'Classic Reference', artist: 'Legendary Artist', genre: 'Pop', duration: 195, notes: 'Vocal presence benchmark' },
    ];
    
    for (const track of sampleTracks) {
      const trackEl = createReferenceTrackElement(track);
      tracksSection.appendChild(trackEl);
    }
    
    // Analysis section
    const analysisSection = document.createElement('div');
    analysisSection.className = 'reference-analysis';
    analysisSection.style.cssText = `
      padding: 12px;
      background: var(--surface-sunken, #fafafa);
      border-radius: 4px;
      font-size: 0.75rem;
    `;
    
    analysisSection.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px;">Quick Comparison</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div style="padding: 8px; background: var(--surface-base, #fff); border-radius: 4px; text-align: center;">
          <div style="font-size: 0.625rem; color: #666;">Your Mix</div>
          <div style="font-size: 1rem; font-weight: 600;">-14.2 LUFS</div>
        </div>
        <div style="padding: 8px; background: var(--surface-base, #fff); border-radius: 4px; text-align: center;">
          <div style="font-size: 0.625rem; color: #666;">Reference</div>
          <div style="font-size: 1rem; font-weight: 600;">-13.8 LUFS</div>
        </div>
      </div>
      <div style="margin-top: 8px; color: #666;">
        💡 Reference is slightly louder. Consider matching levels for fair comparison.
      </div>
    `;
    
    content.appendChild(abSection);
    content.appendChild(tracksSection);
    content.appendChild(analysisSection);
    
    container.appendChild(header);
    container.appendChild(content);
    
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Reference Track',
      render: () => container,
      destroy: () => {
        container.remove();
      },
    };
  },
};

/**
 * Create a reference track element.
 */
function createReferenceTrackElement(track: ReferenceTrack): HTMLElement {
  const el = document.createElement('div');
  el.className = 'reference-track-item';
  el.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    background: var(--surface-raised, #f5f5f5);
    border: 1px solid var(--border-base, #ccc);
    border-radius: 4px;
  `;
  
  const minutes = Math.floor(track.duration / 60);
  const seconds = track.duration % 60;
  const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  el.innerHTML = `
    <button class="play-ref-btn" style="
      width: 32px; height: 32px;
      border: none;
      border-radius: 50%;
      background: var(--surface-base, #fff);
      cursor: pointer;
      font-size: 0.875rem;
    ">▶</button>
    
    <div style="flex: 1;">
      <div style="font-weight: 600; font-size: 0.875rem;">${track.name}</div>
      <div style="font-size: 0.75rem; color: #666;">${track.artist ?? 'Unknown'} • ${track.genre ?? 'Unknown'}</div>
      ${track.notes ? `<div style="font-size: 0.625rem; color: #888; margin-top: 2px;">📝 ${track.notes}</div>` : ''}
    </div>
    
    <div style="font-size: 0.75rem; color: #666;">${durationStr}</div>
    
    <button class="use-ref-btn" style="
      padding: 4px 8px;
      font-size: 0.625rem;
      border: 1px solid var(--border-base, #ccc);
      border-radius: 4px;
      background: var(--surface-base, #fff);
      cursor: pointer;
    ">Use as B</button>
  `;
  
  return el;
}

export default referenceTrackDeckFactory;
