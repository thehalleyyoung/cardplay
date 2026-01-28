/**
 * @fileoverview Tests for Visualization Components.
 */

import { describe, it, expect } from 'vitest';
import {
  // Waveform
  DEFAULT_WAVEFORM_CONFIG,
  calculateWaveformPeaks,
  normalizeWaveformPeaks,
  calculateStereoWaveformPeaks,
  createWaveformState,
  
  // Spectrogram
  DEFAULT_SPECTROGRAM_CONFIG,
  windowFunctions,
  generateWindow,
  calculateMagnitudeSpectrum,
  frequencyToY,
  binToFrequency,
  spectrogramGradients,
  
  // Piano Keyboard
  DEFAULT_PIANO_CONFIG,
  NOTE_NAMES,
  isBlackKey,
  midiNoteToName,
  midiNoteToOctave,
  getBlackKeyOffset,
  generatePianoKeys,
  createPianoKeyboardState,
  pianoNoteOn,
  pianoNoteOff,
  highlightNotes,
  
  // Level Meters
  DEFAULT_LEVEL_METER_CONFIG,
  amplitudeToDb,
  dbToAmplitude,
  calculateLevel,
  applyMeterBallistics,
  dbToMeterPosition,
  getMeterColor,
  generateMeterScale,
  
  // Phase Meter
  DEFAULT_PHASE_METER_CONFIG,
  calculateCorrelation,
  createPhaseMeterState,
  
  // Timeline
  DEFAULT_TIMELINE_CONFIG,
  calculateBarDuration,
  generateTimelineTicks,
  createTimelineState,
  
  // Velocity
  DEFAULT_VELOCITY_CONFIG,
  velocityToHeight,
  heightToVelocity,
  
  // XY Pad
  DEFAULT_XY_PAD_CONFIG,
  createXYPadState,
  pixelToXYValue,
  xyValueToPixel,
  
  // Envelope Editor
  DEFAULT_ENVELOPE_EDITOR_CONFIG,
  DEFAULT_ADSR,
  adsrToPoints,
  getEnvelopeValue,
} from './visualization';

// ============================================================================
// WAVEFORM TESTS
// ============================================================================

describe('Waveform', () => {
  describe('DEFAULT_WAVEFORM_CONFIG', () => {
    it('should have valid defaults', () => {
      expect(DEFAULT_WAVEFORM_CONFIG.renderMode).toBe('filled');
      expect(DEFAULT_WAVEFORM_CONFIG.channelMode).toBe('mono');
      expect(DEFAULT_WAVEFORM_CONFIG.showRMS).toBe(true);
    });
  });

  describe('calculateWaveformPeaks', () => {
    it('should calculate peaks for silence', () => {
      const samples = new Float32Array(1000);
      const peaks = calculateWaveformPeaks(samples, 10);
      
      expect(peaks.length).toBe(10);
      expect(peaks[0]!.min).toBe(0);
      expect(peaks[0]!.max).toBe(0);
    });

    it('should calculate peaks for sine wave', () => {
      const samples = new Float32Array(1000);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = Math.sin(i * 0.1);
      }
      
      const peaks = calculateWaveformPeaks(samples, 10);
      
      expect(peaks.length).toBe(10);
      expect(peaks[0]!.max).toBeGreaterThan(0);
      expect(peaks[0]!.min).toBeLessThan(0);
    });

    it('should calculate RMS', () => {
      const samples = new Float32Array(100);
      samples.fill(0.5);
      
      const peaks = calculateWaveformPeaks(samples, 1);
      
      expect(peaks[0]!.rms).toBeCloseTo(0.5);
    });

    it('should handle sample range', () => {
      const samples = new Float32Array(1000);
      samples.fill(0.5);
      samples[500] = 1.0;
      
      const peaks = calculateWaveformPeaks(samples, 10, 400, 600);
      
      expect(peaks.some(p => p.max === 1.0)).toBe(true);
    });
  });

  describe('normalizeWaveformPeaks', () => {
    it('should normalize peaks to headroom', () => {
      const peaks = [
        { min: -0.5, max: 0.5, rms: 0.3 },
        { min: -0.25, max: 0.25, rms: 0.15 },
      ];
      
      const normalized = normalizeWaveformPeaks(peaks, 1.0);
      
      expect(normalized[0]!.max).toBeCloseTo(1.0);
    });

    it('should handle silence', () => {
      const peaks = [{ min: 0, max: 0, rms: 0 }];
      const normalized = normalizeWaveformPeaks(peaks);
      
      expect(normalized[0]!.max).toBe(0);
    });
  });

  describe('calculateStereoWaveformPeaks', () => {
    it('should calculate mono peaks', () => {
      const left = new Float32Array([0.5, 0.5, 0.5]);
      const right = new Float32Array([0.3, 0.3, 0.3]);
      
      const peaks = calculateStereoWaveformPeaks(left, right, 1, 'mono');
      
      expect(peaks.left[0]!.max).toBeCloseTo(0.4); // Average
    });

    it('should calculate stereo peaks', () => {
      const left = new Float32Array([0.8]);
      const right = new Float32Array([0.2]);
      
      const peaks = calculateStereoWaveformPeaks(left, right, 1, 'stereo');
      
      expect(peaks.left[0]!.max).toBeCloseTo(0.8);
      expect(peaks.right[0]!.max).toBeCloseTo(0.2);
    });

    it('should calculate mid-side peaks', () => {
      const left = new Float32Array([0.6]);
      const right = new Float32Array([0.4]);
      
      const peaks = calculateStereoWaveformPeaks(left, right, 1, 'mid-side');
      
      expect(peaks.left[0]!.max).toBeCloseTo(0.5);  // Mid: (L+R)/2
      expect(peaks.right[0]!.max).toBeCloseTo(0.1); // Side: (L-R)/2
    });
  });

  describe('createWaveformState', () => {
    it('should create waveform state', () => {
      const left = new Float32Array(48000);
      const state = createWaveformState(left, null, 48000, 100);
      
      expect(state.duration).toBe(1);
      expect(state.sampleRate).toBe(48000);
      expect(state.channels).toBe(1);
    });
  });
});

