/**
 * @fileoverview Tests for Stack Composition.
 */

import { describe, it, expect } from 'vitest';
import {
  createStack,
  validateStack,
  inferStackPorts,
  stackInsertCard,
  stackRemoveCard,
  stackReorderCards,
  stackBypassCard,
  stackSoloCard,
  stackToGraph,
  graphToStack,
  stackSnapshot,
  stackRestore,
  stackDiff,
  stackMerge,
  stackToCard,
} from './stack';
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

const mockContext = createCardContext(asTick(0), mockTransport, mockEngine);

const doubleCard = pureCard<number, number>(
  createCardMeta('double', 'Double', 'transforms'),
  createSignature(
    [createPort('in', PortTypes.NUMBER)],
    [createPort('out', PortTypes.NUMBER)]
  ),
  (x) => x * 2
);

const addOneCard = pureCard<number, number>(
  createCardMeta('add-one', 'Add One', 'transforms'),
  createSignature(
    [createPort('in', PortTypes.NUMBER)],
    [createPort('out', PortTypes.NUMBER)]
  ),
  (x) => x + 1
);

const squareCard = pureCard<number, number>(
  createCardMeta('square', 'Square', 'transforms'),
  createSignature(
    [createPort('in', PortTypes.NUMBER)],
    [createPort('out', PortTypes.NUMBER)]
  ),
  (x) => x * x
);

// ============================================================================
// FACTORY TESTS
// ============================================================================

