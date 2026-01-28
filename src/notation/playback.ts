/**
 * @fileoverview Notation Playback Integration.
 * 
 * Connects notation display to audio playback, enabling:
 * - Click-to-play notes
 * - Playback from selection
 * - Playhead visualization
 * - Expression/dynamics rendering
 * - Repeat structure handling
 * - Ornament realization
 * 
 * Phase 11.5: Notation Playback Integration
 * 
 * @module @cardplay/core/notation/playback
 */

import type { Event } from '../types/event';
import type { Voice } from '../voices/voice';
import type { Tick, TickDuration } from '../types/primitives';
import { asTick, asTickDuration } from '../types/primitives';
import { EventKinds } from '../types/event-kind';
import type {
  NotationNote,
  NotationMeasure,
  NoteDuration,
  NotationEvent,
  KeySignature,
  VoiceConfig,
  ArticulationType,
  TimeSignature,
} from './types';
import { DURATION_VALUES } from './types';
import type { DynamicLevel, OrnamentType } from './ornaments-dynamics';
import { createMIDIPitch, type MIDIPitch } from '../voices/voice';
import { createEvent } from '../types/event';

// ============================================================================
// PLAYBACK CONTEXT
// ============================================================================

/**
 * Current playback state for notation rendering.
 */
export interface NotationPlaybackContext {
  /** Current playhead position in ticks */
  readonly playheadTick: Tick;
  /** Whether playback is active */
  readonly isPlaying: boolean;
  /** Current tempo (BPM) */
  readonly tempo: number;
  /** Ticks per quarter note */
  readonly ticksPerQuarter: number;
  /** Selected region (if any) for playback-from-selection */
  readonly selection?: {
    readonly startTick: Tick;
    readonly endTick: Tick;
  };
  /** Active playing notes (for highlighting) */
  readonly activeNotes: Set<string>; // note IDs
}

/**
 * Creates a default playback context.
 */
export function createPlaybackContext(
  tempo: number = 120,
  ticksPerQuarter: number = 480
): NotationPlaybackContext {
  return {
    playheadTick: asTick(0),
    isPlaying: false,
    tempo,
    ticksPerQuarter,
    activeNotes: new Set(),
  };
}

// ============================================================================
// CLICK-TO-PLAY NOTE
// ============================================================================

/**
 * Converts a notation note to a playable event.
 * Used for click-to-play functionality.
 * 
 * Task 2669: Implement click-to-play note
 */
export function notationNoteToEvent(
  note: NotationNote,
  duration: NoteDuration,
  velocity: number = 80,
  ticksPerQuarter: number = 480
): Event<Voice<MIDIPitch>> {
  const pitch = createMIDIPitch(note.pitch);
  const voice: Voice<MIDIPitch> = { pitch, velocity };
  
  // Convert duration to ticks
  const durationTicks = noteDurationToTicks(duration, ticksPerQuarter);
  
  return createEvent({
    start: asTick(0), // Will be set to current time in playback context
    duration: asTickDuration(durationTicks),
    payload: voice,
    kind: EventKinds.NOTE,
  });
}

/**
 * Converts NoteDuration to tick duration.
 */
function noteDurationToTicks(duration: NoteDuration, ticksPerQuarter: number): number {
  const baseValue = DURATION_VALUES[duration.base];
  // DURATION_VALUES are in quarter note units
  const ticks = baseValue * ticksPerQuarter;
  
  // Apply dots
  let multiplier = 1;
  if (duration.dots === 1) multiplier = 1.5;
  else if (duration.dots === 2) multiplier = 1.75;
  else if (duration.dots === 3) multiplier = 1.875;
  
  return Math.round(ticks * multiplier);
}

/**
 * Plays a single notation note immediately.
 * Returns the generated event for audio engine consumption.
 */
export function playNotationNote(
  note: NotationNote,
  duration: NoteDuration,
  context: NotationPlaybackContext,
  velocity: number = 80
): Event<Voice<MIDIPitch>> {
  const event = notationNoteToEvent(note, duration, velocity, context.ticksPerQuarter);
  
  // Update event start to current playhead
  return {
    ...event,
    start: context.playheadTick,
  };
}

// ============================================================================
// MEASURE TIMING
// ============================================================================

/**
 * Gets the duration of a time signature in ticks.
 */
function getTimeSignatureDuration(
  timeSignature: TimeSignature | undefined,
  ticksPerQuarter: number
): number {
  if (!timeSignature) {
    // Default to 4/4
    return ticksPerQuarter * 4;
  }
  // Time signature numerator / denominator
  // denominator: 4 = quarter note, 2 = half note, 8 = eighth note
  const beatsPerMeasure = timeSignature.numerator;
  const beatUnit = timeSignature.denominator;
  // Ticks per beat depends on beat unit
  const ticksPerBeat = (ticksPerQuarter * 4) / beatUnit;
  return beatsPerMeasure * ticksPerBeat;
}

/**
 * Calculates cumulative start ticks for each measure.
 */
export function calculateMeasureStartTicks(
  measures: readonly NotationMeasure[],
  ticksPerQuarter: number,
  defaultTimeSignature?: TimeSignature
): number[] {
  const startTicks: number[] = [];
  let currentTick = 0;
  let currentTimeSig = defaultTimeSignature;
  
  for (const measure of measures) {
    startTicks.push(currentTick);
    // Check for time signature change
    if (measure.timeSignature) {
      currentTimeSig = measure.timeSignature;
    }
    currentTick += getTimeSignatureDuration(currentTimeSig, ticksPerQuarter);
  }
  
  return startTicks;
}

/**
 * Finds which measure contains a given tick.
 */
export function findMeasureAtTick(
  measureStartTicks: number[],
  tick: number
): { measureIndex: number; tickWithinMeasure: number } | null {
  if (measureStartTicks.length === 0) return null;
  
  for (let i = measureStartTicks.length - 1; i >= 0; i--) {
    if (tick >= measureStartTicks[i]!) {
      return {
        measureIndex: i,
        tickWithinMeasure: tick - measureStartTicks[i]!,
      };
    }
  }
  
  return { measureIndex: 0, tickWithinMeasure: tick };
}

