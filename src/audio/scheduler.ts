/**
 * @fileoverview Event Scheduling System.
 * 
 * Provides tempo-aware event scheduling with:
 * - High-precision tick-to-sample conversion
 * - Lookahead buffer for accurate timing
 * - Schedule queue with priority
 * - Swing and humanization
 * - Tempo automation
 * - Time signature support
 * - Beat/bar callbacks
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Time signature definition.
 */
export interface TimeSignature {
  readonly numerator: number;    // Beats per bar
  readonly denominator: number;  // Note value of beat (4 = quarter, 8 = eighth)
}

/**
 * Default time signature (4/4).
 */
export const DEFAULT_TIME_SIGNATURE: TimeSignature = {
  numerator: 4,
  denominator: 4,
};

/**
 * Transport state.
 */
export type TransportState = 'stopped' | 'playing' | 'paused' | 'recording';

/**
 * Transport position.
 */
export interface TransportPosition {
  readonly ticks: number;        // Total ticks from start
  readonly bar: number;          // Current bar (1-indexed)
  readonly beat: number;         // Current beat within bar (1-indexed)
  readonly sixteenth: number;    // Sixteenth within beat (1-indexed)
  readonly samples: number;      // Total samples from start
  readonly seconds: number;      // Total seconds from start
}

/**
 * Scheduler configuration.
 */
export interface SchedulerConfig {
  readonly sampleRate: number;
  readonly ticksPerBeat: number;     // PPQN (pulses per quarter note)
  readonly lookaheadMs: number;      // Lookahead window
  readonly scheduleIntervalMs: number;  // Schedule callback interval
}

/**
 * Default scheduler configuration.
 */
export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  sampleRate: 48000,
  ticksPerBeat: 480,        // Standard MIDI resolution
  lookaheadMs: 50,          // 50ms lookahead
  scheduleIntervalMs: 25,   // 25ms schedule interval
};

/**
 * Scheduled event.
 */
export interface ScheduledEvent<T = unknown> {
  readonly id: string;
  readonly time: number;       // Time in ticks
  readonly priority: number;   // Higher = first (0-10)
  readonly data: T;
  readonly cancelled?: boolean;
}

/**
 * Tempo automation point.
 */
export interface TempoPoint {
  readonly tick: number;       // Position in ticks
  readonly tempo: number;      // BPM
  readonly curve?: 'linear' | 'exponential' | 'step';
}

/**
 * Swing settings.
 */
export interface SwingSettings {
  readonly amount: number;     // 0-1 (0 = straight, 0.5 = triplet feel)
  readonly resolution: number; // Swing resolution in ticks (typically 1/8 or 1/16)
}

/**
 * Humanization settings.
 */
export interface HumanizationSettings {
  readonly timing: number;     // Timing variation in ms (0-20)
  readonly velocity: number;   // Velocity variation (0-1)
  readonly random?: boolean;   // True = random, false = consistent pattern
}

/**
 * Groove template entry.
 */
export interface GrooveEntry {
  readonly position: number;   // Position in pattern (0-based sixteenths)
  readonly offset: number;     // Time offset in ticks
  readonly velocity: number;   // Velocity multiplier (0-2)
  readonly gate?: number;      // Gate length multiplier (0-2)
}

/**
 * Groove template.
 */
export interface GrooveTemplate {
  readonly name: string;
  readonly length: number;     // Length in sixteenths
  readonly entries: readonly GrooveEntry[];
}

/**
 * Loop region.
 */
export interface LoopRegion {
  readonly start: number;      // Start tick
  readonly end: number;        // End tick
  readonly count?: number;     // Number of loops (undefined = infinite)
}

/**
 * Marker/cue point.
 */
export interface Marker {
  readonly id: string;
  readonly name: string;
  readonly tick: number;
  readonly color?: string;
}

// ============================================================================
// TIMING CALCULATIONS
// ============================================================================

/**
 * Converts ticks to samples.
 */
export function ticksToSamples(
  ticks: number,
  tempo: number,
  sampleRate: number,
  ticksPerBeat: number
): number {
  const beatsPerSecond = tempo / 60;
  const ticksPerSecond = beatsPerSecond * ticksPerBeat;
  const seconds = ticks / ticksPerSecond;
  return Math.round(seconds * sampleRate);
}

