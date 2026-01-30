/**
 * GOFAI Edit Opcodes — Arrangement and Orchestration
 *
 * Step 280: Define plan opcodes for arrangement edits:
 * - Add/remove layers
 * - Role redistribution
 * - Density shaping across sections
 * - Instrumentation changes
 * - Layer dynamics and balance
 * - Textural development
 *
 * These opcodes manipulate the arrangement and orchestration of music,
 * controlling which instruments/layers play when, how roles are distributed,
 * and how the texture evolves across the piece.
 *
 * Design principles:
 * - Layer operations respect board capabilities (some boards may be layer-locked)
 * - Role assignments maintain musical coherence (bass stays low, etc.)
 * - Density changes are gradual unless explicitly requested
 * - Orchestration respects instrument ranges and capabilities
 * - All changes preserve musical intent unless reorchestration requested
 *
 * @module gofai/canon/edit-opcodes-arrangement
 */

import type { EditOpcode, OpcodeId, AxisId } from './types';
import { createOpcodeId, createAxisId } from './types';

// =============================================================================
// Layer Addition and Removal
// =============================================================================

/**
 * OP_ADD_LAYER — Add a new instrument/voice layer
 *
 * Creates a new layer with specified role and initial content.
 * Can duplicate existing layer, create complementary part, or start empty.
 *
 * Preserves: Existing layers
 * Affects: Layer count, texture density, arrangement complexity
 */
export const OP_ADD_LAYER: EditOpcode = {
  id: createOpcodeId('add_layer'),
  name: 'Add Layer',
  description:
    'Add a new instrument or voice layer to the arrangement. ' +
    'Can duplicate existing layer, create complementary part, or start empty.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Where to add the layer',
    },
    {
      name: 'role',
      type: 'string',
      required: true,
      description: 'Musical role for the new layer',
      enumValues: ['melody', 'harmony', 'bass', 'rhythm', 'texture', 'counter_melody'],
    },
    {
      name: 'instrument_type',
      type: 'string',
      required: false,
      description: 'Type of instrument',
    },
    {
      name: 'content_source',
      type: 'string',
      required: false,
      description: 'How to populate the layer',
      enumValues: ['empty', 'duplicate_existing', 'generate_complementary', 'from_template'],
      defaultValue: 'empty',
    },
    {
      name: 'source_layer',
      type: 'entity_ref',
      required: false,
      description: 'Layer to duplicate or base complementary part on',
    },
    {
      name: 'register_range',
      type: 'string',
      required: false,
      description: 'Pitch range for the layer (MIDI note range)',
    },
  ],
  affects: ['layer', 'track', 'event'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['arrangement_editing', 'layer_creation'],
  affectsAxes: [
    createAxisId('layer_count'),
    createAxisId('thickness'),
    createAxisId('complexity'),
    createAxisId('fullness'),
  ],
  preconditions: [
    'board must allow layer creation',
    'role must be valid',
    'if duplicating, source layer must exist',
  ],
  postconditions: [
    'new layer created with specified role',
    'layer added to arrangement',
    'content populated according to source',
  ],
};

/**
 * OP_REMOVE_LAYER — Remove an instrument/voice layer
 *
 * Deletes a layer and all its content from the arrangement.
 * Useful for simplifying texture or removing unnecessary parts.
 *
 * Preserves: Other layers
 * Affects: Layer count, texture density, arrangement complexity
 */
