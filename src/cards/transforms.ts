/**
 * @fileoverview Transform Cards - MIDI and pattern transformation utilities.
 * 
 * This module provides cards for transforming musical data:
 * - Transpose (pitch shifting)
 * - Quantize (timing correction)
 * - Humanize (adding variation)
 * - Scale Constrain (forcing to scale)
 * - Velocity Curve (dynamic mapping)
 * - Time Stretch (tempo independent)
 * - Chord Voicing (intelligent voicing)
 * - Pattern Transform (rotate, reverse, etc.)
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * MIDI note event.
 */
export interface MidiNoteEvent {
  readonly note: number;        // 0-127
  readonly velocity: number;    // 1-127 (0 = note off)
  readonly startTime: number;   // Time in ticks or ms
  readonly duration: number;    // Duration in ticks or ms
  readonly channel: number;     // 0-15
}

/**
 * Scale definition.
 */
export interface ScaleDefinition {
  readonly name: string;
  readonly intervals: readonly number[];
}

/**
 * Common scales.
 */
export const SCALES: Record<string, ScaleDefinition> = {
  major: { name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11] },
  minor: { name: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10] },
  harmonicMinor: { name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  melodicMinor: { name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11] },
  dorian: { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  phrygian: { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10] },
  lydian: { name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11] },
  mixolydian: { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
  locrian: { name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10] },
  pentatonicMajor: { name: 'Pentatonic Major', intervals: [0, 2, 4, 7, 9] },
  pentatonicMinor: { name: 'Pentatonic Minor', intervals: [0, 3, 5, 7, 10] },
  blues: { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
  wholeNote: { name: 'Whole Tone', intervals: [0, 2, 4, 6, 8, 10] },
  chromatic: { name: 'Chromatic', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  diminished: { name: 'Diminished', intervals: [0, 2, 3, 5, 6, 8, 9, 11] },
  augmented: { name: 'Augmented', intervals: [0, 3, 4, 7, 8, 11] },
};

// ============================================================================
// TRANSPOSE
// ============================================================================

/**
 * Transpose state.
 */
export interface TransposeState {
  readonly semitones: number;      // -48 to +48
  readonly octaves: number;        // -4 to +4
  readonly constrainToRange: boolean;
  readonly minNote: number;        // 0-127
  readonly maxNote: number;        // 0-127
  readonly wrapOctave: boolean;    // Wrap notes that go out of range
}

/**
 * Default transpose state.
 */
export const DEFAULT_TRANSPOSE_STATE: TransposeState = {
  semitones: 0,
  octaves: 0,
  constrainToRange: true,
  minNote: 0,
  maxNote: 127,
  wrapOctave: false,
};

/**
 * Transpose a single note.
 */
export function transposeNote(
  note: number,
  state: TransposeState
): number {
  const offset = state.semitones + (state.octaves * 12);
  let result = note + offset;
  
  if (state.constrainToRange) {
    if (state.wrapOctave) {
      // Wrap to keep note class but in valid range
      while (result < state.minNote) result += 12;
      while (result > state.maxNote) result -= 12;
    } else {
      result = Math.max(state.minNote, Math.min(state.maxNote, result));
    }
  }
  
  return result;
}

/**
 * Transpose a sequence of events.
 */
export function transposeEvents(
  events: readonly MidiNoteEvent[],
  state: TransposeState
): readonly MidiNoteEvent[] {
  return events.map(event => ({
    ...event,
    note: transposeNote(event.note, state),
  }));
}

// ============================================================================
// QUANTIZE
// ============================================================================

/**
 * Quantize grid values (in fractions of a whole note).
 */
export type QuantizeGrid = 
  | 1       // Whole
  | 0.5     // Half
  | 0.25    // Quarter
  | 0.125   // Eighth
  | 0.0625  // 16th
  | 0.03125 // 32nd
  | 'triplet-8'   // Eighth triplet
  | 'triplet-16'; // 16th triplet

/**
 * Quantize state.
 */
export interface QuantizeState {
  readonly grid: QuantizeGrid;
  readonly strength: number;      // 0-1 (0 = no quantize, 1 = full)
  readonly swing: number;         // 0-1 (swing on off-beats)
  readonly sensitivity: number;   // Distance threshold (0-1)
  readonly quantizeStart: boolean;
  readonly quantizeEnd: boolean;
  readonly humanize: number;      // Random offset (0-1)
}

/**
 * Default quantize state.
 */
export const DEFAULT_QUANTIZE_STATE: QuantizeState = {
  grid: 0.0625, // 16th notes
  strength: 1,
  swing: 0,
  sensitivity: 1,
  quantizeStart: true,
  quantizeEnd: false,
  humanize: 0,
};

/**
 * Convert grid value to ticks.
 */
export function gridToTicks(grid: QuantizeGrid, ppq: number): number {
  if (typeof grid === 'number') {
    return ppq * 4 * grid; // 4 = beats per whole note
  }
  
  switch (grid) {
    case 'triplet-8':
      return (ppq * 4 * 0.125) * (2 / 3);
    case 'triplet-16':
      return (ppq * 4 * 0.0625) * (2 / 3);
    default:
      return ppq;
  }
}

/**
 * Quantize a time value.
 */
export function quantizeTime(
  time: number,
  gridTicks: number,
  strength: number,
  swing: number = 0,
  isOffbeat: boolean = false
): number {
  // Find nearest grid point
  const gridIndex = Math.round(time / gridTicks);
  let quantizedTime = gridIndex * gridTicks;
  
  // Apply swing to off-beats
  if (isOffbeat && swing > 0) {
    const swingOffset = gridTicks * swing * 0.5;
    quantizedTime += swingOffset;
  }
  
  // Apply strength (interpolate between original and quantized)
  return time + (quantizedTime - time) * strength;
}

/**
 * Quantize a sequence of events.
 */
export function quantizeEvents(
  events: readonly MidiNoteEvent[],
  state: QuantizeState,
  ppq: number = 480
): readonly MidiNoteEvent[] {
  const gridTicks = gridToTicks(state.grid, ppq);
  
  return events.map((event, _index) => {
    const isOffbeat = (Math.round(event.startTime / gridTicks) % 2) === 1;
    
    let startTime = event.startTime;
    let duration = event.duration;
    
    if (state.quantizeStart) {
      startTime = quantizeTime(
        event.startTime,
        gridTicks,
        state.strength,
        state.swing,
        isOffbeat
      );
      
      // Apply humanize
      if (state.humanize > 0) {
        const randomOffset = (Math.random() - 0.5) * 2 * state.humanize * gridTicks * 0.25;
        startTime += randomOffset;
      }
    }
    
    if (state.quantizeEnd) {
      const endTime = event.startTime + event.duration;
      const quantizedEnd = quantizeTime(
        endTime,
        gridTicks,
        state.strength,
        state.swing,
        !isOffbeat
      );
      duration = quantizedEnd - startTime;
    }
    
    return {
      ...event,
      startTime: Math.max(0, startTime),
      duration: Math.max(1, duration),
    };
  });
}

// ============================================================================
// HUMANIZE
// ============================================================================

/**
 * Humanize state.
 */
export interface HumanizeState {
  readonly timingVariation: number;   // 0-1 (timing randomness)
  readonly velocityVariation: number; // 0-1 (velocity randomness)
  readonly durationVariation: number; // 0-1 (length randomness)
  readonly seed?: number;             // Random seed for reproducibility
}

/**
 * Default humanize state.
 */
export const DEFAULT_HUMANIZE_STATE: HumanizeState = {
  timingVariation: 0.1,
  velocityVariation: 0.15,
  durationVariation: 0.1,
};

/**
 * Simple seeded random generator.
 */
export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
}

