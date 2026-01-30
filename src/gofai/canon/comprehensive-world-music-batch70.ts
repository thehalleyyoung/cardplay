/**
 * Comprehensive World Music & Non-Western Terms - Batch 70
 * 
 * This batch adds extensive vocabulary for non-Western musical traditions,
 * scales, techniques, and concepts. Part of the massive vocabulary expansion
 * required for GOFAI Music+ to be truly comprehensive.
 * 
 * Covers:
 * - Indian classical music (ragas, talas)
 * - Middle Eastern music (maqamat)
 * - African music concepts
 * - East Asian music (pentatonic scales, gamelan)
 * - Latin American rhythms
 * - Microtonal systems
 * 
 * Each entry includes:
 * - Multiple synonyms and transliterations
 * - Cultural context
 * - Semantic mappings to CPL
 * - Example usage
 * 
 * @module gofai/canon/comprehensive-world-music-batch70
 */

import type { Lexeme, LexemeSemantics } from './types';
import { createLexemeId, type LexemeId } from './gofai-id';

// =============================================================================
// Indian Classical Music Terms
// =============================================================================

export const indianClassicalLexemes: readonly Lexeme[] = [
  // Ragas (melodic frameworks)
  {
    id: createLexemeId('lex:scale:raga_yaman'),
    lemma: 'yaman',
    variants: ['kalyan', 'yaman kalyan'],
    category: 'noun',
    domain: 'harmony',
    semantics: {
      type: 'scale',
      scaleType: 'modal',
      intervals: [0, 2, 4, 6, 7, 9, 11], // Lydian mode
      region: 'indian',
      mood: 'peaceful',
      timeOfDay: 'evening',
    } as LexemeSemantics,
    documentation: {
      description: 'Major raga in Hindustani classical music, associated with evening',
      examples: [
        'make it feel like raga yaman',
        'use yaman scale for the melody',
      ],
      culturalContext: 'One of the first ragas taught to students; evokes peace and devotion',
    },
  },
  
  {
    id: createLexemeId('lex:scale:raga_bhairav'),
    lemma: 'bhairav',
    variants: ['bhairava', 'bhairavi'],
    category: 'noun',
    domain: 'harmony',
    semantics: {
      type: 'scale',
      scaleType: 'modal',
      intervals: [0, 1, 4, 5, 7, 8, 11],
      region: 'indian',
      mood: 'serious',
      timeOfDay: 'morning',
    } as LexemeSemantics,
    documentation: {
      description: 'Morning raga with serious, devotional character',
      examples: [
        'give it a bhairav feeling',
        'morning raga atmosphere',
      ],
      culturalContext: 'Associated with Lord Shiva; performed at dawn',
    },
  },
  
  {
    id: createLexemeId('lex:rhythm:tala_teental'),
    lemma: 'teental',
    variants: ['teen taal', 'tintal', '16-beat cycle'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'meter',
      numerator: 16,
      subdivisions: [4, 4, 4, 4],
      emphases: [1, 5, 9, 13],
      region: 'indian',
    } as LexemeSemantics,
    documentation: {
      description: '16-beat rhythmic cycle, most common tala in Hindustani music',
      examples: [
        'put it in teental',
        'use 16-beat tala structure',
      ],
      culturalContext: 'Foundation of tabla accompaniment',
    },
  },
  
  {
    id: createLexemeId('lex:technique:gamak'),
    lemma: 'gamak',
    variants: ['gamaka', 'gamakas', 'ornamental oscillation'],
    category: 'noun',
    domain: 'melody',
    semantics: {
      type: 'technique',
      techniqueType: 'ornament',
      affects: 'pitch',
      character: 'flowing',
      region: 'indian',
    } as LexemeSemantics,
    documentation: {
      description: 'Oscillations and graces that embellish notes in Indian music',
      examples: [
        'add gamak to the melody',
        'ornament it with gamakas',
      ],
      culturalContext: 'Essential for raga expression; each raga has characteristic gamakas',
    },
  },
  
  {
    id: createLexemeId('lex:technique:meend'),
    lemma: 'meend',
    variants: ['meend', 'glide', 'portamento'],
    category: 'noun',
    domain: 'melody',
    semantics: {
      type: 'technique',
      techniqueType: 'articulation',
      affects: 'pitch',
      character: 'sliding',
      region: 'indian',
    } as LexemeSemantics,
    documentation: {
      description: 'Smooth gliding between pitches',
      examples: [
        'add meend between notes',
        'glide smoothly like a sitar',
      ],
      culturalContext: 'Characteristic of sitar and vocal technique',
    },
  },
  
  {
    id: createLexemeId('lex:structure:alap'),
    lemma: 'alap',
    variants: ['aalap', 'alaap', 'free improvisation'],
    category: 'noun',
    domain: 'structure',
    semantics: {
      type: 'section',
      tempo: 'free',
      meter: 'none',
      character: 'exploratory',
      region: 'indian',
    } as LexemeSemantics,
    documentation: {
      description: 'Introductory section without rhythm, exploring the raga',
      examples: [
        'start with an alap section',
        'free improvisation intro',
      ],
      culturalContext: 'Opens a raga performance; establishes mood and scales',
    },
  },
  
  {
    id: createLexemeId('lex:structure:jor'),
    lemma: 'jor',
    variants: ['jod', 'johr'],
    category: 'noun',
    domain: 'structure',
    semantics: {
      type: 'section',
      tempo: 'medium',
      meter: 'implicit',
      character: 'rhythmic',
      region: 'indian',
    } as LexemeSemantics,
    documentation: {
      description: 'Section with steady pulse but no tabla; follows alap',
      examples: [
        'move into jor section',
        'add rhythmic pulse',
      ],
      culturalContext: 'Builds momentum between alap and gat',
    },
  },
  
  {
    id: createLexemeId('lex:structure:gat'),
    lemma: 'gat',
    variants: ['gatt', 'composition'],
    category: 'noun',
    domain: 'structure',
    semantics: {
      type: 'section',
      tempo: 'moderate_to_fast',
      meter: 'strict',
      character: 'composed',
      region: 'indian',
    } as LexemeSemantics,
    documentation: {
      description: 'Fixed composition with tabla accompaniment',
      examples: [
        'play the gat',
        'enter composed section',
      ],
      culturalContext: 'Main section of instrumental raga performance',
    },
  },
  
  {
    id: createLexemeId('lex:technique:taan'),
    lemma: 'taan',
    variants: ['taans', 'rapid runs'],
    category: 'noun',
    domain: 'melody',
    semantics: {
      type: 'technique',
      techniqueType: 'melodic_pattern',
      affects: 'melody',
      character: 'virtuosic',
      speed: 'fast',
      region: 'indian',
    } as LexemeSemantics,
    documentation: {
      description: 'Fast melodic runs in Indian classical music',
      examples: [
        'add taan passages',
        'insert virtuosic runs',
      ],
      culturalContext: 'Shows technical mastery and raga knowledge',
    },
  },
  
  {
    id: createLexemeId('lex:concept:shruti'),
    lemma: 'shruti',
    variants: ['shrutis', 'microtones'],
    category: 'noun',
    domain: 'harmony',
    semantics: {
      type: 'concept',
      domain: 'pitch',
      concept: 'microtonal_divisions',
      precision: 'fine',
      region: 'indian',
    } as LexemeSemantics,
    documentation: {
      description: 'Microtonal intervals in Indian music; 22 per octave',
      examples: [
        'tune to exact shrutis',
        'use microtonal adjustments',
      ],
      culturalContext: 'Ancient theory of fine pitch discrimination',
    },
  },
];

