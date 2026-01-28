/**
 * @fileoverview Audio Engine ↔ SharedEventStore Bridge.
 * 
 * Connects the low-latency AudioWorklet engine to the SharedEventStore,
 * enabling the audio engine to consume events from the unified store and
 * schedule them for sample-accurate playback.
 * 
 * Key responsibilities:
 * - Subscribe to event streams and feed them to audio engine
 * - Convert Event<P> to AudioEvent format
 * - Handle transport sync (play/pause/seek)
 * - Manage lookahead scheduling from store events
 * 
 * @module @cardplay/audio/audio-engine-store-bridge
 */

import type { Event } from '../types/event';
import type { Tick } from '../types/primitives';
import { PPQ } from '../types/primitives';
import type { EventStreamId, ClipId, SubscriptionId } from '../state/types';
import { getSharedEventStore, getClipRegistry } from '../state';
import { getTransport, type TransportSnapshot } from './transport';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Audio event format expected by the audio engine.
 */
export interface AudioEngineEvent {
  readonly id: string;
  readonly type: 'noteOn' | 'noteOff' | 'cc' | 'pitchBend' | 'trigger' | 'custom';
  readonly time: number;        // Time in samples
  readonly priority: number;    // 0-10, higher = more important
  readonly data: {
    readonly pitch?: number;
    readonly velocity?: number;
    readonly channel?: number;
    readonly controller?: number;
    readonly value?: number;
    readonly duration?: number;
    readonly sourceStreamId?: string;
    [key: string]: unknown;
  };
}

/**
 * Bridge configuration.
 */
export interface AudioEngineBridgeConfig {
  /** Sample rate for time conversion */
  readonly sampleRate: number;
  /** Lookahead in milliseconds */
  readonly lookaheadMs: number;
  /** Maximum events to schedule per update */
  readonly maxEventsPerUpdate: number;
  /** Whether to auto-subscribe to all streams */
  readonly autoSubscribeAll: boolean;
}

/**
 * Stream subscription info.
 */
interface StreamSubscription {
  readonly streamId: EventStreamId;
  readonly subscriptionId: SubscriptionId;
  readonly channel: number;
  lastProcessedTick: number;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: AudioEngineBridgeConfig = {
  sampleRate: 48000,
  lookaheadMs: 50,
  maxEventsPerUpdate: 256,
  autoSubscribeAll: false,
};

// ============================================================================
// AUDIO ENGINE STORE BRIDGE
// ============================================================================

/**
 * AudioEngineStoreBridge - Connects SharedEventStore to AudioEngine.
 */
export class AudioEngineStoreBridge {
  private config: AudioEngineBridgeConfig;
  private subscriptions: Map<EventStreamId, StreamSubscription> = new Map();
  private pendingEvents: AudioEngineEvent[] = [];
  private isRunning = false;
  private updateInterval: number | null = null;
  
  // Callbacks to audio engine
  private scheduleEventCallback: ((event: AudioEngineEvent) => void) | null = null;
  private clearEventsCallback: (() => void) | null = null;
  
  // Transport state cache
  private lastTransportSnapshot: TransportSnapshot | null = null;
  private transportSubscription: (() => void) | null = null;
  
