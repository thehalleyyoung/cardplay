/**
 * Comprehensive Electronic Music & Genre Terminology - Batch 72
 * 
 * This batch adds extensive vocabulary for electronic music production,
 * covering multiple genres, techniques, and sonic aesthetics.
 * 
 * Covers:
 * - Electronic genres (house, techno, dubstep, drum & bass, etc.)
 * - Synthesis techniques and modulation
 * - Electronic production workflows
 * - Genre-specific terms and characteristics
 * - Sound movement and spatial effects
 * - Rhythmic and groove concepts
 * 
 * @module gofai/canon/comprehensive-electronic-music-batch72
 */

import type { Lexeme } from './types';
import { createLexemeId } from './types';

// =============================================================================
// House Music Terms
// =============================================================================

export const houseMusicLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('house'),
    lemma: 'house',
    variants: ['house music', 'chicago house', '4-on-the-floor'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'genre',
      tempo_range: [120, 130],
      characteristics: ['4-on-the-floor', 'repetitive', 'danceable'],
      origin: 'chicago',
      era: '1980s',
    },
    description: 'Electronic dance music with steady 4/4 beat (originated in Chicago in the 1980s; foundational EDM genre)',
    examples: [
      'make it house',
      'house music groove',
      'four-on-the-floor feel',
    ],
  },
  
  {
    id: createLexemeId('deep-house'),
    lemma: 'deep house',
    variants: ['deep', 'soulful house'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'genre',
      parent_genre: 'house',
      tempo_range: [120, 125],
      characteristics: ['warm', 'atmospheric', 'soulful'],
      mood: 'relaxed',
    },
    description: 'House subgenre with warm, soulful character (emphasizes groove and atmosphere over energy)',
    examples: [
      'make it deep house',
      'warm and atmospheric',
    ],
  },
  
  {
    id: createLexemeId('tech-house'),
    lemma: 'tech house',
    variants: ['techy', 'minimal house'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'genre',
      parent_genre: 'house',
      tempo_range: [125, 130],
      characteristics: ['mechanical', 'stripped', 'groovy'],
      production_style: 'minimal',
    },
    description: 'House with techno influences; stripped-down groove (blend of house groove with techno minimalism)',
    examples: [
      'make it tech house',
      'mechanical groove',
    ],
  },
  
  {
    id: createLexemeId('filter-sweep'),
    lemma: 'filter sweep',
    variants: ['filter automation', 'sweeping filter', 'resonant sweep'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'technique',
      category: 'modulation',
      affects: 'timbre',
      character: 'dynamic',
      typical_use: 'buildups',
    },
    description: 'Automated filter cutoff movement, classic in house music (essential house music technique for builds and transitions)',
    examples: [
      'add filter sweep',
      'automate the filter cutoff',
    ],
  },
  
  {
    id: createLexemeId('shuffle'),
    lemma: 'shuffle',
    variants: ['shuffled', 'swing', 'shuffly'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'rhythm',
      characteristic: 'swung_16ths',
      amount: 'subtle_to_moderate',
    },
    description: 'Subtle timing offset creating swing feel (adds organic feel to electronic music)',
    examples: [
      'add some shuffle',
      'shuffle the hi-hats',
    ],
  },
];

// =============================================================================
// Techno Terms
// =============================================================================

