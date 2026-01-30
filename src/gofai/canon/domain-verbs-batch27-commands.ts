/**
 * @file Domain Verbs Batch 27 - Natural Language Commands & Actions
 * @module gofai/canon/domain-verbs-batch27-commands
 * 
 * Comprehensive natural language verbs and command phrases musicians use.
 * This batch focuses on the full spectrum of editing and transformation verbs
 * covering:
 * 
 * - Imperative commands ("make", "change", "add", "remove", "fix", "adjust")
 * - Transformation verbs ("transform", "convert", "shift", "transpose", "stretch")
 * - Modification verbs ("tweak", "tune", "dial in", "massage", "refine")
 * - Creation verbs ("create", "generate", "build", "compose", "develop")
 * - Destruction verbs ("delete", "remove", "cut", "strip", "eliminate")
 * - Movement verbs ("move", "shift", "push", "pull", "slide")
 * - Copying verbs ("copy", "duplicate", "clone", "repeat", "double")
 * - Blending verbs ("blend", "mix", "merge", "combine", "fuse")
 * - Separation verbs ("split", "separate", "isolate", "extract", "divide")
 * - Temporal verbs ("delay", "advance", "slow", "speed up", "stretch")
 * - Dynamic verbs ("fade", "ramp", "crescendo", "swell", "build")
 * - Harmonic verbs ("harmonize", "reharmonize", "modulate", "transpose")
 * - Rhythmic verbs ("quantize", "swing", "shuffle", "syncopate", "groove")
 * - Textural verbs ("thicken", "thin", "layer", "pad out", "strip down")
 * - Melodic verbs ("embellish", "simplify", "ornament", "vary", "develop")
 * 
 * Total Target: 600+ LOC with comprehensive verb coverage
 * 
 * @see gofai_goalB.md Phase 1 - Canonical Ontology + Extensible Symbol Tables
 * @see gofaimusicplus.md Section 4 - The 100K+ LOC English → CPL Parser
 */

import type { LexemeId, OpcodeId } from './types';
import { createLexemeId, createOpcodeId } from './types';

/**
 * Verb lexeme for musical actions and commands.
 */
export interface VerbLexeme {
  readonly id: LexemeId;
  readonly baseForm: string;
  readonly conjugations: VerbConjugation;
  readonly category: VerbCategory;
  readonly subcategory: string;
  readonly description: string;
  readonly synonyms: readonly string[];
  readonly antonyms: readonly string[];
  readonly examples: readonly string[];
  readonly mappedOpcodes: readonly OpcodeId[];
  readonly requiresObject: boolean;
  readonly requiresScope: boolean;
  readonly colloquialVariants: readonly string[];
  readonly register: 'formal' | 'informal' | 'technical' | 'slang';
}

/**
 * Verb conjugation forms.
 */
export interface VerbConjugation {
  readonly present: string;          // "make"
  readonly presentParticiple: string; // "making"
  readonly pastSimple: string;        // "made"
  readonly pastParticiple: string;    // "made"
  readonly thirdPerson: string;       // "makes"
  readonly imperative: string;        // "make"
}

/**
 * Verb category for semantic grouping.
 */
export type VerbCategory =
  | 'imperative'      // make, do, change
  | 'creation'        // add, create, generate
  | 'destruction'     // remove, delete, clear
  | 'transformation'  // transform, change, modify
  | 'movement'        // move, shift, transpose
  | 'duplication'     // copy, duplicate, repeat
  | 'combination'     // blend, merge, mix
  | 'separation'      // split, separate, isolate
  | 'adjustment'      // adjust, tweak, tune
  | 'temporal'        // delay, advance, stretch
  | 'dynamic'         // fade, crescendo, swell
  | 'harmonic'        // harmonize, modulate, reharmonize
  | 'rhythmic'        // quantize, swing, syncopate
  | 'textural'        // thicken, thin, layer
  | 'melodic'         // embellish, simplify, ornament
  | 'spatial'         // pan, place, position
  | 'tonal';          // brighten, darken, warm

// =============================================================================
// Imperative/Command Verbs
// =============================================================================

