/**
 * @fileoverview Routing Graph - Unified visual and audio routing.
 * 
 * This module provides a shared routing graph that both the visual deck
 * connections and the audio routing system read from. Single source of
 * truth for all signal flow in the system.
 * 
 * **SSOT**: This is the single source of truth for routing state.
 * See cardplay/docs/canon/ssot-stores.md for the SSOT contract.
 * 
 * - All connections MUST be created/deleted through this store
 * - UI and audio engine read from this store only
 * - No parallel routing graphs should exist
 * 
 * @module @cardplay/state/routing-graph
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase E.3
 */

import type {
  RoutingEdge,
  SubscriptionId,
} from './types';
import { generateSubscriptionId } from './types';
import { getUndoStack } from './undo-stack';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Node types in the routing graph.
 */
export type NodeType =
  | 'deck'          // Card deck (source)
  | 'generator'     // Generator card output
  | 'effect'        // Effect processor
  | 'instrument'    // Instrument/sampler
  | 'mixer'         // Mixer/bus
  | 'output'        // Audio output
  | 'input'         // Audio input
  | 'send'          // Send bus
  | 'return';       // Return bus

/**
 * Edge types in the routing graph.
 */
export type EdgeType =
  | 'audio'         // Audio signal flow
  | 'midi'          // MIDI events
  | 'cv'            // Control voltage (modulation)
  | 'trigger'       // Trigger signals
  | 'parameter';    // Parameter automation

/**
 * Full node info with metadata.
 */
export interface RoutingNodeInfo {
  /** Unique node ID */
  readonly id: string;
  /** Associated card ID (optional) */
  readonly cardId?: string;
  /** Node type */
  readonly type: NodeType;
  /** Display name */
  readonly name: string;
  /** Display position */
  readonly position?: { x: number; y: number };
  /** Input ports */
  readonly inputs: readonly PortInfo[];
  /** Output ports */
  readonly outputs: readonly PortInfo[];
  /** Whether node is enabled */
  readonly enabled?: boolean;
  /** Whether node is bypassed */
  readonly bypassed: boolean;
  /** Node metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Port information.
 */
export interface PortInfo {
  /** Port ID */
  readonly id: string;
  /** Port name */
  readonly name: string;
  /** Port type (audio, midi, cv) */
  readonly type: 'audio' | 'midi' | 'cv';
  /** Number of channels (for audio) */
  readonly channels?: number;
}

/**
 * Full edge info with metadata.
 */
export interface RoutingEdgeInfo extends RoutingEdge {
  /** Edge type */
  readonly type: EdgeType;
  /** Source port ID */
  readonly sourcePort: string;
  /** Target port ID */
  readonly targetPort: string;
  /** Signal gain/level */
  readonly gain?: number;
  /** Whether edge is active */
  readonly active: boolean;
}

/**
 * Callback for routing graph changes.
 */
export type RoutingGraphCallback = (graph: RoutingGraphState) => void;

/**
 * Full routing graph state.
 */
export interface RoutingGraphState {
  /** All nodes */
  readonly nodes: ReadonlyMap<string, RoutingNodeInfo>;
  /** All edges */
  readonly edges: readonly RoutingEdgeInfo[];
  /** Graph version (for change detection) */
  readonly version: number;
}

// ============================================================================
// ROUTING GRAPH STORE
// ============================================================================

/**
 * RoutingGraphStore provides the shared routing graph.
 */
export interface RoutingGraphStore {
  /**
   * Gets current graph state.
   */
  getState(): RoutingGraphState;
  
  /**
   * Gets a node by ID.
   */
  getNode(nodeId: string): RoutingNodeInfo | undefined;
  
  /**
   * Gets all nodes.
   */
  getNodes(): readonly RoutingNodeInfo[];
  
  /**
   * Gets nodes of a specific type.
   */
  getNodesByType(type: NodeType): readonly RoutingNodeInfo[];
  
  /**
   * Gets all edges.
   */
  getEdges(): readonly RoutingEdgeInfo[];
  
  /**
   * Gets edges connected to a node.
   */
  getEdgesForNode(nodeId: string): readonly RoutingEdgeInfo[];
  
  /**
   * Gets edges from a node's output.
   */
  getOutputEdges(nodeId: string): readonly RoutingEdgeInfo[];
  
