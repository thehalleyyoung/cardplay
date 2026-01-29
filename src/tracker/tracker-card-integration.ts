/**
 * @fileoverview Tracker Editor Widget
 * 
 * Integrates the TrackerCard UI as an EditorWidget for the CardPlay board system.
 * 
 * ## Architecture (per cardplay2.md Part VI)
 * 
 * The tracker is an **EditorWidget**, not a Card<A,B>:
 * 
 * - **Card<A,B>**: Typed morphism that transforms streams (e.g., quantize, arpeggiator)
 * - **EditorWidget**: UI surface bound to an EventContainer for interactive editing
 * 
 * Per cardplay2.md §6.2, the tracker:
 * - Has rows mapped to ticks and columns mapped to event fields
 * - Can represent NoteEvents, automation, and meta events
 * - Supports pattern operations (double/halve, duplicate, slice, merge)
 * - Writes through the same event CRUD operations as all other views
 * - Edits are immediately visible across tracker, piano roll, and notation
 * 
 * This module:
 * 1. Defines TrackerWidgetState extending EditorWidgetState
 * 2. Implements TrackerEditorWidget conforming to EditorWidget<TrackerWidgetState>
 * 3. Provides factory and registration functions
 * 
 * @module @cardplay/tracker/tracker-editor-widget
 */

import type { 
  EditorWidget,
  EditorWidgetMeta,
  EditorWidgetState,
  EditorWidgetContext,
  EditorWidgetResult,
} from '../ui/editor-widget';
import { getEditorWidgetRegistry } from '../ui/editor-widget';
import { TrackerCard, createTrackerCard } from './tracker-card';
import { getPatternStore, type PatternStore } from './pattern-store';
import { getTrackerEventSync, type TrackerEventSync } from './event-sync';
import { getTrackerInputHandler, type TrackerInputHandler } from './input-handler';
import { 
  createInitialTrackerState, 
  type TrackerState, 
  type CursorPosition, 
  type Pattern,
  asRowIndex,
  asColumnIndex,
  asPatternId,
  type PatternId,
  type TrackId,
  type EventStreamId as TrackerEventStreamId,
} from './types';
import type { EventStreamId } from '../state/types';

// =============================================================================
// WIDGET METADATA
// =============================================================================

/**
 * Tracker editor widget metadata.
 */
export const TRACKER_WIDGET_META: EditorWidgetMeta = {
  id: 'tracker',
  name: 'Pattern Tracker',
  description: 'Renoise-style pattern editor with row/column grid, microtiming, and compact control',
  category: 'sequencer',
  tags: ['tracker', 'pattern', 'sequencer', 'editor', 'renoise', 'rows', 'columns'],
  author: 'CardPlay',
  version: '1.0.0',
  
  visuals: {
    emoji: '📊',
    color: '#6366f1',
    icon: 'grid',
  },
  
  defaultWidth: 600,
  defaultHeight: 500,
  minWidth: 400,
  minHeight: 300,
  
  resizable: true,
  collapsible: true,
  closable: true,
};

// =============================================================================
// WIDGET STATE
// =============================================================================

/**
 * Tracker-specific widget state.
 * 
 * Extends EditorWidgetState with tracker-specific fields:
 * - Cursor position (row, track, column)
 * - Current pattern being edited
 * - Transport state (playing, recording, looping)
 * - Display configuration (LPB, tempo display)
 */
export interface TrackerWidgetState extends EditorWidgetState {
  /** Tracker editing state (cursor, selection, edit mode) */
  readonly trackerState: TrackerState;
  /** Currently active pattern ID */
  readonly currentPatternId: PatternId | null;
  /** Whether transport is playing */
  readonly isPlaying: boolean;
  /** Whether recording is enabled */
  readonly isRecording: boolean;
  /** Whether loop mode is enabled */
  readonly isLooping: boolean;
  /** Current tempo for display */
  readonly tempo: number;
  /** Lines per beat for grid display */
  readonly lpb: number;
}

/**
 * Create initial tracker widget state.
 */
export function createTrackerWidgetState(): TrackerWidgetState {
  // Use type assertion for exactOptionalPropertyTypes compliance
  // Optional fields are omitted rather than set to undefined
  const state: TrackerWidgetState = {
    trackerState: createInitialTrackerState(),
    currentPatternId: null,
    isPlaying: false,
    isRecording: false,
    isLooping: true,
    tempo: 120,
    lpb: 4,
  } as TrackerWidgetState;
  return state;
}

