/**
 * @fileoverview Ornaments, Dynamics, and Expression Rendering.
 * 
 * Phase 11.2: Notation Event Display
 * 
 * Implements:
 * - Ornament symbols (trill, mordent, turn, etc.)
 * - Dynamic markings (p, mf, f, ff, crescendo, etc.)
 * - Expression text (rit., accel., etc.)
 * - Tempo markings
 * 
 * @module @cardplay/core/notation/ornaments-dynamics
 */

import type { StaffDimensions } from './staff';

// ============================================================================
// ORNAMENT TYPES
// ============================================================================

/**
 * Ornament type.
 */
export type OrnamentType =
  | 'trill'
  | 'mordent'           // Lower mordent
  | 'inverted-mordent'  // Upper mordent
  | 'turn'
  | 'inverted-turn'
  | 'gruppetto'         // Turn after note
  | 'appoggiatura'      // Long grace note
  | 'acciaccatura'      // Short grace note (slash)
  | 'tremolo-1'         // Single beam tremolo
  | 'tremolo-2'         // Double beam tremolo
  | 'tremolo-3'         // Triple beam tremolo
  | 'trill-flat'
  | 'trill-sharp'
  | 'trill-natural';

/**
 * Ornament definition.
 */
export interface Ornament {
  readonly type: OrnamentType;
  /** Note ID this ornament applies to */
  readonly noteId: string;
  /** Tick position */
  readonly tick: number;
  /** Optional accidental for trill */
  readonly accidental?: 'flat' | 'sharp' | 'natural';
}

/**
 * Rendered ornament SVG.
 */
export interface RenderedOrnament {
  readonly type: OrnamentType;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly svg: string;
}

/**
 * SMuFL code points for ornaments.
 */
const ORNAMENT_GLYPHS: Record<OrnamentType, string> = {
  'trill': '\uE566',              // ornamentTrill
  'mordent': '\uE56C',            // ornamentMordent
  'inverted-mordent': '\uE56D',   // ornamentShortTrill
  'turn': '\uE567',               // ornamentTurn
  'inverted-turn': '\uE568',      // ornamentTurnInverted
  'gruppetto': '\uE567',          // Same as turn
  'appoggiatura': '\uE5E9',       // graceNoteSlashStemUp
  'acciaccatura': '\uE5E9',       // graceNoteSlashStemUp
  'tremolo-1': '\uE220',          // tremolo1
  'tremolo-2': '\uE221',          // tremolo2
  'tremolo-3': '\uE222',          // tremolo3
  'trill-flat': '\uE566',         // Base trill + accidental
  'trill-sharp': '\uE566',        // Base trill + accidental
  'trill-natural': '\uE566',      // Base trill + accidental
};

/**
 * Renders an ornament symbol.
 */
export function renderOrnament(
  ornament: Ornament,
  x: number,
  y: number,
  dimensions: StaffDimensions
): RenderedOrnament {
  const glyph = ORNAMENT_GLYPHS[ornament.type];
  const fontSize = dimensions.lineSpacing * 1.2;
  
  // Ornaments appear above the staff
  const ornamentY = y - dimensions.lineSpacing * 2;
  
  let svg = `<text x="${x}" y="${ornamentY}" font-family="Bravura, serif" font-size="${fontSize}" text-anchor="middle">${glyph}</text>`;
  
  // Add accidental for trill variants
  if (ornament.type.startsWith('trill-') && ornament.accidental) {
    const accidentalGlyph = getAccidentalGlyph(ornament.accidental);
    const accidentalX = x + fontSize * 0.6;
    svg += `<text x="${accidentalX}" y="${ornamentY}" font-family="Bravura, serif" font-size="${fontSize * 0.7}" text-anchor="start">${accidentalGlyph}</text>`;
  }
  
  return {
    type: ornament.type,
    x,
    y: ornamentY,
    width: fontSize * 1.2,
    height: fontSize,
    svg,
  };
}