/**
 * Humanize a sequence of events.
 */
export function humanizeEvents(
  events: readonly MidiNoteEvent[],
  state: HumanizeState,
  ppq: number = 480
): readonly MidiNoteEvent[] {
  const random = state.seed !== undefined 
    ? seededRandom(state.seed)
    : Math.random;
  
  const maxTimingOffset = ppq * 0.1 * state.timingVariation; // 10% of a beat
  const maxVelocityOffset = 30 * state.velocityVariation;
  const maxDurationOffset = 0.3 * state.durationVariation;
  
  return events.map(event => {
    const timingOffset = (random() - 0.5) * 2 * maxTimingOffset;
    const velocityOffset = Math.round((random() - 0.5) * 2 * maxVelocityOffset);
    const durationFactor = 1 + (random() - 0.5) * 2 * maxDurationOffset;
    
    return {
      ...event,
      startTime: Math.max(0, event.startTime + timingOffset),
      velocity: Math.max(1, Math.min(127, event.velocity + velocityOffset)),
      duration: Math.max(1, event.duration * durationFactor),
    };
  });
}

// ============================================================================
// SCALE CONSTRAIN
// ============================================================================

/**
 * Scale constrain mode.
 */
export type ScaleConstrainMode = 
  | 'nearest'    // Move to nearest scale note
  | 'lower'      // Move to lower scale note
  | 'higher'     // Move to higher scale note
  | 'remove';    // Remove non-scale notes

