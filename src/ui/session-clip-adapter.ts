/**
 * @fileoverview Session View Clip Registry Adapter - Connects Session to shared clips.
 * 
 * This adapter bridges the Session view to the ClipRegistry, enabling:
 * - Clips shared between Session and Arrangement views
 * - Reference by ID instead of duplicating clip data
 * - Real-time sync when clips are edited in either view
 * 
 * @module @cardplay/ui/session-clip-adapter
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase E.1
 */

import type { Event } from '../types/event';
import type { Tick } from '../types/primitives';
import { asTickDuration } from '../types/primitives';
import type {
  EventStreamId,
  ClipId,
  ClipRecord,
  SubscriptionId,
} from '../state/types';
import {
  getSharedEventStore,
  getClipRegistry,
} from '../state';
import type { ClipSlotState, GridPosition, TrackHeader, SceneHeader } from './session-view';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Session clip slot with ClipRegistry reference.
 */
export interface SessionSlot {
  /** Grid position */
  readonly position: GridPosition;
  /** Clip ID in registry (undefined = empty slot) */
  readonly clipId?: ClipId;
  /** Current slot state */
  readonly state: ClipSlotState;
  /** Whether slot is selected */
  readonly selected: boolean;
  /** Display color (from clip or track) */
  readonly color?: string;
  /** Display name (from clip) */
  readonly name?: string;
}

/**
 * Session state using ClipRegistry.
 */
export interface SessionSharedState {
  /** Number of tracks */
  readonly trackCount: number;
  /** Number of scenes */
  readonly sceneCount: number;
  /** Track headers */
  readonly tracks: readonly TrackHeader[];
  /** Scene headers */
  readonly scenes: readonly SceneHeader[];
  /** Clip slots (track x scene grid) */
  readonly slots: readonly (readonly SessionSlot[])[];
  /** Currently playing scene index */
  readonly playingScene: number | null;
  /** Queued scene index */
  readonly queuedScene: number | null;
  /** Selected slots */
  readonly selectedSlots: readonly GridPosition[];
}

/**
 * Callback for session state changes.
 */
export type SessionStateCallback = (state: SessionSharedState) => void;

/**
 * Options for creating session adapter.
 */
export interface SessionAdapterOptions {
  /** Initial track count */
  trackCount?: number;
  /** Initial scene count */
  sceneCount?: number;
  /** Track configurations */
  tracks?: readonly Partial<TrackHeader>[];
  /** Scene configurations */
  scenes?: readonly Partial<SceneHeader>[];
}

// ============================================================================
// SESSION CLIP ADAPTER
// ============================================================================

/**
 * SessionClipAdapter connects Session view to ClipRegistry.
 * 
 * Usage:
 * ```typescript
 * const session = new SessionClipAdapter({ trackCount: 8, sceneCount: 8 });
 * 
 * // Create a clip in registry
 * const clipId = session.createClip('track-1-stream', 0, 4);
 * 
 * // Assign clip to slot
 * session.assignClipToSlot(clipId, { trackIndex: 0, sceneIndex: 0 });
 * 
 * // Subscribe to changes
 * session.subscribe((state) => {
 *   renderSessionGrid(state);
 * });
 * 
 * // Launch scene
 * session.launchScene(0);
 * 
 * session.dispose();
 * ```
 */
export class SessionClipAdapter {
  private state: SessionSharedState;
  private stateSubscriptions = new Set<SessionStateCallback>();
  private registrySubscriptionId: SubscriptionId | null = null;
  private clipSubscriptionIds = new Map<ClipId, SubscriptionId>();
  private disposed = false;

