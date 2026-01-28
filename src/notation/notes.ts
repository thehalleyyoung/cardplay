/**
 * @fileoverview Note Rendering.
 * 
 * Handles rendering of:
 * - Note heads (various durations)
 * - Stems (direction logic)
 * - Beams (grouping algorithm)
 * - Rests (various durations)
 * - Accidentals (sharp, flat, natural, etc.)
 * - Dots (single and double)
 * - Grace notes
 * 
 * @module @cardplay/core/notation/notes
 */

import {
  NoteDurationType,
  NoteDuration,
  DURATION_FLAGS,
  StemDirection,
  BeamGroup,
  AccidentalType,
  NotationNote,
  NotationEvent,
  ArticulationType,
} from './types';
import { RenderedStaff, getStaffPositionY, midiToStaffPosition } from './staff';

// ============================================================================
// NOTE HEAD TYPES
// ============================================================================

/**
 * Note head shape.
 */
export type NoteHeadShape = 
  | 'normal'       // Filled oval (quarter and shorter)
  | 'half'         // Open oval (half note)
  | 'whole'        // Open oval, wider (whole note)
  | 'breve'        // Double whole with vertical lines
  | 'diamond'      // For harmonics
  | 'x'            // For percussion
  | 'slash'        // For rhythm notation
  | 'triangle'     // Alternative notation
  | 'square';      // Alternative notation

/**
 * Get note head shape for duration.
 */
export function getNoteHeadShape(duration: NoteDurationType): NoteHeadShape {
  switch (duration) {
    case 'maxima':
    case 'longa':
    case 'breve':
      return 'breve';
    case 'whole':
      return 'whole';
    case 'half':
      return 'half';
    default:
      return 'normal';
  }
}

/**
 * Note head dimensions based on duration.
 */
export interface NoteHeadDimensions {
  readonly width: number;
  readonly height: number;
  readonly stemAttachX: number; // X offset for stem attachment
  readonly stemAttachY: number; // Y offset for stem attachment
}

/**
 * Get note head dimensions for a shape.
 */
export function getNoteHeadDimensions(
  shape: NoteHeadShape,
  lineSpacing: number
): NoteHeadDimensions {
  const baseWidth = lineSpacing * 1.3;
  const baseHeight = lineSpacing * 0.8;
  
  const dimensions: Record<NoteHeadShape, NoteHeadDimensions> = {
    normal: {
      width: baseWidth,
      height: baseHeight,
      stemAttachX: baseWidth,
      stemAttachY: 0,
    },
    half: {
      width: baseWidth * 1.1,
      height: baseHeight,
      stemAttachX: baseWidth * 1.1,
      stemAttachY: 0,
    },
    whole: {
      width: baseWidth * 1.4,
      height: baseHeight,
      stemAttachX: 0, // No stem
      stemAttachY: 0,
    },
    breve: {
      width: baseWidth * 1.8,
      height: baseHeight,
      stemAttachX: 0, // No stem
      stemAttachY: 0,
    },
    diamond: {
      width: baseWidth * 0.9,
      height: baseHeight * 1.2,
      stemAttachX: baseWidth * 0.45,
      stemAttachY: baseHeight * 0.6,
    },
    x: {
      width: baseWidth * 0.9,
      height: baseHeight,
      stemAttachX: baseWidth * 0.45,
      stemAttachY: 0,
    },
    slash: {
      width: baseWidth * 1.2,
      height: baseHeight * 1.5,
      stemAttachX: baseWidth * 0.6,
      stemAttachY: 0,
    },
    triangle: {
      width: baseWidth,
      height: baseHeight * 1.1,
      stemAttachX: baseWidth * 0.5,
      stemAttachY: baseHeight * 0.55,
    },
    square: {
      width: baseWidth * 0.9,
      height: baseHeight,
      stemAttachX: baseWidth * 0.9,
      stemAttachY: 0,
    },
  };
  
  return dimensions[shape];
}

// ============================================================================
// NOTE HEAD RENDERING
// ============================================================================

/**
 * Rendered note head.
 */
export interface RenderedNoteHead {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly shape: NoteHeadShape;
  readonly dimensions: NoteHeadDimensions;
  readonly filled: boolean;
  readonly staffPosition: number;
  readonly pitch: number;
  readonly accidental?: RenderedAccidental;
  readonly ledgerLines: RenderedLedgerLine[];
}

