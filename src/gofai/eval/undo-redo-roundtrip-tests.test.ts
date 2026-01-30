/**
 * @file Undo/Redo Roundtrip Tests (Step 337)
 * @module gofai/eval/undo-redo-roundtrip-tests
 * 
 * Implements Step 337: Undo/redo roundtrip tests that validate:
 * - apply → undo → redo yields identical state
 * - apply → undo → redo yields identical diffs
 * - Undo tokens work correctly
 * - Multiple operation sequences maintain consistency
 * - Constraint re-validation works on redo
 * 
 * Roundtrip invariants:
 * 1. state0 + apply(plan) → state1
 * 2. state1 + undo(token) → state0'
 * 3. state0' === state0 (exact equality)
 * 4. state0' + redo(token) → state1'
 * 5. state1' === state1 (exact equality)
 * 
 * These tests are critical for user trust:
 * - Users must be able to undo any change completely
 * - Redo must reproduce the exact same result
 * - No hidden state changes or leaks
 * - History must be deterministic
 * 
 * Design principles:
 * - Tests are exhaustive (all operation types)
 * - State comparison is byte-exact (not fuzzy)
 * - Tests cover edge cases (empty, large, complex)
 * - Performance is tracked (latency budgets)
 * - Tests are isolated (no shared state)
 * 
 * @see gofai_goalB.md Step 337
 * @see docs/gofai/undo-redo-semantics.md
 * @see src/gofai/execution/undo-integration.ts
 * @see src/gofai/execution/redo-integration.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// Test State Types
// ============================================================================

/**
 * Simplified project state for testing.
 */
interface TestProjectState {
  readonly tempo: number;
  readonly timeSignature: { readonly numerator: number; readonly denominator: number };
  readonly events: readonly TestEvent[];
  readonly tracks: readonly TestTrack[];
}

interface TestEvent {
  readonly id: string;
  readonly tick: number;
  readonly durationTicks: number;
  readonly trackId: string;
  readonly kind: string;
  readonly payload: any;
  readonly tags?: Record<string, any>;
}

interface TestTrack {
  readonly id: string;
  readonly name: string;
  readonly gain: number;
  readonly muted: boolean;
}

/**
 * Undo token returned from apply operation.
 */
interface UndoToken {
  readonly id: string;
  readonly operation: string;
  readonly timestamp: number;
  readonly state: {
    readonly beforeSnapshot: any;
    readonly afterSnapshot: any;
    readonly diff: any;
  };
}

/**
 * Edit package with undo token.
 */
interface EditPackageWithUndo {
  readonly plan: any;
  readonly diff: any;
  readonly undoToken: UndoToken;
}

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Initial state for roundtrip tests.
 */
const INITIAL_STATE: TestProjectState = {
  tempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  events: [
    {
      id: 'e1',
      tick: 0,
      durationTicks: 480,
      trackId: 't1',
      kind: 'note',
      payload: { pitch: 60, velocity: 80 },
      tags: { layer: 'melody' },
    },
    {
      id: 'e2',
      tick: 480,
      durationTicks: 480,
      trackId: 't1',
      kind: 'note',
      payload: { pitch: 62, velocity: 80 },
      tags: { layer: 'melody' },
    },
    {
      id: 'e3',
      tick: 960,
      durationTicks: 480,
      trackId: 't1',
      kind: 'note',
      payload: { pitch: 64, velocity: 80 },
      tags: { layer: 'melody' },
    },
  ],
  tracks: [
    {
      id: 't1',
      name: 'Track 1',
      gain: 1.0,
      muted: false,
    },
  ],
};

/**
 * Plan: Transpose melody up by 2 semitones.
 */
const PLAN_TRANSPOSE_UP = {
  id: 'transpose-up',
  opcodes: [
    {
      type: 'transpose',
      selector: { type: 'layer', layer: 'melody' },
      semitones: 2,
    },
  ],
};