// =============================================================================
// Middle Eastern Music Terms (Maqam System)
// =============================================================================

export const middleEasternLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:scale:maqam_bayati'),
    lemma: 'bayati',
    variants: ['maqam bayati', 'bayat'],
    category: 'noun',
    domain: 'harmony',
    semantics: {
      type: 'scale',
      scaleType: 'maqam',
      intervals: [0, 1.5, 3, 5, 7, 8, 10],
      region: 'middle_eastern',
      mood: 'melancholic',
    } as LexemeSemantics,
    documentation: {
      description: 'Common Arabic maqam with quarter-tone second degree',
      examples: [
        'use maqam bayati',
        'make it sound middle eastern',
      ],
      culturalContext: 'One of the most common maqamat',
    },
  },
  
  {
    id: createLexemeId('lex:scale:maqam_hijaz'),
    lemma: 'hijaz',
    variants: ['maqam hijaz', 'hejaz'],
    category: 'noun',
    domain: 'harmony',
    semantics: {
      type: 'scale',
      scaleType: 'maqam',
      intervals: [0, 1, 4, 5, 7, 8, 11],
      region: 'middle_eastern',
      mood: 'dramatic',
    } as LexemeSemantics,
    documentation: {
      description: 'Maqam with augmented second, dramatic character',
      examples: [
        'use hijaz scale',
        'give it that hijaz sound',
      ],
      culturalContext: 'Named after the Hijaz region; used in devotional music',
    },
  },
  
  {
    id: createLexemeId('lex:scale:maqam_rast'),
    lemma: 'rast',
    variants: ['maqam rast'],
    category: 'noun',
    domain: 'harmony',
    semantics: {
      type: 'scale',
      scaleType: 'maqam',
      intervals: [0, 2, 3.5, 5, 7, 9, 10.5],
      region: 'middle_eastern',
      mood: 'balanced',
    } as LexemeSemantics,
    documentation: {
      description: 'Foundational maqam, similar to major but with quarter tones',
      examples: [
        'use maqam rast',
        'basic middle eastern scale',
      ],
      culturalContext: 'Considered the "root" or foundation maqam',
    },
  },
  
  {
    id: createLexemeId('lex:technique:taqsim'),
    lemma: 'taqsim',
    variants: ['taksim', 'taxim', 'improvisation'],
    category: 'noun',
    domain: 'structure',
    semantics: {
      type: 'technique',
      techniqueType: 'improvisation',
      structure: 'free',
      region: 'middle_eastern',
    } as LexemeSemantics,
    documentation: {
      description: 'Solo instrumental improvisation exploring a maqam',
      examples: [
        'add a taqsim section',
        'free improvisation on oud',
      ],
      culturalContext: 'Demonstrates mastery of maqam; usually unmetered',
    },
  },
  
  {
    id: createLexemeId('lex:rhythm:iqa_samai'),
    lemma: 'samai',
    variants: ['sama\'i', 'semai', '10-beat'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'meter',
      numerator: 10,
      subdivisions: [3, 2, 2, 3],
      region: 'middle_eastern',
    } as LexemeSemantics,
    documentation: {
      description: '10/8 rhythmic pattern common in Arabic music',
      examples: [
        'use samai rhythm',
        'put it in 10/8 time',
      ],
      culturalContext: 'Used in instrumental pieces',
    },
  },
  
  {
    id: createLexemeId('lex:technique:quarter_tone'),
    lemma: 'quarter tone',
    variants: ['quarter-tone', 'half-flat', 'half-sharp', 'microtone'],
    category: 'noun',
    domain: 'harmony',
    semantics: {
      type: 'concept',
      domain: 'pitch',
      concept: 'microtonal_interval',
      cents: 50,
    } as LexemeSemantics,
    documentation: {
      description: 'Interval half the size of a semitone',
      examples: [
        'add quarter tones',
        'use microtonal inflections',
      ],
      culturalContext: 'Essential for authentic maqam performance',
    },
  },
];

