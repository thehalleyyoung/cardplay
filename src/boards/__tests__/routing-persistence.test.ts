/**
 * @fileoverview Routing graph persistence integration tests
 * 
 * Tests that routing connections persist correctly and can be
 * created/deleted through the routing overlay.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getRoutingGraph, type EdgeType } from '../../state/routing-graph';

describe('Routing Persistence', () => {
  beforeEach(() => {
    // Reset routing graph before each test
    const graph = getRoutingGraph();
    // Clear any existing connections
    const edges = graph.getEdges();
    edges.forEach(edge => {
      graph.disconnect(edge.id);
    });
  });

  it('A084: should persist routing connection creation', () => {
    const graph = getRoutingGraph();
    
    // Add nodes first
    graph.addNode({
      id: 'instrument-1',
      type: 'instrument',
      name: 'Instrument 1',
      inputs: [],
      outputs: [{ id: 'audio-out', name: 'Audio Out', type: 'audio' }],
      bypassed: false
    });
    
    graph.addNode({
      id: 'mixer-track-1',
      type: 'mixer',
      name: 'Track 1',
      inputs: [{ id: 'audio-in', name: 'Audio In', type: 'audio' }],
      outputs: [],
      bypassed: false
    });
    
    // Create a connection
    const edge = graph.connect(
      'instrument-1',
      'audio-out',
      'mixer-track-1',
      'audio-in',
      'audio' as EdgeType
    );
    
    expect(edge).toBeDefined();
    expect(edge.id).toBeDefined();
    
    // Verify it persists in the graph
    const edges = graph.getEdges();
    const connection = edges.find(c => c.id === edge.id);
    
    expect(connection).toBeDefined();
    expect(connection?.from).toBe('instrument-1');
    expect(connection?.to).toBe('mixer-track-1');
    expect(connection?.type).toBe('audio');
  });

  it('A085: should handle routing connection deletion and cleanup', () => {
    const graph = getRoutingGraph();
    
    // Add nodes first
    graph.addNode({
      id: 'instrument-1',
      type: 'instrument',
      name: 'Instrument 1',
      inputs: [],
      outputs: [{ id: 'audio-out', name: 'Audio Out', type: 'audio' }],
      bypassed: false
    });
    
    graph.addNode({
      id: 'mixer-track-1',
      type: 'mixer',
      name: 'Track 1',
      inputs: [{ id: 'audio-in', name: 'Audio In', type: 'audio' }],
      outputs: [],
      bypassed: false
    });
    
    // Create a connection
    const edge = graph.connect(
      'instrument-1',
      'audio-out',
      'mixer-track-1',
      'audio-in',
      'audio' as EdgeType
    );
    
    // Verify it exists
    let edges = graph.getEdges();
    expect(edges.find(c => c.id === edge.id)).toBeDefined();
    
    // Delete the connection
    graph.disconnect(edge.id);
    
    // Verify it's cleaned up
    edges = graph.getEdges();
    expect(edges.find(c => c.id === edge.id)).toBeUndefined();
  });

  it('should validate connection type compatibility', () => {
    const graph = getRoutingGraph();
    
    // Add nodes with incompatible ports
    graph.addNode({
      id: 'instrument-1',
      type: 'instrument',
      name: 'Instrument 1',
      inputs: [],
      outputs: [{ id: 'audio-out', name: 'Audio Out', type: 'audio' }],
      bypassed: false
    });
    
    graph.addNode({
      id: 'midi-device',
      type: 'instrument',
      name: 'MIDI Device',
      inputs: [{ id: 'midi-in', name: 'MIDI In', type: 'midi' }],
      outputs: [],
      bypassed: false
    });
    
    // Try to connect audio to MIDI - should be rejected due to type mismatch
    expect(() => {
      graph.connect(
        'instrument-1',
        'audio-out',
        'midi-device',
        'midi-in',
        'audio' as EdgeType
      );
    }).toThrow(/incompatible|Cannot connect/i);
  });

  it('should handle multiple connections from one source', () => {
    const graph = getRoutingGraph();
    
    // Add nodes
    graph.addNode({
      id: 'instrument-1',
      type: 'instrument',
      name: 'Instrument 1',
      inputs: [],
      outputs: [{ id: 'audio-out', name: 'Audio Out', type: 'audio' }],
      bypassed: false
    });
    
    graph.addNode({
      id: 'mixer-track-1',
      type: 'mixer',
      name: 'Track 1',
      inputs: [{ id: 'audio-in', name: 'Audio In', type: 'audio' }],
      outputs: [],
      bypassed: false
    });
    
    graph.addNode({
      id: 'effect-1',
      type: 'effect',
      name: 'Effect 1',
      inputs: [{ id: 'audio-in', name: 'Audio In', type: 'audio' }],
      outputs: [],
      bypassed: false
    });
    
    // Create multiple connections from the same source
    const edge1 = graph.connect(
      'instrument-1',
      'audio-out',
      'mixer-track-1',
      'audio-in',
      'audio' as EdgeType
    );
    
    const edge2 = graph.connect(
      'instrument-1',
      'audio-out',
      'effect-1',
      'audio-in',
      'audio' as EdgeType
    );
    
    // Both should exist
    const edges = graph.getEdges();
    expect(edges.find(c => c.id === edge1.id)).toBeDefined();
    expect(edges.find(c => c.id === edge2.id)).toBeDefined();
  });

  it('should prevent circular connections', () => {
    const graph = getRoutingGraph();
    
    // Add nodes
    graph.addNode({
      id: 'node-a',
      type: 'effect',
      name: 'Node A',
      inputs: [{ id: 'in', name: 'Input', type: 'audio' }],
      outputs: [{ id: 'out', name: 'Output', type: 'audio' }],
      bypassed: false
    });
    
    graph.addNode({
      id: 'node-b',
      type: 'effect',
      name: 'Node B',
      inputs: [{ id: 'in', name: 'Input', type: 'audio' }],
      outputs: [{ id: 'out', name: 'Output', type: 'audio' }],
      bypassed: false
    });
    
    // Create a connection A -> B
    graph.connect('node-a', 'out', 'node-b', 'in', 'audio' as EdgeType);
    
    // Check if B -> A would create a cycle
    const wouldCycle = graph.wouldCreateCycle('node-b', 'node-a');
    
    expect(wouldCycle).toBe(true);
  });
});
