/**
 * @fileoverview Tests for Event Flattening/Baking System.
 * 
 * Tests cover:
 * - Time conversion utilities
 * - Card state management
 * - Event collection
 * - Card chain flattening
 * - Graph flattening
 * - Timeline conversion
 * - Track flattening
 * - Session export preparation
 * - Note event helpers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Time conversion
  calculateSamplesPerTick,
  tickToSample,
  tickToSeconds,
  sampleToTick,
  
  // State management
  CardStateManager,
  EventCollector,
  
  // Card processing
  createContextForTick,
  cardOutputToEvents,
  simulateCardProcessing,
  
  // Flattening
  flattenCardChain,
  flattenGraph,
  flattenToTimeline,
  flattenTrack,
  prepareForExport,
  
  // Note helpers
  createNoteOnEvent,
  createNoteOffEvent,
  expandNoteDurations,
  
  // Types & defaults
  DEFAULT_FLATTEN_CONFIG,
  type FlattenConfig,
  type InputEvent,
  type FlattenedEvent,
  type TrackDefinition,
  type SessionDefinition,
} from './event-flattener';

import { asTick, asTickDuration, PPQ } from '../types/primitives';
import type { Card, CardContext, CardResult, CardMeta, CardSignature } from '../cards/card';
import { createCard, createCardMeta, createSignature, createPort, PortTypes } from '../cards/card';
import type { Graph, GraphNode, GraphEdge } from '../cards/graph';
import { createGraph, createGraphNode, createGraphEdge, graphAddNode, graphConnect } from '../cards/graph';

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Creates a test config with defaults.
 */
function testConfig(overrides: Partial<FlattenConfig> = {}): FlattenConfig {
  return {
    ...DEFAULT_FLATTEN_CONFIG,
    startTick: asTick(0),
    endTick: asTick(PPQ * 4), // 1 bar
    ...overrides,
  };
}

/**
 * Creates a simple pass-through card.
 */
function createPassThroughCard(id: string): Card<unknown, unknown> {
  return createCard({
    meta: createCardMeta(id, `PassThrough ${id}`, 'utilities'),
    signature: createSignature(
      [createPort('in', PortTypes.ANY)],
      [createPort('out', PortTypes.ANY)]
    ),
    process: (input: unknown) => ({ output: input }),
  });
}

/**
 * Creates a card that generates a note at a specific tick.
 */
function createNoteGeneratorCard(
  id: string,
  note: number,
  velocity: number,
  tick: number
): Card<unknown, unknown> {
  return createCard({
    meta: createCardMeta(id, `NoteGen ${id}`, 'generators'),
    signature: createSignature(
      [],
      [createPort('out', PortTypes.NOTES)]
    ),
    process: (_input: unknown, context: CardContext) => {
      if (context.currentTick === tick) {
        return {
          output: [{ type: 'noteOn', note, velocity, tick }],
        };
      }
      return { output: [] };
    },
  });
}

/**
 * Creates a transpose card.
 */
function createTransposeCard(id: string, semitones: number): Card<unknown, unknown> {
  return createCard({
    meta: createCardMeta(id, `Transpose ${id}`, 'transforms'),
    signature: createSignature(
      [createPort('in', PortTypes.NOTES)],
      [createPort('out', PortTypes.NOTES)]
    ),
    process: (input: unknown) => {
      const events = input as InputEvent[];
      const transposed = events.map(evt => ({
        ...evt,
        data: {
          ...evt.data,
          note: ((evt.data?.note as number) ?? 60) + semitones,
        },
      }));
      return { output: transposed };
    },
  });
}

/**
 * Creates a stateful counter card.
 */
function createCounterCard(id: string): Card<unknown, unknown> {
  return createCard<unknown, unknown, number>({
    meta: createCardMeta(id, `Counter ${id}`, 'utilities'),
    signature: createSignature([], [createPort('out', PortTypes.NUMBER)]),
    initialState: 0,
    process: (_input: unknown, _context: CardContext, state) => {
      const count = (state?.value ?? 0) + 1;
      return {
        output: { type: 'trigger', count },
        state: { value: count, version: (state?.version ?? 0) + 1 },
      };
    },
  });
}

