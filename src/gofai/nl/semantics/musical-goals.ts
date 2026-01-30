/**
 * GOFAI NL Semantics — Musical Goals
 *
 * Typed representations for "musical goals" — desiderata over axes,
 * structures, and production qualities — distinct from "actions."
 *
 * ## Goals vs Actions
 *
 * An **action** is something you do ("add reverb", "increase brightness").
 * A **goal** is something you want to achieve ("make the chorus bigger",
 * "get a vintage sound", "achieve better separation").
 *
 * Goals are higher-level and may require multiple actions to fulfill.
 * They express intent without committing to specific operations.
 *
 * ## Goal Taxonomy
 *
 * 1. **Axis Goals**: Target a specific perceptual axis
 *    - "Make it brighter" → AxisGoal(brightness, increase)
 *    - "Get more punch" → AxisGoal(punch, increase)
 *
 * 2. **Structural Goals**: Target the arrangement structure
 *    - "Add a build-up" → StructuralGoal(section, add, build-up)
 *    - "Create an intro" → StructuralGoal(section, add, intro)
 *
 * 3. **Timbral Goals**: Target sound quality / character
 *    - "Get a vintage sound" → TimbralGoal(vintage)
 *    - "Make it sound analog" → TimbralGoal(analog)
 *
 * 4. **Spatial Goals**: Target spatial positioning
 *    - "Create more depth" → SpatialGoal(depth, increase)
 *    - "Open up the mix" → SpatialGoal(width, increase)
 *
 * 5. **Dynamic Goals**: Target loudness/energy contour
 *    - "Make the drop hit harder" → DynamicGoal(impact, increase)
 *    - "Create a crescendo" → DynamicGoal(energy, gradual_increase)
 *
 * 6. **Harmonic Goals**: Target harmonic content
 *    - "Add more tension" → HarmonicGoal(tension, increase)
 *    - "Resolve the chord" → HarmonicGoal(tension, decrease)
 *
 * 7. **Rhythmic Goals**: Target rhythm / groove
 *    - "Tighten the groove" → RhythmicGoal(tightness, increase)
 *    - "Add swing" → RhythmicGoal(swing, set)
 *
 * 8. **Melodic Goals**: Target melody qualities
 *    - "Make the melody more memorable" → MelodicGoal(memorability, increase)
 *    - "Simplify the melody" → MelodicGoal(complexity, decrease)
 *
 * 9. **Production Goals**: Target mix / mastering qualities
 *    - "Get radio-ready" → ProductionGoal(loudness_standard, broadcast)
 *    - "Better separation" → ProductionGoal(clarity, increase)
 *
 * 10. **Aesthetic Goals**: High-level stylistic targets
 *     - "Make it more lo-fi" → AestheticGoal(lofi)
 *     - "Go for a dark vibe" → AestheticGoal(dark)
 *
 * @module gofai/nl/semantics/musical-goals
 * @see gofai_goalA.md Step 158
 */

import type { CPLGoal } from '../../canon/cpl-types';


// =============================================================================
// GOAL CATEGORY TAXONOMY
// =============================================================================

/**
 * Top-level goal categories.
 */
export type MusicalGoalCategory =
  | 'axis'
  | 'structural'
  | 'timbral'
  | 'spatial'
  | 'dynamic'
  | 'harmonic'
  | 'rhythmic'
  | 'melodic'
  | 'production'
  | 'aesthetic';

/**
 * How a goal should be achieved — the strategy type.
 */
export type GoalStrategy =
  | 'direct'           // Directly map to axis change (brighten → brightness axis)
  | 'multi_axis'       // Requires changes across multiple axes
  | 'structural_edit'  // Requires structural edits (add/remove/move)
  | 'parameter_set'    // Requires setting specific parameters
  | 'composite'        // Requires a combination of strategies
  | 'heuristic'        // No clear mapping — requires AI/heuristic planning
  | 'reference_match'  // Match a reference (genre, song, preset)
  | 'contour_shape';   // Shape a trajectory over time (crescendo, fade)

/**
 * How precisely the goal is specified.
 */
export type GoalPrecision =
  | 'vague'       // "Make it better" — no specific axis or amount
  | 'directional' // "Make it brighter" — axis + direction, no amount
  | 'approximate' // "A lot brighter" — axis + direction + approximate amount
  | 'specific'    // "Boost 3dB at 5kHz" — fully specified
  | 'comparative' // "Brighter than the verse" — relative to a reference
  | 'absolute';   // "Set to -6dB" — absolute value

/**
 * The urgency or priority of a goal.
 */
export type GoalPriority =
  | 'critical'      // Must be achieved (explicit user demand)
  | 'high'          // Strongly desired
  | 'normal'        // Standard priority
  | 'low'           // Nice-to-have
  | 'background';   // Ambient / implicit goal (e.g., "keep it sounding good")


// =============================================================================
// BASE MUSICAL GOAL
// =============================================================================

/**
 * Base interface for all musical goals.
 */
export interface MusicalGoalBase {
  /** Unique goal ID */
  readonly id: string;

  /** Goal category */
  readonly category: MusicalGoalCategory;

  /** Human-readable description */
  readonly description: string;

  /** How the goal should be achieved */
  readonly strategy: GoalStrategy;

  /** How precisely the goal is specified */
  readonly precision: GoalPrecision;

  /** Priority */
  readonly priority: GoalPriority;

  /** Scope: where the goal applies */
  readonly scope: MusicalGoalScope | null;

  /** Whether the goal was explicitly stated or inferred */
  readonly explicit: boolean;

  /** Confidence that this is what the user wants (0–1) */
  readonly confidence: number;

  /** Source text that produced this goal */
  readonly sourceText: string | null;

  /** Source span in the input */
  readonly sourceSpan: { readonly start: number; readonly end: number } | null;

  /** Related goals (e.g., sub-goals, conflicting goals) */
  readonly relatedGoals: readonly GoalRelation[];

  /** Prerequisites: goals that must be satisfied before this one */
  readonly prerequisites: readonly string[];

  /** Anti-goals: what this goal should NOT result in */
  readonly antiGoals: readonly string[];
}


// =============================================================================
// GOAL SCOPE — where a goal applies
// =============================================================================

/**
 * Where a musical goal applies.
 */
export interface MusicalGoalScope {
  /** Scope type */
  readonly scopeType: MusicalGoalScopeType;

  /** Reference text ("the chorus", "bars 5-8", "the bass") */
  readonly reference: string;

  /** Entity type if resolved */
  readonly entityType: string | null;

