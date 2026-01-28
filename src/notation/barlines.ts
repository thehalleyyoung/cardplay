/**
 * @fileoverview Bar Lines and Measure Rendering.
 * 
 * Handles rendering of:
 * - Single, double, and repeat bar lines
 * - Measure boundaries
 * - Repeat signs and endings
 * 
 * @module @cardplay/core/notation/barlines
 */

import { BarLineType } from './types';
import { RenderedStaff, RenderedSystem } from './staff';

// ============================================================================
// BAR LINE RENDERING
// ============================================================================

/**
 * Bar line thickness constants.
 */
export const BAR_LINE_THICKNESS = {
  thin: 1,
  thick: 4,
  dotRadius: 2,
  dotSpacing: 6,
  lineSpacing: 3,
};

/**
 * Rendered bar line.
 */
export interface RenderedBarLine {
  readonly type: BarLineType;
  readonly x: number;
  readonly startY: number;
  readonly endY: number;
  readonly elements: BarLineElement[];
}

/**
 * Individual bar line element.
 */
export interface BarLineElement {
  readonly type: 'line' | 'dot';
  readonly x: number;
  readonly y?: number;
  readonly startY?: number;
  readonly endY?: number;
  readonly thickness?: number;
  readonly radius?: number;
}

/**
 * Render a bar line for a staff.
 */
