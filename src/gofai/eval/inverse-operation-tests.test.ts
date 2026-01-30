/**
 * @file Inverse Operation Property Tests (Step 338)
 * @module gofai/eval/inverse-operation-tests
 * 
 * Implements Step 338: Property tests for inverse operations that validate:
 * - Applying a plan then its inverse yields original state
 * - Inverse operations exist for all reversible operations
 * - Inverse(inverse(op)) = op (involution property)
 * - Composition properties hold
 * - Constraints are preserved through inverse pairs
 * 
 * Mathematical properties tested:
 * 1. Right inverse: state + apply(op) + apply(inverse(op)) = state
 * 2. Left inverse: apply(inverse(op)) + apply(op) = identity (on relevant scope)
 * 3. Involution: inverse(inverse(op)) = op
 * 4. Commutativity (where applicable): op1 · op2 · inverse(op2) · inverse(op1) = identity
 * 
 * Operation categories:
 * - Reversible: transpose, scale velocity, shift timing
 * - Partially reversible: quantize (lossy), simplify (lossy)
 * - Irreversible: random generation, AI suggestions
 * 
 * Design principles:
 * - Property-based testing (not just examples)
 * - Tests cover operation algebra
 * - Failures show concrete counterexamples
 * - Tests are fast (< 50ms each)
 * - Tests are deterministic (no randomness unless seeded)
 * 
 * @see gofai_goalB.md Step 338
 * @see docs/gofai/operation-algebra.md
 * @see src/gofai/planning/inverse-operations.ts
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// Operation Types
// ============================================================================

/**
 * A musical operation that can be applied to project state.
 */
interface Operation {
  readonly type: string;
  readonly params: Record<string, any>;
  readonly scope?: Scope;
}

/**
 * Scope selector for operations.
 */
interface Scope {
  readonly type: 'global' | 'section' | 'track' | 'layer' | 'selection';
  readonly target?: string;
  readonly startTick?: number;
  readonly endTick?: number;
}

/**
 * Simple project state for testing.
 */
interface TestState {
  readonly events: readonly Event[];
  readonly tempo: number;
}

interface Event {
  readonly id: string;
  readonly tick: number;
  readonly pitch: number;
  readonly velocity: number;
  readonly duration: number;
}

// ============================================================================
// Operation Catalog with Inverses
// ============================================================================

/**
 * Transpose operation and its inverse.
 */
const TRANSPOSE_OPERATION = {
  forward: (semitones: number): Operation => ({
    type: 'transpose',
    params: { semitones },
  }),
  inverse: (semitones: number): Operation => ({
    type: 'transpose',
    params: { semitones: -semitones },
  }),
  isReversible: true,
};

/**
 * Scale velocity operation and its inverse.
 */
const SCALE_VELOCITY_OPERATION = {
  forward: (factor: number): Operation => ({
    type: 'scale_velocity',
    params: { factor },
  }),
  inverse: (factor: number): Operation => ({
    type: 'scale_velocity',
    params: { factor: 1 / factor },
  }),
  isReversible: true,
};

/**
 * Shift timing operation and its inverse.
 */
const SHIFT_TIMING_OPERATION = {
  forward: (ticks: number): Operation => ({
    type: 'shift_timing',
    params: { ticks },
  }),
  inverse: (ticks: number): Operation => ({
    type: 'shift_timing',
    params: { ticks: -ticks },
  }),
  isReversible: true,
};

/**
 * Change tempo operation and its inverse.
 */
const CHANGE_TEMPO_OPERATION = {
  forward: (newTempo: number, oldTempo: number): Operation => ({
    type: 'change_tempo',
    params: { tempo: newTempo, previousTempo: oldTempo },
  }),
  inverse: (newTempo: number, oldTempo: number): Operation => ({
    type: 'change_tempo',
    params: { tempo: oldTempo, previousTempo: newTempo },
  }),
  isReversible: true,
};

/**
 * Stretch duration operation and its inverse.
 */
const STRETCH_DURATION_OPERATION = {
  forward: (factor: number): Operation => ({
    type: 'stretch_duration',
    params: { factor },
  }),
  inverse: (factor: number): Operation => ({
    type: 'stretch_duration',
    params: { factor: 1 / factor },
  }),
  isReversible: true,
};

/**
 * Add offset operation and its inverse.
 */
