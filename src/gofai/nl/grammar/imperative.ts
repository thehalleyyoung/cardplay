/**
 * GOFAI NL Grammar — Imperative Grammar
 *
 * Implements grammar rules for imperative commands: "make", "add",
 * "remove", "keep", "switch", and their synonyms. Each verb has a
 * typed verb frame specifying required/optional arguments and
 * selectional restrictions.
 *
 * ## Verb Frame Model
 *
 * A verb frame describes the argument structure of a command verb:
 *
 * ```
 * VerbFrame {
 *   verb: "add"
 *   category: "creation"
 *   roles: [
 *     { role: "patient", required: true, types: ["card", "layer", "note"] },
 *     { role: "location", required: false, types: ["section", "range"] },
 *   ]
 *   examples: ["add reverb", "add drums to the chorus"]
 * }
 * ```
 *
 * ## Grammar Structure
 *
 * ```
 * Command     → VerbPhrase
 * Command     → Politeness VerbPhrase
 * VerbPhrase  → Verb Object
 * VerbPhrase  → Verb Object Adjunct
 * VerbPhrase  → Verb Object Adjunct Adjunct
 * VerbPhrase  → MakeVerb Object Complement
 * Object      → NounPhrase
 * Complement  → Adjective
 * Complement  → Adjective Degree
 * Adjunct     → PrepPhrase
 * ```
 *
 * ## Semantic Actions
 *
 * Each rule has a semantic action that builds a neo-Davidsonian event:
 * - An event variable (e)
 * - Thematic roles: agent (implicit user), patient, theme, goal, etc.
 * - The verb determines the event category: add→creation, remove→destruction, etc.
 *
 * @module gofai/nl/grammar/imperative
 * @see gofai_goalA.md Step 111
 */

import type { Span } from '../tokenizer/span-tokenizer';

// =============================================================================
// VERB FRAME — typed argument structures for command verbs
// =============================================================================

/**
 * A verb frame: the argument structure of a command verb.
 */
export interface VerbFrame {
  /** The canonical verb form (base form) */
  readonly verb: string;

  /** All recognized surface forms of this verb */
  readonly forms: readonly string[];

  /** The verb category (maps to event category) */
  readonly category: VerbFrameCategory;

  /** The semantic action this verb produces */
  readonly semanticAction: string;

  /** Required and optional thematic roles */
  readonly roles: readonly ThematicRole[];

  /** Whether this verb is typically used with "make X Y" pattern */
  readonly isMakePattern: boolean;

  /** Whether this verb is typically used with a direct object */
  readonly isTransitive: boolean;

  /** Example usages */
  readonly examples: readonly string[];

  /** Human-readable description */
  readonly description: string;

  /** Mapped opcode IDs (from domain-verbs.ts) */
  readonly mappedOpcodes: readonly string[];
}

/**
 * Verb frame categories — what kind of action the verb performs.
 */
export type VerbFrameCategory =
  | 'creation'        // add, create, insert, introduce
  | 'destruction'     // remove, delete, clear, strip
  | 'transformation'  // make, change, modify, adjust, set
  | 'movement'        // move, shift, swap, switch, rearrange
  | 'preservation'    // keep, maintain, preserve, retain
  | 'duplication'     // copy, duplicate, repeat, double
  | 'query'           // show, display, play, preview
  | 'reversal'        // undo, redo, revert, restore
  | 'combination'     // merge, blend, mix, combine
  | 'separation';     // split, separate, isolate, extract

/**
 * A thematic role in a verb frame.
 */
export interface ThematicRole {
  /** The role type */
  readonly role: ThematicRoleType;

  /** Whether this role is required */
  readonly required: boolean;

  /** Selectional restrictions: what entity types can fill this role */
  readonly entityTypes: readonly EntityRestriction[];

  /** Prepositions that can introduce this role (empty for direct objects) */
  readonly prepositions: readonly string[];

  /** Human-readable description */
  readonly description: string;
}

/**
 * Types of thematic roles in the neo-Davidsonian event model.
 */
export type ThematicRoleType =
  | 'agent'       // Who does it (always the user, implicit)
  | 'patient'     // What is affected/changed
  | 'theme'       // What is added/created/moved
  | 'goal'        // Where something moves to
  | 'source'      // Where something moves from
  | 'location'    // Where the action takes place (scope)
  | 'instrument'  // What tool/card is used
  | 'beneficiary' // Who benefits
  | 'result'      // What state results ("make it brighter" → brighter)
  | 'manner'      // How the action is done
  | 'degree'      // How much
  | 'time'        // When / duration
  | 'purpose';    // Why

/**
 * Selectional restrictions for thematic role fillers.
 */
export type EntityRestriction =
  | 'section'        // Song section (chorus, verse)
  | 'layer'          // Track/layer
  | 'card'           // DSP card
  | 'note'           // Note event
  | 'range'          // Bar range / time range
  | 'track'          // Track container
  | 'parameter'      // Card parameter
  | 'musical_object' // Abstract: motif, chord, phrase
  | 'effect'         // Audio effect
  | 'instrument'     // Musical instrument
  | 'axis'           // Perceptual axis (brightness, warmth)
  | 'adjective'      // Adjectival complement
  | 'any';           // No restriction

// =============================================================================
// VERB FRAME REGISTRY — all known imperative verb frames
// =============================================================================

/**
 * Helper: create a thematic role.
 */
function role(
  roleType: ThematicRoleType,
  required: boolean,
  entityTypes: readonly EntityRestriction[],
  prepositions: readonly string[],
  description: string,
): ThematicRole {
  return { role: roleType, required, entityTypes, prepositions, description };
}

/**
 * All imperative verb frames, organized by category.
 */
