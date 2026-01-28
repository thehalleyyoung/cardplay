/**
 * @fileoverview Render a complex musical piece to PNG.
 * 
 * This script demonstrates the notation rendering engine by creating
 * a multi-measure piece with various musical elements.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  NotationPanel,
  createPianoPanel,
  NotationMeasure,
  NotationEvent,
  NotationNote,
  NoteDuration,
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

import { generateProfessionalSVG } from './svg-professional';

// ============================================================================
// SVG GENERATION
// ============================================================================

/**
 * Generate SVG from rendered notation.
 */
function generateSVG(rendered: RenderedNotation, width: number, height: number): string {
  const lines: string[] = [];
  
  // SVG header
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  
  // Background
  lines.push(`  <rect width="${width}" height="${height}" fill="white"/>`);
  
  // Style definitions
  lines.push(`  <style>`);
  lines.push(`    .staff-line { stroke: #333; stroke-width: 1; }`);
  lines.push(`    .bar-line { stroke: #333; stroke-width: 1; }`);
  lines.push(`    .bar-line-thick { stroke: #333; stroke-width: 4; }`);
  lines.push(`    .note-head { fill: black; }`);
  lines.push(`    .note-head-open { fill: none; stroke: black; stroke-width: 1.5; }`);
  lines.push(`    .stem { stroke: black; stroke-width: 1.2; }`);
  lines.push(`    .beam { fill: black; }`);
  lines.push(`    .ledger-line { stroke: #333; stroke-width: 1; }`);
  lines.push(`    .tie-slur { fill: black; }`);
  lines.push(`    .rest { fill: black; }`);
  lines.push(`    .dot { fill: black; }`);
  lines.push(`    .accidental { fill: black; font-family: serif; font-size: 16px; }`);
  lines.push(`    .clef { fill: black; font-family: serif; font-size: 40px; }`);
  lines.push(`    .time-sig { fill: black; font-family: serif; font-size: 24px; font-weight: bold; }`);
  lines.push(`    .key-sig { fill: black; font-family: serif; font-size: 20px; }`);
  lines.push(`    .tuplet-num { fill: black; font-family: serif; font-size: 12px; font-style: italic; }`);
  lines.push(`    .measure-num { fill: #666; font-family: sans-serif; font-size: 10px; }`);
  lines.push(`  </style>`);
  
  // Render staves
  for (const staff of rendered.staves) {
    renderStaffSVG(lines, staff);
  }
  
  // Render clefs
  for (const clef of rendered.clefs) {
    renderClefSVG(lines, clef);
  }
  
  // Render key signatures
  for (const keySig of rendered.keySignatures) {
    renderKeySignatureSVG(lines, keySig);
  }
  
  // Render time signatures
  for (const timeSig of rendered.timeSignatures) {
    renderTimeSignatureSVG(lines, timeSig);
  }
  
  // Render bar lines
  for (const barLine of rendered.barLines) {
    renderBarLineSVG(lines, barLine);
  }
  
  // Render note heads
  for (const noteHead of rendered.noteHeads) {
    renderNoteHeadSVG(lines, noteHead);
  }
  
  // Render stems
  for (const stem of rendered.stems) {
    renderStemSVG(lines, stem);
  }
  
  // Render beams
  for (const beamGroup of rendered.beamGroups) {
    renderBeamGroupSVG(lines, beamGroup);
  }
  
  // Render rests
  for (const rest of rendered.rests) {
    renderRestSVG(lines, rest);
  }
  
  // Render ties
  for (const tie of rendered.ties) {
    renderTieSVG(lines, tie);
  }
  
  // Render slurs
  for (const slur of rendered.slurs) {
    renderSlurSVG(lines, slur);
  }
  
  // Render tuplets
  for (const tuplet of rendered.tuplets) {
    renderTupletSVG(lines, tuplet);
  }
  
  // Render dots
  for (const dot of rendered.dots) {
    lines.push(`  <circle cx="${dot.x}" cy="${dot.y}" r="${dot.radius}" class="dot"/>`);
  }
  
  // Render articulations
  for (const art of rendered.articulations) {
    renderArticulationSVG(lines, art);
  }
  
  lines.push(`</svg>`);
  
  return lines.join('\n');
}

