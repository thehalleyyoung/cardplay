/**
 * @fileoverview Notation Harmony Overlay Component
 * 
 * G103: Apply chord tones highlight overlay in notation view (non-destructive coloring).
 * G104: Snap selection to chord tones helper action (assisted transform with undo).
 * G105: Harmonize selection tool using phrase-adapter.ts (voice-leading mode).
 * G106: Reharmonize action proposing alternate chords without auto-applying.
 * 
 * @module @cardplay/ui/components/notation-harmony-overlay
 */

import type { EventId } from '../../state/types';
import type { Chord, MusicalKey, ChordSuggestion } from '../../boards/builtins/harmony-analysis';
import {
  snapToChordTones,
  harmonizeMelody,
  getReharmonizationSuggestions,
  highlightChordTones
} from '../../boards/builtins/harmony-analysis';
import { getBoardContextStore } from '../../boards/context/store';
import { getSharedEventStore } from '../../state/event-store';
import { getSelectionStore } from '../../state/selection-state';

/**
 * Options for notation harmony overlay.
 */
export interface NotationHarmonyOverlayOptions {
  /** Whether to show highlights by default */
  showHighlights?: boolean;
  
  /** Whether to show roman numerals */
  showRomanNumerals?: boolean;
  
  /** Callback when highlights are toggled */
  onToggleHighlights?: (enabled: boolean) => void;
  
  /** Callback when reharmonization is suggested */
  onReharmonizeSuggested?: (suggestions: ChordSuggestion[]) => void;
}

/**
 * Creates notation harmony overlay component.
 * 
 * Provides:
 * - G103: Non-destructive chord tone highlighting
 * - G104: Snap to chord tones action
 * - G105: Harmonize selection action
 * - G106: Reharmonization suggestions
 * 
 * @param options Configuration options
 * @returns HTML element containing overlay UI
 */