/**
 * Scale constrain state.
 */
export interface ScaleConstrainState {
  readonly root: number;          // 0-11 (C=0)
  readonly scale: string;         // Scale name
  readonly mode: ScaleConstrainMode;
  readonly applyToVelocity: boolean; // Reduce velocity of adjusted notes
  readonly velocityReduction: number; // 0-1
}

/**
 * Default scale constrain state.
 */
export const DEFAULT_SCALE_CONSTRAIN_STATE: ScaleConstrainState = {
  root: 0,
  scale: 'major',
  mode: 'nearest',
  applyToVelocity: false,
  velocityReduction: 0.2,
};

/**
 * Get scale notes for a given root.
 */
export function getScaleNoteClasses(root: number, scaleName: string): readonly number[] {
  const scale = SCALES[scaleName] ?? SCALES.major!;
  return scale.intervals.map(i => (root + i) % 12);
}

/**
 * Check if a note is in scale.
 */
export function isNoteInScale(note: number, root: number, scaleName: string): boolean {
  const noteClass = note % 12;
  const scaleNotes = getScaleNoteClasses(root, scaleName);
  return scaleNotes.includes(noteClass);
}

/**
 * Find nearest scale note.
 */
export function findNearestScaleNote(
  note: number,
  root: number,
  scaleName: string,
  mode: ScaleConstrainMode
): number {
  if (isNoteInScale(note, root, scaleName)) {
    return note;
  }
  
  const scaleNotes = getScaleNoteClasses(root, scaleName);
  const noteClass = note % 12;
  const octave = Math.floor(note / 12);
  
  // Find distances to all scale notes
  const distances = scaleNotes.map(scaleNote => {
    const diff = scaleNote - noteClass;
    return {
      scaleNote,
      distUp: diff >= 0 ? diff : diff + 12,
      distDown: diff <= 0 ? -diff : 12 - diff,
    };
  });
  
  let targetNoteClass: number;
  
  switch (mode) {
    case 'lower':
      const lower = distances.reduce((min, d) => 
        d.distDown < min.distDown ? d : min
      );
      targetNoteClass = lower.scaleNote;
      return octave * 12 + targetNoteClass - (lower.distDown > 0 && targetNoteClass > noteClass ? 0 : 0);
      
    case 'higher':
      const higher = distances.reduce((min, d) => 
        d.distUp < min.distUp ? d : min
      );
      targetNoteClass = higher.scaleNote;
      break;
      
    case 'nearest':
    default:
      const nearest = distances.reduce((min, d) => {
        const minDist = Math.min(d.distUp, d.distDown);
        const currentMinDist = Math.min(min.distUp, min.distDown);
        return minDist < currentMinDist ? d : min;
      });
      const goUp = nearest.distUp <= nearest.distDown;
      targetNoteClass = nearest.scaleNote;
      return note + (goUp ? nearest.distUp : -nearest.distDown);
  }
  
  return octave * 12 + targetNoteClass;
}

/**
 * Constrain events to scale.
 */
