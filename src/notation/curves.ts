/**
 * @fileoverview Tie and Slur Rendering.
 * 
 * Handles rendering of:
 * - Ties (connecting notes of same pitch)
 * - Slurs (phrasing marks)
 * - Bezier curve calculations
 * 
 * @module @cardplay/core/notation/curves
 */

import { NoteTie, NoteSlur, StemDirection } from './types';
import { RenderedNoteHead } from './notes';
import { RenderedStaff } from './staff';

// ============================================================================
// CURVE TYPES
// ============================================================================

/**
 * Control point for bezier curves.
 */
export interface ControlPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Bezier curve definition.
 */
export interface BezierCurve {
  readonly startX: number;
  readonly startY: number;
  readonly control1X: number;
  readonly control1Y: number;
  readonly control2X: number;
  readonly control2Y: number;
  readonly endX: number;
  readonly endY: number;
}

/**
 * Rendered tie.
 */
export interface RenderedTie {
  readonly id: string;
  readonly curve: BezierCurve;
  readonly placement: 'above' | 'below';
  readonly thickness: number;
}

/**
 * Rendered slur.
 */
export interface RenderedSlur {
  readonly id: string;
  readonly curve: BezierCurve;
  readonly placement: 'above' | 'below';
  readonly thickness: number;
  readonly isDashed?: boolean;
}

// ============================================================================
// CURVE CONFIGURATION
// ============================================================================

/**
 * Curve rendering configuration.
 */
export interface CurveConfig {
  /** Thickness at endpoints */
  readonly endThickness: number;
  /** Maximum thickness at midpoint */
  readonly midThickness: number;
  /** Minimum height of curve */
  readonly minHeight: number;
  /** Maximum height of curve */
  readonly maxHeight: number;
  /** Height scaling factor based on distance */
  readonly heightFactor: number;
  /** Offset from note head */
  readonly noteOffset: number;
}

/**
 * Default tie configuration.
 */
export const DEFAULT_TIE_CONFIG: CurveConfig = {
  endThickness: 0.5,
  midThickness: 3,
  minHeight: 8,
  maxHeight: 25,
  heightFactor: 0.15,
  noteOffset: 4,
};

/**
 * Default slur configuration.
 */
export const DEFAULT_SLUR_CONFIG: CurveConfig = {
  endThickness: 0.5,
  midThickness: 2.5,
  minHeight: 12,
  maxHeight: 40,
  heightFactor: 0.2,
  noteOffset: 6,
};

// ============================================================================
// CURVE CALCULATION
// ============================================================================

/**
 * Determine optimal curve placement based on stem directions.
 */
export function determineCurvePlacement(
  startStemDir: StemDirection,
  endStemDir: StemDirection,
  startPosition: number,
  endPosition: number,
  override?: 'above' | 'below' | 'auto'
): 'above' | 'below' {
  if (override && override !== 'auto') {
    return override;
  }
  
  // If both stems go same direction, curve goes opposite
  if (startStemDir === endStemDir && startStemDir !== 'auto') {
    return startStemDir === 'up' ? 'below' : 'above';
  }
  
  // If stems go different directions, use average position
  const avgPosition = (startPosition + endPosition) / 2;
  return avgPosition >= 0 ? 'below' : 'above';
}

/**
 * Calculate bezier curve for a tie or slur.
 */
export function calculateCurve(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  placement: 'above' | 'below',
  config: CurveConfig
): BezierCurve {
  const distance = endX - startX;
  
  // Calculate curve height based on distance
  let curveHeight = config.minHeight + distance * config.heightFactor;
  curveHeight = Math.min(curveHeight, config.maxHeight);
  
  // Direction multiplier (above = negative Y, below = positive Y)
  const direction = placement === 'above' ? -1 : 1;
  
  // Control points create the curve shape
  // For natural-looking curves, control points are offset horizontally
  const controlOffset = distance * 0.3;
  
  const control1X = startX + controlOffset;
  const control1Y = startY + direction * curveHeight;
  
  const control2X = endX - controlOffset;
  const control2Y = endY + direction * curveHeight;
  
  return {
    startX,
    startY,
    control1X,
    control1Y,
    control2X,
    control2Y,
    endX,
    endY,
  };
}

/**
 * Adjust curve to avoid collisions with notes.
 */
export function adjustCurveForCollisions(
  curve: BezierCurve,
  obstacles: Array<{ x: number; y: number; width: number; height: number }>,
  placement: 'above' | 'below',
  minClearance: number = 4
): BezierCurve {
  const direction = placement === 'above' ? -1 : 1;
  
  // Sample points along the curve
  const numSamples = 10;
  let maxAdjustment = 0;
  
  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    const point = evaluateBezier(curve, t);
    
    for (const obstacle of obstacles) {
      if (point.x >= obstacle.x - minClearance && 
          point.x <= obstacle.x + obstacle.width + minClearance) {
        const targetY = placement === 'above' 
          ? obstacle.y - minClearance
          : obstacle.y + obstacle.height + minClearance;
        
        const adjustment = Math.abs(point.y - targetY);
        if ((placement === 'above' && point.y > targetY) ||
            (placement === 'below' && point.y < targetY)) {
          maxAdjustment = Math.max(maxAdjustment, adjustment);
        }
      }
    }
  }
  
  if (maxAdjustment === 0) return curve;
  
  // Adjust control points
  return {
    ...curve,
    control1Y: curve.control1Y + direction * maxAdjustment,
    control2Y: curve.control2Y + direction * maxAdjustment,
  };
}

