/**
 * @fileoverview Notation Harmony Overlay (G103-G106)
 * 
 * Provides non-destructive harmony visualization in notation view:
 * - Chord tone highlighting
 * - Snap selection to chord tones helper
 * - Reharmonization suggestions
 * 
 * All operations are view-layer only or undoable via UndoStack.
 * 
 * @module @cardplay/notation/harmony-overlay
 */

import type { HarmonyContext } from '../boards/harmony/coloring';
import { classifyNote } from '../boards/harmony/coloring';
import type { Event } from '../types/event';
import type { EventId } from '../types/event-id';

/**
 * Note payload type for MIDI notes
 */
interface NotePayload {
  note?: number;
  pitch?: number;
  velocity?: number;
}

/**
 * Note event type
 */
type NoteEvent = Event<NotePayload>;

/**
 * Harmony overlay settings for notation
 */
export interface NotationHarmonySettings {
  /** Enable chord tone highlighting */
  showChordTones: boolean;
  
  /** Highlight opacity (0-1) */
  highlightOpacity: number;
  
  /** Show chord symbol annotations */
  showChordSymbols: boolean;
}

/**
 * Default harmony overlay settings
 */
export const DEFAULT_NOTATION_HARMONY_SETTINGS: NotationHarmonySettings = {
  showChordTones: true,
  highlightOpacity: 0.25,
  showChordSymbols: true
};

/**
 * SVG overlay element for chord tone highlighting
 */
export interface ChordToneOverlay {
  /** Note head element to highlight */
  noteHeadElement: SVGElement;
  
  /** Highlight class (chord-tone/scale-tone/out-of-key) */
  noteClass: 'chord-tone' | 'scale-tone' | 'out-of-key';
  
  /** Overlay rect element */
  overlayElement: SVGRectElement;
}

/**
 * Apply chord tone highlighting to notation SVG (G103)
 * 
 * Creates non-destructive overlay rectangles around note heads
 * based on harmony classification.
 * 
 * @param svgContainer SVG element containing notation
 * @param events Events to analyze
 * @param context Current harmony context
 * @param settings Overlay settings
 * @returns Array of created overlay elements (for cleanup)
 */
export function applyChordToneHighlights(
  svgContainer: SVGSVGElement,
  _events: NoteEvent[], // Parameter reserved for future use
  context: HarmonyContext,
  settings: NotationHarmonySettings = DEFAULT_NOTATION_HARMONY_SETTINGS
): ChordToneOverlay[] {
  if (!settings.showChordTones) return [];
  
  const overlays: ChordToneOverlay[] = [];
  
  // Find all note head elements in the SVG
  const noteHeads = svgContainer.querySelectorAll('[data-note-name]');
  
  noteHeads.forEach(noteHead => {
    const noteName = noteHead.getAttribute('data-note-name');
    if (!noteName) return;
    
    // Classify note based on harmony context
    const noteClass = classifyNote(noteName, context);
    
    // Get bounding box of note head
    const bbox = (noteHead as SVGGraphicsElement).getBBox();
    
    // Create highlight overlay rectangle
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    overlay.setAttribute('x', String(bbox.x - 2));
    overlay.setAttribute('y', String(bbox.y - 2));
    overlay.setAttribute('width', String(bbox.width + 4));
    overlay.setAttribute('height', String(bbox.height + 4));
    overlay.setAttribute('rx', '3');
    overlay.setAttribute('class', `harmony-overlay harmony-overlay--${noteClass}`);
    overlay.setAttribute('opacity', String(settings.highlightOpacity));
    
    // Set fill color based on classification
    const colors = {
      'chord-tone': 'rgba(66, 165, 245, 1)',    // Blue for chord tones
      'scale-tone': 'rgba(76, 175, 80, 1)',     // Green for scale tones
      'out-of-key': 'rgba(255, 152, 0, 1)'      // Orange for chromatic
    };
    overlay.setAttribute('fill', colors[noteClass]);
    overlay.setAttribute('pointer-events', 'none'); // Don't interfere with selection
    
    // Insert overlay behind note head
    noteHead.parentNode?.insertBefore(overlay, noteHead);
    
    overlays.push({
      noteHeadElement: noteHead as SVGElement,
      noteClass,
      overlayElement: overlay
    });
  });
  
  return overlays;
}

/**
 * Remove all harmony overlays from notation SVG
 * 
 * @param svgContainer SVG element containing notation
 */
export function removeChordToneHighlights(svgContainer: SVGSVGElement): void {
  const overlays = svgContainer.querySelectorAll('.harmony-overlay');
  overlays.forEach(overlay => overlay.remove());
}

