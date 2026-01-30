/**
 * @fileoverview Stack Composition Implementation.
 * 
 * Stacks are linear arrangements of cards with different processing modes.
 * Change 264: Uses CoreCard to ensure composition Stack doesn't collide with UI stacks.
 * 
 * @module @cardplay/core/cards/stack
 */

import type {
  Card,
  CoreCard,
  CardContext,
  CardResult,
  CardState,
  CardSignature,
  Port,
} from './card';
import {
  createCard,
  createCardMeta,
  createSignature,
  cardCompose,
} from './card';

// ============================================================================
// STACK TYPES
// ============================================================================

/**
 * Stack processing modes.
 */
export type StackMode = 'serial' | 'parallel' | 'layer' | 'tabs';

/**
 * Stack entry wrapping a card with additional state.
 * Change 264: Uses CoreCard for composition cards only.
 */
export interface StackEntry<A = unknown, B = unknown> {
  /** Unique entry ID */
  readonly id: string;
  /** The core composition card */
  readonly card: CoreCard<A, B>;
  /** Whether card is bypassed */
  bypassed: boolean;
  /** Whether card is solo'd */
  solo: boolean;
  /** Mix level for layer mode (0-1) */
  mix: number;
  /** Custom state */
  readonly state?: CardState<unknown>;
}

/**
 * Stack snapshot for undo/redo.
 */
export interface StackSnapshot {
  /** Snapshot ID */
  readonly id: string;
  /** Timestamp */
  readonly timestamp: number;
  /** Entry IDs in order */
  readonly entryIds: readonly string[];
  /** Entry states */
  readonly states: ReadonlyMap<string, StackEntryState>;
}

/**
 * Serializable entry state.
 */
export interface StackEntryState {
  readonly bypassed: boolean;
  readonly solo: boolean;
  readonly mix: number;
}

/**
 * Stack type - a linear arrangement of cards.
 * @template _A - Input type (used for type inference)
 * @template _B - Output type (used for type inference)
 */
export interface Stack<_A = unknown, _B = unknown> {
  /** Stack ID */
  readonly id: string;
  /** Stack mode */
  readonly mode: StackMode;
  /** Stack entries */
  readonly entries: readonly StackEntry[];
  /** Combined signature */
  readonly signature: CardSignature;
  /** Stack metadata */
  readonly meta: StackMeta;
}

/**
 * Stack metadata.
 */
export interface StackMeta {
  readonly name?: string;
  readonly color?: string;
  readonly collapsed?: boolean;
}

// ============================================================================
// STACK FACTORY
// ============================================================================

let stackIdCounter = 0;

/**
 * Generates a unique stack ID.
 */
export function generateStackId(): string {
  return `stack-${++stackIdCounter}-${Date.now().toString(36)}`;
}

let entryIdCounter = 0;

/**
 * Generates a unique entry ID.
 */
export function generateEntryId(): string {
  return `entry-${++entryIdCounter}-${Date.now().toString(36)}`;
}

/**
 * Creates a stack from cards.
 * Change 264: Takes CoreCard instances for composition.
 */
export function createStack<A, B>(
  cards: readonly CoreCard<unknown, unknown>[],
  mode: StackMode = 'serial',
  meta?: StackMeta
): Stack<A, B> {
  const entries: StackEntry[] = cards.map(card => ({
    id: generateEntryId(),
    card,
    bypassed: false,
    solo: false,
    mix: 1,
  }));
  
  const signature = inferStackPorts(entries, mode);
  
  return Object.freeze({
    id: generateStackId(),
    mode,
    entries: Object.freeze(entries),
    signature,
    meta: meta ?? {},
  });
}

// ============================================================================
// STACK TYPE ALIASES
// ============================================================================

/**
 * Serial stack - cards process in sequence.
 */
export type SerialStack<A, B> = Stack<A, B> & { readonly mode: 'serial' };

/**
 * Parallel stack - cards process independently, results combined.
 */
