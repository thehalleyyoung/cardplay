/**
 * @file Constraint Checkers - Validation Functions for Edit Constraints
 * @module gofai/execution/constraint-checkers
 * 
 * Implements Step 305: Define "constraint checkers" as functions from
 * (before, after, selector) → pass/fail + counterexample report.
 * 
 * Constraint checkers are pure functions that validate whether an applied
 * edit respects the constraints declared in the user's intention. They are
 * critical for:
 * 
 * - **Safety**: Ensuring edits don't violate "preserve X" constraints
 * - **Trust**: Allowing users to specify boundaries and have them enforced
 * - **Explainability**: Producing concrete counterexamples when constraints fail
 * - **Rollback**: Enabling automatic rollback on constraint violations
 * 
 * Design Principles:
 * - **Pure functions**: No side effects, deterministic
 * - **Counterexamples**: Always provide concrete evidence of violations
 * - **Composable**: Checkers can be combined with AND/OR logic
 * - **Typed**: Strong TypeScript types for all inputs/outputs
 * - **Fast**: Optimized for real-time validation during execution
 * 
 * @see gofai_goalB.md Step 305
 * @see docs/gofai/execution/constraint-checkers.md
 */

import type { Event, EventId } from '../../types/event.js';
import type { EventSelector } from '../canon/event-selector.js';
import type { Constraint, ConstraintType } from '../canon/constraint-types.js';

// Temporary type aliases until we unify with canon
type Selector = EventSelector & { scope: Scope };
type Scope = {
  start?: number;
  end?: number;
  trackId?: string;
  tags?: readonly string[];
};

// ============================================================================
// Core Types
// ============================================================================

/**
 * Project state snapshot for constraint checking.
 * 
 * Contains all information needed to validate constraints without
 * requiring full project state access.
 */
export interface ProjectSnapshot {
  /** All events in scope */
  readonly events: ReadonlyMap<EventId, Event<any>>;
  
  /** Section markers */
  readonly sections: readonly SectionMarker[];
  
  /** Track information */
  readonly tracks: ReadonlyMap<string, TrackInfo>;
  
  /** Card graph state */
  readonly cards: ReadonlyMap<string, CardState>;
  
  /** Current key estimate (if available) */
  readonly estimatedKey?: { root: number; mode: string };
  
  /** Current tempo (BPM) */
  readonly tempo: number;
  
  /** Current meter */
  readonly meter: { numerator: number; denominator: number };
}

/**
 * Section marker.
 */
export interface SectionMarker {
  readonly id: string;
  readonly name: string;
  readonly startTick: number;
  readonly endTick: number;
  readonly type?: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'other';
}

/**
 * Track information.
 */
export interface TrackInfo {
  readonly id: string;
  readonly name: string;
  readonly role?: string;
  readonly color?: string;
  readonly muted: boolean;
}

/**
 * Card state snapshot.
 */
export interface CardState {
  readonly id: string;
  readonly type: string;
  readonly params: ReadonlyMap<string, any>;
  readonly position: { x: number; y: number };
}

/**
 * Constraint check result.
 */
export type ConstraintCheckResult =
  | { readonly status: 'pass' }
  | { readonly status: 'fail'; readonly violations: readonly Violation[] }
  | { readonly status: 'not_applicable'; readonly reason: string };

/**
 * A constraint violation with evidence.
 */
export interface Violation {
  /** Type of violation */
  readonly type: ViolationType;
  
  /** Human-readable message */
  readonly message: string;
  
  /** Concrete counterexample */
  readonly counterexample: Counterexample;
  
  /** Severity of violation */
  readonly severity: 'error' | 'warning';
  
  /** Context for explanation */
  readonly context: ViolationContext;
}

/**
 * Types of constraint violations.
 */
export type ViolationType =
  | 'melody_changed'
  | 'harmony_changed'
  | 'rhythm_changed'
  | 'tempo_changed'
  | 'key_changed'
  | 'meter_changed'
  | 'structure_changed'
  | 'out_of_scope'
  | 'forbidden_layer_added'
  | 'forbidden_layer_removed'
  | 'forbidden_param_changed'
  | 'range_violated'
  | 'role_changed'
  | 'density_changed'
  | 'register_changed'
  | 'voicing_changed'
  | 'custom_constraint_failed';

/**
 * Concrete evidence of a constraint violation.
 */
