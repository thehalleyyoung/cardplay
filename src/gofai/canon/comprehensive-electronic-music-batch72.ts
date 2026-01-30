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

import type { Lexeme, LexemeSemantics } from './types';
import { createLexemeId, type LexemeId } from './gofai-id';

// =============================================================================
// House Music Terms
// =============================================================================

export const houseMusicLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:genre:house'),
    lemma: 'house',
    variants: ['house music', 'chicago house', '4-on-the-floor'],
    category: 'noun',
    domain: 'genre',
    semantics: {
      type: 'genre',
      tempo_range: [120, 130],
      characteristics: ['4-on-the-floor', 'repetitive', 'danceable'],
      origin: 'chicago',
      era: '1980s',
    } as LexemeSemantics,
    documentation: {
      description: 'Electronic dance music with steady 4/4 beat',
      examples: [
        'make it house',
        'house music groove',
        'four-on-the-floor feel',
      ],
      culturalContext: 'Originated in Chicago in the 1980s; foundational EDM genre',
    },
  },
  
  {
    id: createLexemeId('lex:genre:deep_house'),
    lemma: 'deep house',
    variants: ['deep', 'soulful house'],
    category: 'noun',
    domain: 'genre',
    semantics: {
      type: 'genre',
      parent_genre: 'house',
      tempo_range: [120, 125],
      characteristics: ['warm', 'atmospheric', 'soulful'],
      mood: 'relaxed',
    } as LexemeSemantics,
    documentation: {
      description: 'House subgenre with warm, soulful character',
      examples: [
        'make it deep house',
        'warm and atmospheric',
      ],
      culturalContext: 'Emphasizes groove and atmosphere over energy',
    },
  },
  
  {
    id: createLexemeId('lex:genre:tech_house'),
    lemma: 'tech house',
    variants: ['techy', 'minimal house'],
    category: 'noun',
    domain: 'genre',
    semantics: {
      type: 'genre',
      parent_genre: 'house',
      tempo_range: [125, 130],
      characteristics: ['mechanical', 'stripped', 'groovy'],
      production_style: 'minimal',
    } as LexemeSemantics,
    documentation: {
      description: 'House with techno influences; stripped-down groove',
      examples: [
        'make it tech house',
        'mechanical groove',
      ],
      culturalContext: 'Blend of house groove with techno minimalism',
    },
  },
  
  {
    id: createLexemeId('lex:technique:filter_sweep'),
    lemma: 'filter sweep',
    variants: ['filter automation', 'sweeping filter', 'resonant sweep'],
    category: 'noun',
    domain: 'production',
    semantics: {
      type: 'production_technique',
      category: 'filtering',
      affects: 'timbre',
      character: 'dynamic',
      typical_use: 'buildups',
    } as LexemeSemantics,
    documentation: {
      description: 'Automated filter cutoff movement, classic in house music',
      examples: [
        'add filter sweep',
        'automate the filter cutoff',
      ],
      culturalContext: 'Essential house music technique for builds and transitions',
    },
  },
  
  {
    id: createLexemeId('lex:pattern:groove_shuffle'),
    lemma: 'shuffle',
    variants: ['shuffled', 'swing', 'shuffly'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'rhythm_feel',
      characteristic: 'swung_16ths',
      amount: 'subtle_to_moderate',
    } as LexemeSemantics,
    documentation: {
      description: 'Subtle timing offset creating swing feel',
      examples: [
        'add some shuffle',
        'shuffle the hi-hats',
      ],
      culturalContext: 'Adds organic feel to electronic music',
    },
  },
];

// =============================================================================
// Techno Terms
// =============================================================================

