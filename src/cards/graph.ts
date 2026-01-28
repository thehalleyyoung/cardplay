/**
 * @fileoverview Graph Routing Implementation.
 * 
 * Graphs are directed acyclic graphs of cards and stacks for complex routing.
 * 
 * @module @cardplay/core/cards/graph
 */

import type {
  Card,
  CardContext,
  Port,
} from './card';
import {
  createCard,
  createCardMeta,
} from './card';

// ============================================================================
// GRAPH TYPES
// ============================================================================

/**
 * Position in 2D space for layout.
 */
export interface Position {
  readonly x: number;
  readonly y: number;
}

/**
 * Graph node wrapping a card or stack.
 */
export interface GraphNode {
  /** Unique node ID */
  readonly id: string;
  /** Card ID (references registry) */
  readonly cardId: string;
  /** The card instance (optional) */
  readonly card?: Card<unknown, unknown> | undefined;
  /** Node position for layout */
  readonly position: Position;
  /** Custom data (optional) */
  readonly data?: Record<string, unknown> | undefined;
}

/**
 * Graph edge connecting two nodes.
 */
export interface GraphEdge {
  /** Unique edge ID */
  readonly id: string;
  /** Source node ID */
  readonly source: string;
  /** Target node ID */
  readonly target: string;
  /** Source port name */
  readonly sourcePort: string;
  /** Target port name */
  readonly targetPort: string;
  /** Edge metadata (optional) */
  readonly data?: Record<string, unknown> | undefined;
}

/**
 * Graph structure with nodes and edges.
 */
export interface Graph {
  /** Graph ID */
  readonly id: string;
  /** All nodes */
  readonly nodes: readonly GraphNode[];
  /** All edges */
  readonly edges: readonly GraphEdge[];
  /** Metadata */
  readonly meta: GraphMeta;
}

/**
 * Graph metadata.
 */
export interface GraphMeta {
  readonly name?: string;
  readonly description?: string;
  readonly version?: string;
}

/**
 * Result of graph validation.
 */
export interface GraphValidation {
  readonly valid: boolean;
  readonly errors: readonly GraphError[];
  readonly warnings: readonly string[];
}

/**
 * Graph error with context.
 */
export interface GraphError {
  readonly type: 'cycle' | 'disconnected' | 'invalid_port' | 'missing_node';
  readonly message: string;
  readonly nodeIds?: readonly string[];
  readonly edgeIds?: readonly string[];
}

/**
 * Graph snapshot for undo/redo.
 */
export interface GraphSnapshot {
  readonly id: string;
  readonly timestamp: number;
  readonly graph: Graph;
}

/**
 * Execution plan from compiled graph.
 */
export interface ExecutionPlan {
  /** Ordered steps */
  readonly steps: readonly ExecutionStep[];
  /** Input node IDs */
  readonly inputs: readonly string[];
  /** Output node IDs */
  readonly outputs: readonly string[];
}

/**
 * Single execution step.
 */
export interface ExecutionStep {
  readonly nodeId: string;
  readonly dependencies: readonly string[];
}

/**
 * Minimap representation.
 */
export interface GraphMinimap {
  readonly bounds: { x: number; y: number; width: number; height: number };
  readonly nodePositions: ReadonlyMap<string, Position>;
  readonly edgePaths: readonly { id: string; path: Position[] }[];
}

/**
 * Debug inspector view.
 */
export interface GraphInspector {
  readonly nodeInfo: ReadonlyMap<string, NodeInspection>;
  readonly edgeInfo: ReadonlyMap<string, EdgeInspection>;
}

/**
 * Node inspection data.
 */
export interface NodeInspection {
  readonly id: string;
  readonly cardId: string;
  readonly inputPorts: readonly string[];
  readonly outputPorts: readonly string[];
  readonly incomingEdges: readonly string[];
  readonly outgoingEdges: readonly string[];
  readonly degree: number;
}

/**
 * Edge inspection data.
 */
export interface EdgeInspection {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly sourcePort: string;
  readonly targetPort: string;
  readonly isValid: boolean;
}

/**
 * JSON representation of a graph.
 */
export interface GraphJSON {
  readonly id: string;
  readonly nodes: readonly {
    id: string;
    cardId: string;
    position: Position;
    data?: Record<string, unknown> | undefined;
  }[];
  readonly edges: readonly {
    id: string;
    source: string;
    target: string;
    sourcePort: string;
    targetPort: string;
    data?: Record<string, unknown> | undefined;
  }[];
  readonly meta: GraphMeta;
}

