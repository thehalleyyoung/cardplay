/**
 * @fileoverview Tracker Navigation & Input Handler
 * 
 * Handles keyboard input, cursor movement, and edit operations
 * for the tracker interface.
 * 
 * @module @cardplay/tracker/input-handler
 */

import {
  asRowIndex,
  asColumnIndex,
  asEffectCode,
  asEffectParam,
  asMidiNote,
  asVelocity,
  SpecialNote,
  emptySelection,
  type PatternId,
  type TrackId,
  type RowIndex,
  type ColumnIndex,
  type CursorPosition,
  type CursorConfig,
  type TrackerSelection,
  type SelectionAnchor,
  type TrackerState,
  type NoteCell,
  type EffectCommand,
  type EditMode,
  type EventStreamId,
} from './types';
import { getPatternStore } from './pattern-store';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Navigation direction.
 */
export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Key input for note entry.
 */
export interface NoteKeyMapping {
  /** Keyboard key */
  key: string;
  /** MIDI note offset from base octave */
  noteOffset: number;
}

/**
 * Input handler configuration.
 */
export interface InputHandlerConfig {
  /** Base octave for note entry (0-9) */
  baseOctave: number;
  /** Edit step (rows to advance after note entry) */
  editStep: number;
  /** Wrap cursor at pattern boundaries */
  wrapAround: boolean;
  /** Follow playback position */
  followPlayback: boolean;
  /** Insert note-off on key release */
  autoNoteOff: boolean;
  /** Velocity for entered notes (0=use last, 1-127=fixed) */
  defaultVelocity: number;
  /** Recording mode */
  recordMode: 'step' | 'live' | 'off';
}

/**
 * Default input configuration.
 */
export const DEFAULT_INPUT_CONFIG: InputHandlerConfig = {
  baseOctave: 4,
  editStep: 1,
  wrapAround: true,
  followPlayback: false,
  autoNoteOff: true,
  defaultVelocity: 100,
  recordMode: 'step',
};

// ============================================================================
// KEY MAPPINGS
// ============================================================================

/**
 * Piano keyboard layout for note entry.
 * Two octaves on QWERTY keyboard.
 */
export const PIANO_KEY_MAP: NoteKeyMapping[] = [
  // Lower octave (ZSXDCVGBHNJM)
  { key: 'z', noteOffset: 0 },   // C
  { key: 's', noteOffset: 1 },   // C#
  { key: 'x', noteOffset: 2 },   // D
  { key: 'd', noteOffset: 3 },   // D#
  { key: 'c', noteOffset: 4 },   // E
  { key: 'v', noteOffset: 5 },   // F
  { key: 'g', noteOffset: 6 },   // F#
  { key: 'b', noteOffset: 7 },   // G
  { key: 'h', noteOffset: 8 },   // G#
  { key: 'n', noteOffset: 9 },   // A
  { key: 'j', noteOffset: 10 },  // A#
  { key: 'm', noteOffset: 11 },  // B
  
  // Upper octave (Q2W3ER5T6Y7UI)
  { key: 'q', noteOffset: 12 },  // C
  { key: '2', noteOffset: 13 },  // C#
  { key: 'w', noteOffset: 14 },  // D
  { key: '3', noteOffset: 15 },  // D#
  { key: 'e', noteOffset: 16 },  // E
  { key: 'r', noteOffset: 17 },  // F
  { key: '5', noteOffset: 18 },  // F#
  { key: 't', noteOffset: 19 },  // G
  { key: '6', noteOffset: 20 },  // G#
  { key: 'y', noteOffset: 21 },  // A
  { key: '7', noteOffset: 22 },  // A#
  { key: 'u', noteOffset: 23 },  // B
  { key: 'i', noteOffset: 24 },  // C (next octave)
];

/**
 * Hex digit key mappings.
 */
export const HEX_KEY_MAP: Map<string, number> = new Map([
  ['0', 0], ['1', 1], ['2', 2], ['3', 3],
  ['4', 4], ['5', 5], ['6', 6], ['7', 7],
  ['8', 8], ['9', 9], ['a', 10], ['b', 11],
  ['c', 12], ['d', 13], ['e', 14], ['f', 15],
]);

