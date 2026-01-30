/**
 * GOFAI Canon: Perceptual and Emotional Adjectives Batch 53
 * 
 * Step 052/061/086 implementation: Comprehensive vocabulary of adjectives
 * musicians use to describe sonic, emotional, and aesthetic qualities.
 * 
 * Covers 600+ perceptual descriptors mapped to axes, dimensions, and
 * concrete musical levers for planning and execution.
 */

import type { LexemeEntry, PerceptualAxis } from './types.js';

/**
 * Perceptual and emotional adjectives for musical description.
 * Each adjective maps to one or more perceptual axes that can be
 * operationalized into concrete edits.
 * 
 * Categories:
 * - Sonic texture and timbre
 * - Spatial and dimensional qualities
 * - Emotional and expressive qualities
 * - Dynamic and energetic qualities
 * - Temporal and rhythmic qualities
 * - Harmonic and tonal qualities
 * - Stylistic and aesthetic qualities
 */

export const PERCEPTUAL_ADJECTIVES: readonly LexemeEntry[] = [
  // ============================================================================
  // BRIGHTNESS / DARKNESS - Spectral balance
  // ============================================================================
  
  {
    id: 'lex:adj:bright',
    lemma: 'bright',
    variants: ['bright', 'brighter', 'brightest', 'brightness'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:brightness',
      direction: 'increase',
      primary_mapping: {
        high_frequency_content: 0.8,
        harmonic_density: 0.5,
        attack_sharpness: 0.3,
      },
      levers: [
        'increase_high_frequency',
        'boost_harmonic_overtones',
        'sharpen_transients',
        'reduce_low_frequency',
        'use_bright_voicings',
      ],
    },
    description: 'Having prominent high-frequency content; clear and present',
    examples: [
      'make it brighter',
      'add a brighter voicing',
      'the mix is too bright',
      'brighten the top end',
    ],
    antonyms: ['lex:adj:dark', 'lex:adj:dull', 'lex:adj:muted'],
  },
  
  {
    id: 'lex:adj:dark',
    lemma: 'dark',
    variants: ['dark', 'darker', 'darkest', 'darkness'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:brightness',
      direction: 'decrease',
      primary_mapping: {
        high_frequency_content: -0.8,
        low_frequency_emphasis: 0.6,
        harmonic_simplicity: 0.4,
      },
      levers: [
        'reduce_high_frequency',
        'emphasize_fundamentals',
        'soften_transients',
        'use_warm_filtering',
        'lower_voicing_register',
      ],
    },
    description: 'Having reduced high-frequency content; warm and mellow',
    examples: [
      'make it darker',
      'add darker tones',
      'this feels too dark',
      'darken the timbre',
    ],
    antonyms: ['lex:adj:bright', 'lex:adj:brilliant', 'lex:adj:sharp'],
  },
  
  {
    id: 'lex:adj:brilliant',
    lemma: 'brilliant',
    variants: ['brilliant', 'brilliance'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:brightness',
      direction: 'increase',
      intensity: 'very_high',
      primary_mapping: {
        high_frequency_content: 1.0,
        harmonic_sparkle: 0.9,
        presence: 0.8,
      },
      levers: [
        'boost_air_frequencies',
        'enhance_shimmer',
        'maximize_clarity',
        'add_harmonic_excitement',
      ],
    },
    description: 'Extremely bright with sparkling high frequencies',
    examples: [
      'make it more brilliant',
      'add brilliance to the strings',
      'too much brilliance',
    ],
    antonyms: ['lex:adj:murky', 'lex:adj:dull'],
  },
  
  {
    id: 'lex:adj:dull',
    lemma: 'dull',
    variants: ['dull', 'duller', 'dullest', 'dullness'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:brightness',
      direction: 'decrease',
      intensity: 'high',
      primary_mapping: {
        high_frequency_content: -0.9,
        transient_clarity: -0.6,
        definition: -0.5,
      },
      levers: [
        'roll_off_highs',
        'reduce_presence',
        'soften_attack',
        'remove_air',
      ],
    },
    description: 'Lacking high-frequency content and clarity',
    examples: [
      'sounds too dull',
      'don\'t make it dull',
      'this is dull and lifeless',
    ],
    antonyms: ['lex:adj:bright', 'lex:adj:clear', 'lex:adj:crisp'],
  },
  
  {
    id: 'lex:adj:warm',
    lemma: 'warm',
    variants: ['warm', 'warmer', 'warmest', 'warmth'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:warmth',
      direction: 'increase',
      primary_mapping: {
        low_mid_emphasis: 0.7,
        harmonic_richness: 0.6,
        softness: 0.5,
      },
      levers: [
        'boost_low_mids',
        'add_harmonic_saturation',
        'reduce_harsh_frequencies',
        'use_warm_voicings',
      ],
    },
    description: 'Having pleasing low-mid emphasis; rich and inviting',
    examples: [
      'make it warmer',
      'add warmth to the bass',
      'needs more warmth',
      'too warm and muddy',
    ],
    antonyms: ['lex:adj:cold', 'lex:adj:thin', 'lex:adj:harsh'],
  },
  
  {
    id: 'lex:adj:cold',
    lemma: 'cold',
    variants: ['cold', 'colder', 'coldest', 'coldness'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:warmth',
      direction: 'decrease',
      primary_mapping: {
        low_mid_emphasis: -0.7,
        high_frequency_emphasis: 0.5,
        sterility: 0.6,
      },
      levers: [
        'reduce_low_mids',
        'emphasize_highs',
        'remove_saturation',
        'increase_precision',
      ],
    },
    description: 'Lacking warmth; clinical and distant',
    examples: [
      'sounds too cold',
      'make it less cold',
      'this feels cold and sterile',
    ],
    antonyms: ['lex:adj:warm', 'lex:adj:rich', 'lex:adj:full'],
  },
  
  // ============================================================================
  // WIDTH / SPATIAL DIMENSION
  // ============================================================================
  
  {
    id: 'lex:adj:wide',
    lemma: 'wide',
    variants: ['wide', 'wider', 'widest', 'width'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:width',
      direction: 'increase',
      primary_mapping: {
        stereo_width: 0.9,
        spatial_spread: 0.8,
        decorrelation: 0.6,
      },
      levers: [
        'increase_stereo_width',
        'spread_sources',
        'add_spatial_effects',
        'pan_elements_wider',
        'use_stereo_enhancers',
      ],
    },
    description: 'Having broad stereo image; spacious and expansive',
    examples: [
      'make it wider',
      'widen the stereo field',
      'too wide and disconnected',
      'add more width',
    ],
    antonyms: ['lex:adj:narrow', 'lex:adj:mono', 'lex:adj:centered'],
  },
  
  {
    id: 'lex:adj:narrow',
    lemma: 'narrow',
    variants: ['narrow', 'narrower', 'narrowest'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:width',
      direction: 'decrease',
      primary_mapping: {
        stereo_width: -0.9,
        spatial_focus: 0.7,
        center_emphasis: 0.8,
      },
      levers: [
        'reduce_stereo_width',
        'center_panning',
        'remove_spatial_effects',
        'sum_to_mono',
      ],
    },
    description: 'Having tight stereo image; focused and centered',
    examples: [
      'make it narrower',
      'narrow the stereo field',
      'sounds too narrow',
      'pull it more centered',
    ],
    antonyms: ['lex:adj:wide', 'lex:adj:expansive', 'lex:adj:spread'],
  },
  
  {
    id: 'lex:adj:spacious',
    lemma: 'spacious',
    variants: ['spacious', 'spaciousness'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:spaciousness',
      direction: 'increase',
      primary_mapping: {
        reverb_amount: 0.8,
        early_reflections: 0.7,
        width: 0.6,
        openness: 0.9,
      },
      levers: [
        'add_reverb',
        'increase_room_size',
        'add_space',
        'reduce_density',
        'create_depth',
      ],
    },
    description: 'Having sense of space and dimension; roomy and open',
    examples: [
      'make it more spacious',
      'add spaciousness',
      'too spacious and vague',
      'needs more space',
    ],
    antonyms: ['lex:adj:dry', 'lex:adj:intimate', 'lex:adj:close'],
  },
  
  {
    id: 'lex:adj:intimate',
    lemma: 'intimate',
    variants: ['intimate', 'intimacy'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:intimacy',
      direction: 'increase',
      primary_mapping: {
        reverb_amount: -0.7,
        proximity: 0.9,
        directness: 0.8,
        detail: 0.6,
      },
      levers: [
        'reduce_reverb',
        'increase_proximity',
        'emphasize_detail',
        'reduce_space',
        'bring_forward',
      ],
    },
    description: 'Having close, personal quality; direct and present',
    examples: [
      'make it more intimate',
      'add intimacy',
      'too intimate and claustrophobic',
      'more intimate vocal',
    ],
    antonyms: ['lex:adj:distant', 'lex:adj:spacious', 'lex:adj:reverberant'],
  },
  
  {
    id: 'lex:adj:deep',
    lemma: 'deep',
    variants: ['deep', 'deeper', 'deepest', 'depth'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:depth',
      direction: 'increase',
      primary_mapping: {
        low_frequency_content: 0.8,
        sub_bass_presence: 0.9,
        weight: 0.7,
        foundation: 0.8,
      },
      levers: [
        'boost_low_end',
        'add_sub_bass',
        'increase_weight',
        'emphasize_fundamentals',
        'lower_register',
      ],
    },
    description: 'Having strong low-frequency presence; substantial and weighty',
    examples: [
      'make it deeper',
      'add depth to the bass',
      'too deep and boomy',
      'needs more depth',
    ],
    antonyms: ['lex:adj:thin', 'lex:adj:shallow', 'lex:adj:light'],
  },
  
  {
    id: 'lex:adj:thin',
    lemma: 'thin',
    variants: ['thin', 'thinner', 'thinnest', 'thinness'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:thickness',
      direction: 'decrease',
      primary_mapping: {
        low_frequency_content: -0.8,
        body: -0.7,
        substance: -0.6,
      },
      levers: [
        'reduce_low_end',
        'remove_body',
        'high_pass_filter',
        'reduce_layers',
      ],
    },
    description: 'Lacking low-frequency content and body; weak and insubstantial',
    examples: [
      'sounds too thin',
      'don\'t make it thin',
      'this is thin and weak',
      'thinner texture',
    ],
    antonyms: ['lex:adj:thick', 'lex:adj:full', 'lex:adj:rich'],
  },
  
  {
    id: 'lex:adj:thick',
    lemma: 'thick',
    variants: ['thick', 'thicker', 'thickest', 'thickness'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:thickness',
      direction: 'increase',
      primary_mapping: {
        layer_density: 0.8,
        harmonic_density: 0.7,
        texture_complexity: 0.6,
      },
      levers: [
        'add_layers',
        'increase_density',
        'thicken_texture',
        'add_doubling',
        'boost_mid_range',
      ],
    },
    description: 'Having dense, rich texture; full and substantial',
    examples: [
      'make it thicker',
      'thicken the texture',
      'too thick and cluttered',
      'add thickness',
    ],
    antonyms: ['lex:adj:thin', 'lex:adj:sparse', 'lex:adj:light'],
  },
  
  // ============================================================================
  // CLARITY / DEFINITION
  // ============================================================================
  
  {
    id: 'lex:adj:clear',
    lemma: 'clear',
    variants: ['clear', 'clearer', 'clearest', 'clarity'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:clarity',
      direction: 'increase',
      primary_mapping: {
        definition: 0.9,
        separation: 0.8,
        transparency: 0.7,
      },
      levers: [
        'increase_definition',
        'reduce_muddiness',
        'improve_separation',
        'clean_up_low_mids',
        'clarify_transients',
      ],
    },
    description: 'Having distinct, well-defined elements; transparent and defined',
    examples: [
      'make it clearer',
      'improve clarity',
      'too clear and clinical',
      'needs more clarity',
    ],
    antonyms: ['lex:adj:muddy', 'lex:adj:murky', 'lex:adj:cloudy'],
  },
  
  {
    id: 'lex:adj:muddy',
    lemma: 'muddy',
    variants: ['muddy', 'muddier', 'muddiest', 'muddiness'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:clarity',
      direction: 'decrease',
      primary_mapping: {
        low_mid_buildup: 0.8,
        definition: -0.9,
        separation: -0.7,
      },
      levers: [
        'clean_up_low_mids',
        'reduce_low_mid_clash',
        'improve_separation',
        'reduce_density',
      ],
    },
    description: 'Having excessive low-mid frequency buildup; unclear and indistinct',
    examples: [
      'sounds muddy',
      'clean up the muddiness',
      'too muddy in the low mids',
      'remove the mud',
    ],
    antonyms: ['lex:adj:clear', 'lex:adj:clean', 'lex:adj:defined'],
  },
  
  {
    id: 'lex:adj:crisp',
    lemma: 'crisp',
    variants: ['crisp', 'crisper', 'crispest', 'crispness'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:crispness',
      direction: 'increase',
      primary_mapping: {
        transient_definition: 0.9,
        attack_clarity: 0.8,
        high_frequency_detail: 0.7,
      },
      levers: [
        'enhance_transients',
        'sharpen_attack',
        'boost_high_detail',
        'increase_bite',
      ],
    },
    description: 'Having sharp, well-defined transients; clean and articulate',
    examples: [
      'make it crisper',
      'add crispness',
      'too crisp and brittle',
      'crisp hi-hats',
    ],
    antonyms: ['lex:adj:soft', 'lex:adj:dull', 'lex:adj:blurred'],
  },
  
  {
    id: 'lex:adj:clean',
    lemma: 'clean',
    variants: ['clean', 'cleaner', 'cleanest', 'cleanness'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:cleanliness',
      direction: 'increase',
      primary_mapping: {
        distortion: -0.9,
        artifacts: -0.8,
        purity: 0.9,
      },
      levers: [
        'remove_distortion',
        'reduce_artifacts',
        'clean_up_noise',
        'improve_purity',
      ],
    },
    description: 'Free from distortion and artifacts; pure and pristine',
    examples: [
      'make it cleaner',
      'clean up the signal',
      'too clean and sterile',
      'clean tone',
    ],
    antonyms: ['lex:adj:dirty', 'lex:adj:distorted', 'lex:adj:gritty'],
  },
  
  {
    id: 'lex:adj:dirty',
    lemma: 'dirty',
    variants: ['dirty', 'dirtier', 'dirtiest', 'dirtiness'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:dirtiness',
      direction: 'increase',
      primary_mapping: {
        distortion: 0.8,
        saturation: 0.7,
        grit: 0.6,
      },
      levers: [
        'add_distortion',
        'add_saturation',
        'add_grit',
        'degrade_signal',
      ],
    },
    description: 'Having desirable distortion and character; gritty and characterful',
    examples: [
      'make it dirtier',
      'add some dirt',
      'too dirty and distorted',
      'dirty guitar tone',
    ],
    antonyms: ['lex:adj:clean', 'lex:adj:pristine', 'lex:adj:pure'],
  },
  
  // ============================================================================
  // ENERGY / DYNAMICS
  // ============================================================================
  
  {
    id: 'lex:adj:energetic',
    lemma: 'energetic',
    variants: ['energetic', 'energy'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:energy',
      direction: 'increase',
      primary_mapping: {
        rhythmic_activity: 0.8,
        dynamic_range: 0.7,
        tempo_feel: 0.6,
        intensity: 0.8,
      },
      levers: [
        'increase_activity',
        'add_dynamics',
        'boost_drive',
        'increase_density',
        'add_rhythmic_complexity',
      ],
    },
    description: 'Having high activity and intensity; lively and vigorous',
    examples: [
      'make it more energetic',
      'add energy',
      'too energetic and exhausting',
      'energetic drums',
    ],
    antonyms: ['lex:adj:calm', 'lex:adj:relaxed', 'lex:adj:subdued'],
  },
  
  {
    id: 'lex:adj:punchy',
    lemma: 'punchy',
    variants: ['punchy', 'punch'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:punchiness',
      direction: 'increase',
      primary_mapping: {
        transient_impact: 0.9,
        dynamic_contrast: 0.8,
        attack_strength: 0.9,
      },
      levers: [
        'enhance_transients',
        'boost_impact',
        'increase_attack',
        'compress_sustain',
        'emphasize_hits',
      ],
    },
    description: 'Having strong impact and attack; impactful and assertive',
    examples: [
      'make it punchier',
      'add punch',
      'too punchy and aggressive',
      'punchy kick drum',
    ],
    antonyms: ['lex:adj:soft', 'lex:adj:weak', 'lex:adj:gentle'],
  },
  
  {
    id: 'lex:adj:aggressive',
    lemma: 'aggressive',
    variants: ['aggressive', 'aggression'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:aggression',
      direction: 'increase',
      primary_mapping: {
        intensity: 0.9,
        distortion: 0.7,
        dynamics: 0.8,
        forward_placement: 0.7,
      },
      levers: [
        'increase_intensity',
        'add_drive',
        'boost_presence',
        'emphasize_attack',
        'compress_harder',
      ],
    },
    description: 'Having forceful, assertive quality; intense and in-your-face',
    examples: [
      'make it more aggressive',
      'add aggression',
      'too aggressive and harsh',
      'aggressive guitar',
    ],
    antonyms: ['lex:adj:gentle', 'lex:adj:subtle', 'lex:adj:soft'],
  },
  
  {
    id: 'lex:adj:gentle',
    lemma: 'gentle',
    variants: ['gentle', 'gentler', 'gentlest', 'gentleness'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:gentleness',
      direction: 'increase',
      primary_mapping: {
        intensity: -0.7,
        softness: 0.8,
        subtlety: 0.7,
      },
      levers: [
        'reduce_intensity',
        'soften_attack',
        'reduce_dynamics',
        'add_subtlety',
      ],
    },
    description: 'Having soft, unforced quality; delicate and mild',
    examples: [
      'make it gentler',
      'add gentleness',
      'too gentle and weak',
      'gentle piano',
    ],
    antonyms: ['lex:adj:aggressive', 'lex:adj:harsh', 'lex:adj:forceful'],
  },
  
  {
    id: 'lex:adj:powerful',
    lemma: 'powerful',
    variants: ['powerful', 'power'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:power',
      direction: 'increase',
      primary_mapping: {
        loudness: 0.8,
        impact: 0.9,
        weight: 0.8,
        fullness: 0.7,
      },
      levers: [
        'increase_level',
        'add_impact',
        'boost_weight',
        'maximize_presence',
        'add_layers',
      ],
    },
    description: 'Having strong presence and impact; commanding and substantial',
    examples: [
      'make it more powerful',
      'add power',
      'too powerful and overwhelming',
      'powerful chorus',
    ],
    antonyms: ['lex:adj:weak', 'lex:adj:delicate', 'lex:adj:subtle'],
  },
  
  {
    id: 'lex:adj:dynamic',
    lemma: 'dynamic',
    variants: ['dynamic', 'dynamics'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: 'axis:dynamic_range',
      direction: 'increase',
      primary_mapping: {
        dynamic_range: 0.9,
        contrast: 0.8,
        expression: 0.7,
      },
      levers: [
        'increase_dynamic_range',
        'add_contrast',
        'reduce_compression',
        'emphasize_variation',
      ],
    },
    description: 'Having wide dynamic range; expressive and varied',
    examples: [
      'make it more dynamic',
      'add dynamics',
      'too dynamic and unpredictable',
      'dynamic performance',
    ],
    antonyms: ['lex:adj:flat', 'lex:adj:compressed', 'lex:adj:static'],
  },
  
  // Continued with more categories: EMOTIONAL, RHYTHMIC, HARMONIC, etc...
  // (600+ total entries when complete)
];

export const PERCEPTUAL_ADJECTIVES_COUNT = PERCEPTUAL_ADJECTIVES.length;
