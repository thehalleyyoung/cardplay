/**
 * @fileoverview Tests for Harmony Helper (G016-G020)
 */

import { describe, it, expect } from 'vitest';
import { classifyNote, getHarmonyColorClass } from './harmony-helper';
import type { HarmonyContext } from './harmony-helper';

describe('Harmony Helper', () => {
  describe('classifyNote', () => {
    it('should classify chord tones correctly', () => {
      const context: HarmonyContext = {
        key: 'C',
        chord: 'Cmaj7'
      };
      
      // C major 7 has notes: C (0), E (4), G (7), B (11)
      const c = classifyNote(60, context);  // Middle C
      expect(c.noteClass).toBe('chord-tone');
      expect(c.isChordTone).toBe(true);
      
      const e = classifyNote(64, context);  // E
      expect(e.noteClass).toBe('chord-tone');
      expect(e.isChordTone).toBe(true);
      
      const g = classifyNote(67, context);  // G
      expect(g.noteClass).toBe('chord-tone');
      expect(g.isChordTone).toBe(true);
      
      const b = classifyNote(71, context);  // B
      expect(b.noteClass).toBe('chord-tone');
      expect(b.isChordTone).toBe(true);
    });
    
    it('should classify scale tones correctly', () => {
      const context: HarmonyContext = {
        key: 'C',
        chord: 'Cmaj7'
      };
      
      // D, F, A are in C major scale but not in Cmaj7 chord
      const d = classifyNote(62, context);  // D
      expect(d.noteClass).toBe('scale-tone');
      expect(d.isScaleTone).toBe(true);
      expect(d.isChordTone).toBe(false);
      
      const f = classifyNote(65, context);  // F
      expect(f.noteClass).toBe('scale-tone');
      expect(f.isScaleTone).toBe(true);
      
      const a = classifyNote(69, context);  // A
      expect(a.noteClass).toBe('scale-tone');
      expect(a.isScaleTone).toBe(true);
    });
    
    it('should classify out-of-key notes correctly', () => {
      const context: HarmonyContext = {
        key: 'C',
        chord: 'C'
      };
      
      // C# is not in C major scale
      const cSharp = classifyNote(61, context);  // C#
      expect(cSharp.noteClass).toBe('out-of-key');
      expect(cSharp.isOutOfKey).toBe(true);
      expect(cSharp.isScaleTone).toBe(false);
      expect(cSharp.isChordTone).toBe(false);
      
      // F# is not in C major scale
      const fSharp = classifyNote(66, context);  // F#
      expect(fSharp.noteClass).toBe('out-of-key');
      expect(fSharp.isOutOfKey).toBe(true);
    });
    
    it('should work with minor keys', () => {
      const context: HarmonyContext = {
        key: 'Am',
        chord: 'Am'
      };
      
      // A minor chord: A (9), C (0), E (4)
      const a = classifyNote(69, context);  // A
      expect(a.noteClass).toBe('chord-tone');
      expect(a.isChordTone).toBe(true);
      
      const c = classifyNote(60, context);  // C
      expect(c.noteClass).toBe('chord-tone');
      expect(c.isChordTone).toBe(true);
      
      // D is in A minor scale but not in Am chord
      const d = classifyNote(62, context);  // D
      expect(d.noteClass).toBe('scale-tone');
      expect(d.isScaleTone).toBe(true);
      expect(d.isChordTone).toBe(false);
      
      // C# is not in A minor scale
      const cSharp = classifyNote(61, context);  // C#
      expect(cSharp.noteClass).toBe('out-of-key');
      expect(cSharp.isOutOfKey).toBe(true);
    });
    
    it('should work with dominant 7 chords', () => {
      const context: HarmonyContext = {
        key: 'C',
        chord: 'G7'
      };
      
      // G7 has notes: G (7), B (11), D (2), F (5)
      const g = classifyNote(67, context);  // G
      expect(g.noteClass).toBe('chord-tone');
      expect(g.isChordTone).toBe(true);
      
      const b = classifyNote(71, context);  // B
      expect(b.noteClass).toBe('chord-tone');
      expect(b.isChordTone).toBe(true);
      
      const d = classifyNote(62, context);  // D
      expect(d.noteClass).toBe('chord-tone');
      expect(d.isChordTone).toBe(true);
      
      const f = classifyNote(65, context);  // F
      expect(f.noteClass).toBe('chord-tone');
      expect(f.isChordTone).toBe(true);
      
      // C is in C major scale but not in G7 chord
      const c = classifyNote(60, context);  // C
      expect(c.noteClass).toBe('scale-tone');
      expect(c.isScaleTone).toBe(true);
      expect(c.isChordTone).toBe(false);
    });
    
    it('should work without harmony context', () => {
      const context: HarmonyContext = {
        key: null,
        chord: null
      };
      
      // Without context, all notes are out-of-key
      const c = classifyNote(60, context);
      expect(c.noteClass).toBe('out-of-key');
      expect(c.isOutOfKey).toBe(true);
    });
    
    it('should handle pitch classes across octaves', () => {
      const context: HarmonyContext = {
        key: 'C',
        chord: 'C'
      };
      
      // C in different octaves should all be chord tones
      const c2 = classifyNote(36, context);  // C2
      expect(c2.isChordTone).toBe(true);
      
      const c4 = classifyNote(60, context);  // C4
      expect(c4.isChordTone).toBe(true);
      
      const c6 = classifyNote(84, context);  // C6
      expect(c6.isChordTone).toBe(true);
    });
  });
  
  describe('getHarmonyColorClass', () => {
    it('should return correct CSS class for chord tones', () => {
      const classification = {
        noteClass: 'chord-tone' as const,
        isChordTone: true,
        isScaleTone: true,
        isOutOfKey: false,
      };
      
      expect(getHarmonyColorClass(classification)).toBe('harmony-chord-tone');
    });
    
    it('should return correct CSS class for scale tones', () => {
      const classification = {
        noteClass: 'scale-tone' as const,
        isChordTone: false,
        isScaleTone: true,
        isOutOfKey: false,
      };
      
      expect(getHarmonyColorClass(classification)).toBe('harmony-scale-tone');
    });
    
    it('should return correct CSS class for out-of-key notes', () => {
      const classification = {
        noteClass: 'out-of-key' as const,
        isChordTone: false,
        isScaleTone: false,
        isOutOfKey: true,
      };
      
      expect(getHarmonyColorClass(classification)).toBe('harmony-out-of-key');
    });
  });
});
