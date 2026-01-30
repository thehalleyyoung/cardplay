/**
 * @fileoverview Routing Graph Tests
 *
 * Change 218: Test cases for invalid connections and adapter-required connections.
 *
 * @module @cardplay/state/routing-graph.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRoutingGraphStore,
  type RoutingGraphStore,
  type RoutingNodeInfo,
} from './routing-graph';

function createTestNode(overrides: Partial<RoutingNodeInfo> & { id: string }): RoutingNodeInfo {
  return {
    type: 'instrument',
    name: overrides.id,
    inputs: [],
    outputs: [],
    bypassed: false,
    ...overrides,
  };
}

describe('RoutingGraphStore', () => {
  let store: RoutingGraphStore;

  beforeEach(() => {
    store = createRoutingGraphStore();
  });

  describe('connect validation (Change 215)', () => {
    it('should throw when source node does not exist', () => {
      const target = createTestNode({
        id: 'target',
        inputs: [{ id: 'in', name: 'In', type: 'audio' }],
      });
      store.addNode(target);

      expect(() =>
        store.connect('nonexistent', 'out', 'target', 'in', 'audio')
      ).toThrow("Source node 'nonexistent' not found");
    });

    it('should throw when target node does not exist', () => {
      const source = createTestNode({
        id: 'source',
        outputs: [{ id: 'out', name: 'Out', type: 'audio' }],
      });
      store.addNode(source);

      expect(() =>
        store.connect('source', 'out', 'nonexistent', 'in', 'audio')
      ).toThrow("Target node 'nonexistent' not found");
    });

    it('should connect nodes with matching port types', () => {
      store.addNode(createTestNode({
        id: 'src',
        outputs: [{ id: 'out', name: 'Out', type: 'audio' }],
      }));
      store.addNode(createTestNode({
        id: 'tgt',
        inputs: [{ id: 'in', name: 'In', type: 'audio' }],
      }));

      const edge = store.connect('src', 'out', 'tgt', 'in', 'audio');
      expect(edge.adapterId).toBeUndefined();
    });
  });

  describe('adapter-required connections (Change 216)', () => {
    it('should record adapterId when port types differ', () => {
      store.addNode(createTestNode({
        id: 'notes-src',
        outputs: [{ id: 'out', name: 'Notes Out', type: 'notes' }],
      }));
      store.addNode(createTestNode({
        id: 'midi-tgt',
        inputs: [{ id: 'in', name: 'MIDI In', type: 'midi' }],
      }));

      // notes→midi requires adapter per canonical port compatibility
      const edge = store.connect('notes-src', 'out', 'midi-tgt', 'in', 'notes');
      expect(edge.adapterId).toBe('adapter:notes-to-midi');
    });
  });

  describe('cycle detection', () => {
    it('should detect simple cycle', () => {
      store.addNode(createTestNode({ id: 'a', outputs: [{ id: 'out', name: 'Out', type: 'audio' }] }));
      store.addNode(createTestNode({ id: 'b', inputs: [{ id: 'in', name: 'In', type: 'audio' }], outputs: [{ id: 'out', name: 'Out', type: 'audio' }] }));

      store.connect('a', 'out', 'b', 'in', 'audio');

      expect(store.wouldCreateCycle('b', 'a')).toBe(true);
    });

    it('should allow non-cyclic connection', () => {
      store.addNode(createTestNode({ id: 'a', outputs: [{ id: 'out', name: 'Out', type: 'audio' }] }));
      store.addNode(createTestNode({ id: 'b', inputs: [{ id: 'in', name: 'In', type: 'audio' }], outputs: [{ id: 'out', name: 'Out', type: 'audio' }] }));
      store.addNode(createTestNode({ id: 'c', inputs: [{ id: 'in', name: 'In', type: 'audio' }] }));

      store.connect('a', 'out', 'b', 'in', 'audio');

      expect(store.wouldCreateCycle('b', 'c')).toBe(false);
    });
  });

  describe('edge management', () => {
    it('should disconnect edges', () => {
      store.addNode(createTestNode({ id: 'a', outputs: [{ id: 'out', name: 'Out', type: 'audio' }] }));
      store.addNode(createTestNode({ id: 'b', inputs: [{ id: 'in', name: 'In', type: 'audio' }] }));

      const edge = store.connect('a', 'out', 'b', 'in', 'audio');
      store.disconnect(edge.id);

      expect(store.getEdges()).toHaveLength(0);
    });

    it('should disconnect all edges for a node', () => {
      store.addNode(createTestNode({ id: 'a', outputs: [{ id: 'out', name: 'Out', type: 'audio' }] }));
      store.addNode(createTestNode({ id: 'b', inputs: [{ id: 'in', name: 'In', type: 'audio' }], outputs: [{ id: 'out', name: 'Out', type: 'audio' }] }));
      store.addNode(createTestNode({ id: 'c', inputs: [{ id: 'in', name: 'In', type: 'audio' }] }));

      store.connect('a', 'out', 'b', 'in', 'audio');
      store.connect('b', 'out', 'c', 'in', 'audio');

      store.disconnectNode('b');

      expect(store.getEdges()).toHaveLength(0);
    });
  });

  describe('processing order', () => {
    it('should return topological order', () => {
      store.addNode(createTestNode({ id: 'a', outputs: [{ id: 'out', name: 'Out', type: 'audio' }] }));
      store.addNode(createTestNode({ id: 'b', inputs: [{ id: 'in', name: 'In', type: 'audio' }], outputs: [{ id: 'out', name: 'Out', type: 'audio' }] }));
      store.addNode(createTestNode({ id: 'c', inputs: [{ id: 'in', name: 'In', type: 'audio' }] }));

      store.connect('a', 'out', 'b', 'in', 'audio');
      store.connect('b', 'out', 'c', 'in', 'audio');

      const order = store.getProcessingOrder();
      expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'));
      expect(order.indexOf('b')).toBeLessThan(order.indexOf('c'));
    });
  });

  describe('SSOT enforcement (Change 249)', () => {
    it('should ensure no second routing graph store exists', async () => {
      // Verify that getRoutingGraph returns the same singleton
      const { getRoutingGraph } = await import('./routing-graph');
      const g1 = getRoutingGraph();
      const g2 = getRoutingGraph();
      expect(g1).toBe(g2);
    });
  });
});
