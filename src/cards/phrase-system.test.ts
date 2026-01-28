/**
 * @fileoverview Tests for Phrase System
 */

import { describe, it, expect } from 'vitest';
import {
  DRUM_RHYTHM_PATTERNS,
  PERCUSSION_RHYTHM_PATTERNS,
  FILL_RHYTHM_PATTERNS,
  OSTINATO_RHYTHM_PATTERNS,
  COMPREHENSIVE_RHYTHM_PATTERNS,
  generate,
  generateVariations,
  generateFromAudio,
  generateFromPitch,
  morphIdeas,
  IdeaToolImplementation,
  type IdeaToolConfig,
  type GeneratedIdea,
  type RhythmPattern,
} from './phrase-system';

// ============================================================================
// RHYTHM PATTERN TESTS
// ============================================================================

describe('Phrase System', () => {
  describe('Drum Rhythm Patterns', () => {
    it('should have multiple drum patterns', () => {
      expect(DRUM_RHYTHM_PATTERNS.length).toBeGreaterThan(5);
    });

    it('should include basic grooves', () => {
      const basicRock = DRUM_RHYTHM_PATTERNS.find(p => p.id === 'drum-basic-rock');
      expect(basicRock).toBeDefined();
      expect(basicRock?.category).toBe('drums');
      expect(basicRock?.steps.length).toBeGreaterThan(0);
    });

    it('should include fills', () => {
      const fill = DRUM_RHYTHM_PATTERNS.find(p => p.id === 'drum-fill-simple');
      expect(fill).toBeDefined();
      expect(fill?.category).toBe('drums');
    });

    it('should include breaks', () => {
      const breakPattern = DRUM_RHYTHM_PATTERNS.find(p => p.id === 'drum-break-stop');
      expect(breakPattern).toBeDefined();
    });

    it('all patterns should have valid structure', () => {
      DRUM_RHYTHM_PATTERNS.forEach(pattern => {
        expect(pattern.id).toBeTruthy();
        expect(pattern.name).toBeTruthy();
        expect(pattern.category).toBe('drums');
        expect(pattern.steps).toBeInstanceOf(Array);
        expect(pattern.length).toBeGreaterThan(0);
        
        // Validate steps
        pattern.steps.forEach(step => {
          expect(step.position).toBeGreaterThanOrEqual(0);
          expect(step.duration).toBeGreaterThan(0);
          expect(step.accent).toBeGreaterThanOrEqual(0);
          expect(step.accent).toBeLessThanOrEqual(1);
        });
      });
    });
  });

  describe('Percussion Rhythm Patterns', () => {
    it('should have multiple percussion patterns', () => {
      expect(PERCUSSION_RHYTHM_PATTERNS.length).toBeGreaterThan(5);
    });

    it('should include shaker patterns', () => {
      const shaker = PERCUSSION_RHYTHM_PATTERNS.find(p => p.id === 'perc-shaker-16th');
      expect(shaker).toBeDefined();
      expect(shaker?.category).toBe('percussion');
    });

    it('should include clave patterns', () => {
      const clave = PERCUSSION_RHYTHM_PATTERNS.find(p => p.id === 'perc-clave-son-32');
      expect(clave).toBeDefined();
      expect(clave?.category).toBe('percussion');
    });

    it('should include conga patterns', () => {
      const conga = PERCUSSION_RHYTHM_PATTERNS.find(p => p.id === 'perc-conga-basic');
      expect(conga).toBeDefined();
    });

    it('should include world percussion', () => {
      const tabla = PERCUSSION_RHYTHM_PATTERNS.find(p => p.id === 'perc-tabla-basic');
      expect(tabla).toBeDefined();
    });

    it('all patterns should have valid structure', () => {
      PERCUSSION_RHYTHM_PATTERNS.forEach(pattern => {
        expect(pattern.id).toBeTruthy();
        expect(pattern.name).toBeTruthy();
        expect(pattern.category).toBe('percussion');
        expect(pattern.steps).toBeInstanceOf(Array);
        expect(pattern.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Fill Rhythm Patterns', () => {
    it('should have multiple fill patterns', () => {
      expect(FILL_RHYTHM_PATTERNS.length).toBeGreaterThan(5);
    });

    it('should include scalar fills', () => {
      const scalar = FILL_RHYTHM_PATTERNS.find(p => p.id === 'fill-scalar-ascending');
      expect(scalar).toBeDefined();
      expect(scalar?.category).toBe('fills');
    });

    it('should include arpeggio fills', () => {
      const arpeggio = FILL_RHYTHM_PATTERNS.find(p => p.id === 'fill-arpeggio-up');
      expect(arpeggio).toBeDefined();
      expect(arpeggio?.category).toBe('fills');
    });

    it('should include chromatic fills', () => {
      const chromatic = FILL_RHYTHM_PATTERNS.find(p => p.id === 'fill-chromatic-up');
      expect(chromatic).toBeDefined();
    });

    it('all patterns should have valid structure', () => {
      FILL_RHYTHM_PATTERNS.forEach(pattern => {
        expect(pattern.id).toBeTruthy();
        expect(pattern.name).toBeTruthy();
        expect(pattern.category).toBe('fills');
        expect(pattern.steps).toBeInstanceOf(Array);
        expect(pattern.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Ostinato Rhythm Patterns', () => {
    it('should have multiple ostinato patterns', () => {
      expect(OSTINATO_RHYTHM_PATTERNS.length).toBeGreaterThan(5);
    });

    it('should include minimal ostinatos', () => {
      const minimal = OSTINATO_RHYTHM_PATTERNS.find(p => p.id === 'ostinato-minimal-pulse');
      expect(minimal).toBeDefined();
      expect(minimal?.category).toBe('ostinato');
    });

    it('should include repetitive ostinatos', () => {
      const alberti = OSTINATO_RHYTHM_PATTERNS.find(p => p.id === 'ostinato-alberti-bass');
      expect(alberti).toBeDefined();
    });

    it('should include syncopated ostinatos', () => {
      const syncopated = OSTINATO_RHYTHM_PATTERNS.find(p => p.id === 'ostinato-syncopated-8th');
      expect(syncopated).toBeDefined();
    });

    it('all patterns should have valid structure', () => {
      OSTINATO_RHYTHM_PATTERNS.forEach(pattern => {
        expect(pattern.id).toBeTruthy();
        expect(pattern.name).toBeTruthy();
        expect(pattern.category).toBe('ostinato');
        expect(pattern.steps).toBeInstanceOf(Array);
        expect(pattern.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Comprehensive Rhythm Patterns', () => {
    it('should contain all pattern categories', () => {
      expect(COMPREHENSIVE_RHYTHM_PATTERNS.drums).toBe(DRUM_RHYTHM_PATTERNS);
      expect(COMPREHENSIVE_RHYTHM_PATTERNS.percussion).toBe(PERCUSSION_RHYTHM_PATTERNS);
      expect(COMPREHENSIVE_RHYTHM_PATTERNS.fills).toBe(FILL_RHYTHM_PATTERNS);
      expect(COMPREHENSIVE_RHYTHM_PATTERNS.ostinato).toBe(OSTINATO_RHYTHM_PATTERNS);
    });
  });

  // ============================================================================
  // IDEA TOOL TESTS
  // ============================================================================

  describe('IdeaTool - generate()', () => {
    it('should generate a basic idea', () => {
      const config: IdeaToolConfig = {
        lineTypes: ['melody'],
        style: 'pop',
        complexity: 0.5,
        density: 0.5,
        coherence: 0.8,
      };
      
      const idea = generate(config);
      
      expect(idea.id).toBeTruthy();
      expect(idea.lines).toBeDefined();
      expect(idea.lines.melody).toBeDefined();
      expect(idea.phrase).toBeDefined();
      expect(idea.config).toEqual(config);
      expect(idea.tags).toBeInstanceOf(Array);
      expect(idea.timestamp).toBeGreaterThan(0);
    });

    it('should generate multiple line types', () => {
      const config: IdeaToolConfig = {
        lineTypes: ['melody', 'bass', 'drums'],
        style: 'rock',
        complexity: 0.6,
        density: 0.7,
        coherence: 0.9,
      };
      
      const idea = generate(config);
      
      expect(idea.lines.melody).toBeDefined();
      expect(idea.lines.bass).toBeDefined();
      expect(idea.lines.drums).toBeDefined();
    });

    it('should respect density parameter', () => {
      const sparseConfig: IdeaToolConfig = {
        lineTypes: ['melody'],
        style: 'ambient',
        complexity: 0.5,
        density: 0.2,
        coherence: 0.8,
      };
      
      const busyConfig: IdeaToolConfig = {
        ...sparseConfig,
        density: 0.9,
      };
      
      const sparseIdea = generate(sparseConfig);
      const busyIdea = generate(busyConfig);
      
      // Busy ideas should generate more notes
      expect(sparseIdea.lines.melody.notes.length).toBeLessThan(
        busyIdea.lines.melody.notes.length
      );
    });

    it('should auto-tag based on characteristics', () => {
      const busyConfig: IdeaToolConfig = {
        lineTypes: ['melody'],
        style: 'jazz',
        complexity: 0.8,
        density: 0.9,
        coherence: 0.7,
      };
      
      const idea = generate(busyConfig);
      
      expect(idea.tags).toContain('busy');
      expect(idea.tags).toContain('complex');
      expect(idea.tags).toContain('jazz');
    });
  });

  describe('IdeaTool - generateVariations()', () => {
    it('should generate multiple variations', () => {
      const baseConfig: IdeaToolConfig = {
        lineTypes: ['melody'],
        style: 'pop',
        complexity: 0.5,
        density: 0.5,
        coherence: 0.8,
      };
      
      const baseIdea = generate(baseConfig);
      const variations = generateVariations(baseIdea, 3);
      
      expect(variations).toHaveLength(3);
      variations.forEach(variation => {
        expect(variation.id).toBeTruthy();
        expect(variation.tags).toContain('variation');
      });
    });

    it('variations should differ from base idea', () => {
      const baseConfig: IdeaToolConfig = {
        lineTypes: ['melody'],
        style: 'electronic',
        complexity: 0.5,
        density: 0.5,
        coherence: 0.8,
      };
      
      const baseIdea = generate(baseConfig);
      const variations = generateVariations(baseIdea, 5);
      
      // Check that complexity/density vary
      const complexities = variations.map(v => v.config.complexity);
      const densities = variations.map(v => v.config.density);
      
      // Should have some variation
      const complexityRange = Math.max(...complexities) - Math.min(...complexities);
      const densityRange = Math.max(...densities) - Math.min(...densities);
      
      expect(complexityRange).toBeGreaterThan(0);
      expect(densityRange).toBeGreaterThan(0);
    });
  });

  describe('IdeaTool - generateFromAudio()', () => {
    it('should generate idea from audio buffer', () => {
      const audioBuffer = new ArrayBuffer(1024);
      const config = {
        complexity: 0.6,
      };
      
      const idea = generateFromAudio(audioBuffer, config);
      
      expect(idea.id).toBeTruthy();
      expect(idea.tags).toContain('from-audio');
      expect(idea.config.style).toBe('audio-derived');
    });
  });

  describe('IdeaTool - generateFromPitch()', () => {
    it('should generate idea from pitch data', () => {
      const pitchData = [60, 62, 64, 65, 67, 69, 71, 72];  // C major scale
      const config = {
        style: 'classical',
        complexity: 0.7,
      };
      
      const idea = generateFromPitch(pitchData, config);
      
      expect(idea.id).toBeTruthy();
      expect(idea.tags).toContain('from-pitch');
      expect(idea.tags).toContain('hummed');
    });
  });

  describe('IdeaTool - morphIdeas()', () => {
    it('should morph between two ideas', () => {
      const configA: IdeaToolConfig = {
        lineTypes: ['melody'],
        style: 'ambient',
        complexity: 0.3,
        density: 0.2,
        coherence: 0.9,
      };
      
      const configB: IdeaToolConfig = {
        lineTypes: ['melody', 'bass'],
        style: 'techno',
        complexity: 0.8,
        density: 0.9,
        coherence: 0.7,
      };
      
      const ideaA = generate(configA);
      const ideaB = generate(configB);
      
      // Morph at 50%
      const morphed = morphIdeas(ideaA, ideaB, 0.5);
      
      expect(morphed.id).toBeTruthy();
      expect(morphed.tags).toContain('morphed');
      
      // Complexity should be between A and B
      expect(morphed.config.complexity).toBeGreaterThan(configA.complexity);
      expect(morphed.config.complexity).toBeLessThan(configB.complexity);
    });

    it('should favor ideaA when amount is low', () => {
      const configA: IdeaToolConfig = {
        lineTypes: ['melody'],
        style: 'jazz',
        complexity: 0.2,
        density: 0.3,
        coherence: 0.8,
      };
      
      const configB: IdeaToolConfig = {
        lineTypes: ['melody'],
        style: 'metal',
        complexity: 0.9,
        density: 0.9,
        coherence: 0.6,
      };
      
      const ideaA = generate(configA);
      const ideaB = generate(configB);
      
      const morphed = morphIdeas(ideaA, ideaB, 0.1);
      
      // Should be closer to A
      expect(morphed.config.style).toBe('jazz');
      expect(morphed.config.complexity).toBeLessThan(0.4);
    });

    it('should favor ideaB when amount is high', () => {
      const configA: IdeaToolConfig = {
        lineTypes: ['melody'],
        style: 'folk',
        complexity: 0.2,
        density: 0.3,
        coherence: 0.9,
      };
      
      const configB: IdeaToolConfig = {
        lineTypes: ['melody'],
        style: 'dubstep',
        complexity: 0.9,
        density: 0.8,
        coherence: 0.5,
      };
      
      const ideaA = generate(configA);
      const ideaB = generate(configB);
      
      const morphed = morphIdeas(ideaA, ideaB, 0.9);
      
      // Should be closer to B
      expect(morphed.config.style).toBe('dubstep');
      expect(morphed.config.complexity).toBeGreaterThan(0.7);
    });
  });

  describe('IdeaTool - suggest()', () => {
    it('should suggest multiple ideas', () => {
      const context = { style: 'pop' };
      const suggestions = IdeaToolImplementation.suggest(context);
      
      expect(suggestions.length).toBeGreaterThan(0);
      suggestions.forEach(suggestion => {
        expect(suggestion.id).toBeTruthy();
        expect(suggestion.lines).toBeDefined();
      });
    });
  });

  describe('IdeaTool - rateIdea()', () => {
    it('should accept rating for an idea', () => {
      const config: IdeaToolConfig = {
        lineTypes: ['melody'],
        style: 'pop',
        complexity: 0.5,
        density: 0.5,
        coherence: 0.8,
      };
      
      const idea = generate(config);
      
      // Should not throw
      expect(() => {
        IdeaToolImplementation.rateIdea(idea, 5);
      }).not.toThrow();
    });
  });

  describe('IdeaTool Interface Compliance', () => {
    it('should implement all required methods', () => {
      expect(typeof IdeaToolImplementation.generate).toBe('function');
      expect(typeof IdeaToolImplementation.generateVariations).toBe('function');
      expect(typeof IdeaToolImplementation.generateFromAudio).toBe('function');
      expect(typeof IdeaToolImplementation.generateFromPitch).toBe('function');
      expect(typeof IdeaToolImplementation.morphIdeas).toBe('function');
      expect(typeof IdeaToolImplementation.rateIdea).toBe('function');
      expect(typeof IdeaToolImplementation.suggest).toBe('function');
    });
  });

  // ==========================================================================
  // SHAPE CONTOUR TESTS
  // ==========================================================================

  describe('Shape Contour Library', () => {
    it('should have all 12 contour types', async () => {
      const { SHAPE_CONTOURS } = await import('./phrase-system');
      
      const expectedTypes = [
        'ascending', 'descending', 'arch', 'inverted-arch',
        'wave', 'plateau', 'step-up', 'step-down',
        'zigzag', 'flat', 'peak-start', 'trough-start',
      ];

      for (const type of expectedTypes) {
        expect(SHAPE_CONTOURS[type as keyof typeof SHAPE_CONTOURS]).toBeDefined();
        expect(SHAPE_CONTOURS[type as keyof typeof SHAPE_CONTOURS].id).toBe(`contour-${type}`);
        expect(SHAPE_CONTOURS[type as keyof typeof SHAPE_CONTOURS].points.length).toBeGreaterThan(0);
      }
    });

    it('should have valid contour points', async () => {
      const { SHAPE_CONTOURS } = await import('./phrase-system');
      
      for (const contour of Object.values(SHAPE_CONTOURS)) {
        for (const point of contour.points) {
          expect(point.position).toBeGreaterThanOrEqual(0);
          expect(point.position).toBeLessThanOrEqual(1);
          expect(point.value).toBeGreaterThanOrEqual(0);
          expect(point.value).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should have ascending contour go from low to high', async () => {
      const { SHAPE_CONTOURS } = await import('./phrase-system');
      const ascending = SHAPE_CONTOURS.ascending;
      
      expect(ascending.points[0].value).toBe(0);
      expect(ascending.points[ascending.points.length - 1].value).toBe(1);
    });

    it('should have descending contour go from high to low', async () => {
      const { SHAPE_CONTOURS } = await import('./phrase-system');
      const descending = SHAPE_CONTOURS.descending;
      
      expect(descending.points[0].value).toBe(1);
      expect(descending.points[descending.points.length - 1].value).toBe(0);
    });

    it('should have arch contour peak in middle', async () => {
      const { SHAPE_CONTOURS } = await import('./phrase-system');
      const arch = SHAPE_CONTOURS.arch;
      
      const middlePoint = arch.points.find(p => p.position === 0.5);
      expect(middlePoint).toBeDefined();
      expect(middlePoint?.value).toBe(1);
    });

    it('should have flat contour at constant level', async () => {
      const { SHAPE_CONTOURS } = await import('./phrase-system');
      const flat = SHAPE_CONTOURS.flat;
      
      const values = flat.points.map(p => p.value);
      const allSame = values.every(v => v === values[0]);
      expect(allSame).toBe(true);
    });
  });

  describe('Shape Contour Functions', () => {
    it('createContourFromPoints should create valid contour', async () => {
      const { createContourFromPoints } = await import('./phrase-system');
      
      const contour = createContourFromPoints(
        'test-contour',
        'Test Contour',
        [
          { position: 0, value: 0 },
          { position: 0.5, value: 1 },
          { position: 1, value: 0.5 },
        ],
        'linear'
      );

      expect(contour.id).toBe('test-contour');
      expect(contour.name).toBe('Test Contour');
      expect(contour.points.length).toBe(3);
      expect(contour.interpolation).toBe('linear');
    });

    it('invertContour should flip values', async () => {
      const { SHAPE_CONTOURS, invertContour } = await import('./phrase-system');
      
      const original = SHAPE_CONTOURS.ascending;
      const inverted = invertContour(original);

      expect(inverted.points[0].value).toBe(1);
      expect(inverted.points[inverted.points.length - 1].value).toBe(0);
      expect(inverted.id).toContain('inverted');
    });

    it('reverseContour should reverse time', async () => {
      const { createContourFromPoints, reverseContour } = await import('./phrase-system');
      
      const original = createContourFromPoints(
        'test',
        'Test',
        [
          { position: 0, value: 0 },
          { position: 0.5, value: 0.5 },
          { position: 1, value: 1 },
        ]
      );

      const reversed = reverseContour(original);

      expect(reversed.points[0].value).toBe(1);
      expect(reversed.points[1].value).toBe(0.5);
      expect(reversed.points[2].value).toBe(0);
      expect(reversed.id).toContain('reversed');
    });

    it('stretchContour should scale time positions', async () => {
      const { createContourFromPoints, stretchContour } = await import('./phrase-system');
      
      const original = createContourFromPoints(
        'test',
        'Test',
        [
          { position: 0, value: 0 },
          { position: 0.5, value: 1 },
          { position: 1, value: 0 },
        ]
      );

      const stretched = stretchContour(original, 2, 0);

      // When stretched 2x from start, middle point should be at 1.0 (clipped)
      // and end point should be at 2.0 (clipped to 1.0)
      expect(stretched.points.length).toBeGreaterThan(0);
      expect(stretched.id).toContain('stretched');
    });

    it('createContourFromMelody should extract contour from events', async () => {
      const { createContourFromMelody } = await import('./phrase-system');
      
      const events = [
        { id: '1', kind: 'note', start: 0 as any, duration: 480 as any, payload: { pitch: 60 } },
        { id: '2', kind: 'note', start: 480 as any, duration: 480 as any, payload: { pitch: 64 } },
        { id: '3', kind: 'note', start: 960 as any, duration: 480 as any, payload: { pitch: 67 } },
        { id: '4', kind: 'note', start: 1440 as any, duration: 480 as any, payload: { pitch: 62 } },
      ];

      const contour = createContourFromMelody(events, 'extracted', 'Extracted');

      expect(contour.id).toBe('extracted');
      expect(contour.points.length).toBe(4);
      
      // First note (60) should be lowest (0)
      expect(contour.points[0].value).toBe(0);
      
      // Third note (67) should be highest (1)
      expect(contour.points[2].value).toBe(1);
    });

    it('createContourFromMelody should handle empty events', async () => {
      const { createContourFromMelody, SHAPE_CONTOURS } = await import('./phrase-system');
      
      const contour = createContourFromMelody([], 'empty', 'Empty');

      expect(contour.id).toBe(SHAPE_CONTOURS.flat.id);
      expect(contour.name).toBe(SHAPE_CONTOURS.flat.name);
    });
  });
});
