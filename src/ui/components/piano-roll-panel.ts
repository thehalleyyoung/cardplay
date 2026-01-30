/**
 * @fileoverview Piano Roll Panel - Traditional DAW-style MIDI editor.
 * 
 * Provides a 2D grid interface for note editing with piano keyboard on left,
 * time grid across top, and notes as draggable rectangles.
 * 
 * @module @cardplay/ui/components/piano-roll-panel
 * @see currentsteps.md lines 2444-2463 - Piano Roll Panel requirements
 */

import type { Event } from '../../types/event';
import { generateEventId } from '../../types/event-id';
import { EventKinds } from '../../types/event-kind';
import type { Tick, TickDuration } from '../../types/primitives';
import { asTick, asTickDuration, PPQ } from '../../types/primitives';
import type { Stream } from '../../streams';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Piano keyboard configuration (left side of panel).
 */
export interface PianoKeyboard {
  /** Total width in pixels */
  readonly width: number;
  /** Height per key in pixels */
  readonly keyHeight: number;
  /** Lowest MIDI note displayed */
  readonly minPitch: number;
  /** Highest MIDI note displayed */
  readonly maxPitch: number;
  /** Whether keyboard is clickable for note preview */
  readonly clickable: boolean;
  /** Current highlighted keys (for playback visualization) */
  readonly highlightedKeys: readonly number[];
}

/**
 * Time grid configuration (horizontal axis).
 */
export interface TimeGrid {
  /** Total width in pixels */
  readonly width: number;
  /** Height in pixels */
  readonly height: number;
  /** Pixels per tick (zoom level) */
  readonly pixelsPerTick: number;
  /** Beat lines visible */
  readonly showBeats: boolean;
  /** Bar lines visible */
  readonly showBars: boolean;
  /** Grid snap setting (in ticks) */
  readonly snapTo: TickDuration;
  /** Ticks per beat */
  readonly ticksPerBeat: number;
  /** Beats per bar */
  readonly beatsPerBar: number;
}

/**
 * Note lane (horizontal row for one pitch).
 */
export interface NoteLane {
  /** MIDI pitch (0-127) */
  readonly pitch: number;
  /** Y position in pixels */
  readonly y: number;
  /** Height in pixels */
  readonly height: number;
  /** Whether this lane is for a white key */
  readonly isWhiteKey: boolean;
  /** Whether this lane is on octave boundary (C notes) */
  readonly isOctaveBoundary: boolean;
}

/**
 * Note rectangle in the piano roll.
 */
export interface NoteRect {
  /** Associated event ID */
  readonly eventId: string;
  /** MIDI pitch */
  readonly pitch: number;
  /** Start tick */
  readonly start: Tick;
  /** Duration in ticks */
  readonly duration: TickDuration;
  /** X position in pixels */
  readonly x: number;
  /** Y position in pixels */
  readonly y: number;
  /** Width in pixels */
  readonly width: number;
  /** Height in pixels */
  readonly height: number;
  /** Velocity (0-127) */
  readonly velocity: number;
  /** Whether note is selected */
  readonly selected: boolean;
  /** Whether note is being edited */
  readonly editing: boolean;
  /** Whether note is muted (excluded from playback) */
  readonly muted?: boolean;
  /** Whether note is locked (protected from editing) */
  readonly locked?: boolean;
  /** Probability of note triggering (0-1, for probabilistic sequencing) */
  readonly probability?: number;
  /** Articulation type for expression */
  readonly articulation?: ArticulationType;
  /** Expression value (0-127) for modulation preview */
  readonly expression?: number;
  /** Expression type for preview */
  readonly expressionType?: 'velocity' | 'aftertouch' | 'modwheel' | 'pitchbend';
  /** ID of note this is tied to (for legato connections) */
  readonly tiedToNoteId?: string;
  /** Whether this is a ghost note from another track */
  readonly isGhost?: boolean;
}

/**
 * Selection rectangle for note selection.
 */
export interface SelectionRect {
  /** Start X in pixels */
  readonly x: number;
  /** Start Y in pixels */
  readonly y: number;
  /** Width in pixels */
  readonly width: number;
  /** Height in pixels */
  readonly height: number;
  /** Whether selection is active */
  readonly active: boolean;
}

/**
 * Loop region overlay.
 */
export interface LoopRegion {
  /** Start tick */
  readonly start: Tick;
  /** End tick */
  readonly end: Tick;
  /** Whether loop is enabled */
  readonly enabled: boolean;
  /** Color for overlay */
  readonly color: string;
}

/**
 * Velocity lane configuration (bottom panel for velocity editing).
 * @see currentsteps.md line 2532 - Create velocity lane at bottom
 */
export interface VelocityLane {
  /** Total height in pixels */
  readonly height: number;
  /** Y position (typically below piano roll) */
  readonly y: number;
  /** Whether lane is visible */
  readonly visible: boolean;
  /** Current draw mode */
  readonly drawMode: VelocityDrawMode;
  /** Whether lane is focused for editing */
  readonly focused: boolean;
  /** Velocity bars for each note */
  readonly bars: readonly VelocityBar[];
}

/**
 * Draw mode for velocity lane editing.
 * @see currentsteps.md lines 2535-2537
 */
export type VelocityDrawMode = 'draw' | 'line' | 'curve' | 'off';

/**
 * Velocity bar representation in velocity lane.
 * @see currentsteps.md line 2533 - Implement velocity bar per note
 */
export interface VelocityBar {
  /** Associated note ID */
  readonly noteId: string;
  /** X position in pixels */
  readonly x: number;
  /** Width in pixels */
  readonly width: number;
  /** Height in pixels (proportional to velocity) */
  readonly height: number;
  /** Velocity value (0-127) */
  readonly velocity: number;
  /** Whether this bar is selected */
  readonly selected: boolean;
  /** Color for bar */
  readonly color: string;
}

/**
 * Playhead line (animated during playback).
 */
export interface Playhead {
  /** Current tick position */
  readonly tick: Tick;
  /** X position in pixels */
  readonly x: number;
  /** Whether playhead is visible */
  readonly visible: boolean;
  /** Playhead color */
  readonly color: string;
}

/**
 * Minimap overview (top right corner).
 */
export interface Minimap {
  /** Width in pixels */
  readonly width: number;
  /** Height in pixels */
  readonly height: number;
  /** Viewport rectangle within minimap */
  readonly viewport: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  /** Whether minimap is visible */
  readonly visible: boolean;
}

/**
 * Scroll state (horizontal and vertical).
 */
export interface ScrollState {
  /** Horizontal scroll in ticks */
  readonly scrollX: Tick;
  /** Vertical scroll in pitch units */
  readonly scrollY: number;
  /** Horizontal scrollbar position (0-1) */
  readonly scrollbarX: number;
  /** Vertical scrollbar position (0-1) */
  readonly scrollbarY: number;
}

/**
 * Zoom state (horizontal and vertical).
 */
export interface ZoomState {
  /** Horizontal zoom (pixels per tick) */
  readonly zoomX: number;
  /** Vertical zoom (pixels per pitch unit) */
  readonly zoomY: number;
  /** Zoom level index (for discrete zoom steps) */
  readonly zoomLevel: number;
}

/**
 * Complete piano roll panel state.
 */
export interface PianoRollState {
  /** Unique ID for this panel instance */
  readonly id: string;
  /** Event stream being edited */
  readonly events: Stream<Event<unknown>>;
  /** Piano keyboard config */
  readonly keyboard: PianoKeyboard;
  /** Time grid config */
  readonly timeGrid: TimeGrid;
  /** Note lanes (one per pitch) */
  readonly lanes: readonly NoteLane[];
  /** Note rectangles */
  readonly notes: readonly NoteRect[];
  /** Selection rectangle */
  readonly selection: SelectionRect;
  /** Loop region */
  readonly loopRegion: LoopRegion;
  /** Playhead */
  readonly playhead: Playhead;
  /** Minimap */
  readonly minimap: Minimap;
  /** Scroll state */
  readonly scroll: ScrollState;
  /** Zoom state */
  readonly zoom: ZoomState;
  /** Selected note IDs */
  readonly selectedNoteIds: readonly string[];
  /** Whether grid snap is enabled */
  readonly snapEnabled: boolean;
  /** Velocity lane (bottom panel for velocity editing) */
  readonly velocityLane: VelocityLane;
}

/**
 * Minimal config used by store adapters and lightweight renderers.
 *
 * Note: This is intentionally smaller than `PianoRollState` and exists so
 * adapters can share consistent defaults without needing a full panel state.
 */
export interface PianoRollConfig {
  readonly keyboard: PianoKeyboard;
  readonly timeGrid: TimeGrid;
  readonly velocityLane?: VelocityLane;
}

/**
 * Creates a default `PianoRollConfig` with optional overrides.
 */
export function createPianoRollConfig(overrides: Partial<PianoRollConfig> = {}): PianoRollConfig {
  const keyboard = Object.freeze({
    ...createPianoKeyboard(),
    ...(overrides.keyboard ?? {}),
  });
  const timeGrid = Object.freeze({
    ...createTimeGrid(),
    ...(overrides.timeGrid ?? {}),
  });
  const velocityLane = overrides.velocityLane ? Object.freeze({ ...overrides.velocityLane }) : createVelocityLane();
  return Object.freeze({ keyboard, timeGrid, velocityLane });
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default piano keyboard width */
export const DEFAULT_KEYBOARD_WIDTH = 80;

/** Default key height in pixels */
export const DEFAULT_KEY_HEIGHT = 12;

/** Default time grid height */
export const DEFAULT_GRID_HEIGHT = 40;

/** Default initial zoom (pixels per tick) */
export const DEFAULT_ZOOM_X = 0.5;

/** Default vertical zoom (pixels per pitch unit) */
export const DEFAULT_ZOOM_Y = DEFAULT_KEY_HEIGHT;

/** MIDI note names */
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** White key indices in octave (0=C, 2=D, 4=E, 5=F, 7=G, 9=A, 11=B) */
export const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11];

/** Default snap grid (1/16 notes = 240 ticks for 960 PPQN) */
export const DEFAULT_SNAP_TICKS = PPQ / 4;

/** Default ticks per beat (canonical PPQ=960) */
export const DEFAULT_TICKS_PER_BEAT = PPQ;

/** Default beats per bar */
export const DEFAULT_BEATS_PER_BAR = 4;

/** Minimap default width */
export const DEFAULT_MINIMAP_WIDTH = 200;

/** Minimap default height */
export const DEFAULT_MINIMAP_HEIGHT = 100;

/** Default velocity lane height in pixels */
export const DEFAULT_VELOCITY_LANE_HEIGHT = 80;

/** Minimum velocity bar height in pixels */
export const MIN_VELOCITY_BAR_HEIGHT = 2;

/** Maximum velocity (MIDI standard) */
export const MAX_VELOCITY = 127;

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a default piano keyboard configuration.
 */
export function createPianoKeyboard(): PianoKeyboard {
  return {
    width: DEFAULT_KEYBOARD_WIDTH,
    keyHeight: DEFAULT_KEY_HEIGHT,
    minPitch: 0,   // C-1
    maxPitch: 127, // G9
    clickable: true,
    highlightedKeys: []
  };
}

/**
 * Creates a default time grid configuration.
 */
export function createTimeGrid(): TimeGrid {
  return {
    width: 0, // Will be calculated based on viewport
    height: DEFAULT_GRID_HEIGHT,
    pixelsPerTick: DEFAULT_ZOOM_X,
    showBeats: true,
    showBars: true,
    snapTo: asTickDuration(DEFAULT_SNAP_TICKS),
    ticksPerBeat: DEFAULT_TICKS_PER_BEAT,
    beatsPerBar: DEFAULT_BEATS_PER_BAR
  };
}

/**
 * Creates note lanes for all MIDI pitches.
 */
export function createNoteLanes(minPitch: number, maxPitch: number, keyHeight: number): NoteLane[] {
  const lanes: NoteLane[] = [];
  for (let pitch = minPitch; pitch <= maxPitch; pitch++) {
    const y = (maxPitch - pitch) * keyHeight;
    const octaveNote = pitch % 12;
    lanes.push({
      pitch,
      y,
      height: keyHeight,
      isWhiteKey: WHITE_KEYS.includes(octaveNote),
      isOctaveBoundary: octaveNote === 0
    });
  }
  return lanes;
}

/**
 * Creates a default selection rectangle (inactive).
 */
export function createSelectionRect(): SelectionRect {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    active: false
  };
}

/**
 * Creates a default loop region (disabled).
 */
export function createLoopRegion(): LoopRegion {
  return {
    start: asTick(0),
    end: asTick(DEFAULT_TICKS_PER_BEAT * DEFAULT_BEATS_PER_BAR * 4), // 4 bars
    enabled: false,
    color: 'rgba(100, 150, 255, 0.2)'
  };
}

/**
 * Creates a default playhead.
 */
export function createPlayhead(): Playhead {
  return {
    tick: asTick(0),
    x: 0,
    visible: true,
    color: '#ff0000'
  };
}

/**
 * Creates a default minimap.
 */
export function createMinimap(): Minimap {
  return {
    width: DEFAULT_MINIMAP_WIDTH,
    height: DEFAULT_MINIMAP_HEIGHT,
    viewport: { x: 0, y: 0, width: 50, height: 50 },
    visible: true
  };
}

/**
 * Creates a default scroll state.
 */
export function createScrollState(): ScrollState {
  return {
    scrollX: asTick(0),
    scrollY: 60, // Start around middle C
    scrollbarX: 0,
    scrollbarY: 0.5
  };
}

/**
 * Creates a default zoom state.
 */
export function createZoomState(): ZoomState {
  return {
    zoomX: DEFAULT_ZOOM_X,
    zoomY: DEFAULT_ZOOM_Y,
    zoomLevel: 0
  };
}

/**
 * Creates a default velocity lane configuration.
 * @see currentsteps.md line 2532 - Create velocity lane at bottom
 */
export function createVelocityLane(
  y: number = 0,
  height: number = DEFAULT_VELOCITY_LANE_HEIGHT
): VelocityLane {
  return {
    height,
    y,
    visible: true,
    drawMode: 'off',
    focused: false,
    bars: []
  };
}

/**
 * Creates velocity bars from note rectangles.
 * @see currentsteps.md line 2533 - Implement velocity bar per note
 */
export function createVelocityBars(
  notes: readonly NoteRect[],
  laneHeight: number,
  selectedNoteIds: readonly string[] = []
): VelocityBar[] {
  return notes.map(note => {
    const barHeight = Math.max(MIN_VELOCITY_BAR_HEIGHT, (note.velocity / MAX_VELOCITY) * laneHeight);
    return {
      noteId: note.eventId,
      x: note.x,
      width: note.width,
      height: barHeight,
      velocity: note.velocity,
      selected: selectedNoteIds.includes(note.eventId),
      color: getNoteColorByVelocity(note.velocity)
    };
  });
}

/**
 * Updates velocity bars when notes change.
 */
export function updateVelocityBars(
  velocityLane: VelocityLane,
  notes: readonly NoteRect[],
  selectedNoteIds: readonly string[] = []
): VelocityLane {
  return {
    ...velocityLane,
    bars: createVelocityBars(notes, velocityLane.height, selectedNoteIds)
  };
}

/**
 * Creates a default piano roll panel state.
 */
export function createPianoRollState(id: string, events: Stream<Event<unknown>> = { events: [] }): PianoRollState {
  const keyboard = createPianoKeyboard();
  const timeGrid = createTimeGrid();
  const lanes = createNoteLanes(keyboard.minPitch, keyboard.maxPitch, keyboard.keyHeight);
  const notes: NoteRect[] = []; // Will be populated from events
  const velocityLane = createVelocityLane();
  
  return {
    id,
    events,
    keyboard,
    timeGrid,
    lanes,
    notes,
    selection: createSelectionRect(),
    loopRegion: createLoopRegion(),
    playhead: createPlayhead(),
    minimap: createMinimap(),
    scroll: createScrollState(),
    zoom: createZoomState(),
    selectedNoteIds: [],
    snapEnabled: true,
    velocityLane: updateVelocityBars(velocityLane, notes)
  };
}

// ============================================================================
// GRID CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculates pixel position for a tick value.
 */
export function tickToPixel(tick: Tick, pixelsPerTick: number): number {
  return tick * pixelsPerTick;
}

/**
 * Calculates tick value for a pixel position.
 */
export function pixelToTick(pixel: number, pixelsPerTick: number): Tick {
  return asTick(Math.floor(pixel / pixelsPerTick));
}

/**
 * Snaps a tick to the nearest grid position.
 */
export function snapTick(tick: Tick, snapTo: TickDuration): Tick {
  return asTick(Math.round(tick / snapTo) * snapTo);
}

