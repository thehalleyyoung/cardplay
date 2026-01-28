/**
 * @fileoverview Adapter System Implementation.
 * 
 * Adapters are specialized cards that convert between different data types.
 * 
 * @module @cardplay/core/cards/adapter
 */

import type {
  Card,
  CardContext,
} from './card';
import {
  createCard,
  createCardMeta,
  createSignature,
  createPort,
} from './card';

// ============================================================================
// ADAPTER TYPES
// ============================================================================

/**
 * Adapter category.
 */
export type AdapterCategory = 
  | 'conversion'
  | 'input'
  | 'output'
  | 'analysis'
  | 'synthesis'
  | 'mapping';

/**
 * Adapter interface - a specialized card for type conversion.
 */
export interface Adapter<A = unknown, B = unknown> extends Card<A, B> {
  /** Source type name */
  readonly sourceType: string;
  /** Target type name */
  readonly targetType: string;
  /** Adapter category */
  readonly category: AdapterCategory;
  /** Conversion cost (for path finding) */
  readonly cost: number;
  /** Whether conversion is lossless */
  readonly lossless: boolean;
}

/**
 * Adapter registry entry.
 */
export interface AdapterRegistryEntry {
  readonly adapter: Adapter<unknown, unknown>;
  readonly usageCount: number;
  readonly lastUsed: number;
}

/**
 * Adapter path for multi-hop conversion.
 */
export interface AdapterPath {
  readonly adapters: readonly Adapter<unknown, unknown>[];
  readonly totalCost: number;
  readonly lossless: boolean;
}

/**
 * Adapter suggestion for UI.
 */
export interface AdapterSuggestion {
  readonly adapter: Adapter<unknown, unknown>;
  readonly confidence: number;
  readonly reason: string;
}

// ============================================================================
// ADAPTER REGISTRY
// ============================================================================

/**
 * Adapter registry interface.
 */
export interface AdapterRegistry {
  /** Register an adapter */
  register<A, B>(adapter: Adapter<A, B>): void;
  /** Get adapter by ID */
  get(id: string): Adapter<unknown, unknown> | undefined;
  /** Find adapter for specific types */
  find(fromType: string, toType: string): Adapter<unknown, unknown> | undefined;
  /** Find path through multiple adapters */
  findPath(fromType: string, toType: string): AdapterPath | null;
  /** List all adapters */
  list(): readonly Adapter<unknown, unknown>[];
  /** List adapters by category */
  listByCategory(category: AdapterCategory): readonly Adapter<unknown, unknown>[];
  /** Clear registry */
  clear(): void;
}

/**
 * Adapter registry implementation.
 */
class AdapterRegistryImpl implements AdapterRegistry {
  private readonly adapters = new Map<string, AdapterRegistryEntry>();
  private readonly typeIndex = new Map<string, Set<string>>(); // fromType -> Set<adapterId>
  
  register<A, B>(adapter: Adapter<A, B>): void {
    const entry: AdapterRegistryEntry = {
      adapter: adapter as Adapter<unknown, unknown>,
      usageCount: 0,
      lastUsed: 0,
    };
    this.adapters.set(adapter.meta.id, entry);
    
    // Index by source type
    const key = adapter.sourceType;
    if (!this.typeIndex.has(key)) {
      this.typeIndex.set(key, new Set());
    }
    this.typeIndex.get(key)!.add(adapter.meta.id);
  }
  
  get(id: string): Adapter<unknown, unknown> | undefined {
    return this.adapters.get(id)?.adapter;
  }
  
  find(fromType: string, toType: string): Adapter<unknown, unknown> | undefined {
    const candidateIds = this.typeIndex.get(fromType);
    if (!candidateIds) return undefined;
    
    for (const id of candidateIds) {
      const entry = this.adapters.get(id);
      if (entry?.adapter.targetType === toType) {
        // Update usage stats
        (entry as { usageCount: number }).usageCount++;
        (entry as { lastUsed: number }).lastUsed = Date.now();
        return entry.adapter;
      }
    }
    
    return undefined;
  }
  