/**
 * Rendered accidental.
 */
export interface RenderedAccidental {
  readonly type: AccidentalType;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly isCautionary: boolean;
}

/**
 * Rendered ledger line.
 */
export interface RenderedLedgerLine {
  readonly x: number;
  readonly y: number;
  readonly width: number;
}

/**
 * Render a note head.
 */
export function renderNoteHead(
  note: NotationNote,
  duration: NoteDurationType,
  staff: RenderedStaff,
  x: number
): RenderedNoteHead {
  const shape = getNoteHeadShape(duration);
  const dimensions = getNoteHeadDimensions(shape, staff.dimensions.lineSpacing);
  const { position } = midiToStaffPosition(
    note.pitch,
    staff.config.clef,
    note.accidental
  );
  
  const y = getStaffPositionY(staff, position);
  const noteWidth = dimensions.width;
  
  // Calculate ledger lines
  const ledgerLines: RenderedLedgerLine[] = [];
  const ledgerLineWidth = noteWidth + 6;
  
  if (position > 4) {
    for (let pos = 6; pos <= position; pos += 2) {
      ledgerLines.push({
        x: x - 3,
        y: getStaffPositionY(staff, pos),
        width: ledgerLineWidth,
      });
    }
  } else if (position < -4) {
    for (let pos = -6; pos >= position; pos -= 2) {
      ledgerLines.push({
        x: x - 3,
        y: getStaffPositionY(staff, pos),
        width: ledgerLineWidth,
      });
    }
  }
  
  // Render accidental if present
  let accidental: RenderedAccidental | undefined;
  if (note.accidental) {
    const accidentalWidth = getAccidentalWidth(note.accidental);
    accidental = {
      type: note.accidental,
      x: x - accidentalWidth - 4,
      y: y,
      width: accidentalWidth,
      height: staff.dimensions.lineSpacing * 2,
      isCautionary: note.cautionary ?? false,
    };
  }
  
  // Determine if filled
  const filled = !['whole', 'half', 'breve', 'longa', 'maxima'].includes(duration);
  
  const result: RenderedNoteHead = {
    id: note.id,
    x,
    y,
    shape,
    dimensions,
    filled,
    staffPosition: position,
    pitch: note.pitch,
    ledgerLines,
  };
  
  if (accidental) {
    (result as any).accidental = accidental;
  }
  
  return result;
}

// ============================================================================
// ACCIDENTAL RENDERING
// ============================================================================

/**
 * Accidental glyph paths.
 */
export const ACCIDENTAL_GLYPHS: Record<AccidentalType, string> = {
  'sharp': 'M-1 -8h2v6h3v-6h2v6h-3v4h3v2h-3v6h-2v-6h-3v6h-2v-6h3v-4h-3v-2h3z',
  'flat': 'M0 -8c4 0 6 3 6 6c0 4 -4 8 -6 10v-6c2 -1 3 -2 3 -4c0 -2 -1 -3 -3 -3v-3z',
  'natural': 'M-1 -8h2v8h3v-4h2v12h-2v-6h-3v4h-2z',
  'double-sharp': 'M-4 -4l4 4l-4 4l2 2l4 -4l4 4l2 -2l-4 -4l4 -4l-2 -2l-4 4l-4 -4z',
  'double-flat': 'M-3 -8c4 0 6 3 6 6c0 4 -4 8 -6 10v-6c2 -1 3 -2 3 -4c0 -2 -1 -3 -3 -3v-3zM3 -8c4 0 6 3 6 6c0 4 -4 8 -6 10v-6c2 -1 3 -2 3 -4c0 -2 -1 -3 -3 -3v-3z',
  'quarter-sharp': 'M0 -6v12M-2 -3h4',
  'quarter-flat': 'M0 -8c2 0 3 1.5 3 3c0 2 -2 4 -3 5v-4c1 -0.5 1.5 -1 1.5 -2c0 -1 -0.5 -1.5 -1.5 -1.5v-0.5z',
  'three-quarter-sharp': 'M-1 -8h2v6h3v-6h2v6h-3v4h3v2h-3v6h-2v-6h-3v6h-2v-6h3v-4h-3v-2h3zM5 -2h2v4h-2z',
  'three-quarter-flat': 'M-3 -8c4 0 6 3 6 6c0 4 -4 8 -6 10v-6c2 -1 3 -2 3 -4c0 -2 -1 -3 -3 -3v-3zM3 -8c4 0 6 3 6 6c0 4 -4 8 -6 10v-6c2 -1 3 -2 3 -4c0 -2 -1 -3 -3 -3v-3zM9 0h2',
};

