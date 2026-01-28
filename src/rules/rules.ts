/**
 * @fileoverview Rules<E, C> Constraint System implementation.
 * 
 * Provides a polymorphic rule system for validating, transforming,
 * and generating musical content based on various contexts.
 * 
 * @module @cardplay/core/rules
 */

import type { Tick, TickDuration } from '../types/primitives';
import type { Event } from '../types/event';
import type { Pitch } from '../voices/voice';

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Validation error descriptor.
 */
export interface ValidationError {
  /** Error code */
  readonly code: string;
  /** Human-readable message */
  readonly message: string;
  /** Severity level */
  readonly severity: 'error' | 'warning' | 'info';
  /** Suggested fix */
  readonly suggestion?: string;
}

/**
 * Result of validating an event.
 */
export interface ValidationResult<E> {
  /** The event that was validated */
  readonly event: E;
  /** Whether the event is valid */
  readonly valid: boolean;
  /** Validation errors if any */
  readonly errors: readonly ValidationError[];
  /** Confidence score 0-1 */
  readonly confidence?: number;
}

/**
 * A suggestion for the next event.
 */
export interface Suggestion<E> {
  /** The suggested event */
  readonly event: E;
  /** Probability/weight 0-1 */
  readonly probability: number;
  /** Reason for suggestion */
  readonly reason?: string;
}

/**
 * Rules interface for validating and transforming events.
 * 
 * @template E - Event type
 * @template C - Context type
 */