  /** Whether this applies to the whole project */
  readonly global: boolean;

  /** Whether this applies only temporarily (during a section) */
  readonly temporal: boolean;

  /** Sub-scopes (nested, e.g., "the bass in the chorus") */
  readonly subScopes: readonly MusicalGoalScope[];
}

/**
 * Types of goal scopes.
 */
export type MusicalGoalScopeType =
  | 'section'         // A song section (verse, chorus)
  | 'layer'           // A track/layer
  | 'entity'          // A specific entity (card, note)
  | 'time_range'      // A bar range
  | 'frequency_range' // A frequency band (low end, mids)
  | 'global'          // The whole project/mix
  | 'selection';      // Current selection


// =============================================================================
// GOAL RELATIONS — how goals relate to each other
// =============================================================================

/**
 * A relation between two goals.
 */
export interface GoalRelation {
  /** The related goal ID */
  readonly targetGoalId: string;

  /** The type of relation */
  readonly relationType: GoalRelationType;

  /** Description */
  readonly description: string;
}

/**
 * Types of goal-goal relations.
 */
export type GoalRelationType =
  | 'supports'           // This goal helps achieve the target
  | 'conflicts_with'     // This goal may interfere with the target
  | 'subsumes'           // This goal includes the target
  | 'subgoal_of'         // This goal is a part of the target
  | 'alternative_to'     // This goal is an alternative to the target
  | 'prerequisite_of'    // This goal must be achieved before the target
  | 'opposite_of'        // This goal is the opposite of the target
  | 'co_dependent';      // Both goals must be achieved together


// =============================================================================
// SPECIFIC GOAL TYPES
// =============================================================================

/**
 * Axis Goal: Change a perceptual axis.
 */
export interface AxisMusicalGoal extends MusicalGoalBase {
  readonly category: 'axis';
  readonly strategy: 'direct' | 'multi_axis';

  /** The target axis */
  readonly axisName: string;

  /** Direction of change */
  readonly direction: 'increase' | 'decrease' | 'set';

  /** Target amount (if specified) */
  readonly amount: GoalAmount | null;

  /** Reference for comparison (if comparative) */
  readonly comparisonRef: string | null;

  /** Implied levers */
  readonly impliedLevers: readonly string[];
}

/**
 * Structural Goal: Change the arrangement structure.
 */
export interface StructuralMusicalGoal extends MusicalGoalBase {
  readonly category: 'structural';
  readonly strategy: 'structural_edit';

  /** What kind of structural change */
  readonly structuralAction: StructuralActionKind;

  /** Target element type */
  readonly targetElementType: string;

  /** Target element name/description */
  readonly targetElementName: string | null;

  /** Location for the structural change */
  readonly location: string | null;

  /** Count (for add/repeat operations) */
  readonly count: number | null;
}

/**
 * Kinds of structural actions.
 */
export type StructuralActionKind =
  | 'add_section'
  | 'remove_section'
  | 'add_layer'
  | 'remove_layer'
  | 'add_element'
  | 'remove_element'
  | 'move_element'
  | 'duplicate_element'
  | 'split_element'
  | 'merge_elements'
  | 'reorder_elements'
  | 'extend_section'
  | 'shorten_section';

/**
 * Timbral Goal: Change sound quality / character.
 */
export interface TimbralMusicalGoal extends MusicalGoalBase {
  readonly category: 'timbral';
  readonly strategy: 'multi_axis' | 'composite' | 'reference_match';

  /** Target timbral quality */
  readonly timbralTarget: TimbralTarget;

  /** How strongly to apply the timbral change (0–1) */
  readonly intensity: number;

  /** Reference sound (if matching) */
  readonly referenceSound: string | null;

  /** Axes that contribute to this timbral quality */
  readonly contributingAxes: readonly TimbralAxisContribution[];
}

/**
 * Predefined timbral targets.
 */
export type TimbralTarget =
  | 'vintage'       // Old-school, analog character
  | 'modern'        // Clean, digital, precise
  | 'analog'        // Analog warmth, saturation
  | 'digital'       // Clean digital sound
  | 'warm'          // Warm, full-bodied
  | 'cold'          // Cold, clinical
  | 'harsh'         // Aggressive, biting
  | 'smooth'        // Smooth, rounded
  | 'gritty'        // Distorted, raw
  | 'clean'         // No distortion, transparent
  | 'thick'         // Full, dense
  | 'thin'          // Sparse, lacking body
  | 'airy'          // Open, spacious high-end
  | 'dark'          // Low-end focused, muted highs
  | 'bright'        // High-end focused
  | 'muddy'         // Unclear, boomy
  | 'crisp'         // Clear, defined transients
  | 'lush'          // Rich, layered, reverberant
  | 'dry'           // No ambience
  | 'wet'           // Lots of effects/reverb
  | 'punchy'        // Strong transients, impact
  | 'soft'          // Gentle, understated
  | 'raw'           // Unprocessed, natural
  | 'polished'      // Highly processed, finished
  | 'organic'       // Natural, acoustic-sounding
  | 'synthetic'     // Obviously electronic/synth
  | 'aggressive'    // Hard-hitting, intense
  | 'gentle'        // Soft, delicate
  | 'ethereal'      // Dreamy, otherworldly
  | 'heavy';        // Dense, bass-heavy, powerful

/**
 * How a perceptual axis contributes to a timbral target.
 */
export interface TimbralAxisContribution {
  /** The axis */
  readonly axisName: string;

  /** Direction of change for this axis */
  readonly direction: 'increase' | 'decrease' | 'set';

  /** How much this axis contributes (0–1) */
  readonly weight: number;

  /** Description */
  readonly rationale: string;
}

/**
 * Spatial Goal: Change spatial positioning / depth.
 */
export interface SpatialMusicalGoal extends MusicalGoalBase {
  readonly category: 'spatial';
  readonly strategy: 'direct' | 'multi_axis';

  /** Spatial dimension being targeted */
  readonly spatialDimension: SpatialDimension;

  /** Direction of change */
  readonly direction: 'increase' | 'decrease' | 'set';

  /** Amount */
  readonly amount: GoalAmount | null;

  /** Contributing levers */
  readonly spatialLevers: readonly string[];
}

/**
 * Spatial dimensions.
 */
export type SpatialDimension =
  | 'width'         // Left-right spread
  | 'depth'         // Front-back distance (reverb)
  | 'height'        // Vertical position (psychoacoustic)
  | 'intimacy'      // Closeness to listener
  | 'immersion'     // Overall spatial involvement
  | 'separation'    // Distinctness of sources
  | 'panorama';     // Stereo field usage

