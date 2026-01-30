/**
 * @fileoverview CardScript Live Mode - Minimal syntax for real-time performance.
 * 
 * Provides a simplified, low-latency interface for live coding.
 * Every element has a "complete" version (full params, LLM-friendly) and
 * a "live" version (minimal params, performance-friendly).
 * 
 * @module @cardplay/user-cards/cardscript/live
 */

import type {
  Card,
  CardContext,
  CardResult,
  CardState,
  PortType,
  ParamType,
} from '../../cards/card';
import {
  createCard,
  createCardMeta,
  createSignature,
  createPort,
  createParam,
  PortTypes,
} from '../../cards/card';
import { isNamespacedId } from '../../canon/id-validation';

// Re-export needed types for reference
export type { Card, CardContext, CardResult, CardState };

// ============================================================================
// LIVE VALUE - PREALLOCATED FOR ZERO-ALLOC PERFORMANCE  
// ============================================================================

/**
 * Reusable value pool to avoid allocations.
 * Currently reserved for future optimization; exported to satisfy noUnusedLocals.
 */
export const valuePool = {
  numbers: new Float64Array(1024),
  numberIndex: 0,
  arrays: new Array(64).fill(null).map(() => [] as unknown[]),
  arrayIndex: 0,
  objects: new Array(64).fill(null).map(() => ({} as Record<string, unknown>)),
  objectIndex: 0,
  
  reset() {
    this.numberIndex = 0;
    this.arrayIndex = 0;
    this.objectIndex = 0;
  },
  
  getArray<T>(): T[] {
    const arr = this.arrays[this.arrayIndex % 64]!;
    arr.length = 0;
    this.arrayIndex++;
    return arr as T[];
  },
  
  getObject<T extends Record<string, unknown>>(): T {
    const obj = this.objects[this.objectIndex % 64]!;
    for (const key of Object.keys(obj)) delete obj[key];
    this.objectIndex++;
    return obj as T;
  },
};

// ============================================================================
// COMPLETE vs LIVE DEFINITIONS
// ============================================================================

/**
 * Complete card definition - full parameters, suitable for LLM generation.
 */
export interface CompleteCardDef<A = unknown, B = unknown, S = unknown> {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Category for organization */
  category: 'generators' | 'effects' | 'transforms' | 'filters' | 'routing' | 'analysis' | 'utilities' | 'custom';
  /** Description */
  description?: string;
  /** Author */
  author?: string;
  /** Version */
  version?: string;
  /** Tags for search */
  tags?: string[];
  /** Icon identifier */
  icon?: string;
  /** Display color */
  color?: string;
  
  /** Input port definitions */
  inputs: CompletePortDef[];
  /** Output port definitions */
  outputs: CompletePortDef[];
  /** Parameter definitions */
  params: CompleteParamDef[];
  /** Initial state */
  state?: S;
  
  /** Process function */
  process: (input: A, ctx: CardContext, state: S, params: Record<string, unknown>) => { output: B; state?: S };
}

/**
 * Live card definition - minimal parameters for real-time use.
 */
export interface LiveCardDef<A = unknown, B = unknown, S = unknown> {
  /** Short name (used as id if no id) */
  n: string;
  /** Category shorthand: g=gen, e=fx, t=xform, f=filt, r=route, a=analysis, u=util */
  c?: 'g' | 'e' | 't' | 'f' | 'r' | 'a' | 'u';
  /** Input types (shorthand: a=audio, m=midi, n=number, s=string, t=trigger) */
  i?: string | string[];
  /** Output types */
  o?: string | string[];
  /** Params as [name, default, min?, max?] tuples */
  p?: ParamTuple[];
  /** Initial state */
  s?: S;
  /** Process function */
  f: (input: A, ctx: CardContext, state: S, params: Record<string, unknown>) => { output: B; state?: S };
}

// ============================================================================
// COMPLETE PORT & PARAM DEFINITIONS
// ============================================================================