/**
 * Snap selected events to chord tones (G104)
 * 
 * Adjusts pitch of selected notes to nearest chord tone while
 * preserving rhythm and articulation.
 * 
 * Returns undo action that can be pushed to UndoStack.
 * 
 * @param selectedEvents Events to snap
 * @param context Harmony context
 * @returns Undo/redo actions
 */
export function snapSelectionToChordTones(
  selectedEvents: NoteEvent[],
  context: HarmonyContext
): {
  undo: () => void;
  redo: () => void;
  description: string;
} {
  // Store original pitches for undo
  const originalPitches = new Map<EventId, number>();
  
  selectedEvents.forEach(event => {
    if (event.kind === 'note') {
      const note = event.payload.note ?? event.payload.pitch;
      if (note !== undefined) {
        originalPitches.set(event.id, note);
      }
    }
  });
  
  // Get chord tone semitones
  const chordTones = getChordToneSemitones(context.chord);
  
  // Snap each note to nearest chord tone
  const snappedEvents = selectedEvents.map(event => {
    if (event.kind !== 'note') {
      return event;
    }
    
    const originalPitch = event.payload.note ?? event.payload.pitch;
    if (originalPitch === undefined) return event;
    const pitchClass = originalPitch % 12;
    const octave = Math.floor(originalPitch / 12);
    
    // Find nearest chord tone
    let nearestChordTone = pitchClass;
    let minDistance = 12;
    
    chordTones.forEach(chordTone => {
      const distance = Math.abs(pitchClass - chordTone);
      if (distance < minDistance) {
        minDistance = distance;
        nearestChordTone = chordTone;
      }
    });
    
    const snappedPitch = octave * 12 + nearestChordTone;
    
    return {
      ...event,
      payload: {
        ...event.payload,
        note: snappedPitch,
        pitch: snappedPitch
      }
    };
  });
  
  return {
    undo: () => {
      selectedEvents.forEach(event => {
        const originalPitch = originalPitches.get(event.id);
        if (originalPitch !== undefined) {
          if (event.payload.note !== undefined) {
            event.payload.note = originalPitch;
          }
          if (event.payload.pitch !== undefined) {
            event.payload.pitch = originalPitch;
          }
        }
      });
    },
    redo: () => {
      selectedEvents.forEach((event, i) => {
        if (event.kind === 'note') {
          const snapped = snappedEvents[i];
          if (snapped) {
            const snappedPitch = snapped.payload.note ?? snapped.payload.pitch;
            if (snappedPitch !== undefined) {
              if (event.payload.note !== undefined) {
                event.payload.note = snappedPitch;
              }
              if (event.payload.pitch !== undefined) {
                event.payload.pitch = snappedPitch;
              }
            }
          }
        }
      });
    },
    description: `Snap ${selectedEvents.length} notes to chord tones (${context.chord})`
  };
}

/**
 * Get chord tone semitones for a chord symbol
 */