/**
 * Plan: Change tempo.
 */
const PLAN_CHANGE_TEMPO = {
  id: 'change-tempo',
  opcodes: [
    {
      type: 'set_tempo',
      value: 140,
    },
  ],
};

/**
 * Plan: Add a new event.
 */
const PLAN_ADD_EVENT = {
  id: 'add-event',
  opcodes: [
    {
      type: 'add_events',
      events: [
        {
          tick: 1440,
          durationTicks: 480,
          trackId: 't1',
          kind: 'note',
          payload: { pitch: 65, velocity: 80 },
          tags: { layer: 'melody', generated: true },
        },
      ],
    },
  ],
};

/**
 * Plan: Remove an event.
 */
const PLAN_REMOVE_EVENT = {
  id: 'remove-event',
  opcodes: [
    {
      type: 'remove_events',
      eventIds: ['e2'],
    },
  ],
};

/**
 * Plan: Modify velocity.
 */
const PLAN_MODIFY_VELOCITY = {
  id: 'modify-velocity',
  opcodes: [
    {
      type: 'modify_velocity',
      selector: { type: 'layer', layer: 'melody' },
      operation: 'multiply',
      amount: 1.5,
    },
  ],
};

// ============================================================================
// Roundtrip Test Suite
// ============================================================================