function renderStaffSVG(lines: string[], staff: RenderedStaff): void {
  for (const line of staff.lines) {
    lines.push(`  <line x1="${line.startX}" y1="${line.y}" x2="${line.endX}" y2="${line.y}" class="staff-line"/>`);
  }
}

function renderClefSVG(lines: string[], clef: any): void {
  // Use text-based clef symbols for now
  const symbols: Record<string, string> = {
    treble: '𝄞',
    bass: '𝄢',
    alto: '𝄡',
    tenor: '𝄡',
  };
  const symbol = symbols[clef.type] || '𝄞';
  const yOffset = clef.type === 'treble' ? 15 : clef.type === 'bass' ? -5 : 5;
  lines.push(`  <text x="${clef.x}" y="${clef.y + clef.height / 2 + yOffset}" class="clef">${symbol}</text>`);
}

function renderKeySignatureSVG(lines: string[], keySig: any): void {
  for (const acc of keySig.accidentals) {
    const symbol = acc.type === 'sharp' ? '♯' : '♭';
    lines.push(`  <text x="${acc.x}" y="${acc.y + 5}" class="key-sig">${symbol}</text>`);
  }
}

function renderTimeSignatureSVG(lines: string[], timeSig: any): void {
  if (timeSig.display === 'common') {
    lines.push(`  <text x="${timeSig.x}" y="${timeSig.y + timeSig.height / 2 + 8}" class="time-sig" font-size="32">𝄴</text>`);
  } else if (timeSig.display === 'cut') {
    lines.push(`  <text x="${timeSig.x}" y="${timeSig.y + timeSig.height / 2 + 8}" class="time-sig" font-size="32">𝄵</text>`);
  } else if (timeSig.numeratorText && timeSig.denominatorText) {
    lines.push(`  <text x="${timeSig.x + 4}" y="${timeSig.y + 15}" class="time-sig">${timeSig.numeratorText}</text>`);
    lines.push(`  <text x="${timeSig.x + 4}" y="${timeSig.y + 35}" class="time-sig">${timeSig.denominatorText}</text>`);
  }
}

function renderBarLineSVG(lines: string[], barLine: RenderedBarLine): void {
  for (const elem of barLine.elements) {
    if (elem.type === 'line' && elem.startY !== undefined && elem.endY !== undefined) {
      const cls = (elem.thickness || 1) > 2 ? 'bar-line-thick' : 'bar-line';
      lines.push(`  <line x1="${elem.x}" y1="${elem.startY}" x2="${elem.x}" y2="${elem.endY}" class="${cls}"/>`);
    } else if (elem.type === 'dot' && elem.y !== undefined) {
      lines.push(`  <circle cx="${elem.x}" cy="${elem.y}" r="${elem.radius || 2}" class="dot"/>`);
    }
  }
}

