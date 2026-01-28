/**
 * @fileoverview Generator Cards - Built-in cards for creating music.
 * 
 * This module provides ready-to-use generator cards including:
 * - Drum machines and drum kits
 * - Bass and lead synthesizers
 * - Chord and melody generators
 * - Arpeggiators and sequencers
 * - Sample players and loopers
 * - Orchestral and keyboard instruments
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Drum pad definition.
 */
export interface DrumPad {
  /** Pad index (0-15) */
  readonly index: number;
  /** MIDI note */
  readonly note: number;
  /** Pad name */
  readonly name: string;
  /** Sample ID */
  readonly sampleId: string | null;
  /** Velocity (0-127) */
  readonly velocity: number;
  /** Pan (-1 to 1) */
  readonly pan: number;
  /** Volume (0-1) */
  readonly volume: number;
  /** Muted */
  readonly muted: boolean;
  /** Solo */
  readonly solo: boolean;
  /** Pitch offset (semitones) */
  readonly pitch: number;
  /** Decay time (0-1) */
  readonly decay: number;
  /** Choke group (0 = none) */
  readonly chokeGroup: number;
}

/**
 * Default drum pad names (GM mapping).
 */
export const DEFAULT_DRUM_PAD_NAMES = [
  'Kick', 'Snare', 'Closed HH', 'Open HH',
  'Low Tom', 'Mid Tom', 'High Tom', 'Crash',
  'Ride', 'Clap', 'Rim', 'Cowbell',
  'Shaker', 'Tambourine', 'Clave', 'Conga',
] as const;

/**
 * Default drum pad MIDI notes (GM mapping).
 */
export const DEFAULT_DRUM_PAD_NOTES = [
  36, 38, 42, 46, // Kick, Snare, Closed HH, Open HH
  41, 45, 48, 49, // Low Tom, Mid Tom, High Tom, Crash
  51, 39, 37, 56, // Ride, Clap, Rim, Cowbell
  70, 54, 75, 63, // Shaker, Tambourine, Clave, Conga
] as const;

/**
 * Creates a default drum pad.
 */
export function createDrumPad(index: number): DrumPad {
  return {
    index,
    note: DEFAULT_DRUM_PAD_NOTES[index] ?? 36 + index,
    name: DEFAULT_DRUM_PAD_NAMES[index] ?? `Pad ${index + 1}`,
    sampleId: null,
    velocity: 100,
    pan: 0,
    volume: 1,
    muted: false,
    solo: false,
    pitch: 0,
    decay: 1,
    chokeGroup: 0,
  };
}

/**
 * Drum machine state.
 */
export interface DrumMachineState {
  /** The 16 pads */
  readonly pads: readonly DrumPad[];
  /** Current pattern (16 steps x 16 pads) */
  readonly pattern: readonly (readonly boolean[])[];
  /** Pattern length (1-16) */
  readonly patternLength: number;
  /** Current step */
  readonly currentStep: number;
  /** Swing amount (0-1) */
  readonly swing: number;
  /** Master volume */
  readonly volume: number;
  /** Is playing */
  readonly playing: boolean;
  /** Selected pad index */
  readonly selectedPad: number;
}

/**
 * Creates initial drum machine state.
 */
export function createDrumMachineState(): DrumMachineState {
  const pads = Array.from({ length: 16 }, (_, i) => createDrumPad(i));
  const pattern = Array.from({ length: 16 }, () => 
    Array.from({ length: 16 }, () => false)
  );
  
  return {
    pads,
    pattern,
    patternLength: 16,
    currentStep: 0,
    swing: 0,
    volume: 1,
    playing: false,
    selectedPad: 0,
  };
}

/**
 * Toggle step in drum pattern.
 */
export function toggleDrumStep(
  state: DrumMachineState,
  padIndex: number,
  stepIndex: number
): DrumMachineState {
  const newPattern = state.pattern.map((steps, pi) =>
    pi === padIndex
      ? steps.map((on, si) => (si === stepIndex ? !on : on))
      : steps
  );
  return { ...state, pattern: newPattern };
}

/**
 * Set drum step velocity.
 */
export function setDrumPadVelocity(
  state: DrumMachineState,
  padIndex: number,
  velocity: number
): DrumMachineState {
  const newPads = state.pads.map((pad, i) =>
    i === padIndex ? { ...pad, velocity: Math.max(0, Math.min(127, velocity)) } : pad
  );
  return { ...state, pads: newPads };
}

/**
 * Clear pattern for a pad.
 */
export function clearDrumPadPattern(
  state: DrumMachineState,
  padIndex: number
): DrumMachineState {
  const newPattern = state.pattern.map((steps, pi) =>
    pi === padIndex ? steps.map(() => false) : steps
  );
  return { ...state, pattern: newPattern };
}

/**
 * Clear entire pattern.
 */
export function clearDrumPattern(state: DrumMachineState): DrumMachineState {
  const newPattern = state.pattern.map(steps => steps.map(() => false));
  return { ...state, pattern: newPattern };
}

/**
 * Get active steps for current position.
 */
export function getActiveDrumPads(
  state: DrumMachineState,
  step: number
): readonly number[] {
  return state.pads
    .map((_pad, i) => (state.pattern[i]?.[step] ? i : -1))
    .filter(i => i >= 0);
}

// ============================================================================
// BASSLINE GENERATOR
// ============================================================================

/**
 * Bassline pattern style.
 */
export type BasslineStyle = 
  | 'walking'     // Jazz walking bass
  | 'octave'      // Octave jumps
  | 'root-fifth'  // Root and fifth
  | 'synth'       // Synth bass arpeggios
  | 'funky'       // Funky rhythmic
  | 'pedal'       // Pedal tone
  | 'disco'       // Disco octaves
  | 'reggae';     // Off-beat reggae

/**
 * Bassline generator state.
 */
export interface BasslineState {
  /** Root note (MIDI) */
  readonly rootNote: number;
  /** Scale type */
  readonly scale: string;
  /** Style preset */
  readonly style: BasslineStyle;
  /** Pattern length in steps */
  readonly patternLength: number;
  /** Generated pattern (note, velocity, duration) */
  readonly pattern: readonly BasslineNote[];
  /** Octave range (-2 to +2) */
  readonly octaveRange: number;
  /** Velocity variation (0-1) */
  readonly velocityVariation: number;
  /** Syncopation amount (0-1) */
  readonly syncopation: number;
  /** Glide/portamento (0-1) */
  readonly glide: number;
}

/**
 * Bassline note.
 */
export interface BasslineNote {
  readonly step: number;
  readonly note: number;
  readonly velocity: number;
  readonly duration: number; // In steps
  readonly glide: boolean;
}

/**
 * Default bassline state.
 */
export const DEFAULT_BASSLINE_STATE: BasslineState = {
  rootNote: 36, // C2
  scale: 'minor',
  style: 'root-fifth',
  patternLength: 16,
  pattern: [],
  octaveRange: 1,
  velocityVariation: 0.2,
  syncopation: 0.3,
  glide: 0,
};

/**
 * Scale intervals for bass generation.
 */
export const BASS_SCALE_INTERVALS: Record<string, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

/**
 * Generate bassline pattern.
 */
export function generateBassline(
  state: BasslineState,
  chordProgression?: readonly { root: number; quality: string }[]
): readonly BasslineNote[] {
  const notes: BasslineNote[] = [];
  const scaleIntervals = BASS_SCALE_INTERVALS[state.scale] ?? BASS_SCALE_INTERVALS.minor!;
  
  for (let step = 0; step < state.patternLength; step++) {
    const chord = chordProgression?.[Math.floor(step / 4) % (chordProgression.length || 1)];
    const baseNote = chord?.root ?? state.rootNote;
    
    let note: number;
    let velocity = 100;
    let duration = 1;
    let glide = false;
    
    switch (state.style) {
      case 'root-fifth':
        if (step % 4 === 0) {
          note = baseNote;
          velocity = 110;
        } else if (step % 4 === 2) {
          note = baseNote + 7; // Fifth
          velocity = 90;
        } else {
          continue; // Skip step
        }
        break;
        
      case 'octave':
        if (step % 2 === 0) {
          note = baseNote;
          velocity = 100 + (step % 4 === 0 ? 10 : 0);
        } else {
          note = baseNote + 12;
          velocity = 80;
        }
        break;
        
      case 'walking':
        const walkIndex = step % scaleIntervals.length;
        note = baseNote + scaleIntervals[walkIndex]!;
        velocity = 85 + Math.floor(Math.random() * 20);
        duration = 1;
        break;
        
      case 'synth':
        const synthIndex = step % 4;
        const synthNotes = [0, 12, 7, 12];
        note = baseNote + synthNotes[synthIndex]!;
        velocity = synthIndex === 0 ? 100 : 80;
        break;
        
      case 'funky':
        if (step % 8 === 0 || step % 8 === 3 || step % 8 === 6) {
          note = baseNote;
          velocity = 100;
        } else if (step % 8 === 4) {
          note = baseNote + 7;
          velocity = 85;
        } else {
          continue;
        }
        break;
        
      case 'pedal':
        note = baseNote;
        velocity = step % 4 === 0 ? 100 : 70;
        break;
        
      case 'disco':
        note = step % 2 === 0 ? baseNote : baseNote + 12;
        velocity = 100;
        break;
        
      case 'reggae':
        if (step % 4 === 2 || step % 4 === 3) {
          note = baseNote;
          velocity = 90;
        } else {
          continue;
        }
        break;
        
      default:
        note = baseNote;
        velocity = 100;
    }
    
    // Apply velocity variation
    velocity = Math.max(1, Math.min(127, 
      velocity + Math.floor((Math.random() - 0.5) * 2 * state.velocityVariation * 30)
    ));
    
    // Apply glide
    if (state.glide > 0 && Math.random() < state.glide * 0.3) {
      glide = true;
    }
    
    notes.push({ step, note, velocity, duration, glide });
  }
  
  return notes;
}