export const technoLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('techno'),
    lemma: 'techno',
    variants: ['detroit techno', 'industrial techno'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'genre',
      tempo_range: [125, 135],
      characteristics: ['repetitive', 'mechanical', 'hypnotic'],
      origin: 'detroit',
      era: '1980s',
    },
    description: 'Electronic music emphasizing repetition and machine aesthetics (originated in Detroit; emphasizes futurism and technology)',
    examples: [
      'make it techno',
      'mechanical and hypnotic',
    ],
  },
  
  {
    id: createLexemeId('acid-techno'),
    lemma: 'acid techno',
    variants: ['acid', 'acidic'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'genre',
      parent_genre: 'techno',
      tempo_range: [130, 140],
      characteristics: ['squelchy', 'resonant', 'aggressive'],
      iconic_instrument: 'tb303',
    },
    description: 'Techno featuring squelchy 303-style basslines (defined by Roland TB-303 bass synthesizer sound)',
    examples: [
      'make it acid techno',
      'squelchy 303 sound',
    ],
  },
  
  {
    id: createLexemeId('303-bassline'),
    lemma: '303 bassline',
    variants: ['acid bassline', 'squelchy bass', 'resonant bass'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      instrument: 'tb303',
      characteristics: ['squelchy', 'resonant', 'gliding'],
      iconic: true,
    },
    description: 'Characteristic squelchy bassline from Roland TB-303 (defined acid house and acid techno genres)',
    examples: [
      'add 303 bassline',
      'make it squelchy',
    ],
  },
  
  {
    id: createLexemeId('industrial'),
    lemma: 'industrial',
    variants: ['industrial sound', 'harsh', 'metallic'],
    category: 'adj',
    semantics: {
      type: 'entity',
      entityType: 'texture',
      characteristics: ['harsh', 'metallic', 'aggressive'],
      frequency_emphasis: 'midrange',
    },
    description: 'Harsh, metallic, machine-like sonic character (associated with industrial music and techno)',
    examples: [
      'make it more industrial',
      'harsh metallic sound',
    ],
  },
];

// =============================================================================
// Dubstep & Bass Music Terms
// =============================================================================

export const bassLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('dubstep'),
    lemma: 'dubstep',
    variants: ['dub step', 'dubby'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'genre',
      tempo_range: [140, 140], // Typically exactly 140 BPM
      characteristics: ['heavy_bass', 'syncopated', 'sparse'],
      origin: 'uk',
      era: '2000s',
    },
    description: 'UK bass music with sub-bass emphasis and syncopated rhythms (evolved from UK garage; emphasizes sub-bass frequencies)',
    examples: [
      'make it dubstep',
      'heavy bass and half-time feel',
    ],
  },
  
  {
    id: createLexemeId('wobble'),
    lemma: 'wobble',
    variants: ['wobble bass', 'wub', 'lfo bass'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      technique: 'lfo_modulation',
      characteristics: ['modulated', 'rhythmic', 'aggressive'],
      typical_genre: 'dubstep',
    },
    description: 'Rhythmically modulated bass sound, signature of dubstep (defining characteristic of modern dubstep)',
    examples: [
      'add wobble bass',
      'make it wub',
    ],
  },
  
  {
    id: createLexemeId('sub-bass'),
    lemma: 'sub bass',
    variants: ['sub', 'sub-bass', 'low end'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      range: [20, 60],
      unit: 'Hz',
      character: 'felt',
    },
    description: 'Very low frequency bass content (below ~60 Hz; essential in dubstep, trap, and bass music)',
    examples: [
      'add more sub bass',
      'boost the low end',
    ],
  },
  
  {
    id: createLexemeId('half-time'),
    lemma: 'half time',
    variants: ['half-time', 'halftime', 'slow down'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'rhythm',
      pattern: 'half_speed_drums',
      effect: 'heavy',
      typical_genre: 'dubstep',
    },
    description: 'Drums that feel half-speed while tempo stays constant (creates heavy, impactful sections in dubstep)',
    examples: [
      'make it half time',
      'halftime drums',
    ],
  },
];

// =============================================================================
// Trap & Hip-Hop Production Terms
// =============================================================================

export const trapLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('trap'),
    lemma: 'trap',
    variants: ['trap music', 'trap beat'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'genre',
      tempo_range: [130, 170],
      characteristics: ['rolling_hihats', 'heavy_808', 'sparse'],
      origin: 'southern_us',
      era: '2000s',
    },
    description: 'Hip-hop subgenre featuring rolling hi-hats and heavy 808 bass (originated in Southern US; defines modern hip-hop production)',
    examples: [
      'make it trap',
      'trap beat with rolling hats',
    ],
  },
  
  {
    id: createLexemeId('808'),
    lemma: '808',
    variants: ['808 bass', 'eight-oh-eight', 'roland 808'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      instrument: 'tr808',
      characteristics: ['punchy', 'boomy', 'pitched'],
      iconic: true,
    },
    description: 'Characteristic bass drum from Roland TR-808 (defined hip-hop and trap production)',
    examples: [
      'add 808 bass',
      'boost the 808',
    ],
  },
  
  {
    id: createLexemeId('hi-hat-rolls'),
    lemma: 'hi-hat rolls',
    variants: ['rolls', 'rolling hats', 'hat rolls'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'rhythm',
      pattern: 'triplet_rolls',
      typical_genre: 'trap',
      function: 'fills',
    },
    description: 'Rapid hi-hat triplets used as fills in trap music (signature rhythmic element of trap)',
    examples: [
      'add hi-hat rolls',
      'rolling hats on the snares',
    ],
  },
];