// ============================================================================
// SPECTROGRAM TESTS
// ============================================================================

describe('Spectrogram', () => {
  describe('DEFAULT_SPECTROGRAM_CONFIG', () => {
    it('should have valid defaults', () => {
      expect(DEFAULT_SPECTROGRAM_CONFIG.fftSize).toBe(2048);
      expect(DEFAULT_SPECTROGRAM_CONFIG.windowFunction).toBe('hann');
      expect(DEFAULT_SPECTROGRAM_CONFIG.frequencyScale).toBe('logarithmic');
    });
  });

  describe('windowFunctions', () => {
    it('should generate rectangular window', () => {
      expect(windowFunctions.rectangular(0, 10)).toBe(1);
      expect(windowFunctions.rectangular(5, 10)).toBe(1);
    });

    it('should generate hann window', () => {
      expect(windowFunctions.hann(0, 10)).toBeCloseTo(0);
      expect(windowFunctions.hann(5, 10)).toBeCloseTo(0.97, 1); // Peak at midpoint
    });

    it('should generate hamming window', () => {
      expect(windowFunctions.hamming(0, 10)).toBeCloseTo(0.08);
      expect(windowFunctions.hamming(5, 10)).toBeCloseTo(0.97, 1); // Hamming doesn't reach 1
    });
  });

  describe('generateWindow', () => {
    it('should generate window array', () => {
      const window = generateWindow('hann', 256);
      
      expect(window.length).toBe(256);
      expect(window[0]).toBeCloseTo(0);
      expect(window[128]).toBeCloseTo(1);
    });
  });

  describe('calculateMagnitudeSpectrum', () => {
    it('should calculate magnitude from FFT result', () => {
      const real = new Float32Array([1, 0, 0, 0]);
      const imag = new Float32Array([0, 1, 0, 0]);
      
      const magnitudes = calculateMagnitudeSpectrum(real, imag);
      
      expect(magnitudes.length).toBe(2);
      expect(magnitudes[0]).toBeGreaterThan(0);
    });
  });

  describe('frequencyToY', () => {
    it('should map linear frequency', () => {
      const y = frequencyToY(10000, 100, 0, 20000, 'linear');
      expect(y).toBeCloseTo(50);
    });

    it('should map logarithmic frequency', () => {
      const y = frequencyToY(1000, 100, 100, 10000, 'logarithmic');
      expect(y).toBeCloseTo(50);
    });

    it('should map mel frequency', () => {
      const y = frequencyToY(1000, 100, 0, 8000, 'mel');
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(100);
    });
  });

  describe('binToFrequency', () => {
    it('should convert bin to frequency', () => {
      const freq = binToFrequency(512, 2048, 48000);
      expect(freq).toBe(12000);
    });
  });

  describe('spectrogramGradients', () => {
    it('should have all color schemes', () => {
      expect(spectrogramGradients.grayscale).toBeDefined();
      expect(spectrogramGradients.magma).toBeDefined();
      expect(spectrogramGradients.viridis).toBeDefined();
    });

    it('should have valid gradient stops', () => {
      for (const [name, gradient] of Object.entries(spectrogramGradients)) {
        expect(gradient.stops.length).toBeGreaterThanOrEqual(2);
        expect(gradient.stops[0]!.position).toBe(0);
        expect(gradient.stops[gradient.stops.length - 1]!.position).toBe(1);
      }
    });
  });
});

