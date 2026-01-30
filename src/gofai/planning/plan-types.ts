/**
 * CPL-Plan Types and Core Musical Edit Opcodes
 * 
 * Implements Step 251-252 from gofai_goalB.md:
 * - Define CPL-Plan as a sequence of typed opcodes with explicit scopes, preconditions, and postconditions
 * - Define plan opcodes for core musical edits
 * 
 * This module defines the typed intermediate representation between user intent (CPL-Intent)
 * and executable host actions. Plans are deterministic, bounded sequences of operations
 * that can be validated, scored, previewed, and applied with full undo support.
 * 
 * @module gofai/planning/plan-types
 */

import type { CPLScope, CPLGoal, CPLConstraint } from '../canon/cpl-types';
import type { CapabilityId } from '../canon/capability-model';
import type { PerceptualAxis } from '../canon/perceptual-axes';

/**
 * Unique identifier for a plan opcode type
 * 
 * Namespacing rules:
 * - Builtin opcodes: `opcode:<category>:<name>` (e.g., `opcode:event:shift_timing`)
 * - Extension opcodes: `<namespace>:opcode:<category>:<name>` (e.g., `my-pack:opcode:fx:stutter`)
 */
export type OpcodeId = string & { readonly __brand: 'OpcodeId' };

/**
 * Create an opcode ID with proper namespacing
 */
export function createOpcodeId(category: string, name: string, namespace?: string): OpcodeId {
  if (namespace) {
    return `${namespace}:opcode:${category}:${name}` as OpcodeId;
  }
  return `opcode:${category}:${name}` as OpcodeId;
}

/**
 * Major categories of edit operations
 */
export type OpcodeCategory =
  | 'structure'     // Form, sections, markers
  | 'event'         // Note/event-level edits
  | 'harmony'       // Chord progressions, voicings
  | 'melody'        // Melodic contour, ornamentation
  | 'rhythm'        // Timing, groove, quantization
  | 'texture'       // Density, layering
  | 'production'    // DSP parameters, mixing
  | 'routing'       // Signal flow, card graph
  | 'metadata';     // Labels, colors, annotations

/**
 * Risk level for an opcode
 * Determines whether preview/confirmation is required
 */
export type OpcodeRisk =
  | 'safe'          // Fully reversible, low impact (e.g., change color)
  | 'low'           // Reversible, affects interpretation (e.g., transpose)
  | 'moderate'      // Affects creative content (e.g., thin texture)
  | 'high'          // Destructive or hard to reverse (e.g., delete events)
  | 'critical';     // Potentially catastrophic (e.g., clear all)

/**
 * Preconditions that must be met before an opcode can execute
 */
export interface OpcodePrecondition {
  readonly type: 'has-events' | 'has-harmony' | 'has-meter' | 'has-tempo' | 'capability' | 'analysis';
  readonly description: string;
  readonly required: boolean; // false = warning, true = error if unmet
}

/**
 * Expected effects after opcode execution
 */
export interface OpcodePostcondition {
  readonly type: 'events-changed' | 'harmony-changed' | 'structure-changed' | 'params-changed' | 'routing-changed';
  readonly description: string;
  readonly scope: CPLScope;
}

/**
 * Base opcode definition
 * All specific opcodes extend this interface
 */
export interface BaseOpcode {
  readonly id: OpcodeId;
  readonly category: OpcodeCategory;
  readonly name: string;
  readonly description: string;
  
  /** Scope this opcode operates on */
  readonly scope: CPLScope;
  
  /** Parameters for this opcode instance */
  readonly params: Record<string, unknown>;
  
  /** Required capabilities to execute */
  readonly requiredCapabilities: readonly CapabilityId[];
  
  /** Conditions that must be met before execution */
  readonly preconditions: readonly OpcodePrecondition[];
  
  /** Expected effects after execution */
  readonly postconditions: readonly OpcodePostcondition[];
  
  /** Estimated cost (for plan scoring) */
  readonly cost: number;
  
  /** Risk level */
  readonly risk: OpcodeRisk;
  
  /** Is this opcode destructive (deletes/replaces content)? */
  readonly destructive: boolean;
  
  /** Does this opcode require preview before apply? */
  readonly requiresPreview: boolean;
  
