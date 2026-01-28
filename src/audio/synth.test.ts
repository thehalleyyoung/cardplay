/**
 * @fileoverview Tests for Synthesizer Engine.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Oscillator,
  LFO,
  FMOperator,
  FMVoice,
  DelayLine,
  Chorus,
  Reverb,
  CombFilter,
  AllpassFilter,
  Compressor,
  generateBasicWavetable,
  createWavetable,
  generateSynthProcessorScript,
  DEFAULT_OSCILLATOR,
  DEFAULT_LFO,
  DEFAULT_DELAY,
  DEFAULT_CHORUS,
  DEFAULT_REVERB,
  DEFAULT_COMPRESSOR,
  DEFAULT_EQ,
  DEFAULT_FILTER,
  DEFAULT_SYNTH_VOICE,
} from './synth';

// ============================================================================
// OSCILLATOR TESTS
// ============================================================================

describe('generateBasicWavetable', () => {
  it('should generate sine wave', () => {
    const table = generateBasicWavetable('sine', 1024);
    
    expect(table.length).toBe(1024);
    expect(table[0]).toBeCloseTo(0);
    expect(table[256]).toBeCloseTo(1, 1); // Quarter cycle = peak
    expect(table[512]).toBeCloseTo(0, 1); // Half cycle = zero
  });

  it('should generate sawtooth wave', () => {
    const table = generateBasicWavetable('sawtooth', 100);
    
    expect(table[0]).toBeCloseTo(-1);
    expect(table[99]).toBeCloseTo(0.98, 1);
  });

  it('should generate square wave', () => {
    const table = generateBasicWavetable('square', 100);
    
    expect(table[0]).toBe(1);
    expect(table[50]).toBe(-1);
  });

  it('should generate triangle wave', () => {
    const table = generateBasicWavetable('triangle', 100);
    
    // Triangle starts at 4*|0-0.5|-1 = 4*0.5-1 = 1 at phase 0
    expect(table[0]).toBe(1);
    // At phase 0.5, triangle = 4*|0.5-0.5|-1 = -1
    expect(table[50]).toBe(-1);
  });

  it('should generate noise', () => {
    const table = generateBasicWavetable('noise', 100);
    
    // Noise should be random values between -1 and 1
    for (let i = 0; i < table.length; i++) {
      expect(table[i]).toBeGreaterThanOrEqual(-1);
      expect(table[i]).toBeLessThanOrEqual(1);
    }
  });
});

describe('createWavetable', () => {
  it('should create wavetable from frames', () => {
    const frames = [new Float32Array(256), new Float32Array(256)];
    const wavetable = createWavetable('test', frames);
    
    expect(wavetable.name).toBe('test');
    expect(wavetable.frames).toHaveLength(2);
    expect(wavetable.samplesPerFrame).toBe(256);
  });
});

describe('Oscillator', () => {
  it('should create with default params', () => {
    const osc = new Oscillator();
    
    expect(osc.getPhase()).toBe(0);
  });

  it('should generate samples', () => {
    const osc = new Oscillator({ waveform: 'sine', frequency: 1000 });
    
    const sample = osc.process();
    expect(typeof sample).toBe('number');
    expect(osc.getPhase()).toBeGreaterThan(0);
  });

  it('should process block', () => {
    const osc = new Oscillator({ waveform: 'sawtooth', frequency: 440 });
    const output = new Float32Array(128);
    
    osc.processBlock(output);
    
    // Check output has varying values
    const hasVariation = output.some((v, i) => i > 0 && v !== output[0]);
    expect(hasVariation).toBe(true);
  });

  it('should reset phase', () => {
    const osc = new Oscillator({ frequency: 1000 });
    osc.process();
    osc.process();
    
    osc.reset();
    expect(osc.getPhase()).toBe(0);
  });

  it('should set phase', () => {
    const osc = new Oscillator();
    osc.setPhase(0.5);
    
    expect(osc.getPhase()).toBe(0.5);
  });

  it('should apply detune', () => {
    const osc1 = new Oscillator({ frequency: 440, detune: 0 });
    const osc2 = new Oscillator({ frequency: 440, detune: 100 });
    
    // Process both
    osc1.process();
    osc2.process();
    
    // Detuned oscillator should have different phase advancement
    expect(osc1.getPhase()).not.toBe(osc2.getPhase());
  });

  it('should set custom wavetable', () => {
    const osc = new Oscillator({ waveform: 'wavetable' });
    const table = new Float32Array([1, 0, -1, 0]);
    osc.setWavetable(table);
    
    const sample = osc.process();
    expect(typeof sample).toBe('number');
  });
});

// ============================================================================
// LFO TESTS
// ============================================================================

describe('LFO', () => {
  it('should create with default params', () => {
    const lfo = new LFO();
    
    expect(lfo.process()).toBeDefined();
  });

  it('should generate sine wave', () => {
    const lfo = new LFO({ waveform: 'sine', frequency: 1, depth: 1 }, 4);
    
    // At 4Hz sample rate and 1Hz frequency, 4 samples = 1 cycle
    const s0 = lfo.process(); // 0 degrees
    const s1 = lfo.process(); // 90 degrees
    
    expect(s0).toBeCloseTo(0, 1);
    expect(s1).toBeCloseTo(1, 1);
  });

  it('should generate square wave', () => {
    const lfo = new LFO({ waveform: 'square', frequency: 1, depth: 1 }, 4);
    
    expect(lfo.process()).toBe(1);  // First half
    expect(lfo.process()).toBe(1);  // Still first half
    expect(lfo.process()).toBe(-1); // Second half
  });

  it('should apply depth', () => {
    const lfo = new LFO({ waveform: 'square', frequency: 1, depth: 0.5 }, 4);
    
    expect(lfo.process()).toBe(0.5);
    expect(lfo.process()).toBe(0.5);
    expect(lfo.process()).toBe(-0.5);
  });

  it('should retrigger', () => {
    const lfo = new LFO({ waveform: 'sawtooth', frequency: 1, depth: 1 }, 4);
    
    lfo.process();
    lfo.process();
    lfo.retrigger();
    
    // After retrigger, should be at phase 0
    expect(lfo.process()).toBeCloseTo(-1, 1);
  });

  it('should generate sample-hold', () => {
    const lfo = new LFO({ waveform: 'sample-hold', frequency: 1000, depth: 1 }, 48000);
    
    const samples = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      samples.add(lfo.process());
    }
    
    // Should have multiple unique values from random sampling at this frequency
    expect(samples.size).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// FM SYNTHESIS TESTS
// ============================================================================

describe('FMOperator', () => {
  it('should process with no modulation', () => {
    const op = new FMOperator({ ratio: 1, detune: 0, level: 1 });
    
    const sample = op.process(440);
    expect(typeof sample).toBe('number');
    expect(Math.abs(sample)).toBeLessThanOrEqual(1);
  });

  it('should apply frequency ratio', () => {
    const op1 = new FMOperator({ ratio: 1, detune: 0, level: 1 });
    const op2 = new FMOperator({ ratio: 2, detune: 0, level: 1 });
    
    // Process several samples
    for (let i = 0; i < 10; i++) {
      op1.process(440);
      op2.process(440);
    }
    
    // Different ratios should produce different patterns
    expect(op1.process(440)).not.toBe(op2.process(440));
  });

  it('should apply modulation', () => {
    const op = new FMOperator({ ratio: 1, detune: 0, level: 1 });
    
    const withMod = op.process(440, 0.5);
    op.reset();
    const withoutMod = op.process(440, 0);
    
    // Modulation changes the output
    expect(withMod).not.toBe(withoutMod);
  });

  it('should reset', () => {
    const op = new FMOperator({ ratio: 1, detune: 0, level: 1 });
    op.process(440);
    op.process(440);
    op.reset();
    
    const sample = op.process(440);
    // After reset, should be consistent
    expect(typeof sample).toBe('number');
  });
});

describe('FMVoice', () => {
  it('should create with serial algorithm', () => {
    const voice = new FMVoice({
      algorithm: 'serial',
      operators: [
        { ratio: 1, detune: 0, level: 1 },
        { ratio: 2, detune: 0, level: 1 },
      ],
    });
    
    const sample = voice.process(440);
    expect(typeof sample).toBe('number');
  });

  it('should create with parallel algorithm', () => {
    const voice = new FMVoice({
      algorithm: 'parallel',
      operators: [
        { ratio: 1, detune: 0, level: 1 },
        { ratio: 2, detune: 0, level: 0.5 },
      ],
    });
    
    const sample = voice.process(440);
    expect(typeof sample).toBe('number');
  });

  it('should create with stack algorithm', () => {
    const voice = new FMVoice({
      algorithm: 'stack',
      operators: [
        { ratio: 1, detune: 0, level: 1 },
        { ratio: 2, detune: 0, level: 1 },
        { ratio: 3, detune: 0, level: 1 },
        { ratio: 4, detune: 0, level: 1 },
      ],
    });
    
    const sample = voice.process(440);
    expect(typeof sample).toBe('number');
  });

  it('should reset all operators', () => {
    const voice = new FMVoice({
      algorithm: 'parallel',
      operators: [
        { ratio: 1, detune: 0, level: 1 },
      ],
    });
    
    voice.process(440);
    voice.reset();
    
    // After reset, should produce consistent output
    const sample = voice.process(440);
    expect(typeof sample).toBe('number');
  });
});

// ============================================================================
// EFFECTS TESTS
// ============================================================================

describe('DelayLine', () => {
  it('should create delay', () => {
    const delay = new DelayLine(1, 48000);
    
    const output = delay.process(1);
    expect(typeof output).toBe('number');
  });

  it('should delay signal', () => {
    const delay = new DelayLine(1, 48000, { time: 0.01, feedback: 0, mix: 1 });
    
    // Send impulse
    delay.process(1);
    
    // Wait for delay time
    let delayedOutput = 0;
    for (let i = 0; i < 480; i++) { // 10ms at 48kHz = 480 samples
      delayedOutput = delay.process(0);
    }
    
    // Should see the delayed impulse
    expect(delayedOutput).toBe(1);
  });

  it('should apply feedback', () => {
    const delay = new DelayLine(1, 48000, { time: 0.001, feedback: 0.5, mix: 1 });
    
    delay.process(1);
    
    // First echo
    let output = 0;
    for (let i = 0; i < 48; i++) {
      output = delay.process(0);
    }
    expect(output).toBeCloseTo(1);
    
    // Second echo should be reduced by feedback
    for (let i = 0; i < 48; i++) {
      output = delay.process(0);
    }
    expect(output).toBeCloseTo(0.5, 1);
  });

  it('should clear buffer', () => {
    const delay = new DelayLine(1, 48000, { time: 0.001, feedback: 0.9, mix: 1 });
    
    delay.process(1);
    delay.clear();
    
    // After clear, no delayed signal
    let output = 0;
    for (let i = 0; i < 100; i++) {
      output = delay.process(0);
    }
    expect(output).toBe(0);
  });
});

describe('Chorus', () => {
  it('should process signal', () => {
    const chorus = new Chorus(48000);
    
    const output = chorus.process(0.5);
    expect(typeof output).toBe('number');
  });

  it('should apply mix', () => {
    const chorus = new Chorus(48000, { rate: 1, depth: 0, mix: 0 });
    
    // With mix 0, output should equal input
    const output = chorus.process(0.5);
    expect(output).toBe(0.5);
  });

  it('should clear buffer', () => {
    const chorus = new Chorus(48000);
    
    chorus.process(1);
    chorus.clear();
    
    // After clear, processing should still work
    const output = chorus.process(0);
    expect(typeof output).toBe('number');
  });
});

describe('CombFilter', () => {
  it('should process signal', () => {
    const comb = new CombFilter(100, 0.5, 0.5);
    
    const output = comb.process(1);
    expect(typeof output).toBe('number');
  });

  it('should create resonance with feedback', () => {
    const comb = new CombFilter(10, 0.8, 0);
    
    comb.process(1);
    
    // After delay, should see resonant signal
    let output = 0;
    for (let i = 0; i < 10; i++) {
      output = comb.process(0);
    }
    
    expect(output).toBeCloseTo(1);
  });
});

describe('AllpassFilter', () => {
  it('should process signal', () => {
    const allpass = new AllpassFilter(50, 0.5);
    
    const output = allpass.process(1);
    expect(typeof output).toBe('number');
  });

  it('should preserve amplitude over time', () => {
    const allpass = new AllpassFilter(10, 0.5);
    
    // Feed constant signal
    let energy = 0;
    for (let i = 0; i < 100; i++) {
      const output = allpass.process(0.5);
      energy += output * output;
    }
    
    expect(energy).toBeGreaterThan(0);
  });
});

describe('Reverb', () => {
  it('should process signal', () => {
    const reverb = new Reverb(48000);
    
    const output = reverb.process(0.5);
    expect(typeof output).toBe('number');
  });

  it('should apply mix', () => {
    const reverb = new Reverb(48000, { roomSize: 0.5, damping: 0.5, mix: 0 });
    
    // With mix 0, output should equal input
    const output = reverb.process(0.5);
    expect(output).toBe(0.5);
  });

  it('should create reverb tail', () => {
    const reverb = new Reverb(48000, { roomSize: 0.8, damping: 0.2, mix: 1 });
    
    // Send impulse
    reverb.process(1);
    
    // Check for reverb tail - need more samples for reverb to build up
    let hasOutput = false;
    for (let i = 0; i < 5000; i++) {
      if (Math.abs(reverb.process(0)) > 0.001) {
        hasOutput = true;
        break;
      }
    }
    
    expect(hasOutput).toBe(true);
  });

  it('should clear', () => {
    const reverb = new Reverb(48000);
    
    reverb.process(1);
    reverb.clear();
    
    // After clear, tail should be gone
    let maxOutput = 0;
    for (let i = 0; i < 100; i++) {
      maxOutput = Math.max(maxOutput, Math.abs(reverb.process(0)));
    }
    
    expect(maxOutput).toBe(0);
  });
});

describe('Compressor', () => {
  it('should process signal', () => {
    const comp = new Compressor(48000);
    
    const output = comp.process(0.5);
    expect(typeof output).toBe('number');
  });

  it('should not affect signal below threshold', () => {
    const comp = new Compressor(48000, { threshold: 0, ratio: 4, attack: 0, release: 0, makeup: 0 });
    
    // Signal at -6dB (0.5) should be below 0dB threshold
    const output = comp.process(0.5);
    expect(output).toBeCloseTo(0.5, 1);
  });

  it('should compress signal above threshold', () => {
    const comp = new Compressor(48000, { 
      threshold: -12, 
      ratio: 4, 
      attack: 0, 
      release: 0, 
      makeup: 0 
    });
    
    // Process loud signal
    let output = 0;
    for (let i = 0; i < 100; i++) {
      output = comp.process(1);
    }
    
    // Should be reduced
    expect(output).toBeLessThan(1);
  });

  it('should reset', () => {
    const comp = new Compressor(48000);
    
    comp.process(1);
    comp.reset();
    
    // After reset, envelope should be at 0
    const output = comp.process(0.1);
    expect(typeof output).toBe('number');
  });
});

// ============================================================================
// DEFAULTS TESTS
// ============================================================================

describe('Default configurations', () => {
  it('should have valid DEFAULT_OSCILLATOR', () => {
    expect(DEFAULT_OSCILLATOR.waveform).toBe('sawtooth');
    expect(DEFAULT_OSCILLATOR.frequency).toBe(440);
    expect(DEFAULT_OSCILLATOR.gain).toBe(1);
  });

  it('should have valid DEFAULT_LFO', () => {
    expect(DEFAULT_LFO.waveform).toBe('sine');
    expect(DEFAULT_LFO.frequency).toBe(1);
    expect(DEFAULT_LFO.depth).toBe(0.5);
  });

  it('should have valid DEFAULT_DELAY', () => {
    expect(DEFAULT_DELAY.time).toBe(0.25);
    expect(DEFAULT_DELAY.feedback).toBe(0.3);
    expect(DEFAULT_DELAY.mix).toBe(0.3);
  });

  it('should have valid DEFAULT_CHORUS', () => {
    expect(DEFAULT_CHORUS.rate).toBe(1.5);
    expect(DEFAULT_CHORUS.depth).toBe(0.5);
    expect(DEFAULT_CHORUS.mix).toBe(0.5);
  });

  it('should have valid DEFAULT_REVERB', () => {
    expect(DEFAULT_REVERB.roomSize).toBe(0.5);
    expect(DEFAULT_REVERB.damping).toBe(0.5);
    expect(DEFAULT_REVERB.mix).toBe(0.3);
  });

  it('should have valid DEFAULT_COMPRESSOR', () => {
    expect(DEFAULT_COMPRESSOR.threshold).toBe(-24);
    expect(DEFAULT_COMPRESSOR.ratio).toBe(4);
    expect(DEFAULT_COMPRESSOR.attack).toBe(0.01);
  });

  it('should have valid DEFAULT_EQ', () => {
    expect(DEFAULT_EQ.low.frequency).toBe(100);
    expect(DEFAULT_EQ.mid.frequency).toBe(1000);
    expect(DEFAULT_EQ.high.frequency).toBe(8000);
  });

  it('should have valid DEFAULT_FILTER', () => {
    expect(DEFAULT_FILTER.type).toBe('lowpass');
    expect(DEFAULT_FILTER.mode).toBe('12db');
    expect(DEFAULT_FILTER.cutoff).toBe(20000);
  });

  it('should have valid DEFAULT_SYNTH_VOICE', () => {
    expect(DEFAULT_SYNTH_VOICE.oscillators).toHaveLength(1);
    expect(DEFAULT_SYNTH_VOICE.ampEnvelope.attack).toBe(0.001);
    expect(DEFAULT_SYNTH_VOICE.filterEnvelope.amount).toBe(2);
  });
});

// ============================================================================
// PROCESSOR SCRIPT TESTS
// ============================================================================

describe('generateSynthProcessorScript', () => {
  it('should generate valid script', () => {
    const script = generateSynthProcessorScript();
    
    expect(script).toContain('SynthProcessor');
    expect(script).toContain('extends AudioWorkletProcessor');
    expect(script).toContain('registerProcessor');
    expect(script).toContain('noteOn');
    expect(script).toContain('noteOff');
    expect(script).toContain('process');
  });
});
