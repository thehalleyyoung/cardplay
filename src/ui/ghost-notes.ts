/**
 * @fileoverview Ghost Notes - Display notes from other clips/tracks.
 * 
 * Provides:
 * - Visual reference from other clips while editing
 * - Configurable opacity and filtering
 * - Cross-track ghost note display
 * - Integration with SharedEventStore
 * 
 * @module @cardplay/ui/ghost-notes
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase H.3
 */

import type { Tick, TickDuration, Velocity } from '../types/primitives';
import { asTick } from '../types/primitives';
import type {
  EventStreamId,
  ClipId,
  SubscriptionId,
} from '../state/types';
import {
  getSharedEventStore,
  getClipRegistry,
} from '../state';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Ghost note display info.
 */
export interface GhostNote {
  /** Source note ID */
  readonly id: string;
  /** MIDI note number */
  readonly note: number;
  /** Start tick (adjusted for display context) */
  readonly start: Tick;
  /** Duration in ticks */
  readonly duration: TickDuration;
  /** Original velocity */
  readonly velocity: Velocity;
  /** Source stream/clip ID */
  readonly sourceId: string;
  /** Source clip name */
  readonly sourceName: string;
  /** Display color */
  readonly color: string;
  /** Opacity (0-1) */
  readonly opacity: number;
}

/**
 * Ghost note source.
 */
export interface GhostNoteSource {
  readonly type: 'stream' | 'clip';
  readonly id: EventStreamId | ClipId;
  readonly name: string;
  readonly color?: string;
  readonly opacity?: number;
  readonly enabled: boolean;
}

/**
 * Ghost note filter.
 */
export interface GhostNoteFilter {
  /** Only show notes in this pitch range */
  readonly pitchRange?: { min: number; max: number };
  /** Only show notes in this time range */
  readonly timeRange?: { start: Tick; end: Tick };
  /** Only show notes matching these velocities */
  readonly velocityRange?: { min: number; max: number };
  /** Only show notes on these channels */
  readonly channels?: readonly number[];
}

/**
 * Ghost notes options.
 */
export interface GhostNotesOptions {
  /** Default opacity for ghost notes */
  readonly defaultOpacity: number;
  /** Maximum number of ghost notes to show */
  readonly maxNotes: number;
  /** Show notes from same track */
  readonly showSameTrack: boolean;
  /** Auto-color based on source */
  readonly autoColor: boolean;
  /** Default color when not auto-coloring */
  readonly defaultColor: string;
  /** Color palette for auto-coloring */
  readonly colorPalette: readonly string[];
}

/**
 * State callback.
 */
export type GhostNotesCallback = (notes: readonly GhostNote[]) => void;

// ============================================================================
// GHOST NOTES MANAGER
// ============================================================================

/**
 * GhostNotesManager handles display of notes from other clips.
 */
export class GhostNotesManager {
  private sources = new Map<string, GhostNoteSource>();
  private filter: GhostNoteFilter = {};
  private options: GhostNotesOptions;
  private contextClipId: ClipId | null = null;
  private contextStart: Tick = asTick(0);
  private contextEnd: Tick = asTick(0);

  private cachedNotes: GhostNote[] = [];
  private subscriptions = new Map<string, SubscriptionId>();
  private callbacks = new Set<GhostNotesCallback>();
  private colorIndex = 0;

  constructor(options?: Partial<GhostNotesOptions>) {
    this.options = {
      defaultOpacity: 0.3,
      maxNotes: 1000,
      showSameTrack: false,
      autoColor: true,
      defaultColor: '#808080',
      colorPalette: [
        '#9C27B0', // Purple
        '#2196F3', // Blue
        '#4CAF50', // Green
        '#FF9800', // Orange
        '#E91E63', // Pink
        '#00BCD4', // Cyan
        '#FFEB3B', // Yellow
        '#795548', // Brown
      ],
      ...options,
    };
  }

