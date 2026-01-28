/**
 * @fileoverview Original Card Delegation Adapters.
 * 
 * Provides adapters that allow the original card implementations
 * (arranger.ts, drum-machine.ts, arpeggiator.ts, bassline.ts)
 * to delegate to the integrated card system using SharedEventStore.
 * 
 * These adapters ensure backward compatibility while routing
 * through the unified state management system.
 * 
 * @module @cardplay/cards/legacy-card-adapters
 */

import { createEvent, type Event } from '../types/event';
import { asTick, asTickDuration } from '../types/primitives';
import { asEventId } from '../types/event-id';
import { EventKinds } from '../types/event-kind';
import type { EventStreamId, ClipId, SubscriptionId } from '../state/types';
import { getSharedEventStore, getClipRegistry } from '../state';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Legacy card event format (pre-integration).
 */
export interface LegacyCardEvent {
  readonly id?: string;
  readonly type: string;
  readonly time: number;           // Time in some unit (beats, ticks, etc.)
  readonly duration?: number;
  readonly pitch?: number;
  readonly velocity?: number;
  readonly data?: Record<string, unknown>;
}

/**
 * Legacy pattern format (for arranger, drum machine).
 */
export interface LegacyPattern {
  readonly id: string;
  readonly name: string;
  readonly length: number;         // Pattern length
  readonly events: readonly LegacyCardEvent[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Adapter configuration.
 */
export interface LegacyAdapterConfig {
  readonly ppq: number;            // Pulses per quarter note
  readonly defaultVelocity: number;
  readonly defaultDuration: number;
}

/**
 * Common adapter interface.
 */
export interface LegacyCardAdapter<TPattern = LegacyPattern> {
  // Pattern operations
  createPattern(name: string, length?: number): ClipId;
  loadPattern(patternId: string): TPattern | null;
  savePattern(pattern: TPattern): void;
  deletePattern(patternId: string): void;
  
  // Event operations
  addEvent(patternId: string, event: LegacyCardEvent): void;
  removeEvent(patternId: string, eventId: string): void;
  updateEvent(patternId: string, eventId: string, updates: Partial<LegacyCardEvent>): void;
  getEvents(patternId: string): readonly LegacyCardEvent[];
  
  // State
  getState(): unknown;
  subscribe(callback: () => void): () => void;
  
  // Cleanup
  dispose(): void;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: LegacyAdapterConfig = {
  ppq: 480,
  defaultVelocity: 100,
  defaultDuration: 120,  // Eighth note at 480 PPQ
};

// ============================================================================
// BASE ADAPTER
// ============================================================================

/**
 * Base adapter class for legacy card implementations.
 */
abstract class BaseLegacyAdapter<TPattern extends LegacyPattern = LegacyPattern> implements LegacyCardAdapter<TPattern> {
  protected config: LegacyAdapterConfig;
  protected patternToClip: Map<string, ClipId> = new Map();
  protected clipToPattern: Map<ClipId, string> = new Map();
  protected storeSubscriptions: Map<EventStreamId, SubscriptionId> = new Map();
  protected subscribers: Set<() => void> = new Set();
  
  constructor(config: Partial<LegacyAdapterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  // ========== PATTERN OPERATIONS ==========
  
  createPattern(name: string, length?: number): ClipId {
    const store = getSharedEventStore();
    const registry = getClipRegistry();

    // Create event stream
    const stream = store.createStream({ name: `${name}-events`, events: [] });

    // Create clip
    const clip = registry.createClip({
      streamId: stream.id,
      name,
      ...(this.getDefaultColor() && { color: this.getDefaultColor() }),
      startTick: asTick(0),
      duration: asTick(length ?? this.getDefaultPatternLength()),
      loopEnabled: true,
    });

    // Generate legacy pattern ID
    const patternId = `pattern-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Map IDs
    this.patternToClip.set(patternId, clip.id);
    this.clipToPattern.set(clip.id, patternId);

    // Subscribe to changes
    this.subscribeToStream(stream.id);

    this.notifySubscribers();
    return clip.id;
  }
  
  loadPattern(patternId: string): TPattern | null {
    const clipId = this.patternToClip.get(patternId);
    if (!clipId) return null;
    
    const clip = getClipRegistry().getClip(clipId);
    if (!clip) return null;
    
    const stream = getSharedEventStore().getStream(clip.streamId);
    if (!stream) return null;
    
    return this.convertToLegacyPattern(patternId, clip, stream.events);
  }
  
  savePattern(pattern: TPattern): void {
    const clipId = this.patternToClip.get(pattern.id);
    if (!clipId) {
      // Create new pattern
      const newClipId = this.createPattern(pattern.name, pattern.length);
      this.patternToClip.set(pattern.id, newClipId);
      this.clipToPattern.set(newClipId, pattern.id);
    }
    
    // Update events
    const actualClipId = this.patternToClip.get(pattern.id)!;
    const clip = getClipRegistry().getClip(actualClipId);
    if (!clip) return;
    
    const store = getSharedEventStore();
    const events = pattern.events.map(legacyEvent => this.convertFromLegacyEvent(legacyEvent));
    store.setStream(clip.streamId, events);
    
    this.notifySubscribers();
  }
  
  deletePattern(patternId: string): void {
    const clipId = this.patternToClip.get(patternId);
    if (!clipId) return;
    
    const clip = getClipRegistry().getClip(clipId);
    if (clip) {
      // Unsubscribe from stream
      const subId = this.storeSubscriptions.get(clip.streamId);
      if (subId) {
        getSharedEventStore().unsubscribe(subId);
        this.storeSubscriptions.delete(clip.streamId);
      }
      
      // Delete clip (which may delete stream)
      getClipRegistry().deleteClip(clipId);
    }
    
    this.patternToClip.delete(patternId);
    this.clipToPattern.delete(clipId);
    
    this.notifySubscribers();
  }
  
  // ========== EVENT OPERATIONS ==========
  
  addEvent(patternId: string, event: LegacyCardEvent): void {
    const clipId = this.patternToClip.get(patternId);
    if (!clipId) return;

    const clip = getClipRegistry().getClip(clipId);
    if (!clip) return;

    const store = getSharedEventStore();
    const convertedEvent = this.convertFromLegacyEvent(event);
    store.addEvent(clip.streamId, convertedEvent);

    this.notifySubscribers();
  }

  removeEvent(patternId: string, eventId: string): void {
    const clipId = this.patternToClip.get(patternId);
    if (!clipId) return;

    const clip = getClipRegistry().getClip(clipId);
    if (!clip) return;

    const store = getSharedEventStore();
    const internalId = asEventId(eventId);
    store.deleteEvent(clip.streamId, internalId);

    this.notifySubscribers();
  }
  
  updateEvent(patternId: string, eventId: string, updates: Partial<LegacyCardEvent>): void {
    const clipId = this.patternToClip.get(patternId);
    if (!clipId) return;
    
    const clip = getClipRegistry().getClip(clipId);
    if (!clip) return;
    
    const store = getSharedEventStore();
    const stream = store.getStream(clip.streamId);
    if (!stream) return;
    
    const id = asEventId(eventId);
    const existingEvent = stream.events.find(e => e.id === id);
    if (!existingEvent) return;
    
    const updatePayload: any = {};
    
    if (updates.time !== undefined) {
      // Time is handled via startTick
    }
    if (updates.duration !== undefined) {
      // Duration handled via event duration
    }
    if (updates.pitch !== undefined) {
      updatePayload.pitch = updates.pitch;
    }
    if (updates.velocity !== undefined) {
      updatePayload.velocity = updates.velocity;
    }
    if (updates.data) {
      Object.assign(updatePayload, updates.data);
    }
    
    if (updates.time !== undefined) {
      store.updateEvent(clip.streamId, id, {
        start: asTick(Math.round(updates.time * this.config.ppq)),
      });
    }
    if (updates.duration !== undefined) {
      store.updateEvent(clip.streamId, id, {
        duration: asTickDuration(Math.round(updates.duration * this.config.ppq)),
      });
    }
    if (Object.keys(updatePayload).length > 0) {
      const currentPayload =
        typeof existingEvent.payload === 'object' && existingEvent.payload !== null
          ? (existingEvent.payload as Record<string, unknown>)
          : {};
      store.updateEvent(clip.streamId, id, {
        payload: { ...currentPayload, ...updatePayload },
      });
    }
    
    this.notifySubscribers();
  }
  
  getEvents(patternId: string): readonly LegacyCardEvent[] {
    const clipId = this.patternToClip.get(patternId);
    if (!clipId) return [];
    
    const clip = getClipRegistry().getClip(clipId);
    if (!clip) return [];
    
    const stream = getSharedEventStore().getStream(clip.streamId);
    if (!stream) return [];
    
    return stream.events.map(e => this.convertToLegacyEvent(e));
  }
  
  // ========== STATE ==========
  
  abstract getState(): unknown;
  
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  dispose(): void {
    // Unsubscribe from all streams
    const store = getSharedEventStore();
    for (const [_, subId] of this.storeSubscriptions) {
      store.unsubscribe(subId);
    }
    this.storeSubscriptions.clear();
    this.subscribers.clear();
  }
  
  // ========== PROTECTED ==========
  
  protected subscribeToStream(streamId: EventStreamId): void {
    if (this.storeSubscriptions.has(streamId)) return;
    
    const subId = getSharedEventStore().subscribe(streamId, () => {
      this.notifySubscribers();
    });
    this.storeSubscriptions.set(streamId, subId);
  }
  
  protected notifySubscribers(): void {
    for (const callback of this.subscribers) {
      callback();
    }
  }
  
  // ========== ABSTRACT ==========
  
  protected abstract getDefaultColor(): string;
  protected abstract getDefaultPatternLength(): number;
  protected abstract convertToLegacyPattern(
    patternId: string,
    clip: import('../state/types').ClipRecord,
    events: readonly Event<any>[]
  ): TPattern;
  protected abstract convertFromLegacyEvent(event: LegacyCardEvent): Event<any>;
  protected abstract convertToLegacyEvent(event: Event<any>): LegacyCardEvent;
}

// ============================================================================
// DRUM MACHINE ADAPTER
// ============================================================================

/**
 * Drum machine pattern with track/step grid.
 */
export interface DrumMachinePattern extends LegacyPattern {
  readonly tracks: readonly DrumTrack[];
  readonly steps: number;
  readonly swing: number;
}

export interface DrumTrack {
  readonly id: string;
  readonly name: string;
  readonly pitch: number;           // MIDI note for this drum
  readonly muted: boolean;
  readonly volume: number;
}

/**
 * Drum machine adapter.
 */
export class DrumMachineAdapter extends BaseLegacyAdapter<DrumMachinePattern> {
  private tracks: DrumTrack[] = [];
  private steps = 16;
  private swing = 0;
  
  constructor(config: Partial<LegacyAdapterConfig> = {}) {
    super(config);
    this.initializeDefaultTracks();
  }
  
  private initializeDefaultTracks(): void {
    const drumMap = [
      { name: 'Kick', pitch: 36 },
      { name: 'Snare', pitch: 38 },
      { name: 'Closed HH', pitch: 42 },
      { name: 'Open HH', pitch: 46 },
      { name: 'Tom Low', pitch: 45 },
      { name: 'Tom Mid', pitch: 47 },
      { name: 'Tom High', pitch: 50 },
      { name: 'Crash', pitch: 49 },
    ];
    
    this.tracks = drumMap.map((drum, i) => ({
      id: `drum-${i}`,
      name: drum.name,
      pitch: drum.pitch,
      muted: false,
      volume: 1,
    }));
  }
  
  setSteps(steps: number): void {
    this.steps = steps;
    this.notifySubscribers();
  }
  
  setSwing(swing: number): void {
    this.swing = Math.max(0, Math.min(1, swing));
    this.notifySubscribers();
  }
  
  setTrackMute(trackId: string, muted: boolean): void {
    const index = this.tracks.findIndex(t => t.id === trackId);
    if (index >= 0) {
      const track = this.tracks[index];
      if (!track) return;
      this.tracks[index] = { ...track, muted };
      this.notifySubscribers();
    }
  }
  
  /**
   * Toggle a step in the grid.
   */
  toggleStep(patternId: string, trackIndex: number, stepIndex: number): void {
    const track = this.tracks[trackIndex];
    if (!track) return;
    
    const events = this.getEvents(patternId);
    const stepTick = this.stepToTick(stepIndex);
    
    // Find existing event at this step/track
    const existingEvent = events.find(e => 
      e.pitch === track.pitch &&
      Math.abs((e.time * this.config.ppq) - stepTick) < 10
    );
    
    if (existingEvent && existingEvent.id) {
      this.removeEvent(patternId, existingEvent.id);
    } else {
      this.addEvent(patternId, {
        type: 'drum-hit',
        time: stepTick / this.config.ppq,
        duration: 0.25,
        pitch: track.pitch,
        velocity: this.config.defaultVelocity,
      });
    }
  }
  
  private stepToTick(step: number): number {
    const ticksPerStep = this.config.ppq / 4;  // 16th notes
    let tick = step * ticksPerStep;
    
    // Apply swing to off-beat steps
    if (step % 2 === 1) {
      tick += ticksPerStep * this.swing * 0.5;
    }
    
    return tick;
  }
  
  getState(): { tracks: readonly DrumTrack[]; steps: number; swing: number } {
    return {
      tracks: this.tracks,
      steps: this.steps,
      swing: this.swing,
    };
  }
  
  protected getDefaultColor(): string {
    return '#e74c3c';  // Red for drums
  }
  
  protected getDefaultPatternLength(): number {
    return this.config.ppq * 4;  // 4 beats (1 bar)
  }
  
  protected convertToLegacyPattern(
    patternId: string,
    clip: import('../state/types').ClipRecord,
    events: readonly Event<any>[]
  ): DrumMachinePattern {
    return {
      id: patternId,
      name: clip.name,
      length: clip.length as number,
      events: events.map(e => this.convertToLegacyEvent(e)),
      tracks: this.tracks,
      steps: this.steps,
      swing: this.swing,
    };
  }
  
  protected convertFromLegacyEvent(event: LegacyCardEvent): Event<any> {
    return createEvent({
      id: asEventId(event.id ?? `drum-${Date.now()}-${Math.random().toString(36).slice(2)}`),
      kind: EventKinds.NOTE,
      start: asTick(Math.round((event.time ?? 0) * this.config.ppq)),
      duration: asTickDuration(Math.round((event.duration ?? 0.25) * this.config.ppq)),
      payload: {
        type: 'drum-hit',
        pitch: event.pitch ?? 36,
        velocity: event.velocity ?? this.config.defaultVelocity,
        ...event.data,
      },
    });
  }
  
  protected convertToLegacyEvent(event: Event<any>): LegacyCardEvent {
    const payload = event.payload as any;
    return {
      id: event.id,
      type: payload?.type ?? 'drum-hit',
      time: (event.start as number) / this.config.ppq,
      duration: (event.duration as number) / this.config.ppq,
      pitch: payload?.pitch,
      velocity: payload?.velocity,
      data: payload,
    };
  }
}

// ============================================================================
// ARPEGGIATOR ADAPTER
// ============================================================================

/**
 * Arpeggiator pattern with note sequence.
 */
export interface ArpeggiatorPattern extends LegacyPattern {
  readonly mode: 'up' | 'down' | 'updown' | 'random' | 'order';
  readonly octaves: number;
  readonly rate: number;           // Note divisions (1, 2, 4, 8, 16, etc.)
  readonly gate: number;           // Gate length (0-1)
  readonly inputNotes: readonly number[];  // Input chord
}

/**
 * Arpeggiator adapter.
 */
export class ArpeggiatorAdapter extends BaseLegacyAdapter<ArpeggiatorPattern> {
  private mode: ArpeggiatorPattern['mode'] = 'up';
  private octaves = 1;
  private rate = 8;
  private gate = 0.8;
  private inputNotes: number[] = [];
  
  setMode(mode: ArpeggiatorPattern['mode']): void {
    this.mode = mode;
    this.regeneratePattern();
  }
  
  setOctaves(octaves: number): void {
    this.octaves = Math.max(1, Math.min(4, octaves));
    this.regeneratePattern();
  }
  
  setRate(rate: number): void {
    this.rate = rate;
    this.regeneratePattern();
  }
  
  setGate(gate: number): void {
    this.gate = Math.max(0.1, Math.min(1, gate));
    this.regeneratePattern();
  }
  
  setInputNotes(notes: number[]): void {
    this.inputNotes = [...notes].sort((a, b) => a - b);
    this.regeneratePattern();
  }
  
  private regeneratePattern(): void {
    // Would regenerate the arpeggio pattern based on settings
    // This would update the active pattern in the store
    this.notifySubscribers();
  }
  
  /**
   * Generate arpeggio notes based on current settings.
   */
  generateArpeggio(): number[] {
    if (this.inputNotes.length === 0) return [];
    
    let notes: number[] = [];
    
    // Expand across octaves
    for (let oct = 0; oct < this.octaves; oct++) {
      for (const note of this.inputNotes) {
        notes.push(note + oct * 12);
      }
    }
    
    // Apply mode
    switch (this.mode) {
      case 'up':
        // Already sorted
        break;
      case 'down':
        notes.reverse();
        break;
      case 'updown':
        const downNotes = [...notes].reverse().slice(1, -1);
        notes = [...notes, ...downNotes];
        break;
      case 'random':
        notes = this.shuffle(notes);
        break;
      case 'order':
        // Keep input order, expanded by octaves
        notes = [];
        for (let oct = 0; oct < this.octaves; oct++) {
          for (const note of this.inputNotes) {
            notes.push(note + oct * 12);
          }
        }
        break;
    }
    
    return notes;
  }
  
  private shuffle(array: number[]): number[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const a = result[i];
      const b = result[j];
      if (a === undefined || b === undefined) continue;
      result[i] = b;
      result[j] = a;
    }
    return result;
  }
  
  getState(): {
    mode: ArpeggiatorPattern['mode'];
    octaves: number;
    rate: number;
    gate: number;
    inputNotes: readonly number[];
  } {
    return {
      mode: this.mode,
      octaves: this.octaves,
      rate: this.rate,
      gate: this.gate,
      inputNotes: this.inputNotes,
    };
  }
  
  protected getDefaultColor(): string {
    return '#9b59b6';  // Purple for arpeggiator
  }
  
  protected getDefaultPatternLength(): number {
    return this.config.ppq * 4;  // 4 beats
  }
  
  protected convertToLegacyPattern(
    patternId: string,
    clip: import('../state/types').ClipRecord,
    events: readonly Event<any>[]
  ): ArpeggiatorPattern {
    return {
      id: patternId,
      name: clip.name,
      length: clip.length as number,
      events: events.map(e => this.convertToLegacyEvent(e)),
      mode: this.mode,
      octaves: this.octaves,
      rate: this.rate,
      gate: this.gate,
      inputNotes: this.inputNotes,
    };
  }
  
  protected convertFromLegacyEvent(event: LegacyCardEvent): Event<any> {
    return createEvent({
      id: asEventId(event.id ?? `arp-${Date.now()}-${Math.random().toString(36).slice(2)}`),
      kind: EventKinds.NOTE,
      start: asTick(Math.round((event.time ?? 0) * this.config.ppq)),
      duration: asTickDuration(Math.round((event.duration ?? 0.25) * this.config.ppq)),
      payload: {
        type: 'arp-note',
        pitch: event.pitch ?? 60,
        velocity: event.velocity ?? this.config.defaultVelocity,
        ...event.data,
      },
    });
  }

  protected convertToLegacyEvent(event: Event<any>): LegacyCardEvent {
    const payload = event.payload as any;
    return {
      id: event.id,
      type: payload?.type ?? 'arp-note',
      time: (event.start as number) / this.config.ppq,
      duration: (event.duration as number) / this.config.ppq,
      pitch: payload?.pitch,
      velocity: payload?.velocity,
      data: payload,
    };
  }
}

// ============================================================================
// BASSLINE ADAPTER
// ============================================================================

/**
 * Bassline pattern.
 */
export interface BasslinePattern extends LegacyPattern {
  readonly rootNote: number;
  readonly scale: string;
  readonly octave: number;
}

/**
 * Bassline adapter.
 */
export class BasslineAdapter extends BaseLegacyAdapter<BasslinePattern> {
  private rootNote = 36;  // C2
  private scale = 'minor';
  private octave = 2;

  setRootNote(note: number): void {
    this.rootNote = note;
    this.notifySubscribers();
  }

  setScale(scale: string): void {
    this.scale = scale;
    this.notifySubscribers();
  }

  setOctave(octave: number): void {
    this.octave = Math.max(1, Math.min(4, octave));
    this.rootNote = 12 + (this.octave * 12);  // C at that octave
    this.notifySubscribers();
  }

  getState(): { rootNote: number; scale: string; octave: number } {
    return {
      rootNote: this.rootNote,
      scale: this.scale,
      octave: this.octave,
    };
  }

  protected getDefaultColor(): string {
    return '#3498db';  // Blue for bass
  }

  protected getDefaultPatternLength(): number {
    return this.config.ppq * 4;  // 4 beats
  }

  protected convertToLegacyPattern(
    patternId: string,
    clip: import('../state/types').ClipRecord,
    events: readonly Event<any>[]
  ): BasslinePattern {
    return {
      id: patternId,
      name: clip.name,
      length: clip.length as number,
      events: events.map(e => this.convertToLegacyEvent(e)),
      rootNote: this.rootNote,
      scale: this.scale,
      octave: this.octave,
    };
  }

  protected convertFromLegacyEvent(event: LegacyCardEvent): Event<any> {
    return createEvent({
      id: asEventId(event.id ?? `bass-${Date.now()}-${Math.random().toString(36).slice(2)}`),
      kind: EventKinds.NOTE,
      start: asTick(Math.round((event.time ?? 0) * this.config.ppq)),
      duration: asTickDuration(Math.round((event.duration ?? 0.5) * this.config.ppq)),
      payload: {
        type: 'bass-note',
        pitch: event.pitch ?? this.rootNote,
        velocity: event.velocity ?? this.config.defaultVelocity,
        ...event.data,
      },
    });
  }
  
  protected convertToLegacyEvent(event: Event<any>): LegacyCardEvent {
    const payload = event.payload as any;
    return {
      id: event.id,
      type: payload?.type ?? 'bass-note',
      time: (event.start as number) / this.config.ppq,
      duration: (event.duration as number) / this.config.ppq,
      pitch: payload?.pitch,
      velocity: payload?.velocity,
      data: payload,
    };
  }
}

// ============================================================================
// ARRANGER ADAPTER
// ============================================================================

/**
 * Arranger section.
 */
export interface ArrangerSection {
  readonly id: string;
  readonly name: string;
  readonly startTime: number;
  readonly duration: number;
  readonly clipIds: readonly ClipId[];
}

/**
 * Arranger pattern (arrangement).
 */
export interface ArrangementPattern extends LegacyPattern {
  readonly sections: readonly ArrangerSection[];
  readonly tempo: number;
  readonly timeSignature: { numerator: number; denominator: number };
}

/**
 * Arranger adapter.
 */
export class ArrangerAdapter extends BaseLegacyAdapter<ArrangementPattern> {
  private sections: ArrangerSection[] = [];
  private tempo = 120;
  private timeSignature = { numerator: 4, denominator: 4 };
  
  addSection(name: string, startTime: number, duration: number): string {
    const sectionId = `section-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.sections.push({
      id: sectionId,
      name,
      startTime,
      duration,
      clipIds: [],
    });
    this.notifySubscribers();
    return sectionId;
  }
  
  removeSection(sectionId: string): void {
    this.sections = this.sections.filter(s => s.id !== sectionId);
    this.notifySubscribers();
  }
  
  addClipToSection(sectionId: string, clipId: ClipId): void {
    const index = this.sections.findIndex(s => s.id === sectionId);
    if (index >= 0) {
      const section = this.sections[index];
      if (!section) return;
      this.sections[index] = {
        id: section.id,
        name: section.name,
        startTime: section.startTime,
        duration: section.duration,
        clipIds: [...section.clipIds, clipId],
      };
      this.notifySubscribers();
    }
  }
  
  setTempo(tempo: number): void {
    this.tempo = Math.max(20, Math.min(300, tempo));
    this.notifySubscribers();
  }
  
  setTimeSignature(numerator: number, denominator: number): void {
    this.timeSignature = { numerator, denominator };
    this.notifySubscribers();
  }
  
  getState(): {
    sections: readonly ArrangerSection[];
    tempo: number;
    timeSignature: { numerator: number; denominator: number };
  } {
    return {
      sections: this.sections,
      tempo: this.tempo,
      timeSignature: this.timeSignature,
    };
  }
  
  protected getDefaultColor(): string {
    return '#2ecc71';  // Green for arrangement
  }
  
  protected getDefaultPatternLength(): number {
    return this.config.ppq * 16;  // 16 beats (4 bars)
  }
  
  protected convertToLegacyPattern(
    patternId: string,
    clip: import('../state/types').ClipRecord,
    events: readonly Event<any>[]
  ): ArrangementPattern {
    return {
      id: patternId,
      name: clip.name,
      length: clip.length as number,
      events: events.map(e => this.convertToLegacyEvent(e)),
      sections: this.sections,
      tempo: this.tempo,
      timeSignature: this.timeSignature,
    };
  }
  
  protected convertFromLegacyEvent(event: LegacyCardEvent): Event<any> {
    return createEvent({
      id: asEventId(event.id ?? `arr-${Date.now()}-${Math.random().toString(36).slice(2)}`),
      kind: EventKinds.MARKER,
      start: asTick(Math.round((event.time ?? 0) * this.config.ppq)),
      duration: asTickDuration(Math.round((event.duration ?? 1) * this.config.ppq)),
      payload: {
        type: 'arrangement-event',
        ...event.data,
      },
    });
  }
  
  protected convertToLegacyEvent(event: Event<any>): LegacyCardEvent {
    const payload = event.payload as any;
    return {
      id: event.id,
      type: payload?.type ?? 'arrangement-event',
      time: (event.start as number) / this.config.ppq,
      duration: (event.duration as number) / this.config.ppq,
      data: payload,
    };
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create an adapter for a specific card type.
 */
export function createLegacyCardAdapter(
  type: 'drum-machine' | 'arpeggiator' | 'bassline' | 'arranger',
  config?: Partial<LegacyAdapterConfig>
): LegacyCardAdapter {
  switch (type) {
    case 'drum-machine':
      return new DrumMachineAdapter(config);
    case 'arpeggiator':
      return new ArpeggiatorAdapter(config);
    case 'bassline':
      return new BasslineAdapter(config);
    case 'arranger':
      return new ArrangerAdapter(config);
    default:
      throw new Error(`Unknown card type: ${type}`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  BaseLegacyAdapter,
};