// ============================================================================
// ID GENERATION
// ============================================================================

let graphIdCounter = 0;

/**
 * Generate a unique graph ID.
 */
export function generateGraphId(): string {
  return `graph-${++graphIdCounter}-${Date.now().toString(36)}`;
}

let nodeIdCounter = 0;

/**
 * Generate a unique node ID.
 */
export function generateNodeId(): string {
  return `node-${++nodeIdCounter}-${Date.now().toString(36)}`;
}

let edgeIdCounter = 0;

/**
 * Generate a unique edge ID.
 */
export function generateEdgeId(): string {
  return `edge-${++edgeIdCounter}-${Date.now().toString(36)}`;
}

// ============================================================================
// GRAPH FACTORY
// ============================================================================

/**
 * Creates an empty graph.
 */
export function createGraph(meta?: GraphMeta): Graph {
  return Object.freeze({
    id: generateGraphId(),
    nodes: Object.freeze([]),
    edges: Object.freeze([]),
    meta: meta ?? {},
  });
}

/**
 * Creates a graph node.
 */
export function createGraphNode(
  cardId: string,
  position?: Position,
  card?: Card<unknown, unknown>,
  data?: Record<string, unknown>
): GraphNode {
  const node: GraphNode = {
    id: generateNodeId(),
    cardId,
    position: position ?? { x: 0, y: 0 },
  };
  
  if (card !== undefined) {
    (node as { card: Card<unknown, unknown> }).card = card;
  }
  if (data !== undefined) {
    (node as { data: Record<string, unknown> }).data = data;
  }
  
  return Object.freeze(node);
}

/**
 * Creates a graph edge.
 */
export function createGraphEdge(
  source: string,
  target: string,
  sourcePort: string,
  targetPort: string,
  data?: Record<string, unknown>
): GraphEdge {
  const edge: GraphEdge = {
    id: generateEdgeId(),
    source,
    target,
    sourcePort,
    targetPort,
  };
  
  if (data !== undefined) {
    (edge as { data: Record<string, unknown> }).data = data;
  }
  
  return Object.freeze(edge);
}

// ============================================================================
// GRAPH OPERATIONS
// ============================================================================

/**
 * Adds a node to the graph.
 */
export function graphAddNode(graph: Graph, node: GraphNode): Graph {
  // Check for duplicate ID
  if (graph.nodes.some(n => n.id === node.id)) {
    throw new Error(`Node with ID ${node.id} already exists`);
  }
  
  return Object.freeze({
    ...graph,
    nodes: Object.freeze([...graph.nodes, node]),
  });
}

/**
 * Removes a node and all its edges from the graph.
 */
export function graphRemoveNode(graph: Graph, nodeId: string): Graph {
  const node = graph.nodes.find(n => n.id === nodeId);
  if (!node) {
    throw new Error(`Node with ID ${nodeId} not found`);
  }
  
  // Remove node
  const nodes = graph.nodes.filter(n => n.id !== nodeId);
  
  // Remove all edges connected to this node
  const edges = graph.edges.filter(
    e => e.source !== nodeId && e.target !== nodeId
  );
  
  return Object.freeze({
    ...graph,
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
  });
}

/**
 * Connects two nodes with an edge.
 */
export function graphConnect(
  graph: Graph,
  sourceNodeId: string,
  targetNodeId: string,
  sourcePort: string,
  targetPort: string
): Graph {
  // Validate nodes exist
  if (!graph.nodes.some(n => n.id === sourceNodeId)) {
    throw new Error(`Source node ${sourceNodeId} not found`);
  }
  if (!graph.nodes.some(n => n.id === targetNodeId)) {
    throw new Error(`Target node ${targetNodeId} not found`);
  }
  
  // Check for existing edge
  const existingEdge = graph.edges.find(
    e => e.source === sourceNodeId &&
         e.target === targetNodeId &&
         e.sourcePort === sourcePort &&
         e.targetPort === targetPort
  );
  if (existingEdge) {
    return graph; // Already connected
  }
  
  const edge = createGraphEdge(sourceNodeId, targetNodeId, sourcePort, targetPort);
  
  return Object.freeze({
    ...graph,
    edges: Object.freeze([...graph.edges, edge]),
  });
}

/**
 * Disconnects an edge by ID.
 */