  // ==========================================================================
  // CONTEXT
  // ==========================================================================

  /**
   * Sets the editing context (clip being edited).
   */
  setContext(clipId: ClipId, start: Tick, end: Tick): void {
    this.contextClipId = clipId;
    this.contextStart = start;
    this.contextEnd = end;
    this.rebuildCache();
  }

  /**
   * Sets time range filter.
   */
  setTimeRange(start: Tick, end: Tick): void {
    this.contextStart = start;
    this.contextEnd = end;
    this.rebuildCache();
  }

  // ==========================================================================
  // SOURCE MANAGEMENT
  // ==========================================================================

  /**
   * Adds a ghost note source.
   */
  addSource(source: GhostNoteSource): void {
    const sourceKey = `${source.type}-${source.id}`;

    // Assign color if auto-coloring
    let color = source.color;
    if (!color && this.options.autoColor) {
      color = this.options.colorPalette[this.colorIndex % this.options.colorPalette.length];
      this.colorIndex++;
    }

    this.sources.set(sourceKey, {
      ...source,
      color: color ?? this.options.defaultColor,
    });

    // Subscribe to changes
    if (source.type === 'stream') {
      const store = getSharedEventStore();
      const subId = store.subscribeToStream(
        source.id as EventStreamId,
        () => this.rebuildCache()
      );
      this.subscriptions.set(sourceKey, subId);
    }

    this.rebuildCache();
  }

  /**
   * Removes a ghost note source.
   */
  removeSource(type: 'stream' | 'clip', id: string): void {
    const sourceKey = `${type}-${id}`;
    this.sources.delete(sourceKey);

    // Unsubscribe
    const subId = this.subscriptions.get(sourceKey);
    if (subId && type === 'stream') {
      getSharedEventStore().unsubscribeFromStream(id as EventStreamId, subId);
    }
    this.subscriptions.delete(sourceKey);

    this.rebuildCache();
  }

  /**
   * Enables/disables a source.
   */
  setSourceEnabled(type: 'stream' | 'clip', id: string, enabled: boolean): void {
    const sourceKey = `${type}-${id}`;
    const source = this.sources.get(sourceKey);
    if (source) {
      this.sources.set(sourceKey, { ...source, enabled });
      this.rebuildCache();
    }
  }

  /**
   * Gets all sources.
   */
  getSources(): readonly GhostNoteSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Clears all sources.
   */
  clearSources(): void {
    // Unsubscribe all
    for (const [key, subId] of this.subscriptions) {
      const [type, id] = key.split('-', 2);
      if (type === 'stream') {
        getSharedEventStore().unsubscribeFromStream(id as EventStreamId, subId);
      }
    }

    this.sources.clear();
    this.subscriptions.clear();
    this.colorIndex = 0;
    this.cachedNotes = [];
    this.notifyChange();
  }

  // ==========================================================================
  // AUTO-DISCOVERY
  // ==========================================================================

  /**
   * Adds all clips from a track as sources.
   */
  addClipsFromTrack(_trackIndex: number, excludeClipId?: ClipId): void {
    const registry = getClipRegistry();
    const clips = registry.getAllClips();

    for (const clip of clips) {
      if (clip.id !== excludeClipId) {
        this.addSource({
          type: 'clip',
          id: clip.id,
          name: clip.name,
          ...(clip.color !== undefined && { color: clip.color }),
          enabled: true,
        });
      }
    }
  }

  /**
   * Adds clips from adjacent tracks.
   */
  addClipsFromAdjacentTracks(_trackIndex: number, _range: number = 1): void {
    const registry = getClipRegistry();
    const clips = registry.getAllClips();

    for (const clip of clips) {
      this.addSource({
        type: 'clip',
        id: clip.id,
        name: clip.name,
        ...(clip.color !== undefined && { color: clip.color }),
        enabled: true,
      });
    }
  }

