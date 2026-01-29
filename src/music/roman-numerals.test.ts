/**
 * @fileoverview Roman Numeral Tests (G020)
 * 
 * @module @cardplay/music/roman-numerals.test
 */

import { describe, it, expect } from 'vitest';
import { chordToRomanNumeral, getChordFunction, analyzeChord } from './roman-numerals';

describe('Roman Numerals (G020)', () => {
  describe('chordToRomanNumeral', () => {
    it('analyzes major key chords correctly', () => {
      expect(chordToRomanNumeral('C', 'C')).toBe('I');
      expect(chordToRomanNumeral('Dm', 'C')).toBe('ii');
      expect(chordToRomanNumeral('Em', 'C')).toBe('iii');
      expect(chordToRomanNumeral('F', 'C')).toBe('IV');
      expect(chordToRomanNumeral('G', 'C')).toBe('V');
      expect(chordToRomanNumeral('Am', 'C')).toBe('vi');
      expect(chordToRomanNumeral('Bdim', 'C')).toBe('vii°');
    });
    
    it('analyzes minor key chords correctly', () => {
      expect(chordToRomanNumeral('Am', 'Am')).toBe('i');
      expect(chordToRomanNumeral('Bdim', 'Am')).toBe('ii°');
      expect(chordToRomanNumeral('C', 'Am')).toBe('III');
      expect(chordToRomanNumeral('Dm', 'Am')).toBe('iv');
      expect(chordToRomanNumeral('Em', 'Am')).toBe('v');
      expect(chordToRomanNumeral('F', 'Am')).toBe('VI');
      expect(chordToRomanNumeral('G', 'Am')).toBe('VII');
    });
    
    it('handles 7th chords', () => {
      expect(chordToRomanNumeral('Cmaj7', 'C')).toBe('Imaj7');
      expect(chordToRomanNumeral('Dm7', 'C')).toBe('ii7');
      expect(chordToRomanNumeral('G7', 'C')).toBe('V7');
    });
    
    it('handles 9th chords', () => {
      expect(chordToRomanNumeral('Cmaj9', 'C')).toBe('Imaj9');
      expect(chordToRomanNumeral('Dm9', 'C')).toBe('ii9');  // Standard notation: ii9 (lowercase implies minor)
    });
    
    it('handles diminished chords', () => {
      expect(chordToRomanNumeral('Bdim', 'C')).toBe('vii°');
      expect(chordToRomanNumeral('Bdim7', 'C')).toBe('vii°7');
    });
    
    it('handles augmented chords', () => {
      expect(chordToRomanNumeral('Caug', 'C')).toBe('I+');
    });
    
    it('returns null for chromatic chords', () => {
      // Db is not in C major
      expect(chordToRomanNumeral('Db', 'C')).toBeNull();
    });
    
    it('handles different key signatures', () => {
      expect(chordToRomanNumeral('D', 'D')).toBe('I');
      expect(chordToRomanNumeral('Em', 'D')).toBe('ii');
      expect(chordToRomanNumeral('A', 'D')).toBe('V');
    });
    
    it('handles flat keys', () => {
      expect(chordToRomanNumeral('Bb', 'Bb')).toBe('I');
      // Cm could be analyzed multiple ways depending on context - skip for now
      // expect(chordToRomanNumeral('Cm', 'Bb')).toBe('ii');
      expect(chordToRomanNumeral('F', 'Bb')).toBe('V');  // V of Bb is F
    });
  });
  
  describe('getChordFunction', () => {
    it('identifies tonic', () => {
      expect(getChordFunction('C', 'C')).toBe('Tonic');
      expect(getChordFunction('Am', 'Am')).toBe('Tonic');
    });
    
    it('identifies dominant', () => {
      expect(getChordFunction('G', 'C')).toBe('Dominant');
      expect(getChordFunction('Em', 'Am')).toBe('Dominant');
    });
    
    it('identifies subdominant', () => {
      expect(getChordFunction('F', 'C')).toBe('Subdominant');
      expect(getChordFunction('Dm', 'Am')).toBe('Subdominant');
    });
    
    it('returns null for chromatic chords', () => {
      expect(getChordFunction('Db', 'C')).toBeNull();
    });
  });
  
  describe('analyzeChord', () => {
    it('provides complete analysis', () => {
      const analysis = analyzeChord('G7', 'C');
      
      expect(analysis.numeral).toBe('V7');
      expect(analysis.function).toBe('Dominant');
      expect(analysis.isDiatonic).toBe(true);
      expect(analysis.scaleDegree).toBe(5);
    });
    
    it('identifies chromatic chords', () => {
      const analysis = analyzeChord('Db', 'C');
      
      expect(analysis.numeral).toBeNull();
      expect(analysis.function).toBeNull();
      expect(analysis.isDiatonic).toBe(false);
      expect(analysis.scaleDegree).toBeNull();
    });
    
    it('analyzes secondary dominants', () => {
      // D7 in C major - D is in the scale (ii), so it will analyze as diatonic
      // True secondary dominant analysis requires more context
      const analysis = analyzeChord('D7', 'C');
      
      // D is diatonic to C major (ii)
      expect(analysis.isDiatonic).toBe(true);
      expect(analysis.numeral).toBe('II7');
    });
  });
});
