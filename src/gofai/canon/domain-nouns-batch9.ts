/**
 * GOFAI Domain Nouns — Melody and Melodic Devices (Batch 9)
 *
 * Comprehensive vocabulary for melody, contour, phrase structure, and melodic ornamentation.
 * Enables natural language commands about melodic shape, motion, and development.
 *
 * @module gofai/canon/domain-nouns-batch9
 */

import {
  type Lexeme,
  type LexemeId,
  createLexemeId,
} from './types';

// =============================================================================
// Extended Lexeme Type for Melody Nouns
// =============================================================================

/**
 * Extended lexeme for melody domain nouns.
 */
export interface MelodyLexeme extends Lexeme {
  readonly melodyCategory:
    | 'melodic-element'
    | 'contour'
    | 'motion'
    | 'range'
    | 'phrase-structure'
    | 'ornament'
    | 'articulation'
    | 'melodic-device';
  readonly affects?: 'pitch' | 'rhythm' | 'both';
  readonly typicalContext?: string;
}

// =============================================================================
// Melodic Elements
// =============================================================================

const MELODY: MelodyLexeme = {
  id: createLexemeId('noun', 'melody'),
  lemma: 'melody',
  variants: ['melodies', 'melodic line', 'tune', 'theme'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'layer', role: 'melody' },
  description: 'The primary pitched sequence, the tune.',
  examples: ['Keep the melody', 'Change the melody', 'Add a melody'],
  melodyCategory: 'melodic-element',
  affects: 'both',
  typicalContext: 'Refers to the most prominent pitched voice',
};

const COUNTERMELODY: MelodyLexeme = {
  id: createLexemeId('noun', 'countermelody'),
  lemma: 'countermelody',
  variants: ['counter-melody', 'countermelodies', 'secondary melody', 'obligato'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'layer', role: 'countermelody' },
  description: 'A secondary melody that complements the main melody.',
  examples: ['Add a countermelody', 'Weave in countermelodies', 'Secondary melodic line'],
  melodyCategory: 'melodic-element',
  affects: 'both',
  typicalContext: 'Independent but complementary melodic voice',
};

const LINE: MelodyLexeme = {
  id: createLexemeId('noun', 'line'),
  lemma: 'line',
  variants: ['lines', 'voice', 'voices', 'part', 'parts'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'layer', role: 'any' },
  description: 'A single melodic or harmonic voice.',
  examples: ['The bass line', 'Add a new line', 'Independent lines'],
  melodyCategory: 'melodic-element',
  affects: 'both',
  typicalContext: 'General term for any single voice in polyphony',
};

const BASSLINE: MelodyLexeme = {
  id: createLexemeId('noun', 'bassline'),
  lemma: 'bassline',
  variants: ['bass line', 'bass', 'bass part', 'low line'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'layer', role: 'bass' },
  description: 'The lowest melodic line, providing harmonic foundation.',
  examples: ['Funky bassline', 'Walking bass line', 'Change the bass'],
  melodyCategory: 'melodic-element',
  affects: 'both',
  typicalContext: 'Lowest voice, harmonic and rhythmic foundation',
};

const TOPLINE: MelodyLexeme = {
  id: createLexemeId('noun', 'topline'),
  lemma: 'topline',
  variants: ['top line', 'top voice', 'soprano'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'layer', role: 'melody' },
  description: 'The highest melodic line, usually the melody.',
  examples: ['The topline melody', 'Bright topline', 'Soaring top voice'],
  melodyCategory: 'melodic-element',
  affects: 'both',
  typicalContext: 'Highest voice, typically most prominent',
};

const VOICE_LEADING: MelodyLexeme = {
  id: createLexemeId('noun', 'voice-leading'),
  lemma: 'voice leading',
  variants: ['voice-leading', 'part writing', 'voice motion'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'harmony', aspect: 'voice-motion' },
  description: 'The linear motion of individual voices in harmonic progressions.',
  examples: ['Smooth voice leading', 'Good voice motion', 'Voice leading rules'],
  melodyCategory: 'melodic-device',
  affects: 'pitch',
  typicalContext: 'How chords connect through melodic motion',
};

// =============================================================================
// Contour and Motion
// =============================================================================

