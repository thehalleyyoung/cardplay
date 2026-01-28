/**
 * @fileoverview Notation Playback ↔ Transport Bridge.
 * 
 * Connects the notation playback system to the unified Transport
 * and SharedEventStore system.
 * 
 * Key responsibilities:
 * - Sync playback context with Transport
 * - Convert notation events to scheduled audio events
 * - Handle score following
 * - Manage playhead position in notation view
 * - Support practice features (loop, tempo adjustment)
 * 
 * @module @cardplay/notation/playback-transport-bridge
 */

import type { Event } from '../types/event';
import type { Tick, TickDuration } from '../types/primitives';
import { asTick } from '../types/primitives';
import type { EventStreamId, ClipId } from '../state/types';
import { getSharedEventStore, getClipRegistry } from '../state';
import { getTransport, type TransportSnapshot } from '../audio/transport';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Notation event (music notation representation).
 */
export interface NotationEvent {
  readonly id: string;
  readonly type: 'note' | 'rest' | 'chord' | 'tuplet';
  readonly startTick: Tick;
  readonly duration: TickDuration;
  readonly pitch?: number;          // MIDI pitch for notes
  readonly pitches?: number[];      // Multiple pitches for chords
  readonly voice: number;           // Voice number (0-3 typically)
  readonly staff: number;           // Staff index
  readonly beam?: string;           // Beam group ID
  readonly tie?: 'start' | 'end' | 'continue';
  readonly articulations?: string[];
  readonly dynamics?: string;
}

/**
 * Score position in notation.
 */
export interface ScorePosition {
  readonly measure: number;
  readonly beat: number;
  readonly subdivision: number;
  readonly tick: Tick;
}

/**
 * Playback state for notation.
 */
export interface NotationPlaybackState {
  readonly isPlaying: boolean;
  readonly isPaused: boolean;
  readonly currentPosition: ScorePosition;
  readonly currentTick: Tick;
  readonly tempo: number;
  readonly loopEnabled: boolean;
  readonly loopStart: ScorePosition | null;
  readonly loopEnd: ScorePosition | null;
  readonly countInEnabled: boolean;
  readonly metronomeEnabled: boolean;
  readonly practiceSpeed: number;  // 0.5 to 2.0
}

/**
 * Bridge configuration.
 */
export interface NotationPlaybackBridgeConfig {
  readonly ppq: number;                    // Pulses per quarter
  readonly countInBars: number;            // Count-in bars
  readonly defaultPracticeSpeed: number;   // Default practice tempo multiplier
  readonly scoreFollowingEnabled: boolean; // Auto-scroll score
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: NotationPlaybackBridgeConfig = {
  ppq: 480,
  countInBars: 1,
  defaultPracticeSpeed: 1.0,
  scoreFollowingEnabled: true,
};

// ============================================================================
// NOTATION PLAYBACK BRIDGE
// ============================================================================

/**
 * NotationPlaybackBridge - Connects notation system to Transport.
 */
export class NotationPlaybackBridge {
  private config: NotationPlaybackBridgeConfig;
  
  // Current score data
  private timeSignature = { numerator: 4, denominator: 4 };
  private baseTempo = 120;
  private practiceSpeed = 1.0;
  
  // Loop settings
  private loopEnabled = false;
  private loopStartTick: Tick | null = null;
  private loopEndTick: Tick | null = null;
  
  // Practice features
  private countInEnabled = false;
  private metronomeEnabled = false;
  
  // Active streams
  private activeStreamId: EventStreamId | null = null;
  
  // Subscriptions
  private transportSubscription: (() => void) | null = null;
  private subscribers: Set<(state: NotationPlaybackState) => void> = new Set();
  
  constructor(config: Partial<NotationPlaybackBridgeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.practiceSpeed = this.config.defaultPracticeSpeed;
  }
  
  // ========== INITIALIZATION ==========
  
  /**
   * Initialize the bridge.
   */
  initialize(): void {
    const transport = getTransport();
    this.transportSubscription = transport.subscribe((snapshot) => {
      this.handleTransportChange(snapshot);
    });
  }
  
  /**
   * Dispose the bridge.
   */
  dispose(): void {
    if (this.transportSubscription) {
      this.transportSubscription();
      this.transportSubscription = null;
    }
    this.subscribers.clear();
  }
  
  // ========== SCORE LOADING ==========
  
  /**
   * Load a score for playback (from event stream).
   */
  loadFromStream(streamId: EventStreamId): void {
    this.activeStreamId = streamId;
    
    // Find associated clip if any
    const registry = getClipRegistry();
    for (const clipId of registry.getAllClipIds()) {
      const clip = registry.getClip(clipId);
      if (clip && clip.streamId === streamId) {
        break;
      }
    }
    
    this.notifySubscribers();
  }
  
