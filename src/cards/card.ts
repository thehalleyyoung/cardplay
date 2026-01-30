/**
 * @fileoverview Card<A, B> Core Implementation.
 * 
 * Cards are the fundamental building blocks of the cardplay system.
 * They represent composable, typed transformations of data.
 * 
 * @module @cardplay/core/cards
 */

import type { Tick } from '../types/primitives';

// ============================================================================
// PORT TYPES
// ============================================================================

/**
 * Port type identifier.
 * Open union with runtime registry for extensibility.
 */
export type PortType = string & { readonly __portType?: unique symbol };

/**
 * Built-in port types.
 * 
 * Change 067: Updated to match canon port vocabulary (docs/canon/port-vocabulary.md)
 * - Added: gate, clock, transport
 * - Legacy types (number, string, boolean, any, stream, container, pattern) should be namespaced
 */
export const PortTypes = {
  /** Audio signal */
  AUDIO: 'audio' as PortType,
  /** MIDI data */
  MIDI: 'midi' as PortType,
  /** Note events */
  NOTES: 'notes' as PortType,
  /** Control signal */
  CONTROL: 'control' as PortType,
  /** Trigger signal */
  TRIGGER: 'trigger' as PortType,
  /** Gate signal */
  GATE: 'gate' as PortType,
  /** Clock signal */
  CLOCK: 'clock' as PortType,
  /** Transport control */
  TRANSPORT: 'transport' as PortType,
  
  // Legacy types - use with caution, prefer namespaced equivalents
  /** @deprecated Use data:number instead */
  NUMBER: 'number' as PortType,
  /** @deprecated Use data:string instead */
  STRING: 'string' as PortType,
  /** @deprecated Use data:boolean instead */
  BOOLEAN: 'boolean' as PortType,
  /** @deprecated Use data:any instead */
  ANY: 'any' as PortType,
  /** @deprecated Use data:stream instead */
  STREAM: 'stream' as PortType,
  /** @deprecated Use data:container instead */
  CONTAINER: 'container' as PortType,
  /** @deprecated Use data:pattern instead */
  PATTERN: 'pattern' as PortType,
} as const;

// Port type registry
const portTypeRegistry = new Map<string, PortTypeEntry>();

/**
 * Metadata about a port type.
 */
export interface PortTypeEntry {
  readonly type: PortType;
  readonly name: string;
  readonly description?: string;
  /** Port color for UI rendering (Change 233) */
  readonly color?: string;
  /** Port icon identifier for UI rendering (Change 233) */
  readonly icon?: string;
}

/**
 * Registers a custom port type.
 * Custom port types must use namespaced IDs (e.g., 'my-pack:custom-type').
 */
export function registerPortType(entry: PortTypeEntry): void {
  // Check if this is a builtin port type
  const isBuiltin = Object.values(PortTypes).includes(entry.type);
  
  // If not builtin, enforce namespacing
  if (!isBuiltin && !entry.type.includes(':')) {
    throw new Error(
      `Custom port type '${entry.type}' must use a namespaced ID (e.g., 'my-pack:${entry.type}')`
    );
  }
  
  portTypeRegistry.set(entry.type, entry);
}

/**
 * Gets port type metadata.
 */
export function getPortTypeEntry(type: PortType): PortTypeEntry | undefined {
  return portTypeRegistry.get(type);
}

/**
 * Change 234: Get all registered port type entries (for UI display).
 */
export function getAllPortTypeEntries(): readonly PortTypeEntry[] {
  return Array.from(portTypeRegistry.values());
}

