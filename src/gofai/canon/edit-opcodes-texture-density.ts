/**
 * GOFAI Edit Opcodes — Texture and Density Manipulation (Batch 1)
 *
 * Step 252: Define plan opcodes for texture/density transformations.
 *
 * This module defines opcodes for manipulating musical texture and density
 * at various levels (individual layers, section-level, global arrangement).
 * These are core operations for achieving perceptual goals like "busier",
 * "sparser", "thicker", "airier", etc.
 *
 * Implementation note: Each opcode has:
 * - Stable ID (never changes)
 * - Parameter schema (typed and validated)
 * - Effect type (inspect, propose, mutate)
 * - Cost estimate (for planning prioritization)
 * - Preconditions (checked before execution)
 * - Postconditions (verified after execution)
 *
 * @module gofai/canon/edit-opcodes-texture-density
 */

import type { EditOpcode, OpcodeId } from './types';
import { createOpcodeId } from './types';

// =============================================================================
// Texture Density Opcodes
// =============================================================================

/**
 * OP_THIN_TEXTURE — Reduce event density by selectively removing notes
 *
 * Strategies:
 * - Remove passing tones (keep chord tones)
 * - Remove redundant doublings
 * - Thin inner voices while keeping melody/bass
 * - Remove non-essential rhythmic subdivisions
 *
 * Preserves: Melodic contour, harmonic progression
 * Affects: Note count, perceived busyness, register fullness
 */
export const OP_THIN_TEXTURE: EditOpcode = {
  id: createOpcodeId('thin_texture'),
  name: 'Thin Texture',
  description:
    'Reduce musical density by removing notes while preserving harmonic and melodic structure. ' +
    'Selectively thins inner voices, passing tones, and redundant doublings.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to thin (layer, section, selection)',
    },
    {
      name: 'amount',
      type: 'amount',
      required: true,
      description: 'How much to thin (tiny/small/moderate/large)',
      defaultValue: 'moderate',
    },
    {
      name: 'strategy',
      type: 'enum',
      required: false,
      enumValues: ['remove_passing', 'thin_doublings', 'reduce_subdivisions', 'smart'],
      description: 'Which thinning strategy to use',
      defaultValue: 'smart',
    },
    {
      name: 'preserve_melody',
      type: 'boolean',
      required: false,
      description: 'Keep top voice intact',
      defaultValue: true,
    },
    {
      name: 'preserve_bass',
      type: 'boolean',
      required: false,
      description: 'Keep bass line intact',
      defaultValue: true,
    },
  ],
  preconditions: [
    'scope_has_notes',
    'sufficient_density_to_thin',
  ],
  postconditions: [
    'note_count_reduced',
    'harmonic_skeleton_preserved',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  relatedAxes: ['busyness', 'density', 'clarity', 'airiness'],
};

/**
 * OP_DENSIFY_TEXTURE — Increase event density by adding notes
 *
 * Strategies:
 * - Add passing tones between chord tones
 * - Double melody/bass lines in octaves
 * - Add rhythmic subdivisions
 * - Fill inner voices with chord extensions
 *
 * Preserves: Harmonic progression (by default)
 * Affects: Note count, perceived energy, register fullness
 */
export const OP_DENSIFY_TEXTURE: EditOpcode = {
  id: createOpcodeId('densify_texture'),
  name: 'Densify Texture',
  description:
    'Increase musical density by adding notes, passing tones, rhythmic elaborations, ' +
    'and voicing doublings. Can be constrained to preserve harmonic or melodic material.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to densify',
    },
    {
      name: 'amount',
      type: 'amount',
      required: true,
      description: 'How much to densify',
      defaultValue: 'moderate',
    },
    {
      name: 'strategy',
      type: 'enum',
      required: false,
      enumValues: ['add_passing', 'add_doublings', 'subdivide_rhythm', 'fill_voices', 'smart'],
      description: 'Which densification strategy',
      defaultValue: 'smart',
    },
    {
      name: 'preserve_harmony',
      type: 'boolean',
      required: false,
      description: 'Stay within existing harmony',
      defaultValue: true,
    },
    {
      name: 'preserve_melody',
      type: 'boolean',
      required: false,
      description: 'Keep original melody notes',
      defaultValue: true,
    },
    {
      name: 'max_density',
      type: 'number',
      required: false,
      description: 'Upper limit on notes per beat',
      defaultValue: 8,
    },
  ],
  preconditions: [
    'scope_has_notes',
    'room_for_added_notes',
  ],
  postconditions: [
    'note_count_increased',
    'harmony_preserved_if_requested',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  relatedAxes: ['busyness', 'density', 'energy', 'richness'],
};

