/**
 * @fileoverview CardScript Invocation - Call complex cards with minimal params.
 * 
 * Provides a simplified interface for invoking cards, decks, presets, triggers,
 * scenes, clips, and phrases as first-class live coding elements.
 * 
 * Philosophy: Define once (complete), invoke many times (live).
 * 
 * @module @cardplay/user-cards/cardscript/invoke
 */

import type { Card, CardContext, CardState } from '../../cards/card';
import type { CompleteCardDef, LiveCardDef } from './live';
import { cardFromComplete, cardFromLive } from './live';

// ============================================================================
// INVOCATION REGISTRY - Singleton for fast lookups
// ============================================================================

/** Global card registry for invocation */
const cardRegistry = new Map<string, Card<unknown, unknown>>();

/** Global preset registry */
const presetRegistry = new Map<string, PresetDef>();

/** Global deck registry */
const deckRegistry = new Map<string, DeckDef>();

/** Global scene registry */
const sceneRegistry = new Map<string, SceneDef>();

/** Global clip registry */
const clipRegistry = new Map<string, ClipDef>();

/** Global phrase registry */
const phraseRegistry = new Map<string, PhraseDef>();

/** Global trigger registry */
const triggerRegistry = new Map<string, TriggerDef>();

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Parameter override for invocation */
export type ParamOverrides = Record<string, unknown>;

/** Invocation result */
export interface InvokeResult<T> {
  readonly value: T;
  readonly state?: CardState<unknown>;
  readonly timing?: { durationMs: number };
}

/** Preset definition - named parameter configurations */
export interface PresetDef {
  readonly id: string;
  readonly name: string;
  readonly cardId: string;
  readonly params: ParamOverrides;
  readonly tags?: string[];
}

/** Deck definition - ordered collection of cards */
export interface DeckDef {
  readonly id: string;
  readonly name: string;
  readonly cards: readonly string[];
  readonly routing?: 'series' | 'parallel' | 'random';
  readonly tags?: string[];
}

/** Scene definition - snapshot of multiple card states */
export interface SceneDef {
  readonly id: string;
  readonly name: string;
  readonly cardStates: Record<string, ParamOverrides>;
  readonly transitionMs?: number;
  readonly tags?: string[];
}

/** Clip definition - time-bounded automation */
export interface ClipDef {
  readonly id: string;
  readonly name: string;
  readonly cardId: string;
  readonly durationBeats: number;
  readonly automation: AutomationLane[];
  readonly tags?: string[];
}

/** Automation lane */
export interface AutomationLane {
  readonly param: string;
  readonly points: AutomationPoint[];
  readonly curve?: 'linear' | 'exponential' | 'step';
}

/** Automation point */
export interface AutomationPoint {
  readonly beat: number;
  readonly value: number;
}

/** Phrase definition - musical pattern */
export interface PhraseDef {
  readonly id: string;
  readonly name: string;
  readonly lengthBeats: number;
  readonly notes: NoteEvent[];
  readonly tags?: string[];
}

/** Note event in phrase */
export interface NoteEvent {
  readonly beat: number;
  readonly pitch: number;
  readonly velocity: number;
  readonly duration: number;
  readonly channel?: number;
}

/** Trigger definition - event handler */
export interface TriggerDef {
  readonly id: string;
  readonly name: string;
  readonly event: TriggerEvent;
  readonly action: TriggerAction;
  readonly tags?: string[];
}

/** Trigger event types */
export type TriggerEvent =
  | { type: 'midi'; note?: number; cc?: number; channel?: number }
  | { type: 'beat'; division: number; offset?: number }
  | { type: 'bar'; every?: number }
  | { type: 'cue'; name: string }
  | { type: 'param'; cardId: string; param: string; condition: 'above' | 'below' | 'equals'; value: number };

/** Trigger action types */
export type TriggerAction =
  | { type: 'invoke'; cardId: string; params?: ParamOverrides }
  | { type: 'scene'; sceneId: string }
  | { type: 'preset'; presetId: string }
  | { type: 'clip'; clipId: string }
  | { type: 'phrase'; phraseId: string }
  | { type: 'param'; cardId: string; param: string; value: unknown }
  | { type: 'custom'; fn: (ctx: CardContext) => void };

