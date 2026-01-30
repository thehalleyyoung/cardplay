/**
 * GOFAI Lexeme Classes — Musical Roles Batch 3
 *
 * Extended musical role lexemes covering gamelan, Middle Eastern,
 * East Asian, Caribbean, and additional functional/structural roles.
 *
 * Step 121 [NLP][Sem] of gofai_goalA.md — Batch 3 of N
 *
 * @module gofai/canon/musical-roles-batch3
 */

import type { DomainNounLexeme } from './types';

// =============================================================================
// Gamelan and Southeast Asian Roles
// =============================================================================

const BALUNGAN: DomainNounLexeme = {
  id: 'noun:role:balungan',
  term: 'balungan',
  variants: [
    'core melody',
    'skeletal melody',
    'balungan melody',
    'nuclear melody',
  ],
  category: 'musical_role',
  definition:
    'In Javanese gamelan, the core skeletal melody played on the saron and demung metallophones that serves as the basis for all elaboration and ornamentation.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'gamelan_core',
    tradition: 'javanese_gamelan',
    mapping: {
      role: 'balungan',
      function: 'skeletal_melody',
      instruments: ['saron', 'demung', 'slenthem'],
      relationship: 'basis_for_elaboration',
    },
  },
  examples: [
    'The balungan should be simpler',
    'Follow the core melody',
    'The skeletal melody outlines the harmony',
    'Elaborate around the balungan',
  ],
};

const PANERUSAN: DomainNounLexeme = {
  id: 'noun:role:panerusan',
  term: 'panerusan',
  variants: [
    'elaborating melody',
    'elaboration part',
    'ornamental melody',
    'gangsa elaboration',
  ],
  category: 'musical_role',
  definition:
    'In gamelan, the elaborating instrumental parts that ornament and expand the balungan with faster, more intricate patterns, creating a dense interlocking texture.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'gamelan_elaboration',
    tradition: 'javanese_gamelan',
    mapping: {
      role: 'panerusan',
      function: 'elaboration',
      instruments: ['bonang', 'gender', 'gambang', 'siter'],
      relationship: 'elaborates_balungan',
    },
  },
  examples: [
    'The panerusan should be more active',
    'Add elaborating parts over the core melody',
    'The ornamental melody is too dense',
    'Simplify the gangsa elaboration',
  ],
};

const KOTEKAN: DomainNounLexeme = {
  id: 'noun:role:kotekan',
  term: 'kotekan',
  variants: [
    'interlocking pattern',
    'interlocking parts',
    'hocketing',
    'hocket',
    'polos and sangsih',
  ],
  category: 'musical_role',
  definition:
    'In Balinese gamelan, interlocking melodic patterns where two parts (polos and sangsih) alternate notes to create a rapid composite melody. Also found as hocket in medieval and African music.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'interlocking_technique',
    tradition: 'balinese_gamelan',
    mapping: {
      role: 'kotekan',
      function: 'interlocking_melody',
      parts: ['polos', 'sangsih'],
      traditions: ['balinese_gamelan', 'medieval', 'african'],
    },
  },
  examples: [
    'Add a kotekan pattern on the metallophones',
    'The interlocking parts should be faster',
    'Write polos and sangsih parts',
    'The hocket effect should be tighter',
  ],
};

const COLOTOMIC: DomainNounLexeme = {
  id: 'noun:role:colotomic',
  term: 'colotomic structure',
  variants: [
    'colotomic part',
    'gong cycle',
    'punctuating instruments',
    'structural gongs',
    'gong ageng',
    'kenong',
    'kethuk',
  ],
  category: 'musical_role',
  definition:
    'In gamelan, the hierarchy of gong-family instruments that punctuate and mark structural divisions of the cyclical form (gongan), providing temporal architecture.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'gamelan_structure',
    tradition: 'javanese_gamelan',
    mapping: {
      role: 'colotomic',
      function: 'structural_punctuation',
      instruments: ['gong_ageng', 'siyem', 'kenong', 'kethuk', 'kempyang'],
      hierarchy: 'nested_cycles',
    },
  },
  examples: [
    'The gong cycle should be longer',
    'Add structural gong punctuation',
    'The kenong should mark the quarter points',
    'Follow the colotomic structure',
  ],
};

