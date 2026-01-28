/**
 * @fileoverview ChordTrackLane UI - Visual chord editing component.
 * 
 * Provides:
 * - Chord block display and editing
 * - Drag/resize/move operations
 * - Chord picker popup integration
 * - Roman numeral display option
 * - Integration with ChordTrackAdapter
 * 
 * @module @cardplay/ui/chord-track-lane
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase D.2
 */

import type { Tick, TickDuration } from '../types/primitives';
import { asTick, asTickDuration } from '../types/primitives';
import type { EventId, EventStreamId } from '../state/types';
import {
  ChordTrackAdapter,
  createChordTrackAdapter,
  type ChordPayload,
  type ChordQuality,
  type NoteName,
} from '../containers/chord-track';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Visual chord block for rendering.
 */
export interface ChordBlock {
  readonly id: EventId;
  readonly x: number;
  readonly width: number;
  readonly chord: ChordPayload;
  readonly chordSymbol: string;
  readonly romanNumeral?: string;
  readonly selected: boolean;
  readonly color: string;
}

/**
 * Chord picker state.
 */
export interface ChordPickerState {
  readonly visible: boolean;
  readonly position: { x: number; y: number };
  readonly targetChordId?: EventId;
  readonly currentRoot: NoteName;
  readonly currentQuality: ChordQuality;
}

/**
 * Lane display options.
 */
export interface ChordLaneOptions {
  /** Show roman numerals instead of chord symbols */
  readonly showRomanNumerals: boolean;
  /** Current key for roman numeral calculation */
  readonly key: number;
  /** Key mode (major or minor) */
  readonly keyMode: 'major' | 'minor';
  /** Height of lane in pixels */
  readonly height: number;
  /** Horizontal zoom (pixels per tick) */
  readonly pixelsPerTick: number;
  /** Scroll offset in ticks */
  readonly scrollOffset: Tick;
  /** Snap resolution */
  readonly snapResolution: TickDuration;
  /** Snap enabled */
  readonly snapEnabled: boolean;
  /** Default chord length */
  readonly defaultChordLength: TickDuration;
  /** Colors for chord qualities */
  readonly qualityColors: Record<ChordQuality, string>;
}

/**
 * Lane state.
 */
export interface ChordLaneState {
  readonly blocks: readonly ChordBlock[];
  readonly selectedIds: readonly EventId[];
  readonly pickerState: ChordPickerState;
  readonly dragState: DragState | null;
}

/**
 * Drag operation state.
 */
interface DragState {
  readonly type: 'move' | 'resize-left' | 'resize-right';
  readonly chordId: EventId;
  readonly startX: number;
  readonly startTick: Tick;
  readonly startDuration: TickDuration;
}

/**
 * Lane callback.
 */
export type ChordLaneCallback = (state: ChordLaneState) => void;

// ============================================================================
// DEFAULT OPTIONS
// ============================================================================

const DEFAULT_QUALITY_COLORS: Record<ChordQuality, string> = {
  major: '#4CAF50',
  minor: '#2196F3',
  diminished: '#9C27B0',
  augmented: '#FF9800',
  sus2: '#00BCD4',
  sus4: '#009688',
  power: '#607D8B',
};

const DEFAULT_OPTIONS: ChordLaneOptions = {
  showRomanNumerals: false,
  key: 0, // C
  keyMode: 'major',
  height: 60,
  pixelsPerTick: 0.1,
  scrollOffset: asTick(0),
  snapResolution: asTickDuration(480), // Quarter note
  snapEnabled: true,
  defaultChordLength: asTickDuration(1920), // One bar
  qualityColors: DEFAULT_QUALITY_COLORS,
};

// ============================================================================
// ROMAN NUMERALS
// ============================================================================

const ROMAN_NUMERALS_MAJOR = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII'];
const ROMAN_NUMERALS_MINOR = ['i', 'bII', 'ii', 'bIII', 'III', 'iv', '#IV', 'v', 'bVI', 'VI', 'bVII', 'VII'];

const NOTE_NAME_TO_PITCH_CLASS: Record<NoteName, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

function getRomanNumeral(root: NoteName, quality: ChordQuality, key: number, mode: 'major' | 'minor'): string {
  const rootPc = NOTE_NAME_TO_PITCH_CLASS[root] ?? 0;
  const interval = (rootPc - key + 12) % 12;
  const numerals = mode === 'major' ? ROMAN_NUMERALS_MAJOR : ROMAN_NUMERALS_MINOR;
  let numeral = numerals[interval] ?? numerals[0]!;

  // Adjust case based on quality
  const isMinor = quality === 'minor' || quality === 'diminished';
  if (isMinor && numeral === numeral.toUpperCase()) {
    numeral = numeral.toLowerCase();
  } else if (!isMinor && numeral === numeral.toLowerCase()) {
    numeral = numeral.toUpperCase();
  }

  // Add quality suffix
  switch (quality) {
    case 'diminished':
      numeral += '°';
      break;
    case 'augmented':
      numeral += '+';
      break;
    case 'sus2':
      numeral += 'sus2';
      break;
    case 'sus4':
      numeral += 'sus4';
      break;
  }

  return numeral;
}

