/**
 * @fileoverview Handwriting recognition and notation OCR.
 * 
 * Provides gesture-based input for stylus/touch and optical music recognition
 * for importing scanned scores.
 * 
 * @module @cardplay/core/notation/input-recognition
 */

import type { NoteEvent, MIDIPitch } from '../voices';
import { createMIDIPitch } from '../voices';
import { EventKinds, asEventId, asTick, asTickDuration } from '../types';
import type { KeySignature, TimeSignature } from './types.js';

// ============================================================================
// HANDWRITING RECOGNITION (STYLUS INPUT)
// ============================================================================

/**
 * Stroke point from stylus/touch input.
 */
export interface StrokePoint {
  readonly x: number;
  readonly y: number;
  readonly pressure?: number;
  readonly timestamp: number;
}

/**
 * Complete stroke (continuous pen/touch gesture).
 */
export interface Stroke {
  readonly points: ReadonlyArray<StrokePoint>;
  readonly startTime: number;
  readonly endTime: number;
}

/**
 * Recognized notation symbol.
 */
export interface RecognizedSymbol {
  readonly type: SymbolType;
  readonly confidence: number; // 0-1
  readonly boundingBox: BoundingBox;
  readonly value?: any; // Type-specific value (pitch, duration, etc.)
}

/**
 * Symbol types that can be recognized.
 */
export type SymbolType =
  | 'notehead'
  | 'stem'
  | 'flag'
  | 'beam'
  | 'rest'
  | 'accidental'
  | 'clef'
  | 'timesig'
  | 'keysig'
  | 'barline'
  | 'slur'
  | 'tie'
  | 'dynamic'
  | 'articulation';

/**
 * Bounding box for recognized symbol.
 */
export interface BoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Recognize notation symbols from strokes.
 * Uses simple pattern matching - in production would use ML model.
 */
export function recognizeStrokes(
  strokes: ReadonlyArray<Stroke>
): ReadonlyArray<RecognizedSymbol> {
  const symbols: RecognizedSymbol[] = [];
  
  for (const stroke of strokes) {
    const symbol = recognizeSingleStroke(stroke);
    if (symbol) {
      symbols.push(symbol);
    }
  }
  
  return symbols;
}

/**
 * Recognize a single stroke as a notation symbol.
 */
function recognizeSingleStroke(stroke: Stroke): RecognizedSymbol | null {
  const bbox = calculateBoundingBox(stroke);
  const aspectRatio = bbox.width / bbox.height;
  const strokeLength = calculateStrokeLength(stroke);
  
  // Simple heuristics for common shapes
  
  // Vertical line (likely stem)
  if (aspectRatio < 0.3 && strokeLength > 30) {
    return {
      type: 'stem',
      confidence: 0.8,
      boundingBox: bbox,
    };
  }
  
  // Circular shape (likely notehead)
  if (isCircular(stroke)) {
    return {
      type: 'notehead',
      confidence: 0.7,
      boundingBox: bbox,
      value: { filled: true }, // Assume quarter note
    };
  }
  
  // Horizontal line (likely beam)
  if (aspectRatio > 3 && strokeLength > 40) {
    return {
      type: 'beam',
      confidence: 0.75,
      boundingBox: bbox,
    };
  }
  
  // S-curve (likely clef)
  if (hasSCurve(stroke) && bbox.height > 60) {
    return {
      type: 'clef',
      confidence: 0.6,
      boundingBox: bbox,
      value: { clef: 'treble' },
    };
  }
  
  return null; // Unrecognized
}

/**
 * Calculate bounding box of stroke.
 */
function calculateBoundingBox(stroke: Stroke): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (const point of stroke.points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  
  return {
    x: minX,
    y: minY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  };
}

/**
 * Calculate total length of stroke path.
 */
