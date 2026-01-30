/**
 * GOFAI NL Semantics — Preservation Modes & Musical Identity
 *
 * Defines `PreservationMode` with validation checks for each mode,
 * plus identity semantics for motif, harmony, rhythm, and arrangement.
 *
 * ## Step 166: PreservationMode
 * exact | functional | recognizable — with validation specs
 *
 * ## Step 167: Motif Identity
 * Motif fingerprints (interval/rhythm) and "recognizable" thresholds
 *
 * ## Step 168: Harmony Identity
 * Chord skeleton vs extensions vs substitutions; "keep chords" tiers
 *
 * ## Step 169: Rhythm Identity
 * "Keep rhythm" as onset grid equality or tolerance-based equivalence
 *
 * ## Step 170: Arrangement Identity
 * "Keep instrumentation" vs "keep roles" vs "keep layers" as distinct constraints
 *
 * ## Preservation Model
 *
 * Three levels of preservation, each with progressively looser matching:
 *
 * ```
 * EXACT          → bit-for-bit identical (or numerically exact)
 *                  pitch[i] == pitch[i]', duration[i] == duration[i]'
 *
 * FUNCTIONAL     → same musical function, possibly different notes
 *                  chord(Cmaj) → chord(Cmaj7) OK (same function: tonic)
 *                  melody_contour similar, key relationships preserved
 *
 * RECOGNIZABLE   → a listener would say "that's the same tune"
 *                  contour correlation > 0.7, rhythm onsets overlap > 0.8
 *                  key may differ (transposition OK)
 * ```
 *
 * @module gofai/nl/semantics/preservation-identity
 * @see gofai_goalA.md Steps 166–170
 */


// =============================================================================
// STEP 166: PRESERVATION MODE — exact | functional | recognizable
// =============================================================================

/**
 * Preservation modes.
 * Each mode defines how strictly an entity must be preserved.
 */
export type PreservationMode = 'exact' | 'functional' | 'recognizable';

/**
 * Full specification of a preservation mode.
 */
export interface PreservationModeSpec {
  /** Mode identifier */
  readonly mode: PreservationMode;

  /** Human-readable name */
  readonly name: string;

  /** Description */
  readonly description: string;

  /** What must be identical */
  readonly requiredIdentity: readonly IdentityDimension[];

  /** What may differ */
  readonly allowedVariation: readonly AllowedVariation[];

  /** Validation checks to run */
  readonly validationChecks: readonly ValidationCheck[];

  /** Default similarity threshold (0–1) */
  readonly defaultThreshold: number;

  /** Linguistic cues that trigger this mode */
  readonly triggerCues: readonly string[];
}

/**
 * A dimension of identity: what aspect of a musical entity defines it.
 */
export interface IdentityDimension {
  /** Dimension name */
  readonly name: string;

  /** What is compared */
  readonly description: string;

  /** How it's extracted from the entity */
  readonly extractionMethod: ExtractionMethod;

  /** How similar the values must be (0–1) */
  readonly minSimilarity: number;

  /** The comparison metric */
  readonly comparisonMetric: ComparisonMetric;
}

/**
 * How a value is extracted from a musical entity for comparison.
 */
export type ExtractionMethod =
  | 'pitch_sequence'        // Extract MIDI note numbers
  | 'interval_sequence'     // Extract intervals between successive notes
  | 'contour_direction'     // Extract up/down/same sequence
  | 'onset_grid'            // Extract onset times on a grid
  | 'duration_sequence'     // Extract note durations
  | 'velocity_sequence'     // Extract note velocities
  | 'chord_symbols'         // Extract chord symbol sequence
  | 'chord_root_sequence'   // Extract just root notes of chords
  | 'chord_quality_sequence' // Extract chord quality (maj/min/dim/aug)
  | 'harmonic_function'     // Extract functional harmony (I, IV, V, etc.)
  | 'spectral_centroid'     // Extract spectral centroid over time
  | 'rms_envelope'          // Extract RMS loudness envelope
  | 'instrument_list'       // Extract list of instruments
  | 'layer_structure'       // Extract layer/track structure
  | 'section_sequence'      // Extract section order
  | 'tempo_map'             // Extract tempo over time
  | 'key_sequence'          // Extract key changes
  | 'dynamics_contour'      // Extract dynamic level over time
  | 'articulation_marks'    // Extract articulation markings
  | 'structural_hash';      // Hash of structural properties

/**
 * Comparison metrics for identity checking.
 */
export type ComparisonMetric =
  | 'exact_equality'         // Values must be identical
  | 'set_equality'           // Sets must be identical
  | 'sequence_equality'      // Ordered sequences must be identical
  | 'correlation'            // Pearson or Spearman correlation
  | 'cosine_similarity'      // Cosine similarity of vectors
  | 'edit_distance'          // Levenshtein or similar edit distance
  | 'jaccard_similarity'     // Set overlap coefficient
  | 'dtw_distance'           // Dynamic Time Warping distance
  | 'hamming_distance'       // Bit/symbol differences
  | 'interval_class_vector'  // Interval class vector comparison
  | 'onset_overlap'          // Proportion of overlapping onsets
  | 'proportion_check';      // Check that proportions are maintained

/**
 * An allowed variation: what CAN differ in a given preservation mode.
 */
export interface AllowedVariation {
  /** What can vary */
  readonly dimension: string;

  /** How much it can vary */
  readonly maxDeviation: string;

  /** Description */
  readonly description: string;
}

/**
 * A validation check for preservation.
 */
export interface ValidationCheck {
  /** Check name */
  readonly name: string;

