/**
 * CardScript Live Mode Extensions
 * 
 * Provides advanced real-time features for live coding:
 * - Hot-reload without audio glitches
 * - Undo/redo stack
 * - Parameter interpolation
 * - Beat-synchronized parameter changes
 * - Macro system
 * - Keyboard shortcuts
 * 
 * @module cardscript/live-mode
 */

import type { Card, CardContext, CardState, CardResult } from '../../cards/card';
import type { CompleteCardDef, LiveSession } from './live';
import { cardFromComplete, clamp, lerp } from './live';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Hot-reload state for a card.
 */
export interface HotReloadState<S = unknown> {
  /** Current card definition */
  definition: CompleteCardDef<unknown, unknown, S>;
  /** Compiled card */
  card: Card<unknown, unknown>;
  /** Current state */
  state: CardState<S> | null;
  /** Parameter values */
  params: Record<string, unknown>;
  /** Whether a reload is pending */
  pendingReload: boolean;
  /** Crossfade progress (0-1) */
  crossfadeProgress: number;
  /** Previous card during crossfade */
  previousCard: Card<unknown, unknown> | null;
  /** Previous state during crossfade */
  previousState: CardState<S> | null;
}

/**
 * Undo/redo action.
 */
export interface UndoAction {
  /** Action type */
  type: 'param-change' | 'card-add' | 'card-remove' | 'card-replace' | 'macro-trigger';
  /** Timestamp */
  timestamp: number;
  /** Card ID affected */
  cardId?: string;
  /** Parameter name */
  paramName?: string;
  /** Previous value */
  oldValue: unknown;
  /** New value */
  newValue: unknown;
  /** Optional description */
  description?: string;
}

/**
 * Undo/redo stack.
 */
export interface UndoStack {
  /** Past actions (can undo) */
  past: UndoAction[];
  /** Future actions (can redo) */
  future: UndoAction[];
  /** Maximum stack size */
  maxSize: number;
  /** Whether recording is enabled */
  recording: boolean;
}

/**
 * Parameter interpolation curve.
 */
export type InterpolationCurve = 
  | 'linear'
  | 'exponential'
  | 'logarithmic'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'step'
  | 'smooth-step';

/**
 * Parameter interpolation state.
 */
export interface InterpolationState {
  /** Card ID */
  cardId: string;
  /** Parameter name */
  paramName: string;
  /** Start value */
  startValue: number;
  /** End value */
  endValue: number;
  /** Start time (ms) */
  startTime: number;
  /** Duration (ms) */
  duration: number;
  /** Interpolation curve */
  curve: InterpolationCurve;
  /** Callback when complete */
  onComplete?: (() => void) | undefined;
}

/**
 * Beat-sync quantization.
 */
export type BeatQuantize = 
  | '1/1'    // Whole note
  | '1/2'    // Half note
  | '1/4'    // Quarter note
  | '1/8'    // Eighth note
  | '1/16'   // Sixteenth note
  | '1/32'   // Thirty-second note
  | '1/2T'   // Half note triplet
  | '1/4T'   // Quarter note triplet
  | '1/8T'   // Eighth note triplet
  | 'bar'    // Next bar
  | 'beat'   // Next beat
  | 'off';   // No quantization

/**
 * Beat-sync scheduled change.
 */
export interface BeatSyncChange {
  /** Unique ID */
  id: string;
  /** Card ID */
  cardId: string;
  /** Parameter name */
  paramName: string;
  /** New value */
  value: unknown;
  /** Beat quantization */
  quantize: BeatQuantize;
  /** Scheduled beat position */
  scheduledBeat?: number | undefined;
  /** Whether to interpolate */
  interpolate: boolean;
  /** Interpolation duration (beats) */
  interpolationBeats?: number | undefined;
  /** Interpolation curve */
  curve?: InterpolationCurve | undefined;
}

/**
 * Macro definition.
 */
export interface MacroDef {
  /** Macro name */
  name: string;
  /** Macro ID */
  id: string;
  /** Description */
  description?: string | undefined;
  /** Parameter mappings */
  mappings: MacroMapping[];
  /** Current value (0-1) */
  value: number;
  /** Default value */
  defaultValue: number;
  /** Keyboard shortcut */
  shortcut?: string | undefined;
}

/**
 * Macro parameter mapping.
 */
