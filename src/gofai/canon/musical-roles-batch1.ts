/**
 * GOFAI Lexeme Classes — Musical Roles Batch 1
 *
 * Lexeme classes for musical roles (melody, bassline, hook, accompaniment,
 * countermelody, lead, rhythm section, etc.) with selectional restrictions.
 * These lexemes describe the functional roles that musical elements play
 * in an arrangement, spanning Western, jazz, world, electronic, and
 * orchestral traditions.
 *
 * Step 121 [NLP][Sem] of gofai_goalA.md — Batch 1 of N
 *
 * @module gofai/canon/musical-roles-batch1
 */

import type { DomainNounLexeme } from './types';

// =============================================================================
// Melodic Roles — Primary melodic lines and their variants
// =============================================================================

const MELODY: DomainNounLexeme = {
  id: 'noun:role:melody',
  term: 'melody',
  variants: ['melodic line', 'tune', 'melodic part', 'main melody', 'top line'],
  category: 'musical_role',
  definition:
    'The primary single-voice horizontal line that carries the main musical theme, typically the most prominent and memorable element of a piece.',
  semantics: {
    type: 'entity',
    entityType: 'melody',
    role: 'primary_melodic',
    layer_affinity: ['lead', 'vocal', 'solo'],
    selectional_restrictions: {
      can_modify: ['pitch', 'rhythm', 'articulation', 'dynamics', 'phrasing', 'register'],
      cannot_modify: ['mix_bus', 'master_output'],
      typical_axes: ['brightness', 'tension', 'intimacy', 'energy'],
    },
  },
  examples: [
    'Make the melody more legato',
    'Raise the melody an octave',
    'The melody should stand out more',
    'Simplify the melody in the verse',
  ],
};

const COUNTERMELODY: DomainNounLexeme = {
  id: 'noun:role:countermelody',
  term: 'countermelody',
  variants: [
    'counter melody',
    'counter-melody',
    'secondary melody',
    'obbligato',
    'descant',
    'counterpoint line',
    'counter line',
  ],
  category: 'musical_role',
  definition:
    'A secondary melodic line that complements the primary melody, often moving in contrary or oblique motion to create contrapuntal interest.',
  semantics: {
    type: 'entity',
    entityType: 'melody',
    role: 'secondary_melodic',
    layer_affinity: ['harmony', 'texture'],
    selectional_restrictions: {
      can_modify: ['pitch', 'rhythm', 'articulation', 'dynamics', 'register'],
      cannot_modify: ['mix_bus', 'master_output'],
      typical_axes: ['tension', 'complexity', 'brightness'],
      relationship: 'complementary_to_melody',
    },
  },
  examples: [
    'Add a countermelody in the chorus',
    'The countermelody is too busy',
    'Make the descant simpler',
    'The obbligato should weave around the main theme',
  ],
};

const LEAD: DomainNounLexeme = {
  id: 'noun:role:lead',
  term: 'lead',
  variants: [
    'lead line',
    'lead part',
    'lead voice',
    'lead instrument',
    'front line',
    'solo voice',
    'principal voice',
  ],
  category: 'musical_role',
  definition:
    'The most prominent musical voice at any given moment, typically carrying the melody or a featured solo. May switch between instruments/layers.',
  semantics: {
    type: 'entity',
    entityType: 'melody',
    role: 'lead',
    layer_affinity: ['lead', 'vocal', 'solo'],
    selectional_restrictions: {
      can_modify: ['pitch', 'rhythm', 'dynamics', 'articulation', 'timbre', 'effects'],
      cannot_modify: ['song_structure'],
      typical_axes: ['brightness', 'energy', 'intimacy', 'width'],
    },
  },
  examples: [
    'The lead should be more prominent',
    'Switch the lead to the synth',
    'Give the lead more reverb',
    'The lead line needs more variation',
  ],
};

const VOCAL: DomainNounLexeme = {
  id: 'noun:role:vocal',
  term: 'vocal',
  variants: [
    'vocals',
    'voice',
    'singing',
    'vocal line',
    'vocal part',
    'vocal track',
    'singer',
    'vox',
  ],
  category: 'musical_role',
  definition:
    'The sung melodic line, including lead vocals, backing vocals, and vocal harmonies. The human voice as a musical instrument in the arrangement.',
  semantics: {
    type: 'entity',
    entityType: 'melody',
    role: 'vocal',
    layer_affinity: ['vocal', 'lead'],
    selectional_restrictions: {
      can_modify: ['pitch', 'rhythm', 'dynamics', 'effects', 'panning', 'timing'],
      cannot_modify: ['midi_note_data'],
      typical_axes: ['intimacy', 'brightness', 'width', 'warmth'],
    },
  },
  examples: [
    'Make the vocals sit better in the mix',
    'The vocal needs more presence',
    'Add harmonies to the vocal',
    'The singing should be more intimate',
  ],
};

