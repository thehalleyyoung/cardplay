/**
 * @fileoverview Scale Overlay - Musical scale highlighting and note guidance.
 * 
 * Provides:
 * - Scale/mode highlighting in piano roll and tracker
 * - In-scale/out-of-scale note indication
 * - Scale-aware quantization
 * - Chord track integration
 * - Key detection
 * 
 * @module @cardplay/music/scale-overlay
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase H.2
 */

import type { Tick } from '../types/primitives';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Musical note (0-11, C=0).
 */
export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/**
 * Root note with octave.
 */
export interface Note {
  readonly pitchClass: PitchClass;
  readonly octave: number;
  readonly midiNote: number;
}

/**
 * Scale definition.
 */
export interface ScaleDefinition {
  readonly name: string;
  readonly intervals: readonly number[]; // Semitone intervals from root
  readonly modes?: readonly string[]; // Mode names
  readonly category: 'major' | 'minor' | 'pentatonic' | 'blues' | 'modal' | 'exotic' | 'chromatic';
}

/**
 * Active scale.
 */
export interface ActiveScale {
  readonly root: PitchClass;
  readonly definition: ScaleDefinition;
  readonly notes: readonly PitchClass[];
}

/**
 * Scale region (scale changes at different times).
 */
export interface ScaleRegion {
  readonly startTick: Tick;
  readonly endTick: Tick;
  readonly scale: ActiveScale;
}

/**
 * Scale overlay display options.
 */
export interface ScaleOverlayOptions {
  /** Show in-scale notes highlighted */
  readonly highlightInScale: boolean;
  /** Dim out-of-scale notes */
  readonly dimOutOfScale: boolean;
  /** Show scale degree numbers */
  readonly showDegrees: boolean;
  /** In-scale note color */
  readonly inScaleColor: string;
  /** Out-of-scale color */
  readonly outOfScaleColor: string;
  /** Root note color */
  readonly rootColor: string;
  /** Chord tone color */
  readonly chordToneColor: string;
}

/**
 * Key detection result.
 */
export interface KeyDetectionResult {
  readonly key: PitchClass;
  readonly mode: 'major' | 'minor';
  readonly confidence: number;
  readonly alternates: readonly {
    readonly key: PitchClass;
    readonly mode: 'major' | 'minor';
    readonly confidence: number;
  }[];
}

// ============================================================================
// SCALE DEFINITIONS
// ============================================================================

/**
 * Built-in scale definitions.
 */
export const SCALES: Record<string, ScaleDefinition> = {
  // Major modes
  'major': {
    name: 'Major (Ionian)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    modes: ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'],
    category: 'major',
  },
  'natural-minor': {
    name: 'Natural Minor (Aeolian)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    category: 'minor',
  },
  'harmonic-minor': {
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    category: 'minor',
  },
  'melodic-minor': {
    name: 'Melodic Minor (ascending)',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    category: 'minor',
  },

  // Church modes
  'dorian': {
    name: 'Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    category: 'modal',
  },
  'phrygian': {
    name: 'Phrygian',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    category: 'modal',
  },
  'lydian': {
    name: 'Lydian',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    category: 'modal',
  },
  'mixolydian': {
    name: 'Mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    category: 'modal',
  },
  'locrian': {
    name: 'Locrian',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    category: 'modal',
  },

  // Pentatonic
  'major-pentatonic': {
    name: 'Major Pentatonic',
    intervals: [0, 2, 4, 7, 9],
    category: 'pentatonic',
  },
  'minor-pentatonic': {
    name: 'Minor Pentatonic',
    intervals: [0, 3, 5, 7, 10],
    category: 'pentatonic',
  },

  // Blues
  'blues': {
    name: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    category: 'blues',
  },
  'major-blues': {
    name: 'Major Blues',
    intervals: [0, 2, 3, 4, 7, 9],
    category: 'blues',
  },

  // Exotic
  'whole-tone': {
    name: 'Whole Tone',
    intervals: [0, 2, 4, 6, 8, 10],
    category: 'exotic',
  },
  'diminished': {
    name: 'Diminished (H-W)',
    intervals: [0, 1, 3, 4, 6, 7, 9, 10],
    category: 'exotic',
  },
  'augmented': {
    name: 'Augmented',
    intervals: [0, 3, 4, 7, 8, 11],
    category: 'exotic',
  },
  'hungarian-minor': {
    name: 'Hungarian Minor',
    intervals: [0, 2, 3, 6, 7, 8, 11],
    category: 'exotic',
  },
  'japanese': {
    name: 'Japanese (In-Sen)',
    intervals: [0, 1, 5, 7, 10],
    category: 'exotic',
  },
  'arabic': {
    name: 'Arabic',
    intervals: [0, 1, 4, 5, 7, 8, 11],
    category: 'exotic',
  },

  // Chromatic
  'chromatic': {
    name: 'Chromatic',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    category: 'chromatic',
  },
};