// =============================================================================
// Middle Eastern and Central Asian Roles
// =============================================================================

const MAQAM_MELODY: DomainNounLexeme = {
  id: 'noun:role:maqam',
  term: 'maqam',
  variants: [
    'maqam melody',
    'makam',
    'maqam mode',
    'Arabic mode',
    'Turkish makam',
    'modal melody',
  ],
  category: 'musical_role',
  definition:
    'A modal melodic system in Arabic, Turkish, and Persian music defining specific pitch intervals, characteristic phrases, modulation paths, and emotional associations.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'modal_framework',
    tradition: 'middle_eastern',
    mapping: {
      role: 'maqam',
      function: 'melodic_modal_framework',
      elements: ['jins', 'sayr', 'qarar', 'ghammaz'],
      regional_variants: ['arabic', 'turkish', 'persian'],
    },
  },
  examples: [
    'Use maqam Hijaz for the melody',
    'The maqam should modulate to Nahawand',
    'Add more maqam-style ornamentation',
    'Follow the traditional maqam sayr',
  ],
};

const OUD_PART: DomainNounLexeme = {
  id: 'noun:role:oud',
  term: 'oud part',
  variants: [
    'oud',
    'oud melody',
    'oud accompaniment',
    'ud',
    'lute part',
  ],
  category: 'musical_role',
  definition:
    'A part played on the oud (fretless short-neck lute), central to Arabic, Turkish, and Persian classical and folk music traditions.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'instrument_role',
    tradition: 'middle_eastern',
    mapping: {
      role: 'oud',
      function: 'melodic_harmonic',
      techniques: ['taqsim', 'accompaniment', 'tremolo'],
    },
  },
  examples: [
    'Add an oud melody',
    'The oud should play a taqsim',
    'Make the oud part more ornate',
    'The oud accompaniment should be simpler',
  ],
};

const TAQSIM: DomainNounLexeme = {
  id: 'noun:role:taqsim',
  term: 'taqsim',
  variants: [
    'taksim',
    'free improvisation',
    'modal improvisation',
    'unmetered improvisation',
    'layali',
  ],
  category: 'musical_role',
  definition:
    'A non-metered melodic improvisation in Middle Eastern music that explores a maqam, gradually revealing its characteristic intervals, phrases, and modulations.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'improvisation_form',
    tradition: 'middle_eastern',
    mapping: {
      role: 'taqsim',
      function: 'modal_exploration',
      meter: 'free',
      development: 'gradual_maqam_revelation',
    },
  },
  examples: [
    'Start with a taqsim on the oud',
    'The taqsim should explore Hijaz',
    'Make the improvisation more meditative',
    'The layali should build gradually',
  ],
};

const DOUMBEK_PATTERN: DomainNounLexeme = {
  id: 'noun:role:doumbek',
  term: 'doumbek pattern',
  variants: [
    'doumbek',
    'darbuka',
    'tabla pattern',
    'goblet drum',
    'doum-tek',
    'Middle Eastern percussion',
  ],
  category: 'musical_role',
  definition:
    'A rhythmic pattern played on the doumbek/darbuka using doum (bass) and tek/ka (treble) strokes, forming the rhythmic foundation of Middle Eastern music.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'middle_eastern_percussion',
    tradition: 'middle_eastern',
    mapping: {
      role: 'doumbek',
      function: 'rhythmic_foundation',
      strokes: ['doum', 'tek', 'ka', 'slap'],
    },
  },
  examples: [
    'Add a doumbek pattern',
    'The darbuka should play a maqsoum rhythm',
    'Make the doumbek more driving',
    'The Middle Eastern percussion needs more fills',
  ],
};

// =============================================================================
// East Asian Roles
// =============================================================================