const CONTOUR: MelodyLexeme = {
  id: createLexemeId('noun', 'contour'),
  lemma: 'contour',
  variants: ['shape', 'melodic shape', 'curve', 'profile'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'shape' },
  description: 'The overall shape or profile of a melodic line.',
  examples: ['Smooth contour', 'Arch-shaped contour', 'Change the contour'],
  melodyCategory: 'contour',
  affects: 'pitch',
  typicalContext: 'Overall melodic shape (rising, falling, arch, etc.)',
};

const ASCENDING: MelodyLexeme = {
  id: createLexemeId('noun', 'ascent'),
  lemma: 'ascent',
  variants: ['ascending', 'rise', 'rising', 'climb', 'climbing', 'upward motion'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'motion', direction: 'up' },
  description: 'Upward melodic motion.',
  examples: ['Ascending line', 'Rising melody', 'Climb to the high note'],
  melodyCategory: 'motion',
  affects: 'pitch',
  typicalContext: 'Pitches moving upward in sequence',
};

const DESCENDING: MelodyLexeme = {
  id: createLexemeId('noun', 'descent'),
  lemma: 'descent',
  variants: ['descending', 'fall', 'falling', 'drop', 'dropping', 'downward motion'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'motion', direction: 'down' },
  description: 'Downward melodic motion.',
  examples: ['Descending line', 'Falling melody', 'Drop down to the bass'],
  melodyCategory: 'motion',
  affects: 'pitch',
  typicalContext: 'Pitches moving downward in sequence',
};

const STEPWISE: MelodyLexeme = {
  id: createLexemeId('noun', 'stepwise'),
  lemma: 'stepwise',
  variants: ['stepwise motion', 'conjunct', 'conjunct motion', 'steps'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'motion', interval: 'step' },
  description: 'Melodic motion by scale steps (seconds).',
  examples: ['Smooth stepwise motion', 'Conjunct melody', 'Move by steps'],
  melodyCategory: 'motion',
  affects: 'pitch',
  typicalContext: 'Motion by adjacent scale degrees, smooth and singable',
};

const LEAPING: MelodyLexeme = {
  id: createLexemeId('noun', 'leap'),
  lemma: 'leap',
  variants: ['leaps', 'leaping', 'skip', 'skips', 'jump', 'jumps', 'disjunct motion'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'motion', interval: 'leap' },
  description: 'Melodic motion by intervals larger than a second.',
  examples: ['Big leap', 'Melodic skip', 'Disjunct motion'],
  melodyCategory: 'motion',
  affects: 'pitch',
  typicalContext: 'Motion by third or larger, more dramatic',
};

const ARCH: MelodyLexeme = {
  id: createLexemeId('noun', 'arch'),
  lemma: 'arch',
  variants: ['arch shape', 'arch contour', 'inverted arch', 'valley'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'contour', shape: 'arch' },
  description: 'Melodic contour that rises and then falls (or vice versa).',
  examples: ['Arch-shaped phrase', 'Inverted arch contour', 'Classic arch shape'],
  melodyCategory: 'contour',
  affects: 'pitch',
  typicalContext: 'Rise to climax then descend, or valley shape',
};

const WAVE: MelodyLexeme = {
  id: createLexemeId('noun', 'wave'),
  lemma: 'wave',
  variants: ['waves', 'undulating', 'wavelike', 'wavy'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'contour', shape: 'wave' },
  description: 'Melodic contour with repeated rises and falls.',
  examples: ['Wavelike melody', 'Undulating contour', 'Wavy line'],
  melodyCategory: 'contour',
  affects: 'pitch',
  typicalContext: 'Repeated up-and-down motion',
};

const CLIMAX: MelodyLexeme = {
  id: createLexemeId('noun', 'climax'),
  lemma: 'climax',
  variants: ['peak', 'high point', 'apex', 'zenith'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'structure', point: 'climax' },
  description: 'The highest or most intense point in a melody.',
  examples: ['Build to the climax', 'Melodic peak', 'High point of the phrase'],
  melodyCategory: 'phrase-structure',
  affects: 'both',
  typicalContext: 'Point of maximum tension or height',
};

// =============================================================================
// Range and Register
// =============================================================================

const RANGE: MelodyLexeme = {
  id: createLexemeId('noun', 'range'),
  lemma: 'range',
  variants: ['compass', 'tessitura', 'span'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'range' },
  description: 'The distance between highest and lowest pitches.',
  examples: ['Narrow range', 'Wide melodic range', 'Expand the range'],
  melodyCategory: 'range',
  affects: 'pitch',
  typicalContext: 'Interval from lowest to highest note',
};

