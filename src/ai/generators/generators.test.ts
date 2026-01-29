/**
 * @fileoverview Generator Tests
 * 
 * Tests for all Prolog-powered music generators.
 * 
 * L201-L210: Generator test suite
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPrologAdapter, resetPrologAdapter } from '../engine/prolog-adapter';
import { resetMusicTheoryLoader } from '../knowledge/music-theory-loader';
import { resetCompositionPatternsLoader } from '../knowledge/composition-patterns-loader';

import { BassGenerator, createBassGenerator } from './bass-generator';
import { MelodyGenerator, createMelodyGenerator } from './melody-generator';
import { DrumGenerator, createDrumGenerator } from './drum-generator';
import { ChordGenerator, createChordGenerator } from './chord-generator';
import { ArpeggioGenerator, createArpeggioGenerator } from './arpeggio-generator';

// =============================================================================
// Test Setup
// =============================================================================

describe('Generators', () => {
  beforeEach(() => {
    resetPrologAdapter();
    resetMusicTheoryLoader();
    resetCompositionPatternsLoader();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  // ===========================================================================
  // Bass Generator Tests
  // ===========================================================================
  
  describe('BassGenerator', () => {
    it('should create bass generator via factory function', () => {
      const generator = createBassGenerator();
      expect(generator).toBeInstanceOf(BassGenerator);
    });
    
    it('should generate bass line for chord progression', async () => {
      const generator = createBassGenerator();
      
      const result = await generator.generate([
        { root: 'c', quality: 'major', start: 0, duration: 1920 },
        { root: 'g', quality: 'major', start: 1920, duration: 1920 }
      ], { genre: 'pop' });
      
      expect(result.events).toBeDefined();
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.genre).toBe('pop');
    });
    
    it('should generate notes with correct MIDI pitches', async () => {
      const generator = createBassGenerator();
      
      const result = await generator.generate([
        { root: 'c', quality: 'major', start: 0, duration: 480 }
      ], { octave: 2 });
      
      // C2 should be MIDI note 36
      expect(result.events.some(e => e.pitch === 36)).toBe(true);
    });
    
    it('should respect velocity option', async () => {
      const generator = createBassGenerator();
      
      const result = await generator.generate([
        { root: 'c', quality: 'major', start: 0, duration: 480 }
      ], { velocity: 80, variation: 0 });
      
      expect(result.events.every(e => e.velocity === 80)).toBe(true);
    });
    
    it('should generate reproducible results with seed', async () => {
      const generator = createBassGenerator();
      
      const result1 = await generator.generate([
        { root: 'c', quality: 'major', start: 0, duration: 960 }
      ], { seed: 12345, variation: 0.5 });
      
      const result2 = await generator.generate([
        { root: 'c', quality: 'major', start: 0, duration: 960 }
      ], { seed: 12345, variation: 0.5 });
      
      expect(result1.events.length).toBe(result2.events.length);
      expect(result1.events.map(e => e.pitch)).toEqual(result2.events.map(e => e.pitch));
    });
    
    it('should get available patterns for genre', async () => {
      const generator = createBassGenerator();
      
      const patterns = await generator.getAvailablePatterns('house');
      expect(patterns).toBeDefined();
      // May or may not have patterns depending on KB state
    });
    
    it('should handle minor chord quality', async () => {
      const generator = createBassGenerator();
      
      const result = await generator.generate([
        { root: 'a', quality: 'minor', start: 0, duration: 480 }
      ], { octave: 2 });
      
      expect(result.events.length).toBeGreaterThan(0);
      // A2 should be MIDI note 45
      expect(result.events.some(e => e.pitch === 45)).toBe(true);
    });
  });
  
  // ===========================================================================
  // Melody Generator Tests
  // ===========================================================================
  
  describe('MelodyGenerator', () => {
    it('should create melody generator via factory function', () => {
      const generator = createMelodyGenerator();
      expect(generator).toBeInstanceOf(MelodyGenerator);
    });
    
    it('should generate melody for chord progression', async () => {
      const generator = createMelodyGenerator();
      
      const result = await generator.generate(
        [{ root: 'c', quality: 'major', start: 0, duration: 1920 }],
        { root: 'c', scale: 'major' },
        { genre: 'pop', density: 0.5 }
      );
      
      expect(result.events).toBeDefined();
      expect(result.genre).toBe('pop');
      expect(result.scale.root).toBe('c');
    });
    
    it('should generate notes within reasonable range', async () => {
      const generator = createMelodyGenerator();
      
      const result = await generator.generate(
        [{ root: 'c', quality: 'major', start: 0, duration: 960 }],
        { root: 'c', scale: 'major' },
        { octave: 4 }
      );
      
      // All notes should be in reasonable piano range
      expect(result.events.every(e => e.pitch >= 48 && e.pitch <= 84)).toBe(true);
    });
    
    it('should respect density parameter', async () => {
      const generator = createMelodyGenerator();
      
      const sparse = await generator.generate(
        [{ root: 'c', quality: 'major', start: 0, duration: 1920 }],
        { root: 'c', scale: 'major' },
        { density: 0.2, seed: 100 }
      );
      
      const dense = await generator.generate(
        [{ root: 'c', quality: 'major', start: 0, duration: 1920 }],
        { root: 'c', scale: 'major' },
        { density: 0.9, seed: 100 }
      );
      
      expect(dense.events.length).toBeGreaterThanOrEqual(sparse.events.length);
    });
    
    it('should generate motif', async () => {
      const generator = createMelodyGenerator();
      
      const motif = await generator.generateMotif(
        { root: 'c', scale: 'major' },
        2, // 2 beats
        { seed: 42 }
      );
      
      expect(motif.length).toBeGreaterThan(0);
    });
    
    it('should apply transposition variation', async () => {
      const generator = createMelodyGenerator();
      
      const original = [
        { pitch: 60, start: 0, duration: 240, velocity: 100 },
        { pitch: 64, start: 240, duration: 240, velocity: 100 }
      ];
      
      const varied = await generator.applyVariation(original, 'transposition', 0.7);
      
      expect(varied.length).toBe(original.length);
      // Pitches should be different after transposition
    });
    
    it('should apply inversion variation', async () => {
      const generator = createMelodyGenerator();
      
      const original = [
        { pitch: 60, start: 0, duration: 240, velocity: 100 },
        { pitch: 64, start: 240, duration: 240, velocity: 100 }
      ];
      
      const varied = await generator.applyVariation(original, 'inversion');
      
      expect(varied.length).toBe(original.length);
      expect(varied[0].pitch).toBe(60); // First note stays as axis
      expect(varied[1].pitch).toBe(56); // 4 semitones below axis
    });
    
    it('should apply retrograde variation', async () => {
      const generator = createMelodyGenerator();
      
      const original = [
        { pitch: 60, start: 0, duration: 240, velocity: 100 },
        { pitch: 64, start: 240, duration: 240, velocity: 100 }
      ];
      
      const varied = await generator.applyVariation(original, 'retrograde');
      
      expect(varied.length).toBe(original.length);
      // Order should be reversed
      expect(varied[0].pitch).toBe(64);
      expect(varied[1].pitch).toBe(60);
    });
  });
  
  // ===========================================================================
  // Drum Generator Tests
  // ===========================================================================
  
  describe('DrumGenerator', () => {
    it('should create drum generator via factory function', () => {
      const generator = createDrumGenerator();
      expect(generator).toBeInstanceOf(DrumGenerator);
    });
    
    it('should generate drum pattern', async () => {
      const generator = createDrumGenerator();
      
      const result = await generator.generate({ genre: 'rock', bars: 1 });
      
      expect(result.events).toBeDefined();
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.genre).toBe('rock');
    });
    
    it('should generate correct GM drum pitches', async () => {
      const generator = createDrumGenerator();
      
      const result = await generator.generate({ genre: 'rock', bars: 1 });
      
      // Check for kick (36) and snare (38)
      const hasKick = result.events.some(e => e.pitch === 36);
      const hasSnare = result.events.some(e => e.pitch === 38);
      
      expect(hasKick).toBe(true);
      expect(hasSnare).toBe(true);
    });
    
    it('should generate multiple bars', async () => {
      const generator = createDrumGenerator();
      
      const oneBar = await generator.generate({ bars: 1, seed: 1 });
      const fourBars = await generator.generate({ bars: 4, seed: 1 });
      
      expect(fourBars.events.length).toBe(oneBar.events.length * 4);
    });
    
    it('should apply humanization', async () => {
      const generator = createDrumGenerator();
      
      const perfect = await generator.generate({ humanize: 0, seed: 100 });
      const humanized = await generator.generate({ humanize: 0.5, seed: 100 });
      
      // Events should exist in both
      expect(perfect.events.length).toBe(humanized.events.length);
      
      // Humanized should have slight timing/velocity variations
      // (exact values depend on implementation)
    });
    
    it('should generate fill pattern', async () => {
      const generator = createDrumGenerator();
      
      const fill = await generator.generateFill(1, { seed: 42 });
      
      expect(fill.length).toBeGreaterThan(0);
      // Should end with crash
      const lastEvent = fill[fill.length - 1];
      expect(lastEvent.instrument).toBe('crash');
    });
    
    it('should get available patterns', async () => {
      const generator = createDrumGenerator();
      
      const rockPatterns = await generator.getAvailablePatterns('rock');
      expect(rockPatterns).toContain('basic_rock');
      
      const housePatterns = await generator.getAvailablePatterns('house');
      expect(housePatterns).toContain('four_on_floor');
    });
    
    it('should apply swing', async () => {
      const generator = createDrumGenerator();
      
      const straight = await generator.generate({ swing: 0, seed: 1 });
      const swung = await generator.generate({ swing: 0.5, seed: 1 });
      
      // Off-beat notes should be shifted in swung version
      expect(swung.events.length).toBe(straight.events.length);
    });
  });
  
  // ===========================================================================
  // Chord Generator Tests
  // ===========================================================================
  
  describe('ChordGenerator', () => {
    it('should create chord generator via factory function', () => {
      const generator = createChordGenerator();
      expect(generator).toBeInstanceOf(ChordGenerator);
    });
    
    it('should generate chord progression', async () => {
      const generator = createChordGenerator();
      
      const result = await generator.generate(
        { root: 'c', mode: 'major' },
        { genre: 'pop', length: 4 }
      );
      
      expect(result.chords).toBeDefined();
      expect(result.chords.length).toBe(4);
      expect(result.key.root).toBe('c');
    });
    
    it('should generate correct chord roots', async () => {
      const generator = createChordGenerator();
      
      const result = await generator.generate(
        { root: 'c', mode: 'major' },
        { length: 4, seed: 12345 }
      );
      
      // All roots should be valid note names
      const validNotes = ['c', 'csharp', 'd', 'dsharp', 'e', 'f', 'fsharp', 'g', 'gsharp', 'a', 'asharp', 'b'];
      expect(result.chords.every(c => validNotes.includes(c.root))).toBe(true);
    });
    
    it('should include roman numeral analysis', async () => {
      const generator = createChordGenerator();
      
      const result = await generator.generate(
        { root: 'c', mode: 'major' },
        { length: 4 }
      );
      
      // Each chord should have a numeral
      expect(result.chords.every(c => c.numeral.length > 0)).toBe(true);
    });
    
    it('should apply cadence', async () => {
      const generator = createChordGenerator();
      
      const result = await generator.generate(
        { root: 'c', mode: 'major' },
        { length: 4, cadence: 'authentic', seed: 100 }
      );
      
      // Last two chords should be V-I
      expect(result.chords[2].numeral).toBe('V');
      expect(result.chords[3].numeral).toBe('I');
    });
    
    it('should handle minor mode', async () => {
      const generator = createChordGenerator();
      
      const result = await generator.generate(
        { root: 'a', mode: 'minor' },
        { length: 4 }
      );
      
      // Should use minor numerals
      expect(result.key.mode).toBe('minor');
    });
    
    it('should suggest next chord', async () => {
      const generator = createChordGenerator();
      
      const suggestions = await generator.suggestNextChord('V', { root: 'c', mode: 'major' });
      
      // V typically resolves to I (tonic)
      expect(suggestions).toContain('I');
    });
    
    it('should analyze chord progression', async () => {
      const generator = createChordGenerator();
      
      const analysis = await generator.analyzeProgression(
        [
          { root: 'c', quality: 'major' },
          { root: 'g', quality: 'major' },
          { root: 'a', quality: 'minor' },
          { root: 'f', quality: 'major' }
        ],
        { root: 'c', mode: 'major' }
      );
      
      expect(analysis.numerals).toEqual(['I', 'V', 'vi', 'IV']);
      expect(analysis.isValid).toBe(true);
    });
    
    it('should add extensions when requested', async () => {
      const generator = createChordGenerator();
      
      const result = await generator.generate(
        { root: 'c', mode: 'major' },
        { length: 4, useExtensions: true, seed: 42 }
      );
      
      // Should have some 7th chords
      const hasExtensions = result.chords.some(c => 
        c.quality.includes('7') || c.quality.includes('maj7') || c.quality.includes('min7')
      );
      expect(hasExtensions).toBe(true);
    });
  });
  
  // ===========================================================================
  // Arpeggio Generator Tests
  // ===========================================================================
  
  describe('ArpeggioGenerator', () => {
    it('should create arpeggio generator via factory function', () => {
      const generator = createArpeggioGenerator();
      expect(generator).toBeInstanceOf(ArpeggioGenerator);
    });
    
    it('should generate ascending arpeggio', async () => {
      const generator = createArpeggioGenerator();
      
      const result = await generator.generate(
        { root: 'c', quality: 'major', start: 0, duration: 1920 },
        { pattern: 'up' }
      );
      
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.pattern).toBe('up');
      
      // Notes should generally ascend
      const pitches = result.events.map(e => e.pitch);
      for (let i = 1; i < Math.min(pitches.length, 4); i++) {
        expect(pitches[i]).toBeGreaterThanOrEqual(pitches[i-1]);
      }
    });
    
    it('should generate descending arpeggio', async () => {
      const generator = createArpeggioGenerator();
      
      const result = await generator.generate(
        { root: 'c', quality: 'major', start: 0, duration: 480 },
        { pattern: 'down', octaveRange: 1 }
      );
      
      expect(result.pattern).toBe('down');
    });
    
    it('should generate chord pattern (all notes together)', async () => {
      const generator = createArpeggioGenerator();
      
      const result = await generator.generate(
        { root: 'c', quality: 'major', start: 0, duration: 960 },
        { pattern: 'chord' }
      );
      
      // All notes should start at the same time
      expect(result.events.every(e => e.start === 0)).toBe(true);
    });
    
    it('should generate alberti bass pattern', async () => {
      const generator = createArpeggioGenerator();
      
      const result = await generator.generate(
        { root: 'c', quality: 'major', start: 0, duration: 1920 },
        { pattern: 'alberti' }
      );
      
      expect(result.pattern).toBe('alberti');
      expect(result.events.length).toBeGreaterThan(0);
    });
    
    it('should respect octave range', async () => {
      const generator = createArpeggioGenerator();
      
      const oneOctave = await generator.generate(
        { root: 'c', quality: 'major', start: 0, duration: 1920 },
        { octaveRange: 1 }
      );
      
      const twoOctaves = await generator.generate(
        { root: 'c', quality: 'major', start: 0, duration: 1920 },
        { octaveRange: 2 }
      );
      
      // Two octaves should have more unique pitches
      const uniqueOne = new Set(oneOctave.events.map(e => e.pitch)).size;
      const uniqueTwo = new Set(twoOctaves.events.map(e => e.pitch)).size;
      
      expect(uniqueTwo).toBeGreaterThan(uniqueOne);
    });
    
    it('should generate for chord progression', async () => {
      const generator = createArpeggioGenerator();
      
      const events = await generator.generateProgression([
        { root: 'c', quality: 'major', start: 0, duration: 960 },
        { root: 'f', quality: 'major', start: 960, duration: 960 }
      ], { pattern: 'up' });
      
      expect(events.length).toBeGreaterThan(0);
      
      // Should have notes in both chord regions
      const firstChordNotes = events.filter(e => e.start < 960);
      const secondChordNotes = events.filter(e => e.start >= 960);
      
      expect(firstChordNotes.length).toBeGreaterThan(0);
      expect(secondChordNotes.length).toBeGreaterThan(0);
    });
    
    it('should suggest pattern for genre', async () => {
      const generator = createArpeggioGenerator();
      
      const classicalPattern = await generator.suggestPattern('classical');
      expect(classicalPattern).toBe('alberti');
      
      const edmPattern = await generator.suggestPattern('edm');
      expect(edmPattern).toBe('up');
    });
    
    it('should return available patterns', () => {
      const generator = createArpeggioGenerator();
      
      const patterns = generator.getAvailablePatterns();
      
      expect(patterns).toContain('up');
      expect(patterns).toContain('down');
      expect(patterns).toContain('up_down');
      expect(patterns).toContain('alberti');
      expect(patterns).toContain('cascade');
    });
    
    it('should handle extended chords', async () => {
      const generator = createArpeggioGenerator();
      
      const result = await generator.generate(
        { root: 'c', quality: 'maj9', start: 0, duration: 1920 },
        { includeExtensions: true }
      );
      
      expect(result.events.length).toBeGreaterThan(0);
    });
    
    it('should apply velocity curves', async () => {
      const generator = createArpeggioGenerator();
      
      const crescendo = await generator.generate(
        { root: 'c', quality: 'major', start: 0, duration: 960 },
        { velocityCurve: 'crescendo', velocity: 100 }
      );
      
      // Later notes should have higher velocity
      const velocities = crescendo.events.map(e => e.velocity);
      if (velocities.length >= 3) {
        expect(velocities[velocities.length - 1]).toBeGreaterThan(velocities[0]);
      }
    });
  });
});