export type Counterexample =
  | MelodyCounterexample
  | HarmonyCounterexample
  | RhythmCounterexample
  | ScopeCounterexample
  | ParameterCounterexample
  | StructuralCounterexample
  | DensityCounterexample
  | RegisterCounterexample;

/**
 * Melody constraint violation evidence.
 */
export interface MelodyCounterexample {
  readonly type: 'melody';
  readonly changedNotes: readonly {
    readonly eventId: EventId;
    readonly beforePitch: number;
    readonly afterPitch: number;
    readonly tick: number;
  }[];
  readonly addedNotes: readonly EventId[];
  readonly removedNotes: readonly EventId[];
}

/**
 * Harmony constraint violation evidence.
 */
export interface HarmonyCounterexample {
  readonly type: 'harmony';
  readonly changedChords: readonly {
    readonly tick: number;
    readonly beforeChord: string;
    readonly afterChord: string;
  }[];
  readonly functionChanged?: {
    readonly position: string;
    readonly before: string;
    readonly after: string;
  };
}

/**
 * Rhythm constraint violation evidence.
 */
export interface RhythmCounterexample {
  readonly type: 'rhythm';
  readonly changedOnsets: readonly {
    readonly eventId: EventId;
    readonly beforeTick: number;
    readonly afterTick: number;
  }[];
  readonly addedOnsets: readonly { eventId: EventId; tick: number }[];
  readonly removedOnsets: readonly { eventId: EventId; tick: number }[];
  readonly patternChanged?: string;
}

/**
 * Scope constraint violation evidence.
 */
export interface ScopeCounterexample {
  readonly type: 'scope';
  readonly outOfScopeEvents: readonly {
    readonly eventId: EventId;
    readonly tick: number;
    readonly allowedRange: { start: number; end: number };
  }[];
  readonly outOfScopeSelectors: readonly string[];
}

/**
 * Parameter constraint violation evidence.
 */
export interface ParameterCounterexample {
  readonly type: 'parameter';
  readonly changedParams: readonly {
    readonly cardId: string;
    readonly paramName: string;
    readonly beforeValue: any;
    readonly afterValue: any;
  }[];
  readonly forbiddenParams: readonly string[];
}

/**
 * Structural constraint violation evidence.
 */
export interface StructuralCounterexample {
  readonly type: 'structural';
  readonly addedSections: readonly string[];
  readonly removedSections: readonly string[];
  readonly reorderedSections: readonly { from: number; to: number }[];
  readonly lengthChanged?: { before: number; after: number };
}

/**
 * Density constraint violation evidence.
 */
export interface DensityCounterexample {
  readonly type: 'density';
  readonly changedDensities: readonly {
    readonly region: { start: number; end: number };
    readonly beforeDensity: number;
    readonly afterDensity: number;
    readonly threshold: number;
  }[];
}

/**
 * Register constraint violation evidence.
 */
export interface RegisterCounterexample {
  readonly type: 'register';
  readonly changedRegisters: readonly {
    readonly eventId: EventId;
    readonly beforeRegister: string;
    readonly afterRegister: string;
  }[];
  readonly outOfRange: readonly {
    readonly eventId: EventId;
    readonly pitch: number;
    readonly allowedRange: { min: number; max: number };
  }[];
}

/**
 * Context for understanding a violation.
 */
export interface ViolationContext {
  /** Which constraint was violated */
  readonly constraintId: string;
  
  /** Original constraint declaration */
  readonly constraint: Constraint;
  
  /** Scope where violation occurred */
  readonly scope: Scope;
  
  /** Additional metadata */
  readonly metadata?: Record<string, any>;
}

// ============================================================================
// Constraint Checker Function Type
// ============================================================================

/**
 * A constraint checker function.
 * 
 * Takes before/after snapshots, selector, and constraint parameters,
 * returns pass/fail with concrete counterexamples.
 */
export type ConstraintChecker = (
  before: ProjectSnapshot,
  after: ProjectSnapshot,
  selector: Selector,
  constraint: Constraint,
  options?: CheckerOptions
) => ConstraintCheckResult;

/**
 * Options for constraint checking.
 */
export interface CheckerOptions {
  /** Tolerance for numeric comparisons */
  readonly tolerance?: number;
  
  /** Strict mode (no approximations) */
  readonly strict?: boolean;
  
  /** Include detailed analysis in results */
  readonly verbose?: boolean;
  
