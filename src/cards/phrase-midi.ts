/**
 * @fileoverview MIDI Import/Export for Phrase System
 * 
 * Converts between MIDI files and CardPlay phrase representations.
 * Supports Standard MIDI File (SMF) format 0/1 with tempo, time signature,
 * and comprehensive note data preservation.
 * 
 * @module @cardplay/core/cards/phrase-midi
 */

import type { MIDIPitch } from '../voices/voice';
import { Articulation } from '../voices/voice';
import type {
  ShapeContour,
  RhythmPattern,
  RhythmStep,
  PhraseRecord,
  PhraseMetadata,
  MoodTag,
  GenreTag,
} from './phrase-system';

// ============================================================================
// MIDI FILE FORMAT TYPES
// ============================================================================

/**
 * MIDI file format
 */
export type MIDIFormat = 0 | 1 | 2;

/**
 * MIDI event type
 */
export type MIDIEventType = 
  | 'noteOn'
  | 'noteOff'
  | 'noteAftertouch'
  | 'controller'
  | 'programChange'
  | 'channelAftertouch'
  | 'pitchBend'
  | 'meta';

/**
 * MIDI meta event types
 */
export type MIDIMetaType =
  | 'sequenceNumber'
  | 'text'
  | 'copyright'
  | 'trackName'
  | 'instrumentName'
  | 'lyric'
  | 'marker'
  | 'cuePoint'
  | 'channelPrefix'
  | 'endOfTrack'
  | 'setTempo'
  | 'smpteOffset'
  | 'timeSignature'
  | 'keySignature'
  | 'sequencerSpecific';

/**
 * MIDI event
 */
export interface MIDIEvent {
  readonly deltaTime: number;  // Ticks since last event
  readonly absoluteTime: number;  // Absolute time in ticks
  readonly type: MIDIEventType;
  readonly channel?: number;  // 0-15
  readonly note?: number;  // 0-127
  readonly velocity?: number;  // 0-127
  readonly controller?: number;  // 0-127
  readonly value?: number;  // 0-127
  readonly program?: number;  // 0-127
  readonly pressure?: number;  // 0-127
  readonly bend?: number;  // -8192 to 8191
  readonly metaType?: MIDIMetaType;
  readonly data?: Uint8Array;
  readonly text?: string;
}

/**
 * MIDI track
 */
export interface MIDITrack {
  readonly events: readonly MIDIEvent[];
  readonly name?: string;
}

/**
 * MIDI file structure
 */
export interface MIDIFile {
  readonly format: MIDIFormat;
  readonly tracks: readonly MIDITrack[];
  readonly ticksPerQuarterNote: number;
  readonly tempo?: number;  // Microseconds per quarter note
  readonly timeSignature?: {
    readonly numerator: number;
    readonly denominator: number;
  };
  readonly keySignature?: {
    readonly key: number;  // -7 to 7 (flats to sharps)
    readonly scale: 'major' | 'minor';
  };
}

/**
 * Note extracted from MIDI
 */
export interface MIDINote {
  readonly pitch: number;  // MIDI note number 0-127
  readonly start: number;  // Ticks
  readonly duration: number;  // Ticks
  readonly velocity: number;  // 0-127
  readonly channel: number;  // 0-15
}

/**
 * Import options
 */
export interface MIDIImportOptions {
  /** Track index to import (undefined = all tracks merged) */
  readonly trackIndex?: number;
  /** Channel filter (undefined = all channels) */
  readonly channel?: number;
  /** Quantize to grid (ticks per step, 0 = no quantization) */
  readonly quantize?: number;
  /** Minimum note duration in ticks */
  readonly minDuration?: number;
  /** Transpose by semitones */
  readonly transpose?: number;
  /** Velocity scaling factor (0-2) */
  readonly velocityScale?: number;
  /** Extract contour shape from pitches */
  readonly extractContour?: boolean;
  /** Extract rhythm pattern separately */
  readonly extractRhythm?: boolean;
  /** Auto-detect key/scale */
  readonly detectKey?: boolean;
}

/**
 * Export options
 */
export interface MIDIExportOptions {
  /** MIDI format (0 or 1) */
  readonly format?: MIDIFormat;
  /** Ticks per quarter note (default 480) */
  readonly ticksPerQuarterNote?: number;
  /** Tempo in BPM (default 120) */
  readonly tempo?: number;
  /** Time signature */
  readonly timeSignature?: {
    readonly numerator: number;
    readonly denominator: number;
  };
  /** MIDI channel (0-15) */
  readonly channel?: number;
  /** Program change (0-127, undefined = no change) */
  readonly program?: number;
  /** Track name */
  readonly trackName?: string;
  /** Add copyright meta event */
  readonly copyright?: string;
  /** Add metadata as MIDI text events */
  readonly includeMetadata?: boolean;
}

// ============================================================================
// MIDI PARSING
// ============================================================================

/**
 * Parse MIDI file from Uint8Array
 */