const LEAD_VOCAL: DomainNounLexeme = {
  id: 'noun:role:lead_vocal',
  term: 'lead vocal',
  variants: [
    'lead vocals',
    'main vocal',
    'main vocals',
    'lead singer',
    'lead vox',
    'main voice',
    'primary vocal',
  ],
  category: 'musical_role',
  definition:
    'The primary sung melodic line, typically carrying the main lyrical content and serving as the focal point of the arrangement.',
  semantics: {
    type: 'entity',
    entityType: 'melody',
    role: 'lead_vocal',
    layer_affinity: ['vocal', 'lead'],
    selectional_restrictions: {
      can_modify: ['pitch', 'rhythm', 'dynamics', 'effects', 'panning', 'timing', 'articulation'],
      cannot_modify: ['midi_note_data'],
      typical_axes: ['intimacy', 'brightness', 'warmth', 'presence'],
    },
  },
  examples: [
    'The lead vocal needs more compression',
    'Pull the lead vocal forward',
    'Add delay to the lead vocal',
    'The main vocal is getting buried',
  ],
};

const BACKING_VOCAL: DomainNounLexeme = {
  id: 'noun:role:backing_vocal',
  term: 'backing vocal',
  variants: [
    'backing vocals',
    'background vocal',
    'background vocals',
    'BVs',
    'BGVs',
    'back-up vocals',
    'backup vocals',
    'harmony vocals',
    'vocal harmonies',
    'choir',
    'chorus vocals',
  ],
  category: 'musical_role',
  definition:
    'Supporting vocal lines that harmonize with or echo the lead vocal, providing depth, texture, and harmonic richness.',
  semantics: {
    type: 'entity',
    entityType: 'melody',
    role: 'backing_vocal',
    layer_affinity: ['vocal', 'harmony'],
    selectional_restrictions: {
      can_modify: ['pitch', 'rhythm', 'dynamics', 'effects', 'panning', 'width', 'timing'],
      cannot_modify: ['midi_note_data'],
      typical_axes: ['width', 'warmth', 'intimacy', 'brightness'],
      relationship: 'supporting_to_lead_vocal',
    },
  },
  examples: [
    'Add more backing vocals in the chorus',
    'Widen the BVs',
    'The harmony vocals should be softer',
    'Pan the backing vocals wider',
  ],
};

const THEME: DomainNounLexeme = {
  id: 'noun:role:theme',
  term: 'theme',
  variants: [
    'main theme',
    'principal theme',
    'subject',
    'primary theme',
    'melodic theme',
    'thematic material',
    'motif',
    'leitmotif',
  ],
  category: 'musical_role',
  definition:
    'A recognizable melodic or rhythmic idea that forms the basis of a musical work or section, subject to development and variation.',
  semantics: {
    type: 'entity',
    entityType: 'melody',
    role: 'thematic',
    layer_affinity: ['lead', 'melody'],
    selectional_restrictions: {
      can_modify: ['pitch', 'rhythm', 'articulation', 'dynamics', 'instrumentation'],
      cannot_modify: ['mix_bus'],
      typical_axes: ['tension', 'energy', 'complexity'],
    },
  },
  examples: [
    'Develop the theme further in the bridge',
    'The main theme should return in the outro',
    'Simplify the motif',
    'Vary the leitmotif for the second verse',
  ],
};

const SOLO: DomainNounLexeme = {
  id: 'noun:role:solo',
  term: 'solo',
  variants: [
    'solo section',
    'solo part',
    'solo break',
    'improvisation',
    'improv',
    'cadenza',
    'solo passage',
  ],
  category: 'musical_role',
  definition:
    'A featured passage where a single instrument or voice is prominently showcased, often with improvisatory character.',
  semantics: {
    type: 'entity',
    entityType: 'melody',
    role: 'solo',
    layer_affinity: ['lead', 'solo'],
    selectional_restrictions: {
      can_modify: ['pitch', 'rhythm', 'dynamics', 'articulation', 'effects', 'register'],
      cannot_modify: ['song_structure'],
      typical_axes: ['energy', 'tension', 'brightness', 'complexity'],
    },
  },
  examples: [
    'Make the solo more intense',
    'The guitar solo needs more space',
    'Add a solo break after the second chorus',
    'The cadenza should build gradually',
  ],
};

// =============================================================================
// Bass Roles — Low-register harmonic/rhythmic foundations
// =============================================================================

