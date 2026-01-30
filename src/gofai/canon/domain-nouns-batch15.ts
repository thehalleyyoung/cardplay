/**
 * GOFAI Domain Nouns — Batch 15: Vocals and Songwriting
 *
 * Terms related to vocal production, lyrics, songwriting, and vocal techniques.
 *
 * @module gofai/canon/domain-nouns-batch15
 */

import type { DomainNoun } from './types';

// =============================================================================
// Vocal Techniques
// =============================================================================

const VIBRATO: DomainNoun = {
  id: 'noun:vibrato',
  term: 'vibrato',
  variants: ['vocal vibrato', 'pitch oscillation', 'tremolo'],
  category: 'technique',
  definition: 'Rhythmic variation of pitch in singing',
  semantics: {
    type: 'technique',
    domain: 'vocals',
    device: 'pitch_modulation',
  },
  examples: [
    'Add more vibrato to the vocal',
    'The vibrato is too fast',
    'Reduce vibrato for a straighter tone',
  ],
};

const BELTING: DomainNoun = {
  id: 'noun:belting',
  term: 'belting',
  variants: ['belt', 'powerful singing', 'chest voice'],
  category: 'technique',
  definition: 'A powerful, resonant vocal technique',
  semantics: {
    type: 'technique',
    domain: 'vocals',
    device: 'vocal_power',
  },
  examples: [
    'The chorus needs more belting',
    'Pull back from belting in the verse',
    'Add belting for climax',
  ],
};

const FALSETTO: DomainNoun = {
  id: 'noun:falsetto',
  term: 'falsetto',
  variants: ['head voice', 'upper register', 'light voice'],
  category: 'technique',
  definition: 'A high, light vocal register',
  semantics: {
    type: 'technique',
    domain: 'vocals',
    device: 'register_shift',
  },
  examples: [
    'Use falsetto for the high notes',
    'The falsetto is too breathy',
    'Add falsetto harmonies',
  ],
};

const MELISMA: DomainNoun = {
  id: 'noun:melisma',
  term: 'melisma',
  variants: ['melismatic', 'vocal runs', 'riff'],
  category: 'technique',
  definition: 'Singing multiple notes on a single syllable',
  semantics: {
    type: 'technique',
    domain: 'vocals',
    device: 'syllabic_extension',
  },
  examples: [
    'Add melisma to embellish',
    'The melisma is too ornate',
    'Simplify the melismatic runs',
  ],
};

const BREATH_CONTROL: DomainNoun = {
  id: 'noun:breath_control',
  term: 'breath control',
  variants: ['breathing', 'breath support', 'phrasing'],
  category: 'technique',
  definition: 'Management of breath for sustained singing',
  semantics: {
    type: 'concept',
    domain: 'vocals',
    aspect: 'air_management',
  },
  examples: [
    'Improve breath control in long phrases',
    'The breath control is inconsistent',
    'Add breath marks for phrasing',
  ],
};

const VOCAL_FRY: DomainNoun = {
  id: 'noun:vocal_fry',
  term: 'vocal fry',
  variants: ['fry', 'creaky voice', 'glottal fry'],
  category: 'technique',
  definition: 'A low, creaky vocal quality',
  semantics: {
    type: 'technique',
    domain: 'vocals',
    device: 'register_effect',
  },
  examples: [
    'Add vocal fry for texture',
    'The vocal fry is too prominent',
    'Use vocal fry sparingly',
  ],
};

const RIFF: DomainNoun = {
  id: 'noun:vocal_riff',
  term: 'riff',
  variants: ['vocal riff', 'run', 'vocal ornamentation'],
  category: 'technique',
  definition: 'A short, improvisatory melodic phrase',
  semantics: {
    type: 'concept',
    domain: 'vocals',
    aspect: 'melodic_embellishment',
  },
  examples: [
    'Add a riff at the cadence',
    'The riff is too complex',
    'Simplify the vocal riffs',
  ],
};