/**
 * Calculates pixel Y position for a MIDI pitch.
 */
export function pitchToPixel(pitch: number, maxPitch: number, keyHeight: number): number {
  return (maxPitch - pitch) * keyHeight;
}

/**
 * Calculates MIDI pitch for a pixel Y position.
 */
export function pixelToPitch(pixel: number, maxPitch: number, keyHeight: number): number {
  return Math.max(0, Math.min(127, maxPitch - Math.floor(pixel / keyHeight)));
}

/**
 * Gets note name for a MIDI pitch (e.g., "C4", "A#2").
 */
export function pitchToNoteName(pitch: number): string {
  const octave = Math.floor(pitch / 12) - 1;
  const note = NOTE_NAMES[pitch % 12];
  return `${note}${octave}`;
}

/**
 * Checks if a MIDI pitch is a white key.
 */
export function isWhiteKey(pitch: number): boolean {
  return WHITE_KEYS.includes(pitch % 12);
}

/**
 * Checks if a MIDI pitch is an octave boundary (C note).
 */
export function isOctaveBoundary(pitch: number): boolean {
  return pitch % 12 === 0;
}

// ============================================================================
// ZOOM CONTROL FUNCTIONS
// ============================================================================

/**
 * Zooms in horizontally (time axis).
 */
export function zoomInX(state: PianoRollState, factor: number = 1.5): PianoRollState {
  const newZoomX = Math.min(state.zoom.zoomX * factor, 10); // Max 10 pixels per tick
  return {
    ...state,
    zoom: { ...state.zoom, zoomX: newZoomX },
    timeGrid: { ...state.timeGrid, pixelsPerTick: newZoomX }
  };
}

/**
 * Zooms out horizontally (time axis).
 */
export function zoomOutX(state: PianoRollState, factor: number = 1.5): PianoRollState {
  const newZoomX = Math.max(state.zoom.zoomX / factor, 0.05); // Min 0.05 pixels per tick
  return {
    ...state,
    zoom: { ...state.zoom, zoomX: newZoomX },
    timeGrid: { ...state.timeGrid, pixelsPerTick: newZoomX }
  };
}

/**
 * Zooms in vertically (pitch axis).
 */
export function zoomInY(state: PianoRollState, factor: number = 1.5): PianoRollState {
  const newZoomY = Math.min(state.zoom.zoomY * factor, 50); // Max 50 pixels per pitch
  return {
    ...state,
    zoom: { ...state.zoom, zoomY: newZoomY },
    keyboard: { ...state.keyboard, keyHeight: newZoomY },
    lanes: createNoteLanes(state.keyboard.minPitch, state.keyboard.maxPitch, newZoomY)
  };
}

/**
 * Zooms out vertically (pitch axis).
 */
export function zoomOutY(state: PianoRollState, factor: number = 1.5): PianoRollState {
  const newZoomY = Math.max(state.zoom.zoomY / factor, 4); // Min 4 pixels per pitch
  return {
    ...state,
    zoom: { ...state.zoom, zoomY: newZoomY },
    keyboard: { ...state.keyboard, keyHeight: newZoomY },
    lanes: createNoteLanes(state.keyboard.minPitch, state.keyboard.maxPitch, newZoomY)
  };
}

// ============================================================================
// SCROLL CONTROL FUNCTIONS
// ============================================================================

/**
 * Scrolls horizontally (time axis).
 */
export function scrollX(state: PianoRollState, delta: number): PianoRollState {
  const newScrollX = Math.max(0, state.scroll.scrollX + delta);
  return {
    ...state,
    scroll: { ...state.scroll, scrollX: asTick(newScrollX) }
  };
}

/**
 * Scrolls vertically (pitch axis).
 */
export function scrollY(state: PianoRollState, delta: number): PianoRollState {
  const newScrollY = Math.max(0, Math.min(127, state.scroll.scrollY + delta));
  return {
    ...state,
    scroll: { ...state.scroll, scrollY: newScrollY }
  };
}

/**
 * Sets scrollbar position (0-1).
 */
export function setScrollbarX(state: PianoRollState, position: number): PianoRollState {
  return {
    ...state,
    scroll: { ...state.scroll, scrollbarX: Math.max(0, Math.min(1, position)) }
  };
}

/**
 * Sets scrollbar position (0-1).
 */
export function setScrollbarY(state: PianoRollState, position: number): PianoRollState {
  return {
    ...state,
    scroll: { ...state.scroll, scrollbarY: Math.max(0, Math.min(1, position)) }
  };
}

// ============================================================================
// MINIMAP FUNCTIONS
// ============================================================================

/**
 * Updates minimap viewport based on scroll and zoom.
 */
export function updateMinimap(state: PianoRollState, viewportWidth: number, viewportHeight: number): PianoRollState {
  // Calculate viewport rectangle in minimap coordinates
  const totalTicks = 10000; // Arbitrary total for now
  const totalPitches = 128;
  
  const viewportX = (state.scroll.scrollX / totalTicks) * state.minimap.width;
  const viewportY = (state.scroll.scrollY / totalPitches) * state.minimap.height;
  const viewportW = (viewportWidth / (totalTicks * state.zoom.zoomX)) * state.minimap.width;
  const viewportH = (viewportHeight / (totalPitches * state.zoom.zoomY)) * state.minimap.height;
  
  return {
    ...state,
    minimap: {
      ...state.minimap,
      viewport: {
        x: viewportX,
        y: viewportY,
        width: viewportW,
        height: viewportH
      }
    }
  };
}

/**
 * Toggles minimap visibility.
 */
export function toggleMinimap(state: PianoRollState): PianoRollState {
  return {
    ...state,
    minimap: { ...state.minimap, visible: !state.minimap.visible }
  };
}

// ============================================================================
// PLAYHEAD FUNCTIONS
// ============================================================================

/**
 * Updates playhead position.
 */
export function updatePlayhead(state: PianoRollState, tick: Tick): PianoRollState {
  const x = tickToPixel(tick, state.zoom.zoomX);
  return {
    ...state,
    playhead: { ...state.playhead, tick, x }
  };
}

/**
 * Toggles playhead visibility.
 */
export function togglePlayhead(state: PianoRollState): PianoRollState {
  return {
    ...state,
    playhead: { ...state.playhead, visible: !state.playhead.visible }
  };
}

// ============================================================================
// LOOP REGION FUNCTIONS
// ============================================================================

/**
 * Sets loop region.
 */
export function setLoopRegion(state: PianoRollState, start: Tick, end: Tick): PianoRollState {
  return {
    ...state,
    loopRegion: { ...state.loopRegion, start, end }
  };
}

/**
 * Toggles loop region enabled/disabled.
 */
export function toggleLoopRegion(state: PianoRollState): PianoRollState {
  return {
    ...state,
    loopRegion: { ...state.loopRegion, enabled: !state.loopRegion.enabled }
  };
}

// ============================================================================
// SELECTION RECTANGLE FUNCTIONS
// ============================================================================

/**
 * Starts a selection rectangle.
 */
export function startSelection(state: PianoRollState, x: number, y: number): PianoRollState {
  return {
    ...state,
    selection: { x, y, width: 0, height: 0, active: true }
  };
}

/**
 * Updates selection rectangle size.
 */
export function updateSelection(state: PianoRollState, endX: number, endY: number): PianoRollState {
  if (!state.selection.active) return state;
  
  return {
    ...state,
    selection: {
      ...state.selection,
      width: endX - state.selection.x,
      height: endY - state.selection.y
    }
  };
}

/**
 * Ends selection and clears rectangle.
 */
export function endSelection(state: PianoRollState): PianoRollState {
  return {
    ...state,
    selection: createSelectionRect()
  };
}

// ============================================================================
// GRID SNAP FUNCTIONS
// ============================================================================

/**
 * Toggles grid snap on/off.
 */
export function toggleSnap(state: PianoRollState): PianoRollState {
  return {
    ...state,
    snapEnabled: !state.snapEnabled
  };
}

/**
 * Sets snap grid size.
 */
export function setSnapGrid(state: PianoRollState, snapTo: TickDuration): PianoRollState {
  return {
    ...state,
    timeGrid: { ...state.timeGrid, snapTo }
  };
}

// ============================================================================
// GRID STYLING FUNCTIONS
// ============================================================================

/**
 * Toggles beat lines visibility.
 */
export function toggleBeatLines(state: PianoRollState): PianoRollState {
  return {
    ...state,
    timeGrid: { ...state.timeGrid, showBeats: !state.timeGrid.showBeats }
  };
}

/**
 * Toggles bar lines visibility.
 */
export function toggleBarLines(state: PianoRollState): PianoRollState {
  return {
    ...state,
    timeGrid: { ...state.timeGrid, showBars: !state.timeGrid.showBars }
  };
}

// ============================================================================
// TIME RULER FUNCTIONS
// ============================================================================

/**
 * Gets measure number for a tick position.
 */
export function getMeasureNumber(tick: Tick, ticksPerBeat: number, beatsPerBar: number): number {
  const ticksPerBar = ticksPerBeat * beatsPerBar;
  return Math.floor(tick / ticksPerBar) + 1;
}

/**
 * Gets beat number within measure for a tick position (1-based).
 */
export function getBeatNumber(tick: Tick, ticksPerBeat: number, beatsPerBar: number): number {
  const ticksPerBar = ticksPerBeat * beatsPerBar;
  const tickInBar = tick % ticksPerBar;
  return Math.floor(tickInBar / ticksPerBeat) + 1;
}

// ============================================================================
// OCTAVE BANDS FUNCTIONS
// ============================================================================

/**
 * Gets octave number for a pitch (0-based, where octave 5 contains middle C).
 */
export function getOctave(pitch: number): number {
  return Math.floor(pitch / 12) - 1;
}

/**
 * Gets color for octave band (alternating for visual distinction).
 */
export function getOctaveColor(pitch: number, darkMode: boolean = false): string {
  const octave = getOctave(pitch);
  const isEven = octave % 2 === 0;
  
  if (darkMode) {
    return isEven ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)';
  } else {
    return isEven ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.05)';
  }
}

// ============================================================================
// BLACK/WHITE KEY DISTINCTION
// ============================================================================

/**
 * Gets background color for a piano key lane.
 */
export function getKeyLaneColor(pitch: number, darkMode: boolean = false): string {
  const isWhite = isWhiteKey(pitch);
  
  if (darkMode) {
    return isWhite ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.3)';
  } else {
    return isWhite ? 'rgba(255, 255, 255, 1.0)' : 'rgba(0, 0, 0, 0.1)';
  }
}

// ============================================================================
// NOTE RENDERING FUNCTIONS (Section 10.2)
// ============================================================================

/**
 * Note color scheme options.
 */
export type NoteColorMode = 'velocity' | 'pitch' | 'channel' | 'track' | 'default';

/**
 * Note rendering style configuration.
 */
export interface NoteRenderConfig {
  /** Color mode to use */
  readonly colorMode: NoteColorMode;
  /** Whether to show velocity bars */
  readonly showVelocityBars: boolean;
  /** Whether to show note labels */
  readonly showNoteLabels: boolean;
  /** Whether to show resize handles */
  readonly showResizeHandles: boolean;
  /** Whether dark mode is enabled */
  readonly darkMode: boolean;
}

/**
 * Creates note rectangle from event data.
 */
export function createNoteRect(
  event: Event<unknown>,
  pitch: number,
  velocity: number,
  timeGrid: TimeGrid,
  keyboard: PianoKeyboard,
  selected: boolean = false,
  editing: boolean = false
): NoteRect {
  const x = tickToPixel(event.start, timeGrid.pixelsPerTick);
  const y = pitchToPixel(pitch, keyboard.maxPitch, keyboard.keyHeight);
  const width = Math.max(1, event.duration * timeGrid.pixelsPerTick);
  const height = keyboard.keyHeight;

  return {
    eventId: event.id,
    pitch,
    start: event.start,
    duration: event.duration,
    x,
    y,
    width,
    height,
    velocity,
    selected,
    editing
  };
}

/**
 * Gets note color based on velocity (0-127 → blue to red gradient).
 */
