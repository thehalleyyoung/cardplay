/**
 * @fileoverview Instrument Cards & Deck Integration
 * 
 * Implements Card-based wrappers for instruments:
 * - SamplerCard with MIDI/audio routing
 * - WavetableCard with modulation routing
 * - HybridCard combining both
 * - Arpeggiator, Chord, and Sequencer integration
 * - Deck synchronization and routing
 * 
 * @module @cardplay/core/audio/instrument-cards
 */

import { Instrument, ModulationRouting, MacroControl } from './unified-instrument';
import { HybridInstrument, HybridMode, HybridConfig } from './hybrid-instrument';

// ============================================================================
// CARD TYPES
// ============================================================================

/** Card state */
export type CardState = 'idle' | 'active' | 'bypassed' | 'muted' | 'soloed';

/** MIDI routing mode */
export type MIDIRoutingMode = 'through' | 'channel_filter' | 'transpose' | 'split' | 'layer';

/** Audio routing mode */
export type AudioRoutingMode = 'stereo' | 'mono' | 'mid_side' | 'multiout';

/** Card category */
export type CardCategory = 'sampler' | 'wavetable' | 'hybrid' | 'effect' | 'midi' | 'utility';

/** Base card interface */
export interface Card {
  id: string;
  name: string;
  category: CardCategory;
  state: CardState;
  
  // Lifecycle
  initialize(): Promise<void>;
  dispose(): void;
  bypass(bypass: boolean): void;
  mute(mute: boolean): void;
  solo(solo: boolean): void;
  
  // Processing
  processAudio(inputL: Float32Array, inputR: Float32Array, outputL: Float32Array, outputR: Float32Array): void;
  processMIDI(data: Uint8Array, timestamp: number): void;
  
  // State
  getState(): CardState;
  saveState(): CardSnapshot;
  restoreState(snapshot: CardSnapshot): void;
}

/** Card snapshot for undo/redo */
export interface CardSnapshot {
  id: string;
  timestamp: number;
  data: unknown;
}

/** MIDI event */
export interface MIDIEvent {
  type: 'noteon' | 'noteoff' | 'cc' | 'pitchbend' | 'aftertouch' | 'program';
  channel: number;
  data1: number;
  data2: number;
  timestamp: number;
}

/** Deck slot */
export interface DeckSlot {
  index: number;
  card: Card | null;
  enabled: boolean;
  midiChannel: number;
  audioInputFrom: number | null;  // Slot index or null for deck input
  audioOutputTo: number | null;   // Slot index or null for deck output
}

// ============================================================================
// ARPEGGIATOR
// ============================================================================

/** Arpeggiator mode */
export type ArpMode = 'up' | 'down' | 'up_down' | 'down_up' | 'random' | 'order' | 'chord';

/** Arpeggiator configuration */
export interface ArpeggiatorConfig {
  enabled: boolean;
  mode: ArpMode;
  octaves: number;       // 1-4
  rate: number;          // note value: 1=whole, 2=half, 4=quarter, etc.
  gate: number;          // 0-1, note length
  swing: number;         // -1 to 1
  velocity: 'as_played' | 'fixed' | 'accent' | 'random';
  fixedVelocity: number;
  accentPattern: number[];  // velocity multipliers
  holdNotes: boolean;
  latch: boolean;
}

/** Default arpeggiator config */
export const DEFAULT_ARP_CONFIG: ArpeggiatorConfig = {
  enabled: false,
  mode: 'up',
  octaves: 1,
  rate: 8,
  gate: 0.5,
  swing: 0,
  velocity: 'as_played',
  fixedVelocity: 100,
  accentPattern: [1.2, 0.8, 1.0, 0.8],
  holdNotes: false,
  latch: false,
};

/**
 * Arpeggiator processor
 */
export class Arpeggiator {
  private config: ArpeggiatorConfig;
  private heldNotes: Array<{ note: number; velocity: number }> = [];
  private currentIndex = 0;
  private currentOctave = 0;
  private direction: 1 | -1 = 1;
  private stepCounter = 0;
  private lastStepTime = 0;
  private isPlaying = false;
  
  // Tempo
  private tempo = 120;
  private sampleRate = 44100;
  private samplesPerBeat = 0;
  
  // Output
  private pendingNoteOff: { note: number; time: number } | null = null;
  
  constructor(config?: Partial<ArpeggiatorConfig>) {
    this.config = { ...DEFAULT_ARP_CONFIG, ...config };
    this.updateTiming();
  }
  
  /**
   * Set tempo
   */
  setTempo(bpm: number): void {
    this.tempo = bpm;
    this.updateTiming();
  }
  
  /**
   * Update timing calculations
   */
  private updateTiming(): void {
    this.samplesPerBeat = (this.sampleRate * 60) / this.tempo;
  }
  