export interface CompletePortDef {
  name: string;
  type: PortType;
  label?: string;
  description?: string;
  optional?: boolean;
  default?: unknown;
}

export interface CompleteParamDef {
  name: string;
  type: ParamType;
  default: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: unknown[];
  label?: string;
  description?: string;
  unit?: string;
  automatable?: boolean;
}

// ============================================================================
// LIVE SHORTHAND TYPES
// ============================================================================

/** Param tuple: [name, default] or [name, default, min, max] */
export type ParamTuple = [string, number] | [string, number, number, number] | [string, string] | [string, boolean];

/** Port type shorthand mapping */
const PORT_SHORTHAND: Record<string, PortType> = {
  'a': PortTypes.AUDIO,
  'audio': PortTypes.AUDIO,
  'm': PortTypes.MIDI,
  'midi': PortTypes.MIDI,
  'n': PortTypes.NUMBER,
  'num': PortTypes.NUMBER,
  'number': PortTypes.NUMBER,
  's': PortTypes.STRING,
  'str': PortTypes.STRING,
  'string': PortTypes.STRING,
  'b': PortTypes.BOOLEAN,
  'bool': PortTypes.BOOLEAN,
  'boolean': PortTypes.BOOLEAN,
  't': PortTypes.TRIGGER,
  'trig': PortTypes.TRIGGER,
  'trigger': PortTypes.TRIGGER,
  'c': PortTypes.CONTROL,
  'ctrl': PortTypes.CONTROL,
  'control': PortTypes.CONTROL,
  'p': PortTypes.PATTERN,
  'pat': PortTypes.PATTERN,
  'pattern': PortTypes.PATTERN,
  'notes': PortTypes.NOTES,
  '*': PortTypes.ANY,
  'any': PortTypes.ANY,
};

/** Category shorthand mapping */
const CATEGORY_SHORTHAND: Record<string, CompleteCardDef['category']> = {
  'g': 'generators',
  'gen': 'generators',
  'generators': 'generators',
  'e': 'effects',
  'fx': 'effects',
  'effects': 'effects',
  't': 'transforms',
  'xform': 'transforms',
  'transforms': 'transforms',
  'f': 'filters',
  'filt': 'filters',
  'filters': 'filters',
  'r': 'routing',
  'route': 'routing',
  'routing': 'routing',
  'a': 'analysis',
  'analysis': 'analysis',
  'u': 'utilities',
  'util': 'utilities',
  'utilities': 'utilities',
};

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Converts live port shorthand to complete port definition.
 */
function liveToCompletePort(shorthand: string, index: number, isInput: boolean): CompletePortDef {
  const type = PORT_SHORTHAND[shorthand.toLowerCase()] ?? PortTypes.ANY;
  return {
    name: isInput ? `in${index}` : `out${index}`,
    type,
    label: isInput ? `Input ${index}` : `Output ${index}`,
  };
}

/**
 * Converts live param tuple to complete param definition.
 */
function liveToCompleteParam(tuple: ParamTuple): CompleteParamDef {
  const [name, defaultVal, min, max] = tuple;
  const type: ParamType = typeof defaultVal === 'number' ? 'number' :
                          typeof defaultVal === 'string' ? 'string' :
                          typeof defaultVal === 'boolean' ? 'boolean' : 'number';
  
  const result: CompleteParamDef = {
    name,
    type,
    default: defaultVal,
  };
  
  if (typeof min === 'number') result.min = min;
  if (typeof max === 'number') result.max = max;
  
  return result;
}

/**
 * Converts a live card definition to a complete card definition.
 */