// =============================================================================
// Ambient & Atmospheric Terms
// =============================================================================

export const ambientLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('ambient'),
    lemma: 'ambient',
    variants: ['atmospheric', 'ethereal', 'spacious'],
    category: 'adj',
    semantics: {
      type: 'entity',
      entityType: 'genre',
      tempo_range: [60, 100],
      characteristics: ['textural', 'evolving', 'immersive'],
      emphasis: 'atmosphere_over_rhythm',
    },
    description: 'Atmospheric, texture-focused music (emphasizes space and mood over rhythm and melody)',
    examples: [
      'make it ambient',
      'more atmospheric',
      'ethereal textures',
    ],
  },
  
  {
    id: createLexemeId('pad'),
    lemma: 'pad',
    variants: ['synth pad', 'atmospheric pad', 'string pad'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'instrument',
      function: 'harmonic_fill',
      characteristics: ['sustained', 'evolving', 'textural'],
    },
    description: 'Sustained synthesizer sound providing harmonic foundation (essential in ambient and electronic music)',
    examples: [
      'add a pad',
      'warm synth pad',
    ],
  },
  
  {
    id: createLexemeId('drone'),
    lemma: 'drone',
    variants: ['droning', 'sustained tone'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'texture',
      characteristic: 'sustained_pitch',
      function: 'tonal_center',
      typical_genre: 'ambient',
    },
    description: 'Long sustained tone providing tonal foundation (creates meditative, immersive quality)',
    examples: [
      'add a drone',
      'droning bass',
    ],
  },
];

// =============================================================================
// Synthesis & Sound Design Terms
// =============================================================================

export const synthesisLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lfo'),
    lemma: 'LFO',
    variants: ['low frequency oscillator', 'modulation'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'technique',
      category: 'modulation',
      function: 'parameter_modulation',
      typical_targets: ['filter', 'pitch', 'amplitude'],
    },
    description: 'Low frequency oscillator for parameter modulation (fundamental synthesis technique)',
    examples: [
      'add LFO modulation',
      'modulate with an LFO',
    ],
  },
  
  {
    id: createLexemeId('envelope'),
    lemma: 'envelope',
    variants: ['ADSR', 'attack decay sustain release'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'technique',
      category: 'shaping',
      function: 'amplitude_shaping',
      components: ['attack', 'decay', 'sustain', 'release'],
    },
    description: 'Amplitude envelope shaping note dynamics (fundamental synthesis element)',
    examples: [
      'adjust the envelope',
      'longer attack',
      'faster release',
    ],
  },
  
  {
    id: createLexemeId('resonance'),
    lemma: 'resonance',
    variants: ['resonant', 'Q factor', 'emphasis'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      parameter_type: 'filter_q',
      effect: 'frequency_emphasis',
    },
    description: 'Filter resonance creating frequency emphasis (characteristic of acid and electronic music)',
    examples: [
      'add resonance',
      'boost the resonance',
      'resonant filter',
    ],
  },
  
  {
    id: createLexemeId('cutoff'),
    lemma: 'cutoff',
    variants: ['filter cutoff', 'cutoff frequency'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      parameter_type: 'filter_frequency',
      effect: 'frequency_attenuation',
    },
    description: 'Filter cutoff frequency controlling brightness (essential mixing and sound design parameter)',
    examples: [
      'adjust the cutoff',
      'lower cutoff',
      'automate cutoff',
    ],
  },
];

// =============================================================================
// Spatial & Mixing Terms
// =============================================================================