/**
 * Dynamic Goal: Change loudness / energy contour.
 */
export interface DynamicMusicalGoal extends MusicalGoalBase {
  readonly category: 'dynamic';
  readonly strategy: 'direct' | 'contour_shape' | 'multi_axis';

  /** Dynamic quality being targeted */
  readonly dynamicTarget: DynamicTarget;

  /** Direction */
  readonly direction: 'increase' | 'decrease' | 'set';

  /** Amount */
  readonly amount: GoalAmount | null;

  /** Time contour (for gradual changes) */
  readonly contour: DynamicContour | null;
}

/**
 * Dynamic targets.
 */
export type DynamicTarget =
  | 'loudness'      // Overall loudness level
  | 'impact'        // Transient punch / impact
  | 'energy'        // Perceived energy level
  | 'dynamics'      // Dynamic range (loud-soft contrast)
  | 'sustain'       // How long sounds ring out
  | 'attack'        // How fast sounds hit
  | 'release'       // How sounds fade out
  | 'compression'   // Degree of dynamic compression
  | 'headroom';     // Space below clipping

/**
 * A dynamic contour: how a value changes over time.
 */
export interface DynamicContour {
  /** Contour shape */
  readonly shape: ContourShape;

  /** Duration description (e.g., "over 4 bars", "throughout the section") */
  readonly durationDescription: string;

  /** Start value descriptor */
  readonly startLevel: 'low' | 'medium' | 'high' | 'current';

  /** End value descriptor */
  readonly endLevel: 'low' | 'medium' | 'high' | 'current';
}

/**
 * Contour shapes.
 */
export type ContourShape =
  | 'crescendo'       // Gradual increase
  | 'decrescendo'     // Gradual decrease
  | 'swell'           // Increase then decrease
  | 'dip'             // Decrease then increase
  | 'plateau'         // Quick increase, sustain, quick decrease
  | 'ramp_up'         // Linear increase
  | 'ramp_down'       // Linear decrease
  | 'exponential_up'  // Exponential growth
  | 'exponential_down' // Exponential decay
  | 'step_up'         // Sudden increase
  | 'step_down'       // Sudden decrease
  | 'oscillate';      // Up and down repeatedly

/**
 * Harmonic Goal: Change harmonic content.
 */
export interface HarmonicMusicalGoal extends MusicalGoalBase {
  readonly category: 'harmonic';
  readonly strategy: 'direct' | 'structural_edit' | 'heuristic';

  /** Harmonic quality being targeted */
  readonly harmonicTarget: HarmonicTarget;

  /** Direction */
  readonly direction: 'increase' | 'decrease' | 'set';

  /** Specific harmonic reference (key, chord, scale) */
  readonly harmonicReference: string | null;
}

/**
 * Harmonic targets.
 */
export type HarmonicTarget =
  | 'tension'         // Harmonic tension level
  | 'consonance'      // How consonant/dissonant
  | 'complexity'      // Harmonic complexity (extensions, alterations)
  | 'movement'        // Rate of harmonic change
  | 'modality'        // Major/minor character
  | 'chromaticism'    // Amount of chromatic movement
  | 'resolution'      // Tendency to resolve
  | 'stability'       // Tonal center stability
  | 'richness'        // Number of chord tones
  | 'voice_leading';  // Smoothness of voice leading

/**
 * Rhythmic Goal: Change rhythm / groove.
 */
export interface RhythmicMusicalGoal extends MusicalGoalBase {
  readonly category: 'rhythmic';
  readonly strategy: 'direct' | 'parameter_set' | 'heuristic';

  /** Rhythmic quality being targeted */
  readonly rhythmicTarget: RhythmicTarget;

  /** Direction */
  readonly direction: 'increase' | 'decrease' | 'set';

  /** Amount */
  readonly amount: GoalAmount | null;

  /** Specific rhythmic reference (groove, feel) */
  readonly rhythmicReference: string | null;
}

/**
 * Rhythmic targets.
 */
export type RhythmicTarget =
  | 'tightness'       // Quantization / precision
  | 'swing'           // Swing amount
  | 'groove'          // Overall groove quality
  | 'complexity'      // Rhythmic complexity
  | 'density'         // Note density / busyness
  | 'syncopation'     // Off-beat emphasis
  | 'humanize'        // Timing variation (anti-quantize)
  | 'tempo'           // BPM
  | 'shuffle'         // Shuffle amount
  | 'push'            // Playing ahead of beat
  | 'drag'            // Playing behind beat
  | 'pocket';         // In-the-pocket feel

/**
 * Melodic Goal: Change melody qualities.
 */
export interface MelodicMusicalGoal extends MusicalGoalBase {
  readonly category: 'melodic';
  readonly strategy: 'heuristic' | 'structural_edit';

  /** Melodic quality being targeted */
  readonly melodicTarget: MelodicTarget;

  /** Direction */
  readonly direction: 'increase' | 'decrease' | 'set';

  /** Reference melody (if comparative) */
  readonly melodicReference: string | null;
}

/**
 * Melodic targets.
 */
export type MelodicTarget =
  | 'memorability'    // How catchy / memorable
  | 'complexity'      // Melodic complexity
  | 'range'           // Pitch range used
  | 'contour'         // Shape of the melody
  | 'stepwise'        // Preference for stepwise motion
  | 'leaping'         // Preference for large intervals
  | 'repetition'      // Amount of motif repetition
  | 'variation'       // Amount of melodic variation
  | 'singability'     // Ease of singing
  | 'expressiveness'; // Emotional range of the melody

/**
 * Production Goal: Change mix / mastering qualities.
 */
export interface ProductionMusicalGoal extends MusicalGoalBase {
  readonly category: 'production';
  readonly strategy: 'multi_axis' | 'composite' | 'parameter_set';

  /** Production quality being targeted */
  readonly productionTarget: ProductionTarget;

  /** Direction */
  readonly direction: 'increase' | 'decrease' | 'set';

  /** Reference standard (if matching) */
  readonly referenceStandard: string | null;
}

/**
 * Production targets.
 */
export type ProductionTarget =
  | 'clarity'          // Mix clarity
  | 'separation'       // Instrument separation
  | 'balance'          // Mix balance (volume distribution)
  | 'polish'           // Overall polish / finish
  | 'loudness_standard' // Loudness normalization target
  | 'headroom'         // Peak headroom
  | 'frequency_balance' // Spectral balance
  | 'stereo_image'     // Stereo field quality
  | 'phase_coherence'  // Phase alignment
  | 'noise_floor'      // Background noise level
  | 'transient_response' // How well transients are preserved
  | 'tonal_balance';   // Overall tonal character