const BASSLINE: DomainNounLexeme = {
  id: 'noun:role:bassline',
  term: 'bassline',
  variants: [
    'bass line',
    'bass part',
    'bass',
    'bottom end',
    'low end',
    'bass track',
    'bass pattern',
  ],
  category: 'musical_role',
  definition:
    'The lowest-register melodic/harmonic line providing both harmonic foundation and rhythmic drive. Bridges harmony and rhythm sections.',
  semantics: {
    type: 'entity',
    entityType: 'melody',
    role: 'bass',
    layer_affinity: ['bass'],
    selectional_restrictions: {
      can_modify: ['pitch', 'rhythm', 'dynamics', 'articulation', 'timbre', 'effects'],
      cannot_modify: ['song_structure'],
      typical_axes: ['energy', 'groove_tightness', 'warmth', 'tension'],
      register: 'low',
    },
  },
  examples: [
    'Make the bassline more groovy',
    'The bass should follow the kick more closely',
    'Simplify the bass part',
    'Add more movement to the low end',
  ],
};

const SUB_BASS: DomainNounLexeme = {
  id: 'noun:role:sub_bass',
  term: 'sub bass',
  variants: [
    'sub-bass',
    'subbass',
    'sub',
    'subs',
    'low frequency foundation',
    'sub layer',
    'deep bass',
  ],
  category: 'musical_role',
  definition:
    'An extremely low-frequency bass element (typically below ~100Hz) providing fundamental weight and physical impact, common in electronic and hip-hop production.',
  semantics: {
    type: 'entity',
    entityType: 'melody',
    role: 'sub_bass',
    layer_affinity: ['bass'],
    selectional_restrictions: {
      can_modify: ['pitch', 'dynamics', 'timbre', 'effects'],
      cannot_modify: ['song_structure', 'high_frequency_content'],
      typical_axes: ['energy', 'warmth'],
      register: 'sub_low',
      frequency_range: [20, 100],
    },
  },
  examples: [
    'Add more sub bass in the drop',
    'The sub needs to hit harder',
    'Roll off the sub in the verse',
    'Make the sub bass more present',
  ],
};

const WALKING_BASS: DomainNounLexeme = {
  id: 'noun:role:walking_bass',
  term: 'walking bass',
  variants: [
    'walking bassline',
    'walking bass line',
    'walking bass pattern',
    'stepwise bass',
  ],
  category: 'musical_role',
  definition:
    'A bass style common in jazz and blues where the bass moves primarily in stepwise motion (scales/chromatic passing tones) through chord changes, one note per beat.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'bass_style',
    tradition: 'jazz',
    mapping: {
      role: 'bass',
      style: 'walking',
      typical_rhythm: 'quarter_notes',
      motion: 'stepwise',
    },
  },
  examples: [
    'Add a walking bass to the jazz section',
    'Make the bass a walking bass line',
    'The walking bass should be more chromatic',
  ],
};

const PEDAL_BASS: DomainNounLexeme = {
  id: 'noun:role:pedal_bass',
  term: 'pedal bass',
  variants: [
    'pedal tone',
    'pedal point',
    'drone bass',
    'organ point',
    'sustained bass',
    'held bass',
  ],
  category: 'musical_role',
  definition:
    'A sustained or repeated bass note held while harmonies change above it, creating tension and release. Common in classical, ambient, and electronic music.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'bass_style',
    mapping: {
      role: 'bass',
      style: 'pedal',
      motion: 'static',
      tension_effect: 'sustained',
    },
  },
  examples: [
    'Add a pedal bass under the bridge',
    'Hold a pedal point on the tonic',
    'The drone bass should sustain through the transition',
  ],
};

// =============================================================================
// Hook and Riff Roles — Memorable, repeating musical figures
// =============================================================================

const HOOK: DomainNounLexeme = {
  id: 'noun:role:hook',
  term: 'hook',
  variants: [
    'the hook',
    'main hook',
    'chorus hook',
    'melodic hook',
    'instrumental hook',
    'earworm',
  ],
  category: 'musical_role',
  definition:
    'A short, memorable musical phrase designed to catch the listener\'s attention and remain in memory. The most commercially important melodic element.',
  semantics: {
    type: 'entity',
    entityType: 'melody',
    role: 'hook',
    layer_affinity: ['lead', 'vocal', 'melody'],
    selectional_restrictions: {
      can_modify: ['pitch', 'rhythm', 'dynamics', 'articulation', 'timbre', 'effects'],
      cannot_modify: ['song_structure'],
      typical_axes: ['energy', 'brightness', 'tension'],
      preservation_priority: 'high',
    },
  },
  examples: [
    'Make the hook catchier',
    'The hook needs to stand out more',
    'Keep the hook but change everything else',
    'The instrumental hook should be louder',
  ],
};