export function graphDisconnect(graph: Graph, edgeId: string): Graph {
  const edge = graph.edges.find(e => e.id === edgeId);
  if (!edge) {
    throw new Error(`Edge with ID ${edgeId} not found`);
  }
  
  return Object.freeze({
    ...graph,
    edges: Object.freeze(graph.edges.filter(e => e.id !== edgeId)),
  });
}

// ============================================================================
// GRAPH VALIDATION
// ============================================================================

/**
 * Validates graph for cycles and connectivity.
 */
export function graphValidate(graph: Graph): GraphValidation {
  const errors: GraphError[] = [];
  const warnings: string[] = [];
  
  if (graph.nodes.length === 0) {
    warnings.push('Graph is empty');
    return { valid: true, errors, warnings };
  }
  
  // Check for missing node references in edges
  for (const edge of graph.edges) {
    if (!graph.nodes.some(n => n.id === edge.source)) {
      errors.push({
        type: 'missing_node',
        message: `Edge ${edge.id} references missing source node ${edge.source}`,
        edgeIds: [edge.id],
      });
    }
    if (!graph.nodes.some(n => n.id === edge.target)) {
      errors.push({
        type: 'missing_node',
        message: `Edge ${edge.id} references missing target node ${edge.target}`,
        edgeIds: [edge.id],
      });
    }
  }
  
  // Detect cycles using DFS
  const cycleNodes = detectCycles(graph);
  if (cycleNodes.length > 0) {
    errors.push({
      type: 'cycle',
      message: `Graph contains cycle involving nodes: ${cycleNodes.join(', ')}`,
      nodeIds: cycleNodes,
    });
  }
  
  // Check for disconnected subgraphs
  const components = findConnectedComponents(graph);
  if (components.length > 1) {
    warnings.push(`Graph has ${components.length} disconnected components`);
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Detects cycles in the graph using DFS.
 */
function detectCycles(graph: Graph): string[] {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycleNodes: string[] = [];
  
  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    // Get all outgoing edges
    const outgoing = graph.edges.filter(e => e.source === nodeId);
    
    for (const edge of outgoing) {
      if (!visited.has(edge.target)) {
        if (dfs(edge.target)) {
          cycleNodes.push(nodeId);
          return true;
        }
      } else if (recursionStack.has(edge.target)) {
        cycleNodes.push(edge.target);
        return true;
      }
    }
    
    recursionStack.delete(nodeId);
    return false;
  }
  
  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }
  
  return cycleNodes;
}

/**
 * Finds connected components in the graph.
 */
function findConnectedComponents(graph: Graph): string[][] {
  const visited = new Set<string>();
  const components: string[][] = [];
  
  // Build adjacency list (undirected)
  const adjacency = new Map<string, Set<string>>();
  for (const node of graph.nodes) {
    adjacency.set(node.id, new Set());
  }
  for (const edge of graph.edges) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }
  
  function bfs(startId: string): string[] {
    const component: string[] = [];
    const queue = [startId];
    visited.add(startId);
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      component.push(nodeId);
      
      for (const neighbor of adjacency.get(nodeId) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    
    return component;
  }
  
  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      components.push(bfs(node.id));
    }
  }
  
  return components;
}

// ============================================================================
// TOPOLOGICAL SORT
// ============================================================================

/**
 * Topologically sorts graph nodes for execution order.
 * Returns null if graph has cycles.
 */
export function graphTopologicalSort(graph: Graph): string[] | null {
  // Kahn's algorithm
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  
  // Initialize
  for (const node of graph.nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }
  
  // Build adjacency and compute in-degrees
  for (const edge of graph.edges) {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }
  
  // Start with nodes of in-degree 0
  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }
  
  const sorted: string[] = [];
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    sorted.push(nodeId);
    
    for (const neighbor of adjacency.get(nodeId) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }
  
  // If we couldn't sort all nodes, there's a cycle
  if (sorted.length !== graph.nodes.length) {
    return null;
  }
  
  return sorted;
}

// ============================================================================
// PATH FINDING
// ============================================================================

/**
 * Finds a path from source to target node.
 * Returns null if no path exists.
 */
export function graphFindPath(
  graph: Graph,
  sourceId: string,
  targetId: string
): string[] | null {
  if (sourceId === targetId) {
    return [sourceId];
  }
  
  // BFS for shortest path
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue = [sourceId];
  visited.add(sourceId);
  
  // Build adjacency
  const adjacency = new Map<string, string[]>();
  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of graph.edges) {
    adjacency.get(edge.source)?.push(edge.target);
  }
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    
    for (const neighbor of adjacency.get(nodeId) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, nodeId);
        
        if (neighbor === targetId) {
          // Reconstruct path
          const path: string[] = [targetId];
          let current = targetId;
          while (parent.has(current)) {
            current = parent.get(current)!;
            path.unshift(current);
          }
          return path;
        }
        
        queue.push(neighbor);
      }
    }
  }
  
  return null; // No path found
}

