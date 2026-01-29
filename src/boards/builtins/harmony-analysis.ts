/**
 * @fileoverview Harmonic Analysis and Suggestions (Phase G: G103-G106)
 * 
 * Harmony helper features for assisted boards:
 * - G103: Chord tone highlighting in views (non-destructive)
 * - G104: Snap selection to chord tones (undoable transform)
 * - G105: Harmonize selection with voice-leading
 * - G106: Reharmonization suggestions
 * 
 * @module @cardplay/boards/builtins/harmony-analysis
 */

import type { Event } from '../../types/event';
import type { EventStreamId, EventId } from '../../state/types';
import { getSharedEventStore } from '../../state/event-store';
import { getUndoStack } from '../../state/undo-stack';

// ============================================================================
// MUSIC THEORY PRIMITIVES
// ============================================================================

/**
 * Musical key.
 */
export interface MusicalKey {
  /** Root note (0-11, C=0) */
  root: number;
  
  /** Scale type */
  scale: 'major' | 'minor' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'locrian';
  
  /** Display name */
  name: string;
}

/**
 * Chord.
 */
export interface Chord {
  /** Root note (0-11) */
  root: number;
  
  /** Chord quality */
  quality: 'major' | 'minor' | 'diminished' | 'augmented' | 'sus2' | 'sus4' | 'dom7' | 'maj7' | 'min7';
  
  /** Extension notes */
  extensions: number[];
  
  /** Bass note (if different from root) */
  bass?: number;
  
  /** Display name (e.g., "Cmaj7") */
  name: string;
}

/**
 * Get scale degrees for a scale type.
 */
export function getScaleDegrees(scale: MusicalKey['scale']): number[] {
  const patterns: Record<MusicalKey['scale'], number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10]
  };
  
  return patterns[scale];
}

/**
 * Get chord tones for a chord.
 */
export function getChordTones(chord: Chord): number[] {
  const intervals: Record<Chord['quality'], number[]> = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    diminished: [0, 3, 6],
    augmented: [0, 4, 8],
    sus2: [0, 2, 7],
    sus4: [0, 5, 7],
    dom7: [0, 4, 7, 10],
    maj7: [0, 4, 7, 11],
    min7: [0, 3, 7, 10]
  };
  
  const baseTones = intervals[chord.quality].map(i => (chord.root + i) % 12);
  const extensionTones = chord.extensions.map(e => (chord.root + e) % 12);
  
  return [...baseTones, ...extensionTones];
}

// ============================================================================
// G103: CHORD TONE HIGHLIGHTING
// ============================================================================

/**
 * Note classification relative to harmony.
 */
export type NoteClass = 'chord-tone' | 'scale-tone' | 'out-of-key' | 'passing' | 'neighbor';

/**
 * Classify a note relative to current harmony.
 */
export function classifyNote(
  noteNumber: number,
  key: MusicalKey,
  chord: Chord | null
): NoteClass {
  const notePitchClass = noteNumber % 12;
  
  // Check if chord tone
  if (chord) {
    const chordTones = getChordTones(chord);
    if (chordTones.includes(notePitchClass)) {
      return 'chord-tone';
    }
  }
  
  // Check if scale tone
  const scaleDegrees = getScaleDegrees(key.scale);
  const keyScaleTones = scaleDegrees.map(d => (key.root + d) % 12);
  
  if (keyScaleTones.includes(notePitchClass)) {
    return 'scale-tone';
  }
  
  // Out of key
  return 'out-of-key';
}

/**
 * Get highlighting style for a note classification.
 */
export function getHighlightStyle(classification: NoteClass): {
  color: string;
  opacity: number;
  emphasis: boolean;
} {
  const styles: Record<NoteClass, ReturnType<typeof getHighlightStyle>> = {
    'chord-tone': { color: '#4CAF50', opacity: 1.0, emphasis: true },
    'scale-tone': { color: '#2196F3', opacity: 0.7, emphasis: false },
    'out-of-key': { color: '#FF5722', opacity: 0.5, emphasis: false },
    'passing': { color: '#FFC107', opacity: 0.6, emphasis: false },
    'neighbor': { color: '#9C27B0', opacity: 0.6, emphasis: false }
  };
  
  return styles[classification];
}

/**
 * G103: Apply chord tone highlighting to events.
 * 
 * Non-destructive - returns classification data without mutating events.
 */