/**
 * Get width of an accidental.
 */
export function getAccidentalWidth(type: AccidentalType): number {
  const widths: Record<AccidentalType, number> = {
    'sharp': 10,
    'flat': 8,
    'natural': 8,
    'double-sharp': 12,
    'double-flat': 14,
    'quarter-sharp': 6,
    'quarter-flat': 6,
    'three-quarter-sharp': 14,
    'three-quarter-flat': 16,
  };
  return widths[type];
}

/**
 * Resolve accidentals for notes, handling collisions.
 */
export function resolveAccidentalPositions(
  noteHeads: RenderedNoteHead[],
  baseX: number
): RenderedNoteHead[] {
  // Sort by staff position (highest first for accidental ordering)
  const sorted = [...noteHeads].sort((a, b) => b.staffPosition - a.staffPosition);
  
  // Track X positions used for accidentals at each approximate Y
  const usedPositions: Map<number, number[]> = new Map();
  
  return sorted.map(noteHead => {
    if (!noteHead.accidental) return noteHead;
    
    const accY = Math.round(noteHead.accidental.y / 5) * 5; // Quantize Y
    const used = usedPositions.get(accY) || [];
    
    // Find available X position
    let accX = baseX - noteHead.accidental.width - 4;
    while (used.some(x => Math.abs(x - accX) < noteHead.accidental!.width + 2)) {
      accX -= noteHead.accidental.width + 2;
    }
    
    used.push(accX);
    usedPositions.set(accY, used);
    
    return {
      ...noteHead,
      accidental: {
        ...noteHead.accidental,
        x: accX,
      },
    };
  });
}

// ============================================================================
// STEM RENDERING
// ============================================================================

/**
 * Stem configuration.
 */
export interface StemConfig {
  readonly thickness: number;
  readonly length: number;
  readonly flagSpacing: number;
}

/**
 * Default stem configuration.
 */
export const DEFAULT_STEM_CONFIG: StemConfig = {
  thickness: 1.2,
  length: 35,
  flagSpacing: 5,
};

/**
 * Rendered stem.
 */
export interface RenderedStem {
  readonly x: number;
  readonly startY: number;
  readonly endY: number;
  readonly direction: StemDirection;
  readonly thickness: number;
  readonly flags: RenderedFlag[];
}

/**
 * Rendered flag.
 */
export interface RenderedFlag {
  readonly x: number;
  readonly y: number;
  readonly direction: StemDirection;
  readonly level: number; // 1 = first flag, 2 = second, etc.
}

/**
 * Determine stem direction based on staff position.
 * Notes at or above middle line have down stems.
 */
export function determineStemDirection(
  staffPosition: number,
  override?: StemDirection
): StemDirection {
  if (override && override !== 'auto') {
    return override;
  }
  // Middle line is position 0
  return staffPosition >= 0 ? 'down' : 'up';
}

/**
 * Determine stem direction for a chord (multiple notes).
 */
export function determineChordStemDirection(
  positions: number[],
  override?: StemDirection
): StemDirection {
  if (override && override !== 'auto') {
    return override;
  }
  
  if (positions.length === 0) return 'up';
  
  // Average position weighted toward extremes
  const minPos = Math.min(...positions);
  const maxPos = Math.max(...positions);
  const avgPos = (minPos + maxPos) / 2;
  
  // Prefer down if average is at or above middle line
  return avgPos >= 0 ? 'down' : 'up';
}

/**
 * Render a stem for a note.
 */