// ============================================================================
// CHORD PROGRESSION
// ============================================================================

/**
 * Chord quality.
 */
export type ChordQuality = 
  | 'major'
  | 'minor'
  | 'diminished'
  | 'augmented'
  | 'major7'
  | 'minor7'
  | 'dominant7'
  | 'dim7'
  | 'halfDim7'
  | 'sus2'
  | 'sus4'
  | 'add9'
  | 'power';

/**
 * Chord intervals by quality.
 */
export const CHORD_INTERVALS: Record<ChordQuality, readonly number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  dominant7: [0, 4, 7, 10],
  dim7: [0, 3, 6, 9],
  halfDim7: [0, 3, 6, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  add9: [0, 4, 7, 14],
  power: [0, 7],
};

/**
 * Voicing type.
 */
export type VoicingType = 
  | 'close'      // Close position
  | 'drop2'      // Drop 2 voicing
  | 'drop3'      // Drop 3 voicing
  | 'spread'     // Wide spread
  | 'shell'      // Root + 3rd + 7th only
  | 'rootless';  // Rootless (jazz)

/**
 * Chord definition.
 */
export interface ChordDefinition {
  readonly root: number;        // MIDI note
  readonly quality: ChordQuality;
  readonly inversion: number;   // 0 = root, 1 = first, etc.
  readonly voicing: VoicingType;
}

/**
 * Chord progression state.
 */
export interface ChordProgressionState {
  /** Chord sequence */
  readonly chords: readonly ChordDefinition[];
  /** Current chord index */
  readonly currentChord: number;
  /** Bars per chord */
  readonly barsPerChord: number;
  /** Voicing type */
  readonly voicing: VoicingType;
  /** Voice leading enabled */
  readonly voiceLeading: boolean;
  /** Inversion preference */
  readonly inversionRange: { min: number; max: number };
  /** Strum delay (ms) */
  readonly strumDelay: number;
  /** Dynamics curve */
  readonly dynamicsCurve: 'flat' | 'crescendo' | 'decrescendo' | 'wave';
}

/**
 * Default chord progression state.
 */
export const DEFAULT_CHORD_PROGRESSION_STATE: ChordProgressionState = {
  chords: [
    { root: 60, quality: 'major', inversion: 0, voicing: 'close' },
    { root: 65, quality: 'major', inversion: 0, voicing: 'close' },
    { root: 67, quality: 'major', inversion: 0, voicing: 'close' },
    { root: 60, quality: 'major', inversion: 0, voicing: 'close' },
  ],
  currentChord: 0,
  barsPerChord: 1,
  voicing: 'close',
  voiceLeading: true,
  inversionRange: { min: 0, max: 2 },
  strumDelay: 0,
  dynamicsCurve: 'flat',
};

/**
 * Get MIDI notes for a chord.
 */
export function getChordNotes(chord: ChordDefinition): readonly number[] {
  const intervals = CHORD_INTERVALS[chord.quality];
  let notes = intervals.map(i => chord.root + i);
  
  // Apply inversion
  for (let i = 0; i < chord.inversion && i < notes.length; i++) {
    notes = [...notes.slice(1), notes[0]! + 12];
  }
  
  // Apply voicing
  switch (chord.voicing) {
    case 'drop2':
      if (notes.length >= 4) {
        notes = [notes[0]!, notes[2]! - 12, notes[1]!, notes[3]!].sort((a, b) => a - b);
      }
      break;
    case 'drop3':
      if (notes.length >= 4) {
        notes = [notes[0]!, notes[3]! - 12, notes[1]!, notes[2]!].sort((a, b) => a - b);
      }
      break;
    case 'spread':
      notes = notes.map((n, i) => n + (i % 2 === 0 ? 0 : 12));
      break;
    case 'shell':
      notes = notes.filter((_, i) => i === 0 || i === 1 || i === notes.length - 1);
      break;
    case 'rootless':
      notes = notes.slice(1);
      break;
  }
  
  return notes;
}

/**
 * Apply voice leading to transition between chords.
 */
export function applyVoiceLeading(
  prevNotes: readonly number[],
  nextChord: ChordDefinition
): readonly number[] {
  const targetNotes = getChordNotes(nextChord);
  if (prevNotes.length === 0) return targetNotes;
  
  // Find closest voicing by minimizing total movement
  let bestNotes = targetNotes;
  let bestDistance = Infinity;
  
  // Try different inversions
  for (let inv = 0; inv < targetNotes.length; inv++) {
    const inverted = targetNotes.map((n, i) => {
      const offset = i < inv ? 12 : 0;
      return n + offset;
    }).sort((a, b) => a - b);
    
    // Calculate total voice movement
    const distance = prevNotes.reduce((sum, prev) => {
      const closest = inverted.reduce((c, n) => 
        Math.abs(n - prev) < Math.abs(c - prev) ? n : c
      );
      return sum + Math.abs(closest - prev);
    }, 0);
    
    if (distance < bestDistance) {
      bestDistance = distance;
      bestNotes = inverted;
    }
  }
  
  return bestNotes;
}

// ============================================================================
// MELODY GENERATOR
// ============================================================================

/**
 * Melody contour type.
 */
export type MelodyContour = 
  | 'ascending'
  | 'descending'
  | 'arch'
  | 'inverted-arch'
  | 'wave'
  | 'random'
  | 'static';

/**
 * Melody rhythm pattern.
 */
export type MelodyRhythm = 
  | 'straight'
  | 'syncopated'
  | 'dotted'
  | 'triplet'
  | 'mixed';

/**
 * Melody note.
 */
export interface MelodyNote {
  readonly step: number;
  readonly note: number;
  readonly velocity: number;
  readonly duration: number;
  readonly accent: boolean;
}

/**
 * Melody generator state.
 */
export interface MelodyState {
  /** Scale root */
  readonly rootNote: number;
  /** Scale type */
  readonly scale: string;
  /** Octave range */
  readonly octaveRange: number;
  /** Starting octave */
  readonly startOctave: number;
  /** Contour type */
  readonly contour: MelodyContour;
  /** Rhythm pattern */
  readonly rhythm: MelodyRhythm;
  /** Note density (0-1) */
  readonly density: number;
  /** Pattern length */
  readonly patternLength: number;
  /** Generated melody */
  readonly melody: readonly MelodyNote[];
  /** Step size probability (1=step, 2=skip, etc.) */
  readonly stepSizeProbability: readonly number[];
  /** Rest probability (0-1) */
  readonly restProbability: number;
}

/**
 * Default melody state.
 */
export const DEFAULT_MELODY_STATE: MelodyState = {
  rootNote: 60,
  scale: 'minor',
  octaveRange: 2,
  startOctave: 0,
  contour: 'arch',
  rhythm: 'straight',
  density: 0.75,
  patternLength: 16,
  melody: [],
  stepSizeProbability: [0.5, 0.3, 0.15, 0.05],
  restProbability: 0.1,
};

/**
 * Generate scale notes.
 */
export function getScaleNotes(
  root: number,
  scale: string,
  octaves: number
): readonly number[] {
  const intervals = BASS_SCALE_INTERVALS[scale] ?? BASS_SCALE_INTERVALS.minor!;
  const notes: number[] = [];
  
  for (let oct = 0; oct < octaves; oct++) {
    for (const interval of intervals) {
      notes.push(root + oct * 12 + interval);
    }
  }
  
  return notes;
}

/**
 * Generate melody.
 */
