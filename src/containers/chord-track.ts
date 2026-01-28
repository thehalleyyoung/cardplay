/**
 * @fileoverview Chord Track Container - Global chord progression track.
 * 
 * Provides a central chord track that all harmonic-aware generators
 * (Arranger, Melody, Bassline, Arpeggiator) can query for chord context.
 * 
 * @module @cardplay/containers/chord-track
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase D.1
 */

import type { Event } from '../types/event';
import type { Tick, TickDuration } from '../types/primitives';
import { asTick } from '../types/primitives';
import { createEvent, updateEvent } from '../types/event';
import type {
  EventStreamId,
  EventId,
  SubscriptionId,
} from '../state/types';
import {
  getSharedEventStore,
  executeWithUndo,
} from '../state';

// ============================================================================
// CHORD TYPES
// ============================================================================

/**
 * Chord quality types.
 */
export type ChordQuality =
  | 'major'
  | 'minor'
  | 'diminished'
  | 'augmented'
  | 'sus2'
  | 'sus4'
  | 'power';

/**
 * Chord extension types.
 */
export type ChordExtension =
  | '7'      // Dominant 7th
  | 'maj7'   // Major 7th
  | 'min7'   // Minor 7th
  | 'dim7'   // Diminished 7th
  | '9'      // 9th
  | 'maj9'   // Major 9th
  | 'min9'   // Minor 9th
  | '11'     // 11th
  | '13'     // 13th
  | 'add9'   // Add 9
  | 'add11'  // Add 11
  | '6'      // 6th
  | 'min6';  // Minor 6th

/**
 * Alteration types.
 */
export type ChordAlteration =
  | 'b5'
  | '#5'
  | 'b9'
  | '#9'
  | '#11'
  | 'b13';

/**
 * Root note names.
 */
export type NoteName = 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F' | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B';

/**
 * Chord payload for Event<ChordPayload>.
 */
export interface ChordPayload {
  /** Root note (e.g., 'C', 'F#') */
  readonly root: NoteName;
  /** Chord quality */
  readonly quality: ChordQuality;
  /** Optional extensions (e.g., '7', 'maj7') */
  readonly extensions: readonly ChordExtension[];
  /** Optional alterations (e.g., '#5', 'b9') */
  readonly alterations: readonly ChordAlteration[];
  /** Optional bass note for slash chords (e.g., C/E has bass='E') */
  readonly bass?: NoteName;
  /** Roman numeral analysis (e.g., 'I', 'IV', 'vi') */
  readonly romanNumeral?: string;
  /** Chord function (e.g., 'tonic', 'subdominant', 'dominant') */
  readonly function?: ChordFunction;
}

/**
 * Chord function in harmonic analysis.
 */
export type ChordFunction =
  | 'tonic'
  | 'supertonic'
  | 'mediant'
  | 'subdominant'
  | 'dominant'
  | 'submediant'
  | 'leading';

/**
 * Chord event alias.
 */
export type ChordEvent = Event<ChordPayload>;

// ============================================================================
// CHORD PARSING
// ============================================================================

/**
 * Parses chord symbol string to ChordPayload.
 * 
 * Examples:
 * - "C" → { root: 'C', quality: 'major', extensions: [], alterations: [] }
 * - "Am" → { root: 'A', quality: 'minor', extensions: [], alterations: [] }
 * - "Cmaj7" → { root: 'C', quality: 'major', extensions: ['maj7'], alterations: [] }
 * - "D7#9" → { root: 'D', quality: 'major', extensions: ['7'], alterations: ['#9'] }
 * - "Fm/Ab" → { root: 'F', quality: 'minor', extensions: [], alterations: [], bass: 'Ab' }
 */
