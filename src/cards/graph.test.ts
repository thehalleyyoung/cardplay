/**
 * @fileoverview Tests for Graph Routing.
 */

import { describe, it, expect } from 'vitest';
import {
  createGraph,
  createGraphNode,
  createGraphEdge,
  graphAddNode,
  graphRemoveNode,
  graphConnect,
  graphDisconnect,
  graphValidate,
  graphTopologicalSort,
  graphFindPath,
  graphCompile,
  graphSnapshot,
  graphRestore,
  graphToJSON,
  graphFromJSON,
  graphAutoLayout,
  graphMinimap,
  graphInspector,
  graphOptimize,
  graphToCard,
} from './graph';
import {
  pureCard,
  createCardMeta,
  createSignature,
  createPort,
  PortTypes,
  createCardContext,
} from './card';
import type { Transport, EngineRef } from './card';
import { asTick } from '../types/primitives';

// ============================================================================
// HELPERS
// ============================================================================

const mockTransport: Transport = {
  playing: true,
  recording: false,
  tempo: 120,
  timeSignature: [4, 4],
  looping: false,
};

const mockEngine: EngineRef = {
  sampleRate: 44100,
  bufferSize: 256,
};

const mockContext = createCardContext(asTick(0), mockTransport, mockEngine);

const doubleCard = pureCard<number, number>(
  createCardMeta('double', 'Double', 'transforms'),
  createSignature(
    [createPort('in', PortTypes.NUMBER)],
    [createPort('out', PortTypes.NUMBER)]
  ),
  (x) => x * 2
);

const addOneCard = pureCard<number, number>(
  createCardMeta('add-one', 'Add One', 'transforms'),
  createSignature(
    [createPort('in', PortTypes.NUMBER)],
    [createPort('out', PortTypes.NUMBER)]
  ),
  (x) => x + 1
);

// ============================================================================
// FACTORY TESTS
// ============================================================================

describe('createGraph', () => {
  it('should create an empty graph', () => {
    const graph = createGraph();
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
  });

  it('should apply metadata', () => {
    const graph = createGraph({ name: 'My Graph' });
    expect(graph.meta.name).toBe('My Graph');
  });
});

describe('createGraphNode', () => {
  it('should create a node with card ID', () => {
    const node = createGraphNode('double');
    expect(node.cardId).toBe('double');
    expect(node.position).toEqual({ x: 0, y: 0 });
  });

  it('should accept position', () => {
    const node = createGraphNode('double', { x: 100, y: 50 });
    expect(node.position).toEqual({ x: 100, y: 50 });
  });
});

// ============================================================================
// NODE OPERATIONS
// ============================================================================

describe('graphAddNode', () => {
  it('should add node to graph', () => {
    const graph = createGraph();
    const node = createGraphNode('double');
    const newGraph = graphAddNode(graph, node);
    
    expect(newGraph.nodes).toHaveLength(1);
    expect(newGraph.nodes[0]!.cardId).toBe('double');
  });

  it('should throw on duplicate ID', () => {
    const graph = createGraph();
    const node = createGraphNode('double');
    const newGraph = graphAddNode(graph, node);
    
    expect(() => graphAddNode(newGraph, node)).toThrow();
  });
});

describe('graphRemoveNode', () => {
  it('should remove node and its edges', () => {
    let graph = createGraph();
    const node1 = createGraphNode('double');
    const node2 = createGraphNode('add-one');
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    
    expect(graph.edges).toHaveLength(1);
    
    graph = graphRemoveNode(graph, node1.id);
    
    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toHaveLength(0);
  });

  it('should throw on missing node', () => {
    const graph = createGraph();
    expect(() => graphRemoveNode(graph, 'nonexistent')).toThrow();
  });
});

// ============================================================================
// EDGE OPERATIONS
// ============================================================================

describe('graphConnect', () => {
  it('should connect two nodes', () => {
    let graph = createGraph();
    const node1 = createGraphNode('double');
    const node2 = createGraphNode('add-one');
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]!.source).toBe(node1.id);
    expect(graph.edges[0]!.target).toBe(node2.id);
  });

  it('should not create duplicate edges', () => {
    let graph = createGraph();
    const node1 = createGraphNode('double');
    const node2 = createGraphNode('add-one');
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    
    expect(graph.edges).toHaveLength(1);
  });

  it('should throw on missing source node', () => {
    let graph = createGraph();
    const node = createGraphNode('double');
    graph = graphAddNode(graph, node);
    
    expect(() => graphConnect(graph, 'missing', node.id, 'out', 'in')).toThrow();
  });
});

describe('graphDisconnect', () => {
  it('should remove edge by ID', () => {
    let graph = createGraph();
    const node1 = createGraphNode('double');
    const node2 = createGraphNode('add-one');
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    
    const edgeId = graph.edges[0]!.id;
    graph = graphDisconnect(graph, edgeId);
    
    expect(graph.edges).toHaveLength(0);
  });

  it('should throw on missing edge', () => {
    const graph = createGraph();
    expect(() => graphDisconnect(graph, 'nonexistent')).toThrow();
  });
});