export function renderStem(
  noteHead: RenderedNoteHead,
  duration: NoteDurationType,
  direction: StemDirection,
  _staff: RenderedStaff,
  config: StemConfig = DEFAULT_STEM_CONFIG
): RenderedStem | null {
  // Whole notes and longer don't have stems
  if (['whole', 'breve', 'longa', 'maxima'].includes(duration)) {
    return null;
  }
  
  const resolvedDirection = determineStemDirection(noteHead.staffPosition, direction);
  
  // Stem attaches to right side for up, left side for down
  const x = resolvedDirection === 'up' 
    ? noteHead.x + noteHead.dimensions.width - config.thickness / 2
    : noteHead.x + config.thickness / 2;
  
  const startY = noteHead.y;
  
  // Stem extends up or down
  const stemLength = config.length;
  const endY = resolvedDirection === 'up'
    ? startY - stemLength
    : startY + stemLength;
  
  // Calculate flags
  const numFlags = DURATION_FLAGS[duration];
  const flags: RenderedFlag[] = [];
  
  for (let i = 0; i < numFlags; i++) {
    const flagY = resolvedDirection === 'up'
      ? endY + i * config.flagSpacing
      : endY - i * config.flagSpacing;
    
    flags.push({
      x,
      y: flagY,
      direction: resolvedDirection,
      level: i + 1,
    });
  }
  
  return {
    x,
    startY,
    endY,
    direction: resolvedDirection,
    thickness: config.thickness,
    flags,
  };
}

/**
 * Render a stem for a chord (connects to all note heads).
 */
export function renderChordStem(
  noteHeads: RenderedNoteHead[],
  duration: NoteDurationType,
  direction: StemDirection,
  _staff: RenderedStaff,
  config: StemConfig = DEFAULT_STEM_CONFIG
): RenderedStem | null {
  if (['whole', 'breve', 'longa', 'maxima'].includes(duration)) {
    return null;
  }
  
  if (noteHeads.length === 0) return null;
  
  const positions = noteHeads.map(nh => nh.staffPosition);
  const resolvedDirection = determineChordStemDirection(positions, direction);
  
  // Find top and bottom note heads
  const sortedByY = [...noteHeads].sort((a, b) => a.y - b.y); // Top first
  const topNoteHead = sortedByY[0];
  const bottomNoteHead = sortedByY[sortedByY.length - 1];
  
  if (!topNoteHead || !bottomNoteHead) return null;
  
  const x = resolvedDirection === 'up'
    ? topNoteHead.x + topNoteHead.dimensions.width - config.thickness / 2
    : bottomNoteHead.x + config.thickness / 2;
  
  const startY = resolvedDirection === 'up' ? bottomNoteHead.y : topNoteHead.y;
  const stemExtent = resolvedDirection === 'up' ? topNoteHead.y : bottomNoteHead.y;
  
  const minStemLength = config.length;
  const stemLength = Math.max(
    minStemLength,
    Math.abs(stemExtent - startY) + minStemLength * 0.7
  );
  
  const endY = resolvedDirection === 'up'
    ? startY - stemLength
    : startY + stemLength;
  
  const numFlags = DURATION_FLAGS[duration];
  const flags: RenderedFlag[] = [];
  
  for (let i = 0; i < numFlags; i++) {
    const flagY = resolvedDirection === 'up'
      ? endY + i * config.flagSpacing
      : endY - i * config.flagSpacing;
    
    flags.push({
      x,
      y: flagY,
      direction: resolvedDirection,
      level: i + 1,
    });
  }
  
  return {
    x,
    startY,
    endY,
    direction: resolvedDirection,
    thickness: config.thickness,
    flags,
  };
}

// ============================================================================
// BEAM RENDERING
// ============================================================================

/**
 * Rendered beam.
 */
export interface RenderedBeam {
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly thickness: number;
  readonly level: number;
}

/**
 * Beam group rendering result.
 */
export interface RenderedBeamGroup {
  readonly beams: RenderedBeam[];
  readonly stems: RenderedStem[];
  readonly direction: StemDirection;
}

/**
 * Calculate beam slope based on note positions.
 */
export function calculateBeamSlope(
  startPosition: number,
  endPosition: number,
  startX: number,
  endX: number,
  maxSlope: number = 0.5
): number {
  const positionDiff = endPosition - startPosition;
  const xDiff = endX - startX;
  
  if (xDiff === 0) return 0;
  
  // Slope in terms of staff positions per pixel
  const rawSlope = positionDiff / xDiff;
  
  // Clamp to max slope
  return Math.max(-maxSlope, Math.min(maxSlope, rawSlope));
}

