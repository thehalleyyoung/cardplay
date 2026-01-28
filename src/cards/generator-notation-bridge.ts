/**
 * @fileoverview Generator Cards ↔ Score Notation Bridge
 * 
 * Connects generator cards (Arranger, Melody, Phrase, Bassline, etc.) to
 * the ScoreNotationCard for real-time preview of generated content.
 * 
 * Features:
 * - Display generated output in notation (with distinct styling)
 * - Support for multiple simultaneous generators
 * - "Freeze" generated content to editable clips
 * - Accept/reject/regenerate workflow
 * - Voice/track assignment for multi-voice output
 * 
 * @module @cardplay/cards/generator-notation-bridge
 */

import type { Tick, TickDuration } from '../types/primitives';
import type { ClipId, EventStreamId, CreateClipOptions } from '../state/types';
import { getClipRegistry, getSharedEventStore } from '../state';
import { generateEventStreamId } from '../state/types';
import type { ScoreNoteInput } from '../cards/score-notation';
import { ScoreNotationCard } from '../cards/score-notation';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Supported generator card types.
 */
export type GeneratorCardType =
  | 'arranger'
  | 'melody'
  | 'phrase'
  | 'bassline'
  | 'arpeggiator'
  | 'drum-machine'
  | 'sequencer'
  | 'custom';

/**
 * Generated note event (output from generators).
 */
export interface GeneratedNote {
  /** Unique ID */
  readonly id: string;
  /** Start tick */
  readonly startTick: Tick;
  /** Duration in ticks */
  readonly durationTick: TickDuration;
  /** MIDI pitch (0-127) */
  readonly pitch: number;
  /** Velocity (0-127) */
  readonly velocity: number;
  /** Voice/channel */
  readonly voice: number;
  /** Source generator card ID */
  readonly sourceCardId: string;
  /** Generator type */
  readonly generatorType: GeneratorCardType;
  /** Additional metadata */
  readonly meta?: Record<string, unknown> | undefined;
}

/**
 * Multi-voice output from arranger/accompaniment generators.
 */
export interface MultiVoiceOutput {
  /** Drum track notes */
  readonly drums?: readonly GeneratedNote[];
  /** Bass track notes */
  readonly bass?: readonly GeneratedNote[];
  /** Chord/keys track notes */
  readonly keys?: readonly GeneratedNote[];
  /** Pad/strings track notes */
  readonly pad?: readonly GeneratedNote[];
  /** Lead/melody track notes */
  readonly lead?: readonly GeneratedNote[];
  /** Custom voice tracks */
  readonly custom?: Record<string, readonly GeneratedNote[]>;
}

/**
 * Registration of a generator card.
 */
export interface GeneratorRegistration {
  /** Generator card ID */
  readonly cardId: string;
  /** Generator type */
  readonly type: GeneratorCardType;
  /** Display name */
  readonly name: string;
  /** Output event stream ID (if writing to shared store) */
  readonly streamId?: EventStreamId;
  /** Voice assignment for notation */
  readonly voice: number;
  /** Display color in notation */
  readonly color: string;
  /** Whether generator is active */
  enabled: boolean;
}

/**
 * State of the generator-notation bridge.
 */
export interface GeneratorNotationBridgeState {
  /** Registered generators */
  readonly generators: readonly GeneratorRegistration[];
  /** Currently generated notes (preview) */
  readonly previewNotes: readonly GeneratedNote[];
  /** Whether preview mode is enabled */
  readonly previewEnabled: boolean;
  /** Whether showing all generators or filtered */
  readonly filterGenerator: string | null;
}

/**
 * Callbacks for bridge events.
 */
export interface GeneratorNotationBridgeCallbacks {
  /** Called when generator output is updated */
  onOutputUpdated?: (cardId: string, notes: readonly GeneratedNote[]) => void;
  /** Called when content is frozen to clip */
  onContentFrozen?: (clipId: ClipId, notes: readonly GeneratedNote[]) => void;
  /** Called when preview changes */
  onPreviewChanged?: (notes: readonly GeneratedNote[]) => void;
}

/**
 * Configuration for the bridge.
 */
export interface GeneratorNotationBridgeConfig {
  /** Ticks per quarter note */
  readonly ticksPerQuarter: number;
  /** Whether to auto-update notation on generator changes */
  readonly autoUpdate: boolean;
  /** Opacity for preview notes (0-1) */
  readonly previewOpacity: number;
  /** Maximum notes to display in preview */
  readonly maxPreviewNotes: number;
}

/**
 * Default configuration.
 */