// Register built-in types
const builtInPortTypes: PortTypeEntry[] = [
  // Change 232-233: Builtin port types with metadata for UI rendering
  { type: PortTypes.AUDIO, name: 'Audio', color: '#4CAF50', icon: 'waveform' },
  { type: PortTypes.MIDI, name: 'MIDI', color: '#2196F3', icon: 'midi' },
  { type: PortTypes.NOTES, name: 'Notes', color: '#9C27B0', icon: 'notes' },
  { type: PortTypes.CONTROL, name: 'Control', color: '#FF9800', icon: 'knob' },
  { type: PortTypes.TRIGGER, name: 'Trigger', color: '#F44336', icon: 'bolt' },
  { type: PortTypes.GATE, name: 'Gate', color: '#E53935', icon: 'gate' },
  { type: PortTypes.CLOCK, name: 'Clock', color: '#00ACC1', icon: 'clock' },
  { type: PortTypes.TRANSPORT, name: 'Transport', color: '#039BE5', icon: 'transport' },
  // Legacy types
  { type: PortTypes.NUMBER, name: 'Number (legacy)', color: '#607D8B', icon: 'hash' },
  { type: PortTypes.STRING, name: 'String (legacy)', color: '#795548', icon: 'text' },
  { type: PortTypes.BOOLEAN, name: 'Boolean (legacy)', color: '#E91E63', icon: 'toggle' },
  { type: PortTypes.ANY, name: 'Any (legacy)', color: '#9E9E9E', icon: 'circle' },
  { type: PortTypes.STREAM, name: 'Stream (legacy)', color: '#00BCD4', icon: 'waveform' },
  { type: PortTypes.CONTAINER, name: 'Container (legacy)', color: '#CDDC39', icon: 'box' },
  { type: PortTypes.PATTERN, name: 'Pattern (legacy)', color: '#FF5722', icon: 'grid' },
];

for (const entry of builtInPortTypes) {
  portTypeRegistry.set(entry.type, entry);
}

// ============================================================================
// PORT DEFINITION
// ============================================================================

/**
 * Port definition for card inputs/outputs.
 */
export interface Port {
  /** Port identifier */
  readonly name: string;
  /** Port data type */
  readonly type: PortType;
  /** Whether port is optional */
  readonly optional?: boolean;
  /** Default value if optional */
  readonly default?: unknown;
  /** Human-readable label */
  readonly label?: string;
  /** Description */
  readonly description?: string;
}

/**
 * Creates a port definition.
 */
export function createPort(
  name: string,
  type: PortType,
  options?: Partial<Omit<Port, 'name' | 'type'>>
): Port {
  const port: Port = { name, type };
  if (options?.optional !== undefined) {
    (port as { optional: boolean }).optional = options.optional;
  }
  if (options?.default !== undefined) {
    (port as { default: unknown }).default = options.default;
  }
  if (options?.label !== undefined) {
    (port as { label: string }).label = options.label;
  }
  if (options?.description !== undefined) {
    (port as { description: string }).description = options.description;
  }
  return Object.freeze(port);
}

// ============================================================================
// CARD PARAM
// ============================================================================

/**
 * Parameter type identifiers.
 */
export type ParamType = 
  | 'number'
  | 'integer'
  | 'boolean'
  | 'string'
  | 'enum'
  | 'color'
  | 'file'
  | 'note'
  | 'scale'
  | 'chord';

/**
 * Card parameter definition.
 */
export interface CardParam<T = unknown> {
  /** Parameter identifier */
  readonly name: string;
  /** Parameter type */
  readonly type: ParamType;
  /** Default value */
  readonly default: T;
  /** Minimum value (for numbers) */
  readonly min?: number;
  /** Maximum value (for numbers) */
  readonly max?: number;
  /** Step increment (for numbers) */
  readonly step?: number;
  /** Enum options (for enum type) */
  readonly options?: readonly T[];
  /** Human-readable label */
  readonly label?: string;
  /** Description */
  readonly description?: string;
  /** Unit string */
  readonly unit?: string;
  /** Whether parameter is automatable */
  readonly automatable?: boolean;
}

/**
 * Creates a card parameter.
 */
export function createParam<T>(
  name: string,
  type: ParamType,
  defaultValue: T,
  options?: Partial<Omit<CardParam<T>, 'name' | 'type' | 'default'>>
): CardParam<T> {
  const param: CardParam<T> = {
    name,
    type,
    default: defaultValue,
  };
  
  if (options?.min !== undefined) (param as { min: number }).min = options.min;
  if (options?.max !== undefined) (param as { max: number }).max = options.max;
  if (options?.step !== undefined) (param as { step: number }).step = options.step;
  if (options?.options !== undefined) (param as { options: readonly T[] }).options = options.options;
  if (options?.label !== undefined) (param as { label: string }).label = options.label;
  if (options?.description !== undefined) (param as { description: string }).description = options.description;
  if (options?.unit !== undefined) (param as { unit: string }).unit = options.unit;
  if (options?.automatable !== undefined) (param as { automatable: boolean }).automatable = options.automatable;
  
  return Object.freeze(param);
}

// ============================================================================
// CARD SIGNATURE
// ============================================================================

/**
 * Card type signature defining inputs, outputs, and parameters.
 */