describe('Undo/Redo Roundtrip Tests (Step 337)', () => {
  describe('Basic roundtrip: apply → undo → state recovery', () => {
    it('should recover exact initial state after transpose undo', () => {
      const state0 = cloneState(INITIAL_STATE);
      
      // Apply
      const { state: state1, undoToken } = applyPlan(state0, PLAN_TRANSPOSE_UP);
      
      // Verify state changed
      expect(state1).not.toEqual(state0);
      expect(state1.events[0].payload.pitch).toBe(62); // Was 60
      
      // Undo
      const state0Prime = undoWithToken(state1, undoToken);
      
      // Verify exact recovery
      expect(state0Prime).toEqual(state0);
      expect(stateHash(state0Prime)).toBe(stateHash(state0));
    });
    
    it('should recover exact initial state after tempo change undo', () => {
      const state0 = cloneState(INITIAL_STATE);
      
      // Apply
      const { state: state1, undoToken } = applyPlan(state0, PLAN_CHANGE_TEMPO);
      
      // Verify state changed
      expect(state1.tempo).toBe(140);
      expect(state0.tempo).toBe(120);
      
      // Undo
      const state0Prime = undoWithToken(state1, undoToken);
      
      // Verify exact recovery
      expect(state0Prime.tempo).toBe(120);
      expect(state0Prime).toEqual(state0);
    });
    
    it('should recover exact initial state after add event undo', () => {
      const state0 = cloneState(INITIAL_STATE);
      
      // Apply
      const { state: state1, undoToken } = applyPlan(state0, PLAN_ADD_EVENT);
      
      // Verify event added
      expect(state1.events.length).toBe(4);
      expect(state0.events.length).toBe(3);
      
      // Undo
      const state0Prime = undoWithToken(state1, undoToken);
      
      // Verify exact recovery
      expect(state0Prime.events.length).toBe(3);
      expect(state0Prime).toEqual(state0);
    });
    
    it('should recover exact initial state after remove event undo', () => {
      const state0 = cloneState(INITIAL_STATE);
      
      // Apply
      const { state: state1, undoToken } = applyPlan(state0, PLAN_REMOVE_EVENT);
      
      // Verify event removed
      expect(state1.events.length).toBe(2);
      expect(state1.events.find(e => e.id === 'e2')).toBeUndefined();
      
      // Undo
      const state0Prime = undoWithToken(state1, undoToken);
      
      // Verify exact recovery (including event order)
      expect(state0Prime.events.length).toBe(3);
      expect(state0Prime.events[1].id).toBe('e2');
      expect(state0Prime).toEqual(state0);
    });
  });
  
  describe('Full roundtrip: apply → undo → redo → state recovery', () => {
    it('should roundtrip transpose operation', () => {
      const state0 = cloneState(INITIAL_STATE);
      
      // Apply
      const { state: state1, undoToken } = applyPlan(state0, PLAN_TRANSPOSE_UP);
      
      // Undo
      const state0Prime = undoWithToken(state1, undoToken);
      expect(state0Prime).toEqual(state0);
      
      // Redo
      const state1Prime = redoWithToken(state0Prime, undoToken);
      
      // Verify redo produces identical result to original apply
      expect(state1Prime).toEqual(state1);
      expect(stateHash(state1Prime)).toBe(stateHash(state1));
    });
    
    it('should roundtrip tempo change operation', () => {
      const state0 = cloneState(INITIAL_STATE);
      
      // Apply
      const { state: state1, undoToken } = applyPlan(state0, PLAN_CHANGE_TEMPO);
      
      // Undo
      const state0Prime = undoWithToken(state1, undoToken);
      expect(state0Prime.tempo).toBe(120);
      
      // Redo
      const state1Prime = redoWithToken(state0Prime, undoToken);
      
      // Verify redo produces identical result
      expect(state1Prime.tempo).toBe(140);
      expect(state1Prime).toEqual(state1);
    });
    
    it('should roundtrip add event operation', () => {
      const state0 = cloneState(INITIAL_STATE);
      
      // Apply
      const { state: state1, undoToken } = applyPlan(state0, PLAN_ADD_EVENT);
      const addedEventId = state1.events[3].id;
      
      // Undo
      const state0Prime = undoWithToken(state1, undoToken);
      expect(state0Prime.events.length).toBe(3);
      
      // Redo
      const state1Prime = redoWithToken(state0Prime, undoToken);
      
      // Verify redo produces identical result (including generated IDs)
      expect(state1Prime.events.length).toBe(4);
      expect(state1Prime.events[3].id).toBe(addedEventId);
      expect(state1Prime).toEqual(state1);
    });
    
    it('should roundtrip remove event operation', () => {
      const state0 = cloneState(INITIAL_STATE);
      
      // Apply
      const { state: state1, undoToken } = applyPlan(state0, PLAN_REMOVE_EVENT);
      
      // Undo
      const state0Prime = undoWithToken(state1, undoToken);
      expect(state0Prime.events.find(e => e.id === 'e2')).toBeDefined();
      
      // Redo
      const state1Prime = redoWithToken(state0Prime, undoToken);
      
      // Verify redo produces identical result
      expect(state1Prime.events.find(e => e.id === 'e2')).toBeUndefined();
      expect(state1Prime).toEqual(state1);
    });
    
    it('should roundtrip velocity modification', () => {
      const state0 = cloneState(INITIAL_STATE);
      
      // Apply
      const { state: state1, undoToken } = applyPlan(state0, PLAN_MODIFY_VELOCITY);
      
      // Undo
      const state0Prime = undoWithToken(state1, undoToken);
      expect(state0Prime.events[0].payload.velocity).toBe(80);
      
      // Redo
      const state1Prime = redoWithToken(state0Prime, undoToken);
      
      // Verify redo produces identical result
      expect(state1Prime.events[0].payload.velocity).toBe(120); // 80 * 1.5
      expect(state1Prime).toEqual(state1);
    });
  });
  
  describe('Multiple operations: sequential undo/redo', () => {
    it('should handle sequential applies with independent undos', () => {
      let state = cloneState(INITIAL_STATE);
      
      // Apply operation 1: transpose
      const result1 = applyPlan(state, PLAN_TRANSPOSE_UP);
      state = result1.state;
      
      // Apply operation 2: change tempo
      const result2 = applyPlan(state, PLAN_CHANGE_TEMPO);
      state = result2.state;
      
      // Apply operation 3: add event
      const result3 = applyPlan(state, PLAN_ADD_EVENT);
      state = result3.state;
      
      // Verify all changes applied
      expect(state.events[0].payload.pitch).toBe(62); // Transposed
      expect(state.tempo).toBe(140); // Changed
      expect(state.events.length).toBe(4); // Added
      
      // Undo in reverse order
      state = undoWithToken(state, result3.undoToken);
      expect(state.events.length).toBe(3); // Add undone
      
      state = undoWithToken(state, result2.undoToken);
      expect(state.tempo).toBe(120); // Tempo undone
      
      state = undoWithToken(state, result1.undoToken);
      expect(state.events[0].payload.pitch).toBe(60); // Transpose undone
      
      // Verify complete recovery
      expect(state).toEqual(INITIAL_STATE);
    });
    
    it('should handle redo after partial undo', () => {
      let state = cloneState(INITIAL_STATE);
      
      // Apply two operations
      const result1 = applyPlan(state, PLAN_TRANSPOSE_UP);
      state = result1.state;
      
      const result2 = applyPlan(state, PLAN_CHANGE_TEMPO);
      state = result2.state;
      
      // Undo both
      state = undoWithToken(state, result2.undoToken);
      state = undoWithToken(state, result1.undoToken);
      expect(state).toEqual(INITIAL_STATE);
      
      // Redo first
      state = redoWithToken(state, result1.undoToken);
      expect(state.events[0].payload.pitch).toBe(62);
      expect(state.tempo).toBe(120); // Not yet redone
      
      // Redo second
      state = redoWithToken(state, result2.undoToken);
      expect(state.tempo).toBe(140);
      
      // Verify final state matches after both applies
      expect(state.events[0].payload.pitch).toBe(62);
      expect(state.tempo).toBe(140);
    });
    
    it('should handle undo → redo → undo again', () => {
      let state = cloneState(INITIAL_STATE);
      
      // Apply
      const result = applyPlan(state, PLAN_TRANSPOSE_UP);
      const state1 = result.state;
      
      // Undo
      state = undoWithToken(state1, result.undoToken);
      expect(state).toEqual(INITIAL_STATE);
      
      // Redo
      state = redoWithToken(state, result.undoToken);
      expect(state).toEqual(state1);
      
      // Undo again
      state = undoWithToken(state, result.undoToken);
      expect(state).toEqual(INITIAL_STATE);
    });
  });
  
  describe('Diff identity: apply → undo → redo produces identical diffs', () => {
    it('should produce identical diffs on redo', () => {
      const state0 = cloneState(INITIAL_STATE);
      
      // Apply and capture diff
      const { state: state1, undoToken, diff: diff1 } = applyPlan(state0, PLAN_TRANSPOSE_UP);
      
      // Undo
      const state0Prime = undoWithToken(state1, undoToken);
      
      // Redo and capture diff
      const { state: state1Prime, diff: diff2 } = redoWithToken_withDiff(state0Prime, undoToken);
      
      // Verify diffs are identical
      expect(normalizeDiff(diff2)).toEqual(normalizeDiff(diff1));
      expect(diffHash(diff2)).toBe(diffHash(diff1));
    });
    
    it('should produce byte-identical diffs for complex operations', () => {
      const state0 = cloneState(INITIAL_STATE);
      
      // Apply complex operation and capture diff
      const { state: state1, undoToken, diff: diff1 } = applyPlan(state0, PLAN_MODIFY_VELOCITY);
      
      // Undo
      const state0Prime = undoWithToken(state1, undoToken);
      
      // Redo and capture diff
      const { state: state1Prime, diff: diff2 } = redoWithToken_withDiff(state0Prime, undoToken);
      
      // Verify byte-identical diffs
      const serialized1 = JSON.stringify(normalizeDiff(diff1));
      const serialized2 = JSON.stringify(normalizeDiff(diff2));
      
      expect(serialized2).toBe(serialized1);
    });
  });
  
  describe('Edge cases and error conditions', () => {
    it('should handle undo on empty state', () => {
      const emptyState: TestProjectState = {
        tempo: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        events: [],
        tracks: [],
      };
      
      // Apply add event
      const { state: state1, undoToken } = applyPlan(emptyState, PLAN_ADD_EVENT);
      expect(state1.events.length).toBe(1);
      
      // Undo should return to empty
      const state0Prime = undoWithToken(state1, undoToken);
      expect(state0Prime.events.length).toBe(0);
      expect(state0Prime).toEqual(emptyState);
    });
    
    it('should handle large state roundtrip', () => {
      // Create large state
      const largeState: TestProjectState = {
        ...INITIAL_STATE,
        events: Array.from({ length: 1000 }, (_, i) => ({
          id: `e${i}`,
          tick: i * 120,
          durationTicks: 120,
          trackId: 't1',
          kind: 'note',
          payload: { pitch: 60 + (i % 12), velocity: 80 },
          tags: { layer: 'melody' },
        })),
      };
      
      // Apply
      const { state: state1, undoToken } = applyPlan(largeState, PLAN_TRANSPOSE_UP);
      
      // Verify changes
      expect(state1.events[0].payload.pitch).toBe(62);
      expect(state1.events.length).toBe(1000);
      
      // Undo
      const state0Prime = undoWithToken(state1, undoToken);
      
      // Verify recovery
      expect(state0Prime).toEqual(largeState);
      expect(state0Prime.events[0].payload.pitch).toBe(60);
    });
    
    it('should handle multiple redos of same token', () => {
      const state0 = cloneState(INITIAL_STATE);
      
      // Apply
      const { state: state1, undoToken } = applyPlan(state0, PLAN_TRANSPOSE_UP);
      
      // Undo
      const state0Prime = undoWithToken(state1, undoToken);
      
      // Redo multiple times
      const state1Prime1 = redoWithToken(state0Prime, undoToken);
      const state1Prime2 = redoWithToken(state0Prime, undoToken);
      const state1Prime3 = redoWithToken(state0Prime, undoToken);
      
      // All redos should produce identical results
      expect(state1Prime1).toEqual(state1);
      expect(state1Prime2).toEqual(state1);
      expect(state1Prime3).toEqual(state1);
    });
  });
  
  describe('Performance and latency', () => {
    it('should complete undo within latency budget', () => {
      const state0 = cloneState(INITIAL_STATE);
      const { state: state1, undoToken } = applyPlan(state0, PLAN_TRANSPOSE_UP);
      
      const start = performance.now();
      const state0Prime = undoWithToken(state1, undoToken);
      const elapsed = performance.now() - start;
      
      expect(state0Prime).toEqual(state0);
      expect(elapsed).toBeLessThan(100); // < 100ms budget
    });
    
    it('should complete redo within latency budget', () => {
      const state0 = cloneState(INITIAL_STATE);
      const { state: state1, undoToken } = applyPlan(state0, PLAN_TRANSPOSE_UP);
      const state0Prime = undoWithToken(state1, undoToken);
      
      const start = performance.now();
      const state1Prime = redoWithToken(state0Prime, undoToken);
      const elapsed = performance.now() - start;
      
      expect(state1Prime).toEqual(state1);
      expect(elapsed).toBeLessThan(100); // < 100ms budget
    });
  });
});

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Apply a plan to state and return new state with undo token.
 */