// =============================================================================
// WIDGET IMPLEMENTATION
// =============================================================================

/**
 * Tracker editor widget implementation.
 * 
 * Provides an interactive Renoise-style pattern editor that:
 * - Binds to an EventStream via SharedEventStore
 * - Syncs edits through TrackerEventSync
 * - Handles keyboard input via TrackerInputHandler
 * - Renders via TrackerCard UI component
 */
export class TrackerEditorWidget implements EditorWidget<TrackerWidgetState> {
  readonly id: string;
  readonly meta = TRACKER_WIDGET_META;
  
  private ui: TrackerCard | null = null;
  private container: HTMLElement | null = null;
  private patternStore: PatternStore;
  private _eventSync: TrackerEventSync;
  private inputHandler: TrackerInputHandler;
  private state: TrackerWidgetState;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  
  constructor(id: string) {
    this.id = id;
    this.patternStore = getPatternStore();
    this._eventSync = getTrackerEventSync();
    this.inputHandler = getTrackerInputHandler();
    this.state = createTrackerWidgetState();
  }
  
  /**
   * Initialize the widget.
   */
  async init(_context: EditorWidgetContext): Promise<void> {
    // Widget initialization - pattern creation happens on demand or via bindStream
  }
  
  /**
   * Bind the widget to an event stream.
   * 
   * Creates a pattern backed by the stream if needed, or uses existing pattern.
   */
  bindStream(streamId: EventStreamId): void {
    // Unbind previous stream if any
    if (this.state.boundStreamId) {
      this.unbindStream();
    }
    
    // Update state with new stream binding - use type assertion for exactOptionalPropertyTypes
    this.state = {
      ...this.state,
      boundStreamId: streamId,
    } as TrackerWidgetState;
    
    // Bind the event sync to this stream
    const pattern = this.getCurrentPattern();
    if (pattern) {
      const patternLength = pattern.config.length ?? 64;
      this._eventSync.bindStream(streamId, patternLength);
      // Re-render if mounted with the pattern
      if (this.ui) {
        this.ui.update({ pattern });
      }
    }
  }
  
  /**
   * Unbind from the current stream.
   */
  unbindStream(): void {
    if (this.state.boundStreamId) {
      this._eventSync.unbindStream(this.state.boundStreamId);
      // Remove boundStreamId by creating new state without it
      const { boundStreamId: _, ...restState } = this.state as TrackerWidgetState & { boundStreamId?: EventStreamId };
      this.state = restState as TrackerWidgetState;
    }
  }
  
  /**
   * Update widget state in response to context changes.
   */
  update(
    context: EditorWidgetContext, 
    state: TrackerWidgetState
  ): EditorWidgetResult<TrackerWidgetState> {
    // Update transport state
    const newState: TrackerWidgetState = {
      ...state,
      isPlaying: context.isPlaying,
      isRecording: context.isRecording,
      tempo: context.tempo,
    };
    
    // Update cursor position if playing (follow playhead)
    if (context.isPlaying && newState.currentPatternId) {
      const pattern = this.patternStore.getPattern(newState.currentPatternId);
      if (pattern) {
        const patternLength = pattern.config.length ?? 64;
        const currentRow = context.currentTick % patternLength;
        // Create new cursor with updated row - use type assertion for complex spread
        const baseCursor = newState.trackerState.cursor;
        const newCursor = {
          ...baseCursor,
          row: asRowIndex(currentRow),
        } as CursorPosition;
        return {
          state: {
            ...newState,
            trackerState: {
              ...newState.trackerState,
              cursor: newCursor,
            },
          },
          needsRender: true,
        };
      }
    }
    
    return { state: newState, needsRender: false };
  }
  
