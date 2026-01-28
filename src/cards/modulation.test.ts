/**
 * @fileoverview Modulation System Tests.
 * 
 * @module @cardplay/core/cards/modulation.test
 */

import { describe, it, expect } from 'vitest';
import {
  // LFO
  createLfoSource,
  calculateLfoValue,
  // Envelope
  createEnvelopeSource,
  createEnvelopeState,
  triggerEnvelope,
  releaseEnvelope,
  processEnvelope,
  // MIDI CC
  createMidiCcSource,
  processMidiCc,
  // Expression
  createExpressionSource,
  // Cross-card
  createCrossCardSource,
  // Routing
  createModulationRouting,
  setRoutingAmount,
  toggleRouting,
  // Matrix
  createModulationMatrix,
  addSource,
  removeSource,
  addRouting,
  removeRouting,
  getRoutingsForTarget,
  getRoutingsFromSource,
  // Processing
  createModulationState,
  updateSourceValue,
  calculateModulatedValue,
  processModulation,
  // Presets
  LFO_PRESETS,
  ENVELOPE_PRESETS,
} from './modulation';
import { createFloatParameter } from './parameters';

// ============================================================================
// LFO TESTS
// ============================================================================

describe('LFO Source', () => {
  describe('createLfoSource', () => {
    it('should create LFO with defaults', () => {
      const lfo = createLfoSource({ id: 'lfo1' });
      
      expect(lfo.type).toBe('lfo');
      expect(lfo.id).toBe('lfo1');
      expect(lfo.waveform).toBe('sine');
      expect(lfo.rateHz).toBe(1);
      expect(lfo.bipolar).toBe(true);
      expect(lfo.phase).toBe(0);
    });

    it('should create LFO with custom options', () => {
      const lfo = createLfoSource({
        id: 'lfo2',
        waveform: 'triangle',
        rateHz: 5,
        syncMode: 'tempo',
        tempoRate: '1/8',
        phase: 0.25,
      });
      
      expect(lfo.waveform).toBe('triangle');
      expect(lfo.rateHz).toBe(5);
      expect(lfo.syncMode).toBe('tempo');
      expect(lfo.phase).toBe(0.25);
    });
  });

  describe('calculateLfoValue', () => {
    it('should calculate sine wave', () => {
      const lfo = createLfoSource({ id: 'test', waveform: 'sine', bipolar: true });
      
      expect(calculateLfoValue(lfo, 0)).toBeCloseTo(0, 5);
      expect(calculateLfoValue(lfo, 0.25)).toBeCloseTo(1, 5);
      expect(calculateLfoValue(lfo, 0.5)).toBeCloseTo(0, 5);
      expect(calculateLfoValue(lfo, 0.75)).toBeCloseTo(-1, 5);
    });

    it('should calculate triangle wave', () => {
      const lfo = createLfoSource({ id: 'test', waveform: 'triangle', bipolar: true });
      
      expect(calculateLfoValue(lfo, 0)).toBeCloseTo(-1, 5);
      expect(calculateLfoValue(lfo, 0.25)).toBeCloseTo(0, 5);
      expect(calculateLfoValue(lfo, 0.5)).toBeCloseTo(1, 5);
      expect(calculateLfoValue(lfo, 0.75)).toBeCloseTo(0, 5);
    });

    it('should calculate sawtooth wave', () => {
      const lfo = createLfoSource({ id: 'test', waveform: 'sawtooth', bipolar: true });
      
      expect(calculateLfoValue(lfo, 0)).toBeCloseTo(-1, 5);
      expect(calculateLfoValue(lfo, 0.5)).toBeCloseTo(0, 5);
      expect(calculateLfoValue(lfo, 0.999)).toBeCloseTo(1, 1); // Close to end
    });

    it('should calculate square wave', () => {
      const lfo = createLfoSource({ id: 'test', waveform: 'square', bipolar: true });
      
      expect(calculateLfoValue(lfo, 0.1)).toBe(1);
      expect(calculateLfoValue(lfo, 0.6)).toBe(-1);
    });

    it('should respect phase offset', () => {
      const lfo = createLfoSource({ id: 'test', waveform: 'sine', phase: 0.25, bipolar: true });
      
      // With phase 0.25, at time 0 we should be at what was 0.25 position (peak)
      expect(calculateLfoValue(lfo, 0)).toBeCloseTo(1, 5);
    });

    it('should convert to unipolar', () => {
      const lfo = createLfoSource({ id: 'test', waveform: 'sine', bipolar: false });
      
      // Unipolar: range is 0 to 1
      expect(calculateLfoValue(lfo, 0)).toBeCloseTo(0.5, 5);
      expect(calculateLfoValue(lfo, 0.25)).toBeCloseTo(1, 5);
      expect(calculateLfoValue(lfo, 0.75)).toBeCloseTo(0, 5);
    });
  });
});

