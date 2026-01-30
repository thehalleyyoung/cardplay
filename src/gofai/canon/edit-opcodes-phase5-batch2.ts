/**
 * GOFAI Edit Opcodes — Phase 5 Batch 2: Melody and Arrangement Opcodes
 *
 * This module continues implementing Steps 279-280 from gofai_goalB.md:
 * - Step 279: Plan opcodes for melody edits (optional/high cost)
 * - Step 280: Plan opcodes for arrangement edits
 *
 * Melody opcodes are marked as high-cost and optional since melody is
 * often preserved. Arrangement opcodes handle layer management and
 * orchestration decisions.
 *
 * @module gofai/canon/edit-opcodes-phase5-batch2
 */

import type { EditOpcode } from './types';
import { createOpcodeId, createAxisId } from './types';

// =============================================================================
// Melody Opcodes (Step 279 - Optional/High Cost)
// =============================================================================

/**
 * Add ornamentation to melody (trills, turns, grace notes)
 */
export const OP_ADD_ORNAMENTATION: EditOpcode = {
  id: createOpcodeId('add_ornamentation'),
  name: 'Add Ornamentation',
  description: 'Add melodic embellishments like trills, turns, and grace notes.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which melody to ornament',
    },
    {
      name: 'ornamentType',
      type: 'enum',
      required: false,
      enumValues: ['trill', 'turn', 'mordent', 'grace_note', 'appoggiatura', 'slide', 'all'],
      defaultValue: 'all',
      description: 'Type of ornamentation',
    },
    {
      name: 'density',
      type: 'number',
      required: false,
      defaultValue: 20,
      description: 'How many notes to ornament (0-100%)',
      validation: { min: 0, max: 100 },
    },
    {
      name: 'style',
      type: 'enum',
      required: false,
      enumValues: ['classical', 'jazz', 'contemporary', 'folk'],
      defaultValue: 'contemporary',
      description: 'Ornamentation style',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('sophistication'), createAxisId('busyness')],
  requiresCapabilities: [],
};

/**
 * Shape melodic contour (arch, wave, ascending, descending)
 */
export const OP_SHAPE_MELODIC_CONTOUR: EditOpcode = {
  id: createOpcodeId('shape_melodic_contour'),
  name: 'Shape Melodic Contour',
  description: 'Adjust the overall pitch contour of a melody.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which melody to shape',
    },
    {
      name: 'targetContour',
      type: 'enum',
      required: true,
      enumValues: ['arch', 'inverted_arch', 'ascending', 'descending', 'wave', 'terraced'],
      description: 'Desired contour shape',
    },
    {
      name: 'preserveIntervals',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Keep relative intervals between notes',
    },
    {
      name: 'strength',
      type: 'number',
      required: false,
      defaultValue: 70,
      description: 'How strongly to apply shape (0-100%)',
      validation: { min: 0, max: 100 },
    },
    {
      name: 'constrainToRange',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Keep melody within original register range',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('lift'), createAxisId('brightness')],
  requiresCapabilities: [],
};

/**
 * Shift melody to different register
 */
export const OP_SHIFT_MELODY_REGISTER: EditOpcode = {
  id: createOpcodeId('shift_melody_register'),
  name: 'Shift Melody Register',
  description: 'Move melody to a different pitch register while respecting range constraints.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which melody to shift',
    },
    {
      name: 'direction',
      type: 'enum',
      required: true,
      enumValues: ['up', 'down'],
      description: 'Which direction to shift',
    },
    {
      name: 'octaves',
      type: 'number',
      required: false,
      defaultValue: 1,
      description: 'How many octaves to shift',
      validation: { min: 1, max: 3 },
    },
    {
      name: 'respectInstrumentRange',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Stay within instrument playable range',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('brightness'), createAxisId('lift')],
  requiresCapabilities: [],
};

/**
 * Add passing tones to melody
 */