// ============================================================================
// PLAYBACK FROM SELECTION
// ============================================================================

/**
 * Extracts all notation events within a tick range.
 * Used for playback-from-selection.
 * 
 * Task 2670: Create playback from selection
 */
export function extractEventsFromSelection(
  measures: readonly NotationMeasure[],
  startTick: Tick,
  endTick: Tick,
  ticksPerQuarter: number,
  defaultTimeSignature?: TimeSignature
): Array<Event<Voice<MIDIPitch>>> {
  const events: Array<Event<Voice<MIDIPitch>>> = [];
  const measureStartTicks = calculateMeasureStartTicks(measures, ticksPerQuarter, defaultTimeSignature);
  
  for (let i = 0; i < measures.length; i++) {
    const measure = measures[i]!;
    const measureStart = measureStartTicks[i]!;
    const measureEnd = i < measureStartTicks.length - 1 
      ? measureStartTicks[i + 1]! 
      : measureStart + getTimeSignatureDuration(measure.timeSignature, ticksPerQuarter);
    
    // Skip measures outside the selection range
    if (measureEnd <= startTick || measureStart >= endTick) continue;
    
    // Extract events from all voices in this measure
    // Handle both Map format and legacy array format from test fixtures
    let allVoiceEvents: NotationEvent[] = [];
    if (measure.events instanceof Map) {
      for (const [_voice, voiceEvents] of measure.events) {
        allVoiceEvents.push(...voiceEvents);
      }
    } else if (Array.isArray(measure.events)) {
      allVoiceEvents = measure.events as any;
    }
    
    for (const notationEvent of allVoiceEvents) {
      // Calculate absolute tick position - handle both 'tick' and 'beat' properties
      const eventTick = 'tick' in notationEvent 
        ? notationEvent.tick 
        : ((notationEvent as any).beat ?? 0) * ticksPerQuarter;
      const absoluteTick = measureStart + eventTick;
      
      // Skip events outside selection range
      if (absoluteTick < startTick || absoluteTick >= endTick) continue;
      
      // Convert each note in the event to a playable event
      for (const note of notationEvent.notes) {
        const event = notationNoteToEvent(
          note,
          notationEvent.duration,
          80, // default velocity
          ticksPerQuarter
        );
        
        // Set the correct absolute start time
        events.push({
          ...event,
          start: asTick(absoluteTick),
        });
      }
    }
  }
  
  // Sort by start time
  return events.sort((a, b) => a.start - b.start);
}

/**
 * Creates a playback context for selected region.
 */
export function createSelectionPlaybackContext(
  _measures: readonly NotationMeasure[],
  startTick: Tick,
  endTick: Tick,
  context: NotationPlaybackContext
): NotationPlaybackContext {
  return {
    ...context,
    selection: { startTick, endTick },
    playheadTick: startTick,
  };
}

// ============================================================================
// PLAYHEAD VISUALIZATION
// ============================================================================

/**
 * Position of playhead within a measure.
 * 
 * Task 2673: Add playhead in notation view
 */
export interface PlayheadPosition {
  /** Measure index */
  readonly measureIndex: number;
  /** Beat within measure (fractional) */
  readonly beat: number;
  /** X position in staff space units */
  readonly xPosition: number;
  /** Tick within measure */
  readonly tickWithinMeasure: number;
}

/**
 * Calculates playhead position from tick.
 */
export function calculatePlayheadPosition(
  measures: readonly NotationMeasure[],
  playheadTick: Tick,
  ticksPerQuarter: number,
  defaultTimeSignature?: TimeSignature
): PlayheadPosition | null {
  if (measures.length === 0) return null;
  
  const measureStartTicks = calculateMeasureStartTicks(measures, ticksPerQuarter, defaultTimeSignature);
  const location = findMeasureAtTick(measureStartTicks, playheadTick);
  
  if (!location) return null;
  
  const measure = measures[location.measureIndex]!;
  const timeSig = measure.timeSignature || defaultTimeSignature || { numerator: 4, denominator: 4 };
  
  // Check if playhead is beyond the last measure
  const measureDuration = getTimeSignatureDuration(timeSig, ticksPerQuarter);
  const lastMeasureStart = measureStartTicks[measureStartTicks.length - 1]!;
  const lastMeasureEnd = lastMeasureStart + measureDuration;
  
  if (playheadTick >= lastMeasureEnd) {
    return null; // Playhead is beyond all measures
  }
  
  // Calculate beat position
  const ticksPerBeat = (ticksPerQuarter * 4) / timeSig.denominator;
  const beat = location.tickWithinMeasure / ticksPerBeat;
  
  // Calculate x position (normalized 0-1 within measure)
  const xPosition = location.tickWithinMeasure / measureDuration;
  
  return {
    measureIndex: location.measureIndex,
    beat,
    xPosition,
    tickWithinMeasure: location.tickWithinMeasure,
  };
}

/**
 * Determines if playhead should scroll to stay visible.
 * 
 * Task 2674: Implement scroll to playhead
 */
export function shouldScrollToPlayhead(
  playheadPosition: PlayheadPosition | null,
  visibleMeasureRange: { start: number; end: number }
): boolean {
  if (!playheadPosition) return false;
  
  // Don't scroll if playhead is within visible range (with some buffer)
  const bufferMeasures = 1;
  const isInVisibleRange = (
    playheadPosition.measureIndex >= visibleMeasureRange.start + bufferMeasures &&
    playheadPosition.measureIndex <= visibleMeasureRange.end - bufferMeasures
  );
  
  return !isInVisibleRange;
}

/**
 * Calculates new scroll position to center playhead.
 */
export function calculateScrollToPlayhead(
  playheadPosition: PlayheadPosition | null,
  visibleMeasureCount: number
): number {
  if (!playheadPosition) return 0;
  
  // Center playhead in visible area
  const targetScroll = playheadPosition.measureIndex - Math.floor(visibleMeasureCount / 2);
  return Math.max(0, targetScroll);
}

// ============================================================================
// PLAYING NOTES HIGHLIGHTING
// ============================================================================

