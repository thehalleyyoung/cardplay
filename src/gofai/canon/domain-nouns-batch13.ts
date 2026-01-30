/**
 * GOFAI Domain Nouns — Batch 13: Orchestration and Arrangement
 *
 * Terms related to orchestration, instrumentation, voicing, and arrangement.
 *
 * @module gofai/canon/domain-nouns-batch13
 */

import type { DomainNounLexeme } from './types';

// =============================================================================
// Orchestration Concepts
// =============================================================================

const ORCHESTRATION: DomainNounLexeme = {
  id: 'noun:orchestration',
  term: 'orchestration',
  variants: ['instrumentation', 'arrangement', 'scoring'],
  category: 'orchestration',
  definition: 'The art of assigning musical material to specific instruments',
  semantics: {
    type: 'concept',
    domain: 'orchestration',
    aspect: 'instrumental_assignment',
  },
  examples: [
    'The orchestration is too heavy in the mid range',
    'Improve the orchestration for better clarity',
    'This section needs richer orchestration',
  ],
};

const VOICING: DomainNounLexeme = {
  id: 'noun:voicing',
  term: 'voicing',
  variants: ['voice leading', 'chord voicing', 'vertical spacing'],
  category: 'orchestration',
  definition: 'The vertical arrangement of pitches in a chord or texture',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'chord_construction',
  },
  examples: [
    'Use closer voicings in the piano',
    'The voicing is too muddy',
    'Spread the voicing for more warmth',
  ],
};

const DOUBLING: DomainNounLexeme = {
  id: 'noun:doubling',
  term: 'doubling',
  variants: ['double', 'doubled', 'unison doubling', 'octave doubling'],
  category: 'orchestration',
  definition: 'Playing the same melodic line with multiple instruments',
  semantics: {
    type: 'concept',
    domain: 'orchestration',
    aspect: 'reinforcement',
  },
  examples: [
    'Add doubling to the melody',
    'Remove the octave doubling',
    'The bass needs doubling for more weight',
  ],
};

const ORCHESTRAL_WEIGHT: DomainNounLexeme = {
  id: 'noun:weight',
  term: 'weight',
  variants: ['orchestral weight', 'sonic weight', 'heaviness', 'density'],
  category: 'orchestration',
  definition: 'The perceived mass or density of the orchestration',
  semantics: {
    type: 'concept',
    domain: 'orchestration',
    aspect: 'texture_density',
  },
  examples: [
    'The arrangement lacks weight',
    'Reduce the weight in the chorus',
    'Add more weight to the low end',
  ],
};

const TESSITURA: DomainNounLexeme = {
  id: 'noun:tessitura',
  term: 'tessitura',
  variants: ['vocal range', 'comfortable range', 'natural range'],
  category: 'orchestration',
  definition: 'The range in which a voice or instrument sounds most natural',
  semantics: {
    type: 'concept',
    domain: 'melody',
    aspect: 'register',
  },
  examples: [
    'The melody sits in a comfortable tessitura',
    'Move this out of the awkward tessitura',
    'This tessitura is too high for the vocalist',
  ],
};

const SCORING: DomainNounLexeme = {
  id: 'noun:scoring',
  term: 'scoring',
  variants: ['score', 'written parts', 'notation'],
  category: 'orchestration',
  definition: 'The written arrangement of musical parts',
  semantics: {
    type: 'concept',
    domain: 'orchestration',
    aspect: 'notation',
  },
  examples: [
    'The scoring is too dense',
    'Clean up the scoring',
    'This needs a cleaner scoring approach',
  ],
};

const DIVISI: DomainNounLexeme = {
  id: 'noun:divisi',
  term: 'divisi',
  variants: ['div.', 'divided', 'split section'],
  category: 'orchestration',
  definition: 'Division of an instrumental section into multiple independent parts',
  semantics: {
    type: 'concept',
    domain: 'orchestration',
    aspect: 'part_division',
  },
  examples: [
    'The strings are divisi here',
    'Remove the divisi and unify the section',
    'Add divisi to the violins',
  ],
};

const TUTTI: DomainNounLexeme = {
  id: 'noun:tutti',
  term: 'tutti',
  variants: ['full ensemble', 'everyone', 'all instruments'],
  category: 'orchestration',
  definition: 'All instruments playing together',
  semantics: {
    type: 'concept',
    domain: 'orchestration',
    aspect: 'ensemble_size',
  },
  examples: [
    'Build to a tutti climax',
    'The tutti section needs more impact',
    'Reduce from tutti to soloists',
  ],
};