  /** Human-readable reason why this opcode is in the plan */
  readonly reason?: string;
  
  /** Link back to the goal(s) this opcode satisfies */
  readonly satisfiesGoals?: readonly string[];
  
  /** Link back to constraints this opcode respects */
  readonly respectsConstraints?: readonly string[];
}

/**
 * Structure opcodes - operate on song form, sections, markers
 */
export type StructureOpcode =
  | DuplicateSectionOpcode
  | InsertBreakOpcode
  | ExtendSectionOpcode
  | ShortenSectionOpcode
  | InsertPickupOpcode
  | AddBuildOpcode
  | AddDropOpcode
  | AddBreakdownOpcode;

export interface DuplicateSectionOpcode extends BaseOpcode {
  readonly category: 'structure';
  readonly type: 'duplicate_section';
  readonly params: {
    readonly sectionIndex: number;
    readonly insertAfter?: boolean;
    readonly withVariation?: boolean;
  };
}

export interface InsertBreakOpcode extends BaseOpcode {
  readonly category: 'structure';
  readonly type: 'insert_break';
  readonly params: {
    readonly atBar: number;
    readonly durationBars: number;
    readonly fadeOut?: boolean;
    readonly fadeIn?: boolean;
  };
}

export interface ExtendSectionOpcode extends BaseOpcode {
  readonly category: 'structure';
  readonly type: 'extend_section';
  readonly params: {
    readonly sectionIndex: number;
    readonly additionalBars: number;
    readonly repeatPattern?: boolean;
  };
}

export interface ShortenSectionOpcode extends BaseOpcode {
  readonly category: 'structure';
  readonly type: 'shorten_section';
  readonly params: {
    readonly sectionIndex: number;
    readonly removeBars: number;
    readonly fromEnd?: boolean;
  };
}

export interface InsertPickupOpcode extends BaseOpcode {
  readonly category: 'structure';
  readonly type: 'insert_pickup';
  readonly params: {
    readonly beforeSectionIndex: number;
    readonly durationBeats: number;
  };
}

export interface AddBuildOpcode extends BaseOpcode {
  readonly category: 'structure';
  readonly type: 'add_build';
  readonly params: {
    readonly startBar: number;
    readonly durationBars: number;
    readonly intensityCurve: 'linear' | 'exponential' | 'logarithmic';
  };
}

export interface AddDropOpcode extends BaseOpcode {
  readonly category: 'structure';
  readonly type: 'add_drop';
  readonly params: {
    readonly atBar: number;
    readonly dropType: 'full' | 'partial' | 'filtered';
  };
}

export interface AddBreakdownOpcode extends BaseOpcode {
  readonly category: 'structure';
  readonly type: 'add_breakdown';
  readonly params: {
    readonly startBar: number;
    readonly durationBars: number;
    readonly targetDensity: number; // 0.0 - 1.0
  };
}

/**
 * Event opcodes - operate on individual notes/events
 */
export type EventOpcode =
  | ShiftTimingOpcode
  | TransposePitchOpcode
  | QuantizeOpcode
  | AdjustVelocityOpcode
  | AdjustDurationOpcode
  | ThinDensityOpcode
  | DensifyOpcode
  | ShiftRegisterOpcode
  | HumanizeTimingOpcode;

export interface ShiftTimingOpcode extends BaseOpcode {
  readonly category: 'event';
  readonly type: 'shift_timing';
  readonly params: {
    readonly offsetTicks: number;
    readonly preserveRelativeOnsets?: boolean;
  };
}

export interface TransposePitchOpcode extends BaseOpcode {
  readonly category: 'event';
  readonly type: 'transpose_pitch';
  readonly params: {
    readonly semitones: number;
    readonly constrainToRange?: { min: number; max: number };
  };
}

export interface QuantizeOpcode extends BaseOpcode {
  readonly category: 'event';
  readonly type: 'quantize';
  readonly params: {
    readonly gridDivision: number; // e.g., 16 for 16th notes
    readonly strength: number;     // 0.0 - 1.0
    readonly affectOnsets?: boolean;
    readonly affectDurations?: boolean;
  };
}

