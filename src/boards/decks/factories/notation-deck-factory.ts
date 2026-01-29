/**
 * @fileoverview Notation Deck Factory (E028-E030, M058)
 *
 * Creates notation score decks that bind to active stream context.
 * E030: Persist engraving settings (zoom, page config, staff config).
 * M058: Counterpoint analysis panel wired to analyzeCounterpoint().
 *
 * @module @cardplay/boards/decks/factories/notation-deck-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import type { NotationDeckSettings } from '../../store/types';
import { getBoardStateStore } from '../../store/store';
import { analyzeCounterpoint } from '../../../ai/queries/persona-queries';

/**
 * Default notation settings.
 */
const DEFAULT_NOTATION_SETTINGS: NotationDeckSettings = {
  zoom: 100,
  pageWidth: 800,
  pageHeight: 1000,
  staffSpacing: 80,
  showMeasureNumbers: true,
  showBarLines: true,
  clefs: ['treble'],
};

/**
 * Factory for creating notation score deck instances.
 * Binds to ActiveContext.activeStreamId.
 * E029: Binds to ActiveContext.activeStreamId
 * E030: Persists engraving settings per board
 */
export const notationDeckFactory: DeckFactory = {
  deckType: 'notation-deck',
  
  create(deckDef: BoardDeck, ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'notation-deck-container';
    container.setAttribute('data-deck-id', deckDef.id);
    container.setAttribute('data-deck-type', 'notation-deck');
    
    // E030: Load persisted settings
    const store = getBoardStateStore();
    const deckState = store.getDeckState(ctx.boardId);
    const settings: NotationDeckSettings = {
      ...DEFAULT_NOTATION_SETTINGS,
      ...(deckState.deckSettings[deckDef.id]?.notation || {}),
    };
    
    // Header with settings controls
    const header = document.createElement('div');
    header.className = 'notation-deck-header';
    header.style.cssText = `
      padding: 8px 12px;
      background: var(--surface-raised, #f5f5f5);
      border-bottom: 1px solid var(--border-base, #ccc);
      display: flex;
      align-items: center;
      gap: 12px;
    `;
    
    const title = document.createElement('span');
    title.textContent = 'Notation Score';
    title.style.fontWeight = 'bold';
    header.appendChild(title);
    
    // E030: Zoom control
    const zoomLabel = document.createElement('label');
    zoomLabel.style.cssText = 'display: flex; align-items: center; gap: 4px; font-size: 0.875rem;';
    zoomLabel.innerHTML = `Zoom:`;
    
    const zoomInput = document.createElement('input');
    zoomInput.type = 'range';
    zoomInput.min = '50';
    zoomInput.max = '200';
    zoomInput.step = '10';
    zoomInput.value = String(settings.zoom);
    zoomInput.style.width = '100px';
    zoomInput.title = `Zoom: ${settings.zoom}%`;
    
    const zoomValue = document.createElement('span');
    zoomValue.textContent = `${settings.zoom}%`;
    zoomValue.style.cssText = 'font-size: 0.875rem; min-width: 40px;';
    
    zoomInput.addEventListener('input', () => {
      const zoom = parseInt(zoomInput.value);
      zoomValue.textContent = `${zoom}%`;
      zoomInput.title = `Zoom: ${zoom}%`;
      settings.zoom = zoom;
      
      // E030: Persist setting
      const currentDeckState = store.getDeckState(ctx.boardId);
      store.setDeckState(ctx.boardId, {
        ...currentDeckState,
        deckSettings: {
          ...currentDeckState.deckSettings,
          [deckDef.id]: {
            ...currentDeckState.deckSettings[deckDef.id],
            notation: settings,
          },
        },
      });
    });
    
    zoomLabel.appendChild(zoomInput);
    zoomLabel.appendChild(zoomValue);
    header.appendChild(zoomLabel);
    
    // E030: Measure numbers toggle
    const measureToggle = document.createElement('label');
    measureToggle.style.cssText = 'display: flex; align-items: center; gap: 4px; font-size: 0.875rem; cursor: pointer;';
    
    const measureCheckbox = document.createElement('input');
    measureCheckbox.type = 'checkbox';
    measureCheckbox.checked = settings.showMeasureNumbers ?? true;
    measureCheckbox.addEventListener('change', () => {
      settings.showMeasureNumbers = measureCheckbox.checked;
      
      // E030: Persist setting
      const currentDeckState = store.getDeckState(ctx.boardId);
      store.setDeckState(ctx.boardId, {
        ...currentDeckState,
        deckSettings: {
          ...currentDeckState.deckSettings,
          [deckDef.id]: {
            ...currentDeckState.deckSettings[deckDef.id],
            notation: settings,
          },
        },
      });
    });
    
    measureToggle.appendChild(measureCheckbox);
    measureToggle.appendChild(document.createTextNode('Measure #s'));
    header.appendChild(measureToggle);
    
    // M058: Counterpoint analysis button
    const counterpointBtn = document.createElement('button');
    counterpointBtn.textContent = 'Analyze Counterpoint';
    counterpointBtn.style.cssText = `
      padding: 4px 8px;
      font-size: 0.8125rem;
      background: var(--surface-base, #fff);
      border: 1px solid var(--border-base, #ccc);
      border-radius: 4px;
      cursor: pointer;
      margin-left: auto;
    `;
    header.appendChild(counterpointBtn);

    container.appendChild(header);

    // M058: Counterpoint analysis results panel (hidden by default)
    const counterpointPanel = document.createElement('div');
    counterpointPanel.className = 'counterpoint-analysis-panel';
    counterpointPanel.style.cssText = `
      display: none;
      padding: 8px 12px;
      background: var(--surface-sunken, #fafafa);
      border-bottom: 1px solid var(--border-base, #ccc);
      font-size: 0.8125rem;
      max-height: 160px;
      overflow-y: auto;
    `;
    counterpointPanel.innerHTML = '<em>Click "Analyze Counterpoint" to check voice independence.</em>';
    container.appendChild(counterpointPanel);

    counterpointBtn.addEventListener('click', async () => {
      const isVisible = counterpointPanel.style.display !== 'none';
      if (isVisible) {
        counterpointPanel.style.display = 'none';
        return;
      }
      counterpointPanel.style.display = 'block';
      counterpointPanel.innerHTML = '<em>Analyzing&hellip;</em>';
      try {
        const analysis = await analyzeCounterpoint();
        if (analysis.rules.length === 0) {
          counterpointPanel.innerHTML = '<strong style="color: var(--success-base, green);">No counterpoint rules loaded.</strong>';
        } else {
          counterpointPanel.innerHTML = `<strong>Voice Independence Rules (${analysis.rules.length}):</strong><ul style="margin: 4px 0 0 16px; padding: 0;">` +
            analysis.rules.map((r: { ruleId: string; description: string }) => `<li><code>${r.ruleId}</code>: ${r.description}</li>`).join('') +
            '</ul>';
        }
      } catch {
        counterpointPanel.innerHTML = '<em style="color: var(--danger-base, red);">Analysis failed.</em>';
      }
    });

    // Content area
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 16px;
      background: var(--surface-base, #fff);
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
    `;
    
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      text-align: center;
      color: var(--text-secondary, #666);
    `;
    placeholder.innerHTML = `
      <p><strong>Notation Deck</strong></p>
      <p>Stream: ${ctx.activeContext.activeStreamId || 'None'}</p>
      <p style="font-size: 0.875rem; margin-top: 8px;">
        Zoom: ${settings.zoom}%<br>
        Measure Numbers: ${settings.showMeasureNumbers ? 'On' : 'Off'}
      </p>
      <p style="font-size: 0.875rem; margin-top: 12px; color: var(--text-tertiary, #999);">
        Notation rendering will integrate with<br>
        src/notation/panel.ts via notation-store-adapter.ts
      </p>
    `;
    
    content.appendChild(placeholder);
    container.appendChild(content);
    
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Notation',
      render: () => container,
      destroy: () => {
        container.remove();
      }
    };
  }
};