const RIFF: DomainNounLexeme = {
  id: 'noun:role:riff',
  term: 'riff',
  variants: [
    'guitar riff',
    'main riff',
    'signature riff',
    'lick',
    'figure',
    'repeated figure',
    'ostinato figure',
  ],
  category: 'musical_role',
  definition:
    'A short, repeated melodic or rhythmic pattern that serves as a structural and textural foundation, especially in rock, funk, and blues.',
  semantics: {
    type: 'entity',
    entityType: 'melody',
    role: 'riff',
    layer_affinity: ['lead', 'rhythm'],
    selectional_restrictions: {
      can_modify: ['pitch', 'rhythm', 'dynamics', 'articulation', 'timbre', 'effects'],
      cannot_modify: ['song_structure'],
      typical_axes: ['energy', 'groove_tightness', 'tension'],
    },
  },
  examples: [
    'Make the riff heavier',
    'The guitar riff should be tighter',
    'Simplify the main riff',
    'The lick needs more attitude',
  ],
};

const OSTINATO: DomainNounLexeme = {
  id: 'noun:role:ostinato',
  term: 'ostinato',
  variants: [
    'repeating pattern',
    'repeated motif',
    'loop',
    'vamp',
    'repeated figure',
    'cycle',
    'ground bass',
    'basso ostinato',
  ],
  category: 'musical_role',
  definition:
    'A persistently repeated melodic, rhythmic, or harmonic pattern that provides continuity and hypnotic quality. Found across classical, minimalist, African, Indian, and electronic traditions.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'repetition_pattern',
    mapping: {
      role: 'ostinato',
      repetition: 'persistent',
      traditions: ['classical', 'minimalist', 'electronic', 'african', 'indian'],
    },
  },
  examples: [
    'Add an ostinato pattern in the strings',
    'The ostinato should evolve subtly',
    'Keep the vamp going through the solo',
    'Make the ground bass more prominent',
  ],
};

const FILL: DomainNounLexeme = {
  id: 'noun:role:fill',
  term: 'fill',
  variants: [
    'drum fill',
    'musical fill',
    'transitional fill',
    'pickup',
    'lead-in',
    'turnaround',
  ],
  category: 'musical_role',
  definition:
    'A brief musical passage that bridges sections, adds variety, or signals transitions. Often improvised or semi-improvised.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'transitional',
    mapping: {
      role: 'fill',
      function: 'transition',
      duration: 'brief',
      typical_placement: ['section_boundary', 'phrase_end'],
    },
  },
  examples: [
    'Add a drum fill before the chorus',
    'The fill into the bridge should be bigger',
    'Keep the fills simple',
    'Add a turnaround at the end of the verse',
  ],
};

// =============================================================================
// Accompaniment Roles — Supporting harmonic and rhythmic textures
// =============================================================================

const ACCOMPANIMENT: DomainNounLexeme = {
  id: 'noun:role:accompaniment',
  term: 'accompaniment',
  variants: [
    'backing',
    'backing track',
    'support',
    'comping',
    'comp',
    'accompaniment part',
    'background',
    'bed',
    'musical bed',
  ],
  category: 'musical_role',
  definition:
    'The musical elements that support the lead/melody, including chords, rhythmic patterns, and textural layers that form the harmonic and rhythmic bed.',
  semantics: {
    type: 'entity',
    entityType: 'harmony',
    role: 'accompaniment',
    layer_affinity: ['harmony', 'rhythm', 'texture'],
    selectional_restrictions: {
      can_modify: ['harmony', 'rhythm', 'dynamics', 'voicing', 'density', 'register', 'timbre'],
      cannot_modify: ['melody_content'],
      typical_axes: ['energy', 'tension', 'width', 'warmth', 'complexity'],
      relationship: 'supporting_to_lead',
    },
  },
  examples: [
    'Simplify the accompaniment',
    'The backing should be less busy',
    'Make the comping more rhythmic',
    'The musical bed needs more warmth',
  ],
};

const PAD: DomainNounLexeme = {
  id: 'noun:role:pad',
  term: 'pad',
  variants: [
    'synth pad',
    'string pad',
    'sustain pad',
    'atmospheric pad',
    'wash',
    'ambient pad',
    'textural pad',
    'drone pad',
  ],
  category: 'musical_role',
  definition:
    'A sustained harmonic texture with soft attack and long release, providing ambient harmonic fill and warmth beneath other elements.',
  semantics: {
    type: 'entity',
    entityType: 'texture',
    role: 'pad',
    layer_affinity: ['harmony', 'texture'],
    selectional_restrictions: {
      can_modify: ['harmony', 'timbre', 'dynamics', 'width', 'effects', 'register'],
      cannot_modify: ['rhythmic_detail'],
      typical_axes: ['warmth', 'width', 'brightness', 'intimacy'],
    },
  },
  examples: [
    'Add a warm pad in the verse',
    'The synth pad is too bright',
    'Make the pad wider',
    'The string pad should swell in the chorus',
  ],
};