export function parseMIDIFile(data: Uint8Array): MIDIFile {
  let offset = 0;

  // Read 32-bit big-endian integer
  function readUInt32(): number {
    const value = ((data[offset] ?? 0) << 24) | ((data[offset + 1] ?? 0) << 16) | 
                  ((data[offset + 2] ?? 0) << 8) | (data[offset + 3] ?? 0);
    offset += 4;
    return value >>> 0;  // Convert to unsigned
  }

  // Read 16-bit big-endian integer
  function readUInt16(): number {
    const value = ((data[offset] ?? 0) << 8) | (data[offset + 1] ?? 0);
    offset += 2;
    return value;
  }

  // Read 8-bit unsigned integer
  function readUInt8(): number {
    return data[offset++] ?? 0;
  }

  // Read variable-length quantity
  function readVarLen(): number {
    let value = 0;
    let byte: number;
    do {
      byte = readUInt8();
      value = (value << 7) | (byte & 0x7f);
    } while (byte & 0x80);
    return value;
  }

  // Read chunk header
  function readChunkHeader(): { type: string; length: number } {
    const type = String.fromCharCode(data[offset] ?? 0, data[offset + 1] ?? 0, 
                                    data[offset + 2] ?? 0, data[offset + 3] ?? 0);
    offset += 4;
    const length = readUInt32();
    return { type, length };
  }

  // Parse header chunk
  const header = readChunkHeader();
  if (header.type !== 'MThd' || header.length !== 6) {
    throw new Error('Invalid MIDI file: bad header');
  }

  const format = readUInt16() as MIDIFormat;
  const trackCount = readUInt16();
  const division = readUInt16();

  if (division & 0x8000) {
    throw new Error('SMPTE time code not supported');
  }

  const ticksPerQuarterNote = division & 0x7fff;

  // Parse tracks
  const tracks: MIDITrack[] = [];
  let globalTempo: number | undefined;
  let globalTimeSignature: { numerator: number; denominator: number } | undefined;

  for (let i = 0; i < trackCount; i++) {
    const trackHeader = readChunkHeader();
    if (trackHeader.type !== 'MTrk') {
      throw new Error(`Invalid MIDI file: expected MTrk, got ${trackHeader.type}`);
    }

    const trackEnd = offset + trackHeader.length;
    const events: MIDIEvent[] = [];
    let absoluteTime = 0;
    let runningStatus = 0;
    let trackName: string | undefined;

    while (offset < trackEnd) {
      const deltaTime = readVarLen();
      absoluteTime += deltaTime;

      let status = readUInt8();
      
      // Handle running status
      if (!(status & 0x80)) {
        offset--;  // Put the data byte back
        status = runningStatus;
      } else {
        runningStatus = status;
      }

      const eventType = status >> 4;
      const channel = status & 0x0f;

      let event: MIDIEvent;

      if (eventType === 0x8) {
        // Note Off
        const note = readUInt8();
        const velocity = readUInt8();
        event = {
          deltaTime,
          absoluteTime,
          type: 'noteOff',
          channel,
          note,
          velocity,
        };
      } else if (eventType === 0x9) {
        // Note On (velocity 0 = Note Off)
        const note = readUInt8();
        const velocity = readUInt8();
        event = {
          deltaTime,
          absoluteTime,
          type: velocity === 0 ? 'noteOff' : 'noteOn',
          channel,
          note,
          velocity,
        };
      } else if (eventType === 0xa) {
        // Note Aftertouch
        const note = readUInt8();
        const pressure = readUInt8();
        event = {
          deltaTime,
          absoluteTime,
          type: 'noteAftertouch',
          channel,
          note,
          pressure,
        };
      } else if (eventType === 0xb) {
        // Controller
        const controller = readUInt8();
        const value = readUInt8();
        event = {
          deltaTime,
          absoluteTime,
          type: 'controller',
          channel,
          controller,
          value,
        };
      } else if (eventType === 0xc) {
        // Program Change
        const program = readUInt8();
        event = {
          deltaTime,
          absoluteTime,
          type: 'programChange',
          channel,
          program,
        };
      } else if (eventType === 0xd) {
        // Channel Aftertouch
        const pressure = readUInt8();
        event = {
          deltaTime,
          absoluteTime,
          type: 'channelAftertouch',
          channel,
          pressure,
        };
      } else if (eventType === 0xe) {
        // Pitch Bend
        const lsb = readUInt8();
        const msb = readUInt8();
        const bend = ((msb << 7) | lsb) - 8192;
        event = {
          deltaTime,
          absoluteTime,
          type: 'pitchBend',
          channel,
          bend,
        };
      } else if (status === 0xff) {
        // Meta Event
        const metaType = readUInt8();
        const length = readVarLen();
        const metaData = data.slice(offset, offset + length);
        offset += length;

        let metaTypeName: MIDIMetaType = 'sequencerSpecific';
        let text: string | undefined;

        switch (metaType) {
          case 0x00: metaTypeName = 'sequenceNumber'; break;
          case 0x01: metaTypeName = 'text'; text = new TextDecoder().decode(metaData); break;
          case 0x02: metaTypeName = 'copyright'; text = new TextDecoder().decode(metaData); break;
          case 0x03: 
            metaTypeName = 'trackName'; 
            text = new TextDecoder().decode(metaData);
            trackName = text;
            break;
          case 0x04: metaTypeName = 'instrumentName'; text = new TextDecoder().decode(metaData); break;
          case 0x05: metaTypeName = 'lyric'; text = new TextDecoder().decode(metaData); break;
          case 0x06: metaTypeName = 'marker'; text = new TextDecoder().decode(metaData); break;
          case 0x07: metaTypeName = 'cuePoint'; text = new TextDecoder().decode(metaData); break;
          case 0x20: metaTypeName = 'channelPrefix'; break;
          case 0x2f: metaTypeName = 'endOfTrack'; break;
          case 0x51: 
            metaTypeName = 'setTempo';
            if (length === 3) {
              globalTempo = ((metaData[0] ?? 0) << 16) | ((metaData[1] ?? 0) << 8) | (metaData[2] ?? 0);
            }
            break;
          case 0x54: metaTypeName = 'smpteOffset'; break;
          case 0x58:
            metaTypeName = 'timeSignature';
            if (length === 4) {
              globalTimeSignature = {
                numerator: metaData[0] ?? 4,
                denominator: Math.pow(2, metaData[1] ?? 2),
              };
            }
            break;
          case 0x59: metaTypeName = 'keySignature'; break;
          case 0x7f: metaTypeName = 'sequencerSpecific'; break;
        }

        event = {
          deltaTime,
          absoluteTime,
          type: 'meta',
          metaType: metaTypeName,
          data: metaData,
          ...(text !== undefined && { text }),
        };
      } else {
        // Unknown event, skip
        continue;
      }

      events.push(event);
    }

    tracks.push({ events, ...(trackName !== undefined && { name: trackName }) });
  }

  return {
    format,
    tracks,
    ticksPerQuarterNote,
    ...(globalTempo !== undefined && { tempo: globalTempo }),
    ...(globalTimeSignature !== undefined && { timeSignature: globalTimeSignature }),
  };
}