export const VERB_FRAMES: readonly VerbFrame[] = [
  // ---------------------------------------------------------------------------
  // CREATION verbs
  // ---------------------------------------------------------------------------
  {
    verb: 'add',
    forms: ['add', 'adds', 'adding', 'added'],
    category: 'creation',
    semanticAction: 'sem:create',
    roles: [
      role('theme', true, ['card', 'layer', 'effect', 'instrument', 'musical_object', 'note'], [], 'What to add'),
      role('location', false, ['section', 'range', 'track', 'layer'], ['to', 'in', 'at', 'into'], 'Where to add it'),
      role('time', false, ['range'], ['for', 'during', 'at'], 'When to add it'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['add reverb', 'add drums to the chorus', 'add a delay after the compressor'],
    description: 'Insert new musical material or effects',
    mappedOpcodes: ['op:insert', 'op:add-layer'],
  },
  {
    verb: 'create',
    forms: ['create', 'creates', 'creating', 'created'],
    category: 'creation',
    semanticAction: 'sem:create',
    roles: [
      role('theme', true, ['layer', 'section', 'musical_object'], [], 'What to create'),
      role('location', false, ['section', 'range'], ['in', 'at', 'for'], 'Where to create it'),
      role('manner', false, ['any'], ['with', 'using'], 'How to create it'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['create a new track', 'create a bass line in the verse'],
    description: 'Generate new musical material from scratch',
    mappedOpcodes: ['op:generate'],
  },
  {
    verb: 'insert',
    forms: ['insert', 'inserts', 'inserting', 'inserted'],
    category: 'creation',
    semanticAction: 'sem:create',
    roles: [
      role('theme', true, ['card', 'note', 'section', 'musical_object'], [], 'What to insert'),
      role('location', false, ['section', 'range', 'track'], ['into', 'in', 'at', 'before', 'after'], 'Where to insert it'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['insert a chorus before the bridge', 'insert reverb after the compressor'],
    description: 'Place new material at a specific position',
    mappedOpcodes: ['op:insert'],
  },
  {
    verb: 'put',
    forms: ['put', 'puts', 'putting'],
    category: 'creation',
    semanticAction: 'sem:create',
    roles: [
      role('theme', true, ['card', 'effect', 'musical_object', 'any'], [], 'What to put'),
      role('goal', true, ['section', 'range', 'track', 'layer'], ['in', 'on', 'at', 'into', 'before', 'after'], 'Where to put it'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['put a compressor on the vocals', 'put some reverb in the chorus'],
    description: 'Place material at a location',
    mappedOpcodes: ['op:insert'],
  },
  {
    verb: 'introduce',
    forms: ['introduce', 'introduces', 'introducing', 'introduced'],
    category: 'creation',
    semanticAction: 'sem:create',
    roles: [
      role('theme', true, ['musical_object', 'instrument', 'effect'], [], 'What to introduce'),
      role('location', false, ['section', 'range'], ['in', 'at', 'during'], 'Where to introduce it'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['introduce strings in the chorus', 'introduce a counter-melody'],
    description: 'Bring in new musical material',
    mappedOpcodes: ['op:insert', 'op:add-layer'],
  },

  // ---------------------------------------------------------------------------
  // DESTRUCTION verbs
  // ---------------------------------------------------------------------------
  {
    verb: 'remove',
    forms: ['remove', 'removes', 'removing', 'removed'],
    category: 'destruction',
    semanticAction: 'sem:destroy',
    roles: [
      role('patient', true, ['card', 'layer', 'effect', 'note', 'section', 'musical_object'], [], 'What to remove'),
      role('source', false, ['section', 'range', 'track', 'layer'], ['from', 'in', 'out of'], 'Where to remove from'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['remove the reverb', 'remove drums from the verse', 'remove the bridge'],
    description: 'Delete existing material or effects',
    mappedOpcodes: ['op:delete', 'op:remove-layer'],
  },
  {
    verb: 'delete',
    forms: ['delete', 'deletes', 'deleting', 'deleted'],
    category: 'destruction',
    semanticAction: 'sem:destroy',
    roles: [
      role('patient', true, ['card', 'layer', 'note', 'section', 'musical_object'], [], 'What to delete'),
      role('source', false, ['section', 'range'], ['from', 'in'], 'Where to delete from'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['delete the second verse', 'delete the EQ'],
    description: 'Permanently remove material',
    mappedOpcodes: ['op:delete'],
  },
  {
    verb: 'clear',
    forms: ['clear', 'clears', 'clearing', 'cleared'],
    category: 'destruction',
    semanticAction: 'sem:destroy',
    roles: [
      role('patient', true, ['layer', 'section', 'range', 'track', 'any'], [], 'What to clear'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['clear the drums track', 'clear the chorus'],
    description: 'Remove all content from a container',
    mappedOpcodes: ['op:clear'],
  },
  {
    verb: 'strip',
    forms: ['strip', 'strips', 'stripping', 'stripped'],
    category: 'destruction',
    semanticAction: 'sem:destroy',
    roles: [
      role('patient', true, ['effect', 'card', 'any'], [], 'What to strip away'),
      role('source', false, ['track', 'layer', 'section'], ['from', 'off', 'off of'], 'Where to strip from'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['strip the effects', 'strip reverb from the vocals'],
    description: 'Remove layers or effects',
    mappedOpcodes: ['op:delete'],
  },
  {
    verb: 'mute',
    forms: ['mute', 'mutes', 'muting', 'muted'],
    category: 'destruction',
    semanticAction: 'sem:suppress',
    roles: [
      role('patient', true, ['layer', 'track', 'card', 'instrument'], [], 'What to mute'),
      role('location', false, ['section', 'range'], ['in', 'during', 'for'], 'Where to mute'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['mute the drums', 'mute the bass in the verse'],
    description: 'Silence material without removing it',
    mappedOpcodes: ['op:mute'],
  },

  // ---------------------------------------------------------------------------
  // TRANSFORMATION verbs ("make X Y" pattern)
  // ---------------------------------------------------------------------------
  {
    verb: 'make',
    forms: ['make', 'makes', 'making', 'made'],
    category: 'transformation',
    semanticAction: 'sem:transform',
    roles: [
      role('patient', true, ['any'], [], 'What to transform'),
      role('result', true, ['adjective', 'axis'], [], 'Target quality'),
      role('degree', false, ['any'], [], 'How much'),
      role('location', false, ['section', 'range'], ['in', 'during', 'for'], 'Where'),
    ],
    isMakePattern: true,
    isTransitive: true,
    examples: ['make it brighter', 'make the chorus louder', 'make the bass warmer in the verse'],
    description: 'Change a quality of musical material',
    mappedOpcodes: ['op:set-param', 'op:adjust-axis'],
  },
  {
    verb: 'change',
    forms: ['change', 'changes', 'changing', 'changed'],
    category: 'transformation',
    semanticAction: 'sem:transform',
    roles: [
      role('patient', true, ['parameter', 'any'], [], 'What to change'),
      role('goal', false, ['any'], ['to', 'into'], 'Target value'),
      role('location', false, ['section', 'range'], ['in', 'for'], 'Where'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['change the tempo to 120', 'change the key in the bridge'],
    description: 'Modify a property',
    mappedOpcodes: ['op:set-param'],
  },
  {
    verb: 'set',
    forms: ['set', 'sets', 'setting'],
    category: 'transformation',
    semanticAction: 'sem:transform',
    roles: [
      role('patient', true, ['parameter', 'any'], [], 'What to set'),
      role('goal', true, ['any'], ['to', 'at'], 'Target value'),
      role('location', false, ['section', 'range'], ['in', 'for'], 'Where'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['set the volume to 80%', 'set reverb to 50%', 'set the tempo to 140 bpm'],
    description: 'Set a parameter to a specific value',
    mappedOpcodes: ['op:set-param'],
  },
  {
    verb: 'adjust',
    forms: ['adjust', 'adjusts', 'adjusting', 'adjusted'],
    category: 'transformation',
    semanticAction: 'sem:transform',
    roles: [
      role('patient', true, ['parameter', 'axis', 'any'], [], 'What to adjust'),
      role('degree', false, ['any'], ['by'], 'How much'),
      role('location', false, ['section', 'range'], ['in', 'for'], 'Where'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['adjust the brightness', 'adjust the EQ by 3dB'],
    description: 'Fine-tune a parameter',
    mappedOpcodes: ['op:adjust-param'],
  },
  {
    verb: 'turn',
    forms: ['turn', 'turns', 'turning', 'turned'],
    category: 'transformation',
    semanticAction: 'sem:transform',
    roles: [
      role('patient', true, ['parameter', 'axis', 'any'], [], 'What to turn'),
      role('result', true, ['any'], [], 'Direction: up or down'),
      role('degree', false, ['any'], ['by'], 'How much'),
      role('location', false, ['section', 'range'], ['in', 'for'], 'Where'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['turn up the bass', 'turn down the reverb', 'turn the volume up by 3dB'],
    description: 'Increase or decrease a parameter',
    mappedOpcodes: ['op:adjust-param'],
  },
  {
    verb: 'boost',
    forms: ['boost', 'boosts', 'boosting', 'boosted'],
    category: 'transformation',
    semanticAction: 'sem:increase',
    roles: [
      role('patient', true, ['parameter', 'axis', 'any'], [], 'What to boost'),
      role('degree', false, ['any'], ['by'], 'How much'),
      role('location', false, ['section', 'range'], ['in', 'at', 'for'], 'Where'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['boost the highs', 'boost the bass by 6dB'],
    description: 'Increase a parameter',
    mappedOpcodes: ['op:adjust-param'],
  },
  {
    verb: 'reduce',
    forms: ['reduce', 'reduces', 'reducing', 'reduced'],
    category: 'transformation',
    semanticAction: 'sem:decrease',
    roles: [
      role('patient', true, ['parameter', 'axis', 'any'], [], 'What to reduce'),
      role('degree', false, ['any'], ['by', 'to'], 'How much'),
      role('location', false, ['section', 'range'], ['in', 'for'], 'Where'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['reduce the reverb', 'reduce the bass by 3dB'],
    description: 'Decrease a parameter',
    mappedOpcodes: ['op:adjust-param'],
  },
  {
    verb: 'cut',
    forms: ['cut', 'cuts', 'cutting'],
    category: 'transformation',
    semanticAction: 'sem:decrease',
    roles: [
      role('patient', true, ['parameter', 'axis', 'any'], [], 'What to cut'),
      role('degree', false, ['any'], ['by', 'at'], 'How much'),
      role('location', false, ['section', 'range'], ['in', 'for'], 'Where'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['cut the lows', 'cut 3dB at 200Hz'],
    description: 'Reduce or attenuate (EQ / mixing term)',
    mappedOpcodes: ['op:adjust-param', 'op:eq-cut'],
  },

  // ---------------------------------------------------------------------------
  // MOVEMENT verbs
  // ---------------------------------------------------------------------------
  {
    verb: 'move',
    forms: ['move', 'moves', 'moving', 'moved'],
    category: 'movement',
    semanticAction: 'sem:relocate',
    roles: [
      role('patient', true, ['card', 'note', 'section', 'layer', 'musical_object'], [], 'What to move'),
      role('goal', false, ['section', 'range', 'track'], ['to', 'into', 'before', 'after'], 'Where to move to'),
      role('source', false, ['section', 'range', 'track'], ['from', 'out of'], 'Where to move from'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['move the chorus after the bridge', 'move the reverb before the delay'],
    description: 'Relocate material to a new position',
    mappedOpcodes: ['op:move'],
  },
  {
    verb: 'swap',
    forms: ['swap', 'swaps', 'swapping', 'swapped'],
    category: 'movement',
    semanticAction: 'sem:exchange',
    roles: [
      role('patient', true, ['any'], [], 'First item to swap'),
      role('goal', true, ['any'], ['with', 'and', 'for'], 'Second item to swap with'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['swap the verse and chorus', 'swap the reverb with a delay'],
    description: 'Exchange two items',
    mappedOpcodes: ['op:swap'],
  },
  {
    verb: 'switch',
    forms: ['switch', 'switches', 'switching', 'switched'],
    category: 'movement',
    semanticAction: 'sem:exchange',
    roles: [
      role('patient', true, ['any'], [], 'What to switch'),
      role('goal', false, ['any'], ['to', 'with', 'for'], 'What to switch to'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['switch to a different reverb', 'switch the bass and guitar'],
    description: 'Replace or exchange',
    mappedOpcodes: ['op:swap', 'op:replace'],
  },
  {
    verb: 'rearrange',
    forms: ['rearrange', 'rearranges', 'rearranging', 'rearranged'],
    category: 'movement',
    semanticAction: 'sem:reorder',
    roles: [
      role('patient', true, ['section', 'card', 'any'], [], 'What to rearrange'),
      role('manner', false, ['any'], [], 'How to rearrange'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['rearrange the sections', 'rearrange the effects chain'],
    description: 'Change the order of elements',
    mappedOpcodes: ['op:reorder'],
  },

  // ---------------------------------------------------------------------------
  // PRESERVATION verbs
  // ---------------------------------------------------------------------------
  {
    verb: 'keep',
    forms: ['keep', 'keeps', 'keeping', 'kept'],
    category: 'preservation',
    semanticAction: 'sem:preserve',
    roles: [
      role('patient', true, ['any'], [], 'What to keep'),
      role('result', false, ['adjective', 'any'], [], 'In what state'),
      role('location', false, ['section', 'range'], ['in', 'for', 'during'], 'Where'),
    ],
    isMakePattern: true,
    isTransitive: true,
    examples: ['keep the drums', 'keep it warm', 'keep the bass as is'],
    description: 'Preserve material or state (constraint)',
    mappedOpcodes: ['op:constrain-preserve'],
  },
  {
    verb: 'maintain',
    forms: ['maintain', 'maintains', 'maintaining', 'maintained'],
    category: 'preservation',
    semanticAction: 'sem:preserve',
    roles: [
      role('patient', true, ['any'], [], 'What to maintain'),
      role('location', false, ['section', 'range'], ['in', 'for', 'throughout'], 'Where'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['maintain the energy', 'maintain the rhythm throughout'],
    description: 'Keep something consistent',
    mappedOpcodes: ['op:constrain-preserve'],
  },
  {
    verb: 'preserve',
    forms: ['preserve', 'preserves', 'preserving', 'preserved'],
    category: 'preservation',
    semanticAction: 'sem:preserve',
    roles: [
      role('patient', true, ['any'], [], 'What to preserve'),
      role('location', false, ['section', 'range'], ['in', 'for', 'during'], 'Where'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['preserve the melody', 'preserve the dynamics in the verse'],
    description: 'Protect from changes',
    mappedOpcodes: ['op:constrain-preserve'],
  },
  {
    verb: 'retain',
    forms: ['retain', 'retains', 'retaining', 'retained'],
    category: 'preservation',
    semanticAction: 'sem:preserve',
    roles: [
      role('patient', true, ['any'], [], 'What to retain'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['retain the reverb tail', 'retain the original feel'],
    description: 'Keep something that might be lost',
    mappedOpcodes: ['op:constrain-preserve'],
  },
  {
    verb: 'leave',
    forms: ['leave', 'leaves', 'leaving', 'left'],
    category: 'preservation',
    semanticAction: 'sem:preserve',
    roles: [
      role('patient', true, ['any'], [], 'What to leave'),
      role('result', false, ['adjective', 'any'], [], 'In what state'),
    ],
    isMakePattern: true,
    isTransitive: true,
    examples: ['leave the bass alone', 'leave it as is', 'leave the reverb'],
    description: 'Don\'t change something',
    mappedOpcodes: ['op:constrain-preserve'],
  },

  // ---------------------------------------------------------------------------
  // DUPLICATION verbs
  // ---------------------------------------------------------------------------
  {
    verb: 'copy',
    forms: ['copy', 'copies', 'copying', 'copied'],
    category: 'duplication',
    semanticAction: 'sem:duplicate',
    roles: [
      role('theme', true, ['section', 'layer', 'note', 'musical_object', 'any'], [], 'What to copy'),
      role('goal', false, ['section', 'range', 'track'], ['to', 'into'], 'Where to copy to'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['copy the chorus', 'copy the drums to the outro'],
    description: 'Duplicate material',
    mappedOpcodes: ['op:copy'],
  },
  {
    verb: 'duplicate',
    forms: ['duplicate', 'duplicates', 'duplicating', 'duplicated'],
    category: 'duplication',
    semanticAction: 'sem:duplicate',
    roles: [
      role('theme', true, ['section', 'layer', 'card', 'any'], [], 'What to duplicate'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['duplicate the verse', 'duplicate the reverb chain'],
    description: 'Create an exact copy',
    mappedOpcodes: ['op:copy'],
  },
  {
    verb: 'repeat',
    forms: ['repeat', 'repeats', 'repeating', 'repeated'],
    category: 'duplication',
    semanticAction: 'sem:duplicate',
    roles: [
      role('theme', true, ['section', 'musical_object', 'any'], [], 'What to repeat'),
      role('degree', false, ['any'], [], 'How many times'),
      role('location', false, ['section', 'range'], ['in', 'at'], 'Where'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['repeat the chorus', 'repeat the riff twice'],
    description: 'Play again / duplicate sequentially',
    mappedOpcodes: ['op:repeat'],
  },
  {
    verb: 'double',
    forms: ['double', 'doubles', 'doubling', 'doubled'],
    category: 'duplication',
    semanticAction: 'sem:duplicate',
    roles: [
      role('theme', true, ['layer', 'note', 'musical_object', 'any'], [], 'What to double'),
      role('location', false, ['section', 'range'], ['in'], 'Where'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['double the vocals', 'double the guitar part'],
    description: 'Create a parallel copy (musical doubling)',
    mappedOpcodes: ['op:double', 'op:copy'],
  },

  // ---------------------------------------------------------------------------
  // QUERY verbs
  // ---------------------------------------------------------------------------
  {
    verb: 'show',
    forms: ['show', 'shows', 'showing', 'showed', 'shown'],
    category: 'query',
    semanticAction: 'sem:inspect',
    roles: [
      role('patient', true, ['any'], [], 'What to show'),
      role('beneficiary', false, ['any'], ['to'], 'Who to show it to'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['show the settings', 'show me the EQ', 'show the spectrum'],
    description: 'Display information',
    mappedOpcodes: ['op:inspect'],
  },
  {
    verb: 'play',
    forms: ['play', 'plays', 'playing', 'played'],
    category: 'query',
    semanticAction: 'sem:preview',
    roles: [
      role('patient', false, ['section', 'range', 'any'], [], 'What to play'),
      role('source', false, ['section', 'range'], ['from', 'at', 'starting at'], 'Where to start'),
    ],
    isMakePattern: false,
    isTransitive: false,
    examples: ['play the chorus', 'play from bar 16', 'play it back'],
    description: 'Audition / preview material',
    mappedOpcodes: ['op:preview'],
  },
  {
    verb: 'preview',
    forms: ['preview', 'previews', 'previewing', 'previewed'],
    category: 'query',
    semanticAction: 'sem:preview',
    roles: [
      role('patient', true, ['any'], [], 'What to preview'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['preview the change', 'preview the reverb'],
    description: 'Listen before committing',
    mappedOpcodes: ['op:preview'],
  },

  // ---------------------------------------------------------------------------
  // REVERSAL verbs
  // ---------------------------------------------------------------------------
  {
    verb: 'undo',
    forms: ['undo', 'undoes', 'undoing', 'undone', 'undid'],
    category: 'reversal',
    semanticAction: 'sem:undo',
    roles: [
      role('patient', false, ['any'], [], 'What to undo (defaults to last action)'),
    ],
    isMakePattern: false,
    isTransitive: false,
    examples: ['undo', 'undo the last change', 'undo that'],
    description: 'Reverse the last action',
    mappedOpcodes: ['op:undo'],
  },
  {
    verb: 'redo',
    forms: ['redo', 'redoes', 'redoing', 'redone', 'redid'],
    category: 'reversal',
    semanticAction: 'sem:redo',
    roles: [
      role('patient', false, ['any'], [], 'What to redo'),
    ],
    isMakePattern: false,
    isTransitive: false,
    examples: ['redo', 'redo that'],
    description: 'Re-apply the last undone action',
    mappedOpcodes: ['op:redo'],
  },
  {
    verb: 'revert',
    forms: ['revert', 'reverts', 'reverting', 'reverted'],
    category: 'reversal',
    semanticAction: 'sem:undo',
    roles: [
      role('patient', false, ['any'], [], 'What to revert'),
      role('goal', false, ['any'], ['to'], 'What state to revert to'),
    ],
    isMakePattern: false,
    isTransitive: false,
    examples: ['revert the EQ', 'revert to the last version'],
    description: 'Go back to a previous state',
    mappedOpcodes: ['op:undo', 'op:revert'],
  },
  {
    verb: 'restore',
    forms: ['restore', 'restores', 'restoring', 'restored'],
    category: 'reversal',
    semanticAction: 'sem:undo',
    roles: [
      role('patient', true, ['any'], [], 'What to restore'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['restore the original', 'restore the deleted track'],
    description: 'Bring back something removed',
    mappedOpcodes: ['op:undo', 'op:restore'],
  },

  // ---------------------------------------------------------------------------
  // COMBINATION verbs
  // ---------------------------------------------------------------------------
  {
    verb: 'merge',
    forms: ['merge', 'merges', 'merging', 'merged'],
    category: 'combination',
    semanticAction: 'sem:combine',
    roles: [
      role('patient', true, ['layer', 'track', 'section', 'any'], [], 'What to merge'),
      role('goal', false, ['any'], ['with', 'into'], 'What to merge with'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['merge the tracks', 'merge the two verses into one'],
    description: 'Combine multiple items into one',
    mappedOpcodes: ['op:merge'],
  },
  {
    verb: 'blend',
    forms: ['blend', 'blends', 'blending', 'blended'],
    category: 'combination',
    semanticAction: 'sem:combine',
    roles: [
      role('patient', true, ['any'], [], 'What to blend'),
      role('goal', false, ['any'], ['with', 'into'], 'What to blend with'),
      role('degree', false, ['any'], ['by'], 'How much blending'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['blend the reverb with the delay', 'blend the layers'],
    description: 'Smoothly combine multiple sources',
    mappedOpcodes: ['op:blend', 'op:mix'],
  },
  {
    verb: 'mix',
    forms: ['mix', 'mixes', 'mixing', 'mixed'],
    category: 'combination',
    semanticAction: 'sem:combine',
    roles: [
      role('patient', true, ['any'], [], 'What to mix'),
      role('goal', false, ['any'], ['with'], 'What to mix with'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['mix the tracks', 'mix the dry and wet signals'],
    description: 'Combine audio signals',
    mappedOpcodes: ['op:mix'],
  },
  {
    verb: 'combine',
    forms: ['combine', 'combines', 'combining', 'combined'],
    category: 'combination',
    semanticAction: 'sem:combine',
    roles: [
      role('patient', true, ['any'], [], 'What to combine'),
      role('goal', false, ['any'], ['with', 'and'], 'What to combine with'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['combine the two sections', 'combine drums and bass'],
    description: 'Join multiple elements',
    mappedOpcodes: ['op:merge', 'op:combine'],
  },

  // ---------------------------------------------------------------------------
  // SEPARATION verbs
  // ---------------------------------------------------------------------------
  {
    verb: 'split',
    forms: ['split', 'splits', 'splitting'],
    category: 'separation',
    semanticAction: 'sem:separate',
    roles: [
      role('patient', true, ['section', 'layer', 'range', 'any'], [], 'What to split'),
      role('location', false, ['range'], ['at', 'into'], 'Where to split'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['split the verse at bar 8', 'split into two sections'],
    description: 'Divide into parts',
    mappedOpcodes: ['op:split'],
  },
  {
    verb: 'separate',
    forms: ['separate', 'separates', 'separating', 'separated'],
    category: 'separation',
    semanticAction: 'sem:separate',
    roles: [
      role('patient', true, ['any'], [], 'What to separate'),
      role('source', false, ['any'], ['from'], 'What to separate from'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['separate the drums from the mix', 'separate the wet and dry'],
    description: 'Pull apart combined elements',
    mappedOpcodes: ['op:separate'],
  },
  {
    verb: 'isolate',
    forms: ['isolate', 'isolates', 'isolating', 'isolated'],
    category: 'separation',
    semanticAction: 'sem:separate',
    roles: [
      role('patient', true, ['layer', 'instrument', 'any'], [], 'What to isolate'),
      role('source', false, ['any'], ['from'], 'What to isolate from'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['isolate the vocals', 'isolate the bass drum'],
    description: 'Extract a single element',
    mappedOpcodes: ['op:solo', 'op:isolate'],
  },
  {
    verb: 'solo',
    forms: ['solo', 'solos', 'soloing', 'soloed'],
    category: 'separation',
    semanticAction: 'sem:separate',
    roles: [
      role('patient', true, ['layer', 'track', 'instrument', 'any'], [], 'What to solo'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['solo the vocals', 'solo the kick drum'],
    description: 'Listen to one element alone',
    mappedOpcodes: ['op:solo'],
  },
  {
    verb: 'extract',
    forms: ['extract', 'extracts', 'extracting', 'extracted'],
    category: 'separation',
    semanticAction: 'sem:separate',
    roles: [
      role('theme', true, ['musical_object', 'any'], [], 'What to extract'),
      role('source', false, ['section', 'layer', 'track'], ['from', 'out of'], 'Where to extract from'),
    ],
    isMakePattern: false,
    isTransitive: true,
    examples: ['extract the melody', 'extract the bass line from the mix'],
    description: 'Pull out specific musical content',
    mappedOpcodes: ['op:extract'],
  },
];

// =============================================================================
// VERB LOOKUP — efficient verb form → frame mapping
// =============================================================================

/**
 * Index of all verb forms to their frames, for O(1) lookup.
 */
const verbFormIndex: ReadonlyMap<string, VerbFrame> = (() => {
  const index = new Map<string, VerbFrame>();
  for (const frame of VERB_FRAMES) {
    for (const form of frame.forms) {
      index.set(form.toLowerCase(), frame);
    }
  }
  return index;
})();

/**
 * Look up a verb frame by any surface form.
 */
export function lookupVerbFrame(form: string): VerbFrame | undefined {
  return verbFormIndex.get(form.toLowerCase());
}

/**
 * Check if a word is a known imperative verb form.
 */
export function isImperativeVerb(word: string): boolean {
  return verbFormIndex.has(word.toLowerCase());
}

/**
 * Get all known verb forms (for tokenizer integration).
 */
export function getAllVerbForms(): readonly string[] {
  return Array.from(verbFormIndex.keys());
}

/**
 * Get all canonical verb base forms.
 */
export function getCanonicalVerbs(): readonly string[] {
  return VERB_FRAMES.map(f => f.verb);
}

/**
 * Get verb frames by category.
 */
export function getVerbFramesByCategory(category: VerbFrameCategory): readonly VerbFrame[] {
  return VERB_FRAMES.filter(f => f.category === category);
}

/**
 * Get all "make X Y" pattern verbs.
 */
export function getMakePatternVerbs(): readonly VerbFrame[] {
  return VERB_FRAMES.filter(f => f.isMakePattern);
}

// =============================================================================
// IMPERATIVE PARSE RESULT — typed result of parsing an imperative command
// =============================================================================

/**
 * A parsed imperative command.
 */
export interface ParsedImperative {
  /** The verb frame that was matched */
  readonly frame: VerbFrame;

  /** The verb form as it appeared in the input */
  readonly verbSurface: string;

  /** Span of the verb in the input */
  readonly verbSpan: Span;

  /** Filled thematic roles */
  readonly filledRoles: readonly FilledRole[];

  /** Politeness markers found (e.g., "please", "could you") */
  readonly politeness: readonly PolitenessMarker[];

  /** The full span of the command */
  readonly commandSpan: Span;

  /** Confidence in the parse (0-1) */
  readonly confidence: number;

  /** Any validation warnings */
  readonly warnings: readonly ImperativeWarning[];
}

/**
 * A thematic role that has been filled with content from the input.
 */
export interface FilledRole {
  /** The role type */
  readonly role: ThematicRoleType;

  /** The surface text that fills this role */
  readonly surface: string;

  /** Span in the input */
  readonly span: Span;

  /** The preposition that introduced this role (if any) */
  readonly preposition: string | undefined;

  /** Whether this role was required by the frame */
  readonly required: boolean;
}

/**
 * A politeness marker in the input.
 */
export interface PolitenessMarker {
  /** The type of politeness */
  readonly type: PolitenessType;

  /** The surface text */
  readonly surface: string;

  /** Span in the input */
  readonly span: Span;
}

/**
 * Types of politeness markers.
 */
export type PolitenessType =
  | 'please'        // "please"
  | 'just'          // "just" (hedging)
  | 'can_you'       // "can you", "could you"
  | 'would_you'     // "would you"
  | 'lets'          // "let's"
  | 'try'           // "try to", "try and"
  | 'go_ahead'      // "go ahead and"
  | 'i_want';       // "I want you to", "I'd like"

/**
 * Warning about an imperative parse.
 */
export interface ImperativeWarning {
  /** Warning code */
  readonly code: ImperativeWarningCode;

  /** Human-readable message */
  readonly message: string;

  /** The span that triggered the warning */
  readonly span: Span;
}

/**
 * Warning codes for imperative parsing.
 */
export type ImperativeWarningCode =
  | 'missing_required_role'   // A required role was not filled
  | 'ambiguous_object'        // Object could refer to multiple things
  | 'selectional_mismatch'    // Object type doesn't match role restrictions
  | 'unusual_word_order'      // Non-standard word order
  | 'possible_typo'           // Verb might be misspelled
  | 'intransitive_with_object'; // Intransitive verb used with object

// =============================================================================
// POLITENESS PATTERNS — recognizing politeness markers
// =============================================================================

/**
 * Patterns for detecting politeness markers.
 * These are processed before verb lookup to strip prefix/suffix politeness.
 */
export const POLITENESS_PATTERNS: readonly PolitenessPattern[] = [
  { type: 'please', forms: ['please'], position: 'prefix_or_suffix' },
  { type: 'just', forms: ['just'], position: 'prefix' },
  { type: 'can_you', forms: ['can you', 'could you'], position: 'prefix' },
  { type: 'would_you', forms: ['would you', 'would you please'], position: 'prefix' },
  { type: 'lets', forms: ["let's", 'lets', 'let us'], position: 'prefix' },
  { type: 'try', forms: ['try to', 'try and', 'try'], position: 'prefix' },
  { type: 'go_ahead', forms: ['go ahead and', 'go ahead'], position: 'prefix' },
  { type: 'i_want', forms: [
    'i want to', 'i want you to', "i'd like to", 'i would like to',
    'i need to', 'i need you to',
  ], position: 'prefix' },
];

/**
 * A politeness pattern definition.
 */
export interface PolitenessPattern {
  readonly type: PolitenessType;
  readonly forms: readonly string[];
  readonly position: 'prefix' | 'suffix' | 'prefix_or_suffix';
}

/**
 * Detect politeness markers in a lowercased token sequence.
 */
export function detectPoliteness(tokens: readonly string[]): DetectedPoliteness {
  const markers: PolitenessMarker[] = [];
  let startIndex = 0;
  let endIndex = tokens.length;

  // Check prefixes (longer patterns first)
  const sortedPrefixPatterns = POLITENESS_PATTERNS
    .filter(p => p.position === 'prefix' || p.position === 'prefix_or_suffix')
    .flatMap(p => p.forms.map(f => ({ type: p.type, form: f, words: f.split(' ') })))
    .sort((a, b) => b.words.length - a.words.length);

  for (const pattern of sortedPrefixPatterns) {
    if (startIndex + pattern.words.length > tokens.length) continue;

    let matches = true;
    for (let i = 0; i < pattern.words.length; i++) {
      if (tokens[startIndex + i] !== pattern.words[i]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      markers.push({
        type: pattern.type,
        surface: pattern.form,
        span: { start: 0, end: 0 }, // Will be filled with real spans later
      });
      startIndex += pattern.words.length;
    }
  }

  // Check suffixes
  const suffixPatterns = POLITENESS_PATTERNS
    .filter(p => p.position === 'suffix' || p.position === 'prefix_or_suffix')
    .flatMap(p => p.forms.map(f => ({ type: p.type, form: f, words: f.split(' ') })))
    .sort((a, b) => b.words.length - a.words.length);

  for (const pattern of suffixPatterns) {
    if (endIndex - pattern.words.length < startIndex) continue;

    let matches = true;
    const checkStart = endIndex - pattern.words.length;
    for (let i = 0; i < pattern.words.length; i++) {
      if (tokens[checkStart + i] !== pattern.words[i]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      markers.push({
        type: pattern.type,
        surface: pattern.form,
        span: { start: 0, end: 0 },
      });
      endIndex -= pattern.words.length;
    }
  }

  return {
    markers,
    coreStartIndex: startIndex,
    coreEndIndex: endIndex,
  };
}

/**
 * Result of politeness detection.
 */
export interface DetectedPoliteness {
  readonly markers: readonly PolitenessMarker[];
  /** Index of first non-politeness token */
  readonly coreStartIndex: number;
  /** Index past last non-politeness token */
  readonly coreEndIndex: number;
}

// =============================================================================
// VALIDATION — checking frame constraints after parsing
// =============================================================================

/**
 * Validate a parsed imperative against its verb frame constraints.
 */
export function validateImperative(parsed: ParsedImperative): readonly ImperativeWarning[] {
  const warnings: ImperativeWarning[] = [];

  // Check for missing required roles
  for (const roleSpec of parsed.frame.roles) {
    if (roleSpec.required) {
      const filled = parsed.filledRoles.find(f => f.role === roleSpec.role);
      if (!filled) {
        warnings.push({
          code: 'missing_required_role',
          message: `Missing required ${roleSpec.role}: ${roleSpec.description}`,
          span: parsed.verbSpan,
        });
      }
    }
  }

  // Check for intransitive verb with object
  if (!parsed.frame.isTransitive && parsed.filledRoles.some(f => f.role === 'patient' || f.role === 'theme')) {
    warnings.push({
      code: 'intransitive_with_object',
      message: `"${parsed.frame.verb}" is typically used without a direct object`,
      span: parsed.commandSpan,
    });
  }

  return warnings;
}

// =============================================================================
// GRAMMAR RULE GENERATION — generating Earley grammar rules from verb frames
// =============================================================================

/**
 * A grammar rule template for imperative commands.
 */
export interface ImperativeGrammarRule {
  /** Rule ID */
  readonly id: string;

  /** LHS non-terminal */
  readonly lhs: string;

  /** RHS description (for documentation) */
  readonly rhsDescription: string;

  /** The verb frame this rule supports */
  readonly frame: VerbFrame;

  /** Pattern type */
  readonly pattern: ImperativePattern;

  /** Priority (higher = preferred) */
  readonly priority: number;

  /** Semantic action name */
  readonly semanticAction: string;
}

/**
 * Imperative command patterns.
 */
export type ImperativePattern =
  | 'verb_object'                // "add reverb"
  | 'verb_object_adjunct'        // "add reverb to the chorus"
  | 'make_object_complement'     // "make it brighter"
  | 'verb_complement'            // "keep it warm"
  | 'verb_alone'                 // "undo", "play"
  | 'verb_object_goal'           // "move X to Y"
  | 'verb_object_with_object'    // "swap X with Y"
  | 'polite_verb_object'         // "please add reverb"
  | 'turn_object_direction'      // "turn up the bass"
  | 'set_object_to_value';       // "set volume to 80%"

/**
 * Generate grammar rules for all verb frames.
 *
 * Returns a collection of rule templates that can be used to build
 * an Earley grammar via GrammarBuilder.
 */
export function generateImperativeGrammarRules(): readonly ImperativeGrammarRule[] {
  const rules: ImperativeGrammarRule[] = [];
  let ruleCounter = 0;

  for (const frame of VERB_FRAMES) {
    const prefix = `imp-${frame.verb}`;

    // Pattern 1: verb + object (for transitive verbs)
    if (frame.isTransitive) {
      rules.push({
        id: `${prefix}-${++ruleCounter}`,
        lhs: 'Command',
        rhsDescription: `${frame.verb} NounPhrase`,
        frame,
        pattern: 'verb_object',
        priority: 10,
        semanticAction: `${frame.semanticAction}:verb_object`,
      });

      // Pattern 2: verb + object + adjunct (with preposition)
      const prepRoles = frame.roles.filter(r => r.prepositions.length > 0);
      if (prepRoles.length > 0) {
        rules.push({
          id: `${prefix}-${++ruleCounter}`,
          lhs: 'Command',
          rhsDescription: `${frame.verb} NounPhrase PrepPhrase`,
          frame,
          pattern: 'verb_object_adjunct',
          priority: 15,
          semanticAction: `${frame.semanticAction}:verb_object_adjunct`,
        });
      }
    }

    // Pattern 3: "make X Y" pattern (transformation/preservation with result role)
    if (frame.isMakePattern) {
      rules.push({
        id: `${prefix}-${++ruleCounter}`,
        lhs: 'Command',
        rhsDescription: `${frame.verb} NounPhrase Adjective`,
        frame,
        pattern: 'make_object_complement',
        priority: 20,
        semanticAction: `${frame.semanticAction}:make_pattern`,
      });
    }

    // Pattern 4: verb alone (for intransitive verbs like undo, play)
    if (!frame.isTransitive || frame.roles.every(r => !r.required)) {
      rules.push({
        id: `${prefix}-${++ruleCounter}`,
        lhs: 'Command',
        rhsDescription: `${frame.verb}`,
        frame,
        pattern: 'verb_alone',
        priority: 5,
        semanticAction: `${frame.semanticAction}:verb_alone`,
      });
    }

    // Pattern 5: verb + object + goal (for movement verbs)
    if (frame.category === 'movement') {
      rules.push({
        id: `${prefix}-${++ruleCounter}`,
        lhs: 'Command',
        rhsDescription: `${frame.verb} NounPhrase "to"/"with" NounPhrase`,
        frame,
        pattern: 'verb_object_goal',
        priority: 20,
        semanticAction: `${frame.semanticAction}:verb_object_goal`,
      });
    }

    // Pattern 6: "turn up/down X" pattern
    if (frame.verb === 'turn') {
      rules.push({
        id: `${prefix}-${++ruleCounter}`,
        lhs: 'Command',
        rhsDescription: 'turn "up"/"down" NounPhrase',
        frame,
        pattern: 'turn_object_direction',
        priority: 20,
        semanticAction: 'sem:transform:turn_direction',
      });
    }

    // Pattern 7: "set X to Y" pattern
    if (frame.verb === 'set' || frame.verb === 'change') {
      rules.push({
        id: `${prefix}-${++ruleCounter}`,
        lhs: 'Command',
        rhsDescription: `${frame.verb} NounPhrase "to" Value`,
        frame,
        pattern: 'set_object_to_value',
        priority: 20,
        semanticAction: `${frame.semanticAction}:set_to_value`,
      });
    }
  }

  return rules;
}

// =============================================================================
// FRAME MATCHING — matching parsed tokens against verb frames
// =============================================================================

/**
 * Result of matching a token sequence against verb frames.
 */
export interface FrameMatch {
  /** The matched verb frame */
  readonly frame: VerbFrame;

  /** Match confidence (0-1) */
  readonly confidence: number;

  /** Which pattern was matched */
  readonly pattern: ImperativePattern;

  /** Which roles were filled */
  readonly filledRoles: readonly FilledRole[];

  /** Unfilled required roles */
  readonly missingRoles: readonly ThematicRoleType[];
}

/**
 * Attempt to match a word sequence against known verb frames.
 * Returns all possible matches ranked by confidence.
 */
export function matchVerbFrames(words: readonly string[]): readonly FrameMatch[] {
  if (words.length === 0) return [];

  const matches: FrameMatch[] = [];
  const firstWord = words[0]!.toLowerCase();

  const frame = lookupVerbFrame(firstWord);
  if (!frame) return [];

  // Try different patterns
  const remainingWords = words.slice(1);

  // Pattern: verb alone
  if (remainingWords.length === 0) {
    matches.push({
      frame,
      confidence: frame.isTransitive ? 0.3 : 0.8,
      pattern: 'verb_alone',
      filledRoles: [],
      missingRoles: frame.roles.filter(r => r.required).map(r => r.role),
    });
  }

  // Pattern: verb + object
  if (remainingWords.length > 0) {
    // Find where prepositional phrases start
    const prepIndex = findPrepositionIndex(remainingWords, frame);

    if (prepIndex === -1) {
      // No preposition found: everything is the object
      const objectWords = remainingWords;
      const objectText = objectWords.join(' ');

      // Check if this is a "make X Y" pattern
      if (frame.isMakePattern && objectWords.length >= 2) {
        // Last word(s) might be the complement
        const complementWord = objectWords[objectWords.length - 1]!;
        const patientWords = objectWords.slice(0, -1);

        matches.push({
          frame,
          confidence: 0.7,
          pattern: 'make_object_complement',
          filledRoles: [
            {
              role: 'patient',
              surface: patientWords.join(' '),
              span: { start: 0, end: 0 },
              preposition: undefined,
              required: true,
            },
            {
              role: 'result',
              surface: complementWord,
              span: { start: 0, end: 0 },
              preposition: undefined,
              required: true,
            },
          ],
          missingRoles: [],
        });
      }

      // Also try as plain verb + object
      const primaryRole = frame.roles.find(r => r.required && r.prepositions.length === 0);
      if (primaryRole) {
        matches.push({
          frame,
          confidence: 0.6,
          pattern: 'verb_object',
          filledRoles: [{
            role: primaryRole.role,
            surface: objectText,
            span: { start: 0, end: 0 },
            preposition: undefined,
            required: true,
          }],
          missingRoles: frame.roles
            .filter(r => r.required && r.role !== primaryRole.role)
            .map(r => r.role),
        });
      }
    } else {
      // Preposition found: split into object + prepositional phrase
      const objectWords = remainingWords.slice(0, prepIndex);
      const prep = remainingWords[prepIndex]!;
      const ppWords = remainingWords.slice(prepIndex + 1);

      const primaryRole = frame.roles.find(r => r.required && r.prepositions.length === 0);
      const prepRole = frame.roles.find(r => r.prepositions.includes(prep.toLowerCase()));

      const filled: FilledRole[] = [];

      if (primaryRole && objectWords.length > 0) {
        filled.push({
          role: primaryRole.role,
          surface: objectWords.join(' '),
          span: { start: 0, end: 0 },
          preposition: undefined,
          required: primaryRole.required,
        });
      }

      if (prepRole && ppWords.length > 0) {
        filled.push({
          role: prepRole.role,
          surface: ppWords.join(' '),
          span: { start: 0, end: 0 },
          preposition: prep,
          required: prepRole.required,
        });
      }

      matches.push({
        frame,
        confidence: 0.8,
        pattern: 'verb_object_adjunct',
        filledRoles: filled,
        missingRoles: frame.roles
          .filter(r => r.required && !filled.some(f => f.role === r.role))
          .map(r => r.role),
      });
    }
  }

  // Sort by confidence
  matches.sort((a, b) => b.confidence - a.confidence);
  return matches;
}

/**
 * Find the index of the first preposition in a word list
 * that is relevant to the given verb frame.
 */
function findPrepositionIndex(words: readonly string[], frame: VerbFrame): number {
  const knownPreps = new Set<string>();
  for (const roleSpec of frame.roles) {
    for (const prep of roleSpec.prepositions) {
      knownPreps.add(prep.toLowerCase());
    }
  }

  for (let i = 0; i < words.length; i++) {
    if (knownPreps.has(words[i]!.toLowerCase())) {
      return i;
    }
  }

  return -1;
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a verb frame for display.
 */
export function formatVerbFrame(frame: VerbFrame): string {
  const lines: string[] = [];
  lines.push(`${frame.verb} (${frame.category})`);
  lines.push(`  Forms: ${frame.forms.join(', ')}`);
  lines.push(`  Action: ${frame.semanticAction}`);
  lines.push(`  Make pattern: ${frame.isMakePattern ? 'yes' : 'no'}`);
  lines.push(`  Transitive: ${frame.isTransitive ? 'yes' : 'no'}`);
  lines.push(`  Roles:`);
  for (const r of frame.roles) {
    const req = r.required ? '(required)' : '(optional)';
    const preps = r.prepositions.length > 0 ? ` [${r.prepositions.join('/')}]` : '';
    const types = r.entityTypes.join('/');
    lines.push(`    ${r.role} ${req}: ${types}${preps} — ${r.description}`);
  }
  lines.push(`  Examples: ${frame.examples.join('; ')}`);
  return lines.join('\n');
}

/**
 * Format all verb frames for display.
 */
export function formatAllVerbFrames(): string {
  const sections: string[] = [];

  const categories = [...new Set(VERB_FRAMES.map(f => f.category))];
  for (const cat of categories) {
    const frames = VERB_FRAMES.filter(f => f.category === cat);
    sections.push(`\n=== ${cat.toUpperCase()} ===`);
    for (const frame of frames) {
      sections.push(formatVerbFrame(frame));
    }
  }

  return sections.join('\n');
}

/**
 * Format a frame match for display.
 */
export function formatFrameMatch(match: FrameMatch): string {
  const lines: string[] = [];
  lines.push(`Match: ${match.frame.verb} (${match.pattern}) — confidence: ${(match.confidence * 100).toFixed(0)}%`);
  for (const filled of match.filledRoles) {
    const prep = filled.preposition ? ` (${filled.preposition})` : '';
    lines.push(`  ${filled.role}${prep}: "${filled.surface}"`);
  }
  if (match.missingRoles.length > 0) {
    lines.push(`  Missing: ${match.missingRoles.join(', ')}`);
  }
  return lines.join('\n');
}

/**
 * Format a parsed imperative for display.
 */
export function formatParsedImperative(parsed: ParsedImperative): string {
  const lines: string[] = [];
  lines.push(`Imperative: ${parsed.frame.verb} (${parsed.frame.category})`);
  lines.push(`  Verb surface: "${parsed.verbSurface}"`);
  lines.push(`  Confidence: ${(parsed.confidence * 100).toFixed(0)}%`);

  if (parsed.politeness.length > 0) {
    lines.push(`  Politeness: ${parsed.politeness.map(p => p.type).join(', ')}`);
  }

  for (const filled of parsed.filledRoles) {
    const prep = filled.preposition ? ` (${filled.preposition})` : '';
    lines.push(`  ${filled.role}${prep}: "${filled.surface}"`);
  }

  for (const warning of parsed.warnings) {
    lines.push(`  ⚠ ${warning.code}: ${warning.message}`);
  }

  return lines.join('\n');
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the verb frame registry.
 */
export function getVerbFrameStats(): VerbFrameStats {
  const categoryCounts = new Map<VerbFrameCategory, number>();
  let totalForms = 0;
  let totalRoles = 0;
  let requiredRoles = 0;
  let makePatternCount = 0;
  let transitiveCount = 0;

  for (const frame of VERB_FRAMES) {
    const count = categoryCounts.get(frame.category) ?? 0;
    categoryCounts.set(frame.category, count + 1);
    totalForms += frame.forms.length;
    totalRoles += frame.roles.length;
    requiredRoles += frame.roles.filter(r => r.required).length;
    if (frame.isMakePattern) makePatternCount++;
    if (frame.isTransitive) transitiveCount++;
  }

  return {
    totalFrames: VERB_FRAMES.length,
    totalForms,
    totalRoles,
    requiredRoles,
    makePatternCount,
    transitiveCount,
    categoryCounts: Object.fromEntries(categoryCounts) as Record<VerbFrameCategory, number>,
  };
}

/**
 * Statistics about the verb frame registry.
 */
export interface VerbFrameStats {
  readonly totalFrames: number;
  readonly totalForms: number;
  readonly totalRoles: number;
  readonly requiredRoles: number;
  readonly makePatternCount: number;
  readonly transitiveCount: number;
  readonly categoryCounts: Record<VerbFrameCategory, number>;
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const IMPERATIVE_GRAMMAR_RULES = [
  'Rule IMP-001: Every imperative command begins with a verb in base or ' +
  'imperative form. The verb determines the event category.',

  'Rule IMP-002: Verb frames define required and optional thematic roles ' +
  'with selectional restrictions. Required roles generate warnings if unfilled.',

  'Rule IMP-003: The "make X Y" pattern (resultative construction) is used ' +
  'for transformation verbs: "make it brighter" = transform(patient:it, result:brighter).',

  'Rule IMP-004: Politeness markers ("please", "could you", "just") are ' +
  'recognized and stripped before verb lookup. They don\'t affect semantics.',

  'Rule IMP-005: Prepositions introduce adjunct roles: "to" → goal, ' +
  '"from" → source, "in/at" → location, "with" → instrument/companion.',

  'Rule IMP-006: Preservation verbs ("keep", "maintain", "preserve") ' +
  'generate constraint opcodes rather than edit opcodes.',

  'Rule IMP-007: "Turn up/down" is treated as a special pattern with an ' +
  'implicit direction role (increase/decrease).',

  'Rule IMP-008: "Set X to Y" is a transformation with explicit goal value. ' +
  'The "to" preposition marks the target value, not a location.',

  'Rule IMP-009: Verb synonyms (e.g., "add"/"insert"/"put") map to the same ' +
  'semantic action but may have different selectional restrictions.',

  'Rule IMP-010: Query verbs ("show", "play", "preview") produce inspect ' +
  'opcodes rather than edit opcodes. They are non-destructive.',

  'Rule IMP-011: Reversal verbs ("undo", "redo", "revert") can be used ' +
  'intransitively (undo last action) or with a patient (undo that change).',

  'Rule IMP-012: Grammar rules are generated programmatically from verb ' +
  'frames, ensuring that all verbs support consistent patterns.',
] as const;
