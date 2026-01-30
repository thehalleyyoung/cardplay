/**
 * @fileoverview MusicXML import and export.
 * 
 * Supports reading and writing MusicXML format for interoperability
 * with Finale, Sibelius, MuseScore, Dorico, and other notation software.
 * 
 * @module @cardplay/core/notation/musicxml
 */

import { EventKinds, asEventId, asTick, asTickDuration, PPQ } from '../types';
import type { NoteEvent, MIDIPitch } from '../voices';
import { createMIDIPitch } from '../voices';
import type { KeySignature, TimeSignature, NoteName } from './types.js';

// ============================================================================
// MUSICXML TYPES
// ============================================================================

/**
 * MusicXML score document structure.
 */
export interface MusicXMLScore {
  readonly version: string;
  readonly title?: string;
  readonly composer?: string;
  readonly parts: ReadonlyArray<MusicXMLPart>;
}

/**
 * MusicXML part (instrument/voice).
 */
export interface MusicXMLPart {
  readonly id: string;
  readonly name: string;
  readonly measures: ReadonlyArray<MusicXMLMeasure>;
}

/**
 * MusicXML measure.
 */
export interface MusicXMLMeasure {
  readonly number: number;
  readonly attributes?: MusicXMLAttributes;
  readonly notes: ReadonlyArray<MusicXMLNote>;
  readonly barline?: MusicXMLBarline;
}

/**
 * MusicXML attributes (key, time, clef at start of measure).
 */
export interface MusicXMLAttributes {
  readonly key?: KeySignature;
  readonly time?: TimeSignature;
  readonly clef?: string;
  readonly divisions?: number; // Ticks per quarter note
}

/**
 * MusicXML note.
 */
export interface MusicXMLNote {
  readonly pitch?: { step: string; octave: number; alter?: number };
  readonly rest?: boolean;
  readonly duration: number; // In divisions
  readonly type?: string; // 'whole', 'half', 'quarter', etc.
  readonly dot?: boolean;
  readonly accidental?: string;
  readonly tie?: 'start' | 'stop';
  readonly chord?: boolean; // True if part of chord
}

/**
 * MusicXML barline.
 */
export interface MusicXMLBarline {
  readonly location: 'left' | 'right';
  readonly barStyle?: 'regular' | 'dotted' | 'dashed' | 'heavy' | 'light-light' | 'light-heavy' | 'heavy-light' | 'heavy-heavy';
  readonly repeat?: 'forward' | 'backward';
}

// ============================================================================
// EXPORT TO MUSICXML
// ============================================================================

/**
 * Convert events to MusicXML.
 */