export const DEFAULT_GENERATOR_BRIDGE_CONFIG: GeneratorNotationBridgeConfig = {
  ticksPerQuarter: 480,
  autoUpdate: true,
  previewOpacity: 0.5,
  maxPreviewNotes: 1000,
};

/**
 * Voice/color assignments for common generator types.
 */
export const DEFAULT_GENERATOR_THEMES: Record<GeneratorCardType, { voice: number; color: string }> = {
  'arranger': { voice: 0, color: '#f59e0b' },    // Amber
  'melody': { voice: 1, color: '#3b82f6' },      // Blue
  'phrase': { voice: 2, color: '#8b5cf6' },      // Purple
  'bassline': { voice: 3, color: '#ef4444' },    // Red
  'arpeggiator': { voice: 4, color: '#10b981' }, // Green
  'drum-machine': { voice: 9, color: '#6b7280' }, // Gray (GM drums channel)
  'sequencer': { voice: 5, color: '#ec4899' },   // Pink
  'custom': { voice: 6, color: '#71717a' },      // Neutral
};

// ============================================================================
// BRIDGE INTERFACE
// ============================================================================

/**
 * Bridge connecting generator cards to ScoreNotationCard.
 */
export interface GeneratorNotationBridge {
  // --- Lifecycle ---
  
  /** Start the bridge */
  start(): void;
  
  /** Stop the bridge */
  stop(): void;
  
  /** Dispose of the bridge */
  dispose(): void;
  
  // --- Generator Registration ---
  
  /** Register a generator card */
  registerGenerator(
    cardId: string,
    type: GeneratorCardType,
    name: string,
    options?: { voice?: number; color?: string; streamId?: EventStreamId }
  ): GeneratorRegistration;
  
  /** Unregister a generator card */
  unregisterGenerator(cardId: string): boolean;
  
  /** Get registered generators */
  getRegisteredGenerators(): readonly GeneratorRegistration[];
  
  /** Enable/disable a generator */
  setGeneratorEnabled(cardId: string, enabled: boolean): void;
  
  // --- Output Handling ---
  
  /** Update generator output (call this when generator produces new notes) */
  updateGeneratorOutput(cardId: string, notes: readonly GeneratedNote[]): void;
  
  /** Update multi-voice output (for arranger/accompaniment) */
  updateMultiVoiceOutput(cardId: string, output: MultiVoiceOutput): void;
  
  /** Clear generator output */
  clearGeneratorOutput(cardId: string): void;
  
  /** Clear all generator outputs */
  clearAllOutputs(): void;
  
  // --- Freeze/Accept Workflow ---
  
  /** Freeze generated content to a new clip */
  freezeToClip(
    cardId: string,
    clipName?: string,
    options?: Partial<CreateClipOptions>
  ): ClipId | null;
  
  /** Freeze all generator outputs to clips (one per voice) */
  freezeAllToClips(prefix?: string): readonly ClipId[];
  
  /** Accept generated content (commit to clip and clear preview) */
  acceptGenerated(cardId: string, targetClipId: ClipId): boolean;
  
  /** Reject generated content (clear preview without saving) */
  rejectGenerated(cardId: string): void;
  
  // --- Preview Control ---
  
  /** Enable/disable preview mode */
  setPreviewEnabled(enabled: boolean): void;
  
  /** Filter to show only one generator */
  setGeneratorFilter(cardId: string | null): void;
  
  /** Refresh notation display */
  refresh(): void;
  
  // --- State & Config ---
  
  /** Get current state */
  getState(): GeneratorNotationBridgeState;
  
  /** Get configuration */
  getConfig(): GeneratorNotationBridgeConfig;
  
  /** Update configuration */
  updateConfig(changes: Partial<GeneratorNotationBridgeConfig>): void;
  
  /** Set callbacks */
  setCallbacks(callbacks: GeneratorNotationBridgeCallbacks): void;
}

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert GeneratedNote to ScoreNoteInput.
 */
function generatedNoteToScoreInput(note: GeneratedNote): ScoreNoteInput {
  return {
    id: note.id,
    startTick: note.startTick,
    durationTick: note.durationTick,
    pitch: note.pitch,
    velocity: note.velocity,
    voice: note.voice,
    sourceCardId: note.sourceCardId,
    sourceEventId: note.id,
  };
}

/**
 * Convert GeneratedNote to Event format for SharedEventStore.
 * Using a type-cast approach since Event<P> has more strict types.
 */
