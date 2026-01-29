/**
 * @fileoverview Tracker Phrase System
 * 
 * Implements Renoise-style phrases - reusable micro-patterns that can be
 * triggered within a track. Phrases enable:
 * - Complex arpeggios and runs
 * - Drum rolls and fills
 * - Reusable melodic fragments
 * - Generator-created variations
 * 
 * Integration with CardPlay:
 * - Phrases can be triggered by cards
 * - Generator output can be stored as phrases
 * - Phrases can reference other phrases (nesting)
 * - Live phrase manipulation during playback
 */

import {
  PhraseId,
  asPhraseId,
  TrackerRow,
  NoteCell,
  EffectCell,
  emptyRow,
  noteCell,
  asMidiNote,
  asVelocity,
} from './types';

// =============================================================================
// PHRASE TYPES
// =============================================================================

/** Phrase playback mode */
export enum PhrasePlayMode {
  /** Play once and stop */
  OneShot = 'one-shot',
  /** Loop continuously */
  Loop = 'loop',
  /** Ping-pong (forward then backward) */
  PingPong = 'ping-pong',
  /** Random row each tick */
  Random = 'random',
  /** Follow program/generator sequence */
  Program = 'program',
}

/** How phrase notes interact with trigger note */
export enum PhraseKeyMode {
  /** Phrase plays as-is, ignoring trigger note */
  Absolute = 'absolute',
  /** Phrase transposes relative to trigger note (C-4 = no transpose) */
  Relative = 'relative',
  /** All phrase notes become the trigger note */
  Mono = 'mono',
}

/** Phrase timing configuration */
export interface PhraseTiming {
  /** Lines per beat (phrase internal LPB) */
  lpb: number;
  /** Auto-sync to pattern tempo */
  syncToPattern: boolean;
  /** Loop start line (for Loop/PingPong modes) */
  loopStart: number;
  /** Loop end line (for Loop/PingPong modes) */
  loopEnd: number;
  /** Auto-fit to note length */
  autoFit: boolean;
}

/** Phrase configuration */
export interface PhraseConfig {
  id: PhraseId;
  name: string;
  length: number;
  playMode: PhrasePlayMode;
  keyMode: PhraseKeyMode;
  baseNote: number; // Reference note for relative mode (usually C-4 = 60)
  timing: PhraseTiming;
  volume: number; // 0-255, phrase volume scaling
  monophonic: boolean; // Cut previous phrase when retriggered
}

/** Complete phrase data */
export interface Phrase {
  config: PhraseConfig;
  rows: TrackerRow[];
  /** Optional generator ID that created this phrase */
  sourceGenerator?: string;
  /** Optional card ID that owns this phrase */
  sourceCard?: string;
  /** Tags for organization */
  tags: string[];
}

/** Phrase playback state */
export interface PhrasePlaybackState {
  phraseId: PhraseId;
  currentLine: number;
  direction: 1 | -1; // For ping-pong
  transposeOffset: number;
  volumeScale: number; // 0-1
  tickCounter: number;
  triggerNote: number; // Note that triggered this phrase
  finished: boolean;
}

// =============================================================================
// PHRASE STORE
// =============================================================================

/** Phrase storage and management */
export class PhraseStore {
  private phrases: Map<PhraseId, Phrase> = new Map();
  private phrasesByName: Map<string, PhraseId> = new Map();
  private phrasesByTag: Map<string, Set<PhraseId>> = new Map();
  private activePlayback: Map<string, PhrasePlaybackState> = new Map(); // channelKey -> state
  
  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------
  