export function generateMelody(state: MelodyState): readonly MelodyNote[] {
  const scaleNotes = getScaleNotes(
    state.rootNote + state.startOctave * 12,
    state.scale,
    state.octaveRange
  );
  
  const melody: MelodyNote[] = [];
  let currentNoteIndex = Math.floor(scaleNotes.length / 2);
  
  for (let step = 0; step < state.patternLength; step++) {
    // Check if we should rest
    if (Math.random() < state.restProbability) {
      continue;
    }
    
    // Check density
    if (Math.random() > state.density) {
      continue;
    }
    
    // Calculate target direction based on contour
    let targetDirection = 0;
    const progress = step / state.patternLength;
    
    switch (state.contour) {
      case 'ascending':
        targetDirection = 1;
        break;
      case 'descending':
        targetDirection = -1;
        break;
      case 'arch':
        targetDirection = progress < 0.5 ? 1 : -1;
        break;
      case 'inverted-arch':
        targetDirection = progress < 0.5 ? -1 : 1;
        break;
      case 'wave':
        targetDirection = Math.sin(progress * Math.PI * 2) > 0 ? 1 : -1;
        break;
      case 'random':
        targetDirection = Math.random() > 0.5 ? 1 : -1;
        break;
      case 'static':
        targetDirection = 0;
        break;
    }
    
    // Choose step size
    let stepSize = 1;
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < state.stepSizeProbability.length; i++) {
      cumulative += state.stepSizeProbability[i]!;
      if (rand < cumulative) {
        stepSize = i + 1;
        break;
      }
    }
    
    // Apply movement
    currentNoteIndex = Math.max(0, Math.min(scaleNotes.length - 1,
      currentNoteIndex + targetDirection * stepSize
    ));
    
    const note = scaleNotes[currentNoteIndex]!;
    const accent = step % 4 === 0;
    const velocity = accent ? 100 : 80 + Math.floor(Math.random() * 20);
    
    melody.push({
      step,
      note,
      velocity,
      duration: 1,
      accent,
    });
  }
  
  return melody;
}

// ============================================================================
// ARPEGGIATOR
// ============================================================================

/**
 * Arpeggiator pattern type.
 */
export type ArpPattern = 
  | 'up'
  | 'down'
  | 'up-down'
  | 'down-up'
  | 'random'
  | 'order'        // Order played
  | 'converge'     // Outside to inside
  | 'diverge'      // Inside to outside
  | 'thumb';       // Thumb (lowest) repeated

/**
 * Arpeggiator state.
 */
export interface ArpeggiatorState {
  /** Held notes */
  readonly heldNotes: readonly number[];
  /** Pattern type */
  readonly pattern: ArpPattern;
  /** Rate in note values (1 = quarter, 0.5 = eighth) */
  readonly rate: number;
  /** Gate length (0-1) */
  readonly gate: number;
  /** Octave range (1-4) */
  readonly octaves: number;
  /** Swing amount (0-1) */
  readonly swing: number;
  /** Velocity mode */
  readonly velocityMode: 'original' | 'fixed' | 'accent' | 'random';
  /** Fixed velocity (0-127) */
  readonly fixedVelocity: number;
  /** Current step in pattern */
  readonly currentStep: number;
  /** Generated sequence */
  readonly sequence: readonly number[];
}

/**
 * Default arpeggiator state.
 */
export const DEFAULT_ARPEGGIATOR_STATE: ArpeggiatorState = {
  heldNotes: [],
  pattern: 'up',
  rate: 0.25, // 16th notes
  gate: 0.5,
  octaves: 1,
  swing: 0,
  velocityMode: 'accent',
  fixedVelocity: 100,
  currentStep: 0,
  sequence: [],
};

/**
 * Generate arpeggio sequence from held notes.
 */
export function generateArpSequence(state: ArpeggiatorState): readonly number[] {
  if (state.heldNotes.length === 0) return [];
  
  const sortedNotes = [...state.heldNotes].sort((a, b) => a - b);
  const sequence: number[] = [];
  
  // Expand octaves
  for (let oct = 0; oct < state.octaves; oct++) {
    for (const note of sortedNotes) {
      sequence.push(note + oct * 12);
    }
  }
  
  // Apply pattern
  switch (state.pattern) {
    case 'up':
      return sequence;
      
    case 'down':
      return [...sequence].reverse();
      
    case 'up-down':
      if (sequence.length <= 1) return sequence;
      return [...sequence, ...sequence.slice(1, -1).reverse()];
      
    case 'down-up':
      if (sequence.length <= 1) return sequence;
      return [...sequence.slice().reverse(), ...sequence.slice(1, -1)];
      
    case 'random':
      return [...sequence].sort(() => Math.random() - 0.5);
      
    case 'order':
      // Keep original order, expanded by octaves
      const orderSeq: number[] = [];
      for (let oct = 0; oct < state.octaves; oct++) {
        for (const note of state.heldNotes) {
          orderSeq.push(note + oct * 12);
        }
      }
      return orderSeq;
      
    case 'converge':
      const converged: number[] = [];
      let left = 0, right = sequence.length - 1;
      while (left <= right) {
        if (left === right) {
          converged.push(sequence[left]!);
        } else {
          converged.push(sequence[left]!, sequence[right]!);
        }
        left++;
        right--;
      }
      return converged;
      
    case 'diverge':
      const diverged: number[] = [];
      const mid = Math.floor(sequence.length / 2);
      for (let i = 0; i <= mid; i++) {
        if (mid - i >= 0) diverged.push(sequence[mid - i]!);
        if (mid + i < sequence.length && i > 0) diverged.push(sequence[mid + i]!);
      }
      return diverged;
      
    case 'thumb':
      const thumbSeq: number[] = [];
      for (let i = 0; i < sequence.length; i++) {
        thumbSeq.push(sequence[0]!);
        if (i > 0) thumbSeq.push(sequence[i]!);
      }
      return thumbSeq;
      
    default:
      return sequence;
  }
}

/**
 * Add note to arpeggiator.
 */
export function arpNoteOn(
  state: ArpeggiatorState,
  note: number
): ArpeggiatorState {
  if (state.heldNotes.includes(note)) return state;
  const heldNotes = [...state.heldNotes, note];
  return {
    ...state,
    heldNotes,
    sequence: generateArpSequence({ ...state, heldNotes }),
  };
}

/**
 * Remove note from arpeggiator.
 */
export function arpNoteOff(
  state: ArpeggiatorState,
  note: number
): ArpeggiatorState {
  const heldNotes = state.heldNotes.filter(n => n !== note);
  return {
    ...state,
    heldNotes,
    sequence: generateArpSequence({ ...state, heldNotes }),
  };
}

// ============================================================================
// STEP SEQUENCER
// ============================================================================

/**
 * Sequencer step.
 */
export interface SequencerStep {
  readonly note: number;
  readonly velocity: number;
  readonly gate: number;      // 0-1
  readonly slide: boolean;
  readonly accent: boolean;
  readonly active: boolean;
}

/**
 * Default sequencer step.
 */
export const DEFAULT_SEQUENCER_STEP: SequencerStep = {
  note: 60,
  velocity: 100,
  gate: 0.5,
  slide: false,
  accent: false,
  active: true,
};

/**
 * Step sequencer state.
 */
export interface SequencerState {
  /** Steps */
  readonly steps: readonly SequencerStep[];
  /** Pattern length (1-32) */
  readonly patternLength: number;
  /** Current step */
  readonly currentStep: number;
  /** Playing */
  readonly playing: boolean;
  /** Rate (note value) */
  readonly rate: number;
  /** Swing (0-1) */
  readonly swing: number;
  /** Direction */
  readonly direction: 'forward' | 'backward' | 'ping-pong' | 'random';
  /** Transpose (semitones) */
  readonly transpose: number;
  /** Octave shift */
  readonly octaveShift: number;
}

/**
 * Create initial sequencer state.
 */
export function createSequencerState(steps: number = 8): SequencerState {
  return {
    steps: Array.from({ length: 32 }, () => ({ ...DEFAULT_SEQUENCER_STEP })),
    patternLength: steps,
    currentStep: 0,
    playing: false,
    rate: 0.25,
    swing: 0,
    direction: 'forward',
    transpose: 0,
    octaveShift: 0,
  };
}

/**
 * Set step note.
 */
export function setSequencerStepNote(
  state: SequencerState,
  stepIndex: number,
  note: number
): SequencerState {
  const steps = state.steps.map((step, i) =>
    i === stepIndex ? { ...step, note } : step
  );
  return { ...state, steps };
}

/**
 * Toggle step active.
 */
export function toggleSequencerStep(
  state: SequencerState,
  stepIndex: number
): SequencerState {
  const steps = state.steps.map((step, i) =>
    i === stepIndex ? { ...step, active: !step.active } : step
  );
  return { ...state, steps };
}

/**
 * Get next step based on direction.
 */
export function getNextSequencerStep(
  state: SequencerState,
  direction: 1 | -1 = 1
): number {
  switch (state.direction) {
    case 'forward':
      return (state.currentStep + 1) % state.patternLength;
    case 'backward':
      return (state.currentStep - 1 + state.patternLength) % state.patternLength;
    case 'ping-pong':
      const next = state.currentStep + direction;
      if (next >= state.patternLength || next < 0) {
        return state.currentStep - direction;
      }
      return next;
    case 'random':
      return Math.floor(Math.random() * state.patternLength);
  }
}

// ============================================================================
// LOOP PLAYER
// ============================================================================

/**
 * Loop slice.
 */