/**
 * Updates active notes set based on current playhead position.
 * 
 * Task 2675: Create highlight playing notes
 */
export function updateActiveNotes(
  measures: readonly NotationMeasure[],
  playheadTick: Tick,
  ticksPerQuarter: number,
  defaultTimeSignature?: TimeSignature
): Set<string> {
  const activeNotes = new Set<string>();
  
  if (measures.length === 0) return activeNotes;
  
  const measureStartTicks = calculateMeasureStartTicks(measures, ticksPerQuarter, defaultTimeSignature);
  
  // Find notes that are currently sounding at playheadTick
  for (let i = 0; i < measures.length; i++) {
    const measure = measures[i]!;
    const measureStart = measureStartTicks[i]!;
    
    // Skip measures that haven't started yet
    if (measureStart > playheadTick) break;
    
    // Get all events from the measure
    // Handle both Map<number, NotationEvent[]> and array formats for flexibility
    let allEvents: Array<NotationEvent & { beat?: number }> = [];
    
    if (measure.events instanceof Map) {
      for (const [_voice, voiceEvents] of measure.events) {
        allEvents.push(...voiceEvents);
      }
    } else if (Array.isArray(measure.events)) {
      // Legacy array format (used in some tests)
      allEvents = measure.events as any;
    }
    
    for (const event of allEvents) {
      // Calculate event start tick - use 'tick' property if available, otherwise calculate from 'beat'
      let eventTick: number;
      if ('tick' in event && typeof event.tick === 'number') {
        eventTick = event.tick;
      } else if ('beat' in event && typeof event.beat === 'number') {
        // Convert beat to tick
        eventTick = event.beat * ticksPerQuarter;
      } else {
        continue; // Skip events without timing info
      }
      
      const eventStart = measureStart + eventTick;
      
      // Calculate event end time based on duration
      const durationTicks = noteDurationToTicks(event.duration, ticksPerQuarter);
      const eventEnd = eventStart + durationTicks;
      
      // Check if this event is currently sounding
      if (playheadTick >= eventStart && playheadTick < eventEnd) {
        // Add all note IDs from this event
        for (const note of event.notes) {
          activeNotes.add(note.id);
        }
      }
    }
  }
  
  return activeNotes;
}

/**
 * Checks if a specific note is currently playing.
 */
export function isNotePlaying(
  noteId: string,
  context: NotationPlaybackContext
): boolean {
  return context.activeNotes.has(noteId);
}

// ============================================================================
// EXPRESSION PLAYBACK (DYNAMICS, TEMPO)
// ============================================================================

/**
 * Dynamic level to MIDI velocity mapping.
 * 
 * Task 2676: Add expression playback (dynamics, tempo)
 */
const DYNAMIC_VELOCITY_MAP: Record<DynamicLevel, number> = {
  'pppp': 10,
  'ppp': 20,
  'pp': 35,
  'p': 50,
  'mp': 65,
  'mf': 80,
  'f': 95,
  'ff': 110,
  'fff': 120,
  'ffff': 127,
  'fp': 100, // Forte-piano: start loud
  'sf': 105,
  'sfz': 110,
  'sffz': 127,
  'rf': 115,
  'rfz': 120,
};

/**
 * Applies dynamic marking to note velocity.
 */
export function applyDynamic(
  baseVelocity: number,
  dynamic: DynamicLevel | undefined
): number {
  if (!dynamic) return baseVelocity;
  
  const targetVelocity = DYNAMIC_VELOCITY_MAP[dynamic];
  if (targetVelocity === undefined) return baseVelocity;
  
  return Math.max(1, Math.min(127, targetVelocity));
}

/**
 * Tempo marking to BPM conversion.
 */
const TEMPO_MARKINGS: Record<string, number> = {
  'grave': 40,
  'largo': 50,
  'lento': 55,
  'adagio': 70,
  'andante': 90,
  'moderato': 108,
  'allegretto': 112,
  'allegro': 132,
  'vivace': 160,
  'presto': 180,
  'prestissimo': 200,
};

/**
 * Interprets tempo marking to BPM.
 */
export function interpretTempoMarking(
  marking: string
): number {
  const lowerMarking = marking.toLowerCase();
  return TEMPO_MARKINGS[lowerMarking] ?? 120; // Default to 120 BPM
}

// ============================================================================
// REPEAT STRUCTURE PLAYBACK
// ============================================================================

/**
 * Repeat structure for playback navigation.
 * 
 * Task 2677: Implement repeat structure playback
 */
export interface RepeatStructure {
  /** Start measure index */
  readonly startMeasure: number;
  /** End measure index (inclusive) */
  readonly endMeasure: number;
  /** Number of times to repeat */
  readonly repeatCount: number;
  /** Endings (1st ending, 2nd ending, etc.) */
  readonly endings?: ReadonlyArray<{
    readonly measures: readonly number[]; // Measure indices
    readonly endingNumber: number; // 1, 2, 3...
  }>;
}

/**
 * State for repeat playback traversal.
 */
export interface RepeatPlaybackState {
  /** Current measure index */
  readonly currentMeasure: number;
  /** Repeat stack (for nested repeats) */
  readonly repeatStack: ReadonlyArray<{
    readonly structure: RepeatStructure;
    readonly iterationCount: number;
  }>;
}

/**
 * Creates initial repeat playback state.
 */
export function createRepeatPlaybackState(): RepeatPlaybackState {
  return {
    currentMeasure: 0,
    repeatStack: [],
  };
}

/**
 * Advances playback considering repeat structures.
 * Returns next measure index to play.
 */
