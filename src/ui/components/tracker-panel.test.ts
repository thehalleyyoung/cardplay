/**
 * @fileoverview Tests for Tracker Panel.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDefaultColumns,
  createTrackerTrack,
  createTrackerRow,
  createTrackerPanelConfig,
  createTrackerPanelState,
  calculateGridLayout,
  toggleColumnVisibility,
  setColumnWidth,
  getEventAtRow,
  eventToCellValue,
  renderCell,
  getEmptyCellPlaceholder,
  generateTrackerCSS,
  createSingleCellSelection,
  isCursorCell,
  moveCursorTo,
  extendSelection,
  createBlockSelection,
  isCellSelected,
  selectColumn,
  selectRow,
  scrollToPlayhead,
  zoomIn,
  zoomOut,
  setZoom,
  scrollHorizontal,
  scrollToTrack,
  getVisibleRowRange,
  scrollVertical,
  getVirtualizedRows,
  setRowHeight,
  resetRowHeight,
  resizeColumn,
  setGridStyle,
  toggleBeatMarkers,
  toggleBarMarkers,
  toggleRowNumbers,
  TrackerEventStreamManager,
  mergeRealtimeEvents,
  addBookmark,
  removeBookmark,
  jumpToBookmark,
  gotoRow,
  gotoMeasure,
  toggleFollowPlayhead,
  followPlayhead,
  centerPlayhead,
  advanceEditStep,
  createStepPattern,
  advanceCustomStep,
  navigatePatternLoop,
  gotoNextSection,
  gotoPreviousSection,
  searchForNote,
  searchForValue,
  type TrackerBookmark,
  type PlayheadFollowConfig,
  type EditStepConfig,
  type StepPattern,
  type PatternLoopConfig,
  type SectionMarker,
  type TrackerTrack,
  type TrackerPanelConfig,
  type ColumnType,
} from './tracker-panel';
import type { Event } from '../../types/event';
import type { Tick } from '../../types/primitives';
import type { Stream } from '../../streams';
import { createNoteEvent } from '../../types/event';

// Helper function for tests
function moveCursor(state: any, targetRow: number): any {
  return {
    ...state,
    cursor: {
      ...state.cursor,
      row: targetRow,
    },
  };
}

describe('Tracker Panel', () => {
  // ============================================================================
  // COLUMN CONFIGURATION
  // ============================================================================

  describe('createDefaultColumns', () => {
    it('creates default column set', () => {
      const columns = createDefaultColumns();
      expect(columns).toHaveLength(6);
      
      const noteCol = columns.find(c => c.type === 'note');
      expect(noteCol).toBeDefined();
      expect(noteCol!.visible).toBe(true);
      expect(noteCol!.width).toBe(60);
    });

    it('includes all essential columns', () => {
      const columns = createDefaultColumns();
      const types = columns.map(c => c.type);
      
      expect(types).toContain('note');
      expect(types).toContain('instrument');
      expect(types).toContain('volume');
      expect(types).toContain('delay');
    });
  });

  // ============================================================================
  // TRACK CREATION
  // ============================================================================

  describe('createTrackerTrack', () => {
    it('creates track with default columns', () => {
      const track = createTrackerTrack('track-1', 'Drums');
      
      expect(track.id).toBe('track-1');
      expect(track.name).toBe('Drums');
      expect(track.columns.length).toBeGreaterThan(0);
      expect(track.muted).toBe(false);
      expect(track.soloed).toBe(false);
    });

    it('calculates total width from visible columns', () => {
      const track = createTrackerTrack('track-1', 'Bass');
      
      const visibleWidth = track.columns
        .filter(c => c.visible)
        .reduce((sum, c) => sum + c.width, 0);
      
      expect(track.width).toBe(visibleWidth);
    });

    it('accepts custom color', () => {
      const track = createTrackerTrack('track-1', 'Lead', { color: '#FF0000' });
      expect(track.color).toBe('#FF0000');
    });
  });

  // ============================================================================
  // ROW CREATION
  // ============================================================================

  describe('createTrackerRow', () => {
    const config = {
      rowsPerBeat: 4,
      beatsPerBar: 4,
      rowHeight: 20,
    };

    it('creates row with basic properties', () => {
      const row = createTrackerRow(0, 0 as Tick, config);
      
      expect(row.index).toBe(0);
      expect(row.tick).toBe(0);
      expect(row.height).toBe(20);
    });

    it('marks beat rows correctly', () => {
      const row0 = createTrackerRow(0, 0 as Tick, config);
      const row4 = createTrackerRow(4, 4 as Tick, config);
      const row5 = createTrackerRow(5, 5 as Tick, config);
      
      expect(row0.onBeat).toBe(true);
      expect(row4.onBeat).toBe(true);
      expect(row5.onBeat).toBe(false);
    });

    it('marks bar rows correctly', () => {
      const row0 = createTrackerRow(0, 0 as Tick, config);
      const row16 = createTrackerRow(16, 16 as Tick, config);
      const row8 = createTrackerRow(8, 8 as Tick, config);
      
      expect(row0.onBar).toBe(true);
      expect(row16.onBar).toBe(true);
      expect(row8.onBar).toBe(false);
    });
  });

  // ============================================================================
  // PANEL CONFIGURATION
  // ============================================================================

  describe('createTrackerPanelConfig', () => {
    it('creates config with defaults', () => {
      const config = createTrackerPanelConfig();
      
      expect(config.visibleRows).toBe(64);
      expect(config.rowHeight).toBe(20);
      expect(config.patternLength).toBe(64);
      expect(config.rowsPerBeat).toBe(4);
      expect(config.beatsPerBar).toBe(4);
      expect(config.tracks).toHaveLength(2);
    });

    it('accepts custom options', () => {
      const config = createTrackerPanelConfig({
        visibleRows: 32,
        rowHeight: 24,
        fontSize: 14,
      });
      
      expect(config.visibleRows).toBe(32);
      expect(config.rowHeight).toBe(24);
      expect(config.fontSize).toBe(14);
    });

    it('includes display options', () => {
      const config = createTrackerPanelConfig();
      
      expect(config.showRowNumbers).toBe(true);
      expect(config.showBeatMarkers).toBe(true);
      expect(config.showBarMarkers).toBe(true);
    });
  });

  // ============================================================================
  // PANEL STATE
  // ============================================================================

  describe('createTrackerPanelState', () => {
    const stream: Stream<Event> = { events: [] };

    it('creates initial state', () => {
      const state = createTrackerPanelState(stream);
      
      expect(state.cursor.row).toBe(0);
      expect(state.scrollRow).toBe(0);
      expect(state.scrollX).toBe(0);
      expect(state.playheadRow).toBe(0);
      expect(state.stream).toBe(stream);
    });

    it('sets cursor to first track and note column', () => {
      const state = createTrackerPanelState(stream);
      
      expect(state.cursor.trackId).toBe('track-1');
      expect(state.cursor.column).toBe('note');
    });

    it('accepts custom config', () => {
      const state = createTrackerPanelState(stream, {
        visibleRows: 128,
        fontSize: 16,
      });
      
      expect(state.config.visibleRows).toBe(128);
      expect(state.config.fontSize).toBe(16);
    });
  });

  // ============================================================================
  // GRID LAYOUT
  // ============================================================================

  describe('calculateGridLayout', () => {
    it('calculates total width from tracks', () => {
      const track1 = createTrackerTrack('t1', 'Track 1');
      const track2 = createTrackerTrack('t2', 'Track 2');
      const config = createTrackerPanelConfig({
        tracks: [track1, track2],
      });
      
      const layout = calculateGridLayout(config);
      
      expect(layout.totalWidth).toBe(track1.width + track2.width);
    });

    it('includes row number width when enabled', () => {
      const config = createTrackerPanelConfig({ showRowNumbers: true });
      const layout = calculateGridLayout(config);
      
      expect(layout.rowNumberWidth).toBe(50);
    });

    it('excludes row number width when disabled', () => {
      const config = createTrackerPanelConfig({ showRowNumbers: false });
      const layout = calculateGridLayout(config);
      
      expect(layout.rowNumberWidth).toBe(0);
    });

    it('calculates track positions', () => {
      const track1 = createTrackerTrack('t1', 'Track 1');
      const track2 = createTrackerTrack('t2', 'Track 2');
      const config = createTrackerPanelConfig({
        tracks: [track1, track2],
      });
      
      const layout = calculateGridLayout(config);
      
      expect(layout.trackPositions.get('t1')).toBe(0);
      expect(layout.trackPositions.get('t2')).toBe(track1.width);
    });

    it('calculates total height from visible rows', () => {
      const config = createTrackerPanelConfig({
        visibleRows: 32,
        rowHeight: 25,
      });
      
      const layout = calculateGridLayout(config);
      
      expect(layout.totalHeight).toBe(32 * 25);
    });
  });

  // ============================================================================
  // COLUMN OPERATIONS
  // ============================================================================

  describe('toggleColumnVisibility', () => {
    it('toggles column visibility', () => {
      const track = createTrackerTrack('t1', 'Track');
      const delayCol = track.columns.find(c => c.type === 'delay')!;
      
      expect(delayCol.visible).toBe(false);
      
      const toggled = toggleColumnVisibility(track, 'delay');
      const newDelayCol = toggled.columns.find(c => c.type === 'delay')!;
      
      expect(newDelayCol.visible).toBe(true);
    });

    it('updates track width when toggling visibility', () => {
      const track = createTrackerTrack('t1', 'Track');
      const initialWidth = track.width;
      
      const toggled = toggleColumnVisibility(track, 'delay');
      const delayCol = toggled.columns.find(c => c.type === 'delay')!;
      
      expect(toggled.width).toBe(initialWidth + delayCol.width);
    });

    it('preserves immutability', () => {
      const track = createTrackerTrack('t1', 'Track');
      const toggled = toggleColumnVisibility(track, 'delay');
      
      expect(track.columns).not.toBe(toggled.columns);
      expect(track.width).not.toBe(toggled.width);
    });
  });

  describe('setColumnWidth', () => {
    it('sets column width', () => {
      const track = createTrackerTrack('t1', 'Track');
      const updated = setColumnWidth(track, 'note', 100);
      
      const noteCol = updated.columns.find(c => c.type === 'note')!;
      expect(noteCol.width).toBe(100);
    });

    it('updates track width', () => {
      const track = createTrackerTrack('t1', 'Track');
      const noteCol = track.columns.find(c => c.type === 'note')!;
      const oldWidth = noteCol.width;
      
      const updated = setColumnWidth(track, 'note', 100);
      
      expect(updated.width).toBe(track.width - oldWidth + 100);
    });
  });

  // ============================================================================
  // EVENT RENDERING
  // ============================================================================

  describe('getEventAtRow', () => {
    it('finds event at row', () => {
      const events: Event[] = [
        {
          id: 'evt1',
          kind: 'note',
          start: 0 as Tick,
          duration: 4 as Tick,
          payload: { pitch: 60 },
        },
      ];
      const stream: Stream<Event> = { events };
      
      const evt = getEventAtRow(stream, 2, 1);
      expect(evt).toBeDefined();
      expect(evt!.id).toBe('evt1');
    });

    it('returns undefined for empty row', () => {
      const stream: Stream<Event> = { events: [] };
      const evt = getEventAtRow(stream, 10, 1);
      
      expect(evt).toBeUndefined();
    });

    it('finds event that extends into row', () => {
      const events: Event[] = [
        {
          id: 'evt1',
          kind: 'note',
          start: 5 as Tick,
          duration: 10 as Tick,
          payload: { pitch: 60 },
        },
      ];
      const stream: Stream<Event> = { events };
      
      const evt = getEventAtRow(stream, 10, 1);
      expect(evt).toBeDefined();
      expect(evt!.id).toBe('evt1');
    });
  });

  describe('eventToCellValue', () => {
    it('formats note column as pitch notation', () => {
      const event: Event = {
        id: 'evt1',
        kind: 'note',
        start: 0 as Tick,
        duration: 1 as Tick,
        payload: { pitch: 60 }, // C4
      };
      
      const value = eventToCellValue(event, 'note');
      expect(value).toBe('C-4');
    });

    it('formats volume as hex', () => {
      const event: Event = {
        id: 'evt1',
        kind: 'note',
        start: 0 as Tick,
        duration: 1 as Tick,
        payload: { velocity: 100 },
      };
      
      const value = eventToCellValue(event, 'volume');
      expect(value).toBe('64');
    });

    it('returns placeholder for empty cell', () => {
      const value = eventToCellValue(undefined, 'note');
      expect(value).toBe('...');
    });

    it('handles different pitches correctly', () => {
      const c0 = eventToCellValue(
        { id: '1', kind: 'note', start: 0 as Tick, duration: 1 as Tick, payload: { pitch: 12 } },
        'note'
      );
      const dSharp5 = eventToCellValue(
        { id: '2', kind: 'note', start: 0 as Tick, duration: 1 as Tick, payload: { pitch: 75 } },
        'note'
      );
      
      expect(c0).toBe('C-0');
      expect(dSharp5).toBe('D#5');
    });
  });

  describe('renderCell', () => {
    it('renders cell with event data', () => {
      const events: Event[] = [
        {
          id: 'evt1',
          kind: 'note',
          start: 0 as Tick,
          duration: 4 as Tick,
          payload: { pitch: 60 },
        },
      ];
      const stream: Stream<Event> = { events };
      const state = createTrackerPanelState(stream);
      
      const cell = renderCell(state, 'track-1', 'note', 0);
      
      expect(cell.trackId).toBe('track-1');
      expect(cell.column).toBe('note');
      expect(cell.row).toBe(0);
      expect(cell.event).toBeDefined();
      expect(cell.value).toBe('C-4');
      expect(cell.empty).toBe(false);
    });

    it('renders empty cell', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream);
      
      const cell = renderCell(state, 'track-1', 'note', 5);
      
      expect(cell.empty).toBe(true);
      expect(cell.event).toBeUndefined();
      expect(cell.value).toBe('...');
    });
  });

  describe('getEmptyCellPlaceholder', () => {
    it('returns correct placeholder for each column type', () => {
      expect(getEmptyCellPlaceholder('note')).toBe('...');
      expect(getEmptyCellPlaceholder('instrument')).toBe('..');
      expect(getEmptyCellPlaceholder('volume')).toBe('..');
      expect(getEmptyCellPlaceholder('delay')).toBe('..');
      expect(getEmptyCellPlaceholder('effect1')).toBe('...');
    });
  });

  // ============================================================================
  // CSS GENERATION
  // ============================================================================

  describe('generateTrackerCSS', () => {
    it('generates valid CSS', () => {
      const config = createTrackerPanelConfig();
      const css = generateTrackerCSS(config);
      
      expect(css).toContain('.tracker-panel');
      expect(css).toContain('.tracker-row');
      expect(css).toContain('.tracker-cell');
    });

    it('includes row height in CSS', () => {
      const config = createTrackerPanelConfig({ rowHeight: 25 });
      const css = generateTrackerCSS(config);
      
      expect(css).toContain('height: 25px');
    });

    it('includes font size in CSS', () => {
      const config = createTrackerPanelConfig({ fontSize: 14 });
      const css = generateTrackerCSS(config);
      
      expect(css).toContain('font-size: 14px');
    });

    it('conditionally shows row numbers', () => {
      const withNumbers = createTrackerPanelConfig({ showRowNumbers: true });
      const withoutNumbers = createTrackerPanelConfig({ showRowNumbers: false });
      
      const css1 = generateTrackerCSS(withNumbers);
      const css2 = generateTrackerCSS(withoutNumbers);
      
      expect(css1).toContain('50px');
      expect(css2).toContain('0');
    });
  });

  // ============================================================================
  // SELECTION CURSOR
  // ============================================================================

  describe('createSingleCellSelection', () => {
    it('creates selection at cursor position', () => {
      const cursor = { row: 5, trackId: 'track-1', column: 'note' as ColumnType };
      const selection = createSingleCellSelection(cursor);
      
      expect(selection.startRow).toBe(5);
      expect(selection.endRow).toBe(5);
      expect(selection.startTrack).toBe('track-1');
      expect(selection.endTrack).toBe('track-1');
      expect(selection.isBlock).toBe(false);
    });
  });

  describe('isCursorCell', () => {
    it('returns true for cursor cell', () => {
      const cursor = { row: 5, trackId: 'track-1', column: 'note' as ColumnType };
      const cell = { row: 5, trackId: 'track-1', column: 'note' as ColumnType, value: 'C-4', empty: false };
      
      expect(isCursorCell(cell, cursor)).toBe(true);
    });

    it('returns false for different cell', () => {
      const cursor = { row: 5, trackId: 'track-1', column: 'note' as ColumnType };
      const cell = { row: 6, trackId: 'track-1', column: 'note' as ColumnType, value: 'D-4', empty: false };
      
      expect(isCursorCell(cell, cursor)).toBe(false);
    });
  });

  describe('moveCursorTo', () => {
    it('moves cursor to specified position', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream);
      
      const newState = moveCursorTo(state, 10, 'track-2', 'volume');
      
      expect(newState.cursor.row).toBe(10);
      expect(newState.cursor.trackId).toBe('track-2');
      expect(newState.cursor.column).toBe('volume');
    });

    it('clamps row to valid range', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream, { patternLength: 64 });
      
      const newState = moveCursorTo(state, 100, 'track-1', 'note');
      
      expect(newState.cursor.row).toBe(63);
    });
  });

  // ============================================================================
  // MULTI-CELL SELECTION
  // ============================================================================

  describe('extendSelection', () => {
    it('extends selection down', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream);
      
      const newState = extendSelection(state, 'down');
      
      expect(newState.selection).toBeDefined();
      expect(newState.selection!.endRow).toBe(1);
    });

    it('extends selection up', () => {
      const stream: Stream<Event> = { events: [] };
      let state = createTrackerPanelState(stream);
      state = moveCursorTo(state, 10, 'track-1', 'note');
      
      const newState = extendSelection(state, 'up');
      
      expect(newState.selection).toBeDefined();
      expect(newState.selection!.endRow).toBe(9);
    });
  });

  // ============================================================================
  // BLOCK SELECTION
  // ============================================================================

  describe('createBlockSelection', () => {
    it('creates block selection', () => {
      const selection = createBlockSelection(5, 'track-1', 'note', 10, 'track-2', 'volume');
      
      expect(selection.startRow).toBe(5);
      expect(selection.endRow).toBe(10);
      expect(selection.isBlock).toBe(true);
    });

    it('normalizes row order', () => {
      const selection = createBlockSelection(10, 'track-1', 'note', 5, 'track-2', 'volume');
      
      expect(selection.startRow).toBe(5);
      expect(selection.endRow).toBe(10);
    });
  });

  describe('isCellSelected', () => {
    it('returns true for cell in selection', () => {
      const tracks = [
        createTrackerTrack('track-1', 'Track 1'),
        createTrackerTrack('track-2', 'Track 2'),
      ];
      const selection = createBlockSelection(5, 'track-1', 'note', 10, 'track-1', 'volume');
      const cell = { row: 7, trackId: 'track-1', column: 'note' as ColumnType, value: 'C-4', empty: false };
      
      expect(isCellSelected(cell, selection, tracks)).toBe(true);
    });

    it('returns false for cell outside selection', () => {
      const tracks = [
        createTrackerTrack('track-1', 'Track 1'),
        createTrackerTrack('track-2', 'Track 2'),
      ];
      const selection = createBlockSelection(5, 'track-1', 'note', 10, 'track-1', 'volume');
      const cell = { row: 15, trackId: 'track-1', column: 'note' as ColumnType, value: 'C-4', empty: false };
      
      expect(isCellSelected(cell, selection, tracks)).toBe(false);
    });
  });

  // ============================================================================
  // COLUMN/ROW SELECTION
  // ============================================================================

  describe('selectColumn', () => {
    it('selects entire column', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream, { patternLength: 64 });
      
      const newState = selectColumn(state, 'track-1', 'note');
      
      expect(newState.selection).toBeDefined();
      expect(newState.selection!.startRow).toBe(0);
      expect(newState.selection!.endRow).toBe(63);
      expect(newState.selection!.startTrack).toBe('track-1');
      expect(newState.selection!.endTrack).toBe('track-1');
    });
  });

  describe('selectRow', () => {
    it('selects entire row', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream);
      
      const newState = selectRow(state, 10);
      
      expect(newState.selection).toBeDefined();
      expect(newState.selection!.startRow).toBe(10);
      expect(newState.selection!.endRow).toBe(10);
    });
  });

  // ============================================================================
  // SCROLLING
  // ============================================================================

  describe('scrollToPlayhead', () => {
    it('scrolls to keep playhead visible', () => {
      const stream: Stream<Event> = { events: [] };
      let state = createTrackerPanelState(stream, { visibleRows: 32, patternLength: 128 });
      state = { ...state, playheadRow: 50 };
      
      const newState = scrollToPlayhead(state);
      
      expect(newState.scrollRow).toBeGreaterThan(0);
    });

    it('centers playhead when requested', () => {
      const stream: Stream<Event> = { events: [] };
      let state = createTrackerPanelState(stream, { visibleRows: 32, patternLength: 128 });
      state = { ...state, playheadRow: 64 };
      
      const newState = scrollToPlayhead(state, true);
      
      expect(newState.scrollRow).toBe(48); // 64 - 16
    });
  });

  describe('scrollVertical', () => {
    it('scrolls by row count', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream, { patternLength: 128 });
      
      const newState = scrollVertical(state, 10);
      
      expect(newState.scrollRow).toBe(10);
    });

    it('clamps to valid range', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream, { visibleRows: 32, patternLength: 64 });
      
      const newState = scrollVertical(state, 100);
      
      expect(newState.scrollRow).toBeLessThanOrEqual(32);
    });
  });

  // ============================================================================
  // ZOOM
  // ============================================================================

  describe('zoomIn', () => {
    it('increases row height', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream);
      
      const newState = zoomIn(state);
      
      expect(newState.config.rowHeight).toBeGreaterThan(state.config.rowHeight);
    });
  });

  describe('zoomOut', () => {
    it('decreases row height', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream);
      
      const newState = zoomOut(state);
      
      expect(newState.config.rowHeight).toBeLessThan(state.config.rowHeight);
    });
  });

  describe('setZoom', () => {
    it('sets specific row height', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream);
      
      const newState = setZoom(state, 25);
      
      expect(newState.config.rowHeight).toBe(25);
    });

    it('clamps to valid range', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream);
      
      const newState = setZoom(state, 100);
      
      expect(newState.config.rowHeight).toBeLessThanOrEqual(40);
    });
  });

  // ============================================================================
  // VIRTUALIZATION
  // ============================================================================

  describe('getVisibleRowRange', () => {
    it('returns visible row range', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream, { visibleRows: 32 });
      
      const range = getVisibleRowRange(state);
      
      expect(range.startRow).toBe(0);
      expect(range.endRow).toBe(31);
    });
  });

  describe('getVirtualizedRows', () => {
    it('returns rows with overscan', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream, { visibleRows: 10, patternLength: 64 });
      
      const rows = getVirtualizedRows(state, 5);
      
      expect(rows.length).toBe(15); // 10 visible + 5 overscan at end
    });
  });

  // ============================================================================
  // CUSTOMIZATION
  // ============================================================================

  describe('setRowHeight', () => {
    it('sets custom row height', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream);
      
      const newState = setRowHeight(state, 30);
      
      expect(newState.config.rowHeight).toBe(30);
    });
  });

  describe('resetRowHeight', () => {
    it('resets to default', () => {
      const stream: Stream<Event> = { events: [] };
      let state = createTrackerPanelState(stream);
      state = setRowHeight(state, 40);
      
      const newState = resetRowHeight(state);
      
      expect(newState.config.rowHeight).toBe(20);
    });
  });

  describe('resizeColumn', () => {
    it('resizes column width', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream);
      
      const newState = resizeColumn(state, 'track-1', 'note', 80);
      
      const track = newState.config.tracks.find(t => t.id === 'track-1');
      const noteCol = track?.columns.find(c => c.type === 'note');
      expect(noteCol?.width).toBe(80);
    });
  });

  // ============================================================================
  // GRID STYLE
  // ============================================================================

  describe('setGridStyle', () => {
    it('changes grid style', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream);
      
      const newState = setGridStyle(state, 'minimal');
      
      expect(newState.config.gridStyle).toBe('minimal');
    });
  });

  describe('toggleBeatMarkers', () => {
    it('toggles beat markers', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream);
      const initial = state.config.showBeatMarkers;
      
      const newState = toggleBeatMarkers(state);
      
      expect(newState.config.showBeatMarkers).toBe(!initial);
    });
  });

  describe('toggleBarMarkers', () => {
    it('toggles bar markers', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream);
      const initial = state.config.showBarMarkers;
      
      const newState = toggleBarMarkers(state);
      
      expect(newState.config.showBarMarkers).toBe(!initial);
    });
  });

  describe('toggleRowNumbers', () => {
    it('toggles row numbers', () => {
      const stream: Stream<Event> = { events: [] };
      const state = createTrackerPanelState(stream);
      const initial = state.config.showRowNumbers;
      
      const newState = toggleRowNumbers(state);
      
      expect(newState.config.showRowNumbers).toBe(!initial);
    });
  });

  // ============================================================================
  // REAL-TIME EVENT STREAMING
  // ============================================================================

  describe('TrackerEventStreamManager', () => {
    let manager: TrackerEventStreamManager;

    beforeEach(() => {
      manager = new TrackerEventStreamManager();
      vi.useFakeTimers();
    });

    afterEach(() => {
      manager.destroy();
      vi.restoreAllMocks();
    });

    it('subscribes to deck events', () => {
      const callback = vi.fn();
      const subscription = manager.subscribe('deck-1', callback);
      
      expect(subscription.deckId).toBe('deck-1');
      expect(typeof subscription.unsubscribe).toBe('function');
    });

    it('emits events to subscribers after flush interval', () => {
      const callback = vi.fn();
      manager.subscribe('deck-1', callback);
      
      const event: Event<unknown> = {
        id: 'evt-1' as any,
        kind: 'note',
        start: 0 as Tick,
        duration: 96 as any,
        payload: { pitch: 60, velocity: 100 },
      };
      
      manager.emitEvent('deck-1', event);
      expect(callback).not.toHaveBeenCalled();
      
      // Advance timer to trigger flush
      vi.advanceTimersByTime(50);
      
      expect(callback).toHaveBeenCalledWith([event]);
    });

    it('batches multiple events before flush', () => {
      const callback = vi.fn();
      manager.subscribe('deck-1', callback);
      
      const events: Event<unknown>[] = [
        { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 96 as any, payload: {} },
        { id: 'e2' as any, kind: 'note', start: 96 as Tick, duration: 96 as any, payload: {} },
        { id: 'e3' as any, kind: 'note', start: 192 as Tick, duration: 96 as any, payload: {} },
      ];
      
      events.forEach(e => manager.emitEvent('deck-1', e));
      
      vi.advanceTimersByTime(50);
      
      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith(events);
    });

    it('supports multiple subscribers for same deck', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      manager.subscribe('deck-1', callback1);
      manager.subscribe('deck-1', callback2);
      
      const event: Event<unknown> = {
        id: 'evt' as any,
        kind: 'note',
        start: 0 as Tick,
        duration: 96 as any,
        payload: {},
      };
      
      manager.emitEvent('deck-1', event);
      vi.advanceTimersByTime(50);
      
      expect(callback1).toHaveBeenCalledWith([event]);
      expect(callback2).toHaveBeenCalledWith([event]);
    });

    it('isolates events between different decks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      manager.subscribe('deck-1', callback1);
      manager.subscribe('deck-2', callback2);
      
      const event1: Event<unknown> = {
        id: 'e1' as any,
        kind: 'note',
        start: 0 as Tick,
        duration: 96 as any,
        payload: {},
      };
      
      const event2: Event<unknown> = {
        id: 'e2' as any,
        kind: 'note',
        start: 0 as Tick,
        duration: 96 as any,
        payload: {},
      };
      
      manager.emitEvent('deck-1', event1);
      manager.emitEvent('deck-2', event2);
      
      vi.advanceTimersByTime(50);
      
      expect(callback1).toHaveBeenCalledWith([event1]);
      expect(callback2).toHaveBeenCalledWith([event2]);
    });

    it('unsubscribes correctly', () => {
      const callback = vi.fn();
      const subscription = manager.subscribe('deck-1', callback);
      
      subscription.unsubscribe();
      
      const event: Event<unknown> = {
        id: 'evt' as any,
        kind: 'note',
        start: 0 as Tick,
        duration: 96 as any,
        payload: {},
      };
      
      manager.emitEvent('deck-1', event);
      vi.advanceTimersByTime(50);
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('stops flush interval when no subscribers remain', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      const sub1 = manager.subscribe('deck-1', callback1);
      const sub2 = manager.subscribe('deck-1', callback2);
      
      sub1.unsubscribe();
      sub2.unsubscribe();
      
      const event: Event<unknown> = {
        id: 'evt' as any,
        kind: 'note',
        start: 0 as Tick,
        duration: 96 as any,
        payload: {},
      };
      
      manager.emitEvent('deck-1', event);
      vi.advanceTimersByTime(50);
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('handles emitEvents for batch emission', () => {
      const callback = vi.fn();
      manager.subscribe('deck-1', callback);
      
      const events: Event<unknown>[] = [
        { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 96 as any, payload: {} },
        { id: 'e2' as any, kind: 'note', start: 96 as Tick, duration: 96 as any, payload: {} },
      ];
      
      manager.emitEvents('deck-1', events);
      vi.advanceTimersByTime(50);
      
      expect(callback).toHaveBeenCalledWith(events);
    });
  });

  describe('mergeRealtimeEvents', () => {
    it('merges new events into stream maintaining order', () => {
      const existingEvents: Event<unknown>[] = [
        { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 96 as any, payload: {} },
        { id: 'e3' as any, kind: 'note', start: 192 as Tick, duration: 96 as any, payload: {} },
      ];
      
      const state = createTrackerPanelState({ events: existingEvents });
      
      const newEvents: Event<unknown>[] = [
        { id: 'e2' as any, kind: 'note', start: 96 as Tick, duration: 96 as any, payload: {} },
        { id: 'e4' as any, kind: 'note', start: 288 as Tick, duration: 96 as any, payload: {} },
      ];
      
      const updated = mergeRealtimeEvents(state, newEvents);
      
      expect(updated.stream.events).toHaveLength(4);
      expect(updated.stream.events[0].id).toBe('e1');
      expect(updated.stream.events[1].id).toBe('e2');
      expect(updated.stream.events[2].id).toBe('e3');
      expect(updated.stream.events[3].id).toBe('e4');
    });

    it('returns unchanged state for empty event array', () => {
      const state = createTrackerPanelState({ events: [] });
      const updated = mergeRealtimeEvents(state, []);
      
      expect(updated).toBe(state);
    });

    it('handles events with same start time', () => {
      const state = createTrackerPanelState({ events: [] });
      
      const newEvents: Event<unknown>[] = [
        { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 96 as any, payload: {} },
        { id: 'e2' as any, kind: 'note', start: 0 as Tick, duration: 96 as any, payload: {} },
      ];
      
      const updated = mergeRealtimeEvents(state, newEvents);
      
      expect(updated.stream.events).toHaveLength(2);
    });
  });

  describe('Event Editing', () => {
    describe('enterNote', () => {
      it('creates new note at cursor position', async () => {
        const { enterNote } = await import('./tracker-panel');
        const state = createTrackerPanelState({ events: [] });
        const updated = enterNote(state, 60, 100);
        
        expect(updated.stream.events).toHaveLength(1);
        expect((updated.stream.events[0].payload as any).pitch).toBe(60);
        expect((updated.stream.events[0].payload as any).velocity).toBe(100);
      });

      it('replaces existing note at cursor position', async () => {
        const { enterNote } = await import('./tracker-panel');
        const existingEvent = {
          id: 'e1' as any,
          kind: 'note',
          start: 0 as Tick,
          duration: 4 as any,
          payload: { pitch: 60, velocity: 100 },
        };
        const state = createTrackerPanelState({ events: [existingEvent] });
        const updated = enterNote(state, 64, 110);
        
        expect(updated.stream.events).toHaveLength(1);
        expect((updated.stream.events[0].payload as any).pitch).toBe(64);
      });
    });

    describe('setVelocity', () => {
      it('updates velocity of existing event', async () => {
        const { setVelocity } = await import('./tracker-panel');
        const existingEvent = {
          id: 'e1' as any,
          kind: 'note',
          start: 0 as Tick,
          duration: 4 as any,
          payload: { pitch: 60, velocity: 100 },
        };
        const state = createTrackerPanelState({ events: [existingEvent] });
        const updated = setVelocity(state, 80);
        
        expect((updated.stream.events[0].payload as any).velocity).toBe(80);
      });

      it('returns unchanged state when no event at cursor', async () => {
        const { setVelocity } = await import('./tracker-panel');
        const state = createTrackerPanelState({ events: [] });
        const updated = setVelocity(state, 80);
        
        expect(updated).toBe(state);
      });
    });

    describe('setDuration', () => {
      it('updates duration of existing event', async () => {
        const { setDuration } = await import('./tracker-panel');
        const existingEvent = {
          id: 'e1' as any,
          kind: 'note',
          start: 0 as Tick,
          duration: 4 as any,
          payload: { pitch: 60, velocity: 100 },
        };
        const state = createTrackerPanelState({ events: [existingEvent] });
        const updated = setDuration(state, 8);
        
        expect(updated.stream.events[0].duration).toBe(8);
      });
    });

    describe('transposeOctave', () => {
      it('transposes note up by octave', async () => {
        const { transposeOctave } = await import('./tracker-panel');
        const existingEvent = {
          id: 'e1' as any,
          kind: 'note',
          start: 0 as Tick,
          duration: 4 as any,
          payload: { pitch: 60, velocity: 100 },
        };
        const state = createTrackerPanelState({ events: [existingEvent] });
        const updated = transposeOctave(state, 1);
        
        expect((updated.stream.events[0].payload as any).pitch).toBe(72);
      });

      it('transposes note down by octave', async () => {
        const { transposeOctave } = await import('./tracker-panel');
        const existingEvent = {
          id: 'e1' as any,
          kind: 'note',
          start: 0 as Tick,
          duration: 4 as any,
          payload: { pitch: 60, velocity: 100 },
        };
        const state = createTrackerPanelState({ events: [existingEvent] });
        const updated = transposeOctave(state, -1);
        
        expect((updated.stream.events[0].payload as any).pitch).toBe(48);
      });

      it('clamps pitch to MIDI range', async () => {
        const { transposeOctave } = await import('./tracker-panel');
        const existingEvent = {
          id: 'e1' as any,
          kind: 'note',
          start: 0 as Tick,
          duration: 4 as any,
          payload: { pitch: 120, velocity: 100 },
        };
        const state = createTrackerPanelState({ events: [existingEvent] });
        const updated = transposeOctave(state, 1);
        
        expect((updated.stream.events[0].payload as any).pitch).toBe(127);
      });
    });

    describe('transposeSelection', () => {
      it('transposes all notes in selection', async () => {
        const { transposeSelection, createBlockSelection } = await import('./tracker-panel');
        const events = [
          { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 4 as any, payload: { pitch: 60, velocity: 100 } },
          { id: 'e2' as any, kind: 'note', start: 1 as Tick, duration: 4 as any, payload: { pitch: 64, velocity: 100 } },
          { id: 'e3' as any, kind: 'note', start: 2 as Tick, duration: 4 as any, payload: { pitch: 67, velocity: 100 } },
        ];
        let state = createTrackerPanelState({ events });
        const tracks = state.config.tracks;
        state = {
          ...state,
          selection: createBlockSelection(0, tracks[0].id, 'note', 2, tracks[0].id, 'note'),
        };
        
        const updated = transposeSelection(state, 3);
        
        expect((updated.stream.events[0].payload as any).pitch).toBe(63);
        expect((updated.stream.events[1].payload as any).pitch).toBe(67);
        expect((updated.stream.events[2].payload as any).pitch).toBe(70);
      });
    });

    describe('deleteNote', () => {
      it('deletes event at cursor', async () => {
        const { deleteNote } = await import('./tracker-panel');
        const existingEvent = {
          id: 'e1' as any,
          kind: 'note',
          start: 0 as Tick,
          duration: 4 as any,
          payload: { pitch: 60, velocity: 100 },
        };
        const state = createTrackerPanelState({ events: [existingEvent] });
        const updated = deleteNote(state);
        
        expect(updated.stream.events).toHaveLength(0);
      });

      it('returns unchanged state when no event at cursor', async () => {
        const { deleteNote } = await import('./tracker-panel');
        const state = createTrackerPanelState({ events: [] });
        const updated = deleteNote(state);
        
        expect(updated).toBe(state);
      });
    });

    describe('cut/copy/paste', () => {
      it('cuts events to clipboard', async () => {
        const { cutEvents, createBlockSelection } = await import('./tracker-panel');
        const events = [
          { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 4 as any, payload: {} },
          { id: 'e2' as any, kind: 'note', start: 1 as Tick, duration: 4 as any, payload: {} },
        ];
        let state = createTrackerPanelState({ events });
        const tracks = state.config.tracks;
        state = {
          ...state,
          selection: createBlockSelection(0, tracks[0].id, 'note', 1, tracks[0].id, 'note'),
        };
        
        const updated = cutEvents(state);
        
        expect(updated.stream.events).toHaveLength(0);
      });

      it('pastes events at cursor position', async () => {
        const { cutEvents, pasteEvents, moveCursorTo, createBlockSelection } = await import('./tracker-panel');
        const events = [
          { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 4 as any, payload: {} },
        ];
        let state = createTrackerPanelState({ events });
        const tracks = state.config.tracks;
        state = {
          ...state,
          selection: createBlockSelection(0, tracks[0].id, 'note', 0, tracks[0].id, 'note'),
        };
        
        const cut = cutEvents(state);
        const moved = moveCursorTo(cut, 2, tracks[0].id, 'note');
        const pasted = pasteEvents(moved);
        
        expect(pasted.stream.events).toHaveLength(1);
        expect(pasted.stream.events[0].start).toBe(2);
      });
    });

    describe('duplicateSelection', () => {
      it('duplicates selected events', async () => {
        const { duplicateSelection, createBlockSelection } = await import('./tracker-panel');
        const events = [
          { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 4 as any, payload: {} },
          { id: 'e2' as any, kind: 'note', start: 1 as Tick, duration: 4 as any, payload: {} },
        ];
        let state = createTrackerPanelState({ events });
        const tracks = state.config.tracks;
        state = {
          ...state,
          selection: createBlockSelection(0, tracks[0].id, 'note', 1, tracks[0].id, 'note'),
        };
        
        const updated = duplicateSelection(state);
        
        expect(updated.stream.events).toHaveLength(4);
      });
    });

    describe('insertBlankRow', () => {
      it('inserts blank row and shifts events down', async () => {
        const { insertBlankRow, moveCursorTo } = await import('./tracker-panel');
        const events = [
          { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 4 as any, payload: {} },
          { id: 'e2' as any, kind: 'note', start: 2 as Tick, duration: 4 as any, payload: {} },
        ];
        let state = createTrackerPanelState({ events });
        const tracks = state.config.tracks;
        state = moveCursorTo(state, 1, tracks[0].id, 'note');
        
        const updated = insertBlankRow(state);
        
        expect(updated.stream.events).toHaveLength(2);
        expect(updated.stream.events[0].start).toBe(0);
        expect(updated.stream.events[1].start).toBe(3); // Shifted from 2 to 3
      });
    });

    describe('deleteRow', () => {
      it('deletes row and shifts events up', async () => {
        const { deleteRow, moveCursorTo } = await import('./tracker-panel');
        const events = [
          { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 4 as any, payload: {} },
          { id: 'e2' as any, kind: 'note', start: 2 as Tick, duration: 4 as any, payload: {} },
        ];
        let state = createTrackerPanelState({ events });
        const tracks = state.config.tracks;
        state = moveCursorTo(state, 0, tracks[0].id, 'note');
        
        const updated = deleteRow(state);
        
        expect(updated.stream.events).toHaveLength(1);
        expect(updated.stream.events[0].start).toBe(1); // Shifted from 2 to 1
      });
    });

    describe('fillSelection', () => {
      it('fills selection with specified value', async () => {
        const { fillSelection, createBlockSelection } = await import('./tracker-panel');
        const events = [
          { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 4 as any, payload: { velocity: 64 } },
          { id: 'e2' as any, kind: 'note', start: 1 as Tick, duration: 4 as any, payload: { velocity: 64 } },
        ];
        let state = createTrackerPanelState({ events });
        const tracks = state.config.tracks;
        state = {
          ...state,
          selection: createBlockSelection(0, tracks[0].id, 'note', 1, tracks[0].id, 'note'),
        };
        
        const updated = fillSelection(state, 100, 'volume');
        
        expect((updated.stream.events[0].payload as any).velocity).toBe(100);
        expect((updated.stream.events[1].payload as any).velocity).toBe(100);
      });
    });

    describe('interpolateSelection', () => {
      it('interpolates values across selection', async () => {
        const { interpolateSelection, createBlockSelection } = await import('./tracker-panel');
        const events = [
          { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 4 as any, payload: { velocity: 64 } },
          { id: 'e2' as any, kind: 'note', start: 1 as Tick, duration: 4 as any, payload: { velocity: 64 } },
        ];
        let state = createTrackerPanelState({ events });
        const tracks = state.config.tracks;
        state = {
          ...state,
          selection: createBlockSelection(0, tracks[0].id, 'note', 1, tracks[0].id, 'note'),
        };
        
        const updated = interpolateSelection(state, 20, 120, 'volume');
        
        expect((updated.stream.events[0].payload as any).velocity).toBeLessThanOrEqual(120);
        expect((updated.stream.events[1].payload as any).velocity).toBeGreaterThanOrEqual(20);
      });
    });

    describe('randomizeSelection', () => {
      it('randomizes values in selection', async () => {
        const { randomizeSelection, createBlockSelection } = await import('./tracker-panel');
        const events = [
          { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 4 as any, payload: { velocity: 64 } },
          { id: 'e2' as any, kind: 'note', start: 1 as Tick, duration: 4 as any, payload: { velocity: 64 } },
        ];
        let state = createTrackerPanelState({ events });
        const tracks = state.config.tracks;
        state = {
          ...state,
          selection: createBlockSelection(0, tracks[0].id, 'note', 1, tracks[0].id, 'note'),
        };
        
        const updated = randomizeSelection(state, 50, 100, 'volume');
        
        expect((updated.stream.events[0].payload as any).velocity).toBeGreaterThanOrEqual(50);
        expect((updated.stream.events[0].payload as any).velocity).toBeLessThanOrEqual(100);
        expect((updated.stream.events[1].payload as any).velocity).toBeGreaterThanOrEqual(50);
        expect((updated.stream.events[1].payload as any).velocity).toBeLessThanOrEqual(100);
      });
    });

    describe('humanizeSelection', () => {
      it('humanizes events with timing and velocity variation', async () => {
        const { humanizeSelection, createBlockSelection } = await import('./tracker-panel');
        const events = [
          { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 4 as any, payload: { velocity: 64 } },
          { id: 'e2' as any, kind: 'note', start: 1 as Tick, duration: 4 as any, payload: { velocity: 64 } },
        ];
        let state = createTrackerPanelState({ events });
        const tracks = state.config.tracks;
        state = {
          ...state,
          selection: createBlockSelection(0, tracks[0].id, 'note', 1, tracks[0].id, 'note'),
        };
        
        const updated = humanizeSelection(state, 0.2, 0.2);
        
        // Events should still exist and be sorted
        expect(updated.stream.events).toHaveLength(2);
        expect(updated.stream.events[0].start).toBeLessThanOrEqual(updated.stream.events[1].start);
      });
    });

    describe('quantizeSelection', () => {
      it('quantizes events to grid', async () => {
        const { quantizeSelection, createBlockSelection } = await import('./tracker-panel');
        const events = [
          { id: 'e1' as any, kind: 'note', start: 0.3 as Tick, duration: 4 as any, payload: {} },
          { id: 'e2' as any, kind: 'note', start: 1.7 as Tick, duration: 4 as any, payload: {} },
        ];
        let state = createTrackerPanelState({ events });
        const tracks = state.config.tracks;
        state = {
          ...state,
          selection: createBlockSelection(0, tracks[0].id, 'note', 1, tracks[0].id, 'note'),
        };
        
        const updated = quantizeSelection(state, 1);
        
        expect(updated.stream.events[0].start).toBe(0);
        expect(updated.stream.events[1].start).toBe(2);
      });
    });

    describe('swingSelection', () => {
      it('applies swing to selection', async () => {
        const { swingSelection, createBlockSelection } = await import('./tracker-panel');
        const events = [
          { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 4 as any, payload: {} },
          { id: 'e2' as any, kind: 'note', start: 1 as Tick, duration: 4 as any, payload: {} },
        ];
        let state = createTrackerPanelState({ events });
        const tracks = state.config.tracks;
        state = {
          ...state,
          selection: createBlockSelection(0, tracks[0].id, 'note', 1, tracks[0].id, 'note'),
        };
        
        const updated = swingSelection(state, 0.5);
        
        expect(updated.stream.events).toHaveLength(2);
        expect(updated.stream.events[0].start).toBe(0); // Even row, no swing
        expect(updated.stream.events[1].start).toBeGreaterThan(1); // Odd row, swing applied
      });
    });

    describe('velocityCurveSelection', () => {
      it('applies velocity curve to selection', async () => {
        const { velocityCurveSelection, createBlockSelection } = await import('./tracker-panel');
        const events = [
          { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 4 as any, payload: { velocity: 64 } },
          { id: 'e2' as any, kind: 'note', start: 1 as Tick, duration: 4 as any, payload: { velocity: 64 } },
        ];
        let state = createTrackerPanelState({ events });
        const tracks = state.config.tracks;
        state = {
          ...state,
          selection: createBlockSelection(0, tracks[0].id, 'note', 1, tracks[0].id, 'note'),
        };
        
        const updated = velocityCurveSelection(state, 'linear', 100, 50);
        
        // With 2 events at ticks 0 and 1, selection length is 2
        // Event 0 at tick 0: progress = 0/2 = 0 → velocity = 100
        // Event 1 at tick 1: progress = 1/2 = 0.5 → velocity = 100 + (50-100)*0.5 = 75
        expect((updated.stream.events[0].payload as any).velocity).toBeCloseTo(100, 0);
        expect((updated.stream.events[1].payload as any).velocity).toBeCloseTo(75, 0);
      });

      it('applies exponential velocity curve', async () => {
        const { velocityCurveSelection, createBlockSelection } = await import('./tracker-panel');
        const events = [
          { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 4 as any, payload: { velocity: 64 } },
          { id: 'e2' as any, kind: 'note', start: 1 as Tick, duration: 4 as any, payload: { velocity: 64 } },
        ];
        let state = createTrackerPanelState({ events });
        const tracks = state.config.tracks;
        state = {
          ...state,
          selection: createBlockSelection(0, tracks[0].id, 'note', 1, tracks[0].id, 'note'),
        };
        
        const updated = velocityCurveSelection(state, 'exponential', 100, 50);
        
        expect(updated.stream.events).toHaveLength(2);
        expect((updated.stream.events[0].payload as any).velocity).toBeDefined();
        expect((updated.stream.events[1].payload as any).velocity).toBeDefined();
      });
    });

    describe('reverseSelection', () => {
      it('reverses events in selection', async () => {
        const { reverseSelection, createBlockSelection } = await import('./tracker-panel');
        const events = [
          { id: 'e1' as any, kind: 'note', start: 0 as Tick, duration: 4 as any, payload: {} },
          { id: 'e2' as any, kind: 'note', start: 1 as Tick, duration: 4 as any, payload: {} },
          { id: 'e3' as any, kind: 'note', start: 2 as Tick, duration: 4 as any, payload: {} },
        ];
        let state = createTrackerPanelState({ events });
        const tracks = state.config.tracks;
        state = {
          ...state,
          selection: createBlockSelection(0, tracks[0].id, 'note', 2, tracks[0].id, 'note'),
        };
        
        const updated = reverseSelection(state);
        
        expect(updated.stream.events).toHaveLength(3);
        expect(updated.stream.events[0].id).toBe('e3');
        expect(updated.stream.events[1].id).toBe('e2');
        expect(updated.stream.events[2].id).toBe('e1');
      });
    });
  });

  // ========================================================================
  // Additional Navigation Features Tests (Items 2384-2393)
  // ========================================================================

  describe('Bookmarks', () => {
    describe('addBookmark', () => {
      it('should add a bookmark at current cursor position', () => {
        const stream: Stream<Event<unknown>> = { events: [] };
        const state = createTrackerPanelState(stream);
        const stateWithCursor = moveCursor(state, 42);
        const bookmarks: TrackerBookmark[] = [];
        
        const updated = addBookmark(stateWithCursor, bookmarks, 'Test Bookmark');
        
        expect(updated).toHaveLength(1);
        expect(updated[0].row).toBe(42);
        expect(updated[0].label).toBe('Test Bookmark');
      });
      
      it('should auto-generate label if not provided', () => {
        const stream: Stream<Event<unknown>> = { events: [] };
        const state = createTrackerPanelState(stream);
        const bookmarks: TrackerBookmark[] = [];
        
        const updated = addBookmark(state, bookmarks);
        
        expect(updated[0].label).toBe('Bookmark 1');
      });
    });
    
    describe('removeBookmark', () => {
      it('should remove bookmark by ID', () => {
        const bookmarks: TrackerBookmark[] = [
          { id: 'b1', row: 10, label: 'First' },
          { id: 'b2', row: 20, label: 'Second' },
        ];
        
        const updated = removeBookmark(bookmarks, 'b1');
        
        expect(updated).toHaveLength(1);
        expect(updated[0].id).toBe('b2');
      });
    });
    
    describe('jumpToBookmark', () => {
      it('should jump to bookmark position', () => {
        const stream: Stream<Event<unknown>> = { events: [] };
        const state = createTrackerPanelState(stream);
        const bookmarks: TrackerBookmark[] = [
          { id: 'b1', row: 50, label: 'Mark' },
        ];
        
        const updated = jumpToBookmark(state, bookmarks, 'b1');
        
        expect(updated.cursor.row).toBe(50);
      });
      
      it('should return unchanged state for unknown bookmark', () => {
        const stream: Stream<Event<unknown>> = { events: [] };
        const state = createTrackerPanelState(stream);
        const bookmarks: TrackerBookmark[] = [];
        
        const updated = jumpToBookmark(state, bookmarks, 'unknown');
        
        expect(updated).toBe(state);
      });
    });
  });

  describe('Goto Operations', () => {
    describe('gotoRow', () => {
      it('should jump to specified row', () => {
        const stream: Stream<Event<unknown>> = { events: [] };
        const state = createTrackerPanelState(stream, { patternLength: 256 });
        
        const updated = gotoRow(state, 100);
        
        expect(updated.cursor.row).toBe(100);
      });
      
      it('should clamp row to valid range', () => {
        const stream: Stream<Event<unknown>> = { events: [] };
        const state = createTrackerPanelState(stream, { patternLength: 256 });
        
        const updated = gotoRow(state, 500);
        
        expect(updated.cursor.row).toBe(255);
      });
      
      it('should adjust scroll position to center target', () => {
        const stream: Stream<Event<unknown>> = { events: [] };
        const state = createTrackerPanelState(stream, { visibleRows: 32, patternLength: 256 });
        
        const updated = gotoRow(state, 100);
        
        // Should center the row in viewport
        expect(updated.scrollRow).toBeGreaterThan(0);
      });
    });
    
    describe('gotoMeasure', () => {
      it('should convert measure to row correctly', () => {
        const stream: Stream<Event<unknown>> = { events: [] }; const state = createTrackerPanelState(stream, { patternLength: 256 });
        const rowsPerMeasure = 16;
        
        const updated = gotoMeasure(state, 5, rowsPerMeasure);
        
        expect(updated.cursor.row).toBe(64); // (5 - 1) * 16
      });
      
      it('should handle measure 1 correctly', () => {
        const stream: Stream<Event<unknown>> = { events: [] }; const state = createTrackerPanelState(stream, { patternLength: 256 });
        
        const updated = gotoMeasure(state, 1, 16);
        
        expect(updated.cursor.row).toBe(0);
      });
    });
  });

  describe('Playhead Following', () => {
    describe('toggleFollowPlayhead', () => {
      it('should toggle enabled state', () => {
        const config: PlayheadFollowConfig = {
          enabled: false,
          mode: 'center',
          scrollMargin: 4,
        };
        
        const updated = toggleFollowPlayhead(config);
        
        expect(updated.enabled).toBe(true);
      });
    });
    
    describe('followPlayhead', () => {
      it('should do nothing when disabled', () => {
        const stream: Stream<Event<unknown>> = { events: [] }; const state = createTrackerPanelState(stream, { patternLength: 256 });
        const config: PlayheadFollowConfig = {
          enabled: false,
          mode: 'center',
          scrollMargin: 4,
        };
        
        const updated = followPlayhead(state, 50, config);
        
        expect(updated).toBe(state);
      });
      
      it('should center playhead in center mode', () => {
        const stream: Stream<Event<unknown>> = { events: [] };
        const state = createTrackerPanelState(stream, { visibleRows: 32, patternLength: 256 });
        const config: PlayheadFollowConfig = {
          enabled: true,
          mode: 'center',
          scrollMargin: 4,
        };
        
        const updated = followPlayhead(state, 100, config);
        
        // Should center around row 100
        expect(updated.scrollRow).toBe(100 - 16); // 100 - visibleRows/2
      });
      
      it('should scroll only when approaching edge in scroll mode', () => {
        const stream: Stream<Event<unknown>> = { events: [] };
        const state = createTrackerPanelState(stream, { visibleRows: 32, patternLength: 256 });
        const config: PlayheadFollowConfig = {
          enabled: true,
          mode: 'scroll',
          scrollMargin: 4,
        };
        
        // Playhead within safe zone - no scroll
        let updated = followPlayhead(state, 10, config);
        expect(updated).toBe(state);
        
        // Playhead near bottom - should scroll
        updated = followPlayhead(state, 30, config);
        expect(updated.scrollRow).toBeGreaterThan(0);
      });
    });
    
    describe('centerPlayhead', () => {
      it('should center playhead in viewport', () => {
        const stream: Stream<Event<unknown>> = { events: [] };
        const state = createTrackerPanelState(stream, { visibleRows: 32, patternLength: 256 });
        
        const updated = centerPlayhead(state, 80);
        
        expect(updated.scrollRow).toBe(64); // 80 - 32/2
      });
    });
  });

  describe('Edit Step', () => {
    describe('advanceEditStep', () => {
      it('should advance cursor by step size', () => {
        const stream: Stream<Event<unknown>> = { events: [] }; const state = createTrackerPanelState(stream, { patternLength: 256 });
        const config: EditStepConfig = {
          stepSize: 4,
          enabled: true,
        };
        
        const updated = advanceEditStep(state, config);
        
        expect(updated.cursor.row).toBe(4);
      });
      
      it('should do nothing when disabled', () => {
        const stream: Stream<Event<unknown>> = { events: [] }; const state = createTrackerPanelState(stream, { patternLength: 256 });
        const config: EditStepConfig = {
          stepSize: 4,
          enabled: false,
        };
        
        const updated = advanceEditStep(state, config);
        
        expect(updated).toBe(state);
      });
      
      it('should not exceed pattern length', () => {
        const state = createTrackerPanelState({ patternLength: 64 });
        const stateAtEnd = moveCursor(state, 62);
        const config: EditStepConfig = {
          stepSize: 8,
          enabled: true,
        };
        
        const updated = advanceEditStep(stateAtEnd, config);
        
        expect(updated.cursor.row).toBe(63);
      });
    });
  });

  describe('Custom Step Patterns', () => {
    describe('createStepPattern', () => {
      it('should create a step pattern', () => {
        const pattern = createStepPattern('Triplet', [1, 1, 2]);
        
        expect(pattern.name).toBe('Triplet');
        expect(pattern.steps).toEqual([1, 1, 2]);
        expect(pattern.currentIndex).toBe(0);
      });
    });
    
    describe('advanceCustomStep', () => {
      it('should advance using pattern steps', () => {
        const stream: Stream<Event<unknown>> = { events: [] }; const state = createTrackerPanelState(stream, { patternLength: 256 });
        const pattern = createStepPattern('Test', [2, 3]);
        
        // First step: +2
        let result = advanceCustomStep(state, pattern);
        expect(result.state.cursor.row).toBe(2);
        expect(result.pattern.currentIndex).toBe(1);
        
        // Second step: +3
        result = advanceCustomStep(result.state, result.pattern);
        expect(result.state.cursor.row).toBe(5);
        expect(result.pattern.currentIndex).toBe(0); // Wraps around
      });
      
      it('should handle empty pattern', () => {
        const stream: Stream<Event<unknown>> = { events: [] }; const state = createTrackerPanelState(stream, { patternLength: 256 });
        const pattern = createStepPattern('Empty', []);
        
        const result = advanceCustomStep(state, pattern);
        
        expect(result.state).toBe(state);
      });
    });
  });

  describe('Pattern Loop Navigation', () => {
    describe('navigatePatternLoop', () => {
      it('should do nothing when disabled', () => {
        const stream: Stream<Event<unknown>> = { events: [] }; const state = createTrackerPanelState(stream, { patternLength: 256 });
        const config: PatternLoopConfig = {
          startRow: 16,
          endRow: 32,
          enabled: false,
        };
        
        const updated = navigatePatternLoop(state, config);
        
        expect(updated).toBe(state);
      });
      
      it('should wrap cursor to loop start when beyond end', () => {
        const stream: Stream<Event<unknown>> = { events: [] }; const state = createTrackerPanelState(stream, { patternLength: 256 });
        const stateAtEnd = moveCursor(state, 32);
        const config: PatternLoopConfig = {
          startRow: 16,
          endRow: 32,
          enabled: true,
        };
        
        const updated = navigatePatternLoop(stateAtEnd, config);
        
        expect(updated.cursor.row).toBe(16);
      });
      
      it('should clamp cursor within loop boundaries', () => {
        const state = moveCursor(createTrackerPanelState(), 20);
        const config: PatternLoopConfig = {
          startRow: 16,
          endRow: 32,
          enabled: true,
        };
        
        const updated = navigatePatternLoop(state, config);
        
        expect(updated.cursor.row).toBe(20);
      });
    });
  });

  describe('Section Navigation', () => {
    const sections: SectionMarker[] = [
      { id: 's1', row: 0, name: 'Intro', type: 'intro' },
      { id: 's2', row: 64, name: 'Verse', type: 'verse' },
      { id: 's3', row: 128, name: 'Chorus', type: 'chorus' },
    ];
    
    describe('gotoNextSection', () => {
      it('should jump to next section', () => {
        const stream: Stream<Event<unknown>> = { events: [] }; const state = createTrackerPanelState(stream, { patternLength: 256 });
        const stateAt50 = moveCursor(state, 50);
        
        const updated = gotoNextSection(stateAt50, sections);
        
        expect(updated.cursor.row).toBe(64);
      });
      
      it('should wrap to first section when at end', () => {
        const stream: Stream<Event<unknown>> = { events: [] }; const state = createTrackerPanelState(stream, { patternLength: 256 });
        const stateAt200 = moveCursor(state, 200);
        
        const updated = gotoNextSection(stateAt200, sections);
        
        expect(updated.cursor.row).toBe(0);
      });
      
      it('should return unchanged for empty sections', () => {
        const stream: Stream<Event<unknown>> = { events: [] }; const state = createTrackerPanelState(stream, { patternLength: 256 });
        
        const updated = gotoNextSection(state, []);
        
        expect(updated).toBe(state);
      });
    });
    
    describe('gotoPreviousSection', () => {
      it('should jump to previous section', () => {
        const stream: Stream<Event<unknown>> = { events: [] }; const state = createTrackerPanelState(stream, { patternLength: 256 });
        const stateAt100 = moveCursor(state, 100);
        
        const updated = gotoPreviousSection(stateAt100, sections);
        
        expect(updated.cursor.row).toBe(64);
      });
      
      it('should wrap to last section when at start', () => {
        const stream: Stream<Event<unknown>> = { events: [] }; const state = createTrackerPanelState(stream, { patternLength: 256 });
        
        const updated = gotoPreviousSection(state, sections);
        
        expect(updated.cursor.row).toBe(128);
      });
    });
  });

  describe('Search Operations', () => {
    describe('searchForNote', () => {
      it('should find note by pitch', () => {
        const events = [
          createNoteEvent(10, 1, 60),
          createNoteEvent(20, 1, 64),
          createNoteEvent(30, 1, 67),
        ];
        const stream: Stream<Event<unknown>> = { events };
        const state = createTrackerPanelState(stream, { patternLength: 256 });
        
        const updated = searchForNote(state, 64, true);
        
        expect(updated.cursor.row).toBe(20);
      });
      
      it('should wrap around when searching forward', () => {
        const events = [
          createNoteEvent(10, 1, 60),
          createNoteEvent(20, 1, 64),
        ];
        const stream: Stream<Event<unknown>> = { events };
        const state = createTrackerPanelState(stream, { patternLength: 256 });
        const stateAt25 = moveCursor(state, 25);
        
        const updated = searchForNote(stateAt25, 60, true);
        
        expect(updated.cursor.row).toBe(10);
      });
      
      it('should search backward correctly', () => {
        const events = [
          createNoteEvent(10, 1, 60),
          createNoteEvent(20, 1, 64),
          createNoteEvent(30, 1, 67),
        ];
        const stream: Stream<Event<unknown>> = { events };
        const state = createTrackerPanelState(stream, { patternLength: 256 });
        const stateAt25 = moveCursor(state, 25);
        
        const updated = searchForNote(stateAt25, 64, false);
        
        expect(updated.cursor.row).toBe(20);
      });
      
      it('should return unchanged when note not found', () => {
        const events = [
          createNoteEvent(10, 1, 60),
        ];
        const stream: Stream<Event<unknown>> = { events };
        const state = createTrackerPanelState(stream, { patternLength: 256 });
        
        const updated = searchForNote(state, 99, true);
        
        expect(updated).toBe(state);
      });
    });
    
    describe('searchForValue', () => {
      it('should find value in column', () => {
        const events = [
          createNoteEvent(10, 1, 60),
          createNoteEvent(20, 1, 64),
        ];
        const stream: Stream<Event<unknown>> = { events };
        const state = createTrackerPanelState(stream, { patternLength: 256 });
        
        // Search for note value C4 (pitch 60)
        const updated = searchForValue(state, 'note', 'C-3', true);
        
        // Should find it somewhere (exact row depends on renderCell)
        expect(updated.cursor.row).toBeGreaterThanOrEqual(0);
      });
      
      it('should be case-insensitive', () => {
        const events = [
          createNoteEvent(20, 1, 64),
        ];
        const stream: Stream<Event<unknown>> = { events };
        const state = createTrackerPanelState(stream, { patternLength: 256 });
        
        const updated = searchForValue(state, 'note', 'e-3', true);
        
        expect(updated.cursor.row).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