// ============================================================================
// GRAPH COMPILATION
// ============================================================================

/**
 * Compiles graph to an execution plan.
 */
export function graphCompile(graph: Graph): ExecutionPlan | null {
  const sorted = graphTopologicalSort(graph);
  if (!sorted) {
    return null; // Graph has cycles
  }
  
  // Build dependency map
  const dependencies = new Map<string, string[]>();
  for (const node of graph.nodes) {
    const deps = graph.edges
      .filter(e => e.target === node.id)
      .map(e => e.source);
    dependencies.set(node.id, deps);
  }
  
  // Create steps
  const steps: ExecutionStep[] = sorted.map(nodeId => ({
    nodeId,
    dependencies: dependencies.get(nodeId) ?? [],
  }));
  
  // Find inputs (nodes with no incoming edges)
  const inputs = graph.nodes
    .filter(n => !graph.edges.some(e => e.target === n.id))
    .map(n => n.id);
  
  // Find outputs (nodes with no outgoing edges)
  const outputs = graph.nodes
    .filter(n => !graph.edges.some(e => e.source === n.id))
    .map(n => n.id);
  
  return { steps, inputs, outputs };
}

// ============================================================================
// SNAPSHOT
// ============================================================================

let snapshotIdCounter = 0;

/**
 * Creates a snapshot of the graph.
 */
export function graphSnapshot(graph: Graph): GraphSnapshot {
  return Object.freeze({
    id: `snapshot-${++snapshotIdCounter}`,
    timestamp: Date.now(),
    graph: structuredClone(graph) as Graph,
  });
}

/**
 * Restores a graph from a snapshot.
 */
export function graphRestore(snapshot: GraphSnapshot): Graph {
  return structuredClone(snapshot.graph) as Graph;
}

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Converts graph to JSON.
 */
export function graphToJSON(graph: Graph): GraphJSON {
  return {
    id: graph.id,
    nodes: graph.nodes.map(n => {
      const nodeJson: {
        id: string;
        cardId: string;
        position: Position;
        data?: Record<string, unknown>;
      } = {
        id: n.id,
        cardId: n.cardId,
        position: { ...n.position },
      };
      if (n.data !== undefined) {
        nodeJson.data = { ...n.data };
      }
      return nodeJson;
    }),
    edges: graph.edges.map(e => {
      const edgeJson: {
        id: string;
        source: string;
        target: string;
        sourcePort: string;
        targetPort: string;
        data?: Record<string, unknown>;
      } = {
        id: e.id,
        source: e.source,
        target: e.target,
        sourcePort: e.sourcePort,
        targetPort: e.targetPort,
      };
      if (e.data !== undefined) {
        edgeJson.data = { ...e.data };
      }
      return edgeJson;
    }),
    meta: { ...graph.meta },
  };
}

/**
 * Creates graph from JSON.
 */
export function graphFromJSON(
  json: GraphJSON,
  cardResolver?: (cardId: string) => Card<unknown, unknown> | undefined
): Graph {
  const nodes: GraphNode[] = json.nodes.map(n => {
    const node: GraphNode = {
      id: n.id,
      cardId: n.cardId,
      position: { ...n.position },
    };
    const resolvedCard = cardResolver?.(n.cardId);
    if (resolvedCard !== undefined) {
      (node as { card: Card<unknown, unknown> }).card = resolvedCard;
    }
    if (n.data !== undefined) {
      (node as { data: Record<string, unknown> }).data = n.data;
    }
    return node;
  });
  
  const edges: GraphEdge[] = json.edges.map(e => {
    const edge: GraphEdge = {
      id: e.id,
      source: e.source,
      target: e.target,
      sourcePort: e.sourcePort,
      targetPort: e.targetPort,
    };
    if (e.data !== undefined) {
      (edge as { data: Record<string, unknown> }).data = e.data;
    }
    return edge;
  });
  
  return Object.freeze({
    id: json.id,
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
    meta: { ...json.meta },
  });
}

// ============================================================================
// AUTO LAYOUT
// ============================================================================

/**
 * Auto-layouts graph nodes using topological ordering.
 */