export interface CardSignature {
  /** Input ports */
  readonly inputs: readonly Port[];
  /** Output ports */
  readonly outputs: readonly Port[];
  /** Parameters */
  readonly params: readonly CardParam[];
}

/**
 * Creates a card signature.
 */
export function createSignature(
  inputs: readonly Port[],
  outputs: readonly Port[],
  params: readonly CardParam[] = []
): CardSignature {
  return Object.freeze({
    inputs: Object.freeze([...inputs]),
    outputs: Object.freeze([...outputs]),
    params: Object.freeze([...params]),
  });
}

// ============================================================================
// CARD META
// ============================================================================

/**
 * Card category for grouping core cards.
 * 
 * This is the canonical category type for Card<A, B> composition cards.
 * For UI categories, see CardSurfaceCategory.
 * For audio module categories, see AudioModuleCategory.
 */
export type CardCategory =
  | 'generators'
  | 'effects'
  | 'transforms'
  | 'filters'
  | 'routing'
  | 'analysis'
  | 'utilities'
  | 'custom';

/**
 * CoreCardCategory alias for CardCategory for clarity in mixed contexts.
 * @see Change 261
 */
export type CoreCardCategory = CardCategory;

/**
 * Card metadata.
 */
export interface CardMeta {
  /** Unique card identifier */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Category for grouping */
  readonly category: CardCategory;
  /** Tags for search */
  readonly tags?: readonly string[];
  /** Description */
  readonly description?: string;
  /** Author */
  readonly author?: string;
  /** Version string */
  readonly version?: string;
  /** Icon identifier */
  readonly icon?: string;
  /** Display color */
  readonly color?: string;
  /** Whether card is deprecated */
  readonly deprecated?: boolean;
  /** Replacement card if deprecated */
  readonly replacement?: string;
}

/**
 * Creates card metadata.
 */
export function createCardMeta(
  id: string,
  name: string,
  category: CardCategory,
  options?: Partial<Omit<CardMeta, 'id' | 'name' | 'category'>>
): CardMeta {
  const meta: CardMeta = { id, name, category };
  
  if (options?.tags !== undefined) (meta as { tags: readonly string[] }).tags = options.tags;
  if (options?.description !== undefined) (meta as { description: string }).description = options.description;
  if (options?.author !== undefined) (meta as { author: string }).author = options.author;
  if (options?.version !== undefined) (meta as { version: string }).version = options.version;
  if (options?.icon !== undefined) (meta as { icon: string }).icon = options.icon;
  if (options?.color !== undefined) (meta as { color: string }).color = options.color;
  if (options?.deprecated !== undefined) (meta as { deprecated: boolean }).deprecated = options.deprecated;
  if (options?.replacement !== undefined) (meta as { replacement: string }).replacement = options.replacement;
  
  return Object.freeze(meta);
}

// ============================================================================
// CARD STATE
// ============================================================================

/**
 * State container for stateful cards.
 */
export interface CardState<S> {
  /** Current state value */
  readonly value: S;
  /** State version for change detection */
  readonly version: number;
}

/**
 * Creates a card state container.
 */
export function createCardState<S>(initialValue: S): CardState<S> {
  return Object.freeze({
    value: initialValue,
    version: 0,
  });
}

/**
 * Updates card state, returning a new state with incremented version.
 */
export function updateCardState<S>(state: CardState<S>, newValue: S): CardState<S> {
  return Object.freeze({
    value: newValue,
    version: state.version + 1,
  });
}

// ============================================================================
// CARD CONTEXT
// ============================================================================

/**
 * Transport state.
 */
export interface Transport {
  /** Whether playing */
  readonly playing: boolean;
  /** Whether recording */
  readonly recording: boolean;
  /** Current tempo in BPM */
  readonly tempo: number;
  /** Time signature */
  readonly timeSignature: readonly [number, number];
  /** Loop enabled */
  readonly looping: boolean;
  /** Loop start */
  readonly loopStart?: Tick;
  /** Loop end */
  readonly loopEnd?: Tick;
}

/**
 * Engine capabilities reference.
 */
export interface EngineRef {
  /** Sample rate */
  readonly sampleRate: number;
  /** Buffer size */
  readonly bufferSize: number;
  /** Audio context (if available) */
  readonly audioContext?: AudioContext;
}

/**
 * Context provided to card processing.
 */
