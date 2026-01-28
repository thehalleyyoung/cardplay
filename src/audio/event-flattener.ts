/**
 * @fileoverview Event Flattening/Baking System.
 * 
 * Resolves card effects to a static event list for export and playback.
 * This system bridges card processing with audio export by:
 * - Simulating card chains tick-by-tick
 * - Collecting all output events with absolute timing
 * - Handling stateful cards (arpeggiator, sequencer)
 * - Supporting generators that produce events from parameters
 * - Supporting transforms that modify existing events
 * 
 * @module @cardplay/core/audio/event-flattener
 */

import type { Tick, TickDuration } from '../types/primitives';
import { asTick, asTickDuration, PPQ } from '../types/primitives';
import type { Card, CardContext, CardState, Transport, EngineRef } from '../cards/card';
import { createCardContext } from '../cards/card';
import type { Graph, GraphNode } from '../cards/graph';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Supported event types for flattening.
 */
export type FlattenedEventType = 
  | 'noteOn'
  | 'noteOff'
  | 'cc'        // Control change
  | 'pitchBend'
  | 'aftertouch'
  | 'trigger'
  | 'audio'
  | 'custom';

/**
 * A resolved event with absolute time information.
 * This is the output of the flattening process.
 */
export interface FlattenedEvent {
  /** Unique event ID */
  readonly id: string;
  /** Event type */
  readonly type: FlattenedEventType;
  /** Absolute tick position */
  readonly tick: Tick;
  /** Absolute sample position */
  readonly sample: number;
  /** Absolute time in seconds */
  readonly seconds: number;
  /** Event duration in ticks (for note events) */
  readonly duration?: TickDuration;
  /** Duration in samples */
  readonly durationSamples?: number;
  /** Duration in seconds */
  readonly durationSeconds?: number;
  /** MIDI note number (for note events) */
  readonly note?: number;
  /** Velocity (0-127) */
  readonly velocity?: number;
  /** Channel (0-15) */
  readonly channel?: number;
  /** Controller number (for CC events) */
  readonly controller?: number;
  /** Controller value (for CC events) */
  readonly value?: number;
  /** Source card ID */
  readonly sourceCardId?: string;
  /** Source track ID */
  readonly sourceTrackId?: string;
  /** Additional event data */
  readonly data?: Record<string, unknown>;
}

/**
 * Input event for card processing.
 * Can be from MIDI, other cards, or generators.
 */
export interface InputEvent {
  /** Event type */
  readonly type: string;
  /** Tick position (relative to processing window) */
  readonly tick: Tick;
  /** Event data */
  readonly data: Record<string, unknown>;
}

/**
 * Configuration options for the flattening process.
 */
export interface FlattenConfig {
  /** Start tick (inclusive) */
  readonly startTick: Tick;
  /** End tick (exclusive) */
  readonly endTick: Tick;
  /** Ticks per beat (PPQ) */
  readonly ticksPerBeat: number;
  /** Tempo in BPM */
  readonly tempo: number;
  /** Sample rate for sample position calculation */
  readonly sampleRate: number;
  /** Time signature [numerator, denominator] */
  readonly timeSignature: readonly [number, number];
  /** Processing resolution in ticks (how often to call cards) */
  readonly tickResolution: number;
  /** Whether to include source card info in events */
  readonly includeSourceInfo: boolean;
  /** Maximum events to generate (safety limit) */
  readonly maxEvents: number;
  /** Channels to process (null = all) */
  readonly channels?: readonly number[] | null;
  /** Whether to merge overlapping notes */
  readonly mergeOverlapping: boolean;
  /** Whether to sort events by time */
  readonly sortEvents: boolean;
}

/**
 * Default flatten configuration.
 */
export const DEFAULT_FLATTEN_CONFIG: FlattenConfig = {
  startTick: asTick(0),
  endTick: asTick(PPQ * 4 * 16), // 16 bars
  ticksPerBeat: PPQ,
  tempo: 120,
  sampleRate: 48000,
  timeSignature: [4, 4],
  tickResolution: 1, // Every tick
  includeSourceInfo: true,
  maxEvents: 100000,
  channels: null,
  mergeOverlapping: false,
  sortEvents: true,
};