export function getNoteColorByVelocity(velocity: number, darkMode: boolean = false): string {
  const normalized = velocity / 127;
  
  if (darkMode) {
    // Dark mode: blue (low) → cyan → yellow → red (high)
    if (normalized < 0.33) {
      const t = normalized / 0.33;
      const r = Math.floor(0 + t * 0);
      const g = Math.floor(100 + t * 155);
      const b = Math.floor(200 + t * 55);
      return `rgb(${r}, ${g}, ${b})`;
    } else if (normalized < 0.67) {
      const t = (normalized - 0.33) / 0.34;
      const r = Math.floor(0 + t * 255);
      const g = Math.floor(255);
      const b = Math.floor(255 - t * 255);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const t = (normalized - 0.67) / 0.33;
      const r = Math.floor(255);
      const g = Math.floor(255 - t * 55);
      const b = Math.floor(0);
      return `rgb(${r}, ${g}, ${b})`;
    }
  } else {
    // Light mode: softer gradient
    const r = Math.floor(50 + normalized * 150);
    const g = Math.floor(150 - normalized * 100);
    const b = Math.floor(255 - normalized * 200);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Gets note color based on pitch (rainbow spectrum across octaves).
 */
export function getNoteColorByPitch(pitch: number, darkMode: boolean = false): string {
  const octaveNote = pitch % 12;
  const hue = (octaveNote / 12) * 360; // 0-360 degree hue
  const saturation = darkMode ? '70%' : '60%';
  const lightness = darkMode ? '50%' : '65%';
  
  return `hsl(${hue}, ${saturation}, ${lightness})`;
}

/**
 * Gets note color based on MIDI channel (0-15 → 16 distinct colors).
 */
export function getNoteColorByChannel(channel: number, darkMode: boolean = false): string {
  const colors = darkMode ? [
    '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF',
    '#FF8B94', '#95E1D3', '#F38181', '#AA96DA',
    '#FCBAD3', '#A8DADC', '#F1FAEE', '#E63946',
    '#457B9D', '#1D3557', '#2A9D8F', '#E9C46A'
  ] : [
    '#E57373', '#64B5F6', '#FFD54F', '#81C784',
    '#F06292', '#4DB6AC', '#FF8A65', '#9575CD',
    '#BA68C8', '#4FC3F7', '#AED581', '#FF7043',
    '#7986CB', '#4DD0E1', '#DCE775', '#FFB74D'
  ];
  
  return colors[channel % 16] as string;
}

/**
 * Gets note color based on track number (similar to channel but for multi-track).
 */
export function getNoteColorByTrack(trackIndex: number, darkMode: boolean = false): string {
  const colors = darkMode ? [
    '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF',
    '#FF8B94', '#95E1D3', '#F38181', '#AA96DA'
  ] : [
    '#E57373', '#64B5F6', '#FFD54F', '#81C784',
    '#F06292', '#4DB6AC', '#FF8A65', '#9575CD'
  ];
  
  return colors[trackIndex % 8] as string;
}

/**
 * Gets default note color (neutral blue).
 */
export function getNoteColorDefault(darkMode: boolean = false): string {
  return darkMode ? '#5A9FD4' : '#64B5F6';
}

/**
 * Gets note color based on rendering configuration.
 */
export function getNoteColor(
  note: NoteRect,
  config: NoteRenderConfig,
  channel: number = 0,
  trackIndex: number = 0
): string {
  switch (config.colorMode) {
    case 'velocity':
      return getNoteColorByVelocity(note.velocity, config.darkMode);
    case 'pitch':
      return getNoteColorByPitch(note.pitch, config.darkMode);
    case 'channel':
      return getNoteColorByChannel(channel, config.darkMode);
    case 'track':
      return getNoteColorByTrack(trackIndex, config.darkMode);
    case 'default':
    default:
      return getNoteColorDefault(config.darkMode);
  }
}

/**
 * Gets velocity bar height for a note (0-1 range within note height).
 */
export function getVelocityBarHeight(velocity: number): number {
  return velocity / 127;
}

/**
 * Gets note label text (note name if note is wide enough).
 */
export function getNoteLabel(note: NoteRect, minWidthForLabel: number = 30): string | null {
  if (note.width < minWidthForLabel) return null;
  return pitchToNoteName(note.pitch);
}

/**
 * Gets selected note highlight style.
 */
export function getSelectedNoteStyle(darkMode: boolean = false): {
  strokeColor: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
} {
  return {
    strokeColor: darkMode ? '#FFFFFF' : '#000000',
    strokeWidth: 2,
    shadowColor: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)',
    shadowBlur: 4
  };
}

/**
 * Gets multi-selected notes styling (slightly different from single selection).
 * @see currentsteps.md line 2476 - Implement multi-selected notes styling
 */
export function getMultiSelectedNoteStyle(darkMode: boolean = false): {
  strokeColor: string;
  strokeWidth: number;
  strokeDashArray: string;
} {
  return {
    strokeColor: darkMode ? '#FFD700' : '#FFA500',
    strokeWidth: 1.5,
    strokeDashArray: '4,2'
  };
}

/**
 * Gets ghost notes styling (notes from other tracks shown as reference).
 * Ghost notes are semi-transparent and non-interactive.
 * @see currentsteps.md line 2477 - Add ghost notes from other tracks
 */
export function getGhostNoteStyle(darkMode: boolean = false): {
  opacity: number;
  strokeColor: string;
  strokeWidth: number;
  fillOpacity: number;
} {
  return {
    opacity: 0.3,
    strokeColor: darkMode ? 'rgba(150, 150, 150, 0.5)' : 'rgba(100, 100, 100, 0.5)',
    strokeWidth: 1,
    fillOpacity: 0.15
  };
}

/**
 * Gets muted note styling (notes disabled from playback).
 * @see currentsteps.md line 2478 - Create muted note styling
 */
export function getMutedNoteStyle(darkMode: boolean = false): {
  backgroundColor: string;
  opacity: number;
  crossOutColor: string;
  crossOutWidth: number;
} {
  return {
    backgroundColor: darkMode ? 'rgba(100, 100, 100, 0.4)' : 'rgba(150, 150, 150, 0.4)',
    opacity: 0.5,
    crossOutColor: darkMode ? 'rgba(255, 100, 100, 0.6)' : 'rgba(200, 50, 50, 0.6)',
    crossOutWidth: 1
  };
}

/**
 * Gets locked note styling (notes protected from editing).
 * @see currentsteps.md line 2479 - Implement locked note styling
 */
export function getLockedNoteStyle(darkMode: boolean = false): {
  borderColor: string;
  borderWidth: number;
  iconColor: string;
  iconSize: number;
} {
  return {
    borderColor: darkMode ? 'rgba(255, 200, 100, 0.8)' : 'rgba(200, 150, 50, 0.8)',
    borderWidth: 2,
    iconColor: darkMode ? '#FFD700' : '#FFA500',
    iconSize: 10
  };
}

/**
 * Gets note probability indicator styling (for probabilistic sequencing).
 * @see currentsteps.md line 2480 - Add note probability indicator
 */
export function getNoteProbabilityIndicator(
  probability: number,
  darkMode: boolean = false
): {
  barColor: string;
  barHeight: number;
  barPosition: 'top' | 'bottom';
  opacity: number;
} {
  const normalized = Math.max(0, Math.min(1, probability));
  
  return {
    barColor: darkMode 
      ? `rgba(100, ${Math.floor(150 + normalized * 105)}, 255, 0.7)`
      : `rgba(50, ${Math.floor(100 + normalized * 155)}, 255, 0.8)`,
    barHeight: 3,
    barPosition: 'top',
    opacity: 0.7 + normalized * 0.3
  };
}

/**
 * Articulation type for note expression.
 */
export type ArticulationType = 
  | 'legato' 
  | 'staccato' 
  | 'accent' 
  | 'tenuto' 
  | 'marcato' 
  | 'sforzando' 
  | 'tremolo'
  | 'trill'
  | 'glissando';

/**
 * Gets note articulation marker styling.
 * @see currentsteps.md line 2481 - Create note articulation markers
 */
export function getNoteArticulationMarker(
  articulation: ArticulationType,
  darkMode: boolean = false
): {
  symbol: string;
  color: string;
  position: 'top' | 'bottom' | 'center';
  fontSize: number;
} {
  const symbolMap: Record<ArticulationType, string> = {
    legato: '⌢',
    staccato: '•',
    accent: '>',
    tenuto: '—',
    marcato: '∧',
    sforzando: 'sf',
    tremolo: '≋',
    trill: 'tr',
    glissando: '⤢'
  };

  return {
    symbol: symbolMap[articulation],
    color: darkMode ? '#FFFFFF' : '#000000',
    position: articulation === 'legato' ? 'top' : 'bottom',
    fontSize: 10
  };
}

/**
 * Gets note expression preview styling (shows modulation/CC data).
 * @see currentsteps.md line 2482 - Implement note expression preview
 */
export function getNoteExpressionPreview(
  expressionValue: number,
  expressionType: 'velocity' | 'aftertouch' | 'modwheel' | 'pitchbend',
  darkMode: boolean = false
): {
  lineColor: string;
  lineWidth: number;
  fillColor: string;
  height: number;
} {
  const normalized = Math.max(0, Math.min(1, expressionValue / 127));
  
  const colorMap = {
    velocity: darkMode ? '#64B5F6' : '#2196F3',
    aftertouch: darkMode ? '#FFB74D' : '#FF9800',
    modwheel: darkMode ? '#81C784' : '#4CAF50',
    pitchbend: darkMode ? '#E57373' : '#F44336'
  };

  return {
    lineColor: colorMap[expressionType],
    lineWidth: 2,
    fillColor: colorMap[expressionType],
    height: normalized * 20
  };
}

/**
 * Gets tied note connector styling (connects notes that should sound as one).
 * @see currentsteps.md line 2483 - Add tied note connector
 */
export function getTiedNoteConnector(darkMode: boolean = false): {
  lineColor: string;
  lineWidth: number;
  curveHeight: number;
  dashArray: string | null;
} {
  return {
    lineColor: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
    lineWidth: 2,
    curveHeight: 8,
    dashArray: null
  };
}

/**
 * Overlap resolution strategy for overlapping notes.
 */
export type OverlapStrategy = 'stack' | 'transparent' | 'split-view' | 'highlight-conflict';

/**
 * Gets overlapping note handling configuration.
 * @see currentsteps.md line 2484 - Create overlapping note handling
 */
export function getOverlappingNoteHandling(
  strategy: OverlapStrategy,
  darkMode: boolean = false
): {
  strategy: OverlapStrategy;
  stackOffset: number;
  transparencyMultiplier: number;
  conflictHighlightColor: string;
  splitViewGap: number;
} {
  return {
    strategy,
    stackOffset: 3,
    transparencyMultiplier: 0.7,
    conflictHighlightColor: darkMode ? 'rgba(255, 100, 100, 0.5)' : 'rgba(255, 50, 50, 0.5)',
    splitViewGap: 2
  };
}

/**
 * Gets note-off indication styling (shows where note stops sounding).
 * @see currentsteps.md line 2485 - Implement note-off indication
 */
export function getNoteOffIndication(darkMode: boolean = false): {
  lineColor: string;
  lineWidth: number;
  lineDashArray: string;
  capStyle: 'round' | 'square' | 'butt';
  opacity: number;
} {
  return {
    lineColor: darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
    lineWidth: 2,
    lineDashArray: '2,3',
    capStyle: 'round',
    opacity: 0.5
  };
}

/**
 * Creates default note render configuration.
 */
export function createNoteRenderConfig(
  colorMode: NoteColorMode = 'default',
  darkMode: boolean = false
): NoteRenderConfig {
  return {
    colorMode,
    showVelocityBars: true,
    showNoteLabels: true,
    showResizeHandles: true,
    darkMode
  };
}

// ============================================================================
// NOTE EDITING FUNCTIONS (Section 10.3)
// ============================================================================

/**
 * Edit operation types for notes.
 */
export type EditOperation = 
  | 'create' 
  | 'delete' 
  | 'move' 
  | 'resize-left' 
  | 'resize-right' 
  | 'copy' 
  | 'duplicate'
  | 'select'
  | 'deselect';

/**
 * Edit context for tracking current operation.
 */
export interface EditContext {
  /** Current operation */
  readonly operation: EditOperation | null;
  /** Note being edited (if any) */
  readonly targetNoteId: string | null;
  /** Starting mouse position */
  readonly startX: number;
  readonly startY: number;
  /** Current mouse position */
  readonly currentX: number;
  readonly currentY: number;
  /** Whether shift key is held (for copy) */
  readonly shiftHeld: boolean;
  /** Whether alt key is held (for duplicate) */
  readonly altHeld: boolean;
  /** Whether ctrl/cmd key is held (for multi-select) */
  readonly ctrlHeld: boolean;
}

/**
 * Creates empty edit context.
 */
export function createEditContext(): EditContext {
  return {
    operation: null,
    targetNoteId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    shiftHeld: false,
    altHeld: false,
    ctrlHeld: false
  };
}

/**
 * Hit test regions for note editing.
 */
export type HitRegion = 'left-edge' | 'right-edge' | 'center' | 'none';

/**
 * Performs hit test on a note to determine edit region.
 */
export function hitTestNote(
  note: NoteRect,
  mouseX: number,
  mouseY: number,
  edgeThreshold: number = 5
): HitRegion {
  // Check if mouse is inside note bounds
  if (
    mouseX < note.x ||
    mouseX > note.x + note.width ||
    mouseY < note.y ||
    mouseY > note.y + note.height
  ) {
    return 'none';
  }

  // Check left edge
  if (mouseX < note.x + edgeThreshold) {
    return 'left-edge';
  }

  // Check right edge
  if (mouseX > note.x + note.width - edgeThreshold) {
    return 'right-edge';
  }

  // Center region
  return 'center';
}

/**
 * Starts a note creation operation.
 */
export function startCreateNote(
  state: PianoRollState,
  mouseX: number,
  mouseY: number
): { state: PianoRollState; context: EditContext } {
  // Calculate pitch and tick for the new note (will be used in actual creation)
  // const pitch = pixelToPitch(mouseY, state.keyboard.maxPitch, state.keyboard.keyHeight);
  // const tick = pixelToTick(mouseX, state.zoom.zoomX);
  // const snappedTick = state.snapEnabled ? snapTick(tick, state.timeGrid.snapTo) : tick;

  const context: EditContext = {
    operation: 'create',
    targetNoteId: null,
    startX: mouseX,
    startY: mouseY,
    currentX: mouseX,
    currentY: mouseY,
    shiftHeld: false,
    altHeld: false,
    ctrlHeld: false
  };

  return { state, context };
}

/**
 * Updates drag to set note duration during creation.
 */
export function updateCreateNoteDuration(
  context: EditContext,
  currentX: number
  // snapEnabled and timeGrid will be used in actual implementation
  // snapEnabled: boolean,
  // timeGrid: TimeGrid
): EditContext {
  return {
    ...context,
    currentX
  };
}

/**
 * Finds note at given position.
 */
export function findNoteAtPosition(
  notes: readonly NoteRect[],
  mouseX: number,
  mouseY: number
): NoteRect | null {
  for (let i = notes.length - 1; i >= 0; i--) {
    const note = notes[i];
    if (note &&
      mouseX >= note.x &&
      mouseX <= note.x + note.width &&
      mouseY >= note.y &&
      mouseY <= note.y + note.height
    ) {
      return note;
    }
  }
  return null;
}

/**
 * Deletes a note (double-click or delete key).
 */
export function deleteNote(state: PianoRollState, noteId: string): PianoRollState {
  return {
    ...state,
    notes: state.notes.filter(n => n.eventId !== noteId),
    selectedNoteIds: state.selectedNoteIds.filter(id => id !== noteId)
  };
}

/**
 * Toggles note selection (ctrl+click).
 */
export function toggleNoteSelection(state: PianoRollState, noteId: string): PianoRollState {
  const isSelected = state.selectedNoteIds.includes(noteId);
  
  if (isSelected) {
    return {
      ...state,
      selectedNoteIds: state.selectedNoteIds.filter(id => id !== noteId)
    };
  } else {
    return {
      ...state,
      selectedNoteIds: [...state.selectedNoteIds, noteId]
    };
  }
}

// ============================================================================
// NOTE DISPLAY HELPERS (Section 10.2 continued)
// ============================================================================

/**
 * Checks if two notes overlap in time and pitch.
 */
export function notesOverlap(note1: NoteRect, note2: NoteRect): boolean {
  if (note1.pitch !== note2.pitch) return false;
  
  const note1End = note1.start + note1.duration;
  const note2End = note2.start + note2.duration;
  
  return !(note1End <= note2.start || note2End <= note1.start);
}

/**
 * Finds all notes that overlap with a given note.
 */
export function findOverlappingNotes(
  targetNote: NoteRect,
  allNotes: readonly NoteRect[]
): NoteRect[] {
  return allNotes.filter(note => 
    note.eventId !== targetNote.eventId && notesOverlap(targetNote, note)
  );
}

/**
 * Gets the effective opacity for a note based on its properties.
 */
export function getNoteOpacity(note: NoteRect): number {
  if (note.isGhost) {
    return getGhostNoteStyle().opacity;
  }
  if (note.muted) {
    return getMutedNoteStyle().opacity;
  }
  return 1.0;
}

/**
 * Determines if a note should show articulation marker.
 */
export function shouldShowArticulationMarker(note: NoteRect): boolean {
  return note.articulation !== undefined && !note.isGhost;
}

/**
 * Determines if a note should show probability indicator.
 */
export function shouldShowProbabilityIndicator(note: NoteRect): boolean {
  return note.probability !== undefined && note.probability < 1.0 && !note.isGhost;
}

/**
 * Determines if a note should show expression preview.
 */
export function shouldShowExpressionPreview(note: NoteRect): boolean {
  return note.expression !== undefined && note.expressionType !== undefined && !note.isGhost;
}

/**
 * Determines if a note should show tied connector to another note.
 */
export function shouldShowTiedConnector(note: NoteRect): boolean {
  return note.tiedToNoteId !== undefined && !note.isGhost;
}

/**
 * Gets all visual indicators that should be rendered for a note.
 */
export function getNoteVisualIndicators(note: NoteRect): {
  showArticulation: boolean;
  showProbability: boolean;
  showExpression: boolean;
  showTiedConnector: boolean;
  showLockIcon: boolean;
  showMutedCrossOut: boolean;
} {
  return {
    showArticulation: shouldShowArticulationMarker(note),
    showProbability: shouldShowProbabilityIndicator(note),
    showExpression: shouldShowExpressionPreview(note),
    showTiedConnector: shouldShowTiedConnector(note),
    showLockIcon: note.locked === true,
    showMutedCrossOut: note.muted === true
  };
}

/**
 * Calculates the bounding box for a tied note connector curve.
 */
export function getTiedConnectorPath(
  startNote: NoteRect,
  endNote: NoteRect,
  curveHeight: number = 8
): { x1: number; y1: number; x2: number; y2: number; curveY: number } {
  const x1 = startNote.x + startNote.width;
  const y1 = startNote.y + startNote.height / 2;
  const x2 = endNote.x;
  const y2 = endNote.y + endNote.height / 2;
  const curveY = Math.min(y1, y2) - curveHeight;
  
  return { x1, y1, x2, y2, curveY };
}

/**
 * Gets the CSS filter for rendering muted notes with cross-out effect.
 */
export function getMutedNoteCSSFilter(): string {
  return 'grayscale(50%) opacity(0.5)';
}

/**
 * Gets the CSS transform for rendering ghost notes.
 */
export function getGhostNoteCSSTransform(): string {
  return 'opacity(0.3)';
}

// ============================================================================
// PIANO ROLL EVENT EDITING (Section 10.3)
// ============================================================================

/**
 * Creates a new note at the given position (click to create).
 * @see currentsteps.md line 2488 - Implement click to create note
 */
export function createNoteAtPosition(
  state: PianoRollState,
  mouseX: number,
  mouseY: number,
  defaultDuration: TickDuration = asTickDuration(384) // 1 beat default
): PianoRollState {
  const pitch = pixelToPitch(mouseY, state.keyboard.maxPitch, state.keyboard.keyHeight);
  const tick = pixelToTick(mouseX - state.keyboard.width, state.zoom.zoomX);
  const snappedTick = state.snapEnabled ? snapTick(tick, state.timeGrid.snapTo) : tick;

  // Generate unique ID for new note
  const eventId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const newNote: NoteRect = {
    eventId,
    pitch: Math.round(pitch),
    start: snappedTick,
    duration: defaultDuration,
    x: tickToPixel(snappedTick, state.zoom.zoomX),
    y: pitchToPixel(Math.round(pitch), state.keyboard.maxPitch, state.keyboard.keyHeight),
    width: defaultDuration * state.zoom.zoomX,
    height: state.keyboard.keyHeight,
    velocity: 100,
    selected: false,
    editing: false
  };

  return {
    ...state,
    notes: [...state.notes, newNote]
  };
}

/**
 * Updates note duration during drag (drag to set note duration).
 * @see currentsteps.md line 2489 - Add drag to set note duration
 */
export function updateNoteDuration(
  state: PianoRollState,
  noteId: string,
  endX: number
): PianoRollState {
  const note = state.notes.find(n => n.eventId === noteId);
  if (!note) return state;

  // endX is in grid coordinates (already offset)
  const endTick = pixelToTick(Math.max(0, endX), state.zoom.zoomX);
  const snappedEndTick = state.snapEnabled ? snapTick(endTick, state.timeGrid.snapTo) : endTick;
  
  // Calculate new duration (minimum 1 tick)
  const newDuration = Math.max(1, snappedEndTick - note.start);

  return {
    ...state,
    notes: state.notes.map(n => 
      n.eventId === noteId
        ? {
            ...n,
            duration: asTickDuration(newDuration),
            width: newDuration * state.zoom.zoomX
          }
        : n
    )
  };
}

/**
 * Deletes note on double-click.
 * @see currentsteps.md line 2490 - Create double-click to delete note
 */
export function deleteNoteOnDoubleClick(
  state: PianoRollState,
  mouseX: number,
  mouseY: number
): PianoRollState {
  const note = findNoteAtPosition(state.notes, mouseX, mouseY);
  if (!note) return state;
  
  return deleteNote(state, note.eventId);
}

/**
 * Context menu options for a note.
 * @see currentsteps.md line 2491 - Implement right-click context menu
 */
export interface NoteContextMenuOption {
  readonly label: string;
  readonly action: 'cut' | 'copy' | 'paste' | 'delete' | 'duplicate' | 'mute' | 'lock' | 'properties';
  readonly enabled: boolean;
  readonly shortcut?: string;
}

/**
 * Gets context menu options for a note at position.
 * @see currentsteps.md line 2491 - Implement right-click context menu
 */
export function getNoteContextMenu(
  state: PianoRollState,
  mouseX: number,
  mouseY: number
): NoteContextMenuOption[] | null {
  const note = findNoteAtPosition(state.notes, mouseX, mouseY);
  const hasSelection = state.selectedNoteIds.length > 0;

  const options: NoteContextMenuOption[] = [
    { label: 'Cut', action: 'cut', enabled: hasSelection, shortcut: 'Ctrl+X' },
    { label: 'Copy', action: 'copy', enabled: hasSelection, shortcut: 'Ctrl+C' },
    { label: 'Paste', action: 'paste', enabled: true, shortcut: 'Ctrl+V' },
    { label: 'Delete', action: 'delete', enabled: hasSelection, shortcut: 'Delete' },
    { label: 'Duplicate', action: 'duplicate', enabled: hasSelection, shortcut: 'Ctrl+D' }
  ];

  if (note) {
    options.push(
      { label: note.muted ? 'Unmute' : 'Mute', action: 'mute', enabled: true, shortcut: 'M' },
      { label: note.locked ? 'Unlock' : 'Lock', action: 'lock', enabled: true, shortcut: 'L' },
      { label: 'Properties...', action: 'properties', enabled: true, shortcut: 'P' }
    );
  }

  return options;
}

/**
 * Moves note by dragging (pitch/time change).
 * @see currentsteps.md line 2492 - Add drag note to move (pitch/time)
 */
export function moveNote(
  state: PianoRollState,
  noteId: string,
  deltaX: number,
  deltaY: number
): PianoRollState {
  const note = state.notes.find(n => n.eventId === noteId);
  if (!note || note.locked) return state;

  // Calculate new position
  const newTick = pixelToTick(note.x + deltaX, state.zoom.zoomX);
  const snappedTick = state.snapEnabled ? snapTick(newTick, state.timeGrid.snapTo) : newTick;
  
  const newPitch = pixelToPitch(note.y + deltaY, state.keyboard.maxPitch, state.keyboard.keyHeight);
  const clampedPitch = Math.max(0, Math.min(127, Math.round(newPitch)));

  return {
    ...state,
    notes: state.notes.map(n => 
      n.eventId === noteId
        ? {
            ...n,
            start: snappedTick,
            pitch: clampedPitch,
            x: tickToPixel(snappedTick, state.zoom.zoomX),
            y: pitchToPixel(clampedPitch, state.keyboard.maxPitch, state.keyboard.keyHeight)
          }
        : n
    )
  };
}

/**
 * Moves all selected notes together.
 * @see currentsteps.md line 2492 - Add drag note to move (pitch/time)
 */
export function moveSelectedNotes(
  state: PianoRollState,
  deltaX: number,
  deltaY: number
): PianoRollState {
  if (state.selectedNoteIds.length === 0) return state;

  const deltaTicks = Math.round(deltaX / state.zoom.zoomX);
  const deltaPitch = Math.round(-deltaY / state.keyboard.keyHeight);

  return {
    ...state,
    notes: state.notes.map(note => {
      if (!state.selectedNoteIds.includes(note.eventId) || note.locked) {
        return note;
      }

      const newStartValue = note.start + deltaTicks;
      const newStart = Math.max(0, newStartValue);
      const snappedStart = state.snapEnabled ? snapTick(asTick(newStart), state.timeGrid.snapTo) : asTick(newStart);
      
      const newPitch = Math.max(0, Math.min(127, note.pitch + deltaPitch));

      return {
        ...note,
        start: snappedStart,
        pitch: newPitch,
        x: tickToPixel(snappedStart, state.zoom.zoomX),
        y: pitchToPixel(newPitch, state.keyboard.maxPitch, state.keyboard.keyHeight)
      };
    })
  };
}

/**
 * Resizes note by dragging left or right edge.
 * @see currentsteps.md line 2493 - Create drag edge to resize
 */
export function resizeNoteEdge(
  state: PianoRollState,
  noteId: string,
  edge: 'left' | 'right',
  newX: number
): PianoRollState {
  const note = state.notes.find(n => n.eventId === noteId);
  if (!note || note.locked) return state;

  // newX is in grid coordinates (already offset)
  const newTick = pixelToTick(Math.max(0, newX), state.zoom.zoomX);
  const snappedTick = state.snapEnabled ? snapTick(newTick, state.timeGrid.snapTo) : newTick;

  if (edge === 'left') {
    // Moving start position (keep end fixed)
    const noteEnd = note.start + note.duration;
    const newStartValue = Math.min(snappedTick, noteEnd - 1); // Keep at least 1 tick duration
    const newStart = asTick(newStartValue);
    const newDuration = noteEnd - newStartValue;

    return {
      ...state,
      notes: state.notes.map(n => 
        n.eventId === noteId
          ? {
              ...n,
              start: newStart,
              duration: asTickDuration(newDuration),
              x: tickToPixel(newStart, state.zoom.zoomX),
              width: newDuration * state.zoom.zoomX
            }
          : n
      )
    };
  } else {
    // Moving end position (keep start fixed)
    const newDuration = Math.max(1, snappedTick - note.start);

    return {
      ...state,
      notes: state.notes.map(n => 
        n.eventId === noteId
          ? {
              ...n,
              duration: asTickDuration(newDuration),
              width: newDuration * state.zoom.zoomX
            }
          : n
      )
    };
  }
}

/**
 * Copies selected notes with drag (shift+drag).
 * @see currentsteps.md line 2494 - Implement shift+drag to copy
 */
export function copySelectedNotesWithDrag(
  state: PianoRollState,
  deltaX: number,
  deltaY: number
): PianoRollState {
  if (state.selectedNoteIds.length === 0) return state;

  const deltaTicks = Math.round(deltaX / state.zoom.zoomX);
  const deltaPitch = Math.round(-deltaY / state.keyboard.keyHeight);

  const copiedNotes: NoteRect[] = state.notes
    .filter(note => state.selectedNoteIds.includes(note.eventId))
    .map(note => {
      const newStartValue = Math.max(0, note.start + deltaTicks);
      const snappedStart = state.snapEnabled ? snapTick(asTick(newStartValue), state.timeGrid.snapTo) : asTick(newStartValue);
      const newPitch = Math.max(0, Math.min(127, note.pitch + deltaPitch));
      const newEventId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        ...note,
        eventId: newEventId,
        start: snappedStart,
        pitch: newPitch,
        x: tickToPixel(snappedStart, state.zoom.zoomX),
        y: pitchToPixel(newPitch, state.keyboard.maxPitch, state.keyboard.keyHeight),
        selected: true
      };
    });

  // Deselect old notes, select copied notes
  return {
    ...state,
    notes: [
      ...state.notes.map(n => ({ ...n, selected: false })),
      ...copiedNotes
    ],
    selectedNoteIds: copiedNotes.map(n => n.eventId)
  };
}

