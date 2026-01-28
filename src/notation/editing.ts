/**
 * @fileoverview Notation Editing Operations.
 * 
 * Functions for editing musical notation: cut/copy/paste, adding/removing measures,
 * changing clefs, key signatures, time signatures, and adding ties, slurs, dynamics, and articulations.
 * 
 * Phase 11.3: Notation Event Editing
 * 
 * @module @cardplay/core/notation/editing
 */

import {
  NotationMeasure,
  NotationEvent,
  NotationNote,
  NoteName,
  ClefType,
  KeySignature,
  TimeSignature,
  NoteTie,
  NoteSlur,
  ArticulationType,
} from './types';
import { Dynamic, DynamicLevel } from './ornaments-dynamics';

// ============================================================================
// CLIPBOARD TYPES
// ============================================================================

export interface NotationClipboard {
  readonly events: Map<number, readonly NotationEvent[]>;
  readonly measures: readonly NotationMeasure[];
  readonly ties: readonly NoteTie[];
  readonly slurs: readonly NoteSlur[];
  readonly type: 'events' | 'measures';
}

export interface NotationSelection {
  readonly startMeasure: number;
  readonly endMeasure: number;
  readonly eventIds?: readonly string[];
}

// ============================================================================
// CUT/COPY/PASTE OPERATIONS
// ============================================================================

export function copyNotation(
  measures: readonly NotationMeasure[],
  selection: NotationSelection,
  _ties: readonly NoteTie[],
  _slurs: readonly NoteSlur[]
): NotationClipboard {
  const selectedMeasures = measures.slice(selection.startMeasure, selection.endMeasure + 1);
  return {
    events: new Map(),
    measures: selectedMeasures,
    ties: [],
    slurs: [],
    type: 'measures',
  };
}

export function cutNotation(
  measures: readonly NotationMeasure[],
  selection: NotationSelection,
  ties: readonly NoteTie[],
  slurs: readonly NoteSlur[]
): {
  clipboard: NotationClipboard;
  updatedMeasures: readonly NotationMeasure[];
  updatedTies: readonly NoteTie[];
  updatedSlurs: readonly NoteSlur[];
} {
  const _clipboard = copyNotation(measures, selection, ties, slurs);
  const updatedMeasures = [
    ...measures.slice(0, selection.startMeasure),
    ...measures.slice(selection.endMeasure + 1),
  ];
  return { clipboard: _clipboard, updatedMeasures, updatedTies: ties, updatedSlurs: slurs };
}

export function pasteNotation(
  measures: readonly NotationMeasure[],
  clipboard: NotationClipboard,
  targetMeasureIndex: number,
  ties: readonly NoteTie[],
  slurs: readonly NoteSlur[]
): {
  updatedMeasures: readonly NotationMeasure[];
  updatedTies: readonly NoteTie[];
  updatedSlurs: readonly NoteSlur[];
} {
  if (clipboard.type !== 'measures' || clipboard.measures.length === 0) {
    return { updatedMeasures: measures, updatedTies: ties, updatedSlurs: slurs };
  }
  
  // Insert clipboard measures at the target position
  const updatedMeasures = [
    ...measures.slice(0, targetMeasureIndex),
    ...clipboard.measures,
    ...measures.slice(targetMeasureIndex),
  ];
  
  // TODO: Handle updating ties and slurs that span across paste boundary
  return { updatedMeasures, updatedTies: ties, updatedSlurs: slurs };
}

// ============================================================================
// MEASURE OPERATIONS
// ============================================================================

export function insertMeasure(
  measures: readonly NotationMeasure[],
  index: number
): readonly NotationMeasure[] {
  const newMeasure: NotationMeasure = {
    number: index + 1,
    events: new Map(),
  };
  const result = [...measures];
  result.splice(index, 0, newMeasure);
  return result;
}

export function deleteMeasure(
  measures: readonly NotationMeasure[],
  index: number
): readonly NotationMeasure[] {
  return [...measures.slice(0, index), ...measures.slice(index + 1)];
}

// ============================================================================
// CLEF OPERATIONS
// ============================================================================

export function changeClef(
  measures: readonly NotationMeasure[],
  measureIndex: number,
  clefType: ClefType
): readonly NotationMeasure[] {
  if (measureIndex < 0 || measureIndex >= measures.length) {
    return measures;
  }
  
  return measures.map((measure, idx) => {
    if (idx !== measureIndex) return measure;
    
    return {
      ...measure,
      clefChanges: [{ tick: 0, clef: clefType, staff: 0 }],
    };
  });
}

// ============================================================================
// KEY SIGNATURE OPERATIONS
// ============================================================================

/**
 * Map key signature strings to KeySignature values.
 */
