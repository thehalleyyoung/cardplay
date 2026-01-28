/**
 * @fileoverview Staff Rendering.
 * 
 * Provides staff line rendering including:
 * - Five-line staff generation
 * - Clef rendering at staff start
 * - Key signature rendering
 * - Time signature rendering
 * - Ledger line calculation
 * 
 * @module @cardplay/core/notation/staff
 */

import {
  ClefType,
  CLEF_DEFINITIONS,
  KEY_SIGNATURES,
  TimeSignature,
  TimeSignatureDisplay,
  COMMON_TIME_SIGNATURES,
  StaffConfig,
  GrandStaff,
  SystemConfig,
  AccidentalType,
} from './types';

// ============================================================================
// STAFF DIMENSIONS
// ============================================================================

/**
 * Staff rendering dimensions.
 */
export interface StaffDimensions {
  /** Space between staff lines in pixels */
  readonly lineSpacing: number;
  /** Staff line thickness in pixels */
  readonly lineThickness: number;
  /** Total staff height (4 spaces = 5 lines) */
  readonly height: number;
  /** Horizontal margin before first element */
  readonly leftMargin: number;
  /** Horizontal margin after last element */
  readonly rightMargin: number;
}

/**
 * Default staff dimensions.
 */
export const DEFAULT_STAFF_DIMENSIONS: StaffDimensions = {
  lineSpacing: 10,
  lineThickness: 1,
  height: 40, // 4 * 10
  leftMargin: 20,
  rightMargin: 20,
};

/**
 * Staff dimension presets.
 */
export const STAFF_DIMENSION_PRESETS: Record<string, StaffDimensions> = {
  small: {
    lineSpacing: 7,
    lineThickness: 0.8,
    height: 28,
    leftMargin: 15,
    rightMargin: 15,
  },
  medium: DEFAULT_STAFF_DIMENSIONS,
  large: {
    lineSpacing: 14,
    lineThickness: 1.2,
    height: 56,
    leftMargin: 25,
    rightMargin: 25,
  },
  print: {
    lineSpacing: 8,
    lineThickness: 0.5,
    height: 32,
    leftMargin: 20,
    rightMargin: 20,
  },
};

// ============================================================================
// STAFF LINE RENDERING
// ============================================================================

/**
 * Rendered staff line.
 */
export interface StaffLine {
  /** Line number (1-5 from bottom) */
  readonly lineNumber: number;
  /** Y position from staff top */
  readonly y: number;
  /** Start X position */
  readonly startX: number;
  /** End X position */
  readonly endX: number;
  /** Line thickness */
  readonly thickness: number;
}

/**
 * Rendered staff.
 */
export interface RenderedStaff {
  readonly id: string;
  readonly config: StaffConfig;
  readonly dimensions: StaffDimensions;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly lines: StaffLine[];
}

/**
 * Calculate staff line positions.
 */
export function calculateStaffLines(
  staffId: string,
  config: StaffConfig,
  dimensions: StaffDimensions,
  x: number,
  y: number,
  width: number
): RenderedStaff {
  const lines: StaffLine[] = [];
  const numLines = config.lines || 5;
  
  for (let i = 1; i <= numLines; i++) {
    // Line 1 is bottom, line 5 is top
    // Y increases downward, so line 1 has largest Y
    const lineY = y + dimensions.height - (i - 1) * dimensions.lineSpacing;
    
    lines.push({
      lineNumber: i,
      y: lineY,
      startX: x + dimensions.leftMargin,
      endX: x + width - dimensions.rightMargin,
      thickness: dimensions.lineThickness,
    });
  }
  
  return {
    id: staffId,
    config,
    dimensions,
    x,
    y,
    width,
    lines,
  };
}

/**
 * Get Y position for a given staff position (line or space).
 * Position 0 = middle line, positive = up, negative = down.
 */