export interface CardContext {
  /** Current time position */
  readonly currentTick: Tick;
  /** Current sample position */
  readonly currentSample: number;
  /** Transport state */
  readonly transport: Transport;
  /** Engine reference */
  readonly engine: EngineRef;
  /** Elapsed time since session start (ms) */
  readonly elapsedMs: number;
}

/**
 * Creates a card context.
 */
export function createCardContext(
  currentTick: Tick,
  transport: Transport,
  engine: EngineRef,
  currentSample: number = 0,
  elapsedMs: number = 0
): CardContext {
  return Object.freeze({
    currentTick,
    currentSample,
    transport,
    engine,
    elapsedMs,
  });
}

// ============================================================================
// CARD<A, B> INTERFACE
// ============================================================================

/**
 * Card processing result.
 */
export interface CardResult<B> {
  /** Output value */
  readonly output: B;
  /** Updated state (if stateful) */
  readonly state?: CardState<unknown>;
  /** Errors during processing */
  readonly errors?: readonly string[];
  /** Timing information */
  readonly timing?: {
    readonly startMs: number;
    readonly endMs: number;
    readonly durationMs: number;
  };
}

/**
 * Card interface - the fundamental building block.
 * 
 * @template A - Input type
 * @template B - Output type
 */
export interface Card<A, B> {
  /** Card metadata */
  readonly meta: CardMeta;
  /** Type signature */
  readonly signature: CardSignature;
  /** Process input to output */
  readonly process: (input: A, context: CardContext, state?: CardState<unknown>) => CardResult<B>;
  /** Initial state (if stateful) */
  readonly initialState?: CardState<unknown>;
}

/**
 * CoreCard alias for Card<A, B> for clarity in mixed contexts.
 * Use this when you need to disambiguate from UI cards or audio module cards.
 * 
 * @template A - Input type
 * @template B - Output type
 * @see Change 262
 */
export type CoreCard<A, B> = Card<A, B>;

// ============================================================================
// CARD FACTORIES
// ============================================================================

/**
 * Options for creating a card.
 */
export interface CreateCardOptions<A, B, S = never> {
  readonly meta: CardMeta;
  readonly signature: CardSignature;
  readonly process: (input: A, context: CardContext, state?: CardState<S>) => CardResult<B>;
  readonly initialState?: S;
}

/**
 * Creates a new card.
 */
export function createCard<A, B, S = never>(
  options: CreateCardOptions<A, B, S>
): Card<A, B> {
  const card: Card<A, B> = {
    meta: options.meta,
    signature: options.signature,
    process: options.process as Card<A, B>['process'],
  };
  
  if (options.initialState !== undefined) {
    (card as { initialState: CardState<S> }).initialState = createCardState(options.initialState);
  }
  
  return Object.freeze(card);
}

/**
 * Creates a pure (stateless) card.
 */
export function pureCard<A, B>(
  meta: CardMeta,
  signature: CardSignature,
  transform: (input: A, context: CardContext) => B
): Card<A, B> {
  return createCard({
    meta,
    signature,
    process: (input, context) => ({
      output: transform(input, context),
    }),
  });
}

/**
 * Creates a stateful card.
 */
export function statefulCard<A, B, S>(
  meta: CardMeta,
  signature: CardSignature,
  initialState: S,
  process: (input: A, context: CardContext, state: S) => { output: B; nextState: S }
): Card<A, B> {
  return createCard<A, B, S>({
    meta,
    signature,
    initialState,
    process: (input, context, stateContainer) => {
      const currentState = stateContainer?.value ?? initialState;
      const result = process(input, context, currentState as S);
      return {
        output: result.output,
        state: updateCardState(stateContainer ?? createCardState(initialState), result.nextState),
      };
    },
  });
}

/**
 * Creates an async card.
 */
export function asyncCard<A, B>(
  meta: CardMeta,
  signature: CardSignature,
  processAsync: (input: A, context: CardContext) => Promise<B>
): Card<A, Promise<B>> {
  return createCard({
    meta,
    signature,
    process: (input, context) => ({
      output: processAsync(input, context),
    }),
  });
}

// ============================================================================
// CARD COMPOSITION
// ============================================================================

/**
 * Composes two cards in series: A -> B -> C.
 */