// ============================================================================
// INPUT HANDLER
// ============================================================================

/**
 * TrackerInputHandler manages keyboard input and cursor navigation.
 */
export class TrackerInputHandler {
  private config: InputHandlerConfig;
  private cursor: CursorPosition | null = null;
  private selection: TrackerSelection = emptySelection();
  private lastVelocity: number = 100;
  private heldNotes: Map<string, number> = new Map();  // key -> MIDI note
  
  // Callbacks
  private onCursorChange: ((cursor: CursorPosition | null) => void) | null = null;
  private onSelectionChange: ((selection: TrackerSelection) => void) | null = null;
  private onNoteInput: ((note: NoteCell, advance: boolean) => void) | null = null;
  private onEffectInput: ((effect: EffectCommand) => void) | null = null;
  
  constructor(config: Partial<InputHandlerConfig> = {}) {
    this.config = { ...DEFAULT_INPUT_CONFIG, ...config };
  }
  
  // ========== CONFIGURATION ==========
  
  /**
   * Update configuration.
   */
  setConfig(updates: Partial<InputHandlerConfig>): void {
    this.config = { ...this.config, ...updates };
  }
  
  /**
   * Get current configuration.
   */
  getConfig(): InputHandlerConfig {
    return { ...this.config };
  }
  
  /**
   * Set base octave.
   */
  setOctave(octave: number): void {
    this.config.baseOctave = Math.max(0, Math.min(9, octave));
  }
  
  /**
   * Increase octave.
   */
  octaveUp(): void {
    this.setOctave(this.config.baseOctave + 1);
  }
  
  /**
   * Decrease octave.
   */
  octaveDown(): void {
    this.setOctave(this.config.baseOctave - 1);
  }
  
  // ========== CURSOR ==========
  
  /**
   * Set cursor position.
   */
  setCursor(cursor: CursorPosition | null): void {
    this.cursor = cursor;
    this.onCursorChange?.(cursor);
  }
  
  /**
   * Get cursor position.
   */
  getCursor(): CursorPosition | null {
    return this.cursor;
  }
  
  /**
   * Move cursor in direction.
   */
  moveCursor(
    direction: Direction,
    state: TrackerState,
    extend: boolean = false
  ): void {
    if (!this.cursor) return;
    
    const pattern = state.patterns.get(this.cursor.patternId);
    if (!pattern) return;
    
    let newCursor = { ...this.cursor };
    
    switch (direction) {
      case 'up':
        newCursor = this.moveCursorUp(newCursor, pattern.config.length, state);
        break;
      case 'down':
        newCursor = this.moveCursorDown(newCursor, pattern.config.length, state);
        break;
      case 'left':
        newCursor = this.moveCursorLeft(newCursor, state);
        break;
      case 'right':
        newCursor = this.moveCursorRight(newCursor, state);
        break;
    }
    
    this.cursor = newCursor;
    this.onCursorChange?.(newCursor);
    
    if (extend) {
      this.extendSelection();
    } else {
      this.clearSelection();
    }
  }
  
  private moveCursorUp(
    cursor: CursorPosition,
    patternLength: number,
    state: TrackerState
  ): CursorPosition {
    let newRow = (cursor.row as number) - 1;
    
    if (newRow < 0) {
      if (this.config.wrapAround) {
        newRow = patternLength - 1;
      } else {
        newRow = 0;
      }
    }
    
    return { ...cursor, row: asRowIndex(newRow) };
  }
  
  private moveCursorDown(
    cursor: CursorPosition,
    patternLength: number,
    state: TrackerState
  ): CursorPosition {
    let newRow = (cursor.row as number) + 1;
    
    if (newRow >= patternLength) {
      if (this.config.wrapAround) {
        newRow = 0;
      } else {
        newRow = patternLength - 1;
      }
    }
    
    return { ...cursor, row: asRowIndex(newRow) };
  }
  