export function getStaffPositionY(
  staff: RenderedStaff,
  position: number
): number {
  // Middle line is line 3 (for 5-line staff), which is position 0
  const middleLine = Math.ceil(staff.config.lines / 2);
  const lineFromMiddle = position / 2; // Each position is half a line spacing
  
  // Y of middle line
  const middleY = staff.y + staff.dimensions.height - (middleLine - 1) * staff.dimensions.lineSpacing;
  
  // Subtract because positive positions are upward
  return middleY - lineFromMiddle * staff.dimensions.lineSpacing;
}

/**
 * Get staff position from MIDI pitch number.
 */
export function midiToStaffPosition(
  pitch: number,
  clef: ClefType,
  _accidental?: AccidentalType
): { position: number; ledgerLines: number } {
  const clefDef = CLEF_DEFINITIONS[clef];
  
  // Get octave and note within octave
  const octave = Math.floor(pitch / 12) - 1;
  const noteInOctave = pitch % 12;
  
  // Map chromatic to diatonic (0,1->C, 2,3->D, 4->E, 5,6->F, 7,8->G, 9,10->A, 11->B)
  const chromaticToDiatonic = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  const diatonicNote = chromaticToDiatonic[noteInOctave] ?? 0;
  
  // Calculate position relative to middle line pitch
  const middleOctave = Math.floor(clefDef.middleLinePitch / 12) - 1;
  const middleNoteInOctave = clefDef.middleLinePitch % 12;
  const middleDiatonic = chromaticToDiatonic[middleNoteInOctave] ?? 0;
  
  // Position difference
  const octaveDiff = octave - middleOctave;
  const noteDiff = diatonicNote - middleDiatonic;
  const position = octaveDiff * 7 + noteDiff; // 7 diatonic notes per octave
  
  // Calculate ledger lines needed
  // Staff positions -4 to 4 are on the staff (for 5-line staff)
  let ledgerLines = 0;
  if (position > 4) {
    ledgerLines = Math.floor((position - 4) / 2) + ((position - 4) % 2 === 0 ? 0 : 0);
    ledgerLines = Math.ceil((position - 4) / 2);
  } else if (position < -4) {
    ledgerLines = Math.ceil((-4 - position) / 2);
  }
  
  return { position, ledgerLines };
}

// ============================================================================
// CLEF RENDERING
// ============================================================================

/**
 * Clef glyph paths (simplified SVG path data).
 */
export const CLEF_GLYPHS: Record<ClefType, string> = {
  treble: 'M11.4 -31.2c0 -4 -2.4 -7.2 -6.4 -7.2c-3.2 0 -5.6 2.4 -5.6 5.6c0 3.2 2.8 6 6 6c0.8 0 1.6 0 2.4 -0.4v0.4c0 4.4 -3.2 10 -8.4 14.8l-0.8 -3.2c-2 -8.4 -6.8 -16.4 -10.8 -20.8c-3.6 -4 -7.2 -5.2 -9.6 -5.2c-3.2 0 -5.6 2 -5.6 5.2c0 3.2 2.4 5.6 5.6 5.6c2 0 4 -1.2 4 -3.6c0 -2 -1.6 -3.6 -3.6 -3.6c-0.4 0 -1.2 0 -1.6 0.4c0.8 -0.8 2.4 -1.2 4 -1.2c4 0 7.6 4.4 10 10l1.6 6c-4.8 5.2 -8 11.2 -8 17.6c0 6 3.6 12 10 12c6 0 10.4 -5.2 10.4 -11.6c0 -5.6 -3.2 -10.4 -7.6 -13.6z',
  bass: 'M-28 -14c0 -4.8 3.6 -8.4 8 -8.4c4 0 7.2 3.2 7.2 7.2c0 4.4 -3.2 8 -8 8c-4.4 0 -7.2 -3.2 -7.2 -6.8zM-9.2 -6c1.6 0 2.8 1.2 2.8 2.8c0 1.6 -1.2 2.8 -2.8 2.8c-1.6 0 -2.8 -1.2 -2.8 -2.8c0 -1.6 1.2 -2.8 2.8 -2.8zM-9.2 6c1.6 0 2.8 1.2 2.8 2.8c0 1.6 -1.2 2.8 -2.8 2.8c-1.6 0 -2.8 -1.2 -2.8 -2.8c0 -1.6 1.2 -2.8 2.8 -2.8z',
  alto: 'M-4 -16h4v32h-4zM4 -16c8 0 12 6 12 16c0 10 -4 16 -12 16h-4v-32h4z',
  tenor: 'M-4 -16h4v32h-4zM4 -16c8 0 12 6 12 16c0 10 -4 16 -12 16h-4v-32h4z',
  soprano: 'M-4 -16h4v32h-4zM4 -16c8 0 12 6 12 16c0 10 -4 16 -12 16h-4v-32h4z',
  'mezzo-soprano': 'M-4 -16h4v32h-4zM4 -16c8 0 12 6 12 16c0 10 -4 16 -12 16h-4v-32h4z',
  baritone: 'M-4 -16h4v32h-4zM4 -16c8 0 12 6 12 16c0 10 -4 16 -12 16h-4v-32h4z',
  percussion: 'M-8 -12h4v24h-4zM4 -12h4v24h-4z',
  tab: 'TAB', // Special text rendering
};