  constructor(options: SessionAdapterOptions = {}) {
    const trackCount = options.trackCount ?? 8;
    const sceneCount = options.sceneCount ?? 8;

    // Create track headers
    const tracks: TrackHeader[] = [];
    for (let i = 0; i < trackCount; i++) {
      const trackConfig = options.tracks?.[i] ?? {};
      tracks.push({
        trackIndex: i,
        name: trackConfig.name ?? `Track ${i + 1}`,
        ...(trackConfig.color !== undefined && { color: trackConfig.color }),
        muted: trackConfig.muted ?? false,
        soloed: trackConfig.soloed ?? false,
        armed: trackConfig.armed ?? false,
        volume: trackConfig.volume ?? 1.0,
        pan: trackConfig.pan ?? 0,
      });
    }

    // Create scene headers
    const scenes: SceneHeader[] = [];
    for (let i = 0; i < sceneCount; i++) {
      const sceneConfig = options.scenes?.[i] ?? {};
      scenes.push({
        sceneIndex: i,
        name: sceneConfig.name ?? `Scene ${i + 1}`,
        ...(sceneConfig.color !== undefined && { color: sceneConfig.color }),
        ...(sceneConfig.tempo !== undefined && { tempo: sceneConfig.tempo }),
        ...(sceneConfig.timeSignature !== undefined && { timeSignature: sceneConfig.timeSignature }),
      });
    }

    // Create empty slot grid
    const slots: SessionSlot[][] = [];
    for (let t = 0; t < trackCount; t++) {
      const trackSlots: SessionSlot[] = [];
      for (let s = 0; s < sceneCount; s++) {
        trackSlots.push({
          position: { trackIndex: t, sceneIndex: s },
          state: 'empty',
          selected: false,
        });
      }
      slots.push(trackSlots);
    }

    this.state = Object.freeze({
      trackCount,
      sceneCount,
      tracks,
      scenes,
      slots: slots.map(row => Object.freeze([...row])),
      playingScene: null,
      queuedScene: null,
      selectedSlots: [],
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

  /**
   * Gets current state.
   */
  getState(): any {
    // Some integration tests expect a flat `slots` array.
    const flatSlots = this.state.slots.flatMap(trackSlots => [...trackSlots]);
    return Object.freeze({
      ...this.state,
      slots: flatSlots,
      slotGrid: this.state.slots,
    });
  }

  /**
   * Gets slot at position.
   */
  getSlot(position: GridPosition): SessionSlot | undefined {
    return this.state.slots[position.trackIndex]?.[position.sceneIndex];
  }

  /**
   * Gets clip record from registry.
   */
  getClip(clipId: ClipId): ClipRecord | undefined {
    return getClipRegistry().getClip(clipId);
  }

  /**
   * Gets clip events from shared store.
   */
  getClipEvents(clipId: ClipId): readonly Event<unknown>[] {
    const clip = this.getClip(clipId);
    if (!clip) return [];

    const store = getSharedEventStore();
    const allEvents = store.getStream(clip.streamId)?.events ?? [];

    // Filter events within clip range
    return allEvents.filter(e =>
      e.start >= clip.startTick && e.start < (clip.startTick + clip.lengthTicks)
    );
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  /**
   * Subscribes to state changes.
   */
  subscribe(callback: SessionStateCallback): () => void {
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
        console.error('Session state callback error:', e);
      }
    }
  }

  /**
   * Refreshes clip data from registry.
   */
  private refreshClipData(): void {
    const registry = getClipRegistry();
    const slots = this.state.slots.map((trackSlots) =>
      trackSlots.map((slot) => {
        if (!slot.clipId) return slot;

        const clip = registry.getClip(slot.clipId);
        if (!clip) {
          return {
            position: slot.position,
            state: 'empty' as ClipSlotState,
            selected: slot.selected,
          };
        }

        const { name: _name, color: _color, ...rest } = slot;
        return {
          ...rest,
          name: clip.name,
          ...(clip.color !== undefined && { color: clip.color }),
        };
      })
    );

    this.state = Object.freeze({
      ...this.state,
      slots: slots.map(row => Object.freeze([...row])),
    });
    this.notifyStateChange();
  }

  // ==========================================================================
  // CLIP OPERATIONS
  // ==========================================================================

  /**
   * Creates a new clip in the registry.
   */
  createClip(
    streamId: EventStreamId,
    startTick: Tick,
    lengthBars: number,
    options: {
      name?: string;
      color?: string;
      ticksPerBar?: number;
    } = {}
  ): ClipId {
    const registry = getClipRegistry();
    const ticksPerBar = options.ticksPerBar ?? 1920; // Default 4/4 at 480 TPQ
    const lengthTicks = asTickDuration(lengthBars * ticksPerBar);

    return registry.createClip(
      streamId,
      startTick,
      lengthTicks,
      options.name,
      options.color
    );
  }

  /**
   * Assigns a clip to a slot.
   */
  assignClipToSlot(clipId: ClipId, position: GridPosition): void {
    const { trackIndex, sceneIndex } = position;
    const slot = this.getSlot(position);

    if (!slot) return;

    // Update slot
    const slots = [...this.state.slots];
    const existingTrackSlots = slots[trackIndex];
    if (!existingTrackSlots) return;
    const trackSlots = [...existingTrackSlots];
    trackSlots[sceneIndex] = {
      ...slot,
      clipId,
      state: 'filled',
    };
    slots[trackIndex] = Object.freeze(trackSlots);

    this.state = Object.freeze({
      ...this.state,
      slots: slots.map(row => Object.freeze([...row])),
    });

    this.refreshClipData();
  }

  /**
   * Legacy helper used by integration tests: place a clip by (trackIndex, sceneIndex).
   */
  placeClip(clipId: ClipId, trackIndex: number, sceneIndex: number): void {
    this.assignClipToSlot(clipId, { trackIndex, sceneIndex });
  }

  /**
   * Clears a clip from a slot.
   */
  clearSlot(position: GridPosition): void {
    const { trackIndex, sceneIndex } = position;
    const slot = this.getSlot(position);

    if (!slot || !slot.clipId) return;

    const slots = [...this.state.slots];
    const existingTrackSlots = slots[trackIndex];
    if (!existingTrackSlots) return;
    const trackSlots = [...existingTrackSlots];
    trackSlots[sceneIndex] = {
      position,
      state: 'empty',
      selected: slot.selected,
    };
    slots[trackIndex] = Object.freeze(trackSlots);

    this.state = Object.freeze({
      ...this.state,
      slots: slots.map(row => Object.freeze([...row])),
    });
    this.notifyStateChange();
  }

  /**
   * Duplicates a clip to another slot.
   */
  duplicateClipToSlot(fromPosition: GridPosition, toPosition: GridPosition): void {
    const fromSlot = this.getSlot(fromPosition);
    if (!fromSlot?.clipId) return;

    const registry = getClipRegistry();
    const sourceClip = registry.getClip(fromSlot.clipId);
    if (!sourceClip) return;

    // Create duplicate clip
    const newClipId = registry.createClip(
      sourceClip.streamId,
      sourceClip.startTick,
      sourceClip.lengthTicks,
      `${sourceClip.name} (copy)`,
      sourceClip.color
    );

    this.assignClipToSlot(newClipId, toPosition);
  }

  /**
   * Moves a clip between slots.
   */
  moveClip(fromPosition: GridPosition, toPosition: GridPosition): void {
    const fromSlot = this.getSlot(fromPosition);
    if (!fromSlot?.clipId) return;

    const clipId = fromSlot.clipId;
    this.clearSlot(fromPosition);
    this.assignClipToSlot(clipId, toPosition);
  }

  // ==========================================================================
  // LAUNCH OPERATIONS
  // ==========================================================================

  /**
   * Launches a clip at position.
   */
  launchClip(position: GridPosition): void {
    const slot = this.getSlot(position);
    if (!slot?.clipId) return;

    this.updateSlotState(position, 'playing');

    // Stop other clips in same track
    for (let s = 0; s < this.state.sceneCount; s++) {
      if (s !== position.sceneIndex) {
        const otherSlot = this.getSlot({ trackIndex: position.trackIndex, sceneIndex: s });
        if (otherSlot?.state === 'playing') {
          this.updateSlotState({ trackIndex: position.trackIndex, sceneIndex: s }, 'filled');
        }
      }
    }
  }

  /**
   * Stops a clip at position.
   */
  stopClip(position: GridPosition): void {
    const slot = this.getSlot(position);
    if (!slot?.clipId) return;

    this.updateSlotState(position, 'filled');
  }

  /**
   * Launches all clips in a scene.
   */
  launchScene(sceneIndex: number): void {
    for (let t = 0; t < this.state.trackCount; t++) {
      const slot = this.getSlot({ trackIndex: t, sceneIndex });
      if (slot?.clipId) {
        this.launchClip({ trackIndex: t, sceneIndex });
      }
    }

    this.state = Object.freeze({
      ...this.state,
      playingScene: sceneIndex,
      queuedScene: null,
    });
    this.notifyStateChange();
  }

  /**
   * Stops all clips.
   */
  stopAll(): void {
    for (let t = 0; t < this.state.trackCount; t++) {
      for (let s = 0; s < this.state.sceneCount; s++) {
        const slot = this.getSlot({ trackIndex: t, sceneIndex: s });
        if (slot?.state === 'playing') {
          this.updateSlotState({ trackIndex: t, sceneIndex: s }, 'filled');
        }
      }
    }

    this.state = Object.freeze({
      ...this.state,
      playingScene: null,
      queuedScene: null,
    });
    this.notifyStateChange();
  }

  /**
   * Updates slot state.
   */
  private updateSlotState(position: GridPosition, state: ClipSlotState): void {
    const { trackIndex, sceneIndex } = position;
    const slot = this.getSlot(position);
    if (!slot) return;

    const slots = [...this.state.slots];
    const existingTrackSlots = slots[trackIndex];
    if (!existingTrackSlots) return;
    const trackSlots = [...existingTrackSlots];
    trackSlots[sceneIndex] = { ...slot, state };
    slots[trackIndex] = Object.freeze(trackSlots);

    this.state = Object.freeze({
      ...this.state,
      slots: slots.map(row => Object.freeze([...row])),
    });
    this.notifyStateChange();
  }

  // ==========================================================================
  // SELECTION OPERATIONS
  // ==========================================================================

  /**
   * Selects a slot.
   */
  selectSlot(position: GridPosition, addToSelection: boolean = false): void {
    const slot = this.getSlot(position);
    if (!slot) return;

    let selectedSlots: GridPosition[];
    if (addToSelection) {
      selectedSlots = [...this.state.selectedSlots, position];
    } else {
      selectedSlots = [position];
    }

    // Update slot selected states
    const slots = this.state.slots.map((trackSlots, t) =>
      trackSlots.map((s, sceneIndex) => ({
        ...s,
        selected: selectedSlots.some(p => p.trackIndex === t && p.sceneIndex === sceneIndex),
      }))
    );

    this.state = Object.freeze({
      ...this.state,
      slots: slots.map(row => Object.freeze([...row])),
      selectedSlots,
    });
    this.notifyStateChange();
  }

  /**
   * Clears selection.
   */
  clearSelection(): void {
    const slots = this.state.slots.map(trackSlots =>
      trackSlots.map(slot => ({ ...slot, selected: false }))
    );

    this.state = Object.freeze({
      ...this.state,
      slots: slots.map(row => Object.freeze([...row])),
      selectedSlots: [],
    });
    this.notifyStateChange();
  }

  /**
   * Selects slots in rectangle.
   */
  selectRange(from: GridPosition, to: GridPosition): void {
    const minTrack = Math.min(from.trackIndex, to.trackIndex);
    const maxTrack = Math.max(from.trackIndex, to.trackIndex);
    const minScene = Math.min(from.sceneIndex, to.sceneIndex);
    const maxScene = Math.max(from.sceneIndex, to.sceneIndex);

    const selectedSlots: GridPosition[] = [];
    for (let t = minTrack; t <= maxTrack; t++) {
      for (let s = minScene; s <= maxScene; s++) {
        selectedSlots.push({ trackIndex: t, sceneIndex: s });
      }
    }

    const slots = this.state.slots.map((trackSlots, t) =>
      trackSlots.map((slot, s) => ({
        ...slot,
        selected: t >= minTrack && t <= maxTrack && s >= minScene && s <= maxScene,
      }))
    );

    this.state = Object.freeze({
      ...this.state,
      slots: slots.map(row => Object.freeze([...row])),
      selectedSlots,
    });
    this.notifyStateChange();
  }

  // ==========================================================================
  // TRACK OPERATIONS
  // ==========================================================================

  /**
   * Sets track mute state.
   */
  setTrackMute(trackIndex: number, muted: boolean): void {
    const tracks = [...this.state.tracks];
    const existing = tracks[trackIndex];
    if (!existing) return;
    tracks[trackIndex] = { ...existing, muted };

    this.state = Object.freeze({
      ...this.state,
      tracks,
    });
    this.notifyStateChange();
  }

  /**
   * Sets track solo state.
   */
  setTrackSolo(trackIndex: number, soloed: boolean): void {
    const tracks = [...this.state.tracks];
    const existing = tracks[trackIndex];
    if (!existing) return;
    tracks[trackIndex] = { ...existing, soloed };

    this.state = Object.freeze({
      ...this.state,
      tracks,
    });
    this.notifyStateChange();
  }

  /**
   * Sets track armed state.
   */
  setTrackArmed(trackIndex: number, armed: boolean): void {
    const tracks = [...this.state.tracks];
    const existing = tracks[trackIndex];
    if (!existing) return;
    tracks[trackIndex] = { ...existing, armed };

    this.state = Object.freeze({
      ...this.state,
      tracks,
    });
    this.notifyStateChange();
  }

  /**
   * Sets track volume.
   */
  setTrackVolume(trackIndex: number, volume: number): void {
    const tracks = [...this.state.tracks];
    const existing = tracks[trackIndex];
    if (!existing) return;
    tracks[trackIndex] = { ...existing, volume: Math.max(0, Math.min(2, volume)) };

    this.state = Object.freeze({
      ...this.state,
      tracks,
    });
    this.notifyStateChange();
  }

  /**
   * Sets track pan.
   */
  setTrackPan(trackIndex: number, pan: number): void {
    const tracks = [...this.state.tracks];
    const existing = tracks[trackIndex];
    if (!existing) return;
    tracks[trackIndex] = { ...existing, pan: Math.max(-1, Math.min(1, pan)) };

    this.state = Object.freeze({
      ...this.state,
      tracks,
    });
    this.notifyStateChange();
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  /**
   * Disposes adapter.
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.registrySubscriptionId) {
      getClipRegistry().unsubscribe(this.registrySubscriptionId);
    }

    for (const subId of this.clipSubscriptionIds.values()) {
      getSharedEventStore().unsubscribe(subId);
    }

    this.stateSubscriptions.clear();
    this.clipSubscriptionIds.clear();
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Creates a SessionClipAdapter.
 */
export function createSessionAdapter(options?: SessionAdapterOptions): SessionClipAdapter {
  return new SessionClipAdapter(options);
}

/** @deprecated legacy export name */
export function createSessionClipAdapter(options?: SessionAdapterOptions): SessionClipAdapter {
  return new SessionClipAdapter(options);
}

/** @deprecated legacy type name */
export type SessionScene = SceneHeader;
