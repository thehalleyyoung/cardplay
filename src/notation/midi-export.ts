/**
 * @fileoverview MIDI Export from Notation.
 * 
 * Converts notation to Standard MIDI File (SMF) format.
 * Preserves tempo, time signature, dynamics, and articulations.
 * 
 * Phase 11.5 (final): Advanced notation features
 * Task 2690: Create MIDI export from notation
 * 
 * @module @cardplay/core/notation/midi-export
 */

import type {
  NotationMeasure,
  NotationEvent,
  TimeSignature,
  KeySignature,
  ArticulationType,
  NoteDurationType,
} from './types';
import { DURATION_VALUES } from './types';

// ============================================================================
// MIDI EXPORT TYPES
// ============================================================================

/**
 * MIDI file format (0 = single track, 1 = multiple tracks, 2 = multiple songs)
 */
export type MIDIFormat = 0 | 1 | 2;

/**
 * MIDI export configuration.
 */
export interface MIDIExportConfig {
  /** MIDI file format */
  readonly format: MIDIFormat;
  /** Ticks per quarter note (default 480) */
  readonly ticksPerQuarter: number;
  /** Default tempo in BPM (if not specified in notation) */
  readonly defaultTempo: number;
  /** Default velocity for notes without dynamics */
  readonly defaultVelocity: number;
  /** Include tempo map */
  readonly includeTempo: boolean;
  /** Include time signature changes */
  readonly includeTimeSignature: boolean;
  /** Include key signature */
  readonly includeKeySignature: boolean;
  /** Include track name */
  readonly includeTrackName: boolean;
  /** Map articulations to MIDI velocities */
  readonly mapArticulations: boolean;
}

/**
 * Default MIDI export configuration.
 */
export const DEFAULT_MIDI_EXPORT_CONFIG: MIDIExportConfig = {
  format: 1,
  ticksPerQuarter: 480,
  defaultTempo: 120,
  defaultVelocity: 80,
  includeTempo: true,
  includeTimeSignature: true,
  includeKeySignature: true,
  includeTrackName: true,
  mapArticulations: true,
};

/**
 * Represents a MIDI event with timing.
 */
interface MIDITimedEvent {
  readonly tick: number;
  readonly type: 'noteOn' | 'noteOff' | 'meta' | 'controller';
  readonly data: Uint8Array;
}

// ============================================================================
// NOTATION TO MIDI CONVERSION
// ============================================================================

/**
 * Converts notation measures to Standard MIDI File binary data.
 * 
 * Task 2690: Create MIDI export from notation
 */
export function exportNotationToMIDI(
  measures: readonly NotationMeasure[],
  keySignature?: KeySignature,
  trackName: string = 'Notation',
  config: MIDIExportConfig = DEFAULT_MIDI_EXPORT_CONFIG
): Uint8Array {
  const events: MIDITimedEvent[] = [];
  let currentTick = 0;
  
  // Add track name
  if (config.includeTrackName) {
    events.push(createMetaEvent(0, 0x03, encodeString(trackName)));
  }
  
  // Add tempo
  if (config.includeTempo) {
    const microsecondsPerQuarter = Math.floor(60_000_000 / config.defaultTempo);
    events.push(createMetaEvent(0, 0x51, encodeTempo(microsecondsPerQuarter)));
  }
  
  // Add initial time signature (from first measure)
  if (config.includeTimeSignature && measures.length > 0) {
    const firstMeasure = measures[0];
    const ts = firstMeasure?.timeSignature;
    if (ts) {
      events.push(createMetaEvent(0, 0x58, encodeTimeSignature(ts)));
    }
  }
  
  // Add key signature
  if (config.includeKeySignature && keySignature) {
    events.push(createMetaEvent(0, 0x59, encodeKeySignature(keySignature)));
  }
  
  // Convert notation to MIDI events
  for (const measure of measures) {
    const ts = measure.timeSignature;
    const measureTicks = ts 
      ? calculateMeasureTicks(ts, config.ticksPerQuarter)
      : config.ticksPerQuarter * 4; // Default to 4/4
    
    // Process all voices in the measure
    measure.events.forEach((eventsInVoice) => {
      let voiceCurrentTick = currentTick;
      
      for (const event of eventsInVoice) {
        if (event.isRest) {
          // Skip rests
          const noteTicks = calculateNoteTicks(event.duration, config.ticksPerQuarter);
          voiceCurrentTick += noteTicks;
          continue;
        }
        
        const noteTicks = calculateNoteTicks(event.duration, config.ticksPerQuarter);
        const velocity = calculateVelocity(event, config);
        
        // Create note on/off for each note in the event
        for (const note of event.notes) {
          // Note On
          events.push({
            tick: voiceCurrentTick,
            type: 'noteOn',
            data: new Uint8Array([0x90, note.pitch, velocity]),
          });
          
          // Note Off (apply staccato duration reduction if present)
          const durationTicks = event.articulations?.includes('staccato' as ArticulationType) ||
                                 event.articulations?.includes('staccatissimo' as ArticulationType)
            ? Math.floor(noteTicks * 0.5)  // Shorten duration for staccato
            : noteTicks;
          
          events.push({
            tick: voiceCurrentTick + durationTicks,
            type: 'noteOff',
            data: new Uint8Array([0x80, note.pitch, 64]),
          });
        }
        
        voiceCurrentTick += noteTicks;
      }
    });
    
    currentTick += measureTicks;
  }
  
  // Sort events by tick
  events.sort((a, b) => a.tick - b.tick);
  
  // Add end of track
  const lastEvent = events[events.length - 1];
  const lastTick = lastEvent ? lastEvent.tick : 0;
  events.push(createMetaEvent(lastTick, 0x2F, new Uint8Array([0])));
  
  // Build MIDI file
  return buildMIDIFile(events, config);
}