export interface AdjustVelocityOpcode extends BaseOpcode {
  readonly category: 'event';
  readonly type: 'adjust_velocity';
  readonly params: {
    readonly delta?: number;       // Additive change
    readonly scale?: number;       // Multiplicative change
    readonly targetRange?: { min: number; max: number };
  };
}

export interface AdjustDurationOpcode extends BaseOpcode {
  readonly category: 'event';
  readonly type: 'adjust_duration';
  readonly params: {
    readonly scaleFactor: number;
    readonly minDuration?: number;
    readonly maxDuration?: number;
  };
}

export interface ThinDensityOpcode extends BaseOpcode {
  readonly category: 'event';
  readonly type: 'thin_density';
  readonly params: {
    readonly targetDensity: number; // 0.0 - 1.0
    readonly method: 'remove-weak' | 'remove-offbeat' | 'remove-passing' | 'statistical';
    readonly preserveDownbeats?: boolean;
  };
}

export interface DensifyOpcode extends BaseOpcode {
  readonly category: 'event';
  readonly type: 'densify';
  readonly params: {
    readonly targetDensity: number; // > 1.0
    readonly method: 'subdivide' | 'ornament' | 'arpeggio' | 'fill';
    readonly respectHarmony?: boolean;
  };
}

export interface ShiftRegisterOpcode extends BaseOpcode {
  readonly category: 'event';
  readonly type: 'shift_register';
  readonly params: {
    readonly octaves: number;
    readonly constrainToRange?: { min: number; max: number };
  };
}

export interface HumanizeTimingOpcode extends BaseOpcode {
  readonly category: 'event';
  readonly type: 'humanize_timing';
  readonly params: {
    readonly amount: number; // 0.0 - 1.0
    readonly maxDeviationTicks: number;
    readonly preserveGroove?: boolean;
  };
}

/**
 * Rhythm opcodes - operate on groove, swing, timing feel
 */
export type RhythmOpcode =
  | AdjustSwingOpcode
  | AdjustQuantizeStrengthOpcode
  | HalftimeOpcode
  | DoubletimeOpcode
  | ApplyGrooveTemplateOpcode;

export interface AdjustSwingOpcode extends BaseOpcode {
  readonly category: 'rhythm';
  readonly type: 'adjust_swing';
  readonly params: {
    readonly swingAmount: number; // 0.0 (straight) to 1.0 (max swing)
    readonly gridDivision: number; // 8 for 8th notes, 16 for 16ths
  };
}

export interface AdjustQuantizeStrengthOpcode extends BaseOpcode {
  readonly category: 'rhythm';
  readonly type: 'adjust_quantize_strength';
  readonly params: {
    readonly strength: number; // 0.0 (no quantize) to 1.0 (hard quantize)
    readonly gridDivision: number;
  };
}

export interface HalftimeOpcode extends BaseOpcode {
  readonly category: 'rhythm';
  readonly type: 'halftime';
  readonly params: {
    readonly preserveMelody?: boolean;
  };
}

export interface DoubletimeOpcode extends BaseOpcode {
  readonly category: 'rhythm';
  readonly type: 'doubletime';
  readonly params: {
    readonly preserveMelody?: boolean;
  };
}

export interface ApplyGrooveTemplateOpcode extends BaseOpcode {
  readonly category: 'rhythm';
  readonly type: 'apply_groove_template';
  readonly params: {
    readonly templateId: string;
    readonly strength: number; // 0.0 - 1.0
  };
}

/**
 * Harmony opcodes - operate on chord progressions and voicings
 */
export type HarmonyOpcode =
  | RevoiceOpcode
  | AddExtensionsOpcode
  | SubstituteChordsOpcode
  | ReharmonizeOpcode
  | AddPedalPointOpcode;

export interface RevoiceOpcode extends BaseOpcode {
  readonly category: 'harmony';
  readonly type: 'revoice';
  readonly params: {
    readonly voicingStyle: 'close' | 'open' | 'drop2' | 'drop3' | 'quartal';
    readonly registerTarget?: 'higher' | 'lower' | 'centered';
    readonly preserveMelody?: boolean;
  };
}

