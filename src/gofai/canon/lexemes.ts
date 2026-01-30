/**
 * GOFAI Lexemes — Core Vocabulary Table
 *
 * This module defines the canonical lexeme table — the words and phrases
 * that GOFAI Music+ understands. Each lexeme has a stable ID, semantic
 * binding, and usage information.
 *
 * @module gofai/canon/lexemes
 */

import {
  type Lexeme,
  type LexemeId,
  type VocabularyTable,
  createLexemeId,
  createAxisId,
  createOpcodeId,
  createConstraintTypeId,
  createVocabularyTable,
} from './types';

// =============================================================================
// Verb Lexemes — Action Words
// =============================================================================

const VERB_MAKE: Lexeme = {
  id: createLexemeId('verb', 'make'),
  lemma: 'make',
  variants: ['makes', 'making', 'made'],
  category: 'verb',
  semantics: { type: 'action', opcode: createOpcodeId('change'), role: 'main' },
  description: 'General action verb for causing a change.',
  examples: ['Make it brighter', 'Make the chorus wider'],
};

const VERB_ADD: Lexeme = {
  id: createLexemeId('verb', 'add'),
  lemma: 'add',
  variants: ['adds', 'adding', 'added', 'put', 'insert', 'include'],
  category: 'verb',
  semantics: { type: 'action', opcode: createOpcodeId('add'), role: 'main' },
  description: 'Add something to the arrangement.',
  examples: ['Add reverb', 'Add more energy', 'Put some hats in'],
};

const VERB_REMOVE: Lexeme = {
  id: createLexemeId('verb', 'remove'),
  lemma: 'remove',
  variants: ['removes', 'removing', 'removed', 'delete', 'cut', 'drop', 'take out', 'get rid of'],
  category: 'verb',
  semantics: { type: 'action', opcode: createOpcodeId('remove'), role: 'main' },
  description: 'Remove something from the arrangement.',
  examples: ['Remove the drums', 'Cut the hi-hats', 'Drop the bass for two bars'],
};

const VERB_KEEP: Lexeme = {
  id: createLexemeId('verb', 'keep'),
  lemma: 'keep',
  variants: ['keeps', 'keeping', 'kept', 'preserve', 'maintain', 'retain'],
  category: 'verb',
  semantics: { type: 'constraint', constraintType: createConstraintTypeId('preserve') },
  description: 'Preserve something unchanged.',
  examples: ['Keep the melody', 'Preserve the chords', 'Maintain the rhythm'],
};

const VERB_CHANGE: Lexeme = {
  id: createLexemeId('verb', 'change'),
  lemma: 'change',
  variants: ['changes', 'changing', 'changed', 'modify', 'alter', 'adjust', 'tweak'],
  category: 'verb',
  semantics: { type: 'action', opcode: createOpcodeId('change'), role: 'main' },
  description: 'Modify something.',
  examples: ['Change the tempo', 'Adjust the brightness', 'Tweak the groove'],
};

const VERB_INCREASE: Lexeme = {
  id: createLexemeId('verb', 'increase'),
  lemma: 'increase',
  variants: ['increases', 'increasing', 'increased', 'raise', 'boost', 'turn up', 'crank up'],
  category: 'verb',
  semantics: { type: 'action', opcode: createOpcodeId('increase'), role: 'main' },
  description: 'Increase a value or intensity.',
  examples: ['Increase the energy', 'Raise the tempo', 'Turn up the brightness'],
};

const VERB_DECREASE: Lexeme = {
  id: createLexemeId('verb', 'decrease'),
  lemma: 'decrease',
  variants: ['decreases', 'decreasing', 'decreased', 'lower', 'reduce', 'turn down', 'dial back'],
  category: 'verb',
  semantics: { type: 'action', opcode: createOpcodeId('decrease'), role: 'main' },
  description: 'Decrease a value or intensity.',
  examples: ['Decrease the tempo', 'Lower the energy', 'Dial back the brightness'],
};

const VERB_MOVE: Lexeme = {
  id: createLexemeId('verb', 'move'),
  lemma: 'move',
  variants: ['moves', 'moving', 'moved', 'shift', 'slide', 'push', 'bring'],
  category: 'verb',
  semantics: { type: 'action', opcode: createOpcodeId('move'), role: 'main' },
  description: 'Move something in time or space.',
  examples: ['Move it earlier', 'Shift the drums forward', 'Bring the bridge in sooner'],
};

