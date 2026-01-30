/**
 * GOFAI Edit Opcodes — Action Vocabulary for Plans
 *
 * This module defines the canonical set of opcodes (actions) that can
 * appear in GOFAI plans. Each opcode represents a specific type of
 * musical edit.
 *
 * @module gofai/canon/edit-opcodes
 */

import {
  type EditOpcode,
  type OpcodeId,
  type VocabularyTable,
  createOpcodeId,
  createAxisId,
  createVocabularyTable,
} from './types';

// =============================================================================
// Meta Opcodes (Control Flow)
// =============================================================================

const OP_CHANGE: EditOpcode = {
  id: createOpcodeId('change'),
  name: 'Change',
  description: 'Generic change opcode; usually refined to specific opcodes during planning.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What to change' },
    { name: 'goal', type: 'axis', required: true, description: 'The goal to achieve' },
    { name: 'amount', type: 'amount', required: false, description: 'How much to change' },
  ],
  affects: ['event', 'param'],
  effectType: 'mutate',
  cost: 'medium',
};

const OP_ADD: EditOpcode = {
  id: createOpcodeId('add'),
  name: 'Add',
  description: 'Add something to the arrangement.',
  params: [
    { name: 'target', type: 'entity_ref', required: true, description: 'What to add' },
    { name: 'scope', type: 'scope', required: false, description: 'Where to add it' },
  ],
  affects: ['event', 'card'],
  effectType: 'mutate',
  cost: 'medium',
};

const OP_REMOVE: EditOpcode = {
  id: createOpcodeId('remove'),
  name: 'Remove',
  description: 'Remove something from the arrangement.',
  params: [
    { name: 'target', type: 'entity_ref', required: true, description: 'What to remove' },
    { name: 'scope', type: 'scope', required: false, description: 'Where to remove from' },
  ],
  affects: ['event', 'card'],
  effectType: 'mutate',
  cost: 'medium',
};