// ============================================================================
// PIANO KEYBOARD TESTS
// ============================================================================

describe('Piano Keyboard', () => {
  describe('NOTE_NAMES', () => {
    it('should have 12 note names', () => {
      expect(NOTE_NAMES.length).toBe(12);
      expect(NOTE_NAMES[0]).toBe('C');
      expect(NOTE_NAMES[11]).toBe('B');
    });
  });

  describe('isBlackKey', () => {
    it('should identify black keys', () => {
      expect(isBlackKey(60)).toBe(false);  // C4
      expect(isBlackKey(61)).toBe(true);   // C#4
      expect(isBlackKey(62)).toBe(false);  // D4
      expect(isBlackKey(63)).toBe(true);   // D#4
      expect(isBlackKey(64)).toBe(false);  // E4
      expect(isBlackKey(65)).toBe(false);  // F4
      expect(isBlackKey(66)).toBe(true);   // F#4
    });
  });

  describe('midiNoteToName', () => {
    it('should convert MIDI note to name', () => {
      expect(midiNoteToName(60)).toBe('C4');
      expect(midiNoteToName(69)).toBe('A4');
      expect(midiNoteToName(21)).toBe('A0');
    });
  });

  describe('midiNoteToOctave', () => {
    it('should get octave from MIDI note', () => {
      expect(midiNoteToOctave(60)).toBe(4);
      expect(midiNoteToOctave(24)).toBe(1);
      expect(midiNoteToOctave(108)).toBe(8);
    });
  });

  describe('generatePianoKeys', () => {
    it('should generate keys for default range', () => {
      const keys = generatePianoKeys();
      
      expect(keys.length).toBe(88);
    });

    it('should generate keys for custom range', () => {
      const keys = generatePianoKeys({
        ...DEFAULT_PIANO_CONFIG,
        startNote: 48,
        endNote: 72,
      });
      
      expect(keys.length).toBe(25);
    });

    it('should position white keys correctly', () => {
      const keys = generatePianoKeys({
        ...DEFAULT_PIANO_CONFIG,
        startNote: 60,
        endNote: 71,
      });
      
      const whiteKeys = keys.filter(k => k.type === 'white');
      expect(whiteKeys.length).toBe(7);
    });
  });

  describe('Piano keyboard state', () => {
    it('should create initial state', () => {
      const state = createPianoKeyboardState();
      
      expect(state.keys.length).toBe(88);
      expect(state.pressedNotes.size).toBe(0);
      expect(state.velocity).toBe(100);
    });

    it('should handle note on', () => {
      let state = createPianoKeyboardState();
      state = pianoNoteOn(state, 60);
      
      expect(state.pressedNotes.has(60)).toBe(true);
    });

    it('should handle note off', () => {
      let state = createPianoKeyboardState();
      state = pianoNoteOn(state, 60);
      state = pianoNoteOff(state, 60);
      
      expect(state.pressedNotes.has(60)).toBe(false);
    });

    it('should highlight notes', () => {
      let state = createPianoKeyboardState();
      state = highlightNotes(state, [60, 64, 67]); // C major chord
      
      expect(state.highlightedNotes.has(60)).toBe(true);
      expect(state.highlightedNotes.has(64)).toBe(true);
      expect(state.highlightedNotes.has(67)).toBe(true);
    });
  });
});

// ============================================================================
// LEVEL METER TESTS
// ============================================================================

