/**
 * @fileoverview Tuplet Rendering.
 * 
 * Handles rendering of:
 * - Triplets
 * - Quintuplets and other tuplets
 * - Tuplet brackets and numbers
 * 
 * @module @cardplay/core/notation/tuplets
 */

import { Tuplet, StemDirection } from './types';
import { RenderedNoteHead, RenderedStem } from './notes';
import { RenderedStaff } from './staff';

// ============================================================================
// TUPLET CONFIGURATION
// ============================================================================

/**
 * Tuplet rendering configuration.
 */
export interface TupletConfig {
  /** Bracket thickness */
  readonly bracketThickness: number;
  /** Bracket hook length */
  readonly hookLength: number;
  /** Number font size */
  readonly fontSize: number;
  /** Gap between bracket and number */
  readonly numberGap: number;
  /** Minimum distance from notes */
  readonly minDistance: number;
  /** Bracket slope limit */
  readonly maxSlope: number;
}

/**
 * Default tuplet configuration.
 */
export const DEFAULT_TUPLET_CONFIG: TupletConfig = {
  bracketThickness: 1.5,
  hookLength: 6,
  fontSize: 12,
  numberGap: 4,
  minDistance: 10,
  maxSlope: 0.3,
};

// ============================================================================
// TUPLET TYPES
// ============================================================================

/**
 * Tuplet bracket element.
 */
export interface TupletBracket {
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly leftHookY: number;
  readonly rightHookY: number;
  readonly thickness: number;
}

/**
 * Tuplet number element.
 */
export interface TupletNumber {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly fontSize: number;
}

/**
 * Rendered tuplet.
 */
export interface RenderedTuplet {
  readonly id: string;
  readonly bracket: TupletBracket | null;
  readonly number: TupletNumber | null;
  readonly placement: 'above' | 'below';
}

// ============================================================================
// TUPLET RENDERING
// ============================================================================

/**
 * Determine tuplet placement based on stem directions.
 */
export function determineTupletPlacement(
  stemDirections: StemDirection[],
  override?: 'above' | 'below' | 'auto'
): 'above' | 'below' {
  if (override && override !== 'auto') {
    return override;
  }
  
  // Count stem directions
  let upCount = 0;
  let downCount = 0;
  
  for (const dir of stemDirections) {
    if (dir === 'up') upCount++;
    else if (dir === 'down') downCount++;
  }
  
  // Tuplet goes opposite of majority stem direction
  return upCount >= downCount ? 'below' : 'above';
}

/**
 * Calculate tuplet bracket slope.
 */
export function calculateTupletSlope(
  noteHeads: RenderedNoteHead[],
  _placement: 'above' | 'below',
  maxSlope: number
): number {
  if (noteHeads.length < 2) return 0;
  
  const first = noteHeads[0];
  const last = noteHeads[noteHeads.length - 1];
  
  if (!first || !last) return 0;
  
  const xDiff = last.x - first.x;
  if (xDiff === 0) return 0;
  
  const yDiff = last.y - first.y;
  const slope = yDiff / xDiff;
  
  // Clamp slope
  return Math.max(-maxSlope, Math.min(maxSlope, slope));
}

/**
 * Find the extreme Y position for tuplet placement.
 */
export function findTupletExtreme(
  noteHeads: RenderedNoteHead[],
  stems: (RenderedStem | null)[],
  placement: 'above' | 'below'
): number {
  let extreme = placement === 'above' ? Infinity : -Infinity;
  
  for (let i = 0; i < noteHeads.length; i++) {
    const noteHead = noteHeads[i];
    const stem = stems[i];
    
    if (!noteHead) continue;
    
    if (placement === 'above') {
      // Find topmost point
      let y = noteHead.y - noteHead.dimensions.height / 2;
      if (stem && stem.direction === 'up') {
        y = Math.min(y, stem.endY);
      }
      extreme = Math.min(extreme, y);
    } else {
      // Find bottommost point
      let y = noteHead.y + noteHead.dimensions.height / 2;
      if (stem && stem.direction === 'down') {
        y = Math.max(y, stem.endY);
      }
      extreme = Math.max(extreme, y);
    }
  }
  
  return extreme;
}

/**
 * Render a tuplet.
 */
export function renderTuplet(
  tuplet: Tuplet,
  noteHeads: RenderedNoteHead[],
  stems: (RenderedStem | null)[],
  _staff: RenderedStaff,
  config: TupletConfig = DEFAULT_TUPLET_CONFIG
): RenderedTuplet {
  if (noteHeads.length === 0) {
    return {
      id: tuplet.id,
      bracket: null,
      number: null,
      placement: 'above',
    };
  }
  
  const stemDirections = stems.map(s => s?.direction || 'auto');
  const placement = determineTupletPlacement(stemDirections, tuplet.placement);
  
  const firstNote = noteHeads[0];
  const lastNote = noteHeads[noteHeads.length - 1];
  
  if (!firstNote || !lastNote) {
    return {
      id: tuplet.id,
      bracket: null,
      number: null,
      placement: 'above',
    };
  }
  
  // Calculate bracket position
  const extreme = findTupletExtreme(noteHeads, stems, placement);
  const offset = placement === 'above' ? -config.minDistance : config.minDistance;
  const bracketY = extreme + offset;
  
  // Calculate slope
  const slope = calculateTupletSlope(noteHeads, placement, config.maxSlope);
  
  // Bracket endpoints
  const startX = firstNote.x;
  const endX = lastNote.x + lastNote.dimensions.width;
  const startY = bracketY;
  const endY = bracketY + slope * (endX - startX);
  
  // Hook direction
  const hookDir = placement === 'above' ? 1 : -1;
  
  // Create bracket if needed
  let bracket: TupletBracket | null = null;
  if (tuplet.showBracket) {
    bracket = {
      startX,
      startY,
      endX,
      endY,
      leftHookY: startY + hookDir * config.hookLength,
      rightHookY: endY + hookDir * config.hookLength,
      thickness: config.bracketThickness,
    };
  }
  
  // Create number if needed
  let number: TupletNumber | null = null;
  if (tuplet.showNumber) {
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2 + (placement === 'above' ? -config.numberGap : config.numberGap);
    
    number = {
      text: String(tuplet.actual),
      x: midX,
      y: midY,
      fontSize: config.fontSize,
    };
  }
  
  return {
    id: tuplet.id,
    bracket,
    number,
    placement,
  };
}