const CHORD_PART: DomainNounLexeme = {
  id: 'noun:role:chord_part',
  term: 'chord part',
  variants: [
    'chords',
    'chord track',
    'chord progression',
    'harmonic part',
    'harmony part',
    'changes',
    'chord changes',
    'rhythm guitar',
    'keys',
    'piano part',
  ],
  category: 'musical_role',
  definition:
    'The harmonic element of the arrangement providing chord progressions and voicings. May be played by guitar, keys, or any polyphonic instrument.',
  semantics: {
    type: 'entity',
    entityType: 'harmony',
    role: 'chordal',
    layer_affinity: ['harmony'],
    selectional_restrictions: {
      can_modify: ['harmony', 'voicing', 'rhythm', 'dynamics', 'register', 'timbre', 'density'],
      cannot_modify: ['melody_content'],
      typical_axes: ['tension', 'warmth', 'complexity', 'brightness'],
    },
  },
  examples: [
    'Simplify the chord progression',
    'Make the chords jazzier',
    'The rhythm guitar should be less busy',
    'Change the chord voicings to be more open',
  ],
};

const ARPEGGIO_PART: DomainNounLexeme = {
  id: 'noun:role:arpeggio',
  term: 'arpeggio',
  variants: [
    'arpeggiated part',
    'arp',
    'arpeggiation',
    'broken chord',
    'rolled chord',
    'arpeggio pattern',
    'sequenced arp',
  ],
  category: 'musical_role',
  definition:
    'A part where chord tones are played in sequence rather than simultaneously, creating motion and rhythmic interest from harmonic material.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'harmonic_motion',
    mapping: {
      role: 'arpeggio',
      chord_handling: 'sequential',
      typical_layer: 'harmony',
      creates: ['motion', 'rhythm', 'texture'],
    },
  },
  examples: [
    'Add an arpeggiated part over the chords',
    'Make the arp faster',
    'The arpeggio should span two octaves',
    'Simplify the arp pattern',
  ],
};

const STAB: DomainNounLexeme = {
  id: 'noun:role:stab',
  term: 'stab',
  variants: [
    'chord stab',
    'stabs',
    'hit',
    'hits',
    'accent chord',
    'rhythmic hit',
    'brass stab',
    'horn stab',
    'synth stab',
  ],
  category: 'musical_role',
  definition:
    'Short, sharp chordal accents placed at specific rhythmic points for emphasis. Common in funk, disco, electronic, and brass arrangements.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'rhythmic_accent',
    mapping: {
      role: 'stab',
      duration: 'short',
      function: 'rhythmic_accent',
      traditions: ['funk', 'disco', 'electronic', 'brass_band'],
    },
  },
  examples: [
    'Add horn stabs on the offbeats',
    'The chord stabs should be tighter',
    'Make the stabs punchier',
    'Put synth stabs on beats 2 and 4',
  ],
};

// =============================================================================
// Rhythm Section Roles — Drums, percussion, and groove elements
// =============================================================================

const RHYTHM_SECTION: DomainNounLexeme = {
  id: 'noun:role:rhythm_section',
  term: 'rhythm section',
  variants: [
    'rhythm',
    'rhythmic foundation',
    'groove section',
    'rhythm track',
    'the beat',
    'drums and bass',
  ],
  category: 'musical_role',
  definition:
    'The collective group of instruments providing rhythmic and harmonic foundation — typically drums, bass, and chordal instruments (guitar/keys).',
  semantics: {
    type: 'entity',
    entityType: 'rhythm',
    role: 'rhythm_section',
    layer_affinity: ['rhythm', 'bass', 'harmony'],
    selectional_restrictions: {
      can_modify: ['rhythm', 'dynamics', 'groove', 'density', 'feel', 'swing'],
      cannot_modify: ['melody_content'],
      typical_axes: ['groove_tightness', 'energy', 'tension'],
    },
  },
  examples: [
    'Make the rhythm section tighter',
    'The rhythm needs more groove',
    'Simplify the rhythm section',
    'The beat should be more driving',
  ],
};

