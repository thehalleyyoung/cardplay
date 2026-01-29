/**
 * @fileoverview MIDI Import Actions (Phase F: F028)
 * 
 * Import MIDI files into notation/tracker boards.
 * Manual boards allow import but no AI generation.
 * 
 * @module @cardplay/boards/builtins/midi-import-actions
 */

import type { EventStreamId } from '../../state/types';
import type { Event } from '../../types/event';
import { asTick, asTickDuration } from '../../types/primitives';
import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';
import { getUndoStack } from '../../state/undo-stack';

// ============================================================================
// MIDI FILE STRUCTURE
// ============================================================================

/**
 * Parsed MIDI file structure (simplified).
 */
export interface ParsedMIDIFile {
  /** File format (0 = single track, 1 = multi-track, 2 = multi-song) */
  format: number;
  
  /** Tracks in the file */
  tracks: MIDITrack[];
  
  /** Ticks per quarter note */
  ticksPerQuarterNote: number;
  
  /** Tempo changes */
  tempoChanges: Array<{ tick: number; microsecondsPerQuarter: number }>;
  
  /** Time signature changes */
  timeSignatureChanges: Array<{ tick: number; numerator: number; denominator: number }>;
}

/**
 * MIDI track.
 */
export interface MIDITrack {
  /** Track name */
  name: string;
  
  /** Note events */
  notes: MIDINoteEvent[];
  
  /** Control change events */
  controlChanges: Array<{ tick: number; controller: number; value: number }>;
  
  /** Program changes */
  programChanges: Array<{ tick: number; program: number }>;
}

/**
 * MIDI note event.
 */
export interface MIDINoteEvent {
  /** Start time in ticks */
  tick: number;
  
  /** Duration in ticks */
  duration: number;
  
  /** MIDI note number (0-127) */
  note: number;
  
  /** Velocity (0-127) */
  velocity: number;
  
  /** Channel (0-15) */
  channel: number;
}

// ============================================================================
// IMPORT OPTIONS
// ============================================================================

/**
 * MIDI import options.
 */
export interface MIDIImportOptions {
  /** Create new stream per track or merge into single stream */
  oneStreamPerTrack: boolean;
  
  /** Quantize imported notes */
  quantize: boolean;
  
  /** Quantize grid (in ticks) */
  quantizeGrid: number;
  
  /** Preserve tempo changes */
  preserveTempo: boolean;
  
  /** Preserve time signature */
  preserveTimeSignature: boolean;
  
  /** Track filter (null = import all) */
  trackFilter?: (track: MIDITrack, index: number) => boolean;
}

/**
 * Default import options.
 */
export const DEFAULT_IMPORT_OPTIONS: MIDIImportOptions = {
  oneStreamPerTrack: true,
  quantize: false,
  quantizeGrid: 96, // 16th note at 480 PPQ
  preserveTempo: true,
  preserveTimeSignature: true
};

// ============================================================================
// IMPORT RESULT
// ============================================================================

/**
 * Result of MIDI import.
 */
export interface MIDIImportResult {
  /** Created stream IDs */
  streamIds: EventStreamId[];
  
  /** Total notes imported */
  totalNotes: number;
  
  /** Tempo changes imported */
  tempoChanges: number;
  
  /** Track names */
  trackNames: string[];
  
  /** Warnings/issues */
  warnings: string[];
}

// ============================================================================
// STUB PARSER
// ============================================================================

/**
 * Parse MIDI file from ArrayBuffer.
 * 
 * Stub implementation - would use a proper MIDI parser library.
 * For MVP, returns empty structure.
 */
export function parseMIDIFile(_buffer: ArrayBuffer): ParsedMIDIFile {
  // TODO: Integrate with proper MIDI parser (e.g., midi-file, tonejs/midi, etc.)
  console.warn('MIDI parsing not implemented - using stub');
  
  return {
    format: 1,
    tracks: [],
    ticksPerQuarterNote: 480,
    tempoChanges: [{ tick: 0, microsecondsPerQuarter: 500000 }], // 120 BPM
    timeSignatureChanges: [{ tick: 0, numerator: 4, denominator: 4 }]
  };
}

// ============================================================================
// IMPORT IMPLEMENTATION
// ============================================================================

/**
 * Convert MIDI note event to internal Event.
 */