// ============================================================================
// TIME CONVERSION TESTS
// ============================================================================

describe('Time Conversion', () => {
  describe('calculateSamplesPerTick', () => {
    it('calculates correctly at 120 BPM', () => {
      const samplesPerTick = calculateSamplesPerTick(120, 48000, PPQ);
      // 120 BPM = 2 beats/second, PPQ ticks/beat
      // 48000 samples/second / (2 * PPQ) ticks/second
      expect(samplesPerTick).toBeCloseTo(48000 / (2 * PPQ));
    });

    it('scales with tempo', () => {
      const at120 = calculateSamplesPerTick(120, 48000, PPQ);
      const at60 = calculateSamplesPerTick(60, 48000, PPQ);
      expect(at60).toBeCloseTo(at120 * 2);
    });

    it('scales with sample rate', () => {
      const at48k = calculateSamplesPerTick(120, 48000, PPQ);
      const at96k = calculateSamplesPerTick(120, 96000, PPQ);
      expect(at96k).toBeCloseTo(at48k * 2);
    });
  });

  describe('tickToSample', () => {
    it('converts tick 0 to sample 0', () => {
      const sample = tickToSample(asTick(0), 120, 48000, PPQ);
      expect(sample).toBe(0);
    });

    it('converts one beat to correct sample count', () => {
      // At 120 BPM, one beat = 0.5 seconds = 24000 samples at 48kHz
      const sample = tickToSample(asTick(PPQ), 120, 48000, PPQ);
      expect(sample).toBe(24000);
    });
  });

  describe('tickToSeconds', () => {
    it('converts tick 0 to 0 seconds', () => {
      const seconds = tickToSeconds(asTick(0), 120, PPQ);
      expect(seconds).toBe(0);
    });

    it('converts one beat to 0.5 seconds at 120 BPM', () => {
      const seconds = tickToSeconds(asTick(PPQ), 120, PPQ);
      expect(seconds).toBeCloseTo(0.5);
    });

    it('converts 4 beats to 2 seconds at 120 BPM', () => {
      const seconds = tickToSeconds(asTick(PPQ * 4), 120, PPQ);
      expect(seconds).toBeCloseTo(2);
    });
  });

  describe('sampleToTick', () => {
    it('round-trips with tickToSample', () => {
      const originalTick = asTick(PPQ * 2);
      const sample = tickToSample(originalTick, 120, 48000, PPQ);
      const backToTick = sampleToTick(sample, 120, 48000, PPQ);
      expect(backToTick).toBe(originalTick);
    });
  });
});

// ============================================================================
// CARD STATE MANAGER TESTS
// ============================================================================

describe('CardStateManager', () => {
  let manager: CardStateManager;

  beforeEach(() => {
    manager = new CardStateManager();
  });

  it('returns undefined for uninitialized card', () => {
    const state = manager.getState('unknown-card');
    expect(state).toBeUndefined();
  });

  it('initializes state on first access with initial state', () => {
    const initialState = { value: 42, version: 0 };
    const state = manager.getState('card-1', initialState);
    expect(state).toEqual(initialState);
  });

  it('updates state correctly', () => {
    const initialState = { value: 0, version: 0 };
    manager.getState('card-1', initialState);
    
    const newState = { value: 100, version: 1 };
    manager.setState('card-1', newState);
    
    expect(manager.getState('card-1')).toEqual(newState);
  });

  it('clears all states', () => {
    manager.getState('card-1', { value: 1, version: 0 });
    manager.getState('card-2', { value: 2, version: 0 });
    
    manager.clear();
    
    expect(manager.getState('card-1')).toBeUndefined();
    expect(manager.getState('card-2')).toBeUndefined();
  });

  it('returns card IDs with state', () => {
    manager.getState('card-1', { value: 1, version: 0 });
    manager.getState('card-2', { value: 2, version: 0 });
    
    const ids = manager.getCardIds();
    expect(ids).toContain('card-1');
    expect(ids).toContain('card-2');
    expect(ids).toHaveLength(2);
  });
});

// ============================================================================
// EVENT COLLECTOR TESTS
// ============================================================================

