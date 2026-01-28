/**
 * @fileoverview Notation Event Bridge.
 * 
 * Connects Event<Voice<P>> from the core type system to NotationEvent/NotationNote.
 * Enables real-time notation rendering of events modified by cards/decks.
 * 
 * Phase 11.2: Notation Event Display
 * 
 * @module @cardplay/core/notation/event-bridge
 */

import type { Event } from '../types/event';
import type { Voice, Pitch } from '../voices/voice';
import { pitchToMIDI, Articulation } from '../voices/voice';
import type { TickDuration } from '../types/primitives';
import { asTick, asTickDuration } from '../types/primitives';
import type {
  NotationEvent,
  NotationNote,
  NotationMeasure,
  NoteDuration,
  NoteDurationType,
  AccidentalType,
  ArticulationType,
  TimeSignature,
  KeySignature,
} from './types';
import { findClosestDuration, DURATION_VALUES } from './types';

// ============================================================================
// EVENT CONVERSION
// ============================================================================

/**
 * Options for converting Event<Voice<P>> to NotationEvent.
 */
export interface EventToNotationOptions {
  /** Tick resolution (ticks per quarter note) */
  readonly ticksPerQuarter?: number;
  /** Voice number to assign */
  readonly voice?: number;
  /** Staff index */
  readonly staff?: number;
  /** Force specific accidental style */
  readonly preferredAccidental?: AccidentalType;
  /** Key signature context for accidental inference */
  readonly keySignature?: KeySignature;
}

/**
 * Default options.
 */
const DEFAULT_OPTIONS: Required<EventToNotationOptions> = {
  ticksPerQuarter: 480,
  voice: 1,
  staff: 0,
  preferredAccidental: 'sharp',
  keySignature: { root: 'C', mode: 'major', accidentals: 0 },
};

/**
 * Converts Event<Voice<P>> to NotationEvent.
 * 
 * Handles:
 * - Pitch extraction and MIDI conversion
 * - Duration quantization to notation grid
 * - Articulation mapping
 * - Accidental inference from key signature
 */
export function eventToNotation<P extends Pitch>(
  event: Event<Voice<P>>,
  options: EventToNotationOptions = {}
): NotationEvent {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const voice = event.payload;
  const midiPitch = pitchToMIDI(voice.pitch);
  
  // Convert duration
  const noteDuration = tickDurationToNoteDuration(event.duration, opts.ticksPerQuarter);
  
  // Determine accidental
  const accidental = inferAccidental(
    Math.round(midiPitch),
    opts.keySignature,
    opts.preferredAccidental
  );
  
  // Map articulations
  const articulations = mapArticulations(voice.articulation);
  
  const notationNote: NotationNote = {
    id: event.id,
    pitch: Math.round(midiPitch),
    ...(accidental !== undefined && accidental !== 'natural' && { accidental }),
    cautionary: false,
  };
  
  const notationEvent: NotationEvent = {
    id: event.id,
    notes: [notationNote],
    duration: noteDuration,
    tick: event.start,
    voice: opts.voice,
    staff: opts.staff,
    isRest: false,
    ...(articulations.length > 0 && { articulations }),
  };
  
  return notationEvent;
}

/**
 * Converts an array of Event<Voice<P>> to NotationEvent[], handling chords.
 * 
 * Events at the same start tick with the same duration are combined into chords.
 */
export function eventsToNotation<P extends Pitch>(
  events: ReadonlyArray<Event<Voice<P>>>,
  options: EventToNotationOptions = {}
): NotationEvent[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Group events by start tick and duration
  const groups = new Map<string, Event<Voice<P>>[]>();
  
  for (const event of events) {
    const key = `${event.start}-${event.duration}`;
    const group = groups.get(key) ?? [];
    group.push(event);
    groups.set(key, group);
  }
  
  // Convert each group
  const notationEvents: NotationEvent[] = [];
  
  for (const group of groups.values()) {
    if (group.length === 0) continue; // Skip empty groups
    
    const firstEvent = group[0];
    if (!firstEvent) continue; // Shouldn't happen, but satisfy TypeScript
    
    if (group.length === 1) {
      // Single note
      notationEvents.push(eventToNotation(firstEvent, opts));
    } else {
      // Chord - combine multiple notes
      const notes: NotationNote[] = group.map(e => {
        const voice = e.payload;
        const midiPitch = pitchToMIDI(voice.pitch);
        const accidental = inferAccidental(
          Math.round(midiPitch),
          opts.keySignature,
          opts.preferredAccidental
        );
        
        const note: NotationNote = {
          id: e.id,
          pitch: Math.round(midiPitch),
          ...(accidental !== undefined && accidental !== 'natural' && { accidental }),
          cautionary: false,
        };
        return note;
      });
      
      // Sort notes by pitch (lowest to highest)
      notes.sort((a, b) => a.pitch - b.pitch);
      
      const noteDuration = tickDurationToNoteDuration(
        firstEvent.duration,
        opts.ticksPerQuarter
      );
      
      const articulations = mapArticulations(firstEvent.payload.articulation);
      
      const chordEvent: NotationEvent = {
        id: firstEvent.id,
        notes,
        duration: noteDuration,
        tick: firstEvent.start,
        voice: opts.voice,
        staff: opts.staff,
        isRest: false,
        ...(articulations.length > 0 && { articulations }),
      };
      
      notationEvents.push(chordEvent);
    }
  }
  
  // Sort by start tick
  notationEvents.sort((a, b) => a.tick - b.tick);
  
  return notationEvents;
}