/**
 * Clef rendering information.
 */
export interface RenderedClef {
  readonly type: ClefType;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly glyph: string;
  readonly scale: number;
}

/**
 * Calculate clef rendering position.
 */
export function renderClef(
  staff: RenderedStaff,
  clef: ClefType,
  x: number
): RenderedClef {
  const clefDef = CLEF_DEFINITIONS[clef];
  const lineY = getStaffPositionY(staff, (clefDef.line - 3) * 2); // Convert line to position
  
  // Clef-specific sizing
  const clefSizes: Record<ClefType, { width: number; height: number; scale: number }> = {
    treble: { width: 28, height: 60, scale: 0.8 },
    bass: { width: 32, height: 30, scale: 0.8 },
    alto: { width: 20, height: 40, scale: 0.8 },
    tenor: { width: 20, height: 40, scale: 0.8 },
    soprano: { width: 20, height: 40, scale: 0.8 },
    'mezzo-soprano': { width: 20, height: 40, scale: 0.8 },
    baritone: { width: 20, height: 40, scale: 0.8 },
    percussion: { width: 16, height: 28, scale: 0.8 },
    tab: { width: 24, height: 40, scale: 1.0 },
  };
  
  const size = clefSizes[clef];
  
  return {
    type: clef,
    x,
    y: lineY - size.height / 2,
    width: size.width,
    height: size.height,
    glyph: CLEF_GLYPHS[clef],
    scale: size.scale,
  };
}

/**
 * Get width needed for clef rendering.
 */
export function getClefWidth(clef: ClefType): number {
  const widths: Record<ClefType, number> = {
    treble: 36,
    bass: 36,
    alto: 28,
    tenor: 28,
    soprano: 28,
    'mezzo-soprano': 28,
    baritone: 28,
    percussion: 24,
    tab: 32,
  };
  return widths[clef];
}

// ============================================================================
// KEY SIGNATURE RENDERING
// ============================================================================

/**
 * Sharp positions on staff (line/space numbers for each sharp in order).
 * F#, C#, G#, D#, A#, E#, B#
 * Position 0 = middle line (B4 in treble), +2 = one line up, -2 = one line down
 */
export const SHARP_POSITIONS: Record<ClefType, number[]> = {
  treble: [4, 1, 5, 2, -1, 3, 0],    // F# on top line (4), C# in 3rd space (1), G# above staff (5), D# on 4th line (2), A# in 2nd space (-1), E# in 4th space (3), B# on middle line (0)
  bass: [2, -1, 3, 0, -3, 1, -2],    // Shifted down by 1 from previous
  alto: [3, 0, 4, 1, -2, 2, -1],     // Shifted down by 1
  tenor: [1, -2, 2, -1, -4, 0, -3],  // Shifted down by 1
  soprano: [3, 0, 4, 1, -2, 2, -1],
  'mezzo-soprano': [3, 0, 4, 1, -2, 2, -1],
  baritone: [3, 0, 4, 1, -2, 2, -1],
  percussion: [],
  tab: [],
};