export function createNotationHarmonyOverlay(
  options: NotationHarmonyOverlayOptions = {}
): HTMLElement {
  const boardStore = getBoardContextStore();
  const eventStore = getSharedEventStore();
  const selectionStore = getSelectionStore();
  
  let showHighlights = options.showHighlights ?? true;
  
  // Main container
  const container = document.createElement('div');
  container.className = 'notation-harmony-overlay';
  container.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 10;
  `;
  
  // Toolbar (with pointer events enabled)
  const toolbar = document.createElement('div');
  toolbar.className = 'notation-harmony-toolbar';
  toolbar.style.cssText = `
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.5rem;
    pointer-events: auto;
    background: var(--color-surface);
    padding: 0.5rem;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  `;
  
  // G103: Toggle highlights button
  const toggleHighlightsBtn = createToolbarButton('🎨', 'Toggle Highlights');
  toggleHighlightsBtn.addEventListener('click', () => {
    showHighlights = !showHighlights;
    updateHighlights();
    options.onToggleHighlights?.(showHighlights);
  });
  
  // G104: Snap to chord tones button
  const snapBtn = createToolbarButton('🧲', 'Snap to Chord Tones');
  snapBtn.addEventListener('click', handleSnapToChordTones);
  
  // G105: Harmonize selection button
  const harmonizeBtn = createToolbarButton('🎼', 'Harmonize Selection');
  harmonizeBtn.addEventListener('click', handleHarmonizeSelection);
  
  // G106: Reharmonize button
  const reharmonizeBtn = createToolbarButton('🔄', 'Suggest Reharmonization');
  reharmonizeBtn.addEventListener('click', handleReharmonize);
  
  toolbar.appendChild(toggleHighlightsBtn);
  toolbar.appendChild(snapBtn);
  toolbar.appendChild(harmonizeBtn);
  toolbar.appendChild(reharmonizeBtn);
  
  // Highlights canvas (for visual overlay)
  const highlightsCanvas = document.createElement('canvas');
  highlightsCanvas.className = 'notation-harmony-highlights';
  highlightsCanvas.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  `;
  
  /**
   * Update highlights based on current harmony context.
   */
  function updateHighlights(): void {
    if (!showHighlights) {
      clearHighlights();
      return;
    }
    
    const context = boardStore.getContext();
    if (!context.activeStreamId) return;
    
    const stream = eventStore.getStream(context.activeStreamId);
    if (!stream) return;
    
    // Get current harmony context
    const key = parseKey(context.currentKey ?? 'C');
    const chord = parseChord(context.currentChord ?? 'C');
    
    // Classify all notes
    const classifications = highlightChordTones(
      stream.events as any[], // Type assertion for payload
      key,
      chord
    );
    
    // Render highlights (this would integrate with notation rendering)
    renderHighlights(classifications);
  }
  
  /**
   * Clear all highlights.
   */
  function clearHighlights(): void {
    const ctx = highlightsCanvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, highlightsCanvas.width, highlightsCanvas.height);
  }
  
  /**
   * Render highlights on canvas.
   */
  function renderHighlights(classifications: Map<string, any>): void {
    // This is a stub - real implementation would coordinate with notation renderer
    // to get note positions and draw colored overlays
    console.info('[NotationHarmonyOverlay] Highlighting notes:', {
      count: classifications.size,
      showHighlights
    });
  }
  
  /**
   * G104: Handle snap to chord tones action.
   */
  function handleSnapToChordTones(): void {
    const context = boardStore.getContext();
    if (!context.activeStreamId) {
      console.warn('No active stream');
      return;
    }
    
    const selectedIds = selectionStore.getSelectedIds();
    if (selectedIds.length === 0) {
      console.info('No notes selected');
      return;
    }
    
    const chord = parseChord(context.currentChord ?? 'C');
    
    // Apply snap (with undo support)
    snapToChordTones(
      context.activeStreamId,
      selectedIds as EventId[],
      chord,
      'nearest'
    );
    
    console.info('[NotationHarmonyOverlay] Snapped notes to chord tones');
  }
  
  /**
   * G105: Handle harmonize selection action.
   */
  function handleHarmonizeSelection(): void {
    const context = boardStore.getContext();
    if (!context.activeStreamId) {
      console.warn('No active stream');
      return;
    }
    
    const selectedIds = selectionStore.getSelectedIds();
    if (selectedIds.length === 0) {
      console.info('No notes selected');
      return;
    }
    
    const chord = parseChord(context.currentChord ?? 'C');
    
    // Apply harmonization (with undo support)
    harmonizeMelody(
      context.activeStreamId,
      selectedIds as EventId[],
      chord
    );
    
    console.info('[NotationHarmonyOverlay] Harmonized selection');
  }
  
  /**
   * G106: Handle reharmonization suggestions.
   */
  function handleReharmonize(): void {
    const context = boardStore.getContext();
    if (!context.activeStreamId) {
      console.warn('No active stream');
      return;
    }
    
    const stream = eventStore.getStream(context.activeStreamId);
    if (!stream || stream.events.length === 0) {
      console.info('No events to analyze');
      return;
    }
    
    const key = parseKey(context.currentKey ?? 'C');
    const currentChord = parseChord(context.currentChord ?? 'C');
    
    // Get suggestions (does not auto-apply)
    const suggestions = getReharmonizationSuggestions(
      stream.events as any[],
      currentChord,
      key
    );
    
    // Show suggestions to user
    displaySuggestions(suggestions);
    options.onReharmonizeSuggested?.(suggestions);
  }
  
  /**
   * Display reharmonization suggestions.
   */
  function displaySuggestions(suggestions: ChordSuggestion[]): void {
    // Create a temporary modal/panel showing suggestions
    const modal = document.createElement('div');
    modal.className = 'reharmonization-suggestions-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--color-surface);
      padding: 1.5rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      pointer-events: auto;
      max-width: 400px;
      width: 90%;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Reharmonization Suggestions';
    title.style.cssText = `
      margin: 0 0 1rem 0;
      font-size: 1.125rem;
      color: var(--color-on-surface);
    `;
    modal.appendChild(title);
    
    if (suggestions.length === 0) {
      const noSuggestions = document.createElement('p');
      noSuggestions.textContent = 'No suggestions available for this passage.';
      noSuggestions.style.color = 'var(--color-on-surface-variant)';
      modal.appendChild(noSuggestions);
    } else {
      suggestions.forEach(suggestion => {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.style.cssText = `
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          background: var(--color-surface-variant);
          border-radius: var(--radius-sm);
          cursor: pointer;
        `;
        
        suggestionDiv.innerHTML = `
          <div style="font-weight: 600; color: var(--color-on-surface);">${suggestion.chord.name}</div>
          <div style="font-size: 0.875rem; color: var(--color-on-surface-variant); margin-top: 0.25rem;">
            ${suggestion.reason} (${Math.round(suggestion.score * 100)}% match)
          </div>
        `;
        
        suggestionDiv.addEventListener('click', () => {
          boardStore.setCurrentChord(suggestion.chord.name);
          updateHighlights();
          document.body.removeChild(modal);
        });
        
        modal.appendChild(suggestionDiv);
      });
    }
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: var(--color-primary);
      color: var(--color-on-primary);
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      width: 100%;
    `;
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    modal.appendChild(closeBtn);
    
    document.body.appendChild(modal);
  }
  
  // Assemble
  container.appendChild(toolbar);
  container.appendChild(highlightsCanvas);
  
  // Subscribe to context changes
  const cleanup = boardStore.subscribe(() => {
    updateHighlights();
  });
  
  // Initial update
  updateHighlights();
  
  // Store cleanup function on element for later disposal
  (container as any)._cleanup = cleanup;
  
  return container;
}

/**
 * Helper: Create toolbar button.
 */
function createToolbarButton(icon: string, title: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = icon;
  btn.title = title;
  btn.style.cssText = `
    padding: 0.5rem;
    background: var(--color-surface-variant);
    color: var(--color-on-surface-variant);
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 1rem;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  btn.addEventListener('mouseenter', () => {
    btn.style.background = 'var(--color-primary-container)';
    btn.style.color = 'var(--color-on-primary-container)';
  });
  
  btn.addEventListener('mouseleave', () => {
    btn.style.background = 'var(--color-surface-variant)';
    btn.style.color = 'var(--color-on-surface-variant)';
  });
  
  return btn;
}

