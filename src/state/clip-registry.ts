/**
 * @fileoverview Clip Registry - Shared clip storage for Session and Arrangement views.
 * 
 * **SSOT:** This is the canonical store for all clip definitions.
 * Clips are stored centrally and referenced by ID.
 * Session View and Arrangement View both read from and write to this registry.
 * 
 * @module @cardplay/state/clip-registry
 * @see cardplay/docs/canon/ssot-stores.md
 */

import { type Tick, asTick } from '../types/primitives';
import type {
  ClipId,
  ClipRecord,
  CreateClipOptions,
  EventStreamId,
  SubscriptionId,
} from './types';
import { generateClipId, createClipRecord, generateSubscriptionId } from './types';

// Re-export types for external consumers
export type { ClipId, ClipRecord, CreateClipOptions, EventStreamId, SubscriptionId };

// ============================================================================
// CLIP CHANGE TYPES
// ============================================================================

/**
 * Type of change that occurred to a clip.
 */
export type ClipChangeType =
  | 'created'
  | 'updated'
  | 'deleted';

/**
 * Callback for clip change notifications.
 */
export type ClipCallback = (
  clip: ClipRecord | null,
  changeType: ClipChangeType,
  clipId: ClipId
) => void;

// ============================================================================
// CLIP REGISTRY INTERFACE
// ============================================================================

/**
 * ClipRegistry provides centralized storage for all clips.
 * Both Session View and Arrangement View use this registry.
 */
export interface ClipRegistry {
  // --- Clip CRUD ---
  
  /**
   * Creates a new clip.
   */
  createClip(options: CreateClipOptions): ClipRecord;
  /** @deprecated legacy overload */
  createClip(
    streamId: EventStreamId,
    startTick: Tick | number,
    lengthTicks: Tick | number,
    name?: string,
    color?: string
  ): ClipId;
  
  /**
   * Gets a clip by ID.
   */
  getClip(id: ClipId): ClipRecord | undefined;
  
  /**
   * Gets all clips.
   */
  getAllClips(): readonly ClipRecord[];
  /** @deprecated legacy helper */
  getAllClipIds(): readonly ClipId[];
  
  /**
   * Gets clips by stream ID.
   */
  getClipsByStream(streamId: EventStreamId): readonly ClipRecord[];
  
  /**
   * Updates a clip.
   */
  updateClip(
    id: ClipId,
    changes: Partial<Omit<ClipRecord, 'id'>>
  ): ClipRecord | undefined;
  
  /**
   * Deletes a clip.
   */
  deleteClip(id: ClipId): boolean;
  
  /**
   * Duplicates a clip with a new ID.
   */
  duplicateClip(id: ClipId, newName?: string): ClipRecord | undefined;
  
  // --- Queries ---
  
  /**
   * Finds clips by name (partial match).
   */
  findByName(query: string): readonly ClipRecord[];
  
  /**
   * Finds clips by color.
   */
  findByColor(color: string): readonly ClipRecord[];
  
  // --- Subscriptions ---
  
  /**
   * Subscribes to changes on a specific clip.
   */
  subscribeToClip(clipId: ClipId, callback: ClipCallback): SubscriptionId;
  
  /**
   * Subscribes to changes on all clips.
   */
  subscribeAll(callback: ClipCallback): SubscriptionId;

  /** @deprecated legacy helper: subscribe to any clip change */
  subscribe(callback: () => void): () => void;
  