export const OP_REMOVE_LAYER: EditOpcode = {
  id: createOpcodeId('remove_layer'),
  name: 'Remove Layer',
  description:
    'Remove an instrument or voice layer from the arrangement. ' +
    'Deletes all content in the layer.',
  params: [
    {
      name: 'target_layer',
      type: 'entity_ref',
      required: true,
      description: 'Layer to remove',
    },
    {
      name: 'scope',
      type: 'scope',
      required: false,
      description: 'If specified, only remove layer in this scope',
    },
    {
      name: 'redistribute_content',
      type: 'boolean',
      required: false,
      description: 'Try to move essential material to other layers',
      defaultValue: false,
    },
  ],
  affects: ['layer', 'track', 'event'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['arrangement_editing', 'layer_deletion'],
  affectsAxes: [
    createAxisId('layer_count'),
    createAxisId('thickness'),
    createAxisId('simplicity'),
    createAxisId('space'),
  ],
  preconditions: ['target layer must exist', 'board must allow layer deletion'],
  postconditions: [
    'layer removed from arrangement',
    'all layer content deleted (unless redistributed)',
  ],
};

/**
 * OP_MUTE_LAYER — Silence a layer temporarily
 *
 * Mutes a layer without deleting it, useful for creating dynamics
 * and textural variety.
 *
 * Preserves: Layer and content (just silenced)
 * Affects: Perceived texture density, volume
 */
export const OP_MUTE_LAYER: EditOpcode = {
  id: createOpcodeId('mute_layer'),
  name: 'Mute Layer',
  description:
    'Silence a layer without deleting it. ' +
    'Creates textural variety and dynamics through selective layer muting.',
  params: [
    {
      name: 'target_layer',
      type: 'entity_ref',
      required: true,
      description: 'Layer to mute',
    },
    {
      name: 'scope',
      type: 'scope',
      required: false,
      description: 'If specified, only mute layer in this scope',
    },
    {
      name: 'fade_out',
      type: 'boolean',
      required: false,
      description: 'Apply fade out before muting',
      defaultValue: true,
    },
    {
      name: 'fade_duration',
      type: 'number',
      required: false,
      description: 'Fade duration in beats',
      validation: { min: 0, max: 16 },
      defaultValue: 2,
    },
  ],
  affects: ['layer', 'automation'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('density'), createAxisId('dynamics'), createAxisId('space')],
  preconditions: ['target layer must exist'],
  postconditions: [
    'layer muted (volume to 0 or track muted)',
    'fade applied if requested',
    'layer content preserved',
  ],
};

/**
 * OP_UNMUTE_LAYER — Bring back a muted layer
 *
 * Unmutes a previously muted layer, restoring it to the mix.
 *
 * Preserves: Layer content
 * Affects: Perceived texture density, volume
 */
export const OP_UNMUTE_LAYER: EditOpcode = {
  id: createOpcodeId('unmute_layer'),
  name: 'Unmute Layer',
  description:
    'Restore a muted layer to the mix. ' +
    'Can apply fade in for smooth transitions.',
  params: [
    {
      name: 'target_layer',
      type: 'entity_ref',
      required: true,
      description: 'Layer to unmute',
    },
    {
      name: 'scope',
      type: 'scope',
      required: false,
      description: 'If specified, only unmute layer in this scope',
    },
    {
      name: 'fade_in',
      type: 'boolean',
      required: false,
      description: 'Apply fade in when unmuting',
      defaultValue: true,
    },
    {
      name: 'fade_duration',
      type: 'number',
      required: false,
      description: 'Fade duration in beats',
      validation: { min: 0, max: 16 },
      defaultValue: 2,
    },
  ],
  affects: ['layer', 'automation'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('density'), createAxisId('dynamics'), createAxisId('fullness')],
  preconditions: ['target layer must exist and be muted'],
  postconditions: [
    'layer unmuted (volume restored)',
    'fade applied if requested',
  ],
};

// =============================================================================
// Role Redistribution and Assignment
// =============================================================================

/**
 * OP_REASSIGN_LAYER_ROLE — Change the musical role of a layer
 *
 * Converts a layer from one role to another (e.g., harmony to bass),
 * adapting content appropriately.
 *
 * Preserves: Layer existence, general musical material
 * Affects: Role assignment, possibly register and voicing
 */
export const OP_REASSIGN_LAYER_ROLE: EditOpcode = {
  id: createOpcodeId('reassign_layer_role'),
  name: 'Reassign Layer Role',
  description:
    'Change the musical role of a layer (e.g., harmony to bass). ' +
    'Adapts content to fit new role appropriately.',
  params: [
    {
      name: 'target_layer',
      type: 'entity_ref',
      required: true,
      description: 'Layer to reassign',
    },
    {
      name: 'new_role',
      type: 'string',
      required: true,
      description: 'New musical role',
      enumValues: ['melody', 'harmony', 'bass', 'rhythm', 'texture', 'counter_melody'],
    },
    {
      name: 'adapt_content',
      type: 'boolean',
      required: false,
      description: 'Modify content to fit new role',
      defaultValue: true,
    },
    {
      name: 'preserve_pitches',
      type: 'boolean',
      required: false,
      description: 'Keep original pitches if possible',
      defaultValue: false,
    },
  ],
  affects: ['layer', 'event'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['arrangement_editing', 'role_adaptation'],
  affectsAxes: [createAxisId('role_clarity'), createAxisId('arrangement_logic')],
  preconditions: ['target layer must exist', 'new role must be valid'],
  postconditions: [
    'layer role changed',
    'content adapted to new role if requested',
    'arrangement coherence maintained',
  ],
};

/**
 * OP_DISTRIBUTE_ROLE_ACROSS_LAYERS — Split role among multiple layers
 *
 * Takes material from one layer and distributes it across multiple
 * layers, creating more textural variety.
 *
 * Preserves: Musical material
 * Affects: Layer distribution, texture, complexity
 */
export const OP_DISTRIBUTE_ROLE_ACROSS_LAYERS: EditOpcode = {
  id: createOpcodeId('distribute_role_across_layers'),
  name: 'Distribute Role Across Layers',
  description:
    'Split material from one layer across multiple layers. ' +
    'Creates more complex texture and orchestrational variety.',
  params: [
    {
      name: 'source_layer',
      type: 'entity_ref',
      required: true,
      description: 'Layer with material to distribute',
    },
    {
      name: 'target_layers',
      type: 'entity_ref',
      required: true,
      description: 'Layers to distribute material to (comma-separated)',
    },
    {
      name: 'distribution_strategy',
      type: 'string',
      required: false,
      description: 'How to distribute',
      enumValues: ['by_register', 'by_time', 'by_function', 'round_robin', 'intelligent'],
      defaultValue: 'intelligent',
    },
  ],
  affects: ['layer', 'event'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['arrangement_editing', 'orchestration'],
  affectsAxes: [createAxisId('complexity'), createAxisId('texture'), createAxisId('variety')],
  preconditions: [
    'source layer must exist with content',
    'target layers must exist',
  ],
  postconditions: [
    'material distributed across layers',
    'each layer has portion of original material',
    'texture more complex',
  ],
};

/**
 * OP_CONSOLIDATE_LAYERS — Merge multiple layers into one
 *
 * Combines material from multiple layers into a single layer,
 * simplifying the arrangement.
 *
 * Preserves: Musical material (combined)
 * Affects: Layer count, simplicity
 */
export const OP_CONSOLIDATE_LAYERS: EditOpcode = {
  id: createOpcodeId('consolidate_layers'),
  name: 'Consolidate Layers',
  description:
    'Merge multiple layers into one. ' +
    'Simplifies arrangement by combining related material.',
  params: [
    {
      name: 'source_layers',
      type: 'entity_ref',
      required: true,
      description: 'Layers to merge (comma-separated)',
    },
    {
      name: 'target_layer',
      type: 'entity_ref',
      required: false,
      description: 'Destination layer (or create new)',
    },
    {
      name: 'handle_conflicts',
      type: 'string',
      required: false,
      description: 'How to handle note conflicts',
      enumValues: ['keep_all', 'prioritize_first', 'remove_duplicates', 'blend'],
      defaultValue: 'keep_all',
    },
  ],
  affects: ['layer', 'event'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['arrangement_editing'],
  affectsAxes: [createAxisId('simplicity'), createAxisId('layer_count')],
  preconditions: ['all source layers must exist'],
  postconditions: [
    'material from source layers combined',
    'single consolidated layer contains all material',
    'source layers optionally removed',
  ],
};

// =============================================================================
// Density and Texture Shaping
// =============================================================================

/**
 * OP_SHAPE_ARRANGEMENT_DENSITY — Control layer density across sections
 *
 * Creates dynamic arrangement by controlling how many layers are
 * active in different sections.
 *
 * Preserves: Layer content
 * Affects: Active layer count over time, dynamics, energy
 */
export const OP_SHAPE_ARRANGEMENT_DENSITY: EditOpcode = {
  id: createOpcodeId('shape_arrangement_density'),
  name: 'Shape Arrangement Density',
  description:
    'Control how many layers are active across sections. ' +
    'Creates dynamic arrangement with varying density and energy.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Sections to shape',
    },
    {
      name: 'density_profile',
      type: 'string',
      required: false,
      description: 'How density changes over time',
      enumValues: ['build', 'reduce', 'wave', 'constant', 'custom_curve'],
      defaultValue: 'build',
    },
    {
      name: 'min_layers',
      type: 'number',
      required: false,
      description: 'Minimum active layers',
      validation: { min: 1, max: 32 },
      defaultValue: 2,
    },
    {
      name: 'max_layers',
      type: 'number',
      required: false,
      description: 'Maximum active layers',
      validation: { min: 1, max: 32 },
      defaultValue: 8,
    },
    {
      name: 'layer_priority',
      type: 'string',
      required: false,
      description: 'Which layers to activate first',
      enumValues: ['by_role', 'by_register', 'by_importance', 'random'],
      defaultValue: 'by_importance',
    },
  ],
  affects: ['layer', 'automation'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['arrangement_editing', 'automation_editing'],
  affectsAxes: [
    createAxisId('density'),
    createAxisId('energy'),
    createAxisId('dynamics'),
    createAxisId('buildup'),
  ],
  preconditions: ['scope must contain multiple layers', 'min_layers <= max_layers'],
  postconditions: [
    'layer density shaped according to profile',
    'smooth transitions between density levels',
    'arrangement energy follows target curve',
  ],
};

/**
 * OP_CREATE_CALL_AND_RESPONSE — Set up call-and-response pattern
 *
 * Creates antiphonal texture where layers alternate, common in
 * many musical styles.
 *
 * Preserves: Layer content (rearranged in time)
 * Affects: Timing, texture, interplay
 */
export const OP_CREATE_CALL_AND_RESPONSE: EditOpcode = {
  id: createOpcodeId('create_call_and_response'),
  name: 'Create Call and Response',
  description:
    'Set up call-and-response pattern between layers. ' +
    'Creates antiphonal texture with alternating phrases.',
  params: [
    {
      name: 'call_layer',
      type: 'entity_ref',
      required: true,
      description: 'Layer for the "call" phrases',
    },
    {
      name: 'response_layer',
      type: 'entity_ref',
      required: true,
      description: 'Layer for the "response" phrases',
    },
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Where to apply pattern',
    },
    {
      name: 'phrase_length',
      type: 'number',
      required: false,
      description: 'Length of each phrase in bars',
      validation: { min: 0.5, max: 8 },
      defaultValue: 2,
    },
    {
      name: 'overlap',
      type: 'boolean',
      required: false,
      description: 'Allow phrases to overlap',
      defaultValue: false,
    },
  ],
  affects: ['event', 'layer'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['arrangement_editing'],
  affectsAxes: [createAxisId('dialogue'), createAxisId('interplay'), createAxisId('antiphony')],
  preconditions: ['both layers must exist with content'],
  postconditions: [
    'call-and-response pattern created',
    'phrases alternate between layers',
    'timing adjusted for antiphonal effect',
  ],
};

/**
 * OP_ADD_COUNTER_MELODY — Create a counter-melody layer
 *
 * Generates or designates a layer as counter-melody that
 * complements the main melody.
 *
 * Preserves: Main melody
 * Affects: Texture, melodic complexity
 */
export const OP_ADD_COUNTER_MELODY: EditOpcode = {
  id: createOpcodeId('add_counter_melody'),
  name: 'Add Counter-Melody',
  description:
    'Create or designate a counter-melody layer that complements main melody. ' +
    'Adds melodic interest and contrapuntal texture.',
  params: [
    {
      name: 'main_melody_layer',
      type: 'entity_ref',
      required: true,
      description: 'Main melody to complement',
    },
    {
      name: 'counter_melody_layer',
      type: 'entity_ref',
      required: false,
      description: 'Existing layer to use as counter-melody (or create new)',
    },
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Where to add counter-melody',
    },
    {
      name: 'contrapuntal_style',
      type: 'string',
      required: false,
      description: 'Style of counterpoint',
      enumValues: ['complementary', 'contrary_motion', 'harmonizing', 'independent'],
      defaultValue: 'complementary',
    },
    {
      name: 'register_relation',
      type: 'string',
      required: false,
      description: 'Register relative to main melody',
      enumValues: ['above', 'below', 'mixed'],
      defaultValue: 'below',
    },
  ],
  affects: ['layer', 'event'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['arrangement_editing', 'counterpoint', 'melody_editing'],
  affectsAxes: [
    createAxisId('complexity'),
    createAxisId('contrapuntal_interest'),
    createAxisId('texture'),
  ],
  preconditions: ['main melody layer must exist with content'],
  postconditions: [
    'counter-melody created or assigned',
    'counter-melody complements main melody',
    'contrapuntal style matches specification',
  ],
};

// =============================================================================
// Instrumentation and Orchestration
// =============================================================================

/**
 * OP_CHANGE_INSTRUMENTATION — Replace instrument for a layer
 *
 * Changes the instrument/sound source for a layer while preserving
 * the musical content.
 *
 * Preserves: Musical content (notes, rhythms)
 * Affects: Timbre, color, character
 */
export const OP_CHANGE_INSTRUMENTATION: EditOpcode = {
  id: createOpcodeId('change_instrumentation'),
  name: 'Change Instrumentation',
  description:
    'Replace the instrument or sound source for a layer. ' +
    'Changes timbre while preserving musical content.',
  params: [
    {
      name: 'target_layer',
      type: 'entity_ref',
      required: true,
      description: 'Layer to change',
    },
    {
      name: 'new_instrument',
      type: 'string',
      required: true,
      description: 'New instrument or card to use',
    },
    {
      name: 'scope',
      type: 'scope',
      required: false,
      description: 'If specified, only change in this scope',
    },
    {
      name: 'adapt_range',
      type: 'boolean',
      required: false,
      description: 'Transpose notes to fit new instrument range',
      defaultValue: true,
    },
    {
      name: 'adapt_articulation',
      type: 'boolean',
      required: false,
      description: 'Adjust articulations for new instrument',
      defaultValue: true,
    },
  ],
  affects: ['layer', 'card', 'event'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['arrangement_editing', 'instrumentation'],
  affectsAxes: [createAxisId('timbre'), createAxisId('color'), createAxisId('character')],
  preconditions: [
    'target layer must exist',
    'new instrument must be available',
  ],
  postconditions: [
    'layer uses new instrument',
    'musical content preserved (adapted if needed)',
    'range and articulation adjusted if requested',
  ],
};

/**
 * OP_DOUBLE_LAYER_AT_OCTAVE — Create octave doubling
 *
 * Adds a layer that doubles another at octave above or below,
 * enriching the sound.
 *
 * Preserves: Original layer
 * Affects: Texture, register spread, richness
 */
export const OP_DOUBLE_LAYER_AT_OCTAVE: EditOpcode = {
  id: createOpcodeId('double_layer_at_octave'),
  name: 'Double Layer at Octave',
  description:
    'Create octave doubling by adding layer that plays same material ' +
    'at different octave. Enriches texture and register spread.',
  params: [
    {
      name: 'source_layer',
      type: 'entity_ref',
      required: true,
      description: 'Layer to double',
    },
    {
      name: 'octave_offset',
      type: 'number',
      required: true,
      description: 'Octaves above (positive) or below (negative)',
      validation: { min: -3, max: 3 },
    },
    {
      name: 'scope',
      type: 'scope',
      required: false,
      description: 'If specified, only double in this scope',
    },
    {
      name: 'instrumentation',
      type: 'string',
      required: false,
      description: 'Instrument for doubling layer',
      enumValues: ['same', 'different', 'auto'],
      defaultValue: 'same',
    },
    {
      name: 'new_instrument',
      type: 'string',
      required: false,
      description: 'Specific instrument if instrumentation = different',
    },
  ],
  affects: ['layer', 'event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [
    createAxisId('richness'),
    createAxisId('register_spread'),
    createAxisId('thickness'),
  ],
  preconditions: ['source layer must exist'],
  postconditions: [
    'new doubling layer created',
    'doubling layer plays at specified octave offset',
    'instrumentation set as specified',
  ],
};

/**
 * OP_APPLY_ORCHESTRATION_TEMPLATE — Apply orchestration pattern
 *
 * Applies a standard orchestration template (quartet, big band, etc.)
 * to existing musical material.
 *
 * Preserves: Musical content
 * Affects: Layer distribution, roles, instrumentation
 */
export const OP_APPLY_ORCHESTRATION_TEMPLATE: EditOpcode = {
  id: createOpcodeId('apply_orchestration_template'),
  name: 'Apply Orchestration Template',
  description:
    'Apply a standard orchestration template to arrange material. ' +
    'Redistributes content across appropriate instruments and roles.',
  params: [
    {
      name: 'template',
      type: 'string',
      required: true,
      description: 'Orchestration template to apply',
      enumValues: [
        'string_quartet',
        'jazz_trio',
        'big_band',
        'rock_band',
        'symphony_orchestra',
        'electronic_production',
        'custom',
      ],
    },
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Material to orchestrate',
    },
    {
      name: 'preserve_roles',
      type: 'boolean',
      required: false,
      description: 'Try to match existing roles to template roles',
      defaultValue: true,
    },
  ],
  affects: ['layer', 'card', 'event'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['arrangement_editing', 'orchestration', 'template_application'],
  affectsAxes: [createAxisId('instrumentation'), createAxisId('style'), createAxisId('ensemble')],
  preconditions: [
    'template must be valid',
    'scope must contain material',
  ],
  postconditions: [
    'material orchestrated according to template',
    'appropriate instruments assigned',
    'roles distributed appropriately',
  ],
};

// =============================================================================
// Layer Dynamics and Balance
// =============================================================================

/**
 * OP_ADJUST_LAYER_BALANCE — Change relative levels of layers
 *
 * Adjusts volume relationships between layers to create better
 * balance or specific mix effects.
 *
 * Preserves: Musical content
 * Affects: Volume balance, mix, perceived importance
 */
export const OP_ADJUST_LAYER_BALANCE: EditOpcode = {
  id: createOpcodeId('adjust_layer_balance'),
  name: 'Adjust Layer Balance',
  description:
    'Adjust relative volume levels of layers. ' +
    'Creates better balance or specific mix aesthetic.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Where to adjust balance',
    },
    {
      name: 'balance_target',
      type: 'string',
      required: false,
      description: 'Target balance configuration',
      enumValues: ['melody_forward', 'bass_forward', 'balanced', 'rhythm_forward', 'custom'],
      defaultValue: 'balanced',
    },
    {
      name: 'layer_priorities',
      type: 'string',
      required: false,
      description: 'Layer priority list (comma-separated layer refs)',
    },
  ],
  affects: ['automation', 'param'],
  effectType: 'mutate',
  cost: 'low',
  requiresCapabilities: ['mixing'],
  affectsAxes: [createAxisId('balance'), createAxisId('clarity'), createAxisId('mix')],
  preconditions: ['scope must contain multiple layers'],
  postconditions: [
    'layer volumes adjusted',
    'balance matches target configuration',
    'relative levels create desired mix',
  ],
};

/**
 * OP_ADD_LAYER_AUTOMATION — Create dynamic volume changes for layer
 *
 * Adds automation curves for layer volume, creating swells, fades,
 * and dynamic expression.
 *
 * Preserves: Musical content
 * Affects: Dynamics, expression, energy
 */
export const OP_ADD_LAYER_AUTOMATION: EditOpcode = {
  id: createOpcodeId('add_layer_automation'),
  name: 'Add Layer Automation',
  description:
    'Create dynamic volume automation for a layer. ' +
    'Adds swells, fades, and expressive volume changes.',
  params: [
    {
      name: 'target_layer',
      type: 'entity_ref',
      required: true,
      description: 'Layer to automate',
    },
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Where to add automation',
    },
    {
      name: 'automation_type',
      type: 'string',
      required: false,
      description: 'Type of automation',
      enumValues: ['fade_in', 'fade_out', 'swell', 'duck', 'phrase_shaping', 'custom_curve'],
      defaultValue: 'phrase_shaping',
    },
    {
      name: 'intensity',
      type: 'string',
      required: false,
      description: 'How dramatic the automation is',
      enumValues: ['subtle', 'moderate', 'dramatic'],
      defaultValue: 'moderate',
    },
  ],
  affects: ['automation', 'param'],
  effectType: 'mutate',
  cost: 'low',
  requiresCapabilities: ['automation_editing'],
  affectsAxes: [createAxisId('dynamics'), createAxisId('expression'), createAxisId('movement')],
  preconditions: ['target layer must exist'],
  postconditions: [
    'automation curve added to layer',
    'dynamic volume changes created',
    'automation type matches specification',
  ],
};

// =============================================================================
// Textural Development
// =============================================================================

/**
 * OP_CREATE_TEXTURE_TRANSITION — Smoothly transition between textures
 *
 * Creates a transition between different textural states (sparse to full,
 * etc.) with gradual layer additions/removals.
 *
 * Preserves: Musical material
 * Affects: Texture density, arrangement over time
 */
export const OP_CREATE_TEXTURE_TRANSITION: EditOpcode = {
  id: createOpcodeId('create_texture_transition'),
  name: 'Create Texture Transition',
  description:
    'Create smooth transition between different textural states. ' +
    'Gradually adds or removes layers for textural development.',
  params: [
    {
      name: 'from_texture',
      type: 'string',
      required: true,
      description: 'Starting texture state',
      enumValues: ['solo', 'duo', 'sparse', 'moderate', 'full', 'dense'],
    },
    {
      name: 'to_texture',
      type: 'string',
      required: true,
      description: 'Ending texture state',
      enumValues: ['solo', 'duo', 'sparse', 'moderate', 'full', 'dense'],
    },
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Where to apply transition',
    },
    {
      name: 'transition_duration',
      type: 'number',
      required: false,
      description: 'Transition length in bars',
      validation: { min: 1, max: 32 },
      defaultValue: 8,
    },
    {
      name: 'curve_shape',
      type: 'string',
      required: false,
      description: 'How texture changes over time',
      enumValues: ['linear', 'exponential', 'logarithmic', 's_curve'],
      defaultValue: 's_curve',
    },
  ],
  affects: ['layer', 'automation', 'event'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['arrangement_editing', 'automation_editing'],
  affectsAxes: [
    createAxisId('texture'),
    createAxisId('density'),
    createAxisId('development'),
    createAxisId('transition'),
  ],
  preconditions: [
    'from_texture and to_texture must be different',
    'scope must be long enough for transition',
  ],
  postconditions: [
    'texture gradually transitions from start to end state',
    'layers added/removed progressively',
    'transition follows specified curve',
  ],
};

// =============================================================================
// Export
// =============================================================================

/**
 * All arrangement editing opcodes.
 */
export const ARRANGEMENT_OPCODES: readonly EditOpcode[] = [
  OP_ADD_LAYER,
  OP_REMOVE_LAYER,
  OP_MUTE_LAYER,
  OP_UNMUTE_LAYER,
  OP_REASSIGN_LAYER_ROLE,
  OP_DISTRIBUTE_ROLE_ACROSS_LAYERS,
  OP_CONSOLIDATE_LAYERS,
  OP_SHAPE_ARRANGEMENT_DENSITY,
  OP_CREATE_CALL_AND_RESPONSE,
  OP_ADD_COUNTER_MELODY,
  OP_CHANGE_INSTRUMENTATION,
  OP_DOUBLE_LAYER_AT_OCTAVE,
  OP_APPLY_ORCHESTRATION_TEMPLATE,
  OP_ADJUST_LAYER_BALANCE,
  OP_ADD_LAYER_AUTOMATION,
  OP_CREATE_TEXTURE_TRANSITION,
] as const;

/**
 * Arrangement opcode count: 16 comprehensive opcodes for arrangement and orchestration.
 */
export const ARRANGEMENT_OPCODE_COUNT = ARRANGEMENT_OPCODES.length;