function renderNoteHeadSVG(lines: string[], noteHead: RenderedNoteHead): void {
  const { x, y, dimensions, shape } = noteHead;
  const rx = dimensions.width / 2;
  const ry = dimensions.height / 2;
  
  // Render ledger lines first
  for (const ledger of noteHead.ledgerLines) {
    lines.push(`  <line x1="${ledger.x}" y1="${ledger.y}" x2="${ledger.x + ledger.width}" y2="${ledger.y}" class="ledger-line"/>`);
  }
  
  // Render accidental if present
  if (noteHead.accidental) {
    const acc = noteHead.accidental;
    const accSymbols: Record<string, string> = {
      'sharp': '♯',
      'flat': '♭',
      'natural': '♮',
      'double-sharp': '𝄪',
      'double-flat': '𝄫',
    };
    const symbol = accSymbols[acc.type] || '';
    if (symbol) {
      const style = acc.isCautionary ? 'font-size: 14px; opacity: 0.7;' : '';
      lines.push(`  <text x="${acc.x}" y="${acc.y + 5}" class="accidental" style="${style}">${symbol}</text>`);
    }
  }
  
  // Render note head
  if (shape === 'whole' || shape === 'half') {
    // Open note head (ellipse with hole)
    lines.push(`  <ellipse cx="${x + rx}" cy="${y}" rx="${rx}" ry="${ry}" class="note-head-open" transform="rotate(-20 ${x + rx} ${y})"/>`);
  } else if (shape === 'breve') {
    // Breve (double whole)
    lines.push(`  <rect x="${x}" y="${y - ry}" width="${dimensions.width}" height="${dimensions.height}" class="note-head-open"/>`);
    lines.push(`  <line x1="${x}" y1="${y - ry - 3}" x2="${x}" y2="${y + ry + 3}" class="bar-line"/>`);
    lines.push(`  <line x1="${x + dimensions.width}" y1="${y - ry - 3}" x2="${x + dimensions.width}" y2="${y + ry + 3}" class="bar-line"/>`);
  } else {
    // Filled note head
    lines.push(`  <ellipse cx="${x + rx}" cy="${y}" rx="${rx}" ry="${ry}" class="note-head" transform="rotate(-20 ${x + rx} ${y})"/>`);
  }
}

function renderStemSVG(lines: string[], stem: RenderedStem): void {
  lines.push(`  <line x1="${stem.x}" y1="${stem.startY}" x2="${stem.x}" y2="${stem.endY}" class="stem"/>`);
  
  // Render flags
  for (const flag of stem.flags) {
    const flagPath = stem.direction === 'up'
      ? `M ${flag.x} ${flag.y} q 8 5 6 15 q -2 -8 -6 -12`
      : `M ${flag.x} ${flag.y} q 8 -5 6 -15 q -2 8 -6 12`;
    lines.push(`  <path d="${flagPath}" class="note-head"/>`);
  }
}

function renderBeamGroupSVG(lines: string[], beamGroup: RenderedBeamGroup): void {
  for (const beam of beamGroup.beams) {
    // Draw beam as a parallelogram
    const halfThick = beam.thickness / 2;
    const path = `M ${beam.startX} ${beam.startY - halfThick} ` +
                 `L ${beam.endX} ${beam.endY - halfThick} ` +
                 `L ${beam.endX} ${beam.endY + halfThick} ` +
                 `L ${beam.startX} ${beam.startY + halfThick} Z`;
    lines.push(`  <path d="${path}" class="beam"/>`);
  }
}

function renderRestSVG(lines: string[], rest: RenderedRest): void {
  const { x, y, duration, width, height } = rest;
  
  // Draw rest symbols using paths
  switch (duration) {
    case 'whole':
      // Whole rest hangs from a line
      lines.push(`  <rect x="${x}" y="${y}" width="${width}" height="${height / 2}" class="rest"/>`);
      break;
    case 'half':
      // Half rest sits on a line
      lines.push(`  <rect x="${x}" y="${y + height / 2}" width="${width}" height="${height / 2}" class="rest"/>`);
      break;
    case 'quarter':
      // Quarter rest (zigzag)
      const qPath = `M ${x + 2} ${y} l 4 6 l -4 4 l 4 6 l -2 4 q 4 -2 2 -6 l -4 -4 l 4 -4 l -4 -6 z`;
      lines.push(`  <path d="${qPath}" class="rest"/>`);
      break;
    case 'eighth':
      // Eighth rest
      lines.push(`  <circle cx="${x + 4}" cy="${y + 4}" r="3" class="rest"/>`);
      lines.push(`  <line x1="${x + 6}" y1="${y + 4}" x2="${x + 2}" y2="${y + height}" class="stem"/>`);
      break;
    case '16th':
      // 16th rest
      lines.push(`  <circle cx="${x + 4}" cy="${y + 4}" r="3" class="rest"/>`);
      lines.push(`  <circle cx="${x + 6}" cy="${y + 12}" r="3" class="rest"/>`);
      lines.push(`  <line x1="${x + 8}" y1="${y + 4}" x2="${x + 2}" y2="${y + height}" class="stem"/>`);
      break;
    default:
      // Generic rest rectangle
      lines.push(`  <rect x="${x}" y="${y}" width="${width}" height="${height}" class="rest" opacity="0.3"/>`);
  }
  
  // Render dots
  for (let i = 0; i < rest.dots; i++) {
    lines.push(`  <circle cx="${x + width + 4 + i * 5}" cy="${y + height / 2}" r="2" class="dot"/>`);
  }
}