/**
 * Duplicates selected notes (alt+drag).
 * @see currentsteps.md line 2495 - Add alt+drag to duplicate
 */
export function duplicateSelectedNotes(
  state: PianoRollState,
  deltaX: number,
  deltaY: number
): PianoRollState {
  // Alt+drag is same as shift+drag copy in most DAWs
  return copySelectedNotesWithDrag(state, deltaX, deltaY);
}

/**
 * Lasso selection state.
 */
export interface LassoSelection {
  readonly active: boolean;
  readonly startX: number;
  readonly startY: number;
  readonly currentX: number;
  readonly currentY: number;
  readonly addToSelection: boolean; // true if Ctrl/Cmd held
}

/**
 * Starts lasso selection (free-form polygon selection).
 * @see currentsteps.md line 2496 - Create lasso select multiple
 */
export function startLassoSelection(
  state: PianoRollState,
  startX: number,
  startY: number,
  addToExisting: boolean = false
): { state: PianoRollState; lasso: LassoSelection } {
  const lasso: LassoSelection = {
    active: true,
    startX,
    startY,
    currentX: startX,
    currentY: startY,
    addToSelection: addToExisting
  };

  // If not adding to existing, clear selection
  const clearedState = addToExisting ? state : {
    ...state,
    selectedNoteIds: [],
    notes: state.notes.map(n => ({ ...n, selected: false }))
  };

  return { state: clearedState, lasso };
}

/**
 * Updates lasso selection area.
 * @see currentsteps.md line 2496 - Create lasso select multiple
 */
export function updateLassoSelection(
  lasso: LassoSelection,
  currentX: number,
  currentY: number
): LassoSelection {
  return {
    ...lasso,
    currentX,
    currentY
  };
}

/**
 * Completes lasso selection and selects notes within bounds.
 * @see currentsteps.md line 2496 - Create lasso select multiple
 */
export function completeLassoSelection(
  state: PianoRollState,
  lasso: LassoSelection
): PianoRollState {
  if (!lasso.active) return state;

  // Calculate bounding box
  const left = Math.min(lasso.startX, lasso.currentX);
  const right = Math.max(lasso.startX, lasso.currentX);
  const top = Math.min(lasso.startY, lasso.currentY);
  const bottom = Math.max(lasso.startY, lasso.currentY);

  // Find notes within bounds
  const selectedIds = state.notes
    .filter(note => {
      const noteRight = note.x + note.width;
      const noteBottom = note.y + note.height;
      return (
        note.x >= left && noteRight <= right &&
        note.y >= top && noteBottom <= bottom &&
        !note.locked
      );
    })
    .map(note => note.eventId);

  const finalSelectedIds = lasso.addToSelection
    ? [...new Set([...state.selectedNoteIds, ...selectedIds])]
    : selectedIds;

  return {
    ...state,
    notes: state.notes.map(n => ({
      ...n,
      selected: finalSelectedIds.includes(n.eventId)
    })),
    selectedNoteIds: finalSelectedIds
  };
}

/**
 * Starts marquee selection (rectangular drag selection).
 * @see currentsteps.md line 2497 - Implement marquee select
 */
export function startMarqueeSelection(
  state: PianoRollState,
  startX: number,
  startY: number,
  addToExisting: boolean = false
): PianoRollState {
  return {
    ...state,
    selection: {
      ...state.selection,
      active: true,
      x: startX,
      y: startY,
      width: 0,
      height: 0
    },
    // Clear selection if not adding
    selectedNoteIds: addToExisting ? state.selectedNoteIds : [],
    notes: addToExisting ? state.notes : state.notes.map(n => ({ ...n, selected: false }))
  };
}

/**
 * Updates marquee selection rectangle.
 * @see currentsteps.md line 2497 - Implement marquee select
 */
export function updateMarqueeSelection(
  state: PianoRollState,
  currentX: number,
  currentY: number
): PianoRollState {
  if (!state.selection.active) return state;

  const width = currentX - state.selection.x;
  const height = currentY - state.selection.y;

  // Normalize rectangle (handle negative width/height)
  const left = width >= 0 ? state.selection.x : currentX;
  const top = height >= 0 ? state.selection.y : currentY;
  const rectWidth = Math.abs(width);
  const rectHeight = Math.abs(height);

  // Select notes within rectangle
  const selectedIds = state.notes
    .filter(note => {
      if (note.locked) return false;
      
      const noteRight = note.x + note.width;
      const noteBottom = note.y + note.height;
      const rectRight = left + rectWidth;
      const rectBottom = top + rectHeight;
      
      // Check intersection
      return !(
        note.x > rectRight ||
        noteRight < left ||
        note.y > rectBottom ||
        noteBottom < top
      );
    })
    .map(note => note.eventId);

  return {
    ...state,
    selection: {
      ...state.selection,
      x: left,
      y: top,
      width: rectWidth,
      height: rectHeight
    },
    notes: state.notes.map(n => ({
      ...n,
      selected: selectedIds.includes(n.eventId)
    })),
    selectedNoteIds: selectedIds
  };
}

/**
 * Completes marquee selection.
 * @see currentsteps.md line 2497 - Implement marquee select
 */
export function completeMarqueeSelection(state: PianoRollState): PianoRollState {
  return {
    ...state,
    selection: {
      ...state.selection,
      active: false
    }
  };
}

// ============================================================================
// SELECTION OPERATIONS
// ============================================================================

/**
 * Toggles selection of a single note with ctrl+click.
 * @see currentsteps.md line 2498 - Add ctrl+click to toggle selection
 */
export function ctrlClickToggleSelection(state: PianoRollState, noteId: string): PianoRollState {
  return toggleNoteSelection(state, noteId);
}

/**
 * Selects all notes in the piano roll.
 * @see currentsteps.md line 2499 - Create select all notes
 */
export function selectAllNotes(state: PianoRollState): PianoRollState {
  const allNoteIds = state.notes.map(n => n.eventId);
  return {
    ...state,
    notes: state.notes.map(n => ({
      ...n,
      selected: true
    })),
    selectedNoteIds: allNoteIds
  };
}

/**
 * Selects notes within a tick range.
 * @see currentsteps.md line 2500 - Implement select notes in range
 */
export function selectNotesInRange(
  state: PianoRollState,
  startTick: Tick,
  endTick: Tick
): PianoRollState {
  const selectedIds = state.notes
    .filter(n => n.start >= startTick && n.start < endTick)
    .map(n => n.eventId);
  
  return {
    ...state,
    notes: state.notes.map(n => ({
      ...n,
      selected: selectedIds.includes(n.eventId)
    })),
    selectedNoteIds: selectedIds
  };
}

/**
 * Selects all notes with specific pitch value.
 * @see currentsteps.md line 2501 - Add select notes by pitch
 */
export function selectNotesByPitch(state: PianoRollState, pitch: number): PianoRollState {
  const selectedIds = state.notes
    .filter(n => n.pitch === pitch)
    .map(n => n.eventId);
  
  return {
    ...state,
    notes: state.notes.map(n => ({
      ...n,
      selected: selectedIds.includes(n.eventId)
    })),
    selectedNoteIds: selectedIds
  };
}

/**
 * Selects all notes within a velocity range.
 * @see currentsteps.md line 2502 - Create select notes by velocity
 */
export function selectNotesByVelocity(
  state: PianoRollState,
  minVelocity: number,
  maxVelocity: number
): PianoRollState {
  const selectedIds = state.notes
    .filter(n => n.velocity >= minVelocity && n.velocity <= maxVelocity)
    .map(n => n.eventId);
  
  return {
    ...state,
    notes: state.notes.map(n => ({
      ...n,
      selected: selectedIds.includes(n.eventId)
    })),
    selectedNoteIds: selectedIds
  };
}

/**
 * Clipboard for cut/copy/paste operations.
 */
export interface NoteClipboard {
  readonly notes: ReadonlyArray<{
    readonly pitch: number;
    readonly start: Tick;
    readonly duration: TickDuration;
    readonly velocity: number;
  }>;
  readonly referenceTime: Tick;
}

let clipboardData: NoteClipboard | null = null;

/**
 * Cuts selected notes (copies to clipboard and deletes).
 * @see currentsteps.md line 2503 - Implement cut selected notes
 */
export function cutSelectedNotes(state: PianoRollState): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  const selectedNotes = state.notes.filter(n => n.selected);
  const minStartTick = Math.min(...selectedNotes.map(n => n.start));
  
  clipboardData = {
    notes: selectedNotes.map(n => ({
      pitch: n.pitch,
      start: n.start,
      duration: n.duration,
      velocity: n.velocity
    })),
    referenceTime: asTick(minStartTick)
  };
  
  return {
    ...state,
    notes: state.notes.filter(n => !n.selected),
    selectedNoteIds: []
  };
}