export interface MacroMapping {
  /** Target card ID */
  cardId: string;
  /** Target parameter */
  paramName: string;
  /** Minimum value (when macro = 0) */
  minValue: number;
  /** Maximum value (when macro = 1) */
  maxValue: number;
  /** Mapping curve */
  curve?: InterpolationCurve;
}

/**
 * Keyboard shortcut definition.
 */
export interface KeyboardShortcut {
  /** Key code */
  key: string;
  /** Modifier keys */
  modifiers: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  };
  /** Action to perform */
  action: ShortcutAction;
  /** Description */
  description: string;
}

/**
 * Shortcut action.
 */
export type ShortcutAction =
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'set-param'; cardId: string; paramName: string; value: unknown }
  | { type: 'toggle-param'; cardId: string; paramName: string }
  | { type: 'increment-param'; cardId: string; paramName: string; amount: number }
  | { type: 'trigger-macro'; macroId: string; value?: number }
  | { type: 'stop-all' }
  | { type: 'play-pause' }
  | { type: 'tap-tempo' }
  | { type: 'custom'; handler: () => void };

// ============================================================================
// HOT RELOAD MANAGER
// ============================================================================

/**
 * Manages hot-reloading of cards without audio glitches.
 */
export class HotReloadManager {
  private cards = new Map<string, HotReloadState>();
  private crossfadeDuration = 50; // ms
  private pendingReloads: string[] = [];

  /**
   * Sets the crossfade duration for hot reloads.
   */
  setCrossfadeDuration(ms: number): void {
    this.crossfadeDuration = Math.max(0, ms);
  }

  /**
   * Registers a card for hot-reload management.
   */
  register<S>(def: CompleteCardDef<unknown, unknown, S>): Card<unknown, unknown> {
    const card = cardFromComplete(def);
    const state: HotReloadState = {
      definition: def as CompleteCardDef<unknown, unknown, unknown>,
      card,
      state: (card.initialState ?? null) as CardState<unknown> | null,
      params: {},
      pendingReload: false,
      crossfadeProgress: 1,
      previousCard: null,
      previousState: null,
    };
    
    // Initialize params with defaults
    for (const p of def.params) {
      state.params[p.name] = p.default;
    }
    
    this.cards.set(def.id, state as HotReloadState);
    return card;
  }

  /**
   * Hot-reloads a card definition without audio glitch.
   */
  reload<S>(def: CompleteCardDef<unknown, unknown, S>): void {
    const existing = this.cards.get(def.id);
    if (!existing) {
      // New card, just register
      this.register(def);
      return;
    }

    // Create new card
    const newCard = cardFromComplete(def);
    
    // Start crossfade
    existing.previousCard = existing.card;
    existing.previousState = existing.state;
    existing.card = newCard;
    existing.definition = def as CompleteCardDef<unknown, unknown, unknown>;
    existing.crossfadeProgress = 0;
    existing.pendingReload = false;
    
    // Try to preserve state if compatible
    if (existing.state && newCard.initialState) {
      // Shallow merge state
      existing.state = {
        ...(existing.state as object),
        ...(newCard.initialState as object),
        version: (existing.state.version ?? 0) + 1,
      } as CardState<unknown>;
    }
    
    this.pendingReloads.push(def.id);
  }

  /**
   * Schedules a reload for the next safe moment.
   */
  scheduleReload<S>(def: CompleteCardDef<unknown, unknown, S>): void {
    const existing = this.cards.get(def.id);
    if (existing) {
      existing.pendingReload = true;
    }
    // Store pending definition
    this.reload(def);
  }

  /**
   * Processes audio with crossfade handling.
   */
  process<A, B>(
    cardId: string,
    input: A,
    ctx: CardContext,
    deltaTime: number
  ): B | null {
    const state = this.cards.get(cardId);
    if (!state) return null;

    try {
      // Handle crossfade
      if (state.crossfadeProgress < 1 && state.previousCard) {
        // Update crossfade progress
        state.crossfadeProgress = Math.min(1, state.crossfadeProgress + deltaTime / this.crossfadeDuration);
        
        // Process both old and new
        const oldResult = state.previousCard.process(
          input,
          ctx,
          state.previousState ?? undefined
        ) as CardResult<B>;
        
        const newResult = state.card.process(
          input,
          ctx,
          state.state ?? undefined
        ) as CardResult<B>;
        
        // Update state from new card
        if (newResult.state) {
          state.state = newResult.state as CardState<unknown>;
        }
        
        // Crossfade outputs (if numeric)
        if (typeof oldResult.output === 'number' && typeof newResult.output === 'number') {
          const t = smoothCrossfade(state.crossfadeProgress);
          return lerp(oldResult.output, newResult.output, t) as B;
        }
        
        // Non-numeric: snap at 50%
        if (state.crossfadeProgress >= 0.5) {
          return newResult.output;
        }
        return oldResult.output;
      }
      
      // Normal processing
      const result = state.card.process(
        input,
        ctx,
        state.state ?? undefined
      ) as CardResult<B>;
      
      if (result.state) {
        state.state = result.state as CardState<unknown>;
      }
      
      return result.output;
    } finally {
      // Clean up completed crossfades
      if (state.crossfadeProgress >= 1) {
        state.previousCard = null;
        state.previousState = null;
      }
    }
  }

