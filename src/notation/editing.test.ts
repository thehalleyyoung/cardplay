/**
 * @fileoverview Tests for Notation Editing Operations (Phase 11.3).
 * 
 * Tests cut/copy/paste, measure operations, clef/key/time changes,
 * ties, slurs, dynamics, articulations, and transposition.
 */

import { describe, it, expect } from 'vitest';
import {
  // Clipboard operations
  copyNotation,
  cutNotation,
  pasteNotation,
  NotationClipboard,
  NotationSelection,
  
  // Measure operations
  insertMeasure,
  deleteMeasure,
  
  // Signature operations
  changeClef,
  changeKeySignature,
  changeTimeSignature,
  
  // Tie/Slur operations
  addTie,
  removeTie,
  addSlur,
  removeSlur,
  
  // Dynamics operations
  addDynamics,
  removeDynamics,
  
  // Articulation operations
  addArticulation,
  removeArticulation,
  
  // Text operations
  addTextAnnotation,
  
  // Transpose operations
  transposeSelection,
  respellEnharmonic,
} from './editing';
import type { NotationMeasure, NotationEvent, NoteTie, NoteSlur, ClefType } from './types';

// ============================================================================
// TEST FIXTURES
// ============================================================================

function createTestMeasure(
  number: number,
  events: NotationEvent[] = []
): NotationMeasure {
  const eventMap = new Map<number, NotationEvent[]>();
  if (events.length > 0) {
    eventMap.set(0, events); // voice 0
  }
  return {
    number,
    events: eventMap,
  };
}

function createTestEvent(
  tick: number,
  midiPitch: number,
  duration: 'quarter' = 'quarter'
): NotationEvent {
  return {
    id: `event-${tick}-${midiPitch}`,
    tick,
    duration,
    voice: 0,
    staff: 0,
    isRest: false,
    notes: [{
      id: `note-${tick}-${midiPitch}`,
      pitch: midiPitch,
    }],
  };
}

// ============================================================================
// CLIPBOARD TESTS
// ============================================================================

describe('Clipboard Operations', () => {
  describe('copyNotation', () => {
    it('copies selected measures', () => {
      const measures = [
        createTestMeasure(1, [createTestEvent(0, 60)]),
        createTestMeasure(2, [createTestEvent(0, 62)]),
        createTestMeasure(3, [createTestEvent(0, 64)]),
      ];
      const selection: NotationSelection = { startMeasure: 0, endMeasure: 1 };
      
      const clipboard = copyNotation(measures, selection, [], []);
      
      expect(clipboard.type).toBe('measures');
      expect(clipboard.measures).toHaveLength(2);
      expect(clipboard.measures[0].number).toBe(1);
      expect(clipboard.measures[1].number).toBe(2);
    });

    it('copies single measure', () => {
      const measures = [
        createTestMeasure(1, [createTestEvent(0, 60)]),
        createTestMeasure(2, [createTestEvent(0, 62)]),
      ];
      const selection: NotationSelection = { startMeasure: 1, endMeasure: 1 };
      
      const clipboard = copyNotation(measures, selection, [], []);
      
      expect(clipboard.measures).toHaveLength(1);
      expect(clipboard.measures[0].number).toBe(2);
    });
  });

  describe('cutNotation', () => {
    it('removes cut measures and returns clipboard', () => {
      const measures = [
        createTestMeasure(1),
        createTestMeasure(2),
        createTestMeasure(3),
      ];
      const selection: NotationSelection = { startMeasure: 1, endMeasure: 1 };
      
      const { clipboard, updatedMeasures } = cutNotation(measures, selection, [], []);
      
      expect(clipboard.measures).toHaveLength(1);
      expect(updatedMeasures).toHaveLength(2);
      expect(updatedMeasures[0].number).toBe(1);
      expect(updatedMeasures[1].number).toBe(3);
    });
  });

  describe('pasteNotation', () => {
    it('inserts clipboard measures at target position', () => {
      const measures = [
        createTestMeasure(1),
        createTestMeasure(2),
      ];
      const clipboard: NotationClipboard = {
        events: new Map(),
        measures: [createTestMeasure(99, [createTestEvent(0, 72)])],
        ties: [],
        slurs: [],
        type: 'measures',
      };
      
      const { updatedMeasures } = pasteNotation(measures, clipboard, 1, [], []);
      
      expect(updatedMeasures).toHaveLength(3);
      // Should insert at position 1
      expect(updatedMeasures[1].number).toBe(99);
    });
  });
});

// ============================================================================
// MEASURE OPERATIONS TESTS
// ============================================================================