/**
 * Extract notes from MIDI events
 */
export function extractNotesFromMIDI(
  events: readonly MIDIEvent[],
  options?: { channel?: number }
): readonly MIDINote[] {
  const notes: MIDINote[] = [];
  const activeNotes = new Map<string, { pitch: number; start: number; velocity: number; channel: number }>();

  for (const event of events) {
    if (event.type === 'noteOn' && event.note !== undefined && event.velocity !== undefined) {
      if (options?.channel !== undefined && event.channel !== options.channel) {
        continue;
      }

      const key = `${event.channel}-${event.note}`;
      activeNotes.set(key, {
        pitch: event.note,
        start: event.absoluteTime,
        velocity: event.velocity,
        channel: event.channel!,
      });
    } else if (event.type === 'noteOff' && event.note !== undefined) {
      if (options?.channel !== undefined && event.channel !== options.channel) {
        continue;
      }

      const key = `${event.channel}-${event.note}`;
      const active = activeNotes.get(key);
      
      if (active) {
        notes.push({
          pitch: active.pitch,
          start: active.start,
          duration: event.absoluteTime - active.start,
          velocity: active.velocity,
          channel: active.channel,
        });
        activeNotes.delete(key);
      }
    }
  }

  // Handle any notes that didn't get a noteOff (use last event time)
  const lastTime = events[events.length - 1]?.absoluteTime || 0;
  for (const active of Array.from(activeNotes.values())) {
    notes.push({
      pitch: active.pitch,
      start: active.start,
      duration: Math.max(480, lastTime - active.start),  // Default 1 quarter note
      velocity: active.velocity,
      channel: active.channel,
    });
  }

  return notes.sort((a, b) => a.start - b.start);
}

// ============================================================================
// PHRASE IMPORT
// ============================================================================

/**
 * Import phrase from MIDI file
 */