// ============================================================================
// DURATION QUANTIZATION
// ============================================================================

/**
 * Converts tick duration to notation duration.
 * 
 * Quantizes to nearest notation-friendly duration (whole, half, quarter, etc.).
 */
export function tickDurationToNoteDuration(
  tickDuration: TickDuration,
  ticksPerQuarter: number
): NoteDuration {
  // Calculate quarter notes
  const quarterNotes = tickDuration / ticksPerQuarter;
  
  // Find closest duration
  const duration = findClosestDuration(quarterNotes);
  
  return duration;
}

/**
 * Quantizes an event's duration to the nearest notation grid value.
 */
export function quantizeEventToNotationGrid<P extends Pitch>(
  event: Event<Voice<P>>,
  ticksPerQuarter: number,
  gridSize: NoteDurationType = '16th'
): Event<Voice<P>> {
  const gridValue = DURATION_VALUES[gridSize];
  if (gridValue === undefined) {
    throw new Error(`Invalid grid size: ${gridSize}`);
  }
  
  const gridTicks = gridValue * ticksPerQuarter;
  
  // Round start to grid
  const quantizedStart = Math.round(event.start / gridTicks) * gridTicks;
  
  // Round duration to grid
  const quantizedDuration = Math.round(event.duration / gridTicks) * gridTicks;
  
  return {
    ...event,
    start: asTick(quantizedStart),
    duration: asTickDuration(quantizedDuration),
  };
}

// ============================================================================
// ACCIDENTAL INFERENCE
// ============================================================================

/**
 * Pitch class (0-11, C=0).
 */
type PitchClass = number;

/**
 * Gets pitch class from MIDI note.
 */
function getPitchClass(midiNote: number): PitchClass {
  return midiNote % 12;
}

/**
 * Pitch class names.
 */
const PITCH_CLASS_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Key signature pitch classes (naturals).
 */
function getKeySignaturePitchClasses(keySignature: KeySignature): Set<PitchClass> {
  const { root, mode } = keySignature;
  
  // Major scale pattern: W-W-H-W-W-W-H
  const majorPattern = [0, 2, 4, 5, 7, 9, 11];
  
  // Minor scale pattern: W-H-W-W-H-W-W
  const minorPattern = [0, 2, 3, 5, 7, 8, 10];
  
  const pattern = mode === 'major' ? majorPattern : minorPattern;
  
  // Root note to pitch class
  const rootPitchClass = PITCH_CLASS_NAMES.indexOf(root);
  if (rootPitchClass === -1) {
    return new Set(majorPattern); // Default to C major
  }
  
  // Transpose pattern
  const pitchClasses = pattern.map(p => (p + rootPitchClass) % 12);
  
  return new Set(pitchClasses);
}

/**
 * Infers the accidental to display for a MIDI note given the key signature.
 */
export function inferAccidental(
  midiNote: number,
  keySignature: KeySignature,
  preferredAccidental: AccidentalType = 'sharp'
): AccidentalType | undefined {
  const pitchClass = getPitchClass(midiNote);
  const keyPitchClasses = getKeySignaturePitchClasses(keySignature);
  
  // If pitch is in key, no accidental needed
  if (keyPitchClasses.has(pitchClass)) {
    return undefined;
  }
  
  // Check if it's a black key (needs accidental)
  const isBlackKey = [1, 3, 6, 8, 10].includes(pitchClass);
  
  if (!isBlackKey) {
    // White key outside of key signature - needs natural
    return 'natural';
  }
  
  // Black key - use sharp or flat based on key signature
  // Negative accidentals = flat keys, positive = sharp keys
  if (keySignature.accidentals < 0) {
    return 'flat';
  } else if (keySignature.accidentals > 0) {
    return 'sharp';
  } else {
    // C major / A minor - use preferred
    return preferredAccidental;
  }
}

// ============================================================================
// ARTICULATION MAPPING
// ============================================================================

/**
 * Maps Voice articulation to notation articulation symbols.
 */