/**
 * Aesthetic Goal: High-level stylistic targets.
 */
export interface AestheticMusicalGoal extends MusicalGoalBase {
  readonly category: 'aesthetic';
  readonly strategy: 'reference_match' | 'composite' | 'heuristic';

  /** Aesthetic target descriptor */
  readonly aestheticTarget: string;

  /** Genre association (if any) */
  readonly genre: string | null;

  /** Era association (if any) */
  readonly era: string | null;

  /** Reference tracks (if any) */
  readonly referenceTracks: readonly string[];

  /** Axis recipe: how to approximate this aesthetic */
  readonly axisRecipe: readonly TimbralAxisContribution[];
}


// =============================================================================
// GOAL AMOUNT — how much of a change is desired
// =============================================================================

/**
 * How much change a goal implies.
 */
export interface GoalAmount {
  /** The kind of amount specification */
  readonly kind: GoalAmountKind;

  /** Numeric value (if applicable) */
  readonly value: number | null;

  /** Unit (if applicable): "dB", "semitones", "percent", "bpm" */
  readonly unit: string | null;

  /** Qualitative level */
  readonly qualitative: QualitativeAmount;

  /** Description text */
  readonly description: string;
}

/**
 * How the amount is specified.
 */
export type GoalAmountKind =
  | 'absolute'      // "3dB", "120 BPM"
  | 'relative'      // "+2dB", "a little more"
  | 'percentage'    // "50% more"
  | 'qualitative'   // "a lot", "slightly"
  | 'comparative'   // "more than the verse"
  | 'maximum'       // "as much as possible"
  | 'minimum';      // "as little as possible"

/**
 * Qualitative amount levels.
 */
export type QualitativeAmount =
  | 'imperceptible'  // Almost no change
  | 'subtle'         // Just noticeable
  | 'slight'         // Small but clear
  | 'moderate'       // Medium change
  | 'significant'    // Large change
  | 'dramatic'       // Very large change
  | 'extreme'        // Maximum possible change
  | 'unspecified';   // Not stated


// =============================================================================
// UNION TYPE FOR ALL MUSICAL GOALS
// =============================================================================

/**
 * Union of all musical goal types.
 */
export type MusicalGoal =
  | AxisMusicalGoal
  | StructuralMusicalGoal
  | TimbralMusicalGoal
  | SpatialMusicalGoal
  | DynamicMusicalGoal
  | HarmonicMusicalGoal
  | RhythmicMusicalGoal
  | MelodicMusicalGoal
  | ProductionMusicalGoal
  | AestheticMusicalGoal;


// =============================================================================
// TIMBRAL TARGET DATABASE — how timbral targets map to axes
// =============================================================================

/**
 * How a timbral target maps to perceptual axis adjustments.
 */
export interface TimbralTargetRecipe {
  /** The target name */
  readonly target: TimbralTarget;

  /** Human-readable description */
  readonly description: string;

  /** Axis contributions */
  readonly axes: readonly TimbralAxisContribution[];

  /** Common levers to adjust */
  readonly typicalLevers: readonly string[];

  /** Opposite timbral target */
  readonly opposite: TimbralTarget | null;

  /** Related timbral targets */
  readonly related: readonly TimbralTarget[];
}

/**
 * Database of timbral target recipes.
 */
