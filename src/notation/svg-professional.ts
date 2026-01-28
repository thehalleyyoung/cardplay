/**
 * @fileoverview Professional SVG generation using SMuFL (Leland) font.
 * 
 * Implements Dorico-like engraving quality with:
 * 1. SMuFL font glyphs for all musical symbols
 * 2. Proper notehead shapes via font glyphs
 * 3. Correct stem-notehead connections
 * 4. Professional staff line thickness
 * 5. Proportional spacing
 * 6. Proper beam angles and thickness
 * 7. Professional tie/slur curves
 * 8. Correct key signature positions
 * 9. Time signature rendering
 * 10. Grand staff braces and connected barlines
 */

import {
  RenderedNotation,
  RenderedStaff,
  RenderedNoteHead,
  RenderedStem,
  RenderedBeamGroup,
  RenderedRest,
  RenderedBarLine,
  RenderedTie,
  RenderedSlur,
  RenderedTuplet,
} from './index';

import {
  SMUFL,
  ENGRAVING_DEFAULTS,
  getRestGlyph,
  getFlagGlyph,
  getAccidentalGlyph,
  getClefGlyph,
  getTimeSigGlyphs,
  getArticulationGlyph,
} from './smufl';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Staff space size in pixels (distance between two staff lines).
 * This is the fundamental unit for all measurements.
 */
const STAFF_SPACE = 10; // pixels

/**
 * Convert staff spaces to pixels.
 */
function sp(staffSpaces: number): number {
  return staffSpaces * STAFF_SPACE;
}

/**
 * Professional engraving configuration.
 */
const CONFIG = {
  // Staff
  staffLineThickness: sp(ENGRAVING_DEFAULTS.staffLineThickness),
  staffLineColor: '#2a2a2a',
  
  // Bar lines
  thinBarlineThickness: sp(ENGRAVING_DEFAULTS.thinBarlineThickness),
  thickBarlineThickness: sp(ENGRAVING_DEFAULTS.thickBarlineThickness),
  barlineSeparation: sp(ENGRAVING_DEFAULTS.barlineSeparation),
  
  // Stems
  stemThickness: sp(ENGRAVING_DEFAULTS.stemThickness),
  stemColor: '#000000',
  
  // Beams
  beamThickness: sp(ENGRAVING_DEFAULTS.beamThickness),
  beamSpacing: sp(ENGRAVING_DEFAULTS.beamSpacing),
  maxBeamSlope: 0.25, // Maximum beam slope (gentler for readability)
  
  // Ledger lines
  ledgerLineThickness: sp(ENGRAVING_DEFAULTS.legerLineThickness),
  ledgerLineExtension: sp(ENGRAVING_DEFAULTS.legerLineExtension),
  
  // Ties and slurs
  tieEndpointThickness: sp(0.1),  // Very thin at endpoints
  tieMidpointThickness: sp(0.5),  // Thicker in middle
  slurEndpointThickness: sp(ENGRAVING_DEFAULTS.slurEndpointThickness),
  slurMidpointThickness: sp(ENGRAVING_DEFAULTS.slurMidpointThickness),
  
  // Font sizes: SMuFL fonts are designed where em-square = 4 staff-spaces
  // So for 10px staff-space, font-size = 40px gives proper proportions
  noteheadFontSize: sp(4),   // 40px - notehead will be ~1 staff-space
  clefFontSize: sp(4),       // 40px - G clef will be properly proportioned
  timeSigFontSize: sp(4),    // 40px - time sig numbers proper size
  accidentalFontSize: sp(4), // 40px - accidentals proper size
  dynamicFontSize: sp(4),
  flagFontSize: sp(4),
  restFontSize: sp(4),
  
  // Stem attachment offsets (SMuFL noteheads have width of ~1.18 staff-spaces)
  noteheadWidth: sp(1.18),
  stemAttachmentOffset: sp(0.56), // Half notehead width for proper attachment
  
  // Colors
  noteColor: '#000000',
  textColor: '#000000',
  
  // Margins
  systemMarginLeft: sp(2),
  braceWidth: sp(0.8),
  clefMarginLeft: sp(1.2),  // Minimum margin from left edge to clef
  
  // Accidentals
  accidentalNoteheadGap: sp(0.5),  // Tighter gap between accidental and notehead
  
  // Ledger lines
  ledgerLineWidth: sp(2.56),  // Consistent width for all ledger lines
  
  // Ties
  tieArcHeight: 0.25,  // Arc height as proportion of span (increased for visibility)
  tieMinArcHeight: sp(3),  // Minimum arc height for short ties

  // System end barline
  systemEndBarlineThick: true,  // Draw thick barline at system end
};