/**
 * Converts samples to ticks.
 */
export function samplesToTicks(
  samples: number,
  tempo: number,
  sampleRate: number,
  ticksPerBeat: number
): number {
  const seconds = samples / sampleRate;
  const beatsPerSecond = tempo / 60;
  const ticksPerSecond = beatsPerSecond * ticksPerBeat;
  return Math.round(seconds * ticksPerSecond);
}

/**
 * Converts ticks to seconds.
 */
export function ticksToSeconds(
  ticks: number,
  tempo: number,
  ticksPerBeat: number
): number {
  const beatsPerSecond = tempo / 60;
  const ticksPerSecond = beatsPerSecond * ticksPerBeat;
  return ticks / ticksPerSecond;
}

/**
 * Converts seconds to ticks.
 */
export function secondsToTicks(
  seconds: number,
  tempo: number,
  ticksPerBeat: number
): number {
  const beatsPerSecond = tempo / 60;
  const ticksPerSecond = beatsPerSecond * ticksPerBeat;
  return Math.round(seconds * ticksPerSecond);
}

/**
 * Converts bar/beat/sixteenth to ticks.
 */
export function positionToTicks(
  bar: number,
  beat: number,
  sixteenth: number,
  timeSignature: TimeSignature,
  ticksPerBeat: number
): number {
  const ticksPerBar = ticksPerBeat * timeSignature.numerator;
  const ticksPerSixteenth = ticksPerBeat / 4;
  
  return (bar - 1) * ticksPerBar + 
         (beat - 1) * ticksPerBeat + 
         (sixteenth - 1) * ticksPerSixteenth;
}

/**
 * Converts ticks to bar/beat/sixteenth.
 */
export function ticksToPosition(
  ticks: number,
  timeSignature: TimeSignature,
  ticksPerBeat: number
): { bar: number; beat: number; sixteenth: number } {
  const ticksPerBar = ticksPerBeat * timeSignature.numerator;
  const ticksPerSixteenth = ticksPerBeat / 4;
  
  const bar = Math.floor(ticks / ticksPerBar) + 1;
  const ticksInBar = ticks % ticksPerBar;
  const beat = Math.floor(ticksInBar / ticksPerBeat) + 1;
  const ticksInBeat = ticksInBar % ticksPerBeat;
  const sixteenth = Math.floor(ticksInBeat / ticksPerSixteenth) + 1;
  
  return { bar, beat, sixteenth };
}

/**
 * Quantizes ticks to nearest grid position.
 */
export function quantizeTicks(
  ticks: number,
  gridSize: number,
  mode: 'nearest' | 'floor' | 'ceil' = 'nearest'
): number {
  switch (mode) {
    case 'floor':
      return Math.floor(ticks / gridSize) * gridSize;
    case 'ceil':
      return Math.ceil(ticks / gridSize) * gridSize;
    default:
      return Math.round(ticks / gridSize) * gridSize;
  }
}

/**
 * Gets ticks per note value.
 */
export function getTicksPerNote(noteValue: number, ticksPerBeat: number): number {
  // Note value: 1 = whole, 2 = half, 4 = quarter, 8 = eighth, 16 = sixteenth
  return (ticksPerBeat * 4) / noteValue;
}

// ============================================================================
// SWING AND HUMANIZATION
// ============================================================================

/**
 * Applies swing to a tick position.
 */
export function applySwing(
  ticks: number,
  swing: SwingSettings,
  ticksPerBeat: number
): number {
  if (swing.amount === 0) return ticks;
  
  const resolution = swing.resolution || ticksPerBeat / 2; // Default to 8th notes
  const positionInPair = (ticks / resolution) % 2;
  
  if (positionInPair >= 0.5 && positionInPair < 1.5) {
    // This is the "offbeat" - apply swing
    const swingOffset = resolution * swing.amount;
    return ticks + swingOffset;
  }
  
  return ticks;
}

/**
 * Applies humanization to timing.
 */