  findPath(fromType: string, toType: string): AdapterPath | null {
    // Direct path
    const direct = this.find(fromType, toType);
    if (direct) {
      return {
        adapters: [direct],
        totalCost: direct.cost,
        lossless: direct.lossless,
      };
    }
    
    // BFS for multi-hop path
    const visited = new Set<string>();
    const queue: { type: string; path: Adapter<unknown, unknown>[]; cost: number }[] = [
      { type: fromType, path: [], cost: 0 },
    ];
    
    while (queue.length > 0) {
      const { type, path, cost } = queue.shift()!;
      
      if (visited.has(type)) continue;
      visited.add(type);
      
      const candidateIds = this.typeIndex.get(type);
      if (!candidateIds) continue;
      
      for (const id of candidateIds) {
        const adapter = this.adapters.get(id)?.adapter;
        if (!adapter) continue;
        
        const newPath = [...path, adapter];
        const newCost = cost + adapter.cost;
        
        if (adapter.targetType === toType) {
          return {
            adapters: newPath,
            totalCost: newCost,
            lossless: newPath.every(a => a.lossless),
          };
        }
        
        queue.push({
          type: adapter.targetType,
          path: newPath,
          cost: newCost,
        });
      }
    }
    
    return null;
  }
  
  list(): readonly Adapter<unknown, unknown>[] {
    return Array.from(this.adapters.values()).map(e => e.adapter);
  }
  
  listByCategory(category: AdapterCategory): readonly Adapter<unknown, unknown>[] {
    return this.list().filter(a => a.category === category);
  }
  
  clear(): void {
    this.adapters.clear();
    this.typeIndex.clear();
  }
}

// Singleton instance
let adapterRegistryInstance: AdapterRegistry | null = null;

/**
 * Gets the adapter registry singleton.
 */
export function getAdapterRegistry(): AdapterRegistry {
  if (!adapterRegistryInstance) {
    adapterRegistryInstance = new AdapterRegistryImpl();
  }
  return adapterRegistryInstance;
}

/**
 * Resets the adapter registry.
 */
export function resetAdapterRegistry(): void {
  adapterRegistryInstance = null;
}

// ============================================================================
// ADAPTER FACTORY
// ============================================================================

/**
 * Options for creating an adapter.
 */
export interface CreateAdapterOptions<A, B> {
  id: string;
  name: string;
  sourceType: string;
  targetType: string;
  category?: AdapterCategory;
  cost?: number;
  lossless?: boolean;
  convert: (input: A, context: CardContext) => B;
}

/**
 * Creates an adapter from source to target type.
 */
export function createAdapter<A, B>(
  options: CreateAdapterOptions<A, B>
): Adapter<A, B> {
  const {
    id,
    name,
    sourceType,
    targetType,
    category = 'conversion',
    cost = 1,
    lossless = false,
    convert,
  } = options;
  
  const baseCard = createCard<A, B>({
    meta: createCardMeta(id, name, 'routing'),
    signature: createSignature(
      [createPort('input', sourceType)],
      [createPort('output', targetType)]
    ),
    process: (input, context) => ({ output: convert(input, context) }),
  });
  
  return Object.freeze({
    ...baseCard,
    sourceType,
    targetType,
    category,
    cost,
    lossless,
  });
}

/**
 * Registers an adapter in the global registry.
 */
export function registerAdapter<A, B>(adapter: Adapter<A, B>): void {
  getAdapterRegistry().register(adapter);
}

/**
 * Finds an adapter between two types.
 */
export function findAdapter(
  fromType: string,
  toType: string
): Adapter<unknown, unknown> | undefined {
  return getAdapterRegistry().find(fromType, toType);
}

/**
 * Finds a path through multiple adapters.
 */
export function findAdapterPath(
  fromType: string,
  toType: string
): AdapterPath | null {
  return getAdapterRegistry().findPath(fromType, toType);
}

/**
 * Gets the cost of using an adapter.
 */