export const TIMBRAL_TARGET_RECIPES: ReadonlyMap<TimbralTarget, TimbralTargetRecipe> = new Map([
  ['vintage', {
    target: 'vintage',
    description: 'Old-school, analog character with warmth and gentle saturation',
    axes: [
      { axisName: 'warmth', direction: 'increase', weight: 0.8, rationale: 'Vintage = warm' },
      { axisName: 'saturation', direction: 'increase', weight: 0.6, rationale: 'Analog saturation' },
      { axisName: 'brightness', direction: 'decrease', weight: 0.4, rationale: 'Rolled-off highs' },
      { axisName: 'clarity', direction: 'decrease', weight: 0.3, rationale: 'Slight lo-fi character' },
    ],
    typicalLevers: ['saturation_amount', 'eq_high_gain', 'eq_low_mid_gain', 'tape_emulation'],
    opposite: 'modern',
    related: ['analog', 'warm'],
  }],
  ['modern', {
    target: 'modern',
    description: 'Clean, precise, digital-era sound',
    axes: [
      { axisName: 'clarity', direction: 'increase', weight: 0.8, rationale: 'Modern = clear' },
      { axisName: 'brightness', direction: 'increase', weight: 0.5, rationale: 'Open high end' },
      { axisName: 'punch', direction: 'increase', weight: 0.4, rationale: 'Tight transients' },
    ],
    typicalLevers: ['eq_presence', 'transient_attack', 'compressor_attack'],
    opposite: 'vintage',
    related: ['digital', 'clean', 'crisp'],
  }],
  ['analog', {
    target: 'analog',
    description: 'Analog warmth with harmonic richness',
    axes: [
      { axisName: 'warmth', direction: 'increase', weight: 0.9, rationale: 'Core analog quality' },
      { axisName: 'saturation', direction: 'increase', weight: 0.7, rationale: 'Harmonic content' },
    ],
    typicalLevers: ['saturation_amount', 'tube_drive', 'tape_emulation', 'eq_low_mid_gain'],
    opposite: 'digital',
    related: ['vintage', 'warm'],
  }],
  ['digital', {
    target: 'digital',
    description: 'Clean, precise digital character',
    axes: [
      { axisName: 'clarity', direction: 'increase', weight: 0.8, rationale: 'Clean signal path' },
      { axisName: 'saturation', direction: 'decrease', weight: 0.5, rationale: 'No harmonic distortion' },
    ],
    typicalLevers: ['eq_presence', 'noise_gate'],
    opposite: 'analog',
    related: ['modern', 'clean'],
  }],
  ['warm', {
    target: 'warm',
    description: 'Rich low-mid content with gentle harmonics',
    axes: [
      { axisName: 'warmth', direction: 'increase', weight: 1.0, rationale: 'Direct axis match' },
    ],
    typicalLevers: ['eq_low_mid_gain', 'saturation_amount', 'tube_drive'],
    opposite: 'cold',
    related: ['analog', 'thick'],
  }],
  ['cold', {
    target: 'cold',
    description: 'Clinical, sterile, lacking warmth',
    axes: [
      { axisName: 'warmth', direction: 'decrease', weight: 1.0, rationale: 'Direct axis match' },
      { axisName: 'brightness', direction: 'increase', weight: 0.3, rationale: 'Bright without warmth' },
    ],
    typicalLevers: ['eq_low_mid_gain', 'saturation_amount'],
    opposite: 'warm',
    related: ['digital', 'thin'],
  }],
  ['gritty', {
    target: 'gritty',
    description: 'Raw, distorted, textured',
    axes: [
      { axisName: 'saturation', direction: 'increase', weight: 0.9, rationale: 'Core distortion' },
      { axisName: 'punch', direction: 'increase', weight: 0.5, rationale: 'Aggressive transients' },
      { axisName: 'clarity', direction: 'decrease', weight: 0.3, rationale: 'Rougher sound' },
    ],
    typicalLevers: ['drive', 'saturation_amount', 'bit_crush', 'distortion_amount'],
    opposite: 'clean',
    related: ['raw', 'aggressive', 'harsh'],
  }],
  ['clean', {
    target: 'clean',
    description: 'No distortion, transparent signal path',
    axes: [
      { axisName: 'saturation', direction: 'decrease', weight: 0.9, rationale: 'Remove distortion' },
      { axisName: 'clarity', direction: 'increase', weight: 0.7, rationale: 'Transparent path' },
    ],
    typicalLevers: ['drive', 'saturation_amount', 'distortion_amount'],
    opposite: 'gritty',
    related: ['digital', 'polished'],
  }],
  ['thick', {
    target: 'thick',
    description: 'Full, dense, substantial',
    axes: [
      { axisName: 'density', direction: 'increase', weight: 0.8, rationale: 'Core density' },
      { axisName: 'warmth', direction: 'increase', weight: 0.5, rationale: 'Fullness' },
    ],
    typicalLevers: ['unison_voices', 'chorus_amount', 'eq_low_gain', 'layer_count'],
    opposite: 'thin',
    related: ['warm', 'heavy', 'lush'],
  }],
  ['thin', {
    target: 'thin',
    description: 'Sparse, lacking body',
    axes: [
      { axisName: 'density', direction: 'decrease', weight: 0.8, rationale: 'Core density reduction' },
      { axisName: 'warmth', direction: 'decrease', weight: 0.4, rationale: 'Less body' },
    ],
    typicalLevers: ['eq_low_gain', 'unison_voices', 'layer_count'],
    opposite: 'thick',
    related: ['cold', 'clean'],
  }],
  ['airy', {
    target: 'airy',
    description: 'Open, spacious high-end',
    axes: [
      { axisName: 'brightness', direction: 'increase', weight: 0.7, rationale: 'Open high end' },
      { axisName: 'depth', direction: 'increase', weight: 0.5, rationale: 'Spaciousness' },
      { axisName: 'width', direction: 'increase', weight: 0.4, rationale: 'Openness' },
    ],
    typicalLevers: ['eq_high_gain', 'reverb_amount', 'stereo_width', 'exciter_amount'],
    opposite: 'dark',
    related: ['bright', 'ethereal', 'lush'],
  }],
  ['dark', {
    target: 'dark',
    description: 'Low-end focused, muted highs',
    axes: [
      { axisName: 'brightness', direction: 'decrease', weight: 0.9, rationale: 'Core darkness' },
      { axisName: 'warmth', direction: 'increase', weight: 0.4, rationale: 'Low-end emphasis' },
    ],
    typicalLevers: ['filter_cutoff', 'eq_high_gain', 'damping'],
    opposite: 'bright',
    related: ['warm', 'heavy'],
  }],
  ['bright', {
    target: 'bright',
    description: 'High-end focused, open',
    axes: [
      { axisName: 'brightness', direction: 'increase', weight: 1.0, rationale: 'Direct axis match' },
    ],
    typicalLevers: ['eq_high_gain', 'exciter_amount', 'filter_cutoff'],
    opposite: 'dark',
    related: ['airy', 'crisp'],
  }],
  ['crisp', {
    target: 'crisp',
    description: 'Clear, defined transients',
    axes: [
      { axisName: 'clarity', direction: 'increase', weight: 0.8, rationale: 'Definition' },
      { axisName: 'punch', direction: 'increase', weight: 0.6, rationale: 'Transient definition' },
      { axisName: 'brightness', direction: 'increase', weight: 0.3, rationale: 'Presence' },
    ],
    typicalLevers: ['transient_attack', 'eq_presence', 'compressor_attack'],
    opposite: 'muddy',
    related: ['clean', 'bright', 'polished'],
  }],
  ['muddy', {
    target: 'muddy',
    description: 'Unclear, boomy, lacking definition',
    axes: [
      { axisName: 'clarity', direction: 'decrease', weight: 0.8, rationale: 'Lack of definition' },
    ],
    typicalLevers: ['eq_low_mid_gain', 'eq_presence'],
    opposite: 'crisp',
    related: ['dark', 'thick'],
  }],
  ['lush', {
    target: 'lush',
    description: 'Rich, layered, reverberant',
    axes: [
      { axisName: 'depth', direction: 'increase', weight: 0.8, rationale: 'Reverberance' },
      { axisName: 'density', direction: 'increase', weight: 0.6, rationale: 'Layered quality' },
      { axisName: 'width', direction: 'increase', weight: 0.5, rationale: 'Spaciousness' },
      { axisName: 'warmth', direction: 'increase', weight: 0.4, rationale: 'Richness' },
    ],
    typicalLevers: ['reverb_amount', 'chorus_amount', 'stereo_width', 'unison_voices'],
    opposite: 'dry',
    related: ['thick', 'airy', 'ethereal'],
  }],
  ['dry', {
    target: 'dry',
    description: 'No ambience, close and direct',
    axes: [
      { axisName: 'depth', direction: 'decrease', weight: 0.9, rationale: 'No reverb/ambience' },
      { axisName: 'intimacy', direction: 'increase', weight: 0.4, rationale: 'Close and direct' },
    ],
    typicalLevers: ['reverb_amount', 'delay_mix', 'room_size'],
    opposite: 'wet',
    related: ['clean', 'raw'],
  }],
  ['wet', {
    target: 'wet',
    description: 'Heavy effects, lots of reverb/delay',
    axes: [
      { axisName: 'depth', direction: 'increase', weight: 0.9, rationale: 'Lots of ambience' },
    ],
    typicalLevers: ['reverb_amount', 'delay_mix', 'chorus_amount'],
    opposite: 'dry',
    related: ['lush', 'ethereal'],
  }],
  ['punchy', {
    target: 'punchy',
    description: 'Strong transients, impact',
    axes: [
      { axisName: 'punch', direction: 'increase', weight: 1.0, rationale: 'Direct axis match' },
      { axisName: 'energy', direction: 'increase', weight: 0.4, rationale: 'Impact' },
    ],
    typicalLevers: ['compressor_attack', 'transient_attack', 'gate_threshold'],
    opposite: 'soft',
    related: ['aggressive', 'heavy'],
  }],
  ['soft', {
    target: 'soft',
    description: 'Gentle, understated',
    axes: [
      { axisName: 'punch', direction: 'decrease', weight: 0.8, rationale: 'Reduced transients' },
      { axisName: 'energy', direction: 'decrease', weight: 0.5, rationale: 'Gentle energy' },
    ],
    typicalLevers: ['compressor_attack', 'transient_attack', 'fader_level'],
    opposite: 'punchy',
    related: ['gentle', 'smooth'],
  }],
  ['raw', {
    target: 'raw',
    description: 'Unprocessed, natural',
    axes: [
      { axisName: 'saturation', direction: 'decrease', weight: 0.3, rationale: 'Less processing (or intentional grit)' },
      { axisName: 'clarity', direction: 'decrease', weight: 0.2, rationale: 'Unpolished' },
    ],
    typicalLevers: [],
    opposite: 'polished',
    related: ['gritty', 'organic'],
  }],
  ['polished', {
    target: 'polished',
    description: 'Highly processed, finished',
    axes: [
      { axisName: 'clarity', direction: 'increase', weight: 0.7, rationale: 'Clean finish' },
      { axisName: 'punch', direction: 'increase', weight: 0.3, rationale: 'Tight dynamics' },
    ],
    typicalLevers: ['compressor_ratio', 'limiter_threshold', 'eq_presence'],
    opposite: 'raw',
    related: ['modern', 'clean', 'crisp'],
  }],
  ['ethereal', {
    target: 'ethereal',
    description: 'Dreamy, otherworldly, atmospheric',
    axes: [
      { axisName: 'depth', direction: 'increase', weight: 0.9, rationale: 'Lots of space' },
      { axisName: 'width', direction: 'increase', weight: 0.7, rationale: 'Expansive' },
      { axisName: 'brightness', direction: 'increase', weight: 0.4, rationale: 'Shimmer' },
      { axisName: 'warmth', direction: 'increase', weight: 0.3, rationale: 'Gentle warmth' },
    ],
    typicalLevers: ['reverb_amount', 'reverb_decay', 'stereo_width', 'delay_feedback', 'shimmer'],
    opposite: 'heavy',
    related: ['lush', 'airy'],
  }],
  ['heavy', {
    target: 'heavy',
    description: 'Dense, bass-heavy, powerful',
    axes: [
      { axisName: 'energy', direction: 'increase', weight: 0.8, rationale: 'Power' },
      { axisName: 'density', direction: 'increase', weight: 0.7, rationale: 'Density' },
      { axisName: 'punch', direction: 'increase', weight: 0.6, rationale: 'Impact' },
    ],
    typicalLevers: ['eq_low_gain', 'compressor_ratio', 'saturation_amount', 'gain'],
    opposite: 'ethereal',
    related: ['aggressive', 'thick', 'punchy'],
  }],
  ['harsh', {
    target: 'harsh',
    description: 'Aggressive, biting high-frequency content',
    axes: [
      { axisName: 'brightness', direction: 'increase', weight: 0.7, rationale: 'Sharp highs' },
      { axisName: 'saturation', direction: 'increase', weight: 0.5, rationale: 'Distortion' },
    ],
    typicalLevers: ['eq_high_gain', 'distortion_amount', 'exciter_amount'],
    opposite: 'smooth',
    related: ['aggressive', 'gritty', 'bright'],
  }],
  ['smooth', {
    target: 'smooth',
    description: 'Rounded, no harsh edges',
    axes: [
      { axisName: 'brightness', direction: 'decrease', weight: 0.4, rationale: 'Reduced harshness' },
      { axisName: 'saturation', direction: 'decrease', weight: 0.3, rationale: 'No harsh distortion' },
    ],
    typicalLevers: ['eq_high_gain', 'filter_cutoff', 'de_esser'],
    opposite: 'harsh',
    related: ['warm', 'soft', 'gentle'],
  }],
  ['organic', {
    target: 'organic',
    description: 'Natural, acoustic-sounding',
    axes: [
      { axisName: 'warmth', direction: 'increase', weight: 0.5, rationale: 'Natural warmth' },
      { axisName: 'depth', direction: 'increase', weight: 0.3, rationale: 'Natural room' },
    ],
    typicalLevers: ['room_reverb', 'tape_emulation', 'saturation_amount'],
    opposite: 'synthetic',
    related: ['warm', 'vintage', 'raw'],
  }],
  ['synthetic', {
    target: 'synthetic',
    description: 'Obviously electronic/synthesized',
    axes: [
      { axisName: 'clarity', direction: 'increase', weight: 0.5, rationale: 'Digital precision' },
    ],
    typicalLevers: ['oscillator_type', 'filter_resonance', 'modulation_depth'],
    opposite: 'organic',
    related: ['modern', 'digital'],
  }],
  ['aggressive', {
    target: 'aggressive',
    description: 'Hard-hitting, intense',
    axes: [
      { axisName: 'energy', direction: 'increase', weight: 0.9, rationale: 'Intensity' },
      { axisName: 'punch', direction: 'increase', weight: 0.7, rationale: 'Impact' },
      { axisName: 'saturation', direction: 'increase', weight: 0.5, rationale: 'Drive' },
    ],
    typicalLevers: ['compressor_ratio', 'saturation_amount', 'transient_attack', 'gain'],
    opposite: 'gentle',
    related: ['gritty', 'heavy', 'punchy', 'harsh'],
  }],
  ['gentle', {
    target: 'gentle',
    description: 'Soft, delicate, understated',
    axes: [
      { axisName: 'energy', direction: 'decrease', weight: 0.7, rationale: 'Low energy' },
      { axisName: 'punch', direction: 'decrease', weight: 0.6, rationale: 'Soft transients' },
    ],
    typicalLevers: ['fader_level', 'compressor_attack', 'transient_attack'],
    opposite: 'aggressive',
    related: ['soft', 'smooth'],
  }],
]);


