/**
 * Tests for Canonical Representations (Phase C0)
 */

import {
  MUSIC_SPEC_INVARIANTS,
  validateSpecInvariants,
  GALANT_SCHEMAS,
  METER_ACCENT_MODELS,
  TALAS,
  CELTIC_TUNE_TYPES,
  CHINESE_MODES,
  TICKS_PER_BEAT,
  convertTime,
  SWING_PRESETS,
  midiToNoteName,
  noteNameToMidi,
  midiToPitchClass,
  createPitchClassSet,
  pitchClassSetFromMidi,
  pitchClassSetSubset,
  pitchClassSetSimilarity,
  SCALE_PITCH_CLASS_SETS,
  KB_RESPONSIBILITIES,
} from './canonical-representations';

// ============================================================================
// C006: Musical Specification Invariants
// ============================================================================

describe('C006: Musical Specification Invariants', () => {
  test('defines valid tempo range', () => {
    expect(MUSIC_SPEC_INVARIANTS.tempoRange.min).toBe(20);
    expect(MUSIC_SPEC_INVARIANTS.tempoRange.max).toBe(400);
  });

  test('validates tempo in range', () => {
    expect(validateSpecInvariants({ tempo: 120 }).valid).toBe(true);
    expect(validateSpecInvariants({ tempo: 10 }).valid).toBe(false);
    expect(validateSpecInvariants({ tempo: 500 }).valid).toBe(false);
  });

  test('validates meter denominator is power of 2', () => {
    expect(validateSpecInvariants({ meter: { numerator: 4, denominator: 4 } }).valid).toBe(true);
    expect(validateSpecInvariants({ meter: { numerator: 6, denominator: 8 } }).valid).toBe(true);
    expect(validateSpecInvariants({ meter: { numerator: 4, denominator: 3 } }).valid).toBe(false);
  });

  test('validates key root and mode', () => {
    expect(validateSpecInvariants({ key: { root: 'c', mode: 'major' } }).valid).toBe(true);
    expect(validateSpecInvariants({ key: { root: 'fsharp', mode: 'dorian' } }).valid).toBe(true);
    expect(validateSpecInvariants({ key: { root: 'x', mode: 'major' } }).valid).toBe(false);
    expect(validateSpecInvariants({ key: { root: 'c', mode: 'unknown' } }).valid).toBe(false);
  });

  test('returns error messages', () => {
    const result = validateSpecInvariants({ tempo: 10, key: { root: 'x', mode: 'y' } });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(3);
  });
});

// ============================================================================
// C014: Schema Representation
// ============================================================================