const KEY_STRING_MAP: Record<string, KeySignature> = {
  'C major': { root: 'C', mode: 'major', accidentals: 0 },
  'A minor': { root: 'A', mode: 'minor', accidentals: 0 },
  'G major': { root: 'G', mode: 'major', accidentals: 1 },
  'E minor': { root: 'E', mode: 'minor', accidentals: 1 },
  'D major': { root: 'D', mode: 'major', accidentals: 2 },
  'B minor': { root: 'B', mode: 'minor', accidentals: 2 },
  'A major': { root: 'A', mode: 'major', accidentals: 3 },
  'F# minor': { root: 'F', mode: 'minor', accidentals: 3 },
  'E major': { root: 'E', mode: 'major', accidentals: 4 },
  'C# minor': { root: 'C', mode: 'minor', accidentals: 4 },
  'B major': { root: 'B', mode: 'major', accidentals: 5 },
  'G# minor': { root: 'G', mode: 'minor', accidentals: 5 },
  'F# major': { root: 'F', mode: 'major', accidentals: 6 },
  'D# minor': { root: 'D', mode: 'minor', accidentals: 6 },
  'C# major': { root: 'C', mode: 'major', accidentals: 7 },
  'A# minor': { root: 'A', mode: 'minor', accidentals: 7 },
  'F major': { root: 'F', mode: 'major', accidentals: -1 },
  'D minor': { root: 'D', mode: 'minor', accidentals: -1 },
  'Bb major': { root: 'B', mode: 'major', accidentals: -2 },
  'G minor': { root: 'G', mode: 'minor', accidentals: -2 },
  'Eb major': { root: 'E', mode: 'major', accidentals: -3 },
  'C minor': { root: 'C', mode: 'minor', accidentals: -3 },
  'Ab major': { root: 'A', mode: 'major', accidentals: -4 },
  'F minor': { root: 'F', mode: 'minor', accidentals: -4 },
  'Db major': { root: 'D', mode: 'major', accidentals: -5 },
  'Bb minor': { root: 'B', mode: 'minor', accidentals: -5 },
  'Gb major': { root: 'G', mode: 'major', accidentals: -6 },
  'Eb minor': { root: 'E', mode: 'minor', accidentals: -6 },
  'Cb major': { root: 'C', mode: 'major', accidentals: -7 },
  'Ab minor': { root: 'A', mode: 'minor', accidentals: -7 },
};

function parseKeySignature(key: KeySignature | string): KeySignature {
  if (typeof key === 'object' && 'root' in key) return key;
  
  if (typeof key === 'string') {
    // Try to find the key in the map
    const mapped = KEY_STRING_MAP[key];
    if (mapped) return mapped;
  }
  
  // Default to C major
  return { root: 'C', mode: 'major', accidentals: 0 };
}

export function changeKeySignature(
  measures: readonly NotationMeasure[],
  measureIndex: number,
  keySignature: KeySignature | string
): readonly NotationMeasure[] {
  if (measureIndex < 0 || measureIndex >= measures.length) {
    return measures;
  }
  
  const parsedKey = parseKeySignature(keySignature);
  
  return measures.map((measure, idx) => {
    if (idx !== measureIndex) return measure;
    
    return {
      ...measure,
      keySignature: parsedKey,
    };
  });
}

// ============================================================================
// TIME SIGNATURE OPERATIONS
// ============================================================================

/**
 * Map time signature strings to TimeSignature values.
 */
const TIME_STRING_MAP: Record<string, TimeSignature> = {
  '4/4': { numerator: 4, denominator: 4 },
  '3/4': { numerator: 3, denominator: 4 },
  '2/4': { numerator: 2, denominator: 4 },
  '6/8': { numerator: 6, denominator: 8 },
  '2/2': { numerator: 2, denominator: 2 },
  '3/8': { numerator: 3, denominator: 8 },
  '9/8': { numerator: 9, denominator: 8 },
  '12/8': { numerator: 12, denominator: 8 },
  '5/4': { numerator: 5, denominator: 4 },
  '7/8': { numerator: 7, denominator: 8 },
  'C': { numerator: 4, denominator: 4 },
  'cut': { numerator: 2, denominator: 2 },
};

function parseTimeSignature(timeSig: TimeSignature | string): TimeSignature {
  if (typeof timeSig === 'object' && 'numerator' in timeSig) return timeSig;
  
  if (typeof timeSig === 'string') {
    // Try to find in map
    const mapped = TIME_STRING_MAP[timeSig];
    if (mapped) return mapped;
    
    // Try to parse "n/d" format
    const match = timeSig.match(/^(\d+)\/(\d+)$/);
    if (match) {
      return {
        numerator: parseInt(match[1]!, 10),
        denominator: parseInt(match[2]!, 10),
      };
    }
  }
  
  // Default to 4/4
  return { numerator: 4, denominator: 4 };
}