/**
 * Statistics about the flattening process.
 */
export interface FlattenStats {
  /** Total events generated */
  readonly totalEvents: number;
  /** Events by type */
  readonly eventsByType: Record<string, number>;
  /** Total ticks processed */
  readonly ticksProcessed: number;
  /** Processing time in ms */
  readonly processingTimeMs: number;
  /** Number of cards processed */
  readonly cardsProcessed: number;
  /** Peak concurrent notes */
  readonly peakConcurrentNotes: number;
}

/**
 * Warning generated during flattening.
 */
export interface FlattenWarning {
  readonly type: 'overflow' | 'missing_card' | 'invalid_event' | 'timing' | 'state';
  readonly message: string;
  readonly tick?: Tick;
  readonly cardId?: string;
}

/**
 * Result of the flattening process.
 */
export interface FlattenResult {
  /** Flattened events sorted by time */
  readonly events: readonly FlattenedEvent[];
  /** Statistics */
  readonly stats: FlattenStats;
  /** Warnings generated during processing */
  readonly warnings: readonly FlattenWarning[];
  /** Whether flattening completed successfully */
  readonly success: boolean;
  /** Error message if failed */
  readonly error?: string;
}

/**
 * Track definition for session flattening.
 */
export interface TrackDefinition {
  readonly id: string;
  readonly name: string;
  readonly cards: readonly Card<unknown, unknown>[];
  readonly muted: boolean;
  readonly solo: boolean;
  readonly inputEvents?: readonly InputEvent[];
}

/**
 * Session definition for export preparation.
 */
export interface SessionDefinition {
  readonly id: string;
  readonly tracks: readonly TrackDefinition[];
  readonly tempo: number;
  readonly timeSignature: readonly [number, number];
  readonly loopStart?: Tick;
  readonly loopEnd?: Tick;
}

// ============================================================================
// ID GENERATION
// ============================================================================

let eventIdCounter = 0;

/**
 * Generates a unique event ID.
 */
function generateEventId(): string {
  return `evt-${++eventIdCounter}-${Date.now().toString(36)}`;
}

// ============================================================================
// TIME CONVERSION UTILITIES
// ============================================================================

/**
 * Calculates samples per tick based on tempo and sample rate.
 */
export function calculateSamplesPerTick(
  tempo: number,
  sampleRate: number,
  ticksPerBeat: number
): number {
  const beatsPerSecond = tempo / 60;
  const ticksPerSecond = beatsPerSecond * ticksPerBeat;
  return sampleRate / ticksPerSecond;
}

/**
 * Converts tick to sample position.
 */
export function tickToSample(
  tick: Tick,
  tempo: number,
  sampleRate: number,
  ticksPerBeat: number
): number {
  const samplesPerTick = calculateSamplesPerTick(tempo, sampleRate, ticksPerBeat);
  return Math.floor(tick * samplesPerTick);
}

/**
 * Converts tick to seconds.
 */
export function tickToSeconds(
  tick: Tick,
  tempo: number,
  ticksPerBeat: number
): number {
  const beatsPerSecond = tempo / 60;
  const ticksPerSecond = beatsPerSecond * ticksPerBeat;
  return tick / ticksPerSecond;
}

/**
 * Converts sample to tick.
 */
export function sampleToTick(
  sample: number,
  tempo: number,
  sampleRate: number,
  ticksPerBeat: number
): Tick {
  const samplesPerTick = calculateSamplesPerTick(tempo, sampleRate, ticksPerBeat);
  return asTick(Math.floor(sample / samplesPerTick));
}

// ============================================================================
// CARD STATE MANAGEMENT
// ============================================================================

/**
 * Manages card states during simulation.
 */
export class CardStateManager {
  private states = new Map<string, CardState<unknown>>();

  /**
   * Gets state for a card, initializing if needed.
   */
  getState(cardId: string, initialState?: CardState<unknown>): CardState<unknown> | undefined {
    if (!this.states.has(cardId) && initialState) {
      this.states.set(cardId, initialState);
    }
    return this.states.get(cardId);
  }

  /**
   * Updates state for a card.
   */
  setState(cardId: string, state: CardState<unknown>): void {
    this.states.set(cardId, state);
  }

