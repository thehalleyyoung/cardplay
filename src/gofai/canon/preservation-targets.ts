/**
 * GOFAI Canon — Typed Targets for Preserve / Only-Change Constraints
 *
 * Defines `CPLPreservable` and `CPLChangeTarget` as referenced in
 * gofaimusicplus.md §CPLConstraint.  Every preserve() or only_change()
 * constraint needs a typed target that describes *what* is being locked
 * or unlocked, at what granularity, and with what mode of comparison.
 *
 * ## Design Principles
 *
 * 1. **Typed, not stringly** — targets carry domain, granularity, and
 *    comparison mode at the type level.
 * 2. **Graduated strictness** — every preservable has modes from exact
 *    (bit-for-bit) to recognizable (perceptually similar).
 * 3. **Composable** — targets can be combined (AND, OR, EXCEPT).
 * 4. **Cross-tradition** — covers Western tonal, modal, microtonal,
 *    non-pitched percussion, electronic production, and non-Western
 *    traditions where applicable.
 * 5. **Inspectable** — every target has a human-readable description
 *    and a canonical ID for logging and UI display.
 *
 * @module gofai/canon/preservation-targets
 * @see gofai_goalA.md Step 078
 * @see gofaimusicplus.md §CPLConstraint
 */

import type { ConstraintTypeId } from './types';

// =============================================================================
// PRESERVABLE TARGET IDS (branded)
// =============================================================================

/**
 * Branded ID for a preservation target.
 * Format: `ptarget:<domain>:<name>`
 */
export type PreservationTargetId = string & { readonly __brand: 'PreservationTargetId' };

export function createPreservationTargetId(domain: string, name: string): PreservationTargetId {
  return `ptarget:${domain}:${name}` as PreservationTargetId;
}

export function isValidPreservationTargetId(id: string): id is PreservationTargetId {
  return /^ptarget:[a-z_]+:[a-z_]+$/.test(id);
}

/**
 * Branded ID for a change target.
 * Format: `ctarget:<domain>:<name>`
 */
export type ChangeTargetId = string & { readonly __brand: 'ChangeTargetId' };

export function createChangeTargetId(domain: string, name: string): ChangeTargetId {
  return `ctarget:${domain}:${name}` as ChangeTargetId;
}

export function isValidChangeTargetId(id: string): id is ChangeTargetId {
  return /^ctarget:[a-z_]+:[a-z_]+$/.test(id);
}

// =============================================================================
// PRESERVATION MODE — how strictly to compare before/after
// =============================================================================

/**
 * How strictly a preserved target must match its pre-edit state.
 *
 * Every preservation target supports at least 'exact' and 'recognizable'.
 * Some targets define intermediate modes relevant to their domain.
 */
export type PreservationMode =
  | 'exact'          // Bit-for-bit identical (MIDI, pitch, timing, velocity)
  | 'functional'     // Same function, may differ in surface form (chord voicings, transposition)
  | 'contour'        // Same directional shape (melodic contour, dynamic envelope)
  | 'recognizable'   // Perceptually the same to a listener
  | 'structural'     // Same high-level structure (phrase boundaries, section form)
  | 'proportional'   // Same proportions/ratios (relative dynamics, tempo ratios)
  | 'characteristic'; // Preserves the defining trait (e.g., "swing feel" even if timing changes)

/**
 * Numeric strictness ordering (higher = stricter).
 */
export const PRESERVATION_MODE_STRICTNESS: Readonly<Record<PreservationMode, number>> = {
  exact: 100,
  functional: 80,
  contour: 60,
  structural: 50,
  proportional: 40,
  recognizable: 30,
  characteristic: 20,
};

/**
 * Get the stricter of two modes.
 */
export function stricterMode(a: PreservationMode, b: PreservationMode): PreservationMode {
  return PRESERVATION_MODE_STRICTNESS[a] >= PRESERVATION_MODE_STRICTNESS[b] ? a : b;
}

/**
 * Get the looser of two modes.
 */
export function looserMode(a: PreservationMode, b: PreservationMode): PreservationMode {
  return PRESERVATION_MODE_STRICTNESS[a] <= PRESERVATION_MODE_STRICTNESS[b] ? a : b;
}

// =============================================================================
// PRESERVATION DOMAIN — which musical domain a target belongs to
// =============================================================================

/**
 * The musical domain of a preservation target.
 */
export type PreservationDomain =
  | 'melody'        // Pitch sequences, melodic lines
  | 'harmony'       // Chords, voicings, progressions
  | 'rhythm'        // Timing, groove, beat patterns
  | 'structure'     // Form, sections, phrases
  | 'dynamics'      // Velocity, volume, expression
  | 'timbre'        // Sound design, instrument choice
  | 'texture'       // Density, layering, orchestration
  | 'production'    // Mix, effects, spatial
  | 'tempo'         // BPM, tempo changes
  | 'meter'         // Time signature, beat grouping
  | 'articulation'  // Note attacks, releases, playing style
  | 'pitch_system'  // Key, mode, scale, tuning system
  | 'spatial'       // Panning, stereo width, depth
  | 'composite';    // Combinations of multiple domains

// =============================================================================
// GRANULARITY — at what level of detail a target applies
// =============================================================================

/**
 * Granularity of a preservation target.
 */
export type PreservationGranularity =
  | 'event'         // Individual note/event level
  | 'beat'          // Beat-level patterns
  | 'bar'           // Bar-level patterns
  | 'phrase'        // Musical phrase level
  | 'section'       // Section level (verse, chorus)
  | 'song'          // Entire song
  | 'layer'         // Per-layer/track
  | 'parameter'     // Single parameter value
  | 'pattern'       // Repeating pattern
  | 'relationship'; // Inter-element relationship

// =============================================================================
// CPLPreservable — the full type for preserve() constraint targets
// =============================================================================

/**
 * A preservable target for use in `preserve(target, mode)` constraints.
 *
 * This is the canonical type referenced by CPLConstraint in gofaimusicplus.md.
 */
export type CPLPreservable =
  // Melody domain
  | MelodyPreservable
  // Harmony domain
  | HarmonyPreservable
  // Rhythm domain
  | RhythmPreservable
  // Structure domain
  | StructurePreservable
  // Dynamics domain
  | DynamicsPreservable
  // Timbre domain
  | TimbrePreservable
  // Texture domain
  | TexturePreservable
  // Production domain
  | ProductionPreservable
  // Tempo domain
  | TempoPreservable
  // Meter domain
  | MeterPreservable
  // Articulation domain
  | ArticulationPreservable
  // Pitch system domain
  | PitchSystemPreservable
  // Spatial domain
  | SpatialPreservable
  // Composite / catch-all
  | CompositePreservable
  // Custom (extension point)
  | CustomPreservable;

// ---------------------------------------------------------------------------
// Melody Preservables
// ---------------------------------------------------------------------------

export interface MelodyPreservable {
  readonly domain: 'melody';
  readonly target: MelodyPreservableTarget;
  readonly allowedModes: readonly PreservationMode[];
  readonly defaultMode: PreservationMode;
}

export type MelodyPreservableTarget =
  | 'melody_exact'          // All pitches and rhythms verbatim
  | 'melody_contour'        // Same directional movement (up/down/same)
  | 'melody_intervals'      // Same intervals, possibly transposed
  | 'melody_rhythm'         // Rhythmic pattern of the melody line
  | 'melody_phrasing'       // Phrase boundaries and breath marks
  | 'melody_range'          // Same register / tessitura
  | 'melody_peak'           // Location and pitch of climactic note
  | 'melody_motif'          // Recognizable motif or hook
  | 'melody_sequence'       // Sequential repetition patterns
  | 'melody_ornamentation'  // Trills, grace notes, turns, mordents
  | 'melody_resolution'     // How phrases resolve (cadential motion)
  | 'melody_diatonic'       // Stay within the current diatonic set
  | 'melody_chromatic'      // Preserve chromatic passing tones
  | 'melody_pentatonic'     // Preserve pentatonic character
  | 'melody_modal'          // Preserve modal flavor (Dorian, Mixolydian, etc.)
  | 'melody_raga'           // Preserve raga-specific ascending/descending patterns (Indian classical)
  | 'melody_maqam'          // Preserve maqam-specific interval patterns (Arabic/Turkish)
  | 'melody_call_response'  // Preserve call-and-response patterning
  | 'melody_drone_relation' // Preserve relationship to drone pitch
  | 'melody_microtonal'     // Preserve microtonal inflections
  | 'melody_blue_notes'     // Preserve blue note inflections (blues/jazz)
  | 'melody_slides'         // Preserve glissandi/portamenti
  | 'melody_vibrato';       // Preserve vibrato characteristics

// ---------------------------------------------------------------------------
// Harmony Preservables
// ---------------------------------------------------------------------------

export interface HarmonyPreservable {
  readonly domain: 'harmony';
  readonly target: HarmonyPreservableTarget;
  readonly allowedModes: readonly PreservationMode[];
  readonly defaultMode: PreservationMode;
}