// =============================================================================
// GOAL CONSTRUCTORS
// =============================================================================

let _goalIdCounter = 0;
function nextGoalId(): string {
  return `goal_${++_goalIdCounter}`;
}

/**
 * Create an axis musical goal.
 */
export function createAxisGoal(
  axisName: string,
  direction: 'increase' | 'decrease' | 'set',
  opts: {
    amount?: GoalAmount | null;
    scope?: MusicalGoalScope | null;
    priority?: GoalPriority;
    sourceText?: string | null;
    impliedLevers?: readonly string[];
    comparisonRef?: string | null;
  } = {},
): AxisMusicalGoal {
  return {
    id: nextGoalId(),
    category: 'axis',
    description: `${direction} ${axisName}`,
    strategy: 'direct',
    precision: opts.amount ? 'approximate' : 'directional',
    priority: opts.priority ?? 'normal',
    scope: opts.scope ?? null,
    explicit: true,
    confidence: 0.9,
    sourceText: opts.sourceText ?? null,
    sourceSpan: null,
    relatedGoals: [],
    prerequisites: [],
    antiGoals: [],
    axisName,
    direction,
    amount: opts.amount ?? null,
    comparisonRef: opts.comparisonRef ?? null,
    impliedLevers: opts.impliedLevers ?? [],
  };
}