// ============================================================================
// ENVELOPE TESTS
// ============================================================================

describe('Envelope Source', () => {
  describe('createEnvelopeSource', () => {
    it('should create envelope with defaults', () => {
      const env = createEnvelopeSource({ id: 'env1' });
      
      expect(env.type).toBe('envelope');
      expect(env.attack).toBe(0.01);
      expect(env.decay).toBe(0.1);
      expect(env.sustain).toBe(0.7);
      expect(env.release).toBe(0.3);
    });
  });

  describe('envelope state machine', () => {
    it('should start in idle state', () => {
      const state = createEnvelopeState();
      
      expect(state.stage).toBe('idle');
      expect(state.value).toBe(0);
    });

    it('should trigger to attack stage', () => {
      const state = createEnvelopeState();
      const triggered = triggerEnvelope(state, 0, 1);
      
      expect(triggered.stage).toBe('attack');
      expect(triggered.velocity).toBe(1);
    });

    it('should release to release stage', () => {
      let state = createEnvelopeState();
      state = triggerEnvelope(state, 0, 1);
      
      // Simulate being in sustain
      state = { ...state, stage: 'sustain' as const, value: 0.7 };
      const released = releaseEnvelope(state, 1);
      
      expect(released.stage).toBe('release');
      expect(released.releaseStartValue).toBe(0.7);
    });

    it('should not release from idle', () => {
      const state = createEnvelopeState();
      const released = releaseEnvelope(state, 0);
      
      expect(released).toBe(state);
    });
  });

  describe('processEnvelope', () => {
    it('should progress through attack phase', () => {
      const env = createEnvelopeSource({ id: 'env', attack: 0.1 });
      let state = triggerEnvelope(createEnvelopeState(), 0, 1);
      
      // Midway through attack
      state = processEnvelope(env, state, 0.05);
      expect(state.value).toBeGreaterThan(0);
      expect(state.value).toBeLessThan(1);
      
      // After attack
      state = processEnvelope(env, state, 0.11);
      expect(state.stage).toBe('decay');
    });

    it('should reach sustain level', () => {
      const env = createEnvelopeSource({
        id: 'env',
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
      });
      let state = triggerEnvelope(createEnvelopeState(), 0, 1);
      
      // Process through attack
      state = processEnvelope(env, state, 0.02);
      // Process through decay
      state = processEnvelope(env, state, 0.15);
      expect(state.stage).toBe('sustain');
      expect(state.value).toBeCloseTo(0.5, 1);
    });

    it('should return to idle after release', () => {
      const env = createEnvelopeSource({
        id: 'env',
        attack: 0.01,
        decay: 0.01,
        sustain: 0.5,
        release: 0.1,
      });
      let state = triggerEnvelope(createEnvelopeState(), 0, 1);
      
      // Fast-forward to sustain
      state = processEnvelope(env, { ...state, stage: 'sustain' as const, value: 0.5 }, 0.1);
      
      // Trigger release
      state = releaseEnvelope(state, 0.1);
      
      // After release completes
      state = processEnvelope(env, state, 0.3);
      expect(state.stage).toBe('idle');
      expect(state.value).toBe(0);
    });
  });
});

