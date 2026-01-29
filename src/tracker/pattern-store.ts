/**
 * @fileoverview Tracker Pattern Store
 * 
 * Manages pattern data with undo/redo support, connecting to
 * SharedEventStore for synchronization with the rest of CardPlay.
 * 
 * @module @cardplay/tracker/pattern-store
 */

import {
  asPatternId,
  asTrackId,
  asRowIndex,
  createPatternConfig,
  createTrackConfig,
  createTrackData,
  emptyRow,
  emptySelection,
  createInitialTrackerState,
  TrackType,
  SpecialNote,
  asMidiNote,
  asVelocity,
  type Pattern, 
  type PatternConfig, 
  type PatternId, 
  type TrackId, 
  type TrackConfig,
  type TrackData,
  type TrackerRow,
  type RowIndex,
  type NoteCell,
  type EffectCell,
  type EffectCommand,
  type TrackerState,
  type CursorPosition,
  type TrackerSelection,
  type SelectionAnchor,
  type EventStreamId, 
} from './types';
import { getSharedEventStore } from '../state';
import { createEvent, type Event } from '../types/event';
import { EventKinds } from '../types/event-kind';

// ============================================================================
// PATTERN STORE
// ============================================================================

/**
 * Pattern store manages all tracker data and operations.
 */
export class PatternStore {
  private state: TrackerState;
  private subscribers: Set<(state: TrackerState) => void> = new Set();
  private maxUndoHistory: number = 100;
  private ppq: number = 480;  // Pulses per quarter note
  
  constructor() {
    this.state = createInitialTrackerState();
  }
  
  // ========== STATE ACCESS ==========
  
  /**
   * Get current state.
   */
  getState(): TrackerState {
    return this.state;
  }
  
  /**
   * Get a pattern by ID.
   */
  getPattern(patternId: PatternId): Pattern | undefined {
    return this.state.patterns.get(patternId);
  }
  
  /**
   * Get current pattern.
   */
  getCurrentPattern(): Pattern | undefined {
    if (!this.state.currentPatternId) return undefined;
    return this.state.patterns.get(this.state.currentPatternId);
  }
  
  /**
   * Get track configuration.
   */
  getTrackConfig(trackId: TrackId): TrackConfig | undefined {
    return this.state.trackConfigs.get(trackId);
  }
  
  /**
   * Get track data for a pattern.
   */
  getTrackData(patternId: PatternId, trackId: TrackId): TrackData | undefined {
    return this.state.patterns.get(patternId)?.tracks.get(trackId);
  }
  
  /**
   * Get row data.
   */
  getRow(patternId: PatternId, trackId: TrackId, rowIndex: RowIndex): TrackerRow | undefined {
    const trackData = this.getTrackData(patternId, trackId);
    return trackData?.rows[rowIndex as number];
  }
  
  // ========== PATTERN OPERATIONS ==========
  
