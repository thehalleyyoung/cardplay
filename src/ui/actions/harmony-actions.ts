/**
 * @fileoverview Harmony Actions
 * 
 * Actions for managing harmony context and chord events.
 * Implements G014-G015: "Set Chord" and "Set Key" actions that write to chord streams.
 * 
 * @module @cardplay/ui/actions/harmony-actions
 */

import { getSharedEventStore } from '../../state/event-store';
import { getBoardContextStore } from '../../boards/context/store';
import { getUndoStack } from '../../state/undo-stack';
import { type UndoAction, type UndoActionType } from '../../state/types';
import { type Event } from '../../types/event';
import { asTick, asTickDuration } from '../../types/primitives';
import { generateEventId } from '../../types/event-id';
import { type EventStreamId } from '../../state/types';

// ============================================================================
// CHORD EVENT STRUCTURE
// ============================================================================

/**
 * Chord event payload
 */
export interface ChordPayload {
  /** Chord symbol (e.g., "Cmaj7", "Dm", "G7") */
  symbol: string;
  
  /** Root note (0-11, C=0) */
  root: number;
  
  /** Chord quality/type */
  quality: string;
  
  /** Optional bass note (for slash chords) */
  bass?: number;
  
  /** Optional extensions/tensions */
  extensions?: readonly string[];
}

// ============================================================================
// CHORD STREAM MANAGEMENT
// ============================================================================

/**
 * Ensures a chord stream exists, creating it if necessary.
 * Returns the chord stream ID.
 */
export function ensureChordStream(): EventStreamId {
  const store = getSharedEventStore();
  const contextStore = getBoardContextStore();
  
  // Check if we already have a chord stream
  let chordStreamId = contextStore.getChordStreamId();
  
  if (chordStreamId) {
    const stream = store.getStream(chordStreamId);
    if (stream) {
      return chordStreamId;
    }
  }
  
  // Create a new chord stream
  const newStream = store.createStream({
    name: 'Chord Progression',
    events: []
  });
  
  // Get the ID (createStream with options returns the record)
  chordStreamId = typeof newStream === 'string' ? newStream : newStream.id;
  
  // Store it in context
  contextStore.setChordStreamId(chordStreamId);
  
  return chordStreamId;
}

/**
 * Parses a chord symbol into its components.
 */
