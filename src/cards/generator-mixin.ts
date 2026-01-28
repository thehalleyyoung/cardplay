/**
 * @fileoverview Generator Card Mixin - Shared functionality for all generator cards.
 * 
 * This mixin provides standardized output stream integration for generator cards:
 * - Arranger, DrumMachine, Sequencer, Melody, Arpeggiator, Bassline
 * 
 * Each generator card can use this mixin to:
 * - Write generated events to SharedEventStore
 * - Support freeze/unfreeze of generated content
 * - Integrate with chord track for harmonic awareness
 * 
 * @module @cardplay/cards/generator-mixin
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase C.2-C.7
 */

import type { Event } from '../types/event';
import type { Tick, TickDuration } from '../types/primitives';
import { asTick, asTickDuration } from '../types/primitives';
import { createNoteEvent } from '../types/event';
import type { EventStreamId } from '../state/types';
import {
  GeneratorOutputManager,
  createGeneratorOutput,
  type GeneratorType,
} from './generator-output';
import {
  getChordTrack,
  type ChordPayload,
  isNoteInChord,
  getChordTones,
} from '../containers/chord-track';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Generator state shared across all generator types.
 */
export interface GeneratorState {
  /** Whether generator is enabled */
  readonly enabled: boolean;
  /** Output stream ID */
  readonly outputStreamId: EventStreamId | null;
  /** Whether output is frozen (converted to editable) */
  readonly frozen: boolean;
  /** Whether to follow chord track */
  readonly followChords: boolean;
  /** Quantization in ticks */
  readonly quantize: TickDuration;
  /** Swing amount (0-1) */
  readonly swing: number;
  /** Humanization amount (0-1) */
  readonly humanize: number;
  /** Velocity range */
  readonly velocityRange: { min: number; max: number };
  /** Current generation mode */
  readonly mode: string;
}

/** @deprecated legacy alias used by integration exports */
export type GeneratorConfig = Partial<GeneratorState>;

/**
 * Note generation parameters.
 */
export interface NoteParams {
  readonly tick: Tick;
  readonly pitch: number;
  readonly duration: TickDuration;
  readonly velocity: number;
  readonly probability?: number;
}

/**
 * Pattern definition for generators.
 */
export interface PatternDefinition {
  readonly id: string;
  readonly name: string;
  readonly length: TickDuration;
  readonly notes: readonly NoteParams[];
  readonly tags?: readonly string[];
}

/**
 * Generator card interface that all generators implement.
 */
export interface GeneratorCard {
  /** Generator type identifier */
  readonly generatorType: GeneratorType;
  /** Unique instance ID */
  readonly instanceId: string;
  /** Current state */
  getState(): GeneratorState;
  /** Set output stream */
  setOutputStreamId(streamId: EventStreamId | null): void;
  /** Enable/disable generator */
  setEnabled(enabled: boolean): void;
  /** Generate events for a tick range */
  generate(startTick: Tick, endTick: Tick): readonly Event<unknown>[];
  /** Write generated events to store */
  writeToStore(events: readonly Event<unknown>[]): void;
  /** Freeze generated content */
  freeze(): void;
  /** Clear generated content */
  clear(): void;
  /** Dispose generator */
  dispose(): void;
}

// ============================================================================
// GENERATOR MIXIN
// ============================================================================

/**
 * Base class providing shared generator functionality.
 * 
 * Usage:
 * ```typescript
 * class MyGenerator extends GeneratorBase {
 *   readonly generatorType = 'melody' as GeneratorType;
 *   
 *   protected generateNotes(startTick: Tick, endTick: Tick): NoteParams[] {
 *     // Implement generation logic
 *     return [];
 *   }
 * }
 * ```
 */
export abstract class GeneratorBase implements GeneratorCard {
  abstract readonly generatorType: GeneratorType;
  readonly instanceId: string;
  
  protected state: GeneratorState;
  protected outputManager: GeneratorOutputManager | null = null;
  protected chordSubscriptionId: (() => void) | null = null;