  private moveCursorLeft(
    cursor: CursorPosition,
    state: TrackerState
  ): CursorPosition {
    // Navigate through sub-columns: note -> instrument -> volume -> pan -> delay -> effects
    const subColumns = ['note', 'instrument', 'volume', 'pan', 'delay', 'effect'] as const;
    const currentIdx = subColumns.indexOf(cursor.subColumn);
    
    if (cursor.subColumn === 'effect' && cursor.effectIndex > 0) {
      // Move to previous effect column
      return { ...cursor, effectIndex: cursor.effectIndex - 1, nibble: 1 };
    } else if (cursor.nibble === 1 && cursor.subColumn !== 'note') {
      // Move to high nibble
      return { ...cursor, nibble: 0 };
    } else if (currentIdx > 0) {
      // Move to previous sub-column
      const newSubColumn = subColumns[currentIdx - 1];
      return { 
        ...cursor, 
        subColumn: newSubColumn,
        nibble: newSubColumn === 'note' ? 0 : 1,
      };
    } else {
      // Move to previous track
      const trackIdx = state.trackOrder.indexOf(cursor.trackId);
      if (trackIdx > 0) {
        const newTrackId = state.trackOrder[trackIdx - 1];
        const trackConfig = state.trackConfigs.get(newTrackId);
        const effectCols = trackConfig?.effectColumns ?? 2;
        return {
          ...cursor,
          trackId: newTrackId,
          subColumn: 'effect',
          effectIndex: effectCols - 1,
          nibble: 1,
        };
      }
    }
    
    return cursor;
  }
  
  private moveCursorRight(
    cursor: CursorPosition,
    state: TrackerState
  ): CursorPosition {
    const subColumns = ['note', 'instrument', 'volume', 'pan', 'delay', 'effect'] as const;
    const currentIdx = subColumns.indexOf(cursor.subColumn);
    const trackConfig = state.trackConfigs.get(cursor.trackId);
    const effectCols = trackConfig?.effectColumns ?? 2;
    
    if (cursor.subColumn === 'note') {
      // Note column is special - move directly to next sub-column
      return { ...cursor, subColumn: 'instrument', nibble: 0 };
    } else if (cursor.nibble === 0) {
      // Move to low nibble
      return { ...cursor, nibble: 1 };
    } else if (cursor.subColumn === 'effect' && cursor.effectIndex < effectCols - 1) {
      // Move to next effect column
      return { ...cursor, effectIndex: cursor.effectIndex + 1, nibble: 0 };
    } else if (currentIdx < subColumns.length - 1) {
      // Move to next sub-column
      const newSubColumn = subColumns[currentIdx + 1];
      return {
        ...cursor,
        subColumn: newSubColumn,
        nibble: 0,
        effectIndex: newSubColumn === 'effect' ? 0 : cursor.effectIndex,
      };
    } else {
      // Move to next track
      const trackIdx = state.trackOrder.indexOf(cursor.trackId);
      if (trackIdx < state.trackOrder.length - 1) {
        return {
          ...cursor,
          trackId: state.trackOrder[trackIdx + 1],
          subColumn: 'note',
          effectIndex: 0,
          nibble: 0,
        };
      }
    }
    
    return cursor;
  }
  
  /**
   * Jump cursor by page.
   */
  pageUp(state: TrackerState, pageSize: number = 16): void {
    if (!this.cursor) return;
    
    const newRow = Math.max(0, (this.cursor.row as number) - pageSize);
    this.cursor = { ...this.cursor, row: asRowIndex(newRow) };
    this.onCursorChange?.(this.cursor);
  }
  
  /**
   * Jump cursor by page.
   */
  pageDown(state: TrackerState, pageSize: number = 16): void {
    if (!this.cursor) return;
    
    const pattern = state.patterns.get(this.cursor.patternId);
    if (!pattern) return;
    
    const newRow = Math.min(
      pattern.config.length - 1,
      (this.cursor.row as number) + pageSize
    );
    this.cursor = { ...this.cursor, row: asRowIndex(newRow) };
    this.onCursorChange?.(this.cursor);
  }
  