  /**
   * Adds all streams as sources.
   */
  addAllStreams(excludeStreamId?: EventStreamId): void {
    const store = getSharedEventStore();
    const streams = store.getAllStreams();

    for (const record of streams) {
      const streamId = record.id;
      if (streamId !== excludeStreamId) {
        this.addSource({
          type: 'stream',
          id: streamId,
          name: record.name,
          enabled: true,
        });
      }
    }
  }

  // ==========================================================================
  // FILTER
  // ==========================================================================

  /**
   * Sets the ghost note filter.
   */
  setFilter(filter: GhostNoteFilter): void {
    this.filter = filter;
    this.rebuildCache();
  }

  /**
   * Gets the current filter.
   */
  getFilter(): GhostNoteFilter {
    return this.filter;
  }

  /**
   * Clears the filter.
   */
  clearFilter(): void {
    this.filter = {};
    this.rebuildCache();
  }

  // ==========================================================================
  // GHOST NOTES ACCESS
  // ==========================================================================

  /**
   * Gets all visible ghost notes.
   */
  getGhostNotes(): readonly GhostNote[] {
    return this.cachedNotes;
  }

  /**
   * Gets ghost notes in a range.
   */
  getGhostNotesInRange(start: Tick, end: Tick): readonly GhostNote[] {
    return this.cachedNotes.filter(n =>
      (n.start as number) < (end as number) &&
      ((n.start as number) + (n.duration as number)) > (start as number)
    );
  }