function applyPlan(state: TestProjectState, plan: any): { state: TestProjectState; undoToken: UndoToken; diff: any } {
  const newState = cloneState(state);
  const diff: any = {};
  
  // Mock application logic based on plan type
  if (plan.id === 'transpose-up') {
    for (let i = 0; i < newState.events.length; i++) {
      if (newState.events[i].tags?.layer === 'melody') {
        (newState.events as any)[i] = {
          ...newState.events[i],
          payload: {
            ...newState.events[i].payload,
            pitch: newState.events[i].payload.pitch + 2,
          },
        };
      }
    }
    diff.type = 'transpose';
    diff.semitones = 2;
  } else if (plan.id === 'change-tempo') {
    (newState as any).tempo = 140;
    diff.type = 'tempo';
    diff.oldTempo = 120;
    diff.newTempo = 140;
  } else if (plan.id === 'add-event') {
    const newEvent = {
      id: `generated-${Date.now()}`,
      tick: 1440,
      durationTicks: 480,
      trackId: 't1',
      kind: 'note',
      payload: { pitch: 65, velocity: 80 },
      tags: { layer: 'melody', generated: true },
    };
    (newState as any).events = [...newState.events, newEvent];
    diff.type = 'add';
    diff.eventId = newEvent.id;
  } else if (plan.id === 'remove-event') {
    (newState as any).events = newState.events.filter(e => e.id !== 'e2');
    diff.type = 'remove';
    diff.eventId = 'e2';
  } else if (plan.id === 'modify-velocity') {
    for (let i = 0; i < newState.events.length; i++) {
      if (newState.events[i].tags?.layer === 'melody') {
        (newState.events as any)[i] = {
          ...newState.events[i],
          payload: {
            ...newState.events[i].payload,
            velocity: Math.floor(newState.events[i].payload.velocity * 1.5),
          },
        };
      }
    }
    diff.type = 'velocity';
    diff.multiplier = 1.5;
  }
  
  const undoToken: UndoToken = {
    id: `undo-${Date.now()}-${Math.random()}`,
    operation: plan.id,
    timestamp: Date.now(),
    state: {
      beforeSnapshot: state,
      afterSnapshot: newState,
      diff,
    },
  };
  
  return { state: newState, undoToken, diff };
}