function getAccidentalGlyph(accidental: 'flat' | 'sharp' | 'natural'): string {
  switch (accidental) {
    case 'flat': return '\uE260';   // accidentalFlat
    case 'sharp': return '\uE262';  // accidentalSharp
    case 'natural': return '\uE261'; // accidentalNatural
  }
}

// ============================================================================
// DYNAMIC TYPES
// ============================================================================

/**
 * Dynamic marking.
 */
export type DynamicLevel =
  | 'pppp' | 'ppp' | 'pp' | 'p'        // Piano
  | 'mp'                               // Mezzo-piano
  | 'mf'                               // Mezzo-forte
  | 'f' | 'ff' | 'fff' | 'ffff'        // Forte
  | 'fp'                               // Forte-piano
  | 'sf' | 'sfz' | 'sffz'              // Sforzando
  | 'rf' | 'rfz';                      // Rinforzando

/**
 * Dynamic marking definition.
 */
export interface Dynamic {
  readonly level: DynamicLevel;
  /** Tick position */
  readonly tick: number;
  /** Voice number */
  readonly voice: number;
  /** Staff index */
  readonly staff: number;
}

/**
 * Rendered dynamic marking.
 */
export interface RenderedDynamic {
  readonly level: DynamicLevel;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly svg: string;
}

/**
 * SMuFL code points for dynamics.
 */
const DYNAMIC_GLYPHS: Record<DynamicLevel, string> = {
  'pppp': '\uE52A\uE52A\uE52A\uE52A', // dynamicPPPP
  'ppp': '\uE52A\uE52A\uE52A',        // dynamicPPP
  'pp': '\uE52A\uE52A',               // dynamicPP
  'p': '\uE520',                      // dynamicPiano
  'mp': '\uE521\uE520',               // dynamicMezzo + Piano
  'mf': '\uE521\uE522',               // dynamicMezzo + Forte
  'f': '\uE522',                      // dynamicForte
  'ff': '\uE522\uE522',               // dynamicFF
  'fff': '\uE522\uE522\uE522',        // dynamicFFF
  'ffff': '\uE522\uE522\uE522\uE522', // dynamicFFFF
  'fp': '\uE522\uE520',               // dynamicFortePiano
  'sf': '\uE524\uE522',               // dynamicSforzando
  'sfz': '\uE524\uE522\uE52F',        // dynamicSforzando
  'sffz': '\uE524\uE522\uE522\uE52F', // dynamicSforzandissimo
  'rf': '\uE523\uE522',               // dynamicRinforzando
  'rfz': '\uE523\uE522\uE52F',        // dynamicRinforzando
};

/**
 * Renders a dynamic marking.
 */
export function renderDynamic(
  dynamic: Dynamic,
  x: number,
  y: number,
  dimensions: StaffDimensions
): RenderedDynamic {
  const glyph = DYNAMIC_GLYPHS[dynamic.level];
  const fontSize = dimensions.lineSpacing * 1.4;
  
  // Dynamics appear below the staff
  const dynamicY = y + dimensions.lineSpacing * 6;
  
  const svg = `<text x="${x}" y="${dynamicY}" font-family="Bravura, serif" font-size="${fontSize}" text-anchor="start" font-style="italic">${glyph}</text>`;
  
  return {
    level: dynamic.level,
    x,
    y: dynamicY,
    width: fontSize * glyph.length * 0.6,
    height: fontSize,
    svg,
  };
}

// ============================================================================
// CRESCENDO / DECRESCENDO
// ============================================================================

/**
 * Hairpin type (crescendo/decrescendo).
 */
export type HairpinType = 'crescendo' | 'decrescendo';

/**
 * Hairpin (wedge) marking.
 */
export interface Hairpin {
  readonly type: HairpinType;
  /** Starting tick */
  readonly startTick: number;
  /** Ending tick */
  readonly endTick: number;
  /** Voice number */
  readonly voice: number;
  /** Staff index */
  readonly staff: number;
}

/**
 * Rendered hairpin.
 */
export interface RenderedHairpin {
  readonly type: HairpinType;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly svg: string;
}