// ============================================================================
// MIDI CC TESTS
// ============================================================================

describe('MIDI CC Source', () => {
  describe('createMidiCcSource', () => {
    it('should create CC source', () => {
      const cc = createMidiCcSource({ id: 'cc1', ccNumber: 74 });
      
      expect(cc.type).toBe('midi-cc');
      expect(cc.ccNumber).toBe(74);
      expect(cc.channel).toBe(-1); // Omni by default
    });
  });

  describe('processMidiCc', () => {
    it('should normalize 0-127 to 0-1', () => {
      const cc = createMidiCcSource({ id: 'cc', ccNumber: 1 });
      
      expect(processMidiCc(cc, 0)).toBe(0);
      expect(processMidiCc(cc, 127)).toBe(1);
      expect(processMidiCc(cc, 64)).toBeCloseTo(0.504, 2);
    });

    it('should invert when configured', () => {
      const cc = createMidiCcSource({ id: 'cc', ccNumber: 1, invert: true });
      
      expect(processMidiCc(cc, 0)).toBe(1);
      expect(processMidiCc(cc, 127)).toBe(0);
    });

    it('should convert to bipolar when configured', () => {
      const cc = createMidiCcSource({ id: 'cc', ccNumber: 1, bipolar: true });
      
      expect(processMidiCc(cc, 0)).toBe(-1);
      expect(processMidiCc(cc, 127)).toBe(1);
      expect(processMidiCc(cc, 64)).toBeCloseTo(0, 1);
    });
  });
});

// ============================================================================
// EXPRESSION TESTS
// ============================================================================

describe('Expression Source', () => {
  describe('createExpressionSource', () => {
    it('should create expression source', () => {
      const expr = createExpressionSource({ id: 'pressure', dimension: 'pressure' });
      
      expect(expr.type).toBe('expression');
      expect(expr.dimension).toBe('pressure');
      expect(expr.bipolar).toBe(false);
    });

    it('should default pitch-bend to bipolar', () => {
      const expr = createExpressionSource({ id: 'pb', dimension: 'pitch-bend' });
      
      expect(expr.bipolar).toBe(true);
    });
  });
});

// ============================================================================
// CROSS-CARD TESTS
// ============================================================================

describe('Cross-Card Source', () => {
  describe('createCrossCardSource', () => {
    it('should create cross-card source', () => {
      const source = createCrossCardSource({
        id: 'x-card',
        sourceCardId: 'lfo-card',
        sourceOutputId: 'output',
      });
      
      expect(source.type).toBe('cross-card');
      expect(source.sourceCardId).toBe('lfo-card');
      expect(source.sourceOutputId).toBe('output');
    });
  });
});

// ============================================================================
// ROUTING TESTS
// ============================================================================

describe('Modulation Routing', () => {
  describe('createModulationRouting', () => {
    it('should create routing with defaults', () => {
      const routing = createModulationRouting({
        id: 'r1',
        sourceId: 'lfo1',
        targetId: 'synth.cutoff',
      });
      
      expect(routing.amount).toBe(1);
      expect(routing.bipolar).toBe(true);
      expect(routing.enabled).toBe(true);
      expect(routing.curve).toBe('linear');
    });
  });

  describe('setRoutingAmount', () => {
    it('should update amount', () => {
      const routing = createModulationRouting({
        id: 'r1',
        sourceId: 'lfo',
        targetId: 'target',
      });
      
      const updated = setRoutingAmount(routing, 0.5);
      expect(updated.amount).toBe(0.5);
    });

    it('should clamp to -1 to 1', () => {
      const routing = createModulationRouting({
        id: 'r1',
        sourceId: 'lfo',
        targetId: 'target',
      });
      
      expect(setRoutingAmount(routing, 2).amount).toBe(1);
      expect(setRoutingAmount(routing, -2).amount).toBe(-1);
    });
  });

  describe('toggleRouting', () => {
    it('should toggle enabled state', () => {
      const routing = createModulationRouting({
        id: 'r1',
        sourceId: 'lfo',
        targetId: 'target',
        enabled: true,
      });
      
      expect(toggleRouting(routing).enabled).toBe(false);
      expect(toggleRouting(toggleRouting(routing)).enabled).toBe(true);
    });
  });
});