export interface AddExtensionsOpcode extends BaseOpcode {
  readonly category: 'harmony';
  readonly type: 'add_extensions';
  readonly params: {
    readonly extensions: readonly ('9' | '11' | '13')[];
    readonly avoidClashes?: boolean;
  };
}

export interface SubstituteChordsOpcode extends BaseOpcode {
  readonly category: 'harmony';
  readonly type: 'substitute_chords';
  readonly params: {
    readonly chordIndices?: readonly number[]; // specific chords, or all if undefined
    readonly substitutionType: 'tritone' | 'relative' | 'diminished' | 'chromatic-mediant';
    readonly preserveFunction?: boolean;
  };
}

export interface ReharmonizeOpcode extends BaseOpcode {
  readonly category: 'harmony';
  readonly type: 'reharmonize';
  readonly params: {
    readonly style: 'jazz' | 'classical' | 'contemporary' | 'modal';
    readonly complexity: number; // 0.0 (simple) to 1.0 (complex)
    readonly preserveMelody: boolean; // Always required for reharmonization
  };
}

export interface AddPedalPointOpcode extends BaseOpcode {
  readonly category: 'harmony';
  readonly type: 'add_pedal_point';
  readonly params: {
    readonly pitch: number; // MIDI note number
    readonly voice: 'bass' | 'soprano' | 'inner';
  };
}

/**
 * Melody opcodes - operate on melodic lines
 */
export type MelodyOpcode =
  | AddOrnamentationOpcode
  | ShapeContourOpcode
  | ExtendRangeOpcode
  | AddCountermelodyOpcode;

export interface AddOrnamentationOpcode extends BaseOpcode {
  readonly category: 'melody';
  readonly type: 'add_ornamentation';
  readonly params: {
    readonly ornamentTypes: readonly ('trill' | 'mordent' | 'turn' | 'grace-note' | 'slide')[];
    readonly density: number; // 0.0 - 1.0
    readonly respectStyle?: boolean;
  };
}

export interface ShapeContourOpcode extends BaseOpcode {
  readonly category: 'melody';
  readonly type: 'shape_contour';
  readonly params: {
    readonly targetShape: 'arch' | 'ascending' | 'descending' | 'wave';
    readonly preserveRhythm: boolean;
    readonly maxPitchChange?: number; // Semitones
  };
}

export interface ExtendRangeOpcode extends BaseOpcode {
  readonly category: 'melody';
  readonly type: 'extend_range';
  readonly params: {
    readonly direction: 'up' | 'down' | 'both';
    readonly targetRange: { min: number; max: number };
    readonly method: 'transpose' | 'octave-displacement' | 'contour-expansion';
  };
}

export interface AddCountermelodyOpcode extends BaseOpcode {
  readonly category: 'melody';
  readonly type: 'add_countermelody';
  readonly params: {
    readonly relationToMelody: 'contrary' | 'parallel' | 'oblique';
    readonly intervalRange: { min: number; max: number };
    readonly density?: number; // 0.0 - 1.0
  };
}

/**
 * Texture opcodes - operate on layering and density
 */
export type TextureOpcode =
  | ThinTextureOpcode
  | ThickenTextureOpcode
  | AddLayerOpcode
  | RemoveLayerOpcode
  | AdjustDensityCurveOpcode;

export interface ThinTextureOpcode extends BaseOpcode {
  readonly category: 'texture';
  readonly type: 'thin_texture';
  readonly params: {
    readonly targetLayers?: number;
    readonly removeMethod: 'least-salient' | 'highest-register' | 'lowest-register' | 'sparse-first';
    readonly preserveMelody?: boolean;
    readonly preserveHarmony?: boolean;
  };
}

export interface ThickenTextureOpcode extends BaseOpcode {
  readonly category: 'texture';
  readonly type: 'thicken_texture';
  readonly params: {
    readonly method: 'double' | 'octave-displacement' | 'chord-tones' | 'counter-rhythm';
    readonly targetLayers?: number;
  };
}

export interface AddLayerOpcode extends BaseOpcode {
  readonly category: 'texture';
  readonly type: 'add_layer';
  readonly params: {
    readonly role: 'pad' | 'rhythm' | 'bass' | 'counter-melody' | 'effect';
    readonly density: number; // 0.0 - 1.0
    readonly registerRange?: { min: number; max: number };
  };
}