export function exportToMusicXML(
  events: ReadonlyArray<NoteEvent<MIDIPitch>>,
  options: {
    title?: string;
    composer?: string;
    key?: KeySignature;
    time?: TimeSignature;
    divisions?: number;
  } = {}
): string {
  const divisions = options.divisions || 480; // Standard MIDI resolution
  const title = options.title || 'Untitled';
  const composer = options.composer || '';
  
  // Group events by part (for now, single part)
  const measures = groupEventsIntoMeasures(events, divisions, options.time);
  
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <movement-title>${escapeXML(title)}</movement-title>
  <identification>
    <creator type="composer">${escapeXML(composer)}</creator>
    <encoding>
      <software>CardPlay</software>
      <encoding-date>${new Date().toISOString().split('T')[0]}</encoding-date>
    </encoding>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
${measures.map((measure, index) => formatMeasure(measure, index + 1, options)).join('\n')}
  </part>
</score-partwise>`;
  
  return xml;
}

/**
 * Group events into measures based on time signature.
 */
function groupEventsIntoMeasures(
  events: ReadonlyArray<NoteEvent<MIDIPitch>>,
  _divisions: number,
  timeSignature?: TimeSignature
): ReadonlyArray<ReadonlyArray<NoteEvent<MIDIPitch>>> {
  const measures: Array<Array<NoteEvent<MIDIPitch>>> = [];
  const ticksPerMeasure = timeSignature
    ? (_divisions * 4 * timeSignature.numerator) / timeSignature.denominator
    : _divisions * 4; // Default to 4/4
  
  let currentMeasure: Array<NoteEvent<MIDIPitch>> = [];
  let measureStartTick = 0;
  
  for (const event of events) {
    if (event.start >= measureStartTick + ticksPerMeasure) {
      // Start new measure
      measures.push(currentMeasure);
      currentMeasure = [];
      measureStartTick += ticksPerMeasure;
    }
    currentMeasure.push(event);
  }
  
  if (currentMeasure.length > 0) {
    measures.push(currentMeasure);
  }
  
  return measures;
}

/**
 * Format a single measure as MusicXML.
 */
function formatMeasure(
  events: ReadonlyArray<NoteEvent<MIDIPitch>>,
  measureNumber: number,
  options: {
    key?: KeySignature;
    time?: TimeSignature;
  }
): string {
  const includeAttributes = measureNumber === 1;
  const _divisions = PPQ;
  
  let xml = `    <measure number="${measureNumber}">`;
  
  if (includeAttributes) {
    xml += `
      <attributes>
        <divisions>${_divisions}</divisions>`;
    
    if (options.key) {
      xml += `
        <key>
          <fifths>${options.key.accidentals}</fifths>
          <mode>${options.key.mode}</mode>
        </key>`;
    }
    
    if (options.time) {
      xml += `
        <time>
          <beats>${options.time.numerator}</beats>
          <beat-type>${options.time.denominator}</beat-type>
        </time>`;
    }
    
    xml += `
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>`;
  }
  
  // Format notes
  for (const event of events) {
    xml += formatNote(event, _divisions);
  }
  
  xml += `
    </measure>`;
  
  return xml;
}

/**
 * Format a single note as MusicXML.
 */
function formatNote(event: NoteEvent<MIDIPitch>, _divisions: number): string {
  const pitch = event.payload.pitch as unknown as number; // MIDIPitch is a branded number
  const duration = event.duration;
  
  const pitchClass = pitch % 12;
  const octave = Math.floor(pitch / 12) - 1;
  const stepNames = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
  const alterations = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
  
  const step = stepNames[pitchClass];
  const alter = alterations[pitchClass];
  
  return `
      <note>
        <pitch>
          <step>${step}</step>
          ${alter !== 0 ? `<alter>${alter}</alter>` : ''}
          <octave>${octave}</octave>
        </pitch>
        <duration>${duration}</duration>
        <type>quarter</type>
      </note>`;
}

/**
 * Escape XML special characters.
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================================================
// IMPORT FROM MUSICXML
// ============================================================================

/**
 * Parse MusicXML string and convert to events.
 */
export function importFromMusicXML(xmlString: string): {
  events: ReadonlyArray<NoteEvent<MIDIPitch>>;
  key?: KeySignature;
  time?: TimeSignature;
  title?: string;
  composer?: string;
} {
  // Parse XML
  const ParserClass = getDOMParser();
  const parser = new ParserClass();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  
  // Extract metadata
  const titleElement = doc.querySelector('movement-title');
  const composerElement = doc.querySelector('creator[type="composer"]');
  
  const title = titleElement?.textContent || undefined;
  const composer = composerElement?.textContent || undefined;
  
  // Extract parts
  const partElements = doc.querySelectorAll('part');
  const allEvents: Array<NoteEvent<MIDIPitch>> = [];
  let key: KeySignature | undefined;
  let time: TimeSignature | undefined;
  
  partElements.forEach((partElement) => {
    const measureElements = partElement.querySelectorAll('measure');
    let currentTick = 0;
    
    measureElements.forEach((measureElement) => {
      // Extract attributes
      const attributesElement = measureElement.querySelector('attributes');
      if (attributesElement) {
        const keyElement = attributesElement.querySelector('key');
        if (keyElement) {
          const fifths = parseInt(keyElement.querySelector('fifths')?.textContent || '0', 10);
          const mode = keyElement.querySelector('mode')?.textContent as 'major' | 'minor' || 'major';
          key = { root: 'C', mode, accidentals: fifths };
        }
        
        const timeElement = attributesElement.querySelector('time');
        if (timeElement) {
          const beats = parseInt(timeElement.querySelector('beats')?.textContent || '4', 10);
          const beatType = parseInt(timeElement.querySelector('beat-type')?.textContent || '4', 10);
          time = { numerator: beats, denominator: beatType };
        }
      }
      
      // Extract notes
      const noteElements = measureElement.querySelectorAll('note');
      noteElements.forEach((noteElement) => {
        const pitchElement = noteElement.querySelector('pitch');
        if (pitchElement) {
          const step = pitchElement.querySelector('step')?.textContent || 'C';
          const octave = parseInt(pitchElement.querySelector('octave')?.textContent || '4', 10);
          const alter = parseInt(pitchElement.querySelector('alter')?.textContent || '0', 10);
          
          const duration = parseInt(noteElement.querySelector('duration')?.textContent || '480', 10);
          
          // Convert step + octave + alter to MIDI note
          const stepToPC: Record<string, number> = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
          const pc = stepToPC[step];
          if (pc !== undefined) {
            const pitchClass = (pc + alter) % 12;
            const midiNoteNumber = (octave + 1) * 12 + pitchClass;
            
            const event: NoteEvent<MIDIPitch> = {
              id: asEventId(`note-${currentTick}`),
              kind: EventKinds.NOTE,
              start: asTick(currentTick),
              duration: asTickDuration(duration),
              payload: {
                pitch: createMIDIPitch(midiNoteNumber),
                velocity: 64,
                channel: 0,
              },
            };
            
            allEvents.push(event);
          }
          currentTick += duration;
        }
      });
    });
  });
  
  return { 
    events: allEvents, 
    ...(key !== undefined && { key }),
    ...(time !== undefined && { time }),
    ...(title !== undefined && { title }),
    ...(composer !== undefined && { composer }),
  };
}

/**
 * Get DOMParser (browser native or Node.js polyfill).
 */
function getDOMParser(): typeof DOMParser {
  // In browser, use native DOMParser
  if (typeof window !== 'undefined' && window.DOMParser) {
    return window.DOMParser;
  }
  
  // In Node.js, provide a minimal stub
  // In production, would use jsdom or xmldom
  class NodeDOMParser {
    parseFromString(_xmlString: string, _mimeType: string): Document {
      return {
        querySelector: () => null,
        querySelectorAll: () => [],
      } as any;
    }
  }
  
  return NodeDOMParser as any;
}

// ============================================================================
// MIDI IMPORT TO NOTATION
// ============================================================================

/**
 * Import MIDI file to notation events.
 * Converts MIDI note events to notation-ready format with quantization.
 */
export function importFromMIDI(
  midiEvents: ReadonlyArray<NoteEvent<MIDIPitch>>,
  options: {
    quantize?: number; // Quantize grid in ticks (e.g., 120 = 16th notes at 480 ppq)
    key?: KeySignature;
    time?: TimeSignature;
  } = {}
): {
  events: ReadonlyArray<NoteEvent<MIDIPitch>>;
  key?: KeySignature;
  time?: TimeSignature;
} {
  const quantizeGrid = options.quantize || 0;
  
  // Quantize events if requested
  const quantizedEvents = quantizeGrid > 0
    ? midiEvents.map(event => quantizeEvent(event, quantizeGrid))
    : midiEvents;
  
  // Sort by start time
  const sortedEvents = [...quantizedEvents].sort((a, b) => a.start - b.start);
  
  const result: {
    events: ReadonlyArray<NoteEvent<MIDIPitch>>;
    key?: KeySignature;
    time?: TimeSignature;
  } = {
    events: sortedEvents,
  };
  
  if (options.key) {
    result.key = options.key;
  }
  if (options.time) {
    result.time = options.time;
  }
  
  return result;
}

/**
 * Quantize a single event to grid.
 */
function quantizeEvent(
  event: NoteEvent<MIDIPitch>,
  grid: number
): NoteEvent<MIDIPitch> {
  const quantizedStart = Math.round(event.start / grid) * grid;
  const quantizedDuration = Math.max(grid, Math.round(event.duration / grid) * grid);
  
  return {
    ...event,
    start: asTick(quantizedStart),
    duration: asTickDuration(quantizedDuration),
  };
}

/**
 * Detect time signature from MIDI events.
 * Analyzes note groupings to suggest likely time signature.
 */
export function detectTimeSignature(
  events: ReadonlyArray<NoteEvent<MIDIPitch>>,
  ppq: number = PPQ
): TimeSignature {
  if (events.length === 0) {
    return { numerator: 4, denominator: 4 }; // Default
  }
  
  // Analyze beat patterns in first few measures
  const quarterNoteTicks = ppq;
  const lastEvent = events[events.length - 1];
  const maxTick = lastEvent 
    ? Math.min(lastEvent.start + lastEvent.duration, quarterNoteTicks * 16)
    : quarterNoteTicks * 16;
  
  // Count note onsets per beat
  const beatsPerMeasure = [3, 4, 5, 6, 7]; // Common time signatures
  let bestMatch = 4;
  let bestScore = 0;
  
  for (const beats of beatsPerMeasure) {
    const score = scoreTimeSignature(events, quarterNoteTicks, beats, maxTick);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = beats;
    }
  }
  
  return { numerator: bestMatch, denominator: 4 };
}

/**
 * Score how well events fit a given time signature.
 */
function scoreTimeSignature(
  events: ReadonlyArray<NoteEvent<MIDIPitch>>,
  quarterNoteTicks: number,
  beatsPerMeasure: number,
  maxTick: number
): number {
  const measureLength = quarterNoteTicks * beatsPerMeasure;
  let score = 0;
  
  // Count how many notes start on beat 1 of measures
  for (const event of events) {
    if (event.start >= maxTick) break;
    
    const positionInMeasure = event.start % measureLength;
    if (positionInMeasure === 0) {
      score += 2; // Strong beat
    } else if (positionInMeasure % quarterNoteTicks === 0) {
      score += 1; // Beat
    }
  }
  
  return score;
}

/**
 * Detect key signature from MIDI events.
 * Uses pitch class distribution to estimate key.
 */
export function detectKeySignature(
  events: ReadonlyArray<NoteEvent<MIDIPitch>>
): KeySignature {
  if (events.length === 0) {
    return { root: 'C', mode: 'major', accidentals: 0 };
  }
  
  // Count pitch class occurrences
  const pitchClassCounts = new Array(12).fill(0);
  for (const event of events) {
    const pitch = event.payload.pitch as unknown as number;
    const pitchClass = pitch % 12;
    pitchClassCounts[pitchClass]++;
  }
  
  // Find most common pitch class (likely tonic)
  let maxCount = 0;
  let tonicPC = 0;
  for (let pc = 0; pc < 12; pc++) {
    const count = pitchClassCounts[pc];
    if (count !== undefined && count > maxCount) {
      maxCount = count;
      tonicPC = pc;
    }
  }
  
  // Map pitch class to note name
  const noteNames: NoteName[] = ['C', 'C', 'D', 'E', 'E', 'F', 'F', 'G', 'A', 'A', 'B', 'B'];
  const root = noteNames[tonicPC] || 'C';
  
  // Determine mode (simplified: check for presence of major/minor third)
  const majorThird = (tonicPC + 4) % 12;
  const minorThird = (tonicPC + 3) % 12;
  const majorCount = pitchClassCounts[majorThird] || 0;
  const minorCount = pitchClassCounts[minorThird] || 0;
  const mode = majorCount >= minorCount ? 'major' : 'minor';
  
  // Calculate accidentals (fifths in circle of fifths)
  const accidentalsMap: Record<NoteName, number> = {
    'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5,
    'F': -1,
  };
  const accidentals = accidentalsMap[root] || 0;
  
  return { root, mode, accidentals };
}
