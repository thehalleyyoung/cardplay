/**
 * @fileoverview Tests for Effect Cards.
 * 
 * Comprehensive tests covering:
 * - Reverb (types, presets)
 * - Delay (types, sync, multi-tap)
 * - Chorus/Flanger/Phaser (modulation)
 * - Compressor/Limiter/Gate (dynamics)
 * - Parametric and Graphic EQ
 * - Distortion (types, curves)
 * - Filter (types, modulation)
 * - Stereo Width/Panner/Rotary (spatial)
 * - Effect Chain (ordering, bypass)
 */

import { describe, it, expect } from 'vitest';
import {
  // Common
  EffectBypass,
  DEFAULT_BYPASS,
  
  // Reverb
  ReverbType,
  ReverbPreset,
  ReverbState,
  REVERB_PRESETS,
  DEFAULT_REVERB_STATE,
  createReverb,
  
  // Delay
  DelayType,
  DelayTap,
  DelaySyncMode,
  DelayState,
  DEFAULT_DELAY_STATE,
  calculateDelayTime,
  createMultiTapDelay,
  
  // Chorus
  ChorusState,
  ChorusPreset,
  CHORUS_PRESETS,
  DEFAULT_CHORUS_STATE,
  
  // Flanger
  FlangerState,
  DEFAULT_FLANGER_STATE,
  
  // Phaser
  PhaserState,
  DEFAULT_PHASER_STATE,
  
  // Compressor
  CompressorKnee,
  CompressorDetection,
  CompressorState,
  CompressorPreset,
  COMPRESSOR_PRESETS,
  DEFAULT_COMPRESSOR_STATE,
  calculateGainReduction,
  
  // Limiter
  LimiterState,
  DEFAULT_LIMITER_STATE,
  
  // Gate
  GateState,
  DEFAULT_GATE_STATE,
  
  // Parametric EQ
  EQBandType,
  EQBand,
  ParametricEQState,
  DEFAULT_EQ_BAND,
  DEFAULT_PARAMETRIC_EQ_STATE,
  createEQBand,
  setEQBandGain,
  setEQBandFrequency,
  
  // Graphic EQ
  GRAPHIC_EQ_FREQUENCIES,
  GraphicEQState,
  DEFAULT_GRAPHIC_EQ_STATE,
  setGraphicEQGain,
  
  // Distortion
  DistortionType,
  DistortionState,
  DISTORTION_PRESETS,
  DEFAULT_DISTORTION_STATE,
  applySoftClipping,
  applyHardClipping,
  applyBitcrush,
  
  // Filter
  FilterType,
  FilterSlope,
  FilterState,
  DEFAULT_FILTER_STATE,
  calculateFilterCutoff,
  
  // Stereo Width
  StereoWidthState,
  DEFAULT_STEREO_WIDTH_STATE,
  stereoToMidSide,
  midSideToStereo,
  applyStereoWidth,
  
  // Panner
  PanLaw,
  PannerState,
  DEFAULT_PANNER_STATE,
  calculatePanGains,
  
  // Rotary
  RotaryState,
  DEFAULT_ROTARY_STATE,
  
  // Effect Chain
  EffectChainState,
  DEFAULT_EFFECT_CHAIN_STATE,
  addEffectToChain,
  removeEffectFromChain,
  moveEffectInChain,
  toggleEffectBypass,
} from './effects';

// ============================================================================
// COMMON TESTS
// ============================================================================

describe('Effect Common', () => {
  describe('Default Bypass', () => {
    it('should not be bypassed by default', () => {
      expect(DEFAULT_BYPASS.bypassed).toBe(false);
    });
    
    it('should have wet/dry of 1', () => {
      expect(DEFAULT_BYPASS.wetDry).toBe(1);
    });
  });
});

// ============================================================================
// REVERB TESTS
// ============================================================================