function parseChordSymbol(symbol: string): ChordPayload {
  // Match pattern: Root + Quality + (optional extensions)
  // Examples: "C", "Cm", "Cmaj7", "C7", "Dm9", "G7sus4"
  const match = symbol.match(/^([A-G][b#]?)(.*)$/);
  
  if (!match || !match[1]) {
    return {
      symbol: 'C',
      root: 0,
      quality: 'major'
    };
  }
  
  const rootStr = match[1];
  const qualityStr = match[2] || '';
  
  // Map root note to MIDI number (C=0, C#/Db=1, D=2, etc.)
  const rootMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11
  };
  
  const root = rootMap[rootStr] ?? 0;
  
  // Simplify quality string for storage
  let quality = 'major';
  if (qualityStr.startsWith('m')) quality = 'minor';
  if (qualityStr.includes('7') && !qualityStr.includes('maj7')) quality = 'dominant';
  if (qualityStr.includes('maj7')) quality = 'major7';
  if (qualityStr.includes('dim')) quality = 'diminished';
  if (qualityStr.includes('aug')) quality = 'augmented';
  
  // Parse matches and ensure proper typing
  const matchResult = qualityStr.match(/sus|add|[b#]?\d+/g);
  
  // Build result object conditionally to satisfy exactOptionalPropertyTypes
  const result: ChordPayload = {
    symbol,
    root,
    quality
  };
  
  if (matchResult) {
    return { ...result, extensions: matchResult };
  }
  
  return result;
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Sets the current chord and writes it to the chord stream.
 * This action is undoable.
 * 
 * @param chord Chord symbol (e.g., "Cmaj7")
 * @param position Position in ticks (defaults to current transport position)
 * @param duration Duration in ticks (defaults to 1 bar = 1920 ticks)
 */
export function setChord(
  chord: string,
  position?: number,
  duration?: number
): void {
  const store = getSharedEventStore();
  const contextStore = getBoardContextStore();
  const undoStack = getUndoStack();
  
  // Update context
  contextStore.setCurrentChord(chord);
  
  // Ensure chord stream exists
  const chordStreamId = ensureChordStream();
  
  // Get position (current transport position or provided)
  const pos = position ?? contextStore.getTransportPosition();
  
  // Default duration: 1 bar = 1920 ticks (4 beats * 480 PPQ)
  const dur = duration ?? 1920;
  
  // Parse chord symbol
  const chordData = parseChordSymbol(chord);
  
  // Create chord event
  const event: Event<ChordPayload> = {
    id: generateEventId(),
    kind: 'chord' as any, // Using generic event kind - chord events
    start: asTick(pos),
    duration: asTickDuration(dur),
    payload: chordData
  };
  
  // Check if there's already a chord at this position
  const stream = store.getStream(chordStreamId);
  if (!stream) return;
  
  const existingEvents = stream.events.filter(e => 
    e.start === event.start
  );
  
  // Build undo action
  const undoAction: UndoAction = {
    type: 'custom' as UndoActionType,
    timestamp: Date.now(),
    description: `Set chord to ${chord}`,
    undo: () => {
      if (existingEvents.length > 0) {
        // Restore old events
        store.addEvents(chordStreamId, existingEvents);
      }
      if (existingEvents.length === 0) {
        // Remove the new event
        store.removeEvents(chordStreamId, [event.id]);
      }
    },
    redo: () => {
      // Remove old events at this position
      if (existingEvents.length > 0) {
        store.removeEvents(chordStreamId, existingEvents.map(e => e.id));
      }
      // Add new event
      store.addEvents(chordStreamId, [event]);
    }
  };
  
  undoStack.push(undoAction);
  
  // Execute: remove old, add new
  if (existingEvents.length > 0) {
    store.removeEvents(chordStreamId, existingEvents.map(e => e.id));
  }
  store.addEvents(chordStreamId, [event]);
}

/**
 * Sets the current musical key.
 * This updates the board context and can affect harmony hints in views.
 * 
 * @param key Key signature (e.g., "C", "Dm", "F#", "Bbm")
 */
export function setKey(key: string): void {
  const contextStore = getBoardContextStore();
  
  // Update context (no undo needed for key changes - they're preferences)
  contextStore.setCurrentKey(key);
}

/**
 * Removes a chord event at a specific position.
 * 
 * @param position Position in ticks
 */
export function removeChordAt(position: number): void {
  const store = getSharedEventStore();
  const contextStore = getBoardContextStore();
  const undoStack = getUndoStack();
  
  const chordStreamId = contextStore.getChordStreamId();
  if (!chordStreamId) return;
  
  const stream = store.getStream(chordStreamId);
  if (!stream) return;
  
  // Find chord at this position
  const chordEvents = stream.events.filter(e => e.start === asTick(position));
  if (chordEvents.length === 0) return;
  
  // Build undo action
  const undoAction: UndoAction = {
    type: 'custom' as UndoActionType,
    timestamp: Date.now(),
    description: 'Remove chord',
    undo: () => {
      store.addEvents(chordStreamId, chordEvents);
    },
    redo: () => {
      store.removeEvents(chordStreamId, chordEvents.map(e => e.id));
    }
  };
  
  undoStack.push(undoAction);
  
  // Execute
  store.removeEvents(chordStreamId, chordEvents.map(e => e.id));
}

/**
 * Gets all chords from the chord stream.
 * Returns an array of { position, chord } objects.
 */
export function getChordProgression(): Array<{ position: number; chord: string }> {
  const store = getSharedEventStore();
  const contextStore = getBoardContextStore();
  
  const chordStreamId = contextStore.getChordStreamId();
  if (!chordStreamId) return [];
  
  const stream = store.getStream(chordStreamId);
  if (!stream) return [];
  
  return stream.events.map(event => ({
    position: event.start,
    chord: (event.payload as ChordPayload).symbol
  })).sort((a, b) => a.position - b.position);
}