/**
 * Note names.
 */
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

/**
 * Scale degree names.
 */
export const SCALE_DEGREES = ['1', '♭2', '2', '♭3', '3', '4', '♯4/♭5', '5', '♯5/♭6', '6', '♭7', '7'] as const;

// ============================================================================
// SCALE OVERLAY
// ============================================================================

/**
 * ScaleOverlay manages scale highlighting and note guidance.
 */
export class ScaleOverlay {
  private activeScale: ActiveScale | null = null;
  private regions: ScaleRegion[] = [];
  private options: ScaleOverlayOptions;
  private callbacks = new Set<(scale: ActiveScale | null) => void>();

  constructor(options?: Partial<ScaleOverlayOptions>) {
    this.options = {
      highlightInScale: true,
      dimOutOfScale: true,
      showDegrees: false,
      inScaleColor: '#4CAF50',
      outOfScaleColor: '#424242',
      rootColor: '#FF9800',
      chordToneColor: '#2196F3',
      ...options,
    };
  }

  // ==========================================================================
  // SCALE MANAGEMENT
  // ==========================================================================

  /**
   * Sets the active scale.
   */
  setScale(root: PitchClass, scaleName: string): void {
    const definition = SCALES[scaleName];
    if (!definition) {
      console.warn(`Unknown scale: ${scaleName}`);
      return;
    }

    const notes = definition.intervals.map(
      interval => ((root + interval) % 12) as PitchClass
    );

    this.activeScale = {
      root,
      definition,
      notes,
    };

    this.notifyChange();
  }

  /**
   * Sets scale from active scale object.
   */
  setActiveScale(scale: ActiveScale | null): void {
    this.activeScale = scale;
    this.notifyChange();
  }

  /**
   * Gets active scale.
   */
  getActiveScale(): ActiveScale | null {
    return this.activeScale;
  }

  /**
   * Clears active scale.
   */
  clearScale(): void {
    this.activeScale = null;
    this.notifyChange();
  }

  /**
   * Gets notes in current scale.
   */
  getScaleNotes(): readonly PitchClass[] {
    return this.activeScale?.notes ?? [];
  }

  // ==========================================================================
  // SCALE REGIONS
  // ==========================================================================

  /**
   * Adds a scale region.
   */
  addRegion(startTick: Tick, endTick: Tick, root: PitchClass, scaleName: string): void {
    const definition = SCALES[scaleName];
    if (!definition) return;

    const notes = definition.intervals.map(
      interval => ((root + interval) % 12) as PitchClass
    );

    const region: ScaleRegion = {
      startTick,
      endTick,
      scale: { root, definition, notes },
    };

    this.regions.push(region);
    this.regions.sort((a, b) => (a.startTick as number) - (b.startTick as number));
  }

  /**
   * Gets scale at tick.
   */
  getScaleAtTick(tick: Tick): ActiveScale | null {
    // Check regions first
    for (const region of this.regions) {
      if (
        (tick as number) >= (region.startTick as number) &&
        (tick as number) < (region.endTick as number)
      ) {
        return region.scale;
      }
    }

    // Fall back to active scale
    return this.activeScale;
  }

  /**
   * Clears all regions.
   */
  clearRegions(): void {
    this.regions = [];
  }

  // ==========================================================================
  // NOTE CHECKING
  // ==========================================================================

  /**
   * Checks if a note is in the current scale.
   */
  isInScale(midiNote: number): boolean {
    if (!this.activeScale) return true;
    const pitchClass = (midiNote % 12) as PitchClass;
    return this.activeScale.notes.includes(pitchClass);
  }

  /**
   * Checks if a note is in scale at a specific tick.
   */
  isInScaleAtTick(midiNote: number, tick: Tick): boolean {
    const scale = this.getScaleAtTick(tick);
    if (!scale) return true;
    const pitchClass = (midiNote % 12) as PitchClass;
    return scale.notes.includes(pitchClass);
  }

