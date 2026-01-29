/**
 * @fileoverview Tests for Composition Pattern Query Functions
 * 
 * Comprehensive tests for the composition-queries module covering:
 * - Genre information retrieval
 * - Arrangement suggestions
 * - Pattern generation
 * - Variation techniques
 * - Humanization parameters
 * 
 * Tests cover L162-L165 from the Branch B roadmap.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getPrologAdapter, resetPrologAdapter } from '../engine/prolog-adapter';
import { resetCompositionPatternsLoader } from '../knowledge/composition-patterns-loader';
import {
  getAllGenres,
  getGenreInfo,
  suggestTempo,
  getTempoRange,
  suggestArrangement,
  getArrangementTemplates,
  validateArrangement,
  suggestNextSection,
  getSectionEnergy,
  suggestBassPattern,
  suggestDrumPattern,
  getChordRhythm,
  getVariationTechniques,
  getAllVariationTechniques,
  getDensitySuggestions,
  getTransitionTechniques,
  getMelodicRange,
  isNoteInRange,
  getSwingFeel,
  getHumanizationParams,
  areGenresCompatible,
  getRepetitionTolerance,
  type Genre,
  type SectionType
} from './composition-queries';

describe('Composition Pattern Query Functions', () => {
  beforeEach(() => {
    resetPrologAdapter();
    resetCompositionPatternsLoader();
  });
  
  afterEach(() => {
    resetPrologAdapter();
    resetCompositionPatternsLoader();
  });

  // ==========================================================================
  // Genre Queries
  // ==========================================================================
  describe('Genre Queries', () => {
    it('should get all genres', async () => {
      const genres = await getAllGenres();
      
      expect(genres.length).toBeGreaterThan(10);
      expect(genres).toContain('lofi');
      expect(genres).toContain('house');
      expect(genres).toContain('jazz');
      expect(genres).toContain('ambient');
    });
    
    it('should get genre info for lofi', async () => {
      const info = await getGenreInfo('lofi');
      
      expect(info).not.toBeNull();
      if (info) {
        expect(info.id).toBe('lofi');
        expect(info.tempoRange.min).toBeGreaterThan(0);
        expect(info.tempoRange.max).toBeGreaterThan(info.tempoRange.min);
        expect(info.characteristics.length).toBeGreaterThan(0);
        expect(info.characteristics).toContain('relaxed');
      }
    });
    
    it('should return null for unknown genre', async () => {
      const info = await getGenreInfo('unknown_genre_xyz');
      
      expect(info).toBeNull();
    });
    
    it('should suggest tempo within genre range', async () => {
      const tempo = await suggestTempo('house');
      const range = await getTempoRange('house');
      
      expect(tempo).toBeGreaterThanOrEqual(range.min);
      expect(tempo).toBeLessThanOrEqual(range.max);
    });
    
    it('should get tempo range for techno', async () => {
      const range = await getTempoRange('techno');
      
      expect(range.min).toBe(125);
      expect(range.max).toBe(150);
    });
  });

  // ==========================================================================
  // L162: Arrangement Suggestion Tests
  // ==========================================================================
  describe('Arrangement Suggestions (L162)', () => {
    it('should suggest arrangement for house genre', async () => {
      const arrangement = await suggestArrangement('house', 128);
      
      expect(arrangement.length).toBeGreaterThan(0);
      expect(arrangement[0]).toBe('intro');
      expect(arrangement).toContain('drop');
    });
    
    it('should suggest arrangement for pop genre', async () => {
      const arrangement = await suggestArrangement('pop', 64);
      
      expect(arrangement.length).toBeGreaterThan(0);
      expect(arrangement).toContain('verse');
      expect(arrangement).toContain('chorus');
    });
    
    it('should get arrangement templates', async () => {
      const templates = await getArrangementTemplates('house');
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].genre).toBe('house');
      expect(templates[0].durationBars).toBeGreaterThan(0);
      expect(templates[0].sections.length).toBeGreaterThan(0);
    });
    
    it('should validate correct section sequence', async () => {
      const result = await validateArrangement(['intro', 'verse', 'chorus', 'outro']);
      
      expect(result.valid).toBe(true);
    });
    
    it('should suggest next section after verse', async () => {
      const suggestions = await suggestNextSection(['intro', 'verse'], 'pop');
      
      expect(suggestions.length).toBeGreaterThan(0);
      // Should suggest chorus or pre_chorus
      expect(
        suggestions.includes('chorus') || 
        suggestions.includes('pre_chorus') ||
        suggestions.includes('hook')
      ).toBe(true);
    });
    
    it('should get section energy levels', async () => {
      const chorusEnergy = await getSectionEnergy('chorus');
      const verseEnergy = await getSectionEnergy('verse');
      const dropEnergy = await getSectionEnergy('drop');
      
      expect(chorusEnergy).toBeGreaterThan(verseEnergy);
      expect(dropEnergy).toBe(10); // Maximum energy
    });
  });

  // ==========================================================================
  // L163: Bass Line Suggestion Tests
  // ==========================================================================
  describe('Bass Pattern Suggestions (L163)', () => {
    it('should suggest bass patterns for house', async () => {
      const patterns = await suggestBassPattern('house');
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].genre).toBe('house');
      expect(patterns[0].id).toBeDefined();
    });
    
    it('should include pattern steps', async () => {
      const patterns = await suggestBassPattern('lofi');
      
      expect(patterns.length).toBeGreaterThan(0);
      const pattern = patterns.find(p => p.steps.length > 0);
      expect(pattern).toBeDefined();
    });
    
    it('should suggest different patterns for different genres', async () => {
      const housePatterns = await suggestBassPattern('house');
      const jazzPatterns = await suggestBassPattern('jazz');
      
      expect(housePatterns.length).toBeGreaterThan(0);
      expect(jazzPatterns.length).toBeGreaterThan(0);
      
      // Different genres should have different pattern IDs
      const houseIds = housePatterns.map(p => p.id);
      const jazzIds = jazzPatterns.map(p => p.id);
      
      // Jazz should have walking bass
      expect(jazzIds.some(id => id.includes('walking'))).toBe(true);
    });
  });

  // ==========================================================================
  // L164: Drum Pattern Suggestion Tests
  // ==========================================================================
  describe('Drum Pattern Suggestions (L164)', () => {
    it('should suggest drum patterns for techno', async () => {
      const patterns = await suggestDrumPattern('techno');
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].genre).toBe('techno');
    });
    
    it('should include kick, snare, hihat hits', async () => {
      const patterns = await suggestDrumPattern('house');
      
      expect(patterns.length).toBeGreaterThan(0);
      const pattern = patterns[0];
      
      expect(pattern.kicks).toBeDefined();
      expect(pattern.snares).toBeDefined();
      expect(pattern.hihats).toBeDefined();
    });
    
    it('should have four-on-floor for house', async () => {
      const patterns = await suggestDrumPattern('house');
      
      const fourOnFloor = patterns.find(p => p.id === 'four_on_floor');
      expect(fourOnFloor).toBeDefined();
      if (fourOnFloor) {
        // Four kicks at 1, 5, 9, 13 (each beat)
        expect(fourOnFloor.kicks).toEqual([1, 5, 9, 13]);
      }
    });
    
    it('should have boom bap for lofi', async () => {
      const patterns = await suggestDrumPattern('lofi');
      
      const boomBap = patterns.find(p => p.id === 'boom_bap');
      expect(boomBap).toBeDefined();
    });
  });

  // ==========================================================================
  // L165: Melody Constraint Tests
  // ==========================================================================
  describe('Melody Constraints (L165)', () => {
    it('should get melodic range for violin', async () => {
      const range = await getMelodicRange('violin');
      
      expect(range).not.toBeNull();
      if (range) {
        expect(range.lowNote).toBe(55);
        expect(range.highNote).toBe(96);
      }
    });
    
    it('should check if note is in range', async () => {
      const inRange = await isNoteInRange('piano', 60); // Middle C
      const outOfRange = await isNoteInRange('bass_guitar', 100); // Way too high
      
      expect(inRange).toBe(true);
      expect(outOfRange).toBe(false);
    });
    
    it('should get chord rhythm for genre', async () => {
      const houseRhythm = await getChordRhythm('house');
      const jazzRhythm = await getChordRhythm('jazz');
      
      expect(houseRhythm).toBe(0.5); // Change every 2 bars
      expect(jazzRhythm).toBe(2);    // 2 changes per bar
    });
  });

  // ==========================================================================
  // Variation Techniques
  // ==========================================================================
  describe('Variation Techniques', () => {
    it('should get variation techniques for jazz', async () => {
      const techniques = await getVariationTechniques('jazz');
      
      expect(techniques.length).toBeGreaterThan(0);
      const techniqueIds = techniques.map(t => t.id);
      expect(techniqueIds).toContain('harmonic_variation');
    });
    
    it('should get variation techniques for classical', async () => {
      const techniques = await getVariationTechniques('classical');
      
      expect(techniques.length).toBeGreaterThan(0);
      const techniqueIds = techniques.map(t => t.id);
      expect(techniqueIds).toContain('sequence');
      expect(techniqueIds).toContain('inversion');
    });
    
    it('should get all variation techniques', async () => {
      const techniques = await getAllVariationTechniques();
      
      expect(techniques.length).toBeGreaterThan(5);
      expect(techniques.some(t => t.id === 'sequence')).toBe(true);
      expect(techniques.some(t => t.description.length > 0)).toBe(true);
    });
  });

  // ==========================================================================
  // Density and Transitions
  // ==========================================================================
  describe('Density and Transitions', () => {
    it('should get density suggestions for chorus', async () => {
      const suggestions = await getDensitySuggestions('chorus');
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.level === 'dense')).toBe(true);
    });
    
    it('should get transition techniques', async () => {
      const techniques = await getTransitionTechniques();
      
      expect(techniques.length).toBeGreaterThan(0);
      expect(techniques.some(t => t.id === 'riser')).toBe(true);
      expect(techniques.some(t => t.id === 'drop')).toBe(true);
    });
  });

  // ==========================================================================
  // Humanization and Feel
  // ==========================================================================
  describe('Humanization and Feel', () => {
    it('should get swing feel for jazz', async () => {
      const swing = await getSwingFeel('jazz');
      
      expect(swing).toBe(0.67); // Triplet swing
    });
    
    it('should get straight feel for rock', async () => {
      const swing = await getSwingFeel('rock');
      
      expect(swing).toBe(0.0);
    });
    
    it('should get humanization params for lofi', async () => {
      const params = await getHumanizationParams('lofi');
      
      expect(params.timing).toBeGreaterThan(0);
      expect(params.velocity).toBeGreaterThan(0);
    });
    
    it('should get minimal humanization for electronic', async () => {
      const params = await getHumanizationParams('electronic');
      
      expect(params.timing).toBe(0);
      expect(params.velocity).toBeLessThanOrEqual(5);
    });
  });

  // ==========================================================================
  // Genre Compatibility
  // ==========================================================================
  describe('Genre Compatibility', () => {
    it('should check genre compatibility', async () => {
      // Genres with same rhythmic feel should be compatible
      const compatible = await areGenresCompatible('house', 'techno');
      
      expect(typeof compatible).toBe('boolean');
    });
    
    it('should get repetition tolerance', async () => {
      const houseTolerance = await getRepetitionTolerance('house');
      const jazzTolerance = await getRepetitionTolerance('jazz');
      
      expect(houseTolerance).toBe('high');
      expect(jazzTolerance).toBe('low');
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================
  describe('Integration Tests', () => {
    it('should support complete composition workflow', async () => {
      const genre: Genre = 'house';
      
      // 1. Get genre info
      const info = await getGenreInfo(genre);
      expect(info).not.toBeNull();
      
      // 2. Get tempo
      const tempo = await suggestTempo(genre);
      expect(tempo).toBeGreaterThan(100);
      
      // 3. Get arrangement
      const arrangement = await suggestArrangement(genre, 128);
      expect(arrangement.length).toBeGreaterThan(0);
      
      // 4. Validate arrangement
      const validation = await validateArrangement(arrangement as SectionType[]);
      expect(validation.valid).toBe(true);
      
      // 5. Get patterns
      const drumPatterns = await suggestDrumPattern(genre);
      const bassPatterns = await suggestBassPattern(genre);
      expect(drumPatterns.length).toBeGreaterThan(0);
      expect(bassPatterns.length).toBeGreaterThan(0);
      
      // 6. Get humanization
      const humanize = await getHumanizationParams(genre);
      expect(typeof humanize.timing).toBe('number');
    });
    
    it('should provide consistent genre data', async () => {
      const genres = await getAllGenres();
      
      // Each genre should have at least basic info
      for (const genre of genres.slice(0, 5)) {
        const info = await getGenreInfo(genre);
        expect(info).not.toBeNull();
        if (info) {
          expect(info.tempoRange.max).toBeGreaterThan(info.tempoRange.min);
        }
      }
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle unknown genre gracefully', async () => {
      const tempo = await suggestTempo('unknown_xyz');
      expect(tempo).toBe(120); // Default
      
      const patterns = await suggestBassPattern('unknown_xyz');
      expect(patterns).toEqual([]);
    });
    
    it('should handle empty section list', async () => {
      const validation = await validateArrangement([]);
      expect(validation.valid).toBe(true);
    });
    
    it('should handle single section', async () => {
      const validation = await validateArrangement(['intro']);
      expect(validation.valid).toBe(true);
    });
    
    it('should handle unknown instrument for range', async () => {
      const range = await getMelodicRange('unknown_instrument');
      expect(range).toBeNull();
    });
  });
});
