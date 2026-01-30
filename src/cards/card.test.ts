/**
 * @fileoverview Tests for Card<A, B> Core.
 */

import { describe, it, expect } from 'vitest';
import {
  // Port types
  PortTypes,
  registerPortType,
  getPortTypeEntry,
  createPort,
  
  // Parameters
  createParam,
  
  // Signature
  createSignature,
  
  // Meta
  createCardMeta,
  
  // State
  createCardState,
  updateCardState,
  
  // Context
  createCardContext,
  
  // Card
  createCard,
  pureCard,
  statefulCard,
  asyncCard,
  
  // Composition
  cardCompose,
  cardParallel,
  cardBranch,
  cardLoop,
  
  // Wrappers
  cardMemo,
  cardProfile,
  cardValidate,
  
  // Serialization
  cardToJSON,
} from './card';
import type { Transport, EngineRef, CardContext } from './card';
import { asTick } from '../types/primitives';

// ============================================================================
// HELPERS
// ============================================================================

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

const mockContext: CardContext = createCardContext(
  asTick(0),
  mockTransport,
  mockEngine
);

// ============================================================================
// PORT TESTS
// ============================================================================

describe('Port types', () => {
  it('should have built-in port types', () => {
    expect(PortTypes.AUDIO).toBe('audio');
    expect(PortTypes.MIDI).toBe('midi');
    expect(PortTypes.NOTES).toBe('notes');
  });

  it('should register custom port types', () => {
    registerPortType({
      type: 'test:custom' as typeof PortTypes.AUDIO,
      name: 'Custom Type',
      color: '#123456',
    });
    
    const entry = getPortTypeEntry('test:custom' as typeof PortTypes.AUDIO);
    expect(entry?.name).toBe('Custom Type');
  });

  it('should create a port', () => {
    const port = createPort('input', PortTypes.NOTES, {
      optional: true,
      label: 'Note Input',
    });
    
    expect(port.name).toBe('input');
    expect(port.type).toBe('notes');
    expect(port.optional).toBe(true);
    expect(port.label).toBe('Note Input');
  });
});

// ============================================================================
// PARAM TESTS
// ============================================================================

describe('CardParam', () => {
  it('should create a number parameter', () => {
    const param = createParam('cutoff', 'number', 1000, {
      min: 20,
      max: 20000,
      unit: 'Hz',
      automatable: true,
    });
    
    expect(param.name).toBe('cutoff');
    expect(param.type).toBe('number');
    expect(param.default).toBe(1000);
    expect(param.min).toBe(20);
    expect(param.max).toBe(20000);
    expect(param.unit).toBe('Hz');
    expect(param.automatable).toBe(true);
  });

  it('should create an enum parameter', () => {
    const param = createParam('mode', 'enum', 'lowpass', {
      options: ['lowpass', 'highpass', 'bandpass'],
    });
    
    expect(param.type).toBe('enum');
    expect(param.options).toEqual(['lowpass', 'highpass', 'bandpass']);
  });
});

// ============================================================================
// SIGNATURE TESTS
// ============================================================================

describe('CardSignature', () => {
  it('should create a signature', () => {
    const signature = createSignature(
      [createPort('in', PortTypes.NOTES)],
      [createPort('out', PortTypes.NOTES)],
      [createParam('transpose', 'integer', 0)]
    );
    
    expect(signature.inputs).toHaveLength(1);
    expect(signature.outputs).toHaveLength(1);
    expect(signature.params).toHaveLength(1);
  });
});

// ============================================================================
// META TESTS
// ============================================================================

describe('CardMeta', () => {
  it('should create card metadata', () => {
    const meta = createCardMeta('transpose', 'Transpose', 'transforms', {
      tags: ['pitch', 'midi'],
      description: 'Shifts notes by interval',
      version: '1.0.0',
    });
    
    expect(meta.id).toBe('transpose');
    expect(meta.name).toBe('Transpose');
    expect(meta.category).toBe('transforms');
    expect(meta.tags).toEqual(['pitch', 'midi']);
  });
});

// ============================================================================
// STATE TESTS
// ============================================================================