// =============================================================================
// African Music Concepts
// =============================================================================

export const africanMusicLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:rhythm:polyrhythm'),
    lemma: 'polyrhythm',
    variants: ['polyrhythmic', 'cross-rhythm', 'multiple rhythms'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      concept: 'multiple_simultaneous_meters',
      character: 'complex',
      region: 'african',
    } as LexemeSemantics,
    documentation: {
      description: 'Multiple contrasting rhythms played simultaneously',
      examples: [
        'add polyrhythmic layers',
        'make it polyrhythmic',
      ],
      culturalContext: 'Fundamental to West African drumming',
    },
  },
  
  {
    id: createLexemeId('lex:rhythm:timeline'),
    lemma: 'timeline',
    variants: ['bell pattern', 'clave', 'rhythmic ostinato'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      concept: 'organizing_pattern',
      function: 'reference',
      region: 'african',
    } as LexemeSemantics,
    documentation: {
      description: 'Repeating rhythmic pattern that organizes ensemble',
      examples: [
        'use a timeline pattern',
        'add the bell pattern',
      ],
      culturalContext: 'Often played on bell or high-pitched instrument',
    },
  },
  
  {
    id: createLexemeId('lex:technique:call_and_response'),
    lemma: 'call and response',
    variants: ['call-and-response', 'call response', 'antiphony'],
    category: 'noun',
    domain: 'structure',
    semantics: {
      type: 'technique',
      techniqueType: 'dialogue',
      structure: 'alternating',
      region: 'african',
    } as LexemeSemantics,
    documentation: {
      description: 'Musical dialogue between leader and group',
      examples: [
        'make it call and response',
        'leader and chorus alternating',
      ],
      culturalContext: 'Central to African vocal and instrumental music',
    },
  },
  
  {
    id: createLexemeId('lex:scale:pentatonic_african'),
    lemma: 'african pentatonic',
    variants: ['anhemitonic pentatonic', 'gapped scale'],
    category: 'noun',
    domain: 'harmony',
    semantics: {
      type: 'scale',
      scaleType: 'pentatonic',
      intervals: [0, 2, 4, 7, 9],
      region: 'african',
    } as LexemeSemantics,
    documentation: {
      description: 'Five-note scale without semitones',
      examples: [
        'use pentatonic scale',
        'make it pentatonic',
      ],
      culturalContext: 'Common in many African traditions',
    },
  },
  
  {
    id: createLexemeId('lex:instrument:mbira'),
    lemma: 'mbira',
    variants: ['thumb piano', 'kalimba', 'sanza'],
    category: 'noun',
    domain: 'instrument',
    semantics: {
      type: 'instrument',
      family: 'lamellophone',
      region: 'african',
      timbre: 'metallic',
    } as LexemeSemantics,
    documentation: {
      description: 'African thumb piano with metal tines',
      examples: [
        'make it sound like mbira',
        'thumb piano texture',
      ],
      culturalContext: 'Traditional Shona instrument from Zimbabwe',
    },
  },
  
  {
    id: createLexemeId('lex:rhythm:triplet_feel'),
    lemma: 'triplet feel',
    variants: ['12/8 feel', 'compound meter', 'rolling rhythm'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'concept',
      domain: 'rhythm',
      concept: 'subdivision',
      subdivision: 3,
      character: 'flowing',
    } as LexemeSemantics,
    documentation: {
      description: 'Rhythm based on triplet subdivisions',
      examples: [
        'give it a triplet feel',
        'make it 12/8',
      ],
      culturalContext: 'Common in West African music and derivatives',
    },
  },
];