  /**
   * Create a new phrase
   */
  createPhrase(config: Partial<PhraseConfig> & { name: string }): Phrase {
    const id = asPhraseId(crypto.randomUUID());
    
    const fullConfig: PhraseConfig = {
      id,
      name: config.name,
      length: config.length ?? 16,
      playMode: config.playMode ?? PhrasePlayMode.OneShot,
      keyMode: config.keyMode ?? PhraseKeyMode.Relative,
      baseNote: config.baseNote ?? 60, // C-4
      timing: config.timing ?? {
        lpb: 4,
        syncToPattern: true,
        loopStart: 0,
        loopEnd: config.length ?? 16,
        autoFit: false,
      },
      volume: config.volume ?? 255,
      monophonic: config.monophonic ?? true,
    };
    
    // Create empty rows
    const rows: TrackerRow[] = [];
    for (let i = 0; i < fullConfig.length; i++) {
      rows.push(emptyRow(1)); // Single track per phrase
    }
    
    const phrase: Phrase = {
      config: fullConfig,
      rows,
      tags: [],
    };
    
    this.phrases.set(id, phrase);
    this.phrasesByName.set(config.name.toLowerCase(), id);
    
    return phrase;
  }
  
  /**
   * Get phrase by ID
   */
  getPhrase(id: PhraseId): Phrase | undefined {
    return this.phrases.get(id);
  }
  
  /**
   * Get phrase by name (case-insensitive)
   */
  getPhraseByName(name: string): Phrase | undefined {
    const id = this.phrasesByName.get(name.toLowerCase());
    return id ? this.phrases.get(id) : undefined;
  }
  
  /**
   * Get all phrases with a specific tag
   */
  getPhrasesByTag(tag: string): Phrase[] {
    const ids = this.phrasesByTag.get(tag.toLowerCase());
    if (!ids) return [];
    return Array.from(ids)
      .map(id => this.phrases.get(id))
      .filter((p): p is Phrase => p !== undefined);
  }
  
  /**
   * Update phrase configuration
   */
  updatePhraseConfig(id: PhraseId, updates: Partial<PhraseConfig>): boolean {
    const phrase = this.phrases.get(id);
    if (!phrase) return false;
    
    // Handle name change
    if (updates.name && updates.name !== phrase.config.name) {
      this.phrasesByName.delete(phrase.config.name.toLowerCase());
      this.phrasesByName.set(updates.name.toLowerCase(), id);
    }
    
    phrase.config = { ...phrase.config, ...updates };
    return true;
  }
  
  /**
   * Delete a phrase
   */
  deletePhrase(id: PhraseId): boolean {
    const phrase = this.phrases.get(id);
    if (!phrase) return false;
    
    this.phrasesByName.delete(phrase.config.name.toLowerCase());
    
    for (const tag of phrase.tags) {
      const tagSet = this.phrasesByTag.get(tag.toLowerCase());
      if (tagSet) {
        tagSet.delete(id);
        if (tagSet.size === 0) {
          this.phrasesByTag.delete(tag.toLowerCase());
        }
      }
    }
    
    this.phrases.delete(id);
    return true;
  }
  
  /**
   * List all phrases
   */
  getAllPhrases(): Phrase[] {
    return Array.from(this.phrases.values());
  }
  
  // --------------------------------------------------------------------------
  // Tag Management
  // --------------------------------------------------------------------------
  
  /**
   * Add tag to phrase
   */
  addTag(id: PhraseId, tag: string): boolean {
    const phrase = this.phrases.get(id);
    if (!phrase) return false;
    
    const normalizedTag = tag.toLowerCase();
    if (phrase.tags.includes(normalizedTag)) return true;
    
    phrase.tags.push(normalizedTag);
    
    let tagSet = this.phrasesByTag.get(normalizedTag);
    if (!tagSet) {
      tagSet = new Set();
      this.phrasesByTag.set(normalizedTag, tagSet);
    }
    tagSet.add(id);
    
    return true;
  }
  
  /**
   * Remove tag from phrase
   */
  removeTag(id: PhraseId, tag: string): boolean {
    const phrase = this.phrases.get(id);
    if (!phrase) return false;
    
    const normalizedTag = tag.toLowerCase();
    const index = phrase.tags.indexOf(normalizedTag);
    if (index < 0) return false;
    
    phrase.tags.splice(index, 1);
    
    const tagSet = this.phrasesByTag.get(normalizedTag);
    if (tagSet) {
      tagSet.delete(id);
      if (tagSet.size === 0) {
        this.phrasesByTag.delete(normalizedTag);
      }
    }
    
    return true;
  }
  
  // --------------------------------------------------------------------------
  // Row Editing
  // --------------------------------------------------------------------------
  
