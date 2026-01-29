/**
 * @fileoverview MusicSpec - Canonical Music Specification Types for Branch C
 * 
 * Provides the core `MusicSpec` type and related constraint types that form
 * the bridge between UI card parameters and Prolog knowledge base queries.
 * 
 * The MusicSpec represents a "musical intent" that can be:
 * 1. Serialized to Prolog facts for querying/reasoning
 * 2. Edited via UI cards (TonalityModelCard, SchemaCard, etc.)
 * 3. Round-tripped between TS and Prolog without loss
 * 
 * Design follows currentsteps-branchC.md Phase C0/C1 specifications.
 * 
 * @module @cardplay/ai/theory/music-spec
 */

// ============================================================================
// CANONICAL NAMING (C007-C011)
// ============================================================================

/**
 * Canonical root names for keys/chords using lowercase with 'sharp'/'flat' suffix.
 * Matches Prolog `note/1` atoms exactly.
 */
export type RootName =
  | 'c' | 'csharp' | 'd' | 'dsharp' | 'e' | 'f' 
  | 'fsharp' | 'g' | 'gsharp' | 'a' | 'asharp' | 'b'
  | 'dflat' | 'eflat' | 'gflat' | 'aflat' | 'bflat';

/**
 * C007: Canonical mode names across TS + Prolog.
 * Western modes + scale types from music-theory.pl
 */
export type ModeName =
  // Western church modes
  | 'major' | 'ionian' | 'dorian' | 'phrygian' | 'lydian'
  | 'mixolydian' | 'aeolian' | 'locrian'
  // Minor variants
  | 'natural_minor' | 'harmonic_minor' | 'melodic_minor'
  // Pentatonic/blues
  | 'pentatonic_major' | 'pentatonic_minor' | 'blues'
  // Symmetric
  | 'whole_tone' | 'chromatic' | 'octatonic';

/**
 * C008: Canonical chord quality taxonomy.
 */
export type ChordQuality =
  // Triads
  | 'major' | 'minor' | 'diminished' | 'augmented'
  | 'sus2' | 'sus4'
  // Sevenths
  | 'major7' | 'minor7' | 'dominant7' | 'diminished7' | 'half_diminished7'
  // Extended
  | 'major9' | 'minor9' | 'dominant9' | 'add9'
  | 'major11' | 'minor11' | 'dominant11'
  | 'major13' | 'minor13' | 'dominant13';

/**
 * C010: Culture tag enum for world music styles.
 */
export type CultureTag =
  | 'western'
  | 'carnatic'
  | 'celtic'
  | 'chinese'
  | 'hybrid';

/**
 * C011: Style tag enum for compositional styles.
 */
export type StyleTag =
  // Historical Western
  | 'galant' | 'baroque' | 'classical' | 'romantic'
  // Modern Western
  | 'cinematic' | 'trailer' | 'underscore'
  | 'edm' | 'pop' | 'jazz' | 'lofi'
  // World substyles handled via CultureTag
  | 'custom';

/**
 * C012: Tonality model selection for key detection/scoring.
 */
export type TonalityModel =
  | 'ks_profile'     // Krumhansl-Schmuckler key profiles
  | 'dft_phase'      // DFT phase estimation (k=1 component)
  | 'spiral_array';  // Chew's Spiral Array 3D embedding

// ============================================================================
// CONSTRAINT TYPES (C013-C019)
// ============================================================================

/**
 * C014: Galant schema names (matches galant_schema/1 facts).
 */
export type GalantSchemaName =
  | 'prinner' | 'fonte' | 'monte' | 'romanesca' | 'meyer'
  | 'quiescenza' | 'do_re_mi' | 'cadential_64' | 'lament_bass'
  | 'ponte' | 'passo_indietro' | 'circolo' | 'indugio';

/**
 * C015: Ornament types (cross-cultural).
 */
