/**
 * @fileoverview SSOT Getters - Unified access to Single Source of Truth stores.
 * 
 * This module provides a single entry point for accessing all SSOT stores:
 * - Event Store (event streams)
 * - Clip Registry (clip data)
 * - Routing Graph (signal flow)
 * 
 * ## SSOT Invariants
 * 
 * 1. **Singleton Pattern**: Each store should be a singleton within the app.
 * 2. **Write Through Store**: All mutations must go through store methods.
 * 3. **Read-Only Views**: External consumers should not mutate data directly.
 * 4. **Subscription Model**: Changes are broadcast to all subscribers.
 * 5. **Consistent Reset**: Project reset clears all stores together.
 * 
 * ## Store Responsibilities
 * 
 * | Store         | Data                     | Consumers                    |
 * |---------------|--------------------------|------------------------------|
 * | Event Store   | Event streams, events    | Editors, playback engine     |
 * | Clip Registry | Clip records, metadata   | Session view, arrangement    |
 * | Routing Graph | Connections, nodes       | Audio engine, deck UI        |
 * 
 * @module @cardplay/state/ssot
 * @see cardplay/docs/canon/ssot-stores.md
 */

import {
  type SharedEventStore,
  getSharedEventStore,
} from './event-store';

import {
  type ClipRegistry,
  getClipRegistry,
} from './clip-registry';

import {
  type RoutingGraphStore,
  getRoutingGraph,
} from './routing-graph';

// Re-export store types
export type { SharedEventStore, ClipRegistry, RoutingGraphStore as RoutingGraph };

// ============================================================================
// UNIFIED SSOT ACCESS
// ============================================================================

/**
 * All SSOT stores bundled together.
 */
export interface SSOTStores {
  readonly events: SharedEventStore;
  readonly clips: ClipRegistry;
  readonly routing: RoutingGraph;
}

/**
 * Gets all SSOT stores.
 * This is the preferred way to access stores when you need multiple.
 */
export function getSSOTStores(): SSOTStores {
  return {
    events: getSharedEventStore(),
    clips: getClipRegistry(),
    routing: getRoutingGraph(),
  };
}

/**
 * Re-export individual getters for convenience.
 */
export { getSharedEventStore, getClipRegistry as getSharedClipRegistry, getRoutingGraph as getSharedRoutingGraph };

// ============================================================================
// PROJECT RESET
// ============================================================================

/**
 * Callback for project reset events.
 */
export type ProjectResetCallback = () => void;

const resetCallbacks: ProjectResetCallback[] = [];

/**
 * Registers a callback to be called on project reset.
 * Use this to clear any local caches that depend on SSOT data.
 */
export function onProjectReset(callback: ProjectResetCallback): () => void {
  resetCallbacks.push(callback);
  return () => {
    const index = resetCallbacks.indexOf(callback);
    if (index >= 0) {
      resetCallbacks.splice(index, 1);
    }
  };
}

/**
 * Resets all SSOT stores.
 * 
 * This should be called when:
 * - Creating a new project
 * - Loading a project from disk
 * - Clearing the workspace
 * 
 * All stores are cleared together to maintain consistency.
 */
export function resetProject(): void {
  const stores = getSSOTStores();
  
  // Clear all streams from event store
  for (const stream of stores.events.getAllStreams()) {
    stores.events.deleteStream(stream.id);
  }
  
  // Clear all clips
  for (const clip of stores.clips.getAllClips()) {
    stores.clips.deleteClip(clip.id);
  }
  
  // Clear all routing by removing all nodes (which removes edges)
  const allNodes = stores.routing.getNodes();
  for (const node of allNodes) {
    stores.routing.removeNode(node.id);
  }
  
  // Notify reset callbacks
  for (const callback of resetCallbacks) {
    try {
      callback();
    } catch (error) {
      console.error('Error in project reset callback:', error);
    }
  }
}

// ============================================================================
// STORE VALIDATION
// ============================================================================

/**
 * Validates that all SSOT stores are in a consistent state.
 * Returns a list of any inconsistencies found.
 */
export function validateSSOTConsistency(): string[] {
  const errors: string[] = [];
  const stores = getSSOTStores();
  
  // Check that all clip event streams exist
  for (const clip of stores.clips.getAllClips()) {
    if (clip.eventStreamId) {
      const stream = stores.events.getStream(clip.eventStreamId);
      if (!stream) {
        errors.push(
          `Clip ${clip.id} references non-existent event stream ${clip.eventStreamId}`
        );
      }
    }
  }
  
  // Check that routing nodes reference valid entities
  // (Add more validation as needed)
  
  return errors;
}