/**
 * Flat positions on staff (line/space numbers for each flat in order).
 * Bb, Eb, Ab, Db, Gb, Cb, Fb
 */
export const FLAT_POSITIONS: Record<ClefType, number[]> = {
  treble: [1, 4, 0, 3, -1, 2, -2],
  bass: [-1, 2, -2, 1, -3, 0, -4],
  alto: [0, 3, -1, 2, -2, 1, -3],
  tenor: [-2, 1, -3, 0, -4, -1, -5],
  soprano: [0, 3, -1, 2, -2, 1, -3],
  'mezzo-soprano': [0, 3, -1, 2, -2, 1, -3],
  baritone: [0, 3, -1, 2, -2, 1, -3],
  percussion: [],
  tab: [],
};

/**
 * Key signature accidental.
 */
export interface KeySigAccidental {
  readonly type: 'sharp' | 'flat';
  readonly x: number;
  readonly y: number;
  readonly position: number;
}

/**
 * Rendered key signature.
 */
export interface RenderedKeySignature {
  readonly key: string;
  readonly accidentals: KeySigAccidental[];
  readonly x: number;
  readonly width: number;
}

/**
 * Calculate key signature rendering.
 */
export function renderKeySignature(
  staff: RenderedStaff,
  keyName: string,
  startX: number
): RenderedKeySignature {
  const keySig = KEY_SIGNATURES[keyName];
  if (!keySig) {
    return { key: keyName, accidentals: [], x: startX, width: 0 };
  }
  
  const accidentals: KeySigAccidental[] = [];
  const numAccidentals = Math.abs(keySig.accidentals);
  const isSharp = keySig.accidentals > 0;
  
  const positions = isSharp 
    ? SHARP_POSITIONS[staff.config.clef]
    : FLAT_POSITIONS[staff.config.clef];
  
  const accidentalSpacing = 10;
  let x = startX + 5;
  
  for (let i = 0; i < numAccidentals && i < positions.length; i++) {
    const position = positions[i];
    if (position === undefined) continue;
    const y = getStaffPositionY(staff, position);
    
    accidentals.push({
      type: isSharp ? 'sharp' : 'flat',
      x,
      y,
      position,
    });
    
    x += accidentalSpacing;
  }
  
  return {
    key: keyName,
    accidentals,
    x: startX,
    width: numAccidentals > 0 ? numAccidentals * accidentalSpacing + 10 : 0,
  };
}

/**
 * Get width needed for key signature.
 */
export function getKeySignatureWidth(keyName: string): number {
  const keySig = KEY_SIGNATURES[keyName];
  if (!keySig) return 0;
  
  const numAccidentals = Math.abs(keySig.accidentals);
  return numAccidentals > 0 ? numAccidentals * 10 + 15 : 0;
}

// ============================================================================
// TIME SIGNATURE RENDERING
// ============================================================================

/**
 * Rendered time signature.
 */
export interface RenderedTimeSignature {
  readonly signature: TimeSignature;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly display: TimeSignatureDisplay;
  readonly numeratorText?: string;
  readonly denominatorText?: string;
}

/**
 * Calculate time signature rendering.
 */
export function renderTimeSignature(
  staff: RenderedStaff,
  timeSigName: string,
  startX: number
): RenderedTimeSignature {
  const timeSig = COMMON_TIME_SIGNATURES[timeSigName] || parseTimeSignature(timeSigName);
  const display = timeSig.display || 'numeric';
  
  const y = staff.y;
  const height = staff.dimensions.height;
  const width = display === 'numeric' ? 24 : 20;
  
  const result: RenderedTimeSignature = {
    signature: timeSig,
    x: startX + 5,
    y,
    width,
    height,
    display,
  };
  
  if (display === 'numeric') {
    return {
      ...result,
      numeratorText: String(timeSig.numerator),
      denominatorText: String(timeSig.denominator),
    };
  }
  
  return result;
}