  /**
   * Gets current card state.
   */
  getState(cardId: string): HotReloadState | undefined {
    return this.cards.get(cardId);
  }

  /**
   * Sets a parameter value.
   */
  setParam(cardId: string, paramName: string, value: unknown): void {
    const state = this.cards.get(cardId);
    if (state) {
      state.params[paramName] = value;
    }
  }

  /**
   * Gets all registered card IDs.
   */
  getCardIds(): string[] {
    return Array.from(this.cards.keys());
  }
}

/** Smooth crossfade curve (ease-in-out) */
function smoothCrossfade(t: number): number {
  return t * t * (3 - 2 * t);
}

// ============================================================================
// UNDO/REDO MANAGER
// ============================================================================

/**
 * Manages undo/redo for live mode.
 */
export class UndoManager {
  private stack: UndoStack = {
    past: [],
    future: [],
    maxSize: 100,
    recording: true,
  };
  
  private listeners: Array<(action: UndoAction, type: 'undo' | 'redo' | 'record') => void> = [];

  /**
   * Sets maximum stack size.
   */
  setMaxSize(size: number): void {
    this.stack.maxSize = Math.max(1, size);
    this.trimStack();
  }

  /**
   * Enables or disables recording.
   */
  setRecording(enabled: boolean): void {
    this.stack.recording = enabled;
  }

  /**
   * Records an action.
   */
  record(action: Omit<UndoAction, 'timestamp'>): void {
    if (!this.stack.recording) return;
    
    const fullAction: UndoAction = {
      ...action,
      timestamp: Date.now(),
    };
    
    // Clear redo stack on new action
    this.stack.future = [];
    
    // Add to past
    this.stack.past.push(fullAction);
    this.trimStack();
    
    this.notifyListeners(fullAction, 'record');
  }

  /**
   * Records a parameter change.
   */
  recordParamChange(
    cardId: string,
    paramName: string,
    oldValue: unknown,
    newValue: unknown
  ): void {
    this.record({
      type: 'param-change',
      cardId,
      paramName,
      oldValue,
      newValue,
      description: `${cardId}.${paramName}: ${oldValue} → ${newValue}`,
    });
  }

  /**
   * Undoes the last action.
   */
  undo(): UndoAction | null {
    const action = this.stack.past.pop();
    if (!action) return null;
    
    this.stack.future.push(action);
    this.notifyListeners(action, 'undo');
    return action;
  }

  /**
   * Redoes the last undone action.
   */
  redo(): UndoAction | null {
    const action = this.stack.future.pop();
    if (!action) return null;
    
    this.stack.past.push(action);
    this.notifyListeners(action, 'redo');
    return action;
  }

  /**
   * Checks if undo is available.
   */
  canUndo(): boolean {
    return this.stack.past.length > 0;
  }

  /**
   * Checks if redo is available.
   */
  canRedo(): boolean {
    return this.stack.future.length > 0;
  }

  /**
   * Gets undo stack depth.
   */
  getUndoDepth(): number {
    return this.stack.past.length;
  }

  /**
   * Gets redo stack depth.
   */
  getRedoDepth(): number {
    return this.stack.future.length;
  }

  /**
   * Gets recent actions for display.
   */
  getRecentActions(count: number): UndoAction[] {
    return this.stack.past.slice(-count);
  }

  /**
   * Clears the entire stack.
   */
  clear(): void {
    this.stack.past = [];
    this.stack.future = [];
  }