const SCOOP: DomainNoun = {
  id: 'noun:scoop',
  term: 'scoop',
  variants: ['scooping', 'pitch slide', 'portamento'],
  category: 'technique',
  definition: 'Sliding up to a note from below',
  semantics: {
    type: 'technique',
    domain: 'vocals',
    device: 'pitch_approach',
  },
  examples: [
    'Reduce the scooping',
    'Add subtle scoops for style',
    'The scoop is too exaggerated',
  ],
};

const VOCAL_BREAK: DomainNoun = {
  id: 'noun:vocal_break',
  term: 'vocal break',
  variants: ['break', 'register break', 'passaggio'],
  category: 'concept',
  definition: 'The transition point between vocal registers',
  semantics: {
    type: 'concept',
    domain: 'vocals',
    aspect: 'register_transition',
  },
  examples: [
    'Smooth the vocal break',
    'The break is too obvious',
    'Work around the vocal break',
  ],
};

const DICTION: DomainNoun = {
  id: 'noun:diction',
  term: 'diction',
  variants: ['articulation', 'enunciation', 'clarity'],
  category: 'concept',
  definition: 'The clarity and precision of lyric pronunciation',
  semantics: {
    type: 'concept',
    domain: 'vocals',
    aspect: 'articulation',
  },
  examples: [
    'Improve diction in the chorus',
    'The diction is too precise',
    'Loosen the diction for style',
  ],
};

// =============================================================================
// Vocal Arrangements
// =============================================================================

const HARMONY: DomainNoun = {
  id: 'noun:vocal_harmony',
  term: 'harmony',
  variants: ['vocal harmony', 'backing vocals', 'harmonies'],
  category: 'arrangement',
  definition: 'Additional vocal parts supporting the lead melody',
  semantics: {
    type: 'entity',
    domain: 'vocals',
    entityType: 'vocal_layer',
  },
  examples: [
    'Add harmonies in the chorus',
    'The harmony is too loud',
    'Tighten the harmony stack',
  ],
};

const DOUBLING: DomainNoun = {
  id: 'noun:vocal_doubling',
  term: 'doubling',
  variants: ['double tracking', 'ADT', 'vocal double'],
  category: 'technique',
  definition: 'Recording the same part multiple times for thickness',
  semantics: {
    type: 'technique',
    domain: 'vocals',
    device: 'layering',
  },
  examples: [
    'Add vocal doubling',
    'The doubling is too loose',
    'Tighten the double timing',
  ],
};

const STACKING: DomainNoun = {
  id: 'noun:vocal_stacking',
  term: 'stacking',
  variants: ['stacked vocals', 'vocal layers', 'thick vocals'],
  category: 'technique',
  definition: 'Layering multiple vocal takes for a fuller sound',
  semantics: {
    type: 'technique',
    domain: 'vocals',
    device: 'additive_layering',
  },
  examples: [
    'Stack the vocals in the hook',
    'The stacking is too dense',
    'Add more vocal stacking',
  ],
};

const CALL_RESPONSE: DomainNoun = {
  id: 'noun:call_response',
  term: 'call and response',
  variants: ['call-response', 'answer', 'vocal dialogue'],
  category: 'arrangement',
  definition: 'Alternating vocal phrases between lead and backing',
  semantics: {
    type: 'technique',
    domain: 'vocals',
    device: 'dialogic_arrangement',
  },
  examples: [
    'Add call and response',
    'The call and response is too predictable',
    'Vary the response pattern',
  ],
};

const AD_LIB: DomainNoun = {
  id: 'noun:ad_lib',
  term: 'ad-lib',
  variants: ['ad lib', 'vocal ad-lib', 'improvisation'],
  category: 'arrangement',
  definition: 'Improvised vocal phrases and embellishments',
  semantics: {
    type: 'concept',
    domain: 'vocals',
    aspect: 'improvisation',
  },
  examples: [
    'Add ad-libs in the outro',
    'The ad-libs are too busy',
    'Layer subtle ad-libs',
  ],
};

