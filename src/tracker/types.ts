/**
 * @fileoverview Core Tracker Type Definitions
 * 
 * Defines the fundamental types for the CardPlay tracker system,
 * combining Renoise-style tracker concepts with CardPlay's event architecture.
 * 
 * @module @cardplay/tracker/types
 */

// Note: Tracker module is self-contained with its own type definitions
// to avoid circular dependencies and ensure portability

import type { ClipId as StateClipId, EventStreamId as StateEventStreamId } from '../state/types';

// ============================================================================
// LOCAL BRANDED TYPES (self-contained for tracker module)
// ============================================================================

/** MIDI note number (0-127) */
export type MidiNote = number & { readonly __brand: 'MidiNote' };

/** MIDI velocity (0-127) */
export type Velocity = number & { readonly __brand: 'Velocity' };

/** Event identifier */
export type EventId = string & { readonly __brand: 'EventId' };

/** Event stream identifier */
export type EventStreamId = StateEventStreamId;

/** Clip identifier */
export type ClipId = StateClipId;

/** Time position in ticks */
export type Tick = number & { readonly __brand: 'Tick' };

/** Duration in ticks */
export type TickDuration = number & { readonly __brand: 'TickDuration' };

// Local brand constructors
export function asMidiNote(note: number): MidiNote {
  return Math.max(0, Math.min(127, Math.floor(note))) as MidiNote;
}

export function asVelocity(vel: number): Velocity {
  return Math.max(0, Math.min(127, Math.floor(vel))) as Velocity;
}

export function asEventId(id: string): EventId {
  return id as EventId;
}

export function asEventStreamId(id: string): EventStreamId {
  return id as EventStreamId;
}

export function asClipId(id: string): ClipId {
  return id as ClipId;
}

export function asTick(t: number): Tick {
  return Math.max(0, Math.floor(t)) as Tick;
}

export function asTickDuration(d: number): TickDuration {
  return Math.max(0, Math.floor(d)) as TickDuration;
}

// ============================================================================
// BRANDED TYPES
// ============================================================================

/** Pattern identifier */
export type PatternId = string & { readonly __brand: 'PatternId' };

/** Track identifier */
export type TrackId = string & { readonly __brand: 'TrackId' };

/** Row index (0-based) */
export type RowIndex = number & { readonly __brand: 'RowIndex' };

/** Column index (0-based) */
export type ColumnIndex = number & { readonly __brand: 'ColumnIndex' };

/** Effect command code (0x00-0xFF or extended) */
export type EffectCode = number & { readonly __brand: 'EffectCode' };

/** Effect parameter value (0x00-0xFF) */
export type EffectParam = number & { readonly __brand: 'EffectParam' };

/** Phrase identifier */
export type PhraseId = string & { readonly __brand: 'PhraseId' };

/** Instrument slot index */
export type InstrumentSlot = number & { readonly __brand: 'InstrumentSlot' };

// ============================================================================
// BRAND CONSTRUCTORS
// ============================================================================

export function asPatternId(id: string): PatternId {
  return id as PatternId;
}

export function asTrackId(id: string): TrackId {
  return id as TrackId;
}

export function asRowIndex(index: number): RowIndex {
  return Math.max(0, Math.floor(index)) as RowIndex;
}

export function asColumnIndex(index: number): ColumnIndex {
  return Math.max(0, Math.floor(index)) as ColumnIndex;
}

export function asEffectCode(code: number): EffectCode {
  return (code & 0xFFFF) as EffectCode;
}

export function asEffectParam(param: number): EffectParam {
  return (param & 0xFF) as EffectParam;
}

export function asPhraseId(id: string): PhraseId {
  return id as PhraseId;
}

export function asInstrumentSlot(slot: number): InstrumentSlot {
  return Math.max(0, Math.floor(slot)) as InstrumentSlot;
}

// ============================================================================
// NOTE CELL
// ============================================================================

/**
 * Special note values beyond standard MIDI.
 */
export enum SpecialNote {
  Empty = -1,
  NoteOff = -2,
  NoteCut = -3,
  NoteFade = -4,
}