const DRUM_PART: DomainNounLexeme = {
  id: 'noun:role:drum_part',
  term: 'drum part',
  variants: [
    'drums',
    'drum track',
    'drum pattern',
    'drum beat',
    'beat',
    'percussion',
    'kit',
    'drum kit',
    'drumming',
  ],
  category: 'musical_role',
  definition:
    'The percussive rhythmic element of the arrangement, providing time-keeping, groove, and dynamic shape through struck instruments.',
  semantics: {
    type: 'entity',
    entityType: 'rhythm',
    role: 'drums',
    layer_affinity: ['rhythm'],
    selectional_restrictions: {
      can_modify: ['rhythm', 'dynamics', 'pattern', 'density', 'swing', 'timbre', 'effects'],
      cannot_modify: ['pitch_content', 'harmony'],
      typical_axes: ['groove_tightness', 'energy', 'complexity'],
    },
  },
  examples: [
    'Make the drums more driving',
    'Simplify the drum pattern',
    'The beat needs more swing',
    'Add more ghost notes to the drums',
  ],
};

const KICK_ROLE: DomainNounLexeme = {
  id: 'noun:role:kick',
  term: 'kick',
  variants: [
    'kick drum',
    'bass drum',
    'kick pattern',
    'four on the floor',
    'kick track',
  ],
  category: 'musical_role',
  definition:
    'The low-frequency drum providing rhythmic foundation and low-end impact. Central to groove definition and bass interaction.',
  semantics: {
    type: 'entity',
    entityType: 'rhythm',
    role: 'kick',
    layer_affinity: ['rhythm'],
    selectional_restrictions: {
      can_modify: ['rhythm', 'dynamics', 'timbre', 'tuning', 'effects'],
      cannot_modify: ['pitch_content', 'harmony'],
      typical_axes: ['energy', 'groove_tightness', 'warmth'],
      register: 'low',
    },
  },
  examples: [
    'Make the kick punchier',
    'The kick drum should be tighter',
    'Add a four on the floor kick pattern',
    'Side-chain the bass to the kick',
  ],
};

const SNARE_ROLE: DomainNounLexeme = {
  id: 'noun:role:snare',
  term: 'snare',
  variants: [
    'snare drum',
    'snare hit',
    'snare pattern',
    'backbeat',
    'rimshot',
    'rim click',
    'cross-stick',
    'snare track',
  ],
  category: 'musical_role',
  definition:
    'The mid-high percussive element providing backbeat emphasis and rhythmic punctuation. A primary determinant of genre feel and energy.',
  semantics: {
    type: 'entity',
    entityType: 'rhythm',
    role: 'snare',
    layer_affinity: ['rhythm'],
    selectional_restrictions: {
      can_modify: ['rhythm', 'dynamics', 'timbre', 'tuning', 'effects'],
      cannot_modify: ['pitch_content', 'harmony'],
      typical_axes: ['energy', 'brightness', 'groove_tightness'],
    },
  },
  examples: [
    'Make the snare crack more',
    'Add ghost notes around the snare',
    'The backbeat should be heavier',
    'Use a rimshot instead of a full snare',
  ],
};

const HI_HAT_ROLE: DomainNounLexeme = {
  id: 'noun:role:hi_hat',
  term: 'hi-hat',
  variants: [
    'hi-hats',
    'hats',
    'hihat',
    'hi hat',
    'hat pattern',
    'hat track',
    'closed hat',
    'open hat',
  ],
  category: 'musical_role',
  definition:
    'The high-frequency rhythmic element providing subdivision, groove feel, and dynamic nuance through varying degrees of openness and velocity.',
  semantics: {
    type: 'entity',
    entityType: 'rhythm',
    role: 'hi_hat',
    layer_affinity: ['rhythm'],
    selectional_restrictions: {
      can_modify: ['rhythm', 'dynamics', 'pattern', 'openness', 'effects'],
      cannot_modify: ['pitch_content', 'harmony'],
      typical_axes: ['energy', 'brightness', 'groove_tightness', 'complexity'],
      register: 'high',
    },
  },
  examples: [
    'Make the hats busier',
    'Open the hi-hats on the offbeats',
    'Simplify the hat pattern',
    'The hi-hats should be more subtle',
  ],
};

const PERCUSSION_ROLE: DomainNounLexeme = {
  id: 'noun:role:percussion',
  term: 'percussion',
  variants: [
    'perc',
    'auxiliary percussion',
    'hand percussion',
    'shakers',
    'tambourine',
    'congas',
    'bongos',
    'timbales',
    'percussion layer',
  ],
  category: 'musical_role',
  definition:
    'Non-kit percussive elements providing textural rhythmic interest and world music flavors — shakers, tambourines, congas, etc.',
  semantics: {
    type: 'entity',
    entityType: 'rhythm',
    role: 'percussion',
    layer_affinity: ['rhythm', 'texture'],
    selectional_restrictions: {
      can_modify: ['rhythm', 'dynamics', 'pattern', 'panning', 'effects', 'density'],
      cannot_modify: ['pitch_content', 'harmony'],
      typical_axes: ['energy', 'complexity', 'width', 'groove_tightness'],
    },
  },
  examples: [
    'Add some percussion in the chorus',
    'The congas should be more prominent',
    'Layer some shakers in',
    'The hand percussion needs more swing',
  ],
};