  /** Custom namespace for extension checkers */
  readonly namespace?: string;
}

// ============================================================================
// Builtin Constraint Checkers
// ============================================================================

/**
 * Check melody preservation constraint.
 * 
 * Validates that melodic content (pitch + onset) remains unchanged
 * within the selected scope.
 */
export const checkMelodyPreservation: ConstraintChecker = (
  before,
  after,
  selector,
  constraint,
  options = {}
) => {
  const tolerance = options.tolerance ?? 0;
  
  // Extract melody events from both snapshots
  const beforeMelody = extractMelodyEvents(before, selector);
  const afterMelody = extractMelodyEvents(after, selector);
  
  // Build maps for comparison
  const beforeMap = new Map(beforeMelody.map(e => [e.id, e]));
  const afterMap = new Map(afterMelody.map(e => [e.id, e]));
  
  const violations: Violation[] = [];
  const changedNotes: Array<{
    readonly eventId: EventId;
    readonly beforePitch: number;
    readonly afterPitch: number;
    readonly tick: number;
  }> = [];
  const addedNotes: EventId[] = [];
  const removedNotes: EventId[] = [];
  
  // Check for removed notes
  for (const [id, _event] of beforeMap) {
    if (!afterMap.has(id)) {
      removedNotes.push(id);
    }
  }
  
  // Check for added notes
  for (const [id, _event] of afterMap) {
    if (!beforeMap.has(id)) {
      addedNotes.push(id);
    }
  }
  
  // Check for changed pitches
  for (const [id, beforeEvent] of beforeMap) {
    const afterEvent = afterMap.get(id);
    if (!afterEvent) continue;
    
    const beforePitch = getPitch(beforeEvent);
    const afterPitch = getPitch(afterEvent);
    
    if (beforePitch !== undefined && afterPitch !== undefined) {
      if (Math.abs(beforePitch - afterPitch) > tolerance) {
        changedNotes.push({
          eventId: id,
          beforePitch,
          afterPitch,
          tick: beforeEvent.start,
        });
      }
    }
  }
  
  // Determine if constraint passed
  const hasViolations = 
    changedNotes.length > 0 ||
    addedNotes.length > 0 ||
    removedNotes.length > 0;
  
  if (!hasViolations) {
    return { status: 'pass' };
  }
  
  // Build violation report
  const counterexample: MelodyCounterexample = {
    type: 'melody',
    changedNotes,
    addedNotes,
    removedNotes,
  };
  
  violations.push({
    type: 'melody_changed',
    message: buildMelodyViolationMessage(counterexample),
    counterexample,
    severity: 'error',
    context: {
      constraintId: constraint.id || 'preserve_melody',
      constraint,
      scope: selector.scope,
    },
  });
  
  return {
    status: 'fail',
    violations,
  };
};

/**
 * Check harmony preservation constraint.
 * 
 * Validates that harmonic content (chord progression) remains unchanged.
 */
export const checkHarmonyPreservation: ConstraintChecker = (
  before,
  after,
  selector,
  constraint,
  options = {}
) => {
  const strict = options?.strict ?? false;
  
  // Extract chord progressions
  const beforeChords = extractChordProgression(before, selector);
  const afterChords = extractChordProgression(after, selector);
  
  const changedChords: Array<{
    readonly tick: number;
    readonly beforeChord: string;
    readonly afterChord: string;
  }> = [];
  
  // Compare chord by chord
  const maxLength = Math.max(beforeChords.length, afterChords.length);
  for (let i = 0; i < maxLength; i++) {
    const beforeChord = beforeChords[i];
    const afterChord = afterChords[i];
    
    if (!beforeChord || !afterChord) {
      changedChords.push({
        tick: beforeChord?.tick ?? afterChord?.tick ?? 0,
        beforeChord: beforeChord?.symbol ?? 'none',
        afterChord: afterChord?.symbol ?? 'none',
      });
      continue;
    }
    
    // Compare chord symbols
    if (!chordsEquivalent(beforeChord.symbol, afterChord.symbol, strict)) {
      changedChords.push({
        tick: beforeChord.tick,
        beforeChord: beforeChord.symbol,
        afterChord: afterChord.symbol,
      });
    }
  }
  
  if (changedChords.length === 0) {
    return { status: 'pass' };
  }
  
  const counterexample: HarmonyCounterexample = {
    type: 'harmony',
    changedChords,
  };
  
  return {
    status: 'fail',
    violations: [{
      type: 'harmony_changed',
      message: buildHarmonyViolationMessage(counterexample),
      counterexample,
      severity: 'error',
      context: {
        constraintId: constraint.id || 'preserve_harmony',
        constraint,
        scope: selector.scope,
      },
    }],
  };
};