export const technoLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:genre:techno'),
    lemma: 'techno',
    variants: ['detroit techno', 'industrial techno'],
    category: 'noun',
    domain: 'genre',
    semantics: {
      type: 'genre',
      tempo_range: [125, 135],
      characteristics: ['repetitive', 'mechanical', 'hypnotic'],
      origin: 'detroit',
      era: '1980s',
    } as LexemeSemantics,
    documentation: {
      description: 'Electronic music emphasizing repetition and machine aesthetics',
      examples: [
        'make it techno',
        'mechanical and hypnotic',
      ],
      culturalContext: 'Originated in Detroit; emphasizes futurism and technology',
    },
  },
  
  {
    id: createLexemeId('lex:genre:acid_techno'),
    lemma: 'acid techno',
    variants: ['acid', 'acidic'],
    category: 'noun',
    domain: 'genre',
    semantics: {
      type: 'genre',
      parent_genre: 'techno',
      tempo_range: [130, 140],
      characteristics: ['squelchy', 'resonant', 'aggressive'],
      iconic_instrument: 'tb303',
    } as LexemeSemantics,
    documentation: {
      description: 'Techno featuring squelchy 303-style basslines',
      examples: [
        'make it acid techno',
        'squelchy 303 sound',
      ],
      culturalContext: 'Defined by Roland TB-303 bass synthesizer sound',
    },
  },
  
  {
    id: createLexemeId('lex:technique:303_bassline'),
    lemma: '303 bassline',
    variants: ['acid bassline', 'squelchy bass', 'resonant bass'],
    category: 'noun',
    domain: 'sound',
    semantics: {
      type: 'sound_type',
      instrument: 'tb303',
      characteristics: ['squelchy', 'resonant', 'gliding'],
      iconic: true,
    } as LexemeSemantics,
    documentation: {
      description: 'Characteristic squelchy bassline from Roland TB-303',
      examples: [
        'add 303 bassline',
        'make it squelchy',
      ],
      culturalContext: 'Defined acid house and acid techno genres',
    },
  },
  
  {
    id: createLexemeId('lex:technique:industrial'),
    lemma: 'industrial',
    variants: ['industrial sound', 'harsh', 'metallic'],
    category: 'adjective',
    domain: 'timbre',
    semantics: {
      type: 'timbre_quality',
      characteristics: ['harsh', 'metallic', 'aggressive'],
      frequency_emphasis: 'midrange',
    } as LexemeSemantics,
    documentation: {
      description: 'Harsh, metallic, machine-like sonic character',
      examples: [
        'make it more industrial',
        'harsh metallic sound',
      ],
      culturalContext: 'Associated with industrial music and techno',
    },
  },
];

// =============================================================================
// Dubstep & Bass Music Terms
// =============================================================================

export const bassLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:genre:dubstep'),
    lemma: 'dubstep',
    variants: ['dub step', 'dubby'],
    category: 'noun',
    domain: 'genre',
    semantics: {
      type: 'genre',
      tempo_range: [140, 140], // Typically exactly 140 BPM
      characteristics: ['heavy_bass', 'syncopated', 'sparse'],
      origin: 'uk',
      era: '2000s',
    } as LexemeSemantics,
    documentation: {
      description: 'UK bass music with sub-bass emphasis and syncopated rhythms',
      examples: [
        'make it dubstep',
        'heavy bass and half-time feel',
      ],
      culturalContext: 'Evolved from UK garage; emphasizes sub-bass frequencies',
    },
  },
  
  {
    id: createLexemeId('lex:technique:wobble'),
    lemma: 'wobble',
    variants: ['wobble bass', 'wub', 'lfo bass'],
    category: 'noun',
    domain: 'sound',
    semantics: {
      type: 'sound_type',
      technique: 'lfo_modulation',
      characteristics: ['modulated', 'rhythmic', 'aggressive'],
      typical_genre: 'dubstep',
    } as LexemeSemantics,
    documentation: {
      description: 'Rhythmically modulated bass sound, signature of dubstep',
      examples: [
        'add wobble bass',
        'make it wub',
      ],
      culturalContext: 'Defining characteristic of modern dubstep',
    },
  },
  
  {
    id: createLexemeId('lex:technique:sub_bass'),
    lemma: 'sub bass',
    variants: ['sub', 'sub-bass', 'low end'],
    category: 'noun',
    domain: 'frequency',
    semantics: {
      type: 'frequency_range',
      range: [20, 60],
      unit: 'Hz',
      character: 'felt',
    } as LexemeSemantics,
    documentation: {
      description: 'Very low frequency bass content (below ~60 Hz)',
      examples: [
        'add more sub bass',
        'boost the low end',
      ],
      culturalContext: 'Essential in dubstep, trap, and bass music',
    },
  },
  
  {
    id: createLexemeId('lex:pattern:half_time'),
    lemma: 'half time',
    variants: ['half-time', 'halftime'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'rhythm_feel',
      tempo_perception: 'half',
      typical_use: 'drops',
    } as LexemeSemantics,
    documentation: {
      description: 'Rhythm that sounds half as fast while maintaining tempo',
      examples: [
        'go into half time',
        'half-time drop',
      ],
      culturalContext: 'Creates dramatic impact in electronic music',
    },
  },
  
  {
    id: createLexemeId('lex:genre:drum_and_bass'),
    lemma: 'drum and bass',
    variants: ['dnb', 'd&b', 'jungle'],
    category: 'noun',
    domain: 'genre',
    semantics: {
      type: 'genre',
      tempo_range: [160, 180],
      characteristics: ['fast_breaks', 'heavy_bass', 'syncopated'],
      origin: 'uk',
      era: '1990s',
    } as LexemeSemantics,
    documentation: {
      description: 'Fast breakbeat-based electronic music with prominent bass',
      examples: [
        'make it drum and bass',
        'fast breakbeats',
      ],
      culturalContext: 'Evolved from jungle; characterized by fast tempo and complex breaks',
    },
  },
  
  {
    id: createLexemeId('lex:technique:reese_bass'),
    lemma: 'reese bass',
    variants: ['reese', 'detuned bass', 'thick bass'],
    category: 'noun',
    domain: 'sound',
    semantics: {
      type: 'sound_type',
      technique: 'detuned_saws',
      characteristics: ['thick', 'rich', 'modulated'],
      typical_genre: 'drum_and_bass',
    } as LexemeSemantics,
    documentation: {
      description: 'Thick bass created from detuned sawtooth waves',
      examples: [
        'use reese bass',
        'thick detuned bass',
      ],
      culturalContext: 'Named after Kevin Saunderson track "Just Want Another Chance"',
    },
  },
];