  constructor(instanceId: string, initialState?: Partial<GeneratorState>) {
    this.instanceId = instanceId;
    
    this.state = {
      enabled: true,
      outputStreamId: null,
      frozen: false,
      followChords: true,
      quantize: asTickDuration(120), // 1/16th note at 480 TPQ
      swing: 0,
      humanize: 0,
      velocityRange: { min: 60, max: 100 },
      mode: 'default',
      ...initialState,
    };
  }

  // ==========================================================================
  // STATE ACCESS
  // ==========================================================================

  getState(): GeneratorState {
    return this.state;
  }

  protected setState(updates: Partial<GeneratorState>): void {
    this.state = { ...this.state, ...updates };
  }

  // ==========================================================================
  // OUTPUT CONFIGURATION
  // ==========================================================================

  setOutputStreamId(streamId: EventStreamId | null): void {
    // Dispose old output manager
    if (this.outputManager) {
      this.outputManager.dispose();
      this.outputManager = null;
    }

    this.state = { ...this.state, outputStreamId: streamId, frozen: false };

    // Create new output manager
    if (streamId) {
      this.outputManager = createGeneratorOutput({
        generatorId: this.instanceId,
        generatorType: this.generatorType,
        outputStreamId: streamId,
        enabled: this.state.enabled,
        autoReplace: true,
        generatorTag: `${this.generatorType}-${this.instanceId}`,
      });
    }
  }

  setEnabled(enabled: boolean): void {
    this.state = { ...this.state, enabled };
    if (this.outputManager) {
      if (enabled) {
        this.outputManager.enable();
      } else {
        this.outputManager.disable();
      }
    }
  }

  // ==========================================================================
  // CHORD INTEGRATION
  // ==========================================================================

  setFollowChords(follow: boolean): void {
    this.state = { ...this.state, followChords: follow };
  }

  /**
   * Gets current chord at tick position.
   */
  protected getChordAt(tick: Tick): ChordPayload | null {
    if (!this.state.followChords) return null;
    return getChordTrack().getChordAt(tick);
  }

  /**
   * Adjusts pitch to fit current chord.
   */
  protected adjustPitchToChord(pitch: number, tick: Tick): number {
    const chord = this.getChordAt(tick);
    if (!chord) return pitch;

    // If note is already in chord, keep it
    if (isNoteInChord(pitch, chord)) return pitch;

    // Find nearest chord tone
    const chordTones = getChordTones(chord);
    const firstTone = chordTones[0];
    if (firstTone === undefined) return pitch;
    const pitchClass = pitch % 12;
    const octave = Math.floor(pitch / 12);

    let nearestTone = firstTone;
    let minDistance = 12;

    for (const tone of chordTones) {
      const distance = Math.min(
        Math.abs(tone - pitchClass),
        12 - Math.abs(tone - pitchClass)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestTone = tone;
      }
    }

    return octave * 12 + nearestTone;
  }

  /**
   * Gets scale degrees from chord for melody generation.
   */
  protected getChordScaleDegrees(tick: Tick): readonly number[] {
    const chord = this.getChordAt(tick);
    if (!chord) return [0, 2, 4, 5, 7, 9, 11]; // Default to major scale
    return getChordTones(chord);
  }

  // ==========================================================================
  // TIMING HELPERS
  // ==========================================================================

  /**
   * Applies quantization to tick.
   */
  protected quantizeTick(tick: Tick): Tick {
    const q = this.state.quantize as number;
    if (q <= 0) return tick;
    return asTick(Math.round((tick as number) / q) * q);
  }

  /**
   * Applies swing to tick (affects off-beats).
   */
  protected applySwing(tick: Tick): Tick {
    if (this.state.swing === 0) return tick;

    const q = this.state.quantize as number;
    const beat = Math.floor((tick as number) / q);
    const isOffBeat = beat % 2 === 1;

    if (isOffBeat) {
      const swingOffset = Math.round(q * this.state.swing * 0.5);
      return asTick((tick as number) + swingOffset);
    }

    return tick;
  }