describe('Reverb', () => {
  describe('Presets', () => {
    it('should have all reverb types defined', () => {
      const types: ReverbType[] = ['room', 'hall', 'plate', 'spring', 'chamber', 'cathedral'];
      for (const type of types) {
        expect(REVERB_PRESETS[type]).toBeDefined();
      }
    });
    
    it('should have valid preset values', () => {
      for (const [name, preset] of Object.entries(REVERB_PRESETS)) {
        expect(preset.decayTime).toBeGreaterThan(0);
        expect(preset.preDelay).toBeGreaterThanOrEqual(0);
        expect(preset.damping).toBeGreaterThanOrEqual(0);
        expect(preset.damping).toBeLessThanOrEqual(1);
        expect(preset.diffusion).toBeGreaterThanOrEqual(0);
        expect(preset.diffusion).toBeLessThanOrEqual(1);
      }
    });
    
    it('should have longer decay for cathedral than room', () => {
      expect(REVERB_PRESETS.cathedral.decayTime).toBeGreaterThan(REVERB_PRESETS.room.decayTime);
    });
    
    it('should have different characteristics per type', () => {
      expect(REVERB_PRESETS.plate.diffusion).toBeGreaterThan(REVERB_PRESETS.spring.diffusion);
      expect(REVERB_PRESETS.hall.decayTime).toBeGreaterThan(REVERB_PRESETS.room.decayTime);
    });
  });
  
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_REVERB_STATE.type).toBe('reverb');
      expect(DEFAULT_REVERB_STATE.reverbType).toBe('hall');
      expect(DEFAULT_REVERB_STATE.wetDry).toBe(0.3);
      expect(DEFAULT_REVERB_STATE.bypassed).toBe(false);
    });
    
    it('should have hall preset values', () => {
      expect(DEFAULT_REVERB_STATE.decayTime).toBe(REVERB_PRESETS.hall.decayTime);
      expect(DEFAULT_REVERB_STATE.preDelay).toBe(REVERB_PRESETS.hall.preDelay);
    });
  });
  
  describe('createReverb', () => {
    it('should create reverb with preset', () => {
      const reverb = createReverb('plate');
      expect(reverb.reverbType).toBe('plate');
      expect(reverb.decayTime).toBe(REVERB_PRESETS.plate.decayTime);
    });
    
    it('should apply custom wet/dry', () => {
      const reverb = createReverb('room', 0.5);
      expect(reverb.wetDry).toBe(0.5);
    });
    
    it('should create cathedral with long decay', () => {
      const reverb = createReverb('cathedral');
      expect(reverb.decayTime).toBeGreaterThanOrEqual(4);
    });
  });
});

// ============================================================================
// DELAY TESTS
// ============================================================================

describe('Delay', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_DELAY_STATE.type).toBe('delay');
      expect(DEFAULT_DELAY_STATE.delayType).toBe('stereo');
      expect(DEFAULT_DELAY_STATE.synced).toBe(true);
      expect(DEFAULT_DELAY_STATE.feedback).toBe(0.4);
    });
  });
  
  describe('calculateDelayTime', () => {
    it('should calculate quarter note at 120 BPM', () => {
      const time = calculateDelayTime(120, 0.25, 'beat');
      expect(time).toBe(500); // 500ms = 1 quarter note at 120 BPM
    });
    
    it('should calculate eighth note at 120 BPM', () => {
      const time = calculateDelayTime(120, 0.125, 'beat');
      expect(time).toBe(250);
    });
    
    it('should calculate dotted eighth', () => {
      const time = calculateDelayTime(120, 0.125, 'dotted');
      expect(time).toBe(375); // 250 * 1.5
    });
    
    it('should calculate triplet eighth', () => {
      const time = calculateDelayTime(120, 0.125, 'triplet');
      expect(Math.round(time)).toBe(167); // 250 * 2/3
    });
    
    it('should pass through ms value directly', () => {
      const time = calculateDelayTime(120, 300, 'ms');
      expect(time).toBe(300);
    });
    
    it('should scale with tempo', () => {
      const time120 = calculateDelayTime(120, 0.25, 'beat');
      const time60 = calculateDelayTime(60, 0.25, 'beat');
      expect(time60).toBe(time120 * 2);
    });
  });
  
  describe('createMultiTapDelay', () => {
    it('should create correct number of taps', () => {
      const taps = createMultiTapDelay(100, 4);
      expect(taps.length).toBe(4);
    });
    
    it('should have increasing delay times', () => {
      const taps = createMultiTapDelay(100, 4);
      expect(taps[0]!.time).toBe(100);
      expect(taps[1]!.time).toBe(200);
      expect(taps[2]!.time).toBe(300);
      expect(taps[3]!.time).toBe(400);
    });
    
    it('should have decaying feedback', () => {
      const taps = createMultiTapDelay(100, 4, 0.8);
      expect(taps[0]!.feedback).toBe(0.8);
      expect(taps[1]!.feedback).toBeCloseTo(0.64);
      expect(taps[2]!.feedback).toBeCloseTo(0.512);
    });
    
    it('should alternate panning', () => {
      const taps = createMultiTapDelay(100, 4);
      expect(taps[0]!.pan).toBeLessThan(0);
      expect(taps[1]!.pan).toBeGreaterThan(0);
      expect(taps[2]!.pan).toBeLessThan(0);
    });
  });
});

// ============================================================================
// MODULATION TESTS (CHORUS, FLANGER, PHASER)
// ============================================================================

