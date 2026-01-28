/**
 * @fileoverview Arrangement View - Timeline-based arrangement editor.
 * 
 * The Arrangement view provides a linear timeline for arranging clips,
 * with track lanes, markers, and automation. Uses ClipRegistry for
 * shared clips with Session view.
 * 
 * @module @cardplay/ui/arrangement-view
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase E.2
 */

import type { Event } from '../types/event';
import type { Tick, TickDuration } from '../types/primitives';
import { asTick, asTickDuration } from '../types/primitives';
import type {
  EventStreamId,
  ClipId,
  ClipRecord,
  SubscriptionId,
} from '../state/types';
import {
  getSharedEventStore,
  getClipRegistry,
  executeWithUndo,
} from '../state';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Clip placement in arrangement.
 */
export interface ArrangementClip {
  /** Clip ID in registry */
  readonly clipId: ClipId;
  /** Track index */
  readonly trackIndex: number;
  /** Start position in arrangement (ticks) */
  readonly startTick: Tick;
  /** Displayed length (may differ from clip's internal length) */
  readonly displayLength: TickDuration;
  /** Offset into clip (for trimmed clips) */
  readonly clipOffset: Tick;
  /** Whether clip is muted */
  readonly muted: boolean;
  /** Whether clip is selected */
  readonly selected: boolean;
  /** Color override (uses clip color if not set) */
  readonly color?: string;
  /** Gain adjustment for this placement */
  readonly gain: number;
  /** Fade in length (ticks) */
  readonly fadeIn: TickDuration;
  /** Fade out length (ticks) */
  readonly fadeOut: TickDuration;
}

/**
 * Marker in arrangement.
 */
export interface ArrangementMarker {
  readonly id: string;
  readonly tick: Tick;
  readonly name: string;
  readonly color?: string;
  readonly type: 'marker' | 'locator' | 'loop-start' | 'loop-end';
}

/**
 * Automation lane.
 */
export interface AutomationLane {
  readonly id: string;
  readonly trackIndex: number;
  readonly parameterPath: string; // e.g., "card-id:param-name"
  readonly name: string;
  readonly streamId: EventStreamId;
  readonly visible: boolean;
  readonly height: number;
  readonly color?: string;
}

/**
 * Track in arrangement.
 */
export interface ArrangementTrack {
  readonly index: number;
  readonly name: string;
  readonly color?: string;
  readonly height: number;
  readonly muted: boolean;
  readonly soloed: boolean;
  readonly armed: boolean;
  readonly frozen: boolean;
  readonly automationLanes: readonly AutomationLane[];
  readonly visible: boolean;
}

/**
 * Time ruler configuration.
 */
export interface TimeRulerConfig {
  readonly ticksPerBeat: number;
  readonly beatsPerBar: number;
  readonly showBars: boolean;
  readonly showBeats: boolean;
  readonly showTime: boolean;
  readonly tempo: number;
}

/**
 * Arrangement view state.
 */
export interface ArrangementState {
  /** Tracks */
  readonly tracks: readonly ArrangementTrack[];
  /** Clip placements */
  readonly clips: readonly ArrangementClip[];
  /** Markers */
  readonly markers: readonly ArrangementMarker[];
  /** Scroll position (ticks) */
  readonly scrollX: Tick;
  /** Scroll position (pixels, vertical) */
  readonly scrollY: number;
  /** Horizontal zoom (pixels per tick) */
  readonly zoomX: number;
  /** Visible tick range */
  readonly visibleRange: { start: Tick; end: Tick };
  /** Playhead position */
  readonly playhead: Tick;
  /** Loop region */
  readonly loopRegion: { start: Tick; end: Tick } | null;
  /** Loop enabled */
  readonly loopEnabled: boolean;
  /** Time ruler configuration */
  readonly timeRuler: TimeRulerConfig;
  /** Selected clips */
  readonly selectedClips: readonly string[];
  /** Selected markers */
  readonly selectedMarkers: readonly string[];
  /** Snap to grid */
  readonly snapEnabled: boolean;
  /** Snap resolution */
  readonly snapResolution: TickDuration;
  /** Edit mode */
  readonly editMode: 'select' | 'draw' | 'slice' | 'automation';
}