export type HarmonyPreservableTarget =
  | 'harmony_exact'             // Exact voicings, inversions, doubled notes
  | 'harmony_functional'        // Same functional progression (I-IV-V-I etc.)
  | 'harmony_quality'           // Same chord qualities (maj7, min, dom7, etc.)
  | 'harmony_root_motion'       // Same root movement pattern
  | 'harmony_bass_line'         // Same bass note sequence
  | 'harmony_voice_leading'     // Same smooth voice leading
  | 'harmony_voicing_type'      // Same voicing style (close, open, drop-2, etc.)
  | 'harmony_extensions'        // Preserve extended tones (9ths, 11ths, 13ths)
  | 'harmony_tensions'          // Preserve tension/resolution patterns
  | 'harmony_cadences'          // Preserve cadential patterns (authentic, deceptive, etc.)
  | 'harmony_pivot_chords'      // Preserve modulation pivot points
  | 'harmony_pedal_points'      // Preserve pedal tones / drones
  | 'harmony_slash_bass'        // Preserve slash chord bass notes
  | 'harmony_substitutions'     // Preserve tritone subs, backdoor ii-V, etc.
  | 'harmony_modal_interchange' // Preserve borrowed chords from parallel modes
  | 'harmony_secondary_dominants'// Preserve V/x relationships
  | 'harmony_diminished_passing'// Preserve diminished passing chords
  | 'harmony_quartal'           // Preserve quartal/quintal voicings
  | 'harmony_cluster'           // Preserve cluster voicings
  | 'harmony_power_chords'      // Preserve power chord / fifth voicings
  | 'harmony_sus'               // Preserve suspended chords
  | 'harmony_polychord'         // Preserve polychord structures
  | 'harmony_implied'           // Preserve implied harmony from melody/bass
  | 'harmony_contrapuntal'      // Preserve contrapuntal relationships between voices
  | 'harmony_raga_drone'        // Preserve drone-based harmonic foundation (Indian)
  | 'harmony_heterophony'       // Preserve heterophonic texture (East Asian, Middle Eastern)
  | 'harmony_parallelism'       // Preserve parallel motion patterns (Debussy, gamelan)
  | 'harmony_ostinato'          // Preserve repeating harmonic pattern
  | 'harmony_circle_of_fifths'  // Preserve circle-of-fifths motion
  | 'harmony_chromatic_mediants' // Preserve chromatic mediant relationships
  | 'harmony_neo_riemannian';   // Preserve neo-Riemannian transformations (PLR)

// ---------------------------------------------------------------------------
// Rhythm Preservables
// ---------------------------------------------------------------------------

export interface RhythmPreservable {
  readonly domain: 'rhythm';
  readonly target: RhythmPreservableTarget;
  readonly allowedModes: readonly PreservationMode[];
  readonly defaultMode: PreservationMode;
}

export type RhythmPreservableTarget =
  | 'rhythm_exact'            // Exact onset times and durations
  | 'rhythm_grid'             // Same grid positions (quantized)
  | 'rhythm_feel'             // Same rhythmic feel (swing, straight, shuffle)
  | 'rhythm_pattern'          // Same repeating rhythmic figure
  | 'rhythm_density'          // Same note density per beat/bar
  | 'rhythm_accents'          // Same accent pattern
  | 'rhythm_syncopation'      // Same syncopation patterns
  | 'rhythm_rest_pattern'     // Same rest placement
  | 'rhythm_groove'           // Overall groove character
  | 'rhythm_swing_amount'     // Specific swing ratio
  | 'rhythm_polyrhythm'       // Preserve polyrhythmic relationships
  | 'rhythm_hemiola'          // Preserve hemiola patterns (3-against-2)
  | 'rhythm_clave'            // Preserve clave pattern (son, rumba, etc.)
  | 'rhythm_tresillo'         // Preserve 3-3-2 tresillo feel
  | 'rhythm_backbeat'         // Preserve backbeat emphasis
  | 'rhythm_pickup'           // Preserve anacrusis/pickup notes
  | 'rhythm_downbeat'         // Preserve downbeat emphasis
  | 'rhythm_offbeat'          // Preserve offbeat emphasis (reggae, ska)
  | 'rhythm_ghostnotes'       // Preserve ghost note patterns
  | 'rhythm_flam'             // Preserve flam patterns
  | 'rhythm_roll'             // Preserve roll patterns (snare rolls, etc.)
  | 'rhythm_fill'             // Preserve drum fill placements and patterns
  | 'rhythm_turnaround'       // Preserve phrase-end rhythmic turnarounds
  | 'rhythm_euclidean'        // Preserve Euclidean rhythm distribution
  | 'rhythm_additive'         // Preserve additive rhythms (Balkan, South Indian)
  | 'rhythm_tala'             // Preserve tala cycle structure (Indian classical)
  | 'rhythm_colotomic'        // Preserve colotomic structure (gamelan)
  | 'rhythm_aksak'            // Preserve aksak (asymmetric) meter patterns (Turkish/Balkan)
  | 'rhythm_compas'           // Preserve compas patterns (flamenco)
  | 'rhythm_montuno'          // Preserve montuno patterns (Afro-Cuban)
  | 'rhythm_cascara'          // Preserve cascara patterns (Afro-Cuban)
  | 'rhythm_timeline'         // Preserve timeline/bell pattern (West African)
  | 'rhythm_cross_rhythm'     // Preserve cross-rhythmic relationship
  | 'rhythm_metric_modulation' // Preserve metric modulation relationships
  | 'rhythm_tuplet'           // Preserve tuplet groupings
  | 'rhythm_rubato'           // Preserve rubato feel (timing flexibility)
  | 'rhythm_humanize';        // Preserve humanized timing deviations

// ---------------------------------------------------------------------------
// Structure Preservables
// ---------------------------------------------------------------------------

export interface StructurePreservable {
  readonly domain: 'structure';
  readonly target: StructurePreservableTarget;
  readonly allowedModes: readonly PreservationMode[];
  readonly defaultMode: PreservationMode;
}

export type StructurePreservableTarget =
  | 'structure_form'           // Overall song form (AABA, verse-chorus, etc.)
  | 'structure_section_order'  // Order of sections
  | 'structure_section_count'  // Number of sections
  | 'structure_section_lengths'// Length of each section
  | 'structure_phrase_lengths' // Musical phrase lengths
  | 'structure_phrase_grouping'// How phrases group (2+2, 4+4, 3+3+2, etc.)
  | 'structure_repetitions'   // Which sections repeat
  | 'structure_variations'    // How repeated sections vary
  | 'structure_transitions'   // Transition regions between sections
  | 'structure_intro'         // Intro section specifically
  | 'structure_outro'         // Outro section specifically
  | 'structure_bridge'        // Bridge section specifically
  | 'structure_buildup'       // Build-up / riser sections
  | 'structure_breakdown'     // Breakdown sections
  | 'structure_drop'          // Drop sections (EDM)
  | 'structure_hook'          // Hook placement and recurrence
  | 'structure_turnaround'    // Turnaround sections
  | 'structure_coda'          // Coda / ending
  | 'structure_da_capo'       // Da capo / repeat structure
  | 'structure_rondo'         // Rondo form (ABACA)
  | 'structure_sonata'        // Sonata form (exposition, development, recap)
  | 'structure_binary'        // Binary form (AB)
  | 'structure_ternary'       // Ternary form (ABA)
  | 'structure_through_composed' // Through-composed (no repeating sections)
  | 'structure_strophic'      // Strophic form (same music, different lyrics)
  | 'structure_bar_form'      // Bar form (AAB, Meistersinger)
  | 'structure_call_response' // Call-and-response structural pattern
  | 'structure_verse_chorus_bridge' // Standard pop form
  | 'structure_12_bar_blues'  // 12-bar blues structure
  | 'structure_32_bar_aaba'   // 32-bar AABA jazz standard form
  | 'structure_theme_variations'; // Theme and variations form

// ---------------------------------------------------------------------------
// Dynamics Preservables
// ---------------------------------------------------------------------------

export interface DynamicsPreservable {
  readonly domain: 'dynamics';
  readonly target: DynamicsPreservableTarget;
  readonly allowedModes: readonly PreservationMode[];
  readonly defaultMode: PreservationMode;
}

export type DynamicsPreservableTarget =
  | 'dynamics_exact'          // Exact velocity values
  | 'dynamics_contour'        // Dynamic shape (crescendo, diminuendo)
  | 'dynamics_range'          // Dynamic range (pp to ff)
  | 'dynamics_accents'        // Accent pattern
  | 'dynamics_relative'       // Relative dynamics between voices
  | 'dynamics_envelope'       // Volume envelope shape
  | 'dynamics_compression'    // Compressed vs. wide dynamics
  | 'dynamics_terraced'       // Terraced dynamics (Baroque-style)
  | 'dynamics_crescendo'      // Crescendo placement and rate
  | 'dynamics_diminuendo'     // Diminuendo placement and rate
  | 'dynamics_sforzando'      // Sforzando accents
  | 'dynamics_subito'         // Sudden dynamic changes
  | 'dynamics_messa_di_voce'  // Swell-and-fade within a note
  | 'dynamics_ghost'          // Ghost note velocity levels
  | 'dynamics_cross_fade'     // Cross-fade patterns between layers
  | 'dynamics_sidechain'      // Sidechain pumping patterns
  | 'dynamics_automation'     // Volume automation curves
  | 'dynamics_expression';    // Expression (CC11) contour