const ERHU_PART: DomainNounLexeme = {
  id: 'noun:role:erhu',
  term: 'erhu part',
  variants: [
    'erhu',
    'erhu melody',
    'Chinese fiddle',
    'two-string fiddle',
    'huqin',
  ],
  category: 'musical_role',
  definition:
    'A melodic part played on the erhu (Chinese two-string bowed fiddle), known for its vocal-like quality and wide expressive range.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'instrument_role',
    tradition: 'chinese',
    mapping: {
      role: 'erhu',
      function: 'melodic',
      quality: 'vocal_like',
      techniques: ['vibrato', 'glissando', 'harmonics', 'pizzicato'],
    },
  },
  examples: [
    'Add an erhu melody',
    'The erhu should be more expressive',
    'Make the Chinese fiddle part more legato',
    'The erhu melody needs more vibrato',
  ],
};

const GUZHENG_PART: DomainNounLexeme = {
  id: 'noun:role:guzheng',
  term: 'guzheng part',
  variants: [
    'guzheng',
    'Chinese zither',
    'zheng',
    'guzheng melody',
    'zither part',
  ],
  category: 'musical_role',
  definition:
    'A part played on the guzheng (Chinese plucked zither with movable bridges), known for its cascading arpeggiated patterns and expressive bending.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'instrument_role',
    tradition: 'chinese',
    mapping: {
      role: 'guzheng',
      function: 'melodic_textural',
      techniques: ['tremolo', 'glissando', 'bending', 'arpeggio', 'harmonics'],
    },
  },
  examples: [
    'Add a guzheng pattern',
    'The zither part should be more flowing',
    'Make the guzheng arpeggios wider',
    'The Chinese zither should tremolo here',
  ],
};

const SHAMISEN_PART: DomainNounLexeme = {
  id: 'noun:role:shamisen',
  term: 'shamisen part',
  variants: [
    'shamisen',
    'Japanese lute',
    'tsugaru shamisen',
    'nagauta shamisen',
  ],
  category: 'musical_role',
  definition:
    'A part played on the shamisen (Japanese three-string plucked lute), ranging from percussive Tsugaru style to refined nagauta accompaniment.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'instrument_role',
    tradition: 'japanese',
    mapping: {
      role: 'shamisen',
      function: 'melodic_percussive',
      styles: ['tsugaru', 'nagauta', 'jiuta'],
      techniques: ['bachi_strike', 'hajiki', 'suri'],
    },
  },
  examples: [
    'Add a shamisen part',
    'The shamisen should be more percussive',
    'Use Tsugaru style for the shamisen',
    'The Japanese lute should accent the phrases',
  ],
};

const KOTO_PART: DomainNounLexeme = {
  id: 'noun:role:koto',
  term: 'koto part',
  variants: [
    'koto',
    'Japanese zither',
    'koto melody',
    'koto pattern',
    'thirteen-string koto',
  ],
  category: 'musical_role',
  definition:
    'A part played on the koto (Japanese plucked zither with 13+ strings), known for its delicate plucked tones, oshide pitch bends, and traditional scale patterns.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'instrument_role',
    tradition: 'japanese',
    mapping: {
      role: 'koto',
      function: 'melodic_textural',
      techniques: ['tsume_pluck', 'oshide_bend', 'ato_oshi', 'tremolo'],
    },
  },
  examples: [
    'Add a koto melody',
    'The koto pattern should be more pentatonic',
    'Make the Japanese zither part gentler',
    'The koto should bend into the notes',
  ],
};

const TAIKO_PART: DomainNounLexeme = {
  id: 'noun:role:taiko',
  term: 'taiko part',
  variants: [
    'taiko',
    'taiko drums',
    'Japanese drums',
    'wadaiko',
    'odaiko',
    'shime-daiko',
  ],
  category: 'musical_role',
  definition:
    'A percussion part played on Japanese taiko drums, ranging from thunderous odaiko to tight shime-daiko patterns. Known for powerful, ceremonial, and martial character.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'japanese_percussion',
    tradition: 'japanese',
    mapping: {
      role: 'taiko',
      function: 'rhythmic_dramatic',
      instruments: ['odaiko', 'shime_daiko', 'chu_daiko'],
      character: 'powerful_ceremonial',
    },
  },
  examples: [
    'Add taiko drums for impact',
    'The taiko pattern should be more driving',
    'Use odaiko for the climax',
    'The Japanese drums should build intensity',
  ],
};