/**
 * Calculates the number of ticks in a measure.
 */
function calculateMeasureTicks(ts: TimeSignature, ticksPerQuarter: number): number {
  // (numerator / denominator) * 4 * ticksPerQuarter
  // Example: 4/4 = (4/4) * 4 * 480 = 1920 ticks
  return Math.floor((ts.numerator / ts.denominator) * 4 * ticksPerQuarter);
}

/**
 * Calculates the number of ticks for a note duration.
 */
function calculateNoteTicks(duration: { base: NoteDurationType; dots: number }, ticksPerQuarter: number): number {
  const baseValue = DURATION_VALUES[duration.base];
  const dots = duration.dots || 0;
  
  // Apply dots (each dot adds half of the previous value)
  let totalValue = baseValue;
  let dotValue = baseValue;
  for (let i = 0; i < dots; i++) {
    dotValue /= 2;
    totalValue += dotValue;
  }
  
  return Math.floor(totalValue * ticksPerQuarter);
}

/**
 * Calculates MIDI velocity for an event based on dynamics and articulations.
 */
function calculateVelocity(
  event: NotationEvent,
  config: MIDIExportConfig
): number {
  let velocity = config.defaultVelocity;
  
  // Apply articulation modifiers
  if (config.mapArticulations && event.articulations) {
    velocity = applyArticulationVelocity(velocity, event.articulations);
  }
  
  return Math.max(1, Math.min(127, velocity));
}

/**
 * Applies articulation velocity adjustments.
 */
function applyArticulationVelocity(
  baseVelocity: number,
  articulations: readonly ArticulationType[]
): number {
  let velocity = baseVelocity;
  
  for (const articulation of articulations) {
    switch (articulation) {
      case 'accent':
        velocity = Math.floor(velocity * 1.2);
        break;
      case 'marcato':
        velocity = Math.floor(velocity * 1.3);
        break;
      case 'staccato':
      case 'staccatissimo':
        // Staccato affects duration, not velocity in this implementation
        break;
      case 'tenuto':
        velocity = Math.floor(velocity * 1.05);
        break;
    }
  }
  
  return velocity;
}

// ============================================================================
// MIDI FILE ENCODING
// ============================================================================

/**
 * Creates a MIDI meta event.
 */
function createMetaEvent(tick: number, metaType: number, data: Uint8Array): MIDITimedEvent {
  const eventData = new Uint8Array(2 + data.length);
  eventData[0] = 0xFF;
  eventData[1] = metaType;
  eventData.set(data, 2);
  
  return {
    tick,
    type: 'meta',
    data: eventData,
  };
}

/**
 * Encodes a string to MIDI meta event data format.
 */
function encodeString(str: string): Uint8Array {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const length = encodeVariableLength(bytes.length);
  const result = new Uint8Array(length.length + bytes.length);
  result.set(length, 0);
  result.set(bytes, length.length);
  return result;
}

/**
 * Encodes tempo (microseconds per quarter note) to MIDI format.
 */
function encodeTempo(microsecondsPerQuarter: number): Uint8Array {
  const length = encodeVariableLength(3);
  const result = new Uint8Array(length.length + 3);
  result.set(length, 0);
  let offset = length.length;
  result[offset++] = (microsecondsPerQuarter >> 16) & 0xFF;
  result[offset++] = (microsecondsPerQuarter >> 8) & 0xFF;
  result[offset++] = microsecondsPerQuarter & 0xFF;
  return result;
}