export function constrainToScale(
  events: readonly MidiNoteEvent[],
  state: ScaleConstrainState
): readonly MidiNoteEvent[] {
  if (state.mode === 'remove') {
    return events.filter(event => 
      isNoteInScale(event.note, state.root, state.scale)
    );
  }
  
  return events.map(event => {
    const wasInScale = isNoteInScale(event.note, state.root, state.scale);
    const newNote = findNearestScaleNote(event.note, state.root, state.scale, state.mode);
    
    let newVelocity = event.velocity;
    if (!wasInScale && state.applyToVelocity) {
      newVelocity = Math.round(event.velocity * (1 - state.velocityReduction));
    }
    
    return {
      ...event,
      note: newNote,
      velocity: Math.max(1, newVelocity),
    };
  });
}

// ============================================================================
// VELOCITY CURVE
// ============================================================================

/**
 * Velocity curve type.
 */
export type VelocityCurveType = 
  | 'linear'
  | 'exponential'
  | 'logarithmic'
  | 'scurve'
  | 'fixed'
  | 'compress'
  | 'expand';

/**
 * Velocity curve state.
 */
export interface VelocityCurveState {
  readonly curveType: VelocityCurveType;
  readonly inputMin: number;      // 0-127
  readonly inputMax: number;      // 0-127
  readonly outputMin: number;     // 0-127
  readonly outputMax: number;     // 0-127
  readonly curvature: number;     // 0-2 (1 = linear)
  readonly fixedVelocity: number; // For 'fixed' type
}

/**
 * Default velocity curve state.
 */
export const DEFAULT_VELOCITY_CURVE_STATE: VelocityCurveState = {
  curveType: 'linear',
  inputMin: 0,
  inputMax: 127,
  outputMin: 0,
  outputMax: 127,
  curvature: 1,
  fixedVelocity: 100,
};

/**
 * Apply velocity curve to a single value.
 */
export function applyVelocityCurve(
  velocity: number,
  state: VelocityCurveState
): number {
  if (state.curveType === 'fixed') {
    return state.fixedVelocity;
  }
  
  // Normalize input to 0-1
  const inputRange = state.inputMax - state.inputMin;
  const normalized = inputRange > 0 
    ? Math.max(0, Math.min(1, (velocity - state.inputMin) / inputRange))
    : 0;
  
  // Apply curve
  let curved: number;
  switch (state.curveType) {
    case 'exponential':
      curved = Math.pow(normalized, state.curvature);
      break;
    case 'logarithmic':
      curved = Math.pow(normalized, 1 / state.curvature);
      break;
    case 'scurve':
      // S-curve using smoothstep-like function
      const t = normalized;
      curved = t * t * (3 - 2 * t);
      break;
    case 'compress':
      // Reduce dynamic range
      const compressRatio = state.curvature;
      curved = normalized / compressRatio + (1 - 1 / compressRatio) * 0.5;
      break;
    case 'expand':
      // Expand dynamic range
      const expandRatio = state.curvature;
      curved = (normalized - 0.5) * expandRatio + 0.5;
      curved = Math.max(0, Math.min(1, curved));
      break;
    case 'linear':
    default:
      curved = normalized;
  }
  
  // Map to output range
  const outputRange = state.outputMax - state.outputMin;
  const output = state.outputMin + curved * outputRange;
  
  return Math.round(Math.max(1, Math.min(127, output)));
}

/**
 * Apply velocity curve to events.
 */
export function applyVelocityCurveToEvents(
  events: readonly MidiNoteEvent[],
  state: VelocityCurveState
): readonly MidiNoteEvent[] {
  return events.map(event => ({
    ...event,
    velocity: applyVelocityCurve(event.velocity, state),
  }));
}

// ============================================================================
// TIME STRETCH
// ============================================================================

/**
 * Time stretch state.
 */
export interface TimeStretchState {
  readonly factor: number;        // 0.25-4 (0.5 = half speed, 2 = double)
  readonly preservePitch: boolean;
  readonly algorithm: 'simple' | 'granular' | 'phase';
  readonly grainSize: number;     // ms (for granular)
  readonly overlap: number;       // 0-1 (for granular)
}

/**
 * Default time stretch state.
 */
export const DEFAULT_TIME_STRETCH_STATE: TimeStretchState = {
  factor: 1,
  preservePitch: true,
  algorithm: 'simple',
  grainSize: 50,
  overlap: 0.5,
};

/**
 * Apply time stretch to events.
 */