// =============================================================================
// Caribbean and Latin American Roles
// =============================================================================

const STEEL_PAN: DomainNounLexeme = {
  id: 'noun:role:steel_pan',
  term: 'steel pan',
  variants: [
    'steel drum',
    'steel pan melody',
    'pan',
    'tenor pan',
    'double seconds',
    'steelpan',
  ],
  category: 'musical_role',
  definition:
    'A melodic or harmonic part played on steel pans (Caribbean tuned percussion), central to calypso and soca. Ranges from melody (tenor pan) to harmony (double seconds) to bass.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'caribbean_instrument',
    tradition: 'caribbean',
    mapping: {
      role: 'steel_pan',
      function: 'melodic_harmonic',
      voices: ['tenor', 'double_seconds', 'cello_pan', 'bass_pan'],
    },
  },
  examples: [
    'Add a steel pan melody',
    'The tenor pan should be brighter',
    'Make the steel drum part more syncopated',
    'Layer double seconds for harmony',
  ],
};

const REGGAE_SKANK: DomainNounLexeme = {
  id: 'noun:role:skank',
  term: 'skank',
  variants: [
    'reggae skank',
    'offbeat chords',
    'offbeat guitar',
    'reggae guitar',
    'chop',
    'rhythmic chop',
  ],
  category: 'musical_role',
  definition:
    'The characteristic offbeat rhythmic guitar or keyboard pattern in reggae, ska, and rocksteady, providing the genre-defining rhythmic pulse.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'reggae_rhythm',
    tradition: 'caribbean',
    mapping: {
      role: 'skank',
      function: 'offbeat_pulse',
      typical_instruments: ['guitar', 'keyboard', 'organ'],
      genres: ['reggae', 'ska', 'rocksteady', 'dub'],
    },
  },
  examples: [
    'Add a reggae skank on the guitar',
    'The offbeat chords should be choppier',
    'Make the skank pattern tighter',
    'The reggae guitar should be more staccato',
  ],
};

const DUB_ELEMENT: DomainNounLexeme = {
  id: 'noun:role:dub_element',
  term: 'dub element',
  variants: [
    'dub effect',
    'dub delay',
    'dub echo',
    'dub processing',
    'dubwise',
    'dub treatment',
  ],
  category: 'musical_role',
  definition:
    'Effects processing characteristic of dub reggae: heavy delay, reverb, filtering, and dynamic muting used as creative arrangement tools, not just mix effects.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'effects_as_arrangement',
    tradition: 'caribbean',
    mapping: {
      role: 'dub_element',
      function: 'creative_effects',
      techniques: ['echo', 'spring_reverb', 'filtering', 'dropouts', 'tape_delay'],
      genres: ['dub', 'dub_techno', 'dubstep'],
    },
  },
  examples: [
    'Add dub delays on the snare',
    'Make it more dubwise',
    'The dub echoes should be more spacious',
    'Apply dub processing to the vocals',
  ],
};

const BOSSA_PATTERN: DomainNounLexeme = {
  id: 'noun:role:bossa',
  term: 'bossa nova pattern',
  variants: [
    'bossa nova',
    'bossa pattern',
    'bossa rhythm',
    'bossa guitar',
    'Brazilian rhythm',
  ],
  category: 'musical_role',
  definition:
    'The characteristic rhythmic pattern of bossa nova, typically played on guitar with a thumb-and-finger pattern combining bass notes with syncopated chord strums.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'brazilian_rhythm',
    tradition: 'brazilian',
    mapping: {
      role: 'bossa',
      function: 'rhythmic_harmonic',
      typical_instrument: 'nylon_guitar',
      characteristic: 'syncopated_thumb_finger',
    },
  },
  examples: [
    'Use a bossa nova rhythm',
    'The bossa pattern should be more relaxed',
    'Add bossa guitar',
    'Make the Brazilian rhythm lighter',
  ],
};