  /** What to check */
  readonly description: string;

  /** The extraction method for the before value */
  readonly beforeExtraction: ExtractionMethod;

  /** The extraction method for the after value */
  readonly afterExtraction: ExtractionMethod;

  /** The comparison metric */
  readonly metric: ComparisonMetric;

  /** The threshold for passing */
  readonly passThreshold: number;

  /** Severity if the check fails */
  readonly failSeverity: 'error' | 'warning';

  /** Weight of this check in the overall score (0–1) */
  readonly weight: number;
}


// =============================================================================
// PRESERVATION MODE SPECIFICATIONS
// =============================================================================

/**
 * Exact preservation mode specification.
 */
export const EXACT_PRESERVATION: PreservationModeSpec = {
  mode: 'exact',
  name: 'Exact Preservation',
  description: 'Bit-for-bit identical: every note, every timing, every parameter matches',
  requiredIdentity: [
    { name: 'pitch', description: 'Pitch values must be identical', extractionMethod: 'pitch_sequence', minSimilarity: 1.0, comparisonMetric: 'sequence_equality' },
    { name: 'duration', description: 'Note durations must be identical', extractionMethod: 'duration_sequence', minSimilarity: 1.0, comparisonMetric: 'sequence_equality' },
    { name: 'onset', description: 'Onset times must be identical', extractionMethod: 'onset_grid', minSimilarity: 1.0, comparisonMetric: 'sequence_equality' },
    { name: 'velocity', description: 'Velocities must be identical', extractionMethod: 'velocity_sequence', minSimilarity: 1.0, comparisonMetric: 'sequence_equality' },
    { name: 'structure', description: 'Structure must be identical', extractionMethod: 'structural_hash', minSimilarity: 1.0, comparisonMetric: 'exact_equality' },
  ],
  allowedVariation: [],
  validationChecks: [
    { name: 'pitch_equality', description: 'All pitches must match exactly', beforeExtraction: 'pitch_sequence', afterExtraction: 'pitch_sequence', metric: 'sequence_equality', passThreshold: 1.0, failSeverity: 'error', weight: 1.0 },
    { name: 'timing_equality', description: 'All onsets must match exactly', beforeExtraction: 'onset_grid', afterExtraction: 'onset_grid', metric: 'sequence_equality', passThreshold: 1.0, failSeverity: 'error', weight: 1.0 },
    { name: 'dynamics_equality', description: 'All velocities must match', beforeExtraction: 'velocity_sequence', afterExtraction: 'velocity_sequence', metric: 'sequence_equality', passThreshold: 1.0, failSeverity: 'error', weight: 0.8 },
    { name: 'structure_equality', description: 'Structure hash must match', beforeExtraction: 'structural_hash', afterExtraction: 'structural_hash', metric: 'exact_equality', passThreshold: 1.0, failSeverity: 'error', weight: 1.0 },
  ],
  defaultThreshold: 1.0,
  triggerCues: ['exact', 'identical', 'unchanged', 'untouched', 'as is', "don't change", "don't touch"],
};

/**
 * Functional preservation mode specification.
 */
export const FUNCTIONAL_PRESERVATION: PreservationModeSpec = {
  mode: 'functional',
  name: 'Functional Preservation',
  description: 'Same musical function: chord functions, melodic role, rhythmic feel preserved',
  requiredIdentity: [
    { name: 'harmonic_function', description: 'Harmonic function sequence must be the same', extractionMethod: 'harmonic_function', minSimilarity: 0.9, comparisonMetric: 'sequence_equality' },
    { name: 'contour', description: 'Melodic contour must be similar', extractionMethod: 'contour_direction', minSimilarity: 0.8, comparisonMetric: 'correlation' },
    { name: 'rhythm_pattern', description: 'Rhythmic onset pattern must be similar', extractionMethod: 'onset_grid', minSimilarity: 0.8, comparisonMetric: 'onset_overlap' },
    { name: 'structure', description: 'Overall structure must be the same', extractionMethod: 'section_sequence', minSimilarity: 1.0, comparisonMetric: 'sequence_equality' },
  ],
  allowedVariation: [
    { dimension: 'pitch', maxDeviation: 'Transposition OK; passing tones may change', description: 'Individual pitches may vary if contour and function preserved' },
    { dimension: 'rhythm', maxDeviation: 'Slight rhythmic variation OK', description: 'Onsets may shift within tolerance' },
    { dimension: 'voicing', maxDeviation: 'Chord voicings may change', description: 'Inversions and voice distribution may differ' },
    { dimension: 'dynamics', maxDeviation: 'Dynamic details may vary', description: 'Velocity profiles may differ' },
    { dimension: 'ornamentation', maxDeviation: 'Grace notes and ornaments may change', description: 'Decorative elements may be added/removed' },
  ],
  validationChecks: [
    { name: 'harmonic_function_check', description: 'Check that harmonic functions match', beforeExtraction: 'harmonic_function', afterExtraction: 'harmonic_function', metric: 'sequence_equality', passThreshold: 0.9, failSeverity: 'error', weight: 1.0 },
    { name: 'contour_check', description: 'Check melodic contour similarity', beforeExtraction: 'contour_direction', afterExtraction: 'contour_direction', metric: 'correlation', passThreshold: 0.7, failSeverity: 'warning', weight: 0.8 },
    { name: 'rhythm_check', description: 'Check rhythmic onset overlap', beforeExtraction: 'onset_grid', afterExtraction: 'onset_grid', metric: 'onset_overlap', passThreshold: 0.75, failSeverity: 'warning', weight: 0.8 },
    { name: 'key_check', description: 'Check key/mode preservation', beforeExtraction: 'key_sequence', afterExtraction: 'key_sequence', metric: 'sequence_equality', passThreshold: 0.9, failSeverity: 'warning', weight: 0.7 },
    { name: 'section_check', description: 'Check section structure', beforeExtraction: 'section_sequence', afterExtraction: 'section_sequence', metric: 'sequence_equality', passThreshold: 1.0, failSeverity: 'error', weight: 1.0 },
  ],
  defaultThreshold: 0.8,
  triggerCues: ['functional', 'same feel', 'same spirit', 'same essence', 'same character', 'same vibe'],
};