export type OrnamentType =
  // Western
  | 'grace' | 'mordent' | 'trill' | 'turn' | 'appoggiatura'
  // Celtic
  | 'cut' | 'tap' | 'roll' | 'slide' | 'cran' | 'birl'
  // Carnatic
  | 'kampita' | 'nokku' | 'jaaru' | 'sphurita' | 'pratyahatam'
  // Chinese
  | 'hua' | 'yao' | 'hua_yin' | 'tremolo';

/**
 * C016: Meter accent model types.
 */
export type AccentModel =
  | 'standard'       // Strong/weak based on position
  | 'compound'       // 6/8, 9/8, 12/8 groupings
  | 'swing'          // Jazz swing feel
  | 'celtic_dance'   // Dance lift accents
  | 'carnatic_tala'; // Tala-based accents

/**
 * C017: Carnatic tala names.
 */
export type TalaName =
  | 'adi' | 'rupaka' | 'misra_chapu' | 'khanda_chapu'
  | 'jhampa' | 'triputa' | 'ata' | 'eka';

/**
 * C017: Carnatic jati (laghu beat count variant).
 */
export type JatiType =
  | 'tisra' | 'chatusra' | 'khanda' | 'misra' | 'sankeerna';

/**
 * C018: Celtic tune types.
 */
export type CelticTuneType =
  | 'reel' | 'jig' | 'slip_jig' | 'hornpipe' | 'strathspey'
  | 'polka' | 'march' | 'air';

/**
 * C019: Chinese pentatonic mode names.
 */
export type ChineseModeName =
  | 'gong' | 'shang' | 'jiao' | 'zhi' | 'yu';

/**
 * Carnatic raga names (subset).
 */
export type RagaName =
  | 'mohanam' | 'hamsadhwani' | 'kalyani' | 'keeravani'
  | 'shankarabharanam' | 'hindolam' | 'abhogi'
  | 'todi' | 'bhairavi' | 'kambhoji';

// ============================================================================
// CONSTRAINT DISCRIMINATED UNION (C052)
// ============================================================================

/**
 * Base constraint with common properties.
 */
interface ConstraintBase {
  readonly type: string;
  /** Whether this is a hard requirement or soft preference */
  readonly hard: boolean;
  /** Weight for soft constraints (0-1) */
  readonly weight?: number;
}

/** Key constraint */
export interface ConstraintKey extends ConstraintBase {
  readonly type: 'key';
  readonly root: RootName;
  readonly mode: ModeName;
}

/** Tempo constraint */
export interface ConstraintTempo extends ConstraintBase {
  readonly type: 'tempo';
  readonly bpm: number;
  readonly tolerance?: number; // +/- bpm range
}

/** Meter constraint */
export interface ConstraintMeter extends ConstraintBase {
  readonly type: 'meter';
  readonly numerator: number;
  readonly denominator: number;
}

/** Tonality model constraint */
export interface ConstraintTonalityModel extends ConstraintBase {
  readonly type: 'tonality_model';
  readonly model: TonalityModel;
}

/** Style constraint */
export interface ConstraintStyle extends ConstraintBase {
  readonly type: 'style';
  readonly style: StyleTag;
}

/** Culture constraint */
export interface ConstraintCulture extends ConstraintBase {
  readonly type: 'culture';
  readonly culture: CultureTag;
}

/** Galant schema constraint */
export interface ConstraintSchema extends ConstraintBase {
  readonly type: 'schema';
  readonly schema: GalantSchemaName;
}

/** Carnatic raga constraint */
export interface ConstraintRaga extends ConstraintBase {
  readonly type: 'raga';
  readonly raga: RagaName;
}

/** Carnatic tala constraint */
export interface ConstraintTala extends ConstraintBase {
  readonly type: 'tala';
  readonly tala: TalaName;
  readonly jati?: JatiType;
}

/** Celtic tune type constraint */
export interface ConstraintCelticTune extends ConstraintBase {
  readonly type: 'celtic_tune';
  readonly tuneType: CelticTuneType;
}

/** Chinese mode constraint */
export interface ConstraintChineseMode extends ConstraintBase {
  readonly type: 'chinese_mode';
  readonly mode: ChineseModeName;
  readonly includeBian?: boolean; // Include bian (extra) tones
}