/**
 * Check rhythm preservation constraint.
 * 
 * Validates that rhythmic patterns (onset times) remain unchanged.
 */
export const checkRhythmPreservation: ConstraintChecker = (
  before,
  after,
  selector,
  constraint,
  options = {}
) => {
  const tolerance = options.tolerance ?? 0;
  
  const beforeEvents = extractRhythmicEvents(before, selector);
  const afterEvents = extractRhythmicEvents(after, selector);
  
  const beforeMap = new Map(beforeEvents.map(e => [e.id, e]));
  const afterMap = new Map(afterEvents.map(e => [e.id, e]));
  
  const changedOnsets: Array<{
    readonly eventId: EventId;
    readonly beforeTick: number;
    readonly afterTick: number;
  }> = [];
  const addedOnsets: Array<{ eventId: EventId; tick: number }> = [];
  const removedOnsets: Array<{ eventId: EventId; tick: number }> = [];
  
  // Check for changed onsets
  for (const [id, beforeEvent] of beforeMap) {
    const afterEvent = afterMap.get(id);
    if (!afterEvent) {
      removedOnsets.push({ eventId: id, tick: beforeEvent.start });
      continue;
    }
    
    if (Math.abs(beforeEvent.start - afterEvent.start) > tolerance) {
      changedOnsets.push({
        eventId: id,
        beforeTick: beforeEvent.start,
        afterTick: afterEvent.start,
      });
    }
  }
  
  // Check for added onsets
  for (const [id, afterEvent] of afterMap) {
    if (!beforeMap.has(id)) {
      addedOnsets.push({ eventId: id, tick: afterEvent.start });
    }
  }
  
  const hasViolations =
    changedOnsets.length > 0 ||
    addedOnsets.length > 0 ||
    removedOnsets.length > 0;
  
  if (!hasViolations) {
    return { status: 'pass' };
  }
  
  const counterexample: RhythmCounterexample = {
    type: 'rhythm',
    changedOnsets,
    addedOnsets,
    removedOnsets,
  };
  
  return {
    status: 'fail',
    violations: [{
      type: 'rhythm_changed',
      message: buildRhythmViolationMessage(counterexample),
      counterexample,
      severity: 'error',
      context: {
        constraintId: constraint.id || 'preserve_rhythm',
        constraint,
        scope: selector.scope,
      },
    }],
  };
};

/**
 * Check "only change X" scope constraint.
 * 
 * Validates that modifications are restricted to allowed selectors only.
 */
export const checkOnlyChange: ConstraintChecker = (
  before,
  after,
  selector,
  constraint,
  _options = {}
) => {
  // Extract allowed targets from constraint
  const allowedSelectors = extractAllowedSelectors(constraint);
  
  // Find all changed events
  const changedEvents = findChangedEvents(before, after);
  
  const outOfScopeEvents: Array<{
    readonly eventId: EventId;
    readonly tick: number;
    readonly allowedRange: { start: number; end: number };
  }> = [];
  const outOfScopeSelectors: string[] = [];
  
  for (const eventItem of changedEvents) {
    const matchesAllowed = allowedSelectors.some(allowed =>
      eventMatchesSelector(eventItem, allowed, before)
    );
    
    if (!matchesAllowed) {
      outOfScopeEvents.push({
        eventId: eventItem.id,
        tick: eventItem.start,
        allowedRange: { start: selector.scope.start ?? 0, end: selector.scope.end ?? Infinity },
      });
    }
  }
  
  if (outOfScopeEvents.length === 0) {
    return { status: 'pass' };
  }
  
  const counterexample: ScopeCounterexample = {
    type: 'scope',
    outOfScopeEvents,
    outOfScopeSelectors,
  };
  
  return {
    status: 'fail',
    violations: [{
      type: 'out_of_scope',
      message: buildScopeViolationMessage(counterexample),
      counterexample,
      severity: 'error',
      context: {
        constraintId: constraint.id || 'only_change',
        constraint,
        scope: selector.scope,
      },
    }],
  };
};