/**
 * Create a structural musical goal.
 */
export function createStructuralGoal(
  action: StructuralActionKind,
  targetType: string,
  opts: {
    targetName?: string | null;
    location?: string | null;
    count?: number | null;
    scope?: MusicalGoalScope | null;
    priority?: GoalPriority;
    sourceText?: string | null;
  } = {},
): StructuralMusicalGoal {
  return {
    id: nextGoalId(),
    category: 'structural',
    description: `${action} ${targetType}`,
    strategy: 'structural_edit',
    precision: 'specific',
    priority: opts.priority ?? 'normal',
    scope: opts.scope ?? null,
    explicit: true,
    confidence: 0.9,
    sourceText: opts.sourceText ?? null,
    sourceSpan: null,
    relatedGoals: [],
    prerequisites: [],
    antiGoals: [],
    structuralAction: action,
    targetElementType: targetType,
    targetElementName: opts.targetName ?? null,
    location: opts.location ?? null,
    count: opts.count ?? null,
  };
}

/**
 * Create a timbral musical goal from a timbral target.
 */
export function createTimbralGoal(
  target: TimbralTarget,
  opts: {
    intensity?: number;
    scope?: MusicalGoalScope | null;
    priority?: GoalPriority;
    sourceText?: string | null;
    referenceSound?: string | null;
  } = {},
): TimbralMusicalGoal {
  const recipe = TIMBRAL_TARGET_RECIPES.get(target);
  return {
    id: nextGoalId(),
    category: 'timbral',
    description: `Achieve ${target} sound`,
    strategy: 'multi_axis',
    precision: 'directional',
    priority: opts.priority ?? 'normal',
    scope: opts.scope ?? null,
    explicit: true,
    confidence: 0.85,
    sourceText: opts.sourceText ?? null,
    sourceSpan: null,
    relatedGoals: [],
    prerequisites: [],
    antiGoals: recipe?.opposite ? [`avoid ${recipe.opposite}`] : [],
    timbralTarget: target,
    intensity: opts.intensity ?? 0.7,
    referenceSound: opts.referenceSound ?? null,
    contributingAxes: recipe?.axes ?? [],
  };
}

/**
 * Create a dynamic musical goal.
 */
export function createDynamicGoal(
  target: DynamicTarget,
  direction: 'increase' | 'decrease' | 'set',
  opts: {
    amount?: GoalAmount | null;
    contour?: DynamicContour | null;
    scope?: MusicalGoalScope | null;
    priority?: GoalPriority;
    sourceText?: string | null;
  } = {},
): DynamicMusicalGoal {
  return {
    id: nextGoalId(),
    category: 'dynamic',
    description: `${direction} ${target}`,
    strategy: opts.contour ? 'contour_shape' : 'direct',
    precision: opts.amount ? 'approximate' : 'directional',
    priority: opts.priority ?? 'normal',
    scope: opts.scope ?? null,
    explicit: true,
    confidence: 0.9,
    sourceText: opts.sourceText ?? null,
    sourceSpan: null,
    relatedGoals: [],
    prerequisites: [],
    antiGoals: [],
    dynamicTarget: target,
    direction,
    amount: opts.amount ?? null,
    contour: opts.contour ?? null,
  };
}

/**
 * Create an aesthetic musical goal.
 */
export function createAestheticGoal(
  aestheticTarget: string,
  opts: {
    genre?: string | null;
    era?: string | null;
    referenceTracks?: readonly string[];
    scope?: MusicalGoalScope | null;
    priority?: GoalPriority;
    sourceText?: string | null;
  } = {},
): AestheticMusicalGoal {
  return {
    id: nextGoalId(),
    category: 'aesthetic',
    description: `Achieve ${aestheticTarget} aesthetic`,
    strategy: 'reference_match',
    precision: 'vague',
    priority: opts.priority ?? 'normal',
    scope: opts.scope ?? null,
    explicit: true,
    confidence: 0.7,
    sourceText: opts.sourceText ?? null,
    sourceSpan: null,
    relatedGoals: [],
    prerequisites: [],
    antiGoals: [],
    aestheticTarget,
    genre: opts.genre ?? null,
    era: opts.era ?? null,
    referenceTracks: opts.referenceTracks ?? [],
    axisRecipe: [],
  };
}


// =============================================================================
// GOAL-TO-CPL BRIDGE — mapping musical goals to CPL structures
// =============================================================================

/**
 * Convert a musical goal to a CPLGoal.
 * This bridges the semantic goal representation to the CPL formalism.
 */