const REGISTER: MelodyLexeme = {
  id: createLexemeId('noun', 'register'),
  lemma: 'register',
  variants: ['registers', 'pitch register', 'octave'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'register' },
  description: 'The general pitch height (low, middle, high).',
  examples: ['Higher register', 'Low register', 'Change the register'],
  melodyCategory: 'range',
  affects: 'pitch',
  typicalContext: 'Relative pitch height in overall range',
};

const TESSITURA: MelodyLexeme = {
  id: createLexemeId('noun', 'tessitura'),
  lemma: 'tessitura',
  variants: ['average register', 'typical range'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'tessitura' },
  description: 'The most comfortable or frequently used pitch range.',
  examples: ['High tessitura', 'Comfortable tessitura', 'Change the tessitura'],
  melodyCategory: 'range',
  affects: 'pitch',
  typicalContext: 'Where most notes lie, not extremes',
};

const HIGH_NOTE: MelodyLexeme = {
  id: createLexemeId('noun', 'high-note'),
  lemma: 'high note',
  variants: ['high notes', 'top note', 'peak note'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'note', register: 'high' },
  description: 'A note in the upper range.',
  examples: ['Hit the high note', 'Soaring high notes', 'Top note of the phrase'],
  melodyCategory: 'range',
  affects: 'pitch',
  typicalContext: 'Notes in the upper register',
};

const LOW_NOTE: MelodyLexeme = {
  id: createLexemeId('noun', 'low-note'),
  lemma: 'low note',
  variants: ['low notes', 'bottom note', 'deep note'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'note', register: 'low' },
  description: 'A note in the lower range.',
  examples: ['Drop to the low note', 'Deep low notes', 'Bottom of the range'],
  melodyCategory: 'range',
  affects: 'pitch',
  typicalContext: 'Notes in the lower register',
};

// =============================================================================
// Phrase Structure
// =============================================================================

const PHRASE: MelodyLexeme = {
  id: createLexemeId('noun', 'phrase'),
  lemma: 'phrase',
  variants: ['phrases', 'melodic phrase', 'musical phrase'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'structural-unit', level: 'phrase' },
  description: 'A complete musical thought, like a sentence in language.',
  examples: ['First phrase', 'Four-bar phrase', 'Phrase structure'],
  melodyCategory: 'phrase-structure',
  affects: 'both',
  typicalContext: 'Typically 2-8 bars, complete melodic statement',
};

const PERIOD: MelodyLexeme = {
  id: createLexemeId('noun', 'period'),
  lemma: 'period',
  variants: ['periods', 'sentence', 'musical period'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'structural-unit', level: 'period' },
  description: 'Two or more phrases forming a complete unit (antecedent + consequent).',
  examples: ['Eight-bar period', 'Antecedent-consequent period', 'Period structure'],
  melodyCategory: 'phrase-structure',
  affects: 'both',
  typicalContext: 'Typically 8-16 bars, question-answer structure',
};

const ANTECEDENT: MelodyLexeme = {
  id: createLexemeId('noun', 'antecedent'),
  lemma: 'antecedent',
  variants: ['question phrase', 'opening phrase'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'structural-unit', role: 'antecedent' },
  description: 'The first phrase in a period, typically ending with open cadence.',
  examples: ['Antecedent phrase', 'Question phrase', 'Opening statement'],
  melodyCategory: 'phrase-structure',
  affects: 'both',
  typicalContext: 'First phrase, creates expectation for answer',
};

const CONSEQUENT: MelodyLexeme = {
  id: createLexemeId('noun', 'consequent'),
  lemma: 'consequent',
  variants: ['answer phrase', 'concluding phrase'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'structural-unit', role: 'consequent' },
  description: 'The second phrase in a period, typically ending with closed cadence.',
  examples: ['Consequent phrase', 'Answer phrase', 'Resolving statement'],
  melodyCategory: 'phrase-structure',
  affects: 'both',
  typicalContext: 'Second phrase, resolves antecedent',
};

const ANACRUSIS: MelodyLexeme = {
  id: createLexemeId('noun', 'anacrusis'),
  lemma: 'anacrusis',
  variants: ['pickup', 'upbeat', 'pickup notes'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'melodic-device', timing: 'pre-downbeat' },
  description: 'Notes that precede the first downbeat of a phrase.',
  examples: ['Add a pickup', 'Anacrusis notes', 'Upbeat before the phrase'],
  melodyCategory: 'phrase-structure',
  affects: 'both',
  typicalContext: 'Lead-in notes before the strong beat',
};