/**
 * Render a nested tuplet (tuplet within tuplet).
 */
export function renderNestedTuplet(
  outerTuplet: Tuplet,
  innerTuplet: Tuplet,
  allNoteHeads: RenderedNoteHead[],
  innerNoteHeads: RenderedNoteHead[],
  stems: (RenderedStem | null)[],
  staff: RenderedStaff,
  config: TupletConfig = DEFAULT_TUPLET_CONFIG
): { outer: RenderedTuplet; inner: RenderedTuplet } {
  // Render outer tuplet first
  const outer = renderTuplet(outerTuplet, allNoteHeads, stems, staff, config);
  
  // Inner tuplet needs to be offset further
  const innerConfig = {
    ...config,
    minDistance: config.minDistance + 15,
  };
  
  // Find stems for inner notes
  const innerIndices = innerNoteHeads.map(nh => allNoteHeads.indexOf(nh));
  const innerStems: (RenderedStem | null)[] = innerIndices.map(i => i >= 0 ? (stems[i] ?? null) : null);
  
  const inner = renderTuplet(innerTuplet, innerNoteHeads, innerStems, staff, innerConfig);
  
  return { outer, inner };
}

// ============================================================================
// COMMON TUPLET PATTERNS
// ============================================================================

/**
 * Create a triplet specification.
 */
export function createTriplet(
  id: string,
  noteIds: string[],
  options?: Partial<Omit<Tuplet, 'id' | 'actual' | 'normal' | 'noteIds'>>
): Tuplet {
  return {
    id,
    actual: 3,
    normal: 2,
    noteIds,
    showBracket: options?.showBracket ?? true,
    showNumber: options?.showNumber ?? true,
    placement: options?.placement ?? 'auto',
  };
}

/**
 * Create a quintuplet specification.
 */
export function createQuintuplet(
  id: string,
  noteIds: string[],
  options?: Partial<Omit<Tuplet, 'id' | 'actual' | 'normal' | 'noteIds'>>
): Tuplet {
  return {
    id,
    actual: 5,
    normal: 4,
    noteIds,
    showBracket: options?.showBracket ?? true,
    showNumber: options?.showNumber ?? true,
    placement: options?.placement ?? 'auto',
  };
}

/**
 * Create a sextuplet specification.
 */
export function createSextuplet(
  id: string,
  noteIds: string[],
  options?: Partial<Omit<Tuplet, 'id' | 'actual' | 'normal' | 'noteIds'>>
): Tuplet {
  return {
    id,
    actual: 6,
    normal: 4,
    noteIds,
    showBracket: options?.showBracket ?? true,
    showNumber: options?.showNumber ?? true,
    placement: options?.placement ?? 'auto',
  };
}

/**
 * Create a septuplet specification.
 */
export function createSeptuplet(
  id: string,
  noteIds: string[],
  options?: Partial<Omit<Tuplet, 'id' | 'actual' | 'normal' | 'noteIds'>>
): Tuplet {
  return {
    id,
    actual: 7,
    normal: 4,
    noteIds,
    showBracket: options?.showBracket ?? true,
    showNumber: options?.showNumber ?? true,
    placement: options?.placement ?? 'auto',
  };
}

/**
 * Create a custom tuplet specification.
 */
export function createTuplet(
  id: string,
  actual: number,
  normal: number,
  noteIds: string[],
  options?: Partial<Omit<Tuplet, 'id' | 'actual' | 'normal' | 'noteIds'>>
): Tuplet {
  return {
    id,
    actual,
    normal,
    noteIds,
    showBracket: options?.showBracket ?? true,
    showNumber: options?.showNumber ?? true,
    placement: options?.placement ?? 'auto',
  };
}

/**
 * Format tuplet ratio text.
 */
export function formatTupletRatio(tuplet: Tuplet): string {
  return `${tuplet.actual}:${tuplet.normal}`;
}

/**
 * Calculate actual duration of notes in a tuplet.
 * @param normalDuration The duration each note would have without tuplet
 * @param tuplet The tuplet specification
 * @returns The actual duration of each note
 */
export function calculateTupletNoteDuration(
  normalDuration: number,
  tuplet: Tuplet
): number {
  return (normalDuration * tuplet.normal) / tuplet.actual;
}