describe('Chorus', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_CHORUS_STATE.type).toBe('chorus');
      expect(DEFAULT_CHORUS_STATE.rate).toBe(0.5);
      expect(DEFAULT_CHORUS_STATE.depth).toBe(0.5);
      expect(DEFAULT_CHORUS_STATE.voices).toBe(2);
    });
  });
  
  describe('Presets', () => {
    it('should have all presets defined', () => {
      const presets: ChorusPreset[] = ['subtle', 'warm', 'wide', 'shimmer', 'vintage'];
      for (const preset of presets) {
        expect(CHORUS_PRESETS[preset]).toBeDefined();
      }
    });
    
    it('should have wider stereo for wide preset', () => {
      expect(CHORUS_PRESETS.wide.stereoWidth).toBe(1);
    });
    
    it('should have more voices for wide preset', () => {
      expect(CHORUS_PRESETS.wide.voices).toBe(4);
    });
  });
});

describe('Flanger', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_FLANGER_STATE.type).toBe('flanger');
      expect(DEFAULT_FLANGER_STATE.rate).toBe(0.2);
      expect(DEFAULT_FLANGER_STATE.depth).toBe(0.7);
      expect(DEFAULT_FLANGER_STATE.delay).toBe(2);
    });
    
    it('should have shorter delay than chorus', () => {
      expect(DEFAULT_FLANGER_STATE.delay).toBeLessThan(DEFAULT_CHORUS_STATE.delay);
    });
  });
});

describe('Phaser', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_PHASER_STATE.type).toBe('phaser');
      expect(DEFAULT_PHASER_STATE.stages).toBe(4);
      expect(DEFAULT_PHASER_STATE.centerFreq).toBe(1000);
    });
    
    it('should have valid stage count', () => {
      expect([2, 4, 6, 8, 10, 12]).toContain(DEFAULT_PHASER_STATE.stages);
    });
  });
});

// ============================================================================
// DYNAMICS TESTS
// ============================================================================

describe('Compressor', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_COMPRESSOR_STATE.type).toBe('compressor');
      expect(DEFAULT_COMPRESSOR_STATE.threshold).toBe(-20);
      expect(DEFAULT_COMPRESSOR_STATE.ratio).toBe(4);
      expect(DEFAULT_COMPRESSOR_STATE.knee).toBe('soft');
    });
  });
  
  describe('Presets', () => {
    it('should have all presets defined', () => {
      const presets: CompressorPreset[] = ['gentle', 'vocal', 'drums', 'bass', 'master', 'limiter'];
      for (const preset of presets) {
        expect(COMPRESSOR_PRESETS[preset]).toBeDefined();
      }
    });
    
    it('should have fast attack for drums', () => {
      expect(COMPRESSOR_PRESETS.drums.attack).toBeLessThan(5);
    });
    
    it('should have high ratio for limiter', () => {
      expect(COMPRESSOR_PRESETS.limiter.ratio).toBeGreaterThanOrEqual(10);
    });
  });
  
  describe('calculateGainReduction', () => {
    it('should return 0 below threshold', () => {
      const gr = calculateGainReduction(-30, -20, 4, 'hard', 0);
      expect(gr).toBe(0);
    });
    
    it('should reduce gain above threshold', () => {
      const gr = calculateGainReduction(-10, -20, 4, 'hard', 0);
      // 10dB over threshold with 4:1 ratio = 7.5dB reduction
      expect(gr).toBeCloseTo(7.5);
    });
    
    it('should apply soft knee', () => {
      // Test in the knee region (threshold -20, knee width 6, so knee starts at -23)
      const grHard = calculateGainReduction(-16, -20, 4, 'hard', 0);
      const grSoft = calculateGainReduction(-16, -20, 4, 'soft', 6);
      
      // Hard knee: full ratio above threshold
      expect(grHard).toBeGreaterThan(0);
      // Soft knee should have less reduction than hard in knee region
      expect(grSoft).toBeGreaterThan(0);
      expect(grSoft).toBeLessThanOrEqual(grHard);
    });
    
    it('should handle different ratios', () => {
      const gr2 = calculateGainReduction(0, -20, 2, 'hard', 0);
      const gr10 = calculateGainReduction(0, -20, 10, 'hard', 0);
      
      // Higher ratio = more reduction
      expect(gr10).toBeGreaterThan(gr2);
    });
  });
});

describe('Limiter', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_LIMITER_STATE.type).toBe('limiter');
      expect(DEFAULT_LIMITER_STATE.ceiling).toBe(-0.3);
      expect(DEFAULT_LIMITER_STATE.truePeak).toBe(true);
    });
    
    it('should have lookahead enabled', () => {
      expect(DEFAULT_LIMITER_STATE.lookahead).toBeGreaterThan(0);
    });
  });
});