export function highlightChordTones(
  events: Event<{ note: number; velocity: number }>[],
  key: MusicalKey,
  chord: Chord | null
): Map<string, NoteClass> {
  const classifications = new Map<string, NoteClass>();
  
  for (const event of events) {
    const classification = classifyNote(event.payload.note, key, chord);
    classifications.set(event.id, classification);
  }
  
  return classifications;
}

// ============================================================================
// G104: SNAP TO CHORD TONES
// ============================================================================

/**
 * Find nearest chord tone to a note.
 */
export function findNearestChordTone(
  noteNumber: number,
  chord: Chord,
  direction: 'nearest' | 'up' | 'down' = 'nearest'
): number {
  const chordTones = getChordTones(chord);
  const notePitchClass = noteNumber % 12;
  const octave = Math.floor(noteNumber / 12);
  
  // Find chord tone in same octave
  let nearestPitchClass = chordTones[0];
  let minDistance = 12;
  
  for (const tone of chordTones) {
    const distance = Math.abs(tone - notePitchClass);
    
    if (direction === 'nearest') {
      if (distance < minDistance) {
        minDistance = distance;
        nearestPitchClass = tone;
      }
    } else if (direction === 'up') {
      if (tone >= notePitchClass && distance < minDistance) {
        minDistance = distance;
        nearestPitchClass = tone;
      }
    } else if (direction === 'down') {
      if (tone <= notePitchClass && distance < minDistance) {
        minDistance = distance;
        nearestPitchClass = tone;
      }
    }
  }
  
  return octave * 12 + (nearestPitchClass ?? (chordTones[0] ?? 0));
}

/**
 * G104: Snap selected notes to nearest chord tones.
 * 
 * Undoable transform that moves notes to closest chord tone.
 * Preserves rhythm (start times and durations unchanged).
 */
export function snapToChordTones(
  streamId: EventStreamId,
  eventIds: readonly EventId[],
  chord: Chord,
  direction: 'nearest' | 'up' | 'down' = 'nearest'
): void {
  const store = getSharedEventStore();
  const stream = store.getStream(streamId);
  
  if (!stream) {
    console.warn('Stream not found:', streamId);
    return;
  }
  
  // Find events to snap
  const eventsToSnap = stream.events.filter(e => eventIds.includes(e.id));
  
  if (eventsToSnap.length === 0) {
    console.info('No events to snap');
    return;
  }
  
  // Create snapped versions
  const snappedEvents = eventsToSnap.map(event => {
    const notePayload = event.payload as { note: number; velocity: number };
    const snappedNote = findNearestChordTone(notePayload.note, chord, direction);
    
    return {
      ...event,
      payload: {
        ...notePayload,
        note: snappedNote
      }
    };
  });
  
  // Apply changes
  store.removeEvents(streamId, eventIds);
  store.addEvents(streamId, snappedEvents);
  
  // Wrap in undo
  getUndoStack().push({
    type: 'batch',
    description: `Snap ${eventIds.length} notes to chord tones`,
    undo: () => {
      store.removeEvents(streamId, eventIds);
      store.addEvents(streamId, eventsToSnap);
    },
    redo: () => {
      store.removeEvents(streamId, eventIds);
      store.addEvents(streamId, snappedEvents);
    }
  });
  
  console.info('Snapped notes to chord:', {
    count: eventIds.length,
    chord: chord.name,
    direction
  });
}

// ============================================================================
// G105: VOICE-LEADING HARMONIZATION
// ============================================================================

/**
 * Voice-leading rules for harmonization.
 */
export interface VoiceLeadingRules {
  /** Max interval between consecutive notes in a voice */
  maxVoiceInterval: number;
  
  /** Prefer contrary motion */
  preferContraryMotion: boolean;
  
  /** Avoid parallel fifths/octaves */
  avoidParallels: boolean;
  
  /** Voice range constraints */
  voiceRanges: Array<{ min: number; max: number }>;
}

/**
 * Default voice-leading rules (SATB).
 */
export const DEFAULT_VOICE_LEADING: VoiceLeadingRules = {
  maxVoiceInterval: 7, // Perfect fifth
  preferContraryMotion: true,
  avoidParallels: true,
  voiceRanges: [
    { min: 48, max: 67 },  // Soprano (C3-G4)
    { min: 43, max: 62 },  // Alto (G2-D4)
    { min: 36, max: 55 },  // Tenor (C2-G3)
    { min: 28, max: 48 }   // Bass (E1-C3)
  ]
};