export function liveToComplete<A, B, S>(live: LiveCardDef<A, B, S>): CompleteCardDef<A, B, S> {
  // Parse inputs
  const inputs: CompletePortDef[] = [];
  if (live.i) {
    const inputTypes = Array.isArray(live.i) ? live.i : [live.i];
    inputTypes.forEach((t, i) => inputs.push(liveToCompletePort(t, i, true)));
  }
  
  // Parse outputs
  const outputs: CompletePortDef[] = [];
  if (live.o) {
    const outputTypes = Array.isArray(live.o) ? live.o : [live.o];
    outputTypes.forEach((t, i) => outputs.push(liveToCompletePort(t, i, false)));
  }
  
  // Parse params
  const params: CompleteParamDef[] = [];
  if (live.p) {
    for (const tuple of live.p) {
      params.push(liveToCompleteParam(tuple));
    }
  }
  
  const result: CompleteCardDef<A, B, S> = {
    id: `live.${live.n.toLowerCase().replace(/\s+/g, '-')}`,
    name: live.n,
    category: CATEGORY_SHORTHAND[live.c ?? 'u'] ?? 'custom',
    inputs,
    outputs,
    params,
    process: live.f,
  };
  if (live.s !== undefined) result.state = live.s;
  return result;
}

/**
 * Converts a complete card definition to a live card definition.
 * Useful for generating minimal code from verbose definitions.
 */
export function completeToLive<A, B, S>(complete: CompleteCardDef<A, B, S>): LiveCardDef<A, B, S> {
  // Find shortest category key
  const categoryKey = Object.entries(CATEGORY_SHORTHAND)
    .find(([_, v]) => v === complete.category)?.[0] as LiveCardDef['c'] | undefined;
  
  // Convert inputs to shorthand
  const inputTypes = complete.inputs.map(i => {
    const entry = Object.entries(PORT_SHORTHAND).find(([k, v]) => v === i.type && k.length === 1);
    return entry?.[0] ?? 'any';
  });
  
  // Convert outputs to shorthand
  const outputTypes = complete.outputs.map(o => {
    const entry = Object.entries(PORT_SHORTHAND).find(([k, v]) => v === o.type && k.length === 1);
    return entry?.[0] ?? 'any';
  });
  
  // Convert params to tuples
  const paramTuples: ParamTuple[] = complete.params.map(p => {
    if (p.min !== undefined && p.max !== undefined && typeof p.default === 'number') {
      return [p.name, p.default, p.min, p.max];
    }
    return [p.name, p.default as number | string | boolean] as ParamTuple;
  });
  
  const result: LiveCardDef<A, B, S> = {
    n: complete.name,
    f: complete.process,
  };
  if (categoryKey !== undefined) result.c = categoryKey;
  if (inputTypes.length === 1) result.i = inputTypes[0]!;
  else if (inputTypes.length > 0) result.i = inputTypes;
  if (outputTypes.length === 1) result.o = outputTypes[0]!;
  else if (outputTypes.length > 0) result.o = outputTypes;
  if (paramTuples.length > 0) result.p = paramTuples;
  if (complete.state !== undefined) result.s = complete.state;
  return result;
}

// ============================================================================
// CARD FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a native Card from a complete definition.
 */