  /**
   * Checks if a note is the root.
   */
  isRoot(midiNote: number): boolean {
    if (!this.activeScale) return false;
    return (midiNote % 12) === this.activeScale.root;
  }

  /**
   * Gets scale degree of a note (1-indexed).
   */
  getScaleDegree(midiNote: number): number | null {
    if (!this.activeScale) return null;
    const pitchClass = (midiNote % 12) as PitchClass;
    const index = this.activeScale.notes.indexOf(pitchClass);
    return index >= 0 ? index + 1 : null;
  }

  /**
   * Gets scale degree name.
   */
  getScaleDegreeName(midiNote: number): string | null {
    if (!this.activeScale) return null;
    const semitones = (midiNote - this.activeScale.root + 12) % 12;
    return SCALE_DEGREES[semitones] ?? null;
  }

  // ==========================================================================
  // QUANTIZATION
  // ==========================================================================

  /**
   * Quantizes a note to the nearest in-scale note.
   */
  quantizeToScale(midiNote: number): number {
    if (!this.activeScale || this.isInScale(midiNote)) {
      return midiNote;
    }

    const pitchClass = (midiNote % 12) as PitchClass;
    const octave = Math.floor(midiNote / 12);

    // Find nearest scale note
    let nearestDistance = 12;
    let nearestNote = pitchClass;

    for (const scaleNote of this.activeScale.notes) {
      const distance = Math.min(
        Math.abs(scaleNote - pitchClass),
        12 - Math.abs(scaleNote - pitchClass)
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestNote = scaleNote;
      }
    }

    // Determine correct octave
    let result = octave * 12 + nearestNote;

    // If the nearest note wrapped around, adjust octave
    if (nearestNote > 6 && pitchClass < 6) {
      result -= 12;
    } else if (nearestNote < 6 && pitchClass > 6) {
      result += 12;
    }

    return result;
  }

  /**
   * Gets nearest in-scale notes (up and down).
   */
  getNearestScaleNotes(midiNote: number): { up: number; down: number } {
    if (!this.activeScale) {
      return { up: midiNote + 1, down: midiNote - 1 };
    }

    let up = midiNote + 1;
    let down = midiNote - 1;

    // Find next note up
    while (!this.isInScale(up) && up < 128) {
      up++;
    }

    // Find next note down
    while (!this.isInScale(down) && down >= 0) {
      down--;
    }

    return { up, down };
  }

  // ==========================================================================
  // CHORD INTEGRATION
  // ==========================================================================

  /**
   * Gets chord tones (1, 3, 5, 7).
   */
  getChordTones(degree: number = 1): readonly PitchClass[] {
    if (!this.activeScale) return [];

    const notes = this.activeScale.notes;
    const indices = [0, 2, 4, 6].map(i => (degree - 1 + i) % notes.length);

    return indices
      .map(i => notes[i])
      .filter((n): n is PitchClass => n !== undefined);
  }

  /**
   * Checks if note is a chord tone.
   */
  isChordTone(midiNote: number, degree: number = 1): boolean {
    const chordTones = this.getChordTones(degree);
    const pitchClass = (midiNote % 12) as PitchClass;
    return chordTones.includes(pitchClass);
  }

  /**
   * Gets available tensions for a chord degree.
   */
  getTensions(degree: number = 1): readonly PitchClass[] {
    if (!this.activeScale) return [];

    const notes = this.activeScale.notes;
    const indices = [1, 3, 5].map(i => (degree - 1 + i) % notes.length);

    return indices
      .map(i => notes[i])
      .filter((n): n is PitchClass => n !== undefined);
  }

  // ==========================================================================
  // KEY DETECTION
  // ==========================================================================