const VERB_COPY: Lexeme = {
  id: createLexemeId('verb', 'copy'),
  lemma: 'copy',
  variants: ['copies', 'copying', 'copied', 'duplicate', 'clone', 'repeat'],
  category: 'verb',
  semantics: { type: 'action', opcode: createOpcodeId('duplicate'), role: 'main' },
  description: 'Duplicate something.',
  examples: ['Copy the chorus', 'Duplicate this pattern', 'Repeat the hook'],
};

const VERB_UNDO: Lexeme = {
  id: createLexemeId('verb', 'undo'),
  lemma: 'undo',
  variants: ['undoes', 'undoing', 'undid', 'revert', 'rollback', 'go back'],
  category: 'verb',
  semantics: { type: 'action', opcode: createOpcodeId('undo'), role: 'main' },
  description: 'Undo a previous action.',
  examples: ['Undo that', 'Revert the last change', 'Go back to before'],
};

const VERB_REDO: Lexeme = {
  id: createLexemeId('verb', 'redo'),
  lemma: 'redo',
  variants: ['redoes', 'redoing', 'redid'],
  category: 'verb',
  semantics: { type: 'action', opcode: createOpcodeId('redo'), role: 'main' },
  description: 'Redo an undone action.',
  examples: ['Redo that', 'Redo the chorus change'],
};

// =============================================================================
// Adjective Lexemes — Modifiers
// =============================================================================

const ADJ_BRIGHTER: Lexeme = {
  id: createLexemeId('adj', 'bright'),
  lemma: 'bright',
  variants: ['brighter', 'brightest', 'brightness', 'brilliant', 'shimmery', 'sparkly'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('brightness'), direction: 'increase' },
  description: 'Increase brightness (timbral/harmonic).',
  examples: ['Make it brighter', 'More brightness', 'A brighter sound'],
};

const ADJ_DARKER: Lexeme = {
  id: createLexemeId('adj', 'dark'),
  lemma: 'dark',
  variants: ['darker', 'darkest', 'darkness', 'duller', 'muted', 'dim'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('brightness'), direction: 'decrease' },
  description: 'Decrease brightness.',
  examples: ['Make it darker', 'A darker feel', 'More subdued'],
};

const ADJ_WARMER: Lexeme = {
  id: createLexemeId('adj', 'warm'),
  lemma: 'warm',
  variants: ['warmer', 'warmest', 'warmth', 'cozy', 'analog'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('warmth'), direction: 'increase' },
  description: 'Increase warmth.',
  examples: ['Make it warmer', 'More warmth', 'A cozy sound'],
};

const ADJ_COLDER: Lexeme = {
  id: createLexemeId('adj', 'cold'),
  lemma: 'cold',
  variants: ['colder', 'coldest', 'cool', 'sterile', 'clinical', 'digital'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('warmth'), direction: 'decrease' },
  description: 'Decrease warmth.',
  examples: ['Make it colder', 'A cooler feel', 'More sterile'],
};

const ADJ_WIDER: Lexeme = {
  id: createLexemeId('adj', 'wide'),
  lemma: 'wide',
  variants: ['wider', 'widest', 'width', 'spacious', 'expansive', 'spread'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('width'), direction: 'increase' },
  description: 'Increase stereo width.',
  examples: ['Make it wider', 'More width', 'Spread it out'],
};

const ADJ_NARROWER: Lexeme = {
  id: createLexemeId('adj', 'narrow'),
  lemma: 'narrow',
  variants: ['narrower', 'narrowest', 'tight', 'focused', 'centered', 'mono'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('width'), direction: 'decrease' },
  description: 'Decrease stereo width.',
  examples: ['Make it narrower', 'More focused', 'Tighten the stereo image'],
};

const ADJ_TIGHTER: Lexeme = {
  id: createLexemeId('adj', 'tight'),
  lemma: 'tight',
  variants: ['tighter', 'tightest', 'tightness', 'precise', 'locked', 'snapped'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('tightness'), direction: 'increase' },
  description: 'Increase rhythmic tightness.',
  examples: ['Make it tighter', 'Lock it in', 'More precise timing'],
};

const ADJ_LOOSER: Lexeme = {
  id: createLexemeId('adj', 'loose'),
  lemma: 'loose',
  variants: ['looser', 'loosest', 'sloppy', 'relaxed', 'laid-back', 'human'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('tightness'), direction: 'decrease' },
  description: 'Decrease rhythmic tightness.',
  examples: ['Make it looser', 'More relaxed feel', 'Humanize it'],
};