describe('Gate', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_GATE_STATE.type).toBe('gate');
      expect(DEFAULT_GATE_STATE.threshold).toBe(-40);
      expect(DEFAULT_GATE_STATE.range).toBe(-80);
    });
    
    it('should have hold time', () => {
      expect(DEFAULT_GATE_STATE.hold).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// EQ TESTS
// ============================================================================

describe('Parametric EQ', () => {
  describe('Default Band', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_EQ_BAND.type).toBe('peak');
      expect(DEFAULT_EQ_BAND.frequency).toBe(1000);
      expect(DEFAULT_EQ_BAND.gain).toBe(0);
      expect(DEFAULT_EQ_BAND.q).toBe(1);
    });
  });
  
  describe('Default State', () => {
    it('should have 4 bands', () => {
      expect(DEFAULT_PARAMETRIC_EQ_STATE.bands.length).toBe(4);
    });
    
    it('should have different band types', () => {
      const types = DEFAULT_PARAMETRIC_EQ_STATE.bands.map(b => b.type);
      expect(types).toContain('lowShelf');
      expect(types).toContain('highShelf');
      expect(types).toContain('peak');
    });
    
    it('should have bands at different frequencies', () => {
      const freqs = DEFAULT_PARAMETRIC_EQ_STATE.bands.map(b => b.frequency);
      const uniqueFreqs = new Set(freqs);
      expect(uniqueFreqs.size).toBe(4);
    });
  });
  
  describe('createEQBand', () => {
    it('should create band with specified values', () => {
      const band = createEQBand('peak', 2000, 3, 2);
      expect(band.type).toBe('peak');
      expect(band.frequency).toBe(2000);
      expect(band.gain).toBe(3);
      expect(band.q).toBe(2);
    });
    
    it('should create unique IDs', () => {
      const band1 = createEQBand('peak', 1000);
      const band2 = createEQBand('peak', 1000);
      expect(band1.id).not.toBe(band2.id);
    });
  });
  
  describe('setEQBandGain', () => {
    it('should set band gain', () => {
      const updated = setEQBandGain(DEFAULT_PARAMETRIC_EQ_STATE, 'low', 6);
      const band = updated.bands.find(b => b.id === 'low');
      expect(band!.gain).toBe(6);
    });
    
    it('should not affect other bands', () => {
      const updated = setEQBandGain(DEFAULT_PARAMETRIC_EQ_STATE, 'low', 6);
      const highBand = updated.bands.find(b => b.id === 'high');
      expect(highBand!.gain).toBe(0);
    });
  });
  
  describe('setEQBandFrequency', () => {
    it('should set band frequency', () => {
      const updated = setEQBandFrequency(DEFAULT_PARAMETRIC_EQ_STATE, 'lowMid', 800);
      const band = updated.bands.find(b => b.id === 'lowMid');
      expect(band!.frequency).toBe(800);
    });
  });
});

describe('Graphic EQ', () => {
  describe('Frequencies', () => {
    it('should have 10-band frequencies', () => {
      expect(GRAPHIC_EQ_FREQUENCIES[10].length).toBe(10);
    });
    
    it('should have 31-band frequencies', () => {
      expect(GRAPHIC_EQ_FREQUENCIES[31].length).toBe(31);
    });
    
    it('should span low to high frequencies', () => {
      expect(GRAPHIC_EQ_FREQUENCIES[10][0]).toBe(31);
      expect(GRAPHIC_EQ_FREQUENCIES[10][9]).toBe(16000);
    });
  });
  
  describe('Default State', () => {
    it('should have 10 bands by default', () => {
      expect(DEFAULT_GRAPHIC_EQ_STATE.bandCount).toBe(10);
      expect(DEFAULT_GRAPHIC_EQ_STATE.gains.length).toBe(10);
    });
    
    it('should have all gains at 0', () => {
      expect(DEFAULT_GRAPHIC_EQ_STATE.gains.every(g => g === 0)).toBe(true);
    });
  });
  
  describe('setGraphicEQGain', () => {
    it('should set band gain', () => {
      const updated = setGraphicEQGain(DEFAULT_GRAPHIC_EQ_STATE, 0, 6);
      expect(updated.gains[0]).toBe(6);
    });
    
    it('should clamp to +/- 12dB', () => {
      const tooHigh = setGraphicEQGain(DEFAULT_GRAPHIC_EQ_STATE, 0, 20);
      expect(tooHigh.gains[0]).toBe(12);
      
      const tooLow = setGraphicEQGain(DEFAULT_GRAPHIC_EQ_STATE, 0, -20);
      expect(tooLow.gains[0]).toBe(-12);
    });
  });
});