const SOLO: DomainNounLexeme = {
  id: 'noun:solo',
  term: 'solo',
  variants: ['soli', 'soloist', 'solo passage', 'solo line'],
  category: 'orchestration',
  definition: 'A single instrument or voice featured prominently',
  semantics: {
    type: 'concept',
    domain: 'orchestration',
    aspect: 'featured_instrument',
  },
  examples: [
    'Add a solo violin line',
    'The solo is too buried',
    'Feature the trumpet solo more prominently',
  ],
};

const ACCOMPANIMENT: DomainNounLexeme = {
  id: 'noun:accompaniment',
  term: 'accompaniment',
  variants: ['accomp', 'backing', 'harmonic support'],
  category: 'orchestration',
  definition: 'The supporting musical material beneath the main melody',
  semantics: {
    type: 'concept',
    domain: 'texture',
    aspect: 'hierarchical_role',
  },
  examples: [
    'Simplify the accompaniment',
    'The accompaniment is too busy',
    'Add a simple accompaniment pattern',
  ],
};

// =============================================================================
// Instrumental Roles
// =============================================================================

const MELODY_INSTRUMENT: DomainNounLexeme = {
  id: 'noun:lead',
  term: 'lead',
  variants: ['lead instrument', 'melodic lead', 'main voice'],
  category: 'role',
  definition: 'The primary melodic instrument',
  semantics: {
    type: 'entity',
    domain: 'orchestration',
    entityType: 'instrument',
  },
  examples: [
    'The lead is too quiet',
    'Bring the lead forward',
    'Switch the lead to saxophone',
  ],
};

const BASS_INSTRUMENT: DomainNounLexeme = {
  id: 'noun:bass',
  term: 'bass',
  variants: ['bassline', 'low end', 'foundation'],
  category: 'role',
  definition: 'The lowest-pitched foundational instrument',
  semantics: {
    type: 'entity',
    domain: 'orchestration',
    entityType: 'instrument',
  },
  examples: [
    'The bass is too prominent',
    'Add more movement to the bass',
    'Lock the bass with the kick',
  ],
};

const HARMONIC_FILL: DomainNounLexeme = {
  id: 'noun:pad',
  term: 'pad',
  variants: ['harmonic pad', 'sustaining harmony', 'wash'],
  category: 'role',
  definition: 'Sustained harmonic texture providing atmospheric support',
  semantics: {
    type: 'entity',
    domain: 'orchestration',
    entityType: 'instrument',
  },
  examples: [
    'Add a subtle pad underneath',
    'The pad is too bright',
    'Fade the pad in gradually',
  ],
};

const RHYTHMIC_DRIVER: DomainNounLexeme = {
  id: 'noun:rhythm_section',
  term: 'rhythm section',
  variants: ['rhythm', 'groove section', 'backbeat'],
  category: 'role',
  definition: 'Instruments providing the rhythmic foundation',
  semantics: {
    type: 'entity',
    domain: 'orchestration',
    entityType: 'section',
  },
  examples: [
    'Tighten the rhythm section',
    'The rhythm section is too busy',
    'Lock the rhythm section together',
  ],
};

const COUNTER_VOICE: DomainNounLexeme = {
  id: 'noun:countermelody',
  term: 'countermelody',
  variants: ['counter', 'secondary melody', 'counterpoint line'],
  category: 'role',
  definition: 'A secondary melodic line that contrasts with the main melody',
  semantics: {
    type: 'concept',
    domain: 'melody',
    aspect: 'melodic_layer',
  },
  examples: [
    'Add a countermelody in the strings',
    'The countermelody is too prominent',
    'Simplify the countermelody',
  ],
};

// =============================================================================
// Textural Techniques
// =============================================================================

const LAYERING: DomainNounLexeme = {
  id: 'noun:layering',
  term: 'layering',
  variants: ['layers', 'stacking', 'vertical density'],
  category: 'technique',
  definition: 'Building texture by combining multiple simultaneous parts',
  semantics: {
    type: 'concept',
    domain: 'texture',
    aspect: 'additive_combination',
  },
  examples: [
    'Reduce the layering for clarity',
    'Add more layering to thicken the texture',
    'The layering is too dense here',
  ],
};