const OP_DUPLICATE: EditOpcode = {
  id: createOpcodeId('duplicate'),
  name: 'Duplicate',
  description: 'Duplicate events or sections.',
  params: [
    { name: 'source', type: 'scope', required: true, description: 'What to duplicate' },
    { name: 'destination', type: 'scope', required: false, description: 'Where to place the copy' },
    { name: 'count', type: 'number', required: false, defaultValue: 1, description: 'How many copies' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
};

const OP_MOVE: EditOpcode = {
  id: createOpcodeId('move'),
  name: 'Move',
  description: 'Move events in time.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What to move' },
    { name: 'offset', type: 'number', required: true, description: 'How much to move (in ticks)' },
    { name: 'direction', type: 'enum', required: true, enumValues: ['earlier', 'later'], description: 'Direction' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
};

const OP_UNDO: EditOpcode = {
  id: createOpcodeId('undo'),
  name: 'Undo',
  description: 'Undo a previous edit.',
  params: [
    { name: 'target', type: 'entity_ref', required: false, description: 'Specific package to undo' },
    { name: 'count', type: 'number', required: false, defaultValue: 1, description: 'How many undos' },
  ],
  affects: [],
  effectType: 'mutate',
  cost: 'low',
};

const OP_REDO: EditOpcode = {
  id: createOpcodeId('redo'),
  name: 'Redo',
  description: 'Redo an undone edit.',
  params: [
    { name: 'target', type: 'entity_ref', required: false, description: 'Specific package to redo' },
    { name: 'count', type: 'number', required: false, defaultValue: 1, description: 'How many redos' },
  ],
  affects: [],
  effectType: 'mutate',
  cost: 'low',
};

const OP_INCREASE: EditOpcode = {
  id: createOpcodeId('increase'),
  name: 'Increase',
  description: 'Increase an axis or parameter value.',
  params: [
    { name: 'axis', type: 'axis', required: true, description: 'What axis to increase' },
    { name: 'scope', type: 'scope', required: false, description: 'Where to apply' },
    { name: 'amount', type: 'amount', required: false, description: 'How much to increase' },
  ],
  affects: ['event', 'param'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [], // Populated dynamically based on axis param
};

const OP_DECREASE: EditOpcode = {
  id: createOpcodeId('decrease'),
  name: 'Decrease',
  description: 'Decrease an axis or parameter value.',
  params: [
    { name: 'axis', type: 'axis', required: true, description: 'What axis to decrease' },
    { name: 'scope', type: 'scope', required: false, description: 'Where to apply' },
    { name: 'amount', type: 'amount', required: false, description: 'How much to decrease' },
  ],
  affects: ['event', 'param'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [], // Populated dynamically based on axis param
};

// =============================================================================
// Parameter Opcodes
// =============================================================================

const OP_SET_PARAM: EditOpcode = {
  id: createOpcodeId('set_param'),
  name: 'Set Parameter',
  description: 'Set a card parameter to a specific value.',
  params: [
    { name: 'cardRef', type: 'entity_ref', required: true, description: 'Which card' },
    { name: 'param', type: 'string', required: true, description: 'Parameter name' },
    { name: 'value', type: 'number', required: true, description: 'New value' },
  ],
  affects: ['param'],
  effectType: 'mutate',
  cost: 'low',
  requiresCapabilities: ['production'],
};

// =============================================================================
// Register and Pitch Opcodes
// =============================================================================

const OP_SHIFT_REGISTER: EditOpcode = {
  id: createOpcodeId('shift_register'),
  name: 'Shift Register',
  description: 'Shift notes up or down in pitch.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What notes to shift' },
    { name: 'direction', type: 'enum', required: true, enumValues: ['up', 'down'], description: 'Direction' },
    { name: 'semitones', type: 'number', required: true, description: 'How many semitones' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('brightness'), createAxisId('lift')],
};

const OP_TRANSPOSE: EditOpcode = {
  id: createOpcodeId('transpose'),
  name: 'Transpose',
  description: 'Transpose notes by a fixed interval.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What notes to transpose' },
    { name: 'semitones', type: 'number', required: true, description: 'Interval in semitones' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
};

// =============================================================================
// Density and Texture Opcodes
// =============================================================================

const OP_ADJUST_DENSITY: EditOpcode = {
  id: createOpcodeId('adjust_density'),
  name: 'Adjust Density',
  description: 'Increase or decrease note density.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'Where to adjust' },
    { name: 'direction', type: 'enum', required: true, enumValues: ['increase', 'decrease'], description: 'Direction' },
    { name: 'amount', type: 'amount', required: false, description: 'How much' },
    { name: 'layer', type: 'entity_ref', required: false, description: 'Specific layer' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('busyness'), createAxisId('energy')],
};

const OP_THIN_TEXTURE: EditOpcode = {
  id: createOpcodeId('thin_texture'),
  name: 'Thin Texture',
  description: 'Reduce textural density by removing notes.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'Where to thin' },
    { name: 'amount', type: 'amount', required: false, description: 'How much to thin' },
    { name: 'preserve', type: 'enum', required: false, enumValues: ['melody', 'harmony', 'rhythm'], description: 'What to preserve' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('busyness'), createAxisId('intimacy')],
};

const OP_ADJUST_LAYERS: EditOpcode = {
  id: createOpcodeId('adjust_layers'),
  name: 'Adjust Layers',
  description: 'Add or remove instrumental layers.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'Where to adjust' },
    { name: 'direction', type: 'enum', required: true, enumValues: ['add', 'remove'], description: 'Direction' },
    { name: 'layer', type: 'entity_ref', required: false, description: 'Specific layer type' },
  ],
  affects: ['event', 'card'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('busyness'), createAxisId('energy')],
};

// =============================================================================
// Rhythm and Timing Opcodes
// =============================================================================

const OP_ADJUST_QUANTIZE: EditOpcode = {
  id: createOpcodeId('adjust_quantize'),
  name: 'Adjust Quantize',
  description: 'Adjust quantization strength.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What to quantize' },
    { name: 'strength', type: 'number', required: false, description: 'Quantize strength 0-100%' },
    { name: 'grid', type: 'enum', required: false, enumValues: ['1/4', '1/8', '1/16', '1/32'], description: 'Grid division' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('tightness')],
};

const OP_ADJUST_SWING: EditOpcode = {
  id: createOpcodeId('adjust_swing'),
  name: 'Adjust Swing',
  description: 'Adjust swing feel.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What to swing' },
    { name: 'amount', type: 'number', required: true, description: 'Swing amount 0-100%', validation: { min: 0, max: 100 } },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('groove')],
};

const OP_ADJUST_HUMANIZE: EditOpcode = {
  id: createOpcodeId('adjust_humanize'),
  name: 'Adjust Humanize',
  description: 'Add or remove timing humanization.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What to humanize' },
    { name: 'timing', type: 'number', required: false, description: 'Timing variation %' },
    { name: 'velocity', type: 'number', required: false, description: 'Velocity variation %' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('tightness'), createAxisId('groove')],
};

const OP_ALIGN_MICROTIMING: EditOpcode = {
  id: createOpcodeId('align_microtiming'),
  name: 'Align Microtiming',
  description: 'Align microtiming across layers.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What to align' },
    { name: 'reference', type: 'entity_ref', required: false, description: 'Reference layer for alignment' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('tightness')],
};