/**
 * A note value that can be a MIDI note or special value.
 */
export type NoteValue = MidiNote | SpecialNote;

/**
 * A single note cell in the tracker grid.
 */
export interface NoteCell {
  /** Note value (MIDI note 0-127 or special) */
  readonly note: NoteValue;
  /** Instrument slot (0-255, or undefined for no change) */
  readonly instrument?: InstrumentSlot;
  /** Volume/velocity (0-127, or undefined for default) */
  readonly volume?: Velocity;
  /** Panning (0-255, 128=center, or undefined for no pan) */
  readonly pan?: number;
  /** Delay in ticks (sub-row timing) */
  readonly delay?: number;
}

/**
 * Creates an empty note cell.
 */
export function emptyNoteCell(): NoteCell {
  return { note: SpecialNote.Empty };
}

/**
 * Creates a note cell with a MIDI note.
 */
export function noteCell(
  note: MidiNote,
  instrument?: InstrumentSlot,
  volume?: Velocity,
  pan?: number,
  delay?: number
): NoteCell {
  return {
    note,
    ...(instrument !== undefined && { instrument }),
    ...(volume !== undefined && { volume }),
    ...(pan !== undefined && { pan }),
    ...(delay !== undefined && { delay }),
  };
}

/**
 * Creates a note-off cell.
 */
export function noteOffCell(delay?: number): NoteCell {
  return {
    note: SpecialNote.NoteOff,
    ...(delay !== undefined && { delay }),
  };
}

/**
 * Creates a note-cut cell.
 */
export function noteCutCell(delay?: number): NoteCell {
  return {
    note: SpecialNote.NoteCut,
    ...(delay !== undefined && { delay }),
  };
}

// ============================================================================
// EFFECT CELL
// ============================================================================

/**
 * A single effect command.
 */
export interface EffectCommand {
  /** Effect code (e.g., 0x0E for arpeggio) */
  readonly code: EffectCode;
  /** Effect parameter (0x00-0xFF) */
  readonly param: EffectParam;
}

/**
 * An effect cell can hold multiple effect commands.
 */
export interface EffectCell {
  /** List of effect commands in this cell */
  readonly effects: readonly EffectCommand[];
}

/**
 * Creates an empty effect cell.
 */
export function emptyEffectCell(): EffectCell {
  return { effects: [] };
}

/**
 * Creates an effect cell with commands.
 */
export function effectCell(...effects: EffectCommand[]): EffectCell {
  return { effects };
}

/**
 * Creates a single effect command.
 */
export function effect(code: number, param: number): EffectCommand {
  return {
    code: asEffectCode(code),
    param: asEffectParam(param),
  };
}

// ============================================================================
// TRACKER ROW
// ============================================================================

/**
 * A complete row in a single track.
 */
export interface TrackerRow {
  /** The note cell */
  readonly note: NoteCell;
  /** Effect cells (can have multiple effect columns) */
  readonly effects: readonly EffectCell[];
}

/**
 * Creates an empty tracker row.
 */
export function emptyRow(effectColumns: number = 1): TrackerRow {
  return {
    note: emptyNoteCell(),
    effects: Array.from({ length: effectColumns }, () => emptyEffectCell()),
  };
}

// ============================================================================
// TRACK CONFIGURATION
// ============================================================================

/**
 * Track type enumeration.
 */
export enum TrackType {
  /** Standard melodic/note track */
  Note = 'note',
  /** Drum/percussion track with grid view */
  Drum = 'drum',
  /** Automation-only track */
  Automation = 'automation',
  /** Chord reference track */
  Chord = 'chord',
  /** Tempo automation track */
  Tempo = 'tempo',
  /** Time signature track */
  TimeSignature = 'timesig',
  /** Marker/cue track */
  Marker = 'marker',
  /** Send/bus track */
  Send = 'send',
  /** Master track */
  Master = 'master',
  /** Group/folder track */
  Group = 'group',
  /** Generator card track */
  Generator = 'generator',
  /** Event emission track */
  Event = 'event',
}

/**
 * Track configuration.
 */