/**
 * Parse time signature from string like "6/8".
 */
export function parseTimeSignature(str: string): TimeSignature {
  if (str === 'C' || str === 'common') {
    return { numerator: 4, denominator: 4, display: 'common' };
  }
  if (str === 'cut' || str === 'alla-breve') {
    return { numerator: 2, denominator: 2, display: 'cut' };
  }
  
  const parts = str.split('/');
  if (parts.length !== 2 || parts[0] === undefined || parts[1] === undefined) {
    return { numerator: 4, denominator: 4 };
  }
  
  return {
    numerator: parseInt(parts[0], 10) || 4,
    denominator: parseInt(parts[1], 10) || 4,
  };
}

/**
 * Get width needed for time signature.
 */
export function getTimeSignatureWidth(timeSigName: string): number {
  const timeSig = COMMON_TIME_SIGNATURES[timeSigName] || parseTimeSignature(timeSigName);
  return timeSig.display === 'numeric' ? 28 : 24;
}

// ============================================================================
// LEDGER LINE RENDERING
// ============================================================================

/**
 * Ledger line information.
 */
export interface LedgerLine {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly thickness: number;
  readonly isAbove: boolean;
}

/**
 * Calculate ledger lines needed for a note at given staff position.
 */
export function calculateLedgerLines(
  staff: RenderedStaff,
  staffPosition: number,
  noteX: number,
  noteWidth: number
): LedgerLine[] {
  const ledgerLines: LedgerLine[] = [];
  
  // Positions for 5-line staff: lines at -4, -2, 0, 2, 4
  // Notes above position 4 need ledger lines
  // Notes below position -4 need ledger lines
  
  const ledgerLineWidth = noteWidth + 8; // Extend slightly beyond note
  const ledgerLineThickness = staff.dimensions.lineThickness;
  
  if (staffPosition > 4) {
    // Ledger lines above staff
    // First ledger line at position 6, then 8, 10, etc.
    for (let pos = 6; pos <= staffPosition; pos += 2) {
      const y = getStaffPositionY(staff, pos);
      ledgerLines.push({
        x: noteX - 4,
        y,
        width: ledgerLineWidth,
        thickness: ledgerLineThickness,
        isAbove: true,
      });
    }
  } else if (staffPosition < -4) {
    // Ledger lines below staff
    // First ledger line at position -6, then -8, -10, etc.
    for (let pos = -6; pos >= staffPosition; pos -= 2) {
      const y = getStaffPositionY(staff, pos);
      ledgerLines.push({
        x: noteX - 4,
        y,
        width: ledgerLineWidth,
        thickness: ledgerLineThickness,
        isAbove: false,
      });
    }
  }
  
  return ledgerLines;
}

// ============================================================================
// GRAND STAFF RENDERING
// ============================================================================

/**
 * Rendered grand staff (piano).
 */
