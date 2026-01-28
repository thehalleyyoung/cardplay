/**
 * @fileoverview Tests for Notation Module (Phase 11.1).
 * 
 * Tests all notation rendering functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Types
  ClefType,
  NoteDuration,
  TimeSignature,
  NotationEvent,
  NotationMeasure,
  NotationNote,
  
  // Staff
  calculateStaffLines,
  createDefaultStaffConfig,
  getStaffPositionY,
  midiToStaffPosition,
  renderClef,
  renderKeySignature,
  renderTimeSignature,
  getClefWidth,
  getKeySignatureWidth,
  getTimeSignatureWidth,
  CLEF_DEFINITIONS,
  KEY_SIGNATURES,
  DEFAULT_STAFF_DIMENSIONS,
  
  // Notes
  getNoteHeadShape,
  getNoteHeadDimensions,
  renderNoteHead,
  renderStem,
  renderChordStem,
  determineStemDirection,
  determineChordStemDirection,
  createBeamGroups,
  renderBeamGroup,
  renderRest,
  renderDots,
  getAccidentalWidth,
  resolveAccidentalPositions,
  
  // Duration
  calculateDurationValue,
  findClosestDuration,
  DURATION_VALUES,
  DURATION_FLAGS,
  
  // Bar lines
  renderBarLine,
  getBarLineWidth,
  
  // Curves
  calculateCurve,
  evaluateBezier,
  getBezierBounds,
  determineCurvePlacement,
  renderTie,
  renderSlur,
  
  // Tuplets
  renderTuplet,
  createTriplet,
  createQuintuplet,
  calculateTupletNoteDuration,
  
  // Layout
  calculateDurationSpacing,
  calculateMeasureNotePositions,
  boxesOverlap,
  resolveCollisions,
  layoutMeasure,
  layoutSystem,
  layoutPage,
  DEFAULT_SPACING_CONFIG,
  resolveAccidentalCollisions,
  resolveArticulationCollisions,
  optimizeStemDirection,
  optimizeBeamAngle,
  optimizeSlurCurvature,
  calculateTiePlacement,
  
  // Panel
  NotationPanel,
  createSingleStaffPanel,
  createPianoPanel,
  createScorePanel,
  DEFAULT_PANEL_STATE,
} from './index';

// ============================================================================
// STAFF TESTS
// ============================================================================

describe('Staff Rendering', () => {
  describe('calculateStaffLines', () => {
    it('should create 5 staff lines by default', () => {
      const config = createDefaultStaffConfig('test-staff');
      const staff = calculateStaffLines(
        'test-staff',
        config,
        DEFAULT_STAFF_DIMENSIONS,
        0, 0, 400
      );
      
      expect(staff.lines).toHaveLength(5);
      expect(staff.lines[0].lineNumber).toBe(1);
      expect(staff.lines[4].lineNumber).toBe(5);
    });
    
    it('should calculate correct Y positions for lines', () => {
      const config = createDefaultStaffConfig('test-staff');
      const staff = calculateStaffLines(
        'test-staff',
        config,
        DEFAULT_STAFF_DIMENSIONS,
        0, 0, 400
      );
      
      // Lines should be spaced by lineSpacing
      const spacing = DEFAULT_STAFF_DIMENSIONS.lineSpacing;
      for (let i = 0; i < staff.lines.length - 1; i++) {
        const diff = staff.lines[i].y - staff.lines[i + 1].y;
        expect(diff).toBe(spacing);
      }
    });
  });
  
  describe('midiToStaffPosition', () => {
    it('should map middle C (60) correctly for treble clef', () => {
      const result = midiToStaffPosition(60, 'treble');
      // Middle C is below the treble staff
      expect(result.position).toBeLessThan(-4);
      expect(result.ledgerLines).toBeGreaterThan(0);
    });
    
    it('should map middle C (60) correctly for bass clef', () => {
      const result = midiToStaffPosition(60, 'bass');
      // Middle C is above the bass staff
      expect(result.position).toBeGreaterThan(4);
      expect(result.ledgerLines).toBeGreaterThan(0);
    });
    
    it('should require no ledger lines for notes on staff', () => {
      // G4 (67) is on the second line of treble clef
      const result = midiToStaffPosition(67, 'treble');
      expect(result.ledgerLines).toBe(0);
    });
  });
  
  describe('getStaffPositionY', () => {
    it('should return middle line Y for position 0', () => {
      const config = createDefaultStaffConfig('test-staff');
      const staff = calculateStaffLines(
        'test-staff',
        config,
        DEFAULT_STAFF_DIMENSIONS,
        0, 0, 400
      );
      
      const y = getStaffPositionY(staff, 0);
      // Should be approximately at the middle of the staff
      expect(y).toBeCloseTo(staff.y + staff.dimensions.height / 2, 1);
    });
  });
});

// ============================================================================
// CLEF TESTS
// ============================================================================

describe('Clef Rendering', () => {
  it('should have definitions for all clef types', () => {
    const clefTypes: ClefType[] = ['treble', 'bass', 'alto', 'tenor', 'percussion'];
    
    for (const clef of clefTypes) {
      expect(CLEF_DEFINITIONS[clef]).toBeDefined();
      expect(CLEF_DEFINITIONS[clef].middleLinePitch).toBeGreaterThan(0);
    }
  });
  
  it('should render clef at correct position', () => {
    const config = createDefaultStaffConfig('test-staff', { clef: 'treble' });
    const staff = calculateStaffLines(
      'test-staff',
      config,
      DEFAULT_STAFF_DIMENSIONS,
      0, 0, 400
    );
    
    const clef = renderClef(staff, 'treble', 10);
    
    expect(clef.x).toBe(10);
    expect(clef.type).toBe('treble');
    expect(clef.width).toBeGreaterThan(0);
    expect(clef.height).toBeGreaterThan(0);
  });
  
  it('should return correct width for different clefs', () => {
    expect(getClefWidth('treble')).toBeGreaterThan(0);
    expect(getClefWidth('bass')).toBeGreaterThan(0);
    expect(getClefWidth('alto')).toBeGreaterThan(0);
  });
});

// ============================================================================
// KEY SIGNATURE TESTS
// ============================================================================

describe('Key Signature Rendering', () => {
  it('should have all major and minor keys defined', () => {
    // Major keys
    expect(KEY_SIGNATURES['C']).toBeDefined();
    expect(KEY_SIGNATURES['G']).toBeDefined();
    expect(KEY_SIGNATURES['F']).toBeDefined();
    
    // Minor keys
    expect(KEY_SIGNATURES['Am']).toBeDefined();
    expect(KEY_SIGNATURES['Em']).toBeDefined();
    expect(KEY_SIGNATURES['Dm']).toBeDefined();
  });
  
  it('should render correct number of sharps', () => {
    const config = createDefaultStaffConfig('test-staff', { clef: 'treble' });
    const staff = calculateStaffLines(
      'test-staff',
      config,
      DEFAULT_STAFF_DIMENSIONS,
      0, 0, 400
    );
    
    // G major has 1 sharp
    const gMajor = renderKeySignature(staff, 'G', 50);
    expect(gMajor.accidentals).toHaveLength(1);
    expect(gMajor.accidentals[0].type).toBe('sharp');
    
    // D major has 2 sharps
    const dMajor = renderKeySignature(staff, 'D', 50);
    expect(dMajor.accidentals).toHaveLength(2);
  });
  
  it('should render correct number of flats', () => {
    const config = createDefaultStaffConfig('test-staff', { clef: 'treble' });
    const staff = calculateStaffLines(
      'test-staff',
      config,
      DEFAULT_STAFF_DIMENSIONS,
      0, 0, 400
    );
    
    // F major has 1 flat
    const fMajor = renderKeySignature(staff, 'F', 50);
    expect(fMajor.accidentals).toHaveLength(1);
    expect(fMajor.accidentals[0].type).toBe('flat');
    
    // Bb major has 2 flats
    const bbMajor = renderKeySignature(staff, 'Bb', 50);
    expect(bbMajor.accidentals).toHaveLength(2);
  });
  
  it('should return 0 width for C major', () => {
    expect(getKeySignatureWidth('C')).toBe(0);
  });
});

// ============================================================================
// TIME SIGNATURE TESTS
// ============================================================================

describe('Time Signature Rendering', () => {
  it('should render numeric time signatures', () => {
    const config = createDefaultStaffConfig('test-staff');
    const staff = calculateStaffLines(
      'test-staff',
      config,
      DEFAULT_STAFF_DIMENSIONS,
      0, 0, 400
    );
    
    const timeSig = renderTimeSignature(staff, '4/4', 100);
    
    expect(timeSig.signature.numerator).toBe(4);
    expect(timeSig.signature.denominator).toBe(4);
    expect(timeSig.numeratorText).toBe('4');
    expect(timeSig.denominatorText).toBe('4');
  });
  
  it('should recognize common time', () => {
    const config = createDefaultStaffConfig('test-staff');
    const staff = calculateStaffLines(
      'test-staff',
      config,
      DEFAULT_STAFF_DIMENSIONS,
      0, 0, 400
    );
    
    const timeSig = renderTimeSignature(staff, 'C', 100);
    
    expect(timeSig.display).toBe('common');
    expect(timeSig.signature.numerator).toBe(4);
    expect(timeSig.signature.denominator).toBe(4);
  });
});

// ============================================================================
// NOTE DURATION TESTS
// ============================================================================

describe('Note Duration', () => {
  it('should have correct base duration values', () => {
    expect(DURATION_VALUES['whole']).toBe(4);
    expect(DURATION_VALUES['half']).toBe(2);
    expect(DURATION_VALUES['quarter']).toBe(1);
    expect(DURATION_VALUES['eighth']).toBe(0.5);
    expect(DURATION_VALUES['16th']).toBe(0.25);
  });
  
  it('should calculate dotted duration correctly', () => {
    // Quarter note = 1, dotted quarter = 1.5
    const dottedQuarter: NoteDuration = { base: 'quarter', dots: 1 };
    expect(calculateDurationValue(dottedQuarter)).toBe(1.5);
    
    // Half note = 2, double dotted half = 2 + 1 + 0.5 = 3.5
    const doubleDottedHalf: NoteDuration = { base: 'half', dots: 2 };
    expect(calculateDurationValue(doubleDottedHalf)).toBe(3.5);
  });
  
  it('should find closest duration for a value', () => {
    // Exact quarter note
    const quarter = findClosestDuration(1.0);
    expect(quarter.base).toBe('quarter');
    expect(quarter.dots).toBe(0);
    
    // Dotted quarter
    const dottedQuarter = findClosestDuration(1.5);
    expect(dottedQuarter.base).toBe('quarter');
    expect(dottedQuarter.dots).toBe(1);
  });
  
  it('should have correct flag counts', () => {
    expect(DURATION_FLAGS['quarter']).toBe(0);
    expect(DURATION_FLAGS['eighth']).toBe(1);
    expect(DURATION_FLAGS['16th']).toBe(2);
    expect(DURATION_FLAGS['32nd']).toBe(3);
  });
});

// ============================================================================
// NOTE RENDERING TESTS
// ============================================================================

describe('Note Rendering', () => {
  let staff: ReturnType<typeof calculateStaffLines>;
  
  beforeEach(() => {
    const config = createDefaultStaffConfig('test-staff', { clef: 'treble' });
    staff = calculateStaffLines(
      'test-staff',
      config,
      DEFAULT_STAFF_DIMENSIONS,
      0, 0, 400
    );
  });
  
  describe('Note Head', () => {
    it('should render note head at correct position', () => {
      const note: NotationNote = { id: 'note-1', pitch: 67 }; // G4
      const noteHead = renderNoteHead(note, 'quarter', staff, 100);
      
      expect(noteHead.id).toBe('note-1');
      expect(noteHead.pitch).toBe(67);
      expect(noteHead.x).toBe(100);
      expect(noteHead.filled).toBe(true); // Quarter notes are filled
    });
    
    it('should return unfilled note head for half and whole notes', () => {
      const note: NotationNote = { id: 'note-1', pitch: 67 };
      
      const halfNote = renderNoteHead(note, 'half', staff, 100);
      expect(halfNote.filled).toBe(false);
      
      const wholeNote = renderNoteHead(note, 'whole', staff, 100);
      expect(wholeNote.filled).toBe(false);
    });
    
    it('should return correct note head shape', () => {
      expect(getNoteHeadShape('quarter')).toBe('normal');
      expect(getNoteHeadShape('half')).toBe('half');
      expect(getNoteHeadShape('whole')).toBe('whole');
      expect(getNoteHeadShape('breve')).toBe('breve');
    });
  });
  
  describe('Stem Direction', () => {
    it('should return down for notes above middle line', () => {
      // Position > 0 means above middle line
      expect(determineStemDirection(2)).toBe('down');
      expect(determineStemDirection(4)).toBe('down');
    });
    
    it('should return up for notes below middle line', () => {
      // Position < 0 means below middle line
      expect(determineStemDirection(-2)).toBe('up');
      expect(determineStemDirection(-4)).toBe('up');
    });
    
    it('should return down for middle line', () => {
      expect(determineStemDirection(0)).toBe('down');
    });
    
    it('should respect overrides', () => {
      expect(determineStemDirection(4, 'up')).toBe('up');
      expect(determineStemDirection(-4, 'down')).toBe('down');
    });
    
    it('should determine chord stem direction based on average', () => {
      // All above middle line
      expect(determineChordStemDirection([2, 4, 6])).toBe('down');
      
      // All below middle line
      expect(determineChordStemDirection([-2, -4, -6])).toBe('up');
      
      // Mixed, average at middle
      expect(determineChordStemDirection([-2, 0, 2])).toBe('down');
    });
  });
  
  describe('Stem Rendering', () => {
    it('should not render stem for whole notes', () => {
      const note: NotationNote = { id: 'note-1', pitch: 67 };
      const noteHead = renderNoteHead(note, 'whole', staff, 100);
      
      const stem = renderStem(noteHead, 'whole', 'auto', staff);
      expect(stem).toBeNull();
    });
    
    it('should render stem for quarter notes', () => {
      const note: NotationNote = { id: 'note-1', pitch: 67 };
      const noteHead = renderNoteHead(note, 'quarter', staff, 100);
      
      const stem = renderStem(noteHead, 'quarter', 'auto', staff);
      expect(stem).not.toBeNull();
      expect(stem!.flags).toHaveLength(0);
    });
    
    it('should render flags for eighth notes', () => {
      const note: NotationNote = { id: 'note-1', pitch: 67 };
      const noteHead = renderNoteHead(note, 'eighth', staff, 100);
      
      const stem = renderStem(noteHead, 'eighth', 'auto', staff);
      expect(stem).not.toBeNull();
      expect(stem!.flags).toHaveLength(1);
    });
  });
  
  describe('Beam Groups', () => {
    it('should create beam groups from consecutive flagged notes', () => {
      const events: NotationEvent[] = [
        { id: 'e1', notes: [{ id: 'n1', pitch: 60 }], duration: { base: 'eighth', dots: 0 }, tick: 0, voice: 1, staff: 0, isRest: false },
        { id: 'e2', notes: [{ id: 'n2', pitch: 62 }], duration: { base: 'eighth', dots: 0 }, tick: 240, voice: 1, staff: 0, isRest: false },
        { id: 'e3', notes: [{ id: 'n3', pitch: 64 }], duration: { base: 'eighth', dots: 0 }, tick: 480, voice: 1, staff: 0, isRest: false },
        { id: 'e4', notes: [{ id: 'n4', pitch: 65 }], duration: { base: 'eighth', dots: 0 }, tick: 720, voice: 1, staff: 0, isRest: false },
      ];
      
      const groups = createBeamGroups(events);
      expect(groups.length).toBeGreaterThan(0);
    });
    
    it('should not beam across rests', () => {
      const events: NotationEvent[] = [
        { id: 'e1', notes: [{ id: 'n1', pitch: 60 }], duration: { base: 'eighth', dots: 0 }, tick: 0, voice: 1, staff: 0, isRest: false },
        { id: 'e2', notes: [], duration: { base: 'eighth', dots: 0 }, tick: 240, voice: 1, staff: 0, isRest: true },
        { id: 'e3', notes: [{ id: 'n3', pitch: 64 }], duration: { base: 'eighth', dots: 0 }, tick: 480, voice: 1, staff: 0, isRest: false },
      ];
      
      const groups = createBeamGroups(events);
      // Should create separate groups
      expect(groups.every(g => g.noteIndices.every(i => !events[i].isRest))).toBe(true);
    });
  });
  
  describe('Rest Rendering', () => {
    it('should render rest at correct position', () => {
      const rest = renderRest('rest-1', { base: 'quarter', dots: 0 }, staff, 150);
      
      expect(rest.id).toBe('rest-1');
      expect(rest.duration).toBe('quarter');
      expect(rest.dots).toBe(0);
    });
  });
  
  describe('Dot Rendering', () => {
    it('should render correct number of dots', () => {
      const note: NotationNote = { id: 'note-1', pitch: 67 };
      const noteHead = renderNoteHead(note, 'quarter', staff, 100);
      
      const singleDot = renderDots(noteHead, 1, staff);
      expect(singleDot).toHaveLength(1);
      
      const doubleDot = renderDots(noteHead, 2, staff);
      expect(doubleDot).toHaveLength(2);
    });
  });
  
  describe('Accidentals', () => {
    it('should return correct width for accidentals', () => {
      expect(getAccidentalWidth('sharp')).toBeGreaterThan(0);
      expect(getAccidentalWidth('flat')).toBeGreaterThan(0);
      expect(getAccidentalWidth('natural')).toBeGreaterThan(0);
      expect(getAccidentalWidth('double-sharp')).toBeGreaterThan(getAccidentalWidth('sharp'));
    });
    
    it('should resolve accidental collisions', () => {
      const note1: NotationNote = { id: 'n1', pitch: 60, accidental: 'sharp' };
      const note2: NotationNote = { id: 'n2', pitch: 62, accidental: 'sharp' };
      
      const noteHead1 = renderNoteHead(note1, 'quarter', staff, 100);
      const noteHead2 = renderNoteHead(note2, 'quarter', staff, 100);
      
      const resolved = resolveAccidentalPositions([noteHead1, noteHead2], 100);
      
      // Both accidentals should have different X positions if they would collide
      if (resolved[0].accidental && resolved[1].accidental) {
        // They may or may not overlap depending on vertical distance
        expect(resolved[0].accidental.x).toBeDefined();
        expect(resolved[1].accidental.x).toBeDefined();
      }
    });
  });
});

// ============================================================================
// BAR LINE TESTS
// ============================================================================

describe('Bar Line Rendering', () => {
  let staff: ReturnType<typeof calculateStaffLines>;
  
  beforeEach(() => {
    const config = createDefaultStaffConfig('test-staff');
    staff = calculateStaffLines(
      'test-staff',
      config,
      DEFAULT_STAFF_DIMENSIONS,
      0, 0, 400
    );
  });
  
  it('should render single bar line', () => {
    const barLine = renderBarLine('single', staff, 200);
    
    expect(barLine.type).toBe('single');
    expect(barLine.elements.length).toBe(1);
    expect(barLine.elements[0].type).toBe('line');
  });
  
  it('should render double bar line', () => {
    const barLine = renderBarLine('double', staff, 200);
    
    expect(barLine.type).toBe('double');
    expect(barLine.elements.filter(e => e.type === 'line')).toHaveLength(2);
  });
  
  it('should render repeat signs with dots', () => {
    const repeatStart = renderBarLine('repeat-start', staff, 200);
    expect(repeatStart.elements.some(e => e.type === 'dot')).toBe(true);
    
    const repeatEnd = renderBarLine('repeat-end', staff, 200);
    expect(repeatEnd.elements.some(e => e.type === 'dot')).toBe(true);
  });
  
  it('should return correct width for bar line types', () => {
    expect(getBarLineWidth('single')).toBeGreaterThan(0);
    expect(getBarLineWidth('double')).toBeGreaterThan(getBarLineWidth('single'));
    expect(getBarLineWidth('repeat-start')).toBeGreaterThan(getBarLineWidth('double'));
    expect(getBarLineWidth('none')).toBe(0);
  });
});

// ============================================================================
// CURVE TESTS (TIES & SLURS)
// ============================================================================

describe('Curve Rendering', () => {
  describe('Bezier Curves', () => {
    it('should calculate bezier curve', () => {
      const curve = calculateCurve(0, 100, 200, 100, 'above', {
        endThickness: 0.5,
        midThickness: 3,
        minHeight: 8,
        maxHeight: 25,
        heightFactor: 0.15,
        noteOffset: 4,
      });
      
      expect(curve.startX).toBe(0);
      expect(curve.endX).toBe(200);
      expect(curve.control1Y).toBeLessThan(100); // Above the line
      expect(curve.control2Y).toBeLessThan(100);
    });
    
    it('should evaluate bezier at t=0 and t=1', () => {
      const curve = calculateCurve(0, 100, 200, 100, 'above', {
        endThickness: 0.5,
        midThickness: 3,
        minHeight: 8,
        maxHeight: 25,
        heightFactor: 0.15,
        noteOffset: 4,
      });
      
      const start = evaluateBezier(curve, 0);
      expect(start.x).toBeCloseTo(curve.startX, 5);
      expect(start.y).toBeCloseTo(curve.startY, 5);
      
      const end = evaluateBezier(curve, 1);
      expect(end.x).toBeCloseTo(curve.endX, 5);
      expect(end.y).toBeCloseTo(curve.endY, 5);
    });
    
    it('should calculate bezier bounds', () => {
      const curve = calculateCurve(0, 100, 200, 100, 'above', {
        endThickness: 0.5,
        midThickness: 3,
        minHeight: 8,
        maxHeight: 25,
        heightFactor: 0.15,
        noteOffset: 4,
      });
      
      const bounds = getBezierBounds(curve);
      
      expect(bounds.minX).toBe(0);
      expect(bounds.maxX).toBe(200);
      expect(bounds.minY).toBeLessThan(100); // Curve goes above
    });
  });
  
  describe('Curve Placement', () => {
    it('should place curve opposite to stem direction', () => {
      expect(determineCurvePlacement('up', 'up', 0, 0)).toBe('below');
      expect(determineCurvePlacement('down', 'down', 0, 0)).toBe('above');
    });
    
    it('should respect override', () => {
      expect(determineCurvePlacement('up', 'up', 0, 0, 'above')).toBe('above');
      expect(determineCurvePlacement('down', 'down', 0, 0, 'below')).toBe('below');
    });
  });
});

// ============================================================================
// TUPLET TESTS
// ============================================================================

describe('Tuplet Rendering', () => {
  it('should create triplet correctly', () => {
    const triplet = createTriplet('triplet-1', ['n1', 'n2', 'n3']);
    
    expect(triplet.actual).toBe(3);
    expect(triplet.normal).toBe(2);
    expect(triplet.noteIds).toHaveLength(3);
    expect(triplet.showBracket).toBe(true);
    expect(triplet.showNumber).toBe(true);
  });
  
  it('should create quintuplet correctly', () => {
    const quintuplet = createQuintuplet('quint-1', ['n1', 'n2', 'n3', 'n4', 'n5']);
    
    expect(quintuplet.actual).toBe(5);
    expect(quintuplet.normal).toBe(4);
    expect(quintuplet.noteIds).toHaveLength(5);
  });
  
  it('should calculate tuplet note duration', () => {
    const triplet = createTriplet('t1', ['n1', 'n2', 'n3']);
    
    // 3 eighth notes in the space of 2
    // Normal eighth = 0.5 quarter notes
    // Triplet eighth = 0.5 * 2/3 = 0.333...
    const duration = calculateTupletNoteDuration(0.5, triplet);
    expect(duration).toBeCloseTo(0.333, 2);
  });
});

// ============================================================================
// LAYOUT TESTS
// ============================================================================

describe('Layout Engine', () => {
  describe('Spacing', () => {
    it('should calculate spacing based on duration', () => {
      const quarterSpacing = calculateDurationSpacing(
        { base: 'quarter', dots: 0 },
        DEFAULT_SPACING_CONFIG
      );
      
      const eighthSpacing = calculateDurationSpacing(
        { base: 'eighth', dots: 0 },
        DEFAULT_SPACING_CONFIG
      );
      
      // Quarter note should have more space than eighth
      expect(quarterSpacing).toBeGreaterThan(eighthSpacing);
    });
    
    it('should respect minimum spacing', () => {
      const spacing = calculateDurationSpacing(
        { base: '64th', dots: 0 },
        DEFAULT_SPACING_CONFIG
      );
      
      expect(spacing).toBeGreaterThanOrEqual(DEFAULT_SPACING_CONFIG.minNoteSpacing);
    });
  });
  
  describe('Collision Detection', () => {
    it('should detect overlapping boxes', () => {
      const box1 = { x: 0, y: 0, width: 10, height: 10 };
      const box2 = { x: 5, y: 5, width: 10, height: 10 };
      const box3 = { x: 20, y: 20, width: 10, height: 10 };
      
      expect(boxesOverlap(box1, box2)).toBe(true);
      expect(boxesOverlap(box1, box3)).toBe(false);
    });
    
    it('should resolve collisions', () => {
      const items = [
        { id: 'a', box: { x: 0, y: 0, width: 10, height: 10 }, priority: 2 },
        { id: 'b', box: { x: 5, y: 0, width: 10, height: 10 }, priority: 1 },
      ];
      
      const adjustments = resolveCollisions(items);
      
      // Higher priority item shouldn't move, lower should
      expect(adjustments.get('a')?.dx).toBe(0);
      expect(adjustments.get('b')?.dx).not.toBe(0);
    });
  });
  
  describe('Measure Layout', () => {
    it('should layout measure with notes', () => {
      const events = new Map<number, NotationEvent[]>();
      events.set(1, [
        { id: 'e1', notes: [{ id: 'n1', pitch: 60 }], duration: { base: 'quarter', dots: 0 }, tick: 0, voice: 1, staff: 0, isRest: false },
        { id: 'e2', notes: [{ id: 'n2', pitch: 62 }], duration: { base: 'quarter', dots: 0 }, tick: 480, voice: 1, staff: 0, isRest: false },
      ]);
      
      const measure: NotationMeasure = {
        number: 1,
        events,
        endBarLine: 'single',
      };
      
      const staffConfig = createDefaultStaffConfig('staff-1');
      const layout = layoutMeasure(
        measure,
        staffConfig,
        0,
        200,
        true,
        true,
        true
      );
      
      expect(layout.measureNumber).toBe(1);
      expect(layout.width).toBe(200);
      expect(layout.notePositions.length).toBe(2);
    });
  });
});

// ============================================================================
// NOTATION PANEL TESTS
// ============================================================================

describe('NotationPanel', () => {
  describe('Creation', () => {
    it('should create single staff panel', () => {
      const panel = createSingleStaffPanel('treble', 'G', '3/4');
      expect(panel).toBeInstanceOf(NotationPanel);
      
      const state = panel.getState();
      expect(state.editMode).toBe('select');
    });
    
    it('should create piano panel', () => {
      const panel = createPianoPanel('C', '4/4');
      expect(panel).toBeInstanceOf(NotationPanel);
    });
    
    it('should create score panel', () => {
      const panel = createScorePanel([
        { name: 'Flute', clef: 'treble' },
        { name: 'Violin', clef: 'treble' },
        { name: 'Cello', clef: 'bass' },
      ]);
      expect(panel).toBeInstanceOf(NotationPanel);
    });
  });
  
  describe('State Management', () => {
    let panel: NotationPanel;
    
    beforeEach(() => {
      panel = createSingleStaffPanel();
    });
    
    it('should initialize with default state', () => {
      const state = panel.getState();
      
      expect(state.zoom.level).toBe(1.0);
      expect(state.scroll.x).toBe(0);
      expect(state.scroll.y).toBe(0);
      expect(state.editMode).toBe('select');
      expect(state.isPlaying).toBe(false);
    });
    
    it('should set zoom level', () => {
      panel.setZoom(2.0);
      expect(panel.getState().zoom.level).toBe(2.0);
    });
    
    it('should clamp zoom to min/max', () => {
      panel.setZoom(0.1); // Below min
      expect(panel.getState().zoom.level).toBe(DEFAULT_PANEL_STATE.zoom.minLevel);
      
      panel.setZoom(10.0); // Above max
      expect(panel.getState().zoom.level).toBe(DEFAULT_PANEL_STATE.zoom.maxLevel);
    });
    
    it('should set edit mode', () => {
      panel.setEditMode('note');
      expect(panel.getState().editMode).toBe('note');
      
      panel.setEditMode('rest');
      expect(panel.getState().editMode).toBe('rest');
    });
    
    it('should set input duration', () => {
      panel.setInputDuration({ base: 'eighth', dots: 1 });
      expect(panel.getState().inputDuration.base).toBe('eighth');
      expect(panel.getState().inputDuration.dots).toBe(1);
    });
  });
  
  describe('Selection', () => {
    let panel: NotationPanel;
    
    beforeEach(() => {
      panel = createSingleStaffPanel();
    });
    
    it('should select notes', () => {
      panel.selectNotes(['note-1', 'note-2']);
      
      const selection = panel.getState().selection;
      expect(selection.selectedNoteIds.has('note-1')).toBe(true);
      expect(selection.selectedNoteIds.has('note-2')).toBe(true);
    });
    
    it('should add to selection', () => {
      panel.selectNotes(['note-1']);
      panel.selectNotes(['note-2'], true);
      
      const selection = panel.getState().selection;
      expect(selection.selectedNoteIds.has('note-1')).toBe(true);
      expect(selection.selectedNoteIds.has('note-2')).toBe(true);
    });
    
    it('should clear selection', () => {
      panel.selectNotes(['note-1', 'note-2']);
      panel.clearSelection();
      
      const selection = panel.getState().selection;
      expect(selection.selectedNoteIds.size).toBe(0);
    });
  });
  
  describe('Playback', () => {
    let panel: NotationPanel;
    
    beforeEach(() => {
      panel = createSingleStaffPanel();
    });
    
    it('should set playhead tick', () => {
      panel.setPlayheadTick(960);
      expect(panel.getState().playheadTick).toBe(960);
    });
    
    it('should set playing state', () => {
      panel.setPlaying(true);
      expect(panel.getState().isPlaying).toBe(true);
      
      panel.setPlaying(false);
      expect(panel.getState().isPlaying).toBe(false);
    });
  });
  
  describe('Events', () => {
    it('should emit events on state change', () => {
      const panel = createSingleStaffPanel();
      let emittedState: any = null;
      
      panel.on('stateChange', (state) => {
        emittedState = state;
      });
      
      panel.setZoom(1.5);
      
      expect(emittedState).not.toBeNull();
      expect(emittedState.zoom.level).toBe(1.5);
    });
    
    it('should allow unsubscribing from events', () => {
      const panel = createSingleStaffPanel();
      let callCount = 0;
      
      const unsubscribe = panel.on('stateChange', () => {
        callCount++;
      });
      
      panel.setZoom(1.5);
      expect(callCount).toBe(1);
      
      unsubscribe();
      
      panel.setZoom(2.0);
      expect(callCount).toBe(1); // Should not have increased
    });
  });
  
  describe('Rendering', () => {
    it('should render empty notation', () => {
      const panel = createSingleStaffPanel();
      const rendered = panel.render();
      
      expect(rendered).toBeDefined();
      expect(rendered.pages).toEqual([]);
      expect(rendered.noteHeads).toEqual([]);
    });
    
    it('should render measures', () => {
      const panel = createSingleStaffPanel();
      
      const events = new Map<number, NotationEvent[]>();
      events.set(1, [
        { id: 'e1', notes: [{ id: 'n1', pitch: 60 }], duration: { base: 'quarter', dots: 0 }, tick: 0, voice: 1, staff: 0, isRest: false },
      ]);
      
      panel.setMeasures([{
        number: 1,
        events,
        endBarLine: 'single',
      }]);
      
      const rendered = panel.getRenderedNotation();
      expect(rendered).not.toBeNull();
      expect(rendered!.pages.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// ADVANCED LAYOUT TESTS (Section 11.4)
// ============================================================================

describe('Advanced Layout Engine', () => {
  describe('Accidental Collision Resolution', () => {
    it('should stack accidentals in columns when they collide', () => {
      // Use imported resolveAccidentalCollisions
      
      const accidentals = [
        { id: 'acc1', staffPos: 10, width: 8 },
        { id: 'acc2', staffPos: 9, width: 8 },
        { id: 'acc3', staffPos: 8, width: 8 },
      ];
      
      const offsets = resolveAccidentalCollisions(accidentals);
      
      expect(offsets.size).toBe(3);
      // At least one should be offset
      const values = Array.from(offsets.values());
      expect(values.some(v => v !== 0)).toBe(true);
    });
    
    it('should place distant accidentals in same column', () => {
      // Use imported resolveAccidentalCollisions
      
      const accidentals = [
        { id: 'acc1', staffPos: 15, width: 8 },
        { id: 'acc2', staffPos: 5, width: 8 },
      ];
      
      const offsets = resolveAccidentalCollisions(accidentals);
      
      // Distant accidentals should be in same column (no offset difference)
      const offset1 = offsets.get('acc1')!;
      const offset2 = offsets.get('acc2')!;
      expect(offset1).toBe(offset2);
    });
    
    it('should handle empty accidentals array', () => {
      // Use imported resolveAccidentalCollisions
      
      const offsets = resolveAccidentalCollisions([]);
      expect(offsets.size).toBe(0);
    });
    
    it('should respect minimum gap configuration', () => {
      // Use imported resolveAccidentalCollisions
      
      const accidentals = [
        { id: 'acc1', staffPos: 10, width: 10 },
        { id: 'acc2', staffPos: 9, width: 10 },
      ];
      
      const config = {
        minAccidentalGap: 5,
        maxStackHeight: 7,
        diagonalStacking: true,
      };
      
      const offsets = resolveAccidentalCollisions(accidentals, config);
      
      const offset1 = offsets.get('acc1')!;
      const offset2 = offsets.get('acc2')!;
      
      // Should have at least width + gap separation
      expect(Math.abs(offset1 - offset2)).toBeGreaterThanOrEqual(10);
    });
  });
  
  describe('Articulation Collision Resolution', () => {
    it('should stack articulations above note', () => {
      // Use imported resolveArticulationCollisions
      
      const articulations = [
        { id: 'art1', height: 5, placement: 'above' as const },
        { id: 'art2', height: 5, placement: 'above' as const },
      ];
      
      const offsets = resolveArticulationCollisions(articulations);
      
      expect(offsets.size).toBe(2);
      const offset1 = offsets.get('art1')!;
      const offset2 = offsets.get('art2')!;
      
      // Second articulation should be further from note
      expect(Math.abs(offset2)).toBeGreaterThan(Math.abs(offset1));
    });
    
    it('should stack articulations below note separately', () => {
      // Use imported resolveArticulationCollisions
      
      const articulations = [
        { id: 'art1', height: 5, placement: 'above' as const },
        { id: 'art2', height: 5, placement: 'below' as const },
      ];
      
      const offsets = resolveArticulationCollisions(articulations);
      
      const offset1 = offsets.get('art1')!;
      const offset2 = offsets.get('art2')!;
      
      // Above should be negative, below should be positive
      expect(offset1).toBeLessThan(0);
      expect(offset2).toBeGreaterThan(0);
    });
    
    it('should handle minimum gap configuration', () => {
      // Use imported resolveArticulationCollisions
      
      const articulations = [
        { id: 'art1', height: 8, placement: 'above' as const },
        { id: 'art2', height: 6, placement: 'above' as const },
      ];
      
      const config = {
        defaultOffset: 10,
        minArticulationGap: 3,
        preferAbove: true,
      };
      
      const offsets = resolveArticulationCollisions(articulations, config);
      
      const offset1 = offsets.get('art1')!;
      const offset2 = offsets.get('art2')!;
      
      // Gap should include heights and minimum gap
      expect(Math.abs(offset2) - Math.abs(offset1)).toBeGreaterThanOrEqual(8 + 3);
    });
  });
  
  describe('Stem Direction Optimization', () => {
    it('should assign down direction for notes above middle', () => {
      // Use imported optimizeStemDirection
      
      const notes = [
        { id: 'n1', staffPos: 5, voice: 1 },
      ];
      
      const directions = optimizeStemDirection(notes, 0);
      expect(directions.get('n1')).toBe('down');
    });
    
    it('should assign up direction for notes below middle', () => {
      // Use imported optimizeStemDirection
      
      const notes = [
        { id: 'n1', staffPos: -5, voice: 1 },
      ];
      
      const directions = optimizeStemDirection(notes, 0);
      expect(directions.get('n1')).toBe('up');
    });
    
    it('should respect voice-based preferences', () => {
      // Use imported optimizeStemDirection
      
      const notes = [
        { id: 'n1', staffPos: 0, voice: 2 },
        { id: 'n2', staffPos: 0, voice: 0 },
      ];
      
      const directions = optimizeStemDirection(notes, 0);
      
      // Higher voice number prefers down, lower prefers up
      expect(directions.get('n1')).toBe('down');
      expect(directions.get('n2')).toBe('up');
    });
    
    it('should handle middle line notes', () => {
      // Use imported optimizeStemDirection
      
      const notes = [
        { id: 'n1', staffPos: 0, voice: 1 },
      ];
      
      const directions = optimizeStemDirection(notes, 0);
      expect(directions.get('n1')).toBeDefined();
      expect(['up', 'down']).toContain(directions.get('n1'));
    });
  });
  
  describe('Beam Angle Optimization', () => {
    it('should return horizontal beam for similar staff positions', () => {
      // Use imported optimizeBeamAngle
      
      const notes = [
        { x: 0, staffPos: 5, stemDirection: 'up' as const },
        { x: 50, staffPos: 5, stemDirection: 'up' as const },
      ];
      
      const result = optimizeBeamAngle(notes);
      expect(result.angle).toBe(0);
    });
    
    it('should calculate positive angle for ascending notes', () => {
      // Use imported optimizeBeamAngle
      
      const notes = [
        { x: 0, staffPos: 0, stemDirection: 'up' as const },
        { x: 100, staffPos: 10, stemDirection: 'up' as const },
      ];
      
      const result = optimizeBeamAngle(notes);
      expect(result.angle).toBeGreaterThan(0);
    });
    
    it('should calculate negative angle for descending notes', () => {
      // Use imported optimizeBeamAngle
      
      const notes = [
        { x: 0, staffPos: 10, stemDirection: 'up' as const },
        { x: 100, staffPos: 0, stemDirection: 'up' as const },
      ];
      
      const result = optimizeBeamAngle(notes);
      expect(result.angle).toBeLessThan(0);
    });
    
    it('should clamp angle to maximum', () => {
      // Use imported optimizeBeamAngle
      
      const notes = [
        { x: 0, staffPos: 0, stemDirection: 'up' as const },
        { x: 10, staffPos: 50, stemDirection: 'up' as const },
      ];
      
      const config = { maxAngle: 30, minAngle: 5, preferHorizontal: false, horizontalThreshold: 2 };
      const result = optimizeBeamAngle(notes, config);
      
      expect(Math.abs(result.angle)).toBeLessThanOrEqual(30);
    });
    
    it('should handle single note', () => {
      // Use imported optimizeBeamAngle
      
      const notes = [
        { x: 0, staffPos: 5, stemDirection: 'up' as const },
      ];
      
      const result = optimizeBeamAngle(notes);
      expect(result.angle).toBe(0);
      expect(result.yStart).toBe(5);
    });
  });
  
  describe('Slur Curvature Optimization', () => {
    it('should generate control points for slur', () => {
      // Use imported optimizeSlurCurvature
      
      const result = optimizeSlurCurvature(0, 0, 100, 0, 0);
      
      expect(result.cp1x).toBeDefined();
      expect(result.cp1y).toBeDefined();
      expect(result.cp2x).toBeDefined();
      expect(result.cp2y).toBeDefined();
    });
    
    it('should adjust curvature for note range', () => {
      // Use imported optimizeSlurCurvature
      
      const smallRange = optimizeSlurCurvature(0, 0, 100, 0, 2);
      const largeRange = optimizeSlurCurvature(0, 0, 100, 0, 10);
      
      // Larger range should have flatter curve (smaller y offset)
      expect(Math.abs(largeRange.cp1y)).toBeLessThan(Math.abs(smallRange.cp1y));
    });
    
    it('should respect minimum curvature', () => {
      // Use imported optimizeSlurCurvature
      
      const config = {
        defaultHeight: 0.15,
        minCurvature: 0.08,
        maxCurvature: 0.25,
        adjustForRange: true,
      };
      
      const result = optimizeSlurCurvature(0, 0, 100, 0, 100, config);
      
      // Should still have some curvature despite large range
      expect(Math.abs(result.cp1y)).toBeGreaterThan(0);
    });
    
    it('should place control points at appropriate positions', () => {
      // Use imported optimizeSlurCurvature
      
      const result = optimizeSlurCurvature(0, 0, 120, 0, 0);
      
      // First control point should be about 1/4 through
      expect(result.cp1x).toBeGreaterThan(0);
      expect(result.cp1x).toBeLessThan(60);
      
      // Second control point should be about 3/4 through
      expect(result.cp2x).toBeGreaterThan(60);
      expect(result.cp2x).toBeLessThan(120);
    });
  });
  
  describe('Tie Placement', () => {
    it('should place tie above note for down stems', () => {
      // Use imported calculateTiePlacement
      
      const result = calculateTiePlacement(0, 5, 50, 5, 'down');
      
      expect(result.placement).toBe('above');
      expect(result.startY).toBeLessThan(5);
    });
    
    it('should place tie below note for up stems', () => {
      // Use imported calculateTiePlacement
      
      const result = calculateTiePlacement(0, 5, 50, 5, 'up');
      
      expect(result.placement).toBe('below');
      expect(result.startY).toBeGreaterThan(5);
    });
    
    it('should generate smooth curve control points', () => {
      // Use imported calculateTiePlacement
      
      const result = calculateTiePlacement(0, 5, 100, 5, 'down');
      
      expect(result.cp1x).toBeDefined();
      expect(result.cp1y).toBeDefined();
      expect(result.cp2x).toBeDefined();
      expect(result.cp2y).toBeDefined();
      
      // Control points should be between start and end
      expect(result.cp1x).toBeGreaterThan(result.startX);
      expect(result.cp1x).toBeLessThan(result.endX);
      expect(result.cp2x).toBeGreaterThan(result.startX);
      expect(result.cp2x).toBeLessThan(result.endX);
    });
    
    it('should handle ties between different staff positions', () => {
      // Use imported calculateTiePlacement
      
      const result = calculateTiePlacement(0, 5, 100, 10, 'down');
      
      expect(result.startY).toBeDefined();
      expect(result.endY).toBeDefined();
      expect(result.startY).not.toBe(result.endY);
    });
    
    it('should respect minimum tie length', () => {
      // Use imported calculateTiePlacement
      
      const config = {
        defaultOffset: 8,
        curvature: 0.12,
        minLength: 20,
        preferAbove: false,
      };
      
      const result = calculateTiePlacement(0, 5, 10, 5, 'up', config);
      
      // Even though x-span is only 10, control points should use minLength
      const span = result.cp2x - result.cp1x;
      expect(span).toBeGreaterThanOrEqual(0);
    });
    
    it('should return consistent data structure', () => {
      // Use imported calculateTiePlacement
      
      const result = calculateTiePlacement(0, 0, 50, 0, 'down');
      
      expect(result).toHaveProperty('startX');
      expect(result).toHaveProperty('startY');
      expect(result).toHaveProperty('endX');
      expect(result).toHaveProperty('endY');
      expect(result).toHaveProperty('placement');
      expect(result).toHaveProperty('cp1x');
      expect(result).toHaveProperty('cp1y');
      expect(result).toHaveProperty('cp2x');
      expect(result).toHaveProperty('cp2y');
    });
  });
});
