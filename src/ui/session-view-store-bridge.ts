/**
 * @fileoverview Session View ↔ ClipRegistry Bridge.
 * 
 * Connects the Session View (Ableton-like clip grid) to the unified
 * ClipRegistry and SharedEventStore system.
 * 
 * Key responsibilities:
 * - Sync ClipSlot state with ClipRegistry
 * - Map session grid positions to clip IDs
 * - Handle clip launching through the store
 * - Sync playback state with Transport
 * - Manage scene launching
 * 
 * @module @cardplay/ui/session-view-store-bridge
 */

import { asTick } from '../types/primitives';
import type { 
  EventStreamId, 
  ClipId, 
  SubscriptionId,
  ClipRecord 
} from '../state/types';
import { 
  getSharedEventStore, 
  getClipRegistry, 
  getSelectionStore,
} from '../state';
import { getTransport, type TransportSnapshot } from '../audio/transport';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Session track configuration.
 */
export interface SessionTrackConfig {
  readonly id: string;
  readonly name: string;
  readonly color?: string;
  readonly armed: boolean;
  readonly muted: boolean;
  readonly soloed: boolean;
  readonly volume: number;
  readonly pan: number;
}

/**
 * Session scene configuration.
 */
export interface SessionSceneConfig {
  readonly id: string;
  readonly name: string;
  readonly tempo?: number;
  readonly timeSignature?: { numerator: number; denominator: number };
}

/**
 * Grid position in session view.
 */
export interface SessionGridPosition {
  readonly trackIndex: number;
  readonly sceneIndex: number;
}

/**
 * Clip slot state synced with registry.
 */
export interface SyncedClipSlot {
  readonly position: SessionGridPosition;
  readonly clipId: ClipId | null;
  readonly streamId: EventStreamId | null;
  readonly state: 'empty' | 'stopped' | 'playing' | 'queued' | 'recording';
  readonly name: string;
  readonly color: string;
  readonly length: number;  // In ticks
  readonly loopEnabled: boolean;
}

/**
 * Session state synced with stores.
 */
export interface SyncedSessionState {
  readonly tracks: readonly SessionTrackConfig[];
  readonly scenes: readonly SessionSceneConfig[];
  readonly slots: ReadonlyMap<string, SyncedClipSlot>;  // key: "track:scene"
  readonly playingClips: ReadonlySet<ClipId>;
  readonly queuedClips: ReadonlySet<ClipId>;
  readonly selectedSlots: ReadonlySet<string>;
  readonly focusedSlot: string | null;
}

/**
 * Bridge configuration.
 */
export interface SessionViewBridgeConfig {
  /** Number of tracks */
  readonly trackCount: number;
  /** Number of scenes */
  readonly sceneCount: number;
  /** Default clip length in ticks */
  readonly defaultClipLength: number;
  /** Quantization for clip launch (in ticks, 0 = immediate) */
  readonly launchQuantization: number;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: SessionViewBridgeConfig = {
  trackCount: 8,
  sceneCount: 8,
  defaultClipLength: 1920,  // 1 bar at 480 PPQ
  launchQuantization: 1920, // Quantize to bar
};

// ============================================================================
// SESSION VIEW STORE BRIDGE
// ============================================================================

/**
 * SessionViewStoreBridge - Connects Session View to unified stores.
 */
export class SessionViewStoreBridge {
  private config: SessionViewBridgeConfig;
  private tracks: SessionTrackConfig[] = [];
  private scenes: SessionSceneConfig[] = [];
  private slotToClip: Map<string, ClipId> = new Map();  // "track:scene" -> ClipId
  private clipToSlot: Map<ClipId, string> = new Map();  // ClipId -> "track:scene"
  
  private playingClips: Set<ClipId> = new Set();
  private queuedClips: Set<ClipId> = new Set();
  private recordingClips: Set<ClipId> = new Set();
  
  private registrySubscriptionId: SubscriptionId | null = null;
  private transportSubscription: (() => void) | null = null;
  private subscribers: Set<(state: SyncedSessionState) => void> = new Set();
  
  constructor(config: Partial<SessionViewBridgeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeTracks();
    this.initializeScenes();
  }
  
  // ========== INITIALIZATION ==========
  