  /**
   * Applies humanization (random timing offset).
   */
  protected humanizeTick(tick: Tick): Tick {
    if (this.state.humanize === 0) return tick;

    const maxOffset = Math.round(this.state.quantize as number * this.state.humanize * 0.25);
    const offset = Math.round((Math.random() - 0.5) * 2 * maxOffset);

    return asTick(Math.max(0, (tick as number) + offset));
  }

  /**
   * Applies all timing transformations.
   */
  protected processTick(tick: Tick): Tick {
    let processed = this.quantizeTick(tick);
    processed = this.applySwing(processed);
    processed = this.humanizeTick(processed);
    return processed;
  }

  // ==========================================================================
  // VELOCITY HELPERS
  // ==========================================================================

  /**
   * Gets velocity with humanization.
   */
  protected getVelocity(baseVelocity?: number): number {
    const { min, max } = this.state.velocityRange;
    const base = baseVelocity ?? Math.round((min + max) / 2);

    if (this.state.humanize === 0) return base;

    const range = Math.round((max - min) * this.state.humanize * 0.5);
    const offset = Math.round((Math.random() - 0.5) * 2 * range);

    return Math.max(1, Math.min(127, base + offset));
  }

  // ==========================================================================
  // GENERATION
  // ==========================================================================

  /**
   * Abstract method - implement in subclass to generate notes.
   */
  protected abstract generateNotes(startTick: Tick, endTick: Tick): readonly NoteParams[];

  /**
   * Generates events for a tick range.
   */
  generate(startTick: Tick, endTick: Tick): readonly Event<unknown>[] {
    if (!this.state.enabled || this.state.frozen) return [];

    const noteParams = this.generateNotes(startTick, endTick);

    return noteParams.map(params => {
      // Apply timing and velocity processing
      const tick = this.processTick(params.tick);
      const velocity = this.getVelocity(params.velocity);

      // Optionally adjust pitch to chord
      const pitch = this.state.followChords
        ? this.adjustPitchToChord(params.pitch, tick)
        : params.pitch;

      return createNoteEvent(tick, params.duration, pitch, velocity);
    });
  }

  /**
   * Writes events to the output stream.
   */
  writeToStore(events: readonly Event<unknown>[]): void {
    if (!this.outputManager || this.state.frozen) return;
    this.outputManager.writeEvents(events);
  }

  /**
   * Generates and writes to store in one call.
   */
  generateAndWrite(startTick: Tick, endTick: Tick): void {
    const events = this.generate(startTick, endTick);
    this.writeToStore(events);
  }

  // ==========================================================================
  // FREEZE / CLEAR
  // ==========================================================================

  freeze(): void {
    if (!this.outputManager) return;

    this.outputManager.freezeOutputWithUndo();
    this.state = { ...this.state, frozen: true };
  }

  clear(): void {
    if (!this.outputManager) return;

    this.outputManager.clearOutputWithUndo();
    this.state = { ...this.state, frozen: false };
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  dispose(): void {
    if (this.outputManager) {
      this.outputManager.dispose();
      this.outputManager = null;
    }
    if (this.chordSubscriptionId) {
      this.chordSubscriptionId();
      this.chordSubscriptionId = null;
    }
  }
}

// ============================================================================
// SPECIFIC GENERATOR IMPLEMENTATIONS
// ============================================================================

/**
 * Arranger card state.
 */
export interface ArrangerState extends GeneratorState {
  readonly sections: readonly SectionDefinition[];
  readonly currentSection: number;
  readonly fillProbability: number;
  readonly variationAmount: number;
}

/**
 * Section definition for arranger.
 */
export interface SectionDefinition {
  readonly id: string;
  readonly name: string;
  readonly length: TickDuration;
  readonly patterns: readonly string[];
  readonly energy: number; // 0-1
  readonly density: number; // 0-1
}

/**
 * Arranger card with store integration.
 */
export class ArrangerCard extends GeneratorBase {
  readonly generatorType: GeneratorType = 'arranger';

  private arrangerState: ArrangerState;

