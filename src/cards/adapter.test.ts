/**
 * @fileoverview Tests for Adapter System.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAdapter,
  registerAdapter,
  findAdapter,
  findAdapterPath,
  adapterCost,
  insertAdapter,
  autoInsertAdapters,
  suggestAdapters,
  getAdapterRegistry,
  resetAdapterRegistry,
  registerBuiltInAdapters,
  PatternToEvents,
  EventsToAudio,
  AudioToEvents,
  MIDIToEvents,
  EventsToMIDI,
  GestureToEvents,
  ControlToEvents,
  NoteToChord,
  ChordToNotes,
  ScoreToPattern,
  PatternToScore,
} from './adapter';
import { createStack } from './stack';
import {
  pureCard,
  createCardMeta,
  createSignature,
  createPort,
  PortTypes,
  createCardContext,
} from './card';
import type { Transport, EngineRef } from './card';
import { asTick } from '../types/primitives';

// ============================================================================
// TEST SETUP
// ============================================================================

beforeEach(() => {
  resetAdapterRegistry();
});

const mockTransport: Transport = {
  playing: true,
  recording: false,
  tempo: 120,
  timeSignature: [4, 4],
  looping: false,
};

const mockEngine: EngineRef = {
  sampleRate: 44100,
  bufferSize: 256,
};

const mockContext = createCardContext(asTick(0), mockTransport, mockEngine);

// ============================================================================
// FACTORY TESTS
// ============================================================================

describe('createAdapter', () => {
  it('should create an adapter', () => {
    const adapter = createAdapter<number, string>({
      id: 'num-to-str',
      name: 'Number to String',
      sourceType: 'number',
      targetType: 'string',
      convert: (n) => n.toString(),
    });
    
    expect(adapter.sourceType).toBe('number');
    expect(adapter.targetType).toBe('string');
    expect(adapter.cost).toBe(1);
    expect(adapter.lossless).toBe(false);
  });

  it('should apply conversion', () => {
    const adapter = createAdapter<number, number>({
      id: 'double',
      name: 'Double',
      sourceType: 'number',
      targetType: 'number',
      lossless: true,
      convert: (n) => n * 2,
    });
    
    const result = adapter.process(5, mockContext);
    expect(result.output).toBe(10);
  });

  it('should set custom cost', () => {
    const adapter = createAdapter({
      id: 'expensive',
      name: 'Expensive',
      sourceType: 'A',
      targetType: 'B',
      cost: 100,
      convert: (x) => x,
    });
    
    expect(adapter.cost).toBe(100);
  });
});

// ============================================================================
// REGISTRY TESTS
// ============================================================================

describe('AdapterRegistry', () => {
  it('should register and find adapter', () => {
    const adapter = createAdapter({
      id: 'test',
      name: 'Test',
      sourceType: 'A',
      targetType: 'B',
      convert: (x) => x,
    });
    
    registerAdapter(adapter);
    const found = findAdapter('A', 'B');
    
    expect(found).toBeDefined();
    expect(found!.meta.id).toBe('test');
  });

  it('should return undefined for missing adapter', () => {
    const found = findAdapter('X', 'Y');
    expect(found).toBeUndefined();
  });

  it('should list all adapters', () => {
    const adapter1 = createAdapter({
      id: 'a1',
      name: 'A1',
      sourceType: 'A',
      targetType: 'B',
      convert: (x) => x,
    });
    const adapter2 = createAdapter({
      id: 'a2',
      name: 'A2',
      sourceType: 'B',
      targetType: 'C',
      convert: (x) => x,
    });
    
    registerAdapter(adapter1);
    registerAdapter(adapter2);
    
    const all = getAdapterRegistry().list();
    expect(all).toHaveLength(2);
  });

  it('should list by category', () => {
    const inputAdapter = createAdapter({
      id: 'input',
      name: 'Input',
      sourceType: 'Raw',
      targetType: 'Processed',
      category: 'input',
      convert: (x) => x,
    });
    const outputAdapter = createAdapter({
      id: 'output',
      name: 'Output',
      sourceType: 'Processed',
      targetType: 'Final',
      category: 'output',
      convert: (x) => x,
    });
    
    registerAdapter(inputAdapter);
    registerAdapter(outputAdapter);
    
    const inputs = getAdapterRegistry().listByCategory('input');
    expect(inputs).toHaveLength(1);
    expect(inputs[0]!.meta.id).toBe('input');
  });
});

// ============================================================================
// PATH FINDING TESTS
// ============================================================================

describe('findAdapterPath', () => {
  it('should find direct path', () => {
    const adapter = createAdapter({
      id: 'direct',
      name: 'Direct',
      sourceType: 'A',
      targetType: 'B',
      convert: (x) => x,
    });
    
    registerAdapter(adapter);
    const path = findAdapterPath('A', 'B');
    
    expect(path).not.toBeNull();
    expect(path!.adapters).toHaveLength(1);
    expect(path!.adapters[0]!.meta.id).toBe('direct');
  });

  it('should find multi-hop path', () => {
    const a2b = createAdapter({
      id: 'a2b',
      name: 'A to B',
      sourceType: 'A',
      targetType: 'B',
      convert: (x) => x,
    });
    const b2c = createAdapter({
      id: 'b2c',
      name: 'B to C',
      sourceType: 'B',
      targetType: 'C',
      convert: (x) => x,
    });
    
    registerAdapter(a2b);
    registerAdapter(b2c);
    
    const path = findAdapterPath('A', 'C');
    
    expect(path).not.toBeNull();
    expect(path!.adapters).toHaveLength(2);
  });

  it('should calculate total cost', () => {
    const a2b = createAdapter({
      id: 'a2b',
      name: 'A to B',
      sourceType: 'A',
      targetType: 'B',
      cost: 5,
      convert: (x) => x,
    });
    const b2c = createAdapter({
      id: 'b2c',
      name: 'B to C',
      sourceType: 'B',
      targetType: 'C',
      cost: 3,
      convert: (x) => x,
    });
    
    registerAdapter(a2b);
    registerAdapter(b2c);
    
    const path = findAdapterPath('A', 'C');
    expect(path!.totalCost).toBe(8);
  });

  it('should track lossless status', () => {
    const lossless = createAdapter({
      id: 'lossless',
      name: 'Lossless',
      sourceType: 'A',
      targetType: 'B',
      lossless: true,
      convert: (x) => x,
    });
    const lossy = createAdapter({
      id: 'lossy',
      name: 'Lossy',
      sourceType: 'B',
      targetType: 'C',
      lossless: false,
      convert: (x) => x,
    });
    
    registerAdapter(lossless);
    registerAdapter(lossy);
    
    const path = findAdapterPath('A', 'C');
    expect(path!.lossless).toBe(false);
  });

  it('should return null for no path', () => {
    const path = findAdapterPath('X', 'Y');
    expect(path).toBeNull();
  });
});

// ============================================================================
// ADAPTER COST TESTS
// ============================================================================

describe('adapterCost', () => {
  it('should return adapter cost', () => {
    const adapter = createAdapter({
      id: 'test',
      name: 'Test',
      sourceType: 'A',
      targetType: 'B',
      cost: 42,
      convert: (x) => x,
    });
    
    expect(adapterCost(adapter)).toBe(42);
  });
});

// ============================================================================
// STACK HELPERS TESTS
// ============================================================================

describe('insertAdapter', () => {
  it('should insert adapter at position', () => {
    const card1 = pureCard<number, number>(
      createCardMeta('c1', 'C1', 'transforms'),
      createSignature(
        [createPort('in', PortTypes.NUMBER)],
        [createPort('out', PortTypes.NUMBER)]
      ),
      (x) => x
    );
    
    const adapter = createAdapter<number, number>({
      id: 'adapter',
      name: 'Adapter',
      sourceType: 'number',
      targetType: 'number',
      convert: (x) => x * 2,
    });
    
    const stack = createStack([card1], 'serial');
    const newStack = insertAdapter(stack, adapter, 1);
    
    expect(newStack.entries).toHaveLength(2);
    expect(newStack.entries[1]!.card.meta.id).toBe('adapter');
  });
});

describe('suggestAdapters', () => {
  it('should suggest direct adapter', () => {
    const adapter = createAdapter({
      id: 'direct',
      name: 'Direct',
      sourceType: 'A',
      targetType: 'B',
      convert: (x) => x,
    });
    
    registerAdapter(adapter);
    const suggestions = suggestAdapters('A', 'B');
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]!.confidence).toBe(1.0);
  });

  it('should return empty for no adapters', () => {
    const suggestions = suggestAdapters('X', 'Y');
    expect(suggestions).toHaveLength(0);
  });
});

// ============================================================================
// BUILT-IN ADAPTERS TESTS
// ============================================================================

describe('Built-in Adapters', () => {
  beforeEach(() => {
    registerBuiltInAdapters();
  });

  it('should register all built-in adapters', () => {
    const registry = getAdapterRegistry();
    const all = registry.list();
    expect(all.length).toBeGreaterThanOrEqual(11);
  });

  it('PatternToEvents should exist', () => {
    expect(PatternToEvents.sourceType).toBe('Pattern');
    expect(PatternToEvents.targetType).toBe('Stream');
  });

  it('EventsToAudio should exist', () => {
    expect(EventsToAudio.sourceType).toBe('Stream');
    expect(EventsToAudio.targetType).toBe('Audio');
  });

  it('AudioToEvents should exist', () => {
    expect(AudioToEvents.sourceType).toBe('Audio');
    expect(AudioToEvents.targetType).toBe('Stream');
  });

  it('MIDIToEvents should exist', () => {
    expect(MIDIToEvents.sourceType).toBe('MIDI');
    expect(MIDIToEvents.targetType).toBe('Stream');
  });

  it('EventsToMIDI should exist', () => {
    expect(EventsToMIDI.sourceType).toBe('Stream');
    expect(EventsToMIDI.targetType).toBe('MIDI');
  });

  it('GestureToEvents should exist', () => {
    expect(GestureToEvents.sourceType).toBe('Gesture');
    expect(GestureToEvents.targetType).toBe('Stream');
  });

  it('ControlToEvents should exist', () => {
    expect(ControlToEvents.sourceType).toBe('Control');
    expect(ControlToEvents.targetType).toBe('Stream');
  });

  it('NoteToChord should exist', () => {
    expect(NoteToChord.sourceType).toBe('Note');
    expect(NoteToChord.targetType).toBe('Chord');
  });

  it('ChordToNotes should convert chord to notes', () => {
    const result = ChordToNotes.process(
      { root: 0, type: 'major' },
      mockContext
    );
    expect(result.output).toHaveLength(3);
  });

  it('ScoreToPattern should exist', () => {
    expect(ScoreToPattern.sourceType).toBe('Score');
    expect(ScoreToPattern.targetType).toBe('Pattern');
  });

  it('PatternToScore should exist', () => {
    expect(PatternToScore.sourceType).toBe('Pattern');
    expect(PatternToScore.targetType).toBe('Score');
  });
});