/**
 * Copies selected notes to clipboard.
 * @see currentsteps.md line 2504 - Add copy selected notes
 */
export function copySelectedNotes(state: PianoRollState): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  const selectedNotes = state.notes.filter(n => n.selected);
  const minStartTick = Math.min(...selectedNotes.map(n => n.start));
  
  clipboardData = {
    notes: selectedNotes.map(n => ({
      pitch: n.pitch,
      start: n.start,
      duration: n.duration,
      velocity: n.velocity
    })),
    referenceTime: asTick(minStartTick)
  };
  
  return state;
}

/**
 * Pastes notes from clipboard at cursor position.
 * @see currentsteps.md line 2505 - Create paste notes at cursor
 */
export function pasteNotesAtCursor(
  state: PianoRollState,
  cursorTick: Tick
): PianoRollState {
  if (!clipboardData || clipboardData.notes.length === 0) {
    return state;
  }
  
  const offsetTicks = cursorTick - clipboardData.referenceTime;
  const newNotes: NoteRect[] = clipboardData.notes.map(n => {
    const newStart = asTick(n.start + offsetTicks);
    const event: Event<unknown> = {
      id: generateEventId(),
      kind: EventKinds.NOTE,
      start: newStart,
      duration: n.duration,
      payload: { pitch: n.pitch, velocity: n.velocity }
    };
    return createNoteRect(
      event,
      n.pitch,
      n.velocity,
      state.timeGrid,
      state.keyboard,
      true
    );
  });
  
  const allNotes = state.notes.map(n => ({ ...n, selected: false })).concat(newNotes);
  
  return {
    ...state,
    notes: allNotes,
    selectedNoteIds: newNotes.map(n => n.eventId)
  };
}

/**
 * Pastes notes from clipboard at their original time positions.
 * @see currentsteps.md line 2506 - Implement paste notes at original time
 */
export function pasteNotesAtOriginalTime(state: PianoRollState): PianoRollState {
  if (!clipboardData || clipboardData.notes.length === 0) {
    return state;
  }
  
  const newNotes: NoteRect[] = clipboardData.notes.map(n => {
    const event: Event<unknown> = {
      id: generateEventId(),
      kind: EventKinds.NOTE,
      start: n.start,
      duration: n.duration,
      payload: { pitch: n.pitch, velocity: n.velocity }
    };
    return createNoteRect(
      event,
      n.pitch,
      n.velocity,
      state.timeGrid,
      state.keyboard,
      true
    );
  });
  
  const allNotes = state.notes.map(n => ({ ...n, selected: false })).concat(newNotes);
  
  return {
    ...state,
    notes: allNotes,
    selectedNoteIds: newNotes.map(n => n.eventId)
  };
}

/**
 * Deletes all selected notes.
 * @see currentsteps.md line 2507 - Add delete selected notes
 */
export function deleteSelectedNotes(state: PianoRollState): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  return {
    ...state,
    notes: state.notes.filter(n => !n.selected),
    selectedNoteIds: []
  };
}

// ============================================================================
// TRANSFORM OPERATIONS
// ============================================================================

/**
 * Transposes selected notes by semitones.
 * @see currentsteps.md line 2510 - Create transpose selection by semitones
 */
export function transposeSelectionBySemitones(
  state: PianoRollState,
  semitones: number
): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  return {
    ...state,
    notes: state.notes.map(n => {
      if (!n.selected) return n;
      const newPitch = Math.max(0, Math.min(127, n.pitch + semitones));
      const newY = pitchToPixel(newPitch, state.keyboard.maxPitch, state.keyboard.keyHeight);
      return {
        ...n,
        pitch: newPitch,
        y: newY
      };
    })
  };
}

/**
 * Transposes selected notes by octave.
 * @see currentsteps.md line 2511 - Implement transpose by octave
 */
export function transposeByOctave(
  state: PianoRollState,
  octaves: number
): PianoRollState {
  return transposeSelectionBySemitones(state, octaves * 12);
}

/**
 * Quantizes note start times to grid.
 * @see currentsteps.md line 2512 - Add quantize note starts
 */
export function quantizeNoteStarts(state: PianoRollState): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  const snapTo = state.timeGrid.snapTo;
  
  return {
    ...state,
    notes: state.notes.map(n => {
      if (!n.selected) return n;
      const quantizedStart = snapTick(n.start, snapTo);
      const newX = tickToPixel(quantizedStart, state.timeGrid.pixelsPerTick);
      return {
        ...n,
        start: quantizedStart,
        x: newX
      };
    })
  };
}

/**
 * Quantizes note end times to grid.
 * @see currentsteps.md line 2513 - Create quantize note ends
 */
export function quantizeNoteEnds(state: PianoRollState): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  const snapTo = state.timeGrid.snapTo;
  
  return {
    ...state,
    notes: state.notes.map(n => {
      if (!n.selected) return n;
      const endTick = asTick(n.start + n.duration);
      const quantizedEnd = snapTick(endTick, snapTo);
      const newDuration = asTickDuration(Math.max(1, quantizedEnd - n.start));
      const newWidth = newDuration * state.timeGrid.pixelsPerTick;
      return {
        ...n,
        duration: newDuration,
        width: newWidth
      };
    })
  };
}

/**
 * Quantizes note lengths to grid increments.
 * @see currentsteps.md line 2514 - Implement quantize note lengths
 */
export function quantizeNoteLengths(state: PianoRollState): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  const snapTo = state.timeGrid.snapTo;
  
  return {
    ...state,
    notes: state.notes.map(n => {
      if (!n.selected) return n;
      const durationInGridUnits = Math.round(n.duration / snapTo);
      const newDuration = asTickDuration(Math.max(1, durationInGridUnits * snapTo));
      const newWidth = newDuration * state.timeGrid.pixelsPerTick;
      return {
        ...n,
        duration: newDuration,
        width: newWidth
      };
    })
  };
}

/**
 * Extends selected notes to touch next notes (legato).
 * @see currentsteps.md line 2515 - Add legato (extend to next)
 */
export function legatoExtend(state: PianoRollState): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  return {
    ...state,
    notes: state.notes.map(n => {
      if (!n.selected) return n;
      
      // Find next note on same pitch
      const nextNote = state.notes
        .filter(other => other.pitch === n.pitch && other.start > n.start)
        .sort((a, b) => a.start - b.start)[0];
      
      if (nextNote) {
        const newDuration = asTickDuration(nextNote.start - n.start);
        const newWidth = newDuration * state.timeGrid.pixelsPerTick;
        return {
          ...n,
          duration: newDuration,
          width: newWidth
        };
      }
      
      return n;
    })
  };
}

/**
 * Shortens selected notes (staccato).
 * @see currentsteps.md line 2516 - Create staccato (shorten)
 */
export function staccatoShorten(
  state: PianoRollState,
  factor: number = 0.5
): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  return {
    ...state,
    notes: state.notes.map(n => {
      if (!n.selected) return n;
      const newDuration = asTickDuration(Math.max(1, Math.floor(n.duration * factor)));
      const newWidth = newDuration * state.timeGrid.pixelsPerTick;
      return {
        ...n,
        duration: newDuration,
        width: newWidth
      };
    })
  };
}

/**
 * Humanizes note timing by adding random variation.
 * @see currentsteps.md line 2517 - Implement humanize timing
 */
export function humanizeTiming(
  state: PianoRollState,
  amount: number = 10
): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  return {
    ...state,
    notes: state.notes.map(n => {
      if (!n.selected) return n;
      const offset = Math.floor((Math.random() - 0.5) * 2 * amount);
      const newStart = asTick(Math.max(0, n.start + offset));
      const newX = tickToPixel(newStart, state.timeGrid.pixelsPerTick);
      return {
        ...n,
        start: newStart,
        x: newX
      };
    })
  };
}

/**
 * Humanizes note velocities by adding random variation.
 * @see currentsteps.md line 2518 - Add humanize velocity
 */
export function humanizeVelocity(
  state: PianoRollState,
  amount: number = 20
): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  return {
    ...state,
    notes: state.notes.map(n => {
      if (!n.selected) return n;
      const offset = Math.floor((Math.random() - 0.5) * 2 * amount);
      const newVelocity = Math.max(1, Math.min(127, n.velocity + offset));
      return {
        ...n,
        velocity: newVelocity
      };
    })
  };
}

/**
 * Applies linear velocity curve to selected notes.
 * @see currentsteps.md line 2519 - Create velocity curve (linear)
 */
export function velocityCurveLinear(
  state: PianoRollState,
  startVelocity: number,
  endVelocity: number
): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  const selectedNotes = state.notes.filter(n => n.selected);
  if (selectedNotes.length <= 1) {
    return state;
  }
  
  const sortedNotes = [...selectedNotes].sort((a, b) => a.start - b.start);
  const firstNote = sortedNotes[0];
  const lastNote = sortedNotes[sortedNotes.length - 1];
  
  if (!firstNote || !lastNote) {
    return state;
  }
  
  const minTime = firstNote.start;
  const maxTime = lastNote.start;
  const timeSpan = maxTime - minTime;
  
  if (timeSpan === 0) {
    return state;
  }
  
  const noteIdToVelocity = new Map<string, number>();
  
  sortedNotes.forEach(note => {
    const progress = (note.start - minTime) / timeSpan;
    const newVelocity = Math.round(startVelocity + (endVelocity - startVelocity) * progress);
    noteIdToVelocity.set(note.eventId, Math.max(1, Math.min(127, newVelocity)));
  });
  
  return {
    ...state,
    notes: state.notes.map(n => {
      const newVelocity = noteIdToVelocity.get(n.eventId);
      if (newVelocity !== undefined) {
        return {
          ...n,
          velocity: newVelocity
        };
      }
      return n;
    })
  };
}

/**
 * Applies exponential velocity curve to selected notes.
 * @see currentsteps.md line 2520 - Implement velocity curve (exponential)
 */
export function velocityCurveExponential(
  state: PianoRollState,
  startVelocity: number,
  endVelocity: number,
  exponent: number = 2.0
): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  const selectedNotes = state.notes.filter(n => n.selected);
  if (selectedNotes.length <= 1) {
    return state;
  }
  
  const sortedNotes = [...selectedNotes].sort((a, b) => a.start - b.start);
  const firstNote = sortedNotes[0];
  const lastNote = sortedNotes[sortedNotes.length - 1];
  
  if (!firstNote || !lastNote) {
    return state;
  }
  
  const minTime = firstNote.start;
  const maxTime = lastNote.start;
  const timeSpan = maxTime - minTime;
  
  if (timeSpan === 0) {
    return state;
  }
  
  const noteIdToVelocity = new Map<string, number>();
  
  sortedNotes.forEach(note => {
    const progress = (note.start - minTime) / timeSpan;
    const expProgress = Math.pow(progress, exponent);
    const newVelocity = Math.round(startVelocity + (endVelocity - startVelocity) * expProgress);
    noteIdToVelocity.set(note.eventId, Math.max(1, Math.min(127, newVelocity)));
  });
  
  return {
    ...state,
    notes: state.notes.map(n => {
      const newVelocity = noteIdToVelocity.get(n.eventId);
      if (newVelocity !== undefined) {
        return {
          ...n,
          velocity: newVelocity
        };
      }
      return n;
    })
  };
}

/**
 * Creates a velocity ramp from first to last selected note.
 * @see currentsteps.md line 2521 - Add velocity ramp
 */
export function velocityRamp(
  state: PianoRollState,
  targetVelocity: number
): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  const selectedNotes = state.notes.filter(n => n.selected);
  if (selectedNotes.length === 0) {
    return state;
  }
  
  const sortedNotes = [...selectedNotes].sort((a, b) => a.start - b.start);
  const firstNote = sortedNotes[0];
  
  if (!firstNote) {
    return state;
  }
  
  return velocityCurveLinear(state, firstNote.velocity, targetVelocity);
}

/**
 * Compresses or expands velocity range of selected notes.
 * @see currentsteps.md line 2522 - Create velocity compress/expand
 */
export function velocityCompressExpand(
  state: PianoRollState,
  factor: number
): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  const selectedNotes = state.notes.filter(n => n.selected);
  if (selectedNotes.length === 0) {
    return state;
  }
  
  const velocities = selectedNotes.map(n => n.velocity);
  const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
  
  return {
    ...state,
    notes: state.notes.map(n => {
      if (!n.selected) return n;
      const deviation = n.velocity - avgVelocity;
      const newVelocity = Math.round(avgVelocity + deviation * factor);
      return {
        ...n,
        velocity: Math.max(1, Math.min(127, newVelocity))
      };
    })
  };
}

/**
 * Time-stretches selected notes by a factor.
 * @see currentsteps.md line 2523 - Implement time stretch selection
 */
export function timeStretchSelection(
  state: PianoRollState,
  factor: number
): PianoRollState {
  if (state.selectedNoteIds.length === 0 || factor <= 0) {
    return state;
  }
  
  const selectedNotes = state.notes.filter(n => n.selected);
  if (selectedNotes.length === 0) {
    return state;
  }
  
  const sortedNotes = [...selectedNotes].sort((a, b) => a.start - b.start);
  const firstNote = sortedNotes[0];
  
  if (!firstNote) {
    return state;
  }
  
  const anchorTime = firstNote.start;
  
  return {
    ...state,
    notes: state.notes.map(n => {
      if (!n.selected) return n;
      const offset = n.start - anchorTime;
      const newStart = asTick(anchorTime + Math.round(offset * factor));
      const newDuration = asTickDuration(Math.max(1, Math.round(n.duration * factor)));
      const newX = tickToPixel(newStart, state.timeGrid.pixelsPerTick);
      const newWidth = newDuration * state.timeGrid.pixelsPerTick;
      return {
        ...n,
        start: newStart,
        duration: newDuration,
        x: newX,
        width: newWidth
      };
    })
  };
}

/**
 * Time-compresses selected notes by a factor (inverse of stretch).
 * @see currentsteps.md line 2524 - Add time compress selection
 */
export function timeCompressSelection(
  state: PianoRollState,
  factor: number
): PianoRollState {
  if (factor <= 0) {
    return state;
  }
  return timeStretchSelection(state, 1 / factor);
}

/**
 * Reverses the order of selected notes in time.
 * @see currentsteps.md line 2525 - Create reverse note order
 */
export function reverseNoteOrder(state: PianoRollState): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  const selectedNotes = state.notes.filter(n => n.selected);
  if (selectedNotes.length <= 1) {
    return state;
  }
  
  const sortedNotes = [...selectedNotes].sort((a, b) => a.start - b.start);
  const firstNote = sortedNotes[0];
  const lastNote = sortedNotes[sortedNotes.length - 1];
  
  if (!firstNote || !lastNote) {
    return state;
  }
  
  const minTime = firstNote.start;
  const maxTime = asTick(lastNote.start + lastNote.duration);
  
  const noteIdToNewStart = new Map<string, Tick>();
  
  sortedNotes.forEach(note => {
    const endTime = asTick(note.start + note.duration);
    const distanceFromStart = endTime - minTime;
    const newStart = asTick(maxTime - distanceFromStart);
    noteIdToNewStart.set(note.eventId, newStart);
  });
  
  return {
    ...state,
    notes: state.notes.map(n => {
      const newStart = noteIdToNewStart.get(n.eventId);
      if (newStart !== undefined) {
        const newX = tickToPixel(newStart, state.timeGrid.pixelsPerTick);
        return {
          ...n,
          start: newStart,
          x: newX
        };
      }
      return n;
    })
  };
}

/**
 * Inverts the pitch of selected notes around a center pitch.
 * @see currentsteps.md line 2526 - Implement invert pitch
 */
export function invertPitch(
  state: PianoRollState,
  centerPitch?: number
): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  const selectedNotes = state.notes.filter(n => n.selected);
  if (selectedNotes.length === 0) {
    return state;
  }
  
  const center = centerPitch !== undefined 
    ? centerPitch 
    : Math.round(selectedNotes.reduce((sum, n) => sum + n.pitch, 0) / selectedNotes.length);
  
  return {
    ...state,
    notes: state.notes.map(n => {
      if (!n.selected) return n;
      const distance = n.pitch - center;
      const newPitch = Math.max(0, Math.min(127, center - distance));
      const newY = pitchToPixel(newPitch, state.keyboard.maxPitch, state.keyboard.keyHeight);
      return {
        ...n,
        pitch: newPitch,
        y: newY
      };
    })
  };
}

/**
 * Mirrors selected notes in time around a center point.
 * @see currentsteps.md line 2527 - Add mirror time
 */