  constructor(instanceId: string) {
    super(instanceId);
    this.arrangerState = {
      ...this.state,
      sections: [],
      currentSection: 0,
      fillProbability: 0.1,
      variationAmount: 0.3,
    };
  }

  getArrangerState(): ArrangerState {
    return this.arrangerState;
  }

  setSection(index: number): void {
    if (index >= 0 && index < this.arrangerState.sections.length) {
      this.arrangerState = { ...this.arrangerState, currentSection: index };
    }
  }

  addSection(section: SectionDefinition): void {
    this.arrangerState = {
      ...this.arrangerState,
      sections: [...this.arrangerState.sections, section],
    };
  }

  protected generateNotes(startTick: Tick, endTick: Tick): readonly NoteParams[] {
    const section = this.arrangerState.sections[this.arrangerState.currentSection];
    if (!section) return [];

    const notes: NoteParams[] = [];
    const tickRange = (endTick as number) - (startTick as number);

    // Generate notes based on section energy and density
    const noteCount = Math.round(tickRange / 480 * section.density * 4);
    const baseVelocity = Math.round(60 + section.energy * 67);

    for (let i = 0; i < noteCount; i++) {
      const tick = asTick((startTick as number) + Math.random() * tickRange);
      const pitch = 48 + Math.floor(Math.random() * 24); // C3 to C5

      notes.push({
        tick,
        pitch,
        duration: asTickDuration(240),
        velocity: baseVelocity,
        probability: 1 - this.arrangerState.variationAmount * Math.random(),
      });
    }

    // Apply probability filter
    return notes.filter(n => Math.random() < (n.probability ?? 1));
  }
}

/**
 * Drum machine state.
 */
export interface DrumMachineState extends GeneratorState {
  readonly pattern: readonly DrumHit[];
  readonly patternLength: TickDuration;
  readonly kitMapping: ReadonlyMap<string, number>; // drum name → MIDI note
}

/**
 * Drum hit definition.
 */
export interface DrumHit {
  readonly drum: string;
  readonly step: number;
  readonly velocity: number;
  readonly probability: number;
}

/**
 * Drum machine card with store integration.
 */
export class DrumMachineCard extends GeneratorBase {
  readonly generatorType: GeneratorType = 'drum-machine';

  private drumState: DrumMachineState;
  private defaultKit = new Map<string, number>([
    ['kick', 36],
    ['snare', 38],
    ['hihat', 42],
    ['hihat-open', 46],
    ['tom-low', 45],
    ['tom-mid', 47],
    ['tom-high', 50],
    ['crash', 49],
    ['ride', 51],
    ['clap', 39],
  ]);

  constructor(instanceId: string) {
    super(instanceId);
    this.drumState = {
      ...this.state,
      pattern: [],
      patternLength: asTickDuration(1920), // 1 bar
      kitMapping: this.defaultKit,
    };
  }

  getDrumState(): DrumMachineState {
    return this.drumState;
  }

  setPattern(pattern: readonly DrumHit[]): void {
    this.drumState = { ...this.drumState, pattern };
  }

  setPatternLength(length: TickDuration): void {
    this.drumState = { ...this.drumState, patternLength: length };
  }

  protected generateNotes(startTick: Tick, endTick: Tick): readonly NoteParams[] {
    const { pattern, patternLength, kitMapping } = this.drumState;
    if (pattern.length === 0) return [];

    const notes: NoteParams[] = [];
    const stepSize = (patternLength as number) / 16; // 16 steps per pattern

    // Calculate which pattern repetitions fall in range
    const patternStart = Math.floor((startTick as number) / (patternLength as number));
    const patternEnd = Math.ceil((endTick as number) / (patternLength as number));

    for (let p = patternStart; p < patternEnd; p++) {
      const patternOffset = p * (patternLength as number);

      for (const hit of pattern) {
        const tick = asTick(patternOffset + hit.step * stepSize);

        // Check if tick is in range
        if ((tick as number) < (startTick as number) || (tick as number) >= (endTick as number)) {
          continue;
        }

        // Apply probability
        if (Math.random() > hit.probability) continue;

        const pitch = kitMapping.get(hit.drum) ?? 36;

        notes.push({
          tick,
          pitch,
          duration: asTickDuration(stepSize * 0.8),
          velocity: hit.velocity,
        });
      }
    }

    return notes;
  }
}

/**
 * Sequencer card with store integration.
 */
export class SequencerCard extends GeneratorBase {
  readonly generatorType: GeneratorType = 'sequencer';