export function advanceWithRepeats(
  state: RepeatPlaybackState,
  repeats: readonly RepeatStructure[]
): RepeatPlaybackState {
  const nextMeasure = state.currentMeasure + 1;
  
  // Check if we hit a repeat end
  for (const repeat of repeats) {
    if (nextMeasure === repeat.endMeasure + 1) {
      // Check if we should repeat
      const activeRepeat = state.repeatStack.find(r => r.structure === repeat);
      const iterationCount = activeRepeat?.iterationCount ?? 0;
      
      if (iterationCount < repeat.repeatCount - 1) {
        // Jump back to repeat start
        return {
          currentMeasure: repeat.startMeasure,
          repeatStack: state.repeatStack.map(r =>
            r.structure === repeat
              ? { ...r, iterationCount: iterationCount + 1 }
              : r
          ),
        };
      } else {
        // Finished repeating, remove from stack
        return {
          currentMeasure: nextMeasure,
          repeatStack: state.repeatStack.filter(r => r.structure !== repeat),
        };
      }
    }
    
    // Check if entering new repeat
    if (nextMeasure === repeat.startMeasure) {
      return {
        currentMeasure: nextMeasure,
        repeatStack: [
          ...state.repeatStack,
          { structure: repeat, iterationCount: 0 },
        ],
      };
    }
  }
  
  // No repeat logic, just advance
  return {
    currentMeasure: nextMeasure,
    repeatStack: state.repeatStack,
  };
}

// ============================================================================
// GRACE NOTE TIMING
// ============================================================================

/**
 * Grace note timing configuration.
 * 
 * Task 2678: Create grace note timing
 */
export interface GraceNoteTiming {
  /** Duration before the main note (in ticks) */
  readonly duration: TickDuration;
  /** Whether grace note steals time from previous note (false = on-beat) */
  readonly stealsTime: boolean;
}

/**
 * Default grace note timing.
 */
export const DEFAULT_GRACE_NOTE_TIMING: GraceNoteTiming = {
  duration: asTickDuration(40), // Very short, ~1/32 note at 480 TPQ
  stealsTime: true,
};

/**
 * Calculates start time for grace note(s) before main note.
 */
export function calculateGraceNoteTiming(
  mainNoteStart: Tick,
  graceNoteCount: number,
  timing: GraceNoteTiming = DEFAULT_GRACE_NOTE_TIMING
): Tick[] {
  const startTimes: Tick[] = [];
  const totalDuration = timing.duration * graceNoteCount;
  
  if (timing.stealsTime) {
    // Grace notes come before main note, stealing time from previous beat
    let currentStart = mainNoteStart - totalDuration;
    for (let i = 0; i < graceNoteCount; i++) {
      startTimes.push(asTick(currentStart));
      currentStart += timing.duration;
    }
  } else {
    // Grace notes compress into the beat, main note on-time
    // Distribute grace notes proportionally before main note
    let currentStart = mainNoteStart - totalDuration;
    for (let i = 0; i < graceNoteCount; i++) {
      startTimes.push(asTick(currentStart));
      currentStart += timing.duration;
    }
  }
  
  return startTimes;
}

// ============================================================================
// ORNAMENT REALIZATION
// ============================================================================

/**
 * Ornament realization configuration.
 * 
 * Task 2679: Add ornament realization
 */
export interface OrnamentRealization {
  /** Array of pitch offsets from main note (in semitones) */
  readonly pitchOffsets: readonly number[];
  /** Duration of each ornament note (relative to main note duration) */
  readonly noteDurations: readonly number[]; // 0.0 - 1.0
  /** Whether ornament replaces main note or prepends to it */
  readonly replacesMainNote: boolean;
}

/**
 * Standard ornament realizations.
 */
export const ORNAMENT_REALIZATIONS: Record<OrnamentType, OrnamentRealization> = {
  'trill': {
    pitchOffsets: [0, 1, 0, 1, 0, 1, 0, 1],
    noteDurations: [0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125],
    replacesMainNote: true,
  },
  'mordent': {
    pitchOffsets: [0, 1, 0],
    noteDurations: [0.25, 0.25, 0.5],
    replacesMainNote: true,
  },
  'inverted-mordent': {
    pitchOffsets: [0, -1, 0],
    noteDurations: [0.25, 0.25, 0.5],
    replacesMainNote: true,
  },
  'turn': {
    pitchOffsets: [1, 0, -1, 0],
    noteDurations: [0.25, 0.25, 0.25, 0.25],
    replacesMainNote: true,
  },
  'inverted-turn': {
    pitchOffsets: [-1, 0, 1, 0],
    noteDurations: [0.25, 0.25, 0.25, 0.25],
    replacesMainNote: true,
  },
  'appoggiatura': {
    pitchOffsets: [1, 0], // Upper neighbor then main note
    noteDurations: [0.5, 0.5],
    replacesMainNote: true,
  },
  'acciaccatura': {
    pitchOffsets: [1], // Crushed note before main
    noteDurations: [0.05], // Very short
    replacesMainNote: false,
  },
  'gruppetto': {
    pitchOffsets: [0, 1, 0, -1, 0],
    noteDurations: [0.6, 0.1, 0.1, 0.1, 0.1],
    replacesMainNote: true,
  },
  'tremolo-1': {
    pitchOffsets: [0, 0, 0, 0],
    noteDurations: [0.25, 0.25, 0.25, 0.25],
    replacesMainNote: true,
  },
  'tremolo-2': {
    pitchOffsets: [0, 0, 0, 0, 0, 0, 0, 0],
    noteDurations: [0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125],
    replacesMainNote: true,
  },
  'tremolo-3': {
    pitchOffsets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    noteDurations: [0.0625, 0.0625, 0.0625, 0.0625, 0.0625, 0.0625, 0.0625, 0.0625, 0.0625, 0.0625, 0.0625, 0.0625, 0.0625, 0.0625, 0.0625, 0.0625],
    replacesMainNote: true,
  },
  'trill-flat': {
    pitchOffsets: [0, 1, 0, 1, 0, 1, 0, 1],
    noteDurations: [0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125],
    replacesMainNote: true,
  },
  'trill-sharp': {
    pitchOffsets: [0, 1, 0, 1, 0, 1, 0, 1],
    noteDurations: [0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125],
    replacesMainNote: true,
  },
  'trill-natural': {
    pitchOffsets: [0, 1, 0, 1, 0, 1, 0, 1],
    noteDurations: [0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125],
    replacesMainNote: true,
  },
};

/**
 * Realizes an ornament into a sequence of notes.
 */