export interface LoopSlice {
  readonly id: string;
  readonly startSample: number;
  readonly endSample: number;
  readonly pitch: number;     // Semitone offset
  readonly gain: number;      // 0-1
  readonly reverse: boolean;
}

/**
 * Loop player state.
 */
export interface LoopPlayerState {
  /** Audio buffer ID */
  readonly bufferId: string | null;
  /** Playback rate */
  readonly playbackRate: number;
  /** Loop start (0-1) */
  readonly loopStart: number;
  /** Loop end (0-1) */
  readonly loopEnd: number;
  /** Pitch (semitones) */
  readonly pitch: number;
  /** Time stretch (independent of pitch) */
  readonly timeStretch: number;
  /** Reverse playback */
  readonly reverse: boolean;
  /** Slices */
  readonly slices: readonly LoopSlice[];
  /** Current slice index */
  readonly currentSlice: number;
  /** Slice mode */
  readonly sliceMode: 'sequence' | 'random' | 'manual';
  /** Playing */
  readonly playing: boolean;
  /** Sync to tempo */
  readonly syncToTempo: boolean;
  /** Original BPM */
  readonly originalBpm: number;
}

/**
 * Default loop player state.
 */
export const DEFAULT_LOOP_PLAYER_STATE: LoopPlayerState = {
  bufferId: null,
  playbackRate: 1,
  loopStart: 0,
  loopEnd: 1,
  pitch: 0,
  timeStretch: 1,
  reverse: false,
  slices: [],
  currentSlice: 0,
  sliceMode: 'sequence',
  playing: false,
  syncToTempo: true,
  originalBpm: 120,
};

/**
 * Calculate playback rate for tempo sync.
 */
export function calculateSyncedPlaybackRate(
  originalBpm: number,
  targetBpm: number,
  pitchSemitones: number = 0
): number {
  const tempoRatio = targetBpm / originalBpm;
  const pitchRatio = Math.pow(2, pitchSemitones / 12);
  return tempoRatio * pitchRatio;
}

/**
 * Auto-slice loop into equal parts.
 */
export function autoSliceLoop(
  totalSamples: number,
  sliceCount: number
): readonly LoopSlice[] {
  const sliceLength = Math.floor(totalSamples / sliceCount);
  return Array.from({ length: sliceCount }, (_, i) => ({
    id: `slice-${i}`,
    startSample: i * sliceLength,
    endSample: (i + 1) * sliceLength,
    pitch: 0,
    gain: 1,
    reverse: false,
  }));
}

// ============================================================================
// SAMPLER (Multi-Zone)
// ============================================================================

/**
 * Sampler zone.
 */
export interface SamplerZone {
  readonly id: string;
  readonly sampleId: string;
  readonly lowKey: number;
  readonly highKey: number;
  readonly rootKey: number;
  readonly lowVelocity: number;
  readonly highVelocity: number;
  readonly volume: number;
  readonly pan: number;
  readonly tuning: number;      // Cents
  readonly loopStart?: number;
  readonly loopEnd?: number;
  readonly loopEnabled: boolean;
}

/**
 * Sampler state.
 */
export interface SamplerState {
  /** Zones */
  readonly zones: readonly SamplerZone[];
  /** Master volume */
  readonly volume: number;
  /** Master pan */
  readonly pan: number;
  /** Attack time (s) */
  readonly attack: number;
  /** Decay time (s) */
  readonly decay: number;
  /** Sustain level (0-1) */
  readonly sustain: number;
  /** Release time (s) */
  readonly release: number;
  /** Filter cutoff (0-1) */
  readonly filterCutoff: number;
  /** Filter resonance (0-1) */
  readonly filterResonance: number;
  /** Polyphony limit */
  readonly polyphony: number;
  /** Legato mode */
  readonly legato: boolean;
  /** Portamento time (s) */
  readonly portamento: number;
}

/**
 * Default sampler state.
 */
export const DEFAULT_SAMPLER_STATE: SamplerState = {
  zones: [],
  volume: 1,
  pan: 0,
  attack: 0.001,
  decay: 0.1,
  sustain: 1,
  release: 0.1,
  filterCutoff: 1,
  filterResonance: 0,
  polyphony: 32,
  legato: false,
  portamento: 0,
};

/**
 * Find zones for a note and velocity.
 */
export function findSamplerZones(
  state: SamplerState,
  note: number,
  velocity: number
): readonly SamplerZone[] {
  return state.zones.filter(zone =>
    note >= zone.lowKey &&
    note <= zone.highKey &&
    velocity >= zone.lowVelocity &&
    velocity <= zone.highVelocity
  );
}

/**
 * Add zone to sampler.
 */
export function addSamplerZone(
  state: SamplerState,
  zone: SamplerZone
): SamplerState {
  return { ...state, zones: [...state.zones, zone] };
}

// ============================================================================
// SYNTH CARDS (Pad, Lead, Bass)
// ============================================================================

/**
 * Synth preset type.
 */
export type SynthPresetType = 'pad' | 'lead' | 'bass' | 'keys' | 'fx';

/**
 * Common synth parameters.
 */
export interface SynthParams {
  /** Oscillator waveforms */
  readonly oscillators: readonly {
    readonly waveform: string;
    readonly detune: number;
    readonly volume: number;
    readonly octave: number;
  }[];
  /** Filter settings */
  readonly filter: {
    readonly type: 'lowpass' | 'highpass' | 'bandpass';
    readonly cutoff: number;
    readonly resonance: number;
    readonly envAmount: number;
  };
  /** Amp envelope */
  readonly ampEnv: {
    readonly attack: number;
    readonly decay: number;
    readonly sustain: number;
    readonly release: number;
  };
  /** Filter envelope */
  readonly filterEnv: {
    readonly attack: number;
    readonly decay: number;
    readonly sustain: number;
    readonly release: number;
  };
  /** LFO settings */
  readonly lfo: {
    readonly rate: number;
    readonly waveform: string;
    readonly pitchAmount: number;
    readonly filterAmount: number;
    readonly ampAmount: number;
  };
  /** Effects */
  readonly effects: {
    readonly reverbMix: number;
    readonly delayMix: number;
    readonly chorusMix: number;
  };
  /** Polyphony */
  readonly polyphony: number;
  /** Glide time */
  readonly glide: number;
}

/**
 * Default pad synth params.
 */
export const PAD_SYNTH_DEFAULTS: SynthParams = {
  oscillators: [
    { waveform: 'sawtooth', detune: -7, volume: 0.5, octave: 0 },
    { waveform: 'sawtooth', detune: 7, volume: 0.5, octave: 0 },
  ],
  filter: {
    type: 'lowpass',
    cutoff: 0.4,
    resonance: 0.2,
    envAmount: 0.3,
  },
  ampEnv: {
    attack: 0.5,
    decay: 0.5,
    sustain: 0.8,
    release: 1.5,
  },
  filterEnv: {
    attack: 0.8,
    decay: 1.0,
    sustain: 0.3,
    release: 1.0,
  },
  lfo: {
    rate: 0.5,
    waveform: 'sine',
    pitchAmount: 0.02,
    filterAmount: 0.1,
    ampAmount: 0,
  },
  effects: {
    reverbMix: 0.4,
    delayMix: 0.2,
    chorusMix: 0.3,
  },
  polyphony: 16,
  glide: 0,
};

/**
 * Default lead synth params.
 */
export const LEAD_SYNTH_DEFAULTS: SynthParams = {
  oscillators: [
    { waveform: 'sawtooth', detune: 0, volume: 0.6, octave: 0 },
    { waveform: 'square', detune: 5, volume: 0.4, octave: 0 },
  ],
  filter: {
    type: 'lowpass',
    cutoff: 0.7,
    resonance: 0.4,
    envAmount: 0.5,
  },
  ampEnv: {
    attack: 0.01,
    decay: 0.2,
    sustain: 0.7,
    release: 0.3,
  },
  filterEnv: {
    attack: 0.01,
    decay: 0.3,
    sustain: 0.2,
    release: 0.2,
  },
  lfo: {
    rate: 5,
    waveform: 'sine',
    pitchAmount: 0.1,
    filterAmount: 0,
    ampAmount: 0,
  },
  effects: {
    reverbMix: 0.2,
    delayMix: 0.3,
    chorusMix: 0,
  },
  polyphony: 1,
  glide: 0.05,
};

/**
 * Default bass synth params.
 */
export const BASS_SYNTH_DEFAULTS: SynthParams = {
  oscillators: [
    { waveform: 'sawtooth', detune: 0, volume: 0.7, octave: -1 },
    { waveform: 'square', detune: 0, volume: 0.3, octave: -2 },
  ],
  filter: {
    type: 'lowpass',
    cutoff: 0.5,
    resonance: 0.3,
    envAmount: 0.6,
  },
  ampEnv: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.8,
    release: 0.2,
  },
  filterEnv: {
    attack: 0.01,
    decay: 0.2,
    sustain: 0.1,
    release: 0.1,
  },
  lfo: {
    rate: 0,
    waveform: 'sine',
    pitchAmount: 0,
    filterAmount: 0,
    ampAmount: 0,
  },
  effects: {
    reverbMix: 0,
    delayMix: 0,
    chorusMix: 0,
  },
  polyphony: 4,
  glide: 0,
};