/**
 * Evaluate a point on a cubic bezier curve.
 */
export function evaluateBezier(curve: BezierCurve, t: number): { x: number; y: number } {
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  
  return {
    x: mt3 * curve.startX + 3 * mt2 * t * curve.control1X + 
       3 * mt * t2 * curve.control2X + t3 * curve.endX,
    y: mt3 * curve.startY + 3 * mt2 * t * curve.control1Y + 
       3 * mt * t2 * curve.control2Y + t3 * curve.endY,
  };
}

/**
 * Calculate the bounding box of a bezier curve.
 */
export function getBezierBounds(curve: BezierCurve): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  // Sample points to find bounds
  const numSamples = 20;
  let minX = Math.min(curve.startX, curve.endX);
  let maxX = Math.max(curve.startX, curve.endX);
  let minY = Math.min(curve.startY, curve.endY);
  let maxY = Math.max(curve.startY, curve.endY);
  
  for (let i = 1; i < numSamples; i++) {
    const t = i / numSamples;
    const point = evaluateBezier(curve, t);
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  
  return { minX, minY, maxX, maxY };
}

// ============================================================================
// TIE RENDERING
// ============================================================================

/**
 * Render a tie between two notes.
 */
export function renderTie(
  tie: NoteTie,
  startNoteHead: RenderedNoteHead,
  endNoteHead: RenderedNoteHead,
  startStemDir: StemDirection,
  endStemDir: StemDirection,
  _staff: RenderedStaff,
  config: CurveConfig = DEFAULT_TIE_CONFIG
): RenderedTie {
  const placement = determineCurvePlacement(
    startStemDir,
    endStemDir,
    startNoteHead.staffPosition,
    endNoteHead.staffPosition,
    tie.placement
  );
  
  // Tie attaches to side of note head
  const startX = startNoteHead.x + startNoteHead.dimensions.width;
  const endX = endNoteHead.x;
  
  // Y position at note center, offset by placement
  const offsetY = placement === 'above' 
    ? -config.noteOffset 
    : config.noteOffset;
  
  const startY = startNoteHead.y + offsetY;
  const endY = endNoteHead.y + offsetY;
  
  const curve = calculateCurve(startX, startY, endX, endY, placement, config);
  
  return {
    id: tie.id,
    curve,
    placement,
    thickness: config.midThickness,
  };
}

/**
 * Render a tie that spans across a system break.
 * Returns two partial ties: one ending at system end, one starting at next system.
 */
export function renderSplitTie(
  tie: NoteTie,
  startNoteHead: RenderedNoteHead,
  endNoteHead: RenderedNoteHead,
  startStemDir: StemDirection,
  endStemDir: StemDirection,
  systemEndX: number,
  nextSystemStartX: number,
  _staff: RenderedStaff,
  config: CurveConfig = DEFAULT_TIE_CONFIG
): { firstHalf: RenderedTie; secondHalf: RenderedTie } {
  const placement = determineCurvePlacement(
    startStemDir,
    endStemDir,
    startNoteHead.staffPosition,
    endNoteHead.staffPosition,
    tie.placement
  );
  
  const offsetY = placement === 'above' ? -config.noteOffset : config.noteOffset;
  
  // First half: from start note to system end
  const firstCurve = calculateCurve(
    startNoteHead.x + startNoteHead.dimensions.width,
    startNoteHead.y + offsetY,
    systemEndX,
    startNoteHead.y + offsetY, // Same Y at break
    placement,
    { ...config, heightFactor: config.heightFactor * 0.7 }
  );
  
  // Second half: from system start to end note
  const secondCurve = calculateCurve(
    nextSystemStartX,
    endNoteHead.y + offsetY, // Same Y at break
    endNoteHead.x,
    endNoteHead.y + offsetY,
    placement,
    { ...config, heightFactor: config.heightFactor * 0.7 }
  );
  
  return {
    firstHalf: {
      id: `${tie.id}-1`,
      curve: firstCurve,
      placement,
      thickness: config.midThickness,
    },
    secondHalf: {
      id: `${tie.id}-2`,
      curve: secondCurve,
      placement,
      thickness: config.midThickness,
    },
  };
}

// ============================================================================
// SLUR RENDERING
// ============================================================================

/**
 * Render a slur between two notes.
 */