export function timeStretchEvents(
  events: readonly MidiNoteEvent[],
  factor: number
): readonly MidiNoteEvent[] {
  return events.map(event => ({
    ...event,
    startTime: event.startTime * factor,
    duration: event.duration * factor,
  }));
}

// ============================================================================
// PATTERN TRANSFORM
// ============================================================================

/**
 * Pattern transform type.
 */
export type PatternTransformType = 
  | 'reverse'       // Reverse in time
  | 'invert'        // Invert pitches
  | 'retrograde'    // Reverse + invert
  | 'rotate'        // Rotate by N steps
  | 'shuffle'       // Randomize order
  | 'expand'        // Double duration
  | 'compress'      // Halve duration
  | 'echo'          // Add delayed copies
  | 'stutter';      // Repeat notes

/**
 * Pattern transform state.
 */
export interface PatternTransformState {
  readonly type: PatternTransformType;
  readonly rotateSteps: number;    // For rotate
  readonly invertCenter: number;   // MIDI note for inversion axis
  readonly echoCount: number;      // Number of echoes
  readonly echoDelay: number;      // Delay between echoes
  readonly echoDecay: number;      // Velocity decay (0-1)
  readonly stutterCount: number;   // Number of stutters
  readonly stutterDivision: number; // Divide duration by this
}

/**
 * Default pattern transform state.
 */
export const DEFAULT_PATTERN_TRANSFORM_STATE: PatternTransformState = {
  type: 'reverse',
  rotateSteps: 1,
  invertCenter: 60,
  echoCount: 3,
  echoDelay: 240,
  echoDecay: 0.7,
  stutterCount: 4,
  stutterDivision: 4,
};

/**
 * Reverse pattern in time.
 */
export function reversePattern(
  events: readonly MidiNoteEvent[]
): readonly MidiNoteEvent[] {
  if (events.length === 0) return [];
  
  // Find the end time
  const endTime = Math.max(...events.map(e => e.startTime + e.duration));
  
  return events.map(event => ({
    ...event,
    startTime: endTime - event.startTime - event.duration,
  })).sort((a, b) => a.startTime - b.startTime);
}

/**
 * Invert pattern pitches.
 */
export function invertPattern(
  events: readonly MidiNoteEvent[],
  center: number
): readonly MidiNoteEvent[] {
  return events.map(event => ({
    ...event,
    note: Math.max(0, Math.min(127, center * 2 - event.note)),
  }));
}

/**
 * Rotate pattern by N steps.
 */
export function rotatePattern(
  events: readonly MidiNoteEvent[],
  steps: number
): readonly MidiNoteEvent[] {
  if (events.length === 0) return [];
  
  const sorted = [...events].sort((a, b) => a.startTime - b.startTime);
  
  // Get note starts as percentage
  const rotated = sorted.map((event, i) => {
    const newIndex = (i + steps) % events.length;
    const targetEvent = sorted[newIndex]!;
    return {
      ...event,
      note: targetEvent.note,
      velocity: targetEvent.velocity,
    };
  });
  
  return rotated;
}

/**
 * Shuffle pattern (randomize note assignments).
 */
export function shufflePattern(
  events: readonly MidiNoteEvent[]
): readonly MidiNoteEvent[] {
  const notes = events.map(e => ({ note: e.note, velocity: e.velocity }));
  
  // Fisher-Yates shuffle
  for (let i = notes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [notes[i], notes[j]] = [notes[j]!, notes[i]!];
  }
  
  return events.map((event, i) => ({
    ...event,
    note: notes[i]!.note,
    velocity: notes[i]!.velocity,
  }));
}

/**
 * Add echo copies.
 */