// =============================================================================
// Vocal Production
// =============================================================================

const COMPING: DomainNoun = {
  id: 'noun:comping',
  term: 'comping',
  variants: ['vocal comping', 'comp', 'compilation'],
  category: 'production',
  definition: 'Selecting the best parts from multiple vocal takes',
  semantics: {
    type: 'technique',
    domain: 'production',
    device: 'take_compilation',
  },
  examples: [
    'Finish comping the lead vocal',
    'The comping has timing issues',
    'Tighten the comped performance',
  ],
};

const TUNING: DomainNoun = {
  id: 'noun:vocal_tuning',
  term: 'tuning',
  variants: ['pitch correction', 'vocal tuning', 'intonation correction'],
  category: 'production',
  definition: 'Correcting or adjusting vocal pitch',
  semantics: {
    type: 'technique',
    domain: 'production',
    device: 'pitch_editing',
  },
  examples: [
    'Tune the lead vocal',
    'The tuning is too obvious',
    'Use subtle pitch correction',
  ],
};

const DE_ESSING: DomainNoun = {
  id: 'noun:de_essing',
  term: 'de-essing',
  variants: ['de-esser', 'sibilance control', 'S reduction'],
  category: 'production',
  definition: 'Reducing harsh sibilant frequencies',
  semantics: {
    type: 'technique',
    domain: 'production',
    device: 'frequency_control',
  },
  examples: [
    'Add de-essing to the vocal',
    'The de-esser is too aggressive',
    'Reduce sibilance gently',
  ],
};

const VOCAL_CHAIN: DomainNoun = {
  id: 'noun:vocal_chain',
  term: 'vocal chain',
  variants: ['processing chain', 'effects chain', 'signal chain'],
  category: 'production',
  definition: 'The series of processors applied to vocals',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'signal_processing',
  },
  examples: [
    'Simplify the vocal chain',
    'The vocal chain is too heavy',
    'Add warmth to the chain',
  ],
};

const BREATH: DomainNoun = {
  id: 'noun:breath',
  term: 'breath',
  variants: ['breaths', 'breathing sounds', 'inhales'],
  category: 'production',
  definition: 'Audible breathing sounds in vocal recordings',
  semantics: {
    type: 'entity',
    domain: 'vocals',
    entityType: 'performance_artifact',
  },
  examples: [
    'Remove the breaths',
    'Keep some breaths for naturalness',
    'The breaths are too loud',
  ],
};

// =============================================================================
// Songwriting Terms
// =============================================================================

const HOOK: DomainNoun = {
  id: 'noun:hook',
  term: 'hook',
  variants: ['catchy phrase', 'memorable line', 'earworm'],
  category: 'songwriting',
  definition: 'A memorable musical or lyrical phrase',
  semantics: {
    type: 'concept',
    domain: 'songwriting',
    aspect: 'memorability',
  },
  examples: [
    'Strengthen the hook',
    'The hook isn't catchy enough',
    'Add a pre-hook',
  ],
};

const VERSE: DomainNoun = {
  id: 'noun:verse',
  term: 'verse',
  variants: ['verses', 'first verse', 'second verse'],
  category: 'form',
  definition: 'A repeated section with changing lyrics',
  semantics: {
    type: 'entity',
    domain: 'form',
    entityType: 'section',
  },
  examples: [
    'Add variation to the second verse',
    'The verse is too repetitive',
    'Build energy through the verses',
  ],
};

const PRE_CHORUS: DomainNoun = {
  id: 'noun:pre_chorus',
  term: 'pre-chorus',
  variants: ['pre-hook', 'lift', 'climb'],
  category: 'form',
  definition: 'A transitional section before the chorus',
  semantics: {
    type: 'entity',
    domain: 'form',
    entityType: 'section',
  },
  examples: [
    'Add a pre-chorus',
    'The pre-chorus builds well',
    'Shorten the pre-chorus',
  ],
};