function renderTieSVG(lines: string[], tie: RenderedTie): void {
  const { curve, thickness } = tie;
  const path = `M ${curve.startX} ${curve.startY} ` +
               `C ${curve.control1X} ${curve.control1Y}, ${curve.control2X} ${curve.control2Y}, ${curve.endX} ${curve.endY}`;
  lines.push(`  <path d="${path}" fill="none" stroke="black" stroke-width="${thickness}"/>`);
}

function renderSlurSVG(lines: string[], slur: RenderedSlur): void {
  const { curve, thickness } = slur;
  const path = `M ${curve.startX} ${curve.startY} ` +
               `C ${curve.control1X} ${curve.control1Y}, ${curve.control2X} ${curve.control2Y}, ${curve.endX} ${curve.endY}`;
  const dashStyle = slur.isDashed ? 'stroke-dasharray="4,4"' : '';
  lines.push(`  <path d="${path}" fill="none" stroke="black" stroke-width="${thickness}" ${dashStyle}/>`);
}

function renderTupletSVG(lines: string[], tuplet: RenderedTuplet): void {
  if (tuplet.bracket) {
    const { startX, startY, endX, endY, leftHookY, rightHookY } = tuplet.bracket;
    // Draw bracket
    lines.push(`  <line x1="${startX}" y1="${leftHookY}" x2="${startX}" y2="${startY}" class="stem"/>`);
    lines.push(`  <line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" class="stem"/>`);
    lines.push(`  <line x1="${endX}" y1="${endY}" x2="${endX}" y2="${rightHookY}" class="stem"/>`);
  }
  
  if (tuplet.number) {
    lines.push(`  <text x="${tuplet.number.x}" y="${tuplet.number.y}" class="tuplet-num" text-anchor="middle">${tuplet.number.text}</text>`);
  }
}

function renderArticulationSVG(lines: string[], art: any): void {
  const { x, y, type } = art;
  
  switch (type) {
    case 'staccato':
      lines.push(`  <circle cx="${x}" cy="${y}" r="2" class="dot"/>`);
      break;
    case 'accent':
      lines.push(`  <path d="M ${x - 5} ${y + 3} L ${x} ${y - 3} L ${x + 5} ${y + 3}" fill="none" stroke="black" stroke-width="1.5"/>`);
      break;
    case 'tenuto':
      lines.push(`  <line x1="${x - 5}" y1="${y}" x2="${x + 5}" y2="${y}" stroke="black" stroke-width="2"/>`);
      break;
    case 'fermata':
      lines.push(`  <path d="M ${x - 8} ${y} A 8 5 0 1 1 ${x + 8} ${y}" fill="none" stroke="black" stroke-width="1.5"/>`);
      lines.push(`  <circle cx="${x}" cy="${y - 3}" r="2" class="dot"/>`);
      break;
    case 'marcato':
      lines.push(`  <path d="M ${x - 4} ${y + 4} L ${x} ${y - 4} L ${x + 4} ${y + 4}" fill="none" stroke="black" stroke-width="1.5"/>`);
      break;
  }
}

// ============================================================================
// CREATE COMPLEX MUSICAL PIECE
// ============================================================================