export function renderBarLine(
  type: BarLineType,
  staff: RenderedStaff,
  x: number
): RenderedBarLine {
  const startY = staff.y;
  const endY = staff.y + staff.dimensions.height;
  const elements: BarLineElement[] = [];
  
  switch (type) {
    case 'single':
      elements.push({
        type: 'line',
        x,
        startY,
        endY,
        thickness: BAR_LINE_THICKNESS.thin,
      });
      break;
      
    case 'double':
      elements.push({
        type: 'line',
        x,
        startY,
        endY,
        thickness: BAR_LINE_THICKNESS.thin,
      });
      elements.push({
        type: 'line',
        x: x + BAR_LINE_THICKNESS.lineSpacing,
        startY,
        endY,
        thickness: BAR_LINE_THICKNESS.thin,
      });
      break;
      
    case 'end':
      elements.push({
        type: 'line',
        x,
        startY,
        endY,
        thickness: BAR_LINE_THICKNESS.thin,
      });
      elements.push({
        type: 'line',
        x: x + BAR_LINE_THICKNESS.lineSpacing,
        startY,
        endY,
        thickness: BAR_LINE_THICKNESS.thick,
      });
      break;
      
    case 'repeat-start':
      elements.push({
        type: 'line',
        x,
        startY,
        endY,
        thickness: BAR_LINE_THICKNESS.thick,
      });
      elements.push({
        type: 'line',
        x: x + BAR_LINE_THICKNESS.thick + BAR_LINE_THICKNESS.lineSpacing,
        startY,
        endY,
        thickness: BAR_LINE_THICKNESS.thin,
      });
      // Dots
      const dotX1 = x + BAR_LINE_THICKNESS.thick + BAR_LINE_THICKNESS.lineSpacing * 2 + 4;
      const middleY = (startY + endY) / 2;
      elements.push({
        type: 'dot',
        x: dotX1,
        y: middleY - BAR_LINE_THICKNESS.dotSpacing,
        radius: BAR_LINE_THICKNESS.dotRadius,
      });
      elements.push({
        type: 'dot',
        x: dotX1,
        y: middleY + BAR_LINE_THICKNESS.dotSpacing,
        radius: BAR_LINE_THICKNESS.dotRadius,
      });
      break;
      
    case 'repeat-end':
      // Dots
      const dotX2 = x - 4;
      const midY = (startY + endY) / 2;
      elements.push({
        type: 'dot',
        x: dotX2,
        y: midY - BAR_LINE_THICKNESS.dotSpacing,
        radius: BAR_LINE_THICKNESS.dotRadius,
      });
      elements.push({
        type: 'dot',
        x: dotX2,
        y: midY + BAR_LINE_THICKNESS.dotSpacing,
        radius: BAR_LINE_THICKNESS.dotRadius,
      });
      elements.push({
        type: 'line',
        x: x + BAR_LINE_THICKNESS.lineSpacing,
        startY,
        endY,
        thickness: BAR_LINE_THICKNESS.thin,
      });
      elements.push({
        type: 'line',
        x: x + BAR_LINE_THICKNESS.lineSpacing * 2,
        startY,
        endY,
        thickness: BAR_LINE_THICKNESS.thick,
      });
      break;
      
    case 'repeat-both':
      // Combine repeat-end and repeat-start
      const centerX = x;
      const myMidY = (startY + endY) / 2;
      
      // Left dots
      elements.push({
        type: 'dot',
        x: centerX - 8,
        y: myMidY - BAR_LINE_THICKNESS.dotSpacing,
        radius: BAR_LINE_THICKNESS.dotRadius,
      });
      elements.push({
        type: 'dot',
        x: centerX - 8,
        y: myMidY + BAR_LINE_THICKNESS.dotSpacing,
        radius: BAR_LINE_THICKNESS.dotRadius,
      });
      // Lines
      elements.push({
        type: 'line',
        x: centerX - 3,
        startY,
        endY,
        thickness: BAR_LINE_THICKNESS.thin,
      });
      elements.push({
        type: 'line',
        x: centerX,
        startY,
        endY,
        thickness: BAR_LINE_THICKNESS.thick,
      });
      elements.push({
        type: 'line',
        x: centerX + BAR_LINE_THICKNESS.thick + BAR_LINE_THICKNESS.lineSpacing,
        startY,
        endY,
        thickness: BAR_LINE_THICKNESS.thin,
      });
      // Right dots
      elements.push({
        type: 'dot',
        x: centerX + BAR_LINE_THICKNESS.thick + BAR_LINE_THICKNESS.lineSpacing + 8,
        y: myMidY - BAR_LINE_THICKNESS.dotSpacing,
        radius: BAR_LINE_THICKNESS.dotRadius,
      });
      elements.push({
        type: 'dot',
        x: centerX + BAR_LINE_THICKNESS.thick + BAR_LINE_THICKNESS.lineSpacing + 8,
        y: myMidY + BAR_LINE_THICKNESS.dotSpacing,
        radius: BAR_LINE_THICKNESS.dotRadius,
      });
      break;
      
    case 'dashed':
      // Dashed line (segments)
      const dashLength = 4;
      const gapLength = 4;
      let currentY = startY;
      while (currentY < endY) {
        elements.push({
          type: 'line',
          x,
          startY: currentY,
          endY: Math.min(currentY + dashLength, endY),
          thickness: BAR_LINE_THICKNESS.thin,
        });
        currentY += dashLength + gapLength;
      }
      break;
      
    case 'dotted':
      // Dotted line
      const dotSpacing = 4;
      let dotY = startY;
      while (dotY <= endY) {
        elements.push({
          type: 'dot',
          x,
          y: dotY,
          radius: 1,
        });
        dotY += dotSpacing;
      }
      break;
      
    case 'none':
      // No bar line
      break;
  }
  
  return {
    type,
    x,
    startY,
    endY,
    elements,
  };
}

/**
 * Render a system bar line (connecting multiple staves).
 */
export function renderSystemBarLine(
  type: BarLineType,
  system: RenderedSystem,
  x: number
): RenderedBarLine {
  if (system.staves.length === 0) {
    return { type, x, startY: 0, endY: 0, elements: [] };
  }
  
  const firstStaff = system.staves[0]!;
  const lastStaff = system.staves[system.staves.length - 1]!;
  const startY = firstStaff.y;
  const endY = lastStaff.y + lastStaff.dimensions.height;
  
  // Create a virtual staff spanning the entire system
  const virtualStaff: RenderedStaff = {
    ...firstStaff,
    y: startY,
    dimensions: {
      ...firstStaff.dimensions,
      height: endY - startY,
    },
  };
  
  return renderBarLine(type, virtualStaff, x);
}

/**
 * Get width needed for a bar line type.
 */