// ============================================================================
// DISTORTION TESTS
// ============================================================================

describe('Distortion', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_DISTORTION_STATE.type).toBe('distortion');
      expect(DEFAULT_DISTORTION_STATE.distortionType).toBe('overdrive');
      expect(DEFAULT_DISTORTION_STATE.drive).toBe(0.5);
    });
  });
  
  describe('Presets', () => {
    it('should have all types defined', () => {
      const types: DistortionType[] = ['overdrive', 'distortion', 'fuzz', 'bitcrush', 'wavefold'];
      for (const type of types) {
        expect(DISTORTION_PRESETS[type]).toBeDefined();
      }
    });
    
    it('should have increasing drive for harsher types', () => {
      expect(DISTORTION_PRESETS.overdrive.drive!).toBeLessThan(DISTORTION_PRESETS.distortion.drive!);
      expect(DISTORTION_PRESETS.distortion.drive!).toBeLessThan(DISTORTION_PRESETS.fuzz.drive!);
    });
  });
  
  describe('applySoftClipping', () => {
    it('should return 0 for 0 input', () => {
      expect(applySoftClipping(0, 0.5)).toBe(0);
    });
    
    it('should saturate high values', () => {
      const result = applySoftClipping(1, 1);
      expect(result).toBeLessThan(1);
      expect(result).toBeGreaterThan(0.9);
    });
    
    it('should preserve sign', () => {
      expect(applySoftClipping(-0.5, 0.5)).toBeLessThan(0);
      expect(applySoftClipping(0.5, 0.5)).toBeGreaterThan(0);
    });
    
    it('should increase distortion with drive', () => {
      const lowDrive = applySoftClipping(0.3, 0.1);
      const highDrive = applySoftClipping(0.3, 0.9);
      expect(highDrive).toBeGreaterThan(lowDrive);
    });
  });
  
  describe('applyHardClipping', () => {
    it('should clip at +/- 1', () => {
      expect(applyHardClipping(2, 0.5)).toBe(1);
      expect(applyHardClipping(-2, 0.5)).toBe(-1);
    });
    
    it('should not affect small values', () => {
      expect(applyHardClipping(0.1, 0)).toBeCloseTo(0.1);
    });
  });
  
  describe('applyBitcrush', () => {
    it('should return exact value at full depth', () => {
      expect(applyBitcrush(0.5, 16)).toBeCloseTo(0.5, 4);
    });
    
    it('should quantize at low depth', () => {
      const result = applyBitcrush(0.5, 4);
      const levels = Math.pow(2, 4);
      expect(result * levels).toBe(Math.round(result * levels));
    });
    
    it('should produce staircasing at 1 bit', () => {
      // At 1 bit, we have 2 levels: 0 and 1
      // Values round to nearest level
      expect(applyBitcrush(0.2, 1)).toBe(0);
      expect(applyBitcrush(0.8, 1)).toBe(1);
    });
  });
});

// ============================================================================
// FILTER TESTS
// ============================================================================

describe('Filter', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_FILTER_STATE.type).toBe('filter');
      expect(DEFAULT_FILTER_STATE.filterType).toBe('lowpass');
      expect(DEFAULT_FILTER_STATE.frequency).toBe(1000);
      expect(DEFAULT_FILTER_STATE.slope).toBe(24);
    });
  });
  
  describe('calculateFilterCutoff', () => {
    it('should return base cutoff with no modulation', () => {
      const cutoff = calculateFilterCutoff(1000, 0, 0, 0, 0, 60, 0);
      expect(cutoff).toBeCloseTo(1000);
    });
    
    it('should increase with positive envelope', () => {
      const cutoff = calculateFilterCutoff(1000, 1, 0.5, 0, 0, 60, 0);
      expect(cutoff).toBeGreaterThan(1000);
    });
    
    it('should decrease with negative envelope amount', () => {
      const cutoff = calculateFilterCutoff(1000, 1, -0.5, 0, 0, 60, 0);
      expect(cutoff).toBeLessThan(1000);
    });
    
    it('should modulate with LFO', () => {
      const high = calculateFilterCutoff(1000, 0, 0, 1, 0.5, 60, 0);
      const low = calculateFilterCutoff(1000, 0, 0, -1, 0.5, 60, 0);
      expect(high).toBeGreaterThan(1000);
      expect(low).toBeLessThan(1000);
    });
    
    it('should track keyboard', () => {
      const low = calculateFilterCutoff(1000, 0, 0, 0, 0, 48, 1); // C3
      const mid = calculateFilterCutoff(1000, 0, 0, 0, 0, 60, 1); // C4
      const high = calculateFilterCutoff(1000, 0, 0, 0, 0, 72, 1); // C5
      
      expect(low).toBeLessThan(mid);
      expect(mid).toBeCloseTo(1000);
      expect(high).toBeGreaterThan(mid);
    });
    
    it('should clamp to valid range', () => {
      const veryHigh = calculateFilterCutoff(15000, 1, 1, 1, 1, 84, 1);
      expect(veryHigh).toBeLessThanOrEqual(20000);
      
      const veryLow = calculateFilterCutoff(50, 1, -1, -1, 1, 36, 1);
      expect(veryLow).toBeGreaterThanOrEqual(20);
    });
  });
});