// ============================================================================
// ORCHESTRAL ARRANGING
// ============================================================================

/**
 * Orchestral section.
 */
export type OrchestraSection = 'strings' | 'brass' | 'woodwinds' | 'choir';

/**
 * Voice distribution for orchestral arranging.
 */
export interface VoiceDistribution {
  /** Instrument name */
  readonly instrument: string;
  /** MIDI channel */
  readonly channel: number;
  /** Octave offset */
  readonly octaveOffset: number;
  /** Voice index in chord (0 = bass, 1 = tenor, etc.) */
  readonly voiceIndex: number;
  /** Double another voice */
  readonly doubles: number | null;
  /** Velocity scaling */
  readonly velocityScale: number;
}

/**
 * Orchestral arrangement preset.
 */
export interface OrchestralArrangement {
  readonly name: string;
  readonly section: OrchestraSection;
  readonly voices: readonly VoiceDistribution[];
}

/**
 * String section arrangements.
 */
export const STRING_ARRANGEMENTS: readonly OrchestralArrangement[] = [
  {
    name: 'String Quartet',
    section: 'strings',
    voices: [
      { instrument: 'Violin 1', channel: 1, octaveOffset: 1, voiceIndex: 3, doubles: null, velocityScale: 1 },
      { instrument: 'Violin 2', channel: 2, octaveOffset: 1, voiceIndex: 2, doubles: null, velocityScale: 0.9 },
      { instrument: 'Viola', channel: 3, octaveOffset: 0, voiceIndex: 1, doubles: null, velocityScale: 0.85 },
      { instrument: 'Cello', channel: 4, octaveOffset: -1, voiceIndex: 0, doubles: null, velocityScale: 0.9 },
    ],
  },
  {
    name: 'Full Strings',
    section: 'strings',
    voices: [
      { instrument: 'Violin 1', channel: 1, octaveOffset: 1, voiceIndex: 3, doubles: null, velocityScale: 1 },
      { instrument: 'Violin 2', channel: 2, octaveOffset: 1, voiceIndex: 2, doubles: null, velocityScale: 0.9 },
      { instrument: 'Viola', channel: 3, octaveOffset: 0, voiceIndex: 1, doubles: null, velocityScale: 0.85 },
      { instrument: 'Cello', channel: 4, octaveOffset: -1, voiceIndex: 0, doubles: null, velocityScale: 0.9 },
      { instrument: 'Bass', channel: 5, octaveOffset: -2, voiceIndex: 0, doubles: 0, velocityScale: 0.8 },
    ],
  },
];

/**
 * Brass section arrangements.
 */
export const BRASS_ARRANGEMENTS: readonly OrchestralArrangement[] = [
  {
    name: 'Horn Section',
    section: 'brass',
    voices: [
      { instrument: 'Trumpet 1', channel: 1, octaveOffset: 1, voiceIndex: 3, doubles: null, velocityScale: 1 },
      { instrument: 'Trumpet 2', channel: 2, octaveOffset: 0, voiceIndex: 2, doubles: null, velocityScale: 0.95 },
      { instrument: 'Trombone', channel: 3, octaveOffset: 0, voiceIndex: 1, doubles: null, velocityScale: 0.9 },
      { instrument: 'Bass Trombone', channel: 4, octaveOffset: -1, voiceIndex: 0, doubles: null, velocityScale: 0.9 },
    ],
  },
];

/**
 * Distribute chord notes to orchestral voices.
 */
export function arrangeForOrchestra(
  chordNotes: readonly number[],
  arrangement: OrchestralArrangement,
  baseVelocity: number = 100
): readonly { note: number; channel: number; velocity: number; instrument: string }[] {
  const result: { note: number; channel: number; velocity: number; instrument: string }[] = [];
  const sortedNotes = [...chordNotes].sort((a, b) => a - b);
  
  for (const voice of arrangement.voices) {
    let note: number;
    
    if (voice.doubles !== null) {
      // Double another voice
      const doubled = sortedNotes[voice.doubles];
      note = doubled !== undefined ? doubled + voice.octaveOffset * 12 : sortedNotes[0]!;
    } else if (voice.voiceIndex < sortedNotes.length) {
      note = sortedNotes[voice.voiceIndex]! + voice.octaveOffset * 12;
    } else {
      // Not enough notes, double the top
      note = sortedNotes[sortedNotes.length - 1]! + voice.octaveOffset * 12;
    }
    
    result.push({
      note,
      channel: voice.channel,
      velocity: Math.round(baseVelocity * voice.velocityScale),
      instrument: voice.instrument,
    });
  }
  
  return result;
}

// ============================================================================
// BRASS CARD (5.0.5.6)
// ============================================================================

/**
 * Brass dynamics mode.
 */
export type BrassDynamics = 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff' | 'sfz' | 'fp';

/**
 * Brass articulation.
 */
export type BrassArticulation = 
  | 'sustain' 
  | 'staccato' 
  | 'marcato' 
  | 'accent' 
  | 'sforzando'
  | 'tenuto'
  | 'legato'
  | 'falls'
  | 'doits'
  | 'shake'
  | 'growl'
  | 'flutter'
  | 'muted';

/**
 * Brass section type.
 */
export type BrassSection = 
  | 'trumpet'
  | 'french-horn'
  | 'trombone'
  | 'bass-trombone'
  | 'tuba'
  | 'flugelhorn'
  | 'cornet'
  | 'euphonium';

/**
 * Brass voice state.
 */
export interface BrassVoice {
  /** Voice ID */
  readonly id: string;
  /** Section type */
  readonly section: BrassSection;
  /** Enabled */
  enabled: boolean;
  /** Volume (0-1) */
  volume: number;
  /** Pan (-1 to 1) */
  pan: number;
  /** Octave offset */
  octaveOffset: number;
  /** Voice index in voicing (0=bass, higher=higher) */
  voiceIndex: number;
  /** Velocity scaling */
  velocityScale: number;
}

/**
 * Brass card state.
 */
export interface BrassCardState {
  /** Brass voices */
  readonly voices: readonly BrassVoice[];
  /** Current articulation */
  articulation: BrassArticulation;
  /** Current dynamics */
  dynamics: BrassDynamics;
  /** Legato mode */
  legato: boolean;
  /** Attack time (0-1) */
  attack: number;
  /** Release time (0-1) */
  release: number;
  /** Vibrato depth (0-1) */
  vibratoDepth: number;
  /** Vibrato rate (Hz) */
  vibratoRate: number;
  /** Room reverb amount (0-1) */
  roomReverb: number;
  /** Master volume */
  volume: number;
  /** Expression (0-1) */
  expression: number;
  /** Section mode: 'ensemble' or 'solo' */
  mode: 'ensemble' | 'solo';
  /** Selected solo voice */
  soloVoice: BrassSection;
}

/**
 * Create default brass card state.
 */
export function createBrassCardState(): BrassCardState {
  return {
    voices: [
      { id: 'trumpet1', section: 'trumpet', enabled: true, volume: 1, pan: -0.3, octaveOffset: 1, voiceIndex: 3, velocityScale: 1 },
      { id: 'trumpet2', section: 'trumpet', enabled: true, volume: 0.9, pan: 0.3, octaveOffset: 0, voiceIndex: 2, velocityScale: 0.95 },
      { id: 'horn', section: 'french-horn', enabled: true, volume: 0.8, pan: 0.5, octaveOffset: 0, voiceIndex: 1, velocityScale: 0.85 },
      { id: 'trombone', section: 'trombone', enabled: true, volume: 0.9, pan: -0.5, octaveOffset: 0, voiceIndex: 1, velocityScale: 0.9 },
      { id: 'basstrombone', section: 'bass-trombone', enabled: true, volume: 0.85, pan: 0, octaveOffset: -1, voiceIndex: 0, velocityScale: 0.9 },
      { id: 'tuba', section: 'tuba', enabled: false, volume: 0.8, pan: 0, octaveOffset: -2, voiceIndex: 0, velocityScale: 0.85 },
    ],
    articulation: 'sustain',
    dynamics: 'mf',
    legato: true,
    attack: 0.1,
    release: 0.3,
    vibratoDepth: 0.2,
    vibratoRate: 5,
    roomReverb: 0.3,
    volume: 1,
    expression: 1,
    mode: 'ensemble',
    soloVoice: 'trumpet',
  };
}

/**
 * Brass card presets.
 */