// ============================================================================
// SVG GENERATION
// ============================================================================

/**
 * Generate professional-quality SVG from rendered notation.
 */
export function generateProfessionalSVG(
  rendered: RenderedNotation,
  width: number,
  height: number,
  options: {
    embedFont?: boolean;
    fontBase64?: string;
    fontPath?: string;
  } = {}
): string {
  const lines: string[] = [];
  
  // SVG header
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  
  // Definitions
  lines.push(`  <defs>`);
  lines.push(`  </defs>`);
  
  // Background
  lines.push(`  <rect width="${width}" height="${height}" fill="white"/>`);
  
  // Global styles using Leland font
  lines.push(`  <style>`);
  
  // Embed font as base64 if provided
  if (options.fontBase64) {
    lines.push(`    @font-face {`);
    lines.push(`      font-family: 'Leland';`);
    lines.push(`      src: url('data:font/otf;base64,${options.fontBase64}') format('opentype');`);
    lines.push(`    }`);
  } else if (options.fontPath) {
    lines.push(`    @font-face {`);
    lines.push(`      font-family: 'Leland';`);
    lines.push(`      src: url('${options.fontPath}') format('opentype');`);
    lines.push(`    }`);
  }
  lines.push(`    .music-glyph {`);
  lines.push(`      font-family: 'Leland', 'Bravura', 'Opus', serif;`);
  lines.push(`      fill: ${CONFIG.noteColor};`);
  lines.push(`    }`);
  lines.push(`    .staff-line {`);
  lines.push(`      stroke: ${CONFIG.staffLineColor};`);
  lines.push(`      stroke-width: ${CONFIG.staffLineThickness};`);
  lines.push(`      stroke-linecap: square;`);
  lines.push(`    }`);
  lines.push(`    .bar-line-thin {`);
  lines.push(`      stroke: ${CONFIG.noteColor};`);
  lines.push(`      stroke-width: ${CONFIG.thinBarlineThickness};`);
  lines.push(`      stroke-linecap: square;`);
  lines.push(`    }`);
  lines.push(`    .bar-line-thick {`);
  lines.push(`      stroke: ${CONFIG.noteColor};`);
  lines.push(`      stroke-width: ${CONFIG.thickBarlineThickness};`);
  lines.push(`      stroke-linecap: square;`);
  lines.push(`    }`);
  lines.push(`    .stem {`);
  lines.push(`      stroke: ${CONFIG.stemColor};`);
  lines.push(`      stroke-width: ${CONFIG.stemThickness};`);
  lines.push(`      stroke-linecap: round;`);
  lines.push(`    }`);
  lines.push(`    .beam {`);
  lines.push(`      fill: ${CONFIG.noteColor};`);
  lines.push(`    }`);
  lines.push(`    .ledger-line {`);
  lines.push(`      stroke: ${CONFIG.staffLineColor};`);
  lines.push(`      stroke-width: ${CONFIG.ledgerLineThickness};`);
  lines.push(`      stroke-linecap: square;`);
  lines.push(`    }`);
  lines.push(`    .dot {`);
  lines.push(`      fill: ${CONFIG.noteColor};`);
  lines.push(`    }`);
  lines.push(`    .notehead { font-size: ${CONFIG.noteheadFontSize}px; }`);
  lines.push(`    .clef { font-size: ${CONFIG.clefFontSize}px; }`);
  lines.push(`    .time-sig { font-size: ${CONFIG.timeSigFontSize}px; }`);
  lines.push(`    .accidental { font-size: ${CONFIG.accidentalFontSize}px; }`);
  lines.push(`    .rest { font-size: ${CONFIG.restFontSize}px; }`);
  lines.push(`    .flag { font-size: ${CONFIG.flagFontSize}px; }`);
  lines.push(`    .dynamic { font-size: ${CONFIG.dynamicFontSize}px; }`);
  lines.push(`    .tuplet-num {`);
  lines.push(`      font-family: 'Edwin', 'Times New Roman', serif;`);
  lines.push(`      font-size: ${sp(1.8)}px;`);
  lines.push(`      font-style: italic;`);
  lines.push(`      fill: ${CONFIG.textColor};`);
  lines.push(`    }`);
  lines.push(`  </style>`);
  
  // Render grand staff braces first (behind everything)
  renderBraces(lines, rendered);
  
  // Render staves
  for (const staff of rendered.staves) {
    renderStaffProfessional(lines, staff);
  }
  
  // Render connected barlines for grand staff
  renderConnectedBarlines(lines, rendered);
  
  // Render clefs
  for (const clef of rendered.clefs) {
    renderClefProfessional(lines, clef);
  }
  
  // Render key signatures
  for (const keySig of rendered.keySignatures) {
    renderKeySignatureProfessional(lines, keySig);
  }
  
  // Render time signatures
  for (const timeSig of rendered.timeSignatures) {
    renderTimeSignatureProfessional(lines, timeSig);
  }
  
  // Render bar lines with grand staff connection
  renderBarLinesWithGrandStaffConnection(lines, rendered);
  
  // Render note heads with proper glyphs
  for (const noteHead of rendered.noteHeads) {
    renderNoteHeadProfessional(lines, noteHead);
  }
  
  // Render stems
  for (const stem of rendered.stems) {
    renderStemProfessional(lines, stem);
  }
  
  // Render beams
  for (const beamGroup of rendered.beamGroups) {
    renderBeamGroupProfessional(lines, beamGroup);
  }
  
  // Render rests
  for (const rest of rendered.rests) {
    renderRestProfessional(lines, rest);
  }
  
  // Render ties with variable thickness
  for (const tie of rendered.ties) {
    renderTieProfessional(lines, tie);
  }
  
  // Render slurs
  for (const slur of rendered.slurs) {
    renderSlurProfessional(lines, slur);
  }
  
  // Render tuplets
  for (const tuplet of rendered.tuplets) {
    renderTupletProfessional(lines, tuplet);
  }
  
  // Render dots - adjust y-position if on a staff line to move to space
  for (const dot of rendered.dots) {
    let dotY = dot.y;
    // Staff lines are at y = staffTop + n*10 for n=0,1,2,3,4
    // Check if dot is on a line (within 1px) and adjust to space above
    const staffSpaceHalf = sp(0.5);  // 5px
    const yModStaff = dotY % STAFF_SPACE;
    if (yModStaff < 1 || yModStaff > STAFF_SPACE - 1) {
      // On a line - move up to the space above
      dotY -= staffSpaceHalf;
    }
    lines.push(`  <circle cx="${dot.x}" cy="${dotY}" r="${sp(0.2)}" class="dot"/>`);
  }
  
  // Render articulations
  for (const art of rendered.articulations) {
    renderArticulationProfessional(lines, art);
  }
  
  lines.push(`</svg>`);
  
  return lines.join('\n');
}