  /**
   * Initialize the bridge and connect to stores.
   */
  initialize(): void {
    // Subscribe to clip registry changes
    const registry = getClipRegistry();
    this.registrySubscriptionId = registry.subscribeAll(() => this.syncFromRegistry());
    
    // Subscribe to transport changes
    const transport = getTransport();
    this.transportSubscription = transport.subscribe((state) => {
      this.handleTransportChange(state);
    });
    
    // Initial sync
    this.syncFromRegistry();
  }
  
  /**
   * Dispose the bridge.
   */
  dispose(): void {
    if (this.registrySubscriptionId) {
      getClipRegistry().unsubscribe(this.registrySubscriptionId);
      this.registrySubscriptionId = null;
    }
    if (this.transportSubscription) {
      this.transportSubscription();
      this.transportSubscription = null;
    }
    this.subscribers.clear();
  }
  
  private initializeTracks(): void {
    this.tracks = [];
    for (let i = 0; i < this.config.trackCount; i++) {
      this.tracks.push({
        id: `track-${i}`,
        name: `Track ${i + 1}`,
        armed: false,
        muted: false,
        soloed: false,
        volume: 1,
        pan: 0,
      });
    }
  }
  
  private initializeScenes(): void {
    this.scenes = [];
    for (let i = 0; i < this.config.sceneCount; i++) {
      this.scenes.push({
        id: `scene-${i}`,
        name: `Scene ${i + 1}`,
      });
    }
  }
  
  // ========== CLIP SLOT OPERATIONS ==========
  
  /**
   * Create a new clip at a grid position.
   */
  createClip(position: SessionGridPosition, name?: string): ClipId {
    const slotKey = this.positionToKey(position);
    
    // Create event stream
    const store = getSharedEventStore();
    const streamId = store.createStream({
      name: `session-${position.trackIndex + 1}-${position.sceneIndex + 1}`,
      events: [],
    }).id;
    
    // Create clip record
    const registry = getClipRegistry();
    const clip = registry.createClip({
      streamId,
      name: name ?? `Clip ${position.trackIndex + 1}-${position.sceneIndex + 1}`,
      color: this.tracks[position.trackIndex]?.color ?? '#4a90d9',
      duration: asTick(this.config.defaultClipLength),
      loop: true,
    });
    const clipId = clip.id;
    
    // Map slot to clip
    this.slotToClip.set(slotKey, clipId);
    this.clipToSlot.set(clipId, slotKey);
    
    this.notifySubscribers();
    return clipId;
  }
  
  /**
   * Assign an existing clip to a grid position.
   */
  assignClip(position: SessionGridPosition, clipId: ClipId): void {
    const slotKey = this.positionToKey(position);
    
    // Remove from previous slot if any
    const prevSlot = this.clipToSlot.get(clipId);
    if (prevSlot) {
      this.slotToClip.delete(prevSlot);
    }
    
    // Remove existing clip from this slot
    const prevClip = this.slotToClip.get(slotKey);
    if (prevClip) {
      this.clipToSlot.delete(prevClip);
    }
    
    // Assign new mapping
    this.slotToClip.set(slotKey, clipId);
    this.clipToSlot.set(clipId, slotKey);
    
    this.notifySubscribers();
  }
  
  /**
   * Remove clip from a grid position.
   */
  removeClip(position: SessionGridPosition): void {
    const slotKey = this.positionToKey(position);
    const clipId = this.slotToClip.get(slotKey);
    
    if (clipId) {
      this.slotToClip.delete(slotKey);
      this.clipToSlot.delete(clipId);
      
      // Stop if playing
      if (this.playingClips.has(clipId)) {
        this.stopClip(clipId);
      }
      
      this.notifySubscribers();
    }
  }
  
  /**
   * Get clip at a grid position.
   */
  getClipAt(position: SessionGridPosition): ClipRecord | null {
    const slotKey = this.positionToKey(position);
    const clipId = this.slotToClip.get(slotKey);
    
    if (clipId) {
      return getClipRegistry().getClip(clipId) ?? null;
    }
    return null;
  }
  
