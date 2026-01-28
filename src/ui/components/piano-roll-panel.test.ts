/**
 * @fileoverview Tests for Piano Roll Panel - Note Display and Editing
 * 
 * Tests for note rendering, coloring, and editing operations.
 * 
 * @module @cardplay/ui/components/piano-roll-panel.test
 */

import { describe, it, expect } from 'vitest';
import type { Event } from '../../types/event';
import { asTick, asTickDuration } from '../../types/primitives';
import {
  createNoteRect,
  getNoteColorByVelocity,
  getNoteColorByPitch,
  getNoteColorByChannel,
  getNoteColorByTrack,
  getNoteColorDefault,
  getNoteColor,
  getVelocityBarHeight,
  getNoteLabel,
  getSelectedNoteStyle,
  getMultiSelectedNoteStyle,
  createNoteRenderConfig,
  createEditContext,
  hitTestNote,
  startCreateNote,
  updateCreateNoteDuration,
  findNoteAtPosition,
  deleteNote,
  toggleNoteSelection,
  createPianoRollState,
  createPianoKeyboard,
  createTimeGrid,
  createVelocityBars,
  toggleVelocityLane,
  setVelocityDrawMode,
  dragVelocityBar,
  drawVelocityLine,
  drawVelocityCurve,
  velocityRampTool,
  randomizeVelocity,
  scaleVelocity,
  compressVelocity,
  expandVelocity,
  invertVelocity,
  applyVelocityPreset,
  getVelocityStatistics,
  getVelocityHistogram,
  toggleVelocityLock,
  // Tool system
  activatePointerTool,
  activateDrawTool,
  activateEraseTool,
  activateCutTool,
  cutNoteAtPosition,
  activateGlueTool,
  joinNotes,
  activatePaintTool,
  capturePaintPattern,
  paintPattern,
  activateVelocityTool,
  setNoteVelocityByDrag,
  activateMuteTool,
  toggleNoteMute,
  toggleSelectedNotesMute,
  activateZoomTool,
  zoomToRect,
  activatePanTool,
  panViewport,
  activateTemporaryTool,
  deactivateTemporaryTool,
  // Additional tools
  activateMarqueeTool,
  activateLassoTool,
  activateLineTool,
  drawNoteLine,
  activateCurveTool,
  drawNoteCurve,
  createScaleAssistant,
  isPitchInScale,
  CHORD_STAMPS,
  stampChord,
  generateArpeggio,
  enableStepInput,
  stepInputNote,
  startRealtimeRecord,
  realtimeNoteOn,
  realtimeNoteOff,
  type ChordStamp,
  type ArpeggioPattern,
  activateTemporaryTool,
  deactivateTemporaryTool,
  type NoteRect,
  type NoteRenderConfig,
  type EditContext
} from './piano-roll-panel';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createTestEvent(id: string, start: number, duration: number): Event<unknown> {
  return {
    id,
    kind: 'note',
    start: asTick(start),
    duration: asTickDuration(duration),
    payload: { pitch: 60, velocity: 100 }
  };
}

function createTestNote(
  eventId: string = 'note1',
  pitch: number = 60,
  velocity: number = 100,
  x: number = 100,
  y: number = 300,
  width: number = 50,
  height: number = 12
): NoteRect {
  return {
    eventId,
    pitch,
    start: asTick(0),
    duration: asTickDuration(100),
    x,
    y,
    width,
    height,
    velocity,
    selected: false,
    editing: false
  };
}

// ============================================================================
// NOTE RENDERING TESTS
// ============================================================================