// ============================================================================
// RENDERING FUNCTIONS
// ============================================================================

/**
 * Render grand staff braces.
 */
function renderBraces(lines: string[], rendered: RenderedNotation): void {
  // Group staves by system and find pairs for grand staff
  const staves = rendered.staves;
  
  // For each pair of staves on the same system, draw a brace
  for (let i = 0; i < staves.length - 1; i += 2) {
    const topStaff = staves[i];
    const bottomStaff = staves[i + 1];
    
    // Skip if either staff is missing or has no lines
    if (!topStaff?.lines[0] || !bottomStaff?.lines[0]) continue;
    
    // Check if they're on the same x position (same system)
    if (Math.abs(topStaff.lines[0].startX - bottomStaff.lines[0].startX) < 5) {
      // Get proper y-coordinates for the full grand staff
      const topStaffYs = topStaff.lines.map(l => l.y);
      const bottomStaffYs = bottomStaff.lines.map(l => l.y);
      
      const topY = Math.min(...topStaffYs);  // Top of top staff
      const bottomY = Math.max(...bottomStaffYs);  // Bottom of bottom staff
      
      // Ensure brace is within visible area
      const braceMargin = sp(2.5);  // Minimum x position for brace
      const x = Math.max(topStaff.lines[0].startX - sp(0.5), braceMargin);
      const height = bottomY - topY;
      const midY = (topY + bottomY) / 2;
      
      // Professional brace with calligraphic shape
      // Thicker in middle, tapered at ends, with a point at center
      const tipWidth = sp(0.15);    // Thin at tips
      const midWidth = sp(0.6);     // Thick at middle
      const depth = Math.min(sp(2.2), x - sp(0.5));  // Don't extend past left edge
      
      // Upper half of brace (top tip to center point)
      const upperOuterPath = `
        M ${x} ${topY}
        C ${x - depth * 0.3} ${topY + height * 0.05},
          ${x - depth * 0.8} ${topY + height * 0.2},
          ${x - depth} ${midY}
      `;
      
      // Upper half inner edge (going back up)
      const upperInnerPath = `
        C ${x - depth * 0.6} ${topY + height * 0.25},
          ${x - depth * 0.15} ${topY + height * 0.08},
          ${x - tipWidth} ${topY + tipWidth}
        L ${x} ${topY}
      `;
      
      // Lower half of brace (center point to bottom tip)  
      const lowerOuterPath = `
        M ${x - depth} ${midY}
        C ${x - depth * 0.8} ${bottomY - height * 0.2},
          ${x - depth * 0.3} ${bottomY - height * 0.05},
          ${x} ${bottomY}
      `;
      
      // Lower half inner edge
      const lowerInnerPath = `
        L ${x - tipWidth} ${bottomY - tipWidth}
        C ${x - depth * 0.15} ${bottomY - height * 0.08},
          ${x - depth * 0.6} ${bottomY - height * 0.25},
          ${x - depth + midWidth} ${midY}
        L ${x - depth} ${midY}
      `;
      
      // Draw as filled shape
      lines.push(`  <path d="${upperOuterPath} ${upperInnerPath}" fill="${CONFIG.noteColor}"/>`);
      lines.push(`  <path d="${lowerOuterPath} ${lowerInnerPath}" fill="${CONFIG.noteColor}"/>`);
    }
  }
}