export const OP_ADD_MELODIC_PASSING_TONES: EditOpcode = {
  id: createOpcodeId('add_melodic_passing_tones'),
  name: 'Add Melodic Passing Tones',
  description: 'Insert passing tones between melody notes for smoother line.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which melody to add passing tones to',
    },
    {
      name: 'density',
      type: 'number',
      required: false,
      defaultValue: 30,
      description: 'How many passing tones to add (0-100%)',
      validation: { min: 0, max: 100 },
    },
    {
      name: 'type',
      type: 'enum',
      required: false,
      enumValues: ['chromatic', 'diatonic', 'scalar'],
      defaultValue: 'diatonic',
      description: 'Type of passing tones',
    },
    {
      name: 'rhythmicPlacement',
      type: 'enum',
      required: false,
      enumValues: ['weak_beats', 'offbeats', 'subdivisions'],
      defaultValue: 'weak_beats',
      description: 'Where to place passing tones',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('busyness'), createAxisId('smoothness')],
  requiresCapabilities: [],
};

/**
 * Simplify melody by removing ornamentation
 */
export const OP_SIMPLIFY_MELODY: EditOpcode = {
  id: createOpcodeId('simplify_melody'),
  name: 'Simplify Melody',
  description: 'Reduce melodic complexity by removing embellishments and subdivisions.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which melody to simplify',
    },
    {
      name: 'amount',
      type: 'number',
      required: false,
      defaultValue: 50,
      description: 'How much to simplify (0-100%)',
      validation: { min: 0, max: 100 },
    },
    {
      name: 'method',
      type: 'enum',
      required: false,
      enumValues: ['remove_passing', 'remove_ornaments', 'simplify_rhythm', 'all'],
      defaultValue: 'all',
      description: 'Simplification method',
    },
    {
      name: 'preserveContour',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Keep overall melodic shape',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('busyness'), createAxisId('intimacy')],
  requiresCapabilities: [],
};

/**
 * Add neighbor tones to melody
 */
export const OP_ADD_NEIGHBOR_TONES: EditOpcode = {
  id: createOpcodeId('add_neighbor_tones'),
  name: 'Add Neighbor Tones',
  description: 'Add upper or lower neighbor tone embellishments.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which melody to embellish',
    },
    {
      name: 'density',
      type: 'number',
      required: false,
      defaultValue: 20,
      description: 'How many neighbor tones to add (0-100%)',
      validation: { min: 0, max: 100 },
    },
    {
      name: 'type',
      type: 'enum',
      required: false,
      enumValues: ['upper', 'lower', 'both'],
      defaultValue: 'both',
      description: 'Type of neighbor tones',
    },
    {
      name: 'diatonic',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Use only diatonic neighbors',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('busyness'), createAxisId('sophistication')],
  requiresCapabilities: [],
};

/**
 * Vary melodic rhythm (keep pitches, change rhythm)
 */
export const OP_VARY_MELODIC_RHYTHM: EditOpcode = {
  id: createOpcodeId('vary_melodic_rhythm'),
  name: 'Vary Melodic Rhythm',
  description: 'Change the rhythmic pattern of melody while keeping pitch sequence.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which melody to vary',
    },
    {
      name: 'variation',
      type: 'enum',
      required: false,
      enumValues: ['augmentation', 'diminution', 'syncopate', 'swing', 'randomize'],
      defaultValue: 'syncopate',
      description: 'Type of rhythmic variation',
    },
    {
      name: 'amount',
      type: 'number',
      required: false,
      defaultValue: 50,
      description: 'Variation intensity (0-100%)',
      validation: { min: 0, max: 100 },
    },
    {
      name: 'preservePitches',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Keep exact pitch sequence',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('groove'), createAxisId('busyness')],
  requiresCapabilities: [],
};

/**
 * Create melodic sequence (repeat pattern at different pitches)
 */
