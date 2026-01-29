/**
 * @fileoverview Waveform Editor Deck Factory (M180)
 *
 * Creates waveform editor decks for sample editing.
 * Provides waveform visualization, selection, markers, and edit operations.
 *
 * @module @cardplay/boards/decks/factories/waveform-editor-factory
 */

import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

/** Selection in the waveform */
export interface WaveformSelection {
  start: number;
  end: number;
  channel?: number;
}

/** Marker in the waveform */
export interface WaveformMarker {
  id: string;
  position: number;
  label: string;
  color: string;
  type: 'cue' | 'loop-start' | 'loop-end' | 'slice' | 'custom';
}

/** Region in the waveform */
export interface WaveformRegion {
  id: string;
  start: number;
  end: number;
  label: string;
  color: string;
  muted: boolean;
  gain: number;
}

/** Edit operation for undo/redo */
export interface EditOperation {
  id: string;
  type: 'cut' | 'copy' | 'paste' | 'delete' | 'fade' | 'normalize' | 'reverse' | 'silence' | 'gain';
  description: string;
  timestamp: number;
  selection: WaveformSelection;
}

/** Audio statistics */
export interface AudioStats {
  duration: number;
  sampleRate: number;
  channels: number;
  peakLevel: number;
  rmsLevel: number;
}

/** Snap mode */
export type SnapMode = 'off' | 'zero-crossing' | 'beat' | 'bar' | 'marker';

// --------------------------------------------------------------------------
// Utility functions
// --------------------------------------------------------------------------

/**
 * Find zero crossing nearest to a position
 */
export function findNearestZeroCrossing(
  samples: Float32Array,
  position: number,
  searchRange: number = 100
): number {
  const start = Math.max(0, position - searchRange);
  const end = Math.min(samples.length - 1, position + searchRange);
  
  let bestPosition = position;
  let minDistance = searchRange;
  
  for (let i = start; i < end; i++) {
    const current = samples[i];
    const next = samples[i + 1];
    
    if (current === undefined || next === undefined) continue;
    
    if ((current >= 0 && next < 0) || (current < 0 && next >= 0)) {
      const distance = Math.abs(i - position);
      if (distance < minDistance) {
        minDistance = distance;
        bestPosition = i;
      }
    }
  }
  
  return bestPosition;
}

/**
 * Calculate audio statistics
 */
export function calculateAudioStats(
  samples: Float32Array,
  sampleRate: number,
  channels: number
): AudioStats {
  if (samples.length === 0) {
    return {
      duration: 0,
      sampleRate,
      channels,
      peakLevel: -Infinity,
      rmsLevel: -Infinity,
    };
  }
  
  let peak = 0;
  let sumSquares = 0;
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (sample === undefined) continue;
    
    const absSample = Math.abs(sample);
    if (absSample > peak) peak = absSample;
    sumSquares += sample * sample;
  }
  
  const rms = Math.sqrt(sumSquares / samples.length);
  
  return {
    duration: samples.length / sampleRate / channels,
    sampleRate,
    channels,
    peakLevel: peak > 0 ? 20 * Math.log10(peak) : -Infinity,
    rmsLevel: rms > 0 ? 20 * Math.log10(rms) : -Infinity,
  };
}

// --------------------------------------------------------------------------
// Waveform Editor Store
// --------------------------------------------------------------------------

export class WaveformEditorStore {
  private selection: WaveformSelection | null = null;
  private markers = new Map<string, WaveformMarker>();
  private regions = new Map<string, WaveformRegion>();
  private editHistory: EditOperation[] = [];
  private redoStack: EditOperation[] = [];
  private snapMode: SnapMode = 'off';
  private playheadPosition: number = 0;
  private loopEnabled: boolean = false;
  private loopStart: number = 0;
  private loopEnd: number = 0;
  
  // Selection
  getSelection(): WaveformSelection | null {
    return this.selection ? { ...this.selection } : null;
  }
  
  setSelection(selection: WaveformSelection | null): void {
    if (selection) {
      const newSelection: WaveformSelection = {
        start: Math.min(selection.start, selection.end),
        end: Math.max(selection.start, selection.end),
      };
      if (selection.channel !== undefined) {
        newSelection.channel = selection.channel;
      }
      this.selection = newSelection;
    } else {
      this.selection = null;
    }
  }
  
  clearSelection(): void {
    this.selection = null;
  }
  
  // Markers
  addMarker(marker: Omit<WaveformMarker, 'id'>): WaveformMarker {
    const id = `marker_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newMarker: WaveformMarker = { id, ...marker };
    this.markers.set(id, newMarker);
    return newMarker;
  }
  
  getMarker(id: string): WaveformMarker | undefined {
    return this.markers.get(id);
  }
  
  getAllMarkers(): WaveformMarker[] {
    return Array.from(this.markers.values()).sort((a, b) => a.position - b.position);
  }
  
  deleteMarker(id: string): boolean {
    return this.markers.delete(id);
  }
  
  // Regions
  addRegion(region: Omit<WaveformRegion, 'id'>): WaveformRegion {
    const id = `region_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newRegion: WaveformRegion = { id, ...region };
    this.regions.set(id, newRegion);
    return newRegion;
  }
  
  getAllRegions(): WaveformRegion[] {
    return Array.from(this.regions.values()).sort((a, b) => a.start - b.start);
  }
  
  deleteRegion(id: string): boolean {
    return this.regions.delete(id);
  }
  
  // Snap
  getSnapMode(): SnapMode {
    return this.snapMode;
  }
  