function generatedNoteToEvent(note: GeneratedNote): {
  id: string;
  kind: string;
  start: Tick;
  duration: TickDuration;
  payload: Record<string, unknown>;
} {
  return {
    id: note.id,
    kind: 'Note',
    start: note.startTick,
    duration: note.durationTick,
    payload: {
      pitch: note.pitch,
      note: note.pitch,
      velocity: note.velocity,
      voice: note.voice,
      channel: note.voice,
      sourceCardId: note.sourceCardId,
      generatorType: note.generatorType,
      ...(note.meta ?? {}),
    },
  };
}

/**
 * Flatten MultiVoiceOutput to array of GeneratedNotes.
 */
function flattenMultiVoiceOutput(
  output: MultiVoiceOutput,
  sourceCardId: string
): GeneratedNote[] {
  const allNotes: GeneratedNote[] = [];
  
  const addNotes = (notes: readonly GeneratedNote[] | undefined, voice: number) => {
    if (!notes) return;
    for (const note of notes) {
      allNotes.push({
        ...note,
        voice,
        sourceCardId,
      });
    }
  };
  
  addNotes(output.drums, 9);  // GM drums channel
  addNotes(output.bass, 1);
  addNotes(output.keys, 2);
  addNotes(output.pad, 3);
  addNotes(output.lead, 0);
  
  if (output.custom) {
    let customVoice = 4;
    for (const [_name, notes] of Object.entries(output.custom)) {
      addNotes(notes, customVoice++);
    }
  }
  
  return allNotes;
}

// ============================================================================
// BRIDGE IMPLEMENTATION
// ============================================================================

/**
 * Create a GeneratorNotationBridge instance.
 */