  /**
   * Clears all states.
   */
  clear(): void {
    this.states.clear();
  }

  /**
   * Gets all card IDs with state.
   */
  getCardIds(): string[] {
    return [...this.states.keys()];
  }
}

// ============================================================================
// EVENT COLLECTION
// ============================================================================

/**
 * Collects events during simulation.
 */
export class EventCollector {
  private events: FlattenedEvent[] = [];
  private warnings: FlattenWarning[] = [];
  private eventsByType: Record<string, number> = {};
  private activeNotes = new Map<string, FlattenedEvent>(); // key: "note-channel"
  private peakConcurrentNotes = 0;
  private maxEvents: number;

  constructor(maxEvents: number = 100000) {
    this.maxEvents = maxEvents;
  }

  /**
   * Adds an event to the collection.
   */
  addEvent(event: FlattenedEvent): boolean {
    if (this.events.length >= this.maxEvents) {
      this.warnings.push({
        type: 'overflow',
        message: `Maximum event count (${this.maxEvents}) reached`,
        tick: event.tick,
      });
      return false;
    }

    this.events.push(event);
    this.eventsByType[event.type] = (this.eventsByType[event.type] ?? 0) + 1;

    // Track active notes for statistics
    if (event.type === 'noteOn') {
      const key = `${event.note ?? 0}-${event.channel ?? 0}`;
      this.activeNotes.set(key, event);
      this.peakConcurrentNotes = Math.max(this.peakConcurrentNotes, this.activeNotes.size);
    } else if (event.type === 'noteOff') {
      const key = `${event.note ?? 0}-${event.channel ?? 0}`;
      this.activeNotes.delete(key);
    }

    return true;
  }

  /**
   * Adds a warning.
   */
  addWarning(warning: FlattenWarning): void {
    this.warnings.push(warning);
  }

  /**
   * Gets all collected events.
   */
  getEvents(): readonly FlattenedEvent[] {
    return this.events;
  }

  /**
   * Gets sorted events by tick.
   */
  getSortedEvents(): readonly FlattenedEvent[] {
    return [...this.events].sort((a, b) => {
      if (a.tick !== b.tick) return a.tick - b.tick;
      // Note offs before note ons at same tick
      if (a.type === 'noteOff' && b.type === 'noteOn') return -1;
      if (a.type === 'noteOn' && b.type === 'noteOff') return 1;
      return 0;
    });
  }

  /**
   * Gets all warnings.
   */
  getWarnings(): readonly FlattenWarning[] {
    return this.warnings;
  }

  /**
   * Gets statistics.
   */
  getStats(): Pick<FlattenStats, 'totalEvents' | 'eventsByType' | 'peakConcurrentNotes'> {
    return {
      totalEvents: this.events.length,
      eventsByType: { ...this.eventsByType },
      peakConcurrentNotes: this.peakConcurrentNotes,
    };
  }

  /**
   * Clears all collected data.
   */
  clear(): void {
    this.events = [];
    this.warnings = [];
    this.eventsByType = {};
    this.activeNotes.clear();
    this.peakConcurrentNotes = 0;
  }
}

// ============================================================================
// CARD PROCESSING SIMULATION
// ============================================================================

/**
 * Creates a CardContext for a specific tick position.
 */
export function createContextForTick(
  tick: Tick,
  config: FlattenConfig,
  playing: boolean = true
): CardContext {
  const samplePosition = tickToSample(tick, config.tempo, config.sampleRate, config.ticksPerBeat);
  const elapsedMs = tickToSeconds(tick, config.tempo, config.ticksPerBeat) * 1000;

  const transport: Transport = {
    playing,
    recording: false,
    tempo: config.tempo,
    timeSignature: config.timeSignature,
    looping: false,
  };

  const engine: EngineRef = {
    sampleRate: config.sampleRate,
    bufferSize: 128,
  };

  return createCardContext(tick, transport, engine, samplePosition, elapsedMs);
}

/**
 * Converts card output to flattened events.
 */