export const OP_CREATE_MELODIC_SEQUENCE: EditOpcode = {
  id: createOpcodeId('create_melodic_sequence'),
  name: 'Create Melodic Sequence',
  description: 'Repeat a melodic pattern at different pitch levels.',
  params: [
    {
      name: 'source',
      type: 'scope',
      required: true,
      description: 'Melodic pattern to sequence',
    },
    {
      name: 'repetitions',
      type: 'number',
      required: false,
      defaultValue: 3,
      description: 'How many repetitions',
      validation: { min: 2, max: 8 },
    },
    {
      name: 'interval',
      type: 'number',
      required: false,
      defaultValue: 2,
      description: 'Transposition interval in semitones per repetition',
    },
    {
      name: 'direction',
      type: 'enum',
      required: false,
      enumValues: ['ascending', 'descending', 'alternating'],
      defaultValue: 'ascending',
      description: 'Sequence direction',
    },
    {
      name: 'strict',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Strict transposition vs diatonic adjustment',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('sophistication'), createAxisId('busyness')],
  requiresCapabilities: [],
};

// =============================================================================
// Arrangement Opcodes (Step 280)
// =============================================================================

/**
 * Add a new layer to the arrangement
 */
export const OP_ADD_LAYER: EditOpcode = {
  id: createOpcodeId('add_layer'),
  name: 'Add Layer',
  description: 'Add a new instrumental layer to the arrangement.',
  params: [
    {
      name: 'layerType',
      type: 'enum',
      required: true,
      enumValues: ['bass', 'pad', 'lead', 'arp', 'drums', 'percussion', 'fx', 'vocal'],
      description: 'Type of layer to add',
    },
    {
      name: 'scope',
      type: 'scope',
      required: false,
      description: 'Where to add the layer (default: everywhere)',
    },
    {
      name: 'role',
      type: 'enum',
      required: false,
      enumValues: ['melody', 'harmony', 'rhythm', 'texture', 'support'],
      defaultValue: 'harmony',
      description: 'Musical role of the layer',
    },
    {
      name: 'sourcePattern',
      type: 'entity_ref',
      required: false,
      description: 'Pattern to use as template',
    },
  ],
  affects: ['event', 'card'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('busyness'), createAxisId('energy'), createAxisId('lift')],
  requiresCapabilities: [],
};

/**
 * Remove a layer from the arrangement
 */
export const OP_REMOVE_LAYER: EditOpcode = {
  id: createOpcodeId('remove_layer'),
  name: 'Remove Layer',
  description: 'Remove an entire instrumental layer from the arrangement.',
  params: [
    {
      name: 'layer',
      type: 'entity_ref',
      required: true,
      description: 'Which layer to remove',
    },
    {
      name: 'scope',
      type: 'scope',
      required: false,
      description: 'Remove only in specific sections',
    },
    {
      name: 'redistribute',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Redistribute content to other layers',
    },
  ],
  affects: ['event', 'card'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('busyness'), createAxisId('intimacy')],
  requiresCapabilities: [],
};

/**
 * Redistribute musical roles across layers
 */
export const OP_REDISTRIBUTE_ROLES: EditOpcode = {
  id: createOpcodeId('redistribute_roles'),
  name: 'Redistribute Roles',
  description: 'Reassign musical roles (melody, bass, etc.) to different layers.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Section to redistribute',
    },
    {
      name: 'target',
      type: 'enum',
      required: false,
      enumValues: ['balanced', 'sparse', 'dense', 'custom'],
      defaultValue: 'balanced',
      description: 'Target distribution style',
    },
    {
      name: 'preserveMelody',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Keep melody assignment fixed',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('busyness'), createAxisId('energy')],
  requiresCapabilities: [],
};

/**
 * Adjust density across arrangement sections
 */
export const OP_SHAPE_ARRANGEMENT_DENSITY: EditOpcode = {
  id: createOpcodeId('shape_arrangement_density'),
  name: 'Shape Arrangement Density',
  description: 'Create density changes across sections for dynamic contrast.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Sections to shape',
    },
    {
      name: 'curve',
      type: 'enum',
      required: false,
      enumValues: ['build', 'drop', 'arch', 'valley', 'plateau', 'wave'],
      defaultValue: 'build',
      description: 'Density curve shape',
    },
    {
      name: 'intensity',
      type: 'number',
      required: false,
      defaultValue: 50,
      description: 'How dramatic the change (0-100%)',
      validation: { min: 0, max: 100 },
    },
    {
      name: 'method',
      type: 'enum',
      required: false,
      enumValues: ['layer_count', 'note_density', 'texture', 'all'],
      defaultValue: 'all',
      description: 'How to control density',
    },
  ],
  affects: ['event', 'automation'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('busyness'), createAxisId('energy'), createAxisId('lift')],
  requiresCapabilities: [],
};