// ============================================================================
// CHORD TRACK LANE
// ============================================================================

/**
 * ChordTrackLane manages the visual chord editing UI.
 */
export class ChordTrackLane {
  private adapter: ChordTrackAdapter;
  private options: ChordLaneOptions;
  private state: ChordLaneState;
  private adapterSubscriptionId: (() => void) | null = null;
  private callbacks = new Set<ChordLaneCallback>();
  private disposed = false;

  constructor(
    streamId: EventStreamId,
    options?: Partial<ChordLaneOptions>
  ) {
    this.adapter = createChordTrackAdapter(streamId);
    this.options = { ...DEFAULT_OPTIONS, ...options };

    this.state = {
      blocks: [],
      selectedIds: [],
      pickerState: {
        visible: false,
        position: { x: 0, y: 0 },
        currentRoot: 'C',
        currentQuality: 'major',
      },
      dragState: null,
    };

    // Subscribe to adapter changes
    this.adapterSubscriptionId = this.adapter.subscribe(() => {
      this.rebuildBlocks();
    });
  }

  // ==========================================================================
  // STATE ACCESS
  // ==========================================================================

  getState(): ChordLaneState {
    return this.state;
  }

  getOptions(): ChordLaneOptions {
    return this.options;
  }

  getAdapter(): ChordTrackAdapter {
    return this.adapter;
  }

  // ==========================================================================
  // OPTIONS
  // ==========================================================================

  setOptions(options: Partial<ChordLaneOptions>): void {
    this.options = { ...this.options, ...options };
    this.rebuildBlocks();
  }

  setZoom(pixelsPerTick: number): void {
    this.options = { ...this.options, pixelsPerTick };
    this.rebuildBlocks();
  }

  setScroll(scrollOffset: Tick): void {
    this.options = { ...this.options, scrollOffset };
    this.rebuildBlocks();
  }

  setKey(key: number, mode: 'major' | 'minor'): void {
    this.options = { ...this.options, key, keyMode: mode };
    this.rebuildBlocks();
  }

  toggleRomanNumerals(): void {
    this.options = { ...this.options, showRomanNumerals: !this.options.showRomanNumerals };
    this.rebuildBlocks();
  }

  // ==========================================================================
  // BLOCK BUILDING
  // ==========================================================================

  private rebuildBlocks(): void {
    const chords = this.adapter.getAllChords();
    const blocks: ChordBlock[] = [];

    for (const chord of chords) {
      const x = this.tickToPixel(chord.start);
      const width = this.durationToPixels(chord.duration);

      // Skip if off screen
      if (x + width < 0) continue;

      const symbol = this.adapter.getChordSymbol(chord.id);
      const romanNumeral = this.options.showRomanNumerals
        ? getRomanNumeral(chord.payload.root, chord.payload.quality, this.options.key, this.options.keyMode)
        : undefined;

      blocks.push({
        id: chord.id,
        x,
        width: Math.max(20, width), // Minimum width
        chord: chord.payload,
        chordSymbol: symbol,
        ...(romanNumeral !== undefined && { romanNumeral }),
        selected: this.state.selectedIds.includes(chord.id),
        color: this.options.qualityColors[chord.payload.quality] ?? '#808080',
      });
    }

    this.state = { ...this.state, blocks };
    this.notifyChange();
  }

  private tickToPixel(tick: Tick): number {
    return ((tick as number) - (this.options.scrollOffset as number)) * this.options.pixelsPerTick;
  }

  private pixelToTick(pixel: number): Tick {
    return asTick(Math.round(pixel / this.options.pixelsPerTick + (this.options.scrollOffset as number)));
  }

  private durationToPixels(duration: TickDuration): number {
    return (duration as number) * this.options.pixelsPerTick;
  }

  private snapTick(tick: Tick): Tick {
    if (!this.options.snapEnabled) return tick;
    const res = this.options.snapResolution as number;
    return asTick(Math.round((tick as number) / res) * res);
  }

  // ==========================================================================
  // SELECTION
  // ==========================================================================

  selectChord(chordId: EventId, addToSelection: boolean = false): void {
    let selectedIds: EventId[];
    if (addToSelection) {
      if (this.state.selectedIds.includes(chordId)) {
        selectedIds = this.state.selectedIds.filter(id => id !== chordId);
      } else {
        selectedIds = [...this.state.selectedIds, chordId];
      }
    } else {
      selectedIds = [chordId];
    }

    this.state = { ...this.state, selectedIds };
    this.rebuildBlocks();
  }