const TAG: DomainNoun = {
  id: 'noun:tag',
  term: 'tag',
  variants: ['outro tag', 'ending tag', 'repeated ending'],
  category: 'form',
  definition: 'A short repeated section at the end',
  semantics: {
    type: 'entity',
    domain: 'form',
    entityType: 'section',
  },
  examples: [
    'Add a tag ending',
    'The tag repeats too many times',
    'Vary the tag each time',
  ],
};

const REFRAIN: DomainNoun = {
  id: 'noun:refrain',
  term: 'refrain',
  variants: ['repeated line', 'chorus line', 'repeating phrase'],
  category: 'songwriting',
  definition: 'A repeated line within a section',
  semantics: {
    type: 'concept',
    domain: 'songwriting',
    aspect: 'repetition',
  },
  examples: [
    'The refrain is memorable',
    'Vary the refrain slightly',
    'Add a refrain to tie sections together',
  ],
};

const LYRIC: DomainNoun = {
  id: 'noun:lyric',
  term: 'lyric',
  variants: ['lyrics', 'words', 'text'],
  category: 'songwriting',
  definition: 'The words of a song',
  semantics: {
    type: 'entity',
    domain: 'songwriting',
    entityType: 'text',
  },
  examples: [
    'The lyrics are too abstract',
    'Rewrite the second verse lyrics',
    'The lyrics don't fit the melody',
  ],
};

const RHYME_SCHEME: DomainNoun = {
  id: 'noun:rhyme_scheme',
  term: 'rhyme scheme',
  variants: ['rhyming pattern', 'rhyme', 'rhyme structure'],
  category: 'songwriting',
  definition: 'The pattern of rhymes in lyrics',
  semantics: {
    type: 'concept',
    domain: 'songwriting',
    aspect: 'lyric_structure',
  },
  examples: [
    'The rhyme scheme is too predictable',
    'Vary the rhyme scheme',
    'Use internal rhymes',
  ],
};

const PROSODY: DomainNoun = {
  id: 'noun:prosody',
  term: 'prosody',
  variants: ['lyric prosody', 'word stress', 'natural stress'],
  category: 'songwriting',
  definition: 'The relationship between lyric stress and melody',
  semantics: {
    type: 'concept',
    domain: 'songwriting',
    aspect: 'text_music_alignment',
  },
  examples: [
    'Improve the prosody',
    'The prosody is awkward',
    'Align word stress with melody',
  ],
};

const STORYLINE: DomainNoun = {
  id: 'noun:storyline',
  term: 'storyline',
  variants: ['narrative', 'story', 'lyrical narrative'],
  category: 'songwriting',
  definition: 'The narrative arc of a song',
  semantics: {
    type: 'concept',
    domain: 'songwriting',
    aspect: 'narrative',
  },
  examples: [
    'The storyline is unclear',
    'Develop the storyline',
    'The storyline progresses well',
  ],
};

const IMAGERY: DomainNoun = {
  id: 'noun:imagery',
  term: 'imagery',
  variants: ['lyrical imagery', 'visual metaphors', 'descriptive language'],
  category: 'songwriting',
  definition: 'Vivid descriptive language in lyrics',
  semantics: {
    type: 'concept',
    domain: 'songwriting',
    aspect: 'descriptive_language',
  },
  examples: [
    'The imagery is powerful',
    'Add more concrete imagery',
    'The imagery is too abstract',
  ],
};

// =============================================================================
// Performance Terms
// =============================================================================