export const BRASS_CARD_PRESETS = [
  { name: 'Big Band Brass', articulation: 'marcato', dynamics: 'f', mode: 'ensemble', vibratoDepth: 0.3, roomReverb: 0.25 },
  { name: 'Soft Horn Section', articulation: 'sustain', dynamics: 'mp', mode: 'ensemble', vibratoDepth: 0.15, roomReverb: 0.4 },
  { name: 'Fanfare', articulation: 'accent', dynamics: 'ff', mode: 'ensemble', vibratoDepth: 0.1, roomReverb: 0.5 },
  { name: 'Muted Jazz', articulation: 'muted', dynamics: 'mf', mode: 'ensemble', vibratoDepth: 0.2, roomReverb: 0.2 },
  { name: 'Orchestral Brass', articulation: 'legato', dynamics: 'mf', mode: 'ensemble', vibratoDepth: 0.25, roomReverb: 0.45 },
  { name: 'Punchy Stabs', articulation: 'staccato', dynamics: 'f', mode: 'ensemble', vibratoDepth: 0, roomReverb: 0.15 },
  { name: 'Solo Trumpet', articulation: 'sustain', dynamics: 'mf', mode: 'solo', soloVoice: 'trumpet', vibratoDepth: 0.3 },
  { name: 'Solo French Horn', articulation: 'legato', dynamics: 'mp', mode: 'solo', soloVoice: 'french-horn', vibratoDepth: 0.25 },
  { name: 'Solo Trombone', articulation: 'sustain', dynamics: 'mf', mode: 'solo', soloVoice: 'trombone', vibratoDepth: 0.2 },
  { name: 'Tuba Bass', articulation: 'tenuto', dynamics: 'mf', mode: 'solo', soloVoice: 'tuba', vibratoDepth: 0.1 },
  { name: 'Sforzando Hit', articulation: 'sforzando', dynamics: 'sfz', mode: 'ensemble', vibratoDepth: 0, roomReverb: 0.3 },
  { name: 'Film Score Brass', articulation: 'legato', dynamics: 'f', mode: 'ensemble', vibratoDepth: 0.2, roomReverb: 0.55 },
  { name: 'Latin Brass', articulation: 'accent', dynamics: 'f', mode: 'ensemble', vibratoDepth: 0.15, roomReverb: 0.2 },
  { name: 'Funk Horns', articulation: 'staccato', dynamics: 'mf', mode: 'ensemble', vibratoDepth: 0.1, roomReverb: 0.15 },
  { name: 'Ballad Brass', articulation: 'sustain', dynamics: 'p', mode: 'ensemble', vibratoDepth: 0.35, roomReverb: 0.5 },
  { name: 'Power Brass', articulation: 'marcato', dynamics: 'ff', mode: 'ensemble', vibratoDepth: 0.15, roomReverb: 0.35 },
  { name: 'Doits and Falls', articulation: 'doits', dynamics: 'mf', mode: 'ensemble', vibratoDepth: 0.1, roomReverb: 0.2 },
  { name: 'Shake Effect', articulation: 'shake', dynamics: 'f', mode: 'ensemble', vibratoDepth: 0.4, roomReverb: 0.25 },
  { name: 'Growl Brass', articulation: 'growl', dynamics: 'f', mode: 'solo', soloVoice: 'trumpet', vibratoDepth: 0.3 },
  { name: 'Flutter Tongue', articulation: 'flutter', dynamics: 'mf', mode: 'ensemble', vibratoDepth: 0.1, roomReverb: 0.3 },
] as const;

/**
 * Map dynamics to velocity.
 */
export function dynamicsToVelocity(dynamics: BrassDynamics): number {
  switch (dynamics) {
    case 'pp': return 30;
    case 'p': return 50;
    case 'mp': return 70;
    case 'mf': return 85;
    case 'f': return 100;
    case 'ff': return 120;
    case 'sfz': return 127;
    case 'fp': return 100; // Start forte, handled specially
  }
}

// ============================================================================
// WOODWINDS CARD (5.0.5.6)
// ============================================================================

/**
 * Woodwind section type.
 */
export type WoodwindSection = 
  | 'flute'
  | 'piccolo'
  | 'oboe'
  | 'english-horn'
  | 'clarinet'
  | 'bass-clarinet'
  | 'bassoon'
  | 'contrabassoon'
  | 'saxophone-soprano'
  | 'saxophone-alto'
  | 'saxophone-tenor'
  | 'saxophone-baritone'
  | 'recorder';

/**
 * Woodwind articulation.
 */
export type WoodwindArticulation = 
  | 'sustain'
  | 'staccato'
  | 'legato'
  | 'tenuto'
  | 'accent'
  | 'tongued'
  | 'slur'
  | 'trill'
  | 'flutter'
  | 'multiphonic'
  | 'harmonics'
  | 'breath-noise';

/**
 * Woodwind voice state.
 */
export interface WoodwindVoice {
  /** Voice ID */
  readonly id: string;
  /** Section type */
  readonly section: WoodwindSection;
  /** Enabled */
  enabled: boolean;
  /** Volume (0-1) */
  volume: number;
  /** Pan (-1 to 1) */
  pan: number;
  /** Octave offset */
  octaveOffset: number;
  /** Voice index in voicing */
  voiceIndex: number;
  /** Velocity scaling */
  velocityScale: number;
  /** Breath amount (0-1) */
  breath: number;
}

/**
 * Woodwinds card state.
 */
export interface WoodwindsCardState {
  /** Woodwind voices */
  readonly voices: readonly WoodwindVoice[];
  /** Current articulation */
  articulation: WoodwindArticulation;
  /** Current dynamics */
  dynamics: BrassDynamics;
  /** Legato mode */
  legato: boolean;
  /** Attack time (0-1) */
  attack: number;
  /** Release time (0-1) */
  release: number;
  /** Vibrato depth (0-1) */
  vibratoDepth: number;
  /** Vibrato rate (Hz) */
  vibratoRate: number;
  /** Breath noise amount (0-1) */
  breathNoise: number;
  /** Room reverb amount (0-1) */
  roomReverb: number;
  /** Master volume */
  volume: number;
  /** Expression (0-1) */
  expression: number;
  /** Section mode */
  mode: 'ensemble' | 'solo';
  /** Selected solo voice */
  soloVoice: WoodwindSection;
}

/**
 * Create default woodwinds card state.
 */
export function createWoodwindsCardState(): WoodwindsCardState {
  return {
    voices: [
      { id: 'flute1', section: 'flute', enabled: true, volume: 1, pan: -0.4, octaveOffset: 1, voiceIndex: 3, velocityScale: 1, breath: 0.2 },
      { id: 'flute2', section: 'flute', enabled: false, volume: 0.9, pan: -0.2, octaveOffset: 1, voiceIndex: 2, velocityScale: 0.95, breath: 0.2 },
      { id: 'oboe', section: 'oboe', enabled: true, volume: 0.85, pan: 0.3, octaveOffset: 0, voiceIndex: 2, velocityScale: 0.9, breath: 0.15 },
      { id: 'clarinet', section: 'clarinet', enabled: true, volume: 0.9, pan: -0.3, octaveOffset: 0, voiceIndex: 1, velocityScale: 0.9, breath: 0.1 },
      { id: 'bassoon', section: 'bassoon', enabled: true, volume: 0.85, pan: 0.4, octaveOffset: -1, voiceIndex: 0, velocityScale: 0.85, breath: 0.15 },
    ],
    articulation: 'sustain',
    dynamics: 'mf',
    legato: true,
    attack: 0.08,
    release: 0.25,
    vibratoDepth: 0.15,
    vibratoRate: 5.5,
    breathNoise: 0.1,
    roomReverb: 0.35,
    volume: 1,
    expression: 1,
    mode: 'ensemble',
    soloVoice: 'flute',
  };
}

/**
 * Woodwinds card presets.
 */