/**
 * Recognizable preservation mode specification.
 */
export const RECOGNIZABLE_PRESERVATION: PreservationModeSpec = {
  mode: 'recognizable',
  name: 'Recognizable Preservation',
  description: 'A listener would recognize it as "the same thing" — contour, rhythm shape, overall character',
  requiredIdentity: [
    { name: 'contour', description: 'Melodic contour must be recognizable', extractionMethod: 'contour_direction', minSimilarity: 0.6, comparisonMetric: 'correlation' },
    { name: 'rhythm_shape', description: 'Rhythmic feel must be recognizable', extractionMethod: 'onset_grid', minSimilarity: 0.6, comparisonMetric: 'onset_overlap' },
  ],
  allowedVariation: [
    { dimension: 'pitch', maxDeviation: 'Transposition, reharmonization OK', description: 'Pitches may differ significantly if contour preserved' },
    { dimension: 'rhythm', maxDeviation: 'Tempo changes, swing adjustments OK', description: 'Rhythmic grid may stretch/compress' },
    { dimension: 'harmony', maxDeviation: 'Chord substitutions OK', description: 'Harmonies may change if not the focus' },
    { dimension: 'instrumentation', maxDeviation: 'Different instruments OK', description: 'May use different sounds' },
    { dimension: 'dynamics', maxDeviation: 'Dynamic profile may differ', description: 'Volume contour may be quite different' },
    { dimension: 'effects', maxDeviation: 'Effects may change freely', description: 'Processing may differ entirely' },
    { dimension: 'key', maxDeviation: 'Key change OK', description: 'May be transposed to any key' },
    { dimension: 'tempo', maxDeviation: 'Tempo change OK within limits', description: 'Tempo may vary ±30%' },
  ],
  validationChecks: [
    { name: 'contour_check', description: 'Check melodic contour recognizability', beforeExtraction: 'contour_direction', afterExtraction: 'contour_direction', metric: 'correlation', passThreshold: 0.5, failSeverity: 'warning', weight: 0.9 },
    { name: 'interval_check', description: 'Check interval pattern similarity', beforeExtraction: 'interval_sequence', afterExtraction: 'interval_sequence', metric: 'edit_distance', passThreshold: 0.5, failSeverity: 'warning', weight: 0.8 },
    { name: 'rhythm_shape_check', description: 'Check rhythmic shape', beforeExtraction: 'onset_grid', afterExtraction: 'onset_grid', metric: 'dtw_distance', passThreshold: 0.5, failSeverity: 'warning', weight: 0.8 },
  ],
  defaultThreshold: 0.6,
  triggerCues: ['recognizable', 'similar', 'roughly', 'close to', 'the same basic', 'shape', 'contour'],
};

/**
 * Map of all preservation mode specs.
 */
export const PRESERVATION_MODES: ReadonlyMap<PreservationMode, PreservationModeSpec> = new Map([
  ['exact', EXACT_PRESERVATION],
  ['functional', FUNCTIONAL_PRESERVATION],
  ['recognizable', RECOGNIZABLE_PRESERVATION],
]);

/**
 * Get the preservation mode spec for a given mode.
 */
export function getPreservationModeSpec(mode: PreservationMode): PreservationModeSpec {
  return PRESERVATION_MODES.get(mode) ?? EXACT_PRESERVATION;
}


// =============================================================================
// PRESERVATION VALIDATION — checking preservation against before/after states
// =============================================================================

/**
 * Result of validating preservation.
 */
export interface PreservationValidationResult {
  /** The preservation mode checked */
  readonly mode: PreservationMode;

  /** Overall pass/fail */
  readonly passed: boolean;

  /** Overall similarity score (0–1) */
  readonly overallScore: number;

  /** Individual check results */
  readonly checkResults: readonly PreservationCheckResult[];

  /** Summary description */
  readonly summary: string;
}

/**
 * Result of a single preservation check.
 */
export interface PreservationCheckResult {
  /** The check that was run */
  readonly checkName: string;

  /** Whether this check passed */
  readonly passed: boolean;

  /** The computed similarity score (0–1) */
  readonly score: number;

  /** The threshold required */
  readonly threshold: number;

  /** Severity of failure */
  readonly severity: 'error' | 'warning';

  /** Description */
  readonly description: string;
}

/**
 * Run preservation validation for a given mode.
 * (Structural validation — actual data comparison would require runtime values.)
 */
export function createPreservationValidator(
  mode: PreservationMode,
): PreservationValidator {
  const spec = getPreservationModeSpec(mode);
  return {
    mode,
    spec,
    checks: spec.validationChecks,
    requiredDimensions: spec.requiredIdentity.map(d => d.name),
    allowedVariations: spec.allowedVariation.map(v => v.dimension),
    threshold: spec.defaultThreshold,
  };
}

/**
 * A configured preservation validator.
 */
export interface PreservationValidator {
  /** The mode being validated */
  readonly mode: PreservationMode;

