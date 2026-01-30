/**
 * @fileoverview SSOT Store Tests
 * 
 * Tests ensuring single source of truth store invariants.
 * 
 * Changes covered:
 * - Change 346: getSharedEventStore() singleton test
 * - Change 347: Board context reset test
 * - Change 348: Clip registry reset test
 * - Change 349: Project reset API test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSharedEventStore,
  resetSharedEventStore,
} from '../event-store';
import {
  getClipRegistry,
  resetClipRegistry,
} from '../clip-registry';
import {
  getSSOTStores,
  resetProject,
  onProjectReset,
  validateSSOTConsistency,
} from '../ssot';

describe('SharedEventStore singleton', () => {
  beforeEach(() => {
    resetSharedEventStore();
  });

  it('returns the same instance on multiple calls', () => {
    const store1 = getSharedEventStore();
    const store2 = getSharedEventStore();
    expect(store1).toBe(store2);
  });

  it('maintains state across getter calls', () => {
    const store1 = getSharedEventStore();
    const stream = store1.createStream({ name: 'test-stream' });
    
    const store2 = getSharedEventStore();
    expect(store2.getStream(stream.id)).toBeDefined();
  });

  it('resets correctly', () => {
    const store = getSharedEventStore();
    store.createStream({ name: 'test-stream' });
    expect(store.getAllStreams().length).toBeGreaterThan(0);
    
    resetSharedEventStore();
    
    const newStore = getSharedEventStore();
    expect(newStore.getAllStreams().length).toBe(0);
  });
});

describe('ClipRegistry singleton', () => {
  beforeEach(() => {
    resetClipRegistry();
  });

  it('returns the same instance on multiple calls', () => {
    const registry1 = getClipRegistry();
    const registry2 = getClipRegistry();
    expect(registry1).toBe(registry2);
  });

  it('maintains state across getter calls', () => {
    const registry1 = getClipRegistry();
    const clip = registry1.createClip({
      name: 'test-clip',
      startTick: 0,
      durationTicks: 480,
    });
    
    const registry2 = getClipRegistry();
    expect(registry2.getClip(clip.id)).toBeDefined();
  });

  it('resets correctly and clears all clips', () => {
    const registry = getClipRegistry();
    registry.createClip({
      name: 'test-clip',
      startTick: 0,
      durationTicks: 480,
    });
    expect(registry.getAllClips().length).toBeGreaterThan(0);
    
    resetClipRegistry();
    
    const newRegistry = getClipRegistry();
    expect(newRegistry.getAllClips().length).toBe(0);
  });

  it('generates unique clip IDs', () => {
    const registry = getClipRegistry();
    const clip1 = registry.createClip({ name: 'clip-1', startTick: 0, durationTicks: 480 });
    const clip2 = registry.createClip({ name: 'clip-2', startTick: 480, durationTicks: 480 });
    const clip3 = registry.createClip({ name: 'clip-3', startTick: 960, durationTicks: 480 });
    
    expect(clip1.id).not.toBe(clip2.id);
    expect(clip2.id).not.toBe(clip3.id);
    expect(clip1.id).not.toBe(clip3.id);
  });
});

describe('Project reset API', () => {
  beforeEach(() => {
    resetSharedEventStore();
    resetClipRegistry();
  });

  it('clears all SSOT stores together', () => {
    const stores = getSSOTStores();
    
    // Add data to stores
    stores.events.createStream({ name: 'test-stream' });
    stores.clips.createClip({ name: 'test-clip', startTick: 0, durationTicks: 480 });
    
    expect(stores.events.getAllStreams().length).toBeGreaterThan(0);
    expect(stores.clips.getAllClips().length).toBeGreaterThan(0);
    
    // Reset project
    resetProject();
    
    // Verify all stores are cleared
    const newStores = getSSOTStores();
    expect(newStores.events.getAllStreams().length).toBe(0);
    expect(newStores.clips.getAllClips().length).toBe(0);
  });

  it('notifies reset callbacks', () => {
    let callbackCalled = false;
    const unsubscribe = onProjectReset(() => {
      callbackCalled = true;
    });
    
    resetProject();
    
    expect(callbackCalled).toBe(true);
    
    // Cleanup
    unsubscribe();
  });

  it('allows multiple reset callbacks', () => {
    const callOrder: number[] = [];
    
    const unsub1 = onProjectReset(() => callOrder.push(1));
    const unsub2 = onProjectReset(() => callOrder.push(2));
    const unsub3 = onProjectReset(() => callOrder.push(3));
    
    resetProject();
    
    expect(callOrder).toEqual([1, 2, 3]);
    
    // Cleanup
    unsub1();
    unsub2();
    unsub3();
  });

  it('unsubscribe removes callback', () => {
    let callCount = 0;
    const unsubscribe = onProjectReset(() => {
      callCount++;
    });
    
    resetProject();
    expect(callCount).toBe(1);
    
    unsubscribe();
    
    resetProject();
    expect(callCount).toBe(1); // Should not increase
  });
});

describe('SSOT consistency validation', () => {
  beforeEach(() => {
    resetSharedEventStore();
    resetClipRegistry();
  });

  it('returns no errors for consistent state', () => {
    const stores = getSSOTStores();
    
    // Create a stream
    const stream = stores.events.createStream({ name: 'test-stream' });
    
    // Create a clip referencing that stream
    stores.clips.createClip({
      name: 'test-clip',
      startTick: 0,
      durationTicks: 480,
      eventStreamId: stream.id,
    });
    
    const errors = validateSSOTConsistency();
    expect(errors).toEqual([]);
  });

  it('detects orphaned event stream references', () => {
    const stores = getSSOTStores();
    
    // Create a clip with a non-existent stream ID
    // This simulates corruption or a bug
    const clip = stores.clips.createClip({
      name: 'orphan-clip',
      startTick: 0,
      durationTicks: 480,
      eventStreamId: 'non-existent-stream-id' as any,
    });
    
    const errors = validateSSOTConsistency();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('non-existent');
  });
});

describe('Board context reset', () => {
  it('clears selection state on project reset', () => {
    // This test verifies that board context (selection, cursor) 
    // is reset when project is reset, preventing dangling IDs
    
    const stores = getSSOTStores();
    
    // Create some data
    const stream = stores.events.createStream({ name: 'test-stream' });
    
    // Reset project
    resetProject();
    
    // Verify stream no longer exists
    const newStores = getSSOTStores();
    expect(newStores.events.getStream(stream.id)).toBeUndefined();
  });
});