/**
 * OP_ADJUST_NOTE_DENSITY — Fine-grained density control
 *
 * More granular than thin/densify. Adjusts note density to a specific
 * target value (notes per beat) or percentage change.
 */
export const OP_ADJUST_NOTE_DENSITY: EditOpcode = {
  id: createOpcodeId('adjust_note_density'),
  name: 'Adjust Note Density',
  description:
    'Adjust note density to a target value or by a percentage. ' +
    'More precise than thin/densify for quantitative control.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to adjust',
    },
    {
      name: 'target_density',
      type: 'number',
      required: false,
      description: 'Target notes per beat (absolute)',
    },
    {
      name: 'change_percent',
      type: 'number',
      required: false,
      description: 'Percentage change in density (relative)',
    },
    {
      name: 'preserve_melodic_contour',
      type: 'boolean',
      required: false,
      description: 'Keep melodic shape recognizable',
      defaultValue: true,
    },
  ],
  preconditions: [
    'scope_has_notes',
    'either_target_or_change_specified',
  ],
  postconditions: [
    'density_matches_target',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  relatedAxes: ['density', 'busyness'],
};

/**
 * OP_ADD_RHYTHMIC_SUBDIVISION — Add rhythmic complexity
 *
 * Adds subdivision notes (e.g., 8th notes become 16ths) while preserving
 * harmonic and melodic content. Increases rhythmic activity and momentum.
 */
export const OP_ADD_RHYTHMIC_SUBDIVISION: EditOpcode = {
  id: createOpcodeId('add_rhythmic_subdivision'),
  name: 'Add Rhythmic Subdivision',
  description:
    'Increase rhythmic activity by adding subdivisions (quarter → eighth, eighth → sixteenth). ' +
    'Preserves pitch content and harmonic structure.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to subdivide',
    },
    {
      name: 'subdivision_level',
      type: 'enum',
      required: false,
      enumValues: ['double', 'triple', 'quadruple'],
      description: 'How much finer to subdivide',
      defaultValue: 'double',
    },
    {
      name: 'pattern',
      type: 'enum',
      required: false,
      enumValues: ['even', 'swing', 'triplet', 'dotted'],
      description: 'Rhythmic pattern for subdivisions',
      defaultValue: 'even',
    },
    {
      name: 'preserve_strong_beats',
      type: 'boolean',
      required: false,
      description: 'Keep downbeat emphasis',
      defaultValue: true,
    },
  ],
  preconditions: [
    'scope_has_notes',
    'room_for_subdivisions',
  ],
  postconditions: [
    'rhythmic_density_increased',
    'original_beats_preserved',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  relatedAxes: ['energy', 'motion', 'busyness'],
};

/**
 * OP_SIMPLIFY_RHYTHM — Reduce rhythmic complexity
 *
 * Opposite of add_rhythmic_subdivision. Quantizes to simpler grid,
 * removes passing rhythmic events, consolidates subdivisions.
 */
export const OP_SIMPLIFY_RHYTHM: EditOpcode = {
  id: createOpcodeId('simplify_rhythm'),
  name: 'Simplify Rhythm',
  description:
    'Reduce rhythmic complexity by quantizing to simpler grid and removing ' +
    'excessive subdivisions. Makes rhythm easier to follow.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to simplify',
    },
    {
      name: 'target_grid',
      type: 'enum',
      required: false,
      enumValues: ['whole', 'half', 'quarter', 'eighth', 'sixteenth'],
      description: 'Simplest grid level to quantize to',
      defaultValue: 'quarter',
    },
    {
      name: 'preserve_syncopation',
      type: 'boolean',
      required: false,
      description: 'Keep off-beat emphasis',
      defaultValue: false,
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'rhythm_simplified',
    'grid_consistency_improved',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  relatedAxes: ['simplicity', 'clarity', 'groove'],
};

/**
 * OP_DOUBLE_LAYER — Create octave/unison doubling
 *
 * Duplicates a layer and transposes (or keeps in unison) for thickness.
 * Common for making melodies/bass lines more prominent.
 */