export function parseChordSymbol(symbol: string): ChordPayload | null {
  if (!symbol || symbol.trim() === '') return null;

  // Handle slash chords
  let bass: NoteName | undefined;
  let chordPart = symbol;
  
  if (symbol.includes('/')) {
    const [chordRaw, bassRaw] = symbol.split('/');
    if (!chordRaw) return null;
    chordPart = chordRaw;
    bass = bassRaw ? normalizeNoteName(bassRaw) : undefined;
  }

  // Extract root note
  const rootMatch = chordPart.match(/^([A-G][#b]?)/);
  if (!rootMatch) return null;

  const rootText = rootMatch[1];
  if (!rootText) return null;
  const root = normalizeNoteName(rootText);
  if (!root) return null;

  let remaining = chordPart.slice(rootMatch[0].length);

  // Determine quality
  let quality: ChordQuality = 'major';
  const extensions: ChordExtension[] = [];
  const alterations: ChordAlteration[] = [];

  // Check for quality indicators
  if (remaining.startsWith('m') && !remaining.startsWith('maj')) {
    quality = 'minor';
    remaining = remaining.slice(1);
  } else if (remaining.startsWith('dim') || remaining.startsWith('°')) {
    quality = 'diminished';
    remaining = remaining.replace(/^(dim|°)/, '');
  } else if (remaining.startsWith('aug') || remaining.startsWith('+')) {
    quality = 'augmented';
    remaining = remaining.replace(/^(aug|\+)/, '');
  } else if (remaining.startsWith('sus2')) {
    quality = 'sus2';
    remaining = remaining.slice(4);
  } else if (remaining.startsWith('sus4') || remaining.startsWith('sus')) {
    quality = 'sus4';
    remaining = remaining.replace(/^sus4?/, '');
  } else if (remaining.startsWith('5')) {
    quality = 'power';
    remaining = remaining.slice(1);
  }

  // Parse extensions and alterations
  const extensionPattern = /(maj7|maj9|min7|min9|dim7|add9|add11|min6|13|11|9|7|6)/g;
  const alterationPattern = /(b5|#5|b9|#9|#11|b13)/g;

  let match;
  while ((match = extensionPattern.exec(remaining)) !== null) {
    extensions.push(match[1] as ChordExtension);
  }
  while ((match = alterationPattern.exec(remaining)) !== null) {
    alterations.push(match[1] as ChordAlteration);
  }

  return {
    root,
    quality,
    extensions,
    alterations,
    ...(bass !== undefined && { bass }),
  };
}

/**
 * Converts ChordPayload to chord symbol string.
 */
export function chordToSymbol(chord: ChordPayload): string {
  let symbol = chord.root;

  // Quality
  switch (chord.quality) {
    case 'minor':
      symbol += 'm';
      break;
    case 'diminished':
      symbol += 'dim';
      break;
    case 'augmented':
      symbol += 'aug';
      break;
    case 'sus2':
      symbol += 'sus2';
      break;
    case 'sus4':
      symbol += 'sus4';
      break;
    case 'power':
      symbol += '5';
      break;
    // major is implied
  }

  // Extensions
  for (const ext of chord.extensions) {
    symbol += ext;
  }

  // Alterations
  for (const alt of chord.alterations) {
    symbol += alt;
  }

  // Bass note
  if (chord.bass) {
    symbol += '/' + chord.bass;
  }

  return symbol;
}

/**
 * Normalizes note name to canonical form.
 */
function normalizeNoteName(note: string): NoteName | undefined {
  const normalized = note.replace('♯', '#').replace('♭', 'b');
  const validNotes: NoteName[] = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
  
  const found = validNotes.find(n => 
    n.toLowerCase() === normalized.toLowerCase()
  );
  
  return found;
}

// ============================================================================
// CHORD TRACK ADAPTER
// ============================================================================

/**
 * Chord track state.
 */
export interface ChordTrackState {
  /** Stream ID for chord events */
  readonly streamId: EventStreamId;
  /** Current key signature root */
  readonly keyRoot: NoteName;
  /** Current key mode */
  readonly keyMode: 'major' | 'minor';
  /** Display mode */
  readonly displayMode: 'symbol' | 'roman' | 'both';
  /** Playhead position */
  readonly playhead: Tick;
}

/**
 * Callback for chord track state changes.
 */
export type ChordTrackCallback = (state: ChordTrackState) => void;

/**
 * ChordTrackAdapter manages the global chord track.
 * 
 * Usage:
 * ```typescript
 * const chordTrack = new ChordTrackAdapter({ streamId: 'chord-track' });
 * 
 * // Add a chord
 * chordTrack.addChord(0, 1920, 'Cmaj7');
 * 
 * // Query chord at position
 * const chord = chordTrack.getChordAt(480);
 * 
 * // Subscribe to changes
 * chordTrack.subscribe((state) => {
 *   renderChordTrack(chordTrack.getChords());
 * });
 * 
 * // Generators can query current chord
 * const currentChord = chordTrack.getChordAt(playheadTick);
 * ```
 */
export class ChordTrackAdapter {
  private state: ChordTrackState;
  private stateSubscriptions = new Set<ChordTrackCallback>();
  private storeSubscriptionId: SubscriptionId | null = null;
  private disposed = false;

  constructor(options: {
    streamId?: EventStreamId;
    keyRoot?: NoteName;
    keyMode?: 'major' | 'minor';
  } = {}) {
    const store = getSharedEventStore();

    // Create or get stream
    const streamId = options.streamId ?? store.createStream('chord-track');

    // Ensure stream exists
    if (!store.getStream(streamId)) {
      store.createStream({
        id: streamId,
        name: 'chord-track',
        events: [],
      });
    }

    this.state = Object.freeze({
      streamId,
      keyRoot: options.keyRoot ?? 'C',
      keyMode: options.keyMode ?? 'major',
      displayMode: 'symbol',
      playhead: asTick(0),
    });

    // Subscribe to store changes
    this.storeSubscriptionId = store.subscribe(streamId, () => {
      this.notifyStateChange();
    });
  }

  // ==========================================================================
  // STATE ACCESS
  // ==========================================================================

  /**
   * Gets current state.
   */
  getState(): ChordTrackState {
    return this.state;
  }

  /**
   * Gets all chord events.
   */
  getChords(): readonly ChordEvent[] {
    const store = getSharedEventStore();
    return (store.getStream(this.state.streamId)?.events ?? []) as readonly ChordEvent[];
  }

  /** @deprecated legacy helper */
  getAllChords(): readonly ChordEvent[] {
    return this.getChords();
  }

  /** @deprecated legacy helper */
  getChord(id: EventId): ChordEvent | undefined {
    return this.getChords().find(c => c.id === id);
  }

  /** @deprecated legacy helper */
  getChordSymbol(id: EventId): string {
    const chord = this.getChord(id);
    return chord ? chordToSymbol(chord.payload) : '';
  }

  /**
   * Gets chord at a specific tick position.
   */
  getChordAt(tick: Tick): ChordPayload | null {
    const chords = this.getChords();
    
    // Find chord that contains this tick
    const chord = chords.find(c => 
      c.start <= tick && (c.start + c.duration) > tick
    );

    return chord?.payload ?? null;
  }

  /**
   * Gets chord active at playhead.
   */
  getCurrentChord(): ChordPayload | null {
    return this.getChordAt(this.state.playhead);
  }

  /**
   * Gets all chords in a tick range.
   */
  getChordsInRange(start: Tick, end: Tick): readonly ChordEvent[] {
    const chords = this.getChords();
    
    return chords.filter(c =>
      (c.start + c.duration) > start && c.start < end
    );
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  /**
   * Subscribes to chord track changes.
   */
  subscribe(callback: ChordTrackCallback): () => void {
    this.stateSubscriptions.add(callback);
    callback(this.state);

    return () => {
      this.stateSubscriptions.delete(callback);
    };
  }

  private notifyStateChange(): void {
    for (const callback of this.stateSubscriptions) {
      try {
        callback(this.state);
      } catch (e) {
        console.error('Chord track callback error:', e);
      }
    }
  }

  // ==========================================================================
  // EDIT OPERATIONS
  // ==========================================================================

  /**
   * Adds a chord at position.
   */
  addChord(
    start: Tick,
    duration: TickDuration,
    chordSymbol: string | ChordPayload
  ): void {
    const payload = typeof chordSymbol === 'string'
      ? parseChordSymbol(chordSymbol)
      : chordSymbol;

    if (!payload) return;

    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const event = createEvent<ChordPayload>({
      kind: 'chord',
      start,
      duration,
      payload,
    });

    executeWithUndo({
      type: 'event:add',
      description: `Add chord ${chordToSymbol(payload)}`,
      execute: () => {
        store.addEvents(streamId, [event]);
        return event.id as EventId;
      },
      undo: (id) => {
        store.removeEvents(streamId, [id]);
      },
      redo: () => {
        store.addEvents(streamId, [event]);
      },
    });
  }

  /** @deprecated legacy helper */
  addChordFromText(start: Tick, chordText: string, duration: TickDuration): EventId | null {
    const payload = parseChordSymbol(chordText);
    if (!payload) return null;

    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const event = createEvent<ChordPayload>({
      kind: 'chord',
      start,
      duration,
      payload,
    });

    return executeWithUndo<EventId>({
      type: 'events-modify',
      description: `Add chord ${chordToSymbol(payload)}`,
      execute: () => {
        store.addEvents(streamId, [event]);
        return event.id as EventId;
      },
      undo: (id) => {
        store.removeEvents(streamId, [id]);
      },
      redo: () => {
        store.addEvents(streamId, [event]);
      },
    });
  }

  /**
   * Updates a chord.
   */
  updateChord(eventId: string, updates: Partial<{
    start: Tick;
    duration: TickDuration;
    payload: ChordPayload;
  }>): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const chords = this.getChords();
    const chord = chords.find(c => c.id === eventId);

    if (!chord) return;

    const targetId = eventId as EventId;
    const oldState = {
      start: chord.start,
      duration: chord.duration,
      payload: chord.payload,
    };

    executeWithUndo({
      type: 'event:update',
      description: 'Update chord',
      execute: () => {
        const updated = updateEvent(chord, updates);
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === targetId ? updated : e)),
        }));
        return oldState;
      },
      undo: (old) => {
        const restored = updateEvent(chord, old);
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === targetId ? restored : e)),
        }));
      },
      redo: () => {
        const updated = updateEvent(chord, updates);
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === targetId ? updated : e)),
        }));
      },
    });
  }

  /**
   * Deletes a chord.
   */
  deleteChord(eventId: string): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const chords = this.getChords();
    const chord = chords.find(c => c.id === eventId);

    if (!chord) return;

    executeWithUndo({
      type: 'event:delete',
      description: `Delete chord ${chordToSymbol(chord.payload)}`,
      execute: () => {
        store.removeEvents(streamId, [eventId as EventId]);
        return chord;
      },
      undo: (deleted) => {
        store.addEvents(streamId, [deleted]);
      },
      redo: () => {
        store.removeEvents(streamId, [eventId as EventId]);
      },
    });
  }

  /** @deprecated legacy helper */
  removeChord(eventId: EventId): void {
    this.deleteChord(eventId);
  }

  /** @deprecated legacy helper */
  moveChord(eventId: EventId, newStart: Tick): void {
    this.updateChord(eventId, { start: newStart });
  }

  /** @deprecated legacy helper */
  resizeChord(eventId: EventId, newDuration: TickDuration): void {
    this.updateChord(eventId, { duration: newDuration });
  }

  /**
   * Clears all chords.
   */
  clearChords(): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const chords = this.getChords();

    if (chords.length === 0) return;

    executeWithUndo({
      type: 'event:delete',
      description: 'Clear all chords',
      execute: () => {
        store.setStream(streamId, []);
        return [...chords];
      },
      undo: (deleted) => {
        store.setStream(streamId, deleted);
      },
      redo: () => {
        store.setStream(streamId, []);
      },
    });
  }

  // ==========================================================================
  // KEY SIGNATURE
  // ==========================================================================

  /**
   * Sets key signature.
   */
  setKey(root: NoteName, mode: 'major' | 'minor'): void {
    this.state = Object.freeze({
      ...this.state,
      keyRoot: root,
      keyMode: mode,
    });
    this.notifyStateChange();
  }

  /**
   * Analyzes chord in current key and returns roman numeral.
   */
  analyzeChord(chord: ChordPayload): string {
    const { keyRoot, keyMode } = this.state;
    return getRomanNumeral(chord.root, keyRoot, keyMode, chord.quality);
  }

  // ==========================================================================
  // VIEW OPERATIONS
  // ==========================================================================

  /**
   * Sets display mode.
   */
  setDisplayMode(mode: 'symbol' | 'roman' | 'both'): void {
    this.state = Object.freeze({
      ...this.state,
      displayMode: mode,
    });
    this.notifyStateChange();
  }

  /**
   * Sets playhead position.
   */
  setPlayhead(tick: Tick): void {
    this.state = Object.freeze({
      ...this.state,
      playhead: tick,
    });
    this.notifyStateChange();
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  /**
   * Disposes adapter.
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.storeSubscriptionId) {
      getSharedEventStore().unsubscribe(this.storeSubscriptionId);
    }

    this.stateSubscriptions.clear();
  }
}

// ============================================================================
// HARMONIC UTILITIES
// ============================================================================

/**
 * Note name to semitone offset from C.
 */
const NOTE_TO_SEMITONE: Record<NoteName, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
};