/** Film mood constraint */
export interface ConstraintFilmMood extends ConstraintBase {
  readonly type: 'film_mood';
  readonly mood: FilmMood;
}

/** Film device constraint */
export interface ConstraintFilmDevice extends ConstraintBase {
  readonly type: 'film_device';
  readonly device: FilmDevice;
}

/** Phrase density constraint */
export interface ConstraintPhraseDensity extends ConstraintBase {
  readonly type: 'phrase_density';
  readonly density: 'sparse' | 'medium' | 'dense';
}

/** Melodic contour constraint */
export interface ConstraintContour extends ConstraintBase {
  readonly type: 'contour';
  readonly contour: 'ascending' | 'descending' | 'arch' | 'inverted_arch' | 'level';
}

/** GTTM grouping sensitivity constraint */
export interface ConstraintGrouping extends ConstraintBase {
  readonly type: 'grouping';
  readonly sensitivity: number; // 0-1, lower = fewer segments
}

/** Meter accent model constraint */
export interface ConstraintAccent extends ConstraintBase {
  readonly type: 'accent';
  readonly model: AccentModel;
}

/** Gamaka (ornament) density constraint for Carnatic */
export interface ConstraintGamakaDensity extends ConstraintBase {
  readonly type: 'gamaka_density';
  readonly density: 'light' | 'medium' | 'heavy';
}

/** Ornament budget constraint */
export interface ConstraintOrnamentBudget extends ConstraintBase {
  readonly type: 'ornament_budget';
  readonly maxPerBeat: number;
}

/** Harmonic rhythm constraint */
export interface ConstraintHarmonicRhythm extends ConstraintBase {
  readonly type: 'harmonic_rhythm';
  readonly changesPerBar: number;
}

/** Cadence type constraint */
export interface ConstraintCadence extends ConstraintBase {
  readonly type: 'cadence';
  readonly cadenceType: CadenceType;
}

/**
 * Film moods (from music-theory-film.pl).
 */
export type FilmMood =
  | 'heroic' | 'ominous' | 'tender' | 'wonder'
  | 'mystery' | 'sorrow' | 'comedy' | 'action';

/**
 * Film devices (from music-theory-film.pl).
 */
export type FilmDevice =
  | 'pedal_point' | 'drone' | 'ostinato' | 'planing'
  | 'chromatic_mediant' | 'modal_mixture' | 'lydian_tonic'
  | 'dorian_minor' | 'phrygian_color' | 'whole_tone_wash'
  | 'octatonic_action' | 'cluster_tension' | 'quartal_openness'
  | 'suspension_chain' | 'cadence_deferral' | 'trailer_rise';

/**
 * Cadence type names.
 */
export type CadenceType =
  | 'authentic' | 'perfect_authentic' | 'imperfect_authentic'
  | 'half' | 'plagal' | 'deceptive';

// ============================================================================
// C031-C047: ADDITIONAL CANONICAL REPRESENTATIONS
// ============================================================================

/**
 * C031: Voice representation for multi-voice schemata and arranger patterns.
 */
export type VoiceRole =
  | 'melody' | 'countermelody' | 'bass' | 'pad'
  | 'ostinato' | 'drone' | 'percussion' | 'fill';

/**
 * C032: Register model (octave ranges) for each board context.
 */
export interface RegisterModel {
  readonly low: number;   // MIDI note number for lowest
  readonly high: number;  // MIDI note number for highest
  readonly sweet: [number, number]; // Optimal range
}

/**
 * C033: Density model (events per beat, per voice).
 */
export type DensityLevel = 'sparse' | 'medium' | 'dense' | 'very_dense';

/**
 * C034: Tension model beyond diatonic degrees.
 */
export type TensionDevice =
  | 'diatonic' | 'chromatic_mediant' | 'modal_mixture'
  | 'tritone_sub' | 'augmented_sixth' | 'neapolitan';

/**
 * C035: Cadence model beyond V-I.
 */