const ADJ_BUSIER: Lexeme = {
  id: createLexemeId('adj', 'busy'),
  lemma: 'busy',
  variants: ['busier', 'busiest', 'complex', 'dense', 'cluttered', 'intricate'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('busyness'), direction: 'increase' },
  description: 'Increase busyness/complexity.',
  examples: ['Make it busier', 'More complex', 'Add more activity'],
};

const ADJ_SIMPLER: Lexeme = {
  id: createLexemeId('adj', 'simple'),
  lemma: 'simple',
  variants: ['simpler', 'simplest', 'sparse', 'minimal', 'clean', 'stripped'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('busyness'), direction: 'decrease' },
  description: 'Decrease busyness/complexity.',
  examples: ['Make it simpler', 'Strip it down', 'Less busy'],
};

const ADJ_ENERGETIC: Lexeme = {
  id: createLexemeId('adj', 'energetic'),
  lemma: 'energetic',
  variants: ['more energetic', 'energy', 'powerful', 'intense', 'driving', 'pumping'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('energy'), direction: 'increase' },
  description: 'Increase energy.',
  examples: ['Make it more energetic', 'More energy', 'Give it more power'],
};

const ADJ_CALMER: Lexeme = {
  id: createLexemeId('adj', 'calm'),
  lemma: 'calm',
  variants: ['calmer', 'calmest', 'relaxed', 'chill', 'mellow', 'subdued', 'gentle'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('energy'), direction: 'decrease' },
  description: 'Decrease energy.',
  examples: ['Make it calmer', 'More relaxed', 'Chill it out'],
};

const ADJ_PUNCHY: Lexeme = {
  id: createLexemeId('adj', 'punchy'),
  lemma: 'punchy',
  variants: ['punchier', 'punchiest', 'punch', 'hard', 'hitting', 'slamming', 'aggressive'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('impact'), direction: 'increase' },
  description: 'Increase impact/punch.',
  examples: ['Make it punchier', 'More punch', 'Hit harder'],
};

const ADJ_SOFTER: Lexeme = {
  id: createLexemeId('adj', 'soft'),
  lemma: 'soft',
  variants: ['softer', 'softest', 'gentle', 'delicate', 'light', 'tender'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('impact'), direction: 'decrease' },
  description: 'Decrease impact.',
  examples: ['Make it softer', 'More gentle', 'Lighter touch'],
};

const ADJ_GROOVY: Lexeme = {
  id: createLexemeId('adj', 'groovy'),
  lemma: 'groovy',
  variants: ['groovier', 'grooviest', 'groove', 'funky', 'swinging', 'bouncy'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('groove'), direction: 'increase' },
  description: 'Increase groove feel.',
  examples: ['Make it groovier', 'More groove', 'Get it swinging'],
};

const ADJ_STRAIGHTER: Lexeme = {
  id: createLexemeId('adj', 'straight'),
  lemma: 'straight',
  variants: ['straighter', 'straightest', 'square', 'mechanical', 'rigid', 'stiff'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('groove'), direction: 'decrease' },
  description: 'Decrease groove feel.',
  examples: ['Make it straighter', 'More mechanical', 'Less swing'],
};

const ADJ_TENSE: Lexeme = {
  id: createLexemeId('adj', 'tense'),
  lemma: 'tense',
  variants: ['tenser', 'tensest', 'tension', 'suspenseful', 'anxious', 'edgy'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('tension'), direction: 'increase' },
  description: 'Increase harmonic/melodic tension.',
  examples: ['Make it more tense', 'Add tension', 'Build suspense'],
};

const ADJ_RESOLVED: Lexeme = {
  id: createLexemeId('adj', 'resolved'),
  lemma: 'resolved',
  variants: ['more resolved', 'relaxed', 'settled', 'stable', 'at rest'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('tension'), direction: 'decrease' },
  description: 'Decrease tension.',
  examples: ['Make it more resolved', 'Resolve the tension', 'Let it rest'],
};

const ADJ_LIFTING: Lexeme = {
  id: createLexemeId('adj', 'lift'),
  lemma: 'lift',
  variants: ['lifting', 'lifted', 'soaring', 'uplifting', 'airy', 'floating'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('lift'), direction: 'increase' },
  description: 'Increase lift/elevation.',
  examples: ['Give it more lift', 'Make it soaring', 'Lift it up'],
};