  /**
   * Gets ghost notes for a specific pitch.
   */
  getGhostNotesForPitch(note: number): readonly GhostNote[] {
    return this.cachedNotes.filter(n => n.note === note);
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  private rebuildCache(): void {
    const notes: GhostNote[] = [];

    for (const source of this.sources.values()) {
      if (!source.enabled) continue;
      if (this.contextClipId && source.type === 'clip' && source.id === this.contextClipId) continue;

      const sourceNotes = this.getNotesFromSource(source);
      notes.push(...sourceNotes);
    }

    // Apply filter
    const filtered = this.applyFilter(notes);

    // Sort by time
    filtered.sort((a, b) => (a.start as number) - (b.start as number));

    // Limit
    this.cachedNotes = filtered.slice(0, this.options.maxNotes);

    this.notifyChange();
  }

  private getNotesFromSource(source: GhostNoteSource): GhostNote[] {
    const notes: GhostNote[] = [];
    const opacity = source.opacity ?? this.options.defaultOpacity;
    const color = source.color ?? this.options.defaultColor;

    if (source.type === 'stream') {
      const store = getSharedEventStore();
      const events = store.getStream(source.id as EventStreamId)?.events ?? [];

      for (const event of events) {
        if (event.kind !== 'note') continue;

        const payload = event.payload as { pitch?: number; note?: number; velocity?: number };
        const pitch = payload.pitch ?? payload.note;
        if (pitch === undefined) continue;
        const velocity = payload.velocity ?? 100;

        notes.push({
          id: `${source.id}-${event.id}`,
          note: pitch,
          start: event.start,
          duration: event.duration,
          velocity: velocity as Velocity,
          sourceId: source.id,
          sourceName: source.name,
          color,
          opacity,
        });
      }
    } else if (source.type === 'clip') {
      const registry = getClipRegistry();
      const clip = registry.getClip(source.id as ClipId);
      if (!clip) return notes;

      const store = getSharedEventStore();
      const events = store.getStream(clip.streamId)?.events ?? [];

      for (const event of events) {
        if (event.kind !== 'note') continue;

        const payload = event.payload as { pitch?: number; note?: number; velocity?: number };
        const pitch = payload.pitch ?? payload.note;
        if (pitch === undefined) continue;
        const velocity = payload.velocity ?? 100;

        // Adjust start time relative to clip
        const adjustedStart = event.start;

        // Skip if outside clip bounds
        if (
          (event.start as number) < (clip.startTick as number) ||
          (event.start as number) >= ((clip.startTick as number) + (clip.lengthTicks as number))
        ) {
          continue;
        }

        notes.push({
          id: `${source.id}-${event.id}`,
          note: pitch,
          start: adjustedStart,
          duration: event.duration,
          velocity: velocity as Velocity,
          sourceId: source.id,
          sourceName: source.name,
          color: clip.color ?? color,
          opacity,
        });
      }
    }

    return notes;
  }

  private applyFilter(notes: GhostNote[]): GhostNote[] {
    return notes.filter(note => {
      // Time range filter
      if (this.filter.timeRange) {
        const noteEnd = (note.start as number) + (note.duration as number);
        if (
          (note.start as number) >= (this.filter.timeRange.end as number) ||
          noteEnd <= (this.filter.timeRange.start as number)
        ) {
          return false;
        }
      }

      // Context time range (from setContext)
      if (this.contextEnd && (this.contextEnd as number) > 0) {
        const noteEnd = (note.start as number) + (note.duration as number);
        if (
          (note.start as number) >= (this.contextEnd as number) ||
          noteEnd <= (this.contextStart as number)
        ) {
          return false;
        }
      }

      // Pitch range filter
      if (this.filter.pitchRange) {
        if (
          note.note < this.filter.pitchRange.min ||
          note.note > this.filter.pitchRange.max
        ) {
          return false;
        }
      }

      // Velocity range filter
      if (this.filter.velocityRange) {
        if (
          (note.velocity as number) < this.filter.velocityRange.min ||
          (note.velocity as number) > this.filter.velocityRange.max
        ) {
          return false;
        }
      }

      return true;
    });
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  /**
   * Subscribes to ghost note changes.
   */
  subscribe(callback: GhostNotesCallback): () => void {
    this.callbacks.add(callback);
    callback(this.cachedNotes);

    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifyChange(): void {
    for (const callback of this.callbacks) {
      try {
        callback(this.cachedNotes);
      } catch (e) {
        console.error('Ghost notes callback error:', e);
      }
    }
  }

  // ==========================================================================
  // OPTIONS
  // ==========================================================================

  /**
   * Gets options.
   */
  getOptions(): GhostNotesOptions {
    return this.options;
  }

  /**
   * Sets options.
   */
  setOptions(options: Partial<GhostNotesOptions>): void {
    this.options = { ...this.options, ...options };
    this.rebuildCache();
  }

  // ==========================================================================
  // RENDERING HELPERS
  // ==========================================================================

  /**
   * Gets CSS style for a ghost note.
   */
  getNoteStyle(note: GhostNote): {
    backgroundColor: string;
    opacity: number;
    borderColor: string;
  } {
    return {
      backgroundColor: note.color,
      opacity: note.opacity,
      borderColor: this.adjustBrightness(note.color, -20),
    };
  }

  /**
   * Gets notes grouped by source for legend display.
   */
  getNotesBySource(): Map<string, { source: GhostNoteSource; count: number }> {
    const result = new Map<string, { source: GhostNoteSource; count: number }>();

    for (const note of this.cachedNotes) {
      const sourceKey = `${note.sourceId}`;
      const existing = result.get(sourceKey);

      if (existing) {
        result.set(sourceKey, { ...existing, count: existing.count + 1 });
      } else {
        const source = Array.from(this.sources.values()).find(
          s => s.id === note.sourceId
        );
        if (source) {
          result.set(sourceKey, { source, count: 1 });
        }
      }
    }

    return result;
  }

  private adjustBrightness(color: string, amount: number): string {
    // Simple brightness adjustment
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  dispose(): void {
    this.clearSources();
    this.callbacks.clear();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Creates a ghost notes manager.
 */
export function createGhostNotesManager(options?: Partial<GhostNotesOptions>): GhostNotesManager {
  return new GhostNotesManager(options);
}