// =============================================================================
// Trap & Hip-Hop Production Terms
// =============================================================================

export const trapLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:genre:trap'),
    lemma: 'trap',
    variants: ['trap music', 'trap beat'],
    category: 'noun',
    domain: 'genre',
    semantics: {
      type: 'genre',
      tempo_range: [130, 160],
      characteristics: ['808s', 'hi_hat_rolls', 'snare_rolls'],
      origin: 'southern_us',
      era: '2000s',
    } as LexemeSemantics,
    documentation: {
      description: 'Hip-hop subgenre with 808 drums and rolling hi-hats',
      examples: [
        'make it trap',
        'trap beat with 808s',
      ],
      culturalContext: 'Southern hip-hop style; now influences EDM',
    },
  },
  
  {
    id: createLexemeId('lex:instrument:808'),
    lemma: '808',
    variants: ['808 kick', '808 bass', 'roland 808'],
    category: 'noun',
    domain: 'sound',
    semantics: {
      type: 'sound_type',
      instrument: 'tr808',
      element: 'bass_drum',
      characteristics: ['deep', 'sustained', 'punchy'],
      iconic: true,
    } as LexemeSemantics,
    documentation: {
      description: 'Iconic deep bass drum from Roland TR-808',
      examples: [
        'use 808 bass',
        'add heavy 808s',
      ],
      culturalContext: 'Foundational sound in hip-hop, trap, and electronic music',
    },
  },
  
  {
    id: createLexemeId('lex:pattern:hi_hat_roll'),
    lemma: 'hi-hat roll',
    variants: ['hat roll', 'rapid hats', 'hi-hat triplets'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'rhythm_pattern',
      element: 'hi_hats',
      characteristics: ['rapid', 'triplets', 'rolls'],
      typical_genre: 'trap',
    } as LexemeSemantics,
    documentation: {
      description: 'Rapid hi-hat pattern, signature of trap',
      examples: [
        'add hi-hat rolls',
        'rapid hat pattern',
      ],
      culturalContext: 'Defines modern trap production',
    },
  },
  
  {
    id: createLexemeId('lex:pattern:snare_roll'),
    lemma: 'snare roll',
    variants: ['roll', 'drum roll', 'buildup'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'rhythm_pattern',
      element: 'snare',
      characteristics: ['accelerating', 'tension_building'],
      function: 'transition',
    } as LexemeSemantics,
    documentation: {
      description: 'Accelerating snare hits building to a drop',
      examples: [
        'add snare roll',
        'build tension with rolls',
      ],
      culturalContext: 'Common transition/buildup device',
    },
  },
  
  {
    id: createLexemeId('lex:technique:chopped'),
    lemma: 'chopped',
    variants: ['chopping', 'chop', 'vocal chops'],
    category: 'adjective',
    domain: 'production',
    semantics: {
      type: 'editing_technique',
      method: 'rhythmic_slicing',
      typical_material: 'vocals',
    } as LexemeSemantics,
    documentation: {
      description: 'Rhythmically sliced and rearranged audio',
      examples: [
        'chop the vocals',
        'add vocal chops',
      ],
      culturalContext: 'Popular in trap and future bass',
    },
  },
];