  private sequence: readonly NoteParams[] = [];
  private sequenceLength: TickDuration = asTickDuration(1920);

  getSequence(): readonly NoteParams[] {
    return this.sequence;
  }

  setSequence(sequence: readonly NoteParams[], length?: TickDuration): void {
    this.sequence = sequence;
    if (length) this.sequenceLength = length;
  }

  protected generateNotes(startTick: Tick, endTick: Tick): readonly NoteParams[] {
    if (this.sequence.length === 0) return [];

    const notes: NoteParams[] = [];
    const seqLen = this.sequenceLength as number;

    const seqStart = Math.floor((startTick as number) / seqLen);
    const seqEnd = Math.ceil((endTick as number) / seqLen);

    for (let s = seqStart; s < seqEnd; s++) {
      const offset = s * seqLen;

      for (const note of this.sequence) {
        const tick = asTick(offset + (note.tick as number));

        if ((tick as number) < (startTick as number) || (tick as number) >= (endTick as number)) {
          continue;
        }

        notes.push({ ...note, tick });
      }
    }

    return notes;
  }
}

/**
 * Melody generator state.
 */
export interface MelodyState extends GeneratorState {
  readonly scale: readonly number[]; // pitch classes
  readonly octaveRange: { low: number; high: number };
  readonly noteDensity: number; // notes per bar
  readonly stepwiseMotion: number; // 0-1, preference for stepwise movement
  readonly restProbability: number;
}

/**
 * Melody card with store integration.
 */
export class MelodyCard extends GeneratorBase {
  readonly generatorType: GeneratorType = 'melody';

  private melodyState: MelodyState;
  private lastPitch: number = 60;

  constructor(instanceId: string) {
    super(instanceId);
    this.melodyState = {
      ...this.state,
      scale: [0, 2, 4, 5, 7, 9, 11], // Major scale
      octaveRange: { low: 4, high: 6 },
      noteDensity: 4,
      stepwiseMotion: 0.7,
      restProbability: 0.2,
    };
  }

  getMelodyState(): MelodyState {
    return this.melodyState;
  }

  setScale(scale: readonly number[]): void {
    this.melodyState = { ...this.melodyState, scale };
  }

  protected generateNotes(startTick: Tick, endTick: Tick): readonly NoteParams[] {
    const { scale, octaveRange, noteDensity, stepwiseMotion, restProbability } = this.melodyState;
    const notes: NoteParams[] = [];

    const tickRange = (endTick as number) - (startTick as number);
    const bars = tickRange / 1920;
    const noteCount = Math.round(bars * noteDensity);

    for (let i = 0; i < noteCount; i++) {
      // Check for rest
      if (Math.random() < restProbability) continue;

      const tick = asTick((startTick as number) + (i / noteCount) * tickRange);

      // Generate pitch using stepwise motion preference
      let pitch: number;
      if (Math.random() < stepwiseMotion && scale.length > 1) {
        // Move by step
        const currentIndex = scale.indexOf(this.lastPitch % 12);
        const direction = Math.random() < 0.5 ? -1 : 1;
        const newIndex = Math.max(0, Math.min(scale.length - 1, currentIndex + direction));
        const octave = Math.floor(this.lastPitch / 12);
        pitch = octave * 12 + (scale[newIndex] ?? 0);
      } else {
        // Random note in scale
        const octave = octaveRange.low + Math.floor(Math.random() * (octaveRange.high - octaveRange.low + 1));
        const scaleNote = scale[Math.floor(Math.random() * scale.length)] ?? 0;
        pitch = octave * 12 + scaleNote;
      }

      // Clamp to range
      const minPitch = octaveRange.low * 12;
      const maxPitch = (octaveRange.high + 1) * 12 - 1;
      pitch = Math.max(minPitch, Math.min(maxPitch, pitch));

      this.lastPitch = pitch;

      notes.push({
        tick,
        pitch,
        duration: asTickDuration(240 + Math.random() * 240),
        velocity: 80 + Math.floor(Math.random() * 20),
      });
    }

    return notes;
  }
}

/**
 * Arpeggiator state.
 */
export interface ArpeggiatorState extends GeneratorState {
  readonly pattern: 'up' | 'down' | 'updown' | 'random' | 'order';
  readonly octaves: number;
  readonly rate: TickDuration;
  readonly gate: number; // 0-1
  readonly inputNotes: readonly number[]; // held notes
}

/**
 * Arpeggiator card with store integration.
 */
export class ArpeggiatorCard extends GeneratorBase {
  readonly generatorType: GeneratorType = 'arpeggiator';

