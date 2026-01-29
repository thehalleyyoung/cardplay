/**
 * @fileoverview Tests for MusicSpec and Spec Queries (Branch C)
 * 
 * Tests for:
 * - C051-C052: MusicSpec types and constraint types
 * - C053-C054: Prolog encoding/decoding
 * - C070-C071: Round-trip tests
 * - C137-C157: Key detection queries
 * - C288-C301: Schema matching queries
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPrologAdapter, resetPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';
import { resetMusicTheoryLoader } from '../knowledge/music-theory-loader';
import {
  createMusicSpec,
  withConstraints,
  withKey,
  withMeter,
  withTempo,
  withCulture,
  withStyle,
  keyConstraint,
  tempoConstraint,
  schemaConstraint,
  ragaConstraint,
  filmMoodConstraint,
  getConstraintsOfType,
  hasConstraint,
  DEFAULT_MUSIC_SPEC,
  type MusicSpec,
} from '../theory/music-spec';
import {
  specToPrologFacts,
  specToPrologTerm,
} from '../theory/spec-prolog-bridge';
import {
  detectKeyKS,
  detectKeyDFT,
  detectKeyAdvanced,
  matchGalantSchema,
  recommendFilmDevices,
  recommendFilmMode,
  listConstraintPacks,
} from '../queries/spec-queries';

describe('MusicSpec Types (C051-C052)', () => {
  describe('createMusicSpec', () => {
    it('should create a spec with defaults', () => {
      const spec = createMusicSpec();
      expect(spec.keyRoot).toBe('c');
      expect(spec.mode).toBe('major');
      expect(spec.tempo).toBe(120);
      expect(spec.meterNumerator).toBe(4);
      expect(spec.meterDenominator).toBe(4);
      expect(spec.culture).toBe('western');
      expect(spec.style).toBe('cinematic');
      expect(spec.constraints).toEqual([]);
    });
    
    it('should create a spec with overrides', () => {
      const spec = createMusicSpec({
        keyRoot: 'g',
        mode: 'mixolydian',
        tempo: 140,
        culture: 'celtic',
      });
      expect(spec.keyRoot).toBe('g');
      expect(spec.mode).toBe('mixolydian');
      expect(spec.tempo).toBe(140);
      expect(spec.culture).toBe('celtic');
      // Defaults preserved
      expect(spec.meterNumerator).toBe(4);
    });
  });
  
  describe('withConstraints', () => {
    it('should add constraints immutably', () => {
      const spec1 = createMusicSpec();
      const spec2 = withConstraints(
        spec1,
        keyConstraint('d', 'dorian'),
        tempoConstraint(100)
      );
      
      expect(spec1.constraints).toHaveLength(0);
      expect(spec2.constraints).toHaveLength(2);
      expect(spec2.constraints[0].type).toBe('key');
      expect(spec2.constraints[1].type).toBe('tempo');
    });
    
    it('should support schema constraints', () => {
      const spec = withConstraints(
        createMusicSpec(),
        schemaConstraint('prinner', false, 0.8)
      );
      
      const schemas = getConstraintsOfType(spec, 'schema');
      expect(schemas).toHaveLength(1);
      expect(schemas[0].schema).toBe('prinner');
      expect(schemas[0].hard).toBe(false);
      expect(schemas[0].weight).toBe(0.8);
    });
    
    it('should support raga constraints', () => {
      const spec = withConstraints(
        createMusicSpec({ culture: 'carnatic' }),
        ragaConstraint('kalyani')
      );
      
      expect(hasConstraint(spec, 'raga')).toBe(true);
      const ragas = getConstraintsOfType(spec, 'raga');
      expect(ragas[0].raga).toBe('kalyani');
    });
    
    it('should support film mood constraints', () => {
      const spec = withConstraints(
        createMusicSpec(),
        filmMoodConstraint('heroic', false, 0.9)
      );
      
      expect(hasConstraint(spec, 'film_mood')).toBe(true);
    });
  });
  
  describe('spec modifiers', () => {
    it('withKey should update key', () => {
      const spec = withKey(createMusicSpec(), 'eflat', 'natural_minor');
      expect(spec.keyRoot).toBe('eflat');
      expect(spec.mode).toBe('natural_minor');
    });
    
    it('withMeter should update meter', () => {
      const spec = withMeter(createMusicSpec(), 6, 8);
      expect(spec.meterNumerator).toBe(6);
      expect(spec.meterDenominator).toBe(8);
    });
    
    it('withTempo should update tempo', () => {
      const spec = withTempo(createMusicSpec(), 180);
      expect(spec.tempo).toBe(180);
    });
    
    it('withCulture should update culture', () => {
      const spec = withCulture(createMusicSpec(), 'carnatic');
      expect(spec.culture).toBe('carnatic');
    });
    
    it('withStyle should update style', () => {
      const spec = withStyle(createMusicSpec(), 'galant');
      expect(spec.style).toBe('galant');
    });
  });
});

describe('Prolog Encoding (C053-C054)', () => {
  describe('specToPrologFacts', () => {
    it('should encode default spec to facts', () => {
      const spec = createMusicSpec();
      const facts = specToPrologFacts(spec);
      
      expect(facts).toContain('spec_key(current, c, major).');
      expect(facts).toContain('spec_meter(current, 4, 4).');
      expect(facts).toContain('spec_tempo(current, 120).');
      expect(facts).toContain('spec_tonality_model(current, ks_profile).');
      expect(facts).toContain('spec_style(current, cinematic).');
      expect(facts).toContain('spec_culture(current, western).');
    });
    
    it('should encode constraints', () => {
      const spec = withConstraints(
        createMusicSpec(),
        schemaConstraint('prinner'),
        filmMoodConstraint('heroic')
      );
      const facts = specToPrologFacts(spec);
      
      const schemaFact = facts.find(f => f.includes('schema(prinner)'));
      expect(schemaFact).toBeDefined();
      
      const moodFact = facts.find(f => f.includes('film_mood(heroic)'));
      expect(moodFact).toBeDefined();
    });
    
    it('should encode custom spec id', () => {
      const spec = createMusicSpec();
      const facts = specToPrologFacts(spec, 'my_spec');
      
      expect(facts).toContain('spec_key(my_spec, c, major).');
    });
  });
  
  describe('specToPrologTerm', () => {
    it('should encode spec as Prolog term', () => {
      const spec = createMusicSpec({ keyRoot: 'g', mode: 'mixolydian' });
      const term = specToPrologTerm(spec);
      
      expect(term).toContain('key(g, mixolydian)');
      expect(term).toContain('tempo(120)');
      expect(term).toContain('meter(4, 4)');
    });
  });
});

describe('Spec Queries (C070-C090)', () => {
  let adapter: PrologAdapter;
  
  beforeEach(() => {
    resetMusicTheoryLoader();
    resetPrologAdapter();
    adapter = createPrologAdapter({ enableCache: false });
  });
  
  afterEach(() => {
    resetPrologAdapter();
  });
  
  describe('Key Detection - Krumhansl-Schmuckler (C137-C141)', () => {
    it('should detect C major from C major profile', async () => {
      // C major scale pitch class counts (emphasizing C, E, G)
      const cMajorProfile = [3, 0, 2, 0, 2, 1, 0, 2, 0, 1, 0, 1];
      
      const result = await detectKeyKS(cMajorProfile, adapter);
      expect(result).not.toBeNull();
      expect(result!.value.root).toBe('c');
      expect(result!.value.mode).toBe('major');
      expect(result!.value.model).toBe('ks_profile');
    });
    
    it('should detect A minor from A minor profile', async () => {
      // A minor scale pitch class counts
      const aMinorProfile = [1, 0, 1, 0, 2, 1, 0, 1, 0, 3, 0, 2];
      
      const result = await detectKeyKS(aMinorProfile, adapter);
      expect(result).not.toBeNull();
      // A is pitch class 9
      expect(result!.value.mode).toBe('minor');
    });
    
    it('should reject invalid profile length', async () => {
      await expect(detectKeyKS([1, 2, 3], adapter)).rejects.toThrow();
    });
  });
  
  describe('Key Detection - DFT Phase (C148-C152)', () => {
    it('should detect tonic from C-heavy profile', async () => {
      const cProfile = [5, 0, 1, 0, 1, 1, 0, 2, 0, 1, 0, 1];
      
      const result = await detectKeyDFT(cProfile, adapter);
      expect(result).not.toBeNull();
      expect(result!.value.model).toBe('dft_phase');
    });
  });
  
  describe('Advanced Key Detection (C213-C214)', () => {
    it('should return multiple model results', async () => {
      const profile = [3, 0, 2, 0, 2, 1, 0, 2, 0, 1, 0, 1];
      
      const result = await detectKeyAdvanced(profile, undefined, adapter);
      expect(result.value).toBeInstanceOf(Array);
      expect(result.value.length).toBeGreaterThan(0);
    });
    
    it('should prefer specified model', async () => {
      const profile = [3, 0, 2, 0, 2, 1, 0, 2, 0, 1, 0, 1];
      
      const result = await detectKeyAdvanced(profile, 'dft_phase', adapter);
      expect(result.value[0].model).toBe('dft_phase');
    });
  });
  
  describe('Schema Matching (C288-C301)', () => {
    it('should match Prinner degree pattern', async () => {
      // Prinner soprano: 6-5-4-3
      const prinnerDegrees = [6, 5, 4, 3];
      
      const result = await matchGalantSchema(prinnerDegrees, adapter);
      expect(result.value.length).toBeGreaterThan(0);
      
      const prinnerMatch = result.value.find(m => m.schema === 'prinner');
      expect(prinnerMatch).toBeDefined();
      expect(prinnerMatch!.score).toBeGreaterThan(50);
    });
    
    it('should match Monte degree pattern', async () => {
      // Monte soprano: 3-4-5-6
      const monteDegrees = [3, 4, 5, 6];
      
      const result = await matchGalantSchema(monteDegrees, adapter);
      const monteMatch = result.value.find(m => m.schema === 'monte');
      expect(monteMatch).toBeDefined();
    });
  });
  
  describe('Film Music Recommendations (C395-C399)', () => {
    it('should recommend devices for heroic mood', async () => {
      const result = await recommendFilmDevices('heroic', adapter);
      
      expect(result.value.length).toBeGreaterThan(0);
      // Heroic should suggest pedal_point, chromatic_mediant
      const devices = result.value.map(d => d.device);
      expect(devices).toContain('pedal_point');
    });
    
    it('should recommend modes for heroic mood', async () => {
      const result = await recommendFilmMode('heroic', adapter);
      
      expect(result.value.length).toBeGreaterThan(0);
      // Heroic should suggest mixolydian, lydian
      const modes = result.value.map(m => m.mode);
      expect(modes.some(m => ['mixolydian', 'lydian', 'major'].includes(m))).toBe(true);
    });
    
    it('should recommend modes for ominous mood', async () => {
      const result = await recommendFilmMode('ominous', adapter);
      
      const modes = result.value.map(m => m.mode);
      expect(modes.some(m => ['phrygian', 'harmonic_minor', 'locrian'].includes(m))).toBe(true);
    });
  });
  
  describe('Constraint Packs (C089-C091)', () => {
    it('should list available constraint packs', async () => {
      const packs = await listConstraintPacks(adapter);
      
      expect(packs).toBeInstanceOf(Array);
      // Should include predefined packs from music-spec.pl
      expect(packs).toContain('cinematic_heroic');
      expect(packs).toContain('galant_phrase');
      expect(packs).toContain('celtic_reel');
    });
  });
});