describe('EventCollector', () => {
  let collector: EventCollector;

  beforeEach(() => {
    collector = new EventCollector(100);
  });

  it('collects events', () => {
    const event: FlattenedEvent = {
      id: 'evt-1',
      type: 'noteOn',
      tick: asTick(0),
      sample: 0,
      seconds: 0,
      note: 60,
      velocity: 100,
    };

    const added = collector.addEvent(event);
    expect(added).toBe(true);
    expect(collector.getEvents()).toHaveLength(1);
  });

  it('respects max events limit', () => {
    const smallCollector = new EventCollector(3);
    
    for (let i = 0; i < 5; i++) {
      smallCollector.addEvent({
        id: `evt-${i}`,
        type: 'noteOn',
        tick: asTick(i),
        sample: i * 100,
        seconds: i * 0.01,
        note: 60,
        velocity: 100,
      });
    }

    expect(smallCollector.getEvents()).toHaveLength(3);
    expect(smallCollector.getWarnings()).toHaveLength(2); // 2 overflow warnings
  });

  it('sorts events by tick', () => {
    collector.addEvent({
      id: 'evt-2',
      type: 'noteOn',
      tick: asTick(200),
      sample: 200,
      seconds: 0.02,
      note: 62,
      velocity: 100,
    });
    collector.addEvent({
      id: 'evt-1',
      type: 'noteOn',
      tick: asTick(100),
      sample: 100,
      seconds: 0.01,
      note: 60,
      velocity: 100,
    });
    collector.addEvent({
      id: 'evt-3',
      type: 'noteOn',
      tick: asTick(300),
      sample: 300,
      seconds: 0.03,
      note: 64,
      velocity: 100,
    });

    const sorted = collector.getSortedEvents();
    expect(sorted[0]?.tick).toBe(asTick(100));
    expect(sorted[1]?.tick).toBe(asTick(200));
    expect(sorted[2]?.tick).toBe(asTick(300));
  });

  it('places note offs before note ons at same tick', () => {
    collector.addEvent({
      id: 'evt-on',
      type: 'noteOn',
      tick: asTick(100),
      sample: 100,
      seconds: 0.01,
      note: 60,
      velocity: 100,
    });
    collector.addEvent({
      id: 'evt-off',
      type: 'noteOff',
      tick: asTick(100),
      sample: 100,
      seconds: 0.01,
      note: 60,
      velocity: 0,
    });

    const sorted = collector.getSortedEvents();
    expect(sorted[0]?.type).toBe('noteOff');
    expect(sorted[1]?.type).toBe('noteOn');
  });

  it('tracks statistics correctly', () => {
    collector.addEvent({
      id: 'evt-1',
      type: 'noteOn',
      tick: asTick(0),
      sample: 0,
      seconds: 0,
      note: 60,
      velocity: 100,
    });
    collector.addEvent({
      id: 'evt-2',
      type: 'noteOn',
      tick: asTick(10),
      sample: 10,
      seconds: 0.001,
      note: 62,
      velocity: 100,
    });
    collector.addEvent({
      id: 'evt-3',
      type: 'noteOff',
      tick: asTick(20),
      sample: 20,
      seconds: 0.002,
      note: 60,
      velocity: 0,
    });

    const stats = collector.getStats();
    expect(stats.totalEvents).toBe(3);
    expect(stats.eventsByType['noteOn']).toBe(2);
    expect(stats.eventsByType['noteOff']).toBe(1);
    expect(stats.peakConcurrentNotes).toBe(2);
  });

  it('clears all data', () => {
    collector.addEvent({
      id: 'evt-1',
      type: 'noteOn',
      tick: asTick(0),
      sample: 0,
      seconds: 0,
      note: 60,
      velocity: 100,
    });
    collector.addWarning({ type: 'timing', message: 'test' });

    collector.clear();

    expect(collector.getEvents()).toHaveLength(0);
    expect(collector.getWarnings()).toHaveLength(0);
  });
});

// ============================================================================
// CARD PROCESSING TESTS
// ============================================================================

