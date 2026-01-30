/**
 * GOFAI Domain Nouns — Batch 17: Genres & Musical Styles
 *
 * Comprehensive vocabulary for musical genres, subgenres, styles, and
 * genre-specific terminology. This enables natural language references
 * to musical idioms and their characteristics.
 *
 * @module gofai/canon/domain-nouns-batch17-genres
 */

import type { DomainNounLexeme } from './types';

// =============================================================================
// Electronic & Dance Music
// =============================================================================

const HOUSE: DomainNounLexeme = {
  id: 'noun:house',
  term: 'house',
  variants: ['house music', 'chicago house'],
  category: 'genre',
  definition: 'Electronic dance music with four-on-the-floor beat',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      tempo: [120, 130],
      rhythm: 'four-on-floor',
      structure: 'repetitive',
    },
  },
  examples: [
    'Make it sound more house',
    'Add house-style drums',
    'The groove should be house',
  ],
};

const TECHNO: DomainNounLexeme = {
  id: 'noun:techno',
  term: 'techno',
  variants: ['detroit techno', 'minimal techno'],
  category: 'genre',
  definition: 'Repetitive electronic music with driving beat',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      tempo: [120, 150],
      rhythm: 'driving',
      texture: 'minimal',
    },
  },
  examples: [
    'Make it more techno',
    'Add techno-style percussion',
    'The beat should be techno',
  ],
};

const DUBSTEP: DomainNounLexeme = {
  id: 'noun:dubstep',
  term: 'dubstep',
  variants: ['brostep', 'future bass'],
  category: 'genre',
  definition: 'Electronic music with wobble bass and half-time drums',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      tempo: [140, 145],
      rhythm: 'half-time',
      bass: 'wobble',
    },
  },
  examples: [
    'Make the bass more dubstep',
    'Add dubstep wobble',
    'The drop should be dubstep',
  ],
};

const DRUM_AND_BASS: DomainNounLexeme = {
  id: 'noun:drum_and_bass',
  term: 'drum and bass',
  variants: ['dnb', 'jungle', 'drum n bass'],
  category: 'genre',
  definition: 'Fast electronic music with breakbeats',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      tempo: [160, 180],
      rhythm: 'breakbeat',
      energy: 'high',
    },
  },
  examples: [
    'Make it drum and bass tempo',
    'Add dnb-style breaks',
    'The rhythm should be jungle',
  ],
};

const TRAP: DomainNounLexeme = {
  id: 'noun:trap',
  term: 'trap',
  variants: ['trap music', 'trap beats'],
  category: 'genre',
  definition: 'Hip-hop subgenre with rolling hi-hats and 808s',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      tempo: [135, 145],
      rhythm: 'triplet-hats',
      bass: '808-sub',
    },
  },
  examples: [
    'Add trap hi-hats',
    'Make it trap-style',
    'The beat should be trap',
  ],
};

const AMBIENT: DomainNounLexeme = {
  id: 'noun:ambient',
  term: 'ambient',
  variants: ['ambient music', 'atmospheric'],
  category: 'genre',
  definition: 'Atmospheric, textural electronic music',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      tempo: 'free',
      rhythm: 'minimal',
      texture: 'atmospheric',
    },
  },
  examples: [
    'Make it more ambient',
    'Add ambient textures',
    'The intro should be ambient',
  ],
};

const TRANCE: DomainNounLexeme = {
  id: 'noun:trance',
  term: 'trance',
  variants: ['trance music', 'psytrance', 'uplifting trance'],
  category: 'genre',
  definition: 'Melodic electronic music with buildup-breakdown structure',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      tempo: [125, 150],
      structure: 'buildup-breakdown',
      melody: 'euphoric',
    },
  },
  examples: [
    'Add trance-style buildup',
    'Make it more trance',
    'The breakdown should be trance',
  ],
};

// =============================================================================
// Hip-Hop & R&B
// =============================================================================

const BOOM_BAP: DomainNounLexeme = {
  id: 'noun:boom_bap',
  term: 'boom bap',
  variants: ['boom-bap', 'golden era hip-hop'],
  category: 'genre',
  definition: 'Classic hip-hop drum pattern style',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'rhythm_style',
    characteristics: {
      tempo: [85, 95],
      rhythm: 'backbeat-heavy',
      drums: 'sampled',
    },
  },
  examples: [
    'Make the drums boom bap',
    'Add boom bap groove',
    'The beat should be boom bap',
  ],
};