export interface RemoveLayerOpcode extends BaseOpcode {
  readonly category: 'texture';
  readonly type: 'remove_layer';
  readonly params: {
    readonly layerRef: string; // Track/layer ID or role name
    readonly fadeOut?: boolean;
    readonly fadeDurationBeats?: number;
  };
}

export interface AdjustDensityCurveOpcode extends BaseOpcode {
  readonly category: 'texture';
  readonly type: 'adjust_density_curve';
  readonly params: {
    readonly curve: 'increasing' | 'decreasing' | 'arch' | 'valley' | 'flat';
    readonly startDensity: number; // 0.0 - 1.0
    readonly endDensity: number;   // 0.0 - 1.0
  };
}

/**
 * Production opcodes - operate on DSP parameters and mixing
 */
export type ProductionOpcode =
  | SetParamOpcode
  | AdjustWidthOpcode
  | AdjustBrightnessOpcode
  | AdjustPunchOpcode
  | AddReverbOpcode
  | AddCompressionOpcode;

export interface SetParamOpcode extends BaseOpcode {
  readonly category: 'production';
  readonly type: 'set_param';
  readonly params: {
    readonly cardId: string;
    readonly paramName: string;
    readonly value: unknown;
    readonly rampDurationMs?: number;
  };
}

export interface AdjustWidthOpcode extends BaseOpcode {
  readonly category: 'production';
  readonly type: 'adjust_width';
  readonly params: {
    readonly direction: 'wider' | 'narrower';
    readonly amount: number; // 0.0 - 1.0
    readonly method: 'stereo-spread' | 'mid-side' | 'haas' | 'orchestration';
  };
}

export interface AdjustBrightnessOpcode extends BaseOpcode {
  readonly category: 'production';
  readonly type: 'adjust_brightness';
  readonly params: {
    readonly direction: 'brighter' | 'darker';
    readonly amount: number; // 0.0 - 1.0
    readonly method: 'eq' | 'saturation' | 'voicing' | 'register';
  };
}

export interface AdjustPunchOpcode extends BaseOpcode {
  readonly category: 'production';
  readonly type: 'adjust_punch';
  readonly params: {
    readonly direction: 'punchier' | 'softer';
    readonly amount: number; // 0.0 - 1.0
    readonly targetFrequency?: number; // Hz
  };
}

export interface AddReverbOpcode extends BaseOpcode {
  readonly category: 'production';
  readonly type: 'add_reverb';
  readonly params: {
    readonly type: 'room' | 'hall' | 'plate' | 'spring' | 'algorithmic';
    readonly amount: number; // 0.0 - 1.0 (dry/wet)
    readonly decay: number;  // Seconds
  };
}

export interface AddCompressionOpcode extends BaseOpcode {
  readonly category: 'production';
  readonly type: 'add_compression';
  readonly params: {
    readonly ratio: number;
    readonly threshold: number; // dB
    readonly attack: number;    // ms
    readonly release: number;   // ms
    readonly makeupGain?: number; // dB
  };
}

/**
 * Routing opcodes - operate on signal flow and card graph
 */
export type RoutingOpcode =
  | AddCardOpcode
  | RemoveCardOpcode
  | MoveCardOpcode
  | ConnectCardsOpcode
  | DisconnectCardsOpcode;

export interface AddCardOpcode extends BaseOpcode {
  readonly category: 'routing';
  readonly type: 'add_card';
  readonly params: {
    readonly cardType: string; // CardPlayId
    readonly insertPosition: 'start' | 'end' | 'before' | 'after';
    readonly referenceCardId?: string;
    readonly initialParams?: Record<string, unknown>;
  };
}

export interface RemoveCardOpcode extends BaseOpcode {
  readonly category: 'routing';
  readonly type: 'remove_card';
  readonly params: {
    readonly cardId: string;
    readonly removeConnections: boolean;
  };
}

export interface MoveCardOpcode extends BaseOpcode {
  readonly category: 'routing';
  readonly type: 'move_card';
  readonly params: {
    readonly cardId: string;
    readonly newPosition: number;
  };
}