const GROOVE: DomainNounLexeme = {
  id: 'noun:role:groove',
  term: 'groove',
  variants: [
    'the groove',
    'feel',
    'pocket',
    'swing feel',
    'rhythmic feel',
    'in the pocket',
    'time feel',
  ],
  category: 'musical_role',
  definition:
    'The overall rhythmic feel created by the interaction of all rhythmic elements. An emergent property of timing, dynamics, and pattern relationships.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'rhythmic_feel',
    mapping: {
      role: 'groove',
      emergent_from: ['drums', 'bass', 'rhythm_section'],
      modifiable_properties: ['swing', 'tightness', 'syncopation', 'push_pull'],
    },
  },
  examples: [
    'The groove needs to be tighter',
    'Make it more in the pocket',
    'The feel should be more relaxed',
    'Add more swing to the groove',
  ],
};

// =============================================================================
// Textural and Atmospheric Roles
// =============================================================================

const TEXTURE: DomainNounLexeme = {
  id: 'noun:role:texture',
  term: 'texture',
  variants: [
    'musical texture',
    'textural element',
    'ambient texture',
    'sonic texture',
    'atmosphere',
    'ambience',
    'ambient layer',
    'soundscape',
  ],
  category: 'musical_role',
  definition:
    'Non-melodic, non-harmonic sonic elements that add depth, space, and atmosphere to the arrangement. Includes noise, ambient sounds, and processed layers.',
  semantics: {
    type: 'entity',
    entityType: 'texture',
    role: 'texture',
    layer_affinity: ['texture'],
    selectional_restrictions: {
      can_modify: ['timbre', 'dynamics', 'width', 'effects', 'density', 'pitch_range'],
      cannot_modify: ['melody_content', 'chord_progression'],
      typical_axes: ['width', 'brightness', 'warmth', 'intimacy'],
    },
  },
  examples: [
    'Add more texture in the verse',
    'The atmosphere should be darker',
    'Make the soundscape wider',
    'The ambient layer is too busy',
  ],
};

const DRONE: DomainNounLexeme = {
  id: 'noun:role:drone',
  term: 'drone',
  variants: [
    'drone note',
    'sustained drone',
    'tanpura',
    'bordun',
    'bourdon',
    'continuous tone',
    'tonal center',
  ],
  category: 'musical_role',
  definition:
    'A continuously sustained pitch or chord providing tonal grounding. Found in Indian classical (tanpura), medieval (bourdon), bagpipe, and ambient music traditions.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'sustained_element',
    mapping: {
      role: 'drone',
      function: 'tonal_anchor',
      traditions: ['indian_classical', 'medieval', 'celtic', 'ambient', 'minimalist'],
      typical_register: 'low_to_mid',
    },
  },
  examples: [
    'Add a drone under the melody',
    'The tanpura should be more present',
    'Use a drone to ground the harmonic changes',
    'The bordun should fade in gradually',
  ],
};

const FX_LAYER: DomainNounLexeme = {
  id: 'noun:role:fx_layer',
  term: 'FX layer',
  variants: [
    'effects layer',
    'sound effects',
    'SFX',
    'FX',
    'risers',
    'sweeps',
    'impacts',
    'transitions',
    'noise sweep',
    'white noise',
  ],
  category: 'musical_role',
  definition:
    'Non-musical sound design elements used for transitions, emphasis, and energy manipulation — risers, impacts, sweeps, and noise layers.',
  semantics: {
    type: 'entity',
    entityType: 'texture',
    role: 'fx',
    layer_affinity: ['texture'],
    selectional_restrictions: {
      can_modify: ['timbre', 'dynamics', 'timing', 'effects', 'pitch_range'],
      cannot_modify: ['harmony', 'melody_content'],
      typical_axes: ['energy', 'tension', 'brightness'],
    },
  },
  examples: [
    'Add a riser before the drop',
    'The impact needs more weight',
    'Sweep into the chorus',
    'The FX layer is too loud',
  ],
};

// =============================================================================
// Orchestral and Ensemble Roles
// =============================================================================

const STRINGS_SECTION: DomainNounLexeme = {
  id: 'noun:role:strings',
  term: 'strings',
  variants: [
    'string section',
    'string ensemble',
    'string arrangement',
    'violins',
    'violas',
    'cellos',
    'string pad',
    'orchestral strings',
  ],
  category: 'musical_role',
  definition:
    'The string instrument section (violin, viola, cello, double bass) providing melodic lines, harmonic fill, counterpoint, and textural sustain.',
  semantics: {
    type: 'entity',
    entityType: 'instrument',
    role: 'strings',
    layer_affinity: ['harmony', 'melody', 'texture'],
    selectional_restrictions: {
      can_modify: ['pitch', 'rhythm', 'dynamics', 'articulation', 'voicing', 'register', 'timbre'],
      cannot_modify: ['drum_patterns'],
      typical_axes: ['warmth', 'tension', 'intimacy', 'width', 'energy'],
    },
  },
  examples: [
    'Add strings in the chorus',
    'The string arrangement should swell here',
    'Make the violins more prominent',
    'The cellos should play the countermelody',
  ],
};