export function applyHumanization(
  ticks: number,
  humanization: HumanizationSettings,
  _sampleRate: number,
  ticksPerBeat: number,
  tempo: number
): number {
  if (humanization.timing === 0) return ticks;
  
  const maxOffsetMs = humanization.timing;
  const maxOffsetSeconds = maxOffsetMs / 1000;
  const beatsPerSecond = tempo / 60;
  const maxOffsetTicks = maxOffsetSeconds * beatsPerSecond * ticksPerBeat;
  
  // Random offset within range
  const offset = (Math.random() * 2 - 1) * maxOffsetTicks;
  
  return Math.max(0, ticks + offset);
}

/**
 * Applies groove template to a tick position.
 */
export function applyGroove(
  ticks: number,
  groove: GrooveTemplate,
  ticksPerBeat: number
): { offset: number; velocity: number; gate: number } {
  const ticksPerSixteenth = ticksPerBeat / 4;
  const patternLength = groove.length * ticksPerSixteenth;
  
  const positionInPattern = ticks % patternLength;
  const sixteenthIndex = Math.floor(positionInPattern / ticksPerSixteenth);
  
  const entry = groove.entries.find(e => e.position === sixteenthIndex);
  
  return {
    offset: entry?.offset ?? 0,
    velocity: entry?.velocity ?? 1,
    gate: entry?.gate ?? 1,
  };
}

// ============================================================================
// TEMPO AUTOMATION
// ============================================================================

/**
 * Gets tempo at a specific tick position with automation.
 */
export function getTempoAtTick(
  tick: number,
  tempoPoints: readonly TempoPoint[]
): number {
  if (tempoPoints.length === 0) return 120; // Default tempo
  
  // Find the surrounding tempo points
  let prevPoint: TempoPoint | null = null;
  let nextPoint: TempoPoint | null = null;
  
  for (const point of tempoPoints) {
    if (point.tick <= tick) {
      prevPoint = point;
    } else {
      nextPoint = point;
      break;
    }
  }
  
  if (!prevPoint) return tempoPoints[0]!.tempo;
  if (!nextPoint) return prevPoint.tempo;
  
  // Interpolate based on curve type
  const curve = prevPoint.curve ?? 'step';
  
  if (curve === 'step') {
    return prevPoint.tempo;
  }
  
  const progress = (tick - prevPoint.tick) / (nextPoint.tick - prevPoint.tick);
  
  if (curve === 'linear') {
    return prevPoint.tempo + (nextPoint.tempo - prevPoint.tempo) * progress;
  }
  
  if (curve === 'exponential') {
    const ratio = nextPoint.tempo / prevPoint.tempo;
    return prevPoint.tempo * Math.pow(ratio, progress);
  }
  
  return prevPoint.tempo;
}

/**
 * Calculates total time with tempo automation.
 */
export function calculateTimeWithTempoAutomation(
  startTick: number,
  endTick: number,
  tempoPoints: readonly TempoPoint[],
  ticksPerBeat: number
): number {
  if (tempoPoints.length === 0) {
    return ticksToSeconds(endTick - startTick, 120, ticksPerBeat);
  }
  
  // Simple integration - sum up small segments
  let totalSeconds = 0;
  const step = ticksPerBeat / 4; // Quarter-note resolution
  
  for (let tick = startTick; tick < endTick; tick += step) {
    const tempo = getTempoAtTick(tick, tempoPoints);
    const segmentTicks = Math.min(step, endTick - tick);
    totalSeconds += ticksToSeconds(segmentTicks, tempo, ticksPerBeat);
  }
  
  return totalSeconds;
}

// ============================================================================
// SCHEDULE QUEUE
// ============================================================================

/**
 * Priority queue for scheduled events.
 */
export class ScheduleQueue<T> {
  private events: ScheduledEvent<T>[] = [];
  private nextId = 0;