/**
 * Render connected barlines for grand staff.
 * Only draws the connecting barline at the START of each system (left edge).
 * The system-end barlines come from measure data and are rendered by renderBarLinesWithGrandStaffConnection.
 */
function renderConnectedBarlines(lines: string[], rendered: RenderedNotation): void {
  const staves = rendered.staves;
  
  // Find staff pairs and their barline positions
  for (let i = 0; i < staves.length - 1; i += 2) {
    const topStaff = staves[i];
    const bottomStaff = staves[i + 1];
    
    // Skip if either staff is missing or has no lines
    if (!topStaff?.lines[0] || !bottomStaff?.lines[0]) continue;
    
    // Check if they're on the same system
    if (Math.abs(topStaff.lines[0].startX - bottomStaff.lines[0].startX) < 5) {
      // Get all y-coordinates and find min/max for each staff
      const topStaffYs = topStaff.lines.map(l => l.y);
      const bottomStaffYs = bottomStaff.lines.map(l => l.y);
      
      const topY = Math.min(...topStaffYs);  // Top of top staff
      const bottomY = Math.max(...bottomStaffYs);  // Bottom of bottom staff
      
      // Draw connecting barline at start of system (left edge)
      const startX = topStaff.lines[0].startX;
      lines.push(`  <line x1="${startX}" y1="${topY}" x2="${startX}" y2="${bottomY}" class="bar-line-thin"/>`);
      
      // System-end barlines are rendered by renderBarLinesWithGrandStaffConnection from measure data
    }
  }
}

/**
 * Render staff with professional line thickness.
 */
function renderStaffProfessional(lines: string[], staff: RenderedStaff): void {
  for (const line of staff.lines) {
    lines.push(`  <line x1="${line.startX}" y1="${line.y}" x2="${line.endX}" y2="${line.y}" class="staff-line"/>`);
  }
}

/**
 * Render clef using SMuFL glyph.
 */
function renderClefProfessional(lines: string[], clef: any): void {
  const glyph = getClefGlyph(clef.type);
  
  // SMuFL clefs are designed to be positioned at their reference line:
  // G clef: origin at G line (line 2 from bottom)
  // F clef: origin at F line (line 4 from bottom)  
  // C clef: origin at middle C line
  //
  // The clef.y from renderClef is offset by height/2, which was for SVG paths.
  // For SMuFL, we need to calculate the actual staff line position.
  // clef.y = lineY - height/2, so lineY = clef.y + height/2
  const lineY = clef.y + clef.height / 2;
  
  // Ensure clef has proper left margin (not touching edge)
  const xPos = Math.max(clef.x, CONFIG.clefMarginLeft);
  
  lines.push(`  <text x="${xPos}" y="${lineY}" class="music-glyph clef">${glyph}</text>`);
}

/**
 * Render key signature with proper accidental positions.
 * Adds proper spacing from clef.
 */