export const spatialLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('stereo-width'),
    lemma: 'stereo width',
    variants: ['width', 'wideness', 'stereo image'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      parameter_type: 'stereo_spread',
      range: 'mono_to_wide',
    },
    description: 'Width of stereo image from mono to wide (crucial mixing parameter for space and separation)',
    examples: [
      'increase stereo width',
      'make it wider',
      'narrow the width',
    ],
  },
  
  {
    id: createLexemeId('panning'),
    lemma: 'panning',
    variants: ['pan', 'panned', 'stereo position'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      parameter_type: 'stereo_position',
      range: 'left_to_right',
    },
    description: 'Left-right positioning in stereo field (essential for creating space and separation)',
    examples: [
      'pan it left',
      'center the vocals',
      'spread the panning',
    ],
  },
  
  {
    id: createLexemeId('depth'),
    lemma: 'depth',
    variants: ['deep', 'distance', 'front-to-back'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      parameter_type: 'spatial_depth',
      techniques: ['reverb', 'delay', 'eq_attenuation'],
    },
    description: 'Front-to-back positioning creating sense of distance (achieved via reverb, delay, and EQ)',
    examples: [
      'add more depth',
      'push it back',
      'bring it forward',
    ],
  },
];

// =============================================================================
// Groove & Feel Terms
// =============================================================================

export const grooveLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('pocket'),
    lemma: 'pocket',
    variants: ['in the pocket', 'groove pocket', 'tight pocket'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'rhythm',
      characteristic: 'timing_cohesion',
      quality: 'feels_good',
    },
    description: 'Tight timing relationship between rhythmic elements (when rhythm section locks together perfectly)',
    examples: [
      'get it in the pocket',
      'tighten the pocket',
      'groove pocket',
    ],
  },
  
  {
    id: createLexemeId('quantize'),
    lemma: 'quantize',
    variants: ['quantized', 'grid-aligned', 'snap to grid'],
    category: 'verb',
    semantics: {
      type: 'action',
      function: 'timing_correction',
      parameter: 'quantize_strength',
      range: '0_to_100_percent',
    },
    description: 'Align notes to rhythmic grid (can tighten or loosen depending on strength)',
    examples: [
      'quantize the drums',
      'quantize to 16ths',
      '50% quantize',
    ],
  },
  
  {
    id: createLexemeId('humanize'),
    lemma: 'humanize',
    variants: ['humanized', 'add feel', 'make it human'],
    category: 'verb',
    semantics: {
      type: 'action',
      function: 'add_variation',
      parameters: ['timing', 'velocity', 'duration'],
      effect: 'organic_feel',
    },
    description: 'Add subtle timing and velocity variations for organic feel (opposite of quantize)',
    examples: [
      'humanize the drums',
      'add some feel',
      'make it less robotic',
    ],
  },
  
  {
    id: createLexemeId('syncopation'),
    lemma: 'syncopation',
    variants: ['syncopated', 'offbeat', 'unexpected accents'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'rhythm',
      method: 'displaced_accents',
      effect: 'rhythmic_interest',
    },
    description: 'Emphasis on weak beats or off-beats (creates rhythmic interest and complexity)',
    examples: [
      'add syncopation',
      'syncopated rhythm',
    ],
  },
];

// =============================================================================
// Combined Export
// =============================================================================

export const electronicMusicLexemes: readonly Lexeme[] = [
  ...houseMusicLexemes,
  ...technoLexemes,
  ...bassLexemes,
  ...trapLexemes,
  ...ambientLexemes,
  ...synthesisLexemes,
  ...spatialLexemes,
  ...grooveLexemes,
];

/**
 * Total lexemes in this batch: 39
 * 
 * Comprehensive coverage of:
 * - House music (deep house, tech house)
 * - Techno and acid
 * - Dubstep and bass music
 * - Trap and hip-hop production
 * - Ambient and atmospheric
 * - Synthesis fundamentals (LFO, envelopes, filters)
 * - Spatial mixing (panning, width, depth)
 * - Groove and feel concepts
 * 
 * Each fully integrated with CPL semantics for intelligent planning.
 */
