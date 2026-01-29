/**
 * @fileoverview Tests for Notation Harmony Overlay (G103-G106)
 * 
 * @vitest-environment jsdom
 * 
 * @module @cardplay/notation/harmony-overlay.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  applyChordToneHighlights,
  removeChordToneHighlights,
  snapSelectionToChordTones,
  suggestReharmonization,
  type NotationHarmonySettings
} from './harmony-overlay';
import type { HarmonyContext } from '../boards/harmony/coloring';
import type { Event } from '../types/event';
import { EventId } from '../types/event-id';
import { asTick, asTickDuration } from '../types/primitives';

/**
 * Note payload type
 */
interface NotePayload {
  note?: number;
  pitch?: number;
  velocity?: number;
}

type NoteEvent = Event<NotePayload>;

describe('Notation Harmony Overlay (G103-G106)', () => {
  // Mock getBBox for jsdom
  beforeEach(() => {
    if (typeof SVGElement !== 'undefined' && !SVGElement.prototype.getBBox) {
      SVGElement.prototype.getBBox = function() {
        return {
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          top: 0,
          right: 10,
          bottom: 10,
          left: 0,
          toJSON: () => ({})
        } as DOMRect;
      };
    }
  });

  describe('G103: Apply chord tone highlights', () => {
    it('should create overlay rectangles for each note head', () => {
      // Create mock SVG container
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      // Add mock note heads
      const noteC = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      noteC.setAttribute('data-note-name', 'C');
      noteC.setAttribute('cx', '10');
      noteC.setAttribute('cy', '20');
      noteC.setAttribute('r', '5');
      svg.appendChild(noteC);
      
      const noteE = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      noteE.setAttribute('data-note-name', 'E');
      noteE.setAttribute('cx', '30');
      noteE.setAttribute('cy', '20');
      noteE.setAttribute('r', '5');
      svg.appendChild(noteE);
      
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      const overlays = applyChordToneHighlights(svg, [], context);
      
      // Should create 2 overlays
      expect(overlays.length).toBe(2);
      
      // Should have overlay elements
      expect(overlays[0]?.overlayElement).toBeDefined();
      expect(overlays[1]?.overlayElement).toBeDefined();
      
      // C and E are chord tones in C major
      expect(overlays[0]?.noteClass).toBe('chord-tone');
      expect(overlays[1]?.noteClass).toBe('chord-tone');
    });
    
    it('should respect settings.showChordTones', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const noteC = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      noteC.setAttribute('data-note-name', 'C');
      svg.appendChild(noteC);
      
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      const settings: NotationHarmonySettings = {
        showChordTones: false,
        highlightOpacity: 0.25,
        showChordSymbols: true
      };
      
      const overlays = applyChordToneHighlights(svg, [], context, settings);
      
      // Should not create overlays when disabled
      expect(overlays.length).toBe(0);
    });
    
    it('should classify notes correctly', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      // C = chord tone, D = scale tone, C# = out-of-key (in C major)
      const notes = ['C', 'D', 'C#'];
      notes.forEach(name => {
        const note = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        note.setAttribute('data-note-name', name);
        svg.appendChild(note);
      });
      
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      const overlays = applyChordToneHighlights(svg, [], context);
      
      expect(overlays[0]?.noteClass).toBe('chord-tone');
      expect(overlays[1]?.noteClass).toBe('scale-tone');
      expect(overlays[2]?.noteClass).toBe('out-of-key');
    });
    
    it('should remove all overlays', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const noteC = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      noteC.setAttribute('data-note-name', 'C');
      svg.appendChild(noteC);
      
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      applyChordToneHighlights(svg, [], context);
      
      // Should have overlay
      expect(svg.querySelectorAll('.harmony-overlay').length).toBe(1);
      
      removeChordToneHighlights(svg);
      
      // Should remove overlay
      expect(svg.querySelectorAll('.harmony-overlay').length).toBe(0);
    });
  });
  
  describe('G104: Snap selection to chord tones', () => {
    it('should snap notes to nearest chord tones', () => {
      const events: NoteEvent[] = [
        {
          id: 'e1' as EventId,
          kind: 'note',
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 61, velocity: 100 } // C# (61 % 12 = 1)
        },
        {
          id: 'e2' as EventId,
          kind: 'note',
          start: asTick(480),
          duration: asTickDuration(480),
          payload: { note: 63, velocity: 100 } // D# (63 % 12 = 3)
        }
      ];
      
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      const action = snapSelectionToChordTones(events, context);
      
      // Execute redo
      action.redo();
      
      // C# (1) should snap to C (0), D# (3) should snap to E (4)
      expect(events[0]?.payload.note).toBe(60); // C in same octave
      expect(events[1]?.payload.note).toBe(64); // E in same octave
    });
    
    it('should preserve rhythm and duration', () => {
      const events: NoteEvent[] = [
        {
          id: 'e1' as EventId,
          kind: 'note',
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 61, velocity: 100 }
        }
      ];
      
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      const action = snapSelectionToChordTones(events, context);
      
      action.redo();
      
      // Start and duration should not change
      expect(events[0]?.start).toBe(asTick(0));
      expect(events[0]?.duration).toBe(asTickDuration(480));
    });
    
    it('should be undoable', () => {
      const events: NoteEvent[] = [
        {
          id: 'e1' as EventId,
          kind: 'note',
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 61, velocity: 100 }
        }
      ];
      
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      const action = snapSelectionToChordTones(events, context);
      
      // Original pitch
      expect(events[0]?.payload.note).toBe(61);
      
      // Snap
      action.redo();
      expect(events[0]?.payload.note).toBe(60);
      
      // Undo
      action.undo();
      expect(events[0]?.payload.note).toBe(61);
    });
    
    it('should have descriptive action description', () => {
      const events: NoteEvent[] = [
        {
          id: 'e1' as EventId,
          kind: 'note',
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 61, velocity: 100 }
        }
      ];
      
      const context: HarmonyContext = { key: 'C', chord: 'Cmaj7' };
      const action = snapSelectionToChordTones(events, context);
      
      expect(action.description).toContain('1 notes');
      expect(action.description).toContain('Cmaj7');
    });
  });
  
  describe('G106: Suggest reharmonization', () => {
    it('should suggest compatible chords', () => {
      const events: NoteEvent[] = [
        {
          id: 'e1' as EventId,
          kind: 'note',
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 60, velocity: 100 } // C
        },
        {
          id: 'e2' as EventId,
          kind: 'note',
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 64, velocity: 100 } // E
        },
        {
          id: 'e3' as EventId,
          kind: 'note',
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 67, velocity: 100 } // G
        }
      ];
      
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      const suggestions = suggestReharmonization(events, context);
      
      // C-E-G should suggest C or Cmaj7
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]?.chord).toMatch(/C(maj7)?/);
      expect(suggestions[0]?.confidence).toBeGreaterThanOrEqual(0.5);
    });
    
    it('should include reason for each suggestion', () => {
      const events: NoteEvent[] = [
        {
          id: 'e1' as EventId,
          kind: 'note',
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 60, velocity: 100 }
        }
      ];
      
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      const suggestions = suggestReharmonization(events, context);
      
      suggestions.forEach(suggestion => {
        expect(suggestion.reason).toBeTruthy();
        expect(typeof suggestion.reason).toBe('string');
      });
    });
    
    it('should calculate voice leading scores', () => {
      const events: NoteEvent[] = [
        {
          id: 'e1' as EventId,
          kind: 'note',
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 60, velocity: 100 }
        }
      ];
      
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      const suggestions = suggestReharmonization(events, context);
      
      suggestions.forEach(suggestion => {
        expect(suggestion.voiceLeading).toBeGreaterThanOrEqual(0);
        expect(suggestion.voiceLeading).toBeLessThanOrEqual(1);
      });
    });
    
    it('should sort by confidence then voice leading', () => {
      const events: NoteEvent[] = [
        {
          id: 'e1' as EventId,
          kind: 'note',
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 60, velocity: 100 } // C
        },
        {
          id: 'e2' as EventId,
          kind: 'note',
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 64, velocity: 100 } // E
        }
      ];
      
      const context: HarmonyContext = { key: 'C', chord: 'G' };
      const suggestions = suggestReharmonization(events, context);
      
      // Suggestions should be sorted
      for (let i = 0; i < suggestions.length - 1; i++) {
        const current = suggestions[i]!;
        const next = suggestions[i + 1]!;
        
        // Either higher confidence or similar confidence with better voice leading
        const confidenceDiff = Math.abs(current.confidence - next.confidence);
        if (confidenceDiff > 0.1) {
          expect(current.confidence).toBeGreaterThanOrEqual(next.confidence);
        }
      }
    });
    
    it('should return empty array for no events', () => {
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      const suggestions = suggestReharmonization([], context);
      
      expect(suggestions.length).toBe(0);
    });
    
    it('should limit to top 5 suggestions', () => {
      const events: NoteEvent[] = [
        {
          id: 'e1' as EventId,
          kind: 'note',
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 60, velocity: 100 }
        }
      ];
      
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      const suggestions = suggestReharmonization(events, context);
      
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });
  });
  
  describe('Integration', () => {
    it('should work together: highlight, snap, suggest', () => {
      // Create SVG
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const noteC = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      noteC.setAttribute('data-note-name', 'C#');
      svg.appendChild(noteC);
      
      // Create event
      const events: NoteEvent[] = [
        {
          id: 'e1' as EventId,
          kind: 'note',
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 61, velocity: 100 } // C#
        }
      ];
      
      const context: HarmonyContext = { key: 'C', chord: 'C' };
      
      // Apply highlights - should show C# as out-of-key
      const overlays = applyChordToneHighlights(svg, events, context);
      expect(overlays[0]?.noteClass).toBe('out-of-key');
      
      // Snap to chord tones - should move C# to C
      const action = snapSelectionToChordTones(events, context);
      action.redo();
      expect(events[0]?.payload.note).toBe(60);
      
      // Suggest reharmonization
      const suggestions = suggestReharmonization(events, context);
      expect(suggestions.length).toBeGreaterThan(0);
      
      // After snapping, C should be in suggestions
      const hasCChord = suggestions.some(s => s.chord.startsWith('C'));
      expect(hasCChord).toBe(true);
    });
  });
});