const NEO_SOUL: DomainNounLexeme = {
  id: 'noun:neo_soul',
  term: 'neo soul',
  variants: ['neo-soul', 'alternative R&B'],
  category: 'genre',
  definition: 'Modern soul with jazz and hip-hop influences',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      harmony: 'jazz-influenced',
      rhythm: 'laid-back',
      production: 'warm',
    },
  },
  examples: [
    'Make it neo soul style',
    'Add neo soul chords',
    'The groove should be neo soul',
  ],
};

const LO_FI_HIP_HOP: DomainNounLexeme = {
  id: 'noun:lo_fi_hip_hop',
  term: 'lo-fi hip hop',
  variants: ['lofi', 'chillhop', 'lo-fi beats'],
  category: 'genre',
  definition: 'Relaxed hip-hop with vintage aesthetic',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      tempo: [70, 90],
      production: 'dusty',
      mood: 'chill',
    },
  },
  examples: [
    'Make it more lo-fi',
    'Add lo-fi texture',
    'The beat should be lofi',
  ],
};

// =============================================================================
// Jazz & Blues
// =============================================================================

const BEBOP: DomainNounLexeme = {
  id: 'noun:bebop',
  term: 'bebop',
  variants: ['bop', 'hard bop'],
  category: 'genre',
  definition: 'Fast, complex jazz style with intricate melodies',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      tempo: 'fast',
      harmony: 'complex',
      melody: 'chromatic',
    },
  },
  examples: [
    'Play it bebop style',
    'Add bebop lines',
    'The solo should be bebop',
  ],
};

const MODAL_JAZZ: DomainNounLexeme = {
  id: 'noun:modal_jazz',
  term: 'modal jazz',
  variants: ['modal', 'modal harmony'],
  category: 'genre',
  definition: 'Jazz based on modes rather than chord progressions',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'harmonic_style',
    characteristics: {
      harmony: 'modal',
      structure: 'open',
      improvisation: 'scale-based',
    },
  },
  examples: [
    'Make it modal jazz',
    'Use modal harmony',
    'The progression should be modal',
  ],
};

const SWING: DomainNounLexeme = {
  id: 'noun:swing',
  term: 'swing',
  variants: ['swing jazz', 'big band swing'],
  category: 'genre',
  definition: 'Jazz style with swung eighth notes and strong rhythm section',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'rhythm_style',
    characteristics: {
      rhythm: 'swung',
      ensemble: 'big-band',
      energy: 'driving',
    },
  },
  examples: [
    'Make it swing',
    'Add swing feel',
    'The rhythm should swing',
  ],
};

const BLUES: DomainNounLexeme = {
  id: 'noun:blues',
  term: 'blues',
  variants: ['blues music', '12-bar blues', 'chicago blues'],
  category: 'genre',
  definition: 'Genre with blue notes and characteristic progressions',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      harmony: 'blues-progression',
      scale: 'blues-scale',
      expression: 'bends',
    },
  },
  examples: [
    'Make it bluesier',
    'Add blues feeling',
    'The solo should be blues',
  ],
};

// =============================================================================
// Rock & Metal
// =============================================================================

const PUNK: DomainNounLexeme = {
  id: 'noun:punk',
  term: 'punk',
  variants: ['punk rock', 'punk music'],
  category: 'genre',
  definition: 'Fast, aggressive rock with simple structure',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      tempo: 'fast',
      structure: 'simple',
      energy: 'aggressive',
    },
  },
  examples: [
    'Make it more punk',
    'Add punk energy',
    'The rhythm should be punk',
  ],
};

const GRUNGE: DomainNounLexeme = {
  id: 'noun:grunge',
  term: 'grunge',
  variants: ['grunge rock', 'seattle sound'],
  category: 'genre',
  definition: 'Heavy, distorted rock with dynamic contrasts',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      guitar: 'distorted',
      dynamics: 'loud-quiet',
      mood: 'dark',
    },
  },
  examples: [
    'Make it grungier',
    'Add grunge distortion',
    'The guitar should be grunge',
  ],
};