// =============================================================================
// Ornaments
// =============================================================================

const TRILL: MelodyLexeme = {
  id: createLexemeId('noun', 'trill'),
  lemma: 'trill',
  variants: ['trills', 'trilling', 'rapid alternation'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'ornament', ornamnetType: 'trill' },
  description: 'Rapid alternation between two adjacent pitches.',
  examples: ['Add a trill', 'Ornamental trill', 'Trill on the high note'],
  melodyCategory: 'ornament',
  affects: 'both',
  typicalContext: 'Baroque and classical embellishment',
};

const MORDENT: MelodyLexeme = {
  id: createLexemeId('noun', 'mordent'),
  lemma: 'mordent',
  variants: ['mordents', 'inverted mordent', 'upper mordent'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'ornament', ornamentType: 'mordent' },
  description: 'Quick ornament with main note, adjacent note, and return.',
  examples: ['Add a mordent', 'Upper mordent ornament', 'Quick mordent'],
  melodyCategory: 'ornament',
  affects: 'both',
  typicalContext: 'Classical embellishment, single quick neighbor',
};

const TURN: MelodyLexeme = {
  id: createLexemeId('noun', 'turn'),
  lemma: 'turn',
  variants: ['turns', 'gruppetto'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'ornament', ornamentType: 'turn' },
  description: 'Ornament circling around the main note (upper, main, lower, main).',
  examples: ['Add a turn', 'Gruppetto ornament', 'Turn around the note'],
  melodyCategory: 'ornament',
  affects: 'both',
  typicalContext: 'Four-note ornament circling the main pitch',
};

const GRACE_NOTE: MelodyLexeme = {
  id: createLexemeId('noun', 'grace-note'),
  lemma: 'grace note',
  variants: ['grace notes', 'acciaccatura', 'appoggiatura'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'ornament', ornamentType: 'grace-note' },
  description: 'Quick ornamental note before a main note, usually not counted in the beat.',
  examples: ['Add grace notes', 'Quick grace note', 'Appoggiatura ornament'],
  melodyCategory: 'ornament',
  affects: 'both',
  typicalContext: 'Crushed or leaned ornamental note',
};

const GLISSANDO: MelodyLexeme = {
  id: createLexemeId('noun', 'glissando'),
  lemma: 'glissando',
  variants: ['gliss', 'glissandos', 'slide', 'portamento'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'ornament', ornamentType: 'glissando' },
  description: 'Continuous slide between two pitches.',
  examples: ['Add a glissando', 'Smooth slide', 'Piano gliss'],
  melodyCategory: 'ornament',
  affects: 'pitch',
  typicalContext: 'Continuous pitch bend or slide',
};

const VIBRATO: MelodyLexeme = {
  id: createLexemeId('noun', 'vibrato'),
  lemma: 'vibrato',
  variants: ['tremolo (pitch)', 'pitch modulation'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'ornament', ornamentType: 'vibrato' },
  description: 'Slight periodic variation in pitch.',
  examples: ['Add vibrato', 'Wide vibrato', 'Natural vibrato'],
  melodyCategory: 'ornament',
  affects: 'pitch',
  typicalContext: 'Expressive pitch oscillation',
};

// =============================================================================
// Melodic Devices
// =============================================================================

const SEQUENCE: MelodyLexeme = {
  id: createLexemeId('noun', 'sequence'),
  lemma: 'sequence',
  variants: ['sequences', 'sequential pattern', 'sequential repetition'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'sequence' },
  description: 'A melodic pattern repeated at different pitch levels.',
  examples: ['Melodic sequence', 'Sequence up by step', 'Sequential pattern'],
  melodyCategory: 'melodic-device',
  affects: 'both',
  typicalContext: 'Transposed repetition of a motif',
};

const IMITATION: MelodyLexeme = {
  id: createLexemeId('noun', 'imitation'),
  lemma: 'imitation',
  variants: ['imitative', 'echo', 'echoing'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'imitation' },
  description: 'One voice repeating material introduced by another voice.',
  examples: ['Imitative texture', 'Echo the melody', 'Voice imitation'],
  melodyCategory: 'melodic-device',
  affects: 'both',
  typicalContext: 'Contrapuntal technique, voices enter successively',
};