/** Multi-clip definition - layered clips */
export interface MultiClipDef {
  readonly id: string;
  readonly name: string;
  readonly clips: readonly string[];
  readonly sync?: boolean;
  readonly tags?: string[];
}

// ============================================================================
// REGISTRATION FUNCTIONS
// ============================================================================

/**
 * Registers a card for invocation (complete definition).
 */
export function registerCard(def: CompleteCardDef<unknown, unknown, unknown>): string {
  const card = cardFromComplete(def);
  cardRegistry.set(def.id, card);
  return def.id;
}

/**
 * Registers a card for invocation (live definition).
 */
export function registerLiveCard(def: LiveCardDef<unknown, unknown, unknown>): string {
  const card = cardFromLive(def);
  const id = `live.${def.n.toLowerCase().replace(/\s+/g, '-')}`;
  cardRegistry.set(id, card);
  return id;
}

/**
 * Registers a preset.
 */
export function registerPreset(preset: PresetDef): void {
  presetRegistry.set(preset.id, preset);
}

/**
 * Registers a deck.
 */
export function registerDeck(deck: DeckDef): void {
  deckRegistry.set(deck.id, deck);
}

/**
 * Registers a scene.
 */
export function registerScene(scene: SceneDef): void {
  sceneRegistry.set(scene.id, scene);
}

/**
 * Registers a clip.
 */
export function registerClip(clip: ClipDef): void {
  clipRegistry.set(clip.id, clip);
}

/**
 * Registers a phrase.
 */
export function registerPhrase(phrase: PhraseDef): void {
  phraseRegistry.set(phrase.id, phrase);
}

/**
 * Registers a trigger.
 */
export function registerTrigger(trigger: TriggerDef): void {
  triggerRegistry.set(trigger.id, trigger);
}

// ============================================================================
// INVOCATION FUNCTIONS - Call complex cards with minimal params
// ============================================================================

/** Cached card states for stateful invocations */
const cardStates = new Map<string, CardState<unknown>>();

/** Cached param values per card */
const cardParams = new Map<string, ParamOverrides>();

/**
 * Invokes a card by ID with optional parameter overrides.
 * 
 * @example
 * ```typescript
 * // Register once (complex definition)
 * registerCard(MyComplexReverbDefinition);
 * 
 * // Invoke many times (simple calls)
 * invoke('fx.reverb', input, ctx);
 * invoke('fx.reverb', input, ctx, { mix: 0.8 });
 * invoke('fx.reverb', input, ctx, { decay: 2.5, mix: 0.6 });
 * ```
 */
export function invoke<T>(
  cardId: string,
  input: unknown,
  ctx: CardContext,
  params?: ParamOverrides
): InvokeResult<T> {
  const card = cardRegistry.get(cardId);
  if (!card) {
    throw new Error(`Card not found: ${cardId}`);
  }
  
  // Get or create state
  let state = cardStates.get(cardId);
  if (!state && card.initialState) {
    state = card.initialState;
  }
  
  // Merge params
  const baseParams = cardParams.get(cardId) ?? {};
  const mergedParams = params ? { ...baseParams, ...params } : baseParams;
  
  // Store merged params for next call
  if (params) {
    cardParams.set(cardId, mergedParams);
  }
  
  const startMs = performance.now();
  const result = card.process(input, ctx, state);
  const durationMs = performance.now() - startMs;
  
  // Update state
  if (result.state) {
    cardStates.set(cardId, result.state);
  }
  
  return {
    value: result.output as T,
    timing: { durationMs },
    ...(result.state ? { state: result.state } : {}),
  } as InvokeResult<T>;
}

/**
 * Short alias for invoke.
 */
export const i = invoke;

/**
 * Invokes a preset by ID.
 */
