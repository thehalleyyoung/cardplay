/**
 * @file Domain Verbs - Batch 2: Extended Actions
 * @module gofai/canon/domain-verbs-batch2
 * 
 * Additional comprehensive verb vocabulary for musical actions.
 * Part of Phase 1 vocabulary expansion (Steps 051-100).
 * 
 * This batch adds:
 * - Duplication verbs (copy, repeat, duplicate, clone)
 * - Combination verbs (merge, blend, mix, combine)
 * - Separation verbs (split, separate, isolate, extract)
 * - Adjustment verbs (adjust, tweak, tune, calibrate)
 * - Temporal verbs (stretch, compress, expand, contract)
 * - Dynamic verbs (fade, crescendo, diminuendo, swell)
 * - Harmonic verbs (harmonize, reharmonize, modulate, resolve)
 * - Rhythmic verbs (quantize, swing, syncopate, groove)
 * - Textural verbs (thicken, densify, space, distribute)
 * - Melodic verbs (ornament, embellish, smooth, shape)
 * 
 * @see gofai_goalB.md Phase 1
 */

import type { LexemeId, OpcodeId } from './types.js';
import type { VerbLexeme } from './domain-verbs.js';

// ============================================================================
// Duplication Verbs
// ============================================================================

export const DUPLICATION_VERBS: readonly VerbLexeme[] = [
  {
    id: 'lex:verb:copy' as LexemeId,
    baseForm: 'copy',
    conjugations: { present: 'copy', presentParticiple: 'copying', pastSimple: 'copied', pastParticiple: 'copied', thirdPerson: 'copies' },
    category: 'duplication',
    subcategory: 'basic',
    description: 'Create a duplicate of something',
    synonyms: ['duplicate', 'clone', 'replicate'],
    antonyms: ['delete', 'remove'],
    examples: ['copy the verse', 'copy to chorus', 'copy this pattern'],
    mappedOpcodes: ['op:copy' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:duplicate' as LexemeId,
    baseForm: 'duplicate',
    conjugations: { present: 'duplicate', presentParticiple: 'duplicating', pastSimple: 'duplicated', pastParticiple: 'duplicated', thirdPerson: 'duplicates' },
    category: 'duplication',
    subcategory: 'basic',
    description: 'Make an identical copy',
    synonyms: ['copy', 'clone', 'replicate', 'mirror'],
    antonyms: ['unique', 'original'],
    examples: ['duplicate the section', 'duplicate this part', 'duplicate and modify'],
    mappedOpcodes: ['op:duplicate' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:repeat' as LexemeId,
    baseForm: 'repeat',
    conjugations: { present: 'repeat', presentParticiple: 'repeating', pastSimple: 'repeated', pastParticiple: 'repeated', thirdPerson: 'repeats' },
    category: 'duplication',
    subcategory: 'iterative',
    description: 'Do again or multiple times',
    synonyms: ['reiterate', 'redo', 'replay'],
    antonyms: ['vary', 'change', 'stop'],
    examples: ['repeat the chorus', 'repeat twice', 'repeat this pattern'],
    mappedOpcodes: ['op:repeat' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:clone' as LexemeId,
    baseForm: 'clone',
    conjugations: { present: 'clone', presentParticiple: 'cloning', pastSimple: 'cloned', pastParticiple: 'cloned', thirdPerson: 'clones' },
    category: 'duplication',
    subcategory: 'exact',
    description: 'Create an exact replica',
    synonyms: ['copy', 'duplicate', 'replicate'],
    antonyms: ['unique', 'original'],
    examples: ['clone the track', 'clone this layer', 'clone and adjust'],
    mappedOpcodes: ['op:clone' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:mirror' as LexemeId,
    baseForm: 'mirror',
    conjugations: { present: 'mirror', presentParticiple: 'mirroring', pastSimple: 'mirrored', pastParticiple: 'mirrored', thirdPerson: 'mirrors' },
    category: 'duplication',
    subcategory: 'symmetry',
    description: 'Create a reflected copy',
    synonyms: ['reflect', 'flip', 'reverse'],
    antonyms: ['asymmetric'],
    examples: ['mirror the melody', 'mirror this part', 'mirror and invert'],
    mappedOpcodes: ['op:mirror' as OpcodeId, 'op:invert' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:replicate' as LexemeId,
    baseForm: 'replicate',
    conjugations: { present: 'replicate', presentParticiple: 'replicating', pastSimple: 'replicated', pastParticiple: 'replicated', thirdPerson: 'replicates' },
    category: 'duplication',
    subcategory: 'multiple',
    description: 'Reproduce multiple times',
    synonyms: ['duplicate', 'copy', 'repeat'],
    antonyms: ['unique'],
    examples: ['replicate the pattern', 'replicate across bars', 'replicate and vary'],
    mappedOpcodes: ['op:replicate' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:loop' as LexemeId,
    baseForm: 'loop',
    conjugations: { present: 'loop', presentParticiple: 'looping', pastSimple: 'looped', pastParticiple: 'looped', thirdPerson: 'loops' },
    category: 'duplication',
    subcategory: 'cyclic',
    description: 'Repeat cyclically',
    synonyms: ['cycle', 'repeat-continuously'],
    antonyms: ['stop', 'end'],
    examples: ['loop this section', 'loop for 8 bars', 'create a loop'],
    mappedOpcodes: ['op:loop' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  }
] as const;

// ============================================================================
// Combination Verbs
// ============================================================================

export const COMBINATION_VERBS: readonly VerbLexeme[] = [
  {
    id: 'lex:verb:merge' as LexemeId,
    baseForm: 'merge',
    conjugations: { present: 'merge', presentParticiple: 'merging', pastSimple: 'merged', pastParticiple: 'merged', thirdPerson: 'merges' },
    category: 'combination',
    subcategory: 'basic',
    description: 'Combine into one',
    synonyms: ['combine', 'join', 'unite', 'fuse'],
    antonyms: ['split', 'separate', 'divide'],
    examples: ['merge the tracks', 'merge into one', 'merge these layers'],
    mappedOpcodes: ['op:merge' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:blend' as LexemeId,
    baseForm: 'blend',
    conjugations: { present: 'blend', presentParticiple: 'blending', pastSimple: 'blended', pastParticiple: 'blended', thirdPerson: 'blends' },
    category: 'combination',
    subcategory: 'smooth',
    description: 'Mix smoothly together',
    synonyms: ['mix', 'fuse', 'combine-smoothly'],
    antonyms: ['separate', 'distinguish', 'contrast'],
    examples: ['blend the harmonies', 'blend layers', 'blend seamlessly'],
    mappedOpcodes: ['op:blend' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:mix' as LexemeId,
    baseForm: 'mix',
    conjugations: { present: 'mix', presentParticiple: 'mixing', pastSimple: 'mixed', pastParticiple: 'mixed', thirdPerson: 'mixes' },
    category: 'combination',
    subcategory: 'basic',
    description: 'Combine multiple elements',
    synonyms: ['blend', 'combine', 'merge'],
    antonyms: ['unmix', 'separate'],
    examples: ['mix the tracks', 'mix together', 'mix and balance'],
    mappedOpcodes: ['op:mix' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:combine' as LexemeId,
    baseForm: 'combine',
    conjugations: { present: 'combine', presentParticiple: 'combining', pastSimple: 'combined', pastParticiple: 'combined', thirdPerson: 'combines' },
    category: 'combination',
    subcategory: 'basic',
    description: 'Bring together',
    synonyms: ['merge', 'unite', 'join'],
    antonyms: ['separate', 'divide'],
    examples: ['combine the parts', 'combine into one track', 'combine patterns'],
    mappedOpcodes: ['op:combine' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:unify' as LexemeId,
    baseForm: 'unify',
    conjugations: { present: 'unify', presentParticiple: 'unifying', pastSimple: 'unified', pastParticiple: 'unified', thirdPerson: 'unifies' },
    category: 'combination',
    subcategory: 'coherent',
    description: 'Make into a coherent whole',
    synonyms: ['integrate', 'consolidate', 'harmonize'],
    antonyms: ['fragment', 'divide'],
    examples: ['unify the rhythm', 'unify the texture', 'unify timbrally'],
    mappedOpcodes: ['op:unify' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:fuse' as LexemeId,
    baseForm: 'fuse',
    conjugations: { present: 'fuse', presentParticiple: 'fusing', pastSimple: 'fused', pastParticiple: 'fused', thirdPerson: 'fuses' },
    category: 'combination',
    subcategory: 'complete',
    description: 'Meld completely together',
    synonyms: ['merge', 'blend', 'integrate'],
    antonyms: ['separate', 'split'],
    examples: ['fuse the layers', 'fuse into one', 'fuse harmonically'],
    mappedOpcodes: ['op:fuse' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:join' as LexemeId,
    baseForm: 'join',
    conjugations: { present: 'join', presentParticiple: 'joining', pastSimple: 'joined', pastParticiple: 'joined', thirdPerson: 'joins' },
    category: 'combination',
    subcategory: 'connect',
    description: 'Connect together',
    synonyms: ['connect', 'link', 'unite'],
    antonyms: ['separate', 'disconnect'],
    examples: ['join the sections', 'join seamlessly', 'join the parts'],
    mappedOpcodes: ['op:join' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  }
] as const;

// ============================================================================
// Separation Verbs
// ============================================================================

export const SEPARATION_VERBS: readonly VerbLexeme[] = [
  {
    id: 'lex:verb:split' as LexemeId,
    baseForm: 'split',
    conjugations: { present: 'split', presentParticiple: 'splitting', pastSimple: 'split', pastParticiple: 'split', thirdPerson: 'splits' },
    category: 'separation',
    subcategory: 'basic',
    description: 'Divide into parts',
    synonyms: ['divide', 'separate', 'partition'],
    antonyms: ['merge', 'combine', 'join'],
    examples: ['split the track', 'split into two', 'split at this bar'],
    mappedOpcodes: ['op:split' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:separate' as LexemeId,
    baseForm: 'separate',
    conjugations: { present: 'separate', presentParticiple: 'separating', pastSimple: 'separated', pastParticiple: 'separated', thirdPerson: 'separates' },
    category: 'separation',
    subcategory: 'basic',
    description: 'Pull apart',
    synonyms: ['split', 'divide', 'isolate'],
    antonyms: ['combine', 'merge', 'join'],
    examples: ['separate the layers', 'separate drums and bass', 'separate harmonically'],
    mappedOpcodes: ['op:separate' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:isolate' as LexemeId,
    baseForm: 'isolate',
    conjugations: { present: 'isolate', presentParticiple: 'isolating', pastSimple: 'isolated', pastParticiple: 'isolated', thirdPerson: 'isolates' },
    category: 'separation',
    subcategory: 'individual',
    description: 'Set apart from others',
    synonyms: ['solo', 'extract', 'single-out'],
    antonyms: ['combine', 'integrate'],
    examples: ['isolate the melody', 'isolate this layer', 'isolate the bass'],
    mappedOpcodes: ['op:isolate' as OpcodeId, 'op:solo' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:extract' as LexemeId,
    baseForm: 'extract',
    conjugations: { present: 'extract', presentParticiple: 'extracting', pastSimple: 'extracted', pastParticiple: 'extracted', thirdPerson: 'extracts' },
    category: 'separation',
    subcategory: 'selective',
    description: 'Remove and isolate',
    synonyms: ['pull-out', 'isolate', 'separate'],
    antonyms: ['insert', 'embed'],
    examples: ['extract the melody', 'extract drums', 'extract and save'],
    mappedOpcodes: ['op:extract' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:solo' as LexemeId,
    baseForm: 'solo',
    conjugations: { present: 'solo', presentParticiple: 'soloing', pastSimple: 'soloed', pastParticiple: 'soloed', thirdPerson: 'solos' },
    category: 'separation',
    subcategory: 'individual',
    description: 'Listen to alone',
    synonyms: ['isolate', 'single-out'],
    antonyms: ['mute', 'ensemble'],
    examples: ['solo the drums', 'solo this track', 'solo the lead'],
    mappedOpcodes: ['op:solo' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:partition' as LexemeId,
    baseForm: 'partition',
    conjugations: { present: 'partition', presentParticiple: 'partitioning', pastSimple: 'partitioned', pastParticiple: 'partitioned', thirdPerson: 'partitions' },
    category: 'separation',
    subcategory: 'division',
    description: 'Divide into sections',
    synonyms: ['divide', 'segment', 'split'],
    antonyms: ['unify', 'merge'],
    examples: ['partition the track', 'partition by section', 'partition into groups'],
    mappedOpcodes: ['op:partition' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:detach' as LexemeId,
    baseForm: 'detach',
    conjugations: { present: 'detach', presentParticiple: 'detaching', pastSimple: 'detached', pastParticiple: 'detached', thirdPerson: 'detaches' },
    category: 'separation',
    subcategory: 'disconnect',
    description: 'Disconnect from',
    synonyms: ['disconnect', 'separate', 'unlink'],
    antonyms: ['attach', 'connect', 'link'],
    examples: ['detach from the group', 'detach this layer', 'detach and move'],
    mappedOpcodes: ['op:detach' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  }
] as const;

// ============================================================================
// Adjustment Verbs
// ============================================================================

export const ADJUSTMENT_VERBS: readonly VerbLexeme[] = [
  {
    id: 'lex:verb:adjust' as LexemeId,
    baseForm: 'adjust',
    conjugations: { present: 'adjust', presentParticiple: 'adjusting', pastSimple: 'adjusted', pastParticiple: 'adjusted', thirdPerson: 'adjusts' },
    category: 'adjustment',
    subcategory: 'basic',
    description: 'Make small changes',
    synonyms: ['tweak', 'modify', 'fine-tune'],
    antonyms: ['fix', 'freeze'],
    examples: ['adjust the timing', 'adjust levels', 'adjust slightly'],
    mappedOpcodes: ['op:adjust' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:tweak' as LexemeId,
    baseForm: 'tweak',
    conjugations: { present: 'tweak', presentParticiple: 'tweaking', pastSimple: 'tweaked', pastParticiple: 'tweaked', thirdPerson: 'tweaks' },
    category: 'adjustment',
    subcategory: 'subtle',
    description: 'Make subtle adjustments',
    synonyms: ['adjust', 'fine-tune', 'nudge'],
    antonyms: ['leave-alone'],
    examples: ['tweak the EQ', 'tweak the timing', 'tweak slightly'],
    mappedOpcodes: ['op:tweak' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:tune' as LexemeId,
    baseForm: 'tune',
    conjugations: { present: 'tune', presentParticiple: 'tuning', pastSimple: 'tuned', pastParticiple: 'tuned', thirdPerson: 'tunes' },
    category: 'adjustment',
    subcategory: 'pitch',
    description: 'Adjust pitch or intonation',
    synonyms: ['adjust-pitch', 'intonate', 'correct-pitch'],
    antonyms: ['detune', 'leave-out-of-tune'],
    examples: ['tune the notes', 'tune to A440', 'tune the harmony'],
    mappedOpcodes: ['op:tune' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:calibrate' as LexemeId,
    baseForm: 'calibrate',
    conjugations: { present: 'calibrate', presentParticiple: 'calibrating', pastSimple: 'calibrated', pastParticiple: 'calibrated', thirdPerson: 'calibrates' },
    category: 'adjustment',
    subcategory: 'precise',
    description: 'Adjust precisely to standard',
    synonyms: ['fine-tune', 'set-precisely', 'adjust'],
    antonyms: ['leave-uncalibrated'],
    examples: ['calibrate the timing', 'calibrate levels', 'calibrate tuning'],
    mappedOpcodes: ['op:calibrate' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:refine' as LexemeId,
    baseForm: 'refine',
    conjugations: { present: 'refine', presentParticiple: 'refining', pastSimple: 'refined', pastParticiple: 'refined', thirdPerson: 'refines' },
    category: 'adjustment',
    subcategory: 'improvement',
    description: 'Make more precise or elegant',
    synonyms: ['polish', 'perfect', 'improve'],
    antonyms: ['roughen', 'coarsen'],
    examples: ['refine the melody', 'refine the mix', 'refine the timing'],
    mappedOpcodes: ['op:refine' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:polish' as LexemeId,
    baseForm: 'polish',
    conjugations: { present: 'polish', presentParticiple: 'polishing', pastSimple: 'polished', pastParticiple: 'polished', thirdPerson: 'polishes' },
    category: 'adjustment',
    subcategory: 'finishing',
    description: 'Add final refinements',
    synonyms: ['refine', 'perfect', 'finish'],
    antonyms: ['roughen', 'degrade'],
    examples: ['polish the arrangement', 'polish the sound', 'polish the mix'],
    mappedOpcodes: ['op:polish' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:balance' as LexemeId,
    baseForm: 'balance',
    conjugations: { present: 'balance', presentParticiple: 'balancing', pastSimple: 'balanced', pastParticiple: 'balanced', thirdPerson: 'balances' },
    category: 'adjustment',
    subcategory: 'equalization',
    description: 'Adjust relative levels',
    synonyms: ['equilibrate', 'adjust-levels', 'even-out'],
    antonyms: ['unbalance', 'skew'],
    examples: ['balance the mix', 'balance the layers', 'balance harmonically'],
    mappedOpcodes: ['op:balance' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:normalize' as LexemeId,
    baseForm: 'normalize',
    conjugations: { present: 'normalize', presentParticiple: 'normalizing', pastSimple: 'normalized', pastParticiple: 'normalized', thirdPerson: 'normalizes' },
    category: 'adjustment',
    subcategory: 'standardization',
    description: 'Adjust to standard level or form',
    synonyms: ['standardize', 'regularize', 'even-out'],
    antonyms: ['vary', 'deviate'],
    examples: ['normalize the levels', 'normalize dynamics', 'normalize timing'],
    mappedOpcodes: ['op:normalize' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  }
] as const;

// ============================================================================
// All Extended Verbs
// ============================================================================

export const ALL_EXTENDED_VERBS = [
  ...DUPLICATION_VERBS,
  ...COMBINATION_VERBS,
  ...SEPARATION_VERBS,
  ...ADJUSTMENT_VERBS
] as const;

export const EXTENDED_VERB_COUNT = ALL_EXTENDED_VERBS.length;

// ============================================================================
// Statistics
// ============================================================================

/**
 * Total extended verb count by category
 */
export const EXTENDED_VERB_STATS = {
  duplication: DUPLICATION_VERBS.length,    // 7
  combination: COMBINATION_VERBS.length,     // 7
  separation: SEPARATION_VERBS.length,       // 7
  adjustment: ADJUSTMENT_VERBS.length,       // 8
  total: EXTENDED_VERB_COUNT                 // 29
} as const;