export function createGeneratorNotationBridge(
  notationCard: ScoreNotationCard,
  config: Partial<GeneratorNotationBridgeConfig> = {}
): GeneratorNotationBridge {
  // Merge config
  let bridgeConfig: GeneratorNotationBridgeConfig = {
    ...DEFAULT_GENERATOR_BRIDGE_CONFIG,
    ...config,
  };
  
  // Internal state
  const generators = new Map<string, GeneratorRegistration>();
  const generatorOutputs = new Map<string, GeneratedNote[]>();
  let previewEnabled = true;
  let filterGenerator: string | null = null;
  let active = false;
  
  // Callbacks
  let callbacks: GeneratorNotationBridgeCallbacks = {};
  
  // Existing notes in notation (non-generated)
  let baseNotes: ScoreNoteInput[] = [];
  
  /**
   * Update the notation card with current preview notes.
   */
  function updateNotation(): void {
    if (!active || !previewEnabled) {
      // Only show base notes
      notationCard.setInputNotes([...baseNotes]);
      return;
    }
    
    // Collect all generated notes
    let previewNotes: GeneratedNote[] = [];
    
    for (const [cardId, notes] of generatorOutputs) {
      // Check if generator is enabled and passes filter
      const reg = generators.get(cardId);
      if (!reg || !reg.enabled) continue;
      if (filterGenerator && cardId !== filterGenerator) continue;
      
      previewNotes.push(...notes);
    }
    
    // Limit notes if needed
    if (previewNotes.length > bridgeConfig.maxPreviewNotes) {
      previewNotes = previewNotes.slice(0, bridgeConfig.maxPreviewNotes);
    }
    
    // Convert to ScoreNoteInput
    const scorePreviewNotes = previewNotes.map(generatedNoteToScoreInput);
    
    // Merge with base notes
    notationCard.setInputNotes([...baseNotes, ...scorePreviewNotes]);
    
    callbacks.onPreviewChanged?.(previewNotes);
  }
  
  // Create the bridge object
  const bridge: GeneratorNotationBridge = {
    start(): void {
      if (active) return;
      active = true;
      
      // Capture current notes as base notes
      baseNotes = [...notationCard.getInputNotes()];
      
      updateNotation();
    },
    
    stop(): void {
      if (!active) return;
      active = false;
      
      // Restore base notes only
      notationCard.setInputNotes([...baseNotes]);
    },
    
    dispose(): void {
      bridge.stop();
      generators.clear();
      generatorOutputs.clear();
      baseNotes = [];
    },
    
    registerGenerator(
      cardId: string,
      type: GeneratorCardType,
      name: string,
      options: { voice?: number; color?: string; streamId?: EventStreamId } = {}
    ): GeneratorRegistration {
      const theme = DEFAULT_GENERATOR_THEMES[type];
      
      // Build registration without optional undefined values
      const registration: GeneratorRegistration = {
        cardId,
        type,
        name,
        ...(options.streamId ? { streamId: options.streamId } : {}),
        voice: options.voice ?? theme.voice,
        color: options.color ?? theme.color,
        enabled: true,
      };
      
      generators.set(cardId, registration);
      generatorOutputs.set(cardId, []);
      
      return registration;
    },
    
    unregisterGenerator(cardId: string): boolean {
      const existed = generators.has(cardId);
      generators.delete(cardId);
      generatorOutputs.delete(cardId);
      
      if (existed) {
        updateNotation();
      }
      
      return existed;
    },
    
    getRegisteredGenerators(): readonly GeneratorRegistration[] {
      return Array.from(generators.values());
    },
    
    setGeneratorEnabled(cardId: string, enabled: boolean): void {
      const reg = generators.get(cardId);
      if (reg) {
        reg.enabled = enabled;
        updateNotation();
      }
    },
    
    updateGeneratorOutput(cardId: string, notes: readonly GeneratedNote[]): void {
      if (!generators.has(cardId)) {
        // Auto-register with default type
        bridge.registerGenerator(cardId, 'custom', cardId);
      }
      
      generatorOutputs.set(cardId, [...notes]);
      
      if (bridgeConfig.autoUpdate) {
        updateNotation();
      }
      
      callbacks.onOutputUpdated?.(cardId, notes);
    },
    
    updateMultiVoiceOutput(cardId: string, output: MultiVoiceOutput): void {
      const flattened = flattenMultiVoiceOutput(output, cardId);
      bridge.updateGeneratorOutput(cardId, flattened);
    },
    
    clearGeneratorOutput(cardId: string): void {
      if (generatorOutputs.has(cardId)) {
        generatorOutputs.set(cardId, []);
        updateNotation();
      }
    },
    
    clearAllOutputs(): void {
      for (const cardId of generatorOutputs.keys()) {
        generatorOutputs.set(cardId, []);
      }
      updateNotation();
    },
    
    freezeToClip(
      cardId: string,
      clipName?: string,
      options: Partial<CreateClipOptions> = {}
    ): ClipId | null {
      const notes = generatorOutputs.get(cardId);
      if (!notes || notes.length === 0) return null;
      
      const reg = generators.get(cardId);
      const name = clipName ?? `${reg?.name ?? cardId} (frozen)`;
      
      // Create event stream
      const eventStore = getSharedEventStore();
      const streamId = generateEventStreamId();
      eventStore.createStream({ name });
      
      // Add events to stream - cast for SharedEventStore interface compatibility
      const events = notes.map(generatedNoteToEvent);
      eventStore.addEvents(streamId, events as unknown as readonly import('../types/event').Event<unknown>[]);
      
      // Calculate duration
      const maxTick = Math.max(...notes.map(n => n.startTick + n.durationTick));
      const duration = (Math.ceil(maxTick / bridgeConfig.ticksPerQuarter) * bridgeConfig.ticksPerQuarter) as Tick;
      
      // Create clip - build options without optional undefined values
      const registry = getClipRegistry();
      const clipOptions: CreateClipOptions = {
        name,
        streamId,
        duration,
        ...(reg?.color ? { color: reg.color } : {}),
        ...(options.loop !== undefined ? { loop: options.loop } : {}),
        ...(options.loopStart !== undefined ? { loopStart: options.loopStart } : {}),
        ...(options.loopEnd !== undefined ? { loopEnd: options.loopEnd } : {}),
        ...(options.speed !== undefined ? { speed: options.speed } : {}),
        ...(options.pitchShift !== undefined ? { pitchShift: options.pitchShift } : {}),
      };
      const clip = registry.createClip(clipOptions);
      
      callbacks.onContentFrozen?.(clip.id, notes);
      
      return clip.id;
    },
    
    freezeAllToClips(prefix: string = 'Generated'): readonly ClipId[] {
      const clipIds: ClipId[] = [];
      
      for (const [cardId, notes] of generatorOutputs) {
        if (notes.length === 0) continue;
        
        const reg = generators.get(cardId);
        const clipName = `${prefix} - ${reg?.name ?? cardId}`;
        
        const clipId = bridge.freezeToClip(cardId, clipName);
        if (clipId) {
          clipIds.push(clipId);
        }
      }
      
      return clipIds;
    },
    
    acceptGenerated(cardId: string, targetClipId: ClipId): boolean {
      const notes = generatorOutputs.get(cardId);
      if (!notes || notes.length === 0) return false;
      
      const registry = getClipRegistry();
      const clip = registry.getClip(targetClipId);
      if (!clip) return false;
      
      // Add events to clip's stream - cast for store compatibility
      const eventStore = getSharedEventStore();
      const events = notes.map(generatedNoteToEvent);
      eventStore.addEvents(clip.streamId, events as unknown as readonly import('../types/event').Event<unknown>[]);
      
      // Clear the generator output
      bridge.clearGeneratorOutput(cardId);
      
      return true;
    },
    
    rejectGenerated(cardId: string): void {
      bridge.clearGeneratorOutput(cardId);
    },
    
    setPreviewEnabled(enabled: boolean): void {
      previewEnabled = enabled;
      updateNotation();
    },
    
    setGeneratorFilter(cardId: string | null): void {
      filterGenerator = cardId;
      updateNotation();
    },
    
    refresh(): void {
      updateNotation();
    },
    
    getState(): GeneratorNotationBridgeState {
      // Collect all preview notes
      const allPreviewNotes: GeneratedNote[] = [];
      for (const notes of generatorOutputs.values()) {
        allPreviewNotes.push(...notes);
      }
      
      return {
        generators: Array.from(generators.values()),
        previewNotes: allPreviewNotes,
        previewEnabled,
        filterGenerator,
      };
    },
    
    getConfig(): GeneratorNotationBridgeConfig {
      return { ...bridgeConfig };
    },
    
    updateConfig(changes: Partial<GeneratorNotationBridgeConfig>): void {
      bridgeConfig = {
        ...bridgeConfig,
        ...changes,
      };
      updateNotation();
    },
    
    setCallbacks(newCallbacks: GeneratorNotationBridgeCallbacks): void {
      callbacks = newCallbacks;
    },
  };
  
  return bridge;
}