export function invokePreset<T>(
  presetId: string,
  input: unknown,
  ctx: CardContext,
  extraParams?: ParamOverrides
): InvokeResult<T> {
  const preset = presetRegistry.get(presetId);
  if (!preset) {
    throw new Error(`Preset not found: ${presetId}`);
  }
  
  const params = extraParams ? { ...preset.params, ...extraParams } : preset.params;
  return invoke<T>(preset.cardId, input, ctx, params);
}

/**
 * Short alias for invokePreset.
 */
export const ip = invokePreset;

/**
 * Invokes all cards in a deck.
 */
export function invokeDeck<T>(
  deckId: string,
  input: unknown,
  ctx: CardContext,
  cardParams?: Record<string, ParamOverrides>
): InvokeResult<T>[] {
  const deck = deckRegistry.get(deckId);
  if (!deck) {
    throw new Error(`Deck not found: ${deckId}`);
  }
  
  const results: InvokeResult<T>[] = [];
  let currentInput = input;
  
  for (const cardId of deck.cards) {
    const params = cardParams?.[cardId];
    const result = invoke<T>(cardId, currentInput, ctx, params);
    results.push(result);
    
    // For series routing, chain outputs
    if (deck.routing === 'series' || deck.routing === undefined) {
      currentInput = result.value;
    }
  }
  
  return results;
}

/**
 * Short alias for invokeDeck.
 */
export const id = invokeDeck;

// ============================================================================
// LIVE CODING SHORTCUTS - Ultra-minimal syntax
// ============================================================================

/**
 * Sets a parameter on a card (persists across invocations).
 * 
 * @example
 * ```typescript
 * set('fx.reverb', 'mix', 0.8);
 * set('fx.reverb', { mix: 0.8, decay: 2.5 });
 * ```
 */
export function set(cardId: string, param: string | ParamOverrides, value?: unknown): void {
  const existing = cardParams.get(cardId) ?? {};
  
  if (typeof param === 'string') {
    cardParams.set(cardId, { ...existing, [param]: value });
  } else {
    cardParams.set(cardId, { ...existing, ...param });
  }
}

/**
 * Gets current parameter value.
 */
export function get(cardId: string, param: string): unknown {
  return cardParams.get(cardId)?.[param];
}

/**
 * Resets card state.
 */
export function reset(cardId: string): void {
  cardStates.delete(cardId);
  cardParams.delete(cardId);
}

/**
 * Resets all cards.
 */
export function resetAll(): void {
  cardStates.clear();
  cardParams.clear();
}

// ============================================================================
// SCENE INVOCATION
// ============================================================================

/** Active scene */
let activeScene: string | null = null;

/** Scene transition state */
let sceneTransition: {
  from: SceneDef | null;
  to: SceneDef;
  startMs: number;
  durationMs: number;
} | null = null;

/**
 * Switches to a scene.
 */
export function scene(sceneId: string): void {
  const sceneDef = sceneRegistry.get(sceneId);
  if (!sceneDef) {
    throw new Error(`Scene not found: ${sceneId}`);
  }
  
  const fromScene = activeScene ? sceneRegistry.get(activeScene) ?? null : null;
  
  if (sceneDef.transitionMs && sceneDef.transitionMs > 0) {
    sceneTransition = {
      from: fromScene,
      to: sceneDef,
      startMs: performance.now(),
      durationMs: sceneDef.transitionMs,
    };
  } else {
    // Immediate switch
    applyScene(sceneDef);
  }
  
  activeScene = sceneId;
}

/**
 * Applies scene parameters immediately.
 */
function applyScene(sceneDef: SceneDef): void {
  for (const [cardId, params] of Object.entries(sceneDef.cardStates)) {
    cardParams.set(cardId, params);
  }
}

/**
 * Updates scene transition (call in process loop).
 */