export interface ConnectCardsOpcode extends BaseOpcode {
  readonly category: 'routing';
  readonly type: 'connect_cards';
  readonly params: {
    readonly sourceCardId: string;
    readonly targetCardId: string;
    readonly portMapping?: Record<string, string>;
  };
}

export interface DisconnectCardsOpcode extends BaseOpcode {
  readonly category: 'routing';
  readonly type: 'disconnect_cards';
  readonly params: {
    readonly sourceCardId: string;
    readonly targetCardId: string;
  };
}

/**
 * Union of all opcode types
 */
export type Opcode =
  | StructureOpcode
  | EventOpcode
  | RhythmOpcode
  | HarmonyOpcode
  | MelodyOpcode
  | TextureOpcode
  | ProductionOpcode
  | RoutingOpcode;

/**
 * A complete plan: sequence of opcodes with metadata
 */
export interface CPLPlan {
  readonly id: string;
  readonly opcodes: readonly Opcode[];
  
  /** Total estimated cost */
  readonly totalCost: number;
  
  /** Estimated goal satisfaction score (0.0 - 1.0) */
  readonly satisfactionScore: number;
  
  /** Goals this plan aims to satisfy */
  readonly goals: readonly CPLGoal[];
  
  /** Constraints this plan must respect */
  readonly constraints: readonly CPLConstraint[];
  
  /** Overall scope of the plan */
  readonly scope: CPLScope;
  
  /** Human-readable explanation of the plan */
  readonly explanation: string;
  
  /** Warnings about potential issues */
  readonly warnings: readonly string[];
  
  /** Required capabilities for execution */
  readonly requiredCapabilities: readonly CapabilityId[];
  
  /** Overall risk level (max of all opcodes) */
  readonly riskLevel: OpcodeRisk;
  
  /** Does any opcode require preview? */
  readonly requiresPreview: boolean;
  
  /** Confidence in this plan (0.0 - 1.0) */
  readonly confidence: number;
  
  /** Alternative plans if this was not uniquely best */
  readonly alternatives?: readonly CPLPlan[];
  
  /** Provenance: which goals/constraints led to which opcodes */
  readonly provenance: readonly {
    readonly goalId: string;
    readonly opcodeIds: readonly string[];
    readonly reasoning: string;
  }[];
}

/**
 * Result of planning
 */
export type PlanResult =
  | { readonly status: 'success'; readonly plan: CPLPlan }
  | { readonly status: 'ambiguous'; readonly options: readonly CPLPlan[] }
  | { readonly status: 'impossible'; readonly reason: string; readonly conflictingConstraints?: readonly CPLConstraint[] }
  | { readonly status: 'needs-clarification'; readonly questions: readonly string[] };

/**
 * Plan validation result
 */
export interface PlanValidationResult {
  readonly valid: boolean;
  readonly errors: readonly {
    readonly opcodeId: string;
    readonly type: 'precondition-failed' | 'capability-missing' | 'constraint-violated' | 'scope-invalid';
    readonly message: string;
  }[];
  readonly warnings: readonly {
    readonly opcodeId: string;
    readonly type: 'high-risk' | 'destructive' | 'expensive';
    readonly message: string;
  }[];
}

/**
 * Helper to create a base opcode with common fields
 */
export function createBaseOpcode(
  id: OpcodeId,
  category: OpcodeCategory,
  name: string,
  description: string,
  scope: CPLScope,
  params: Record<string, unknown>,
  options: {
    cost?: number;
    risk?: OpcodeRisk;
    destructive?: boolean;
    requiresPreview?: boolean;
    requiredCapabilities?: readonly CapabilityId[];
    preconditions?: readonly OpcodePrecondition[];
    postconditions?: readonly OpcodePostcondition[];
    reason?: string;
  } = {}
): BaseOpcode {
  return {
    id,
    category,
    name,
    description,
    scope,
    params,
    cost: options.cost ?? 1.0,
    risk: options.risk ?? 'moderate',
    destructive: options.destructive ?? false,
    requiresPreview: options.requiresPreview ?? (options.risk === 'high' || options.risk === 'critical'),
    requiredCapabilities: options.requiredCapabilities ?? [],
    preconditions: options.preconditions ?? [],
    postconditions: options.postconditions ?? [],
    reason: options.reason,
  };
}