  /** The mode spec */
  readonly spec: PreservationModeSpec;

  /** The checks to run */
  readonly checks: readonly ValidationCheck[];

  /** Dimensions that must be identical (within tolerance) */
  readonly requiredDimensions: readonly string[];

  /** Dimensions that may vary */
  readonly allowedVariations: readonly string[];

  /** Overall threshold */
  readonly threshold: number;
}


// =============================================================================
// STEP 167: MOTIF IDENTITY — fingerprints and recognizability
// =============================================================================

/**
 * A motif fingerprint: the essential features that identify a motif.
 */
export interface MotifFingerprint {
  /** Unique fingerprint ID */
  readonly id: string;

  /** The motif's name or reference */
  readonly motifRef: string;

  /** Interval sequence (semitone distances between successive notes) */
  readonly intervals: readonly number[];

  /** Contour direction sequence (1 = up, -1 = down, 0 = same) */
  readonly contour: readonly number[];

  /** Normalized duration ratios (sum = 1) */
  readonly durationRatios: readonly number[];

  /** Onset ratios (positions relative to total length) */
  readonly onsetRatios: readonly number[];

  /** Number of notes */
  readonly noteCount: number;

  /** Total duration (in beats) */
  readonly totalBeats: number;

  /** Key-independent interval class vector (counts of each IC 0–6) */
  readonly intervalClassVector: readonly number[];

  /** Rhythmic density (notes per beat) */
  readonly rhythmicDensity: number;

  /** Pitch range (in semitones) */
  readonly pitchRange: number;

  /** Whether the motif starts on a strong beat */
  readonly startsOnStrongBeat: boolean;

  /** Whether the motif ends on a strong beat */
  readonly endsOnStrongBeat: boolean;
}

/**
 * Thresholds for motif recognizability.
 */
export interface MotifRecognizabilityThresholds {
  /** Minimum interval sequence correlation for "recognizable" */
  readonly minIntervalCorrelation: number;

  /** Minimum contour correlation for "recognizable" */
  readonly minContourCorrelation: number;

  /** Maximum edit distance (as fraction of length) for interval sequence */
  readonly maxIntervalEditDistance: number;

  /** Minimum onset overlap for rhythmic similarity */
  readonly minOnsetOverlap: number;

  /** Minimum overall similarity for "recognizable" */
  readonly minOverallSimilarity: number;

  /** Weights for combining individual similarities */
  readonly weights: MotifSimilarityWeights;
}

/**
 * Weights for combining motif similarity dimensions.
 */
export interface MotifSimilarityWeights {
  /** Weight for interval similarity */
  readonly interval: number;

  /** Weight for contour similarity */
  readonly contour: number;

  /** Weight for rhythm similarity */
  readonly rhythm: number;

  /** Weight for pitch range similarity */
  readonly pitchRange: number;

  /** Weight for note count similarity */
  readonly noteCount: number;
}

/**
 * Default motif recognizability thresholds.
 */
export const DEFAULT_MOTIF_THRESHOLDS: MotifRecognizabilityThresholds = {
  minIntervalCorrelation: 0.6,
  minContourCorrelation: 0.7,
  maxIntervalEditDistance: 0.4,
  minOnsetOverlap: 0.6,
  minOverallSimilarity: 0.6,
  weights: {
    interval: 0.35,
    contour: 0.30,
    rhythm: 0.25,
    pitchRange: 0.05,
    noteCount: 0.05,
  },
};

/**
 * Compare two motif fingerprints and compute similarity.
 */
export function compareMotifFingerprints(
  a: MotifFingerprint,
  b: MotifFingerprint,
  thresholds: MotifRecognizabilityThresholds = DEFAULT_MOTIF_THRESHOLDS,
): MotifSimilarityResult {
  // Interval similarity
  const intervalSim = computeSequenceSimilarity(a.intervals, b.intervals);

  // Contour similarity
  const contourSim = computeSequenceSimilarity(a.contour, b.contour);

  // Rhythm similarity (onset overlap)
  const rhythmSim = computeOnsetOverlap(a.onsetRatios, b.onsetRatios);

  // Pitch range similarity
  const rangeSim = a.pitchRange > 0 && b.pitchRange > 0
    ? 1 - Math.abs(a.pitchRange - b.pitchRange) / Math.max(a.pitchRange, b.pitchRange)
    : a.pitchRange === b.pitchRange ? 1 : 0;

  // Note count similarity
  const countSim = a.noteCount > 0 && b.noteCount > 0
    ? 1 - Math.abs(a.noteCount - b.noteCount) / Math.max(a.noteCount, b.noteCount)
    : a.noteCount === b.noteCount ? 1 : 0;

  // Weighted overall
  const w = thresholds.weights;
  const overall =
    intervalSim * w.interval +
    contourSim * w.contour +
    rhythmSim * w.rhythm +
    rangeSim * w.pitchRange +
    countSim * w.noteCount;

  const isRecognizable = overall >= thresholds.minOverallSimilarity;

  return {
    intervalSimilarity: intervalSim,
    contourSimilarity: contourSim,
    rhythmSimilarity: rhythmSim,
    pitchRangeSimilarity: rangeSim,
    noteCountSimilarity: countSim,
    overallSimilarity: overall,
    isRecognizable,
    preservationLevel: overall >= 0.95 ? 'exact'
      : overall >= 0.75 ? 'functional'
      : overall >= thresholds.minOverallSimilarity ? 'recognizable'
      : 'not_preserved',
  };
}

/**
 * Motif similarity result.
 */