function mapArticulations(articulation?: Articulation): ArticulationType[] {
  if (!articulation) {
    return [];
  }
  
  // Map core articulations
  const result: ArticulationType[] = [];
  
  switch (articulation) {
    case Articulation.Staccato:
      result.push('staccato');
      break;
    case Articulation.Legato:
      // Legato is shown with slurs, not symbols
      break;
    case Articulation.Marcato:
      result.push('marcato');
      break;
    case Articulation.Accent:
      result.push('accent');
      break;
    case Articulation.Tenuto:
      result.push('tenuto');
      break;
    case Articulation.Staccatissimo:
      result.push('staccatissimo');
      break;
    case Articulation.Sforzando:
      result.push('accent'); // Treat as accent
      break;
    case Articulation.Normal:
      // No articulation marking
      break;
    default:
      // Unknown articulation
      break;
  }
  
  return result;
}

// ============================================================================
// MEASURE GROUPING
// ============================================================================

/**
 * Groups notation events into measures.
 */
export function groupEventsIntoMeasures(
  notationEvents: NotationEvent[],
  timeSignature: TimeSignature,
  ticksPerQuarter: number,
  startMeasureNumber: number = 1
): NotationMeasure[] {
  const measures: NotationMeasure[] = [];
  
  // Calculate ticks per measure
  const ticksPerMeasure = (timeSignature.numerator / timeSignature.denominator) * 4 * ticksPerQuarter;
  
  // Group events by measure
  const measureMap = new Map<number, NotationEvent[]>();
  
  for (const event of notationEvents) {
    const measureNumber = Math.floor(event.tick / ticksPerMeasure) + startMeasureNumber;
    const events = measureMap.get(measureNumber) ?? [];
    events.push(event);
    measureMap.set(measureNumber, events);
  }
  
  // Create measures
  for (const [measureNumber, events] of measureMap.entries()) {
    // Group by voice
    const voiceMap = new Map<number, NotationEvent[]>();
    for (const event of events) {
      const voiceEvents = voiceMap.get(event.voice) ?? [];
      voiceEvents.push(event);
      voiceMap.set(event.voice, voiceEvents);
    }
    
    const measure: NotationMeasure = {
      number: measureNumber,
      events: voiceMap,
      ...(measureNumber === startMeasureNumber && { timeSignature }),
    };
    
    measures.push(measure);
  }
  
  // Sort by measure number
  measures.sort((a, b) => a.number - b.number);
  
  return measures;
}

// ============================================================================
// REAL-TIME UPDATE
// ============================================================================

/**
 * Event stream subscriber for real-time notation updates.
 */
export interface NotationUpdateSubscriber {
  /** Called when events are added */
  onEventsAdded(events: NotationEvent[]): void;
  /** Called when events are removed */
  onEventsRemoved(eventIds: string[]): void;
  /** Called when events are modified */
  onEventsModified(events: NotationEvent[]): void;
}

/**
 * Manages real-time conversion of Event<Voice<P>> streams to notation.
 */
export class NotationEventBridge<P extends Pitch> {
  private subscribers = new Set<NotationUpdateSubscriber>();
  private eventCache = new Map<string, NotationEvent>();
  private options: Required<EventToNotationOptions>;
  
  constructor(options: EventToNotationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * Subscribes to notation updates.
   */
  subscribe(subscriber: NotationUpdateSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }
  
  /**
   * Processes new or updated events from external cards/decks.
   */
  processEvents(events: ReadonlyArray<Event<Voice<P>>>): void {
    const addedEvents: NotationEvent[] = [];
    const modifiedEvents: NotationEvent[] = [];
    
    for (const event of events) {
      const notationEvent = eventToNotation(event, this.options);
      
      if (this.eventCache.has(event.id)) {
        // Event was modified
        modifiedEvents.push(notationEvent);
      } else {
        // Event is new
        addedEvents.push(notationEvent);
      }
      
      this.eventCache.set(event.id, notationEvent);
    }
    
    // Notify subscribers
    if (addedEvents.length > 0) {
      for (const subscriber of this.subscribers) {
        subscriber.onEventsAdded(addedEvents);
      }
    }
    
    if (modifiedEvents.length > 0) {
      for (const subscriber of this.subscribers) {
        subscriber.onEventsModified(modifiedEvents);
      }
    }
  }
  
  /**
   * Removes events.
   */
  removeEvents(eventIds: string[]): void {
    for (const id of eventIds) {
      this.eventCache.delete(id);
    }
    
    // Notify subscribers
    for (const subscriber of this.subscribers) {
      subscriber.onEventsRemoved(eventIds);
    }
  }
  
  /**
   * Clears all cached events.
   */
  clear(): void {
    const allIds = Array.from(this.eventCache.keys());
    this.eventCache.clear();
    
    if (allIds.length > 0) {
      for (const subscriber of this.subscribers) {
        subscriber.onEventsRemoved(allIds);
      }
    }
  }
  
  /**
   * Updates options (e.g., key signature change).
   */
  updateOptions(options: Partial<EventToNotationOptions>): void {
    this.options = { ...this.options, ...options };
    
    // Re-process all cached events with new options would require
    // storing original Event<Voice<P>> instances. For simplicity,
    // we clear the cache and rely on external re-send.
    // In a full implementation, would track original events here.
  }
}