export function updateSceneTransition(): void {
  if (!sceneTransition) return;
  
  const elapsed = performance.now() - sceneTransition.startMs;
  const t = Math.min(1, elapsed / sceneTransition.durationMs);
  
  if (t >= 1) {
    applyScene(sceneTransition.to);
    sceneTransition = null;
    return;
  }
  
  // Interpolate parameters
  const fromParams = sceneTransition.from?.cardStates ?? {};
  const toParams = sceneTransition.to.cardStates;
  
  for (const [cardId, toCardParams] of Object.entries(toParams)) {
    const fromCardParams = fromParams[cardId] ?? {};
    const interpolated: ParamOverrides = {};
    
    for (const [param, toValue] of Object.entries(toCardParams)) {
      if (typeof toValue === 'number') {
        const fromValue = (fromCardParams[param] as number) ?? toValue;
        interpolated[param] = fromValue + (toValue - fromValue) * t;
      } else {
        interpolated[param] = t >= 0.5 ? toValue : fromCardParams[param] ?? toValue;
      }
    }
    
    cardParams.set(cardId, interpolated);
  }
}

// ============================================================================
// CLIP PLAYBACK
// ============================================================================

/** Active clips */
const activeClips = new Map<string, {
  clip: ClipDef;
  startBeat: number;
  loop: boolean;
}>();

/**
 * Plays a clip.
 */
export function playClip(clipId: string, startBeat: number, loop = false): void {
  const clip = clipRegistry.get(clipId);
  if (!clip) {
    throw new Error(`Clip not found: ${clipId}`);
  }
  
  activeClips.set(clipId, { clip, startBeat, loop });
}

/**
 * Stops a clip.
 */
export function stopClip(clipId: string): void {
  activeClips.delete(clipId);
}

/**
 * Updates clip automation (call in process loop).
 */
export function updateClips(currentBeat: number): void {
  const entries = Array.from(activeClips.entries());
  for (const [clipId, state] of entries) {
    const { clip, startBeat, loop } = state;
    let beatInClip = currentBeat - startBeat;
    
    if (beatInClip < 0) continue;
    
    if (loop) {
      beatInClip = beatInClip % clip.durationBeats;
    } else if (beatInClip >= clip.durationBeats) {
      activeClips.delete(clipId);
      continue;
    }
    
    // Apply automation
    for (const lane of clip.automation) {
      const value = getAutomationValue(lane, beatInClip);
      set(clip.cardId, lane.param, value);
    }
  }
}

/**
 * Gets automation value at beat.
 */
function getAutomationValue(lane: AutomationLane, beat: number): number {
  const points = lane.points;
  if (points.length === 0) return 0;
  if (points.length === 1) return points[0]!.value;
  
  // Find surrounding points
  let prev = points[0]!;
  let next = points[points.length - 1]!;
  
  for (let i = 0; i < points.length - 1; i++) {
    if (points[i]!.beat <= beat && points[i + 1]!.beat > beat) {
      prev = points[i]!;
      next = points[i + 1]!;
      break;
    }
  }
  
  if (beat <= prev.beat) return prev.value;
  if (beat >= next.beat) return next.value;
  
  const t = (beat - prev.beat) / (next.beat - prev.beat);
  
  switch (lane.curve) {
    case 'step':
      return prev.value;
    case 'exponential':
      return prev.value * Math.pow(next.value / prev.value, t);
    default: // linear
      return prev.value + (next.value - prev.value) * t;
  }
}

// ============================================================================
// PHRASE PLAYBACK
// ============================================================================

/** Active phrases */
const activePhrases = new Map<string, {
  phrase: PhraseDef;
  startBeat: number;
  loop: boolean;
  noteOnCallback?: (note: NoteEvent) => void;
  noteOffCallback?: (note: NoteEvent) => void;
}>();

/** Currently playing notes (for note off tracking) */
const playingNotes = new Map<string, NoteEvent[]>();

/**
 * Plays a phrase.
 */
export function playPhrase(
  phraseId: string,
  startBeat: number,
  loop = false,
  noteOnCallback?: (note: NoteEvent) => void,
  noteOffCallback?: (note: NoteEvent) => void
): void {
  const phrase = phraseRegistry.get(phraseId);
  if (!phrase) {
    throw new Error(`Phrase not found: ${phraseId}`);
  }
  
  const phraseState: { phrase: PhraseDef; startBeat: number; loop: boolean; noteOnCallback?: (note: NoteEvent) => void; noteOffCallback?: (note: NoteEvent) => void } = { phrase, startBeat, loop };
  if (noteOnCallback) phraseState.noteOnCallback = noteOnCallback;
  if (noteOffCallback) phraseState.noteOffCallback = noteOffCallback;
  activePhrases.set(phraseId, phraseState);
  playingNotes.set(phraseId, []);
}