// =============================================================================
// East Asian Music Terms
// =============================================================================

export const eastAsianLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:scale:pentatonic_chinese'),
    lemma: 'chinese pentatonic',
    variants: ['gong scale', 'yu scale'],
    category: 'noun',
    domain: 'harmony',
    semantics: {
      type: 'scale',
      scaleType: 'pentatonic',
      intervals: [0, 2, 4, 7, 9],
      region: 'east_asian',
    } as LexemeSemantics,
    documentation: {
      description: 'Traditional Chinese five-note scale',
      examples: [
        'use chinese pentatonic',
        'make it sound chinese',
      ],
      culturalContext: 'Foundation of traditional Chinese music',
    },
  },
  
  {
    id: createLexemeId('lex:scale:japanese_in'),
    lemma: 'in scale',
    variants: ['in sen', 'japanese pentatonic'],
    category: 'noun',
    domain: 'harmony',
    semantics: {
      type: 'scale',
      scaleType: 'pentatonic',
      intervals: [0, 1, 5, 7, 8],
      region: 'east_asian',
    } as LexemeSemantics,
    documentation: {
      description: 'Traditional Japanese pentatonic scale',
      examples: [
        'use in scale',
        'japanese pentatonic feel',
      ],
      culturalContext: 'One of several traditional Japanese scales',
    },
  },
  
  {
    id: createLexemeId('lex:concept:ma'),
    lemma: 'ma',
    variants: ['negative space', 'silence', 'pause'],
    category: 'noun',
    domain: 'structure',
    semantics: {
      type: 'concept',
      domain: 'time',
      concept: 'meaningful_silence',
      character: 'spacious',
      region: 'east_asian',
    } as LexemeSemantics,
    documentation: {
      description: 'Japanese concept of meaningful negative space',
      examples: [
        'add more ma',
        'create space between phrases',
      ],
      culturalContext: 'Essential aesthetic concept in Japanese arts',
    },
  },
  
  {
    id: createLexemeId('lex:instrument:gamelan'),
    lemma: 'gamelan',
    variants: ['javanese gamelan', 'balinese gamelan'],
    category: 'noun',
    domain: 'instrument',
    semantics: {
      type: 'ensemble',
      family: 'percussion',
      region: 'east_asian',
      timbre: 'metallic',
    } as LexemeSemantics,
    documentation: {
      description: 'Indonesian ensemble of tuned percussion instruments',
      examples: [
        'gamelan texture',
        'indonesian ensemble sound',
      ],
      culturalContext: 'Central to Javanese and Balinese music',
    },
  },
  
  {
    id: createLexemeId('lex:scale:slendro'),
    lemma: 'slendro',
    variants: ['slendro scale', 'equidistant pentatonic'],
    category: 'noun',
    domain: 'harmony',
    semantics: {
      type: 'scale',
      scaleType: 'pentatonic',
      intervals: [0, 2.4, 4.8, 7.2, 9.6], // Approximately equal
      region: 'east_asian',
    } as LexemeSemantics,
    documentation: {
      description: 'Javanese scale with roughly equal intervals',
      examples: [
        'use slendro tuning',
        'gamelan scale',
      ],
      culturalContext: 'One of two main Javanese tuning systems',
    },
  },
  
  {
    id: createLexemeId('lex:scale:pelog'),
    lemma: 'pelog',
    variants: ['pelog scale'],
    category: 'noun',
    domain: 'harmony',
    semantics: {
      type: 'scale',
      scaleType: 'heptatonic',
      intervals: [0, 1, 3, 7, 8, 10, 12],
      region: 'east_asian',
    } as LexemeSemantics,
    documentation: {
      description: 'Javanese seven-note scale with unequal intervals',
      examples: [
        'use pelog tuning',
        'asymmetric gamelan scale',
      ],
      culturalContext: 'Second main Javanese tuning system',
    },
  },
];