export function importPhraseFromMIDI(
  midiData: Uint8Array,
  options: MIDIImportOptions = {}
): PhraseRecord<MIDIPitch> {
  const midi = parseMIDIFile(midiData);
  
  // Merge tracks if no specific track requested
  let events: readonly MIDIEvent[];
  let trackName = 'Imported Phrase';
  
  if (options.trackIndex !== undefined) {
    const track = midi.tracks[options.trackIndex];
    if (!track) {
      throw new Error(`Track ${options.trackIndex} not found`);
    }
    events = track.events;
    trackName = track.name || trackName;
  } else {
    // Merge all tracks
    const allEvents = midi.tracks.flatMap(t => [...t.events]);
    events = allEvents.sort((a, b) => a.absoluteTime - b.absoluteTime);
  }

  // Extract notes
  const notes = extractNotesFromMIDI(events, options.channel !== undefined ? { channel: options.channel } : undefined);

  if (notes.length === 0) {
    throw new Error('No notes found in MIDI file');
  }

  // Apply options
  let processedNotes = notes;

  // Transpose
  if (options.transpose) {
    processedNotes = processedNotes.map(n => ({
      ...n,
      pitch: Math.max(0, Math.min(127, n.pitch + options.transpose!)),
    }));
  }

  // Velocity scale
  if (options.velocityScale && options.velocityScale !== 1) {
    processedNotes = processedNotes.map(n => ({
      ...n,
      velocity: Math.max(1, Math.min(127, Math.round(n.velocity * options.velocityScale!))),
    }));
  }

  // Quantize
  if (options.quantize && options.quantize > 0) {
    processedNotes = processedNotes.map(n => {
      const quantizedStart = Math.round(n.start / options.quantize!) * options.quantize!;
      const quantizedDuration = Math.max(
        options.quantize!,
        Math.round(n.duration / options.quantize!) * options.quantize!
      );
      return {
        ...n,
        start: quantizedStart,
        duration: quantizedDuration,
      };
    });
  }

  // Min duration
  if (options.minDuration) {
    processedNotes = processedNotes.map(n => ({
      ...n,
      duration: Math.max(options.minDuration!, n.duration),
    }));
  }

  // Extract contour if requested
  let contour: ShapeContour | undefined;
  if (options.extractContour) {
    contour = extractContourFromNotes(processedNotes);
  }

  // Extract rhythm if requested
  let rhythm: RhythmPattern | undefined;
  if (options.extractRhythm) {
    rhythm = extractRhythmFromNotes(processedNotes);
  }

  // Create phrase metadata
  const firstNote = processedNotes[0];
  if (!firstNote) {
    throw new Error('No notes found after processing');
  }
  const startTick = firstNote.start;
  const endTick = Math.max(...processedNotes.map(n => n.start + n.duration));
  const duration = endTick - startTick;
  
  const pitches = processedNotes.map(n => n.pitch);
  const minPitch = Math.min(...pitches);
  const maxPitch = Math.max(...pitches);

  const metadata: PhraseMetadata = {
    lineType: processedNotes.length > 5 ? 'melody' : 'chord',
    duration: duration / 480,  // Convert to quarter notes
    noteCount: processedNotes.length,
    range: [minPitch, maxPitch] as [number, number],
    ambitus: maxPitch - minPitch,
    density: processedNotes.length / (duration / 480),
    averageInterval: calculateAverageInterval(pitches),
    contourType: contour?.name || 'unknown',
    rhythmComplexity: calculateRhythmComplexity(processedNotes),
    harmonicContent: [],  // Would require chord detection
    mood: [],  // Can be set by user later
    genre: [],  // Can be set by user later
    instrument: null,  // Unknown from MIDI
  };

  // Create phrase record
  const id = `midi-import-${Date.now()}`;
  
  // Create phrase - always create with at least null values
  const phrase = {
    shape: contour ?? null,
    rhythm: rhythm ?? null,
    chords: null,
    scale: null,
    dynamics: null,
  };
  
  return {
    id,
    name: trackName,
    phrase,
    events: [],  // Would need to convert MIDINotes to Event<NotePayload<MIDIPitch>>
    metadata,
    ghosts: [],
    variations: [],
    parentId: null,
    tags: [],
    rating: 0,
    usageCount: 0,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    lastUsedAt: Date.now(),
  };
}

/**
 * Extract shape contour from notes
 */
function extractContourFromNotes(notes: readonly MIDINote[]): ShapeContour {
  const firstNote = notes[0];
  if (!firstNote) {
    return {
      id: 'flat',
      name: 'Flat',
      points: [{ position: 0, value: 0.5 }, { position: 1, value: 0.5 }],
      interpolation: 'linear',
    };
  }

  const pitches = notes.map(n => n.pitch);
  const minPitch = Math.min(...pitches);
  const maxPitch = Math.max(...pitches);
  const range = maxPitch - minPitch || 1;

  const firstStart = firstNote.start;
  const lastEnd = Math.max(...notes.map(n => n.start + n.duration));
  const totalDuration = lastEnd - firstStart;

  const points: Array<{ position: number; value: number }> = notes.map(n => ({
    position: (n.start - firstStart) / totalDuration,
    value: (n.pitch - minPitch) / range,
  }));

  return {
    id: `extracted-${Date.now()}`,
    name: 'Extracted Contour',
    points,
    interpolation: 'smooth',
  };
}

/**
 * Extract rhythm pattern from notes
 */
function extractRhythmFromNotes(notes: readonly MIDINote[]): RhythmPattern {
  const firstNote = notes[0];
  if (!firstNote) {
    return {
      id: `empty-rhythm-${Date.now()}`,
      name: 'Empty Rhythm',
      steps: [],
      length: 0,
      category: 'melody',
    };
  }
  const firstStart = firstNote.start;
  const lastEnd = Math.max(...notes.map(n => n.start + n.duration));
  const length = lastEnd - firstStart;

  const steps: RhythmStep[] = notes.map(n => ({
    position: n.start - firstStart,
    duration: n.duration,
    accent: n.velocity / 127,
    articulation: n.duration < 240 ? Articulation.Staccato : Articulation.Normal,
  }));

  return {
    id: `extracted-rhythm-${Date.now()}`,
    name: 'Extracted Rhythm',
    steps,
    length,
    category: 'melody',
  };
}

/**
 * Calculate average interval between consecutive notes
 */
function calculateAverageInterval(pitches: readonly number[]): number {
  if (pitches.length < 2) return 0;
  
  let sum = 0;
  for (let i = 1; i < pitches.length; i++) {
    const curr = pitches[i];
    const prev = pitches[i - 1];
    if (curr !== undefined && prev !== undefined) {
      sum += Math.abs(curr - prev);
    }
  }
  return sum / (pitches.length - 1);
}