export function realizeOrnament(
  mainNote: NotationNote,
  ornament: OrnamentType,
  mainNoteStart: Tick,
  mainNoteDuration: TickDuration,
  velocity: number,
  _ticksPerQuarter: number
): Array<Event<Voice<MIDIPitch>>> {
  const realization = ORNAMENT_REALIZATIONS[ornament];
  if (!realization) {
    // Unknown ornament, just play main note
    const pitch = createMIDIPitch(mainNote.pitch);
    const voice: Voice<MIDIPitch> = { pitch, velocity };
    return [createEvent({
      start: mainNoteStart,
      duration: mainNoteDuration,
      payload: voice,
      kind: EventKinds.NOTE,
    })];
  }
  
  const events: Array<Event<Voice<MIDIPitch>>> = [];
  let currentStart = mainNoteStart;
  
  for (let i = 0; i < realization.pitchOffsets.length; i++) {
    const pitchOffset = realization.pitchOffsets[i] ?? 0;
    const durationRatio = realization.noteDurations[i] ?? 0.25;
    const ornamentPitch = mainNote.pitch + pitchOffset;
    const ornamentDuration = asTickDuration(Math.round(mainNoteDuration * durationRatio));
    
    const pitch = createMIDIPitch(ornamentPitch);
    const voice: Voice<MIDIPitch> = { pitch, velocity: velocity * 0.9 }; // Slightly softer
    
    events.push(createEvent({
      start: currentStart,
      duration: ornamentDuration,
      payload: voice,
      kind: EventKinds.NOTE,
    }));
    
    currentStart = asTick(currentStart + ornamentDuration);
  }
  
  // If ornament doesn't replace main note, add main note at the end
  if (!realization.replacesMainNote) {
    const remainingDuration = asTickDuration(mainNoteDuration - (currentStart - mainNoteStart));
    if (remainingDuration > 0) {
      const pitch = createMIDIPitch(mainNote.pitch);
      const voice: Voice<MIDIPitch> = { pitch, velocity };
      events.push(createEvent({
        start: currentStart,
        duration: remainingDuration,
        payload: voice,
        kind: EventKinds.NOTE,
      }));
    }
  }
  
  return events;
}

// ============================================================================
// SWING INTERPRETATION
// ============================================================================

/**
 * Swing configuration for playback.
 * 
 * Task 2680: Implement swing interpretation
 */
export interface SwingConfig {
  /** Swing ratio: 0.5 = straight, 0.67 = triplet swing, 0.75 = heavy swing */
  readonly ratio: number;
  /** Subdivision to apply swing (8 = eighth notes, 16 = sixteenth notes) */
  readonly subdivision: 8 | 16;
}

/**
 * Default swing configurations.
 */
export const SWING_PRESETS = {
  straight: { ratio: 0.5, subdivision: 8 as const },
  light: { ratio: 0.55, subdivision: 8 as const },
  medium: { ratio: 0.60, subdivision: 8 as const },
  triplet: { ratio: 0.67, subdivision: 8 as const },
  heavy: { ratio: 0.75, subdivision: 8 as const },
};

/**
 * Applies swing timing to note start time.
 */
export function applySwing(
  noteStart: Tick,
  beatStart: Tick,
  subdivision: 8 | 16,
  ratio: number,
  ticksPerQuarter: number
): Tick {
  const subdivisionTicks = subdivision === 8
    ? ticksPerQuarter / 2  // Eighth note
    : ticksPerQuarter / 4; // Sixteenth note
  
  const ticksIntoBeat = noteStart - beatStart;
  const subdivisionIndex = Math.floor(ticksIntoBeat / subdivisionTicks);
  
  // Only swing offbeat subdivisions (odd indices)
  if (subdivisionIndex % 2 === 1) {
    const pairStart = beatStart + (subdivisionIndex - 1) * subdivisionTicks;
    // const straightOffbeatStart = pairStart + subdivisionTicks; // Unused
    
    // Calculate swung position
    const pairDuration = subdivisionTicks * 2;
    const onbeatDuration = pairDuration * ratio;
    const swungStart = pairStart + onbeatDuration;
    
    return asTick(swungStart);
  }
  
  return noteStart;
}

// ============================================================================
// RUBATO OPTION
// ============================================================================

/**
 * Rubato configuration for expressive timing.
 * 
 * Task 2681: Create rubato option
 */
export interface RubatoConfig {
  /** Amount of timing variation (0.0 = none, 1.0 = maximum) */
  readonly amount: number;
  /** Style of rubato */
  readonly style: 'subtle' | 'moderate' | 'expressive' | 'dramatic';
  /** Whether to preserve overall tempo (true) or allow drift (false) */
  readonly tempoLocked: boolean;
}

/**
 * Default rubato presets.
 */
export const RUBATO_PRESETS: Record<string, RubatoConfig> = {
  none: { amount: 0.0, style: 'subtle', tempoLocked: true },
  subtle: { amount: 0.15, style: 'subtle', tempoLocked: true },
  moderate: { amount: 0.30, style: 'moderate', tempoLocked: true },
  expressive: { amount: 0.50, style: 'expressive', tempoLocked: false },
  dramatic: { amount: 0.75, style: 'dramatic', tempoLocked: false },
};

/**
 * Applies rubato timing variation to a note.
 * Uses phrase-aware acceleration and deceleration.
 */
export function applyRubato(
  noteStart: Tick,
  noteDuration: TickDuration,
  phrasePosition: number, // 0.0 = start, 1.0 = end
  config: RubatoConfig,
  _ticksPerQuarter: number // Prefix with underscore to indicate intentionally unused
): { start: Tick; duration: TickDuration } {
  if (config.amount === 0) {
    return { start: noteStart, duration: noteDuration };
  }
  
  // Calculate timing curve based on phrase position
  // Typically: slow down approaching cadence, speed up in middle
  const phraseCurve = Math.sin(phrasePosition * Math.PI); // 0 -> 1 -> 0
  
  // Apply style-specific timing variation
  let timingMultiplier = 1.0;
  switch (config.style) {
    case 'subtle':
      timingMultiplier = 1.0 + (phraseCurve * config.amount * 0.1);
      break;
    case 'moderate':
      timingMultiplier = 1.0 + (phraseCurve * config.amount * 0.2);
      break;
    case 'expressive':
      timingMultiplier = 1.0 + (phraseCurve * config.amount * 0.4);
      break;
    case 'dramatic':
      timingMultiplier = 1.0 + (phraseCurve * config.amount * 0.6);
      break;
  }
  
  // Apply timing to duration
  const newDuration = asTickDuration(Math.round(noteDuration * timingMultiplier));
  
  // If tempo-locked, adjust subsequent start times to compensate
  // (This would be handled at the phrase level, here we just modify duration)
  
  return { start: noteStart, duration: newDuration };
}