export function cardFromComplete<A, B, S>(def: CompleteCardDef<A, B, S>): Card<A, B> {
  // Build meta options, only including defined properties
  const metaOpts: { description?: string; author?: string; version?: string; tags?: string[]; icon?: string; color?: string } = {};
  if (def.description !== undefined) metaOpts.description = def.description;
  if (def.author !== undefined) metaOpts.author = def.author;
  if (def.version !== undefined) metaOpts.version = def.version;
  if (def.tags !== undefined) metaOpts.tags = def.tags;
  if (def.icon !== undefined) metaOpts.icon = def.icon;
  if (def.color !== undefined) metaOpts.color = def.color;
  
  const meta = createCardMeta(def.id, def.name, def.category, metaOpts);
  
  const inputs = def.inputs.map(i => {
    const portOpts: { label?: string; description?: string; optional?: boolean; default?: unknown } = {};
    if (i.label !== undefined) portOpts.label = i.label;
    if (i.description !== undefined) portOpts.description = i.description;
    if (i.optional !== undefined) portOpts.optional = i.optional;
    if (i.default !== undefined) portOpts.default = i.default;
    return createPort(i.name, i.type, portOpts);
  });
  
  const outputs = def.outputs.map(o => {
    const portOpts: { label?: string; description?: string } = {};
    if (o.label !== undefined) portOpts.label = o.label;
    if (o.description !== undefined) portOpts.description = o.description;
    return createPort(o.name, o.type, portOpts);
  });
  
  const params = def.params.map(p => {
    const paramOpts: { min?: number; max?: number; step?: number; options?: unknown[]; label?: string; description?: string; unit?: string; automatable?: boolean } = {};
    if (p.min !== undefined) paramOpts.min = p.min;
    if (p.max !== undefined) paramOpts.max = p.max;
    if (p.step !== undefined) paramOpts.step = p.step;
    if (p.options !== undefined) paramOpts.options = p.options;
    if (p.label !== undefined) paramOpts.label = p.label;
    if (p.description !== undefined) paramOpts.description = p.description;
    if (p.unit !== undefined) paramOpts.unit = p.unit;
    if (p.automatable !== undefined) paramOpts.automatable = p.automatable;
    return createParam(p.name, p.type, p.default, paramOpts);
  });
  
  const signature = createSignature(inputs, outputs, params);
  
  // Build param defaults map for fast access
  const paramDefaults: Record<string, unknown> = {};
  for (const p of def.params) {
    paramDefaults[p.name] = p.default;
  }
  
  return createCard({
    meta,
    signature,
    ...(def.state !== undefined ? { initialState: def.state } : {}),
    process: (input: A, ctx: CardContext, stateContainer?: CardState<S>): CardResult<B> => {
      const state = (stateContainer?.value ?? def.state) as S;
      const result = def.process(input, ctx, state, paramDefaults);
      
      return {
        output: result.output,
        ...(result.state !== undefined ? {
          state: {
            value: result.state,
            version: (stateContainer?.version ?? 0) + 1,
          }
        } : {}),
      } as CardResult<B>;
    },
  });
}

/**
 * Creates a native Card from a live definition.
 */
export function cardFromLive<A, B, S>(def: LiveCardDef<A, B, S>): Card<A, B> {
  return cardFromComplete(liveToComplete(def));
}

// ============================================================================
// LIVE DSL HELPERS - ULTRA-SHORT SYNTAX
// ============================================================================

/**
 * Quick card creation for live coding.
 * 
 * @example
 * ```typescript
 * // Minimal gain card
 * const gain = card('Gain', 'e', 'a', 'a', [['gain', 1, 0, 2]],
 *   (input, ctx, state, p) => ({ output: input * p.gain })
 * );
 * 
 * // Even shorter with defaults
 * const amp = fx('Amp', (i, c, s, p) => ({ output: i * p.gain }), [['gain', 1, 0, 2]]);
 * ```
 */
export function card<A, B, S = undefined>(
  name: string,
  category: string,
  inputs: string | string[],
  outputs: string | string[],
  params: ParamTuple[],
  process: LiveCardDef<A, B, S>['f'],
  state?: S
): Card<A, B> {
  const c = category as LiveCardDef['c'];
  const liveDef: LiveCardDef<A, B, S> = {
    n: name,
    i: inputs,
    o: outputs,
    f: process,
  };
  if (c !== undefined) liveDef.c = c;
  if (params.length > 0) liveDef.p = params;
  if (state !== undefined) liveDef.s = state;
  return cardFromLive(liveDef);
}

// Category-specific shortcuts
export function gen<A, B, S = undefined>(
  name: string,
  process: LiveCardDef<A, B, S>['f'],
  params?: ParamTuple[],
  outputs: string | string[] = 'a',
  state?: S
): Card<A, B> {
  return card(name, 'g', [], outputs, params ?? [], process, state);
}

