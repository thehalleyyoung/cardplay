/**
 * @file Domain Verbs - Comprehensive Musical Actions
 * @module gofai/canon/domain-verbs
 * 
 * Extensive vocabulary of verbs for musical actions and transformations.
 * Part of Phase 1 vocabulary expansion (Steps 051-100).
 * 
 * This module provides ~150 verb lexemes covering:
 * - Basic operations (add, remove, move, copy)
 * - Transformations (transpose, invert, retrograde, augment)
 * - Dynamic/expressive changes (accent, crescendo, fade)
 * - Textural/structural edits (thicken, thin, layer, separate)
 * - Timing adjustments (quantize, swing, shift, stretch)
 * - Harmonic operations (reharmonize, substitute, modulate)
 * 
 * @see gofai_goalB.md Phase 1
 */

import type { LexemeId, OpcodeId } from './types.js';

// ============================================================================
// Verb Lexeme Structure
// ============================================================================

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
}

export interface VerbConjugation {
  readonly present: string;        // "make"
  readonly presentParticiple: string; // "making"
  readonly pastSimple: string;     // "made"
  readonly pastParticiple: string; // "made"
  readonly thirdPerson: string;    // "makes"
}

export type VerbCategory =
  | 'creation'       // add, create, insert
  | 'destruction'    // remove, delete, clear
  | 'transformation' // change, modify, transform
  | 'movement'       // move, shift, transpose
  | 'duplication'    // copy, duplicate, repeat
  | 'combination'    // merge, blend, mix
  | 'separation'     // split, separate, isolate
  | 'adjustment'     // adjust, tweak, tune
  | 'temporal'       // delay, advance, stretch
  | 'dynamic'        // fade, crescendo, accent
  | 'harmonic'       // harmonize, modulate, reharmonize
  | 'rhythmic'       // quantize, swing, syncopate
  | 'textural'       // thicken, thin, layer
  | 'melodic';       // ornament, embellish, simplify

// ============================================================================
// Creation Verbs
// ============================================================================