function renderKeySignatureProfessional(lines: string[], keySig: any): void {
  // Add extra horizontal offset for proper spacing from clef
  const clefSpacing = sp(2.0); // More space after clef for key signature
  
  for (const acc of keySig.accidentals) {
    const glyph = getAccidentalGlyph(acc.type);
    // SMuFL accidentals are positioned at their vertical center
    // The acc.y should already be the correct position from layout
    const adjustedX = acc.x + clefSpacing;
    lines.push(`  <text x="${adjustedX}" y="${acc.y}" class="music-glyph accidental">${glyph}</text>`);
  }
}

/**
 * Render time signature using SMuFL glyphs.
 */
function renderTimeSignatureProfessional(lines: string[], timeSig: any): void {
  if (timeSig.display === 'common') {
    lines.push(`  <text x="${timeSig.x}" y="${timeSig.y + sp(2)}" class="music-glyph time-sig">${SMUFL.timeSigCommon}</text>`);
  } else if (timeSig.display === 'cut') {
    lines.push(`  <text x="${timeSig.x}" y="${timeSig.y + sp(2)}" class="music-glyph time-sig">${SMUFL.timeSigCutCommon}</text>`);
  } else if (timeSig.numerator !== undefined && timeSig.denominator !== undefined) {
    const glyphs = getTimeSigGlyphs(timeSig.numerator, timeSig.denominator);
    // Numerator in top half of staff, denominator in bottom half
    lines.push(`  <text x="${timeSig.x}" y="${timeSig.y + sp(1)}" class="music-glyph time-sig">${glyphs.num}</text>`);
    lines.push(`  <text x="${timeSig.x}" y="${timeSig.y + sp(3)}" class="music-glyph time-sig">${glyphs.denom}</text>`);
  } else if (timeSig.numeratorText && timeSig.denominatorText) {
    // Fallback to text
    lines.push(`  <text x="${timeSig.x}" y="${timeSig.y + sp(1)}" class="music-glyph time-sig">${timeSig.numeratorText}</text>`);
    lines.push(`  <text x="${timeSig.x}" y="${timeSig.y + sp(3)}" class="music-glyph time-sig">${timeSig.denominatorText}</text>`);
  }
}

/**
 * Render barlines with proper grand staff connection.
 * Barlines at the same x-position on paired staves should connect.
 */
function renderBarLinesWithGrandStaffConnection(lines: string[], rendered: RenderedNotation): void {
  const staves = rendered.staves;
  
  // Build a map of staff y-ranges
  const staffYRanges: { minY: number; maxY: number }[] = staves.map(staff => {
    const ys = staff.lines.map(l => l.y);
    return { minY: Math.min(...ys), maxY: Math.max(...ys) };
  });
  
  // Group barlines by x-position (within tolerance)
  const barLineGroups = new Map<number, RenderedBarLine[]>();
  for (const barLine of rendered.barLines) {
    const x = Math.round(barLine.elements[0]?.x || 0);
    if (!barLineGroups.has(x)) {
      barLineGroups.set(x, []);
    }
    barLineGroups.get(x)!.push(barLine);
  }
  
  // For each x-position, check if barlines span a grand staff pair
  for (const [, barLines] of barLineGroups) {
    // Find which staff pair (grand staff) each barline belongs to
    // Group by system (pairs of staves)
    const systemBarLines = new Map<number, { barLines: RenderedBarLine[]; minY: number; maxY: number }>();
    
    for (const barLine of barLines) {
      for (const elem of barLine.elements) {
        if (elem.type === 'line' && elem.startY !== undefined && elem.endY !== undefined) {
          // Find which staff this barline belongs to
          for (let i = 0; i < staves.length; i++) {
            const range = staffYRanges[i];
            if (!range) continue;
            const barLineY = (elem.startY + elem.endY) / 2;
            if (barLineY >= range.minY - 10 && barLineY <= range.maxY + 10) {
              // This barline is on staff i
              // Determine system index (pairs of staves)
              const systemIdx = Math.floor(i / 2);
              
              if (!systemBarLines.has(systemIdx)) {
                const topStaffRange = staffYRanges[systemIdx * 2];
                const bottomStaffRange = staffYRanges[systemIdx * 2 + 1];
                if (!topStaffRange) continue;
                systemBarLines.set(systemIdx, {
                  barLines: [],
                  minY: topStaffRange.minY,
                  maxY: bottomStaffRange?.maxY ?? topStaffRange.maxY,
                });
              }
              systemBarLines.get(systemIdx)!.barLines.push(barLine);
              break;
            }
          }
        }
      }
    }
    
    // Render extended barlines for each system
    for (const [, { barLines: sysBarLines, minY, maxY }] of systemBarLines) {
      // Get the barline type from the first barline
      const firstBarLine = sysBarLines[0];
      if (!firstBarLine) continue;
      for (const elem of firstBarLine.elements) {
        if (elem.type === 'line') {
          const isThick = (elem.thickness || 1) > 2;
          const cls = isThick ? 'bar-line-thick' : 'bar-line-thin';
          // Render a single barline spanning the full grand staff
          lines.push(`  <line x1="${elem.x}" y1="${minY}" x2="${elem.x}" y2="${maxY}" class="${cls}"/>`);
        } else if (elem.type === 'dot' && elem.y !== undefined) {
          // Repeat dots - render for each staff in the system
          lines.push(`  <text x="${elem.x - sp(0.2)}" y="${elem.y + sp(0.25)}" class="music-glyph" style="font-size: ${sp(1)}px">${SMUFL.repeatDot}</text>`);
        }
      }
    }
  }
}