export function fx<A, B, S = undefined>(
  name: string,
  process: LiveCardDef<A, B, S>['f'],
  params?: ParamTuple[],
  inputs: string | string[] = 'a',
  outputs: string | string[] = 'a',
  state?: S
): Card<A, B> {
  return card(name, 'e', inputs, outputs, params ?? [], process, state);
}

export function xform<A, B, S = undefined>(
  name: string,
  process: LiveCardDef<A, B, S>['f'],
  params?: ParamTuple[],
  inputs: string | string[] = '*',
  outputs: string | string[] = '*',
  state?: S
): Card<A, B> {
  return card(name, 't', inputs, outputs, params ?? [], process, state);
}

export function filt<A, B, S = undefined>(
  name: string,
  process: LiveCardDef<A, B, S>['f'],
  params?: ParamTuple[],
  inputs: string | string[] = 'a',
  outputs: string | string[] = 'a',
  state?: S
): Card<A, B> {
  return card(name, 'f', inputs, outputs, params ?? [], process, state);
}

export function route<A, B, S = undefined>(
  name: string,
  process: LiveCardDef<A, B, S>['f'],
  params?: ParamTuple[],
  inputs: string | string[] = '*',
  outputs: string | string[] = '*',
  state?: S
): Card<A, B> {
  return card(name, 'r', inputs, outputs, params ?? [], process, state);
}

export function util<A, B, S = undefined>(
  name: string,
  process: LiveCardDef<A, B, S>['f'],
  params?: ParamTuple[],
  inputs: string | string[] = '*',
  outputs: string | string[] = '*',
  state?: S
): Card<A, B> {
  return card(name, 'u', inputs, outputs, params ?? [], process, state);
}

// ============================================================================
// LIVE PARAM HELPERS - QUICK PARAM CREATION
// ============================================================================

/** Number param: n('gain', 1, 0, 2) -> ['gain', 1, 0, 2] */
export const n = (name: string, def: number, min?: number, max?: number): ParamTuple =>
  min !== undefined && max !== undefined ? [name, def, min, max] : [name, def];

/** Boolean param: b('mute', false) -> ['mute', false] */
export const b = (name: string, def: boolean): ParamTuple => [name, def];

/** String param: s('mode', 'normal') -> ['mode', 'normal'] */
export const s = (name: string, def: string): ParamTuple => [name, def];

// ============================================================================
// LIVE MATH HELPERS - INLINED FOR PERFORMANCE
// ============================================================================

/** Clamp value between min and max */
export const clamp = (x: number, min: number, max: number): number =>
  x < min ? min : x > max ? max : x;

/** Linear interpolation */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/** Map value from one range to another */
export const map = (x: number, inMin: number, inMax: number, outMin: number, outMax: number): number =>
  outMin + (x - inMin) * (outMax - outMin) / (inMax - inMin);

/** MIDI note to frequency */
export const mtof = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);

/** Frequency to MIDI note */
export const ftom = (f: number): number => 69 + 12 * Math.log2(f / 440);

/** Decibels to amplitude */
export const dbtoa = (db: number): number => Math.pow(10, db / 20);

/** Amplitude to decibels */
export const atodb = (a: number): number => 20 * Math.log10(a);

/** Beats to milliseconds */
export const btoms = (beats: number, bpm: number): number => beats * 60000 / bpm;

/** Milliseconds to beats */
export const mstob = (ms: number, bpm: number): number => ms * bpm / 60000;

/** Smooth step */
export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Wrap value to range */
export const wrap = (x: number, min: number, max: number): number => {
  const range = max - min;
  return min + ((((x - min) % range) + range) % range);
};

/** Fold value to range (ping-pong) */
export const fold = (x: number, min: number, max: number): number => {
  const range = max - min;
  const phase = wrap(x - min, 0, range * 2);
  return min + (phase <= range ? phase : range * 2 - phase);
};