/**
 * Balance layer volumes automatically
 */
export const OP_BALANCE_LAYERS: EditOpcode = {
  id: createOpcodeId('balance_layers'),
  name: 'Balance Layers',
  description: 'Automatically adjust relative volumes of layers for good mix balance.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'What to balance',
    },
    {
      name: 'style',
      type: 'enum',
      required: false,
      enumValues: ['natural', 'vocal_forward', 'drums_forward', 'balanced', 'lo_fi'],
      defaultValue: 'balanced',
      description: 'Balance style',
    },
    {
      name: 'preserveUserEdits',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Respect manual volume adjustments',
    },
  ],
  affects: ['automation', 'param'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('intimacy'), createAxisId('clarity')],
  requiresCapabilities: ['production'],
};

/**
 * Create call-and-response between layers
 */
export const OP_CREATE_CALL_AND_RESPONSE: EditOpcode = {
  id: createOpcodeId('create_call_and_response'),
  name: 'Create Call and Response',
  description: 'Set up antiphonal exchanges between two layers.',
  params: [
    {
      name: 'callLayer',
      type: 'entity_ref',
      required: true,
      description: 'Layer for the "call"',
    },
    {
      name: 'responseLayer',
      type: 'entity_ref',
      required: true,
      description: 'Layer for the "response"',
    },
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Where to apply',
    },
    {
      name: 'pattern',
      type: 'enum',
      required: false,
      enumValues: ['bar_by_bar', 'phrase_by_phrase', 'beat_by_beat'],
      defaultValue: 'phrase_by_phrase',
      description: 'Call-response pattern',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('busyness'), createAxisId('sophistication')],
  requiresCapabilities: [],
};

/**
 * Add countermelody layer
 */
export const OP_ADD_COUNTERMELODY: EditOpcode = {
  id: createOpcodeId('add_countermelody'),
  name: 'Add Countermelody',
  description: 'Generate a countermelody that complements the main melody.',
  params: [
    {
      name: 'mainMelody',
      type: 'entity_ref',
      required: true,
      description: 'Main melody to complement',
    },
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Where to add countermelody',
    },
    {
      name: 'style',
      type: 'enum',
      required: false,
      enumValues: ['contrary_motion', 'rhythmic_offset', 'harmonic_fill', 'imitative'],
      defaultValue: 'contrary_motion',
      description: 'Counterpoint style',
    },
    {
      name: 'register',
      type: 'enum',
      required: false,
      enumValues: ['above', 'below', 'interwoven'],
      defaultValue: 'below',
      description: 'Register relationship to main melody',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('busyness'), createAxisId('sophistication'), createAxisId('harmonic_richness')],
  requiresCapabilities: ['prolog'],
};

/**
 * Add rhythmic layer (ostinato pattern)
 */
export const OP_ADD_RHYTHMIC_OSTINATO: EditOpcode = {
  id: createOpcodeId('add_rhythmic_ostinato'),
  name: 'Add Rhythmic Ostinato',
  description: 'Add a repeating rhythmic pattern layer.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Where to add ostinato',
    },
    {
      name: 'layerType',
      type: 'enum',
      required: false,
      enumValues: ['percussion', 'bass', 'chord_stabs', 'melodic'],
      defaultValue: 'percussion',
      description: 'Type of ostinato layer',
    },
    {
      name: 'pattern',
      type: 'enum',
      required: false,
      enumValues: ['1bar', '2bar', '4bar', 'custom'],
      defaultValue: '1bar',
      description: 'Pattern length',
    },
    {
      name: 'complexity',
      type: 'enum',
      required: false,
      enumValues: ['simple', 'moderate', 'complex'],
      defaultValue: 'moderate',
      description: 'Rhythmic complexity',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('groove'), createAxisId('busyness'), createAxisId('energy')],
  requiresCapabilities: [],
};

/**
 * Thin out arrangement by removing events selectively
 */