// ---------------------------------------------------------------------------
// Timbre Preservables
// ---------------------------------------------------------------------------

export interface TimbrePreservable {
  readonly domain: 'timbre';
  readonly target: TimbrePreservableTarget;
  readonly allowedModes: readonly PreservationMode[];
  readonly defaultMode: PreservationMode;
}

export type TimbrePreservableTarget =
  | 'timbre_instrument'       // Same instrument/patch
  | 'timbre_family'           // Same instrument family
  | 'timbre_character'        // Same timbral character
  | 'timbre_brightness'       // Same timbral brightness
  | 'timbre_warmth'           // Same timbral warmth
  | 'timbre_attack'           // Same attack character
  | 'timbre_sustain'          // Same sustain character
  | 'timbre_release'          // Same release character
  | 'timbre_resonance'        // Same resonant frequencies
  | 'timbre_harmonics'        // Same harmonic content
  | 'timbre_noise_component'  // Same noise/breathiness level
  | 'timbre_modulation'       // Same modulation (LFO, filter sweep)
  | 'timbre_filter_type'      // Same filter type and cutoff range
  | 'timbre_distortion'       // Same distortion character
  | 'timbre_formant'          // Same formant structure (vocal timbre)
  | 'timbre_spectral_envelope'// Same spectral envelope shape
  | 'timbre_transient'        // Same transient shape
  | 'timbre_synthesis_type';  // Same synthesis method (subtractive, FM, wavetable, etc.)

// ---------------------------------------------------------------------------
// Texture Preservables
// ---------------------------------------------------------------------------

export interface TexturePreservable {
  readonly domain: 'texture';
  readonly target: TexturePreservableTarget;
  readonly allowedModes: readonly PreservationMode[];
  readonly defaultMode: PreservationMode;
}

export type TexturePreservableTarget =
  | 'texture_density'         // Note density / busy-ness
  | 'texture_layer_count'     // Number of active layers
  | 'texture_layer_roles'     // Which layers fill which roles
  | 'texture_register_spread' // How wide the register spread is
  | 'texture_doubling'        // Which parts are doubled
  | 'texture_unison'          // Unison vs. split voicing
  | 'texture_polyphony_level' // Monophonic / homophonic / polyphonic
  | 'texture_call_response'   // Call-and-response between layers
  | 'texture_accompaniment'   // Accompaniment pattern style
  | 'texture_arpeggiation'    // Arpeggiated vs. block chord textures
  | 'texture_ostinato_layers' // Which layers carry ostinato patterns
  | 'texture_pad_vs_rhythmic' // Ratio of sustained pads to rhythmic elements
  | 'texture_orchestration'   // Instrument assignment to musical lines
  | 'texture_tutti_solo'      // Tutti vs. solo sections
  | 'texture_antiphonal'      // Antiphonal (group alternation) texture
  | 'texture_heterophonic'    // Heterophonic texture (simultaneous variations)
  | 'texture_monophonic'      // Single-line monophonic texture
  | 'texture_homophonic'      // Melody + accompaniment
  | 'texture_homorhythmic';   // All parts in same rhythm

// ---------------------------------------------------------------------------
// Production Preservables
// ---------------------------------------------------------------------------

export interface ProductionPreservable {
  readonly domain: 'production';
  readonly target: ProductionPreservableTarget;
  readonly allowedModes: readonly PreservationMode[];
  readonly defaultMode: PreservationMode;
}

export type ProductionPreservableTarget =
  | 'production_mix'          // Overall mix balance
  | 'production_eq'           // EQ settings
  | 'production_reverb'       // Reverb character and amount
  | 'production_delay'        // Delay character and timing
  | 'production_compression'  // Compression settings
  | 'production_distortion'   // Distortion/saturation
  | 'production_modulation_fx'// Chorus, phaser, flanger
  | 'production_master'       // Master bus processing
  | 'production_bus_routing'  // Bus/send routing structure
  | 'production_automation'   // Parameter automation curves
  | 'production_gain_staging' // Gain staging throughout signal chain
  | 'production_noise_floor'  // Noise floor / signal quality
  | 'production_sample_rate'  // Sample rate / bit depth
  | 'production_lofi'         // Lo-fi processing character
  | 'production_sidechain_routing'; // Sidechain routing configuration

// ---------------------------------------------------------------------------
// Tempo Preservables
// ---------------------------------------------------------------------------

export interface TempoPreservable {
  readonly domain: 'tempo';
  readonly target: TempoPreservableTarget;
  readonly allowedModes: readonly PreservationMode[];
  readonly defaultMode: PreservationMode;
}

export type TempoPreservableTarget =
  | 'tempo_exact'             // Exact BPM value
  | 'tempo_range'             // BPM within a range
  | 'tempo_feel'              // Tempo feel (fast, medium, slow)
  | 'tempo_changes'           // Tempo change locations and amounts
  | 'tempo_rubato'            // Rubato feel
  | 'tempo_accel'             // Accelerando passages
  | 'tempo_rit'               // Ritardando passages
  | 'tempo_fermata'           // Fermata placements
  | 'tempo_proportional';     // Proportional tempo relationships between sections

// ---------------------------------------------------------------------------
// Meter Preservables
// ---------------------------------------------------------------------------

export interface MeterPreservable {
  readonly domain: 'meter';
  readonly target: MeterPreservableTarget;
  readonly allowedModes: readonly PreservationMode[];
  readonly defaultMode: PreservationMode;
}

export type MeterPreservableTarget =
  | 'meter_time_signature'    // Time signature
  | 'meter_beat_grouping'     // How beats are grouped (3+3+2 vs 4+4, etc.)
  | 'meter_subdivision'       // Beat subdivision (duple, triple, compound)
  | 'meter_changes'           // Time signature changes
  | 'meter_polymeter'         // Polymetric relationships
  | 'meter_hypermetric'       // Hypermetric structure (strong/weak bars)
  | 'meter_anacrusis'         // Pickup beats / anacrusis
  | 'meter_isorhythm';        // Isorhythmic patterns (medieval, Messiaen)

// ---------------------------------------------------------------------------
// Articulation Preservables
// ---------------------------------------------------------------------------

export interface ArticulationPreservable {
  readonly domain: 'articulation';
  readonly target: ArticulationPreservableTarget;
  readonly allowedModes: readonly PreservationMode[];
  readonly defaultMode: PreservationMode;
}

export type ArticulationPreservableTarget =
  | 'articulation_exact'      // Exact articulation markings
  | 'articulation_style'      // Overall articulation style
  | 'articulation_legato'     // Legato passages
  | 'articulation_staccato'   // Staccato passages
  | 'articulation_tenuto'     // Tenuto markings
  | 'articulation_marcato'    // Marcato accents
  | 'articulation_portato'    // Portato articulation
  | 'articulation_pizzicato'  // Pizzicato passages
  | 'articulation_arco'       // Arco (bowed) passages
  | 'articulation_tremolo'    // Tremolo markings
  | 'articulation_trill'      // Trill markings
  | 'articulation_bend'       // Pitch bends
  | 'articulation_slide'      // Slide / glissando
  | 'articulation_hammer_on'  // Hammer-on (guitar)
  | 'articulation_pull_off'   // Pull-off (guitar)
  | 'articulation_palm_mute'  // Palm mute (guitar)
  | 'articulation_harmonics'  // Harmonics (natural / artificial)
  | 'articulation_mute'       // Muted notes
  | 'articulation_dead_note'  // Dead/ghost notes
  | 'articulation_slap'       // Slap technique (bass, percussion)
  | 'articulation_snap'       // Snap pizzicato / popping
  | 'articulation_col_legno'  // Col legno (strike with wood of bow)
  | 'articulation_sul_pont'   // Sul ponticello (near bridge)
  | 'articulation_sul_tasto'  // Sul tasto (over fingerboard)
  | 'articulation_con_sordino' // With mute
  | 'articulation_breath'     // Breath marks / phrasing
  | 'articulation_tongue'     // Tonguing patterns (wind instruments)
  | 'articulation_double_tongue' // Double tonguing
  | 'articulation_flutter_tongue'; // Flutter tonguing

// ---------------------------------------------------------------------------
// Pitch System Preservables
// ---------------------------------------------------------------------------

export interface PitchSystemPreservable {
  readonly domain: 'pitch_system';
  readonly target: PitchSystemPreservableTarget;
  readonly allowedModes: readonly PreservationMode[];
  readonly defaultMode: PreservationMode;
}