export const WOODWINDS_CARD_PRESETS = [
  { name: 'Orchestral Woodwinds', articulation: 'legato', dynamics: 'mf', mode: 'ensemble', vibratoDepth: 0.2, roomReverb: 0.4 },
  { name: 'Flute Solo', articulation: 'sustain', dynamics: 'mp', mode: 'solo', soloVoice: 'flute', vibratoDepth: 0.25, breathNoise: 0.15 },
  { name: 'Oboe Solo', articulation: 'legato', dynamics: 'mf', mode: 'solo', soloVoice: 'oboe', vibratoDepth: 0.2, breathNoise: 0.1 },
  { name: 'Clarinet Solo', articulation: 'sustain', dynamics: 'mp', mode: 'solo', soloVoice: 'clarinet', vibratoDepth: 0.15, breathNoise: 0.08 },
  { name: 'Bassoon Solo', articulation: 'legato', dynamics: 'mf', mode: 'solo', soloVoice: 'bassoon', vibratoDepth: 0.15, breathNoise: 0.12 },
  { name: 'Sax Section', articulation: 'sustain', dynamics: 'mf', mode: 'ensemble', vibratoDepth: 0.3, breathNoise: 0.1 },
  { name: 'Alto Sax Solo', articulation: 'sustain', dynamics: 'mf', mode: 'solo', soloVoice: 'saxophone-alto', vibratoDepth: 0.35, breathNoise: 0.15 },
  { name: 'Tenor Sax Solo', articulation: 'sustain', dynamics: 'mf', mode: 'solo', soloVoice: 'saxophone-tenor', vibratoDepth: 0.35, breathNoise: 0.15 },
  { name: 'Piccolo', articulation: 'staccato', dynamics: 'f', mode: 'solo', soloVoice: 'piccolo', vibratoDepth: 0.1, breathNoise: 0.2 },
  { name: 'English Horn', articulation: 'legato', dynamics: 'mp', mode: 'solo', soloVoice: 'english-horn', vibratoDepth: 0.2, breathNoise: 0.1 },
  { name: 'Bass Clarinet', articulation: 'sustain', dynamics: 'mf', mode: 'solo', soloVoice: 'bass-clarinet', vibratoDepth: 0.1, breathNoise: 0.08 },
  { name: 'Recorder Consort', articulation: 'legato', dynamics: 'mp', mode: 'ensemble', vibratoDepth: 0.1, breathNoise: 0.25 },
  { name: 'Chamber Winds', articulation: 'legato', dynamics: 'p', mode: 'ensemble', vibratoDepth: 0.2, roomReverb: 0.5 },
  { name: 'Wind Staccato', articulation: 'staccato', dynamics: 'f', mode: 'ensemble', vibratoDepth: 0.05, roomReverb: 0.2 },
  { name: 'Trill Winds', articulation: 'trill', dynamics: 'mf', mode: 'ensemble', vibratoDepth: 0.1, roomReverb: 0.3 },
  { name: 'Flutter Tonguing', articulation: 'flutter', dynamics: 'f', mode: 'ensemble', vibratoDepth: 0.1, roomReverb: 0.25 },
  { name: 'Film Score Winds', articulation: 'legato', dynamics: 'mp', mode: 'ensemble', vibratoDepth: 0.2, roomReverb: 0.55 },
  { name: 'Jazz Winds', articulation: 'tongued', dynamics: 'mf', mode: 'ensemble', vibratoDepth: 0.25, breathNoise: 0.15 },
  { name: 'Baroque Winds', articulation: 'legato', dynamics: 'mp', mode: 'ensemble', vibratoDepth: 0.08, roomReverb: 0.45 },
  { name: 'Celtic Winds', articulation: 'slur', dynamics: 'mf', mode: 'ensemble', vibratoDepth: 0.2, breathNoise: 0.2 },
] as const;

// ============================================================================
// GUITAR CARD (5.0.5.6)
// ============================================================================

/**
 * Guitar type.
 */
export type GuitarType = 
  | 'acoustic-steel'
  | 'acoustic-nylon'
  | 'electric-clean'
  | 'electric-crunch'
  | 'electric-lead'
  | 'electric-jazz'
  | 'electric-twelve'
  | 'bass-electric'
  | 'bass-acoustic'
  | 'ukulele'
  | 'banjo'
  | 'mandolin';

/**
 * Guitar playing technique.
 */
export type GuitarTechnique = 
  | 'strum-down'
  | 'strum-up'
  | 'fingerpick'
  | 'pick-single'
  | 'palm-mute'
  | 'hammer-on'
  | 'pull-off'
  | 'slide'
  | 'bend'
  | 'vibrato'
  | 'harmonics'
  | 'slap'
  | 'pop'
  | 'tremolo'
  | 'rasgueado';

/**
 * Strum pattern step.
 */
export interface StrumPatternStep {
  /** Beat position (0-based) */
  readonly beat: number;
  /** Subdivision (0-3 for 16th notes) */
  readonly subdivision: number;
  /** Technique */
  readonly technique: GuitarTechnique;
  /** Velocity (0-1) */
  readonly velocity: number;
  /** Strings to play (6 booleans, low to high) */
  readonly strings: readonly boolean[];
  /** Accent */
  readonly accent: boolean;
}

/**
 * Strum pattern.
 */
export interface StrumPattern {
  /** Pattern ID */
  readonly id: string;
  /** Pattern name */
  readonly name: string;
  /** Time signature numerator */
  readonly timeSignature: number;
  /** Steps */
  readonly steps: readonly StrumPatternStep[];
  /** Swing amount (0-1) */
  readonly swing: number;
}

/**
 * Fingerpicking pattern.
 */
export interface FingerpickPattern {
  /** Pattern ID */
  readonly id: string;
  /** Pattern name */
  readonly name: string;
  /** String sequence (0=low E, 5=high E) */
  readonly sequence: readonly number[];
  /** Velocities per step */
  readonly velocities: readonly number[];
  /** Duration in beats */
  readonly durationBeats: number;
}

/**
 * Guitar card state.
 */
export interface GuitarCardState {
  /** Guitar type */
  guitarType: GuitarType;
  /** Current technique */
  technique: GuitarTechnique;
  /** Current strum pattern */
  strumPattern: StrumPattern | null;
  /** Current fingerpick pattern */
  fingerpickPattern: FingerpickPattern | null;
  /** Capo position (0-12) */
  capo: number;
  /** Tuning offset per string (semitones) */
  tuning: readonly number[];
  /** Pick position (0=bridge, 1=neck) */
  pickPosition: number;
  /** Tone (0=mellow, 1=bright) */
  tone: number;
  /** Palm mute amount (0-1) */
  palmMute: number;
  /** Body resonance (0-1) */
  bodyResonance: number;
  /** String noise amount (0-1) */
  stringNoise: number;
  /** Fret noise amount (0-1) */
  fretNoise: number;
  /** Room/amp reverb (0-1) */
  reverb: number;
  /** Chorus amount for 12-string (0-1) */
  chorus: number;
  /** Master volume */
  volume: number;
  /** Strum speed (0=instant, 1=slow arpeggiate) */
  strumSpeed: number;
  /** Auto-strum (play chords as strums) */
  autoStrum: boolean;
  /** Playing mode */
  mode: 'chord' | 'strum' | 'fingerpick' | 'lead';
}

/**
 * Create default guitar card state.
 */
export function createGuitarCardState(): GuitarCardState {
  return {
    guitarType: 'acoustic-steel',
    technique: 'strum-down',
    strumPattern: null,
    fingerpickPattern: null,
    capo: 0,
    tuning: [0, 0, 0, 0, 0, 0], // Standard tuning
    pickPosition: 0.5,
    tone: 0.5,
    palmMute: 0,
    bodyResonance: 0.5,
    stringNoise: 0.2,
    fretNoise: 0.15,
    reverb: 0.2,
    chorus: 0,
    volume: 1,
    strumSpeed: 0.1,
    autoStrum: true,
    mode: 'chord',
  };
}

/**
 * Built-in strum patterns.
 */
export const STRUM_PATTERNS: readonly StrumPattern[] = [
  {
    id: 'basic-4',
    name: 'Basic 4/4',
    timeSignature: 4,
    swing: 0,
    steps: [
      { beat: 0, subdivision: 0, technique: 'strum-down', velocity: 1, strings: [true, true, true, true, true, true], accent: true },
      { beat: 1, subdivision: 0, technique: 'strum-down', velocity: 0.7, strings: [true, true, true, true, true, true], accent: false },
      { beat: 2, subdivision: 0, technique: 'strum-down', velocity: 0.9, strings: [true, true, true, true, true, true], accent: true },
      { beat: 3, subdivision: 0, technique: 'strum-down', velocity: 0.7, strings: [true, true, true, true, true, true], accent: false },
    ],
  },
  {
    id: 'folk-pattern',
    name: 'Folk Pattern',
    timeSignature: 4,
    swing: 0,
    steps: [
      { beat: 0, subdivision: 0, technique: 'strum-down', velocity: 1, strings: [true, true, true, true, true, true], accent: true },
      { beat: 0, subdivision: 2, technique: 'strum-up', velocity: 0.5, strings: [false, false, true, true, true, true], accent: false },
      { beat: 1, subdivision: 0, technique: 'strum-down', velocity: 0.7, strings: [true, true, true, true, true, true], accent: false },
      { beat: 1, subdivision: 2, technique: 'strum-up', velocity: 0.5, strings: [false, false, true, true, true, true], accent: false },
      { beat: 2, subdivision: 0, technique: 'strum-down', velocity: 0.9, strings: [true, true, true, true, true, true], accent: true },
      { beat: 2, subdivision: 2, technique: 'strum-up', velocity: 0.5, strings: [false, false, true, true, true, true], accent: false },
      { beat: 3, subdivision: 0, technique: 'strum-down', velocity: 0.7, strings: [true, true, true, true, true, true], accent: false },
      { beat: 3, subdivision: 2, technique: 'strum-up', velocity: 0.5, strings: [false, false, true, true, true, true], accent: false },
    ],
  },
  {
    id: 'reggae-skank',
    name: 'Reggae Skank',
    timeSignature: 4,
    swing: 0.2,
    steps: [
      { beat: 0, subdivision: 2, technique: 'strum-down', velocity: 0.8, strings: [false, false, true, true, true, true], accent: false },
      { beat: 1, subdivision: 2, technique: 'strum-down', velocity: 0.8, strings: [false, false, true, true, true, true], accent: false },
      { beat: 2, subdivision: 2, technique: 'strum-down', velocity: 0.8, strings: [false, false, true, true, true, true], accent: false },
      { beat: 3, subdivision: 2, technique: 'strum-down', velocity: 0.8, strings: [false, false, true, true, true, true], accent: false },
    ],
  },
  {
    id: 'boom-chuck',
    name: 'Boom-Chuck (Country)',
    timeSignature: 4,
    swing: 0,
    steps: [
      { beat: 0, subdivision: 0, technique: 'pick-single', velocity: 1, strings: [true, false, false, false, false, false], accent: true },
      { beat: 1, subdivision: 0, technique: 'strum-down', velocity: 0.7, strings: [false, false, true, true, true, true], accent: false },
      { beat: 2, subdivision: 0, technique: 'pick-single', velocity: 0.9, strings: [false, true, false, false, false, false], accent: false },
      { beat: 3, subdivision: 0, technique: 'strum-down', velocity: 0.7, strings: [false, false, true, true, true, true], accent: false },
    ],
  },
  {
    id: 'flamenco-rasgueado',
    name: 'Flamenco Rasgueado',
    timeSignature: 4,
    swing: 0,
    steps: [
      { beat: 0, subdivision: 0, technique: 'rasgueado', velocity: 1, strings: [true, true, true, true, true, true], accent: true },
      { beat: 0, subdivision: 1, technique: 'strum-up', velocity: 0.6, strings: [false, true, true, true, true, true], accent: false },
      { beat: 0, subdivision: 2, technique: 'strum-down', velocity: 0.7, strings: [true, true, true, true, true, true], accent: false },
      { beat: 0, subdivision: 3, technique: 'strum-up', velocity: 0.5, strings: [false, true, true, true, true, true], accent: false },
      { beat: 1, subdivision: 0, technique: 'rasgueado', velocity: 0.9, strings: [true, true, true, true, true, true], accent: true },
    ],
  },
];