export function cardOutputToEvents(
  output: unknown,
  tick: Tick,
  config: FlattenConfig,
  sourceCardId?: string,
  sourceTrackId?: string
): FlattenedEvent[] {
  const events: FlattenedEvent[] = [];

  if (!output) return events;

  // Handle array of outputs
  if (Array.isArray(output)) {
    for (const item of output) {
      events.push(...cardOutputToEvents(item, tick, config, sourceCardId, sourceTrackId));
    }
    return events;
  }

  // Handle typed output objects
  if (typeof output === 'object') {
    const obj = output as Record<string, unknown>;
    const outputType = obj.type as string;

    // Calculate absolute time values
    const eventTick = obj.tick !== undefined ? asTick(obj.tick as number) : tick;
    const sample = tickToSample(eventTick, config.tempo, config.sampleRate, config.ticksPerBeat);
    const seconds = tickToSeconds(eventTick, config.tempo, config.ticksPerBeat);

    // Helper to build event without undefined properties
    const buildEvent = (base: Partial<FlattenedEvent>): FlattenedEvent => {
      const event: Record<string, unknown> = {
        id: generateEventId(),
        tick: eventTick,
        sample,
        seconds,
      };
      for (const [key, value] of Object.entries(base)) {
        if (value !== undefined) {
          event[key] = value;
        }
      }
      if (config.includeSourceInfo && sourceCardId) {
        event.sourceCardId = sourceCardId;
      }
      if (config.includeSourceInfo && sourceTrackId) {
        event.sourceTrackId = sourceTrackId;
      }
      return event as unknown as FlattenedEvent;
    };

    if (outputType === 'noteOn') {
      events.push(buildEvent({
        type: 'noteOn',
        note: obj.note as number,
        velocity: (obj.velocity as number) ?? 100,
        channel: (obj.channel as number) ?? 0,
      }));
    } else if (outputType === 'noteOff') {
      events.push(buildEvent({
        type: 'noteOff',
        note: obj.note as number,
        channel: (obj.channel as number) ?? 0,
      }));
    } else if (outputType === 'cc' || outputType === 'controlChange') {
      events.push(buildEvent({
        type: 'cc',
        controller: (obj.controller as number) ?? (obj.cc as number),
        value: obj.value as number,
        channel: (obj.channel as number) ?? 0,
      }));
    } else if (outputType === 'trigger') {
      events.push(buildEvent({
        type: 'trigger',
        data: obj.data as Record<string, unknown>,
      }));
    } else if (obj.note !== undefined) {
      // Generic note event without explicit type
      const hasDuration = obj.duration !== undefined;
      events.push(buildEvent({
        type: 'noteOn',
        note: obj.note as number,
        velocity: (obj.velocity as number) ?? 100,
        channel: (obj.channel as number) ?? 0,
        ...(hasDuration ? {
          duration: asTickDuration(obj.duration as number),
          durationSamples: tickToSample(asTick(obj.duration as number), config.tempo, config.sampleRate, config.ticksPerBeat),
          durationSeconds: tickToSeconds(asTick(obj.duration as number), config.tempo, config.ticksPerBeat),
        } : {}),
      }));
    }
  }

  return events;
}

/**
 * Simulates a single card tick-by-tick.
 */
export function simulateCardProcessing(
  card: Card<unknown, unknown>,
  inputEvents: readonly InputEvent[],
  startTick: Tick,
  endTick: Tick,
  config: FlattenConfig,
  stateManager: CardStateManager
): FlattenedEvent[] {
  const events: FlattenedEvent[] = [];
  
  // Get or initialize card state
  let state = stateManager.getState(card.meta.id, card.initialState);

  // Group input events by tick
  const eventsByTick = new Map<number, InputEvent[]>();
  for (const event of inputEvents) {
    const tickNum = event.tick as number;
    if (tickNum >= startTick && tickNum < endTick) {
      const existing = eventsByTick.get(tickNum) ?? [];
      existing.push(event);
      eventsByTick.set(tickNum, existing);
    }
  }

  // Process tick by tick
  for (let tickNum = startTick as number; tickNum < (endTick as number); tickNum += config.tickResolution) {
    const tick = asTick(tickNum);
    const context = createContextForTick(tick, config);
    
    // Get events for this tick
    const tickEvents = eventsByTick.get(tickNum) ?? [];
    
    // Create input for the card (events or empty)
    const input = tickEvents.length > 0 ? tickEvents : [];

    try {
      const result = card.process(input, context, state);
      
      // Update state if returned
      if (result.state) {
        state = result.state;
        stateManager.setState(card.meta.id, state);
      }

      // Convert output to events
      if (result.output) {
        const outputEvents = cardOutputToEvents(
          result.output,
          tick,
          config,
          card.meta.id
        );
        events.push(...outputEvents);
      }
    } catch (error) {
      // Log error but continue processing
      console.warn(`Error processing card ${card.meta.id} at tick ${tick}:`, error);
    }
  }

  return events;
}