export function adapterCost(adapter: Adapter<unknown, unknown>): number {
  return adapter.cost;
}

// ============================================================================
// STACK HELPERS
// ============================================================================

import type { Stack, StackEntry } from './stack';
import { inferStackPorts } from './stack';

/**
 * Inserts an adapter at a position in the stack.
 */
export function insertAdapter<A, B>(
  stack: Stack<A, B>,
  adapter: Adapter<unknown, unknown>,
  position: number
): Stack<A, B> {
  const entries = [...stack.entries];
  const newEntry: StackEntry = {
    id: `adapter-entry-${Date.now()}`,
    card: adapter,
    bypassed: false,
    solo: false,
    mix: 1,
  };
  
  entries.splice(position, 0, newEntry);
  
  return Object.freeze({
    id: stack.id,
    mode: stack.mode,
    entries: Object.freeze(entries),
    signature: inferStackPorts(entries, stack.mode),
    meta: stack.meta,
  });
}

/**
 * Automatically inserts adapters to fix type mismatches.
 */
export function autoInsertAdapters<A, B>(
  stack: Stack<A, B>
): Stack<A, B> | null {
  if (stack.entries.length < 2) {
    return stack;
  }
  
  const newEntries: StackEntry[] = [stack.entries[0]!];
  
  for (let i = 1; i < stack.entries.length; i++) {
    const prevEntry = newEntries[newEntries.length - 1]!;
    const currEntry = stack.entries[i]!;
    
    const prevOutputs = prevEntry.card.signature.outputs;
    const currInputs = currEntry.card.signature.inputs;
    
    // Check if types match
    if (prevOutputs.length > 0 && currInputs.length > 0) {
      const prevType = prevOutputs[0]!.type;
      const currType = currInputs[0]!.type;
      
      if (prevType !== currType) {
        // Try to find adapter
        const adapterPath = findAdapterPath(prevType, currType);
        if (!adapterPath) {
          return null; // Can't fix
        }
        
        // Insert all adapters in path
        for (const adapter of adapterPath.adapters) {
          newEntries.push({
            id: `auto-adapter-${Date.now()}-${Math.random()}`,
            card: adapter,
            bypassed: false,
            solo: false,
            mix: 1,
          });
        }
      }
    }
    
    newEntries.push(currEntry);
  }
  
  return Object.freeze({
    id: stack.id,
    mode: stack.mode,
    entries: Object.freeze(newEntries),
    signature: inferStackPorts(newEntries, stack.mode),
    meta: stack.meta,
  });
}

/**
 * Suggests adapters for a type mismatch.
 */
export function suggestAdapters(
  fromType: string,
  toType: string
): readonly AdapterSuggestion[] {
  const suggestions: AdapterSuggestion[] = [];
  
  // Direct adapter
  const direct = findAdapter(fromType, toType);
  if (direct) {
    suggestions.push({
      adapter: direct,
      confidence: 1.0,
      reason: 'Direct conversion available',
    });
  }
  
  // Multi-hop path
  const path = findAdapterPath(fromType, toType);
  if (path && path.adapters.length > 1) {
    suggestions.push({
      adapter: path.adapters[0]!,
      confidence: 0.8 / path.adapters.length,
      reason: `First step of ${path.adapters.length}-hop conversion`,
    });
  }
  
  // Similar type adapters
  const registry = getAdapterRegistry();
  const allAdapters = registry.list();
  for (const adapter of allAdapters) {
    if (adapter.sourceType === fromType && adapter.targetType !== toType) {
      // Could be useful as first step
      suggestions.push({
        adapter,
        confidence: 0.3,
        reason: `Converts ${fromType} to ${adapter.targetType}`,
      });
    }
  }
  
  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);
  
  return suggestions.slice(0, 5);
}

// ============================================================================
// BUILT-IN ADAPTERS
// ============================================================================

// AdapterPattern type (simplified, distinct from container Pattern)
export interface AdapterPattern<T> {
  readonly events: readonly T[];
  readonly duration: number;
}