/**
 * Render notehead using SMuFL glyph.
 */
function renderNoteHeadProfessional(lines: string[], noteHead: RenderedNoteHead): void {
  const { x, y, shape } = noteHead;
  
  // Render ledger lines first with consistent width
  for (const ledger of noteHead.ledgerLines) {
    // Use consistent ledger line width centered on the notehead
    const ledgerHalfWidth = CONFIG.ledgerLineWidth / 2;
    const centerX = x + CONFIG.noteheadWidth / 2;  // Center of notehead
    lines.push(`  <line x1="${centerX - ledgerHalfWidth}" y1="${ledger.y}" x2="${centerX + ledgerHalfWidth}" y2="${ledger.y}" class="ledger-line"/>`);
  }
  
  // Render accidental if present - use layout position or calculate proper position
  if (noteHead.accidental) {
    const acc = noteHead.accidental;
    const glyph = getAccidentalGlyph(acc.type);
    const opacity = acc.isCautionary ? 0.6 : 1;
    // Position accidental to the left of the notehead with proper spacing
    // Use the accidental's x position from the layout engine if available
    const accX = acc.x !== undefined ? acc.x : x - sp(2.2);
    // SMuFL accidentals are designed at the staff line, no y-offset needed
    lines.push(`  <text x="${accX}" y="${y}" class="music-glyph accidental" opacity="${opacity}">${glyph}</text>`);
  }
  
  // Get the appropriate notehead glyph
  let glyph: string;
  
  switch (shape) {
    case 'whole':
      glyph = SMUFL.noteheadWhole;
      break;
    case 'half':
      glyph = SMUFL.noteheadHalf;
      break;
    case 'breve':
      glyph = SMUFL.noteheadDoubleWhole;
      break;
    default:
      glyph = SMUFL.noteheadBlack;
  }
  
  // Position: SMuFL noteheads are designed with baseline at center of glyph
  // For a 40px font, notehead is ~10px (1 staff-space) tall
  // No y-offset needed - the y coordinate IS the staff line position
  lines.push(`  <text x="${x}" y="${y}" class="music-glyph notehead">${glyph}</text>`);
}

/**
 * Render stem with proper attachment to notehead edge.
 * Note: The stem.x value from the layout engine is already positioned
 * at the notehead edge, so we don't need additional offset here.
 */
function renderStemProfessional(lines: string[], stem: RenderedStem): void {
  // Stem x position is already calculated by the layout engine
  // to be at the appropriate edge of the notehead
  const stemX = stem.x;
  
  lines.push(`  <line x1="${stemX}" y1="${stem.startY}" x2="${stemX}" y2="${stem.endY}" class="stem"/>`);
  
  // Render flags using SMuFL glyphs - precisely at stem endpoint
  if (stem.flags && stem.flags.length > 0) {
    const flagCount = stem.flags.length;
    
    // Map flag count to duration
    const durations = ['eighth', '16th', '32nd', '64th', '128th'];
    const duration = durations[Math.min(flagCount - 1, durations.length - 1)] ?? 'eighth';
    
    const glyph = getFlagGlyph(duration, stem.direction === 'up');
    if (glyph) {
      // Flag attaches precisely at end of stem
      // For stem-up: flag hangs from top of stem
      // For stem-down: flag extends from bottom of stem
      const flagY = stem.endY; // Exact stem endpoint
      lines.push(`  <text x="${stemX}" y="${flagY}" class="music-glyph flag">${glyph}</text>`);
    }
  }
}