export function getBarLineWidth(type: BarLineType): number {
  switch (type) {
    case 'single':
      return BAR_LINE_THICKNESS.thin + 4;
    case 'double':
      return BAR_LINE_THICKNESS.thin * 2 + BAR_LINE_THICKNESS.lineSpacing + 4;
    case 'end':
      return BAR_LINE_THICKNESS.thin + BAR_LINE_THICKNESS.thick + BAR_LINE_THICKNESS.lineSpacing + 4;
    case 'repeat-start':
      return BAR_LINE_THICKNESS.thick + BAR_LINE_THICKNESS.thin + BAR_LINE_THICKNESS.lineSpacing * 2 + 12;
    case 'repeat-end':
      return BAR_LINE_THICKNESS.thick + BAR_LINE_THICKNESS.thin + BAR_LINE_THICKNESS.lineSpacing * 2 + 12;
    case 'repeat-both':
      return BAR_LINE_THICKNESS.thick + BAR_LINE_THICKNESS.thin * 2 + BAR_LINE_THICKNESS.lineSpacing * 2 + 20;
    case 'dashed':
    case 'dotted':
      return BAR_LINE_THICKNESS.thin + 4;
    case 'none':
      return 0;
    default:
      return BAR_LINE_THICKNESS.thin + 4;
  }
}

// ============================================================================
// REPEAT ENDINGS (VOLTAS)
// ============================================================================

/**
 * Repeat ending (volta bracket).
 */
export interface RepeatEnding {
  readonly number: number | number[];
  readonly startMeasure: number;
  readonly endMeasure: number;
  readonly isOpen: boolean; // True if bracket doesn't close on right
}

/**
 * Rendered repeat ending.
 */
export interface RenderedRepeatEnding {
  readonly numbers: string;
  readonly startX: number;
  readonly endX: number;
  readonly y: number;
  readonly height: number;
  readonly isOpen: boolean;
}

/**
 * Render a repeat ending bracket.
 */
export function renderRepeatEnding(
  ending: RepeatEnding,
  startX: number,
  endX: number,
  staffY: number,
  aboveStaffOffset: number = 30
): RenderedRepeatEnding {
  const y = staffY - aboveStaffOffset;
  const height = 15;
  
  const numbers = Array.isArray(ending.number)
    ? ending.number.join(', ')
    : String(ending.number);
  
  return {
    numbers: `${numbers}.`,
    startX,
    endX,
    y,
    height,
    isOpen: ending.isOpen,
  };
}

// ============================================================================
// CODA & SEGNO
// ============================================================================

/**
 * Coda/Segno symbol type.
 */
export type NavigationSymbol = 'coda' | 'segno' | 'dacapo' | 'dalsegno' | 'fine';

/**
 * Navigation symbol glyph paths.
 */
export const NAVIGATION_GLYPHS: Record<NavigationSymbol, string> = {
  'coda': 'M0 -16v32M-16 0h32M0 0a8 8 0 1 1 0 0.1z',
  'segno': 'M-8 -12l16 24M-8 12l16 -24M-12 0a4 4 0 1 1 0 0.1zM12 0a4 4 0 1 1 0 0.1z',
  'dacapo': '', // Text only: "D.C."
  'dalsegno': '', // Text only: "D.S."
  'fine': '', // Text only: "Fine"
};

/**
 * Rendered navigation symbol.
 */
export interface RenderedNavigationSymbol {
  readonly type: NavigationSymbol;
  readonly x: number;
  readonly y: number;
  readonly glyph: string;
  readonly text?: string;
}

/**
 * Render a navigation symbol.
 */
export function renderNavigationSymbol(
  type: NavigationSymbol,
  x: number,
  y: number
): RenderedNavigationSymbol {
  const textMap: Record<NavigationSymbol, string | undefined> = {
    'coda': undefined,
    'segno': undefined,
    'dacapo': 'D.C.',
    'dalsegno': 'D.S.',
    'fine': 'Fine',
  };
  
  const text = textMap[type];
  return {
    type,
    x,
    y,
    glyph: NAVIGATION_GLYPHS[type],
    ...(text !== undefined ? { text } : {}),
  };
}