// ============================================================================
// FERMATA HANDLING
// ============================================================================

/**
 * Fermata configuration.
 * 
 * Task 2682: Add fermata handling
 */
export interface FermataConfig {
  /** Duration multiplier for fermata (2.0 = double length) */
  readonly lengthMultiplier: number;
  /** Style of fermata */
  readonly style: 'short' | 'medium' | 'long' | 'very-long';
  /** Whether to add pause after fermata */
  readonly addPause: boolean;
  /** Pause duration in ticks (if addPause is true) */
  readonly pauseDuration?: TickDuration;
}

/**
 * Default fermata presets.
 */
export const FERMATA_PRESETS: Record<string, FermataConfig> = {
  short: { lengthMultiplier: 1.5, style: 'short', addPause: false },
  medium: { lengthMultiplier: 2.0, style: 'medium', addPause: false },
  long: { lengthMultiplier: 2.5, style: 'long', addPause: true, pauseDuration: asTickDuration(240) },
  'very-long': { lengthMultiplier: 3.0, style: 'very-long', addPause: true, pauseDuration: asTickDuration(480) },
};

/**
 * Applies fermata to a note or rest.
 * Returns modified duration and any additional pause.
 */
export function applyFermata(
  noteDuration: TickDuration,
  config: FermataConfig
): { duration: TickDuration; pauseAfter?: TickDuration } {
  const extendedDuration = asTickDuration(Math.round(noteDuration * config.lengthMultiplier));
  
  return {
    duration: extendedDuration,
    ...(config.addPause && config.pauseDuration ? { pauseAfter: config.pauseDuration } : {}),
  };
}

/**
 * Checks if a note has fermata articulation.
 */
export function hasFermata(articulations?: ArticulationType[]): boolean {
  return articulations?.includes('fermata') ?? false;
}

// ============================================================================
// CUE NOTES (NON-PLAYING)
// ============================================================================

/**
 * Cue note configuration.
 * 
 * Task 2683: Implement cue notes (non-playing)
 */
export interface CueNoteConfig {
  /** Whether cue notes should be played back */
  readonly playback: boolean;
  /** Velocity reduction for cue notes (if played) */
  readonly velocityReduction: number; // 0.0-1.0
  /** Visual styling marker */
  readonly isVisualOnly: boolean;
}

/**
 * Default cue note configuration.
 */
export const DEFAULT_CUE_NOTE_CONFIG: CueNoteConfig = {
  playback: false, // By default, cue notes don't play
  velocityReduction: 0.5, // If played, at 50% velocity
  isVisualOnly: true,
};

/**
 * Determines if a notation event is a cue note.
 * Cue notes are typically marked by size or special voice designation.
 */
export function isCueNote(_event: NotationEvent, voiceConfig?: VoiceConfig): boolean {
  // Check if voice is designated as cue voice
  if (voiceConfig?.label?.toLowerCase().includes('cue')) {
    return true;
  }
  
  // Could also check for other markers (size, color, etc.)
  // This is a placeholder for notation-specific cue indicators
  return false;
}

/**
 * Processes a cue note according to configuration.
 * Returns null if cue note should not be played.
 */
export function processCueNote(
  event: Event<Voice<MIDIPitch>>,
  config: CueNoteConfig = DEFAULT_CUE_NOTE_CONFIG
): Event<Voice<MIDIPitch>> | null {
  if (!config.playback || config.isVisualOnly) {
    return null; // Don't play cue notes
  }
  
  // Play with reduced velocity
  return {
    ...event,
    payload: {
      ...event.payload,
      velocity: Math.round(event.payload.velocity * config.velocityReduction),
    },
  };
}

// ============================================================================
// OSSIA STAVES
// ============================================================================

/**
 * Ossia staff definition (alternative passage).
 * 
 * Task 2684: Create ossia staves
 */
export interface OssiaStaff {
  readonly id: string;
  /** Parent staff ID */
  readonly parentStaffId: string;
  /** Start measure number */
  readonly startMeasure: number;
  /** End measure number */
  readonly endMeasure: number;
  /** Events in ossia staff */
  readonly events: readonly NotationEvent[];
  /** Whether ossia is currently active for playback */
  readonly active: boolean;
}

/**
 * Determines which notes to play: main staff or ossia.
 */
export function selectOssiaOrMain(
  mainEvents: readonly NotationEvent[],
  ossiaStaves: readonly OssiaStaff[],
  currentMeasure: number,
  staffId: string
): readonly NotationEvent[] {
  // Find active ossia for this staff and measure
  const activeOssia = ossiaStaves.find(
    ossia =>
      ossia.parentStaffId === staffId &&
      ossia.active &&
      currentMeasure >= ossia.startMeasure &&
      currentMeasure <= ossia.endMeasure
  );
  
  if (activeOssia) {
    return activeOssia.events;
  }
  
  return mainEvents;
}

// ============================================================================
// CAUTIONARY & COURTESY ACCIDENTALS
// ============================================================================

/**
 * Accidental display policy.
 * 
 * Tasks 2685-2686: Add cautionary/courtesy accidentals
 */
export interface AccidentalPolicy {
  /** Show cautionary accidentals (after key changes) */
  readonly showCautionary: boolean;
  /** Show courtesy accidentals (across bar lines) */
  readonly showCourtesy: boolean;
  /** How many measures to show courtesy accidentals */
  readonly courtesyRange: number;
}

/**
 * Default accidental policies.
 */