/**
 * Gets roman numeral for chord in key.
 */
function getRomanNumeral(
  chordRoot: NoteName,
  keyRoot: NoteName,
  keyMode: 'major' | 'minor',
  chordQuality: ChordQuality
): string {
  const chordSemitone = NOTE_TO_SEMITONE[chordRoot];
  const keySemitone = NOTE_TO_SEMITONE[keyRoot];
  const interval = (chordSemitone - keySemitone + 12) % 12;

  // Major scale degree names
  const majorDegrees = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII'];
  const minorDegrees = ['i', 'bII', 'ii', 'bIII', 'III', 'iv', '#iv', 'v', 'bVI', 'VI', 'bVII', 'VII'];

  const degrees = keyMode === 'major' ? majorDegrees : minorDegrees;
  let numeral = degrees[interval] ?? '?';

  // Adjust case based on chord quality
  if (chordQuality === 'minor' || chordQuality === 'diminished') {
    numeral = numeral.toLowerCase();
  } else if (chordQuality === 'major' || chordQuality === 'augmented') {
    numeral = numeral.toUpperCase();
  }

  // Add quality indicators
  if (chordQuality === 'diminished') {
    numeral += '°';
  } else if (chordQuality === 'augmented') {
    numeral += '+';
  }

  return numeral;
}