const SAMBA_PATTERN: DomainNounLexeme = {
  id: 'noun:role:samba',
  term: 'samba pattern',
  variants: [
    'samba',
    'samba rhythm',
    'samba percussion',
    'batucada',
    'samba bateria',
    'partido alto',
  ],
  category: 'musical_role',
  definition:
    'The polyrhythmic percussion pattern of samba, featuring surdo (bass), tamborim, pandeiro, agogo, cuica, and other instruments in an interlocking groove.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'brazilian_percussion',
    tradition: 'brazilian',
    mapping: {
      role: 'samba',
      function: 'polyrhythmic_foundation',
      instruments: ['surdo', 'tamborim', 'pandeiro', 'agogo', 'cuica', 'repinique'],
    },
  },
  examples: [
    'Add samba percussion',
    'The batucada should be more intense',
    'Make the samba pattern lighter',
    'Add a surdo part to the samba',
  ],
};

// =============================================================================
// Additional Functional Roles
// =============================================================================

const PEDAL_TONE: DomainNounLexeme = {
  id: 'noun:role:pedal_tone',
  term: 'pedal tone',
  variants: [
    'pedal note',
    'inverted pedal',
    'inner pedal',
    'dominant pedal',
    'tonic pedal',
  ],
  category: 'musical_role',
  definition:
    'A sustained note (usually bass or soprano) held while harmonic changes occur around it. Creates tension/resolution patterns. May be tonic, dominant, or inner-voice.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'harmonic_device',
    mapping: {
      role: 'pedal_tone',
      function: 'harmonic_anchor',
      positions: ['bass', 'soprano', 'inner_voice'],
      types: ['tonic', 'dominant', 'chromatic'],
    },
  },
  examples: [
    'Add a dominant pedal tone before the resolution',
    'Hold a tonic pedal under the changes',
    'Use an inverted pedal on top',
    'The inner pedal should connect the voices',
  ],
};

const OBLIGATO: DomainNounLexeme = {
  id: 'noun:role:obligato',
  term: 'obligato',
  variants: [
    'obbligato part',
    'obligatory countermelody',
    'essential accompanying figure',
  ],
  category: 'musical_role',
  definition:
    'An essential accompanying melodic line that is integral to the composition (not improvised or optional), providing a characteristic secondary voice.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'essential_accompaniment',
    mapping: {
      role: 'obligato',
      function: 'essential_secondary_melody',
      optional: false,
      preservation_priority: 'high',
    },
  },
  examples: [
    'The obligato part must be preserved',
    'Add an obbligato figure on the clarinet',
    'The obligatory countermelody should be softer',
    'Keep the obligato but change the main melody',
  ],
};

const GROUND: DomainNounLexeme = {
  id: 'noun:role:ground',
  term: 'ground',
  variants: [
    'ground bass',
    'basso continuo',
    'continuo',
    'figured bass',
    'thoroughbass',
    'walking ground',
  ],
  category: 'musical_role',
  definition:
    'In Baroque and early music, a repeated bass pattern over which upper voices improvise or compose variations. Also refers to the continuo practice of realizing figured bass.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'historical_role',
    tradition: 'western_classical',
    mapping: {
      role: 'ground',
      function: 'harmonic_bass_foundation',
      practices: ['ground_bass', 'figured_bass_realization', 'continuo'],
      period: 'baroque',
    },
  },
  examples: [
    'Use a ground bass pattern',
    'The continuo should be more active',
    'Add a figured bass realization',
    'The ground should repeat for eight bars',
  ],
};