const DELIVERY: DomainNoun = {
  id: 'noun:delivery',
  term: 'delivery',
  variants: ['vocal delivery', 'performance', 'interpretation'],
  category: 'performance',
  definition: 'The manner in which vocals are performed',
  semantics: {
    type: 'concept',
    domain: 'vocals',
    aspect: 'performance_quality',
  },
  examples: [
    'The delivery is too stiff',
    'Add emotion to the delivery',
    'The delivery suits the lyrics',
  ],
};

const PHRASING: DomainNoun = {
  id: 'noun:phrasing',
  term: 'phrasing',
  variants: ['vocal phrasing', 'phrase placement', 'timing'],
  category: 'performance',
  definition: 'The timing and grouping of sung phrases',
  semantics: {
    type: 'concept',
    domain: 'vocals',
    aspect: 'temporal_organization',
  },
  examples: [
    'The phrasing is too rushed',
    'Relax the phrasing',
    'Tighten phrase endings',
  ],
};

const INFLECTION: DomainNoun = {
  id: 'noun:inflection',
  term: 'inflection',
  variants: ['vocal inflection', 'pitch variation', 'intonation'],
  category: 'performance',
  definition: 'Subtle pitch variations expressing emotion',
  semantics: {
    type: 'concept',
    domain: 'vocals',
    aspect: 'expressive_pitch',
  },
  examples: [
    'Add more inflection',
    'The inflection conveys emotion',
    'The inflection is too exaggerated',
  ],
};

const PRESENCE: DomainNoun = {
  id: 'noun:vocal_presence',
  term: 'presence',
  variants: ['vocal presence', 'forward sound', 'clarity'],
  category: 'production',
  definition: 'The perceived proximity and clarity of vocals',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'spatial_perception',
  },
  examples: [
    'Add more vocal presence',
    'The vocal lacks presence',
    'Boost presence frequencies',
  ],
};

const EMOTION: DomainNoun = {
  id: 'noun:emotion',
  term: 'emotion',
  variants: ['emotional content', 'feeling', 'expression'],
  category: 'performance',
  definition: 'The emotional quality of a performance',
  semantics: {
    type: 'concept',
    domain: 'performance',
    aspect: 'expressive_quality',
  },
  examples: [
    'Add more emotion',
    'The emotion feels forced',
    'The delivery lacks emotion',
  ],
};

// =============================================================================
// Exports
// =============================================================================

export const VOCAL_TECHNIQUE_NOUNS: readonly DomainNoun[] = [
  VIBRATO,
  BELTING,
  FALSETTO,
  MELISMA,
  BREATH_CONTROL,
  VOCAL_FRY,
  RIFF,
  SCOOP,
  VOCAL_BREAK,
  DICTION,
] as const;

export const VOCAL_ARRANGEMENT_NOUNS: readonly DomainNoun[] = [
  HARMONY,
  DOUBLING,
  STACKING,
  CALL_RESPONSE,
  AD_LIB,
] as const;

export const VOCAL_PRODUCTION_NOUNS: readonly DomainNoun[] = [
  COMPING,
  TUNING,
  DE_ESSING,
  VOCAL_CHAIN,
  BREATH,
] as const;

export const SONGWRITING_NOUNS: readonly DomainNoun[] = [
  HOOK,
  VERSE,
  PRE_CHORUS,
  TAG,
  REFRAIN,
  LYRIC,
  RHYME_SCHEME,
  PROSODY,
  STORYLINE,
  IMAGERY,
] as const;

export const PERFORMANCE_NOUNS: readonly DomainNoun[] = [
  DELIVERY,
  PHRASING,
  INFLECTION,
  PRESENCE,
  EMOTION,
] as const;

export const BATCH_15_NOUNS: readonly DomainNoun[] = [
  ...VOCAL_TECHNIQUE_NOUNS,
  ...VOCAL_ARRANGEMENT_NOUNS,
  ...VOCAL_PRODUCTION_NOUNS,
  ...SONGWRITING_NOUNS,
  ...PERFORMANCE_NOUNS,
] as const;

export default BATCH_15_NOUNS;