/**
 * Render beam group with proper thickness and consistent angle.
 */
function renderBeamGroupProfessional(lines: string[], beamGroup: RenderedBeamGroup): void {
  for (const beam of beamGroup.beams) {
    // Calculate beam slope
    const dx = beam.endX - beam.startX;
    const dy = beam.endY - beam.startY;
    let slope = dx !== 0 ? dy / dx : 0;
    
    // Clamp slope to maximum for readability
    // But also ensure minimum slope for beams with large pitch difference
    const clampedSlope = Math.max(-CONFIG.maxBeamSlope, Math.min(CONFIG.maxBeamSlope, slope));
    
    // If beam is very short, prefer flat beam
    const isShortBeam = Math.abs(dx) < sp(3);
    const finalSlope = isShortBeam ? 0 : clampedSlope;
    
    const adjustedEndY = beam.startY + finalSlope * dx;
    
    // Draw beam as a filled parallelogram with proper thickness
    const halfThick = CONFIG.beamThickness / 2;
    const path = `M ${beam.startX} ${beam.startY - halfThick} ` +
                 `L ${beam.endX} ${adjustedEndY - halfThick} ` +
                 `L ${beam.endX} ${adjustedEndY + halfThick} ` +
                 `L ${beam.startX} ${beam.startY + halfThick} Z`;
    lines.push(`  <path d="${path}" class="beam"/>`);
  }
}

/**
 * Render rest using SMuFL glyph.
 */
function renderRestProfessional(lines: string[], rest: RenderedRest): void {
  const { x, y, duration } = rest;
  
  const glyph = getRestGlyph(duration);
  
  // Position rest at the correct vertical location relative to staff center
  // For a 5-line staff where y is typically the top line:
  // - Middle line is at y + 2 staff spaces
  // - Whole rest hangs from line 4 (y + 1 staff space)
  // - Half rest sits on line 3 (y + 2 staff spaces)
  // - Quarter and shorter center on middle line
  // Calculate the middle of the staff for centering rests
  // Staff lines are typically at y, y+10, y+20, y+30, y+40 (5 lines)
  // The middle line is at y+20, so center rest on line 3 (B line in treble)
  let yAdjust = sp(0);
  if (duration === 'whole') {
    yAdjust = sp(0.5); // Hangs from line 4 (slightly below middle)
  } else if (duration === 'half') {
    yAdjust = sp(1.0); // Sits on line 3
  } else if (duration === 'quarter') {
    yAdjust = sp(0.5); // Center quarter rest on middle of staff
  } else if (duration === 'eighth') {
    yAdjust = sp(0.5);
  } else if (duration === '16th') {
    yAdjust = sp(0.4);
  } else if (duration === '32nd') {
    yAdjust = sp(0.3);
  } else {
    yAdjust = sp(0.2);
  }
  
  lines.push(`  <text x="${x}" y="${y + yAdjust}" class="music-glyph rest">${glyph}</text>`);
  
  // Render dots using SMuFL
  for (let i = 0; i < rest.dots; i++) {
    lines.push(`  <text x="${x + sp(1.5 + i * 0.5)}" y="${y - sp(0.5)}" class="music-glyph" style="font-size: ${sp(1.2)}px">${SMUFL.augmentationDot}</text>`);
  }
}

/**
 * Render tie with professional variable thickness.
 * Professional ties are:
 * - Very thin at endpoints
 * - Thickest at approximately 1/3 from each end
 * - Slightly flattened in the middle
 */