export interface MotifSimilarityResult {
  readonly intervalSimilarity: number;
  readonly contourSimilarity: number;
  readonly rhythmSimilarity: number;
  readonly pitchRangeSimilarity: number;
  readonly noteCountSimilarity: number;
  readonly overallSimilarity: number;
  readonly isRecognizable: boolean;
  readonly preservationLevel: 'exact' | 'functional' | 'recognizable' | 'not_preserved';
}


// =============================================================================
// STEP 168: HARMONY IDENTITY — chord skeleton tiers
// =============================================================================

/**
 * A harmonic identity fingerprint.
 */
export interface HarmonicFingerprint {
  /** Reference chord progression (as symbols) */
  readonly chordSymbols: readonly string[];

  /** Root note sequence (as pitch classes 0-11) */
  readonly rootSequence: readonly number[];

  /** Quality sequence (major, minor, diminished, augmented, etc.) */
  readonly qualitySequence: readonly ChordQuality[];

  /** Functional harmony sequence (I, IV, V, etc.) */
  readonly functionSequence: readonly HarmonicFunction[];

  /** Bass note sequence (for inversions) */
  readonly bassSequence: readonly number[];

  /** Chord extensions present (7ths, 9ths, etc.) */
  readonly extensions: readonly ChordExtensionInfo[];

  /** Key/mode context */
  readonly keyContext: string;

  /** Harmonic rhythm (chord changes per bar) */
  readonly harmonicRhythm: number;
}

/**
 * Chord quality types.
 */
export type ChordQuality =
  | 'major'
  | 'minor'
  | 'diminished'
  | 'augmented'
  | 'dominant'
  | 'half_diminished'
  | 'suspended_2'
  | 'suspended_4'
  | 'power';

/**
 * Harmonic function labels.
 */
export type HarmonicFunction =
  | 'tonic'           // I, i
  | 'supertonic'      // ii
  | 'mediant'         // iii
  | 'subdominant'     // IV, iv
  | 'dominant'        // V
  | 'submediant'      // vi
  | 'leading_tone'    // vii°
  | 'secondary_dom'   // V/x
  | 'applied_chord'   // Other secondary function
  | 'chromatic'       // Chromatic chord (outside key)
  | 'pedal'           // Pedal chord
  | 'passing'         // Passing chord
  | 'unknown';

/**
 * Chord extension information.
 */
export interface ChordExtensionInfo {
  /** Chord index in the progression */
  readonly chordIndex: number;

  /** Extension types present */
  readonly extensions: readonly ChordExtension[];
}

/**
 * Chord extension types.
 */
export type ChordExtension =
  | '7th'
  | '9th'
  | '11th'
  | '13th'
  | 'add9'
  | 'add11'
  | 'sus2'
  | 'sus4'
  | 'alt'
  | 'dim7'
  | 'aug';

/**
 * Tiers of harmonic preservation (from strictest to loosest).
 */
export type HarmonicPreservationTier =
  | 'exact_voicing'     // Same notes in same octaves
  | 'same_chords'       // Same chord symbols (Cmaj7 = Cmaj7)
  | 'same_qualities'    // Same root + quality (Cmaj7 ≈ Cmaj, extension OK)
  | 'same_function'     // Same harmonic function (I, IV, V preserved)
  | 'same_movement'     // Same harmonic direction/pattern (up, down, cadence)
  | 'key_preserved';    // Just the same key/mode

/**
 * Map "keep chords" to a harmonic preservation tier.
 */
export interface HarmonicPreservationMapping {
  /** Trigger phrase */
  readonly phrase: string;

  /** The tier it maps to */
  readonly tier: HarmonicPreservationTier;

  /** Description */
  readonly description: string;

  /** Confidence */
  readonly confidence: number;
}

/**
 * Database of "keep chords" phrase mappings.
 */
export const HARMONIC_PRESERVATION_MAPPINGS: readonly HarmonicPreservationMapping[] = [
  { phrase: 'keep the exact chords', tier: 'same_chords', description: 'Same chord symbols', confidence: 0.95 },
  { phrase: 'keep the chord voicings', tier: 'exact_voicing', description: 'Same notes in same positions', confidence: 0.95 },
  { phrase: 'keep the chords', tier: 'same_qualities', description: 'Same roots and qualities, extensions may change', confidence: 0.9 },
  { phrase: 'keep the harmony', tier: 'same_function', description: 'Same harmonic functions (tonic, dominant, etc.)', confidence: 0.85 },
  { phrase: 'keep the chord changes', tier: 'same_qualities', description: 'Same chord progression', confidence: 0.9 },
  { phrase: 'keep the harmonic movement', tier: 'same_movement', description: 'Same direction of harmonic motion', confidence: 0.8 },
  { phrase: 'keep it in the same key', tier: 'key_preserved', description: 'Only preserve the key/mode', confidence: 0.9 },
  { phrase: 'keep the progression', tier: 'same_function', description: 'Preserve functional harmony', confidence: 0.85 },
  { phrase: 'keep the changes', tier: 'same_qualities', description: 'Preserve chord changes', confidence: 0.85 },
  { phrase: 'functionally the same chords', tier: 'same_function', description: 'Functional equivalence OK', confidence: 0.9 },
  { phrase: 'same basic chords', tier: 'same_qualities', description: 'Root and quality preserved', confidence: 0.85 },
  { phrase: 'chord skeleton', tier: 'same_function', description: 'Functional skeleton preserved', confidence: 0.85 },
];


// =============================================================================
// STEP 169: RHYTHM IDENTITY — onset grid and tolerance
// =============================================================================