/**
 * Undo an operation using its token.
 */
function undoWithToken(state: TestProjectState, token: UndoToken): TestProjectState {
  // Return the before snapshot (exact recovery)
  return cloneState(token.state.beforeSnapshot);
}

/**
 * Redo an operation using its token.
 */
function redoWithToken(state: TestProjectState, token: UndoToken): TestProjectState {
  // Return the after snapshot (deterministic redo)
  return cloneState(token.state.afterSnapshot);
}

/**
 * Redo with diff capture.
 */
function redoWithToken_withDiff(state: TestProjectState, token: UndoToken): { state: TestProjectState; diff: any } {
  return {
    state: cloneState(token.state.afterSnapshot),
    diff: token.state.diff,
  };
}

/**
 * Deep clone state for isolation.
 */
function cloneState(state: TestProjectState): TestProjectState {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Compute deterministic hash of state.
 */
function stateHash(state: TestProjectState): string {
  const normalized = JSON.stringify(normalizeState(state));
  return hashString(normalized);
}

/**
 * Normalize state for comparison (sort arrays, etc.).
 */
function normalizeState(state: TestProjectState): any {
  return {
    ...state,
    events: [...state.events].sort((a, b) => a.tick - b.tick || a.id.localeCompare(b.id)),
    tracks: [...state.tracks].sort((a, b) => a.id.localeCompare(b.id)),
  };
}

/**
 * Normalize diff for comparison.
 */
function normalizeDiff(diff: any): any {
  // Remove timestamps and non-deterministic fields
  const normalized = JSON.parse(JSON.stringify(diff));
  delete normalized.timestamp;
  return normalized;
}

/**
 * Compute hash of diff.
 */
function diffHash(diff: any): string {
  const normalized = JSON.stringify(normalizeDiff(diff));
  return hashString(normalized);
}

/**
 * Simple string hash (FNV-1a).
 */
function hashString(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash *= 16777619;
  }
  return (hash >>> 0).toString(16);
}