export interface RenderedGrandStaff {
  readonly id: string;
  readonly trebleStaff: RenderedStaff;
  readonly bassStaff: RenderedStaff;
  readonly braceX: number;
  readonly braceY: number;
  readonly braceHeight: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Default grand staff configuration.
 */
export function createDefaultGrandStaff(id: string): GrandStaff {
  return {
    id,
    trebleStaff: {
      id: `${id}-treble`,
      clef: 'treble',
      keySignature: 'C',
      timeSignature: '4/4',
      lines: 5,
      visible: true,
      label: 'Piano',
    },
    bassStaff: {
      id: `${id}-bass`,
      clef: 'bass',
      keySignature: 'C',
      timeSignature: '4/4',
      lines: 5,
      visible: true,
    },
    showBrace: true,
    label: 'Piano',
  };
}

/**
 * Calculate grand staff rendering.
 */
export function renderGrandStaff(
  config: GrandStaff,
  dimensions: StaffDimensions,
  x: number,
  y: number,
  width: number,
  staffGap: number = 60
): RenderedGrandStaff {
  const trebleStaff = calculateStaffLines(
    config.trebleStaff.id,
    config.trebleStaff,
    dimensions,
    x,
    y,
    width
  );
  
  const bassY = y + dimensions.height + staffGap;
  const bassStaff = calculateStaffLines(
    config.bassStaff.id,
    config.bassStaff,
    dimensions,
    x,
    bassY,
    width
  );
  
  const totalHeight = dimensions.height * 2 + staffGap;
  
  return {
    id: config.id,
    trebleStaff,
    bassStaff,
    braceX: x + 5,
    braceY: y,
    braceHeight: totalHeight,
    x,
    y,
    width,
    height: totalHeight,
  };
}

// ============================================================================
// SYSTEM RENDERING
// ============================================================================

/**
 * Rendered system (multiple staves).
 */
export interface RenderedSystem {
  readonly id: string;
  readonly staves: RenderedStaff[];
  readonly brackets: RenderedBracket[];
  readonly systemBarlineX: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Rendered bracket.
 */
export interface RenderedBracket {
  readonly type: 'bracket' | 'brace' | 'line';
  readonly x: number;
  readonly startY: number;
  readonly endY: number;
}

/**
 * Calculate system rendering with multiple staves.
 */
export function renderSystem(
  config: SystemConfig,
  dimensions: StaffDimensions,
  x: number,
  y: number,
  width: number,
  staffGap: number = 50
): RenderedSystem {
  const staves: RenderedStaff[] = [];
  const brackets: RenderedBracket[] = [];
  
  let currentY = y;
  
  // Render each staff
  for (const staffConfig of config.staves) {
    if (!staffConfig.visible) continue;
    
    const staff = calculateStaffLines(
      staffConfig.id,
      staffConfig,
      dimensions,
      x,
      currentY,
      width
    );
    
    staves.push(staff);
    currentY += dimensions.height + staffGap;
  }
  
  // Render brackets
  for (const bracket of config.brackets) {
    if (bracket.type === 'none') continue;
    
    const startStaff = staves[bracket.startStaff];
    const endStaff = staves[bracket.endStaff];
    
    if (!startStaff || !endStaff) continue;
    
    brackets.push({
      type: bracket.type,
      x: x + 5,
      startY: startStaff.y,
      endY: endStaff.y + endStaff.dimensions.height,
    });
  }
  
  const lastStaff = staves[staves.length - 1];
  const totalHeight = staves.length > 0 && lastStaff !== undefined
    ? (lastStaff.y + dimensions.height) - y
    : 0;
  
  return {
    id: config.id,
    staves,
    brackets,
    systemBarlineX: x + dimensions.leftMargin - 5,
    x,
    y,
    width,
    height: totalHeight,
  };
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a default staff configuration.
 */
export function createDefaultStaffConfig(
  id: string,
  options?: Partial<StaffConfig>
): StaffConfig {
  const config: StaffConfig = {
    id,
    clef: options?.clef ?? 'treble',
    keySignature: options?.keySignature ?? 'C',
    timeSignature: options?.timeSignature ?? '4/4',
    lines: options?.lines ?? 5,
    visible: options?.visible ?? true,
  };
  
  if (options?.label !== undefined) {
    return { ...config, label: options.label };
  }
  if (options?.shortLabel !== undefined) {
    return { ...config, shortLabel: options.shortLabel };
  }
  return config;
}

/**
 * Create a default system configuration.
 */
export function createDefaultSystemConfig(
  id: string,
  staffConfigs: StaffConfig[]
): SystemConfig {
  return {
    id,
    staves: staffConfigs,
    brackets: staffConfigs.length > 1 
      ? [{ type: 'bracket', startStaff: 0, endStaff: staffConfigs.length - 1 }]
      : [],
    systemBarlines: true,
  };
}