// ============================================================================
// SPATIAL TESTS
// ============================================================================

describe('Stereo Width', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_STEREO_WIDTH_STATE.type).toBe('stereoWidth');
      expect(DEFAULT_STEREO_WIDTH_STATE.width).toBe(1);
      expect(DEFAULT_STEREO_WIDTH_STATE.bassMonoBelow).toBe(100);
    });
  });
  
  describe('stereoToMidSide', () => {
    it('should extract mid from identical channels', () => {
      const { mid, side } = stereoToMidSide(0.5, 0.5);
      expect(mid).toBeCloseTo(0.5);
      expect(side).toBeCloseTo(0);
    });
    
    it('should extract side from opposite channels', () => {
      const { mid, side } = stereoToMidSide(1, -1);
      expect(mid).toBeCloseTo(0);
      expect(side).toBeCloseTo(1);
    });
    
    it('should handle mixed signal', () => {
      const { mid, side } = stereoToMidSide(0.8, 0.2);
      expect(mid).toBeCloseTo(0.5);
      expect(side).toBeCloseTo(0.3);
    });
  });
  
  describe('midSideToStereo', () => {
    it('should reconstruct original signal', () => {
      const original = { left: 0.7, right: 0.3 };
      const { mid, side } = stereoToMidSide(original.left, original.right);
      const reconstructed = midSideToStereo(mid, side);
      
      expect(reconstructed.left).toBeCloseTo(original.left);
      expect(reconstructed.right).toBeCloseTo(original.right);
    });
    
    it('should create mono from mid only', () => {
      const { left, right } = midSideToStereo(0.5, 0);
      expect(left).toBeCloseTo(0.5);
      expect(right).toBeCloseTo(0.5);
    });
  });
  
  describe('applyStereoWidth', () => {
    it('should preserve signal at width 1', () => {
      const result = applyStereoWidth(0.7, 0.3, 1);
      expect(result.left).toBeCloseTo(0.7);
      expect(result.right).toBeCloseTo(0.3);
    });
    
    it('should make mono at width 0', () => {
      const result = applyStereoWidth(0.7, 0.3, 0);
      expect(result.left).toBeCloseTo(0.5);
      expect(result.right).toBeCloseTo(0.5);
    });
    
    it('should widen at width 2', () => {
      const original = applyStereoWidth(0.7, 0.3, 1);
      const wide = applyStereoWidth(0.7, 0.3, 2);
      
      const origDiff = Math.abs(original.left - original.right);
      const wideDiff = Math.abs(wide.left - wide.right);
      
      expect(wideDiff).toBeGreaterThan(origDiff);
    });
  });
});

describe('Panner', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_PANNER_STATE.type).toBe('panner');
      expect(DEFAULT_PANNER_STATE.pan).toBe(0);
      expect(DEFAULT_PANNER_STATE.panLaw).toBe('constantPower');
    });
  });
  
  describe('calculatePanGains', () => {
    it('should be equal at center for all laws', () => {
      const laws: PanLaw[] = ['linear', 'constantPower', 'minus3dB', 'minus4.5dB', 'minus6dB'];
      
      for (const law of laws) {
        const { leftGain, rightGain } = calculatePanGains(0, law);
        expect(leftGain).toBeCloseTo(rightGain, 4);
      }
    });
    
    it('should pan fully left', () => {
      const { leftGain, rightGain } = calculatePanGains(-1, 'linear');
      expect(leftGain).toBe(1);
      expect(rightGain).toBe(0);
    });
    
    it('should pan fully right', () => {
      const { leftGain, rightGain } = calculatePanGains(1, 'linear');
      expect(leftGain).toBe(0);
      expect(rightGain).toBe(1);
    });
    
    it('should maintain constant power with constantPower law', () => {
      const gains = [-1, -0.5, 0, 0.5, 1].map(pan => 
        calculatePanGains(pan, 'constantPower')
      );
      
      // Power = left^2 + right^2 should be ~1
      for (const { leftGain, rightGain } of gains) {
        const power = leftGain * leftGain + rightGain * rightGain;
        expect(power).toBeCloseTo(1, 4);
      }
    });
  });
});

