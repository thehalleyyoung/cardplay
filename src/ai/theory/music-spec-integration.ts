/**
 * @fileoverview MusicSpec Integration Module for Generators
 * 
 * Provides integration functions for connecting MusicSpec to various generators:
 * - Phrase generator (C111)
 * - Arranger (C112)
 * - Tracker helper (C113)
 * - Phrase adapter (C114)
 * - Chord generator (C115)
 * 
 * These functions read the current MusicSpec and derive appropriate parameters
 * for each generator type.
 * 
 * @module @cardplay/ai/theory/music-spec-integration
 */

import type {
  MusicSpec,
  RootName,
  ModeName,
  CultureTag,
  StyleTag,
  TonalityModel,
  MusicConstraint,
  ConstraintSchema,
  ConstraintTala,
  ConstraintCelticTune,
  ConstraintFilmMood,
} from './music-spec';

// ============================================================================
// C111: PHRASE GENERATOR INTEGRATION
// ============================================================================

/**
 * Parameters derived from MusicSpec for phrase generation.
 */
export interface PhraseGeneratorParams {
  /** Key root as MIDI pitch class (0-11) */
  readonly rootPitchClass: number;
  
  /** Scale intervals from root */
  readonly scaleIntervals: readonly number[];
  
  /** Mode name for pattern selection */
  readonly modeName: ModeName;
  
  /** Style-driven density preference (0-1) */
  readonly density: number;
  
  /** Style-driven complexity preference (0-1) */
  readonly complexity: number;
  
  /** Schema constraint if present */
  readonly schema?: string;
  
  /** Phrase length in beats (from meter) */
  readonly phraseLengthBeats: number;
  
  /** Culture-specific melodic patterns to prefer */
  readonly culturalPatterns: readonly string[];
}

/**
 * Maps RootName to MIDI pitch class (0-11).
 */
export function rootToPitchClass(root: RootName): number {
  const map: Record<RootName, number> = {
    'c': 0, 'csharp': 1, 'dflat': 1, 'd': 2, 'dsharp': 3, 'eflat': 3,
    'e': 4, 'f': 5, 'fsharp': 6, 'gflat': 6, 'g': 7, 'gsharp': 8,
    'aflat': 8, 'a': 9, 'asharp': 10, 'bflat': 10, 'b': 11,
  };
  return map[root] ?? 0;
}

/**
 * Gets scale intervals for a mode.
 */
export function modeToIntervals(mode: ModeName): readonly number[] {
  const intervals: Record<ModeName, readonly number[]> = {
    'major': [0, 2, 4, 5, 7, 9, 11],
    'ionian': [0, 2, 4, 5, 7, 9, 11],
    'dorian': [0, 2, 3, 5, 7, 9, 10],
    'phrygian': [0, 1, 3, 5, 7, 8, 10],
    'lydian': [0, 2, 4, 6, 7, 9, 11],
    'mixolydian': [0, 2, 4, 5, 7, 9, 10],
    'aeolian': [0, 2, 3, 5, 7, 8, 10],
    'locrian': [0, 1, 3, 5, 6, 8, 10],
    'natural_minor': [0, 2, 3, 5, 7, 8, 10],
    'harmonic_minor': [0, 2, 3, 5, 7, 8, 11],
    'melodic_minor': [0, 2, 3, 5, 7, 9, 11],
    'pentatonic_major': [0, 2, 4, 7, 9],
    'pentatonic_minor': [0, 3, 5, 7, 10],
    'blues': [0, 3, 5, 6, 7, 10],
    'whole_tone': [0, 2, 4, 6, 8, 10],
    'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    'octatonic': [0, 1, 3, 4, 6, 7, 9, 10],
  };
  return intervals[mode] ?? intervals['major'];
}

/**
 * Gets style-appropriate density (0-1).
 */