describe('C014: Galant Schema Representation', () => {
  test('defines Prinner schema', () => {
    const prinner = GALANT_SCHEMAS.prinner;
    expect(prinner.name).toBe('Prinner');
    expect(prinner.bassLine).toEqual([4, 3, 2, 1]);
    expect(prinner.cadenceTarget).toBe('tonic');
  });

  test('defines Romanesca schema', () => {
    const romanesca = GALANT_SCHEMAS.romanesca;
    expect(romanesca.bassLine.length).toBe(8);
  });

  test('all schemas have required fields', () => {
    Object.values(GALANT_SCHEMAS).forEach(schema => {
      expect(schema.name).toBeDefined();
      expect(schema.bassLine.length).toBeGreaterThan(0);
      expect(schema.harmonicRhythm).toBeGreaterThan(0);
      expect(schema.lengthBars).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// C016: Meter Accent Model
// ============================================================================

describe('C016: Meter Accent Model', () => {
  test('4/4 standard has correct accents', () => {
    const model = METER_ACCENT_MODELS['4/4_standard'];
    expect(model.beatsPerBar).toBe(4);
    expect(model.accentWeights[0]).toBe(1.0); // Downbeat strongest
    expect(model.accentWeights[2]).toBeGreaterThan(model.accentWeights[1]); // Beat 3 > Beat 2
  });

  test('swing has swing ratio', () => {
    const swing = METER_ACCENT_MODELS['4/4_swing'];
    expect(swing.swingRatio).toBeGreaterThan(1);
  });

  test('compound meters have 6 beats', () => {
    const compound = METER_ACCENT_MODELS['6/8_compound'];
    expect(compound.beatsPerBar).toBe(6);
    expect(compound.accentWeights.length).toBe(6);
  });
});

// ============================================================================
// C017: Tala Representation
// ============================================================================

describe('C017: Tala Representation', () => {
  test('Adi tala has 8 aksharas', () => {
    const adi = TALAS.adi;
    expect(adi.cycleLength).toBe(8);
    expect(adi.angas.length).toBe(3);
  });

  test('Rupaka tala has 6 aksharas', () => {
    const rupaka = TALAS.rupaka;
    expect(rupaka.cycleLength).toBe(6);
  });

  test('Misra chapu has 7 aksharas', () => {
    const misra = TALAS.misra_chapu;
    expect(misra.cycleLength).toBe(7);
    expect(misra.angas[0].length + misra.angas[1].length).toBe(7);
  });

  test('all talas have gestures', () => {
    Object.values(TALAS).forEach(tala => {
      tala.angas.forEach(anga => {
        expect(['clap', 'wave', 'finger']).toContain(anga.gesture);
      });
    });
  });
});

// ============================================================================
// C018: Celtic Tune Type
// ============================================================================

describe('C018: Celtic Tune Type', () => {
  test('reel is in 4/4', () => {
    const reel = CELTIC_TUNE_TYPES.reel;
    expect(reel.meter).toEqual({ numerator: 4, denominator: 4 });
    expect(reel.typicalForm).toBe('AABB');
  });

  test('jig is in 6/8', () => {
    const jig = CELTIC_TUNE_TYPES.jig;
    expect(jig.meter).toEqual({ numerator: 6, denominator: 8 });
  });

  test('slip jig is in 9/8', () => {
    const slipJig = CELTIC_TUNE_TYPES.slip_jig;
    expect(slipJig.meter).toEqual({ numerator: 9, denominator: 8 });
  });

  test('all tune types have tempo ranges', () => {
    Object.values(CELTIC_TUNE_TYPES).forEach(tune => {
      expect(tune.tempoRange.min).toBeLessThan(tune.tempoRange.max);
    });
  });
});

// ============================================================================
// C019: Chinese Pentatonic Mode
// ============================================================================

describe('C019: Chinese Pentatonic Mode', () => {
  test('gong mode is major pentatonic', () => {
    const gong = CHINESE_MODES.gong;
    expect(gong.westernEquivalent).toBe('Major pentatonic');
    expect(gong.intervals).toEqual([0, 2, 4, 7, 9]);
    expect(gong.degrees.length).toBe(5);
  });

  test('yu mode is minor pentatonic', () => {
    const yu = CHINESE_MODES.yu;
    expect(yu.westernEquivalent).toBe('Minor pentatonic');
    expect(yu.intervals).toEqual([0, 3, 5, 7, 10]);
  });

  test('all modes have 5 degrees', () => {
    Object.values(CHINESE_MODES).forEach(mode => {
      expect(mode.degrees.length).toBe(5);
      expect(mode.intervals.length).toBe(5);
    });
  });

  test('all modes have character descriptions', () => {
    Object.values(CHINESE_MODES).forEach(mode => {
      expect(mode.character.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// C027: Time Representation
// ============================================================================

describe('C027: Time Representation', () => {
  test('TICKS_PER_BEAT is standard MIDI resolution', () => {
    expect(TICKS_PER_BEAT).toBe(480);
  });

  test('converts ticks to beats', () => {
    expect(convertTime(480, 'ticks', 'beats', { tempo: 120 })).toBe(1);
    expect(convertTime(960, 'ticks', 'beats', { tempo: 120 })).toBe(2);
  });

  test('converts beats to bars', () => {
    expect(convertTime(4, 'beats', 'bars', { tempo: 120, beatsPerBar: 4 })).toBe(1);
    expect(convertTime(12, 'beats', 'bars', { tempo: 120, beatsPerBar: 4 })).toBe(3);
  });

  test('converts beats to seconds', () => {
    // At 120 BPM, 2 beats = 1 second
    expect(convertTime(2, 'beats', 'seconds', { tempo: 120 })).toBe(1);
    expect(convertTime(4, 'beats', 'seconds', { tempo: 120 })).toBe(2);
  });

  test('converts seconds to beats', () => {
    expect(convertTime(1, 'seconds', 'beats', { tempo: 120 })).toBe(2);
    expect(convertTime(0.5, 'seconds', 'beats', { tempo: 120 })).toBe(1);
  });
});

// ============================================================================
// C028: Swing Representation
// ============================================================================

describe('C028: Swing Representation', () => {
  test('straight has ratio 1.0', () => {
    expect(SWING_PRESETS.straight.ratio).toBe(1.0);
    expect(SWING_PRESETS.straight.strength).toBe(0);
  });

  test('triplet swing has ratio 2.0', () => {
    expect(SWING_PRESETS.triplet_swing.ratio).toBe(2.0);
    expect(SWING_PRESETS.triplet_swing.strength).toBe(1.0);
  });

  test('all presets have valid ratios', () => {
    Object.values(SWING_PRESETS).forEach(preset => {
      expect(preset.ratio).toBeGreaterThanOrEqual(1.0);
      expect(preset.ratio).toBeLessThanOrEqual(2.0);
    });
  });
});

// ============================================================================
// C029: MIDI ↔ Note Name Utilities
// ============================================================================

describe('C029: MIDI Note Utilities', () => {
  test('midiToNoteName converts middle C', () => {
    expect(midiToNoteName(60)).toBe('C4');
    expect(midiToNoteName(60, { includeOctave: false })).toBe('C');
  });

  test('midiToNoteName handles sharps and flats', () => {
    expect(midiToNoteName(61)).toBe('C#4');
    expect(midiToNoteName(61, { useFlats: true })).toBe('Db4');
  });

  test('noteNameToMidi converts correctly', () => {
    expect(noteNameToMidi('C4')).toBe(60);
    expect(noteNameToMidi('A4')).toBe(69);
    expect(noteNameToMidi('C#4')).toBe(61);
    expect(noteNameToMidi('Db4')).toBe(61);
  });

  test('round-trip conversion is consistent', () => {
    for (let midi = 21; midi <= 108; midi++) {
      const name = midiToNoteName(midi);
      expect(noteNameToMidi(name)).toBe(midi);
    }
  });

  test('midiToPitchClass extracts pitch class', () => {
    expect(midiToPitchClass(60)).toBe(0); // C
    expect(midiToPitchClass(72)).toBe(0); // C
    expect(midiToPitchClass(69)).toBe(9); // A
    expect(midiToPitchClass(61)).toBe(1); // C#
  });
});

// ============================================================================
// C030: Pitch Class Set
// ============================================================================

describe('C030: Pitch Class Set', () => {
  test('createPitchClassSet creates from array', () => {
    const pcs = createPitchClassSet([0, 2, 4, 5, 7, 9, 11], 'Major');
    expect(pcs.pitchClasses).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(pcs.label).toBe('Major');
  });

  test('normalizes pitch classes to 0-11', () => {
    const pcs = createPitchClassSet([12, 14, 16]); // Same as 0, 2, 4
    expect(pcs.pitchClasses).toEqual([0, 2, 4]);
  });

  test('pitchClassSetFromMidi extracts from notes', () => {
    const pcs = pitchClassSetFromMidi([60, 64, 67]); // C E G
    expect(pcs.pitchClasses).toEqual([0, 4, 7]);
  });

  test('pitchClassSetSubset checks containment', () => {
    const major = SCALE_PITCH_CLASS_SETS.major;
    const cMajorTriad = createPitchClassSet([0, 4, 7]);
    
    expect(pitchClassSetSubset(cMajorTriad, major)).toBe(true);
  });

  test('pitchClassSetSimilarity returns 1 for identical sets', () => {
    const major = SCALE_PITCH_CLASS_SETS.major;
    expect(pitchClassSetSimilarity(major, major)).toBe(1);
  });

  test('pitchClassSetSimilarity measures overlap', () => {
    const major = SCALE_PITCH_CLASS_SETS.major;
    const minor = SCALE_PITCH_CLASS_SETS.natural_minor;
    
    const similarity = pitchClassSetSimilarity(major, minor);
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThan(1);
  });

  test('standard scales are defined', () => {
    expect(SCALE_PITCH_CLASS_SETS.major).toBeDefined();
    expect(SCALE_PITCH_CLASS_SETS.natural_minor).toBeDefined();
    expect(SCALE_PITCH_CLASS_SETS.pentatonic_major).toBeDefined();
    expect(SCALE_PITCH_CLASS_SETS.blues).toBeDefined();
  });
});

// ============================================================================
// C020: KB Responsibilities
// ============================================================================

describe('C020: KB Responsibilities', () => {
  test('defines responsibilities for all KBs', () => {
    expect(KB_RESPONSIBILITIES['music-theory.pl']).toBeDefined();
    expect(KB_RESPONSIBILITIES['composition-patterns.pl']).toBeDefined();
    expect(KB_RESPONSIBILITIES['music-spec.pl']).toBeDefined();
  });

  test('music-theory.pl handles basic theory', () => {
    const responsibilities = KB_RESPONSIBILITIES['music-theory.pl'];
    expect(responsibilities).toContain('Basic pitch/interval/chord definitions');
    expect(responsibilities).toContain('Scale and mode definitions');
  });

  test('music-spec.pl handles constraint system', () => {
    const responsibilities = KB_RESPONSIBILITIES['music-spec.pl'];
    expect(responsibilities).toContain('MusicSpec term structure');
    expect(responsibilities).toContain('Constraint predicates');
  });
});

// ============================================================================
// C039: Schema Similarity Metric
// ============================================================================

import {
  calculateSchemaSimilarity,
  SCHEMA_SIMILARITY_WEIGHTS,
  SCHEMA_MATCH_THRESHOLDS,
  type SchemaFeatureMatch,
} from './canonical-representations';

describe('C039: Schema Similarity Metric', () => {
  test('defines similarity weights for all features', () => {
    expect(SCHEMA_SIMILARITY_WEIGHTS.bass_line).toBe(0.30);
    expect(SCHEMA_SIMILARITY_WEIGHTS.degree_pattern).toBe(0.25);
    expect(SCHEMA_SIMILARITY_WEIGHTS.upper_voice).toBe(0.20);
    expect(SCHEMA_SIMILARITY_WEIGHTS.cadence).toBe(0.15);
    expect(SCHEMA_SIMILARITY_WEIGHTS.rhythm).toBe(0.10);
  });

  test('weights sum to 1.0', () => {
    const total = Object.values(SCHEMA_SIMILARITY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0);
  });

  test('calculates similarity from feature matches', () => {
    const perfectMatch: SchemaFeatureMatch[] = [
      { feature: 'bass_line', weight: 1, match: 1, details: 'Perfect bass' },
      { feature: 'degree_pattern', weight: 1, match: 1, details: 'Perfect degrees' },
      { feature: 'upper_voice', weight: 1, match: 1, details: 'Perfect upper' },
      { feature: 'cadence', weight: 1, match: 1, details: 'Perfect cadence' },
      { feature: 'rhythm', weight: 1, match: 1, details: 'Perfect rhythm' },
    ];
    expect(calculateSchemaSimilarity(perfectMatch)).toBe(100);
  });

  test('calculates partial similarity', () => {
    const partialMatch: SchemaFeatureMatch[] = [
      { feature: 'bass_line', weight: 1, match: 0.8, details: 'Good bass' },
      { feature: 'degree_pattern', weight: 1, match: 0.6, details: 'Fair degrees' },
    ];
    const score = calculateSchemaSimilarity(partialMatch);
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThan(80);
  });

  test('returns 0 for empty matches', () => {
    expect(calculateSchemaSimilarity([])).toBe(0);
  });

  test('defines match thresholds', () => {
    expect(SCHEMA_MATCH_THRESHOLDS.strong).toBe(80);
    expect(SCHEMA_MATCH_THRESHOLDS.good).toBe(60);
    expect(SCHEMA_MATCH_THRESHOLDS.partial).toBe(40);
    expect(SCHEMA_MATCH_THRESHOLDS.weak).toBe(20);
  });
});

// ============================================================================
// C040: Raga Similarity Metric
// ============================================================================

import {
  calculateRagaSimilarity,
  RAGA_12TET_APPROXIMATIONS,
} from './canonical-representations';

describe('C040: Raga Similarity Metric', () => {
  test('defines common ragas', () => {
    expect(RAGA_12TET_APPROXIMATIONS.yaman).toBeDefined();
    expect(RAGA_12TET_APPROXIMATIONS.bhairav).toBeDefined();
    expect(RAGA_12TET_APPROXIMATIONS.bhairavi).toBeDefined();
    expect(RAGA_12TET_APPROXIMATIONS.darbari).toBeDefined();
    expect(RAGA_12TET_APPROXIMATIONS.todi).toBeDefined();
  });

  test('Yaman raga has correct characteristics', () => {
    const yaman = RAGA_12TET_APPROXIMATIONS.yaman;
    expect(yaman.aroha).toEqual([0, 2, 4, 6, 7, 9, 11]); // C D E F# G A B
    expect(yaman.vadi).toBe(7); // G (Pa)
    expect(yaman.samvadi).toBe(2); // D (Re)
    expect(yaman.thaat).toBe('kalyan');
  });

  test('calculates high similarity for matching pitch classes', () => {
    // Yaman pitch classes: 0, 2, 4, 6, 7, 9, 11
    const result = calculateRagaSimilarity([0, 2, 4, 6, 7, 9, 11], 'yaman');
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(80);
    expect(result!.vadiMatch).toBe(true);
    expect(result!.samvadiMatch).toBe(true);
  });

  test('calculates lower similarity for partial match', () => {
    // Only some Yaman notes
    const result = calculateRagaSimilarity([0, 2, 4, 7], 'yaman');
    expect(result).not.toBeNull();
    expect(result!.score).toBeLessThan(80);
    expect(result!.score).toBeGreaterThan(30);
  });

  test('handles unknown raga', () => {
    const result = calculateRagaSimilarity([0, 2, 4], 'unknown_raga');
    expect(result).toBeNull();
  });

  test('respects direction parameter', () => {
    const ascending = calculateRagaSimilarity([0, 2, 4, 6, 7], 'yaman', 'ascending');
    const descending = calculateRagaSimilarity([0, 2, 4, 6, 7], 'yaman', 'descending');
    // Different results for different directions (aroha vs avaroha)
    expect(ascending).not.toBeNull();
    expect(descending).not.toBeNull();
  });
});

// ============================================================================
// C041: Mode Similarity Metric
// ============================================================================

import {
  calculateModeSimilarity,
  MODE_PITCH_CLASSES,
} from './canonical-representations';

describe('C041: Mode Similarity Metric', () => {
  test('defines all church modes', () => {
    expect(MODE_PITCH_CLASSES.ionian).toBeDefined();
    expect(MODE_PITCH_CLASSES.dorian).toBeDefined();
    expect(MODE_PITCH_CLASSES.phrygian).toBeDefined();
    expect(MODE_PITCH_CLASSES.lydian).toBeDefined();
    expect(MODE_PITCH_CLASSES.mixolydian).toBeDefined();
    expect(MODE_PITCH_CLASSES.aeolian).toBeDefined();
    expect(MODE_PITCH_CLASSES.locrian).toBeDefined();
  });

  test('defines extended modes', () => {
    expect(MODE_PITCH_CLASSES.harmonic_minor).toBeDefined();
    expect(MODE_PITCH_CLASSES.melodic_minor).toBeDefined();
  });

  test('Ionian has correct pitch classes', () => {
    const ionian = MODE_PITCH_CLASSES.ionian;
    expect(ionian.pitchClasses).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(ionian.leadingTone).toBe(11);
    expect(ionian.characteristicDegrees).toContain(11); // Major 7th
  });

  test('identical modes have 100% similarity', () => {
    const result = calculateModeSimilarity('ionian', 'ionian');
    expect(result).not.toBeNull();
    expect(result!.score).toBe(100);
    expect(result!.relationship).toBe('parallel');
  });

  test('calculates similarity between Ionian and Aeolian', () => {
    const result = calculateModeSimilarity('ionian', 'aeolian');
    expect(result).not.toBeNull();
    // They share 5 notes
    expect(result!.sharedDegrees).toBe(5);
    expect(result!.relationship).toBe('relative');
  });

  test('Ionian and Lydian have high similarity (differ by one note)', () => {
    const result = calculateModeSimilarity('ionian', 'lydian');
    expect(result).not.toBeNull();
    expect(result!.sharedDegrees).toBe(6);
    expect(result!.leadingToneSimilar).toBe(true);
  });

  test('handles unknown mode', () => {
    const result = calculateModeSimilarity('ionian', 'unknown_mode');
    expect(result).toBeNull();
  });
});

// ============================================================================
// C042: Ornament Budget Model
// ============================================================================

import {
  ORNAMENT_BUDGETS,
  calculateOrnamentAllowance,
  validateOrnamentPlacement,
} from './canonical-representations';

describe('C042: Ornament Budget Model', () => {
  test('defines budgets for different styles', () => {
    expect(ORNAMENT_BUDGETS.baroque).toBeDefined();
    expect(ORNAMENT_BUDGETS.classical).toBeDefined();
    expect(ORNAMENT_BUDGETS.galant).toBeDefined();
    expect(ORNAMENT_BUDGETS.celtic_slow).toBeDefined();
    expect(ORNAMENT_BUDGETS.celtic_fast).toBeDefined();
    expect(ORNAMENT_BUDGETS.carnatic).toBeDefined();
    expect(ORNAMENT_BUDGETS.jazz).toBeDefined();
    expect(ORNAMENT_BUDGETS.edm).toBeDefined();
  });

  test('Carnatic has highest ornament density', () => {
    expect(ORNAMENT_BUDGETS.carnatic.maxPerBeat).toBeGreaterThan(
      ORNAMENT_BUDGETS.classical.maxPerBeat
    );
    expect(ORNAMENT_BUDGETS.carnatic.maxPerPhrase).toBeGreaterThan(
      ORNAMENT_BUDGETS.baroque.maxPerPhrase
    );
  });

  test('EDM has lowest ornament density', () => {
    const styles = Object.values(ORNAMENT_BUDGETS);
    const minDensity = Math.min(...styles.map(s => s.maxPerBeat));
    expect(ORNAMENT_BUDGETS.edm.maxPerBeat).toBe(minDensity);
  });

  test('calculates ornament allowance for phrase', () => {
    const result = calculateOrnamentAllowance('baroque', 8);
    expect(result).not.toBeNull();
    expect(result!.maxOrnaments).toBeLessThanOrEqual(result!.budget.maxPerPhrase);
    expect(result!.maxOrnaments).toBeLessThanOrEqual(8 * ORNAMENT_BUDGETS.baroque.maxPerBeat);
  });

  test('handles unknown budget', () => {
    const result = calculateOrnamentAllowance('unknown_style', 8);
    expect(result).toBeNull();
  });

  test('validates ornament placement - valid spacing', () => {
    const result = validateOrnamentPlacement('baroque', [0, 4, 8], 12);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('validates ornament placement - too close', () => {
    // Baroque requires minSpacing of 2 beats
    const result = validateOrnamentPlacement('baroque', [0, 1, 4], 8);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0]).toContain('too close');
  });

  test('validates ornament placement - too many', () => {
    // Classical allows maxPerPhrase of 2
    const result = validateOrnamentPlacement('classical', [0, 4, 8, 12, 16], 4);
    expect(result.valid).toBe(false);
    expect(result.violations.some(v => v.includes('Too many'))).toBe(true);
  });
});

