/**
 * @fileoverview Routing Integration for Audio Decks
 * 
 * Integrates DeckLayoutAdapter audio nodes with the routing graph system.
 * 
 * J029-J030: Integrate DeckLayoutAdapter audio nodes as routing endpoints
 * for mixer/chain decks and ensure routing changes update audio engine.
 * 
 * @module @cardplay/boards/decks/routing-integration
 */

import type { RoutingNodeId } from '../../state/types';
import { getRoutingGraph } from '../../state/routing-graph';
import type { AudioDeckAdapter } from './audio-deck-adapter';

// ============================================================================
// ROUTING NODE REGISTRATION
// ============================================================================

/**
 * Audio node info for routing integration.
 */
export interface AudioNodeInfo {
  /** Deck adapter instance */
  adapter: AudioDeckAdapter;
  
  /** Routing node ID for input */
  inputNodeId: RoutingNodeId;
  
  /** Routing node ID for output */
  outputNodeId: RoutingNodeId;
  
  /** Display name */
  displayName: string;
}

/**
 * Registry of audio deck adapters for routing.
 * 
 * Maps routing node IDs to their corresponding audio deck adapters.
 * This allows the routing overlay to connect Web Audio nodes correctly.
 */
const audioNodeRegistry = new Map<RoutingNodeId, AudioNodeInfo>();

/**
 * J029: Register an audio deck adapter as a routing endpoint.
 * 
 * This makes the deck's audio input/output nodes available for
 * routing connections in the routing overlay.
 * 
 * @param adapter Audio deck adapter to register
 * @param inputNodeId Routing node ID for input (receives audio)
 * @param outputNodeId Routing node ID for output (sends audio)
 * @param displayName Display name for routing graph
 * 
 * @example
 * ```ts
 * const adapter = createAudioDeckAdapter(deckDef, activeContext, {
 *   audioContext: getAudioContext(),
 * });
 * 
 * registerAudioDeckForRouting(
 *   adapter,
 *   'mixer-track-1-in' as RoutingNodeId,
 *   'mixer-track-1-out' as RoutingNodeId,
 *   'Track 1'
 * );
 * ```
 */
export function registerAudioDeckForRouting(
  adapter: AudioDeckAdapter,
  inputNodeId: RoutingNodeId,
  outputNodeId: RoutingNodeId,
  displayName: string
): void {
  const info: AudioNodeInfo = {
    adapter,
    inputNodeId,
    outputNodeId,
    displayName,
  };
  
  audioNodeRegistry.set(inputNodeId, info);
  audioNodeRegistry.set(outputNodeId, info);
}

/**
 * Unregister an audio deck adapter from routing.
 * 
 * Call this when a deck is destroyed to clean up routing endpoints.
 */
export function unregisterAudioDeckFromRouting(
  inputNodeId: RoutingNodeId,
  outputNodeId: RoutingNodeId
): void {
  audioNodeRegistry.delete(inputNodeId);
  audioNodeRegistry.delete(outputNodeId);
}

/**
 * Get audio node info for a routing node ID.
 * 
 * Returns null if the node ID is not registered.
 */
export function getAudioNodeInfo(nodeId: RoutingNodeId): AudioNodeInfo | null {
  return audioNodeRegistry.get(nodeId) || null;
}

/**
 * Get all registered audio node endpoints.
 */
export function getAllAudioNodeEndpoints(): AudioNodeInfo[] {
  const seen = new Set<AudioDeckAdapter>();
  const results: AudioNodeInfo[] = [];
  
  for (const info of audioNodeRegistry.values()) {
    if (!seen.has(info.adapter)) {
      seen.add(info.adapter);
      results.push(info);
    }
  }
  
  return results;
}

// ============================================================================
// ROUTING CONNECTION APPLICATION
// ============================================================================

/**
 * Connection result.
 */
export interface ConnectionResult {
  /** Whether connection was successful */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
  
  /** Web Audio connection object if successful */
  audioConnection?: AudioNode;
}

/**
 * J030: Apply a routing connection to the audio engine.
 * 
 * Connects Web Audio nodes based on routing graph connections.
 * This is called when:
 * 1. A new routing connection is created in the overlay
 * 2. The routing graph is loaded/restored
 * 3. A board switches and routing needs to be reapplied
 * 
 * @param sourceNodeId Source routing node ID
 * @param destNodeId Destination routing node ID
 * @returns Connection result
 */