/**
 * Check tempo preservation constraint.
 */
export const checkTempoPreservation: ConstraintChecker = (
  before,
  after,
  selector,
  constraint,
  options = {}
) => {
  const tolerance = options.tolerance ?? 0.01;
  
  if (Math.abs(before.tempo - after.tempo) <= tolerance) {
    return { status: 'pass' };
  }
  
  return {
    status: 'fail',
    violations: [{
      type: 'tempo_changed',
      message: `Tempo changed from ${before.tempo.toFixed(1)} to ${after.tempo.toFixed(1)} BPM`,
      counterexample: {
        type: 'parameter',
        changedParams: [{
          cardId: 'global',
          paramName: 'tempo',
          beforeValue: before.tempo,
          afterValue: after.tempo,
        }],
        forbiddenParams: ['tempo'],
      },
      severity: 'error',
      context: {
        constraintId: constraint.id || 'preserve_tempo',
        constraint,
        scope: selector.scope,
      },
    }],
  };
};

/**
 * Check key preservation constraint.
 */
export const checkKeyPreservation: ConstraintChecker = (
  before,
  after,
  selector,
  constraint,
  _options = {}
) => {
  const beforeKey = before.estimatedKey;
  const afterKey = after.estimatedKey;
  
  if (!beforeKey || !afterKey) {
    return { status: 'not_applicable', reason: 'Key not estimated' };
  }
  
  if (beforeKey.root === afterKey.root && beforeKey.mode === afterKey.mode) {
    return { status: 'pass' };
  }
  
  return {
    status: 'fail',
    violations: [{
      type: 'key_changed',
      message: `Key changed from ${formatKey(beforeKey)} to ${formatKey(afterKey)}`,
      counterexample: {
        type: 'harmony',
        changedChords: [{
          tick: 0,
          beforeChord: formatKey(beforeKey),
          afterChord: formatKey(afterKey),
        }],
      },
      severity: 'error',
      context: {
        constraintId: constraint.id || 'preserve_key',
        constraint,
        scope: selector.scope,
      },
    }],
  };
};

/**
 * Check meter preservation constraint.
 */
export const checkMeterPreservation: ConstraintChecker = (
  before,
  after,
  selector,
  constraint,
  _options = {}
) => {
  const beforeMeter = before.meter;
  const afterMeter = after.meter;
  
  if (beforeMeter.numerator === afterMeter.numerator &&
      beforeMeter.denominator === afterMeter.denominator) {
    return { status: 'pass' };
  }
  
  return {
    status: 'fail',
    violations: [{
      type: 'meter_changed',
      message: `Meter changed from ${beforeMeter.numerator}/${beforeMeter.denominator} to ${afterMeter.numerator}/${afterMeter.denominator}`,
      counterexample: {
        type: 'structural',
        addedSections: [],
        removedSections: [],
        reorderedSections: [],
        lengthChanged: { before: beforeMeter.numerator, after: afterMeter.numerator },
      },
      severity: 'error',
      context: {
        constraintId: constraint.id || 'preserve_meter',
        constraint,
        scope: selector.scope,
      },
    }],
  };
};

/**
 * Check no new layers constraint.
 */