describe('Level Meters', () => {
  describe('amplitudeToDb', () => {
    it('should convert amplitude to dB', () => {
      expect(amplitudeToDb(1)).toBe(0);
      expect(amplitudeToDb(0.5)).toBeCloseTo(-6, 0);
      expect(amplitudeToDb(0.1)).toBeCloseTo(-20, 0);
    });

    it('should handle zero amplitude', () => {
      expect(amplitudeToDb(0)).toBeLessThan(-100);
    });
  });

  describe('dbToAmplitude', () => {
    it('should convert dB to amplitude', () => {
      expect(dbToAmplitude(0)).toBe(1);
      expect(dbToAmplitude(-6)).toBeCloseTo(0.5, 1);
      expect(dbToAmplitude(-20)).toBeCloseTo(0.1, 1);
    });

    it('should be inverse of amplitudeToDb', () => {
      const original = 0.7;
      const db = amplitudeToDb(original);
      const restored = dbToAmplitude(db);
      expect(restored).toBeCloseTo(original);
    });
  });

  describe('calculateLevel', () => {
    it('should calculate peak level', () => {
      const samples = new Float32Array([0.2, -0.5, 0.3, 0.8]);
      const level = calculateLevel(samples, 'peak');
      
      expect(level).toBeCloseTo(amplitudeToDb(0.8));
    });

    it('should calculate RMS level', () => {
      const samples = new Float32Array(100);
      samples.fill(0.5);
      
      const level = calculateLevel(samples, 'rms');
      expect(level).toBeCloseTo(amplitudeToDb(0.5));
    });
  });

  describe('applyMeterBallistics', () => {
    it('should smooth towards target', () => {
      const result = applyMeterBallistics(-6, -12, 0.9, 0.016);
      expect(result).toBeLessThan(-6);
      expect(result).toBeGreaterThan(-12);
    });
  });

  describe('dbToMeterPosition', () => {
    it('should map dB to position', () => {
      const pos0 = dbToMeterPosition(0, DEFAULT_LEVEL_METER_CONFIG);
      const pos60 = dbToMeterPosition(-60, DEFAULT_LEVEL_METER_CONFIG);
      
      expect(pos0).toBeGreaterThan(pos60);
      expect(pos60).toBeCloseTo(0);
    });
  });

  describe('getMeterColor', () => {
    it('should return normal color below warning', () => {
      const color = getMeterColor(-20, DEFAULT_LEVEL_METER_CONFIG);
      expect(color).toBe(DEFAULT_LEVEL_METER_CONFIG.normalColor);
    });

    it('should return warning color at warning level', () => {
      const color = getMeterColor(-10, DEFAULT_LEVEL_METER_CONFIG);
      expect(color).toBe(DEFAULT_LEVEL_METER_CONFIG.warningColor);
    });

    it('should return critical color at 0dB', () => {
      const color = getMeterColor(0, DEFAULT_LEVEL_METER_CONFIG);
      expect(color).toBe(DEFAULT_LEVEL_METER_CONFIG.criticalColor);
    });
  });

  describe('generateMeterScale', () => {
    it('should generate scale marks', () => {
      const marks = generateMeterScale(DEFAULT_LEVEL_METER_CONFIG);
      
      expect(marks.length).toBeGreaterThan(0);
      expect(marks.some(m => m.db === 0)).toBe(true);
      expect(marks.some(m => m.db === -12)).toBe(true);
    });
  });
});

// ============================================================================
// PHASE METER TESTS
// ============================================================================

describe('Phase Meter', () => {
  describe('calculateCorrelation', () => {
    it('should return 1 for identical signals', () => {
      const signal = new Float32Array([0.5, 0.3, 0.7, 0.2]);
      const correlation = calculateCorrelation(signal, signal);
      
      expect(correlation).toBeCloseTo(1);
    });

    it('should return -1 for inverted signals', () => {
      const left = new Float32Array([0.5, 0.3, 0.7, 0.2]);
      const right = new Float32Array([-0.5, -0.3, -0.7, -0.2]);
      
      const correlation = calculateCorrelation(left, right);
      expect(correlation).toBeCloseTo(-1);
    });

    it('should return 0 for silence', () => {
      const left = new Float32Array(100);
      const right = new Float32Array(100);
      
      const correlation = calculateCorrelation(left, right);
      expect(correlation).toBe(0);
    });
  });

  describe('createPhaseMeterState', () => {
    it('should create initial state', () => {
      const state = createPhaseMeterState(48000);
      
      expect(state.correlation).toBe(0);
      expect(state.integrationSamples).toBe(2400); // 50ms at 48kHz
    });
  });
});