export const ACCIDENTAL_POLICIES: Record<string, AccidentalPolicy> = {
  minimal: { showCautionary: false, showCourtesy: false, courtesyRange: 0 },
  standard: { showCautionary: true, showCourtesy: true, courtesyRange: 1 },
  generous: { showCautionary: true, showCourtesy: true, courtesyRange: 2 },
  explicit: { showCautionary: true, showCourtesy: true, courtesyRange: 99 },
};

/**
 * Determines if an accidental should be marked as cautionary.
 */
export function shouldShowCautionaryAccidental(
  note: NotationNote,
  _keySignature: KeySignature,
  policy: AccidentalPolicy,
  isAfterKeyChange: boolean
): boolean {
  if (!policy.showCautionary || !isAfterKeyChange) {
    return false;
  }
  
  // Show cautionary if note would have different accidental in new key
  // This is a simplified check; full implementation would track measure history
  return note.accidental !== undefined;
}

/**
 * Determines if a courtesy accidental should be shown.
 * Courtesy accidentals remind the player of accidentals from previous measures.
 */
export function shouldShowCourtesyAccidental(
  note: NotationNote,
  previousMeasureAccidentals: Set<number>, // Set of MIDI pitches with accidentals
  policy: AccidentalPolicy
): boolean {
  if (!policy.showCourtesy) {
    return false;
  }
  
  // Show courtesy if this pitch had an accidental recently
  return previousMeasureAccidentals.has(note.pitch);
}

// ============================================================================
// PROOF-READING MODE
// ============================================================================

/**
 * Proof-reading mode configuration.
 * 
 * Task 2687: Create proof-reading mode
 */
export interface ProofReadingConfig {
  /** Highlight potential errors */
  readonly highlightErrors: boolean;
  /** Types of checks to perform */
  readonly checks: readonly ProofReadingCheck[];
  /** Severity threshold for alerts */
  readonly severityThreshold: 'info' | 'warning' | 'error';
}

/**
 * Types of proof-reading checks.
 */
export type ProofReadingCheck =
  | 'range' // Notes outside instrument range
  | 'spacing' // Unusual intervals
  | 'voice-leading' // Parallel fifths/octaves
  | 'rhythm' // Unusual rhythmic patterns
  | 'accidentals' // Potentially missing accidentals
  | 'collisions' // Visual collisions
  | 'beaming' // Incorrect beaming
  | 'articulations'; // Conflicting articulations

/**
 * Proof-reading issue.
 */
export interface ProofReadingIssue {
  readonly id: string;
  readonly type: ProofReadingCheck;
  readonly severity: 'info' | 'warning' | 'error';
  readonly measureNumber: number;
  readonly noteId?: string;
  readonly message: string;
  readonly suggestion?: string;
}

/**
 * Default proof-reading configuration.
 */
export const DEFAULT_PROOFREADING_CONFIG: ProofReadingConfig = {
  highlightErrors: true,
  checks: ['range', 'spacing', 'accidentals', 'rhythm'],
  severityThreshold: 'warning',
};

/**
 * Checks for notes outside reasonable instrument range.
 */
export function checkNoteRange(
  note: NotationNote,
  instrumentRange: { min: number; max: number },
  measureNumber: number
): ProofReadingIssue | null {
  if (note.pitch < instrumentRange.min || note.pitch > instrumentRange.max) {
    return {
      id: `range-${note.id}`,
      type: 'range',
      severity: 'warning',
      measureNumber,
      noteId: note.id,
      message: `Note ${note.pitch} is outside typical instrument range (${instrumentRange.min}-${instrumentRange.max})`,
      suggestion: 'Consider transposing or check if this is intentional',
    };
  }
  return null;
}

/**
 * Checks for unusual intervals between consecutive notes.
 */
export function checkIntervalSpacing(
  note1: NotationNote,
  note2: NotationNote,
  measureNumber: number
): ProofReadingIssue | null {
  const interval = Math.abs(note2.pitch - note1.pitch);
  
  // Flag intervals larger than an octave and a fifth (19 semitones)
  if (interval > 19) {
    return {
      id: `spacing-${note1.id}-${note2.id}`,
      type: 'spacing',
      severity: 'info',
      measureNumber,
      message: `Large interval of ${interval} semitones between notes`,
      suggestion: 'Verify this melodic leap is intentional',
    };
  }
  
  return null;
}

/**
 * Performs all proof-reading checks on a measure.
 */
export function proofReadMeasure(
  measure: NotationMeasure,
  config: ProofReadingConfig,
  instrumentRange?: { min: number; max: number }
): readonly ProofReadingIssue[] {
  const issues: ProofReadingIssue[] = [];
  
  // Extract all notes from all voices
  const allEvents: NotationEvent[] = [];
  for (const voiceEvents of measure.events.values()) {
    allEvents.push(...voiceEvents);
  }
  
  // Sort by tick for sequential checks
  allEvents.sort((a, b) => a.tick - b.tick);
  
  for (let i = 0; i < allEvents.length; i++) {
    const event = allEvents[i];
    if (!event || event.isRest) continue;
    
    for (const note of event.notes) {
      // Range check
      if (config.checks.includes('range') && instrumentRange) {
        const rangeIssue = checkNoteRange(note, instrumentRange, measure.number);
        if (rangeIssue) issues.push(rangeIssue);
      }
      
      // Spacing check (with next note)
      if (config.checks.includes('spacing') && i < allEvents.length - 1) {
        const nextEvent = allEvents[i + 1];
        if (nextEvent && !nextEvent.isRest && nextEvent.notes.length > 0) {
          const nextNote = nextEvent.notes[0];
          if (nextNote) {
            const spacingIssue = checkIntervalSpacing(note, nextNote, measure.number);
            if (spacingIssue) issues.push(spacingIssue);
          }
        }
      }
    }
  }
  
  // Filter by severity threshold
  const thresholdLevels = { info: 0, warning: 1, error: 2 };
  const minLevel = thresholdLevels[config.severityThreshold];
  
  return issues.filter(issue => thresholdLevels[issue.severity] >= minLevel);
}

// ============================================================================
// STAFF-TO-INSTRUMENT BINDING
// ============================================================================

/**
 * Binds a notation staff to playback instruments and effects.
 * 
 * Task 2671: Attach Sampler instruments/automation/modulation to staves
 */