// ============================================================================
// VALIDATION
// ============================================================================

describe('graphValidate', () => {
  it('should validate empty graph', () => {
    const graph = createGraph();
    const result = graphValidate(graph);
    expect(result.valid).toBe(true);
  });

  it('should detect cycles', () => {
    let graph = createGraph();
    const node1 = createGraphNode('a');
    const node2 = createGraphNode('b');
    const node3 = createGraphNode('c');
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphAddNode(graph, node3);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    graph = graphConnect(graph, node2.id, node3.id, 'out', 'in');
    graph = graphConnect(graph, node3.id, node1.id, 'out', 'in');
    
    const result = graphValidate(graph);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.type === 'cycle')).toBe(true);
  });

  it('should detect disconnected components', () => {
    let graph = createGraph();
    const node1 = createGraphNode('a');
    const node2 = createGraphNode('b');
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    // No edges connecting them
    
    const result = graphValidate(graph);
    expect(result.warnings.some(w => w.includes('disconnected'))).toBe(true);
  });
});

// ============================================================================
// TOPOLOGICAL SORT
// ============================================================================

describe('graphTopologicalSort', () => {
  it('should sort DAG', () => {
    let graph = createGraph();
    const node1 = createGraphNode('a');
    const node2 = createGraphNode('b');
    const node3 = createGraphNode('c');
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphAddNode(graph, node3);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    graph = graphConnect(graph, node2.id, node3.id, 'out', 'in');
    
    const sorted = graphTopologicalSort(graph);
    
    expect(sorted).not.toBeNull();
    expect(sorted).toHaveLength(3);
    expect(sorted!.indexOf(node1.id)).toBeLessThan(sorted!.indexOf(node2.id));
    expect(sorted!.indexOf(node2.id)).toBeLessThan(sorted!.indexOf(node3.id));
  });

  it('should return null for cyclic graph', () => {
    let graph = createGraph();
    const node1 = createGraphNode('a');
    const node2 = createGraphNode('b');
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    graph = graphConnect(graph, node2.id, node1.id, 'out', 'in');
    
    const sorted = graphTopologicalSort(graph);
    expect(sorted).toBeNull();
  });
});

// ============================================================================
// PATH FINDING
// ============================================================================

describe('graphFindPath', () => {
  it('should find path between nodes', () => {
    let graph = createGraph();
    const node1 = createGraphNode('a');
    const node2 = createGraphNode('b');
    const node3 = createGraphNode('c');
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphAddNode(graph, node3);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    graph = graphConnect(graph, node2.id, node3.id, 'out', 'in');
    
    const path = graphFindPath(graph, node1.id, node3.id);
    
    expect(path).toEqual([node1.id, node2.id, node3.id]);
  });

  it('should return null when no path exists', () => {
    let graph = createGraph();
    const node1 = createGraphNode('a');
    const node2 = createGraphNode('b');
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    // No edge connecting them
    
    const path = graphFindPath(graph, node1.id, node2.id);
    expect(path).toBeNull();
  });

  it('should return single node for same source/target', () => {
    let graph = createGraph();
    const node = createGraphNode('a');
    graph = graphAddNode(graph, node);
    
    const path = graphFindPath(graph, node.id, node.id);
    expect(path).toEqual([node.id]);
  });
});

// ============================================================================
// COMPILATION
// ============================================================================

describe('graphCompile', () => {
  it('should compile to execution plan', () => {
    let graph = createGraph();
    const node1 = createGraphNode('double');
    const node2 = createGraphNode('add-one');
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    
    const plan = graphCompile(graph);
    
    expect(plan).not.toBeNull();
    expect(plan!.steps).toHaveLength(2);
    expect(plan!.inputs).toContain(node1.id);
    expect(plan!.outputs).toContain(node2.id);
  });

  it('should return null for cyclic graph', () => {
    let graph = createGraph();
    const node1 = createGraphNode('a');
    const node2 = createGraphNode('b');
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    graph = graphConnect(graph, node2.id, node1.id, 'out', 'in');
    
    const plan = graphCompile(graph);
    expect(plan).toBeNull();
  });
});

// ============================================================================
// SNAPSHOT
// ============================================================================

describe('graphSnapshot/graphRestore', () => {
  it('should snapshot and restore graph', () => {
    let graph = createGraph({ name: 'Test' });
    const node = createGraphNode('double');
    graph = graphAddNode(graph, node);
    
    const snapshot = graphSnapshot(graph);
    
    // Modify graph
    graph = graphRemoveNode(graph, node.id);
    expect(graph.nodes).toHaveLength(0);
    
    // Restore
    graph = graphRestore(snapshot);
    expect(graph.nodes).toHaveLength(1);
    expect(graph.meta.name).toBe('Test');
  });
});

// ============================================================================
// SERIALIZATION
// ============================================================================