  /**
   * Gets edges to a node's input.
   */
  getInputEdges(nodeId: string): readonly RoutingEdgeInfo[];
  
  /**
   * Adds a node to the graph.
   */
  addNode(node: RoutingNodeInfo): void;
  
  /**
   * Removes a node from the graph.
   */
  removeNode(nodeId: string): void;
  
  /**
   * Updates a node.
   */
  updateNode(nodeId: string, updates: Partial<Omit<RoutingNodeInfo, 'id'>>): void;
  
  /**
   * Connects two nodes.
   */
  connect(
    sourceId: string,
    sourcePort: string,
    targetId: string,
    targetPort: string,
    type?: EdgeType
  ): RoutingEdgeInfo;
  
  /**
   * Disconnects an edge.
   */
  disconnect(edgeId: string): void;
  
  /**
   * Disconnects all edges for a node.
   */
  disconnectNode(nodeId: string): void;
  
  /**
   * Sets edge gain.
   */
  setEdgeGain(edgeId: string, gain: number): void;
  
  /**
   * Sets node bypass state.
   */
  setNodeBypassed(nodeId: string, bypassed: boolean): void;
  
  /**
   * Checks if connection would create a cycle.
   */
  wouldCreateCycle(sourceId: string, targetId: string): boolean;
  
  /**
   * Gets topologically sorted node order (for processing).
   */
  getProcessingOrder(): readonly string[];
  
  /**
   * Subscribes to graph changes.
   */
  subscribe(callback: RoutingGraphCallback): SubscriptionId;
  