const OP_ADD_GHOST_NOTES: EditOpcode = {
  id: createOpcodeId('add_ghost_notes'),
  name: 'Add Ghost Notes',
  description: 'Add ghost notes for groove.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'Where to add ghost notes' },
    { name: 'density', type: 'amount', required: false, description: 'How many ghost notes' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('groove')],
};

const OP_ADD_SYNCOPATION: EditOpcode = {
  id: createOpcodeId('add_syncopation'),
  name: 'Add Syncopation',
  description: 'Add syncopation to rhythm.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'Where to add syncopation' },
    { name: 'amount', type: 'amount', required: false, description: 'How much syncopation' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('groove'), createAxisId('motion')],
};

// =============================================================================
// Dynamic Opcodes
// =============================================================================

const OP_ADJUST_DYNAMICS: EditOpcode = {
  id: createOpcodeId('adjust_dynamics'),
  name: 'Adjust Dynamics',
  description: 'Adjust dynamic range.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What to adjust' },
    { name: 'direction', type: 'enum', required: true, enumValues: ['expand', 'compress'], description: 'Direction' },
    { name: 'amount', type: 'amount', required: false, description: 'How much' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('energy'), createAxisId('intimacy')],
};

const OP_ADJUST_VELOCITIES: EditOpcode = {
  id: createOpcodeId('adjust_velocities'),
  name: 'Adjust Velocities',
  description: 'Adjust note velocities.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What notes to adjust' },
    { name: 'direction', type: 'enum', required: true, enumValues: ['increase', 'decrease'], description: 'Direction' },
    { name: 'amount', type: 'number', required: true, description: 'Amount (velocity units)' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('impact'), createAxisId('energy')],
};

const OP_ADD_ACCENTS: EditOpcode = {
  id: createOpcodeId('add_accents'),
  name: 'Add Accents',
  description: 'Add dynamic accents.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'Where to add accents' },
    { name: 'pattern', type: 'enum', required: false, enumValues: ['downbeats', 'backbeats', 'every_other'], description: 'Accent pattern' },
    { name: 'strength', type: 'number', required: false, description: 'Accent strength' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('impact')],
};

const OP_ADD_DYNAMIC_CONTOUR: EditOpcode = {
  id: createOpcodeId('add_dynamic_contour'),
  name: 'Add Dynamic Contour',
  description: 'Add a dynamic shape over time.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'Where to apply contour' },
    { name: 'contour', type: 'enum', required: true, enumValues: ['swell', 'fade', 'crescendo', 'decrescendo'], description: 'Contour shape' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('lift'), createAxisId('energy')],
};

// =============================================================================
// Harmony Opcodes
// =============================================================================

const OP_ADD_EXTENSIONS: EditOpcode = {
  id: createOpcodeId('add_extensions'),
  name: 'Add Extensions',
  description: 'Add chord extensions (7ths, 9ths, etc.).',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What chords to extend' },
    { name: 'extensions', type: 'enum', required: false, enumValues: ['7th', '9th', '11th', '13th'], description: 'Which extensions' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('brightness'), createAxisId('tension')],
};

const OP_OPEN_VOICINGS: EditOpcode = {
  id: createOpcodeId('open_voicings'),
  name: 'Open Voicings',
  description: 'Spread voicings wider.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What chords to open' },
    { name: 'spread', type: 'number', required: false, description: 'Spread amount in semitones' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('lift'), createAxisId('width')],
};

const OP_ADD_TENSION: EditOpcode = {
  id: createOpcodeId('add_tension'),
  name: 'Add Tension',
  description: 'Add harmonic tension devices.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'Where to add tension' },
    { name: 'device', type: 'enum', required: false, enumValues: ['suspension', 'chromaticism', 'tritone_sub'], description: 'Tension device' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('tension')],
};

const OP_RESOLVE_TENSION: EditOpcode = {
  id: createOpcodeId('resolve_tension'),
  name: 'Resolve Tension',
  description: 'Resolve harmonic tension.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What to resolve' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('tension')],
};

const OP_CHROMATIC_SUBSTITUTE: EditOpcode = {
  id: createOpcodeId('chromatic_substitute'),
  name: 'Chromatic Substitute',
  description: 'Apply chromatic chord substitution.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What chords to substitute' },
    { name: 'type', type: 'enum', required: false, enumValues: ['tritone', 'chromatic_mediant', 'borrowed'], description: 'Substitution type' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('tension')],
};