  /**
   * Set note in phrase row
   */
  setNote(id: PhraseId, row: number, note: NoteCell): boolean {
    const phrase = this.phrases.get(id);
    if (!phrase || row < 0 || row >= phrase.rows.length) return false;
    
    const existingRow = phrase.rows[row];
    if (!existingRow) return false;
    phrase.rows[row] = { ...existingRow, note };
    return true;
  }
  
  /**
   * Set effect in phrase row
   */
  setEffect(id: PhraseId, row: number, effectIndex: number, fx: EffectCell): boolean {
    const phrase = this.phrases.get(id);
    if (!phrase || row < 0 || row >= phrase.rows.length) return false;
    
    const existingRow = phrase.rows[row];
    if (!existingRow) return false;

    const effects = [...existingRow.effects];
    while (effects.length <= effectIndex) {
      effects.push({ effects: [] });
    }
    effects[effectIndex] = fx;
    phrase.rows[row] = { ...existingRow, effects };
    return true;
  }
  
  /**
   * Resize phrase (add/remove rows)
   */
  resize(id: PhraseId, newLength: number): boolean {
    const phrase = this.phrases.get(id);
    if (!phrase || newLength < 1 || newLength > 512) return false;
    
    while (phrase.rows.length < newLength) {
      phrase.rows.push(emptyRow(1));
    }
    phrase.rows.length = newLength;
    phrase.config.length = newLength;
    phrase.config.timing.loopEnd = Math.min(phrase.config.timing.loopEnd, newLength);
    
    return true;
  }
  
  // --------------------------------------------------------------------------
  // Phrase Playback
  // --------------------------------------------------------------------------
  
  /**
   * Start phrase playback on a channel
   */
  startPhrase(
    channelKey: string,
    phraseId: PhraseId,
    triggerNote: number,
    volumeScale: number = 1.0,
  ): PhrasePlaybackState | undefined {
    const phrase = this.phrases.get(phraseId);
    if (!phrase) return undefined;
    
    // Calculate transpose offset
    let transposeOffset = 0;
    if (phrase.config.keyMode === PhraseKeyMode.Relative) {
      transposeOffset = triggerNote - phrase.config.baseNote;
    }
    
    const state: PhrasePlaybackState = {
      phraseId,
      currentLine: 0,
      direction: 1,
      transposeOffset,
      volumeScale,
      tickCounter: 0,
      triggerNote,
      finished: false,
    };
    
    // Handle monophonic - stop existing phrase on same channel
    if (phrase.config.monophonic) {
      this.stopPhrase(channelKey);
    }
    
    this.activePlayback.set(channelKey, state);
    return state;
  }
  
  /**
   * Stop phrase playback on a channel
   */
  stopPhrase(channelKey: string): boolean {
    return this.activePlayback.delete(channelKey);
  }
  
  /**
   * Advance phrase playback by one tick
   */
  advanceTick(channelKey: string): TrackerRow | undefined {
    const state = this.activePlayback.get(channelKey);
    if (!state || state.finished) return undefined;
    
    const phrase = this.phrases.get(state.phraseId);
    if (!phrase) return undefined;
    
    // Check if we need to advance line (based on phrase LPB vs pattern tick)
    state.tickCounter++;
    
    // Simple tick-per-line for now (phrase LPB handling would go here)
    const ticksPerLine = phrase.config.timing.syncToPattern ? 1 : 6; // TODO: Calculate from LPB
    
    if (state.tickCounter >= ticksPerLine) {
      state.tickCounter = 0;
      
      // Advance line based on play mode
      switch (phrase.config.playMode) {
        case PhrasePlayMode.OneShot:
          state.currentLine++;
          if (state.currentLine >= phrase.config.length) {
            state.finished = true;
          }
          break;
          
        case PhrasePlayMode.Loop:
          state.currentLine++;
          if (state.currentLine >= phrase.config.timing.loopEnd) {
            state.currentLine = phrase.config.timing.loopStart;
          }
          break;
          
        case PhrasePlayMode.PingPong:
          state.currentLine += state.direction;
          if (state.currentLine >= phrase.config.timing.loopEnd - 1) {
            state.direction = -1;
          } else if (state.currentLine <= phrase.config.timing.loopStart) {
            state.direction = 1;
          }
          break;
          
        case PhrasePlayMode.Random:
          state.currentLine = Math.floor(
            Math.random() * (phrase.config.timing.loopEnd - phrase.config.timing.loopStart)
          ) + phrase.config.timing.loopStart;
          break;
          
        case PhrasePlayMode.Program:
          // Would integrate with generator/sequencer here
          state.currentLine++;
          if (state.currentLine >= phrase.config.length) {
            state.currentLine = 0;
          }
          break;
      }
    }
    
    if (state.finished) return undefined;
    
    // Get row and apply transformations
    const row = phrase.rows[state.currentLine];
    if (!row) return undefined;
    
    return this.transformRow(row, state, phrase);
  }
  