  /**
   * Jump to start of pattern.
   */
  jumpToStart(): void {
    if (!this.cursor) return;
    this.cursor = { ...this.cursor, row: asRowIndex(0) };
    this.onCursorChange?.(this.cursor);
  }
  
  /**
   * Jump to end of pattern.
   */
  jumpToEnd(state: TrackerState): void {
    if (!this.cursor) return;
    
    const pattern = state.patterns.get(this.cursor.patternId);
    if (!pattern) return;
    
    this.cursor = { ...this.cursor, row: asRowIndex(pattern.config.length - 1) };
    this.onCursorChange?.(this.cursor);
  }
  
  // ========== SELECTION ==========
  
  /**
   * Start selection from current cursor.
   */
  startSelection(): void {
    if (!this.cursor) return;
    
    const anchor: SelectionAnchor = {
      patternId: this.cursor.patternId,
      trackId: this.cursor.trackId,
      row: this.cursor.row,
      column: this.cursor.column,
      subColumn: this.cursor.subColumn,
      effectIndex: this.cursor.effectIndex,
    };
    
    this.selection = {
      primary: { start: anchor, end: anchor },
      additional: [],
      active: true,
    };
    this.onSelectionChange?.(this.selection);
  }
  
  /**
   * Extend selection to current cursor.
   */
  extendSelection(): void {
    if (!this.cursor || !this.selection.primary) return;
    
    const end: SelectionAnchor = {
      patternId: this.cursor.patternId,
      trackId: this.cursor.trackId,
      row: this.cursor.row,
      column: this.cursor.column,
      subColumn: this.cursor.subColumn,
      effectIndex: this.cursor.effectIndex,
    };
    
    this.selection = {
      ...this.selection,
      primary: { ...this.selection.primary, end },
    };
    this.onSelectionChange?.(this.selection);
  }
  
  /**
   * Clear selection.
   */
  clearSelection(): void {
    this.selection = emptySelection();
    this.onSelectionChange?.(this.selection);
  }
  
  /**
   * Select all (entire pattern).
   */
  selectAll(state: TrackerState): void {
    if (!this.cursor) return;
    
    const pattern = state.patterns.get(this.cursor.patternId);
    if (!pattern) return;
    
    const firstTrack = state.trackOrder[0];
    const lastTrack = state.trackOrder[state.trackOrder.length - 1];
    
    const start: SelectionAnchor = {
      patternId: this.cursor.patternId,
      trackId: firstTrack,
      row: asRowIndex(0),
      column: asColumnIndex(0),
      subColumn: 'note',
    };
    
    const end: SelectionAnchor = {
      patternId: this.cursor.patternId,
      trackId: lastTrack,
      row: asRowIndex(pattern.config.length - 1),
      column: asColumnIndex(0),
      subColumn: 'effect',
      effectIndex: (state.trackConfigs.get(lastTrack)?.effectColumns ?? 2) - 1,
    };
    
    this.selection = {
      primary: { start, end },
      additional: [],
      active: true,
    };
    this.onSelectionChange?.(this.selection);
  }
  
  // ========== NOTE INPUT ==========
  
  /**
   * Handle key down event.
   */
  handleKeyDown(
    key: string,
    state: TrackerState,
    streamId: EventStreamId | null,
    patternLength: number
  ): boolean {
    if (!this.cursor) return false;
    
    const lowerKey = key.toLowerCase();
    
    // Check for note input
    const noteMapping = PIANO_KEY_MAP.find(m => m.key === lowerKey);
    if (noteMapping && this.cursor.subColumn === 'note') {
      return this.inputNote(noteMapping.noteOffset, streamId, patternLength);
    }
    
    // Check for hex input
    if (HEX_KEY_MAP.has(lowerKey) && this.cursor.subColumn !== 'note') {
      return this.inputHexDigit(HEX_KEY_MAP.get(lowerKey)!, state, streamId, patternLength);
    }
    
    // Special keys
    switch (key) {
      case 'Delete':
      case 'Backspace':
        return this.deleteAtCursor(streamId, patternLength);
        
      case '`':  // Note off
      case '=':
        return this.inputNoteOff(streamId, patternLength);
        
      case '-':  // Note cut
        return this.inputNoteCut(streamId, patternLength);
        
      case '*':  // Octave up
        this.octaveUp();
        return true;
        
      case '/':  // Octave down
        this.octaveDown();
        return true;
    }
    
    return false;
  }
  