export type ParallelStack<A, B> = Stack<A, B> & { readonly mode: 'parallel' };

/**
 * Layer stack - for audio mixing with levels.
 */
export type LayerStack<A, B> = Stack<A, B> & { readonly mode: 'layer' };

/**
 * Tab stack - only one card active at a time.
 */
export type TabStack<A, B> = Stack<A, B> & { readonly mode: 'tabs' };

// ============================================================================
// STACK VALIDATION
// ============================================================================

/**
 * Stack validation result.
 */
export interface StackValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Validates a stack's type compatibility.
 */
export function validateStack(stack: Stack): StackValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (stack.entries.length === 0) {
    warnings.push('Stack is empty');
    return { valid: true, errors, warnings };
  }
  
  if (stack.mode === 'serial') {
    // Check that outputs match inputs for consecutive cards
    for (let i = 0; i < stack.entries.length - 1; i++) {
      const current = stack.entries[i]!;
      const next = stack.entries[i + 1]!;
      
      // Check if any output of current can connect to any input of next
      const currentOutputs = current.card.signature.outputs;
      const nextInputs = next.card.signature.inputs;
      
      if (currentOutputs.length === 0 && nextInputs.length > 0) {
        errors.push(
          `Card "${current.card.meta.name}" has no outputs but "${next.card.meta.name}" requires inputs`
        );
      }
    }
  }
  
  if (stack.mode === 'parallel') {
    // Check that all cards have same input types
    const firstInputs = stack.entries[0]?.card.signature.inputs ?? [];
    for (let i = 1; i < stack.entries.length; i++) {
      const entry = stack.entries[i]!;
      const inputs = entry.card.signature.inputs;
      
      if (inputs.length !== firstInputs.length) {
        warnings.push(
          `Card "${entry.card.meta.name}" has different input count than first card`
        );
      }
    }
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================================
// PORT INFERENCE
// ============================================================================

/**
 * Infers the combined ports of a stack.
 */
export function inferStackPorts(
  entries: readonly StackEntry[],
  mode: StackMode
): CardSignature {
  if (entries.length === 0) {
    return createSignature([], []);
  }
  
  const firstCard = entries[0]!.card;
  const lastCard = entries[entries.length - 1]!.card;
  
  switch (mode) {
    case 'serial':
      // Inputs from first card, outputs from last card
      return createSignature(
        firstCard.signature.inputs,
        lastCard.signature.outputs
      );
      
    case 'parallel':
      // Inputs from first card, outputs from all cards combined
      const allOutputs: Port[] = [];
      for (const entry of entries) {
        allOutputs.push(...entry.card.signature.outputs);
      }
      return createSignature(firstCard.signature.inputs, allOutputs);
      
    case 'layer':
      // Same as parallel for audio mixing
      const layerOutputs: Port[] = [];
      for (const entry of entries) {
        layerOutputs.push(...entry.card.signature.outputs);
      }
      return createSignature(firstCard.signature.inputs, layerOutputs);
      
    case 'tabs':
      // Union of all inputs and outputs
      const tabInputs: Port[] = [];
      const tabOutputs: Port[] = [];
      for (const entry of entries) {
        tabInputs.push(...entry.card.signature.inputs);
        tabOutputs.push(...entry.card.signature.outputs);
      }
      return createSignature(tabInputs, tabOutputs);
      
    default:
      return createSignature([], []);
  }
}

// ============================================================================
// STACK OPERATIONS
// ============================================================================

/**
 * Inserts a card into a stack at a position.
 * Change 264: Takes CoreCard for composition.
 */
export function stackInsertCard<A, B>(
  stack: Stack<A, B>,
  card: CoreCard<unknown, unknown>,
  position: number
): Stack<A, B> {
  const newEntry: StackEntry = {
    id: generateEntryId(),
    card,
    bypassed: false,
    solo: false,
    mix: 1,
  };
  
  const newEntries = [...stack.entries];
  newEntries.splice(position, 0, newEntry);
  
  return Object.freeze({
    ...stack,
    entries: Object.freeze(newEntries),
    signature: inferStackPorts(newEntries, stack.mode),
  });
}

/**
 * Removes a card from a stack by entry ID.
 */
export function stackRemoveCard<A, B>(
  stack: Stack<A, B>,
  entryId: string
): Stack<A, B> {
  const newEntries = stack.entries.filter(e => e.id !== entryId);
  
  return Object.freeze({
    ...stack,
    entries: Object.freeze(newEntries),
    signature: inferStackPorts(newEntries, stack.mode),
  });
}

/**
 * Reorders cards in a stack.
 */
export function stackReorderCards<A, B>(
  stack: Stack<A, B>,
  fromIndex: number,
  toIndex: number
): Stack<A, B> {
  const newEntries = [...stack.entries];
  const [removed] = newEntries.splice(fromIndex, 1);
  if (removed) {
    newEntries.splice(toIndex, 0, removed);
  }
  
  return Object.freeze({
    ...stack,
    entries: Object.freeze(newEntries),
    signature: inferStackPorts(newEntries, stack.mode),
  });
}

/**
 * Toggles bypass state for a card.
 */
export function stackBypassCard<A, B>(
  stack: Stack<A, B>,
  entryId: string
): Stack<A, B> {
  const newEntries = stack.entries.map(e =>
    e.id === entryId ? { ...e, bypassed: !e.bypassed } : e
  );
  
  return Object.freeze({
    ...stack,
    entries: Object.freeze(newEntries),
  });
}

/**
 * Toggles solo state for a card.
 */
export function stackSoloCard<A, B>(
  stack: Stack<A, B>,
  entryId: string
): Stack<A, B> {
  const newEntries = stack.entries.map(e =>
    e.id === entryId ? { ...e, solo: !e.solo } : e
  );
  
  return Object.freeze({
    ...stack,
    entries: Object.freeze(newEntries),
  });
}

// ============================================================================
// STACK TO GRAPH CONVERSION
// ============================================================================

/**
 * Graph node representation.
 */
export interface StackGraphNode {
  readonly id: string;
  readonly cardId: string;
  readonly position: { x: number; y: number };
}

/**
 * Graph edge representation.
 */
export interface StackGraphEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly sourcePort: string;
  readonly targetPort: string;
}

