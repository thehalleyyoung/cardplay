/**
 * @fileoverview MusicSpec Store — SSOT for MusicSpec state per board context
 * 
 * Change 364: Store holding current MusicSpec per board context to avoid global singleton.
 * Change 365: Theory cards read/write only through this store.
 * 
 * Each board context maintains its own MusicSpec, allowing independent AI workspaces.
 * The store is keyed by SpecContextId (boardId + deckId).
 * 
 * @module @cardplay/ai/theory/music-spec-store
 */

import type { MusicSpec, MusicConstraint } from './music-spec';
import { DEFAULT_MUSIC_SPEC } from './music-spec';
import type { SpecContextId } from '../../boards/context/types';
import { SpecEventBus, type SpecChangeEvent } from './spec-event-bus';

// ============================================================================
// STORE STATE
// ============================================================================

/**
 * Store entry for a single spec context.
 */
interface SpecStoreEntry {
  /** The current music spec */
  spec: MusicSpec;
  /** Event bus for this context */
  eventBus: SpecEventBus;
  /** Last update timestamp */
  lastModified: number;
}

/**
 * Global store mapping SpecContextId → MusicSpec + event bus.
 * 
 * Change 364: This is the SSOT for MusicSpec state. Theory cards must
 * read/write through this store rather than maintaining ad-hoc state.
 */
class MusicSpecStore {
  private readonly contexts = new Map<SpecContextId, SpecStoreEntry>();

  /**
   * Get the current MusicSpec for a context.
   * Returns undefined if the context hasn't been initialized.
   */
  getSpec(contextId: SpecContextId): MusicSpec | undefined {
    return this.contexts.get(contextId)?.spec;
  }

  /**
   * Get or create a MusicSpec for a context.
   * If the context doesn't exist, initializes with an empty spec.
   */
  getOrCreateSpec(contextId: SpecContextId, defaultSpec?: MusicSpec): MusicSpec {
    let entry = this.contexts.get(contextId);
    if (!entry) {
      entry = {
        spec: defaultSpec ?? DEFAULT_MUSIC_SPEC,
        eventBus: new SpecEventBus(),
        lastModified: Date.now(),
      };
      this.contexts.set(contextId, entry);
    }
    return entry.spec;
  }

  /**
   * Update the MusicSpec for a context and publish change events.
   * 
   * Change 365: Theory cards use this method to apply spec changes.
   * 
   * @param contextId - The spec context to update
   * @param updater - Function that modifies the spec (receives a clone)
   * @param cardId - The card ID initiating the change
   * @param changedConstraints - The constraints that were added/modified
   */
  updateSpec(
    contextId: SpecContextId,
    updater: (spec: MusicSpec) => MusicSpec,
    cardId: string,
    changedConstraints: readonly MusicConstraint[]
  ): MusicSpec {
    const entry = this.contexts.get(contextId);
    if (!entry) {
      throw new Error(`Cannot update spec for uninitialized context: ${contextId}`);
    }

    // Apply update
    const newSpec = updater({ ...entry.spec, constraints: [...entry.spec.constraints] });
    entry.spec = newSpec;
    entry.lastModified = Date.now();

    // Publish change event
    const event: SpecChangeEvent = {
      source: changedConstraints.length === 1 && changedConstraints[0] ? changedConstraints[0].type : 'spec',
      cardId,
      spec: newSpec,
      changedConstraints,
      timestamp: entry.lastModified,
    };
    entry.eventBus.publish(event);

    return newSpec;
  }

  /**
   * Set the entire MusicSpec for a context (replaces existing).
   * Use this when loading a spec from storage or resetting.
   */
  setSpec(contextId: SpecContextId, spec: MusicSpec, cardId: string = 'system'): void {
    let entry = this.contexts.get(contextId);
    if (!entry) {
      entry = {
        spec,
        eventBus: new SpecEventBus(),
        lastModified: Date.now(),
      };
      this.contexts.set(contextId, entry);
    } else {
      entry.spec = spec;
      entry.lastModified = Date.now();
    }

    // Publish full-spec change event
    entry.eventBus.publish({
      source: 'spec',
      cardId,
      spec,
      changedConstraints: spec.constraints,
      timestamp: entry.lastModified,
    });
  }

  /**
   * Get the event bus for a context.
   * Change 363: Event bus is context-specific, not global.
   */
  getEventBus(contextId: SpecContextId): SpecEventBus {
    let entry = this.contexts.get(contextId);
    if (!entry) {
      entry = {
        spec: DEFAULT_MUSIC_SPEC,
        eventBus: new SpecEventBus(),
        lastModified: Date.now(),
      };
      this.contexts.set(contextId, entry);
    }
    return entry.eventBus;
  }

  /**
   * Remove a context from the store (cleanup when closing board/deck).
   */
  deleteContext(contextId: SpecContextId): void {
    this.contexts.delete(contextId);
  }

  /**
   * Clear all contexts (use when resetting project).
   */
  clear(): void {
    this.contexts.clear();
  }

  /**
   * Get all active context IDs.
   */
  getContextIds(): SpecContextId[] {
    return Array.from(this.contexts.keys());
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton MusicSpec store instance.
 * 
 * Change 364: This is the SSOT for all MusicSpec state.
 * Theory cards must use getMusicSpecStore() to access this.
 */
const musicSpecStore = new MusicSpecStore();

/**
 * Get the singleton MusicSpec store.
 * 
 * Usage in theory cards:
 * ```ts
 * const store = getMusicSpecStore();
 * const spec = store.getOrCreateSpec(contextId);
 * store.updateSpec(contextId, spec => addConstraint(spec, constraint), cardId, [constraint]);
 * ```
 */
export function getMusicSpecStore(): MusicSpecStore {
  return musicSpecStore;
}

/**
 * Reset the music spec store (for testing).
 */
export function resetMusicSpecStore(): void {
  musicSpecStore.clear();
}