/**
 * Create beam groups from a sequence of notes.
 */
export function createBeamGroups(
  events: NotationEvent[],
  _beamingPattern: number[] = [4, 4], // Group by beat
  ticksPerBeat: number = 480
): BeamGroup[] {
  const groups: BeamGroup[] = [];
  let currentGroup: number[] = [];
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (!event) continue;
    
    // Skip rests and notes that don't beam
    if (event.isRest || DURATION_FLAGS[event.duration.base] === 0) {
      if (currentGroup.length > 1) {
        groups.push({
          noteIndices: [...currentGroup],
          stemDirection: 'auto',
          level: Math.max(...currentGroup.map(idx => {
            const ev = events[idx];
            return ev ? DURATION_FLAGS[ev.duration.base] : 0;
          })),
        });
      }
      currentGroup = [];
      continue;
    }
    
    // Check if this note should start a new group
    const beatPosition = event.tick % ticksPerBeat;
    const shouldBreak = beatPosition === 0 && currentGroup.length > 0;
    
    if (shouldBreak) {
      if (currentGroup.length > 1) {
        groups.push({
          noteIndices: [...currentGroup],
          stemDirection: 'auto',
          level: Math.max(...currentGroup.map(idx => {
            const ev = events[idx];
            return ev ? DURATION_FLAGS[ev.duration.base] : 0;
          })),
        });
      }
      currentGroup = [];
    }
    
    currentGroup.push(i);
  }
  
  // Add final group
  if (currentGroup.length > 1) {
    groups.push({
      noteIndices: [...currentGroup],
      stemDirection: 'auto',
      level: Math.max(...currentGroup.map(idx => {
        const ev = events[idx];
        return ev ? DURATION_FLAGS[ev.duration.base] : 0;
      })),
    });
  }
  
  return groups;
}

/**
 * Render a beam group.
 * NOTE: noteHeads and xPositions are indexed 0,1,2... corresponding to
 * the order of notes in the group, NOT by the original event indices.
 * group.noteIndices contains the original event array indices for reference.
 */