const OP_ADJUST_HARMONIC_RHYTHM: EditOpcode = {
  id: createOpcodeId('adjust_harmonic_rhythm'),
  name: 'Adjust Harmonic Rhythm',
  description: 'Change how often chords change.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'Where to adjust' },
    { name: 'direction', type: 'enum', required: true, enumValues: ['faster', 'slower'], description: 'Direction' },
    { name: 'factor', type: 'number', required: false, description: 'Speed factor' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('motion')],
};

// =============================================================================
// Melodic Opcodes
// =============================================================================

const OP_SIMPLIFY_ORNAMENTS: EditOpcode = {
  id: createOpcodeId('simplify_ornaments'),
  name: 'Simplify Ornaments',
  description: 'Remove melodic ornaments and embellishments.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What melody to simplify' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('busyness')],
};

const OP_ADD_ARPEGGIATION: EditOpcode = {
  id: createOpcodeId('add_arpeggiation'),
  name: 'Add Arpeggiation',
  description: 'Convert block chords to arpeggios.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What to arpeggiate' },
    { name: 'pattern', type: 'enum', required: false, enumValues: ['up', 'down', 'updown', 'random'], description: 'Arpeggio pattern' },
    { name: 'rate', type: 'enum', required: false, enumValues: ['1/4', '1/8', '1/16'], description: 'Note rate' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('motion'), createAxisId('busyness')],
};

const OP_ADD_RHYTHMIC_VARIATION: EditOpcode = {
  id: createOpcodeId('add_rhythmic_variation'),
  name: 'Add Rhythmic Variation',
  description: 'Add rhythmic variation to patterns.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What to vary' },
    { name: 'amount', type: 'amount', required: false, description: 'How much variation' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('motion')],
};

const OP_ADD_ANTICIPATION: EditOpcode = {
  id: createOpcodeId('add_anticipation'),
  name: 'Add Anticipation',
  description: 'Add rhythmic anticipations.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What to anticipate' },
    { name: 'amount', type: 'number', required: false, description: 'Anticipation amount (ticks)' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('tension'), createAxisId('motion')],
};

const OP_SHAPE_PHRASES: EditOpcode = {
  id: createOpcodeId('shape_phrases'),
  name: 'Shape Phrases',
  description: 'Adjust phrase shapes and contours.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What phrases to shape' },
    { name: 'shape', type: 'enum', required: false, enumValues: ['arch', 'ascending', 'descending'], description: 'Target shape' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('motion')],
};

const OP_ADJUST_SUBDIVISION: EditOpcode = {
  id: createOpcodeId('adjust_subdivision'),
  name: 'Adjust Subdivision',
  description: 'Change rhythmic subdivision.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What to adjust' },
    { name: 'direction', type: 'enum', required: true, enumValues: ['double', 'halve'], description: 'Direction' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('busyness')],
};

// =============================================================================
// Inspection Opcodes (Read-Only)
// =============================================================================

const OP_INSPECT: EditOpcode = {
  id: createOpcodeId('inspect'),
  name: 'Inspect',
  description: 'Inspect project state without modifying.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What to inspect' },
    { name: 'query', type: 'string', required: true, description: 'What to look for' },
  ],
  affects: [],
  effectType: 'inspect',
  cost: 'low',
};

const OP_EXPLAIN: EditOpcode = {
  id: createOpcodeId('explain'),
  name: 'Explain',
  description: 'Explain a previous action or current state.',
  params: [
    { name: 'target', type: 'entity_ref', required: false, description: 'What to explain' },
  ],
  affects: [],
  effectType: 'inspect',
  cost: 'low',
};

// =============================================================================
// Production Opcodes
// =============================================================================

const OP_ADJUST_PANNING: EditOpcode = {
  id: createOpcodeId('adjust_panning'),
  name: 'Adjust Panning',
  description: 'Adjust stereo panning.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What to pan' },
    { name: 'direction', type: 'enum', required: true, enumValues: ['left', 'right', 'center', 'spread'], description: 'Pan direction' },
    { name: 'amount', type: 'number', required: false, description: 'Pan amount' },
  ],
  affects: ['param'],
  effectType: 'mutate',
  cost: 'low',
  requiresCapabilities: ['production'],
  affectsAxes: [createAxisId('width')],
};

const OP_SPREAD_ARRANGEMENT: EditOpcode = {
  id: createOpcodeId('spread_arrangement'),
  name: 'Spread Arrangement',
  description: 'Spread layers across stereo field.',
  params: [
    { name: 'scope', type: 'scope', required: true, description: 'What to spread' },
    { name: 'amount', type: 'amount', required: false, description: 'Spread amount' },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('width')],
};