const INVERSION: MelodyLexeme = {
  id: createLexemeId('noun', 'inversion'),
  lemma: 'inversion',
  variants: ['inverted', 'melodic inversion', 'mirror'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'inversion' },
  description: 'Melodic pattern with intervals inverted (up becomes down, vice versa).',
  examples: ['Melodic inversion', 'Mirror the melody', 'Inverted contour'],
  melodyCategory: 'melodic-device',
  affects: 'pitch',
  typicalContext: 'Intervals reversed in direction',
};

const RETROGRADE: MelodyLexeme = {
  id: createLexemeId('noun', 'retrograde'),
  lemma: 'retrograde',
  variants: ['backwards', 'reversed', 'crab canon'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'retrograde' },
  description: 'Melodic pattern played in reverse order.',
  examples: ['Retrograde melody', 'Play it backwards', 'Crab canon'],
  melodyCategory: 'melodic-device',
  affects: 'rhythm',
  typicalContext: 'Time reversal, last note becomes first',
};

const AUGMENTATION: MelodyLexeme = {
  id: createLexemeId('noun', 'augmentation'),
  lemma: 'augmentation',
  variants: ['augmented', 'slower', 'stretched'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'augmentation' },
  description: 'Melodic pattern with note values lengthened proportionally.',
  examples: ['Augmented theme', 'Stretch the rhythm', 'Slower version'],
  melodyCategory: 'melodic-device',
  affects: 'rhythm',
  typicalContext: 'All durations multiplied by a factor',
};

const DIMINUTION: MelodyLexeme = {
  id: createLexemeId('noun', 'diminution'),
  lemma: 'diminution',
  variants: ['diminished', 'faster', 'compressed'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'diminution' },
  description: 'Melodic pattern with note values shortened proportionally.',
  examples: ['Diminished theme', 'Faster version', 'Compressed rhythm'],
  melodyCategory: 'melodic-device',
  affects: 'rhythm',
  typicalContext: 'All durations divided by a factor',
};

const EMBELLISHMENT: MelodyLexeme = {
  id: createLexemeId('noun', 'embellishment'),
  lemma: 'embellishment',
  variants: ['embellishments', 'decoration', 'ornamentation', 'flourish'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'embellishment' },
  description: 'Decorative additions to a melodic line.',
  examples: ['Add embellishments', 'Ornamental flourishes', 'Decorated melody'],
  melodyCategory: 'melodic-device',
  affects: 'both',
  typicalContext: 'Non-structural decorative notes',
};

const PASSING_TONE: MelodyLexeme = {
  id: createLexemeId('noun', 'passing-tone'),
  lemma: 'passing tone',
  variants: ['passing tones', 'passing note', 'passing notes'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'non-chord-tone', deviceType: 'passing' },
  description: 'Non-chord tone that passes stepwise between two chord tones.',
  examples: ['Add passing tones', 'Chromatic passing note', 'Stepwise passing motion'],
  melodyCategory: 'melodic-device',
  affects: 'pitch',
  typicalContext: 'Fills melodic space between chord tones',
};

const NEIGHBOR_TONE: MelodyLexeme = {
  id: createLexemeId('noun', 'neighbor-tone'),
  lemma: 'neighbor tone',
  variants: ['neighbor tones', 'auxiliary note', 'neighboring note'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'non-chord-tone', deviceType: 'neighbor' },
  description: 'Non-chord tone a step above or below a chord tone, returning to it.',
  examples: ['Upper neighbor', 'Lower neighbor tone', 'Auxiliary note'],
  melodyCategory: 'melodic-device',
  affects: 'pitch',
  typicalContext: 'Decorates chord tone by stepping away and back',
};

const ESCAPE_TONE: MelodyLexeme = {
  id: createLexemeId('noun', 'escape-tone'),
  lemma: 'escape tone',
  variants: ['escape tones', 'echappée', 'escape note'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'non-chord-tone', deviceType: 'escape' },
  description: 'Non-chord tone approached by step and left by leap.',
  examples: ['Escape tone figure', 'Echappée ornament', 'Step-leap escape'],
  melodyCategory: 'melodic-device',
  affects: 'pitch',
  typicalContext: 'Decorates by escaping in opposite direction',
};

const ANTICIPATION: MelodyLexeme = {
  id: createLexemeId('noun', 'anticipation'),
  lemma: 'anticipation',
  variants: ['anticipations', 'anticipated note'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'non-chord-tone', deviceType: 'anticipation' },
  description: 'Note from the next chord sounded early in the current chord.',
  examples: ['Anticipation of the tonic', 'Anticipated resolution', 'Early arrival'],
  melodyCategory: 'melodic-device',
  affects: 'pitch',
  typicalContext: 'Next chord tone arrives early',
};