export function echoPattern(
  events: readonly MidiNoteEvent[],
  count: number,
  delay: number,
  decay: number
): readonly MidiNoteEvent[] {
  const result: MidiNoteEvent[] = [...events];
  
  for (let i = 1; i <= count; i++) {
    const velocityFactor = Math.pow(decay, i);
    
    for (const event of events) {
      result.push({
        ...event,
        startTime: event.startTime + delay * i,
        velocity: Math.max(1, Math.round(event.velocity * velocityFactor)),
      });
    }
  }
  
  return result.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Add stutter effect.
 */
export function stutterPattern(
  events: readonly MidiNoteEvent[],
  count: number,
  division: number
): readonly MidiNoteEvent[] {
  const result: MidiNoteEvent[] = [];
  
  for (const event of events) {
    const stutterDuration = event.duration / division;
    
    for (let i = 0; i < count; i++) {
      result.push({
        ...event,
        startTime: event.startTime + i * stutterDuration,
        duration: stutterDuration * 0.9, // Slightly shorter for separation
        velocity: Math.max(1, Math.round(event.velocity * (1 - i * 0.1))),
      });
    }
  }
  
  return result.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Apply pattern transform.
 */
export function transformPattern(
  events: readonly MidiNoteEvent[],
  state: PatternTransformState
): readonly MidiNoteEvent[] {
  switch (state.type) {
    case 'reverse':
      return reversePattern(events);
    case 'invert':
      return invertPattern(events, state.invertCenter);
    case 'retrograde':
      return invertPattern(reversePattern(events), state.invertCenter);
    case 'rotate':
      return rotatePattern(events, state.rotateSteps);
    case 'shuffle':
      return shufflePattern(events);
    case 'expand':
      return timeStretchEvents(events, 2);
    case 'compress':
      return timeStretchEvents(events, 0.5);
    case 'echo':
      return echoPattern(events, state.echoCount, state.echoDelay, state.echoDecay);
    case 'stutter':
      return stutterPattern(events, state.stutterCount, state.stutterDivision);
    default:
      return events;
  }
}

// ============================================================================
// CHORD VOICING TRANSFORM
// ============================================================================

/**
 * Chord voicing spread.
 */
export type VoicingSpread = 'close' | 'open' | 'drop2' | 'drop3' | 'quartal';

/**
 * Chord voicing state.
 */
export interface ChordVoicingState {
  readonly spread: VoicingSpread;
  readonly octave: number;        // Base octave offset
  readonly inversion: number;     // 0, 1, 2, 3
  readonly addBass: boolean;      // Add bass note
  readonly bassOctave: number;    // Bass octave offset
  readonly voiceLimit: number;    // Max voices (0 = no limit)
}

/**
 * Default chord voicing state.
 */
export const DEFAULT_CHORD_VOICING_STATE: ChordVoicingState = {
  spread: 'close',
  octave: 0,
  inversion: 0,
  addBass: false,
  bassOctave: -1,
  voiceLimit: 0,
};

/**
 * Apply voicing spread to chord notes.
 */
export function applyVoicingSpread(
  notes: readonly number[],
  spread: VoicingSpread
): readonly number[] {
  if (notes.length < 2) return notes;
  
  const sorted = [...notes].sort((a, b) => a - b);
  
  switch (spread) {
    case 'close':
      return sorted;
      
    case 'open':
      // Every other note up an octave
      return sorted.map((note, i) => i % 2 === 1 ? note + 12 : note);
      
    case 'drop2':
      if (sorted.length >= 3) {
        const second = sorted[sorted.length - 2]!;
        return [second - 12, ...sorted.filter((_, i) => i !== sorted.length - 2)];
      }
      return sorted;
      
    case 'drop3':
      if (sorted.length >= 4) {
        const third = sorted[sorted.length - 3]!;
        return [third - 12, ...sorted.filter((_, i) => i !== sorted.length - 3)];
      }
      return sorted;
      
    case 'quartal':
      // Build in 4ths from lowest note
      const root = sorted[0]!;
      return sorted.map((_, i) => root + i * 5); // Perfect 4ths
      
    default:
      return sorted;
  }
}

/**
 * Apply inversion to chord notes.
 */
export function applyInversion(
  notes: readonly number[],
  inversion: number
): readonly number[] {
  if (notes.length < 2 || inversion === 0) return notes;
  
  const sorted = [...notes].sort((a, b) => a - b);
  const result = [...sorted];
  
  for (let i = 0; i < inversion && i < notes.length; i++) {
    const note = result.shift()!;
    result.push(note + 12);
  }
  
  return result;
}

/**
 * Transform chord voicing.
 */
export function transformChordVoicing(
  notes: readonly number[],
  state: ChordVoicingState
): readonly number[] {
  let result = [...notes];
  
  // Apply spread
  result = [...applyVoicingSpread(result, state.spread)];
  
  // Apply inversion
  result = [...applyInversion(result, state.inversion)];
  
  // Apply octave offset
  result = result.map(n => n + state.octave * 12);
  
  // Add bass note
  if (state.addBass && result.length > 0) {
    const bass = Math.min(...result) + state.bassOctave * 12;
    result = [bass, ...result];
  }
  
  // Apply voice limit
  if (state.voiceLimit > 0 && result.length > state.voiceLimit) {
    result = result.slice(0, state.voiceLimit);
  }
  
  // Clamp to valid MIDI range
  return result
    .map(n => Math.max(0, Math.min(127, n)))
    .filter((n, i, arr) => arr.indexOf(n) === i); // Remove duplicates
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Merge overlapping notes.
 */
export function mergeOverlappingNotes(
  events: readonly MidiNoteEvent[]
): readonly MidiNoteEvent[] {
  const sorted = [...events].sort((a, b) => 
    a.note - b.note || a.startTime - b.startTime
  );
  
  const result: MidiNoteEvent[] = [];
  
  for (const event of sorted) {
    const last = result[result.length - 1];
    
    if (last && last.note === event.note) {
      const lastEnd = last.startTime + last.duration;
      
      if (event.startTime <= lastEnd) {
        // Merge
        const newEnd = Math.max(lastEnd, event.startTime + event.duration);
        result[result.length - 1] = {
          ...last,
          duration: newEnd - last.startTime,
          velocity: Math.max(last.velocity, event.velocity),
        };
        continue;
      }
    }
    
    result.push(event);
  }
  
  return result.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Remove duplicate notes at same time.
 */
export function removeDuplicateNotes(
  events: readonly MidiNoteEvent[]
): readonly MidiNoteEvent[] {
  const seen = new Set<string>();
  
  return events.filter(event => {
    const key = `${event.note}-${event.startTime}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Split long notes into repeated notes.
 */
export function splitLongNotes(
  events: readonly MidiNoteEvent[],
  maxDuration: number,
  gap: number = 0
): readonly MidiNoteEvent[] {
  const result: MidiNoteEvent[] = [];
  
  for (const event of events) {
    if (event.duration <= maxDuration) {
      result.push(event);
    } else {
      let remaining = event.duration;
      let currentTime = event.startTime;
      
      while (remaining > 0) {
        const duration = Math.min(maxDuration, remaining);
        result.push({
          ...event,
          startTime: currentTime,
          duration,
        });
        currentTime += duration + gap;
        remaining -= duration + gap;
      }
    }
  }
  
  return result;
}

// ============================================================================
// FUNCTIONAL TRANSFORM UTILITIES
// ============================================================================

/**
 * Map card - applies a custom mapper function to each event.
 */
export function mapEvents<E, F>(
  events: readonly E[],
  mapper: (event: E, index: number) => F
): readonly F[] {
  return events.map(mapper);
}

/**
 * FlatMap card - applies a mapper that can return multiple events.
 */
export function flatMapEvents<E, F>(
  events: readonly E[],
  mapper: (event: E, index: number) => readonly F[]
): readonly F[] {
  return events.flatMap(mapper);
}

/**
 * Take card - returns first N events.
 */
export function takeEvents<E>(
  events: readonly E[],
  count: number
): readonly E[] {
  return events.slice(0, Math.max(0, count));
}

/**
 * Drop card - skips first N events.
 */
export function dropEvents<E>(
  events: readonly E[],
  count: number
): readonly E[] {
  return events.slice(Math.max(0, count));
}

/**
 * MapCard state.
 */
export interface MapCardState<E, F> {
  readonly mapper: (event: E, index: number) => F;
}

/**
 * FlatMapCard state.
 */
export interface FlatMapCardState<E, F> {
  readonly mapper: (event: E, index: number) => readonly F[];
}

/**
 * TakeCard state.
 */
export interface TakeCardState {
  readonly count: number;
}

/**
 * DropCard state.
 */
export interface DropCardState {
  readonly count: number;
}