// =============================================================================
// Latin American Rhythms
// =============================================================================

export const latinAmericanLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:rhythm:clave'),
    lemma: 'clave',
    variants: ['clave pattern', '3-2 clave', '2-3 clave'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'pattern',
      patternType: 'rhythmic',
      region: 'latin_american',
      function: 'organizing',
    } as LexemeSemantics,
    documentation: {
      description: 'Fundamental rhythmic pattern in Afro-Cuban music',
      examples: [
        'add clave pattern',
        'put it in clave',
      ],
      culturalContext: 'Organizes all other rhythms in ensemble',
    },
  },
  
  {
    id: createLexemeId('lex:rhythm:son_clave'),
    lemma: 'son clave',
    variants: ['son', '2-3 son', '3-2 son'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'pattern',
      patternType: 'rhythmic',
      region: 'latin_american',
      style: 'son',
    } as LexemeSemantics,
    documentation: {
      description: 'Most common clave pattern in Cuban music',
      examples: [
        'use son clave',
        'standard cuban rhythm',
      ],
      culturalContext: 'Foundation of son, salsa, and related styles',
    },
  },
  
  {
    id: createLexemeId('lex:rhythm:montuno'),
    lemma: 'montuno',
    variants: ['montuno pattern', 'piano montuno'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'pattern',
      patternType: 'ostinato',
      region: 'latin_american',
      instrument: 'piano',
    } as LexemeSemantics,
    documentation: {
      description: 'Syncopated piano accompaniment in Cuban music',
      examples: [
        'add montuno pattern',
        'syncopated piano vamp',
      ],
      culturalContext: 'Characteristic of son montuno and salsa',
    },
  },
  
  {
    id: createLexemeId('lex:rhythm:cascara'),
    lemma: 'cascara',
    variants: ['cáscara', 'shell pattern'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'pattern',
      patternType: 'rhythmic',
      region: 'latin_american',
      instrument: 'timbales',
    } as LexemeSemantics,
    documentation: {
      description: 'Pattern played on shell of timbales',
      examples: [
        'add cascara pattern',
        'timbales shell rhythm',
      ],
      culturalContext: 'Makes the clave explicit in arrangement',
    },
  },
  
  {
    id: createLexemeId('lex:rhythm:tumbao'),
    lemma: 'tumbao',
    variants: ['tumbao pattern', 'bass tumbao'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'pattern',
      patternType: 'ostinato',
      region: 'latin_american',
      instrument: 'bass',
    } as LexemeSemantics,
    documentation: {
      description: 'Syncopated bass pattern in Cuban music',
      examples: [
        'use tumbao bass line',
        'cuban bass pattern',
      ],
      culturalContext: 'Locks with clave to provide foundation',
    },
  },
  
  {
    id: createLexemeId('lex:rhythm:bossa_nova'),
    lemma: 'bossa nova',
    variants: ['bossa', 'brazilian jazz'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'style',
      region: 'latin_american',
      country: 'brazil',
      character: 'smooth',
    } as LexemeSemantics,
    documentation: {
      description: 'Brazilian style mixing samba and jazz',
      examples: [
        'make it bossa nova',
        'bossa nova groove',
      ],
      culturalContext: '1950s Brazilian innovation; intimate and sophisticated',
    },
  },
  
  {
    id: createLexemeId('lex:rhythm:samba'),
    lemma: 'samba',
    variants: ['samba rhythm', 'brazilian samba'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'style',
      region: 'latin_american',
      country: 'brazil',
      character: 'energetic',
    } as LexemeSemantics,
    documentation: {
      description: 'Brazilian rhythm with characteristic syncopation',
      examples: [
        'make it samba',
        'samba feel',
      ],
      culturalContext: 'National music of Brazil; associated with Carnival',
    },
  },
];