  /**
   * Set configuration
   */
  setConfig(config: Partial<ArpeggiatorConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get configuration
   */
  getConfig(): ArpeggiatorConfig {
    return { ...this.config };
  }
  
  /**
   * Note on
   */
  noteOn(note: number, velocity: number): void {
    const existing = this.heldNotes.findIndex(n => n.note === note);
    if (existing >= 0) {
      const existingNote = this.heldNotes[existing];
      if (existingNote) existingNote.velocity = velocity;
    } else {
      this.heldNotes.push({ note, velocity });
      this.sortNotes();
    }
    
    if (!this.isPlaying && this.heldNotes.length > 0) {
      this.start();
    }
  }
  
  /**
   * Note off
   */
  noteOff(note: number): void {
    if (this.config.latch) return;
    
    const index = this.heldNotes.findIndex(n => n.note === note);
    if (index >= 0) {
      this.heldNotes.splice(index, 1);
    }
    
    if (this.heldNotes.length === 0 && !this.config.holdNotes) {
      this.stop();
    }
  }
  
  /**
   * Process and generate MIDI events
   */
  process(_numSamples: number, currentTime: number): MIDIEvent[] {
    if (!this.config.enabled || !this.isPlaying || this.heldNotes.length === 0) {
      return [];
    }
    
    const events: MIDIEvent[] = [];
    const stepDuration = this.samplesPerBeat / (this.config.rate / 4);
    
    // Check for pending note off
    if (this.pendingNoteOff && currentTime >= this.pendingNoteOff.time) {
      events.push({
        type: 'noteoff',
        channel: 0,
        data1: this.pendingNoteOff.note,
        data2: 0,
        timestamp: currentTime,
      });
      this.pendingNoteOff = null;
    }
    
    // Check if it's time for next step
    if (currentTime - this.lastStepTime >= stepDuration) {
      const { note, velocity } = this.getNextNote();
      const actualVelocity = this.calculateVelocity(velocity);
      
      // Note on
      events.push({
        type: 'noteon',
        channel: 0,
        data1: note,
        data2: actualVelocity,
        timestamp: currentTime,
      });
      
      // Schedule note off
      const gateTime = stepDuration * this.config.gate;
      this.pendingNoteOff = {
        note,
        time: currentTime + gateTime,
      };
      
      this.lastStepTime = currentTime;
      this.stepCounter++;
    }
    
    return events;
  }
  
  /**
   * Start arpeggiator
   */
  start(): void {
    this.isPlaying = true;
    this.currentIndex = 0;
    this.currentOctave = 0;
    this.direction = 1;
    this.stepCounter = 0;
    this.lastStepTime = 0;
  }
  
  /**
   * Stop arpeggiator
   */
  stop(): void {
    this.isPlaying = false;
    this.pendingNoteOff = null;
  }
  
  /**
   * Clear all held notes
   */
  clear(): void {
    this.heldNotes = [];
    this.stop();
  }
  
  /**
   * Toggle latch
   */
  toggleLatch(): void {
    this.config.latch = !this.config.latch;
    if (!this.config.latch) {
      this.clear();
    }
  }
  
  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================
  
  private sortNotes(): void {
    if (this.config.mode !== 'order') {
      this.heldNotes.sort((a, b) => a.note - b.note);
    }
  }
  
  private getNextNote(): { note: number; velocity: number } {
    const noteCount = this.heldNotes.length;
    if (noteCount === 0) {
      return { note: 60, velocity: 100 };
    }
    
    let index = this.currentIndex;
    const octaveOffset = this.currentOctave * 12;
    
    switch (this.config.mode) {
      case 'up':
        index = this.currentIndex % noteCount;
        this.currentIndex++;
        if (this.currentIndex >= noteCount) {
          this.currentIndex = 0;
          this.currentOctave = (this.currentOctave + 1) % this.config.octaves;
        }
        break;
        
      case 'down':
        index = (noteCount - 1 - this.currentIndex % noteCount);
        this.currentIndex++;
        if (this.currentIndex >= noteCount) {
          this.currentIndex = 0;
          this.currentOctave = (this.currentOctave + 1) % this.config.octaves;
        }
        break;
        
      case 'up_down':
        index = this.currentIndex % noteCount;
        if (this.direction === -1) {
          index = noteCount - 1 - index;
        }
        this.currentIndex++;
        if (this.currentIndex >= noteCount) {
          this.currentIndex = 0;
          if (noteCount > 1) {
            this.direction *= -1;
          }
          if (this.direction === 1) {
            this.currentOctave = (this.currentOctave + 1) % this.config.octaves;
          }
        }
        break;
        
      case 'random':
        index = Math.floor(Math.random() * noteCount);
        this.currentOctave = Math.floor(Math.random() * this.config.octaves);
        break;
        
      case 'order':
        index = this.currentIndex % noteCount;
        this.currentIndex++;
        if (this.currentIndex >= noteCount) {
          this.currentIndex = 0;
          this.currentOctave = (this.currentOctave + 1) % this.config.octaves;
        }
        break;
        
      case 'chord':
        // Return all notes at once (handled differently)
        index = 0;
        break;
    }
    
    const note = this.heldNotes[index];
    if (!note) {
      return { note: 60 + octaveOffset, velocity: 100 };
    }
    return {
      note: note.note + octaveOffset,
      velocity: note.velocity,
    };
  }
  
  private calculateVelocity(baseVelocity: number): number {
    switch (this.config.velocity) {
      case 'fixed':
        return this.config.fixedVelocity;
        
      case 'accent':
        const accentIndex = this.stepCounter % this.config.accentPattern.length;
        const accentMultiplier = this.config.accentPattern[accentIndex] ?? 1;
        return Math.min(127, Math.round(baseVelocity * accentMultiplier));
        
      case 'random':
        return Math.floor(64 + Math.random() * 64);
        
      case 'as_played':
      default:
        return baseVelocity;
    }
  }
}

// ============================================================================
// CHORD GENERATOR
// ============================================================================

/** Chord type */
export type ChordType = 
  | 'major' | 'minor' | 'dim' | 'aug'
  | 'maj7' | 'min7' | 'dom7' | 'dim7' | 'aug7' | 'min_maj7'
  | 'maj9' | 'min9' | 'dom9'
  | 'sus2' | 'sus4'
  | 'add9' | 'add11'
  | 'power' | 'octave'
  | 'custom';

/** Chord configuration */
export interface ChordConfig {
  enabled: boolean;
  type: ChordType;
  customIntervals: number[];  // Semitones from root
  inversion: number;          // 0, 1, 2, etc.
  spread: number;             // Octave spread
  strumTime: number;          // ms between notes (0 = simultaneous)
  strumDirection: 'up' | 'down' | 'random';
  velocity: 'uniform' | 'decreasing' | 'increasing' | 'random';
}

/** Default chord config */
export const DEFAULT_CHORD_CONFIG: ChordConfig = {
  enabled: false,
  type: 'major',
  customIntervals: [0, 4, 7],
  inversion: 0,
  spread: 0,
  strumTime: 0,
  strumDirection: 'up',
  velocity: 'uniform',
};

/** Chord intervals */
const CHORD_INTERVALS: Record<ChordType, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  dim7: [0, 3, 6, 9],
  aug7: [0, 4, 8, 10],
  min_maj7: [0, 3, 7, 11],
  maj9: [0, 4, 7, 11, 14],
  min9: [0, 3, 7, 10, 14],
  dom9: [0, 4, 7, 10, 14],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  add9: [0, 4, 7, 14],
  add11: [0, 4, 7, 17],
  power: [0, 7],
  octave: [0, 12],
  custom: [],
};