const ADJ_GROUNDED: Lexeme = {
  id: createLexemeId('adj', 'grounded'),
  lemma: 'grounded',
  variants: ['more grounded', 'heavy', 'weighty', 'anchored', 'rooted'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('lift'), direction: 'decrease' },
  description: 'Decrease lift.',
  examples: ['Make it more grounded', 'Weigh it down', 'Anchor it'],
};

const ADJ_INTIMATE: Lexeme = {
  id: createLexemeId('adj', 'intimate'),
  lemma: 'intimate',
  variants: ['more intimate', 'close', 'personal', 'up-close', 'near'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('intimacy'), direction: 'increase' },
  description: 'Increase intimacy.',
  examples: ['Make it more intimate', 'Bring it closer', 'More personal'],
};

const ADJ_DISTANT: Lexeme = {
  id: createLexemeId('adj', 'distant'),
  lemma: 'distant',
  variants: ['more distant', 'far', 'epic', 'vast', 'spacey'],
  category: 'adj',
  semantics: { type: 'axis_modifier', axis: createAxisId('intimacy'), direction: 'decrease' },
  description: 'Decrease intimacy.',
  examples: ['Make it more distant', 'Push it back', 'More epic'],
};

// =============================================================================
// Adverb Lexemes — Degree Modifiers
// =============================================================================

const ADV_SLIGHTLY: Lexeme = {
  id: createLexemeId('adv', 'slightly'),
  lemma: 'slightly',
  variants: ['a little', 'a bit', 'somewhat', 'a touch', 'marginally'],
  category: 'adv',
  semantics: { type: 'quantity', quantityType: 'degree' },
  description: 'Small degree modifier.',
  examples: ['Slightly brighter', 'A little warmer', 'A bit louder'],
};

const ADV_MUCH: Lexeme = {
  id: createLexemeId('adv', 'much'),
  lemma: 'much',
  variants: ['a lot', 'significantly', 'considerably', 'way'],
  category: 'adv',
  semantics: { type: 'quantity', quantityType: 'degree' },
  description: 'Large degree modifier.',
  examples: ['Much brighter', 'A lot warmer', 'Way louder'],
};

const ADV_MORE: Lexeme = {
  id: createLexemeId('adv', 'more'),
  lemma: 'more',
  variants: ['additional', 'extra', 'further'],
  category: 'adv',
  semantics: { type: 'quantity', quantityType: 'relative' },
  description: 'Comparative increase.',
  examples: ['More energy', 'More lift', 'More of that'],
};

const ADV_LESS: Lexeme = {
  id: createLexemeId('adv', 'less'),
  lemma: 'less',
  variants: ['fewer', 'reduced'],
  category: 'adv',
  semantics: { type: 'quantity', quantityType: 'relative' },
  description: 'Comparative decrease.',
  examples: ['Less busy', 'Less tension', 'Less of that'],
};

// =============================================================================
// Conjunction Lexemes — Coordination
// =============================================================================

const CONJ_AND: Lexeme = {
  id: createLexemeId('conj', 'and'),
  lemma: 'and',
  variants: ['as well as', 'plus', 'along with', 'also'],
  category: 'conj',
  semantics: { type: 'coordination', coordType: 'and' },
  description: 'Conjunction for combining goals.',
  examples: ['Brighter and wider', 'Add energy and lift'],
};

const CONJ_BUT: Lexeme = {
  id: createLexemeId('conj', 'but'),
  lemma: 'but',
  variants: ['however', 'yet', 'except', 'although', 'while'],
  category: 'conj',
  semantics: { type: 'coordination', coordType: 'but' },
  description: 'Contrast conjunction.',
  examples: ['Brighter but not busier', 'More energy but keep the melody'],
};

const CONJ_THEN: Lexeme = {
  id: createLexemeId('conj', 'then'),
  lemma: 'then',
  variants: ['after that', 'next', 'afterwards', 'subsequently'],
  category: 'conj',
  semantics: { type: 'coordination', coordType: 'then' },
  description: 'Sequence conjunction.',
  examples: ['Add drums then make it louder', 'Build the tension then release'],
};

// =============================================================================
// Preposition Lexemes — Scope Markers
// =============================================================================

const PREP_IN: Lexeme = {
  id: createLexemeId('prep', 'in'),
  lemma: 'in',
  variants: ['within', 'inside'],
  category: 'prep',
  semantics: { type: 'scope', scopeType: 'section' },
  description: 'Scope to a section or region.',
  examples: ['In the chorus', 'In verse 2', 'Within this section'],
};

