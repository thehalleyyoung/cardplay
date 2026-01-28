/**
 * @fileoverview Tracker Card Integration
 * 
 * Integrates the TrackerCard UI with CardPlay's card system.
 * Provides a factory for creating tracker cards as proper CardPlay cards.
 * 
 * @module @cardplay/tracker/tracker-card-integration
 */

import type { Card, CardMeta, CardContext, CardState, CardResult } from '../cards/card';
import { PortTypes } from '../cards/card';
import { TrackerCard, createTrackerCard, type TrackerCardOptions } from './tracker-card';
import { PatternStore, getPatternStore } from './pattern-store';
import { TrackerEventSync, getTrackerEventSync } from './event-sync';
import { TrackerInputHandler, getTrackerInputHandler } from './input-handler';
import { createInitialTrackerState, type TrackerState, type CursorPosition, asRowIndex, asPatternId } from './types';

// =============================================================================
// CARD META
// =============================================================================

/**
 * Tracker card metadata for CardPlay system
 */
export const TRACKER_CARD_META: CardMeta = {
  id: 'tracker',
  name: 'Pattern Tracker',
  description: 'Renoise-style pattern editor with CardPlay integration',
  version: '1.0.0',
  category: 'editor',
  tags: ['tracker', 'pattern', 'sequencer', 'editor', 'renoise'],
  author: 'CardPlay',
  
  signature: {
    inputs: [
      { id: 'midi_in', type: PortTypes.MIDI, label: 'MIDI In' },
      { id: 'trigger_in', type: PortTypes.TRIGGER, label: 'Trigger In' },
    ],
    outputs: [
      { id: 'midi_out', type: PortTypes.MIDI, label: 'MIDI Out' },
      { id: 'trigger_out', type: PortTypes.TRIGGER, label: 'Trigger Out' },
    ],
  },
  
  // Card visual identity
  visuals: {
    emoji: '🎹',
    emojiSecondary: '📊',
    color: '#6366f1',
    colorSecondary: '#8b5cf6',
    gradient: 'linear',
    gradientAngle: 135,
    glow: '#6366f1',
    glowIntensity: 0.3,
  },
  
  // Default dimensions
  defaultWidth: 600,
  defaultHeight: 500,
  minWidth: 400,
  minHeight: 300,
  
  // Behavior hints
  resizable: true,
  collapsible: true,
  closable: true,
};

// =============================================================================
// CARD STATE
// =============================================================================

/**
 * Extended state for tracker card
 */
export interface TrackerCardState extends CardState {
  trackerState: TrackerState;
  isPlaying: boolean;
  isRecording: boolean;
  isLooping: boolean;
  currentPatternId: string;
  tempo: number;
  lpb: number;
}

/**
 * Create initial tracker card state
 */
export function createTrackerCardState(): TrackerCardState {
  return {
    trackerState: createInitialTrackerState(),
    isPlaying: false,
    isRecording: false,
    isLooping: true,
    currentPatternId: '',
    tempo: 120,
    lpb: 4,
  };
}

// =============================================================================
// CARD IMPLEMENTATION
// =============================================================================

/**
 * Tracker card implementation for CardPlay
 */
export class TrackerCardImpl implements Card<TrackerCardState> {
  readonly id: string;
  readonly meta = TRACKER_CARD_META;
  
  private ui: TrackerCard | null = null;
  private patternStore: PatternStore;
  private eventSync: TrackerEventSync;
  private inputHandler: TrackerInputHandler;
  private state: TrackerCardState;
  private mounted: boolean = false;
  
  constructor(id: string) {
    this.id = id;
    this.patternStore = getPatternStore();
    this.eventSync = getTrackerEventSync();
    this.inputHandler = getTrackerInputHandler();
    this.state = createTrackerCardState();
  }
  
  /**
   * Initialize the card
   */
  async init(ctx: CardContext): Promise<void> {
    // Create default pattern if none exists
    if (!this.state.currentPatternId) {
      const pattern = this.patternStore.createPattern({
        name: 'Pattern 1',
        length: 64,
      });
      this.state.currentPatternId = pattern.config.id;
      
      // Create default tracks
      for (let i = 0; i < 4; i++) {
        this.patternStore.addTrack(pattern.config.id, {
          name: ['Lead', 'Bass', 'Drums', 'FX'][i],
          color: ['#6366f1', '#22c55e', '#f59e0b', '#ec4899'][i],
        });
      }
    }
  }
  