/**
 * Stops a phrase.
 */
export function stopPhrase(phraseId: string): void {
  const state = activePhrases.get(phraseId);
  if (state) {
    // Note off for all playing notes
    const notes = playingNotes.get(phraseId) ?? [];
    for (const note of notes) {
      state.noteOffCallback?.(note);
    }
  }
  activePhrases.delete(phraseId);
  playingNotes.delete(phraseId);
}

/**
 * Updates phrase playback (call in process loop).
 */
export function updatePhrases(currentBeat: number, prevBeat: number): void {
  const entries = Array.from(activePhrases.entries());
  for (const [phraseId, state] of entries) {
    const { phrase, startBeat, loop, noteOnCallback, noteOffCallback } = state;
    let beatInPhrase = currentBeat - startBeat;
    let prevBeatInPhrase = prevBeat - startBeat;
    
    if (beatInPhrase < 0) continue;
    
    if (loop) {
      beatInPhrase = beatInPhrase % phrase.lengthBeats;
      prevBeatInPhrase = prevBeatInPhrase % phrase.lengthBeats;
      // Handle loop wrap
      if (prevBeatInPhrase > beatInPhrase) {
        prevBeatInPhrase = -0.001;
      }
    } else if (beatInPhrase >= phrase.lengthBeats) {
      stopPhrase(phraseId);
      continue;
    }
    
    const notes = playingNotes.get(phraseId) ?? [];
    
    // Note offs
    for (let i = notes.length - 1; i >= 0; i--) {
      const note = notes[i]!;
      if (beatInPhrase >= note.beat + note.duration) {
        noteOffCallback?.(note);
        notes.splice(i, 1);
      }
    }
    
    // Note ons
    for (const note of phrase.notes) {
      if (note.beat > prevBeatInPhrase && note.beat <= beatInPhrase) {
        noteOnCallback?.(note);
        notes.push(note);
      }
    }
  }
}

// ============================================================================
// TRIGGER SYSTEM
// ============================================================================

/** Active triggers */
const activeTriggers = new Set<string>();

/**
 * Activates a trigger.
 */
export function activateTrigger(triggerId: string): void {
  activeTriggers.add(triggerId);
}

/**
 * Deactivates a trigger.
 */
export function deactivateTrigger(triggerId: string): void {
  activeTriggers.delete(triggerId);
}

/**
 * Checks and fires triggers (call in process loop).
 */
export function updateTriggers(ctx: CardContext, midiEvents?: { note?: number; cc?: number; channel?: number }[]): void {
  const currentBeat = ctx.currentTick; // Assuming tick is beat-based
  const triggerIds = Array.from(activeTriggers);
  
  for (const triggerId of triggerIds) {
    const trigger = triggerRegistry.get(triggerId);
    if (!trigger) continue;
    
    let shouldFire = false;
    const event = trigger.event;
    
    switch (event.type) {
      case 'beat':
        // Check if we crossed a beat division
        shouldFire = Math.floor(currentBeat / event.division) !== Math.floor((currentBeat - 1) / event.division);
        break;
        
      case 'bar': {
        const beatsPerBar = ctx.transport.timeSignature[0];
        const everyBars = event.every ?? 1;
        shouldFire = Math.floor(currentBeat / (beatsPerBar * everyBars)) !== Math.floor((currentBeat - 1) / (beatsPerBar * everyBars));
        break;
      }
        
      case 'midi':
        if (midiEvents) {
          const midiEvent = event;  // Narrowed to midi type
          shouldFire = midiEvents.some(e => 
            (midiEvent.note === undefined || e.note === midiEvent.note) &&
            (midiEvent.cc === undefined || e.cc === midiEvent.cc) &&
            (midiEvent.channel === undefined || e.channel === midiEvent.channel)
          );
        }
        break;
        
      case 'param': {
        const paramEvent = event;  // Narrowed to param type
        const value = get(paramEvent.cardId, paramEvent.param) as number;
        switch (paramEvent.condition) {
          case 'above': shouldFire = value > paramEvent.value; break;
          case 'below': shouldFire = value < paramEvent.value; break;
          case 'equals': shouldFire = value === paramEvent.value; break;
        }
        break;
      }
    }
    
    if (shouldFire) {
      fireTriggerAction(trigger.action, ctx);
    }
  }
}