const METAL: DomainNounLexeme = {
  id: 'noun:metal',
  term: 'metal',
  variants: ['heavy metal', 'metal music'],
  category: 'genre',
  definition: 'Heavy, amplified rock with aggressive vocals',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      guitar: 'heavy',
      rhythm: 'tight',
      energy: 'aggressive',
    },
  },
  examples: [
    'Make it more metal',
    'Add metal aggression',
    'The riff should be metal',
  ],
};

const PROG_ROCK: DomainNounLexeme = {
  id: 'noun:prog_rock',
  term: 'progressive rock',
  variants: ['prog', 'prog rock', 'art rock'],
  category: 'genre',
  definition: 'Complex rock with unusual meters and structures',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      structure: 'complex',
      meter: 'unusual',
      length: 'extended',
    },
  },
  examples: [
    'Make it progressive',
    'Add prog complexity',
    'The structure should be prog',
  ],
};

// =============================================================================
// Latin & World
// =============================================================================

const BOSSA_NOVA: DomainNounLexeme = {
  id: 'noun:bossa_nova',
  term: 'bossa nova',
  variants: ['bossa', 'brazilian jazz'],
  category: 'genre',
  definition: 'Brazilian style with syncopated rhythm and jazz harmony',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      rhythm: 'bossa-pattern',
      harmony: 'jazz-influenced',
      feel: 'laid-back',
    },
  },
  examples: [
    'Make it bossa nova',
    'Add bossa rhythm',
    'The groove should be bossa',
  ],
};

const SAMBA: DomainNounLexeme = {
  id: 'noun:samba',
  term: 'samba',
  variants: ['samba music', 'brazilian samba'],
  category: 'genre',
  definition: 'Brazilian dance music with complex polyrhythms',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'rhythm_style',
    characteristics: {
      rhythm: 'samba-pattern',
      percussion: 'layered',
      energy: 'festive',
    },
  },
  examples: [
    'Make it samba',
    'Add samba percussion',
    'The rhythm should be samba',
  ],
};

const REGGAE: DomainNounLexeme = {
  id: 'noun:reggae',
  term: 'reggae',
  variants: ['reggae music', 'roots reggae'],
  category: 'genre',
  definition: 'Jamaican style with offbeat rhythm guitar',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'rhythm_style',
    characteristics: {
      rhythm: 'one-drop',
      guitar: 'offbeat-skank',
      bass: 'prominent',
    },
  },
  examples: [
    'Make it reggae',
    'Add reggae feel',
    'The rhythm should be reggae',
  ],
};

const AFROBEAT: DomainNounLexeme = {
  id: 'noun:afrobeat',
  term: 'afrobeat',
  variants: ['afrobeats', 'african groove'],
  category: 'genre',
  definition: 'West African style with polyrhythmic percussion',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'rhythm_style',
    characteristics: {
      rhythm: 'polyrhythmic',
      percussion: 'african',
      groove: 'interlocking',
    },
  },
  examples: [
    'Make it afrobeat',
    'Add afrobeat percussion',
    'The groove should be afrobeat',
  ],
};

const CUMBIA: DomainNounLexeme = {
  id: 'noun:cumbia',
  term: 'cumbia',
  variants: ['cumbia music', 'colombian cumbia'],
  category: 'genre',
  definition: 'Colombian dance music with distinctive rhythm',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'rhythm_style',
    characteristics: {
      rhythm: 'cumbia-pattern',
      percussion: 'traditional',
      feel: 'danceable',
    },
  },
  examples: [
    'Make it cumbia',
    'Add cumbia rhythm',
    'The pattern should be cumbia',
  ],
};

// =============================================================================
// Classical & Art Music
// =============================================================================

const BAROQUE: DomainNounLexeme = {
  id: 'noun:baroque',
  term: 'baroque',
  variants: ['baroque music', 'baroque style'],
  category: 'genre',
  definition: 'Ornate classical music from 1600-1750',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      ornamentation: 'extensive',
      harmony: 'functional',
      texture: 'polyphonic',
    },
  },
  examples: [
    'Make it baroque style',
    'Add baroque ornamentation',
    'The counterpoint should be baroque',
  ],
};