describe('Measure Operations', () => {
  describe('insertMeasure', () => {
    it('inserts measure at beginning', () => {
      const measures = [createTestMeasure(1), createTestMeasure(2)];
      
      const result = insertMeasure(measures, 0);
      
      expect(result).toHaveLength(3);
      expect(result[0].number).toBe(1); // New measure
      expect(result[1].number).toBe(1); // Original first
    });

    it('inserts measure in middle', () => {
      const measures = [createTestMeasure(1), createTestMeasure(2)];
      
      const result = insertMeasure(measures, 1);
      
      expect(result).toHaveLength(3);
      expect(result[1].number).toBe(2); // New measure at index 1
    });

    it('inserts measure at end', () => {
      const measures = [createTestMeasure(1)];
      
      const result = insertMeasure(measures, 1);
      
      expect(result).toHaveLength(2);
    });
  });

  describe('deleteMeasure', () => {
    it('deletes first measure', () => {
      const measures = [createTestMeasure(1), createTestMeasure(2), createTestMeasure(3)];
      
      const result = deleteMeasure(measures, 0);
      
      expect(result).toHaveLength(2);
      expect(result[0].number).toBe(2);
    });

    it('deletes middle measure', () => {
      const measures = [createTestMeasure(1), createTestMeasure(2), createTestMeasure(3)];
      
      const result = deleteMeasure(measures, 1);
      
      expect(result).toHaveLength(2);
      expect(result[0].number).toBe(1);
      expect(result[1].number).toBe(3);
    });

    it('deletes last measure', () => {
      const measures = [createTestMeasure(1), createTestMeasure(2)];
      
      const result = deleteMeasure(measures, 1);
      
      expect(result).toHaveLength(1);
      expect(result[0].number).toBe(1);
    });
  });
});

// ============================================================================
// CLEF OPERATIONS TESTS
// ============================================================================

describe('Clef Operations', () => {
  describe('changeClef', () => {
    it('changes clef at specified measure', () => {
      const measures = [
        createTestMeasure(1),
        createTestMeasure(2),
      ];
      
      const result = changeClef(measures, 1, 'bass' as ClefType);
      
      expect(result).toHaveLength(2);
      expect(result[1].clefChanges).toBeDefined();
      expect(result[1].clefChanges![0].clef).toBe('bass');
    });

    it('changes clef at first measure', () => {
      const measures = [createTestMeasure(1)];
      
      const result = changeClef(measures, 0, 'alto' as ClefType);
      
      expect(result[0].clefChanges).toBeDefined();
      expect(result[0].clefChanges![0].clef).toBe('alto');
    });
  });
});

// ============================================================================
// KEY SIGNATURE OPERATIONS TESTS
// ============================================================================

describe('Key Signature Operations', () => {
  describe('changeKeySignature', () => {
    it('changes key signature with object', () => {
      const measures = [createTestMeasure(1), createTestMeasure(2)];
      
      const result = changeKeySignature(measures, 1, { root: 'D', mode: 'major', accidentals: 2 });
      
      expect(result[1].keySignature).toEqual({ root: 'D', mode: 'major', accidentals: 2 });
    });

    it('changes key signature with string', () => {
      const measures = [createTestMeasure(1)];
      
      const result = changeKeySignature(measures, 0, 'G major');
      
      expect(result[0].keySignature).toEqual({ root: 'G', mode: 'major', accidentals: 1 }); // G major = 1 sharp
    });

    it('handles minor keys', () => {
      const measures = [createTestMeasure(1)];
      
      const result = changeKeySignature(measures, 0, 'A minor');
      
      expect(result[0].keySignature).toEqual({ root: 'A', mode: 'minor', accidentals: 0 }); // A minor = no accidentals
    });
  });
});

// ============================================================================
// TIME SIGNATURE OPERATIONS TESTS
// ============================================================================

describe('Time Signature Operations', () => {
  describe('changeTimeSignature', () => {
    it('changes time signature with object', () => {
      const measures = [createTestMeasure(1)];
      
      const result = changeTimeSignature(measures, 0, { numerator: 3, denominator: 4 });
      
      expect(result[0].timeSignature).toEqual({ numerator: 3, denominator: 4 });
    });

    it('changes time signature with string', () => {
      const measures = [createTestMeasure(1)];
      
      const result = changeTimeSignature(measures, 0, '6/8');
      
      expect(result[0].timeSignature).toEqual({ numerator: 6, denominator: 8 });
    });

    it('handles common time', () => {
      const measures = [createTestMeasure(1)];
      
      const result = changeTimeSignature(measures, 0, 'C');
      
      expect(result[0].timeSignature).toEqual({ numerator: 4, denominator: 4 });
    });

    it('handles cut time', () => {
      const measures = [createTestMeasure(1)];
      
      const result = changeTimeSignature(measures, 0, 'cut');
      
      expect(result[0].timeSignature).toEqual({ numerator: 2, denominator: 2 });
    });
  });
});

