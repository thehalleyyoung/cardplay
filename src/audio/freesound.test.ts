/**
 * @fileoverview Tests for Freesound API Integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseNoteName,
  midiToNoteName,
  detectNoteFromFilename,
  detectVelocityFromFilename,
  detectRoundRobinFromFilename,
  organizeSamples,
  findBestSampleForNote,
  generateKeyboardMapping,
  buildApiUrl,
  FREESOUND_API_TOKEN,
  INSTRUMENT_SEARCH_TERMS,
  type FreesoundSample,
  type SamplePack,
  type OrganizedSample,
} from './freesound';

// ============================================================================
// NOTE PARSING TESTS
// ============================================================================

describe('parseNoteName', () => {
  it('parses standard note names', () => {
    expect(parseNoteName('C4')).toBe(60);
    expect(parseNoteName('A4')).toBe(69);
    expect(parseNoteName('C5')).toBe(72);
    expect(parseNoteName('C3')).toBe(48);
    expect(parseNoteName('C0')).toBe(12);
    expect(parseNoteName('C-1')).toBe(0);
  });

  it('parses sharps and flats', () => {
    expect(parseNoteName('C#4')).toBe(61);
    expect(parseNoteName('Db4')).toBe(61);
    expect(parseNoteName('F#3')).toBe(54);
    expect(parseNoteName('Bb2')).toBe(46);
    expect(parseNoteName('A#4')).toBe(70);
  });

  it('handles lowercase notes', () => {
    expect(parseNoteName('c4')).toBe(60);
    expect(parseNoteName('a4')).toBe(69);
    expect(parseNoteName('f#3')).toBe(54);
  });

  it('returns null for invalid notes', () => {
    expect(parseNoteName('')).toBeNull();
    expect(parseNoteName('X4')).toBeNull();
    expect(parseNoteName('C')).toBeNull();
    expect(parseNoteName('4')).toBeNull();
    expect(parseNoteName('C4C4')).toBeNull();
  });
});

describe('midiToNoteName', () => {
  it('converts MIDI note to name', () => {
    expect(midiToNoteName(60)).toBe('C4');
    expect(midiToNoteName(69)).toBe('A4');
    expect(midiToNoteName(72)).toBe('C5');
    expect(midiToNoteName(48)).toBe('C3');
    expect(midiToNoteName(0)).toBe('C-1');
    expect(midiToNoteName(127)).toBe('G9');
  });

  it('handles all chromatic notes', () => {
    expect(midiToNoteName(61)).toBe('C#4');
    expect(midiToNoteName(62)).toBe('D4');
    expect(midiToNoteName(63)).toBe('D#4');
    expect(midiToNoteName(64)).toBe('E4');
    expect(midiToNoteName(65)).toBe('F4');
    expect(midiToNoteName(66)).toBe('F#4');
    expect(midiToNoteName(67)).toBe('G4');
    expect(midiToNoteName(68)).toBe('G#4');
    expect(midiToNoteName(70)).toBe('A#4');
    expect(midiToNoteName(71)).toBe('B4');
  });
});

// ============================================================================
// FILENAME DETECTION TESTS
// ============================================================================

describe('detectNoteFromFilename', () => {
  it('detects notes with underscores', () => {
    const result = detectNoteFromFilename('violin_C4_mf.wav');
    expect(result).not.toBeNull();
    expect(result!.note).toBe(60);
    expect(result!.confidence).toBeGreaterThan(0.9);
  });

  it('detects notes with dashes', () => {
    const result = detectNoteFromFilename('piano-A#3-loud.wav');
    expect(result).not.toBeNull();
    expect(result!.note).toBe(58);
  });

  it('detects notes with spaces', () => {
    const result = detectNoteFromFilename('cello Bb2 soft.wav');
    expect(result).not.toBeNull();
    expect(result!.note).toBe(46);
  });

  it('detects notes at start of filename', () => {
    const result = detectNoteFromFilename('C5_piano.wav');
    expect(result).not.toBeNull();
    expect(result!.note).toBe(72);
  });

  it('detects MIDI note numbers', () => {
    const result = detectNoteFromFilename('piano_60_velocity100.wav');
    expect(result).not.toBeNull();
    expect(result!.note).toBe(60);
    expect(result!.confidence).toBeLessThan(0.9); // Lower confidence for number detection
  });

  it('returns null when no note found', () => {
    expect(detectNoteFromFilename('random_sample.wav')).toBeNull();
    expect(detectNoteFromFilename('drum_loop.wav')).toBeNull();
    expect(detectNoteFromFilename('')).toBeNull();
  });
});

describe('detectVelocityFromFilename', () => {
  it('detects dynamics markers', () => {
    expect(detectVelocityFromFilename('violin_C4_pp.wav')).toBe(30);
    expect(detectVelocityFromFilename('violin_C4_p.wav')).toBe(50);
    expect(detectVelocityFromFilename('violin_C4_mp.wav')).toBe(70);
    expect(detectVelocityFromFilename('violin_C4_mf.wav')).toBe(85);
    expect(detectVelocityFromFilename('violin_C4_f.wav')).toBe(100);
    expect(detectVelocityFromFilename('violin_C4_ff.wav')).toBe(115);
    expect(detectVelocityFromFilename('violin_C4_fff.wav')).toBe(127);
  });

  it('detects velocity numbers', () => {
    expect(detectVelocityFromFilename('piano_C4_v100.wav')).toBe(100);
    expect(detectVelocityFromFilename('piano_C4_vel64.wav')).toBe(64);
    expect(detectVelocityFromFilename('piano_C4_velocity127.wav')).toBe(127);
  });

  it('detects layer numbers', () => {
    expect(detectVelocityFromFilename('piano_C4_layer1.wav')).toBe(16);
    expect(detectVelocityFromFilename('piano_C4_l4.wav')).toBe(64);
    expect(detectVelocityFromFilename('piano_C4_layer8.wav')).toBe(128);
  });

  it('returns default velocity when not found', () => {
    expect(detectVelocityFromFilename('violin_C4.wav')).toBe(100);
    expect(detectVelocityFromFilename('sample.wav')).toBe(100);
  });
});

describe('detectRoundRobinFromFilename', () => {
  it('detects RR patterns', () => {
    expect(detectRoundRobinFromFilename('piano_C4_rr1.wav')).toBe(0);
    expect(detectRoundRobinFromFilename('piano_C4_rr2.wav')).toBe(1);
    expect(detectRoundRobinFromFilename('piano_C4_rr_3.wav')).toBe(2);
    expect(detectRoundRobinFromFilename('piano_C4_round-robin-4.wav')).toBe(3);
  });

  it('detects variation patterns', () => {
    expect(detectRoundRobinFromFilename('piano_C4_var1.wav')).toBe(0);
    expect(detectRoundRobinFromFilename('piano_C4_variation_2.wav')).toBe(1);
  });

  it('detects simple suffix numbers', () => {
    expect(detectRoundRobinFromFilename('piano_C4_1.wav')).toBe(0);
    expect(detectRoundRobinFromFilename('piano_C4_2.wav')).toBe(1);
    expect(detectRoundRobinFromFilename('piano_C4_3.wav')).toBe(2);
  });

  it('returns 0 when not found', () => {
    expect(detectRoundRobinFromFilename('piano_C4.wav')).toBe(0);
    expect(detectRoundRobinFromFilename('sample.wav')).toBe(0);
  });
});

// ============================================================================
// SAMPLE ORGANIZATION TESTS
// ============================================================================

describe('organizeSamples', () => {
  const createMockSample = (
    id: number,
    name: string,
    midiNote?: number
  ): FreesoundSample => ({
    id,
    name,
    tags: [],
    username: 'test',
    url: `https://freesound.org/s/${id}`,
    previews: {
      'preview-hq-mp3': `https://freesound.org/preview/${id}.mp3`,
    },
    license: 'Creative Commons 0',
    duration: 1.5,
    ac_analysis: midiNote !== undefined ? {
      ac_note_midi: midiNote,
      ac_note_name: midiToNoteName(midiNote),
    } : undefined,
  });

  it('organizes samples with pitch analysis', () => {
    const samples = [
      createMockSample(1, 'violin_C4.wav', 60),
      createMockSample(2, 'violin_D4.wav', 62),
      createMockSample(3, 'violin_E4.wav', 64),
    ];

    const pack = organizeSamples(samples, 'violin');

    expect(pack.name).toBe('violin Pack');
    expect(pack.instrument).toBe('violin');
    expect(pack.samples.length).toBe(3);
    expect(pack.pitchRange.low).toBe(60);
    expect(pack.pitchRange.high).toBe(64);
  });

  it('sorts samples by pitch', () => {
    const samples = [
      createMockSample(1, 'violin_E4.wav', 64),
      createMockSample(2, 'violin_C4.wav', 60),
      createMockSample(3, 'violin_D4.wav', 62),
    ];

    const pack = organizeSamples(samples, 'violin');

    expect(pack.samples[0].midiNote).toBe(60);
    expect(pack.samples[1].midiNote).toBe(62);
    expect(pack.samples[2].midiNote).toBe(64);
  });

  it('detects velocity from filenames', () => {
    const samples = [
      createMockSample(1, 'violin_C4_pp.wav', 60),
      createMockSample(2, 'violin_C4_mf.wav', 60),
      createMockSample(3, 'violin_C4_ff.wav', 60),
    ];

    const pack = organizeSamples(samples, 'violin');

    expect(pack.samples.some(s => s.velocity === 30)).toBe(true); // pp
    expect(pack.samples.some(s => s.velocity === 85)).toBe(true); // mf
    expect(pack.samples.some(s => s.velocity === 115)).toBe(true); // ff
    expect(pack.velocityLayers).toBeGreaterThan(1);
  });

  it('skips samples without pitch', () => {
    const samples = [
      createMockSample(1, 'random_noise.wav'), // No pitch
      createMockSample(2, 'violin_C4.wav', 60),
    ];

    const pack = organizeSamples(samples, 'violin');

    expect(pack.samples.length).toBe(1);
    expect(pack.samples[0].midiNote).toBe(60);
  });

  it('calculates fine tune from fractional MIDI note', () => {
    const samples: FreesoundSample[] = [{
      id: 1,
      name: 'detuned.wav',
      tags: [],
      username: 'test',
      url: 'https://freesound.org/s/1',
      previews: { 'preview-hq-mp3': 'test.mp3' },
      license: 'Creative Commons 0',
      ac_analysis: {
        ac_note_midi: 60.25, // 25 cents sharp
      },
    }];

    const pack = organizeSamples(samples, 'test');

    expect(pack.samples.length).toBe(1);
    expect(pack.samples[0].midiNote).toBe(60);
    expect(pack.samples[0].fineTuneCents).toBe(25);
  });
});

// ============================================================================
// KEYBOARD MAPPING TESTS
// ============================================================================

describe('findBestSampleForNote', () => {
  const createPack = (notes: number[]): SamplePack => ({
    name: 'Test Pack',
    instrument: 'test',
    samples: notes.map((note, i) => ({
      freesoundId: i,
      name: `sample_${note}.wav`,
      previewUrl: 'test.mp3',
      midiNote: note,
      midiNoteConfidence: 0.95,
      velocity: 100,
      roundRobinIndex: 0,
      fineTuneCents: 0,
      duration: 1,
    })),
    pitchRange: { low: Math.min(...notes), high: Math.max(...notes) },
    velocityLayers: 1,
    roundRobinCount: 1,
  });

  it('finds exact match', () => {
    const pack = createPack([48, 60, 72]);
    const result = findBestSampleForNote(pack, 60, 100);

    expect(result).not.toBeNull();
    expect(result!.midiNote).toBe(60);
  });

  it('finds nearest sample when no exact match', () => {
    const pack = createPack([48, 60, 72]);
    const result = findBestSampleForNote(pack, 62, 100);

    expect(result).not.toBeNull();
    expect(result!.midiNote).toBe(60); // Prefers lower (pitch up)
  });

  it('prefers pitching up over pitching down', () => {
    const pack = createPack([58, 62]); // Target 60 is equidistant
    const result = findBestSampleForNote(pack, 60, 100);

    expect(result).not.toBeNull();
    expect(result!.midiNote).toBe(58); // Lower sample, pitch up
  });

  it('returns null when no samples', () => {
    const pack: SamplePack = {
      name: 'Empty',
      instrument: 'test',
      samples: [],
      pitchRange: { low: 60, high: 60 },
      velocityLayers: 0,
      roundRobinCount: 0,
    };

    expect(findBestSampleForNote(pack, 60, 100)).toBeNull();
  });
});

describe('generateKeyboardMapping', () => {
  const createPack = (notes: number[]): SamplePack => ({
    name: 'Test Pack',
    instrument: 'test',
    samples: notes.map((note, i) => ({
      freesoundId: i,
      name: `sample_${note}.wav`,
      previewUrl: 'test.mp3',
      midiNote: note,
      midiNoteConfidence: 0.95,
      velocity: 100,
      roundRobinIndex: 0,
      fineTuneCents: 0,
      duration: 1,
    })),
    pitchRange: { low: Math.min(...notes), high: Math.max(...notes) },
    velocityLayers: 1,
    roundRobinCount: 1,
  });

  it('creates mapping for full range', () => {
    const pack = createPack([48, 60, 72]);
    const mapping = generateKeyboardMapping(pack, {
      lowNote: 36,
      highNote: 84,
      maxPitchShift: 12,
    });

    expect(mapping.size).toBeGreaterThan(0);
    expect(mapping.has(48)).toBe(true);
    expect(mapping.has(60)).toBe(true);
    expect(mapping.has(72)).toBe(true);
  });

  it('calculates pitch shift', () => {
    const pack = createPack([60]);
    const mapping = generateKeyboardMapping(pack, {
      lowNote: 48,
      highNote: 72,
      maxPitchShift: 12,
    });

    // Should map notes 48-72 to the single sample at 60
    expect(mapping.get(60)?.pitchShiftSemitones).toBe(0);
    expect(mapping.get(55)?.pitchShiftSemitones).toBe(-5);
    expect(mapping.get(65)?.pitchShiftSemitones).toBe(5);
  });

  it('respects max pitch shift', () => {
    const pack = createPack([60]);
    const mapping = generateKeyboardMapping(pack, {
      lowNote: 21,
      highNote: 108,
      maxPitchShift: 7, // Only ±7 semitones
    });

    // Notes outside the range shouldn't be mapped
    expect(mapping.has(52)).toBe(false); // Too far down
    expect(mapping.has(68)).toBe(false); // Too far up
    expect(mapping.has(53)).toBe(true);  // Just in range
    expect(mapping.has(67)).toBe(true);  // Just in range
  });
});

// ============================================================================
// API URL BUILDING TESTS
// ============================================================================

describe('buildApiUrl', () => {
  it('builds URL with token', () => {
    const url = buildApiUrl('/search/text/', { query: 'piano' });
    
    expect(url).toContain('https://freesound.org/apiv2/search/text/');
    expect(url).toContain('query=piano');
    expect(url).toContain(`token=${FREESOUND_API_TOKEN}`);
  });

  it('handles multiple parameters', () => {
    const url = buildApiUrl('/sounds/123/', {
      query: 'test',
      page: 1,
      page_size: 15,
    });

    expect(url).toContain('query=test');
    expect(url).toContain('page=1');
    expect(url).toContain('page_size=15');
  });

  it('skips undefined parameters', () => {
    const url = buildApiUrl('/search/text/', {
      query: 'piano',
      filter: undefined,
    });

    expect(url).toContain('query=piano');
    expect(url).not.toContain('filter=');
  });
});

// ============================================================================
// INSTRUMENT SEARCH TERMS TESTS
// ============================================================================

describe('INSTRUMENT_SEARCH_TERMS', () => {
  it('has search terms for common instruments', () => {
    expect(INSTRUMENT_SEARCH_TERMS.violin).toContain('violin');
    expect(INSTRUMENT_SEARCH_TERMS.piano).toContain('piano');
    expect(INSTRUMENT_SEARCH_TERMS.guitar).toContain('guitar');
    expect(INSTRUMENT_SEARCH_TERMS.drums).toContain('drums');
    expect(INSTRUMENT_SEARCH_TERMS.trumpet).toContain('trumpet');
  });

  it('includes alternative terms', () => {
    expect(INSTRUMENT_SEARCH_TERMS.violin).toContain('fiddle');
    expect(INSTRUMENT_SEARCH_TERMS.cello).toContain('violoncello');
    expect(INSTRUMENT_SEARCH_TERMS['french-horn']).toContain('horn');
  });
});