  /**
   * Unsubscribes from graph changes.
   */
  unsubscribe(subscriptionId: SubscriptionId): boolean;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Creates a new RoutingGraphStore.
 */
export function createRoutingGraphStore(): RoutingGraphStore {
  let nodes = new Map<string, RoutingNodeInfo>();
  let edges: RoutingEdgeInfo[] = [];
  let version = 0;
  let edgeIdCounter = 0;
  
  const subscriptions = new Map<SubscriptionId, RoutingGraphCallback>();
  
  function getState(): RoutingGraphState {
    return { nodes, edges, version };
  }
  
  function notify(): void {
    version++;
    const state = getState();
    for (const callback of subscriptions.values()) {
      try {
        callback(state);
      } catch (e) {
        console.error('Routing graph callback error:', e);
      }
    }
  }
  
  const store: RoutingGraphStore = {
    getState,
    
    getNode(nodeId: string): RoutingNodeInfo | undefined {
      return nodes.get(nodeId);
    },
    
    getNodes(): readonly RoutingNodeInfo[] {
      return Array.from(nodes.values());
    },
    
    getNodesByType(type: NodeType): readonly RoutingNodeInfo[] {
      return Array.from(nodes.values()).filter(n => n.type === type);
    },
    
    getEdges(): readonly RoutingEdgeInfo[] {
      return edges;
    },
    
    getEdgesForNode(nodeId: string): readonly RoutingEdgeInfo[] {
      return edges.filter(e => e.from === nodeId || e.to === nodeId);
    },
    
    getOutputEdges(nodeId: string): readonly RoutingEdgeInfo[] {
      return edges.filter(e => e.from === nodeId);
    },
    
    getInputEdges(nodeId: string): readonly RoutingEdgeInfo[] {
      return edges.filter(e => e.to === nodeId);
    },
    
    addNode(node: RoutingNodeInfo): void {
      const undo = getUndoStack();
      const previousNode = nodes.get(node.id);
      
      nodes = new Map(nodes);
      nodes.set(node.id, node);
      notify();
      
      undo.push({
        type: 'routing:add-node',
        description: `Add ${node.type} node "${node.name}"`,
        undo: () => {
          nodes = new Map(nodes);
          if (previousNode) {
            nodes.set(node.id, previousNode);
          } else {
            nodes.delete(node.id);
          }
          notify();
        },
        redo: () => {
          nodes = new Map(nodes);
          nodes.set(node.id, node);
          notify();
        },
      });
    },
    
    removeNode(nodeId: string): void {
      const node = nodes.get(nodeId);
      if (!node) return;
      
      const undo = getUndoStack();
      const removedEdges = edges.filter(e => e.from === nodeId || e.to === nodeId);
      
      nodes = new Map(nodes);
      nodes.delete(nodeId);
      edges = edges.filter(e => e.from !== nodeId && e.to !== nodeId);
      notify();
      
      undo.push({
        type: 'routing:remove-node',
        description: `Remove ${node.type} node "${node.name}"`,
        undo: () => {
          nodes = new Map(nodes);
          nodes.set(nodeId, node);
          edges = [...edges, ...removedEdges];
          notify();
        },
        redo: () => {
          nodes = new Map(nodes);
          nodes.delete(nodeId);
          edges = edges.filter(e => e.from !== nodeId && e.to !== nodeId);
          notify();
        },
      });
    },
    
    updateNode(nodeId: string, updates: Partial<Omit<RoutingNodeInfo, 'id'>>): void {
      const node = nodes.get(nodeId);
      if (!node) return;
      
      const updated = { ...node, ...updates };
      nodes = new Map(nodes);
      nodes.set(nodeId, updated);
      notify();
    },
    
    connect(
      sourceId: string,
      sourcePort: string,
      targetId: string,
      targetPort: string,
      type: EdgeType = 'audio'
    ): RoutingEdgeInfo {
      const edgeId = `edge-${++edgeIdCounter}`;
      
      const edge: RoutingEdgeInfo = {
        id: edgeId,
        from: sourceId,
        to: targetId,
        type,
        sourcePort,
        targetPort,
        gain: 1.0,
        active: true,
      };
      
      const undo = getUndoStack();
      
      edges = [...edges, edge];
      notify();
      
      undo.push({
        type: 'routing:connect',
        description: 'Connect nodes',
        undo: () => {
          edges = edges.filter(e => e.id !== edgeId);
          notify();
        },
        redo: () => {
          edges = [...edges, edge];
          notify();
        },
      });
      
      return edge;
    },
    
    disconnect(edgeId: string): void {
      const edge = edges.find(e => e.id === edgeId);
      if (!edge) return;
      
      const undo = getUndoStack();
      
      edges = edges.filter(e => e.id !== edgeId);
      notify();
      
      undo.push({
        type: 'routing:disconnect',
        description: 'Disconnect nodes',
        undo: () => {
          edges = [...edges, edge];
          notify();
        },
        redo: () => {
          edges = edges.filter(e => e.id !== edgeId);
          notify();
        },
      });
    },
    
    disconnectNode(nodeId: string): void {
      const removedEdges = edges.filter(e => e.from === nodeId || e.to === nodeId);
      if (removedEdges.length === 0) return;
      
      const undo = getUndoStack();
      
      edges = edges.filter(e => e.from !== nodeId && e.to !== nodeId);
      notify();
      
      undo.push({
        type: 'routing:disconnect-node',
        description: 'Disconnect all node connections',
        undo: () => {
          edges = [...edges, ...removedEdges];
          notify();
        },
        redo: () => {
          edges = edges.filter(e => e.from !== nodeId && e.to !== nodeId);
          notify();
        },
      });
    },
    
    setEdgeGain(edgeId: string, gain: number): void {
      const edgeIndex = edges.findIndex(e => e.id === edgeId);
      if (edgeIndex === -1) return;

      const edge = edges[edgeIndex]!;
      edges = [
        ...edges.slice(0, edgeIndex),
        { ...edge, gain } as RoutingEdgeInfo,
        ...edges.slice(edgeIndex + 1),
      ];
      notify();
    },
    
    setNodeBypassed(nodeId: string, bypassed: boolean): void {
      const node = nodes.get(nodeId);
      if (!node) return;
      
      nodes = new Map(nodes);
      nodes.set(nodeId, { ...node, bypassed });
      notify();
    },
    
    wouldCreateCycle(sourceId: string, targetId: string): boolean {
      // DFS to check if targetId can reach sourceId
      const visited = new Set<string>();
      const stack = [targetId];
      
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (current === sourceId) return true;
        if (visited.has(current)) continue;
        visited.add(current);
        
        // Add all nodes this node connects to
        for (const edge of edges) {
          if (edge.from === current) {
            stack.push(edge.to);
          }
        }
      }
      
      return false;
    },
    
    getProcessingOrder(): readonly string[] {
      // Kahn's algorithm for topological sort
      const inDegree = new Map<string, number>();
      
      // Initialize in-degree
      for (const nodeId of nodes.keys()) {
        inDegree.set(nodeId, 0);
      }
      
      // Count in-degree for each node
      for (const edge of edges) {
        inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
      }
      
      // Queue nodes with 0 in-degree
      const queue: string[] = [];
      for (const [nodeId, degree] of inDegree) {
        if (degree === 0) queue.push(nodeId);
      }
      
      // Process queue
      const result: string[] = [];
      while (queue.length > 0) {
        const nodeId = queue.shift()!;
        result.push(nodeId);
        
        // Decrease in-degree for connected nodes
        for (const edge of edges) {
          if (edge.from === nodeId) {
            const newDegree = (inDegree.get(edge.to) ?? 1) - 1;
            inDegree.set(edge.to, newDegree);
            if (newDegree === 0) {
              queue.push(edge.to);
            }
          }
        }
      }
      
      return result;
    },
    
    subscribe(callback: RoutingGraphCallback): SubscriptionId {
      const id = generateSubscriptionId();
      subscriptions.set(id, callback);
      return id;
    },
    
    unsubscribe(subscriptionId: SubscriptionId): boolean {
      return subscriptions.delete(subscriptionId);
    },
  };
  
