/**
 * @fileoverview Tests for Music Theory Knowledge Base
 * 
 * Tests for L059-L062 and L077: Music theory queries
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { createPrologAdapter, resetPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';
import { resetMusicTheoryLoader } from '../knowledge/music-theory-loader';
import {
  getScaleNotes,
  getChordTones,
  suggestNextChord,
  checkVoiceLeading,
  transposeNote,
  transposeNotes,
  identifyChord,
  identifyScale,
  getInterval,
  getNoteDistance,
  invertInterval,
  areEnharmonic,
  getTension,
  getHarmonicFunction,
  getDiatonicChord,
  isSmoothMotion,
  isNoteInScale,
  isChordTone,
} from '../queries/theory-queries';

describe('Music Theory Knowledge Base', () => {
  let adapter: PrologAdapter;
  
  beforeEach(() => {
    resetMusicTheoryLoader();
    resetPrologAdapter();
    adapter = createPrologAdapter({ enableCache: false });
  });
  
  afterEach(() => {
    resetPrologAdapter();
  });
  
  // L059: Scale notes tests
  describe('L059: Scale Notes', () => {
    it('should return C major scale notes', async () => {
      const notes = await getScaleNotes('c', 'major', adapter);
      expect(notes).toEqual(['c', 'd', 'e', 'f', 'g', 'a', 'b']);
    });
    
    it('should return G major scale notes', async () => {
      const notes = await getScaleNotes('g', 'major', adapter);
      expect(notes).toHaveLength(7);
      expect(notes[0]).toBe('g');
      expect(notes).toContain('fsharp');
    });
    
    it('should return A natural minor scale notes', async () => {
      const notes = await getScaleNotes('a', 'natural_minor', adapter);
      expect(notes).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    });
    
    it('should return C pentatonic major notes', async () => {
      const notes = await getScaleNotes('c', 'pentatonic_major', adapter);
      expect(notes).toHaveLength(5);
      expect(notes).toEqual(['c', 'd', 'e', 'g', 'a']);
    });
    
    it('should return D dorian mode notes', async () => {
      const notes = await getScaleNotes('d', 'dorian', adapter);
      expect(notes).toHaveLength(7);
      // D Dorian: D E F G A B C
      expect(notes[0]).toBe('d');
    });
  });
  
  // L060: Chord tones tests
  describe('L060: Chord Tones', () => {
    it('should return C major chord tones', async () => {
      const notes = await getChordTones('c', 'major', adapter);
      expect(notes).toEqual(['c', 'e', 'g']);
    });
    
    it('should return A minor chord tones', async () => {
      const notes = await getChordTones('a', 'minor', adapter);
      expect(notes).toEqual(['a', 'c', 'e']);
    });
    
    it('should return G7 chord tones', async () => {
      const notes = await getChordTones('g', 'dominant7', adapter);
      expect(notes).toEqual(['g', 'b', 'd', 'f']);
    });
    
    it('should return Cmaj7 chord tones', async () => {
      const notes = await getChordTones('c', 'major7', adapter);
      expect(notes).toEqual(['c', 'e', 'g', 'b']);
    });
    
    it('should return F diminished chord tones', async () => {
      const notes = await getChordTones('f', 'diminished', adapter);
      // F dim: F Ab Cb (enharmonic: F Ab B)
      expect(notes).toHaveLength(3);
      expect(notes[0]).toBe('f');
    });
  });
  
  // L061: Chord progression suggestions
  describe('L061: Chord Progression Suggestions', () => {
    it('should suggest chords after tonic (I)', async () => {
      const suggestions = await suggestNextChord(1, 'major', adapter);
      // Tonic can go to subdominant or dominant
      expect(suggestions.length).toBeGreaterThan(0);
      const degrees = suggestions.map(s => s.degree);
      // Should suggest IV (subdominant) or V (dominant)
      expect(degrees.some(d => d === 4 || d === 5)).toBe(true);
    });
    
    it('should suggest tonic after dominant (V)', async () => {
      const suggestions = await suggestNextChord(5, 'major', adapter);
      expect(suggestions.length).toBeGreaterThan(0);
      // Dominant should resolve to tonic
      const degrees = suggestions.map(s => s.degree);
      expect(degrees).toContain(1);
    });
  });
  
  // L062: Voice leading checks
  describe('L062: Voice Leading', () => {
    it('should find common tones between C and Am', async () => {
      const hasGoodVL = await checkVoiceLeading('c', 'major', 'a', 'minor', adapter);
      // C major (C E G) and A minor (A C E) share C and E
      expect(hasGoodVL).toBe(true);
    });
    
    it('should find common tones between C and F', async () => {
      const hasGoodVL = await checkVoiceLeading('c', 'major', 'f', 'major', adapter);
      // C major (C E G) and F major (F A C) share C
      expect(hasGoodVL).toBe(true);
    });
    
    it('should detect smooth motion between adjacent notes', async () => {
      const smooth = await isSmoothMotion('c', 'd', adapter);
      expect(smooth).toBe(true);
    });
    
    it('should detect non-smooth motion for large jumps', async () => {
      const smooth = await isSmoothMotion('c', 'g', adapter);
      // C to G is 7 semitones (or 5 down), not smooth
      expect(smooth).toBe(false);
    });
  });
  
  // Transposition tests
  describe('Transposition', () => {
    it('should transpose C up by 2 semitones to D', async () => {
      const result = await transposeNote('c', 2, adapter);
      expect(result).toBe('d');
    });
    
    it('should transpose G up by 5 semitones to C', async () => {
      const result = await transposeNote('g', 5, adapter);
      expect(result).toBe('c');
    });
    
    it('should transpose A down by 3 semitones to F#', async () => {
      const result = await transposeNote('a', -3, adapter);
      expect(result).toBe('fsharp');
    });
    
    it('should transpose multiple notes', async () => {
      const notes = await transposeNotes(['c', 'e', 'g'], 2, adapter);
      expect(notes).toEqual(['d', 'fsharp', 'a']);
    });
  });
  
  // Interval tests
  describe('Intervals', () => {
    it('should identify major third between C and E', async () => {
      const interval = await getInterval('c', 'e', adapter);
      expect(interval).toBe('major_third');
    });
    
    it('should identify perfect fifth between C and G', async () => {
      const interval = await getInterval('c', 'g', adapter);
      expect(interval).toBe('perfect_fifth');
    });
    
    it('should calculate note distance', async () => {
      const distance = await getNoteDistance('c', 'e', adapter);
      expect(distance).toBe(4);
    });
    
    it('should invert intervals correctly', async () => {
      const inverted = await invertInterval('major_third', adapter);
      expect(inverted).toBe('minor_sixth');
    });
  });
  
  // Chord identification
  describe('Chord Identification', () => {
    it('should identify C major from notes', async () => {
      const chords = await identifyChord(['c', 'e', 'g'], adapter);
      expect(chords.length).toBeGreaterThan(0);
      expect(chords.some(c => c.root === 'c' && c.type === 'major')).toBe(true);
    });
    
    it('should identify A minor from notes', async () => {
      const chords = await identifyChord(['a', 'c', 'e'], adapter);
      expect(chords.some(c => c.root === 'a' && c.type === 'minor')).toBe(true);
    });
  });
  
  // Scale identification
  describe('Scale Identification', () => {
    it('should identify C major from subset of notes', async () => {
      const scales = await identifyScale(['c', 'd', 'e', 'g'], adapter);
      expect(scales.length).toBeGreaterThan(0);
      // These notes fit C major
      expect(scales.some(s => s.root === 'c' && s.type === 'major')).toBe(true);
    });
  });
  
  // Enharmonic equivalents
  describe('Enharmonic Equivalents', () => {
    it('should recognize C# and Db as enharmonic', async () => {
      const result = await areEnharmonic('csharp', 'dflat', adapter);
      expect(result).toBe(true);
    });
    
    it('should recognize F# and Gb as enharmonic', async () => {
      const result = await areEnharmonic('fsharp', 'gflat', adapter);
      expect(result).toBe(true);
    });
  });
  
  // Harmonic function tests
  describe('Harmonic Functions', () => {
    it('should identify degree 1 as tonic', async () => {
      const fn = await getHarmonicFunction(1, adapter);
      expect(fn).toBe('tonic');
    });
    
    it('should identify degree 5 as dominant', async () => {
      const fn = await getHarmonicFunction(5, adapter);
      expect(fn).toBe('dominant');
    });
    
    it('should identify degree 4 as subdominant', async () => {
      const fn = await getHarmonicFunction(4, adapter);
      expect(fn).toBe('subdominant');
    });
  });
  
  // Diatonic chord tests
  describe('Diatonic Chords', () => {
    it('should return major for degree 1 in major key', async () => {
      const quality = await getDiatonicChord('major', 1, adapter);
      expect(quality).toBe('major');
    });
    
    it('should return minor for degree 2 in major key', async () => {
      const quality = await getDiatonicChord('major', 2, adapter);
      expect(quality).toBe('minor');
    });
    
    it('should return diminished for degree 7 in major key', async () => {
      const quality = await getDiatonicChord('major', 7, adapter);
      expect(quality).toBe('diminished');
    });
  });
  
  // Tension levels
  describe('Tension Levels', () => {
    it('should return 0 tension for tonic (degree 1)', async () => {
      const tension = await getTension(1, adapter);
      expect(tension).toBe(0);
    });
    
    it('should return high tension for leading tone (degree 7)', async () => {
      const tension = await getTension(7, adapter);
      expect(tension).toBe(5);
    });
    
    it('should return moderate tension for dominant (degree 5)', async () => {
      const tension = await getTension(5, adapter);
      expect(tension).toBe(4);
    });
  });
  
  // Note in scale tests
  describe('Note in Scale', () => {
    it('should confirm E is in C major', async () => {
      const result = await isNoteInScale('e', 'c', 'major', adapter);
      expect(result).toBe(true);
    });
    
    it('should confirm F# is not in C major', async () => {
      const result = await isNoteInScale('fsharp', 'c', 'major', adapter);
      expect(result).toBe(false);
    });
  });
  
  // Chord tone tests
  describe('Chord Tones', () => {
    it('should confirm E is a chord tone of C major', async () => {
      const result = await isChordTone('e', 'c', 'major', adapter);
      expect(result).toBe(true);
    });
    
    it('should confirm D is not a chord tone of C major', async () => {
      const result = await isChordTone('d', 'c', 'major', adapter);
      expect(result).toBe(false);
    });
  });
});