function renderTieProfessional(lines: string[], tie: RenderedTie): void {
  const { curve } = tie;
  
  const direction = curve.control1Y < curve.startY ? -1 : 1; // Determine if tie curves up or down
  
  // Professional tie shape: thick at 1/3 and 2/3 points, thin at ends
  const maxThick = sp(0.6);    // Maximum thickness at 1/3 and 2/3 points
  
  // Calculate tie span for proportional arc height
  const dx = curve.endX - curve.startX;
  const dy = curve.endY - curve.startY;
  const span = Math.sqrt(dx * dx + dy * dy);
  
  // Arc height: use proportional height but ensure a minimum for visibility
  const proportionalHeight = span * CONFIG.tieArcHeight;
  const arcHeight = Math.max(proportionalHeight, CONFIG.tieMinArcHeight);
  
  // Calculate proper control points for a more pronounced arc
  const midY = (curve.startY + curve.endY) / 2;
  
  // Control points at 1/4 and 3/4 of the span, with proper arc height
  const ctrl1X = curve.startX + dx * 0.25;
  const ctrl2X = curve.startX + dx * 0.75;
  const ctrl1Y = midY + direction * arcHeight;
  const ctrl2Y = midY + direction * arcHeight;
  
  // Outer curve with proper arc
  const outerPath = `M ${curve.startX} ${curve.startY} ` +
    `C ${ctrl1X} ${ctrl1Y - direction * maxThick * 0.2}, ` +
    `${ctrl2X} ${ctrl2Y - direction * maxThick * 0.2}, ` +
    `${curve.endX} ${curve.endY}`;
  
  // Inner curve (creates thickness, goes in reverse)
  const innerPath = `C ${ctrl2X} ${ctrl2Y + direction * maxThick * 0.8}, ` +
    `${ctrl1X} ${ctrl1Y + direction * maxThick * 0.8}, ` +
    `${curve.startX} ${curve.startY}`;
  
  const fullPath = outerPath + ' ' + innerPath + ' Z';
  
  lines.push(`  <path d="${fullPath}" fill="${CONFIG.noteColor}"/>`);
}

/**
 * Render slur with variable thickness.
 */
function renderSlurProfessional(lines: string[], slur: RenderedSlur): void {
  const { curve, isDashed } = slur;
  
  if (isDashed) {
    // Dashed slur is just a stroke
    const path = `M ${curve.startX} ${curve.startY} ` +
      `C ${curve.control1X} ${curve.control1Y}, ${curve.control2X} ${curve.control2Y}, ${curve.endX} ${curve.endY}`;
    lines.push(`  <path d="${path}" fill="none" stroke="${CONFIG.noteColor}" stroke-width="${CONFIG.slurMidpointThickness}" stroke-dasharray="${sp(0.5)},${sp(0.3)}"/>`);
  } else {
    // Filled slur with variable thickness
    const midThick = CONFIG.slurMidpointThickness;
    
    const direction = curve.control1Y < curve.startY ? -1 : 1;
    
    const outerPath = `M ${curve.startX} ${curve.startY} ` +
      `C ${curve.control1X} ${curve.control1Y + direction * midThick}, ` +
      `${curve.control2X} ${curve.control2Y + direction * midThick}, ` +
      `${curve.endX} ${curve.endY}`;
    
    const innerPath = `C ${curve.control2X} ${curve.control2Y}, ` +
      `${curve.control1X} ${curve.control1Y}, ` +
      `${curve.startX} ${curve.startY}`;
    
    const fullPath = outerPath + ' ' + innerPath + ' Z';
    
    lines.push(`  <path d="${fullPath}" fill="${CONFIG.noteColor}"/>`);
  }
}

/**
 * Render tuplet bracket and number.
 */
function renderTupletProfessional(lines: string[], tuplet: RenderedTuplet): void {
  if (tuplet.bracket) {
    const { startX, startY, endX, endY, leftHookY, rightHookY } = tuplet.bracket;
    const thickness = sp(ENGRAVING_DEFAULTS.tupletBracketThickness);
    
    // Draw bracket with hooks
    lines.push(`  <line x1="${startX}" y1="${leftHookY}" x2="${startX}" y2="${startY}" stroke="${CONFIG.noteColor}" stroke-width="${thickness}"/>`);
    lines.push(`  <line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" stroke="${CONFIG.noteColor}" stroke-width="${thickness}"/>`);
    lines.push(`  <line x1="${endX}" y1="${endY}" x2="${endX}" y2="${rightHookY}" stroke="${CONFIG.noteColor}" stroke-width="${thickness}"/>`);
  }
  
  if (tuplet.number) {
    // Use italic serif number
    lines.push(`  <text x="${tuplet.number.x}" y="${tuplet.number.y}" class="tuplet-num" text-anchor="middle">${tuplet.number.text}</text>`);
  }
}

/**
 * Render articulation using SMuFL glyph.
 */
function renderArticulationProfessional(lines: string[], art: any): void {
  const { x, y, type, placement } = art;
  const above = placement !== 'below';
  const glyph = getArticulationGlyph(type, above);
  
  lines.push(`  <text x="${x}" y="${y}" class="music-glyph" style="font-size: ${sp(2)}px" text-anchor="middle">${glyph}</text>`);
}