  selectChordsInRange(startTick: Tick, endTick: Tick): void {
    const selectedIds = this.state.blocks
      .filter(block => {
        const chord = this.adapter.getChord(block.id);
        if (!chord) return false;
        const chordEnd = (chord.start as number) + (chord.duration as number);
        return (chord.start as number) < (endTick as number) && chordEnd > (startTick as number);
      })
      .map(block => block.id);

    this.state = { ...this.state, selectedIds };
    this.rebuildBlocks();
  }

  clearSelection(): void {
    this.state = { ...this.state, selectedIds: [] };
    this.rebuildBlocks();
  }

  deleteSelected(): void {
    for (const id of this.state.selectedIds) {
      this.adapter.removeChord(id);
    }
    this.state = { ...this.state, selectedIds: [] };
  }

  // ==========================================================================
  // CHORD OPERATIONS
  // ==========================================================================

  addChordAtPixel(x: number, chordText: string): EventId | null {
    const tick = this.snapTick(this.pixelToTick(x));
    return this.adapter.addChordFromText(tick, chordText, this.options.defaultChordLength);
  }

  addChord(tick: Tick, root: NoteName, quality: ChordQuality, duration?: TickDuration): void {
    this.adapter.addChord(
      this.snapTick(tick),
      duration ?? this.options.defaultChordLength,
      { root, quality, extensions: [], alterations: [], bass: root }
    );
  }

  updateChord(chordId: EventId, updates: Partial<ChordPayload>): void {
    const chord = this.adapter.getChord(chordId);
    if (!chord) return;

    this.adapter.updateChord(chordId, {
      payload: {
        ...chord.payload,
        ...updates,
      },
    });
  }

  // ==========================================================================
  // MOUSE INTERACTIONS
  // ==========================================================================

  handleMouseDown(x: number, _y: number, shiftKey: boolean = false): void {
    // Find block at position
    const block = this.findBlockAtPixel(x);

    if (block) {
      // Check if near edges for resize
      const edgeThreshold = 8;
      if (x - block.x < edgeThreshold) {
        this.startDrag('resize-left', block.id, x);
      } else if (block.x + block.width - x < edgeThreshold) {
        this.startDrag('resize-right', block.id, x);
      } else {
        this.startDrag('move', block.id, x);
      }

      this.selectChord(block.id, shiftKey);
    } else {
      // Clear selection if not shift-clicking
      if (!shiftKey) {
        this.clearSelection();
      }
    }
  }

  handleMouseMove(x: number, _y: number): void {
    if (!this.state.dragState) return;

    const { type, chordId, startX, startTick, startDuration } = this.state.dragState;
    const deltaPx = x - startX;
    const deltaTicks = Math.round(deltaPx / this.options.pixelsPerTick);

    const chord = this.adapter.getChord(chordId);
    if (!chord) return;

    switch (type) {
      case 'move': {
        const newTick = this.snapTick(asTick((startTick as number) + deltaTicks));
        if ((newTick as number) >= 0 && newTick !== chord.start) {
          this.adapter.moveChord(chordId, newTick);
        }
        break;
      }

      case 'resize-left': {
        const newStart = this.snapTick(asTick((startTick as number) + deltaTicks));
        const originalEnd = (startTick as number) + (startDuration as number);
        const newDuration = asTickDuration(originalEnd - (newStart as number));

        if ((newStart as number) >= 0 && (newDuration as number) >= (this.options.snapResolution as number)) {
          this.adapter.moveChord(chordId, newStart);
          this.adapter.resizeChord(chordId, newDuration);
        }
        break;
      }

      case 'resize-right': {
        const newDuration = this.snapDuration(asTickDuration((startDuration as number) + deltaTicks));
        if ((newDuration as number) >= (this.options.snapResolution as number)) {
          this.adapter.resizeChord(chordId, newDuration);
        }
        break;
      }
    }
  }

  handleMouseUp(): void {
    this.state = { ...this.state, dragState: null };
    this.notifyChange();
  }

  handleDoubleClick(x: number, y: number): void {
    const block = this.findBlockAtPixel(x);

    if (block) {
      // Open chord picker for existing chord
      this.showPicker(x, y, block.id, block.chord.root, block.chord.quality);
    } else {
      // Open chord picker for new chord
      this.showPicker(x, y, undefined, 'C', 'major');
    }
  }

  private startDrag(type: DragState['type'], chordId: EventId, startX: number): void {
    const chord = this.adapter.getChord(chordId);
    if (!chord) return;

    this.state = {
      ...this.state,
      dragState: {
        type,
        chordId,
        startX,
        startTick: chord.start,
        startDuration: chord.duration,
      },
    };
  }