/**
 * Renders a crescendo or decrescendo hairpin.
 */
export function renderHairpin(
  hairpin: Hairpin,
  x1: number,
  x2: number,
  y: number,
  dimensions: StaffDimensions
): RenderedHairpin {
  const hairpinY = y + dimensions.lineSpacing * 6;
  const height = dimensions.lineSpacing * 0.8;
  
  let svg: string;
  
  if (hairpin.type === 'crescendo') {
    // Crescendo opens to the right: <
    const y1 = hairpinY;
    const y2 = hairpinY - height / 2;
    const y3 = hairpinY + height / 2;
    
    svg = `<path d="M ${x1} ${y1} L ${x2} ${y2} M ${x1} ${y1} L ${x2} ${y3}" stroke="black" stroke-width="1" fill="none"/>`;
  } else {
    // Decrescendo opens to the left: >
    const y1 = hairpinY;
    const y2 = hairpinY - height / 2;
    const y3 = hairpinY + height / 2;
    
    svg = `<path d="M ${x1} ${y2} L ${x2} ${y1} M ${x1} ${y3} L ${x2} ${y1}" stroke="black" stroke-width="1" fill="none"/>`;
  }
  
  return {
    type: hairpin.type,
    x1,
    y1: hairpinY,
    x2,
    y2: hairpinY,
    svg,
  };
}

// ============================================================================
// EXPRESSION TEXT
// ============================================================================

/**
 * Expression text type.
 */
export type ExpressionType =
  | 'cresc.'          // Crescendo
  | 'decresc.'        // Decrescendo
  | 'dim.'            // Diminuendo
  | 'rit.'            // Ritardando
  | 'rall.'           // Rallentando
  | 'accel.'          // Accelerando
  | 'a tempo'         // Return to tempo
  | 'rubato'          // Free tempo
  | 'poco'            // A little
  | 'molto'           // Very much
  | 'sempre'          // Always
  | 'subito'          // Suddenly
  | 'con'             // With
  | 'senza'           // Without
  | 'dolce'           // Sweetly
  | 'espressivo'      // Expressively
  | 'cantabile'       // Singingly
  | 'legato'          // Smooth
  | 'staccato'        // Detached
  | 'marcato'         // Marked
  | 'sostenuto'       // Sustained
  | 'pizz.'           // Pizzicato
  | 'arco';           // With bow

/**
 * Expression text marking.
 */
export interface Expression {
  readonly text: ExpressionType | string;
  /** Tick position */
  readonly tick: number;
  /** Voice number */
  readonly voice: number;
  /** Staff index */
  readonly staff: number;
  /** Position above or below staff */
  readonly position?: 'above' | 'below';
}

/**
 * Rendered expression text.
 */
export interface RenderedExpression {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly svg: string;
}

/**
 * Renders expression text.
 */
export function renderExpression(
  expression: Expression,
  x: number,
  y: number,
  dimensions: StaffDimensions
): RenderedExpression {
  const fontSize = dimensions.lineSpacing * 1.0;
  const position = expression.position ?? 'above';
  
  const expressionY = position === 'above'
    ? y - dimensions.lineSpacing * 3.5
    : y + dimensions.lineSpacing * 6.5;
  
  const svg = `<text x="${x}" y="${expressionY}" font-family="serif" font-size="${fontSize}" text-anchor="start" font-style="italic">${expression.text}</text>`;
  
  return {
    text: expression.text,
    x,
    y: expressionY,
    width: fontSize * expression.text.length * 0.5, // Rough estimate
    height: fontSize,
    svg,
  };
}

// ============================================================================
// TEMPO MARKINGS
// ============================================================================

/**
 * Common tempo marking names.
 */
export type TempoMarkingName =
  | 'Largo'           // Very slow (40-60 BPM)
  | 'Larghetto'       // Rather slow (60-66 BPM)
  | 'Adagio'          // Slow (66-76 BPM)
  | 'Andante'         // Walking pace (76-108 BPM)
  | 'Moderato'        // Moderate (108-120 BPM)
  | 'Allegro'         // Fast (120-156 BPM)
  | 'Presto'          // Very fast (168-200 BPM)
  | 'Prestissimo';    // Extremely fast (200+ BPM)