const POWER_CHORD: DomainNounLexeme = {
  id: 'noun:role:power_chord',
  term: 'power chord',
  variants: [
    'power chords',
    'fifth chord',
    'root-fifth',
    'distorted chords',
    'chugging',
    'palm mute chords',
  ],
  category: 'musical_role',
  definition:
    'A two-note chord consisting of root and fifth (no third), characteristic of rock and metal. Often played with heavy distortion where full chords would be too muddy.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'rock_harmony',
    tradition: 'rock',
    mapping: {
      role: 'power_chord',
      function: 'harmonic_rhythmic',
      interval: 'perfect_fifth',
      genres: ['rock', 'metal', 'punk', 'grunge'],
    },
  },
  examples: [
    'Use power chords for the verse riff',
    'The power chords should chug more',
    'Add palm-muted power chords',
    'Make the distorted chords heavier',
  ],
};

const FINGERPICKING: DomainNounLexeme = {
  id: 'noun:role:fingerpicking',
  term: 'fingerpicking',
  variants: [
    'fingerstyle',
    'fingerpicked guitar',
    'Travis picking',
    'classical guitar',
    'arpeggio picking',
    'fingerstyle guitar',
  ],
  category: 'musical_role',
  definition:
    'A guitar technique where individual strings are plucked by fingertips/nails rather than strummed, creating independent bass, melody, and harmony voices from a single instrument.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'guitar_technique',
    mapping: {
      role: 'fingerpicking',
      function: 'multi_voice_guitar',
      styles: ['travis_picking', 'classical', 'folk', 'ragtime'],
      voices: ['bass', 'melody', 'harmony'],
    },
  },
  examples: [
    'Use fingerpicking for the intro',
    'The Travis picking should be steadier',
    'Add a fingerstyle guitar part',
    'The classical guitar should be softer',
  ],
};

const STRUMMING: DomainNounLexeme = {
  id: 'noun:role:strumming',
  term: 'strumming',
  variants: [
    'strum pattern',
    'strummed guitar',
    'acoustic strum',
    'rhythm strum',
    'campfire strum',
    'driving strum',
  ],
  category: 'musical_role',
  definition:
    'A guitar technique of sweeping across strings to produce rhythmic chordal patterns, providing harmonic and rhythmic accompaniment.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'guitar_technique',
    mapping: {
      role: 'strumming',
      function: 'rhythmic_harmonic',
      patterns: ['down_up', 'syncopated', 'muted', 'driving'],
    },
  },
  examples: [
    'Add a strummed acoustic guitar',
    'The strum pattern should be more syncopated',
    'Make the strumming lighter',
    'The driving strum needs more energy',
  ],
};

// =============================================================================
// Choir and Vocal Ensemble Roles
// =============================================================================

const SOPRANO_PART: DomainNounLexeme = {
  id: 'noun:role:soprano',
  term: 'soprano',
  variants: [
    'soprano part',
    'soprano voice',
    'soprano line',
    'top voice',
    'treble',
    'highest voice',
  ],
  category: 'musical_role',
  definition:
    'The highest vocal or instrumental part in a choral or ensemble arrangement, typically carrying the melody or uppermost harmonic voice.',
  semantics: {
    type: 'entity',
    entityType: 'melody',
    role: 'soprano',
    layer_affinity: ['vocal', 'melody'],
    selectional_restrictions: {
      can_modify: ['pitch', 'dynamics', 'articulation', 'register'],
      cannot_modify: ['bass_register'],
      typical_axes: ['brightness', 'intimacy', 'tension'],
      register: 'high',
    },
  },
  examples: [
    'The soprano should be more prominent',
    'Add a soprano descant',
    'The soprano line is too high',
    'The top voice needs more support',
  ],
};

const ALTO_PART: DomainNounLexeme = {
  id: 'noun:role:alto',
  term: 'alto',
  variants: [
    'alto part',
    'alto voice',
    'alto line',
    'contralto',
    'mezzo',
    'mezzo-soprano',
  ],
  category: 'musical_role',
  definition:
    'The second-highest vocal or instrumental part in ensemble writing, providing inner harmonic support between soprano and tenor.',
  semantics: {
    type: 'entity',
    entityType: 'harmony',
    role: 'alto',
    layer_affinity: ['vocal', 'harmony'],
    selectional_restrictions: {
      can_modify: ['pitch', 'dynamics', 'articulation'],
      cannot_modify: ['bass_register'],
      typical_axes: ['warmth', 'tension'],
      register: 'mid_high',
    },
  },
  examples: [
    'The alto part needs more independence',
    'Add an alto harmony',
    'The alto should cross below the tenor here',
    'The contralto voice is too covered',
  ],
};