/**
 * A rhythmic identity fingerprint.
 */
export interface RhythmicFingerprint {
  /** Onset positions (as fractions of total duration) */
  readonly onsetPositions: readonly number[];

  /** Duration ratios (normalized) */
  readonly durationRatios: readonly number[];

  /** Accent/stress pattern (0-1 per onset) */
  readonly accentPattern: readonly number[];

  /** Time signature numerator */
  readonly numerator: number;

  /** Time signature denominator */
  readonly denominator: number;

  /** Swing amount (0 = straight, 1 = full triplet swing) */
  readonly swingAmount: number;

  /** Whether the pattern is syncopated */
  readonly syncopated: boolean;

  /** Note density (onsets per beat) */
  readonly density: number;

  /** Longest gap between onsets (as fraction of total) */
  readonly longestGap: number;

  /** Total number of onsets */
  readonly onsetCount: number;
}

/**
 * Rhythmic preservation modes.
 */
export type RhythmicPreservationMode =
  | 'exact_timing'      // Every onset at same position
  | 'grid_aligned'      // Onsets on same grid positions (quantized)
  | 'pattern_same'      // Same pattern of strong/weak beats
  | 'feel_same'         // Same rhythmic feel (swing, groove)
  | 'density_same'      // Same note density
  | 'loose';            // Just keep a similar rhythmic character

/**
 * Tolerance specification for rhythmic comparison.
 */
export interface RhythmicTolerance {
  /** Maximum onset position deviation (in beats) */
  readonly maxOnsetDeviation: number;

  /** Maximum duration ratio deviation */
  readonly maxDurationDeviation: number;

  /** Maximum swing deviation */
  readonly maxSwingDeviation: number;

  /** Minimum onset overlap ratio for "same rhythm" */
  readonly minOnsetOverlap: number;

  /** Whether to use DTW (Dynamic Time Warping) for flexible matching */
  readonly useDTW: boolean;
}

/**
 * Default rhythmic tolerances per preservation mode.
 */
export const RHYTHMIC_TOLERANCES: ReadonlyMap<RhythmicPreservationMode, RhythmicTolerance> = new Map([
  ['exact_timing', { maxOnsetDeviation: 0.001, maxDurationDeviation: 0.001, maxSwingDeviation: 0, minOnsetOverlap: 1.0, useDTW: false }],
  ['grid_aligned', { maxOnsetDeviation: 0.05, maxDurationDeviation: 0.05, maxSwingDeviation: 0.05, minOnsetOverlap: 0.95, useDTW: false }],
  ['pattern_same', { maxOnsetDeviation: 0.1, maxDurationDeviation: 0.15, maxSwingDeviation: 0.1, minOnsetOverlap: 0.85, useDTW: false }],
  ['feel_same', { maxOnsetDeviation: 0.15, maxDurationDeviation: 0.2, maxSwingDeviation: 0.15, minOnsetOverlap: 0.7, useDTW: true }],
  ['density_same', { maxOnsetDeviation: 0.3, maxDurationDeviation: 0.3, maxSwingDeviation: 0.3, minOnsetOverlap: 0.5, useDTW: true }],
  ['loose', { maxOnsetDeviation: 0.5, maxDurationDeviation: 0.5, maxSwingDeviation: 0.5, minOnsetOverlap: 0.3, useDTW: true }],
]);

/**
 * Map "keep rhythm" phrases to preservation modes.
 */
export const RHYTHMIC_PRESERVATION_MAPPINGS: readonly {
  readonly phrase: string;
  readonly mode: RhythmicPreservationMode;
  readonly confidence: number;
}[] = [
  { phrase: 'keep the exact rhythm', mode: 'exact_timing', confidence: 0.95 },
  { phrase: 'keep the rhythm', mode: 'pattern_same', confidence: 0.85 },
  { phrase: 'keep the timing', mode: 'grid_aligned', confidence: 0.9 },
  { phrase: 'keep the groove', mode: 'feel_same', confidence: 0.85 },
  { phrase: 'keep the feel', mode: 'feel_same', confidence: 0.8 },
  { phrase: 'keep the pattern', mode: 'pattern_same', confidence: 0.85 },
  { phrase: 'keep the swing', mode: 'feel_same', confidence: 0.85 },
  { phrase: 'keep the rhythmic feel', mode: 'feel_same', confidence: 0.85 },
  { phrase: 'keep the beat', mode: 'pattern_same', confidence: 0.85 },
  { phrase: 'keep the pocket', mode: 'feel_same', confidence: 0.8 },
  { phrase: 'same density', mode: 'density_same', confidence: 0.85 },
  { phrase: 'roughly the same rhythm', mode: 'loose', confidence: 0.8 },
];


// =============================================================================
// STEP 170: ARRANGEMENT IDENTITY — instrumentation, roles, layers
// =============================================================================

/**
 * An arrangement identity fingerprint.
 */
export interface ArrangementFingerprint {
  /** List of instruments/sounds used */
  readonly instruments: readonly InstrumentEntry[];

  /** Musical roles assigned */
  readonly roles: readonly RoleAssignment[];

  /** Layer structure */
  readonly layers: readonly LayerEntry[];

  /** Section structure */
  readonly sections: readonly SectionEntry[];

  /** Total layer count */
  readonly layerCount: number;

  /** Total section count */
  readonly sectionCount: number;
}

/**
 * An instrument entry in the arrangement.
 */
export interface InstrumentEntry {
  /** Instrument name/type */
  readonly name: string;

  /** Instrument category */
  readonly category: InstrumentCategory;

  /** Which layer this instrument is on */
  readonly layerRef: string;