function calculateStrokeLength(stroke: Stroke): number {
  let length = 0;
  for (let i = 1; i < stroke.points.length; i++) {
    const curr = stroke.points[i];
    const prev = stroke.points[i - 1];
    if (!curr || !prev) continue;
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

/**
 * Check if stroke forms a circular shape.
 */
function isCircular(stroke: Stroke): boolean {
  if (stroke.points.length < 10) return false;
  
  const bbox = calculateBoundingBox(stroke);
  const center = {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height / 2,
  };
  
  // Calculate average distance from center
  let avgRadius = 0;
  for (const point of stroke.points) {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    avgRadius += Math.sqrt(dx * dx + dy * dy);
  }
  avgRadius /= stroke.points.length;
  
  // Check if distances are relatively uniform (low variance)
  let variance = 0;
  for (const point of stroke.points) {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    variance += Math.pow(radius - avgRadius, 2);
  }
  variance /= stroke.points.length;
  
  // Low variance indicates circular shape
  return variance / (avgRadius * avgRadius) < 0.1;
}

/**
 * Check if stroke has S-curve characteristic of treble clef.
 */
function hasSCurve(stroke: Stroke): boolean {
  if (stroke.points.length < 20) return false;
  
  // Check for direction changes in x-coordinate
  let directionChanges = 0;
  let prevDx = 0;
  
  for (let i = 1; i < stroke.points.length; i++) {
    const curr = stroke.points[i];
    const prev = stroke.points[i - 1];
    if (!curr || !prev) continue;
    const dx = curr.x - prev.x;
    if (Math.sign(dx) !== Math.sign(prevDx) && dx !== 0) {
      directionChanges++;
    }
    prevDx = dx;
  }
  
  // S-curve should have 2-4 direction changes
  return directionChanges >= 2 && directionChanges <= 4;
}

/**
 * Convert recognized symbols to notation events.
 */
export function symbolsToEvents(
  symbols: ReadonlyArray<RecognizedSymbol>,
  staffSpacing: number = 10
): ReadonlyArray<NoteEvent<MIDIPitch>> {
  const events: NoteEvent<MIDIPitch>[] = [];
  const noteheads = symbols.filter(s => s.type === 'notehead');
  
  for (let i = 0; i < noteheads.length; i++) {
    const notehead = noteheads[i];
    if (!notehead) continue;
    
    // Estimate pitch from Y position on staff
    const pitchOffset = Math.round((300 - notehead.boundingBox.y) / staffSpacing);
    const midiNote = 60 + pitchOffset; // Middle C + offset
    
    // Estimate timing from X position
    const startTick = Math.round(notehead.boundingBox.x * 2);
    
    events.push({
      id: asEventId(`recognized-${i}`),
      kind: EventKinds.NOTE,
      start: asTick(startTick),
      duration: asTickDuration(480), // Quarter note
      payload: {
        pitch: createMIDIPitch(midiNote),
        velocity: 64,
        channel: 0,
      },
    });
  }
  
  return events;
}

// ============================================================================
// OPTICAL MUSIC RECOGNITION (OCR FROM IMAGE)
// ============================================================================

/**
 * OMR result from image analysis.
 */
export interface OMRResult {
  readonly events: ReadonlyArray<NoteEvent<MIDIPitch>>;
  readonly key?: KeySignature;
  readonly time?: TimeSignature;
  readonly confidence: number;
  readonly warnings: ReadonlyArray<string>;
}

/**
 * Perform optical music recognition on image.
 * Simplified implementation - in production would use specialized OMR library.
 */
export async function recognizeScoreImage(
  imageData: ImageData,
  options: {
    staffSpacing?: number;
    expectedKey?: KeySignature;
    expectedTime?: TimeSignature;
  } = {}
): Promise<OMRResult> {
  const warnings: string[] = [];
  
  // Detect staff lines
  const staffLines = detectStaffLines(imageData);
  if (staffLines.length === 0) {
    warnings.push('No staff lines detected');
  }
  
  // Detect symbols on staves
  const symbols = detectSymbolsOnStaves(imageData, staffLines);
  
  // Convert symbols to events
  const events = symbolsToEvents(symbols, options.staffSpacing || 10);
  
  const result: OMRResult = {
    events,
    confidence: symbols.length > 0 ? 0.6 : 0.0,
    warnings,
  };
  
  if (options.expectedKey) {
    (result as any).key = options.expectedKey;
  }
  if (options.expectedTime) {
    (result as any).time = options.expectedTime;
  }
  
  return result;
}

/**
 * Detect staff lines in image using horizontal line detection.
 */
function detectStaffLines(imageData: ImageData): ReadonlyArray<number> {
  const { width, height, data } = imageData;
  const staffLines: number[] = [];
  
  // Scan horizontal rows for continuous dark lines
  for (let y = 0; y < height; y++) {
    let darkPixelCount = 0;
    
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (r === undefined || g === undefined || b === undefined) continue;
      const brightness = (r + g + b) / 3;
      
      if (brightness < 128) {
        // Dark pixel
        darkPixelCount++;
      }
    }
    
    // If most pixels in row are dark, it's likely a staff line
    if (darkPixelCount > width * 0.7) {
      // Check if not too close to previous line
      const lastLine = staffLines[staffLines.length - 1];
      if (staffLines.length === 0 || (lastLine !== undefined && y - lastLine > 5)) {
        staffLines.push(y);
      }
    }
  }
  
  return staffLines;
}

/**
 * Detect notation symbols on detected staff lines.
 */
function detectSymbolsOnStaves(
  imageData: ImageData,
  staffLines: ReadonlyArray<number>
): ReadonlyArray<RecognizedSymbol> {
  const symbols: RecognizedSymbol[] = [];
  
  if (staffLines.length < 5) {
    return symbols; // Need at least 5 lines for a staff
  }
  
  // Simple blob detection for noteheads
  // In production, would use connected component analysis
  const { width, height } = imageData;
  // const firstLine = staffLines[0] || 0;
  // const secondLine = staffLines[1] || (firstLine + 10);
  // const staffSpacing = secondLine - firstLine; // Unused for now
  
  for (let y = 0; y < height - 20; y += 10) {
    for (let x = 0; x < width - 20; x += 10) {
      // Check for oval-shaped dark region (notehead)
      if (isNoteheadRegion(imageData, x, y, 20, 15)) {
        symbols.push({
          type: 'notehead',
          confidence: 0.5,
          boundingBox: { x, y, width: 20, height: 15 },
          value: { filled: true },
        });
      }
    }
  }
  
  return symbols;
}

/**
 * Check if region likely contains a notehead.
 */
function isNoteheadRegion(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  const { width: imgWidth, data } = imageData;
  let darkPixelCount = 0;
  let totalPixels = 0;
  
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const px = x + dx;
      const py = y + dy;
      const idx = (py * imgWidth + px) * 4;
      
      if (idx < data.length - 3) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        if (r !== undefined && g !== undefined && b !== undefined) {
          const brightness = (r + g + b) / 3;
          totalPixels++;
          if (brightness < 128) {
            darkPixelCount++;
          }
        }
      }
    }
  }
  
  // Notehead should be 30-70% filled
  const fillRatio = darkPixelCount / totalPixels;
  return fillRatio > 0.3 && fillRatio < 0.7;
}

/**
 * Process scanned score PDF pages.
 */
export async function processScannedScore(
  _pdfBlob: Blob
): Promise<ReadonlyArray<OMRResult>> {
  // In production, would:
  // 1. Use pdf.js to extract pages as images
  // 2. Process each page with recognizeScoreImage
  // 3. Combine results
  
  const results: OMRResult[] = [];
  
  // Placeholder implementation
  results.push({
    events: [],
    confidence: 0,
    warnings: ['PDF processing not yet implemented'],
  });
  
  return results;
}