const BRASS_SECTION: DomainNounLexeme = {
  id: 'noun:role:brass',
  term: 'brass',
  variants: [
    'brass section',
    'horns',
    'horn section',
    'brass arrangement',
    'trumpets',
    'trombones',
    'french horns',
    'brass ensemble',
  ],
  category: 'musical_role',
  definition:
    'The brass instrument section (trumpet, trombone, French horn, tuba) providing powerful melodic lines, harmonic stabs, and fanfare-like energy.',
  semantics: {
    type: 'entity',
    entityType: 'instrument',
    role: 'brass',
    layer_affinity: ['melody', 'harmony'],
    selectional_restrictions: {
      can_modify: ['pitch', 'rhythm', 'dynamics', 'articulation', 'voicing', 'register'],
      cannot_modify: ['drum_patterns'],
      typical_axes: ['energy', 'brightness', 'tension', 'warmth'],
    },
  },
  examples: [
    'Add brass stabs in the chorus',
    'The horn section should be more powerful',
    'Bring in the trumpets for the last chorus',
    'The trombones should be warmer',
  ],
};

const WOODWINDS_SECTION: DomainNounLexeme = {
  id: 'noun:role:woodwinds',
  term: 'woodwinds',
  variants: [
    'woodwind section',
    'winds',
    'wind section',
    'flute',
    'clarinet',
    'oboe',
    'bassoon',
    'saxophone',
    'woodwind ensemble',
  ],
  category: 'musical_role',
  definition:
    'The woodwind instrument section (flute, clarinet, oboe, bassoon, saxophone) providing lyrical melodic lines, harmonic color, and timbral variety.',
  semantics: {
    type: 'entity',
    entityType: 'instrument',
    role: 'woodwinds',
    layer_affinity: ['melody', 'harmony', 'texture'],
    selectional_restrictions: {
      can_modify: ['pitch', 'rhythm', 'dynamics', 'articulation', 'register', 'timbre'],
      cannot_modify: ['drum_patterns'],
      typical_axes: ['brightness', 'warmth', 'intimacy', 'tension'],
    },
  },
  examples: [
    'Add a flute melody in the verse',
    'The clarinet should be more legato',
    'Bring in the oboe for the bridge',
    'The saxophone solo needs more expression',
  ],
};

// =============================================================================
// Export — All musical role lexemes from this batch
// =============================================================================

export const MUSICAL_ROLE_LEXEMES_BATCH1: readonly DomainNounLexeme[] = [
  // Melodic roles
  MELODY,
  COUNTERMELODY,
  LEAD,
  VOCAL,
  LEAD_VOCAL,
  BACKING_VOCAL,
  THEME,
  SOLO,
  // Bass roles
  BASSLINE,
  SUB_BASS,
  WALKING_BASS,
  PEDAL_BASS,
  // Hook and riff roles
  HOOK,
  RIFF,
  OSTINATO,
  FILL,
  // Accompaniment roles
  ACCOMPANIMENT,
  PAD,
  CHORD_PART,
  ARPEGGIO_PART,
  STAB,
  // Rhythm section roles
  RHYTHM_SECTION,
  DRUM_PART,
  KICK_ROLE,
  SNARE_ROLE,
  HI_HAT_ROLE,
  PERCUSSION_ROLE,
  GROOVE,
  // Textural and atmospheric roles
  TEXTURE,
  DRONE,
  FX_LAYER,
  // Orchestral roles
  STRINGS_SECTION,
  BRASS_SECTION,
  WOODWINDS_SECTION,
];

export default MUSICAL_ROLE_LEXEMES_BATCH1;

/**
 * Statistics for this batch.
 */
export function getMusicalRoleBatch1Stats(): {
  total: number;
  categories: Record<string, number>;
  totalVariants: number;
} {
  const categories: Record<string, number> = {};
  let totalVariants = 0;

  for (const lexeme of MUSICAL_ROLE_LEXEMES_BATCH1) {
    categories[lexeme.category] = (categories[lexeme.category] ?? 0) + 1;
    totalVariants += lexeme.variants.length;
  }

  return {
    total: MUSICAL_ROLE_LEXEMES_BATCH1.length,
    categories,
    totalVariants,
  };
}
