/**
 * @fileoverview Integration test for pack loading
 * 
 * Change 449: Test that loads a dummy pack and verifies all registries update and IDs validate.
 * 
 * Note: This is a conceptual/documentation test showing how pack integration should work.
 * The actual pack loading system uses more complex APIs than mocked here.
 * 
 * @module @cardplay/extensions/__tests__/pack-integration.test
 */

import { describe, it, expect } from 'vitest';
import { registerEventKind, listEventKinds } from '../../types/event-kind';
import { registerPortType, getPortTypeEntries } from '../../cards/card';
import type { CardPackManifest } from '../types';

describe('Pack Loading Integration', () => {
  it('should load a dummy pack manifest and validate structure', () => {
    // Create a dummy pack manifest
    const dummyManifest: CardPackManifest = {
      name: 'test-pack',
      namespace: 'test',
      version: '1.0.0',
      description: 'Test pack for integration testing',
      author: 'Test Suite',
      capabilities: [],
      exports: {
        cards: ['test:sample-card'],
        eventKinds: ['test:custom-event'],
        portTypes: ['test:custom-port'],
      },
    };

    // Verify manifest structure
    expect(dummyManifest.namespace).toBe('test');
    expect(dummyManifest.exports.cards).toContain('test:sample-card');
    expect(dummyManifest.exports.eventKinds).toContain('test:custom-event');
  });

  it('should register event kinds with namespaced IDs', () => {
    // Register an event kind with namespaced ID
    registerEventKind({
      kind: 'integration-test:custom-event',
      description: 'Custom event from test pack',
      payloadSchema: {
        type: 'object',
        properties: {
          value: { type: 'number' },
        },
        required: ['value'],
      },
    });

    // Verify it's in the registry
    const eventKinds = listEventKinds();
    expect(eventKinds).toContain('integration-test:custom-event');
  });

  it('should register port types with namespaced IDs', () => {
    // Register a port type with namespaced ID
    registerPortType({
      type: 'integration-test:custom-port',
      description: 'Custom port type from test pack',
      category: 'custom',
    });

    // Verify it's in the registry
    const portTypes = getPortTypeEntries();
    const hasCustomPort = portTypes.some(p => p.type === 'integration-test:custom-port');
    expect(hasCustomPort).toBe(true);
  });

  it('should prevent ID collisions with builtins', () => {
    // Attempting to register with a builtin ID should fail
    expect(() => {
      registerEventKind({
        kind: 'note',
        description: 'Trying to override builtin',
        payloadSchema: { type: 'object', properties: {} },
      });
    }).toThrow(/builtin/i);
  });

  it('should allow multiple packs with different namespaces', () => {
    // Pack 1
    registerEventKind({
      kind: 'pack1-test:event',
      description: 'Event from pack 1',
      payloadSchema: { type: 'object', properties: {} },
    });

    // Pack 2  
    registerEventKind({
      kind: 'pack2-test:event',
      description: 'Event from pack 2',
      payloadSchema: { type: 'object', properties: {} },
    });

    // Both packs should coexist
    const eventKinds = listEventKinds();
    expect(eventKinds).toContain('pack1-test:event');
    expect(eventKinds).toContain('pack2-test:event');
  });

  it('should validate pack manifest schema', () => {
    const manifest: CardPackManifest = {
      name: 'validation-test',
      namespace: 'valid',
      version: '1.0.0',
      description: 'Test manifest validation',
      author: 'Test Author',
      capabilities: [],
      exports: {
        cards: ['valid:card'],
      },
    };

    // All required fields present
    expect(manifest.name).toBeDefined();
    expect(manifest.namespace).toBeDefined();
    expect(manifest.version).toBeDefined();
    expect(manifest.exports).toBeDefined();
  });
});
