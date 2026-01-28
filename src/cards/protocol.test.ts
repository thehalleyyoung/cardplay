/**
 * @fileoverview Tests for Protocol System.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createProtocol,
  getProtocolRegistry,
  resetProtocolRegistry,
  implementsProtocol,
  getProtocolMethods,
  protocolAdapter,
  composeProtocols,
  isProtocolVersionCompatible,
  generateProtocolDocs,
  registerBuiltInProtocols,
  SchedulableProtocol,
  RenderableProtocol,
  AutomatableProtocol,
  NotatableProtocol,
  ConstrainableProtocol,
  TransformableProtocol,
  SerializableProtocol,
  DiffableProtocol,
  PatchableProtocol,
  ContractableProtocol,
  AuditableProtocol,
} from './protocol';
import type {
  Schedulable,
  Renderable,
  Automatable,
  Serializable,
  Diffable,
} from './protocol';
import { asTick } from '../types/primitives';

// ============================================================================
// TEST SETUP
// ============================================================================

beforeEach(() => {
  resetProtocolRegistry();
});

// ============================================================================
// FACTORY TESTS
// ============================================================================

describe('createProtocol', () => {
  it('should create a protocol', () => {
    const protocol = createProtocol<{ foo(): void }>({
      id: 'test',
      name: 'Test Protocol',
      methods: [{ name: 'foo', signature: '() => void' }],
      check: (v): v is { foo(): void } =>
        typeof v === 'object' && v !== null && 'foo' in v,
    });
    
    expect(protocol.id).toBe('test');
    expect(protocol.name).toBe('Test Protocol');
    expect(protocol.version).toBe('1.0.0');
    expect(protocol.methods).toHaveLength(1);
  });

  it('should set custom version', () => {
    const protocol = createProtocol({
      id: 'v2',
      name: 'V2 Protocol',
      version: '2.0.0',
      methods: [],
      check: (v): v is unknown => true,
    });
    
    expect(protocol.version).toBe('2.0.0');
  });
});

// ============================================================================
// REGISTRY TESTS
// ============================================================================

describe('ProtocolRegistry', () => {
  it('should register and retrieve protocols', () => {
    const registry = getProtocolRegistry();
    const protocol = createProtocol({
      id: 'test',
      name: 'Test',
      methods: [],
      check: (v): v is unknown => true,
    });
    
    registry.register(protocol);
    const retrieved = registry.get('test');
    
    expect(retrieved).toBeDefined();
    expect(retrieved!.name).toBe('Test');
  });

  it('should list all protocols', () => {
    const registry = getProtocolRegistry();
    registerBuiltInProtocols();
    
    const all = registry.list();
    expect(all.length).toBeGreaterThanOrEqual(11);
  });

  it('should track implementations', () => {
    const registry = getProtocolRegistry();
    const protocol = createProtocol({
      id: 'test',
      name: 'Test',
      methods: [],
      check: (v): v is unknown => true,
    });
    
    registry.register(protocol);
    registry.registerImplementation('MyType', 'test');
    
    expect(registry.implements('MyType', 'test')).toBe(true);
    expect(registry.implements('OtherType', 'test')).toBe(false);
  });

  it('should get protocols for type', () => {
    const registry = getProtocolRegistry();
    const protocol1 = createProtocol({
      id: 'p1',
      name: 'P1',
      methods: [],
      check: (v): v is unknown => true,
    });
    const protocol2 = createProtocol({
      id: 'p2',
      name: 'P2',
      methods: [],
      check: (v): v is unknown => true,
    });
    
    registry.register(protocol1);
    registry.register(protocol2);
    registry.registerImplementation('MyType', 'p1');
    registry.registerImplementation('MyType', 'p2');
    
    const protocols = registry.getProtocolsFor('MyType');
    expect(protocols).toHaveLength(2);
  });

  it('should support protocol inheritance', () => {
    const registry = getProtocolRegistry();
    const parent = createProtocol({
      id: 'parent',
      name: 'Parent',
      methods: [],
      check: (v): v is unknown => true,
    });
    const child = createProtocol({
      id: 'child',
      name: 'Child',
      methods: [],
      check: (v): v is unknown => true,
    });
    
    registry.register(parent);
    registry.register(child);
    registry.setParent('child', 'parent');
    registry.registerImplementation('MyType', 'child');
    
    // Type implements child, which extends parent
    expect(registry.implements('MyType', 'child')).toBe(true);
  });
});

// ============================================================================
// PROTOCOL CHECK TESTS
// ============================================================================

describe('implementsProtocol', () => {
  it('should check Schedulable', () => {
    const schedulable: Schedulable<unknown> = {
      schedule: () => {},
      unschedule: () => {},
      getScheduled: () => [],
    };
    
    expect(implementsProtocol(schedulable, SchedulableProtocol)).toBe(true);
    expect(implementsProtocol({}, SchedulableProtocol)).toBe(false);
  });

  it('should check Renderable', () => {
    const renderable: Renderable<unknown> = {
      render: () => null,
      clear: () => {},
    };
    
    expect(implementsProtocol(renderable, RenderableProtocol)).toBe(true);
  });

  it('should check Automatable', () => {
    const automatable: Automatable<number> = {
      getAutomationValue: () => 0,
      setAutomationPoint: () => {},
      getAutomationParams: () => [],
    };
    
    expect(implementsProtocol(automatable, AutomatableProtocol)).toBe(true);
  });

  it('should check Serializable', () => {
    const serializable: Serializable<unknown> = {
      toJSON: () => ({}),
      fromJSON: (j) => j,
    };
    
    expect(implementsProtocol(serializable, SerializableProtocol)).toBe(true);
  });

  it('should check Diffable', () => {
    const diffable: Diffable<unknown> = {
      diff: () => ({}),
      patch: (d) => d,
    };
    
    expect(implementsProtocol(diffable, DiffableProtocol)).toBe(true);
  });
});

// ============================================================================
// UTILITY TESTS
// ============================================================================

describe('getProtocolMethods', () => {
  it('should return protocol methods', () => {
    const methods = getProtocolMethods(SchedulableProtocol);
    expect(methods).toHaveLength(3);
    expect(methods.map(m => m.name)).toContain('schedule');
  });
});

describe('protocolAdapter', () => {
  it('should add protocol methods to object', () => {
    const original = { value: 42 };
    const adapted = protocolAdapter(
      original,
      SerializableProtocol,
      {
        toJSON: () => ({ value: 42 }),
      }
    );
    
    expect(adapted.value).toBe(42);
    expect(adapted.toJSON).toBeDefined();
  });
});

describe('composeProtocols', () => {
  it('should compose two protocols', () => {
    const composed = composeProtocols(
      SerializableProtocol,
      DiffableProtocol
    );
    
    expect(composed.id).toBe('serializable+diffable');
    expect(composed.methods.length).toBe(4);
    
    const both: Serializable<unknown> & Diffable<unknown> = {
      toJSON: () => ({}),
      fromJSON: (j) => j,
      diff: () => ({}),
      patch: (d) => d,
    };
    
    expect(composed.check(both)).toBe(true);
    expect(composed.check({ toJSON: () => ({}) })).toBe(false);
  });
});

describe('isProtocolVersionCompatible', () => {
  it('should check version compatibility', () => {
    expect(isProtocolVersionCompatible(SchedulableProtocol, '1.0.0')).toBe(true);
    expect(isProtocolVersionCompatible(SchedulableProtocol, '1.1.0')).toBe(false); // requires newer minor
    expect(isProtocolVersionCompatible(SchedulableProtocol, '0.9.0')).toBe(false); // different major
    expect(isProtocolVersionCompatible(SchedulableProtocol, '2.0.0')).toBe(false); // different major
  });
});

describe('generateProtocolDocs', () => {
  it('should generate markdown documentation', () => {
    const docs = generateProtocolDocs(SchedulableProtocol);
    
    expect(docs).toContain('# Schedulable Protocol');
    expect(docs).toContain('**ID:** `schedulable`');
    expect(docs).toContain('### `schedule`');
  });
});

// ============================================================================
// BUILT-IN PROTOCOL TESTS
// ============================================================================

describe('Built-in Protocols', () => {
  beforeEach(() => {
    registerBuiltInProtocols();
  });

  it('should register all built-in protocols', () => {
    const registry = getProtocolRegistry();
    const all = registry.list();
    expect(all.length).toBeGreaterThanOrEqual(11);
  });

  it('SchedulableProtocol should exist', () => {
    expect(SchedulableProtocol.id).toBe('schedulable');
    expect(SchedulableProtocol.methods).toHaveLength(3);
  });

  it('RenderableProtocol should exist', () => {
    expect(RenderableProtocol.id).toBe('renderable');
    expect(RenderableProtocol.methods).toHaveLength(2);
  });

  it('AutomatableProtocol should exist', () => {
    expect(AutomatableProtocol.id).toBe('automatable');
    expect(AutomatableProtocol.methods).toHaveLength(3);
  });

  it('NotatableProtocol should exist', () => {
    expect(NotatableProtocol.id).toBe('notatable');
  });

  it('ConstrainableProtocol should exist', () => {
    expect(ConstrainableProtocol.id).toBe('constrainable');
  });

  it('TransformableProtocol should exist', () => {
    expect(TransformableProtocol.id).toBe('transformable');
  });

  it('SerializableProtocol should exist', () => {
    expect(SerializableProtocol.id).toBe('serializable');
  });

  it('DiffableProtocol should exist', () => {
    expect(DiffableProtocol.id).toBe('diffable');
  });

  it('PatchableProtocol should exist', () => {
    expect(PatchableProtocol.id).toBe('patchable');
  });

  it('ContractableProtocol should exist', () => {
    expect(ContractableProtocol.id).toBe('contractable');
  });

  it('AuditableProtocol should exist', () => {
    expect(AuditableProtocol.id).toBe('auditable');
  });
});