  constructor(config: Partial<AudioEngineBridgeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  // ========== INITIALIZATION ==========
  
  /**
   * Initialize the bridge with audio engine callbacks.
   */
  initialize(callbacks: {
    scheduleEvent: (event: AudioEngineEvent) => void;
    clearEvents: () => void;
  }): void {
    this.scheduleEventCallback = callbacks.scheduleEvent;
    this.clearEventsCallback = callbacks.clearEvents;
    
    // Subscribe to transport changes
    const transport = getTransport();
    this.transportSubscription = transport.subscribe((state) => {
      this.handleTransportChange(state);
    });
    
    this.lastTransportSnapshot = transport.getSnapshot();
  }
  
  /**
   * Dispose the bridge and clean up subscriptions.
   */
  dispose(): void {
    this.stop();
    
    // Unsubscribe from all streams
    const store = getSharedEventStore();
    for (const sub of this.subscriptions.values()) {
      store.unsubscribe(sub.subscriptionId);
    }
    this.subscriptions.clear();
    
    // Unsubscribe from transport
    if (this.transportSubscription) {
      this.transportSubscription();
      this.transportSubscription = null;
    }
    
    this.scheduleEventCallback = null;
    this.clearEventsCallback = null;
  }
  
  // ========== STREAM MANAGEMENT ==========
  
  /**
   * Subscribe to an event stream for audio playback.
   */
  subscribeToStream(streamId: EventStreamId, channel: number = 0): void {
    if (this.subscriptions.has(streamId)) return;
    
    const store = getSharedEventStore();
    const subscriptionId = store.subscribe(streamId, () => {
      this.handleStreamUpdate(streamId);
    });
    
    this.subscriptions.set(streamId, {
      streamId,
      subscriptionId,
      channel,
      lastProcessedTick: 0,
    });
    
    // Process existing events
    this.handleStreamUpdate(streamId);
  }
  
  /**
   * Unsubscribe from an event stream.
   */
  unsubscribeFromStream(streamId: EventStreamId): void {
    const sub = this.subscriptions.get(streamId);
    if (!sub) return;
    
    const store = getSharedEventStore();
    store.unsubscribe(sub.subscriptionId);
    this.subscriptions.delete(streamId);
  }
  
  /**
   * Subscribe to a clip's event stream.
   */
  subscribeToClip(clipId: ClipId, channel: number = 0): void {
    const clip = getClipRegistry().getClip(clipId);
    if (clip) {
      this.subscribeToStream(clip.streamId, channel);
    }
  }
  
  /**
   * Subscribe to all active streams.
   */
  subscribeToAllStreams(): void {
    const store = getSharedEventStore();
    const streamIds = store.getAllStreams().map(s => s.id);
    
    for (const streamId of streamIds) {
      if (!this.subscriptions.has(streamId)) {
        this.subscribeToStream(streamId, 0);
      }
    }
  }
  
  // ========== PLAYBACK CONTROL ==========
  
  /**
   * Start the bridge (begin scheduling events).
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Start update loop
    const updateMs = Math.max(5, this.config.lookaheadMs / 4);
    this.updateInterval = window.setInterval(() => {
      this.update();
    }, updateMs);
    
    // Initial update
    this.update();
  }
  
  /**
   * Stop the bridge.
   */
  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Clear pending events
    this.pendingEvents = [];
    this.clearEventsCallback?.();
  }
  
  /**
   * Seek to a specific tick position.
   */
  seek(tick: Tick): void {
    // Reset all stream processing positions
    for (const sub of this.subscriptions.values()) {
      sub.lastProcessedTick = tick as number;
    }
    
    // Clear scheduled events
    this.pendingEvents = [];
    this.clearEventsCallback?.();
    
    // Re-process streams from new position
    for (const streamId of this.subscriptions.keys()) {
      this.handleStreamUpdate(streamId);
    }
  }
  
  // ========== INTERNAL METHODS ==========
  
  private handleTransportChange(state: TransportSnapshot): void {
    const prevState = this.lastTransportSnapshot;
    this.lastTransportSnapshot = state;
    
    if (!prevState) return;
    
    // Handle play/pause
    if (state.isPlaying && !prevState.isPlaying) {
      this.start();
    } else if (!state.isPlaying && prevState.isPlaying) {
      this.stop();
    }
    
    // Handle seek
    if (state.position !== prevState.position && !state.isPlaying) {
      this.seek(state.position);
    }
    
    // Handle tempo change - need to recalculate sample times
    if (state.tempo !== prevState.tempo) {
      this.recalculateEventTimes();
    }
  }
  
  private handleStreamUpdate(streamId: EventStreamId): void {
    if (!this.isRunning) return;
    
    const sub = this.subscriptions.get(streamId);
    if (!sub) return;
    
    const store = getSharedEventStore();
    const stream = store.getStream(streamId);
    if (!stream) return;
    
    const transport = getTransport();
    const state = transport.getSnapshot();
    
    // Calculate lookahead window
    const lookaheadTicks = this.msToTicks(this.config.lookaheadMs, state.tempo);
    const currentTick = state.position as number;
    const endTick = currentTick + lookaheadTicks;
    
    // Find events in the lookahead window
    const events = stream.events.filter(e => {
      const tick = e.start as number;
      return tick >= sub.lastProcessedTick && tick < endTick;
    });
    
    // Convert and queue events
    for (const event of events) {
      const audioEvent = this.convertEvent(event, streamId, sub.channel, state);
      if (audioEvent) {
        this.pendingEvents.push(audioEvent);
      }
    }
    
    // Update processed position
    sub.lastProcessedTick = endTick;
  }
  