/**
 * G105: Harmonize melody with voice-leading.
 * 
 * Stub implementation - would use phrase-adapter.ts for full voice-leading.
 * For MVP, adds basic harmony notes below melody.
 */
export function harmonizeMelody(
  streamId: EventStreamId,
  eventIds: readonly EventId[],
  chord: Chord,
  _rules: VoiceLeadingRules = DEFAULT_VOICE_LEADING
): void {
  const store = getSharedEventStore();
  const stream = store.getStream(streamId);
  
  if (!stream) {
    console.warn('Stream not found:', streamId);
    return;
  }
  
  const melodyEvents = stream.events.filter(e => eventIds.includes(e.id));
  
  if (melodyEvents.length === 0) {
    console.info('No melody events to harmonize');
    return;
  }
  
  // Simple harmonization: add thirds and fifths below melody
  const harmonyEvents: Array<Event<{ note: number; velocity: number }>> = [];
  
  for (const melodyEvent of melodyEvents) {
    const melodyNote = (melodyEvent.payload as { note: number }).note;
    
    // Add harmony note (third below)
    const harmonyNote = melodyNote - 4; // Major third
    
    harmonyEvents.push({
      id: `${melodyEvent.id}-harmony` as EventId,
      kind: melodyEvent.kind,
      start: melodyEvent.start,
      duration: melodyEvent.duration,
      payload: {
        note: harmonyNote,
        velocity: (melodyEvent.payload as { velocity: number }).velocity * 0.8
      },
      ...(melodyEvent.meta && { meta: melodyEvent.meta }),
      triggers: []
    });
  }
  
  // Add harmony events
  store.addEvents(streamId, harmonyEvents);
  
  // Wrap in undo
  getUndoStack().push({
    type: 'batch',
    description: `Harmonize ${eventIds.length} notes`,
    undo: () => {
      store.removeEvents(streamId, harmonyEvents.map(e => e.id));
    },
    redo: () => {
      store.addEvents(streamId, harmonyEvents);
    }
  });
  
  console.info('Harmonized melody:', {
    melodyNotes: eventIds.length,
    harmonyNotes: harmonyEvents.length,
    chord: chord.name
  });
}

// ============================================================================
// G106: REHARMONIZATION SUGGESTIONS
// ============================================================================

/**
 * Chord suggestion with score.
 */
export interface ChordSuggestion {
  /** Suggested chord */
  chord: Chord;
  
  /** Confidence score (0-1) */
  score: number;
  
  /** Reason for suggestion */
  reason: string;
}

/**
 * G106: Get reharmonization suggestions for a passage.
 * 
 * Analyzes melody and suggests alternative chords.
 * Returns suggestions without auto-applying (user chooses).
 */
export function getReharmonizationSuggestions(
  events: Event<{ note: number; velocity: number }>[],
  currentChord: Chord,
  _key: MusicalKey
): ChordSuggestion[] {
  const suggestions: ChordSuggestion[] = [];
  
  // Analyze note distribution
  const pitchClasses = events.map(e => e.payload.note % 12);
  const pitchCounts = new Map<number, number>();
  
  for (const pc of pitchClasses) {
    pitchCounts.set(pc, (pitchCounts.get(pc) || 0) + 1);
  }
  
  // Find most prominent notes
  const sortedPitches = Array.from(pitchCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([pc]) => pc);
  
  // Suggest chords based on prominent notes
  // (Simplified - full implementation would use music theory rules)
  
  if (sortedPitches.length >= 3) {
    // Suggest chord built on most common note
    const root = sortedPitches[0] ?? 0;
    
    suggestions.push({
      chord: {
        root,
        quality: 'major',
        extensions: [],
        name: `${getNoteFileName(root)}maj`
      },
      score: 0.8,
      reason: 'Built on prominent melodic note'
    });
    
    // Suggest relative minor/major
    const relative = (root + (currentChord.quality === 'major' ? 9 : 3)) % 12;
    
    suggestions.push({
      chord: {
        root: relative,
        quality: currentChord.quality === 'major' ? 'minor' : 'major',
        extensions: [],
        name: `${getNoteFileName(relative)}${currentChord.quality === 'major' ? 'min' : 'maj'}`
      },
      score: 0.7,
      reason: 'Relative key'
    });
  }
  
  console.info('Generated reharmonization suggestions:', suggestions);
  
  return suggestions;
}

/**
 * Get note name for a pitch class.
 */
function getNoteFileName(pitchClass: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return names[pitchClass] ?? 'C';
}