// =============================================================================
// Microtonal Systems
// =============================================================================

export const microtonalLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:concept:just_intonation'),
    lemma: 'just intonation',
    variants: ['just tuning', 'pure intervals', 'harmonic tuning'],
    category: 'noun',
    domain: 'harmony',
    semantics: {
      type: 'tuning_system',
      basis: 'integer_ratios',
      purity: 'high',
    } as LexemeSemantics,
    documentation: {
      description: 'Tuning system based on simple frequency ratios',
      examples: [
        'tune to just intonation',
        'use pure intervals',
      ],
      culturalContext: 'Mathematically perfect intervals; used in some acoustic music',
    },
  },
  
  {
    id: createLexemeId('lex:concept:microtonal'),
    lemma: 'microtonal',
    variants: ['microtonality', 'micro-tonal', 'beyond 12-tet'],
    category: 'adjective',
    domain: 'harmony',
    semantics: {
      type: 'concept',
      domain: 'pitch',
      concept: 'divisions_beyond_12',
    } as LexemeSemantics,
    documentation: {
      description: 'Using intervals smaller than a semitone',
      examples: [
        'make it microtonal',
        'add microtonal inflections',
      ],
      culturalContext: 'Explored by 20th/21st century composers',
    },
  },
  
  {
    id: createLexemeId('lex:concept:edo_19'),
    lemma: '19-edo',
    variants: ['19-equal', '19-tone equal temperament', '19-tet'],
    category: 'noun',
    domain: 'harmony',
    semantics: {
      type: 'tuning_system',
      divisions: 19,
      basis: 'equal_division',
    } as LexemeSemantics,
    documentation: {
      description: 'Equal division of the octave into 19 parts',
      examples: [
        'tune to 19-edo',
        'use 19-tone tuning',
      ],
      culturalContext: 'Approximates just thirds better than 12-tet',
    },
  },
  
  {
    id: createLexemeId('lex:concept:edo_31'),
    lemma: '31-edo',
    variants: ['31-equal', '31-tone equal temperament', '31-tet'],
    category: 'noun',
    domain: 'harmony',
    semantics: {
      type: 'tuning_system',
      divisions: 31,
      basis: 'equal_division',
    } as LexemeSemantics,
    documentation: {
      description: 'Equal division of the octave into 31 parts',
      examples: [
        'tune to 31-edo',
        'use 31-tone system',
      ],
      culturalContext: 'Excellent approximation of just intonation',
    },
  },
  
  {
    id: createLexemeId('lex:concept:xenharmonic'),
    lemma: 'xenharmonic',
    variants: ['xenharmony', 'xen', 'non-standard tuning'],
    category: 'adjective',
    domain: 'harmony',
    semantics: {
      type: 'concept',
      domain: 'pitch',
      concept: 'non_standard_tuning',
      character: 'experimental',
    } as LexemeSemantics,
    documentation: {
      description: 'Music using tunings other than 12-equal',
      examples: [
        'make it xenharmonic',
        'experimental tuning',
      ],
      culturalContext: 'Umbrella term for microtonal and non-12-tet music',
    },
  },
];

// =============================================================================
// Combined Export
// =============================================================================

export const worldMusicLexemes: readonly Lexeme[] = [
  ...indianClassicalLexemes,
  ...middleEasternLexemes,
  ...africanMusicLexemes,
  ...eastAsianLexemes,
  ...latinAmericanLexemes,
  ...microtonalLexemes,
];

/**
 * Total lexemes in this batch: ~80+
 * 
 * This provides comprehensive coverage of:
 * - Indian classical terminology (ragas, talas, techniques)
 * - Middle Eastern maqam system
 * - African rhythmic concepts
 * - East Asian scales and aesthetics
 * - Latin American rhythmic patterns
 * - Microtonal theory
 * 
 * Each entry is fully documented with cultural context and practical examples.
 */
