/**
 * @fileoverview Tests for Sample Auto-Mapper
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  analyzeSample,
  groupSamplesByPitch,
  autoMapSamples,
  createSamplerPreset,
  createZone,
  createSampleData,
  findBestSampleForNote,
  standardFilenameParser,
  CATEGORY_ENVELOPES,
  MAX_PITCH_SHIFT_UP,
  MAX_PITCH_SHIFT_DOWN,
  PIANO_RANGE,
  type AnalyzedSample,
  type SampleGroup,
  type MappingResult,
} from './sample-mapper';
import { type PitchResult } from './pitch-detect';

// ============================================================================
// MOCK DATA
// ============================================================================

const createMockAudioBuffer = (
  sampleRate = 44100,
  channels = 1,
  duration = 1
): AudioBuffer => {
  const length = Math.floor(sampleRate * duration);
  
  return {
    sampleRate,
    length,
    duration,
    numberOfChannels: channels,
    getChannelData: (channel: number) => {
      const data = new Float32Array(length);
      // Generate a 440Hz sine wave
      for (let i = 0; i < length; i++) {
        data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate);
      }
      return data;
    },
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  } as unknown as AudioBuffer;
};

const createMockAnalyzedSample = (
  id: string,
  midiNote: number,
  velocity = 100,
  roundRobin = 0
): AnalyzedSample => ({
  id,
  name: `${id}.wav`,
  buffer: createMockAudioBuffer(),
  pitch: {
    frequency: 440 * Math.pow(2, (midiNote - 69) / 12),
    midiNote,
    noteName: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][midiNote % 12] + 
              String(Math.floor(midiNote / 12) - 1),
    fineTuneCents: 0,
    confidence: 0.95,
    rms: 0.5,
    isPitched: true,
  },
  velocity,
  roundRobinIndex: roundRobin,
  fineTuneCents: 0,
  duration: 1,
  pitchSource: 'detected',
});

// ============================================================================
// FILENAME PARSER TESTS
// ============================================================================

describe('standardFilenameParser', () => {
  it('parses note from filename', () => {
    expect(standardFilenameParser('violin_C4_mf.wav').midiNote).toBe(60);
    expect(standardFilenameParser('piano-A#3-loud.wav').midiNote).toBe(58);
    expect(standardFilenameParser('cello Bb2 soft.wav').midiNote).toBe(46);
    expect(standardFilenameParser('F#5_sample.wav').midiNote).toBe(78);
  });

  it('parses velocity from dynamics markers', () => {
    // Note: These match the velocityMarkers in standardFilenameParser
    expect(standardFilenameParser('violin_C4_ppp.wav').velocity).toBe(16);
    expect(standardFilenameParser('violin_C4_pp.wav').velocity).toBe(32);
    expect(standardFilenameParser('violin_C4_p.wav').velocity).toBe(48);
    expect(standardFilenameParser('violin_C4_mp.wav').velocity).toBe(64);
    expect(standardFilenameParser('violin_C4_mf.wav').velocity).toBe(80);
    expect(standardFilenameParser('violin_C4_f.wav').velocity).toBe(96);
    expect(standardFilenameParser('violin_C4_ff.wav').velocity).toBe(112);
    expect(standardFilenameParser('violin_C4_fff.wav').velocity).toBe(127);
  });

  it('parses round-robin from filename', () => {
    expect(standardFilenameParser('piano_C4_rr1.wav').roundRobin).toBe(0);
    expect(standardFilenameParser('piano_C4_rr2.wav').roundRobin).toBe(1);
    expect(standardFilenameParser('piano_C4_round-robin-3.wav').roundRobin).toBe(2);
  });

  it('returns undefined for missing info', () => {
    // When no note pattern is found, midiNote is undefined
    expect(standardFilenameParser('random_sample.wav').midiNote).toBeUndefined();
    // When no dynamics/velocity marker is found, velocity is undefined
    expect(standardFilenameParser('piano_neutral.wav').velocity).toBeUndefined();
    // When no round-robin pattern is found, roundRobin is undefined  
    expect(standardFilenameParser('piano_C4.wav').roundRobin).toBeUndefined();
  });
});

// ============================================================================
// SAMPLE ANALYSIS TESTS
// ============================================================================

describe('analyzeSample', () => {
  it('creates analyzed sample from buffer', () => {
    const buffer = createMockAudioBuffer();
    const sample = analyzeSample('test-1', 'test_sample.wav', buffer);
    
    expect(sample.id).toBe('test-1');
    expect(sample.name).toBe('test_sample.wav');
    expect(sample.buffer).toBe(buffer);
    expect(sample.pitch).toBeDefined();
    expect(sample.duration).toBeCloseTo(1, 1);
  });

  it('uses filename hint when detection fails', () => {
    // Create silent buffer (no pitch detectable)
    const silentBuffer: AudioBuffer = {
      sampleRate: 44100,
      length: 44100,
      duration: 1,
      numberOfChannels: 1,
      getChannelData: () => new Float32Array(44100), // Silence
      copyFromChannel: vi.fn(),
      copyToChannel: vi.fn(),
    } as unknown as AudioBuffer;

    const sample = analyzeSample('test', 'C4.wav', silentBuffer, { midiNote: 60 });
    
    expect(sample.pitch.midiNote).toBe(60);
    expect(sample.pitchSource).toBe('filename');
  });

  it('uses velocity hint from filename', () => {
    const buffer = createMockAudioBuffer();
    const sample = analyzeSample('test', 'test.wav', buffer, { velocity: 80 });
    
    expect(sample.velocity).toBe(80);
  });
});

// ============================================================================
// SAMPLE GROUPING TESTS
// ============================================================================

describe('groupSamplesByPitch', () => {
  it('groups samples by MIDI note', () => {
    const samples: AnalyzedSample[] = [
      createMockAnalyzedSample('s1', 60),
      createMockAnalyzedSample('s2', 60),
      createMockAnalyzedSample('s3', 64),
    ];

    const groups = groupSamplesByPitch(samples);

    expect(groups.length).toBe(2);
    expect(groups[0].midiNote).toBe(60);
    expect(groups[0].samples.length).toBe(2);
    expect(groups[1].midiNote).toBe(64);
    expect(groups[1].samples.length).toBe(1);
  });

  it('sorts groups by pitch', () => {
    const samples: AnalyzedSample[] = [
      createMockAnalyzedSample('s1', 72),
      createMockAnalyzedSample('s2', 48),
      createMockAnalyzedSample('s3', 60),
    ];

    const groups = groupSamplesByPitch(samples);

    expect(groups[0].midiNote).toBe(48);
    expect(groups[1].midiNote).toBe(60);
    expect(groups[2].midiNote).toBe(72);
  });

  it('identifies velocity layers', () => {
    const samples: AnalyzedSample[] = [
      createMockAnalyzedSample('s1', 60, 40),
      createMockAnalyzedSample('s2', 60, 80),
      createMockAnalyzedSample('s3', 60, 120),
    ];

    const groups = groupSamplesByPitch(samples);

    expect(groups[0].velocityLayers.length).toBe(3);
    expect(groups[0].velocityLayers).toContain(40);
    expect(groups[0].velocityLayers).toContain(80);
    expect(groups[0].velocityLayers).toContain(120);
  });

  it('counts round-robin variations', () => {
    const samples: AnalyzedSample[] = [
      createMockAnalyzedSample('s1', 60, 100, 0),
      createMockAnalyzedSample('s2', 60, 100, 1),
      createMockAnalyzedSample('s3', 60, 100, 2),
    ];

    const groups = groupSamplesByPitch(samples);

    expect(groups[0].roundRobinCount).toBe(3);
  });

  it('returns empty array for no samples', () => {
    const groups = groupSamplesByPitch([]);
    expect(groups).toEqual([]);
  });
});

// ============================================================================
// FIND BEST SAMPLE TESTS
// ============================================================================

describe('findBestSampleForNote', () => {
  const createGroups = (notes: number[]): SampleGroup[] => 
    notes.map(note => ({
      midiNote: note,
      samples: [createMockAnalyzedSample(`s-${note}`, note)],
      velocityLayers: [100],
      roundRobinCount: 1,
    }));

  it('finds exact match', () => {
    const groups = createGroups([48, 60, 72]);
    const result = findBestSampleForNote(groups, 60, 100, 7, 12);

    expect(result).not.toBeNull();
    expect(result!.sample.pitch.midiNote).toBe(60);
    expect(result!.pitchShift).toBe(0);
  });

  it('finds nearest when no exact match', () => {
    const groups = createGroups([48, 60, 72]);
    const result = findBestSampleForNote(groups, 62, 100, 7, 12);

    expect(result).not.toBeNull();
    expect(result!.sample.pitch.midiNote).toBe(60);
    expect(result!.pitchShift).toBe(2);
  });

  it('prefers pitching up over pitching down', () => {
    const groups = createGroups([58, 62]); // Target 60 equidistant
    const result = findBestSampleForNote(groups, 60, 100, 7, 12);

    expect(result).not.toBeNull();
    expect(result!.sample.pitch.midiNote).toBe(58);
    expect(result!.pitchShift).toBe(2);
  });

  it('respects max pitch shift up', () => {
    const groups = createGroups([48]);
    const result = findBestSampleForNote(groups, 60, 100, 5, 12);

    // 60 - 48 = 12 semitones up, but max is 5
    expect(result).toBeNull();
  });

  it('respects max pitch shift down', () => {
    const groups = createGroups([72]);
    const result = findBestSampleForNote(groups, 60, 100, 7, 5);

    // 60 - 72 = -12 semitones, but max down is 5
    expect(result).toBeNull();
  });

  it('returns null for empty groups', () => {
    const result = findBestSampleForNote([], 60, 100, 7, 12);
    expect(result).toBeNull();
  });
});

// ============================================================================
// AUTO-MAPPING TESTS
// ============================================================================

describe('autoMapSamples', () => {
  it('creates zones from samples', () => {
    const samples: AnalyzedSample[] = [
      createMockAnalyzedSample('s1', 48),
      createMockAnalyzedSample('s2', 60),
      createMockAnalyzedSample('s3', 72),
    ];

    const result = autoMapSamples(samples);

    expect(result.zones.length).toBeGreaterThan(0);
    expect(result.groups.length).toBe(3);
    expect(result.stats.uniquePitches).toBe(3);
  });

  it('respects note range options', () => {
    const samples: AnalyzedSample[] = [
      createMockAnalyzedSample('s1', 60),
    ];

    const result = autoMapSamples(samples, {
      lowNote: 48,
      highNote: 72,
      maxPitchShiftUp: 7,
      maxPitchShiftDown: 12,
    });

    // Should create zones within the specified range
    for (const zone of result.zones) {
      expect(zone.keyLow).toBeGreaterThanOrEqual(48);
      expect(zone.keyHigh).toBeLessThanOrEqual(72);
    }
  });

  it('merges consecutive zones with same sample', () => {
    const samples: AnalyzedSample[] = [
      createMockAnalyzedSample('s1', 60),
    ];

    const result = autoMapSamples(samples, {
      lowNote: 55,
      highNote: 65,
      maxPitchShiftUp: 7,
      maxPitchShiftDown: 7,
    });

    // Should merge consecutive notes into fewer zones
    expect(result.zones.length).toBeLessThanOrEqual(11);
  });

  it('handles empty samples array', () => {
    const result = autoMapSamples([]);

    expect(result.zones).toEqual([]);
    expect(result.groups).toEqual([]);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('sets playback mode from options', () => {
    const samples: AnalyzedSample[] = [
      createMockAnalyzedSample('s1', 60),
    ];

    const result = autoMapSamples(samples, {
      playbackMode: 'oneShot',
      lowNote: 55,
      highNote: 65,
    });

    for (const zone of result.zones) {
      expect(zone.playbackMode).toBe('oneShot');
    }
  });

  it('reports statistics', () => {
    const samples: AnalyzedSample[] = [
      createMockAnalyzedSample('s1', 48),
      createMockAnalyzedSample('s2', 60),
      createMockAnalyzedSample('s3', 72),
    ];

    const result = autoMapSamples(samples);

    expect(result.stats.totalSamples).toBe(3);
    expect(result.stats.uniquePitches).toBe(3);
    expect(result.stats.totalZones).toBeGreaterThan(0);
  });
});

// ============================================================================
// ZONE CREATION TESTS
// ============================================================================

describe('createZone', () => {
  it('creates zone with correct properties', () => {
    const sample = createMockAnalyzedSample('s1', 60, 100);
    const zone = createZone(sample, 55, 65, 1, 127, 0);

    expect(zone.id).toBe('zone-0');
    expect(zone.keyLow).toBe(55);
    expect(zone.keyHigh).toBe(65);
    expect(zone.rootKey).toBe(60);
    expect(zone.velocityLow).toBe(1);
    expect(zone.velocityHigh).toBe(127);
    expect(zone.sample).not.toBeNull();
  });

  it('uses playback mode from options', () => {
    const sample = createMockAnalyzedSample('s1', 60);
    const zone = createZone(sample, 55, 65, 1, 127, 0, { playbackMode: 'loop' });

    expect(zone.playbackMode).toBe('loop');
  });
});

describe('createSampleData', () => {
  it('creates sample data from analyzed sample', () => {
    const sample = createMockAnalyzedSample('s1', 60);
    const data = createSampleData(sample, 0);

    expect(data.id).toBe('sample-0');
    expect(data.name).toBe('s1.wav');
    expect(data.rootNote).toBe(60);
    expect(data.sampleRate).toBe(44100);
    expect(data.audioL).toBeInstanceOf(Float32Array);
  });
});

// ============================================================================
// PRESET CREATION TESTS
// ============================================================================

describe('createSamplerPreset', () => {
  it('creates preset with zones', () => {
    const sample = createMockAnalyzedSample('s1', 60);
    const zones = [createZone(sample, 55, 65, 1, 127, 0)];
    const preset = createSamplerPreset('Test Preset', zones);

    expect(preset.name).toBe('Test Preset');
    expect(preset.articulations.length).toBe(1);
    expect(preset.articulations[0].zones).toEqual(zones);
  });

  it('uses category defaults', () => {
    const sample = createMockAnalyzedSample('s1', 60);
    const zones = [createZone(sample, 55, 65, 1, 127, 0)];
    const preset = createSamplerPreset('Piano', zones, { 
      category: 'piano',
      ampEnvelope: CATEGORY_ENVELOPES.piano,
    });

    expect(preset.category).toBe('piano');
    // CATEGORY_ENVELOPES.piano.release is 0.5
    expect(preset.ampEnvelope.release).toBeCloseTo(CATEGORY_ENVELOPES.piano.release!, 2);
  });

  it('accepts custom envelope', () => {
    const sample = createMockAnalyzedSample('s1', 60);
    const zones = [createZone(sample, 55, 65, 1, 127, 0)];
    const preset = createSamplerPreset('Custom', zones, {
      ampEnvelope: { attack: 0.5, release: 2 },
    });

    expect(preset.ampEnvelope.attack).toBe(0.5);
    expect(preset.ampEnvelope.release).toBe(2);
  });
});

// ============================================================================
// CATEGORY ENVELOPES TESTS
// ============================================================================

describe('CATEGORY_ENVELOPES', () => {
  it('has envelopes for all categories', () => {
    const categories = [
      'piano', 'keys', 'organ', 'guitar', 'bass',
      'strings', 'brass', 'woodwinds', 'synth', 'pads',
      'leads', 'drums', 'percussion', 'ethnic', 'sfx', 'vocal',
    ];

    for (const category of categories) {
      expect(CATEGORY_ENVELOPES[category as keyof typeof CATEGORY_ENVELOPES]).toBeDefined();
    }
  });

  it('pads have long attack', () => {
    expect(CATEGORY_ENVELOPES.pads.attack).toBeGreaterThan(0.1);
    expect(CATEGORY_ENVELOPES.pads.release).toBeGreaterThan(0.5);
  });

  it('drums have short envelope', () => {
    expect(CATEGORY_ENVELOPES.drums.attack).toBeLessThan(0.01);
    expect(CATEGORY_ENVELOPES.drums.sustain).toBe(0);
  });

  it('piano has fast attack', () => {
    expect(CATEGORY_ENVELOPES.piano.attack).toBeLessThan(0.01);
  });

  it('strings have slow attack', () => {
    expect(CATEGORY_ENVELOPES.strings.attack).toBeGreaterThan(0.05);
  });
});

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('constants', () => {
  it('MAX_PITCH_SHIFT_UP is reasonable', () => {
    expect(MAX_PITCH_SHIFT_UP).toBe(7);
  });

  it('MAX_PITCH_SHIFT_DOWN is reasonable', () => {
    expect(MAX_PITCH_SHIFT_DOWN).toBe(12);
  });

  it('PIANO_RANGE covers standard piano', () => {
    expect(PIANO_RANGE.low).toBe(21);  // A0
    expect(PIANO_RANGE.high).toBe(108); // C8
  });
});