export type PitchSystemPreservableTarget =
  | 'pitch_system_key'           // Current key
  | 'pitch_system_mode'          // Current mode (major, minor, dorian, etc.)
  | 'pitch_system_scale'         // Current scale
  | 'pitch_system_modulations'   // Key change locations
  | 'pitch_system_tonicization'  // Temporary tonicizations
  | 'pitch_system_tuning'        // Tuning system (12-TET, just intonation, etc.)
  | 'pitch_system_microtonal'    // Microtonal inflections
  | 'pitch_system_pitch_center'  // Pitch center / tonal center
  | 'pitch_system_scale_degree_functions' // Scale degree functional roles
  | 'pitch_system_chromatic_vs_diatonic'  // Ratio of chromatic to diatonic
  | 'pitch_system_raga'          // Raga specification (Indian)
  | 'pitch_system_maqam'         // Maqam specification (Arabic/Turkish)
  | 'pitch_system_pentatonic_type' // Pentatonic type (major, minor, hirajoshi, etc.)
  | 'pitch_system_whole_tone'    // Whole-tone scale usage
  | 'pitch_system_octatonic'     // Octatonic/diminished scale usage
  | 'pitch_system_blues_scale'   // Blues scale usage
  | 'pitch_system_bebop_scale'   // Bebop scale usage
  | 'pitch_system_gamelan_slendro' // Slendro tuning (Javanese gamelan)
  | 'pitch_system_gamelan_pelog'; // Pelog tuning (Javanese gamelan)

// ---------------------------------------------------------------------------
// Spatial Preservables
// ---------------------------------------------------------------------------

export interface SpatialPreservable {
  readonly domain: 'spatial';
  readonly target: SpatialPreservableTarget;
  readonly allowedModes: readonly PreservationMode[];
  readonly defaultMode: PreservationMode;
}

export type SpatialPreservableTarget =
  | 'spatial_panning'          // Pan positions
  | 'spatial_stereo_width'     // Stereo width
  | 'spatial_depth'            // Front-to-back depth
  | 'spatial_imaging'          // Stereo image character
  | 'spatial_mono_compat'      // Mono compatibility
  | 'spatial_mid_side_ratio'   // Mid/side balance
  | 'spatial_binaural'         // Binaural spatialization
  | 'spatial_surround'         // Surround placement
  | 'spatial_atmos'            // Dolby Atmos / spatial audio
  | 'spatial_room_character'   // Room/space character
  | 'spatial_dry_wet'          // Dry/wet balance for spatial FX
  | 'spatial_automation';      // Spatial parameter automation

// ---------------------------------------------------------------------------
// Composite Preservables (multi-domain)
// ---------------------------------------------------------------------------

export interface CompositePreservable {
  readonly domain: 'composite';
  readonly target: CompositePreservableTarget;
  readonly allowedModes: readonly PreservationMode[];
  readonly defaultMode: PreservationMode;
  /** Sub-targets combined in this composite */
  readonly components: readonly CPLPreservable[];
}

export type CompositePreservableTarget =
  | 'everything'              // Preserve all aspects (used with 'recognizable')
  | 'musical_identity'        // The "essence" — melody + harmony + form
  | 'groove'                  // Rhythm + dynamics + feel
  | 'arrangement'             // Texture + timbre + orchestration
  | 'mix'                     // Production + spatial
  | 'performance'             // Dynamics + articulation + timing
  | 'style'                   // Timbre + texture + production aesthetic
  | 'hook'                    // The recognizable hook (usually melody + rhythm)
  | 'vibe'                    // Overall feel / mood (perceptual composite)
  | 'energy_level'            // Energy as a combination of dynamics, density, tempo
  | 'genre_markers'           // Elements that define genre identity
  | 'emotional_arc';          // Emotional journey through the piece

// ---------------------------------------------------------------------------
// Custom Preservables (extension point)
// ---------------------------------------------------------------------------

export interface CustomPreservable {
  readonly domain: 'composite'; // Extensions use composite domain
  readonly target: 'custom';
  readonly customId: string;
  readonly description: string;
  readonly allowedModes: readonly PreservationMode[];
  readonly defaultMode: PreservationMode;
  readonly components: readonly CPLPreservable[];
}

// =============================================================================
// CPLChangeTarget — the full type for only_change() constraint targets
// =============================================================================

/**
 * A change target for use in `only_change(targets[])` constraints.
 *
 * Change targets specify *what is allowed to change*. Everything else
 * is implicitly preserved. This is the dual of preserve().
 */
export type CPLChangeTarget =
  | LayerChangeTarget
  | ParameterChangeTarget
  | DomainChangeTarget
  | ScopeChangeTarget
  | EventChangeTarget
  | CustomChangeTarget;

// ---------------------------------------------------------------------------
// Layer Change Target — "only change the drums"
// ---------------------------------------------------------------------------

export interface LayerChangeTarget {
  readonly type: 'layer';
  /** Which layer(s) are allowed to change */
  readonly layers: readonly string[];
  /** Whether to allow adding new layers */
  readonly allowNew: boolean;
  /** Whether to allow removing layers */
  readonly allowRemove: boolean;
}

// ---------------------------------------------------------------------------
// Parameter Change Target — "only change velocity"
// ---------------------------------------------------------------------------

export interface ParameterChangeTarget {
  readonly type: 'parameter';
  /** Which parameter(s) are allowed to change */
  readonly parameters: readonly ChangeableParameter[];
  /** Optional scope (which layers/sections) */
  readonly scope?: ChangeScope;
}

export type ChangeableParameter =
  | 'pitch'           // Note pitches
  | 'velocity'        // Note velocities
  | 'duration'        // Note durations
  | 'timing'          // Note onset times
  | 'pan'             // Pan position
  | 'volume'          // Volume level
  | 'expression'      // Expression (CC11)
  | 'mod_wheel'       // Mod wheel (CC1)
  | 'pitch_bend'      // Pitch bend
  | 'aftertouch'      // Aftertouch
  | 'cc'              // Any CC parameter
  | 'tempo'           // Tempo value
  | 'time_signature'  // Time signature
  | 'key_signature'   // Key signature
  | 'instrument'      // Instrument/patch
  | 'mix_parameter'   // Any mix parameter
  | 'effect_parameter' // Any effect parameter
  | 'spatial_parameter' // Any spatial parameter
  | 'articulation_mark' // Articulation markings
  | 'dynamic_mark';   // Dynamic markings

// ---------------------------------------------------------------------------
// Domain Change Target — "only change harmony"
// ---------------------------------------------------------------------------

export interface DomainChangeTarget {
  readonly type: 'domain';
  /** Which musical domain(s) are allowed to change */
  readonly domains: readonly PreservationDomain[];
  /** Optional scope */
  readonly scope?: ChangeScope;
}

// ---------------------------------------------------------------------------
// Scope Change Target — "only change the chorus"
// ---------------------------------------------------------------------------

export interface ScopeChangeTarget {
  readonly type: 'scope';
  /** Which sections are allowed to change */
  readonly sections?: readonly string[];
  /** Which time range is allowed to change */
  readonly timeRange?: {
    readonly startBar: number;
    readonly endBar: number;
  };
  /** What aspects can change within the scope */
  readonly allowedDomains?: readonly PreservationDomain[];
}

// ---------------------------------------------------------------------------
// Event Change Target — "only change the high notes"
// ---------------------------------------------------------------------------

export interface EventChangeTarget {
  readonly type: 'event';
  /** Predicate describing which events can change */
  readonly predicate: EventChangePredicate;
  /** What about those events can change */
  readonly allowedParameters?: readonly ChangeableParameter[];
}

export type EventChangePredicate =
  | { readonly kind: 'pitch_range'; readonly minMidi: number; readonly maxMidi: number }
  | { readonly kind: 'velocity_range'; readonly minVel: number; readonly maxVel: number }
  | { readonly kind: 'duration_range'; readonly minTicks: number; readonly maxTicks: number }
  | { readonly kind: 'position'; readonly beats: readonly number[] }
  | { readonly kind: 'layer'; readonly layerName: string }
  | { readonly kind: 'tag'; readonly tag: string }
  | { readonly kind: 'role'; readonly role: string }
  | { readonly kind: 'all' }
  | { readonly kind: 'selected' }; // Currently selected events

// ---------------------------------------------------------------------------
// Custom Change Target (extension point)
// ---------------------------------------------------------------------------

export interface CustomChangeTarget {
  readonly type: 'custom';
  readonly customId: string;
  readonly description: string;
  /** Domains that this custom target covers */
  readonly coveredDomains: readonly PreservationDomain[];
}

// ---------------------------------------------------------------------------
// Change Scope (shared by multiple change targets)
// ---------------------------------------------------------------------------

export interface ChangeScope {
  /** Which layers */
  readonly layers?: readonly string[];
  /** Which sections */
  readonly sections?: readonly string[];
  /** Time range */
  readonly timeRange?: {
    readonly startBar: number;
    readonly endBar: number;
  };
}