export type ExtendedCadenceType =
  | CadenceType
  | 'phrygian_half' | 'picardy' | 'backdoor'  // Western extended
  | 'galant_meyer' | 'galant_quiescenza'        // Galant
  | 'modal_bvii_i' | 'modal_iv_i'              // Modal
  | 'cinematic_bvi_bvii_i'                       // Film
  | 'carnatic_arudi';                            // Carnatic

/**
 * C036: Harmonic rhythm model.
 */
export type HarmonicRhythmLevel = 'very_slow' | 'slow' | 'moderate' | 'fast' | 'very_fast';

/**
 * C037: Melodic contour vocabulary (shared by GTTM + melody generator).
 */
export type MelodicContour =
  | 'ascending' | 'descending' | 'arch' | 'inverted_arch'
  | 'level' | 'zigzag' | 'sawtooth' | 'wave';

/**
 * C038: Motivic identity representation (interval/rhythm fingerprint).
 */
export interface MotifFingerprint {
  readonly intervals: readonly number[];  // Semitone intervals
  readonly rhythmRatios: readonly number[];  // Duration ratios
  readonly label?: string;
}

/**
 * C043: Articulation vocabulary.
 */
export type Articulation =
  | 'staccato' | 'legato' | 'tenuto' | 'marcato'
  | 'accent' | 'portato' | 'spiccato' | 'pizzicato'
  | 'tremolo' | 'glissando' | 'sforzando';

/**
 * C044: Instrument family roles vocabulary.
 */
export type InstrumentFamily =
  | 'strings' | 'brass' | 'woodwinds' | 'choir'
  | 'synths' | 'percussion' | 'piano' | 'guitar'
  | 'harp' | 'organ' | 'erhu' | 'dizi' | 'guzheng'
  | 'pipa' | 'guqin' | 'sheng' | 'suona'
  | 'fiddle' | 'flute' | 'whistle' | 'pipes'
  | 'bouzouki' | 'bodhran' | 'mridangam' | 'tabla';

/**
 * C045: Arranger style taxonomy hooks.
 */
export type ArrangerStyle =
  | 'cinematic' | 'trailer' | 'underscore'
  | 'orchestral' | 'ambient' | 'edm'
  | 'pop_band' | 'jazz_combo' | 'chamber';

/**
 * C046: Phrase type taxonomy.
 */
export type PhraseType =
  | 'pickup' | 'cadence' | 'fill' | 'turnaround'
  | 'response' | 'sequence' | 'development' | 'head'
  | 'bridge' | 'coda' | 'intro' | 'outro';

/**
 * C047: Tracker pattern role taxonomy.
 */
export type PatternRole =
  | 'groove' | 'fill' | 'break' | 'build'
  | 'transition' | 'intro_pattern' | 'outro_pattern'
  | 'drop' | 'breakdown';

// ============================================================================
// ADDITIONAL CONSTRAINT INTERFACES (C411, C510-C513, etc.)
// ============================================================================

/** Trailer build constraint (C411) */
export interface ConstraintTrailerBuild extends ConstraintBase {
  readonly type: 'trailer_build';
  readonly buildBars: number;         // Length of build in bars
  readonly hitCount: number;          // Number of hit points
  readonly percussionDensity: DensityLevel;
}

/** Leitmotif constraint (C228-C229) */
export interface ConstraintLeitmotif extends ConstraintBase {
  readonly type: 'leitmotif';
  readonly motifId: string;
  readonly transformOp?: 'augmentation' | 'diminution' | 'inversion' | 'retrograde' | 'reharmonize';
}

/** Drone constraint (C511) */
export interface ConstraintDrone extends ConstraintBase {
  readonly type: 'drone';
  readonly droneTones: readonly RootName[];
  readonly droneStyle: 'sustained' | 'pulsing' | 'sruti_box' | 'pipes' | 'open_strings';
}

/** Pattern role constraint (C873-C874) */
export interface ConstraintPatternRole extends ConstraintBase {
  readonly type: 'pattern_role';
  readonly role: PatternRole;
}

/** Swing amount constraint */
export interface ConstraintSwing extends ConstraintBase {
  readonly type: 'swing';
  readonly amount: number;  // 0 (straight) to 1 (full shuffle)
}