export function mirrorTime(
  state: PianoRollState,
  centerTime?: Tick
): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  const selectedNotes = state.notes.filter(n => n.selected);
  if (selectedNotes.length === 0) {
    return state;
  }
  
  let center: Tick;
  if (centerTime !== undefined) {
    center = centerTime;
  } else {
    const sortedNotes = [...selectedNotes].sort((a, b) => a.start - b.start);
    const firstNote = sortedNotes[0];
    const lastNote = sortedNotes[sortedNotes.length - 1];
    
    if (!firstNote || !lastNote) {
      return state;
    }
    
    const minTime = firstNote.start;
    const maxTime = asTick(lastNote.start + lastNote.duration);
    center = asTick(Math.round((minTime + maxTime) / 2));
  }
  
  return {
    ...state,
    notes: state.notes.map(n => {
      if (!n.selected) return n;
      const distance = n.start - center;
      const newStart = asTick(center - distance);
      const newX = tickToPixel(newStart, state.timeGrid.pixelsPerTick);
      return {
        ...n,
        start: newStart,
        x: newX
      };
    })
  };
}

/**
 * Splits notes at the playhead position.
 * @see currentsteps.md line 2528 - Create split notes at playhead
 */
export function splitNotesAtPlayhead(state: PianoRollState): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  const playhead = state.playhead.tick;
  
  const updatedNotes = state.notes.flatMap(n => {
    if (!n.selected) return [n];
    
    const noteEnd = asTick(n.start + n.duration);
    
    if (playhead <= n.start || playhead >= noteEnd) {
      return [n];
    }
    
    const firstDuration = asTickDuration(playhead - n.start);
    const secondDuration = asTickDuration(noteEnd - playhead);
    
    const firstNote: NoteRect = {
      ...n,
      duration: firstDuration,
      width: firstDuration * state.timeGrid.pixelsPerTick
    };
    
    const secondNote: NoteRect = {
      ...n,
      eventId: generateEventId(),
      start: playhead,
      duration: secondDuration,
      x: tickToPixel(playhead, state.timeGrid.pixelsPerTick),
      width: secondDuration * state.timeGrid.pixelsPerTick,
      selected: false
    };
    
    return [firstNote, secondNote];
  });
  
  return {
    ...state,
    notes: updatedNotes,
    selectedNoteIds: updatedNotes.filter(n => n.selected).map(n => n.eventId)
  };
}

/**
 * Joins adjacent selected notes of the same pitch into single notes.
 * @see currentsteps.md line 2529 - Implement join adjacent notes
 */
export function joinAdjacentNotes(state: PianoRollState): PianoRollState {
  if (state.selectedNoteIds.length === 0) {
    return state;
  }
  
  const selectedNotes = state.notes.filter(n => n.selected);
  if (selectedNotes.length === 0) {
    return state;
  }
  
  const notesByPitch = new Map<number, NoteRect[]>();
  selectedNotes.forEach(note => {
    const existing = notesByPitch.get(note.pitch) || [];
    existing.push(note);
    notesByPitch.set(note.pitch, existing);
  });
  
  const joinedNoteIds = new Set<string>();
  const newNotes: NoteRect[] = [];
  
  notesByPitch.forEach(notes => {
    const sorted = [...notes].sort((a, b) => a.start - b.start);
    
    let i = 0;
    while (i < sorted.length) {
      const current = sorted[i];
      if (!current) break;
      
      let endTime = asTick(current.start + current.duration);
      let maxVelocity = current.velocity;
      joinedNoteIds.add(current.eventId);
      
      let j = i + 1;
      while (j < sorted.length) {
        const next = sorted[j];
        if (!next || next.start > endTime) break;
        
        joinedNoteIds.add(next.eventId);
        maxVelocity = Math.max(maxVelocity, next.velocity);
        const nextEnd = asTick(next.start + next.duration);
        endTime = endTime > nextEnd ? endTime : nextEnd;
        j++;
      }
      
      const joinedNote: NoteRect = {
        ...current,
        duration: asTickDuration(endTime - current.start),
        width: (endTime - current.start) * state.timeGrid.pixelsPerTick,
        velocity: maxVelocity
      };
      
      newNotes.push(joinedNote);
      i = j;
    }
  });
  
  const resultNotes = state.notes.filter(n => !joinedNoteIds.has(n.eventId)).concat(newNotes);
  
  return {
    ...state,
    notes: resultNotes,
    selectedNoteIds: newNotes.map(n => n.eventId)
  };
}

// ============================================================================
// VELOCITY LANE FUNCTIONS
// ============================================================================

/**
 * Toggles velocity lane visibility.
 * @see currentsteps.md line 2532 - Create velocity lane at bottom
 */
export function toggleVelocityLane(state: PianoRollState): PianoRollState {
  return {
    ...state,
    velocityLane: {
      ...state.velocityLane,
      visible: !state.velocityLane.visible
    }
  };
}

/**
 * Sets velocity lane draw mode.
 * @see currentsteps.md lines 2535-2537 - Create velocity draw mode
 */
export function setVelocityDrawMode(
  state: PianoRollState,
  mode: VelocityDrawMode
): PianoRollState {
  return {
    ...state,
    velocityLane: {
      ...state.velocityLane,
      drawMode: mode
    }
  };
}

/**
 * Adjusts velocity of a note by dragging in velocity lane.
 * @see currentsteps.md line 2534 - Add velocity drag to adjust
 */
export function dragVelocityBar(
  state: PianoRollState,
  noteId: string,
  newVelocity: number
): PianoRollState {
  const clampedVelocity = Math.max(1, Math.min(MAX_VELOCITY, Math.round(newVelocity)));
  
  const updatedNotes = state.notes.map(note =>
    note.eventId === noteId ? { ...note, velocity: clampedVelocity } : note
  );
  
  return {
    ...state,
    notes: updatedNotes,
    velocityLane: updateVelocityBars(state.velocityLane, updatedNotes, state.selectedNoteIds)
  };
}

/**
 * Draws velocity values as a line across selected notes.
 * @see currentsteps.md line 2536 - Implement velocity line draw
 */
export function drawVelocityLine(
  state: PianoRollState,
  startVelocity: number,
  endVelocity: number
): PianoRollState {
  const selectedNotes = state.notes.filter(n => state.selectedNoteIds.includes(n.eventId));
  if (selectedNotes.length === 0) {
    return state;
  }
  
  const sortedNotes = [...selectedNotes].sort((a, b) => a.start - b.start);
  const count = sortedNotes.length;
  
  const updatedNotes = state.notes.map(note => {
    const index = sortedNotes.findIndex(n => n.eventId === note.eventId);
    if (index === -1) return note;
    
    const ratio = count === 1 ? 0 : index / (count - 1);
    const velocity = Math.round(startVelocity + (endVelocity - startVelocity) * ratio);
    const clampedVelocity = Math.max(1, Math.min(MAX_VELOCITY, velocity));
    
    return { ...note, velocity: clampedVelocity };
  });
  
  return {
    ...state,
    notes: updatedNotes,
    velocityLane: updateVelocityBars(state.velocityLane, updatedNotes, state.selectedNoteIds)
  };
}

/**
 * Draws velocity values as a curve across selected notes.
 * @see currentsteps.md line 2537 - Add velocity curve draw
 */
export function drawVelocityCurve(
  state: PianoRollState,
  startVelocity: number,
  endVelocity: number,
  curveShape: 'exponential' | 'logarithmic' | 'sine' = 'exponential'
): PianoRollState {
  const selectedNotes = state.notes.filter(n => state.selectedNoteIds.includes(n.eventId));
  if (selectedNotes.length === 0) {
    return state;
  }
  
  const sortedNotes = [...selectedNotes].sort((a, b) => a.start - b.start);
  const count = sortedNotes.length;
  
  const updatedNotes = state.notes.map(note => {
    const index = sortedNotes.findIndex(n => n.eventId === note.eventId);
    if (index === -1) return note;
    
    const ratio = count === 1 ? 0 : index / (count - 1);
    let curvedRatio = ratio;
    
    if (curveShape === 'exponential') {
      curvedRatio = ratio * ratio;
    } else if (curveShape === 'logarithmic') {
      curvedRatio = Math.sqrt(ratio);
    } else if (curveShape === 'sine') {
      curvedRatio = (1 - Math.cos(ratio * Math.PI)) / 2;
    }
    
    const velocity = Math.round(startVelocity + (endVelocity - startVelocity) * curvedRatio);
    const clampedVelocity = Math.max(1, Math.min(MAX_VELOCITY, velocity));
    
    return { ...note, velocity: clampedVelocity };
  });
  
  return {
    ...state,
    notes: updatedNotes,
    velocityLane: updateVelocityBars(state.velocityLane, updatedNotes, state.selectedNoteIds)
  };
}

/**
 * Creates a velocity ramp (linear increase or decrease).
 * @see currentsteps.md line 2538 - Create velocity ramp tool
 */
export function velocityRampTool(
  state: PianoRollState,
  direction: 'up' | 'down'
): PianoRollState {
  const startVelocity = direction === 'up' ? 1 : MAX_VELOCITY;
  const endVelocity = direction === 'up' ? MAX_VELOCITY : 1;
  return drawVelocityLine(state, startVelocity, endVelocity);
}

/**
 * Randomizes velocity values within a range.
 * @see currentsteps.md line 2539 - Implement velocity randomize
 */
export function randomizeVelocity(
  state: PianoRollState,
  minVelocity: number = 1,
  maxVelocity: number = MAX_VELOCITY,
  seed?: number
): PianoRollState {
  let random = seed !== undefined ? (() => {
    let x = seed;
    return () => {
      x = (x * 9301 + 49297) % 233280;
      return x / 233280;
    };
  })() : Math.random;
  
  const updatedNotes = state.notes.map(note => {
    if (!state.selectedNoteIds.includes(note.eventId)) return note;
    
    const range = maxVelocity - minVelocity;
    const velocity = Math.round(minVelocity + random() * range);
    const clampedVelocity = Math.max(1, Math.min(MAX_VELOCITY, velocity));
    
    return { ...note, velocity: clampedVelocity };
  });
  
  return {
    ...state,
    notes: updatedNotes,
    velocityLane: updateVelocityBars(state.velocityLane, updatedNotes, state.selectedNoteIds)
  };
}

/**
 * Scales velocity values by a factor.
 * @see currentsteps.md line 2541 - Create velocity scale
 */
export function scaleVelocity(
  state: PianoRollState,
  factor: number
): PianoRollState {
  const updatedNotes = state.notes.map(note => {
    if (!state.selectedNoteIds.includes(note.eventId)) return note;
    
    const scaled = Math.round(note.velocity * factor);
    const clampedVelocity = Math.max(1, Math.min(MAX_VELOCITY, scaled));
    
    return { ...note, velocity: clampedVelocity };
  });
  
  return {
    ...state,
    notes: updatedNotes,
    velocityLane: updateVelocityBars(state.velocityLane, updatedNotes, state.selectedNoteIds)
  };
}

/**
 * Compresses velocity range toward average.
 * @see currentsteps.md line 2542 - Implement velocity compress
 */
export function compressVelocity(
  state: PianoRollState,
  amount: number
): PianoRollState {
  const selectedNotes = state.notes.filter(n => state.selectedNoteIds.includes(n.eventId));
  if (selectedNotes.length === 0) {
    return state;
  }
  
  const avgVelocity = selectedNotes.reduce((sum, n) => sum + n.velocity, 0) / selectedNotes.length;
  
  const updatedNotes = state.notes.map(note => {
    if (!state.selectedNoteIds.includes(note.eventId)) return note;
    
    const diff = note.velocity - avgVelocity;
    const compressed = avgVelocity + diff * (1 - amount);
    const clampedVelocity = Math.max(1, Math.min(MAX_VELOCITY, Math.round(compressed)));
    
    return { ...note, velocity: clampedVelocity };
  });
  
  return {
    ...state,
    notes: updatedNotes,
    velocityLane: updateVelocityBars(state.velocityLane, updatedNotes, state.selectedNoteIds)
  };
}

/**
 * Expands velocity range from average.
 * @see currentsteps.md line 2543 - Add velocity expand
 */
export function expandVelocity(
  state: PianoRollState,
  amount: number
): PianoRollState {
  const selectedNotes = state.notes.filter(n => state.selectedNoteIds.includes(n.eventId));
  if (selectedNotes.length === 0) {
    return state;
  }
  
  const avgVelocity = selectedNotes.reduce((sum, n) => sum + n.velocity, 0) / selectedNotes.length;
  
  const updatedNotes = state.notes.map(note => {
    if (!state.selectedNoteIds.includes(note.eventId)) return note;
    
    const diff = note.velocity - avgVelocity;
    const expanded = avgVelocity + diff * (1 + amount);
    const clampedVelocity = Math.max(1, Math.min(MAX_VELOCITY, Math.round(expanded)));
    
    return { ...note, velocity: clampedVelocity };
  });
  
  return {
    ...state,
    notes: updatedNotes,
    velocityLane: updateVelocityBars(state.velocityLane, updatedNotes, state.selectedNoteIds)
  };
}

/**
 * Inverts velocity values (127 becomes 1, 1 becomes 127).
 * @see currentsteps.md line 2544 - Create velocity invert
 */
export function invertVelocity(state: PianoRollState): PianoRollState {
  const updatedNotes = state.notes.map(note => {
    if (!state.selectedNoteIds.includes(note.eventId)) return note;
    
    const inverted = MAX_VELOCITY + 1 - note.velocity;
    return { ...note, velocity: inverted };
  });
  
  return {
    ...state,
    notes: updatedNotes,
    velocityLane: updateVelocityBars(state.velocityLane, updatedNotes, state.selectedNoteIds)
  };
}

/**
 * Velocity preset type for common patterns.
 * @see currentsteps.md line 2546 - Add velocity presets
 */
export type VelocityPreset =
  | 'accent-1st'      // Accent first beat
  | 'accent-odd'      // Accent odd beats
  | 'accent-even'     // Accent even beats
  | 'crescendo'       // Gradual increase
  | 'diminuendo'      // Gradual decrease
  | 'wave'            // Sine wave pattern
  | 'alternating';    // High-low alternating

/**
 * Applies a velocity preset pattern to selected notes.
 * @see currentsteps.md line 2546 - Add velocity presets
 */
export function applyVelocityPreset(
  state: PianoRollState,
  preset: VelocityPreset
): PianoRollState {
  const selectedNotes = state.notes.filter(n => state.selectedNoteIds.includes(n.eventId));
  if (selectedNotes.length === 0) {
    return state;
  }
  
  const sortedNotes = [...selectedNotes].sort((a, b) => a.start - b.start);
  const count = sortedNotes.length;
  
  const updatedNotes = state.notes.map(note => {
    const index = sortedNotes.findIndex(n => n.eventId === note.eventId);
    if (index === -1) return note;
    
    let velocity = note.velocity;
    
    switch (preset) {
      case 'accent-1st':
        velocity = index === 0 ? MAX_VELOCITY : 80;
        break;
      case 'accent-odd':
        velocity = index % 2 === 0 ? MAX_VELOCITY : 80;
        break;
      case 'accent-even':
        velocity = index % 2 === 1 ? MAX_VELOCITY : 80;
        break;
      case 'crescendo':
        velocity = Math.round(64 + (63 * index) / (count - 1 || 1));
        break;
      case 'diminuendo':
        velocity = Math.round(MAX_VELOCITY - (63 * index) / (count - 1 || 1));
        break;
      case 'wave':
        velocity = Math.round(64 + 63 * Math.sin((index / count) * Math.PI * 2));
        break;
      case 'alternating':
        velocity = index % 2 === 0 ? MAX_VELOCITY : 64;
        break;
    }
    
    return { ...note, velocity: Math.max(1, Math.min(MAX_VELOCITY, velocity)) };
  });
  
  return {
    ...state,
    notes: updatedNotes,
    velocityLane: updateVelocityBars(state.velocityLane, updatedNotes, state.selectedNoteIds)
  };
}

/**
 * Gets velocity statistics for selected notes.
 * @see currentsteps.md line 2550 - Create velocity statistics
 */
export interface VelocityStatistics {
  readonly count: number;
  readonly min: number;
  readonly max: number;
  readonly average: number;
  readonly median: number;
  readonly stdDev: number;
}

/**
 * Calculates velocity statistics for selected notes.
 * @see currentsteps.md line 2550 - Create velocity statistics
 */
