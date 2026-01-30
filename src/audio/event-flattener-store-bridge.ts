/**
 * @fileoverview Event Flattener ↔ SharedEventStore Bridge.
 * 
 * Connects the event flattening system to SharedEventStore for
 * efficient event lookups and range queries.
 * 
 * Key responsibilities:
 * - Flatten hierarchical events from multiple streams
 * - Build efficient indexed structures for playback
 * - Support time range queries
 * - Handle event priority and layering
 * - Cache flattened results for performance
 * 
 * @module @cardplay/audio/event-flattener-store-bridge
 */

import type { Event } from '../types/event';
import type { Tick } from '../types/primitives';
import { asTick } from '../types/primitives';
import type { EventStreamId, ClipId, SubscriptionId } from '../state/types';
import { getSharedEventStore, getClipRegistry } from '../state';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Flattened event with source tracking.
 */
export interface FlattenedEvent<P = unknown> {
  readonly event: Event<P>;
  readonly sourceStreamId: EventStreamId;
  readonly sourceClipId: ClipId | null;
  readonly layer: number;           // Layer for priority/ordering
  readonly absoluteTick: Tick;      // Absolute tick position
  readonly effectiveVelocity: number; // Velocity with layer modifiers
}

/**
 * Flattened event stream.
 */
export interface FlattenedStream {
  readonly events: readonly FlattenedEvent[];
  readonly startTick: Tick;
  readonly endTick: Tick;
  readonly streamIds: readonly EventStreamId[];
  readonly clipIds: readonly ClipId[];
}

/**
 * Time range for queries.
 */
export interface TickRange {
  readonly start: Tick;
  readonly end: Tick;
}

/**
 * Event filter options.
 */
export interface EventFilterOptions {
  readonly streamIds?: readonly EventStreamId[];
  readonly clipIds?: readonly ClipId[];
  readonly layers?: readonly number[];
  readonly eventTypes?: readonly string[];
  readonly pitchRange?: { min: number; max: number };
  readonly velocityRange?: { min: number; max: number };
}

/**
 * Flattener configuration.
 */
export interface EventFlattenerBridgeConfig {
  /** Cache TTL in milliseconds */
  readonly cacheTTL: number;
  /** Maximum cached ranges */
  readonly maxCachedRanges: number;
  /** Default lookahead for streaming */
  readonly defaultLookahead: number;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: EventFlattenerBridgeConfig = {
  cacheTTL: 5000,
  maxCachedRanges: 10,
  defaultLookahead: 1920 * 4,  // 4 bars
};

// ============================================================================
// EVENT FLATTENER STORE BRIDGE
// ============================================================================

/**
 * EventFlattenerStoreBridge - Flattens events from SharedEventStore.
 */
export class EventFlattenerStoreBridge {
  private config: EventFlattenerBridgeConfig;
  
  // Source configuration
  private activeStreamIds: Set<EventStreamId> = new Set();
  private activeClipIds: Set<ClipId> = new Set();
  private layerAssignments: Map<EventStreamId, number> = new Map();
  
  // Caching
  private cachedRanges: Map<string, { data: FlattenedStream; timestamp: number }> = new Map();
  
  // Store subscriptions
  private storeSubscriptions: Map<EventStreamId, SubscriptionId> = new Map();
  private registrySubscription: (() => void) | null = null;
  
  // Change subscribers
  private subscribers: Set<() => void> = new Set();
  