/** Heterophony constraint (C789) */
export interface ConstraintHeterophony extends ConstraintBase {
  readonly type: 'heterophony';
  readonly voiceCount: number;
  readonly variationDepth: 'subtle' | 'moderate' | 'free';
  readonly timingSpread: number;  // 0-1, how much timing varies between voices
}

/** Max interval constraint */
export interface ConstraintMaxInterval extends ConstraintBase {
  readonly type: 'max_interval';
  readonly semitones: number;
}

/** Arranger style constraint */
export interface ConstraintArrangerStyle extends ConstraintBase {
  readonly type: 'arranger_style';
  readonly style: ArrangerStyle;
}

/** Scene arc constraint */
export interface ConstraintSceneArc extends ConstraintBase {
  readonly type: 'scene_arc';
  readonly arcType: 'rising_action' | 'tension_release' | 'slow_burn' | 'bookend' | 'stinger';
}

/**
 * C052: Discriminated union of all constraint types.
 */
export type MusicConstraint =
  | ConstraintKey
  | ConstraintTempo
  | ConstraintMeter
  | ConstraintTonalityModel
  | ConstraintStyle
  | ConstraintCulture
  | ConstraintSchema
  | ConstraintRaga
  | ConstraintTala
  | ConstraintCelticTune
  | ConstraintChineseMode
  | ConstraintFilmMood
  | ConstraintFilmDevice
  | ConstraintPhraseDensity
  | ConstraintContour
  | ConstraintGrouping
  | ConstraintAccent
  | ConstraintGamakaDensity
  | ConstraintOrnamentBudget
  | ConstraintHarmonicRhythm
  | ConstraintCadence
  | ConstraintTrailerBuild
  | ConstraintLeitmotif
  | ConstraintDrone
  | ConstraintPatternRole
  | ConstraintSwing
  | ConstraintHeterophony
  | ConstraintMaxInterval
  | ConstraintArrangerStyle
  | ConstraintSceneArc
  | ConstraintCustom;

/**
 * Custom constraint for user-defined constraint types.
 * The type field must be namespaced (e.g., 'custom:my_constraint' or 'user:xyz').
 * Use the constraintRegistry from custom-constraints.ts to register handlers.
 */
export interface ConstraintCustom extends ConstraintBase {
  readonly type: `custom:${string}` | `${string}:${string}`;
  readonly params: Record<string, unknown>;
}

// ============================================================================
// MUSIC SPEC (C051)
// ============================================================================

/**
 * C051: The canonical `MusicSpec` type aligned with Prolog `music_spec/7`.
 * 
 * Represents a complete musical context/intent that can be:
 * - Edited via UI cards
 * - Serialized to Prolog facts
 * - Used to constrain generators and analyzers
 * 
 * The spec is immutable; use helper functions to derive modified specs.
 */
export interface MusicSpec {
  /** Key root note */
  readonly keyRoot: RootName;
  
  /** Mode/scale type */
  readonly mode: ModeName;
  
  /** Meter numerator (beats per bar) */
  readonly meterNumerator: number;
  
  /** Meter denominator (beat unit) */
  readonly meterDenominator: number;
  
  /** Tempo in BPM */
  readonly tempo: number;
  
  /** Preferred tonality detection model */
  readonly tonalityModel: TonalityModel;
  
  /** Compositional style tag */
  readonly style: StyleTag;
  
  /** Cultural context */
  readonly culture: CultureTag;
  
  /** Additional constraints (soft and hard) */
  readonly constraints: readonly MusicConstraint[];
}

/**
 * Default MusicSpec values for Western pop/cinematic context.
 */
export const DEFAULT_MUSIC_SPEC: MusicSpec = {
  keyRoot: 'c',
  mode: 'major',
  meterNumerator: 4,
  meterDenominator: 4,
  tempo: 120,
  tonalityModel: 'ks_profile',
  style: 'cinematic',
  culture: 'western',
  constraints: [],
};

// ============================================================================
// EXPLAINABLE TYPE (C061)
// ============================================================================