export interface TrackConfig {
  /** Unique track identifier */
  readonly id: TrackId;
  /** Track display name */
  readonly name: string;
  /** Track type */
  readonly type: TrackType;
  /** Track color (hex) */
  readonly color: string;
  /** Number of effect columns */
  readonly effectColumns: number;
  /** Number of note columns (for polyphonic tracks) */
  readonly noteColumns: number;
  /** Is track visible */
  readonly visible: boolean;
  /** Is track collapsed (minimized view) */
  readonly collapsed: boolean;
  /** Is track muted */
  readonly muted: boolean;
  /** Is track soloed */
  readonly soloed: boolean;
  /** Is track armed for recording */
  readonly armed: boolean;
  /** Is track locked (prevent edits) */
  readonly locked: boolean;
  /** Is track frozen (rendered to audio) */
  readonly frozen: boolean;
  /** Track volume (0-1) */
  readonly volume: number;
  /** Track pan (-1 to 1) */
  readonly pan: number;
  /** Associated instrument slot */
  readonly instrumentSlot?: InstrumentSlot;
  /** Parent group track ID */
  readonly groupId?: TrackId;
  /** Output routing (send track ID or 'master') */
  readonly output: TrackId | 'master';
  /** Linked event stream ID */
  readonly streamId?: EventStreamId;
  /** Associated generator card ID */
  readonly generatorId?: string;
}

/**
 * Creates a default track configuration.
 */
export function createTrackConfig(
  id: string,
  name: string,
  type: TrackType = TrackType.Note
): TrackConfig {
  return {
    id: asTrackId(id),
    name,
    type,
    color: '#4a90d9',
    effectColumns: 2,
    noteColumns: 1,
    visible: true,
    collapsed: false,
    muted: false,
    soloed: false,
    armed: false,
    locked: false,
    frozen: false,
    volume: 1,
    pan: 0,
    output: 'master',
  };
}

// ============================================================================
// TRACK DATA
// ============================================================================

/**
 * Complete track data for a pattern.
 */
export interface TrackData {
  /** Track configuration */
  readonly config: TrackConfig;
  /** Rows in this track (indexed by row number) */
  readonly rows: readonly TrackerRow[];
}

/**
 * Creates empty track data.
 */
export function createTrackData(config: TrackConfig, rowCount: number): TrackData {
  return {
    config,
    rows: Array.from({ length: rowCount }, () => 
      emptyRow(config.effectColumns)
    ),
  };
}

// ============================================================================
// PATTERN
// ============================================================================

/**
 * Pattern configuration and metadata.
 */
export interface PatternConfig {
  /** Unique pattern identifier */
  readonly id: PatternId;
  /** Pattern display name */
  readonly name: string;
  /** Number of rows */
  readonly length: number;
  /** Rows per beat (for display) */
  readonly rowsPerBeat: number;
  /** Pattern color */
  readonly color: string;
  /** Pattern tags/labels */
  readonly tags: readonly string[];
  /** User notes/comments */
  readonly notes: string;
  /** Associated clip ID (for session view integration) */
  readonly clipId?: ClipId;
  /** Tempo override (BPM, or undefined for global) */
  readonly tempo?: number;
  /** Time signature override */
  readonly timeSignature?: { numerator: number; denominator: number };
  /** Swing amount (0-1) */
  readonly swing: number;
  /** Groove template name */
  readonly groove?: string;
}

/**
 * Complete pattern data.
 */
export interface Pattern {
  /** Pattern configuration */
  readonly config: PatternConfig;
  /** Track data (indexed by track ID) */
  readonly tracks: ReadonlyMap<TrackId, TrackData>;
}

/**
 * Creates a default pattern configuration.
 */
export function createPatternConfig(
  id: string,
  name: string,
  length: number = 64
): PatternConfig {
  return {
    id: asPatternId(id),
    name,
    length,
    rowsPerBeat: 4,
    color: '#333333',
    tags: [],
    notes: '',
    swing: 0,
  };
}

// ============================================================================
// SELECTION
// ============================================================================

/**
 * Selection anchor point.
 */