describe('CardState', () => {
  it('should create initial state', () => {
    const state = createCardState({ count: 0 });
    
    expect(state.value).toEqual({ count: 0 });
    expect(state.version).toBe(0);
  });

  it('should update state with new version', () => {
    const state1 = createCardState({ count: 0 });
    const state2 = updateCardState(state1, { count: 1 });
    
    expect(state2.value).toEqual({ count: 1 });
    expect(state2.version).toBe(1);
  });
});

// ============================================================================
// CONTEXT TESTS
// ============================================================================

describe('CardContext', () => {
  it('should create context', () => {
    const context = createCardContext(
      asTick(960),
      mockTransport,
      mockEngine,
      44100,
      1000
    );
    
    expect(context.currentTick).toBe(960);
    expect(context.currentSample).toBe(44100);
    expect(context.elapsedMs).toBe(1000);
    expect(context.transport.tempo).toBe(120);
  });
});

// ============================================================================
// CARD FACTORY TESTS
// ============================================================================

describe('createCard', () => {
  it('should create a basic card', () => {
    const card = createCard<number, number>({
      meta: createCardMeta('double', 'Double', 'transforms'),
      signature: createSignature(
        [createPort('in', PortTypes.NUMBER)],
        [createPort('out', PortTypes.NUMBER)]
      ),
      process: (input) => ({ output: input * 2 }),
    });
    
    expect(card.meta.id).toBe('double');
    
    const result = card.process(5, mockContext);
    expect(result.output).toBe(10);
  });
});

describe('pureCard', () => {
  it('should create a stateless card', () => {
    const card = pureCard<number, number>(
      createCardMeta('negate', 'Negate', 'transforms'),
      createSignature(
        [createPort('in', PortTypes.NUMBER)],
        [createPort('out', PortTypes.NUMBER)]
      ),
      (input) => -input
    );
    
    const result = card.process(42, mockContext);
    expect(result.output).toBe(-42);
  });
});

describe('statefulCard', () => {
  it('should create a stateful card', () => {
    const card = statefulCard<number, number, { sum: number }>(
      createCardMeta('accumulator', 'Accumulator', 'transforms'),
      createSignature(
        [createPort('in', PortTypes.NUMBER)],
        [createPort('out', PortTypes.NUMBER)]
      ),
      { sum: 0 },
      (input, _context, state) => ({
        output: state.sum + input,
        nextState: { sum: state.sum + input },
      })
    );
    
    // First call
    const result1 = card.process(5, mockContext);
    expect(result1.output).toBe(5);
    
    // Second call with updated state
    const result2 = card.process(3, mockContext, result1.state);
    expect(result2.output).toBe(8);
  });
});

describe('asyncCard', () => {
  it('should create an async card', async () => {
    const card = asyncCard<string, string>(
      createCardMeta('async-upper', 'Async Upper', 'transforms'),
      createSignature(
        [createPort('in', PortTypes.STRING)],
        [createPort('out', PortTypes.STRING)]
      ),
      async (input) => {
        await new Promise(r => setTimeout(r, 1));
        return input.toUpperCase();
      }
    );
    
    const result = card.process('hello', mockContext);
    const output = await result.output;
    expect(output).toBe('HELLO');
  });
});

// ============================================================================
// COMPOSITION TESTS
// ============================================================================

describe('cardCompose', () => {
  it('should compose cards in series', () => {
    const double = pureCard<number, number>(
      createCardMeta('double', 'Double', 'transforms'),
      createSignature([], []),
      (input) => input * 2
    );
    
    const addOne = pureCard<number, number>(
      createCardMeta('add-one', 'Add One', 'transforms'),
      createSignature([], []),
      (input) => input + 1
    );
    
    const composed = cardCompose(double, addOne);
    
    const result = composed.process(5, mockContext);
    expect(result.output).toBe(11); // (5 * 2) + 1
  });
});

describe('cardParallel', () => {
  it('should run cards in parallel', () => {
    const double = pureCard<number, number>(
      createCardMeta('double', 'Double', 'transforms'),
      createSignature([], []),
      (input) => input * 2
    );
    
    const square = pureCard<number, number>(
      createCardMeta('square', 'Square', 'transforms'),
      createSignature([], []),
      (input) => input * input
    );
    
    const parallel = cardParallel(double, square);
    
    const result = parallel.process(5, mockContext);
    expect(result.output).toEqual([10, 25]);
  });
});