const UNISON: DomainNounLexeme = {
  id: 'noun:unison',
  term: 'unison',
  variants: ['in unison', 'unison passage', 'monophonic'],
  category: 'technique',
  definition: 'Multiple instruments playing the same pitch simultaneously',
  semantics: {
    type: 'concept',
    domain: 'orchestration',
    aspect: 'pitch_alignment',
  },
  examples: [
    'Play this in unison',
    'Break from unison into harmony',
    'The unison needs more weight',
  ],
};

const CALL_AND_RESPONSE: DomainNounLexeme = {
  id: 'noun:call_and_response',
  term: 'call and response',
  variants: ['call-response', 'antiphony', 'question-answer'],
  category: 'technique',
  definition: 'Alternating musical statements between two groups',
  semantics: {
    type: 'concept',
    domain: 'form',
    aspect: 'dialogic_structure',
  },
  examples: [
    'Add a call and response section',
    'The call and response is too predictable',
    'Tighten the call and response timing',
  ],
};

const HOCKET: DomainNounLexeme = {
  id: 'noun:hocket',
  term: 'hocket',
  variants: ['hocketing', 'shared melody', 'interlocking parts'],
  category: 'technique',
  definition: 'A technique where a melody is fragmented between multiple voices',
  semantics: {
    type: 'concept',
    domain: 'texture',
    aspect: 'rhythmic_distribution',
  },
  examples: [
    'Use hocket between the woodwinds',
    'The hocket creates rhythmic interest',
    'Simplify the hocket for clarity',
  ],
};

const OSTINATO: DomainNounLexeme = {
  id: 'noun:ostinato',
  term: 'ostinato',
  variants: ['repeated figure', 'ground', 'riff'],
  category: 'technique',
  definition: 'A persistently repeated musical pattern',
  semantics: {
    type: 'concept',
    domain: 'rhythm',
    aspect: 'repetition',
  },
  examples: [
    'Add an ostinato in the bass',
    'The ostinato is too prominent',
    'Vary the ostinato gradually',
  ],
};

// =============================================================================
// Timbral Blending
// =============================================================================

const BLEND: DomainNounLexeme = {
  id: 'noun:blend',
  term: 'blend',
  variants: ['blending', 'timbral fusion', 'homogeneous sound'],
  category: 'concept',
  definition: 'The degree to which different timbres merge into a unified sound',
  semantics: {
    type: 'concept',
    domain: 'timbre',
    aspect: 'timbral_unity',
  },
  examples: [
    'The blend between strings and woodwinds is excellent',
    'Improve the blend in the horn section',
    'The instruments do not blend well',
  ],
};

const CONTRAST: DomainNounLexeme = {
  id: 'noun:contrast',
  term: 'contrast',
  variants: ['contrasting', 'timbral contrast', 'differentiation'],
  category: 'concept',
  definition: 'The degree of difference between musical elements',
  semantics: {
    type: 'concept',
    domain: 'form',
    aspect: 'variation',
  },
  examples: [
    'Add more contrast between sections',
    'The contrast is too extreme',
    'Create contrast through timbre changes',
  ],
};

const COLOR: DomainNounLexeme = {
  id: 'noun:color',
  term: 'color',
  variants: ['tonal color', 'timbre', 'sound color'],
  category: 'concept',
  definition: 'The quality of sound that distinguishes different instruments',
  semantics: {
    type: 'concept',
    domain: 'timbre',
    aspect: 'timbral_quality',
  },
  examples: [
    'Add more color to the orchestration',
    'The color palette is too limited',
    'Change the color by varying instrumentation',
  ],
};

const BALANCE: DomainNounLexeme = {
  id: 'noun:balance',
  term: 'balance',
  variants: ['balanced', 'proportions', 'relative levels'],
  category: 'concept',
  definition: 'The relative loudness of different parts',
  semantics: {
    type: 'concept',
    domain: 'mixing',
    aspect: 'level_relationships',
  },
  examples: [
    'The balance needs adjustment',
    'Achieve better balance between sections',
    'The balance favors the brass too much',
  ],
};

const TRANSPARENCY: DomainNounLexeme = {
  id: 'noun:transparency',
  term: 'transparency',
  variants: ['transparent', 'clarity', 'clear texture'],
  category: 'concept',
  definition: 'The ability to hear individual lines clearly within the texture',
  semantics: {
    type: 'concept',
    domain: 'texture',
    aspect: 'clarity',
  },
  examples: [
    'Improve transparency in the middle voices',
    'The texture lacks transparency',
    'Add transparency through spacing',
  ],
};