export function renderSlur(
  slur: NoteSlur,
  startNoteHead: RenderedNoteHead,
  endNoteHead: RenderedNoteHead,
  startStemDir: StemDirection,
  endStemDir: StemDirection,
  _staff: RenderedStaff,
  intermediateNotes: RenderedNoteHead[] = [],
  config: CurveConfig = DEFAULT_SLUR_CONFIG
): RenderedSlur {
  const placement = determineCurvePlacement(
    startStemDir,
    endStemDir,
    startNoteHead.staffPosition,
    endNoteHead.staffPosition,
    slur.placement
  );
  
  // Slur attaches at edges of notes
  const startX = startNoteHead.x + startNoteHead.dimensions.width / 2;
  const endX = endNoteHead.x + endNoteHead.dimensions.width / 2;
  
  // Y offset is larger for slurs than ties
  const offsetY = placement === 'above' 
    ? -config.noteOffset - startNoteHead.dimensions.height / 2
    : config.noteOffset + startNoteHead.dimensions.height / 2;
  
  const startY = startNoteHead.y + offsetY;
  const endOffsetY = placement === 'above'
    ? -config.noteOffset - endNoteHead.dimensions.height / 2
    : config.noteOffset + endNoteHead.dimensions.height / 2;
  const endY = endNoteHead.y + endOffsetY;
  
  let curve = calculateCurve(startX, startY, endX, endY, placement, config);
  
  // Adjust for intermediate notes
  if (intermediateNotes.length > 0) {
    const obstacles = intermediateNotes.map(note => ({
      x: note.x,
      y: note.y - note.dimensions.height / 2,
      width: note.dimensions.width,
      height: note.dimensions.height,
    }));
    curve = adjustCurveForCollisions(curve, obstacles, placement);
  }
  
  return {
    id: slur.id,
    curve,
    placement,
    thickness: config.midThickness,
  };
}

/**
 * Render a phrase mark (long slur spanning many notes).
 */
export function renderPhraseMark(
  id: string,
  notes: RenderedNoteHead[],
  stemDirections: StemDirection[],
  staff: RenderedStaff,
  placement?: 'above' | 'below' | 'auto',
  config: CurveConfig = DEFAULT_SLUR_CONFIG
): RenderedSlur {
  if (notes.length < 2) {
    throw new Error('Phrase mark requires at least 2 notes');
  }
  
  const startNote = notes[0]!;
  const endNote = notes[notes.length - 1]!;
  const intermediateNotes = notes.slice(1, -1);
  
  const slur: NoteSlur = {
    id,
    startNoteId: startNote.id,
    endNoteId: endNote.id,
    placement: placement || 'auto',
  };
  
  return renderSlur(
    slur,
    startNote,
    endNote,
    stemDirections[0]!,
    stemDirections[stemDirections.length - 1]!,
    staff,
    intermediateNotes,
    config
  );
}

// ============================================================================
// SVG PATH GENERATION
// ============================================================================

/**
 * Generate SVG path for a bezier curve with variable thickness.
 */
export function generateCurveSVGPath(
  curve: BezierCurve,
  startThickness: number,
  midThickness: number,
  endThickness: number
): string {
  // Generate two curves: outer and inner
  // This creates a filled shape with varying thickness
  
  const direction = curve.control1Y < curve.startY ? -1 : 1;
  
  // Outer curve (with thickness added)
  const outer = {
    startX: curve.startX,
    startY: curve.startY - direction * startThickness / 2,
    control1X: curve.control1X,
    control1Y: curve.control1Y - direction * midThickness / 2,
    control2X: curve.control2X,
    control2Y: curve.control2Y - direction * midThickness / 2,
    endX: curve.endX,
    endY: curve.endY - direction * endThickness / 2,
  };
  
  // Inner curve (with thickness subtracted)
  const inner = {
    startX: curve.startX,
    startY: curve.startY + direction * startThickness / 2,
    control1X: curve.control1X,
    control1Y: curve.control1Y + direction * midThickness / 2,
    control2X: curve.control2X,
    control2Y: curve.control2Y + direction * midThickness / 2,
    endX: curve.endX,
    endY: curve.endY + direction * endThickness / 2,
  };
  
  return `M ${outer.startX} ${outer.startY} ` +
         `C ${outer.control1X} ${outer.control1Y}, ${outer.control2X} ${outer.control2Y}, ${outer.endX} ${outer.endY} ` +
         `L ${inner.endX} ${inner.endY} ` +
         `C ${inner.control2X} ${inner.control2Y}, ${inner.control1X} ${inner.control1Y}, ${inner.startX} ${inner.startY} ` +
         `Z`;
}

/**
 * Generate simple SVG path for a bezier curve (stroke only).
 */
export function generateSimpleCurvePath(curve: BezierCurve): string {
  return `M ${curve.startX} ${curve.startY} ` +
         `C ${curve.control1X} ${curve.control1Y}, ${curve.control2X} ${curve.control2Y}, ${curve.endX} ${curve.endY}`;
}
