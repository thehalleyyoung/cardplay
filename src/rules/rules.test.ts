/**
 * @fileoverview Tests for Rules<E, C> Constraint System.
 */

import { describe, it, expect } from 'vitest';
import {
  createRules,
  combineRules,
  orRules,
  notRule,
  validateStream,
  transformStream,
  suggestNext,
  rulesFromScale,
  rulesFromChords,
} from './rules';
import type { ScaleContext, ValidationResult } from './rules';
import { createMIDIPitch } from '../voices/voice';
import type { Pitch } from '../voices/voice';
import type { Tick, TickDuration } from '../types/primitives';
import type { Event } from '../types/event';
import { asTick, asTickDuration } from '../types/primitives';
import { generateEventId, EventKinds } from '../types';

// ============================================================================
// HELPERS
// ============================================================================

interface PitchPayload<P extends Pitch> {
  pitch: P;
}

const createPitchEvent = <P extends Pitch>(
  pitch: P,
  start: number = 0
): Event<PitchPayload<P>> => ({
  id: generateEventId(),
  kind: EventKinds.NOTE,
  start: asTick(start),
  duration: asTickDuration(480),
  payload: { pitch },
});

const cMajorContext: ScaleContext = {
  currentTick: asTick(0),
  root: 0, // C
  scale: [0, 2, 4, 5, 7, 9, 11], // Major scale
  keyName: 'C major',
};

// ============================================================================
// CORE RULES TESTS
// ============================================================================

describe('createRules', () => {
  it('should create a basic rules instance', () => {
    const rules = createRules({
      id: 'test',
      name: 'Test Rules',
    });
    
    expect(rules.id).toBe('test');
    expect(rules.name).toBe('Test Rules');
  });

  it('should provide default implementations', () => {
    const rules = createRules<{ value: number }, unknown>({
      id: 'test',
      name: 'Test Rules',
    });
    
    const event = { value: 42 };
    const result = rules.validate(event, {});
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(rules.transform(event, {})).toBe(event);
    expect(rules.suggest({}, 5)).toHaveLength(0);
  });

  it('should use custom validate function', () => {
    const rules = createRules<{ value: number }, { max: number }>({
      id: 'max-check',
      name: 'Max Check',
      validate: (event, context) => ({
        event,
        valid: event.value <= context.max,
        errors: event.value > context.max
          ? [{ code: 'TOO_HIGH', message: 'Value too high', severity: 'error' }]
          : [],
      }),
    });
    
    expect(rules.validate({ value: 5 }, { max: 10 }).valid).toBe(true);
    expect(rules.validate({ value: 15 }, { max: 10 }).valid).toBe(false);
  });
});

// ============================================================================
// COMBINATOR TESTS
// ============================================================================

describe('combineRules', () => {
  it('should require all rules to pass', () => {
    const positiveRule = createRules<{ value: number }, unknown>({
      id: 'positive',
      name: 'Positive',
      validate: (event) => ({
        event,
        valid: event.value > 0,
        errors: event.value <= 0
          ? [{ code: 'NOT_POSITIVE', message: 'Must be positive', severity: 'error' }]
          : [],
      }),
    });

    const evenRule = createRules<{ value: number }, unknown>({
      id: 'even',
      name: 'Even',
      validate: (event) => ({
        event,
        valid: event.value % 2 === 0,
        errors: event.value % 2 !== 0
          ? [{ code: 'NOT_EVEN', message: 'Must be even', severity: 'error' }]
          : [],
      }),
    });

    const combined = combineRules([positiveRule, evenRule], 'combined', 'Combined');
    
    expect(combined.validate({ value: 4 }, {}).valid).toBe(true);
    expect(combined.validate({ value: 3 }, {}).valid).toBe(false); // Not even
    expect(combined.validate({ value: -2 }, {}).valid).toBe(false); // Not positive
    expect(combined.validate({ value: -3 }, {}).valid).toBe(false); // Neither
  });

  it('should chain transforms', () => {
    const doubleRule = createRules<{ value: number }, unknown>({
      id: 'double',
      name: 'Double',
      transform: (event) => ({ value: event.value * 2 }),
    });

    const addOneRule = createRules<{ value: number }, unknown>({
      id: 'add-one',
      name: 'Add One',
      transform: (event) => ({ value: event.value + 1 }),
    });

    const combined = combineRules([doubleRule, addOneRule], 'chain', 'Chain');
    
    const result = combined.transform({ value: 5 }, {});
    expect(result.value).toBe(11); // (5 * 2) + 1
  });
});