  return store;
}

// ============================================================================
// SINGLETON
// ============================================================================

let _routingGraph: RoutingGraphStore | null = null;

/**
 * Gets the shared routing graph singleton.
 */
export function getRoutingGraph(): RoutingGraphStore {
  if (!_routingGraph) {
    _routingGraph = createRoutingGraphStore();
  }
  return _routingGraph;
}

/**
 * Resets the routing graph (for testing).
 */
export function resetRoutingGraph(): void {
  _routingGraph = null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a deck node.
 */
export function createDeckNode(
  id: string,
  name: string,
  position?: { x: number; y: number }
): RoutingNodeInfo {
  return {
    id,
    type: 'deck',
    name,
    ...(position !== undefined && { position }),
    inputs: [
      { id: 'midi-in', name: 'MIDI In', type: 'midi' },
    ],
    outputs: [
      { id: 'audio-out', name: 'Audio Out', type: 'audio', channels: 2 },
      { id: 'midi-out', name: 'MIDI Out', type: 'midi' },
    ],
    bypassed: false,
  };
}

/**
 * Creates an instrument node.
 */
export function createInstrumentNode(
  id: string,
  name: string,
  position?: { x: number; y: number }
): RoutingNodeInfo {
  return {
    id,
    type: 'instrument',
    name,
    ...(position !== undefined && { position }),
    inputs: [
      { id: 'midi-in', name: 'MIDI In', type: 'midi' },
    ],
    outputs: [
      { id: 'audio-out-l', name: 'Left', type: 'audio', channels: 1 },
      { id: 'audio-out-r', name: 'Right', type: 'audio', channels: 1 },
    ],
    bypassed: false,
  };
}

/**
 * Creates an effect node.
 */
export function createEffectNode(
  id: string,
  name: string,
  position?: { x: number; y: number }
): RoutingNodeInfo {
  return {
    id,
    type: 'effect',
    name,
    ...(position !== undefined && { position }),
    inputs: [
      { id: 'audio-in-l', name: 'Left In', type: 'audio', channels: 1 },
      { id: 'audio-in-r', name: 'Right In', type: 'audio', channels: 1 },
    ],
    outputs: [
      { id: 'audio-out-l', name: 'Left Out', type: 'audio', channels: 1 },
      { id: 'audio-out-r', name: 'Right Out', type: 'audio', channels: 1 },
    ],
    bypassed: false,
  };
}

/**
 * Creates a mixer/output node.
 */
export function createMixerNode(
  id: string,
  name: string,
  inputCount: number = 8,
  position?: { x: number; y: number }
): RoutingNodeInfo {
  const inputs: PortInfo[] = [];
  for (let i = 0; i < inputCount; i++) {
    inputs.push({ id: `input-${i}`, name: `Input ${i + 1}`, type: 'audio', channels: 2 });
  }

  return {
    id,
    type: 'mixer',
    name,
    ...(position !== undefined && { position }),
    inputs,
    outputs: [
      { id: 'main-out-l', name: 'Main L', type: 'audio', channels: 1 },
      { id: 'main-out-r', name: 'Main R', type: 'audio', channels: 1 },
    ],
    bypassed: false,
  };
}
