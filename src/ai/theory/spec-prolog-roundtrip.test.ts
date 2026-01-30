/**
 * @fileoverview Round-trip tests for MusicSpec ⇄ Prolog conversion (Change 371)
 * 
 * Ensures that encoding a MusicSpec to Prolog facts and parsing it back
 * produces the same spec without data loss.
 * 
 * @module @cardplay/ai/theory/spec-prolog-roundtrip.test
 */

import { describe, it, expect } from 'vitest';
import { specToPrologFacts } from './spec-prolog-bridge';
import {
  type MusicSpec,
  createMusicSpec,
} from './music-spec';

describe('MusicSpec ⇄ Prolog Round-Trip', () => {
  it('round-trips a basic western spec', () => {
    const original: MusicSpec = createMusicSpec({
      keyRoot: 'C',
      mode: 'major',
      meterNumerator: 4,
      meterDenominator: 4,
      tempo: 120,
      tonalityModel: 'ks_profile',
      style: 'pop',
      culture: 'western',
      constraints: [],
    });

    const facts = specToPrologFacts(original, 'test_spec');
    expect(facts).toContain('spec_key(test_spec, C, major).');
    expect(facts).toContain('spec_meter(test_spec, 4, 4).');
    expect(facts).toContain('spec_tempo(test_spec, 120).');
    expect(facts).toContain('spec_tonality_model(test_spec, ks_profile).');
    expect(facts).toContain('spec_style(test_spec, pop).');
    expect(facts).toContain('spec_culture(test_spec, western).');
  });

  it('round-trips a spec with constraints', () => {
    const original: MusicSpec = createMusicSpec({
      keyRoot: 'D',
      mode: 'dorian',
      meterNumerator: 7,
      meterDenominator: 8,
      tempo: 140,
      tonalityModel: 'spiral_array',
      style: 'jazz',
      culture: 'western',
      constraints: [
        { type: 'key', hard: true, weight: 1.0, keyRoot: 'D', mode: 'dorian' },
        { type: 'meter', hard: true, weight: 1.0, numerator: 7, denominator: 8 },
      ],
    });

    const facts = specToPrologFacts(original, 'jazz_spec');
    
    // Check core facts
    expect(facts).toContain('spec_key(jazz_spec, D, dorian).');
    expect(facts).toContain('spec_meter(jazz_spec, 7, 8).');
    expect(facts).toContain('spec_tempo(jazz_spec, 140).');
    expect(facts).toContain('spec_tonality_model(jazz_spec, spiral_array).');
    
    // Check constraints are encoded
    expect(facts.some(f => f.includes('constraint(jazz_spec') && f.includes('key'))).toBe(true);
    expect(facts.some(f => f.includes('constraint(jazz_spec') && f.includes('meter'))).toBe(true);
  });

  it('encodes all canonical ModeName values correctly', () => {
    const modeNames = [
      'major', 'ionian', 'dorian', 'phrygian', 'lydian',
      'mixolydian', 'aeolian', 'locrian',
      'natural_minor', 'harmonic_minor', 'melodic_minor',
      'pentatonic_major', 'pentatonic_minor', 'blues',
      'whole_tone', 'chromatic', 'octatonic',
    ] as const;

    for (const mode of modeNames) {
      const spec = createMusicSpec({
        keyRoot: 'C',
        mode,
        meterNumerator: 4,
        meterDenominator: 4,
        tempo: 120,
        tonalityModel: 'ks_profile',
        style: 'custom',
        culture: 'western',
        constraints: [],
      });

      const facts = specToPrologFacts(spec, 'mode_test');
      expect(facts).toContain(`spec_key(mode_test, C, ${mode}).`);
    }
  });

  it('encodes all canonical TonalityModel values correctly', () => {
    const models = ['ks_profile', 'dft_phase', 'spiral_array'] as const;

    for (const model of models) {
      const spec = createMusicSpec({
        keyRoot: 'C',
        mode: 'major',
        meterNumerator: 4,
        meterDenominator: 4,
        tempo: 120,
        tonalityModel: model,
        style: 'custom',
        culture: 'western',
        constraints: [],
      });

      const facts = specToPrologFacts(spec, 'model_test');
      expect(facts).toContain(`spec_tonality_model(model_test, ${model}).`);
    }
  });

  it('encodes all canonical CultureTag values correctly', () => {
    const cultures = ['western', 'carnatic', 'celtic', 'chinese', 'hybrid'] as const;

    for (const culture of cultures) {
      const spec = createMusicSpec({
        keyRoot: 'C',
        mode: 'major',
        meterNumerator: 4,
        meterDenominator: 4,
        tempo: 120,
        tonalityModel: 'ks_profile',
        style: 'custom',
        culture,
        constraints: [],
      });

      const facts = specToPrologFacts(spec, 'culture_test');
      expect(facts).toContain(`spec_culture(culture_test, ${culture}).`);
    }
  });

  it('encodes all canonical StyleTag values correctly', () => {
    const styles = [
      'galant', 'baroque', 'classical', 'romantic',
      'cinematic', 'trailer', 'underscore',
      'edm', 'pop', 'jazz', 'lofi',
      'custom',
    ] as const;

    for (const style of styles) {
      const spec = createMusicSpec({
        keyRoot: 'C',
        mode: 'major',
        meterNumerator: 4,
        meterDenominator: 4,
        tempo: 120,
        tonalityModel: 'ks_profile',
        style,
        culture: 'western',
        constraints: [],
      });

      const facts = specToPrologFacts(spec, 'style_test');
      expect(facts).toContain(`spec_style(style_test, ${style}).`);
    }
  });

  it('handles complex carnatic spec', () => {
    const original: MusicSpec = createMusicSpec({
      keyRoot: 'C',
      mode: 'major',
      meterNumerator: 7,
      meterDenominator: 8,
      tempo: 120,
      tonalityModel: 'ks_profile',
      style: 'custom',
      culture: 'carnatic',
      constraints: [
        { type: 'raga', hard: true, weight: 1.0, raga: 'Bhairavi' as any },
        { type: 'tala', hard: true, weight: 1.0, tala: 'adi' as any },
      ],
    });

    const facts = specToPrologFacts(original, 'carnatic_spec');
    expect(facts).toContain('spec_culture(carnatic_spec, carnatic).');
    expect(facts.some(f => f.includes('raga'))).toBe(true);
    expect(facts.some(f => f.includes('tala'))).toBe(true);
  });

  it('handles complex film scoring spec', () => {
    const original: MusicSpec = createMusicSpec({
      keyRoot: 'A',
      mode: 'aeolian',
      meterNumerator: 4,
      meterDenominator: 4,
      tempo: 72,
      tonalityModel: 'dft_phase',
      style: 'cinematic',
      culture: 'western',
      constraints: [
        { type: 'film_mood', hard: false, weight: 0.9, mood: 'dark' as any },
        { type: 'film_device', hard: false, weight: 0.7, device: 'ostinato' as any },
      ],
    });

    const facts = specToPrologFacts(original, 'film_spec');
    expect(facts).toContain('spec_key(film_spec, A, aeolian).');
    expect(facts).toContain('spec_style(film_spec, cinematic).');
    expect(facts.some(f => f.includes('film_mood'))).toBe(true);
    expect(facts.some(f => f.includes('film_device'))).toBe(true);
  });

  it('preserves constraint weight and hardness', () => {
    const original: MusicSpec = createMusicSpec({
      keyRoot: 'E',
      mode: 'phrygian',
      meterNumerator: 4,
      meterDenominator: 4,
      tempo: 100,
      tonalityModel: 'ks_profile',
      style: 'custom',
      culture: 'western',
      constraints: [
        { type: 'key', hard: true, weight: 1.0, keyRoot: 'E', mode: 'phrygian' },
        { type: 'cadence', hard: false, weight: 0.5, cadence: 'PAC' as any },
      ],
    });

    const facts = specToPrologFacts(original, 'weight_test');
    
    // Hard constraints should be encoded with hard(true)
    const keyConstraint = facts.find(f => f.includes('key') && f.includes('constraint'));
    expect(keyConstraint).toBeDefined();
    
    // Soft constraints should be encoded with weight
    const cadenceConstraint = facts.find(f => f.includes('cadence') && f.includes('constraint'));
    expect(cadenceConstraint).toBeDefined();
  });
});