/**
 * Stack graph representation.
 */
export interface StackGraph {
  readonly nodes: readonly StackGraphNode[];
  readonly edges: readonly StackGraphEdge[];
}

/**
 * Converts a stack to a graph representation.
 */
export function stackToGraph(stack: Stack): StackGraph {
  const nodes: StackGraphNode[] = [];
  const edges: StackGraphEdge[] = [];
  
  // Create nodes
  stack.entries.forEach((entry, index) => {
    nodes.push({
      id: entry.id,
      cardId: entry.card.meta.id,
      position: { x: index * 200, y: 0 },
    });
  });
  
  // Create edges based on mode
  if (stack.mode === 'serial') {
    for (let i = 0; i < stack.entries.length - 1; i++) {
      const current = stack.entries[i]!;
      const next = stack.entries[i + 1]!;
      
      // Connect first output to first input
      const outputPort = current.card.signature.outputs[0]?.name ?? 'out';
      const inputPort = next.card.signature.inputs[0]?.name ?? 'in';
      
      edges.push({
        id: `edge-${i}`,
        source: current.id,
        target: next.id,
        sourcePort: outputPort,
        targetPort: inputPort,
      });
    }
  }
  
  return { nodes, edges };
}

/**
 * Attempts to convert a graph back to a stack.
 * Only works for simple linear graphs.
 * Change 264: Uses CoreCard for composition.
 */