  constructor(config: Partial<EventFlattenerBridgeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  // ========== INITIALIZATION ==========
  
  /**
   * Initialize the bridge.
   */
  initialize(): void {
    // Subscribe to registry changes
    const registry = getClipRegistry();
    this.registrySubscription = registry.subscribe(() => {
      this.invalidateCache();
      this.notifySubscribers();
    });
  }
  
  /**
   * Dispose the bridge.
   */
  dispose(): void {
    // Unsubscribe from streams
    const store = getSharedEventStore();
    for (const [, subId] of this.storeSubscriptions) {
      store.unsubscribe(subId);
    }
    this.storeSubscriptions.clear();
    
    // Unsubscribe from registry
    if (this.registrySubscription) {
      this.registrySubscription();
      this.registrySubscription = null;
    }
    
    this.subscribers.clear();
    this.cachedRanges.clear();
  }
  
  // ========== SOURCE CONFIGURATION ==========
  
  /**
   * Add a stream to be flattened.
   */
  addStream(streamId: EventStreamId, layer: number = 0): void {
    if (this.activeStreamIds.has(streamId)) return;
    
    this.activeStreamIds.add(streamId);
    this.layerAssignments.set(streamId, layer);
    
    // Subscribe to stream changes
    const store = getSharedEventStore();
    const subId = store.subscribe(streamId, () => {
      this.invalidateCacheForStream(streamId);
      this.notifySubscribers();
    });
    this.storeSubscriptions.set(streamId, subId);
    
    this.invalidateCache();
  }
  
  /**
   * Remove a stream from flattening.
   */
  removeStream(streamId: EventStreamId): void {
    if (!this.activeStreamIds.has(streamId)) return;
    
    this.activeStreamIds.delete(streamId);
    this.layerAssignments.delete(streamId);
    
    // Unsubscribe from stream
    const subId = this.storeSubscriptions.get(streamId);
    if (subId) {
      getSharedEventStore().unsubscribe(subId);
      this.storeSubscriptions.delete(streamId);
    }
    
    this.invalidateCache();
  }
  
  /**
   * Add a clip's stream to be flattened.
   */
  addClip(clipId: ClipId, layer: number = 0): void {
    const clip = getClipRegistry().getClip(clipId);
    if (!clip) return;
    
    this.activeClipIds.add(clipId);
    this.addStream(clip.streamId, layer);
  }
  
  /**
   * Remove a clip from flattening.
   */
  removeClip(clipId: ClipId): void {
    const clip = getClipRegistry().getClip(clipId);
    if (!clip) return;
    
    this.activeClipIds.delete(clipId);
    this.removeStream(clip.streamId);
  }
  
  /**
   * Add all clips for flattening.
   */
  addAllClips(): void {
    const registry = getClipRegistry();
    for (const clipId of registry.getAllClipIds()) {
      this.addClip(clipId);
    }
  }
  
  /**
   * Clear all streams.
   */
  clearStreams(): void {
    for (const streamId of this.activeStreamIds) {
      this.removeStream(streamId);
    }
    this.activeClipIds.clear();
  }
  
  /**
   * Set layer for a stream.
   */
  setStreamLayer(streamId: EventStreamId, layer: number): void {
    this.layerAssignments.set(streamId, layer);
    this.invalidateCache();
  }
  
  // ========== QUERYING ==========
  
  /**
   * Get flattened events in a time range.
   */
  getEventsInRange(range: TickRange, filter?: EventFilterOptions): FlattenedEvent[] {
    const cacheKey = this.getCacheKey(range, filter);
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached.events.slice();
    }
    
    const flattened = this.flattenRange(range, filter);
    this.setCache(cacheKey, flattened);
    
    return flattened.events.slice();
  }
  
  /**
   * Get all flattened events.
   */
  getAllEvents(filter?: EventFilterOptions): FlattenedEvent[] {
    const range: TickRange = {
      start: asTick(0),
      end: asTick(Number.MAX_SAFE_INTEGER),
    };
    return this.getEventsInRange(range, filter);
  }
  
  /**
   * Get flattened stream for a time range.
   */
  getFlattenedStream(range: TickRange, filter?: EventFilterOptions): FlattenedStream {
    const events = this.getEventsInRange(range, filter);
    
    return {
      events,
      startTick: range.start,
      endTick: range.end,
      streamIds: Array.from(this.activeStreamIds),
      clipIds: Array.from(this.activeClipIds),
    };
  }
  
  /**
   * Get events starting at a specific tick.
   */
  getEventsAtTick(tick: Tick, filter?: EventFilterOptions): FlattenedEvent[] {
    return this.getEventsInRange(
      { start: tick, end: asTick((tick as number) + 1) },
      filter
    ).filter(e => (e.absoluteTick as number) === (tick as number));
  }
  
  /**
   * Get events sounding at a specific tick (start <= tick < start + duration).
   */
  getEventsSoundingAtTick(tick: Tick, filter?: EventFilterOptions): FlattenedEvent[] {
    // Get events in a wider range then filter
    const lookBack = asTick(this.config.defaultLookahead);
    const events = this.getEventsInRange(
      { start: asTick(Math.max(0, (tick as number) - (lookBack as number))), end: tick },
      filter
    );
    
    return events.filter(e => {
      const start = e.absoluteTick as number;
      const end = start + (e.event.duration as number);
      return start <= (tick as number) && (tick as number) < end;
    });
  }
  
  /**
   * Count events in a range.
   */
  countEventsInRange(range: TickRange, filter?: EventFilterOptions): number {
    return this.getEventsInRange(range, filter).length;
  }
  
  /**
   * Get the total time span of all events.
   */
  getTimeSpan(): TickRange {
    let minTick = Number.MAX_SAFE_INTEGER;
    let maxTick = 0;
    
    for (const streamId of this.activeStreamIds) {
      const stream = getSharedEventStore().getStream(streamId);
      if (!stream) continue;
      
      for (const event of stream.events) {
        const start = event.start as number;
        const end = start + (event.duration as number);
        
        minTick = Math.min(minTick, start);
        maxTick = Math.max(maxTick, end);
      }
    }
    
    return {
      start: asTick(minTick === Number.MAX_SAFE_INTEGER ? 0 : minTick),
      end: asTick(maxTick),
    };
  }
  
  // ========== SUBSCRIPTIONS ==========
  
  /**
   * Subscribe to flattened event changes.
   */
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  // ========== INTERNAL ==========
  
