/**
 * @fileoverview Harmony Explorer Tests
 * 
 * Tests for the Prolog-based harmony exploration system.
 * 
 * L266-L270: Harmony explorer tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resetPrologAdapter } from '../engine/prolog-adapter';
import { resetMusicTheoryLoader } from '../knowledge/music-theory-loader';
import { resetCompositionPatternsLoader } from '../knowledge/composition-patterns-loader';
import { HarmonyExplorer, createHarmonyExplorer } from './harmony-explorer';

// =============================================================================
// Test Setup
// =============================================================================

describe('HarmonyExplorer', () => {
  beforeEach(() => {
    resetPrologAdapter();
    resetMusicTheoryLoader();
    resetCompositionPatternsLoader();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  // ===========================================================================
  // Creation Tests
  // ===========================================================================
  
  describe('creation', () => {
    it('should create explorer via factory function', () => {
      const explorer = createHarmonyExplorer();
      expect(explorer).toBeInstanceOf(HarmonyExplorer);
    });
    
    it('should create explorer via constructor', () => {
      const explorer = new HarmonyExplorer();
      expect(explorer).toBeInstanceOf(HarmonyExplorer);
    });
  });
  
  // ===========================================================================
  // Chord Suggestion Tests
  // ===========================================================================
  
  describe('suggestNextChords', () => {
    it('should suggest chords after V', async () => {
      const explorer = createHarmonyExplorer();
      
      const suggestions = await explorer.suggestNextChords(
        { root: 'g', quality: 'major' },  // V in C major
        { root: 'c', mode: 'major' }
      );
      
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Should strongly suggest tonic (I)
      const tonicSuggestion = suggestions.find(s => s.numeral === 'I');
      expect(tonicSuggestion).toBeDefined();
      expect(tonicSuggestion!.confidence).toBeGreaterThan(80);
    });
    
    it('should suggest chords after IV', async () => {
      const explorer = createHarmonyExplorer();
      
      const suggestions = await explorer.suggestNextChords(
        { root: 'f', quality: 'major' },  // IV in C major
        { root: 'c', mode: 'major' }
      );
      
      expect(suggestions.length).toBeGreaterThan(0);
    });
    
    it('should include deceptive resolution option after V', async () => {
      const explorer = createHarmonyExplorer();
      
      const suggestions = await explorer.suggestNextChords(
        { root: 'g', quality: 'major' },  // V in C major
        { root: 'c', mode: 'major' }
      );
      
      const viSuggestion = suggestions.find(s => s.numeral === 'vi');
      expect(viSuggestion).toBeDefined();
      // Deceptive resolution should be present
      expect(viSuggestion!.reason.toLowerCase()).toMatch(/deceptive|tonic/);
    });
    
    it('should limit suggestions to requested count', async () => {
      const explorer = createHarmonyExplorer();
      
      const suggestions = await explorer.suggestNextChords(
        { root: 'c', quality: 'major' },
        { root: 'c', mode: 'major' },
        { count: 3 }
      );
      
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });
  
  // ===========================================================================
  // Chord Analysis Tests
  // ===========================================================================
  
  describe('analyzeChord', () => {
    it('should identify I chord correctly', async () => {
      const explorer = createHarmonyExplorer();
      
      const analysis = await explorer.analyzeChord(
        { root: 'c', quality: 'major' },
        { root: 'c', mode: 'major' }
      );
      
      expect(analysis.numeral).toBe('I');
      expect(analysis.degree).toBe(1);
      expect(analysis.function).toBe('tonic');
      expect(analysis.isDiatonic).toBe(true);
    });
    
    it('should identify V chord correctly', async () => {
      const explorer = createHarmonyExplorer();
      
      const analysis = await explorer.analyzeChord(
        { root: 'g', quality: 'major' },
        { root: 'c', mode: 'major' }
      );
      
      expect(analysis.numeral).toBe('V');
      expect(analysis.degree).toBe(5);
      expect(analysis.function).toBe('dominant');
      expect(analysis.isDiatonic).toBe(true);
    });
    
    it('should identify ii chord correctly', async () => {
      const explorer = createHarmonyExplorer();
      
      const analysis = await explorer.analyzeChord(
        { root: 'd', quality: 'minor' },
        { root: 'c', mode: 'major' }
      );
      
      expect(analysis.numeral).toBe('ii');
      expect(analysis.degree).toBe(2);
      expect(analysis.function).toBe('subdominant');
      expect(analysis.isDiatonic).toBe(true);
    });
    
    it('should identify minor key chords', async () => {
      const explorer = createHarmonyExplorer();
      
      const analysis = await explorer.analyzeChord(
        { root: 'a', quality: 'minor' },
        { root: 'a', mode: 'minor' }
      );
      
      expect(analysis.numeral).toBe('i');
      expect(analysis.degree).toBe(1);
      expect(analysis.function).toBe('tonic');
    });
    
    it('should include tension level', async () => {
      const explorer = createHarmonyExplorer();
      
      const tonicAnalysis = await explorer.analyzeChord(
        { root: 'c', quality: 'major' },
        { root: 'c', mode: 'major' }
      );
      
      const dominantAnalysis = await explorer.analyzeChord(
        { root: 'g', quality: 'major' },
        { root: 'c', mode: 'major' }
      );
      
      // Dominant should have higher tension than tonic
      expect(dominantAnalysis.tension).toBeGreaterThan(tonicAnalysis.tension);
    });
  });
  
  // ===========================================================================
  // Progression Analysis Tests
  // ===========================================================================
  
  describe('analyzeProgression', () => {
    it('should analyze I-V-vi-IV progression', async () => {
      const explorer = createHarmonyExplorer();
      
      const analysis = await explorer.analyzeProgression([
        { root: 'c', quality: 'major' },
        { root: 'g', quality: 'major' },
        { root: 'a', quality: 'minor' },
        { root: 'f', quality: 'major' }
      ]);
      
      // Key detection may vary, but analysis should work
      expect(analysis.chordAnalyses.length).toBe(4);
      // Check structure is correct
      expect(analysis.key).toHaveProperty('root');
      expect(analysis.key).toHaveProperty('mode');
      expect(analysis.keyConfidence).toBeGreaterThan(0);
    });
    
    it('should detect authentic cadence', async () => {
      const explorer = createHarmonyExplorer();
      
      const analysis = await explorer.analyzeProgression([
        { root: 'd', quality: 'minor' },  // ii
        { root: 'g', quality: 'major' },  // V
        { root: 'c', quality: 'major' }   // I
      ]);
      
      expect(analysis.cadences.some(c => c.includes('Authentic'))).toBe(true);
    });
    
    it('should detect plagal cadence', async () => {
      const explorer = createHarmonyExplorer();
      
      const analysis = await explorer.analyzeProgression([
        { root: 'g', quality: 'major' },  // V
        { root: 'f', quality: 'major' },  // IV
        { root: 'c', quality: 'major' }   // I
      ]);
      
      expect(analysis.cadences.some(c => c.includes('Plagal'))).toBe(true);
    });
    
    it('should return summary', async () => {
      const explorer = createHarmonyExplorer();
      
      const analysis = await explorer.analyzeProgression([
        { root: 'c', quality: 'major' },
        { root: 'f', quality: 'major' }
      ]);
      
      expect(analysis.summary).toBeTruthy();
      // Summary should contain key info
      expect(analysis.summary).toMatch(/[A-G]/); // Contains a note name
      expect(analysis.summary).toMatch(/major|minor/);
    });
    
    it('should handle empty progression', async () => {
      const explorer = createHarmonyExplorer();
      
      const analysis = await explorer.analyzeProgression([]);
      
      expect(analysis.chordAnalyses).toEqual([]);
      expect(analysis.summary).toContain('No chords');
    });
  });
  
  // ===========================================================================
  // Key Detection Tests
  // ===========================================================================
  
  describe('identifyKey', () => {
    it('should identify major key from scale tones', async () => {
      const explorer = createHarmonyExplorer();
      
      // C major scale notes: C D E F G A B
      const key = await explorer.identifyKey([0, 2, 4, 5, 7, 9, 11]);
      
      // Algorithm may identify C major or its relative A minor
      expect(['c', 'a']).toContain(key.root);
      expect(['major', 'minor']).toContain(key.mode);
    });
    
    it('should identify key from A minor scale', async () => {
      const explorer = createHarmonyExplorer();
      
      // A minor scale notes: A B C D E F G
      const key = await explorer.identifyKey([9, 11, 0, 2, 4, 5, 7]);
      
      // May identify as A minor or C major (relative)
      expect(['a', 'c']).toContain(key.root);
    });
    
    it('should return valid key structure', async () => {
      const explorer = createHarmonyExplorer();
      
      // G major scale: G A B C D E F#
      const key = await explorer.identifyKey([7, 9, 11, 0, 2, 4, 6]);
      
      expect(key).toHaveProperty('root');
      expect(key).toHaveProperty('mode');
      expect(['major', 'minor']).toContain(key.mode);
    });
  });
  
  // ===========================================================================
  // Reharmonization Tests
  // ===========================================================================
  
  describe('suggestReharmonization', () => {
    it('should suggest tritone substitution for dominant', async () => {
      const explorer = createHarmonyExplorer();
      
      const suggestions = await explorer.suggestReharmonization(
        [60, 62, 64],  // melody (not used in this implementation)
        [{ root: 'g', quality: 'dom7' }],  // V7
        { root: 'c', mode: 'major' }
      );
      
      const tritonesSub = suggestions.find(s => s.substitutionType === 'tritone');
      expect(tritonesSub).toBeDefined();
      expect(tritonesSub!.replacement.root).toBe('csharp'); // Db enharmonic
    });
    
    it('should suggest relative minor substitution', async () => {
      const explorer = createHarmonyExplorer();
      
      const suggestions = await explorer.suggestReharmonization(
        [60],
        [{ root: 'f', quality: 'major' }],  // IV
        { root: 'c', mode: 'major' }
      );
      
      const relativeSub = suggestions.find(s => s.substitutionType === 'relative');
      expect(relativeSub).toBeDefined();
      expect(relativeSub!.replacement.quality).toBe('minor');
    });
    
    it('should include explanation for suggestions', async () => {
      const explorer = createHarmonyExplorer();
      
      const suggestions = await explorer.suggestReharmonization(
        [],
        [{ root: 'g', quality: 'dom7' }],
        { root: 'c', mode: 'major' }
      );
      
      for (const suggestion of suggestions) {
        expect(suggestion.explanation).toBeTruthy();
      }
    });
  });
  
  // ===========================================================================
  // Modulation Tests
  // ===========================================================================
  
  describe('suggestModulation', () => {
    it('should suggest modulation path for close keys', async () => {
      const explorer = createHarmonyExplorer();
      
      const path = await explorer.suggestModulation(
        { root: 'c', mode: 'major' },
        { root: 'g', mode: 'major' }
      );
      
      expect(path.targetKey.root).toBe('g');
      expect(path.pivotChords.length).toBeGreaterThan(0);
      expect(path.steps.length).toBeGreaterThan(0);
    });
    
    it('should suggest parallel mode change', async () => {
      const explorer = createHarmonyExplorer();
      
      const path = await explorer.suggestModulation(
        { root: 'c', mode: 'major' },
        { root: 'c', mode: 'minor' }
      );
      
      expect(path.targetKey.mode).toBe('minor');
      expect(path.steps.some(s => s.toLowerCase().includes('parallel'))).toBe(true);
    });
    
    it('should suggest path for distant modulation', async () => {
      const explorer = createHarmonyExplorer();
      
      const path = await explorer.suggestModulation(
        { root: 'c', mode: 'major' },
        { root: 'fsharp', mode: 'major' }  // Tritone away
      );
      
      expect(path.pivotChords.length).toBeGreaterThan(0);
      expect(path.steps.length).toBeGreaterThan(0);
    });
  });
  
  // ===========================================================================
  // Voice Leading Score Tests
  // ===========================================================================
  
  describe('scoreVoiceLeading', () => {
    it('should score perfect fifth movement highly', async () => {
      const explorer = createHarmonyExplorer();
      
      const score = await explorer.scoreVoiceLeading(
        { root: 'c', quality: 'major' },
        { root: 'g', quality: 'major' }
      );
      
      expect(score).toBeGreaterThanOrEqual(85);
    });
    
    it('should score third movement well', async () => {
      const explorer = createHarmonyExplorer();
      
      const score = await explorer.scoreVoiceLeading(
        { root: 'c', quality: 'major' },
        { root: 'e', quality: 'minor' }
      );
      
      expect(score).toBeGreaterThanOrEqual(80);
    });
    
    it('should score tritone movement lower', async () => {
      const explorer = createHarmonyExplorer();
      
      const score = await explorer.scoreVoiceLeading(
        { root: 'c', quality: 'major' },
        { root: 'fsharp', quality: 'major' }
      );
      
      expect(score).toBeLessThan(80);
    });
    
    it('should return score between 0 and 100', async () => {
      const explorer = createHarmonyExplorer();
      
      const score = await explorer.scoreVoiceLeading(
        { root: 'c', quality: 'major' },
        { root: 'd', quality: 'minor' }
      );
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
  
  // ===========================================================================
  // Performance Tests
  // ===========================================================================
  
  describe('performance', () => {
    it('should complete chord suggestions quickly', async () => {
      const explorer = createHarmonyExplorer();
      
      // Warm up KB + Prolog engine (first call includes KB load time)
      await explorer.suggestNextChords(
        { root: 'c', quality: 'major' },
        { root: 'c', mode: 'major' }
      );

      const start = performance.now();
      
      await explorer.suggestNextChords(
        { root: 'g', quality: 'major' },
        { root: 'c', mode: 'major' }
      );
      
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100); // Should be fast after KB is loaded
    });
    
    it('should analyze long progression in reasonable time', async () => {
      const explorer = createHarmonyExplorer();
      
      const chords = [];
      for (let i = 0; i < 32; i++) {
        chords.push({ 
          root: ['c', 'f', 'g', 'a'][i % 4], 
          quality: i % 4 === 3 ? 'minor' : 'major' 
        });
      }
      
      const start = performance.now();
      
      await explorer.analyzeProgression(chords);
      
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(500);
    });
  });
});