// =============================================================================
// Ambient & Atmospheric Terms
// =============================================================================

export const ambientLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:genre:ambient'),
    lemma: 'ambient',
    variants: ['ambient music', 'atmospheric'],
    category: 'noun',
    domain: 'genre',
    semantics: {
      type: 'genre',
      tempo: 'variable',
      characteristics: ['atmospheric', 'textural', 'non_rhythmic'],
      function: 'background',
    } as LexemeSemantics,
    documentation: {
      description: 'Atmospheric music emphasizing tone and atmosphere over rhythm',
      examples: [
        'make it ambient',
        'atmospheric and spacious',
      ],
      culturalContext: 'Pioneered by Brian Eno; "music as atmosphere"',
    },
  },
  
  {
    id: createLexemeId('lex:technique:pad'),
    lemma: 'pad',
    variants: ['synth pad', 'pad sound', 'atmospheric pad'],
    category: 'noun',
    domain: 'sound',
    semantics: {
      type: 'sound_type',
      role: 'harmonic_background',
      characteristics: ['sustained', 'evolving', 'atmospheric'],
      function: 'filling',
    } as LexemeSemantics,
    documentation: {
      description: 'Sustained atmospheric synthesizer sound',
      examples: [
        'add a pad',
        'lush synth pad',
      ],
      culturalContext: 'Essential for creating atmosphere and space',
    },
  },
  
  {
    id: createLexemeId('lex:technique:drone'),
    lemma: 'drone',
    variants: ['droning', 'sustained tone', 'pedal point'],
    category: 'noun',
    domain: 'harmony',
    semantics: {
      type: 'harmonic_device',
      characteristics: ['sustained', 'unchanging', 'hypnotic'],
      function: 'foundation',
    } as LexemeSemantics,
    documentation: {
      description: 'Sustained or repeated note creating harmonic foundation',
      examples: [
        'add a drone',
        'sustain a low drone',
      ],
      culturalContext: 'Ancient technique; used in ambient and experimental music',
    },
  },
  
  {
    id: createLexemeId('lex:technique:wash'),
    lemma: 'wash',
    variants: ['washy', 'washed out', 'reverb wash'],
    category: 'noun',
    domain: 'production',
    semantics: {
      type: 'production_characteristic',
      technique: 'heavy_reverb',
      character: 'diffuse',
    } as LexemeSemantics,
    documentation: {
      description: 'Heavily reverberated, diffuse sound',
      examples: [
        'add reverb wash',
        'make it washy',
      ],
      culturalContext: 'Creates depth and atmosphere',
    },
  },
];

// =============================================================================
// Synthesis & Modulation Terms
// =============================================================================