  /**
   * Adds a listener for undo/redo events.
   */
  addListener(listener: (action: UndoAction, type: 'undo' | 'redo' | 'record') => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) this.listeners.splice(index, 1);
    };
  }

  /**
   * Groups multiple actions into one undo step.
   */
  beginGroup(): void {
    // Marker implementation could use a special action type
  }

  /**
   * Ends action group.
   */
  endGroup(): void {
    // Marker implementation
  }

  private trimStack(): void {
    while (this.stack.past.length > this.stack.maxSize) {
      this.stack.past.shift();
    }
  }

  private notifyListeners(action: UndoAction, type: 'undo' | 'redo' | 'record'): void {
    for (const listener of this.listeners) {
      listener(action, type);
    }
  }
}

// ============================================================================
// INTERPOLATION ENGINE
// ============================================================================

/**
 * Manages parameter interpolation.
 */
export class InterpolationEngine {
  private active: InterpolationState[] = [];
  private applyCallback: (cardId: string, paramName: string, value: number) => void;

  constructor(applyCallback: (cardId: string, paramName: string, value: number) => void) {
    this.applyCallback = applyCallback;
  }

  /**
   * Starts interpolating a parameter.
   */
  interpolate(
    cardId: string,
    paramName: string,
    targetValue: number,
    durationMs: number,
    curve: InterpolationCurve = 'linear',
    onComplete?: () => void
  ): void {
    // Cancel any existing interpolation for this param
    this.cancel(cardId, paramName);
    
    // Get current value (assume 0 if not set - caller should provide)
    const startValue = 0; // This would normally come from current state
    
    this.active.push({
      cardId,
      paramName,
      startValue,
      endValue: targetValue,
      startTime: performance.now(),
      duration: durationMs,
      curve,
      onComplete,
    });
  }

  /**
   * Starts interpolating from a specific value.
   */
  interpolateFrom(
    cardId: string,
    paramName: string,
    startValue: number,
    endValue: number,
    durationMs: number,
    curve: InterpolationCurve = 'linear',
    onComplete?: () => void
  ): void {
    this.cancel(cardId, paramName);
    
    this.active.push({
      cardId,
      paramName,
      startValue,
      endValue,
      startTime: performance.now(),
      duration: durationMs,
      curve,
      onComplete,
    });
  }

  /**
   * Cancels interpolation for a parameter.
   */
  cancel(cardId: string, paramName: string): void {
    this.active = this.active.filter(
      s => !(s.cardId === cardId && s.paramName === paramName)
    );
  }

  /**
   * Cancels all interpolations for a card.
   */
  cancelCard(cardId: string): void {
    this.active = this.active.filter(s => s.cardId !== cardId);
  }

  /**
   * Cancels all interpolations.
   */
  cancelAll(): void {
    this.active = [];
  }

  /**
   * Updates all active interpolations.
   * Should be called once per frame.
   */
  update(): void {
    const now = performance.now();
    const completed: InterpolationState[] = [];
    
    for (const state of this.active) {
      const elapsed = now - state.startTime;
      const progress = clamp(elapsed / state.duration, 0, 1);
      
      // Apply curve
      const curvedProgress = applyCurve(progress, state.curve);
      
      // Calculate current value
      const value = lerp(state.startValue, state.endValue, curvedProgress);
      
      // Apply value
      this.applyCallback(state.cardId, state.paramName, value);
      
      // Check completion
      if (progress >= 1) {
        completed.push(state);
      }
    }
    
    // Remove completed and call callbacks
    for (const state of completed) {
      const index = this.active.indexOf(state);
      if (index >= 0) this.active.splice(index, 1);
      state.onComplete?.();
    }
  }

  /**
   * Gets active interpolation count.
   */
  getActiveCount(): number {
    return this.active.length;
  }

  /**
   * Checks if a parameter is being interpolated.
   */
  isInterpolating(cardId: string, paramName: string): boolean {
    return this.active.some(s => s.cardId === cardId && s.paramName === paramName);
  }
}

/** Applies interpolation curve to progress (0-1). */
function applyCurve(t: number, curve: InterpolationCurve): number {
  switch (curve) {
    case 'linear':
      return t;
    case 'exponential':
      return t * t;
    case 'logarithmic':
      return Math.sqrt(t);
    case 'ease-in':
      return t * t * t;
    case 'ease-out':
      return 1 - Math.pow(1 - t, 3);
    case 'ease-in-out':
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    case 'step':
      return t < 1 ? 0 : 1;
    case 'smooth-step':
      return t * t * (3 - 2 * t);
    default:
      return t;
  }
}

