/**
 * @fileoverview Piano Roll Integration - Scale overlay and ghost notes.
 * 
 * Integrates ScaleOverlay and GhostNotesManager into piano roll rendering.
 * 
 * @module @cardplay/ui/piano-roll-integration
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase H.2, H.3
 */

import type { EventStreamId, ClipId } from '../state/types';
import { getClipRegistry } from '../state';
import {
  ScaleOverlay,
  createScaleOverlay,
  type ActiveScale,
  type ScaleOverlayOptions,
} from '../music/scale-overlay';
import {
  GhostNotesManager,
  createGhostNotesManager,
  type GhostNote,
  type GhostNotesOptions,
} from './ghost-notes';
import {
  PianoRollStoreAdapter,
} from './components/piano-roll-store-adapter';
import type { NoteRect } from './components/piano-roll-panel';

// ============================================================================
// TYPES
// ============================================================================

type AdapterNoteRect = NoteRect & { readonly note?: number; readonly color?: string };

/**
 * Enhanced note rectangle with scale info.
 */
export interface EnhancedNoteRectangle extends NoteRect {
  readonly inScale: boolean;
  readonly isRoot: boolean;
  readonly isChordTone: boolean;
  readonly scaleDegree: number | null;
  readonly scaleColor: string;
}

/**
 * Piano keyboard key rendering info.
 */
export interface PianoKeyInfo {
  readonly note: number;
  readonly isBlack: boolean;
  readonly inScale: boolean;
  readonly isRoot: boolean;
  readonly isChordTone: boolean;
  readonly color: string;
  readonly label?: string;
}

/**
 * Grid line info for scale highlighting.
 */
export interface ScaleGridLine {
  readonly note: number;
  readonly inScale: boolean;
  readonly isRoot: boolean;
  readonly color: string;
  readonly opacity: number;
}

/**
 * Integration options.
 */
export interface PianoRollIntegrationOptions {
  readonly scaleOverlay: Partial<ScaleOverlayOptions>;
  readonly ghostNotes: Partial<GhostNotesOptions>;
  readonly showScaleHighlight: boolean;
  readonly showGhostNotes: boolean;
  readonly highlightChordTones: boolean;
  readonly dimOutOfScale: boolean;
  readonly scaleGridOpacity: number;
}

/**
 * Integration state callback.
 */
export type IntegrationStateCallback = (state: PianoRollIntegrationState) => void;

/**
 * Integration state.
 */
export interface PianoRollIntegrationState {
  readonly enhancedNotes: readonly EnhancedNoteRectangle[];
  readonly ghostNotes: readonly GhostNote[];
  readonly keyboardKeys: readonly PianoKeyInfo[];
  readonly gridLines: readonly ScaleGridLine[];
  readonly activeScale: ActiveScale | null;
}

// ============================================================================
// DEFAULT OPTIONS
// ============================================================================

const DEFAULT_OPTIONS: PianoRollIntegrationOptions = {
  scaleOverlay: {},
  ghostNotes: {},
  showScaleHighlight: true,
  showGhostNotes: true,
  highlightChordTones: true,
  dimOutOfScale: true,
  scaleGridOpacity: 0.15,
};

// ============================================================================
// PIANO ROLL INTEGRATION
// ============================================================================

/**
 * PianoRollIntegration combines scale overlay and ghost notes with piano roll.
 */
export class PianoRollIntegration {
  private adapter: PianoRollStoreAdapter;
  private scaleOverlay: ScaleOverlay;
  private ghostNotesManager: GhostNotesManager;
  private options: PianoRollIntegrationOptions;

  private state: PianoRollIntegrationState;
  private callbacks = new Set<IntegrationStateCallback>();

  private adapterUnsubscribe: (() => void) | null = null;
  private scaleUnsubscribe: (() => void) | null = null;
  private ghostUnsubscribe: (() => void) | null = null;

  constructor(
    adapter: PianoRollStoreAdapter,
    options?: Partial<PianoRollIntegrationOptions>
  ) {
    this.adapter = adapter;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    this.scaleOverlay = createScaleOverlay(this.options.scaleOverlay);
    this.ghostNotesManager = createGhostNotesManager(this.options.ghostNotes);

    this.state = {
      enhancedNotes: [],
      ghostNotes: [],
      keyboardKeys: this.buildKeyboardKeys(),
      gridLines: this.buildGridLines(),
      activeScale: null,
    };

    // Subscribe to adapter changes
    this.adapterUnsubscribe = this.adapter.subscribe(() => {
      this.rebuildState();
    });

    // Subscribe to scale changes
    this.scaleUnsubscribe = this.scaleOverlay.subscribe((_scale) => {
      this.rebuildState();
    });

    // Subscribe to ghost notes changes
    this.ghostUnsubscribe = this.ghostNotesManager.subscribe(() => {
      this.rebuildState();
    });
  }