// ============================================================================
// TIE OPERATIONS TESTS
// ============================================================================

describe('Tie Operations', () => {
  describe('addTie', () => {
    it('adds tie between notes', () => {
      const ties: NoteTie[] = [];
      
      const result = addTie(ties, 'note1', 'note2');
      
      expect(result).toHaveLength(1);
      expect(result[0].startNoteId).toBe('note1');
      expect(result[0].endNoteId).toBe('note2');
      expect(result[0].placement).toBe('auto');
    });

    it('adds tie with specific placement', () => {
      const ties: NoteTie[] = [];
      
      const result = addTie(ties, 'note1', 'note2', 'above');
      
      expect(result[0].placement).toBe('above');
    });

    it('appends to existing ties', () => {
      const ties: NoteTie[] = [{
        id: 'existing',
        startNoteId: 'a',
        endNoteId: 'b',
        placement: 'auto',
      }];
      
      const result = addTie(ties, 'c', 'd');
      
      expect(result).toHaveLength(2);
    });
  });

  describe('removeTie', () => {
    it('removes tie by id', () => {
      const ties: NoteTie[] = [
        { id: 'tie1', startNoteId: 'a', endNoteId: 'b', placement: 'auto' },
        { id: 'tie2', startNoteId: 'c', endNoteId: 'd', placement: 'auto' },
      ];
      
      const result = removeTie(ties, 'tie1');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tie2');
    });

    it('returns same array if id not found', () => {
      const ties: NoteTie[] = [
        { id: 'tie1', startNoteId: 'a', endNoteId: 'b', placement: 'auto' },
      ];
      
      const result = removeTie(ties, 'nonexistent');
      
      expect(result).toHaveLength(1);
    });
  });
});

// ============================================================================
// SLUR OPERATIONS TESTS
// ============================================================================

describe('Slur Operations', () => {
  describe('addSlur', () => {
    it('adds slur between notes', () => {
      const slurs: NoteSlur[] = [];
      
      const result = addSlur(slurs, 'note1', 'note2');
      
      expect(result).toHaveLength(1);
      expect(result[0].startNoteId).toBe('note1');
      expect(result[0].endNoteId).toBe('note2');
    });

    it('adds slur with below placement', () => {
      const slurs: NoteSlur[] = [];
      
      const result = addSlur(slurs, 'note1', 'note2', 'below');
      
      expect(result[0].placement).toBe('below');
    });
  });

  describe('removeSlur', () => {
    it('removes slur by id', () => {
      const slurs: NoteSlur[] = [
        { id: 'slur1', startNoteId: 'a', endNoteId: 'b', placement: 'auto' },
      ];
      
      const result = removeSlur(slurs, 'slur1');
      
      expect(result).toHaveLength(0);
    });
  });
});

// ============================================================================
// DYNAMICS OPERATIONS TESTS
// ============================================================================

describe('Dynamics Operations', () => {
  describe('addDynamics', () => {
    it('adds dynamic marking', () => {
      const dynamics: any[] = [];
      
      const result = addDynamics(dynamics, 'f', 0, 0, 0);
      
      expect(result).toHaveLength(1);
      expect(result[0].level).toBe('f');
      expect(result[0].tick).toBe(0);
    });

    it('adds multiple dynamics', () => {
      const dynamics: any[] = [];
      
      let result = addDynamics(dynamics, 'p', 0, 0, 0);
      result = addDynamics(result, 'f', 480, 0, 0);
      
      expect(result).toHaveLength(2);
    });
  });

  describe('removeDynamics', () => {
    it('removes dynamic by position', () => {
      const dynamics = [
        { level: 'p' as const, tick: 0, voice: 0, staff: 0 },
        { level: 'f' as const, tick: 480, voice: 0, staff: 0 },
      ];
      
      const result = removeDynamics(dynamics, 0, 0, 0);
      
      expect(result).toHaveLength(1);
      expect(result[0].tick).toBe(480);
    });
  });
});

// ============================================================================
// ARTICULATION OPERATIONS TESTS
// ============================================================================

describe('Articulation Operations', () => {
  describe('addArticulation', () => {
    it('adds articulation to event', () => {
      const event = createTestEvent(0, 60);
      const measures = [createTestMeasure(1, [event])];
      
      const result = addArticulation(measures, 0, 'event-0', 'staccato');
      
      // Get events from the first measure
      const events = result[0].events.get(0);
      expect(events).toBeDefined();
      expect(events![0].articulations).toContain('staccato');
    });
  });

  describe('removeArticulation', () => {
    it('removes articulation from event', () => {
      const event: NotationEvent = {
        ...createTestEvent(0, 60),
        articulations: ['staccato', 'accent'],
      };
      const measures = [createTestMeasure(1, [event])];
      
      const result = removeArticulation(measures, 0, 'event-0', 'staccato');
      
      const events = result[0].events.get(0);
      expect(events).toBeDefined();
      expect(events![0].articulations).not.toContain('staccato');
      expect(events![0].articulations).toContain('accent');
    });
  });
});

