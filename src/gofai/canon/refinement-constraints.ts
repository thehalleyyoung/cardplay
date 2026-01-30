/**
 * @file Refinement Constraints for Axis Values
 * @gofai_goalB Step 045 [Type]
 * 
 * This module defines refinement types and validation for all perceptual and
 * musical axis values. Refinements ensure that values are:
 * - In valid ranges (e.g., width ∈ [0,1], BPM > 0)
 * - Meet musical constraints (e.g., valid intervals, chord voicings)
 * - Type-safe and self-documenting
 * - Validated at runtime
 * 
 * **Design principle:** Make illegal states unrepresentable. If a value passes
 * validation, it is guaranteed to be musically and physically valid.
 * 
 * **Purpose:**
 * - Prevent invalid edits before execution
 * - Provide clear error messages
 * - Enable static analysis (where possible)
 * - Document valid ranges in types
 */

/**
 * =============================================================================
 * REFINEMENT TYPE INFRASTRUCTURE
 * =============================================================================
 */

/**
 * Refinement constraint on a value.
 */
export interface RefinementConstraint<T> {
  /** Constraint name */
  readonly name: string;
  /** Human-readable description */
  readonly description: string;
  /** Validation predicate */
  readonly predicate: (value: T) => boolean;
  /** Error message generator */
  readonly errorMessage: (value: T) => string;
}

/**
 * Result of refinement validation.
 */
export interface RefinementResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Validate a value against refinement constraints.
 */
export function validateRefinement<T>(
  value: T,
  constraints: readonly RefinementConstraint<T>[]
): RefinementResult {
  const errors: string[] = [];

  for (const constraint of constraints) {
    if (!constraint.predicate(value)) {
      errors.push(constraint.errorMessage(value));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * =============================================================================
 * NUMERIC RANGE CONSTRAINTS
 * =============================================================================
 */

/**
 * Constraint: value is within a range [min, max].
 */
export function rangeConstraint(
  min: number,
  max: number,
  name: string = 'range'
): RefinementConstraint<number> {
  return {
    name,
    description: `Value must be between ${min} and ${max}`,
    predicate: (value) => value >= min && value <= max,
    errorMessage: (value) => `${name}: ${value} is outside range [${min}, ${max}]`,
  };
}

/**
 * Constraint: value is positive (> 0).
 */
export function positiveConstraint(name: string = 'positive'): RefinementConstraint<number> {
  return {
    name,
    description: 'Value must be positive',
    predicate: (value) => value > 0,
    errorMessage: (value) => `${name}: ${value} must be positive`,
  };
}

/**
 * Constraint: value is non-negative (>= 0).
 */
export function nonNegativeConstraint(
  name: string = 'non-negative'
): RefinementConstraint<number> {
  return {
    name,
    description: 'Value must be non-negative',
    predicate: (value) => value >= 0,
    errorMessage: (value) => `${name}: ${value} must be non-negative`,
  };
}

/**
 * Constraint: value is finite (not NaN, not Infinity).
 */
export function finiteConstraint(name: string = 'finite'): RefinementConstraint<number> {
  return {
    name,
    description: 'Value must be finite',
    predicate: (value) => Number.isFinite(value),
    errorMessage: (value) => `${name}: ${value} must be finite (not NaN or Infinity)`,
  };
}

/**
 * Constraint: value is an integer.
 */
export function integerConstraint(name: string = 'integer'): RefinementConstraint<number> {
  return {
    name,
    description: 'Value must be an integer',
    predicate: (value) => Number.isInteger(value),
    errorMessage: (value) => `${name}: ${value} must be an integer`,
  };
}

/**
 * =============================================================================
 * PERCEPTUAL AXIS REFINEMENTS
 * =============================================================================
 */

/**
 * Normalized value (0 to 1).
 */
export type Normalized = number & { readonly __brand: 'Normalized' };

export const NORMALIZED_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  finiteConstraint('normalized'),
  rangeConstraint(0, 1, 'normalized'),
];

export function validateNormalized(value: number): Normalized {
  const result = validateRefinement(value, NORMALIZED_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid normalized value: ${result.errors.join(', ')}`);
  }
  return value as Normalized;
}

/**
 * Percentage value (0 to 100).
 */
export type Percentage = number & { readonly __brand: 'Percentage' };

export const PERCENTAGE_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  finiteConstraint('percentage'),
  rangeConstraint(0, 100, 'percentage'),
];

export function validatePercentage(value: number): Percentage {
  const result = validateRefinement(value, PERCENTAGE_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid percentage: ${result.errors.join(', ')}`);
  }
  return value as Percentage;
}

/**
 * Decibel value (-∞ to +∞, but typically -60 to +12).
 */
export type Decibels = number & { readonly __brand: 'Decibels' };

export const DECIBELS_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  finiteConstraint('decibels'),
  rangeConstraint(-60, 12, 'decibels'),
];