// ============================================================================
// SINGLETON BRIDGE
// ============================================================================

let _globalGeneratorBridge: GeneratorNotationBridge | null = null;

/**
 * Gets or creates the global GeneratorNotationBridge.
 */
export function getGeneratorNotationBridge(
  notationCard?: ScoreNotationCard
): GeneratorNotationBridge {
  if (!_globalGeneratorBridge) {
    if (!notationCard) {
      notationCard = new ScoreNotationCard('generator-notation-card');
    }
    _globalGeneratorBridge = createGeneratorNotationBridge(notationCard);
    _globalGeneratorBridge.start();
  }
  return _globalGeneratorBridge;
}

/**
 * Resets the global generator-notation bridge (for testing).
 */
export function resetGeneratorNotationBridge(): void {
  if (_globalGeneratorBridge) {
    _globalGeneratorBridge.dispose();
    _globalGeneratorBridge = null;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a GeneratedNote from basic parameters.
 */
export function createGeneratedNote(
  pitch: number,
  startTick: Tick,
  durationTick: TickDuration,
  options: {
    velocity?: number;
    voice?: number;
    sourceCardId?: string;
    generatorType?: GeneratorCardType;
    meta?: Record<string, unknown>;
  } = {}
): GeneratedNote {
  const result: GeneratedNote = {
    id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    startTick,
    durationTick,
    pitch,
    velocity: options.velocity ?? 100,
    voice: options.voice ?? 0,
    sourceCardId: options.sourceCardId ?? 'unknown',
    generatorType: options.generatorType ?? 'custom',
    ...(options.meta ? { meta: options.meta } : {}),
  };
  return result;
}

/**
 * Convert MelodyOutput notes to GeneratedNotes.
 */
export function melodyNotesToGeneratedNotes(
  notes: readonly { note: number; velocity: number; startTick: number; duration: number }[],
  sourceCardId: string
): GeneratedNote[] {
  return notes.map((n, i) => ({
    id: `melody_${sourceCardId}_${i}`,
    startTick: n.startTick as Tick,
    durationTick: n.duration as TickDuration,
    pitch: n.note,
    velocity: n.velocity,
    voice: 0,
    sourceCardId,
    generatorType: 'melody' as GeneratorCardType,
  }));
}

/**
 * Convert arranger voice output to GeneratedNotes.
 */
export function arrangerVoiceToGeneratedNotes(
  events: readonly { tick: number; note: number; velocity: number; duration: number }[],
  voice: number,
  sourceCardId: string,
  voiceName: string
): GeneratedNote[] {
  return events.map((e, i) => ({
    id: `arranger_${voiceName}_${sourceCardId}_${i}`,
    startTick: e.tick as Tick,
    durationTick: e.duration as TickDuration,
    pitch: e.note,
    velocity: e.velocity,
    voice,
    sourceCardId,
    generatorType: 'arranger' as GeneratorCardType,
    meta: { voiceName },
  }));
}