// ============================================================================
// LIVE SESSION CONTEXT
// ============================================================================

/**
 * Live session for real-time card management.
 */
export interface LiveSession {
  /** All active cards */
  readonly cards: Map<string, Card<unknown, unknown>>;
  /** Card states */
  readonly states: Map<string, CardState<unknown>>;
  /** Parameter overrides */
  readonly paramOverrides: Map<string, Record<string, unknown>>;
  /** Current tempo */
  tempo: number;
  /** Transport playing */
  playing: boolean;
}

/**
 * Creates a new live session.
 */
export function createLiveSession(): LiveSession {
  return {
    cards: new Map(),
    states: new Map(),
    paramOverrides: new Map(),
    tempo: 120,
    playing: false,
  };
}

/**
 * Adds a card to the live session.
 */
export function addCard(session: LiveSession, card: Card<unknown, unknown>): void {
  session.cards.set(card.meta.id, card);
  if (card.initialState) {
    session.states.set(card.meta.id, card.initialState);
  }
}

/**
 * Sets a parameter value for a card.
 */
export function setParam(session: LiveSession, cardId: string, param: string, value: unknown): void {
  let overrides = session.paramOverrides.get(cardId);
  if (!overrides) {
    overrides = {};
    session.paramOverrides.set(cardId, overrides);
  }
  overrides[param] = value;
}

/**
 * Quick param set: p(session, 'gain', 'level', 0.5)
 */
export const p = setParam;

// ============================================================================
// CARD INVOCATION - CALL COMPLEX CARDS WITH MINIMAL PARAMS
// ============================================================================

/**
 * Registry of complete card definitions for invocation.
 * Maps card ID to complete definition.
 */
const cardRegistry = new Map<string, CompleteCardDef<unknown, unknown, unknown>>();

/**
 * Registers a complete card definition for invocation.
 * 
 * Change 285: Validates card IDs and emits deprecation warnings for non-namespaced IDs.
 */
export function registerCard<A, B, S>(def: CompleteCardDef<A, B, S>): void {
  // Validate card ID (Change 285)
  if (!isNamespacedId(def.id)) {
    console.warn(
      `[DEPRECATED] Card ID '${def.id}' is not namespaced. ` +
      `User-authored cards should use namespaced IDs (e.g., 'mypack:${def.id}'). ` +
      `Non-namespaced IDs are reserved for builtin cards and may conflict with future builtins.`
    );
  }
  
  cardRegistry.set(def.id, def as CompleteCardDef<unknown, unknown, unknown>);
}

/**
 * Invocation options - only specify params you want to override.
 */
export type InvokeOptions = Record<string, unknown>;

/**
 * Invokes a registered card with minimal parameters.
 * 
 * Complex cards can have 20+ parameters, but you only need to
 * specify the ones you want to change from defaults.
 * 
 * @example
 * ```typescript
 * // Register a complex reverb card (50+ lines to define)
 * registerCard(ReverbComplete);
 * 
 * // Invoke with just 2 params (rest use defaults)
 * const reverb = invoke('fx.reverb', { size: 0.8, mix: 0.3 });
 * 
 * // Or invoke with no params at all (all defaults)
 * const defaultReverb = invoke('fx.reverb');
 * ```
 */
export function invoke(cardId: string, options: InvokeOptions = {}): Card<unknown, unknown> {
  const def = cardRegistry.get(cardId);
  if (!def) {
    throw new Error(`Card '${cardId}' not registered. Use registerCard() first.`);
  }
  
  // Build param defaults with overrides
  const paramValues: Record<string, unknown> = {};
  for (const param of def.params) {
    paramValues[param.name] = options[param.name] ?? param.default;
  }
  
  // Create the card with merged params
  return cardFromComplete({
    ...def,
    params: def.params.map(p => ({
      ...p,
      default: paramValues[p.name] ?? p.default,
    })),
  });
}