export function cardCompose<A, B, C>(
  first: Card<A, B>,
  second: Card<B, C>
): Card<A, C> {
  const meta = createCardMeta(
    `${first.meta.id}>${second.meta.id}`,
    `${first.meta.name} → ${second.meta.name}`,
    'routing'
  );
  
  const signature = createSignature(
    first.signature.inputs,
    second.signature.outputs,
    [...first.signature.params, ...second.signature.params]
  );
  
  return createCard({
    meta,
    signature,
    process: (input, context, state) => {
      const firstResult = first.process(input, context, state);
      const secondResult = second.process(firstResult.output, context, firstResult.state);
      
      const errors: string[] = [];
      if (firstResult.errors) errors.push(...firstResult.errors);
      if (secondResult.errors) errors.push(...secondResult.errors);
      
      const result: CardResult<C> = {
        output: secondResult.output,
      };
      
      if (secondResult.state !== undefined) {
        (result as { state: CardState<unknown> }).state = secondResult.state;
      }
      
      if (errors.length > 0) {
        (result as { errors: readonly string[] }).errors = errors;
      }
      
      return result;
    },
  });
}

/**
 * Runs two cards in parallel: A -> [B, C].
 */
export function cardParallel<A, B, C>(
  first: Card<A, B>,
  second: Card<A, C>
): Card<A, [B, C]> {
  const meta = createCardMeta(
    `${first.meta.id}||${second.meta.id}`,
    `${first.meta.name} ‖ ${second.meta.name}`,
    'routing'
  );
  
  const signature = createSignature(
    first.signature.inputs,
    [...first.signature.outputs, ...second.signature.outputs],
    [...first.signature.params, ...second.signature.params]
  );
  
  return createCard({
    meta,
    signature,
    process: (input, context, state) => {
      const firstResult = first.process(input, context, state);
      const secondResult = second.process(input, context, state);
      
      const errors: string[] = [];
      if (firstResult.errors) errors.push(...firstResult.errors);
      if (secondResult.errors) errors.push(...secondResult.errors);
      
      const result: CardResult<[B, C]> = {
        output: [firstResult.output, secondResult.output],
      };
      
      if (errors.length > 0) {
        (result as { errors: readonly string[] }).errors = errors;
      }
      
      return result;
    },
  });
}

/**
 * Branches processing based on a condition.
 */
export function cardBranch<A, B, C>(
  condition: (input: A, context: CardContext) => boolean,
  ifTrue: Card<A, B>,
  ifFalse: Card<A, C>
): Card<A, B | C> {
  const meta = createCardMeta(
    `branch(${ifTrue.meta.id},${ifFalse.meta.id})`,
    `Branch: ${ifTrue.meta.name} / ${ifFalse.meta.name}`,
    'routing'
  );
  
  const signature = createSignature(
    ifTrue.signature.inputs,
    [...ifTrue.signature.outputs, ...ifFalse.signature.outputs],
    [...ifTrue.signature.params, ...ifFalse.signature.params]
  );
  
  return createCard<A, B | C>({
    meta,
    signature,
    process: (input, context, state) => {
      if (condition(input, context)) {
        const r = ifTrue.process(input, context, state);
        const result: CardResult<B | C> = { output: r.output };
        if (r.state !== undefined) (result as { state: CardState<unknown> }).state = r.state;
        if (r.errors !== undefined) (result as { errors: readonly string[] }).errors = r.errors;
        if (r.timing !== undefined) (result as { timing: typeof r.timing }).timing = r.timing;
        return result;
      } else {
        const r = ifFalse.process(input, context, state);
        const result: CardResult<B | C> = { output: r.output };
        if (r.state !== undefined) (result as { state: CardState<unknown> }).state = r.state;
        if (r.errors !== undefined) (result as { errors: readonly string[] }).errors = r.errors;
        if (r.timing !== undefined) (result as { timing: typeof r.timing }).timing = r.timing;
        return result;
      }
    },
  });
}

/**
 * Creates a feedback loop with delay.
 */
export function cardLoop<A>(
  card: Card<A, A>,
  delayTicks: number = 1
): Card<A, A> {
  const meta = createCardMeta(
    `loop(${card.meta.id})`,
    `Loop: ${card.meta.name}`,
    'routing'
  );
  
  interface LoopState {
    buffer: A[];
    readIndex: number;
  }
  
  return statefulCard<A, A, LoopState>(
    meta,
    card.signature,
    { buffer: [], readIndex: 0 },
    (input, context, state) => {
      // Add input to buffer
      const newBuffer = [...state.buffer, input];
      
      // Get delayed output
      let output: A;
      if (newBuffer.length > delayTicks) {
        output = newBuffer[state.readIndex]!;
        // Process through card
        const result = card.process(output, context);
        output = result.output;
      } else {
        output = input; // Pass through until buffer is filled
      }
      
      return {
        output,
        nextState: {
          buffer: newBuffer.slice(-delayTicks * 2), // Keep limited history
          readIndex: Math.min(state.readIndex + 1, newBuffer.length - 1),
        },
      };
    }
  );
}