export function changeTimeSignature(
  measures: readonly NotationMeasure[],
  measureIndex: number,
  timeSignature: TimeSignature | string
): readonly NotationMeasure[] {
  if (measureIndex < 0 || measureIndex >= measures.length) {
    return measures;
  }
  
  const parsedTimeSig = parseTimeSignature(timeSignature);
  
  return measures.map((measure, idx) => {
    if (idx !== measureIndex) return measure;
    
    return {
      ...measure,
      timeSignature: parsedTimeSig,
    };
  });
}

// ============================================================================
// TIE OPERATIONS
// ============================================================================

export function addTie(
  ties: readonly NoteTie[],
  startNoteId: string,
  endNoteId: string,
  placement: 'above' | 'below' | 'auto' = 'auto'
): readonly NoteTie[] {
  const newTie: NoteTie = {
    id: `tie-${Date.now()}`,
    startNoteId,
    endNoteId,
    placement,
  };
  return [...ties, newTie];
}

export function removeTie(
  ties: readonly NoteTie[],
  tieId: string
): readonly NoteTie[] {
  return ties.filter(t => t.id !== tieId);
}

// ============================================================================
// SLUR OPERATIONS
// ============================================================================

export function addSlur(
  slurs: readonly NoteSlur[],
  startNoteId: string,
  endNoteId: string,
  placement: 'above' | 'below' | 'auto' = 'auto'
): readonly NoteSlur[] {
  const newSlur: NoteSlur = {
    id: `slur-${Date.now()}`,
    startNoteId,
    endNoteId,
    placement,
  };
  return [...slurs, newSlur];
}

export function removeSlur(
  slurs: readonly NoteSlur[],
  slurId: string
): readonly NoteSlur[] {
  return slurs.filter(s => s.id !== slurId);
}

// ============================================================================
// DYNAMICS OPERATIONS
// ============================================================================

export function addDynamics(
  dynamics: readonly Dynamic[],
  level: DynamicLevel,
  tick: number,
  voice: number,
  staff: number
): readonly Dynamic[] {
  return [...dynamics, { level, tick, voice, staff }];
}

export function removeDynamics(
  dynamics: readonly Dynamic[],
  tick: number,
  voice: number,
  staff: number
): readonly Dynamic[] {
  return dynamics.filter(d => d.tick !== tick || d.voice !== voice || d.staff !== staff);
}

// ============================================================================
// ARTICULATION OPERATIONS
// ============================================================================

export function addArticulation(
  measures: readonly NotationMeasure[],
  measureIndex: number,
  eventId: string,
  articulation: ArticulationType
): readonly NotationMeasure[] {
  if (measureIndex < 0 || measureIndex >= measures.length) {
    return measures;
  }
  
  return measures.map((measure, idx) => {
    if (idx !== measureIndex) return measure;
    
    const newEvents = new Map<number, NotationEvent[]>();
    for (const [voice, voiceEvents] of measure.events) {
      const updatedEvents = voiceEvents.map((event, eventIdx) => {
        // Match event by ID or index
        const currentId = `event-${eventIdx}`;
        if (currentId !== eventId) return event;
        
        const existingArticulations = event.articulations ?? [];
        if (existingArticulations.includes(articulation)) return event;
        
        return {
          ...event,
          articulations: [...existingArticulations, articulation],
        };
      });
      newEvents.set(voice, updatedEvents);
    }
    
    return { ...measure, events: newEvents };
  });
}

export function removeArticulation(
  measures: readonly NotationMeasure[],
  measureIndex: number,
  eventId: string,
  articulation: ArticulationType
): readonly NotationMeasure[] {
  if (measureIndex < 0 || measureIndex >= measures.length) {
    return measures;
  }
  
  return measures.map((measure, idx) => {
    if (idx !== measureIndex) return measure;
    
    const newEvents = new Map<number, NotationEvent[]>();
    for (const [voice, voiceEvents] of measure.events) {
      const updatedEvents = voiceEvents.map((event, eventIdx) => {
        const currentId = `event-${eventIdx}`;
        if (currentId !== eventId) return event;
        
        const existingArticulations = event.articulations ?? [];
        return {
          ...event,
          articulations: existingArticulations.filter(a => a !== articulation),
        };
      });
      newEvents.set(voice, updatedEvents);
    }
    
    return { ...measure, events: newEvents };
  });
}

// ============================================================================
// TEXT ANNOTATION OPERATIONS
// ============================================================================