// ============================================================================
// TIMELINE TESTS
// ============================================================================

describe('Timeline', () => {
  describe('calculateBarDuration', () => {
    it('should calculate 4/4 bar duration', () => {
      const duration = calculateBarDuration(120, 4, 4);
      expect(duration).toBe(2); // 2 seconds per bar at 120 BPM
    });

    it('should calculate 3/4 bar duration', () => {
      const duration = calculateBarDuration(120, 3, 4);
      expect(duration).toBe(1.5);
    });

    it('should calculate 6/8 bar duration', () => {
      const duration = calculateBarDuration(120, 6, 8);
      expect(duration).toBe(1.5);
    });
  });

  describe('generateTimelineTicks', () => {
    it('should generate ticks for bars mode', () => {
      const ticks = generateTimelineTicks(0, 10, DEFAULT_TIMELINE_CONFIG);
      
      expect(ticks.length).toBeGreaterThan(0);
      expect(ticks[0]!.bar).toBe(1);
    });

    it('should generate minor ticks for beats', () => {
      const config = { ...DEFAULT_TIMELINE_CONFIG, showMinorTicks: true };
      const ticks = generateTimelineTicks(0, 4, config);
      
      const minorTicks = ticks.filter(t => !t.major);
      expect(minorTicks.length).toBeGreaterThan(0);
    });

    it('should generate time-based ticks', () => {
      const config = { ...DEFAULT_TIMELINE_CONFIG, mode: 'time' as const };
      const ticks = generateTimelineTicks(0, 60, config);
      
      expect(ticks.length).toBeGreaterThan(0);
    });
  });

  describe('createTimelineState', () => {
    it('should create timeline state', () => {
      const state = createTimelineState(30);
      
      expect(state.playheadPosition).toBe(0);
      expect(state.loopStart).toBeNull();
      expect(state.zoom).toBe(1);
    });
  });
});

// ============================================================================
// VELOCITY TESTS
// ============================================================================

describe('Velocity', () => {
  describe('velocityToHeight', () => {
    it('should convert velocity to height', () => {
      const height = velocityToHeight(127, 60);
      expect(height).toBe(60);

      const halfHeight = velocityToHeight(64, 60);
      expect(halfHeight).toBeCloseTo(30, 0);
    });

    it('should handle zero velocity', () => {
      const height = velocityToHeight(0, 60);
      expect(height).toBe(0);
    });
  });

  describe('heightToVelocity', () => {
    it('should convert height to velocity', () => {
      const velocity = heightToVelocity(60, 60);
      expect(velocity).toBe(127);

      const halfVelocity = heightToVelocity(30, 60);
      expect(halfVelocity).toBeCloseTo(64, 0);
    });

    it('should be inverse of velocityToHeight', () => {
      const original = 100;
      const height = velocityToHeight(original, 60);
      const restored = heightToVelocity(height, 60);
      expect(restored).toBe(original);
    });
  });
});

// ============================================================================
// XY PAD TESTS
// ============================================================================

describe('XY Pad', () => {
  describe('createXYPadState', () => {
    it('should create initial state', () => {
      const state = createXYPadState();
      
      expect(state.x).toBe(64);
      expect(state.y).toBe(64);
      expect(state.dragging).toBe(false);
    });

    it('should accept initial values', () => {
      const state = createXYPadState(100, 50);
      
      expect(state.x).toBe(100);
      expect(state.y).toBe(50);
    });
  });

  describe('pixelToXYValue', () => {
    it('should convert pixel to XY value', () => {
      const config = DEFAULT_XY_PAD_CONFIG;
      
      const topLeft = pixelToXYValue(0, 0, config);
      expect(topLeft.x).toBe(0);
      expect(topLeft.y).toBe(127);
      
      const bottomRight = pixelToXYValue(200, 200, config);
      expect(bottomRight.x).toBe(127);
      expect(bottomRight.y).toBe(0);
    });

    it('should clamp values', () => {
      const value = pixelToXYValue(-10, -10, DEFAULT_XY_PAD_CONFIG);
      expect(value.x).toBe(0);
      expect(value.y).toBe(127);
    });
  });

  describe('xyValueToPixel', () => {
    it('should convert XY value to pixel', () => {
      const config = DEFAULT_XY_PAD_CONFIG;
      
      const origin = xyValueToPixel(0, 127, config);
      expect(origin.pixelX).toBe(0);
      expect(origin.pixelY).toBe(0);
    });

    it('should be inverse of pixelToXYValue', () => {
      const config = DEFAULT_XY_PAD_CONFIG;
      const originalX = 80;
      const originalY = 100;
      
      const pixel = xyValueToPixel(originalX, originalY, config);
      const restored = pixelToXYValue(pixel.pixelX, pixel.pixelY, config);
      
      expect(restored.x).toBe(originalX);
      expect(restored.y).toBe(originalY);
    });
  });
});