function styleDensity(style: StyleTag): number {
  const densityMap: Record<StyleTag, number> = {
    'galant': 0.4,
    'baroque': 0.6,
    'classical': 0.5,
    'romantic': 0.6,
    'cinematic': 0.5,
    'trailer': 0.7,
    'underscore': 0.3,
    'edm': 0.8,
    'pop': 0.6,
    'jazz': 0.7,
    'lofi': 0.4,
    'custom': 0.5,
  };
  return densityMap[style] ?? 0.5;
}

/**
 * Gets style-appropriate complexity (0-1).
 */
function styleComplexity(style: StyleTag): number {
  const complexityMap: Record<StyleTag, number> = {
    'galant': 0.3,
    'baroque': 0.7,
    'classical': 0.5,
    'romantic': 0.8,
    'cinematic': 0.6,
    'trailer': 0.4,
    'underscore': 0.2,
    'edm': 0.4,
    'pop': 0.3,
    'jazz': 0.9,
    'lofi': 0.3,
    'custom': 0.5,
  };
  return complexityMap[style] ?? 0.5;
}

/**
 * Gets culture-specific melodic patterns.
 */
function culturalPatterns(culture: CultureTag): readonly string[] {
  const patterns: Record<CultureTag, readonly string[]> = {
    'western': ['sequence', 'arpeggio', 'scale_run', 'neighbor_tones'],
    'carnatic': ['arohana', 'avarohana', 'pakad', 'gamaka'],
    'celtic': ['triplet_run', 'ornamental', 'modal_leap', 'grace_note_cluster'],
    'chinese': ['pentatonic_run', 'modal_cadence', 'octave_leap'],
    'hybrid': ['sequence', 'modal_cadence', 'pentatonic_run'],
  };
  return patterns[culture] ?? patterns['western'];
}

/**
 * C111: Extract phrase generator parameters from MusicSpec.
 * 
 * @param spec - Current MusicSpec
 * @returns Parameters for phrase generation
 */
export function phraseGeneratorParamsFromSpec(spec: MusicSpec): PhraseGeneratorParams {
  // Find schema constraint if any
  const schemaConstraint = spec.constraints.find(
    (c): c is ConstraintSchema => c.type === 'schema'
  );
  
  const baseParams = {
    rootPitchClass: rootToPitchClass(spec.keyRoot),
    scaleIntervals: modeToIntervals(spec.mode),
    modeName: spec.mode,
    density: styleDensity(spec.style),
    complexity: styleComplexity(spec.style),
    phraseLengthBeats: spec.meterNumerator * 2, // Default 2 bars
    culturalPatterns: culturalPatterns(spec.culture),
  };

  return schemaConstraint
    ? { ...baseParams, schema: schemaConstraint.schema }
    : baseParams;
}

// ============================================================================
// C112: ARRANGER INTEGRATION
// ============================================================================

/**
 * Parameters derived from MusicSpec for arranger.
 */
export interface ArrangerParams {
  /** Style for arrangement patterns */
  readonly style: StyleTag;
  
  /** Mood/energy level (0-1) */
  readonly energy: number;
  
  /** Orchestration density (0-1) */
  readonly orchestration: number;
  
  /** Key root */
  readonly keyRoot: RootName;
  
  /** Mode */
  readonly mode: ModeName;
  
  /** Preferred voice count */
  readonly voiceCount: number;
  
  /** Culture-specific arrangement rules */
  readonly cultureRules: readonly string[];
}

/**
 * Gets style-appropriate energy level.
 */
function styleEnergy(style: StyleTag): number {
  const energyMap: Record<StyleTag, number> = {
    'galant': 0.4,
    'baroque': 0.5,
    'classical': 0.5,
    'romantic': 0.7,
    'cinematic': 0.6,
    'trailer': 0.9,
    'underscore': 0.3,
    'edm': 0.85,
    'pop': 0.65,
    'jazz': 0.6,
    'lofi': 0.35,
    'custom': 0.5,
  };
  return energyMap[style] ?? 0.5;
}