  /** Whether this instrument is essential to the arrangement */
  readonly essential: boolean;
}

/**
 * Instrument categories.
 */
export type InstrumentCategory =
  | 'drums'
  | 'bass'
  | 'keys'
  | 'guitar'
  | 'strings'
  | 'brass'
  | 'woodwinds'
  | 'vocals'
  | 'synth'
  | 'percussion'
  | 'fx'
  | 'pad'
  | 'lead'
  | 'other';

/**
 * A musical role assignment.
 */
export interface RoleAssignment {
  /** Role name */
  readonly role: MusicalRole;

  /** Which instrument fills this role */
  readonly instrumentRef: string;

  /** Which layer */
  readonly layerRef: string;

  /** Whether this role is the primary or supporting */
  readonly primary: boolean;
}

/**
 * Musical roles.
 */
export type MusicalRole =
  | 'melody'
  | 'counter_melody'
  | 'harmony'
  | 'bass_line'
  | 'rhythm_section'
  | 'lead'
  | 'accompaniment'
  | 'pad'
  | 'effect'
  | 'percussion'
  | 'backing_vocal'
  | 'lead_vocal'
  | 'solo'
  | 'fill'
  | 'drone'
  | 'texture';

/**
 * A layer entry in the arrangement.
 */
export interface LayerEntry {
  /** Layer ID */
  readonly layerId: string;

  /** Layer name */
  readonly name: string;

  /** Layer type */
  readonly layerType: 'audio' | 'midi' | 'bus' | 'aux';

  /** Instrument on this layer */
  readonly instrumentRef: string | null;

  /** Musical role */
  readonly role: MusicalRole | null;

  /** Whether this layer is active/unmuted */
  readonly active: boolean;
}

/**
 * A section entry in the arrangement.
 */
export interface SectionEntry {
  /** Section ID */
  readonly sectionId: string;

  /** Section name (verse, chorus, bridge, etc.) */
  readonly name: string;

  /** Section type */
  readonly sectionType: SectionType;

  /** Start position (in bars) */
  readonly startBar: number;

  /** Length (in bars) */
  readonly lengthBars: number;

  /** Which layers are active in this section */
  readonly activeLayers: readonly string[];
}

/**
 * Section types.
 */
export type SectionType =
  | 'intro'
  | 'verse'
  | 'pre_chorus'
  | 'chorus'
  | 'post_chorus'
  | 'bridge'
  | 'breakdown'
  | 'build'
  | 'drop'
  | 'outro'
  | 'interlude'
  | 'solo'
  | 'coda'
  | 'tag'
  | 'transition'
  | 'other';

/**
 * Arrangement preservation modes.
 * These are distinct constraint types for "keep instrumentation" vs "keep roles" vs "keep layers."
 */
export type ArrangementPreservationMode =
  | 'exact_arrangement'     // Everything identical (layers, instruments, sections)
  | 'keep_instrumentation'  // Same instruments (but layers may change)
  | 'keep_roles'            // Same musical roles (but instruments may change)
  | 'keep_layers'           // Same layer structure (but content may change)
  | 'keep_sections'         // Same section structure
  | 'keep_density'          // Same number of active layers per section
  | 'keep_energy_curve';    // Same energy/loudness trajectory across sections

/**
 * Map "keep arrangement" phrases to preservation modes.
 */
export const ARRANGEMENT_PRESERVATION_MAPPINGS: readonly {
  readonly phrase: string;
  readonly mode: ArrangementPreservationMode;
  readonly confidence: number;
}[] = [
  { phrase: 'keep the arrangement', mode: 'exact_arrangement', confidence: 0.85 },
  { phrase: 'keep the instrumentation', mode: 'keep_instrumentation', confidence: 0.95 },
  { phrase: 'keep the same instruments', mode: 'keep_instrumentation', confidence: 0.95 },
  { phrase: 'keep the roles', mode: 'keep_roles', confidence: 0.9 },
  { phrase: 'keep the musical roles', mode: 'keep_roles', confidence: 0.9 },
  { phrase: 'keep who plays what', mode: 'keep_roles', confidence: 0.85 },
  { phrase: 'keep the layers', mode: 'keep_layers', confidence: 0.9 },
  { phrase: 'keep the tracks', mode: 'keep_layers', confidence: 0.9 },
  { phrase: 'keep the same number of layers', mode: 'keep_density', confidence: 0.85 },
  { phrase: 'keep the sections', mode: 'keep_sections', confidence: 0.9 },
  { phrase: 'keep the structure', mode: 'keep_sections', confidence: 0.85 },
  { phrase: 'keep the form', mode: 'keep_sections', confidence: 0.85 },
  { phrase: 'keep the song structure', mode: 'keep_sections', confidence: 0.9 },
  { phrase: 'keep the energy curve', mode: 'keep_energy_curve', confidence: 0.85 },
  { phrase: 'keep the dynamics arc', mode: 'keep_energy_curve', confidence: 0.85 },
  { phrase: 'keep the density', mode: 'keep_density', confidence: 0.85 },
];


// =============================================================================
// IDENTITY COMPARISON UTILITIES
// =============================================================================

/**
 * Compare two sequences using a simple correlation-like metric.
 * Returns a value in [0, 1] where 1 = identical.
 */
function computeSequenceSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  // Use the shorter sequence as reference
  const maxLen = Math.max(a.length, b.length);
  const minLen = Math.min(a.length, b.length);

  // Length similarity component
  const lengthSim = minLen / maxLen;

  // Element-wise similarity (up to minLen)
  let matches = 0;
  for (let i = 0; i < minLen; i++) {
    const ai = a[i];
    const bi = b[i];
    if (ai !== undefined && bi !== undefined && ai === bi) {
      matches++;
    }
  }
  const elementSim = minLen > 0 ? matches / minLen : 0;

  return (lengthSim * 0.3 + elementSim * 0.7);
}

/**
 * Compute onset overlap between two onset sequences.
 * Both should be normalized to [0, 1] range.
 */
function computeOnsetOverlap(
  a: readonly number[],
  b: readonly number[],
  tolerance: number = 0.05,
): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  let matched = 0;
  const usedB = new Set<number>();

  for (const onsetA of a) {
    for (let j = 0; j < b.length; j++) {
      const onsetB = b[j];
      if (onsetB !== undefined && !usedB.has(j) && Math.abs(onsetA - onsetB) <= tolerance) {
        matched++;
        usedB.add(j);
        break;
      }
    }
  }

  const maxOnsets = Math.max(a.length, b.length);
  return maxOnsets > 0 ? matched / maxOnsets : 0;
}


// =============================================================================
// IDENTITY TYPE REGISTRY — what kinds of identity checks are available
// =============================================================================

/**
 * Registry of identity types and their validators.
 */
export interface IdentityTypeEntry {
  /** Identity type name */
  readonly name: string;

  /** Description */
  readonly description: string;

  /** Which steps created this */
  readonly step: number;

  /** Preservation modes supported */
  readonly supportedModes: readonly PreservationMode[];

  /** How to fingerprint this identity */
  readonly fingerprintMethod: string;

  /** What phrases trigger this identity type */
  readonly triggerPhrases: readonly string[];
}

/**
 * Registry of all identity types.
 */
export const IDENTITY_TYPE_REGISTRY: readonly IdentityTypeEntry[] = [
  {
    name: 'motif_identity',
    description: 'Melodic motif identity via interval/contour/rhythm fingerprint',
    step: 167,
    supportedModes: ['exact', 'functional', 'recognizable'],
    fingerprintMethod: 'MotifFingerprint',
    triggerPhrases: ['keep the melody', 'keep the motif', 'keep the tune', 'keep the hook', 'keep the riff'],
  },
  {
    name: 'harmonic_identity',
    description: 'Harmonic identity via chord skeleton tiers',
    step: 168,
    supportedModes: ['exact', 'functional', 'recognizable'],
    fingerprintMethod: 'HarmonicFingerprint',
    triggerPhrases: ['keep the chords', 'keep the harmony', 'keep the progression', 'keep the changes'],
  },
  {
    name: 'rhythmic_identity',
    description: 'Rhythmic identity via onset grid and tolerance',
    step: 169,
    supportedModes: ['exact', 'functional', 'recognizable'],
    fingerprintMethod: 'RhythmicFingerprint',
    triggerPhrases: ['keep the rhythm', 'keep the groove', 'keep the timing', 'keep the beat', 'keep the pattern'],
  },
  {
    name: 'arrangement_identity',
    description: 'Arrangement identity: instrumentation, roles, layers, sections',
    step: 170,
    supportedModes: ['exact', 'functional', 'recognizable'],
    fingerprintMethod: 'ArrangementFingerprint',
    triggerPhrases: ['keep the arrangement', 'keep the instrumentation', 'keep the layers', 'keep the structure', 'keep the roles'],
  },
];

/**
 * Look up which identity type a phrase triggers.
 */
export function lookupIdentityType(phrase: string): IdentityTypeEntry | null {
  const normalized = phrase.toLowerCase();
  for (const entry of IDENTITY_TYPE_REGISTRY) {
    for (const trigger of entry.triggerPhrases) {
      if (normalized.includes(trigger)) {
        return entry;
      }
    }
  }
  return null;
}


// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a preservation mode spec as a report.
 */
export function formatPreservationModeReport(mode: PreservationMode): string {
  const spec = getPreservationModeSpec(mode);
  const lines: string[] = [
    `=== Preservation Mode: ${spec.name} ===`,
    spec.description,
    '',
    'Required identity:',
  ];
  for (const dim of spec.requiredIdentity) {
    lines.push(`  ${dim.name}: ${dim.description} (min: ${dim.minSimilarity})`);
  }
  if (spec.allowedVariation.length > 0) {
    lines.push('', 'Allowed variation:');
    for (const v of spec.allowedVariation) {
      lines.push(`  ${v.dimension}: ${v.description}`);
    }
  }
  lines.push('', 'Validation checks:');
  for (const check of spec.validationChecks) {
    lines.push(`  ${check.name}: ${check.description} (threshold: ${check.passThreshold}, severity: ${check.failSeverity})`);
  }
  return lines.join('\n');
}

/**
 * Format a motif similarity result.
 */
export function formatMotifSimilarity(result: MotifSimilarityResult): string {
  return [
    `Motif Similarity: ${(result.overallSimilarity * 100).toFixed(1)}% (${result.preservationLevel})`,
    `  Interval: ${(result.intervalSimilarity * 100).toFixed(1)}%`,
    `  Contour:  ${(result.contourSimilarity * 100).toFixed(1)}%`,
    `  Rhythm:   ${(result.rhythmSimilarity * 100).toFixed(1)}%`,
    `  Range:    ${(result.pitchRangeSimilarity * 100).toFixed(1)}%`,
    `  Count:    ${(result.noteCountSimilarity * 100).toFixed(1)}%`,
    `  Recognizable: ${result.isRecognizable ? 'YES' : 'NO'}`,
  ].join('\n');
}