  /**
   * Mount the widget UI to a DOM container.
   */
  mount(container: HTMLElement): void {
    if (this.ui) {
      console.warn('TrackerEditorWidget: already mounted');
      return;
    }
    
    this.container = container;
    const pattern = this.getCurrentPattern();
    const cursor = this.state.trackerState.cursor;
    
    // Build options conditionally to satisfy exactOptionalPropertyTypes
    const options: Parameters<typeof createTrackerCard>[0] = {
      title: this.meta.name,
      isPlaying: this.state.isPlaying,
      isRecording: this.state.isRecording,
      isLooping: this.state.isLooping,
      
      onCellClick: (row, track, column) => {
        this.handleCellClick(row, track as unknown as TrackId, column);
      },
      
      onPlay: () => this.handlePlay(),
      onPause: () => this.handlePause(),
      onStop: () => this.handleStop(),
      onRecord: () => this.handleRecord(),
      onLoopToggle: () => this.handleLoopToggle(),
    };
    
    // Add optional properties only if they exist
    if (pattern) {
      options.pattern = pattern;
    }
    if (cursor) {
      options.cursor = cursor;
    }
    
    this.ui = createTrackerCard(options);
    
    this.ui.mount(container);
    this.setupKeyboardHandling(container);
  }
  
  /**
   * Unmount the widget UI.
   */
  unmount(): void {
    if (this.keydownHandler && this.container) {
      this.container.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    
    if (this.ui) {
      this.ui.unmount();
      this.ui = null;
    }
    
    this.container = null;
  }
  
  /**
   * Get current widget state.
   */
  getState(): TrackerWidgetState {
    return this.state;
  }
  
  /**
   * Serialize widget state for persistence.
   */
  serialize(): unknown {
    return {
      id: this.id,
      boundStreamId: this.state.boundStreamId,
      currentPatternId: this.state.currentPatternId,
      cursor: this.state.trackerState.cursor,
      isLooping: this.state.isLooping,
      lpb: this.state.lpb,
    };
  }
  
  /**
   * Restore widget state from serialized data.
   */
  deserialize(data: unknown): void {
    const parsed = data as {
      boundStreamId?: EventStreamId;
      currentPatternId?: PatternId;
      cursor?: CursorPosition;
      isLooping?: boolean;
      lpb?: number;
    };
    
    if (parsed.boundStreamId) {
      this.bindStream(parsed.boundStreamId);
    }
    
    if (parsed.currentPatternId) {
      this.state = {
        ...this.state,
        currentPatternId: parsed.currentPatternId,
      };
    }
    
    if (parsed.cursor) {
      this.state = {
        ...this.state,
        trackerState: {
          ...this.state.trackerState,
          cursor: parsed.cursor,
        },
      };
    }
    
    if (parsed.isLooping !== undefined) {
      this.state = { ...this.state, isLooping: parsed.isLooping };
    }
    
    if (parsed.lpb !== undefined) {
      this.state = { ...this.state, lpb: parsed.lpb };
    }
  }
  
  /**
   * Destroy the widget and clean up resources.
   */
  destroy(): void {
    this.unbindStream();
    this.unmount();
  }
  
  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================
  
  /**
   * Get the current pattern from the store.
   */
  private getCurrentPattern(): Pattern | undefined {
    if (!this.state.currentPatternId) return undefined;
    return this.patternStore.getPattern(this.state.currentPatternId);
  }
  
  /**
   * Setup keyboard event handling.
   */
  private setupKeyboardHandling(container: HTMLElement): void {
    container.tabIndex = 0; // Make focusable
    
    this.keydownHandler = (e: KeyboardEvent) => {
      const pattern = this.getCurrentPattern();
      if (!pattern) return;
      
      // Handle through input handler
      const patternLength = pattern.config.length ?? 64;
      // Cast EventStreamId to tracker's type (they're structurally equivalent)
      const streamId = this.state.boundStreamId as TrackerEventStreamId | undefined;
      const handled = this.inputHandler.handleKeyDown(
        e.key,
        this.state.trackerState,
        streamId ?? null,
        patternLength,
      );
      
      if (handled) {
        e.preventDefault();
        const cursor = this.state.trackerState.cursor;
        if (cursor) {
          this.ui?.update({
            pattern,
            cursor,
          });
        } else {
          this.ui?.update({ pattern });
        }
      }
    };
    
    container.addEventListener('keydown', this.keydownHandler);
  }
  
  /**
   * Handle cell click.
   */
  private handleCellClick(row: number, track: TrackId, column: number): void {
    // Create a valid CursorPosition with all required fields
    const newCursor: CursorPosition = {
      patternId: this.state.currentPatternId ?? asPatternId('default'),
      trackId: track,
      row: asRowIndex(row),
      column: asColumnIndex(column),
      subColumn: 'note',
      effectIndex: 0,
      nibble: 0,
    };
    
    this.state = {
      ...this.state,
      trackerState: {
        ...this.state.trackerState,
        cursor: newCursor,
      },
    } as TrackerWidgetState;
    
    this.ui?.update({ cursor: newCursor });
  }
  
  /**
   * Handle play button.
   */
  private handlePlay(): void {
    this.state = { ...this.state, isPlaying: true };
    this.ui?.update({ isPlaying: true });
    // TODO: Dispatch transport play action
  }
  
  /**
   * Handle pause button.
   */
  private handlePause(): void {
    this.state = { ...this.state, isPlaying: false };
    this.ui?.update({ isPlaying: false });
    // TODO: Dispatch transport pause action
  }
  
  /**
   * Handle stop button.
   */
  private handleStop(): void {
    // Create new cursor at row 0, preserving other properties if cursor exists
    const existingCursor = this.state.trackerState.cursor;
    const newCursor: CursorPosition | null = existingCursor ? {
      ...existingCursor,
      row: asRowIndex(0),
    } : null;
    
    this.state = {
      ...this.state,
      isPlaying: false,
      trackerState: {
        ...this.state.trackerState,
        cursor: newCursor,
      },
    } as TrackerWidgetState;
    
    if (newCursor) {
      this.ui?.update({ 
        isPlaying: false,
        cursor: newCursor,
      });
    } else {
      this.ui?.update({ isPlaying: false });
    }
    // TODO: Dispatch transport stop action
  }
  
  /**
   * Handle record toggle.
   */
  private handleRecord(): void {
    const newRecording = !this.state.isRecording;
    this.state = { ...this.state, isRecording: newRecording };
    this.ui?.update({ isRecording: newRecording });
    // TODO: Dispatch transport record action
  }
  
  /**
   * Handle loop toggle.
   */
  private handleLoopToggle(): void {
    const newLooping = !this.state.isLooping;
    this.state = { ...this.state, isLooping: newLooping };
    this.ui?.update({ isLooping: newLooping });
    // TODO: Dispatch transport loop action
  }
  
  // ===========================================================================
  // PUBLIC METHODS (Widget-specific)
  // ===========================================================================
  
  /**
   * Set the active pattern.
   */
  setPattern(patternId: PatternId): void {
    this.state = { ...this.state, currentPatternId: patternId } as TrackerWidgetState;
    const pattern = this.patternStore.getPattern(patternId);
    if (pattern && this.ui) {
      this.ui.update({ pattern });
    }
  }
  
  /**
   * Create a new pattern and set it as active.
   */
  createPattern(name: string, length: number = 64): PatternId {
    const patternId = this.patternStore.createPattern(name, length);
    this.setPattern(patternId);
    return patternId;
  }
}

// =============================================================================
// FACTORY & REGISTRATION
// =============================================================================

/**
 * Create a tracker editor widget instance.
 */
export function createTrackerEditorWidget(id?: string): TrackerEditorWidget {
  return new TrackerEditorWidget(id ?? `tracker-${crypto.randomUUID()}`);
}

/**
 * Register the tracker editor widget with the global registry.
 */
export function registerTrackerEditorWidget(): void {
  const registry = getEditorWidgetRegistry();
  if (!registry.has('tracker')) {
    registry.register('tracker', createTrackerEditorWidget);
  }
}

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================

/**
 * @deprecated Use TrackerEditorWidget instead.
 * Legacy alias for backwards compatibility.
 */
export const TrackerCardImpl = TrackerEditorWidget;

/**
 * @deprecated Use createTrackerEditorWidget instead.
 * Legacy factory alias for backwards compatibility.
 */
export const createTrackerCardImpl = createTrackerEditorWidget;

/**
 * @deprecated Use TRACKER_WIDGET_META instead.
 * Legacy metadata alias for backwards compatibility.
 */
export const TRACKER_CARD_META = TRACKER_WIDGET_META;

/**
 * @deprecated Use TrackerWidgetState instead.
 * Legacy state type alias.
 */
export type TrackerCardState = TrackerWidgetState;

/**
 * @deprecated Use createTrackerWidgetState instead.
 */
export const createTrackerCardState = createTrackerWidgetState;

/**
 * @deprecated Use registerTrackerEditorWidget instead.
 * Legacy registration function that adapts to the old Map-based registry.
 */
export function registerTrackerCard(registry: Map<string, () => unknown>): void {
  registry.set('tracker', () => createTrackerEditorWidget());
}