  /**
   * Load a score for playback (from clip).
   */
  loadFromClip(clipId: ClipId): void {
    const clip = getClipRegistry().getClip(clipId);
    if (!clip) return;
    
    this.activeStreamId = clip.streamId;
    this.notifySubscribers();
  }
  
  /**
   * Set time signature for position calculations.
   */
  setTimeSignature(numerator: number, denominator: number): void {
    this.timeSignature = { numerator, denominator };
    this.notifySubscribers();
  }
  
  /**
   * Set base tempo for the score.
   */
  setBaseTempo(tempo: number): void {
    this.baseTempo = tempo;
    this.updateTransportTempo();
    this.notifySubscribers();
  }
  
  // ========== PLAYBACK CONTROL ==========
  
  /**
   * Start playback.
   */
  play(): void {
    const transport = getTransport();
    
    if (this.countInEnabled && !transport.isPlaying()) {
      // Start count-in then play
      this.startCountIn();
    } else {
      transport.play();
    }
  }
  
  /**
   * Pause playback.
   */
  pause(): void {
    getTransport().pause();
  }
  
  /**
   * Stop and reset to beginning.
   */
  stop(): void {
    getTransport().stop();
  }
  
  /**
   * Seek to a specific position.
   */
  seekToPosition(position: ScorePosition): void {
    const tick = this.positionToTick(position);
    getTransport().setPosition(tick);
  }
  
  /**
   * Seek to a specific measure.
   */
  seekToMeasure(measure: number): void {
    this.seekToPosition({
      measure,
      beat: 1,
      subdivision: 1,
      tick: asTick(0),
    });
  }
  
  /**
   * Seek to a specific tick.
   */
  seekToTick(tick: Tick): void {
    getTransport().setPosition(tick);
  }
  
  // ========== PRACTICE FEATURES ==========
  
  /**
   * Set practice speed (tempo multiplier).
   */
  setPracticeSpeed(speed: number): void {
    this.practiceSpeed = Math.max(0.25, Math.min(2.0, speed));
    this.updateTransportTempo();
    this.notifySubscribers();
  }
  
  /**
   * Enable/disable loop.
   */
  setLoop(enabled: boolean, startPosition?: ScorePosition, endPosition?: ScorePosition): void {
    this.loopEnabled = enabled;
    
    if (enabled && startPosition && endPosition) {
      this.loopStartTick = this.positionToTick(startPosition);
      this.loopEndTick = this.positionToTick(endPosition);
      
      const transport = getTransport();
      transport.setLoop(this.loopStartTick, this.loopEndTick);
      transport.setLoopEnabled(true);
    } else if (!enabled) {
      this.loopStartTick = null;
      this.loopEndTick = null;
      getTransport().setLoopEnabled(false);
    }
    
    this.notifySubscribers();
  }
  
  /**
   * Enable/disable count-in.
   */
  setCountIn(enabled: boolean): void {
    this.countInEnabled = enabled;
    this.notifySubscribers();
  }
  
  /**
   * Enable/disable metronome.
   */
  setMetronome(enabled: boolean): void {
    this.metronomeEnabled = enabled;
    getTransport().setMetronomeEnabled(enabled);
    this.notifySubscribers();
  }
  
  // ========== STATE ==========
  
  /**
   * Get the current playback state.
   */
  getState(): NotationPlaybackState {
    const transport = getTransport();
    const snapshot = transport.getSnapshot();
    const currentTick = snapshot.position;
    
    return {
      isPlaying: snapshot.isPlaying,
      isPaused: snapshot.state === 'paused',
      currentPosition: this.tickToPosition(currentTick),
      currentTick,
      tempo: this.baseTempo * this.practiceSpeed,
      loopEnabled: this.loopEnabled,
      loopStart: this.loopStartTick ? this.tickToPosition(this.loopStartTick) : null,
      loopEnd: this.loopEndTick ? this.tickToPosition(this.loopEndTick) : null,
      countInEnabled: this.countInEnabled,
      metronomeEnabled: this.metronomeEnabled,
      practiceSpeed: this.practiceSpeed,
    };
  }
  