  private update(): void {
    if (!this.isRunning || !this.scheduleEventCallback) return;
    
    const transport = getTransport();
    const state = transport.getSnapshot();
    
    if (!state.isPlaying) return;
    
    // Process pending events
    const currentSample = this.tickToSamples(state.position as number, state.tempo);
    const lookaheadSamples = (this.config.lookaheadMs / 1000) * this.config.sampleRate;
    const windowEnd = currentSample + lookaheadSamples;
    
    // Schedule events within window
    let scheduled = 0;
    const toRemove: number[] = [];
    
    for (let i = 0; i < this.pendingEvents.length && scheduled < this.config.maxEventsPerUpdate; i++) {
      const event = this.pendingEvents[i];
      if (!event) continue;
      if (event.time <= windowEnd) {
        this.scheduleEventCallback(event);
        toRemove.push(i);
        scheduled++;
      }
    }
    
    // Remove scheduled events (in reverse order to preserve indices)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      const indexToRemove = toRemove[i];
      if (indexToRemove !== undefined) {
        this.pendingEvents.splice(indexToRemove, 1);
      }
    }
    
    // Trigger stream updates for new events
    for (const streamId of this.subscriptions.keys()) {
      this.handleStreamUpdate(streamId);
    }
  }
  
  private convertEvent(
    event: Event<unknown>,
    streamId: EventStreamId,
    channel: number,
    transportState: TransportSnapshot
  ): AudioEngineEvent | null {
    const payload = event.payload as Record<string, unknown>;
    const tick = event.start as number;
    const sampleTime = this.tickToSamples(tick, transportState.tempo);
    
    // Determine event type
    let type: AudioEngineEvent['type'] = 'custom';
    if (payload.pitch !== undefined && payload.velocity !== undefined) {
      type = (payload.velocity as number) > 0 ? 'noteOn' : 'noteOff';
    } else if (payload.controller !== undefined) {
      type = 'cc';
    } else if (payload.pitchBend !== undefined) {
      type = 'pitchBend';
    }
    
    const extraPayload = Object.fromEntries(
      Object.entries(payload).filter(([key, value]) => {
        if (value === undefined) return false;
        return !(
          key === 'pitch' ||
          key === 'velocity' ||
          key === 'controller' ||
          key === 'value' ||
          key === 'duration'
        );
      })
    ) as Record<string, unknown>;

    const data: AudioEngineEvent['data'] = {
      channel,
      sourceStreamId: streamId as unknown as string,
      ...(typeof payload.pitch === 'number' ? { pitch: payload.pitch } : {}),
      ...(typeof payload.velocity === 'number' ? { velocity: payload.velocity } : {}),
      ...(typeof payload.controller === 'number' ? { controller: payload.controller } : {}),
      ...(typeof payload.value === 'number' ? { value: payload.value } : {}),
      ...(typeof payload.duration === 'number' ? { duration: payload.duration } : {}),
      ...extraPayload,
    };

    return {
      id: event.id,
      type,
      time: sampleTime,
      priority: 5,
      data,
    };
  }
  
  private tickToSamples(tick: number, tempo: number): number {
    const seconds = (tick / PPQ) * (60 / tempo);
    return Math.floor(seconds * this.config.sampleRate);
  }
  
  private msToTicks(ms: number, tempo: number): number {
    const seconds = ms / 1000;
    const beats = seconds * (tempo / 60);
    return Math.floor(beats * PPQ);
  }
  
  private recalculateEventTimes(): void {
    const transport = getTransport();
    const state = transport.getSnapshot();
    
    // Recalculate all pending event times
    this.pendingEvents = this.pendingEvents.map(event => {
      // We need to reverse-calculate the tick from the old time
      // For simplicity, just clear and re-process
      return event;
    });
    
    // Clear and re-process all streams
    this.pendingEvents = [];
    for (const sub of this.subscriptions.values()) {
      sub.lastProcessedTick = state.position as number;
    }
    for (const streamId of this.subscriptions.keys()) {
      this.handleStreamUpdate(streamId);
    }
  }
  
  // ========== GETTERS ==========
  
  /**
   * Get subscribed stream IDs.
   */
  getSubscribedStreams(): readonly EventStreamId[] {
    return Array.from(this.subscriptions.keys());
  }
  
  /**
   * Get pending event count.
   */
  getPendingEventCount(): number {
    return this.pendingEvents.length;
  }
  
  /**
   * Check if bridge is running.
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let bridgeInstance: AudioEngineStoreBridge | null = null;

/**
 * Get or create the singleton audio engine bridge.
 */
export function getAudioEngineBridge(config?: Partial<AudioEngineBridgeConfig>): AudioEngineStoreBridge {
  if (!bridgeInstance) {
    bridgeInstance = new AudioEngineStoreBridge(config);
  }
  return bridgeInstance;
}

/**
 * Reset the bridge (for testing).
 */
export function resetAudioEngineBridge(): void {
  if (bridgeInstance) {
    bridgeInstance.dispose();
    bridgeInstance = null;
  }
}
