/**
 * @fileoverview Transport Controller - Unified playback, timing, and sync.
 * 
 * Central transport management for:
 * - Play/pause/stop/record control
 * - Tempo and time signature
 * - Loop regions
 * - External sync (MIDI clock, Link)
 * - Metronome
 * 
 * @module @cardplay/audio/transport
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase F.4
 */

import type { Tick, TickDuration } from '../types/primitives';
import { asTick, asTickDuration } from '../types/primitives';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Transport state.
 */
export type TransportState = 'stopped' | 'playing' | 'paused' | 'recording';

/**
 * Time signature.
 */
export interface TimeSignature {
  readonly numerator: number;
  readonly denominator: number;
}

/**
 * Position in bars, beats, ticks.
 */
export interface BarBeatPosition {
  readonly bar: number;
  readonly beat: number;
  readonly tick: number;
}

/**
 * Loop region.
 */
export interface LoopRegion {
  readonly start: Tick;
  readonly end: Tick;
  readonly enabled: boolean;
}

/**
 * Tempo change.
 */
export interface TempoChange {
  readonly tick: Tick;
  readonly tempo: number;
}

/**
 * Time signature change.
 */
export interface TimeSignatureChange {
  readonly tick: Tick;
  readonly timeSignature: TimeSignature;
}

/**
 * Transport configuration.
 */
export interface TransportConfig {
  /** Initial tempo (BPM) */
  readonly tempo: number;
  /** Time signature */
  readonly timeSignature: TimeSignature;
  /** Ticks per beat (PPQ) */
  readonly ticksPerBeat: number;
  /** Pre-roll bars */
  readonly preRoll: number;
  /** Count-in enabled */
  readonly countIn: boolean;
  /** Metronome enabled */
  readonly metronome: boolean;
  /** Metronome volume */
  readonly metronomeVolume: number;
  /** Loop region */
  readonly loop: LoopRegion;
  /** Punch in/out enabled */
  readonly punchEnabled: boolean;
  /** Punch region */
  readonly punchRegion?: { start: Tick; end: Tick };
}

/**
 * Transport callback.
 */
export type TransportCallback = (state: TransportSnapshot) => void;

/**
 * Transport snapshot (current state).
 */
export interface TransportSnapshot {
  readonly state: TransportState;
  readonly position: Tick;
  readonly positionSeconds: number;
  readonly barBeat: BarBeatPosition;
  readonly tempo: number;
  readonly timeSignature: TimeSignature;
  readonly loop: LoopRegion;
  readonly isRecording: boolean;
  readonly isPlaying: boolean;
}

/**
 * Beat callback (called on each beat).
 */
export type BeatCallback = (beat: number, bar: number, tick: Tick) => void;

// ============================================================================
// TRANSPORT CONTROLLER
// ============================================================================

/**
 * TransportController manages playback timing and sync.
 */
export class TransportController {
  private static instance: TransportController;

  // State
  private transportState: TransportState = 'stopped';
  private position: Tick = asTick(0);
  private tempo: number;
  private timeSignature: TimeSignature;
  private ticksPerBeat: number;
  private loop: LoopRegion;
  private config: TransportConfig;

  // Tempo map
  private tempoChanges: TempoChange[] = [];

  // Audio timing
  private audioContext: AudioContext | null = null;
  private startTime: number = 0;
  private startPosition: Tick = asTick(0);

  // Scheduling
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;
  private lastScheduledTick: Tick = asTick(0);
  private scheduleAheadTime: number = 0.2; // seconds

  // Callbacks
  private stateCallbacks = new Set<TransportCallback>();
  private beatCallbacks = new Set<BeatCallback>();
  private lastBeat: number = -1;
  private lastBar: number = -1;

  // Metronome
  private metronomeEnabled: boolean;
  private metronomeVolume: number;

  private constructor(config?: Partial<TransportConfig>) {
    this.config = {
      tempo: config?.tempo ?? 120,
      timeSignature: config?.timeSignature ?? { numerator: 4, denominator: 4 },
      ticksPerBeat: config?.ticksPerBeat ?? 480,
      preRoll: config?.preRoll ?? 0,
      countIn: config?.countIn ?? false,
      metronome: config?.metronome ?? false,
      metronomeVolume: config?.metronomeVolume ?? 0.5,
      loop: config?.loop ?? { start: asTick(0), end: asTick(0), enabled: false },
      punchEnabled: config?.punchEnabled ?? false,
    };

    this.tempo = this.config.tempo;
    this.timeSignature = this.config.timeSignature;
    this.ticksPerBeat = this.config.ticksPerBeat;
    this.loop = this.config.loop;
    this.metronomeEnabled = this.config.metronome;
    this.metronomeVolume = this.config.metronomeVolume;
  }