  private flattenRange(range: TickRange, filter?: EventFilterOptions): FlattenedStream {
    const events: FlattenedEvent[] = [];
    const streamIds: EventStreamId[] = [];
    const clipIds: ClipId[] = [];
    
    const store = getSharedEventStore();
    const registry = getClipRegistry();
    
    for (const streamId of this.activeStreamIds) {
      // Apply stream filter
      if (filter?.streamIds && !filter.streamIds.includes(streamId)) {
        continue;
      }
      
      const stream = store.getStream(streamId);
      if (!stream) continue;
      
      streamIds.push(streamId);
      
      // Find associated clip
      let clipId: ClipId | null = null;
      let clipOffset: Tick = asTick(0);
      
      for (const cid of this.activeClipIds) {
        const clip = registry.getClip(cid);
        if (clip && clip.streamId === streamId) {
          clipId = cid;
          clipOffset = clip.startTick;
          if (!clipIds.includes(cid)) clipIds.push(cid);
          break;
        }
      }
      
      // Apply clip filter
      if (filter?.clipIds && clipId && !filter.clipIds.includes(clipId)) {
        continue;
      }
      
      const layer = this.layerAssignments.get(streamId) ?? 0;
      
      // Apply layer filter
      if (filter?.layers && !filter.layers.includes(layer)) {
        continue;
      }
      
      for (const event of stream.events) {
        const absoluteTick = asTick((event.start as number) + (clipOffset as number));
        
        // Range filter
        if ((absoluteTick as number) >= (range.end as number)) continue;
        if ((absoluteTick as number) + (event.duration as number) <= (range.start as number)) continue;
        
        // Event type filter
        if (filter?.eventTypes) {
          const eventType = (event.payload as any)?.type ?? 'unknown';
          if (!filter.eventTypes.includes(eventType)) continue;
        }
        
        // Pitch filter
        if (filter?.pitchRange) {
          const pitch = (event.payload as any)?.pitch ?? 0;
          if (pitch < filter.pitchRange.min || pitch > filter.pitchRange.max) continue;
        }
        
        // Velocity filter
        if (filter?.velocityRange) {
          const velocity = (event.payload as any)?.velocity ?? 100;
          if (velocity < filter.velocityRange.min || velocity > filter.velocityRange.max) continue;
        }
        
        const flattened: FlattenedEvent = {
          event,
          sourceStreamId: streamId,
          sourceClipId: clipId,
          layer,
          absoluteTick,
          effectiveVelocity: this.calculateEffectiveVelocity(event, layer),
        };
        
        events.push(flattened);
      }
    }
    
    // Sort by absolute tick, then layer
    events.sort((a, b) => {
      const tickDiff = (a.absoluteTick as number) - (b.absoluteTick as number);
      if (tickDiff !== 0) return tickDiff;
      return a.layer - b.layer;
    });
    
    return {
      events,
      startTick: range.start,
      endTick: range.end,
      streamIds,
      clipIds,
    };
  }
  
  private calculateEffectiveVelocity(event: Event<any>, _layer: number): number {
    const baseVelocity = (event.payload as any)?.velocity ?? 100;
    // Could apply layer-based velocity scaling here
    return baseVelocity;
  }
  
  // ========== CACHING ==========
  
  private getCacheKey(range: TickRange, filter?: EventFilterOptions): string {
    const filterKey = filter ? JSON.stringify(filter) : 'none';
    return `${range.start}-${range.end}-${filterKey}`;
  }
  
  private getCached(key: string): FlattenedStream | null {
    const entry = this.cachedRanges.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.config.cacheTTL) {
      this.cachedRanges.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  private setCache(key: string, data: FlattenedStream): void {
    // Evict old entries if over limit
    if (this.cachedRanges.size >= this.config.maxCachedRanges) {
      let oldestKey: string | null = null;
      let oldestTime = Number.MAX_SAFE_INTEGER;
      
      for (const [k, v] of this.cachedRanges) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldestKey = k;
        }
      }
      
      if (oldestKey) {
        this.cachedRanges.delete(oldestKey);
      }
    }
    
    this.cachedRanges.set(key, { data, timestamp: Date.now() });
  }
  
  private invalidateCache(): void {
    this.cachedRanges.clear();
  }
  
  private invalidateCacheForStream(_streamId: EventStreamId): void {
    // Simple approach: invalidate all cache
    // Could be smarter and only invalidate ranges that include this stream
    this.invalidateCache();
  }
  
  private notifySubscribers(): void {
    for (const callback of this.subscribers) {
      callback();
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let bridgeInstance: EventFlattenerStoreBridge | null = null;

/**
 * Get or create the singleton event flattener bridge.
 */
export function getEventFlattenerBridge(config?: Partial<EventFlattenerBridgeConfig>): EventFlattenerStoreBridge {
  if (!bridgeInstance) {
    bridgeInstance = new EventFlattenerStoreBridge(config);
    bridgeInstance.initialize();
  }
  return bridgeInstance;
}

/**
 * Reset the bridge (for testing).
 */
export function resetEventFlattenerBridge(): void {
  if (bridgeInstance) {
    bridgeInstance.dispose();
    bridgeInstance = null;
  }
}