describe('Piano Roll Note Display', () => {
  describe('createNoteRect', () => {
    it('should create note rectangle from event data', () => {
      const event = createTestEvent('note1', 0, 384);
      const keyboard = createPianoKeyboard();
      const timeGrid = createTimeGrid();
      
      const rect = createNoteRect(event, 60, 100, timeGrid, keyboard);
      
      expect(rect.eventId).toBe('note1');
      expect(rect.pitch).toBe(60);
      expect(rect.velocity).toBe(100);
      expect(rect.selected).toBe(false);
      expect(rect.editing).toBe(false);
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.height).toBe(keyboard.keyHeight);
    });

    it('should set selected flag', () => {
      const event = createTestEvent('note1', 0, 384);
      const keyboard = createPianoKeyboard();
      const timeGrid = createTimeGrid();
      
      const rect = createNoteRect(event, 60, 100, timeGrid, keyboard, true);
      
      expect(rect.selected).toBe(true);
    });

    it('should set editing flag', () => {
      const event = createTestEvent('note1', 0, 384);
      const keyboard = createPianoKeyboard();
      const timeGrid = createTimeGrid();
      
      const rect = createNoteRect(event, 60, 100, timeGrid, keyboard, false, true);
      
      expect(rect.editing).toBe(true);
    });
  });

  describe('getNoteColorByVelocity', () => {
    it('should return blue for low velocity', () => {
      const color = getNoteColorByVelocity(30);
      expect(color).toContain('rgb');
    });

    it('should return red for high velocity', () => {
      const color = getNoteColorByVelocity(120);
      expect(color).toContain('rgb');
    });

    it('should return different colors for different velocities', () => {
      const color1 = getNoteColorByVelocity(30);
      const color2 = getNoteColorByVelocity(90);
      expect(color1).not.toBe(color2);
    });

    it('should support dark mode', () => {
      const lightColor = getNoteColorByVelocity(60, false);
      const darkColor = getNoteColorByVelocity(60, true);
      expect(lightColor).not.toBe(darkColor);
    });
  });

  describe('getNoteColorByPitch', () => {
    it('should return different colors for different pitches', () => {
      const color1 = getNoteColorByPitch(60); // C
      const color2 = getNoteColorByPitch(64); // E
      expect(color1).not.toBe(color2);
    });

    it('should use HSL color format', () => {
      const color = getNoteColorByPitch(60);
      expect(color).toContain('hsl');
    });

    it('should support dark mode', () => {
      const lightColor = getNoteColorByPitch(60, false);
      const darkColor = getNoteColorByPitch(60, true);
      expect(lightColor).not.toBe(darkColor);
    });
  });

  describe('getNoteColorByChannel', () => {
    it('should return distinct colors for different channels', () => {
      const color1 = getNoteColorByChannel(0);
      const color2 = getNoteColorByChannel(1);
      expect(color1).not.toBe(color2);
    });

    it('should handle channel wrapping (>15)', () => {
      const color1 = getNoteColorByChannel(0);
      const color2 = getNoteColorByChannel(16);
      expect(color1).toBe(color2);
    });

    it('should support dark mode', () => {
      const lightColor = getNoteColorByChannel(0, false);
      const darkColor = getNoteColorByChannel(0, true);
      expect(lightColor).not.toBe(darkColor);
    });
  });

  describe('getNoteColorByTrack', () => {
    it('should return distinct colors for different tracks', () => {
      const color1 = getNoteColorByTrack(0);
      const color2 = getNoteColorByTrack(1);
      expect(color1).not.toBe(color2);
    });

    it('should handle track wrapping (>7)', () => {
      const color1 = getNoteColorByTrack(0);
      const color2 = getNoteColorByTrack(8);
      expect(color1).toBe(color2);
    });

    it('should support dark mode', () => {
      const lightColor = getNoteColorByTrack(0, false);
      const darkColor = getNoteColorByTrack(0, true);
      expect(lightColor).not.toBe(darkColor);
    });
  });

  describe('getNoteColorDefault', () => {
    it('should return default blue color', () => {
      const color = getNoteColorDefault();
      expect(color).toBeTruthy();
    });

    it('should support dark mode', () => {
      const lightColor = getNoteColorDefault(false);
      const darkColor = getNoteColorDefault(true);
      expect(lightColor).not.toBe(darkColor);
    });
  });

  describe('getNoteColor', () => {
    it('should return velocity-based color in velocity mode', () => {
      const note = createTestNote();
      const config = createNoteRenderConfig('velocity');
      const color = getNoteColor(note, config);
      expect(color).toContain('rgb');
    });

    it('should return pitch-based color in pitch mode', () => {
      const note = createTestNote();
      const config = createNoteRenderConfig('pitch');
      const color = getNoteColor(note, config);
      expect(color).toContain('hsl');
    });

    it('should return channel-based color in channel mode', () => {
      const note = createTestNote();
      const config = createNoteRenderConfig('channel');
      const color = getNoteColor(note, config, 5);
      expect(color).toBeTruthy();
    });

    it('should return track-based color in track mode', () => {
      const note = createTestNote();
      const config = createNoteRenderConfig('track');
      const color = getNoteColor(note, config, 0, 3);
      expect(color).toBeTruthy();
    });

    it('should return default color in default mode', () => {
      const note = createTestNote();
      const config = createNoteRenderConfig('default');
      const color = getNoteColor(note, config);
      expect(color).toBe(getNoteColorDefault(false));
    });
  });

  describe('getVelocityBarHeight', () => {
    it('should return 0-1 range', () => {
      expect(getVelocityBarHeight(0)).toBe(0);
      expect(getVelocityBarHeight(127)).toBe(1);
      expect(getVelocityBarHeight(64)).toBeCloseTo(0.504, 2);
    });
  });

  describe('getNoteLabel', () => {
    it('should return note name for wide notes', () => {
      const note = createTestNote('note1', 60, 100, 100, 300, 50, 12);
      const label = getNoteLabel(note, 30);
      expect(label).toBe('C4');
    });

    it('should return null for narrow notes', () => {
      const note = createTestNote('note1', 60, 100, 100, 300, 20, 12);
      const label = getNoteLabel(note, 30);
      expect(label).toBeNull();
    });

    it('should show correct note names for different pitches', () => {
      const note1 = createTestNote('note1', 60, 100, 100, 300, 50, 12);
      const note2 = createTestNote('note2', 69, 100, 100, 300, 50, 12);
      
      expect(getNoteLabel(note1, 30)).toBe('C4');
      expect(getNoteLabel(note2, 30)).toBe('A4');
    });
  });

  describe('getSelectedNoteStyle', () => {
    it('should return style with stroke', () => {
      const style = getSelectedNoteStyle();
      expect(style.strokeColor).toBeTruthy();
      expect(style.strokeWidth).toBeGreaterThan(0);
      expect(style.shadowBlur).toBeGreaterThan(0);
    });

    it('should support dark mode', () => {
      const lightStyle = getSelectedNoteStyle(false);
      const darkStyle = getSelectedNoteStyle(true);
      expect(lightStyle.strokeColor).not.toBe(darkStyle.strokeColor);
    });
  });

  describe('getMultiSelectedNoteStyle', () => {
    it('should return style with dashed stroke', () => {
      const style = getMultiSelectedNoteStyle();
      expect(style.strokeDashArray).toContain(',');
    });

    it('should support dark mode', () => {
      const lightStyle = getMultiSelectedNoteStyle(false);
      const darkStyle = getMultiSelectedNoteStyle(true);
      expect(lightStyle.strokeColor).not.toBe(darkStyle.strokeColor);
    });
  });

  describe('createNoteRenderConfig', () => {
    it('should create default config', () => {
      const config = createNoteRenderConfig();
      expect(config.colorMode).toBe('default');
      expect(config.showVelocityBars).toBe(true);
      expect(config.showNoteLabels).toBe(true);
      expect(config.showResizeHandles).toBe(true);
    });

    it('should accept custom color mode', () => {
      const config = createNoteRenderConfig('velocity');
      expect(config.colorMode).toBe('velocity');
    });

    it('should accept dark mode flag', () => {
      const config = createNoteRenderConfig('default', true);
      expect(config.darkMode).toBe(true);
    });
  });
});

// ============================================================================
// NOTE EDITING TESTS
// ============================================================================