export function getVelocityStatistics(state: PianoRollState): VelocityStatistics {
  const selectedNotes = state.notes.filter(n => state.selectedNoteIds.includes(n.eventId));
  
  if (selectedNotes.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      average: 0,
      median: 0,
      stdDev: 0
    };
  }
  
  const velocities = selectedNotes.map(n => n.velocity).sort((a, b) => a - b);
  const count = velocities.length;
  const min = velocities[0] || 0;
  const max = velocities[count - 1] || 0;
  const sum = velocities.reduce((acc, v) => acc + v, 0);
  const average = sum / count;
  const median = count % 2 === 0
    ? ((velocities[count / 2 - 1] || 0) + (velocities[count / 2] || 0)) / 2
    : velocities[Math.floor(count / 2)] || 0;
  
  const variance = velocities.reduce((acc, v) => acc + Math.pow(v - average, 2), 0) / count;
  const stdDev = Math.sqrt(variance);
  
  return {
    count,
    min,
    max,
    average,
    median,
    stdDev
  };
}

/**
 * Creates a velocity histogram (count per velocity value).
 * @see currentsteps.md line 2549 - Add velocity histogram
 */
export interface VelocityHistogram {
  readonly bins: readonly { velocity: number; count: number }[];
  readonly binSize: number;
}

/**
 * Generates velocity histogram for selected notes.
 * @see currentsteps.md line 2549 - Add velocity histogram
 */
export function getVelocityHistogram(
  state: PianoRollState,
  binSize: number = 10
): VelocityHistogram {
  const selectedNotes = state.notes.filter(n => state.selectedNoteIds.includes(n.eventId));
  
  const binCount = Math.ceil(MAX_VELOCITY / binSize);
  const bins = Array.from({ length: binCount }, (_, i) => ({
    velocity: i * binSize,
    count: 0
  }));
  
  selectedNotes.forEach(note => {
    const binIndex = Math.floor(note.velocity / binSize);
    if (binIndex >= 0 && binIndex < bins.length) {
      const bin = bins[binIndex];
      if (bin) {
        bins[binIndex] = { ...bin, count: bin.count + 1 };
      }
    }
  });
  
  return { bins, binSize };
}

/**
 * Locks velocity values to prevent editing.
 * @see currentsteps.md line 2551 - Implement velocity lock
 */
export function toggleVelocityLock(
  state: PianoRollState,
  noteIds: readonly string[]
): PianoRollState {
  const updatedNotes = state.notes.map(note => {
    if (!noteIds.includes(note.eventId)) return note;
    return { ...note, locked: !note.locked };
  });
  
  return {
    ...state,
    notes: updatedNotes
  };
}

// ============================================================================
// TOOL SYSTEM (Section 10.6)
// ============================================================================

/**
 * Available editing tools for Piano Roll interaction.
 * @see currentsteps.md lines 2554-2573 - Piano Roll Tools & Modes
 */
export type PianoRollTool =
  | 'pointer'     // Select/move notes
  | 'draw'        // Draw new notes
  | 'erase'       // Delete notes
  | 'cut'         // Split notes
  | 'glue'        // Join notes
  | 'paint'       // Repeat pattern
  | 'velocity'    // Adjust velocity
  | 'mute'        // Toggle mute
  | 'zoom'        // Zoom view
  | 'pan'         // Pan/scroll view
  | 'marquee'     // Rectangle selection
  | 'lasso'       // Free-form selection
  | 'line'        // Draw line of notes
  | 'curve'       // Draw curved line of notes
  | 'scale'       // Scale assistant overlay
  | 'chord'       // Chord stamp tool
  | 'arpeggio';   // Arpeggio generator

/**
 * Input mode for note entry.
 * @see currentsteps.md lines 2571-2573 - Input modes
 */
export type InputMode =
  | 'normal'       // Mouse/click editing
  | 'step'         // Step input (keyboard advances)
  | 'realtime'     // Real-time MIDI record
  | 'overdub';     // Real-time overdub (add to existing)

/**
 * Tool state tracking cursor and mode.
 */
export interface ToolState {
  /** Currently active tool */
  readonly currentTool: PianoRollTool;
  /** Previous tool (for temporary tool switching) */
  readonly previousTool: PianoRollTool | null;
  /** Whether a tool action is in progress */
  readonly active: boolean;
  /** Tool-specific state data */
  readonly data: unknown;
}

/**
 * Implements pointer/select tool for selecting and moving notes.
 * @see currentsteps.md line 2554 - Implement pointer/select tool
 */
export function activatePointerTool(state: PianoRollState): PianoRollState & { toolState: ToolState } {
  return {
    ...state,
    toolState: {
      currentTool: 'pointer',
      previousTool: null,
      active: false,
      data: null
    }
  };
}

/**
 * Implements draw/pencil tool for creating notes by clicking/dragging.
 * @see currentsteps.md line 2555 - Add draw/pencil tool
 */
export function activateDrawTool(state: PianoRollState): PianoRollState & { toolState: ToolState } {
  return {
    ...state,
    toolState: {
      currentTool: 'draw',
      previousTool: null,
      active: false,
      data: { defaultVelocity: 100, defaultDuration: asTickDuration(480) }
    }
  };
}

/**
 * Implements erase tool for deleting notes on click.
 * @see currentsteps.md line 2556 - Create erase tool
 */
export function activateEraseTool(state: PianoRollState): PianoRollState & { toolState: ToolState } {
  return {
    ...state,
    toolState: {
      currentTool: 'erase',
      previousTool: null,
      active: false,
      data: null
    }
  };
}

/**
 * Implements cut/split tool for dividing notes at click position.
 * @see currentsteps.md line 2557 - Implement cut/split tool
 */
export function activateCutTool(state: PianoRollState): PianoRollState & { toolState: ToolState } {
  return {
    ...state,
    toolState: {
      currentTool: 'cut',
      previousTool: null,
      active: false,
      data: null
    }
  };
}

/**
 * Cuts a note at the specified tick position, creating two notes.
 * @see currentsteps.md line 2557 - Implement cut/split tool
 */
export function cutNoteAtPosition(
  state: PianoRollState,
  noteId: string,
  cutTick: Tick
): PianoRollState {
  const note = state.notes.find(n => n.eventId === noteId);
  if (!note) return state;

  const noteStartTick = note.start;
  const noteEndTick = asTick(note.start + note.duration);

  // Check if cut position is within note bounds
  if (cutTick <= noteStartTick || cutTick >= noteEndTick) {
    return state;
  }

  // Calculate durations for two resulting notes
  const firstDuration = asTickDuration(cutTick - noteStartTick);
  const secondDuration = asTickDuration(noteEndTick - cutTick);

  // Create two new notes
  const firstNote: NoteRect = {
    ...note,
    eventId: generateEventId(),
    duration: firstDuration,
    width: firstDuration * state.zoom.zoomX
  };

  const secondNote: NoteRect = {
    ...note,
    eventId: generateEventId(),
    start: cutTick,
    duration: secondDuration,
    x: cutTick * state.zoom.zoomX,
    width: secondDuration * state.zoom.zoomX
  };

  // Replace original note with two new notes
  const updatedNotes = state.notes
    .filter(n => n.eventId !== noteId)
    .concat([firstNote, secondNote])
    .sort((a, b) => a.start - b.start);

  return {
    ...state,
    notes: updatedNotes
  };
}

/**
 * Implements glue/join tool for merging adjacent notes.
 * @see currentsteps.md line 2558 - Add glue/join tool
 */
export function activateGlueTool(state: PianoRollState): PianoRollState & { toolState: ToolState } {
  return {
    ...state,
    toolState: {
      currentTool: 'glue',
      previousTool: null,
      active: false,
      data: null
    }
  };
}

/**
 * Joins two adjacent notes into a single note.
 * @see currentsteps.md line 2558 - Add glue/join tool
 */
export function joinNotes(
  state: PianoRollState,
  noteId1: string,
  noteId2: string
): PianoRollState {
  const note1 = state.notes.find(n => n.eventId === noteId1);
  const note2 = state.notes.find(n => n.eventId === noteId2);

  if (!note1 || !note2) return state;
  if (note1.pitch !== note2.pitch) return state; // Can only join notes with same pitch

  // Determine which note comes first
  const [firstNote, secondNote] = note1.start <= note2.start ? [note1, note2] : [note2, note1];

  // Check if notes are adjacent or overlapping
  const firstEnd = asTick(firstNote.start + firstNote.duration);
  const gap = secondNote.start - firstEnd;
  const maxGap = state.timeGrid.snapTo; // Allow gap up to snap resolution

  if (gap > maxGap) {
    return state; // Notes too far apart to join
  }

  // Create joined note
  const joinedNote: NoteRect = {
    ...firstNote,
    eventId: generateEventId(),
    duration: asTickDuration(secondNote.start + secondNote.duration - firstNote.start),
    width: (secondNote.start + secondNote.duration - firstNote.start) * state.zoom.zoomX,
    velocity: Math.round((firstNote.velocity + secondNote.velocity) / 2) // Average velocity
  };

  // Replace both notes with joined note
  const updatedNotes = state.notes
    .filter(n => n.eventId !== noteId1 && n.eventId !== noteId2)
    .concat([joinedNote])
    .sort((a, b) => a.start - b.start);

  return {
    ...state,
    notes: updatedNotes
  };
}

/**
 * Implements paint brush tool for repeating note patterns.
 * @see currentsteps.md line 2559 - Create paint brush (repetition)
 */
export function activatePaintTool(state: PianoRollState): PianoRollState & { toolState: ToolState } {
  return {
    ...state,
    toolState: {
      currentTool: 'paint',
      previousTool: null,
      active: false,
      data: { pattern: [], repeatInterval: asTickDuration(1920) } // Default: repeat every bar
    }
  };
}

/**
 * Captures selected notes as a pattern for paint tool.
 */
export function capturePaintPattern(state: PianoRollState): PianoRollState & { toolState: ToolState } {
  const selectedNotes = state.notes.filter(n => state.selectedNoteIds.includes(n.eventId));
  
  if (selectedNotes.length === 0) {
    return state as PianoRollState & { toolState: ToolState };
  }

  const minStart = Math.min(...selectedNotes.map(n => n.start));
  const pattern = selectedNotes.map(note => ({
    pitchOffset: note.pitch,
    timeOffset: asTickDuration(note.start - minStart),
    duration: note.duration,
    velocity: note.velocity
  }));

  return {
    ...state,
    toolState: {
      currentTool: 'paint',
      previousTool: null,
      active: false,
      data: { pattern, repeatInterval: asTickDuration(1920) }
    }
  };
}

/**
 * Paints captured pattern at specified start tick.
 */
export function paintPattern(
  state: PianoRollState,
  startTick: Tick,
  repetitions: number = 1
): PianoRollState {
  const toolState = (state as PianoRollState & { toolState: ToolState }).toolState;
  if (!toolState || toolState.currentTool !== 'paint') return state;

  const data = toolState.data as { pattern: Array<{
    pitchOffset: number;
    timeOffset: TickDuration;
    duration: TickDuration;
    velocity: number;
  }>; repeatInterval: TickDuration };

  if (!data.pattern || data.pattern.length === 0) return state;

  const newNotes: NoteRect[] = [];
  
  for (let rep = 0; rep < repetitions; rep++) {
    const repStartTick = asTick(startTick + rep * data.repeatInterval);
    
    data.pattern.forEach(noteTemplate => {
      const noteTick = asTick(repStartTick + noteTemplate.timeOffset);
      const noteX = noteTick * state.zoom.zoomX;
      const noteY = (state.keyboard.maxPitch - noteTemplate.pitchOffset) * state.keyboard.keyHeight;

      newNotes.push({
        eventId: generateEventId(),
        pitch: noteTemplate.pitchOffset,
        start: noteTick,
        duration: noteTemplate.duration,
        x: noteX,
        y: noteY,
        width: noteTemplate.duration * state.zoom.zoomX,
        height: state.keyboard.keyHeight,
        velocity: noteTemplate.velocity,
        selected: false,
        editing: false
      });
    });
  }

  return {
    ...state,
    notes: [...state.notes, ...newNotes].sort((a, b) => a.start - b.start)
  };
}

/**
 * Implements velocity tool for adjusting note velocity by clicking.
 * @see currentsteps.md line 2560 - Implement velocity tool
 */
export function activateVelocityTool(state: PianoRollState): PianoRollState & { toolState: ToolState } {
  return {
    ...state,
    toolState: {
      currentTool: 'velocity',
      previousTool: null,
      active: false,
      data: null
    }
  };
}

/**
 * Sets velocity of note by vertical drag position (0 at bottom, 127 at top).
 */
export function setNoteVelocityByDrag(
  state: PianoRollState,
  noteId: string,
  dragY: number,
  laneHeight: number
): PianoRollState {
  const note = state.notes.find(n => n.eventId === noteId);
  if (!note) return state;

  // Convert drag Y position to velocity (inverted: top = 127, bottom = 0)
  const velocity = Math.max(0, Math.min(127, Math.round((1 - dragY / laneHeight) * 127)));

  const updatedNotes = state.notes.map(n =>
    n.eventId === noteId ? { ...n, velocity } : n
  );

  return {
    ...state,
    notes: updatedNotes
  };
}

/**
 * Implements mute tool for toggling note mute state.
 * @see currentsteps.md line 2561 - Add mute tool
 */
export function activateMuteTool(state: PianoRollState): PianoRollState & { toolState: ToolState } {
  return {
    ...state,
    toolState: {
      currentTool: 'mute',
      previousTool: null,
      active: false,
      data: null
    }
  };
}

/**
 * Toggles mute state of specified note.
 */
export function toggleNoteMute(
  state: PianoRollState,
  noteId: string
): PianoRollState {
  const updatedNotes = state.notes.map(note =>
    note.eventId === noteId ? { ...note, muted: !note.muted } : note
  );

  return {
    ...state,
    notes: updatedNotes
  };
}

/**
 * Toggles mute state of all selected notes.
 */
export function toggleSelectedNotesMute(state: PianoRollState): PianoRollState {
  const updatedNotes = state.notes.map(note =>
    state.selectedNoteIds.includes(note.eventId) ? { ...note, muted: !note.muted } : note
  );

  return {
    ...state,
    notes: updatedNotes
  };
}

/**
 * Implements zoom tool for click-drag zoom rectangle.
 * @see currentsteps.md line 2562 - Create zoom tool
 */
export function activateZoomTool(state: PianoRollState): PianoRollState & { toolState: ToolState } {
  return {
    ...state,
    toolState: {
      currentTool: 'zoom',
      previousTool: null,
      active: false,
      data: null
    }
  };
}

/**
 * Zooms to fit the specified rectangle in pixels.
 */
export function zoomToRect(
  state: PianoRollState,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number,
  viewportWidth: number,
  viewportHeight: number
): PianoRollState {
  // Calculate new zoom levels to fit rectangle in viewport
  const newZoomX = viewportWidth / (rectWidth / state.zoom.zoomX);
  const newZoomY = viewportHeight / (rectHeight / state.zoom.zoomY);

  // Calculate new scroll position to center the rectangle
  const centerTick = asTick(rectX / state.zoom.zoomX + (rectWidth / state.zoom.zoomX) / 2);
  const centerPitch = state.keyboard.maxPitch - (rectY / state.zoom.zoomY + (rectHeight / state.zoom.zoomY) / 2);

  return {
    ...state,
    zoom: {
      ...state.zoom,
      zoomX: newZoomX,
      zoomY: newZoomY
    },
    scroll: {
      ...state.scroll,
      scrollX: asTick(centerTick - viewportWidth / (2 * newZoomX)),
      scrollY: centerPitch - viewportHeight / (2 * newZoomY)
    }
  };
}

/**
 * Implements pan/scroll tool for dragging viewport.
 * @see currentsteps.md line 2563 - Implement pan/scroll tool
 */
export function activatePanTool(state: PianoRollState): PianoRollState & { toolState: ToolState } {
  return {
    ...state,
    toolState: {
      currentTool: 'pan',
      previousTool: null,
      active: false,
      data: null
    }
  };
}

/**
 * Pans viewport by pixel delta.
 */
export function panViewport(
  state: PianoRollState,
  deltaX: number,
  deltaY: number
): PianoRollState {
  const newScrollX = asTick(Math.max(0, state.scroll.scrollX - deltaX / state.zoom.zoomX));
  const newScrollY = Math.max(0, Math.min(
    state.keyboard.maxPitch - state.keyboard.minPitch,
    state.scroll.scrollY - deltaY / state.zoom.zoomY
  ));

  return {
    ...state,
    scroll: {
      ...state.scroll,
      scrollX: newScrollX,
      scrollY: newScrollY
    }
  };
}

/**
 * Switches to temporary tool (e.g., space bar for pan).
 */
export function activateTemporaryTool(
  state: PianoRollState & { toolState: ToolState },
  tool: PianoRollTool
): PianoRollState & { toolState: ToolState } {
  return {
    ...state,
    toolState: {
      ...state.toolState,
      previousTool: state.toolState.currentTool,
      currentTool: tool
    }
  };
}