  // ==========================================================================
  // STATE ACCESS
  // ==========================================================================

  getState(): PianoRollIntegrationState {
    return this.state;
  }

  getScaleOverlay(): ScaleOverlay {
    return this.scaleOverlay;
  }

  getGhostNotesManager(): GhostNotesManager {
    return this.ghostNotesManager;
  }

  // ==========================================================================
  // OPTIONS
  // ==========================================================================

  setOptions(options: Partial<PianoRollIntegrationOptions>): void {
    this.options = { ...this.options, ...options };
    this.rebuildState();
  }

  toggleScaleHighlight(): void {
    this.options = { ...this.options, showScaleHighlight: !this.options.showScaleHighlight };
    this.rebuildState();
  }

  toggleGhostNotes(): void {
    this.options = { ...this.options, showGhostNotes: !this.options.showGhostNotes };
    this.rebuildState();
  }

  // ==========================================================================
  // SCALE OPERATIONS
  // ==========================================================================

  setScale(root: number, scaleName: string): void {
    this.scaleOverlay.setScale(root as any, scaleName);
  }

  clearScale(): void {
    this.scaleOverlay.clearScale();
  }

  // ==========================================================================
  // GHOST NOTES OPERATIONS
  // ==========================================================================

  addGhostSource(streamId: EventStreamId, name: string): void {
    this.ghostNotesManager.addSource({
      type: 'stream',
      id: streamId,
      name,
      enabled: true,
    });
  }

  addGhostClip(clipId: ClipId): void {
    const clip = getClipRegistry().getClip(clipId);
    if (clip) {
      this.ghostNotesManager.addSource({
        type: 'clip',
        id: clipId,
        name: clip.name,
        ...(clip.color !== undefined && { color: clip.color }),
        enabled: true,
      });
    }
  }

  addAdjacentTrackGhosts(trackIndex: number): void {
    this.ghostNotesManager.addClipsFromAdjacentTracks(trackIndex, 1);
  }

  clearGhostSources(): void {
    this.ghostNotesManager.clearSources();
  }

  // ==========================================================================
  // STATE BUILDING
  // ==========================================================================

  private rebuildState(): void {
    const adapterState = this.adapter.getState();
    const activeScale = this.scaleOverlay.getActiveScale();

    // Enhance notes with scale info
    const enhancedNotes = adapterState.notes.map(note =>
      this.enhanceNote(note, activeScale)
    );

    // Get ghost notes
    const ghostNotes = this.options.showGhostNotes
      ? this.ghostNotesManager.getGhostNotes()
      : [];

    this.state = {
      enhancedNotes,
      ghostNotes,
      keyboardKeys: this.buildKeyboardKeys(),
      gridLines: this.buildGridLines(),
      activeScale,
    };

    this.notifyChange();
  }

  private enhanceNote(note: AdapterNoteRect, scale: ActiveScale | null): EnhancedNoteRectangle {
    const pitch = note.note ?? note.pitch;
    const baseColor = note.color ?? '#808080';

    if (!scale || !this.options.showScaleHighlight) {
      return {
        ...note,
        inScale: true,
        isRoot: false,
        isChordTone: false,
        scaleDegree: null,
        scaleColor: baseColor,
      };
    }

    const display = this.scaleOverlay.getNoteDisplay(pitch);

    // Adjust color based on scale position
    let scaleColor = baseColor;
    if (this.options.dimOutOfScale && !display.inScale) {
      scaleColor = this.dimColor(baseColor, 0.4);
    } else if (this.options.highlightChordTones && display.isChordTone) {
      scaleColor = this.brightenColor(baseColor, 20);
    }

    return {
      ...note,
      inScale: display.inScale,
      isRoot: display.isRoot,
      isChordTone: display.isChordTone,
      scaleDegree: display.degree,
      scaleColor,
    };
  }

