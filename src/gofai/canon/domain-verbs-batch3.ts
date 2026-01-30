/**
 * @file Domain Verbs - Batch 3: Specialized Musical Actions
 * @module gofai/canon/domain-verbs-batch3
 * 
 * Specialized verb vocabulary for advanced musical operations.
 * Part of Phase 1 vocabulary expansion (Steps 051-100).
 * 
 * This batch adds:
 * - Temporal verbs (stretch, compress, expand, contract, rush, drag)
 * - Dynamic verbs (fade, crescendo, diminuendo, swell, accent, emphasize)
 * - Harmonic verbs (harmonize, reharmonize, modulate, resolve, tonicize)
 * - Rhythmic verbs (quantize, swing, syncopate, groove, humanize)
 * - Textural verbs (thicken, densify, space, distribute, scatter)
 * - Melodic verbs (ornament, smooth, shape, contour, arch)
 * 
 * @see gofai_goalB.md Phase 1
 */

import type { LexemeId, OpcodeId } from './types.js';
import type { VerbLexeme } from './domain-verbs.js';

// ============================================================================
// Temporal Verbs
// ============================================================================

export const TEMPORAL_VERBS: readonly VerbLexeme[] = [
  {
    id: 'lex:verb:stretch' as LexemeId,
    baseForm: 'stretch',
    conjugations: { present: 'stretch', presentParticiple: 'stretching', pastSimple: 'stretched', pastParticiple: 'stretched', thirdPerson: 'stretches' },
    category: 'temporal',
    subcategory: 'expansion',
    description: 'Lengthen in time',
    synonyms: ['lengthen', 'extend', 'elongate'],
    antonyms: ['compress', 'shorten', 'squeeze'],
    examples: ['stretch the section', 'stretch to 8 bars', 'stretch temporally'],
    mappedOpcodes: ['op:time-stretch' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:compress' as LexemeId,
    baseForm: 'compress',
    conjugations: { present: 'compress', presentParticiple: 'compressing', pastSimple: 'compressed', pastParticiple: 'compressed', thirdPerson: 'compresses' },
    category: 'temporal',
    subcategory: 'contraction',
    description: 'Shorten in time',
    synonyms: ['condense', 'shorten', 'contract'],
    antonyms: ['stretch', 'expand', 'lengthen'],
    examples: ['compress the intro', 'compress to half time', 'compress temporally'],
    mappedOpcodes: ['op:time-compress' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:expand' as LexemeId,
    baseForm: 'expand',
    conjugations: { present: 'expand', presentParticiple: 'expanding', pastSimple: 'expanded', pastParticiple: 'expanded', thirdPerson: 'expands' },
    category: 'temporal',
    subcategory: 'growth',
    description: 'Make longer or larger',
    synonyms: ['extend', 'stretch', 'enlarge'],
    antonyms: ['contract', 'shrink', 'reduce'],
    examples: ['expand the chorus', 'expand by 4 bars', 'expand gradually'],
    mappedOpcodes: ['op:expand' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:contract' as LexemeId,
    baseForm: 'contract',
    conjugations: { present: 'contract', presentParticiple: 'contracting', pastSimple: 'contracted', pastParticiple: 'contracted', thirdPerson: 'contracts' },
    category: 'temporal',
    subcategory: 'reduction',
    description: 'Make shorter or smaller',
    synonyms: ['compress', 'shrink', 'reduce'],
    antonyms: ['expand', 'stretch', 'extend'],
    examples: ['contract the verse', 'contract to 2 bars', 'contract gradually'],
    mappedOpcodes: ['op:contract' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:rush' as LexemeId,
    baseForm: 'rush',
    conjugations: { present: 'rush', presentParticiple: 'rushing', pastSimple: 'rushed', pastParticiple: 'rushed', thirdPerson: 'rushes' },
    category: 'temporal',
    subcategory: 'acceleration',
    description: 'Speed up gradually',
    synonyms: ['accelerate', 'speed-up', 'hasten'],
    antonyms: ['drag', 'slow-down', 'decelerate'],
    examples: ['rush into the chorus', 'rush the tempo', 'rush slightly'],
    mappedOpcodes: ['op:accelerando' as OpcodeId],
    requiresObject: false,
    requiresScope: true
  },
  {
    id: 'lex:verb:drag' as LexemeId,
    baseForm: 'drag',
    conjugations: { present: 'drag', presentParticiple: 'dragging', pastSimple: 'dragged', pastParticiple: 'dragged', thirdPerson: 'drags' },
    category: 'temporal',
    subcategory: 'deceleration',
    description: 'Slow down gradually',
    synonyms: ['decelerate', 'slow-down', 'retard'],
    antonyms: ['rush', 'accelerate', 'speed-up'],
    examples: ['drag into the bridge', 'drag the tempo', 'drag slightly'],
    mappedOpcodes: ['op:ritardando' as OpcodeId],
    requiresObject: false,
    requiresScope: true
  },
  {
    id: 'lex:verb:extend' as LexemeId,
    baseForm: 'extend',
    conjugations: { present: 'extend', presentParticiple: 'extending', pastSimple: 'extended', pastParticiple: 'extended', thirdPerson: 'extends' },
    category: 'temporal',
    subcategory: 'prolongation',
    description: 'Make longer',
    synonyms: ['lengthen', 'prolong', 'stretch'],
    antonyms: ['shorten', 'cut', 'truncate'],
    examples: ['extend the outro', 'extend by 8 bars', 'extend the fade'],
    mappedOpcodes: ['op:extend' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:shorten' as LexemeId,
    baseForm: 'shorten',
    conjugations: { present: 'shorten', presentParticiple: 'shortening', pastSimple: 'shortened', pastParticiple: 'shortened', thirdPerson: 'shortens' },
    category: 'temporal',
    subcategory: 'reduction',
    description: 'Make briefer',
    synonyms: ['reduce', 'truncate', 'cut'],
    antonyms: ['extend', 'lengthen', 'prolong'],
    examples: ['shorten the intro', 'shorten by 4 bars', 'shorten the section'],
    mappedOpcodes: ['op:shorten' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  }
] as const;

// ============================================================================
// Dynamic Verbs
// ============================================================================

export const DYNAMIC_VERBS: readonly VerbLexeme[] = [
  {
    id: 'lex:verb:fade' as LexemeId,
    baseForm: 'fade',
    conjugations: { present: 'fade', presentParticiple: 'fading', pastSimple: 'faded', pastParticiple: 'faded', thirdPerson: 'fades' },
    category: 'dynamic',
    subcategory: 'gradual',
    description: 'Gradually change volume',
    synonyms: ['diminish', 'attenuate'],
    antonyms: ['emphasize', 'amplify'],
    examples: ['fade out', 'fade in', 'fade to silence'],
    mappedOpcodes: ['op:fade' as OpcodeId],
    requiresObject: false,
    requiresScope: true
  },
  {
    id: 'lex:verb:crescendo' as LexemeId,
    baseForm: 'crescendo',
    conjugations: { present: 'crescendo', presentParticiple: 'crescendoing', pastSimple: 'crescendoed', pastParticiple: 'crescendoed', thirdPerson: 'crescendos' },
    category: 'dynamic',
    subcategory: 'increase',
    description: 'Gradually get louder',
    synonyms: ['grow', 'swell', 'increase-volume'],
    antonyms: ['diminuendo', 'decrease', 'fade'],
    examples: ['crescendo to forte', 'crescendo over 4 bars', 'build with crescendo'],
    mappedOpcodes: ['op:crescendo' as OpcodeId],
    requiresObject: false,
    requiresScope: true
  },
  {
    id: 'lex:verb:diminuendo' as LexemeId,
    baseForm: 'diminuendo',
    conjugations: { present: 'diminuendo', presentParticiple: 'diminuendoing', pastSimple: 'diminuendoed', pastParticiple: 'diminuendoed', thirdPerson: 'diminuendos' },
    category: 'dynamic',
    subcategory: 'decrease',
    description: 'Gradually get softer',
    synonyms: ['decrescendo', 'fade', 'decrease-volume'],
    antonyms: ['crescendo', 'swell', 'grow'],
    examples: ['diminuendo to piano', 'diminuendo over 2 bars', 'gradual diminuendo'],
    mappedOpcodes: ['op:diminuendo' as OpcodeId],
    requiresObject: false,
    requiresScope: true
  },
  {
    id: 'lex:verb:swell' as LexemeId,
    baseForm: 'swell',
    conjugations: { present: 'swell', presentParticiple: 'swelling', pastSimple: 'swelled', pastParticiple: 'swelled', thirdPerson: 'swells' },
    category: 'dynamic',
    subcategory: 'curve',
    description: 'Increase then decrease volume',
    synonyms: ['crescendo-diminuendo', 'surge'],
    antonyms: ['flatten'],
    examples: ['swell the note', 'add a swell', 'swell dynamically'],
    mappedOpcodes: ['op:swell' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:accent' as LexemeId,
    baseForm: 'accent',
    conjugations: { present: 'accent', presentParticiple: 'accenting', pastSimple: 'accented', pastParticiple: 'accented', thirdPerson: 'accents' },
    category: 'dynamic',
    subcategory: 'emphasis',
    description: 'Emphasize with increased volume',
    synonyms: ['emphasize', 'stress', 'highlight'],
    antonyms: ['de-emphasize', 'soften'],
    examples: ['accent the downbeats', 'accent this note', 'add accents'],
    mappedOpcodes: ['op:accent' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:emphasize' as LexemeId,
    baseForm: 'emphasize',
    conjugations: { present: 'emphasize', presentParticiple: 'emphasizing', pastSimple: 'emphasized', pastParticiple: 'emphasized', thirdPerson: 'emphasizes' },
    category: 'dynamic',
    subcategory: 'prominence',
    description: 'Make more prominent',
    synonyms: ['accent', 'stress', 'highlight', 'bring-out'],
    antonyms: ['de-emphasize', 'downplay'],
    examples: ['emphasize the melody', 'emphasize the rhythm', 'emphasize harmonically'],
    mappedOpcodes: ['op:emphasize' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:amplify' as LexemeId,
    baseForm: 'amplify',
    conjugations: { present: 'amplify', presentParticiple: 'amplifying', pastSimple: 'amplified', pastParticiple: 'amplified', thirdPerson: 'amplifies' },
    category: 'dynamic',
    subcategory: 'increase',
    description: 'Increase volume or intensity',
    synonyms: ['boost', 'increase', 'enhance'],
    antonyms: ['attenuate', 'reduce', 'diminish'],
    examples: ['amplify the bass', 'amplify the signal', 'amplify dynamically'],
    mappedOpcodes: ['op:amplify' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:attenuate' as LexemeId,
    baseForm: 'attenuate',
    conjugations: { present: 'attenuate', presentParticiple: 'attenuating', pastSimple: 'attenuated', pastParticiple: 'attenuated', thirdPerson: 'attenuates' },
    category: 'dynamic',
    subcategory: 'decrease',
    description: 'Reduce volume or intensity',
    synonyms: ['reduce', 'diminish', 'lower'],
    antonyms: ['amplify', 'boost', 'increase'],
    examples: ['attenuate the highs', 'attenuate the signal', 'attenuate gradually'],
    mappedOpcodes: ['op:attenuate' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  }
] as const;

// ============================================================================
// Harmonic Verbs
// ============================================================================

export const HARMONIC_VERBS: readonly VerbLexeme[] = [
  {
    id: 'lex:verb:harmonize' as LexemeId,
    baseForm: 'harmonize',
    conjugations: { present: 'harmonize', presentParticiple: 'harmonizing', pastSimple: 'harmonized', pastParticiple: 'harmonized', thirdPerson: 'harmonizes' },
    category: 'harmonic',
    subcategory: 'basic',
    description: 'Add harmony to',
    synonyms: ['add-harmony', 'voice', 'chord'],
    antonyms: ['unison', 'single-line'],
    examples: ['harmonize the melody', 'harmonize in thirds', 'harmonize richly'],
    mappedOpcodes: ['op:harmonize' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:reharmonize' as LexemeId,
    baseForm: 'reharmonize',
    conjugations: { present: 'reharmonize', presentParticiple: 'reharmonizing', pastSimple: 'reharmonized', pastParticiple: 'reharmonized', thirdPerson: 'reharmonizes' },
    category: 'harmonic',
    subcategory: 'transformation',
    description: 'Change the harmony',
    synonyms: ['re-chord', 'change-harmony', 'substitute-chords'],
    antonyms: ['preserve-harmony'],
    examples: ['reharmonize the progression', 'reharmonize with extensions', 'reharmonize chromatically'],
    mappedOpcodes: ['op:reharmonize' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:modulate' as LexemeId,
    baseForm: 'modulate',
    conjugations: { present: 'modulate', presentParticiple: 'modulating', pastSimple: 'modulated', pastParticiple: 'modulated', thirdPerson: 'modulates' },
    category: 'harmonic',
    subcategory: 'key-change',
    description: 'Change key',
    synonyms: ['change-key', 'transpose-harmonically'],
    antonyms: ['stay-in-key'],
    examples: ['modulate to G', 'modulate up a step', 'modulate smoothly'],
    mappedOpcodes: ['op:modulate' as OpcodeId],
    requiresObject: false,
    requiresScope: true
  },
  {
    id: 'lex:verb:resolve' as LexemeId,
    baseForm: 'resolve',
    conjugations: { present: 'resolve', presentParticiple: 'resolving', pastSimple: 'resolved', pastParticiple: 'resolved', thirdPerson: 'resolves' },
    category: 'harmonic',
    subcategory: 'cadence',
    description: 'Move from tension to rest',
    synonyms: ['cadence', 'conclude', 'settle'],
    antonyms: ['suspend', 'leave-unresolved'],
    examples: ['resolve to tonic', 'resolve the tension', 'resolve harmonically'],
    mappedOpcodes: ['op:resolve' as OpcodeId],
    requiresObject: false,
    requiresScope: true
  },
  {
    id: 'lex:verb:tonicize' as LexemeId,
    baseForm: 'tonicize',
    conjugations: { present: 'tonicize', presentParticiple: 'tonicizing', pastSimple: 'tonicized', pastParticiple: 'tonicized', thirdPerson: 'tonicizes' },
    category: 'harmonic',
    subcategory: 'secondary-dominant',
    description: 'Temporarily treat as tonic',
    synonyms: ['apply-secondary-dominant', 'emphasize-harmonically'],
    antonyms: [],
    examples: ['tonicize the subdominant', 'tonicize briefly', 'add tonicization'],
    mappedOpcodes: ['op:tonicize' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:voice' as LexemeId,
    baseForm: 'voice',
    conjugations: { present: 'voice', presentParticiple: 'voicing', pastSimple: 'voiced', pastParticiple: 'voiced', thirdPerson: 'voices' },
    category: 'harmonic',
    subcategory: 'arrangement',
    description: 'Arrange chord tones',
    synonyms: ['arrange-vertically', 'space-harmonically'],
    antonyms: [],
    examples: ['voice the chords', 'voice in close position', 'revoice openly'],
    mappedOpcodes: ['op:voice' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:revoice' as LexemeId,
    baseForm: 'revoice',
    conjugations: { present: 'revoice', presentParticiple: 'revoicing', pastSimple: 'revoiced', pastParticiple: 'revoiced', thirdPerson: 'revoices' },
    category: 'harmonic',
    subcategory: 'transformation',
    description: 'Change chord voicing',
    synonyms: ['re-arrange', 'respell', 'reposition'],
    antonyms: ['keep-voicing'],
    examples: ['revoice the chords', 'revoice with extensions', 'revoice more openly'],
    mappedOpcodes: ['op:revoice' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  }
] as const;

// ============================================================================
// Rhythmic Verbs
// ============================================================================

export const RHYTHMIC_VERBS: readonly VerbLexeme[] = [
  {
    id: 'lex:verb:quantize' as LexemeId,
    baseForm: 'quantize',
    conjugations: { present: 'quantize', presentParticiple: 'quantizing', pastSimple: 'quantized', pastParticiple: 'quantized', thirdPerson: 'quantizes' },
    category: 'rhythmic',
    subcategory: 'correction',
    description: 'Align to grid',
    synonyms: ['align-to-grid', 'correct-timing', 'snap-to-grid'],
    antonyms: ['humanize', 'randomize-timing'],
    examples: ['quantize to 16ths', 'quantize the drums', 'quantize lightly'],
    mappedOpcodes: ['op:quantize' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:swing' as LexemeId,
    baseForm: 'swing',
    conjugations: { present: 'swing', presentParticiple: 'swinging', pastSimple: 'swung', pastParticiple: 'swung', thirdPerson: 'swings' },
    category: 'rhythmic',
    subcategory: 'feel',
    description: 'Add swing feel',
    synonyms: ['shuffle', 'add-swing', 'tripletize'],
    antonyms: ['straighten', 'even-out'],
    examples: ['swing the eighths', 'swing heavily', 'add swing feel'],
    mappedOpcodes: ['op:swing' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:syncopate' as LexemeId,
    baseForm: 'syncopate',
    conjugations: { present: 'syncopate', presentParticiple: 'syncopating', pastSimple: 'syncopated', pastParticiple: 'syncopated', thirdPerson: 'syncopates' },
    category: 'rhythmic',
    subcategory: 'displacement',
    description: 'Add syncopation',
    synonyms: ['offset-rhythmically', 'displace', 'accent-offbeats'],
    antonyms: ['straighten', 'on-beat'],
    examples: ['syncopate the rhythm', 'syncopate heavily', 'add syncopation'],
    mappedOpcodes: ['op:syncopate' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:groove' as LexemeId,
    baseForm: 'groove',
    conjugations: { present: 'groove', presentParticiple: 'grooving', pastSimple: 'grooved', pastParticiple: 'grooved', thirdPerson: 'grooves' },
    category: 'rhythmic',
    subcategory: 'feel',
    description: 'Add rhythmic feel',
    synonyms: ['add-pocket', 'lock-in', 'feel-good'],
    antonyms: ['stiffen', 'mechanical'],
    examples: ['groove the drums', 'groove harder', 'add groove'],
    mappedOpcodes: ['op:add-groove' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:humanize' as LexemeId,
    baseForm: 'humanize',
    conjugations: { present: 'humanize', presentParticiple: 'humanizing', pastSimple: 'humanized', pastParticiple: 'humanized', thirdPerson: 'humanizes' },
    category: 'rhythmic',
    subcategory: 'variation',
    description: 'Add natural timing variation',
    synonyms: ['add-variation', 'naturalize', 'imperfect'],
    antonyms: ['quantize', 'perfect', 'mechanize'],
    examples: ['humanize the timing', 'humanize slightly', 'add human feel'],
    mappedOpcodes: ['op:humanize' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:shuffle' as LexemeId,
    baseForm: 'shuffle',
    conjugations: { present: 'shuffle', presentParticiple: 'shuffling', pastSimple: 'shuffled', pastParticiple: 'shuffled', thirdPerson: 'shuffles' },
    category: 'rhythmic',
    subcategory: 'feel',
    description: 'Add shuffle rhythm',
    synonyms: ['swing', 'tripletize'],
    antonyms: ['straighten'],
    examples: ['shuffle the beat', 'shuffle the eighths', 'add shuffle'],
    mappedOpcodes: ['op:shuffle' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:displace' as LexemeId,
    baseForm: 'displace',
    conjugations: { present: 'displace', presentParticiple: 'displacing', pastSimple: 'displaced', pastParticiple: 'displaced', thirdPerson: 'displaces' },
    category: 'rhythmic',
    subcategory: 'offset',
    description: 'Shift rhythmic position',
    synonyms: ['offset', 'shift-rhythmically'],
    antonyms: ['align', 'center'],
    examples: ['displace by a sixteenth', 'displace the snare', 'displace rhythmically'],
    mappedOpcodes: ['op:rhythmic-displacement' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  }
] as const;

// ============================================================================
// Textural Verbs
// ============================================================================

export const TEXTURAL_VERBS: readonly VerbLexeme[] = [
  {
    id: 'lex:verb:thicken' as LexemeId,
    baseForm: 'thicken',
    conjugations: { present: 'thicken', presentParticiple: 'thickening', pastSimple: 'thickened', pastParticiple: 'thickened', thirdPerson: 'thickens' },
    category: 'textural',
    subcategory: 'densification',
    description: 'Increase texture density',
    synonyms: ['densify', 'add-layers', 'fill-out'],
    antonyms: ['thin', 'reduce', 'strip'],
    examples: ['thicken the texture', 'thicken with layers', 'thicken the mix'],
    mappedOpcodes: ['op:thicken' as OpcodeId],
    requiresObject: false,
    requiresScope: true
  },
  {
    id: 'lex:verb:densify' as LexemeId,
    baseForm: 'densify',
    conjugations: { present: 'densify', presentParticiple: 'densifying', pastSimple: 'densified', pastParticiple: 'densified', thirdPerson: 'densifies' },
    category: 'textural',
    subcategory: 'densification',
    description: 'Add more notes or events',
    synonyms: ['thicken', 'add-activity', 'fill-in'],
    antonyms: ['thin', 'sparse', 'reduce'],
    examples: ['densify the rhythm', 'densify with notes', 'densify the texture'],
    mappedOpcodes: ['op:densify' as OpcodeId],
    requiresObject: false,
    requiresScope: true
  },
  {
    id: 'lex:verb:space' as LexemeId,
    baseForm: 'space',
    conjugations: { present: 'space', presentParticiple: 'spacing', pastSimple: 'spaced', pastParticiple: 'spaced', thirdPerson: 'spaces' },
    category: 'textural',
    subcategory: 'distribution',
    description: 'Distribute evenly',
    synonyms: ['distribute', 'spread', 'separate'],
    antonyms: ['cluster', 'group', 'bunch'],
    examples: ['space the notes', 'space out the events', 'space evenly'],
    mappedOpcodes: ['op:space' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:distribute' as LexemeId,
    baseForm: 'distribute',
    conjugations: { present: 'distribute', presentParticiple: 'distributing', pastSimple: 'distributed', pastParticiple: 'distributed', thirdPerson: 'distributes' },
    category: 'textural',
    subcategory: 'arrangement',
    description: 'Spread across range',
    synonyms: ['spread', 'disperse', 'scatter'],
    antonyms: ['concentrate', 'cluster'],
    examples: ['distribute across octaves', 'distribute the notes', 'distribute evenly'],
    mappedOpcodes: ['op:distribute' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:scatter' as LexemeId,
    baseForm: 'scatter',
    conjugations: { present: 'scatter', presentParticiple: 'scattering', pastSimple: 'scattered', pastParticiple: 'scattered', thirdPerson: 'scatters' },
    category: 'textural',
    subcategory: 'dispersal',
    description: 'Spread randomly',
    synonyms: ['disperse', 'randomize-position', 'spread'],
    antonyms: ['gather', 'cluster', 'group'],
    examples: ['scatter the notes', 'scatter temporally', 'scatter the rhythm'],
    mappedOpcodes: ['op:scatter' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:cluster' as LexemeId,
    baseForm: 'cluster',
    conjugations: { present: 'cluster', presentParticiple: 'clustering', pastSimple: 'clustered', pastParticiple: 'clustered', thirdPerson: 'clusters' },
    category: 'textural',
    subcategory: 'concentration',
    description: 'Group closely together',
    synonyms: ['group', 'bunch', 'concentrate'],
    antonyms: ['scatter', 'spread', 'disperse'],
    examples: ['cluster the notes', 'cluster harmonically', 'cluster in register'],
    mappedOpcodes: ['op:cluster' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  }
] as const;

// ============================================================================
// Melodic Verbs
// ============================================================================

export const MELODIC_VERBS: readonly VerbLexeme[] = [
  {
    id: 'lex:verb:ornament' as LexemeId,
    baseForm: 'ornament',
    conjugations: { present: 'ornament', presentParticiple: 'ornamenting', pastSimple: 'ornamented', pastParticiple: 'ornamented', thirdPerson: 'ornaments' },
    category: 'melodic',
    subcategory: 'decoration',
    description: 'Add melodic decorations',
    synonyms: ['embellish', 'decorate', 'grace'],
    antonyms: ['simplify', 'strip'],
    examples: ['ornament the melody', 'ornament with trills', 'add ornaments'],
    mappedOpcodes: ['op:add-ornaments' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:smooth' as LexemeId,
    baseForm: 'smooth',
    conjugations: { present: 'smooth', presentParticiple: 'smoothing', pastSimple: 'smoothed', pastParticiple: 'smoothed', thirdPerson: 'smooths' },
    category: 'melodic',
    subcategory: 'contour',
    description: 'Make contour more gradual',
    synonyms: ['legato', 'connect', 'even-out'],
    antonyms: ['jump', 'disjunct'],
    examples: ['smooth the melody', 'smooth the contour', 'smooth out leaps'],
    mappedOpcodes: ['op:smooth-contour' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:shape' as LexemeId,
    baseForm: 'shape',
    conjugations: { present: 'shape', presentParticiple: 'shaping', pastSimple: 'shaped', pastParticiple: 'shaped', thirdPerson: 'shapes' },
    category: 'melodic',
    subcategory: 'sculpting',
    description: 'Form the contour',
    synonyms: ['contour', 'sculpt', 'form'],
    antonyms: ['flatten', 'level'],
    examples: ['shape the phrase', 'shape melodically', 'shape the arc'],
    mappedOpcodes: ['op:shape' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:contour' as LexemeId,
    baseForm: 'contour',
    conjugations: { present: 'contour', presentParticiple: 'contouring', pastSimple: 'contoured', pastParticiple: 'contoured', thirdPerson: 'contours' },
    category: 'melodic',
    subcategory: 'shaping',
    description: 'Define the shape',
    synonyms: ['shape', 'outline', 'profile'],
    antonyms: [],
    examples: ['contour the melody', 'contour upward', 'contour the phrase'],
    mappedOpcodes: ['op:contour' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:arch' as LexemeId,
    baseForm: 'arch',
    conjugations: { present: 'arch', presentParticiple: 'arching', pastSimple: 'arched', pastParticiple: 'arched', thirdPerson: 'arches' },
    category: 'melodic',
    subcategory: 'contour',
    description: 'Create arch-shaped contour',
    synonyms: ['curve', 'rise-and-fall'],
    antonyms: ['flatten', 'level'],
    examples: ['arch the phrase', 'arch to a peak', 'arching melody'],
    mappedOpcodes: ['op:arch-contour' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:descend' as LexemeId,
    baseForm: 'descend',
    conjugations: { present: 'descend', presentParticiple: 'descending', pastSimple: 'descended', pastParticiple: 'descended', thirdPerson: 'descends' },
    category: 'melodic',
    subcategory: 'direction',
    description: 'Move downward',
    synonyms: ['fall', 'drop', 'move-down'],
    antonyms: ['ascend', 'rise', 'climb'],
    examples: ['descend to the tonic', 'descending line', 'descend stepwise'],
    mappedOpcodes: ['op:descend' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  },
  {
    id: 'lex:verb:ascend' as LexemeId,
    baseForm: 'ascend',
    conjugations: { present: 'ascend', presentParticiple: 'ascending', pastSimple: 'ascended', pastParticiple: 'ascended', thirdPerson: 'ascends' },
    category: 'melodic',
    subcategory: 'direction',
    description: 'Move upward',
    synonyms: ['rise', 'climb', 'move-up'],
    antonyms: ['descend', 'fall', 'drop'],
    examples: ['ascend to the fifth', 'ascending line', 'ascend chromatically'],
    mappedOpcodes: ['op:ascend' as OpcodeId],
    requiresObject: true,
    requiresScope: false
  }
] as const;

// ============================================================================
// All Specialized Verbs
// ============================================================================

export const ALL_SPECIALIZED_VERBS = [
  ...TEMPORAL_VERBS,
  ...DYNAMIC_VERBS,
  ...HARMONIC_VERBS,
  ...RHYTHMIC_VERBS,
  ...TEXTURAL_VERBS,
  ...MELODIC_VERBS
] as const;

export const SPECIALIZED_VERB_COUNT = ALL_SPECIALIZED_VERBS.length;

// ============================================================================
// Statistics
// ============================================================================

/**
 * Total specialized verb count by category
 */
export const SPECIALIZED_VERB_STATS = {
  temporal: TEMPORAL_VERBS.length,      // 8
  dynamic: DYNAMIC_VERBS.length,        // 8
  harmonic: HARMONIC_VERBS.length,      // 7
  rhythmic: RHYTHMIC_VERBS.length,      // 7
  textural: TEXTURAL_VERBS.length,      // 6
  melodic: MELODIC_VERBS.length,        // 7
  total: SPECIALIZED_VERB_COUNT         // 43
} as const;