/**
 * Tempo marking definition.
 */
export interface Tempo {
  /** Tempo name (e.g., "Allegro") */
  readonly marking?: TempoMarkingName | string;
  /** BPM value */
  readonly bpm: number;
  /** Tick position */
  readonly tick: number;
  /** Beat unit (which note gets the beat) */
  readonly beatUnit?: 'quarter' | 'eighth' | 'half';
  /** Whether to show metronome marking */
  readonly showMetronome?: boolean;
}

/**
 * Rendered tempo marking.
 */
export interface RenderedTempo {
  readonly marking?: string;
  readonly bpm: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly svg: string;
}

/**
 * Renders a tempo marking.
 */
export function renderTempo(
  tempo: Tempo,
  x: number,
  y: number,
  dimensions: StaffDimensions
): RenderedTempo {
  const fontSize = dimensions.lineSpacing * 1.2;
  const tempoY = y - dimensions.lineSpacing * 5;
  
  let svg = '';
  let textWidth = 0;
  
  // Render marking text
  if (tempo.marking) {
    svg += `<text x="${x}" y="${tempoY}" font-family="serif" font-size="${fontSize}" text-anchor="start" font-weight="bold">${tempo.marking}</text>`;
    textWidth = fontSize * tempo.marking.length * 0.6;
  }
  
  // Render metronome marking
  if (tempo.showMetronome) {
    const metronomeX = x + textWidth + fontSize * 0.5;
    const beatUnit = tempo.beatUnit ?? 'quarter';
    const noteGlyph = getNoteGlyphForBeatUnit(beatUnit);
    
    svg += `<text x="${metronomeX}" y="${tempoY}" font-family="Bravura, serif" font-size="${fontSize}" text-anchor="start">${noteGlyph}</text>`;
    svg += `<text x="${metronomeX + fontSize}" y="${tempoY}" font-family="serif" font-size="${fontSize * 0.9}" text-anchor="start"> = ${tempo.bpm}</text>`;
    textWidth += fontSize * 4; // Estimate
  }
  
  const result: RenderedTempo = {
    bpm: tempo.bpm,
    x,
    y: tempoY,
    width: textWidth,
    height: fontSize,
    svg,
  };
  
  if (tempo.marking) {
    return { ...result, marking: tempo.marking };
  }
  
  return result;
}

function getNoteGlyphForBeatUnit(beatUnit: 'quarter' | 'eighth' | 'half'): string {
  switch (beatUnit) {
    case 'quarter': return '\uE1D5'; // noteQuarterUp
    case 'eighth': return '\uE1D7';  // noteEighthUp
    case 'half': return '\uE1D3';    // noteHalfUp
  }
}

// ============================================================================
// REHEARSAL MARKS
// ============================================================================

/**
 * Rehearsal mark definition.
 */
export interface RehearsalMark {
  /** Mark label (e.g., "A", "B", "1", "Intro") */
  readonly label: string;
  /** Tick position */
  readonly tick: number;
  /** Measure number */
  readonly measure: number;
  /** Shape style */
  readonly shape?: 'box' | 'circle' | 'none';
}

/**
 * Rendered rehearsal mark.
 */
export interface RenderedRehearsalMark {
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly svg: string;
}

/**
 * Renders a rehearsal mark.
 */
