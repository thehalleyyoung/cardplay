/**
 * @fileoverview Tests for Wavetable Core, Import, and Surge Assets
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  // Wavetable core
  DEFAULT_FRAME_SIZE,
  MIN_FRAME_SIZE,
  MAX_FRAME_SIZE,
  MAX_FRAMES,
  MIP_LEVELS,
  type Wavetable,
  type WavetableFrame,
  type WavetableOscillatorState,
  type WavetableOscillatorParams,
  DEFAULT_OSCILLATOR_PARAMS,
  DEFAULT_MODULATION,
  generateBasicWaveform,
  generateFromHarmonics,
  generateMorphTable,
  generatePWMTable,
  generateSupersawTable,
  generateFormantTable,
  interpolateSample,
  interpolateFrame,
  generateMipMaps,
  generateWavetableMipMaps,
  selectMipLevel,
  readMipMappedSample,
  createOscillatorState,
  processWavetableOscillator,
  processWavetableBlock,
  applyFM,
  applyRM,
  applyAM,
  applySync,
  createEmptyWavetable,
  createSingleFrameWavetable,
  normalizeWavetable,
  resampleWavetable,
  analyzeHarmonics,
  getWavetableInfo,
  createFactoryWavetables,
} from './wavetable-core';

import {
  // Wavetable import
  SURGE_WT_MAGIC,
  SERUM_FRAME_SIZE,
  COMMON_CYCLE_SIZES,
  type WavetableImportResult,
  type WAVHeader,
  type WavetableImportOptions,
  type HarmonicSpec,
  parseWAVHeader,
  extractWAVSamples,
  parseSurgeWTHeader,
  importSurgeWT,
  detectFrameCount,
  importWAV,
  importSingleCycle,
  importFromHarmonics,
  importEvolvingHarmonics,
  autoImport,
} from './wavetable-import';

import {
  // Surge assets
  SURGE_OSC_TYPES,
  SURGE_FILTER_TYPES,
  SURGE_FX_TYPES,
  WT_OSC_PARAMS,
  KNOWN_FACTORY_WAVETABLES,
  type WavetableMetadata,
  type SurgePreset,
  parseFXPHeader,
  extractSurgeXML,
  parseWavetableMetadata,
} from './surge-assets';

// ============================================================================
// WAVETABLE CORE TESTS
// ============================================================================

describe('Wavetable Core', () => {
  describe('Constants', () => {
    it('should have valid default values', () => {
      expect(DEFAULT_FRAME_SIZE).toBe(2048);
      expect(MIN_FRAME_SIZE).toBe(64);
      expect(MAX_FRAME_SIZE).toBe(8192);
      expect(MAX_FRAMES).toBe(256);
      expect(MIP_LEVELS).toBe(10);
    });
    
    it('should have valid default oscillator params', () => {
      expect(DEFAULT_OSCILLATOR_PARAMS.frequency).toBe(440);
      expect(DEFAULT_OSCILLATOR_PARAMS.detune).toBe(0);
      expect(DEFAULT_OSCILLATOR_PARAMS.gain).toBe(1);
      expect(DEFAULT_OSCILLATOR_PARAMS.interpolation).toBe('linear');
    });
    
    it('should have valid default modulation params', () => {
      expect(DEFAULT_MODULATION.fmDepth).toBe(0);
      expect(DEFAULT_MODULATION.rmDepth).toBe(0);
      expect(DEFAULT_MODULATION.sync).toBe(false);
    });
  });
  
  describe('generateBasicWaveform', () => {
    it('should generate sine wave', () => {
      const sine = generateBasicWaveform('sine', 256);
      expect(sine.length).toBe(256);
      expect(sine[0]).toBeCloseTo(0, 5);
      expect(sine[64]).toBeCloseTo(1, 1); // Quarter cycle
      expect(sine[128]).toBeCloseTo(0, 1); // Half cycle
    });
    
    it('should generate saw wave', () => {
      const saw = generateBasicWaveform('saw', 256);
      expect(saw.length).toBe(256);
      // Bandlimited saw won't be perfectly linear
      expect(Math.abs(saw[0]!)).toBeLessThan(1);
    });
    
    it('should generate square wave', () => {
      const square = generateBasicWaveform('square', 256);
      expect(square.length).toBe(256);
      // Bandlimited square oscillates around ±1
    });
    
    it('should generate triangle wave', () => {
      const triangle = generateBasicWaveform('triangle', 256);
      expect(triangle.length).toBe(256);
    });
    
    it('should generate pulse waves', () => {
      const pulse25 = generateBasicWaveform('pulse25', 256);
      const pulse10 = generateBasicWaveform('pulse10', 256);
      expect(pulse25.length).toBe(256);
      expect(pulse10.length).toBe(256);
    });
  });
  
  describe('generateFromHarmonics', () => {
    it('should generate from harmonic specification', () => {
      const harmonics = [1, 0, 0.33, 0, 0.2]; // 1st, 3rd, 5th
      const waveform = generateFromHarmonics(harmonics, undefined, 512);
      expect(waveform.length).toBe(512);
      
      // Should be normalized
      let maxAbs = 0;
      for (let i = 0; i < waveform.length; i++) {
        maxAbs = Math.max(maxAbs, Math.abs(waveform[i]!));
      }
      expect(maxAbs).toBeCloseTo(1, 1);
    });
    
    it('should handle phases', () => {
      const harmonics = [1, 0.5];
      const phases = [0, Math.PI / 2];
      const waveform = generateFromHarmonics(harmonics, phases, 256);
      expect(waveform.length).toBe(256);
    });
  });
  
  describe('generateMorphTable', () => {
    it('should create morph table between waveforms', () => {
      const sine = generateBasicWaveform('sine', 256);
      const saw = generateBasicWaveform('saw', 256);
      
      const morphTable = generateMorphTable(sine, saw, 16, 256);
      expect(morphTable.frameCount).toBe(16);
      expect(morphTable.frameSize).toBe(256);
      expect(morphTable.frames.length).toBe(16);
    });
  });
  
  describe('generatePWMTable', () => {
    it('should create PWM wavetable', () => {
      const pwm = generatePWMTable(32, 512);
      expect(pwm.frameCount).toBe(32);
      expect(pwm.frameSize).toBe(512);
      expect(pwm.name).toBe('PWM');
    });
  });
  
  describe('generateSupersawTable', () => {
    it('should create supersaw wavetable', () => {
      const supersaw = generateSupersawTable(32, 512, 7);
      expect(supersaw.frameCount).toBe(32);
      expect(supersaw.frameSize).toBe(512);
      expect(supersaw.name).toBe('Supersaw');
    });
  });
  
  describe('generateFormantTable', () => {
    it('should create formant/vowel wavetable', () => {
      const formant = generateFormantTable(512);
      expect(formant.frameCount).toBe(5); // A, E, I, O, U
      expect(formant.name).toBe('Vowels');
    });
  });
  
  describe('interpolateSample', () => {
    it('should interpolate none (nearest)', () => {
      const samples = new Float32Array([0, 1, 0, -1]);
      expect(interpolateSample(samples, 0.5, 'none')).toBe(0);
      expect(interpolateSample(samples, 1.5, 'none')).toBe(1);
    });
    
    it('should interpolate linear', () => {
      const samples = new Float32Array([0, 1, 0, -1]);
      expect(interpolateSample(samples, 0.5, 'linear')).toBe(0.5);
      expect(interpolateSample(samples, 1.5, 'linear')).toBe(0.5);
    });
    
    it('should interpolate cubic', () => {
      const samples = new Float32Array([0, 0.5, 1, 0.5, 0, -0.5, -1, -0.5]);
      const result = interpolateSample(samples, 2.5, 'cubic');
      // Cubic interpolation between samples
      expect(typeof result).toBe('number');
    });
    
    it('should wrap around for cyclic waveforms', () => {
      const samples = new Float32Array([1, 2, 3, 4]);
      expect(interpolateSample(samples, 4, 'linear')).toBeCloseTo(1);
    });
  });
  
  describe('interpolateFrame', () => {
    it('should interpolate between frames', () => {
      const wavetable = createEmptyWavetable(4, 64);
      // Fill with distinct patterns
      for (let f = 0; f < 4; f++) {
        for (let i = 0; i < 64; i++) {
          wavetable.frames[f]!.samples[i] = f;
        }
      }
      
      const sample = interpolateFrame(wavetable, 0.5, 0, 'linear', 'linear');
      expect(sample).toBeCloseTo(1.5, 5); // Between frame 1 and 2
    });
  });
  
  describe('MIP-mapping', () => {
    it('should generate MIP maps', () => {
      const frame = generateBasicWaveform('saw', 1024);
      const mipMap = generateMipMaps(frame, 48000);
      
      expect(mipMap.levels.length).toBeGreaterThan(1);
      expect(mipMap.levels[0]!.length).toBe(1024);
      expect(mipMap.levels[1]!.length).toBe(512);
    });
    
    it('should select appropriate MIP level', () => {
      const frame = generateBasicWaveform('saw', 2048);
      const mipMap = generateMipMaps(frame, 48000);
      
      const lowLevel = selectMipLevel(mipMap, 100, 48000);
      const highLevel = selectMipLevel(mipMap, 10000, 48000);
      
      // Higher frequencies should use lower-resolution MIP levels
      expect(highLevel).toBeGreaterThanOrEqual(lowLevel);
    });
    
    it('should generate wavetable MIP maps', () => {
      const pwm = generatePWMTable(8, 512);
      const mipMapped = generateWavetableMipMaps(pwm, 48000);
      
      expect(mipMapped.hasMipMaps).toBe(true);
      expect(mipMapped.mipMaps).toBeDefined();
      expect(mipMapped.mipMaps?.length).toBe(8);
    });
  });
  
  describe('Oscillator processing', () => {
    it('should create oscillator state', () => {
      const state = createOscillatorState();
      expect(state.phase).toBe(0);
      expect(state.frequency).toBe(440);
    });
    
    it('should process single sample', () => {
      const wavetable = createSingleFrameWavetable(generateBasicWaveform('sine', 256));
      const state = createOscillatorState();
      const params: WavetableOscillatorParams = { ...DEFAULT_OSCILLATOR_PARAMS };
      
      const sample = processWavetableOscillator(wavetable, state, params, 48000);
      expect(typeof sample).toBe('number');
      expect(state.phase).toBeGreaterThan(0);
    });
    
    it('should process block', () => {
      const wavetable = createSingleFrameWavetable(generateBasicWaveform('sine', 256));
      const state = createOscillatorState();
      const params: WavetableOscillatorParams = { ...DEFAULT_OSCILLATOR_PARAMS };
      const output = new Float32Array(128);
      
      processWavetableBlock(wavetable, state, params, output, 48000);
      
      // Should have produced audio
      let hasNonZero = false;
      for (let i = 0; i < output.length; i++) {
        if (output[i] !== 0) hasNonZero = true;
      }
      expect(hasNonZero).toBe(true);
    });
  });
  
  describe('Modulation functions', () => {
    it('should apply FM', () => {
      const modulated = applyFM(0.5, 0.1, 0.5, 2);
      expect(modulated).toBeCloseTo(0.6);
    });
    
    it('should apply RM', () => {
      const result = applyRM(1, 0.5, 1);
      expect(result).toBe(0.5); // Full ring mod
      
      const partial = applyRM(1, 0.5, 0.5);
      expect(partial).toBe(0.75); // 50% blend
    });
    
    it('should apply AM', () => {
      const result = applyAM(1, 1, 1); // Full AM with full modulator
      expect(result).toBe(1);
      
      const modulated = applyAM(1, -1, 1); // Full AM with negative modulator
      expect(modulated).toBe(0);
    });
    
    it('should apply sync', () => {
      const state = createOscillatorState();
      state.phase = 0.5;
      
      // No reset when master hasn't crossed zero
      applySync(state, 0.1, 0.05);
      expect(state.phase).toBe(0.5);
      
      // Reset when master crosses zero
      applySync(state, 0.1, 0.9);
      expect(state.phase).toBe(0);
    });
  });
  
  describe('Utility functions', () => {
    it('should create empty wavetable', () => {
      const wt = createEmptyWavetable(16, 512);
      expect(wt.frameCount).toBe(16);
      expect(wt.frameSize).toBe(512);
      expect(wt.frames.length).toBe(16);
    });
    
    it('should create single frame wavetable', () => {
      const sine = generateBasicWaveform('sine', 256);
      const wt = createSingleFrameWavetable(sine, 'Test');
      expect(wt.frameCount).toBe(1);
      expect(wt.frameSize).toBe(256);
      expect(wt.name).toBe('Test');
    });
    
    it('should normalize wavetable', () => {
      const wt = createEmptyWavetable(2, 64);
      wt.frames[0]!.samples[0] = 2;
      wt.frames[1]!.samples[0] = -2;
      
      const normalized = normalizeWavetable(wt);
      expect(Math.abs(normalized.frames[0]!.samples[0]!)).toBeCloseTo(1);
    });
    
    it('should resample wavetable', () => {
      const wt = createSingleFrameWavetable(generateBasicWaveform('sine', 256));
      const resampled = resampleWavetable(wt, 512);
      expect(resampled.frameSize).toBe(512);
      expect(resampled.frames[0]!.samples.length).toBe(512);
    });
    
    it('should analyze harmonics', () => {
      const sine = generateBasicWaveform('sine', 256);
      const { amplitudes, phases } = analyzeHarmonics(sine, 8);
      
      expect(amplitudes.length).toBe(8);
      // Fundamental should be strong, others weak for sine
      expect(amplitudes[0]).toBeGreaterThan(amplitudes[1]!);
    });
    
    it('should get wavetable info', () => {
      const pwm = generatePWMTable(32, 512);
      const info = getWavetableInfo(pwm);
      
      expect(info).toContain('PWM');
      expect(info).toContain('32');
      expect(info).toContain('512');
    });
    
    it('should create factory wavetables', () => {
      const factory = createFactoryWavetables();
      expect(factory.length).toBeGreaterThan(5);
      
      // Should include basic waveforms
      expect(factory.some(wt => wt.name === 'Sine')).toBe(true);
      expect(factory.some(wt => wt.name === 'Saw')).toBe(true);
    });
  });
});

// ============================================================================
// WAVETABLE IMPORT TESTS
// ============================================================================

describe('Wavetable Import', () => {
  describe('Constants', () => {
    it('should have valid constants', () => {
      expect(SURGE_WT_MAGIC).toBe(0x77617673);
      expect(SERUM_FRAME_SIZE).toBe(2048);
      expect(COMMON_CYCLE_SIZES).toContain(2048);
    });
  });
  
  describe('WAV parsing', () => {
    it('should parse valid WAV header', () => {
      // Create minimal WAV header
      const buffer = new ArrayBuffer(100);
      const view = new DataView(buffer);
      
      // RIFF header
      view.setUint8(0, 'R'.charCodeAt(0));
      view.setUint8(1, 'I'.charCodeAt(0));
      view.setUint8(2, 'F'.charCodeAt(0));
      view.setUint8(3, 'F'.charCodeAt(0));
      view.setUint32(4, 92, true); // File size - 8
      view.setUint8(8, 'W'.charCodeAt(0));
      view.setUint8(9, 'A'.charCodeAt(0));
      view.setUint8(10, 'V'.charCodeAt(0));
      view.setUint8(11, 'E'.charCodeAt(0));
      
      // fmt chunk
      view.setUint8(12, 'f'.charCodeAt(0));
      view.setUint8(13, 'm'.charCodeAt(0));
      view.setUint8(14, 't'.charCodeAt(0));
      view.setUint8(15, ' '.charCodeAt(0));
      view.setUint32(16, 16, true); // Chunk size
      view.setUint16(20, 1, true); // PCM format
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, 44100, true); // Sample rate
      view.setUint32(28, 88200, true); // Byte rate
      view.setUint16(32, 2, true); // Block align
      view.setUint16(34, 16, true); // Bits per sample
      
      // data chunk
      view.setUint8(36, 'd'.charCodeAt(0));
      view.setUint8(37, 'a'.charCodeAt(0));
      view.setUint8(38, 't'.charCodeAt(0));
      view.setUint8(39, 'a'.charCodeAt(0));
      view.setUint32(40, 56, true); // Data size
      
      const header = parseWAVHeader(buffer);
      expect(header).not.toBeNull();
      expect(header?.sampleRate).toBe(44100);
      expect(header?.bitsPerSample).toBe(16);
      expect(header?.numChannels).toBe(1);
    });
    
    it('should reject invalid WAV', () => {
      const buffer = new ArrayBuffer(44);
      const view = new DataView(buffer);
      view.setUint32(0, 0x12345678);
      
      const header = parseWAVHeader(buffer);
      expect(header).toBeNull();
    });
  });
  
  describe('Frame count detection', () => {
    it('should detect Serum format', () => {
      const result = detectFrameCount(2048 * 32, { assumeSerum: true });
      expect(result.frameSize).toBe(2048);
      expect(result.frameCount).toBe(32);
    });
    
    it('should detect from common cycle sizes', () => {
      // 131072 samples - first matching cycle size where frameCount <= MAX_FRAMES (256)
      // 131072/256 = 512 frames (>256, skip)
      // 131072/512 = 256 frames (==256, valid!)
      const result = detectFrameCount(2048 * 64);
      expect(result.frameSize).toBe(512);
      expect(result.frameCount).toBe(256);
    });
    
    it('should handle forced frame count', () => {
      const result = detectFrameCount(10000, { forceFrameCount: 10 });
      expect(result.frameCount).toBe(10);
    });
  });
  
  describe('Single cycle import', () => {
    it('should import single cycle waveform', () => {
      const samples = generateBasicWaveform('sine', 256);
      const result = importSingleCycle(samples, { name: 'Test Sine' });
      
      expect(result.success).toBe(true);
      expect(result.wavetable?.frameCount).toBe(1);
      expect(result.wavetable?.name).toBe('Test Sine');
    });
    
    it('should resample to target size', () => {
      const samples = generateBasicWaveform('sine', 256);
      const result = importSingleCycle(samples, { targetFrameSize: 512 });
      
      expect(result.success).toBe(true);
      expect(result.wavetable?.frameSize).toBe(512);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
  
  describe('Harmonic import', () => {
    it('should import from harmonics', () => {
      const harmonics: HarmonicSpec[] = [
        { harmonic: 1, amplitude: 1 },
        { harmonic: 3, amplitude: 0.5 },
        { harmonic: 5, amplitude: 0.25 },
      ];
      
      const result = importFromHarmonics(harmonics, { name: 'Square-ish' });
      
      expect(result.success).toBe(true);
      expect(result.wavetable?.frameCount).toBe(1);
      expect(result.sourceFormat).toBe('harmonics');
    });
    
    it('should import evolving harmonics', () => {
      const start: HarmonicSpec[] = [{ harmonic: 1, amplitude: 1 }];
      const end: HarmonicSpec[] = [
        { harmonic: 1, amplitude: 1 },
        { harmonic: 2, amplitude: 0.5 },
        { harmonic: 3, amplitude: 0.25 },
      ];
      
      const result = importEvolvingHarmonics(start, end, 16, { name: 'Morph' });
      
      expect(result.success).toBe(true);
      expect(result.wavetable?.frameCount).toBe(16);
    });
  });
  
  describe('Auto import', () => {
    it('should reject unknown format', () => {
      const buffer = new ArrayBuffer(100);
      const result = autoImport(buffer);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown');
    });
  });
});

// ============================================================================
// SURGE ASSETS TESTS
// ============================================================================

describe('Surge Assets', () => {
  describe('Constants', () => {
    it('should have oscillator types', () => {
      expect(SURGE_OSC_TYPES.ot_wavetable).toBe(2);
      expect(SURGE_OSC_TYPES.ot_classic).toBe(0);
      expect(SURGE_OSC_TYPES.ot_FM3).toBe(5);
    });
    
    it('should have filter types', () => {
      expect(SURGE_FILTER_TYPES.fut_none).toBe(0);
      expect(SURGE_FILTER_TYPES.fut_lp24).toBe(2);
      expect(SURGE_FILTER_TYPES.fut_vintageladder).toBe(13);
    });
    
    it('should have FX types', () => {
      expect(SURGE_FX_TYPES.fxt_off).toBe(0);
      expect(SURGE_FX_TYPES.fxt_reverb).toBe(2);
      expect(SURGE_FX_TYPES.fxt_chorus4).toBe(9);
    });
    
    it('should have wavetable osc params', () => {
      expect(WT_OSC_PARAMS.wt_morph).toBe(0);
      expect(WT_OSC_PARAMS.wt_unison_voices).toBe(6);
    });
  });
  
  describe('Known wavetables', () => {
    it('should have factory wavetables list', () => {
      expect(KNOWN_FACTORY_WAVETABLES.length).toBeGreaterThan(10);
      expect(KNOWN_FACTORY_WAVETABLES.some(wt => wt.name === 'Sine')).toBe(true);
      expect(KNOWN_FACTORY_WAVETABLES.some(wt => wt.name === 'Cello')).toBe(true);
    });
  });
  
  describe('FXP header parsing', () => {
    it('should parse valid FXP header', () => {
      const buffer = new ArrayBuffer(100);
      const view = new DataView(buffer);
      
      // CcnK magic
      view.setUint8(0, 'C'.charCodeAt(0));
      view.setUint8(1, 'c'.charCodeAt(0));
      view.setUint8(2, 'n'.charCodeAt(0));
      view.setUint8(3, 'K'.charCodeAt(0));
      
      // Byte size (big-endian)
      view.setUint32(4, 88, false);
      
      // FPCh magic (chunk preset)
      view.setUint8(8, 'F'.charCodeAt(0));
      view.setUint8(9, 'P'.charCodeAt(0));
      view.setUint8(10, 'C'.charCodeAt(0));
      view.setUint8(11, 'h'.charCodeAt(0));
      
      // Version
      view.setUint32(12, 1, false);
      
      // Plugin ID
      view.setUint8(16, 'S'.charCodeAt(0));
      view.setUint8(17, 'u'.charCodeAt(0));
      view.setUint8(18, 'r'.charCodeAt(0));
      view.setUint8(19, 'g'.charCodeAt(0));
      
      // Plugin version
      view.setUint32(20, 1, false);
      
      // Num params
      view.setUint32(24, 0, false);
      
      // Program name (28 bytes)
      const name = 'Test Preset';
      for (let i = 0; i < name.length; i++) {
        view.setUint8(28 + i, name.charCodeAt(i));
      }
      
      // Chunk size
      view.setUint32(56, 20, false);
      
      const header = parseFXPHeader(buffer);
      expect(header).not.toBeNull();
      expect(header?.valid).toBe(true);
      expect(header?.fxMagic).toBe('FPCh');
      expect(header?.prgName).toBe('Test Preset');
    });
    
    it('should reject invalid FXP', () => {
      const buffer = new ArrayBuffer(60);
      const header = parseFXPHeader(buffer);
      expect(header).toBeNull();
    });
  });
  
  describe('Wavetable metadata parsing', () => {
    it('should parse factory wavetable metadata', () => {
      const item = {
        name: 'Sine.wt',
        path: 'resources/data/wavetables/basic/Sine.wt',
        sha: 'abc123',
        size: 1024,
        url: '',
        html_url: '',
        download_url: 'https://example.com/Sine.wt',
        type: 'file' as const,
      };
      
      const metadata = parseWavetableMetadata(item, false);
      
      expect(metadata.name).toBe('Sine');
      expect(metadata.category).toBe('basic');
      expect(metadata.isThirdParty).toBe(false);
      expect(metadata.extension).toBe('wt');
    });
    
    it('should parse third-party wavetable metadata', () => {
      const item = {
        name: 'Droplet.wav',
        path: 'resources/data/wavetables_3rdparty/A.Liv/Digital/Droplet.wav',
        sha: 'def456',
        size: 2048,
        url: '',
        html_url: '',
        download_url: 'https://example.com/Droplet.wav',
        type: 'file' as const,
      };
      
      const metadata = parseWavetableMetadata(item, true);
      
      expect(metadata.name).toBe('Droplet');
      expect(metadata.contributor).toBe('A.Liv');
      expect(metadata.isThirdParty).toBe(true);
      expect(metadata.extension).toBe('wav');
    });
  });
});