/**
 * Callback for arrangement state changes.
 */
export type ArrangementStateCallback = (state: ArrangementState) => void;

/**
 * Options for creating arrangement adapter.
 */
export interface ArrangementAdapterOptions {
  /** Initial track count */
  trackCount?: number;
  /** Track configurations */
  tracks?: readonly Partial<ArrangementTrack>[];
  /** Time ruler configuration */
  timeRuler?: Partial<TimeRulerConfig>;
}

// ============================================================================
// ARRANGEMENT ADAPTER
// ============================================================================

/**
 * ArrangementAdapter manages the arrangement timeline view.
 */
export class ArrangementAdapter {
  private state: ArrangementState;
  private stateSubscriptions = new Set<ArrangementStateCallback>();
  private registrySubscriptionId: SubscriptionId | null = null;
  private disposed = false;

  constructor(options: ArrangementAdapterOptions = {}) {
    const trackCount = options.trackCount ?? 8;

    // Create tracks
    const tracks: ArrangementTrack[] = [];
    for (let i = 0; i < trackCount; i++) {
      const trackConfig = options.tracks?.[i] ?? {};
      tracks.push({
        index: i,
        name: trackConfig.name ?? `Track ${i + 1}`,
        ...(trackConfig.color !== undefined && { color: trackConfig.color }),
        height: trackConfig.height ?? 80,
        muted: trackConfig.muted ?? false,
        soloed: trackConfig.soloed ?? false,
        armed: trackConfig.armed ?? false,
        frozen: trackConfig.frozen ?? false,
        automationLanes: trackConfig.automationLanes ?? [],
        visible: trackConfig.visible ?? true,
      });
    }

    this.state = Object.freeze({
      tracks,
      clips: [],
      markers: [],
      scrollX: asTick(0),
      scrollY: 0,
      zoomX: 0.1, // pixels per tick
      visibleRange: { start: asTick(0), end: asTick(7680) }, // 4 bars
      playhead: asTick(0),
      loopRegion: null,
      loopEnabled: false,
      timeRuler: {
        ticksPerBeat: options.timeRuler?.ticksPerBeat ?? 480,
        beatsPerBar: options.timeRuler?.beatsPerBar ?? 4,
        showBars: options.timeRuler?.showBars ?? true,
        showBeats: options.timeRuler?.showBeats ?? true,
        showTime: options.timeRuler?.showTime ?? false,
        tempo: options.timeRuler?.tempo ?? 120,
      },
      selectedClips: [],
      selectedMarkers: [],
      snapEnabled: true,
      snapResolution: asTickDuration(480), // Quarter note
      editMode: 'select',
    });

    // Subscribe to clip registry changes
    const registry = getClipRegistry();
    this.registrySubscriptionId = registry.subscribeAll(() => {
      this.refreshClipData();
    });
  }

  // ==========================================================================
  // STATE ACCESS
  // ==========================================================================

  getState(): ArrangementState {
    return this.state;
  }

  /**
   * Gets clip placement by internal ID.
   */
  getClipPlacement(placementId: string): ArrangementClip | undefined {
    return this.state.clips.find(c => `${c.trackIndex}-${c.startTick}` === placementId);
  }

  /**
   * Gets clip record from registry.
   */
  getClipRecord(clipId: ClipId): ClipRecord | undefined {
    return getClipRegistry().getClip(clipId);
  }