export const IMPERATIVE_VERBS: readonly VerbLexeme[] = [
  {
    id: createLexemeId('verb', 'make'),
    baseForm: 'make',
    conjugations: {
      present: 'make',
      presentParticiple: 'making',
      pastSimple: 'made',
      pastParticiple: 'made',
      thirdPerson: 'makes',
      imperative: 'make',
    },
    category: 'imperative',
    subcategory: 'general_command',
    description: 'General purpose transformation command',
    synonyms: ['create', 'turn', 'render', 'transform'],
    antonyms: ['unmake', 'undo'],
    examples: [
      'make it brighter',
      'make the drums tighter',
      'make it more groovy',
      'make this sound warmer',
    ],
    mappedOpcodes: [createOpcodeId('transform')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['get it', 'turn it', 'have it'],
    register: 'informal',
  },

  {
    id: createLexemeId('verb', 'change'),
    baseForm: 'change',
    conjugations: {
      present: 'change',
      presentParticiple: 'changing',
      pastSimple: 'changed',
      pastParticiple: 'changed',
      thirdPerson: 'changes',
      imperative: 'change',
    },
    category: 'imperative',
    subcategory: 'general_command',
    description: 'Modify existing property or quality',
    synonyms: ['modify', 'alter', 'adjust', 'vary'],
    antonyms: ['keep', 'preserve', 'maintain'],
    examples: [
      'change the tempo',
      'change the key',
      'change the drums',
      'change it to minor',
    ],
    mappedOpcodes: [createOpcodeId('modify'), createOpcodeId('set')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['switch', 'swap', 'flip'],
    register: 'informal',
  },

  {
    id: createLexemeId('verb', 'fix'),
    baseForm: 'fix',
    conjugations: {
      present: 'fix',
      presentParticiple: 'fixing',
      pastSimple: 'fixed',
      pastParticiple: 'fixed',
      thirdPerson: 'fixes',
      imperative: 'fix',
    },
    category: 'imperative',
    subcategory: 'correction',
    description: 'Correct a problem or issue',
    synonyms: ['correct', 'repair', 'resolve', 'address'],
    antonyms: ['break', 'mess up'],
    examples: [
      'fix the timing',
      'fix the muddy bass',
      'fix that harsh cymbal',
      'fix the sloppy drums',
    ],
    mappedOpcodes: [createOpcodeId('correct'), createOpcodeId('adjust')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['sort out', 'clean up', 'tidy up'],
    register: 'informal',
  },

  {
    id: createLexemeId('verb', 'adjust'),
    baseForm: 'adjust',
    conjugations: {
      present: 'adjust',
      presentParticiple: 'adjusting',
      pastSimple: 'adjusted',
      pastParticiple: 'adjusted',
      thirdPerson: 'adjusts',
      imperative: 'adjust',
    },
    category: 'adjustment',
    subcategory: 'fine_tuning',
    description: 'Make fine-grained modifications',
    synonyms: ['tweak', 'tune', 'refine', 'dial in'],
    antonyms: [],
    examples: [
      'adjust the timing',
      'adjust the levels',
      'adjust the swing',
      'adjust the brightness',
    ],
    mappedOpcodes: [createOpcodeId('adjust')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['tweak', 'dial in', 'massage'],
    register: 'informal',
  },

  {
    id: createLexemeId('verb', 'tweak'),
    baseForm: 'tweak',
    conjugations: {
      present: 'tweak',
      presentParticiple: 'tweaking',
      pastSimple: 'tweaked',
      pastParticiple: 'tweaked',
      thirdPerson: 'tweaks',
      imperative: 'tweak',
    },
    category: 'adjustment',
    subcategory: 'fine_tuning',
    description: 'Make small, subtle adjustments',
    synonyms: ['adjust', 'fine-tune', 'dial in', 'massage'],
    antonyms: [],
    examples: [
      'tweak the EQ',
      'tweak the timing a bit',
      'just tweak it slightly',
      'tweak the levels',
    ],
    mappedOpcodes: [createOpcodeId('adjust')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['massage', 'nudge', 'dial in'],
    register: 'informal',
  },
];

// =============================================================================
// Creation Verbs
// =============================================================================

export const CREATION_VERBS: readonly VerbLexeme[] = [
  {
    id: createLexemeId('verb', 'add'),
    baseForm: 'add',
    conjugations: {
      present: 'add',
      presentParticiple: 'adding',
      pastSimple: 'added',
      pastParticiple: 'added',
      thirdPerson: 'adds',
      imperative: 'add',
    },
    category: 'creation',
    subcategory: 'insertion',
    description: 'Insert new musical material',
    synonyms: ['insert', 'include', 'put in', 'introduce'],
    antonyms: ['remove', 'delete', 'take out'],
    examples: [
      'add drums',
      'add a harmony part',
      'add some reverb',
      'add more energy',
    ],
    mappedOpcodes: [createOpcodeId('insert'), createOpcodeId('add_layer')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['throw in', 'stick in', 'drop in'],
    register: 'informal',
  },

  {
    id: createLexemeId('verb', 'create'),
    baseForm: 'create',
    conjugations: {
      present: 'create',
      presentParticiple: 'creating',
      pastSimple: 'created',
      pastParticiple: 'created',
      thirdPerson: 'creates',
      imperative: 'create',
    },
    category: 'creation',
    subcategory: 'generation',
    description: 'Generate new musical material from scratch',
    synonyms: ['generate', 'make', 'compose', 'build'],
    antonyms: ['destroy', 'delete'],
    examples: [
      'create a melody',
      'create a bassline',
      'create harmony',
      'create a rhythm',
    ],
    mappedOpcodes: [createOpcodeId('generate')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['make', 'build', 'whip up'],
    register: 'informal',
  },

  {
    id: createLexemeId('verb', 'insert'),
    baseForm: 'insert',
    conjugations: {
      present: 'insert',
      presentParticiple: 'inserting',
      pastSimple: 'inserted',
      pastParticiple: 'inserted',
      thirdPerson: 'inserts',
      imperative: 'insert',
    },
    category: 'creation',
    subcategory: 'insertion',
    description: 'Place new material at a specific location',
    synonyms: ['add', 'place', 'put in'],
    antonyms: ['remove', 'extract'],
    examples: [
      'insert a break',
      'insert a fill',
      'insert harmony',
      'insert two bars before the chorus',
    ],
    mappedOpcodes: [createOpcodeId('insert')],
    requiresObject: true,
    requiresScope: true,
    colloquialVariants: ['drop in', 'stick in', 'throw in'],
    register: 'informal',
  },

  {
    id: createLexemeId('verb', 'generate'),
    baseForm: 'generate',
    conjugations: {
      present: 'generate',
      presentParticiple: 'generating',
      pastSimple: 'generated',
      pastParticiple: 'generated',
      thirdPerson: 'generates',
      imperative: 'generate',
    },
    category: 'creation',
    subcategory: 'generation',
    description: 'Algorithmically create new material',
    synonyms: ['create', 'produce', 'synthesize'],
    antonyms: [],
    examples: [
      'generate a melody',
      'generate variations',
      'generate harmony',
      'generate rhythm patterns',
    ],
    mappedOpcodes: [createOpcodeId('generate')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['make', 'come up with'],
    register: 'technical',
  },

  {
    id: createLexemeId('verb', 'introduce'),
    baseForm: 'introduce',
    conjugations: {
      present: 'introduce',
      presentParticiple: 'introducing',
      pastSimple: 'introduced',
      pastParticiple: 'introduced',
      thirdPerson: 'introduces',
      imperative: 'introduce',
    },
    category: 'creation',
    subcategory: 'insertion',
    description: 'Bring in new elements gradually or deliberately',
    synonyms: ['add', 'bring in', 'incorporate'],
    antonyms: ['remove', 'eliminate'],
    examples: [
      'introduce the harmony',
      'introduce new elements',
      'introduce strings',
      'introduce gradually',
    ],
    mappedOpcodes: [createOpcodeId('insert'), createOpcodeId('fade_in')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['bring in', 'drop in'],
    register: 'formal',
  },
];

// =============================================================================
// Destruction/Removal Verbs
// =============================================================================

export const DESTRUCTION_VERBS: readonly VerbLexeme[] = [
  {
    id: createLexemeId('verb', 'remove'),
    baseForm: 'remove',
    conjugations: {
      present: 'remove',
      presentParticiple: 'removing',
      pastSimple: 'removed',
      pastParticiple: 'removed',
      thirdPerson: 'removes',
      imperative: 'remove',
    },
    category: 'destruction',
    subcategory: 'deletion',
    description: 'Delete or take away musical material',
    synonyms: ['delete', 'take out', 'eliminate', 'strip'],
    antonyms: ['add', 'insert', 'include'],
    examples: [
      'remove the drums',
      'remove the reverb',
      'remove that layer',
      'remove the harmony',
    ],
    mappedOpcodes: [createOpcodeId('delete'), createOpcodeId('remove_layer')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['take out', 'get rid of', 'ditch'],
    register: 'informal',
  },

  {
    id: createLexemeId('verb', 'delete'),
    baseForm: 'delete',
    conjugations: {
      present: 'delete',
      presentParticiple: 'deleting',
      pastSimple: 'deleted',
      pastParticiple: 'deleted',
      thirdPerson: 'deletes',
      imperative: 'delete',
    },
    category: 'destruction',
    subcategory: 'deletion',
    description: 'Completely remove material',
    synonyms: ['remove', 'erase', 'eliminate'],
    antonyms: ['add', 'create', 'insert'],
    examples: [
      'delete the drums',
      'delete that section',
      'delete the reverb',
      'delete everything in the verse',
    ],
    mappedOpcodes: [createOpcodeId('delete')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['trash', 'nuke', 'kill'],
    register: 'informal',
  },

  {
    id: createLexemeId('verb', 'cut'),
    baseForm: 'cut',
    conjugations: {
      present: 'cut',
      presentParticiple: 'cutting',
      pastSimple: 'cut',
      pastParticiple: 'cut',
      thirdPerson: 'cuts',
      imperative: 'cut',
    },
    category: 'destruction',
    subcategory: 'reduction',
    description: 'Remove or reduce significantly',
    synonyms: ['reduce', 'trim', 'remove', 'slash'],
    antonyms: ['boost', 'add', 'increase'],
    examples: [
      'cut the bass',
      'cut the drums for two bars',
      'cut the reverb',
      'cut everything before the chorus',
    ],
    mappedOpcodes: [createOpcodeId('delete'), createOpcodeId('reduce'), createOpcodeId('attenuate')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['chop', 'slash', 'drop'],
    register: 'informal',
  },

  {
    id: createLexemeId('verb', 'strip'),
    baseForm: 'strip',
    conjugations: {
      present: 'strip',
      presentParticiple: 'stripping',
      pastSimple: 'stripped',
      pastParticiple: 'stripped',
      thirdPerson: 'strips',
      imperative: 'strip',
    },
    category: 'destruction',
    subcategory: 'reduction',
    description: 'Remove elements to simplify or bare down',
    synonyms: ['remove', 'thin', 'simplify', 'reduce'],
    antonyms: ['add', 'build', 'layer'],
    examples: [
      'strip away the layers',
      'strip it back',
      'strip down the arrangement',
      'strip everything but drums and bass',
    ],
    mappedOpcodes: [createOpcodeId('thin_texture'), createOpcodeId('remove_layers')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['strip back', 'strip down', 'bare down'],
    register: 'informal',
  },

  {
    id: createLexemeId('verb', 'clear'),
    baseForm: 'clear',
    conjugations: {
      present: 'clear',
      presentParticiple: 'clearing',
      pastSimple: 'cleared',
      pastParticiple: 'cleared',
      thirdPerson: 'clears',
      imperative: 'clear',
    },
    category: 'destruction',
    subcategory: 'deletion',
    description: 'Remove all material from a scope',
    synonyms: ['delete all', 'empty', 'erase'],
    antonyms: ['fill', 'populate'],
    examples: [
      'clear the verse',
      'clear everything',
      'clear the drums',
      'clear the last two bars',
    ],
    mappedOpcodes: [createOpcodeId('delete_all')],
    requiresObject: false,
    requiresScope: true,
    colloquialVariants: ['wipe', 'empty out'],
    register: 'informal',
  },
];

// =============================================================================
// Movement/Transformation Verbs
// =============================================================================

export const MOVEMENT_VERBS: readonly VerbLexeme[] = [
  {
    id: createLexemeId('verb', 'move'),
    baseForm: 'move',
    conjugations: {
      present: 'move',
      presentParticiple: 'moving',
      pastSimple: 'moved',
      pastParticiple: 'moved',
      thirdPerson: 'moves',
      imperative: 'move',
    },
    category: 'movement',
    subcategory: 'relocation',
    description: 'Change position in time or space',
    synonyms: ['shift', 'relocate', 'reposition'],
    antonyms: ['keep', 'fix', 'anchor'],
    examples: [
      'move the drums forward',
      'move it back two bars',
      'move the melody up',
      'move everything earlier',
    ],
    mappedOpcodes: [createOpcodeId('shift_time'), createOpcodeId('transpose')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['shift', 'slide', 'nudge'],
    register: 'informal',
  },

  {
    id: createLexemeId('verb', 'shift'),
    baseForm: 'shift',
    conjugations: {
      present: 'shift',
      presentParticiple: 'shifting',
      pastSimple: 'shifted',
      pastParticiple: 'shifted',
      thirdPerson: 'shifts',
      imperative: 'shift',
    },
    category: 'movement',
    subcategory: 'relocation',
    description: 'Move incrementally in time, pitch, or space',
    synonyms: ['move', 'nudge', 'slide'],
    antonyms: ['anchor', 'fix'],
    examples: [
      'shift the timing',
      'shift it up an octave',
      'shift forward a bit',
      'shift the groove',
    ],
    mappedOpcodes: [createOpcodeId('shift_time'), createOpcodeId('transpose'), createOpcodeId('shift_register')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['nudge', 'slide', 'bump'],
    register: 'informal',
  },

  {
    id: createLexemeId('verb', 'transpose'),
    baseForm: 'transpose',
    conjugations: {
      present: 'transpose',
      presentParticiple: 'transposing',
      pastSimple: 'transposed',
      pastParticiple: 'transposed',
      thirdPerson: 'transposes',
      imperative: 'transpose',
    },
    category: 'movement',
    subcategory: 'pitch_shift',
    description: 'Move pitch up or down by interval',
    synonyms: ['shift pitch', 'move pitch'],
    antonyms: [],
    examples: [
      'transpose up a fifth',
      'transpose to C major',
      'transpose down an octave',
      'transpose the melody',
    ],
    mappedOpcodes: [createOpcodeId('transpose')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['shift up', 'shift down', 'move up'],
    register: 'technical',
  },

  {
    id: createLexemeId('verb', 'slide'),
    baseForm: 'slide',
    conjugations: {
      present: 'slide',
      presentParticiple: 'sliding',
      pastSimple: 'slid',
      pastParticiple: 'slid',
      thirdPerson: 'slides',
      imperative: 'slide',
    },
    category: 'movement',
    subcategory: 'smooth_motion',
    description: 'Move smoothly and gradually',
    synonyms: ['glide', 'shift smoothly', 'move gradually'],
    antonyms: ['jump', 'snap'],
    examples: [
      'slide the timing',
      'slide into the next section',
      'slide the pitch up',
      'slide it forward gradually',
    ],
    mappedOpcodes: [createOpcodeId('smooth_shift'), createOpcodeId('glissando')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['glide', 'smooth over'],
    register: 'informal',
  },

  {
    id: createLexemeId('verb', 'push'),
    baseForm: 'push',
    conjugations: {
      present: 'push',
      presentParticiple: 'pushing',
      pastSimple: 'pushed',
      pastParticiple: 'pushed',
      thirdPerson: 'pushes',
      imperative: 'push',
    },
    category: 'movement',
    subcategory: 'directional',
    description: 'Move in a specific direction, often spatial or dynamic',
    synonyms: ['move forward', 'drive', 'press'],
    antonyms: ['pull', 'bring back'],
    examples: [
      'push it forward',
      'push the tempo',
      'push the energy',
      'push the vocals back',
    ],
    mappedOpcodes: [createOpcodeId('shift_time'), createOpcodeId('increase_tempo'), createOpcodeId('spatial_push')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['drive', 'press forward'],
    register: 'informal',
  },

  {
    id: createLexemeId('verb', 'pull'),
    baseForm: 'pull',
    conjugations: {
      present: 'pull',
      presentParticiple: 'pulling',
      pastSimple: 'pulled',
      pastParticiple: 'pulled',
      thirdPerson: 'pulls',
      imperative: 'pull',
    },
    category: 'movement',
    subcategory: 'directional',
    description: 'Move backward or bring closer',
    synonyms: ['bring back', 'draw', 'retreat'],
    antonyms: ['push', 'drive forward'],
    examples: [
      'pull it back',
      'pull the tempo',
      'pull the vocals forward',
      'pull everything earlier',
    ],
    mappedOpcodes: [createOpcodeId('shift_time'), createOpcodeId('decrease_tempo'), createOpcodeId('spatial_pull')],
    requiresObject: true,
    requiresScope: false,
    colloquialVariants: ['bring back', 'draw back'],
    register: 'informal',
  },
];

// =============================================================================
// All Verbs Registry
// =============================================================================

/**
 * All verbs in this batch.
 */
export const ALL_COMMAND_VERBS: readonly VerbLexeme[] = [
  ...IMPERATIVE_VERBS,
  ...CREATION_VERBS,
  ...DESTRUCTION_VERBS,
  ...MOVEMENT_VERBS,
];

/**
 * Statistics about this vocabulary batch.
 */
export const BATCH_STATS = {
  totalVerbs: ALL_COMMAND_VERBS.length,
  imperative: IMPERATIVE_VERBS.length,
  creation: CREATION_VERBS.length,
  destruction: DESTRUCTION_VERBS.length,
  movement: MOVEMENT_VERBS.length,
} as const;

// Export for use in main lexicon
export default ALL_COMMAND_VERBS;
