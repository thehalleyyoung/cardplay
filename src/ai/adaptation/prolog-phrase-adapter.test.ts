/**
 * @fileoverview Prolog Phrase Adapter Tests
 * 
 * Tests for the Prolog-based phrase adaptation system.
 * 
 * L233-L237: Phrase adaptation tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resetPrologAdapter } from '../engine/prolog-adapter';
import { resetMusicTheoryLoader } from '../knowledge/music-theory-loader';
import { resetPhraseAdaptationLoader } from '../knowledge/phrase-adaptation-loader';
import { PrologPhraseAdapter, createPrologPhraseAdapter, PhraseNote } from './prolog-phrase-adapter';

// =============================================================================
// Test Setup
// =============================================================================

describe('PrologPhraseAdapter', () => {
  beforeEach(() => {
    resetPrologAdapter();
    resetMusicTheoryLoader();
    resetPhraseAdaptationLoader();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  // Sample phrase (C major arpeggio)
  const samplePhrase: PhraseNote[] = [
    { pitch: 60, start: 0, duration: 480, velocity: 100 },   // C4
    { pitch: 64, start: 480, duration: 480, velocity: 100 }, // E4
    { pitch: 67, start: 960, duration: 480, velocity: 100 }, // G4
    { pitch: 72, start: 1440, duration: 480, velocity: 100 } // C5
  ];
  
  // ===========================================================================
  // Creation Tests
  // ===========================================================================
  
  describe('creation', () => {
    it('should create adapter via factory function', () => {
      const adapter = createPrologPhraseAdapter();
      expect(adapter).toBeInstanceOf(PrologPhraseAdapter);
    });
    
    it('should create adapter via constructor', () => {
      const adapter = new PrologPhraseAdapter();
      expect(adapter).toBeInstanceOf(PrologPhraseAdapter);
    });
  });
  
  // ===========================================================================
  // Transpose Mode Tests
  // ===========================================================================
  
  describe('transpose mode', () => {
    it('should transpose phrase by interval', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const result = await adapter.adaptToChord(
        samplePhrase,
        { root: 'c', quality: 'major' },
        { root: 'g', quality: 'major' },
        { mode: 'transpose' }
      );
      
      expect(result.notes.length).toBe(samplePhrase.length);
      expect(result.mode).toBe('transpose');
      
      // G is 7 semitones above C
      expect(result.notes[0].pitch).toBe(67); // G4
      expect(result.notes[1].pitch).toBe(71); // B4
      expect(result.notes[2].pitch).toBe(74); // D5
      expect(result.notes[3].pitch).toBe(79); // G5
    });
    
    it('should maintain rhythm during transposition', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const result = await adapter.adaptToChord(
        samplePhrase,
        { root: 'c', quality: 'major' },
        { root: 'f', quality: 'major' },
        { mode: 'transpose', preserveRhythm: true }
      );
      
      // Durations and timing should be unchanged
      for (let i = 0; i < samplePhrase.length; i++) {
        expect(result.notes[i].start).toBe(samplePhrase[i].start);
        expect(result.notes[i].duration).toBe(samplePhrase[i].duration);
      }
    });
    
    it('should preserve velocity', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const result = await adapter.adaptToChord(
        samplePhrase,
        { root: 'c', quality: 'major' },
        { root: 'd', quality: 'major' },
        { mode: 'transpose' }
      );
      
      for (let i = 0; i < samplePhrase.length; i++) {
        expect(result.notes[i].velocity).toBe(samplePhrase[i].velocity);
      }
    });
  });
  
  // ===========================================================================
  // Chord-Tone Mode Tests
  // ===========================================================================
  
  describe('chord-tone mode', () => {
    it('should map chord tones to target chord', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const result = await adapter.adaptToChord(
        samplePhrase,
        { root: 'c', quality: 'major' },
        { root: 'a', quality: 'minor' },
        { mode: 'chord-tone' }
      );
      
      expect(result.notes.length).toBe(samplePhrase.length);
      expect(result.mode).toBe('chord-tone');
      
      // A minor tones: A, C, E
      const resultPitchClasses = result.notes.map(n => n.pitch % 12);
      for (const pc of resultPitchClasses) {
        expect([9, 0, 4]).toContain(pc); // A, C, E
      }
    });
    
    it('should report quality score', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const result = await adapter.adaptToChord(
        samplePhrase,
        { root: 'c', quality: 'major' },
        { root: 'g', quality: 'major' },
        { mode: 'chord-tone' }
      );
      
      expect(result.quality).toBeGreaterThan(0);
      expect(result.quality).toBeLessThanOrEqual(100);
    });
    
    it('should generate explanation', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const result = await adapter.adaptToChord(
        samplePhrase,
        { root: 'c', quality: 'major' },
        { root: 'f', quality: 'major' },
        { mode: 'chord-tone' }
      );
      
      expect(result.explanation).toBeTruthy();
      expect(result.explanation).toContain('chord tones');
    });
  });
  
  // ===========================================================================
  // Scale-Degree Mode Tests
  // ===========================================================================
  
  describe('scale-degree mode', () => {
    it('should preserve scale degrees', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const result = await adapter.adaptToChord(
        samplePhrase,
        { root: 'c', quality: 'major' },
        { root: 'g', quality: 'major' },
        { mode: 'scale-degree' }
      );
      
      expect(result.notes.length).toBe(samplePhrase.length);
      expect(result.mode).toBe('scale-degree');
      
      // Scale degrees should be preserved in G major
      // C major: C=1, E=3, G=5, C=1
      // G major: G=1, B=3, D=5, G=1
      // So G4, B4, D5, G5
    });
    
    it('should maintain melodic function', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const result = await adapter.adaptToChord(
        samplePhrase,
        { root: 'c', quality: 'major' },
        { root: 'd', quality: 'major' },
        { mode: 'scale-degree' }
      );
      
      expect(result.quality).toBeGreaterThanOrEqual(50);
    });
  });
  
  // ===========================================================================
  // Voice-Leading Mode Tests
  // ===========================================================================
  
  describe('voice-leading mode', () => {
    it('should produce smooth transitions', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const result = await adapter.adaptToChord(
        samplePhrase,
        { root: 'c', quality: 'major' },
        { root: 'f', quality: 'major' },
        { mode: 'voice-leading' }
      );
      
      expect(result.notes.length).toBe(samplePhrase.length);
      expect(result.mode).toBe('voice-leading');
      
      // All notes should be F major chord tones
      const resultPitchClasses = result.notes.map(n => n.pitch % 12);
      for (const pc of resultPitchClasses) {
        expect([5, 9, 0]).toContain(pc); // F, A, C
      }
    });
    
    it('should minimize voice leading distance', async () => {
      const adapter = createPrologPhraseAdapter();
      
      // Start with a high phrase
      const highPhrase: PhraseNote[] = [
        { pitch: 84, start: 0, duration: 480, velocity: 100 }  // C6
      ];
      
      const result = await adapter.adaptToChord(
        highPhrase,
        { root: 'c', quality: 'major' },
        { root: 'f', quality: 'major' },
        { mode: 'voice-leading' }
      );
      
      // Should stay in similar range
      expect(Math.abs(result.notes[0].pitch - 84)).toBeLessThan(12);
    });
  });
  
  // ===========================================================================
  // Contour Preservation Tests
  // ===========================================================================
  
  describe('contour preservation', () => {
    it('should preserve ascending contour', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const result = await adapter.adaptToChord(
        samplePhrase, // Ascending C-E-G-C
        { root: 'c', quality: 'major' },
        { root: 'a', quality: 'minor' },
        { mode: 'chord-tone', preserveContour: true }
      );
      
      // Check that pitch generally increases
      for (let i = 1; i < result.notes.length; i++) {
        expect(result.notes[i].pitch).toBeGreaterThanOrEqual(result.notes[i-1].pitch);
      }
    });
    
    it('should preserve descending contour', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const descendingPhrase: PhraseNote[] = [
        { pitch: 72, start: 0, duration: 480, velocity: 100 },   // C5
        { pitch: 67, start: 480, duration: 480, velocity: 100 }, // G4
        { pitch: 64, start: 960, duration: 480, velocity: 100 }, // E4
        { pitch: 60, start: 1440, duration: 480, velocity: 100 } // C4
      ];
      
      const result = await adapter.adaptToChord(
        descendingPhrase,
        { root: 'c', quality: 'major' },
        { root: 'g', quality: 'major' },
        { mode: 'chord-tone', preserveContour: true }
      );
      
      // Check that pitch generally decreases
      for (let i = 1; i < result.notes.length; i++) {
        expect(result.notes[i].pitch).toBeLessThanOrEqual(result.notes[i-1].pitch);
      }
    });
  });
  
  // ===========================================================================
  // Pitch Range Constraint Tests
  // ===========================================================================
  
  describe('pitch range constraints', () => {
    it('should constrain notes to specified range', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const result = await adapter.adaptToChord(
        samplePhrase,
        { root: 'c', quality: 'major' },
        { root: 'c', quality: 'major' },
        { 
          mode: 'transpose',
          pitchRange: { min: 48, max: 72 } // C3 to C5
        }
      );
      
      for (const note of result.notes) {
        expect(note.pitch).toBeGreaterThanOrEqual(48);
        expect(note.pitch).toBeLessThanOrEqual(72);
      }
    });
  });
  
  // ===========================================================================
  // Similarity Calculation Tests
  // ===========================================================================
  
  describe('similarity calculation', () => {
    it('should calculate high similarity for identical phrases', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const similarity = await adapter.calculateSimilarity(samplePhrase, samplePhrase);
      
      expect(similarity.overall).toBe(100);
      expect(similarity.rhythm).toBe(100);
      expect(similarity.contour).toBe(100);
      expect(similarity.intervals).toBe(100);
    });
    
    it('should calculate lower similarity for different phrases', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const differentPhrase: PhraseNote[] = [
        { pitch: 72, start: 0, duration: 240, velocity: 80 },
        { pitch: 65, start: 240, duration: 240, velocity: 80 }
      ];
      
      const similarity = await adapter.calculateSimilarity(samplePhrase, differentPhrase);
      
      expect(similarity.overall).toBeLessThan(100);
    });
    
    it('should return all similarity components', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const similarity = await adapter.calculateSimilarity(samplePhrase, samplePhrase);
      
      expect(similarity).toHaveProperty('overall');
      expect(similarity).toHaveProperty('rhythm');
      expect(similarity).toHaveProperty('contour');
      expect(similarity).toHaveProperty('intervals');
    });
  });
  
  // ===========================================================================
  // Similar Phrase Search Tests
  // ===========================================================================
  
  describe('similar phrase search', () => {
    it('should find similar phrases above threshold', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const phraseDB = [
        { id: 'exact', notes: samplePhrase },
        { id: 'similar', notes: samplePhrase.map(n => ({ ...n, pitch: n.pitch + 12 })) },
        { id: 'different', notes: [{ pitch: 36, start: 0, duration: 1920, velocity: 50 }] }
      ];
      
      const results = await adapter.findSimilarPhrases(samplePhrase, phraseDB, 80);
      
      expect(results.some(r => r.id === 'exact')).toBe(true);
      // The 'similar' phrase should also match (transposed)
    });
    
    it('should sort results by similarity', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const phraseDB = [
        { id: 'different', notes: [{ pitch: 36, start: 0, duration: 1920, velocity: 50 }] },
        { id: 'exact', notes: samplePhrase }
      ];
      
      const results = await adapter.findSimilarPhrases(samplePhrase, phraseDB, 50);
      
      if (results.length > 1) {
        expect(results[0].similarity.overall).toBeGreaterThanOrEqual(results[1].similarity.overall);
      }
    });
    
    it('should respect threshold', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const phraseDB = [
        { id: 'exact', notes: samplePhrase },
        { id: 'different', notes: [{ pitch: 36, start: 0, duration: 1920, velocity: 50 }] }
      ];
      
      const results = await adapter.findSimilarPhrases(samplePhrase, phraseDB, 90);
      
      for (const result of results) {
        expect(result.similarity.overall).toBeGreaterThanOrEqual(90);
      }
    });

    // L249: Tests for phrase ranking correctness
    it('should rank identical phrases highest', async () => {
      const adapter = createPrologPhraseAdapter();

      const phraseDB = [
        { id: 'identical', notes: samplePhrase },
        { id: 'transposed', notes: samplePhrase.map(n => ({ ...n, pitch: n.pitch + 7 })) },
        { id: 'rhythm-similar', notes: samplePhrase.map(n => ({ ...n, pitch: n.pitch + 2 })) },
        { id: 'different', notes: [{ pitch: 36, start: 0, duration: 1920, velocity: 50 }] }
      ];

      const results = await adapter.findSimilarPhrases(samplePhrase, phraseDB, 50);

      // Identical phrase should be ranked first
      expect(results[0].id).toBe('identical');
      expect(results[0].similarity.overall).toBe(100);
    });

    it('should rank transposed phrases highly', async () => {
      const adapter = createPrologPhraseAdapter();

      const transposed = samplePhrase.map(n => ({ ...n, pitch: n.pitch + 5 }));
      const phraseDB = [
        { id: 'transposed', notes: transposed },
        { id: 'different-contour', notes: [
          { pitch: 60, start: 0, duration: 480, velocity: 100 },
          { pitch: 55, start: 480, duration: 480, velocity: 100 },
          { pitch: 62, start: 960, duration: 480, velocity: 100 },
          { pitch: 50, start: 1440, duration: 480, velocity: 100 }
        ]}
      ];

      const results = await adapter.findSimilarPhrases(samplePhrase, phraseDB, 50);

      // Transposed phrase should rank higher than one with different contour
      const transposedResult = results.find(r => r.id === 'transposed');
      const contourResult = results.find(r => r.id === 'different-contour');

      if (transposedResult && contourResult) {
        expect(transposedResult.similarity.overall).toBeGreaterThan(contourResult.similarity.overall);
        expect(transposedResult.similarity.contour).toBeGreaterThan(80);
      }
    });

    it('should rank phrases with similar rhythm highly', async () => {
      const adapter = createPrologPhraseAdapter();

      const sameRhythm: PhraseNote[] = [
        { pitch: 62, start: 0, duration: 480, velocity: 100 },
        { pitch: 65, start: 480, duration: 480, velocity: 100 },
        { pitch: 69, start: 960, duration: 480, velocity: 100 },
        { pitch: 74, start: 1440, duration: 480, velocity: 100 }
      ];

      const differentRhythm: PhraseNote[] = [
        { pitch: 62, start: 0, duration: 240, velocity: 100 },
        { pitch: 65, start: 240, duration: 240, velocity: 100 },
        { pitch: 69, start: 960, duration: 960, velocity: 100 }
      ];

      const phraseDB = [
        { id: 'same-rhythm', notes: sameRhythm },
        { id: 'different-rhythm', notes: differentRhythm }
      ];

      const results = await adapter.findSimilarPhrases(samplePhrase, phraseDB, 30);

      const sameRhythmResult = results.find(r => r.id === 'same-rhythm');
      const diffRhythmResult = results.find(r => r.id === 'different-rhythm');

      if (sameRhythmResult && diffRhythmResult) {
        expect(sameRhythmResult.similarity.rhythm).toBeGreaterThan(diffRhythmResult.similarity.rhythm);
      }
    });

    it('should rank phrases with similar intervals highly', async () => {
      const adapter = createPrologPhraseAdapter();

      // Same interval pattern (+4, +3, +5) starting from different root
      const sameIntervals: PhraseNote[] = [
        { pitch: 62, start: 0, duration: 480, velocity: 100 },    // D
        { pitch: 66, start: 480, duration: 480, velocity: 100 },  // F# (+4)
        { pitch: 69, start: 960, duration: 480, velocity: 100 },  // A (+3)
        { pitch: 74, start: 1440, duration: 480, velocity: 100 }  // D (+5)
      ];

      // Different interval pattern
      const differentIntervals: PhraseNote[] = [
        { pitch: 60, start: 0, duration: 480, velocity: 100 },
        { pitch: 62, start: 480, duration: 480, velocity: 100 },  // +2
        { pitch: 65, start: 960, duration: 480, velocity: 100 },  // +3
        { pitch: 67, start: 1440, duration: 480, velocity: 100 }  // +2
      ];

      const phraseDB = [
        { id: 'same-intervals', notes: sameIntervals },
        { id: 'different-intervals', notes: differentIntervals }
      ];

      const results = await adapter.findSimilarPhrases(samplePhrase, phraseDB, 30);

      const sameIntResult = results.find(r => r.id === 'same-intervals');
      const diffIntResult = results.find(r => r.id === 'different-intervals');

      if (sameIntResult && diffIntResult) {
        expect(sameIntResult.similarity.intervals).toBeGreaterThan(diffIntResult.similarity.intervals);
      }
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================
  
  describe('edge cases', () => {
    it('should handle empty phrase', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const result = await adapter.adaptToChord(
        [],
        { root: 'c', quality: 'major' },
        { root: 'g', quality: 'major' },
        { mode: 'transpose' }
      );
      
      expect(result.notes).toEqual([]);
      expect(result.quality).toBe(100);
    });
    
    it('should handle single note phrase', async () => {
      const adapter = createPrologPhraseAdapter();
      
      const singleNote: PhraseNote[] = [
        { pitch: 60, start: 0, duration: 480, velocity: 100 }
      ];
      
      const result = await adapter.adaptToChord(
        singleNote,
        { root: 'c', quality: 'major' },
        { root: 'g', quality: 'major' },
        { mode: 'chord-tone' }
      );
      
      expect(result.notes.length).toBe(1);
    });
    
    it('should handle minor to major conversion', async () => {
      const adapter = createPrologPhraseAdapter();
      
      // A minor arpeggio
      const minorPhrase: PhraseNote[] = [
        { pitch: 57, start: 0, duration: 480, velocity: 100 },   // A3
        { pitch: 60, start: 480, duration: 480, velocity: 100 }, // C4
        { pitch: 64, start: 960, duration: 480, velocity: 100 }  // E4
      ];
      
      const result = await adapter.adaptToChord(
        minorPhrase,
        { root: 'a', quality: 'minor' },
        { root: 'a', quality: 'major' },
        { mode: 'chord-tone' }
      );
      
      expect(result.notes.length).toBe(3);
      // A major tones: A, C#, E
      const pitchClasses = result.notes.map(n => n.pitch % 12);
      expect(pitchClasses).toContain(9);  // A
      expect(pitchClasses).toContain(1);  // C#
      expect(pitchClasses).toContain(4);  // E
    });
  });
  
  // ===========================================================================
  // Performance Tests
  // ===========================================================================
  
  describe('performance', () => {
    it('should complete adaptation in reasonable time', async () => {
      const adapter = createPrologPhraseAdapter();
      
      // Create a longer phrase
      const longPhrase: PhraseNote[] = [];
      for (let i = 0; i < 32; i++) {
        longPhrase.push({
          pitch: 60 + (i % 12),
          start: i * 120,
          duration: 120,
          velocity: 100
        });
      }
      
      const start = performance.now();
      
      await adapter.adaptToChord(
        longPhrase,
        { root: 'c', quality: 'major' },
        { root: 'g', quality: 'major' },
        { mode: 'chord-tone' }
      );
      
      const duration = performance.now() - start;

      // Should complete in less than 1000ms (generous for CI variability)
      expect(duration).toBeLessThan(1000);
    });
  });
});