/**
 * Parse key string to MusicalKey.
 */
function parseKey(keyStr: string): MusicalKey {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const isMinor = keyStr.endsWith('m');
  const rootStr = isMinor ? keyStr.slice(0, -1) : keyStr;
  const rootIndex = notes.indexOf(rootStr);
  
  return {
    root: rootIndex >= 0 ? rootIndex : 0,
    scale: isMinor ? 'minor' : 'major',
    name: keyStr
  };
}

/**
 * Parse chord string to Chord.
 */
function parseChord(chordStr: string): Chord {
  const match = chordStr.match(/^([A-G][b#]?)(.*)$/);
  if (!match || !match[1]) {
    return { root: 0, quality: 'major', extensions: [], name: 'C' };
  }
  
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const rootStr = match[1].replace('b', '#');
  const qualityStr = match[2] || '';
  const rootIndex = notes.indexOf(rootStr);
  
  // Map quality strings to Chord qualities
  const qualityMap: Record<string, Chord['quality']> = {
    '': 'major',
    'm': 'minor',
    '7': 'dom7',
    'maj7': 'maj7',
    'm7': 'min7',
    'dim': 'diminished',
    'aug': 'augmented',
    'sus4': 'sus4',
    'sus2': 'sus2'
  };
  
  const quality = qualityMap[qualityStr] || 'major';
  
  return {
    root: rootIndex >= 0 ? rootIndex : 0,
    quality,
    extensions: [],
    name: chordStr
  };
}

/**
 * Injects CSS styles for notation harmony overlay.
 */
export function injectNotationHarmonyOverlayStyles(): void {
  if (typeof document === 'undefined') return;
  
  const styleId = 'notation-harmony-overlay-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .notation-harmony-overlay button:active {
      transform: scale(0.95);
    }
    
    .notation-harmony-overlay button:focus {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
    
    .reharmonization-suggestions-modal {
      animation: modal-fade-in 0.2s ease-out;
    }
    
    @keyframes modal-fade-in {
      from {
        opacity: 0;
        transform: translate(-50%, -48%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }
  `;
  
  document.head.appendChild(style);
}