  /**
   * Schedules an event.
   */
  schedule(time: number, data: T, priority: number = 5): string {
    const id = `evt_${this.nextId++}`;
    const event: ScheduledEvent<T> = { id, time, priority, data };
    
    // Insert in sorted position
    let insertIndex = this.events.length;
    for (let i = 0; i < this.events.length; i++) {
      const existing = this.events[i]!;
      if (time < existing.time || (time === existing.time && priority > existing.priority)) {
        insertIndex = i;
        break;
      }
    }
    
    this.events.splice(insertIndex, 0, event);
    return id;
  }

  /**
   * Cancels an event by id.
   */
  cancel(id: string): boolean {
    const index = this.events.findIndex(e => e.id === id);
    if (index !== -1) {
      this.events.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Reschedules an event to a new time.
   */
  reschedule(id: string, newTime: number): boolean {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    const event = this.events[index]!;
    this.events.splice(index, 1);
    
    const newEvent: ScheduledEvent<T> = { ...event, time: newTime };
    
    // Re-insert in sorted position
    let insertIndex = this.events.length;
    for (let i = 0; i < this.events.length; i++) {
      if (newTime < this.events[i]!.time) {
        insertIndex = i;
        break;
      }
    }
    
    this.events.splice(insertIndex, 0, newEvent);
    return true;
  }

  /**
   * Gets events within a time range.
   */
  getEventsInRange(startTime: number, endTime: number): readonly ScheduledEvent<T>[] {
    return this.events.filter(e => e.time >= startTime && e.time < endTime);
  }

  /**
   * Removes and returns events up to a time.
   */
  popEventsUntil(time: number): ScheduledEvent<T>[] {
    const result: ScheduledEvent<T>[] = [];
    
    while (this.events.length > 0 && this.events[0]!.time <= time) {
      result.push(this.events.shift()!);
    }
    
    return result;
  }

  /**
   * Clears all events.
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Gets the number of pending events.
   */
  get count(): number {
    return this.events.length;
  }

  /**
   * Gets all pending events (readonly).
   */
  get pending(): readonly ScheduledEvent<T>[] {
    return this.events;
  }
}

// ============================================================================
// TRANSPORT
// ============================================================================

/**
 * Transport callbacks.
 */
export interface TransportCallbacks {
  readonly onPlay?: () => void;
  readonly onPause?: () => void;
  readonly onStop?: () => void;
  readonly onBeat?: (beat: number, bar: number) => void;
  readonly onBar?: (bar: number) => void;
  readonly onLoop?: (iteration: number) => void;
  readonly onMarker?: (marker: Marker) => void;
}

/**
 * Transport state.
 */
export interface TransportSnapshot {
  readonly state: TransportState;
  readonly position: TransportPosition;
  readonly tempo: number;
  readonly timeSignature: TimeSignature;
  readonly loop: LoopRegion | null;
  readonly loopEnabled: boolean;
}

/**
 * Creates a transport position from ticks.
 */
export function createTransportPosition(
  ticks: number,
  tempo: number,
  timeSignature: TimeSignature,
  ticksPerBeat: number,
  sampleRate: number
): TransportPosition {
  const { bar, beat, sixteenth } = ticksToPosition(ticks, timeSignature, ticksPerBeat);
  const samples = ticksToSamples(ticks, tempo, sampleRate, ticksPerBeat);
  const seconds = ticksToSeconds(ticks, tempo, ticksPerBeat);
  
  return { ticks, bar, beat, sixteenth, samples, seconds };
}

// ============================================================================
// SCHEDULER
// ============================================================================

/**
 * Audio scheduler for precise timing.
 */
export class AudioScheduler<T> {
  private readonly config: SchedulerConfig;
  private readonly queue: ScheduleQueue<T>;
  private tempo = 120;
  private timeSignature: TimeSignature = DEFAULT_TIME_SIGNATURE;
  private state: TransportState = 'stopped';
  private positionTicks = 0;
  private lastBeat = 0;
  private lastBar = 0;
  private callbacks: TransportCallbacks = {};
  private loop: LoopRegion | null = null;
  private loopEnabled = false;
  private loopIteration = 0;
  private markers: Marker[] = [];
  private tempoPoints: TempoPoint[] = [];

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...DEFAULT_SCHEDULER_CONFIG, ...config };
    this.queue = new ScheduleQueue<T>();
  }