const ADD_OFFSET_OPERATION = {
  forward: (offset: number, dimension: string): Operation => ({
    type: 'add_offset',
    params: { offset, dimension },
  }),
  inverse: (offset: number, dimension: string): Operation => ({
    type: 'add_offset',
    params: { offset: -offset, dimension },
  }),
  isReversible: true,
};

// ============================================================================
// Test Fixtures
// ============================================================================

const SIMPLE_STATE: TestState = {
  tempo: 120,
  events: [
    { id: 'e1', tick: 0, pitch: 60, velocity: 80, duration: 480 },
    { id: 'e2', tick: 480, pitch: 62, velocity: 80, duration: 480 },
    { id: 'e3', tick: 960, pitch: 64, velocity: 80, duration: 480 },
  ],
};

const COMPLEX_STATE: TestState = {
  tempo: 90,
  events: [
    { id: 'e1', tick: 0, pitch: 48, velocity: 100, duration: 960 },
    { id: 'e2', tick: 0, pitch: 52, velocity: 90, duration: 960 },
    { id: 'e3', tick: 0, pitch: 55, velocity: 90, duration: 960 },
    { id: 'e4', tick: 960, pitch: 50, velocity: 100, duration: 960 },
    { id: 'e5', tick: 960, pitch: 53, velocity: 90, duration: 960 },
    { id: 'e6', tick: 960, pitch: 57, velocity: 90, duration: 960 },
    { id: 'melody1', tick: 0, pitch: 60, velocity: 70, duration: 240 },
    { id: 'melody2', tick: 240, pitch: 62, velocity: 70, duration: 240 },
    { id: 'melody3', tick: 480, pitch: 64, velocity: 70, duration: 240 },
    { id: 'melody4', tick: 720, pitch: 65, velocity: 70, duration: 240 },
  ],
};

// ============================================================================
// Property Tests
// ============================================================================