// Simple event-like type for adapters (not the full Event type)
interface SimpleEvent {
  readonly type: string;
  readonly time: number;
  readonly data: unknown;
}

// Simple stream-like type for adapters
interface SimpleStream {
  readonly events: readonly SimpleEvent[];
  readonly duration: number;
}

/**
 * PatternToEvents adapter - converts pattern to event stream.
 */
export const PatternToEvents = createAdapter<AdapterPattern<SimpleEvent>, SimpleStream>({
  id: 'pattern-to-events',
  name: 'Pattern to Events',
  sourceType: 'Pattern',
  targetType: 'Stream',
  category: 'conversion',
  cost: 1,
  lossless: true,
  convert: (pattern) => ({
    events: pattern.events,
    duration: pattern.duration,
  }),
});

/**
 * EventsToAudio adapter - converts events to audio (stub).
 */
export const EventsToAudio = createAdapter<SimpleStream, Float32Array>({
  id: 'events-to-audio',
  name: 'Events to Audio',
  sourceType: 'Stream',
  targetType: 'Audio',
  category: 'synthesis',
  cost: 10,
  lossless: false,
  convert: (_stream, context) => {
    // Placeholder - real implementation would use WebAudio
    const sampleRate = context.engine?.sampleRate ?? 44100;
    const duration = 1; // 1 second stub
    return new Float32Array(sampleRate * duration);
  },
});

/**
 * AudioToEvents adapter - converts audio to events (analysis).
 */
export const AudioToEvents = createAdapter<Float32Array, SimpleStream>({
  id: 'audio-to-events',
  name: 'Audio to Events',
  sourceType: 'Audio',
  targetType: 'Stream',
  category: 'analysis',
  cost: 20,
  lossless: false,
  convert: (audio) => {
    // Placeholder - real implementation would do onset detection, pitch tracking, etc.
    return {
      events: [],
      duration: audio.length / 44100,
    };
  },
});

// MIDI types (simplified)
export interface MIDIMessage {
  readonly type: 'note-on' | 'note-off' | 'cc' | 'program';
  readonly channel: number;
  readonly data1: number;
  readonly data2?: number;
  readonly timestamp: number;
}

/**
 * MIDIToEvents adapter.
 */
export const MIDIToEvents = createAdapter<readonly MIDIMessage[], SimpleStream>({
  id: 'midi-to-events',
  name: 'MIDI to Events',
  sourceType: 'MIDI',
  targetType: 'Stream',
  category: 'input',
  cost: 2,
  lossless: true,
  convert: (messages) => {
    const events: SimpleEvent[] = messages.map(m => ({
      type: 'note',
      time: m.timestamp,
      data: { pitch: m.data1, velocity: m.data2 ?? 100 },
    }));
    return {
      events,
      duration: messages.length > 0 ? messages[messages.length - 1]!.timestamp : 0,
    };
  },
});

/**
 * EventsToMIDI adapter.
 */
export const EventsToMIDI = createAdapter<SimpleStream, readonly MIDIMessage[]>({
  id: 'events-to-midi',
  name: 'Events to MIDI',
  sourceType: 'Stream',
  targetType: 'MIDI',
  category: 'output',
  cost: 2,
  lossless: false,
  convert: (stream) => {
    // Placeholder - real implementation would convert events to MIDI
    return stream.events.map((_e, i) => ({
      type: 'note-on' as const,
      channel: 0,
      data1: 60,
      data2: 100,
      timestamp: i * 100,
    }));
  },
});

// Gesture type (simplified)
export interface Gesture {
  readonly type: 'tap' | 'swipe' | 'pinch' | 'rotate';
  readonly x: number;
  readonly y: number;
  readonly force?: number;
  readonly velocity?: { x: number; y: number };
}

/**
 * GestureToEvents adapter.
 */