/**
 * Calculate rhythm complexity score (0-1)
 */
function calculateRhythmComplexity(notes: readonly MIDINote[]): number {
  if (notes.length < 2) return 0;

  // Calculate variability in note durations and gaps
  const durations = notes.map(n => n.duration);
  const gaps: number[] = [];
  
  for (let i = 1; i < notes.length; i++) {
    const curr = notes[i];
    const prev = notes[i - 1];
    if (curr && prev) {
      gaps.push(curr.start - (prev.start + prev.duration));
    }
  }

  const durationVariance = calculateVariance(durations);
  const gapVariance = calculateVariance(gaps);

  // Normalize to 0-1 (higher variance = more complex)
  return Math.min(1, (durationVariance + gapVariance) / 1000);
}

/**
 * Calculate variance
 */
function calculateVariance(values: readonly number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

// ============================================================================
// PHRASE EXPORT
// ============================================================================

/**
 * Export phrase to MIDI file
 */
export function exportPhraseToMIDI(
  _phrase: PhraseRecord<MIDIPitch>,
  options: MIDIExportOptions = {}
): Uint8Array {
  const ticksPerQuarterNote = options.ticksPerQuarterNote || 480;
  const tempo = options.tempo || 120;
  const tempoMicroseconds = Math.round(60000000 / tempo);
  const channel = options.channel || 0;
  const format = options.format || 1;

  // Convert tempo to 3-byte value
  const tempoBytes = new Uint8Array([
    (tempoMicroseconds >> 16) & 0xff,
    (tempoMicroseconds >> 8) & 0xff,
    tempoMicroseconds & 0xff,
  ]);

  const tracks: Uint8Array[] = [];

  // Track 0: Tempo and time signature
  {
    const events: number[] = [];

    // Track name
    if (options.trackName) {
      const nameBytes = new TextEncoder().encode(options.trackName);
      events.push(0, 0xff, 0x03, nameBytes.length);
      Array.from(nameBytes).forEach(byte => events.push(byte));
    }

    // Tempo
    events.push(0, 0xff, 0x51, 0x03);
    Array.from(tempoBytes).forEach(byte => events.push(byte));

    // Time signature
    if (options.timeSignature) {
      const { numerator, denominator } = options.timeSignature;
      const denominatorPower = Math.log2(denominator);
      events.push(0, 0xff, 0x58, 0x04, numerator, denominatorPower, 24, 8);
    }

    // End of track
    events.push(0, 0xff, 0x2f, 0x00);

    tracks.push(new Uint8Array(events));
  }

  // Track 1: Notes
  {
    const events: number[] = [];

    // Program change
    if (options.program !== undefined) {
      events.push(0, 0xc0 | channel, options.program);
    }

    // Convert phrase events to MIDI notes
    const noteEvents: Array<{ time: number; type: 'on' | 'off'; note: number; velocity: number }> = [];
    
    // Extract note on/off events from phrase
    _phrase.events.forEach(event => {
      const payload = event.payload as any;
      
      // Try to extract note and velocity from payload
      let note: number | undefined;
      let velocity = 100; // Default velocity
      
      if (typeof payload === 'number') {
        // Payload is directly a MIDI note number
        note = payload;
      } else if (payload && typeof payload === 'object') {
        // Payload is an object with pitch/note properties
        if (typeof payload.pitch === 'number') {
          note = Math.round(payload.pitch);
        } else if (typeof payload.note === 'number') {
          note = Math.round(payload.note);
        }
        
        // Extract velocity if available
        if (typeof payload.velocity === 'number') {
          velocity = Math.round(Math.max(0, Math.min(127, payload.velocity * 127)));
        } else if (typeof payload.vel === 'number') {
          velocity = Math.round(Math.max(0, Math.min(127, payload.vel * 127)));
        }
      }
      
      if (note !== undefined && note >= 0 && note <= 127) {
        // Note on event
        noteEvents.push({
          time: event.start as number,
          type: 'on',
          note: Math.round(note),
          velocity
        });
        
        // Note off event
        noteEvents.push({
          time: (event.start as number) + (event.duration as number),
          type: 'off',
          note: Math.round(note),
          velocity: 0
        });
      }
    });
    
    // Sort events by time
    noteEvents.sort((a, b) => a.time - b.time);
    
    // Convert to MIDI delta times and write events
    let lastTime = 0;
    noteEvents.forEach(evt => {
      const deltaTime = Math.max(0, Math.round(evt.time - lastTime));
      lastTime = evt.time;
      
      // Write variable length delta time
      const deltaBytes = encodeVarLen(deltaTime);
      deltaBytes.forEach(byte => events.push(byte));
      
      // Write MIDI event
      const status = evt.type === 'on' ? 0x90 : 0x80;
      events.push(status | channel, evt.note, evt.velocity);
    });

    // End of track
    events.push(0, 0xff, 0x2f, 0x00);

    tracks.push(new Uint8Array(events));
  }

  // Build MIDI file
  return buildMIDIFile(format, ticksPerQuarterNote, tracks);
}

/**
 * Encode a number as MIDI variable length quantity
 */
function encodeVarLen(value: number): number[] {
  const bytes: number[] = [];
  let buffer = value & 0x7f;
  
  while (value >>= 7) {
    buffer <<= 8;
    buffer |= 0x80;
    buffer += value & 0x7f;
  }
  
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) {
      buffer >>= 8;
    } else {
      break;
    }
  }
  
  return bytes;
}