function createComplexPiece(): { panel: NotationPanel; measures: NotationMeasure[] } {
  // Create a piano panel in G major, 4/4 time
  const panel = createPianoPanel('G', '4/4');
  
  const measures: NotationMeasure[] = [];
  
  // Helper to create notes
  const note = (id: string, pitch: number, accidental?: 'sharp' | 'flat' | 'natural'): NotationNote => ({
    id,
    pitch,
    ...(accidental !== undefined ? { accidental } : {}),
  });
  
  const dur = (base: string, dots: number = 0): NoteDuration => ({
    base: base as any,
    dots,
  });
  
  // Measure 1: Simple melody with quarter notes
  const m1Events = new Map<number, NotationEvent[]>();
  m1Events.set(1, [
    { id: 'm1e1', notes: [note('m1n1', 67)], duration: dur('quarter'), tick: 0, voice: 1, staff: 0, isRest: false },          // G4
    { id: 'm1e2', notes: [note('m1n2', 69)], duration: dur('quarter'), tick: 480, voice: 1, staff: 0, isRest: false },        // A4
    { id: 'm1e3', notes: [note('m1n3', 71)], duration: dur('quarter'), tick: 960, voice: 1, staff: 0, isRest: false },        // B4
    { id: 'm1e4', notes: [note('m1n4', 72)], duration: dur('quarter'), tick: 1440, voice: 1, staff: 0, isRest: false },       // C5
  ]);
  measures.push({
    number: 1,
    events: m1Events,
    endBarLine: 'single',
  });
  
  // Measure 2: Eighth notes with beaming
  const m2Events = new Map<number, NotationEvent[]>();
  m2Events.set(1, [
    { id: 'm2e1', notes: [note('m2n1', 74)], duration: dur('eighth'), tick: 0, voice: 1, staff: 0, isRest: false },           // D5
    { id: 'm2e2', notes: [note('m2n2', 72)], duration: dur('eighth'), tick: 240, voice: 1, staff: 0, isRest: false },         // C5
    { id: 'm2e3', notes: [note('m2n3', 71)], duration: dur('eighth'), tick: 480, voice: 1, staff: 0, isRest: false },         // B4
    { id: 'm2e4', notes: [note('m2n4', 69)], duration: dur('eighth'), tick: 720, voice: 1, staff: 0, isRest: false },         // A4
    { id: 'm2e5', notes: [note('m2n5', 67)], duration: dur('eighth'), tick: 960, voice: 1, staff: 0, isRest: false },         // G4
    { id: 'm2e6', notes: [note('m2n6', 66, 'sharp')], duration: dur('eighth'), tick: 1200, voice: 1, staff: 0, isRest: false }, // F#4
    { id: 'm2e7', notes: [note('m2n7', 67)], duration: dur('half'), tick: 1440, voice: 1, staff: 0, isRest: false },          // G4 half
  ]);
  measures.push({
    number: 2,
    events: m2Events,
    endBarLine: 'single',
  });
  
  // Measure 3: Dotted rhythms and rests
  const m3Events = new Map<number, NotationEvent[]>();
  m3Events.set(1, [
    { id: 'm3e1', notes: [note('m3n1', 72)], duration: dur('quarter', 1), tick: 0, voice: 1, staff: 0, isRest: false },       // C5 dotted quarter
    { id: 'm3e2', notes: [note('m3n2', 71)], duration: dur('eighth'), tick: 720, voice: 1, staff: 0, isRest: false },         // B4 eighth
    { id: 'm3e3', notes: [], duration: dur('quarter'), tick: 960, voice: 1, staff: 0, isRest: true },                          // Quarter rest
    { id: 'm3e4', notes: [note('m3n4', 69)], duration: dur('quarter'), tick: 1440, voice: 1, staff: 0, isRest: false },       // A4
  ]);
  measures.push({
    number: 3,
    events: m3Events,
    endBarLine: 'single',
  });
  
  // Measure 4: Chords
  const m4Events = new Map<number, NotationEvent[]>();
  m4Events.set(1, [
    { id: 'm4e1', notes: [note('m4n1a', 67), note('m4n1b', 71), note('m4n1c', 74)], duration: dur('half'), tick: 0, voice: 1, staff: 0, isRest: false },       // G major chord
    { id: 'm4e2', notes: [note('m4n2a', 69), note('m4n2b', 72), note('m4n2c', 76)], duration: dur('half'), tick: 960, voice: 1, staff: 0, isRest: false },      // A minor chord
  ]);
  measures.push({
    number: 4,
    events: m4Events,
    endBarLine: 'single',
  });
  
  // Measure 5: 16th notes and accidentals
  const m5Events = new Map<number, NotationEvent[]>();
  m5Events.set(1, [
    { id: 'm5e1', notes: [note('m5n1', 72)], duration: dur('16th'), tick: 0, voice: 1, staff: 0, isRest: false },
    { id: 'm5e2', notes: [note('m5n2', 74)], duration: dur('16th'), tick: 120, voice: 1, staff: 0, isRest: false },
    { id: 'm5e3', notes: [note('m5n3', 76)], duration: dur('16th'), tick: 240, voice: 1, staff: 0, isRest: false },
    { id: 'm5e4', notes: [note('m5n4', 77)], duration: dur('16th'), tick: 360, voice: 1, staff: 0, isRest: false },
    { id: 'm5e5', notes: [note('m5n5', 79)], duration: dur('quarter'), tick: 480, voice: 1, staff: 0, isRest: false },        // G5
    { id: 'm5e6', notes: [note('m5n6', 78, 'flat')], duration: dur('quarter'), tick: 960, voice: 1, staff: 0, isRest: false },  // Gb5 (flat)
    { id: 'm5e7', notes: [note('m5n7', 77)], duration: dur('quarter'), tick: 1440, voice: 1, staff: 0, isRest: false },
  ]);
  measures.push({
    number: 5,
    events: m5Events,
    endBarLine: 'single',
  });
  
  // Measure 6: High notes with ledger lines
  const m6Events = new Map<number, NotationEvent[]>();
  m6Events.set(1, [
    { id: 'm6e1', notes: [note('m6n1', 84)], duration: dur('quarter'), tick: 0, voice: 1, staff: 0, isRest: false },          // C6 (high)
    { id: 'm6e2', notes: [note('m6n2', 86)], duration: dur('quarter'), tick: 480, voice: 1, staff: 0, isRest: false },        // D6
    { id: 'm6e3', notes: [note('m6n3', 88)], duration: dur('quarter'), tick: 960, voice: 1, staff: 0, isRest: false },        // E6
    { id: 'm6e4', notes: [note('m6n4', 79)], duration: dur('quarter'), tick: 1440, voice: 1, staff: 0, isRest: false },       // G5
  ]);
  measures.push({
    number: 6,
    events: m6Events,
    endBarLine: 'single',
  });
  
  // Measure 7: Low notes with ledger lines
  const m7Events = new Map<number, NotationEvent[]>();
  m7Events.set(1, [
    { id: 'm7e1', notes: [note('m7n1', 60)], duration: dur('quarter'), tick: 0, voice: 1, staff: 0, isRest: false },          // C4 (middle C)
    { id: 'm7e2', notes: [note('m7n2', 57)], duration: dur('quarter'), tick: 480, voice: 1, staff: 0, isRest: false },        // A3
    { id: 'm7e3', notes: [note('m7n3', 55)], duration: dur('quarter'), tick: 960, voice: 1, staff: 0, isRest: false },        // G3
    { id: 'm7e4', notes: [note('m7n4', 67)], duration: dur('quarter'), tick: 1440, voice: 1, staff: 0, isRest: false },       // G4
  ]);
  measures.push({
    number: 7,
    events: m7Events,
    endBarLine: 'single',
  });
  
  // Measure 8: Whole note and articulations
  const m8Events = new Map<number, NotationEvent[]>();
  m8Events.set(1, [
    { id: 'm8e1', notes: [note('m8n1', 67), note('m8n1b', 71), note('m8n1c', 74)], duration: dur('whole'), tick: 0, voice: 1, staff: 0, isRest: false, articulations: ['fermata'] },
  ]);
  measures.push({
    number: 8,
    events: m8Events,
    endBarLine: 'end',
  });
  
  panel.setMeasures(measures);
  
  // Add some ties
  panel.setTies([
    { id: 'tie1', startNoteId: 'm4n1a', endNoteId: 'm4n2a', placement: 'auto' },
  ]);
  
  return { panel, measures };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('Creating complex musical piece...');
  
  const { panel, measures } = createComplexPiece();
  
  console.log(`Created ${measures.length} measures`);
  
  // Render
  console.log('Rendering notation...');
  const rendered = panel.render();
  
  console.log(`Rendered:`);
  console.log(`  - ${rendered.staves.length} staves`);
  console.log(`  - ${rendered.noteHeads.length} note heads`);
  console.log(`  - ${rendered.stems.length} stems`);
  console.log(`  - ${rendered.beamGroups.length} beam groups`);
  console.log(`  - ${rendered.rests.length} rests`);
  console.log(`  - ${rendered.barLines.length} bar lines`);
  console.log(`  - ${rendered.ties.length} ties`);
  console.log(`  - ${rendered.dots.length} dots`);
  console.log(`  - ${rendered.clefs.length} clefs`);
  console.log(`  - ${rendered.keySignatures.length} key signatures`);
  console.log(`  - ${rendered.timeSignatures.length} time signatures`);
  
  // Load Leland font as base64
  const fontPath = path.join(__dirname, '..', '..', 'public', 'fonts', 'Leland.otf');
  let fontBase64: string | undefined;
  if (fs.existsSync(fontPath)) {
    fontBase64 = fs.readFileSync(fontPath).toString('base64');
    console.log(`Loaded Leland font (${Math.round(fontBase64.length / 1024)}KB base64)`);
  } else {
    console.warn('Warning: Leland.otf not found, SMuFL glyphs may not render');
  }
  
  // Generate SVG - both basic and professional
  console.log('Generating SVG...');
  const width = 900;
  const height = 400;
  const svg = generateSVG(rendered, width, height);
  const svgPro = generateProfessionalSVG(rendered, width, height, { ...(fontBase64 !== undefined ? { fontBase64 } : {}) });
  
  // Save SVG
  const outputDir = path.join(__dirname, '..', '..', 'test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const svgPath = path.join(outputDir, 'notation_complex.svg');
  fs.writeFileSync(svgPath, svg);
  console.log(`Saved basic SVG to: ${svgPath}`);
  
  const svgProPath = path.join(outputDir, 'notation_professional.svg');
  fs.writeFileSync(svgProPath, svgPro);
  console.log(`Saved professional SVG to: ${svgProPath}`);
  
  // For PNG conversion, we'd need a tool like sharp, puppeteer, or resvg
  // Let's create HTML wrappers for both versions
  const htmlPath = path.join(outputDir, 'notation_complex.html');
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Complex Musical Piece - Notation Test</title>
  <style>
    @font-face {
      font-family: 'Leland';
      src: url('/fonts/Leland.otf') format('opentype');
    }
    body { 
      font-family: sans-serif; 
      padding: 20px; 
      background: #f5f5f5;
    }
    h1 { color: #333; }
    .notation-container {
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .info {
      margin-top: 20px;
      padding: 10px;
      background: #e8f4e8;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>🎵 Complex Musical Piece - Basic Rendering</h1>
  <div class="notation-container">
    ${svg}
  </div>
  <div class="info">
    <p><strong>Rendered elements:</strong></p>
    <ul>
      <li>Staves: ${rendered.staves.length}</li>
      <li>Note heads: ${rendered.noteHeads.length}</li>
      <li>Stems: ${rendered.stems.length}</li>
      <li>Beam groups: ${rendered.beamGroups.length}</li>
      <li>Rests: ${rendered.rests.length}</li>
      <li>Bar lines: ${rendered.barLines.length}</li>
      <li>Ties: ${rendered.ties.length}</li>
      <li>Dots: ${rendered.dots.length}</li>
      <li>Measures: ${measures.length}</li>
    </ul>
  </div>
</body>
</html>`;
  
  fs.writeFileSync(htmlPath, html);
  console.log(`Saved basic HTML to: ${htmlPath}`);
  
  // Professional HTML with Leland font embedded as base64
  const htmlProPath = path.join(outputDir, 'notation_professional.html');
  const fontSrc = fontBase64 
    ? `url('data:font/otf;base64,${fontBase64}') format('opentype')`
    : `url('./Leland.otf') format('opentype')`;
  const htmlPro = `<!DOCTYPE html>
<html>
<head>
  <title>Complex Musical Piece - Professional Notation</title>
  <style>
    @font-face {
      font-family: 'Leland';
      src: ${fontSrc};
    }
    body { 
      font-family: 'Helvetica Neue', sans-serif; 
      padding: 20px; 
      background: #fafafa;
    }
    h1 { color: #1a1a1a; font-weight: 300; }
    h2 { color: #333; font-weight: 400; margin-top: 30px; }
    .notation-container {
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 30px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      margin: 20px 0;
    }
    .comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .info {
      margin-top: 20px;
      padding: 15px;
      background: #f0f7f0;
      border-radius: 4px;
      font-size: 14px;
    }
    .improvements {
      background: #f0f4f8;
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
    }
    .improvements h3 { margin-top: 0; color: #2563eb; }
    .improvements ul { margin: 0; padding-left: 20px; }
    .improvements li { margin: 8px 0; }
  </style>
</head>
<body>
  <h1>🎵 Professional Music Notation with SMuFL (Leland Font)</h1>
  
  <h2>Professional Rendering</h2>
  <div class="notation-container">
    ${svgPro}
  </div>
  
  <div class="improvements">
    <h3>Dorico-like Improvements Implemented:</h3>
    <ul>
      <li><strong>SMuFL Font Glyphs:</strong> Using MuseScore's Leland font for professional symbols</li>
      <li><strong>Professional Staff Lines:</strong> Thinner lines (0.11 staff-spaces) in subtle gray</li>
      <li><strong>Proper Stem Thickness:</strong> 0.1 staff-spaces with round caps</li>
      <li><strong>Professional Beam Thickness:</strong> 0.5 staff-spaces with slope limiting</li>
      <li><strong>Ledger Line Extensions:</strong> Proper extension beyond noteheads</li>
      <li><strong>Variable-Thickness Ties:</strong> Thin at endpoints, thick in middle</li>
      <li><strong>Grand Staff Brace:</strong> Connecting curved brace for piano staves</li>
      <li><strong>Connected Barlines:</strong> Barlines span entire grand staff</li>
      <li><strong>SMuFL Accidentals:</strong> Proper sharp/flat/natural glyphs</li>
      <li><strong>Professional Time Signatures:</strong> SMuFL number glyphs</li>
    </ul>
  </div>

  <h2>Comparison with Basic Rendering</h2>
  <div class="comparison">
    <div>
      <h3>Basic (Unicode text)</h3>
      <div class="notation-container">
        ${svg}
      </div>
    </div>
    <div>
      <h3>Professional (SMuFL/Leland)</h3>
      <div class="notation-container">
        ${svgPro}
      </div>
    </div>
  </div>
  
  <div class="info">
    <p><strong>Rendered elements:</strong> ${rendered.staves.length} staves, ${rendered.noteHeads.length} noteheads, ${rendered.stems.length} stems, ${rendered.beamGroups.length} beam groups, ${rendered.rests.length} rests, ${rendered.barLines.length} bar lines, ${rendered.ties.length} ties, ${rendered.dots.length} dots</p>
    <p><strong>Note:</strong> If SMuFL glyphs appear as boxes, the Leland font may not be loading. Copy Leland.otf to the same directory as this HTML file.</p>
  </div>
</body>
</html>`;
  
  fs.writeFileSync(htmlProPath, htmlPro);
  console.log(`Saved professional HTML to: ${htmlProPath}`);
  
  // Copy Leland font to test-output for easy access
  const fontFilePath = path.join(__dirname, '..', '..', 'public', 'fonts', 'Leland.otf');
  const fontDest = path.join(outputDir, 'Leland.otf');
  if (fs.existsSync(fontFilePath)) {
    fs.copyFileSync(fontFilePath, fontDest);
    console.log('Copied Leland.otf to test-output directory');
  }
  
  console.log('\nDone! Open notation_professional.html in a browser to view the Dorico-like notation.');
  console.log('For best results, ensure the Leland.otf font is in the same directory.');
}

main().catch(console.error);