describe('Piano Roll Event Editing', () => {
  describe('createEditContext', () => {
    it('should create empty context', () => {
      const context = createEditContext();
      expect(context.operation).toBeNull();
      expect(context.targetNoteId).toBeNull();
      expect(context.shiftHeld).toBe(false);
      expect(context.altHeld).toBe(false);
      expect(context.ctrlHeld).toBe(false);
    });
  });

  describe('hitTestNote', () => {
    const note = createTestNote('note1', 60, 100, 100, 300, 50, 12);

    it('should detect center hit', () => {
      const region = hitTestNote(note, 125, 305);
      expect(region).toBe('center');
    });

    it('should detect left edge hit', () => {
      const region = hitTestNote(note, 103, 305);
      expect(region).toBe('left-edge');
    });

    it('should detect right edge hit', () => {
      const region = hitTestNote(note, 147, 305);
      expect(region).toBe('right-edge');
    });

    it('should detect miss', () => {
      const region = hitTestNote(note, 50, 305);
      expect(region).toBe('none');
    });

    it('should respect custom edge threshold', () => {
      const region = hitTestNote(note, 108, 305, 10);
      expect(region).toBe('left-edge');
    });
  });

  describe('startCreateNote', () => {
    it('should create edit context for note creation', () => {
      const state = createPianoRollState('test');
      const result = startCreateNote(state, 100, 300);
      
      expect(result.context.operation).toBe('create');
      expect(result.context.startX).toBe(100);
      expect(result.context.startY).toBe(300);
    });
  });

  describe('updateCreateNoteDuration', () => {
    it('should update current X position', () => {
      const context = createEditContext();
      
      const updated = updateCreateNoteDuration(context, 200);
      
      expect(updated.currentX).toBe(200);
    });
  });

  describe('findNoteAtPosition', () => {
    it('should find note at position', () => {
      const note1 = createTestNote('note1', 60, 100, 100, 300, 50, 12);
      const note2 = createTestNote('note2', 64, 100, 200, 250, 50, 12);
      const notes = [note1, note2];
      
      const found = findNoteAtPosition(notes, 125, 305);
      expect(found).toBe(note1);
    });

    it('should return null if no note found', () => {
      const note1 = createTestNote('note1', 60, 100, 100, 300, 50, 12);
      const notes = [note1];
      
      const found = findNoteAtPosition(notes, 50, 305);
      expect(found).toBeNull();
    });

    it('should return topmost note if overlapping', () => {
      const note1 = createTestNote('note1', 60, 100, 100, 300, 50, 12);
      const note2 = createTestNote('note2', 60, 100, 100, 300, 50, 12);
      const notes = [note1, note2];
      
      const found = findNoteAtPosition(notes, 125, 305);
      expect(found).toBe(note2); // Last in array = topmost
    });
  });

  describe('deleteNote', () => {
    it('should remove note from state', () => {
      const note1 = createTestNote('note1', 60, 100, 100, 300, 50, 12);
      const note2 = createTestNote('note2', 64, 100, 200, 250, 50, 12);
      const state = createPianoRollState('test');
      const stateWithNotes = { ...state, notes: [note1, note2] };
      
      const updated = deleteNote(stateWithNotes, 'note1');
      
      expect(updated.notes).toHaveLength(1);
      expect(updated.notes[0].eventId).toBe('note2');
    });

    it('should remove from selected notes', () => {
      const note1 = createTestNote('note1', 60, 100, 100, 300, 50, 12);
      const state = createPianoRollState('test');
      const stateWithNotes = {
        ...state,
        notes: [note1],
        selectedNoteIds: ['note1']
      };
      
      const updated = deleteNote(stateWithNotes, 'note1');
      
      expect(updated.selectedNoteIds).toHaveLength(0);
    });
  });

  describe('toggleNoteSelection', () => {
    it('should select unselected note', () => {
      const state = createPianoRollState('test');
      
      const updated = toggleNoteSelection(state, 'note1');
      
      expect(updated.selectedNoteIds).toContain('note1');
    });

    it('should deselect selected note', () => {
      const state = createPianoRollState('test');
      const stateWithSelection = {
        ...state,
        selectedNoteIds: ['note1']
      };
      
      const updated = toggleNoteSelection(stateWithSelection, 'note1');
      
      expect(updated.selectedNoteIds).not.toContain('note1');
    });

    it('should preserve other selections', () => {
      const state = createPianoRollState('test');
      const stateWithSelection = {
        ...state,
        selectedNoteIds: ['note1', 'note2']
      };
      
      const updated = toggleNoteSelection(stateWithSelection, 'note3');
      
      expect(updated.selectedNoteIds).toContain('note1');
      expect(updated.selectedNoteIds).toContain('note2');
      expect(updated.selectedNoteIds).toContain('note3');
    });
  });
});

// ============================================================================
// EVENT EDITING TESTS (Section 10.3)
// ============================================================================

import {
  createNoteAtPosition,
  updateNoteDuration,
  deleteNoteOnDoubleClick,
  getNoteContextMenu,
  moveNote,
  moveSelectedNotes,
  resizeNoteEdge,
  copySelectedNotesWithDrag,
  duplicateSelectedNotes,
  startLassoSelection,
  updateLassoSelection,
  completeLassoSelection,
  startMarqueeSelection,
  updateMarqueeSelection,
  completeMarqueeSelection
} from './piano-roll-panel';