function getChordToneSemitones(chord: string): number[] {
  const match = chord.match(/^([A-G][b#]?)(.*)?$/);
  if (!match || !match[1]) return [0, 4, 7]; // Default to C major
  
  const rootMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
  };
  
  const root = rootMap[match[1]] ?? 0;
  const quality = match[2] || '';
  
  // Chord quality to intervals
  const qualities: Record<string, number[]> = {
    '': [0, 4, 7],           // major
    'm': [0, 3, 7],          // minor
    '7': [0, 4, 7, 10],      // dominant 7
    'maj7': [0, 4, 7, 11],   // major 7
    'm7': [0, 3, 7, 10],     // minor 7
    'dim': [0, 3, 6],        // diminished
    'aug': [0, 4, 8],        // augmented
  };
  
  const intervals = qualities[quality] ?? qualities['']!;
  return intervals.map(interval => (root + interval) % 12);
}

/**
 * Chord suggestion for reharmonization
 */
export interface ChordSuggestion {
  /** Suggested chord symbol */
  chord: string;
  
  /** Reason for suggestion */
  reason: string;
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Voice leading smoothness (0-1, higher is smoother) */
  voiceLeading: number;
}

/**
 * Suggest alternate chord symbols for reharmonization (G106)
 * 
 * Analyzes selected notes and suggests compatible chord progressions
 * without auto-applying them.
 * 
 * @param events Events to analyze for reharmonization
 * @param currentContext Current harmony context
 * @returns Array of chord suggestions
 */
export function suggestReharmonization(
  events: NoteEvent[],
  currentContext: HarmonyContext
): ChordSuggestion[] {
  const suggestions: ChordSuggestion[] = [];
  
  // Extract pitch classes from events
  const pitchClasses = new Set<number>();
  events.forEach(event => {
    if (event.kind === 'note') {
      const note = event.payload.note ?? event.payload.pitch;
      if (note !== undefined) {
        pitchClasses.add(note % 12);
      }
    }
  });
  
  if (pitchClasses.size === 0) return suggestions;
  
  // Common chord progressions in the current key
  const key = currentContext.key;
  const isMinor = key.endsWith('m');
  const keyRoot = key.replace('m', '');
  
  // Diatonic chord options
  const diatonicChords = isMinor
    ? [`${keyRoot}m`, `${keyRoot}m7`, `${getRelativeMajor(keyRoot)}`, `${getRelativeMajor(keyRoot)}maj7`]
    : [`${keyRoot}`, `${keyRoot}maj7`, `${getRelativeMinor(keyRoot)}m`, `${getRelativeMinor(keyRoot)}m7`];
  
  // Analyze each potential chord
  diatonicChords.forEach(chord => {
    const chordTones = new Set(getChordToneSemitones(chord));
    
    // Count how many notes fit this chord
    let matchingNotes = 0;
    pitchClasses.forEach(pc => {
      if (chordTones.has(pc)) matchingNotes++;
    });
    
    const confidence = matchingNotes / pitchClasses.size;
    
    // Only suggest if reasonably confident
    if (confidence >= 0.5) {
      suggestions.push({
        chord,
        reason: `${matchingNotes}/${pitchClasses.size} notes fit chord tones`,
        confidence,
        voiceLeading: calculateVoiceLeading(currentContext.chord, chord)
      });
    }
  });
  
  // Sort by confidence then voice leading
  suggestions.sort((a, b) => {
    if (Math.abs(a.confidence - b.confidence) > 0.1) {
      return b.confidence - a.confidence;
    }
    return b.voiceLeading - a.voiceLeading;
  });
  
  return suggestions.slice(0, 5); // Top 5 suggestions
}

/**
 * Calculate voice leading smoothness between two chords (0-1)
 */
function calculateVoiceLeading(fromChord: string, toChord: string): number {
  const fromTones = getChordToneSemitones(fromChord);
  const toTones = getChordToneSemitones(toChord);
  
  // Calculate total semitone distance
  let totalDistance = 0;
  fromTones.forEach(fromTone => {
    // Find nearest tone in target chord
    const distances = toTones.map(toTone => Math.abs(toTone - fromTone));
    totalDistance += Math.min(...distances);
  });
  
  // Normalize (lower distance = smoother voice leading)
  const maxDistance = fromTones.length * 12;
  return 1 - (totalDistance / maxDistance);
}

/**
 * Get relative major key
 */
function getRelativeMajor(minorKey: string): string {
  const rootMap: Record<string, string> = {
    'A': 'C', 'A#': 'C#', 'Bb': 'Db', 'B': 'D',
    'C': 'Eb', 'C#': 'E', 'Db': 'E', 'D': 'F',
    'D#': 'F#', 'Eb': 'Gb', 'E': 'G', 'F': 'Ab',
    'F#': 'A', 'Gb': 'A', 'G': 'Bb', 'G#': 'B'
  };
  return rootMap[minorKey] ?? 'C';
}

/**
 * Get relative minor key
 */
function getRelativeMinor(majorKey: string): string {
  const rootMap: Record<string, string> = {
    'C': 'A', 'C#': 'A#', 'Db': 'Bb', 'D': 'B',
    'Eb': 'C', 'E': 'C#', 'F': 'D', 'F#': 'D#',
    'Gb': 'Eb', 'G': 'E', 'Ab': 'F', 'A': 'F#',
    'Bb': 'G', 'B': 'G#'
  };
  return rootMap[majorKey] ?? 'A';
}

/**
 * Inject CSS styles for harmony overlays
 */
export function injectNotationHarmonyStyles(): void {
  if (typeof document === 'undefined') return;
  
  const styleId = 'notation-harmony-overlay-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Notation harmony overlay styles */
    .harmony-overlay {
      transition: opacity 0.3s ease;
    }
    
    .harmony-overlay--chord-tone {
      fill: rgba(66, 165, 245, 0.25);
    }
    
    .harmony-overlay--scale-tone {
      fill: rgba(76, 175, 80, 0.15);
    }
    
    .harmony-overlay--out-of-key {
      fill: rgba(255, 152, 0, 0.1);
    }
    
    /* Hover effects */
    .harmony-overlay--chord-tone:hover {
      opacity: 0.5 !important;
    }
    
    .harmony-overlay--scale-tone:hover {
      opacity: 0.35 !important;
    }
    
    .harmony-overlay--out-of-key:hover {
      opacity: 0.25 !important;
    }
  `;
  
  document.head.appendChild(style);
}