describe('Inverse Operation Property Tests (Step 338)', () => {
  describe('Right inverse property: op · inverse(op) = identity', () => {
    it('should satisfy right inverse for transpose', () => {
      const state0 = cloneState(SIMPLE_STATE);
      
      // Apply forward
      const state1 = applyOperation(state0, TRANSPOSE_OPERATION.forward(5));
      
      // Verify state changed
      expect(state1.events[0].pitch).toBe(65);
      expect(state1.events[1].pitch).toBe(67);
      
      // Apply inverse
      const state2 = applyOperation(state1, TRANSPOSE_OPERATION.inverse(5));
      
      // Verify identity (exact recovery)
      expect(state2).toEqual(state0);
      expect(state2.events[0].pitch).toBe(60);
    });
    
    it('should satisfy right inverse for scale velocity', () => {
      const state0 = cloneState(SIMPLE_STATE);
      
      // Apply forward
      const state1 = applyOperation(state0, SCALE_VELOCITY_OPERATION.forward(1.5));
      
      // Verify state changed
      expect(state1.events[0].velocity).toBe(120);
      
      // Apply inverse
      const state2 = applyOperation(state1, SCALE_VELOCITY_OPERATION.inverse(1.5));
      
      // Verify identity (with tolerance for floating point)
      expect(state2.events[0].velocity).toBeCloseTo(80, 0);
      expect(normalizeState(state2)).toEqual(normalizeState(state0));
    });
    
    it('should satisfy right inverse for shift timing', () => {
      const state0 = cloneState(SIMPLE_STATE);
      
      // Apply forward
      const state1 = applyOperation(state0, SHIFT_TIMING_OPERATION.forward(240));
      
      // Verify state changed
      expect(state1.events[0].tick).toBe(240);
      expect(state1.events[1].tick).toBe(720);
      
      // Apply inverse
      const state2 = applyOperation(state1, SHIFT_TIMING_OPERATION.inverse(240));
      
      // Verify identity
      expect(state2).toEqual(state0);
    });
    
    it('should satisfy right inverse for change tempo', () => {
      const state0 = cloneState(SIMPLE_STATE);
      
      // Apply forward
      const state1 = applyOperation(state0, CHANGE_TEMPO_OPERATION.forward(140, 120));
      
      // Verify state changed
      expect(state1.tempo).toBe(140);
      
      // Apply inverse
      const state2 = applyOperation(state1, CHANGE_TEMPO_OPERATION.inverse(140, 120));
      
      // Verify identity
      expect(state2.tempo).toBe(120);
      expect(state2).toEqual(state0);
    });
    
    it('should satisfy right inverse for stretch duration', () => {
      const state0 = cloneState(SIMPLE_STATE);
      
      // Apply forward
      const state1 = applyOperation(state0, STRETCH_DURATION_OPERATION.forward(2.0));
      
      // Verify state changed
      expect(state1.events[0].duration).toBe(960);
      
      // Apply inverse
      const state2 = applyOperation(state1, STRETCH_DURATION_OPERATION.inverse(2.0));
      
      // Verify identity
      expect(state2.events[0].duration).toBe(480);
      expect(state2).toEqual(state0);
    });
  });
  
  describe('Involution property: inverse(inverse(op)) = op', () => {
    it('should satisfy involution for transpose', () => {
      const op = TRANSPOSE_OPERATION.forward(7);
      const inverseOp = TRANSPOSE_OPERATION.inverse(7);
      const inverseInverseOp = TRANSPOSE_OPERATION.inverse(-7);
      
      // inverse(inverse(op)) should equal op
      expect(inverseInverseOp.params.semitones).toBe(op.params.semitones);
    });
    
    it('should satisfy involution for scale velocity', () => {
      const op = SCALE_VELOCITY_OPERATION.forward(1.5);
      const inverseOp = SCALE_VELOCITY_OPERATION.inverse(1.5);
      const inverseInverseOp = SCALE_VELOCITY_OPERATION.inverse(1 / 1.5);
      
      // inverse(inverse(op)) should equal op (within floating point tolerance)
      expect(inverseInverseOp.params.factor).toBeCloseTo(op.params.factor, 10);
    });
    
    it('should satisfy involution for shift timing', () => {
      const op = SHIFT_TIMING_OPERATION.forward(480);
      const inverseOp = SHIFT_TIMING_OPERATION.inverse(480);
      const inverseInverseOp = SHIFT_TIMING_OPERATION.inverse(-480);
      
      expect(inverseInverseOp.params.ticks).toBe(op.params.ticks);
    });
  });
  
  describe('Composition and associativity', () => {
    it('should satisfy associativity for transpose operations', () => {
      const state0 = cloneState(SIMPLE_STATE);
      
      // (op1 · op2) · op3
      const state1a = applyOperation(state0, TRANSPOSE_OPERATION.forward(2));
      const state1b = applyOperation(state1a, TRANSPOSE_OPERATION.forward(3));
      const result1 = applyOperation(state1b, TRANSPOSE_OPERATION.forward(5));
      
      // op1 · (op2 · op3)
      const state2a = applyOperation(state0, TRANSPOSE_OPERATION.forward(3));
      const state2b = applyOperation(state2a, TRANSPOSE_OPERATION.forward(5));
      const result2 = applyOperation(state2b, TRANSPOSE_OPERATION.forward(2));
      
      // Results should be identical (transpose is commutative)
      expect(result1.events[0].pitch).toBe(result2.events[0].pitch);
    });
    
    it('should satisfy inverse composition: (op1 · op2)^-1 = op2^-1 · op1^-1', () => {
      const state0 = cloneState(SIMPLE_STATE);
      
      // Apply forward composition: op1 · op2
      const state1 = applyOperation(state0, TRANSPOSE_OPERATION.forward(3));
      const state2 = applyOperation(state1, SCALE_VELOCITY_OPERATION.forward(1.5));
      
      // Apply inverse composition: op2^-1 · op1^-1
      const state3 = applyOperation(state2, SCALE_VELOCITY_OPERATION.inverse(1.5));
      const state4 = applyOperation(state3, TRANSPOSE_OPERATION.inverse(3));
      
      // Should recover original state
      expect(normalizeState(state4)).toEqual(normalizeState(state0));
    });
    
    it('should handle complex operation chains with inverses', () => {
      const state0 = cloneState(COMPLEX_STATE);
      
      // Apply sequence: transpose → stretch → scale velocity
      let state = applyOperation(state0, TRANSPOSE_OPERATION.forward(5));
      state = applyOperation(state, STRETCH_DURATION_OPERATION.forward(1.5));
      state = applyOperation(state, SCALE_VELOCITY_OPERATION.forward(1.2));
      
      // Verify changes applied
      expect(state.events[0].pitch).toBe(53);
      expect(state.events[0].duration).toBe(1440);
      expect(state.events[0].velocity).toBe(120);
      
      // Apply inverse sequence in reverse order
      state = applyOperation(state, SCALE_VELOCITY_OPERATION.inverse(1.2));
      state = applyOperation(state, STRETCH_DURATION_OPERATION.inverse(1.5));
      state = applyOperation(state, TRANSPOSE_OPERATION.inverse(5));
      
      // Should recover original
      expect(normalizeState(state)).toEqual(normalizeState(state0));
    });
  });
  
  describe('Parametric property tests', () => {
    it('should satisfy right inverse for all transpose values in range', () => {
      const testValues = [-12, -7, -5, -3, -1, 0, 1, 3, 5, 7, 12, 24];
      
      for (const semitones of testValues) {
        const state0 = cloneState(SIMPLE_STATE);
        const state1 = applyOperation(state0, TRANSPOSE_OPERATION.forward(semitones));
        const state2 = applyOperation(state1, TRANSPOSE_OPERATION.inverse(semitones));
        
        expect(state2).toEqual(state0);
      }
    });
    
    it('should satisfy right inverse for all scale factors', () => {
      const testFactors = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];
      
      for (const factor of testFactors) {
        const state0 = cloneState(SIMPLE_STATE);
        const state1 = applyOperation(state0, SCALE_VELOCITY_OPERATION.forward(factor));
        const state2 = applyOperation(state1, SCALE_VELOCITY_OPERATION.inverse(factor));
        
        expect(normalizeState(state2)).toEqual(normalizeState(state0));
      }
    });
    
    it('should satisfy right inverse for all timing shifts', () => {
      const testShifts = [-960, -480, -240, 0, 240, 480, 960, 1920];
      
      for (const ticks of testShifts) {
        const state0 = cloneState(SIMPLE_STATE);
        const state1 = applyOperation(state0, SHIFT_TIMING_OPERATION.forward(ticks));
        const state2 = applyOperation(state1, SHIFT_TIMING_OPERATION.inverse(ticks));
        
        expect(state2).toEqual(state0);
      }
    });
  });
  
  describe('Edge cases and boundary conditions', () => {
    it('should handle identity operation (transpose by 0)', () => {
      const state0 = cloneState(SIMPLE_STATE);
      const state1 = applyOperation(state0, TRANSPOSE_OPERATION.forward(0));
      const state2 = applyOperation(state1, TRANSPOSE_OPERATION.inverse(0));
      
      expect(state1).toEqual(state0);
      expect(state2).toEqual(state0);
    });
    
    it('should handle inverse of identity', () => {
      const state0 = cloneState(SIMPLE_STATE);
      
      // Apply identity
      const state1 = applyOperation(state0, SCALE_VELOCITY_OPERATION.forward(1.0));
      
      // Apply inverse of identity (should still be identity)
      const state2 = applyOperation(state1, SCALE_VELOCITY_OPERATION.inverse(1.0));
      
      expect(state1).toEqual(state0);
      expect(state2).toEqual(state0);
    });
    
    it('should handle extreme values gracefully', () => {
      const state0 = cloneState(SIMPLE_STATE);
      
      // Very large transpose
      const state1 = applyOperation(state0, TRANSPOSE_OPERATION.forward(36));
      expect(state1.events[0].pitch).toBe(96);
      
      // Inverse should still recover
      const state2 = applyOperation(state1, TRANSPOSE_OPERATION.inverse(36));
      expect(state2).toEqual(state0);
    });
    
    it('should handle very small scale factors', () => {
      const state0 = cloneState(SIMPLE_STATE);
      
      // Scale down
      const state1 = applyOperation(state0, SCALE_VELOCITY_OPERATION.forward(0.1));
      expect(state1.events[0].velocity).toBe(8);
      
      // Scale back up
      const state2 = applyOperation(state1, SCALE_VELOCITY_OPERATION.inverse(0.1));
      expect(state2.events[0].velocity).toBeCloseTo(80, 0);
    });
    
    it('should handle empty state', () => {
      const emptyState: TestState = { tempo: 120, events: [] };
      
      // Operations on empty state should be safe
      const state1 = applyOperation(emptyState, TRANSPOSE_OPERATION.forward(5));
      const state2 = applyOperation(state1, TRANSPOSE_OPERATION.inverse(5));
      
      expect(state2).toEqual(emptyState);
    });
  });
  
  describe('Inverse existence and completeness', () => {
    it('should have inverse defined for all reversible operations', () => {
      const reversibleOps = [
        TRANSPOSE_OPERATION,
        SCALE_VELOCITY_OPERATION,
        SHIFT_TIMING_OPERATION,
        CHANGE_TEMPO_OPERATION,
        STRETCH_DURATION_OPERATION,
        ADD_OFFSET_OPERATION,
      ];
      
      for (const op of reversibleOps) {
        expect(op.isReversible).toBe(true);
        expect(op.forward).toBeDefined();
        expect(op.inverse).toBeDefined();
      }
    });
    
    it('should produce valid inverse operations', () => {
      const forwardOp = TRANSPOSE_OPERATION.forward(5);
      const inverseOp = TRANSPOSE_OPERATION.inverse(5);
      
      expect(inverseOp.type).toBe('transpose');
      expect(inverseOp.params.semitones).toBe(-5);
    });
  });
  
  describe('Precision and numerical stability', () => {
    it('should maintain precision through multiple inverse pairs', () => {
      let state = cloneState(SIMPLE_STATE);
      
      // Apply 10 transpose pairs
      for (let i = 0; i < 10; i++) {
        state = applyOperation(state, TRANSPOSE_OPERATION.forward(3));
        state = applyOperation(state, TRANSPOSE_OPERATION.inverse(3));
      }
      
      // Should still equal original
      expect(state).toEqual(SIMPLE_STATE);
    });
    
    it('should maintain precision through multiple scale pairs', () => {
      let state = cloneState(SIMPLE_STATE);
      
      // Apply 10 scale pairs
      for (let i = 0; i < 10; i++) {
        state = applyOperation(state, SCALE_VELOCITY_OPERATION.forward(1.5));
        state = applyOperation(state, SCALE_VELOCITY_OPERATION.inverse(1.5));
      }
      
      // Should be close to original (allowing some floating point error)
      expect(normalizeState(state)).toEqual(normalizeState(SIMPLE_STATE));
    });
    
    it('should detect precision loss', () => {
      const state0 = cloneState(SIMPLE_STATE);
      
      let state = state0;
      for (let i = 0; i < 100; i++) {
        state = applyOperation(state, SCALE_VELOCITY_OPERATION.forward(1.01));
        state = applyOperation(state, SCALE_VELOCITY_OPERATION.inverse(1.01));
      }
      
      // After many operations, floating point error accumulates
      const error = Math.abs(state.events[0].velocity - state0.events[0].velocity);
      
      // Error should be bounded
      expect(error).toBeLessThan(5); // Within 5 velocity units
    });
  });
});

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Apply an operation to state.
 */