const TENOR_PART: DomainNounLexeme = {
  id: 'noun:role:tenor',
  term: 'tenor',
  variants: [
    'tenor part',
    'tenor voice',
    'tenor line',
    'second tenor',
    'high tenor',
  ],
  category: 'musical_role',
  definition:
    'The second-lowest vocal or instrumental part, providing critical inner harmonic support and occasional melodic interest in choral and ensemble writing.',
  semantics: {
    type: 'entity',
    entityType: 'harmony',
    role: 'tenor',
    layer_affinity: ['vocal', 'harmony'],
    selectional_restrictions: {
      can_modify: ['pitch', 'dynamics', 'articulation'],
      cannot_modify: ['extreme_registers'],
      typical_axes: ['warmth', 'tension', 'energy'],
      register: 'mid_low',
    },
  },
  examples: [
    'The tenor should carry the melody here',
    'Add a tenor line',
    'The tenor part is too low',
    'The second tenor needs more projection',
  ],
};

const BASS_VOICE: DomainNounLexeme = {
  id: 'noun:role:bass_voice',
  term: 'bass voice',
  variants: [
    'bass part',
    'bass singer',
    'baritone',
    'basso',
    'lowest voice',
    'bottom voice',
  ],
  category: 'musical_role',
  definition:
    'The lowest vocal or instrumental part, providing harmonic foundation and root movement in choral and ensemble writing.',
  semantics: {
    type: 'entity',
    entityType: 'harmony',
    role: 'bass_voice',
    layer_affinity: ['vocal', 'bass'],
    selectional_restrictions: {
      can_modify: ['pitch', 'dynamics', 'articulation'],
      cannot_modify: ['treble_register'],
      typical_axes: ['warmth', 'energy', 'tension'],
      register: 'low',
    },
  },
  examples: [
    'The bass voice should be more resonant',
    'Add a bass part',
    'The baritone should move to the root',
    'The lowest voice needs more weight',
  ],
};

// =============================================================================
// Export — All musical role lexemes from this batch
// =============================================================================

export const MUSICAL_ROLE_LEXEMES_BATCH3: readonly DomainNounLexeme[] = [
  // Gamelan and Southeast Asian
  BALUNGAN,
  PANERUSAN,
  KOTEKAN,
  COLOTOMIC,
  // Middle Eastern and Central Asian
  MAQAM_MELODY,
  OUD_PART,
  TAQSIM,
  DOUMBEK_PATTERN,
  // East Asian
  ERHU_PART,
  GUZHENG_PART,
  SHAMISEN_PART,
  KOTO_PART,
  TAIKO_PART,
  // Caribbean and Latin American
  STEEL_PAN,
  REGGAE_SKANK,
  DUB_ELEMENT,
  BOSSA_PATTERN,
  SAMBA_PATTERN,
  // Additional functional roles
  PEDAL_TONE,
  OBLIGATO,
  GROUND,
  POWER_CHORD,
  FINGERPICKING,
  STRUMMING,
  // Choir and vocal ensemble roles
  SOPRANO_PART,
  ALTO_PART,
  TENOR_PART,
  BASS_VOICE,
];

export default MUSICAL_ROLE_LEXEMES_BATCH3;

/**
 * Statistics for this batch.
 */
export function getMusicalRoleBatch3Stats(): {
  total: number;
  categories: Record<string, number>;
  totalVariants: number;
} {
  const categories: Record<string, number> = {};
  let totalVariants = 0;

  for (const lexeme of MUSICAL_ROLE_LEXEMES_BATCH3) {
    categories[lexeme.category] = (categories[lexeme.category] ?? 0) + 1;
    totalVariants += lexeme.variants.length;
  }

  return {
    total: MUSICAL_ROLE_LEXEMES_BATCH3.length,
    categories,
    totalVariants,
  };
}