// =============================================================================
// Ensemble Sections
// =============================================================================

const STRINGS: DomainNounLexeme = {
  id: 'noun:strings',
  term: 'strings',
  variants: ['string section', 'strings ensemble', 'orchestral strings'],
  category: 'section',
  definition: 'The string instrument section of an ensemble',
  semantics: {
    type: 'entity',
    domain: 'orchestration',
    entityType: 'section',
  },
  examples: [
    'The strings need more vibrato',
    'Bring the strings forward',
    'Add a lush string pad',
  ],
};

const BRASS: DomainNounLexeme = {
  id: 'noun:brass',
  term: 'brass',
  variants: ['brass section', 'horns', 'brass ensemble'],
  category: 'section',
  definition: 'The brass instrument section of an ensemble',
  semantics: {
    type: 'entity',
    domain: 'orchestration',
    entityType: 'section',
  },
  examples: [
    'The brass is too loud',
    'Add a brass swell',
    'Tighten the brass attack',
  ],
};

const WOODWINDS: DomainNounLexeme = {
  id: 'noun:woodwinds',
  term: 'woodwinds',
  variants: ['woodwind section', 'winds', 'woodwind ensemble'],
  category: 'section',
  definition: 'The woodwind instrument section of an ensemble',
  semantics: {
    type: 'entity',
    domain: 'orchestration',
    entityType: 'section',
  },
  examples: [
    'The woodwinds add brightness',
    'Feature the woodwinds more',
    'Reduce the woodwind activity',
  ],
};

const PERCUSSION: DomainNounLexeme = {
  id: 'noun:percussion',
  term: 'percussion',
  variants: ['percussion section', 'drums', 'rhythmic percussion'],
  category: 'section',
  definition: 'Instruments struck or shaken to produce sound',
  semantics: {
    type: 'entity',
    domain: 'orchestration',
    entityType: 'section',
  },
  examples: [
    'Add more percussion for drive',
    'The percussion is too sparse',
    'Feature the percussion prominently',
  ],
};

const CHOIR: DomainNounLexeme = {
  id: 'noun:choir',
  term: 'choir',
  variants: ['chorus', 'vocal ensemble', 'voices'],
  category: 'section',
  definition: 'A group of singers performing together',
  semantics: {
    type: 'entity',
    domain: 'orchestration',
    entityType: 'section',
  },
  examples: [
    'Add a choir for the climax',
    'The choir needs better blend',
    'Feature the choir in this section',
  ],
};

// =============================================================================
// Exports
// =============================================================================

export const ORCHESTRATION_NOUNS: readonly DomainNounLexeme[] = [
  ORCHESTRATION,
  VOICING,
  DOUBLING,
  ORCHESTRAL_WEIGHT,
  TESSITURA,
  SCORING,
  DIVISI,
  TUTTI,
  SOLO,
  ACCOMPANIMENT,
] as const;

export const ROLE_NOUNS: readonly DomainNounLexeme[] = [
  MELODY_INSTRUMENT,
  BASS_INSTRUMENT,
  HARMONIC_FILL,
  RHYTHMIC_DRIVER,
  COUNTER_VOICE,
] as const;

export const TEXTURAL_TECHNIQUE_NOUNS: readonly DomainNounLexeme[] = [
  LAYERING,
  UNISON,
  CALL_AND_RESPONSE,
  HOCKET,
  OSTINATO,
] as const;

export const TIMBRAL_CONCEPT_NOUNS: readonly DomainNounLexeme[] = [
  BLEND,
  CONTRAST,
  COLOR,
  BALANCE,
  TRANSPARENCY,
] as const;

export const SECTION_NOUNS: readonly DomainNounLexeme[] = [
  STRINGS,
  BRASS,
  WOODWINDS,
  PERCUSSION,
  CHOIR,
] as const;

export const BATCH_13_NOUNS: readonly DomainNounLexeme[] = [
  ...ORCHESTRATION_NOUNS,
  ...ROLE_NOUNS,
  ...TEXTURAL_TECHNIQUE_NOUNS,
  ...TIMBRAL_CONCEPT_NOUNS,
  ...SECTION_NOUNS,
] as const;

export default BATCH_13_NOUNS;