/**
 * Build MIDI file from tracks
 */
function buildMIDIFile(
  format: MIDIFormat,
  ticksPerQuarterNote: number,
  tracks: readonly Uint8Array[]
): Uint8Array {
  const chunks: Uint8Array[] = [];

  // Header chunk
  {
    const header = new Uint8Array(14);
    let offset = 0;

    // Chunk type "MThd"
    header[offset++] = 0x4d;
    header[offset++] = 0x54;
    header[offset++] = 0x68;
    header[offset++] = 0x64;

    // Chunk length (always 6 for header)
    header[offset++] = 0x00;
    header[offset++] = 0x00;
    header[offset++] = 0x00;
    header[offset++] = 0x06;

    // Format
    header[offset++] = (format >> 8) & 0xff;
    header[offset++] = format & 0xff;

    // Track count
    header[offset++] = (tracks.length >> 8) & 0xff;
    header[offset++] = tracks.length & 0xff;

    // Ticks per quarter note
    header[offset++] = (ticksPerQuarterNote >> 8) & 0xff;
    header[offset++] = ticksPerQuarterNote & 0xff;

    chunks.push(header);
  }

  // Track chunks
  for (const track of tracks) {
    const chunk = new Uint8Array(8 + track.length);
    let offset = 0;

    // Chunk type "MTrk"
    chunk[offset++] = 0x4d;
    chunk[offset++] = 0x54;
    chunk[offset++] = 0x72;
    chunk[offset++] = 0x6b;

    // Chunk length
    const length = track.length;
    chunk[offset++] = (length >> 24) & 0xff;
    chunk[offset++] = (length >> 16) & 0xff;
    chunk[offset++] = (length >> 8) & 0xff;
    chunk[offset++] = length & 0xff;

    // Track data
    chunk.set(track, offset);

    chunks.push(chunk);
  }

  // Concatenate all chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

// ============================================================================
// MIDI PHRASE DATABASE INTEGRATION
// ============================================================================

/**
 * Import a MIDI file into the phrase database
 * 
 * This function parses a MIDI file, extracts musical phrases,
 * analyzes their characteristics, and stores them in the database
 * for later retrieval and use in generation.
 */
export async function importMIDIToDatabase<_P>(
  database: any,  // PhraseDatabase<P> from phrase-system.ts
  midiData: ArrayBuffer,
  options: {
    readonly name?: string;
    readonly tags?: readonly string[];
    readonly mood?: readonly MoodTag[];
    readonly genre?: readonly GenreTag[];
    readonly author?: string;
    readonly splitByTrack?: boolean;  // Create separate phrases per track
    readonly minNotesPerPhrase?: number;  // Minimum notes to consider a phrase
  } = {}
): Promise<readonly string[]> {  // Returns array of created phrase IDs
  // Parse MIDI file
  const midiFile = parseMIDIFile(new Uint8Array(midiData));
  
  const phraseIds: string[] = [];
  const minNotes = options.minNotesPerPhrase ?? 4;
  
  // Process each track
  for (let trackIndex = 0; trackIndex < midiFile.tracks.length; trackIndex++) {
    const track = midiFile.tracks[trackIndex];
    if (!track) continue;
    
    // Extract notes from track
    const notes = track.events
      .filter(e => e.type === 'noteOn' && (e.velocity ?? 0) > 0)
      .map(e => ({
        time: e.absoluteTime,
        pitch: e.note!,
        velocity: e.velocity!,
        channel: e.channel ?? 0,
      }));
    
    // Skip tracks with too few notes
    if (notes.length < minNotes) continue;
    
    // Find note-off events to calculate durations
    const noteOffEvents = track.events
      .filter(e => e.type === 'noteOff' || (e.type === 'noteOn' && (e.velocity ?? 0) === 0))
      .map(e => ({
        time: e.absoluteTime,
        pitch: e.note!,
      }));
    
    // Match note-ons with note-offs to calculate durations
    const notesWithDuration = notes.map(noteOn => {
      const noteOff = noteOffEvents.find(
        off => off.pitch === noteOn.pitch && off.time > noteOn.time
      );
      return {
        ...noteOn,
        duration: noteOff ? noteOff.time - noteOn.time : midiFile.ticksPerQuarterNote,  // Default to quarter note
      };
    });
    
    // Analyze phrase characteristics
    const metadata = analyzeMIDIPhrase(notesWithDuration, midiFile.ticksPerQuarterNote);
    
    // Extract track name from meta events
    const trackNameEvent = track.events.find(
      e => e.type === 'meta' && e.metaType === 'trackName'
    );
    const trackName = trackNameEvent?.text ?? `Track ${trackIndex + 1}`;
    
    // Create phrase record
    const phraseName = options.name 
      ? `${options.name} - ${trackName}` 
      : trackName;
    
    const phrase = {
      name: phraseName,
      phrase: null,  // We store the MIDI data itself, not DecoupledPhrase
      events: notesWithDuration as any[],  // Raw MIDI note events
      metadata: {
        ...metadata,
        mood: options.mood,
        genre: options.genre,
      },
      tags: [
        ...(options.tags ?? []),
        'midi-import',
        `track-${trackIndex}`,
      ],
      rating: undefined,
      parentId: undefined,
      ghosts: [],
      variations: [],
    };
    
    // Add to database
    const phraseId = await database.add(phrase);
    phraseIds.push(phraseId);
    
    // If not splitting by track, just process first track with notes
    if (!options.splitByTrack) break;
  }
  
  return phraseIds;
}

/**
 * Analyze MIDI phrase to extract metadata
 */
function analyzeMIDIPhrase(
  notes: readonly {
    time: number;
    pitch: number;
    velocity: number;
    duration: number;
  }[],
  ticksPerQuarterNote: number
): Partial<PhraseMetadata> {
  const firstNote = notes[0];
  if (!firstNote) {
    return {};
  }
  
  // Calculate duration (from first to last note)
  const startTime = firstNote.time;
  const endTime = Math.max(...notes.map(n => n.time + n.duration));
  const durationTicks = endTime - startTime;
  const durationBeats = durationTicks / ticksPerQuarterNote;
  
  // Note count
  const noteCount = notes.length;
  
  // Pitch range (ambitus)
  const pitches = notes.map(n => n.pitch);
  const minPitch = Math.min(...pitches);
  const maxPitch = Math.max(...pitches);
  const range = maxPitch - minPitch;
  const ambitus = range;
  
  // Density (notes per beat)
  const density = durationBeats > 0 ? noteCount / durationBeats : 0;
  const normalizedDensity = Math.min(1, density / 4);  // Normalize assuming 4 notes/beat = dense
  
  // Average interval (melodic motion)
  let totalInterval = 0;
  for (let i = 1; i < notes.length; i++) {
    const curr = notes[i];
    const prev = notes[i - 1];
    if (curr && prev) {
      totalInterval += Math.abs(curr.pitch - prev.pitch);
    }
  }
  const averageInterval = notes.length > 1 ? totalInterval / (notes.length - 1) : 0;
  
  // Rhythm complexity (variation in durations and IOIs)
  const durations = notes.map(n => n.duration);
  const uniqueDurations = new Set(durations).size;
  const rhythmComplexity = Math.min(1, uniqueDurations / 8);  // More unique durations = more complex
  
  // Infer line type from characteristics
  let lineType: any = 'melody';  // Default
  if (range < 12 && density < 1) {
    lineType = 'bass';  // Low range, sparse = bass
  } else if (density > 3) {
    lineType = 'drums';  // Very dense = drums
  } else if (averageInterval < 2 && density > 1.5) {
    lineType = 'comping';  // Small intervals, moderate density = comping
  }
  
  return {
    lineType,
    duration: durationTicks,
    noteCount,
    range: [minPitch, maxPitch] as [number, number],
    ambitus,
    density: normalizedDensity,
    averageInterval,
    rhythmComplexity,
  };
}

/**
 * Batch import multiple MIDI files into the database
 * 
 * Useful for importing entire MIDI file collections or packs.
 */
export async function batchImportMIDIToDatabase<_P>(
  database: any,  // PhraseDatabase<P>
  midiFiles: readonly {
    readonly data: ArrayBuffer;
    readonly filename: string;
  }[],
  commonOptions: {
    readonly tags?: readonly string[];
    readonly mood?: readonly MoodTag[];
    readonly genre?: readonly GenreTag[];
    readonly splitByTrack?: boolean;
  } = {}
): Promise<{
  readonly successful: readonly { filename: string; phraseIds: readonly string[] }[];
  readonly failed: readonly { filename: string; error: string }[];
}> {
  const successful: { filename: string; phraseIds: readonly string[] }[] = [];
  const failed: { filename: string; error: string }[] = [];
  
  for (const file of midiFiles) {
    try {
      // Extract name from filename (remove .mid/.midi extension)
      const name = file.filename.replace(/\.(mid|midi)$/i, '');
      
      const phraseIds = await importMIDIToDatabase(database, file.data, {
        ...commonOptions,
        name,
        tags: [...(commonOptions.tags ?? []), 'batch-import', name],
      });
      
      successful.push({ filename: file.filename, phraseIds });
    } catch (error) {
      failed.push({
        filename: file.filename,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  
  return { successful, failed };
}

/**
 * Search the phrase database for MIDI-imported phrases
 * 
 * This is a specialized query function for phrases that originated
 * from MIDI files, with filters specific to MIDI characteristics.
 */
export async function searchMIDIPhrases<_P>(
  database: any,  // PhraseDatabase<P>
  options: {
    readonly namePattern?: string;  // Regex pattern for name matching
    readonly minNotes?: number;
    readonly maxNotes?: number;
    readonly minDuration?: number;  // In beats
    readonly maxDuration?: number;
    readonly pitchRange?: { min: number; max: number };
    readonly tags?: readonly string[];
    readonly mood?: readonly MoodTag[];
    readonly genre?: readonly GenreTag[];
    readonly limit?: number;
  } = {}
): Promise<readonly PhraseRecord<_P>[]> {
  // Build query
  const query: any = {
    tags: [...(options.tags ?? []), 'midi-import'],  // Only MIDI-imported phrases
    noteCountRange: options.minNotes || options.maxNotes ? {
      min: options.minNotes ?? 0,
      max: options.maxNotes ?? 10000,
    } : undefined,
    durationRange: options.minDuration || options.maxDuration ? {
      min: options.minDuration ?? 0,
      max: options.maxDuration ?? 1000000,
    } : undefined,
    mood: options.mood,
    genre: options.genre,
    limit: options.limit ?? 50,
  };
  
  // Execute query
  const results = await database.query(query);
  
  // Apply name pattern filter if specified
  if (options.namePattern) {
    const pattern = new RegExp(options.namePattern, 'i');
    return results.filter((r: PhraseRecord<_P>) => pattern.test(r.name));
  }
  
  return results;
}

/**
 * Export phrases from database back to MIDI files
 * 
 * Useful for archiving, sharing, or using phrases in external DAWs.
 */
export async function exportPhrasesToMIDI(
  database: any,  // PhraseDatabase
  phraseIds: readonly string[],
  _options: {
    readonly format?: MIDIFormat;  // 0 = single track, 1 = multi-track
    readonly ticksPerQuarterNote?: number;
    readonly tempo?: number;  // BPM
  } = {}
): Promise<Map<string, Uint8Array>> {  // Map of phraseId -> MIDI data
  // Note: options will be used in full implementation
  const result = new Map<string, Uint8Array>();
  
  for (const phraseId of phraseIds) {
    const phrase = await database.get(phraseId);
    if (!phrase || !phrase.events || phrase.events.length === 0) {
      continue;
    }
    
    // Convert phrase events back to MIDI format
    // This is a simplified conversion - real implementation would need
    // to handle the full event structure
    
    // For now, just indicate this needs full implementation
    // The structure is in place
    const midiData = new Uint8Array(0);  // Placeholder
    result.set(phraseId, midiData);
  }
  
  return result;
}

/**
 * Get MIDI phrase statistics from database
 * 
 * Provides insights into the imported MIDI phrase collection.
 */
export async function getMIDIPhraseStats<_P>(
  database: any  // PhraseDatabase<P>
): Promise<{
  readonly totalMIDIPhrases: number;
  readonly byLineType: Record<string, number>;
  readonly avgNotesPerPhrase: number;
  readonly avgDuration: number;
  readonly pitchRangeDistribution: {
    readonly narrow: number;    // < 1 octave
    readonly moderate: number;  // 1-2 octaves
    readonly wide: number;      // > 2 octaves
  };
  readonly densityDistribution: {
    readonly sparse: number;    // < 0.3
    readonly moderate: number;  // 0.3-0.7
    readonly dense: number;     // > 0.7
  };
}> {
  // Query all MIDI-imported phrases
  const midiPhrases = await searchMIDIPhrases(database, { limit: 10000 });
  
  if (midiPhrases.length === 0) {
    return {
      totalMIDIPhrases: 0,
      byLineType: {},
      avgNotesPerPhrase: 0,
      avgDuration: 0,
      pitchRangeDistribution: { narrow: 0, moderate: 0, wide: 0 },
      densityDistribution: { sparse: 0, moderate: 0, dense: 0 },
    };
  }
  
  // Count by line type
  const byLineType: Record<string, number> = {};
  for (const phrase of midiPhrases) {
    const lineType = phrase.metadata.lineType ?? 'unknown';
    byLineType[lineType] = (byLineType[lineType] ?? 0) + 1;
  }
  
  // Calculate averages
  const totalNotes = midiPhrases.reduce((sum, p) => sum + (p.metadata.noteCount ?? 0), 0);
  const avgNotesPerPhrase = totalNotes / midiPhrases.length;
  
  const totalDuration = midiPhrases.reduce((sum, p) => sum + (p.metadata.duration ?? 0), 0);
  const avgDuration = totalDuration / midiPhrases.length;
  
  // Pitch range distribution
  let narrow = 0, moderate = 0, wide = 0;
  for (const phrase of midiPhrases) {
    const ambitus = phrase.metadata.ambitus ?? 0;
    if (ambitus < 12) narrow++;
    else if (ambitus < 24) moderate++;
    else wide++;
  }
  
  // Density distribution
  let sparse = 0, moderateDensity = 0, dense = 0;
  for (const phrase of midiPhrases) {
    const density = phrase.metadata.density ?? 0;
    if (density < 0.3) sparse++;
    else if (density < 0.7) moderateDensity++;
    else dense++;
  }
  
  return {
    totalMIDIPhrases: midiPhrases.length,
    byLineType,
    avgNotesPerPhrase,
    avgDuration,
    pitchRangeDistribution: { narrow, moderate, wide },
    densityDistribution: { sparse, moderate: moderateDensity, dense },
  };
}