export interface Rules<E, C> {
  /** Rule identifier */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Validate an event against the rules */
  readonly validate: (event: E, context: C) => ValidationResult<E>;
  /** Transform an event to conform to rules */
  readonly transform: (event: E, context: C) => E;
  /** Suggest next events based on context */
  readonly suggest: (context: C, count?: number) => readonly Suggestion<E>[];
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Base context with timing information.
 */
export interface BaseContext {
  /** Current position */
  readonly currentTick: Tick;
  /** Transport tempo */
  readonly tempo?: number;
  /** Time signature */
  readonly timeSignature?: readonly [number, number];
}

/**
 * Scale context for melodic rules.
 */
export interface ScaleContext extends BaseContext {
  /** Root note as MIDI number */
  readonly root: number;
  /** Scale degrees as semitone offsets from root */
  readonly scale: readonly number[];
  /** Key signature name (e.g., "C major", "A minor") */
  readonly keyName?: string;
  /** Mode (e.g., "ionian", "dorian") */
  readonly mode?: string;
}

/**
 * Progression context for harmonic rules.
 */
export interface ProgressionContext extends BaseContext {
  /** Current chord (as array of MIDI notes) */
  readonly currentChord: readonly number[];
  /** Chord symbol (e.g., "Cmaj7") */
  readonly chordSymbol?: string;
  /** Chord function (e.g., "I", "IV", "V") */
  readonly function?: string;
  /** Previous chords in progression */
  readonly history?: readonly (readonly number[])[];
  /** Scale/key context */
  readonly scaleContext?: ScaleContext;
}

/**
 * Raga context for Carnatic/Hindustani music.
 */
export interface RagaContext extends BaseContext {
  /** Raga name */
  readonly ragaName: string;
  /** Arohanam (ascending scale) as swara positions */
  readonly arohanam: readonly number[];
  /** Avarohanam (descending scale) as swara positions */
  readonly avarohanam: readonly number[];
  /** Vadi (dominant note) */
  readonly vadi?: number;
  /** Samvadi (sub-dominant note) */
  readonly samvadi?: number;
  /** Gamakas (ornaments) allowed */
  readonly gamakas?: readonly string[];
  /** Nyasa swaras (resting notes) */
  readonly nyasa?: readonly number[];
  /** Time of day for raga */
  readonly time?: 'morning' | 'afternoon' | 'evening' | 'night' | 'anytime';
}

/**
 * Tala context for rhythmic rules.
 */
export interface TalaContext extends BaseContext {
  /** Tala name (e.g., "Adi", "Rupaka") */
  readonly talaName: string;
  /** Number of beats per cycle */
  readonly cycleLength: number;
  /** Aksharas (subdivisions) per beat */
  readonly aksharas: number;
  /** Current position within cycle */
  readonly currentAkshara: number;
  /** Strong beat positions */
  readonly samPositions: readonly number[];
  /** Pattern of claps and waves */
  readonly pattern?: readonly ('clap' | 'wave' | 'count')[];
}

/**
 * Voicing context for voice leading rules.
 */
export interface VoicingContext extends BaseContext {
  /** Number of voices */
  readonly voiceCount: number;
  /** Current pitch of each voice */
  readonly currentPitches: readonly number[];
  /** Voice ranges [low, high] for each voice */
  readonly voiceRanges?: readonly (readonly [number, number])[];
  /** Maximum interval between adjacent voices */
  readonly maxSpacing?: number;
  /** Whether to allow voice crossing */
  readonly allowCrossing?: boolean;
  /** Previous voicings */
  readonly history?: readonly (readonly number[])[];
}

// ============================================================================
// RULE ALIASES
// ============================================================================

/**
 * Rules for melodic note constraints.
 */
export type MelodyRules<P extends Pitch> = Rules<Event<{ pitch: P }>, ScaleContext>;

/**
 * Rules for harmonic chord constraints.
 */
export type HarmonyRules = Rules<Event<{ chord: readonly number[] }>, ProgressionContext>;

/**
 * Rules for rhythmic timing constraints.
 */
export type RhythmRules = Rules<Event<unknown>, TalaContext>;

// ============================================================================
// RULE FACTORIES
// ============================================================================

/**
 * Options for creating rules.
 */
export interface CreateRulesOptions<E, C> {
  readonly id: string;
  readonly name: string;
  readonly validate?: (event: E, context: C) => ValidationResult<E>;
  readonly transform?: (event: E, context: C) => E;
  readonly suggest?: (context: C, count?: number) => readonly Suggestion<E>[];
}

/**
 * Creates a Rules instance.
 */
export function createRules<E, C>(options: CreateRulesOptions<E, C>): Rules<E, C> {
  return Object.freeze({
    id: options.id,
    name: options.name,
    validate: options.validate ?? ((event: E) => ({
      event,
      valid: true,
      errors: [],
    })),
    transform: options.transform ?? ((event: E) => event),
    suggest: options.suggest ?? (() => []),
  });
}

// ============================================================================
// RULE COMBINATORS
// ============================================================================

/**
 * Combines rules with intersection (all must pass).
 */
export function combineRules<E, C>(
  rules: readonly Rules<E, C>[],
  id: string,
  name: string
): Rules<E, C> {
  return createRules({
    id,
    name,
    validate: (event: E, context: C) => {
      const allErrors: ValidationError[] = [];
      let allValid = true;
      
      for (const rule of rules) {
        const result = rule.validate(event, context);
        if (!result.valid) allValid = false;
        allErrors.push(...result.errors);
      }
      
      return { event, valid: allValid, errors: allErrors };
    },
    transform: (event: E, context: C) => {
      let result = event;
      for (const rule of rules) {
        result = rule.transform(result, context);
      }
      return result;
    },
    suggest: (context: C, count?: number) => {
      // Get suggestions from all rules and merge by probability
      const allSuggestions: Suggestion<E>[] = [];
      for (const rule of rules) {
        allSuggestions.push(...rule.suggest(context, count));
      }
      // Sort by probability and take top n
      return allSuggestions
        .sort((a, b) => b.probability - a.probability)
        .slice(0, count ?? 10);
    },
  });
}

/**
 * Combines rules with union (any must pass).
 */
export function orRules<E, C>(
  rules: readonly Rules<E, C>[],
  id: string,
  name: string
): Rules<E, C> {
  return createRules({
    id,
    name,
    validate: (event: E, context: C) => {
      const allErrors: ValidationError[] = [];
      let anyValid = false;
      
      for (const rule of rules) {
        const result = rule.validate(event, context);
        if (result.valid) {
          anyValid = true;
          break;
        }
        allErrors.push(...result.errors);
      }
      
      return {
        event,
        valid: anyValid,
        errors: anyValid ? [] : allErrors,
      };
    },
    transform: (event: E, context: C) => {
      // Try each rule's transform until one produces a valid result
      for (const rule of rules) {
        const transformed = rule.transform(event, context);
        const validation = rule.validate(transformed, context);
        if (validation.valid) {
          return transformed;
        }
      }
      return event;
    },
    suggest: (context: C, count?: number) => {
      // Merge suggestions from all rules
      const allSuggestions: Suggestion<E>[] = [];
      for (const rule of rules) {
        allSuggestions.push(...rule.suggest(context, count));
      }
      return allSuggestions
        .sort((a, b) => b.probability - a.probability)
        .slice(0, count ?? 10);
    },
  });
}

/**
 * Creates a negation of a rule.
 */
export function notRule<E, C>(
  rule: Rules<E, C>,
  id: string,
  name: string
): Rules<E, C> {
  return createRules({
    id,
    name,
    validate: (event: E, context: C) => {
      const result = rule.validate(event, context);
      return {
        event,
        valid: !result.valid,
        errors: result.valid
          ? [{
              code: 'NOT_RULE_VIOLATION',
              message: `Event should NOT match: ${rule.name}`,
              severity: 'error',
            }]
          : [],
      };
    },
    // Negation doesn't have a meaningful transform
    transform: (event: E) => event,
    // Negation doesn't suggest
    suggest: () => [],
  });
}

// ============================================================================
// STREAM OPERATIONS
// ============================================================================

/**
 * Validates all events in a stream.
 */
export function validateStream<E, C>(
  events: readonly E[],
  rules: Rules<E, C>,
  context: C
): readonly ValidationResult<E>[] {
  return events.map(event => rules.validate(event, context));
}

/**
 * Transforms all events in a stream using rules.
 */
export function transformStream<E, C>(
  events: readonly E[],
  rules: Rules<E, C>,
  context: C
): readonly E[] {
  return events.map(event => rules.transform(event, context));
}

/**
 * Suggests next event based on stream history.
 */
export function suggestNext<E, C>(
  rules: Rules<E, C>,
  context: C,
  count: number = 5
): readonly Suggestion<E>[] {
  return rules.suggest(context, count);
}

// ============================================================================
// RULE GENERATORS
// ============================================================================

/**
 * Creates rules from a scale.
 */
export function rulesFromScale<P extends Pitch>(
  scaleContext: ScaleContext,
  createPitch: (midi: number) => P
): MelodyRules<P> {
  const { root, scale } = scaleContext;
  const scaleNotes = new Set(scale.map(degree => (root + degree) % 12));
  
  return createRules({
    id: `scale-${scaleContext.keyName ?? 'custom'}`,
    name: scaleContext.keyName ?? 'Scale Rules',
    validate: (event, _context) => {
      const pitch = event.payload.pitch;
      const midi = pitch.toMIDI();
      const pitchClass = Math.round(midi) % 12;
      
      const inScale = scaleNotes.has(pitchClass);
      
      return {
        event,
        valid: inScale,
        errors: inScale ? [] : [{
          code: 'OUT_OF_SCALE',
          message: `Note ${midi} is not in scale`,
          severity: 'warning',
          suggestion: `Try ${[...scaleNotes].join(', ')} (+ octave)`,
        }],
      };
    },
    transform: (event, _context) => {
      const pitch = event.payload.pitch;
      const midi = pitch.toMIDI();
      const pitchClass = Math.round(midi) % 12;
      
      if (scaleNotes.has(pitchClass)) return event;
      
      // Find nearest scale note
      let nearest = root;
      let minDist = 12;
      for (const degree of scale) {
        const scaleNote = (root + degree) % 12;
        const dist = Math.min(
          Math.abs(pitchClass - scaleNote),
          12 - Math.abs(pitchClass - scaleNote)
        );
        if (dist < minDist) {
          minDist = dist;
          nearest = scaleNote;
        }
      }
      
      const octave = Math.floor(midi / 12);
      const newMidi = octave * 12 + nearest;
      const newPitch = createPitch(newMidi);
      
      return {
        ...event,
        payload: { ...event.payload, pitch: newPitch },
      };
    },
    suggest: (_context, count = 5) => {
      const suggestions: Suggestion<Event<{ pitch: P }>>[] = [];
      const octave = 5; // Default to middle octave
      
      for (let i = 0; i < Math.min(count, scale.length); i++) {
        const degree = scale[i]!;
        const midi = octave * 12 + root + degree;
        const pitch = createPitch(midi);
        suggestions.push({
          event: {
            id: '' as Event<{ pitch: P }>['id'],
            kind: 'note' as Event<{ pitch: P }>['kind'],
            start: 0 as Tick,
            duration: 480 as TickDuration,
            payload: { pitch },
          },
          probability: 1 / (i + 1),
          reason: `Scale degree ${i + 1}`,
        });
      }
      
      return suggestions;
    },
  });
}

/**
 * Creates rules from chord progressions.
 */
export function rulesFromChords(
  allowedProgressions: readonly (readonly [string, string])[]
): HarmonyRules {
  const progressionMap = new Map<string, string[]>();
  for (const [from, to] of allowedProgressions) {
    if (!progressionMap.has(from)) {
      progressionMap.set(from, []);
    }
    progressionMap.get(from)!.push(to);
  }
  
  return createRules({
    id: 'chord-progression',
    name: 'Chord Progression Rules',
    validate: (event, context) => {
      const currentFunction = context.function ?? 'I';
      const allowed = progressionMap.get(currentFunction) ?? [];
      
      // Simplified validation - in practice would check chord symbol
      const valid = allowed.length === 0 || true; // Allow all if no restrictions
      
      return {
        event,
        valid,
        errors: valid ? [] : [{
          code: 'INVALID_PROGRESSION',
          message: `Chord progression not allowed from ${currentFunction}`,
          severity: 'error',
        }],
      };
    },
  });
}

/**
 * Creates rules from a raga.
 */
export function rulesFromRaga(ragaContext: RagaContext): Rules<Event<{ pitch: number }>, RagaContext> {
  return createRules({
    id: `raga-${ragaContext.ragaName}`,
    name: `${ragaContext.ragaName} Rules`,
    validate: (event, context) => {
      const pitch = event.payload.pitch;
      const pitchClass = Math.round(pitch) % 12;
      
      // Check if note is in arohanam or avarohanam based on melodic direction
      // Simplified: just check if in either
      const inArohanam = context.arohanam.includes(pitchClass);
      const inAvarohanam = context.avarohanam.includes(pitchClass);
      const valid = inArohanam || inAvarohanam;
      
      return {
        event,
        valid,
        errors: valid ? [] : [{
          code: 'NOT_IN_RAGA',
          message: `Note ${pitch} not allowed in ${context.ragaName}`,
          severity: 'error',
        }],
      };
    },
  });
}

/**
 * Creates rules from a grammar (phrase patterns).
 */
export function rulesFromGrammar<E>(
  patterns: readonly (readonly E[])[]
): Rules<E, BaseContext> {
  return createRules({
    id: 'grammar',
    name: 'Grammar Rules',
    validate: (event, _context) => {
      // Grammar validation requires sequence context
      // Simplified: always valid
      return { event, valid: true, errors: [] };
    },
    suggest: (_context, count = 5) => {
      // Suggest based on common pattern starts
      const suggestions: Suggestion<E>[] = [];
      for (let i = 0; i < Math.min(count, patterns.length); i++) {
        const pattern = patterns[i]!;
        if (pattern.length > 0) {
          suggestions.push({
            event: pattern[0]!,
            probability: 1 / (i + 1),
            reason: `Pattern ${i + 1} start`,
          });
        }
      }
      return suggestions;
    },
  });
}