/**
 * C061: Wrapper for values that come with explanations and confidence.
 * Used for Prolog query results that provide reasoning.
 */
export interface Explainable<T> {
  /** The actual value */
  readonly value: T;
  
  /** Human-readable reasons explaining why this value was chosen */
  readonly reasons: readonly string[];
  
  /** Confidence score 0-100 */
  readonly confidence: number;
}

/**
 * Create an explainable value.
 */
export function explainable<T>(
  value: T,
  reasons: readonly string[] = [],
  confidence: number = 100
): Explainable<T> {
  return { value, reasons, confidence };
}

// ============================================================================
// SPEC BUILDERS
// ============================================================================

/**
 * Create a new MusicSpec with partial overrides.
 */
export function createMusicSpec(overrides: Partial<MusicSpec> = {}): MusicSpec {
  return { ...DEFAULT_MUSIC_SPEC, ...overrides };
}

/**
 * Add constraints to a MusicSpec.
 */
export function withConstraints(
  spec: MusicSpec,
  ...newConstraints: MusicConstraint[]
): MusicSpec {
  return {
    ...spec,
    constraints: [...spec.constraints, ...newConstraints],
  };
}

/**
 * Remove constraints of a specific type from a MusicSpec.
 */
export function withoutConstraintType(
  spec: MusicSpec,
  constraintType: MusicConstraint['type']
): MusicSpec {
  return {
    ...spec,
    constraints: spec.constraints.filter(c => c.type !== constraintType),
  };
}

/**
 * Update the key of a MusicSpec.
 */
export function withKey(spec: MusicSpec, root: RootName, mode: ModeName): MusicSpec {
  return { ...spec, keyRoot: root, mode };
}

/**
 * Update the meter of a MusicSpec.
 */
export function withMeter(
  spec: MusicSpec,
  numerator: number,
  denominator: number
): MusicSpec {
  return { ...spec, meterNumerator: numerator, meterDenominator: denominator };
}

/**
 * Update the tempo of a MusicSpec.
 */
export function withTempo(spec: MusicSpec, tempo: number): MusicSpec {
  return { ...spec, tempo };
}

/**
 * Update culture and automatically adjust style if needed.
 */
export function withCulture(spec: MusicSpec, culture: CultureTag): MusicSpec {
  return { ...spec, culture };
}

/**
 * Update style.
 */
export function withStyle(spec: MusicSpec, style: StyleTag): MusicSpec {
  return { ...spec, style };
}

// ============================================================================
// CONSTRAINT HELPERS
// ============================================================================

/**
 * Create a hard key constraint.
 */
export function keyConstraint(root: RootName, mode: ModeName): ConstraintKey {
  return { type: 'key', hard: true, root, mode };
}

/**
 * Create a tempo constraint.
 */
export function tempoConstraint(bpm: number, tolerance?: number): ConstraintTempo {
  return tolerance !== undefined
    ? { type: 'tempo', hard: true, bpm, tolerance }
    : { type: 'tempo', hard: true, bpm };
}

/**
 * Create a schema constraint.
 */
export function schemaConstraint(schema: GalantSchemaName, hard = false, weight = 0.7): ConstraintSchema {
  return { type: 'schema', hard, weight, schema };
}

/**
 * Create a raga constraint.
 */
export function ragaConstraint(raga: RagaName): ConstraintRaga {
  return { type: 'raga', hard: true, raga };
}

/**
 * Create a tala constraint.
 */
export function talaConstraint(tala: TalaName, jati?: JatiType): ConstraintTala {
  return jati !== undefined
    ? { type: 'tala', hard: true, tala, jati }
    : { type: 'tala', hard: true, tala };
}

/**
 * Create a Celtic tune type constraint.
 */
export function celticTuneConstraint(tuneType: CelticTuneType): ConstraintCelticTune {
  return { type: 'celtic_tune', hard: true, tuneType };
}

/**
 * Create a Chinese mode constraint.
 */
export function chineseModeConstraint(mode: ChineseModeName, includeBian = false): ConstraintChineseMode {
  return { type: 'chinese_mode', hard: true, mode, includeBian };
}