export const OP_DOUBLE_LAYER: EditOpcode = {
  id: createOpcodeId('double_layer'),
  name: 'Double Layer',
  description:
    'Create a doubling of a layer at unison, octave, or other interval. ' +
    'Increases thickness and prominence.',
  params: [
    {
      name: 'source_layer',
      type: 'layer_ref',
      required: true,
      description: 'Layer to double',
    },
    {
      name: 'interval',
      type: 'enum',
      required: false,
      enumValues: ['unison', 'octave_up', 'octave_down', 'fifth', 'third'],
      description: 'Transposition interval for doubling',
      defaultValue: 'octave_up',
    },
    {
      name: 'mix_level',
      type: 'number',
      required: false,
      description: 'Volume balance (0-1) of doubling',
      defaultValue: 0.7,
    },
    {
      name: 'create_new_track',
      type: 'boolean',
      required: false,
      description: 'Put doubling on new track vs merge',
      defaultValue: true,
    },
  ],
  preconditions: [
    'source_layer_exists',
    'source_has_notes',
  ],
  postconditions: [
    'doubling_created',
    'thickness_increased',
  ],
  affects: ['event', 'card'],
  effectType: 'mutate',
  cost: 'medium',
  relatedAxes: ['thickness', 'richness', 'prominence'],
};

/**
 * OP_THIN_VOICING — Reduce voicing complexity
 *
 * Removes chord extensions, narrows register spread, removes doublings.
 * Makes chords simpler and clearer.
 */
export const OP_THIN_VOICING: EditOpcode = {
  id: createOpcodeId('thin_voicing'),
  name: 'Thin Voicing',
  description:
    'Reduce voicing complexity by removing extensions, narrowing spread, ' +
    'and eliminating redundant doublings. Makes harmony clearer.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which chord voicings to thin',
    },
    {
      name: 'strategy',
      type: 'enum',
      required: false,
      enumValues: ['remove_extensions', 'narrow_spread', 'remove_doublings', 'smart'],
      description: 'Thinning approach',
      defaultValue: 'smart',
    },
    {
      name: 'preserve_root',
      type: 'boolean',
      required: false,
      description: 'Always keep root note',
      defaultValue: true,
    },
    {
      name: 'preserve_third',
      type: 'boolean',
      required: false,
      description: 'Always keep third (major/minor quality)',
      defaultValue: true,
    },
  ],
  preconditions: [
    'scope_has_harmony',
  ],
  postconditions: [
    'voicing_complexity_reduced',
    'chord_quality_preserved',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  relatedAxes: ['clarity', 'simplicity', 'intimacy'],
};

/**
 * OP_FATTEN_VOICING — Enrich voicing complexity
 *
 * Adds chord extensions, widens register spread, adds doublings.
 * Makes chords richer and more complex.
 */
export const OP_FATTEN_VOICING: EditOpcode = {
  id: createOpcodeId('fatten_voicing'),
  name: 'Fatten Voicing',
  description:
    'Enrich voicing by adding extensions, widening register spread, ' +
    'and adding strategic doublings. Makes harmony more lush.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which chord voicings to fatten',
    },
    {
      name: 'extension_level',
      type: 'enum',
      required: false,
      enumValues: ['sevenths', 'ninths', 'elevenths', 'thirteenths'],
      description: 'How far to extend chords',
      defaultValue: 'ninths',
    },
    {
      name: 'register_spread',
      type: 'enum',
      required: false,
      enumValues: ['narrow', 'moderate', 'wide', 'very_wide'],
      description: 'How wide to voice',
      defaultValue: 'moderate',
    },
    {
      name: 'preserve_voice_leading',
      type: 'boolean',
      required: false,
      description: 'Maintain smooth voice leading',
      defaultValue: true,
    },
  ],
  preconditions: [
    'scope_has_harmony',
  ],
  postconditions: [
    'voicing_enriched',
    'register_spread_increased',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  relatedAxes: ['richness', 'lushness', 'sophistication'],
};

/**
 * OP_ADJUST_LAYER_DENSITY — Per-layer density control
 *
 * Adjusts density independently for each layer/role (drums, bass, harmony, melody).
 * Allows asymmetric density changes (e.g., busier drums, sparser harmony).
 */