export function applyRoutingConnection(
  sourceNodeId: RoutingNodeId,
  destNodeId: RoutingNodeId
): ConnectionResult {
  // Get audio node info for source and destination
  const sourceInfo = getAudioNodeInfo(sourceNodeId);
  const destInfo = getAudioNodeInfo(destNodeId);
  
  if (!sourceInfo) {
    return {
      success: false,
      error: `Source node not found: ${sourceNodeId}`,
    };
  }
  
  if (!destInfo) {
    return {
      success: false,
      error: `Destination node not found: ${destNodeId}`,
    };
  }
  
  // Get Web Audio nodes
  const sourceNode = sourceInfo.adapter.getOutputNode();
  const destNode = destInfo.adapter.getInputNode();
  
  if (!sourceNode) {
    return {
      success: false,
      error: 'Source audio node not initialized',
    };
  }
  
  if (!destNode) {
    return {
      success: false,
      error: 'Destination audio node not initialized',
    };
  }
  
  // Connect the nodes
  try {
    sourceNode.connect(destNode);
    
    return {
      success: true,
      audioConnection: sourceNode,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * J030: Disconnect a routing connection from the audio engine.
 * 
 * @param sourceNodeId Source routing node ID
 * @param destNodeId Destination routing node ID (optional - disconnects all if not provided)
 */
export function disconnectRoutingConnection(
  sourceNodeId: RoutingNodeId,
  destNodeId?: RoutingNodeId
): ConnectionResult {
  const sourceInfo = getAudioNodeInfo(sourceNodeId);
  
  if (!sourceInfo) {
    return {
      success: false,
      error: `Source node not found: ${sourceNodeId}`,
    };
  }
  
  const sourceNode = sourceInfo.adapter.getOutputNode();
  
  if (!sourceNode) {
    return {
      success: false,
      error: 'Source audio node not initialized',
    };
  }
  
  try {
    if (destNodeId) {
      const destInfo = getAudioNodeInfo(destNodeId);
      if (!destInfo) {
        return {
          success: false,
          error: `Destination node not found: ${destNodeId}`,
        };
      }
      
      const destNode = destInfo.adapter.getInputNode();
      if (!destNode) {
        return {
          success: false,
          error: 'Destination audio node not initialized',
        };
      }
      
      sourceNode.disconnect(destNode);
    } else {
      sourceNode.disconnect();
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Disconnection failed',
    };
  }
}

/**
 * J030: Sync all routing connections with the audio engine.
 * 
 * Reads the routing graph and applies all connections to the audio engine.
 * This is called when:
 * 1. A board is activated
 * 2. The routing graph is loaded
 * 3. Audio context is initialized/resumed
 */
export function syncRoutingGraphToAudioEngine(): void {
  const graph = getRoutingGraph();
  const edges = graph.getEdges();
  
  // Clear all existing connections
  // (Web Audio doesn't have a clean way to query connections, so we disconnect all)
  for (const info of getAllAudioNodeEndpoints()) {
    const outputNode = info.adapter.getOutputNode();
    if (outputNode) {
      try {
        outputNode.disconnect();
      } catch {
        // Ignore errors (node may not be connected)
      }
    }
  }
  
  // Apply all connections from routing graph
  for (const edge of edges) {
    // Only apply audio connections (skip MIDI/modulation)
    if (edge.type !== 'audio') continue;
    
    const result = applyRoutingConnection(
      edge.from as RoutingNodeId,
      edge.to as RoutingNodeId
    );
    
    if (!result.success) {
      console.warn('Failed to apply routing connection:', {
        from: edge.from,
        to: edge.to,
        error: result.error,
      });
    }
  }
}

// ============================================================================
// BOARD LIFECYCLE INTEGRATION
// ============================================================================

/**
 * Initialize routing integration for a board.
 * 
 * Call this when a board is activated to set up routing sync.
 */
export function initializeRoutingForBoard(): void {
  // Sync routing graph on activation
  syncRoutingGraphToAudioEngine();
  
  // Subscribe to routing graph changes
  const graph = getRoutingGraph();
  graph.subscribe(() => {
    syncRoutingGraphToAudioEngine();
  });
}

// ============================================================================
// ROUTING DIAGNOSTICS (Change 217)
// ============================================================================

/**
 * Change 217: Diagnostic info about a routing connection's adapter requirements.
 */
export interface RoutingDiagnostic {
  readonly edgeId: string;
  readonly sourceNodeName: string;
  readonly targetNodeName: string;
  readonly adapterRequired: boolean;
  readonly adapterId?: string;
  readonly message: string;
}

/**
 * Change 217: Get diagnostics for all connections, surfacing adapter requirements.
 */
export function getRoutingDiagnostics(): readonly RoutingDiagnostic[] {
  const graph = getRoutingGraph();
  const edges = graph.getEdges();
  const diagnostics: RoutingDiagnostic[] = [];

  for (const edge of edges) {
    const sourceNode = graph.getNode(edge.from);
    const targetNode = graph.getNode(edge.to);
    const hasAdapter = 'adapterId' in edge && edge.adapterId !== undefined;
    const adapterId = hasAdapter ? (edge as { adapterId?: string }).adapterId : undefined;

    const diagnostic: RoutingDiagnostic = {
      edgeId: edge.id,
      sourceNodeName: sourceNode?.name ?? edge.from,
      targetNodeName: targetNode?.name ?? edge.to,
      adapterRequired: hasAdapter,
      message: hasAdapter
        ? `Connection requires adapter: ${adapterId}`
        : 'Direct connection',
    };
    
    if (adapterId) {
      diagnostics.push({ ...diagnostic, adapterId });
    } else {
      diagnostics.push(diagnostic);
    }
  }

  return diagnostics;
}

/**
 * Clean up routing integration when a board is deactivated.
 */
export function cleanupRoutingForBoard(): void {
  // Disconnect all audio connections
  for (const info of getAllAudioNodeEndpoints()) {
    const outputNode = info.adapter.getOutputNode();
    if (outputNode) {
      try {
        outputNode.disconnect();
      } catch {
        // Ignore errors
      }
    }
  }
}