  /**
   * Execute the card (called each tick during playback)
   */
  async execute(ctx: CardContext, state: TrackerCardState): Promise<CardResult<TrackerCardState>> {
    // Process current row if playing
    if (state.isPlaying) {
      // Advance cursor based on transport tick
      // This would integrate with the transport system
    }
    
    return {
      state,
      outputs: {},
    };
  }
  
  /**
   * Create UI element
   */
  createUI(container: HTMLElement): void {
    if (this.ui) return;
    
    const pattern = this.patternStore.getPattern(this.state.currentPatternId as any);
    
    this.ui = createTrackerCard({
      title: this.meta.name,
      pattern: pattern ?? undefined,
      cursor: this.state.trackerState.cursor,
      isPlaying: this.state.isPlaying,
      isRecording: this.state.isRecording,
      isLooping: this.state.isLooping,
      
      onCellClick: (row, track, column) => {
        this.state.trackerState.cursor = {
          row: asRowIndex(row),
          track,
          column,
          subColumn: 0,
        };
        this.ui?.update({ cursor: this.state.trackerState.cursor });
      },
      
      onPlay: () => {
        this.state.isPlaying = true;
        this.ui?.update({ isPlaying: true });
      },
      
      onPause: () => {
        this.state.isPlaying = false;
        this.ui?.update({ isPlaying: false });
      },
      
      onStop: () => {
        this.state.isPlaying = false;
        this.state.trackerState.cursor.row = asRowIndex(0);
        this.ui?.update({ 
          isPlaying: false,
          cursor: this.state.trackerState.cursor,
        });
      },
      
      onRecord: () => {
        this.state.isRecording = !this.state.isRecording;
        this.ui?.update({ isRecording: this.state.isRecording });
      },
      
      onLoopToggle: () => {
        this.state.isLooping = !this.state.isLooping;
        this.ui?.update({ isLooping: this.state.isLooping });
      },
    });
    
    this.ui.mount(container);
    this.mounted = true;
    
    // Setup keyboard handling
    this.setupKeyboardHandling(container);
  }
  
  /**
   * Setup keyboard event handling
   */
  private setupKeyboardHandling(container: HTMLElement): void {
    container.tabIndex = 0; // Make focusable
    
    container.addEventListener('keydown', (e) => {
      const pattern = this.patternStore.getPattern(this.state.currentPatternId as any);
      if (!pattern) return;
      
      // Handle through input handler
      const handled = this.inputHandler.handleKeyDown(
        e,
        this.state.trackerState,
        pattern,
        this.patternStore,
      );
      
      if (handled) {
        e.preventDefault();
        this.ui?.update({
          pattern,
          cursor: this.state.trackerState.cursor,
        });
      }
    });
  }
  
  /**
   * Destroy the card
   */
  destroy(): void {
    if (this.ui) {
      this.ui.unmount();
      this.ui = null;
    }
    this.mounted = false;
  }
  
  /**
   * Get current state
   */
  getState(): TrackerCardState {
    return this.state;
  }
  
  /**
   * Serialize state
   */
  serialize(): unknown {
    return {
      id: this.id,
      state: this.state,
      patterns: Array.from(this.patternStore.getState().patterns.values()).map(p => ({
        ...p,
      })),
    };
  }
  
  /**
   * Deserialize state
   */
  deserialize(data: unknown): void {
    const parsed = data as { state?: TrackerCardState; patterns?: unknown[] };
    if (parsed.state) {
      this.state = parsed.state;
    }
    // Pattern restoration would go here
  }
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create a tracker card instance
 */
export function createTrackerCardImpl(id?: string): TrackerCardImpl {
  return new TrackerCardImpl(id ?? `tracker-${crypto.randomUUID()}`);
}

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * Register tracker card with CardPlay system
 */
export function registerTrackerCard(registry: Map<string, () => Card<any>>): void {
  registry.set('tracker', () => createTrackerCardImpl());
}