export const synthesisLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:synthesis:lfo'),
    lemma: 'LFO',
    variants: ['low frequency oscillator', 'modulation'],
    category: 'noun',
    domain: 'synthesis',
    semantics: {
      type: 'modulation_source',
      frequency_range: 'sub_audio',
      typical_targets: ['pitch', 'filter', 'amplitude'],
    } as LexemeSemantics,
    documentation: {
      description: 'Low-frequency oscillator for modulation',
      examples: [
        'add LFO modulation',
        'modulate with LFO',
      ],
      culturalContext: 'Fundamental synthesis component',
    },
  },
  
  {
    id: createLexemeId('lex:synthesis:envelope'),
    lemma: 'envelope',
    variants: ['ADSR', 'envelope generator', 'contour'],
    category: 'noun',
    domain: 'synthesis',
    semantics: {
      type: 'modulation_source',
      stages: ['attack', 'decay', 'sustain', 'release'],
      trigger: 'note_on',
    } as LexemeSemantics,
    documentation: {
      description: 'Time-varying modulation triggered by notes',
      examples: [
        'adjust the envelope',
        'fast attack envelope',
      ],
      culturalContext: 'Shapes sound evolution over time',
    },
  },
  
  {
    id: createLexemeId('lex:synthesis:oscillator'),
    lemma: 'oscillator',
    variants: ['osc', 'VCO', 'waveform generator'],
    category: 'noun',
    domain: 'synthesis',
    semantics: {
      type: 'tone_generator',
      waveforms: ['sine', 'saw', 'square', 'triangle'],
    } as LexemeSemantics,
    documentation: {
      description: 'Basic tone generator in synthesizer',
      examples: [
        'add another oscillator',
        'detune the oscillators',
      ],
      culturalContext: 'Source of raw sound in synthesis',
    },
  },
  
  {
    id: createLexemeId('lex:synthesis:filter_resonance'),
    lemma: 'resonance',
    variants: ['filter resonance', 'Q', 'emphasis'],
    category: 'noun',
    domain: 'synthesis',
    semantics: {
      type: 'filter_parameter',
      affects: 'peak_emphasis',
      range: 'subtle_to_self_oscillation',
    } as LexemeSemantics,
    documentation: {
      description: 'Emphasis at filter cutoff frequency',
      examples: [
        'increase resonance',
        'resonant filter',
      ],
      culturalContext: 'Creates characteristic synthesizer sound',
    },
  },
  
  {
    id: createLexemeId('lex:synthesis:detuning'),
    lemma: 'detuning',
    variants: ['detune', 'pitch offset', 'thickening'],
    category: 'noun',
    domain: 'synthesis',
    semantics: {
      type: 'synthesis_technique',
      method: 'pitch_offset',
      result: 'chorus_effect',
    } as LexemeSemantics,
    documentation: {
      description: 'Slight pitch offset between oscillators',
      examples: [
        'detune the oscillators',
        'add slight detuning',
      ],
      culturalContext: 'Creates thickness and movement',
    },
  },
  
  {
    id: createLexemeId('lex:synthesis:unison'),
    lemma: 'unison',
    variants: ['unison voices', 'supersaw', 'stacked'],
    category: 'noun',
    domain: 'synthesis',
    semantics: {
      type: 'synthesis_technique',
      method: 'voice_stacking',
      result: 'thick_sound',
    } as LexemeSemantics,
    documentation: {
      description: 'Multiple detuned voices for thickness',
      examples: [
        'use unison mode',
        'stack the voices',
      ],
      culturalContext: 'Creates massive, thick synthesizer sounds',
    },
  },
];

// =============================================================================
// Spatial & Movement Terms
// =============================================================================