/**
 * Gets style-appropriate voice count.
 */
function styleVoiceCount(style: StyleTag): number {
  const voiceMap: Record<StyleTag, number> = {
    'galant': 3,
    'baroque': 4,
    'classical': 4,
    'romantic': 5,
    'cinematic': 6,
    'trailer': 8,
    'underscore': 3,
    'edm': 4,
    'pop': 4,
    'jazz': 4,
    'lofi': 3,
    'custom': 4,
  };
  return voiceMap[style] ?? 4;
}

/**
 * Gets culture-specific arrangement rules.
 */
function cultureArrangementRules(culture: CultureTag): readonly string[] {
  const rules: Record<CultureTag, readonly string[]> = {
    'western': ['voice_leading', 'avoid_parallels', 'balance_register'],
    'carnatic': ['drone_tonic', 'melodic_primacy', 'tala_emphasis'],
    'celtic': ['unison_octaves', 'modal_harmony', 'drone_bass'],
    'chinese': ['pentatonic_harmony', 'octave_doubling', 'modal_centers'],
    'hybrid': ['voice_leading', 'modal_harmony', 'balance_register'],
  };
  return rules[culture] ?? rules['western'];
}

/**
 * C112: Extract arranger parameters from MusicSpec.
 * 
 * @param spec - Current MusicSpec
 * @returns Parameters for arrangement
 */
export function arrangerParamsFromSpec(spec: MusicSpec): ArrangerParams {
  return {
    style: spec.style,
    energy: styleEnergy(spec.style),
    orchestration: styleDensity(spec.style),
    keyRoot: spec.keyRoot,
    mode: spec.mode,
    voiceCount: styleVoiceCount(spec.style),
    cultureRules: cultureArrangementRules(spec.culture),
  };
}

// ============================================================================
// C113: TRACKER HELPER INTEGRATION
// ============================================================================

/**
 * Parameters derived from MusicSpec for tracker helper.
 */
export interface TrackerHelperParams {
  /** Suggested pattern role */
  readonly patternRole: 'lead' | 'bass' | 'pad' | 'rhythm' | 'fill';
  
  /** Accent positions within pattern (0-indexed) */
  readonly accentPositions: readonly number[];
  
  /** Swing amount (0 = straight, 1 = full swing) */
  readonly swing: number;
  
  /** Fill probability at pattern end (0-1) */
  readonly fillProbability: number;
  
  /** Tala pattern (for Carnatic) */
  readonly talaPattern?: readonly number[];
  
  /** Celtic dance lift position */
  readonly danceLifts?: readonly number[];
}

/**
 * Gets accent positions for a meter.
 */
function meterAccents(numerator: number, denominator: number): readonly number[] {
  // Simple accent patterns
  if (numerator === 4 && denominator === 4) {
    return [0, 2]; // Strong on 1 and 3
  } else if (numerator === 3 && denominator === 4) {
    return [0]; // Strong on 1 only
  } else if (numerator === 6 && denominator === 8) {
    return [0, 3]; // Compound - strong on 1 and 4
  } else if (numerator === 12 && denominator === 8) {
    return [0, 3, 6, 9]; // Compound quadruple
  }
  // Default: accent on beat 1
  return [0];
}

/**
 * C113: Extract tracker helper parameters from MusicSpec.
 * 
 * @param spec - Current MusicSpec
 * @returns Parameters for tracker helper
 */
