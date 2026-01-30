/**
 * @fileoverview Phrase Library Deck Factory
 *
 * E051-E054: Implement phrase-library deck factory with drag/drop and preview.
 * G041-G044: Wire up phrase library UI with drag/drop and preview playback.
 *
 * Decision (E052/G041): Using DOM-based phrase browser UI for better accessibility
 * and integration with existing UI components. Canvas may be added later for
 * performance if needed for large libraries.
 *
 * @module @cardplay/boards/decks/factories/phrases-deck-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';
import { createInitialBrowserState, browserReducer } from '../../../ui/components/phrase-browser-ui';
import type { PhraseBrowserState, BrowserAction } from '../../../ui/components/phrase-browser-ui';
import type { PhraseRecord } from '../../../cards/phrase-system';
import { getTransport } from '../../../audio/transport';
import { getSharedEventStore } from '../../../state/event-store';
import { handlePhraseToPatternEditor, registerDropHandler } from '../../../ui/drop-handlers';
import { computeBoardCapabilities } from '../../gating/capabilities';
import { getBoardRegistry } from '../../registry';

/**
 * Phrase library deck factory (G041-G044).
 *
 * Provides phrase browsing with:
 * - Search and categorization (G042)
 * - Drag/drop support (G043-G044)
 * - Preview playback (G048)
 * - Tag filtering
 */
export const phraseLibraryFactory: DeckFactory = {
  deckType: 'phrases-deck',

  create(deckDef: BoardDeck, ctx: DeckFactoryContext): DeckInstance {
    let state: PhraseBrowserState = createInitialBrowserState();
    let previewStreamId: string | null = null;
    let previewCleanup: (() => void) | null = null;
    
    // D050: Wire canDragPhrases capability into phrase library UI
    const board = getBoardRegistry().get(ctx.boardId);
    const capabilities = board ? computeBoardCapabilities(board) : null;
    const isDragEnabled = capabilities?.canDragPhrases ?? false;
    
    const dispatch = (action: BrowserAction) => {
      state = browserReducer(state, action);
      render();
    };

    const render = () => {
      // Re-render the phrase list
      renderPhraseList(container, state, dispatch, {
        onDragStart: isDragEnabled ? handlePhraseDragStart : null,
        onPreview: handlePhrasePreview,
        onStopPreview: stopPreview,
        isDragEnabled,
      });
    };

    // G043: Implement drag payload for phrases
    const handlePhraseDragStart = (phrase: PhraseRecord<any>, event: DragEvent) => {
      if (!event.dataTransfer) return;
      
      // Extract notes/events from phrase
      const events = (phrase as any).events || [];
      const metadata = (phrase as any).metadata || {};
      
      const payload = {
        type: 'phrase' as const,
        phraseId: phrase.id,
        phraseName: phrase.name,
        notes: events,
        duration: metadata.durationTicks || 1920,
        metadata,
      };
      
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/json', JSON.stringify(payload));
      
      // Visual feedback (G069)
      if (event.dataTransfer.setDragImage) {
        const dragImage = createPhraseDragImage(phrase);
        event.dataTransfer.setDragImage(dragImage, 20, 20);
        // Clean up drag image after drag ends
        setTimeout(() => dragImage.remove(), 100);
      }
    };

    // G048: Implement phrase preview with temporary stream
    const handlePhrasePreview = (phrase: PhraseRecord<any>) => {
      // Stop any existing preview
      stopPreview();
      
      // Create temporary preview stream
      const eventStore = getSharedEventStore();
      const transport = getTransport();
      
      // Create a temporary stream for preview
      previewStreamId = `preview-phrase-${phrase.id}-${Date.now()}`;
      const events = (phrase as any).events || [];
      
      const streamRecord = eventStore.createStream({ 
        name: `Preview: ${phrase.name}`,
        events 
      });
      
      previewStreamId = streamRecord.id;
      
      // Play the preview stream
      transport.play();
      
      // Set up cleanup for when preview ends
      const metadata = (phrase as any).metadata || {};
      const previewDuration = metadata.durationTicks || 1920; // Default 1 bar
      const cleanupTimeout = setTimeout(() => {
        stopPreview();
      }, (previewDuration / 480) * 1000); // Rough conversion to ms (assumes 120 BPM)
      
      previewCleanup = () => {
        clearTimeout(cleanupTimeout);
        transport.stop();
        if (previewStreamId) {
          eventStore.deleteStream(previewStreamId);
          previewStreamId = null;
        }
      };
      
      dispatch({ type: 'PREVIEW_PHRASE', phrase });
    };

    const stopPreview = () => {
      if (previewCleanup) {
        previewCleanup();
        previewCleanup = null;
      }
      dispatch({ type: 'PREVIEW_PHRASE', phrase: null });
    };

    const container = document.createElement('div');
    container.className = 'deck-phrase-library';
    container.setAttribute('data-deck-id', deckDef.id);
    
    // Initial render (G041-G042)
    render();
    
    // Register phrase→pattern-editor drop handler (G044)
    registerDropHandler('phrase', 'pattern-editor', handlePhraseToPatternEditor as any);

    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Phrases',
      render: () => container,
      destroy: () => {
        stopPreview();
      },
    };
  },

  validate(_deckDef: BoardDeck): string | null {
    return null;
  },
};

/**
 * Creates a drag image for a phrase
 */
function createPhraseDragImage(phrase: PhraseRecord<any>): HTMLElement {
  const dragImage = document.createElement('div');
  dragImage.style.cssText = `
    position: absolute;
    left: -9999px;
    padding: 8px 12px;
    background: rgba(59, 130, 246, 0.9);
    color: white;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    pointer-events: none;
    white-space: nowrap;
  `;
  dragImage.textContent = `🎵 ${phrase.name}`;
  document.body.appendChild(dragImage);
  return dragImage;
}