export function validateDecibels(value: number): Decibels {
  const result = validateRefinement(value, DECIBELS_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid decibels: ${result.errors.join(', ')}`);
  }
  return value as Decibels;
}

/**
 * Gain (linear amplitude, 0 to ∞, typically 0 to 2).
 */
export type Gain = number & { readonly __brand: 'Gain' };

export const GAIN_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  finiteConstraint('gain'),
  nonNegativeConstraint('gain'),
  rangeConstraint(0, 4, 'gain'), // Allow up to 4x for headroom
];

export function validateGain(value: number): Gain {
  const result = validateRefinement(value, GAIN_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid gain: ${result.errors.join(', ')}`);
  }
  return value as Gain;
}

/**
 * Panning (-1 = full left, 0 = center, 1 = full right).
 */
export type Pan = number & { readonly __brand: 'Pan' };

export const PAN_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  finiteConstraint('pan'),
  rangeConstraint(-1, 1, 'pan'),
];

export function validatePan(value: number): Pan {
  const result = validateRefinement(value, PAN_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid pan: ${result.errors.join(', ')}`);
  }
  return value as Pan;
}

/**
 * =============================================================================
 * TEMPORAL REFINEMENTS
 * =============================================================================
 */

/**
 * Beats per minute (BPM > 0, typically 20-300).
 */
export type BPM = number & { readonly __brand: 'BPM' };

export const BPM_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  finiteConstraint('BPM'),
  positiveConstraint('BPM'),
  rangeConstraint(20, 300, 'BPM'),
];

export function validateBPM(value: number): BPM {
  const result = validateRefinement(value, BPM_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid BPM: ${result.errors.join(', ')}`);
  }
  return value as BPM;
}

/**
 * Bar number (positive integer).
 */
export type BarNumber = number & { readonly __brand: 'BarNumber' };

export const BAR_NUMBER_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  integerConstraint('bar'),
  positiveConstraint('bar'),
];

export function validateBarNumber(value: number): BarNumber {
  const result = validateRefinement(value, BAR_NUMBER_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid bar number: ${result.errors.join(', ')}`);
  }
  return value as BarNumber;
}

/**
 * Beat number (non-negative number).
 */
export type BeatNumber = number & { readonly __brand: 'BeatNumber' };

export const BEAT_NUMBER_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  finiteConstraint('beat'),
  nonNegativeConstraint('beat'),
];

export function validateBeatNumber(value: number): BeatNumber {
  const result = validateRefinement(value, BEAT_NUMBER_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid beat number: ${result.errors.join(', ')}`);
  }
  return value as BeatNumber;
}

/**
 * Ticks (PPQN-based, non-negative integer).
 */
export type Ticks = number & { readonly __brand: 'Ticks' };

export const TICKS_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  integerConstraint('ticks'),
  nonNegativeConstraint('ticks'),
];

export function validateTicks(value: number): Ticks {
  const result = validateRefinement(value, TICKS_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid ticks: ${result.errors.join(', ')}`);
  }
  return value as Ticks;
}

/**
 * =============================================================================
 * PITCH REFINEMENTS
 * =============================================================================
 */

/**
 * MIDI note number (0-127).
 */
export type MidiNote = number & { readonly __brand: 'MidiNote' };

export const MIDI_NOTE_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  integerConstraint('MIDI note'),
  rangeConstraint(0, 127, 'MIDI note'),
];

export function validateMidiNote(value: number): MidiNote {
  const result = validateRefinement(value, MIDI_NOTE_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid MIDI note: ${result.errors.join(', ')}`);
  }
  return value as MidiNote;
}

/**
 * Semitones (can be negative, typically -24 to +24).
 */
export type Semitones = number & { readonly __brand: 'Semitones' };

export const SEMITONES_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  finiteConstraint('semitones'),
  rangeConstraint(-48, 48, 'semitones'),
];

export function validateSemitones(value: number): Semitones {
  const result = validateRefinement(value, SEMITONES_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid semitones: ${result.errors.join(', ')}`);
  }
  return value as Semitones;
}

/**
 * Cents (1/100 of a semitone, -100 to +100).
 */
export type Cents = number & { readonly __brand: 'Cents' };

export const CENTS_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  finiteConstraint('cents'),
  rangeConstraint(-100, 100, 'cents'),
];

export function validateCents(value: number): Cents {
  const result = validateRefinement(value, CENTS_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid cents: ${result.errors.join(', ')}`);
  }
  return value as Cents;
}