export function trackerHelperParamsFromSpec(spec: MusicSpec): TrackerHelperParams {
  // Find tala constraint
  const talaConstraint = spec.constraints.find(
    (c): c is ConstraintTala => c.type === 'tala'
  );
  
  // Find Celtic tune constraint
  const celticConstraint = spec.constraints.find(
    (c): c is ConstraintCelticTune => c.type === 'celtic_tune'
  );
  
  // Determine pattern role from style
  let patternRole: 'lead' | 'bass' | 'pad' | 'rhythm' | 'fill' = 'lead';
  if (spec.style === 'edm' || spec.style === 'trailer') {
    patternRole = 'rhythm';
  } else if (spec.style === 'underscore' || spec.style === 'lofi') {
    patternRole = 'pad';
  }
  
  // Swing for jazz/lofi
  const swing = (spec.style === 'jazz' || spec.style === 'lofi') ? 0.3 : 0;
  
  // Tala pattern (simplified)
  let talaPattern: readonly number[] | undefined;
  if (talaConstraint) {
    // Simplified tala patterns (counts per anga)
    const talaPatterns: Record<string, readonly number[]> = {
      'adi': [4, 2, 2], // Laghu + Drutam + Drutam
      'rupaka': [2, 4], // Drutam + Laghu
      'misra_chapu': [3, 4], // 3 + 4
      'khanda_chapu': [2, 3], // 2 + 3
    };
    talaPattern = talaPatterns[talaConstraint.tala];
  }
  
  // Celtic dance lift positions
  let danceLifts: readonly number[] | undefined;
  if (celticConstraint) {
    // Lift position before strong beats
    danceLifts = meterAccents(spec.meterNumerator, spec.meterDenominator)
      .map(pos => (pos - 1 + spec.meterNumerator) % spec.meterNumerator);
  }
  
  const baseParams = {
    patternRole,
    accentPositions: meterAccents(spec.meterNumerator, spec.meterDenominator),
    swing,
    fillProbability: styleEnergy(spec.style) * 0.3,
  };

  return {
    ...baseParams,
    ...(talaPattern ? { talaPattern } : {}),
    ...(danceLifts ? { danceLifts } : {}),
  };
}

// ============================================================================
// C114: PHRASE ADAPTER INTEGRATION
// ============================================================================

/**
 * Parameters derived from MusicSpec for phrase adapter.
 */
export interface PhraseAdapterParams {
  /** Target key root as MIDI pitch class */
  readonly targetRoot: number;
  
  /** Target scale intervals */
  readonly targetScale: readonly number[];
  
  /** Mode for adaptation */
  readonly mode: ModeName;
  
  /** Raga name if applicable */
  readonly raga?: string;
  
  /** Adaptation strictness (0-1, 0 = permissive, 1 = strict) */
  readonly strictness: number;
  
  /** Allow chromatic alterations */
  readonly allowChromatic: boolean;
}

/**
 * C114: Extract phrase adapter parameters from MusicSpec.
 * 
 * @param spec - Current MusicSpec
 * @returns Parameters for phrase adaptation
 */
export function phraseAdapterParamsFromSpec(spec: MusicSpec): PhraseAdapterParams {
  // Find raga constraint
  const ragaConstraint = spec.constraints.find(
    c => c.type === 'raga'
  ) as { raga?: string } | undefined;
  
  // Strictness based on culture
  let strictness = 0.5;
  if (spec.culture === 'carnatic') {
    strictness = 0.9; // Strict raga adherence
  } else if (spec.style === 'jazz') {
    strictness = 0.3; // More permissive
  }
  
  const baseParams = {
    targetRoot: rootToPitchClass(spec.keyRoot),
    targetScale: modeToIntervals(spec.mode),
    mode: spec.mode,
    strictness,
    allowChromatic: styleEnergy(spec.style) > 0.7,
  };

  return ragaConstraint
    ? { ...baseParams, raga: ragaConstraint.raga }
    : baseParams;
}

// ============================================================================
// C115: CHORD GENERATOR INTEGRATION
// ============================================================================

/**
 * Parameters derived from MusicSpec for chord generator.
 */
export interface ChordGeneratorParams {
  /** Key root */
  readonly keyRoot: RootName;
  
  /** Mode */
  readonly mode: ModeName;
  
  /** Film progression type if applicable */
  readonly filmProgression?: string;
  