export function graphAutoLayout(
  graph: Graph,
  options?: { nodeWidth?: number; nodeHeight?: number; padding?: number }
): Graph {
  const sorted = graphTopologicalSort(graph);
  if (!sorted) {
    return graph; // Can't layout cyclic graph
  }
  
  const nodeWidth = options?.nodeWidth ?? 200;
  const nodeHeight = options?.nodeHeight ?? 100;
  const padding = options?.padding ?? 50;
  
  // Calculate layers
  const layers = new Map<string, number>();
  
  for (const nodeId of sorted) {
    // Find max layer of predecessors
    const predecessors = graph.edges
      .filter(e => e.target === nodeId)
      .map(e => e.source);
    
    const maxPredLayer = predecessors.length > 0
      ? Math.max(...predecessors.map(p => layers.get(p) ?? 0))
      : -1;
    
    layers.set(nodeId, maxPredLayer + 1);
  }
  
  // Group nodes by layer
  const layerGroups = new Map<number, string[]>();
  for (const [nodeId, layer] of layers) {
    if (!layerGroups.has(layer)) {
      layerGroups.set(layer, []);
    }
    layerGroups.get(layer)!.push(nodeId);
  }
  
  // Position nodes
  const positions = new Map<string, Position>();
  for (const [layer, nodeIds] of layerGroups) {
    for (let i = 0; i < nodeIds.length; i++) {
      positions.set(nodeIds[i]!, {
        x: layer * (nodeWidth + padding),
        y: i * (nodeHeight + padding),
      });
    }
  }
  
  // Update nodes with new positions
  const updatedNodes = graph.nodes.map(n => ({
    ...n,
    position: positions.get(n.id) ?? n.position,
  }));
  
  return Object.freeze({
    ...graph,
    nodes: Object.freeze(updatedNodes),
  });
}

// ============================================================================
// MINIMAP
// ============================================================================

/**
 * Generates minimap representation.
 */
export function graphMinimap(graph: Graph): GraphMinimap {
  if (graph.nodes.length === 0) {
    return {
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      nodePositions: new Map(),
      edgePaths: [],
    };
  }
  
  // Calculate bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of graph.nodes) {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x);
    maxY = Math.max(maxY, node.position.y);
  }
  
  // Node positions (normalized)
  const nodePositions = new Map<string, Position>();
  for (const node of graph.nodes) {
    nodePositions.set(node.id, { ...node.position });
  }
  
  // Edge paths (simple straight lines)
  const edgePaths = graph.edges.map(edge => {
    const sourceNode = graph.nodes.find(n => n.id === edge.source);
    const targetNode = graph.nodes.find(n => n.id === edge.target);
    
    const path: Position[] = [];
    if (sourceNode) {
      path.push({ ...sourceNode.position });
    }
    if (targetNode) {
      path.push({ ...targetNode.position });
    }
    
    return { id: edge.id, path };
  });
  
  return {
    bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    nodePositions,
    edgePaths,
  };
}

// ============================================================================
// INSPECTOR
// ============================================================================

/**
 * Creates debug inspector view.
 */
export function graphInspector(graph: Graph): GraphInspector {
  const nodeInfo = new Map<string, NodeInspection>();
  const edgeInfo = new Map<string, EdgeInspection>();
  
  for (const node of graph.nodes) {
    const incoming = graph.edges.filter(e => e.target === node.id);
    const outgoing = graph.edges.filter(e => e.source === node.id);
    
    // Get port names from card signature if available
    const inputPorts = node.card?.signature?.inputs?.map(p => p.name) ?? [];
    const outputPorts = node.card?.signature?.outputs?.map(p => p.name) ?? [];
    
    nodeInfo.set(node.id, {
      id: node.id,
      cardId: node.cardId,
      inputPorts,
      outputPorts,
      incomingEdges: incoming.map(e => e.id),
      outgoingEdges: outgoing.map(e => e.id),
      degree: incoming.length + outgoing.length,
    });
  }
  
  for (const edge of graph.edges) {
    const sourceNode = graph.nodes.find(n => n.id === edge.source);
    const targetNode = graph.nodes.find(n => n.id === edge.target);
    
    // Validate port names if cards have signatures
    let isValid = true;
    if (sourceNode?.card?.signature) {
      isValid = isValid && sourceNode.card.signature.outputs.some(
        p => p.name === edge.sourcePort
      );
    }
    if (targetNode?.card?.signature) {
      isValid = isValid && targetNode.card.signature.inputs.some(
        p => p.name === edge.targetPort
      );
    }
    
    edgeInfo.set(edge.id, {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourcePort: edge.sourcePort,
      targetPort: edge.targetPort,
      isValid,
    });
  }
  
  return { nodeInfo, edgeInfo };
}