  /**
   * Unsubscribes from changes.
   */
  unsubscribe(subscriptionId: SubscriptionId): boolean;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

interface ClipSubscription {
  id: SubscriptionId;
  clipId: ClipId | '*';
  callback: ClipCallback;
}

/**
 * Creates a new ClipRegistry instance.
 */
export function createClipRegistry(): ClipRegistry {
  const clips = new Map<ClipId, ClipRecord>();
  const subscriptions = new Map<SubscriptionId, ClipSubscription>();
  
  function notify(clip: ClipRecord | null, changeType: ClipChangeType, clipId: ClipId): void {
    for (const sub of subscriptions.values()) {
      if (sub.clipId === '*' || sub.clipId === clipId) {
        try {
          sub.callback(clip, changeType, clipId);
        } catch (e) {
          console.error('Clip callback error:', e);
        }
      }
    }
  }
  
  function createClipImpl(
    arg1: CreateClipOptions | EventStreamId,
    startTick?: Tick | number,
    lengthTicks?: Tick | number,
    name?: string,
    color?: string
  ): ClipRecord | ClipId {
    const options: CreateClipOptions =
      typeof arg1 === 'string'
        ? {
            streamId: arg1,
            name: name ?? 'Clip',
            ...(color !== undefined && { color }),
            startTick: typeof startTick === 'number' ? asTick(startTick) : (startTick ?? asTick(0)),
            lengthTicks: typeof lengthTicks === 'number' ? asTick(lengthTicks) : (lengthTicks ?? asTick(0)),
            loopEnabled: true,
          }
        : arg1;

    const record = createClipRecord(options);
    clips.set(record.id, record);
    notify(record, 'created', record.id);
    return typeof arg1 === 'string' ? record.id : record;
  }

  const registry: ClipRegistry = {
    createClip: createClipImpl as ClipRegistry['createClip'],
    
    getClip(id: ClipId): ClipRecord | undefined {
      return clips.get(id);
    },
    
    getAllClips(): readonly ClipRecord[] {
      return Array.from(clips.values());
    },

    getAllClipIds(): readonly ClipId[] {
      return Array.from(clips.keys());
    },
    
    getClipsByStream(streamId: EventStreamId): readonly ClipRecord[] {
      return Array.from(clips.values()).filter(c => c.streamId === streamId);
    },
    
    updateClip(
      id: ClipId,
      changes: Partial<Omit<ClipRecord, 'id'>>
    ): ClipRecord | undefined {
      const existing = clips.get(id);
      if (!existing) return undefined;
      
      const updatedRaw: ClipRecord = {
        ...existing,
        ...changes,
        id: existing.id, // Ensure ID can't be changed
        lastModified: Date.now(),
      };

      const updated: ClipRecord = {
        ...updatedRaw,
        length: updatedRaw.duration,
        lengthTicks: updatedRaw.duration,
        loopEnabled: updatedRaw.loop,
      };
      
      clips.set(id, updated);
      notify(updated, 'updated', id);
      return updated;
    },
    
    deleteClip(id: ClipId): boolean {
      const existed = clips.has(id);
      if (existed) {
        clips.delete(id);
        notify(null, 'deleted', id);
      }
      return existed;
    },
    
    duplicateClip(id: ClipId, newName?: string): ClipRecord | undefined {
      const original = clips.get(id);
      if (!original) return undefined;
      
      const duplicateRaw: ClipRecord = {
        ...original,
        id: generateClipId(),
        name: newName ?? `${original.name} (copy)`,
        lastModified: Date.now(),
      };

      const duplicate: ClipRecord = {
        ...duplicateRaw,
        length: duplicateRaw.duration,
        lengthTicks: duplicateRaw.duration,
        loopEnabled: duplicateRaw.loop,
      };
      
      clips.set(duplicate.id, duplicate);
      notify(duplicate, 'created', duplicate.id);
      return duplicate;
    },
    
    findByName(query: string): readonly ClipRecord[] {
      const lowerQuery = query.toLowerCase();
      return Array.from(clips.values()).filter(
        c => c.name.toLowerCase().includes(lowerQuery)
      );
    },
    
    findByColor(color: string): readonly ClipRecord[] {
      return Array.from(clips.values()).filter(c => c.color === color);
    },
    
    subscribeToClip(clipId: ClipId, callback: ClipCallback): SubscriptionId {
      const id = generateSubscriptionId();
      subscriptions.set(id, { id, clipId, callback });
      return id;
    },
    
    subscribeAll(callback: ClipCallback): SubscriptionId {
      const id = generateSubscriptionId();
      subscriptions.set(id, { id, clipId: '*', callback });
      return id;
    },

    subscribe(callback: () => void): () => void {
      const id = registry.subscribeAll(() => callback());
      return () => {
        registry.unsubscribe(id);
      };
    },
    
    unsubscribe(subscriptionId: SubscriptionId): boolean {
      return subscriptions.delete(subscriptionId);
    },
  };
  
  return registry;
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let _clipRegistry: ClipRegistry | null = null;

/**
 * Gets the shared clip registry singleton.
 */
export function getClipRegistry(): ClipRegistry {
  if (!_clipRegistry) {
    _clipRegistry = createClipRegistry();
  }
  return _clipRegistry;
}

/**
 * Resets the clip registry (for testing).
 */
export function resetClipRegistry(): void {
  _clipRegistry = null;
}