// =============================================================================
// PRESERVATION TARGET TABLE — canonical entries
// =============================================================================

/**
 * A preservation target entry in the canonical table.
 */
export interface PreservationTargetEntry {
  readonly id: PreservationTargetId;
  readonly domain: PreservationDomain;
  readonly name: string;
  readonly description: string;
  readonly allowedModes: readonly PreservationMode[];
  readonly defaultMode: PreservationMode;
  /** Natural language phrases that trigger this target */
  readonly nlTriggers: readonly string[];
  /** Which constraint type IDs use this target */
  readonly usedByConstraints: readonly ConstraintTypeId[];
  /** Granularity */
  readonly granularity: PreservationGranularity;
  /** Whether this is a composite of sub-targets */
  readonly isComposite: boolean;
  /** Sub-target IDs if composite */
  readonly subTargets: readonly PreservationTargetId[];
  /** Verification strategy */
  readonly verificationStrategy: VerificationStrategy;
}

/**
 * How a preserved target is verified after an edit.
 */
export type VerificationStrategy =
  | 'diff_exact'        // Byte-for-byte comparison
  | 'diff_semantic'     // Semantic comparison (e.g., enharmonic equivalence)
  | 'contour_analysis'  // Melodic/dynamic contour comparison
  | 'function_analysis' // Functional analysis (Roman numeral comparison)
  | 'pattern_matching'  // Pattern similarity scoring
  | 'perceptual_model'  // Perceptual similarity model
  | 'structural_alignment' // Structure alignment algorithm
  | 'statistical'       // Statistical comparison (density, distribution)
  | 'manual_review';    // Requires human review

// =============================================================================
// CANONICAL PRESERVATION TARGET TABLE
// =============================================================================