export interface TextAnnotation {
  readonly text: string;
  readonly tick?: number;
  readonly placement?: 'above' | 'below';
}

export function addTextAnnotation(
  measures: readonly NotationMeasure[],
  measureIndex: number,
  text: string
): readonly NotationMeasure[] {
  if (measureIndex < 0 || measureIndex >= measures.length) {
    return measures;
  }
  
  return measures.map((measure, idx) => {
    if (idx !== measureIndex) return measure;
    
    const existingAnnotations = (measure as any).annotations ?? [];
    const newAnnotation: TextAnnotation = { text, tick: 0, placement: 'above' };
    
    return {
      ...measure,
      annotations: [...existingAnnotations, newAnnotation],
    };
  });
}

// ============================================================================
// TRANSPOSE OPERATIONS
// ============================================================================

/**
 * Transposes notes in a selection by a number of semitones.
 */
export function transposeSelection(
  measures: readonly NotationMeasure[],
  selection: NotationSelection,
  semitones: number
): readonly NotationMeasure[] {
  return measures.map((measure, idx) => {
    // Only transpose measures in selection
    if (idx < selection.startMeasure || idx > selection.endMeasure) {
      return measure;
    }
    
    const newEvents = new Map<number, NotationEvent[]>();
    for (const [voice, voiceEvents] of measure.events) {
      const transposedEvents = voiceEvents.map(event => {
        const transposedNotes = event.notes.map(note => ({
          ...note,
          pitch: note.pitch + semitones,
        }));
        return { ...event, notes: transposedNotes };
      });
      newEvents.set(voice, transposedEvents);
    }
    
    return { ...measure, events: newEvents };
  });
}

/**
 * Maps for enharmonic respelling.
 * Maps (letter + accidental) -> (new letter + new accidental).
 */
const ENHARMONIC_MAP: Record<string, { letter: NoteName; accidental?: 'sharp' | 'flat' }> = {
  // Sharps to flats
  'C-sharp': { letter: 'D', accidental: 'flat' },
  'D-sharp': { letter: 'E', accidental: 'flat' },
  'F-sharp': { letter: 'G', accidental: 'flat' },
  'G-sharp': { letter: 'A', accidental: 'flat' },
  'A-sharp': { letter: 'B', accidental: 'flat' },
  // Flats to sharps
  'D-flat': { letter: 'C', accidental: 'sharp' },
  'E-flat': { letter: 'D', accidental: 'sharp' },
  'G-flat': { letter: 'F', accidental: 'sharp' },
  'A-flat': { letter: 'G', accidental: 'sharp' },
  'B-flat': { letter: 'A', accidental: 'sharp' },
  // Special cases (E#/Fb, B#/Cb)
  'E-sharp': { letter: 'F' },
  'B-sharp': { letter: 'C' },
  'F-flat': { letter: 'E' },
  'C-flat': { letter: 'B' },
};

/**
 * Respells enharmonic equivalents (e.g., C# → Db, Eb → D#).
 */
export function respellEnharmonic(
  measures: readonly NotationMeasure[],
  selection: NotationSelection
): readonly NotationMeasure[] {
  return measures.map((measure, idx) => {
    // Only respell measures in selection
    if (idx < selection.startMeasure || idx > selection.endMeasure) {
      return measure;
    }
    
    const newEvents = new Map<number, NotationEvent[]>();
    for (const [voice, voiceEvents] of measure.events) {
      const respelledEvents = voiceEvents.map(event => {
        const respelledNotes = event.notes.map(note => {
          // NotationNote.pitch is just a number (MIDI), accidental is separate
          if (!note.accidental) return note;
          
          // Use letter property if available (extended note), otherwise derive from pitch
          const noteWithLetter = note as NotationNote & { letter?: NoteName };
          let letter: NoteName;
          if (noteWithLetter.letter) {
            letter = noteWithLetter.letter;
          } else {
            // Fallback: derive from MIDI pitch (less accurate)
            const noteNames: NoteName[] = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
            const pitchClass = note.pitch % 12;
            letter = noteNames[pitchClass]!;
          }
          
          const key = `${letter}-${note.accidental}`;
          const enharmonic = ENHARMONIC_MAP[key];
          if (!enharmonic) return note;
          
          // Build new note, removing accidental if enharmonic has none
          const { accidental: _removed, ...noteWithoutAccidental } = note as NotationNote & { accidental?: string };
          return {
            ...noteWithoutAccidental,
            ...(enharmonic.accidental ? { accidental: enharmonic.accidental } : {}),
          };
        });
        return { ...event, notes: respelledNotes };
      });
      newEvents.set(voice, respelledEvents);
    }
    
    return { ...measure, events: newEvents };
  });
}