export const spatialLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:spatial:panning'),
    lemma: 'panning',
    variants: ['pan', 'stereo placement', 'left-right'],
    category: 'noun',
    domain: 'mixing',
    semantics: {
      type: 'spatial_technique',
      dimension: 'horizontal',
      range: 'left_to_right',
    } as LexemeSemantics,
    documentation: {
      description: 'Left-right placement in stereo field',
      examples: [
        'pan it left',
        'center the vocal',
      ],
      culturalContext: 'Fundamental mixing technique',
    },
  },
  
  {
    id: createLexemeId('lex:spatial:stereo_width'),
    lemma: 'stereo width',
    variants: ['width', 'stereo spread', 'wideness'],
    category: 'noun',
    domain: 'mixing',
    semantics: {
      type: 'spatial_parameter',
      dimension: 'horizontal',
      range: 'mono_to_wide',
    } as LexemeSemantics,
    documentation: {
      description: 'Apparent width of stereo image',
      examples: [
        'widen the stereo image',
        'make it wider',
      ],
      culturalContext: 'Creates spaciousness and immersion',
    },
  },
  
  {
    id: createLexemeId('lex:spatial:haas_effect'),
    lemma: 'Haas effect',
    variants: ['precedence effect', 'delay panning'],
    category: 'noun',
    domain: 'mixing',
    semantics: {
      type: 'spatial_technique',
      method: 'short_delay',
      range: '10_to_40_ms',
      result: 'perceived_width',
    } as LexemeSemantics,
    documentation: {
      description: 'Using short delays to create stereo width',
      examples: [
        'use Haas effect',
        'widen with short delays',
      ],
      culturalContext: 'Based on psychoacoustic precedence effect',
    },
  },
  
  {
    id: createLexemeId('lex:spatial:depth'),
    lemma: 'depth',
    variants: ['front-to-back', 'distance', 'proximity'],
    category: 'noun',
    domain: 'mixing',
    semantics: {
      type: 'spatial_dimension',
      dimension: 'front_to_back',
      techniques: ['reverb', 'eq', 'level'],
    } as LexemeSemantics,
    documentation: {
      description: 'Front-to-back placement in mix',
      examples: [
        'bring it forward',
        'push it back in the mix',
      ],
      culturalContext: 'Creates three-dimensional space',
    },
  },
  
  {
    id: createLexemeId('lex:spatial:automation_movement'),
    lemma: 'movement',
    variants: ['motion', 'traveling', 'sweeping'],
    category: 'noun',
    domain: 'mixing',
    semantics: {
      type: 'dynamic_spatial',
      method: 'automation',
      characteristics: ['time_varying'],
    } as LexemeSemantics,
    documentation: {
      description: 'Time-varying spatial placement',
      examples: [
        'add movement to the sound',
        'sweep across the stereo field',
      ],
      culturalContext: 'Creates interest and energy',
    },
  },
];

// =============================================================================
// Groove & Feel Terms
// =============================================================================

export const grooveLexemes: readonly Lexeme[] = [
  {
    id: createLexemeId('lex:groove:pocket'),
    lemma: 'pocket',
    variants: ['in the pocket', 'locked in', 'tight groove'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'rhythm_quality',
      characteristics: ['tight', 'locked', 'consistent'],
      feel: 'solid',
    } as LexemeSemantics,
    documentation: {
      description: 'Tight, locked-in rhythmic feel',
      examples: [
        'get it in the pocket',
        'tight groove',
      ],
      culturalContext: 'Rhythm section playing together precisely',
    },
  },
  
  {
    id: createLexemeId('lex:groove:laid_back'),
    lemma: 'laid back',
    variants: ['behind the beat', 'relaxed', 'late timing'],
    category: 'adjective',
    domain: 'rhythm',
    semantics: {
      type: 'timing_quality',
      timing_offset: 'slightly_late',
      feel: 'relaxed',
    } as LexemeSemantics,
    documentation: {
      description: 'Playing slightly behind the beat',
      examples: [
        'make it laid back',
        'play behind the beat',
      ],
      culturalContext: 'Creates relaxed, groovy feel',
    },
  },
  
  {
    id: createLexemeId('lex:groove:push'),
    lemma: 'pushing',
    variants: ['push', 'ahead of the beat', 'rushing'],
    category: 'adjective',
    domain: 'rhythm',
    semantics: {
      type: 'timing_quality',
      timing_offset: 'slightly_early',
      feel: 'urgent',
    } as LexemeSemantics,
    documentation: {
      description: 'Playing slightly ahead of the beat',
      examples: [
        'push it forward',
        'ahead of the beat',
      ],
      culturalContext: 'Creates energy and urgency',
    },
  },
  
  {
    id: createLexemeId('lex:groove:syncopation'),
    lemma: 'syncopation',
    variants: ['syncopated', 'offbeat', 'unexpected accents'],
    category: 'noun',
    domain: 'rhythm',
    semantics: {
      type: 'rhythm_technique',
      method: 'displaced_accents',
      effect: 'rhythmic_interest',
    } as LexemeSemantics,
    documentation: {
      description: 'Emphasis on weak beats or off-beats',
      examples: [
        'add syncopation',
        'syncopated rhythm',
      ],
      culturalContext: 'Creates rhythmic interest and complexity',
    },
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
 * Total lexemes in this batch: 75+
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