export const PRESERVATION_TARGETS: readonly PreservationTargetEntry[] = [
  // ---- Melody domain ----
  {
    id: createPreservationTargetId('melody', 'exact'),
    domain: 'melody',
    name: 'Melody (exact)',
    description: 'Preserve the melody note-for-note: exact pitches, rhythms, and phrasing.',
    allowedModes: ['exact'],
    defaultMode: 'exact',
    nlTriggers: [
      'keep the melody exactly',
      'don\'t change the melody',
      'preserve the melody',
      'melody must stay the same',
      'same notes',
    ],
    usedByConstraints: [],
    granularity: 'event',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'diff_exact',
  },
  {
    id: createPreservationTargetId('melody', 'contour'),
    domain: 'melody',
    name: 'Melody contour',
    description: 'Preserve the melodic contour (up/down/same pattern) while allowing transposition or interval changes.',
    allowedModes: ['contour', 'recognizable'],
    defaultMode: 'contour',
    nlTriggers: [
      'keep the shape of the melody',
      'same contour',
      'preserve the melodic shape',
      'keep the melody recognizable',
      'maintain the melodic line',
    ],
    usedByConstraints: [],
    granularity: 'phrase',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'contour_analysis',
  },
  {
    id: createPreservationTargetId('melody', 'motif'),
    domain: 'melody',
    name: 'Melodic motif / hook',
    description: 'Preserve the recognizable melodic motif or hook — the defining phrase that a listener would hum.',
    allowedModes: ['exact', 'recognizable'],
    defaultMode: 'recognizable',
    nlTriggers: [
      'keep the hook',
      'preserve the motif',
      'don\'t lose the main melody',
      'keep the riff',
      'the catchy part stays',
    ],
    usedByConstraints: [],
    granularity: 'phrase',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'pattern_matching',
  },
  {
    id: createPreservationTargetId('melody', 'intervals'),
    domain: 'melody',
    name: 'Melodic intervals',
    description: 'Preserve the interval pattern of the melody (can be transposed to any key).',
    allowedModes: ['exact', 'functional'],
    defaultMode: 'exact',
    nlTriggers: [
      'same intervals',
      'preserve the intervals',
      'keep the interval pattern',
      'transpose but keep intervals',
    ],
    usedByConstraints: [],
    granularity: 'event',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'diff_semantic',
  },

  // ---- Harmony domain ----
  {
    id: createPreservationTargetId('harmony', 'exact'),
    domain: 'harmony',
    name: 'Harmony (exact)',
    description: 'Preserve exact chord voicings, inversions, and doublings.',
    allowedModes: ['exact'],
    defaultMode: 'exact',
    nlTriggers: [
      'keep the exact chords',
      'don\'t change the voicings',
      'preserve harmony exactly',
      'same chords same voicings',
    ],
    usedByConstraints: [],
    granularity: 'event',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'diff_exact',
  },
  {
    id: createPreservationTargetId('harmony', 'functional'),
    domain: 'harmony',
    name: 'Functional harmony',
    description: 'Preserve the harmonic function (I-IV-V-I) while allowing revoicing, substitution of equivalent chords.',
    allowedModes: ['functional', 'recognizable'],
    defaultMode: 'functional',
    nlTriggers: [
      'keep the chord progression',
      'preserve the harmony',
      'same changes',
      'keep the chords',
      'don\'t change the harmony',
    ],
    usedByConstraints: [],
    granularity: 'bar',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'function_analysis',
  },
  {
    id: createPreservationTargetId('harmony', 'bass_line'),
    domain: 'harmony',
    name: 'Bass line',
    description: 'Preserve the bass note sequence (root motion, walking bass, bass riff).',
    allowedModes: ['exact', 'contour', 'recognizable'],
    defaultMode: 'contour',
    nlTriggers: [
      'keep the bass line',
      'preserve the bass',
      'don\'t change the bass',
      'same bass notes',
    ],
    usedByConstraints: [],
    granularity: 'event',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'contour_analysis',
  },

  // ---- Rhythm domain ----
  {
    id: createPreservationTargetId('rhythm', 'exact'),
    domain: 'rhythm',
    name: 'Rhythm (exact)',
    description: 'Preserve exact onset times and durations for all events.',
    allowedModes: ['exact'],
    defaultMode: 'exact',
    nlTriggers: [
      'keep the exact rhythm',
      'don\'t change the timing',
      'preserve the rhythm exactly',
      'same timing',
    ],
    usedByConstraints: [],
    granularity: 'event',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'diff_exact',
  },
  {
    id: createPreservationTargetId('rhythm', 'groove'),
    domain: 'rhythm',
    name: 'Groove',
    description: 'Preserve the groove feel — the swing, push/pull, accent pattern that defines the rhythmic character.',
    allowedModes: ['characteristic', 'recognizable'],
    defaultMode: 'characteristic',
    nlTriggers: [
      'keep the groove',
      'preserve the feel',
      'same swing',
      'don\'t lose the groove',
      'keep it funky',
      'maintain the pocket',
    ],
    usedByConstraints: [],
    granularity: 'pattern',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'perceptual_model',
  },
  {
    id: createPreservationTargetId('rhythm', 'pattern'),
    domain: 'rhythm',
    name: 'Rhythmic pattern',
    description: 'Preserve the repeating rhythmic figure or drum pattern.',
    allowedModes: ['exact', 'recognizable'],
    defaultMode: 'exact',
    nlTriggers: [
      'keep the drum pattern',
      'preserve the beat',
      'same pattern',
      'don\'t change the drums',
      'keep the rhythm pattern',
    ],
    usedByConstraints: [],
    granularity: 'pattern',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'pattern_matching',
  },
  {
    id: createPreservationTargetId('rhythm', 'clave'),
    domain: 'rhythm',
    name: 'Clave pattern',
    description: 'Preserve the clave pattern (son clave, rumba clave, etc.) that anchors the rhythmic framework.',
    allowedModes: ['exact', 'characteristic'],
    defaultMode: 'exact',
    nlTriggers: [
      'keep the clave',
      'preserve the clave pattern',
      'don\'t change the clave',
      'maintain the clave feel',
    ],
    usedByConstraints: [],
    granularity: 'pattern',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'pattern_matching',
  },

  // ---- Structure domain ----
  {
    id: createPreservationTargetId('structure', 'form'),
    domain: 'structure',
    name: 'Song form',
    description: 'Preserve the overall song form (section order, repetitions, da capo structure).',
    allowedModes: ['exact', 'structural'],
    defaultMode: 'exact',
    nlTriggers: [
      'keep the song structure',
      'don\'t change the form',
      'preserve the arrangement',
      'same structure',
      'keep the sections as they are',
    ],
    usedByConstraints: [],
    granularity: 'song',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'structural_alignment',
  },
  {
    id: createPreservationTargetId('structure', 'section_lengths'),
    domain: 'structure',
    name: 'Section lengths',
    description: 'Preserve the length of each section in bars.',
    allowedModes: ['exact', 'proportional'],
    defaultMode: 'exact',
    nlTriggers: [
      'keep the section lengths',
      'same length sections',
      'don\'t shorten or extend',
      'preserve durations',
    ],
    usedByConstraints: [],
    granularity: 'section',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'diff_exact',
  },

  // ---- Dynamics domain ----
  {
    id: createPreservationTargetId('dynamics', 'contour'),
    domain: 'dynamics',
    name: 'Dynamic contour',
    description: 'Preserve the dynamic shape — crescendos, diminuendos, climaxes, and resting points.',
    allowedModes: ['contour', 'recognizable'],
    defaultMode: 'contour',
    nlTriggers: [
      'keep the dynamics',
      'preserve the dynamic shape',
      'same volume changes',
      'don\'t flatten the dynamics',
    ],
    usedByConstraints: [],
    granularity: 'phrase',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'contour_analysis',
  },
  {
    id: createPreservationTargetId('dynamics', 'accents'),
    domain: 'dynamics',
    name: 'Accent pattern',
    description: 'Preserve the accent pattern — which beats/notes are emphasized.',
    allowedModes: ['exact', 'characteristic'],
    defaultMode: 'characteristic',
    nlTriggers: [
      'keep the accents',
      'preserve the accent pattern',
      'same emphasis',
      'don\'t change the accenting',
    ],
    usedByConstraints: [],
    granularity: 'beat',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'pattern_matching',
  },

  // ---- Timbre domain ----
  {
    id: createPreservationTargetId('timbre', 'instrument'),
    domain: 'timbre',
    name: 'Instrument / sound',
    description: 'Preserve the instrument choice or sound design patch.',
    allowedModes: ['exact'],
    defaultMode: 'exact',
    nlTriggers: [
      'keep the same sound',
      'don\'t change the instrument',
      'preserve the tone',
      'same patch',
      'same preset',
    ],
    usedByConstraints: [],
    granularity: 'layer',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'diff_exact',
  },
  {
    id: createPreservationTargetId('timbre', 'character'),
    domain: 'timbre',
    name: 'Timbral character',
    description: 'Preserve the overall timbral character — brightness, warmth, texture — even if the specific sound changes.',
    allowedModes: ['characteristic', 'recognizable'],
    defaultMode: 'characteristic',
    nlTriggers: [
      'keep the vibe',
      'preserve the tone',
      'same character',
      'keep the sound quality',
      'same brightness',
    ],
    usedByConstraints: [],
    granularity: 'layer',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'perceptual_model',
  },

  // ---- Tempo domain ----
  {
    id: createPreservationTargetId('tempo', 'exact'),
    domain: 'tempo',
    name: 'Tempo (exact)',
    description: 'Preserve the exact BPM value.',
    allowedModes: ['exact'],
    defaultMode: 'exact',
    nlTriggers: [
      'keep the tempo',
      'same BPM',
      'don\'t change the speed',
      'preserve the tempo',
    ],
    usedByConstraints: [],
    granularity: 'song',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'diff_exact',
  },

  // ---- Pitch system domain ----
  {
    id: createPreservationTargetId('pitch_system', 'key'),
    domain: 'pitch_system',
    name: 'Key',
    description: 'Preserve the current key (root + mode).',
    allowedModes: ['exact'],
    defaultMode: 'exact',
    nlTriggers: [
      'keep the key',
      'stay in the same key',
      'don\'t modulate',
      'preserve the key',
    ],
    usedByConstraints: [],
    granularity: 'song',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'diff_semantic',
  },

  // ---- Spatial domain ----
  {
    id: createPreservationTargetId('spatial', 'stereo_image'),
    domain: 'spatial',
    name: 'Stereo image',
    description: 'Preserve the stereo image — pan positions, width, and spatial depth.',
    allowedModes: ['exact', 'characteristic'],
    defaultMode: 'characteristic',
    nlTriggers: [
      'keep the panning',
      'preserve the stereo image',
      'don\'t change the spatial mix',
      'same width',
    ],
    usedByConstraints: [],
    granularity: 'layer',
    isComposite: false,
    subTargets: [],
    verificationStrategy: 'diff_semantic',
  },

  // ---- Composite targets ----
  {
    id: createPreservationTargetId('composite', 'everything'),
    domain: 'composite',
    name: 'Everything',
    description: 'Preserve all musical aspects — used as a backstop when "don\'t change anything" is the intent.',
    allowedModes: ['exact', 'recognizable'],
    defaultMode: 'recognizable',
    nlTriggers: [
      'don\'t change anything',
      'leave it as is',
      'keep everything',
      'preserve everything',
    ],
    usedByConstraints: [],
    granularity: 'song',
    isComposite: true,
    subTargets: [
      createPreservationTargetId('melody', 'exact'),
      createPreservationTargetId('harmony', 'exact'),
      createPreservationTargetId('rhythm', 'exact'),
      createPreservationTargetId('structure', 'form'),
      createPreservationTargetId('dynamics', 'contour'),
      createPreservationTargetId('timbre', 'instrument'),
      createPreservationTargetId('tempo', 'exact'),
      createPreservationTargetId('pitch_system', 'key'),
      createPreservationTargetId('spatial', 'stereo_image'),
    ],
    verificationStrategy: 'diff_exact',
  },
  {
    id: createPreservationTargetId('composite', 'hook'),
    domain: 'composite',
    name: 'The hook',
    description: 'Preserve the recognizable hook — typically melody + rhythm + dynamics in the hook section.',
    allowedModes: ['recognizable'],
    defaultMode: 'recognizable',
    nlTriggers: [
      'keep the hook',
      'preserve the hook',
      'don\'t lose the hook',
      'the catchy part stays',
    ],
    usedByConstraints: [],
    granularity: 'phrase',
    isComposite: true,
    subTargets: [
      createPreservationTargetId('melody', 'motif'),
      createPreservationTargetId('rhythm', 'pattern'),
      createPreservationTargetId('dynamics', 'accents'),
    ],
    verificationStrategy: 'perceptual_model',
  },
  {
    id: createPreservationTargetId('composite', 'groove'),
    domain: 'composite',
    name: 'The groove',
    description: 'Preserve the groove — rhythm pattern + feel + dynamics + swing that define the rhythmic identity.',
    allowedModes: ['characteristic', 'recognizable'],
    defaultMode: 'characteristic',
    nlTriggers: [
      'keep the groove',
      'preserve the feel',
      'maintain the pocket',
      'same groove',
      'don\'t lose the feel',
    ],
    usedByConstraints: [],
    granularity: 'pattern',
    isComposite: true,
    subTargets: [
      createPreservationTargetId('rhythm', 'groove'),
      createPreservationTargetId('dynamics', 'accents'),
      createPreservationTargetId('rhythm', 'pattern'),
    ],
    verificationStrategy: 'perceptual_model',
  },
  {
    id: createPreservationTargetId('composite', 'musical_identity'),
    domain: 'composite',
    name: 'Musical identity',
    description: 'Preserve the musical identity — melody + harmony + form that make the piece recognizable.',
    allowedModes: ['recognizable'],
    defaultMode: 'recognizable',
    nlTriggers: [
      'keep the song recognizable',
      'preserve the musical identity',
      'it should still sound like the same song',
      'don\'t change what makes it this song',
    ],
    usedByConstraints: [],
    granularity: 'song',
    isComposite: true,
    subTargets: [
      createPreservationTargetId('melody', 'contour'),
      createPreservationTargetId('harmony', 'functional'),
      createPreservationTargetId('structure', 'form'),
    ],
    verificationStrategy: 'perceptual_model',
  },
];

// =============================================================================
// LOOKUP AND UTILITY FUNCTIONS
// =============================================================================

const _targetById = new Map<string, PreservationTargetEntry>(
  PRESERVATION_TARGETS.map(t => [t.id, t])
);

const _targetByName = new Map<string, PreservationTargetEntry>(
  PRESERVATION_TARGETS.map(t => [t.name.toLowerCase(), t])
);

/**
 * Look up a preservation target by its ID.
 */
export function getPreservationTargetById(id: PreservationTargetId): PreservationTargetEntry | undefined {
  return _targetById.get(id);
}

/**
 * Look up a preservation target by name (case-insensitive).
 */
export function getPreservationTargetByName(name: string): PreservationTargetEntry | undefined {
  return _targetByName.get(name.toLowerCase());
}

/**
 * Get all targets in a specific domain.
 */
export function getPreservationTargetsByDomain(domain: PreservationDomain): readonly PreservationTargetEntry[] {
  return PRESERVATION_TARGETS.filter(t => t.domain === domain);
}

/**
 * Get all composite targets.
 */
export function getCompositeTargets(): readonly PreservationTargetEntry[] {
  return PRESERVATION_TARGETS.filter(t => t.isComposite);
}

/**
 * Get targets that match a natural language phrase (simple keyword match).
 */
export function matchPreservationTarget(phrase: string): readonly PreservationTargetEntry[] {
  const lower = phrase.toLowerCase();
  return PRESERVATION_TARGETS.filter(t =>
    t.nlTriggers.some(trigger => lower.includes(trigger) || trigger.includes(lower))
  );
}

/**
 * Get all targets at a specific granularity.
 */