  setSnapMode(mode: SnapMode): void {
    this.snapMode = mode;
  }
  
  // Playhead
  getPlayheadPosition(): number {
    return this.playheadPosition;
  }
  
  setPlayheadPosition(position: number): void {
    this.playheadPosition = Math.max(0, position);
  }
  
  // Loop
  getLoopEnabled(): boolean {
    return this.loopEnabled;
  }
  
  setLoopEnabled(enabled: boolean): void {
    this.loopEnabled = enabled;
  }
  
  setLoopPoints(start: number, end: number): void {
    this.loopStart = Math.min(start, end);
    this.loopEnd = Math.max(start, end);
  }
  
  getLoopPoints(): { start: number; end: number } {
    return { start: this.loopStart, end: this.loopEnd };
  }
  
  // Edit history
  pushEdit(operation: Omit<EditOperation, 'id' | 'timestamp'>): void {
    const edit: EditOperation = {
      ...operation,
      id: `edit_${Date.now()}`,
      timestamp: Date.now(),
    };
    this.editHistory.push(edit);
    this.redoStack = [];
    
    if (this.editHistory.length > 100) {
      this.editHistory.shift();
    }
  }
  
  canUndo(): boolean {
    return this.editHistory.length > 0;
  }
  
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
  
  undo(): EditOperation | undefined {
    const op = this.editHistory.pop();
    if (op) this.redoStack.push(op);
    return op;
  }
  
  redo(): EditOperation | undefined {
    const op = this.redoStack.pop();
    if (op) this.editHistory.push(op);
    return op;
  }
  
  // Clear
  clear(): void {
    this.selection = null;
    this.markers.clear();
    this.regions.clear();
    this.editHistory = [];
    this.redoStack = [];
    this.playheadPosition = 0;
    this.loopEnabled = false;
  }
}

// --------------------------------------------------------------------------
// Factory
// --------------------------------------------------------------------------

/**
 * Factory for creating waveform editor deck instances.
 */
export const waveformEditorDeckFactory: DeckFactory = {
  deckType: 'waveform-editor-deck',
  
  create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
    const container = document.createElement('div');
    container.className = 'waveform-editor-deck-container';
    container.setAttribute('data-deck-id', deckDef.id);
    container.setAttribute('data-deck-type', 'waveform-editor-deck');
    
    const header = document.createElement('div');
    header.className = 'waveform-editor-deck-header';
    header.textContent = 'Waveform Editor';
    container.appendChild(header);
    
    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'waveform-toolbar';
    ['Select', 'Draw', 'Zoom', 'Cut'].forEach(tool => {
      const btn = document.createElement('button');
      btn.textContent = tool;
      btn.className = 'toolbar-btn';
      toolbar.appendChild(btn);
    });
    container.appendChild(toolbar);
    
    // Waveform canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'waveform-canvas';
    canvas.width = 500;
    canvas.height = 200;
    container.appendChild(canvas);
    
    // Timeline
    const timeline = document.createElement('div');
    timeline.className = 'waveform-timeline';
    container.appendChild(timeline);
    
    // Transport controls
    const transport = document.createElement('div');
    transport.className = 'waveform-transport';
    ['⏮', '⏯', '⏭', '🔁'].forEach(icon => {
      const btn = document.createElement('button');
      btn.textContent = icon;
      btn.className = 'transport-btn';
      transport.appendChild(btn);
    });
    container.appendChild(transport);
    
    // Edit buttons
    const editButtons = document.createElement('div');
    editButtons.className = 'edit-buttons';
    ['Cut', 'Copy', 'Paste', 'Delete'].forEach(action => {
      const btn = document.createElement('button');
      btn.textContent = action;
      btn.className = 'edit-btn';
      editButtons.appendChild(btn);
    });
    container.appendChild(editButtons);
    
    // Process buttons
    const processButtons = document.createElement('div');
    processButtons.className = 'process-buttons';
    ['Normalize', 'Fade In', 'Fade Out', 'Reverse', 'Silence'].forEach(action => {
      const btn = document.createElement('button');
      btn.textContent = action;
      btn.className = 'process-btn';
      processButtons.appendChild(btn);
    });
    container.appendChild(processButtons);
    
    // Snap mode selector
    const snapSelector = document.createElement('select');
    snapSelector.className = 'snap-selector';
    ['off', 'zero-crossing', 'beat', 'bar', 'marker'].forEach(mode => {
      const option = document.createElement('option');
      option.value = mode;
      option.textContent = mode === 'zero-crossing' ? 'Zero Crossing' : mode.charAt(0).toUpperCase() + mode.slice(1);
      snapSelector.appendChild(option);
    });
    container.appendChild(snapSelector);
    
    // Stats display
    const stats = document.createElement('div');
    stats.className = 'audio-stats';
    stats.innerHTML = `
      <div>Duration: 0:00.000</div>
      <div>Sample Rate: 44100 Hz</div>
      <div>Channels: Stereo</div>
      <div>Peak: -∞ dB</div>
      <div>RMS: -∞ dB</div>
    `;
    container.appendChild(stats);
    
    // Marker list
    const markerList = document.createElement('div');
    markerList.className = 'marker-list';
    markerList.innerHTML = '<h4>Markers</h4><ul></ul>';
    container.appendChild(markerList);
    
    // Store
    const store = new WaveformEditorStore();
    
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Waveform Editor',
      render: () => container,
      destroy: () => {
        store.clear();
        container.remove();
      },
    };
  },
};

// Singleton store
export const waveformEditorStore = new WaveformEditorStore();