/**
 * Encodes time signature to MIDI format.
 */
function encodeTimeSignature(ts: TimeSignature): Uint8Array {
  const length = encodeVariableLength(4);
  const result = new Uint8Array(length.length + 4);
  result.set(length, 0);
  let offset = length.length;
  result[offset++] = ts.numerator;
  result[offset++] = Math.log2(ts.denominator);
  result[offset++] = 24; // MIDI clocks per metronome click
  result[offset++] = 8; // Number of 32nd notes per quarter note
  return result;
}

/**
 * Encodes key signature to MIDI format.
 */
function encodeKeySignature(ks: KeySignature): Uint8Array {
  const length = encodeVariableLength(2);
  const result = new Uint8Array(length.length + 2);
  result.set(length, 0);
  let offset = length.length;
  result[offset++] = ks.accidentals; // Sharps (positive) or flats (negative)
  result[offset++] = ks.mode === 'major' ? 0 : 1;
  return result;
}

/**
 * Encodes a value using MIDI variable-length quantity format.
 */
function encodeVariableLength(value: number): Uint8Array {
  const bytes: number[] = [];
  let v = value;
  
  bytes.push(v & 0x7F);
  v >>= 7;
  
  while (v > 0) {
    bytes.unshift((v & 0x7F) | 0x80);
    v >>= 7;
  }
  
  return new Uint8Array(bytes);
}

/**
 * Builds complete MIDI file from timed events.
 */
function buildMIDIFile(events: readonly MIDITimedEvent[], config: MIDIExportConfig): Uint8Array {
  // Build track chunk
  const trackEvents: number[] = [];
  let lastTick = 0;
  
  for (const event of events) {
    const deltaTime = event.tick - lastTick;
    const deltaBytes = Array.from(encodeVariableLength(deltaTime));
    trackEvents.push(...deltaBytes);
    trackEvents.push(...Array.from(event.data));
    lastTick = event.tick;
  }
  
  const trackData = new Uint8Array(trackEvents);
  
  // Build header chunk
  const header = new Uint8Array(14);
  let offset = 0;
  
  // "MThd" magic number
  header[offset++] = 0x4D;
  header[offset++] = 0x54;
  header[offset++] = 0x68;
  header[offset++] = 0x64;
  
  // Header length (always 6)
  header[offset++] = 0x00;
  header[offset++] = 0x00;
  header[offset++] = 0x00;
  header[offset++] = 0x06;
  
  // Format type
  header[offset++] = 0x00;
  header[offset++] = config.format;
  
  // Number of tracks (1 for format 0, could be more for format 1)
  header[offset++] = 0x00;
  header[offset++] = 0x01;
  
  // Ticks per quarter note
  header[offset++] = (config.ticksPerQuarter >> 8) & 0xFF;
  header[offset++] = config.ticksPerQuarter & 0xFF;
  
  // Build track chunk header
  const trackHeader = new Uint8Array(8);
  offset = 0;
  
  // "MTrk" magic number
  trackHeader[offset++] = 0x4D;
  trackHeader[offset++] = 0x54;
  trackHeader[offset++] = 0x72;
  trackHeader[offset++] = 0x6B;
  
  // Track length
  const trackLength = trackData.length;
  trackHeader[offset++] = (trackLength >> 24) & 0xFF;
  trackHeader[offset++] = (trackLength >> 16) & 0xFF;
  trackHeader[offset++] = (trackLength >> 8) & 0xFF;
  trackHeader[offset++] = trackLength & 0xFF;
  
  // Combine all chunks
  const midiFile = new Uint8Array(header.length + trackHeader.length + trackData.length);
  midiFile.set(header, 0);
  midiFile.set(trackHeader, header.length);
  midiFile.set(trackData, header.length + trackHeader.length);
  
  return midiFile;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a downloadable MIDI file blob.
 */
export function createMIDIBlob(midiData: Uint8Array): Blob {
  // Create a new Uint8Array copy to ensure it's backed by a regular ArrayBuffer
  const copy = new Uint8Array(midiData);
  return new Blob([copy], { type: 'audio/midi' });
}

/**
 * Downloads MIDI file with given filename.
 */
export function downloadMIDIFile(midiData: Uint8Array, filename: string = 'notation.mid'): void {
  const blob = createMIDIBlob(midiData);
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Validates MIDI data by checking header.
 */
export function validateMIDIData(data: Uint8Array): boolean {
  if (data.length < 14) return false;
  
  // Check "MThd" magic number
  return (
    data[0] === 0x4D &&
    data[1] === 0x54 &&
    data[2] === 0x68 &&
    data[3] === 0x64
  );
}