export function musicalGoalToCPL(goal: MusicalGoal): CPLGoal {
  switch (goal.category) {
    case 'axis': {
      const base: CPLGoal = {
        type: 'goal',
        id: goal.id,
        variant: 'axis-goal',
      };
      return Object.assign(base, {
        axis: goal.axisName,
        direction: goal.direction,
      });
    }
    case 'structural': {
      return {
        type: 'goal',
        id: goal.id,
        variant: 'structural-goal',
      };
    }
    case 'timbral': {
      // Timbral goals map to axis-goal on the primary contributing axis
      const primaryAxis = goal.contributingAxes.length > 0
        ? goal.contributingAxes.reduce((a, b) => a.weight > b.weight ? a : b)
        : null;
      const base: CPLGoal = {
        type: 'goal',
        id: goal.id,
        variant: 'axis-goal',
      };
      if (primaryAxis) {
        return Object.assign(base, {
          axis: primaryAxis.axisName,
          direction: primaryAxis.direction,
        });
      }
      return base;
    }
    case 'spatial': {
      const base: CPLGoal = {
        type: 'goal',
        id: goal.id,
        variant: 'axis-goal',
      };
      return Object.assign(base, {
        axis: goal.spatialDimension,
        direction: goal.direction,
      });
    }
    case 'dynamic': {
      const base: CPLGoal = {
        type: 'goal',
        id: goal.id,
        variant: 'axis-goal',
      };
      return Object.assign(base, {
        axis: goal.dynamicTarget,
        direction: goal.direction,
      });
    }
    case 'harmonic': {
      const base: CPLGoal = {
        type: 'goal',
        id: goal.id,
        variant: 'axis-goal',
      };
      return Object.assign(base, {
        axis: goal.harmonicTarget,
        direction: goal.direction,
      });
    }
    case 'rhythmic': {
      const base: CPLGoal = {
        type: 'goal',
        id: goal.id,
        variant: 'axis-goal',
      };
      return Object.assign(base, {
        axis: goal.rhythmicTarget,
        direction: goal.direction,
      });
    }
    case 'melodic': {
      const base: CPLGoal = {
        type: 'goal',
        id: goal.id,
        variant: 'axis-goal',
      };
      return Object.assign(base, {
        axis: goal.melodicTarget,
        direction: goal.direction,
      });
    }
    case 'production': {
      return {
        type: 'goal',
        id: goal.id,
        variant: 'production-goal',
      };
    }
    case 'aesthetic': {
      return {
        type: 'goal',
        id: goal.id,
        variant: 'production-goal',
      };
    }
  }
}


// =============================================================================
// GOAL ANALYSIS UTILITIES
// =============================================================================

/**
 * Detect potential conflicts between goals.
 */
export function detectGoalConflicts(goals: readonly MusicalGoal[]): readonly GoalConflict[] {
  const conflicts: GoalConflict[] = [];

  for (let i = 0; i < goals.length; i++) {
    for (let j = i + 1; j < goals.length; j++) {
      const a = goals[i] as MusicalGoal | undefined;
      const b = goals[j] as MusicalGoal | undefined;
      if (!a || !b) continue;
      const conflict = checkPairConflict(a, b);
      if (conflict) {
        conflicts.push(conflict);
      }
    }
  }

  return conflicts;
}

/**
 * A conflict between two goals.
 */
export interface GoalConflict {
  /** First goal */
  readonly goalA: string;

  /** Second goal */
  readonly goalB: string;

  /** Conflict type */
  readonly conflictType: GoalConflictType;

  /** Description */
  readonly description: string;

  /** Severity (how serious the conflict is) */
  readonly severity: 'hard' | 'soft' | 'potential';
}

/**
 * Types of goal conflicts.
 */
export type GoalConflictType =
  | 'axis_direction'     // Same axis, opposite directions
  | 'timbral_opposite'   // Opposite timbral targets
  | 'resource_contention' // Same scope, conflicting changes
  | 'logical_contradiction' // Logically impossible combination
  | 'priority_clash';    // Both critical, conflicting

function checkPairConflict(a: MusicalGoal, b: MusicalGoal): GoalConflict | null {
  // Axis direction conflict: same axis, opposite directions
  if (a.category === 'axis' && b.category === 'axis') {
    if (a.axisName === b.axisName && a.direction !== b.direction && a.direction !== 'set' && b.direction !== 'set') {
      return {
        goalA: a.id,
        goalB: b.id,
        conflictType: 'axis_direction',
        description: `Conflicting directions for axis "${a.axisName}": ${a.direction} vs ${b.direction}`,
        severity: 'hard',
      };
    }
  }

  // Timbral opposite conflict
  if (a.category === 'timbral' && b.category === 'timbral') {
    const recipeA = TIMBRAL_TARGET_RECIPES.get(a.timbralTarget);
    if (recipeA && recipeA.opposite === b.timbralTarget) {
      return {
        goalA: a.id,
        goalB: b.id,
        conflictType: 'timbral_opposite',
        description: `Opposite timbral targets: "${a.timbralTarget}" vs "${b.timbralTarget}"`,
        severity: 'hard',
      };
    }
  }

  return null;
}

/**
 * Compute a summary of a set of musical goals.
 */
export function computeGoalSummary(goals: readonly MusicalGoal[]): GoalSummary {
  const byCategory: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byStrategy: Record<string, number> = {};
  const axes = new Set<string>();

  for (const goal of goals) {
    byCategory[goal.category] = (byCategory[goal.category] ?? 0) + 1;
    byPriority[goal.priority] = (byPriority[goal.priority] ?? 0) + 1;
    byStrategy[goal.strategy] = (byStrategy[goal.strategy] ?? 0) + 1;

    if (goal.category === 'axis') {
      axes.add(goal.axisName);
    }
  }

  return {
    totalGoals: goals.length,
    byCategory,
    byPriority,
    byStrategy,
    uniqueAxes: axes.size,
    conflicts: detectGoalConflicts(goals),
  };
}

/**
 * Summary of a goal set.
 */
export interface GoalSummary {
  readonly totalGoals: number;
  readonly byCategory: Readonly<Record<string, number>>;
  readonly byPriority: Readonly<Record<string, number>>;
  readonly byStrategy: Readonly<Record<string, number>>;
  readonly uniqueAxes: number;
  readonly conflicts: readonly GoalConflict[];
}

/**
 * Format a goal summary as a report string.
 */
export function formatGoalSummaryReport(summary: GoalSummary): string {
  const lines: string[] = [
    '=== Musical Goals Summary ===',
    `Total goals: ${summary.totalGoals}`,
    `Unique axes: ${summary.uniqueAxes}`,
    `Conflicts: ${summary.conflicts.length}`,
    '',
    'By category:',
  ];
  for (const [cat, count] of Object.entries(summary.byCategory)) {
    lines.push(`  ${cat}: ${count}`);
  }
  lines.push('', 'By priority:');
  for (const [pri, count] of Object.entries(summary.byPriority)) {
    lines.push(`  ${pri}: ${count}`);
  }
  lines.push('', 'By strategy:');
  for (const [strat, count] of Object.entries(summary.byStrategy)) {
    lines.push(`  ${strat}: ${count}`);
  }
  if (summary.conflicts.length > 0) {
    lines.push('', 'Conflicts:');
    for (const conflict of summary.conflicts) {
      lines.push(`  [${conflict.severity}] ${conflict.description}`);
    }
  }
  return lines.join('\n');
}