const PREP_ON: Lexeme = {
  id: createLexemeId('prep', 'on'),
  lemma: 'on',
  variants: ['upon'],
  category: 'prep',
  semantics: { type: 'scope', scopeType: 'layer' },
  description: 'Scope to a layer or track.',
  examples: ['On the drums', 'On the bass track'],
};

const PREP_FOR: Lexeme = {
  id: createLexemeId('prep', 'for'),
  lemma: 'for',
  variants: ['during', 'over'],
  category: 'prep',
  semantics: { type: 'scope', scopeType: 'range' },
  description: 'Scope to a time range.',
  examples: ['For two bars', 'During the bridge', 'Over the intro'],
};

const PREP_BEFORE: Lexeme = {
  id: createLexemeId('prep', 'before'),
  lemma: 'before',
  variants: ['prior to', 'ahead of'],
  category: 'prep',
  semantics: { type: 'scope', scopeType: 'range' },
  description: 'Relative time scope.',
  examples: ['Before the chorus', 'Two bars before the drop'],
};

const PREP_AFTER: Lexeme = {
  id: createLexemeId('prep', 'after'),
  lemma: 'after',
  variants: ['following', 'past'],
  category: 'prep',
  semantics: { type: 'scope', scopeType: 'range' },
  description: 'Relative time scope.',
  examples: ['After the intro', 'Right after the drop'],
};

// =============================================================================
// Determiner Lexemes — References
// =============================================================================

const DET_THE: Lexeme = {
  id: createLexemeId('det', 'the'),
  lemma: 'the',
  variants: [],
  category: 'det',
  semantics: { type: 'reference', referenceType: 'anaphoric' },
  description: 'Definite reference.',
  examples: ['The chorus', 'The drums', 'The melody'],
};

const DET_THIS: Lexeme = {
  id: createLexemeId('det', 'this'),
  lemma: 'this',
  variants: ['these'],
  category: 'det',
  semantics: { type: 'reference', referenceType: 'deictic' },
  description: 'Deictic reference (selection).',
  examples: ['This section', 'These notes', 'This part'],
};

const DET_THAT: Lexeme = {
  id: createLexemeId('det', 'that'),
  lemma: 'that',
  variants: ['those'],
  category: 'det',
  semantics: { type: 'reference', referenceType: 'anaphoric' },
  description: 'Anaphoric reference.',
  examples: ['That chorus', 'Those drums', 'That thing we did'],
};

const DET_ALL: Lexeme = {
  id: createLexemeId('det', 'all'),
  lemma: 'all',
  variants: ['every', 'each'],
  category: 'det',
  semantics: { type: 'reference', referenceType: 'generic' },
  description: 'Universal quantifier.',
  examples: ['All choruses', 'Every verse', 'Each track'],
};

// =============================================================================
// Pronoun Lexemes
// =============================================================================

const PRON_IT: Lexeme = {
  id: createLexemeId('det', 'it'),
  lemma: 'it',
  variants: [],
  category: 'det',
  semantics: { type: 'reference', referenceType: 'anaphoric' },
  description: 'Anaphoric pronoun.',
  examples: ['Make it brighter', 'Move it earlier'],
};

const PRON_THEM: Lexeme = {
  id: createLexemeId('det', 'them'),
  lemma: 'them',
  variants: ['they'],
  category: 'det',
  semantics: { type: 'reference', referenceType: 'anaphoric' },
  description: 'Anaphoric plural pronoun.',
  examples: ['Move them earlier', 'Make them louder'],
};

// =============================================================================
// Constraint Lexemes
// =============================================================================

const CONSTR_ONLY: Lexeme = {
  id: createLexemeId('adv', 'only'),
  lemma: 'only',
  variants: ['just', 'exclusively', 'solely'],
  category: 'adv',
  semantics: { type: 'constraint', constraintType: createConstraintTypeId('only_change') },
  description: 'Scope restriction constraint.',
  examples: ['Only change the drums', 'Just the bass', 'Only in the chorus'],
};

const CONSTR_DONT: Lexeme = {
  id: createLexemeId('adv', 'dont'),
  lemma: "don't",
  variants: ['do not', "doesn't", 'does not', 'never', 'no'],
  category: 'adv',
  semantics: { type: 'constraint', constraintType: createConstraintTypeId('preserve') },
  description: 'Negative constraint.',
  examples: ["Don't change the chords", 'No new layers', "Don't touch the melody"],
};