  private findBlockAtPixel(x: number): ChordBlock | undefined {
    return this.state.blocks.find(block =>
      x >= block.x && x <= block.x + block.width
    );
  }

  private snapDuration(duration: TickDuration): TickDuration {
    if (!this.options.snapEnabled) return duration;
    const res = this.options.snapResolution as number;
    return asTickDuration(Math.max(res, Math.round((duration as number) / res) * res));
  }

  // ==========================================================================
  // CHORD PICKER
  // ==========================================================================

  showPicker(x: number, y: number, chordId?: EventId, root: NoteName = 'C', quality: ChordQuality = 'major'): void {
    const pickerState: ChordPickerState = {
      visible: true,
      position: { x, y },
      currentRoot: root,
      currentQuality: quality,
      ...(chordId !== undefined && { targetChordId: chordId }),
    };
    this.state = {
      ...this.state,
      pickerState,
    };
    this.notifyChange();
  }

  hidePicker(): void {
    this.state = {
      ...this.state,
      pickerState: { ...this.state.pickerState, visible: false },
    };
    this.notifyChange();
  }

  setPickerRoot(root: NoteName): void {
    this.state = {
      ...this.state,
      pickerState: { ...this.state.pickerState, currentRoot: root },
    };
    this.notifyChange();
  }

  setPickerQuality(quality: ChordQuality): void {
    this.state = {
      ...this.state,
      pickerState: { ...this.state.pickerState, currentQuality: quality },
    };
    this.notifyChange();
  }

  confirmPicker(): void {
    const { targetChordId, currentRoot, currentQuality, position } = this.state.pickerState;

    if (targetChordId) {
      // Update existing chord
      this.updateChord(targetChordId, { root: currentRoot, quality: currentQuality, bass: currentRoot });
    } else {
      // Add new chord
      const tick = this.snapTick(this.pixelToTick(position.x));
      this.addChord(tick, currentRoot, currentQuality);
    }

    this.hidePicker();
  }

  // ==========================================================================
  // KEYBOARD SHORTCUTS
  // ==========================================================================

  handleKeyDown(key: string, shiftKey: boolean = false, ctrlKey: boolean = false): void {
    switch (key) {
      case 'Delete':
      case 'Backspace':
        this.deleteSelected();
        break;

      case 'Escape':
        if (this.state.pickerState.visible) {
          this.hidePicker();
        } else {
          this.clearSelection();
        }
        break;

      case 'Enter':
        if (this.state.pickerState.visible) {
          this.confirmPicker();
        }
        break;

      case 'ArrowLeft':
        this.nudgeSelected(shiftKey ? -480 : -120);
        break;

      case 'ArrowRight':
        this.nudgeSelected(shiftKey ? 480 : 120);
        break;

      case 'a':
        if (ctrlKey) {
          this.selectAll();
        }
        break;
    }
  }

  private nudgeSelected(deltaTicks: number): void {
    for (const id of this.state.selectedIds) {
      const chord = this.adapter.getChord(id);
      if (chord) {
        const newTick = asTick(Math.max(0, (chord.start as number) + deltaTicks));
        this.adapter.moveChord(id, newTick);
      }
    }
  }

  private selectAll(): void {
    const selectedIds = this.state.blocks.map(block => block.id);
    this.state = { ...this.state, selectedIds };
    this.rebuildBlocks();
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  subscribe(callback: ChordLaneCallback): () => void {
    this.callbacks.add(callback);
    callback(this.state);

    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifyChange(): void {
    for (const callback of this.callbacks) {
      try {
        callback(this.state);
      } catch (e) {
        console.error('ChordLane callback error:', e);
      }
    }
  }

  // ==========================================================================
  // RENDERING HELPERS
  // ==========================================================================

  /**
   * Gets render data for a block.
   */
  getBlockRenderData(block: ChordBlock): {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
  } {
    return {
      x: block.x,
      y: 4,
      width: block.width,
      height: this.options.height - 8,
      label: this.options.showRomanNumerals && block.romanNumeral ? block.romanNumeral : block.chordSymbol,
      backgroundColor: block.selected ? this.lightenColor(block.color, 20) : block.color,
      borderColor: block.selected ? '#ffffff' : this.darkenColor(block.color, 20),
      textColor: '#ffffff',
    };
  }

  private lightenColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private darkenColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.adapterSubscriptionId) {
      this.adapterSubscriptionId();
    }

    this.callbacks.clear();
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Creates a ChordTrackLane.
 */
export function createChordTrackLane(
  streamId: EventStreamId,
  options?: Partial<ChordLaneOptions>
): ChordTrackLane {
  return new ChordTrackLane(streamId, options);
}