export interface StaffInstrumentBinding {
  readonly staffId: string;
  /** Card ID for the instrument (e.g., SamplerCard, WavetableCard) */
  readonly instrumentCardId: string;
  /** Preset name/ID to load */
  readonly presetId?: string;
  /** Automation lanes to apply */
  readonly automationLanes?: readonly AutomationBinding[];
  /** Modulation routings */
  readonly modulationRouting?: readonly ModulationBinding[];
}

/**
 * Automation lane binding.
 */
export interface AutomationBinding {
  readonly laneId: string;
  /** Parameter path in card (e.g., "filter.cutoff") */
  readonly targetParameter: string;
  /** Automation points */
  readonly points: readonly { tick: Tick; value: number }[];
}

/**
 * Modulation routing binding.
 */
export interface ModulationBinding {
  readonly sourceId: string;
  /** Parameter to modulate */
  readonly targetParameter: string;
  /** Modulation amount/depth */
  readonly amount: number;
}

/**
 * Text direction in notation (e.g., "cresc.", "dim.", "rit.").
 * 
 * Task 2672: Build simple DSL to define what a text direction means
 */
export interface NotationTextDirection {
  readonly id: string;
  readonly text: string;
  readonly startMeasure: number;
  readonly endMeasure?: number;
  /** DSL action to perform */
  readonly action: TextDirectionAction;
}

/**
 * Action triggered by text direction.
 */
export type TextDirectionAction =
  | { type: 'crescendo'; startDynamic: DynamicLevel; endDynamic: DynamicLevel }
  | { type: 'diminuendo'; startDynamic: DynamicLevel; endDynamic: DynamicLevel }
  | { type: 'accelerando'; startTempo: number; endTempo: number }
  | { type: 'ritardando'; startTempo: number; endTempo: number }
  | { type: 'parameter-ramp'; cardId: string; parameter: string; startValue: number; endValue: number }
  | { type: 'activate-card'; cardId: string }
  | { type: 'deactivate-card'; cardId: string }
  | { type: 'trigger-event'; eventType: string; data?: unknown };

/**
 * Parses text direction into action.
 */
export function parseTextDirection(
  text: string,
  startMeasure: number,
  endMeasure: number | undefined,
  currentDynamic: DynamicLevel,
  currentTempo: number
): NotationTextDirection | null {
  const lowerText = text.toLowerCase().trim();
  
  // Crescendo variations
  if (lowerText === 'cresc.' || lowerText === 'crescendo' || lowerText === '<') {
    // Grow from current dynamic to next level
    const dynamics: DynamicLevel[] = ['pp', 'p', 'mp', 'mf', 'f', 'ff'];
    const currentIndex = dynamics.indexOf(currentDynamic);
    const targetIndex = Math.min(currentIndex + 2, dynamics.length - 1);
    const result: NotationTextDirection = {
      id: `cresc-${startMeasure}`,
      text,
      startMeasure,
      action: {
        type: 'crescendo',
        startDynamic: currentDynamic,
        endDynamic: dynamics[targetIndex] ?? 'ff',
      },
    };
    if (endMeasure !== undefined) {
      return { ...result, endMeasure };
    }
    return result;
  }
  
  // Diminuendo variations
  if (lowerText === 'dim.' || lowerText === 'diminuendo' || lowerText === '>') {
    const dynamics: DynamicLevel[] = ['pp', 'p', 'mp', 'mf', 'f', 'ff'];
    const currentIndex = dynamics.indexOf(currentDynamic);
    const targetIndex = Math.max(currentIndex - 2, 0);
    const result: NotationTextDirection = {
      id: `dim-${startMeasure}`,
      text,
      startMeasure,
      action: {
        type: 'diminuendo',
        startDynamic: currentDynamic,
        endDynamic: dynamics[targetIndex] ?? 'pp',
      },
    };
    if (endMeasure !== undefined) {
      return { ...result, endMeasure };
    }
    return result;
  }
  
  // Ritardando variations
  if (lowerText === 'rit.' || lowerText === 'ritardando' || lowerText === 'rall.' || lowerText === 'rallentando') {
    const targetTempo = currentTempo * 0.75; // Slow to 75% of current tempo
    const result: NotationTextDirection = {
      id: `rit-${startMeasure}`,
      text,
      startMeasure,
      action: {
        type: 'ritardando',
        startTempo: currentTempo,
        endTempo: targetTempo,
      },
    };
    if (endMeasure !== undefined) {
      return { ...result, endMeasure };
    }
    return result;
  }
  
  // Accelerando variations
  if (lowerText === 'accel.' || lowerText === 'accelerando') {
    const targetTempo = currentTempo * 1.25; // Speed to 125% of current tempo
    const result: NotationTextDirection = {
      id: `accel-${startMeasure}`,
      text,
      startMeasure,
      action: {
        type: 'accelerando',
        startTempo: currentTempo,
        endTempo: targetTempo,
      },
    };
    if (endMeasure !== undefined) {
      return { ...result, endMeasure };
    }
    return result;
  }
  
  // Unknown text direction
  return null;
}

/**
 * Applies text direction action to playback context.
 */
export function applyTextDirection(
  action: TextDirectionAction,
  currentTick: Tick,
  startTick: Tick,
  endTick: Tick
): { tempo?: number; dynamic?: DynamicLevel } {
  const progress = (currentTick - startTick) / (endTick - startTick);
  const clampedProgress = Math.max(0, Math.min(1, progress));
  
  switch (action.type) {
    case 'crescendo':
    case 'diminuendo': {
      // Interpolate dynamics (simplified - would map to velocity)
      // Return dynamic for this point in the crescendo/diminuendo
      return { dynamic: action.endDynamic };
    }
    
    case 'accelerando':
    case 'ritardando': {
      // Interpolate tempo
      const tempoRange = action.endTempo - action.startTempo;
      const currentTempo = action.startTempo + tempoRange * clampedProgress;
      return { tempo: currentTempo };
    }
    
    case 'parameter-ramp':
    case 'activate-card':
    case 'deactivate-card':
    case 'trigger-event':
      // These would interact with the card system
      return {};
    
    default:
      return {};
  }
}