  /** Galant schema if applicable */
  readonly galantSchema?: string;
  
  /** Preferred chord types based on culture */
  readonly preferredChordTypes: readonly string[];
  
  /** Allow chromatic mediants (for romantic/cinematic) */
  readonly allowChromaticMediants: boolean;
  
  /** Progression length in bars */
  readonly progressionLength: number;
  
  /** Harmonic rhythm (chords per bar) */
  readonly harmonicRhythm: number;
}

/**
 * Gets preferred chord types for a culture/style.
 */
function preferredChordTypes(culture: CultureTag, style: StyleTag): readonly string[] {
  if (culture === 'carnatic') {
    return ['drone', 'modal_chord'];
  } else if (culture === 'celtic') {
    return ['major', 'minor', 'sus4'];
  } else if (style === 'jazz') {
    return ['major7', 'minor7', 'dominant7', 'half_diminished7'];
  } else if (style === 'romantic' || style === 'cinematic') {
    return ['major', 'minor', 'major7', 'minor7', 'augmented', 'diminished'];
  } else if (style === 'edm' || style === 'pop') {
    return ['major', 'minor', 'sus2', 'sus4'];
  }
  return ['major', 'minor', 'diminished'];
}

/**
 * Gets harmonic rhythm for style.
 */
function styleHarmonicRhythm(style: StyleTag): number {
  const rhythmMap: Record<StyleTag, number> = {
    'galant': 1,
    'baroque': 2,
    'classical': 1,
    'romantic': 0.5,
    'cinematic': 0.5,
    'trailer': 0.5,
    'underscore': 0.25,
    'edm': 2,
    'pop': 1,
    'jazz': 2,
    'lofi': 0.5,
    'custom': 1,
  };
  return rhythmMap[style] ?? 1;
}

/**
 * C115: Extract chord generator parameters from MusicSpec.
 * 
 * @param spec - Current MusicSpec
 * @returns Parameters for chord generation
 */
export function chordGeneratorParamsFromSpec(spec: MusicSpec): ChordGeneratorParams {
  // Find film mood constraint
  const filmConstraint = spec.constraints.find(
    (c): c is ConstraintFilmMood => c.type === 'film_mood'
  );
  
  // Find galant schema constraint
  const schemaConstraint = spec.constraints.find(
    (c): c is ConstraintSchema => c.type === 'schema'
  );
  
  return {
    keyRoot: spec.keyRoot,
    mode: spec.mode,
    filmProgression: filmConstraint?.mood ?? undefined,
    galantSchema: schemaConstraint?.schema ?? undefined,
    preferredChordTypes: preferredChordTypes(spec.culture, spec.style),
    allowChromaticMediants: spec.style === 'romantic' || spec.style === 'cinematic',
    progressionLength: 4, // Default 4 bars
    harmonicRhythm: styleHarmonicRhythm(spec.style),
  };
}

// ============================================================================
// UNIFIED INTEGRATION QUERY
// ============================================================================

/**
 * All generator params derived from a single MusicSpec.
 */
export interface AllGeneratorParams {
  readonly phrase: PhraseGeneratorParams;
  readonly arranger: ArrangerParams;
  readonly tracker: TrackerHelperParams;
  readonly adapter: PhraseAdapterParams;
  readonly chord: ChordGeneratorParams;
}

/**
 * Extract all generator parameters from MusicSpec.
 * 
 * @param spec - Current MusicSpec
 * @returns All generator parameters
 */
export function allGeneratorParamsFromSpec(spec: MusicSpec): AllGeneratorParams {
  return {
    phrase: phraseGeneratorParamsFromSpec(spec),
    arranger: arrangerParamsFromSpec(spec),
    tracker: trackerHelperParamsFromSpec(spec),
    adapter: phraseAdapterParamsFromSpec(spec),
    chord: chordGeneratorParamsFromSpec(spec),
  };
}