export interface SelectionAnchor {
  readonly patternId: PatternId;
  readonly trackId: TrackId;
  readonly row: RowIndex;
  readonly column: ColumnIndex;
  readonly subColumn: 'note' | 'instrument' | 'volume' | 'pan' | 'delay' | 'effect';
  readonly effectIndex?: number;
}

/**
 * Selection range (rectangular region).
 */
export interface SelectionRange {
  readonly start: SelectionAnchor;
  readonly end: SelectionAnchor;
}

/**
 * Multi-region selection (can be non-contiguous).
 */
export interface TrackerSelection {
  /** Primary selection range */
  readonly primary: SelectionRange | null;
  /** Additional selection ranges */
  readonly additional: readonly SelectionRange[];
  /** Is selection active */
  readonly active: boolean;
}

/**
 * Creates an empty selection.
 */
export function emptySelection(): TrackerSelection {
  return {
    primary: null,
    additional: [],
    active: false,
  };
}

// ============================================================================
// CURSOR
// ============================================================================

/**
 * Edit cursor position.
 */
export interface CursorPosition {
  readonly patternId: PatternId;
  readonly trackId: TrackId;
  readonly row: RowIndex;
  readonly column: ColumnIndex;
  readonly subColumn: 'note' | 'instrument' | 'volume' | 'pan' | 'delay' | 'effect';
  readonly effectIndex: number;
  readonly nibble: 0 | 1;  // For hex entry (high/low nibble)
}

/**
 * Cursor configuration.
 */
export interface CursorConfig {
  /** Step amount when entering notes */
  readonly editStep: number;
  /** Wrap at pattern boundaries */
  readonly wrapAround: boolean;
  /** Follow playback position */
  readonly followPlayback: boolean;
  /** Key-off when releasing note */
  readonly autoNoteOff: boolean;
}

// ============================================================================
// CLIPBOARD
// ============================================================================

/**
 * Clipboard content for tracker operations.
 */
export interface TrackerClipboard {
  /** Type of clipboard content */
  readonly type: 'notes' | 'effects' | 'mixed' | 'track' | 'pattern';
  /** Source pattern ID */
  readonly sourcePattern: PatternId;
  /** Source track IDs */
  readonly sourceTracks: readonly TrackId[];
  /** Row range */
  readonly rowRange: { start: RowIndex; end: RowIndex };
  /** The actual data (track data fragments) */
  readonly data: ReadonlyMap<TrackId, readonly TrackerRow[]>;
  /** Timestamp of copy */
  readonly timestamp: number;
  /** Include metadata (instrument, effects, etc) */
  readonly includeMetadata: boolean;
}

// ============================================================================
// DISPLAY CONFIGURATION
// ============================================================================

/**
 * Display base for numeric values.
 */
export enum DisplayBase {
  /** Hexadecimal (0-FF) */
  Hex = 16,
  /** Decimal (0-255) */
  Decimal = 10,
  /** Musical (C-4, D#5, etc) */
  Musical = 0,
}

/**
 * Tracker display configuration.
 */
export interface DisplayConfig {
  /** Number base for display */
  readonly base: DisplayBase;
  /** Show row numbers */
  readonly showRowNumbers: boolean;
  /** Row number format */
  readonly rowNumberBase: DisplayBase;
  /** Highlight every N rows */
  readonly highlightInterval: number;
  /** Show instrument names instead of numbers */
  readonly showInstrumentNames: boolean;
  /** Show note names (C-4) or MIDI numbers */
  readonly showNoteNames: boolean;
  /** Compact effect display */
  readonly compactEffects: boolean;
  /** Row height in pixels */
  readonly rowHeight: number;
  /** Column width multiplier */
  readonly columnWidth: number;
  /** Font size */
  readonly fontSize: number;
  /** Font family */
  readonly fontFamily: string;
  /** Show velocity bars */
  readonly showVelocityBars: boolean;
  /** Color code by instrument */
  readonly colorByInstrument: boolean;
  /** Color code by pitch */
  readonly colorByPitch: boolean;
  /** Show ghost notes from other tracks */
  readonly showGhostNotes: boolean;
  /** Ghost note opacity */
  readonly ghostNoteOpacity: number;
}