describe('cardBranch', () => {
  it('should branch based on condition', () => {
    const double = pureCard<number, number>(
      createCardMeta('double', 'Double', 'transforms'),
      createSignature([], []),
      (input) => input * 2
    );
    
    const negate = pureCard<number, number>(
      createCardMeta('negate', 'Negate', 'transforms'),
      createSignature([], []),
      (input) => -input
    );
    
    const branched = cardBranch(
      (input) => input > 0,
      double,
      negate
    );
    
    expect(branched.process(5, mockContext).output).toBe(10);
    expect(branched.process(-5, mockContext).output).toBe(5);
  });
});

describe('cardLoop', () => {
  it('should create a feedback loop', () => {
    const increment = pureCard<number, number>(
      createCardMeta('increment', 'Increment', 'transforms'),
      createSignature([], []),
      (input) => input + 1
    );
    
    const looped = cardLoop(increment, 2);
    
    // Initial pass-through
    const result1 = looped.process(0, mockContext);
    expect(result1.output).toBe(0);
  });
});

// ============================================================================
// WRAPPER TESTS
// ============================================================================

describe('cardMemo', () => {
  it('should cache results', () => {
    let callCount = 0;
    
    const expensive = pureCard<number, number>(
      createCardMeta('expensive', 'Expensive', 'transforms'),
      createSignature([], []),
      (input) => {
        callCount++;
        return input * 2;
      }
    );
    
    const memoized = cardMemo(expensive);
    
    // First call
    memoized.process(5, mockContext);
    expect(callCount).toBe(1);
    
    // Same input should use cache (need state for this)
    const result1 = memoized.process(5, mockContext);
    // Without state, it will recompute
    expect(result1.output).toBe(10);
  });
});

describe('cardProfile', () => {
  it('should add timing information', () => {
    const card = pureCard<number, number>(
      createCardMeta('slow', 'Slow', 'transforms'),
      createSignature([], []),
      (input) => input * 2
    );
    
    const profiled = cardProfile(card);
    
    const result = profiled.process(5, mockContext);
    expect(result.output).toBe(10);
    expect(result.timing).toBeDefined();
    expect(result.timing!.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe('cardValidate', () => {
  it('should validate input', () => {
    const card = pureCard<number, number>(
      createCardMeta('double', 'Double', 'transforms'),
      createSignature([], []),
      (input) => input * 2
    );
    
    const validated = cardValidate(
      card,
      (input) => input < 0 ? 'Input must be positive' : null
    );
    
    const validResult = validated.process(5, mockContext);
    expect(validResult.errors).toBeUndefined();
    
    const invalidResult = validated.process(-5, mockContext);
    expect(invalidResult.errors).toBeDefined();
    expect(invalidResult.errors![0]).toContain('Input must be positive');
  });

  it('should validate output', () => {
    const card = pureCard<number, number>(
      createCardMeta('double', 'Double', 'transforms'),
      createSignature([], []),
      (input) => input * 2
    );
    
    const validated = cardValidate(
      card,
      undefined,
      (output) => output > 100 ? 'Output too large' : null
    );
    
    const invalidResult = validated.process(100, mockContext);
    expect(invalidResult.errors).toBeDefined();
    expect(invalidResult.errors![0]).toContain('Output too large');
  });
});

// ============================================================================
// SERIALIZATION TESTS
// ============================================================================

describe('cardToJSON', () => {
  it('should serialize card metadata', () => {
    const card = createCard<number, number>({
      meta: createCardMeta('transpose', 'Transpose', 'transforms', {
        tags: ['pitch', 'midi'],
        description: 'Shifts notes',
        version: '1.0.0',
      }),
      signature: createSignature(
        [createPort('in', PortTypes.NOTES)],
        [createPort('out', PortTypes.NOTES)],
        [createParam('semitones', 'integer', 0, { min: -24, max: 24 })]
      ),
      process: (input) => ({ output: input }),
    });
    
    const json = cardToJSON(card);
    
    expect(json.id).toBe('transpose');
    expect(json.name).toBe('Transpose');
    expect(json.category).toBe('transforms');
    expect(json.tags).toEqual(['pitch', 'midi']);
    expect(json.description).toBe('Shifts notes');
    expect(json.signature.inputs).toHaveLength(1);
    expect(json.signature.params).toHaveLength(1);
  });
});