export const checkNoNewLayers: ConstraintChecker = (
  before,
  after,
  selector,
  constraint,
  _options = {}
) => {
  const beforeTracks = new Set(before.tracks.keys());
  const afterTracks = new Set(after.tracks.keys());
  
  const addedTracks: string[] = [];
  const removedTracks: string[] = [];
  
  for (const trackId of afterTracks) {
    if (!beforeTracks.has(trackId)) {
      addedTracks.push(trackId);
    }
  }
  
  for (const trackId of beforeTracks) {
    if (!afterTracks.has(trackId)) {
      removedTracks.push(trackId);
    }
  }
  
  if (addedTracks.length === 0 && removedTracks.length === 0) {
    return { status: 'pass' };
  }
  
  const violations: Violation[] = [];
  
  if (addedTracks.length > 0) {
    violations.push({
      type: 'forbidden_layer_added',
      message: `Added ${addedTracks.length} track(s): ${addedTracks.join(', ')}`,
      counterexample: {
        type: 'structural',
        addedSections: addedTracks,
        removedSections: [],
        reorderedSections: [],
      },
      severity: 'error',
      context: {
        constraintId: constraint.id || 'no_new_layers',
        constraint,
        scope: selector.scope,
      },
    });
  }
  
  if (removedTracks.length > 0) {
    violations.push({
      type: 'forbidden_layer_removed',
      message: `Removed ${removedTracks.length} track(s): ${removedTracks.join(', ')}`,
      counterexample: {
        type: 'structural',
        addedSections: [],
        removedSections: removedTracks,
        reorderedSections: [],
      },
      severity: 'error',
      context: {
        constraintId: constraint.id || 'no_new_layers',
        constraint,
        scope: selector.scope,
      },
    });
  }
  
  return {
    status: 'fail',
    violations,
  };
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract melody events from snapshot.
 */
function extractMelodyEvents(
  snapshot: ProjectSnapshot,
  selector: Selector
): readonly Event<any>[] {
  const events: Event<any>[] = [];
  
  for (const eventEntry of snapshot.events.values()) {
    if (eventMatchesSelector(eventEntry, selector, snapshot) && isMelodyEvent(eventEntry)) {
      events.push(eventEntry);
    }
  }
  
  return events;
}

/**
 * Extract rhythmic events from snapshot.
 */
function extractRhythmicEvents(
  snapshot: ProjectSnapshot,
  selector: Selector
): readonly Event<any>[] {
  const events: Event<any>[] = [];
  
  for (const eventEntry of snapshot.events.values()) {
    if (eventMatchesSelector(eventEntry, selector, snapshot)) {
      events.push(eventEntry);
    }
  }
  
  return events;
}

/**
 * Extract chord progression from snapshot.
 */
function extractChordProgression(
  _snapshot: ProjectSnapshot,
  _selector: Selector
): readonly { tick: number; symbol: string }[] {
  // This would analyze harmony from events
  // Simplified for now - would integrate with theory analysis
  return [];
}

/**
 * Check if event matches selector.
 */
function eventMatchesSelector(
  event: Event<any>,
  selector: Selector,
  _snapshot: ProjectSnapshot
): boolean {
  // Check time range
  if (selector.scope.start !== undefined && event.start < selector.scope.start) {
    return false;
  }
  if (selector.scope.end !== undefined && event.start >= selector.scope.end) {
    return false;
  }
  
  // Check track filter
  if (selector.scope.trackId !== undefined && (event as any).trackId !== selector.scope.trackId) {
    return false;
  }
  
  // Check tags
  if (selector.scope.tags && selector.scope.tags.length > 0) {
    const eventTags = event.tags || [];
    const hasAllTags = selector.scope.tags.every(tag => eventTags.includes(tag));
    if (!hasAllTags) return false;
  }
  
  return true;
}

/**
 * Check if event is a melody event.
 */
function isMelodyEvent(event: Event<any>): boolean {
  // Check if event has pitch information
  const tags = event.tags || [];
  return event.kind === 'note' || tags.includes('melody');
}

/**
 * Get pitch from event.
 */
function getPitch(event: Event<any>): number | undefined {
  if (event.kind === 'note' && event.payload && 'pitch' in event.payload) {
    return (event.payload as any).pitch;
  }
  return undefined;
}

/**
 * Check if two chord symbols are equivalent.
 */
function chordsEquivalent(a: string, b: string, strict: boolean): boolean {
  if (a === b) return true;
  if (strict) return false;
  
  // Could add functional equivalence checking here
  // For now, require exact match in non-strict mode
  return a === b;
}

/**
 * Find all events that changed between snapshots.
 */
function findChangedEvents(
  before: ProjectSnapshot,
  after: ProjectSnapshot
): readonly Event<any>[] {
  const changed: Event<any>[] = [];
  
  // Check for modified events
  for (const [id, afterEvent] of after.events) {
    const beforeEvent = before.events.get(id);
    if (!beforeEvent || !eventsEqual(beforeEvent, afterEvent)) {
      changed.push(afterEvent);
    }
  }
  
  // Check for new events
  for (const [id, afterEvent] of after.events) {
    if (!before.events.has(id)) {
      changed.push(afterEvent);
    }
  }
  
  return changed;
}

/**
 * Check if two events are equal.
 */
function eventsEqual(a: Event<any>, b: Event<any>): boolean {
  // Simplified equality check
  return a.id === b.id &&
         a.start === b.start &&
         a.kind === b.kind &&
         JSON.stringify(a.payload) === JSON.stringify(b.payload);
}

/**
 * Extract allowed selectors from constraint.
 */
function extractAllowedSelectors(constraint: Constraint): readonly Selector[] {
  // Extract from constraint parameters
  // This would be defined by constraint type
  return [];
}

/**
 * Format key for display.
 */
function formatKey(key: { root: number; mode: string }): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const rootNote = notes[key.root % 12];
  return `${rootNote} ${key.mode}`;
}