/**
 * Built-in fingerpicking patterns.
 */
export const FINGERPICK_PATTERNS: readonly FingerpickPattern[] = [
  {
    id: 'travis-basic',
    name: 'Travis Basic',
    sequence: [0, 2, 1, 2, 0, 2, 1, 2],
    velocities: [1, 0.6, 0.8, 0.6, 0.9, 0.6, 0.8, 0.6],
    durationBeats: 2,
  },
  {
    id: 'arpeggio-up',
    name: 'Arpeggio Up',
    sequence: [0, 1, 2, 3, 4, 5],
    velocities: [1, 0.9, 0.85, 0.8, 0.75, 0.7],
    durationBeats: 1,
  },
  {
    id: 'arpeggio-down',
    name: 'Arpeggio Down',
    sequence: [5, 4, 3, 2, 1, 0],
    velocities: [1, 0.9, 0.85, 0.8, 0.75, 0.7],
    durationBeats: 1,
  },
  {
    id: 'clawhammer',
    name: 'Clawhammer',
    sequence: [4, 0, 4, 2, 4, 0, 4, 3],
    velocities: [0.8, 1, 0.6, 0.8, 0.6, 1, 0.6, 0.8],
    durationBeats: 2,
  },
  {
    id: 'classical-pima',
    name: 'Classical PIMA',
    sequence: [0, 3, 2, 4, 1, 3, 2, 4],
    velocities: [1, 0.7, 0.7, 0.7, 0.9, 0.7, 0.7, 0.7],
    durationBeats: 2,
  },
];

/**
 * Guitar card presets.
 */
export const GUITAR_CARD_PRESETS = [
  { name: 'Acoustic Strum', guitarType: 'acoustic-steel', mode: 'strum', tone: 0.5, bodyResonance: 0.6, reverb: 0.2 },
  { name: 'Nylon Classical', guitarType: 'acoustic-nylon', mode: 'fingerpick', tone: 0.4, bodyResonance: 0.7, reverb: 0.3 },
  { name: 'Electric Clean', guitarType: 'electric-clean', mode: 'chord', tone: 0.6, bodyResonance: 0.2, reverb: 0.25, chorus: 0.2 },
  { name: 'Electric Crunch', guitarType: 'electric-crunch', mode: 'chord', tone: 0.7, palmMute: 0.3, reverb: 0.15 },
  { name: 'Lead Guitar', guitarType: 'electric-lead', mode: 'lead', tone: 0.8, reverb: 0.3 },
  { name: 'Jazz Guitar', guitarType: 'electric-jazz', mode: 'chord', tone: 0.3, bodyResonance: 0.4, reverb: 0.35 },
  { name: '12-String Jangle', guitarType: 'electric-twelve', mode: 'strum', tone: 0.6, chorus: 0.5, reverb: 0.3 },
  { name: 'Electric Bass', guitarType: 'bass-electric', mode: 'chord', tone: 0.5, bodyResonance: 0.3, reverb: 0.1 },
  { name: 'Acoustic Bass', guitarType: 'bass-acoustic', mode: 'fingerpick', tone: 0.4, bodyResonance: 0.6, reverb: 0.2 },
  { name: 'Ukulele', guitarType: 'ukulele', mode: 'strum', tone: 0.6, bodyResonance: 0.5, reverb: 0.25 },
  { name: 'Banjo Roll', guitarType: 'banjo', mode: 'fingerpick', tone: 0.7, bodyResonance: 0.4, reverb: 0.15 },
  { name: 'Mandolin Chop', guitarType: 'mandolin', mode: 'strum', tone: 0.6, bodyResonance: 0.5, reverb: 0.2 },
  { name: 'Folk Fingerpick', guitarType: 'acoustic-steel', mode: 'fingerpick', tone: 0.5, bodyResonance: 0.6, stringNoise: 0.25 },
  { name: 'Palm Muted Rock', guitarType: 'electric-crunch', mode: 'chord', palmMute: 0.7, tone: 0.6, reverb: 0.1 },
  { name: 'Country Twang', guitarType: 'electric-clean', mode: 'lead', tone: 0.7, reverb: 0.2, chorus: 0.15 },
  { name: 'Reggae Scratch', guitarType: 'electric-clean', mode: 'strum', palmMute: 0.4, tone: 0.4, reverb: 0.3 },
  { name: 'Flamenco', guitarType: 'acoustic-nylon', mode: 'strum', tone: 0.55, bodyResonance: 0.65, stringNoise: 0.3 },
  { name: 'Blues Licks', guitarType: 'electric-lead', mode: 'lead', tone: 0.65, reverb: 0.25 },
  { name: 'Funk Rhythm', guitarType: 'electric-clean', mode: 'strum', palmMute: 0.2, tone: 0.6, reverb: 0.15 },
  { name: 'Ambient Swells', guitarType: 'electric-clean', mode: 'chord', tone: 0.4, reverb: 0.6, chorus: 0.3 },
] as const;

/**
 * Convert chord notes to guitar voicing.
 * Returns fret positions for each string (null = don't play, 0 = open).
 */
export function chordToGuitarVoicing(
  chordNotes: readonly number[],
  capo: number = 0,
  tuning: readonly number[] = [0, 0, 0, 0, 0, 0]
): (number | null)[] {
  // Standard guitar tuning (low to high): E2, A2, D3, G3, B3, E4
  const openStrings = [40, 45, 50, 55, 59, 64].map((n, i) => n + tuning[i]! + capo);
  const voicing: (number | null)[] = [null, null, null, null, null, null];
  
  // Sorted chord notes
  const notes = [...chordNotes].sort((a, b) => a - b);
  
  // Try to place notes on strings, favoring lower frets
  for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
    const openNote = openStrings[stringIdx]!;
    let bestFret: number | null = null;
    let bestDiff = Infinity;
    
    for (const note of notes) {
      // Notes in the same pitch class within reasonable fret range
      for (let octave = -1; octave <= 2; octave++) {
        const targetNote = note + octave * 12;
        const fret = targetNote - openNote;
        
        if (fret >= 0 && fret <= 12) {
          // Prefer lower frets
          if (fret < bestDiff) {
            bestFret = fret;
            bestDiff = fret;
          }
        }
      }
    }
    
    voicing[stringIdx] = bestFret;
  }
  
  return voicing;
}

/**
 * Execute strum pattern step, returning notes to play.
 */
export function executeStrumStep(
  step: StrumPatternStep,
  voicing: readonly (number | null)[],
  baseVelocity: number = 100
): { note: number; velocity: number }[] {
  // Standard guitar tuning
  const openStrings = [40, 45, 50, 55, 59, 64];
  const notes: { note: number; velocity: number }[] = [];
  
  for (let i = 0; i < 6; i++) {
    if (step.strings[i] && voicing[i] !== null) {
      const note = openStrings[i]! + voicing[i]!;
      const velocity = Math.round(baseVelocity * step.velocity * (step.accent ? 1.2 : 1));
      notes.push({ note, velocity: Math.min(127, velocity) });
    }
  }
  
  // Reverse order for up strums
  if (step.technique === 'strum-up') {
    notes.reverse();
  }
  
  return notes;
}
