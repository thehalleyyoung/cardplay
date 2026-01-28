/**
 * @fileoverview Tests for Mixer & Routing System.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculatePanGains,
  applyStereoWidth,
  dbToLinear,
  linearToDb,
  calculateChannelGain,
  calculateSendLevel,
  PeakDetector,
  RMSCalculator,
  CorrelationMeter,
  StereoMeterProcessor,
  ChannelStrip,
  buildMixerGraph,
  sortChannelsForProcessing,
  validateMixerRouting,
  MixerProcessor,
  createMixerState,
  DEFAULT_CHANNEL,
  DEFAULT_MIXER_CONFIG,
} from './mixer';
import type { ChannelParams, ChannelSend } from './mixer';

// ============================================================================
// PAN CALCULATION TESTS
// ============================================================================

describe('calculatePanGains', () => {
  it('should return equal gains at center (0dB)', () => {
    const gains = calculatePanGains(0, '0db');
    expect(gains.left).toBeCloseTo(0.5);
    expect(gains.right).toBeCloseTo(0.5);
  });

  it('should return equal gains at center (-3dB)', () => {
    const gains = calculatePanGains(0, '-3db');
    // sqrt(0.5) ≈ 0.707
    expect(gains.left).toBeCloseTo(Math.SQRT1_2);
    expect(gains.right).toBeCloseTo(Math.SQRT1_2);
  });

  it('should pan fully left', () => {
    const gains = calculatePanGains(-1, '-3db');
    expect(gains.left).toBeCloseTo(1);
    expect(gains.right).toBeCloseTo(0);
  });

  it('should pan fully right', () => {
    const gains = calculatePanGains(1, '-3db');
    expect(gains.left).toBeCloseTo(0);
    expect(gains.right).toBeCloseTo(1);
  });

  it('should clamp pan values', () => {
    const left = calculatePanGains(-2, '-3db');
    const right = calculatePanGains(2, '-3db');
    
    expect(left.left).toBeCloseTo(1);
    expect(right.right).toBeCloseTo(1);
  });
});

describe('applyStereoWidth', () => {
  it('should keep original at width 1', () => {
    const result = applyStereoWidth(0.8, 0.2, 1);
    expect(result.left).toBeCloseTo(0.8);
    expect(result.right).toBeCloseTo(0.2);
  });

  it('should collapse to mono at width 0', () => {
    const result = applyStereoWidth(0.8, 0.2, 0);
    expect(result.left).toBeCloseTo(0.5);
    expect(result.right).toBeCloseTo(0.5);
  });

  it('should widen at width 2', () => {
    const result = applyStereoWidth(0.8, 0.2, 2);
    // Side component = (0.8 - 0.2) / 2 = 0.3
    // Mid = (0.8 + 0.2) / 2 = 0.5
    // At width 2, side doubles
    expect(result.left).toBeCloseTo(1.1);
    expect(result.right).toBeCloseTo(-0.1);
  });
});

// ============================================================================
// GAIN CALCULATION TESTS
// ============================================================================

describe('dbToLinear', () => {
  it('should convert 0dB to 1', () => {
    expect(dbToLinear(0)).toBe(1);
  });

  it('should convert -6dB to ~0.5', () => {
    expect(dbToLinear(-6)).toBeCloseTo(0.5, 1);
  });

  it('should convert +6dB to ~2', () => {
    expect(dbToLinear(6)).toBeCloseTo(2, 1);
  });

  it('should convert -20dB to 0.1', () => {
    expect(dbToLinear(-20)).toBeCloseTo(0.1);
  });
});

describe('linearToDb', () => {
  it('should convert 1 to 0dB', () => {
    expect(linearToDb(1)).toBe(0);
  });

  it('should convert 0.5 to ~-6dB', () => {
    expect(linearToDb(0.5)).toBeCloseTo(-6, 0);
  });

  it('should convert 0 to -Infinity', () => {
    expect(linearToDb(0)).toBe(-Infinity);
  });

  it('should be inverse of dbToLinear', () => {
    expect(linearToDb(dbToLinear(-12))).toBeCloseTo(-12);
  });
});

describe('calculateChannelGain', () => {
  it('should return 0 when muted', () => {
    const channel: ChannelParams = {
      ...DEFAULT_CHANNEL,
      id: 'test',
      mute: true,
      fader: 0,
      gain: 0,
    };
    
    expect(calculateChannelGain(channel)).toBe(0);
  });

  it('should combine gain and fader', () => {
    const channel: ChannelParams = {
      ...DEFAULT_CHANNEL,
      id: 'test',
      gain: 6,   // +6dB ≈ 2x
      fader: -6, // -6dB ≈ 0.5x
    };
    
    expect(calculateChannelGain(channel)).toBeCloseTo(1, 1);
  });
});

describe('calculateSendLevel', () => {
  it('should return 0 when disabled', () => {
    const send: ChannelSend = {
      id: 's1',
      targetBus: 'aux1',
      level: 0,
      type: 'post-fader',
      enabled: false,
    };
    
    expect(calculateSendLevel(send, 0)).toBe(0);
  });

  it('should ignore fader for pre-fader sends', () => {
    const send: ChannelSend = {
      id: 's1',
      targetBus: 'aux1',
      level: -6,
      type: 'pre-fader',
      enabled: true,
    };
    
    // Pre-fader send at -6dB = 0.5
    expect(calculateSendLevel(send, -96)).toBeCloseTo(0.5, 1);
  });

  it('should apply fader for post-fader sends', () => {
    const send: ChannelSend = {
      id: 's1',
      targetBus: 'aux1',
      level: 0,
      type: 'post-fader',
      enabled: true,
    };
    
    // Post-fader send at 0dB with fader at -6dB = 0.5
    expect(calculateSendLevel(send, -6)).toBeCloseTo(0.5, 1);
  });
});

// ============================================================================
// METERING TESTS
// ============================================================================

describe('PeakDetector', () => {
  it('should detect peak', () => {
    const detector = new PeakDetector(48000);
    
    detector.process(0.5);
    detector.process(0.8);
    detector.process(0.3);
    
    expect(detector.getPeak()).toBe(0.8);
  });

  it('should hold peak', () => {
    const detector = new PeakDetector(48000, 100);
    
    detector.process(1);
    
    // Process some samples below peak
    for (let i = 0; i < 100; i++) {
      detector.process(0);
    }
    
    // Peak should still be held
    expect(detector.getPeak()).toBe(1);
  });

  it('should reset', () => {
    const detector = new PeakDetector(48000);
    
    detector.process(1);
    detector.reset();
    
    expect(detector.getPeak()).toBe(0);
  });
});

describe('RMSCalculator', () => {
  it('should calculate RMS', () => {
    const rms = new RMSCalculator(4);
    
    // Process constant signal
    rms.process(0.5);
    rms.process(0.5);
    rms.process(0.5);
    rms.process(0.5);
    
    expect(rms.getRMS()).toBeCloseTo(0.5);
  });

  it('should reset', () => {
    const rms = new RMSCalculator();
    
    rms.process(1);
    rms.reset();
    
    expect(rms.getRMS()).toBe(0);
  });
});

describe('CorrelationMeter', () => {
  it('should return 1 for identical signals', () => {
    const meter = new CorrelationMeter(48000);
    
    for (let i = 0; i < 1000; i++) {
      meter.process(0.5, 0.5);
    }
    
    expect(meter.getCorrelation()).toBeCloseTo(1, 1);
  });

  it('should return -1 for inverted signals', () => {
    const meter = new CorrelationMeter(48000);
    
    for (let i = 0; i < 1000; i++) {
      meter.process(0.5, -0.5);
    }
    
    expect(meter.getCorrelation()).toBeCloseTo(-1, 1);
  });

  it('should reset', () => {
    const meter = new CorrelationMeter(48000);
    
    meter.process(1, 1);
    meter.reset();
    
    expect(meter.getCorrelation()).toBe(0);
  });
});

describe('StereoMeterProcessor', () => {
  it('should provide stereo readings', () => {
    const meter = new StereoMeterProcessor(48000);
    
    for (let i = 0; i < 100; i++) {
      meter.process(0.5, 0.3);
    }
    
    const readings = meter.getReadings();
    
    expect(readings.left.peak).toBeGreaterThan(0);
    expect(readings.right.peak).toBeGreaterThan(0);
    expect(readings.left.peak).toBeGreaterThan(readings.right.peak);
  });

  it('should detect clipping', () => {
    const meter = new StereoMeterProcessor(48000);
    
    meter.process(1.5, 0.5);
    
    const readings = meter.getReadings();
    expect(readings.left.clip).toBe(true);
    expect(readings.right.clip).toBe(false);
  });

  it('should reset clips', () => {
    const meter = new StereoMeterProcessor(48000);
    
    meter.process(1.5, 1.5);
    meter.resetClip();
    
    const readings = meter.getReadings();
    expect(readings.left.clip).toBe(false);
  });
});

// ============================================================================
// CHANNEL STRIP TESTS
// ============================================================================

describe('ChannelStrip', () => {
  let strip: ChannelStrip;

  beforeEach(() => {
    const params: ChannelParams = {
      ...DEFAULT_CHANNEL,
      id: 'test',
      fader: 0,
      pan: 0,
    };
    strip = new ChannelStrip(params, DEFAULT_MIXER_CONFIG);
  });

  it('should process audio', () => {
    const result = strip.process(0.5, 0.5);
    
    // With -3db pan law at center, gain is sqrt(0.5) ≈ 0.707
    // So 0.5 * 0.707 ≈ 0.354
    expect(result.left).toBeCloseTo(0.5 * Math.SQRT1_2, 2);
    expect(result.right).toBeCloseTo(0.5 * Math.SQRT1_2, 2);
  });

  it('should apply mute', () => {
    strip.setParams({ mute: true });
    const result = strip.process(0.5, 0.5);
    
    expect(result.left).toBe(0);
    expect(result.right).toBe(0);
  });

  it('should apply pan', () => {
    strip.setParams({ pan: -1 }); // Full left
    const result = strip.process(0.5, 0.5);
    
    expect(result.left).toBeGreaterThan(result.right);
  });

  it('should apply phase invert', () => {
    strip.setParams({ phase: true });
    const result = strip.process(0.5, 0.5);
    
    expect(result.left).toBeLessThan(0);
    expect(result.right).toBeLessThan(0);
  });

  it('should report meter readings', () => {
    strip.process(0.5, 0.5);
    const meter = strip.getMeter();
    
    expect(meter.left.peak).toBeGreaterThan(0);
  });

  it('should respect solo override', () => {
    strip.setSoloOverride(true); // Other channels are soloed
    const result = strip.process(0.5, 0.5);
    
    // Not soloed, so should be silent
    expect(result.left).toBe(0);
  });
});

// ============================================================================
// MIXER GRAPH TESTS
// ============================================================================

describe('buildMixerGraph', () => {
  it('should build graph from channels', () => {
    const channels: ChannelParams[] = [
      { ...DEFAULT_CHANNEL, id: 'track1', output: 'bus1' },
      { ...DEFAULT_CHANNEL, id: 'track2', output: 'bus1' },
      { ...DEFAULT_CHANNEL, id: 'bus1', type: 'bus', output: 'master' },
      { ...DEFAULT_CHANNEL, id: 'master', type: 'master', output: '' },
    ];
    
    const graph = buildMixerGraph(channels);
    
    expect(graph).toHaveLength(4);
    
    const bus1 = graph.find(n => n.id === 'bus1');
    expect(bus1?.inputs).toContain('track1');
    expect(bus1?.inputs).toContain('track2');
  });
});

describe('sortChannelsForProcessing', () => {
  it('should sort channels in processing order', () => {
    const channels: ChannelParams[] = [
      { ...DEFAULT_CHANNEL, id: 'master', type: 'master', output: '' },
      { ...DEFAULT_CHANNEL, id: 'track1', output: 'master' },
      { ...DEFAULT_CHANNEL, id: 'track2', output: 'master' },
    ];
    
    const sorted = sortChannelsForProcessing(channels);
    
    // Master should be last (processes inputs first)
    expect(sorted[sorted.length - 1]!.id).toBe('master');
  });

  it('should handle multi-level routing', () => {
    const channels: ChannelParams[] = [
      { ...DEFAULT_CHANNEL, id: 'master', type: 'master', output: '' },
      { ...DEFAULT_CHANNEL, id: 'bus', type: 'bus', output: 'master' },
      { ...DEFAULT_CHANNEL, id: 'track', output: 'bus' },
    ];
    
    const sorted = sortChannelsForProcessing(channels);
    const ids = sorted.map(c => c.id);
    
    // Track before bus, bus before master
    expect(ids.indexOf('track')).toBeLessThan(ids.indexOf('bus'));
    expect(ids.indexOf('bus')).toBeLessThan(ids.indexOf('master'));
  });
});

describe('validateMixerRouting', () => {
  it('should accept valid routing', () => {
    const channels: ChannelParams[] = [
      { ...DEFAULT_CHANNEL, id: 'master', type: 'master', output: '' },
      { ...DEFAULT_CHANNEL, id: 'track', output: 'master' },
    ];
    
    const result = validateMixerRouting(channels);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect non-existent output', () => {
    const channels: ChannelParams[] = [
      { ...DEFAULT_CHANNEL, id: 'track', output: 'nonexistent' },
    ];
    
    const result = validateMixerRouting(channels);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should detect self-routing', () => {
    const channels: ChannelParams[] = [
      { ...DEFAULT_CHANNEL, id: 'track', output: 'track' },
    ];
    
    const result = validateMixerRouting(channels);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('itself'))).toBe(true);
  });
});

// ============================================================================
// MIXER PROCESSOR TESTS
// ============================================================================

describe('MixerProcessor', () => {
  let mixer: MixerProcessor;

  beforeEach(() => {
    mixer = new MixerProcessor();
    mixer.addChannel({
      ...DEFAULT_CHANNEL,
      id: 'master',
      type: 'master',
      output: '',
    });
  });

  it('should add channels', () => {
    mixer.addChannel({
      ...DEFAULT_CHANNEL,
      id: 'track1',
      output: 'master',
    });
    
    expect(mixer.getChannel('track1')).toBeDefined();
  });

  it('should remove channels', () => {
    mixer.addChannel({
      ...DEFAULT_CHANNEL,
      id: 'track1',
      output: 'master',
    });
    
    expect(mixer.removeChannel('track1')).toBe(true);
    expect(mixer.getChannel('track1')).toBeUndefined();
  });

  it('should update channels', () => {
    mixer.addChannel({
      ...DEFAULT_CHANNEL,
      id: 'track1',
      output: 'master',
    });
    
    mixer.updateChannel('track1', { fader: -6 });
    
    const strip = mixer.getChannel('track1');
    expect(strip?.getParams().fader).toBe(-6);
  });

  it('should process audio', () => {
    mixer.addChannel({
      ...DEFAULT_CHANNEL,
      id: 'track1',
      output: 'master',
    });
    
    const inputs = new Map([
      ['track1', {
        left: new Float32Array([0.5, 0.5, 0.5]),
        right: new Float32Array([0.5, 0.5, 0.5]),
      }],
    ]);
    
    const output = mixer.process(inputs, 3);
    
    expect(output.left.length).toBe(3);
    expect(output.right.length).toBe(3);
  });

  it('should get all meters', () => {
    mixer.addChannel({
      ...DEFAULT_CHANNEL,
      id: 'track1',
      output: 'master',
    });
    
    const meters = mixer.getAllMeters();
    
    expect(meters.has('master')).toBe(true);
    expect(meters.has('track1')).toBe(true);
  });

  it('should add sends', () => {
    mixer.addChannel({
      ...DEFAULT_CHANNEL,
      id: 'aux',
      type: 'aux',
      output: 'master',
    });
    
    mixer.addSend('track1', {
      id: 'send1',
      targetBus: 'aux',
      level: -6,
      type: 'post-fader',
      enabled: true,
    });
    
    // Send should be added without error
    expect(mixer.removeSend('track1', 'send1')).toBe(true);
  });
});

// ============================================================================
// MIXER STATE TESTS
// ============================================================================

describe('createMixerState', () => {
  it('should create default state', () => {
    const state = createMixerState();
    
    expect(state.config.sampleRate).toBe(48000);
    expect(state.channels).toHaveLength(1);
    expect(state.channels[0]!.id).toBe('master');
    expect(state.solo).toHaveLength(0);
  });

  it('should apply custom config', () => {
    const state = createMixerState({ panLaw: '-6db' });
    
    expect(state.config.panLaw).toBe('-6db');
  });
});

// ============================================================================
// DEFAULTS TESTS
// ============================================================================

describe('Default configurations', () => {
  it('should have valid DEFAULT_CHANNEL', () => {
    expect(DEFAULT_CHANNEL.type).toBe('audio');
    expect(DEFAULT_CHANNEL.fader).toBe(0);
    expect(DEFAULT_CHANNEL.pan).toBe(0);
    expect(DEFAULT_CHANNEL.mute).toBe(false);
    expect(DEFAULT_CHANNEL.output).toBe('master');
  });

  it('should have valid DEFAULT_MIXER_CONFIG', () => {
    expect(DEFAULT_MIXER_CONFIG.sampleRate).toBe(48000);
    expect(DEFAULT_MIXER_CONFIG.panLaw).toBe('-3db');
    expect(DEFAULT_MIXER_CONFIG.soloDefeat).toBe(false);
  });
});