/**
 * Gets chord tones as MIDI pitch classes.
 */
export function getChordTones(chord: ChordPayload): readonly number[] {
  const rootSemitone = NOTE_TO_SEMITONE[chord.root];
  const tones: number[] = [rootSemitone];

  // Add third based on quality
  switch (chord.quality) {
    case 'major':
    case 'augmented':
      tones.push((rootSemitone + 4) % 12); // Major third
      break;
    case 'minor':
    case 'diminished':
      tones.push((rootSemitone + 3) % 12); // Minor third
      break;
    case 'sus2':
      tones.push((rootSemitone + 2) % 12); // Major second
      break;
    case 'sus4':
      tones.push((rootSemitone + 5) % 12); // Perfect fourth
      break;
    case 'power':
      // No third in power chord
      break;
  }

  // Add fifth
  switch (chord.quality) {
    case 'diminished':
      tones.push((rootSemitone + 6) % 12); // Diminished fifth
      break;
    case 'augmented':
      tones.push((rootSemitone + 8) % 12); // Augmented fifth
      break;
    default:
      tones.push((rootSemitone + 7) % 12); // Perfect fifth
  }

  // Add extensions
  for (const ext of chord.extensions) {
    switch (ext) {
      case '7':
        tones.push((rootSemitone + 10) % 12); // Dominant 7th
        break;
      case 'maj7':
        tones.push((rootSemitone + 11) % 12); // Major 7th
        break;
      case 'min7':
        tones.push((rootSemitone + 10) % 12); // Minor 7th
        break;
      case 'dim7':
        tones.push((rootSemitone + 9) % 12); // Diminished 7th
        break;
      case '9':
      case 'maj9':
      case 'min9':
      case 'add9':
        tones.push((rootSemitone + 2) % 12); // 9th (major 2nd)
        break;
      case '11':
      case 'add11':
        tones.push((rootSemitone + 5) % 12); // 11th (perfect 4th)
        break;
      case '13':
        tones.push((rootSemitone + 9) % 12); // 13th (major 6th)
        break;
      case '6':
      case 'min6':
        tones.push((rootSemitone + 9) % 12); // 6th
        break;
    }
  }

  // Apply alterations
  for (const alt of chord.alterations) {
    switch (alt) {
      case 'b5':
        // Replace 5th with b5
        const idx5 = tones.indexOf((rootSemitone + 7) % 12);
        if (idx5 !== -1) tones[idx5] = (rootSemitone + 6) % 12;
        break;
      case '#5':
        const idx5s = tones.indexOf((rootSemitone + 7) % 12);
        if (idx5s !== -1) tones[idx5s] = (rootSemitone + 8) % 12;
        break;
      case 'b9':
        tones.push((rootSemitone + 1) % 12);
        break;
      case '#9':
        tones.push((rootSemitone + 3) % 12);
        break;
      case '#11':
        tones.push((rootSemitone + 6) % 12);
        break;
      case 'b13':
        tones.push((rootSemitone + 8) % 12);
        break;
    }
  }

  return [...new Set(tones)].sort((a, b) => a - b);
}