  /**
   * Get slot state for a position.
   */
  getSlotState(position: SessionGridPosition): SyncedClipSlot {
    const slotKey = this.positionToKey(position);
    const clipId = this.slotToClip.get(slotKey);
    
    if (!clipId) {
      return {
        position,
        clipId: null,
        streamId: null,
        state: 'empty',
        name: '',
        color: '#666666',
        length: 0,
        loopEnabled: false,
      };
    }
    
    const clip = getClipRegistry().getClip(clipId);
    if (!clip) {
      return {
        position,
        clipId: null,
        streamId: null,
        state: 'empty',
        name: '',
        color: '#666666',
        length: 0,
        loopEnabled: false,
      };
    }
    
    let state: SyncedClipSlot['state'] = 'stopped';
    if (this.playingClips.has(clipId)) state = 'playing';
    else if (this.queuedClips.has(clipId)) state = 'queued';
    else if (this.recordingClips.has(clipId)) state = 'recording';
    
    return {
      position,
      clipId,
      streamId: clip.streamId,
      state,
      name: clip.name,
      color: clip.color ?? '#4a90d9',
      length: clip.duration as number,
      loopEnabled: clip.loop,
    };
  }
  
  // ========== PLAYBACK CONTROL ==========
  
  /**
   * Launch a clip (queue for playback).
   */
  launchClip(clipId: ClipId): void {
    const clip = getClipRegistry().getClip(clipId);
    if (!clip) return;
    
    const transport = getTransport();
    const snapshot = transport.getSnapshot();
    
    if (this.config.launchQuantization === 0 || !snapshot.isPlaying) {
      // Immediate launch
      this.playingClips.add(clipId);
      this.queuedClips.delete(clipId);
    } else {
      // Queue for quantized launch
      this.queuedClips.add(clipId);
    }
    
    // Stop other clips on same track
    const slotKey = this.clipToSlot.get(clipId);
    if (slotKey) {
      const position = this.keyToPosition(slotKey);
      this.stopOtherClipsOnTrack(position.trackIndex, clipId);
    }
    
    this.notifySubscribers();
  }
  
  /**
   * Launch clip at grid position.
   */
  launchClipAt(position: SessionGridPosition): void {
    const clipId = this.slotToClip.get(this.positionToKey(position));
    if (clipId) {
      this.launchClip(clipId);
    }
  }
  
  /**
   * Stop a clip.
   */
  stopClip(clipId: ClipId): void {
    this.playingClips.delete(clipId);
    this.queuedClips.delete(clipId);
    this.notifySubscribers();
  }
  
  /**
   * Stop clip at grid position.
   */
  stopClipAt(position: SessionGridPosition): void {
    const clipId = this.slotToClip.get(this.positionToKey(position));
    if (clipId) {
      this.stopClip(clipId);
    }
  }
  
  /**
   * Launch a scene (all clips in a row).
   */
  launchScene(sceneIndex: number): void {
    for (let trackIndex = 0; trackIndex < this.tracks.length; trackIndex++) {
      const slotKey = this.positionToKey({ trackIndex, sceneIndex });
      const clipId = this.slotToClip.get(slotKey);
      
      if (clipId) {
        this.launchClip(clipId);
      } else {
        // Stop any playing clip on this track
        this.stopTrack(trackIndex);
      }
    }
  }
  
  /**
   * Stop all clips on a track.
   */
  stopTrack(trackIndex: number): void {
    for (let sceneIndex = 0; sceneIndex < this.scenes.length; sceneIndex++) {
      const slotKey = this.positionToKey({ trackIndex, sceneIndex });
      const clipId = this.slotToClip.get(slotKey);
      
      if (clipId) {
        this.stopClip(clipId);
      }
    }
  }
  
  /**
   * Stop all clips.
   */
  stopAll(): void {
    this.playingClips.clear();
    this.queuedClips.clear();
    this.notifySubscribers();
  }
  
  private stopOtherClipsOnTrack(trackIndex: number, exceptClipId: ClipId): void {
    for (let sceneIndex = 0; sceneIndex < this.scenes.length; sceneIndex++) {
      const slotKey = this.positionToKey({ trackIndex, sceneIndex });
      const clipId = this.slotToClip.get(slotKey);
      
      if (clipId && clipId !== exceptClipId) {
        this.playingClips.delete(clipId);
        this.queuedClips.delete(clipId);
      }
    }
  }
  
  // ========== TRACK OPERATIONS ==========
  