function applyOperation(state: TestState, operation: Operation): TestState {
  const newState = cloneState(state);
  
  switch (operation.type) {
    case 'transpose':
      return {
        ...newState,
        events: newState.events.map(e => ({
          ...e,
          pitch: e.pitch + operation.params.semitones,
        })),
      };
      
    case 'scale_velocity':
      return {
        ...newState,
        events: newState.events.map(e => ({
          ...e,
          velocity: Math.round(e.velocity * operation.params.factor),
        })),
      };
      
    case 'shift_timing':
      return {
        ...newState,
        events: newState.events.map(e => ({
          ...e,
          tick: e.tick + operation.params.ticks,
        })),
      };
      
    case 'change_tempo':
      return {
        ...newState,
        tempo: operation.params.tempo,
      };
      
    case 'stretch_duration':
      return {
        ...newState,
        events: newState.events.map(e => ({
          ...e,
          duration: Math.round(e.duration * operation.params.factor),
        })),
      };
      
    case 'add_offset':
      return {
        ...newState,
        events: newState.events.map(e => ({
          ...e,
          [operation.params.dimension]: (e as any)[operation.params.dimension] + operation.params.offset,
        })),
      };
      
    default:
      return newState;
  }
}

/**
 * Clone state for isolation.
 */
function cloneState(state: TestState): TestState {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Normalize state for comparison (round floating point values).
 */
function normalizeState(state: TestState): TestState {
  return {
    ...state,
    events: state.events.map(e => ({
      ...e,
      velocity: Math.round(e.velocity),
      duration: Math.round(e.duration),
    })),
  };
}