// ============================================================================
// CARD WRAPPERS
// ============================================================================

/**
 * Wraps a card with memoization.
 */
export function cardMemo<A, B>(
  card: Card<A, B>,
  keyFn: (input: A) => string = JSON.stringify
): Card<A, B> {
  const meta = createCardMeta(
    `memo(${card.meta.id})`,
    `Memoized: ${card.meta.name}`,
    card.meta.category
  );
  
  interface MemoState {
    cache: Map<string, B>;
  }
  
  return statefulCard<A, B, MemoState>(
    meta,
    card.signature,
    { cache: new Map() },
    (input, context, state) => {
      const key = keyFn(input);
      
      if (state.cache.has(key)) {
        return {
          output: state.cache.get(key)!,
          nextState: state,
        };
      }
      
      const result = card.process(input, context);
      const newCache = new Map(state.cache);
      newCache.set(key, result.output);
      
      // Limit cache size
      if (newCache.size > 1000) {
        const firstKey = newCache.keys().next().value;
        if (firstKey !== undefined) {
          newCache.delete(firstKey);
        }
      }
      
      return {
        output: result.output,
        nextState: { cache: newCache },
      };
    }
  );
}

/**
 * Wraps a card with timing profiling.
 */
export function cardProfile<A, B>(card: Card<A, B>): Card<A, B> {
  const meta = createCardMeta(
    `profile(${card.meta.id})`,
    `Profiled: ${card.meta.name}`,
    card.meta.category
  );
  
  return createCard({
    meta,
    signature: card.signature,
    process: (input, context, state) => {
      const startMs = performance.now();
      const result = card.process(input, context, state);
      const endMs = performance.now();
      
      return {
        ...result,
        timing: {
          startMs,
          endMs,
          durationMs: endMs - startMs,
        },
      };
    },
  });
}

/**
 * Wraps a card with input/output validation.
 */
export function cardValidate<A, B>(
  card: Card<A, B>,
  validateInput?: (input: A) => string | null,
  validateOutput?: (output: B) => string | null
): Card<A, B> {
  const meta = createCardMeta(
    `validate(${card.meta.id})`,
    `Validated: ${card.meta.name}`,
    card.meta.category
  );
  
  return createCard({
    meta,
    signature: card.signature,
    process: (input, context, state) => {
      const errors: string[] = [];
      
      // Validate input
      if (validateInput) {
        const inputError = validateInput(input);
        if (inputError) {
          errors.push(`Input validation: ${inputError}`);
        }
      }
      
      // Process
      const result = card.process(input, context, state);
      
      // Validate output
      if (validateOutput) {
        const outputError = validateOutput(result.output);
        if (outputError) {
          errors.push(`Output validation: ${outputError}`);
        }
      }
      
      // Merge errors
      if (result.errors) {
        errors.push(...result.errors);
      }
      
      if (errors.length > 0) {
        return { ...result, errors };
      }
      
      return result;
    },
  });
}

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Card JSON representation.
 */
export interface CardJSON {
  readonly id: string;
  readonly name: string;
  readonly category: CardCategory;
  readonly signature: {
    readonly inputs: readonly Port[];
    readonly outputs: readonly Port[];
    readonly params: readonly CardParam[];
  };
  readonly tags?: readonly string[];
  readonly description?: string;
  readonly version?: string;
}

/**
 * Serializes a card to JSON (metadata only, not the process function).
 */
export function cardToJSON<A, B>(card: Card<A, B>): CardJSON {
  const json: CardJSON = {
    id: card.meta.id,
    name: card.meta.name,
    category: card.meta.category,
    signature: {
      inputs: card.signature.inputs,
      outputs: card.signature.outputs,
      params: card.signature.params,
    },
  };
  
  if (card.meta.tags !== undefined) {
    (json as { tags: readonly string[] }).tags = card.meta.tags;
  }
  if (card.meta.description !== undefined) {
    (json as { description: string }).description = card.meta.description;
  }
  if (card.meta.version !== undefined) {
    (json as { version: string }).version = card.meta.version;
  }
  
  return json;
}
