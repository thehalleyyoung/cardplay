/**
 * @fileoverview Tests for harmony coloring (G016-G019)
 * @module @cardplay/boards/harmony/coloring.test
 */

import { describe, it, expect } from 'vitest';
import {
  classifyNote,
  getNoteColorClass,
  getNoteColorStyle,
  type HarmonyContext,
  type NoteClass
} from './coloring';

describe('Harmony Coloring (G016-G019)', () => {
  describe('classifyNote', () => {
    it('should classify chord tones correctly in C major', () => {
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      
      expect(classifyNote('C', context)).toBe('chord-tone');
      expect(classifyNote('E', context)).toBe('chord-tone');
      expect(classifyNote('G', context)).toBe('chord-tone');
    });

    it('should classify scale tones correctly in C major', () => {
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      
      expect(classifyNote('D', context)).toBe('scale-tone');
      expect(classifyNote('F', context)).toBe('scale-tone');
      expect(classifyNote('A', context)).toBe('scale-tone');
      expect(classifyNote('B', context)).toBe('scale-tone');
    });

    it('should classify out-of-key notes correctly in C major', () => {
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      
      expect(classifyNote('C#', context)).toBe('out-of-key');
      expect(classifyNote('Db', context)).toBe('out-of-key');
      expect(classifyNote('Eb', context)).toBe('out-of-key');
      expect(classifyNote('F#', context)).toBe('out-of-key');
      expect(classifyNote('Ab', context)).toBe('out-of-key');
    });

    it('should classify correctly in minor keys', () => {
      const context: HarmonyContext = { key: 'Am', chord: 'Am' };
      
      // Chord tones (A minor: A-C-E)
      expect(classifyNote('A', context)).toBe('chord-tone');
      expect(classifyNote('C', context)).toBe('chord-tone');
      expect(classifyNote('E', context)).toBe('chord-tone');
      
      // Scale tones (A natural minor: A-B-C-D-E-F-G)
      expect(classifyNote('B', context)).toBe('scale-tone');
      expect(classifyNote('D', context)).toBe('scale-tone');
      expect(classifyNote('F', context)).toBe('scale-tone');
      expect(classifyNote('G', context)).toBe('scale-tone');
      
      // Out of key
      expect(classifyNote('C#', context)).toBe('out-of-key');
      expect(classifyNote('F#', context)).toBe('out-of-key');
    });

    it('should classify correctly with 7th chords', () => {
      const context: HarmonyContext = { key: 'C', chord: 'Cmaj7' };
      
      // Chord tones (Cmaj7: C-E-G-B)
      expect(classifyNote('C', context)).toBe('chord-tone');
      expect(classifyNote('E', context)).toBe('chord-tone');
      expect(classifyNote('G', context)).toBe('chord-tone');
      expect(classifyNote('B', context)).toBe('chord-tone');
      
      // Scale tones (not in chord)
      expect(classifyNote('D', context)).toBe('scale-tone');
      expect(classifyNote('F', context)).toBe('scale-tone');
      expect(classifyNote('A', context)).toBe('scale-tone');
    });

    it('should classify correctly with dominant 7th chords', () => {
      const context: HarmonyContext = { key: 'C', chord: 'G7' };
      
      // Chord tones (G7: G-B-D-F)
      expect(classifyNote('G', context)).toBe('chord-tone');
      expect(classifyNote('B', context)).toBe('chord-tone');
      expect(classifyNote('D', context)).toBe('chord-tone');
      expect(classifyNote('F', context)).toBe('chord-tone');
      
      // Scale tones (C major scale, not in G7 chord)
      expect(classifyNote('C', context)).toBe('scale-tone');
      expect(classifyNote('E', context)).toBe('scale-tone');
      expect(classifyNote('A', context)).toBe('scale-tone');
    });

    it('should handle enharmonic equivalents', () => {
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      
      // C# and Db should both be out-of-key in C major
      expect(classifyNote('C#', context)).toBe('out-of-key');
      expect(classifyNote('Db', context)).toBe('out-of-key');
      
      // Both should classify the same
      expect(classifyNote('C#', context)).toBe(classifyNote('Db', context));
    });

    it('should handle invalid note names gracefully', () => {
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      
      expect(classifyNote('X', context)).toBe('out-of-key');
      expect(classifyNote('H', context)).toBe('out-of-key');
      expect(classifyNote('', context)).toBe('out-of-key');
    });
  });

  describe('getNoteColorClass', () => {
    it('should return correct class names', () => {
      expect(getNoteColorClass('chord-tone')).toBe('harmony-chord-tone');
      expect(getNoteColorClass('scale-tone')).toBe('harmony-scale-tone');
      expect(getNoteColorClass('out-of-key')).toBe('harmony-out-of-key');
    });
  });

  describe('getNoteColorStyle', () => {
    it('should return style strings for all note classes', () => {
      expect(getNoteColorStyle('chord-tone')).toContain('background-color');
      expect(getNoteColorStyle('scale-tone')).toContain('background-color');
      expect(getNoteColorStyle('out-of-key')).toContain('background-color');
    });

    it('should support different color modes', () => {
      const subtle = getNoteColorStyle('chord-tone', 'subtle');
      const normal = getNoteColorStyle('chord-tone', 'normal');
      const vibrant = getNoteColorStyle('chord-tone', 'vibrant');
      
      expect(subtle).toContain('0.2');  // Subtle alpha
      expect(normal).toContain('0.3');  // Normal alpha
      expect(vibrant).toContain('0.5'); // Vibrant alpha
    });

    it('should use normal mode by default', () => {
      const defaultStyle = getNoteColorStyle('chord-tone');
      const normalStyle = getNoteColorStyle('chord-tone', 'normal');
      
      expect(defaultStyle).toBe(normalStyle);
    });

    it('should emphasize chord tones with font-weight', () => {
      const style = getNoteColorStyle('chord-tone');
      expect(style).toContain('font-weight: 600');
    });

    it('should not emphasize scale tones and out-of-key notes', () => {
      expect(getNoteColorStyle('scale-tone')).not.toContain('font-weight');
      expect(getNoteColorStyle('out-of-key')).not.toContain('font-weight');
    });
  });

  describe('Integration: Full harmony context changes', () => {
    it('should re-classify notes when chord changes', () => {
      const contextC: HarmonyContext = { key: 'C', chord: 'C' };
      const contextG7: HarmonyContext = { key: 'C', chord: 'G7' };
      
      // F is a scale tone in C major, but a chord tone in G7
      expect(classifyNote('F', contextC)).toBe('scale-tone');
      expect(classifyNote('F', contextG7)).toBe('chord-tone');
    });

    it('should re-classify notes when key changes', () => {
      const contextC: HarmonyContext = { key: 'C', chord: 'C' };
      const contextG: HarmonyContext = { key: 'G', chord: 'G' };
      
      // F is in C major scale but not in G major scale
      expect(classifyNote('F', contextC)).toBe('scale-tone');
      expect(classifyNote('F', contextG)).toBe('out-of-key');
    });

    it('should handle modulation sequences', () => {
      const contexts: HarmonyContext[] = [
        { key: 'C', chord: 'C' },
        { key: 'C', chord: 'G7' },
        { key: 'G', chord: 'G' },
        { key: 'G', chord: 'D7' },
      ];
      
      // D classification changes through modulation
      const classifications = contexts.map(ctx => classifyNote('D', ctx));
      
      expect(classifications[0]).toBe('scale-tone');  // D in C major (scale tone, not in C chord)
      expect(classifications[1]).toBe('chord-tone');   // D in G7 (chord tone)
      expect(classifications[2]).toBe('chord-tone');   // D in G major (chord tone - G chord has D)
      expect(classifications[3]).toBe('chord-tone');   // D in D7 (chord root)
    });
  });
});