describe('orRules', () => {
  it('should pass if any rule passes', () => {
    const positiveRule = createRules<{ value: number }, unknown>({
      id: 'positive',
      name: 'Positive',
      validate: (event) => ({
        event,
        valid: event.value > 0,
        errors: event.value <= 0
          ? [{ code: 'NOT_POSITIVE', message: 'Must be positive', severity: 'error' }]
          : [],
      }),
    });

    const evenRule = createRules<{ value: number }, unknown>({
      id: 'even',
      name: 'Even',
      validate: (event) => ({
        event,
        valid: event.value % 2 === 0,
        errors: event.value % 2 !== 0
          ? [{ code: 'NOT_EVEN', message: 'Must be even', severity: 'error' }]
          : [],
      }),
    });

    const either = orRules([positiveRule, evenRule], 'either', 'Either');
    
    expect(either.validate({ value: 4 }, {}).valid).toBe(true); // Both
    expect(either.validate({ value: 3 }, {}).valid).toBe(true); // Only positive
    expect(either.validate({ value: -2 }, {}).valid).toBe(true); // Only even
    expect(either.validate({ value: -3 }, {}).valid).toBe(false); // Neither
  });
});

describe('notRule', () => {
  it('should negate validation', () => {
    const positiveRule = createRules<{ value: number }, unknown>({
      id: 'positive',
      name: 'Positive',
      validate: (event) => ({
        event,
        valid: event.value > 0,
        errors: [],
      }),
    });

    const notPositive = notRule(positiveRule, 'not-positive', 'Not Positive');
    
    expect(notPositive.validate({ value: -5 }, {}).valid).toBe(true);
    expect(notPositive.validate({ value: 5 }, {}).valid).toBe(false);
  });
});

// ============================================================================
// STREAM OPERATIONS TESTS
// ============================================================================

describe('validateStream', () => {
  it('should validate all events', () => {
    const positiveRule = createRules<{ value: number }, unknown>({
      id: 'positive',
      name: 'Positive',
      validate: (event) => ({
        event,
        valid: event.value > 0,
        errors: event.value <= 0
          ? [{ code: 'NOT_POSITIVE', message: 'Negative', severity: 'error' }]
          : [],
      }),
    });

    const events = [{ value: 1 }, { value: -2 }, { value: 3 }];
    const results = validateStream(events, positiveRule, {});
    
    expect(results).toHaveLength(3);
    expect(results[0]!.valid).toBe(true);
    expect(results[1]!.valid).toBe(false);
    expect(results[2]!.valid).toBe(true);
  });
});

describe('transformStream', () => {
  it('should transform all events', () => {
    const doubleRule = createRules<{ value: number }, unknown>({
      id: 'double',
      name: 'Double',
      transform: (event) => ({ value: event.value * 2 }),
    });

    const events = [{ value: 1 }, { value: 2 }, { value: 3 }];
    const results = transformStream(events, doubleRule, {});
    
    expect(results).toHaveLength(3);
    expect(results[0]!.value).toBe(2);
    expect(results[1]!.value).toBe(4);
    expect(results[2]!.value).toBe(6);
  });
});

describe('suggestNext', () => {
  it('should return suggestions', () => {
    const rules = createRules<{ value: number }, unknown>({
      id: 'suggest',
      name: 'Suggest',
      suggest: (_context, count = 3) => {
        return Array.from({ length: count }, (_, i) => ({
          event: { value: i + 1 },
          probability: 1 / (i + 1),
        }));
      },
    });

    const suggestions = suggestNext(rules, {}, 3);
    
    expect(suggestions).toHaveLength(3);
    expect(suggestions[0]!.probability).toBe(1);
    expect(suggestions[1]!.probability).toBe(0.5);
  });
});

// ============================================================================
// SCALE RULES TESTS
// ============================================================================

describe('rulesFromScale', () => {
  it('should validate notes in scale', () => {
    const rules = rulesFromScale(cMajorContext, createMIDIPitch);
    
    // C is in C major
    const cEvent = createPitchEvent(createMIDIPitch(60)); // C4
    const cResult = rules.validate(cEvent, cMajorContext);
    expect(cResult.valid).toBe(true);
    
    // C# is not in C major
    const cSharpEvent = createPitchEvent(createMIDIPitch(61)); // C#4
    const cSharpResult = rules.validate(cSharpEvent, cMajorContext);
    expect(cSharpResult.valid).toBe(false);
    expect(cSharpResult.errors).toHaveLength(1);
    expect(cSharpResult.errors[0]!.code).toBe('OUT_OF_SCALE');
  });

  it('should transform out-of-scale notes', () => {
    const rules = rulesFromScale(cMajorContext, createMIDIPitch);
    
    // C# should be transformed to C or D
    const cSharpEvent = createPitchEvent(createMIDIPitch(61));
    const transformed = rules.transform(cSharpEvent, cMajorContext);
    
    const newMidi = transformed.payload.pitch.toMIDI();
    expect([60, 62]).toContain(newMidi); // C or D
  });

  it('should suggest scale notes', () => {
    const rules = rulesFromScale(cMajorContext, createMIDIPitch);
    
    const suggestions = rules.suggest(cMajorContext, 3);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]!.probability).toBeGreaterThan(0);
  });
});

// ============================================================================
// CHORD RULES TESTS
// ============================================================================

describe('rulesFromChords', () => {
  it('should create progression rules', () => {
    const rules = rulesFromChords([
      ['I', 'IV'],
      ['I', 'V'],
      ['IV', 'V'],
      ['V', 'I'],
    ]);
    
    expect(rules.id).toBe('chord-progression');
    expect(rules.name).toBe('Chord Progression Rules');
  });
});