/**
 * Fires a trigger action.
 */
function fireTriggerAction(action: TriggerAction, ctx: CardContext): void {
  switch (action.type) {
    case 'invoke':
      invoke(action.cardId, null, ctx, action.params);
      break;
    case 'scene':
      scene(action.sceneId);
      break;
    case 'preset':
      invokePreset(action.presetId, null, ctx);
      break;
    case 'clip':
      playClip(action.clipId, ctx.currentTick, true);
      break;
    case 'phrase':
      playPhrase(action.phraseId, ctx.currentTick, true);
      break;
    case 'param':
      set(action.cardId, action.param, action.value);
      break;
    case 'custom':
      action.fn(ctx);
      break;
  }
}

// ============================================================================
// LIVE CODING DSL - One-liners for performance
// ============================================================================

/**
 * Quick preset creation.
 * @example pre('verb.hall', 'fx.reverb', { decay: 3, mix: 0.6 })
 */
export function pre(id: string, cardId: string, params: ParamOverrides): void {
  registerPreset({ id, name: id, cardId, params });
}

/**
 * Quick deck creation.
 * @example deck('chain.bass', ['fx.comp', 'fx.dist', 'fx.eq'])
 */
export function deck(id: string, cards: string[], routing: DeckDef['routing'] = 'series'): void {
  registerDeck({ id, name: id, cards, routing });
}

/**
 * Quick scene creation.
 * @example scn('dark', { 'fx.reverb': { decay: 5 }, 'fx.filter': { cutoff: 200 } })
 */
export function scn(id: string, cardStates: Record<string, ParamOverrides>, transitionMs?: number): void {
  registerScene({
    id,
    name: id,
    cardStates,
    ...(transitionMs !== undefined ? { transitionMs } : {}),
  });
}

/**
 * Quick clip creation.
 * @example clip('wobble', 'fx.filter', 4, [{ param: 'cutoff', points: [{beat:0,value:200},{beat:2,value:2000},{beat:4,value:200}] }])
 */
export function clip(id: string, cardId: string, durationBeats: number, automation: AutomationLane[]): void {
  registerClip({ id, name: id, cardId, durationBeats, automation });
}

/**
 * Quick phrase creation.
 * @example phr('bass', 4, [{beat:0,pitch:36,velocity:100,duration:0.5}, ...])
 */
export function phr(id: string, lengthBeats: number, notes: NoteEvent[]): void {
  registerPhrase({ id, name: id, lengthBeats, notes });
}

/**
 * Quick trigger creation.
 * @example trig('kick', {type:'midi',note:36}, {type:'invoke',cardId:'gen.kick'})
 */
export function trig(id: string, event: TriggerEvent, action: TriggerAction): void {
  registerTrigger({ id, name: id, event, action });
}

/**
 * Quick note creation for phrases.
 * @example nt(0, 60, 100, 1) -> {beat:0, pitch:60, velocity:100, duration:1}
 */
export function nt(beat: number, pitch: number, velocity = 100, duration = 0.25): NoteEvent {
  return { beat, pitch, velocity, duration };
}

/**
 * Quick automation point.
 * @example pt(0, 200) -> {beat:0, value:200}
 */
export function pt(beat: number, value: number): AutomationPoint {
  return { beat, value };
}

/**
 * Quick automation lane.
 * @example lane('cutoff', [pt(0,200), pt(2,2000)])
 */
export function lane(param: string, points: AutomationPoint[], curve?: AutomationLane['curve']): AutomationLane {
  return {
    param,
    points,
    ...(curve !== undefined ? { curve } : {}),
  };
}