describe('Card Processing', () => {
  describe('createContextForTick', () => {
    it('creates context with correct tick', () => {
      const config = testConfig();
      const context = createContextForTick(asTick(100), config);
      expect(context.currentTick).toBe(100);
    });

    it('creates context with correct sample position', () => {
      const config = testConfig({ tempo: 120, sampleRate: 48000 });
      const context = createContextForTick(asTick(PPQ), config);
      expect(context.currentSample).toBe(24000); // One beat at 120 BPM
    });

    it('creates context with correct transport', () => {
      const config = testConfig({ tempo: 140, timeSignature: [3, 4] });
      const context = createContextForTick(asTick(0), config);
      expect(context.transport.tempo).toBe(140);
      expect(context.transport.timeSignature).toEqual([3, 4]);
    });
  });

  describe('cardOutputToEvents', () => {
    it('converts noteOn output', () => {
      const config = testConfig();
      const output = { type: 'noteOn', note: 60, velocity: 100 };
      const events = cardOutputToEvents(output, asTick(0), config);
      
      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe('noteOn');
      expect(events[0]?.note).toBe(60);
      expect(events[0]?.velocity).toBe(100);
    });

    it('converts noteOff output', () => {
      const config = testConfig();
      const output = { type: 'noteOff', note: 60 };
      const events = cardOutputToEvents(output, asTick(PPQ), config);
      
      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe('noteOff');
      expect(events[0]?.note).toBe(60);
    });

    it('converts array of outputs', () => {
      const config = testConfig();
      const output = [
        { type: 'noteOn', note: 60, velocity: 100 },
        { type: 'noteOn', note: 64, velocity: 90 },
      ];
      const events = cardOutputToEvents(output, asTick(0), config);
      
      expect(events).toHaveLength(2);
    });

    it('includes source info when configured', () => {
      const config = testConfig({ includeSourceInfo: true });
      const output = { type: 'noteOn', note: 60, velocity: 100 };
      const events = cardOutputToEvents(output, asTick(0), config, 'my-card', 'my-track');
      
      expect(events[0]?.sourceCardId).toBe('my-card');
      expect(events[0]?.sourceTrackId).toBe('my-track');
    });
  });
});

// ============================================================================
// FLATTENING TESTS
// ============================================================================