  /**
   * Handle key up event.
   */
  handleKeyUp(key: string): void {
    const lowerKey = key.toLowerCase();
    const noteMapping = PIANO_KEY_MAP.find(m => m.key === lowerKey);
    
    if (noteMapping) {
      this.heldNotes.delete(lowerKey);
      // Could trigger note-off in live recording mode
    }
  }
  
  /**
   * Input a note.
   */
  private inputNote(
    noteOffset: number,
    streamId: EventStreamId | null,
    patternLength: number
  ): boolean {
    if (!this.cursor) return false;
    
    const midiNote = (this.config.baseOctave * 12) + noteOffset;
    if (midiNote < 0 || midiNote > 127) return false;
    
    const velocity = this.config.defaultVelocity > 0 
      ? this.config.defaultVelocity 
      : this.lastVelocity;
    
    const note: NoteCell = {
      note: asMidiNote(midiNote),
      volume: asVelocity(velocity),
    };
    
    // Update via event sync if we have a stream
    if (streamId) {
      const sync = getTrackerEventSync();
      sync.setNote(streamId, this.cursor.row as number, note, patternLength);
    }
    
    this.onNoteInput?.(note, true);
    this.lastVelocity = velocity;
    
    // Advance cursor
    if (this.config.editStep > 0) {
      this.advanceCursor(patternLength);
    }
    
    return true;
  }
  
  /**
   * Input a hex digit.
   */
  private inputHexDigit(
    digit: number,
    state: TrackerState,
    streamId: EventStreamId | null,
    patternLength: number
  ): boolean {
    if (!this.cursor) return false;
    
    // Get current value and update nibble
    const sync = getTrackerEventSync();
    const view = streamId ? sync.getView(streamId) : null;
    const row = view?.rows[this.cursor.row as number];
    
    if (!row) return false;
    
    switch (this.cursor.subColumn) {
      case 'instrument': {
        const current = row.note.instrument as number ?? 0;
        const newValue = this.cursor.nibble === 0
          ? (digit << 4) | (current & 0x0F)
          : (current & 0xF0) | digit;
        
        if (streamId) {
          sync.setNote(streamId, this.cursor.row as number, {
            ...row.note,
            instrument: newValue as any,
          }, patternLength);
        }
        break;
      }
      
      case 'volume': {
        const current = row.note.volume as number ?? 0x7F;
        const newValue = this.cursor.nibble === 0
          ? (digit << 4) | (current & 0x0F)
          : (current & 0xF0) | digit;
        
        if (streamId) {
          sync.setNote(streamId, this.cursor.row as number, {
            ...row.note,
            volume: asVelocity(Math.min(127, newValue)),
          }, patternLength);
        }
        break;
      }
      
      case 'pan': {
        const current = row.note.pan ?? 0x80;
        const newValue = this.cursor.nibble === 0
          ? (digit << 4) | (current & 0x0F)
          : (current & 0xF0) | digit;
        
        if (streamId) {
          sync.setNote(streamId, this.cursor.row as number, {
            ...row.note,
            pan: newValue,
          }, patternLength);
        }
        break;
      }
      
      case 'delay': {
        const current = row.note.delay ?? 0;
        const newValue = this.cursor.nibble === 0
          ? (digit << 4) | (current & 0x0F)
          : (current & 0xF0) | digit;
        
        if (streamId) {
          sync.setNote(streamId, this.cursor.row as number, {
            ...row.note,
            delay: newValue,
          }, patternLength);
        }
        break;
      }
      
      case 'effect': {
        const effectCell = row.effects[this.cursor.effectIndex];
        const current = effectCell?.effects[0];
        
        // Effect entry: first two nibbles = command, last two = parameter
        // For simplicity, treat as XYY format
        if (current) {
          const code = current.code as number;
          const param = current.param as number;
          
          // Determine which part we're editing based on cursor position
          // This is simplified - real implementation would track which byte
          const newParam = this.cursor.nibble === 0
            ? (digit << 4) | (param & 0x0F)
            : (param & 0xF0) | digit;
          
          if (streamId) {
            sync.setEffect(
              streamId,
              this.cursor.row as number,
              this.cursor.effectIndex,
              { effects: [{ code: asEffectCode(code), param: asEffectParam(newParam) }] },
              patternLength
            );
          }
        }
        break;
      }
    }
    
    // Move to next nibble or column
    this.moveCursor('right', state, false);
    
    return true;
  }
  