export const GestureToEvents = createAdapter<readonly Gesture[], SimpleStream>({
  id: 'gesture-to-events',
  name: 'Gesture to Events',
  sourceType: 'Gesture',
  targetType: 'Stream',
  category: 'input',
  cost: 3,
  lossless: false,
  convert: (gestures) => ({
    events: gestures.map((g, i) => ({
      type: 'control',
      time: i,
      data: { x: g.x, y: g.y, force: g.force },
    })),
    duration: gestures.length,
  }),
});

// Control type
export interface ControlValue {
  readonly cc: number;
  readonly value: number;
  readonly channel?: number;
}

/**
 * ControlToEvents adapter.
 */
export const ControlToEvents = createAdapter<readonly ControlValue[], SimpleStream>({
  id: 'control-to-events',
  name: 'Control to Events',
  sourceType: 'Control',
  targetType: 'Stream',
  category: 'mapping',
  cost: 1,
  lossless: true,
  convert: (controls) => ({
    events: controls.map((c, i) => ({
      type: 'control',
      time: i,
      data: c,
    })),
    duration: controls.length,
  }),
});

// Note and Chord types
export interface Note {
  readonly pitch: number;
  readonly velocity: number;
  readonly duration: number;
}

export interface Chord {
  readonly root: number;
  readonly type: string;
  readonly inversion?: number;
}

/**
 * NoteToChord adapter - harmonizes a note.
 */
export const NoteToChord = createAdapter<Note, Chord>({
  id: 'note-to-chord',
  name: 'Note to Chord',
  sourceType: 'Note',
  targetType: 'Chord',
  category: 'conversion',
  cost: 2,
  lossless: false,
  convert: (note) => ({
    root: note.pitch % 12,
    type: 'major',
  }),
});

/**
 * ChordToNotes adapter - voices a chord.
 */
export const ChordToNotes = createAdapter<Chord, readonly Note[]>({
  id: 'chord-to-notes',
  name: 'Chord to Notes',
  sourceType: 'Chord',
  targetType: 'Notes',
  category: 'conversion',
  cost: 2,
  lossless: true,
  convert: (chord) => {
    const intervals: Record<string, number[]> = {
      major: [0, 4, 7],
      minor: [0, 3, 7],
      dim: [0, 3, 6],
      aug: [0, 4, 8],
    };
    const offsets = intervals[chord.type] ?? [0, 4, 7];
    return offsets.map(offset => ({
      pitch: chord.root + 60 + offset, // Middle C octave
      velocity: 100,
      duration: 1,
    }));
  },
});

// Score type (simplified)
export interface AdapterScore {
  readonly measures: readonly unknown[];
  readonly timeSignature: [number, number];
  readonly tempo: number;
}

/**
 * ScoreToPattern adapter.
 */
export const ScoreToPattern = createAdapter<AdapterScore, AdapterPattern<SimpleEvent>>({
  id: 'score-to-pattern',
  name: 'Score to Pattern',
  sourceType: 'Score',
  targetType: 'Pattern',
  category: 'conversion',
  cost: 5,
  lossless: true,
  convert: (score) => ({
    events: [],
    duration: score.measures.length * score.timeSignature[0],
  }),
});

/**
 * PatternToScore adapter.
 */
export const PatternToScore = createAdapter<AdapterPattern<SimpleEvent>, AdapterScore>({
  id: 'pattern-to-score',
  name: 'Pattern to Score',
  sourceType: 'Pattern',
  targetType: 'Score',
  category: 'conversion',
  cost: 5,
  lossless: false,
  convert: (_pattern) => ({
    measures: [],
    timeSignature: [4, 4],
    tempo: 120,
  }),
});

/**
 * Registers all built-in adapters.
 */
export function registerBuiltInAdapters(): void {
  const registry = getAdapterRegistry();
  registry.register(PatternToEvents);
  registry.register(EventsToAudio);
  registry.register(AudioToEvents);
  registry.register(MIDIToEvents);
  registry.register(EventsToMIDI);
  registry.register(GestureToEvents);
  registry.register(ControlToEvents);
  registry.register(NoteToChord);
  registry.register(ChordToNotes);
  registry.register(ScoreToPattern);
  registry.register(PatternToScore);
}