  private arpState: ArpeggiatorState;

  constructor(instanceId: string) {
    super(instanceId);
    this.arpState = {
      ...this.state,
      pattern: 'up',
      octaves: 2,
      rate: asTickDuration(120), // 1/16th
      gate: 0.8,
      inputNotes: [],
    };
  }

  getArpState(): ArpeggiatorState {
    return this.arpState;
  }

  setInputNotes(notes: readonly number[]): void {
    this.arpState = { ...this.arpState, inputNotes: [...notes].sort((a, b) => a - b) };
  }

  setPattern(pattern: ArpeggiatorState['pattern']): void {
    this.arpState = { ...this.arpState, pattern };
  }

  setRate(rate: TickDuration): void {
    this.arpState = { ...this.arpState, rate };
  }

  protected generateNotes(startTick: Tick, endTick: Tick): readonly NoteParams[] {
    const { pattern, octaves, rate, gate, inputNotes } = this.arpState;

    if (inputNotes.length === 0) {
      // Use chord from chord track
      const chord = this.getChordAt(startTick);
      if (!chord) return [];

      const chordTones = getChordTones(chord);
      // Build notes from chord tones in octave 4
      const baseOctave = 4;
      this.arpState = {
        ...this.arpState,
        inputNotes: chordTones.map(t => baseOctave * 12 + t),
      };
    }

    const notes: NoteParams[] = [];
    const effectiveNotes = this.arpState.inputNotes;

    // Build full arp sequence across octaves
    const arpSequence: number[] = [];
    for (let oct = 0; oct < octaves; oct++) {
      for (const note of effectiveNotes) {
        arpSequence.push(note + oct * 12);
      }
    }

    // Apply pattern
    let orderedSequence: number[];
    switch (pattern) {
      case 'up':
        orderedSequence = arpSequence;
        break;
      case 'down':
        orderedSequence = [...arpSequence].reverse();
        break;
      case 'updown':
        orderedSequence = [...arpSequence, ...arpSequence.slice(1, -1).reverse()];
        break;
      case 'random':
        orderedSequence = [...arpSequence].sort(() => Math.random() - 0.5);
        break;
      case 'order':
      default:
        orderedSequence = arpSequence;
    }

    if (orderedSequence.length === 0) return [];

    // Generate notes
    const rateValue = rate as number;
    const duration = asTickDuration(Math.round(rateValue * gate));

    let currentTick = startTick as number;
    let seqIndex = 0;

    while (currentTick < (endTick as number)) {
      notes.push({
        tick: asTick(currentTick),
        pitch: orderedSequence[seqIndex % orderedSequence.length] ?? 0,
        duration,
        velocity: 90,
      });

      currentTick += rateValue;
      seqIndex++;
    }

    return notes;
  }
}

/**
 * Bassline state.
 */
export interface BasslineState extends GeneratorState {
  readonly pattern: 'root' | 'fifths' | 'walking' | 'syncopated';
  readonly octave: number;
  readonly rate: TickDuration;
  readonly ghostNotes: boolean;
}

/**
 * Bassline card with store integration.
 */
export class BasslineCard extends GeneratorBase {
  readonly generatorType: GeneratorType = 'bassline';