  /**
   * Detects likely key from a set of notes.
   */
  static detectKey(midiNotes: readonly number[]): KeyDetectionResult {
    const pitchClasses = midiNotes.map(n => (n % 12) as PitchClass);
    const histogram = new Array(12).fill(0);

    // Build histogram
    for (const pc of pitchClasses) {
      histogram[pc]++;
    }

    // Test all keys
    const results: { key: PitchClass; mode: 'major' | 'minor'; confidence: number }[] = [];

    const majorIntervals = SCALES['major']?.intervals ?? [];
    const minorIntervals = SCALES['natural-minor']?.intervals ?? [];

    for (let root = 0; root < 12; root++) {
      // Test major
      let majorScore = 0;
      for (const interval of majorIntervals) {
        majorScore += histogram[(root + interval) % 12];
      }

      // Test minor
      let minorScore = 0;
      for (const interval of minorIntervals) {
        minorScore += histogram[(root + interval) % 12];
      }

      const totalNotes = pitchClasses.length;

      results.push({
        key: root as PitchClass,
        mode: 'major',
        confidence: totalNotes > 0 ? majorScore / totalNotes : 0,
      });

      results.push({
        key: root as PitchClass,
        mode: 'minor',
        confidence: totalNotes > 0 ? minorScore / totalNotes : 0,
      });
    }

    // Sort by confidence
    results.sort((a, b) => b.confidence - a.confidence);

    const best = results[0] ?? { key: 0 as PitchClass, mode: 'major' as const, confidence: 0 };

    return {
      key: best.key,
      mode: best.mode,
      confidence: best.confidence,
      alternates: results.slice(1, 5),
    };
  }

  // ==========================================================================
  // DISPLAY
  // ==========================================================================

  /**
   * Gets display info for a note.
   */
  getNoteDisplay(midiNote: number): {
    inScale: boolean;
    isRoot: boolean;
    isChordTone: boolean;
    degree: number | null;
    degreeName: string | null;
    color: string;
  } {
    const inScale = this.isInScale(midiNote);
    const isRoot = this.isRoot(midiNote);
    const isChordTone = this.isChordTone(midiNote);
    const degree = this.getScaleDegree(midiNote);
    const degreeName = this.getScaleDegreeName(midiNote);

    let color = this.options.outOfScaleColor;
    if (isRoot) {
      color = this.options.rootColor;
    } else if (isChordTone) {
      color = this.options.chordToneColor;
    } else if (inScale) {
      color = this.options.inScaleColor;
    }

    return {
      inScale,
      isRoot,
      isChordTone,
      degree,
      degreeName,
      color,
    };
  }

  /**
   * Gets colors for all notes (for piano roll/keyboard display).
   */
  getAllNoteColors(): readonly string[] {
    const colors: string[] = [];

    for (let note = 0; note < 128; note++) {
      colors.push(this.getNoteDisplay(note).color);
    }

    return colors;
  }

  /**
   * Gets display options.
   */
  getOptions(): ScaleOverlayOptions {
    return this.options;
  }

  /**
   * Sets display options.
   */
  setOptions(options: Partial<ScaleOverlayOptions>): void {
    this.options = { ...this.options, ...options };
    this.notifyChange();
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  /**
   * Subscribes to scale changes.
   */
  subscribe(callback: (scale: ActiveScale | null) => void): () => void {
    this.callbacks.add(callback);
    callback(this.activeScale);

    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifyChange(): void {
    for (const callback of this.callbacks) {
      try {
        callback(this.activeScale);
      } catch (e) {
        console.error('Scale overlay callback error:', e);
      }
    }
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Gets note name.
   */
  static getNoteName(midiNote: number, useFlats: boolean = false): string {
    const pitchClass = midiNote % 12;
    const octave = Math.floor(midiNote / 12) - 1;
    const names = useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES;
    return `${names[pitchClass]}${octave}`;
  }

  /**
   * Parses note name to MIDI note.
   */
  static parseNoteName(name: string): number | null {
    const match = name.match(/^([A-G])([#b]?)(-?\d+)$/i);
    if (!match) return null;

    const letter = match[1];
    if (!letter) return null;
    let pitchClass = NOTE_NAMES.indexOf(letter.toUpperCase() as any);
    if (pitchClass === -1) return null;

    const accidental = match[2] ?? '';
    if (accidental === '#') pitchClass = (pitchClass + 1) % 12;
    if (accidental === 'b') pitchClass = (pitchClass + 11) % 12;

    const octaveText = match[3];
    if (!octaveText) return null;
    const octave = parseInt(octaveText, 10) + 1;

    return octave * 12 + pitchClass;
  }

  /**
   * Gets all available scales.
   */
  static getAvailableScales(): readonly { name: string; key: string; category: string }[] {
    return Object.entries(SCALES).map(([key, def]) => ({
      name: def.name,
      key,
      category: def.category,
    }));
  }

  /**
   * Gets scale by name.
   */
  static getScale(name: string): ScaleDefinition | undefined {
    return SCALES[name];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Creates a scale overlay.
 */
export function createScaleOverlay(options?: Partial<ScaleOverlayOptions>): ScaleOverlay {
  return new ScaleOverlay(options);
}