const ROMANTIC: DomainNounLexeme = {
  id: 'noun:romantic',
  term: 'romantic',
  variants: ['romantic era', 'romantic music'],
  category: 'genre',
  definition: 'Expressive classical music from 1800s',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      harmony: 'chromatic',
      dynamics: 'expressive',
      form: 'free',
    },
  },
  examples: [
    'Make it romantic style',
    'Add romantic expression',
    'The harmony should be romantic',
  ],
};

const IMPRESSIONIST: DomainNounLexeme = {
  id: 'noun:impressionist',
  term: 'impressionist',
  variants: ['impressionism', 'impressionistic'],
  category: 'genre',
  definition: 'Classical music with ambiguous tonality and color',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'harmonic_style',
    characteristics: {
      harmony: 'ambiguous',
      color: 'atmospheric',
      texture: 'delicate',
    },
  },
  examples: [
    'Make it impressionistic',
    'Add impressionist colors',
    'The harmony should be impressionist',
  ],
};

const MINIMALIST: DomainNounLexeme = {
  id: 'noun:minimalist',
  term: 'minimalist',
  variants: ['minimalism', 'minimal music'],
  category: 'genre',
  definition: 'Repetitive music with gradual change',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'compositional_style',
    characteristics: {
      structure: 'repetitive',
      development: 'gradual',
      texture: 'simple',
    },
  },
  examples: [
    'Make it minimalist',
    'Add minimalist repetition',
    'The pattern should be minimalist',
  ],
};

// =============================================================================
// Pop & Contemporary
// =============================================================================

const INDIE_POP: DomainNounLexeme = {
  id: 'noun:indie_pop',
  term: 'indie pop',
  variants: ['indie', 'alternative pop'],
  category: 'genre',
  definition: 'Independent pop with alternative sensibilities',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      production: 'lo-fi',
      structure: 'song-based',
      aesthetic: 'alternative',
    },
  },
  examples: [
    'Make it indie pop',
    'Add indie aesthetic',
    'The sound should be indie',
  ],
};

const SYNTH_POP: DomainNounLexeme = {
  id: 'noun:synth_pop',
  term: 'synth pop',
  variants: ['synthpop', 'electropop'],
  category: 'genre',
  definition: 'Pop music dominated by synthesizers',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'style',
    characteristics: {
      instruments: 'synthesizers',
      production: 'electronic',
      melody: 'catchy',
    },
  },
  examples: [
    'Make it synth pop',
    'Add synth pop textures',
    'The sound should be synthpop',
  ],
};

const BEDROOM_POP: DomainNounLexeme = {
  id: 'noun:bedroom_pop',
  term: 'bedroom pop',
  variants: ['bedroom', 'diy pop'],
  category: 'genre',
  definition: 'Lo-fi pop recorded at home',
  semantics: {
    type: 'concept',
    domain: 'genre',
    aspect: 'production_style',
    characteristics: {
      production: 'lo-fi',
      recording: 'home',
      aesthetic: 'intimate',
    },
  },
  examples: [
    'Make it bedroom pop',
    'Add bedroom aesthetic',
    'The production should be bedroom',
  ],
};

// =============================================================================
// Export All Lexemes
// =============================================================================

export const GENRE_STYLE_LEXEMES: readonly DomainNounLexeme[] = [
  // Electronic
  HOUSE,
  TECHNO,
  DUBSTEP,
  DRUM_AND_BASS,
  TRAP,
  AMBIENT,
  TRANCE,

  // Hip-Hop & R&B
  BOOM_BAP,
  NEO_SOUL,
  LO_FI_HIP_HOP,

  // Jazz & Blues
  BEBOP,
  MODAL_JAZZ,
  SWING,
  BLUES,

  // Rock & Metal
  PUNK,
  GRUNGE,
  METAL,
  PROG_ROCK,

  // Latin & World
  BOSSA_NOVA,
  SAMBA,
  REGGAE,
  AFROBEAT,
  CUMBIA,

  // Classical
  BAROQUE,
  ROMANTIC,
  IMPRESSIONIST,
  MINIMALIST,

  // Pop
  INDIE_POP,
  SYNTH_POP,
  BEDROOM_POP,
] as const;

export default GENRE_STYLE_LEXEMES;