// ============================================================================
// MATRIX TESTS
// ============================================================================

describe('Modulation Matrix', () => {
  describe('createModulationMatrix', () => {
    it('should create empty matrix', () => {
      const matrix = createModulationMatrix();
      
      expect(matrix.sources.size).toBe(0);
      expect(matrix.routings.size).toBe(0);
    });
  });

  describe('addSource / removeSource', () => {
    it('should add source', () => {
      let matrix = createModulationMatrix();
      const lfo = createLfoSource({ id: 'lfo1' });
      matrix = addSource(matrix, lfo);
      
      expect(matrix.sources.get('lfo1')).toBe(lfo);
    });

    it('should remove source and its routings', () => {
      let matrix = createModulationMatrix();
      const lfo = createLfoSource({ id: 'lfo1' });
      matrix = addSource(matrix, lfo);
      matrix = addRouting(matrix, createModulationRouting({
        id: 'r1',
        sourceId: 'lfo1',
        targetId: 'synth.cutoff',
      }));
      
      // Verify setup
      expect(matrix.sources.has('lfo1')).toBe(true);
      expect(matrix.routings.has('r1')).toBe(true);
      
      matrix = removeSource(matrix, 'lfo1');
      
      // Source should be removed
      expect(matrix.sources.has('lfo1')).toBe(false);
      // Routings using that source should also be removed
      expect(matrix.routings.has('r1')).toBe(false);
    });
  });

  describe('addRouting / removeRouting', () => {
    it('should add routing and update indices', () => {
      let matrix = createModulationMatrix();
      const routing = createModulationRouting({
        id: 'r1',
        sourceId: 'lfo1',
        targetId: 'synth.cutoff',
      });
      matrix = addRouting(matrix, routing);
      
      expect(matrix.routings.get('r1')).toBe(routing);
      expect(getRoutingsForTarget(matrix, 'synth.cutoff')).toContain(routing);
      expect(getRoutingsFromSource(matrix, 'lfo1')).toContain(routing);
    });

    it('should remove routing and update indices', () => {
      let matrix = createModulationMatrix();
      matrix = addRouting(matrix, createModulationRouting({
        id: 'r1',
        sourceId: 'lfo1',
        targetId: 'synth.cutoff',
      }));
      
      matrix = removeRouting(matrix, 'r1');
      
      expect(matrix.routings.has('r1')).toBe(false);
      expect(getRoutingsForTarget(matrix, 'synth.cutoff').length).toBe(0);
    });
  });
});

// ============================================================================
// PROCESSING TESTS
// ============================================================================