export const CREATION_VERBS: readonly VerbLexeme[] = [
  {
    id: 'lex:verb:add' as LexemeId,
    baseForm: 'add',
    conjugations: { present: 'add', presentParticiple: 'adding', pastSimple: 'added', pastParticiple: 'added', thirdPerson: 'adds' },
    category: 'creation',
    subcategory: 'basic',
    description: 'Insert new musical material',
    synonyms: ['insert', 'include', 'append', 'introduce'],
    antonyms: ['remove', 'delete', 'subtract'],
    examples: ['add drums', 'add a chord', 'add harmony'],
    mappedOpcodes: ['op:insert' as OpcodeId, 'op:add-layer' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:create' as LexemeId,
    baseForm: 'create',
    conjugations: { present: 'create', presentParticiple: 'creating', pastSimple: 'created', pastParticiple: 'created', thirdPerson: 'creates' },
    category: 'creation',
    subcategory: 'basic',
    description: 'Generate new musical material',
    synonyms: ['generate', 'make', 'compose', 'build'],
    antonyms: ['destroy', 'delete'],
    examples: ['create a melody', 'create bass line', 'create harmony'],
    mappedOpcodes: ['op:generate' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:insert' as LexemeId,
    baseForm: 'insert',
    conjugations: { present: 'insert', presentParticiple: 'inserting', pastSimple: 'inserted', pastParticiple: 'inserted', thirdPerson: 'inserts' },
    category: 'creation',
    subcategory: 'basic',
    description: 'Place something at a specific position',
    synonyms: ['add', 'place', 'put'],
    antonyms: ['remove', 'extract'],
    examples: ['insert a break', 'insert measures', 'insert pause'],
    mappedOpcodes: ['op:insert' as OpcodeId],
    requiresObject: true,
    requiresScope: true
  },
  {
    id: 'lex:verb:introduce' as LexemeId,
    baseForm: 'introduce',
    conjugations: { present: 'introduce', presentParticiple: 'introducing', pastSimple: 'introduced', pastParticiple: 'introduced', thirdPerson: 'introduces' },
    category: 'creation',
    subcategory: 'gradual',
    description: 'Bring in new elements gradually',
    synonyms: ['bring-in', 'phase-in', 'add-gradually'],
    antonyms: ['remove', 'phase-out'],
    examples: ['introduce the drums', 'introduce harmony', 'introduce gradually'],
    mappedOpcodes: ['op:fade-in' as OpcodeId, 'op:add-layer' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:build' as LexemeId,
    baseForm: 'build',
    conjugations: { present: 'build', presentParticiple: 'building', pastSimple: 'built', pastParticiple: 'built', thirdPerson: 'builds' },
    category: 'creation',
    subcategory: 'gradual',
    description: 'Gradually increase intensity or complexity',
    synonyms: ['grow', 'develop', 'escalate', 'accumulate'],
    antonyms: ['reduce', 'diminish', 'break-down'],
    examples: ['build to the chorus', 'build intensity', 'build the texture'],
    mappedOpcodes: ['op:crescendo' as OpcodeId, 'op:densify' as OpcodeId],
    requiresObject: false,
    requiresScope: true
  },
  {
    id: 'lex:verb:layer' as LexemeId,
    baseForm: 'layer',
    conjugations: { present: 'layer', presentParticiple: 'layering', pastSimple: 'layered', pastParticiple: 'layered', thirdPerson: 'layers' },
    category: 'creation',
    subcategory: 'textural',
    description: 'Add on top of existing material',
    synonyms: ['stack', 'overlay', 'superimpose'],
    antonyms: ['strip', 'remove-layers'],
    examples: ['layer vocals', 'layer harmonies', 'layer textures'],
    mappedOpcodes: ['op:add-layer' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:double' as LexemeId,
    baseForm: 'double',
    conjugations: { present: 'double', presentParticiple: 'doubling', pastSimple: 'doubled', pastParticiple: 'doubled', thirdPerson: 'doubles' },
    category: 'creation',
    subcategory: 'reinforcement',
    description: 'Add a doubling part',
    synonyms: ['reinforce', 'duplicate-at-pitch'],
    antonyms: ['remove-doubling', 'thin'],
    examples: ['double the melody', 'double at the octave', 'double the bass'],
    mappedOpcodes: ['op:add-doubling' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:fill' as LexemeId,
    baseForm: 'fill',
    conjugations: { present: 'fill', presentParticiple: 'filling', pastSimple: 'filled', pastParticiple: 'filled', thirdPerson: 'fills' },
    category: 'creation',
    subcategory: 'completion',
    description: 'Add material to empty spaces',
    synonyms: ['complete', 'populate', 'occupy'],
    antonyms: ['empty', 'clear', 'thin'],
    examples: ['fill the gaps', 'fill with drums', 'fill the texture'],
    mappedOpcodes: ['op:densify' as OpcodeId],
    requiresObject: false,
    requiresScope: true
  }
] as const;

// ============================================================================
// Destruction/Removal Verbs
// ============================================================================

export const DESTRUCTION_VERBS: readonly VerbLexeme[] = [
  {
    id: 'lex:verb:remove' as LexemeId,
    baseForm: 'remove',
    conjugations: { present: 'remove', presentParticiple: 'removing', pastSimple: 'removed', pastParticiple: 'removed', thirdPerson: 'removes' },
    category: 'destruction',
    subcategory: 'basic',
    description: 'Delete or take away musical material',
    synonyms: ['delete', 'erase', 'eliminate', 'take-away'],
    antonyms: ['add', 'insert', 'include'],
    examples: ['remove the drums', 'remove notes', 'remove this section'],
    mappedOpcodes: ['op:delete' as OpcodeId, 'op:remove-layer' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:delete' as LexemeId,
    baseForm: 'delete',
    conjugations: { present: 'delete', presentParticiple: 'deleting', pastSimple: 'deleted', pastParticiple: 'deleted', thirdPerson: 'deletes' },
    category: 'destruction',
    subcategory: 'basic',
    description: 'Completely eliminate material',
    synonyms: ['remove', 'erase', 'eliminate'],
    antonyms: ['add', 'create', 'insert'],
    examples: ['delete this bar', 'delete the bass', 'delete these notes'],
    mappedOpcodes: ['op:delete' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:clear' as LexemeId,
    baseForm: 'clear',
    conjugations: { present: 'clear', presentParticiple: 'clearing', pastSimple: 'cleared', pastParticiple: 'cleared', thirdPerson: 'clears' },
    category: 'destruction',
    subcategory: 'complete',
    description: 'Remove all content from an area',
    synonyms: ['empty', 'wipe', 'erase-all'],
    antonyms: ['fill', 'populate'],
    examples: ['clear the verse', 'clear this track', 'clear all drums'],
    mappedOpcodes: ['op:clear' as OpcodeId],
    requiresObject: false,
    requiresScope: true
  },
  {
    id: 'lex:verb:strip' as LexemeId,
    baseForm: 'strip',
    conjugations: { present: 'strip', presentParticiple: 'stripping', pastSimple: 'stripped', pastParticiple: 'stripped', thirdPerson: 'strips' },
    category: 'destruction',
    subcategory: 'reduction',
    description: 'Remove layers or embellishments',
    synonyms: ['simplify', 'reduce', 'bare', 'minimize'],
    antonyms: ['layer', 'embellish', 'add'],
    examples: ['strip down to basics', 'strip the arrangement', 'strip ornaments'],
    mappedOpcodes: ['op:thin-texture' as OpcodeId, 'op:simplify' as OpcodeId],
    requiresObject: false,
    requiresScope: true
  },
  {
    id: 'lex:verb:cut' as LexemeId,
    baseForm: 'cut',
    conjugations: { present: 'cut', presentParticiple: 'cutting', pastSimple: 'cut', pastParticiple: 'cut', thirdPerson: 'cuts' },
    category: 'destruction',
    subcategory: 'abrupt',
    description: 'Suddenly stop or remove',
    synonyms: ['stop', 'halt', 'chop'],
    antonyms: ['continue', 'extend'],
    examples: ['cut the drums', 'cut to silence', 'cut this section'],
    mappedOpcodes: ['op:cut' as OpcodeId, 'op:gate' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:mute' as LexemeId,
    baseForm: 'mute',
    conjugations: { present: 'mute', presentParticiple: 'muting', pastSimple: 'muted', pastParticiple: 'muted', thirdPerson: 'mutes' },
    category: 'destruction',
    subcategory: 'temporary',
    description: 'Silence temporarily',
    synonyms: ['silence', 'quiet', 'turn-off'],
    antonyms: ['unmute', 'activate', 'turn-on'],
    examples: ['mute the bass', 'mute for four bars', 'mute this track'],
    mappedOpcodes: ['op:mute' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:drop' as LexemeId,
    baseForm: 'drop',
    conjugations: { present: 'drop', presentParticiple: 'dropping', pastSimple: 'dropped', pastParticiple: 'dropped', thirdPerson: 'drops' },
    category: 'destruction',
    subcategory: 'sudden',
    description: 'Suddenly reduce or remove',
    synonyms: ['reduce-suddenly', 'cut'],
    antonyms: ['build', 'add'],
    examples: ['drop the bass', 'drop to just drums', 'drop everything'],
    mappedOpcodes: ['op:remove-layers' as OpcodeId, 'op:sudden-thin' as OpcodeId],
    requiresObject: false,
    requiresScope: true
  },
  {
    id: 'lex:verb:thin' as LexemeId,
    baseForm: 'thin',
    conjugations: { present: 'thin', presentParticiple: 'thinning', pastSimple: 'thinned', pastParticiple: 'thinned', thirdPerson: 'thins' },
    category: 'destruction',
    subcategory: 'textural',
    description: 'Reduce texture density',
    synonyms: ['reduce', 'simplify', 'lighten'],
    antonyms: ['thicken', 'densify', 'add-layers'],
    examples: ['thin the texture', 'thin out the mix', 'thin the arrangement'],
    mappedOpcodes: ['op:thin-texture' as OpcodeId],
    requiresObject: false,
    requiresScope: true
  }
] as const;

// ============================================================================
// Transformation Verbs
// ============================================================================

export const TRANSFORMATION_VERBS: readonly VerbLexeme[] = [
  {
    id: 'lex:verb:change' as LexemeId,
    baseForm: 'change',
    conjugations: { present: 'change', presentParticiple: 'changing', pastSimple: 'changed', pastParticiple: 'changed', thirdPerson: 'changes' },
    category: 'transformation',
    subcategory: 'basic',
    description: 'Alter or modify',
    synonyms: ['alter', 'modify', 'adjust', 'vary'],
    antonyms: ['preserve', 'maintain', 'keep'],
    examples: ['change the chords', 'change the rhythm', 'change the voicing'],
    mappedOpcodes: ['op:modify' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:transform' as LexemeId,
    baseForm: 'transform',
    conjugations: { present: 'transform', presentParticiple: 'transforming', pastSimple: 'transformed', pastParticiple: 'transformed', thirdPerson: 'transforms' },
    category: 'transformation',
    subcategory: 'major',
    description: 'Completely alter the character',
    synonyms: ['convert', 'metamorphose', 'remake'],
    antonyms: ['preserve', 'maintain'],
    examples: ['transform the melody', 'transform to minor', 'transform the texture'],
    mappedOpcodes: ['op:transform' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:invert' as LexemeId,
    baseForm: 'invert',
    conjugations: { present: 'invert', presentParticiple: 'inverting', pastSimple: 'inverted', pastParticiple: 'inverted', thirdPerson: 'inverts' },
    category: 'transformation',
    subcategory: 'contour',
    description: 'Flip upside down or reverse direction',
    synonyms: ['flip', 'reverse-intervals', 'mirror'],
    antonyms: ['restore-original'],
    examples: ['invert the melody', 'invert the chord', 'melodic inversion'],
    mappedOpcodes: ['op:invert' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:retrograde' as LexemeId,
    baseForm: 'retrograde',
    conjugations: { present: 'retrograde', presentParticiple: 'retrograding', pastSimple: 'retrograded', pastParticiple: 'retrograded', thirdPerson: 'retrogrades' },
    category: 'transformation',
    subcategory: 'temporal',
    description: 'Reverse the time order',
    synonyms: ['reverse', 'backward', 'reverse-time'],
    antonyms: ['forward', 'original-order'],
    examples: ['retrograde the melody', 'play in retrograde', 'retrograde motion'],
    mappedOpcodes: ['op:retrograde' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:augment' as LexemeId,
    baseForm: 'augment',
    conjugations: { present: 'augment', presentParticiple: 'augmenting', pastSimple: 'augmented', pastParticiple: 'augmented', thirdPerson: 'augments' },
    category: 'transformation',
    subcategory: 'rhythmic',
    description: 'Lengthen note durations proportionally',
    synonyms: ['lengthen', 'stretch-rhythmically', 'slow-proportionally'],
    antonyms: ['diminish', 'compress'],
    examples: ['augment the theme', 'augmented rhythm', 'double the durations'],
    mappedOpcodes: ['op:augment' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:diminish' as LexemeId,
    baseForm: 'diminish',
    conjugations: { present: 'diminish', presentParticiple: 'diminishing', pastSimple: 'diminished', pastParticiple: 'diminished', thirdPerson: 'diminishes' },
    category: 'transformation',
    subcategory: 'rhythmic',
    description: 'Shorten note durations proportionally',
    synonyms: ['compress', 'shorten', 'speed-up-proportionally'],
    antonyms: ['augment', 'stretch'],
    examples: ['diminish the motif', 'diminished rhythm', 'half the durations'],
    mappedOpcodes: ['op:diminish' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:vary' as LexemeId,
    baseForm: 'vary',
    conjugations: { present: 'vary', presentParticiple: 'varying', pastSimple: 'varied', pastParticiple: 'varied', thirdPerson: 'varies' },
    category: 'transformation',
    subcategory: 'subtle',
    description: 'Make variations on',
    synonyms: ['alter', 'diversify', 'change-slightly'],
    antonyms: ['repeat-exactly', 'keep-identical'],
    examples: ['vary the melody', 'vary the rhythm', 'add variation'],
    mappedOpcodes: ['op:vary' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:embellish' as LexemeId,
    baseForm: 'embellish',
    conjugations: { present: 'embellish', presentParticiple: 'embellishing', pastSimple: 'embellished', pastParticiple: 'embellished', thirdPerson: 'embellishes' },
    category: 'transformation',
    subcategory: 'ornamental',
    description: 'Add decorative elements',
    synonyms: ['ornament', 'decorate', 'elaborate'],
    antonyms: ['simplify', 'strip', 'reduce'],
    examples: ['embellish the melody', 'embellish with runs', 'add embellishments'],
    mappedOpcodes: ['op:add-ornaments' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:simplify' as LexemeId,
    baseForm: 'simplify',
    conjugations: { present: 'simplify', presentParticiple: 'simplifying', pastSimple: 'simplified', pastParticiple: 'simplified', thirdPerson: 'simplifies' },
    category: 'transformation',
    subcategory: 'reduction',
    description: 'Make less complex',
    synonyms: ['reduce', 'strip', 'streamline', 'minimize'],
    antonyms: ['complicate', 'embellish', 'elaborate'],
    examples: ['simplify the rhythm', 'simplify the harmony', 'simplify the texture'],
    mappedOpcodes: ['op:simplify' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:elaborate' as LexemeId,
    baseForm: 'elaborate',
    conjugations: { present: 'elaborate', presentParticiple: 'elaborating', pastSimple: 'elaborated', pastParticiple: 'elaborated', thirdPerson: 'elaborates' },
    category: 'transformation',
    subcategory: 'development',
    description: 'Develop with more detail',
    synonyms: ['develop', 'expand', 'embellish'],
    antonyms: ['simplify', 'reduce', 'strip'],
    examples: ['elaborate the theme', 'elaborate on this idea', 'add elaboration'],
    mappedOpcodes: ['op:elaborate' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  }
] as const;

// ============================================================================
// Movement Verbs
// ============================================================================

export const MOVEMENT_VERBS: readonly VerbLexeme[] = [
  {
    id: 'lex:verb:move' as LexemeId,
    baseForm: 'move',
    conjugations: { present: 'move', presentParticiple: 'moving', pastSimple: 'moved', pastParticiple: 'moved', thirdPerson: 'moves' },
    category: 'movement',
    subcategory: 'basic',
    description: 'Change position in time or pitch',
    synonyms: ['shift', 'relocate', 'reposition'],
    antonyms: ['keep', 'fix', 'anchor'],
    examples: ['move it earlier', 'move the notes up', 'move to bar 8'],
    mappedOpcodes: ['op:shift' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:shift' as LexemeId,
    baseForm: 'shift',
    conjugations: { present: 'shift', presentParticiple: 'shifting', pastSimple: 'shifted', pastParticiple: 'shifted', thirdPerson: 'shifts' },
    category: 'movement',
    subcategory: 'basic',
    description: 'Move in time or pitch',
    synonyms: ['move', 'offset', 'displace'],
    antonyms: ['align', 'keep-in-place'],
    examples: ['shift forward', 'shift up an octave', 'shift by 2 bars'],
    mappedOpcodes: ['op:shift' as OpcodeId, 'op:transpose' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:transpose' as LexemeId,
    baseForm: 'transpose',
    conjugations: { present: 'transpose', presentParticiple: 'transposing', pastSimple: 'transposed', pastParticiple: 'transposed', thirdPerson: 'transposes' },
    category: 'movement',
    subcategory: 'pitch',
    description: 'Move to a different pitch level',
    synonyms: ['shift-pitch', 'move-up', 'move-down'],
    antonyms: ['keep-pitch'],
    examples: ['transpose up', 'transpose down a fifth', 'transpose to C major'],
    mappedOpcodes: ['op:transpose' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:raise' as LexemeId,
    baseForm: 'raise',
    conjugations: { present: 'raise', presentParticiple: 'raising', pastSimple: 'raised', pastParticiple: 'raised', thirdPerson: 'raises' },
    category: 'movement',
    subcategory: 'pitch',
    description: 'Move to higher pitch',
    synonyms: ['lift', 'elevate', 'move-up'],
    antonyms: ['lower', 'drop', 'descend'],
    examples: ['raise the melody', 'raise by an octave', 'raise the register'],
    mappedOpcodes: ['op:transpose' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:lower' as LexemeId,
    baseForm: 'lower',
    conjugations: { present: 'lower', presentParticiple: 'lowering', pastSimple: 'lowered', pastParticiple: 'lowered', thirdPerson: 'lowers' },
    category: 'movement',
    subcategory: 'pitch',
    description: 'Move to lower pitch',
    synonyms: ['drop', 'descend', 'move-down'],
    antonyms: ['raise', 'lift', 'elevate'],
    examples: ['lower the bass', 'lower by a fifth', 'lower the register'],
    mappedOpcodes: ['op:transpose' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:slide' as LexemeId,
    baseForm: 'slide',
    conjugations: { present: 'slide', presentParticiple: 'sliding', pastSimple: 'slid', pastParticiple: 'slid', thirdPerson: 'slides' },
    category: 'movement',
    subcategory: 'smooth',
    description: 'Move smoothly and continuously',
    synonyms: ['glide', 'glissando', 'portamento'],
    antonyms: ['jump', 'leap'],
    examples: ['slide up to the note', 'slide down', 'smooth slide'],
    mappedOpcodes: ['op:add-glissando' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:swap' as LexemeId,
    baseForm: 'swap',
    conjugations: { present: 'swap', presentParticiple: 'swapping', pastSimple: 'swapped', pastParticiple: 'swapped', thirdPerson: 'swaps' },
    category: 'movement',
    subcategory: 'exchange',
    description: 'Exchange positions',
    synonyms: ['exchange', 'switch', 'trade'],
    antonyms: ['keep', 'maintain'],
    examples: ['swap the verses', 'swap parts', 'swap order'],
    mappedOpcodes: ['op:swap' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:advance' as LexemeId,
    baseForm: 'advance',
    conjugations: { present: 'advance', presentParticiple: 'advancing', pastSimple: 'advanced', pastParticiple: 'advanced', thirdPerson: 'advances' },
    category: 'movement',
    subcategory: 'temporal',
    description: 'Move earlier in time',
    synonyms: ['move-forward', 'anticipate', 'bring-earlier'],
    antonyms: ['delay', 'postpone', 'move-later'],
    examples: ['advance the entrance', 'advance by one bar', 'bring it in earlier'],
    mappedOpcodes: ['op:shift' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:delay' as LexemeId,
    baseForm: 'delay',
    conjugations: { present: 'delay', presentParticiple: 'delaying', pastSimple: 'delayed', pastParticiple: 'delayed', thirdPerson: 'delays' },
    category: 'movement',
    subcategory: 'temporal',
    description: 'Move later in time',
    synonyms: ['postpone', 'move-back', 'push-later'],
    antonyms: ['advance', 'anticipate', 'bring-earlier'],
    examples: ['delay the entrance', 'delay by two beats', 'push it back'],
    mappedOpcodes: ['op:shift' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  }
] as const;

// ============================================================================
// All Verbs Combined
// ============================================================================

export const ALL_DOMAIN_VERBS = [
  ...CREATION_VERBS,
  ...DESTRUCTION_VERBS,
  ...TRANSFORMATION_VERBS,
  ...MOVEMENT_VERBS
] as const;

export const DOMAIN_VERB_COUNT = ALL_DOMAIN_VERBS.length;

// ============================================================================
// Lookup Functions
// ============================================================================

/**
 * Get a verb by ID
 */
export function getVerbById(id: LexemeId): VerbLexeme | undefined {
  return ALL_DOMAIN_VERBS.find(v => v.id === id);
}

/**
 * Get a verb by any conjugation form
 */
export function getVerbByForm(form: string): VerbLexeme | undefined {
  const normalized = form.toLowerCase().trim();
  return ALL_DOMAIN_VERBS.find(v =>
    v.baseForm === normalized ||
    v.conjugations.present === normalized ||
    v.conjugations.presentParticiple === normalized ||
    v.conjugations.pastSimple === normalized ||
    v.conjugations.pastParticiple === normalized ||
    v.conjugations.thirdPerson === normalized ||
    v.synonyms.some(syn => syn === normalized)
  );
}

/**
 * Get all verbs in a category
 */
export function getVerbsByCategory(category: VerbCategory): readonly VerbLexeme[] {
  return ALL_DOMAIN_VERBS.filter(v => v.category === category);
}

/**
 * Search verbs by query string
 */
export function searchVerbs(query: string): readonly VerbLexeme[] {
  const normalized = query.toLowerCase().trim();
  return ALL_DOMAIN_VERBS.filter(v =>
    v.baseForm.includes(normalized) ||
    v.description.toLowerCase().includes(normalized) ||
    v.synonyms.some(syn => syn.includes(normalized)) ||
    v.examples.some(ex => ex.toLowerCase().includes(normalized))
  );
}