describe('graphToJSON/graphFromJSON', () => {
  it('should serialize and deserialize graph', () => {
    let graph = createGraph({ name: 'Test Graph' });
    const node1 = createGraphNode('double', { x: 100, y: 50 });
    const node2 = createGraphNode('add-one', { x: 300, y: 50 });
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    
    const json = graphToJSON(graph);
    expect(json.nodes).toHaveLength(2);
    expect(json.edges).toHaveLength(1);
    
    const restored = graphFromJSON(json);
    expect(restored.nodes).toHaveLength(2);
    expect(restored.edges).toHaveLength(1);
    expect(restored.meta.name).toBe('Test Graph');
  });
});

// ============================================================================
// AUTO LAYOUT
// ============================================================================

describe('graphAutoLayout', () => {
  it('should layout nodes by layer', () => {
    let graph = createGraph();
    const node1 = createGraphNode('a', { x: 0, y: 0 });
    const node2 = createGraphNode('b', { x: 0, y: 0 });
    const node3 = createGraphNode('c', { x: 0, y: 0 });
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphAddNode(graph, node3);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    graph = graphConnect(graph, node2.id, node3.id, 'out', 'in');
    
    const laid = graphAutoLayout(graph);
    
    // Check that nodes are positioned in layers
    const pos1 = laid.nodes.find(n => n.id === node1.id)!.position;
    const pos2 = laid.nodes.find(n => n.id === node2.id)!.position;
    const pos3 = laid.nodes.find(n => n.id === node3.id)!.position;
    
    expect(pos1.x).toBeLessThan(pos2.x);
    expect(pos2.x).toBeLessThan(pos3.x);
  });
});

// ============================================================================
// MINIMAP
// ============================================================================

describe('graphMinimap', () => {
  it('should generate minimap', () => {
    let graph = createGraph();
    const node1 = createGraphNode('a', { x: 0, y: 0 });
    const node2 = createGraphNode('b', { x: 100, y: 100 });
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    
    const minimap = graphMinimap(graph);
    
    expect(minimap.nodePositions.size).toBe(2);
    expect(minimap.edgePaths).toHaveLength(1);
    expect(minimap.bounds.width).toBe(100);
    expect(minimap.bounds.height).toBe(100);
  });

  it('should handle empty graph', () => {
    const graph = createGraph();
    const minimap = graphMinimap(graph);
    
    expect(minimap.nodePositions.size).toBe(0);
    expect(minimap.bounds.width).toBe(0);
  });
});

// ============================================================================
// INSPECTOR
// ============================================================================

describe('graphInspector', () => {
  it('should create inspection data', () => {
    let graph = createGraph();
    const node1 = createGraphNode('double', { x: 0, y: 0 }, doubleCard);
    const node2 = createGraphNode('add-one', { x: 100, y: 0 }, addOneCard);
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    
    const inspector = graphInspector(graph);
    
    const node1Info = inspector.nodeInfo.get(node1.id);
    expect(node1Info).toBeDefined();
    expect(node1Info!.outgoingEdges).toHaveLength(1);
    expect(node1Info!.outputPorts).toContain('out');
    
    const edgeId = graph.edges[0]!.id;
    const edgeInspect = inspector.edgeInfo.get(edgeId);
    expect(edgeInspect).toBeDefined();
    expect(edgeInspect!.isValid).toBe(true);
  });
});

// ============================================================================
// OPTIMIZATION
// ============================================================================

describe('graphOptimize', () => {
  it('should remove no-op nodes', () => {
    let graph = createGraph();
    const node1 = createGraphNode('a', { x: 0, y: 0 }, doubleCard);
    const node2 = createGraphNode('noop', { x: 50, y: 0 }, doubleCard);
    const node3 = createGraphNode('b', { x: 100, y: 0 }, addOneCard);
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphAddNode(graph, node3);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    graph = graphConnect(graph, node2.id, node3.id, 'out', 'in');
    
    // Mark node2 as a no-op
    const optimized = graphOptimize(graph, (n) => n.id === node2.id);
    
    expect(optimized.nodes).toHaveLength(2);
    expect(optimized.edges).toHaveLength(1);
    expect(optimized.edges[0]!.source).toBe(node1.id);
    expect(optimized.edges[0]!.target).toBe(node3.id);
  });
});

// ============================================================================
// GRAPH TO CARD
// ============================================================================

describe('graphToCard', () => {
  it('should convert simple graph to card', () => {
    let graph = createGraph({ name: 'Double Then Add' });
    const node1 = createGraphNode('double', { x: 0, y: 0 }, doubleCard);
    const node2 = createGraphNode('add-one', { x: 100, y: 0 }, addOneCard);
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    
    const card = graphToCard<number, number>(graph);
    
    expect(card).not.toBeNull();
    const result = card!.process(5, mockContext);
    expect(result.output).toBe(11); // (5 * 2) + 1
  });

  it('should return null for cyclic graph', () => {
    let graph = createGraph();
    const node1 = createGraphNode('a');
    const node2 = createGraphNode('b');
    
    graph = graphAddNode(graph, node1);
    graph = graphAddNode(graph, node2);
    graph = graphConnect(graph, node1.id, node2.id, 'out', 'in');
    graph = graphConnect(graph, node2.id, node1.id, 'out', 'in');
    
    const card = graphToCard(graph);
    expect(card).toBeNull();
  });
});