  /**
   * Transform phrase row based on playback state
   */
  private transformRow(row: TrackerRow, state: PhrasePlaybackState, phrase: Phrase): TrackerRow {
    const note = row.note;
    const noteValue = note.note as number;

    let nextNote = note.note;
    let nextVolume = note.volume;
    let changed = false;

    // Apply transpose
    if (noteValue >= 0 && noteValue <= 127) {
      if (phrase.config.keyMode === PhraseKeyMode.Relative && state.transposeOffset !== 0) {
        const pitch = Math.max(0, Math.min(127, noteValue + state.transposeOffset));
        nextNote = asMidiNote(pitch);
        changed = true;
      } else if (phrase.config.keyMode === PhraseKeyMode.Mono) {
        nextNote = asMidiNote(state.triggerNote);
        changed = true;
      }
    }

    // Apply volume scaling (tracker uses "volume" = velocity).
    if (note.volume !== undefined) {
      let v = Number(note.volume);
      if (state.volumeScale !== 1.0) {
        v = Math.round(v * state.volumeScale);
      }
      if (phrase.config.volume !== 255) {
        v = Math.round(v * (phrase.config.volume / 255));
      }
      v = Math.max(0, Math.min(127, v));
      const scaled = asVelocity(v);
      if (scaled !== note.volume) {
        nextVolume = scaled;
        changed = true;
      }
    }

    if (!changed) return row;
    return {
      ...row,
      note: {
        ...note,
        ...(nextNote === note.note ? {} : { note: nextNote }),
        ...(nextVolume === note.volume || nextVolume === undefined ? {} : { volume: nextVolume }),
      },
    };
  }
  
  /**
   * Get current line being played for a channel
   */
  getCurrentLine(channelKey: string): number | undefined {
    const state = this.activePlayback.get(channelKey);
    return state?.currentLine;
  }
  
  /**
   * Check if phrase is playing on channel
   */
  isPlaying(channelKey: string): boolean {
    const state = this.activePlayback.get(channelKey);
    return state !== undefined && !state.finished;
  }
  
  // --------------------------------------------------------------------------
  // Import/Export
  // --------------------------------------------------------------------------
  
  /**
   * Import phrase from JSON
   */
  importPhrase(data: unknown): Phrase | undefined {
    try {
      const parsed = data as Partial<Phrase>;
      if (!parsed.config?.name || !Array.isArray(parsed.rows)) {
        return undefined;
      }
      
      const phrase = this.createPhrase(parsed.config);
      
      // Copy rows
      for (let i = 0; i < Math.min(parsed.rows.length, phrase.rows.length); i++) {
        const row = parsed.rows[i];
        if (row) {
          phrase.rows[i] = row;
        }
      }
      
      // Copy metadata
      if (parsed.sourceGenerator) phrase.sourceGenerator = parsed.sourceGenerator;
      if (parsed.sourceCard) phrase.sourceCard = parsed.sourceCard;
      if (parsed.tags) {
        for (const tag of parsed.tags) {
          this.addTag(phrase.config.id, tag);
        }
      }
      
      return phrase;
    } catch {
      return undefined;
    }
  }
  
  /**
   * Export phrase to JSON
   */
  exportPhrase(id: PhraseId): unknown | undefined {
    const phrase = this.phrases.get(id);
    if (!phrase) return undefined;
    
    return JSON.parse(JSON.stringify(phrase));
  }
  