/**
 * Default display configuration.
 */
export function defaultDisplayConfig(): DisplayConfig {
  return {
    base: DisplayBase.Hex,
    showRowNumbers: true,
    rowNumberBase: DisplayBase.Hex,
    highlightInterval: 4,
    showInstrumentNames: false,
    showNoteNames: true,
    compactEffects: false,
    rowHeight: 18,
    columnWidth: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    showVelocityBars: true,
    colorByInstrument: true,
    colorByPitch: false,
    showGhostNotes: true,
    ghostNoteOpacity: 0.3,
  };
}

// ============================================================================
// EDIT MODE
// ============================================================================

/**
 * Tracker edit mode.
 */
export enum EditMode {
  /** Normal editing mode */
  Normal = 'normal',
  /** Step recording mode */
  StepRecord = 'step',
  /** Live recording mode */
  LiveRecord = 'live',
  /** Selection mode */
  Select = 'select',
  /** Navigation only (no edits) */
  Navigate = 'navigate',
}

/**
 * Recording configuration.
 */
export interface RecordConfig {
  /** Current edit mode */
  readonly mode: EditMode;
  /** Quantize input to rows */
  readonly quantize: boolean;
  /** Quantize grid (in rows) */
  readonly quantizeGrid: number;
  /** Record velocity from input */
  readonly recordVelocity: boolean;
  /** Record note-off events */
  readonly recordNoteOff: boolean;
  /** Overdub (merge) or replace */
  readonly overdub: boolean;
  /** Count-in bars before recording */
  readonly countIn: number;
  /** Pre-roll bars */
  readonly preRoll: number;
  /** Metronome enabled */
  readonly metronome: boolean;
  /** MIDI input channel filter (-1 = all) */
  readonly midiChannel: number;
}

/**
 * Default recording configuration.
 */
export function defaultRecordConfig(): RecordConfig {
  return {
    mode: EditMode.Normal,
    quantize: true,
    quantizeGrid: 1,
    recordVelocity: true,
    recordNoteOff: true,
    overdub: false,
    countIn: 0,
    preRoll: 0,
    metronome: true,
    midiChannel: -1,
  };
}

// ============================================================================
// TRACKER STATE
// ============================================================================

/**
 * Complete tracker editor state.
 */
export interface TrackerState {
  /** All patterns */
  readonly patterns: ReadonlyMap<PatternId, Pattern>;
  /** Pattern sequence (order of patterns for playback) */
  readonly sequence: readonly PatternId[];
  /** Current pattern being edited */
  readonly currentPatternId: PatternId | null;
  /** Track configurations (shared across patterns) */
  readonly trackConfigs: ReadonlyMap<TrackId, TrackConfig>;
  /** Track order */
  readonly trackOrder: readonly TrackId[];
  /** Cursor position */
  readonly cursor: CursorPosition | null;
  /** Current selection */
  readonly selection: TrackerSelection;
  /** Display configuration */
  readonly display: DisplayConfig;
  /** Recording configuration */
  readonly record: RecordConfig;
  /** Clipboard content */
  readonly clipboard: TrackerClipboard | null;
  /** Undo history */
  readonly undoStack: readonly TrackerState[];
  /** Redo history */
  readonly redoStack: readonly TrackerState[];
  /** Is transport playing */
  readonly isPlaying: boolean;
  /** Current playback row */
  readonly playbackRow: RowIndex | null;
  /** Current playback pattern */
  readonly playbackPatternId: PatternId | null;
}

/**
 * Creates an initial tracker state.
 */
export function createInitialTrackerState(): TrackerState {
  return {
    patterns: new Map(),
    sequence: [],
    currentPatternId: null,
    trackConfigs: new Map(),
    trackOrder: [],
    cursor: null,
    selection: emptySelection(),
    display: defaultDisplayConfig(),
    record: defaultRecordConfig(),
    clipboard: null,
    undoStack: [],
    redoStack: [],
    isPlaying: false,
    playbackRow: null,
    playbackPatternId: null,
  };
}