/**
 * Frequency (Hz, positive, typically 20-20000).
 */
export type Frequency = number & { readonly __brand: 'Frequency' };

export const FREQUENCY_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  finiteConstraint('frequency'),
  positiveConstraint('frequency'),
  rangeConstraint(20, 20000, 'frequency'),
];

export function validateFrequency(value: number): Frequency {
  const result = validateRefinement(value, FREQUENCY_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid frequency: ${result.errors.join(', ')}`);
  }
  return value as Frequency;
}

/**
 * =============================================================================
 * VELOCITY / DYNAMICS REFINEMENTS
 * =============================================================================
 */

/**
 * MIDI velocity (0-127).
 */
export type Velocity = number & { readonly __brand: 'Velocity' };

export const VELOCITY_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  integerConstraint('velocity'),
  rangeConstraint(0, 127, 'velocity'),
];

export function validateVelocity(value: number): Velocity {
  const result = validateRefinement(value, VELOCITY_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid velocity: ${result.errors.join(', ')}`);
  }
  return value as Velocity;
}

/**
 * Normalized velocity (0 to 1).
 */
export type NormalizedVelocity = Normalized;

/**
 * Dynamic marking (ppp=1 to fff=7).
 */
export type DynamicLevel = number & { readonly __brand: 'DynamicLevel' };

export const DYNAMIC_LEVEL_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  integerConstraint('dynamic level'),
  rangeConstraint(1, 7, 'dynamic level'),
];

export function validateDynamicLevel(value: number): DynamicLevel {
  const result = validateRefinement(value, DYNAMIC_LEVEL_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid dynamic level: ${result.errors.join(', ')}`);
  }
  return value as DynamicLevel;
}

/**
 * =============================================================================
 * HARMONIC REFINEMENTS
 * =============================================================================
 */

/**
 * Scale degree (1-7 for diatonic, can extend).
 */
export type ScaleDegree = number & { readonly __brand: 'ScaleDegree' };

export const SCALE_DEGREE_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  integerConstraint('scale degree'),
  positiveConstraint('scale degree'),
  rangeConstraint(1, 7, 'scale degree'),
];

export function validateScaleDegree(value: number): ScaleDegree {
  const result = validateRefinement(value, SCALE_DEGREE_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid scale degree: ${result.errors.join(', ')}`);
  }
  return value as ScaleDegree;
}

/**
 * Chord inversion (0=root position, 1=first inversion, etc.).
 */
export type ChordInversion = number & { readonly __brand: 'ChordInversion' };

export const CHORD_INVERSION_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  integerConstraint('chord inversion'),
  nonNegativeConstraint('chord inversion'),
  rangeConstraint(0, 3, 'chord inversion'),
];

export function validateChordInversion(value: number): ChordInversion {
  const result = validateRefinement(value, CHORD_INVERSION_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid chord inversion: ${result.errors.join(', ')}`);
  }
  return value as ChordInversion;
}

/**
 * Voicing spread (octaves, 0-4).
 */
export type VoicingSpread = number & { readonly __brand: 'VoicingSpread' };

export const VOICING_SPREAD_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  finiteConstraint('voicing spread'),
  nonNegativeConstraint('voicing spread'),
  rangeConstraint(0, 4, 'voicing spread'),
];

export function validateVoicingSpread(value: number): VoicingSpread {
  const result = validateRefinement(value, VOICING_SPREAD_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid voicing spread: ${result.errors.join(', ')}`);
  }
  return value as VoicingSpread;
}

/**
 * =============================================================================
 * RHYTHMIC REFINEMENTS
 * =============================================================================
 */

/**
 * Swing amount (0=straight, 0.5=triplet swing, 1=full swing).
 */
export type SwingAmount = number & { readonly __brand: 'SwingAmount' };

export const SWING_AMOUNT_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  finiteConstraint('swing'),
  rangeConstraint(0, 1, 'swing'),
];

export function validateSwingAmount(value: number): SwingAmount {
  const result = validateRefinement(value, SWING_AMOUNT_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid swing amount: ${result.errors.join(', ')}`);
  }
  return value as SwingAmount;
}

/**
 * Quantize strength (0=no quantize, 1=full quantize).
 */
export type QuantizeStrength = Normalized;

/**
 * Humanize amount (0=perfect, 1=very human).
 */
export type HumanizeAmount = Normalized;

/**
 * Note density (notes per beat, 0-16).
 */
export type NoteDensity = number & { readonly __brand: 'NoteDensity' };

export const NOTE_DENSITY_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  finiteConstraint('note density'),
  nonNegativeConstraint('note density'),
  rangeConstraint(0, 16, 'note density'),
];

export function validateNoteDensity(value: number): NoteDensity {
  const result = validateRefinement(value, NOTE_DENSITY_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid note density: ${result.errors.join(', ')}`);
  }
  return value as NoteDensity;
}