/**
 * Short alias for invoke.
 * 
 * @example
 * ```typescript
 * const r = i('fx.reverb', { size: 0.8 });
 * const d = i('fx.delay', { time: 250, fb: 0.4 });
 * ```
 */
export const i = invoke;

/**
 * Bulk register multiple cards.
 */
export function registerCards(defs: CompleteCardDef<unknown, unknown, unknown>[]): void {
  for (const def of defs) {
    registerCard(def);
  }
}

/**
 * Creates an invocation helper for a specific card.
 * Returns a function that only needs the override params.
 * 
 * @example
 * ```typescript
 * // Create a quick invoker
 * const reverb = invoker('fx.reverb');
 * 
 * // Now use it repeatedly with different params
 * const r1 = reverb({ size: 0.5 });
 * const r2 = reverb({ size: 0.9, mix: 0.6 });
 * const r3 = reverb(); // all defaults
 * ```
 */
export function invoker(cardId: string): (options?: InvokeOptions) => Card<unknown, unknown> {
  return (options = {}) => invoke(cardId, options);
}

/**
 * Pre-built invokers for common operations.
 * Populated when cards are registered.
 */
export const invokers: Record<string, (options?: InvokeOptions) => Card<unknown, unknown>> = {};

/**
 * Auto-create invoker when registering.
 */
export function registerCardWithInvoker<A, B, S>(def: CompleteCardDef<A, B, S>): (options?: InvokeOptions) => Card<unknown, unknown> {
  registerCard(def);
  const inv = invoker(def.id);
  // Also add short name
  const shortName = def.id.split('.').pop() ?? def.id;
  invokers[shortName] = inv;
  invokers[def.id] = inv;
  return inv;
}

// ============================================================================
// CHAIN INVOCATION - COMPOSE CARDS INLINE
// ============================================================================

/**
 * Chain multiple card invocations together.
 * 
 * @example
 * ```typescript
 * // Create a processing chain with minimal params
 * const chain = invokeChain([
 *   ['fx.gain', { gain: 0.8 }],
 *   ['fx.filter', { cutoff: 2000 }],
 *   ['fx.reverb', { size: 0.6 }],
 *   ['fx.delay', { time: 250 }],
 * ]);
 * // chain is an array of configured cards
 * ```
 */
export function invokeChain(specs: Array<[string, InvokeOptions?]>): Card<unknown, unknown>[] {
  return specs.map(([id, opts]) => invoke(id, opts ?? {}));
}

/**
 * Short alias for invokeChain.
 */
export const ic = invokeChain;

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
// COMPLETE VERSION (LLM-friendly, verbose):
const gainComplete: CompleteCardDef<number, number> = {
  id: 'fx.gain',
  name: 'Gain',
  category: 'effects',
  description: 'Adjusts the amplitude of an audio signal',
  author: 'cardplay',
  version: '1.0.0',
  tags: ['audio', 'volume', 'amplitude'],
  inputs: [
    { name: 'input', type: PortTypes.AUDIO, label: 'Audio Input', description: 'The audio signal to process' }
  ],
  outputs: [
    { name: 'output', type: PortTypes.AUDIO, label: 'Audio Output', description: 'The processed audio signal' }
  ],
  params: [
    { name: 'gain', type: 'number', default: 1.0, min: 0, max: 2, step: 0.01, label: 'Gain', unit: 'x', automatable: true }
  ],
  process: (input, ctx, state, params) => ({
    output: input * (params.gain as number)
  })
};

// LIVE VERSION (performance-friendly, minimal):
const gainLive = fx('Gain',
  (i, c, s, p) => ({ output: i * p.gain }),
  [n('gain', 1, 0, 2)]
);

// ULTRA-SHORT (one-liner):
const g = fx('G', (i,c,s,p) => ({output: i * p.g}), [n('g',1,0,2)]);
*/