export const OP_ADJUST_LAYER_DENSITY: EditOpcode = {
  id: createOpcodeId('adjust_layer_density'),
  name: 'Adjust Layer Density',
  description:
    'Adjust density independently for specified layers. ' +
    'Enables asymmetric texture changes (e.g., busier drums, simpler melody).',
  params: [
    {
      name: 'layer_adjustments',
      type: 'array',
      required: true,
      description: 'Array of {layer, density_change} objects',
    },
    {
      name: 'scope',
      type: 'scope',
      required: false,
      description: 'Time range to apply changes',
    },
    {
      name: 'preserve_balance',
      type: 'boolean',
      required: false,
      description: 'Maintain relative prominence of layers',
      defaultValue: true,
    },
  ],
  preconditions: [
    'all_layers_exist',
  ],
  postconditions: [
    'layer_densities_adjusted',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  relatedAxes: ['texture', 'arrangement', 'orchestration'],
};

/**
 * OP_SPARSE_TO_FULL_TRANSITION — Gradual density increase
 *
 * Creates a smooth transition from sparse to full texture over a time range.
 * Useful for builds, introductions, post-chorus sections.
 */
export const OP_SPARSE_TO_FULL_TRANSITION: EditOpcode = {
  id: createOpcodeId('sparse_to_full_transition'),
  name: 'Sparse to Full Transition',
  description:
    'Create a gradual increase in density from sparse to full over a section. ' +
    'Useful for builds and introductions.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Time range for transition',
    },
    {
      name: 'start_density',
      type: 'enum',
      required: false,
      enumValues: ['minimal', 'sparse', 'moderate'],
      description: 'Starting density level',
      defaultValue: 'minimal',
    },
    {
      name: 'end_density',
      type: 'enum',
      required: false,
      enumValues: ['moderate', 'full', 'maximal'],
      description: 'Ending density level',
      defaultValue: 'full',
    },
    {
      name: 'curve',
      type: 'enum',
      required: false,
      enumValues: ['linear', 'exponential', 'logarithmic'],
      description: 'Shape of density curve',
      defaultValue: 'exponential',
    },
  ],
  preconditions: [
    'scope_has_sufficient_duration',
  ],
  postconditions: [
    'smooth_density_transition_created',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  relatedAxes: ['build', 'energy', 'momentum'],
};

/**
 * OP_FULL_TO_SPARSE_TRANSITION — Gradual density decrease
 *
 * Creates a smooth transition from full to sparse texture.
 * Useful for breakdowns, outros, preparing for drops.
 */
export const OP_FULL_TO_SPARSE_TRANSITION: EditOpcode = {
  id: createOpcodeId('full_to_sparse_transition'),
  name: 'Full to Sparse Transition',
  description:
    'Create a gradual decrease in density from full to sparse over a section. ' +
    'Useful for breakdowns and outros.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Time range for transition',
    },
    {
      name: 'start_density',
      type: 'enum',
      required: false,
      enumValues: ['maximal', 'full', 'moderate'],
      description: 'Starting density level',
      defaultValue: 'full',
    },
    {
      name: 'end_density',
      type: 'enum',
      required: false,
      enumValues: ['moderate', 'sparse', 'minimal'],
      description: 'Ending density level',
      defaultValue: 'minimal',
    },
    {
      name: 'curve',
      type: 'enum',
      required: false,
      enumValues: ['linear', 'exponential', 'logarithmic'],
      description: 'Shape of density curve',
      defaultValue: 'linear',
    },
  ],
  preconditions: [
    'scope_has_sufficient_duration',
  ],
  postconditions: [
    'smooth_density_transition_created',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  relatedAxes: ['breakdown', 'release', 'space'],
};

// =============================================================================
// Opcode Registry for Texture/Density
// =============================================================================

export const TEXTURE_DENSITY_OPCODES = [
  OP_THIN_TEXTURE,
  OP_DENSIFY_TEXTURE,
  OP_ADJUST_NOTE_DENSITY,
  OP_ADD_RHYTHMIC_SUBDIVISION,
  OP_SIMPLIFY_RHYTHM,
  OP_DOUBLE_LAYER,
  OP_THIN_VOICING,
  OP_FATTEN_VOICING,
  OP_ADJUST_LAYER_DENSITY,
  OP_SPARSE_TO_FULL_TRANSITION,
  OP_FULL_TO_SPARSE_TRANSITION,
] as const;

/**
 * Get all texture/density opcode IDs.
 */
export function getTextureDensityOpcodeIds(): OpcodeId[] {
  return TEXTURE_DENSITY_OPCODES.map((op) => op.id);
}

/**
 * Look up opcode by ID.
 */
export function getTextureDensityOpcode(id: OpcodeId): EditOpcode | undefined {
  return TEXTURE_DENSITY_OPCODES.find((op) => op.id === id);
}