  /**
   * Create a new pattern.
   */
  createPattern(name: string, length: number = 64): PatternId {
    const id = asPatternId(`pattern-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const config = createPatternConfig(id, name, length);
    
    // Create track data for all existing tracks
    const tracks = new Map<TrackId, TrackData>();
    for (const trackId of this.state.trackOrder) {
      const trackConfig = this.state.trackConfigs.get(trackId);
      if (trackConfig) {
        tracks.set(trackId, createTrackData(trackConfig, length));
      }
    }
    
    const pattern: Pattern = { config, tracks };
    
    this.pushUndo();
    this.state = {
      ...this.state,
      patterns: new Map([...this.state.patterns, [id, pattern]]),
      sequence: [...this.state.sequence, id],
      currentPatternId: this.state.currentPatternId ?? id,
    };
    this.notifySubscribers();
    
    return id;
  }
  
  /**
   * Duplicate a pattern.
   */
  duplicatePattern(patternId: PatternId, newName?: string): PatternId | null {
    const source = this.state.patterns.get(patternId);
    if (!source) return null;
    
    const newId = asPatternId(`pattern-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const config: PatternConfig = {
      ...source.config,
      id: newId,
      name: newName ?? `${source.config.name} (copy)`,
    };
    
    // Deep clone tracks
    const tracks = new Map<TrackId, TrackData>();
    for (const [trackId, trackData] of source.tracks) {
      tracks.set(trackId, {
        config: trackData.config,
        rows: trackData.rows.map(row => ({
          note: { ...row.note },
          effects: row.effects.map(eff => ({ effects: [...eff.effects] })),
        })),
      });
    }
    
    const pattern: Pattern = { config, tracks };
    
    this.pushUndo();
    const sequenceIndex = this.state.sequence.indexOf(patternId);
    const newSequence = [...this.state.sequence];
    newSequence.splice(sequenceIndex + 1, 0, newId);
    
    this.state = {
      ...this.state,
      patterns: new Map([...this.state.patterns, [newId, pattern]]),
      sequence: newSequence,
    };
    this.notifySubscribers();
    
    return newId;
  }
  
  /**
   * Delete a pattern.
   */
  deletePattern(patternId: PatternId): boolean {
    if (!this.state.patterns.has(patternId)) return false;
    
    this.pushUndo();
    const patterns = new Map(this.state.patterns);
    patterns.delete(patternId);
    
    const sequence = this.state.sequence.filter(id => id !== patternId);
    
    let currentPatternId = this.state.currentPatternId;
    if (currentPatternId === patternId) {
      currentPatternId = sequence[0] ?? null;
    }
    
    this.state = {
      ...this.state,
      patterns,
      sequence,
      currentPatternId,
    };
    this.notifySubscribers();
    
    return true;
  }
  
  /**
   * Set current pattern.
   */
  setCurrentPattern(patternId: PatternId): void {
    if (!this.state.patterns.has(patternId)) return;
    
    this.state = {
      ...this.state,
      currentPatternId: patternId,
    };
    this.notifySubscribers();
  }
  
  /**
   * Rename a pattern.
   */
  renamePattern(patternId: PatternId, newName: string): void {
    const pattern = this.state.patterns.get(patternId);
    if (!pattern) return;
    
    this.pushUndo();
    const patterns = new Map(this.state.patterns);
    patterns.set(patternId, {
      ...pattern,
      config: { ...pattern.config, name: newName },
    });
    
    this.state = { ...this.state, patterns };
    this.notifySubscribers();
  }
  
  /**
   * Resize pattern length.
   */
  resizePattern(patternId: PatternId, newLength: number): void {
    const pattern = this.state.patterns.get(patternId);
    if (!pattern) return;
    
    this.pushUndo();
    
    const tracks = new Map<TrackId, TrackData>();
    for (const [trackId, trackData] of pattern.tracks) {
      const rows = [...trackData.rows];
      
      if (newLength > rows.length) {
        // Add empty rows
        for (let i = rows.length; i < newLength; i++) {
          rows.push(emptyRow(trackData.config.effectColumns));
        }
      } else if (newLength < rows.length) {
        // Truncate rows
        rows.length = newLength;
      }
      
      tracks.set(trackId, { ...trackData, rows });
    }
    
    const patterns = new Map(this.state.patterns);
    patterns.set(patternId, {
      ...pattern,
      config: { ...pattern.config, length: newLength },
      tracks,
    });
    
    this.state = { ...this.state, patterns };
    this.notifySubscribers();
  }
  
  // ========== TRACK OPERATIONS ==========
  
  /**
   * Create a new track.
   */
  createTrack(name: string, type: TrackType = TrackType.Note): TrackId {
    const id = asTrackId(`track-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const config = createTrackConfig(id, name, type);
    
    this.pushUndo();
    
    // Add track config
    const trackConfigs = new Map([...this.state.trackConfigs, [id, config]]);
    const trackOrder = [...this.state.trackOrder, id];
    
    // Add track data to all patterns
    const patterns = new Map<PatternId, Pattern>();
    for (const [patternId, pattern] of this.state.patterns) {
      const tracks = new Map(pattern.tracks);
      tracks.set(id, createTrackData(config, pattern.config.length));
      patterns.set(patternId, { ...pattern, tracks });
    }
    
    this.state = {
      ...this.state,
      trackConfigs,
      trackOrder,
      patterns,
    };
    this.notifySubscribers();
    
    return id;
  }
  
  /**
   * Delete a track.
   */
  deleteTrack(trackId: TrackId): boolean {
    if (!this.state.trackConfigs.has(trackId)) return false;
    
    this.pushUndo();
    
    const trackConfigs = new Map(this.state.trackConfigs);
    trackConfigs.delete(trackId);
    
    const trackOrder = this.state.trackOrder.filter(id => id !== trackId);
    
    // Remove from all patterns
    const patterns = new Map<PatternId, Pattern>();
    for (const [patternId, pattern] of this.state.patterns) {
      const tracks = new Map(pattern.tracks);
      tracks.delete(trackId);
      patterns.set(patternId, { ...pattern, tracks });
    }
    
    this.state = {
      ...this.state,
      trackConfigs,
      trackOrder,
      patterns,
    };
    this.notifySubscribers();
    
    return true;
  }
  
  /**
   * Update track configuration.
   */
  updateTrackConfig(trackId: TrackId, updates: Partial<TrackConfig>): void {
    const config = this.state.trackConfigs.get(trackId);
    if (!config) return;
    
    this.pushUndo();
    
    const trackConfigs = new Map(this.state.trackConfigs);
    trackConfigs.set(trackId, { ...config, ...updates, id: trackId });
    
    // Update track data configs in patterns
    const patterns = new Map<PatternId, Pattern>();
    for (const [patternId, pattern] of this.state.patterns) {
      const trackData = pattern.tracks.get(trackId);
      if (trackData) {
        const tracks = new Map(pattern.tracks);
        tracks.set(trackId, { ...trackData, config: trackConfigs.get(trackId)! });
        patterns.set(patternId, { ...pattern, tracks });
      } else {
        patterns.set(patternId, pattern);
      }
    }
    
    this.state = {
      ...this.state,
      trackConfigs,
      patterns,
    };
    this.notifySubscribers();
  }
  
  /**
   * Reorder tracks.
   */
  reorderTracks(newOrder: readonly TrackId[]): void {
    // Validate all tracks exist
    if (!newOrder.every(id => this.state.trackConfigs.has(id))) return;
    if (newOrder.length !== this.state.trackOrder.length) return;
    
    this.pushUndo();
    this.state = {
      ...this.state,
      trackOrder: [...newOrder],
    };
    this.notifySubscribers();
  }
  
  // ========== CELL EDITING ==========
  
  /**
   * Set note cell.
   */
  setNote(patternId: PatternId, trackId: TrackId, rowIndex: RowIndex, note: NoteCell): void {
    const pattern = this.state.patterns.get(patternId);
    if (!pattern) return;
    
    const trackData = pattern.tracks.get(trackId);
    if (!trackData) return;
    
    const rowIdx = rowIndex as number;
    if (rowIdx < 0 || rowIdx >= trackData.rows.length) return;
    
    this.pushUndo();
    
    const rows = [...trackData.rows];
    const existingRow = rows[rowIdx];
    if (!existingRow) return;
    rows[rowIdx] = { ...existingRow, note };
    
    const tracks = new Map(pattern.tracks);
    tracks.set(trackId, { ...trackData, rows });
    
    const patterns = new Map(this.state.patterns);
    patterns.set(patternId, { ...pattern, tracks });
    
    this.state = { ...this.state, patterns };
    this.notifySubscribers();
  }
  
  /**
   * Set effect cell.
   */
  setEffect(
    patternId: PatternId, 
    trackId: TrackId, 
    rowIndex: RowIndex, 
    effectColumn: number,
    effect: EffectCell
  ): void {
    const pattern = this.state.patterns.get(patternId);
    if (!pattern) return;
    
    const trackData = pattern.tracks.get(trackId);
    if (!trackData) return;
    
    const rowIdx = rowIndex as number;
    if (rowIdx < 0 || rowIdx >= trackData.rows.length) return;
    const existingRow = trackData.rows[rowIdx];
    if (!existingRow) return;
    if (effectColumn < 0 || effectColumn >= existingRow.effects.length) return;
    
    this.pushUndo();
    
    const rows = [...trackData.rows];
    const row = rows[rowIdx];
    if (!row) return;
    const effects = [...row.effects];
    effects[effectColumn] = effect;
    rows[rowIdx] = { ...row, effects };
    
    const tracks = new Map(pattern.tracks);
    tracks.set(trackId, { ...trackData, rows });
    
    const patterns = new Map(this.state.patterns);
    patterns.set(patternId, { ...pattern, tracks });
    
    this.state = { ...this.state, patterns };
    this.notifySubscribers();
  }
  
  /**
   * Add effect command to a cell.
   */
  addEffectCommand(
    patternId: PatternId,
    trackId: TrackId,
    rowIndex: RowIndex,
    effectColumn: number,
    command: EffectCommand
  ): void {
    const row = this.getRow(patternId, trackId, rowIndex);
    if (!row) return;
    if (effectColumn < 0 || effectColumn >= row.effects.length) return;
    
    const effectCell = row.effects[effectColumn];
    if (!effectCell) return;
    const existingEffects = effectCell.effects;
    this.setEffect(patternId, trackId, rowIndex, effectColumn, {
      effects: [...existingEffects, command],
    });
  }
  
  /**
   * Clear a row.
   */
  clearRow(patternId: PatternId, trackId: TrackId, rowIndex: RowIndex): void {
    const pattern = this.state.patterns.get(patternId);
    if (!pattern) return;
    
    const trackData = pattern.tracks.get(trackId);
    if (!trackData) return;
    
    const rowIdx = rowIndex as number;
    if (rowIdx < 0 || rowIdx >= trackData.rows.length) return;
    
    this.pushUndo();
    
    const rows = [...trackData.rows];
    rows[rowIdx] = emptyRow(trackData.config.effectColumns);
    
    const tracks = new Map(pattern.tracks);
    tracks.set(trackId, { ...trackData, rows });
    
    const patterns = new Map(this.state.patterns);
    patterns.set(patternId, { ...pattern, tracks });
    
    this.state = { ...this.state, patterns };
    this.notifySubscribers();
  }
  
  // ========== BATCH OPERATIONS ==========
  
  /**
   * Transpose notes in a range.
   */
  transpose(
    patternId: PatternId,
    trackId: TrackId,
    startRow: RowIndex,
    endRow: RowIndex,
    semitones: number
  ): void {
    const pattern = this.state.patterns.get(patternId);
    if (!pattern) return;
    
    const trackData = pattern.tracks.get(trackId);
    if (!trackData) return;
    
    this.pushUndo();
    
    const rows = [...trackData.rows];
    const start = Math.max(0, startRow as number);
    const end = Math.min(rows.length - 1, endRow as number);
    
    for (let i = start; i <= end; i++) {
      const row = rows[i];
      if (!row) continue;
      const note = row.note;
      if (note.note >= 0 && note.note <= 127) {
        const newNote = Math.max(0, Math.min(127, (note.note as number) + semitones));
        rows[i] = {
          ...row,
          note: { ...note, note: asMidiNote(newNote) },
        };
      }
    }
    
    const tracks = new Map(pattern.tracks);
    tracks.set(trackId, { ...trackData, rows });
    
    const patterns = new Map(this.state.patterns);
    patterns.set(patternId, { ...pattern, tracks });
    
    this.state = { ...this.state, patterns };
    this.notifySubscribers();
  }
  
  /**
   * Scale velocities in a range.
   */
  scaleVelocity(
    patternId: PatternId,
    trackId: TrackId,
    startRow: RowIndex,
    endRow: RowIndex,
    multiplier: number
  ): void {
    const pattern = this.state.patterns.get(patternId);
    if (!pattern) return;
    
    const trackData = pattern.tracks.get(trackId);
    if (!trackData) return;
    
    this.pushUndo();
    
    const rows = [...trackData.rows];
    const start = Math.max(0, startRow as number);
    const end = Math.min(rows.length - 1, endRow as number);
    
    for (let i = start; i <= end; i++) {
      const row = rows[i];
      if (!row) continue;
      const note = row.note;
      if (note.volume !== undefined) {
        const newVelocity = Math.max(0, Math.min(127, Math.round((note.volume as number) * multiplier)));
        rows[i] = {
          ...row,
          note: { ...note, volume: asVelocity(newVelocity) },
        };
      }
    }
    
    const tracks = new Map(pattern.tracks);
    tracks.set(trackId, { ...trackData, rows });
    
    const patterns = new Map(this.state.patterns);
    patterns.set(patternId, { ...pattern, tracks });
    
    this.state = { ...this.state, patterns };
    this.notifySubscribers();
  }
  
  /**
   * Humanize timing (add random delay).
   */
  humanizeTiming(
    patternId: PatternId,
    trackId: TrackId,
    startRow: RowIndex,
    endRow: RowIndex,
    amount: number  // 0-100
  ): void {
    const pattern = this.state.patterns.get(patternId);
    if (!pattern) return;
    
    const trackData = pattern.tracks.get(trackId);
    if (!trackData) return;
    
    this.pushUndo();
    
    const rows = [...trackData.rows];
    const start = Math.max(0, startRow as number);
    const end = Math.min(rows.length - 1, endRow as number);
    const maxDelay = Math.floor(amount * 2.55);  // 0-255
    
    for (let i = start; i <= end; i++) {
      const row = rows[i];
      if (!row) continue;
      const note = row.note;
      if (note.note >= 0) {
        const delay = Math.floor(Math.random() * maxDelay);
        rows[i] = {
          ...row,
          note: { ...note, delay },
        };
      }
    }
    
    const tracks = new Map(pattern.tracks);
    tracks.set(trackId, { ...trackData, rows });
    
    const patterns = new Map(this.state.patterns);
    patterns.set(patternId, { ...pattern, tracks });
    
    this.state = { ...this.state, patterns };
    this.notifySubscribers();
  }
  
  // ========== CLIPBOARD OPERATIONS ==========
  
  /**
   * Copy selection to clipboard.
   */
  copySelection(): void {
    const selection = this.state.selection;
    if (!selection.primary) return;
    
    const { start, end } = selection.primary;
    const pattern = this.state.patterns.get(start.patternId);
    if (!pattern) return;
    
    const data = new Map<TrackId, TrackerRow[]>();
    
    // Get all tracks in selection
    const startTrackIdx = this.state.trackOrder.indexOf(start.trackId);
    const endTrackIdx = this.state.trackOrder.indexOf(end.trackId);
    const minTrackIdx = Math.min(startTrackIdx, endTrackIdx);
    const maxTrackIdx = Math.max(startTrackIdx, endTrackIdx);
    
    const minRow = Math.min(start.row as number, end.row as number);
    const maxRow = Math.max(start.row as number, end.row as number);
    
    for (let t = minTrackIdx; t <= maxTrackIdx; t++) {
      const trackId = this.state.trackOrder[t];
      if (!trackId) continue;
      const trackData = pattern.tracks.get(trackId);
      if (!trackData) continue;
      
      const rows: TrackerRow[] = [];
      for (let r = minRow; r <= maxRow; r++) {
        const row = trackData.rows[r];
        if (!row) {
          rows.push(emptyRow(trackData.config.effectColumns));
          continue;
        }
        rows.push({
          note: { ...row.note },
          effects: row.effects.map(e => ({ effects: [...e.effects] })),
        });
      }
      data.set(trackId, rows);
    }
    
    this.state = {
      ...this.state,
      clipboard: {
        type: 'mixed',
        sourcePattern: start.patternId,
        sourceTracks: this.state.trackOrder.slice(minTrackIdx, maxTrackIdx + 1),
        rowRange: { start: asRowIndex(minRow), end: asRowIndex(maxRow) },
        data,
        timestamp: Date.now(),
        includeMetadata: true,
      },
    };
    this.notifySubscribers();
  }
  
  /**
   * Paste from clipboard.
   */
  paste(mode: 'replace' | 'merge' = 'replace'): void {
    const clipboard = this.state.clipboard;
    if (!clipboard) return;
    
    const cursor = this.state.cursor;
    if (!cursor) return;
    
    const pattern = this.state.patterns.get(cursor.patternId);
    if (!pattern) return;
    
    this.pushUndo();
    
    const patterns = new Map(this.state.patterns);
    const tracks = new Map(pattern.tracks);
    
    const startTrackIdx = this.state.trackOrder.indexOf(cursor.trackId);
    const startRow = cursor.row as number;
    
    let clipboardTrackIdx = 0;
    for (const sourceRows of clipboard.data.values()) {
      const targetTrackIdx = startTrackIdx + clipboardTrackIdx;
      if (targetTrackIdx >= this.state.trackOrder.length) break;
      
      const targetTrackId = this.state.trackOrder[targetTrackIdx];
      if (!targetTrackId) break;
      const trackData = tracks.get(targetTrackId);
      if (!trackData) continue;
      
      const rows = [...trackData.rows];
      
      for (let i = 0; i < sourceRows.length; i++) {
        const targetRow = startRow + i;
        if (targetRow >= rows.length) break;

        const sourceRow = sourceRows[i];
        if (!sourceRow) continue;
        
        if (mode === 'replace') {
          rows[targetRow] = {
            note: { ...sourceRow.note },
            effects: sourceRow.effects.map(e => ({ effects: [...e.effects] })),
          };
        } else {
          // Merge mode: only replace non-empty cells
          const existingTargetRow = rows[targetRow];
          if (!existingTargetRow) continue;

          let nextRow: TrackerRow = existingTargetRow;

          const sourceNote = sourceRow.note;
          if (sourceNote.note !== SpecialNote.Empty) {
            nextRow = { ...nextRow, note: { ...sourceNote } };
          }
          
          const targetEffects = [...nextRow.effects];
          for (let e = 0; e < sourceRow.effects.length && e < targetEffects.length; e++) {
            const sourceEffectCell = sourceRow.effects[e];
            if (!sourceEffectCell) continue;
            if (sourceEffectCell.effects.length > 0) {
              targetEffects[e] = { effects: [...sourceEffectCell.effects] };
            }
          }
          nextRow = { ...nextRow, effects: targetEffects };
          rows[targetRow] = nextRow;
        }
      }
      
      tracks.set(targetTrackId, { ...trackData, rows });
      clipboardTrackIdx++;
    }
    
    patterns.set(cursor.patternId, { ...pattern, tracks });
    this.state = { ...this.state, patterns };
    this.notifySubscribers();
  }
  
  /**
   * Cut selection (copy + delete).
   */
  cutSelection(): void {
    this.copySelection();
    this.deleteSelection();
  }
  
  /**
   * Delete selection.
   */
  deleteSelection(): void {
    const selection = this.state.selection;
    if (!selection.primary) return;
    
    const { start, end } = selection.primary;
    const pattern = this.state.patterns.get(start.patternId);
    if (!pattern) return;
    
    this.pushUndo();
    
    const startTrackIdx = this.state.trackOrder.indexOf(start.trackId);
    const endTrackIdx = this.state.trackOrder.indexOf(end.trackId);
    const minTrackIdx = Math.min(startTrackIdx, endTrackIdx);
    const maxTrackIdx = Math.max(startTrackIdx, endTrackIdx);
    
    const minRow = Math.min(start.row as number, end.row as number);
    const maxRow = Math.max(start.row as number, end.row as number);
    
    const patterns = new Map(this.state.patterns);
    const tracks = new Map(pattern.tracks);
    
    for (let t = minTrackIdx; t <= maxTrackIdx; t++) {
      const trackId = this.state.trackOrder[t];
      if (!trackId) continue;
      const trackData = tracks.get(trackId);
      if (!trackData) continue;
      
      const rows = [...trackData.rows];
      for (let r = minRow; r <= maxRow; r++) {
        rows[r] = emptyRow(trackData.config.effectColumns);
      }
      tracks.set(trackId, { ...trackData, rows });
    }
    
    patterns.set(start.patternId, { ...pattern, tracks });
    this.state = {
      ...this.state,
      patterns,
      selection: emptySelection(),
    };
    this.notifySubscribers();
  }
  
  // ========== CURSOR & SELECTION ==========
  
  /**
   * Set cursor position.
   */
  setCursor(cursor: CursorPosition | null): void {
    this.state = { ...this.state, cursor };
    this.notifySubscribers();
  }
  
  /**
   * Set selection.
   */
  setSelection(selection: TrackerSelection): void {
    this.state = { ...this.state, selection };
    this.notifySubscribers();
  }
  
  /**
   * Start selection from cursor.
   */
  startSelection(): void {
    const cursor = this.state.cursor;
    if (!cursor) return;
    
    const anchor: SelectionAnchor = {
      patternId: cursor.patternId,
      trackId: cursor.trackId,
      row: cursor.row,
      column: cursor.column,
      subColumn: cursor.subColumn,
      effectIndex: cursor.effectIndex,
    };
    
    this.state = {
      ...this.state,
      selection: {
        primary: { start: anchor, end: anchor },
        additional: [],
        active: true,
      },
    };
    this.notifySubscribers();
  }
  
  /**
   * Extend selection to cursor.
   */
  extendSelection(): void {
    const cursor = this.state.cursor;
    const selection = this.state.selection;
    if (!cursor || !selection.primary) return;
    
    const end: SelectionAnchor = {
      patternId: cursor.patternId,
      trackId: cursor.trackId,
      row: cursor.row,
      column: cursor.column,
      subColumn: cursor.subColumn,
      effectIndex: cursor.effectIndex,
    };
    
    this.state = {
      ...this.state,
      selection: {
        ...selection,
        primary: { ...selection.primary, end },
      },
    };
    this.notifySubscribers();
  }
  
  /**
   * Clear selection.
   */
  clearSelection(): void {
    this.state = {
      ...this.state,
      selection: emptySelection(),
    };
    this.notifySubscribers();
  }
  
  // ========== UNDO/REDO ==========
  
  private pushUndo(): void {
    const undoStack = [...this.state.undoStack, this.state];
    if (undoStack.length > this.maxUndoHistory) {
      undoStack.shift();
    }
    this.state = {
      ...this.state,
      undoStack,
      redoStack: [],
    };
  }
  
  /**
   * Undo last operation.
   */
  undo(): boolean {
    if (this.state.undoStack.length === 0) return false;
    
    const undoStack = [...this.state.undoStack];
    const previousState = undoStack.pop()!;
    
    const redoStack = [...this.state.redoStack, this.state];
    
    this.state = {
      ...previousState,
      undoStack,
      redoStack,
    };
    this.notifySubscribers();
    return true;
  }
  
  /**
   * Redo last undone operation.
   */
  redo(): boolean {
    if (this.state.redoStack.length === 0) return false;
    
    const redoStack = [...this.state.redoStack];
    const nextState = redoStack.pop()!;
    
    const undoStack = [...this.state.undoStack, this.state];
    
    this.state = {
      ...nextState,
      undoStack,
      redoStack,
    };
    this.notifySubscribers();
    return true;
  }
  
  // ========== SYNC WITH EVENT STORE ==========
  
  /**
   * Convert pattern to events and sync with SharedEventStore.
   */
  syncToEventStore(patternId: PatternId, trackId: TrackId): EventStreamId | null {
    const pattern = this.state.patterns.get(patternId);
    if (!pattern) return null;
    
    const trackData = pattern.tracks.get(trackId);
    if (!trackData) return null;
    
    const store = getSharedEventStore();
    type TrackerNotePayload = {
      pitch: number;
      velocity: number;
      pan?: number;
      instrument?: unknown;
    };
    const events: Event<TrackerNotePayload>[] = [];
    
    const ticksPerRow = this.ppq / pattern.config.rowsPerBeat;
    
    for (let rowIdx = 0; rowIdx < trackData.rows.length; rowIdx++) {
      const row = trackData.rows[rowIdx];
      if (!row) continue;
      const note = row.note;
      
      if (note.note >= 0 && note.note <= 127) {
        const start = rowIdx * ticksPerRow + (note.delay ?? 0);
        
        // Find duration (until next note or note-off)
        let duration = ticksPerRow;
        for (let nextRow = rowIdx + 1; nextRow < trackData.rows.length; nextRow++) {
          const next = trackData.rows[nextRow];
          if (!next) continue;
          const nextNote = next.note.note;
          if (nextNote === SpecialNote.NoteOff || nextNote === SpecialNote.NoteCut || nextNote >= 0) {
            duration = (nextRow - rowIdx) * ticksPerRow;
            break;
          }
        }
        
        events.push(
          createEvent<TrackerNotePayload>({
            kind: EventKinds.NOTE,
            start,
            duration,
            payload: {
              pitch: note.note as number,
              velocity: note.volume === undefined ? 100 : Number(note.volume),
              ...(note.pan === undefined ? {} : { pan: note.pan }),
              ...(note.instrument === undefined ? {} : { instrument: note.instrument }),
            },
          })
        );
      }
    }
    
    // Create or update stream
    let streamId = trackData.config.streamId;
    if (!streamId) {
      const created = store.createStream({
        name: `${pattern.config.name}:${trackData.config.name}`,
        events,
      });
      streamId = created.id;
      this.updateTrackConfig(trackId, { streamId });
    } else {
      store.updateStream(streamId, () => ({ events }));
    }
    
    return streamId ?? null;
  }
  
  /**
   * Import events from SharedEventStore into pattern.
   */
  importFromEventStore(streamId: EventStreamId, patternId: PatternId, trackId: TrackId): void {
    const store = getSharedEventStore();
    const stream = store.getStream(streamId);
    if (!stream) return;
    
    const pattern = this.state.patterns.get(patternId);
    if (!pattern) return;
    
    const trackData = pattern.tracks.get(trackId);
    if (!trackData) return;
    
    this.pushUndo();
    
    const ticksPerRow = this.ppq / pattern.config.rowsPerBeat;
    const rows = Array.from({ length: trackData.rows.length }, () =>
      emptyRow(trackData.config.effectColumns)
    );
    
    for (const event of stream.events) {
      const rowIdx = Math.floor((event.startTick as number) / ticksPerRow);
      if (rowIdx >= 0 && rowIdx < rows.length) {
        const row = rows[rowIdx];
        if (!row) continue;

        const payload = event.payload as { pitch?: unknown; velocity?: unknown; pan?: unknown; instrument?: unknown };
        const noteCell: NoteCell = {
          note: asMidiNote(Number(payload.pitch ?? 60)),
          ...(payload.velocity === undefined ? {} : { volume: asVelocity(Number(payload.velocity)) }),
          ...(typeof payload.pan === 'number' ? { pan: payload.pan } : {}),
          ...(payload.instrument === undefined ? {} : { instrument: payload.instrument as any }),
          delay: (event.startTick as number) % ticksPerRow,
        };

        rows[rowIdx] = { ...row, note: noteCell };
      }
    }
    
    const tracks = new Map(pattern.tracks);
    tracks.set(trackId, { ...trackData, rows, config: { ...trackData.config, streamId } });
    
    const patterns = new Map(this.state.patterns);
    patterns.set(patternId, { ...pattern, tracks });
    
    this.state = { ...this.state, patterns };
    this.notifySubscribers();
  }
  
  // ========== SUBSCRIPTIONS ==========
  
  /**
   * Subscribe to state changes.
   */
  subscribe(callback: (state: TrackerState) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  private notifySubscribers(): void {
    for (const callback of this.subscribers) {
      callback(this.state);
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let storeInstance: PatternStore | null = null;

/**
 * Get or create the pattern store singleton.
 */
export function getPatternStore(): PatternStore {
  if (!storeInstance) {
    storeInstance = new PatternStore();
  }
  return storeInstance;
}

/**
 * Reset the pattern store (for testing).
 */
export function resetPatternStore(): void {
  storeInstance = null;
}