  /**
   * Sets the tempo.
   */
  setTempo(tempo: number): void {
    this.tempo = Math.max(20, Math.min(300, tempo));
  }

  /**
   * Gets the current tempo.
   */
  getTempo(): number {
    if (this.tempoPoints.length > 0) {
      return getTempoAtTick(this.positionTicks, this.tempoPoints);
    }
    return this.tempo;
  }

  /**
   * Sets the time signature.
   */
  setTimeSignature(timeSignature: TimeSignature): void {
    this.timeSignature = timeSignature;
  }

  /**
   * Gets the time signature.
   */
  getTimeSignature(): TimeSignature {
    return this.timeSignature;
  }

  /**
   * Starts playback.
   */
  play(_startSample: number = 0): void {
    if (this.state === 'playing') return;
    
    this.state = 'playing';
    this.callbacks.onPlay?.();
  }

  /**
   * Pauses playback.
   */
  pause(): void {
    if (this.state !== 'playing') return;
    
    this.state = 'paused';
    this.callbacks.onPause?.();
  }

  /**
   * Stops playback and resets position.
   */
  stop(): void {
    this.state = 'stopped';
    this.positionTicks = 0;
    this.lastBeat = 0;
    this.lastBar = 0;
    this.loopIteration = 0;
    this.callbacks.onStop?.();
  }

  /**
   * Seeks to a position.
   */
  seek(ticks: number): void {
    this.positionTicks = Math.max(0, ticks);
    const pos = ticksToPosition(this.positionTicks, this.timeSignature, this.config.ticksPerBeat);
    this.lastBeat = pos.beat;
    this.lastBar = pos.bar;
  }

  /**
   * Advances the scheduler by a number of samples.
   */
  advance(samples: number): void {
    if (this.state !== 'playing') return;
    
    const currentTempo = this.getTempo();
    const ticksAdvanced = samplesToTicks(
      samples, 
      currentTempo, 
      this.config.sampleRate, 
      this.config.ticksPerBeat
    );
    
    const prevTicks = this.positionTicks;
    this.positionTicks += ticksAdvanced;
    
    // Check for loop
    if (this.loopEnabled && this.loop) {
      if (this.positionTicks >= this.loop.end) {
        const overrun = this.positionTicks - this.loop.end;
        this.positionTicks = this.loop.start + overrun;
        this.loopIteration++;
        
        if (this.loop.count !== undefined && this.loopIteration >= this.loop.count) {
          this.loopEnabled = false;
        } else {
          this.callbacks.onLoop?.(this.loopIteration);
        }
      }
    }
    
    // Check for beat/bar callbacks
    const pos = ticksToPosition(this.positionTicks, this.timeSignature, this.config.ticksPerBeat);
    
    if (pos.beat !== this.lastBeat) {
      this.callbacks.onBeat?.(pos.beat, pos.bar);
      this.lastBeat = pos.beat;
    }
    
    if (pos.bar !== this.lastBar) {
      this.callbacks.onBar?.(pos.bar);
      this.lastBar = pos.bar;
    }
    
    // Check for markers
    for (const marker of this.markers) {
      if (marker.tick > prevTicks && marker.tick <= this.positionTicks) {
        this.callbacks.onMarker?.(marker);
      }
    }
  }

  /**
   * Schedules an event.
   */
  schedule(ticks: number, data: T, priority: number = 5): string {
    return this.queue.schedule(ticks, data, priority);
  }

  /**
   * Cancels an event.
   */
  cancel(id: string): boolean {
    return this.queue.cancel(id);
  }

  /**
   * Gets events ready to be processed.
   */
  getReadyEvents(): readonly ScheduledEvent<T>[] {
    const lookaheadTicks = samplesToTicks(
      (this.config.lookaheadMs / 1000) * this.config.sampleRate,
      this.getTempo(),
      this.config.sampleRate,
      this.config.ticksPerBeat
    );
    
    return this.queue.popEventsUntil(this.positionTicks + lookaheadTicks);
  }