  /**
   * Subscribe to state changes.
   */
  subscribe(callback: (state: NotationPlaybackState) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  // ========== NOTATION EVENTS ==========
  
  /**
   * Get notation events in a range (from the active stream).
   */
  getNotationEventsInRange(startTick: Tick, endTick: Tick): NotationEvent[] {
    if (!this.activeStreamId) return [];
    
    const store = getSharedEventStore();
    const stream = store.getStream(this.activeStreamId);
    if (!stream) return [];
    
    const events: NotationEvent[] = [];
    
    for (const event of stream.events) {
      const eventTick = event.start as number;
      if (eventTick >= (startTick as number) && eventTick < (endTick as number)) {
        events.push(this.convertToNotationEvent(event));
      }
    }
    
    return events;
  }
  
  /**
   * Get all notation events for the active stream.
   */
  getAllNotationEvents(): NotationEvent[] {
    if (!this.activeStreamId) return [];
    
    const store = getSharedEventStore();
    const stream = store.getStream(this.activeStreamId);
    if (!stream) return [];
    
    return stream.events.map(e => this.convertToNotationEvent(e));
  }
  
  /**
   * Get currently playing notation events.
   */
  getCurrentlyPlayingEvents(): NotationEvent[] {
    const state = this.getState();
    if (!state.isPlaying) return [];
    
    const currentTick = state.currentTick;
    const lookAhead = asTick(10);  // Small lookahead
    
    return this.getNotationEventsInRange(
      currentTick,
      asTick((currentTick as number) + (lookAhead as number))
    );
  }
  
  // ========== INTERNAL ==========
  
  private handleTransportChange(snapshot: TransportSnapshot): void {
    // Handle loop wrapping
    if (this.loopEnabled && snapshot.isPlaying) {
      const currentTick = snapshot.position as number;
      const loopEnd = this.loopEndTick as number | null;
      
      if (loopEnd && currentTick >= loopEnd) {
        // Transport should handle loop internally, but we notify
        this.notifySubscribers();
      }
    }
    
    this.notifySubscribers();
  }
  
  private updateTransportTempo(): void {
    const effectiveTempo = this.baseTempo * this.practiceSpeed;
    getTransport().setTempo(effectiveTempo);
  }
  
  private startCountIn(): void {
    const countInTicks = this.config.countInBars * this.getTicksPerMeasure();
    
    // Schedule count-in events (metronome clicks)
    const transport = getTransport();
    
    // For now, just start - count-in would need audio scheduling
    setTimeout(() => {
      transport.play();
    }, (countInTicks / this.config.ppq) * (60000 / (this.baseTempo * this.practiceSpeed)));
  }
  
  private getTicksPerMeasure(): number {
    return this.config.ppq * this.timeSignature.numerator * (4 / this.timeSignature.denominator);
  }
  
  private getTicksPerBeat(): number {
    return this.config.ppq * (4 / this.timeSignature.denominator);
  }
  
  private positionToTick(position: ScorePosition): Tick {
    const ticksPerMeasure = this.getTicksPerMeasure();
    const ticksPerBeat = this.getTicksPerBeat();
    const ticksPerSubdivision = ticksPerBeat / 4;  // 16th notes
    
    const measureTicks = (position.measure - 1) * ticksPerMeasure;
    const beatTicks = (position.beat - 1) * ticksPerBeat;
    const subdivisionTicks = (position.subdivision - 1) * ticksPerSubdivision;
    
    return asTick(measureTicks + beatTicks + subdivisionTicks);
  }
  
  private tickToPosition(tick: Tick): ScorePosition {
    const tickValue = tick as number;
    const ticksPerMeasure = this.getTicksPerMeasure();
    const ticksPerBeat = this.getTicksPerBeat();
    const ticksPerSubdivision = ticksPerBeat / 4;
    
    const measure = Math.floor(tickValue / ticksPerMeasure) + 1;
    const measureRemainder = tickValue % ticksPerMeasure;
    
    const beat = Math.floor(measureRemainder / ticksPerBeat) + 1;
    const beatRemainder = measureRemainder % ticksPerBeat;
    
    const subdivision = Math.floor(beatRemainder / ticksPerSubdivision) + 1;
    
    return { measure, beat, subdivision, tick };
  }
  
  private convertToNotationEvent(event: Event<any>): NotationEvent {
    // Convert generic event to notation event format
    const payload = event.payload as any;
    
    return {
      id: event.id,
      type: 'note',
      startTick: event.start,
      duration: event.duration,
      pitch: payload?.pitch ?? 60,
      voice: payload?.voice ?? 0,
      staff: payload?.staff ?? 0,
      articulations: payload?.articulations,
      dynamics: payload?.dynamics,
    };
  }
  
  private notifySubscribers(): void {
    const state = this.getState();
    for (const callback of this.subscribers) {
      callback(state);
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let bridgeInstance: NotationPlaybackBridge | null = null;

/**
 * Get or create the singleton notation playback bridge.
 */
export function getNotationPlaybackBridge(config?: Partial<NotationPlaybackBridgeConfig>): NotationPlaybackBridge {
  if (!bridgeInstance) {
    bridgeInstance = new NotationPlaybackBridge(config);
    bridgeInstance.initialize();
  }
  return bridgeInstance;
}

/**
 * Reset the bridge (for testing).
 */
export function resetNotationPlaybackBridge(): void {
  if (bridgeInstance) {
    bridgeInstance.dispose();
    bridgeInstance = null;
  }
}