/**
 * Build melody violation message.
 */
function buildMelodyViolationMessage(example: MelodyCounterexample): string {
  const parts: string[] = [];
  
  if (example.changedNotes.length > 0) {
    parts.push(`${example.changedNotes.length} note(s) changed pitch`);
  }
  if (example.addedNotes.length > 0) {
    parts.push(`${example.addedNotes.length} note(s) added`);
  }
  if (example.removedNotes.length > 0) {
    parts.push(`${example.removedNotes.length} note(s) removed`);
  }
  
  return `Melody changed: ${parts.join(', ')}`;
}

/**
 * Build harmony violation message.
 */
function buildHarmonyViolationMessage(example: HarmonyCounterexample): string {
  if (example.changedChords.length === 0) {
    return 'Harmony constraint violated';
  }
  
  const first = example.changedChords[0];
  return `Harmony changed at tick ${first.tick}: ${first.beforeChord} → ${first.afterChord}`;
}

/**
 * Build rhythm violation message.
 */
function buildRhythmViolationMessage(example: RhythmCounterexample): string {
  const parts: string[] = [];
  
  if (example.changedOnsets.length > 0) {
    parts.push(`${example.changedOnsets.length} onset(s) shifted`);
  }
  if (example.addedOnsets.length > 0) {
    parts.push(`${example.addedOnsets.length} onset(s) added`);
  }
  if (example.removedOnsets.length > 0) {
    parts.push(`${example.removedOnsets.length} onset(s) removed`);
  }
  
  return `Rhythm changed: ${parts.join(', ')}`;
}

/**
 * Build scope violation message.
 */
function buildScopeViolationMessage(example: ScopeCounterexample): string {
  return `${example.outOfScopeEvents.length} event(s) modified outside allowed scope`;
}

// ============================================================================
// Constraint Checker Registry
// ============================================================================

/**
 * Registry of constraint checkers by type.
 */
export const CONSTRAINT_CHECKERS: ReadonlyMap<ConstraintType, ConstraintChecker> = new Map([
  ['preserve_melody', checkMelodyPreservation],
  ['preserve_harmony', checkHarmonyPreservation],
  ['preserve_rhythm', checkRhythmPreservation],
  ['preserve_tempo', checkTempoPreservation],
  ['preserve_key', checkKeyPreservation],
  ['preserve_meter', checkMeterPreservation],
  ['only_change', checkOnlyChange],
  ['no_new_layers', checkNoNewLayers],
]);

/**
 * Get constraint checker for a given constraint type.
 */
export function getConstraintChecker(type: ConstraintType): ConstraintChecker | undefined {
  return CONSTRAINT_CHECKERS.get(type);
}

/**
 * Run all constraint checks for a set of constraints.
 */
export function checkAllConstraints(
  before: ProjectSnapshot,
  after: ProjectSnapshot,
  selector: Selector,
  constraints: readonly Constraint[],
  options?: CheckerOptions
): ConstraintCheckResult {
  const allViolations: Violation[] = [];
  
  for (const constraint of constraints) {
    const checker = getConstraintChecker(constraint.type);
    if (!checker) {
      console.warn(`No checker found for constraint type: ${constraint.type}`);
      continue;
    }
    
    const result = checker(before, after, selector, constraint, options);
    
    if (result.status === 'fail') {
      allViolations.push(...result.violations);
    }
  }
  
  if (allViolations.length === 0) {
    return { status: 'pass' };
  }
  
  return {
    status: 'fail',
    violations: allViolations,
  };
}

/**
 * Format constraint check result for display.
 */
export function formatConstraintCheckResult(result: ConstraintCheckResult): string {
  if (result.status === 'pass') {
    return 'All constraints satisfied ✓';
  }
  
  if (result.status === 'not_applicable') {
    return `Not applicable: ${result.reason}`;
  }
  
  const lines = ['Constraint violations:'];
  for (const violation of result.violations) {
    lines.push(`  - ${violation.message}`);
  }
  
  return lines.join('\n');
}