  /**
   * Sets callbacks.
   */
  setCallbacks(callbacks: TransportCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Sets loop region.
   */
  setLoop(loop: LoopRegion | null): void {
    this.loop = loop;
    this.loopIteration = 0;
  }

  /**
   * Enables/disables loop.
   */
  setLoopEnabled(enabled: boolean): void {
    this.loopEnabled = enabled;
    this.loopIteration = 0;
  }

  /**
   * Adds a marker.
   */
  addMarker(marker: Marker): void {
    this.markers.push(marker);
    this.markers.sort((a, b) => a.tick - b.tick);
  }

  /**
   * Removes a marker.
   */
  removeMarker(id: string): boolean {
    const index = this.markers.findIndex(m => m.id === id);
    if (index !== -1) {
      this.markers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Sets tempo automation points.
   */
  setTempoAutomation(points: readonly TempoPoint[]): void {
    this.tempoPoints = [...points].sort((a, b) => a.tick - b.tick);
  }

  /**
   * Gets current state snapshot.
   */
  getSnapshot(): TransportSnapshot {
    const position = createTransportPosition(
      this.positionTicks,
      this.getTempo(),
      this.timeSignature,
      this.config.ticksPerBeat,
      this.config.sampleRate
    );
    
    return {
      state: this.state,
      position,
      tempo: this.getTempo(),
      timeSignature: this.timeSignature,
      loop: this.loop,
      loopEnabled: this.loopEnabled,
    };
  }

  /**
   * Gets current position in ticks.
   */
  getPositionTicks(): number {
    return this.positionTicks;
  }

  /**
   * Gets transport state.
   */
  getState(): TransportState {
    return this.state;
  }

  /**
   * Clears the schedule queue.
   */
  clearQueue(): void {
    this.queue.clear();
  }
}

// ============================================================================
// METRONOME
// ============================================================================

/**
 * Metronome settings.
 */
export interface MetronomeSettings {
  readonly enabled: boolean;
  readonly volume: number;           // 0-1
  readonly accentDownbeat: boolean;  // Accent bar starts
  readonly countIn: number;          // Bars of count-in (0 = none)
  readonly subdivision?: number;     // Optional subdivision clicks
}

/**
 * Default metronome settings.
 */
export const DEFAULT_METRONOME: MetronomeSettings = {
  enabled: true,
  volume: 0.7,
  accentDownbeat: true,
  countIn: 0,
};

/**
 * Metronome click type.
 */
export type MetronomeClick = 'downbeat' | 'beat' | 'subdivision';

/**
 * Creates metronome click events for a bar.
 */
export function createMetronomeClicks(
  barStart: number,
  timeSignature: TimeSignature,
  ticksPerBeat: number,
  settings: MetronomeSettings
): Array<{ tick: number; type: MetronomeClick }> {
  const clicks: Array<{ tick: number; type: MetronomeClick }> = [];
  
  for (let beat = 0; beat < timeSignature.numerator; beat++) {
    const tick = barStart + beat * ticksPerBeat;
    const type: MetronomeClick = beat === 0 && settings.accentDownbeat ? 'downbeat' : 'beat';
    clicks.push({ tick, type });
    
    if (settings.subdivision !== undefined && settings.subdivision > 1) {
      const subTicks = ticksPerBeat / settings.subdivision;
      for (let sub = 1; sub < settings.subdivision; sub++) {
        clicks.push({ tick: tick + sub * subTicks, type: 'subdivision' });
      }
    }
  }
  
  return clicks;
}

// ============================================================================
// PREROLL
// ============================================================================

/**
 * Preroll settings.
 */
export interface PrerollSettings {
  readonly enabled: boolean;
  readonly bars: number;
  readonly metronome: boolean;
}

/**
 * Default preroll settings.
 */
export const DEFAULT_PREROLL: PrerollSettings = {
  enabled: false,
  bars: 1,
  metronome: true,
};

/**
 * Calculates preroll start position.
 */
export function calculatePrerollStart(
  startTick: number,
  bars: number,
  timeSignature: TimeSignature,
  ticksPerBeat: number
): number {
  const ticksPerBar = ticksPerBeat * timeSignature.numerator;
  return Math.max(0, startTick - bars * ticksPerBar);
}