export function renderRehearsalMark(
  mark: RehearsalMark,
  x: number,
  y: number,
  dimensions: StaffDimensions
): RenderedRehearsalMark {
  const fontSize = dimensions.lineSpacing * 1.5;
  const markY = y - dimensions.lineSpacing * 6;
  const shape = mark.shape ?? 'box';
  
  let svg = '';
  const padding = fontSize * 0.3;
  const textWidth = fontSize * mark.label.length * 0.6;
  const boxWidth = textWidth + padding * 2;
  const boxHeight = fontSize + padding;
  
  // Render shape
  if (shape === 'box') {
    svg += `<rect x="${x - padding}" y="${markY - fontSize}" width="${boxWidth}" height="${boxHeight}" fill="none" stroke="black" stroke-width="2"/>`;
  } else if (shape === 'circle') {
    const radius = Math.max(boxWidth, boxHeight) / 2 + padding;
    const cx = x + textWidth / 2;
    const cy = markY - fontSize / 2;
    svg += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="black" stroke-width="2"/>`;
  }
  
  // Render text
  svg += `<text x="${x}" y="${markY}" font-family="serif" font-size="${fontSize}" text-anchor="start" font-weight="bold">${mark.label}</text>`;
  
  return {
    label: mark.label,
    x,
    y: markY,
    width: boxWidth,
    height: boxHeight,
    svg,
  };
}

// ============================================================================
// TREMOLO NOTATION
// ============================================================================

/**
 * Tremolo definition for rendering on note stems.
 */
export interface TremoloNotation {
  /** Note ID this tremolo applies to */
  readonly noteId: string;
  /** Number of beams (1-3 for single note, or for measured tremolo between notes) */
  readonly beams: 1 | 2 | 3;
  /** Type: single-note tremolo or measured tremolo between two notes */
  readonly type: 'single' | 'measured';
  /** For measured tremolo: second note ID */
  readonly secondNoteId?: string;
}

/**
 * Rendered tremolo.
 */
export interface RenderedTremolo {
  readonly noteId: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly svg: string;
}

/**
 * Renders tremolo beams on a note stem.
 * For single-note tremolo, renders beams across the stem.
 */
export function renderTremolo(
  tremolo: TremoloNotation,
  noteX: number,
  noteY: number,
  stemLength: number,
  dimensions: StaffDimensions
): RenderedTremolo {
  const beamThickness = dimensions.lineSpacing * 0.5;
  const beamSpacing = dimensions.lineSpacing * 0.7;
  const beamWidth = dimensions.lineSpacing * 2;
  
  // Position tremolo in middle of stem
  const tremoloY = noteY - stemLength / 2;
  const startX = noteX - beamWidth / 2;
  
  let svg = '';
  
  // Render each beam with slight angle (15 degrees)
  for (let i = 0; i < tremolo.beams; i++) {
    const y = tremoloY + (i - (tremolo.beams - 1) / 2) * beamSpacing;
    svg += `<rect x="${startX}" y="${y}" width="${beamWidth}" height="${beamThickness}" fill="black" transform="rotate(-15 ${noteX} ${y + beamThickness / 2})"/>`;
  }
  
  return {
    noteId: tremolo.noteId,
    x: startX,
    y: tremoloY - beamSpacing * tremolo.beams / 2,
    width: beamWidth,
    height: beamSpacing * tremolo.beams + beamThickness,
    svg,
  };
}

// ============================================================================
// GLISSANDO LINES
// ============================================================================

/**
 * Glissando line definition.
 */
export interface GlissandoLine {
  /** Starting note ID */
  readonly fromNoteId: string;
  /** Ending note ID */
  readonly toNoteId: string;
  /** Style: wavy line or straight line */
  readonly style: 'wavy' | 'straight';
  /** Optional text label (e.g., "gliss.") */
  readonly text?: string;
}

/**
 * Rendered glissando line.
 */
export interface RenderedGlissando {
  readonly fromNoteId: string;
  readonly toNoteId: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly svg: string;
}

/**
 * Renders a glissando line between two notes.
 */
export function renderGlissando(
  gliss: GlissandoLine,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  dimensions: StaffDimensions
): RenderedGlissando {
  let svg = '';
  
  if (gliss.style === 'straight') {
    // Straight diagonal line
    svg = `<line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}" stroke="black" stroke-width="1.5"/>`;
  } else {
    // Wavy line using SMuFL wiggle symbols or SVG path
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Create wavy path
    const waveCount = Math.floor(distance / (dimensions.lineSpacing * 2));
    const waveHeight = dimensions.lineSpacing * 0.5;
    
    let pathD = `M ${fromX} ${fromY}`;
    for (let i = 1; i <= waveCount; i++) {
      const x = fromX + (dx / waveCount) * i;
      const y = fromY + (dy / waveCount) * i;
      const waveOffset = ((i % 2) * 2 - 1) * waveHeight;
      pathD += ` Q ${x - dx / (waveCount * 2)} ${y + waveOffset} ${x} ${y}`;
    }
    
    svg = `<path d="${pathD}" stroke="black" stroke-width="1.5" fill="none"/>`;
  }
  
  // Add optional text label
  if (gliss.text) {
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2 - dimensions.lineSpacing;
    const fontSize = dimensions.lineSpacing * 0.9;
    svg += `<text x="${midX}" y="${midY}" font-family="serif" font-size="${fontSize}" font-style="italic" text-anchor="middle">${gliss.text}</text>`;
  }
  
  return {
    fromNoteId: gliss.fromNoteId,
    toNoteId: gliss.toNoteId,
    x1: fromX,
    y1: fromY,
    x2: toX,
    y2: toY,
    svg,
  };
}