/**
 * Chord generator
 */
export class ChordGenerator {
  private config: ChordConfig;
  
  constructor(config?: Partial<ChordConfig>) {
    this.config = { ...DEFAULT_CHORD_CONFIG, ...config };
  }
  
  /**
   * Set configuration
   */
  setConfig(config: Partial<ChordConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get configuration
   */
  getConfig(): ChordConfig {
    return { ...this.config };
  }
  
  /**
   * Generate chord notes
   */
  generateChord(rootNote: number, velocity: number): Array<{ note: number; velocity: number; delay: number }> {
    if (!this.config.enabled) {
      return [{ note: rootNote, velocity, delay: 0 }];
    }
    
    let intervals = this.config.type === 'custom'
      ? this.config.customIntervals
      : CHORD_INTERVALS[this.config.type];
    
    // Apply inversion
    intervals = this.applyInversion(intervals, this.config.inversion);
    
    // Apply spread
    intervals = this.applySpread(intervals, this.config.spread);
    
    // Generate notes
    const notes: Array<{ note: number; velocity: number; delay: number }> = [];
    
    for (let i = 0; i < intervals.length; i++) {
      const noteVelocity = this.calculateVelocity(velocity, i, intervals.length);
      const delay = this.calculateDelay(i, intervals.length);
      const interval = intervals[i] ?? 0;
      
      notes.push({
        note: rootNote + interval,
        velocity: noteVelocity,
        delay,
      });
    }
    
    return notes;
  }
  
  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================
  
  private applyInversion(intervals: number[], inversion: number): number[] {
    if (inversion === 0 || intervals.length <= 1) return [...intervals];
    
    const result = [...intervals];
    for (let i = 0; i < inversion; i++) {
      const lowest = result.shift()!;
      result.push(lowest + 12);
    }
    
    return result;
  }
  
  private applySpread(intervals: number[], spread: number): number[] {
    if (spread === 0) return intervals;
    
    return intervals.map((interval, i) => {
      const octaveShift = Math.floor(i / 2) * spread * 12;
      return interval + octaveShift;
    });
  }
  
  private calculateVelocity(baseVelocity: number, index: number, _total: number): number {
    switch (this.config.velocity) {
      case 'decreasing':
        return Math.round(baseVelocity * (1 - index * 0.1));
      case 'increasing':
        return Math.round(baseVelocity * (0.7 + index * 0.1));
      case 'random':
        return Math.round(baseVelocity * (0.7 + Math.random() * 0.3));
      case 'uniform':
      default:
        return baseVelocity;
    }
  }
  
  private calculateDelay(index: number, total: number): number {
    if (this.config.strumTime === 0) return 0;
    
    let position: number;
    switch (this.config.strumDirection) {
      case 'down':
        position = total - 1 - index;
        break;
      case 'random':
        position = Math.random() * total;
        break;
      case 'up':
      default:
        position = index;
    }
    
    return position * this.config.strumTime;
  }
}

// ============================================================================
// STEP SEQUENCER
// ============================================================================

/** Sequencer step */
export interface SequencerStep {
  enabled: boolean;
  note: number;       // Relative to root (0-11)
  octave: number;     // Octave offset (-2 to +2)
  velocity: number;   // 0-127
  gate: number;       // 0-1
  slide: boolean;
  accent: boolean;
  probability: number; // 0-1
}

/** Sequencer configuration */
export interface SequencerConfig {
  enabled: boolean;
  steps: SequencerStep[];
  length: number;     // Number of active steps
  rate: number;       // Note value
  swing: number;      // -1 to 1
  direction: 'forward' | 'backward' | 'pingpong' | 'random';
  rootNote: number;   // MIDI note
  scale: number[];    // Scale intervals
}

/** Default step */
const DEFAULT_STEP: SequencerStep = {
  enabled: true,
  note: 0,
  octave: 0,
  velocity: 100,
  gate: 0.5,
  slide: false,
  accent: false,
  probability: 1,
};

/** Default sequencer config */
export const DEFAULT_SEQUENCER_CONFIG: SequencerConfig = {
  enabled: false,
  steps: Array(16).fill(null).map(() => ({ ...DEFAULT_STEP })),
  length: 16,
  rate: 16,
  swing: 0,
  direction: 'forward',
  rootNote: 60,
  scale: [0, 2, 4, 5, 7, 9, 11], // Major scale
};

/**
 * Step sequencer
 */
export class StepSequencer {
  private config: SequencerConfig;
  private currentStep = 0;
  private direction: 1 | -1 = 1;
  private isPlaying = false;
  private lastStepTime = 0;
  