describe('Flattening', () => {
  describe('flattenCardChain', () => {
    it('returns empty result for empty chain', () => {
      const result = flattenCardChain([], []);
      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(0);
      expect(result.stats.cardsProcessed).toBe(0);
    });

    it('processes single pass-through card', () => {
      const card = createPassThroughCard('pt-1');
      const input: InputEvent[] = [{
        type: 'noteOn',
        tick: asTick(0),
        data: { note: 60, velocity: 100 },
      }];
      
      const result = flattenCardChain([card], input, testConfig());
      expect(result.success).toBe(true);
      expect(result.stats.cardsProcessed).toBe(1);
    });

    it('reports processing time', () => {
      const card = createPassThroughCard('pt-1');
      const result = flattenCardChain([card], [], testConfig());
      expect(result.stats.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('flattenToTimeline', () => {
    it('converts input events to flattened events', () => {
      const inputs: InputEvent[] = [
        { type: 'noteOn', tick: asTick(0), data: { note: 60, velocity: 100 } },
        { type: 'noteOff', tick: asTick(PPQ), data: { note: 60 } },
      ];
      
      const result = flattenToTimeline(inputs, testConfig());
      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(2);
    });

    it('filters events outside time range', () => {
      const inputs: InputEvent[] = [
        { type: 'noteOn', tick: asTick(0), data: { note: 60, velocity: 100 } },
        { type: 'noteOn', tick: asTick(PPQ * 10), data: { note: 62, velocity: 100 } }, // Outside range
      ];
      
      const result = flattenToTimeline(inputs, testConfig({ endTick: asTick(PPQ * 4) }));
      expect(result.events).toHaveLength(1);
    });

    it('calculates absolute time values', () => {
      const inputs: InputEvent[] = [
        { type: 'noteOn', tick: asTick(PPQ), data: { note: 60, velocity: 100 } },
      ];
      
      const result = flattenToTimeline(inputs, testConfig({ tempo: 120, sampleRate: 48000 }));
      const event = result.events[0];
      
      expect(event?.tick).toBe(PPQ);
      expect(event?.sample).toBe(24000); // One beat at 120 BPM
      expect(event?.seconds).toBeCloseTo(0.5);
    });
  });

  describe('flattenTrack', () => {
    it('returns empty for muted track', () => {
      const track: TrackDefinition = {
        id: 'track-1',
        name: 'Test Track',
        cards: [createPassThroughCard('pt-1')],
        muted: true,
        solo: false,
      };
      
      const result = flattenTrack(track, testConfig());
      expect(result.events).toHaveLength(0);
    });

    it('processes unmuted track', () => {
      const track: TrackDefinition = {
        id: 'track-1',
        name: 'Test Track',
        cards: [],
        muted: false,
        solo: false,
        inputEvents: [
          { type: 'noteOn', tick: asTick(0), data: { note: 60, velocity: 100 } },
        ],
      };
      
      const result = flattenTrack(track, testConfig());
      expect(result.success).toBe(true);
    });

    it('adds track ID to events', () => {
      const track: TrackDefinition = {
        id: 'my-track-id',
        name: 'Test Track',
        cards: [],
        muted: false,
        solo: false,
        inputEvents: [
          { type: 'noteOn', tick: asTick(0), data: { note: 60, velocity: 100 } },
        ],
      };
      
      const result = flattenTrack(track, testConfig());
      for (const event of result.events) {
        expect(event.sourceTrackId).toBe('my-track-id');
      }
    });
  });

  describe('prepareForExport', () => {
    it('flattens all tracks in session', () => {
      const session: SessionDefinition = {
        id: 'session-1',
        tracks: [
          {
            id: 'track-1',
            name: 'Track 1',
            cards: [],
            muted: false,
            solo: false,
            inputEvents: [{ type: 'noteOn', tick: asTick(0), data: { note: 60, velocity: 100 } }],
          },
          {
            id: 'track-2',
            name: 'Track 2',
            cards: [],
            muted: false,
            solo: false,
            inputEvents: [{ type: 'noteOn', tick: asTick(PPQ), data: { note: 64, velocity: 90 } }],
          },
        ],
        tempo: 120,
        timeSignature: [4, 4],
      };
      
      const result = prepareForExport(session, testConfig());
      expect(result.success).toBe(true);
    });

    it('respects muted tracks', () => {
      const session: SessionDefinition = {
        id: 'session-1',
        tracks: [
          {
            id: 'track-1',
            name: 'Track 1 (muted)',
            cards: [],
            muted: true,
            solo: false,
            inputEvents: [{ type: 'noteOn', tick: asTick(0), data: { note: 60, velocity: 100 } }],
          },
          {
            id: 'track-2',
            name: 'Track 2',
            cards: [],
            muted: false,
            solo: false,
            inputEvents: [{ type: 'noteOn', tick: asTick(0), data: { note: 64, velocity: 90 } }],
          },
        ],
        tempo: 120,
        timeSignature: [4, 4],
      };
      
      const result = prepareForExport(session, testConfig());
      // Only track-2 events should be present
      const track1Events = result.events.filter(e => e.sourceTrackId === 'track-1');
      const track2Events = result.events.filter(e => e.sourceTrackId === 'track-2');
      expect(track1Events).toHaveLength(0);
    });

    it('respects solo tracks', () => {
      const session: SessionDefinition = {
        id: 'session-1',
        tracks: [
          {
            id: 'track-1',
            name: 'Track 1 (solo)',
            cards: [],
            muted: false,
            solo: true,
            inputEvents: [{ type: 'noteOn', tick: asTick(0), data: { note: 60, velocity: 100 } }],
          },
          {
            id: 'track-2',
            name: 'Track 2 (not solo)',
            cards: [],
            muted: false,
            solo: false,
            inputEvents: [{ type: 'noteOn', tick: asTick(0), data: { note: 64, velocity: 90 } }],
          },
        ],
        tempo: 120,
        timeSignature: [4, 4],
      };
      
      const result = prepareForExport(session, testConfig());
      // Only track-1 (solo) events should be present
      const track1Events = result.events.filter(e => e.sourceTrackId === 'track-1');
      const track2Events = result.events.filter(e => e.sourceTrackId === 'track-2');
      expect(track2Events).toHaveLength(0);
    });

    it('uses session tempo', () => {
      const session: SessionDefinition = {
        id: 'session-1',
        tracks: [],
        tempo: 180,
        timeSignature: [3, 4],
      };
      
      const result = prepareForExport(session);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// NOTE EVENT HELPER TESTS
// ============================================================================

describe('Note Event Helpers', () => {
  describe('createNoteOnEvent', () => {
    it('creates note on with correct values', () => {
      const config = testConfig({ tempo: 120, sampleRate: 48000 });
      const event = createNoteOnEvent(asTick(0), 60, 100, config);
      
      expect(event.type).toBe('noteOn');
      expect(event.note).toBe(60);
      expect(event.velocity).toBe(100);
      expect(event.tick).toBe(0);
    });

    it('calculates sample position correctly', () => {
      const config = testConfig({ tempo: 120, sampleRate: 48000 });
      const event = createNoteOnEvent(asTick(PPQ), 60, 100, config);
      
      expect(event.sample).toBe(24000);
    });
  });

  describe('createNoteOffEvent', () => {
    it('creates note off with velocity 0', () => {
      const config = testConfig();
      const event = createNoteOffEvent(asTick(100), 60, config);
      
      expect(event.type).toBe('noteOff');
      expect(event.velocity).toBe(0);
    });
  });

  describe('expandNoteDurations', () => {
    it('expands note with duration to on/off pair', () => {
      const config = testConfig();
      const noteOn: FlattenedEvent = {
        id: 'evt-1',
        type: 'noteOn',
        tick: asTick(0),
        sample: 0,
        seconds: 0,
        note: 60,
        velocity: 100,
        duration: asTickDuration(PPQ),
      };
      
      const expanded = expandNoteDurations([noteOn], config);
      
      expect(expanded).toHaveLength(2);
      expect(expanded[0]?.type).toBe('noteOn');
      expect(expanded[1]?.type).toBe('noteOff');
      expect(expanded[1]?.tick).toBe(PPQ);
    });

    it('preserves events without duration', () => {
      const config = testConfig();
      const noteOn: FlattenedEvent = {
        id: 'evt-1',
        type: 'noteOn',
        tick: asTick(0),
        sample: 0,
        seconds: 0,
        note: 60,
        velocity: 100,
        // No duration
      };
      
      const expanded = expandNoteDurations([noteOn], config);
      
      expect(expanded).toHaveLength(1);
      expect(expanded[0]?.type).toBe('noteOn');
    });

    it('sorts expanded events by time', () => {
      const config = testConfig();
      const events: FlattenedEvent[] = [
        {
          id: 'evt-2',
          type: 'noteOn',
          tick: asTick(PPQ),
          sample: 1000,
          seconds: 0.1,
          note: 64,
          velocity: 100,
          duration: asTickDuration(PPQ),
        },
        {
          id: 'evt-1',
          type: 'noteOn',
          tick: asTick(0),
          sample: 0,
          seconds: 0,
          note: 60,
          velocity: 100,
          duration: asTickDuration(PPQ * 2),
        },
      ];
      
      const expanded = expandNoteDurations(events, config);
      
      // Should be: noteOn@0, noteOn@PPQ, noteOff@PPQ*2 (for first), noteOff@PPQ*2 (for second)
      expect(expanded[0]?.tick).toBe(0);
      expect(expanded[1]?.tick).toBe(PPQ);
    });
  });
});

// ============================================================================
// GRAPH FLATTENING TESTS
// ============================================================================

describe('Graph Flattening', () => {
  describe('flattenGraph', () => {
    it('returns empty for empty graph', () => {
      const graph = createGraph({ name: 'Empty' });
      const result = flattenGraph(graph, [], testConfig());
      
      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(0);
    });

    it('warns for nodes without cards', () => {
      let graph = createGraph({ name: 'Test' });
      const node: GraphNode = {
        id: 'node-1',
        cardId: 'some-card',
        position: { x: 0, y: 0 },
        // No card instance
      };
      graph = graphAddNode(graph, node);
      
      const result = flattenGraph(graph, [], testConfig());
      expect(result.warnings.some(w => w.type === 'missing_card')).toBe(true);
    });
  });
});