/**
 * Checks if a MIDI note is in the chord.
 */
export function isNoteInChord(midiNote: number, chord: ChordPayload): boolean {
  const pitchClass = midiNote % 12;
  const chordTones = getChordTones(chord);
  return chordTones.includes(pitchClass);
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Creates a ChordTrackAdapter.
 */
export function createChordTrack(options?: {
  streamId?: EventStreamId;
  keyRoot?: NoteName;
  keyMode?: 'major' | 'minor';
}): ChordTrackAdapter {
  return new ChordTrackAdapter(options);
}

/** @deprecated legacy export name */
export function createChordTrackAdapter(optionsOrStreamId?: { streamId?: EventStreamId; keyRoot?: NoteName; keyMode?: 'major' | 'minor' } | EventStreamId): ChordTrackAdapter {
  if (typeof optionsOrStreamId === 'string') {
    return new ChordTrackAdapter({ streamId: optionsOrStreamId });
  }
  return new ChordTrackAdapter(optionsOrStreamId);
}

/** @deprecated legacy export name */
export const parseChord = parseChordSymbol;

// ============================================================================
// SINGLETON
// ============================================================================

let _chordTrack: ChordTrackAdapter | null = null;

/**
 * Gets the global chord track singleton.
 */
export function getChordTrack(): ChordTrackAdapter {
  if (!_chordTrack) {
    _chordTrack = createChordTrack({ streamId: 'global-chord-track' as EventStreamId });
  }
  return _chordTrack;
}

/**
 * Resets the chord track singleton (for testing).
 */
export function resetChordTrack(): void {
  if (_chordTrack) {
    _chordTrack.dispose();
    _chordTrack = null;
  }
}