/**
 * Returns to previous tool after temporary tool use.
 */
export function deactivateTemporaryTool(
  state: PianoRollState & { toolState: ToolState }
): PianoRollState & { toolState: ToolState } {
  if (!state.toolState.previousTool) return state;

  return {
    ...state,
    toolState: {
      ...state.toolState,
      currentTool: state.toolState.previousTool,
      previousTool: null
    }
  };
}

// ============================================================================
// ADDITIONAL TOOLS & INPUT MODES (Section 10.6 continued)
// ============================================================================

/**
 * Activates marquee tool for rectangular selection.
 * @see currentsteps.md line 2564 - Add marquee tool
 */
export function activateMarqueeTool(state: PianoRollState): PianoRollState & { toolState: ToolState } {
  return {
    ...state,
    toolState: {
      currentTool: 'marquee',
      previousTool: null,
      active: false,
      data: null
    }
  };
}

/**
 * Activates lasso tool for free-form selection.
 * @see currentsteps.md line 2565 - Create lasso tool
 */
export function activateLassoTool(state: PianoRollState): PianoRollState & { toolState: ToolState } {
  return {
    ...state,
    toolState: {
      currentTool: 'lasso',
      previousTool: null,
      active: false,
      data: null
    }
  };
}

/**
 * Activates line tool for drawing a line of notes.
 * @see currentsteps.md line 2566 - Implement line tool
 */
export function activateLineTool(state: PianoRollState): PianoRollState & { toolState: ToolState } {
  return {
    ...state,
    toolState: {
      currentTool: 'line',
      previousTool: null,
      active: false,
      data: null
    }
  };
}

/**
 * Line drawing tool: draws a line of notes from start to end position.
 * @see currentsteps.md line 2566 - Implement line tool
 */
export function drawNoteLine(
  state: PianoRollState,
  startTick: Tick,
  startPitch: number,
  endTick: Tick,
  endPitch: number,
  noteCount: number,
  noteDuration: TickDuration = asTickDuration(240)
): PianoRollState {
  const newNotes: NoteRect[] = [];
  const tickRange = endTick - startTick;
  const pitchRange = endPitch - startPitch;

  for (let i = 0; i < noteCount; i++) {
    const t = i / (noteCount - 1 || 1);
    const tick = asTick(Math.round(startTick + tickRange * t));
    const pitch = Math.round(startPitch + pitchRange * t);
    const x = tick * state.zoom.zoomX;
    const y = (state.keyboard.maxPitch - pitch) * state.keyboard.keyHeight;

    newNotes.push({
      eventId: generateEventId(),
      pitch,
      start: tick,
      duration: noteDuration,
      x,
      y,
      width: noteDuration * state.zoom.zoomX,
      height: state.keyboard.keyHeight,
      velocity: 100,
      selected: false,
      editing: false
    });
  }

  return {
    ...state,
    notes: [...state.notes, ...newNotes].sort((a, b) => a.start - b.start)
  };
}

/**
 * Activates curve tool for drawing curved lines of notes.
 * @see currentsteps.md line 2567 - Add curve tool
 */
export function activateCurveTool(state: PianoRollState): PianoRollState & { toolState: ToolState } {
  return {
    ...state,
    toolState: {
      currentTool: 'curve',
      previousTool: null,
      active: false,
      data: null
    }
  };
}

/**
 * Calculates Catmull-Rom spline interpolation.
 */
function catmullRomInterpolate(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  const t2 = t * t;
  const t3 = t2 * t;
  
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

/**
 * Draws a curve of notes through control points using spline interpolation.
 * @see currentsteps.md line 2567 - Add curve tool
 */
export function drawNoteCurve(
  state: PianoRollState,
  controlPoints: Array<{ tick: Tick; pitch: number }>,
  noteCount: number,
  noteDuration: TickDuration = asTickDuration(240)
): PianoRollState {
  if (controlPoints.length < 2) return state;

  const newNotes: NoteRect[] = [];
  const startTick = controlPoints[0]!.tick;
  const endTick = controlPoints[controlPoints.length - 1]!.tick;
  const tickRange = endTick - startTick;

  for (let i = 0; i < noteCount; i++) {
    const t = i / (noteCount - 1 || 1);
    const targetTick = asTick(Math.round(startTick + tickRange * t));

    let segmentIndex = 0;
    for (let j = 0; j < controlPoints.length - 1; j++) {
      const cp = controlPoints[j];
      const cpNext = controlPoints[j + 1];
      if (cp && cpNext && targetTick >= cp.tick && targetTick <= cpNext.tick) {
        segmentIndex = j;
        break;
      }
    }

    const cp0 = controlPoints[Math.max(0, segmentIndex - 1)]!;
    const cp1 = controlPoints[segmentIndex]!;
    const cp2 = controlPoints[Math.min(controlPoints.length - 1, segmentIndex + 1)]!;
    const cp3 = controlPoints[Math.min(controlPoints.length - 1, segmentIndex + 2)]!;

    const segmentT = cp2.tick !== cp1.tick
      ? (targetTick - cp1.tick) / (cp2.tick - cp1.tick)
      : 0;

    const tick = asTick(Math.round(catmullRomInterpolate(cp0.tick, cp1.tick, cp2.tick, cp3.tick, segmentT)));
    const pitch = Math.round(catmullRomInterpolate(cp0.pitch, cp1.pitch, cp2.pitch, cp3.pitch, segmentT));

    const x = tick * state.zoom.zoomX;
    const y = (state.keyboard.maxPitch - pitch) * state.keyboard.keyHeight;

    newNotes.push({
      eventId: generateEventId(),
      pitch,
      start: tick,
      duration: noteDuration,
      x,
      y,
      width: noteDuration * state.zoom.zoomX,
      height: state.keyboard.keyHeight,
      velocity: 100,
      selected: false,
      editing: false
    });
  }

  return {
    ...state,
    notes: [...state.notes, ...newNotes].sort((a, b) => a.start - b.start)
  };
}

/**
 * Scale assistant overlay configuration.
 * @see currentsteps.md line 2568 - Create scale assistant overlay
 */
export interface ScaleAssistant {
  enabled: boolean;
  root: number;
  scale: number[];
  highlightColor: string;
  dimColor: string;
}

/**
 * Creates scale assistant for highlighting scale notes.
 */
export function createScaleAssistant(
  root: number,
  scale: number[]
): ScaleAssistant {
  return {
    enabled: true,
    root,
    scale,
    highlightColor: 'rgba(100, 200, 100, 0.3)',
    dimColor: 'rgba(50, 50, 50, 0.2)'
  };
}

/**
 * Checks if pitch is in the scale.
 */
export function isPitchInScale(pitch: number, assistant: ScaleAssistant): boolean {
  const pitchClass = (pitch - assistant.root) % 12;
  return assistant.scale.includes((pitchClass + 12) % 12);
}

/**
 * Chord stamp tool configuration.
 * @see currentsteps.md line 2569 - Implement chord stamp tool
 */
export interface ChordStamp {
  rootPitch: number;
  intervals: number[];
  velocity: number;
  duration: TickDuration;
  voicing: 'close' | 'open' | 'drop2' | 'drop3';
}

/**
 * Common chord stamps.
 */
export const CHORD_STAMPS = {
  majorTriad: { intervals: [0, 4, 7], voicing: 'close' as const },
  minorTriad: { intervals: [0, 3, 7], voicing: 'close' as const },
  major7: { intervals: [0, 4, 7, 11], voicing: 'close' as const },
  minor7: { intervals: [0, 3, 7, 10], voicing: 'close' as const },
  dominant7: { intervals: [0, 4, 7, 10], voicing: 'close' as const },
  diminished7: { intervals: [0, 3, 6, 9], voicing: 'close' as const },
  augmented: { intervals: [0, 4, 8], voicing: 'close' as const },
  sus4: { intervals: [0, 5, 7], voicing: 'close' as const },
  sus2: { intervals: [0, 2, 7], voicing: 'close' as const }
};

/**
 * Stamps a chord at the specified tick and root pitch.
 */
export function stampChord(
  state: PianoRollState,
  tick: Tick,
  rootPitch: number,
  stamp: ChordStamp
): PianoRollState {
  const newNotes: NoteRect[] = stamp.intervals.map(interval => {
    const pitch = rootPitch + interval;
    const x = tick * state.zoom.zoomX;
    const y = (state.keyboard.maxPitch - pitch) * state.keyboard.keyHeight;

    return {
      eventId: generateEventId(),
      pitch,
      start: tick,
      duration: stamp.duration,
      x,
      y,
      width: stamp.duration * state.zoom.zoomX,
      height: state.keyboard.keyHeight,
      velocity: stamp.velocity,
      selected: false,
      editing: false
    };
  });

  return {
    ...state,
    notes: [...state.notes, ...newNotes].sort((a, b) => a.start - b.start)
  };
}

/**
 * Arpeggio generator configuration.
 * @see currentsteps.md line 2570 - Add arpeggio generator
 */
export interface ArpeggioPattern {
  pattern: 'up' | 'down' | 'updown' | 'downup' | 'random';
  octaves: number;
  noteCount: number;
  duration: TickDuration;
  velocity: number;
}

/**
 * Generates an arpeggio from selected notes.
 */
export function generateArpeggio(
  state: PianoRollState,
  startTick: Tick,
  basePitches: number[],
  config: ArpeggioPattern
): PianoRollState {
  if (basePitches.length === 0) return state;

  const fullPitches: number[] = [];
  for (let octave = 0; octave < config.octaves; octave++) {
    basePitches.forEach(pitch => {
      fullPitches.push(pitch + octave * 12);
    });
  }

  let arpeggioSequence: number[] = [];
  switch (config.pattern) {
    case 'up':
      arpeggioSequence = fullPitches.slice(0, config.noteCount);
      break;
    case 'down':
      arpeggioSequence = fullPitches.slice().reverse().slice(0, config.noteCount);
      break;
    case 'updown':
      arpeggioSequence = [...fullPitches, ...fullPitches.slice().reverse().slice(1, -1)].slice(0, config.noteCount);
      break;
    case 'downup':
      arpeggioSequence = [...fullPitches.slice().reverse(), ...fullPitches.slice(1, -1)].slice(0, config.noteCount);
      break;
    case 'random':
      arpeggioSequence = Array.from({ length: config.noteCount }, () =>
        fullPitches[Math.floor(Math.random() * fullPitches.length)]!
      );
      break;
  }

  const newNotes: NoteRect[] = arpeggioSequence.map((pitch, index) => {
    const tick = asTick(startTick + index * config.duration);
    const x = tick * state.zoom.zoomX;
    const y = (state.keyboard.maxPitch - pitch) * state.keyboard.keyHeight;

    return {
      eventId: generateEventId(),
      pitch,
      start: tick,
      duration: config.duration,
      x,
      y,
      width: config.duration * state.zoom.zoomX,
      height: state.keyboard.keyHeight,
      velocity: config.velocity,
      selected: false,
      editing: false
    };
  });

  return {
    ...state,
    notes: [...state.notes, ...newNotes].sort((a, b) => a.start - b.start)
  };
}

/**
 * Step input mode state.
 * @see currentsteps.md line 2571 - Create step input mode
 */
export interface StepInputState {
  enabled: boolean;
  currentTick: Tick;
  defaultDuration: TickDuration;
  advanceOnInput: boolean;
  quantizeInput: boolean;
}

/**
 * Enables step input mode.
 */
export function enableStepInput(
  state: PianoRollState,
  startTick: Tick,
  defaultDuration: TickDuration
): PianoRollState & { stepInput: StepInputState } {
  return {
    ...state,
    stepInput: {
      enabled: true,
      currentTick: startTick,
      defaultDuration,
      advanceOnInput: true,
      quantizeInput: true
    }
  };
}

/**
 * Adds note in step input mode and advances cursor.
 */
export function stepInputNote(
  state: PianoRollState & { stepInput: StepInputState },
  pitch: number,
  velocity: number = 100
): PianoRollState & { stepInput: StepInputState } {
  const { currentTick, defaultDuration } = state.stepInput;
  
  const x = currentTick * state.zoom.zoomX;
  const y = (state.keyboard.maxPitch - pitch) * state.keyboard.keyHeight;

  const newNote: NoteRect = {
    eventId: generateEventId(),
    pitch,
    start: currentTick,
    duration: defaultDuration,
    x,
    y,
    width: defaultDuration * state.zoom.zoomX,
    height: state.keyboard.keyHeight,
    velocity,
    selected: false,
    editing: false
  };

  const nextTick = state.stepInput.advanceOnInput
    ? asTick(currentTick + defaultDuration)
    : currentTick;

  return {
    ...state,
    notes: [...state.notes, newNote].sort((a, b) => a.start - b.start),
    stepInput: {
      ...state.stepInput,
      currentTick: nextTick
    }
  };
}

/**
 * Real-time record mode state.
 * @see currentsteps.md line 2572 - Implement real-time record mode
 */
export interface RealtimeRecordState {
  enabled: boolean;
  recording: boolean;
  startTick: Tick;
  mode: 'replace' | 'overdub';
  quantizeInput: boolean;
  quantizeAmount: TickDuration;
  activeNotes: Map<number, { noteId: string; startTick: Tick }>;
}

/**
 * Starts real-time recording.
 */
export function startRealtimeRecord(
  state: PianoRollState,
  startTick: Tick,
  mode: 'replace' | 'overdub' = 'replace'
): PianoRollState & { realtimeRecord: RealtimeRecordState } {
  const notesToKeep = mode === 'overdub' ? state.notes : [];

  return {
    ...state,
    notes: notesToKeep,
    realtimeRecord: {
      enabled: true,
      recording: true,
      startTick,
      mode,
      quantizeInput: true,
      quantizeAmount: asTickDuration(120),
      activeNotes: new Map()
    }
  };
}

/**
 * Handles note-on event during real-time recording.
 */
export function realtimeNoteOn(
  state: PianoRollState & { realtimeRecord: RealtimeRecordState },
  pitch: number,
  _velocity: number, // Reserved for future use (velocity-sensitive recording)
  currentTick: Tick
): PianoRollState & { realtimeRecord: RealtimeRecordState } {
  const noteId = generateEventId();
  const tick = state.realtimeRecord.quantizeInput
    ? quantizeTick(currentTick, state.realtimeRecord.quantizeAmount)
    : currentTick;

  const updatedActiveNotes = new Map(state.realtimeRecord.activeNotes);
  updatedActiveNotes.set(pitch, { noteId, startTick: tick });

  return {
    ...state,
    realtimeRecord: {
      ...state.realtimeRecord,
      activeNotes: updatedActiveNotes
    }
  };
}

/**
 * Handles note-off event during real-time recording.
 */
export function realtimeNoteOff(
  state: PianoRollState & { realtimeRecord: RealtimeRecordState },
  pitch: number,
  currentTick: Tick
): PianoRollState & { realtimeRecord: RealtimeRecordState } {
  const activeNote = state.realtimeRecord.activeNotes.get(pitch);
  if (!activeNote) return state;

  const endTick = state.realtimeRecord.quantizeInput
    ? quantizeTick(currentTick, state.realtimeRecord.quantizeAmount)
    : currentTick;

  const duration = asTickDuration(Math.max(state.realtimeRecord.quantizeAmount, endTick - activeNote.startTick));
  const x = activeNote.startTick * state.zoom.zoomX;
  const y = (state.keyboard.maxPitch - pitch) * state.keyboard.keyHeight;

  const newNote: NoteRect = {
    eventId: activeNote.noteId,
    pitch,
    start: activeNote.startTick,
    duration,
    x,
    y,
    width: duration * state.zoom.zoomX,
    height: state.keyboard.keyHeight,
    velocity: 100,
    selected: false,
    editing: false
  };

  const updatedActiveNotes = new Map(state.realtimeRecord.activeNotes);
  updatedActiveNotes.delete(pitch);

  return {
    ...state,
    notes: [...state.notes, newNote].sort((a, b) => a.start - b.start),
    realtimeRecord: {
      ...state.realtimeRecord,
      activeNotes: updatedActiveNotes
    }
  };
}

/**
 * Stops real-time recording.
 */
export function stopRealtimeRecord(
  state: PianoRollState & { realtimeRecord: RealtimeRecordState }
): PianoRollState {
  // Remove realtimeRecord property to return to normal state
  const { realtimeRecord, ...baseState } = state;
  return baseState as PianoRollState;
}

/**
 * Quantizes a tick to the nearest grid position.
 */
function quantizeTick(tick: Tick, gridSize: TickDuration): Tick {
  return asTick(Math.round(tick / gridSize) * gridSize);
}

// ============================================================================
// EXPORTS
// ============================================================================