  /**
   * Create phrase from pattern selection
   */
  createFromSelection(
    name: string,
    rows: TrackerRow[],
    _sourceTrack: number = 0,
  ): Phrase {
    void _sourceTrack;
    const phrase = this.createPhrase({
      name,
      length: rows.length,
    });
    
    // Copy selected rows to phrase (phrases are single-track).
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      phrase.rows[i] = {
        note: { ...row.note },
        effects: row.effects.map(e => ({ effects: [...e.effects] })),
      };
    }
    
    return phrase;
  }
}

// =============================================================================
// PHRASE UTILITIES
// =============================================================================

/**
 * Generate phrase from arpeggio pattern
 */
export function createArpeggioPhrase(
  store: PhraseStore,
  name: string,
  intervals: number[],
  baseNote: number = 60,
): Phrase {
  const phrase = store.createPhrase({
    name,
    length: intervals.length,
    playMode: PhrasePlayMode.Loop,
    keyMode: PhraseKeyMode.Relative,
    baseNote,
  });
  
  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i] ?? 0;
    store.setNote(
      phrase.config.id,
      i,
      noteCell(asMidiNote(baseNote + interval), undefined, asVelocity(127))
    );
  }
  
  return phrase;
}

/**
 * Generate phrase from scale pattern
 */
export function createScalePhrase(
  store: PhraseStore,
  name: string,
  scaleIntervals: number[],
  octaves: number = 1,
  baseNote: number = 60,
): Phrase {
  const notes: number[] = [];
  
  for (let oct = 0; oct < octaves; oct++) {
    for (const interval of scaleIntervals) {
      notes.push(baseNote + interval + oct * 12);
    }
  }
  
  const phrase = store.createPhrase({
    name,
    length: notes.length,
    playMode: PhrasePlayMode.OneShot,
    keyMode: PhraseKeyMode.Relative,
    baseNote,
  });
  
  for (let i = 0; i < notes.length; i++) {
    const pitch = notes[i];
    if (pitch === undefined) continue;
    store.setNote(
      phrase.config.id,
      i,
      noteCell(asMidiNote(pitch), undefined, asVelocity(127))
    );
  }
  
  return phrase;
}

/**
 * Generate phrase from rhythm pattern (for drums)
 */
export function createRhythmPhrase(
  store: PhraseStore,
  name: string,
  pattern: boolean[], // true = hit, false = rest
  note: number = 36, // Default kick drum
  accents?: number[], // Velocity values for each hit
): Phrase {
  const phrase = store.createPhrase({
    name,
    length: pattern.length,
    playMode: PhrasePlayMode.Loop,
    keyMode: PhraseKeyMode.Absolute,
  });
  
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i]) {
      const velocity = accents?.[i] ?? 127;
      store.setNote(
        phrase.config.id,
        i,
        noteCell(asMidiNote(note), undefined, asVelocity(velocity))
      );
    }
  }
  
  return phrase;
}

/**
 * Generate Euclidean rhythm phrase
 */
export function createEuclideanPhrase(
  store: PhraseStore,
  name: string,
  hits: number,
  steps: number,
  note: number = 36,
  rotation: number = 0,
): Phrase {
  // Generate Euclidean rhythm
  const pattern: boolean[] = new Array(steps).fill(false);
  
  if (hits > 0 && steps > 0) {
    for (let i = 0; i < hits; i++) {
      const position = Math.floor((i * steps) / hits);
      pattern[(position + rotation) % steps] = true;
    }
  }
  
  return createRhythmPhrase(store, name, pattern, note);
}

// =============================================================================
// SINGLETON ACCESS
// =============================================================================

let phraseStoreInstance: PhraseStore | undefined;

/**
 * Get global phrase store instance
 */
export function getPhraseStore(): PhraseStore {
  if (!phraseStoreInstance) {
    phraseStoreInstance = new PhraseStore();
  }
  return phraseStoreInstance;
}

/**
 * Reset phrase store (for testing)
 */
export function resetPhraseStore(): void {
  phraseStoreInstance = undefined;
}