export function getTargetsByGranularity(granularity: PreservationGranularity): readonly PreservationTargetEntry[] {
  return PRESERVATION_TARGETS.filter(t => t.granularity === granularity);
}

/**
 * Resolve a composite target into its leaf sub-targets.
 */
export function resolveCompositeTarget(entry: PreservationTargetEntry): readonly PreservationTargetEntry[] {
  if (!entry.isComposite || entry.subTargets.length === 0) {
    return [entry];
  }
  const results: PreservationTargetEntry[] = [];
  for (const subId of entry.subTargets) {
    const sub = _targetById.get(subId);
    if (sub) {
      results.push(...resolveCompositeTarget(sub));
    }
  }
  return results;
}

// =============================================================================
// CONSTRAINT ↔ TARGET MAPPING
// =============================================================================

/**
 * Maps a natural language preservation phrase to a CPLPreservable.
 */
export interface PreservationMapping {
  readonly nlPhrase: string;
  readonly target: CPLPreservable;
  readonly defaultMode: PreservationMode;
  readonly examples: readonly string[];
}

/**
 * Canonical NL → CPLPreservable mappings.
 * These are the primary phrases that trigger preservation constraints.
 */
export const PRESERVATION_MAPPINGS: readonly PreservationMapping[] = [
  {
    nlPhrase: 'melody',
    target: { domain: 'melody', target: 'melody_exact', allowedModes: ['exact', 'contour', 'recognizable'], defaultMode: 'exact' },
    defaultMode: 'exact',
    examples: ['keep the melody', 'preserve the melody', 'don\'t change the melody'],
  },
  {
    nlPhrase: 'melody contour',
    target: { domain: 'melody', target: 'melody_contour', allowedModes: ['contour', 'recognizable'], defaultMode: 'contour' },
    defaultMode: 'contour',
    examples: ['keep the melodic shape', 'preserve the contour'],
  },
  {
    nlPhrase: 'hook',
    target: { domain: 'melody', target: 'melody_motif', allowedModes: ['exact', 'recognizable'], defaultMode: 'recognizable' },
    defaultMode: 'recognizable',
    examples: ['keep the hook', 'don\'t lose the riff'],
  },
  {
    nlPhrase: 'harmony',
    target: { domain: 'harmony', target: 'harmony_functional', allowedModes: ['exact', 'functional', 'recognizable'], defaultMode: 'functional' },
    defaultMode: 'functional',
    examples: ['keep the chords', 'preserve the harmony', 'same changes'],
  },
  {
    nlPhrase: 'chords exact',
    target: { domain: 'harmony', target: 'harmony_exact', allowedModes: ['exact'], defaultMode: 'exact' },
    defaultMode: 'exact',
    examples: ['keep the exact voicings', 'don\'t change any chord'],
  },
  {
    nlPhrase: 'bass line',
    target: { domain: 'harmony', target: 'harmony_bass_line', allowedModes: ['exact', 'contour', 'recognizable'], defaultMode: 'contour' },
    defaultMode: 'contour',
    examples: ['keep the bass', 'preserve the bass line'],
  },
  {
    nlPhrase: 'rhythm',
    target: { domain: 'rhythm', target: 'rhythm_exact', allowedModes: ['exact', 'recognizable'], defaultMode: 'exact' },
    defaultMode: 'exact',
    examples: ['keep the rhythm', 'preserve the timing', 'same rhythm'],
  },
  {
    nlPhrase: 'groove',
    target: { domain: 'rhythm', target: 'rhythm_groove', allowedModes: ['characteristic', 'recognizable'], defaultMode: 'characteristic' },
    defaultMode: 'characteristic',
    examples: ['keep the groove', 'preserve the feel', 'maintain the pocket'],
  },
  {
    nlPhrase: 'drums',
    target: { domain: 'rhythm', target: 'rhythm_pattern', allowedModes: ['exact', 'recognizable'], defaultMode: 'exact' },
    defaultMode: 'exact',
    examples: ['keep the drum pattern', 'don\'t change the drums'],
  },
  {
    nlPhrase: 'structure',
    target: { domain: 'structure', target: 'structure_form', allowedModes: ['exact', 'structural'], defaultMode: 'exact' },
    defaultMode: 'exact',
    examples: ['keep the structure', 'preserve the form', 'same arrangement'],
  },
  {
    nlPhrase: 'dynamics',
    target: { domain: 'dynamics', target: 'dynamics_contour', allowedModes: ['exact', 'contour', 'recognizable'], defaultMode: 'contour' },
    defaultMode: 'contour',
    examples: ['keep the dynamics', 'preserve the volume shape'],
  },
  {
    nlPhrase: 'tempo',
    target: { domain: 'tempo', target: 'tempo_exact', allowedModes: ['exact'], defaultMode: 'exact' },
    defaultMode: 'exact',
    examples: ['keep the tempo', 'same BPM', 'don\'t change the speed'],
  },
  {
    nlPhrase: 'key',
    target: { domain: 'pitch_system', target: 'pitch_system_key', allowedModes: ['exact'], defaultMode: 'exact' },
    defaultMode: 'exact',
    examples: ['stay in key', 'keep the key', 'don\'t modulate'],
  },
  {
    nlPhrase: 'sound',
    target: { domain: 'timbre', target: 'timbre_instrument', allowedModes: ['exact'], defaultMode: 'exact' },
    defaultMode: 'exact',
    examples: ['keep the sound', 'same instrument', 'don\'t change the patch'],
  },
  {
    nlPhrase: 'everything',
    target: {
      domain: 'composite',
      target: 'everything',
      allowedModes: ['exact', 'recognizable'],
      defaultMode: 'recognizable',
      components: [],
    },
    defaultMode: 'recognizable',
    examples: ['don\'t change anything', 'keep everything', 'leave it alone'],
  },
];

const _mappingByPhrase = new Map<string, PreservationMapping>(
  PRESERVATION_MAPPINGS.map(m => [m.nlPhrase.toLowerCase(), m])
);

/**
 * Look up a preservation mapping by NL phrase.
 */
export function getPreservationMapping(phrase: string): PreservationMapping | undefined {
  return _mappingByPhrase.get(phrase.toLowerCase());
}

/**
 * Get all preservation mappings for a given domain.
 */
export function getPreservationMappingsByDomain(domain: PreservationDomain): readonly PreservationMapping[] {
  return PRESERVATION_MAPPINGS.filter(m => m.target.domain === domain);
}

// =============================================================================
// CHANGE TARGET MAPPINGS (only_change)
// =============================================================================

/**
 * Maps a natural language only-change phrase to a CPLChangeTarget.
 */
export interface ChangeTargetMapping {
  readonly nlPhrase: string;
  readonly target: CPLChangeTarget;
  readonly examples: readonly string[];
}

/**
 * Canonical NL → CPLChangeTarget mappings.
 */
export const CHANGE_TARGET_MAPPINGS: readonly ChangeTargetMapping[] = [
  {
    nlPhrase: 'only drums',
    target: { type: 'layer', layers: ['drums', 'kick', 'snare', 'hats', 'percussion'], allowNew: false, allowRemove: false },
    examples: ['only change the drums', 'just adjust the drums', 'drums only'],
  },
  {
    nlPhrase: 'only bass',
    target: { type: 'layer', layers: ['bass'], allowNew: false, allowRemove: false },
    examples: ['only change the bass', 'just the bass line'],
  },
  {
    nlPhrase: 'only lead',
    target: { type: 'layer', layers: ['lead', 'melody'], allowNew: false, allowRemove: false },
    examples: ['only change the lead', 'just the melody line'],
  },
  {
    nlPhrase: 'only vocals',
    target: { type: 'layer', layers: ['vocal', 'vocals', 'vox'], allowNew: false, allowRemove: false },
    examples: ['only change the vocals', 'just the vocal track'],
  },
  {
    nlPhrase: 'only pads',
    target: { type: 'layer', layers: ['pad', 'pads', 'synth_pad'], allowNew: false, allowRemove: false },
    examples: ['only change the pads', 'just the pad layer'],
  },
  {
    nlPhrase: 'only velocity',
    target: { type: 'parameter', parameters: ['velocity'] },
    examples: ['only change velocity', 'just adjust the dynamics'],
  },
  {
    nlPhrase: 'only pitch',
    target: { type: 'parameter', parameters: ['pitch'] },
    examples: ['only change the notes', 'just the pitches'],
  },
  {
    nlPhrase: 'only timing',
    target: { type: 'parameter', parameters: ['timing'] },
    examples: ['only change the timing', 'just adjust when notes hit'],
  },
  {
    nlPhrase: 'only harmony',
    target: { type: 'domain', domains: ['harmony'] },
    examples: ['only change the harmony', 'just the chords'],
  },
  {
    nlPhrase: 'only rhythm',
    target: { type: 'domain', domains: ['rhythm'] },
    examples: ['only change the rhythm', 'just the timing'],
  },
  {
    nlPhrase: 'only melody',
    target: { type: 'domain', domains: ['melody'] },
    examples: ['only change the melody', 'just the melody'],
  },
  {
    nlPhrase: 'only production',
    target: { type: 'domain', domains: ['production', 'spatial'] },
    examples: ['only change the mix', 'just the production'],
  },
  {
    nlPhrase: 'only this section',
    target: { type: 'scope', sections: [] },
    examples: ['only change this section', 'just in this part'],
  },
  {
    nlPhrase: 'only chorus',
    target: { type: 'scope', sections: ['chorus'] },
    examples: ['only change the chorus', 'just the chorus'],
  },
  {
    nlPhrase: 'only verse',
    target: { type: 'scope', sections: ['verse'] },
    examples: ['only change the verse', 'just the verse'],
  },
  {
    nlPhrase: 'only high notes',
    target: { type: 'event', predicate: { kind: 'pitch_range', minMidi: 72, maxMidi: 127 } },
    examples: ['only change the high notes', 'just the upper register'],
  },
  {
    nlPhrase: 'only low notes',
    target: { type: 'event', predicate: { kind: 'pitch_range', minMidi: 0, maxMidi: 60 } },
    examples: ['only change the low notes', 'just the lower register'],
  },
  {
    nlPhrase: 'only selected',
    target: { type: 'event', predicate: { kind: 'selected' } },
    examples: ['only change the selection', 'just these notes', 'only the selected notes'],
  },
];