describe('createStack', () => {
  it('should create an empty stack', () => {
    const stack = createStack([], 'serial');
    expect(stack.entries).toHaveLength(0);
    expect(stack.mode).toBe('serial');
  });

  it('should create a stack with cards', () => {
    const stack = createStack([doubleCard, addOneCard], 'serial');
    expect(stack.entries).toHaveLength(2);
    expect(stack.entries[0]!.card).toBe(doubleCard);
  });

  it('should set default entry states', () => {
    const stack = createStack([doubleCard], 'serial');
    const entry = stack.entries[0]!;
    expect(entry.bypassed).toBe(false);
    expect(entry.solo).toBe(false);
    expect(entry.mix).toBe(1);
  });

  it('should apply metadata', () => {
    const stack = createStack([doubleCard], 'serial', { name: 'My Stack' });
    expect(stack.meta.name).toBe('My Stack');
  });
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe('validateStack', () => {
  it('should validate empty stack', () => {
    const stack = createStack([], 'serial');
    const result = validateStack(stack);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should validate serial stack with matching types', () => {
    const stack = createStack([doubleCard, addOneCard], 'serial');
    const result = validateStack(stack);
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// PORT INFERENCE TESTS
// ============================================================================

describe('inferStackPorts', () => {
  it('should infer serial stack ports', () => {
    const stack = createStack([doubleCard, addOneCard], 'serial');
    expect(stack.signature.inputs).toHaveLength(1);
    expect(stack.signature.outputs).toHaveLength(1);
  });

  it('should infer parallel stack ports', () => {
    const stack = createStack([doubleCard, squareCard], 'parallel');
    expect(stack.signature.inputs).toHaveLength(1);
    expect(stack.signature.outputs).toHaveLength(2);
  });
});

// ============================================================================
// OPERATION TESTS
// ============================================================================

describe('stackInsertCard', () => {
  it('should insert card at position', () => {
    const stack = createStack([doubleCard, squareCard], 'serial');
    const newStack = stackInsertCard(stack, addOneCard, 1);
    
    expect(newStack.entries).toHaveLength(3);
    expect(newStack.entries[1]!.card).toBe(addOneCard);
  });

  it('should insert at beginning', () => {
    const stack = createStack([doubleCard], 'serial');
    const newStack = stackInsertCard(stack, addOneCard, 0);
    
    expect(newStack.entries[0]!.card).toBe(addOneCard);
  });
});

describe('stackRemoveCard', () => {
  it('should remove card by entry ID', () => {
    const stack = createStack([doubleCard, addOneCard], 'serial');
    const entryId = stack.entries[0]!.id;
    const newStack = stackRemoveCard(stack, entryId);
    
    expect(newStack.entries).toHaveLength(1);
    expect(newStack.entries[0]!.card).toBe(addOneCard);
  });
});

describe('stackReorderCards', () => {
  it('should reorder cards', () => {
    const stack = createStack([doubleCard, addOneCard, squareCard], 'serial');
    const newStack = stackReorderCards(stack, 0, 2);
    
    expect(newStack.entries[0]!.card).toBe(addOneCard);
    expect(newStack.entries[2]!.card).toBe(doubleCard);
  });
});

describe('stackBypassCard', () => {
  it('should toggle bypass state', () => {
    const stack = createStack([doubleCard], 'serial');
    const entryId = stack.entries[0]!.id;
    
    const bypassed = stackBypassCard(stack, entryId);
    expect(bypassed.entries[0]!.bypassed).toBe(true);
    
    const unbypassed = stackBypassCard(bypassed, entryId);
    expect(unbypassed.entries[0]!.bypassed).toBe(false);
  });
});

describe('stackSoloCard', () => {
  it('should toggle solo state', () => {
    const stack = createStack([doubleCard], 'serial');
    const entryId = stack.entries[0]!.id;
    
    const soloed = stackSoloCard(stack, entryId);
    expect(soloed.entries[0]!.solo).toBe(true);
  });
});

// ============================================================================
// GRAPH CONVERSION TESTS
// ============================================================================

describe('stackToGraph', () => {
  it('should convert serial stack to graph', () => {
    const stack = createStack([doubleCard, addOneCard], 'serial');
    const graph = stackToGraph(stack);
    
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]!.source).toBe(stack.entries[0]!.id);
    expect(graph.edges[0]!.target).toBe(stack.entries[1]!.id);
  });
});

describe('graphToStack', () => {
  it('should convert linear graph to stack', () => {
    const originalStack = createStack([doubleCard, addOneCard], 'serial');
    const graph = stackToGraph(originalStack);
    
    const cardMap = new Map([
      ['double', doubleCard],
      ['add-one', addOneCard],
    ]);
    
    const result = graphToStack(graph, (id) => cardMap.get(id));
    expect(result).not.toBeNull();
    expect(result!.entries).toHaveLength(2);
  });

  it('should return null for non-linear graph', () => {
    // Graph with branching can't be converted
    const graph = {
      nodes: [
        { id: 'a', cardId: 'double', position: { x: 0, y: 0 } },
        { id: 'b', cardId: 'add-one', position: { x: 100, y: 0 } },
        { id: 'c', cardId: 'square', position: { x: 100, y: 100 } },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', sourcePort: 'out', targetPort: 'in' },
        { id: 'e2', source: 'a', target: 'c', sourcePort: 'out', targetPort: 'in' },
      ],
    };
    
    const result = graphToStack(graph, () => doubleCard);
    expect(result).toBeNull();
  });
});

// ============================================================================
// SNAPSHOT TESTS
// ============================================================================

describe('stackSnapshot/stackRestore', () => {
  it('should snapshot and restore state', () => {
    const stack = createStack([doubleCard, addOneCard], 'serial');
    const entryId = stack.entries[0]!.id;
    
    // Take snapshot
    const snapshot = stackSnapshot(stack);
    
    // Modify stack
    const modified = stackBypassCard(stack, entryId);
    expect(modified.entries[0]!.bypassed).toBe(true);
    
    // Restore
    const restored = stackRestore(modified, snapshot);
    expect(restored.entries[0]!.bypassed).toBe(false);
  });
});

// ============================================================================
// DIFF TESTS
// ============================================================================

describe('stackDiff', () => {
  it('should detect added entries', () => {
    const before = createStack([doubleCard], 'serial');
    const after = stackInsertCard(before, addOneCard, 1);
    
    const diff = stackDiff(before, after);
    expect(diff.added).toHaveLength(1);
    expect(diff.removed).toHaveLength(0);
  });

  it('should detect removed entries', () => {
    const before = createStack([doubleCard, addOneCard], 'serial');
    const after = stackRemoveCard(before, before.entries[0]!.id);
    
    const diff = stackDiff(before, after);
    expect(diff.removed).toHaveLength(1);
    expect(diff.added).toHaveLength(0);
  });

  it('should detect state changes', () => {
    const before = createStack([doubleCard], 'serial');
    const after = stackBypassCard(before, before.entries[0]!.id);
    
    const diff = stackDiff(before, after);
    expect(diff.stateChanges.size).toBe(1);
    expect(diff.stateChanges.get(before.entries[0]!.id)?.bypassed).toBe(true);
  });
});

// ============================================================================
// MERGE TESTS
// ============================================================================

describe('stackMerge', () => {
  it('should merge two stacks', () => {
    const stackA = createStack([doubleCard], 'serial');
    const stackB = createStack([addOneCard], 'serial');
    
    const merged = stackMerge(stackA, stackB);
    expect(merged.entries).toHaveLength(2);
  });
});

// ============================================================================
// STACK TO CARD TESTS
// ============================================================================

describe('stackToCard', () => {
  it('should convert serial stack to card', () => {
    const stack = createStack([doubleCard, addOneCard], 'serial');
    const card = stackToCard(stack);
    
    const result = card.process(5, mockContext);
    expect(result.output).toBe(11); // (5 * 2) + 1
  });

  it('should handle empty stack', () => {
    const stack = createStack<number, number>([], 'serial');
    const card = stackToCard(stack);
    
    const result = card.process(5, mockContext);
    expect(result.output).toBe(5); // Pass-through
  });

  it('should respect bypass', () => {
    const stack = createStack([doubleCard, addOneCard], 'serial');
    const bypassed = stackBypassCard(stack, stack.entries[0]!.id);
    const card = stackToCard(bypassed);
    
    // First card bypassed, only second applies
    const result = card.process(5, mockContext);
    // When bypassed, the first card is skipped in composition
    expect(result.output).toBe(6); // 5 + 1
  });
});