// ============================================================================
// BEAT SYNC MANAGER
// ============================================================================

/**
 * Manages beat-synchronized parameter changes.
 */
export class BeatSyncManager {
  private scheduled: BeatSyncChange[] = [];
  private nextId = 0;
  private tempo = 120;
  private currentBeat = 0;
  private timeSignature = { numerator: 4, denominator: 4 };
  private applyCallback: (cardId: string, paramName: string, value: unknown) => void;
  private interpolationEngine: InterpolationEngine | undefined;

  constructor(
    applyCallback: (cardId: string, paramName: string, value: unknown) => void,
    interpolationEngine?: InterpolationEngine
  ) {
    this.applyCallback = applyCallback;
    this.interpolationEngine = interpolationEngine;
  }

  /**
   * Sets the tempo.
   */
  setTempo(bpm: number): void {
    this.tempo = Math.max(1, bpm);
  }

  /**
   * Sets the time signature.
   */
  setTimeSignature(numerator: number, denominator: number): void {
    this.timeSignature = { numerator, denominator };
  }

  /**
   * Updates the current beat position.
   */
  setBeat(beat: number): void {
    this.currentBeat = beat;
  }

  /**
   * Schedules a parameter change synchronized to beat.
   */
  scheduleChange(
    cardId: string,
    paramName: string,
    value: unknown,
    quantize: BeatQuantize = 'beat',
    options: {
      interpolate?: boolean;
      interpolationBeats?: number;
      curve?: InterpolationCurve;
    } = {}
  ): string {
    const id = `bs-${this.nextId++}`;
    
    const change: BeatSyncChange = {
      id,
      cardId,
      paramName,
      value,
      quantize,
      interpolate: options.interpolate ?? false,
      interpolationBeats: options.interpolationBeats,
      curve: options.curve ?? 'linear',
    };
    
    // Calculate scheduled beat
    change.scheduledBeat = this.getNextQuantizedBeat(quantize);
    
    this.scheduled.push(change);
    return id;
  }

  /**
   * Cancels a scheduled change.
   */
  cancel(id: string): void {
    this.scheduled = this.scheduled.filter(c => c.id !== id);
  }

  /**
   * Cancels all scheduled changes.
   */
  cancelAll(): void {
    this.scheduled = [];
  }

  /**
   * Processes scheduled changes for current beat.
   */
  update(beat: number): void {
    this.currentBeat = beat;
    
    const ready = this.scheduled.filter(c => 
      c.scheduledBeat !== undefined && beat >= c.scheduledBeat
    );
    
    for (const change of ready) {
      if (change.interpolate && this.interpolationEngine && typeof change.value === 'number') {
        // Use interpolation
        const durationMs = this.beatsToMs(change.interpolationBeats ?? 0.5);
        this.interpolationEngine.interpolate(
          change.cardId,
          change.paramName,
          change.value,
          durationMs,
          change.curve ?? 'linear'
        );
      } else {
        // Immediate apply
        this.applyCallback(change.cardId, change.paramName, change.value);
      }
      
      // Remove from scheduled
      const index = this.scheduled.indexOf(change);
      if (index >= 0) this.scheduled.splice(index, 1);
    }
  }

  /**
   * Gets the next quantized beat position.
   */
  getNextQuantizedBeat(quantize: BeatQuantize): number {
    if (quantize === 'off') return this.currentBeat;
    
    const quantizeValue = this.getQuantizeValue(quantize);
    return Math.ceil(this.currentBeat / quantizeValue) * quantizeValue;
  }

  /**
   * Converts beats to milliseconds.
   */
  beatsToMs(beats: number): number {
    return (beats * 60000) / this.tempo;
  }

  /**
   * Gets scheduled change count.
   */
  getScheduledCount(): number {
    return this.scheduled.length;
  }

  private getQuantizeValue(quantize: BeatQuantize): number {
    switch (quantize) {
      case '1/1': return 4;
      case '1/2': return 2;
      case '1/4': return 1;
      case '1/8': return 0.5;
      case '1/16': return 0.25;
      case '1/32': return 0.125;
      case '1/2T': return 4 / 3;
      case '1/4T': return 2 / 3;
      case '1/8T': return 1 / 3;
      case 'bar': return this.timeSignature.numerator;
      case 'beat': return 1;
      case 'off': return 0;
      default: return 1;
    }
  }
}

// ============================================================================
// MACRO SYSTEM
// ============================================================================