  static getInstance(config?: Partial<TransportConfig>): TransportController {
    if (!TransportController.instance) {
      TransportController.instance = new TransportController(config);
    }
    return TransportController.instance;
  }

  static resetInstance(): void {
    if (TransportController.instance) {
      TransportController.instance.stop();
    }
    TransportController.instance = undefined as unknown as TransportController;
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  /**
   * Sets the audio context.
   */
  setAudioContext(context: AudioContext): void {
    this.audioContext = context;
  }

  // ==========================================================================
  // STATE ACCESS
  // ==========================================================================

  getState(): TransportState {
    return this.transportState;
  }

  getPosition(): Tick {
    if (this.transportState === 'playing' || this.transportState === 'recording') {
      return this.calculateCurrentPosition();
    }
    return this.position;
  }

  getPositionSeconds(): number {
    const pos = this.getPosition();
    return this.ticksToSeconds(pos);
  }

  getBarBeatPosition(): BarBeatPosition {
    return this.ticksToBarBeat(this.getPosition());
  }

  getTempo(): number {
    return this.tempo;
  }

  getTimeSignature(): TimeSignature {
    return this.timeSignature;
  }

  getTicksPerBeat(): number {
    return this.ticksPerBeat;
  }

  getLoop(): LoopRegion {
    return this.loop;
  }

  isPlaying(): boolean {
    return this.transportState === 'playing' || this.transportState === 'recording';
  }

  isRecording(): boolean {
    return this.transportState === 'recording';
  }

  getSnapshot(): TransportSnapshot {
    const pos = this.getPosition();
    return {
      state: this.transportState,
      position: pos,
      positionSeconds: this.ticksToSeconds(pos),
      barBeat: this.ticksToBarBeat(pos),
      tempo: this.tempo,
      timeSignature: this.timeSignature,
      loop: this.loop,
      isRecording: this.isRecording(),
      isPlaying: this.isPlaying(),
    };
  }

  // ==========================================================================
  // TRANSPORT CONTROL
  // ==========================================================================

  /**
   * Starts playback.
   */
  play(): void {
    if (this.transportState === 'playing') return;

    if (!this.audioContext) {
      console.warn('AudioContext not set. Call setAudioContext first.');
      return;
    }

    this.transportState = 'playing';
    this.startTime = this.audioContext.currentTime;
    this.startPosition = this.position;

    this.startScheduler();
    this.notifyStateChange();
  }

  /**
   * Pauses playback.
   */
  pause(): void {
    if (this.transportState !== 'playing' && this.transportState !== 'recording') return;

    this.position = this.calculateCurrentPosition();
    this.transportState = 'paused';

    this.stopScheduler();
    this.notifyStateChange();
  }

  /**
   * Stops playback and returns to start.
   */
  stop(): void {
    this.stopScheduler();
    this.position = asTick(0);
    this.transportState = 'stopped';
    this.lastBeat = -1;
    this.lastBar = -1;

    this.notifyStateChange();
  }

  /**
   * Starts recording.
   */
  record(): void {
    if (this.transportState === 'recording') return;

    if (!this.audioContext) {
      console.warn('AudioContext not set. Call setAudioContext first.');
      return;
    }

    this.transportState = 'recording';
    this.startTime = this.audioContext.currentTime;
    this.startPosition = this.position;

    this.startScheduler();
    this.notifyStateChange();
  }

  /**
   * Toggle play/pause.
   */
  togglePlayPause(): void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Sets position.
   */
  setPosition(tick: Tick): void {
    this.position = tick;

    if (this.isPlaying() && this.audioContext) {
      this.startTime = this.audioContext.currentTime;
      this.startPosition = tick;
      this.lastBeat = -1;
      this.lastBar = -1;
    }

    this.notifyStateChange();
  }

  /**
   * Sets position in seconds.
   */
  setPositionSeconds(seconds: number): void {
    this.setPosition(this.secondsToTicks(seconds));
  }

  /**
   * Sets position in bar:beat format.
   */
  setPositionBarBeat(bar: number, beat: number = 1): void {
    this.setPosition(this.barBeatToTicks(bar, beat));
  }

  // ==========================================================================
  // TEMPO & TIME SIGNATURE
  // ==========================================================================

  /**
   * Sets tempo.
   */
  setTempo(bpm: number): void {
    this.tempo = Math.max(20, Math.min(300, bpm));

    // If playing, adjust start time to maintain position
    if (this.isPlaying() && this.audioContext) {
      const currentPos = this.calculateCurrentPosition();
      this.startTime = this.audioContext.currentTime;
      this.startPosition = currentPos;
    }

    this.notifyStateChange();
  }

  /**
   * Sets time signature.
   */
  setTimeSignature(numerator: number, denominator: number): void {
    this.timeSignature = {
      numerator: Math.max(1, Math.min(16, numerator)),
      denominator: Math.max(1, Math.min(16, denominator)),
    };

    this.notifyStateChange();
  }

  /**
   * Adds a tempo change to the tempo map.
   */
  addTempoChange(tick: Tick, tempo: number): void {
    this.tempoChanges.push({ tick, tempo });
    this.tempoChanges.sort((a, b) => (a.tick as number) - (b.tick as number));
  }

  /**
   * Gets tempo at tick.
   */
  getTempoAtTick(tick: Tick): number {
    let currentTempo = this.tempo;

    for (const change of this.tempoChanges) {
      if ((change.tick as number) <= (tick as number)) {
        currentTempo = change.tempo;
      } else {
        break;
      }
    }

    return currentTempo;
  }

  // ==========================================================================
  // LOOP
  // ==========================================================================

  /**
   * Sets loop region.
   */
  setLoop(start: Tick, end: Tick): void {
    this.loop = {
      start,
      end,
      enabled: this.loop.enabled,
    };

    this.notifyStateChange();
  }

  /**
   * Toggles loop.
   */
  toggleLoop(): void {
    this.loop = {
      ...this.loop,
      enabled: !this.loop.enabled,
    };

    this.notifyStateChange();
  }

  /**
   * Sets loop enabled.
   */
  setLoopEnabled(enabled: boolean): void {
    this.loop = {
      ...this.loop,
      enabled,
    };

    this.notifyStateChange();
  }

  // ==========================================================================
  // METRONOME
  // ==========================================================================

  /**
   * Toggles metronome.
   */
  toggleMetronome(): void {
    this.metronomeEnabled = !this.metronomeEnabled;
    this.notifyStateChange();
  }

  /**
   * Sets metronome enabled.
   */
  setMetronomeEnabled(enabled: boolean): void {
    this.metronomeEnabled = enabled;
    this.notifyStateChange();
  }

  /**
   * Sets metronome volume.
   */
  setMetronomeVolume(volume: number): void {
    this.metronomeVolume = Math.max(0, Math.min(1, volume));
  }

  private playMetronomeClick(time: number, isDownbeat: boolean): void {
    if (!this.audioContext || !this.metronomeEnabled) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    // Higher pitch for downbeat
    osc.frequency.value = isDownbeat ? 1000 : 800;
    gain.gain.value = this.metronomeVolume;
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  /**
   * Subscribes to transport state changes.
   */
  subscribe(callback: TransportCallback): () => void {
    this.stateCallbacks.add(callback);
    callback(this.getSnapshot());

    return () => {
      this.stateCallbacks.delete(callback);
    };
  }

  /**
   * Subscribes to beat events.
   */
  onBeat(callback: BeatCallback): () => void {
    this.beatCallbacks.add(callback);

    return () => {
      this.beatCallbacks.delete(callback);
    };
  }

  private notifyStateChange(): void {
    const snapshot = this.getSnapshot();
    for (const callback of this.stateCallbacks) {
      try {
        callback(snapshot);
      } catch (e) {
        console.error('Transport callback error:', e);
      }
    }
  }

  private notifyBeat(beat: number, bar: number, tick: Tick): void {
    for (const callback of this.beatCallbacks) {
      try {
        callback(beat, bar, tick);
      } catch (e) {
        console.error('Beat callback error:', e);
      }
    }
  }

  // ==========================================================================
  // SCHEDULING
  // ==========================================================================

  private startScheduler(): void {
    if (this.schedulerInterval) return;

    this.lastScheduledTick = this.startPosition;

    this.schedulerInterval = setInterval(() => {
      this.schedule();
    }, 25); // 40Hz scheduling rate
  }

  private stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }

  private schedule(): void {
    if (!this.audioContext) return;

    const currentTime = this.audioContext.currentTime;
    const lookAhead = currentTime + this.scheduleAheadTime;
    const currentTick = this.calculateCurrentPosition();

    // Schedule beats for metronome and callbacks
    const ticksPerBar = this.ticksPerBeat * this.timeSignature.numerator;
    let scheduleTick = this.lastScheduledTick;

    while (true) {
      const tickTime = this.ticksToSeconds(scheduleTick);
      const audioTime = this.startTime + tickTime - this.ticksToSeconds(this.startPosition);

      if (audioTime > lookAhead) break;

      // Check if this is a beat
      const ticksFromBar = (scheduleTick as number) % ticksPerBar;
      const beatInBar = Math.floor(ticksFromBar / this.ticksPerBeat) + 1;
      const bar = Math.floor((scheduleTick as number) / ticksPerBar) + 1;

      if (ticksFromBar % this.ticksPerBeat === 0) {
        // This is a beat
        if (beatInBar !== this.lastBeat || bar !== this.lastBar) {
          this.lastBeat = beatInBar;
          this.lastBar = bar;

          // Metronome
          const isDownbeat = beatInBar === 1;
          if (audioTime >= currentTime) {
            this.playMetronomeClick(audioTime, isDownbeat);
          }

          // Beat callback
          this.notifyBeat(beatInBar, bar, scheduleTick);
        }
      }

      scheduleTick = asTick((scheduleTick as number) + 1);
    }

    this.lastScheduledTick = scheduleTick;

    // Handle loop
    if (this.loop.enabled && (currentTick as number) >= (this.loop.end as number)) {
      this.setPosition(this.loop.start);
    }

    // Update state for UI
    this.notifyStateChange();
  }

  // ==========================================================================
  // TIME CONVERSION
  // ==========================================================================

  private calculateCurrentPosition(): Tick {
    if (!this.audioContext) return this.position;

    const elapsed = this.audioContext.currentTime - this.startTime;
    const elapsedTicks = this.secondsToTicks(elapsed);

    return asTick((this.startPosition as number) + (elapsedTicks as number));
  }

  /**
   * Converts ticks to seconds.
   */
  ticksToSeconds(tick: Tick): number {
    const beatsPerSecond = this.tempo / 60;
    const ticksPerSecond = beatsPerSecond * this.ticksPerBeat;
    return (tick as number) / ticksPerSecond;
  }

  /**
   * Converts seconds to ticks.
   */
  secondsToTicks(seconds: number): Tick {
    const beatsPerSecond = this.tempo / 60;
    const ticksPerSecond = beatsPerSecond * this.ticksPerBeat;
    return asTick(Math.floor(seconds * ticksPerSecond));
  }

  /**
   * Converts ticks to bar:beat position.
   */
  ticksToBarBeat(tick: Tick): BarBeatPosition {
    const ticksPerBar = this.ticksPerBeat * this.timeSignature.numerator;
    const bar = Math.floor((tick as number) / ticksPerBar) + 1;
    const tickInBar = (tick as number) % ticksPerBar;
    const beat = Math.floor(tickInBar / this.ticksPerBeat) + 1;
    const tickInBeat = tickInBar % this.ticksPerBeat;

    return { bar, beat, tick: tickInBeat };
  }

  /**
   * Converts bar:beat to ticks.
   */
  barBeatToTicks(bar: number, beat: number = 1, tick: number = 0): Tick {
    const ticksPerBar = this.ticksPerBeat * this.timeSignature.numerator;
    return asTick((bar - 1) * ticksPerBar + (beat - 1) * this.ticksPerBeat + tick);
  }

  // ==========================================================================
  // QUANTIZATION HELPERS
  // ==========================================================================

  /**
   * Quantizes tick to grid.
   */
  quantize(tick: Tick, resolution: TickDuration): Tick {
    const res = resolution as number;
    return asTick(Math.round((tick as number) / res) * res);
  }

  /**
   * Gets ticks per bar.
   */
  getTicksPerBar(): number {
    return this.ticksPerBeat * this.timeSignature.numerator;
  }

  /**
   * Gets ticks for note value.
   */
  getTicksForNoteValue(noteValue: number): TickDuration {
    // noteValue: 4 = quarter, 8 = eighth, etc.
    return asTickDuration((this.ticksPerBeat * 4) / noteValue);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Gets the transport controller singleton.
 */
export function getTransport(config?: Partial<TransportConfig>): TransportController {
  return TransportController.getInstance(config);
}

/**
 * Resets the transport (for testing).
 */
export function resetTransport(): void {
  TransportController.resetInstance();
}