export function renderBeamGroup(
  events: NotationEvent[],
  noteHeads: RenderedNoteHead[][],
  group: BeamGroup,
  _staff: RenderedStaff,
  xPositions: number[],
  stemConfig: StemConfig = DEFAULT_STEM_CONFIG
): RenderedBeamGroup {
  const beams: RenderedBeam[] = [];
  const stems: RenderedStem[] = [];
  
  const numNotes = noteHeads.length;
  
  // Get all positions in group
  const allPositions: number[] = [];
  for (let i = 0; i < numNotes; i++) {
    const noteHeadGroup = noteHeads[i];
    if (noteHeadGroup && noteHeadGroup.length > 0) {
      allPositions.push(...noteHeadGroup.map(nh => nh.staffPosition));
    }
  }
  
  // If no valid note heads, return empty
  if (allPositions.length === 0 || numNotes === 0) {
    return { beams: [], stems: [], direction: 'up' };
  }
  
  // Determine direction for entire group
  const direction = determineChordStemDirection(allPositions, group.stemDirection);
  
  // Calculate beam line using first and last notes (array indices 0 and numNotes-1)
  const firstNoteHeads = noteHeads[0];
  const lastNoteHeads = noteHeads[numNotes - 1];
  const firstX = xPositions[0];
  const lastX = xPositions[numNotes - 1];
  
  if (!firstNoteHeads || !lastNoteHeads || firstX === undefined || lastX === undefined) {
    return { beams: [], stems: [], direction: 'up' };
  }
  
  const firstPositions = firstNoteHeads.map(nh => nh.staffPosition);
  const lastPositions = lastNoteHeads.map(nh => nh.staffPosition);
  
  const firstAvgPos = firstPositions.reduce((a, b) => a + b, 0) / firstPositions.length;
  const lastAvgPos = lastPositions.reduce((a, b) => a + b, 0) / lastPositions.length;
  
  const slope = calculateBeamSlope(firstAvgPos, lastAvgPos, firstX, lastX);
  
  // Calculate beam Y positions
  const beamStartY = direction === 'up'
    ? Math.min(...firstNoteHeads.map(nh => nh.y)) - stemConfig.length
    : Math.max(...firstNoteHeads.map(nh => nh.y)) + stemConfig.length;
  
  const beamEndY = beamStartY + slope * (lastX - firstX);
  
  // Render stems to reach beam - iterate using array indices 0..numNotes-1
  for (let i = 0; i < numNotes; i++) {
    const currentNoteHeads = noteHeads[i];
    const noteX = xPositions[i];
    if (!currentNoteHeads || currentNoteHeads.length === 0 || noteX === undefined) continue;
    
    const firstNoteHead = currentNoteHeads[0];
    if (!firstNoteHead) continue;
    
    const noteY = direction === 'up'
      ? Math.min(...currentNoteHeads.map(nh => nh.y))
      : Math.max(...currentNoteHeads.map(nh => nh.y));
    
    const beamY = beamStartY + slope * (noteX - firstX);
    
    const stemX = direction === 'up'
      ? noteX + firstNoteHead.dimensions.width - stemConfig.thickness / 2
      : noteX + stemConfig.thickness / 2;
    
    stems.push({
      x: stemX,
      startY: noteY,
      endY: beamY,
      direction,
      thickness: stemConfig.thickness,
      flags: [], // No flags when beamed
    });
  }
  
  // Render primary beam
  const beamThickness = 5;
  const firstHead = firstNoteHeads[0];
  const lastHead = lastNoteHeads[0];
  if (!firstHead || !lastHead) {
    return { beams: [], stems, direction };
  }
  
  beams.push({
    startX: firstX + (direction === 'up' ? firstHead.dimensions.width : 0),
    startY: beamStartY,
    endX: lastX + (direction === 'up' ? lastHead.dimensions.width : 0),
    endY: beamEndY,
    thickness: beamThickness,
    level: 1,
  });
  
  // Add secondary beams for 16th, 32nd, etc.
  const maxLevel = group.level;
  for (let level = 2; level <= maxLevel; level++) {
    // Find continuous runs of notes at this level
    let runStart = -1;
    
    // Iterate using array indices 0..numNotes-1
    // Use group.noteIndices to get original event indices for duration lookup
    for (let i = 0; i <= numNotes; i++) {
      const eventIdx = i < numNotes ? group.noteIndices[i] : undefined;
      let noteLevel = 0;
      if (eventIdx !== undefined && eventIdx >= 0) {
        const ev = events[eventIdx];
        noteLevel = ev ? DURATION_FLAGS[ev.duration.base] : 0;
      }
      
      if (noteLevel >= level) {
        if (runStart === -1) runStart = i;
      } else {
        if (runStart !== -1) {
          // End of run - runStart and runEndIdx are array indices into noteHeads/xPositions
          const runEndIdx = i - 1;
          const startNoteHeads = noteHeads[runStart];
          const endNoteHeads = noteHeads[runEndIdx];
          const startX = xPositions[runStart];
          const endX = xPositions[runEndIdx];
          
          if (runStart <= runEndIdx && startNoteHeads?.[0] && endNoteHeads?.[0] && startX !== undefined && endX !== undefined) {
            const sX = startX + (direction === 'up' ? startNoteHeads[0].dimensions.width : 0);
            const eX = endX + (direction === 'up' ? endNoteHeads[0].dimensions.width : 0);
            
            const sY = beamStartY + slope * (startX - firstX);
            const eY = beamStartY + slope * (endX - firstX);
            
            const beamOffset = (level - 1) * (beamThickness + 3) * (direction === 'up' ? 1 : -1);
            
            beams.push({
              startX: sX,
              startY: sY + beamOffset,
              endX: eX,
              endY: eY + beamOffset,
              thickness: beamThickness,
              level,
            });
          }
          runStart = -1;
        }
      }
    }
  }
  
  return { beams, stems, direction };
}

// ============================================================================
// REST RENDERING
// ============================================================================

/**
 * Rest glyph paths.
 */