export const OP_THIN_ARRANGEMENT: EditOpcode = {
  id: createOpcodeId('thin_arrangement'),
  name: 'Thin Arrangement',
  description: 'Reduce arrangement density by intelligently removing events.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'What to thin',
    },
    {
      name: 'amount',
      type: 'number',
      required: false,
      defaultValue: 30,
      description: 'How much to thin (0-100%)',
      validation: { min: 0, max: 100 },
    },
    {
      name: 'priority',
      type: 'enum',
      required: false,
      enumValues: ['preserve_melody', 'preserve_bass', 'preserve_rhythm', 'balanced'],
      defaultValue: 'preserve_melody',
      description: 'What to prioritize keeping',
    },
    {
      name: 'method',
      type: 'enum',
      required: false,
      enumValues: ['remove_duplicates', 'reduce_density', 'remove_weak_beats', 'all'],
      defaultValue: 'all',
      description: 'Thinning method',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('busyness'), createAxisId('intimacy')],
  requiresCapabilities: [],
};

/**
 * Thicken arrangement by doubling and adding fills
 */
export const OP_THICKEN_ARRANGEMENT: EditOpcode = {
  id: createOpcodeId('thicken_arrangement'),
  name: 'Thicken Arrangement',
  description: 'Increase arrangement density by doubling parts and adding fills.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'What to thicken',
    },
    {
      name: 'amount',
      type: 'number',
      required: false,
      defaultValue: 30,
      description: 'How much to thicken (0-100%)',
      validation: { min: 0, max: 100 },
    },
    {
      name: 'method',
      type: 'enum',
      required: false,
      enumValues: ['double_parts', 'add_fills', 'add_subdivisions', 'all'],
      defaultValue: 'all',
      description: 'Thickening method',
    },
    {
      name: 'targetLayers',
      type: 'entity_ref',
      required: false,
      description: 'Specific layers to thicken (comma-separated)',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('busyness'), createAxisId('energy'), createAxisId('lift')],
  requiresCapabilities: [],
};

/**
 * Create dynamic variation across repetitions
 */
export const OP_ADD_VARIATION_ON_REPEAT: EditOpcode = {
  id: createOpcodeId('add_variation_on_repeat'),
  name: 'Add Variation on Repeat',
  description: 'Make each repetition of a section slightly different.',
  params: [
    {
      name: 'section',
      type: 'entity_ref',
      required: true,
      description: 'Which section to vary',
    },
    {
      name: 'variationType',
      type: 'enum',
      required: false,
      enumValues: ['subtle', 'moderate', 'dramatic'],
      defaultValue: 'subtle',
      description: 'How much variation',
    },
    {
      name: 'aspects',
      type: 'enum',
      required: false,
      enumValues: ['melody', 'harmony', 'rhythm', 'texture', 'all'],
      defaultValue: 'texture',
      description: 'What to vary',
    },
    {
      name: 'preserveStructure',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Keep overall structure recognizable',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('sophistication'), createAxisId('busyness')],
  requiresCapabilities: [],
};

// Export all new opcodes
export const PHASE5_BATCH2_OPCODES: readonly EditOpcode[] = [
  // Melody (Step 279)
  OP_ADD_ORNAMENTATION,
  OP_SHAPE_MELODIC_CONTOUR,
  OP_SHIFT_MELODY_REGISTER,
  OP_ADD_MELODIC_PASSING_TONES,
  OP_SIMPLIFY_MELODY,
  OP_ADD_NEIGHBOR_TONES,
  OP_VARY_MELODIC_RHYTHM,
  OP_CREATE_MELODIC_SEQUENCE,
  
  // Arrangement (Step 280)
  OP_ADD_LAYER,
  OP_REMOVE_LAYER,
  OP_REDISTRIBUTE_ROLES,
  OP_SHAPE_ARRANGEMENT_DENSITY,
  OP_BALANCE_LAYERS,
  OP_CREATE_CALL_AND_RESPONSE,
  OP_ADD_COUNTERMELODY,
  OP_ADD_RHYTHMIC_OSTINATO,
  OP_THIN_ARRANGEMENT,
  OP_THICKEN_ARRANGEMENT,
  OP_ADD_VARIATION_ON_REPEAT,
];