/**
 * Renders the phrase list UI (G041-G042)
 */
function renderPhraseList(
  container: HTMLElement,
  state: PhraseBrowserState,
  dispatch: (action: BrowserAction) => void,
  handlers: {
    onDragStart: ((phrase: PhraseRecord<any>, event: DragEvent) => void) | null;
    onPreview: (phrase: PhraseRecord<any>) => void;
    onStopPreview: () => void;
    isDragEnabled: boolean;
  }
): void {
  container.innerHTML = '';
  
  // Header with search (G042)
  const header = document.createElement('div');
  header.className = 'phrase-library-header';
  header.style.cssText = `
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 8px;
    align-items: center;
  `;
  
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search phrases...';
  searchInput.value = state.query;
  searchInput.style.cssText = `
    flex: 1;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    color: white;
    font-size: 12px;
  `;
  searchInput.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    dispatch({ type: 'SET_QUERY', query: target.value });
  });
  
  header.appendChild(searchInput);
  container.appendChild(header);
  
  // Results list
  const resultsList = document.createElement('div');
  resultsList.className = 'phrase-library-results';
  resultsList.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  `;
  
  if (state.results.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = `
      padding: 32px;
      text-align: center;
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
    `;
    empty.textContent = state.query
      ? `No phrases found for "${state.query}"`
      : 'No phrases in library. Create one from your notation selection.';
    resultsList.appendChild(empty);
  } else {
    state.results.forEach(phrase => {
      const item = createPhraseItem(phrase, state, handlers);
      resultsList.appendChild(item);
    });
  }
  
  container.appendChild(resultsList);
}

/**
 * Creates a phrase list item (G042-G044, G048)
 */
function createPhraseItem(
  phrase: PhraseRecord<any>,
  state: PhraseBrowserState,
  handlers: {
    onDragStart: ((phrase: PhraseRecord<any>, event: DragEvent) => void) | null;
    onPreview: (phrase: PhraseRecord<any>) => void;
    onStopPreview: () => void;
    isDragEnabled: boolean;
  }
): HTMLElement {
  const item = document.createElement('div');
  item.className = 'phrase-item';
  // D050: Only enable drag if canDragPhrases capability is true
  item.draggable = handlers.isDragEnabled; // G043
  item.style.cssText = `
    padding: 12px;
    margin-bottom: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    cursor: move;
    transition: all 0.15s;
  `;
  
  const isSelected = state.selected?.id === phrase.id;
  const isPreviewing = state.previewing?.id === phrase.id;
  
  if (isSelected) {
    item.style.background = 'rgba(59, 130, 246, 0.2)';
    item.style.borderColor = 'rgba(59, 130, 246, 0.5)';
  }
  
  if (isPreviewing) {
    item.style.background = 'rgba(139, 92, 246, 0.2)';
    item.style.borderColor = 'rgba(139, 92, 246, 0.5)';
  }
  
  // Phrase name and metadata
  const name = document.createElement('div');
  name.style.cssText = `
    font-weight: 500;
    color: white;
    font-size: 13px;
    margin-bottom: 4px;
  `;
  name.textContent = phrase.name;
  item.appendChild(name);
  
  // Tags and duration
  const meta = document.createElement('div');
  meta.style.cssText = `
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    display: flex;
    gap: 8px;
    align-items: center;
  `;
  
  const metadata = (phrase as any).metadata || {};
  const categoryText = metadata.lineType || metadata.category || 'phrase';
  
  const category = document.createElement('span');
  category.style.cssText = `
    padding: 2px 6px;
    background: rgba(59, 130, 246, 0.2);
    border-radius: 3px;
  `;
  category.textContent = categoryText;
  meta.appendChild(category);
  
  const duration = document.createElement('span');
  duration.textContent = `${metadata.durationBars || 1} bars`;
  meta.appendChild(duration);
  
  item.appendChild(meta);
  
  // Drag handlers (G043)
  // D050: Only add drag handler if drag is enabled
  if (handlers.onDragStart && handlers.isDragEnabled) {
    item.addEventListener('dragstart', (e) => {
      handlers.onDragStart!(phrase, e);
    });
  }
  
  // Preview button (G048)
  const previewBtn = document.createElement('button');
  previewBtn.textContent = isPreviewing ? '⏹ Stop' : '▶ Preview';
  previewBtn.style.cssText = `
    margin-top: 8px;
    padding: 4px 8px;
    background: rgba(139, 92, 246, 0.3);
    border: 1px solid rgba(139, 92, 246, 0.5);
    border-radius: 3px;
    color: white;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
  `;
  previewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isPreviewing) {
      handlers.onStopPreview();
    } else {
      handlers.onPreview(phrase);
    }
  });
  previewBtn.addEventListener('mouseenter', () => {
    previewBtn.style.background = 'rgba(139, 92, 246, 0.5)';
  });
  previewBtn.addEventListener('mouseleave', () => {
    previewBtn.style.background = 'rgba(139, 92, 246, 0.3)';
  });
  item.appendChild(previewBtn);
  
  // Hover effects (G069)
  item.addEventListener('mouseenter', () => {
    if (!isSelected && !isPreviewing) {
      item.style.background = 'rgba(255, 255, 255, 0.08)';
      item.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    }
  });
  item.addEventListener('mouseleave', () => {
    if (!isSelected && !isPreviewing) {
      item.style.background = 'rgba(255, 255, 255, 0.05)';
      item.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    }
  });
  
  return item;
}