  /**
   * Input note-off.
   */
  private inputNoteOff(
    streamId: EventStreamId | null,
    patternLength: number
  ): boolean {
    if (!this.cursor || this.cursor.subColumn !== 'note') return false;
    
    const note: NoteCell = { note: SpecialNote.NoteOff };
    
    if (streamId) {
      // Note-offs are represented by removing the note event
      // Or we could emit a specific note-off event
      const sync = getTrackerEventSync();
      sync.clearRow(streamId, this.cursor.row as number, patternLength);
    }
    
    this.onNoteInput?.(note, true);
    
    if (this.config.editStep > 0) {
      this.advanceCursor(patternLength);
    }
    
    return true;
  }
  
  /**
   * Input note-cut.
   */
  private inputNoteCut(
    streamId: EventStreamId | null,
    patternLength: number
  ): boolean {
    if (!this.cursor || this.cursor.subColumn !== 'note') return false;
    
    const note: NoteCell = { note: SpecialNote.NoteCut };
    
    if (streamId) {
      const sync = getTrackerEventSync();
      sync.clearRow(streamId, this.cursor.row as number, patternLength);
    }
    
    this.onNoteInput?.(note, true);
    
    if (this.config.editStep > 0) {
      this.advanceCursor(patternLength);
    }
    
    return true;
  }
  
  /**
   * Delete at cursor position.
   */
  private deleteAtCursor(
    streamId: EventStreamId | null,
    patternLength: number
  ): boolean {
    if (!this.cursor) return false;
    
    if (streamId) {
      const sync = getTrackerEventSync();
      sync.clearRow(streamId, this.cursor.row as number, patternLength);
    }
    
    return true;
  }
  
  /**
   * Advance cursor by edit step.
   */
  private advanceCursor(patternLength: number): void {
    if (!this.cursor) return;
    
    let newRow = (this.cursor.row as number) + this.config.editStep;
    
    if (newRow >= patternLength) {
      if (this.config.wrapAround) {
        newRow = newRow % patternLength;
      } else {
        newRow = patternLength - 1;
      }
    }
    
    this.cursor = { ...this.cursor, row: asRowIndex(newRow) };
    this.onCursorChange?.(this.cursor);
  }
  
  // ========== CALLBACKS ==========
  
  /**
   * Set cursor change callback.
   */
  setOnCursorChange(callback: (cursor: CursorPosition | null) => void): void {
    this.onCursorChange = callback;
  }
  
  /**
   * Set selection change callback.
   */
  setOnSelectionChange(callback: (selection: TrackerSelection) => void): void {
    this.onSelectionChange = callback;
  }
  
  /**
   * Set note input callback.
   */
  setOnNoteInput(callback: (note: NoteCell, advance: boolean) => void): void {
    this.onNoteInput = callback;
  }
  
  /**
   * Set effect input callback.
   */
  setOnEffectInput(callback: (effect: EffectCommand) => void): void {
    this.onEffectInput = callback;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let handlerInstance: TrackerInputHandler | null = null;

/**
 * Get or create the input handler singleton.
 */
export function getTrackerInputHandler(config?: Partial<InputHandlerConfig>): TrackerInputHandler {
  if (!handlerInstance) {
    handlerInstance = new TrackerInputHandler(config);
  }
  return handlerInstance;
}

/**
 * Reset the input handler (for testing).
 */
export function resetTrackerInputHandler(): void {
  handlerInstance = null;
}