const CONSTR_WITHOUT: Lexeme = {
  id: createLexemeId('prep', 'without'),
  lemma: 'without',
  variants: ['excluding', 'except for'],
  category: 'prep',
  semantics: { type: 'constraint', constraintType: createConstraintTypeId('exclude') },
  description: 'Exclusion constraint.',
  examples: ['Without changing the melody', 'Excluding the drums'],
};

// =============================================================================
// Aggregate Lexeme Lists
// =============================================================================

/**
 * All verb lexemes.
 */
export const VERB_LEXEMES: readonly Lexeme[] = [
  VERB_MAKE,
  VERB_ADD,
  VERB_REMOVE,
  VERB_KEEP,
  VERB_CHANGE,
  VERB_INCREASE,
  VERB_DECREASE,
  VERB_MOVE,
  VERB_COPY,
  VERB_UNDO,
  VERB_REDO,
];

/**
 * All adjective lexemes.
 */
export const ADJ_LEXEMES: readonly Lexeme[] = [
  ADJ_BRIGHTER,
  ADJ_DARKER,
  ADJ_WARMER,
  ADJ_COLDER,
  ADJ_WIDER,
  ADJ_NARROWER,
  ADJ_TIGHTER,
  ADJ_LOOSER,
  ADJ_BUSIER,
  ADJ_SIMPLER,
  ADJ_ENERGETIC,
  ADJ_CALMER,
  ADJ_PUNCHY,
  ADJ_SOFTER,
  ADJ_GROOVY,
  ADJ_STRAIGHTER,
  ADJ_TENSE,
  ADJ_RESOLVED,
  ADJ_LIFTING,
  ADJ_GROUNDED,
  ADJ_INTIMATE,
  ADJ_DISTANT,
];

/**
 * All adverb lexemes.
 */
export const ADV_LEXEMES: readonly Lexeme[] = [
  ADV_SLIGHTLY,
  ADV_MUCH,
  ADV_MORE,
  ADV_LESS,
  CONSTR_ONLY,
  CONSTR_DONT,
];

/**
 * All conjunction lexemes.
 */
export const CONJ_LEXEMES: readonly Lexeme[] = [CONJ_AND, CONJ_BUT, CONJ_THEN];

/**
 * All preposition lexemes.
 */
export const PREP_LEXEMES: readonly Lexeme[] = [
  PREP_IN,
  PREP_ON,
  PREP_FOR,
  PREP_BEFORE,
  PREP_AFTER,
  CONSTR_WITHOUT,
];

/**
 * All determiner lexemes.
 */
export const DET_LEXEMES: readonly Lexeme[] = [
  DET_THE,
  DET_THIS,
  DET_THAT,
  DET_ALL,
  PRON_IT,
  PRON_THEM,
];

/**
 * All core lexemes.
 */
export const CORE_LEXEMES: readonly Lexeme[] = [
  ...VERB_LEXEMES,
  ...ADJ_LEXEMES,
  ...ADV_LEXEMES,
  ...CONJ_LEXEMES,
  ...PREP_LEXEMES,
  ...DET_LEXEMES,
];

// =============================================================================
// Lexeme Table
// =============================================================================

/**
 * Lexeme vocabulary table.
 */
export const LEXEMES_TABLE: VocabularyTable<Lexeme> = createVocabularyTable(CORE_LEXEMES);

// =============================================================================
// Lexeme Utilities
// =============================================================================

/**
 * Get a lexeme by ID.
 */
export function getLexemeById(id: LexemeId): Lexeme | undefined {
  return LEXEMES_TABLE.byId.get(id);
}

/**
 * Get a lexeme by any surface form.
 */
export function getLexemeBySurface(surface: string): Lexeme | undefined {
  return LEXEMES_TABLE.byVariant.get(surface.toLowerCase());
}

/**
 * Get all lexemes in a category.
 */
export function getLexemesByCategory(category: Lexeme['category']): readonly Lexeme[] {
  return CORE_LEXEMES.filter(lex => lex.category === category);
}

/**
 * Check if a surface form is a known lexeme.
 */
export function isKnownLexeme(surface: string): boolean {
  return LEXEMES_TABLE.byVariant.has(surface.toLowerCase());
}

/**
 * Get all surface forms for a lexeme.
 */
export function getAllSurfaceForms(lexeme: Lexeme): readonly string[] {
  return [lexeme.lemma, ...lexeme.variants];
}

/**
 * Normalize a surface form to its canonical lemma.
 */
export function normalizeLexeme(surface: string): string | undefined {
  const lexeme = getLexemeBySurface(surface);
  return lexeme?.lemma;
}