  // Tempo
  private tempo = 120;
  private sampleRate = 44100;
  
  // Active note
  private activeNote: number | null = null;
  private noteOffTime = 0;
  
  constructor(config?: Partial<SequencerConfig>) {
    this.config = { ...DEFAULT_SEQUENCER_CONFIG, ...config };
  }
  
  /**
   * Set tempo
   */
  setTempo(bpm: number): void {
    this.tempo = bpm;
  }
  
  /**
   * Set configuration
   */
  setConfig(config: Partial<SequencerConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get configuration
   */
  getConfig(): SequencerConfig {
    return {
      ...this.config,
      steps: this.config.steps.map(s => ({ ...s })),
    };
  }
  
  /**
   * Set step
   */
  setStep(index: number, step: Partial<SequencerStep>): void {
    const existingStep = this.config.steps[index];
    if (index >= 0 && index < this.config.steps.length && existingStep) {
      this.config.steps[index] = { ...existingStep, ...step };
    }
  }
  
  /**
   * Get step
   */
  getStep(index: number): SequencerStep | null {
    return this.config.steps[index] ?? null;
  }
  
  /**
   * Start sequencer
   */
  start(): void {
    this.isPlaying = true;
    this.currentStep = 0;
    this.direction = 1;
    this.lastStepTime = 0;
  }
  
  /**
   * Stop sequencer
   */
  stop(): void {
    this.isPlaying = false;
    this.activeNote = null;
  }
  
  /**
   * Process and generate MIDI events
   */
  process(_numSamples: number, currentTime: number): MIDIEvent[] {
    if (!this.config.enabled || !this.isPlaying) {
      return [];
    }
    
    const events: MIDIEvent[] = [];
    const samplesPerBeat = (this.sampleRate * 60) / this.tempo;
    const stepDuration = samplesPerBeat / (this.config.rate / 4);
    
    // Check for note off
    if (this.activeNote !== null && currentTime >= this.noteOffTime) {
      events.push({
        type: 'noteoff',
        channel: 0,
        data1: this.activeNote,
        data2: 0,
        timestamp: currentTime,
      });
      this.activeNote = null;
    }
    
    // Check if it's time for next step
    if (currentTime - this.lastStepTime >= stepDuration) {
      const step = this.config.steps[this.currentStep];
      
      // Check probability
      if (step && step.enabled && Math.random() < step.probability) {
        const note = this.calculateNote(step);
        const velocity = step.accent ? Math.min(127, step.velocity + 20) : step.velocity;
        
        // Note on
        events.push({
          type: 'noteon',
          channel: 0,
          data1: note,
          data2: velocity,
          timestamp: currentTime,
        });
        
        this.activeNote = note;
        this.noteOffTime = currentTime + stepDuration * step.gate;
      }
      
      // Advance step
      this.advanceStep();
      this.lastStepTime = currentTime;
    }
    
    return events;
  }
  
  /**
   * Get current step index
   */
  getCurrentStep(): number {
    return this.currentStep;
  }
  
  /**
   * Is playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }
  
  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================
  
  private calculateNote(step: SequencerStep): number {
    const scaleNote = this.config.scale[step.note % this.config.scale.length] ?? 0;
    const octaveFromScale = Math.floor(step.note / this.config.scale.length) * 12;
    const octaveOffset = step.octave * 12;
    
    return this.config.rootNote + scaleNote + octaveFromScale + octaveOffset;
  }
  
  private advanceStep(): void {
    switch (this.config.direction) {
      case 'forward':
        this.currentStep = (this.currentStep + 1) % this.config.length;
        break;
        
      case 'backward':
        this.currentStep = (this.currentStep - 1 + this.config.length) % this.config.length;
        break;
        
      case 'pingpong':
        this.currentStep += this.direction;
        if (this.currentStep >= this.config.length - 1) {
          this.direction = -1;
        } else if (this.currentStep <= 0) {
          this.direction = 1;
        }
        break;
        
      case 'random':
        this.currentStep = Math.floor(Math.random() * this.config.length);
        break;
    }
  }
}

// ============================================================================
// SAMPLER CARD
// ============================================================================

/**
 * Sampler instrument card
 */
export class SamplerCard implements Card {
  readonly id: string;
  readonly name: string;
  readonly category: CardCategory = 'sampler';
  state: CardState = 'idle';
  
  private instrument: Instrument | null = null;
  private arpeggiator: Arpeggiator;
  private chordGenerator: ChordGenerator;
  private sequencer: StepSequencer;
  
  // MIDI routing
  private midiRoutingMode: MIDIRoutingMode = 'through';
  private midiChannel = 0;
  private transpose = 0;
  private splitPoint = 60;
  
  // Audio routing
  private audioRoutingMode: AudioRoutingMode = 'stereo';
  private gain = 1;
  private pan = 0;
  
  // Processing buffers
  private tempBufferL: Float32Array;
  private tempBufferR: Float32Array;
  
  constructor(id: string, name: string, bufferSize = 512) {
    this.id = id;
    this.name = name;
    
    this.arpeggiator = new Arpeggiator();
    this.chordGenerator = new ChordGenerator();
    this.sequencer = new StepSequencer();
    
    this.tempBufferL = new Float32Array(bufferSize);
    this.tempBufferR = new Float32Array(bufferSize);
  }
  
  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  
  async initialize(): Promise<void> {
    this.state = 'active';
  }
  
  dispose(): void {
    this.instrument?.dispose();
    this.state = 'idle';
  }
  
  bypass(bypass: boolean): void {
    this.state = bypass ? 'bypassed' : 'active';
  }
  
  mute(mute: boolean): void {
    this.state = mute ? 'muted' : 'active';
  }
  
  solo(solo: boolean): void {
    this.state = solo ? 'soloed' : 'active';
  }
  
  getState(): CardState {
    return this.state;
  }
  
  // ===========================================================================
  // INSTRUMENT
  // ===========================================================================
  
  setInstrument(instrument: Instrument): void {
    this.instrument = instrument;
  }
  
  getInstrument(): Instrument | null {
    return this.instrument;
  }
  
  // ===========================================================================
  // MIDI ROUTING
  // ===========================================================================
  
  setMIDIRoutingMode(mode: MIDIRoutingMode): void {
    this.midiRoutingMode = mode;
  }
  
  setMIDIChannel(channel: number): void {
    this.midiChannel = Math.max(0, Math.min(15, channel));
  }
  
  setTranspose(semitones: number): void {
    this.transpose = Math.max(-48, Math.min(48, semitones));
  }
  
  setSplitPoint(note: number): void {
    this.splitPoint = Math.max(0, Math.min(127, note));
  }
  
  // ===========================================================================
  // AUDIO ROUTING
  // ===========================================================================
  
  setAudioRoutingMode(mode: AudioRoutingMode): void {
    this.audioRoutingMode = mode;
  }
  
  setGain(gain: number): void {
    this.gain = Math.max(0, Math.min(2, gain));
  }
  
  setPan(pan: number): void {
    this.pan = Math.max(-1, Math.min(1, pan));
  }
  
  // ===========================================================================
  // ARPEGGIATOR / CHORD / SEQUENCER
  // ===========================================================================
  
  getArpeggiator(): Arpeggiator {
    return this.arpeggiator;
  }
  
  getChordGenerator(): ChordGenerator {
    return this.chordGenerator;
  }
  
  getSequencer(): StepSequencer {
    return this.sequencer;
  }
  
  setTempo(bpm: number): void {
    this.arpeggiator.setTempo(bpm);
    this.sequencer.setTempo(bpm);
  }
  
  // ===========================================================================
  // PROCESSING
  // ===========================================================================
  
  processAudio(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void {
    if (this.state === 'bypassed') {
      outputL.set(inputL);
      outputR.set(inputR);
      return;
    }
    
    if (this.state === 'muted' || !this.instrument) {
      outputL.fill(0);
      outputR.fill(0);
      return;
    }
    
    // Process instrument
    this.tempBufferL.fill(0);
    this.tempBufferR.fill(0);
    this.instrument.processBlock(this.tempBufferL, this.tempBufferR, 0, outputL.length);
    
    // Apply gain and pan
    const leftGain = this.gain * (this.pan <= 0 ? 1 : 1 - this.pan);
    const rightGain = this.gain * (this.pan >= 0 ? 1 : 1 + this.pan);
    
    for (let i = 0; i < outputL.length; i++) {
      outputL[i] = (this.tempBufferL[i] ?? 0) * leftGain;
      outputR[i] = (this.tempBufferR[i] ?? 0) * rightGain;
    }
  }
  
  processMIDI(data: Uint8Array, timestamp: number): void {
    if (!this.instrument || this.state === 'bypassed' || this.state === 'muted') {
      return;
    }
    
    const byte0 = data[0];
    if (byte0 === undefined) return;
    
    const status = byte0 & 0xf0;
    const channel = byte0 & 0x0f;
    
    // Channel filter
    if (this.midiRoutingMode === 'channel_filter' && channel !== this.midiChannel) {
      return;
    }
    
    const data1 = data[1] ?? 0;
    const data2 = data[2] ?? 0;
    
    // Process note messages
    if (status === 0x90 && data2 > 0) {
      this.handleNoteOn(data1, data2, timestamp);
    } else if (status === 0x80 || (status === 0x90 && data2 === 0)) {
      this.handleNoteOff(data1, timestamp);
    } else {
      // Forward other messages
      this.instrument.processMIDI(data, timestamp);
    }
  }
  
  private handleNoteOn(note: number, velocity: number, _timestamp: number): void {
    // Apply transpose
    let transposedNote = note + this.transpose;
    
    // Check split
    if (this.midiRoutingMode === 'split' && note >= this.splitPoint) {
      return; // Filter out notes above split
    }
    
    // Chord generator
    const chordNotes = this.chordGenerator.generateChord(transposedNote, velocity);
    
    // Feed to arpeggiator or play directly
    if (this.arpeggiator.getConfig().enabled) {
      for (const { note: n, velocity: v } of chordNotes) {
        this.arpeggiator.noteOn(n, v);
      }
    } else {
      for (const { note: n, velocity: v, delay } of chordNotes) {
        if (delay > 0) {
          setTimeout(() => {
            this.instrument?.noteOn(n, v);
          }, delay);
        } else {
          this.instrument?.noteOn(n, v);
        }
      }
    }
  }
  
  private handleNoteOff(note: number, _timestamp: number): void {
    const transposedNote = note + this.transpose;
    
    if (this.arpeggiator.getConfig().enabled) {
      this.arpeggiator.noteOff(transposedNote);
    } else {
      this.instrument?.noteOff(transposedNote);
    }
  }
  
  // ===========================================================================
  // STATE
  // ===========================================================================
  
  saveState(): CardSnapshot {
    return {
      id: this.id,
      timestamp: Date.now(),
      data: {
        midiRoutingMode: this.midiRoutingMode,
        midiChannel: this.midiChannel,
        transpose: this.transpose,
        splitPoint: this.splitPoint,
        audioRoutingMode: this.audioRoutingMode,
        gain: this.gain,
        pan: this.pan,
        arpConfig: this.arpeggiator.getConfig(),
        chordConfig: this.chordGenerator.getConfig(),
        seqConfig: this.sequencer.getConfig(),
      },
    };
  }
  
  restoreState(snapshot: CardSnapshot): void {
    const data = snapshot.data as any;
    this.midiRoutingMode = data.midiRoutingMode;
    this.midiChannel = data.midiChannel;
    this.transpose = data.transpose;
    this.splitPoint = data.splitPoint;
    this.audioRoutingMode = data.audioRoutingMode;
    this.gain = data.gain;
    this.pan = data.pan;
    this.arpeggiator.setConfig(data.arpConfig);
    this.chordGenerator.setConfig(data.chordConfig);
    this.sequencer.setConfig(data.seqConfig);
  }
}

// ============================================================================
// WAVETABLE CARD
// ============================================================================

/**
 * Wavetable instrument card
 */
export class WavetableCard extends SamplerCard {
  readonly category: CardCategory = 'wavetable';
  
  // Modulation routing
  private modMatrix: ModulationRouting[] = [];
  private macros: MacroControl[] = [];
  
  constructor(id: string, name: string, bufferSize = 512) {
    super(id, name, bufferSize);
    
    // Initialize 8 macros
    for (let i = 0; i < 8; i++) {
      this.macros.push({
        id: i,
        name: `Macro ${i + 1}`,
        value: 0,
        defaultValue: 0,
        min: 0,
        max: 1,
        targets: [],
      });
    }
  }
  
  /**
   * Set modulation routing
   */
  setModulation(routing: ModulationRouting): void {
    const existing = this.modMatrix.findIndex(m => m.id === routing.id);
    if (existing >= 0) {
      this.modMatrix[existing] = routing;
    } else {
      this.modMatrix.push(routing);
    }
    
    const instrument = this.getInstrument();
    if (instrument) {
      instrument.setModulation(routing);
    }
  }
  
  /**
   * Remove modulation
   */
  removeModulation(id: string): void {
    this.modMatrix = this.modMatrix.filter(m => m.id !== id);
    
    const instrument = this.getInstrument();
    if (instrument) {
      instrument.removeModulation(id);
    }
  }
  
  /**
   * Get all modulations
   */
  getModulations(): ModulationRouting[] {
    return [...this.modMatrix];
  }
  
  /**
   * Set macro value
   */
  setMacro(index: number, value: number): void {
    const macro = this.macros[index];
    if (index >= 0 && index < this.macros.length && macro) {
      macro.value = Math.max(0, Math.min(1, value));
      
      const instrument = this.getInstrument();
      if (instrument) {
        instrument.setMacro(index, value);
      }
    }
  }
  
  /**
   * Get macro value
   */
  getMacro(index: number): number {
    return this.macros[index]?.value ?? 0;
  }
  
  /**
   * Configure macro
   */
  configureMacro(index: number, config: Partial<MacroControl>): void {
    const existingMacro = this.macros[index];
    if (index >= 0 && index < this.macros.length && existingMacro) {
      this.macros[index] = { ...existingMacro, ...config };
    }
  }
  
  /**
   * Get macro configuration
   */
  getMacroConfig(index: number): MacroControl | null {
    return this.macros[index] ?? null;
  }
  
  saveState(): CardSnapshot {
    const baseState = super.saveState();
    return {
      ...baseState,
      data: {
        ...(baseState.data as any),
        modMatrix: this.modMatrix,
        macros: this.macros.map(m => ({ ...m, targets: [...m.targets] })),
      },
    };
  }
  
  restoreState(snapshot: CardSnapshot): void {
    super.restoreState(snapshot);
    const data = snapshot.data as any;
    this.modMatrix = data.modMatrix ?? [];
    if (data.macros) {
      this.macros = data.macros;
    }
  }
}

// ============================================================================
// HYBRID CARD
// ============================================================================

/**
 * Hybrid instrument card (sampler + wavetable)
 */
export class HybridCard extends WavetableCard {
  readonly category: CardCategory = 'hybrid';
  
  private hybridInstrument: HybridInstrument | null = null;
  
  constructor(id: string, name: string, bufferSize = 512) {
    super(id, name, bufferSize);
  }
  
  /**
   * Set hybrid instrument
   */
  setHybridInstrument(instrument: HybridInstrument): void {
    this.hybridInstrument = instrument;
    this.setInstrument(instrument);
  }
  
  /**
   * Get hybrid instrument
   */
  getHybridInstrument(): HybridInstrument | null {
    return this.hybridInstrument;
  }
  
  /**
   * Set hybrid mode
   */
  setHybridMode(mode: HybridMode): void {
    if (this.hybridInstrument) {
      this.hybridInstrument.setHybridMode(mode);
    }
  }
  
  /**
   * Get hybrid mode
   */
  getHybridMode(): HybridMode | null {
    return this.hybridInstrument?.getHybridMode() ?? null;
  }
  
  /**
   * Update hybrid config
   */
  updateHybridConfig(updates: Partial<HybridConfig>): void {
    if (this.hybridInstrument) {
      this.hybridInstrument.updateHybridConfig(updates);
    }
  }
  
  /**
   * Get hybrid config
   */
  getHybridConfig(): HybridConfig | null {
    return this.hybridInstrument?.getHybridConfig() ?? null;
  }
  
  /**
   * Set sample data
   */
  setSampleData(data: Float32Array, loopStart?: number, loopEnd?: number): void {
    if (this.hybridInstrument) {
      this.hybridInstrument.setSampleData(data, loopStart, loopEnd);
    }
  }
  
  /**
   * Set wavetable data
   */
  setWavetableData(frames: Float32Array[]): void {
    if (this.hybridInstrument) {
      this.hybridInstrument.setWavetableData(frames);
    }
  }
}

// ============================================================================
// DECK
// ============================================================================

/**
 * Card deck for organizing and routing cards
 */
export class Deck {
  readonly id: string;
  readonly name: string;
  
  private slots: DeckSlot[] = [];
  private maxSlots = 8;
  
  // Audio
  private masterGain = 1;
  private masterPan = 0;
  
  // MIDI
  private midiInputEnabled = true;
  
  // Tempo
  private tempo = 120;
  
  // Processing
  private tempBufferL: Float32Array;
  private tempBufferR: Float32Array;
  
  constructor(id: string, name: string, maxSlots = 8, bufferSize = 512) {
    this.id = id;
    this.name = name;
    this.maxSlots = maxSlots;
    
    this.tempBufferL = new Float32Array(bufferSize);
    this.tempBufferR = new Float32Array(bufferSize);
    
    // Initialize slots
    for (let i = 0; i < maxSlots; i++) {
      this.slots.push({
        index: i,
        card: null,
        enabled: true,
        midiChannel: i,
        audioInputFrom: null,
        audioOutputTo: null,
      });
    }
  }
  
  /**
   * Add card to slot
   */
  addCard(card: Card, slotIndex: number): boolean {
    const slot = this.slots[slotIndex];
    if (slotIndex < 0 || slotIndex >= this.maxSlots || !slot) return false;
    
    slot.card = card;
    return true;
  }
  
  /**
   * Remove card from slot
   */
  removeCard(slotIndex: number): Card | null {
    const slot = this.slots[slotIndex];
    if (slotIndex < 0 || slotIndex >= this.maxSlots || !slot) return null;
    
    const card = slot.card;
    slot.card = null;
    return card;
  }
  
  /**
   * Get card at slot
   */
  getCard(slotIndex: number): Card | null {
    return this.slots[slotIndex]?.card ?? null;
  }
  
  /**
   * Get all cards
   */
  getAllCards(): Card[] {
    return this.slots
      .filter(slot => slot.card !== null)
      .map(slot => slot.card!);
  }
  
  /**
   * Move card between slots
   */
  moveCard(fromSlot: number, toSlot: number): boolean {
    const fromSlotObj = this.slots[fromSlot];
    const toSlotObj = this.slots[toSlot];
    if (fromSlot < 0 || fromSlot >= this.maxSlots || !fromSlotObj) return false;
    if (toSlot < 0 || toSlot >= this.maxSlots || !toSlotObj) return false;
    
    const card = fromSlotObj.card;
    fromSlotObj.card = toSlotObj.card;
    toSlotObj.card = card;
    return true;
  }
  
  /**
   * Configure slot
   */
  configureSlot(slotIndex: number, config: Partial<DeckSlot>): void {
    const existingSlot = this.slots[slotIndex];
    if (slotIndex >= 0 && slotIndex < this.maxSlots && existingSlot) {
      this.slots[slotIndex] = { ...existingSlot, ...config };
    }
  }
  
  /**
   * Get slot configuration
   */
  getSlot(slotIndex: number): DeckSlot | null {
    return this.slots[slotIndex] ?? null;
  }
  
  /**
   * Set master gain
   */
  setMasterGain(gain: number): void {
    this.masterGain = Math.max(0, Math.min(2, gain));
  }
  
  /**
   * Set master pan
   */
  setMasterPan(pan: number): void {
    this.masterPan = Math.max(-1, Math.min(1, pan));
  }
  
  /**
   * Set tempo
   */
  setTempo(bpm: number): void {
    this.tempo = Math.max(20, Math.min(300, bpm));
    
    // Update all cards
    for (const slot of this.slots) {
      if (slot.card instanceof SamplerCard) {
        slot.card.setTempo(bpm);
      }
    }
  }
  
  /**
   * Get tempo
   */
  getTempo(): number {
    return this.tempo;
  }
  
  /**
   * Process audio
   */
  processAudio(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void {
    const length = outputL.length;
    
    // Clear output
    outputL.fill(0);
    outputR.fill(0);
    
    // Process each slot
    for (const slot of this.slots) {
      if (!slot.enabled || !slot.card) continue;
      
      this.tempBufferL.fill(0);
      this.tempBufferR.fill(0);
      
      // Get input (from another slot or deck input)
      let slotInputL: Float32Array;
      let slotInputR: Float32Array;
      
      if (slot.audioInputFrom !== null && this.slots[slot.audioInputFrom]?.card) {
        // Would need previous slot's output - simplified here
        slotInputL = inputL;
        slotInputR = inputR;
      } else {
        slotInputL = inputL;
        slotInputR = inputR;
      }
      
      // Process card
      slot.card.processAudio(
        slotInputL,
        slotInputR,
        this.tempBufferL,
        this.tempBufferR
      );
      
      // Mix to output
      for (let i = 0; i < length; i++) {
        outputL[i] = (outputL[i] ?? 0) + (this.tempBufferL[i] ?? 0);
        outputR[i] = (outputR[i] ?? 0) + (this.tempBufferR[i] ?? 0);
      }
    }
    
    // Apply master gain and pan
    const leftGain = this.masterGain * (this.masterPan <= 0 ? 1 : 1 - this.masterPan);
    const rightGain = this.masterGain * (this.masterPan >= 0 ? 1 : 1 + this.masterPan);
    
    for (let i = 0; i < length; i++) {
      outputL[i] = (outputL[i] ?? 0) * leftGain;
      outputR[i] = (outputR[i] ?? 0) * rightGain;
    }
  }
  
  /**
   * Process MIDI
   */
  processMIDI(data: Uint8Array, timestamp: number): void {
    if (!this.midiInputEnabled) return;
    
    const byte0 = data[0];
    if (byte0 === undefined) return;
    const channel = byte0 & 0x0f;
    
    // Route to matching slot
    for (const slot of this.slots) {
      if (!slot.enabled || !slot.card) continue;
      
      if (slot.midiChannel === channel || slot.midiChannel === -1) {
        slot.card.processMIDI(data, timestamp);
      }
    }
  }
  
  /**
   * Solo a card
   */
  soloCard(slotIndex: number): void {
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (!slot) continue;
      const card = slot.card;
      if (card) {
        if (i === slotIndex) {
          card.solo(true);
        } else {
          card.mute(true);
        }
      }
    }
  }
  
  /**
   * Clear solo
   */
  clearSolo(): void {
    for (const slot of this.slots) {
      if (slot.card) {
        slot.card.solo(false);
        slot.card.mute(false);
      }
    }
  }
  
  /**
   * Save deck state
   */
  saveState(): {
    id: string;
    name: string;
    slots: Array<{ index: number; cardSnapshot: CardSnapshot | null; config: Omit<DeckSlot, 'card'> }>;
    masterGain: number;
    masterPan: number;
    tempo: number;
  } {
    return {
      id: this.id,
      name: this.name,
      slots: this.slots.map(slot => ({
        index: slot.index,
        cardSnapshot: slot.card?.saveState() ?? null,
        config: {
          index: slot.index,
          enabled: slot.enabled,
          midiChannel: slot.midiChannel,
          audioInputFrom: slot.audioInputFrom,
          audioOutputTo: slot.audioOutputTo,
        },
      })),
      masterGain: this.masterGain,
      masterPan: this.masterPan,
      tempo: this.tempo,
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createSamplerCard(id: string, name: string): SamplerCard {
  return new SamplerCard(id, name);
}

export function createWavetableCard(id: string, name: string): WavetableCard {
  return new WavetableCard(id, name);
}

export function createHybridCard(id: string, name: string): HybridCard {
  return new HybridCard(id, name);
}

export function createDeck(id: string, name: string, maxSlots = 8): Deck {
  return new Deck(id, name, maxSlots);
}