export function graphToStack<A, B>(
  graph: StackGraph,
  getCard: (cardId: string) => CoreCard<unknown, unknown> | undefined
): Stack<A, B> | null {
  if (graph.nodes.length === 0) {
    return createStack([], 'serial');
  }
  
  // Check if graph is linear
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  const nextNode = new Map<string, string>();
  
  for (const node of graph.nodes) {
    inDegree.set(node.id, 0);
    outDegree.set(node.id, 0);
  }
  
  for (const edge of graph.edges) {
    outDegree.set(edge.source, (outDegree.get(edge.source) ?? 0) + 1);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    nextNode.set(edge.source, edge.target);
  }
  
  // Find start node (in-degree 0)
  let startNode: string | null = null;
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      if (startNode !== null) {
        return null; // Multiple start nodes, not linear
      }
      startNode = nodeId;
    }
    if ((outDegree.get(nodeId) ?? 0) > 1) {
      return null; // Branching, not linear
    }
  }
  
  if (!startNode) {
    return null; // No start node found (cycle)
  }
  
  // Traverse graph linearly
  const orderedCards: CoreCard<unknown, unknown>[] = [];
  let currentId: string | undefined = startNode;
  const visited = new Set<string>();
  
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const node = graph.nodes.find(n => n.id === currentId);
    if (!node) break;
    
    const card = getCard(node.cardId);
    if (!card) return null; // Card not found
    
    orderedCards.push(card);
    currentId = nextNode.get(currentId);
  }
  
  return createStack(orderedCards, 'serial');
}

// ============================================================================
// SNAPSHOT / RESTORE
// ============================================================================

let snapshotIdCounter = 0;

/**
 * Creates a snapshot of a stack's state.
 */
export function stackSnapshot(stack: Stack): StackSnapshot {
  const states = new Map<string, StackEntryState>();
  
  for (const entry of stack.entries) {
    states.set(entry.id, {
      bypassed: entry.bypassed,
      solo: entry.solo,
      mix: entry.mix,
    });
  }
  
  return {
    id: `snapshot-${++snapshotIdCounter}`,
    timestamp: Date.now(),
    entryIds: stack.entries.map(e => e.id),
    states,
  };
}

/**
 * Restores a stack from a snapshot.
 */
export function stackRestore<A, B>(
  stack: Stack<A, B>,
  snapshot: StackSnapshot
): Stack<A, B> {
  const newEntries = stack.entries.map(entry => {
    const state = snapshot.states.get(entry.id);
    if (state) {
      return {
        ...entry,
        bypassed: state.bypassed,
        solo: state.solo,
        mix: state.mix,
      };
    }
    return entry;
  });
  
  return Object.freeze({
    ...stack,
    entries: Object.freeze(newEntries),
  });
}

// ============================================================================
// DIFF AND MERGE
// ============================================================================

/**
 * Difference between two stacks.
 */
export interface StackDiff {
  readonly added: readonly string[];
  readonly removed: readonly string[];
  readonly reordered: boolean;
  readonly stateChanges: ReadonlyMap<string, Partial<StackEntryState>>;
}

/**
 * Computes the difference between two stacks.
 */
export function stackDiff(before: Stack, after: Stack): StackDiff {
  const beforeIds = new Set(before.entries.map(e => e.id));
  const afterIds = new Set(after.entries.map(e => e.id));
  
  const added = after.entries
    .filter(e => !beforeIds.has(e.id))
    .map(e => e.id);
  
  const removed = before.entries
    .filter(e => !afterIds.has(e.id))
    .map(e => e.id);
  
  // Check for reordering
  const commonIds = before.entries
    .filter(e => afterIds.has(e.id))
    .map(e => e.id);
  const afterCommonOrder = after.entries
    .filter(e => beforeIds.has(e.id))
    .map(e => e.id);
  const reordered = commonIds.join(',') !== afterCommonOrder.join(',');
  
  // Check for state changes
  const stateChanges = new Map<string, Partial<StackEntryState>>();
  for (const beforeEntry of before.entries) {
    const afterEntry = after.entries.find(e => e.id === beforeEntry.id);
    if (afterEntry) {
      const changes: { bypassed?: boolean; solo?: boolean; mix?: number } = {};
      if (beforeEntry.bypassed !== afterEntry.bypassed) {
        changes.bypassed = afterEntry.bypassed;
      }
      if (beforeEntry.solo !== afterEntry.solo) {
        changes.solo = afterEntry.solo;
      }
      if (beforeEntry.mix !== afterEntry.mix) {
        changes.mix = afterEntry.mix;
      }
      if (Object.keys(changes).length > 0) {
        stateChanges.set(beforeEntry.id, changes);
      }
    }
  }
  
  return { added, removed, reordered, stateChanges };
}