const _changeByPhrase = new Map<string, ChangeTargetMapping>(
  CHANGE_TARGET_MAPPINGS.map(m => [m.nlPhrase.toLowerCase(), m])
);

/**
 * Look up a change target mapping by NL phrase.
 */
export function getChangeTargetMapping(phrase: string): ChangeTargetMapping | undefined {
  return _changeByPhrase.get(phrase.toLowerCase());
}

/**
 * Get all change target mappings of a given type.
 */
export function getChangeTargetMappingsByType(
  type: CPLChangeTarget['type']
): readonly ChangeTargetMapping[] {
  return CHANGE_TARGET_MAPPINGS.filter(m => m.target.type === type);
}

// =============================================================================
// DISPLAY AND FORMATTING
// =============================================================================

/**
 * Format a CPLPreservable as a human-readable string.
 */
export function formatPreservable(preservable: CPLPreservable): string {
  if (preservable.domain === 'composite') {
    if ('customId' in preservable) {
      return `custom:${preservable.customId} (${preservable.description})`;
    }
    return preservable.target;
  }
  return `${preservable.domain}/${preservable.target}`;
}

/**
 * Format a CPLChangeTarget as a human-readable string.
 */
export function formatChangeTarget(target: CPLChangeTarget): string {
  switch (target.type) {
    case 'layer':
      return `layers: ${target.layers.join(', ')}${target.allowNew ? ' (+new)' : ''}${target.allowRemove ? ' (-remove)' : ''}`;
    case 'parameter':
      return `params: ${target.parameters.join(', ')}`;
    case 'domain':
      return `domains: ${target.domains.join(', ')}`;
    case 'scope':
      if (target.sections && target.sections.length > 0) {
        return `scope: ${target.sections.join(', ')}`;
      }
      if (target.timeRange) {
        return `scope: bars ${target.timeRange.startBar}–${target.timeRange.endBar}`;
      }
      return 'scope: current';
    case 'event':
      return `events: ${target.predicate.kind}`;
    case 'custom':
      return `custom: ${target.customId}`;
  }
}

/**
 * Format a preservation mode as a user-facing label.
 */
export function formatPreservationMode(mode: PreservationMode): string {
  switch (mode) {
    case 'exact': return 'exactly as-is';
    case 'functional': return 'functionally equivalent';
    case 'contour': return 'same shape/direction';
    case 'recognizable': return 'recognizably similar';
    case 'structural': return 'same structure';
    case 'proportional': return 'same proportions';
    case 'characteristic': return 'same character/feel';
  }
}

/**
 * Generate a user-facing explanation of a preserve() constraint.
 */
export function explainPreservation(
  preservable: CPLPreservable,
  mode: PreservationMode
): string {
  const what = formatPreservable(preservable);
  const how = formatPreservationMode(mode);
  return `Preserve ${what} (${how})`;
}

/**
 * Generate a user-facing explanation of an only_change() constraint.
 */
export function explainOnlyChange(targets: readonly CPLChangeTarget[]): string {
  if (targets.length === 0) {
    return 'No changes allowed';
  }
  if (targets.length === 1) {
    const first = targets[0];
    if (first) return `Only change: ${formatChangeTarget(first)}`;
  }
  return `Only change: ${targets.map(formatChangeTarget).join('; ')}`;
}

// =============================================================================
// STATISTICS
// =============================================================================

export interface PreservationTargetStats {
  readonly totalTargets: number;
  readonly byDomain: Readonly<Record<PreservationDomain, number>>;
  readonly byGranularity: Readonly<Record<PreservationGranularity, number>>;
  readonly compositeCount: number;
  readonly leafCount: number;
  readonly totalNlTriggers: number;
  readonly totalMappings: number;
  readonly totalChangeMappings: number;
}

/**
 * Get statistics about the preservation target vocabulary.
 */
export function getPreservationTargetStats(): PreservationTargetStats {
  const byDomain: Record<string, number> = {};
  const byGranularity: Record<string, number> = {};
  let compositeCount = 0;
  let totalNlTriggers = 0;

  for (const t of PRESERVATION_TARGETS) {
    byDomain[t.domain] = (byDomain[t.domain] ?? 0) + 1;
    byGranularity[t.granularity] = (byGranularity[t.granularity] ?? 0) + 1;
    if (t.isComposite) compositeCount++;
    totalNlTriggers += t.nlTriggers.length;
  }

  return {
    totalTargets: PRESERVATION_TARGETS.length,
    byDomain: byDomain as Record<PreservationDomain, number>,
    byGranularity: byGranularity as Record<PreservationGranularity, number>,
    compositeCount,
    leafCount: PRESERVATION_TARGETS.length - compositeCount,
    totalNlTriggers,
    totalMappings: PRESERVATION_MAPPINGS.length,
    totalChangeMappings: CHANGE_TARGET_MAPPINGS.length,
  };
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

/**
 * Rules governing preservation targets and constraint typing.
 */
export const PRESERVATION_TARGET_RULES = [
  // Rule 1: Every preserve() must have a typed target
  'Rule PT-001: Every preserve() constraint MUST specify a CPLPreservable target. ' +
  'Untyped preservation (e.g., "preserve something") is rejected at parse time.',

  // Rule 2: Mode defaults are domain-specific
  'Rule PT-002: Each domain has a sensible default mode. ' +
  'Melody defaults to "exact", harmony to "functional", rhythm to "exact", ' +
  'groove to "characteristic". The default is inspectable and overridable.',

  // Rule 3: Strictness is monotonic
  'Rule PT-003: Strictness is ordered: exact > functional > contour > structural > ' +
  'proportional > recognizable > characteristic. A constraint cannot be ' +
  'loosened after creation, only tightened.',

  // Rule 4: Composite targets expand to leaf targets
  'Rule PT-004: Composite targets (e.g., "everything", "groove") expand to their ' +
  'leaf sub-targets for verification. Each leaf is verified independently.',

  // Rule 5: only_change is the dual of preserve
  'Rule PT-005: only_change(X) is semantically equivalent to preserve(everything EXCEPT X). ' +
  'The system enforces this duality — changing something outside only_change scope is a violation.',

  // Rule 6: Verification strategies must be concrete
  'Rule PT-006: Every preservation target MUST have a verification strategy that can be ' +
  'executed against before/after snapshots. "manual_review" is only for targets ' +
  'that genuinely cannot be automated.',

  // Rule 7: NL triggers are lowercase and deduplicated
  'Rule PT-007: All NL trigger phrases are stored lowercase. Duplicates across targets ' +
  'are resolved by specificity (more specific target wins).',

  // Rule 8: Change targets compose
  'Rule PT-008: Multiple only_change targets compose via union. ' +
  'only_change([drums]) + only_change([bass]) = only_change([drums, bass]).',

  // Rule 9: Layer change targets reference canonical layer vocabulary
  'Rule PT-009: Layer names in change targets MUST reference the canonical ' +
  'layer vocabulary (LAYER_VOCABULARY from canon/layer-vocabulary).',

  // Rule 10: Extension targets use custom type
  'Rule PT-010: Extensions define custom preservation and change targets using the ' +
  'CustomPreservable and CustomChangeTarget types. Custom targets must provide a ' +
  'description and list the domains they cover.',

  // Rule 11: Preservation targets are stable IDs
  'Rule PT-011: PreservationTargetId values are stable across versions. ' +
  'Removing a target requires a deprecation period and migration path.',

  // Rule 12: Conflict detection between preserve and only_change
  'Rule PT-012: The system MUST detect conflicts between preserve(X) and only_change(Y) ' +
  'when X overlaps with Y. Conflicts are reported to the user for resolution.',
] as const;