export const REST_GLYPHS: Record<NoteDurationType, string> = {
  'maxima': 'M0 0h8v40h-8z',
  'longa': 'M0 0h6v20h-6z',
  'breve': 'M0 0h10v20h-10zM0 0h10M0 20h10',
  'whole': 'M0 0h16v6h-16z', // Hangs from line
  'half': 'M0 0h16v6h-16z', // Sits on line
  'quarter': 'M2 -12c0 2 -2 4 -2 6c0 2 2 4 4 4c-4 2 -6 6 -6 10c0 4 3 7 6 7c-2 -2 -3 -4 -3 -6c0 -3 2 -5 4 -6c-4 0 -6 -2 -6 -6c0 -3 2 -6 3 -9z',
  'eighth': 'M0 -8c4 0 6 2 6 5c0 2 -1 4 -3 5l4 14h-2l-4 -12c-1 0 -1 0 -2 0c-2 0 -4 -2 -4 -5c0 -4 2 -7 5 -7z',
  '16th': 'M0 -8c4 0 6 2 6 5c0 2 -1 4 -3 5l2 7c4 0 6 2 6 5c0 2 -1 4 -3 5l4 14h-2l-4 -12c-1 0 -1 0 -2 0c-2 0 -4 -2 -4 -5c0 -2 1 -4 3 -5l-2 -7c-4 0 -6 -2 -6 -5c0 -4 2 -7 5 -7z',
  '32nd': 'M0 0q4 0 6 5q0 3 -3 5l2 7q4 0 6 5q0 3 -3 5l2 7q4 0 6 5q0 3 -3 5l4 14h-2l-4 -12q-1 0 -2 0q-4 0 -4 -5q0 -3 3 -5l-2 -7q-4 0 -6 -5q0 -3 3 -5l-2 -7q-4 0 -6 -5q0 -4 5 -7z',
  '64th': 'M0 0q4 0 6 5q0 3 -3 5l2 7q4 0 6 5q0 3 -3 5l2 7q4 0 6 5q0 3 -3 5l2 7q4 0 6 5q0 3 -3 5l4 14h-2l-4 -12q-1 0 -2 0q-4 0 -4 -5q0 -3 3 -5l-2 -7q-4 0 -6 -5q0 -3 3 -5l-2 -7q-4 0 -6 -5q0 -3 3 -5l-2 -7q-4 0 -6 -5q0 -4 5 -7z',
  '128th': 'M0 0h8v60h-8z', // Simplified
  '256th': 'M0 0h8v80h-8z', // Simplified
};

/**
 * Rendered rest.
 */
export interface RenderedRest {
  readonly id: string;
  readonly duration: NoteDurationType;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly glyph: string;
  readonly dots: number;
}

/**
 * Render a rest.
 */
export function renderRest(
  id: string,
  duration: NoteDuration,
  staff: RenderedStaff,
  x: number,
  _voice: number = 1
): RenderedRest {
  const glyph = REST_GLYPHS[duration.base];
  
  // Rest dimensions vary by type
  const dimensions: Record<NoteDurationType, { width: number; height: number; yOffset: number }> = {
    'maxima': { width: 24, height: 40, yOffset: 0 },
    'longa': { width: 16, height: 20, yOffset: 0 },
    'breve': { width: 16, height: 20, yOffset: 0 },
    'whole': { width: 16, height: 8, yOffset: -staff.dimensions.lineSpacing / 2 }, // Hangs from 4th line
    'half': { width: 16, height: 8, yOffset: staff.dimensions.lineSpacing / 2 }, // Sits on 3rd line
    'quarter': { width: 12, height: 24, yOffset: 0 },
    'eighth': { width: 12, height: 20, yOffset: 0 },
    '16th': { width: 12, height: 28, yOffset: 0 },
    '32nd': { width: 12, height: 36, yOffset: 0 },
    '64th': { width: 12, height: 44, yOffset: 0 },
    '128th': { width: 12, height: 52, yOffset: 0 },
    '256th': { width: 12, height: 60, yOffset: 0 },
  };
  
  const dim = dimensions[duration.base];
  
  // Center rest on middle of staff
  const middleY = staff.y + staff.dimensions.height / 2;
  
  return {
    id,
    duration: duration.base,
    x,
    y: middleY + dim.yOffset - dim.height / 2,
    width: dim.width,
    height: dim.height,
    glyph,
    dots: duration.dots,
  };
}

// ============================================================================
// DOT RENDERING
// ============================================================================