// ============================================================================
// OPTIMIZATION
// ============================================================================

/**
 * Optimizes graph by removing no-op nodes.
 * A no-op is a node that passes through unchanged.
 */
export function graphOptimize(
  graph: Graph,
  isNoOp?: (node: GraphNode) => boolean
): Graph {
  // Default: identify nodes with same input and output types
  const checkNoOp = isNoOp ?? ((node: GraphNode) => {
    if (!node.card) return false;
    const sig = node.card.signature;
    // Simple heuristic: single input/output with same type
    if (sig.inputs.length === 1 && sig.outputs.length === 1) {
      return sig.inputs[0]!.type === sig.outputs[0]!.type;
    }
    return false;
  });
  
  // Find no-op nodes
  const noOpNodes = new Set<string>();
  for (const node of graph.nodes) {
    if (checkNoOp(node)) {
      // Only remove if it's a simple pass-through in the graph
      const incoming = graph.edges.filter(e => e.target === node.id);
      const outgoing = graph.edges.filter(e => e.source === node.id);
      
      // Must have exactly 1 input and 1 output connection
      if (incoming.length === 1 && outgoing.length === 1) {
        noOpNodes.add(node.id);
      }
    }
  }
  
  if (noOpNodes.size === 0) {
    return graph;
  }
  
  // Build new edges that bypass no-op nodes
  const newEdges: GraphEdge[] = [];
  const removedEdges = new Set<string>();
  
  for (const noOpId of noOpNodes) {
    const incoming = graph.edges.find(e => e.target === noOpId);
    const outgoing = graph.edges.find(e => e.source === noOpId);
    
    if (incoming && outgoing) {
      // Create bypass edge
      newEdges.push({
        id: generateEdgeId(),
        source: incoming.source,
        target: outgoing.target,
        sourcePort: incoming.sourcePort,
        targetPort: outgoing.targetPort,
      });
      
      removedEdges.add(incoming.id);
      removedEdges.add(outgoing.id);
    }
  }
  
  // Filter out no-op nodes and old edges
  const nodes = graph.nodes.filter(n => !noOpNodes.has(n.id));
  const edges = [
    ...graph.edges.filter(e => !removedEdges.has(e.id)),
    ...newEdges,
  ];
  
  return Object.freeze({
    ...graph,
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
  });
}

// ============================================================================
// GRAPH TO CARD
// ============================================================================

/**
 * Converts a graph to a single composite card.
 */
export function graphToCard<A, B>(graph: Graph): Card<A, B> | null {
  const plan = graphCompile(graph);
  if (!plan) {
    return null; // Can't compile cyclic graph
  }
  
  const meta = createCardMeta(
    `graph-${graph.id}`,
    graph.meta.name ?? 'Graph',
    'routing'
  );
  
  // Build signature from inputs/outputs
  const inputNodes = plan.inputs.map(id => graph.nodes.find(n => n.id === id));
  const outputNodes = plan.outputs.map(id => graph.nodes.find(n => n.id === id));
  
  const inputs: Port[] = [];
  const outputs: Port[] = [];
  
  for (const node of inputNodes) {
    if (node?.card?.signature) {
      inputs.push(...node.card.signature.inputs);
    }
  }
  
  for (const node of outputNodes) {
    if (node?.card?.signature) {
      outputs.push(...node.card.signature.outputs);
    }
  }
  
  return createCard<A, B>({
    meta,
    signature: { inputs, outputs, params: [] },
    process: (input: A, context: CardContext) => {
      // Execute graph in topological order
      const nodeOutputs = new Map<string, unknown>();
      
      for (const step of plan.steps) {
        const node = graph.nodes.find(n => n.id === step.nodeId);
        if (!node?.card) continue;
        
        // Gather inputs from dependencies
        let nodeInput: unknown = input;
        if (step.dependencies.length > 0) {
          // Use first dependency's output (simplified)
          nodeInput = nodeOutputs.get(step.dependencies[0]!);
        }
        
        const result = node.card.process(nodeInput, context);
        nodeOutputs.set(step.nodeId, result.output);
      }
      
      // Return last output's result
      const lastNodeId = plan.outputs[0];
      const output = lastNodeId ? nodeOutputs.get(lastNodeId) : input;
      
      return { output: output as B };
    },
  });
}