/**
 * =============================================================================
 * SPATIAL / MIX REFINEMENTS
 * =============================================================================
 */

/**
 * Stereo width (0=mono, 1=full stereo).
 */
export type StereoWidth = Normalized;

/**
 * Reverb send (0=dry, 1=full wet).
 */
export type ReverbSend = Normalized;

/**
 * Delay time (milliseconds, 0-2000).
 */
export type DelayTime = number & { readonly __brand: 'DelayTime' };

export const DELAY_TIME_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  finiteConstraint('delay time'),
  nonNegativeConstraint('delay time'),
  rangeConstraint(0, 2000, 'delay time'),
];

export function validateDelayTime(value: number): DelayTime {
  const result = validateRefinement(value, DELAY_TIME_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid delay time: ${result.errors.join(', ')}`);
  }
  return value as DelayTime;
}

/**
 * Filter frequency (Hz, 20-20000).
 */
export type FilterFrequency = Frequency;

/**
 * Filter resonance (Q, 0.1-20).
 */
export type FilterResonance = number & { readonly __brand: 'FilterResonance' };

export const FILTER_RESONANCE_CONSTRAINTS: readonly RefinementConstraint<number>[] = [
  finiteConstraint('filter resonance'),
  positiveConstraint('filter resonance'),
  rangeConstraint(0.1, 20, 'filter resonance'),
];

export function validateFilterResonance(value: number): FilterResonance {
  const result = validateRefinement(value, FILTER_RESONANCE_CONSTRAINTS);
  if (!result.valid) {
    throw new Error(`Invalid filter resonance: ${result.errors.join(', ')}`);
  }
  return value as FilterResonance;
}

/**
 * =============================================================================
 * COMPOSITE REFINEMENTS (MULTIPLE CONSTRAINTS)
 * =============================================================================
 */

/**
 * ADSR envelope values (0-10 seconds for attack/decay/release, 0-1 for sustain).
 */
export interface ADSREnvelope {
  readonly attack: number; // seconds
  readonly decay: number; // seconds
  readonly sustain: Normalized; // level
  readonly release: number; // seconds
}

export const ADSR_CONSTRAINTS = {
  attack: [finiteConstraint('attack'), nonNegativeConstraint('attack'), rangeConstraint(0, 10, 'attack')],
  decay: [finiteConstraint('decay'), nonNegativeConstraint('decay'), rangeConstraint(0, 10, 'decay')],
  sustain: NORMALIZED_CONSTRAINTS,
  release: [finiteConstraint('release'), nonNegativeConstraint('release'), rangeConstraint(0, 10, 'release')],
} as const;

export function validateADSR(envelope: ADSREnvelope): RefinementResult {
  const errors: string[] = [];

  const attackResult = validateRefinement(envelope.attack, ADSR_CONSTRAINTS.attack);
  errors.push(...attackResult.errors);

  const decayResult = validateRefinement(envelope.decay, ADSR_CONSTRAINTS.decay);
  errors.push(...decayResult.errors);

  const sustainResult = validateRefinement(envelope.sustain, ADSR_CONSTRAINTS.sustain);
  errors.push(...sustainResult.errors);

  const releaseResult = validateRefinement(envelope.release, ADSR_CONSTRAINTS.release);
  errors.push(...releaseResult.errors);

  return { valid: errors.length === 0, errors };
}

/**
 * Time signature (numerator/denominator).
 */
export interface TimeSignature {
  readonly numerator: number; // beats per bar
  readonly denominator: number; // note value (4=quarter, 8=eighth, etc.)
}

export const TIME_SIGNATURE_CONSTRAINTS = {
  numerator: [integerConstraint('numerator'), positiveConstraint('numerator'), rangeConstraint(1, 16, 'numerator')],
  denominator: [
    integerConstraint('denominator'),
    {
      name: 'power-of-two',
      description: 'Denominator must be a power of two',
      predicate: (value: number) => {
        return [1, 2, 4, 8, 16, 32].includes(value);
      },
      errorMessage: (value: number) => `Denominator ${value} must be a power of two (1,2,4,8,16,32)`,
    },
  ],
} as const;

export function validateTimeSignature(ts: TimeSignature): RefinementResult {
  const errors: string[] = [];

  const numeratorResult = validateRefinement(ts.numerator, TIME_SIGNATURE_CONSTRAINTS.numerator);
  errors.push(...numeratorResult.errors);

  const denominatorResult = validateRefinement(ts.denominator, TIME_SIGNATURE_CONSTRAINTS.denominator);
  errors.push(...denominatorResult.errors);

  return { valid: errors.length === 0, errors };
}

/**
 * =============================================================================
 * VALIDATION REGISTRY
 * =============================================================================
 */

/**
 * Registry of all refinement validators.
 */
export const REFINEMENT_VALIDATORS = {
  // Normalized values
  normalized: validateNormalized,
  percentage: validatePercentage,
  decibels: validateDecibels,
  gain: validateGain,
  pan: validatePan,

  // Temporal
  bpm: validateBPM,
  barNumber: validateBarNumber,
  beatNumber: validateBeatNumber,
  ticks: validateTicks,

  // Pitch
  midiNote: validateMidiNote,
  semitones: validateSemitones,
  cents: validateCents,
  frequency: validateFrequency,

  // Dynamics
  velocity: validateVelocity,
  dynamicLevel: validateDynamicLevel,

  // Harmonic
  scaleDegree: validateScaleDegree,
  chordInversion: validateChordInversion,
  voicingSpread: validateVoicingSpread,

  // Rhythmic
  swingAmount: validateSwingAmount,
  noteDensity: validateNoteDensity,

  // Spatial/mix
  delayTime: validateDelayTime,
  filterResonance: validateFilterResonance,

  // Composite
  adsr: validateADSR,
  timeSignature: validateTimeSignature,
} as const;

/**
 * =============================================================================
 * UTILITY FUNCTIONS
 * =============================================================================
 */

/**
 * Clamp a value to a range.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Normalize a value from [inMin, inMax] to [0, 1].
 */
export function normalize(value: number, inMin: number, inMax: number): Normalized {
  return validateNormalized((value - inMin) / (inMax - inMin));
}

/**
 * Denormalize a value from [0, 1] to [outMin, outMax].
 */
export function denormalize(normalized: Normalized, outMin: number, outMax: number): number {
  return normalized * (outMax - outMin) + outMin;
}

/**
 * Convert MIDI note to frequency (Hz).
 */
export function midiToFrequency(note: MidiNote): Frequency {
  return validateFrequency(440 * Math.pow(2, (note - 69) / 12));
}

/**
 * Convert frequency to MIDI note (rounded).
 */
export function frequencyToMidi(freq: Frequency): MidiNote {
  return validateMidiNote(Math.round(69 + 12 * Math.log2(freq / 440)));
}

/**
 * Convert decibels to gain (linear).
 */
export function dbToGain(db: Decibels): Gain {
  return validateGain(Math.pow(10, db / 20));
}

/**
 * Convert gain to decibels.
 */
export function gainToDb(gain: Gain): Decibels {
  return validateDecibels(20 * Math.log10(gain));
}

/**
 * =============================================================================
 * SUMMARY
 * =============================================================================
 * 
 * This module defines comprehensive refinement constraints for all musical values:
 * 
 * **Perceptual axes:**
 * - Normalized (0-1), Percentage (0-100)
 * - Decibels (-60 to +12), Gain (0-4)
 * - Pan (-1 to +1)
 * 
 * **Temporal:**
 * - BPM (20-300), Bar/Beat numbers, Ticks
 * 
 * **Pitch:**
 * - MIDI notes (0-127), Semitones, Cents
 * - Frequency (20-20000 Hz)
 * 
 * **Dynamics:**
 * - Velocity (0-127), Dynamic levels (1-7)
 * 
 * **Harmonic:**
 * - Scale degrees (1-7), Chord inversions (0-3)
 * - Voicing spread (0-4 octaves)
 * 
 * **Rhythmic:**
 * - Swing (0-1), Quantize strength, Humanize
 * - Note density (0-16 per beat)
 * 
 * **Spatial/mix:**
 * - Stereo width, Reverb send
 * - Delay time (0-2000ms)
 * - Filter frequency/resonance
 * 
 * **Composite:**
 * - ADSR envelopes
 * - Time signatures
 * 
 * **Benefits:**
 * - Type-safe values (branded types)
 * - Runtime validation
 * - Clear error messages
 * - Self-documenting ranges
 * - Conversion utilities
 * 
 * **Cross-references:**
 * - Step 061: Unit system (temporal units)
 * - Step 068: MusicSpec constraints (harmony mapping)
 * - Step 070: ConstraintSchema types (extensibility)
 * - Step 311: Param schema validation (card parameters)
 */