  private bassState: BasslineState;

  constructor(instanceId: string) {
    super(instanceId);
    this.bassState = {
      ...this.state,
      pattern: 'root',
      octave: 2,
      rate: asTickDuration(480), // Quarter notes
      ghostNotes: true,
    };
  }

  getBassState(): BasslineState {
    return this.bassState;
  }

  setPattern(pattern: BasslineState['pattern']): void {
    this.bassState = { ...this.bassState, pattern };
  }

  protected generateNotes(startTick: Tick, endTick: Tick): readonly NoteParams[] {
    const { pattern, octave, rate, ghostNotes } = this.bassState;
    const notes: NoteParams[] = [];

    const rateValue = rate as number;
    let currentTick = startTick as number;

    while (currentTick < (endTick as number)) {
      const chord = this.getChordAt(asTick(currentTick));
      if (!chord) {
        currentTick += rateValue;
        continue;
      }

      const chordTones = getChordTones(chord);
      const rootPitchClass = chordTones[0] ?? 0;
      const fifthPitchClass = chordTones[2] ?? ((rootPitchClass + 7) % 12);

      switch (pattern) {
        case 'root':
          notes.push({
            tick: asTick(currentTick),
            pitch: octave * 12 + rootPitchClass,
            duration: asTickDuration(rateValue * 0.9),
            velocity: 100,
          });
          break;

        case 'fifths':
          notes.push({
            tick: asTick(currentTick),
            pitch: octave * 12 + rootPitchClass,
            duration: asTickDuration(rateValue * 0.9),
            velocity: 100,
          });
          if (currentTick + rateValue / 2 < (endTick as number)) {
            notes.push({
              tick: asTick(currentTick + rateValue / 2),
              pitch: octave * 12 + fifthPitchClass,
              duration: asTickDuration(rateValue * 0.4),
              velocity: 80,
            });
          }
          break;

        case 'walking':
          // Walk through chord tones
          const walkIndex = Math.floor(currentTick / rateValue) % chordTones.length;
          notes.push({
            tick: asTick(currentTick),
            pitch: octave * 12 + (chordTones[walkIndex] ?? rootPitchClass),
            duration: asTickDuration(rateValue * 0.8),
            velocity: 90,
          });
          break;

        case 'syncopated':
          // Main note on beat
          notes.push({
            tick: asTick(currentTick),
            pitch: octave * 12 + rootPitchClass,
            duration: asTickDuration(rateValue * 0.4),
            velocity: 100,
          });
          // Syncopated note
          if (ghostNotes && currentTick + rateValue * 0.75 < (endTick as number)) {
            notes.push({
              tick: asTick(currentTick + rateValue * 0.75),
              pitch: octave * 12 + fifthPitchClass,
              duration: asTickDuration(rateValue * 0.2),
              velocity: 60,
            });
          }
          break;
      }

      currentTick += rateValue;
    }

    return notes;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates an arranger card.
 */
export function createArrangerCard(instanceId: string): ArrangerCard {
  return new ArrangerCard(instanceId);
}

/**
 * Creates a drum machine card.
 */
export function createDrumMachineCard(instanceId: string): DrumMachineCard {
  return new DrumMachineCard(instanceId);
}

/**
 * Creates a sequencer card.
 */
export function createSequencerCard(instanceId: string): SequencerCard {
  return new SequencerCard(instanceId);
}

/**
 * Creates a melody card.
 */
export function createMelodyCard(instanceId: string): MelodyCard {
  return new MelodyCard(instanceId);
}

/**
 * Creates an arpeggiator card.
 */
export function createArpeggiatorCard(instanceId: string): ArpeggiatorCard {
  return new ArpeggiatorCard(instanceId);
}

/**
 * Creates a bassline card.
 */
export function createBasslineCard(instanceId: string): BasslineCard {
  return new BasslineCard(instanceId);
}