/**
 * Manages macro parameters that control multiple card parameters.
 */
export class MacroManager {
  private macros = new Map<string, MacroDef>();
  private applyCallback: (cardId: string, paramName: string, value: number) => void;

  constructor(applyCallback: (cardId: string, paramName: string, value: number) => void) {
    this.applyCallback = applyCallback;
  }

  /**
   * Creates a new macro.
   */
  createMacro(
    name: string,
    mappings: MacroMapping[],
    options: {
      defaultValue?: number;
      description?: string;
      shortcut?: string;
    } = {}
  ): MacroDef {
    const id = `macro-${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    const macro: MacroDef = {
      name,
      id,
      mappings,
      value: options.defaultValue ?? 0,
      defaultValue: options.defaultValue ?? 0,
      description: options.description,
      shortcut: options.shortcut,
    };
    
    this.macros.set(id, macro);
    return macro;
  }

  /**
   * Sets a macro value (0-1).
   */
  setMacro(macroId: string, value: number): void {
    const macro = this.macros.get(macroId);
    if (!macro) return;
    
    macro.value = clamp(value, 0, 1);
    this.applyMacro(macro);
  }

  /**
   * Sets a macro by name.
   */
  setMacroByName(name: string, value: number): void {
    const macros = Array.from(this.macros.values());
    const macro = macros.find(m => m.name === name);
    if (macro) {
      this.setMacro(macro.id, value);
    }
  }

  /**
   * Gets a macro value.
   */
  getMacro(macroId: string): number | undefined {
    return this.macros.get(macroId)?.value;
  }

  /**
   * Resets a macro to default.
   */
  resetMacro(macroId: string): void {
    const macro = this.macros.get(macroId);
    if (macro) {
      this.setMacro(macroId, macro.defaultValue);
    }
  }

  /**
   * Resets all macros to defaults.
   */
  resetAll(): void {
    const macros = Array.from(this.macros.values());
    for (const macro of macros) {
      macro.value = macro.defaultValue;
      this.applyMacro(macro);
    }
  }

  /**
   * Adds a mapping to an existing macro.
   */
  addMapping(macroId: string, mapping: MacroMapping): void {
    const macro = this.macros.get(macroId);
    if (macro) {
      macro.mappings.push(mapping);
      this.applyMacro(macro);
    }
  }

  /**
   * Removes a mapping from a macro.
   */
  removeMapping(macroId: string, cardId: string, paramName: string): void {
    const macro = this.macros.get(macroId);
    if (macro) {
      macro.mappings = macro.mappings.filter(
        m => !(m.cardId === cardId && m.paramName === paramName)
      );
    }
  }

  /**
   * Gets all macros.
   */
  getAllMacros(): MacroDef[] {
    return Array.from(this.macros.values());
  }

  /**
   * Deletes a macro.
   */
  deleteMacro(macroId: string): void {
    this.macros.delete(macroId);
  }

  private applyMacro(macro: MacroDef): void {
    for (const mapping of macro.mappings) {
      // Apply curve to macro value
      const curvedValue = mapping.curve
        ? applyCurve(macro.value, mapping.curve)
        : macro.value;
      
      // Map to parameter range
      const value = lerp(mapping.minValue, mapping.maxValue, curvedValue);
      
      this.applyCallback(mapping.cardId, mapping.paramName, value);
    }
  }
}

// ============================================================================
// KEYBOARD SHORTCUT MANAGER
// ============================================================================

/**
 * Manages keyboard shortcuts for live mode.
 */
export class KeyboardShortcutManager {
  private shortcuts: KeyboardShortcut[] = [];
  private enabled = true;
  private onAction: ((action: ShortcutAction) => void) | undefined;
  private boundHandler: EventListener;

  constructor(onAction?: (action: ShortcutAction) => void) {
    this.onAction = onAction;
    this.boundHandler = this.handleKeyDown.bind(this) as EventListener;
  }

  /**
   * Registers a keyboard shortcut.
   */
  register(shortcut: KeyboardShortcut): void {
    // Remove any existing shortcut with same key combo
    this.unregister(shortcut.key, shortcut.modifiers);
    this.shortcuts.push(shortcut);
  }

  /**
   * Unregisters a keyboard shortcut.
   */
  unregister(key: string, modifiers: KeyboardShortcut['modifiers'] = {}): void {
    this.shortcuts = this.shortcuts.filter(s => 
      !(s.key === key && this.modifiersMatch(s.modifiers, modifiers))
    );
  }

  /**
   * Enables keyboard shortcuts.
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disables keyboard shortcuts.
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Attaches to DOM for keyboard events.
   */
  attach(element: HTMLElement | Document = document): void {
    element.addEventListener('keydown', this.boundHandler);
  }

  /**
   * Detaches from DOM.
   */
  detach(element: HTMLElement | Document = document): void {
    element.removeEventListener('keydown', this.boundHandler);
  }

  /**
   * Gets all registered shortcuts.
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return [...this.shortcuts];
  }

  /**
   * Gets shortcut string representation.
   */
  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    if (shortcut.modifiers.ctrl) parts.push('Ctrl');
    if (shortcut.modifiers.alt) parts.push('Alt');
    if (shortcut.modifiers.shift) parts.push('Shift');
    if (shortcut.modifiers.meta) parts.push('Cmd');
    parts.push(shortcut.key.toUpperCase());
    return parts.join('+');
  }

  /**
   * Registers default shortcuts.
   */
  registerDefaults(): void {
    // Undo/Redo
    this.register({
      key: 'z',
      modifiers: { ctrl: true },
      action: { type: 'undo' },
      description: 'Undo last action',
    });
    
    this.register({
      key: 'z',
      modifiers: { ctrl: true, shift: true },
      action: { type: 'redo' },
      description: 'Redo last action',
    });
    
    this.register({
      key: 'y',
      modifiers: { ctrl: true },
      action: { type: 'redo' },
      description: 'Redo last action (alt)',
    });
    
    // Transport
    this.register({
      key: ' ',
      modifiers: {},
      action: { type: 'play-pause' },
      description: 'Play/Pause',
    });
    
    this.register({
      key: 'Escape',
      modifiers: {},
      action: { type: 'stop-all' },
      description: 'Stop all',
    });
    
    this.register({
      key: 't',
      modifiers: {},
      action: { type: 'tap-tempo' },
      description: 'Tap tempo',
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;
    
    // Skip if focus is in text input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }
    
    const modifiers: KeyboardShortcut['modifiers'] = {
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey,
    };
    
    const shortcut = this.shortcuts.find(s =>
      s.key.toLowerCase() === e.key.toLowerCase() &&
      this.modifiersMatch(s.modifiers, modifiers)
    );
    
    if (shortcut) {
      e.preventDefault();
      this.executeAction(shortcut.action);
    }
  }

  private modifiersMatch(a: KeyboardShortcut['modifiers'], b: KeyboardShortcut['modifiers']): boolean {
    return (
      !!a.ctrl === !!b.ctrl &&
      !!a.alt === !!b.alt &&
      !!a.shift === !!b.shift &&
      !!a.meta === !!b.meta
    );
  }

  private executeAction(action: ShortcutAction): void {
    if (this.onAction) {
      this.onAction(action);
    }
    
    if (action.type === 'custom') {
      action.handler();
    }
  }
}

// ============================================================================
// LIVE MODE CONTROLLER
// ============================================================================

/**
 * Unified live mode controller integrating all features.
 */
export class LiveModeController {
  readonly hotReload: HotReloadManager;
  readonly undo: UndoManager;
  readonly interpolation: InterpolationEngine;
  readonly beatSync: BeatSyncManager;
  readonly macros: MacroManager;
  readonly shortcuts: KeyboardShortcutManager;
  
  private session: LiveSession | null = null;
  private rafId: number | null = null;

  constructor() {
    // Initialize managers with callbacks
    this.hotReload = new HotReloadManager();
    this.undo = new UndoManager();
    
    this.interpolation = new InterpolationEngine(
      (cardId, paramName, value) => this.applyParam(cardId, paramName, value)
    );
    
    this.macros = new MacroManager(
      (cardId, paramName, value) => this.applyParam(cardId, paramName, value)
    );
    
    this.beatSync = new BeatSyncManager(
      (cardId, paramName, value) => this.applyParam(cardId, paramName, value),
      this.interpolation
    );
    
    this.shortcuts = new KeyboardShortcutManager(
      (action) => this.handleShortcutAction(action)
    );
    this.shortcuts.registerDefaults();
  }

  /**
   * Initializes with a live session.
   */
  init(session: LiveSession): void {
    this.session = session;
    this.start();
  }

  /**
   * Starts the update loop.
   */
  start(): void {
    if (this.rafId !== null) return;
    
    const update = () => {
      this.interpolation.update();
      
      // Beat sync would be updated from transport
      
      this.rafId = requestAnimationFrame(update);
    };
    
    this.rafId = requestAnimationFrame(update);
  }

  /**
   * Stops the update loop.
   */
  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Sets a parameter with undo recording.
   */
  setParam(cardId: string, paramName: string, value: unknown): void {
    const oldValue = this.session?.paramOverrides.get(cardId)?.[paramName];
    this.applyParam(cardId, paramName, value);
    this.undo.recordParamChange(cardId, paramName, oldValue, value);
  }

  /**
   * Sets a parameter with interpolation.
   */
  setParamSmooth(
    cardId: string,
    paramName: string,
    value: number,
    durationMs: number,
    curve: InterpolationCurve = 'ease-out'
  ): void {
    const currentValue = this.getParam(cardId, paramName) as number ?? 0;
    this.interpolation.interpolateFrom(cardId, paramName, currentValue, value, durationMs, curve);
  }

  /**
   * Sets a parameter on the next beat.
   */
  setParamOnBeat(
    cardId: string,
    paramName: string,
    value: unknown,
    quantize: BeatQuantize = 'beat'
  ): string {
    return this.beatSync.scheduleChange(cardId, paramName, value, quantize);
  }

  /**
   * Gets a parameter value.
   */
  getParam(cardId: string, paramName: string): unknown {
    return this.session?.paramOverrides.get(cardId)?.[paramName];
  }

  /**
   * Attaches keyboard shortcuts.
   */
  attachKeyboard(element?: HTMLElement | Document): void {
    this.shortcuts.attach(element);
  }

  /**
   * Detaches keyboard shortcuts.
   */
  detachKeyboard(element?: HTMLElement | Document): void {
    this.shortcuts.detach(element);
  }

  private applyParam(cardId: string, paramName: string, value: unknown): void {
    if (!this.session) return;
    
    let overrides = this.session.paramOverrides.get(cardId);
    if (!overrides) {
      overrides = {};
      this.session.paramOverrides.set(cardId, overrides);
    }
    overrides[paramName] = value;
    
    // Also update hot reload state
    this.hotReload.setParam(cardId, paramName, value);
  }

  private handleShortcutAction(action: ShortcutAction): void {
    switch (action.type) {
      case 'undo': {
        const undone = this.undo.undo();
        if (undone && undone.cardId && undone.paramName) {
          this.applyParam(undone.cardId, undone.paramName, undone.oldValue);
        }
        break;
      }
      case 'redo': {
        const redone = this.undo.redo();
        if (redone && redone.cardId && redone.paramName) {
          this.applyParam(redone.cardId, redone.paramName, redone.newValue);
        }
        break;
      }
      case 'set-param':
        this.setParam(action.cardId, action.paramName, action.value);
        break;
      case 'toggle-param': {
        const current = this.getParam(action.cardId, action.paramName);
        this.setParam(action.cardId, action.paramName, !current);
        break;
      }
      case 'increment-param': {
        const current = this.getParam(action.cardId, action.paramName) as number ?? 0;
        this.setParam(action.cardId, action.paramName, current + action.amount);
        break;
      }
      case 'trigger-macro':
        if (action.value !== undefined) {
          this.macros.setMacro(action.macroId, action.value);
        }
        break;
      case 'stop-all':
        this.interpolation.cancelAll();
        this.beatSync.cancelAll();
        break;
      case 'play-pause':
        if (this.session) {
          this.session.playing = !this.session.playing;
        }
        break;
      case 'tap-tempo':
        // Would integrate with tempo detection
        break;
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a new live mode controller.
 */
export function createLiveModeController(): LiveModeController {
  return new LiveModeController();
}

/**
 * Creates a standalone hot reload manager.
 */
export function createHotReloadManager(): HotReloadManager {
  return new HotReloadManager();
}

/**
 * Creates a standalone undo manager.
 */
export function createUndoManager(): UndoManager {
  return new UndoManager();
}

/**
 * Creates a standalone macro manager.
 */
export function createMacroManager(
  applyCallback: (cardId: string, paramName: string, value: number) => void
): MacroManager {
  return new MacroManager(applyCallback);
}

/**
 * Creates a standalone keyboard shortcut manager.
 */
export function createKeyboardShortcutManager(
  onAction?: (action: ShortcutAction) => void
): KeyboardShortcutManager {
  return new KeyboardShortcutManager(onAction);
}