// ============================================================================
// ENVELOPE EDITOR TESTS
// ============================================================================

describe('Envelope Editor', () => {
  describe('DEFAULT_ADSR', () => {
    it('should have valid defaults', () => {
      expect(DEFAULT_ADSR.attack).toBe(10);
      expect(DEFAULT_ADSR.decay).toBe(100);
      expect(DEFAULT_ADSR.sustain).toBe(0.7);
      expect(DEFAULT_ADSR.release).toBe(200);
    });
  });

  describe('adsrToPoints', () => {
    it('should generate envelope points', () => {
      const points = adsrToPoints(DEFAULT_ADSR);
      
      expect(points.length).toBe(5);
      expect(points[0]!.value).toBe(0);      // Start at 0
      expect(points[1]!.value).toBe(1);      // Peak at 1
      expect(points[2]!.value).toBe(0.7);    // Sustain level
      expect(points[4]!.value).toBe(0);      // End at 0
    });

    it('should assign correct stages', () => {
      const points = adsrToPoints(DEFAULT_ADSR);
      
      expect(points[0]!.stage).toBe('attack');
      expect(points[1]!.stage).toBe('attack');
      expect(points[2]!.stage).toBe('decay');
      expect(points[3]!.stage).toBe('sustain');
      expect(points[4]!.stage).toBe('release');
    });
  });

  describe('getEnvelopeValue', () => {
    it('should interpolate envelope value', () => {
      const points = adsrToPoints(DEFAULT_ADSR);
      
      // At time 0
      expect(getEnvelopeValue(points, 0)).toBe(0);
      
      // At peak (after attack)
      const attackEnd = DEFAULT_ADSR.attack / 1000;
      expect(getEnvelopeValue(points, attackEnd)).toBe(1);
    });

    it('should return end value past envelope', () => {
      const points = adsrToPoints(DEFAULT_ADSR);
      expect(getEnvelopeValue(points, 10)).toBe(0);
    });

    it('should handle empty points', () => {
      expect(getEnvelopeValue([], 0.5)).toBe(0);
    });
  });
});

// ============================================================================
// DEFAULTS TESTS
// ============================================================================

describe('Default Configurations', () => {
  it('should have valid DEFAULT_WAVEFORM_CONFIG', () => {
    expect(DEFAULT_WAVEFORM_CONFIG.pixelRatio).toBe(2);
  });

  it('should have valid DEFAULT_SPECTROGRAM_CONFIG', () => {
    expect(DEFAULT_SPECTROGRAM_CONFIG.minDecibels).toBe(-90);
  });

  it('should have valid DEFAULT_PIANO_CONFIG', () => {
    expect(DEFAULT_PIANO_CONFIG.startNote).toBe(21);
    expect(DEFAULT_PIANO_CONFIG.endNote).toBe(108);
  });

  it('should have valid DEFAULT_LEVEL_METER_CONFIG', () => {
    expect(DEFAULT_LEVEL_METER_CONFIG.criticalLevel).toBe(0);
  });

  it('should have valid DEFAULT_PHASE_METER_CONFIG', () => {
    expect(DEFAULT_PHASE_METER_CONFIG.integrationTime).toBe(50);
  });

  it('should have valid DEFAULT_TIMELINE_CONFIG', () => {
    expect(DEFAULT_TIMELINE_CONFIG.tempo).toBe(120);
  });

  it('should have valid DEFAULT_VELOCITY_CONFIG', () => {
    expect(DEFAULT_VELOCITY_CONFIG.maxVelocity).toBe(127);
  });

  it('should have valid DEFAULT_XY_PAD_CONFIG', () => {
    expect(DEFAULT_XY_PAD_CONFIG.width).toBe(200);
  });

  it('should have valid DEFAULT_ENVELOPE_EDITOR_CONFIG', () => {
    expect(DEFAULT_ENVELOPE_EDITOR_CONFIG.pointRadius).toBe(6);
  });
});