describe('Rotary', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_ROTARY_STATE.type).toBe('rotary');
      expect(DEFAULT_ROTARY_STATE.speed).toBe('slow');
      expect(DEFAULT_ROTARY_STATE.slowRate).toBe(0.8);
      expect(DEFAULT_ROTARY_STATE.fastRate).toBe(6.5);
    });
    
    it('should have separate horn and drum levels', () => {
      expect(DEFAULT_ROTARY_STATE.hornLevel).toBeDefined();
      expect(DEFAULT_ROTARY_STATE.drumLevel).toBeDefined();
    });
    
    it('should have ramp time', () => {
      expect(DEFAULT_ROTARY_STATE.rampTime).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// EFFECT CHAIN TESTS
// ============================================================================

describe('Effect Chain', () => {
  describe('Default State', () => {
    it('should have empty effects', () => {
      expect(DEFAULT_EFFECT_CHAIN_STATE.effects).toEqual([]);
    });
    
    it('should not be bypassed', () => {
      expect(DEFAULT_EFFECT_CHAIN_STATE.bypassed).toBe(false);
    });
  });
  
  describe('addEffectToChain', () => {
    it('should add effect to end', () => {
      const chain = addEffectToChain(DEFAULT_EFFECT_CHAIN_STATE, DEFAULT_REVERB_STATE);
      expect(chain.effects.length).toBe(1);
      expect(chain.effects[0]).toEqual(DEFAULT_REVERB_STATE);
    });
    
    it('should add effect at index', () => {
      let chain = addEffectToChain(DEFAULT_EFFECT_CHAIN_STATE, DEFAULT_REVERB_STATE);
      chain = addEffectToChain(chain, DEFAULT_DELAY_STATE);
      chain = addEffectToChain(chain, DEFAULT_COMPRESSOR_STATE, 1);
      
      expect(chain.effects.length).toBe(3);
      expect(chain.effects[1]!.type).toBe('compressor');
    });
    
    it('should preserve existing effects', () => {
      let chain = addEffectToChain(DEFAULT_EFFECT_CHAIN_STATE, DEFAULT_REVERB_STATE);
      chain = addEffectToChain(chain, DEFAULT_DELAY_STATE);
      
      expect(chain.effects[0]).toEqual(DEFAULT_REVERB_STATE);
      expect(chain.effects[1]).toEqual(DEFAULT_DELAY_STATE);
    });
  });
  
  describe('removeEffectFromChain', () => {
    it('should remove effect by ID', () => {
      let chain = addEffectToChain(DEFAULT_EFFECT_CHAIN_STATE, DEFAULT_REVERB_STATE);
      chain = addEffectToChain(chain, DEFAULT_DELAY_STATE);
      chain = removeEffectFromChain(chain, 'reverb-1');
      
      expect(chain.effects.length).toBe(1);
      expect(chain.effects[0]!.type).toBe('delay');
    });
    
    it('should handle non-existent ID', () => {
      const chain = addEffectToChain(DEFAULT_EFFECT_CHAIN_STATE, DEFAULT_REVERB_STATE);
      const updated = removeEffectFromChain(chain, 'non-existent');
      
      expect(updated.effects.length).toBe(1);
    });
  });
  
  describe('moveEffectInChain', () => {
    it('should move effect forward', () => {
      let chain = addEffectToChain(DEFAULT_EFFECT_CHAIN_STATE, DEFAULT_COMPRESSOR_STATE);
      chain = addEffectToChain(chain, DEFAULT_REVERB_STATE);
      chain = addEffectToChain(chain, DEFAULT_DELAY_STATE);
      
      chain = moveEffectInChain(chain, 'delay-1', 0);
      
      expect(chain.effects[0]!.type).toBe('delay');
      expect(chain.effects[1]!.type).toBe('compressor');
      expect(chain.effects[2]!.type).toBe('reverb');
    });
    
    it('should move effect backward', () => {
      let chain = addEffectToChain(DEFAULT_EFFECT_CHAIN_STATE, DEFAULT_COMPRESSOR_STATE);
      chain = addEffectToChain(chain, DEFAULT_REVERB_STATE);
      chain = addEffectToChain(chain, DEFAULT_DELAY_STATE);
      
      chain = moveEffectInChain(chain, 'compressor-1', 2);
      
      expect(chain.effects[0]!.type).toBe('reverb');
      expect(chain.effects[1]!.type).toBe('delay');
      expect(chain.effects[2]!.type).toBe('compressor');
    });
    
    it('should handle non-existent effect', () => {
      const chain = addEffectToChain(DEFAULT_EFFECT_CHAIN_STATE, DEFAULT_REVERB_STATE);
      const updated = moveEffectInChain(chain, 'non-existent', 0);
      
      expect(updated).toEqual(chain);
    });
  });
  
  describe('toggleEffectBypass', () => {
    it('should toggle effect bypass', () => {
      let chain = addEffectToChain(DEFAULT_EFFECT_CHAIN_STATE, DEFAULT_REVERB_STATE);
      chain = toggleEffectBypass(chain, 'reverb-1');
      
      expect(chain.effects[0]!.bypassed).toBe(true);
    });
    
    it('should toggle back', () => {
      let chain = addEffectToChain(DEFAULT_EFFECT_CHAIN_STATE, DEFAULT_REVERB_STATE);
      chain = toggleEffectBypass(chain, 'reverb-1');
      chain = toggleEffectBypass(chain, 'reverb-1');
      
      expect(chain.effects[0]!.bypassed).toBe(false);
    });
    
    it('should not affect other effects', () => {
      let chain = addEffectToChain(DEFAULT_EFFECT_CHAIN_STATE, DEFAULT_REVERB_STATE);
      chain = addEffectToChain(chain, DEFAULT_DELAY_STATE);
      chain = toggleEffectBypass(chain, 'reverb-1');
      
      expect(chain.effects[1]!.bypassed).toBe(false);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Effects Integration', () => {
  it('should create typical vocal chain', () => {
    let chain = DEFAULT_EFFECT_CHAIN_STATE;
    chain = addEffectToChain(chain, { 
      ...DEFAULT_COMPRESSOR_STATE, 
      ...COMPRESSOR_PRESETS.vocal 
    });
    chain = addEffectToChain(chain, DEFAULT_PARAMETRIC_EQ_STATE);
    chain = addEffectToChain(chain, createReverb('plate', 0.2));
    
    expect(chain.effects.length).toBe(3);
    expect(chain.effects[0]!.type).toBe('compressor');
    expect(chain.effects[1]!.type).toBe('eq');
    expect(chain.effects[2]!.type).toBe('reverb');
  });
  
  it('should create typical guitar chain', () => {
    let chain = DEFAULT_EFFECT_CHAIN_STATE;
    chain = addEffectToChain(chain, {
      ...DEFAULT_DISTORTION_STATE,
      ...DISTORTION_PRESETS.overdrive,
    });
    chain = addEffectToChain(chain, DEFAULT_CHORUS_STATE);
    chain = addEffectToChain(chain, DEFAULT_DELAY_STATE);
    chain = addEffectToChain(chain, createReverb('room', 0.3));
    
    expect(chain.effects.length).toBe(4);
  });
  
  it('should create master bus chain', () => {
    let chain = DEFAULT_EFFECT_CHAIN_STATE;
    chain = addEffectToChain(chain, DEFAULT_PARAMETRIC_EQ_STATE);
    chain = addEffectToChain(chain, {
      ...DEFAULT_COMPRESSOR_STATE,
      ...COMPRESSOR_PRESETS.master,
    });
    chain = addEffectToChain(chain, DEFAULT_LIMITER_STATE);
    chain = addEffectToChain(chain, DEFAULT_STEREO_WIDTH_STATE);
    
    expect(chain.effects.length).toBe(4);
    expect(chain.effects[2]!.type).toBe('limiter');
  });
  
  it('should combine EQ adjustments', () => {
    let eq = DEFAULT_PARAMETRIC_EQ_STATE;
    eq = setEQBandGain(eq, 'low', 3);      // Boost bass
    eq = setEQBandGain(eq, 'lowMid', -2);   // Cut mud
    eq = setEQBandGain(eq, 'highMid', 2);   // Presence
    eq = setEQBandGain(eq, 'high', 1);      // Air
    
    expect(eq.bands.find(b => b.id === 'low')!.gain).toBe(3);
    expect(eq.bands.find(b => b.id === 'lowMid')!.gain).toBe(-2);
  });
  
  it('should process stereo signal through width and panner', () => {
    // Start with stereo signal
    const left = 0.7;
    const right = 0.3;
    
    // Widen
    const wide = applyStereoWidth(left, right, 1.5);
    
    // Then pan
    const panGains = calculatePanGains(0.3, 'constantPower');
    const panned = {
      left: wide.left * panGains.leftGain,
      right: wide.right * panGains.rightGain,
    };
    
    // Signal should still be valid
    expect(Math.abs(panned.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(panned.right)).toBeLessThanOrEqual(1);
  });
});