  /**
   * Update track configuration.
   */
  updateTrack(trackIndex: number, updates: Partial<SessionTrackConfig>): void {
    if (trackIndex < 0 || trackIndex >= this.tracks.length) return;
    
    const existing = this.tracks[trackIndex];
    if (!existing) return;

    const color = updates.color ?? existing.color;
    const next: SessionTrackConfig = {
      id: updates.id ?? existing.id,
      name: updates.name ?? existing.name,
      armed: updates.armed ?? existing.armed,
      muted: updates.muted ?? existing.muted,
      soloed: updates.soloed ?? existing.soloed,
      volume: updates.volume ?? existing.volume,
      pan: updates.pan ?? existing.pan,
    };
    this.tracks[trackIndex] = color !== undefined ? { ...next, color } : next;
    this.notifySubscribers();
  }
  
  /**
   * Add a new track.
   */
  addTrack(name?: string): number {
    const index = this.tracks.length;
    this.tracks.push({
      id: `track-${index}`,
      name: name ?? `Track ${index + 1}`,
      armed: false,
      muted: false,
      soloed: false,
      volume: 1,
      pan: 0,
    });
    this.notifySubscribers();
    return index;
  }
  
  /**
   * Add a new scene.
   */
  addScene(name?: string): number {
    const index = this.scenes.length;
    this.scenes.push({
      id: `scene-${index}`,
      name: name ?? `Scene ${index + 1}`,
    });
    this.notifySubscribers();
    return index;
  }
  
  // ========== STATE ==========
  
  /**
   * Get the full synced session state.
   */
  getState(): SyncedSessionState {
    const slots = new Map<string, SyncedClipSlot>();
    
    for (let trackIndex = 0; trackIndex < this.tracks.length; trackIndex++) {
      for (let sceneIndex = 0; sceneIndex < this.scenes.length; sceneIndex++) {
        const position = { trackIndex, sceneIndex };
        const slotKey = this.positionToKey(position);
        slots.set(slotKey, this.getSlotState(position));
      }
    }
    
    const selection = getSelectionStore();
    const selectedSlots = new Set<string>();
    // Map selected event IDs to their slots
    for (const [slotKey, clipId] of this.slotToClip) {
      if (clipId) {
        const clip = getClipRegistry().getClip(clipId);
        if (clip) {
          const stream = getSharedEventStore().getStream(clip.streamId);
          if (stream) {
            const hasSelected = stream.events.some(e => selection.isSelected(e.id));
            if (hasSelected) {
              selectedSlots.add(slotKey);
            }
          }
        }
      }
    }
    
    return {
      tracks: this.tracks,
      scenes: this.scenes,
      slots,
      playingClips: new Set(this.playingClips),
      queuedClips: new Set(this.queuedClips),
      selectedSlots,
      focusedSlot: null,
    };
  }
  
  /**
   * Subscribe to state changes.
   */
  subscribe(callback: (state: SyncedSessionState) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  // ========== INTERNAL ==========
  
  private syncFromRegistry(): void {
    // Registry changed - update any clip metadata
    this.notifySubscribers();
  }
  
  private handleTransportChange(state: TransportSnapshot): void {
    // Check for quantization triggers
    if (state.isPlaying && this.queuedClips.size > 0) {
      const currentTick = state.position as number;
      const quant = this.config.launchQuantization;
      
      if (quant > 0 && currentTick % quant < 10) {
        // Quantization point reached - launch queued clips
        for (const clipId of this.queuedClips) {
          this.playingClips.add(clipId);
        }
        this.queuedClips.clear();
        this.notifySubscribers();
      }
    }
  }
  
  private positionToKey(position: SessionGridPosition): string {
    return `${position.trackIndex}:${position.sceneIndex}`;
  }
  
  private keyToPosition(key: string): SessionGridPosition {
    const parts = key.split(':');
    const trackIndex = Number(parts[0] ?? 0);
    const sceneIndex = Number(parts[1] ?? 0);
    return { trackIndex, sceneIndex };
  }
  
  private notifySubscribers(): void {
    const state = this.getState();
    for (const callback of this.subscribers) {
      callback(state);
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let bridgeInstance: SessionViewStoreBridge | null = null;

/**
 * Get or create the singleton session view bridge.
 */
export function getSessionViewBridge(config?: Partial<SessionViewBridgeConfig>): SessionViewStoreBridge {
  if (!bridgeInstance) {
    bridgeInstance = new SessionViewStoreBridge(config);
    bridgeInstance.initialize();
  }
  return bridgeInstance;
}

/**
 * Reset the bridge (for testing).
 */
export function resetSessionViewBridge(): void {
  if (bridgeInstance) {
    bridgeInstance.dispose();
    bridgeInstance = null;
  }
}