// ============================================================================
// CHAIN FLATTENING
// ============================================================================

/**
 * Flattens a chain of cards (series connection).
 * Each card's output becomes the next card's input.
 */
export function flattenCardChain(
  cards: readonly Card<unknown, unknown>[],
  inputEvents: readonly InputEvent[],
  config: Partial<FlattenConfig> = {}
): FlattenResult {
  const startTime = performance.now();
  const fullConfig: FlattenConfig = { ...DEFAULT_FLATTEN_CONFIG, ...config };
  const collector = new EventCollector(fullConfig.maxEvents);
  const stateManager = new CardStateManager();

  try {
    if (cards.length === 0) {
      return {
        events: [],
        stats: {
          totalEvents: 0,
          eventsByType: {},
          ticksProcessed: 0,
          processingTimeMs: performance.now() - startTime,
          cardsProcessed: 0,
          peakConcurrentNotes: 0,
        },
        warnings: [],
        success: true,
      };
    }

    // Process cards in chain
    let currentEvents: InputEvent[] = [...inputEvents];
    
    for (const card of cards) {
      // Process this card
      const outputEvents = simulateCardProcessing(
        card,
        currentEvents,
        fullConfig.startTick,
        fullConfig.endTick,
        fullConfig,
        stateManager
      );

      // Convert output events to input events for next card
      currentEvents = outputEvents.map(evt => {
        const data: Record<string, unknown> = {};
        if (evt.note !== undefined) data.note = evt.note;
        if (evt.velocity !== undefined) data.velocity = evt.velocity;
        if (evt.channel !== undefined) data.channel = evt.channel;
        if (evt.duration !== undefined) data.duration = evt.duration;
        if (evt.controller !== undefined) data.controller = evt.controller;
        if (evt.value !== undefined) data.value = evt.value;
        if (evt.data) Object.assign(data, evt.data);
        return {
          type: evt.type,
          tick: evt.tick,
          data,
        };
      });
    }

    // Collect final events
    for (const evt of currentEvents) {
      const sample = tickToSample(evt.tick, fullConfig.tempo, fullConfig.sampleRate, fullConfig.ticksPerBeat);
      const seconds = tickToSeconds(evt.tick, fullConfig.tempo, fullConfig.ticksPerBeat);
      
      // Build event without undefined properties
      const flatEvent: Record<string, unknown> = {
        id: generateEventId(),
        type: evt.type as FlattenedEventType,
        tick: evt.tick,
        sample,
        seconds,
      };
      if (evt.data.note !== undefined) flatEvent.note = evt.data.note;
      if (evt.data.velocity !== undefined) flatEvent.velocity = evt.data.velocity;
      if (evt.data.channel !== undefined) flatEvent.channel = evt.data.channel;
      if (evt.data.duration !== undefined) flatEvent.duration = evt.data.duration;
      if (evt.data.controller !== undefined) flatEvent.controller = evt.data.controller;
      if (evt.data.value !== undefined) flatEvent.value = evt.data.value;
      
      collector.addEvent(flatEvent as unknown as FlattenedEvent);
    }

    const ticksProcessed = (fullConfig.endTick as number) - (fullConfig.startTick as number);
    const stats = collector.getStats();

    return {
      events: fullConfig.sortEvents ? collector.getSortedEvents() : collector.getEvents(),
      stats: {
        ...stats,
        ticksProcessed,
        processingTimeMs: performance.now() - startTime,
        cardsProcessed: cards.length,
      },
      warnings: collector.getWarnings(),
      success: true,
    };
  } catch (error) {
    return {
      events: [],
      stats: {
        totalEvents: 0,
        eventsByType: {},
        ticksProcessed: 0,
        processingTimeMs: performance.now() - startTime,
        cardsProcessed: 0,
        peakConcurrentNotes: 0,
      },
      warnings: collector.getWarnings(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// GRAPH FLATTENING
// ============================================================================

/**
 * Resolves node dependencies for graph processing order.
 */
function getExecutionOrder(graph: Graph): readonly string[] {
  // Build adjacency list
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  
  for (const node of graph.nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of graph.edges) {
    const currentDegree = inDegree.get(edge.target) ?? 0;
    inDegree.set(edge.target, currentDegree + 1);
    const adj = adjacency.get(edge.source) ?? [];
    adj.push(edge.target);
    adjacency.set(edge.source, adj);
  }

  // Topological sort using Kahn's algorithm
  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return order;
}

/**
 * Flattens a graph of cards.
 * Processes nodes in topological order, routing events between connected nodes.
 */
export function flattenGraph(
  graph: Graph,
  inputEvents: readonly InputEvent[],
  config: Partial<FlattenConfig> = {}
): FlattenResult {
  const startTime = performance.now();
  const fullConfig: FlattenConfig = { ...DEFAULT_FLATTEN_CONFIG, ...config };
  const collector = new EventCollector(fullConfig.maxEvents);
  const stateManager = new CardStateManager();

  try {
    if (graph.nodes.length === 0) {
      return {
        events: [],
        stats: {
          totalEvents: 0,
          eventsByType: {},
          ticksProcessed: 0,
          processingTimeMs: performance.now() - startTime,
          cardsProcessed: 0,
          peakConcurrentNotes: 0,
        },
        warnings: [],
        success: true,
      };
    }

    // Get execution order
    const executionOrder = getExecutionOrder(graph);
    
    // Map node IDs to nodes
    const nodeMap = new Map<string, GraphNode>();
    for (const node of graph.nodes) {
      nodeMap.set(node.id, node);
    }

    // Track events per node output
    const nodeOutputs = new Map<string, InputEvent[]>();
    
    // Find input nodes (no incoming edges)
    const inputNodes = new Set<string>();
    const hasIncoming = new Set<string>();
    for (const edge of graph.edges) {
      hasIncoming.add(edge.target);
    }
    for (const node of graph.nodes) {
      if (!hasIncoming.has(node.id)) {
        inputNodes.add(node.id);
      }
    }

    // Process each node in order
    for (const nodeId of executionOrder) {
      const node = nodeMap.get(nodeId);
      if (!node || !node.card) {
        collector.addWarning({
          type: 'missing_card',
          message: `Node ${nodeId} has no card instance`,
        });
        continue;
      }

      // Gather inputs from connected nodes
      let nodeInputEvents: InputEvent[] = [];
      
      if (inputNodes.has(nodeId)) {
        // Input node gets external input events
        nodeInputEvents = [...inputEvents];
      }
      
      // Add events from connected source nodes
      for (const edge of graph.edges) {
        if (edge.target === nodeId) {
          const sourceEvents = nodeOutputs.get(edge.source) ?? [];
          nodeInputEvents.push(...sourceEvents);
        }
      }

      // Process the node
      const outputEvents = simulateCardProcessing(
        node.card,
        nodeInputEvents,
        fullConfig.startTick,
        fullConfig.endTick,
        fullConfig,
        stateManager
      );

      // Store outputs for downstream nodes
      const outputAsInputs: InputEvent[] = outputEvents.map(evt => ({
        type: evt.type,
        tick: evt.tick,
        data: {
          note: evt.note,
          velocity: evt.velocity,
          channel: evt.channel,
          duration: evt.duration,
          controller: evt.controller,
          value: evt.value,
          ...evt.data,
        },
      }));
      nodeOutputs.set(nodeId, outputAsInputs);

      // Check if this is an output node (no outgoing edges)
      const hasOutgoing = graph.edges.some(e => e.source === nodeId);
      if (!hasOutgoing) {
        // Collect output events from terminal nodes
        for (const evt of outputEvents) {
          collector.addEvent(evt);
        }
      }
    }

    const ticksProcessed = (fullConfig.endTick as number) - (fullConfig.startTick as number);
    const stats = collector.getStats();

    return {
      events: fullConfig.sortEvents ? collector.getSortedEvents() : collector.getEvents(),
      stats: {
        ...stats,
        ticksProcessed,
        processingTimeMs: performance.now() - startTime,
        cardsProcessed: executionOrder.length,
      },
      warnings: collector.getWarnings(),
      success: true,
    };
  } catch (error) {
    return {
      events: [],
      stats: {
        totalEvents: 0,
        eventsByType: {},
        ticksProcessed: 0,
        processingTimeMs: performance.now() - startTime,
        cardsProcessed: 0,
        peakConcurrentNotes: 0,
      },
      warnings: collector.getWarnings(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// TIMELINE CONVERSION
// ============================================================================

/**
 * Converts relative events to absolute timeline with proper time values.
 */
export function flattenToTimeline(
  events: readonly InputEvent[],
  config: Partial<FlattenConfig> = {}
): FlattenResult {
  const startTime = performance.now();
  const fullConfig: FlattenConfig = { ...DEFAULT_FLATTEN_CONFIG, ...config };
  const collector = new EventCollector(fullConfig.maxEvents);

  try {
    for (const evt of events) {
      // Skip events outside the range
      if (evt.tick < fullConfig.startTick || evt.tick >= fullConfig.endTick) {
        continue;
      }

      const sample = tickToSample(evt.tick, fullConfig.tempo, fullConfig.sampleRate, fullConfig.ticksPerBeat);
      const seconds = tickToSeconds(evt.tick, fullConfig.tempo, fullConfig.ticksPerBeat);

      // Build event without undefined properties
      const flatEvent: Record<string, unknown> = {
        id: generateEventId(),
        type: (evt.type as FlattenedEventType) || 'custom',
        tick: evt.tick,
        sample,
        seconds,
      };
      
      if (evt.data.note !== undefined) flatEvent.note = evt.data.note;
      if (evt.data.velocity !== undefined) flatEvent.velocity = evt.data.velocity;
      if (evt.data.channel !== undefined) flatEvent.channel = evt.data.channel;
      if (evt.data.duration !== undefined) {
        flatEvent.duration = evt.data.duration;
        flatEvent.durationSamples = tickToSample(asTick(evt.data.duration as number), fullConfig.tempo, fullConfig.sampleRate, fullConfig.ticksPerBeat);
        flatEvent.durationSeconds = tickToSeconds(asTick(evt.data.duration as number), fullConfig.tempo, fullConfig.ticksPerBeat);
      }
      if (evt.data.controller !== undefined) flatEvent.controller = evt.data.controller;
      if (evt.data.value !== undefined) flatEvent.value = evt.data.value;
      flatEvent.data = evt.data;

      collector.addEvent(flatEvent as unknown as FlattenedEvent);
    }

    const ticksProcessed = (fullConfig.endTick as number) - (fullConfig.startTick as number);
    const stats = collector.getStats();

    return {
      events: fullConfig.sortEvents ? collector.getSortedEvents() : collector.getEvents(),
      stats: {
        ...stats,
        ticksProcessed,
        processingTimeMs: performance.now() - startTime,
        cardsProcessed: 0,
      },
      warnings: collector.getWarnings(),
      success: true,
    };
  } catch (error) {
    return {
      events: [],
      stats: {
        totalEvents: 0,
        eventsByType: {},
        ticksProcessed: 0,
        processingTimeMs: performance.now() - startTime,
        cardsProcessed: 0,
        peakConcurrentNotes: 0,
      },
      warnings: collector.getWarnings(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// TRACK FLATTENING
// ============================================================================

/**
 * Flattens a single track's card chain.
 */
export function flattenTrack(
  track: TrackDefinition,
  config: Partial<FlattenConfig> = {}
): FlattenResult {
  if (track.muted) {
    return {
      events: [],
      stats: {
        totalEvents: 0,
        eventsByType: {},
        ticksProcessed: 0,
        processingTimeMs: 0,
        cardsProcessed: 0,
        peakConcurrentNotes: 0,
      },
      warnings: [],
      success: true,
    };
  }

  const inputEvents = track.inputEvents ?? [];
  const result = flattenCardChain(track.cards, inputEvents, config);

  // Add track ID to all events
  const eventsWithTrack: FlattenedEvent[] = result.events.map(evt => ({
    ...evt,
    sourceTrackId: track.id,
  }));

  return {
    ...result,
    events: eventsWithTrack,
  };
}

// ============================================================================
// SESSION/EXPORT INTEGRATION
// ============================================================================

/**
 * Prepares a session for export by flattening all tracks.
 */
export function prepareForExport(
  session: SessionDefinition,
  config: Partial<FlattenConfig> = {}
): FlattenResult {
  const startTime = performance.now();
  const fullConfig: FlattenConfig = {
    ...DEFAULT_FLATTEN_CONFIG,
    tempo: session.tempo,
    timeSignature: session.timeSignature,
    ...config,
  };

  const collector = new EventCollector(fullConfig.maxEvents);
  const allWarnings: FlattenWarning[] = [];
  let totalCardsProcessed = 0;

  // Check for solo tracks
  const hasSolo = session.tracks.some(t => t.solo);
  
  // Process each track
  for (const track of session.tracks) {
    // Skip muted tracks, or non-solo tracks when solo is active
    if (track.muted) continue;
    if (hasSolo && !track.solo) continue;

    const trackResult = flattenTrack(track, fullConfig);
    
    // Collect events
    for (const evt of trackResult.events) {
      collector.addEvent(evt);
    }

    // Collect warnings
    allWarnings.push(...trackResult.warnings);
    totalCardsProcessed += trackResult.stats.cardsProcessed;
  }

  const ticksProcessed = (fullConfig.endTick as number) - (fullConfig.startTick as number);
  const stats = collector.getStats();

  return {
    events: fullConfig.sortEvents ? collector.getSortedEvents() : collector.getEvents(),
    stats: {
      ...stats,
      ticksProcessed,
      processingTimeMs: performance.now() - startTime,
      cardsProcessed: totalCardsProcessed,
    },
    warnings: allWarnings,
    success: true,
  };
}

// ============================================================================
// NOTE EVENT HELPERS
// ============================================================================

/**
 * Creates a note on event.
 */
export function createNoteOnEvent(
  tick: Tick,
  note: number,
  velocity: number,
  config: FlattenConfig,
  channel: number = 0
): FlattenedEvent {
  return {
    id: generateEventId(),
    type: 'noteOn',
    tick,
    sample: tickToSample(tick, config.tempo, config.sampleRate, config.ticksPerBeat),
    seconds: tickToSeconds(tick, config.tempo, config.ticksPerBeat),
    note,
    velocity,
    channel,
  };
}

/**
 * Creates a note off event.
 */
export function createNoteOffEvent(
  tick: Tick,
  note: number,
  config: FlattenConfig,
  channel: number = 0
): FlattenedEvent {
  return {
    id: generateEventId(),
    type: 'noteOff',
    tick,
    sample: tickToSample(tick, config.tempo, config.sampleRate, config.ticksPerBeat),
    seconds: tickToSeconds(tick, config.tempo, config.ticksPerBeat),
    note,
    velocity: 0,
    channel,
  };
}

/**
 * Generates note on/off pairs from notes with durations.
 */
export function expandNoteDurations(
  events: readonly FlattenedEvent[],
  config: FlattenConfig
): FlattenedEvent[] {
  const expanded: FlattenedEvent[] = [];

  for (const evt of events) {
    if (evt.type === 'noteOn' && evt.duration !== undefined) {
      // Add the note on
      expanded.push(evt);
      
      // Add the corresponding note off
      const offTick = asTick((evt.tick as number) + (evt.duration as number));
      expanded.push(createNoteOffEvent(offTick, evt.note!, config, evt.channel ?? 0));
    } else {
      expanded.push(evt);
    }
  }

  // Sort by time
  return expanded.sort((a, b) => {
    if (a.tick !== b.tick) return (a.tick as number) - (b.tick as number);
    // Note offs before note ons at same tick
    if (a.type === 'noteOff' && b.type === 'noteOn') return -1;
    if (a.type === 'noteOn' && b.type === 'noteOff') return 1;
    return 0;
  });
}