const SUSPENSION: MelodyLexeme = {
  id: createLexemeId('noun', 'suspension'),
  lemma: 'suspension',
  variants: ['suspensions', 'suspended note', 'held note'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'non-chord-tone', deviceType: 'suspension' },
  description: 'Note from previous chord held over into next chord, then resolved down.',
  examples: ['4-3 suspension', 'Suspended seventh', 'Suspension chain'],
  melodyCategory: 'melodic-device',
  affects: 'pitch',
  typicalContext: 'Preparation, suspension, resolution pattern',
};

const RETARDATION: MelodyLexeme = {
  id: createLexemeId('noun', 'retardation'),
  lemma: 'retardation',
  variants: ['retardations', 'upward resolution'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'melody', aspect: 'non-chord-tone', deviceType: 'retardation' },
  description: 'Like suspension but resolves upward instead of downward.',
  examples: ['Retardation figure', 'Upward resolving suspension', '7-8 retardation'],
  melodyCategory: 'melodic-device',
  affects: 'pitch',
  typicalContext: 'Suspension variant with ascending resolution',
};

const PEDAL_POINT: MelodyLexeme = {
  id: createLexemeId('noun', 'pedal-point'),
  lemma: 'pedal point',
  variants: ['pedal', 'pedal tone', 'drone', 'sustained note'],
  category: 'noun',
  semantics: { type: 'concept', domain: 'harmony', aspect: 'pedal-point' },
  description: 'Sustained or repeated note (usually in bass) while harmonies change above.',
  examples: ['Tonic pedal', 'Dominant pedal point', 'Pedal on the bass'],
  melodyCategory: 'melodic-device',
  affects: 'pitch',
  typicalContext: 'Sustained bass note under changing harmony',
};

// Export all lexemes
export const MELODY_LEXEMES: readonly MelodyLexeme[] = [
  // Melodic elements (6)
  MELODY, COUNTERMELODY, LINE, BASSLINE, TOPLINE, VOICE_LEADING,
  
  // Contour and motion (7)
  CONTOUR, ASCENDING, DESCENDING, STEPWISE, LEAPING, ARCH, WAVE, CLIMAX,
  
  // Range and register (5)
  RANGE, REGISTER, TESSITURA, HIGH_NOTE, LOW_NOTE,
  
  // Phrase structure (5)
  PHRASE, PERIOD, ANTECEDENT, CONSEQUENT, ANACRUSIS,
  
  // Ornaments (6)
  TRILL, MORDENT, TURN, GRACE_NOTE, GLISSANDO, VIBRATO,
  
  // Melodic devices (13)
  SEQUENCE, IMITATION, INVERSION, RETROGRADE, AUGMENTATION, DIMINUTION,
  EMBELLISHMENT, PASSING_TONE, NEIGHBOR_TONE, ESCAPE_TONE, ANTICIPATION,
  SUSPENSION, RETARDATION, PEDAL_POINT,
] as const;

// Helper functions
export function getMelodyElementByName(name: string): MelodyLexeme | undefined {
  return MELODY_LEXEMES.find(
    lex => lex.lemma.toLowerCase() === name.toLowerCase() ||
           lex.variants.some(v => v.toLowerCase() === name.toLowerCase())
  );
}

export function getMelodiesByCategory(category: MelodyLexeme['melodyCategory']): readonly MelodyLexeme[] {
  return MELODY_LEXEMES.filter(lex => lex.melodyCategory === category);
}

export function getOrnaments(): readonly MelodyLexeme[] {
  return MELODY_LEXEMES.filter(lex => lex.melodyCategory === 'ornament');
}

export function getMelodicDevices(): readonly MelodyLexeme[] {
  return MELODY_LEXEMES.filter(lex => lex.melodyCategory === 'melodic-device');
}

export function getNonChordTones(): readonly MelodyLexeme[] {
  return MELODY_LEXEMES.filter(
    lex => lex.semantics.type === 'concept' && 
           lex.semantics.device === 'non-chord-tone'
  );
}

/**
 * Vocabulary summary statistics.
 */
export const MELODY_STATS = {
  totalLexemes: MELODY_LEXEMES.length,
  melodicElements: 6,
  contourMotion: 8,
  rangeRegister: 5,
  phraseStructure: 5,
  ornaments: 6,
  melodicDevices: 13,
  nonChordTones: 7,
} as const;