// ============================================================================
// TEXT ANNOTATION TESTS
// ============================================================================

describe('Text Annotation Operations', () => {
  describe('addTextAnnotation', () => {
    it('adds text annotation to measure', () => {
      const measures = [createTestMeasure(1)];
      
      const result = addTextAnnotation(measures, 0, 'dolce');
      
      expect(result[0].annotations).toBeDefined();
      expect(result[0].annotations).toContainEqual(
        expect.objectContaining({ text: 'dolce' })
      );
    });
  });
});

// ============================================================================
// TRANSPOSE OPERATIONS TESTS
// ============================================================================

describe('Transpose Operations', () => {
  describe('transposeSelection', () => {
    it('transposes notes up by semitones', () => {
      const measures = [createTestMeasure(1, [createTestEvent(0, 60)])]; // C4
      const selection: NotationSelection = { startMeasure: 0, endMeasure: 0 };
      
      const result = transposeSelection(measures, selection, 2); // Up major 2nd
      
      const events = result[0].events.get(0);
      expect(events).toBeDefined();
      expect(events![0].notes[0].pitch).toBe(62); // D4
    });

    it('transposes notes down by semitones', () => {
      const measures = [createTestMeasure(1, [createTestEvent(0, 64)])]; // E4
      const selection: NotationSelection = { startMeasure: 0, endMeasure: 0 };
      
      const result = transposeSelection(measures, selection, -3); // Down minor 3rd
      
      const events = result[0].events.get(0);
      expect(events![0].notes[0].pitch).toBe(61); // C#4
    });

    it('transposes multiple measures', () => {
      const measures = [
        createTestMeasure(1, [createTestEvent(0, 60)]),
        createTestMeasure(2, [createTestEvent(0, 62)]),
        createTestMeasure(3, [createTestEvent(0, 64)]),
      ];
      const selection: NotationSelection = { startMeasure: 0, endMeasure: 1 };
      
      const result = transposeSelection(measures, selection, 12); // Up octave
      
      expect(result[0].events.get(0)![0].notes[0].pitch).toBe(72);
      expect(result[1].events.get(0)![0].notes[0].pitch).toBe(74);
      // Third measure should be unchanged
      expect(result[2].events.get(0)![0].notes[0].pitch).toBe(64);
    });
  });

  describe('respellEnharmonic', () => {
    it('respells sharps as flats', () => {
      const measures = [createTestMeasure(1, [{
        id: 'event-0-61',
        tick: 0,
        duration: 'quarter' as const,
        voice: 0,
        staff: 0,
        isRest: false,
        notes: [{
          id: 'note-0-61',
          pitch: 61, // C#4
          letter: 'C' as const,
          accidental: 'sharp' as const,
        }],
      }])];
      const selection: NotationSelection = { startMeasure: 0, endMeasure: 0 };
      
      const result = respellEnharmonic(measures, selection);
      
      const resultEvent = result[0].events.get(0)![0];
      expect(resultEvent.notes[0].accidental).toBe('flat');
    });

    it('respells flats as sharps', () => {
      const measures = [createTestMeasure(1, [{
        id: 'event-0-63',
        tick: 0,
        duration: 'quarter' as const,
        voice: 0,
        staff: 0,
        isRest: false,
        notes: [{
          id: 'note-0-63',
          pitch: 63, // Eb4
          letter: 'E' as const,
          accidental: 'flat' as const,
        }],
      }])];
      const selection: NotationSelection = { startMeasure: 0, endMeasure: 0 };
      
      const result = respellEnharmonic(measures, selection);
      
      const resultEvent = result[0].events.get(0)![0];
      expect(resultEvent.notes[0].accidental).toBe('sharp');
    });

    it('respells E# as F', () => {
      const measures = [createTestMeasure(1, [{
        id: 'event-0-65',
        tick: 0,
        duration: 'quarter' as const,
        voice: 0,
        staff: 0,
        isRest: false,
        notes: [{
          id: 'note-0-65',
          pitch: 65, // E#4 = F4
          letter: 'E' as const,
          accidental: 'sharp' as const,
        }],
      }])];
      const selection: NotationSelection = { startMeasure: 0, endMeasure: 0 };
      
      const result = respellEnharmonic(measures, selection);
      
      const resultEvent = result[0].events.get(0)![0];
      expect(resultEvent.notes[0].accidental).toBeUndefined();
    });
  });
});