/**
 * Rendered dot.
 */
export interface RenderedDot {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

/**
 * Render dots for a note.
 */
export function renderDots(
  noteHead: RenderedNoteHead,
  numDots: number,
  staff: RenderedStaff
): RenderedDot[] {
  const dots: RenderedDot[] = [];
  const dotRadius = 2;
  const dotSpacing = 5;
  
  // Dots go to the right of the note
  let dotX = noteHead.x + noteHead.dimensions.width + 4;
  
  // Y position: if on a line, move dot to space above
  const lineSpacing = staff.dimensions.lineSpacing;
  let dotY = noteHead.y;
  
  // Check if note is on a line (even staff position)
  if (noteHead.staffPosition % 2 === 0) {
    dotY -= lineSpacing / 2; // Move to space above
  }
  
  for (let i = 0; i < numDots; i++) {
    dots.push({
      x: dotX,
      y: dotY,
      radius: dotRadius,
    });
    dotX += dotSpacing;
  }
  
  return dots;
}

// ============================================================================
// GRACE NOTE RENDERING
// ============================================================================

/**
 * Rendered grace note.
 */
export interface RenderedGraceNote extends RenderedNoteHead {
  readonly isAcciaccatura: boolean; // Has slash through stem
  readonly scale: number;
}

/**
 * Render a grace note.
 */
export function renderGraceNote(
  note: NotationNote,
  staff: RenderedStaff,
  x: number,
  isAcciaccatura: boolean = true
): RenderedGraceNote {
  const normalNoteHead = renderNoteHead(note, 'eighth', staff, x);
  const scale = 0.6; // Grace notes are smaller
  
  return {
    ...normalNoteHead,
    dimensions: {
      width: normalNoteHead.dimensions.width * scale,
      height: normalNoteHead.dimensions.height * scale,
      stemAttachX: normalNoteHead.dimensions.stemAttachX * scale,
      stemAttachY: normalNoteHead.dimensions.stemAttachY * scale,
    },
    isAcciaccatura,
    scale,
  };
}

// ============================================================================
// ARTICULATION RENDERING
// ============================================================================

/**
 * Articulation glyph paths.
 */
export const ARTICULATION_GLYPHS: Record<ArticulationType, string> = {
  'staccato': 'M0 0a3 3 0 1 1 0 0.1z', // Dot
  'staccatissimo': 'M0 -6l3 6l-6 0z', // Wedge
  'tenuto': 'M-6 0h12', // Horizontal line
  'accent': 'M-6 3l6 -6l6 6', // > shape
  'marcato': 'M-4 4l4 -8l4 8', // ^ shape
  'fermata': 'M-8 0a8 4 0 1 1 16 0M0 -2a2 2 0 1 1 0 0.1z',
  'breath-mark': 'M0 -4c2 2 2 6 0 8',
  'caesura': 'M-3 -8l3 16M0 -8l3 16',
  'spiccato': 'M0 0a2 2 0 1 1 0 0.1z',
  'portato': 'M-6 -2h12M-3 2a3 3 0 1 1 0 0.1z',
};

/**
 * Rendered articulation.
 */
export interface RenderedArticulation {
  readonly type: ArticulationType;
  readonly x: number;
  readonly y: number;
  readonly glyph: string;
  readonly placement: 'above' | 'below';
}

/**
 * Render articulations for a note.
 */
export function renderArticulations(
  noteHead: RenderedNoteHead,
  articulations: ArticulationType[],
  stemDirection: StemDirection,
  staff: RenderedStaff
): RenderedArticulation[] {
  const rendered: RenderedArticulation[] = [];
  
  // Articulations go opposite stem direction
  const placement = stemDirection === 'up' ? 'below' : 'above';
  const spacing = 8;
  
  let currentY = placement === 'above'
    ? noteHead.y - staff.dimensions.lineSpacing
    : noteHead.y + staff.dimensions.lineSpacing;
  
  for (const art of articulations) {
    rendered.push({
      type: art,
      x: noteHead.x + noteHead.dimensions.width / 2,
      y: currentY,
      glyph: ARTICULATION_GLYPHS[art],
      placement,
    });
    
    currentY += placement === 'above' ? -spacing : spacing;
  }
  
  return rendered;
}