  /**
   * Gets clip events.
   */
  getClipEvents(clipId: ClipId): readonly Event<unknown>[] {
    const clip = this.getClipRecord(clipId);
    if (!clip) return [];

    const store = getSharedEventStore();
    const allEvents = store.getStream(clip.streamId)?.events ?? [];

    return allEvents.filter(e =>
      e.start >= clip.startTick && e.start < (clip.startTick + clip.lengthTicks)
    );
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  subscribe(callback: ArrangementStateCallback): () => void {
    this.stateSubscriptions.add(callback);
    callback(this.state);

    return () => {
      this.stateSubscriptions.delete(callback);
    };
  }

  private notifyStateChange(): void {
    for (const callback of this.stateSubscriptions) {
      try {
        callback(this.state);
      } catch (e) {
        console.error('Arrangement state callback error:', e);
      }
    }
  }

  private refreshClipData(): void {
    const registry = getClipRegistry();

    const clips = this.state.clips.map(placement => {
      const clip = registry.getClip(placement.clipId);
      if (!clip) return null;

      const resolvedColor = placement.color ?? clip.color;
      const { color: _oldColor, ...rest } = placement;
      return {
        ...rest,
        ...(resolvedColor !== undefined && { color: resolvedColor }),
      } as ArrangementClip;
    }).filter((c): c is ArrangementClip => c !== null);

    this.state = Object.freeze({
      ...this.state,
      clips,
    });
    this.notifyStateChange();
  }

  // ==========================================================================
  // CLIP OPERATIONS
  // ==========================================================================

  /**
   * Places a clip in the arrangement.
   */
  placeClip(
    clipId: ClipId,
    trackIndex: number,
    startTick: Tick,
    options: {
      displayLength?: TickDuration;
      clipOffset?: Tick;
      muted?: boolean;
      gain?: number;
      fadeIn?: TickDuration;
      fadeOut?: TickDuration;
    } = {}
  ): void {
    const clip = getClipRegistry().getClip(clipId);
    if (!clip) return;

    const placement: ArrangementClip = {
      clipId,
      trackIndex,
      startTick: this.snapTick(startTick),
      displayLength: options.displayLength ?? asTickDuration(clip.lengthTicks as number),
      clipOffset: options.clipOffset ?? asTick(0),
      muted: options.muted ?? false,
      selected: false,
      gain: options.gain ?? 1.0,
      fadeIn: options.fadeIn ?? asTickDuration(0),
      fadeOut: options.fadeOut ?? asTickDuration(0),
    };

    const clips = [...this.state.clips, placement];

    executeWithUndo({
      type: 'clip:place',
      description: 'Place clip',
      execute: () => {
        this.state = Object.freeze({ ...this.state, clips });
        this.notifyStateChange();
        return placement;
      },
      undo: () => {
        this.state = Object.freeze({
          ...this.state,
          clips: this.state.clips.filter(c =>
            c.clipId !== clipId || c.trackIndex !== trackIndex || c.startTick !== startTick
          ),
        });
        this.notifyStateChange();
      },
      redo: () => {
        this.state = Object.freeze({
          ...this.state,
          clips: [...this.state.clips, placement],
        });
        this.notifyStateChange();
      },
    });
  }

  /**
   * Removes a clip placement.
   */
  removeClipPlacement(trackIndex: number, startTick: Tick): void {
    const placement = this.state.clips.find(
      c => c.trackIndex === trackIndex && c.startTick === startTick
    );
    if (!placement) return;

    executeWithUndo({
      type: 'clip:remove',
      description: 'Remove clip',
      execute: () => {
        this.state = Object.freeze({
          ...this.state,
          clips: this.state.clips.filter(c =>
            c.trackIndex !== trackIndex || c.startTick !== startTick
          ),
        });
        this.notifyStateChange();
        return placement;
      },
      undo: (removed) => {
        this.state = Object.freeze({
          ...this.state,
          clips: [...this.state.clips, removed],
        });
        this.notifyStateChange();
      },
      redo: () => {
        this.state = Object.freeze({
          ...this.state,
          clips: this.state.clips.filter(c =>
            c.trackIndex !== trackIndex || c.startTick !== startTick
          ),
        });
        this.notifyStateChange();
      },
    });
  }

  /**
   * Moves a clip placement.
   */
  moveClipPlacement(
    fromTrack: number,
    fromTick: Tick,
    toTrack: number,
    toTick: Tick
  ): void {
    const placement = this.state.clips.find(
      c => c.trackIndex === fromTrack && c.startTick === fromTick
    );
    if (!placement) return;

    const snappedTick = this.snapTick(toTick);

    const updatedPlacement: ArrangementClip = {
      ...placement,
      trackIndex: toTrack,
      startTick: snappedTick,
    };

    executeWithUndo({
      type: 'clip:move',
      description: 'Move clip',
      execute: () => {
        this.state = Object.freeze({
          ...this.state,
          clips: this.state.clips.map(c =>
            c.trackIndex === fromTrack && c.startTick === fromTick
              ? updatedPlacement
              : c
          ),
        });
        this.notifyStateChange();
        return { fromTrack, fromTick };
      },
      undo: ({ fromTrack: ft, fromTick: fti }) => {
        this.state = Object.freeze({
          ...this.state,
          clips: this.state.clips.map(c =>
            c.trackIndex === toTrack && c.startTick === snappedTick
              ? { ...c, trackIndex: ft, startTick: fti }
              : c
          ),
        });
        this.notifyStateChange();
      },
      redo: () => {
        this.state = Object.freeze({
          ...this.state,
          clips: this.state.clips.map(c =>
            c.trackIndex === fromTrack && c.startTick === fromTick
              ? updatedPlacement
              : c
          ),
        });
        this.notifyStateChange();
      },
    });
  }

  /**
   * Duplicates a clip placement.
   */
  duplicateClipPlacement(
    trackIndex: number,
    startTick: Tick,
    toTrack: number,
    toTick: Tick
  ): void {
    const placement = this.state.clips.find(
      c => c.trackIndex === trackIndex && c.startTick === startTick
    );
    if (!placement) return;

    this.placeClip(
      placement.clipId,
      toTrack,
      this.snapTick(toTick),
      {
        displayLength: placement.displayLength,
        clipOffset: placement.clipOffset,
        muted: placement.muted,
        gain: placement.gain,
        fadeIn: placement.fadeIn,
        fadeOut: placement.fadeOut,
      }
    );
  }

  /**
   * Resizes a clip placement (changes display length).
   */
  resizeClipPlacement(
    trackIndex: number,
    startTick: Tick,
    newLength: TickDuration
  ): void {
    const placement = this.state.clips.find(
      c => c.trackIndex === trackIndex && c.startTick === startTick
    );
    if (!placement) return;

    const snappedLength = this.snapDuration(newLength);

    this.state = Object.freeze({
      ...this.state,
      clips: this.state.clips.map(c =>
        c.trackIndex === trackIndex && c.startTick === startTick
          ? { ...c, displayLength: snappedLength }
          : c
      ),
    });
    this.notifyStateChange();
  }

  // ==========================================================================
  // MARKER OPERATIONS
  // ==========================================================================

  /**
   * Adds a marker.
   */
  addMarker(tick: Tick, name: string, type: ArrangementMarker['type'] = 'marker'): void {
    const marker: ArrangementMarker = {
      id: `marker-${Date.now()}`,
      tick: this.snapTick(tick),
      name,
      type,
    };

    this.state = Object.freeze({
      ...this.state,
      markers: [...this.state.markers, marker].sort((a, b) =>
        (a.tick as number) - (b.tick as number)
      ),
    });
    this.notifyStateChange();
  }

  /**
   * Removes a marker.
   */
  removeMarker(markerId: string): void {
    this.state = Object.freeze({
      ...this.state,
      markers: this.state.markers.filter(m => m.id !== markerId),
    });
    this.notifyStateChange();
  }

  /**
   * Moves a marker.
   */
  moveMarker(markerId: string, newTick: Tick): void {
    this.state = Object.freeze({
      ...this.state,
      markers: this.state.markers.map(m =>
        m.id === markerId ? { ...m, tick: this.snapTick(newTick) } : m
      ).sort((a, b) => (a.tick as number) - (b.tick as number)),
    });
    this.notifyStateChange();
  }

  /**
   * Sets loop region from markers.
   */
  setLoopFromMarkers(startMarkerId: string, endMarkerId: string): void {
    const startMarker = this.state.markers.find(m => m.id === startMarkerId);
    const endMarker = this.state.markers.find(m => m.id === endMarkerId);

    if (startMarker && endMarker) {
      this.state = Object.freeze({
        ...this.state,
        loopRegion: {
          start: startMarker.tick,
          end: endMarker.tick,
        },
      });
      this.notifyStateChange();
    }
  }

  // ==========================================================================
  // SELECTION
  // ==========================================================================

  /**
   * Selects a clip.
   */
  selectClip(trackIndex: number, startTick: Tick, addToSelection: boolean = false): void {
    const placementId = `${trackIndex}-${startTick}`;

    let selectedClips: string[];
    if (addToSelection) {
      selectedClips = [...this.state.selectedClips, placementId];
    } else {
      selectedClips = [placementId];
    }

    const clips = this.state.clips.map(c => ({
      ...c,
      selected: selectedClips.includes(`${c.trackIndex}-${c.startTick}`),
    }));

    this.state = Object.freeze({
      ...this.state,
      clips,
      selectedClips,
    });
    this.notifyStateChange();
  }

  /**
   * Clears selection.
   */
  clearSelection(): void {
    const clips = this.state.clips.map(c => ({ ...c, selected: false }));

    this.state = Object.freeze({
      ...this.state,
      clips,
      selectedClips: [],
      selectedMarkers: [],
    });
    this.notifyStateChange();
  }

  /**
   * Selects clips in range.
   */
  selectClipsInRange(startTick: Tick, endTick: Tick, trackStart: number, trackEnd: number): void {
    const selectedClips: string[] = [];

    const clips = this.state.clips.map(c => {
      const clipEnd = (c.startTick as number) + (c.displayLength as number);
      const inRange =
        c.trackIndex >= trackStart &&
        c.trackIndex <= trackEnd &&
        clipEnd > (startTick as number) &&
        (c.startTick as number) < (endTick as number);

      if (inRange) {
        selectedClips.push(`${c.trackIndex}-${c.startTick}`);
      }

      return { ...c, selected: inRange };
    });

    this.state = Object.freeze({
      ...this.state,
      clips,
      selectedClips,
    });
    this.notifyStateChange();
  }

  /**
   * Deletes selected clips.
   */
  deleteSelection(): void {
    const remainingClips = this.state.clips.filter(c => !c.selected);

    this.state = Object.freeze({
      ...this.state,
      clips: remainingClips,
      selectedClips: [],
    });
    this.notifyStateChange();
  }

  // ==========================================================================
  // VIEW OPERATIONS
  // ==========================================================================

  /**
   * Sets zoom level.
   */
  setZoom(pixelsPerTick: number): void {
    this.state = Object.freeze({
      ...this.state,
      zoomX: Math.max(0.01, Math.min(2, pixelsPerTick)),
    });
    this.updateVisibleRange();
    this.notifyStateChange();
  }

  /**
   * Scrolls horizontally.
   */
  scrollHorizontal(deltaTicks: number): void {
    const newX = Math.max(0, (this.state.scrollX as number) + deltaTicks);
    this.state = Object.freeze({
      ...this.state,
      scrollX: asTick(newX),
    });
    this.updateVisibleRange();
    this.notifyStateChange();
  }

  /**
   * Scrolls vertically.
   */
  scrollVertical(deltaPixels: number): void {
    const newY = Math.max(0, this.state.scrollY + deltaPixels);
    this.state = Object.freeze({
      ...this.state,
      scrollY: newY,
    });
    this.notifyStateChange();
  }

  /**
   * Updates visible range based on scroll and zoom.
   */
  private updateVisibleRange(): void {
    const viewportWidth = 1000; // Assume 1000px viewport
    const ticksVisible = viewportWidth / this.state.zoomX;

    this.state = Object.freeze({
      ...this.state,
      visibleRange: {
        start: this.state.scrollX,
        end: asTick((this.state.scrollX as number) + ticksVisible),
      },
    });
  }

  /**
   * Sets playhead position.
   */
  setPlayhead(tick: Tick): void {
    this.state = Object.freeze({
      ...this.state,
      playhead: tick,
    });
    this.notifyStateChange();
  }

  /**
   * Sets loop region.
   */
  setLoopRegion(start: Tick, end: Tick): void {
    this.state = Object.freeze({
      ...this.state,
      loopRegion: { start, end },
    });
    this.notifyStateChange();
  }

  /**
   * Toggles loop enabled.
   */
  toggleLoop(): void {
    this.state = Object.freeze({
      ...this.state,
      loopEnabled: !this.state.loopEnabled,
    });
    this.notifyStateChange();
  }

  /**
   * Sets snap resolution.
   */
  setSnapResolution(resolution: TickDuration): void {
    this.state = Object.freeze({
      ...this.state,
      snapResolution: resolution,
    });
    this.notifyStateChange();
  }

  /**
   * Toggles snap.
   */
  toggleSnap(): void {
    this.state = Object.freeze({
      ...this.state,
      snapEnabled: !this.state.snapEnabled,
    });
    this.notifyStateChange();
  }

  /**
   * Sets edit mode.
   */
  setEditMode(mode: ArrangementState['editMode']): void {
    this.state = Object.freeze({
      ...this.state,
      editMode: mode,
    });
    this.notifyStateChange();
  }

  // ==========================================================================
  // TRACK OPERATIONS
  // ==========================================================================

  /**
   * Sets track mute.
   */
  setTrackMute(trackIndex: number, muted: boolean): void {
    const tracks = [...this.state.tracks];
    const existing = tracks[trackIndex];
    if (!existing) return;
    tracks[trackIndex] = { ...existing, muted };

    this.state = Object.freeze({ ...this.state, tracks });
    this.notifyStateChange();
  }

  /**
   * Sets track solo.
   */
  setTrackSolo(trackIndex: number, soloed: boolean): void {
    const tracks = [...this.state.tracks];
    const existing = tracks[trackIndex];
    if (!existing) return;
    tracks[trackIndex] = { ...existing, soloed };

    this.state = Object.freeze({ ...this.state, tracks });
    this.notifyStateChange();
  }

  /**
   * Sets track height.
   */
  setTrackHeight(trackIndex: number, height: number): void {
    const tracks = [...this.state.tracks];
    const existing = tracks[trackIndex];
    if (!existing) return;
    tracks[trackIndex] = { ...existing, height: Math.max(40, Math.min(200, height)) };

    this.state = Object.freeze({ ...this.state, tracks });
    this.notifyStateChange();
  }

  // ==========================================================================
  // SNAP HELPERS
  // ==========================================================================

  private snapTick(tick: Tick): Tick {
    if (!this.state.snapEnabled) return tick;
    const res = this.state.snapResolution as number;
    return asTick(Math.round((tick as number) / res) * res);
  }

  private snapDuration(duration: TickDuration): TickDuration {
    if (!this.state.snapEnabled) return duration;
    const res = this.state.snapResolution as number;
    return asTickDuration(Math.max(res, Math.round((duration as number) / res) * res));
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.registrySubscriptionId) {
      getClipRegistry().unsubscribe(this.registrySubscriptionId);
    }

    this.stateSubscriptions.clear();
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Creates an ArrangementAdapter.
 */
export function createArrangementAdapter(options?: ArrangementAdapterOptions): ArrangementAdapter {
  return new ArrangementAdapter(options);
}