describe('Modulation Processing', () => {
  describe('createModulationState / updateSourceValue', () => {
    it('should create empty state', () => {
      const state = createModulationState();
      
      expect(state.sourceValues.size).toBe(0);
    });

    it('should update source value', () => {
      let state = createModulationState();
      state = updateSourceValue(state, 'lfo1', 0.5, 1000);
      
      expect(state.sourceValues.get('lfo1')).toBe(0.5);
      expect(state.timestamp).toBe(1000);
    });
  });

  describe('calculateModulatedValue', () => {
    it('should modulate base value', () => {
      const param = createFloatParameter({
        id: 'cutoff',
        name: 'Cutoff',
        min: 0,
        max: 1,
      });
      
      const routing = createModulationRouting({
        id: 'r1',
        sourceId: 'lfo1',
        targetId: 'synth.cutoff',
        amount: 0.5,
      });
      
      let modState = createModulationState();
      modState = updateSourceValue(modState, 'lfo1', 1, 0); // LFO at max
      
      const matrix = createModulationMatrix();
      
      // Base value 0.5, LFO at 1 with amount 0.5 = 0.5 + (1 * 0.5 * 1) = 1
      const modulated = calculateModulatedValue(0.5, param, [routing], modState, matrix);
      
      expect(modulated).toBe(1);
    });

    it('should clamp to parameter range', () => {
      const param = createFloatParameter({
        id: 'cutoff',
        name: 'Cutoff',
        min: 0,
        max: 1,
      });
      
      const routing = createModulationRouting({
        id: 'r1',
        sourceId: 'lfo1',
        targetId: 'synth.cutoff',
        amount: 1,
      });
      
      let modState = createModulationState();
      modState = updateSourceValue(modState, 'lfo1', 1, 0);
      
      const matrix = createModulationMatrix();
      
      // Base 0.8 + mod 1 = 1.8, should clamp to 1
      const modulated = calculateModulatedValue(0.8, param, [routing], modState, matrix);
      
      expect(modulated).toBe(1);
    });

    it('should respect disabled routings', () => {
      const param = createFloatParameter({ id: 'test', name: 'Test' });
      const routing = createModulationRouting({
        id: 'r1',
        sourceId: 'lfo1',
        targetId: 'test',
        amount: 1,
        enabled: false,
      });
      
      let modState = createModulationState();
      modState = updateSourceValue(modState, 'lfo1', 1, 0);
      
      const modulated = calculateModulatedValue(0.5, param, [routing], modState, createModulationMatrix());
      
      expect(modulated).toBe(0.5); // Unchanged because routing disabled
    });
  });

  describe('processModulation', () => {
    it('should process all parameters', () => {
      const params = [
        createFloatParameter({ id: 'cutoff', name: 'Cutoff', min: 0, max: 1 }),
        createFloatParameter({ id: 'resonance', name: 'Resonance', min: 0, max: 1 }),
      ];
      
      const baseValues = new Map<string, unknown>([
        ['cutoff', 0.5],
        ['resonance', 0.3],
      ]);
      
      let matrix = createModulationMatrix();
      matrix = addRouting(matrix, createModulationRouting({
        id: 'r1',
        sourceId: 'lfo1',
        targetId: 'synth.cutoff',
        amount: 0.2,
      }));
      
      let modState = createModulationState();
      modState = updateSourceValue(modState, 'lfo1', 1, 0);
      
      const result = processModulation(params, baseValues, matrix, modState, 'synth');
      
      expect(result.get('cutoff')).toBeCloseTo(0.7, 5); // 0.5 + 0.2
      expect(result.get('resonance')).toBe(0.3); // No modulation
    });
  });
});

// ============================================================================
// PRESET TESTS
// ============================================================================

describe('Modulation Presets', () => {
  describe('LFO_PRESETS', () => {
    it('should have vibrato preset', () => {
      expect(LFO_PRESETS.VIBRATO.waveform).toBe('sine');
      expect(LFO_PRESETS.VIBRATO.rateHz).toBeGreaterThan(0);
    });

    it('should have tremolo preset', () => {
      expect(LFO_PRESETS.TREMOLO.waveform).toBe('sine');
      expect(LFO_PRESETS.TREMOLO.bipolar).toBe(false);
    });

    it('should have synced gate preset', () => {
      expect(LFO_PRESETS.SYNCED_GATE.syncMode).toBe('tempo');
      expect(LFO_PRESETS.SYNCED_GATE.waveform).toBe('square');
    });
  });

  describe('ENVELOPE_PRESETS', () => {
    it('should have pluck preset', () => {
      expect(ENVELOPE_PRESETS.PLUCK.attack).toBeLessThan(0.01);
      expect(ENVELOPE_PRESETS.PLUCK.sustain).toBe(0);
    });

    it('should have pad preset', () => {
      expect(ENVELOPE_PRESETS.PAD.attack).toBeGreaterThan(0.1);
      expect(ENVELOPE_PRESETS.PAD.sustain).toBeGreaterThan(0.5);
    });
  });
});