/**
 * Merges two stacks (concatenation).
 */
export function stackMerge<A, B>(
  stackA: Stack<A, B>,
  stackB: Stack<A, B>,
  mode?: StackMode
): Stack<A, B> {
  const mergedEntries = [...stackA.entries, ...stackB.entries];
  const mergedMode = mode ?? stackA.mode;
  
  return Object.freeze({
    id: generateStackId(),
    mode: mergedMode,
    entries: Object.freeze(mergedEntries),
    signature: inferStackPorts(mergedEntries, mergedMode),
    meta: stackA.meta,
  });
}

// ============================================================================
// STACK TO CARD CONVERSION
// ============================================================================

/**
 * Converts a stack to a single card.
 * Change 264: Returns CoreCard for composition.
 */
export function stackToCard<A, B>(stack: Stack<A, B>): CoreCard<A, B> {
  const meta = createCardMeta(
    `stack-${stack.id}`,
    stack.meta.name ?? 'Stack',
    'routing'
  );
  
  if (stack.entries.length === 0) {
    return createCard({
      meta,
      signature: stack.signature,
      process: (input: A) => ({ output: input as unknown as B }),
    });
  }
  
  if (stack.mode === 'serial') {
    // Get active entries (non-bypassed)
    const activeEntries = stack.entries.filter(e => !e.bypassed);
    
    if (activeEntries.length === 0) {
      // All bypassed - pass through
      return createCard({
        meta,
        signature: stack.signature,
        process: (input: A) => ({ output: input as unknown as B }),
      });
    }
    
    // Chain all active cards
    let combined = activeEntries[0]!.card as unknown as CoreCard<A, B>;
    
    for (let i = 1; i < activeEntries.length; i++) {
      const entry = activeEntries[i]!;
      combined = cardCompose(combined, entry.card as CoreCard<B, B>) as unknown as CoreCard<A, B>;
    }
    
    return combined;
  }
  
  // For other modes, create a custom processing card
  return createCard<A, B>({
    meta,
    signature: stack.signature,
    process: (input: A, context: CardContext, state?: CardState<unknown>) => {
      const activeEntries = getActiveEntries(stack);
      
      if (activeEntries.length === 0) {
        return { output: input as unknown as B };
      }
      
      if (stack.mode === 'parallel' || stack.mode === 'layer') {
        // Process all in parallel
        const results: unknown[] = [];
        for (const entry of activeEntries) {
          const result = entry.card.process(input, context, state);
          if (stack.mode === 'layer') {
            // Apply mix level
            results.push({ value: result.output, mix: entry.mix });
          } else {
            results.push(result.output);
          }
        }
        return { output: results as unknown as B };
      }
      
      if (stack.mode === 'tabs') {
        // Only process first active entry
        const active = activeEntries[0];
        if (active) {
          return active.card.process(input, context, state) as CardResult<B>;
        }
      }
      
      return { output: input as unknown as B };
    },
  });
}

/**
 * Gets active entries (not bypassed, respecting solo).
 */
function getActiveEntries(stack: Stack): readonly StackEntry[] {
  const hasSolo = stack.entries.some(e => e.solo);
  
  if (hasSolo) {
    return stack.entries.filter(e => e.solo && !e.bypassed);
  }
  
  return stack.entries.filter(e => !e.bypassed);
}