// ============================================================================
// OTTAVA LINES (8va, 8vb, 15ma, 15mb)
// ============================================================================

/**
 * Ottava type.
 */
export type OttavaType = '8va' | '8vb' | '15ma' | '15mb';

/**
 * Ottava line definition.
 */
export interface OttavaLine {
  /** Type of ottava */
  readonly type: OttavaType;
  /** Starting tick position */
  readonly startTick: number;
  /** Ending tick position */
  readonly endTick: number;
  /** Staff index */
  readonly staff: number;
}

/**
 * Rendered ottava line.
 */
export interface RenderedOttava {
  readonly type: OttavaType;
  readonly x1: number;
  readonly x2: number;
  readonly y: number;
  readonly svg: string;
}

/**
 * Get ottava label text.
 */
function getOttavaLabel(type: OttavaType): string {
  switch (type) {
    case '8va': return '8va';
    case '8vb': return '8vb';
    case '15ma': return '15ma';
    case '15mb': return '15mb';
  }
}

/**
 * Renders an ottava line above or below the staff.
 */
export function renderOttava(
  ottava: OttavaLine,
  startX: number,
  endX: number,
  staffY: number,
  dimensions: StaffDimensions
): RenderedOttava {
  const isAbove = ottava.type === '8va' || ottava.type === '15ma';
  const staffHeight = dimensions.lineSpacing * 4; // 5 lines = 4 spaces
  const lineY = isAbove 
    ? staffY - dimensions.lineSpacing * 5 
    : staffY + staffHeight + dimensions.lineSpacing * 2;
  
  const fontSize = dimensions.lineSpacing * 1.2;
  const label = getOttavaLabel(ottava.type);
  const labelWidth = fontSize * label.length * 0.6;
  
  // Ottava bracket: label + dashed line + vertical end tick
  let svg = '';
  
  // Label text
  svg += `<text x="${startX}" y="${lineY}" font-family="serif" font-size="${fontSize}" font-style="italic" text-anchor="start">${label}</text>`;
  
  // Dashed horizontal line
  const lineStartX = startX + labelWidth + fontSize * 0.3;
  svg += `<line x1="${lineStartX}" y1="${lineY}" x2="${endX}" y2="${lineY}" stroke="black" stroke-width="1.5" stroke-dasharray="3,2"/>`;
  
  // Vertical end tick
  const tickHeight = dimensions.lineSpacing;
  const tickDirection = isAbove ? 1 : -1;
  svg += `<line x1="${endX}" y1="${lineY}" x2="${endX}" y2="${lineY + tickDirection * tickHeight}" stroke="black" stroke-width="1.5"/>`;
  
  return {
    type: ottava.type,
    x1: startX,
    x2: endX,
    y: lineY,
    svg,
  };
}