const OP_SUGGEST_INSTRUMENT: EditOpcode = {
  id: createOpcodeId('suggest_instrument'),
  name: 'Suggest Instrument',
  description: 'Suggest an instrument change for timbral goals.',
  params: [
    { name: 'layer', type: 'entity_ref', required: true, description: 'What layer' },
    { name: 'goal', type: 'axis', required: true, description: 'Timbral goal' },
  ],
  affects: ['card'],
  effectType: 'propose',
  cost: 'high',
  affectsAxes: [createAxisId('brightness'), createAxisId('warmth')],
};

// =============================================================================
// Opcode Table
// =============================================================================

/**
 * All core opcodes.
 */
export const CORE_OPCODES: readonly EditOpcode[] = [
  // Meta
  OP_CHANGE,
  OP_ADD,
  OP_REMOVE,
  OP_DUPLICATE,
  OP_MOVE,
  OP_UNDO,
  OP_REDO,
  OP_INCREASE,
  OP_DECREASE,
  // Parameters
  OP_SET_PARAM,
  // Register/Pitch
  OP_SHIFT_REGISTER,
  OP_TRANSPOSE,
  // Density/Texture
  OP_ADJUST_DENSITY,
  OP_THIN_TEXTURE,
  OP_ADJUST_LAYERS,
  // Rhythm/Timing
  OP_ADJUST_QUANTIZE,
  OP_ADJUST_SWING,
  OP_ADJUST_HUMANIZE,
  OP_ALIGN_MICROTIMING,
  OP_ADD_GHOST_NOTES,
  OP_ADD_SYNCOPATION,
  // Dynamics
  OP_ADJUST_DYNAMICS,
  OP_ADJUST_VELOCITIES,
  OP_ADD_ACCENTS,
  OP_ADD_DYNAMIC_CONTOUR,
  // Harmony
  OP_ADD_EXTENSIONS,
  OP_OPEN_VOICINGS,
  OP_ADD_TENSION,
  OP_RESOLVE_TENSION,
  OP_CHROMATIC_SUBSTITUTE,
  OP_ADJUST_HARMONIC_RHYTHM,
  // Melodic
  OP_SIMPLIFY_ORNAMENTS,
  OP_ADD_ARPEGGIATION,
  OP_ADD_RHYTHMIC_VARIATION,
  OP_ADD_ANTICIPATION,
  OP_SHAPE_PHRASES,
  OP_ADJUST_SUBDIVISION,
  // Inspection
  OP_INSPECT,
  OP_EXPLAIN,
  // Production
  OP_ADJUST_PANNING,
  OP_SPREAD_ARRANGEMENT,
  OP_SUGGEST_INSTRUMENT,
];

/**
 * Opcode vocabulary table.
 */
export const OPCODES_TABLE: VocabularyTable<EditOpcode> = createVocabularyTable(CORE_OPCODES);

// =============================================================================
// Opcode Utilities
// =============================================================================

/**
 * Get an opcode by ID.
 */
export function getOpcodeById(id: OpcodeId): EditOpcode | undefined {
  return OPCODES_TABLE.byId.get(id);
}

/**
 * Get an opcode by name.
 */
export function getOpcodeByName(name: string): EditOpcode | undefined {
  return OPCODES_TABLE.byVariant.get(name.toLowerCase());
}

/**
 * Get all opcodes that affect a specific axis.
 */
export function getOpcodesForAxis(axisId: string): readonly EditOpcode[] {
  return CORE_OPCODES.filter(
    op => op.affectsAxes && op.affectsAxes.some(a => a === axisId)
  );
}

/**
 * Get all opcodes by effect type.
 */
export function getOpcodesByEffectType(
  effectType: EditOpcode['effectType']
): readonly EditOpcode[] {
  return CORE_OPCODES.filter(op => op.effectType === effectType);
}

/**
 * Get all opcodes that require specific capabilities.
 */
export function getOpcodesRequiringCapability(capability: string): readonly EditOpcode[] {
  return CORE_OPCODES.filter(
    op => op.requiresCapabilities && op.requiresCapabilities.includes(capability)
  );
}

/**
 * Check if an opcode is safe (non-mutating).
 */
export function isOpcodeInspectOnly(opcode: EditOpcode): boolean {
  return opcode.effectType === 'inspect';
}

/**
 * Check if an opcode is available given capabilities.
 */
export function isOpcodeAvailable(
  opcode: EditOpcode,
  capabilities: readonly string[]
): boolean {
  if (!opcode.requiresCapabilities) return true;
  return opcode.requiresCapabilities.every(cap => capabilities.includes(cap));
}