/**
 * Create a film mood constraint.
 */
export function filmMoodConstraint(mood: FilmMood, hard = false, weight = 0.8): ConstraintFilmMood {
  return { type: 'film_mood', hard, weight, mood };
}

/**
 * Create a film device constraint.
 */
export function filmDeviceConstraint(device: FilmDevice, hard = false, weight = 0.6): ConstraintFilmDevice {
  return { type: 'film_device', hard, weight, device };
}

/**
 * Create a GTTM grouping sensitivity constraint.
 */
export function groupingConstraint(sensitivity: number): ConstraintGrouping {
  return { type: 'grouping', hard: false, weight: 0.5, sensitivity: Math.max(0, Math.min(1, sensitivity)) };
}

/**
 * Get all constraints of a specific type from a spec.
 */
export function getConstraintsOfType<T extends MusicConstraint['type']>(
  spec: MusicSpec,
  type: T
): Extract<MusicConstraint, { type: T }>[] {
  return spec.constraints.filter(c => c.type === type) as Extract<MusicConstraint, { type: T }>[];
}

/**
 * Check if spec has a constraint of a specific type.
 */
export function hasConstraint(spec: MusicSpec, type: MusicConstraint['type']): boolean {
  return spec.constraints.some(c => c.type === type);
}

// ============================================================================
// ADDITIONAL CONSTRAINT BUILDERS (C411, C510-C513, C788-C791)
// ============================================================================

/**
 * Create a trailer build constraint (C411).
 */
export function trailerBuildConstraint(
  buildBars: number,
  hitCount: number,
  percussionDensity: DensityLevel = 'dense'
): ConstraintTrailerBuild {
  return { type: 'trailer_build', hard: false, weight: 0.7, buildBars, hitCount, percussionDensity };
}

/**
 * Create a leitmotif constraint (C228).
 */
export function leitmotifConstraint(
  motifId: string,
  transformOp?: ConstraintLeitmotif['transformOp']
): ConstraintLeitmotif {
  return transformOp
    ? { type: 'leitmotif', hard: false, weight: 0.6, motifId, transformOp }
    : { type: 'leitmotif', hard: false, weight: 0.6, motifId };
}

/**
 * Create a drone constraint (C511).
 */
export function droneConstraint(
  droneTones: readonly RootName[],
  droneStyle: ConstraintDrone['droneStyle'] = 'sustained'
): ConstraintDrone {
  return { type: 'drone', hard: false, weight: 0.5, droneTones, droneStyle };
}

/**
 * Create a pattern role constraint (C873).
 */
export function patternRoleConstraint(role: PatternRole): ConstraintPatternRole {
  return { type: 'pattern_role', hard: false, weight: 0.6, role };
}

/**
 * Create a swing constraint.
 */
export function swingConstraint(amount: number): ConstraintSwing {
  return { type: 'swing', hard: false, weight: 0.5, amount: Math.max(0, Math.min(1, amount)) };
}

/**
 * Create a heterophony constraint (C789).
 */
export function heterophonyConstraint(
  voiceCount: number,
  variationDepth: ConstraintHeterophony['variationDepth'] = 'moderate',
  timingSpread: number = 0.3
): ConstraintHeterophony {
  return { type: 'heterophony', hard: false, weight: 0.6, voiceCount, variationDepth, timingSpread };
}

/**
 * Create a max interval constraint.
 */
export function maxIntervalConstraint(semitones: number): ConstraintMaxInterval {
  return { type: 'max_interval', hard: false, weight: 0.4, semitones };
}

/**
 * Create an arranger style constraint.
 */
export function arrangerStyleConstraint(style: ArrangerStyle): ConstraintArrangerStyle {
  return { type: 'arranger_style', hard: false, weight: 0.7, style };
}

/**
 * Create a scene arc constraint.
 */
export function sceneArcConstraint(arcType: ConstraintSceneArc['arcType']): ConstraintSceneArc {
  return { type: 'scene_arc', hard: false, weight: 0.6, arcType };
}