  private buildKeyboardKeys(): PianoKeyInfo[] {
    const keys: PianoKeyInfo[] = [];
    const scale = this.scaleOverlay.getActiveScale();

    for (let note = 0; note < 128; note++) {
      const pitchClass = note % 12;
      const isBlack = [1, 3, 6, 8, 10].includes(pitchClass);

      if (!scale || !this.options.showScaleHighlight) {
        keys.push({
          note,
          isBlack,
          inScale: true,
          isRoot: false,
          isChordTone: false,
          color: isBlack ? '#333333' : '#ffffff',
        });
      } else {
        const display = this.scaleOverlay.getNoteDisplay(note);

        let color: string;
        if (display.isRoot) {
          color = this.scaleOverlay.getOptions().rootColor;
        } else if (display.isChordTone && this.options.highlightChordTones) {
          color = this.scaleOverlay.getOptions().chordToneColor;
        } else if (display.inScale) {
          color = isBlack ? '#444444' : '#e8f5e9';
        } else {
          color = isBlack ? '#333333' : (this.options.dimOutOfScale ? '#f5f5f5' : '#ffffff');
        }

        const label = display.isRoot ? 'R' : display.degree?.toString();
        keys.push({
          note,
          isBlack,
          inScale: display.inScale,
          isRoot: display.isRoot,
          isChordTone: display.isChordTone,
          color,
          ...(label !== undefined && { label }),
        });
      }
    }

    return keys;
  }

  private buildGridLines(): ScaleGridLine[] {
    const lines: ScaleGridLine[] = [];
    const scale = this.scaleOverlay.getActiveScale();

    for (let note = 0; note < 128; note++) {
      if (!scale || !this.options.showScaleHighlight) {
        lines.push({
          note,
          inScale: true,
          isRoot: false,
          color: '#e0e0e0',
          opacity: 0.5,
        });
      } else {
        const display = this.scaleOverlay.getNoteDisplay(note);

        let color: string;
        let opacity: number;

        if (display.isRoot) {
          color = this.scaleOverlay.getOptions().rootColor;
          opacity = this.options.scaleGridOpacity * 2;
        } else if (display.inScale) {
          color = this.scaleOverlay.getOptions().inScaleColor;
          opacity = this.options.scaleGridOpacity;
        } else {
          color = '#e0e0e0';
          opacity = this.options.scaleGridOpacity * 0.3;
        }

        lines.push({
          note,
          inScale: display.inScale,
          isRoot: display.isRoot,
          color,
          opacity,
        });
      }
    }

    return lines;
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  subscribe(callback: IntegrationStateCallback): () => void {
    this.callbacks.add(callback);
    callback(this.state);

    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifyChange(): void {
    for (const callback of this.callbacks) {
      try {
        callback(this.state);
      } catch (e) {
        console.error('Integration callback error:', e);
      }
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private dimColor(color: string, factor: number): string {
    const hex = color.replace('#', '');
    const r = Math.round(parseInt(hex.substr(0, 2), 16) * factor);
    const g = Math.round(parseInt(hex.substr(2, 2), 16) * factor);
    const b = Math.round(parseInt(hex.substr(4, 2), 16) * factor);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private brightenColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // ==========================================================================
  // INTERACTION
  // ==========================================================================

  /**
   * Quantizes note to scale (for editing).
   */
  quantizeNoteToScale(note: number): number {
    return this.scaleOverlay.quantizeToScale(note);
  }

  /**
   * Gets suggested notes for input (in scale and near current).
   */
  getSuggestedNotes(currentNote: number, range: number = 12): number[] {
    const suggestions: number[] = [];

    // Include nearby in-scale notes
    for (let n = currentNote - range; n <= currentNote + range; n++) {
      if (n >= 0 && n < 128 && this.scaleOverlay.isInScale(n)) {
        suggestions.push(n);
      }
    }

    return suggestions;
  }

  /**
   * Handles click on ghost note (navigate to source).
   */
  handleGhostNoteClick(ghostNote: GhostNote): void {
    // Dispatch event for navigation
    document.dispatchEvent(new CustomEvent('cardplay:navigate-to-source', {
      detail: {
        sourceId: ghostNote.sourceId,
        sourceName: ghostNote.sourceName,
      },
    }));
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  dispose(): void {
    if (this.adapterUnsubscribe) {
      this.adapterUnsubscribe();
    }
    if (this.scaleUnsubscribe) {
      this.scaleUnsubscribe();
    }
    if (this.ghostUnsubscribe) {
      this.ghostUnsubscribe();
    }

    this.ghostNotesManager.dispose();
    this.callbacks.clear();
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Creates a piano roll integration.
 */
export function createPianoRollIntegration(
  adapter: PianoRollStoreAdapter,
  options?: Partial<PianoRollIntegrationOptions>
): PianoRollIntegration {
  return new PianoRollIntegration(adapter, options);
}