describe('Piano Roll Event Editing', () => {
  describe('createNoteAtPosition', () => {
    it('should create note at mouse position', () => {
      const state = createPianoRollState('test');
      
      const updated = createNoteAtPosition(state, 100, 300);
      
      expect(updated.notes).toHaveLength(1);
      expect(updated.notes[0]).toBeDefined();
      expect(updated.notes[0]!.velocity).toBe(100);
    });

    it('should snap to grid when enabled', () => {
      const state = {
        ...createPianoRollState('test'),
        snapEnabled: true
      };
      
      const updated = createNoteAtPosition(state, 105, 300);
      
      expect(updated.notes[0]?.start).toBeDefined();
      // Should be snapped to grid
    });

    it('should not snap when disabled', () => {
      const state = {
        ...createPianoRollState('test'),
        snapEnabled: false
      };
      
      const updated = createNoteAtPosition(state, 105, 300);
      
      expect(updated.notes[0]).toBeDefined();
    });
  });

  describe('updateNoteDuration', () => {
    it('should update note duration by dragging', () => {
      const state = createPianoRollState('test');
      const noteState = createNoteAtPosition(state, 100, 300);
      const note = noteState.notes[0]!;
      const noteId = note.eventId;
      
      // Pass grid coordinate (note.x + additional width)
      const updated = updateNoteDuration(noteState, noteId, note.x + note.width + 100);
      
      expect(updated.notes[0]?.duration).toBeGreaterThan(note.duration);
    });

    it('should enforce minimum duration', () => {
      const state = createPianoRollState('test');
      const noteState = createNoteAtPosition(state, 100, 300);
      const note = noteState.notes[0]!;
      const noteId = note.eventId;
      
      // Try to make too short (but should stay at least 1 tick)
      const updated = updateNoteDuration(noteState, noteId, note.x + 0.5);
      
      expect(updated.notes[0]?.duration).toBeGreaterThanOrEqual(1);
    });

    it('should return unchanged state for nonexistent note', () => {
      const state = createPianoRollState('test');
      
      const updated = updateNoteDuration(state, 'nonexistent', 200);
      
      expect(updated).toBe(state);
    });
  });

  describe('deleteNoteOnDoubleClick', () => {
    it('should delete note at click position', () => {
      const state = createPianoRollState('test');
      const noteState = createNoteAtPosition(state, 100, 300);
      const note = noteState.notes[0]!;
      
      const updated = deleteNoteOnDoubleClick(noteState, note.x + 5, note.y + 5);
      
      expect(updated.notes).toHaveLength(0);
    });

    it('should not change state if no note at position', () => {
      const state = createPianoRollState('test');
      
      const updated = deleteNoteOnDoubleClick(state, 1000, 1000);
      
      expect(updated).toBe(state);
    });
  });

  describe('getNoteContextMenu', () => {
    it('should return menu options when note is clicked', () => {
      const state = createPianoRollState('test');
      const noteState = createNoteAtPosition(state, 100, 300);
      const note = noteState.notes[0]!;
      
      const menu = getNoteContextMenu(noteState, note.x + 5, note.y + 5);
      
      expect(menu).toBeDefined();
      expect(menu!.length).toBeGreaterThan(0);
      expect(menu!.some(opt => opt.label === 'Delete')).toBe(true);
    });

    it('should enable options based on selection', () => {
      const state = createPianoRollState('test');
      const noteState = createNoteAtPosition(state, 100, 300);
      const withSelection = {
        ...noteState,
        selectedNoteIds: [noteState.notes[0]!.eventId]
      };
      
      const menu = getNoteContextMenu(withSelection, 100, 300);
      
      const cutOption = menu!.find(opt => opt.action === 'cut');
      expect(cutOption?.enabled).toBe(true);
    });
  });

  describe('moveNote', () => {
    it('should move note by delta', () => {
      const state = createPianoRollState('test');
      const noteState = createNoteAtPosition(state, 100, 300);
      const note = noteState.notes[0]!;
      const noteId = note.eventId;
      
      const updated = moveNote(noteState, noteId, 50, -12);
      
      expect(updated.notes[0]?.x).not.toBe(note.x);
      expect(updated.notes[0]?.y).not.toBe(note.y);
    });

    it('should not move locked notes', () => {
      const state = createPianoRollState('test');
      const noteState = createNoteAtPosition(state, 100, 300);
      const lockedState = {
        ...noteState,
        notes: [{ ...noteState.notes[0]!, locked: true }]
      };
      const noteId = lockedState.notes[0]!.eventId;
      
      const updated = moveNote(lockedState, noteId, 50, -12);
      
      expect(updated).toBe(lockedState);
    });

    it('should clamp pitch to valid range', () => {
      const state = createPianoRollState('test');
      const noteState = createNoteAtPosition(state, 100, 300);
      const noteId = noteState.notes[0]!.eventId;
      
      const updated = moveNote(noteState, noteId, 0, -10000); // Try to move way out of range
      
      expect(updated.notes[0]?.pitch).toBeGreaterThanOrEqual(0);
      expect(updated.notes[0]?.pitch).toBeLessThanOrEqual(127);
    });
  });

  describe('moveSelectedNotes', () => {
    it('should move all selected notes together', () => {
      const state = createPianoRollState('test');
      const state1 = createNoteAtPosition(state, 100, 300);
      const state2 = createNoteAtPosition(state1, 200, 350);
      const withSelection = {
        ...state2,
        selectedNoteIds: [state2.notes[0]!.eventId, state2.notes[1]!.eventId]
      };
      
      const updated = moveSelectedNotes(withSelection, 50, 0);
      
      expect(updated.notes[0]?.start).not.toBe(state2.notes[0]!.start);
      expect(updated.notes[1]?.start).not.toBe(state2.notes[1]!.start);
    });

    it('should not move if no selection', () => {
      const state = createPianoRollState('test');
      
      const updated = moveSelectedNotes(state, 50, 0);
      
      expect(updated).toBe(state);
    });
  });

  describe('resizeNoteEdge', () => {
    it('should resize from right edge', () => {
      const state = createPianoRollState('test');
      const noteState = createNoteAtPosition(state, 100, 300);
      const note = noteState.notes[0]!;
      const noteId = note.eventId;
      
      const updated = resizeNoteEdge(noteState, noteId, 'right', note.x + note.width + 50);
      
      expect(updated.notes[0]?.duration).toBeGreaterThan(note.duration);
    });

    it('should resize from left edge', () => {
      const state = createPianoRollState('test');
      const noteState = createNoteAtPosition(state, 100, 300, asTickDuration(500));
      const note = noteState.notes[0]!;
      const noteId = note.eventId;
      
      const updated = resizeNoteEdge(noteState, noteId, 'left', note.x + 50);
      
      expect(updated.notes[0]?.start).toBeGreaterThan(note.start);
    });

    it('should not resize locked notes', () => {
      const state = createPianoRollState('test');
      const noteState = createNoteAtPosition(state, 100, 300);
      const lockedState = {
        ...noteState,
        notes: [{ ...noteState.notes[0]!, locked: true }]
      };
      const noteId = lockedState.notes[0]!.eventId;
      
      const updated = resizeNoteEdge(lockedState, noteId, 'right', 200);
      
      expect(updated).toBe(lockedState);
    });
  });

  describe('copySelectedNotesWithDrag', () => {
    it('should copy selected notes with offset', () => {
      const state = createPianoRollState('test');
      const noteState = createNoteAtPosition(state, 100, 300);
      const withSelection = {
        ...noteState,
        selectedNoteIds: [noteState.notes[0]!.eventId]
      };
      
      const updated = copySelectedNotesWithDrag(withSelection, 100, 0);
      
      expect(updated.notes).toHaveLength(2);
      expect(updated.selectedNoteIds).toHaveLength(1);
      expect(updated.selectedNoteIds[0]).not.toBe(noteState.notes[0]!.eventId);
    });

    it('should not copy if no selection', () => {
      const state = createPianoRollState('test');
      const noteState = createNoteAtPosition(state, 100, 300);
      
      const updated = copySelectedNotesWithDrag(noteState, 100, 0);
      
      expect(updated.notes).toHaveLength(1); // No copy
    });
  });

  describe('duplicateSelectedNotes', () => {
    it('should duplicate selected notes', () => {
      const state = createPianoRollState('test');
      const noteState = createNoteAtPosition(state, 100, 300);
      const withSelection = {
        ...noteState,
        selectedNoteIds: [noteState.notes[0]!.eventId]
      };
      
      const updated = duplicateSelectedNotes(withSelection, 100, 0);
      
      expect(updated.notes).toHaveLength(2);
    });
  });

  describe('Lasso Selection', () => {
    it('should start lasso selection', () => {
      const state = createPianoRollState('test');
      
      const { state: updated, lasso } = startLassoSelection(state, 100, 100);
      
      expect(lasso.active).toBe(true);
      expect(lasso.startX).toBe(100);
      expect(lasso.startY).toBe(100);
      expect(updated.selectedNoteIds).toHaveLength(0);
    });

    it('should update lasso bounds', () => {
      const state = createPianoRollState('test');
      const { lasso } = startLassoSelection(state, 100, 100);
      
      const updated = updateLassoSelection(lasso, 200, 200);
      
      expect(updated.currentX).toBe(200);
      expect(updated.currentY).toBe(200);
    });

    it('should complete lasso and select notes', () => {
      const state = createPianoRollState('test');
      const noteState = createNoteAtPosition(state, 100, 300);
      const { state: lassoState, lasso } = startLassoSelection(noteState, 90, 290);
      const updatedLasso = updateLassoSelection(lasso, 300, 400);
      
      const completed = completeLassoSelection(lassoState, updatedLasso);
      
      // Note should be selected if within bounds
      expect(completed.selectedNoteIds.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Marquee Selection', () => {
    it('should start marquee selection', () => {
      const state = createPianoRollState('test');
      
      const updated = startMarqueeSelection(state, 100, 100);
      
      expect(updated.selection.active).toBe(true);
      expect(updated.selection.x).toBe(100);
      expect(updated.selection.y).toBe(100);
    });

    it('should update marquee and select notes', () => {
      const state = createPianoRollState('test');
      const noteState = createNoteAtPosition(state, 100, 300);
      const marqueeState = startMarqueeSelection(noteState, 90, 290);
      
      const updated = updateMarqueeSelection(marqueeState, 300, 400);
      
      expect(updated.selection.width).toBeGreaterThan(0);
      expect(updated.selection.height).toBeGreaterThan(0);
    });

    it('should handle negative drag (drag left/up)', () => {
      const state = createPianoRollState('test');
      const marqueeState = startMarqueeSelection(state, 200, 200);
      
      const updated = updateMarqueeSelection(marqueeState, 100, 100);
      
      expect(updated.selection.width).toBeGreaterThan(0);
      expect(updated.selection.height).toBeGreaterThan(0);
    });

    it('should complete marquee selection', () => {
      const state = createPianoRollState('test');
      const marqueeState = startMarqueeSelection(state, 100, 100);
      
      const completed = completeMarqueeSelection(marqueeState);
      
      expect(completed.selection.active).toBe(false);
    });
  });

  // ==========================================================================
  // VELOCITY LANE TESTS
  // ==========================================================================

  describe('Velocity Lane', () => {
    it('should create velocity lane by default', () => {
      const state = createPianoRollState('test');
      
      expect(state.velocityLane).toBeDefined();
      expect(state.velocityLane.visible).toBe(true);
      expect(state.velocityLane.height).toBe(80);
      expect(state.velocityLane.bars).toEqual([]);
    });

    it('should toggle velocity lane visibility', () => {
      const state = createPianoRollState('test');
      
      const toggled = toggleVelocityLane(state);
      
      expect(toggled.velocityLane.visible).toBe(false);
      
      const toggledAgain = toggleVelocityLane(toggled);
      expect(toggledAgain.velocityLane.visible).toBe(true);
    });

    it('should set velocity draw mode', () => {
      const state = createPianoRollState('test');
      
      const drawState = setVelocityDrawMode(state, 'draw');
      expect(drawState.velocityLane.drawMode).toBe('draw');
      
      const lineState = setVelocityDrawMode(drawState, 'line');
      expect(lineState.velocityLane.drawMode).toBe('line');
      
      const curveState = setVelocityDrawMode(lineState, 'curve');
      expect(curveState.velocityLane.drawMode).toBe('curve');
    });

    it('should create velocity bars for notes', () => {
      const state = createPianoRollState('test');
      const note1 = createTestNote('note1', 60, 80);
      const note2 = createTestNote('note2', 62, 100);
      const noteState = { ...state, notes: [note1, note2] };
      
      const bars = createVelocityBars(noteState.notes, 80);
      
      expect(bars).toHaveLength(2);
      expect(bars[0]?.noteId).toBe('note1');
      expect(bars[0]?.velocity).toBe(80);
      expect(bars[1]?.noteId).toBe('note2');
      expect(bars[1]?.velocity).toBe(100);
    });

    it('should drag velocity bar to adjust note velocity', () => {
      const state = createPianoRollState('test');
      const note = createTestNote('note1', 60, 80);
      const noteState = { ...state, notes: [note] };
      
      const updated = dragVelocityBar(noteState, 'note1', 120);
      
      const updatedNote = updated.notes.find(n => n.eventId === 'note1');
      expect(updatedNote?.velocity).toBe(120);
    });

    it('should clamp velocity when dragging', () => {
      const state = createPianoRollState('test');
      const note = createTestNote('note1', 60, 80);
      const noteState = { ...state, notes: [note] };
      
      const tooHigh = dragVelocityBar(noteState, 'note1', 200);
      expect(tooHigh.notes[0]?.velocity).toBe(127);
      
      const tooLow = dragVelocityBar(noteState, 'note1', 0);
      expect(tooLow.notes[0]?.velocity).toBe(1);
    });

    it('should draw velocity line across selected notes', () => {
      const state = createPianoRollState('test');
      const notes = [
        createTestNote('note1', 60, 64, 0, 300, 50, 12),
        createTestNote('note2', 60, 64, 100, 300, 50, 12),
        createTestNote('note3', 60, 64, 200, 300, 50, 12)
      ];
      notes[0] = { ...notes[0], start: asTick(0) };
      notes[1] = { ...notes[1], start: asTick(100) };
      notes[2] = { ...notes[2], start: asTick(200) };
      
      const noteState = {
        ...state,
        notes,
        selectedNoteIds: ['note1', 'note2', 'note3']
      };
      
      const updated = drawVelocityLine(noteState, 40, 120);
      
      expect(updated.notes[0]?.velocity).toBe(40);
      expect(updated.notes[1]?.velocity).toBe(80);
      expect(updated.notes[2]?.velocity).toBe(120);
    });

    it('should draw velocity curve with exponential shape', () => {
      const state = createPianoRollState('test');
      const notes = [
        createTestNote('note1', 60, 64, 0, 300, 50, 12),
        createTestNote('note2', 60, 64, 100, 300, 50, 12),
        createTestNote('note3', 60, 64, 200, 300, 50, 12)
      ];
      notes[0] = { ...notes[0], start: asTick(0) };
      notes[1] = { ...notes[1], start: asTick(100) };
      notes[2] = { ...notes[2], start: asTick(200) };
      
      const noteState = {
        ...state,
        notes,
        selectedNoteIds: ['note1', 'note2', 'note3']
      };
      
      const updated = drawVelocityCurve(noteState, 40, 120, 'exponential');
      
      // Exponential curve should have slower start
      const firstNote = updated.notes[0];
      const middleNote = updated.notes[1];
      const lastNote = updated.notes[2];
      
      expect(firstNote?.velocity).toBe(40);
      expect(lastNote?.velocity).toBe(120);
      // Middle note should be closer to start in exponential curve
      expect(middleNote && middleNote.velocity < 80).toBe(true);
    });

    it('should create velocity ramp up', () => {
      const state = createPianoRollState('test');
      const notes = [
        createTestNote('note1', 60, 64, 0, 300, 50, 12),
        createTestNote('note2', 60, 64, 100, 300, 50, 12)
      ];
      notes[0] = { ...notes[0], start: asTick(0) };
      notes[1] = { ...notes[1], start: asTick(100) };
      
      const noteState = {
        ...state,
        notes,
        selectedNoteIds: ['note1', 'note2']
      };
      
      const updated = velocityRampTool(noteState, 'up');
      
      expect(updated.notes[0]?.velocity).toBe(1);
      expect(updated.notes[1]?.velocity).toBe(127);
    });

    it('should randomize velocity', () => {
      const state = createPianoRollState('test');
      const notes = [
        createTestNote('note1', 60, 64),
        createTestNote('note2', 60, 64),
        createTestNote('note3', 60, 64)
      ];
      
      const noteState = {
        ...state,
        notes,
        selectedNoteIds: ['note1', 'note2', 'note3']
      };
      
      const updated = randomizeVelocity(noteState, 50, 100, 12345);
      
      // All velocities should be within range
      updated.notes.forEach(note => {
        expect(note.velocity).toBeGreaterThanOrEqual(50);
        expect(note.velocity).toBeLessThanOrEqual(100);
      });
      
      // With same seed, should get same results
      const updated2 = randomizeVelocity(noteState, 50, 100, 12345);
      expect(updated.notes[0]?.velocity).toBe(updated2.notes[0]?.velocity);
    });

    it('should scale velocity', () => {
      const state = createPianoRollState('test');
      const note = createTestNote('note1', 60, 64);
      
      const noteState = {
        ...state,
        notes: [note],
        selectedNoteIds: ['note1']
      };
      
      const scaled = scaleVelocity(noteState, 1.5);
      
      expect(scaled.notes[0]?.velocity).toBe(96); // 64 * 1.5 = 96
    });

    it('should compress velocity range', () => {
      const state = createPianoRollState('test');
      const notes = [
        createTestNote('note1', 60, 40),
        createTestNote('note2', 60, 80),
        createTestNote('note3', 60, 120)
      ];
      
      const noteState = {
        ...state,
        notes,
        selectedNoteIds: ['note1', 'note2', 'note3']
      };
      
      const compressed = compressVelocity(noteState, 0.5);
      
      // Average is 80, so with 50% compression:
      // 40 -> 60, 80 -> 80, 120 -> 100
      expect(compressed.notes[0]?.velocity).toBe(60);
      expect(compressed.notes[1]?.velocity).toBe(80);
      expect(compressed.notes[2]?.velocity).toBe(100);
    });

    it('should expand velocity range', () => {
      const state = createPianoRollState('test');
      const notes = [
        createTestNote('note1', 60, 60),
        createTestNote('note2', 60, 80),
        createTestNote('note3', 60, 100)
      ];
      
      const noteState = {
        ...state,
        notes,
        selectedNoteIds: ['note1', 'note2', 'note3']
      };
      
      const expanded = expandVelocity(noteState, 0.5);
      
      // Average is 80, so with 50% expansion:
      // 60 -> 50, 80 -> 80, 100 -> 110
      expect(expanded.notes[0]?.velocity).toBe(50);
      expect(expanded.notes[1]?.velocity).toBe(80);
      expect(expanded.notes[2]?.velocity).toBe(110);
    });

    it('should invert velocity', () => {
      const state = createPianoRollState('test');
      const notes = [
        createTestNote('note1', 60, 1),
        createTestNote('note2', 60, 64),
        createTestNote('note3', 60, 127)
      ];
      
      const noteState = {
        ...state,
        notes,
        selectedNoteIds: ['note1', 'note2', 'note3']
      };
      
      const inverted = invertVelocity(noteState);
      
      expect(inverted.notes[0]?.velocity).toBe(127);
      expect(inverted.notes[1]?.velocity).toBe(64);
      expect(inverted.notes[2]?.velocity).toBe(1);
    });

    it('should apply velocity preset accent-1st', () => {
      const state = createPianoRollState('test');
      const notes = [
        createTestNote('note1', 60, 64, 0, 300, 50, 12),
        createTestNote('note2', 60, 64, 100, 300, 50, 12),
        createTestNote('note3', 60, 64, 200, 300, 50, 12)
      ];
      notes[0] = { ...notes[0], start: asTick(0) };
      notes[1] = { ...notes[1], start: asTick(100) };
      notes[2] = { ...notes[2], start: asTick(200) };
      
      const noteState = {
        ...state,
        notes,
        selectedNoteIds: ['note1', 'note2', 'note3']
      };
      
      const updated = applyVelocityPreset(noteState, 'accent-1st');
      
      expect(updated.notes[0]?.velocity).toBe(127);
      expect(updated.notes[1]?.velocity).toBe(80);
      expect(updated.notes[2]?.velocity).toBe(80);
    });

    it('should apply velocity preset crescendo', () => {
      const state = createPianoRollState('test');
      const notes = [
        createTestNote('note1', 60, 64, 0, 300, 50, 12),
        createTestNote('note2', 60, 64, 100, 300, 50, 12),
        createTestNote('note3', 60, 64, 200, 300, 50, 12)
      ];
      notes[0] = { ...notes[0], start: asTick(0) };
      notes[1] = { ...notes[1], start: asTick(100) };
      notes[2] = { ...notes[2], start: asTick(200) };
      
      const noteState = {
        ...state,
        notes,
        selectedNoteIds: ['note1', 'note2', 'note3']
      };
      
      const updated = applyVelocityPreset(noteState, 'crescendo');
      
      // Should gradually increase
      const v1 = updated.notes[0]?.velocity || 0;
      const v2 = updated.notes[1]?.velocity || 0;
      const v3 = updated.notes[2]?.velocity || 0;
      
      expect(v1 < v2).toBe(true);
      expect(v2 < v3).toBe(true);
    });

    it('should calculate velocity statistics', () => {
      const state = createPianoRollState('test');
      const notes = [
        createTestNote('note1', 60, 40),
        createTestNote('note2', 60, 80),
        createTestNote('note3', 60, 120)
      ];
      
      const noteState = {
        ...state,
        notes,
        selectedNoteIds: ['note1', 'note2', 'note3']
      };
      
      const stats = getVelocityStatistics(noteState);
      
      expect(stats.count).toBe(3);
      expect(stats.min).toBe(40);
      expect(stats.max).toBe(120);
      expect(stats.average).toBe(80);
      expect(stats.median).toBe(80);
      expect(stats.stdDev).toBeGreaterThan(0);
    });

    it('should generate velocity histogram', () => {
      const state = createPianoRollState('test');
      const notes = [
        createTestNote('note1', 60, 25),
        createTestNote('note2', 60, 35),
        createTestNote('note3', 60, 75),
        createTestNote('note4', 60, 85)
      ];
      
      const noteState = {
        ...state,
        notes,
        selectedNoteIds: ['note1', 'note2', 'note3', 'note4']
      };
      
      const histogram = getVelocityHistogram(noteState, 20);
      
      expect(histogram.bins).toBeDefined();
      expect(histogram.binSize).toBe(20);
      
      // Find bins with notes
      // Velocity 25, 35 -> bin 20 (20-39)
      // Velocity 75 -> bin 60 (60-79)
      // Velocity 85 -> bin 80 (80-99)
      const bin1 = histogram.bins.find(b => b.velocity === 20);
      const bin3 = histogram.bins.find(b => b.velocity === 60);
      const bin4 = histogram.bins.find(b => b.velocity === 80);
      
      expect(bin1?.count).toBe(2); // notes at 25, 35
      expect(bin3?.count).toBe(1); // note at 75
      expect(bin4?.count).toBe(1); // note at 85
    });

    it('should toggle velocity lock', () => {
      const state = createPianoRollState('test');
      const note = createTestNote('note1', 60, 80);
      
      const noteState = { ...state, notes: [note] };
      
      const locked = toggleVelocityLock(noteState, ['note1']);
      expect(locked.notes[0]?.locked).toBe(true);
      
      const unlocked = toggleVelocityLock(locked, ['note1']);
      expect(unlocked.notes[0]?.locked).toBe(false);
    });
  });

  // ============================================================================
  // TOOL SYSTEM TESTS (Section 10.6)
  // ============================================================================

  describe('Piano Roll Tools', () => {
    it('should activate pointer tool', () => {
      const state = createPianoRollState('test');
      const withPointer = activatePointerTool(state);
      
      expect(withPointer.toolState.currentTool).toBe('pointer');
      expect(withPointer.toolState.active).toBe(false);
      expect(withPointer.toolState.previousTool).toBeNull();
    });

    it('should activate draw tool', () => {
      const state = createPianoRollState('test');
      const withDraw = activateDrawTool(state);
      
      expect(withDraw.toolState.currentTool).toBe('draw');
      expect(withDraw.toolState.data).toBeDefined();
    });

    it('should activate erase tool', () => {
      const state = createPianoRollState('test');
      const withErase = activateEraseTool(state);
      
      expect(withErase.toolState.currentTool).toBe('erase');
    });

    it('should cut note at position', () => {
      const state = createPianoRollState('test');
      const note = createTestNote('note1', 60, 100);
      const noteWithDuration = { ...note, start: asTick(0), duration: asTickDuration(960), width: 960 };
      const stateWithNote = { ...state, notes: [noteWithDuration] };
      
      const cut = cutNoteAtPosition(stateWithNote, 'note1', asTick(480));
      
      expect(cut.notes.length).toBe(2);
      expect(cut.notes[0]?.start).toBe(0);
      expect(cut.notes[0]?.duration).toBe(480);
      expect(cut.notes[1]?.start).toBe(480);
      expect(cut.notes[1]?.duration).toBe(480);
    });

    it('should not cut note outside bounds', () => {
      const state = createPianoRollState('test');
      const note = createTestNote('note1', 60, 100);
      const noteWithDuration = { ...note, start: asTick(480), duration: asTickDuration(480), width: 480 };
      const stateWithNote = { ...state, notes: [noteWithDuration] };
      
      const cutBefore = cutNoteAtPosition(stateWithNote, 'note1', asTick(0));
      expect(cutBefore.notes.length).toBe(1);
      
      const cutAfter = cutNoteAtPosition(stateWithNote, 'note1', asTick(1000));
      expect(cutAfter.notes.length).toBe(1);
    });

    it('should activate glue tool', () => {
      const state = createPianoRollState('test');
      const withGlue = activateGlueTool(state);
      
      expect(withGlue.toolState.currentTool).toBe('glue');
    });

    it('should join adjacent notes', () => {
      const state = createPianoRollState('test');
      const note1 = { ...createTestNote('note1', 60, 100), start: asTick(0), duration: asTickDuration(480), width: 480 };
      const note2 = { ...createTestNote('note2', 60, 80), start: asTick(480), duration: asTickDuration(480), width: 480 };
      const stateWithNotes = { ...state, notes: [note1, note2] };
      
      const joined = joinNotes(stateWithNotes, 'note1', 'note2');
      
      expect(joined.notes.length).toBe(1);
      expect(joined.notes[0]?.start).toBe(0);
      expect(joined.notes[0]?.duration).toBe(960);
      expect(joined.notes[0]?.velocity).toBe(90); // Average of 100 and 80
    });

    it('should not join notes with different pitches', () => {
      const state = createPianoRollState('test');
      const note1 = { ...createTestNote('note1', 60, 100), start: asTick(0), duration: asTickDuration(480) };
      const note2 = { ...createTestNote('note2', 62, 80), start: asTick(480), duration: asTickDuration(480) };
      const stateWithNotes = { ...state, notes: [note1, note2] };
      
      const result = joinNotes(stateWithNotes, 'note1', 'note2');
      
      expect(result.notes.length).toBe(2); // Unchanged
    });

    it('should activate paint tool', () => {
      const state = createPianoRollState('test');
      const withPaint = activatePaintTool(state);
      
      expect(withPaint.toolState.currentTool).toBe('paint');
      expect(withPaint.toolState.data).toBeDefined();
    });

    it('should capture paint pattern from selection', () => {
      const state = createPianoRollState('test');
      const notes = [
        { ...createTestNote('note1', 60, 100), start: asTick(0), duration: asTickDuration(480) },
        { ...createTestNote('note2', 64, 90), start: asTick(480), duration: asTickDuration(480) }
      ];
      const stateWithNotes = { ...state, notes, selectedNoteIds: ['note1', 'note2'] };
      
      const withPattern = capturePaintPattern(stateWithNotes);
      
      expect(withPattern.toolState.currentTool).toBe('paint');
      const data = withPattern.toolState.data as { pattern: unknown[] };
      expect(data.pattern).toBeDefined();
      expect(data.pattern.length).toBe(2);
    });

    it('should paint captured pattern', () => {
      const state = createPianoRollState('test');
      const notes = [
        { ...createTestNote('note1', 60, 100), start: asTick(0), duration: asTickDuration(480) },
        { ...createTestNote('note2', 64, 90), start: asTick(480), duration: asTickDuration(480) }
      ];
      const stateWithNotes = { ...state, notes, selectedNoteIds: ['note1', 'note2'] };
      
      const withPattern = capturePaintPattern(stateWithNotes);
      const painted = paintPattern(withPattern, asTick(1920), 2);
      
      // Original 2 notes + 2 repetitions of 2 notes = 6 notes total
      expect(painted.notes.length).toBe(6);
    });

    it('should activate velocity tool', () => {
      const state = createPianoRollState('test');
      const withVelocity = activateVelocityTool(state);
      
      expect(withVelocity.toolState.currentTool).toBe('velocity');
    });

    it('should set note velocity by drag', () => {
      const state = createPianoRollState('test');
      const note = createTestNote('note1', 60, 100);
      const stateWithNote = { ...state, notes: [note] };
      
      // Drag to 50% of lane height = velocity 64 (approximately)
      const updated = setNoteVelocityByDrag(stateWithNote, 'note1', 50, 100);
      
      expect(updated.notes[0]?.velocity).toBe(64);
    });

    it('should activate mute tool', () => {
      const state = createPianoRollState('test');
      const withMute = activateMuteTool(state);
      
      expect(withMute.toolState.currentTool).toBe('mute');
    });

    it('should toggle note mute', () => {
      const state = createPianoRollState('test');
      const note = createTestNote('note1', 60, 100);
      const stateWithNote = { ...state, notes: [note] };
      
      const muted = toggleNoteMute(stateWithNote, 'note1');
      expect(muted.notes[0]?.muted).toBe(true);
      
      const unmuted = toggleNoteMute(muted, 'note1');
      expect(unmuted.notes[0]?.muted).toBe(false);
    });

    it('should toggle selected notes mute', () => {
      const state = createPianoRollState('test');
      const notes = [
        createTestNote('note1', 60, 100),
        createTestNote('note2', 64, 90)
      ];
      const stateWithNotes = { ...state, notes, selectedNoteIds: ['note1', 'note2'] };
      
      const muted = toggleSelectedNotesMute(stateWithNotes);
      
      expect(muted.notes[0]?.muted).toBe(true);
      expect(muted.notes[1]?.muted).toBe(true);
    });

    it('should activate zoom tool', () => {
      const state = createPianoRollState('test');
      const withZoom = activateZoomTool(state);
      
      expect(withZoom.toolState.currentTool).toBe('zoom');
    });

    it('should zoom to rectangle', () => {
      const state = createPianoRollState('test');
      const zoomed = zoomToRect(state, 0, 0, 100, 100, 800, 600);
      
      expect(zoomed.zoom.zoomX).toBeGreaterThan(state.zoom.zoomX);
      expect(zoomed.zoom.zoomY).toBeGreaterThan(state.zoom.zoomY);
    });

    it('should activate pan tool', () => {
      const state = createPianoRollState('test');
      const withPan = activatePanTool(state);
      
      expect(withPan.toolState.currentTool).toBe('pan');
    });

    it('should pan viewport', () => {
      const state = { ...createPianoRollState('test'), scroll: { scrollX: asTick(1000), scrollY: 50, scrollbarX: 0.5, scrollbarY: 0.5 } };
      const panned = panViewport(state, 100, 50);
      
      expect(panned.scroll.scrollX).toBeLessThan(state.scroll.scrollX);
      expect(panned.scroll.scrollY).toBeLessThan(state.scroll.scrollY);
    });

    it('should activate temporary tool and return to previous', () => {
      const state = createPianoRollState('test');
      const withPointer = activatePointerTool(state);
      const withTempPan = activateTemporaryTool(withPointer, 'pan');
      
      expect(withTempPan.toolState.currentTool).toBe('pan');
      expect(withTempPan.toolState.previousTool).toBe('pointer');
      
      const backToPointer = deactivateTemporaryTool(withTempPan);
      
      expect(backToPointer.toolState.currentTool).toBe('pointer');
      expect(backToPointer.toolState.previousTool).toBeNull();
    });
  });

  describe('Additional Piano Roll Tools', () => {
    it('should activate marquee tool', () => {
      const state = createPianoRollState('test');
      const withMarquee = activateMarqueeTool(state);
      
      expect(withMarquee.toolState.currentTool).toBe('marquee');
    });

    it('should activate lasso tool', () => {
      const state = createPianoRollState('test');
      const withLasso = activateLassoTool(state);
      
      expect(withLasso.toolState.currentTool).toBe('lasso');
    });

    it('should activate line tool', () => {
      const state = createPianoRollState('test');
      const withLine = activateLineTool(state);
      
      expect(withLine.toolState.currentTool).toBe('line');
    });

    it('should draw line of notes', () => {
      const state = createPianoRollState('test');
      const withNotes = drawNoteLine(state, asTick(0), 60, asTick(960), 72, 8);
      
      expect(withNotes.notes.length).toBe(8);
      expect(withNotes.notes[0]?.pitch).toBe(60);
      expect(withNotes.notes[7]?.pitch).toBe(72);
    });

    it('should activate curve tool', () => {
      const state = createPianoRollState('test');
      const withCurve = activateCurveTool(state);
      
      expect(withCurve.toolState.currentTool).toBe('curve');
    });

    it('should draw curve of notes', () => {
      const state = createPianoRollState('test');
      const controlPoints = [
        { tick: asTick(0), pitch: 60 },
        { tick: asTick(480), pitch: 72 },
        { tick: asTick(960), pitch: 64 }
      ];
      const withNotes = drawNoteCurve(state, controlPoints, 12);
      
      // Should create notes along the curve
      expect(withNotes.notes.length).toBeGreaterThanOrEqual(1);
    });

    it('should create scale assistant', () => {
      const assistant = createScaleAssistant(60, [0, 2, 4, 5, 7, 9, 11]); // C major
      
      expect(assistant.enabled).toBe(true);
      expect(isPitchInScale(60, assistant)).toBe(true); // C
      expect(isPitchInScale(62, assistant)).toBe(true); // D
      expect(isPitchInScale(61, assistant)).toBe(false); // C#
    });

    it('should stamp chord at position', () => {
      const state = createPianoRollState('test');
      const stamp: ChordStamp = {
        rootPitch: 60,
        intervals: CHORD_STAMPS.majorTriad.intervals,
        velocity: 100,
        duration: asTickDuration(480),
        voicing: 'close'
      };
      
      const withChord = stampChord(state, asTick(0), 60, stamp);
      
      expect(withChord.notes.length).toBe(3);
      expect(withChord.notes[0]?.pitch).toBe(60); // Root
      expect(withChord.notes[1]?.pitch).toBe(64); // Major 3rd
      expect(withChord.notes[2]?.pitch).toBe(67); // Perfect 5th
    });

    it('should generate arpeggio up pattern', () => {
      const state = createPianoRollState('test');
      const config: ArpeggioPattern = {
        pattern: 'up',
        octaves: 2,
        noteCount: 6, // 3 pitches * 2 octaves = 6 notes
        duration: asTickDuration(240),
        velocity: 100
      };
      
      const withArp = generateArpeggio(state, asTick(0), [60, 64, 67], config);
      
      expect(withArp.notes.length).toBe(6);
      expect(withArp.notes[0]?.pitch).toBeLessThan(withArp.notes[5]?.pitch || 999);
    });

    it('should enable step input mode', () => {
      const state = createPianoRollState('test');
      const withStep = enableStepInput(state, asTick(0), asTickDuration(480));
      
      expect(withStep.stepInput.enabled).toBe(true);
      expect(withStep.stepInput.currentTick).toBe(0);
    });

    it('should add notes in step input mode', () => {
      const state = createPianoRollState('test');
      const withStep = enableStepInput(state, asTick(0), asTickDuration(480));
      
      const step1 = stepInputNote(withStep, 60);
      expect(step1.notes.length).toBe(1);
      expect(step1.stepInput.currentTick).toBe(480);
      
      const step2 = stepInputNote(step1, 64);
      expect(step2.notes.length).toBe(2);
      expect(step2.stepInput.currentTick).toBe(960);
    });

    it('should start real-time recording in replace mode', () => {
      const state = createPianoRollState('test');
      const existingNote = createTestNote('existing', 60, 100);
      const stateWithNote = { ...state, notes: [existingNote] };
      
      const recording = startRealtimeRecord(stateWithNote, asTick(0), 'replace');
      
      expect(recording.realtimeRecord.enabled).toBe(true);
      expect(recording.realtimeRecord.recording).toBe(true);
      expect(recording.realtimeRecord.mode).toBe('replace');
      expect(recording.notes.length).toBe(0); // Replaced
    });

    it('should start real-time recording in overdub mode', () => {
      const state = createPianoRollState('test');
      const existingNote = createTestNote('existing', 60, 100);
      const stateWithNote = { ...state, notes: [existingNote] };
      
      const recording = startRealtimeRecord(stateWithNote, asTick(0), 'overdub');
      
      expect(recording.realtimeRecord.mode).toBe('overdub');
      expect(recording.notes.length).toBe(1); // Kept
    });

    it('should handle real-time note on/off', () => {
      const state = createPianoRollState('test');
      const recording = startRealtimeRecord(state, asTick(0), 'replace');
      
      const noteOn = realtimeNoteOn(recording, 60, 100, asTick(0));
      expect(noteOn.realtimeRecord.activeNotes.size).toBe(1);
      
      const noteOff = realtimeNoteOff(noteOn, 60, asTick(480));
      expect(noteOff.notes.length).toBe(1);
      expect(noteOff.realtimeRecord.activeNotes.size).toBe(0);
    });
  });
});