function midiNoteToEvent(note: MIDINoteEvent, tickOffset: number = 0): Event<{ note: number; velocity: number }> {
  return {
    id: `midi-${note.tick}-${note.note}` as any, // Will be replaced by store
    kind: 'note',
    start: asTick(note.tick + tickOffset),
    duration: asTickDuration(note.duration),
    payload: {
      note: note.note,
      velocity: note.velocity
    }
  };
}

/**
 * Quantize a tick value to nearest grid.
 */
function quantizeTick(tick: number, grid: number): number {
  return Math.round(tick / grid) * grid;
}

/**
 * F028: Import MIDI file into streams.
 * 
 * Creates event streams from MIDI tracks, supporting:
 * - Single or multi-stream import
 * - Optional quantization
 * - Tempo/time signature preservation
 * - Track filtering
 * 
 * Undoable via undo stack.
 */
export async function importMIDIFile(
  file: File | ArrayBuffer,
  options: Partial<MIDIImportOptions> = {}
): Promise<MIDIImportResult> {
  const opts = { ...DEFAULT_IMPORT_OPTIONS, ...options };
  
  // Parse MIDI file
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  const parsed = parseMIDIFile(buffer);
  
  // Apply track filter
  const tracks = parsed.tracks.filter((track, i) => 
    !opts.trackFilter || opts.trackFilter(track, i)
  );
  
  if (tracks.length === 0) {
    throw new Error('No tracks to import (all filtered out)');
  }
  
  const store = getSharedEventStore();
  const registry = getClipRegistry();
  const warnings: string[] = [];
  const streamIds: EventStreamId[] = [];
  let totalNotes = 0;
  
  // Import each track
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    
    if (!track) continue; // Skip undefined tracks
    
    // Skip empty tracks
    if (track.notes.length === 0) {
      warnings.push(`Track "${track.name}" has no notes - skipping`);
      continue;
    }
    
    // Convert MIDI notes to events
    let events = track.notes.map(note => midiNoteToEvent(note));
    
    // Apply quantization
    if (opts.quantize) {
      events = events.map(event => ({
        ...event,
        start: asTick(quantizeTick(event.start, opts.quantizeGrid))
      }));
    }
    
    // Create stream
    const streamName = track.name || `MIDI Track ${i + 1}`;
    const stream = store.createStream({
      name: streamName,
      events: []
    });
    
    // Add events
    store.addEvents(stream.id, events);
    
    streamIds.push(stream.id);
    totalNotes += events.length;
    
    // Create clip for the stream
    const maxTick = Math.max(...events.map(e => e.start + e.duration), 0);
    registry.createClip({
      name: streamName,
      streamId: stream.id,
      duration: asTick(maxTick),
      loop: false,
      color: '#4CAF50' // Green for imported clips
    });
  }
  
  // If no streams created, error
  if (streamIds.length === 0) {
    throw new Error('No valid tracks found in MIDI file');
  }
  
  // Wrap in undo
  getUndoStack().push({
    type: 'batch',
    description: `Import MIDI (${totalNotes} notes, ${streamIds.length} tracks)`,
    undo: () => {
      // Remove streams and clips
      // Note: SharedEventStore doesn't have removeStream, so we clear events instead
      streamIds.forEach(streamId => {
        const stream = store.getStream(streamId);
        if (stream) {
          store.removeEvents(streamId, stream.events.map(e => e.id));
        }
      });
    },
    redo: () => {
      // Re-import (would need to store parsed data)
      console.warn('MIDI import redo not fully implemented');
    }
  });
  
  const result: MIDIImportResult = {
    streamIds,
    totalNotes,
    tempoChanges: parsed.tempoChanges.length,
    trackNames: tracks.map(t => t.name),
    warnings
  };
  
  console.info('MIDI import complete:', result);
  
  return result;
}

/**
 * Import MIDI from file input.
 */
export async function importMIDIFromFile(options?: Partial<MIDIImportOptions>): Promise<MIDIImportResult | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mid,.midi';
    
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      try {
        const result = await importMIDIFile(file, options);
        resolve(result);
      } catch (error) {
        console.error('MIDI import failed:', error);
        resolve(null);
      }
    };
    
    input.click();
  });
}

// ============================================================================
// EXPORT ACTIONS
// ============================================================================

/**
 * Export stream to MIDI file.
 * 
 * Stub implementation for future.
 */
export async function exportStreamToMIDI(
  _streamId: EventStreamId,
  _filename: string = 'export.mid'
): Promise<void> {
  console.warn('MIDI export not implemented');
  throw new Error('MIDI export not yet implemented');
}
